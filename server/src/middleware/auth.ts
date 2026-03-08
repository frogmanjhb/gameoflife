import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import database from '../database/database-prod';
import { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthenticatedRequest extends Request {
  user?: User;
  schoolId?: number | null;
}

export interface JWTPayload {
  userId: number;
  schoolId: number | null;
  role: 'student' | 'teacher' | 'super_admin';
}

const verboseAuth = process.env.DEBUG === '1' || process.env.VERBOSE_LOGGING === '1';

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (verboseAuth) console.log('🔐 Auth attempt - Header:', authHeader ? 'Present' : 'Missing', 'Token:', token ? 'Present' : 'Missing');

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    if (verboseAuth) console.log('🔍 Token decoded, userId:', decoded.userId, 'schoolId:', decoded.schoolId);

    const user = await database.get('SELECT * FROM users WHERE id = $1', [decoded.userId]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Verify school_id matches (unless super_admin)
    if (user.role !== 'super_admin' && user.school_id !== decoded.schoolId) {
      return res.status(403).json({ error: 'Invalid token - school context mismatch' });
    }

    if (verboseAuth) console.log('✅ User authenticated:', user.username, 'Role:', user.role, 'School:', user.school_id);
    req.user = user;
    req.schoolId = user.school_id || null;
    next();
  } catch (error) {
    if (verboseAuth) console.log('❌ Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
