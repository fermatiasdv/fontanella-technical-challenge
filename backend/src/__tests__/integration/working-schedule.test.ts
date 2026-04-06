import request from 'supertest';
import app from '../../app';
import { mockWorkingSchedule } from '../helpers/fixtures';

jest.mock('../../modules/working-schedule/workingSchedule.repository');

import * as scheduleRepo from '../../modules/working-schedule/workingSchedule.repository';

const repo = jest.mocked(scheduleRepo);

const BASE = '/api/v1/working-schedule';

const slotsPayload = [
  { dayOfWeek: 'Monday', startTime: '09:00:00', endTime: '17:00:00' },
  { dayOfWeek: 'Tuesday', startTime: '09:00:00', endTime: '17:00:00' },
];

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── GET /:lawyerId ───────────────────────────────────────────────────────────

describe('GET /working-schedule/:lawyerId', () => {
  it('returns 200 with the lawyer schedule', async () => {
    repo.findByLawyer.mockResolvedValue([mockWorkingSchedule]);

    const res = await request(app).get(`${BASE}/1`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ id_lawyer: 1, day_of_week: 'Monday' });
    expect(repo.findByLawyer).toHaveBeenCalledWith(1);
  });

  it('returns 200 with empty array when lawyer has no schedule', async () => {
    repo.findByLawyer.mockResolvedValue([]);

    const res = await request(app).get(`${BASE}/99`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

// ─── PUT /:lawyerId ───────────────────────────────────────────────────────────

describe('PUT /working-schedule/:lawyerId', () => {
  it('returns 200 with upserted schedule', async () => {
    const upserted = slotsPayload.map((s, i) => ({
      id_working_schedule: i + 1,
      id_lawyer: 1,
      day_of_week: s.dayOfWeek,
      start_time: s.startTime,
      end_time: s.endTime,
    }));
    repo.upsert.mockResolvedValue(upserted);

    const res = await request(app).put(`${BASE}/1`).send({ slots: slotsPayload });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(repo.upsert).toHaveBeenCalledWith([
      { id_lawyer: 1, day_of_week: 'Monday', start_time: '09:00:00', end_time: '17:00:00' },
      { id_lawyer: 1, day_of_week: 'Tuesday', start_time: '09:00:00', end_time: '17:00:00' },
    ]);
  });

  it('returns 400 when slots array is empty', async () => {
    const res = await request(app).put(`${BASE}/1`).send({ slots: [] });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/non-empty array/i);
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('returns 400 when slots is not an array', async () => {
    const res = await request(app).put(`${BASE}/1`).send({ slots: 'Monday' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/non-empty array/i);
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('returns 400 when slots is missing from body', async () => {
    const res = await request(app).put(`${BASE}/1`).send({});

    expect(res.status).toBe(400);
    expect(repo.upsert).not.toHaveBeenCalled();
  });
});

// ─── DELETE /slot/:id ─────────────────────────────────────────────────────────

describe('DELETE /working-schedule/slot/:id', () => {
  it('returns 204 on successful slot deletion', async () => {
    repo.remove.mockResolvedValue(undefined);

    const res = await request(app).delete(`${BASE}/slot/1`);

    expect(res.status).toBe(204);
    expect(repo.remove).toHaveBeenCalledWith(1);
  });

  it('returns 500 when repository throws', async () => {
    repo.remove.mockRejectedValue(new Error('DB error'));

    const res = await request(app).delete(`${BASE}/slot/1`);

    expect(res.status).toBe(500);
  });
});
