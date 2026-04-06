import { getSupabaseClient } from '../../shared/database/supabaseClient';
import { dbError } from '../../shared/database/dbError';
import type { Appointment } from '../../shared/types';

const TABLE = 't_appointments';
const PK = 'id_appointment';

type ConflictInfo = Pick<Appointment, 'id_appointment' | 'start_datetime' | 'end_datetime'>;
type AppointmentPayload = Omit<Appointment, 'id_appointment'>;

export async function findAll({ limit = 50, offset = 0 } = {}): Promise<Appointment[]> {
  const { data, error } = await getSupabaseClient()
    .from(TABLE)
    .select('*')
    .order('start_datetime', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw dbError(error);
  return data as Appointment[];
}

export async function findById(id: number): Promise<Appointment | null> {
  const { data, error } = await getSupabaseClient()
    .from(TABLE)
    .select('*')
    .eq(PK, id)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw dbError(error);
  return data as Appointment;
}

/**
 * Find appointments that overlap with the given time range.
 * Used by the service layer to detect scheduling conflicts.
 *
 * @param startDatetime - UTC ISO string
 * @param endDatetime   - UTC ISO string
 * @param excludeId     - Appointment id to exclude (for updates)
 */
export async function findOverlapping(
  startDatetime: string,
  endDatetime: string,
  excludeId: number | null = null,
): Promise<ConflictInfo[]> {
  let query = getSupabaseClient()
    .from(TABLE)
    .select('id_appointment, start_datetime, end_datetime')
    .lt('start_datetime', endDatetime)
    .gt('end_datetime', startDatetime);

  if (excludeId !== null) {
    query = query.neq(PK, excludeId);
  }

  const { data, error } = await query;
  if (error) throw dbError(error);
  return data as ConflictInfo[];
}

export async function create(payload: AppointmentPayload): Promise<Appointment> {
  const { data, error } = await getSupabaseClient()
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) throw dbError(error);
  return data as Appointment;
}

export async function update(
  id: number,
  payload: Partial<AppointmentPayload>,
): Promise<Appointment | null> {
  const { data, error } = await getSupabaseClient()
    .from(TABLE)
    .update(payload)
    .eq(PK, id)
    .select()
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw dbError(error);
  return data as Appointment;
}

export async function remove(id: number): Promise<void> {
  const { error } = await getSupabaseClient().from(TABLE).delete().eq(PK, id);
  if (error) throw dbError(error);
}
