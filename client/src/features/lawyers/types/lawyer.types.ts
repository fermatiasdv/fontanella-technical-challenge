// ─── Backend shapes ───────────────────────────────────────────────────────────

export interface LawyerAPI {
  id_lawyer:   number;
  national_id: string;
  full_name:   string;
  location:    string;
  timezone:    string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export type CreateLawyerDto = Omit<LawyerAPI, 'id_lawyer'>;
export type UpdateLawyerDto = Partial<CreateLawyerDto>;

// ─── Creation extras ──────────────────────────────────────────────────────────

export interface ScheduleSlotInput {
  dayOfWeek: string;
  startTime: string;
  endTime:   string;
}

export interface VacationInput {
  startDate: string;
  endDate:   string;
}
