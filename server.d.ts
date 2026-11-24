declare module './lib/apiApp.mjs' {
  import type { Express } from 'express';
  export const app: Express;
  export function getConfiguredModels(): string[];
  export default app;
}
