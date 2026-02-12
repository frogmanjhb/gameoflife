"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const router = (0, express_1.Router)();
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
router.post('/factory-reset', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), [(0, express_validator_1.body)('confirm').isString().withMessage('Confirm is required')], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { confirm } = req.body;
    if (confirm !== 'RESET') {
        return res.status(400).json({ error: 'Confirmation text must be exactly RESET' });
    }
    // TypeScript safety: authenticateToken should set req.user, but guard anyway
    if (!req.user) {
        return res.status(401).json({ error: 'User not found' });
    }
    const client = await database_prod_1.default.pool.connect();
    try {
        await client.query('BEGIN');
        const schoolId = req.schoolId;
        if (!schoolId) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'School context required' });
        }
        // Count students before deletion (for response)
        const studentsCountRes = await client.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'student' AND school_id = $1`, [schoolId]);
        const studentsCount = studentsCountRes.rows?.[0]?.count ?? 0;
        // IMPORTANT: delete dependent rows first (FK constraints) - scoped to school
        await client.query(`DELETE FROM tender_applications WHERE school_id = $1`, [schoolId]);
        await client.query(`DELETE FROM tenders WHERE school_id = $1`, [schoolId]);
        await client.query(`DELETE FROM job_applications WHERE school_id = $1`, [schoolId]);
        await client.query(`DELETE FROM land_purchase_requests WHERE school_id = $1`, [schoolId]);
        await client.query(`UPDATE land_parcels SET owner_id = NULL, purchased_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE school_id = $1`, [schoolId]);
        // Loans
        await client.query(`DELETE FROM loan_payments WHERE loan_id IN (SELECT id FROM loans WHERE borrower_id IN (SELECT id FROM users WHERE role = 'student' AND school_id = $1))`, [schoolId]);
        await client.query(`DELETE FROM loans WHERE borrower_id IN (SELECT id FROM users WHERE role = 'student' AND school_id = $1)`, [schoolId]);
        // Math game history (optional, but part of factory reset)
        await client.query(`DELETE FROM math_game_sessions WHERE user_id IN (SELECT id FROM users WHERE role = 'student' AND school_id = $1)`, [schoolId]);
        await client.query(`DELETE FROM math_game_high_scores WHERE user_id IN (SELECT id FROM users WHERE role = 'student' AND school_id = $1)`, [schoolId]);
        // Tax/Treasury history
        await client.query(`DELETE FROM tax_transactions WHERE school_id = $1`, [schoolId]);
        await client.query(`DELETE FROM treasury_transactions WHERE school_id = $1`, [schoolId]);
        // Announcements
        await client.query(`DELETE FROM announcements WHERE school_id = $1`, [schoolId]);
        // Economy
        await client.query(`DELETE FROM transactions WHERE school_id = $1`, [schoolId]);
        await client.query(`DELETE FROM accounts WHERE school_id = $1`, [schoolId]);
        // Delete students last
        await client.query(`DELETE FROM users WHERE role = 'student' AND school_id = $1`, [schoolId]);
        // Reset towns to defaults (for this school)
        await client.query(`
        UPDATE town_settings
        SET
          town_name = class || ' Town',
          mayor_name = 'TBD',
          tax_rate = 5.00,
          tax_enabled = true,
          treasury_balance = 10000000.00,
          updated_at = CURRENT_TIMESTAMP
        WHERE school_id = $1
      `, [schoolId]);
        // Record initial treasury balance after reset
        await client.query(`
        INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description)
        SELECT $1, class, 10000000.00, 'initial_balance', 'Initial town treasury allocation (factory reset)'
        FROM town_settings
        WHERE school_id = $1
      `, [schoolId]);
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
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Factory reset failed:', error);
        return res.status(500).json({ error: 'Factory reset failed' });
    }
    finally {
        client.release();
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map