import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
/**
 * Tenant middleware - ensures school context is available
 * Super admins can access all schools (school_id = null)
 * Regular users must have school_id set
 */
export declare const requireTenant: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware to require school_id in query params for super admin cross-school queries
 */
export declare const requireSchoolId: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=tenant.d.ts.map