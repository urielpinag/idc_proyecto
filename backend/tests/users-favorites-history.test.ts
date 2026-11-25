/**
 * Pruebas de `/api/users`, `/api/favorites` y `/api/history` (TVH-33).
 *
 * - Usuarios: administración completa sin exponer `passwordHash`.
 * - Favoritos: cada usuario opera solo sobre los suyos y no duplica canales.
 * - Historial: registro, listado propio y canales más vistos por usuario.
 */

import bcrypt from 'bcryptjs';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { Channel, Favorite, User, WatchHistory, type UserDoc } from '../src/models/index.js';
import { signAccessToken, type AuthUser } from '../src/utils/jwt.js';
import { startInMemoryMongo } from './helpers/in-memory-mongo.js';

const PASSWORD = 'ContraseñaSegura1';
const MISSING_ID = '64b7f3a1f1c2b3d4e5f60718';

const app = createApp({ corsOrigins: [] });

function bearer(user: { id: string; email: string; role: 'user' | 'admin' }): string {
  return `Bearer ${signAccessToken(user as AuthUser, {
    jwtSecret: process.env.JWT_SECRET as string,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
    jwtAccessTtl: '15m',
    jwtRefreshTtl: '7d',
  })}`;
}

describe('usuarios, favoritos e historial (TVH-33)', () => {
  let mongod: MongoMemoryServer;
  let adminUser: UserDoc;
  let regularUser: UserDoc;
  let otherUser: UserDoc;
  let adminToken: string;
  let userToken: string;
  let otherToken: string;
  let channelA: string;
  let channelB: string;

  async function seedChannels(): Promise<void> {
    channelA = (
      await Channel.create({
        name: 'Canal Uno',
        streamUrl: 'https://example.com/uno.m3u8',
        country: 'México',
      })
    )._id.toString();
    channelB = (
      await Channel.create({
        name: 'Canal Dos',
        streamUrl: 'https://example.com/dos.m3u8',
        country: 'España',
      })
    )._id.toString();
  }

  beforeAll(async () => {
    mongod = await startInMemoryMongo();
    await connectDatabase(mongod.getUri());
    const passwordHash = await bcrypt.hash(PASSWORD, 4);
    adminUser = await User.create({
      email: 'admin-users@example.com',
      passwordHash,
      displayName: 'Admin',
      role: 'admin',
    });
    regularUser = await User.create({
      email: 'user-a@example.com',
      passwordHash,
      displayName: 'Usuario A',
      role: 'user',
    });
    otherUser = await User.create({
      email: 'user-b@example.com',
      passwordHash,
      displayName: 'Usuario B',
      role: 'user',
    });
    adminToken = bearer({ id: adminUser._id.toString(), email: adminUser.email, role: 'admin' });
    userToken = bearer({ id: regularUser._id.toString(), email: regularUser.email, role: 'user' });
    otherToken = bearer({ id: otherUser._id.toString(), email: otherUser.email, role: 'user' });
  }, 180_000);

  afterAll(async () => {
    await Favorite.deleteMany({}).exec();
    await WatchHistory.deleteMany({}).exec();
    await Channel.deleteMany({}).exec();
    await User.deleteMany({}).exec();
    await disconnectDatabase();
    if (mongod !== undefined) {
      await mongod.stop();
    }
  });

  beforeEach(async () => {
    await Favorite.deleteMany({}).exec();
    await WatchHistory.deleteMany({}).exec();
    await Channel.deleteMany({}).exec();
    await seedChannels();
  });

  describe('/api/users', () => {
    it('lista y detalla usuarios sin exponer passwordHash', async () => {
      const list = await request(app).get('/api/users').set('Authorization', adminToken);
      const detail = await request(app)
        .get(`/api/users/${regularUser._id.toString()}`)
        .set('Authorization', adminToken);

      expect(list.status).toBe(200);
      expect(list.body.data).toHaveLength(3);
      expect(detail.status).toBe(200);
      expect(detail.body.user.email).toBe('user-a@example.com');
      for (const user of [...list.body.data, detail.body.user]) {
        expect(user).not.toHaveProperty('passwordHash');
        expect(user).not.toHaveProperty('password');
      }
    });

    it('actualiza displayName, role e isActive como admin', async () => {
      const response = await request(app)
        .patch(`/api/users/${regularUser._id.toString()}`)
        .set('Authorization', adminToken)
        .send({ displayName: '  Renombrado  ', role: 'admin', isActive: false });

      expect(response.status).toBe(200);
      expect(response.body.user.displayName).toBe('Renombrado');
      expect(response.body.user.role).toBe('admin');
      expect(response.body.user.isActive).toBe(false);

      const restored = await request(app)
        .patch(`/api/users/${regularUser._id.toString()}`)
        .set('Authorization', adminToken)
        .send({ role: 'user', isActive: true });
      expect(restored.status).toBe(200);
      expect(restored.body.user.isActive).toBe(true);
    });

    it('rechaza con 400 un PATCH inválido', async () => {
      const response = await request(app)
        .patch(`/api/users/${regularUser._id.toString()}`)
        .set('Authorization', adminToken)
        .send({ displayName: '   ', role: 'root', isActive: 'sí' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.fields).toHaveProperty('displayName');
      expect(response.body.error.details.fields).toHaveProperty('role');
      expect(response.body.error.details.fields).toHaveProperty('isActive');

      const missing = await request(app)
        .patch(`/api/users/${MISSING_ID}`)
        .set('Authorization', adminToken)
        .send({ displayName: 'Nadie' });
      expect(missing.status).toBe(404);
      expect(missing.body.error.code).toBe('NOT_FOUND');
    });

    it('desactiva al usuario con DELETE (borrado lógico)', async () => {
      const target = await User.create({
        email: 'borrar@example.com',
        passwordHash: regularUser.passwordHash,
        displayName: 'Para Borrar',
        role: 'user',
      });

      const deleted = await request(app)
        .delete(`/api/users/${target._id.toString()}`)
        .set('Authorization', adminToken);

      expect(deleted.status).toBe(204);
      const persisted = await User.findById(target._id).exec();
      expect(persisted?.isActive).toBe(false);
      expect(persisted?.email).toBe('borrar@example.com');
      await User.deleteOne({ _id: target._id }).exec();

      const missing = await request(app)
        .delete(`/api/users/${MISSING_ID}`)
        .set('Authorization', adminToken);
      expect(missing.status).toBe(404);
      expect(missing.body.error.code).toBe('NOT_FOUND');
    });

    it('devuelve 401 sin token, 403 a un usuario normal y 404 con id inexistente', async () => {
      const stored = await request(app)
        .get(`/api/users/${regularUser._id.toString()}`)
        .set('Authorization', adminToken);
      expect(stored.status).toBe(200);

      const anonymous = await request(app).get('/api/users');
      const forbidden = await request(app).get('/api/users').set('Authorization', userToken);
      const missing = await request(app)
        .get(`/api/users/${MISSING_ID}`)
        .set('Authorization', adminToken);

      expect(anonymous.status).toBe(401);
      expect(anonymous.body.error.code).toBe('UNAUTHORIZED');
      expect(forbidden.status).toBe(403);
      expect(forbidden.body.error.code).toBe('FORBIDDEN');
      expect(missing.status).toBe(404);
      expect(missing.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('/api/favorites', () => {
    it('añade un favorito y lo lista solo para su dueño', async () => {
      const created = await request(app)
        .post('/api/favorites')
        .set('Authorization', userToken)
        .send({ channelId: channelA });
      expect(created.status).toBe(201);

      await request(app)
        .post('/api/favorites')
        .set('Authorization', otherToken)
        .send({ channelId: channelB });

      const mine = await request(app).get('/api/favorites').set('Authorization', userToken);
      const theirs = await request(app).get('/api/favorites').set('Authorization', otherToken);

      expect(mine.status).toBe(200);
      expect(mine.body.data).toHaveLength(1);
      expect(String(mine.body.data[0].channel._id)).toBe(channelA);
      expect(theirs.body.data).toHaveLength(1);
      expect(String(theirs.body.data[0].channel._id)).toBe(channelB);
    });

    it('rechaza con 409 un favorito duplicado', async () => {
      await request(app)
        .post('/api/favorites')
        .set('Authorization', userToken)
        .send({ channelId: channelA });

      const duplicate = await request(app)
        .post('/api/favorites')
        .set('Authorization', userToken)
        .send({ channelId: channelA });

      expect(duplicate.status).toBe(409);
      expect(duplicate.body.error.code).toBe('FAVORITE_CONFLICT');
      expect(await Favorite.countDocuments({}).exec()).toBe(1);
    });

    it('elimina solo el favorito propio y responde 404 si no existe', async () => {
      await Favorite.create({ userId: regularUser._id, channelId: channelA });
      await Favorite.create({ userId: otherUser._id, channelId: channelA });

      const deleted = await request(app)
        .delete(`/api/favorites/${channelA}`)
        .set('Authorization', userToken);
      expect(deleted.status).toBe(204);
      expect(await Favorite.countDocuments({ userId: otherUser._id }).exec()).toBe(1);

      const again = await request(app)
        .delete(`/api/favorites/${channelA}`)
        .set('Authorization', userToken);
      expect(again.status).toBe(404);
      expect(again.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('/api/history', () => {
    it('registra una reproducción y lista solo el historial propio', async () => {
      const recorded = await request(app)
        .post('/api/history/record')
        .set('Authorization', userToken)
        .send({
          channelId: channelA,
          durationSeconds: 120,
          watchedAt: '2026-11-01T10:00:00.000Z',
        });
      expect(recorded.status).toBe(201);
      expect(new Date(recorded.body.history.watchedAt).toISOString()).toBe(
        '2026-11-01T10:00:00.000Z',
      );

      await request(app)
        .post('/api/history/record')
        .set('Authorization', otherToken)
        .send({ channelId: channelB, durationSeconds: 30 });

      const mine = await request(app).get('/api/history').set('Authorization', userToken);
      expect(mine.status).toBe(200);
      expect(mine.body.data).toHaveLength(1);
      expect(String(mine.body.data[0].channelId)).toBe(channelA);
    });

    it('devuelve 401 sin token y 400 con parámetros inválidos', async () => {
      const anonymous = await request(app).get('/api/history');
      const badDate = await request(app)
        .post('/api/history/record')
        .set('Authorization', userToken)
        .send({ channelId: channelA, durationSeconds: 5, watchedAt: 'ayer' });
      const badChannel = await request(app)
        .post('/api/history/record')
        .set('Authorization', userToken)
        .send({ channelId: 'xyz', durationSeconds: 5 });
      const badLimit = await request(app)
        .get('/api/history/top')
        .query({ limit: 0 })
        .set('Authorization', userToken);

      expect(anonymous.status).toBe(401);
      expect(anonymous.body.error.code).toBe('UNAUTHORIZED');
      expect(badDate.status).toBe(400);
      expect(badDate.body.error.details.fields).toHaveProperty('watchedAt');
      expect(badChannel.status).toBe(400);
      expect(badChannel.body.error.details.fields).toHaveProperty('channelId');
      expect(badLimit.status).toBe(400);
      expect(badLimit.body.error.details.fields).toHaveProperty('limit');
    });

    it('agrupa y ordena los canales más vistos por vistas', async () => {
      for (const channelId of [channelA, channelA, channelB]) {
        await request(app)
          .post('/api/history/record')
          .set('Authorization', userToken)
          .send({ channelId, durationSeconds: 10 });
      }
      await request(app)
        .post('/api/history/record')
        .set('Authorization', otherToken)
        .send({ channelId: channelB, durationSeconds: 10 });

      const top = await request(app)
        .get('/api/history/top')
        .set('Authorization', userToken);

      expect(top.status).toBe(200);
      expect(top.body.data).toHaveLength(2);
      expect(String(top.body.data[0].channelId)).toBe(channelA);
      expect(top.body.data[0].views).toBe(2);
      expect(String(top.body.data[1].channelId)).toBe(channelB);
      expect(top.body.data[1].views).toBe(1);
    });

    it('rechaza duración negativa con 400 y canal inexistente con 404', async () => {
      const negative = await request(app)
        .post('/api/history/record')
        .set('Authorization', userToken)
        .send({ channelId: channelA, durationSeconds: -1 });
      const missing = await request(app)
        .post('/api/history/record')
        .set('Authorization', userToken)
        .send({ channelId: MISSING_ID, durationSeconds: 10 });

      expect(negative.status).toBe(400);
      expect(negative.body.error.code).toBe('VALIDATION_ERROR');
      expect(missing.status).toBe(404);
      expect(missing.body.error.code).toBe('NOT_FOUND');
      expect(await WatchHistory.countDocuments({}).exec()).toBe(0);
    });
  });
});
