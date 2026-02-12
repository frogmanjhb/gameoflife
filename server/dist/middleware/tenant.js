"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSchoolId = exports.requireTenant = void 0;
/**
 * Tenant middleware - ensures school context is available
 * Super admins can access all schools (school_id = null)
 * Regular users must have school_id set
 */
const requireTenant = (req, res, next) => {
    // Extract school_id from JWT token (set during login/registration)
    // Super admins can access all schools (school_id = null)
    req.schoolId = req.user?.school_id || null;
    if (!req.schoolId && req.user?.role !== 'super_admin') {
        return res.status(403).json({ error: 'School context required' });
    }
    next();
};
exports.requireTenant = requireTenant;
/**
 * Middleware to require school_id in query params for super admin cross-school queries
 */
const requireSchoolId = (req, res, next) => {
    if (req.user?.role === 'super_admin') {
        // Super admin must explicitly provide school_id in query/params
        const schoolId = req.params.schoolId || req.query.school_id;
        if (!schoolId) {
            return res.status(400).json({ error: 'school_id parameter required for super admin queries' });
        }
        req.schoolId = parseInt(schoolId);
    }
    next();
};
exports.requireSchoolId = requireSchoolId;
//# sourceMappingURL=tenant.js.map