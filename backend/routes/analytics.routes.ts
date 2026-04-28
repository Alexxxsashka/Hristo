import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authenticateAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/dashboard', authenticateAdmin, analyticsController.getDashboardStats);

export default router;
