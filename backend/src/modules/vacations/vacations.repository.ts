import { getSupabaseClient } from '../../shared/database/supabaseClient';
import { dbError } from '../../shared/database/dbError';
import type { Vacation } from '../../shared/types';

const TABLE = 'vacations';

export async function findByLawyer(lawyerId: string): Promise<Vacation[]> {
  const { data, error } = await getSupabaseClient()
    .from(TABLE)
    .select('*')
    .eq('lawyer_id', lawyerId)
    .order('starts_on');
  if (error) throw dbError(error);
  return data as Vacation[];
}

export async function create(payload: Omit<Vacation, 'id'>): Promise<Vacation> {
  const { data, error } = await getSupabaseClient().from(TABLE).insert(payload).select().single();
  if (error) throw dbError(error);
  return data as Vacation;
}

export async function remove(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from(TABLE).delete().eq('id', id);
  if (error) throw dbError(error);
}
