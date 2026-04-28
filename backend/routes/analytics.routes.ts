import { Router, Request, Response } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authenticateAdmin } from '../middleware/auth.middleware.js';
import { pool } from '../services/db.service.js';

const router = Router();

// Dashboard stats
router.get('/dashboard', authenticateAdmin, analyticsController.getDashboardStats);

// GET / — handles /api/admin/audit and /api/admin/analytics when mounted
router.get('/', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, user_name, user_email, action, resource_type, resource_id, 
              details, severity, ip_address, created_at as timestamp
       FROM audit_logs
       ORDER BY created_at DESC
       LIMIT 200`
    );
    const logs = result.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name || 'System',
      userEmail: r.user_email || '',
      action: r.action,
      resourceType: r.resource_type,
      resourceId: r.resource_id,
      details: r.details || '',
      severity: r.severity || 'info',
      ipAddress: r.ip_address,
      timestamp: r.timestamp,
    }));
    res.json({ success: true, data: logs });
  } catch (e) {
    // audit_logs table might not exist yet — return empty array gracefully
    console.warn('audit_logs query failed (table may not exist):', (e as any).message);
    res.json({ success: true, data: [] });
  }
});

export default router;
