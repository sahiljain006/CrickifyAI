import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  CoachMessage,
  CoachSquadPlayer,
  PitchIQState,
  PlayerProfile,
  PlayZoneSession,
  SavedVideoRecord,
  ScorecardBattingRow,
  ScorecardBowlingRow,
  TrainingHistoryEntry,
  TrainingPlan,
  TurfRulesConfig,
  VideoAnalysisReport,
} from '../types';
import { DEFAULT_PITCHIQ_STATE } from '../data/tipsAndQuiz';
import { auth, AuthUserSummary, db, handleFirestoreError, OperationType } from './firebase';

function isCurrentUserAuthorized(uid: string): boolean {
  return Boolean(auth.currentUser && auth.currentUser.uid === uid);
}

export interface SavedMatchAnalysis {
  id: string;
  createdAt: string;
  matchFormat: string;
  teamName: string;
  opponentName: string;
  battingRows: ScorecardBattingRow[];
  bowlingRows: ScorecardBowlingRow[];
  notes: string;
  analysis: {
    summary: string;
    battingPatterns: string[];
    bowlingPatterns: string[];
    powerplayPlan: string;
    middleOversPlan: string;
    deathOversPlan: string;
    opponentInsights: string[];
  } | null;
}

const VALID_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

export function sanitizeDocId(raw: string | undefined, fallbackPrefix: string): string {
  const cleaned = (raw || '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
  if (cleaned && VALID_ID_REGEX.test(cleaned)) {
    return cleaned;
  }
  return `${fallbackPrefix}-${Date.now()}`;
}

function clampString(val: unknown, maxLen: number, fallback = ''): string {
  if (typeof val !== 'string') return fallback;
  return val.slice(0, maxLen);
}

function clampStringArray(val: unknown, maxItems: number, maxItemLen = 200): string[] {
  if (!Array.isArray(val)) return [];
  return val
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, maxItems)
    .map((s) => s.slice(0, maxItemLen));
}

function sanitizeRecordMapString(val: unknown, maxKeys: number, maxValLen = 2000): Record<string, string> {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return {};
  const entries = Object.entries(val as Record<string, unknown>).slice(0, maxKeys);
  const out: Record<string, string> = {};
  for (const [k, v] of entries) {
    if (typeof v === 'string') {
      out[k.slice(0, 80)] = v.slice(0, maxValLen);
    }
  }
  return out;
}

function sanitizeRecordMapNumber(val: unknown, maxKeys: number): Record<string, number> {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return {};
  const entries = Object.entries(val as Record<string, unknown>).slice(0, maxKeys);
  const out: Record<string, number> = {};
  for (const [k, v] of entries) {
    if (typeof v === 'number' && Number.isFinite(v)) {
      out[k.slice(0, 80)] = v;
    }
  }
  return out;
}

function sanitizeTurfRules(rules: TurfRulesConfig): Record<string, unknown> {
  return {
    playersPerSide: Number(rules.playersPerSide) || 8,
    pitchLengthYards: Number(rules.pitchLengthYards) || 20,
    oversPerInnings: Number(rules.oversPerInnings) || 8,
    ballType: clampString(rules.ballType, 40, 'Hard Tennis'),
    boundaryShape: clampString(rules.boundaryShape, 80, 'Rectangular Cage'),
    sideWallRule: clampString(rules.sideWallRule, 40, '1 Run'),
    backNetRule: clampString(rules.backNetRule, 40, '4 Runs'),
    roofNetRule: clampString(rules.roofNetRule, 40, 'Dead Ball'),
    widePenaltyRuns: Number(rules.widePenaltyRuns) || 1,
    noBallFreeHit: Boolean(rules.noBallFreeHit),
    bonusOverRule: clampString(rules.bonusOverRule, 160),
    dismissalRules: clampStringArray(rules.dismissalRules, 10, 60),
  };
}

function sanitizeFirestoreAvatarUrl(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith('data:')) return '';
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) return '';
  return trimmed.slice(0, 512);
}

const ALLOWED_AGE_GROUPS = ['Under-14', '14-18', '19-25', '26-35', '35+'] as const;
const ALLOWED_SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Competitive'] as const;
const ALLOWED_ROLES = ['Batter', 'Fast Bowler', 'Spin Bowler', 'All-Rounder', 'Wicketkeeper'] as const;
const ALLOWED_BATTING_HANDS = ['Right-handed', 'Left-handed'] as const;
const ALLOWED_BOWLING_STYLES = ['Fast', 'Medium Pace', 'Off-Spin', 'Leg-Spin', 'None'] as const;
const ALLOWED_BALL_TYPES = ['Leather Ball', 'Tennis Ball', 'Both'] as const;
const ALLOWED_ENVIRONMENTS = ['Regular Cricket', 'Turf / Box Cricket', 'Both'] as const;
const ALLOWED_LANGUAGES = ['English', 'Tamil', 'Hindi'] as const;

function pickEnum<T extends string>(val: unknown, allowed: readonly T[], fallback: T): T {
  return typeof val === 'string' && (allowed as readonly string[]).includes(val) ? (val as T) : fallback;
}

