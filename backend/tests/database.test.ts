import {
  connectDatabase,
  disconnectDatabase,
  getDatabaseStatus,
  isDatabaseReady,
} from '../src/config/database.js';

describe('config/database', () => {
  afterAll(async () => {
    await disconnectDatabase();
  });

  it('reporta estado sin conexión al importar el módulo', () => {
    expect(['disconnected', 'connecting']).toContain(getDatabaseStatus());
  });

  it('isDatabaseReady devuelve false sin conexión y no lanza', async () => {
    await expect(isDatabaseReady()).resolves.toBe(false);
  });

  it('connectDatabase rechaza una URI vacía', async () => {
    await expect(connectDatabase('   ')).rejects.toThrow(/MONGODB_URI/);
  });
});
