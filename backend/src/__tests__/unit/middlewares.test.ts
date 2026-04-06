/**
 * Unit tests for src/shared/middlewares/errorHandler.ts and notFound.ts
 */

import type { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../shared/types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeMocks() {
  const req = {
    method: 'GET',
    originalUrl: '/api/v1/test',
  } as unknown as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const next: NextFunction = jest.fn();

  return { req, res, next };
}

// ─── errorHandler ─────────────────────────────────────────────────────────────

describe('errorHandler', () => {
  const originalNodeEnv = process.env['NODE_ENV'];

  afterEach(() => {
    process.env['NODE_ENV'] = originalNodeEnv;
    jest.resetModules();
  });

  it('responds with the error statusCode and message', async () => {
    process.env['NODE_ENV'] = 'production';
    const { errorHandler } = await import('../../shared/middlewares/errorHandler');
    const { req, res, next } = makeMocks();
    const err = new HttpError('Not found', 404);

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 404, message: 'Not found' }));
  });

  it('defaults to 500 when statusCode is missing', async () => {
    process.env['NODE_ENV'] = 'production';
    const { errorHandler } = await import('../../shared/middlewares/errorHandler');
    const { req, res, next } = makeMocks();
    const err = { message: 'Oops' } as HttpError;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('uses err.status as fallback when statusCode is absent', async () => {
    process.env['NODE_ENV'] = 'production';
    const { errorHandler } = await import('../../shared/middlewares/errorHandler');
    const { req, res, next } = makeMocks();
    const err = { message: 'Forbidden', status: 403 } as HttpError;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('does not include stack in production', async () => {
    process.env['NODE_ENV'] = 'production';
    jest.resetModules();
    const { errorHandler } = await import('../../shared/middlewares/errorHandler');
    const { req, res, next } = makeMocks();
    const err = new HttpError('Error', 500);
    err.stack = 'Error\n  at test.ts:1:1';

    errorHandler(err, req, res, next);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body).not.toHaveProperty('stack');
  });

  it('includes stack in development mode', async () => {
    process.env['NODE_ENV'] = 'development';
    jest.resetModules();
    const { errorHandler } = await import('../../shared/middlewares/errorHandler');
    const { req, res, next } = makeMocks();
    const err = new HttpError('Dev error', 500);
    err.stack = 'Error\n  at test.ts:1:1';

    errorHandler(err, req, res, next);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body).toHaveProperty('stack');
  });

  it('uses default message when err.message is falsy', async () => {
    process.env['NODE_ENV'] = 'production';
    const { errorHandler } = await import('../../shared/middlewares/errorHandler');
    const { req, res, next } = makeMocks();
    const err = { message: '', statusCode: 500 } as unknown as HttpError;

    errorHandler(err, req, res, next);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.message).toBe('Internal Server Error');
  });
});

// ─── notFound ─────────────────────────────────────────────────────────────────

describe('notFound', () => {
  it('calls next with an HttpError 404', () => {
    const { notFound } = require('../../shared/middlewares/notFound');
    const { req, res, next } = makeMocks();

    notFound(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(HttpError);
    expect(err.statusCode).toBe(404);
  });

  it('includes the method and URL in the error message', () => {
    const { notFound } = require('../../shared/middlewares/notFound');
    const { req, res, next } = makeMocks();

    notFound(req, res, next);

    const err = (next as jest.Mock).mock.calls[0][0] as HttpError;
    expect(err.message).toContain('GET');
    expect(err.message).toContain('/api/v1/test');
  });
});
