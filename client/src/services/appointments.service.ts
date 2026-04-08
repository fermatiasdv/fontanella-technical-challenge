import { apiFetch } from '@/services/http.client';
import type { AppointmentAPI, CreateAppointmentDto, UpdateAppointmentDto } from '@/features/appointments/types/appointment.types';

const BASE = '/api/v1/appointments';

export const appointmentsService = {
  list: (signal?: AbortSignal): Promise<AppointmentAPI[]> =>
    apiFetch<AppointmentAPI[]>(BASE, { signal }),

  getOne: (id: number, signal?: AbortSignal): Promise<AppointmentAPI> =>
    apiFetch<AppointmentAPI>(`${BASE}/${id}`, { signal }),

  create: (dto: CreateAppointmentDto): Promise<AppointmentAPI> =>
    apiFetch<AppointmentAPI>(BASE, { method: 'POST', body: JSON.stringify(dto) }),

  update: (id: number, dto: UpdateAppointmentDto): Promise<AppointmentAPI> =>
    apiFetch<AppointmentAPI>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  remove: (id: number): Promise<void> =>
    apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' }),
};
