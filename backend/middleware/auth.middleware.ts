import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { admin } from '../services/firebase.service.js';
import { pool } from '../services/db.service.js';
import { AuthenticatedRequest, UserPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Try local JWT first
    try {
      const user = jwt.verify(token, JWT_SECRET) as UserPayload;
      req.user = user;
      return next();
    } catch (jwtErr) {
      // Fallback to Firebase
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Fetch user from DB to get role
      const userResult = await pool.query('SELECT role, username FROM users WHERE id = $1', [decodedToken.uid]);
      const dbUser = userResult.rows[0];
      
      req.user = {
        id: decodedToken.uid,
        email: decodedToken.email || '',
        role: dbUser?.role || (decodedToken.email === 'guardsowh@gmail.com' ? 'admin' : 'user')
      };
      next();
    }
  } catch (error) {
    console.error('Auth verification failed:', error);
    return res.status(403).json({ error: "Forbidden" });
  }
};

export const authenticateAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  await authenticateToken(req, res, () => {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      res.status(403).json({ error: "Admin access required" });
    }
  });
};
