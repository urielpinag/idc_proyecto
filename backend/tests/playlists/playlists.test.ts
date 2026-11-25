/**
 * Pruebas de `/api/playlists` (TVH-32).
 *
 * - Importación M3U y re-sincronización idempotente sin duplicados.
 * - Alias `POST /import` sobre el mismo controlador que `POST /sync`.
 * - Validación, permisos (401/403) y lectura pública con 404.
 */

import bcrypt from 'bcryptjs';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import { createApp } from '../../src/app.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { Channel, Playlist, User, type UserDoc } from '../../src/models/index.js';
import { signAccessToken, type AuthUser } from '../../src/utils/jwt.js';
import { startInMemoryMongo } from '../helpers/in-memory-mongo.js';

const PASSWORD = 'ContraseñaSegura1';
const SOURCE_URL = 'https://example.com/sintetica.m3u';
const M3U_CONTENT = `#EXTM3U
#EXTINF:-1 tvg-id="demo-uno" tvg-name="Canal Demo Uno" tvg-logo="https://example.com/logo-uno.png" group-title="Noticias" tvg-country="México",Canal Demo Uno
https://example.com/uno.m3u8
#EXTINF:-1 tvg-name="Canal Demo Dos" tvg-logo="https://example.com/logo-dos.png" group-title="Deportes" tvg-country="España",Canal Demo Dos
https://example.com/dos.m3u8
`;
const UPDATED_NAME_CONTENT = M3U_CONTENT.replace(',Canal Demo Dos\n', ',Canal Demo Dos HD\n');

const app = createApp({ corsOrigins: [] });

