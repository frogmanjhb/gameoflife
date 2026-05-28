"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
const jobs_1 = require("./jobs");
const fiveMinuteLessons_1 = require("../domain/fiveMinuteLessons");
const router = (0, express_1.Router)();
async function tablesReady() {
    try {
        await database_prod_1.default.query('SELECT 1 FROM five_minute_lessons LIMIT 1');
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
    if (!user.class || !(0, fiveMinuteLessons_1.isTownClass)(user.class)) {
        return null;
    }
    return { townClass: user.class, schoolId: user.school_id ?? null };
}
async function getOrCreateSettings(schoolId, townClass) {
    const existing = schoolId != null
        ? await database_prod_1.default.get('SELECT * FROM five_minute_lesson_settings WHERE school_id = $1 AND town_class = $2', [schoolId, townClass])
        : await database_prod_1.default.get('SELECT * FROM five_minute_lesson_settings WHERE school_id IS NULL AND town_class = $1', [townClass]);
    if (existing)
        return existing;
    if (schoolId != null) {
        const rows = await database_prod_1.default.query(`INSERT INTO five_minute_lesson_settings (school_id, town_class, teacher_board_enabled)
       VALUES ($1, $2, true)
       ON CONFLICT (school_id, town_class) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING *`, [schoolId, townClass]);
        return rows[0];
    }
    const rows = await database_prod_1.default.query(`INSERT INTO five_minute_lesson_settings (school_id, town_class, teacher_board_enabled)
     VALUES (NULL, $1, true)
     ON CONFLICT (school_id, town_class) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
     RETURNING *`, [townClass]);
    return rows[0];
}
async function getStudentPref(userId) {
    const row = await database_prod_1.default.get('SELECT board_visible FROM five_minute_lesson_student_prefs WHERE user_id = $1', [userId]);
    return row?.board_visible !== false;
}
async function getWeeklySuggestionCount(userId) {
    const row = await database_prod_1.default.get(`SELECT COUNT(*)::int AS count FROM five_minute_lessons
     WHERE suggested_by_user_id = $1 AND created_at >= ${fiveMinuteLessons_1.WEEK_START_SQL}`, [userId]);
    return parseInt(String(row?.count ?? 0), 10) || 0;
}
async function paySuggestionReward(userId, username, townClass, schoolId) {
    const currentUser = await database_prod_1.default.get('SELECT job_level, job_experience_points FROM users WHERE id = $1', [userId]);
    const currentLevel = currentUser?.job_level || 1;
    const currentXP = currentUser?.job_experience_points || 0;
    const newXP = currentXP + fiveMinuteLessons_1.SUGGESTION_XP_REWARD;
    let newLevel = currentLevel;
    for (let level = currentLevel; level < 10; level++) {
        if (newXP >= (0, jobs_1.getXPForLevel)(level + 1))
            newLevel = level + 1;
        else
            break;
    }
    await database_prod_1.default.query('UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3', [newXP, newLevel, userId]);
    const account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [userId]);
    if (account && fiveMinuteLessons_1.SUGGESTION_EARNINGS_REWARD > 0) {
        const townSettings = schoolId != null
            ? await database_prod_1.default.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id = $2', [townClass, schoolId])
            : await database_prod_1.default.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id IS NULL', [townClass]);
        const treasuryBalance = parseFloat(townSettings?.treasury_balance || '0');
        if (treasuryBalance < fiveMinuteLessons_1.SUGGESTION_EARNINGS_REWARD) {
            throw new Error('TREASURY_INSUFFICIENT');
        }
        if (schoolId != null) {
            await database_prod_1.default.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3', [fiveMinuteLessons_1.SUGGESTION_EARNINGS_REWARD, townClass, schoolId]);
        }
        else {
            await database_prod_1.default.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL', [fiveMinuteLessons_1.SUGGESTION_EARNINGS_REWARD, townClass]);
        }
        await database_prod_1.default.query('INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)', [schoolId, townClass, fiveMinuteLessons_1.SUGGESTION_EARNINGS_REWARD, 'withdrawal', `5-minute lesson payout to ${username}`, userId]);
        await database_prod_1.default.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [fiveMinuteLessons_1.SUGGESTION_EARNINGS_REWARD, account.id]);
        await database_prod_1.default.query(`INSERT INTO transactions (to_account_id, amount, transaction_type, description)
       VALUES ($1, $2, 'deposit', $3)`, [account.id, fiveMinuteLessons_1.SUGGESTION_EARNINGS_REWARD, 'FIVE_MINUTE_LESSON_EARN']);
    }
    return {
        experience_points: fiveMinuteLessons_1.SUGGESTION_XP_REWARD,
        earnings: fiveMinuteLessons_1.SUGGESTION_EARNINGS_REWARD,
        new_level: newLevel > currentLevel ? newLevel : null,
    };
}
async function buildLessonsPayload(schoolId, townClass, viewerUserId, role) {
    let statusFilter = '';
    if (role === 'student') {
        statusFilter = " AND l.status = 'open'";
    }
    else if (role === 'teacher') {
        statusFilter = " AND l.status IN ('pending', 'open', 'closed', 'denied')";
    }
    const lessons = schoolId != null
        ? await database_prod_1.default.query(`SELECT l.*, u.username AS suggester_username,
                u.first_name AS suggester_first_name, u.last_name AS suggester_last_name,
                (SELECT COUNT(*)::int FROM five_minute_lesson_votes v WHERE v.lesson_id = l.id) AS vote_count
         FROM five_minute_lessons l
         JOIN users u ON u.id = l.suggested_by_user_id
         WHERE l.school_id = $1 AND l.town_class = $2${statusFilter}
         ORDER BY l.created_at DESC`, [schoolId, townClass])
        : await database_prod_1.default.query(`SELECT l.*, u.username AS suggester_username,
                u.first_name AS suggester_first_name, u.last_name AS suggester_last_name,
                (SELECT COUNT(*)::int FROM five_minute_lesson_votes v WHERE v.lesson_id = l.id) AS vote_count
         FROM five_minute_lessons l
         JOIN users u ON u.id = l.suggested_by_user_id
         WHERE l.school_id IS NULL AND l.town_class = $1${statusFilter}
         ORDER BY l.created_at DESC`, [townClass]);
    let votedLessonIds = [];
    if (viewerUserId != null) {
        const votes = await database_prod_1.default.query('SELECT lesson_id FROM five_minute_lesson_votes WHERE user_id = $1', [viewerUserId]);
        votedLessonIds = votes.map((v) => v.lesson_id);
    }
    return lessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        class_content: l.class_content,
        timing: l.timing,
        timing_label: (0, fiveMinuteLessons_1.timingLabel)(l.timing),
        status: l.status,
        status_label: (0, fiveMinuteLessons_1.lessonStatusLabel)(String(l.status)),
        vote_count: l.vote_count,
        has_voted: votedLessonIds.includes(Number(l.id)),
        suggested_by_user_id: l.suggested_by_user_id,
        suggester_username: l.suggester_username,
        suggester_name: [l.suggester_first_name, l.suggester_last_name].filter(Boolean).join(' ') || l.suggester_username,
        created_at: l.created_at,
    }));
}
function computeNeedsVote(boardActive, lessons) {
    if (!boardActive)
        return false;
    return lessons.some((l) => l.status === 'open' && !l.has_voted);
}
// GET /status
router.get('/status', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'User not found' });
        if (!(await tablesReady())) {
            return res.status(503).json({ error: '5 Minute Lessons is not available yet. Please try again later.' });
        }
        const role = req.user.role;
        let townScope = null;
        let viewerUserId = null;
        let isLessonPresenter = false;
        let suggestionsThisWeek = 0;
        if (role === 'teacher') {
            const bodyClass = req.query.class;
            if (bodyClass && (0, fiveMinuteLessons_1.isTownClass)(bodyClass)) {
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
            isLessonPresenter = !!student && (0, fiveMinuteLessons_1.hasFiveMinuteLessonJob)(student.job_name);
            if (isLessonPresenter) {
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
        const lessons = await buildLessonsPayload(townScope.schoolId, townScope.townClass, viewerUserId, role);
        const pendingLessons = role === 'teacher'
            ? lessons.filter((l) => String(l.status) === 'pending')
            : [];
        const remainingSuggestions = isLessonPresenter
            ? Math.max(0, fiveMinuteLessons_1.SUGGESTIONS_PER_WEEK - suggestionsThisWeek)
            : 0;
        res.json({
            teacher_board_enabled: teacherBoardEnabled,
            student_board_visible: studentBoardVisible,
            board_active: boardActive,
            is_lesson_presenter: isLessonPresenter,
            suggestions_this_week: suggestionsThisWeek,
            suggestions_per_week: fiveMinuteLessons_1.SUGGESTIONS_PER_WEEK,
            remaining_suggestions: remainingSuggestions,
            suggestion_xp_reward: fiveMinuteLessons_1.SUGGESTION_XP_REWARD,
            suggestion_earnings_reward: fiveMinuteLessons_1.SUGGESTION_EARNINGS_REWARD,
            lessons,
            pending_lessons: pendingLessons,
            pending_count: pendingLessons.length,
            needs_vote: role === 'student' && computeNeedsVote(boardActive, lessons),
            town_class: townScope.townClass,
        });
    }
    catch (error) {
        console.error('Five minute lessons status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /suggest — Teacher or Principal students only; pending until teacher approves
router.post('/suggest', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can suggest 5-minute lessons' });
        }
        if (!(await tablesReady())) {
            return res.status(503).json({ error: '5 Minute Lessons is not available yet. Please try again later.' });
        }
        const student = await getStudentUser(req.user.id);
        if (!student || !(0, fiveMinuteLessons_1.hasFiveMinuteLessonJob)(student.job_name)) {
            return res.status(403).json({ error: 'Only Teacher or Principal students can suggest 5-minute lessons' });
        }
        const townScope = resolveTownScope(student);
        if (!townScope) {
            return res.status(400).json({ error: 'Your account must be assigned to a town class (6A, 6B, or 6C)' });
        }
        const title = (0, fiveMinuteLessons_1.sanitizeTitle)(req.body?.title);
        const description = (0, fiveMinuteLessons_1.sanitizeDescription)(req.body?.description);
        const classContent = (0, fiveMinuteLessons_1.sanitizeClassContent)(req.body?.class_content);
        const timing = req.body?.timing;
        if (!title) {
            return res.status(400).json({ error: 'Please provide a lesson title (max 200 characters)' });
        }
        if (!classContent) {
            return res.status(400).json({ error: 'Please describe which class content this lesson covers (max 500 characters)' });
        }
        if (!(0, fiveMinuteLessons_1.isValidTiming)(timing)) {
            return res.status(400).json({ error: 'When should the lesson happen? Choose before, during, or after class.' });
        }
        const weeklyCount = await getWeeklySuggestionCount(req.user.id);
        if (weeklyCount >= fiveMinuteLessons_1.SUGGESTIONS_PER_WEEK) {
            return res.status(400).json({
                error: `You can only suggest ${fiveMinuteLessons_1.SUGGESTIONS_PER_WEEK} lessons per week. Try again next week.`,
            });
        }
        const settings = await getOrCreateSettings(townScope.schoolId, townScope.townClass);
        if (settings.teacher_board_enabled === false) {
            return res.status(400).json({ error: 'The lessons board is currently disabled by your teacher.' });
        }
        const insert = townScope.schoolId != null
            ? await database_prod_1.default.query(`INSERT INTO five_minute_lessons (school_id, town_class, suggested_by_user_id, title, description, class_content, timing, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
           RETURNING *`, [townScope.schoolId, townScope.townClass, req.user.id, title, description, classContent, timing])
            : await database_prod_1.default.query(`INSERT INTO five_minute_lessons (school_id, town_class, suggested_by_user_id, title, description, class_content, timing, status)
           VALUES (NULL, $1, $2, $3, $4, $5, $6, 'pending')
           RETURNING *`, [townScope.townClass, req.user.id, title, description, classContent, timing]);
        const lesson = insert[0];
        res.status(201).json({
            success: true,
            lesson: {
                id: lesson.id,
                title: lesson.title,
                description: lesson.description,
                class_content: lesson.class_content,
                timing: lesson.timing,
                timing_label: (0, fiveMinuteLessons_1.timingLabel)(lesson.timing),
                status: lesson.status,
                status_label: (0, fiveMinuteLessons_1.lessonStatusLabel)(lesson.status),
                created_at: lesson.created_at,
            },
            remaining_suggestions: Math.max(0, fiveMinuteLessons_1.SUGGESTIONS_PER_WEEK - weeklyCount - 1),
            message: 'Lesson submitted for teacher approval. You will earn XP and money once approved.',
        });
    }
    catch (error) {
        console.error('Five minute lesson suggest error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /:id/vote
router.post('/:id/vote', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can vote on lessons' });
        }
        if (!(await tablesReady())) {
            return res.status(503).json({ error: '5 Minute Lessons is not available yet. Please try again later.' });
        }
        const lessonId = parseInt(req.params.id, 10);
        if (isNaN(lessonId))
            return res.status(400).json({ error: 'Invalid lesson' });
        const student = await getStudentUser(req.user.id);
        const townScope = student ? resolveTownScope(student) : null;
        if (!townScope) {
            return res.status(400).json({ error: 'Your account must be assigned to a town class (6A, 6B, or 6C)' });
        }
        const settings = await getOrCreateSettings(townScope.schoolId, townScope.townClass);
        if (settings.teacher_board_enabled === false) {
            return res.status(400).json({ error: 'The lessons board is currently disabled by your teacher.' });
        }
        if (!(await getStudentPref(req.user.id))) {
            return res.status(400).json({ error: 'Your lessons board is hidden. Turn it on to vote.' });
        }
        const lesson = townScope.schoolId != null
            ? await database_prod_1.default.get('SELECT * FROM five_minute_lessons WHERE id = $1 AND school_id = $2 AND town_class = $3', [lessonId, townScope.schoolId, townScope.townClass])
            : await database_prod_1.default.get('SELECT * FROM five_minute_lessons WHERE id = $1 AND school_id IS NULL AND town_class = $2', [lessonId, townScope.townClass]);
        if (!lesson)
            return res.status(404).json({ error: 'Lesson not found' });
        if (lesson.status !== 'open') {
            return res.status(400).json({ error: 'This lesson is not open for voting' });
        }
        const existing = await database_prod_1.default.get('SELECT id FROM five_minute_lesson_votes WHERE lesson_id = $1 AND user_id = $2', [lessonId, req.user.id]);
        if (existing) {
            return res.status(400).json({ error: 'You have already voted for this lesson' });
        }
        await database_prod_1.default.query('INSERT INTO five_minute_lesson_votes (lesson_id, user_id) VALUES ($1, $2)', [lessonId, req.user.id]);
        const voteCountRow = await database_prod_1.default.get('SELECT COUNT(*)::int AS count FROM five_minute_lesson_votes WHERE lesson_id = $1', [lessonId]);
        res.json({
            success: true,
            lesson_id: lessonId,
            vote_count: parseInt(String(voteCountRow?.count ?? 0), 10),
        });
    }
    catch (error) {
        const pgCode = error?.code;
        if (pgCode === '23505') {
            return res.status(400).json({ error: 'You have already voted for this lesson' });
        }
        console.error('Five minute lesson vote error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /:id/approve — teacher approves and pays reward
router.post('/:id/approve', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        if (!(await tablesReady())) {
            return res.status(503).json({ error: '5 Minute Lessons is not available yet. Please try again later.' });
        }
        const lessonId = parseInt(req.params.id, 10);
        if (isNaN(lessonId))
            return res.status(400).json({ error: 'Invalid lesson' });
        const townClass = req.body?.town_class;
        if (!(0, fiveMinuteLessons_1.isTownClass)(townClass)) {
            return res.status(400).json({ error: 'town_class must be 6A, 6B, or 6C' });
        }
        const schoolId = req.user?.school_id ?? null;
        const lesson = schoolId != null
            ? await database_prod_1.default.get(`SELECT l.*, u.username AS suggester_username
           FROM five_minute_lessons l
           JOIN users u ON u.id = l.suggested_by_user_id
           WHERE l.id = $1 AND l.school_id = $2 AND l.town_class = $3`, [lessonId, schoolId, townClass])
            : await database_prod_1.default.get(`SELECT l.*, u.username AS suggester_username
           FROM five_minute_lessons l
           JOIN users u ON u.id = l.suggested_by_user_id
           WHERE l.id = $1 AND l.school_id IS NULL AND l.town_class = $2`, [lessonId, townClass]);
        if (!lesson)
            return res.status(404).json({ error: 'Lesson not found' });
        if (lesson.status !== 'pending') {
            return res.status(400).json({ error: 'Lesson has already been reviewed' });
        }
        let reward = null;
        if (!lesson.reward_paid) {
            try {
                reward = await paySuggestionReward(lesson.suggested_by_user_id, lesson.suggester_username, lesson.town_class, lesson.school_id ?? null);
            }
            catch (err) {
                if (err instanceof Error && err.message === 'TREASURY_INSUFFICIENT') {
                    return res.status(400).json({
                        error: 'Town treasury has insufficient funds to pay the lesson reward. Add funds before approving.',
                    });
                }
                throw err;
            }
        }
        await database_prod_1.default.query(`UPDATE five_minute_lessons
       SET status = 'open', reward_paid = true, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1
       WHERE id = $2`, [req.user?.id ?? null, lessonId]);
        res.json({
            success: true,
            lesson_id: lessonId,
            status: 'open',
            experience_points: reward?.experience_points ?? 0,
            earnings: reward?.earnings ?? 0,
            new_level: reward?.new_level ?? null,
        });
    }
    catch (error) {
        console.error('Five minute lesson approve error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /:id/deny — teacher denies
router.post('/:id/deny', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        if (!(await tablesReady())) {
            return res.status(503).json({ error: '5 Minute Lessons is not available yet. Please try again later.' });
        }
        const lessonId = parseInt(req.params.id, 10);
        if (isNaN(lessonId))
            return res.status(400).json({ error: 'Invalid lesson' });
        const townClass = req.body?.town_class;
        if (!(0, fiveMinuteLessons_1.isTownClass)(townClass)) {
            return res.status(400).json({ error: 'town_class must be 6A, 6B, or 6C' });
        }
        const denialReason = typeof req.body?.denial_reason === 'string'
            ? req.body.denial_reason.trim().slice(0, 500) || null
            : null;
        const schoolId = req.user?.school_id ?? null;
        const lesson = schoolId != null
            ? await database_prod_1.default.get('SELECT * FROM five_minute_lessons WHERE id = $1 AND school_id = $2 AND town_class = $3', [lessonId, schoolId, townClass])
            : await database_prod_1.default.get('SELECT * FROM five_minute_lessons WHERE id = $1 AND school_id IS NULL AND town_class = $2', [lessonId, townClass]);
        if (!lesson)
            return res.status(404).json({ error: 'Lesson not found' });
        if (lesson.status !== 'pending') {
            return res.status(400).json({ error: 'Lesson has already been reviewed' });
        }
        await database_prod_1.default.query(`UPDATE five_minute_lessons
       SET status = 'denied', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1, denial_reason = $2
       WHERE id = $3`, [req.user?.id ?? null, denialReason, lessonId]);
        res.json({ success: true, lesson_id: lessonId, status: 'denied' });
    }
    catch (error) {
        console.error('Five minute lesson deny error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH /settings
router.patch('/settings', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'User not found' });
        if (!(await tablesReady())) {
            return res.status(503).json({ error: '5 Minute Lessons is not available yet. Please try again later.' });
        }
        if (req.user.role === 'student') {
            if (typeof req.body?.board_visible !== 'boolean') {
                return res.status(400).json({ error: 'board_visible must be true or false' });
            }
            await database_prod_1.default.query(`INSERT INTO five_minute_lesson_student_prefs (user_id, board_visible, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET board_visible = EXCLUDED.board_visible, updated_at = CURRENT_TIMESTAMP`, [req.user.id, req.body.board_visible]);
            return res.json({ student_board_visible: req.body.board_visible });
        }
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const townClass = req.body?.town_class;
        if (!(0, fiveMinuteLessons_1.isTownClass)(townClass)) {
            return res.status(400).json({ error: 'town_class must be 6A, 6B, or 6C' });
        }
        if (typeof req.body?.teacher_board_enabled !== 'boolean') {
            return res.status(400).json({ error: 'teacher_board_enabled must be true or false' });
        }
        const schoolId = req.user.school_id ?? null;
        await getOrCreateSettings(schoolId, townClass);
        if (schoolId != null) {
            await database_prod_1.default.query(`UPDATE five_minute_lesson_settings
         SET teacher_board_enabled = $1, updated_at = CURRENT_TIMESTAMP
         WHERE school_id = $2 AND town_class = $3`, [req.body.teacher_board_enabled, schoolId, townClass]);
        }
        else {
            await database_prod_1.default.query(`UPDATE five_minute_lesson_settings
         SET teacher_board_enabled = $1, updated_at = CURRENT_TIMESTAMP
         WHERE school_id IS NULL AND town_class = $2`, [req.body.teacher_board_enabled, townClass]);
        }
        res.json({ teacher_board_enabled: req.body.teacher_board_enabled, town_class: townClass });
    }
    catch (error) {
        console.error('Five minute lessons settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /:id/close
router.post('/:id/close', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        if (!(await tablesReady())) {
            return res.status(503).json({ error: '5 Minute Lessons is not available yet. Please try again later.' });
        }
        const lessonId = parseInt(req.params.id, 10);
        if (isNaN(lessonId))
            return res.status(400).json({ error: 'Invalid lesson' });
        const townClass = req.body?.town_class;
        if (!(0, fiveMinuteLessons_1.isTownClass)(townClass)) {
            return res.status(400).json({ error: 'town_class must be 6A, 6B, or 6C' });
        }
        const schoolId = req.user?.school_id ?? null;
        const lesson = schoolId != null
            ? await database_prod_1.default.get('SELECT * FROM five_minute_lessons WHERE id = $1 AND school_id = $2 AND town_class = $3', [lessonId, schoolId, townClass])
            : await database_prod_1.default.get('SELECT * FROM five_minute_lessons WHERE id = $1 AND school_id IS NULL AND town_class = $2', [lessonId, townClass]);
        if (!lesson)
            return res.status(404).json({ error: 'Lesson not found' });
        await database_prod_1.default.query(`UPDATE five_minute_lessons SET status = 'closed' WHERE id = $1`, [lessonId]);
        res.json({ success: true, lesson_id: lessonId, status: 'closed' });
    }
    catch (error) {
        console.error('Five minute lesson close error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /:id
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        if (!(await tablesReady())) {
            return res.status(503).json({ error: '5 Minute Lessons is not available yet. Please try again later.' });
        }
        const lessonId = parseInt(req.params.id, 10);
        if (isNaN(lessonId))
            return res.status(400).json({ error: 'Invalid lesson' });
        const townClass = req.query.class;
        if (!(0, fiveMinuteLessons_1.isTownClass)(townClass)) {
            return res.status(400).json({ error: 'Query param class must be 6A, 6B, or 6C' });
        }
        const schoolId = req.user?.school_id ?? null;
        const result = schoolId != null
            ? await database_prod_1.default.run('DELETE FROM five_minute_lessons WHERE id = $1 AND school_id = $2 AND town_class = $3', [lessonId, schoolId, townClass])
            : await database_prod_1.default.run('DELETE FROM five_minute_lessons WHERE id = $1 AND school_id IS NULL AND town_class = $2', [lessonId, townClass]);
        if (!result || result.changes === 0) {
            return res.status(404).json({ error: 'Lesson not found' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Five minute lesson delete error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=five-minute-lessons.js.map