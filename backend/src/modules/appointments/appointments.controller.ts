import type { Request, Response, NextFunction } from 'express';
import * as service from './appointments.service';

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
    res.json({ data: await service.getAppointment(parseInt(req.params['id']!, 10)) });
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
    res.json({ data: await service.updateAppointment(parseInt(req.params['id']!, 10), req.body) });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await service.deleteAppointment(parseInt(req.params['id']!, 10));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
