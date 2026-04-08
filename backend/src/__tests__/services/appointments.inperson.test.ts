/**
 * Tests for the InPerson location validation in the appointments service.
 *
 * When a contact method is InPerson, the `value` field (city) of the lawyer's
 * InPerson contact and the client's InPerson contact must match; otherwise the
 * appointment cannot be saved.
 */

/// <reference types="jest" />

jest.mock('../../modules/appointments/appointments.repository');
jest.mock('../../shared/services/timezone/timezoneService');
jest.mock('../../modules/lawyers/lawyers.repository');
jest.mock('../../modules/clients/clients.repository');
jest.mock('../../modules/contact/contact.repository');
jest.mock('../../modules/working-schedule/workingSchedule.repository');
jest.mock('../../modules/vacations/vacations.repository');

import * as service             from '../../modules/appointments/appointments.service';
import * as repository          from '../../modules/appointments/appointments.repository';
import * as lawyersRepo         from '../../modules/lawyers/lawyers.repository';
import * as clientsRepo         from '../../modules/clients/clients.repository';
import * as contactRepo         from '../../modules/contact/contact.repository';
import * as workingScheduleRepo from '../../modules/working-schedule/workingSchedule.repository';
import * as vacationsRepo       from '../../modules/vacations/vacations.repository';
import { normalizeToUTC }       from '../../shared/services/timezone/timezoneService';
import type { HttpError }       from '../../shared/types';
import {
  mockLawyer,
  mockClient,
  mockContact,
  mockAppointment,
  mockWorkingSchedule,
} from '../helpers/fixtures';

const repo                 = jest.mocked(repository);
const mockLawyersRepo      = jest.mocked(lawyersRepo);
const mockClientsRepo      = jest.mocked(clientsRepo);
const mockContactRepo      = jest.mocked(contactRepo);
const mockWorkingScheduleR = jest.mocked(workingScheduleRepo);
const mockVacationsRepo    = jest.mocked(vacationsRepo);
const mockNormalize        = jest.mocked(normalizeToUTC);

// Monday 2025-06-16: 10:00–11:00 Buenos Aires time (UTC-3 → 13:00–14:00 UTC)
const UTC_MON_START = '2025-06-16T13:00:00.000Z';
const UTC_MON_END   = '2025-06-16T14:00:00.000Z';

const baseDto = {
  idLawyer:          1,
  idClient:          1,
  idSelectedContact: 1,
  subject:           'Consulta presencial',
  startDatetime:     '2025-06-16 10:00:00',
  endDatetime:       '2025-06-16 11:00:00',
  timezone:          'America/Argentina/Buenos_Aires',
};

/**
 * Sets up ALL mocks needed to reach the InPerson city check.
 *
 * @param lawyerCity  - value stored in the lawyer's InPerson contact
 * @param clientCity  - value stored in the client's InPerson contact
 * @param methodType  - contact method type (defaults to InPerson)
 */
function setupMocks(
  lawyerCity: string,
  clientCity: string,
  methodType: 'InPerson' | 'VideoCall' | 'PhoneCall' = 'InPerson',
) {
  mockNormalize
    .mockResolvedValueOnce(UTC_MON_START)
    .mockResolvedValueOnce(UTC_MON_END);

  // Lawyer — for working-hours validation
  mockLawyersRepo.findById.mockResolvedValue(mockLawyer);

  // Working schedule — Monday slot covering 10:00–11:00
  mockWorkingScheduleR.findByLawyer.mockResolvedValue([mockWorkingSchedule]);

  // No vacations
  mockVacationsRepo.findByLawyer.mockResolvedValue([]);

  // Client — timezone BA so 10:00–11:00 is within 09:00–18:00 on a weekday
  mockClientsRepo.findById.mockResolvedValue(mockClient);

  // Lawyer's contact (the selected one)
  mockContactRepo.findById.mockResolvedValue({
    ...mockContact,
    method_type: methodType,
    value: lawyerCity,
  });

  // Client's contacts — same method type with clientCity as value
  mockContactRepo.findByClient.mockResolvedValue([
    {
      id_contact:  2,
      id_lawyer:   null,
      id_client:   1,
      method_type: methodType,
      value:       clientCity,
      is_default:  true,
    },
  ]);

  // No overlapping appointments
  repo.findOverlapping.mockResolvedValue([]);

  // Successful DB insert
  repo.create.mockResolvedValue(mockAppointment);
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── createAppointment – InPerson city validation ────────────────────────────

describe('createAppointment – InPerson city (value) validation', () => {
  it('throws 422 when InPerson and cities differ', async () => {
    setupMocks('Buenos Aires', 'Córdoba');

    await expect(service.createAppointment(baseDto)).rejects.toMatchObject({
      statusCode: 422,
      message: expect.stringContaining('presencial'),
    } satisfies Partial<HttpError>);

    expect(repo.create).not.toHaveBeenCalled();
  });

  it('error message includes both cities when they differ', async () => {
    setupMocks('Buenos Aires', 'Rosario');

    let caughtError: HttpError | null = null;
    try {
      await service.createAppointment(baseDto);
    } catch (e) {
      caughtError = e as HttpError;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError!.message).toContain('Buenos Aires');
    expect(caughtError!.message).toContain('Rosario');
  });

  it('creates appointment when InPerson and cities match', async () => {
    setupMocks('Buenos Aires', 'Buenos Aires');

    const result = await service.createAppointment(baseDto);

    expect(result).toEqual(mockAppointment);
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it('does NOT apply city check for VideoCall (different cities allowed)', async () => {
    setupMocks('Buenos Aires', 'Córdoba', 'VideoCall');

    const result = await service.createAppointment(baseDto);

    expect(result).toEqual(mockAppointment);
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it('does NOT apply city check for PhoneCall (different cities allowed)', async () => {
    setupMocks('Buenos Aires', 'Mendoza', 'PhoneCall');

    const result = await service.createAppointment(baseDto);

    expect(result).toEqual(mockAppointment);
    expect(repo.create).toHaveBeenCalledTimes(1);
  });
});

// ─── updateAppointment – InPerson city validation ────────────────────────────

describe('updateAppointment – InPerson city (value) validation', () => {
  it('throws 422 when updating times and InPerson cities differ', async () => {
    repo.findById.mockResolvedValue(mockAppointment);
    setupMocks('Buenos Aires', 'Córdoba');

    await expect(
      service.updateAppointment(1, {
        startDatetime: '2025-06-16 10:00:00',
        endDatetime:   '2025-06-16 11:00:00',
      }),
    ).rejects.toMatchObject({
      statusCode: 422,
      message: expect.stringContaining('presencial'),
    } satisfies Partial<HttpError>);

    expect(repo.update).not.toHaveBeenCalled();
  });

  it('succeeds when updating times and InPerson cities match', async () => {
    const updated = { ...mockAppointment, start_datetime: UTC_MON_START, end_datetime: UTC_MON_END };
    repo.findById.mockResolvedValue(mockAppointment);
    setupMocks('Buenos Aires', 'Buenos Aires');
    repo.update.mockResolvedValue(updated);

    const result = await service.updateAppointment(1, {
      startDatetime: '2025-06-16 10:00:00',
      endDatetime:   '2025-06-16 11:00:00',
    });

    expect(result).toEqual(updated);
    expect(repo.update).toHaveBeenCalledTimes(1);
  });
});
