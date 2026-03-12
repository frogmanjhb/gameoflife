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
const INSURANCE_RATE = 0.05; // 5% of salary per type per week
const VALID_TYPES = ['health', 'cyber', 'property'];
const SA_TIMEZONE = 'Africa/Johannesburg';
function formatDate(date) {
    return date.toISOString().split('T')[0];
}
// Today's date in South Africa YYYY-MM-DD (for active-policy comparison and week start)
function todayInSA() {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: SA_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    const y = parts.find((p) => p.type === 'year').value;
    const m = parts.find((p) => p.type === 'month').value;
    const d = parts.find((p) => p.type === 'day').value;
    return `${y}-${m}-${d}`;
}
// Coverage starts on the purchase date (today in SA), not the Monday of the week.
// 1 week = 7 days from start: e.g. buy 22 Feb → coverage 22–28 Feb.
// Normalize a date from DB (Date or string) to YYYY-MM-DD
function toDateString(val) {
    if (val == null)
        return '';
    if (typeof val === 'string')
        return val.slice(0, 10);
    const d = new Date(val);
    if (isNaN(d.getTime()))
        return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
// Get student's weekly salary (from job; 0 if no job)
async function getStudentSalary(userId) {
    const row = await database_prod_1.default.get(`SELECT (COALESCE(j.base_salary, 2000.00) * (1 + (COALESCE(u.job_level, 1) - 1) * 0.7222) * CASE WHEN COALESCE(j.is_contractual, false) THEN 1.5 ELSE 1.0 END) as salary
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.id = $1`, [userId]);
    return row ? parseFloat(row.salary) || 0 : 0;
}
// GET /api/insurance/quote - Student: get cost for selected types and weeks (server computes 5%)
router.get('/quote', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can get insurance quotes' });
        }
        const salary = await getStudentSalary(req.user.id);
        const perTypePerWeek = Math.round((salary * INSURANCE_RATE) * 100) / 100;
        res.json({
            salary,
            rate_percent: INSURANCE_RATE * 100,
            per_type_per_week: perTypePerWeek,
            types: VALID_TYPES,
        });
    }
    catch (error) {
        console.error('Insurance quote error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/insurance/my-policies - Student: my purchases (active + history)
router.get('/my-policies', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can view their policies' });
        }
        const policies = await database_prod_1.default.query(`SELECT id, insurance_type, weeks, total_cost, week_start_date, created_at
       FROM insurance_purchases
       WHERE user_id = $1
       ORDER BY created_at DESC`, [req.user.id]);
        const today = todayInSA();
        const withActive = policies.map((p) => {
            const startStr = toDateString(p.week_start_date);
            if (!startStr)
                return { ...p, active: false };
            // N weeks = 7*N days; coverage runs from start through start + (weeks*7 - 1) days
            const [y, m, day] = startStr.split('-').map(Number);
            const startUTC = Date.UTC(y, m - 1, day);
            const endUTC = startUTC + (p.weeks * 7 - 1) * 24 * 60 * 60 * 1000;
            const end = formatDate(new Date(endUTC));
            return { ...p, active: today >= startStr && today <= end };
        });
        res.json(withActive);
    }
    catch (error) {
        console.error('My policies error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/insurance/purchase - Student: buy insurance (types + weeks)
router.post('/purchase', auth_1.authenticateToken, tenant_1.requireTenant, [
    (0, express_validator_1.body)('types').isArray().withMessage('types must be an array'),
    (0, express_validator_1.body)('types.*').isIn(VALID_TYPES).withMessage('Each type must be health, cyber, or property'),
    (0, express_validator_1.body)('weeks').isInt({ min: 1, max: 52 }).withMessage('weeks must be between 1 and 52'),
], async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can purchase insurance' });
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { types, weeks } = req.body;
        const uniqueTypes = [...new Set(types)];
        if (uniqueTypes.length === 0) {
            return res.status(400).json({ error: 'Select at least one insurance type' });
        }
        const salary = await getStudentSalary(req.user.id);
        if (salary <= 0) {
            return res.status(400).json({ error: 'You need a job to buy insurance. Insurance cost is 5% of your salary per type per week.' });
        }
        const perTypePerWeek = salary * INSURANCE_RATE;
        const totalCost = Math.round(uniqueTypes.length * perTypePerWeek * weeks * 100) / 100;
        if (totalCost <= 0) {
            return res.status(400).json({ error: 'Invalid cost calculation' });
        }
        const account = await database_prod_1.default.get('SELECT id, balance FROM accounts WHERE user_id = $1', [req.user.id]);
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        const balance = parseFloat(account.balance) || 0;
        if (balance < totalCost) {
            return res.status(400).json({
                error: `Insufficient balance. You need ${totalCost.toFixed(2)} but have ${balance.toFixed(2)}.`,
            });
        }
        const weekStart = todayInSA(); // coverage starts on purchase date (SA), lasts for N weeks from that day
        const client = await database_prod_1.default.pool.connect();
        try {
            await client.query('BEGIN');
            const accountRow = await client.query('SELECT id, balance FROM accounts WHERE user_id = $1 FOR UPDATE', [req.user.id]);
            const acc = accountRow.rows[0];
            if (!acc || parseFloat(acc.balance) < totalCost) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: `Insufficient balance. You need ${totalCost.toFixed(2)} but have ${balance.toFixed(2)}.`,
                });
            }
            const newBalance = Math.round((balance - totalCost) * 100) / 100;
            await client.query('UPDATE accounts SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
                newBalance,
                account.id,
            ]);
            const typeLabels = { health: 'Health', cyber: 'Cyber', property: 'Property' };
            const descParts = uniqueTypes.map((t) => `${typeLabels[t]} (${weeks} wk)`).join(', ');
            await client.query('INSERT INTO transactions (from_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)', [account.id, totalCost, 'insurance', `Insurance: ${descParts} - R${totalCost.toFixed(2)}`]);
            for (const insuranceType of uniqueTypes) {
                const costForType = Math.round(perTypePerWeek * weeks * 100) / 100;
                await client.query(`INSERT INTO insurance_purchases (user_id, insurance_type, weeks, total_cost, week_start_date) VALUES ($1, $2, $3, $4, $5)`, [req.user.id, insuranceType, weeks, costForType, weekStart]);
            }
            await client.query('COMMIT');
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        finally {
            client.release();
        }
        res.status(201).json({
            message: 'Insurance purchased successfully',
            total_cost: totalCost,
            types: uniqueTypes,
            weeks,
            week_start_date: weekStart,
        });
    }
    catch (error) {
        console.error('Insurance purchase error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/insurance/purchases - Teacher: all purchases with filters (view=class|insurance|school|individual, class?, type?, username?)
router.get('/purchases', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const schoolId = req.schoolId ?? req.user?.school_id ?? null;
        if (schoolId === null) {
            return res.status(403).json({ error: 'School context required' });
        }
        const classFilter = req.query.class;
        const typeFilter = req.query.type;
        const username = req.query.username;
        let sql = `
      SELECT ip.id, ip.user_id, ip.insurance_type, ip.weeks, ip.total_cost, ip.week_start_date, ip.created_at,
             u.username, u.first_name, u.last_name, u.class
      FROM insurance_purchases ip
      JOIN users u ON ip.user_id = u.id
      WHERE u.school_id = $1 AND u.role = 'student'
    `;
        const params = [schoolId];
        if (classFilter) {
            params.push(classFilter);
            sql += ` AND u.class = $${params.length}`;
        }
        if (typeFilter && VALID_TYPES.includes(typeFilter)) {
            params.push(typeFilter);
            sql += ` AND ip.insurance_type = $${params.length}`;
        }
        if (username) {
            params.push(username);
            sql += ` AND u.username = $${params.length}`;
        }
        sql += ' ORDER BY ip.created_at DESC';
        const rows = await database_prod_1.default.query(sql, params);
        res.json(rows);
    }
    catch (error) {
        console.error('Insurance purchases list error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/insurance/classes - Teacher: list classes that have insurance purchases (for filter dropdown)
router.get('/classes', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const schoolId = req.schoolId ?? req.user?.school_id ?? null;
        if (schoolId === null)
            return res.status(403).json({ error: 'School context required' });
        const rows = await database_prod_1.default.query(`SELECT DISTINCT u.class FROM insurance_purchases ip JOIN users u ON ip.user_id = u.id WHERE u.school_id = $1 AND u.class IS NOT NULL ORDER BY u.class`, [schoolId]);
        res.json(rows.map((r) => r.class));
    }
    catch (error) {
        console.error('Insurance classes error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=insurance.js.map