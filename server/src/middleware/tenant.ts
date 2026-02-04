import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

/**
 * Tenant middleware - extracts school_id from JWT token
 * Super admins can access all schools (school_id = null)
 * Regular users must have school_id set
 */
export const requireTenant = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Extract school_id from JWT token (set during login/registration)
  // Super admins can access all schools (school_id = null)
  
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.schoolId = req.user.school_id || null;
  
  // Super admins don't need school_id
  if (!req.schoolId && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'School context required' });
  }
  
  next();
};

/**
 * Middleware to require a specific school context (for super admin cross-school queries)
 * Super admins can explicitly set school_id via query param or body
 */
export const requireSchoolContext = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Super admins can specify school_id explicitly
  if (req.user.role === 'super_admin') {
    const schoolId = req.query.school_id || req.body.school_id;
    if (schoolId) {
      req.schoolId = parseInt(schoolId as string, 10);
    }
  } else {
    // Regular users use their own school_id
    req.schoolId = req.user.school_id || null;
  }

  if (!req.schoolId) {
    return res.status(403).json({ error: 'School context required' });
  }

  next();
};
