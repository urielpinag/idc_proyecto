/**
 * Construcción de la aplicación Express.
 *
 * Importar este módulo NO abre conexiones ni puertos: solo arma el pipeline
 * de middlewares y rutas. El arranque vive en `index.ts` y la conexión a la
 * base en `config/database.ts`.
 */

import cors from 'cors';
import express, { type Express } from 'express';

import { loadConfig } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { healthRouter } from './routes/health-routes.js';

export type CreateAppOptions = {
  /** Orígenes permitidos por CORS. Si se omite, se leen de `CORS_ORIGINS`. */
  corsOrigins?: string[];
};

/**
 * Crea la app de Express 5.
 *
 * - Refleja el `Origin` de la petición (compatible con cookies/credenciales
 *   del frontend local) y responde `*` cuando la lista de orígenes está vacía.
 * - Monta `/health` y `/ready` en la raíz.
 * - Termina con el 404 JSON y el manejador de errores de la API.
 */
export function createApp(options: CreateAppOptions = {}): Express {
  const corsOrigins = options.corsOrigins ?? loadConfig().corsOrigins;
  const allowAnyOrigin = corsOrigins.length === 0;

  const app = express();
  app.disable('x-powered-by');

  app.use(
    cors({
      origin: allowAnyOrigin
        ? '*'
        : (origin, callback) => {
            if (origin === undefined || corsOrigins.includes(origin)) {
              callback(null, true);
              return;
            }
            callback(null, false);
          },
      credentials: true,
    }),
  );

  app.use(express.json());

  app.use('/', healthRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
