import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

function isValidTownClass(townClass: any): townClass is '6A' | '6B' | '6C' {
  return townClass === '6A' || townClass === '6B' || townClass === '6C';
}

// Pay an awarded tender from the town treasury to the awarded student (teachers only, same school)
router.post('/:id/pay', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenderId = parseInt(req.params.id);
    if (isNaN(tenderId)) {
      return res.status(400).json({ error: 'Invalid tender ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const schoolId = req.schoolId ?? req.user.school_id ?? null;
    const tender = await database.get(
      'SELECT * FROM tenders WHERE id = $1',
      [tenderId]
    );
    if (!tender) {
      return res.status(404).json({ error: 'Tender not found' });
    }
    if (schoolId !== null && (tender.school_id == null || tender.school_id !== schoolId)) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    if (tender.status !== 'awarded') {
      return res.status(400).json({ error: 'Tender must be awarded before it can be paid' });
    }

    if (tender.paid) {
      return res.status(400).json({ error: 'Tender has already been paid' });
    }

    if (!tender.awarded_to_user_id) {
      return res.status(400).json({ error: 'Tender has no awarded student' });
    }

    const amount = Number(tender.value || 0);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Tender value must be greater than 0' });
    }

    const townClass = tender.town_class;
    if (!isValidTownClass(townClass)) {
      return res.status(400).json({ error: 'Invalid town class on tender' });
    }

    const town = schoolId != null
      ? await database.get('SELECT * FROM town_settings WHERE class = $1 AND school_id = $2', [townClass, schoolId])
      : await database.get('SELECT * FROM town_settings WHERE class = $1 AND school_id IS NULL', [townClass]);
    if (!town) {
      return res.status(404).json({ error: 'Town not found' });
    }

    const treasuryBalance = Number(town.treasury_balance || 0);
    if (treasuryBalance < amount) {
      return res.status(400).json({ error: 'Insufficient treasury funds' });
    }

    const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [tender.awarded_to_user_id]);
    if (!account) {
      return res.status(400).json({ error: 'Awarded student has no bank account' });
    }

    const client = await database.pool.connect();
    try {
      await client.query('BEGIN');

      // Deduct from treasury (filtered by school_id)
      const tenderSchoolId = req.user.school_id ?? req.schoolId ?? null;
      if (tenderSchoolId != null) {
        await client.query(
          'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3',
          [amount, townClass, tenderSchoolId]
        );
      } else {
        await client.query(
          'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL',
          [amount, townClass]
        );
      }

      // Record treasury transaction
      await client.query(
        'INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
        [tenderSchoolId, townClass, -amount, 'withdrawal', `Tender payout: ${tender.name}`, req.user.id]
      );

      // Credit student account
      await client.query(
        'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [amount, account.id]
      );

      // Record transaction
      await client.query(
        'INSERT INTO transactions (to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
        [account.id, amount, 'deposit', `Tender payout: ${tender.name}`]
      );

      // Mark tender as paid
      await client.query(
        'UPDATE tenders SET paid = true, paid_at = CURRENT_TIMESTAMP, paid_by = $1 WHERE id = $2',
        [req.user.id, tenderId]
      );

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    const updatedTender = await database.get(
      `SELECT 
          t.*,
          u.username AS created_by_username,
          au.username AS awarded_to_username
       FROM tenders t
       LEFT JOIN users u ON t.created_by = u.id
       LEFT JOIN users au ON t.awarded_to_user_id = au.id
       WHERE t.id = $1`,
      [tenderId]
    );

    return res.json(updatedTender);
  } catch (error) {
    console.error('Failed to pay tender:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// List tenders (town-scoped)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestedTownClass = req.query.town_class;

    const schoolId = req.user?.school_id ?? null;

    // Students can ONLY see their own class tenders in their school
    if (req.user?.role === 'student') {
      const townClass = req.user?.class;
      if (!isValidTownClass(townClass)) {
        return res.status(400).json({ error: 'Student has no valid town class' });
      }

      const schoolFilter = schoolId !== null ? 'AND t.school_id = $3' : 'AND t.school_id IS NULL';
      const params = schoolId !== null ? [req.user.id, townClass, schoolId] : [req.user.id, townClass];

      const tenders = await database.query(
        `SELECT 
            t.*,
            u.username AS created_by_username,
            au.username AS awarded_to_username,
            a.id AS my_application_id,
            a.status AS my_application_status
         FROM tenders t
         LEFT JOIN users u ON t.created_by = u.id
         LEFT JOIN users au ON t.awarded_to_user_id = au.id
         LEFT JOIN tender_applications a 
           ON a.tender_id = t.id AND a.applicant_id = $1
         WHERE t.town_class = $2 ${schoolFilter}
         ORDER BY t.created_at DESC`,
        params
      );

      return res.json(tenders);
    }

    // Teachers: can request a town_class, default to their class (or 6A fallback); only see tenders in their school
    let townClass: '6A' | '6B' | '6C' = '6A';
    if (isValidTownClass(requestedTownClass)) {
      townClass = requestedTownClass;
    } else if (isValidTownClass(req.user?.class)) {
      townClass = req.user.class as any;
    }

    const schoolFilter = schoolId !== null ? 'AND t.school_id = $2' : 'AND t.school_id IS NULL';
    const listParams = schoolId !== null ? [townClass, schoolId] : [townClass];

    const tenders = await database.query(
      `SELECT 
          t.*,
          u.username AS created_by_username,
          au.username AS awarded_to_username,
          (SELECT COUNT(*)::int FROM tender_applications ta WHERE ta.tender_id = t.id) AS application_count,
          (SELECT COUNT(*)::int FROM tender_applications ta WHERE ta.tender_id = t.id AND ta.status = 'pending') AS pending_count
       FROM tenders t
       LEFT JOIN users u ON t.created_by = u.id
       LEFT JOIN users au ON t.awarded_to_user_id = au.id
       WHERE t.town_class = $1 ${schoolFilter}
       ORDER BY t.created_at DESC`,
      listParams
    );

    return res.json(tenders);
  } catch (error) {
    console.error('Failed to fetch tenders:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a tender (teachers only, school-scoped)
router.post(
  '/',
  authenticateToken,
  requireTenant,
  requireRole(['teacher']),
  [
    body('town_class').isIn(['6A', '6B', '6C']).withMessage('Town class must be 6A, 6B, or 6C'),
    body('name').isString().trim().notEmpty().withMessage('Tender name is required'),
    body('description').optional().isString(),
    body('value').isFloat({ min: 0 }).withMessage('Value must be 0 or greater')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const schoolId = req.schoolId ?? req.user.school_id ?? null;
      const { town_class, name, description, value } = req.body;

      const result = await database.run(
        `INSERT INTO tenders (town_class, name, description, value, status, created_by, school_id)
         VALUES ($1, $2, $3, $4, 'open', $5, $6)
         RETURNING id`,
        [town_class, name, description || null, value, req.user.id, schoolId]
      );

      const tender = await database.get(
        `SELECT t.*, u.username AS created_by_username
         FROM tenders t
         LEFT JOIN users u ON t.created_by = u.id
         WHERE t.id = $1`,
        [result.lastID]
      );

      // Create a town alert so students can see the new tender immediately
      try {
        const title = `New Tender Available: ${name}`;
        const contentParts = [
          description ? String(description) : null,
          `Value: R${Number(value).toFixed(2)}`,
          `Open the Tenders system to apply.`
        ].filter(Boolean);

        await database.run(
          'INSERT INTO announcements (title, content, town_class, created_by, school_id) VALUES ($1, $2, $3, $4, $5)',
          [title, contentParts.join('\n\n'), town_class, req.user.id, schoolId]
        );
      } catch (announcementError) {
        console.warn('⚠️ Failed to create tender announcement:', announcementError);
      }

      return res.status(201).json(tender);
    } catch (error) {
      console.error('Failed to create tender:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Apply to a tender (students only)
router.post('/:id/apply', authenticateToken, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenderId = parseInt(req.params.id);
    if (isNaN(tenderId)) {
      return res.status(400).json({ error: 'Invalid tender ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const townClass = req.user.class;
    if (!isValidTownClass(townClass)) {
      return res.status(400).json({ error: 'Student has no valid town class' });
    }

    const tender = await database.get('SELECT * FROM tenders WHERE id = $1', [tenderId]);
    if (!tender) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    const studentSchoolId = req.user.school_id ?? null;
    if (studentSchoolId !== null && (tender.school_id == null || tender.school_id !== studentSchoolId)) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    if (tender.town_class !== townClass) {
      return res.status(403).json({ error: 'You can only apply to tenders in your town' });
    }

    if (tender.status !== 'open') {
      return res.status(400).json({ error: 'Tender is not open for applications' });
    }

    const result = await database.run(
      `INSERT INTO tender_applications (tender_id, applicant_id, status)
       VALUES ($1, $2, 'pending')
       ON CONFLICT (tender_id, applicant_id) DO NOTHING
       RETURNING id`,
      [tenderId, req.user.id]
    );

    // If it already existed, fetch existing app
    const applicationId = result.lastID;
    const application = applicationId
      ? await database.get(
          `SELECT ta.*, u.username AS applicant_username, u.first_name AS applicant_first_name, u.last_name AS applicant_last_name
           FROM tender_applications ta
           JOIN users u ON ta.applicant_id = u.id
           WHERE ta.id = $1`,
          [applicationId]
        )
      : await database.get(
          `SELECT ta.*, u.username AS applicant_username, u.first_name AS applicant_first_name, u.last_name AS applicant_last_name
           FROM tender_applications ta
           JOIN users u ON ta.applicant_id = u.id
           WHERE ta.tender_id = $1 AND ta.applicant_id = $2`,
          [tenderId, req.user.id]
        );

    return res.status(201).json(application);
  } catch (error) {
    console.error('Failed to apply to tender:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get applications for a tender (teachers only, same school as tender)
router.get('/:id/applications', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenderId = parseInt(req.params.id);
    if (isNaN(tenderId)) {
      return res.status(400).json({ error: 'Invalid tender ID' });
    }

    const schoolId = req.schoolId ?? req.user?.school_id ?? null;
    const tender = await database.get('SELECT * FROM tenders WHERE id = $1', [tenderId]);
    if (!tender) {
      return res.status(404).json({ error: 'Tender not found' });
    }
    if (schoolId !== null && (tender.school_id == null || tender.school_id !== schoolId)) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    const applications = await database.query(
      `SELECT 
          ta.*,
          u.username AS applicant_username,
          u.first_name AS applicant_first_name,
          u.last_name AS applicant_last_name,
          u.class AS applicant_class,
          r.username AS reviewer_username
       FROM tender_applications ta
       JOIN users u ON ta.applicant_id = u.id
       LEFT JOIN users r ON ta.reviewed_by = r.id
       WHERE ta.tender_id = $1
       ORDER BY ta.created_at DESC`,
      [tenderId]
    );

    return res.json({ tender, applications });
  } catch (error) {
    console.error('Failed to fetch tender applications:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve/deny an application (teachers only, tender must be in teacher's school)
router.put(
  '/applications/:id',
  authenticateToken,
  requireTenant,
  requireRole(['teacher']),
  [body('status').isIn(['approved', 'denied']).withMessage('Status must be approved or denied')],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const applicationId = parseInt(req.params.id);
      if (isNaN(applicationId)) {
        return res.status(400).json({ error: 'Invalid application ID' });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const { status } = req.body as { status: 'approved' | 'denied' };
      const schoolId = req.schoolId ?? req.user?.school_id ?? null;

      const application = await database.get('SELECT * FROM tender_applications WHERE id = $1', [applicationId]);
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const tender = await database.get('SELECT * FROM tenders WHERE id = $1', [application.tender_id]);
      if (!tender) {
        return res.status(404).json({ error: 'Tender not found' });
      }
      if (schoolId !== null && (tender.school_id == null || tender.school_id !== schoolId)) {
        return res.status(404).json({ error: 'Tender not found' });
      }

      // For approval, enforce "open" and one-award policy
      if (status === 'approved') {
        if (tender.status !== 'open') {
          return res.status(400).json({ error: 'Tender is not open for awarding' });
        }

        const alreadyApproved = await database.get(
          `SELECT id FROM tender_applications WHERE tender_id = $1 AND status = 'approved' LIMIT 1`,
          [tender.id]
        );
        if (alreadyApproved) {
          return res.status(400).json({ error: 'This tender has already been awarded' });
        }
      }

      const client = await database.pool.connect();
      try {
        await client.query('BEGIN');

        // Update the application
        await client.query(
          `UPDATE tender_applications
           SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [status, req.user.id, applicationId]
        );

        // If approved, award tender and deny other pending applications
        if (status === 'approved') {
          await client.query(
            `UPDATE tenders
             SET status = 'awarded',
                 awarded_to_user_id = $1,
                 awarded_application_id = $2,
                 awarded_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [application.applicant_id, applicationId, tender.id]
          );

          await client.query(
            `UPDATE tender_applications
             SET status = 'denied',
                 reviewed_by = $1,
                 reviewed_at = CURRENT_TIMESTAMP
             WHERE tender_id = $2 AND id <> $3 AND status = 'pending'`,
            [req.user.id, tender.id, applicationId]
          );
        }

        await client.query('COMMIT');
      } catch (txErr) {
        await client.query('ROLLBACK');
        throw txErr;
      } finally {
        client.release();
      }

      const updated = await database.get(
        `SELECT ta.*, r.username AS reviewer_username
         FROM tender_applications ta
         LEFT JOIN users r ON ta.reviewed_by = r.id
         WHERE ta.id = $1`,
        [applicationId]
      );

      return res.json(updated);
    } catch (error) {
      console.error('Failed to update tender application:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;


