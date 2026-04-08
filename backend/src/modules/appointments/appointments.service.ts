import * as repository from './appointments.repository';
import * as workingScheduleRepo from '../working-schedule/workingSchedule.repository';
import * as vacationsRepo from '../vacations/vacations.repository';
import * as lawyersRepo from '../lawyers/lawyers.repository';
import * as clientsRepo from '../clients/clients.repository';
import * as contactRepo from '../contact/contact.repository';
import { normalizeToUTC } from '../../shared/services/timezone/timezoneService';
import { assertValidDate } from '../../shared/utils/dateUtils';
import { HttpError } from '../../shared/types';
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from '../../shared/types';

// ─── Timezone helpers (pure JS — no external API call needed) ─────────────────

/**
 * Given a UTC ISO string and an IANA timezone, returns:
 *  - dayOfWeek : e.g. "Monday"
 *  - timeStr   : "HH:mm:ss" in the local timezone
 *  - dateStr   : "YYYY-MM-DD" in the local timezone
 */
function utcToLocalInfo(utcIso: string, tz: string) {
  const d = new Date(utcIso);
  const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: tz });
  const timeStr   = d.toLocaleTimeString('en-GB', { hour12: false, timeZone: tz }); // "HH:mm:ss"
  const dateStr   = d.toLocaleDateString('en-CA', { timeZone: tz });                // "YYYY-MM-DD"
  return { dayOfWeek, timeStr, dateStr };
}

// ─── Working-hours & vacation validation ──────────────────────────────────────

async function assertWithinWorkingHours(
  idLawyer: number,
  utcStart: string,
  utcEnd: string,
) {
  const lawyer = await lawyersRepo.findById(idLawyer);
  if (!lawyer) throw new HttpError(`Lawyer not found: ${idLawyer}`, 404);

  const tz = lawyer.timezone || 'UTC';

  const startInfo = utcToLocalInfo(utcStart, tz);
  const endInfo   = utcToLocalInfo(utcEnd,   tz);

  // ── 1. Validate working schedule ────────────────────────────────────────────
  const schedule = await workingScheduleRepo.findByLawyer(idLawyer);
  const daySlot  = schedule.find((s) => s.day_of_week === startInfo.dayOfWeek);

  if (!daySlot) {
    throw new HttpError(
      `${lawyer.full_name} no tiene horario laboral configurado para el ${startInfo.dayOfWeek}.`,
      422,
    );
  }

  // Compare as "HH:mm:ss" strings — lexicographic order is correct for 24h time
  if (startInfo.timeStr < daySlot.start_time) {
    throw new HttpError(
      `El horario de inicio (${startInfo.timeStr}) es anterior al horario de entrada del abogado (${daySlot.start_time}) el ${startInfo.dayOfWeek}.`,
      422,
    );
  }
  if (endInfo.timeStr > daySlot.end_time) {
    throw new HttpError(
      `El horario de fin (${endInfo.timeStr}) excede el horario de salida del abogado (${daySlot.end_time}) el ${startInfo.dayOfWeek}.`,
      422,
    );
  }

  // ── 2. Validate vacations ────────────────────────────────────────────────────
  const vacations   = await vacationsRepo.findByLawyer(idLawyer);
  const apptDate    = startInfo.dateStr; // "YYYY-MM-DD"

  const vacConflict = vacations.find(
    (v) => apptDate >= v.start_date && apptDate <= v.end_date,
  );
  if (vacConflict) {
    throw new HttpError(
      `${lawyer.full_name} está de vacaciones desde el ${vacConflict.start_date} hasta el ${vacConflict.end_date}.`,
      422,
    );
  }
}

// ─── Client business-hours validation ────────────────────────────────────────

/**
 * Checks that the appointment falls within the client's own business hours
 * (fixed window 09:00–18:00 in the client's timezone, Monday–Friday).
 *
 * Clients share the same 9-to-6 constraint as lawyers but don't have an
 * editable schedule in T_WORKING_SCHEDULE, so we apply the standard window
 * directly using their stored IANA timezone.
 */
async function assertClientWithinBusinessHours(
  idClient: number,
  utcStart: string,
  utcEnd: string,
) {
  const client = await clientsRepo.findById(idClient);
  if (!client) throw new HttpError(`Client not found: ${idClient}`, 404);

  const tz = client.timezone || 'UTC';

  const startInfo = utcToLocalInfo(utcStart, tz);
  const endInfo   = utcToLocalInfo(utcEnd,   tz);

  const WORK_START = '09:00:00';
  const WORK_END   = '18:00:00';

  // ── 1. Check weekday ─────────────────────────────────────────────────────────
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  if (!weekdays.includes(startInfo.dayOfWeek)) {
    throw new HttpError(
      `El cliente "${client.trade_name}" no tiene disponibilidad los ${startInfo.dayOfWeek} (solo trabaja de lunes a viernes).`,
      422,
    );
  }

  // ── 2. Check start time ──────────────────────────────────────────────────────
  if (startInfo.timeStr < WORK_START) {
    throw new HttpError(
      `El horario de inicio (${startInfo.timeStr} en la zona horaria del cliente "${client.trade_name}" — ${tz}) es anterior al inicio de su jornada laboral (${WORK_START}).`,
      422,
    );
  }

  // ── 3. Check end time ────────────────────────────────────────────────────────
  if (endInfo.timeStr > WORK_END) {
    throw new HttpError(
      `El horario de fin (${endInfo.timeStr} en la zona horaria del cliente "${client.trade_name}" — ${tz}) excede el fin de su jornada laboral (${WORK_END}).`,
      422,
    );
  }
}

