import { apiFetch } from '@/services/http.client';

export interface WorkingScheduleAPI {
  id_working_schedule: number;
  id_lawyer:           number;
  day_of_week:         string;
  start_time:          string;
  end_time:            string;
}

export interface WorkingScheduleSlotDto {
  dayOfWeek: string;
  startTime: string;
  endTime:   string;
}

const BASE = '/api/v1/working-schedule';

export const workingScheduleService = {
  getByLawyer: (lawyerId: number, signal?: AbortSignal): Promise<WorkingScheduleAPI[]> =>
    apiFetch<WorkingScheduleAPI[]>(`${BASE}/${lawyerId}`, { signal }),

  upsertSlots: (lawyerId: number, slots: WorkingScheduleSlotDto[]): Promise<WorkingScheduleAPI[]> =>
    apiFetch<WorkingScheduleAPI[]>(`${BASE}/${lawyerId}`, {
      method: 'PUT',
      body: JSON.stringify({ slots }),
    }),

  deleteSlot: (slotId: number): Promise<void> =>
    apiFetch<void>(`${BASE}/slot/${slotId}`, { method: 'DELETE' }),
};
