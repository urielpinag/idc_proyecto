import request from 'supertest';

import { createApp } from '../src/app.js';

describe('GET /health', () => {
  const app = createApp({ corsOrigins: ['http://localhost:5173'] });

  it('responde 200 con status ok y no depende de la base de datos', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toMatchObject({ status: 'ok' });
    expect(typeof response.body.uptime).toBe('number');
    expect(typeof response.body.timestamp).toBe('string');
    expect(new Date(response.body.timestamp as string).toString()).not.toBe('Invalid Date');
  });

  it('permite peticiones desde el frontend local (CORS)', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5173');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('no expone la cabecera X-Powered-By', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
