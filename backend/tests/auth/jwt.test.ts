/**
 * Pruebas unitarias de las utilidades JWT y del cálculo del TTL de la cookie.
 */

import jwt from 'jsonwebtoken';

import { buildRefreshCookieOptions, parseTtlMs, REFRESH_COOKIE_PATH } from '../../src/services/auth-service.js';
import {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  type JwtConfig,
} from '../../src/utils/jwt.js';

const config: JwtConfig = {
  jwtSecret: 'secreto-access-de-prueba',
  jwtRefreshSecret: 'secreto-refresh-de-prueba',
  jwtAccessTtl: '15m',
  jwtRefreshTtl: '7d',
};

describe('utils/jwt', () => {
  it('firma y verifica un access token con sub, userId, email y role', () => {
    const token = signAccessToken({ id: 'abc123', email: 'a@b.test', role: 'admin' }, config);
    const payload = verifyAccessToken(token, config.jwtSecret);

    expect(payload).toMatchObject({ sub: 'abc123', userId: 'abc123', email: 'a@b.test', role: 'admin' });
    expect(verifyAccessToken(token, config.jwtRefreshSecret)).toBeNull();
  });

  it('firma y verifica un refresh token con el secreto de refresh', () => {
    const token = signRefreshToken('user-1', 'session-1', config);
    const payload = verifyRefreshToken(token, config.jwtRefreshSecret);

    expect(payload).toEqual({ sub: 'user-1', sid: 'session-1', iat: expect.any(Number) as number, exp: expect.any(Number) as number, iss: 'tvhub-api', aud: 'tvhub-refresh' });
    expect(verifyRefreshToken(token, config.jwtSecret)).toBeNull();
  });

  it('rechaza tokens con payload incompleto o manipulado', () => {
    const invalidPayload = jwt.sign({ sub: 'x' }, config.jwtSecret, { audience: 'tvhub-client', issuer: 'tvhub-api' });
    expect(verifyAccessToken(invalidPayload, config.jwtSecret)).toBeNull();

    const invalidRefresh = jwt.sign({ sub: 'x' }, config.jwtRefreshSecret, { audience: 'tvhub-refresh', issuer: 'tvhub-api' });
    expect(verifyRefreshToken(invalidRefresh, config.jwtRefreshSecret)).toBeNull();

    expect(verifyAccessToken('no-es-un-jwt', config.jwtSecret)).toBeNull();
  });

  it('calcula un hash SHA-256 estable del refresh token', () => {
    expect(hashRefreshToken('token')).toBe(hashRefreshToken('token'));
    expect(hashRefreshToken('token')).toMatch(/^[a-f0-9]{64}$/);
    expect(hashRefreshToken('token')).not.toBe(hashRefreshToken('otro'));
  });
});

describe('services/auth-service (helpers)', () => {
  it('convierte TTL a milisegundos y usa fallback con formatos inválidos', () => {
    expect(parseTtlMs('30s')).toBe(30_000);
    expect(parseTtlMs('15m')).toBe(900_000);
    expect(parseTtlMs('2h')).toBe(7_200_000);
    expect(parseTtlMs('1d')).toBe(86_400_000);
    expect(parseTtlMs('1w')).toBe(604_800_000);
    expect(parseTtlMs('3600')).toBe(3_600_000);
    expect(parseTtlMs('0d')).toBe(604_800_000);
    expect(parseTtlMs('otro')).toBe(604_800_000);
  });

  it('construye opciones de cookie coherentes con el entorno', () => {
    const dev = buildRefreshCookieOptions('development');
    expect(dev).toEqual({
      httpOnly: true,
      sameSite: 'strict',
      secure: false,
      path: REFRESH_COOKIE_PATH,
    });

    const prod = buildRefreshCookieOptions('production', 1000);
    expect(prod.secure).toBe(true);
    expect(prod.maxAge).toBe(1000);
  });
});
