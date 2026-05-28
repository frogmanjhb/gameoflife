"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasActiveApprovedHealthInsurance = exports.classRequiresBrokerApproval = exports.getClassInsuranceBrokers = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const insurance_1 = require("../domain/insurance");
const router = (0, express_1.Router)();
const VALID_TYPES = insurance_1.VALID_INSURANCE_TYPES;
function mapPolicyWithActive(p, today) {
    const startStr = (0, insurance_1.toDateString)(p.week_start_date);
    const status = String(p.status || 'approved');
    const weeks = Number(p.weeks) || 0;
    return {
        ...p,
        active: (0, insurance_1.isPolicyEffectivelyActive)(status, startStr || null, weeks, today),
    };
}
async function getStudentSalary(userId) {
    const row = await database_prod_1.default.get(`SELECT (COALESCE(j.base_salary, 2000.00) * (1 + (COALESCE(u.job_level, 1) - 1) * 0.7222) * CASE WHEN COALESCE(j.is_contractual, false) THEN 1.5 ELSE 1.0 END) as salary
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.id = $1`, [userId]);
    return row ? parseFloat(row.salary) || 0 : 0;
}
async function getUserWithJob(userId) {
    return database_prod_1.default.get(`SELECT u.id, u.username, u.first_name, u.last_name, u.class, u.school_id, j.name AS job_name
     FROM users u
     LEFT JOIN jobs j ON j.id = u.job_id
     WHERE u.id = $1`, [userId]);
}
// GET /api/insurance/quote - Student: get cost for selected types and weeks (server computes 5%)
router.get('/quote', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can get insurance quotes' });
        }
        const salary = await getStudentSalary(req.user.id);
        const perTypePerWeek = Math.round(salary * insurance_1.INSURANCE_RATE * 100) / 100;
        const brokerRequired = await (0, insurance_1.classRequiresBrokerApproval)(req.user.school_id ?? null, req.user.class ?? null);
        res.json({
            salary,
            rate_percent: insurance_1.INSURANCE_RATE * 100,
            per_type_per_week: perTypePerWeek,
            types: VALID_TYPES,
            broker_required: brokerRequired,
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
        const policies = await database_prod_1.default.query(`SELECT id, insurance_type, weeks, total_cost, week_start_date, created_at, status,
              reviewed_at, denial_reason
       FROM insurance_purchases
       WHERE user_id = $1
       ORDER BY created_at DESC`, [req.user.id]);
        const today = (0, insurance_1.todayInSA)();
        res.json(policies.map((p) => mapPolicyWithActive(p, today)));
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
            return res.status(400).json({
                error: 'You need a job to buy insurance. Insurance cost is 5% of your salary per type per week.',
            });
        }
        const perTypePerWeek = salary * insurance_1.INSURANCE_RATE;
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
        const brokerRequired = await (0, insurance_1.classRequiresBrokerApproval)(req.user.school_id ?? null, req.user.class ?? null);
        const status = brokerRequired ? 'pending_broker' : 'approved';
        const weekStart = brokerRequired ? null : (0, insurance_1.todayInSA)();
        const schoolId = req.user.school_id ?? null;
        const townClass = req.user.class ?? null;
        const client = await database_prod_1.default.pool.connect();
        try {
            await client.query('BEGIN');
            const accountRow = await client.query('SELECT id, balance FROM accounts WHERE user_id = $1 FOR UPDATE', [
                req.user.id,
            ]);
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
            const txDesc = status === 'pending_broker'
                ? `Insurance request (pending broker): ${descParts} - R${totalCost.toFixed(2)}`
                : `Insurance: ${descParts} - R${totalCost.toFixed(2)}`;
            await client.query('INSERT INTO transactions (from_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)', [account.id, totalCost, 'insurance', txDesc]);
            for (const insuranceType of uniqueTypes) {
                const costForType = Math.round(perTypePerWeek * weeks * 100) / 100;
                await client.query(`INSERT INTO insurance_purchases
               (user_id, insurance_type, weeks, total_cost, week_start_date, status, town_class, school_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [req.user.id, insuranceType, weeks, costForType, weekStart, status, townClass, schoolId]);
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
            message: status === 'pending_broker'
                ? 'Insurance request submitted. Your town insurance broker must approve it before coverage starts.'
                : 'Insurance purchased successfully',
            total_cost: totalCost,
            types: uniqueTypes,
            weeks,
            week_start_date: weekStart,
            status,
            pending_broker: status === 'pending_broker',
        });
    }
    catch (error) {
        console.error('Insurance purchase error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/insurance/broker/pending - Insurance broker: pending requests in their town class
router.get('/broker/pending', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can access broker tools' });
        }
        const reviewer = await getUserWithJob(req.user.id);
        if (!reviewer || !(0, insurance_1.isInsuranceBrokerJob)(reviewer.job_name)) {
            return res.status(403).json({ error: 'Only the town insurance broker can review insurance requests' });
        }
        if (!reviewer.class) {
            return res.status(400).json({ error: 'You must belong to a town class to review insurance' });
        }
        const rows = await database_prod_1.default.query(`SELECT ip.id, ip.user_id, ip.insurance_type, ip.weeks, ip.total_cost, ip.created_at,
              u.username, u.first_name, u.last_name, u.class
       FROM insurance_purchases ip
       JOIN users u ON u.id = ip.user_id
       WHERE ip.status = 'pending_broker'
         AND ip.town_class = $1
         AND ip.school_id IS NOT DISTINCT FROM $2
         AND ip.user_id != $3
       ORDER BY ip.created_at ASC`, [reviewer.class, reviewer.school_id ?? null, req.user.id]);
        res.json(rows);
    }
    catch (error) {
        console.error('Insurance broker pending error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/insurance/broker/requests/:id/review - Insurance broker: approve or deny
router.put('/broker/requests/:id/review', auth_1.authenticateToken, tenant_1.requireTenant, (0, express_validator_1.body)('status').isIn(['approved', 'denied']), (0, express_validator_1.body)('denial_reason').optional().isString(), async (req, res) => {
    const client = await database_prod_1.default.pool.connect();
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can review insurance requests' });
        }
        const reviewer = await getUserWithJob(req.user.id);
        if (!reviewer || !(0, insurance_1.isInsuranceBrokerJob)(reviewer.job_name)) {
            return res.status(403).json({ error: 'Only the town insurance broker can review insurance requests' });
        }
        if (!reviewer.class) {
            return res.status(400).json({ error: 'You must belong to a town class to review insurance' });
        }
        const requestId = parseInt(String(req.params.id), 10);
        if (!requestId || Number.isNaN(requestId)) {
            return res.status(400).json({ error: 'Invalid request id' });
        }
        const { status, denial_reason: denialReason } = req.body;
        const purchase = await database_prod_1.default.get(`SELECT ip.*, u.username AS applicant_username
         FROM insurance_purchases ip
         JOIN users u ON u.id = ip.user_id
         WHERE ip.id = $1`, [requestId]);
        if (!purchase || String(purchase.status).toLowerCase() !== 'pending_broker') {
            return res.status(404).json({ error: 'Insurance request not found or already reviewed' });
        }
        if (purchase.town_class !== reviewer.class) {
            return res.status(403).json({ error: 'You can only review insurance for your town class' });
        }
        if ((purchase.school_id ?? null) !== (reviewer.school_id ?? null)) {
            return res.status(403).json({ error: 'You can only review insurance in your school' });
        }
        if (purchase.user_id === req.user.id) {
            return res.status(400).json({ error: 'You cannot approve your own insurance request' });
        }
        await client.query('BEGIN');
        if (status === 'approved') {
            const weekStart = (0, insurance_1.todayInSA)();
            await client.query(`UPDATE insurance_purchases
           SET status = 'approved',
               week_start_date = $1,
               reviewed_by = $2,
               reviewed_at = CURRENT_TIMESTAMP,
               denial_reason = NULL
           WHERE id = $3`, [weekStart, req.user.id, requestId]);
            await client.query('COMMIT');
            return res.json({
                success: true,
                status: 'approved',
                week_start_date: weekStart,
                applicant_username: purchase.applicant_username,
                insurance_type: purchase.insurance_type,
            });
        }
        const refundAmount = parseFloat(String(purchase.total_cost));
        const accountRow = await client.query('SELECT id, balance FROM accounts WHERE user_id = $1 FOR UPDATE', [purchase.user_id]);
        const account = accountRow.rows[0];
        if (!account) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Applicant account not found for refund' });
        }
        const newBalance = Math.round((parseFloat(account.balance) + refundAmount) * 100) / 100;
        await client.query('UPDATE accounts SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
            newBalance,
            account.id,
        ]);
        await client.query(`INSERT INTO transactions (to_account_id, amount, transaction_type, description)
         VALUES ($1, $2, 'insurance', $3)`, [
            account.id,
            refundAmount,
            `Insurance refund — ${purchase.insurance_type} request denied${denialReason ? `: ${denialReason}` : ''}`,
        ]);
        await client.query(`UPDATE insurance_purchases
         SET status = 'denied',
             reviewed_by = $1,
             reviewed_at = CURRENT_TIMESTAMP,
             denial_reason = $2
         WHERE id = $3`, [req.user.id, denialReason?.trim() || null, requestId]);
        await client.query('COMMIT');
        res.json({
            success: true,
            status: 'denied',
            refunded: refundAmount,
            applicant_username: purchase.applicant_username,
            insurance_type: purchase.insurance_type,
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Insurance broker review error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
// GET /api/insurance/purchases - Teacher: all purchases with filters
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
             ip.status, ip.reviewed_at, ip.denial_reason,
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
// GET /api/insurance/classes - Teacher: list classes that have insurance purchases
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
var insurance_2 = require("../domain/insurance");
Object.defineProperty(exports, "getClassInsuranceBrokers", { enumerable: true, get: function () { return insurance_2.getClassInsuranceBrokers; } });
Object.defineProperty(exports, "classRequiresBrokerApproval", { enumerable: true, get: function () { return insurance_2.classRequiresBrokerApproval; } });
Object.defineProperty(exports, "hasActiveApprovedHealthInsurance", { enumerable: true, get: function () { return insurance_2.hasActiveApprovedHealthInsurance; } });
exports.default = router;
//# sourceMappingURL=insurance.js.map