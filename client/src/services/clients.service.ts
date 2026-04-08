import { apiFetch } from '@/services/http.client';
import type { ClientAPI, CreateClientDto, UpdateClientDto } from '@/features/clients/types/client.types';

const BASE = '/api/v1/clients';

export const clientsService = {
  list: (signal?: AbortSignal): Promise<ClientAPI[]> =>
    apiFetch<ClientAPI[]>(BASE, { signal }),

  getOne: (id: number, signal?: AbortSignal): Promise<ClientAPI> =>
    apiFetch<ClientAPI>(`${BASE}/${id}`, { signal }),

  create: (dto: CreateClientDto): Promise<ClientAPI> =>
    apiFetch<ClientAPI>(BASE, { method: 'POST', body: JSON.stringify(dto) }),

  update: (id: number, dto: UpdateClientDto): Promise<ClientAPI> =>
    apiFetch<ClientAPI>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  remove: (id: number): Promise<void> =>
    apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' }),
};
