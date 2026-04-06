import type {
  Appointment,
  Lawyer,
  Client,
  Contact,
  WorkingSchedule,
  Vacation,
} from '../../shared/types';

export const mockLawyer: Lawyer = {
  id_lawyer: 1,
  national_id: '20-12345678-9',
  full_name: 'Juan García',
  location: 'Buenos Aires',
  timezone: 'America/Argentina/Buenos_Aires',
};

export const mockClient: Client = {
  id_client: 1,
  company_id: '30-98765432-1',
  trade_name: 'Empresa S.A.',
  location: 'Córdoba',
  timezone: 'America/Argentina/Buenos_Aires',
};

export const mockContact: Contact = {
  id_contact: 1,
  id_lawyer: 1,
  id_client: null,
  method_type: 'InPerson',
  value: 'Av. Corrientes 1234',
  is_default: true,
};

export const mockContactClient: Contact = {
  id_contact: 2,
  id_lawyer: null,
  id_client: 1,
  method_type: 'PhoneCall',
  value: '+54 11 1234-5678',
  is_default: false,
};

export const mockAppointment: Appointment = {
  id_appointment: 1,
  subject: 'Consulta legal',
  description: 'Primera consulta',
  start_datetime: '2025-06-15T13:00:00.000Z',
  end_datetime: '2025-06-15T14:00:00.000Z',
  id_lawyer: 1,
  id_client: 1,
  id_selected_contact: 1,
};

export const mockWorkingSchedule: WorkingSchedule = {
  id_working_schedule: 1,
  id_lawyer: 1,
  day_of_week: 'Monday',
  start_time: '09:00:00',
  end_time: '17:00:00',
};

export const mockVacation: Vacation = {
  id_vacation: 1,
  id_lawyer: 1,
  start_date: '2025-07-01',
  end_date: '2025-07-15',
};
