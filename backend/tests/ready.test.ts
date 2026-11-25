import type { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { startInMemoryMongo } from './helpers/in-memory-mongo.js';

describe('GET /ready', () => {
  const app = createApp();

  it('responde 503 cuando no hay conexión a la base de datos', async () => {
    const response = await request(app).get('/ready');

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      status: 'unavailable',
      checks: { database: 'down' },
    });
    expect(JSON.stringify(response.body)).not.toMatch(/mongodb(\+srv)?:\/\//);
  });

  describe('con base de datos en memoria', () => {
    let mongod: MongoMemoryServer;

    beforeAll(async () => {
      mongod = await startInMemoryMongo();
      await connectDatabase(mongod.getUri());
    }, 180_000);

    afterAll(async () => {
      await disconnectDatabase();
      if (mongod !== undefined) {
        await mongod.stop();
      }
    });

    it('responde 200 cuando la conexión está viva', async () => {
      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'ok',
        checks: { database: 'up' },
      });
    });
  });
});
