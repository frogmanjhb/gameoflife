import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Health check endpoint for Railway and monitoring
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'configured' : 'not configured'
  });
});

export default router;

