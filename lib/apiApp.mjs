import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function resolveBaseDir() {
  try {
    if (typeof __dirname === 'string' && __dirname) {
      return __dirname;
    }
  } catch {
    // ignore in ESM
  }
  try {
    if (typeof import.meta !== 'undefined' && typeof import.meta.url === 'string' && import.meta.url) {
      return path.dirname(fileURLToPath(import.meta.url));
    }
  } catch {
    // ignore in CJS
  }
  return process.cwd();
}

const BASE_DIR = resolveBaseDir();

let _genaiModulePromise = null;
function getGenAIModule() {
  if (!_genaiModulePromise) {
    _genaiModulePromise = import('@google/genai');
  }
  return _genaiModulePromise;
}

export const app = express();

app.use(express.json({ limit: '25mb' }));

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'crickify-data')
  : path.resolve(BASE_DIR, '..', 'data');
const STORE_PATH = path.join(DATA_DIR, 'pitchiq-store.json');

let firebaseProjectId =
  process.env.FIREBASE_PROJECT_ID?.trim() ||
  process.env.VITE_FIREBASE_PROJECT_ID?.trim() ||
  '';

if (!firebaseProjectId) {
  try {
    const candidateCfgPaths = [
      path.resolve(BASE_DIR, 'firebase-applet-config.json'),
      path.resolve(BASE_DIR, '..', 'firebase-applet-config.json'),
      path.resolve(process.cwd(), 'firebase-applet-config.json'),
    ];
    const cfgPath = candidateCfgPaths.find((p) => fs.existsSync(p));
    if (cfgPath) {
      const parsedCfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
      if (parsedCfg?.projectId && parsedCfg.projectId !== 'remixed-project-id') {
        firebaseProjectId = parsedCfg.projectId;
      }
    }
  } catch {
    firebaseProjectId = '';
  }
}

let cachedCerts = null;
let cachedCertsExpiresAt = 0;

async function fetchFirebasePublicCerts() {
  const now = Date.now();
  if (cachedCerts && now < cachedCertsExpiresAt) {
    return cachedCerts;
  }
  const resp = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  if (!resp.ok) {
    throw new Error(`Failed to fetch Firebase public certificates (${resp.status})`);
  }
  const certs = await resp.json();
  const cacheControl = resp.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSec = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  cachedCerts = certs;
  cachedCertsExpiresAt = now + Math.max(60, maxAgeSec) * 1000;
  return certs;
}

function decodeBase64UrlJson(segment) {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
}

async function verifyFirebaseIdToken(token, projectId) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed Firebase ID token');
  }
  const [headerB64, payloadB64, sigB64] = parts;
  const header = decodeBase64UrlJson(headerB64);
  const payload = decodeBase64UrlJson(payloadB64);

  if (header?.alg !== 'RS256' || typeof header?.kid !== 'string' || !header.kid) {
    throw new Error('Unsupported Firebase token header');
  }

  let certs = await fetchFirebasePublicCerts();
  let certPem = certs?.[header.kid];
  if (!certPem) {
    cachedCertsExpiresAt = 0;
    certs = await fetchFirebasePublicCerts();
    certPem = certs?.[header.kid];
    if (!certPem) {
      throw new Error('Unknown Firebase signing key');
    }
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();
  if (!verifier.verify(certPem, sigB64, 'base64url')) {
    throw new Error('Invalid Firebase token signature');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
    throw new Error('Firebase token expired');
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) {
    throw new Error('Firebase token issued in the future');
  }
  if (typeof payload.auth_time === 'number' && payload.auth_time > nowSec + 300) {
    throw new Error('Firebase token auth_time in the future');
  }
  if (payload.aud !== projectId) {
    throw new Error('Firebase token audience mismatch');
  }
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error('Firebase token issuer mismatch');
  }
  if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 128) {
    throw new Error('Firebase token missing subject');
  }

  return {
    ...payload,
    uid: payload.sub,
  };
}

async function verifyBearerTokenIfPresent(req, { allowUnconfiguredServer = false } = {}) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    throw new Error('Empty Bearer token');
  }
  if (!firebaseProjectId) {
    if (allowUnconfiguredServer) {
      return null;
    }
    throw new Error('Firebase project is not configured on the server.');
  }
  return await verifyFirebaseIdToken(token, firebaseProjectId);
}

async function attachOptionalFirebaseUser(req, res, next) {
  try {
    req.firebaseUser = await verifyBearerTokenIfPresent(req, { allowUnconfiguredServer: true });
    return next();
  } catch {
    return res.status(401).json({
      error: 'Invalid or expired Firebase authentication token. Please sign in again.',
      code: 'UNAUTHORIZED',
      retryable: false,
    });
  }
}

async function requireFirebaseAuth(req, res, next) {
  try {
    const decoded = await verifyBearerTokenIfPresent(req);
    if (!decoded) {
      return res.status(401).json({
        error: 'Authentication required. Please sign in with Google to access or save personal data.',
        code: 'UNAUTHORIZED',
        retryable: false,
      });
    }
    req.firebaseUser = decoded;
    return next();
  } catch {
    return res.status(401).json({
      error: 'Invalid or expired Firebase authentication token. Please sign in again.',
      code: 'UNAUTHORIZED',
      retryable: false,
    });
  }
}

const DEPRECATED_MODELS = new Set([
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
  'gemini-2.0-flash',
  'gemini-2.0-pro',
  'gemini-2.0-flash-thinking',
]);

const DEFAULT_PRIMARY_MODEL = 'gemini-3.1-flash-lite';
const DEFAULT_FALLBACK_MODEL = 'gemini-4-hydrogen';
const PRIMARY_MAX_ATTEMPTS = 1;
const FALLBACK_MAX_ATTEMPTS = 2;
const BASE_BACKOFF_MS = 550;
const TEXT_PRIMARY_TIMEOUT_MS = 10000;
const TEXT_FALLBACK_TIMEOUT_MS = 16000;
const MULTIMODAL_PRIMARY_TIMEOUT_MS = 16000;
const MULTIMODAL_FALLBACK_TIMEOUT_MS = 22000;
const TOTAL_GENERATION_BUDGET_MS = 50000;
const TRANSIENT_COOLDOWN_MS = 5 * 60 * 1000;
const HARD_UNAVAILABLE_COOLDOWN_MS = 15 * 60 * 1000;

