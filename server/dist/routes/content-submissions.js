"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const contentApproval_1 = require("../domain/contentApproval");
const townNews_1 = require("../domain/townNews");
const townNewsPopup_1 = require("../domain/townNewsPopup");
const townNewsWidgets_1 = require("../domain/townNewsWidgets");
const router = (0, express_1.Router)();
function displayName(user) {
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
    return name || user.username || 'Student';
}
async function tablesReady() {
    try {
        await database_prod_1.default.query('SELECT 1 FROM town_news_stories LIMIT 1');
        await database_prod_1.default.query('SELECT 1 FROM code_board_apps LIMIT 1');
        return true;
    }
    catch {
        return false;
    }
}
async function popupsTableReady() {
    try {
        await database_prod_1.default.query('SELECT 1 FROM town_news_popups LIMIT 1');
        return true;
    }
    catch {
        return false;
    }
}
function schoolFilterClause(alias, paramIndex) {
    return `((${alias}.school_id = $${paramIndex}) OR ($${paramIndex} IS NULL AND ${alias}.school_id IS NULL))`;
}
// GET /pending — teacher review queue
router.get('/pending', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Content submissions are not available yet. Please try again later.' });
        }
        const schoolId = req.schoolId ?? req.user?.school_id ?? null;
        const newsStories = await database_prod_1.default.query(`SELECT s.id, s.headline, s.body, s.image_data, s.widgets, s.town_class, s.status, s.created_at,
              u.username AS submitter_username, u.first_name AS submitter_first_name, u.last_name AS submitter_last_name
       FROM town_news_stories s
       JOIN users u ON u.id = s.journalist_user_id
       WHERE ${schoolFilterClause('s', 1)} AND s.status = 'pending'
       ORDER BY s.created_at ASC`, [schoolId]);
        const codeApps = await database_prod_1.default.query(`SELECT a.id, a.title, a.url, a.town_class, a.status, a.created_at,
              u.username AS submitter_username, u.first_name AS submitter_first_name, u.last_name AS submitter_last_name
       FROM code_board_apps a
       JOIN users u ON u.id = a.engineer_user_id
       WHERE ${schoolFilterClause('a', 1)} AND a.status = 'pending'
       ORDER BY a.created_at ASC`, [schoolId]);
        let newsPopups = [];
        if (await popupsTableReady()) {
            newsPopups = await database_prod_1.default.query(`SELECT p.id, p.headline, p.body, p.image_data, p.town_class, p.status, p.created_at,
                u.username AS submitter_username, u.first_name AS submitter_first_name, u.last_name AS submitter_last_name
         FROM town_news_popups p
         JOIN users u ON u.id = p.creator_user_id
         WHERE ${schoolFilterClause('p', 1)} AND p.status = 'pending'
         ORDER BY p.created_at ASC`, [schoolId]);
        }
        const mapNews = newsStories.map((row) => ({
            id: row.id,
            headline: row.headline,
            body: row.body,
            image_data: row.image_data ?? null,
            widgets: (0, townNewsWidgets_1.parseTownNewsWidgetsFromDb)(row.widgets),
            town_class: row.town_class,
            status: row.status,
            created_at: row.created_at,
            submitter_name: displayName({
                username: row.submitter_username,
                first_name: row.submitter_first_name,
                last_name: row.submitter_last_name,
            }),
            submitter_username: row.submitter_username,
        }));
        const mapApps = codeApps.map((row) => ({
            id: row.id,
            title: row.title,
            url: row.url,
            town_class: row.town_class,
            status: row.status,
            created_at: row.created_at,
            submitter_name: displayName({
                username: row.submitter_username,
                first_name: row.submitter_first_name,
                last_name: row.submitter_last_name,
            }),
            submitter_username: row.submitter_username,
        }));
        const mapPopups = newsPopups.map((row) => ({
            id: row.id,
            headline: row.headline,
            body: row.body,
            image_data: row.image_data ?? null,
            town_class: row.town_class,
            status: row.status,
            created_at: row.created_at,
            submitter_name: displayName({
                username: row.submitter_username,
                first_name: row.submitter_first_name,
                last_name: row.submitter_last_name,
            }),
            submitter_username: row.submitter_username,
        }));
        res.json({
            news_stories: mapNews,
            news_popups: mapPopups,
            code_apps: mapApps,
            pending_count: mapNews.length + mapPopups.length + mapApps.length,
            story_xp_reward: townNews_1.STORY_XP_REWARD,
            story_earnings_reward: townNews_1.STORY_EARNINGS_REWARD,
            popup_ad_cost: townNewsPopup_1.POPUP_AD_COST,
        });
    }
    catch (error) {
        console.error('Content submissions pending error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /news/:id/review — approve or deny a news story
router.post('/news/:id/review', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Content submissions are not available yet. Please try again later.' });
        }
        const storyId = parseInt(String(req.params.id), 10);
        if (Number.isNaN(storyId)) {
            return res.status(400).json({ error: 'Invalid story id' });
        }
        const { status, denial_reason } = req.body ?? {};
        if (!(0, contentApproval_1.isReviewStatus)(status)) {
            return res.status(400).json({ error: 'status must be approved or denied' });
        }
        const schoolId = req.schoolId ?? req.user?.school_id ?? null;
        const story = await database_prod_1.default.get(`SELECT s.*, u.username AS journalist_username
       FROM town_news_stories s
       JOIN users u ON u.id = s.journalist_user_id
       WHERE s.id = $1 AND ${schoolFilterClause('s', 2)}`, [storyId, schoolId]);
        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }
        if (story.status !== 'pending') {
            return res.status(400).json({ error: 'Story has already been reviewed' });
        }
        if (status === 'approved') {
            try {
                await (0, townNews_1.payStorySubmissionReward)(story.journalist_user_id, story.journalist_username, story.town_class, story.school_id ?? null, story.headline);
            }
            catch (err) {
                if (err instanceof Error && err.message === 'TREASURY_INSUFFICIENT') {
                    return res.status(400).json({
                        error: 'Town treasury has insufficient funds to pay the journalist. Add funds before approving.',
                    });
                }
                throw err;
            }
        }
        await database_prod_1.default.run(`UPDATE town_news_stories
       SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2, denial_reason = $3
       WHERE id = $4`, [status, req.user?.id ?? null, status === 'denied' ? (denial_reason || null) : null, storyId]);
        res.json({ success: true, status });
    }
    catch (error) {
        console.error('Review news story error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /popups/:id/review — approve or deny a login pop-up ad
router.post('/popups/:id/review', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        if (!(await popupsTableReady())) {
            return res.status(503).json({ error: 'Login pop-up ads are not available yet. Please try again later.' });
        }
        const popupId = parseInt(String(req.params.id), 10);
        if (Number.isNaN(popupId)) {
            return res.status(400).json({ error: 'Invalid pop-up id' });
        }
        const { status, denial_reason } = req.body ?? {};
        if (!(0, contentApproval_1.isReviewStatus)(status)) {
            return res.status(400).json({ error: 'status must be approved or denied' });
        }
        const schoolId = req.schoolId ?? req.user?.school_id ?? null;
        const popup = await database_prod_1.default.get(`SELECT p.*, u.username AS creator_username
       FROM town_news_popups p
       JOIN users u ON u.id = p.creator_user_id
       WHERE p.id = $1 AND ${schoolFilterClause('p', 2)}`, [popupId, schoolId]);
        if (!popup) {
            return res.status(404).json({ error: 'Pop-up not found' });
        }
        if (popup.status !== 'pending') {
            return res.status(400).json({ error: 'Pop-up has already been reviewed' });
        }
        if (status === 'approved') {
            try {
                await (0, townNewsPopup_1.chargePopupAdFee)(popup.creator_user_id, popup.creator_username, popup.town_class, popup.school_id ?? null, popup.headline);
            }
            catch (err) {
                if (err instanceof Error && err.message === 'INSUFFICIENT_FUNDS') {
                    return res.status(400).json({
                        error: `The student does not have enough funds (R${townNewsPopup_1.POPUP_AD_COST.toLocaleString()} required). They must top up before you can approve.`,
                    });
                }
                if (err instanceof Error && err.message === 'NO_ACCOUNT') {
                    return res.status(400).json({ error: 'The student does not have a bank account.' });
                }
                throw err;
            }
        }
        await database_prod_1.default.run(`UPDATE town_news_popups
       SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2, denial_reason = $3,
           payment_charged = $4
       WHERE id = $5`, [
            status,
            req.user?.id ?? null,
            status === 'denied' ? (denial_reason || null) : null,
            status === 'approved',
            popupId,
        ]);
        res.json({ success: true, status });
    }
    catch (error) {
        console.error('Review news popup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /apps/:id/review — approve or deny a code board app
router.post('/apps/:id/review', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Content submissions are not available yet. Please try again later.' });
        }
        const appId = parseInt(String(req.params.id), 10);
        if (Number.isNaN(appId)) {
            return res.status(400).json({ error: 'Invalid app id' });
        }
        const { status, denial_reason } = req.body ?? {};
        if (!(0, contentApproval_1.isReviewStatus)(status)) {
            return res.status(400).json({ error: 'status must be approved or denied' });
        }
        const schoolId = req.schoolId ?? req.user?.school_id ?? null;
        const app = await database_prod_1.default.get(`SELECT a.*
       FROM code_board_apps a
       WHERE a.id = $1 AND ${schoolFilterClause('a', 2)}`, [appId, schoolId]);
        if (!app) {
            return res.status(404).json({ error: 'App not found' });
        }
        if (app.status !== 'pending') {
            return res.status(400).json({ error: 'App has already been reviewed' });
        }
        await database_prod_1.default.run(`UPDATE code_board_apps
       SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2, denial_reason = $3
       WHERE id = $4`, [status, req.user?.id ?? null, status === 'denied' ? (denial_reason || null) : null, appId]);
        res.json({ success: true, status });
    }
    catch (error) {
        console.error('Review code app error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=content-submissions.js.map