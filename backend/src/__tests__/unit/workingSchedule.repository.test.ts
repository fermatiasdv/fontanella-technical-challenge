/**
 * Unit tests for src/modules/working-schedule/workingSchedule.repository.ts
 */

jest.mock('../../shared/database/supabaseClient');

import { getSupabaseClient } from '../../shared/database/supabaseClient';
import * as repo from '../../modules/working-schedule/workingSchedule.repository';
import { HttpError } from '../../shared/types';
import { makeSupabaseMock } from '../helpers/supabaseMock';
import { mockWorkingSchedule } from '../helpers/fixtures';

const mockGetClient = jest.mocked(getSupabaseClient);

function setup(initial = { data: null as unknown, error: null as unknown }) {
  const { client, chain } = makeSupabaseMock(initial);
  mockGetClient.mockReturnValue(client as unknown as ReturnType<typeof getSupabaseClient>);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

describe('findByLawyer', () => {
  it('returns working schedule slots for a given lawyer', async () => {
    setup({ data: [mockWorkingSchedule], error: null });
    const result = await repo.findByLawyer(1);
    expect(result).toEqual([mockWorkingSchedule]);
  });

  it('throws HttpError on error', async () => {
    setup({ data: null, error: { message: 'db error', code: '08006', details: null, hint: null } });
    await expect(repo.findByLawyer(1)).rejects.toBeInstanceOf(HttpError);
  });
});

describe('upsert', () => {
  it('returns upserted slots on success', async () => {
    setup({ data: [mockWorkingSchedule], error: null });
    const payload = [{ id_lawyer: 1, day_of_week: 'Monday', start_time: '09:00:00', end_time: '17:00:00' }];
    const result = await repo.upsert(payload);
    expect(result).toEqual([mockWorkingSchedule]);
  });

  it('throws HttpError on error', async () => {
    setup({ data: null, error: { message: 'constraint', code: '23505', details: null, hint: null } });
    await expect(
      repo.upsert([{ id_lawyer: 1, day_of_week: 'Monday', start_time: '09:00:00', end_time: '17:00:00' }]),
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
