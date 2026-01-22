import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

/**
 * FACTORY RESET (teacher-only)
 * - Deletes ALL students
 * - Deletes ALL loans + loan payments
 * - Resets tenders + tender applications
 * - Resets land ownership + purchase requests
 * - Clears job applications
 * - Clears accounts + transactions (student economy)
 * - Clears announcements
 * - Resets town settings/treasury for ALL towns (6A/6B/6C)
 */
router.post(
  '/factory-reset',
  authenticateToken,
  requireRole(['teacher']),
  [body('confirm').isString().withMessage('Confirm is required')],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { confirm } = req.body as { confirm: string };
    if (confirm !== 'RESET') {
      return res.status(400).json({ error: 'Confirmation text must be exactly RESET' });
    }

    // TypeScript safety: authenticateToken should set req.user, but guard anyway
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const client = await database.pool.connect();
    try {
      await client.query('BEGIN');

      // Count students before deletion (for response)
      const studentsCountRes = await client.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'student'`);
      const studentsCount = studentsCountRes.rows?.[0]?.count ?? 0;

      // IMPORTANT: delete dependent rows first (FK constraints)
      await client.query(`DELETE FROM tender_applications`);
      await client.query(`DELETE FROM tenders`);

      await client.query(`DELETE FROM job_applications`);

      await client.query(`DELETE FROM land_purchase_requests`);
      await client.query(`UPDATE land_parcels SET owner_id = NULL, purchased_at = NULL, updated_at = CURRENT_TIMESTAMP`);

      // Loans
      await client.query(`DELETE FROM loan_payments`);
      await client.query(`DELETE FROM loans`);

      // Math game history (optional, but part of factory reset)
      await client.query(`DELETE FROM math_game_sessions`);
      await client.query(`DELETE FROM math_game_high_scores`);

      // Tax/Treasury history
      await client.query(`DELETE FROM tax_transactions`);
      await client.query(`DELETE FROM treasury_transactions`);

      // Announcements
      await client.query(`DELETE FROM announcements`);

      // Economy
      await client.query(`DELETE FROM transactions`);
      await client.query(`DELETE FROM accounts WHERE user_id IN (SELECT id FROM users WHERE role = 'student')`);

      // Delete students last
      await client.query(`DELETE FROM users WHERE role = 'student'`);

      // Reset towns to defaults
      await client.query(`
        UPDATE town_settings
        SET
          town_name = class || ' Town',
          mayor_name = 'TBD',
          tax_rate = 5.00,
          tax_enabled = true,
          treasury_balance = 10000000.00,
          updated_at = CURRENT_TIMESTAMP
      `);

      // Record initial treasury balance after reset
      await client.query(`
        INSERT INTO treasury_transactions (town_class, amount, transaction_type, description)
        SELECT class, 10000000.00, 'initial_balance', 'Initial town treasury allocation (factory reset)'
        FROM town_settings
      `);

      // Reset bank settings to defaults
      await client.query(`
        UPDATE bank_settings
        SET setting_value = CASE setting_key
          WHEN 'basic_salary_enabled' THEN 'false'
          WHEN 'basic_salary_amount' THEN '1500'
          WHEN 'basic_salary_day' THEN '1'
          WHEN 'basic_salary_hour' THEN '7'
          WHEN 'last_basic_salary_run' THEN ''
          ELSE setting_value
        END,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $1
      `, [req.user.id]);

      await client.query('COMMIT');

      return res.json({
        message: 'Factory reset completed successfully',
        deleted_students: studentsCount
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Factory reset failed:', error);
      return res.status(500).json({ error: 'Factory reset failed' });
    } finally {
      client.release();
    }
  }
);

export default router;

