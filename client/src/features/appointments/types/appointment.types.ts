export interface AppointmentAPI {
  id_appointment:      number;
  subject:             string;
  description:         string | null;
  start_datetime:      string;
  end_datetime:        string;
  id_lawyer:           number;
  id_client:           number;
  id_selected_contact: number;
}

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
