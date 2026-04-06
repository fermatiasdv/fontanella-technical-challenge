/**
 * Lawyer API calls.
 * Each function maps 1-to-1 with a backend endpoint.
 *
 *  GET    /api/v1/lawyers          → list
 *  GET    /api/v1/lawyers/:id      → getOne
 *  POST   /api/v1/lawyers          → create
 *  PATCH  /api/v1/lawyers/:id      → update
 *  DELETE /api/v1/lawyers/:id      → remove
 */

import { apiFetch } from './client';
import type { LawyerAPI, CreateLawyerDto, UpdateLawyerDto } from '../types/lawyer';

const BASE = '/api/v1/lawyers';

export const lawyersApi = {
  list: (signal?: AbortSignal): Promise<LawyerAPI[]> =>
    apiFetch<LawyerAPI[]>(BASE, { signal }),

  getOne: (id: number, signal?: AbortSignal): Promise<LawyerAPI> =>
    apiFetch<LawyerAPI>(`${BASE}/${id}`, { signal }),

  create: (dto: CreateLawyerDto): Promise<LawyerAPI> =>
    apiFetch<LawyerAPI>(BASE, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  update: (id: number, dto: UpdateLawyerDto): Promise<LawyerAPI> =>
    apiFetch<LawyerAPI>(`${BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  remove: (id: number): Promise<void> =>
    apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' }),
};
