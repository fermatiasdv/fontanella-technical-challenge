import type { Request, Response, NextFunction } from 'express';
import * as service from './vacations.service';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.getVacations(parseInt(req.params['lawyerId']!, 10)) });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await service.addVacation(parseInt(req.params['lawyerId']!, 10), req.body);
    res.status(201).json({ data: result });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await service.removeVacation(parseInt(req.params['id']!, 10));
    res.status(204).send();
  } catch (err) { next(err); }
}
