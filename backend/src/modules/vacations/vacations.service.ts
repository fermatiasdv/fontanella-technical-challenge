import * as repository from './vacations.repository';
import { assertValidDate } from '../../shared/utils/dateUtils';
import { HttpError } from '../../shared/types';
import type { Vacation, AddVacationDto } from '../../shared/types';

export async function getVacations(lawyerId: number): Promise<Vacation[]> {
  return repository.findByLawyer(lawyerId);
}

export async function addVacation(lawyerId: number, dto: AddVacationDto): Promise<Vacation> {
  const { startDate, endDate } = dto;

  if (!startDate || !endDate) {
    throw new HttpError('startDate and endDate are required', 400);
  }

  assertValidDate(startDate, 'startDate');
  assertValidDate(endDate, 'endDate');

  if (new Date(startDate) > new Date(endDate)) {
    throw new HttpError('endDate must be on or after startDate', 400);
  }

  return repository.create({
    id_lawyer: lawyerId,
    start_date: startDate,
    end_date: endDate,
  });
}

export async function removeVacation(id: number): Promise<void> {
  await repository.remove(id);
}
