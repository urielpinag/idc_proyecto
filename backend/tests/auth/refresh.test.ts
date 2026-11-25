/**
 * Pruebas de `POST /api/auth/refresh`: emisión y ROTACIÓN del refresh token.
 */

import bcrypt from 'bcryptjs';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import { createApp } from '../../src/app.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { Session, User } from '../../src/models/index.js';
import { REFRESH_COOKIE_NAME, hashRefreshToken } from '../../src/services/auth-service.js';
import { signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../../src/utils/jwt.js';
import { startInMemoryMongo } from '../helpers/in-memory-mongo.js';

const PASSWORD = 'ContraseñaSegura1';

function readSetCookie(response: request.Response, name: string): string[] {
  const header = response.headers['set-cookie'];
  const cookies = Array.isArray(header) ? header : typeof header === 'string' ? [header] : [];
  return cookies.filter((cookie) => cookie.startsWith(`${name}=`));
}

/** Cookie completa (con atributos) para revisar flags. */
function readFullCookie(response: request.Response): string {
  return readSetCookie(response, REFRESH_COOKIE_NAME)[0] as string;
}

/** `nombre=valor` para reenviarla en la siguiente petición. */
function cookiePair(response: request.Response): string {
  return readFullCookie(response).split(';')[0] as string;
}

function tokenValue(cookie: string): string {
  return cookie.slice(cookie.indexOf('=') + 1);
}

describe('POST /api/auth/refresh', () => {
  const app = createApp({ corsOrigins: [] });
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await startInMemoryMongo();
    await connectDatabase(mongod.getUri());
    const passwordHash = await bcrypt.hash(PASSWORD, 4);
    await User.create({ email: 'refresh@example.com', passwordHash, displayName: 'Refresh' });
  }, 180_000);

  beforeEach(async () => {
    await Session.deleteMany({}).exec();
  });

  afterAll(async () => {
    await disconnectDatabase();
    if (mongod !== undefined) {
      await mongod.stop();
    }
  });

  async function login(): Promise<request.Response> {
    return request(app)
      .post('/api/auth/login')
      .send({ email: 'refresh@example.com', password: PASSWORD });
  }

  it('devuelve 200 con nuevo access token y nueva cookie de refresh', async () => {
    const loginResponse = await login();
    const originalCookie = cookiePair(loginResponse);

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', originalCookie);

    expect(response.status).toBe(200);
    expect(typeof response.body.accessToken).toBe('string');
    expect(verifyAccessToken(response.body.accessToken as string, process.env.JWT_SECRET as string)).not.toBeNull();
    const rotatedCookie = readFullCookie(response);
    expect(tokenValue(rotatedCookie)).not.toBe(tokenValue(originalCookie));
    expect(rotatedCookie).toMatch(/HttpOnly/);
    expect(rotatedCookie).toMatch(/SameSite=Strict/);
    expect(rotatedCookie).toMatch(/Path=\/api\/auth/);
    expect(rotatedCookie).toMatch(/Max-Age=\d+/);
  });

  it('rota la sesión: la anterior queda revocada y se crea una nueva', async () => {
    const loginResponse = await login();
    const oldToken = tokenValue(cookiePair(loginResponse));

    await request(app).post('/api/auth/refresh').set('Cookie', cookiePair(loginResponse));

    const sessions = await Session.find({}).sort({ createdAt: 1 }).exec();
    expect(sessions).toHaveLength(2);

    const oldSession = await Session.findOne({ refreshTokenHash: hashRefreshToken(oldToken) }).exec();
    expect(oldSession?.revokedAt).toBeInstanceOf(Date);

    const active = await Session.countDocuments({ revokedAt: null });
    expect(active).toBe(1);
  });

  it('rechaza con 401 reutilizar el token viejo tras la rotación', async () => {
    const loginResponse = await login();
    const oldCookie = cookiePair(loginResponse);

    await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);
    const reuse = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);

    expect(reuse.status).toBe(401);
    expect(reuse.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    expect(reuse.headers['set-cookie']).toBeUndefined();
  });

  it('responde 401 sin cookie', async () => {
    const response = await request(app).post('/api/auth/refresh');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('responde 401 con cookie malformada o firmada con otro secreto', async () => {
    const malformed = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE_NAME}=no-es-un-jwt`);
    expect(malformed.status).toBe(401);

    const loginResponse = await login();
    const token = tokenValue(cookiePair(loginResponse));
    const foreign = signRefreshToken('otro-usuario', 'otra-sesion', {
      jwtSecret: 'x',
      jwtRefreshSecret: 'secreto-distinto',
      jwtAccessTtl: '15m',
      jwtRefreshTtl: '7d',
    });
    expect(verifyRefreshToken(foreign, 'secreto-distinto')).not.toBeNull();
    expect(token).not.toBe(foreign);

    const forged = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE_NAME}=${foreign}`);
    expect(forged.status).toBe(401);
  });

  it('responde 401 cuando la sesión fue revocada o expiró', async () => {
    const loginResponse = await login();
    const cookie = cookiePair(loginResponse);
    const token = tokenValue(cookie);

    await Session.updateOne(
      { refreshTokenHash: hashRefreshToken(token) },
      { expiresAt: new Date(Date.now() - 1000) },
    ).exec();

    const expired = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(expired.status).toBe(401);
  });

  it('responde 401 si el usuario fue desactivado', async () => {
    const loginResponse = await login();
    const cookie = cookiePair(loginResponse);

    await User.updateOne({ email: 'refresh@example.com' }, { isActive: false }).exec();
    try {
      const response = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    } finally {
      await User.updateOne({ email: 'refresh@example.com' }, { isActive: true }).exec();
    }
  });

  it('responde 401 si la sesión ya estaba revocada', async () => {
    const loginResponse = await login();
    const cookie = cookiePair(loginResponse);
    await Session.updateMany({}, { revokedAt: new Date() }).exec();

    const response = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(response.status).toBe(401);
  });
});
