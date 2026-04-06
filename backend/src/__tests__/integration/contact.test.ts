import request from 'supertest';
import app from '../../app';
import { mockContact, mockContactClient } from '../helpers/fixtures';

jest.mock('../../modules/contact/contact.repository');

import * as contactRepo from '../../modules/contact/contact.repository';

const repo = jest.mocked(contactRepo);

const BASE = '/api/v1/contact';

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── GET / ────────────────────────────────────────────────────────────────────

describe('GET /contact', () => {
  it('returns 200 with all contacts', async () => {
    repo.findAll.mockResolvedValue([mockContact, mockContactClient]);

    const res = await request(app).get(BASE);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('returns 200 with empty array when no contacts exist', async () => {
    repo.findAll.mockResolvedValue([]);

    const res = await request(app).get(BASE);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

// ─── GET /lawyer/:lawyerId ────────────────────────────────────────────────────

describe('GET /contact/lawyer/:lawyerId', () => {
  it('returns 200 with contacts for the given lawyer', async () => {
    repo.findByLawyer.mockResolvedValue([mockContact]);

    const res = await request(app).get(`${BASE}/lawyer/1`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id_lawyer).toBe(1);
    expect(repo.findByLawyer).toHaveBeenCalledWith(1);
  });

  it('returns 200 with empty array when lawyer has no contacts', async () => {
    repo.findByLawyer.mockResolvedValue([]);

    const res = await request(app).get(`${BASE}/lawyer/99`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

// ─── GET /client/:clientId ────────────────────────────────────────────────────

describe('GET /contact/client/:clientId', () => {
  it('returns 200 with contacts for the given client', async () => {
    repo.findByClient.mockResolvedValue([mockContactClient]);

    const res = await request(app).get(`${BASE}/client/1`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id_client).toBe(1);
    expect(repo.findByClient).toHaveBeenCalledWith(1);
  });
});

// ─── GET /:id ─────────────────────────────────────────────────────────────────

describe('GET /contact/:id', () => {
  it('returns 200 with the contact', async () => {
    repo.findById.mockResolvedValue(mockContact);

    const res = await request(app).get(`${BASE}/1`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id_contact: 1 });
  });

  it('returns 404 when contact does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const res = await request(app).get(`${BASE}/999`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });
});

// ─── POST / ───────────────────────────────────────────────────────────────────

describe('POST /contact', () => {
  it('returns 201 when creating a lawyer contact', async () => {
    repo.create.mockResolvedValue(mockContact);

    const res = await request(app).post(BASE).send({
      idLawyer: 1,
      methodType: 'InPerson',
      value: 'Av. Corrientes 1234',
      isDefault: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ method_type: 'InPerson' });
  });

  it('returns 201 when creating a client contact', async () => {
    repo.create.mockResolvedValue(mockContactClient);

    const res = await request(app).post(BASE).send({
      idClient: 1,
      methodType: 'PhoneCall',
      value: '+54 11 1234-5678',
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ method_type: 'PhoneCall' });
  });

  it('returns 400 when methodType is missing', async () => {
    const res = await request(app).post(BASE).send({
      idLawyer: 1,
      value: 'Av. Corrientes 1234',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/methodType/i);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('returns 400 when value is missing', async () => {
    const res = await request(app).post(BASE).send({
      idLawyer: 1,
      methodType: 'InPerson',
    });

    expect(res.status).toBe(400);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('returns 400 when methodType is invalid', async () => {
    const res = await request(app).post(BASE).send({
      idLawyer: 1,
      methodType: 'Telegram',
      value: '@username',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/methodType must be one of/i);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('returns 400 when neither idLawyer nor idClient is provided', async () => {
    const res = await request(app).post(BASE).send({
      methodType: 'VideoCall',
      value: 'https://meet.example.com/room',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/idLawyer or idClient/i);
    expect(repo.create).not.toHaveBeenCalled();
  });
});

// ─── PATCH /:id ───────────────────────────────────────────────────────────────

describe('PATCH /contact/:id', () => {
  it('returns 200 with updated contact', async () => {
    const updated = { ...mockContact, value: 'Av. Rivadavia 500' };
    repo.findById.mockResolvedValue(mockContact);
    repo.update.mockResolvedValue(updated);

    const res = await request(app).patch(`${BASE}/1`).send({ value: 'Av. Rivadavia 500' });

    expect(res.status).toBe(200);
    expect(res.body.data.value).toBe('Av. Rivadavia 500');
  });

  it('returns 400 when methodType update is invalid', async () => {
    repo.findById.mockResolvedValue(mockContact);

    const res = await request(app).patch(`${BASE}/1`).send({ methodType: 'Fax' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/methodType must be one of/i);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('returns 404 when contact does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const res = await request(app).patch(`${BASE}/999`).send({ value: 'X' });

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

describe('DELETE /contact/:id', () => {
  it('returns 204 on successful deletion', async () => {
    repo.findById.mockResolvedValue(mockContact);
    repo.remove.mockResolvedValue(undefined);

    const res = await request(app).delete(`${BASE}/1`);

    expect(res.status).toBe(204);
    expect(repo.remove).toHaveBeenCalledWith(1);
  });

  it('returns 404 when contact does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const res = await request(app).delete(`${BASE}/999`);

    expect(res.status).toBe(404);
    expect(repo.remove).not.toHaveBeenCalled();
  });
});
