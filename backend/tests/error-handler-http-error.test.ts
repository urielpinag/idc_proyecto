import express from 'express';
import request from 'supertest';

import { HttpError } from '../src/errors/errors.js';
import { errorHandler } from '../src/middlewares/error-handler.js';

const app = express();
app.get('/http-error', () => {
  throw new HttpError(409, 'CONFLICT', 'Recurso duplicado.', { field: 'email' });
});
app.use(errorHandler);

describe('middlewares/error-handler con HttpError', () => {
  it('conserva código, mensaje y detalles del error de dominio', async () => {
    const response = await request(app).get('/http-error');

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: {
        code: 'CONFLICT',
        message: 'Recurso duplicado.',
        details: { field: 'email' },
      },
    });
  });
});
