/**
 * Middlewares de autorización.
 *
 * - `requireAuth`: exige `Authorization: Bearer <accessToken>`, valida el JWT
 *   con `JWT_SECRET` y carga `req.user` con datos seguros del usuario activo.
 * - `requireAdmin`: exige `req.user.role === 'admin'` (403 para usuarios
 *   normales). Debe usarse después de `requireAuth`.
 */

import type { RequestHandler } from 'express';

import { loadConfig, type AuthConfig } from '../config/env.js';
import { HttpError } from '../errors/errors.js';
import { findActiveUser } from '../services/auth-service.js';
import { verifyAccessToken } from '../utils/jwt.js';

function unauthorized(): HttpError {
  return new HttpError(401, 'UNAUTHORIZED', 'Autenticación requerida.');
}

function readBearerToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }
  const [scheme, ...rest] = header.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== 'bearer') {
    return null;
  }
  const token = rest.join('');
  return token.length > 0 ? token : null;
}

export function createRequireAuth(authConfig: AuthConfig): RequestHandler {
  return async (req, _res, next) => {
    try {
      const token = readBearerToken(req.get('authorization'));
      if (!token) {
        throw unauthorized();
      }
      if (!authConfig.jwtSecret) {
        throw new HttpError(500, 'AUTH_NOT_CONFIGURED', 'La autenticación no está configurada.');
      }

      const payload = verifyAccessToken(token, authConfig.jwtSecret);
      if (!payload) {
        throw unauthorized();
      }

      const user = await findActiveUser(payload.sub);
      if (!user) {
        throw unauthorized();
      }

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const requireAuth: RequestHandler = (req, res, next) => {
  createRequireAuth(loadConfig().auth)(req, res, next);
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    next(unauthorized());
    return;
  }
  if (req.user.role !== 'admin') {
    next(new HttpError(403, 'FORBIDDEN', 'Se requieren permisos de administrador.'));
    return;
  }
  next();
};
