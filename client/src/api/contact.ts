/**
 * Contact API calls.
 *
 *  GET    /api/v1/contact                    → list
 *  GET    /api/v1/contact/client/:clientId   → listByClient
 *  POST   /api/v1/contact                    → create
 *  PATCH  /api/v1/contact/:id                → update
 *  DELETE /api/v1/contact/:id                → remove
 */

import { apiFetch } from './client';

export type MethodType = 'InPerson' | 'VideoCall' | 'PhoneCall';

export interface ContactAPI {
  id_contact:  number;
  id_lawyer:   number | null;
  id_client:   number | null;
  method_type: MethodType;
  value:       string;
  is_default:  boolean;
}

export interface CreateContactDto {
  idClient?:   number;
  idLawyer?:   number;
  methodType:  MethodType;
  value:       string;
  isDefault?:  boolean;
}

const BASE = '/api/v1/contact';

export const contactApi = {
  listByClient: (clientId: number, signal?: AbortSignal): Promise<ContactAPI[]> =>
    apiFetch<ContactAPI[]>(`${BASE}/client/${clientId}`, { signal }),

  create: (dto: CreateContactDto): Promise<ContactAPI> =>
    apiFetch<ContactAPI>(BASE, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  remove: (id: number): Promise<void> =>
    apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' }),
};
