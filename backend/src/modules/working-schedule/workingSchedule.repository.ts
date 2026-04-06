import { getSupabaseClient } from '../../shared/database/supabaseClient';
import { dbError } from '../../shared/database/dbError';
import type { WorkingSchedule } from '../../shared/types';

const TABLE = 't_working_schedule';
const PK = 'id_working_schedule';

export async function findByLawyer(lawyerId: number): Promise<WorkingSchedule[]> {
  const { data, error } = await getSupabaseClient()
    .from(TABLE)
    .select('*')
    .eq('id_lawyer', lawyerId)
    .order('day_of_week');
  if (error) throw dbError(error);
  return data as WorkingSchedule[];
}

export async function upsert(
  payload: Omit<WorkingSchedule, 'id_working_schedule'>[],
): Promise<WorkingSchedule[]> {
  const { data, error } = await getSupabaseClient()
    .from(TABLE)
    .upsert(payload, { onConflict: 'id_lawyer,day_of_week' })
    .select();
  if (error) throw dbError(error);
  return data as WorkingSchedule[];
}

export async function remove(id: number): Promise<void> {
  const { error } = await getSupabaseClient().from(TABLE).delete().eq(PK, id);
  if (error) throw dbError(error);
}
