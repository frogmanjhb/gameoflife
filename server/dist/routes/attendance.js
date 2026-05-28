"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
const jobs_1 = require("./jobs");
const attendance_1 = require("../domain/attendance");
const router = (0, express_1.Router)();
function displayName(row) {
    const full = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
    return full || row.username;
}
async function awardXp(userId, xp) {
    const currentUser = await database_prod_1.default.get('SELECT job_level, job_experience_points FROM users WHERE id = $1', [userId]);
    const currentLevel = currentUser?.job_level || 1;
    const currentXP = currentUser?.job_experience_points || 0;
    const newXP = currentXP + xp;
    let newLevel = currentLevel;
    for (let level = currentLevel; level < 10; level++) {
        if (newXP >= (0, jobs_1.getXPForLevel)(level + 1))
            newLevel = level + 1;
        else
            break;
    }
    await database_prod_1.default.query('UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3', [newXP, newLevel, userId]);
    return { new_level: newLevel > currentLevel ? newLevel : null };
}
async function tablesReady() {
    try {
        await database_prod_1.default.query('SELECT 1 FROM attendance_registers LIMIT 1');
        return true;
    }
    catch {
        return false;
    }
}
async function fetchTownStudents(schoolId, townClass) {
    return database_prod_1.default.query(`SELECT u.id, u.username, u.first_name, u.last_name
     FROM users u
     WHERE u.role = 'student' AND u.status = 'approved'
       AND u.class = $1 AND u.school_id IS NOT DISTINCT FROM $2
     ORDER BY u.username ASC`, [townClass, schoolId]);
}
router.get('/register-status', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can access attendance register' });
        }
        if (!req.user.class) {
            return res.status(400).json({ error: 'You must belong to a town class' });
        }
        if (!(await tablesReady())) {
            return res.json({
                can_submit: false,
                submitter_role: null,
                already_submitted_today: false,
                submit_xp: attendance_1.ATTENDANCE_REGISTER_XP,
                pay_penalty_factor: attendance_1.ABSENT_NO_SICK_NOTE_PAY_FACTOR,
                students: [],
                reason: 'Attendance register is not available yet.',
            });
        }
        const schoolId = req.user.school_id ?? null;
        const townClass = req.user.class;
        const submitterRole = await (0, attendance_1.resolveRegisterSubmitterRole)(schoolId, townClass);
        const user = await database_prod_1.default.get(`SELECT u.*, j.name AS job_name FROM users u
       LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`, [req.user.id]);
        const students = await fetchTownStudents(schoolId, townClass);
        const todayRegisterId = await (0, attendance_1.getTodayRegisterId)(schoolId, townClass);
        const canSubmit = submitterRole !== null && (0, attendance_1.userCanSubmitRegister)(user?.job_name, submitterRole);
        let todayEntries = [];
        if (todayRegisterId) {
            todayEntries = await database_prod_1.default.query(`SELECT student_user_id, status FROM attendance_register_entries WHERE register_id = $1`, [todayRegisterId]);
        }
        res.json({
            can_submit: canSubmit && !todayRegisterId,
            submitter_role: submitterRole,
            already_submitted_today: !!todayRegisterId,
            submit_xp: attendance_1.ATTENDANCE_REGISTER_XP,
            pay_penalty_factor: attendance_1.ABSENT_NO_SICK_NOTE_PAY_FACTOR,
            students: students.map((s) => ({
                id: s.id,
                username: s.username,
                display_name: displayName(s),
            })),
            today_entries: todayEntries,
            reason: !submitterRole
                ? 'Your town needs a Nurse or Doctor to take daily register.'
                : !canSubmit
                    ? submitterRole === 'nurse'
                        ? 'Only the town Nurse can submit register while a Nurse is employed.'
                        : 'Only the town Doctor can submit register (no Nurse in town).'
                    : todayRegisterId
                        ? 'Register already submitted for today.'
                        : null,
        });
    }
    catch (error) {
        console.error('Attendance register-status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/submit-register', auth_1.authenticateToken, [(0, express_validator_1.body)('entries').isArray({ min: 1 }).withMessage('Entries are required')], async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can submit attendance register' });
        }
        if (!req.user.class) {
            return res.status(400).json({ error: 'You must belong to a town class' });
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Attendance register is not available yet.' });
        }
        const schoolId = req.user.school_id ?? null;
        const townClass = req.user.class;
        const submitterRole = await (0, attendance_1.resolveRegisterSubmitterRole)(schoolId, townClass);
        if (!submitterRole) {
            return res.status(400).json({ error: 'Your town has no Nurse or Doctor to take register.' });
        }
        const user = await database_prod_1.default.get(`SELECT u.*, j.name AS job_name FROM users u
         LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`, [req.user.id]);
        if (!(0, attendance_1.userCanSubmitRegister)(user?.job_name, submitterRole)) {
            return res.status(403).json({
                error: submitterRole === 'nurse'
                    ? 'Only the town Nurse can submit the daily register.'
                    : 'Only the town Doctor can submit the daily register when no Nurse is employed.',
            });
        }
        if (await (0, attendance_1.getTodayRegisterId)(schoolId, townClass)) {
            return res.status(400).json({ error: 'Register has already been submitted for today.' });
        }
        const students = await fetchTownStudents(schoolId, townClass);
        const studentIds = new Set(students.map((s) => s.id));
        const entries = req.body.entries;
        if (entries.length !== studentIds.size) {
            return res.status(400).json({ error: 'You must mark every student in your town as present or absent.' });
        }
        const seen = new Set();
        for (const entry of entries) {
            const sid = Number(entry.student_user_id);
            if (!studentIds.has(sid)) {
                return res.status(400).json({ error: 'Invalid student in register entries.' });
            }
            if (seen.has(sid)) {
                return res.status(400).json({ error: 'Duplicate student in register entries.' });
            }
            seen.add(sid);
            if (entry.status !== 'present' && entry.status !== 'absent') {
                return res.status(400).json({ error: 'Each entry must be present or absent.' });
            }
        }
        const reviewer = await (0, attendance_1.resolveSickNoteReviewer)(schoolId, townClass);
        const client = await database_prod_1.default.pool.connect();
        try {
            await client.query('BEGIN');
            const regResult = await client.query(`INSERT INTO attendance_registers (school_id, town_class, submitted_by_user_id)
           VALUES ($1, $2, $3) RETURNING id, submitted_at`, [schoolId, townClass, req.user.id]);
            const registerId = regResult.rows[0].id;
            let absentCount = 0;
            for (const entry of entries) {
                const status = entry.status;
                const entryResult = await client.query(`INSERT INTO attendance_register_entries (register_id, student_user_id, status)
             VALUES ($1, $2, $3) RETURNING id`, [registerId, entry.student_user_id, status]);
                if (status === 'absent') {
                    absentCount++;
                    await client.query(`INSERT INTO sick_notes
                 (register_entry_id, student_user_id, reviewer_user_id, reviewer_role, status)
               VALUES ($1, $2, $3, $4, 'awaiting_submission')`, [
                        entryResult.rows[0].id,
                        entry.student_user_id,
                        reviewer?.user_id ?? null,
                        reviewer?.role ?? 'none',
                    ]);
                }
            }
            await client.query('COMMIT');
            const xpResult = await awardXp(req.user.id, attendance_1.ATTENDANCE_REGISTER_XP);
            res.json({
                success: true,
                register_id: registerId,
                absent_count: absentCount,
                experience_points: attendance_1.ATTENDANCE_REGISTER_XP,
                new_level: xpResult.new_level,
                sick_note_reviewer: reviewer
                    ? { role: reviewer.role, label: (0, attendance_1.reviewerRoleLabel)(reviewer.role) }
                    : null,
            });
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Attendance submit-register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/my-sick-note', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can check sick note status' });
        }
        if (!(await tablesReady())) {
            return res.json({ required: false });
        }
        const row = await database_prod_1.default.get(`SELECT sn.id, sn.status, sn.explanation, sn.submitted_at, sn.reviewer_role,
              r.submitted_at AS register_date
       FROM sick_notes sn
       JOIN attendance_register_entries e ON e.id = sn.register_entry_id
       JOIN attendance_registers r ON r.id = e.register_id
       WHERE sn.student_user_id = $1 AND sn.status = 'awaiting_submission'
       ORDER BY r.submitted_at DESC LIMIT 1`, [req.user.id]);
        if (!row) {
            return res.json({ required: false });
        }
        res.json({
            required: true,
            sick_note: {
                id: row.id,
                register_date: row.register_date,
                reviewer_role: row.reviewer_role,
                reviewer_label: (0, attendance_1.reviewerRoleLabel)(row.reviewer_role),
            },
        });
    }
    catch (error) {
        console.error('Attendance my-sick-note error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/submit-sick-note', auth_1.authenticateToken, [
    (0, express_validator_1.body)('sick_note_id').isInt().withMessage('Sick note id is required'),
    (0, express_validator_1.body)('explanation').trim().isLength({ min: 3, max: 2000 }).withMessage('Explanation is required'),
], async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can submit sick notes' });
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Sick notes are not available yet.' });
        }
        const sickNoteId = Number(req.body.sick_note_id);
        const explanation = String(req.body.explanation).trim();
        const row = await database_prod_1.default.get(`SELECT * FROM sick_notes WHERE id = $1 AND student_user_id = $2`, [sickNoteId, req.user.id]);
        if (!row) {
            return res.status(404).json({ error: 'Sick note not found' });
        }
        if (row.status !== 'awaiting_submission') {
            return res.status(400).json({ error: 'This sick note has already been submitted.' });
        }
        await database_prod_1.default.query(`UPDATE sick_notes
         SET explanation = $1, status = 'pending_review', submitted_at = CURRENT_TIMESTAMP
         WHERE id = $2`, [explanation, sickNoteId]);
        res.json({
            success: true,
            status: 'pending_review',
            reviewer_label: (0, attendance_1.reviewerRoleLabel)(row.reviewer_role),
        });
    }
    catch (error) {
        console.error('Attendance submit-sick-note error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/sick-note-queue', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can view sick note queue' });
        }
        const user = await database_prod_1.default.get(`SELECT u.*, j.name AS job_name FROM users u
       LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`, [req.user.id]);
        if (!(0, attendance_1.userCanReviewSickNotes)(user?.job_name)) {
            return res.status(403).json({ error: 'Only HR Director, Financial Manager, or Lawyer can review sick notes' });
        }
        if (!(await tablesReady())) {
            return res.json({ pending: [], approve_xp: attendance_1.SICK_NOTE_APPROVE_XP });
        }
        const pending = await database_prod_1.default.query(`SELECT sn.id, sn.explanation, sn.submitted_at, sn.reviewer_role,
              u.username AS student_username,
              COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.username) AS student_display_name,
              r.submitted_at AS register_date
       FROM sick_notes sn
       JOIN users u ON u.id = sn.student_user_id
       JOIN attendance_register_entries e ON e.id = sn.register_entry_id
       JOIN attendance_registers r ON r.id = e.register_id
       WHERE sn.status = 'pending_review'
         AND sn.reviewer_user_id = $1
       ORDER BY sn.submitted_at ASC`, [req.user.id]);
        res.json({
            pending: pending.map((r) => ({
                id: r.id,
                student_username: r.student_username,
                student_display_name: r.student_display_name,
                explanation: r.explanation,
                submitted_at: r.submitted_at,
                register_date: r.register_date,
            })),
            approve_xp: attendance_1.SICK_NOTE_APPROVE_XP,
        });
    }
    catch (error) {
        console.error('Attendance sick-note-queue error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/review-sick-note/:id', auth_1.authenticateToken, [(0, express_validator_1.body)('approved').isBoolean().withMessage('approved must be true or false')], async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can review sick notes' });
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const user = await database_prod_1.default.get(`SELECT u.*, j.name AS job_name FROM users u
         LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`, [req.user.id]);
        if (!(0, attendance_1.userCanReviewSickNotes)(user?.job_name)) {
            return res.status(403).json({ error: 'Only HR Director, Financial Manager, or Lawyer can review sick notes' });
        }
        const sickNoteId = parseInt(String(req.params.id), 10);
        if (!sickNoteId || Number.isNaN(sickNoteId)) {
            return res.status(400).json({ error: 'Invalid sick note id' });
        }
        const row = await database_prod_1.default.get(`SELECT sn.*,
                u.username AS student_username,
                COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.username) AS student_display_name
         FROM sick_notes sn
         JOIN users u ON u.id = sn.student_user_id
         WHERE sn.id = $1`, [sickNoteId]);
        if (!row) {
            return res.status(404).json({ error: 'Sick note not found' });
        }
        if (row.reviewer_user_id !== req.user.id) {
            return res.status(403).json({ error: 'This sick note is not assigned to you for review' });
        }
        if (row.status !== 'pending_review') {
            return res.status(400).json({ error: 'This sick note is not awaiting review' });
        }
        const approved = !!req.body.approved;
        const newStatus = approved ? 'approved' : 'denied';
        await database_prod_1.default.query(`UPDATE sick_notes
         SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by_user_id = $2
         WHERE id = $3`, [newStatus, req.user.id, sickNoteId]);
        let xpResult = { new_level: null };
        let xpAwarded = 0;
        if (approved) {
            xpAwarded = attendance_1.SICK_NOTE_APPROVE_XP;
            xpResult = await awardXp(req.user.id, attendance_1.SICK_NOTE_APPROVE_XP);
        }
        res.json({
            success: true,
            approved,
            student_display_name: row.student_display_name,
            experience_points: xpAwarded,
            new_level: xpResult.new_level,
        });
    }
    catch (error) {
        console.error('Attendance review-sick-note error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=attendance.js.map