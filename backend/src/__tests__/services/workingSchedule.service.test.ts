/**
 * Unit tests for src/modules/working-schedule/workingSchedule.service.ts
 */

jest.mock('../../modules/working-schedule/workingSchedule.repository');

import * as service from '../../modules/working-schedule/workingSchedule.service';
import * as repository from '../../modules/working-schedule/workingSchedule.repository';
import type { HttpError } from '../../shared/types';
import { mockWorkingSchedule } from '../helpers/fixtures';

const repo = jest.mocked(repository);

beforeEach(() => jest.clearAllMocks());

// ─── getSchedule ──────────────────────────────────────────────────────────────

describe('getSchedule', () => {
  it('returns all schedule slots for a lawyer', async () => {
    repo.findByLawyer.mockResolvedValue([mockWorkingSchedule]);

    const result = await service.getSchedule(1);

    expect(repo.findByLawyer).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(mockWorkingSchedule);
  });

  it('returns empty array when no schedule exists', async () => {
    repo.findByLawyer.mockResolvedValue([]);

    const result = await service.getSchedule(1);

    expect(result).toEqual([]);
  });
});

// ─── setSchedule ──────────────────────────────────────────────────────────────

describe('setSchedule', () => {
  const slots = [{ dayOfWeek: 'Monday' as const, startTime: '09:00:00', endTime: '17:00:00' }];

  it('upserts schedule slots and returns the result', async () => {
    repo.upsert.mockResolvedValue([mockWorkingSchedule]);

    const result = await service.setSchedule(1, slots);

    expect(repo.upsert).toHaveBeenCalledWith([
      {
        id_lawyer: 1,
        day_of_week: 'Monday',
        start_time: '09:00:00',
        end_time: '17:00:00',
      },
    ]);
    expect(result).toHaveLength(1);
  });

  it('maps multiple slots correctly', async () => {
    const multiSlots = [
      { dayOfWeek: 'Monday' as const, startTime: '09:00:00', endTime: '17:00:00' },
      { dayOfWeek: 'Tuesday' as const, startTime: '10:00:00', endTime: '18:00:00' },
    ];
    repo.upsert.mockResolvedValue([mockWorkingSchedule, { ...mockWorkingSchedule, id_working_schedule: 2, day_of_week: 'Tuesday' }]);

    const result = await service.setSchedule(2, multiSlots);

    expect(repo.upsert).toHaveBeenCalledWith([
      { id_lawyer: 2, day_of_week: 'Monday', start_time: '09:00:00', end_time: '17:00:00' },
      { id_lawyer: 2, day_of_week: 'Tuesday', start_time: '10:00:00', end_time: '18:00:00' },
    ]);
    expect(result).toHaveLength(2);
  });

  it('throws 400 when slots is an empty array', async () => {
    await expect(service.setSchedule(1, [])).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('non-empty'),
    } satisfies Partial<HttpError>);

    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('throws 400 when slots is not an array', async () => {
    await expect(
      service.setSchedule(1, null as unknown as typeof slots),
    ).rejects.toMatchObject({
      statusCode: 400,
    } satisfies Partial<HttpError>);

    expect(repo.upsert).not.toHaveBeenCalled();
  });
});

// ─── removeSlot ───────────────────────────────────────────────────────────────

describe('removeSlot', () => {
  it('delegates removal to the repository', async () => {
    repo.remove.mockResolvedValue(undefined);

    await service.removeSlot(1);

    expect(repo.remove).toHaveBeenCalledWith(1);
  });
});
