import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../services/db.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { logAudit, AuditSeverity } from '../services/audit.service.js';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const register = async (req: AuthenticatedRequest, res: Response) => {
  const { username, email, password } = req.body;
  
  try {
    const checkResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ success: false, error: "Email already registered" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = `user-${Date.now()}`;
    
    await pool.query(
      'INSERT INTO users (id, username, email, password, role) VALUES ($1, $2, $3, $4, $5)',
      [id, username, email, hashedPassword, 'user']
    );

    const token = jwt.sign({ id, email, role: 'user', username }, JWT_SECRET, { expiresIn: "24h" });
    
    const response: ApiResponse = {
      success: true,
      data: { token, user: { id, username, email, role: 'user' } }
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, username: user.username }, 
        JWT_SECRET, 
        { expiresIn: "24h" }
      );
      
      const response: ApiResponse = {
        success: true,
        data: { token, user: { id: user.id, username: user.username, email: user.email, role: user.role } }
      };
      res.json(response);
    } else {
      res.status(401).json({ success: false, error: "Invalid credentials" });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const getMe = (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: req.user });
};

export const adminLogin = async (req: AuthenticatedRequest, res: Response) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND role = $2', [username, 'admin']);
    const user = result.rows[0];

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, username: user.username }, 
        JWT_SECRET, 
        { expiresIn: "24h" }
      );
      res.json({ success: true, data: { token } });
    } else {
      res.status(401).json({ success: false, error: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, points, rank, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, callsign, team_name, points, rank, discount_level, addresses FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'User not found' });
    const u = result.rows[0];
    res.json({
      success: true,
      data: {
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        callsign: u.callsign,
        teamName: u.team_name,
        points: u.points || 0,
        rank: u.rank || 'Recruit',
        discountLevel: u.discount_level || 0,
        addresses: typeof u.addresses === 'string' ? JSON.parse(u.addresses) : (u.addresses || []),
      }
    });
  } catch (error) {
    console.error('getUserProfile error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { callsign, teamName, username, addresses } = req.body;
    await pool.query(
      `UPDATE users SET
        callsign = COALESCE($1, callsign),
        team_name = COALESCE($2, team_name),
        username = COALESCE($3, username),
        addresses = COALESCE($4, addresses)
       WHERE id = $5`,
      [callsign, teamName, username, addresses ? JSON.stringify(addresses) : null, req.params.id]
    );

    if (req.user) {
      await logAudit(
        'UPDATE_PROFILE',
        'USER',
        req.params.id,
        `Updated profile for user ${req.params.id}`,
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
    console.error('updateProfile error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

