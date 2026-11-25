/**
 * Controladores de `/api/auth`.
 *
 * Las respuestas nunca incluyen `passwordHash` ni los tokens de refresco (este
 * último viaja solo en cookie HttpOnly).
 */

import type { Request, Response } from 'express';

import { loadConfig } from '../config/env.js';
import {
  buildRefreshCookieOptions,
  loginUser,
  logoutSession,
  refreshSession,
  registerUser,
  revokeAllSessions,
  REFRESH_COOKIE_NAME,
  type AuthSession,
} from '../services/auth-service.js';

function sendSession(res: Response, session: AuthSession, method: 'json' | 'status'): void {
  const config = loadConfig();
  res.cookie(
    REFRESH_COOKIE_NAME,
    session.refreshToken,
    buildRefreshCookieOptions(config.nodeEnv, session.refreshMaxAgeMs),
  );
  const body = {
    accessToken: session.accessToken,
    user: session.user,
  };
  if (method === 'status') {
    res.status(200).json(body);
    return;
  }
  res.json(body);
}

export async function register(req: Request, res: Response): Promise<void> {
  const user = await registerUser(loadConfig().auth, {
    email: req.body?.email as unknown,
    password: req.body?.password as unknown,
    displayName: req.body?.displayName as unknown,
  });
  res.status(201).json({ user });
}

export async function login(req: Request, res: Response): Promise<void> {
  const session = await loginUser(
    loadConfig().auth,
    req,
    req.body?.email as unknown,
    req.body?.password as unknown,
  );
  sendSession(res, session, 'status');
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const rawToken = cookies?.[REFRESH_COOKIE_NAME];
  const session = await refreshSession(
    loadConfig().auth,
    req,
    typeof rawToken === 'string' ? rawToken : undefined,
  );
  sendSession(res, session, 'json');
}

export async function logout(req: Request, res: Response): Promise<void> {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const rawToken = cookies?.[REFRESH_COOKIE_NAME];
  await logoutSession(typeof rawToken === 'string' ? rawToken : undefined);
  res.clearCookie(REFRESH_COOKIE_NAME, buildRefreshCookieOptions(loadConfig().nodeEnv));
  res.status(200).json({ status: 'ok' });
}

export async function logoutAll(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (userId) {
    await revokeAllSessions(userId);
  }
  res.clearCookie(REFRESH_COOKIE_NAME, buildRefreshCookieOptions(loadConfig().nodeEnv));
  res.status(200).json({ status: 'ok' });
}
