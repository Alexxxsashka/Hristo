import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../services/db.service.js';
import { AuthenticatedRequest, UserPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "hristo-ec3b1";

/**
 * Verify a Firebase ID token using Google's public REST endpoint.
 * This does NOT require Firebase Admin SDK or service account credentials.
 */
async function verifyFirebaseToken(token: string): Promise<{ uid: string; email?: string } | null> {
  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY || 'AIzaSyCdZBH8bIH__r0Hcd_j86YcK9mxAhuaU3A'}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });
    if (!response.ok) return null;
    const data = await response.json() as any;
    const user = data?.users?.[0];
    if (!user) return null;
    return { uid: user.localId, email: user.email };
  } catch {
    return null;
  }
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.split(" ")[1]) || (req.query.token as string);

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    // 1. Try local JWT first (fastest path)
    try {
      const user = jwt.verify(token, JWT_SECRET) as UserPayload;
      req.user = user;
      return next();
    } catch {
      // Not a local JWT — try Firebase token
    }

    // 2. Verify Firebase ID token via REST (no Admin SDK needed)
    const firebaseUser = await verifyFirebaseToken(token);
    if (!firebaseUser) {
      return res.status(403).json({ error: "Invalid token" });
    }

    // 3. Fetch role from DB
    const userResult = await pool.query(
      'SELECT role, username FROM users WHERE id = $1',
      [firebaseUser.uid]
    );
    const dbUser = userResult.rows[0];

    const dbRole = dbUser?.role;
    const isHardcodedAdmin = firebaseUser.email === 'guardsowh@gmail.com';
    const role = dbRole === 'admin' || isHardcodedAdmin ? 'admin' : 'user';

    req.user = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      role: role,
      username: dbUser?.username || firebaseUser.email?.split('@')[0]
    };

    
    if (role !== 'admin' && req.originalUrl.includes('/admin/')) {
       console.warn(`Admin access denied for user ${firebaseUser.email} (UID: ${firebaseUser.uid}). Role: ${role}`);
    }
    next();
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
