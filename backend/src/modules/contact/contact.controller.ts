import type { Request, Response, NextFunction } from 'express';
import * as service from './contact.service';

export async function list(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.listContacts() });
  } catch (err) { next(err); }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.getContact(parseInt(req.params['id']!, 10)) });
  } catch (err) { next(err); }
}

export async function listByLawyer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.getContactsByLawyer(parseInt(req.params['lawyerId']!, 10)) });
  } catch (err) { next(err); }
}

export async function listByClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.getContactsByClient(parseInt(req.params['clientId']!, 10)) });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(201).json({ data: await service.createContact(req.body) });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.updateContact(parseInt(req.params['id']!, 10), req.body) });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await service.deleteContact(parseInt(req.params['id']!, 10));
    res.status(204).send();
  } catch (err) { next(err); }
}
