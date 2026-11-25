import type { ErrorRequestHandler, RequestHandler } from 'express';

import { HttpError } from '../errors/errors.js';

/**
 * Respuesta estándar de error. No incluye stack, mensajes del driver ni
 * variables de entorno.
 */
export type ErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export const notFoundHandler: RequestHandler = (_req, res) => {
  const body: ErrorResponse = {
    error: { code: 'NOT_FOUND', message: 'Ruta no encontrada.' },
  };
  res.status(404).json(body);
};

/**
 * Middleware de errores. Express 5 identifica como handler de error cualquier
 * función con firma de 4 argumentos.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (res.headersSent) {
    return;
  }

  if (err instanceof HttpError) {
    const body: ErrorResponse = {
      error: { code: err.code, message: err.message, details: err.details },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // Errores de cliente producidos por Express (JSON mal formado, payload
  // demasiado grande...): respondemos con su código sin filtrar detalles.
  const status = typeof err === 'object' && err !== null && 'status' in err
    ? (err as { status?: unknown }).status
    : undefined;

  if (typeof status === 'number' && status >= 400 && status < 500) {
    const body: ErrorResponse = {
      error: { code: 'BAD_REQUEST', message: 'Solicitud inválida.' },
    };
    res.status(status).json(body);
    return;
  }

  const body: ErrorResponse = {
    error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' },
  };
  res.status(500).json(body);
};
