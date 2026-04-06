import * as repository from './workingSchedule.repository';
import { HttpError } from '../../shared/types';
import type { WorkingSchedule, WorkingScheduleSlotDto } from '../../shared/types';

export async function getSchedule(lawyerId: string): Promise<WorkingSchedule[]> {
  return repository.findByLawyer(lawyerId);
}

export async function setSchedule(
  lawyerId: string,
  slots: WorkingScheduleSlotDto[],
): Promise<WorkingSchedule[]> {
  if (!Array.isArray(slots) || slots.length === 0) {
    throw new HttpError('slots must be a non-empty array', 400);
  }

  const payload: Omit<WorkingSchedule, 'id'>[] = slots.map((slot) => ({
    lawyer_id: lawyerId,
    day_of_week: slot.dayOfWeek,
    start_time: slot.startTime,
    end_time: slot.endTime,
  }));

  return repository.upsert(payload);
}

export async function removeSlot(id: string): Promise<void> {
  await repository.remove(id);
}
