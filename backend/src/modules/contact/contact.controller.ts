import type { Request, Response, NextFunction } from 'express';
import * as service from './contact.service';

export async function submit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(201).json({ data: await service.submitMessage(req.body) });
  } catch (err) { next(err); }
}

export async function list(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.listMessages() });
  } catch (err) { next(err); }
}
