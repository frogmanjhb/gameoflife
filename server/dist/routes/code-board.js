"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
const jobs_1 = require("./jobs");
const codeBoard_1 = require("../domain/codeBoard");
const router = (0, express_1.Router)();
async function tablesReady() {
    try {
        await database_prod_1.default.query('SELECT 1 FROM code_board_apps LIMIT 1');
        return true;
    }
    catch {
        return false;
    }
}
async function getStudentUser(userId) {
    return database_prod_1.default.get(`SELECT u.id, u.class, u.school_id, u.username, u.first_name, u.last_name, u.role, j.name AS job_name
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.id = $1`, [userId]);
}
async function requireSoftwareEngineer(req, res) {
    if (!req.user || req.user.role !== 'student') {
        res.status(403).json({ error: 'Only students can manage the code board' });
        return null;
    }
    const user = await getStudentUser(req.user.id);
    if (!user || !(0, codeBoard_1.hasSoftwareEngineerJob)(user.job_name)) {
        res.status(403).json({ error: 'Only Software Engineers can post apps to the code board' });
        return null;
    }
    if (!(0, codeBoard_1.isTownClass)(user.class)) {
        res.status(400).json({ error: 'Your account must be assigned to a town class (6A, 6B, or 6C)' });
        return null;
    }
    return user;
}
async function getAppById(appId) {
    return database_prod_1.default.get(`SELECT a.*, u.username AS engineer_username, u.first_name AS engineer_first_name, u.last_name AS engineer_last_name
     FROM code_board_apps a
     JOIN users u ON u.id = a.engineer_user_id
     WHERE a.id = $1`, [appId]);
}
function displayName(user) {
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
    return name || user.username || 'Student';
}
async function payCreatorReward(creatorUserId, creatorUsername, townClass, schoolId, xp, earnings, transactionDescription) {
    const currentUser = await database_prod_1.default.get('SELECT job_level, job_experience_points FROM users WHERE id = $1', [creatorUserId]);
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
    if (earnings > 0) {
        const townSettings = schoolId != null
            ? await database_prod_1.default.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id = $2', [townClass, schoolId])
            : await database_prod_1.default.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id IS NULL', [townClass]);
        const treasuryBalance = parseFloat(townSettings?.treasury_balance || '0');
        if (treasuryBalance < earnings) {
            throw new Error('TREASURY_INSUFFICIENT');
        }
    }
    await database_prod_1.default.query('UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3', [newXP, newLevel, creatorUserId]);
    const account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [creatorUserId]);
    if (account && earnings > 0) {
        if (schoolId != null) {
            await database_prod_1.default.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3', [earnings, townClass, schoolId]);
        }
        else {
            await database_prod_1.default.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL', [earnings, townClass]);
        }
        await database_prod_1.default.query(`INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`, [schoolId, townClass, earnings, 'withdrawal', transactionDescription, creatorUserId]);
        await database_prod_1.default.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [earnings, account.id]);
        await database_prod_1.default.query(`INSERT INTO transactions (to_account_id, amount, transaction_type, description)
       VALUES ($1, $2, 'deposit', $3)`, [account.id, earnings, transactionDescription]);
    }
    return { new_level: newLevel > currentLevel ? newLevel : null };
}
function mapAppRow(row, viewerUserId, starredIds, clickedIds) {
    return {
        id: row.id,
        title: row.title,
        url: row.url,
        town_class: row.town_class,
        star_count: row.star_count,
        click_count: row.click_count,
        created_at: row.created_at,
        status: row.status ?? 'approved',
        denial_reason: row.denial_reason ?? null,
        engineer_name: displayName({
            first_name: row.engineer_first_name,
            last_name: row.engineer_last_name,
            username: row.engineer_username,
        }),
        is_own_app: viewerUserId != null && row.engineer_user_id === viewerUserId,
        has_starred: starredIds.has(row.id),
        has_clicked: clickedIds.has(row.id),
    };
}
async function getAppsForSchool(schoolId, viewerUserId) {
    const apps = schoolId != null
        ? await database_prod_1.default.query(`SELECT a.*, u.username AS engineer_username, u.first_name AS engineer_first_name, u.last_name AS engineer_last_name
         FROM code_board_apps a
         JOIN users u ON u.id = a.engineer_user_id
         WHERE a.school_id = $1 AND a.status = 'approved'
         ORDER BY a.town_class, a.created_at DESC`, [schoolId])
        : await database_prod_1.default.query(`SELECT a.*, u.username AS engineer_username, u.first_name AS engineer_first_name, u.last_name AS engineer_last_name
         FROM code_board_apps a
         JOIN users u ON u.id = a.engineer_user_id
         WHERE a.school_id IS NULL AND a.status = 'approved'
         ORDER BY a.town_class, a.created_at DESC`);
    let starredIds = new Set();
    let clickedIds = new Set();
    if (viewerUserId != null && apps.length > 0) {
        const appIds = apps.map((a) => a.id);
        const stars = await database_prod_1.default.query('SELECT app_id FROM code_board_stars WHERE user_id = $1 AND app_id = ANY($2::int[])', [viewerUserId, appIds]);
        const clicks = await database_prod_1.default.query('SELECT app_id FROM code_board_clicks WHERE user_id = $1 AND app_id = ANY($2::int[])', [viewerUserId, appIds]);
        starredIds = new Set(stars.map((s) => s.app_id));
        clickedIds = new Set(clicks.map((c) => c.app_id));
    }
    return apps.map((row) => mapAppRow(row, viewerUserId, starredIds, clickedIds));
}
// GET /manage — software engineer's own apps
router.get('/manage', auth_1.authenticateToken, async (req, res) => {
    try {
        const engineer = await requireSoftwareEngineer(req, res);
        if (!engineer)
            return;
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Code board feature not available yet. Please try again later.' });
        }
        const schoolId = engineer.school_id ?? null;
        const apps = schoolId != null
            ? await database_prod_1.default.query(`SELECT id, title, url, star_count, click_count, status, denial_reason, created_at
           FROM code_board_apps
           WHERE school_id = $1 AND town_class = $2 AND engineer_user_id = $3
           ORDER BY created_at DESC`, [schoolId, engineer.class, engineer.id])
            : await database_prod_1.default.query(`SELECT id, title, url, star_count, click_count, status, denial_reason, created_at
           FROM code_board_apps
           WHERE school_id IS NULL AND town_class = $1 AND engineer_user_id = $2
           ORDER BY created_at DESC`, [engineer.class, engineer.id]);
        res.json({
            apps,
            max_apps: codeBoard_1.MAX_APPS_PER_ENGINEER,
            star_xp_reward: codeBoard_1.STAR_XP_REWARD,
            star_earnings_reward: codeBoard_1.STAR_EARNINGS_REWARD,
            click_xp_reward: codeBoard_1.CLICK_XP_REWARD,
            click_earnings_reward: codeBoard_1.CLICK_EARNINGS_REWARD,
        });
    }
    catch (error) {
        console.error('Code board manage error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /apps — public town view
router.get('/apps', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Code board feature not available yet. Please try again later.' });
        }
        const viewerUserId = req.user.role === 'student' ? req.user.id : null;
        const apps = await getAppsForSchool(req.user.school_id ?? null, viewerUserId);
        res.json({
            apps,
            star_xp_reward: codeBoard_1.STAR_XP_REWARD,
            star_earnings_reward: codeBoard_1.STAR_EARNINGS_REWARD,
            click_xp_reward: codeBoard_1.CLICK_XP_REWARD,
            click_earnings_reward: codeBoard_1.CLICK_EARNINGS_REWARD,
        });
    }
    catch (error) {
        console.error('Code board apps error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /apps — software engineer posts an app link
router.post('/apps', auth_1.authenticateToken, async (req, res) => {
    try {
        const engineer = await requireSoftwareEngineer(req, res);
        if (!engineer)
            return;
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Code board feature not available yet. Please try again later.' });
        }
        const title = (0, codeBoard_1.sanitizeTitle)(req.body?.title);
        const url = (0, codeBoard_1.sanitizeUrl)(req.body?.url);
        if (!title) {
            return res.status(400).json({ error: 'Please provide an app title' });
        }
        if (!url) {
            return res.status(400).json({ error: 'Please provide a valid http or https link' });
        }
        const schoolId = engineer.school_id ?? null;
        const countRow = schoolId != null
            ? await database_prod_1.default.get('SELECT COUNT(*)::int AS count FROM code_board_apps WHERE school_id = $1 AND town_class = $2 AND engineer_user_id = $3', [schoolId, engineer.class, engineer.id])
            : await database_prod_1.default.get('SELECT COUNT(*)::int AS count FROM code_board_apps WHERE school_id IS NULL AND town_class = $1 AND engineer_user_id = $2', [engineer.class, engineer.id]);
        const currentCount = parseInt(String(countRow?.count ?? 0), 10) || 0;
        if (currentCount >= codeBoard_1.MAX_APPS_PER_ENGINEER) {
            return res.status(400).json({ error: `Maximum of ${codeBoard_1.MAX_APPS_PER_ENGINEER} apps allowed on the code board` });
        }
        const rows = await database_prod_1.default.query(`INSERT INTO code_board_apps (school_id, town_class, engineer_user_id, title, url, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, title, url, star_count, click_count, status, denial_reason, created_at`, [schoolId, engineer.class, engineer.id, title, url]);
        res.status(201).json({
            app: rows[0],
            message: 'App submitted for teacher approval. It will appear on the Code Board once approved.',
        });
    }
    catch (error) {
        console.error('Code board post app error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /apps/:id — engineer removes own app; teacher removes student app in town
router.delete('/apps/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Code board feature not available yet. Please try again later.' });
        }
        const appId = parseInt(String(req.params.id), 10);
        if (Number.isNaN(appId)) {
            return res.status(400).json({ error: 'Invalid app id' });
        }
        if (req.user.role === 'teacher') {
            const schoolId = req.user.school_id ?? null;
            const existing = schoolId != null
                ? await database_prod_1.default.get(`SELECT a.id FROM code_board_apps a
             JOIN users u ON u.id = a.engineer_user_id
             WHERE a.id = $1 AND a.school_id = $2 AND u.role = 'student'`, [appId, schoolId])
                : await database_prod_1.default.get(`SELECT a.id FROM code_board_apps a
             JOIN users u ON u.id = a.engineer_user_id
             WHERE a.id = $1 AND a.school_id IS NULL AND u.role = 'student'`, [appId]);
            if (!existing) {
                return res.status(404).json({ error: 'App not found or you cannot delete it' });
            }
            await database_prod_1.default.run('DELETE FROM code_board_apps WHERE id = $1', [appId]);
            return res.json({ success: true });
        }
        const engineer = await requireSoftwareEngineer(req, res);
        if (!engineer)
            return;
        const schoolId = engineer.school_id ?? null;
        const existing = schoolId != null
            ? await database_prod_1.default.get('SELECT id FROM code_board_apps WHERE id = $1 AND school_id = $2 AND town_class = $3 AND engineer_user_id = $4', [appId, schoolId, engineer.class, engineer.id])
            : await database_prod_1.default.get('SELECT id FROM code_board_apps WHERE id = $1 AND school_id IS NULL AND town_class = $2 AND engineer_user_id = $3', [appId, engineer.class, engineer.id]);
        if (!existing) {
            return res.status(404).json({ error: 'App not found or you cannot delete it' });
        }
        await database_prod_1.default.run('DELETE FROM code_board_apps WHERE id = $1', [appId]);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Code board delete app error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /apps/:id/star — student stars an app (once per student per app)
router.post('/apps/:id/star', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can star apps' });
        }
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Code board feature not available yet. Please try again later.' });
        }
        const appId = parseInt(String(req.params.id), 10);
        if (Number.isNaN(appId)) {
            return res.status(400).json({ error: 'Invalid app id' });
        }
        const student = await getStudentUser(req.user.id);
        if (!student || !(0, codeBoard_1.isTownClass)(student.class)) {
            return res.status(400).json({ error: 'Your account must be assigned to a town class (6A, 6B, or 6C)' });
        }
        const app = await getAppById(appId);
        if (!app) {
            return res.status(404).json({ error: 'App not found' });
        }
        if (app.school_id !== (student.school_id ?? null)) {
            return res.status(403).json({ error: 'You can only star apps from your school' });
        }
        if (app.engineer_user_id === student.id) {
            return res.status(400).json({ error: 'You cannot star your own app' });
        }
        if (app.status !== 'approved') {
            return res.status(400).json({ error: 'This app is not published yet' });
        }
        const inserted = await database_prod_1.default.query(`INSERT INTO code_board_stars (app_id, user_id) VALUES ($1, $2)
       ON CONFLICT (app_id, user_id) DO NOTHING RETURNING id`, [appId, student.id]);
        if (!inserted.length) {
            return res.status(400).json({ error: 'You have already starred this app' });
        }
        try {
            await payCreatorReward(app.engineer_user_id, app.engineer_username, app.town_class, app.school_id ?? null, codeBoard_1.STAR_XP_REWARD, codeBoard_1.STAR_EARNINGS_REWARD, `Code Board star on "${app.title}" from ${student.username}`);
        }
        catch (err) {
            await database_prod_1.default.run('DELETE FROM code_board_stars WHERE app_id = $1 AND user_id = $2', [appId, student.id]);
            if (err instanceof Error && err.message === 'TREASURY_INSUFFICIENT') {
                return res.status(400).json({
                    error: 'Town treasury has insufficient funds to pay the app creator. Please contact your teacher.',
                });
            }
            throw err;
        }
        await database_prod_1.default.run('UPDATE code_board_apps SET star_count = star_count + 1 WHERE id = $1', [appId]);
        const updated = await getAppById(appId);
        res.json({
            success: true,
            star_count: updated?.star_count ?? app.star_count + 1,
            creator_xp: codeBoard_1.STAR_XP_REWARD,
            creator_earnings: codeBoard_1.STAR_EARNINGS_REWARD,
        });
    }
    catch (error) {
        console.error('Code board star error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /apps/:id/click — student opens app link (once per student per app)
router.post('/apps/:id/click', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can register app clicks' });
        }
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Code board feature not available yet. Please try again later.' });
        }
        const appId = parseInt(String(req.params.id), 10);
        if (Number.isNaN(appId)) {
            return res.status(400).json({ error: 'Invalid app id' });
        }
        const student = await getStudentUser(req.user.id);
        if (!student || !(0, codeBoard_1.isTownClass)(student.class)) {
            return res.status(400).json({ error: 'Your account must be assigned to a town class (6A, 6B, or 6C)' });
        }
        const app = await getAppById(appId);
        if (!app) {
            return res.status(404).json({ error: 'App not found' });
        }
        if (app.school_id !== (student.school_id ?? null)) {
            return res.status(403).json({ error: 'You can only open apps from your school' });
        }
        if (app.engineer_user_id === student.id) {
            return res.status(400).json({ error: 'You cannot earn click rewards on your own app' });
        }
        if (app.status !== 'approved') {
            return res.status(400).json({ error: 'This app is not published yet' });
        }
        const inserted = await database_prod_1.default.query(`INSERT INTO code_board_clicks (app_id, user_id) VALUES ($1, $2)
       ON CONFLICT (app_id, user_id) DO NOTHING RETURNING id`, [appId, student.id]);
        if (!inserted.length) {
            return res.json({
                success: true,
                already_clicked: true,
                url: app.url,
                click_count: app.click_count,
            });
        }
        try {
            await payCreatorReward(app.engineer_user_id, app.engineer_username, app.town_class, app.school_id ?? null, codeBoard_1.CLICK_XP_REWARD, codeBoard_1.CLICK_EARNINGS_REWARD, `Code Board click on "${app.title}" from ${student.username}`);
        }
        catch (err) {
            await database_prod_1.default.run('DELETE FROM code_board_clicks WHERE app_id = $1 AND user_id = $2', [appId, student.id]);
            if (err instanceof Error && err.message === 'TREASURY_INSUFFICIENT') {
                return res.status(400).json({
                    error: 'Town treasury has insufficient funds to pay the app creator. Please contact your teacher.',
                });
            }
            throw err;
        }
        await database_prod_1.default.run('UPDATE code_board_apps SET click_count = click_count + 1 WHERE id = $1', [appId]);
        const updated = await getAppById(appId);
        res.json({
            success: true,
            already_clicked: false,
            url: app.url,
            click_count: updated?.click_count ?? app.click_count + 1,
            creator_xp: codeBoard_1.CLICK_XP_REWARD,
            creator_earnings: codeBoard_1.CLICK_EARNINGS_REWARD,
        });
    }
    catch (error) {
        console.error('Code board click error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=code-board.js.map