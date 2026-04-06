import { getSupabaseClient } from '../../shared/database/supabaseClient';
import { dbError } from '../../shared/database/dbError';
import type { WorkingSchedule } from '../../shared/types';

const TABLE = 'working_schedules';

export async function findByLawyer(lawyerId: string): Promise<WorkingSchedule[]> {
  const { data, error } = await getSupabaseClient()
    .from(TABLE)
    .select('*')
    .eq('lawyer_id', lawyerId)
    .order('day_of_week');
  if (error) throw dbError(error);
  return data as WorkingSchedule[];
}

export async function upsert(
  payload: Omit<WorkingSchedule, 'id'>[],
): Promise<WorkingSchedule[]> {
  const { data, error } = await getSupabaseClient()
    .from(TABLE)
    .upsert(payload, { onConflict: 'lawyer_id,day_of_week' })
    .select();
  if (error) throw dbError(error);
  return data as WorkingSchedule[];
}

export async function remove(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from(TABLE).delete().eq('id', id);
  if (error) throw dbError(error);
}
