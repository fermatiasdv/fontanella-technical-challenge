import request from 'supertest';
import app from '../../app';
import { mockClient } from '../helpers/fixtures';

jest.mock('../../modules/clients/clients.repository');

import * as clientsRepo from '../../modules/clients/clients.repository';

const repo = jest.mocked(clientsRepo);

const BASE = '/api/v1/clients';

const createPayload = {
  company_id: '30-98765432-1',
  trade_name: 'Empresa S.A.',
  location: 'Córdoba',
  timezone: 'America/Argentina/Buenos_Aires',
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── GET / ────────────────────────────────────────────────────────────────────

describe('GET /clients', () => {
  it('returns 200 with array of clients', async () => {
    repo.findAll.mockResolvedValue([mockClient]);

    const res = await request(app).get(BASE);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ id_client: 1, trade_name: 'Empresa S.A.' });
  });

  it('returns 200 with empty array when no clients exist', async () => {
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

describe('GET /clients/:id', () => {
  it('returns 200 with the client', async () => {
    repo.findById.mockResolvedValue(mockClient);

    const res = await request(app).get(`${BASE}/1`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id_client: 1 });
  });

  it('returns 404 when client does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const res = await request(app).get(`${BASE}/999`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });
});

// ─── POST / ───────────────────────────────────────────────────────────────────

describe('POST /clients', () => {
  it('returns 201 with the created client', async () => {
    repo.create.mockResolvedValue(mockClient);

    const res = await request(app).post(BASE).send(createPayload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ trade_name: 'Empresa S.A.' });
    expect(repo.create).toHaveBeenCalledWith(createPayload);
  });

  it('returns 500 when repository throws', async () => {
    repo.create.mockRejectedValue(new Error('DB error'));

    const res = await request(app).post(BASE).send(createPayload);

    expect(res.status).toBe(500);
  });
});

// ─── PATCH /:id ───────────────────────────────────────────────────────────────

describe('PATCH /clients/:id', () => {
  it('returns 200 with updated client', async () => {
    const updated = { ...mockClient, trade_name: 'Nueva Empresa S.R.L.' };
    repo.findById.mockResolvedValue(mockClient);
    repo.update.mockResolvedValue(updated);

    const res = await request(app).patch(`${BASE}/1`).send({ trade_name: 'Nueva Empresa S.R.L.' });

    expect(res.status).toBe(200);
    expect(res.body.data.trade_name).toBe('Nueva Empresa S.R.L.');
  });

  it('returns 404 when client does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const res = await request(app).patch(`${BASE}/999`).send({ trade_name: 'X' });

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

describe('DELETE /clients/:id', () => {
  it('returns 204 on successful deletion', async () => {
    repo.findById.mockResolvedValue(mockClient);
    repo.remove.mockResolvedValue(undefined);

    const res = await request(app).delete(`${BASE}/1`);

    expect(res.status).toBe(204);
    expect(repo.remove).toHaveBeenCalledWith(1);
  });

  it('returns 404 when client does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const res = await request(app).delete(`${BASE}/999`);

    expect(res.status).toBe(404);
    expect(repo.remove).not.toHaveBeenCalled();
  });
});
