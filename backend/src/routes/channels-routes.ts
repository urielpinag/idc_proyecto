import { Router, type Router as ExpressRouter } from 'express';

import { create, getOne, list, remove, update } from '../controllers/channels-controller.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.js';

export const channelsRouter: ExpressRouter = Router();

// Catálogo público: solo canales activos.
channelsRouter.get('/', list);
channelsRouter.get('/:id', getOne);

// Administración del catálogo.
channelsRouter.post('/', requireAuth, requireAdmin, create);
channelsRouter.put('/:id', requireAuth, requireAdmin, update);
channelsRouter.delete('/:id', requireAuth, requireAdmin, remove);
