"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get all students with their account balances (teachers only)
router.get('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const students = await database_prod_1.default.query(`
      SELECT 
        u.id,
        u.username,
        u.created_at,
        a.account_number,
        a.balance,
        a.updated_at as last_activity
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      WHERE u.role = 'student'
      ORDER BY u.username
    `);
        res.json(students);
    }
    catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get student details with loan information (teachers only)
router.get('/:username', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const { username } = req.params;
        // Get student info
        const student = await database_prod_1.default.get(`
      SELECT 
        u.id,
        u.username,
        u.created_at,
        a.account_number,
        a.balance,
        a.updated_at as last_activity
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      WHERE u.username = ? AND u.role = 'student'
    `, [username]);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        // Get student's loans
        const loans = await database_prod_1.default.query(`
      SELECT 
        l.*,
        COALESCE(SUM(lp.amount), 0) as total_paid
      FROM loans l
      LEFT JOIN loan_payments lp ON l.id = lp.loan_id
      WHERE l.borrower_id = ?
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `, [student.id]);
        // Get recent transactions
        const transactions = await database_prod_1.default.query(`
      SELECT 
        t.*,
        fu.username as from_username,
        tu.username as to_username
      FROM transactions t
      LEFT JOIN accounts fa ON t.from_account_id = fa.id
      LEFT JOIN users fu ON fa.user_id = fu.id
      LEFT JOIN accounts ta ON t.to_account_id = ta.id
      LEFT JOIN users tu ON ta.user_id = tu.id
      WHERE t.from_account_id = ? OR t.to_account_id = ?
      ORDER BY t.created_at DESC
      LIMIT 10
    `, [student.id, student.id]);
        res.json({
            student,
            loans,
            recent_transactions: transactions
        });
    }
    catch (error) {
        console.error('Get student details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=students.js.map