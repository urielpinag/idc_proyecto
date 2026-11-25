import type { MongoMemoryServer } from 'mongodb-memory-server';
import type { AddressInfo } from 'node:net';

import { disconnectDatabase } from '../src/config/database.js';
import { loadConfig } from '../src/config/env.js';
import { startServer } from '../src/index.js';
import { isDirectRun, resolveListeningPort } from '../src/utils/entrypoint.js';
import { startInMemoryMongo } from './helpers/in-memory-mongo.js';

describe('arranque del servidor', () => {
  it('startServer falla sin MONGODB_URI y no abre puerto', async () => {
    await expect(startServer(loadConfig({}))).rejects.toThrow(/MONGODB_URI/);
  });

  it('resolveListeningPort usa el puerto asignado y el fallback', () => {
    expect(resolveListeningPort({ port: 4321 } as AddressInfo, 3000)).toBe(4321);
    expect(resolveListeningPort(null, 3000)).toBe(3000);
    expect(resolveListeningPort('unix:/tmp/sock', 3000)).toBe(3000);
  });

  it('isDirectRun es false cuando el módulo se importa desde Jest', () => {
    expect(isDirectRun).toBe(false);
  });

  describe('con base de datos en memoria', () => {
    let mongod: MongoMemoryServer;

    beforeAll(async () => {
      mongod = await startInMemoryMongo();
    }, 180_000);

    afterAll(async () => {
      await disconnectDatabase();
      if (mongod !== undefined) {
        await mongod.stop();
      }
    });

    it('conecta primero y luego escucha en el puerto indicado', async () => {
      const { server } = await startServer({
        ...loadConfig({ MONGODB_URI: mongod.getUri() }),
        port: 0,
      });

      const address = server.address() as AddressInfo;
      expect(address.port).toBeGreaterThan(0);

      const health = await fetch(`http://127.0.0.1:${address.port}/health`);
      expect(health.status).toBe(200);

      const ready = await fetch(`http://127.0.0.1:${address.port}/ready`);
      expect(ready.status).toBe(200);

      await new Promise<void>((resolve) => server.close(() => resolve()));
    });
  });
});
