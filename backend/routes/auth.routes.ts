import { Router, Request, Response } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticateToken, authenticateAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../validation/auth.schema.js';
import { pool } from '../services/db.service.js';

const router = Router();

// Auth
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/admin/login', validate(loginSchema), authController.adminLogin);
router.get('/me', authenticateToken, authController.getMe);

// User Profile — GET /api/users/:id and PUT /api/users/:id
router.get('/:id', authenticateToken, authController.getUserProfile);
router.put('/:id', authenticateToken, authController.updateProfile);

// Admin Users list — GET /api/admin/users
router.get('/', authenticateAdmin, authController.getUsers);


export default router;
