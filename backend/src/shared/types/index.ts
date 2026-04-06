/**
 * Shared domain types and error class.
 * All DB row interfaces and DTO shapes live here.
 * Column names match the actual Supabase schema exactly.
 */

// ─── Error ────────────────────────────────────────────────────────────────────

export class HttpError extends Error {
  statusCode: number;
  status?: number;
  details?: string;
  hint?: string;
  conflicts?: Array<{ id_appointment: number; start_datetime: string; end_datetime: string }>;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

// ─── DB Row types ─────────────────────────────────────────────────────────────

export interface Appointment {
  id_appointment: number;
  subject: string;
  description: string | null;
  start_datetime: string; // UTC ISO (TIMESTAMPTZ)
  end_datetime: string;   // UTC ISO (TIMESTAMPTZ)
  id_lawyer: number;
  id_client: number;
  id_selected_contact: number;
}

export interface Lawyer {
  id_lawyer: number;
  national_id: string;
  full_name: string;
  location: string;
  timezone: string;
}

export interface Client {
  id_client: number;
  company_id: string;
  trade_name: string;
  location: string;
  timezone: string;
}

export interface Contact {
  id_contact: number;
  id_lawyer: number | null;
  id_client: number | null;
  method_type: 'InPerson' | 'VideoCall' | 'PhoneCall';
  value: string;
  is_default: boolean;
}

export interface WorkingSchedule {
  id_working_schedule: number;
  id_lawyer: number;
  day_of_week: string; // e.g. 'Monday', 'Tuesday', …
  start_time: string;  // "HH:mm:ss"
  end_time: string;    // "HH:mm:ss"
}

export interface Vacation {
  id_vacation: number;
  id_lawyer: number;
  start_date: string; // "YYYY-MM-DD"
  end_date: string;   // "YYYY-MM-DD"
}

// ─── DTO types ────────────────────────────────────────────────────────────────

export interface CreateAppointmentDto {
  idLawyer: number;
  idClient: number;
  idSelectedContact: number;
  subject: string;
  description?: string;
  startDatetime: string;
  endDatetime: string;
  timezone?: string;
}

export interface UpdateAppointmentDto {
  idLawyer?: number;
  idClient?: number;
  idSelectedContact?: number;
  subject?: string;
  description?: string;
  startDatetime?: string;
  endDatetime?: string;
  timezone?: string;
}

export interface WorkingScheduleSlotDto {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface AddVacationDto {
  startDate: string;
  endDate: string;
}

export interface CreateContactDto {
  idLawyer?: number;
  idClient?: number;
  methodType: 'InPerson' | 'VideoCall' | 'PhoneCall';
  value: string;
  isDefault?: boolean;
}

export interface UpdateContactDto {
  methodType?: 'InPerson' | 'VideoCall' | 'PhoneCall';
  value?: string;
  isDefault?: boolean;
}
