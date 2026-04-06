/**
 * Unit tests for src/modules/lawyers/lawyers.service.ts
 */

jest.mock('../../modules/lawyers/lawyers.repository');

import * as service from '../../modules/lawyers/lawyers.service';
import * as repository from '../../modules/lawyers/lawyers.repository';
import type { HttpError } from '../../shared/types';
import { mockLawyer } from '../helpers/fixtures';

const repo = jest.mocked(repository);

beforeEach(() => jest.clearAllMocks());

// ─── listLawyers ─────────────────────────────────────────────────────────────

describe('listLawyers', () => {
  it('returns all lawyers from the repository', async () => {
    repo.findAll.mockResolvedValue([mockLawyer]);

    const result = await service.listLawyers();

    expect(repo.findAll).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
  });

  it('returns empty array when no lawyers exist', async () => {
    repo.findAll.mockResolvedValue([]);
    const result = await service.listLawyers();
    expect(result).toEqual([]);
  });
});

// ─── getLawyer ────────────────────────────────────────────────────────────────

describe('getLawyer', () => {
  it('returns the lawyer when found', async () => {
    repo.findById.mockResolvedValue(mockLawyer);

    const result = await service.getLawyer(1);

    expect(result).toEqual(mockLawyer);
    expect(repo.findById).toHaveBeenCalledWith(1);
  });

  it('throws HttpError 404 when lawyer does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.getLawyer(999)).rejects.toMatchObject({
      statusCode: 404,
      message: expect.stringContaining('999'),
    } satisfies Partial<HttpError>);
  });
});

// ─── createLawyer ─────────────────────────────────────────────────────────────

describe('createLawyer', () => {
  it('delegates directly to the repository', async () => {
    repo.create.mockResolvedValue(mockLawyer);
    const payload = { national_id: '20-12345678-9', full_name: 'Juan García', location: 'BA', timezone: 'UTC' };

    const result = await service.createLawyer(payload);

    expect(repo.create).toHaveBeenCalledWith(payload);
    expect(result).toEqual(mockLawyer);
  });
});

// ─── updateLawyer ─────────────────────────────────────────────────────────────

describe('updateLawyer', () => {
  it('updates and returns the lawyer', async () => {
    const updated = { ...mockLawyer, full_name: 'Carlos Rodríguez' };
    repo.findById.mockResolvedValue(mockLawyer);
    repo.update.mockResolvedValue(updated);

    const result = await service.updateLawyer(1, { full_name: 'Carlos Rodríguez' });

    expect(repo.update).toHaveBeenCalledWith(1, { full_name: 'Carlos Rodríguez' });
    expect(result?.full_name).toBe('Carlos Rodríguez');
  });

  it('throws 404 when the lawyer does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.updateLawyer(999, { full_name: 'X' })).rejects.toMatchObject({
      statusCode: 404,
    } satisfies Partial<HttpError>);

    expect(repo.update).not.toHaveBeenCalled();
  });
});

// ─── deleteLawyer ─────────────────────────────────────────────────────────────

describe('deleteLawyer', () => {
  it('removes the lawyer when it exists', async () => {
    repo.findById.mockResolvedValue(mockLawyer);
    repo.remove.mockResolvedValue(undefined);

    await service.deleteLawyer(1);

    expect(repo.remove).toHaveBeenCalledWith(1);
  });

  it('throws 404 when the lawyer does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.deleteLawyer(999)).rejects.toMatchObject({ statusCode: 404 });
    expect(repo.remove).not.toHaveBeenCalled();
  });
});
