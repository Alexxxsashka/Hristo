import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../services/db.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';

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
