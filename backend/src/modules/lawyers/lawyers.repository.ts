import { getSupabaseClient } from '../../shared/database/supabaseClient';
import { dbError } from '../../shared/database/dbError';
import type { Lawyer } from '../../shared/types';

const TABLE = 't_lawyers';
const PK = 'id_lawyer';

export async function findAll(): Promise<Lawyer[]> {
  const { data, error } = await getSupabaseClient().from(TABLE).select('*').order('full_name');
  if (error) throw dbError(error);
  return data as Lawyer[];
}

export async function findById(id: number): Promise<Lawyer | null> {
  const { data, error } = await getSupabaseClient().from(TABLE).select('*').eq(PK, id).single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw dbError(error);
  return data as Lawyer;
}

export async function create(payload: Omit<Lawyer, 'id_lawyer'>): Promise<Lawyer> {
  const { data, error } = await getSupabaseClient().from(TABLE).insert(payload).select().single();
  if (error) throw dbError(error);
  return data as Lawyer;
}

export async function update(id: number, payload: Partial<Omit<Lawyer, 'id_lawyer'>>): Promise<Lawyer | null> {
  const { data, error } = await getSupabaseClient().from(TABLE).update(payload).eq(PK, id).select().single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw dbError(error);
  return data as Lawyer;
}

export async function remove(id: number): Promise<void> {
  const { error } = await getSupabaseClient().from(TABLE).delete().eq(PK, id);
  if (error) throw dbError(error);
}
