import request from 'supertest';
import app from '../../app';
import { mockAppointment } from '../helpers/fixtures';

jest.mock('../../modules/appointments/appointments.repository');
jest.mock('../../shared/services/timezone/timezoneService');

import * as appointmentsRepo from '../../modules/appointments/appointments.repository';
import { normalizeToUTC } from '../../shared/services/timezone/timezoneService';

const repo = jest.mocked(appointmentsRepo);
const mockNormalizeToUTC = jest.mocked(normalizeToUTC);

const BASE = '/api/v1/appointments';

/** UTC datetimes used as the normalised form of the local inputs below. */
const UTC_START = '2025-06-15T13:00:00.000Z';
const UTC_END = '2025-06-15T14:00:00.000Z';

/** Helper: make normalizeToUTC return predictable start/end in order. */
function mockNormalize(start = UTC_START, end = UTC_END) {
  mockNormalizeToUTC.mockResolvedValueOnce(start).mockResolvedValueOnce(end);
}

const createPayload = {
  idLawyer: 1,
  idClient: 1,
  idSelectedContact: 1,
  subject: 'Consulta legal',
  description: 'Primera consulta',
  startDatetime: '2025-06-15 10:00:00',
  endDatetime: '2025-06-15 11:00:00',
  timezone: 'America/Argentina/Buenos_Aires',
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── GET / ────────────────────────────────────────────────────────────────────

describe('GET /appointments', () => {
  it('returns 200 with list of appointments', async () => {
    repo.findAll.mockResolvedValue([mockAppointment]);

    const res = await request(app).get(BASE);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ id_appointment: 1, subject: 'Consulta legal' });
    expect(repo.findAll).toHaveBeenCalledWith({ limit: undefined, offset: undefined });
  });

  it('supports pagination via query params', async () => {
    repo.findAll.mockResolvedValue([]);

    const res = await request(app).get(`${BASE}?limit=10&offset=20`);

    expect(res.status).toBe(200);
    expect(repo.findAll).toHaveBeenCalledWith({ limit: 10, offset: 20 });
  });

  it('returns 200 with empty array when no appointments exist', async () => {
    repo.findAll.mockResolvedValue([]);

    const res = await request(app).get(BASE);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

// ─── GET /:id ─────────────────────────────────────────────────────────────────

describe('GET /appointments/:id', () => {
  it('returns 200 with the appointment', async () => {
    repo.findById.mockResolvedValue(mockAppointment);

    const res = await request(app).get(`${BASE}/1`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id_appointment: 1 });
    expect(repo.findById).toHaveBeenCalledWith(1);
  });

  it('returns 404 when appointment does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const res = await request(app).get(`${BASE}/999`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });
});

// ─── POST / ───────────────────────────────────────────────────────────────────

describe('POST /appointments', () => {
  it('returns 201 with the created appointment', async () => {
    mockNormalize();
    repo.findOverlapping.mockResolvedValue([]);
    repo.create.mockResolvedValue(mockAppointment);

    const res = await request(app).post(BASE).send(createPayload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ id_appointment: 1, subject: 'Consulta legal' });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        start_datetime: UTC_START,
        end_datetime: UTC_END,
        subject: 'Consulta legal',
        id_lawyer: 1,
        id_client: 1,
      }),
    );
  });

  it('returns 400 when subject is missing', async () => {
    const { subject: _s, ...withoutSubject } = createPayload;

    const res = await request(app).post(BASE).send(withoutSubject);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/subject is required/i);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('returns 400 when startDatetime is invalid', async () => {
    const res = await request(app)
      .post(BASE)
      .send({ ...createPayload, startDatetime: 'not-a-date' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid startDatetime/i);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('returns 400 when endDatetime is invalid', async () => {
    const res = await request(app)
      .post(BASE)
      .send({ ...createPayload, endDatetime: 'not-a-date' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid endDatetime/i);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('returns 400 when endDatetime is not after startDatetime', async () => {
    // Return swapped values so start >= end
    mockNormalizeToUTC
      .mockResolvedValueOnce(UTC_END)   // start normalizes to "later" value
      .mockResolvedValueOnce(UTC_START); // end normalizes to "earlier" value

    const res = await request(app)
      .post(BASE)
      .send({ ...createPayload, startDatetime: '2025-06-15 11:00:00', endDatetime: '2025-06-15 10:00:00' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/endDatetime must be after startDatetime/i);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('returns 409 when time slot conflicts with existing appointment', async () => {
    mockNormalize();
    repo.findOverlapping.mockResolvedValue([
      { id_appointment: 5, start_datetime: UTC_START, end_datetime: UTC_END },
    ]);

    const res = await request(app).post(BASE).send(createPayload);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/overlaps/i);
    expect(repo.create).not.toHaveBeenCalled();
  });
});

// ─── PATCH /:id ───────────────────────────────────────────────────────────────

describe('PATCH /appointments/:id', () => {
  it('returns 200 with the updated appointment', async () => {
    const updated = { ...mockAppointment, subject: 'Reunión de seguimiento' };
    repo.findById.mockResolvedValue(mockAppointment);
    repo.update.mockResolvedValue(updated);

    const res = await request(app).patch(`${BASE}/1`).send({ subject: 'Reunión de seguimiento' });

    expect(res.status).toBe(200);
    expect(res.body.data.subject).toBe('Reunión de seguimiento');
  });

  it('normalizes new datetimes when updating times', async () => {
    const updatedDatetimes = {
      ...mockAppointment,
      start_datetime: '2025-06-16T13:00:00.000Z',
      end_datetime: '2025-06-16T14:00:00.000Z',
    };
    repo.findById.mockResolvedValue(mockAppointment);
    mockNormalizeToUTC
      .mockResolvedValueOnce('2025-06-16T13:00:00.000Z')
      .mockResolvedValueOnce('2025-06-16T14:00:00.000Z');
    repo.findOverlapping.mockResolvedValue([]);
    repo.update.mockResolvedValue(updatedDatetimes);

    const res = await request(app).patch(`${BASE}/1`).send({
      startDatetime: '2025-06-16 10:00:00',
      endDatetime: '2025-06-16 11:00:00',
    });

    expect(res.status).toBe(200);
    expect(repo.findOverlapping).toHaveBeenCalledWith(
      '2025-06-16T13:00:00.000Z',
      '2025-06-16T14:00:00.000Z',
      1, // excludes itself
    );
  });

  it('returns 404 when appointment does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const res = await request(app).patch(`${BASE}/999`).send({ subject: 'X' });

    expect(res.status).toBe(404);
  });

  it('returns 409 when updated time conflicts with another appointment', async () => {
    repo.findById.mockResolvedValue(mockAppointment);
    mockNormalize();
    repo.findOverlapping.mockResolvedValue([
      { id_appointment: 2, start_datetime: UTC_START, end_datetime: UTC_END },
    ]);

    const res = await request(app).patch(`${BASE}/1`).send({
      startDatetime: '2025-06-15 10:00:00',
      endDatetime: '2025-06-15 11:00:00',
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/overlaps/i);
  });
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

describe('DELETE /appointments/:id', () => {
  it('returns 204 on successful deletion', async () => {
    repo.findById.mockResolvedValue(mockAppointment);
    repo.remove.mockResolvedValue(undefined);

    const res = await request(app).delete(`${BASE}/1`);

    expect(res.status).toBe(204);
    expect(repo.remove).toHaveBeenCalledWith(1);
  });

  it('returns 404 when appointment does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const res = await request(app).delete(`${BASE}/999`);

    expect(res.status).toBe(404);
    expect(repo.remove).not.toHaveBeenCalled();
  });
});
