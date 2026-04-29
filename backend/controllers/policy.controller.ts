import { Response } from 'express';
import { pool } from '../services/db.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';

export const getPolicies = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM policies');
    const mapped = result.rows.map(p => ({
      ...p,
      lastUpdated: p.last_updated,
      titleHr: p.title_hr,
      contentHr: p.content_hr
    }));
    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const getPolicyById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM policies WHERE id = $1', [req.params.id]);
    if (result.rows.length > 0) {
      const p = result.rows[0];
      res.json({ success: true, data: {
        ...p,
        lastUpdated: p.last_updated,
        titleHr: p.title_hr,
        contentHr: p.content_hr
      }});
    } else {
      res.status(404).json({ success: false, error: "Policy not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const createPolicy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, title, content, type, title_hr, content_hr } = req.body;
    const policyId = id || `policy-${Date.now()}`;
    await pool.query(
      'INSERT INTO policies (id, title, content, type, title_hr, content_hr) VALUES ($1, $2, $3, $4, $5, $6)',
      [policyId, title, content, type, title_hr, content_hr]
    );
    res.status(201).json({ success: true, data: { id: policyId } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const updatePolicy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, type, title_hr, content_hr } = req.body;
    await pool.query(
      'UPDATE policies SET title = $1, content = $2, type = $3, title_hr = $4, content_hr = $5, last_updated = CURRENT_TIMESTAMP WHERE id = $6',
      [title, content, type, title_hr, content_hr, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const deletePolicy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM policies WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};
