/**
 * Unit tests for src/modules/clients/clients.repository.ts
 */

jest.mock('../../shared/database/supabaseClient');

import { getSupabaseClient } from '../../shared/database/supabaseClient';
import * as repo from '../../modules/clients/clients.repository';
import { HttpError } from '../../shared/types';
import { makeSupabaseMock } from '../helpers/supabaseMock';
import { mockClient } from '../helpers/fixtures';

const mockGetClient = jest.mocked(getSupabaseClient);

function setup(initial = { data: null as unknown, error: null as unknown }) {
  const { client, chain } = makeSupabaseMock(initial);
  mockGetClient.mockReturnValue(client as unknown as ReturnType<typeof getSupabaseClient>);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

describe('findAll', () => {
  it('returns an array of clients on success', async () => {
    setup({ data: [mockClient], error: null });
    const result = await repo.findAll();
    expect(result).toEqual([mockClient]);
  });

  it('throws HttpError when Supabase returns an error', async () => {
    setup({ data: null, error: { message: 'connection error', code: '08006', details: null, hint: null } });
    await expect(repo.findAll()).rejects.toBeInstanceOf(HttpError);
  });
});

describe('findById', () => {
  it('returns the client when found', async () => {
    setup({ data: mockClient, error: null });
    const result = await repo.findById(1);
    expect(result).toEqual(mockClient);
  });

  it('returns null for PGRST116 (row not found)', async () => {
    setup({ data: null, error: { message: 'no rows', code: 'PGRST116', details: null, hint: null } });
    const result = await repo.findById(999);
    expect(result).toBeNull();
  });

  it('throws HttpError for other errors', async () => {
    setup({ data: null, error: { message: 'permission denied', code: '42501', details: null, hint: null } });
    await expect(repo.findById(1)).rejects.toBeInstanceOf(HttpError);
  });
});

describe('create', () => {
  it('returns the created client on success', async () => {
    setup({ data: mockClient, error: null });
    const payload = { company_id: '30-98765432-1', trade_name: 'Empresa', location: 'BA', timezone: 'UTC' };
    const result = await repo.create(payload);
    expect(result).toEqual(mockClient);
  });

  it('throws HttpError on error', async () => {
    setup({ data: null, error: { message: 'duplicate key', code: '23505', details: null, hint: null } });
    await expect(
      repo.create({ company_id: 'x', trade_name: 'x', location: 'x', timezone: 'UTC' }),
    ).rejects.toBeInstanceOf(HttpError);
  });
});

describe('update', () => {
  it('returns the updated client on success', async () => {
    const updated = { ...mockClient, trade_name: 'Updated' };
    setup({ data: updated, error: null });
    const result = await repo.update(1, { trade_name: 'Updated' });
    expect(result).toEqual(updated);
  });

  it('returns null for PGRST116', async () => {
    setup({ data: null, error: { message: 'no rows', code: 'PGRST116', details: null, hint: null } });
    const result = await repo.update(999, { trade_name: 'X' });
    expect(result).toBeNull();
  });

  it('throws HttpError for other errors', async () => {
    setup({ data: null, error: { message: 'constraint', code: '23514', details: null, hint: null } });
    await expect(repo.update(1, { trade_name: 'X' })).rejects.toBeInstanceOf(HttpError);
  });
});

describe('remove', () => {
  it('resolves without error on success', async () => {
    setup({ data: null, error: null });
    await expect(repo.remove(1)).resolves.toBeUndefined();
  });

  it('throws HttpError on error', async () => {
    setup({ data: null, error: { message: 'FK violation', code: '23503', details: null, hint: null } });
    await expect(repo.remove(1)).rejects.toBeInstanceOf(HttpError);
  });
});
