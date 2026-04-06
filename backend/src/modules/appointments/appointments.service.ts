import * as repository from './appointments.repository';
import { normalizeToUTC } from '../../shared/services/timezone/timezoneService';
import { assertValidDate } from '../../shared/utils/dateUtils';
import { HttpError } from '../../shared/types';
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from '../../shared/types';

/**
 * Service layer — all business logic lives here.
 *
 * Responsibilities:
 *  - Validate input
 *  - Normalize datetimes to UTC before persistence
 *  - Detect scheduling conflicts
 *  - Delegate all data access to the repository
 */

export async function listAppointments(query: { limit?: number; offset?: number } = {}): Promise<Appointment[]> {
  return repository.findAll(query);
}

export async function getAppointment(id: string): Promise<Appointment> {
  const appointment = await repository.findById(id);
  if (!appointment) {
    throw new HttpError(`Appointment not found: ${id}`, 404);
  }
  return appointment;
}

export async function createAppointment(dto: CreateAppointmentDto): Promise<Appointment> {
  const { clientId, lawyerId, startsAt, endsAt, timezone, notes } = dto;

  assertValidDate(startsAt, 'startsAt');
  assertValidDate(endsAt, 'endsAt');

  const [utcStart, utcEnd] = await Promise.all([
    normalizeToUTC(startsAt, timezone),
    normalizeToUTC(endsAt, timezone),
  ]);

  if (new Date(utcStart) >= new Date(utcEnd)) {
    throw new HttpError('endsAt must be after startsAt', 400);
  }

  const conflicts = await repository.findOverlapping(utcStart, utcEnd);
  if (conflicts.length > 0) {
    const err = new HttpError('The selected time slot overlaps with an existing appointment', 409);
    err.conflicts = conflicts;
    throw err;
  }

  return repository.create({
    client_id: clientId,
    lawyer_id: lawyerId,
    starts_at: utcStart,
    ends_at: utcEnd,
    status: 'scheduled',
    notes: notes ?? null,
  });
}

export async function updateAppointment(id: string, dto: UpdateAppointmentDto): Promise<Appointment | null> {
  // Single fetch — reused for both existence check and current values
  const current = await getAppointment(id);

  const payload: Partial<Omit<Appointment, 'id' | 'created_at'>> = {};

  if (dto.startsAt !== undefined || dto.endsAt !== undefined) {
    const rawStart = dto.startsAt ?? current.starts_at;
    const rawEnd = dto.endsAt ?? current.ends_at;
    const timezone = dto.timezone;

    assertValidDate(rawStart, 'startsAt');
    assertValidDate(rawEnd, 'endsAt');

    const [utcStart, utcEnd] = await Promise.all([
      normalizeToUTC(rawStart, timezone),
      normalizeToUTC(rawEnd, timezone),
    ]);

    if (new Date(utcStart) >= new Date(utcEnd)) {
      throw new HttpError('endsAt must be after startsAt', 400);
    }

    const conflicts = await repository.findOverlapping(utcStart, utcEnd, id);
    if (conflicts.length > 0) {
      const err = new HttpError('The selected time slot overlaps with an existing appointment', 409);
      err.conflicts = conflicts;
      throw err;
    }

    payload.starts_at = utcStart;
    payload.ends_at = utcEnd;
  }

  if (dto.status !== undefined) payload.status = dto.status as Appointment['status'];
  if (dto.notes !== undefined) payload.notes = dto.notes;
  if (dto.clientId !== undefined) payload.client_id = dto.clientId;
  if (dto.lawyerId !== undefined) payload.lawyer_id = dto.lawyerId;

  return repository.update(id, payload);
}

export async function cancelAppointment(id: string): Promise<Appointment | null> {
  await getAppointment(id);
  return repository.update(id, { status: 'cancelled' });
}

export async function deleteAppointment(id: string): Promise<void> {
  await getAppointment(id);
  await repository.remove(id);
}
