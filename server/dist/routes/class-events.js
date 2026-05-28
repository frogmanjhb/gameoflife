"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
const jobs_1 = require("./jobs");
const classEvents_1 = require("../domain/classEvents");
const router = (0, express_1.Router)();
async function tablesReady() {
    try {
        await database_prod_1.default.query('SELECT 1 FROM class_events LIMIT 1');
        return true;
    }
    catch {
        return false;
    }
}
async function getStudentUser(userId) {
    return database_prod_1.default.get(`SELECT u.id, u.class, u.school_id, u.username, u.role, j.name AS job_name
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.id = $1`, [userId]);
}
function resolveTownScope(user) {
    if (!user.class || !(0, classEvents_1.isTownClass)(user.class)) {
        return null;
    }
    return { townClass: user.class, schoolId: user.school_id ?? null };
}
async function getOrCreateSettings(schoolId, townClass) {
    const existing = schoolId != null
        ? await database_prod_1.default.get('SELECT * FROM class_event_voting_settings WHERE school_id = $1 AND town_class = $2', [schoolId, townClass])
        : await database_prod_1.default.get('SELECT * FROM class_event_voting_settings WHERE school_id IS NULL AND town_class = $1', [townClass]);
    if (existing)
        return existing;
    if (schoolId != null) {
        const rows = await database_prod_1.default.query(`INSERT INTO class_event_voting_settings (school_id, town_class, teacher_board_enabled)
       VALUES ($1, $2, true)
       ON CONFLICT (school_id, town_class) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING *`, [schoolId, townClass]);
        return rows[0];
    }
    const rows = await database_prod_1.default.query(`INSERT INTO class_event_voting_settings (school_id, town_class, teacher_board_enabled)
     VALUES (NULL, $1, true)
     ON CONFLICT (school_id, town_class) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
     RETURNING *`, [townClass]);
    return rows[0];
}
async function getStudentPref(userId) {
    const row = await database_prod_1.default.get('SELECT board_visible FROM class_event_voting_student_prefs WHERE user_id = $1', [userId]);
    return row?.board_visible !== false;
}
async function getWeeklySuggestionCount(userId) {
    const row = await database_prod_1.default.get(`SELECT COUNT(*)::int AS count FROM class_events
     WHERE suggested_by_user_id = $1 AND created_at >= ${classEvents_1.WEEK_START_SQL}`, [userId]);
    return parseInt(String(row?.count ?? 0), 10) || 0;
}
async function paySuggestionReward(userId, username, townClass, schoolId) {
    const currentUser = await database_prod_1.default.get('SELECT job_level, job_experience_points FROM users WHERE id = $1', [userId]);
    const currentLevel = currentUser?.job_level || 1;
    const currentXP = currentUser?.job_experience_points || 0;
    const newXP = currentXP + classEvents_1.SUGGESTION_XP_REWARD;
    let newLevel = currentLevel;
    for (let level = currentLevel; level < 10; level++) {
        if (newXP >= (0, jobs_1.getXPForLevel)(level + 1))
            newLevel = level + 1;
        else
            break;
    }
    await database_prod_1.default.query('UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3', [newXP, newLevel, userId]);
    const account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [userId]);
    if (account && classEvents_1.SUGGESTION_EARNINGS_REWARD > 0) {
        const townSettings = schoolId != null
            ? await database_prod_1.default.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id = $2', [townClass, schoolId])
            : await database_prod_1.default.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id IS NULL', [townClass]);
        const treasuryBalance = parseFloat(townSettings?.treasury_balance || '0');
        if (treasuryBalance < classEvents_1.SUGGESTION_EARNINGS_REWARD) {
            throw new Error('TREASURY_INSUFFICIENT');
        }
        if (schoolId != null) {
            await database_prod_1.default.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3', [classEvents_1.SUGGESTION_EARNINGS_REWARD, townClass, schoolId]);
        }
        else {
            await database_prod_1.default.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL', [classEvents_1.SUGGESTION_EARNINGS_REWARD, townClass]);
        }
        await database_prod_1.default.query('INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)', [schoolId, townClass, classEvents_1.SUGGESTION_EARNINGS_REWARD, 'withdrawal', `Class event suggestion payout to ${username}`, userId]);
        await database_prod_1.default.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [classEvents_1.SUGGESTION_EARNINGS_REWARD, account.id]);
        await database_prod_1.default.query(`INSERT INTO transactions (to_account_id, amount, transaction_type, description)
       VALUES ($1, $2, 'deposit', $3)`, [account.id, classEvents_1.SUGGESTION_EARNINGS_REWARD, 'CLASS_EVENT_SUGGESTION_EARN']);
    }
    return {
        experience_points: classEvents_1.SUGGESTION_XP_REWARD,
        earnings: classEvents_1.SUGGESTION_EARNINGS_REWARD,
        new_level: newLevel > currentLevel ? newLevel : null,
    };
}
async function buildEventsPayload(schoolId, townClass, viewerUserId, includeClosed) {
    const statusFilter = includeClosed ? '' : " AND e.status = 'open'";
    const events = schoolId != null
        ? await database_prod_1.default.query(`SELECT e.*, u.username AS suggester_username,
                u.first_name AS suggester_first_name, u.last_name AS suggester_last_name,
                (SELECT COUNT(*)::int FROM class_event_votes v WHERE v.event_id = e.id) AS vote_count
         FROM class_events e
         JOIN users u ON u.id = e.suggested_by_user_id
         WHERE e.school_id = $1 AND e.town_class = $2${statusFilter}
         ORDER BY e.created_at DESC`, [schoolId, townClass])
        : await database_prod_1.default.query(`SELECT e.*, u.username AS suggester_username,
                u.first_name AS suggester_first_name, u.last_name AS suggester_last_name,
                (SELECT COUNT(*)::int FROM class_event_votes v WHERE v.event_id = e.id) AS vote_count
         FROM class_events e
         JOIN users u ON u.id = e.suggested_by_user_id
         WHERE e.school_id IS NULL AND e.town_class = $1${statusFilter}
         ORDER BY e.created_at DESC`, [townClass]);
    let votedEventIds = [];
    if (viewerUserId != null) {
        const votes = await database_prod_1.default.query('SELECT event_id FROM class_event_votes WHERE user_id = $1', [viewerUserId]);
        votedEventIds = votes.map((v) => v.event_id);
    }
    return events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        timing: e.timing,
        timing_label: (0, classEvents_1.timingLabel)(e.timing),
        status: e.status,
        vote_count: e.vote_count,
        has_voted: votedEventIds.includes(Number(e.id)),
        suggested_by_user_id: e.suggested_by_user_id,
        suggester_username: e.suggester_username,
        suggester_name: [e.suggester_first_name, e.suggester_last_name].filter(Boolean).join(' ') || e.suggester_username,
        created_at: e.created_at,
    }));
}
function computeNeedsVote(boardActive, events) {
    if (!boardActive)
        return false;
    return events.some((e) => e.status === 'open' && !e.has_voted);
}
// GET /status
router.get('/status', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'User not found' });
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Event voting board is not available yet. Please try again later.' });
        }
        const role = req.user.role;
        let townScope = null;
        let viewerUserId = null;
        let isEventPlanner = false;
        let suggestionsThisWeek = 0;
        if (role === 'teacher') {
            const bodyClass = req.query.class;
            if (bodyClass && (0, classEvents_1.isTownClass)(bodyClass)) {
                townScope = { townClass: bodyClass, schoolId: req.user.school_id ?? null };
            }
            else {
                return res.status(400).json({ error: 'Teachers must specify a town class (6A, 6B, or 6C)' });
            }
        }
        else if (role === 'student') {
            const student = await getStudentUser(req.user.id);
            townScope = student ? resolveTownScope(student) : null;
            viewerUserId = req.user.id;
            isEventPlanner = !!student && (0, classEvents_1.hasEventPlannerJob)(student.job_name);
            if (isEventPlanner) {
                suggestionsThisWeek = await getWeeklySuggestionCount(req.user.id);
            }
        }
        else {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (!townScope) {
            return res.status(400).json({ error: 'Your account must be assigned to a town class (6A, 6B, or 6C)' });
        }
        const settings = await getOrCreateSettings(townScope.schoolId, townScope.townClass);
        const studentBoardVisible = role === 'student' ? await getStudentPref(req.user.id) : true;
        const teacherBoardEnabled = settings.teacher_board_enabled !== false;
        const boardActive = teacherBoardEnabled && (role === 'teacher' || studentBoardVisible);
        const includeClosed = role === 'teacher';
        const events = await buildEventsPayload(townScope.schoolId, townScope.townClass, viewerUserId, includeClosed);
        const remainingSuggestions = isEventPlanner
            ? Math.max(0, classEvents_1.SUGGESTIONS_PER_WEEK - suggestionsThisWeek)
            : 0;
        res.json({
            teacher_board_enabled: teacherBoardEnabled,
            student_board_visible: studentBoardVisible,
            board_active: boardActive,
            is_event_planner: isEventPlanner,
            suggestions_this_week: suggestionsThisWeek,
            suggestions_per_week: classEvents_1.SUGGESTIONS_PER_WEEK,
            remaining_suggestions: remainingSuggestions,
            suggestion_xp_reward: classEvents_1.SUGGESTION_XP_REWARD,
            suggestion_earnings_reward: classEvents_1.SUGGESTION_EARNINGS_REWARD,
            events,
            needs_vote: role === 'student' && computeNeedsVote(boardActive, events),
            town_class: townScope.townClass,
        });
    }
    catch (error) {
        console.error('Class events status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /suggest — event planner students only
router.post('/suggest', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can suggest class events' });
        }
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Event voting board is not available yet. Please try again later.' });
        }
        const student = await getStudentUser(req.user.id);
        if (!student || !(0, classEvents_1.hasEventPlannerJob)(student.job_name)) {
            return res.status(403).json({ error: 'Only Event Planners can suggest class events' });
        }
        const townScope = resolveTownScope(student);
        if (!townScope) {
            return res.status(400).json({ error: 'Your account must be assigned to a town class (6A, 6B, or 6C)' });
        }
        const title = (0, classEvents_1.sanitizeTitle)(req.body?.title);
        const description = (0, classEvents_1.sanitizeDescription)(req.body?.description);
        const timing = req.body?.timing;
        if (!title) {
            return res.status(400).json({ error: 'Please provide an event title (max 200 characters)' });
        }
        if (!(0, classEvents_1.isValidTiming)(timing)) {
            return res.status(400).json({ error: 'When should the event happen? Choose before, during, or after class.' });
        }
        const weeklyCount = await getWeeklySuggestionCount(req.user.id);
        if (weeklyCount >= classEvents_1.SUGGESTIONS_PER_WEEK) {
            return res.status(400).json({
                error: `You can only suggest ${classEvents_1.SUGGESTIONS_PER_WEEK} events per week. Try again next week.`,
            });
        }
        const settings = await getOrCreateSettings(townScope.schoolId, townScope.townClass);
        if (settings.teacher_board_enabled === false) {
            return res.status(400).json({ error: 'The voting board is currently disabled by your teacher.' });
        }
        let reward;
        try {
            reward = await paySuggestionReward(req.user.id, req.user.username, townScope.townClass, townScope.schoolId);
        }
        catch (err) {
            if (err instanceof Error && err.message === 'TREASURY_INSUFFICIENT') {
                return res.status(400).json({
                    error: 'Town treasury has insufficient funds to pay your suggestion reward. Please contact your teacher.',
                });
            }
            throw err;
        }
        const insert = townScope.schoolId != null
            ? await database_prod_1.default.query(`INSERT INTO class_events (school_id, town_class, suggested_by_user_id, title, description, timing, reward_paid)
           VALUES ($1, $2, $3, $4, $5, $6, true)
           RETURNING *`, [townScope.schoolId, townScope.townClass, req.user.id, title, description, timing])
            : await database_prod_1.default.query(`INSERT INTO class_events (school_id, town_class, suggested_by_user_id, title, description, timing, reward_paid)
           VALUES (NULL, $1, $2, $3, $4, $5, true)
           RETURNING *`, [townScope.townClass, req.user.id, title, description, timing]);
        const event = insert[0];
        res.status(201).json({
            success: true,
            event: {
                id: event.id,
                title: event.title,
                description: event.description,
                timing: event.timing,
                timing_label: (0, classEvents_1.timingLabel)(event.timing),
                status: event.status,
                created_at: event.created_at,
            },
            experience_points: reward.experience_points,
            earnings: reward.earnings,
            new_level: reward.new_level,
            remaining_suggestions: Math.max(0, classEvents_1.SUGGESTIONS_PER_WEEK - weeklyCount - 1),
        });
    }
    catch (error) {
        console.error('Class event suggest error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /:id/vote — one vote per student per event
router.post('/:id/vote', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can vote on class events' });
        }
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Event voting board is not available yet. Please try again later.' });
        }
        const eventId = parseInt(req.params.id, 10);
        if (isNaN(eventId))
            return res.status(400).json({ error: 'Invalid event' });
        const student = await getStudentUser(req.user.id);
        const townScope = student ? resolveTownScope(student) : null;
        if (!townScope) {
            return res.status(400).json({ error: 'Your account must be assigned to a town class (6A, 6B, or 6C)' });
        }
        const settings = await getOrCreateSettings(townScope.schoolId, townScope.townClass);
        if (settings.teacher_board_enabled === false) {
            return res.status(400).json({ error: 'The voting board is currently disabled by your teacher.' });
        }
        if (!(await getStudentPref(req.user.id))) {
            return res.status(400).json({ error: 'Your voting board is hidden. Turn it on to vote.' });
        }
        const event = townScope.schoolId != null
            ? await database_prod_1.default.get('SELECT * FROM class_events WHERE id = $1 AND school_id = $2 AND town_class = $3', [eventId, townScope.schoolId, townScope.townClass])
            : await database_prod_1.default.get('SELECT * FROM class_events WHERE id = $1 AND school_id IS NULL AND town_class = $2', [eventId, townScope.townClass]);
        if (!event)
            return res.status(404).json({ error: 'Event not found' });
        if (event.status !== 'open') {
            return res.status(400).json({ error: 'This event is closed and no longer accepting votes' });
        }
        const existing = await database_prod_1.default.get('SELECT id FROM class_event_votes WHERE event_id = $1 AND user_id = $2', [eventId, req.user.id]);
        if (existing) {
            return res.status(400).json({ error: 'You have already voted for this event' });
        }
        await database_prod_1.default.query('INSERT INTO class_event_votes (event_id, user_id) VALUES ($1, $2)', [eventId, req.user.id]);
        const voteCountRow = await database_prod_1.default.get('SELECT COUNT(*)::int AS count FROM class_event_votes WHERE event_id = $1', [eventId]);
        res.json({
            success: true,
            event_id: eventId,
            vote_count: parseInt(String(voteCountRow?.count ?? 0), 10),
        });
    }
    catch (error) {
        const pgCode = error?.code;
        if (pgCode === '23505') {
            return res.status(400).json({ error: 'You have already voted for this event' });
        }
        console.error('Class event vote error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH /settings — teacher: class board; student: personal visibility
router.patch('/settings', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'User not found' });
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Event voting board is not available yet. Please try again later.' });
        }
        if (req.user.role === 'student') {
            if (typeof req.body?.board_visible !== 'boolean') {
                return res.status(400).json({ error: 'board_visible must be true or false' });
            }
            await database_prod_1.default.query(`INSERT INTO class_event_voting_student_prefs (user_id, board_visible, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET board_visible = EXCLUDED.board_visible, updated_at = CURRENT_TIMESTAMP`, [req.user.id, req.body.board_visible]);
            return res.json({ student_board_visible: req.body.board_visible });
        }
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const townClass = req.body?.town_class;
        if (!(0, classEvents_1.isTownClass)(townClass)) {
            return res.status(400).json({ error: 'town_class must be 6A, 6B, or 6C' });
        }
        if (typeof req.body?.teacher_board_enabled !== 'boolean') {
            return res.status(400).json({ error: 'teacher_board_enabled must be true or false' });
        }
        const schoolId = req.user.school_id ?? null;
        await getOrCreateSettings(schoolId, townClass);
        if (schoolId != null) {
            await database_prod_1.default.query(`UPDATE class_event_voting_settings
         SET teacher_board_enabled = $1, updated_at = CURRENT_TIMESTAMP
         WHERE school_id = $2 AND town_class = $3`, [req.body.teacher_board_enabled, schoolId, townClass]);
        }
        else {
            await database_prod_1.default.query(`UPDATE class_event_voting_settings
         SET teacher_board_enabled = $1, updated_at = CURRENT_TIMESTAMP
         WHERE school_id IS NULL AND town_class = $2`, [req.body.teacher_board_enabled, townClass]);
        }
        res.json({ teacher_board_enabled: req.body.teacher_board_enabled, town_class: townClass });
    }
    catch (error) {
        console.error('Class events settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /:id/close — teacher closes voting on an event
router.post('/:id/close', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Event voting board is not available yet. Please try again later.' });
        }
        const eventId = parseInt(req.params.id, 10);
        if (isNaN(eventId))
            return res.status(400).json({ error: 'Invalid event' });
        const townClass = req.body?.town_class;
        if (!(0, classEvents_1.isTownClass)(townClass)) {
            return res.status(400).json({ error: 'town_class must be 6A, 6B, or 6C' });
        }
        const schoolId = req.user?.school_id ?? null;
        const event = schoolId != null
            ? await database_prod_1.default.get('SELECT * FROM class_events WHERE id = $1 AND school_id = $2 AND town_class = $3', [eventId, schoolId, townClass])
            : await database_prod_1.default.get('SELECT * FROM class_events WHERE id = $1 AND school_id IS NULL AND town_class = $2', [eventId, townClass]);
        if (!event)
            return res.status(404).json({ error: 'Event not found' });
        await database_prod_1.default.query(`UPDATE class_events SET status = 'closed' WHERE id = $1`, [eventId]);
        res.json({ success: true, event_id: eventId, status: 'closed' });
    }
    catch (error) {
        console.error('Class event close error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /:id — teacher removes an event
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Event voting board is not available yet. Please try again later.' });
        }
        const eventId = parseInt(req.params.id, 10);
        if (isNaN(eventId))
            return res.status(400).json({ error: 'Invalid event' });
        const townClass = req.query.class;
        if (!(0, classEvents_1.isTownClass)(townClass)) {
            return res.status(400).json({ error: 'Query param class must be 6A, 6B, or 6C' });
        }
        const schoolId = req.user?.school_id ?? null;
        const result = schoolId != null
            ? await database_prod_1.default.run('DELETE FROM class_events WHERE id = $1 AND school_id = $2 AND town_class = $3', [eventId, schoolId, townClass])
            : await database_prod_1.default.run('DELETE FROM class_events WHERE id = $1 AND school_id IS NULL AND town_class = $2', [eventId, townClass]);
        if (!result || result.changes === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Class event delete error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=class-events.js.map