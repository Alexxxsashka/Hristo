import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { pool } from '../services/db.service.js';
import { AuthenticatedRequest, UserPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.split(" ")[1]) || (req.query.token as string);

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  // Admin bypass for local development
  if (token === 'admin-bypass-key' && process.env.NODE_ENV !== 'production') {
    req.user = { id: 'admin', email: 'guardsowh@gmail.com', role: 'admin', username: 'admin' };
    return next();
  }

  try {
    let decoded: UserPayload | null = null;

    // 1. Try local JWT verification first
    try {
      decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    } catch (localErr: any) {
      // 2. If local fail, try Firebase ID Token verification via REST API
      // This avoids heavy firebase-admin initialization issues on Vercel
      if (FIREBASE_API_KEY) {
        try {
          const fbRes = await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
            { idToken: token }
          );
          
          if (fbRes.data?.users?.[0]) {
            const fbUser = fbRes.data.users[0];
            decoded = {
              id: fbUser.localId,
              email: fbUser.email,
              role: 'user', // Default, will be refined by DB check below
              username: fbUser.displayName || fbUser.email
            };
          }
        } catch (fbErr: any) {
          console.error('Firebase verification failed:', fbErr.response?.data || fbErr.message);
        }
      }
    }

    if (!decoded) {
      return res.status(403).json({ error: "Forbidden: Invalid or expired token" });
    }
    
    // 3. Fetch/Verify user in DB to ensure role and presence
    const userResult = await pool.query(
      'SELECT id, role, email, username FROM users WHERE id = $1',
      [decoded.id]
    );
    
    const dbUser = userResult.rows[0];
    const userEmail = decoded.email || dbUser?.email;
    
    // Force admin for the primary developer/admin email
    let finalRole = dbUser?.role || decoded.role || 'user';
    if (userEmail === 'guardsowh@gmail.com') {
      finalRole = 'admin';
    }
    
    // Auto-create user in DB if they exist in Firebase but not yet in our SQL DB
    if (!dbUser && decoded.email) {
       await pool.query(
         'INSERT INTO users (id, email, role, username) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
         [decoded.id, decoded.email, finalRole, decoded.username]
       );
    }

    req.user = {
      id: decoded.id,
      email: userEmail,
      role: finalRole,
      username: dbUser?.username || decoded.username
    };

    next();
  } catch (error: any) {
    console.error('Auth verification failed:', error.message);
    return res.status(403).json({ error: "Forbidden: Auth verification failed" });
  }
};

export const authenticateAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  await authenticateToken(req, res, () => {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      console.warn(`Admin access denied for user: ${req.user?.email}. Role: ${req.user?.role}`);
      res.status(403).json({ error: "Admin access required" });
    }
  });
};

