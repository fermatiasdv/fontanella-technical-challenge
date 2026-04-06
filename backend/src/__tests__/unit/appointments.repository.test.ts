/**
 * Unit tests for src/modules/appointments/appointments.repository.ts
 */

jest.mock('../../shared/database/supabaseClient');

import { getSupabaseClient } from '../../shared/database/supabaseClient';
import * as repo from '../../modules/appointments/appointments.repository';
import { HttpError } from '../../shared/types';
import { makeSupabaseMock } from '../helpers/supabaseMock';
import { mockAppointment } from '../helpers/fixtures';

const mockGetClient = jest.mocked(getSupabaseClient);

function setup(initial = { data: null as unknown, error: null as unknown }) {
  const { client, chain } = makeSupabaseMock(initial);
  mockGetClient.mockReturnValue(client as unknown as ReturnType<typeof getSupabaseClient>);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

const UTC_START = '2025-06-15T13:00:00.000Z';
const UTC_END   = '2025-06-15T14:00:00.000Z';

// ─── findAll ──────────────────────────────────────────────────────────────────

describe('findAll', () => {
  it('returns appointments on success', async () => {
    setup({ data: [mockAppointment], error: null });
    const result = await repo.findAll();
    expect(result).toEqual([mockAppointment]);
  });

  it('passes limit and offset through to the query chain', async () => {
    const chain = setup({ data: [], error: null });
    await repo.findAll({ limit: 10, offset: 20 });
    expect(chain.range).toHaveBeenCalledWith(20, 29);
  });

  it('throws HttpError on error', async () => {
    setup({ data: null, error: { message: 'db error', code: '08006', details: null, hint: null } });
    await expect(repo.findAll()).rejects.toBeInstanceOf(HttpError);
  });
});

// ─── findById ─────────────────────────────────────────────────────────────────

describe('findById', () => {
  it('returns the appointment when found', async () => {
    setup({ data: mockAppointment, error: null });
    const result = await repo.findById(1);
    expect(result).toEqual(mockAppointment);
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

// ─── findOverlapping ─────────────────────────────────────────────────────────

describe('findOverlapping', () => {
  it('returns overlapping appointments', async () => {
    const conflict = { id_appointment: 5, start_datetime: UTC_START, end_datetime: UTC_END };
    setup({ data: [conflict], error: null });

    const result = await repo.findOverlapping(UTC_START, UTC_END);
    expect(result).toEqual([conflict]);
  });

  it('calls neq when excludeId is provided', async () => {
    const chain = setup({ data: [], error: null });

    await repo.findOverlapping(UTC_START, UTC_END, 1);

    expect(chain.neq).toHaveBeenCalledWith('id_appointment', 1);
  });

  it('does not call neq when excludeId is null', async () => {
    const chain = setup({ data: [], error: null });

    await repo.findOverlapping(UTC_START, UTC_END, null);

    expect(chain.neq).not.toHaveBeenCalled();
  });

  it('throws HttpError on error', async () => {
    setup({ data: null, error: { message: 'db error', code: '08006', details: null, hint: null } });
    await expect(repo.findOverlapping(UTC_START, UTC_END)).rejects.toBeInstanceOf(HttpError);
  });
});

// ─── create ───────────────────────────────────────────────────────────────────

describe('create', () => {
  it('returns the created appointment on success', async () => {
    setup({ data: mockAppointment, error: null });
    const payload = {
      subject: 'Test', description: null,
      start_datetime: UTC_START, end_datetime: UTC_END,
      id_lawyer: 1, id_client: 1, id_selected_contact: 1,
    };
    const result = await repo.create(payload);
    expect(result).toEqual(mockAppointment);
  });

  it('throws HttpError on error', async () => {
    setup({ data: null, error: { message: 'constraint', code: '23505', details: null, hint: null } });
    await expect(
      repo.create({ subject: 'x', description: null, start_datetime: UTC_START, end_datetime: UTC_END, id_lawyer: 1, id_client: 1, id_selected_contact: 1 }),
    ).rejects.toBeInstanceOf(HttpError);
  });
});

// ─── update ───────────────────────────────────────────────────────────────────

describe('update', () => {
  it('returns the updated appointment on success', async () => {
    const updated = { ...mockAppointment, subject: 'Updated' };
    setup({ data: updated, error: null });
    const result = await repo.update(1, { subject: 'Updated' });
    expect(result).toEqual(updated);
  });

  it('returns null for PGRST116', async () => {
    setup({ data: null, error: { message: 'no rows', code: 'PGRST116', details: null, hint: null } });
    const result = await repo.update(999, { subject: 'X' });
    expect(result).toBeNull();
  });

  it('throws HttpError for other errors', async () => {
    setup({ data: null, error: { message: 'constraint', code: '23514', details: null, hint: null } });
    await expect(repo.update(1, { subject: 'X' })).rejects.toBeInstanceOf(HttpError);
  });
});

// ─── remove ───────────────────────────────────────────────────────────────────

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
