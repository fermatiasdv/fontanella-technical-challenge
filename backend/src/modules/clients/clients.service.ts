import * as repository from './clients.repository';
import { HttpError } from '../../shared/types';
import type { Client } from '../../shared/types';

export async function listClients(): Promise<Client[]> {
  return repository.findAll();
}

export async function getClient(id: string): Promise<Client> {
  const client = await repository.findById(id);
  if (!client) {
    throw new HttpError(`Client not found: ${id}`, 404);
  }
  return client;
}

export async function createClient(dto: Omit<Client, 'id' | 'created_at'>): Promise<Client> {
  return repository.create(dto);
}

export async function updateClient(
  id: string,
  dto: Partial<Omit<Client, 'id' | 'created_at'>>,
): Promise<Client | null> {
  await getClient(id);
  return repository.update(id, dto);
}

export async function deleteClient(id: string): Promise<void> {
  await getClient(id);
  await repository.remove(id);
}
