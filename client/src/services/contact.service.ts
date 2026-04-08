import { apiFetch } from '@/services/http.client';
import type { ContactAPI, CreateContactDto, UpdateContactDto } from '@/shared/types/common.types';

const BASE = '/api/v1/contact';

export const contactService = {
  list: (signal?: AbortSignal): Promise<ContactAPI[]> =>
    apiFetch<ContactAPI[]>(BASE, { signal }),

  listByLawyer: (lawyerId: number, signal?: AbortSignal): Promise<ContactAPI[]> =>
    apiFetch<ContactAPI[]>(`${BASE}/lawyer/${lawyerId}`, { signal }),

  listByClient: (clientId: number, signal?: AbortSignal): Promise<ContactAPI[]> =>
    apiFetch<ContactAPI[]>(`${BASE}/client/${clientId}`, { signal }),

  create: (dto: CreateContactDto): Promise<ContactAPI> =>
    apiFetch<ContactAPI>(BASE, { method: 'POST', body: JSON.stringify(dto) }),

  update: (id: number, dto: UpdateContactDto): Promise<ContactAPI> =>
    apiFetch<ContactAPI>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  remove: (id: number): Promise<void> =>
    apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' }),
};
