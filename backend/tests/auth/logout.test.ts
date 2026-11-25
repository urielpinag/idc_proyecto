/**
 * Pruebas de `POST /api/auth/logout` y `POST /api/auth/logout-all`.
 */

import bcrypt from 'bcryptjs';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import { createApp } from '../../src/app.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { Session, User } from '../../src/models/index.js';
import { REFRESH_COOKIE_NAME } from '../../src/services/auth-service.js';
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

describe('logout', () => {
  const app = createApp({ corsOrigins: [] });
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await startInMemoryMongo();
    await connectDatabase(mongod.getUri());
    const passwordHash = await bcrypt.hash(PASSWORD, 4);
    await User.create({ email: 'logout@example.com', passwordHash, displayName: 'Logout' });
    await User.create({ email: 'logout2@example.com', passwordHash, displayName: 'Logout 2' });
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

  async function login(email = 'logout@example.com'): Promise<request.Response> {
    return request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  }

  it('POST /logout exige autenticación', async () => {
    const response = await request(app).post('/api/auth/logout');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /logout revoca la sesión actual y limpia la cookie', async () => {
    const loginResponse = await login();
    const cookie = cookiePair(loginResponse);
    const accessToken = loginResponse.body.accessToken as string;

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', cookie);

    expect(response.status).toBe(200);
    const cleared = readFullCookie(response);
    expect(cleared).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(await Session.countDocuments({ revokedAt: null })).toBe(0);

    const refresh = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(refresh.status).toBe(401);
  });

  it('POST /logout-all revoca todas las sesiones del usuario y las de otros no', async () => {
    const first = await login();
    const second = await login();
    const other = await login('logout2@example.com');

    const response = await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${second.body.accessToken as string}`)
      .set('Cookie', cookiePair(second));

    expect(response.status).toBe(200);
    expect(await Session.countDocuments({ revokedAt: null })).toBe(1);

    const revokedFirst = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookiePair(first));
    expect(revokedFirst.status).toBe(401);

    const stillValid = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookiePair(other));
    expect(stillValid.status).toBe(200);
  });

  it('POST /logout sin cookie revoca igualmente y responde 200', async () => {
    const loginResponse = await login();
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken as string}`);

    expect(response.status).toBe(200);
    // Sin la cookie no se puede identificar la sesión: queda activa hasta expirar.
    expect(await Session.countDocuments({ revokedAt: null })).toBe(1);
  });
});
