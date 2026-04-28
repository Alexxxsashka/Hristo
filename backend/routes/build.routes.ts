import { Router } from 'express';
import * as buildController from '../controllers/build.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, buildController.getSavedBuilds);
router.post('/', authenticateToken, buildController.saveBuild);
router.delete('/:id', authenticateToken, buildController.deleteBuild);

export default router;
