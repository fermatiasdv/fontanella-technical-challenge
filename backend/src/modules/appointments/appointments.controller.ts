import type { Request, Response, NextFunction } from 'express';
import * as service from './appointments.service';

/**
 * Controller layer — handles HTTP request/response only.
 *
 * Rules:
 *  - No business logic here.
 *  - Extract params, body, query → call service → send response.
 *  - All errors forwarded to the global error handler via next(err).
 */

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { limit, offset } = req.query;
    const appointments = await service.listAppointments({
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    res.json({ data: appointments });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.getAppointment(req.params['id']!) });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(201).json({ data: await service.createAppointment(req.body) });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.updateAppointment(req.params['id']!, req.body) });
  } catch (err) {
    next(err);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.cancelAppointment(req.params['id']!) });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await service.deleteAppointment(req.params['id']!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
