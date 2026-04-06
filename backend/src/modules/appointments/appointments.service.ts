import * as repository from './appointments.repository';
import { normalizeToUTC } from '../../shared/services/timezone/timezoneService';
import { assertValidDate } from '../../shared/utils/dateUtils';
import { HttpError } from '../../shared/types';
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from '../../shared/types';

export async function listAppointments(query: { limit?: number; offset?: number } = {}): Promise<Appointment[]> {
  return repository.findAll(query);
}

export async function getAppointment(id: number): Promise<Appointment> {
  const appointment = await repository.findById(id);
  if (!appointment) {
    throw new HttpError(`Appointment not found: ${id}`, 404);
  }
  return appointment;
}

export async function createAppointment(dto: CreateAppointmentDto): Promise<Appointment> {
  const { idLawyer, idClient, idSelectedContact, subject, description, startDatetime, endDatetime, timezone } = dto;

  if (!subject) throw new HttpError('subject is required', 400);
  assertValidDate(startDatetime, 'startDatetime');
  assertValidDate(endDatetime, 'endDatetime');

  const [utcStart, utcEnd] = await Promise.all([
    normalizeToUTC(startDatetime, timezone),
    normalizeToUTC(endDatetime, timezone),
  ]);

  if (new Date(utcStart) >= new Date(utcEnd)) {
    throw new HttpError('endDatetime must be after startDatetime', 400);
  }

  const conflicts = await repository.findOverlapping(utcStart, utcEnd);
  if (conflicts.length > 0) {
    const err = new HttpError('The selected time slot overlaps with an existing appointment', 409);
    err.conflicts = conflicts;
    throw err;
  }

  return repository.create({
    id_lawyer: idLawyer,
    id_client: idClient,
    id_selected_contact: idSelectedContact,
    subject,
    description: description ?? null,
    start_datetime: utcStart,
    end_datetime: utcEnd,
  });
}

export async function updateAppointment(id: number, dto: UpdateAppointmentDto): Promise<Appointment | null> {
  const current = await getAppointment(id);

  const payload: Partial<Omit<Appointment, 'id_appointment'>> = {};

  if (dto.startDatetime !== undefined || dto.endDatetime !== undefined) {
    const rawStart = dto.startDatetime ?? current.start_datetime;
    const rawEnd = dto.endDatetime ?? current.end_datetime;
    const timezone = dto.timezone;

    assertValidDate(rawStart, 'startDatetime');
    assertValidDate(rawEnd, 'endDatetime');

    const [utcStart, utcEnd] = await Promise.all([
      normalizeToUTC(rawStart, timezone),
      normalizeToUTC(rawEnd, timezone),
    ]);

    if (new Date(utcStart) >= new Date(utcEnd)) {
      throw new HttpError('endDatetime must be after startDatetime', 400);
    }

    const conflicts = await repository.findOverlapping(utcStart, utcEnd, id);
    if (conflicts.length > 0) {
      const err = new HttpError('The selected time slot overlaps with an existing appointment', 409);
      err.conflicts = conflicts;
      throw err;
    }

    payload.start_datetime = utcStart;
    payload.end_datetime = utcEnd;
  }

  if (dto.subject !== undefined) payload.subject = dto.subject;
  if (dto.description !== undefined) payload.description = dto.description ?? null;
  if (dto.idLawyer !== undefined) payload.id_lawyer = dto.idLawyer;
  if (dto.idClient !== undefined) payload.id_client = dto.idClient;
  if (dto.idSelectedContact !== undefined) payload.id_selected_contact = dto.idSelectedContact;

  return repository.update(id, payload);
}

export async function deleteAppointment(id: number): Promise<void> {
  await getAppointment(id);
  await repository.remove(id);
}
