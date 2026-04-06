/**
 * Unit tests for src/modules/lawyers/lawyers.repository.ts
 * Tests error-handling branches that integration tests (which mock the repo)
 * cannot reach.
 */

jest.mock('../../shared/database/supabaseClient');

import { getSupabaseClient } from '../../shared/database/supabaseClient';
import * as repo from '../../modules/lawyers/lawyers.repository';
import { HttpError } from '../../shared/types';
import { makeSupabaseMock } from '../helpers/supabaseMock';
import { mockLawyer } from '../helpers/fixtures';

const mockGetClient = jest.mocked(getSupabaseClient);

function setup(initial = { data: null as unknown, error: null as unknown }) {
  const { client, chain } = makeSupabaseMock(initial);
  mockGetClient.mockReturnValue(client as ReturnType<typeof getSupabaseClient>);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

// ─── findAll ──────────────────────────────────────────────────────────────────

describe('findAll', () => {
  it('returns an array of lawyers on success', async () => {
    setup({ data: [mockLawyer], error: null });
    const result = await repo.findAll();
    expect(result).toEqual([mockLawyer]);
  });

  it('throws HttpError when Supabase returns an error', async () => {
    setup({ data: null, error: { message: 'connection failed', code: '08006', details: null, hint: null } });
    await expect(repo.findAll()).rejects.toBeInstanceOf(HttpError);
  });
});

// ─── findById ─────────────────────────────────────────────────────────────────

describe('findById', () => {
  it('returns the lawyer when found', async () => {
    setup({ data: mockLawyer, error: null });
    const result = await repo.findById(1);
    expect(result).toEqual(mockLawyer);
  });

  it('returns null for PGRST116 (row not found)', async () => {
    setup({ data: null, error: { message: 'no rows', code: 'PGRST116', details: null, hint: null } });
    const result = await repo.findById(999);
    expect(result).toBeNull();
  });

  it('throws HttpError for other Supabase errors', async () => {
    setup({ data: null, error: { message: 'permission denied', code: '42501', details: null, hint: null } });
    await expect(repo.findById(1)).rejects.toBeInstanceOf(HttpError);
  });
});

// ─── create ───────────────────────────────────────────────────────────────────

describe('create', () => {
  it('returns the created lawyer on success', async () => {
    setup({ data: mockLawyer, error: null });
    const payload = { national_id: '20-12345678-9', full_name: 'Juan García', location: 'BA', timezone: 'UTC' };
    const result = await repo.create(payload);
    expect(result).toEqual(mockLawyer);
  });

  it('throws HttpError when Supabase returns an error', async () => {
    setup({ data: null, error: { message: 'duplicate key', code: '23505', details: null, hint: null } });
    await expect(repo.create({ national_id: 'x', full_name: 'x', location: 'x', timezone: 'UTC' })).rejects.toBeInstanceOf(HttpError);
  });
});

// ─── update ───────────────────────────────────────────────────────────────────

describe('update', () => {
  it('returns the updated lawyer on success', async () => {
    const updated = { ...mockLawyer, full_name: 'Updated' };
    setup({ data: updated, error: null });
    const result = await repo.update(1, { full_name: 'Updated' });
    expect(result).toEqual(updated);
  });

  it('returns null for PGRST116', async () => {
    setup({ data: null, error: { message: 'no rows', code: 'PGRST116', details: null, hint: null } });
    const result = await repo.update(999, { full_name: 'X' });
    expect(result).toBeNull();
  });

  it('throws HttpError for other errors', async () => {
    setup({ data: null, error: { message: 'constraint error', code: '23514', details: null, hint: null } });
    await expect(repo.update(1, { full_name: 'X' })).rejects.toBeInstanceOf(HttpError);
  });
});

// ─── remove ───────────────────────────────────────────────────────────────────

describe('remove', () => {
  it('resolves without error on success', async () => {
    setup({ data: null, error: null });
    await expect(repo.remove(1)).resolves.toBeUndefined();
  });

  it('throws HttpError when Supabase returns an error', async () => {
    setup({ data: null, error: { message: 'FK violation', code: '23503', details: null, hint: null } });
    await expect(repo.remove(1)).rejects.toBeInstanceOf(HttpError);
  });
});
