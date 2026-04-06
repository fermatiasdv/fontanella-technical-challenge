/**
 * Unit tests for src/modules/vacations/vacations.repository.ts
 */

jest.mock('../../shared/database/supabaseClient');

import { getSupabaseClient } from '../../shared/database/supabaseClient';
import * as repo from '../../modules/vacations/vacations.repository';
import { HttpError } from '../../shared/types';
import { makeSupabaseMock } from '../helpers/supabaseMock';
import { mockVacation } from '../helpers/fixtures';

const mockGetClient = jest.mocked(getSupabaseClient);

function setup(initial = { data: null as unknown, error: null as unknown }) {
  const { client, chain } = makeSupabaseMock(initial);
  mockGetClient.mockReturnValue(client as unknown as ReturnType<typeof getSupabaseClient>);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

describe('findByLawyer', () => {
  it('returns vacations for a given lawyer', async () => {
    setup({ data: [mockVacation], error: null });
    const result = await repo.findByLawyer(1);
    expect(result).toEqual([mockVacation]);
  });

  it('throws HttpError on error', async () => {
    setup({ data: null, error: { message: 'db error', code: '08006', details: null, hint: null } });
    await expect(repo.findByLawyer(1)).rejects.toBeInstanceOf(HttpError);
  });
});

describe('create', () => {
  it('returns the created vacation on success', async () => {
    setup({ data: mockVacation, error: null });
    const result = await repo.create({ id_lawyer: 1, start_date: '2025-07-01', end_date: '2025-07-15' });
    expect(result).toEqual(mockVacation);
  });

  it('throws HttpError on error', async () => {
    setup({ data: null, error: { message: 'constraint', code: '23505', details: null, hint: null } });
    await expect(
      repo.create({ id_lawyer: 1, start_date: '2025-07-01', end_date: '2025-07-15' }),
    ).rejects.toBeInstanceOf(HttpError);
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
