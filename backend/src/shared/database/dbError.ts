import type { PostgrestError } from '@supabase/supabase-js';
import { HttpError } from '../types';

/**
 * Converts a Supabase PostgrestError into an HttpError.
 * Single source of truth — used by all repository modules.
 */
export function dbError(supabaseError: PostgrestError): HttpError {
  const err = new HttpError(`Database error: ${supabaseError.message}`, 500);
  err.details = supabaseError.details ?? undefined;
  err.hint = supabaseError.hint ?? undefined;
  return err;
}
