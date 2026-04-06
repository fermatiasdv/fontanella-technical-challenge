import type { Request, Response, NextFunction } from 'express';
import config from '../config';
import type { HttpError } from '../types';

/**
 * Global error-handling middleware.
 * Must be registered LAST in the Express middleware chain (4-argument signature).
 *
 * Error shape clients always receive:
 * {
 *   status: number,
 *   message: string,
 *   ...(dev only) stack: string
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: HttpError, req: Request, res: Response, next: NextFunction): void {
  const status = err.statusCode ?? err.status ?? 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} — ${status}: ${message}`);
  if (err.stack && config.server.isDev) {
    console.error(err.stack);
  }

  const body: Record<string, unknown> = { status, message };

  if (config.server.isDev && err.stack) {
    body['stack'] = err.stack;
  }

  res.status(status).json(body);
}
