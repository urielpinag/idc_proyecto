/**
 * Ampliación de tipos de Express: `req.user` lo rellena el middleware
 * `requireAuth`. Solo contiene datos seguros (nunca `passwordHash`).
 */

import type { AuthUser } from '../utils/jwt.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
