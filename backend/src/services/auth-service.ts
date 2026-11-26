/**
 * Lógica de autenticación: registro, login, refresh rotativo y logout.
 *
 * Reglas de seguridad:
 * - Las contraseñas se guardan con bcrypt (nunca en claro).
 * - El refresh token viaja en cookie HttpOnly; en base de datos solo queda su
 *   hash SHA-256.
 * - Cada refresh rota el token: se revoca la sesión anterior y se crea una
 *   nueva, así un token robado deja de servir.
 */

import bcrypt from 'bcryptjs';
import type { Request } from 'express';

import type { AuthConfig } from '../config/env.js';
import { HttpError } from '../errors/errors.js';
import { Session, User, type UserDoc } from '../models/index.js';
import {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type AuthUser,
  type JwtConfig,
} from '../utils/jwt.js';

export { hashRefreshToken };

export const BCRYPT_ROUNDS = 10;
export const REFRESH_COOKIE_NAME = 'refreshToken';
export const REFRESH_COOKIE_PATH = '/api/auth';
/** Duración de la cookie de refresh si no se puede derivar del TTL configurado. */
const DEFAULT_REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MIN_DISPLAY_NAME_LENGTH = 2;
const MAX_DISPLAY_NAME_LENGTH = 60;

export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  refreshMaxAgeMs: number;
  user: PublicUser;
};

function toPublicUser(user: UserDoc): PublicUser {
  return {
    id: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
    role: user.role as 'user' | 'admin',
  };
}

function toAuthUser(user: UserDoc): AuthUser {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role as 'user' | 'admin',
  };
}

function toJwtConfig(config: AuthConfig): JwtConfig {
  if (!config.jwtSecret || !config.jwtRefreshSecret) {
    throw new HttpError(
      500,
      'AUTH_NOT_CONFIGURED',
      'La autenticación no está configurada en el servidor.',
    );
  }
  return {
    jwtSecret: config.jwtSecret,
    jwtRefreshSecret: config.jwtRefreshSecret,
    jwtAccessTtl: config.jwtAccessTtl,
    jwtRefreshTtl: config.jwtRefreshTtl,
  };
}

/**
 * Convierte el TTL en texto (`15m`, `7d`, `3600`) a milisegundos para la
 * longevidad de la cookie. Si no se reconoce el formato, usa 7 días.
 */
export function parseTtlMs(ttl: string): number {
  const match = /^(\d+)\s*([smhdw])?$/i.exec(ttl.trim());
  if (!match) {
    return DEFAULT_REFRESH_COOKIE_MAX_AGE_MS;
  }
  const amount = Number.parseInt(match[1] ?? '', 10);
  if (!Number.isInteger(amount) || amount <= 0) {
    return DEFAULT_REFRESH_COOKIE_MAX_AGE_MS;
  }
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };
  return amount * (multipliers[(match[2] ?? 's').toLowerCase()] ?? 1000);
}

export function validateRegisterInput(
  email: unknown,
  password: unknown,
  displayName: unknown,
): { email: string; password: string; displayName: string } {
  const fields: Record<string, string> = {};

  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    fields.email = 'El correo no es válido.';
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    fields.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  } else if (password.length > MAX_PASSWORD_LENGTH) {
    fields.password = `La contraseña no puede superar ${MAX_PASSWORD_LENGTH} caracteres.`;
  }

  const normalizedName = typeof displayName === 'string' ? displayName.trim() : '';
  if (normalizedName.length < MIN_DISPLAY_NAME_LENGTH) {
    fields.displayName = `El nombre debe tener al menos ${MIN_DISPLAY_NAME_LENGTH} caracteres.`;
  } else if (normalizedName.length > MAX_DISPLAY_NAME_LENGTH) {
    fields.displayName = `El nombre no puede superar ${MAX_DISPLAY_NAME_LENGTH} caracteres.`;
  }

  if (Object.keys(fields).length > 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Datos de registro inválidos.', { fields });
  }

  return { email: normalizedEmail, password: password as string, displayName: normalizedName };
}

export async function registerUser(
  config: AuthConfig,
  input: { email: unknown; password: unknown; displayName: unknown },
): Promise<PublicUser> {
  const { email, password, displayName } = validateRegisterInput(
    input.email,
    input.password,
    input.displayName,
  );

  const existing = await User.exists({ email });
  if (existing) {
    throw new HttpError(409, 'EMAIL_TAKEN', 'El correo ya está registrado.');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let user: UserDoc;
  try {
    // `role` se fija siempre a `user`: el cliente no puede autoasignarse admin.
    user = await User.create({ email, passwordHash, displayName, role: 'user', isActive: true });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new HttpError(409, 'EMAIL_TAKEN', 'El correo ya está registrado.');
    }
    throw error;
  }

  // Evita que la configuración incompleta pase inadvertida al registrarse.
  toJwtConfig(config);

  return toPublicUser(user);
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000
  );
}

