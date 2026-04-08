import { apiFetch } from '@/services/http.client';

export interface VacationAPI {
  id_vacation: number;
  id_lawyer:   number;
  start_date:  string;
  end_date:    string;
}

export interface VacationDto {
  startDate: string;
  endDate:   string;
}

const BASE = '/api/v1/vacations';

export const vacationsService = {
  getByLawyer: (lawyerId: number, signal?: AbortSignal): Promise<VacationAPI[]> =>
    apiFetch<VacationAPI[]>(`${BASE}/lawyer/${lawyerId}`, { signal }),

  add: (lawyerId: number, dto: VacationDto): Promise<VacationAPI> =>
    apiFetch<VacationAPI>(`${BASE}/lawyer/${lawyerId}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  remove: (vacationId: number): Promise<void> =>
    apiFetch<void>(`${BASE}/${vacationId}`, { method: 'DELETE' }),
};
