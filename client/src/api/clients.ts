/**
 * Client API calls.
 * Each function maps 1-to-1 with a backend endpoint.
 *
 *  GET    /api/v1/clients          → list
 *  GET    /api/v1/clients/:id      → getOne
 *  POST   /api/v1/clients          → create
 *  PATCH  /api/v1/clients/:id      → update
 *  DELETE /api/v1/clients/:id      → remove
 */

import { apiFetch } from './client';
import type { ClientAPI, CreateClientDto, UpdateClientDto } from '../types/client';

const BASE = '/api/v1/clients';

export const clientsApi = {
  list: (signal?: AbortSignal): Promise<ClientAPI[]> =>
    apiFetch<ClientAPI[]>(BASE, { signal }),

  getOne: (id: number, signal?: AbortSignal): Promise<ClientAPI> =>
    apiFetch<ClientAPI>(`${BASE}/${id}`, { signal }),

  create: (dto: CreateClientDto): Promise<ClientAPI> =>
    apiFetch<ClientAPI>(BASE, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  update: (id: number, dto: UpdateClientDto): Promise<ClientAPI> =>
    apiFetch<ClientAPI>(`${BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  remove: (id: number): Promise<void> =>
    apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' }),
};