const modelCooldownUntil = new Map();

export function getConfiguredModels() {
  const rawPrimary = process.env.GEMINI_PRIMARY_MODEL?.trim() || DEFAULT_PRIMARY_MODEL;
  const rawFallback = process.env.GEMINI_FALLBACK_MODEL?.trim() || DEFAULT_FALLBACK_MODEL;
  const extraFallbacks = (process.env.GEMINI_FALLBACK_MODELS || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);

  const candidates = [
    rawPrimary,
    rawFallback,
    ...extraFallbacks,
    DEFAULT_PRIMARY_MODEL,
    DEFAULT_FALLBACK_MODEL,
  ].filter((m) => m && !DEPRECATED_MODELS.has(m));
  return Array.from(new Set(candidates.length > 0 ? candidates : [DEFAULT_PRIMARY_MODEL, DEFAULT_FALLBACK_MODEL]));
}

function getEffectiveModels() {
  const configured = getConfiguredModels();
  const now = Date.now();
  const healthy = [];
  const coolingDown = [];

  for (const model of configured) {
    const until = modelCooldownUntil.get(model);
    if (until && until > now) {
      coolingDown.push({ model, until });
    } else {
      if (until) modelCooldownUntil.delete(model);
      healthy.push(model);
    }
  }

  coolingDown.sort((a, b) => a.until - b.until);
  return [...healthy, ...coolingDown.map((entry) => entry.model)];
}

function markModelCooldown(model, code) {
  const durationMs =
    code === 'QUOTA_EXHAUSTED' || code === 'UNSUPPORTED_MODEL'
      ? HARD_UNAVAILABLE_COOLDOWN_MS
      : TRANSIENT_COOLDOWN_MS;
  modelCooldownUntil.set(model, Date.now() + durationMs);
}

function getUserStorePath(uid) {
  const safeUid = uid.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return path.join(DATA_DIR, 'users', `${safeUid}.json`);
}

function readPersistedState(uid) {
  const targetPath = uid ? getUserStorePath(uid) : STORE_PATH;
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(targetPath)) {
    return { state: null };
  }
  try {
    const raw = fs.readFileSync(targetPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { state: null };
  }
}

function writePersistedState(state, uid) {
  const targetPath = uid ? getUserStorePath(uid) : STORE_PATH;
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(targetPath, JSON.stringify({ state }, null, 2), 'utf-8');
}

class GeminiClassifiedError extends Error {
  constructor(status, code, retryable, message) {
    super(message);
    this.name = 'GeminiClassifiedError';
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

async function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new GeminiClassifiedError(
      400,
      'MISSING_API_KEY',
      false,
      'GEMINI_API_KEY is not configured. Please add your key in Settings > Secrets or Vercel Environment Variables.'
    );
  }
  const genai = await getGenAIModule();
  return {
    genai,
    ai: new genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    }),
  };
}

function extractNumericStatus(err) {
  if (typeof err === 'object' && err !== null) {
    if (typeof err.status === 'number') return err.status;
    if (typeof err.code === 'number') return err.code;
    if (typeof err.cause?.status === 'number') return err.cause.status;
  }
  const msg = err instanceof Error ? err.message : String(err);
  const jsonCodeMatch = msg.match(/"code"\s*:\s*(\d{3})/);
  if (jsonCodeMatch) return Number(jsonCodeMatch[1]);
  const prefixMatch = msg.match(/\b(400|401|403|404|429|500|502|503|504)\b/);
  if (prefixMatch) return Number(prefixMatch[1]);
  return null;
}

function classifyGeminiError(err) {
  if (err instanceof GeminiClassifiedError) {
    return err;
  }

  const raw = err instanceof Error ? err.message : String(err);
  const upper = raw.toUpperCase();
  const status = extractNumericStatus(err);

  if (raw.includes('GEMINI_API_KEY is not configured')) {
    return new GeminiClassifiedError(400, 'MISSING_API_KEY', false, raw);
  }

  if (
    status === 401 ||
    status === 403 ||
    upper.includes('PERMISSION_DENIED') ||
    upper.includes('API_KEY_INVALID') ||
    upper.includes('INVALID_API_KEY') ||
    upper.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')
  ) {
    return new GeminiClassifiedError(
      403,
      'INVALID_API_KEY',
      false,
      'Gemini API authentication failed. Please verify your GEMINI_API_KEY in Settings > Secrets or Vercel Environment Variables.'
    );
  }

  if (status === 404 || upper.includes('NOT_FOUND') || upper.includes('IS NOT FOUND FOR API VERSION')) {
    return new GeminiClassifiedError(
      404,
      'UNSUPPORTED_MODEL',
      true,
      'The configured AI model is unavailable or unsupported for this request.'
    );
  }

  if (status === 429 || upper.includes('RESOURCE_EXHAUSTED')) {
    const isHardQuota =
      upper.includes('QUOTA') &&
      (upper.includes('EXCEEDED YOUR CURRENT QUOTA') || upper.includes('BILLING') || upper.includes('DAILY'));
    if (isHardQuota) {
      return new GeminiClassifiedError(
        429,
        'QUOTA_EXHAUSTED',
        false,
        'AI API quota is exhausted for this key. Please check your Gemini plan or quota.'
      );
    }
    return new GeminiClassifiedError(
      429,
      'RATE_LIMITED',
      true,
      'AI rate limit reached briefly due to burst traffic. Please retry in a moment.'
    );
  }

  if (
    status === 503 ||
    upper.includes('UNAVAILABLE') ||
    upper.includes('HIGH DEMAND') ||
    upper.includes('OVERLOADED')
  ) {
    return new GeminiClassifiedError(
      503,
      'MODEL_UNAVAILABLE',
      true,
      'The AI service is experiencing temporary high demand across available models. Please tap Retry in a moment.'
    );
  }

  if (
    status === 500 ||
    status === 502 ||
    status === 504 ||
    upper.includes('ABORTERROR') ||
    upper.includes('ABORTED') ||
    upper.includes('TIMEOUT') ||
    upper.includes('ETIMEDOUT') ||
    upper.includes('ECONNRESET') ||
    upper.includes('ENOTFOUND') ||
    upper.includes('EAI_AGAIN') ||
    upper.includes('FETCH FAILED') ||
    upper.includes('NETWORK')
  ) {
    return new GeminiClassifiedError(
      status && status >= 500 ? status : 504,
      'TIMEOUT_OR_NETWORK',
      true,
      'The AI coaching request timed out or encountered a temporary network issue. Please tap Retry.'
    );
  }

  if (status === 400 || upper.includes('INVALID_ARGUMENT')) {
    return new GeminiClassifiedError(
      400,
      'BAD_REQUEST',
      false,
      'The request payload could not be processed by the AI model. Please adjust your inputs and try again.'
    );
  }

  return new GeminiClassifiedError(
    500,
    'INTERNAL_ERROR',
    false,
    'Unexpected error communicating with the AI service. Please try again.'
  );
}

