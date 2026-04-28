import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/admin/login', authController.adminLogin);
router.get('/me', authenticateToken, authController.getMe);

export default router;
