import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { app, getConfiguredModels } from './lib/apiApp.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

const wasmDir = path.resolve(__dirname, 'node_modules/@mediapipe/tasks-vision/wasm');
if (fs.existsSync(wasmDir)) {
  app.use('/mediapipe-wasm', express.static(wasmDir));
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CRICKIFY server running on http://0.0.0.0:${PORT} (models: ${getConfiguredModels().join(' -> ')})`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
