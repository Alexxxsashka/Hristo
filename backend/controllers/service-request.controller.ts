import { Response } from 'express';
import { pool } from '../services/db.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export const createServiceRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { userId, weaponName, description, status, date, updates } = req.body;

    if (!weaponName || !description) {
      return res.status(400).json({ success: false, error: 'Weapon name and description are required' });
    }

    const id = `sr-${Date.now()}`;

    await pool.query(
      `INSERT INTO service_requests (id, user_id, weapon_name, description, status, date, updates)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, req.user.id, weaponName, description, status || 'Pending', date || new Date().toLocaleDateString(), JSON.stringify(updates || [])]
    );

    // Also create a contact message so it appears in admin Messages section
    const msgId = `msg-sr-${Date.now()}`;
    await pool.query(
      `INSERT INTO contact_messages (id, name, email, subject, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        msgId,
        req.user.username || req.user.email || 'User',
        req.user.email || '',
        `Service Request: ${weaponName}`,
        description
      ]
    );

    res.status(201).json({ success: true, data: { id } });
  } catch (error: any) {
    console.error('Error creating service request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getServiceRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    // Admin can see all, regular users see only their own
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query('SELECT * FROM service_requests ORDER BY created_at DESC');
    } else {
      result = await pool.query('SELECT * FROM service_requests WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    }

    // Map snake_case DB columns to camelCase for frontend
    const data = result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      weaponName: row.weapon_name,
      description: row.description,
      status: row.status,
      date: row.date,
      updates: typeof row.updates === 'string' ? JSON.parse(row.updates) : (row.updates || []),
      createdAt: row.created_at
    }));

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateServiceRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { id } = req.params;
    const { status, updates } = req.body;

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (updates !== undefined) {
      fields.push(`updates = $${paramIndex++}`);
      values.push(JSON.stringify(updates));
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await pool.query(
      `UPDATE service_requests SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating service request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
