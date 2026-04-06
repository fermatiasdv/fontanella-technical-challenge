/**
 * Unit tests for src/modules/vacations/vacations.service.ts
 */

jest.mock('../../modules/vacations/vacations.repository');

import * as service from '../../modules/vacations/vacations.service';
import * as repository from '../../modules/vacations/vacations.repository';
import type { HttpError } from '../../shared/types';
import { mockVacation } from '../helpers/fixtures';

const repo = jest.mocked(repository);

beforeEach(() => jest.clearAllMocks());

// ─── getVacations ─────────────────────────────────────────────────────────────

describe('getVacations', () => {
  it('returns all vacations for a lawyer', async () => {
    repo.findByLawyer.mockResolvedValue([mockVacation]);

    const result = await service.getVacations(1);

    expect(repo.findByLawyer).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(mockVacation);
  });

  it('returns empty array when no vacations exist', async () => {
    repo.findByLawyer.mockResolvedValue([]);

    const result = await service.getVacations(1);

    expect(result).toEqual([]);
  });
});

// ─── addVacation ──────────────────────────────────────────────────────────────

describe('addVacation', () => {
  const dto = { startDate: '2025-07-01', endDate: '2025-07-15' };

  it('creates a vacation with valid dates', async () => {
    repo.create.mockResolvedValue(mockVacation);

    const result = await service.addVacation(1, dto);

    expect(repo.create).toHaveBeenCalledWith({
      id_lawyer: 1,
      start_date: '2025-07-01',
      end_date: '2025-07-15',
    });
    expect(result).toEqual(mockVacation);
  });

  it('throws 400 when startDate is missing', async () => {
    await expect(
      service.addVacation(1, { startDate: '', endDate: '2025-07-15' }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('required'),
    } satisfies Partial<HttpError>);

    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws 400 when endDate is missing', async () => {
    await expect(
      service.addVacation(1, { startDate: '2025-07-01', endDate: '' }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('required'),
    } satisfies Partial<HttpError>);

    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws 400 when startDate is not a valid date', async () => {
    await expect(
      service.addVacation(1, { startDate: 'not-a-date', endDate: '2025-07-15' }),
    ).rejects.toMatchObject({ statusCode: 400 } satisfies Partial<HttpError>);

    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws 400 when endDate is not a valid date', async () => {
    await expect(
      service.addVacation(1, { startDate: '2025-07-01', endDate: 'not-a-date' }),
    ).rejects.toMatchObject({ statusCode: 400 } satisfies Partial<HttpError>);

    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws 400 when startDate is after endDate', async () => {
    await expect(
      service.addVacation(1, { startDate: '2025-07-15', endDate: '2025-07-01' }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('endDate'),
    } satisfies Partial<HttpError>);

    expect(repo.create).not.toHaveBeenCalled();
  });

  it('accepts same day for startDate and endDate', async () => {
    repo.create.mockResolvedValue({ ...mockVacation, start_date: '2025-07-01', end_date: '2025-07-01' });

    await expect(
      service.addVacation(1, { startDate: '2025-07-01', endDate: '2025-07-01' }),
    ).resolves.toBeDefined();

    expect(repo.create).toHaveBeenCalledTimes(1);
  });
});

// ─── removeVacation ───────────────────────────────────────────────────────────

describe('removeVacation', () => {
  it('delegates removal to the repository', async () => {
    repo.remove.mockResolvedValue(undefined);

    await service.removeVacation(1);

    expect(repo.remove).toHaveBeenCalledWith(1);
  });
});
