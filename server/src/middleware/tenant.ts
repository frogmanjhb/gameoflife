import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

/**
 * Tenant middleware - ensures school context is available
 * Super admins can access all schools (school_id = null)
 * Regular users must have school_id set
 */
export const requireTenant = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Extract school_id from JWT token (set during login/registration)
  // Super admins can access all schools (school_id = null)
  
  req.schoolId = req.user?.school_id || null;
  
  if (!req.schoolId && req.user?.role !== 'super_admin') {
    return res.status(403).json({ error: 'School context required' });
  }
  
  next();
};

/**
 * Middleware to require school_id in query params for super admin cross-school queries
 */
export const requireSchoolId = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role === 'super_admin') {
    // Super admin must explicitly provide school_id in query/params
    const schoolId = req.params.schoolId || req.query.school_id;
    if (!schoolId) {
      return res.status(400).json({ error: 'school_id parameter required for super admin queries' });
    }
    req.schoolId = parseInt(schoolId as string);
  }
  
  next();
};
