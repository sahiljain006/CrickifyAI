import type { Express } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';

export declare const app: Express;
export declare function getConfiguredModels(): string[];
export default function handler(req: IncomingMessage, res: ServerResponse): void;
