import { getSupabaseClient } from '../../shared/database/supabaseClient';
import { dbError } from '../../shared/database/dbError';
import type { Vacation } from '../../shared/types';

const TABLE = 't_vacations';
const PK = 'id_vacation';

export async function findByLawyer(lawyerId: number): Promise<Vacation[]> {
  const { data, error } = await getSupabaseClient()
    .from(TABLE)
    .select('*')
    .eq('id_lawyer', lawyerId)
    .order('start_date');
  if (error) throw dbError(error);
  return data as Vacation[];
}

export async function create(payload: Omit<Vacation, 'id_vacation'>): Promise<Vacation> {
  const { data, error } = await getSupabaseClient().from(TABLE).insert(payload).select().single();
  if (error) throw dbError(error);
  return data as Vacation;
}

export async function remove(id: number): Promise<void> {
  const { error } = await getSupabaseClient().from(TABLE).delete().eq(PK, id);
  if (error) throw dbError(error);
}