function safeParseJsonResponse(text, requiredKeys = [], nonEmptyStringKeys = []) {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    throw new GeminiClassifiedError(502, 'MALFORMED_RESPONSE', true, 'AI model returned an empty response.');
  }

  const cleaned = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch {
        throw new GeminiClassifiedError(502, 'MALFORMED_RESPONSE', true, 'AI model returned malformed JSON.');
      }
    } else {
      throw new GeminiClassifiedError(502, 'MALFORMED_RESPONSE', true, 'AI model returned malformed JSON.');
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new GeminiClassifiedError(502, 'MALFORMED_RESPONSE', true, 'AI response did not match the expected structure.');
  }

  for (const key of requiredKeys) {
    if (!(key in parsed)) {
      throw new GeminiClassifiedError(502, 'MALFORMED_RESPONSE', true, `AI response missed required field "${key}".`);
    }
  }
  for (const key of nonEmptyStringKeys) {
    const val = parsed[key];
    if (typeof val !== 'string' || !val.trim()) {
      throw new GeminiClassifiedError(502, 'MALFORMED_RESPONSE', true, `AI response returned empty "${key}".`);
    }
  }

  return parsed;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildConfigForModel(model, baseConfig, signal, ThinkingLevel) {
  const nextConfig = {
    ...baseConfig,
    abortSignal: signal,
  };

  if (model.startsWith('gemini-4-')) {
    nextConfig.thinkingConfig = {
      thinkingLevel: ThinkingLevel?.LOW || 'LOW',
    };
  } else if (model.startsWith('gemini-3.1-flash-lite')) {
    nextConfig.thinkingConfig = {
      thinkingLevel: ThinkingLevel?.MINIMAL || 'MINIMAL',
    };
  } else if (model.startsWith('gemini-3')) {
    nextConfig.thinkingConfig = {
      thinkingLevel: ThinkingLevel?.LOW || 'LOW',
    };
  } else {
    delete nextConfig.thinkingConfig;
  }

  return nextConfig;
}

async function generateJsonWithGemini({
  contents,
  buildConfig,
  requiredKeys = [],
  nonEmptyStringKeys = [],
  primaryTimeoutMs = TEXT_PRIMARY_TIMEOUT_MS,
  fallbackTimeoutMs = TEXT_FALLBACK_TIMEOUT_MS,
}) {
  const { ai, genai } = await getGeminiClient();
  const baseConfig = buildConfig(genai.Type);
  const models = getEffectiveModels();
  const requestStartedAt = Date.now();
  let lastError = null;

  for (let mIdx = 0; mIdx < models.length; mIdx++) {
    const remainingBudgetMs = TOTAL_GENERATION_BUDGET_MS - (Date.now() - requestStartedAt);
    if (remainingBudgetMs < 3500) {
      break;
    }

    const model = models[mIdx];
    const hasNextModel = mIdx < models.length - 1;
    const baseTimeoutMs = hasNextModel ? primaryTimeoutMs : fallbackTimeoutMs;
    const attemptTimeoutMs = Math.max(3500, Math.min(baseTimeoutMs, remainingBudgetMs - 500));
    const maxAttemptsForModel = hasNextModel ? PRIMARY_MAX_ATTEMPTS : FALLBACK_MAX_ATTEMPTS;

    for (let attempt = 0; attempt < maxAttemptsForModel; attempt++) {
      const controller = new AbortController();
      let timeoutHandle;
      const startedAt = Date.now();

      try {
        const timeoutPromise = new Promise((_, reject) => {
          timeoutHandle = setTimeout(() => {
            controller.abort();
            reject(
              new GeminiClassifiedError(
                504,
                'TIMEOUT_OR_NETWORK',
                true,
                'The AI coaching request timed out or encountered a temporary network issue. Please tap Retry.'
              )
            );
          }, attemptTimeoutMs);
        });

        const response = await Promise.race([
          ai.models.generateContent({
            model,
            contents,
            config: buildConfigForModel(model, baseConfig, controller.signal, genai.ThinkingLevel),
          }),
          timeoutPromise,
        ]);

        modelCooldownUntil.delete(model);
        const data = safeParseJsonResponse(response.text, requiredKeys, nonEmptyStringKeys);
        console.log(`[Gemini] model=${model} succeeded in ${Date.now() - startedAt}ms`);
        return { data, modelUsed: model };
      } catch (err) {
        const elapsedMs = Date.now() - startedAt;
        const timedOut = controller.signal.aborted;
        const classified = classifyGeminiError(err);
        lastError = classified;

        const safeSnippet = (err instanceof Error ? err.message : String(err))
          .replace(/AIza[0-9A-Za-z_-]+/g, '[REDACTED]')
          .slice(0, 180);

        if (classified.code === 'MISSING_API_KEY' || classified.code === 'INVALID_API_KEY') {
          console.error(
            `[Gemini] model=${model} non-retryable error in ${elapsedMs}ms: code=${classified.code} status=${classified.status} detail=${safeSnippet}`
          );
          throw classified;
        }

        if (classified.code === 'BAD_REQUEST' && !hasNextModel) {
          console.error(
            `[Gemini] model=${model} bad request in ${elapsedMs}ms: status=${classified.status} detail=${safeSnippet}`
          );
          throw classified;
        }

        const hasMoreAttemptsOnModel = attempt < maxAttemptsForModel - 1;

        if (hasNextModel || hasMoreAttemptsOnModel) {
          console.log(
            `[Gemini] model=${model} attempt=${attempt + 1}/${maxAttemptsForModel} switching/retrying after ${elapsedMs}ms (code=${classified.code}, timedOut=${timedOut})`
          );
        } else {
          console.error(
            `[Gemini] model=${model} final attempt failed in ${elapsedMs}ms: code=${classified.code} status=${classified.status} timedOut=${timedOut} detail=${safeSnippet}`
          );
        }

        if (
          models.length > 1 &&
          (timedOut ||
            classified.code === 'TIMEOUT_OR_NETWORK' ||
            classified.code === 'MODEL_UNAVAILABLE' ||
            classified.code === 'RATE_LIMITED' ||
            classified.code === 'QUOTA_EXHAUSTED' ||
            classified.code === 'UNSUPPORTED_MODEL' ||
            classified.code === 'INTERNAL_ERROR')
        ) {
          markModelCooldown(model, classified.code);
        }

        if (hasNextModel) {
          break;
        }

        if (classified.retryable && hasMoreAttemptsOnModel) {
          const jitter = Math.floor(Math.random() * 250);
          const delayMs = BASE_BACKOFF_MS * Math.pow(2, attempt) + jitter;
          await sleep(delayMs);
          continue;
        }

        break;
      } finally {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
      }
    }
  }

  throw (
    lastError ||
    new GeminiClassifiedError(
      503,
      'MODEL_UNAVAILABLE',
      true,
      'All configured AI models are temporarily unavailable. Please tap Retry.'
    )
  );
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'CRICKIFY API',
    runtime: process.env.VERCEL ? 'vercel' : 'node',
    authProvider: 'firebase',
    firebaseConfigured: Boolean(firebaseProjectId),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    models: getConfiguredModels(),
    activeOrder: getEffectiveModels(),
  });
});

