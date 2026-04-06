import type { Request, Response, NextFunction } from 'express';
import { HttpError } from '../types';

/**
 * Catch-all for unmatched routes.
 * Returns a 404 JSON response and forwards to the error handler.
 */
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new HttpError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}
