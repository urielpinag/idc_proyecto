import { Router } from 'express';

import { login, logout, logoutAll, refresh, register } from '../controllers/auth-controller.js';
import { requireAuth } from '../middlewares/auth.js';

export const authRouter: Router = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', requireAuth, logout);
authRouter.post('/logout-all', requireAuth, logoutAll);
