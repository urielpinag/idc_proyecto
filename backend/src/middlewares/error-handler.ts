import type { ErrorRequestHandler, RequestHandler } from 'express';

import { trace } from '@opentelemetry/api';

import { HttpError } from '../errors/errors.js';

/**
 * Id de la traza activa, si la hay. Usamos la API de OpenTelemetry (no el SDK):
 * es un no-op barato cuando las trazas están desactivadas o no hay span.
 */
function currentTraceId(): string | undefined {
  const spanContext = trace.getActiveSpan()?.spanContext();
  return spanContext?.traceId === undefined || spanContext.traceId === ''
    ? undefined
    : spanContext.traceId;
}

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

  // Traza el error de servidor en el log (sin stack ni datos sensibles) y
  // añade el id de traza para correlacionar con X-Ray/CloudWatch (TVH-41).
  if (!(err instanceof HttpError)) {
    const status = typeof err === 'object' && err !== null && 'status' in err
      ? (err as { status?: unknown }).status
      : undefined;

    if (!(typeof status === 'number' && status >= 400 && status < 500)) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      process.stderr.write(
        `${JSON.stringify({
          level: 'error',
          message: 'Error interno del servidor.',
          error: message,
          traceId: currentTraceId(),
          timestamp: new Date().toISOString(),
        })}\n`,
      );
    }
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
