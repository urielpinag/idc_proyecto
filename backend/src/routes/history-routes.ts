import { Router, type Router as ExpressRouter } from 'express';

import { list, record, top } from '../controllers/history-controller.js';
import { requireAuth } from '../middlewares/auth.js';

export const historyRouter: ExpressRouter = Router();

// Historial del usuario autenticado. `/top` va antes que las rutas con parámetros.
historyRouter.use(requireAuth);
historyRouter.get('/', list);
historyRouter.post('/record', record);
historyRouter.get('/top', top);
