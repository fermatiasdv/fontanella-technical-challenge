import { getSupabaseClient } from '../../shared/database/supabaseClient';
import { dbError } from '../../shared/database/dbError';
import type { ContactMessage } from '../../shared/types';

const TABLE = 'contact_messages';

export async function create(payload: Omit<ContactMessage, 'id'>): Promise<ContactMessage> {
  const { data, error } = await getSupabaseClient().from(TABLE).insert(payload).select().single();
  if (error) throw dbError(error);
  return data as ContactMessage;
}

export async function findAll(): Promise<ContactMessage[]> {
  const { data, error } = await getSupabaseClient()
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw dbError(error);
  return data as ContactMessage[];
}
