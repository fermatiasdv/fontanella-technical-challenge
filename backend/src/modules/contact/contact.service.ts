import * as repository from './contact.repository';
import { HttpError } from '../../shared/types';
import type { Contact, CreateContactDto, UpdateContactDto } from '../../shared/types';

const VALID_METHOD_TYPES = ['InPerson', 'VideoCall', 'PhoneCall'] as const;

export async function listContacts(): Promise<Contact[]> {
  return repository.findAll();
}

export async function getContact(id: number): Promise<Contact> {
  const contact = await repository.findById(id);
  if (!contact) {
    throw new HttpError(`Contact not found: ${id}`, 404);
  }
  return contact;
}

export async function getContactsByLawyer(lawyerId: number): Promise<Contact[]> {
  return repository.findByLawyer(lawyerId);
}

export async function getContactsByClient(clientId: number): Promise<Contact[]> {
  return repository.findByClient(clientId);
}

export async function createContact(dto: CreateContactDto): Promise<Contact> {
  const { idLawyer, idClient, methodType, value, isDefault } = dto;

  if (!methodType || !value) {
    throw new HttpError('methodType and value are required', 400);
  }

  if (!VALID_METHOD_TYPES.includes(methodType)) {
    throw new HttpError(`methodType must be one of: ${VALID_METHOD_TYPES.join(', ')}`, 400);
  }

  if (idLawyer === undefined && idClient === undefined) {
    throw new HttpError('Either idLawyer or idClient must be provided', 400);
  }

  return repository.create({
    id_lawyer: idLawyer ?? null,
    id_client: idClient ?? null,
    method_type: methodType,
    value,
    is_default: isDefault ?? false,
  });
}

export async function updateContact(id: number, dto: UpdateContactDto): Promise<Contact | null> {
  await getContact(id);

  const payload: Partial<Omit<Contact, 'id_contact'>> = {};

  if (dto.methodType !== undefined) {
    if (!VALID_METHOD_TYPES.includes(dto.methodType)) {
      throw new HttpError(`methodType must be one of: ${VALID_METHOD_TYPES.join(', ')}`, 400);
    }
    payload.method_type = dto.methodType;
  }

  if (dto.value !== undefined) payload.value = dto.value;
  if (dto.isDefault !== undefined) payload.is_default = dto.isDefault;

  return repository.update(id, payload);
}

export async function deleteContact(id: number): Promise<void> {
  await getContact(id);
  await repository.remove(id);
}