app.get('/api/state', requireFirebaseAuth, (req, res) => {
  const data = readPersistedState(req.firebaseUser.uid);
  res.json(data);
});

app.post('/api/state', requireFirebaseAuth, (req, res) => {
  try {
    if (!req.body || !('state' in req.body)) {
      return res.status(400).json({ error: 'Missing state payload.' });
    }
    writePersistedState(req.body.state, req.firebaseUser.uid);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to save state' });
  }
});

app.delete('/api/state/reports/:id', requireFirebaseAuth, (req, res) => {
  try {
    const uid = req.firebaseUser.uid;
    const data = readPersistedState(uid);
    if (data.state && Array.isArray(data.state.reports)) {
      data.state.reports = data.state.reports.filter((r) => r.id !== req.params.id);
      if (Array.isArray(data.state.savedVideos)) {
        data.state.savedVideos = data.state.savedVideos.filter((v) => v.reportId !== req.params.id);
      }
      writePersistedState(data.state, uid);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete report' });
  }
});

// 1. Conversational AI Cricket Coach
app.post('/api/coach/chat', attachOptionalFirebaseUser, async (req, res) => {
  try {
    const {
      message,
      history = [],
      profile,
      language = 'English',
      linkedReport,
      availableLessons = [],
      availableExercises = [],
      availableTutorials = [],
    } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Please enter a cricket coaching question.', code: 'BAD_REQUEST' });
    }

    const languageDirective =
      language === 'Tamil'
        ? 'Respond clearly in Tamil (தமிழ் script) while keeping standard international cricket technical terms (like Cover Drive, Yorker, Seam, Backlift, Front-foot) in English alongside simple Tamil explanations.'
        : language === 'Hindi'
          ? 'Respond clearly in Hindi (देवनागरी script) while keeping standard international cricket technical terms (like Cover Drive, Yorker, Seam, Backlift, Front-foot) in English alongside simple Hindi explanations.'
          : 'Respond in clear, encouraging, practical English suitable for a cricket coach.';

    const reportContext = linkedReport
      ? `ATTACHED VIDEO ANALYSIS REPORT (observed from real frames and MediaPipe pose landmarks):
- Skill & Technique: ${linkedReport.skillCategory || 'Cricket'} - ${linkedReport.technique || 'General'}
- Summary: ${linkedReport.summary || ''}
- Observed Strengths: ${(Array.isArray(linkedReport.observedStrengths) ? linkedReport.observedStrengths : []).join('; ')}
- Areas to Improve: ${(Array.isArray(linkedReport.areasToImprove) ? linkedReport.areasToImprove : []).join('; ')}
- Specific Observations: ${(Array.isArray(linkedReport.observations) ? linkedReport.observations : [])
          .map(
            (o) =>
              `[${o?.timestampSec ?? 0}s, ${o?.confidence || 'Medium'} confidence] ${o?.title || 'Observation'}: ${o?.evidence || ''}`
          )
          .join(' | ')}`
      : 'NO VIDEO PROVIDED: Do NOT pretend to have seen the player perform. Explicitly base advice on general cricket biomechanics, ask 1-2 clarifying questions when helpful, and invite them to upload or record a practice clip in Practice & Analysis if they want visual feedback.';

    const goalsList = Array.isArray(profile?.goals) ? profile.goals.join(', ') : '';

    const systemInstruction = `You are the CRICKIFY AI Cricket Coach — an experienced, safety-conscious cricket educator and biomechanics coach covering batting, bowling, fielding, wicketkeeping, cricket fitness, and match tactics.
${languageDirective}

PLAYER PROFILE:
- Name: ${profile?.name || 'Player'}
- Age Group: ${profile?.ageGroup || '19-25'}
- Skill Level: ${profile?.skillLevel || 'Intermediate'}
- Role: ${profile?.role || 'Batter'}
- Batting Hand: ${profile?.battingHand || 'Right-handed'}
- Bowling Style: ${profile?.bowlingStyle || 'Medium Pace'}
- Ball & Format: ${profile?.ballType || 'Leather Ball'}, ${profile?.environment || 'Regular Cricket'}
- Goals: ${goalsList || 'General improvement'}

${reportContext}

AVAILABLE CRICKIFY CURRICULUM IDs (only cite IDs from these lists when recommending):
- Lessons: ${JSON.stringify(availableLessons)}
- Exercises: ${JSON.stringify(availableExercises)}
- Tutorials: ${JSON.stringify(availableTutorials)}

STRICT COACHING RULES:
1. Adapt explanation depth to the player's Skill Level (${profile?.skillLevel || 'Intermediate'}).
2. Default to a concise, clear, scannable reply: open with 1 short direct insight, give 2-3 focused actionable recommendations, name 1 practical drill, and ask 1 helpful follow-up question. Only give long multi-section breakdowns when the user explicitly asks for deep detail.
3. Remember conversation context from the recent history below and build upon previous turns naturally.
4. Safety: Never diagnose injuries or prescribe medical rehab. Include a brief reminder to stop if experiencing sharp pain, dizziness, or unusual discomfort, and respect fast-bowling workload limits.
5. Never fabricate video observations, ball speeds, or fake stats, and never pretend to have analysed a video when none was attached.`;

    const safeHistory = Array.isArray(history)
      ? history
          .filter((m) => Boolean(m && typeof m.content === 'string' && m.content.trim()))
          .slice(-8)
      : [];

    const formattedHistory = safeHistory
      .map((m) => `${m.role === 'user' ? 'Player' : 'Coach'}: ${m.content.trim()}`)
      .join('\n');

    const prompt = `${formattedHistory ? `Recent conversation:\n${formattedHistory}\n\n` : ''}Player's current message: ${message.trim()}`;

    const validExerciseIds = new Set(
      Array.isArray(availableExercises) ? availableExercises.map((e) => e?.id).filter(Boolean) : []
    );
    const validLessonIds = new Set(
      Array.isArray(availableLessons) ? availableLessons.map((l) => l?.id).filter(Boolean) : []
    );
    const validTutorialIds = new Set(
      Array.isArray(availableTutorials) ? availableTutorials.map((t) => t?.id).filter(Boolean) : []
    );

    const { data, modelUsed } = await generateJsonWithGemini({
      contents: prompt,
      requiredKeys: ['reply'],
      nonEmptyStringKeys: ['reply'],
      primaryTimeoutMs: TEXT_PRIMARY_TIMEOUT_MS,
      fallbackTimeoutMs: TEXT_FALLBACK_TIMEOUT_MS,
      buildConfig: (Type) => ({
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'Comprehensive, structured coaching response in the requested language.',
            },
            recommendedExerciseIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Up to 3 matching exercise IDs from the provided availableExercises list.',
            },
            recommendedLessonIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Up to 2 matching lesson IDs from the provided availableLessons list.',
            },
            recommendedTutorialIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Up to 2 matching tutorial IDs from the provided availableTutorials list.',
            },
          },
          required: ['reply', 'recommendedExerciseIds', 'recommendedLessonIds', 'recommendedTutorialIds'],
        },
      }),
    });

    res.json({
      reply: String(data.reply || ''),
      recommendedExerciseIds: Array.isArray(data.recommendedExerciseIds)
        ? data.recommendedExerciseIds.filter((id) => validExerciseIds.size === 0 || validExerciseIds.has(id)).slice(0, 3)
        : [],
      recommendedLessonIds: Array.isArray(data.recommendedLessonIds)
        ? data.recommendedLessonIds.filter((id) => validLessonIds.size === 0 || validLessonIds.has(id)).slice(0, 2)
        : [],
      recommendedTutorialIds: Array.isArray(data.recommendedTutorialIds)
        ? data.recommendedTutorialIds.filter((id) => validTutorialIds.size === 0 || validTutorialIds.has(id)).slice(0, 2)
        : [],
      modelUsed,
    });
  } catch (err) {
    const classified = classifyGeminiError(err);
    res.status(classified.status).json({
      error: classified.message,
      code: classified.code,
      retryable: classified.retryable,
    });
  }
});

