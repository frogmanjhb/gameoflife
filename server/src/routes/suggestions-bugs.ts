import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

const REWARD_AMOUNT = 1000;

// Student: submit a suggestion
router.post(
  '/suggestions',
  [
    body('content').isString().trim().isLength({ min: 5, max: 5000 }).withMessage('Content must be 5-5000 characters')
  ],
  authenticateToken,
  requireRole(['student']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const { content } = req.body as { content: string };

      const created = await database.run(
        'INSERT INTO suggestions (user_id, content) VALUES ($1, $2) RETURNING id',
        [req.user.id, content]
      );

      res.json({ message: 'Suggestion submitted', id: created.lastID });
    } catch (error) {
      console.error('Submit suggestion error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Student: submit a bug report
router.post(
  '/bugs',
  [
    body('title').isString().trim().isLength({ min: 3, max: 255 }).withMessage('Title must be 3-255 characters'),
    body('description').isString().trim().isLength({ min: 10, max: 10000 }).withMessage('Description must be 10-10000 characters')
  ],
  authenticateToken,
  requireRole(['student']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const { title, description } = req.body as { title: string; description: string };

      const created = await database.run(
        'INSERT INTO bug_reports (user_id, title, description) VALUES ($1, $2, $3) RETURNING id',
        [req.user.id, title, description]
      );

      res.json({ message: 'Bug report submitted', id: created.lastID });
    } catch (error) {
      console.error('Submit bug report error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Student: view my submissions
router.get('/my', authenticateToken, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const suggestions = await database.query(
      `
      SELECT
        s.*,
        ru.username as reviewed_by_username
      FROM suggestions s
      LEFT JOIN users ru ON s.reviewed_by = ru.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
      `,
      [req.user.id]
    );

    const bugReports = await database.query(
      `
      SELECT
        b.*,
        ru.username as reviewed_by_username
      FROM bug_reports b
      LEFT JOIN users ru ON b.reviewed_by = ru.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
      `,
      [req.user.id]
    );

    res.json({ suggestions, bugReports });
  } catch (error) {
    console.error('Get my suggestions/bugs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Teacher: review queue (pending only, same school)
router.get('/admin/queue', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.schoolId ?? req.user?.school_id ?? null;
    const schoolFilter = schoolId !== null ? 'AND u.school_id = $1' : '';
    const params = schoolId !== null ? [schoolId] : [];

    const suggestions = await database.query(
      `
      SELECT
        s.*,
        u.username,
        u.first_name,
        u.last_name,
        u.class
      FROM suggestions s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'pending' ${schoolFilter}
      ORDER BY s.created_at ASC
      `,
      params
    );

    const bugReports = await database.query(
      `
      SELECT
        b.*,
        u.username,
        u.first_name,
        u.last_name,
        u.class
      FROM bug_reports b
      JOIN users u ON b.user_id = u.id
      WHERE b.status = 'pending' ${schoolFilter}
      ORDER BY b.created_at ASC
      `,
      params
    );

    res.json({ suggestions, bugReports });
  } catch (error) {
    console.error('Get review queue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Teacher: all suggestions/bugs (for tabs: approved/denied/pending, same school)
router.get('/admin/all', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.schoolId ?? req.user?.school_id ?? null;
    const schoolFilter = schoolId !== null ? 'AND u.school_id = $1' : '';
    const params = schoolId !== null ? [schoolId] : [];

    const suggestions = await database.query(
      `
      SELECT
        s.*,
        u.username,
        u.first_name,
        u.last_name,
        u.class,
        ru.username as reviewed_by_username
      FROM suggestions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN users ru ON s.reviewed_by = ru.id
      WHERE 1=1 ${schoolFilter}
      ORDER BY s.created_at DESC
      LIMIT 500
      `,
      params
    );

    const bugReports = await database.query(
      `
      SELECT
        b.*,
        u.username,
        u.first_name,
        u.last_name,
        u.class,
        ru.username as reviewed_by_username
      FROM bug_reports b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN users ru ON b.reviewed_by = ru.id
      WHERE 1=1 ${schoolFilter}
      ORDER BY b.created_at DESC
      LIMIT 500
      `,
      params
    );

    res.json({ suggestions, bugReports });
  } catch (error) {
    console.error('Get all suggestions/bugs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Teacher: review suggestion (approve/deny). Approve auto-pays reward once. Same school only.
router.put(
  '/admin/suggestions/:id/review',
  [body('status').isIn(['approved', 'denied']).withMessage('Status must be approved or denied')],
  authenticateToken,
  requireTenant,
  requireRole(['teacher']),
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid suggestion id' });
    }

    const { status } = req.body as { status: 'approved' | 'denied' };
    const schoolId = req.schoolId ?? req.user?.school_id ?? null;

    const client = await database.pool.connect();
    try {
      await client.query('BEGIN');

      const suggestionRes = await client.query(
        'SELECT s.*, u.school_id as submitter_school_id FROM suggestions s JOIN users u ON s.user_id = u.id WHERE s.id = $1 FOR UPDATE',
        [id]
      );
      const suggestion = suggestionRes.rows?.[0];
      if (!suggestion) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Suggestion not found' });
      }
      if (schoolId !== null && suggestion.submitter_school_id !== schoolId) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Suggestion not found' });
      }

      if (suggestion.status !== 'pending') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Suggestion is already ${suggestion.status}` });
      }

      await client.query(
        `
        UPDATE suggestions
        SET status = $1,
            reviewed_by = $2,
            reviewed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        `,
        [status, req.user.id, id]
      );

      let rewardPaid = false;
      if (status === 'approved' && !suggestion.reward_paid) {
        const accountRes = await client.query('SELECT a.id, u.class, u.school_id FROM accounts a JOIN users u ON a.user_id = u.id WHERE a.user_id = $1', [suggestion.user_id]);
        const accountId = accountRes.rows?.[0]?.id;
        const userClass = accountRes.rows?.[0]?.class;
        const suggestionSchoolId = accountRes.rows?.[0]?.school_id ?? null;

        if (accountId) {
          // Check treasury has sufficient funds (filtered by school_id)
          if (userClass && ['6A', '6B', '6C'].includes(userClass)) {
            const townRes = suggestionSchoolId != null
              ? await client.query('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id = $2', [userClass, suggestionSchoolId])
              : await client.query('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id IS NULL', [userClass]);
            const treasuryBalance = parseFloat(townRes.rows?.[0]?.treasury_balance || '0');
            
            if (treasuryBalance < REWARD_AMOUNT) {
              await client.query('ROLLBACK');
              return res.status(400).json({ error: `Insufficient treasury funds for class ${userClass} to pay reward` });
            }

            // Deduct from treasury (filtered by school_id)
            if (suggestionSchoolId != null) {
              await client.query(
                'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3',
                [REWARD_AMOUNT, userClass, suggestionSchoolId]
              );
            } else {
              await client.query(
                'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL',
                [REWARD_AMOUNT, userClass]
              );
            }

            // Record treasury transaction
            await client.query(
              'INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
              [suggestionSchoolId, userClass, REWARD_AMOUNT, 'withdrawal', `Suggestion reward payout`, suggestion.user_id]
            );
          }

          await client.query(
            'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [REWARD_AMOUNT, accountId]
          );

          await client.query(
            'INSERT INTO transactions (to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
            [accountId, REWARD_AMOUNT, 'deposit', 'Reward for approved suggestion']
          );

          await client.query(
            `
            UPDATE suggestions
            SET reward_paid = true,
                reward_paid_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            `,
            [id]
          );

          rewardPaid = true;
        }
      }

      await client.query('COMMIT');
      res.json({ message: `Suggestion ${status}`, reward_paid: rewardPaid });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Review suggestion error:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }
);

// Teacher: review bug report (verify/deny). Verify auto-pays reward once. Same school only.
router.put(
  '/admin/bugs/:id/review',
  [body('status').isIn(['verified', 'denied']).withMessage('Status must be verified or denied')],
  authenticateToken,
  requireTenant,
  requireRole(['teacher']),
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid bug report id' });
    }

    const { status } = req.body as { status: 'verified' | 'denied' };
    const schoolId = req.schoolId ?? req.user?.school_id ?? null;

    const client = await database.pool.connect();
    try {
      await client.query('BEGIN');

      const bugRes = await client.query(
        'SELECT b.*, u.school_id as submitter_school_id FROM bug_reports b JOIN users u ON b.user_id = u.id WHERE b.id = $1 FOR UPDATE',
        [id]
      );
      const bug = bugRes.rows?.[0];
      if (!bug) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Bug report not found' });
      }
      if (schoolId !== null && bug.submitter_school_id !== schoolId) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Bug report not found' });
      }

      if (bug.status !== 'pending') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Bug report is already ${bug.status}` });
      }

      await client.query(
        `
        UPDATE bug_reports
        SET status = $1,
            reviewed_by = $2,
            reviewed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        `,
        [status, req.user.id, id]
      );

      let rewardPaid = false;
      if (status === 'verified' && !bug.reward_paid) {
        const accountRes = await client.query('SELECT a.id, u.class, u.school_id FROM accounts a JOIN users u ON a.user_id = u.id WHERE a.user_id = $1', [bug.user_id]);
        const accountId = accountRes.rows?.[0]?.id;
        const userClass = accountRes.rows?.[0]?.class;
        const bugSchoolId = accountRes.rows?.[0]?.school_id ?? null;

        if (accountId) {
          // Check treasury has sufficient funds (filtered by school_id)
          if (userClass && ['6A', '6B', '6C'].includes(userClass)) {
            const townRes = bugSchoolId != null
              ? await client.query('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id = $2', [userClass, bugSchoolId])
              : await client.query('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id IS NULL', [userClass]);
            const treasuryBalance = parseFloat(townRes.rows?.[0]?.treasury_balance || '0');
            
            if (treasuryBalance < REWARD_AMOUNT) {
              await client.query('ROLLBACK');
              return res.status(400).json({ error: `Insufficient treasury funds for class ${userClass} to pay reward` });
            }

            // Deduct from treasury (filtered by school_id)
            if (bugSchoolId != null) {
              await client.query(
                'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3',
                [REWARD_AMOUNT, userClass, bugSchoolId]
              );
            } else {
              await client.query(
                'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL',
                [REWARD_AMOUNT, userClass]
              );
            }

            // Record treasury transaction
            await client.query(
              'INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
              [bugSchoolId, userClass, REWARD_AMOUNT, 'withdrawal', `Bug report reward payout`, bug.user_id]
            );
          }

          await client.query(
            'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [REWARD_AMOUNT, accountId]
          );

          await client.query(
            'INSERT INTO transactions (to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
            [accountId, REWARD_AMOUNT, 'deposit', 'Reward for verified bug report']
          );

          await client.query(
            `
            UPDATE bug_reports
            SET reward_paid = true,
                reward_paid_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            `,
            [id]
          );

          rewardPaid = true;
        }
      }

      await client.query('COMMIT');
      res.json({ message: `Bug report ${status}`, reward_paid: rewardPaid });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Review bug report error:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }
);

export default router;

