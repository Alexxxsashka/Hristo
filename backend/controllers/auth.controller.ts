import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../services/db.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { logAudit, AuditSeverity } from '../services/audit.service.js';
import { admin } from '../services/firebase.service.js';

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
      'SELECT id, username, email, role, points, rank, phone, created_at FROM users ORDER BY created_at DESC'
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

export const updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['admin', 'manager', 'user'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid role. Allowed roles: admin, manager, user.' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, role',
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const updatedUser = result.rows[0];

    // Log this action to the audit logs
    if (req.user) {
      await logAudit(
        'CHANGE_ROLE',
        'USER',
        id,
        `Role of user ${updatedUser.email || id} changed to ${role} by admin`,
        AuditSeverity.WARNING,
        {
          userId: req.user.id,
          userEmail: req.user.email,
          userName: req.user.username,
          ipAddress: req.ip
        }
      );
    }

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('updateUserRole error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const resetUserPassword = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const userRes = await pool.query('SELECT id, email, username, password FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const user = userRes.rows[0];
    const email = user.email;

    let firebaseResetLink = null;
    let localTempPassword = null;
    let firebaseSuccess = false;

    if (admin) {
      try {
        let fbUser;
        try {
          fbUser = await admin.auth().getUser(id);
        } catch {
          if (email) {
            fbUser = await admin.auth().getUserByEmail(email);
          }
        }

        if (fbUser) {
          firebaseResetLink = await admin.auth().generatePasswordResetLink(fbUser.email || email);
          firebaseSuccess = true;
        }
      } catch (fbErr: any) {
        console.warn('Firebase password reset link generation failed:', fbErr.message);
      }
    }

    const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    localTempPassword = Array.from({ length: 12 }, () => randomChars.charAt(Math.floor(Math.random() * randomChars.length))).join('');
    const hashed = bcrypt.hashSync(localTempPassword, 10);
    
    await pool.query(
      'UPDATE users SET password = $1, password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashed, id]
    );

    if (req.user) {
      await logAudit(
        'RESET_PASSWORD',
        'USER',
        id,
        `Password reset triggered for user ${email || id} by admin`,
        AuditSeverity.WARNING,
        {
          userId: req.user.id,
          userEmail: req.user.email,
          userName: req.user.username,
          ipAddress: req.ip
        }
      );
    }

    res.json({
      success: true,
      data: {
        method: firebaseSuccess ? 'firebase' : 'local',
        resetLink: firebaseResetLink,
        tempPassword: localTempPassword,
        message: firebaseSuccess 
          ? `Firebase password reset link generated successfully.` 
          : `Password reset successfully. A temporary local password has been generated: ${localTempPassword}`
      }
    });
  } catch (error) {
    console.error('resetUserPassword error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const resetUserEmail = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { newEmail } = req.body;

  if (!newEmail || !newEmail.includes('@')) {
    return res.status(400).json({ success: false, error: 'Valid new email is required' });
  }

  try {
    const checkEmail = await pool.query('SELECT id FROM users WHERE email = $1 AND id <> $2', [newEmail, id]);
    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Email is already registered to another account' });
    }

    const result = await pool.query(
      'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, email',
      [newEmail, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const updatedUser = result.rows[0];
    let firebaseSuccess = false;

    if (admin) {
      try {
        let fbUser;
        try {
          fbUser = await admin.auth().getUser(id);
        } catch {
          if (updatedUser.email) {
            fbUser = await admin.auth().getUserByEmail(updatedUser.email);
          }
        }

        if (fbUser) {
          await admin.auth().updateUser(fbUser.uid, {
            email: newEmail,
            emailVerified: false
          });
          firebaseSuccess = true;
        }
      } catch (fbErr: any) {
        console.warn('Firebase email update failed:', fbErr.message);
      }
    }

    if (req.user) {
      await logAudit(
        'CHANGE_EMAIL',
        'USER',
        id,
        `Email for user ${id} changed to ${newEmail} by admin`,
        AuditSeverity.WARNING,
        {
          userId: req.user.id,
          userEmail: req.user.email,
          userName: req.user.username,
          ipAddress: req.ip
        }
      );
    }

    res.json({
      success: true,
      data: {
        user: updatedUser,
        firebaseUpdated: firebaseSuccess,
        message: `Email successfully changed to ${newEmail}.`
      }
    });
  } catch (error) {
    console.error('resetUserEmail error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (id === req.user?.id) {
    return res.status(400).json({ success: false, error: 'You cannot delete your own admin account.' });
  }

  try {
    const userRes = await pool.query('SELECT email FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const userEmail = userRes.rows[0].email;

    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    let firebaseDeleted = false;
    if (admin) {
      try {
        let fbUser;
        try {
          fbUser = await admin.auth().getUser(id);
        } catch {
          if (userEmail) {
            fbUser = await admin.auth().getUserByEmail(userEmail);
          }
        }

        if (fbUser) {
          await admin.auth().deleteUser(fbUser.uid);
          firebaseDeleted = true;
        }
      } catch (fbErr: any) {
        console.warn('Firebase user delete failed:', fbErr.message);
      }
    }

    if (req.user) {
      await logAudit(
        'DELETE_USER',
        'USER',
        id,
        `User ${userEmail || id} deleted by admin`,
        AuditSeverity.CRITICAL,
        {
          userId: req.user.id,
          userEmail: req.user.email,
          userName: req.user.username,
          ipAddress: req.ip
        }
      );
    }

    res.json({
      success: true,
      message: `User account ${userEmail || id} successfully deleted.`
    });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

