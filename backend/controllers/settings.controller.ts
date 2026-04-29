import { Response } from 'express';
import { pool } from '../services/db.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { logAudit, AuditSeverity } from '../services/audit.service.js';

export const getSiteSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM site_settings LIMIT 1');
    if (result.rows.length > 0) {
      const row = result.rows[0];
      const camelData: any = {};
      Object.keys(row).forEach(key => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        camelData[camelKey] = row[key];
      });
      res.json({ success: true, data: camelData });
    } else {
      res.json({ success: true, data: { id: 'default' } });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const updateSiteSettings = async (req: AuthenticatedRequest, res: Response) => {
  const settings = req.body;
  const id = 'default';

  try {
    const columnQuery = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'site_settings'
    `);
    
    const colMap = new Map();
    const normalize = (s: string) => s.toLowerCase().replace(/_/g, '');
    
    columnQuery.rows.forEach(r => {
      colMap.set(normalize(r.column_name), r);
    });

    const updates: string[] = [];
    const values: any[] = [id];
    const cols: string[] = [];
    const placeholders: string[] = [];

    Object.keys(settings).forEach(key => {
      if (key === 'id' || key.startsWith('_')) return;
      
      const normalizedKey = normalize(key);
      if (normalizedKey === 'updatedat' || normalizedKey === 'createdat') return;

      const colInfo = colMap.get(normalizedKey);
      
      if (colInfo) {
        const colName = colInfo.column_name;
        let val = settings[key];
        
        if (colInfo.data_type === 'ARRAY' && Array.isArray(val)) {
          // Keep as array
        } else if (typeof val === 'object' && val !== null) {
          val = JSON.stringify(val);
        }
        
        updates.push(`"${colName}" = $${values.length + 1}`);
        cols.push(`"${colName}"`);
        placeholders.push(`$${values.length + 1}`);
        values.push(val);
      }
    });

    if (updates.length === 0) {
      return res.json({ success: true, message: "No valid fields to update" });
    }

    const updateResult = await pool.query(
      `UPDATE site_settings SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      values
    );

    if (updateResult.rowCount === 0) {
      await pool.query(
        `INSERT INTO site_settings (id, ${cols.join(', ')}) VALUES ($1, ${placeholders.join(', ')})`,
        values
      );
    }

    if (req.user) {
      await logAudit(
        'UPDATE_SETTINGS',
        'SITE',
        id,
        `Updated site settings`,
        AuditSeverity.INFO,
        {
          userId: req.user.id,
          userName: req.user.username || req.user.email,
          userEmail: req.user.email,
          ipAddress: req.ip
        }
      );
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Database error' });
  }
};


export const getCurrencyRates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM currency_rates');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const updateCurrencyRate = async (req: AuthenticatedRequest, res: Response) => {
  const { code, rate, symbol } = req.body;
  try {
    await pool.query(
      'INSERT INTO currency_rates (code, rate, symbol) VALUES ($1, $2, $3) ON CONFLICT (code) DO UPDATE SET rate = $2, symbol = $3, updated_at = CURRENT_TIMESTAMP',
      [code, rate, symbol]
    );

    if (req.user) {
      await logAudit(
        'UPDATE_CURRENCY',
        'SETTINGS',
        code,
        `Updated currency rate for ${code} to ${rate}`,
        AuditSeverity.INFO,
        {
          userId: req.user.id,
          userName: req.user.username || req.user.email,
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
