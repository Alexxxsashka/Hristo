import { Response } from 'express';
import { pool } from '../services/db.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { logAudit, AuditSeverity } from '../services/audit.service.js';

export const getCoupons = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const createCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, code, type, value, product_id, category_id, min_order_amount, expires_at, active } = req.body;
    await pool.query(
      'INSERT INTO coupons (id, code, type, value, product_id, category_id, min_order_amount, expires_at, active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [id, code, type, value, product_id, category_id, min_order_amount, expires_at, active]
    );

    if (req.user) {
      await logAudit(
        'CREATE', 
        'COUPON', 
        id, 
        `Created coupon: ${code}`,
        AuditSeverity.INFO,
        { 
          userId: req.user.id, 
          userName: req.user.displayName || req.user.email,
          userEmail: req.user.email,
          ipAddress: req.ip
        }
      );
    }

    res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const updateCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, type, value, product_id, category_id, min_order_amount, expires_at, active } = req.body;
    await pool.query(
      'UPDATE coupons SET code = $1, type = $2, value = $3, product_id = $4, category_id = $5, min_order_amount = $6, expires_at = $7, active = $8 WHERE id = $9',
      [code, type, value, product_id, category_id, min_order_amount, expires_at, active, req.params.id]
    );

    if (req.user) {
      await logAudit(
        'UPDATE',
        'COUPON',
        req.params.id,
        `Updated coupon: ${code}`,
        AuditSeverity.INFO,
        {
          userId: req.user.id,
          userName: req.user.displayName || req.user.email,
          userEmail: req.user.email,
          ipAddress: req.ip
        }
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const deleteCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM coupons WHERE id = $1', [req.params.id]);
    
    if (req.user) {
      await logAudit(
        'DELETE',
        'COUPON',
        req.params.id,
        `Deleted coupon`,
        AuditSeverity.WARNING,
        {
          userId: req.user.id,
          userName: req.user.displayName || req.user.email,
          userEmail: req.user.email,
          ipAddress: req.ip
        }
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const validateCoupon = async (req: AuthenticatedRequest, res: Response) => {
  const { code, cartTotal, items } = req.body;
  try {
    const result = await pool.query('SELECT * FROM coupons WHERE code = $1 AND active = true', [code]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Invalid coupon code" });
    }

    const coupon = result.rows[0];
    
    // Check expiration
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ success: false, error: "Coupon has expired" });
    }

    // Check min amount
    if (cartTotal < parseFloat(coupon.min_order_amount)) {
      return res.status(400).json({ success: false, error: `Minimum order amount for this coupon is €${coupon.min_order_amount}` });
    }

    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};
