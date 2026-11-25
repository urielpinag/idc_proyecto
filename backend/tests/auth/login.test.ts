/**
 * Pruebas de `POST /api/auth/login` y de la cookie de refresh.
 */

import bcrypt from 'bcryptjs';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import { createApp } from '../../src/app.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { Session, User } from '../../src/models/index.js';
import { REFRESH_COOKIE_NAME } from '../../src/services/auth-service.js';
import { verifyAccessToken } from '../../src/utils/jwt.js';
import { startInMemoryMongo } from '../helpers/in-memory-mongo.js';

const PASSWORD = 'ContraseñaSegura1';

function readSetCookie(response: request.Response, name: string): string[] {
  const header = response.headers['set-cookie'];
  const cookies = Array.isArray(header) ? header : typeof header === 'string' ? [header] : [];
  return cookies.filter((cookie) => cookie.startsWith(`${name}=`));
}

describe('POST /api/auth/login', () => {
  const app = createApp({ corsOrigins: [] });
  let mongod: MongoMemoryServer;
  let passwordHash: string;

  beforeAll(async () => {
    mongod = await startInMemoryMongo();
    await connectDatabase(mongod.getUri());
    passwordHash = await bcrypt.hash(PASSWORD, 4);
  }, 180_000);

  beforeEach(async () => {
    await Session.deleteMany({}).exec();
    await User.deleteMany({}).exec();
    await User.create({
      email: 'activa@example.com',
      passwordHash,
      displayName: 'Cuenta Activa',
      role: 'admin',
    });
    await User.create({
      email: 'inactiva@example.com',
      passwordHash,
      displayName: 'Cuenta Inactiva',
      isActive: false,
    });
  });

  afterAll(async () => {
    await disconnectDatabase();
    if (mongod !== undefined) {
      await mongod.stop();
    }
  });

  it('devuelve 200 con access token válido y usuario seguro', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'Activa@Example.com', password: PASSWORD });

    expect(response.status).toBe(200);
    expect(typeof response.body.accessToken).toBe('string');
    expect(response.body.user).toEqual({
      id: expect.any(String) as string,
      email: 'activa@example.com',
      displayName: 'Cuenta Activa',
      role: 'admin',
    });
    expect(response.body).not.toHaveProperty('refreshToken');
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');

    const payload = verifyAccessToken(
      response.body.accessToken as string,
      process.env.JWT_SECRET as string,
    );
    expect(payload).toMatchObject({
      sub: response.body.user.id as string,
      userId: response.body.user.id as string,
      email: 'activa@example.com',
      role: 'admin',
    });
  });

  it('emite la cookie de refresh con flags seguros (sin Secure fuera de producción)', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'activa@example.com', password: PASSWORD });

    const cookies = readSetCookie(response, REFRESH_COOKIE_NAME);
    expect(cookies).toHaveLength(1);
    const cookie = cookies[0] as string;
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Path=\/api\/auth/);
    expect(cookie).not.toMatch(/Secure/);
  });

  it('crea una sesión con hash del token y metadatos de la petición', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('User-Agent', 'jest-supertest')
      .send({ email: 'activa@example.com', password: PASSWORD });

    const sessions = await Session.find({}).exec();
    expect(sessions).toHaveLength(1);
    const session = sessions[0];
    expect(session?.refreshTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(session?.userAgent).toBe('jest-supertest');
    expect(session?.ip).toBeDefined();
    expect(session?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(session?.revokedAt).toBeNull();

    // El token en claro no está en la base.
    const rawCookie = readSetCookie(response, REFRESH_COOKIE_NAME)[0] as string;
    const tokenValue = rawCookie.split(';')[0]?.split('=')[1] ?? '';
    expect(session?.refreshTokenHash).not.toBe(tokenValue);
  });

  it('responde 401 genérico con contraseña incorrecta', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'activa@example.com', password: 'incorrecta' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(await Session.countDocuments({})).toBe(0);
  });

  it('responde 401 genérico con correo desconocido', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nadie@example.com', password: PASSWORD });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Credenciales inválidas.');
  });

  it('responde 401 con usuario inactivo', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inactiva@example.com', password: PASSWORD });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(await Session.countDocuments({})).toBe(0);
  });

  it('responde 401 si faltan campos', async () => {
    const response = await request(app).post('/api/auth/login').send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('marca Secure en producción', async () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'activa@example.com', password: PASSWORD });

      expect(readSetCookie(response, REFRESH_COOKIE_NAME)[0]).toMatch(/Secure/);
    } finally {
      process.env.NODE_ENV = original;
    }
  });

  it('responde 500 sin configurar cuando faltan los secretos', async () => {
    const original = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    try {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'activa@example.com', password: PASSWORD });

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('AUTH_NOT_CONFIGURED');
      expect(JSON.stringify(response.body)).not.toContain('JWT_SECRET');
    } finally {
      process.env.JWT_SECRET = original;
    }
  });
});