function buildWorkspaceProfileFields(uid: string, email: string, profile: PlayerProfile) {
  const safeName = clampString(profile.name, 80).trim() || 'Player';
  return {
    ownerId: uid,
    name: safeName,
    email: clampString(email, 160),
    avatarUrl: sanitizeFirestoreAvatarUrl(profile.avatarUrl),
    ageGroup: pickEnum(profile.ageGroup, ALLOWED_AGE_GROUPS, '19-25'),
    experience: clampString(profile.experience, 160, 'Club / Weekend Cricket'),
    skillLevel: pickEnum(profile.skillLevel, ALLOWED_SKILL_LEVELS, 'Intermediate'),
    role: pickEnum(profile.role, ALLOWED_ROLES, 'Batter'),
    battingHand: pickEnum(profile.battingHand, ALLOWED_BATTING_HANDS, 'Right-handed'),
    bowlingStyle: pickEnum(profile.bowlingStyle, ALLOWED_BOWLING_STYLES, 'Medium Pace'),
    ballType: pickEnum(profile.ballType, ALLOWED_BALL_TYPES, 'Both'),
    environment: pickEnum(profile.environment, ALLOWED_ENVIRONMENTS, 'Both'),
    goals: clampStringArray(profile.goals, 12, 80),
    dailyMinutes: Math.min(360, Math.max(5, Number(profile.dailyMinutes) || 45)),
    trainingDaysPerWeek: Math.min(7, Math.max(1, Number(profile.trainingDaysPerWeek) || 4)),
    language: pickEnum(profile.language, ALLOWED_LANGUAGES, 'English'),
    equipment: clampStringArray(profile.equipment, 20, 60),
    onboardingCompleted: Boolean(profile.onboardingCompleted),
  };
}

function buildWorkspaceProgressFields(state: PitchIQState) {
  return {
    completedLessonIds: clampStringArray(state.completedLessonIds, 200, 80),
    completedExerciseIds: clampStringArray(state.completedExerciseIds, 300, 80),
    savedExerciseIds: clampStringArray(state.savedExerciseIds, 300, 80),
    savedTutorialIds: clampStringArray(state.savedTutorialIds, 200, 80),
    bookmarkedTipIds: clampStringArray(state.bookmarkedTipIds, 200, 80),
    completedChallenges: clampStringArray(state.completedChallenges, 100, 80),
    exerciseNotes: sanitizeRecordMapString(state.exerciseNotes, 200, 1500),
    quizHighScores: sanitizeRecordMapNumber(state.quizHighScores, 40),
    turfRules: sanitizeTurfRules(state.turfRules),
  };
}

