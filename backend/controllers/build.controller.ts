import { Response } from 'express';
import { pool } from '../services/db.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';

export const getSavedBuilds = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const result = await pool.query('SELECT * FROM saved_builds WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const saveBuild = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id, name, configuration, preview_image } = req.body;
    const buildId = id || `build-${Date.now()}`;
    
    await pool.query(
      `INSERT INTO saved_builds (id, user_id, name, configuration, preview_image) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET name = $3, configuration = $4, preview_image = $5, updated_at = CURRENT_TIMESTAMP`,
      [buildId, req.user.id, name, JSON.stringify(configuration), preview_image]
    );
    
    res.status(201).json({ success: true, data: { id: buildId } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteBuild = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    await pool.query('DELETE FROM saved_builds WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
