import express, { type Express } from 'express';
import request from 'supertest';

import { errorHandler } from '../src/middlewares/error-handler.js';

function buildApp(handler: express.RequestHandler): Express {
  const app = express();
  app.get('/boom', handler);
  app.use(errorHandler);
  return app;
}

describe('middlewares/error-handler', () => {
  it('traduce un error de cliente de Express sin filtrar detalles', async () => {
    const app = buildApp((_req, _res, next) => {
      next(Object.assign(new Error('payload inválido'), { status: 422 }));
    });

    const response = await request(app).get('/boom');

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      error: { code: 'BAD_REQUEST', message: 'Solicitud inválida.' },
    });
    expect(JSON.stringify(response.body)).not.toMatch(/node_modules|payload inválido/);
  });

  it('responde 500 genérico ante errores internos', async () => {
    const app = buildApp(() => {
      throw new Error('fallo interno con ruta /home/user');
    });

    const response = await request(app).get('/boom');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' },
    });
    expect(JSON.stringify(response.body)).not.toMatch(/\/home\/user/);
  });

  it('no escribe sobre una respuesta ya enviada', async () => {
    const app = express();
    app.get('/sent', (_req, res, next) => {
      res.status(200).json({ ok: true });
      next(new Error('tarde'));
    });
    app.use(errorHandler);

    const response = await request(app).get('/sent');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });
});
