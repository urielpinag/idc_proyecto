/**
 * Pruebas de `/api/channels` (TVH-31).
 *
 * - Lectura pública: lista con filtros combinables y detalle por id.
 * - Mutaciones administrativas (`POST`, `PUT`, `DELETE`) con permisos.
 * - Borrado lógico: el canal deja de aparecer en el catálogo público.
 */

import bcrypt from 'bcryptjs';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import { createApp } from '../../src/app.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { Channel, User, type UserDoc } from '../../src/models/index.js';
import { signAccessToken, type AuthUser } from '../../src/utils/jwt.js';
import { startInMemoryMongo } from '../helpers/in-memory-mongo.js';

const PASSWORD = 'ContraseñaSegura1';
const INVALID_ID = 'no-es-un-object-id';

const app = createApp({ corsOrigins: [] });

describe('/api/channels', () => {
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

  async function seedChannels(): Promise<void> {
    await Channel.create([
      {
        name: 'Canal México',
        streamUrl: 'https://example.com/mx.m3u8',
        country: 'México',
        categories: ['Noticias'],
      },
      {
        name: 'Canal España',
        streamUrl: 'https://example.com/es.m3u8',
        country: 'España',
        categories: ['Deportes'],
      },
      {
        name: 'Canal México Deportes',
        streamUrl: 'https://example.com/mxspo.m3u8',
        country: 'México',
        categories: ['Deportes'],
      },
      {
        name: 'Canal Oculto',
        streamUrl: 'https://example.com/off.m3u8',
        country: 'México',
        categories: ['Deportes'],
        isActive: false,
      },
    ]);
  }

  beforeAll(async () => {
    mongod = await startInMemoryMongo();
    await connectDatabase(mongod.getUri());
    const passwordHash = await bcrypt.hash(PASSWORD, 4);
    adminUser = await User.create({
      email: 'admin-channels@example.com',
      passwordHash,
      displayName: 'Admin',
      role: 'admin',
    });
    regularUser = await User.create({
      email: 'user-channels@example.com',
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
    await User.deleteMany({}).exec();
    await disconnectDatabase();
    if (mongod !== undefined) {
      await mongod.stop();
    }
  });

  beforeEach(async () => {
    await Channel.deleteMany({}).exec();
    await seedChannels();
  });

  it('lista solo los canales activos', async () => {
    const response = await request(app).get('/api/channels');

    expect(response.status).toBe(200);
    const names = response.body.data.map((c: { name: string }) => c.name);
    expect(names).toHaveLength(3);
    expect(names).not.toContain('Canal Oculto');
  });

  it('combina los filtros name, country y category', async () => {
    const response = await request(app)
      .get('/api/channels')
      .query({ name: 'méxico', country: 'México', category: 'Deportes' });

    expect(response.status).toBe(200);
    expect(response.body.data.map((c: { name: string }) => c.name)).toEqual([
      'Canal México Deportes',
    ]);
  });

  it('devuelve un canal activo por id', async () => {
    const stored = await Channel.findOne({ name: 'Canal España' }).exec();

    const response = await request(app).get(`/api/channels/${stored!._id.toString()}`);

    expect(response.status).toBe(200);
    expect(response.body.channel.name).toBe('Canal España');
  });

  it('devuelve 404 con un id inexistente', async () => {
    const response = await request(app).get('/api/channels/64b7f3a1f1c2b3d4e5f60718');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('trata un id con formato inválido como 404', async () => {
    const response = await request(app).get(`/api/channels/${INVALID_ID}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('permite a un admin crear un canal', async () => {
    const response = await request(app)
      .post('/api/channels')
      .set('Authorization', adminToken)
      .send({
        name: 'Canal Nuevo',
        streamUrl: 'https://example.com/nuevo.m3u8',
        country: 'Argentina',
        categories: ['Cine'],
      });

    expect(response.status).toBe(201);
    expect(response.body.channel.name).toBe('Canal Nuevo');
    expect(await Channel.countDocuments({ name: 'Canal Nuevo' })).toBe(1);
  });

  it('rechaza con 400 un cuerpo de creación inválido', async () => {
    const response = await request(app)
      .post('/api/channels')
      .set('Authorization', adminToken)
      .send({ name: '', streamUrl: '' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('permite a un admin actualizar un canal', async () => {
    const stored = await Channel.findOne({ name: 'Canal España' }).exec();

    const response = await request(app)
      .put(`/api/channels/${stored!._id.toString()}`)
      .set('Authorization', adminToken)
      .send({ name: 'Canal España HD' });

    expect(response.status).toBe(200);
    expect(response.body.channel.name).toBe('Canal España HD');
  });

  it('devuelve 404 al actualizar un canal inexistente', async () => {
    const response = await request(app)
      .put('/api/channels/64b7f3a1f1c2b3d4e5f60718')
      .set('Authorization', adminToken)
      .send({ name: 'Canal X' });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('aplica borrado lógico y el canal desaparece de la lista', async () => {
    const stored = await Channel.findOne({ name: 'Canal México Deportes' }).exec();

    const deleted = await request(app)
      .delete(`/api/channels/${stored!._id.toString()}`)
      .set('Authorization', adminToken);

    expect(deleted.status).toBe(204);
    const persisted = await Channel.findById(stored!._id).exec();
    expect(persisted?.isActive).toBe(false);

    const listed = await request(app).get('/api/channels');
    expect(listed.body.data.map((c: { name: string }) => c.name)).not.toContain(
      'Canal México Deportes',
    );
  });

  it('devuelve 401 sin token al crear un canal', async () => {
    const response = await request(app)
      .post('/api/channels')
      .send({ name: 'Canal Sin Token', streamUrl: 'https://example.com/x.m3u8', country: 'Chile' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('devuelve 403 a un usuario normal en las mutaciones', async () => {
    const stored = await Channel.findOne({ name: 'Canal España' }).exec();
    const url = `/api/channels/${stored!._id.toString()}`;

    const createResponse = await request(app)
      .post('/api/channels')
      .set('Authorization', userToken)
      .send({ name: 'Canal Usuario', streamUrl: 'https://example.com/u.m3u8', country: 'Perú' });
    const updateResponse = await request(app)
      .put(url)
      .set('Authorization', userToken)
      .send({ name: 'Canal Usuario' });
    const deleteResponse = await request(app).delete(url).set('Authorization', userToken);

    expect(createResponse.status).toBe(403);
    expect(updateResponse.status).toBe(403);
    expect(deleteResponse.status).toBe(403);
  });
});
