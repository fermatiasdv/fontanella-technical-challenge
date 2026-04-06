// ─── Backend shape (matches the DB / API response exactly) ───────────────────
// Column names are snake_case as returned by the API.

export interface LawyerAPI {
  id_lawyer: number;
  national_id: string;  // DNI
  full_name: string;
  location: string;
  timezone: string;
}

// ─── DTOs (what we send to the API) ──────────────────────────────────────────

export type CreateLawyerDto = Omit<LawyerAPI, 'id_lawyer'>;
export type UpdateLawyerDto = Partial<CreateLawyerDto>;

// ─── UI-only types (not persisted, computed or used only in the view layer) ───

export interface ActiveContext {
  lawyer: LawyerAPI;
  title: string;
  credentials: 'Verified' | 'Pending' | 'Revoked';
  appointments: number;
  systemRole: 'Administrator' | 'Standard' | 'Read-Only';
}

export interface ScheduleConflict {
  lawyerName: string;
  description: string;
  date: string;
}
