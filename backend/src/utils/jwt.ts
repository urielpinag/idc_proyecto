/**
 * Utilidades de JWT y de hash del refresh token.
 *
 * - Access token: firmado con `JWT_SECRET`, vida corta, contiene `sub`,
 *   `email` y `role`.
 * - Refresh token: firmado con `JWT_REFRESH_SECRET` (secreto distinto) e
 *   incluye `sid` para localizar la sesión en la base de datos.
 *
 * El refresh token nunca se persiste en claro: solo su hash SHA-256.
 */

import { createHash } from 'node:crypto';

import jwt, { type SignOptions } from 'jsonwebtoken';

export type UserRole = 'user' | 'admin';

/** Usuario seguro para transportar en la petición o devolver al cliente. */
export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type AccessTokenPayload = {
  sub: string;
  userId: string;
  email: string;
  role: UserRole;
};

export type RefreshTokenPayload = {
  sub: string;
  sid: string;
};

export type JwtConfig = {
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtAccessTtl: string;
  jwtRefreshTtl: string;
};

const ISSUER = 'tvhub-api';
const ACCESS_AUDIENCE = 'tvhub-client';
const REFRESH_AUDIENCE = 'tvhub-refresh';

/** Hash determinista del refresh token para almacenarlo en la sesión. */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function sign(payload: object, secret: string, expiresIn: string, audience: string): string {
  const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'], issuer: ISSUER, audience };
  return jwt.sign(payload, secret, options);
}

export function signAccessToken(user: AuthUser, config: JwtConfig): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  return sign(payload, config.jwtSecret, config.jwtAccessTtl, ACCESS_AUDIENCE);
}

export function signRefreshToken(subject: string, sessionId: string, config: JwtConfig): string {
  const payload: RefreshTokenPayload = { sub: subject, sid: sessionId };
  return sign(payload, config.jwtRefreshSecret, config.jwtRefreshTtl, REFRESH_AUDIENCE);
}

function verify(token: string, secret: string, audience: string): unknown {
  return jwt.verify(token, secret, { issuer: ISSUER, audience });
}

/** Verifica un access token. Devuelve `null` si es inválido o ha expirado. */
export function verifyAccessToken(token: string, secret: string): AccessTokenPayload | null {
  try {
    const decoded = verify(token, secret, ACCESS_AUDIENCE);
    return isAccessTokenPayload(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

/** Verifica un refresh token. Devuelve `null` si es inválido o ha expirado. */
export function verifyRefreshToken(token: string, secret: string): RefreshTokenPayload | null {
  try {
    const decoded = verify(token, secret, REFRESH_AUDIENCE);
    return isRefreshTokenPayload(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

function isAccessTokenPayload(value: unknown): value is AccessTokenPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.sub === 'string' &&
    typeof payload.userId === 'string' &&
    typeof payload.email === 'string' &&
    (payload.role === 'user' || payload.role === 'admin')
  );
}

function isRefreshTokenPayload(value: unknown): value is RefreshTokenPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return typeof payload.sub === 'string' && typeof payload.sid === 'string';
}
