/**
 * Unit tests for the appointments service layer.
 * The repository and timezoneService are fully mocked so we can test
 * business rules in isolation without any HTTP or DB layer.
 */

jest.mock('../../modules/appointments/appointments.repository');
jest.mock('../../shared/services/timezone/timezoneService');

import * as service from '../../modules/appointments/appointments.service';
import * as repository from '../../modules/appointments/appointments.repository';
import { normalizeToUTC } from '../../shared/services/timezone/timezoneService';
import type { HttpError } from '../../shared/types';
import { mockAppointment } from '../helpers/fixtures';

const repo = jest.mocked(repository);
const mockNormalize = jest.mocked(normalizeToUTC);

const UTC_START = '2025-06-15T13:00:00.000Z';
const UTC_END   = '2025-06-15T14:00:00.000Z';

function setupNormalize(start = UTC_START, end = UTC_END) {
  mockNormalize.mockResolvedValueOnce(start).mockResolvedValueOnce(end);
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── listAppointments ─────────────────────────────────────────────────────────

describe('listAppointments', () => {
  it('delegates to repository with the given pagination params', async () => {
    repo.findAll.mockResolvedValue([mockAppointment]);

    const result = await service.listAppointments({ limit: 5, offset: 10 });

    expect(repo.findAll).toHaveBeenCalledWith({ limit: 5, offset: 10 });
    expect(result).toHaveLength(1);
  });

  it('works with default (empty) params', async () => {
    repo.findAll.mockResolvedValue([]);

    await service.listAppointments();

    expect(repo.findAll).toHaveBeenCalledWith({});
  });
});

// ─── getAppointment ───────────────────────────────────────────────────────────

describe('getAppointment', () => {
  it('returns the appointment when found', async () => {
    repo.findById.mockResolvedValue(mockAppointment);

    const result = await service.getAppointment(1);

    expect(result).toEqual(mockAppointment);
    expect(repo.findById).toHaveBeenCalledWith(1);
  });

  it('throws 404 when appointment does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.getAppointment(999)).rejects.toMatchObject({
      statusCode: 404,
      message: expect.stringContaining('999'),
    } satisfies Partial<HttpError>);
  });
});

// ─── createAppointment ────────────────────────────────────────────────────────

describe('createAppointment', () => {
  const dto = {
    idLawyer: 1,
    idClient: 1,
    idSelectedContact: 1,
    subject: 'Consulta legal',
    description: 'Primera consulta',
    startDatetime: '2025-06-15 10:00:00',
    endDatetime: '2025-06-15 11:00:00',
    timezone: 'America/Argentina/Buenos_Aires',
  };

  it('creates the appointment and stores UTC datetimes', async () => {
    setupNormalize();
    repo.findOverlapping.mockResolvedValue([]);
    repo.create.mockResolvedValue(mockAppointment);

    const result = await service.createAppointment(dto);

    expect(mockNormalize).toHaveBeenCalledTimes(2);
    expect(repo.findOverlapping).toHaveBeenCalledWith(UTC_START, UTC_END);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ start_datetime: UTC_START, end_datetime: UTC_END }),
    );
    expect(result).toEqual(mockAppointment);
  });

  it('stores null when description is omitted', async () => {
    const { description: _d, ...withoutDesc } = dto;
    setupNormalize();
    repo.findOverlapping.mockResolvedValue([]);
    repo.create.mockResolvedValue({ ...mockAppointment, description: null });

    await service.createAppointment(withoutDesc);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ description: null }),
    );
  });

  it('throws 400 when subject is missing', async () => {
    const { subject: _s, ...withoutSubject } = dto;

    await expect(service.createAppointment(withoutSubject as typeof dto)).rejects.toMatchObject({
      statusCode: 400,
      message: 'subject is required',
    } satisfies Partial<HttpError>);

    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws 400 when startDatetime is not a valid date', async () => {
    await expect(
      service.createAppointment({ ...dto, startDatetime: 'not-a-date' }),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws 400 when endDatetime is not a valid date', async () => {
    await expect(
      service.createAppointment({ ...dto, endDatetime: 'not-a-date' }),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws 400 when end is not after start after normalization', async () => {
    // Simulate: start comes out later than end
    mockNormalize.mockResolvedValueOnce(UTC_END).mockResolvedValueOnce(UTC_START);

    await expect(service.createAppointment(dto)).rejects.toMatchObject({
      statusCode: 400,
      message: 'endDatetime must be after startDatetime',
    } satisfies Partial<HttpError>);

    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws 409 with conflicts when time slot overlaps', async () => {
    setupNormalize();
    const conflicting = { id_appointment: 5, start_datetime: UTC_START, end_datetime: UTC_END };
    repo.findOverlapping.mockResolvedValue([conflicting]);

    await expect(service.createAppointment(dto)).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringMatching(/overlaps/i),
      conflicts: [conflicting],
    });
    expect(repo.create).not.toHaveBeenCalled();
  });
});

// ─── updateAppointment ────────────────────────────────────────────────────────

describe('updateAppointment', () => {
  it('updates subject without touching datetimes', async () => {
    const updated = { ...mockAppointment, subject: 'Nuevo título' };
    repo.findById.mockResolvedValue(mockAppointment);
    repo.update.mockResolvedValue(updated);

    const result = await service.updateAppointment(1, { subject: 'Nuevo título' });

    expect(mockNormalize).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith(1, { subject: 'Nuevo título' });
    expect(result?.subject).toBe('Nuevo título');
  });

  it('normalizes and validates datetimes when times are updated', async () => {
    const newStart = '2025-06-16T13:00:00.000Z';
    const newEnd   = '2025-06-16T14:00:00.000Z';
    repo.findById.mockResolvedValue(mockAppointment);
    mockNormalize.mockResolvedValueOnce(newStart).mockResolvedValueOnce(newEnd);
    repo.findOverlapping.mockResolvedValue([]);
    repo.update.mockResolvedValue({ ...mockAppointment, start_datetime: newStart, end_datetime: newEnd });

    await service.updateAppointment(1, {
      startDatetime: '2025-06-16 10:00:00',
      endDatetime: '2025-06-16 11:00:00',
    });

    // Must exclude self when looking for conflicts
    expect(repo.findOverlapping).toHaveBeenCalledWith(newStart, newEnd, 1);
    expect(repo.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ start_datetime: newStart, end_datetime: newEnd }),
    );
  });

  it('throws 404 when appointment does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.updateAppointment(999, { subject: 'X' })).rejects.toMatchObject({
      statusCode: 404,
    } satisfies Partial<HttpError>);
  });

  it('throws 409 when updated times conflict', async () => {
    repo.findById.mockResolvedValue(mockAppointment);
    setupNormalize();
    repo.findOverlapping.mockResolvedValue([
      { id_appointment: 2, start_datetime: UTC_START, end_datetime: UTC_END },
    ]);

    await expect(
      service.updateAppointment(1, { startDatetime: '2025-06-15 10:00:00', endDatetime: '2025-06-15 11:00:00' }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

// ─── deleteAppointment ────────────────────────────────────────────────────────

describe('deleteAppointment', () => {
  it('deletes the appointment when it exists', async () => {
    repo.findById.mockResolvedValue(mockAppointment);
    repo.remove.mockResolvedValue(undefined);

    await service.deleteAppointment(1);

    expect(repo.remove).toHaveBeenCalledWith(1);
  });

  it('throws 404 when appointment does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.deleteAppointment(999)).rejects.toMatchObject({
      statusCode: 404,
    } satisfies Partial<HttpError>);

    expect(repo.remove).not.toHaveBeenCalled();
  });
});
