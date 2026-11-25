import request from 'supertest';

import { createApp } from '../src/app.js';

describe('manejo de errores', () => {
  const app = createApp();

  it('responde 404 JSON para rutas desconocidas', async () => {
    const response = await request(app).get('/ruta-que-no-existe');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Ruta no encontrada.' },
    });
  });

  it('responde 400 sin filtrar detalles para JSON mal formado', async () => {
    const response = await request(app)
      .post('/health')
      .set('Content-Type', 'application/json')
      .send('{ "roto": ');

    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body)).not.toMatch(/node_modules|at Object\./);
  });
});
