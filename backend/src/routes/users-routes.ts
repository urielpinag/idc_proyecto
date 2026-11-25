import { Router, type Router as ExpressRouter } from 'express';

import { getOne, list, remove, update } from '../controllers/users-controller.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.js';

export const usersRouter: ExpressRouter = Router();

// Administración de cuentas.
usersRouter.use(requireAuth, requireAdmin);
usersRouter.get('/', list);
usersRouter.get('/:id', getOne);
usersRouter.patch('/:id', update);
usersRouter.delete('/:id', remove);
