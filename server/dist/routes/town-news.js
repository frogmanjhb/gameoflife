"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
const townNews_1 = require("../domain/townNews");
const townNewsWidgets_1 = require("../domain/townNewsWidgets");
const townScope_1 = require("../domain/townScope");
const townNewsPopup_1 = require("../domain/townNewsPopup");
const router = (0, express_1.Router)();
async function popupsTableReady() {
    try {
        await database_prod_1.default.query('SELECT 1 FROM town_news_popups LIMIT 1');
        return true;
    }
    catch {
        return false;
    }
}
async function tablesReady() {
    try {
        await database_prod_1.default.query('SELECT 1 FROM town_news_stories LIMIT 1');
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
async function requireTownNewsContributor(req, res) {
    if (!req.user || req.user.role !== 'student') {
        res.status(403).json({ error: 'Only students can submit town news stories' });
        return null;
    }
    const user = await getStudentUser(req.user.id);
    if (!user || !(0, townNews_1.canSubmitTownNews)(user.job_name)) {
        res.status(403).json({
            error: 'Only Journalists, Graphic Designers, and Entrepreneurs can submit to the Town News Board',
        });
        return null;
    }
    if (!(0, townNews_1.isTownClass)(user.class)) {
        res.status(400).json({ error: 'Your account must be assigned to a town class (6A, 6B, or 6C)' });
        return null;
    }
    return user;
}
function displayName(user) {
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
    return name || user.username || 'Journalist';
}
function mapStoryRow(row) {
    return {
        id: row.id,
        headline: row.headline,
        body: row.body,
        image_data: row.image_data ?? null,
        widgets: (0, townNewsWidgets_1.parseTownNewsWidgetsFromDb)(row.widgets),
        created_at: row.created_at,
        status: row.status ?? 'approved',
        denial_reason: row.denial_reason ?? null,
        journalist_name: row.journalist_username
            ? displayName({
                first_name: row.journalist_first_name,
                last_name: row.journalist_last_name,
                username: row.journalist_username,
            })
            : undefined,
    };
}
const STORY_SELECT = `SELECT s.*, u.username AS journalist_username, u.first_name AS journalist_first_name, u.last_name AS journalist_last_name
         FROM town_news_stories s
         JOIN users u ON u.id = s.journalist_user_id`;
const approvedStoryScope = (schoolId, townClass, alias = 's') => schoolId != null
    ? `${alias}.school_id = $1 AND ${alias}.town_class = $2 AND ${alias}.status = 'approved'`
    : `${alias}.school_id IS NULL AND ${alias}.town_class = $1 AND ${alias}.status = 'approved'`;
async function hasOlderApprovedStories(schoolId, townClass) {
    const scope = approvedStoryScope(schoolId, townClass);
    const row = schoolId != null
        ? await database_prod_1.default.get(`SELECT COUNT(*)::int AS older_count
         FROM town_news_stories s
         WHERE ${scope}
           AND s.created_at < (${townNews_1.TOWN_NEWS_DAY_START_SQL})`, [schoolId, townClass])
        : await database_prod_1.default.get(`SELECT COUNT(*)::int AS older_count
         FROM town_news_stories s
         WHERE ${scope}
           AND s.created_at < (${townNews_1.TOWN_NEWS_DAY_START_SQL})`, [townClass]);
    return Number(row?.older_count ?? 0) > 0;
}
async function getApprovedStoriesForTown(schoolId, townClass, options = {}) {
    const { beforeId, olderOnly } = options;
    const pageSize = townNews_1.TOWN_NEWS_STORIES_PAGE_SIZE;
    if (beforeId != null || olderOnly) {
        const limit = pageSize + 1;
        const rows = schoolId != null
            ? beforeId != null
                ? await database_prod_1.default.query(`${STORY_SELECT}
         WHERE s.school_id = $1 AND s.town_class = $2 AND s.status = 'approved' AND s.id < $3
         ORDER BY s.created_at DESC, s.id DESC
         LIMIT $4`, [schoolId, townClass, beforeId, limit])
                : await database_prod_1.default.query(`${STORY_SELECT}
         WHERE s.school_id = $1 AND s.town_class = $2 AND s.status = 'approved'
           AND s.created_at < (${townNews_1.TOWN_NEWS_DAY_START_SQL})
         ORDER BY s.created_at DESC, s.id DESC
         LIMIT $3`, [schoolId, townClass, limit])
            : beforeId != null
                ? await database_prod_1.default.query(`${STORY_SELECT}
         WHERE s.school_id IS NULL AND s.town_class = $1 AND s.status = 'approved' AND s.id < $2
         ORDER BY s.created_at DESC, s.id DESC
         LIMIT $3`, [townClass, beforeId, limit])
                : await database_prod_1.default.query(`${STORY_SELECT}
         WHERE s.school_id IS NULL AND s.town_class = $1 AND s.status = 'approved'
           AND s.created_at < (${townNews_1.TOWN_NEWS_DAY_START_SQL})
         ORDER BY s.created_at DESC, s.id DESC
         LIMIT $2`, [townClass, limit]);
        const hasMore = rows.length > pageSize;
        const page = hasMore ? rows.slice(0, pageSize) : rows;
        return {
            stories: page.map((row) => mapStoryRow(row)),
            has_more: hasMore,
        };
    }
    const rows = schoolId != null
        ? await database_prod_1.default.query(`${STORY_SELECT}
         WHERE s.school_id = $1 AND s.town_class = $2 AND s.status = 'approved'
           AND s.created_at >= (${townNews_1.TOWN_NEWS_DAY_START_SQL})
         ORDER BY s.created_at DESC, s.id DESC
         LIMIT $3`, [schoolId, townClass, pageSize + 1])
        : await database_prod_1.default.query(`${STORY_SELECT}
         WHERE s.school_id IS NULL AND s.town_class = $1 AND s.status = 'approved'
           AND s.created_at >= (${townNews_1.TOWN_NEWS_DAY_START_SQL})
         ORDER BY s.created_at DESC, s.id DESC
         LIMIT $2`, [townClass, pageSize + 1]);
    const hasMoreToday = rows.length > pageSize;
    const page = hasMoreToday ? rows.slice(0, pageSize) : rows;
    return {
        stories: page.map((row) => mapStoryRow(row)),
        has_more: hasMoreToday || (await hasOlderApprovedStories(schoolId, townClass)),
    };
}
// GET /manage — journalist / graphic designer view
router.get('/manage', auth_1.authenticateToken, async (req, res) => {
    try {
        const contributor = await requireTownNewsContributor(req, res);
        if (!contributor)
            return;
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Town News Board is not available yet. Please try again later.' });
        }
        const schoolId = contributor.school_id ?? null;
        const rows = schoolId != null
            ? await database_prod_1.default.query(`SELECT id, headline, body, image_data, widgets, status, denial_reason, created_at
           FROM town_news_stories
           WHERE school_id = $1 AND town_class = $2 AND journalist_user_id = $3
           ORDER BY created_at DESC`, [schoolId, contributor.class, contributor.id])
            : await database_prod_1.default.query(`SELECT id, headline, body, image_data, widgets, status, denial_reason, created_at
           FROM town_news_stories
           WHERE school_id IS NULL AND town_class = $1 AND journalist_user_id = $2
           ORDER BY created_at DESC`, [contributor.class, contributor.id]);
        const postQuota = await (0, townNews_1.getStoryPostQuota)(contributor.id);
        res.json({
            stories: rows.map((row) => mapStoryRow(row)),
            story_xp_reward: townNews_1.STORY_XP_REWARD,
            story_earnings_reward: townNews_1.STORY_EARNINGS_REWARD,
            remaining_posts: postQuota.remaining_posts,
            daily_post_limit: postQuota.daily_post_limit,
        });
    }
    catch (error) {
        console.error('Town news manage error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /stories — public town feed (approved only)
router.get('/stories', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Town News Board is not available yet. Please try again later.' });
        }
        const townClass = (0, townScope_1.resolveViewerTownClass)(req.user, req.query.class);
        if (!townClass) {
            return res.status(400).json({ error: (0, townScope_1.viewerTownClassError)(req.user.role) });
        }
        const beforeIdRaw = req.query.before_id;
        const beforeId = beforeIdRaw != null && String(beforeIdRaw).trim() !== ''
            ? parseInt(String(beforeIdRaw), 10)
            : undefined;
        if (beforeId != null && (!Number.isFinite(beforeId) || beforeId < 1)) {
            return res.status(400).json({ error: 'Invalid before_id' });
        }
        const olderOnly = req.query.scope === 'older';
        const { stories, has_more } = await getApprovedStoriesForTown(req.user.school_id ?? null, townClass, {
            beforeId,
            olderOnly,
        });
        res.json({ stories, has_more });
    }
    catch (error) {
        console.error('Town news stories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /stories — journalist or graphic designer submits (pending teacher approval)
router.post('/stories', auth_1.authenticateToken, async (req, res) => {
    try {
        const contributor = await requireTownNewsContributor(req, res);
        if (!contributor)
            return;
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Town News Board is not available yet. Please try again later.' });
        }
        const headline = (0, townNews_1.sanitizeHeadline)(req.body?.headline);
        const body = (0, townNews_1.sanitizeBody)(req.body?.body);
        const imageRaw = req.body?.image_data;
        let image_data = null;
        if (imageRaw != null && imageRaw !== '') {
            image_data = (0, townNews_1.sanitizeOptionalImage)(imageRaw);
            if (!image_data) {
                return res.status(400).json({ error: 'Please upload a valid image (JPEG, PNG, WebP, or GIF under 2 MB)' });
            }
        }
        if (!headline) {
            return res.status(400).json({ error: 'Please provide a headline' });
        }
        if (!body) {
            return res.status(400).json({ error: 'Please write your story' });
        }
        const postQuota = await (0, townNews_1.getStoryPostQuota)(contributor.id);
        if (postQuota.remaining_posts <= 0) {
            return res.status(400).json({
                error: 'You have reached your daily limit of 2 Town News posts. Try again tomorrow.',
            });
        }
        const widgets = (0, townNewsWidgets_1.sanitizeTownNewsWidgets)(req.body?.widgets);
        const widgetsJson = (0, townNewsWidgets_1.widgetsToJson)(widgets);
        const schoolId = contributor.school_id ?? null;
        const townClass = contributor.class;
        const rows = await database_prod_1.default.query(`INSERT INTO town_news_stories (school_id, town_class, journalist_user_id, headline, body, image_data, widgets, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, 'pending')
       RETURNING id, headline, body, image_data, widgets, status, denial_reason, created_at`, [schoolId, townClass, contributor.id, headline, body, image_data, widgetsJson]);
        res.status(201).json({
            story: mapStoryRow(rows[0]),
            message: 'Story submitted for teacher approval. You will earn XP and payment once it is approved.',
        });
    }
    catch (error) {
        console.error('Town news submit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /stories/:id — contributor removes own story; teacher removes student story in town
router.delete('/stories/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        if (!(await tablesReady())) {
            return res.status(503).json({ error: 'Town News Board is not available yet. Please try again later.' });
        }
        const storyId = parseInt(String(req.params.id), 10);
        if (Number.isNaN(storyId)) {
            return res.status(400).json({ error: 'Invalid story id' });
        }
        if (req.user.role === 'teacher') {
            const townClass = (0, townScope_1.resolveViewerTownClass)(req.user, req.query.class);
            if (!townClass) {
                return res.status(400).json({ error: (0, townScope_1.viewerTownClassError)(req.user.role) });
            }
            const schoolId = req.user.school_id ?? null;
            const existing = schoolId != null
                ? await database_prod_1.default.get(`SELECT s.id FROM town_news_stories s
             JOIN users u ON u.id = s.journalist_user_id
             WHERE s.id = $1 AND s.school_id = $2 AND s.town_class = $3 AND u.role = 'student'`, [storyId, schoolId, townClass])
                : await database_prod_1.default.get(`SELECT s.id FROM town_news_stories s
             JOIN users u ON u.id = s.journalist_user_id
             WHERE s.id = $1 AND s.school_id IS NULL AND s.town_class = $2 AND u.role = 'student'`, [storyId, townClass]);
            if (!existing) {
                return res.status(404).json({ error: 'Story not found or you cannot delete it' });
            }
            await database_prod_1.default.run('DELETE FROM town_news_stories WHERE id = $1', [storyId]);
            return res.json({ success: true });
        }
        const contributor = await requireTownNewsContributor(req, res);
        if (!contributor)
            return;
        const schoolId = contributor.school_id ?? null;
        const existing = schoolId != null
            ? await database_prod_1.default.get('SELECT id FROM town_news_stories WHERE id = $1 AND school_id = $2 AND town_class = $3 AND journalist_user_id = $4', [storyId, schoolId, contributor.class, contributor.id])
            : await database_prod_1.default.get('SELECT id FROM town_news_stories WHERE id = $1 AND school_id IS NULL AND town_class = $2 AND journalist_user_id = $3', [storyId, contributor.class, contributor.id]);
        if (!existing) {
            return res.status(404).json({ error: 'Story not found or you cannot delete it' });
        }
        await database_prod_1.default.run('DELETE FROM town_news_stories WHERE id = $1', [storyId]);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Town news delete error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
function mapPopupRow(row) {
    return {
        id: row.id,
        headline: row.headline,
        body: row.body,
        image_data: row.image_data ?? null,
        created_at: row.created_at,
        status: row.status ?? 'approved',
        denial_reason: row.denial_reason ?? null,
        payment_charged: row.payment_charged ?? false,
    };
}
// GET /popups/manage — contributor view of login pop-up ads
router.get('/popups/manage', auth_1.authenticateToken, async (req, res) => {
    try {
        const contributor = await requireTownNewsContributor(req, res);
        if (!contributor)
            return;
        if (!(await popupsTableReady())) {
            return res.status(503).json({ error: 'Login pop-up ads are not available yet. Please try again later.' });
        }
        const schoolId = contributor.school_id ?? null;
        const rows = schoolId != null
            ? await database_prod_1.default.query(`SELECT id, headline, body, image_data, status, denial_reason, payment_charged, created_at
           FROM town_news_popups
           WHERE school_id = $1 AND town_class = $2 AND creator_user_id = $3
           ORDER BY created_at DESC`, [schoolId, contributor.class, contributor.id])
            : await database_prod_1.default.query(`SELECT id, headline, body, image_data, status, denial_reason, payment_charged, created_at
           FROM town_news_popups
           WHERE school_id IS NULL AND town_class = $1 AND creator_user_id = $2
           ORDER BY created_at DESC`, [contributor.class, contributor.id]);
        res.json({
            popups: rows.map((row) => mapPopupRow(row)),
            popup_ad_cost: townNewsPopup_1.POPUP_AD_COST,
        });
    }
    catch (error) {
        console.error('Town news popups manage error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /popups/active — undismissed approved pop-up for the logged-in student
router.get('/popups/active', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.json({ popup: null });
        }
        if (!(await popupsTableReady())) {
            return res.json({ popup: null });
        }
        if (!(0, townNews_1.isTownClass)(req.user.class)) {
            return res.json({ popup: null });
        }
        const schoolId = req.user.school_id ?? null;
        const townClass = req.user.class;
        const userId = req.user.id;
        const row = schoolId != null
            ? await database_prod_1.default.get(`SELECT p.id, p.headline, p.body, p.image_data, p.created_at
           FROM town_news_popups p
           WHERE p.school_id = $1 AND p.town_class = $2 AND p.status = 'approved'
             AND NOT EXISTS (
               SELECT 1 FROM town_news_popup_dismissals d
               WHERE d.popup_id = p.id AND d.user_id = $3
             )
           ORDER BY p.reviewed_at DESC NULLS LAST, p.created_at DESC
           LIMIT 1`, [schoolId, townClass, userId])
            : await database_prod_1.default.get(`SELECT p.id, p.headline, p.body, p.image_data, p.created_at
           FROM town_news_popups p
           WHERE p.school_id IS NULL AND p.town_class = $1 AND p.status = 'approved'
             AND NOT EXISTS (
               SELECT 1 FROM town_news_popup_dismissals d
               WHERE d.popup_id = p.id AND d.user_id = $2
             )
           ORDER BY p.reviewed_at DESC NULLS LAST, p.created_at DESC
           LIMIT 1`, [townClass, userId]);
        res.json({ popup: row ? mapPopupRow(row) : null });
    }
    catch (error) {
        console.error('Town news active popup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /popups — submit login pop-up ad (pending teacher approval)
router.post('/popups', auth_1.authenticateToken, async (req, res) => {
    try {
        const contributor = await requireTownNewsContributor(req, res);
        if (!contributor)
            return;
        if (!(await popupsTableReady())) {
            return res.status(503).json({ error: 'Login pop-up ads are not available yet. Please try again later.' });
        }
        const headline = (0, townNews_1.sanitizeHeadline)(req.body?.headline);
        const body = (0, townNews_1.sanitizeBody)(req.body?.body);
        const imageRaw = req.body?.image_data;
        let image_data = null;
        if (imageRaw != null && imageRaw !== '') {
            image_data = (0, townNews_1.sanitizeOptionalImage)(imageRaw);
            if (!image_data) {
                return res.status(400).json({ error: 'Please upload a valid image (JPEG, PNG, WebP, or GIF under 2 MB)' });
            }
        }
        if (!headline) {
            return res.status(400).json({ error: 'Please provide a headline' });
        }
        if (!body) {
            return res.status(400).json({ error: 'Please write your advertisement message' });
        }
        const schoolId = contributor.school_id ?? null;
        const townClass = contributor.class;
        const rows = await database_prod_1.default.query(`INSERT INTO town_news_popups (school_id, town_class, creator_user_id, headline, body, image_data, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, headline, body, image_data, status, denial_reason, payment_charged, created_at`, [schoolId, townClass, contributor.id, headline, body, image_data]);
        res.status(201).json({
            popup: mapPopupRow(rows[0]),
            message: `Pop-up submitted for teacher approval. R${townNewsPopup_1.POPUP_AD_COST.toLocaleString()} will be charged from your account once approved.`,
        });
    }
    catch (error) {
        console.error('Town news popup submit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /popups/:id/dismiss — student closes a pop-up
router.post('/popups/:id/dismiss', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can dismiss pop-ups' });
        }
        if (!(await popupsTableReady())) {
            return res.status(503).json({ error: 'Login pop-up ads are not available yet. Please try again later.' });
        }
        const popupId = parseInt(String(req.params.id), 10);
        if (Number.isNaN(popupId)) {
            return res.status(400).json({ error: 'Invalid pop-up id' });
        }
        const schoolId = req.user.school_id ?? null;
        const townClass = req.user.class;
        if (!(0, townNews_1.isTownClass)(townClass)) {
            return res.status(400).json({ error: 'Your account must be assigned to a town class (6A, 6B, or 6C)' });
        }
        const popup = schoolId != null
            ? await database_prod_1.default.get(`SELECT id FROM town_news_popups
           WHERE id = $1 AND school_id = $2 AND town_class = $3 AND status = 'approved'`, [popupId, schoolId, townClass])
            : await database_prod_1.default.get(`SELECT id FROM town_news_popups
           WHERE id = $1 AND school_id IS NULL AND town_class = $2 AND status = 'approved'`, [popupId, townClass]);
        if (!popup) {
            return res.status(404).json({ error: 'Pop-up not found' });
        }
        await database_prod_1.default.run(`INSERT INTO town_news_popup_dismissals (popup_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (popup_id, user_id) DO NOTHING`, [popupId, req.user.id]);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Town news popup dismiss error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /popups/:id — contributor removes own pending or denied pop-up
router.delete('/popups/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const contributor = await requireTownNewsContributor(req, res);
        if (!contributor)
            return;
        if (!(await popupsTableReady())) {
            return res.status(503).json({ error: 'Login pop-up ads are not available yet. Please try again later.' });
        }
        const popupId = parseInt(String(req.params.id), 10);
        if (Number.isNaN(popupId)) {
            return res.status(400).json({ error: 'Invalid pop-up id' });
        }
        const schoolId = contributor.school_id ?? null;
        const existing = schoolId != null
            ? await database_prod_1.default.get(`SELECT id, status FROM town_news_popups
           WHERE id = $1 AND school_id = $2 AND town_class = $3 AND creator_user_id = $4`, [popupId, schoolId, contributor.class, contributor.id])
            : await database_prod_1.default.get(`SELECT id, status FROM town_news_popups
           WHERE id = $1 AND school_id IS NULL AND town_class = $2 AND creator_user_id = $3`, [popupId, contributor.class, contributor.id]);
        if (!existing) {
            return res.status(404).json({ error: 'Pop-up not found or you cannot delete it' });
        }
        if (existing.status === 'approved') {
            return res.status(400).json({ error: 'Approved pop-ups cannot be removed' });
        }
        await database_prod_1.default.run('DELETE FROM town_news_popups WHERE id = $1', [popupId]);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Town news popup delete error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=town-news.js.map