import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { requireRole } from '../middleware/auth';

const router = Router();

const ENTREPRENEUR_JOB_NAME = 'entrepreneur – town business founder';

function hasEntrepreneurJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim() === ENTREPRENEUR_JOB_NAME;
}

// Submit a business proposal (students with Entrepreneur job only)
router.post('/', authenticateToken, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'User not found' });
    const userId = req.user.id;
    const schoolId = req.user.school_id ?? null;

    const user = await database.get(
      `SELECT u.id, j.name as job_name FROM users u LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`,
      [userId]
    );
    if (!user || !hasEntrepreneurJob(user.job_name)) {
      return res.status(403).json({ error: 'Only Entrepreneurs (Town Business Founder) can submit business proposals' });
    }

    const { business_name, payload } = req.body;
    if (!business_name || typeof business_name !== 'string' || !business_name.trim()) {
      return res.status(400).json({ error: 'Business name is required' });
    }
    const payloadObj = payload && typeof payload === 'object' ? payload : {};

    // One active proposal per user: pending or approved. If they already have pending, reject; if approved, they can submit another (new business).
    const existing = await database.get(
      `SELECT id, status FROM business_proposals WHERE user_id = $1 AND status = 'pending' LIMIT 1`,
      [userId]
    );
    if (existing) {
      return res.status(400).json({ error: 'You already have a pending business proposal. Wait for teacher approval or withdrawal.' });
    }

    const result = await database.run(
      `INSERT INTO business_proposals (user_id, school_id, status, business_name, payload)
       VALUES ($1, $2, 'pending', $3, $4)
       RETURNING id, user_id, status, business_name, payload, created_at`,
      [userId, schoolId, business_name.trim(), JSON.stringify(payloadObj)]
    );
    const row = await database.get('SELECT * FROM business_proposals WHERE id = $1', [result.lastID]);
    res.status(201).json(row);
  } catch (error) {
    console.error('Submit business proposal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get my proposal(s) (student)
router.get('/my', authenticateToken, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'User not found' });
    const userId = req.user.id;

    const rows = await database.query(
      `SELECT id, user_id, status, business_name, payload, created_at, reviewed_at, denial_reason
       FROM business_proposals WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (error: any) {
    console.error('Get my business proposals error:', error);
    const msg = error?.message || '';
    if (msg.includes('business_proposals') && (msg.includes('does not exist') || msg.includes('relation'))) {
      return res.status(503).json({ error: 'Business proposals table not set up. Restart the server to run migrations.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all proposals (teachers only, school-scoped)
router.get('/', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.schoolId ?? req.user?.school_id ?? null;
    if (schoolId == null) return res.status(403).json({ error: 'School context required' });

    const rows = await database.query(
      `SELECT bp.id, bp.user_id, bp.status, bp.business_name, bp.payload, bp.created_at, bp.reviewed_at, bp.denial_reason,
              u.username as applicant_username, u.first_name as applicant_first_name, u.last_name as applicant_last_name, u.class as applicant_class
       FROM business_proposals bp
       JOIN users u ON bp.user_id = u.id
       WHERE bp.school_id = $1
       ORDER BY bp.status ASC, bp.created_at DESC`,
      [schoolId]
    );
    res.json(rows);
  } catch (error: any) {
    console.error('List business proposals error:', error);
    const msg = error?.message || '';
    if (msg.includes('business_proposals') && (msg.includes('does not exist') || msg.includes('relation'))) {
      return res.status(503).json({ error: 'Business proposals table not set up. Restart the server to run migrations.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve or deny proposal (teachers only)
router.put('/:id', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid proposal ID' });
    const { status, denial_reason } = req.body;
    if (!status || !['approved', 'denied'].includes(status)) {
      return res.status(400).json({ error: 'status must be approved or denied' });
    }
    const schoolId = req.schoolId ?? req.user?.school_id ?? null;
    if (schoolId == null) return res.status(403).json({ error: 'School context required' });

    const proposal = await database.get(
      'SELECT id, user_id, status FROM business_proposals WHERE id = $1 AND school_id = $2',
      [id, schoolId]
    );
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    if (proposal.status !== 'pending') {
      return res.status(400).json({ error: 'Proposal has already been reviewed' });
    }

    await database.run(
      `UPDATE business_proposals SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2, denial_reason = $3 WHERE id = $4`,
      [status, req.user?.id ?? null, status === 'denied' ? (denial_reason || null) : null, id]
    );
    const updated = await database.get('SELECT * FROM business_proposals WHERE id = $1', [id]);
    res.json(updated);
  } catch (error) {
    console.error('Update business proposal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
