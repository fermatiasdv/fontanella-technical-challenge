import { getSupabaseClient } from '../../shared/database/supabaseClient';
import { dbError } from '../../shared/database/dbError';
import type { Lawyer } from '../../shared/types';

const TABLE = 'lawyers';

export async function findAll(): Promise<Lawyer[]> {
  const { data, error } = await getSupabaseClient().from(TABLE).select('*').order('last_name');
  if (error) throw dbError(error);
  return data as Lawyer[];
}

export async function findById(id: string): Promise<Lawyer | null> {
  const { data, error } = await getSupabaseClient().from(TABLE).select('*').eq('id', id).single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw dbError(error);
  return data as Lawyer;
}

export async function create(payload: Omit<Lawyer, 'id' | 'created_at'>): Promise<Lawyer> {
  const { data, error } = await getSupabaseClient().from(TABLE).insert(payload).select().single();
  if (error) throw dbError(error);
  return data as Lawyer;
}

export async function update(id: string, payload: Partial<Omit<Lawyer, 'id' | 'created_at'>>): Promise<Lawyer | null> {
  const { data, error } = await getSupabaseClient().from(TABLE).update(payload).eq('id', id).select().single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw dbError(error);
  return data as Lawyer;
}

export async function remove(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from(TABLE).delete().eq('id', id);
  if (error) throw dbError(error);
}
