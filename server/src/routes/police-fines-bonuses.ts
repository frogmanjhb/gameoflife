import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

// POST /api/police-fines-bonuses — student (police) submits a fine or bonus request
router.post(
  '/',
  authenticateToken,
  requireTenant,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorised' });

      // Only students with a police lieutenant job may submit
      const studentRow = await database.get(
        `SELECT u.id, u.class, u.school_id, j.name as job_name
         FROM users u
         LEFT JOIN jobs j ON u.job_id = j.id
         WHERE u.id = $1 AND u.role = 'student'`,
        [user.id]
      );
      if (!studentRow || !(studentRow.job_name || '').toLowerCase().includes('police lieutenant')) {
        return res.status(403).json({ error: 'Only the Police Lieutenant may submit fines/bonuses' });
      }

      const { type, target_username, description, amount, teacher_initials } = req.body;

      if (!type || !['fine', 'bonus'].includes(type)) {
        return res.status(400).json({ error: 'type must be fine or bonus' });
      }
      if (!target_username) return res.status(400).json({ error: 'target_username is required' });
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'amount must be a positive number' });
      }
      if (!teacher_initials || !teacher_initials.trim()) {
        return res.status(400).json({ error: 'teacher_initials is required' });
      }

      // Resolve target student
      const schoolId = req.schoolId ?? user.school_id ?? null;
      const target = schoolId != null
        ? await database.get(
            `SELECT id, first_name, last_name, username, class FROM users WHERE username = $1 AND role = 'student' AND school_id = $2`,
            [target_username, schoolId]
          )
        : await database.get(
            `SELECT id, first_name, last_name, username, class FROM users WHERE username = $1 AND role = 'student'`,
            [target_username]
          );

      if (!target) return res.status(404).json({ error: 'Student not found' });

      await database.query(
        `INSERT INTO police_fine_bonus_requests
           (submitted_by_id, target_user_id, type, amount, description, teacher_initials, status, school_id, class)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)`,
        [
          user.id,
          target.id,
          type,
          parseFloat(amount),
          description || null,
          teacher_initials.trim().toUpperCase(),
          schoolId,
          studentRow.class || null,
        ]
      );

      return res.status(201).json({ message: `${type === 'fine' ? 'Fine' : 'Bonus'} request submitted for teacher approval` });
    } catch (err) {
      console.error('police-fines-bonuses POST error:', err);
      return res.status(500).json({ error: 'Failed to submit request' });
    }
  }
);

// GET /api/police-fines-bonuses/my-history — police student sees their own submissions
router.get(
  '/my-history',
  authenticateToken,
  requireTenant,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorised' });

      const rows = await database.query(
        `SELECT r.*,
                t.username   AS target_username,
                t.first_name AS target_first_name,
                t.last_name  AS target_last_name,
                t.class      AS target_class,
                rev.username AS reviewed_by_username
         FROM police_fine_bonus_requests r
         JOIN users t ON r.target_user_id = t.id
         LEFT JOIN users rev ON r.reviewed_by_id = rev.id
         WHERE r.submitted_by_id = $1
         ORDER BY r.created_at DESC
         LIMIT 50`,
        [user.id]
      );

      return res.json(rows);
    } catch (err) {
      console.error('police-fines-bonuses my-history error:', err);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }
  }
);

// GET /api/police-fines-bonuses — teacher fetches all pending requests for their school
router.get(
  '/',
  authenticateToken,
  requireTenant,
  requireRole(['teacher']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorised' });

      const schoolId = req.schoolId ?? user.school_id ?? null;
      const status = (req.query.status as string) || 'pending';

      const rows = schoolId != null
        ? await database.query(
            `SELECT r.*,
                    s.username  AS submitted_by_username,
                    s.first_name AS submitted_by_first_name,
                    s.last_name  AS submitted_by_last_name,
                    s.class      AS submitted_by_class,
                    t.username   AS target_username,
                    t.first_name AS target_first_name,
                    t.last_name  AS target_last_name,
                    t.class      AS target_class,
                    rev.username AS reviewed_by_username
             FROM police_fine_bonus_requests r
             JOIN users s ON r.submitted_by_id = s.id
             JOIN users t ON r.target_user_id  = t.id
             LEFT JOIN users rev ON r.reviewed_by_id = rev.id
             WHERE r.school_id = $1 AND r.status = $2
             ORDER BY r.created_at DESC`,
            [schoolId, status]
          )
        : await database.query(
            `SELECT r.*,
                    s.username  AS submitted_by_username,
                    s.first_name AS submitted_by_first_name,
                    s.last_name  AS submitted_by_last_name,
                    s.class      AS submitted_by_class,
                    t.username   AS target_username,
                    t.first_name AS target_first_name,
                    t.last_name  AS target_last_name,
                    t.class      AS target_class,
                    rev.username AS reviewed_by_username
             FROM police_fine_bonus_requests r
             JOIN users s ON r.submitted_by_id = s.id
             JOIN users t ON r.target_user_id  = t.id
             LEFT JOIN users rev ON r.reviewed_by_id = rev.id
             WHERE r.school_id IS NULL AND r.status = $1
             ORDER BY r.created_at DESC`,
            [status]
          );

      return res.json(rows);
    } catch (err) {
      console.error('police-fines-bonuses GET error:', err);
      return res.status(500).json({ error: 'Failed to fetch requests' });
    }
  }
);

