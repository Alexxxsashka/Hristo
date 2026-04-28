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
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, callsign, team_name, points, rank, discount_level, addresses FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    const u = result.rows[0];
    res.json({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      callsign: u.callsign,
      teamName: u.team_name,
      points: u.points || 0,
      rank: u.rank || 'Recruit',
      discountLevel: u.discount_level || 0,
      addresses: u.addresses || [],
    });
  } catch (e) {
    console.error('getUserProfile error:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { callsign, teamName, displayName, addresses } = req.body;
    await pool.query(
      `UPDATE users SET
        callsign = COALESCE($1, callsign),
        team_name = COALESCE($2, team_name),
        username = COALESCE($3, username),
        addresses = COALESCE($4, addresses)
       WHERE id = $5`,
      [callsign, teamName, displayName, addresses ? JSON.stringify(addresses) : null, req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('updateProfile error:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

// Admin Users list — GET /api/admin/users
router.get('/', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, points, rank, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (e) {
    console.error('getUsers error:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
