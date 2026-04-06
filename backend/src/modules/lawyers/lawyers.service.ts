import * as repository from './lawyers.repository';
import { HttpError } from '../../shared/types';
import type { Lawyer } from '../../shared/types';

export async function listLawyers(): Promise<Lawyer[]> {
  return repository.findAll();
}

export async function getLawyer(id: number): Promise<Lawyer> {
  const lawyer = await repository.findById(id);
  if (!lawyer) {
    throw new HttpError(`Lawyer not found: ${id}`, 404);
  }
  return lawyer;
}

export async function createLawyer(dto: Omit<Lawyer, 'id_lawyer'>): Promise<Lawyer> {
  return repository.create(dto);
}

export async function updateLawyer(
  id: number,
  dto: Partial<Omit<Lawyer, 'id_lawyer'>>,
): Promise<Lawyer | null> {
  await getLawyer(id);
  return repository.update(id, dto);
}

export async function deleteLawyer(id: number): Promise<void> {
  await getLawyer(id);
  await repository.remove(id);
}
