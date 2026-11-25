import { NotFoundError } from '../src/errors/errors.js';

describe('errors/NotFoundError', () => {
  it('usa el mensaje y el código por defecto', () => {
    const error = new NotFoundError();

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.name).toBe('NotFoundError');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Recurso no encontrado.');
  });

  it('acepta un mensaje propio', () => {
    expect(new NotFoundError('Canal inexistente.').message).toBe('Canal inexistente.');
  });
});
