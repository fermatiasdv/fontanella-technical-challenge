import { getSupabaseClient } from '../../shared/database/supabaseClient';
import { dbError } from '../../shared/database/dbError';
import type { Client } from '../../shared/types';

const TABLE = 't_clients';
const PK = 'id_client';

export async function findAll(): Promise<Client[]> {
  const { data, error } = await getSupabaseClient().from(TABLE).select('*').order('trade_name');
  if (error) throw dbError(error);
  return data as Client[];
}

export async function findById(id: number): Promise<Client | null> {
  const { data, error } = await getSupabaseClient().from(TABLE).select('*').eq(PK, id).single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw dbError(error);
  return data as Client;
}

export async function create(payload: Omit<Client, 'id_client'>): Promise<Client> {
  const { data, error } = await getSupabaseClient().from(TABLE).insert(payload).select().single();
  if (error) throw dbError(error);
  return data as Client;
}

export async function update(id: number, payload: Partial<Omit<Client, 'id_client'>>): Promise<Client | null> {
  const { data, error } = await getSupabaseClient().from(TABLE).update(payload).eq(PK, id).select().single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw dbError(error);
  return data as Client;
}

export async function remove(id: number): Promise<void> {
  const { error } = await getSupabaseClient().from(TABLE).delete().eq(PK, id);
  if (error) throw dbError(error);
}
