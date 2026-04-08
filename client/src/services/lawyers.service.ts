import { apiFetch } from '@/services/http.client';
import type { LawyerAPI, CreateLawyerDto, UpdateLawyerDto } from '@/features/lawyers/types/lawyer.types';

const BASE = '/api/v1/lawyers';

export const lawyersService = {
  list: (signal?: AbortSignal): Promise<LawyerAPI[]> =>
    apiFetch<LawyerAPI[]>(BASE, { signal }),

  getOne: (id: number, signal?: AbortSignal): Promise<LawyerAPI> =>
    apiFetch<LawyerAPI>(`${BASE}/${id}`, { signal }),

  create: (dto: CreateLawyerDto): Promise<LawyerAPI> =>
    apiFetch<LawyerAPI>(BASE, { method: 'POST', body: JSON.stringify(dto) }),

  update: (id: number, dto: UpdateLawyerDto): Promise<LawyerAPI> =>
    apiFetch<LawyerAPI>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  remove: (id: number): Promise<void> =>
    apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' }),
};
