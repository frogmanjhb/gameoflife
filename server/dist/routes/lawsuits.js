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
const attendance_1 = require("../domain/attendance");
const lawsuits_1 = require("../domain/lawsuits");
const router = (0, express_1.Router)();
async function requireCourtEnabled(req, res) {
    const schoolId = req.schoolId ?? req.user?.school_id ?? null;
    if (!(await (0, lawsuits_1.isCourtPluginEnabled)(schoolId))) {
        res.status(403).json({ error: 'Court plugin is not enabled for your school' });
        return false;
    }
    if (!(await (0, lawsuits_1.tablesReady)())) {
        res.status(503).json({ error: 'Court system is not available yet' });
        return false;
    }
    return true;
}
async function enrichCase(row) {
    const jury = await database_prod_1.default.query('SELECT vote, voted_at FROM lawsuit_jury_assignments WHERE lawsuit_id = $1 ORDER BY id', [row.id]);
    const townHasHr = await (0, attendance_1.townHasHrDirector)(row.school_id, row.town_class);
    return {
        ...row,
        proceedings_timeline: (0, lawsuits_1.buildProceedingsTimeline)(row, jury),
        teacher_hr_required: row.status === 'pending_hr' && !townHasHr,
    };
}
async function getCaseById(id) {
    return database_prod_1.default.get(`SELECT ${lawsuits_1.LAWSUIT_LIST_SELECT} ${lawsuits_1.LAWSUIT_LIST_JOINS} WHERE sl.id = $1`, [id]);
}
// POST — file lawsuit
router.post('/', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        if (!(await requireCourtEnabled(req, res)))
            return;
        const user = req.user;
        if (!user || user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can file lawsuits' });
        }
        const dbUser = await database_prod_1.default.get('SELECT rules_agreed_at FROM users WHERE id = $1', [user.id]);
        if (!dbUser?.rules_agreed_at) {
            return res.status(403).json({ error: 'You must agree to town rules before using Court' });
        }
        if (!(0, lawsuits_1.isValidTownClassForLawsuit)(user.class)) {
            return res.status(400).json({ error: 'Invalid town class' });
        }
        const { defendant_username, claim_amount, description, rule_reference, linked_action_type, linked_action_id } = req.body;
        if (!defendant_username?.trim()) {
            return res.status(400).json({ error: 'defendant_username is required' });
        }
        const amount = parseFloat(String(claim_amount));
        if (!amount || amount <= 0 || amount > lawsuits_1.LAWSUIT_CLAIM_CAP) {
            return res.status(400).json({ error: `claim_amount must be between 0 and R${lawsuits_1.LAWSUIT_CLAIM_CAP}` });
        }
        if (!description?.trim())
            return res.status(400).json({ error: 'description is required' });
        if (!rule_reference?.trim())
            return res.status(400).json({ error: 'rule_reference is required' });
        const canTransact = await (0, lawsuits_1.checkStudentCanTransact)(user.id);
        if (!canTransact.canTransact) {
            return res.status(400).json({ error: canTransact.reason });
        }
        const balance = await (0, lawsuits_1.getStudentBalance)(user.id);
        if (balance < lawsuits_1.LAWSUIT_PROCESS_COST) {
            return res.status(400).json({
                error: `You need at least R${lawsuits_1.LAWSUIT_PROCESS_COST.toLocaleString()} in your account to file a lawsuit`,
            });
        }
        const schoolId = req.schoolId ?? user.school_id ?? null;
        const defendant = await database_prod_1.default.get(`SELECT id, username, class FROM users
       WHERE username = $1 AND role = 'student' AND school_id IS NOT DISTINCT FROM $2`, [defendant_username.trim(), schoolId]);
        if (!defendant)
            return res.status(404).json({ error: 'Defendant not found' });
        if (defendant.id === user.id)
            return res.status(400).json({ error: 'You cannot sue yourself' });
        if (defendant.class !== user.class) {
            return res.status(400).json({ error: 'Defendant must be in your town class' });
        }
        const openCase = await database_prod_1.default.get(`SELECT id FROM student_lawsuits
       WHERE plaintiff_user_id = $1 AND defendant_user_id = $2
         AND status NOT IN ('approved', 'denied', 'withdrawn', 'resolved_mediation')`, [user.id, defendant.id]);
        if (openCase) {
            return res.status(400).json({ error: 'You already have an open case against this student' });
        }
        let linkedType = null;
        let linkedId = null;
        if (linked_action_type && linked_action_id) {
            const type = linked_action_type;
            const actionId = parseInt(String(linked_action_id), 10);
            if (!['police_fine_bonus', 'cyber_attack', 'doctor_illness', 'land_sale'].includes(type) ||
                !actionId) {
                return res.status(400).json({ error: 'Invalid linked action' });
            }
            const valid = await (0, lawsuits_1.validateLinkedAction)(type, actionId, user.id, defendant.id, schoolId, user.class);
            if (!valid)
                return res.status(400).json({ error: 'Linked action not found or not related to this dispute' });
            linkedType = type;
            linkedId = actionId;
        }
        const result = await database_prod_1.default.query(`INSERT INTO student_lawsuits (
         school_id, town_class, plaintiff_user_id, defendant_user_id,
         claim_amount, description, rule_reference,
         linked_action_type, linked_action_id, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending_hr')
       RETURNING id`, [schoolId, user.class, user.id, defendant.id, amount, description.trim(), rule_reference.trim(), linkedType, linkedId]);
        const created = await getCaseById(result[0].id);
        return res.status(201).json(await enrichCase(created));
    }
    catch (err) {
        console.error('lawsuits POST error:', err);
        return res.status(500).json({ error: 'Failed to file lawsuit' });
    }
});
router.get('/linkable-actions', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        if (!(await requireCourtEnabled(req, res)))
            return;
        const user = req.user;
        if (!user || user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can list linkable actions' });
        }
        const defendantUsername = String(req.query.defendant_username || '').trim();
        if (!defendantUsername) {
            return res.status(400).json({ error: 'defendant_username query param is required' });
        }
        const schoolId = req.schoolId ?? user.school_id ?? null;
        const defendant = await database_prod_1.default.get(`SELECT id FROM users WHERE username = $1 AND role = 'student' AND school_id IS NOT DISTINCT FROM $2`, [defendantUsername, schoolId]);
        if (!defendant)
            return res.status(404).json({ error: 'Defendant not found' });
        const townClass = user.class || '';
        const actions = await (0, lawsuits_1.getLinkableActions)(user.id, defendant.id, schoolId, townClass);
        return res.json({ actions });
    }
    catch (err) {
        console.error('lawsuits linkable-actions error:', err);
        return res.status(500).json({ error: 'Failed to fetch linkable actions' });
    }
});
router.get('/my-cases', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        if (!(await requireCourtEnabled(req, res)))
            return;
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorised' });
        const scope = req.query.scope === 'past' ? 'past' : 'current';
        const statusFilter = scope === 'past'
            ? `sl.status IN (${lawsuits_1.TERMINAL_STATUSES.map((s) => `'${s}'`).join(',')})`
            : `sl.status NOT IN (${lawsuits_1.TERMINAL_STATUSES.map((s) => `'${s}'`).join(',')})`;
        const rows = await database_prod_1.default.query(`SELECT ${lawsuits_1.LAWSUIT_LIST_SELECT} ${lawsuits_1.LAWSUIT_LIST_JOINS}
       WHERE (${statusFilter})
         AND (
           sl.plaintiff_user_id = $1 OR sl.defendant_user_id = $1
           OR sl.id IN (SELECT lawsuit_id FROM lawsuit_jury_assignments WHERE juror_user_id = $1)
         )
       ORDER BY sl.updated_at DESC
       LIMIT 100`, [user.id]);
        const enriched = await Promise.all(rows.map((r) => enrichCase(r)));
        return res.json(enriched);
    }
    catch (err) {
        console.error('lawsuits my-cases error:', err);
        return res.status(500).json({ error: 'Failed to fetch cases' });
    }
});
router.get('/school-cases', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        if (!(await requireCourtEnabled(req, res)))
            return;
        const schoolId = req.schoolId ?? req.user?.school_id ?? null;
        const scope = req.query.scope === 'past' ? 'past' : 'current';
        const townClass = req.query.town_class;
        const statusFilter = scope === 'past'
            ? `sl.status IN (${lawsuits_1.TERMINAL_STATUSES.map((s) => `'${s}'`).join(',')})`
            : `sl.status NOT IN (${lawsuits_1.TERMINAL_STATUSES.map((s) => `'${s}'`).join(',')})`;
        const params = [schoolId];
        let townFilter = '';
        if (townClass && ['6A', '6B', '6C'].includes(townClass)) {
            townFilter = ' AND sl.town_class = $2';
            params.push(townClass);
        }
        const rows = await database_prod_1.default.query(`SELECT ${lawsuits_1.LAWSUIT_LIST_SELECT} ${lawsuits_1.LAWSUIT_LIST_JOINS}
       WHERE sl.school_id IS NOT DISTINCT FROM $1 AND ${statusFilter}${townFilter}
       ORDER BY sl.updated_at DESC
       LIMIT 200`, params);
        const enriched = await Promise.all(rows.map((r) => enrichCase(r)));
        return res.json(enriched);
    }
    catch (err) {
        console.error('lawsuits school-cases error:', err);
        return res.status(500).json({ error: 'Failed to fetch school cases' });
    }
});
router.get('/hr-queue', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        if (!(await requireCourtEnabled(req, res)))
            return;
        const user = req.user;
        if (!user || user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can access HR queue' });
        }
        const student = await database_prod_1.default.get(`SELECT u.*, j.name AS job_name FROM users u LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`, [user.id]);
        if (!(0, attendance_1.hasHrDirectorJob)(student?.job_name)) {
            return res.status(403).json({ error: 'Only HR Director can access mediation queue' });
        }
        const schoolId = req.schoolId ?? user.school_id ?? null;
        const rows = await database_prod_1.default.query(`SELECT ${lawsuits_1.LAWSUIT_LIST_SELECT} ${lawsuits_1.LAWSUIT_LIST_JOINS}
       WHERE sl.status = 'pending_hr' AND sl.school_id IS NOT DISTINCT FROM $1 AND sl.town_class = $2
       ORDER BY sl.created_at ASC`, [schoolId, student.class]);
        return res.json(rows);
    }
    catch (err) {
        console.error('lawsuits hr-queue error:', err);
        return res.status(500).json({ error: 'Failed to fetch HR queue' });
    }
});
router.get('/lawyer-queue', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        if (!(await requireCourtEnabled(req, res)))
            return;
        const user = req.user;
        if (!user || user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can access lawyer queue' });
        }
        const student = await database_prod_1.default.get(`SELECT u.*, j.name AS job_name FROM users u LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`, [user.id]);
        if (!(0, lawyer_assignments_1.hasLawyerJob)(student?.job_name)) {
            return res.status(403).json({ error: 'Only Lawyers can access lawsuit queue' });
        }
        const clientIds = await (0, lawyer_assignments_1.getLawyerClientIds)(user.id);
        if (!clientIds.length)
            return res.json({ plaintiff_clients: [], defendant_clients: [] });
        const placeholders = clientIds.map((_, i) => `$${i + 2}`).join(', ');
        const params = [user.id, ...clientIds];
        const plaintiffCases = await database_prod_1.default.query(`SELECT ${lawsuits_1.LAWSUIT_LIST_SELECT} ${lawsuits_1.LAWSUIT_LIST_JOINS}
       WHERE sl.status = 'pending_lawyer' AND sl.plaintiff_user_id IN (${placeholders})
         AND sl.plaintiff_lawyer_id = $1
       ORDER BY sl.created_at ASC`, params);
        const defendantCases = await database_prod_1.default.query(`SELECT ${lawsuits_1.LAWSUIT_LIST_SELECT} ${lawsuits_1.LAWSUIT_LIST_JOINS}
       WHERE sl.status = 'pending_lawyer' AND sl.defendant_user_id IN (${placeholders})
         AND sl.defendant_lawyer_id = $1
         AND sl.lawyer_conflict = false
       ORDER BY sl.created_at ASC`, params);
        return res.json({ plaintiff_clients: plaintiffCases, defendant_clients: defendantCases });
    }
    catch (err) {
        console.error('lawsuits lawyer-queue error:', err);
        return res.status(500).json({ error: 'Failed to fetch lawyer queue' });
    }
});
router.get('/jury-duty', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        if (!(await requireCourtEnabled(req, res)))
            return;
        const user = req.user;
        if (!user || user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can access jury duty' });
        }
        const rows = await database_prod_1.default.query(`SELECT ${lawsuits_1.LAWSUIT_LIST_SELECT}, ja.vote AS my_vote, ja.voted_at AS my_voted_at
       ${lawsuits_1.LAWSUIT_LIST_JOINS}
       JOIN lawsuit_jury_assignments ja ON ja.lawsuit_id = sl.id AND ja.juror_user_id = $1
       WHERE sl.status = 'pending_jury'
       ORDER BY sl.jury_seated_at ASC`, [user.id]);
        return res.json(rows);
    }
    catch (err) {
        console.error('lawsuits jury-duty error:', err);
        return res.status(500).json({ error: 'Failed to fetch jury duty' });
    }
});
router.get('/', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        if (!(await requireCourtEnabled(req, res)))
            return;
        const schoolId = req.schoolId ?? req.user?.school_id ?? null;
        const status = req.query.status;
        let statusClause = '';
        const params = [schoolId];
        if (status === 'pending_teacher') {
            statusClause = " AND sl.status = 'pending_teacher'";
        }
        const rows = await database_prod_1.default.query(`SELECT ${lawsuits_1.LAWSUIT_LIST_SELECT} ${lawsuits_1.LAWSUIT_LIST_JOINS}
       WHERE sl.school_id IS NOT DISTINCT FROM $1${statusClause}
       ORDER BY sl.updated_at DESC
       LIMIT 200`, params);
        const enriched = await Promise.all(rows.map((r) => enrichCase(r)));
        return res.json(enriched);
    }
    catch (err) {
        console.error('lawsuits GET error:', err);
        return res.status(500).json({ error: 'Failed to fetch lawsuits' });
    }
});
router.get('/:id/jury-packet', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        if (!(await requireCourtEnabled(req, res)))
            return;
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorised' });
        const lawsuitId = parseInt(String(req.params.id), 10);
        const assignment = await database_prod_1.default.get('SELECT 1 FROM lawsuit_jury_assignments WHERE lawsuit_id = $1 AND juror_user_id = $2', [lawsuitId, user.id]);
        if (!assignment)
            return res.status(403).json({ error: 'You are not on this jury' });
        const row = await getCaseById(lawsuitId);
        if (!row)
            return res.status(404).json({ error: 'Case not found' });
        return res.json({
            claim: row.description,
            rule_reference: row.rule_reference,
            claim_amount: row.claim_amount,
            defendant_response: row.defendant_response,
            hr_notes: row.hr_notes,
            plaintiff_lawyer_notes: row.plaintiff_lawyer_notes,
            plaintiff_lawyer_opinion: row.plaintiff_lawyer_opinion,
            defendant_lawyer_notes: row.defendant_lawyer_notes,
            defendant_lawyer_opinion: row.defendant_lawyer_opinion,
            linked_action_type: row.linked_action_type,
            linked_action_id: row.linked_action_id,
            plaintiff_username: row.plaintiff_username,
            defendant_username: row.defendant_username,
        });
    }
    catch (err) {
        console.error('lawsuits jury-packet error:', err);
        return res.status(500).json({ error: 'Failed to fetch jury packet' });
    }
});
router.get('/:id', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        if (!(await requireCourtEnabled(req, res)))
            return;
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorised' });
        const lawsuitId = parseInt(String(req.params.id), 10);
        const row = await getCaseById(lawsuitId);
        if (!row)
            return res.status(404).json({ error: 'Case not found' });
        const schoolId = req.schoolId ?? user.school_id ?? null;
        if (row.school_id !== schoolId && user.role !== 'teacher' && user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (user.role === 'student') {
            const onJury = await database_prod_1.default.get('SELECT 1 FROM lawsuit_jury_assignments WHERE lawsuit_id = $1 AND juror_user_id = $2', [lawsuitId, user.id]);
            const involved = row.plaintiff_user_id === user.id ||
                row.defendant_user_id === user.id ||
                !!onJury;
            if (!involved)
                return res.status(403).json({ error: 'Access denied' });
        }
        return res.json(await enrichCase(row));
    }
    catch (err) {
        console.error('lawsuits GET :id error:', err);
        return res.status(500).json({ error: 'Failed to fetch case' });
    }
});
router.post('/:id/withdraw', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        if (!(await requireCourtEnabled(req, res)))
            return;
        const user = req.user;
        const lawsuitId = parseInt(String(req.params.id), 10);
        const row = await database_prod_1.default.get('SELECT * FROM student_lawsuits WHERE id = $1', [lawsuitId]);
        if (!row)
            return res.status(404).json({ error: 'Case not found' });
        if (row.plaintiff_user_id !== user?.id) {
            return res.status(403).json({ error: 'Only the plaintiff can withdraw' });
        }
        if (row.status !== 'pending_hr') {
            return res.status(400).json({ error: 'Can only withdraw during HR mediation' });
        }
        await database_prod_1.default.query(`UPDATE student_lawsuits SET status = 'withdrawn', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [lawsuitId]);
        await (0, lawsuits_1.refundEscrowIfHeld)(lawsuitId);
        return res.json({ message: 'Case withdrawn' });
    }
    catch (err) {
        console.error('lawsuits withdraw error:', err);
        return res.status(500).json({ error: 'Failed to withdraw case' });
    }
});
router.post('/:id/defendant-response', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        if (!(await requireCourtEnabled(req, res)))
            return;
        const user = req.user;
        const response = String(req.body.response || '').trim();
        if (!response)
            return res.status(400).json({ error: 'response is required' });
        const lawsuitId = parseInt(String(req.params.id), 10);
        const row = await database_prod_1.default.get('SELECT * FROM student_lawsuits WHERE id = $1', [lawsuitId]);
        if (!row)
            return res.status(404).json({ error: 'Case not found' });
        if (row.defendant_user_id !== user?.id) {
            return res.status(403).json({ error: 'Only the defendant can respond' });
        }
        if (!['pending_hr', 'pending_lawyer'].includes(row.status)) {
            return res.status(400).json({ error: 'Cannot respond at this stage' });
        }
        await database_prod_1.default.query('UPDATE student_lawsuits SET defendant_response = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [response, lawsuitId]);
        return res.json({ message: 'Response submitted' });
    }
    catch (err) {
        console.error('lawsuits defendant-response error:', err);
        return res.status(500).json({ error: 'Failed to submit response' });
    }
});
router.post('/:id/hr-review', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        if (!(await requireCourtEnabled(req, res)))
            return;
        const user = req.user;
        const isTeacher = user?.role === 'teacher' || user?.role === 'super_admin';
        const student = isTeacher
            ? null
            : await database_prod_1.default.get(`SELECT u.*, j.name AS job_name FROM users u LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`, [user?.id]);
        if (!isTeacher && !(0, attendance_1.hasHrDirectorJob)(student?.job_name)) {
            return res.status(403).json({ error: 'Only HR Director can mediate' });
        }
        const lawsuitId = parseInt(String(req.params.id), 10);
        const { outcome, hr_notes, hr_recommended_amount, plaintiff_consents_settlement, defendant_consents_settlement } = req.body;
        const validOutcomes = ['resolved_no_damages', 'settlement_recommended', 'escalated'];
        if (!validOutcomes.includes(outcome)) {
            return res.status(400).json({ error: 'Invalid HR outcome' });
        }
        if (!hr_notes?.trim())
            return res.status(400).json({ error: 'hr_notes is required' });
        const row = await database_prod_1.default.get('SELECT * FROM student_lawsuits WHERE id = $1', [lawsuitId]);
        if (!row || row.status !== 'pending_hr') {
            return res.status(400).json({ error: 'Case is not pending HR mediation' });
        }
        if (isTeacher) {
            const schoolId = req.schoolId ?? user?.school_id ?? null;
            if (row.school_id !== schoolId && user?.role !== 'super_admin') {
                return res.status(403).json({ error: 'Case is not in your school' });
            }
            if (await (0, attendance_1.townHasHrDirector)(row.school_id, row.town_class)) {
                return res.status(403).json({ error: 'This town has an HR Director — student HR handles mediation' });
            }
        }
        else if (row.town_class !== student?.class) {
            return res.status(403).json({ error: 'Case is not in your town class' });
        }
        let newStatus = 'pending_lawyer';
        if (outcome === 'resolved_no_damages') {
            newStatus = 'resolved_mediation';
        }
        else if (outcome === 'settlement_recommended') {
            if (!plaintiff_consents_settlement || !defendant_consents_settlement) {
                return res.status(400).json({ error: 'Both parties must consent to settlement' });
            }
            const recAmount = parseFloat(String(hr_recommended_amount));
            if (!recAmount || recAmount <= 0) {
                return res.status(400).json({ error: 'hr_recommended_amount is required for settlement' });
            }
            newStatus = 'pending_teacher';
        }
        const lawyerSetup = outcome === 'escalated'
            ? await (0, lawsuits_1.resolveLawyerSetup)(row.plaintiff_user_id, row.defendant_user_id, row.town_class, row.school_id)
            : null;
        await database_prod_1.default.query(`UPDATE student_lawsuits SET
         status = $1,
         hr_reviewer_id = $2,
         hr_reviewed_at = CURRENT_TIMESTAMP,
         hr_notes = $3,
         hr_outcome = $4,
         hr_recommended_amount = $5,
         plaintiff_consents_settlement = $6,
         defendant_consents_settlement = $7,
         plaintiff_lawyer_id = $8,
         defendant_lawyer_id = $9,
         lawyer_conflict = $10,
         plaintiff_lawyer_acceptance = $11,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $12`, [
            newStatus,
            user.id,
            hr_notes.trim(),
            outcome,
            outcome === 'settlement_recommended' ? parseFloat(String(hr_recommended_amount)) : null,
            !!plaintiff_consents_settlement,
            !!defendant_consents_settlement,
            lawyerSetup?.plaintiffLawyerId ?? null,
            lawyerSetup?.defendantLawyerId ?? null,
            lawyerSetup?.lawyerConflict ?? false,
            lawyerSetup?.plaintiffAcceptance ?? 'not_required',
            lawsuitId,
        ]);
        if (outcome === 'resolved_no_damages') {
            await (0, lawsuits_1.refundEscrowIfHeld)(lawsuitId);
        }
        const xp = isTeacher ? null : await (0, lawsuits_1.awardJobXp)(user.id, lawsuits_1.HR_MEDIATION_XP);
        return res.json({
            message: 'HR review recorded',
            experience_points: xp?.experience_points,
            new_level: xp?.new_level,
        });
    }
    catch (err) {
        console.error('lawsuits hr-review error:', err);
        return res.status(500).json({ error: 'Failed to record HR review' });
    }
});
router.post('/:id/lawyer-accept', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        if (!(await requireCourtEnabled(req, res)))
            return;
        const user = req.user;
        const lawsuitId = parseInt(String(req.params.id), 10);
        try {
            await (0, lawsuits_1.holdEscrow)(lawsuitId, user.id);
        }
        catch (e) {
            return res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to accept case' });
        }
        return res.json({ message: 'Case accepted — R10,000 held in escrow' });
    }
    catch (err) {
        console.error('lawsuits lawyer-accept error:', err);
        return res.status(500).json({ error: 'Failed to accept case' });
    }
});
router.post('/:id/lawyer-decline', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        if (!(await requireCourtEnabled(req, res)))
            return;
        const user = req.user;
        const lawsuitId = parseInt(String(req.params.id), 10);
        const row = await database_prod_1.default.get('SELECT * FROM student_lawsuits WHERE id = $1', [lawsuitId]);
        if (!row || row.status !== 'pending_lawyer') {
            return res.status(400).json({ error: 'Case is not in lawyer review' });
        }
        if (row.plaintiff_lawyer_id !== user?.id) {
            return res.status(403).json({ error: 'You are not the plaintiff assigned lawyer' });
        }
        await database_prod_1.default.query(`UPDATE student_lawsuits SET
         plaintiff_lawyer_acceptance = 'declined',
         plaintiff_lawyer_declined_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`, [lawsuitId]);
        await (0, lawsuits_1.tryAdvanceToJury)(lawsuitId);
        return res.json({ message: 'Case declined' });
    }
    catch (err) {
        console.error('lawsuits lawyer-decline error:', err);
        return res.status(500).json({ error: 'Failed to decline case' });
    }
});
router.post('/:id/lawyer-opinion', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        if (!(await requireCourtEnabled(req, res)))
            return;
        const user = req.user;
        const lawsuitId = parseInt(String(req.params.id), 10);
        const { opinion, legal_notes } = req.body;
        if (!lawsuits_1.LAWYER_OPINIONS.includes(opinion)) {
            return res.status(400).json({ error: 'Invalid opinion' });
        }
        if (!legal_notes?.trim())
            return res.status(400).json({ error: 'legal_notes is required' });
        const row = await database_prod_1.default.get('SELECT * FROM student_lawsuits WHERE id = $1', [lawsuitId]);
        if (!row || row.status !== 'pending_lawyer') {
            return res.status(400).json({ error: 'Case is not in lawyer review' });
        }
        const isPlaintiffLawyer = row.plaintiff_lawyer_id === user?.id;
        const isDefendantLawyer = row.defendant_lawyer_id === user?.id;
        if (!isPlaintiffLawyer && !isDefendantLawyer) {
            return res.status(403).json({ error: 'You are not assigned to this case' });
        }
        let xpResult = {};
        if (isPlaintiffLawyer && !row.plaintiff_lawyer_reviewed_at) {
            if (row.plaintiff_lawyer_acceptance !== 'accepted') {
                return res.status(400).json({ error: 'You must accept the case before submitting an opinion' });
            }
            await database_prod_1.default.query(`UPDATE student_lawsuits SET
           plaintiff_lawyer_opinion = $1,
           plaintiff_lawyer_notes = $2,
           plaintiff_lawyer_reviewed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`, [opinion, legal_notes.trim(), lawsuitId]);
        }
        else if (isDefendantLawyer && !row.defendant_lawyer_reviewed_at) {
            await database_prod_1.default.query(`UPDATE student_lawsuits SET
           defendant_lawyer_opinion = $1,
           defendant_lawyer_notes = $2,
           defendant_lawyer_reviewed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`, [opinion, legal_notes.trim(), lawsuitId]);
            try {
                xpResult = await (0, lawsuits_1.payDefenseLawyerParticipation)(lawsuitId, user.id);
            }
            catch (e) {
                return res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to pay defense fee' });
            }
        }
        else {
            return res.status(400).json({ error: 'No pending legal opinion for you on this case' });
        }
        await (0, lawsuits_1.tryAdvanceToJury)(lawsuitId);
        return res.json({
            message: 'Legal opinion submitted',
            experience_points: xpResult.experience_points,
            new_level: xpResult.new_level,
            defense_xp: lawsuits_1.DEFENSE_LAWYER_XP,
        });
    }
    catch (err) {
        console.error('lawsuits lawyer-opinion error:', err);
        return res.status(500).json({ error: 'Failed to submit opinion' });
    }
});
router.post('/:id/jury-vote', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    try {
        if (!(await requireCourtEnabled(req, res)))
            return;
        const user = req.user;
        const lawsuitId = parseInt(String(req.params.id), 10);
        const vote = req.body.vote;
        if (vote !== 'guilty' && vote !== 'not_guilty') {
            return res.status(400).json({ error: 'vote must be guilty or not_guilty' });
        }
        try {
            const result = await (0, lawsuits_1.recordJuryVote)(lawsuitId, user.id, vote);
            return res.json({
                message: result.jury_complete ? 'Vote recorded — jury verdict complete' : 'Vote recorded',
                jury_complete: result.jury_complete,
                experience_points: result.experience_points,
                new_level: result.new_level,
            });
        }
        catch (e) {
            return res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to record vote' });
        }
    }
    catch (err) {
        console.error('lawsuits jury-vote error:', err);
        return res.status(500).json({ error: 'Failed to record vote' });
    }
});
router.post('/:id/approve', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), [
    (0, express_validator_1.body)('awarded_amount').isFloat({ min: 0 }).withMessage('awarded_amount required'),
    (0, express_validator_1.body)('teacher_initials').trim().notEmpty().withMessage('teacher_initials required'),
], async (req, res) => {
    try {
        if (!(await requireCourtEnabled(req, res)))
            return;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty())
            return res.status(400).json({ errors: errors.array() });
        const lawsuitId = parseInt(String(req.params.id), 10);
        const awardedAmount = parseFloat(String(req.body.awarded_amount));
        const teacherInitials = String(req.body.teacher_initials).trim().toUpperCase();
        const teacherNotes = req.body.teacher_notes?.trim() || null;
        const client = await database_prod_1.default.pool.connect();
        try {
            await client.query('BEGIN');
            const resRow = await client.query('SELECT * FROM student_lawsuits WHERE id = $1 FOR UPDATE', [lawsuitId]);
            const lawsuit = resRow.rows[0];
            if (!lawsuit || lawsuit.status !== 'pending_teacher') {
                throw new Error('Case is not pending teacher review');
            }
            if (awardedAmount > parseFloat(String(lawsuit.claim_amount))) {
                throw new Error('Award cannot exceed claim amount');
            }
            const schoolId = req.schoolId ?? req.user?.school_id ?? null;
            if (lawsuit.school_id !== schoolId)
                throw new Error('School mismatch');
            if (awardedAmount > 0) {
                const defAcct = await client.query('SELECT id, balance FROM accounts WHERE user_id = $1 FOR UPDATE', [
                    lawsuit.defendant_user_id,
                ]);
                const plAcct = await client.query('SELECT id FROM accounts WHERE user_id = $1 FOR UPDATE', [
                    lawsuit.plaintiff_user_id,
                ]);
                const defAccount = defAcct.rows[0];
                const plAccount = plAcct.rows[0];
                if (!defAccount || !plAccount)
                    throw new Error('Account not found');
                const payAmount = Math.min(awardedAmount, parseFloat(defAccount.balance));
                if (payAmount > 0) {
                    await client.query('UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [payAmount, defAccount.id]);
                    await client.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [payAmount, plAccount.id]);
                    await client.query(`INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description)
               VALUES ($1, $2, $3, 'transfer', $4)`, [
                        defAccount.id,
                        plAccount.id,
                        payAmount,
                        `Lawsuit damages | case #${lawsuitId} | Approved by ${req.user.username} (${teacherInitials})`,
                    ]);
                }
            }
            await client.query(`UPDATE student_lawsuits SET
             status = 'approved',
             awarded_amount = $1,
             teacher_reviewer_id = $2,
             teacher_reviewed_at = CURRENT_TIMESTAMP,
             teacher_initials = $3,
             teacher_notes = $4,
             updated_at = CURRENT_TIMESTAMP
           WHERE id = $5`, [awardedAmount, req.user.id, teacherInitials, teacherNotes, lawsuitId]);
            const xpResult = await (0, lawsuits_1.payPlaintiffLawyerOnClose)({ ...lawsuit, id: lawsuitId }, client);
            await client.query('COMMIT');
            let lawyerXp = {};
            if (xpResult.lawyerId) {
                lawyerXp = await (0, lawsuits_1.awardJobXp)(xpResult.lawyerId, lawsuits_1.LAWYER_LAWSUIT_XP);
            }
            return res.json({
                message: 'Case approved',
                awarded_amount: awardedAmount,
                lawyer_xp: lawyerXp.experience_points,
                new_level: lawyerXp.new_level,
            });
        }
        catch (e) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to approve case' });
        }
        finally {
            client.release();
        }
    }
    catch (err) {
        console.error('lawsuits approve error:', err);
        return res.status(500).json({ error: 'Failed to approve case' });
    }
});
router.post('/:id/deny', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), [(0, express_validator_1.body)('teacher_initials').trim().notEmpty(), (0, express_validator_1.body)('denial_reason').trim().notEmpty()], async (req, res) => {
    try {
        if (!(await requireCourtEnabled(req, res)))
            return;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty())
            return res.status(400).json({ errors: errors.array() });
        const lawsuitId = parseInt(String(req.params.id), 10);
        const teacherInitials = String(req.body.teacher_initials).trim().toUpperCase();
        const denialReason = String(req.body.denial_reason).trim();
        const client = await database_prod_1.default.pool.connect();
        try {
            await client.query('BEGIN');
            const resRow = await client.query('SELECT * FROM student_lawsuits WHERE id = $1 FOR UPDATE', [lawsuitId]);
            const lawsuit = resRow.rows[0];
            if (!lawsuit || lawsuit.status !== 'pending_teacher') {
                throw new Error('Case is not pending teacher review');
            }
            await client.query(`UPDATE student_lawsuits SET
             status = 'denied',
             teacher_reviewer_id = $1,
             teacher_reviewed_at = CURRENT_TIMESTAMP,
             teacher_initials = $2,
             denial_reason = $3,
             updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`, [req.user.id, teacherInitials, denialReason, lawsuitId]);
            const xpResult = await (0, lawsuits_1.payPlaintiffLawyerOnClose)({ ...lawsuit, id: lawsuitId }, client);
            await client.query('COMMIT');
            let lawyerXp = {};
            if (xpResult.lawyerId) {
                lawyerXp = await (0, lawsuits_1.awardJobXp)(xpResult.lawyerId, lawsuits_1.LAWYER_LAWSUIT_XP);
            }
            return res.json({
                message: 'Case denied',
                lawyer_xp: lawyerXp.experience_points,
                new_level: lawyerXp.new_level,
            });
        }
        catch (e) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to deny case' });
        }
        finally {
            client.release();
        }
    }
    catch (err) {
        console.error('lawsuits deny error:', err);
        return res.status(500).json({ error: 'Failed to deny case' });
    }
});
exports.default = router;
//# sourceMappingURL=lawsuits.js.map