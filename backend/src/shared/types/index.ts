/**
 * Shared domain types and error class.
 * All DB row interfaces and DTO shapes live here.
 */

// ─── Error ────────────────────────────────────────────────────────────────────

export class HttpError extends Error {
  statusCode: number;
  status?: number;
  details?: string;
  hint?: string;
  conflicts?: Array<{ id: string; starts_at: string; ends_at: string }>;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

// ─── DB Row types ─────────────────────────────────────────────────────────────

export interface Appointment {
  id: string;
  client_id: string;
  lawyer_id: string;
  starts_at: string; // UTC ISO (TIMESTAMPTZ)
  ends_at: string;   // UTC ISO (TIMESTAMPTZ)
  status: 'scheduled' | 'cancelled' | 'completed';
  notes: string | null;
  created_at?: string;
}

export interface Lawyer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  created_at?: string;
}

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  created_at?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'unread' | 'read';
  created_at: string;
}

export interface WorkingSchedule {
  id: string;
  lawyer_id: string;
  day_of_week: number; // 0 = Sunday … 6 = Saturday
  start_time: string;  // "HH:mm"
  end_time: string;    // "HH:mm"
}

export interface Vacation {
  id: string;
  lawyer_id: string;
  starts_on: string; // "YYYY-MM-DD"
  ends_on: string;   // "YYYY-MM-DD"
  reason: string | null;
}

// ─── DTO types ────────────────────────────────────────────────────────────────

export interface CreateAppointmentDto {
  clientId: string;
  lawyerId: string;
  startsAt: string;
  endsAt: string;
  timezone?: string;
  notes?: string;
}

export interface UpdateAppointmentDto {
  clientId?: string;
  lawyerId?: string;
  startsAt?: string;
  endsAt?: string;
  timezone?: string;
  status?: string;
  notes?: string;
}

export interface WorkingScheduleSlotDto {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface AddVacationDto {
  startsOn: string;
  endsOn: string;
  reason?: string;
}

export interface SubmitMessageDto {
  name?: string;
  email?: string;
  message?: string;
}
