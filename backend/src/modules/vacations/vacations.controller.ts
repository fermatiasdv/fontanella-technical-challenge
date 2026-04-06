import type { Request, Response, NextFunction } from 'express';
import * as service from './vacations.service';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.getVacations(req.params['lawyerId']!) });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await service.addVacation(req.params['lawyerId']!, req.body);
    res.status(201).json({ data: result });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await service.removeVacation(req.params['id']!);
    res.status(204).send();
  } catch (err) { next(err); }
}
