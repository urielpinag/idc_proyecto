import { Router, type Router as ExpressRouter } from 'express';

import { create, list, remove } from '../controllers/favorites-controller.js';
import { requireAuth } from '../middlewares/auth.js';

export const favoritesRouter: ExpressRouter = Router();

// Favoritos del usuario autenticado.
favoritesRouter.use(requireAuth);
favoritesRouter.get('/', list);
favoritesRouter.post('/', create);
favoritesRouter.delete('/:channelId', remove);
