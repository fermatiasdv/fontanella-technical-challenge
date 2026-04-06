/**
 * Unit tests for src/modules/clients/clients.service.ts
 */

jest.mock('../../modules/clients/clients.repository');

import * as service from '../../modules/clients/clients.service';
import * as repository from '../../modules/clients/clients.repository';
import type { HttpError } from '../../shared/types';
import { mockClient } from '../helpers/fixtures';

const repo = jest.mocked(repository);

beforeEach(() => jest.clearAllMocks());

describe('listClients', () => {
  it('returns all clients from the repository', async () => {
    repo.findAll.mockResolvedValue([mockClient]);
    const result = await service.listClients();
    expect(repo.findAll).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
  });

  it('returns empty array when no clients exist', async () => {
    repo.findAll.mockResolvedValue([]);
    const result = await service.listClients();
    expect(result).toEqual([]);
  });
});

describe('getClient', () => {
  it('returns the client when found', async () => {
    repo.findById.mockResolvedValue(mockClient);
    const result = await service.getClient(1);
    expect(result).toEqual(mockClient);
    expect(repo.findById).toHaveBeenCalledWith(1);
  });

  it('throws HttpError 404 when client does not exist', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.getClient(999)).rejects.toMatchObject({
      statusCode: 404,
      message: expect.stringContaining('999'),
    } satisfies Partial<HttpError>);
  });
});

describe('createClient', () => {
  it('delegates to the repository', async () => {
    repo.create.mockResolvedValue(mockClient);
    const payload = { company_id: '30-98765432-1', trade_name: 'Empresa', location: 'BA', timezone: 'UTC' };

    const result = await service.createClient(payload);

    expect(repo.create).toHaveBeenCalledWith(payload);
    expect(result).toEqual(mockClient);
  });
});

describe('updateClient', () => {
  it('updates and returns the client', async () => {
    const updated = { ...mockClient, trade_name: 'Nueva Empresa' };
    repo.findById.mockResolvedValue(mockClient);
    repo.update.mockResolvedValue(updated);

    const result = await service.updateClient(1, { trade_name: 'Nueva Empresa' });

    expect(repo.update).toHaveBeenCalledWith(1, { trade_name: 'Nueva Empresa' });
    expect(result?.trade_name).toBe('Nueva Empresa');
  });

  it('throws 404 when client does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.updateClient(999, { trade_name: 'X' })).rejects.toMatchObject({
      statusCode: 404,
    } satisfies Partial<HttpError>);
    expect(repo.update).not.toHaveBeenCalled();
  });
});

describe('deleteClient', () => {
  it('removes the client when it exists', async () => {
    repo.findById.mockResolvedValue(mockClient);
    repo.remove.mockResolvedValue(undefined);

    await service.deleteClient(1);

    expect(repo.remove).toHaveBeenCalledWith(1);
  });

  it('throws 404 when client does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.deleteClient(999)).rejects.toMatchObject({ statusCode: 404 });
    expect(repo.remove).not.toHaveBeenCalled();
  });
});
