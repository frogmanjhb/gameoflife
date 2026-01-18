"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
/**
 * Health check endpoint for Railway and monitoring
 */
router.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: process.env.DATABASE_URL ? 'configured' : 'not configured'
    });
});
exports.default = router;
//# sourceMappingURL=health.js.map