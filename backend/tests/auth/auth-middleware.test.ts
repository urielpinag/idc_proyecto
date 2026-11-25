/**
 * Pruebas de `requireAuth` (Bearer) y `requireAdmin` a través de una ruta de
 * prueba montada en la app real.
 */

import bcrypt from 'bcryptjs';
import express, { Router } from 'express';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import { createApp } from '../../src/app.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { requireAdmin, requireAuth } from '../../src/middlewares/auth.js';
import { User, type UserDoc } from '../../src/models/index.js';
import { signAccessToken } from '../../src/utils/jwt.js';
import { startInMemoryMongo } from '../helpers/in-memory-mongo.js';

const PASSWORD = 'ContraseñaSegura1';

/**
 * Las rutas de prueba se montan ANTES del 404 de la app, igual que haría un
 * router protegido real (TVH-31/33).
 */
function buildApp(): express.Express {
  const probe = Router();
  probe.get('/me', requireAuth, (req, res) => {
    res.json({ user: req.user });
  });
  probe.get('/admin', requireAuth, requireAdmin, (_req, res) => {
    res.json({ status: 'ok' });
  });

  const app = createApp({
    corsOrigins: [],
    beforeNotFound: (router) => router.use('/api/_probe', probe),
  });
  return app;
}

describe('middlewares de autorización', () => {
  const app = buildApp();
  let mongod: MongoMemoryServer;
  let regularUser: UserDoc;
  let adminUser: UserDoc;

  beforeAll(async () => {
    mongod = await startInMemoryMongo();
    await connectDatabase(mongod.getUri());
    const passwordHash = await bcrypt.hash(PASSWORD, 4);
    regularUser = await User.create({
      email: 'user@example.com',
      passwordHash,
      displayName: 'Usuario',
      role: 'user',
    });
    adminUser = await User.create({
      email: 'admin@example.com',
      passwordHash,
      displayName: 'Admin',
      role: 'admin',
    });
  }, 180_000);

  afterAll(async () => {
    await User.deleteMany({}).exec();
    await disconnectDatabase();
    if (mongod !== undefined) {
      await mongod.stop();
    }
  });

  async function loginAs(email: string): Promise<string> {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password: PASSWORD });
    return response.body.accessToken as string;
  }

  it('devuelve 401 sin cabecera Authorization', async () => {
    const response = await request(app).get('/api/_probe/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it.each([
    ['token basura', 'Bearer no-es-un-jwt'],
    ['esquema distinto', 'Basic abc'],
    ['Bearer vacío', 'Bearer '],
  ])('devuelve 401 con %s', async (_label, header) => {
    const response = await request(app).get('/api/_probe/me').set('Authorization', header);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('devuelve 401 con un token firmado por otro secreto', async () => {
    const foreign = signAccessToken(
      { id: regularUser._id.toString(), email: regularUser.email, role: 'user' },
      {
        jwtSecret: 'otro-secreto',
        jwtRefreshSecret: 'otro-refresh',
        jwtAccessTtl: '15m',
        jwtRefreshTtl: '7d',
      },
    );

    const response = await request(app)
      .get('/api/_probe/me')
      .set('Authorization', `Bearer ${foreign}`);

    expect(response.status).toBe(401);
  });

  it('devuelve 401 con un access token expirado', async () => {
    const expired = signAccessToken(
      { id: regularUser._id.toString(), email: regularUser.email, role: 'user' },
      {
        jwtSecret: process.env.JWT_SECRET as string,
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
        jwtAccessTtl: '0s',
        jwtRefreshTtl: '7d',
      },
    );

    // Con un TTL de 0s el token ya está expirado al usarse.
    const response = await request(app)
      .get('/api/_probe/me')
      .set('Authorization', `Bearer ${expired}`);

    expect(response.status).toBe(401);
  });

  it('devuelve 401 si el usuario ya no existe o está inactivo', async () => {
    const token = await loginAs('user@example.com');
    await User.updateOne({ _id: regularUser._id }, { isActive: false }).exec();
    try {
      const response = await request(app)
        .get('/api/_probe/me')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(401);
    } finally {
      await User.updateOne({ _id: regularUser._id }, { isActive: true }).exec();
    }

    const ghost = signAccessToken(
      { id: '0123456789abcdef01234567', email: 'ghost@example.com', role: 'user' },
      {
        jwtSecret: process.env.JWT_SECRET as string,
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
        jwtAccessTtl: '15m',
        jwtRefreshTtl: '7d',
      },
    );
    const missing = await request(app)
      .get('/api/_probe/me')
      .set('Authorization', `Bearer ${ghost}`);
    expect(missing.status).toBe(401);
  });

  it('requireAuth carga req.user seguro con un token válido', async () => {
    const token = await loginAs('user@example.com');
    const response = await request(app)
      .get('/api/_probe/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({
      id: regularUser._id.toString(),
      email: 'user@example.com',
      role: 'user',
    });
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });

  it('requireAdmin responde 403 a un usuario normal', async () => {
    const token = await loginAs('user@example.com');
    const response = await request(app)
      .get('/api/_probe/admin')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('requireAdmin permite a un administrador', async () => {
    const token = await loginAs('admin@example.com');
    const response = await request(app)
      .get('/api/_probe/admin')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(adminUser.role).toBe('admin');
  });

  it('responde 500 sin configurar cuando falta JWT_SECRET', async () => {
    const original = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    try {
      const response = await request(app)
        .get('/api/_probe/me')
        .set('Authorization', 'Bearer cualquier-cosa');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('AUTH_NOT_CONFIGURED');
    } finally {
      process.env.JWT_SECRET = original;
    }
  });

  it('frontend con origen permitido recibe CORS con credenciales', async () => {
    const allowed = createApp({ corsOrigins: ['http://localhost:5173'] });
    const response = await request(allowed)
      .post('/api/auth/login')
      .set('Origin', 'http://localhost:5173')
      .send({ email: 'user@example.com', password: PASSWORD });

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });
});
