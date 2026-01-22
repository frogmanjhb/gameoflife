"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Helper function to calculate progressive tax rate based on salary
async function calculateProgressiveTax(salary) {
    // Get tax bracket for this salary
    const bracket = await database_prod_1.default.get(`SELECT tax_rate FROM tax_brackets 
     WHERE min_salary <= $1 AND (max_salary IS NULL OR max_salary >= $1)
     ORDER BY min_salary DESC LIMIT 1`, [salary]);
    const taxRate = bracket?.tax_rate || 0;
    const taxAmount = Math.round((salary * taxRate / 100) * 100) / 100;
    const netAmount = Math.round((salary - taxAmount) * 100) / 100;
    return { taxRate, taxAmount, netAmount };
}
// Get town settings (filtered by class if provided, or all for teachers)
router.get('/settings', auth_1.authenticateToken, async (req, res) => {
    try {
        const { class: townClass, all } = req.query;
        // Teachers can get all towns with ?all=true
        if (all === 'true' && req.user?.role === 'teacher') {
            const towns = await database_prod_1.default.query('SELECT * FROM town_settings ORDER BY class');
            return res.json(towns);
        }
        // Get specific town by class
        if (townClass && ['6A', '6B', '6C'].includes(townClass)) {
            const town = await database_prod_1.default.get('SELECT * FROM town_settings WHERE class = $1', [townClass]);
            if (!town) {
                return res.status(404).json({ error: 'Town not found' });
            }
            return res.json(town);
        }
        // If user has a class, return their town
        if (req.user?.class && ['6A', '6B', '6C'].includes(req.user.class)) {
            const town = await database_prod_1.default.get('SELECT * FROM town_settings WHERE class = $1', [req.user.class]);
            if (town) {
                return res.json(town);
            }
        }
        // Default: return first town or empty
        const firstTown = await database_prod_1.default.get('SELECT * FROM town_settings ORDER BY class LIMIT 1');
        res.json(firstTown || null);
    }
    catch (error) {
        console.error('Failed to fetch town settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update town settings (teachers only)
router.put('/settings/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), [
    (0, express_validator_1.body)('town_name').optional().notEmpty().withMessage('Town name cannot be empty'),
    (0, express_validator_1.body)('mayor_name').optional(),
    (0, express_validator_1.body)('tax_rate').optional().isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100'),
    (0, express_validator_1.body)('tax_enabled').optional().isBoolean().withMessage('Tax enabled must be a boolean')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const townId = parseInt(req.params.id);
        if (isNaN(townId)) {
            return res.status(400).json({ error: 'Invalid town ID' });
        }
        const town = await database_prod_1.default.get('SELECT * FROM town_settings WHERE id = $1', [townId]);
        if (!town) {
            return res.status(404).json({ error: 'Town not found' });
        }
        const { town_name, mayor_name, tax_rate, tax_enabled } = req.body;
        const updates = [];
        const params = [];
        let paramIndex = 1;
        if (town_name !== undefined) {
            updates.push(`town_name = $${paramIndex++}`);
            params.push(town_name);
        }
        if (mayor_name !== undefined) {
            updates.push(`mayor_name = $${paramIndex++}`);
            params.push(mayor_name);
        }
        if (tax_rate !== undefined) {
            updates.push(`tax_rate = $${paramIndex++}`);
            params.push(tax_rate);
        }
        if (tax_enabled !== undefined) {
            updates.push(`tax_enabled = $${paramIndex++}`);
            params.push(tax_enabled);
        }
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(townId);
        await database_prod_1.default.run(`UPDATE town_settings SET ${updates.join(', ')} WHERE id = $${paramIndex}`, params);
        const updated = await database_prod_1.default.get('SELECT * FROM town_settings WHERE id = $1', [townId]);
        res.json(updated);
    }
    catch (error) {
        console.error('Failed to update town settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get treasury info for a town (teachers only)
router.get('/treasury/:class', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const { class: townClass } = req.params;
        if (!['6A', '6B', '6C'].includes(townClass)) {
            return res.status(400).json({ error: 'Invalid town class' });
        }
        const town = await database_prod_1.default.get('SELECT * FROM town_settings WHERE class = $1', [townClass]);
        if (!town) {
            return res.status(404).json({ error: 'Town not found' });
        }
        // Get recent treasury transactions
        const transactions = await database_prod_1.default.query(`SELECT tt.*, u.username as created_by_username
       FROM treasury_transactions tt
       LEFT JOIN users u ON tt.created_by = u.id
       WHERE tt.town_class = $1
       ORDER BY tt.created_at DESC
       LIMIT 50`, [townClass]);
        // Get treasury stats
        const stats = await database_prod_1.default.get(`SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'tax_collection' THEN amount ELSE 0 END), 0) as total_tax_collected,
        COALESCE(SUM(CASE WHEN transaction_type = 'salary_payment' THEN amount ELSE 0 END), 0) as total_salaries_paid,
        COALESCE(SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END), 0) as total_deposits,
        COALESCE(SUM(CASE WHEN transaction_type = 'withdrawal' THEN amount ELSE 0 END), 0) as total_withdrawals
       FROM treasury_transactions
       WHERE town_class = $1`, [townClass]);
        res.json({
            treasury_balance: town.treasury_balance,
            tax_enabled: town.tax_enabled,
            tax_rate: town.tax_rate,
            transactions,
            stats: {
                total_tax_collected: parseFloat(stats.total_tax_collected) || 0,
                total_salaries_paid: parseFloat(stats.total_salaries_paid) || 0,
                total_deposits: parseFloat(stats.total_deposits) || 0,
                total_withdrawals: parseFloat(stats.total_withdrawals) || 0
            }
        });
    }
    catch (error) {
        console.error('Failed to fetch treasury info:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Deposit to treasury (teachers only)
router.post('/treasury/:class/deposit', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), [
    (0, express_validator_1.body)('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    (0, express_validator_1.body)('description').optional().isString()
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { class: townClass } = req.params;
        const { amount, description } = req.body;
        if (!['6A', '6B', '6C'].includes(townClass)) {
            return res.status(400).json({ error: 'Invalid town class' });
        }
        // Update treasury balance
        await database_prod_1.default.run('UPDATE town_settings SET treasury_balance = treasury_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2', [amount, townClass]);
        // Record treasury transaction
        await database_prod_1.default.run('INSERT INTO treasury_transactions (town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5)', [townClass, amount, 'deposit', description || 'Manual deposit by teacher', req.user?.id]);
        const town = await database_prod_1.default.get('SELECT * FROM town_settings WHERE class = $1', [townClass]);
        res.json({ message: 'Deposit successful', treasury_balance: town.treasury_balance });
    }
    catch (error) {
        console.error('Failed to deposit to treasury:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Withdraw from treasury (teachers only)
router.post('/treasury/:class/withdraw', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), [
    (0, express_validator_1.body)('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    (0, express_validator_1.body)('description').optional().isString()
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { class: townClass } = req.params;
        const { amount, description } = req.body;
        if (!['6A', '6B', '6C'].includes(townClass)) {
            return res.status(400).json({ error: 'Invalid town class' });
        }
        const town = await database_prod_1.default.get('SELECT * FROM town_settings WHERE class = $1', [townClass]);
        if (!town) {
            return res.status(404).json({ error: 'Town not found' });
        }
        if (parseFloat(town.treasury_balance) < amount) {
            return res.status(400).json({ error: 'Insufficient treasury funds' });
        }
        // Update treasury balance
        await database_prod_1.default.run('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2', [amount, townClass]);
        // Record treasury transaction
        await database_prod_1.default.run('INSERT INTO treasury_transactions (town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5)', [townClass, -amount, 'withdrawal', description || 'Manual withdrawal by teacher', req.user?.id]);
        const updatedTown = await database_prod_1.default.get('SELECT * FROM town_settings WHERE class = $1', [townClass]);
        res.json({ message: 'Withdrawal successful', treasury_balance: updatedTown.treasury_balance });
    }
    catch (error) {
        console.error('Failed to withdraw from treasury:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get tax brackets
router.get('/tax-brackets', auth_1.authenticateToken, async (req, res) => {
    try {
        const brackets = await database_prod_1.default.query('SELECT * FROM tax_brackets ORDER BY min_salary ASC');
        res.json(brackets);
    }
    catch (error) {
        console.error('Failed to fetch tax brackets:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get tax report for a town (teachers only)
router.get('/tax-report/:class', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const { class: townClass } = req.params;
        const { period } = req.query; // 'week', 'month', 'all'
        if (!['6A', '6B', '6C'].includes(townClass)) {
            return res.status(400).json({ error: 'Invalid town class' });
        }
        let dateFilter = '';
        if (period === 'week') {
            dateFilter = "AND tt.created_at >= CURRENT_DATE - INTERVAL '7 days'";
        }
        else if (period === 'month') {
            dateFilter = "AND tt.created_at >= CURRENT_DATE - INTERVAL '30 days'";
        }
        // Get tax paid by each student
        const studentTaxes = await database_prod_1.default.query(`SELECT 
        u.id as user_id,
        u.username,
        u.first_name,
        u.last_name,
        COALESCE(SUM(tt.gross_amount), 0) as total_gross,
        COALESCE(SUM(tt.tax_amount), 0) as total_tax_paid,
        COALESCE(SUM(tt.net_amount), 0) as total_net,
        COUNT(tt.id) as payment_count
       FROM users u
       LEFT JOIN tax_transactions tt ON u.id = tt.user_id AND tt.town_class = $1 ${dateFilter}
       WHERE u.role = 'student' AND u.class = $1
       GROUP BY u.id, u.username, u.first_name, u.last_name
       ORDER BY total_tax_paid DESC`, [townClass]);
        // Get summary stats
        const summary = await database_prod_1.default.get(`SELECT 
        COALESCE(SUM(gross_amount), 0) as total_gross,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(net_amount), 0) as total_net,
        COUNT(*) as total_payments,
        COALESCE(AVG(tax_rate_applied), 0) as avg_tax_rate
       FROM tax_transactions
       WHERE town_class = $1 ${dateFilter}`, [townClass]);
        // Get recent tax transactions
        const recentTransactions = await database_prod_1.default.query(`SELECT tt.*, u.username, u.first_name, u.last_name
       FROM tax_transactions tt
       JOIN users u ON tt.user_id = u.id
       WHERE tt.town_class = $1 ${dateFilter}
       ORDER BY tt.created_at DESC
       LIMIT 50`, [townClass]);
        res.json({
            student_taxes: studentTaxes,
            summary: {
                total_gross: parseFloat(summary.total_gross) || 0,
                total_tax: parseFloat(summary.total_tax) || 0,
                total_net: parseFloat(summary.total_net) || 0,
                total_payments: parseInt(summary.total_payments) || 0,
                avg_tax_rate: parseFloat(summary.avg_tax_rate) || 0
            },
            recent_transactions: recentTransactions
        });
    }
    catch (error) {
        console.error('Failed to fetch tax report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Pay salaries to all employed students in a class (teachers only)
// This deducts from treasury and applies progressive tax
router.post('/pay-salaries/:class', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const { class: townClass } = req.params;
        if (!['6A', '6B', '6C'].includes(townClass)) {
            return res.status(400).json({ error: 'Invalid town class' });
        }
        // Get town settings
        const town = await database_prod_1.default.get('SELECT * FROM town_settings WHERE class = $1', [townClass]);
        if (!town) {
            return res.status(404).json({ error: 'Town not found' });
        }
        // Get all employed students in this class with their salaries
        const students = await database_prod_1.default.query(`SELECT u.id, u.username, u.first_name, u.last_name, u.class, 
                j.salary, j.name as job_name,
                a.id as account_id
         FROM users u
         JOIN jobs j ON u.job_id = j.id
         LEFT JOIN accounts a ON u.id = a.user_id
         WHERE u.role = 'student' AND u.class = $1 AND u.job_id IS NOT NULL`, [townClass]);
        if (students.length === 0) {
            return res.json({ message: 'No employed students found', paid_count: 0, total_paid: 0, total_tax: 0 });
        }
        // Calculate total salaries needed
        let totalGross = 0;
        let totalTax = 0;
        let totalNet = 0;
        const paymentDetails = [];
        for (const student of students) {
            const salary = parseFloat(student.salary) || 0;
            // Calculate tax if enabled
            let taxInfo = { taxRate: 0, taxAmount: 0, netAmount: salary };
            if (town.tax_enabled) {
                taxInfo = await calculateProgressiveTax(salary);
            }
            totalGross += salary;
            totalTax += taxInfo.taxAmount;
            totalNet += taxInfo.netAmount;
            paymentDetails.push({
                ...student,
                gross_salary: salary,
                tax_rate: taxInfo.taxRate,
                tax_amount: taxInfo.taxAmount,
                net_salary: taxInfo.netAmount
            });
        }
        // Check if treasury has enough funds (net amount since tax stays in treasury)
        if (parseFloat(town.treasury_balance) < totalNet) {
            return res.status(400).json({
                error: 'Insufficient treasury funds',
                required: totalNet,
                available: parseFloat(town.treasury_balance)
            });
        }
        // Start transaction
        const client = await database_prod_1.default.pool.connect();
        try {
            await client.query('BEGIN');
            let paidCount = 0;
            for (const payment of paymentDetails) {
                if (payment.account_id) {
                    // Pay net salary to student
                    await client.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [payment.net_salary, payment.account_id]);
                    // Record salary transaction
                    await client.query('INSERT INTO transactions (to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)', [payment.account_id, payment.net_salary, 'salary',
                        town.tax_enabled
                            ? `Salary for ${payment.job_name} (R${payment.gross_salary} - ${payment.tax_rate}% tax = R${payment.net_salary})`
                            : `Salary for ${payment.job_name}`
                    ]);
                    // Record tax transaction if tax was applied
                    if (town.tax_enabled && payment.tax_amount > 0) {
                        await client.query(`INSERT INTO tax_transactions 
                 (user_id, town_class, gross_amount, tax_amount, net_amount, tax_rate_applied, transaction_type, description)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [payment.id, townClass, payment.gross_salary, payment.tax_amount, payment.net_salary,
                            payment.tax_rate, 'salary', `Tax on salary for ${payment.job_name}`]);
                    }
                    paidCount++;
                }
            }
            // Deduct net salaries from treasury (tax stays in treasury)
            await client.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2', [totalNet, townClass]);
            // Record treasury transactions
            await client.query('INSERT INTO treasury_transactions (town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5)', [townClass, -totalNet, 'salary_payment', `Salary payments to ${paidCount} employees`, req.user?.id]);
            if (town.tax_enabled && totalTax > 0) {
                await client.query('INSERT INTO treasury_transactions (town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5)', [townClass, totalTax, 'tax_collection', `Income tax collected from ${paidCount} employees`, req.user?.id]);
            }
            await client.query('COMMIT');
            const updatedTown = await database_prod_1.default.get('SELECT * FROM town_settings WHERE class = $1', [townClass]);
            res.json({
                message: 'Salaries paid successfully',
                paid_count: paidCount,
                total_gross: totalGross,
                total_tax: totalTax,
                total_net: totalNet,
                treasury_balance: updatedTown.treasury_balance,
                payment_details: paymentDetails
            });
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Failed to pay salaries:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Pay basic salary to unemployed students from treasury (teachers only)
router.post('/pay-basic-salary/:class', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const { class: townClass } = req.params;
        const { amount } = req.body;
        if (!['6A', '6B', '6C'].includes(townClass)) {
            return res.status(400).json({ error: 'Invalid town class' });
        }
        // Get town settings
        const town = await database_prod_1.default.get('SELECT * FROM town_settings WHERE class = $1', [townClass]);
        if (!town) {
            return res.status(404).json({ error: 'Town not found' });
        }
        // Get basic salary from bank settings or use provided amount
        let basicSalary = amount;
        if (!basicSalary) {
            const setting = await database_prod_1.default.get('SELECT setting_value FROM bank_settings WHERE setting_key = $1', ['basic_salary_amount']);
            basicSalary = parseFloat(setting?.setting_value || '1500');
        }
        // Get unemployed students
        const students = await database_prod_1.default.query(`SELECT u.id, u.username, u.first_name, u.last_name, a.id as account_id
         FROM users u
         LEFT JOIN accounts a ON u.id = a.user_id
         WHERE u.role = 'student' AND u.class = $1 AND (u.job_id IS NULL OR u.job_id = 0)`, [townClass]);
        if (students.length === 0) {
            return res.json({ message: 'No unemployed students found', paid_count: 0, total_paid: 0 });
        }
        // Calculate total needed (basic salary has no tax)
        const totalNeeded = basicSalary * students.length;
        // Check treasury funds
        if (parseFloat(town.treasury_balance) < totalNeeded) {
            return res.status(400).json({
                error: 'Insufficient treasury funds',
                required: totalNeeded,
                available: parseFloat(town.treasury_balance)
            });
        }
        // Start transaction
        const client = await database_prod_1.default.pool.connect();
        try {
            await client.query('BEGIN');
            let paidCount = 0;
            for (const student of students) {
                if (student.account_id) {
                    await client.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [basicSalary, student.account_id]);
                    await client.query('INSERT INTO transactions (to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)', [student.account_id, basicSalary, 'salary', 'Basic salary (unemployed) - Tax exempt']);
                    paidCount++;
                }
            }
            // Deduct from treasury
            await client.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2', [totalNeeded, townClass]);
            // Record treasury transaction
            await client.query('INSERT INTO treasury_transactions (town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5)', [townClass, -totalNeeded, 'salary_payment', `Basic salary payments to ${paidCount} unemployed students`, req.user?.id]);
            await client.query('COMMIT');
            const updatedTown = await database_prod_1.default.get('SELECT * FROM town_settings WHERE class = $1', [townClass]);
            res.json({
                message: 'Basic salaries paid successfully',
                paid_count: paidCount,
                amount_per_student: basicSalary,
                total_paid: totalNeeded,
                treasury_balance: updatedTown.treasury_balance
            });
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Failed to pay basic salaries:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Toggle tax for a town (teachers only)
router.post('/toggle-tax/:class', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const { class: townClass } = req.params;
        const { enabled } = req.body;
        if (!['6A', '6B', '6C'].includes(townClass)) {
            return res.status(400).json({ error: 'Invalid town class' });
        }
        await database_prod_1.default.run('UPDATE town_settings SET tax_enabled = $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2', [enabled, townClass]);
        const town = await database_prod_1.default.get('SELECT * FROM town_settings WHERE class = $1', [townClass]);
        res.json({ message: `Tax ${enabled ? 'enabled' : 'disabled'} for ${townClass}`, town });
    }
    catch (error) {
        console.error('Failed to toggle tax:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=town.js.map