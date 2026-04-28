import { Response } from 'express';
import { pool } from '../services/db.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const period = req.query.period || '30d';
    
    // Revenue
    const revenueRes = await pool.query("SELECT SUM(total) as total FROM orders WHERE payment_status = 'paid'");
    const totalRevenue = parseFloat(revenueRes.rows[0].total || 0);

    // Orders Count
    const ordersRes = await pool.query("SELECT COUNT(*) FROM orders");
    const totalOrders = parseInt(ordersRes.rows[0].count);

    // Products Count
    const productsRes = await pool.query("SELECT COUNT(*) FROM products");
    const totalProducts = parseInt(productsRes.rows[0].count);

    // Users Count
    const usersRes = await pool.query("SELECT COUNT(*) FROM users");
    const totalUsers = parseInt(usersRes.rows[0].count);

    // Recent Orders
    const recentOrders = await pool.query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 5");

    res.json({
      success: true,
      data: {
        stats: {
          revenue: totalRevenue,
          orders: totalOrders,
          products: totalProducts,
          users: totalUsers
        },
        recentOrders: recentOrders.rows
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};