// ─── Contact-method compatibility validation ──────────────────────────────────

async function assertContactCompatibility(
  idLawyer: number,
  idClient: number,
  idSelectedContact: number,
) {
  const contact = await contactRepo.findById(idSelectedContact);
  if (!contact) {
    throw new HttpError(`Contact not found: ${idSelectedContact}`, 404);
  }

  // The selected contact must belong to the lawyer
  if (contact.id_lawyer !== idLawyer) {
    throw new HttpError(
      'El contacto seleccionado no pertenece al abogado indicado.',
      422,
    );
  }

  // The client must also have the same method type configured
  const clientContacts = await contactRepo.findByClient(idClient);
  const clientHasMethod = clientContacts.some(
    (c) => c.method_type === contact.method_type,
  );

  if (!clientHasMethod) {
    throw new HttpError(
      `No se puede crear la cita: el abogado y el cliente no comparten ningún método de contacto compatible (método del abogado: ${contact.method_type}).`,
      422,
    );
  }

  // ── InPerson: la ciudad (value) de ambos contactos debe coincidir ────────────
  if (contact.method_type === 'InPerson') {
    // clientHasMethod already guarantees this contact exists
    const clientInPerson = clientContacts.find((c) => c.method_type === 'InPerson')!;

    if (contact.value !== clientInPerson.value) {
      throw new HttpError(
        `Para una cita presencial (InPerson), las ubicaciones deben ser las mismas. Ciudad del abogado: "${contact.value}", ciudad del cliente: "${clientInPerson.value}".`,
        422,
      );
    }
  }
}

// ─── Service functions ────────────────────────────────────────────────────────

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

  // ── Validate lawyer working hours and vacations ──────────────────────────────
  await assertWithinWorkingHours(idLawyer, utcStart, utcEnd);

  // ── Validate client business hours ───────────────────────────────────────────
  await assertClientWithinBusinessHours(idClient, utcStart, utcEnd);

  // ── Validate contact-method compatibility ────────────────────────────────────
  await assertContactCompatibility(idLawyer, idClient, idSelectedContact);

  // ── Validate no overlap with existing appointments ───────────────────────────
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
    const rawEnd   = dto.endDatetime   ?? current.end_datetime;
    const timezone = dto.timezone;

    assertValidDate(rawStart, 'startDatetime');
    assertValidDate(rawEnd,   'endDatetime');

    const [utcStart, utcEnd] = await Promise.all([
      normalizeToUTC(rawStart, timezone),
      normalizeToUTC(rawEnd,   timezone),
    ]);

    if (new Date(utcStart) >= new Date(utcEnd)) {
      throw new HttpError('endDatetime must be after startDatetime', 400);
    }

    // Determine which lawyer to validate against (may be changing)
    const lawyerId = dto.idLawyer ?? current.id_lawyer;

    // ── Validate lawyer working hours and vacations ──────────────────────────
    await assertWithinWorkingHours(lawyerId, utcStart, utcEnd);

    // ── Validate client business hours ────────────────────────────────────────
    const clientId = dto.idClient ?? current.id_client;
    await assertClientWithinBusinessHours(clientId, utcStart, utcEnd);

    // ── Validate contact-method compatibility ─────────────────────────────────
    const selectedContact = dto.idSelectedContact ?? current.id_selected_contact;
    await assertContactCompatibility(lawyerId, clientId, selectedContact);

    // ── Validate no overlap ──────────────────────────────────────────────────
    const conflicts = await repository.findOverlapping(utcStart, utcEnd, id);
    if (conflicts.length > 0) {
      const err = new HttpError('The selected time slot overlaps with an existing appointment', 409);
      err.conflicts = conflicts;
      throw err;
    }

    payload.start_datetime = utcStart;
    payload.end_datetime   = utcEnd;
  }

  if (dto.subject            !== undefined) payload.subject              = dto.subject;
  if (dto.description        !== undefined) payload.description          = dto.description ?? null;
  if (dto.idLawyer           !== undefined) payload.id_lawyer            = dto.idLawyer;
  if (dto.idClient           !== undefined) payload.id_client            = dto.idClient;
  if (dto.idSelectedContact  !== undefined) payload.id_selected_contact  = dto.idSelectedContact;

  return repository.update(id, payload);
}

export async function deleteAppointment(id: number): Promise<void> {
  await getAppointment(id);
  await repository.remove(id);
}
