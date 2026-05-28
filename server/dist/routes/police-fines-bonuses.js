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
const lawyer_assignments_1 = require("../domain/lawyer-assignments");
const router = (0, express_1.Router)();
const LIST_SELECT = `
  r.*,
  s.username  AS submitted_by_username,
  s.first_name AS submitted_by_first_name,
  s.last_name  AS submitted_by_last_name,
  s.class      AS submitted_by_class,
  t.username   AS target_username,
  t.first_name AS target_first_name,
  t.last_name  AS target_last_name,
  t.class      AS target_class,
  rev.username AS reviewed_by_username,
  lrev.username AS lawyer_reviewed_by_username,
  lrev.first_name AS lawyer_reviewed_by_first_name,
  lrev.last_name AS lawyer_reviewed_by_last_name
`;
const LIST_JOINS = `
  FROM police_fine_bonus_requests r
  JOIN users s ON r.submitted_by_id = s.id
  JOIN users t ON r.target_user_id  = t.id
  LEFT JOIN users rev ON r.reviewed_by_id = rev.id
  LEFT JOIN users lrev ON r.lawyer_reviewed_by_id = lrev.id
`;
async function getPoliceStudent(userId) {
    return database_prod_1.default.get(`SELECT u.id, u.class, u.school_id, j.name as job_name
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.id = $1 AND u.role = 'student'`, [userId]);
}
async function getLawyerStudent(userId) {
    return database_prod_1.default.get(`SELECT u.id, u.class, u.school_id, j.name as job_name
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.id = $1 AND u.role = 'student'`, [userId]);
}
async function lawyerMayReviewRequest(lawyerUserId, targetUserId, townClass, schoolId) {
    if (!townClass)
        return false;
    const clientIds = await (0, lawyer_assignments_1.getLawyerClientIds)(lawyerUserId);
    return clientIds.includes(targetUserId);
}
function applyMoneyMove(pfr, account, approverName) {
    const amount = parseFloat(String(pfr.amount));
    const reason = pfr.description ? pfr.description.trim() : null;
    const fineDesc = reason
        ? `Police fine | ${reason} | Approved by ${approverName} (${pfr.teacher_initials})`
        : `Police fine | Approved by ${approverName} (${pfr.teacher_initials})`;
    const bonusDesc = reason
        ? `Police bonus | ${reason} | Approved by ${approverName} (${pfr.teacher_initials})`
        : `Police bonus | Approved by ${approverName} (${pfr.teacher_initials})`;
    if (pfr.type === 'fine') {
        return {
            balanceSql: 'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            balanceParams: [amount, account.id],
            txSql: `INSERT INTO transactions (from_account_id, amount, transaction_type, description) VALUES ($1, $2, 'fine', $3)`,
            txParams: [account.id, amount, fineDesc],
        };
    }
    return {
        balanceSql: 'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        balanceParams: [amount, account.id],
        txSql: `INSERT INTO transactions (to_account_id, amount, transaction_type, description) VALUES ($1, $2, 'deposit', $3)`,
        txParams: [account.id, amount, bonusDesc],
    };
}
// POST — police submits fine/bonus
router.post('/', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorised' });
        const studentRow = await getPoliceStudent(user.id);
        if (!studentRow || !(studentRow.job_name || '').toLowerCase().includes('police lieutenant')) {
            return res.status(403).json({ error: 'Only the Police Lieutenant may submit fines/bonuses' });
        }
        const { type, target_username, description, amount, teacher_initials } = req.body;
        if (!type || !['fine', 'bonus'].includes(type)) {
            return res.status(400).json({ error: 'type must be fine or bonus' });
        }
        if (!target_username)
            return res.status(400).json({ error: 'target_username is required' });
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'amount must be a positive number' });
        }
        if (!teacher_initials || !teacher_initials.trim()) {
            return res.status(400).json({ error: 'teacher_initials is required' });
        }
        const schoolId = req.schoolId ?? user.school_id ?? null;
        const target = schoolId != null
            ? await database_prod_1.default.get(`SELECT id, first_name, last_name, username, class FROM users WHERE username = $1 AND role = 'student' AND school_id = $2`, [target_username, schoolId])
            : await database_prod_1.default.get(`SELECT id, first_name, last_name, username, class FROM users WHERE username = $1 AND role = 'student'`, [target_username]);
        if (!target)
            return res.status(404).json({ error: 'Student not found' });
        const townClass = target.class || studentRow.class || null;
        const lawyerIds = townClass
            ? await (0, lawyer_assignments_1.getLawyerIdsForStudent)(target.id, townClass, schoolId)
            : [];
        const initialStatus = lawyerIds.length > 0 ? 'pending_lawyer' : 'pending_teacher';
        await database_prod_1.default.query(`INSERT INTO police_fine_bonus_requests
         (submitted_by_id, target_user_id, type, amount, description, teacher_initials, status, school_id, class)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
            user.id,
            target.id,
            type,
            parseFloat(amount),
            description || null,
            teacher_initials.trim().toUpperCase(),
            initialStatus,
            schoolId,
            townClass,
        ]);
        const msg = initialStatus === 'pending_lawyer'
            ? `${type === 'fine' ? 'Fine' : 'Bonus'} submitted for lawyer review, then teacher approval`
            : `${type === 'fine' ? 'Fine' : 'Bonus'} submitted for teacher approval (no lawyer assigned to this student)`;
        return res.status(201).json({ message: msg });
    }
    catch (err) {
        console.error('police-fines-bonuses POST error:', err);
        return res.status(500).json({ error: 'Failed to submit request' });
    }
});
router.get('/my-history', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorised' });
        const rows = await database_prod_1.default.query(`SELECT ${LIST_SELECT}
       ${LIST_JOINS}
       WHERE r.submitted_by_id = $1
       ORDER BY r.created_at DESC
       LIMIT 50`, [user.id]);
        return res.json(rows);
    }
    catch (err) {
        console.error('police-fines-bonuses my-history error:', err);
        return res.status(500).json({ error: 'Failed to fetch history' });
    }
});
// GET — lawyer queue
router.get('/lawyer-queue', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorised' });
        const lawyer = await getLawyerStudent(user.id);
        if (!lawyer || !(0, lawyer_assignments_1.hasLawyerJob)(lawyer.job_name)) {
            return res.status(403).json({ error: 'Only Lawyers can view this queue' });
        }
        const clientIds = await (0, lawyer_assignments_1.getLawyerClientIds)(user.id);
        if (!clientIds.length) {
            return res.json([]);
        }
        const rows = await database_prod_1.default.query(`SELECT ${LIST_SELECT}
       ${LIST_JOINS}
       WHERE r.status = 'pending_lawyer' AND r.target_user_id = ANY($1::int[])
       ORDER BY r.created_at ASC`, [clientIds]);
        return res.json(rows);
    }
    catch (err) {
        console.error('police-fines-bonuses lawyer-queue error:', err);
        return res.status(500).json({ error: 'Failed to fetch lawyer queue' });
    }
});
// GET — teacher (pending_teacher by default)
router.get('/', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorised' });
        const schoolId = req.schoolId ?? user.school_id ?? null;
        const status = req.query.status || 'pending_teacher';
        const rows = status === 'all'
            ? schoolId != null
                ? await database_prod_1.default.query(`SELECT ${LIST_SELECT} ${LIST_JOINS} WHERE r.school_id = $1 ORDER BY r.created_at DESC`, [schoolId])
                : await database_prod_1.default.query(`SELECT ${LIST_SELECT} ${LIST_JOINS} WHERE r.school_id IS NULL ORDER BY r.created_at DESC`)
            : schoolId != null
                ? await database_prod_1.default.query(`SELECT ${LIST_SELECT} ${LIST_JOINS} WHERE r.school_id = $1 AND r.status = $2 ORDER BY r.created_at DESC`, [schoolId, status])
                : await database_prod_1.default.query(`SELECT ${LIST_SELECT} ${LIST_JOINS} WHERE r.school_id IS NULL AND r.status = $1 ORDER BY r.created_at DESC`, [status]);
        return res.json(rows);
    }
    catch (err) {
        console.error('police-fines-bonuses GET error:', err);
        return res.status(500).json({ error: 'Failed to fetch requests' });
    }
});
router.post('/:id/lawyer-approve', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorised' });
        const lawyer = await getLawyerStudent(user.id);
        if (!lawyer || !(0, lawyer_assignments_1.hasLawyerJob)(lawyer.job_name)) {
            return res.status(403).json({ error: 'Only Lawyers can approve at this stage' });
        }
        const requestId = parseInt(req.params.id);
        if (isNaN(requestId))
            return res.status(400).json({ error: 'Invalid id' });
        const row = await database_prod_1.default.get('SELECT * FROM police_fine_bonus_requests WHERE id = $1', [requestId]);
        if (!row)
            return res.status(404).json({ error: 'Request not found' });
        if (row.status !== 'pending_lawyer') {
            return res.status(400).json({ error: `Request is not awaiting lawyer review (status: ${row.status})` });
        }
        const allowed = await lawyerMayReviewRequest(user.id, row.target_user_id, row.class, row.school_id);
        if (!allowed) {
            return res.status(403).json({ error: 'This client is not assigned to you' });
        }
        const lawyerNotes = req.body?.lawyer_notes?.trim() || null;
        await database_prod_1.default.query(`UPDATE police_fine_bonus_requests
         SET status = 'pending_teacher',
             lawyer_reviewed_by_id = $1,
             lawyer_reviewed_at = CURRENT_TIMESTAMP,
             lawyer_notes = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`, [user.id, lawyerNotes, requestId]);
        return res.json({ message: 'Sent to teacher for final approval' });
    }
    catch (err) {
        console.error('police-fines-bonuses lawyer-approve error:', err);
        return res.status(500).json({ error: 'Failed to approve request' });
    }
});
router.post('/:id/lawyer-deny', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorised' });
        const lawyer = await getLawyerStudent(user.id);
        if (!lawyer || !(0, lawyer_assignments_1.hasLawyerJob)(lawyer.job_name)) {
            return res.status(403).json({ error: 'Only Lawyers can deny at this stage' });
        }
        const requestId = parseInt(req.params.id);
        if (isNaN(requestId))
            return res.status(400).json({ error: 'Invalid id' });
        const row = await database_prod_1.default.get('SELECT * FROM police_fine_bonus_requests WHERE id = $1', [requestId]);
        if (!row)
            return res.status(404).json({ error: 'Request not found' });
        if (row.status !== 'pending_lawyer') {
            return res.status(400).json({ error: `Request is not awaiting lawyer review (status: ${row.status})` });
        }
        const allowed = await lawyerMayReviewRequest(user.id, row.target_user_id, row.class, row.school_id);
        if (!allowed) {
            return res.status(403).json({ error: 'This client is not assigned to you' });
        }
        const lawyerNotes = req.body?.lawyer_notes?.trim() || null;
        await database_prod_1.default.query(`UPDATE police_fine_bonus_requests
         SET status = 'denied',
             lawyer_reviewed_by_id = $1,
             lawyer_reviewed_at = CURRENT_TIMESTAMP,
             lawyer_notes = $2,
             reviewed_by_id = $1,
             reviewed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`, [user.id, lawyerNotes, requestId]);
        return res.json({ message: 'Request denied by lawyer' });
    }
    catch (err) {
        console.error('police-fines-bonuses lawyer-deny error:', err);
        return res.status(500).json({ error: 'Failed to deny request' });
    }
});
router.post('/:id/dispute', auth_1.authenticateToken, tenant_1.requireTenant, [
    (0, express_validator_1.body)('dispute_reason').trim().notEmpty().withMessage('dispute_reason is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorised' });
        const lawyer = await getLawyerStudent(user.id);
        if (!lawyer || !(0, lawyer_assignments_1.hasLawyerJob)(lawyer.job_name)) {
            return res.status(403).json({ error: 'Only Lawyers can dispute fines' });
        }
        const requestId = parseInt(req.params.id);
        if (isNaN(requestId))
            return res.status(400).json({ error: 'Invalid id' });
        const row = await database_prod_1.default.get('SELECT * FROM police_fine_bonus_requests WHERE id = $1', [requestId]);
        if (!row)
            return res.status(404).json({ error: 'Request not found' });
        if (row.type !== 'fine') {
            return res.status(400).json({ error: 'Only fines can be disputed' });
        }
        if (row.status !== 'pending_lawyer') {
            return res.status(400).json({ error: `Request is not awaiting lawyer review (status: ${row.status})` });
        }
        const allowed = await lawyerMayReviewRequest(user.id, row.target_user_id, row.class, row.school_id);
        if (!allowed) {
            return res.status(403).json({ error: 'This client is not assigned to you' });
        }
        const disputeReason = req.body.dispute_reason.trim();
        const lawyerNotes = req.body?.lawyer_notes?.trim() || null;
        await database_prod_1.default.query(`UPDATE police_fine_bonus_requests
         SET status = 'disputed',
             dispute_reason = $1,
             lawyer_notes = $2,
             lawyer_reviewed_by_id = $3,
             lawyer_disputed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`, [disputeReason, lawyerNotes, user.id, requestId]);
        return res.json({ message: 'Fine disputed — returned to Police for more evidence' });
    }
    catch (err) {
        console.error('police-fines-bonuses dispute error:', err);
        return res.status(500).json({ error: 'Failed to dispute request' });
    }
});
router.post('/:id/police-evidence', auth_1.authenticateToken, tenant_1.requireTenant, [
    (0, express_validator_1.body)('police_evidence_response').trim().notEmpty().withMessage('police_evidence_response is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorised' });
        const studentRow = await getPoliceStudent(user.id);
        if (!studentRow || !(studentRow.job_name || '').toLowerCase().includes('police lieutenant')) {
            return res.status(403).json({ error: 'Only the Police Lieutenant can submit evidence' });
        }
        const requestId = parseInt(req.params.id);
        if (isNaN(requestId))
            return res.status(400).json({ error: 'Invalid id' });
        const row = await database_prod_1.default.get('SELECT * FROM police_fine_bonus_requests WHERE id = $1', [requestId]);
        if (!row)
            return res.status(404).json({ error: 'Request not found' });
        if (row.submitted_by_id !== user.id) {
            return res.status(403).json({ error: 'You can only add evidence to your own fine requests' });
        }
        if (row.status !== 'disputed') {
            return res.status(400).json({ error: 'Request is not awaiting police evidence' });
        }
        const evidence = req.body.police_evidence_response.trim();
        await database_prod_1.default.query(`UPDATE police_fine_bonus_requests
         SET status = 'pending_lawyer',
             police_evidence_response = $1,
             police_evidence_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`, [evidence, requestId]);
        return res.json({ message: 'Evidence submitted — returned to lawyer for review' });
    }
    catch (err) {
        console.error('police-fines-bonuses police-evidence error:', err);
        return res.status(500).json({ error: 'Failed to submit evidence' });
    }
});
router.post('/:id/approve', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    const client = await database_prod_1.default.pool.connect();
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorised' });
        const requestId = parseInt(req.params.id);
        if (isNaN(requestId))
            return res.status(400).json({ error: 'Invalid id' });
        await client.query('BEGIN');
        const requestRow = await client.query('SELECT * FROM police_fine_bonus_requests WHERE id = $1 FOR UPDATE', [requestId]);
        if (requestRow.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Request not found' });
        }
        const pfr = requestRow.rows[0];
        if (pfr.status !== 'pending_teacher') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `Request is not awaiting teacher approval (status: ${pfr.status})` });
        }
        const targetAccount = await client.query('SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE', [pfr.target_user_id]);
        if (targetAccount.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Target student account not found' });
        }
        const account = targetAccount.rows[0];
        const teacherName = user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username;
        const move = applyMoneyMove(pfr, account, teacherName);
        await client.query(move.balanceSql, move.balanceParams);
        await client.query(move.txSql, move.txParams);
        await client.query(`UPDATE police_fine_bonus_requests
         SET status = 'approved', reviewed_by_id = $1, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`, [user.id, requestId]);
        await client.query('COMMIT');
        return res.json({ message: `${pfr.type === 'fine' ? 'Fine' : 'Bonus'} approved and applied` });
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('police-fines-bonuses approve error:', err);
        return res.status(500).json({ error: 'Failed to approve request' });
    }
    finally {
        client.release();
    }
});
router.post('/:id/deny', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorised' });
        const requestId = parseInt(req.params.id);
        if (isNaN(requestId))
            return res.status(400).json({ error: 'Invalid id' });
        const result = await database_prod_1.default.query(`UPDATE police_fine_bonus_requests
         SET status = 'denied', reviewed_by_id = $1, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND status = 'pending_teacher'
         RETURNING id`, [user.id, requestId]);
        if (result.length === 0) {
            return res.status(404).json({ error: 'Request not found or not awaiting teacher approval' });
        }
        return res.json({ message: 'Request denied' });
    }
    catch (err) {
        console.error('police-fines-bonuses deny error:', err);
        return res.status(500).json({ error: 'Failed to deny request' });
    }
});
exports.default = router;
//# sourceMappingURL=police-fines-bonuses.js.map