/**
 * Construcción de la aplicación Express.
 *
 * Importar este módulo NO abre conexiones ni puertos: solo arma el pipeline
 * de middlewares y rutas. El arranque vive en `index.ts` y la conexión a la
 * base en `config/database.ts`.
 */

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';

import { loadConfig } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { authRouter } from './routes/auth-routes.js';
import { channelsRouter } from './routes/channels-routes.js';
import { healthRouter } from './routes/health-routes.js';
import { playlistsRouter } from './routes/playlists-routes.js';

export type CreateAppOptions = {
  /** Orígenes permitidos por CORS. Si se omite, se leen de `CORS_ORIGINS`. */
  corsOrigins?: string[];
  /**
   * Hook para montar routers adicionales (rutas protegidas, pruebas) antes del
   * 404. Recibe la app ya armada con los middlewares base.
   */
  beforeNotFound?: (app: Express) => void;
};

/**
 * Crea la app de Express 5.
 *
 * - Refleja el `Origin` de la petición cuando no hay lista de orígenes
 *   configurada (compatible con cookies/credenciales del frontend local) y
 *   solo acepta los orígenes de la lista cuando existe. Con credenciales no se
 *   puede combinar `*`, así que sin lista se refleja el origen de la petición.
 * - Monta `/health`, `/ready`, `/api/auth`, `/api/channels` y `/api/playlists`.
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
        ? (origin, callback) => {
            // Sin `Origin` (p. ej. cliente servidor-a-servidor) se permite.
            callback(null, origin ?? true);
          }
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
  app.use(cookieParser());

  app.use('/', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/channels', channelsRouter);
  app.use('/api/playlists', playlistsRouter);
  options.beforeNotFound?.(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