// 2. Evidence-Based Multimodal Video Technique Analysis
app.post('/api/analysis/video', attachOptionalFirebaseUser, async (req, res) => {
  try {
    const {
      skillCategory,
      technique,
      skillLevel,
      handedness,
      cameraAngle,
      playerNotes,
      frames = [],
      poseSummary,
      availableExercises = [],
      availableTutorials = [],
    } = req.body || {};

    if (!Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({ error: 'No video frames were extracted for analysis.', code: 'BAD_REQUEST' });
    }

    const validFrames = frames
      .slice(0, 8)
      .filter((f) => typeof f?.imageDataUrl === 'string' && f.imageDataUrl.trim().length > 0);

    if (validFrames.length === 0) {
      return res.status(400).json({ error: 'Extracted frames did not contain valid image data.', code: 'BAD_REQUEST' });
    }

    const parts = [];
    const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

    validFrames.forEach((f) => {
      const rawUrl = f.imageDataUrl.trim();
      const mimeMatch = rawUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
      const candidateMime = mimeMatch ? mimeMatch[1].toLowerCase() : 'image/jpeg';
      const mimeType = ALLOWED_IMAGE_MIME_TYPES.has(candidateMime) ? candidateMime : 'image/jpeg';
      const rawBase64 = rawUrl.includes(',') ? rawUrl.split(',')[1] : rawUrl;
      const base64 = rawBase64 ? rawBase64.replace(/\s+/g, '') : '';
      if (!base64 || base64.length < 32) return;

      parts.push({
        inlineData: {
          mimeType,
          data: base64,
        },
      });
      parts.push({
        text: `Frame #${Number(f.frameIndex) || 1} at ${Number(f.timestampSec || 0).toFixed(2)}s | MediaPipe Pose Detected: ${Boolean(f.poseDetected)} (Visibility: ${Math.round(Number(f.avgVisibility || 0) * 100)}%) | Telemetry: ${JSON.stringify(f.metrics || {})}`,
      });
    });

    if (parts.length === 0) {
      return res.status(400).json({ error: 'Could not decode any valid frame images for analysis.', code: 'BAD_REQUEST' });
    }

    parts.push({
      text: `Analyze this cricket practice clip strictly from the provided video keyframes and MediaPipe Pose telemetry.
CONTEXT:
- Skill Category: ${skillCategory || 'Batting'}
- Technique Practised: ${technique || 'General Technique'}
- Player Level: ${skillLevel || 'Intermediate'}
- Handedness: ${handedness || 'Right-handed'}
- Camera Angle: ${cameraAngle || 'Side View'}
- Player Notes: ${playerNotes || 'None provided'}
- Aggregate Pose Telemetry: ${JSON.stringify(poseSummary || {})}

AVAILABLE EXERCISE IDs FOR RECOMMENDATIONS: ${JSON.stringify(availableExercises)}
AVAILABLE TUTORIAL IDs FOR RECOMMENDATIONS: ${JSON.stringify(availableTutorials)}

CRITICAL ACCURACY & HONESTY RULES:
1. Only report what is genuinely visible in the provided frames or measured in the MediaPipe telemetry.
2. NEVER claim ball speed, spin rate, bat-ball contact quality (unless ball & bat impact is unmistakably visible), actual pitch line/length, or reaction time.
3. NEVER certify a bowling action as legal or illegal from smartphone/webcam video. Always state that formal biomechanical testing is required for action legality.
4. If the player is not clearly visible, obscured, or pose visibility is low (<0.45) or framesWithPose is 0 when no player is visible, set insufficientEvidence to true and clearly explain "Insufficient visual evidence" and how to re-record.
5. Attach accurate frameIndex (matching the frame numbers above) and timestampSec to every observation, plus honest confidence ("High", "Medium", or "Low").
6. Select up to 4 relevant recommendedExerciseIds and up to 3 recommendedTutorialIds strictly from the provided lists.`,
    });

    const validExerciseIds = new Set(
      Array.isArray(availableExercises) ? availableExercises.map((e) => e?.id).filter(Boolean) : []
    );
    const validTutorialIds = new Set(
      Array.isArray(availableTutorials) ? availableTutorials.map((t) => t?.id).filter(Boolean) : []
    );

    const { data, modelUsed } = await generateJsonWithGemini({
      contents: { parts },
      requiredKeys: ['summary'],
      nonEmptyStringKeys: ['summary'],
      primaryTimeoutMs: MULTIMODAL_PRIMARY_TIMEOUT_MS,
      fallbackTimeoutMs: MULTIMODAL_FALLBACK_TIMEOUT_MS,
      buildConfig: (Type) => ({
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insufficientEvidence: { type: Type.BOOLEAN },
            summary: { type: Type.STRING },
            observedStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            areasToImprove: { type: Type.ARRAY, items: { type: Type.STRING } },
            observations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  timestampSec: { type: Type.NUMBER },
                  frameIndex: { type: Type.INTEGER },
                  confidence: { type: Type.STRING },
                  evidence: { type: Type.STRING },
                  whyItMatters: { type: Type.STRING },
                  correctionSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['title', 'timestampSec', 'frameIndex', 'confidence', 'evidence', 'whyItMatters', 'correctionSteps'],
              },
            },
            recommendedExerciseIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedTutorialIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            personalImprovementPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
            limitationsNotice: { type: Type.STRING },
          },
          required: [
            'insufficientEvidence',
            'summary',
            'observedStrengths',
            'areasToImprove',
            'observations',
            'recommendedExerciseIds',
            'recommendedTutorialIds',
            'personalImprovementPlan',
            'limitationsNotice',
          ],
        },
      }),
    });

    const normalizedObservations = Array.isArray(data.observations)
      ? data.observations
          .filter((o) => Boolean(o && typeof o === 'object'))
          .map((o) => ({
            title: String(o.title || 'Observed Movement Checkpoint'),
            timestampSec: Number.isFinite(Number(o.timestampSec)) ? Number(o.timestampSec) : 0,
            frameIndex: Number.isFinite(Number(o.frameIndex)) ? Math.max(1, Math.round(Number(o.frameIndex))) : 1,
            confidence: ['High', 'Medium', 'Low'].includes(String(o.confidence)) ? String(o.confidence) : 'Medium',
            evidence: String(o.evidence || ''),
            whyItMatters: String(o.whyItMatters || ''),
            correctionSteps: Array.isArray(o.correctionSteps) ? o.correctionSteps.map((s) => String(s)) : [],
          }))
      : [];

    res.json({
      insufficientEvidence: Boolean(data.insufficientEvidence),
      summary: String(data.summary || ''),
      observedStrengths: Array.isArray(data.observedStrengths) ? data.observedStrengths.map((s) => String(s)) : [],
      areasToImprove: Array.isArray(data.areasToImprove) ? data.areasToImprove.map((s) => String(s)) : [],
      observations: normalizedObservations,
      recommendedExerciseIds: Array.isArray(data.recommendedExerciseIds)
        ? data.recommendedExerciseIds.filter((id) => validExerciseIds.size === 0 || validExerciseIds.has(String(id))).slice(0, 4)
        : [],
      recommendedTutorialIds: Array.isArray(data.recommendedTutorialIds)
        ? data.recommendedTutorialIds.filter((id) => validTutorialIds.size === 0 || validTutorialIds.has(String(id))).slice(0, 3)
        : [],
      personalImprovementPlan: Array.isArray(data.personalImprovementPlan)
        ? data.personalImprovementPlan.map((s) => String(s))
        : [],
      limitationsNotice: String(
        data.limitationsNotice ||
          'Analysis is based strictly on sampled video keyframes and available MediaPipe pose landmarks.'
      ),
      modelUsed,
    });
  } catch (err) {
    const classified = classifyGeminiError(err);
    res.status(classified.status).json({
      error: classified.message,
      code: classified.code,
      retryable: classified.retryable,
    });
  }
});

