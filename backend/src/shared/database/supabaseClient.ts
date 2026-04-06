import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '../config';

/**
 * Singleton Supabase client.
 *
 * Uses the service-role key so the backend bypasses Row Level Security
 * when performing server-side operations. Never expose this key to clients.
 *
 * For user-scoped operations (future auth), create a second client with
 * the anon key + the user's JWT instead.
 */
let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return _client;
}
