import type { Request, Response, NextFunction } from 'express';
import * as service from './workingSchedule.service';

export async function getSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.getSchedule(req.params['lawyerId']!) });
  } catch (err) { next(err); }
}

export async function setSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await service.setSchedule(req.params['lawyerId']!, req.body.slots);
    res.json({ data: result });
  } catch (err) { next(err); }
}

export async function removeSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await service.removeSlot(req.params['id']!);
    res.status(204).send();
  } catch (err) { next(err); }
}
