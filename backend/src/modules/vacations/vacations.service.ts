import * as repository from './vacations.repository';
import { assertValidDate } from '../../shared/utils/dateUtils';
import { HttpError } from '../../shared/types';
import type { Vacation, AddVacationDto } from '../../shared/types';

export async function getVacations(lawyerId: string): Promise<Vacation[]> {
  return repository.findByLawyer(lawyerId);
}

export async function addVacation(lawyerId: string, dto: AddVacationDto): Promise<Vacation> {
  const { startsOn, endsOn, reason } = dto;

  if (!startsOn || !endsOn) {
    throw new HttpError('startsOn and endsOn are required', 400);
  }

  assertValidDate(startsOn, 'startsOn');
  assertValidDate(endsOn, 'endsOn');

  if (new Date(startsOn) > new Date(endsOn)) {
    throw new HttpError('endsOn must be on or after startsOn', 400);
  }

  return repository.create({
    lawyer_id: lawyerId,
    starts_on: startsOn,
    ends_on: endsOn,
    reason: reason ?? null,
  });
}

export async function removeVacation(id: string): Promise<void> {
  await repository.remove(id);
}
