/**
 * Pruebas de `POST /api/auth/register`.
 */

import { jest } from '@jest/globals';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import { createApp } from '../../src/app.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { User } from '../../src/models/index.js';
import { startInMemoryMongo } from '../helpers/in-memory-mongo.js';

const VALID = {
  email: 'Uriel.Pina@Example.com',
  password: 'ContraseñaSegura1',
  displayName: 'Uriel Pina',
};

describe('POST /api/auth/register', () => {
  const app = createApp({ corsOrigins: [] });
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await startInMemoryMongo();
    await connectDatabase(mongod.getUri());
    await User.init();
  }, 180_000);

  afterEach(async () => {
    await User.deleteMany({}).exec();
  });

  afterAll(async () => {
    await disconnectDatabase();
    if (mongod !== undefined) {
      await mongod.stop();
    }
  });

  it('crea el usuario y responde 201 con datos seguros', async () => {
    const response = await request(app).post('/api/auth/register').send(VALID);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      user: {
        id: expect.any(String) as string,
        email: 'uriel.pina@example.com',
        displayName: 'Uriel Pina',
        role: 'user',
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });

  it('guarda la contraseña con hash y respeta el role forzado a user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...VALID, role: 'admin' });

    expect(response.status).toBe(201);

    const stored = await User.findOne({ email: 'uriel.pina@example.com' }).exec();
    expect(stored).not.toBeNull();
    expect(stored?.passwordHash).toBeDefined();
    expect(stored?.passwordHash).not.toBe(VALID.password);
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(stored?.role).toBe('user');
  });

  it.each([
    ['email inválido', { ...VALID, email: 'no-es-un-correo' }],
    ['password corta', { ...VALID, password: 'corta' }],
    ['displayName vacío', { ...VALID, displayName: '  ' }],
    ['campos ausentes', {}],
  ])('responde 400 con %s', async (_label, body) => {
    const response = await request(app).post('/api/auth/register').send(body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.fields).toBeDefined();
  });

  it('responde 409 cuando el correo ya existe (sin distinguir mayúsculas)', async () => {
    await request(app).post('/api/auth/register').send(VALID);
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...VALID, email: 'uriel.pina@EXAMPLE.com' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('responde 409 si el índice único rechaza un duplicado concurrente', async () => {
    await User.create({
      email: 'carrera@example.com',
      passwordHash: 'hash-de-prueba',
      displayName: 'Carrera',
      role: 'user',
      isActive: true,
    });

    // Se simula una carrera: el `exists` pasa pero el insert choca con el índice.
    const existsSpy = jest.spyOn(User, 'exists');
    jest.spyOn(User, 'create').mockRejectedValueOnce(
      Object.assign(new Error('E11000 duplicate key'), { code: 11000 }),
    );

    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...VALID, email: 'carrera@example.com' });

    expect(existsSpy).toHaveBeenCalled();
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('no filtra secretos ni detalles internos en los errores', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'malo', password: 'x', displayName: '' });

    const raw = JSON.stringify(response.body);
    expect(raw).not.toContain(process.env.JWT_SECRET as string);
    expect(raw).not.toContain(process.env.JWT_REFRESH_SECRET as string);
    expect(raw).not.toContain('mongodb://');
    expect(raw).not.toContain('at '); // sin stack traces
  });
});