// 3. Why Did I Get Out? Dismissal Analysis
app.post('/api/analysis/dismissal', attachOptionalFirebaseUser, async (req, res) => {
  try {
    const {
      dismissalType,
      technique,
      scorecardContext,
      notes,
      frames = [],
      availableExercises = [],
      availableTutorials = [],
    } = req.body || {};

    const parts = [];

    if (Array.isArray(frames) && frames.length > 0) {
      frames.slice(0, 6).forEach((f) => {
        if (!f?.imageDataUrl) return;
        const base64 = f.imageDataUrl.includes(',') ? f.imageDataUrl.split(',')[1] : f.imageDataUrl;
        if (!base64) return;
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64 } });
        parts.push({ text: `Frame #${f.frameIndex} at ${Number(f.timestampSec || 0).toFixed(2)}s` });
      });
    }

    parts.push({
      text: `Analyze this cricket dismissal request honestly and clearly separate OBSERVED EVIDENCE from POSSIBLE EXPLANATIONS.
- Dismissal Type: ${dismissalType}
- Technique Attempted: ${technique || 'Not specified'}
- Scorecard / Match Context: ${scorecardContext || 'Not provided'}
- Player Notes: ${notes || 'None'}
- Video Provided: ${Array.isArray(frames) && frames.length > 0 ? `Yes (${frames.length} frames)` : 'No video attached'}
- Available Exercises: ${JSON.stringify(availableExercises)}
- Available Tutorials: ${JSON.stringify(availableTutorials)}

CRITICAL RULE: If no video was provided, "observedEvidence" must explicitly state "No video footage provided — analysis is based solely on your dismissal description and match context" and confidence must reflect that limitation.`,
    });

    const hasFrames = Array.isArray(frames) && frames.length > 0;
    const { data, modelUsed } = await generateJsonWithGemini({
      contents: { parts },
      requiredKeys: ['observedEvidence', 'possibleReasons', 'technicalExplanation', 'correctionSteps'],
      nonEmptyStringKeys: ['observedEvidence', 'technicalExplanation'],
      primaryTimeoutMs: hasFrames ? MULTIMODAL_PRIMARY_TIMEOUT_MS : TEXT_PRIMARY_TIMEOUT_MS,
      fallbackTimeoutMs: hasFrames ? MULTIMODAL_FALLBACK_TIMEOUT_MS : TEXT_FALLBACK_TIMEOUT_MS,
      buildConfig: (Type) => ({
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            observedEvidence: { type: Type.STRING },
            supportingTimestamp: { type: Type.STRING },
            confidence: { type: Type.STRING },
            possibleReasons: { type: Type.ARRAY, items: { type: Type.STRING } },
            technicalExplanation: { type: Type.STRING },
            correctionSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedExerciseIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedTutorialIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'observedEvidence',
            'supportingTimestamp',
            'confidence',
            'possibleReasons',
            'technicalExplanation',
            'correctionSteps',
            'recommendedExerciseIds',
            'recommendedTutorialIds',
          ],
        },
      }),
    });

    res.json({ ...data, modelUsed });
  } catch (err) {
    const classified = classifyGeminiError(err);
    res.status(classified.status).json({
      error: classified.message,
      code: classified.code,
      retryable: classified.retryable,
    });
  }
});

