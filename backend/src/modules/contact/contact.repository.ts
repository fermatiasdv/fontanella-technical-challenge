import { getSupabaseClient } from '../../shared/database/supabaseClient';
import { dbError } from '../../shared/database/dbError';
import type { Contact } from '../../shared/types';

const TABLE = 't_contact';
const PK = 'id_contact';

type ContactPayload = Omit<Contact, 'id_contact'>;

export async function findAll(): Promise<Contact[]> {
  const { data, error } = await getSupabaseClient().from(TABLE).select('*');
  if (error) throw dbError(error);
  return data as Contact[];
}

export async function findById(id: number): Promise<Contact | null> {
  const { data, error } = await getSupabaseClient().from(TABLE).select('*').eq(PK, id).single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw dbError(error);
  return data as Contact;
}

export async function findByLawyer(lawyerId: number): Promise<Contact[]> {
  const { data, error } = await getSupabaseClient()
    .from(TABLE)
    .select('*')
    .eq('id_lawyer', lawyerId);
  if (error) throw dbError(error);
  return data as Contact[];
}

export async function findByClient(clientId: number): Promise<Contact[]> {
  const { data, error } = await getSupabaseClient()
    .from(TABLE)
    .select('*')
    .eq('id_client', clientId);
  if (error) throw dbError(error);
  return data as Contact[];
}

export async function create(payload: ContactPayload): Promise<Contact> {
  const { data, error } = await getSupabaseClient().from(TABLE).insert(payload).select().single();
  if (error) throw dbError(error);
  return data as Contact;
}

export async function update(id: number, payload: Partial<ContactPayload>): Promise<Contact | null> {
  const { data, error } = await getSupabaseClient()
    .from(TABLE)
    .update(payload)
    .eq(PK, id)
    .select()
    .single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw dbError(error);
  return data as Contact;
}

export async function remove(id: number): Promise<void> {
  const { error } = await getSupabaseClient().from(TABLE).delete().eq(PK, id);
  if (error) throw dbError(error);
}
