/**
 * Appointment API calls.
 * Each function maps 1-to-1 with a backend endpoint.
 *
 *  GET    /api/v1/appointments          → list
 *  GET    /api/v1/appointments/:id      → getOne
 *  POST   /api/v1/appointments          → create
 *  PATCH  /api/v1/appointments/:id      → update
 *  DELETE /api/v1/appointments/:id      → remove
 */

import { apiFetch } from './client';
import type { AppointmentAPI, CreateAppointmentDto, UpdateAppointmentDto } from '../types/appointment';

const BASE = '/api/v1/appointments';

export const appointmentsApi = {
  list: (signal?: AbortSignal): Promise<AppointmentAPI[]> =>
    apiFetch<AppointmentAPI[]>(BASE, { signal }),

  getOne: (id: number, signal?: AbortSignal): Promise<AppointmentAPI> =>
    apiFetch<AppointmentAPI>(`${BASE}/${id}`, { signal }),

  create: (dto: CreateAppointmentDto): Promise<AppointmentAPI> =>
    apiFetch<AppointmentAPI>(BASE, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  update: (id: number, dto: UpdateAppointmentDto): Promise<AppointmentAPI> =>
    apiFetch<AppointmentAPI>(`${BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  remove: (id: number): Promise<void> =>
    apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' }),
};
