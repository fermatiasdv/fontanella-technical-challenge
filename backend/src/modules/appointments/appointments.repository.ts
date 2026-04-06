import { getSupabaseClient } from '../../shared/database/supabaseClient';
import { dbError } from '../../shared/database/dbError';
import type { Appointment } from '../../shared/types';

const TABLE = 'appointments';

type ConflictInfo = Pick<Appointment, 'id' | 'starts_at' | 'ends_at'>;
type AppointmentPayload = Omit<Appointment, 'id' | 'created_at'>;

/**
 * Repository layer — all Supabase queries live here.
 * No business logic. No timezone conversions. Pure data access.
 *
 * Dates stored/returned are always UTC ISO strings (TIMESTAMPTZ).
 */

export async function findAll({ limit = 50, offset = 0 } = {}): Promise<Appointment[]> {
  const { data, error } = await getSupabaseClient()
    .from(TABLE)
    .select('*')
    .order('starts_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw dbError(error);
  return data as Appointment[];
}

export async function findById(id: string): Promise<Appointment | null> {
  const { data, error } = await getSupabaseClient()
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw dbError(error);
  return data as Appointment;
}

/**
 * Find appointments that overlap with the given time range.
 * Used by the service layer to detect scheduling conflicts.
 *
 * @param startsAt  - UTC ISO string
 * @param endsAt    - UTC ISO string
 * @param excludeId - Appointment id to exclude (for updates)
 */
export async function findOverlapping(
  startsAt: string,
  endsAt: string,
  excludeId: string | null = null,
): Promise<ConflictInfo[]> {
  let query = getSupabaseClient()
    .from(TABLE)
    .select('id, starts_at, ends_at')
    .lt('starts_at', endsAt)
    .gt('ends_at', startsAt)
    .neq('status', 'cancelled');

  if (excludeId) {
    query = query.neq('id', excludeId);
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
  id: string,
  payload: Partial<AppointmentPayload>,
): Promise<Appointment | null> {
  const { data, error } = await getSupabaseClient()
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw dbError(error);
  return data as Appointment;
}

export async function remove(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from(TABLE).delete().eq('id', id);
  if (error) throw dbError(error);
}
