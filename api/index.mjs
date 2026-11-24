import app from '../lib/apiApp.mjs';

export default function handler(req, res) {
  try {
    if (typeof req.url === 'string' && (req.url === '/api/index' || req.url.startsWith('/api/index?'))) {
      const originalPath =
        req.headers['x-vercel-original-uri'] ||
        req.headers['x-invoke-path'] ||
        req.headers['x-matched-path'];
      if (typeof originalPath === 'string' && originalPath.startsWith('/api/') && !originalPath.startsWith('/api/index')) {
        req.url = originalPath;
      }
    }
    return app(req, res);
  } catch (err) {
    console.error('[CRICKIFY API] Unhandled invocation error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: err instanceof Error ? err.message : 'Unexpected server invocation error.',
          code: 'INTERNAL_ERROR',
          retryable: true,
        })
      );
    }
  }
}
