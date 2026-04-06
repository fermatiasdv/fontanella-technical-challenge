/**
 * Unit tests for src/modules/contact/contact.service.ts
 */

jest.mock('../../modules/contact/contact.repository');

import * as service from '../../modules/contact/contact.service';
import * as repository from '../../modules/contact/contact.repository';
import type { HttpError } from '../../shared/types';
import { mockContact, mockContactClient } from '../helpers/fixtures';

const repo = jest.mocked(repository);

beforeEach(() => jest.clearAllMocks());

// ─── listContacts ─────────────────────────────────────────────────────────────

describe('listContacts', () => {
  it('returns all contacts', async () => {
    repo.findAll.mockResolvedValue([mockContact, mockContactClient]);
    const result = await service.listContacts();
    expect(result).toHaveLength(2);
  });
});

// ─── getContact ───────────────────────────────────────────────────────────────

describe('getContact', () => {
  it('returns the contact when found', async () => {
    repo.findById.mockResolvedValue(mockContact);
    const result = await service.getContact(1);
    expect(result).toEqual(mockContact);
  });

  it('throws 404 when contact does not exist', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.getContact(999)).rejects.toMatchObject({
      statusCode: 404,
      message: expect.stringContaining('999'),
    } satisfies Partial<HttpError>);
  });
});

// ─── getContactsByLawyer / getContactsByClient ────────────────────────────────

describe('getContactsByLawyer', () => {
  it('returns contacts filtered by lawyer', async () => {
    repo.findByLawyer.mockResolvedValue([mockContact]);
    const result = await service.getContactsByLawyer(1);
    expect(repo.findByLawyer).toHaveBeenCalledWith(1);
    expect(result).toEqual([mockContact]);
  });
});

describe('getContactsByClient', () => {
  it('returns contacts filtered by client', async () => {
    repo.findByClient.mockResolvedValue([mockContactClient]);
    const result = await service.getContactsByClient(1);
    expect(repo.findByClient).toHaveBeenCalledWith(1);
    expect(result).toEqual([mockContactClient]);
  });
});

// ─── createContact ────────────────────────────────────────────────────────────

describe('createContact', () => {
  it('creates a lawyer contact successfully', async () => {
    repo.create.mockResolvedValue(mockContact);

    const result = await service.createContact({
      idLawyer: 1, methodType: 'InPerson', value: 'Av. Corrientes 1234', isDefault: true,
    });

    expect(result).toEqual(mockContact);
    expect(repo.create).toHaveBeenCalledWith({
      id_lawyer: 1, id_client: null, method_type: 'InPerson', value: 'Av. Corrientes 1234', is_default: true,
    });
  });

  it('creates a client contact successfully', async () => {
    repo.create.mockResolvedValue(mockContactClient);

    await service.createContact({
      idClient: 1, methodType: 'PhoneCall', value: '+54 11 1234-5678',
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ id_client: 1, id_lawyer: null, is_default: false }),
    );
  });

  it('throws 400 when methodType is missing', async () => {
    await expect(
      service.createContact({ idLawyer: 1, methodType: undefined as unknown as 'InPerson', value: 'x' }),
    ).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('methodType') });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws 400 when value is missing', async () => {
    await expect(
      service.createContact({ idLawyer: 1, methodType: 'InPerson', value: '' }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws 400 for an invalid methodType', async () => {
    await expect(
      service.createContact({ idLawyer: 1, methodType: 'Fax' as unknown as 'InPerson', value: 'x' }),
    ).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('methodType must be one of') });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws 400 when neither idLawyer nor idClient is provided', async () => {
    await expect(
      service.createContact({ methodType: 'VideoCall', value: 'https://meet.example.com' }),
    ).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('idLawyer or idClient') });
    expect(repo.create).not.toHaveBeenCalled();
  });
});

// ─── updateContact ────────────────────────────────────────────────────────────

describe('updateContact', () => {
  it('updates value and isDefault', async () => {
    const updated = { ...mockContact, value: 'New Address', is_default: false };
    repo.findById.mockResolvedValue(mockContact);
    repo.update.mockResolvedValue(updated);

    const result = await service.updateContact(1, { value: 'New Address', isDefault: false });

    expect(repo.update).toHaveBeenCalledWith(1, { value: 'New Address', is_default: false });
    expect(result?.value).toBe('New Address');
  });

  it('updates methodType to a valid value', async () => {
    const updated = { ...mockContact, method_type: 'VideoCall' as const };
    repo.findById.mockResolvedValue(mockContact);
    repo.update.mockResolvedValue(updated);

    await service.updateContact(1, { methodType: 'VideoCall' });

    expect(repo.update).toHaveBeenCalledWith(1, { method_type: 'VideoCall' });
  });

  it('throws 400 for invalid methodType on update', async () => {
    repo.findById.mockResolvedValue(mockContact);

    await expect(
      service.updateContact(1, { methodType: 'Telegram' as unknown as 'InPerson' }),
    ).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('methodType must be one of') });
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('throws 404 when contact does not exist', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.updateContact(999, { value: 'x' })).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── deleteContact ────────────────────────────────────────────────────────────

describe('deleteContact', () => {
  it('removes the contact when it exists', async () => {
    repo.findById.mockResolvedValue(mockContact);
    repo.remove.mockResolvedValue(undefined);

    await service.deleteContact(1);

    expect(repo.remove).toHaveBeenCalledWith(1);
  });

  it('throws 404 when contact does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.deleteContact(999)).rejects.toMatchObject({ statusCode: 404 });
    expect(repo.remove).not.toHaveBeenCalled();
  });
});
