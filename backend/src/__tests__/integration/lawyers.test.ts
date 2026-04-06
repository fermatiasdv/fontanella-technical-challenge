import request from 'supertest';
import app from '../../app';
import { mockLawyer } from '../helpers/fixtures';

jest.mock('../../modules/lawyers/lawyers.repository');

import * as lawyersRepo from '../../modules/lawyers/lawyers.repository';

const repo = jest.mocked(lawyersRepo);

const BASE = '/api/v1/lawyers';

const createPayload = {
  national_id: '20-12345678-9',
  full_name: 'Juan García',
  location: 'Buenos Aires',
  timezone: 'America/Argentina/Buenos_Aires',
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── GET / ────────────────────────────────────────────────────────────────────

describe('GET /lawyers', () => {
  it('returns 200 with array of lawyers', async () => {
    repo.findAll.mockResolvedValue([mockLawyer]);

    const res = await request(app).get(BASE);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ id_lawyer: 1, full_name: 'Juan García' });
    expect(repo.findAll).toHaveBeenCalledTimes(1);
  });

  it('returns 200 with empty array when no lawyers exist', async () => {
    repo.findAll.mockResolvedValue([]);

    const res = await request(app).get(BASE);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('returns 500 when repository throws', async () => {
    repo.findAll.mockRejectedValue(new Error('DB down'));

    const res = await request(app).get(BASE);

    expect(res.status).toBe(500);
  });
});

// ─── GET /:id ─────────────────────────────────────────────────────────────────

describe('GET /lawyers/:id', () => {
  it('returns 200 with the lawyer', async () => {
    repo.findById.mockResolvedValue(mockLawyer);

    const res = await request(app).get(`${BASE}/1`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id_lawyer: 1 });
  });

  it('returns 404 when lawyer does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const res = await request(app).get(`${BASE}/999`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });
});

// ─── POST / ───────────────────────────────────────────────────────────────────

describe('POST /lawyers', () => {
  it('returns 201 with the created lawyer', async () => {
    repo.create.mockResolvedValue(mockLawyer);

    const res = await request(app).post(BASE).send(createPayload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ full_name: 'Juan García' });
    expect(repo.create).toHaveBeenCalledWith(createPayload);
  });

  it('returns 500 when repository throws', async () => {
    repo.create.mockRejectedValue(new Error('DB error'));

    const res = await request(app).post(BASE).send(createPayload);

    expect(res.status).toBe(500);
  });
});

// ─── PATCH /:id ───────────────────────────────────────────────────────────────

describe('PATCH /lawyers/:id', () => {
  it('returns 200 with updated lawyer', async () => {
    const updated = { ...mockLawyer, full_name: 'Carlos Rodríguez' };
    repo.findById.mockResolvedValue(mockLawyer);
    repo.update.mockResolvedValue(updated);

    const res = await request(app).patch(`${BASE}/1`).send({ full_name: 'Carlos Rodríguez' });

    expect(res.status).toBe(200);
    expect(res.body.data.full_name).toBe('Carlos Rodríguez');
  });

  it('returns 404 when lawyer does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const res = await request(app).patch(`${BASE}/999`).send({ full_name: 'X' });

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

describe('DELETE /lawyers/:id', () => {
  it('returns 204 on successful deletion', async () => {
    repo.findById.mockResolvedValue(mockLawyer);
    repo.remove.mockResolvedValue(undefined);

    const res = await request(app).delete(`${BASE}/1`);

    expect(res.status).toBe(204);
    expect(repo.remove).toHaveBeenCalledWith(1);
  });

  it('returns 404 when lawyer does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const res = await request(app).delete(`${BASE}/999`);

    expect(res.status).toBe(404);
    expect(repo.remove).not.toHaveBeenCalled();
  });
});
