import 'dotenv/config';

/**
 * Punto de entrada del servidor.
 *
 * Contrato: primero abre la conexión a MongoDB/DocumentDB con `MONGODB_URI`,
 * después pone a escuchar el puerto HTTP. Si la base no está disponible, el
 * proceso termina con código de error en vez de arrancar sin BD.
 */

import { pathToFileURL } from 'node:url';

import { createServer, type Server } from 'node:http';

import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { loadConfig, type AppConfig } from './config/env.js';
import { resolveListeningPort } from './utils/entrypoint.js';

export type RunningServer = {
  server: Server;
  config: AppConfig;
};

export async function startServer(config: AppConfig = loadConfig()): Promise<RunningServer> {
  if (!config.mongodbUri) {
    throw new Error('MONGODB_URI no está definida: no se puede arrancar sin base de datos.');
  }

  await connectDatabase(config.mongodbUri);

  const app = createApp({ corsOrigins: config.corsOrigins });
  const server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.port, () => {
      server.removeListener('error', reject);
      resolve();
    });
  });

  return { server, config };
}

function log(level: 'info' | 'error', message: string): void {
  const line = JSON.stringify({ level, message, timestamp: new Date().toISOString() });
  if (level === 'error') {
    process.stderr.write(`${line}\n`);
    return;
  }
  process.stdout.write(`${line}\n`);
}

export async function main(): Promise<void> {
  const { server, config } = await startServer();
  const port = resolveListeningPort(server.address(), config.port);
  log('info', `API escuchando en el puerto ${port}`);

  const shutdown = async (signal: string): Promise<void> => {
    log('info', `Señal ${signal} recibida: cerrando servidor`);
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    await disconnectDatabase();
    process.exit(0);
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}

/**
 * `true` cuando este módulo es el programa principal (`node dist/index.js`) y no
 * al importarlo (tests, `tsx`). Se compara `import.meta.url` de `index` con el
 * script de `process.argv[1]`; el util `entrypoint.ts` no sirve para esto porque
 * compara su propio `import.meta.url`.
 */
const entrypointPath = process.argv[1];
const isDirectRun =
  entrypointPath !== undefined &&
  entrypointPath.trim() !== '' &&
  import.meta.url === pathToFileURL(entrypointPath).href;

if (isDirectRun) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Error desconocido al arrancar';
    log('error', `No se pudo arrancar la API: ${message}`);
    process.exit(1);
  });
}
