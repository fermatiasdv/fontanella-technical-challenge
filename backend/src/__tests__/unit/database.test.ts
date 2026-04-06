/**
 * Unit tests for src/shared/database/supabaseClient.ts and dbError.ts
 */

import { dbError } from '../../shared/database/dbError';
import { HttpError } from '../../shared/types';
import type { PostgrestError } from '@supabase/supabase-js';

// ─── dbError ─────────────────────────────────────────────────────────────────

describe('dbError', () => {
  it('returns an HttpError with statusCode 500', () => {
    const pgError = {
      message: 'duplicate key value',
      code: '23505',
      details: 'Key (id)=(1) already exists.',
      hint: 'Use a different id.',
    } as unknown as PostgrestError;

    const err = dbError(pgError);

    expect(err).toBeInstanceOf(HttpError);
    expect(err.statusCode).toBe(500);
    expect(err.message).toContain('duplicate key value');
  });

  it('maps details and hint from the Postgrest error', () => {
    const pgError = {
      message: 'error',
      code: '23505',
      details: 'some details',
      hint: 'some hint',
    } as unknown as PostgrestError;

    const err = dbError(pgError);

    expect(err.details).toBe('some details');
    expect(err.hint).toBe('some hint');
  });

  it('sets details and hint to undefined when they are null', () => {
    const pgError = {
      message: 'query error',
      code: '42P01',
      details: null,
      hint: null,
    } as unknown as PostgrestError;

    const err = dbError(pgError);

    expect(err.details).toBeUndefined();
    expect(err.hint).toBeUndefined();
  });
});

// ─── getSupabaseClient ────────────────────────────────────────────────────────

describe('getSupabaseClient', () => {
  const mockClient = { type: 'supabase-mock-instance' };
  const mockCreateClient = jest.fn().mockReturnValue(mockClient);

  beforeEach(() => {
    jest.resetModules();
    mockCreateClient.mockClear();
  });

  it('creates a client with the config values on first call', () => {
    jest.doMock('@supabase/supabase-js', () => ({ createClient: mockCreateClient }));
    jest.doMock('../../shared/config', () => ({
      __esModule: true,
      default: {
        supabase: { url: 'https://test.supabase.co', serviceRoleKey: 'service-role-key' },
      },
    }));

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getSupabaseClient } = require('../../shared/database/supabaseClient');
    const client = getSupabaseClient();

    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'service-role-key',
      expect.objectContaining({
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    );
    expect(client).toBe(mockClient);
  });

  it('returns the same singleton instance on repeated calls', () => {
    jest.doMock('@supabase/supabase-js', () => ({ createClient: mockCreateClient }));
    jest.doMock('../../shared/config', () => ({
      __esModule: true,
      default: {
        supabase: { url: 'https://test.supabase.co', serviceRoleKey: 'key' },
      },
    }));

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getSupabaseClient } = require('../../shared/database/supabaseClient');
    const c1 = getSupabaseClient();
    const c2 = getSupabaseClient();

    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(c1).toBe(c2);
  });
});