function readClientInfo(req: Request): { userAgent: string | undefined; ip: string | undefined } {
  const userAgent = req.get('user-agent');
  return {
    userAgent: userAgent && userAgent.trim().length > 0 ? userAgent : undefined,
    ip: req.ip,
  };
}

export type IssuedSession = { sessionId: string; refreshToken: string; maxAgeMs: number };

async function createSession(
  user: UserDoc,
  config: JwtConfig,
  req: Request,
): Promise<IssuedSession> {
  const sessionId = new Session()._id.toString();
  const refreshToken = signRefreshToken(user._id.toString(), sessionId, config);
  const maxAgeMs = parseTtlMs(config.jwtRefreshTtl);
  const { userAgent, ip } = readClientInfo(req);

  await Session.create({
    _id: sessionId,
    userId: user._id,
    refreshTokenHash: hashRefreshToken(refreshToken),
    userAgent,
    ip,
    expiresAt: new Date(Date.now() + maxAgeMs),
    revokedAt: null,
  });

  return { sessionId, refreshToken, maxAgeMs };
}

export async function loginUser(
  config: AuthConfig,
  req: Request,
  email: unknown,
  password: unknown,
): Promise<AuthSession> {
  const jwtConfig = toJwtConfig(config);
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const rawPassword = typeof password === 'string' ? password : '';

  if (normalizedEmail.length === 0 || rawPassword.length === 0) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Credenciales inválidas.');
  }

  const user = await User.findOne({ email: normalizedEmail }).exec();
  const passwordMatches =
    user === null ? false : await bcrypt.compare(rawPassword, user.passwordHash);

  if (user === null || !passwordMatches || !user.isActive) {
    // Mensaje genérico: no revelamos si el correo existe o está inactivo.
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Credenciales inválidas.');
  }

  const session = await createSession(user, jwtConfig, req);
  const accessToken = signAccessToken(toAuthUser(user), jwtConfig);

  return {
    accessToken,
    refreshToken: session.refreshToken,
    refreshMaxAgeMs: session.maxAgeMs,
    user: toPublicUser(user),
  };
}

export async function refreshSession(
  config: AuthConfig,
  req: Request,
  rawRefreshToken: string | undefined,
): Promise<AuthSession> {
  const jwtConfig = toJwtConfig(config);

  if (!rawRefreshToken) {
    throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'Sesión inválida o expirada.');
  }

  const payload = verifyRefreshToken(rawRefreshToken, jwtConfig.jwtRefreshSecret);
  if (!payload) {
    throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'Sesión inválida o expirada.');
  }

  const session = await Session.findById(payload.sid).exec();
  const now = new Date();

  if (
    !session ||
    session.revokedAt !== null ||
    session.expiresAt.getTime() <= now.getTime() ||
    session.refreshTokenHash !== hashRefreshToken(rawRefreshToken) ||
    session.userId.toString() !== payload.sub
  ) {
    throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'Sesión inválida o expirada.');
  }

  const user = await User.findById(session.userId).exec();
  if (!user || !user.isActive) {
    throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'Sesión inválida o expirada.');
  }

  // Rotación: la sesión usada no vuelve a servir más.
  await Session.updateOne({ _id: session._id, revokedAt: null }, { revokedAt: now }).exec();

  const issued = await createSession(user, jwtConfig, req);
  const accessToken = signAccessToken(toAuthUser(user), jwtConfig);

  return {
    accessToken,
    refreshToken: issued.refreshToken,
    refreshMaxAgeMs: issued.maxAgeMs,
    user: toPublicUser(user),
  };
}

/** Revoca la sesión asociada al refresh token, si existe y no estaba revocada. */
export async function logoutSession(rawRefreshToken: string | undefined): Promise<void> {
  if (!rawRefreshToken) {
    return;
  }
  await Session.updateOne(
    { refreshTokenHash: hashRefreshToken(rawRefreshToken), revokedAt: null },
    { revokedAt: new Date() },
  ).exec();
}

/** Revoca todas las sesiones activas del usuario. */
export async function revokeAllSessions(userId: string): Promise<void> {
  await Session.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date() },
  ).exec();
}

/** Carga el usuario activo a partir del id del access token. */
export async function findActiveUser(userId: string): Promise<AuthUser | null> {
  const user = await User.findById(userId).exec();
  if (!user || !user.isActive) {
    return null;
  }
  return toAuthUser(user);
}

export type CookieOptions = {
  httpOnly: true;
  sameSite: 'strict';
  secure: boolean;
  path: string;
  maxAge?: number;
};

export function buildRefreshCookieOptions(nodeEnv: string, maxAgeMs?: number): CookieOptions {
  const secure = process.env.COOKIE_SECURE === 'true';
  const options: CookieOptions = {
    httpOnly: true,
    sameSite: 'strict',
    secure,
    path: REFRESH_COOKIE_PATH,
  };
  if (maxAgeMs !== undefined) {
    options.maxAge = maxAgeMs;
  }
  return options;
}
