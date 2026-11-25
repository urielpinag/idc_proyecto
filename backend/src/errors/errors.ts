/**
 * Códigos y mensajes de error de la API.
 *
 * Los mensajes son genéricos a propósito: nunca exponen la cadena de conexión,
 * el stack de la excepción ni variables de entorno.
 */

export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: unknown | undefined;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Recurso no encontrado.') {
    super(404, 'NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}