async function ensureParentWorkspaceExists(uid: string, email: string, state: PitchIQState): Promise<boolean> {
  if (!isCurrentUserAuthorized(uid)) {
    return false;
  }
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      if (!isCurrentUserAuthorized(uid)) {
        return false;
      }
      await setDoc(userRef, {
        ...buildWorkspaceProfileFields(uid, email, state.profile),
        ...buildWorkspaceProgressFields(state),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return true;
  } catch (err) {
    if (!isCurrentUserAuthorized(uid)) {
      return false;
    }
    handleFirestoreError(err, OperationType.WRITE, userPath);
  }
}

export async function saveWorkspaceProfileToFirestore(
  uid: string,
  email: string,
  state: PitchIQState
): Promise<void> {
  if (!isCurrentUserAuthorized(uid)) return;
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);
  try {
    const snap = await getDoc(userRef);
    if (!isCurrentUserAuthorized(uid)) return;
    if (!snap.exists()) {
      await setDoc(userRef, {
        ...buildWorkspaceProfileFields(uid, email, state.profile),
        ...buildWorkspaceProgressFields(state),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const fields = buildWorkspaceProfileFields(uid, email, state.profile);
      const { ownerId: _ignoreOwner, ...updatable } = fields;
      await updateDoc(userRef, {
        ...updatable,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    if (!isCurrentUserAuthorized(uid)) return;
    handleFirestoreError(err, OperationType.UPDATE, userPath);
  }
}

export async function saveWorkspaceProgressToFirestore(
  uid: string,
  email: string,
  state: PitchIQState
): Promise<void> {
  if (!isCurrentUserAuthorized(uid)) return;
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);
  try {
    const snap = await getDoc(userRef);
    if (!isCurrentUserAuthorized(uid)) return;
    if (!snap.exists()) {
      await setDoc(userRef, {
        ...buildWorkspaceProfileFields(uid, email, state.profile),
        ...buildWorkspaceProgressFields(state),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        ...buildWorkspaceProgressFields(state),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    if (!isCurrentUserAuthorized(uid)) return;
    handleFirestoreError(err, OperationType.UPDATE, userPath);
  }
}

function sanitizeFramesForFirestore(frames: VideoAnalysisReport['frames']) {
  const sliced = Array.isArray(frames) ? frames.slice(0, 8) : [];
  return sliced.map((f) => {
    const safeAnnotated = clampString(f.annotatedDataUrl, 65000);
    // Keep imageDataUrl lightweight if annotated already holds visual frame
    const safeRaw = safeAnnotated ? clampString(f.imageDataUrl, 25000) : clampString(f.imageDataUrl, 65000);
    return {
      frameIndex: Number(f.frameIndex) || 1,
      timestampSec: Number(f.timestampSec) || 0,
      imageDataUrl: safeRaw,
      annotatedDataUrl: safeAnnotated || safeRaw,
      poseDetected: Boolean(f.poseDetected),
      avgVisibility: Number(f.avgVisibility) || 0,
      metrics: {
        headTiltDeg: f.metrics?.headTiltDeg ?? null,
        shoulderTiltDeg: f.metrics?.shoulderTiltDeg ?? null,
        frontKneeAngleDeg: f.metrics?.frontKneeAngleDeg ?? null,
        leadElbowAngleDeg: f.metrics?.leadElbowAngleDeg ?? null,
        stanceWidthRatio: f.metrics?.stanceWidthRatio ?? null,
        centerOfMassOffset: f.metrics?.centerOfMassOffset ?? null,
      },
    };
  });
}

export async function saveVideoReportToFirestore(
  uid: string,
  email: string,
  state: PitchIQState,
  report: VideoAnalysisReport,
  videoRecord?: SavedVideoRecord,
  options?: { skipParentCheck?: boolean }
): Promise<void> {
  if (!isCurrentUserAuthorized(uid)) return;
  if (!options?.skipParentCheck) {
    const ok = await ensureParentWorkspaceExists(uid, email, state);
    if (!ok) return;
  }
  const reportId = sanitizeDocId(report.id, 'rep');
  const reportPath = `users/${uid}/reports/${reportId}`;
  const reportRef = doc(db, 'users', uid, 'reports', reportId);

  try {
    await setDoc(reportRef, {
      ownerId: uid,
      clientCreatedAt: clampString(report.createdAt, 64, new Date().toISOString()),
      title: clampString(report.title, 160).trim() || 'Cricket Video Analysis',
      skillCategory: pickEnum(report.skillCategory, ['Batting', 'Bowling', 'Fielding'] as const, 'Batting'),
      technique: clampString(report.technique, 120).trim() || 'General Technique',
      skillLevel: pickEnum(report.skillLevel, ALLOWED_SKILL_LEVELS, 'Intermediate'),
      handedness: pickEnum(report.handedness, ALLOWED_BATTING_HANDS, 'Right-handed'),
      cameraAngle: clampString(report.cameraAngle, 80, 'Side View'),
      playerNotes: clampString(report.playerNotes, 2000),
      insufficientEvidence: Boolean(report.insufficientEvidence),
      summary: clampString(report.summary, 4000).trim() || 'Analysis completed.',
      cameraAngleNotes: clampString(report.cameraAngleNotes, 1000),
      observedStrengths: clampStringArray(report.observedStrengths, 20, 400),
      areasToImprove: clampStringArray(report.areasToImprove, 20, 400),
      observations: (Array.isArray(report.observations) ? report.observations : []).slice(0, 20).map((obs) => ({
        title: clampString(obs.title, 160),
        timestampSec: Number(obs.timestampSec) || 0,
        frameIndex: Number(obs.frameIndex) || 1,
        confidence: obs.confidence || 'Medium',
        evidence: clampString(obs.evidence, 600),
        whyItMatters: clampString(obs.whyItMatters, 600),
        correctionSteps: clampStringArray(obs.correctionSteps, 8, 300),
      })),
      recommendedExerciseIds: clampStringArray(report.recommendedExerciseIds, 10, 80),
      recommendedTutorialIds: clampStringArray(report.recommendedTutorialIds, 10, 80),
      personalImprovementPlan: clampStringArray(report.personalImprovementPlan, 20, 400),
      limitationsNotice: clampString(report.limitationsNotice, 1500),
      frames: sanitizeFramesForFirestore(report.frames),
      poseSummary: {
        framesAnalyzed: Number(report.poseSummary?.framesAnalyzed) || 0,
        framesWithPose: Number(report.poseSummary?.framesWithPose) || 0,
        avgVisibility: Number(report.poseSummary?.avgVisibility) || 0,
        headStabilityDeltaDeg: report.poseSummary?.headStabilityDeltaDeg ?? null,
        avgFrontKneeAngleDeg: report.poseSummary?.avgFrontKneeAngleDeg ?? null,
        avgShoulderTiltDeg: report.poseSummary?.avgShoulderTiltDeg ?? null,
        avgLeadElbowAngleDeg: report.poseSummary?.avgLeadElbowAngleDeg ?? null,
        balanceSymmetryNote: clampString(report.poseSummary?.balanceSymmetryNote, 400),
      },
      coachFeedback: clampString(report.coachFeedback, 3000),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    if (!isCurrentUserAuthorized(uid)) return;
    handleFirestoreError(err, OperationType.CREATE, reportPath);
  }

  if (videoRecord && isCurrentUserAuthorized(uid)) {
    const vidId = sanitizeDocId(videoRecord.id, 'vid');
    const vidPath = `users/${uid}/savedVideos/${vidId}`;
    const vidRef = doc(db, 'users', uid, 'savedVideos', vidId);
    try {
      await setDoc(vidRef, {
        ownerId: uid,
        clientCreatedAt: clampString(videoRecord.createdAt, 64, new Date().toISOString()),
        title: clampString(videoRecord.title, 160).trim() || 'Cricket Practice Clip',
        skillCategory: pickEnum(videoRecord.skillCategory, ['Batting', 'Bowling', 'Fielding'] as const, 'Batting'),
        technique: clampString(videoRecord.technique, 120).trim() || 'General Technique',
        durationSec: Math.min(1800, Math.max(0, Number(videoRecord.durationSec) || 0)),
        thumbnailDataUrl: clampString(videoRecord.thumbnailDataUrl, 195000),
        reportId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      if (!isCurrentUserAuthorized(uid)) return;
      handleFirestoreError(err, OperationType.CREATE, vidPath);
    }
  }
}

export async function deleteVideoReportFromFirestore(
  uid: string,
  reportId: string,
  linkedVideoIds: string[]
): Promise<void> {
  if (!isCurrentUserAuthorized(uid)) return;
  const safeRepId = sanitizeDocId(reportId, 'rep');
  const reportPath = `users/${uid}/reports/${safeRepId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'reports', safeRepId));
  } catch (err) {
    if (!isCurrentUserAuthorized(uid)) return;
    handleFirestoreError(err, OperationType.DELETE, reportPath);
  }

  for (const rawVidId of linkedVideoIds) {
    if (!isCurrentUserAuthorized(uid)) return;
    const safeVidId = sanitizeDocId(rawVidId, 'vid');
    const vidPath = `users/${uid}/savedVideos/${safeVidId}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'savedVideos', safeVidId));
    } catch (err) {
      if (!isCurrentUserAuthorized(uid)) return;
      handleFirestoreError(err, OperationType.DELETE, vidPath);
    }
  }
}

export async function saveCoachMessagesToFirestore(
  uid: string,
  email: string,
  state: PitchIQState,
  messages: CoachMessage[],
  options?: { skipParentCheck?: boolean }
): Promise<void> {
  if (!isCurrentUserAuthorized(uid)) return;
  if (!options?.skipParentCheck) {
    const ok = await ensureParentWorkspaceExists(uid, email, state);
    if (!ok) return;
  }
  for (const msg of messages) {
    if (!isCurrentUserAuthorized(uid)) return;
    const msgId = sanitizeDocId(msg.id, 'msg');
    const msgPath = `users/${uid}/coachMessages/${msgId}`;
    const msgRef = doc(db, 'users', uid, 'coachMessages', msgId);
    try {
      await setDoc(msgRef, {
        ownerId: uid,
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: clampString(msg.content, 12000).trim() || '...',
        clientTimestamp: clampString(msg.timestamp, 64, new Date().toISOString()),
        language: pickEnum(msg.language, ALLOWED_LANGUAGES, 'English'),
        linkedReportId: clampString(msg.linkedReportId, 128),
        recommendedExerciseIds: clampStringArray(msg.recommendedExerciseIds, 10, 80),
        recommendedLessonIds: clampStringArray(msg.recommendedLessonIds, 10, 80),
        recommendedTutorialIds: clampStringArray(msg.recommendedTutorialIds, 10, 80),
        saved: Boolean(msg.saved),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      if (!isCurrentUserAuthorized(uid)) return;
      handleFirestoreError(err, OperationType.CREATE, msgPath);
    }
  }
}

export async function toggleCoachMessageSavedInFirestore(
  uid: string,
  msg: CoachMessage
): Promise<void> {
  if (!isCurrentUserAuthorized(uid)) return;
  const msgId = sanitizeDocId(msg.id, 'msg');
  const msgPath = `users/${uid}/coachMessages/${msgId}`;
  const msgRef = doc(db, 'users', uid, 'coachMessages', msgId);
  try {
    const snap = await getDoc(msgRef);
    if (!isCurrentUserAuthorized(uid)) return;
    if (snap.exists()) {
      await updateDoc(msgRef, {
        saved: Boolean(msg.saved),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(msgRef, {
        ownerId: uid,
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: clampString(msg.content, 12000, '...'),
        clientTimestamp: clampString(msg.timestamp, 64, new Date().toISOString()),
        language: pickEnum(msg.language, ALLOWED_LANGUAGES, 'English'),
        linkedReportId: clampString(msg.linkedReportId, 128),
        recommendedExerciseIds: clampStringArray(msg.recommendedExerciseIds, 10, 80),
        recommendedLessonIds: clampStringArray(msg.recommendedLessonIds, 10, 80),
        recommendedTutorialIds: clampStringArray(msg.recommendedTutorialIds, 10, 80),
        saved: Boolean(msg.saved),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    if (!isCurrentUserAuthorized(uid)) return;
    handleFirestoreError(err, OperationType.UPDATE, msgPath);
  }
}

export async function saveTrainingPlanToFirestore(
  uid: string,
  email: string,
  state: PitchIQState,
  plan: TrainingPlan,
  options?: { skipParentCheck?: boolean }
): Promise<void> {
  if (!isCurrentUserAuthorized(uid)) return;
  if (!options?.skipParentCheck) {
    const ok = await ensureParentWorkspaceExists(uid, email, state);
    if (!ok) return;
  }
  const planId = sanitizeDocId(plan.id, 'plan');
  const planPath = `users/${uid}/trainingPlans/${planId}`;
  const planRef = doc(db, 'users', uid, 'trainingPlans', planId);
  try {
    await setDoc(planRef, {
      ownerId: uid,
      clientCreatedAt: clampString(plan.createdAt, 64, new Date().toISOString()),
      goal: clampString(plan.goal, 200, 'Cricket Conditioning'),
      dailyMinutes: Math.min(360, Math.max(5, Number(plan.dailyMinutes) || 45)),
      daysPerWeek: Math.min(7, Math.max(1, Number(plan.daysPerWeek) || 4)),
      workloadNote: clampString(plan.workloadNote, 2000),
      dailyRoutine: (Array.isArray(plan.dailyRoutine) ? plan.dailyRoutine : []).slice(0, 20),
      weeklySchedule: (Array.isArray(plan.weeklySchedule) ? plan.weeklySchedule : []).slice(0, 7),
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, planPath);
  }
}

export async function saveTrainingHistoryEntryToFirestore(
  uid: string,
  email: string,
  state: PitchIQState,
  entry: TrainingHistoryEntry,
  options?: { skipParentCheck?: boolean }
): Promise<void> {
  if (!isCurrentUserAuthorized(uid)) return;
  if (!options?.skipParentCheck) {
    const ok = await ensureParentWorkspaceExists(uid, email, state);
    if (!ok) return;
  }
  const entryId = sanitizeDocId(entry.id, 'hist');
  const entryPath = `users/${uid}/trainingHistory/${entryId}`;
  const entryRef = doc(db, 'users', uid, 'trainingHistory', entryId);
  try {
    await setDoc(entryRef, {
      ownerId: uid,
      clientDate: clampString(entry.date, 64, new Date().toISOString()),
      title: clampString(entry.title, 160, 'Cricket Practice Session'),
      durationMinutes: Math.min(600, Math.max(1, Number(entry.durationMinutes) || 30)),
      exercisesCompleted: clampStringArray(entry.exercisesCompleted, 50, 80),
      notes: clampString(entry.notes, 2000),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, entryPath);
  }
}

export async function saveSquadPlayerToFirestore(
  uid: string,
  email: string,
  state: PitchIQState,
  player: CoachSquadPlayer,
  options?: { skipParentCheck?: boolean }
): Promise<void> {
  if (!isCurrentUserAuthorized(uid)) return;
  if (!options?.skipParentCheck) {
    const ok = await ensureParentWorkspaceExists(uid, email, state);
    if (!ok) return;
  }
  const playerId = sanitizeDocId(player.id, 'sq');
  const playerPath = `users/${uid}/squadPlayers/${playerId}`;
  const playerRef = doc(db, 'users', uid, 'squadPlayers', playerId);
  try {
    const snap = await getDoc(playerRef);
    if (snap.exists()) {
      await updateDoc(playerRef, {
        role: pickEnum(player.role, ALLOWED_ROLES, 'Batter'),
        level: pickEnum(player.level, ALLOWED_SKILL_LEVELS, 'Intermediate'),
        group: clampString(player.group, 80, 'Squad'),
        consentGranted: Boolean(player.consentGranted),
        assignedLessonIds: clampStringArray(player.assignedLessonIds, 100, 80),
        assignedExerciseIds: clampStringArray(player.assignedExerciseIds, 100, 80),
        notes: clampString(player.notes, 2000),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(playerRef, {
        ownerId: uid,
        name: clampString(player.name, 80, 'Squad Player'),
        role: pickEnum(player.role, ALLOWED_ROLES, 'Batter'),
        level: pickEnum(player.level, ALLOWED_SKILL_LEVELS, 'Intermediate'),
        group: clampString(player.group, 80, 'Squad'),
        consentGranted: Boolean(player.consentGranted),
        assignedLessonIds: clampStringArray(player.assignedLessonIds, 100, 80),
        assignedExerciseIds: clampStringArray(player.assignedExerciseIds, 100, 80),
        notes: clampString(player.notes, 2000),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, playerPath);
  }
}

export async function savePlayZoneSessionToFirestore(
  uid: string,
  email: string,
  state: PitchIQState,
  session: PlayZoneSession,
  options?: { skipParentCheck?: boolean }
): Promise<void> {
  if (!isCurrentUserAuthorized(uid)) return;
  if (!options?.skipParentCheck) {
    const ok = await ensureParentWorkspaceExists(uid, email, state);
    if (!ok) return;
  }
  const sessionId = sanitizeDocId(session.id, 'pz');
  const sessionPath = `users/${uid}/playzoneSessions/${sessionId}`;
  const sessionRef = doc(db, 'users', uid, 'playzoneSessions', sessionId);
  try {
    await setDoc(sessionRef, {
      ownerId: uid,
      clientCreatedAt: clampString(session.createdAt, 64, new Date().toISOString()),
      gameType: 'batting_challenge',
      challengeBalls: session.challengeBalls === 12 ? 12 : 6,
      difficulty:
        session.difficulty === 'Beginner' || session.difficulty === 'Pro'
          ? session.difficulty
          : 'Intermediate',
      totalRuns: Math.min(200, Math.max(0, Number(session.totalRuns) || 0)),
      ballsFaced: Math.min(24, Math.max(0, Number(session.ballsFaced) || 0)),
      successfulShots: Math.min(24, Math.max(0, Number(session.successfulShots) || 0)),
      missedDeliveries: Math.min(24, Math.max(0, Number(session.missedDeliveries) || 0)),
      wickets: Math.min(10, Math.max(0, Number(session.wickets) || 0)),
      timingScore: Math.min(100, Math.max(0, Math.round(Number(session.timingScore) || 0))),
      suggestedDrillId: clampString(session.suggestedDrillId, 128),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, sessionPath);
  }
}

export async function saveMatchAnalysisToFirestore(
  uid: string,
  email: string,
  state: PitchIQState,
  record: SavedMatchAnalysis
): Promise<void> {
  if (!isCurrentUserAuthorized(uid)) return;
  const ok = await ensureParentWorkspaceExists(uid, email, state);
  if (!ok || !isCurrentUserAuthorized(uid)) return;
  const matchId = sanitizeDocId(record.id, 'match');
  const matchPath = `users/${uid}/matchAnalyses/${matchId}`;
  const matchRef = doc(db, 'users', uid, 'matchAnalyses', matchId);
  try {
    await setDoc(matchRef, {
      ownerId: uid,
      matchFormat: clampString(record.matchFormat, 64, 'T20 (20 Overs)'),
      teamName: clampString(record.teamName, 80, 'My XI'),
      opponentName: clampString(record.opponentName, 80, 'Opposition XI'),
      battingRows: (Array.isArray(record.battingRows) ? record.battingRows : []).slice(0, 22),
      bowlingRows: (Array.isArray(record.bowlingRows) ? record.bowlingRows : []).slice(0, 22),
      notes: clampString(record.notes, 2000),
      analysis: record.analysis || {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    if (!isCurrentUserAuthorized(uid)) return;
    handleFirestoreError(err, OperationType.CREATE, matchPath);
  }
}

export async function listMatchAnalysesFromFirestore(uid: string): Promise<SavedMatchAnalysis[]> {
  if (!isCurrentUserAuthorized(uid)) return [];
  const path = `users/${uid}/matchAnalyses`;
  try {
    const q = query(collection(db, 'users', uid, 'matchAnalyses'), where('ownerId', '==', uid));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => {
        const data = d.data();
        const createdTs = data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString();
        return {
          id: d.id,
          createdAt: createdTs,
          matchFormat: String(data.matchFormat || 'T20 (20 Overs)'),
          teamName: String(data.teamName || 'My XI'),
          opponentName: String(data.opponentName || 'Opposition XI'),
          battingRows: Array.isArray(data.battingRows) ? data.battingRows : [],
          bowlingRows: Array.isArray(data.bowlingRows) ? data.bowlingRows : [],
          notes: String(data.notes || ''),
          analysis: data.analysis && typeof data.analysis.summary === 'string' ? data.analysis : null,
        } as SavedMatchAnalysis;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  } catch (err) {
    if (!isCurrentUserAuthorized(uid)) return [];
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function deleteMatchAnalysisFromFirestore(uid: string, matchId: string): Promise<void> {
  if (!isCurrentUserAuthorized(uid)) return;
  const safeId = sanitizeDocId(matchId, 'match');
  const path = `users/${uid}/matchAnalyses/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'matchAnalyses', safeId));
  } catch (err) {
    if (!isCurrentUserAuthorized(uid)) return;
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function loadOrCreateUserWorkspace(
  authUser: AuthUserSummary,
  localGuestState?: PitchIQState
): Promise<PitchIQState> {
  const uid = authUser.id;
  if (!isCurrentUserAuthorized(uid)) {
    return localGuestState || DEFAULT_PITCHIQ_STATE;
  }

  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  let workspaceSnap;
  try {
    workspaceSnap = await getDoc(userRef);
  } catch (err) {
    if (!isCurrentUserAuthorized(uid)) {
      return localGuestState || DEFAULT_PITCHIQ_STATE;
    }
    handleFirestoreError(err, OperationType.GET, userPath);
  }

  if (!workspaceSnap.exists()) {
    if (!isCurrentUserAuthorized(uid)) {
      return localGuestState || DEFAULT_PITCHIQ_STATE;
    }
    // First Firebase login: migrate any existing local/guest records cleanly into Firestore
    const seed = localGuestState || DEFAULT_PITCHIQ_STATE;
    const seededState: PitchIQState = {
      ...DEFAULT_PITCHIQ_STATE,
      ...seed,
      profile: {
        ...DEFAULT_PITCHIQ_STATE.profile,
        ...seed.profile,
        name:
          !seed.profile.name || seed.profile.name === 'Player' || seed.profile.name === 'Rising Cricketer'
            ? authUser.displayName
            : seed.profile.name,
        avatarUrl: seed.profile.avatarUrl || authUser.avatarUrl,
      },
    };

    try {
      await setDoc(userRef, {
        ...buildWorkspaceProfileFields(uid, authUser.email, seededState.profile),
        ...buildWorkspaceProgressFields(seededState),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      if (!isCurrentUserAuthorized(uid)) {
        return seededState;
      }
      handleFirestoreError(err, OperationType.CREATE, userPath);
    }

    // Migrate existing local reports, videos, messages, plans, history, squad if present
    for (const rep of seededState.reports.slice(0, 15)) {
      if (!isCurrentUserAuthorized(uid)) return seededState;
      const vid = seededState.savedVideos.find((v) => v.reportId === rep.id);
      await saveVideoReportToFirestore(uid, authUser.email, seededState, rep, vid, { skipParentCheck: true });
    }
    const orphanVideos = seededState.savedVideos
      .filter((v) => !seededState.reports.some((r) => r.id === v.reportId))
      .slice(0, 15);
    for (const vid of orphanVideos) {
      if (!isCurrentUserAuthorized(uid)) return seededState;
      const vidId = sanitizeDocId(vid.id, 'vid');
      try {
        await setDoc(doc(db, 'users', uid, 'savedVideos', vidId), {
          ownerId: uid,
          clientCreatedAt: clampString(vid.createdAt, 64, new Date().toISOString()),
          title: clampString(vid.title, 160, 'Cricket Practice Clip'),
          skillCategory: pickEnum(vid.skillCategory, ['Batting', 'Bowling', 'Fielding'] as const, 'Batting'),
          technique: clampString(vid.technique, 120, 'General Technique'),
          durationSec: Math.min(1800, Math.max(0, Number(vid.durationSec) || 0)),
          thumbnailDataUrl: clampString(vid.thumbnailDataUrl, 195000),
          reportId: clampString(vid.reportId, 128),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        if (!isCurrentUserAuthorized(uid)) return seededState;
        handleFirestoreError(err, OperationType.CREATE, `users/${uid}/savedVideos/${vidId}`);
      }
    }
    if (seededState.coachMessages.length > 0 && isCurrentUserAuthorized(uid)) {
      await saveCoachMessagesToFirestore(uid, authUser.email, seededState, seededState.coachMessages.slice(-40), {
        skipParentCheck: true,
      });
    }
    if (seededState.activeTrainingPlan && isCurrentUserAuthorized(uid)) {
      await saveTrainingPlanToFirestore(uid, authUser.email, seededState, seededState.activeTrainingPlan, {
        skipParentCheck: true,
      });
    }
    for (const hist of seededState.trainingHistory.slice(0, 25)) {
      if (!isCurrentUserAuthorized(uid)) return seededState;
      await saveTrainingHistoryEntryToFirestore(uid, authUser.email, seededState, hist, { skipParentCheck: true });
    }
    for (const sq of seededState.squadPlayers.slice(0, 25)) {
      if (!isCurrentUserAuthorized(uid)) return seededState;
      await saveSquadPlayerToFirestore(uid, authUser.email, seededState, sq, { skipParentCheck: true });
    }
    for (const pz of (seededState.playzoneSessions || []).slice(0, 20)) {
      if (!isCurrentUserAuthorized(uid)) return seededState;
      await savePlayZoneSessionToFirestore(uid, authUser.email, seededState, pz, { skipParentCheck: true });
    }

    return seededState;
  }

  const wsData = workspaceSnap.data();

  // Load subcollections using ownerId filter to satisfy Firestore query rules cleanly
  const fetchSub = async (sub: string) => {
    if (!isCurrentUserAuthorized(uid)) return [];
    const subPath = `users/${uid}/${sub}`;
    try {
      const q = query(collection(db, 'users', uid, sub), where('ownerId', '==', uid));
      const snap = await getDocs(q);
      return snap.docs;
    } catch (err) {
      if (!isCurrentUserAuthorized(uid)) return [];
      handleFirestoreError(err, OperationType.LIST, subPath);
    }
  };

  const [reportDocs, videoDocs, msgDocs, planDocs, historyDocs, squadDocs, playzoneDocs] = await Promise.all([
    fetchSub('reports'),
    fetchSub('savedVideos'),
    fetchSub('coachMessages'),
    fetchSub('trainingPlans'),
    fetchSub('trainingHistory'),
    fetchSub('squadPlayers'),
    fetchSub('playzoneSessions'),
  ]);

  const reports: VideoAnalysisReport[] = reportDocs
    .map((d) => {
      const r = d.data();
      return {
        id: d.id,
        createdAt: String(r.clientCreatedAt || r.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString()),
        title: String(r.title || 'Cricket Analysis'),
        skillCategory: r.skillCategory || 'Batting',
        technique: String(r.technique || 'Technique'),
        skillLevel: r.skillLevel || 'Intermediate',
        handedness: r.handedness || 'Right-handed',
        cameraAngle: String(r.cameraAngle || 'Side View'),
        playerNotes: String(r.playerNotes || ''),
        insufficientEvidence: Boolean(r.insufficientEvidence),
        summary: String(r.summary || ''),
        cameraAngleNotes: r.cameraAngleNotes ? String(r.cameraAngleNotes) : undefined,
        observedStrengths: Array.isArray(r.observedStrengths) ? r.observedStrengths : [],
        areasToImprove: Array.isArray(r.areasToImprove) ? r.areasToImprove : [],
        observations: Array.isArray(r.observations) ? r.observations : [],
        recommendedExerciseIds: Array.isArray(r.recommendedExerciseIds) ? r.recommendedExerciseIds : [],
        recommendedTutorialIds: Array.isArray(r.recommendedTutorialIds) ? r.recommendedTutorialIds : [],
        personalImprovementPlan: Array.isArray(r.personalImprovementPlan) ? r.personalImprovementPlan : [],
        limitationsNotice: String(r.limitationsNotice || ''),
        frames: Array.isArray(r.frames) ? r.frames : [],
        poseSummary: r.poseSummary || {
          framesAnalyzed: 0,
          framesWithPose: 0,
          avgVisibility: 0,
          headStabilityDeltaDeg: null,
          avgFrontKneeAngleDeg: null,
          avgShoulderTiltDeg: null,
          avgLeadElbowAngleDeg: null,
          balanceSymmetryNote: '',
        },
        coachFeedback: r.coachFeedback ? String(r.coachFeedback) : undefined,
      } as VideoAnalysisReport;
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const savedVideos: SavedVideoRecord[] = videoDocs
    .map((d) => {
      const v = d.data();
      return {
        id: d.id,
        createdAt: String(v.clientCreatedAt || new Date().toISOString()),
        title: String(v.title || 'Practice Clip'),
        skillCategory: v.skillCategory || 'Batting',
        technique: String(v.technique || ''),
        durationSec: Number(v.durationSec) || 0,
        thumbnailDataUrl: String(v.thumbnailDataUrl || ''),
        reportId: v.reportId ? String(v.reportId) : undefined,
      } as SavedVideoRecord;
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const coachMessages: CoachMessage[] = msgDocs
    .map((d) => {
      const m = d.data();
      return {
        id: d.id,
        role: m.role === 'user' ? 'user' : 'assistant',
        content: String(m.content || ''),
        timestamp: String(m.clientTimestamp || m.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString()),
        language: m.language || 'English',
        linkedReportId: m.linkedReportId ? String(m.linkedReportId) : undefined,
        recommendedExerciseIds: Array.isArray(m.recommendedExerciseIds) ? m.recommendedExerciseIds : undefined,
        recommendedLessonIds: Array.isArray(m.recommendedLessonIds) ? m.recommendedLessonIds : undefined,
        recommendedTutorialIds: Array.isArray(m.recommendedTutorialIds) ? m.recommendedTutorialIds : undefined,
        saved: Boolean(m.saved),
      } as CoachMessage;
    })
    .sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));

  const plans: TrainingPlan[] = planDocs
    .map((d) => {
      const p = d.data();
      return {
        id: d.id,
        createdAt: String(p.clientCreatedAt || new Date().toISOString()),
        goal: String(p.goal || ''),
        dailyMinutes: Number(p.dailyMinutes) || 45,
        daysPerWeek: Number(p.daysPerWeek) || 4,
        workloadNote: String(p.workloadNote || ''),
        dailyRoutine: Array.isArray(p.dailyRoutine) ? p.dailyRoutine : [],
        weeklySchedule: Array.isArray(p.weeklySchedule) ? p.weeklySchedule : [],
      } as TrainingPlan;
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const trainingHistory: TrainingHistoryEntry[] = historyDocs
    .map((d) => {
      const h = d.data();
      return {
        id: d.id,
        date: String(h.clientDate || new Date().toISOString()),
        title: String(h.title || ''),
        durationMinutes: Number(h.durationMinutes) || 30,
        exercisesCompleted: Array.isArray(h.exercisesCompleted) ? h.exercisesCompleted : [],
        notes: String(h.notes || ''),
      } as TrainingHistoryEntry;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const squadPlayers: CoachSquadPlayer[] = squadDocs.map((d) => {
    const s = d.data();
    return {
      id: d.id,
      name: String(s.name || 'Squad Player'),
      role: s.role || 'Batter',
      level: s.level || 'Intermediate',
      group: String(s.group || 'Squad'),
      consentGranted: Boolean(s.consentGranted),
      assignedLessonIds: Array.isArray(s.assignedLessonIds) ? s.assignedLessonIds : [],
      assignedExerciseIds: Array.isArray(s.assignedExerciseIds) ? s.assignedExerciseIds : [],
      notes: String(s.notes || ''),
    } as CoachSquadPlayer;
  });

  const hydratedProfile: PlayerProfile = {
    ...DEFAULT_PITCHIQ_STATE.profile,
    name: String(wsData.name || authUser.displayName || DEFAULT_PITCHIQ_STATE.profile.name),
    avatarUrl: wsData.avatarUrl ? String(wsData.avatarUrl) : authUser.avatarUrl,
    ageGroup: wsData.ageGroup || DEFAULT_PITCHIQ_STATE.profile.ageGroup,
    experience: String(wsData.experience || DEFAULT_PITCHIQ_STATE.profile.experience),
    skillLevel: wsData.skillLevel || DEFAULT_PITCHIQ_STATE.profile.skillLevel,
    role: wsData.role || DEFAULT_PITCHIQ_STATE.profile.role,
    battingHand: wsData.battingHand || DEFAULT_PITCHIQ_STATE.profile.battingHand,
    bowlingStyle: wsData.bowlingStyle || DEFAULT_PITCHIQ_STATE.profile.bowlingStyle,
    ballType: wsData.ballType || DEFAULT_PITCHIQ_STATE.profile.ballType,
    environment: wsData.environment || DEFAULT_PITCHIQ_STATE.profile.environment,
    goals: Array.isArray(wsData.goals) ? wsData.goals : DEFAULT_PITCHIQ_STATE.profile.goals,
    dailyMinutes: Number(wsData.dailyMinutes) || DEFAULT_PITCHIQ_STATE.profile.dailyMinutes,
    trainingDaysPerWeek: Number(wsData.trainingDaysPerWeek) || DEFAULT_PITCHIQ_STATE.profile.trainingDaysPerWeek,
    language: wsData.language || DEFAULT_PITCHIQ_STATE.profile.language,
    equipment: Array.isArray(wsData.equipment) ? wsData.equipment : DEFAULT_PITCHIQ_STATE.profile.equipment,
    onboardingCompleted: Boolean(wsData.onboardingCompleted),
  };

  const playzoneSessions: PlayZoneSession[] = playzoneDocs
    .map((d) => {
      const p = d.data();
      return {
        id: d.id,
        createdAt: String(p.clientCreatedAt || p.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString()),
        gameType: 'batting_challenge',
        challengeBalls: p.challengeBalls === 12 ? 12 : 6,
        difficulty: p.difficulty === 'Beginner' || p.difficulty === 'Pro' ? p.difficulty : 'Intermediate',
        totalRuns: Number(p.totalRuns) || 0,
        ballsFaced: Number(p.ballsFaced) || 0,
        successfulShots: Number(p.successfulShots) || 0,
        missedDeliveries: Number(p.missedDeliveries) || 0,
        wickets: Number(p.wickets) || 0,
        timingScore: Number(p.timingScore) || 0,
        suggestedDrillId: p.suggestedDrillId ? String(p.suggestedDrillId) : undefined,
      } as PlayZoneSession;
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return {
    profile: hydratedProfile,
    completedLessonIds: Array.isArray(wsData.completedLessonIds) ? wsData.completedLessonIds : [],
    completedExerciseIds: Array.isArray(wsData.completedExerciseIds) ? wsData.completedExerciseIds : [],
    savedExerciseIds: Array.isArray(wsData.savedExerciseIds) ? wsData.savedExerciseIds : [],
    savedTutorialIds: Array.isArray(wsData.savedTutorialIds) ? wsData.savedTutorialIds : [],
    bookmarkedTipIds: Array.isArray(wsData.bookmarkedTipIds) ? wsData.bookmarkedTipIds : [],
    exerciseNotes: wsData.exerciseNotes && typeof wsData.exerciseNotes === 'object' ? wsData.exerciseNotes : {},
    reports,
    savedVideos,
    activeTrainingPlan: plans[0] || null,
    trainingHistory,
    coachMessages,
    turfRules:
      wsData.turfRules && typeof wsData.turfRules === 'object'
        ? { ...DEFAULT_PITCHIQ_STATE.turfRules, ...wsData.turfRules }
        : DEFAULT_PITCHIQ_STATE.turfRules,
    quizHighScores:
      wsData.quizHighScores && typeof wsData.quizHighScores === 'object' ? wsData.quizHighScores : {},
    completedChallenges: Array.isArray(wsData.completedChallenges) ? wsData.completedChallenges : [],
    squadPlayers: squadPlayers.length > 0 ? squadPlayers : DEFAULT_PITCHIQ_STATE.squadPlayers,
    playzoneSessions,
  };
}