// POST /api/police-fines-bonuses/:id/approve — teacher approves, money moves
router.post(
  '/:id/approve',
  authenticateToken,
  requireTenant,
  requireRole(['teacher']),
  async (req: AuthenticatedRequest, res: Response) => {
    const client = await database.pool.connect();
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorised' });

      const requestId = parseInt(req.params.id);
      if (isNaN(requestId)) return res.status(400).json({ error: 'Invalid id' });

      await client.query('BEGIN');

      const requestRow = await client.query(
        'SELECT * FROM police_fine_bonus_requests WHERE id = $1 FOR UPDATE',
        [requestId]
      );
      if (requestRow.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Request not found' });
      }
      const pfr = requestRow.rows[0];
      if (pfr.status !== 'pending') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Request is already ${pfr.status}` });
      }

      const targetAccount = await client.query(
        'SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE',
        [pfr.target_user_id]
      );
      if (targetAccount.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Target student account not found' });
      }
      const account = targetAccount.rows[0];
      const amount = parseFloat(pfr.amount);

      // Build a rich description that includes teacher name and original reason
      const teacherName = (user.first_name && user.last_name)
        ? `${user.first_name} ${user.last_name}`
        : user.username;
      const reason = pfr.description ? pfr.description.trim() : null;
      const fineDesc = reason
        ? `Police fine | ${reason} | Approved by ${teacherName} (${pfr.teacher_initials})`
        : `Police fine | Approved by ${teacherName} (${pfr.teacher_initials})`;
      const bonusDesc = reason
        ? `Police bonus | ${reason} | Approved by ${teacherName} (${pfr.teacher_initials})`
        : `Police bonus | Approved by ${teacherName} (${pfr.teacher_initials})`;

      if (pfr.type === 'fine') {
        // Deduct from student
        await client.query(
          'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [amount, account.id]
        );
        await client.query(
          `INSERT INTO transactions (from_account_id, amount, transaction_type, description)
           VALUES ($1, $2, 'fine', $3)`,
          [account.id, amount, fineDesc]
        );
      } else {
        // Deposit bonus into student
        await client.query(
          'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [amount, account.id]
        );
        await client.query(
          `INSERT INTO transactions (to_account_id, amount, transaction_type, description)
           VALUES ($1, $2, 'deposit', $3)`,
          [account.id, amount, bonusDesc]
        );
      }

      await client.query(
        `UPDATE police_fine_bonus_requests
         SET status = 'approved', reviewed_by_id = $1, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [user.id, requestId]
      );

      await client.query('COMMIT');
      return res.json({ message: `${pfr.type === 'fine' ? 'Fine' : 'Bonus'} approved and applied` });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('police-fines-bonuses approve error:', err);
      return res.status(500).json({ error: 'Failed to approve request' });
    } finally {
      client.release();
    }
  }
);

// POST /api/police-fines-bonuses/:id/deny — teacher denies, no money moves
router.post(
  '/:id/deny',
  authenticateToken,
  requireTenant,
  requireRole(['teacher']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorised' });

      const requestId = parseInt(req.params.id);
      if (isNaN(requestId)) return res.status(400).json({ error: 'Invalid id' });

      const result = await database.query(
        `UPDATE police_fine_bonus_requests
         SET status = 'denied', reviewed_by_id = $1, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND status = 'pending'
         RETURNING id`,
        [user.id, requestId]
      );

      if (result.length === 0) {
        return res.status(404).json({ error: 'Pending request not found' });
      }
      return res.json({ message: 'Request denied' });
    } catch (err) {
      console.error('police-fines-bonuses deny error:', err);
      return res.status(500).json({ error: 'Failed to deny request' });
    }
  }
);

export default router;
