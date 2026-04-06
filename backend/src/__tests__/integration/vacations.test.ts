import request from 'supertest';
import app from '../../app';
import { mockVacation } from '../helpers/fixtures';

jest.mock('../../modules/vacations/vacations.repository');

import * as vacationsRepo from '../../modules/vacations/vacations.repository';

const repo = jest.mocked(vacationsRepo);

const BASE = '/api/v1/vacations';

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── GET /:lawyerId ───────────────────────────────────────────────────────────

describe('GET /vacations/:lawyerId', () => {
  it('returns 200 with the lawyer vacations', async () => {
    repo.findByLawyer.mockResolvedValue([mockVacation]);

    const res = await request(app).get(`${BASE}/1`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      id_lawyer: 1,
      start_date: '2025-07-01',
      end_date: '2025-07-15',
    });
    expect(repo.findByLawyer).toHaveBeenCalledWith(1);
  });

  it('returns 200 with empty array when lawyer has no vacations', async () => {
    repo.findByLawyer.mockResolvedValue([]);

    const res = await request(app).get(`${BASE}/99`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

// ─── POST /:lawyerId ──────────────────────────────────────────────────────────

describe('POST /vacations/:lawyerId', () => {
  it('returns 201 with the created vacation', async () => {
    repo.create.mockResolvedValue(mockVacation);

    const res = await request(app).post(`${BASE}/1`).send({
      startDate: '2025-07-01',
      endDate: '2025-07-15',
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ start_date: '2025-07-01', end_date: '2025-07-15' });
    expect(repo.create).toHaveBeenCalledWith({
      id_lawyer: 1,
      start_date: '2025-07-01',
      end_date: '2025-07-15',
    });
  });

  it('returns 400 when startDate is missing', async () => {
    const res = await request(app).post(`${BASE}/1`).send({ endDate: '2025-07-15' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/startDate and endDate are required/i);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('returns 400 when endDate is missing', async () => {
    const res = await request(app).post(`${BASE}/1`).send({ startDate: '2025-07-01' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/startDate and endDate are required/i);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('returns 400 when startDate is invalid', async () => {
    const res = await request(app).post(`${BASE}/1`).send({
      startDate: 'not-a-date',
      endDate: '2025-07-15',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid startDate/i);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('returns 400 when endDate is invalid', async () => {
    const res = await request(app).post(`${BASE}/1`).send({
      startDate: '2025-07-01',
      endDate: 'not-a-date',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid endDate/i);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('returns 400 when endDate is before startDate', async () => {
    const res = await request(app).post(`${BASE}/1`).send({
      startDate: '2025-07-15',
      endDate: '2025-07-01',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/endDate must be on or after startDate/i);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('allows single-day vacation (startDate === endDate)', async () => {
    const singleDay = { ...mockVacation, start_date: '2025-07-10', end_date: '2025-07-10' };
    repo.create.mockResolvedValue(singleDay);

    const res = await request(app).post(`${BASE}/1`).send({
      startDate: '2025-07-10',
      endDate: '2025-07-10',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.start_date).toBe('2025-07-10');
    expect(res.body.data.end_date).toBe('2025-07-10');
  });
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

describe('DELETE /vacations/:id', () => {
  it('returns 204 on successful deletion', async () => {
    repo.remove.mockResolvedValue(undefined);

    const res = await request(app).delete(`${BASE}/1`);

    expect(res.status).toBe(204);
    expect(repo.remove).toHaveBeenCalledWith(1);
  });

  it('returns 500 when repository throws', async () => {
    repo.remove.mockRejectedValue(new Error('DB error'));

    const res = await request(app).delete(`${BASE}/1`);

    expect(res.status).toBe(500);
  });
});
