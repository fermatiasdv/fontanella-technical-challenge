import type { Request, Response, NextFunction } from 'express';
import * as service from './lawyers.service';

export async function list(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.listLawyers() });
  } catch (err) { next(err); }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.getLawyer(parseInt(req.params['id']!, 10)) });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(201).json({ data: await service.createLawyer(req.body) });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.updateLawyer(parseInt(req.params['id']!, 10), req.body) });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await service.deleteLawyer(parseInt(req.params['id']!, 10));
    res.status(204).send();
  } catch (err) { next(err); }
}
