/**
 * Unit tests for src/modules/contact/contact.repository.ts
 */

jest.mock('../../shared/database/supabaseClient');

import { getSupabaseClient } from '../../shared/database/supabaseClient';
import * as repo from '../../modules/contact/contact.repository';
import { HttpError } from '../../shared/types';
import { makeSupabaseMock } from '../helpers/supabaseMock';
import { mockContact, mockContactClient } from '../helpers/fixtures';

const mockGetClient = jest.mocked(getSupabaseClient);

function setup(initial = { data: null as unknown, error: null as unknown }) {
  const { client, chain } = makeSupabaseMock(initial);
  mockGetClient.mockReturnValue(client as ReturnType<typeof getSupabaseClient>);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

describe('findAll', () => {
  it('returns all contacts on success', async () => {
    setup({ data: [mockContact, mockContactClient], error: null });
    const result = await repo.findAll();
    expect(result).toHaveLength(2);
  });

  it('throws HttpError on error', async () => {
    setup({ data: null, error: { message: 'db error', code: '08006', details: null, hint: null } });
    await expect(repo.findAll()).rejects.toBeInstanceOf(HttpError);
  });
});

describe('findById', () => {
  it('returns the contact when found', async () => {
    setup({ data: mockContact, error: null });
    const result = await repo.findById(1);
    expect(result).toEqual(mockContact);
  });

  it('returns null for PGRST116', async () => {
    setup({ data: null, error: { message: 'no rows', code: 'PGRST116', details: null, hint: null } });
    const result = await repo.findById(999);
    expect(result).toBeNull();
  });

  it('throws HttpError for other errors', async () => {
    setup({ data: null, error: { message: 'permission denied', code: '42501', details: null, hint: null } });
    await expect(repo.findById(1)).rejects.toBeInstanceOf(HttpError);
  });
});

describe('findByLawyer', () => {
  it('returns contacts for a given lawyer', async () => {
    setup({ data: [mockContact], error: null });
    const result = await repo.findByLawyer(1);
    expect(result).toEqual([mockContact]);
  });

  it('throws HttpError on error', async () => {
    setup({ data: null, error: { message: 'db error', code: '08006', details: null, hint: null } });
    await expect(repo.findByLawyer(1)).rejects.toBeInstanceOf(HttpError);
  });
});

describe('findByClient', () => {
  it('returns contacts for a given client', async () => {
    setup({ data: [mockContactClient], error: null });
    const result = await repo.findByClient(1);
    expect(result).toEqual([mockContactClient]);
  });

  it('throws HttpError on error', async () => {
    setup({ data: null, error: { message: 'db error', code: '08006', details: null, hint: null } });
    await expect(repo.findByClient(1)).rejects.toBeInstanceOf(HttpError);
  });
});

describe('create', () => {
  it('returns the created contact on success', async () => {
    setup({ data: mockContact, error: null });
    const result = await repo.create({
      id_lawyer: 1, id_client: null, method_type: 'InPerson', value: 'Av. Corrientes 1234', is_default: true,
    });
    expect(result).toEqual(mockContact);
  });

  it('throws HttpError on error', async () => {
    setup({ data: null, error: { message: 'constraint', code: '23505', details: null, hint: null } });
    await expect(
      repo.create({ id_lawyer: null, id_client: null, method_type: 'PhoneCall', value: '+54', is_default: false }),
    ).rejects.toBeInstanceOf(HttpError);
  });
});

describe('update', () => {
  it('returns the updated contact on success', async () => {
    const updated = { ...mockContact, value: 'Av. Rivadavia 500' };
    setup({ data: updated, error: null });
    const result = await repo.update(1, { value: 'Av. Rivadavia 500' });
    expect(result).toEqual(updated);
  });

  it('returns null for PGRST116', async () => {
    setup({ data: null, error: { message: 'no rows', code: 'PGRST116', details: null, hint: null } });
    const result = await repo.update(999, { value: 'x' });
    expect(result).toBeNull();
  });

  it('throws HttpError for other errors', async () => {
    setup({ data: null, error: { message: 'constraint', code: '23514', details: null, hint: null } });
    await expect(repo.update(1, { value: 'x' })).rejects.toBeInstanceOf(HttpError);
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
