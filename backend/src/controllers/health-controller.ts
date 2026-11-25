import type { Response } from 'express';

import { isDatabaseReady } from '../config/database.js';

export type HealthResponse = {
  status: 'ok';
  uptime: number;
  timestamp: string;
};

export type ReadyResponse = {
  status: 'ok' | 'unavailable';
  checks: {
    database: 'up' | 'down';
  };
  timestamp: string;
};

/**
 * Liveness probe: responde 200 si el proceso está vivo.
 * No toca la base de datos.
 */
export function health(_req: unknown, res: Response): void {
  const body: HealthResponse = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(body);
}

/**
 * Readiness probe: 200 solo si la conexión a MongoDB/DocumentDB está viva.
 * Cualquier fallo devuelve 503 sin exponer la URI ni el error del driver.
 */
export async function ready(_req: unknown, res: Response): Promise<void> {
  const isReady = await isDatabaseReady();

  const body: ReadyResponse = {
    status: isReady ? 'ok' : 'unavailable',
    checks: { database: isReady ? 'up' : 'down' },
    timestamp: new Date().toISOString(),
  };

  res.status(isReady ? 200 : 503).json(body);
}
