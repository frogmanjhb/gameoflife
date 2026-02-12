import { Request, Response, NextFunction } from 'express';
import { User } from '../types';
export interface AuthenticatedRequest extends Request {
    user?: User;
    schoolId?: number | null;
}
export interface JWTPayload {
    userId: number;
    schoolId: number | null;
    role: 'student' | 'teacher' | 'super_admin';
}
export declare const authenticateToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requireRole: (roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.d.ts.map