// ─── Backend shape (matches T_APPOINTMENTS exactly) ──────────────────────────

export interface AppointmentAPI {
  id_appointment:      number;
  subject:             string;
  description:         string | null;
  start_datetime:      string; // UTC ISO (TIMESTAMPTZ)
  end_datetime:        string; // UTC ISO (TIMESTAMPTZ)
  id_lawyer:           number;
  id_client:           number;
  id_selected_contact: number;
}

// ─── DTOs (what we send to the API) ──────────────────────────────────────────

export interface CreateAppointmentDto {
  idLawyer:           number;
  idClient:           number;
  idSelectedContact:  number;
  subject:            string;
  description?:       string;
  startDatetime:      string;
  endDatetime:        string;
  timezone?:          string;
}

export type UpdateAppointmentDto = Partial<CreateAppointmentDto>;
