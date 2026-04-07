/**
 * Working-Schedule API client.
 *
 * Endpoints (defined in workingSchedule.routes.ts):
 *   GET    /api/v1/working-schedule/:lawyerId   → list slots for a lawyer
 *   PUT    /api/v1/working-schedule/:lawyerId   → upsert slots (onConflict id_lawyer,day_of_week)
 *   DELETE /api/v1/working-schedule/slot/:id    → remove one slot by PK
 */

import { apiFetch } from './client';

const BASE = '/api/v1/working-schedule';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkingScheduleAPI {
  id_working_schedule: number;
  id_lawyer:           number;
  day_of_week:         string;  // 'Monday' … 'Sunday'
  start_time:          string;  // "HH:mm:ss"
  end_time:            string;  // "HH:mm:ss"
}

export interface WorkingScheduleSlotDto {
  dayOfWeek:  string;  // 'Monday' … 'Sunday'
  startTime:  string;  // "HH:mm:ss"
  endTime:    string;  // "HH:mm:ss"
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const workingScheduleApi = {
  /** Fetch all slots for a given lawyer. */
  getByLawyer: (lawyerId: number, signal?: AbortSignal): Promise<WorkingScheduleAPI[]> =>
    apiFetch<WorkingScheduleAPI[]>(`${BASE}/${lawyerId}`, { signal }),

  /**
   * Upsert one or more slots for a lawyer.
   * Backend uses onConflict(id_lawyer, day_of_week), so calling with a single
   * slot safely creates-or-updates just that day without touching others.
   */
  upsertSlots: (lawyerId: number, slots: WorkingScheduleSlotDto[]): Promise<WorkingScheduleAPI[]> =>
    apiFetch<WorkingScheduleAPI[]>(`${BASE}/${lawyerId}`, {
      method: 'PUT',
      body:   JSON.stringify({ slots }),
    }),

  /** Delete a single slot by its PK. */
  deleteSlot: (id: number): Promise<void> =>
    apiFetch<void>(`${BASE}/slot/${id}`, { method: 'DELETE' }),
};