// 4. Personal AI Training Planner
app.post('/api/planner/generate', attachOptionalFirebaseUser, async (req, res) => {
  try {
    const {
      ageGroup,
      role,
      skillLevel,
      weakness,
      goal,
      dailyMinutes,
      daysPerWeek,
      equipment,
      location,
      currentWorkload,
      recoveryAvailability,
      availableExercises = [],
    } = req.body || {};

    const prompt = `Build a realistic, safe, personalized cricket training plan.
PLAYER DETAILS:
- Age Group: ${ageGroup}
- Role: ${role}
- Skill Level: ${skillLevel}
- Primary Weakness: ${weakness}
- Training Goal: ${goal}
- Available Time Per Day: ${dailyMinutes} minutes
- Training Days Per Week: ${daysPerWeek} days
- Available Equipment: ${(equipment || []).join(', ') || 'Basic cricket kit'}
- Location: ${location}
- Current Workload: ${currentWorkload}
- Recovery Availability: ${recoveryAvailability}

AVAILABLE CRICKIFY EXERCISES (use matching IDs in exerciseId whenever applicable):
${JSON.stringify(availableExercises)}

SAFETY & STRUCTURE REQUIREMENTS:
1. Daily routine blocks must sum closely to ${dailyMinutes} minutes and ALWAYS begin with a dynamic warm-up and end with a cool-down/recovery block.
2. Weekly schedule must cover Monday to Sunday (7 days), marking rest/recovery days appropriately based on ${daysPerWeek} active days and age group (${ageGroup}).
3. Never prescribe excessive fast-bowling or sprint loads; include an explicit workloadNote.`;

    const { data, modelUsed } = await generateJsonWithGemini({
      contents: prompt,
      requiredKeys: ['workloadNote', 'dailyRoutine', 'weeklySchedule'],
      nonEmptyStringKeys: ['workloadNote'],
      primaryTimeoutMs: MULTIMODAL_PRIMARY_TIMEOUT_MS,
      fallbackTimeoutMs: MULTIMODAL_FALLBACK_TIMEOUT_MS,
      buildConfig: (Type) => ({
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            workloadNote: { type: Type.STRING },
            dailyRoutine: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  order: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  durationMinutes: { type: Type.INTEGER },
                  focus: { type: Type.STRING },
                  exerciseId: { type: Type.STRING },
                  instructions: { type: Type.STRING },
                },
                required: ['order', 'title', 'durationMinutes', 'focus', 'instructions'],
              },
            },
            weeklySchedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  theme: { type: Type.STRING },
                  durationMinutes: { type: Type.INTEGER },
                  isRecovery: { type: Type.BOOLEAN },
                  blocks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        order: { type: Type.INTEGER },
                        title: { type: Type.STRING },
                        durationMinutes: { type: Type.INTEGER },
                        focus: { type: Type.STRING },
                        exerciseId: { type: Type.STRING },
                        instructions: { type: Type.STRING },
                      },
                      required: ['order', 'title', 'durationMinutes', 'focus', 'instructions'],
                    },
                  },
                },
                required: ['day', 'theme', 'durationMinutes', 'isRecovery', 'blocks'],
              },
            },
          },
          required: ['workloadNote', 'dailyRoutine', 'weeklySchedule'],
        },
      }),
    });

    res.json({ ...data, modelUsed });
  } catch (err) {
    const classified = classifyGeminiError(err);
    res.status(classified.status).json({
      error: classified.message,
      code: classified.code,
      retryable: classified.retryable,
    });
  }
});

