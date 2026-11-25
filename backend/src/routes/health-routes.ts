import { Router } from 'express';

import { health, ready } from '../controllers/health-controller.js';

export const healthRouter: Router = Router();

healthRouter.get('/health', health);
healthRouter.get('/ready', ready);
