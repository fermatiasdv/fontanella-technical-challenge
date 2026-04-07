/**
 * Vacations API calls.
 *
 *  GET    /api/v1/vacations/:lawyerId   → list vacations for a lawyer
 *  POST   /api/v1/vacations/:lawyerId   → add a vacation period
 *  DELETE /api/v1/vacations/:id         → remove a vacation period
 */

import { apiFetch } from './client';

const BASE = '/api/v1/vacations';

export interface VacationAPI {
  id_vacation: number;
  id_lawyer:   number;
  start_date:  string; // "YYYY-MM-DD"
  end_date:    string; // "YYYY-MM-DD"
}

export const vacationsApi = {
  getByLawyer: (lawyerId: number, signal?: AbortSignal): Promise<VacationAPI[]> =>
    apiFetch<VacationAPI[]>(`${BASE}/${lawyerId}`, { signal }),
};