// 5. Turf IQ Tactical Advisor
app.post('/api/turf/tactics', attachOptionalFirebaseUser, async (req, res) => {
  try {
    const { rules, scenario, focusArea } = req.body || {};

    const prompt = `You are a Turf & Box Cricket tactician. Base ALL tactical recommendations strictly on these configured local arena rules:
${JSON.stringify(rules, null, 2)}

Focus Area: ${focusArea}
Match Scenario / Question: ${scenario}

Provide concrete batting, bowling, and fielding adjustments tailored to these exact side-wall, back-net, ball-type, and over-limit rules.`;

    const { data, modelUsed } = await generateJsonWithGemini({
      contents: prompt,
      requiredKeys: ['tacticalSummary', 'battingPlan', 'bowlingPlan'],
      nonEmptyStringKeys: ['tacticalSummary'],
      primaryTimeoutMs: TEXT_PRIMARY_TIMEOUT_MS,
      fallbackTimeoutMs: TEXT_FALLBACK_TIMEOUT_MS,
      buildConfig: (Type) => ({
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tacticalSummary: { type: Type.STRING },
            battingPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
            bowlingPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
            fieldingSetup: { type: Type.ARRAY, items: { type: Type.STRING } },
            lastOverChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['tacticalSummary', 'battingPlan', 'bowlingPlan', 'fieldingSetup', 'lastOverChecklist'],
        },
      }),
    });

    res.json({ ...data, modelUsed });
  } catch (err) {
    const classified = classifyGeminiError(err);
    res.status(classified.status).json({
      error: classified.message,
      code: classified.code,
      retryable: classified.retryable,
    });
  }
});

// 6. Match IQ Scorecard & Tactical Analyzer
app.post('/api/match/analyze', attachOptionalFirebaseUser, async (req, res) => {
  try {
    const { matchFormat, teamName, opponentName, battingRows, bowlingRows, notes } = req.body || {};

    const prompt = `Analyze this cricket scorecard data.
CRITICAL RULE: ONLY reference numbers and dismissals actually present in the scorecard below. Never invent missing balls, overs, or events.
Match Format: ${matchFormat}
Team: ${teamName} vs ${opponentName}
Batting Scorecard: ${JSON.stringify(battingRows)}
Bowling Scorecard: ${JSON.stringify(bowlingRows)}
Additional Context: ${notes || 'None'}

Provide honest performance insights, dismissal/scoring pattern observations, and tactical plans for Powerplay, Middle Overs, and Death Overs.`;

    const { data, modelUsed } = await generateJsonWithGemini({
      contents: prompt,
      requiredKeys: ['summary', 'battingPatterns', 'bowlingPatterns'],
      nonEmptyStringKeys: ['summary'],
      primaryTimeoutMs: TEXT_PRIMARY_TIMEOUT_MS,
      fallbackTimeoutMs: TEXT_FALLBACK_TIMEOUT_MS,
      buildConfig: (Type) => ({
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            battingPatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
            bowlingPatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
            powerplayPlan: { type: Type.STRING },
            middleOversPlan: { type: Type.STRING },
            deathOversPlan: { type: Type.STRING },
            opponentInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'summary',
            'battingPatterns',
            'bowlingPatterns',
            'powerplayPlan',
            'middleOversPlan',
            'deathOversPlan',
            'opponentInsights',
          ],
        },
      }),
    });

    res.json({ ...data, modelUsed });
  } catch (err) {
    const classified = classifyGeminiError(err);
    res.status(classified.status).json({
      error: classified.message,
      code: classified.code,
      retryable: classified.retryable,
    });
  }
});

// 7. Optional YouTube Search API proxy (if YOUTUBE_API_KEY configured)
app.get('/api/youtube/search', async (req, res) => {
  const q = String(req.query.q || 'cricket coaching tutorial');
  const ytKey = process.env.YOUTUBE_API_KEY;
  if (!ytKey) {
    return res.json({ configured: false, items: [] });
  }
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${encodeURIComponent(
      q + ' cricket coaching tutorial'
    )}&key=${encodeURIComponent(ytKey)}`;
    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ configured: true, error: data.error?.message || 'YouTube API error' });
    }
    const items = (data.items || []).map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      summary: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.high?.url,
    }));
    res.json({ configured: true, items });
  } catch (err) {
    res.status(500).json({ configured: true, error: err instanceof Error ? err.message : 'YouTube fetch error' });
  }
});

// Ensure unmatched /api/* routes always return JSON (never fall through to Vite/SPA index.html)
app.use('/api', (_req, res) => {
  res.status(404).json({
    error: 'API endpoint not found.',
    code: 'NOT_FOUND',
    retryable: false,
  });
});

// Ensure API errors (such as oversized payloads or malformed JSON) always return JSON
app.use('/api', (err, _req, res, _next) => {
  const errObj = err || {};
  if (errObj.type === 'entity.too.large' || errObj.status === 413) {
    return res.status(413).json({
      error: 'Video payload is too large. Please upload a shorter clip (5–20 seconds).',
      code: 'PAYLOAD_TOO_LARGE',
      retryable: false,
    });
  }
  if (errObj.type === 'entity.parse.failed' || errObj.status === 400) {
    return res.status(400).json({
      error: 'Invalid request payload sent to API.',
      code: 'BAD_REQUEST',
      retryable: false,
    });
  }
  return res.status(errObj.status || 500).json({
    error: errObj.message || 'Unexpected API error.',
    code: 'INTERNAL_ERROR',
    retryable: false,
  });
});

export default app;