describe('/api/playlists', () => {
  let mongod: MongoMemoryServer;
  let adminUser: UserDoc;
  let regularUser: UserDoc;
  let adminToken: string;
  let userToken: string;

  function bearer(user: { id: string; email: string; role: 'user' | 'admin' }): string {
    const authUser: AuthUser = user;
    return `Bearer ${signAccessToken(authUser, {
      jwtSecret: process.env.JWT_SECRET as string,
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
      jwtAccessTtl: '15m',
      jwtRefreshTtl: '7d',
    })}`;
  }

  function syncBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return { name: 'Playlist Sintética', sourceUrl: SOURCE_URL, content: M3U_CONTENT, ...overrides };
  }

  beforeAll(async () => {
    mongod = await startInMemoryMongo();
    await connectDatabase(mongod.getUri());
    const passwordHash = await bcrypt.hash(PASSWORD, 4);
    adminUser = await User.create({
      email: 'admin-playlists@example.com',
      passwordHash,
      displayName: 'Admin',
      role: 'admin',
    });
    regularUser = await User.create({
      email: 'user-playlists@example.com',
      passwordHash,
      displayName: 'Usuario',
      role: 'user',
    });
    adminToken = bearer({
      id: adminUser._id.toString(),
      email: adminUser.email,
      role: 'admin',
    });
    userToken = bearer({
      id: regularUser._id.toString(),
      email: regularUser.email,
      role: 'user',
    });
  }, 180_000);

  afterAll(async () => {
    await Channel.deleteMany({}).exec();
    await Playlist.deleteMany({}).exec();
    await User.deleteMany({}).exec();
    await disconnectDatabase();
    if (mongod !== undefined) {
      await mongod.stop();
    }
  });

  beforeEach(async () => {
    await Channel.deleteMany({}).exec();
    await Playlist.deleteMany({}).exec();
  });

  it('importa una playlist M3U con sus canales', async () => {
    const response = await request(app)
      .post('/api/playlists/sync')
      .set('Authorization', adminToken)
      .send(syncBody());

    expect(response.status).toBe(200);
    expect(response.body.imported).toBe(2);
    expect(response.body.playlist.name).toBe('Playlist Sintética');
    expect(response.body.playlist.sourceUrl).toBe(SOURCE_URL);
    expect(response.body.playlist.channelCount).toBe(2);

    expect(await Playlist.countDocuments({ sourceUrl: SOURCE_URL })).toBe(1);
    expect(await Channel.countDocuments({ playlistId: response.body.playlist.id })).toBe(2);
  });

  it('re-sincroniza sin duplicar canales y actualiza lastSyncedAt', async () => {
    const first = await request(app)
      .post('/api/playlists/sync')
      .set('Authorization', adminToken)
      .send(syncBody());

    const second = await request(app)
      .post('/api/playlists/sync')
      .set('Authorization', adminToken)
      .send(syncBody());

    expect(second.status).toBe(200);
    expect(second.body.playlist.id).toBe(first.body.playlist.id);
    expect(second.body.playlist.channelCount).toBe(2);

    expect(await Playlist.countDocuments({ sourceUrl: SOURCE_URL })).toBe(1);
    expect(await Channel.countDocuments({ playlistId: second.body.playlist.id })).toBe(2);
    expect(new Date(second.body.playlist.lastSyncedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(first.body.playlist.lastSyncedAt).getTime(),
    );
  });

  it('actualiza el nombre de un canal existente sin duplicarlo', async () => {
    const first = await request(app)
      .post('/api/playlists/sync')
      .set('Authorization', adminToken)
      .send(syncBody());

    const second = await request(app)
      .post('/api/playlists/sync')
      .set('Authorization', adminToken)
      .send(syncBody({ content: UPDATED_NAME_CONTENT }));

    expect(second.status).toBe(200);
    expect(second.body.playlist.id).toBe(first.body.playlist.id);
    expect(await Channel.countDocuments({ playlistId: first.body.playlist.id })).toBe(2);

    const updated = await Channel.findOne({
      playlistId: first.body.playlist.id,
      streamUrl: 'https://example.com/dos.m3u8',
    }).exec();
    expect(updated?.name).toBe('Canal Demo Dos HD');
  });

  it('acepta el alias /api/playlists/import', async () => {
    const response = await request(app)
      .post('/api/playlists/import')
      .set('Authorization', adminToken)
      .send(syncBody());

    expect(response.status).toBe(200);
    expect(response.body.playlist.channelCount).toBe(2);
    expect(await Playlist.countDocuments({ sourceUrl: SOURCE_URL })).toBe(1);
  });

  it('rechaza con 400 un cuerpo inválido', async () => {
    const missingSource = await request(app)
      .post('/api/playlists/sync')
      .set('Authorization', adminToken)
      .send({ name: 'Playlist', content: M3U_CONTENT });
    expect(missingSource.status).toBe(400);
    expect(missingSource.body.error.code).toBe('VALIDATION_ERROR');

    const emptyContent = await request(app)
      .post('/api/playlists/sync')
      .set('Authorization', adminToken)
      .send(syncBody({ content: '#EXTM3U\n' }));
    expect(emptyContent.status).toBe(400);
    expect(emptyContent.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('devuelve 401 sin token al sincronizar', async () => {
    const response = await request(app).post('/api/playlists/sync').send(syncBody());

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('devuelve 403 a un usuario normal al sincronizar', async () => {
    const response = await request(app)
      .post('/api/playlists/sync')
      .set('Authorization', userToken)
      .send(syncBody());

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('lista las playlists y devuelve el detalle por id', async () => {
    const created = await request(app)
      .post('/api/playlists/sync')
      .set('Authorization', adminToken)
      .send(syncBody());
    const id = created.body.playlist.id as string;

    const listResponse = await request(app).get('/api/playlists');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].id).toBe(id);

    const detailResponse = await request(app).get(`/api/playlists/${id}`);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.playlist.name).toBe('Playlist Sintética');
  });

  it('devuelve 404 con un id inexistente o inválido', async () => {
    const missing = await request(app).get('/api/playlists/64b7f3a1f1c2b3d4e5f60718');
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');

    const invalid = await request(app).get('/api/playlists/no-es-un-object-id');
    expect(invalid.status).toBe(404);
    expect(invalid.body.error.code).toBe('NOT_FOUND');
  });
});
