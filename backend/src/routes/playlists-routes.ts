import { Router, type Router as ExpressRouter } from 'express';

import { getOne, list, sync } from '../controllers/playlists-controller.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.js';

export const playlistsRouter: ExpressRouter = Router();

// Listado público de playlists importadas.
playlistsRouter.get('/', list);
playlistsRouter.get('/:id', getOne);

// Importación y re-sincronización M3U (idempotente por `sourceUrl`).
playlistsRouter.post('/sync', requireAuth, requireAdmin, sync);
playlistsRouter.post('/import', requireAuth, requireAdmin, sync);
