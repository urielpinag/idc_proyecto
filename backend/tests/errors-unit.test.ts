import { HttpError } from '../src/errors/errors.js';

describe('errors/HttpError', () => {
  it('conserva código, mensaje y detalles', () => {
    const error = new HttpError(409, 'CONFLICT', 'Recurso duplicado.', { field: 'email' });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('HttpError');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('CONFLICT');
    expect(error.message).toBe('Recurso duplicado.');
    expect(error.details).toEqual({ field: 'email' });
  });

  it('permite crear un error sin detalles', () => {
    expect(new HttpError(400, 'BAD_REQUEST', 'Inválido').details).toBeUndefined();
  });
});
