import type { Request, Response, NextFunction } from 'express';
import * as service from './clients.service';

export async function list(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.listClients() });
  } catch (err) { next(err); }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.getClient(req.params['id']!) });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(201).json({ data: await service.createClient(req.body) });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.updateClient(req.params['id']!, req.body) });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await service.deleteClient(req.params['id']!);
    res.status(204).send();
  } catch (err) { next(err); }
}
