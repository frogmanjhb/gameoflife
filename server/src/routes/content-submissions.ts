import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { isReviewStatus } from '../domain/contentApproval';
import { payStorySubmissionReward, STORY_EARNINGS_REWARD, STORY_XP_REWARD } from '../domain/townNews';
import { chargePopupAdFee, POPUP_AD_COST } from '../domain/townNewsPopup';
import { parseTownNewsWidgetsFromDb } from '../domain/townNewsWidgets';

const router = Router();

function displayName(user: { first_name?: string; last_name?: string; username?: string }) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
  return name || user.username || 'Student';
}

async function tablesReady(): Promise<boolean> {
  try {
    await database.query('SELECT 1 FROM town_news_stories LIMIT 1');
    await database.query('SELECT 1 FROM code_board_apps LIMIT 1');
    return true;
  } catch {
    return false;
  }
}

async function popupsTableReady(): Promise<boolean> {
  try {
    await database.query('SELECT 1 FROM town_news_popups LIMIT 1');
    return true;
  } catch {
    return false;
  }
}

function schoolFilterClause(alias: string, paramIndex: number): string {
  return `((${alias}.school_id = $${paramIndex}) OR ($${paramIndex} IS NULL AND ${alias}.school_id IS NULL))`;
}

// GET /pending — teacher review queue
router.get('/pending', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!(await tablesReady())) {
      return res.status(503).json({ error: 'Content submissions are not available yet. Please try again later.' });
    }

    const schoolId = req.schoolId ?? req.user?.school_id ?? null;

    const newsStories = await database.query(
      `SELECT s.id, s.headline, s.body, s.image_data, s.widgets, s.town_class, s.status, s.created_at,
              u.username AS submitter_username, u.first_name AS submitter_first_name, u.last_name AS submitter_last_name
       FROM town_news_stories s
       JOIN users u ON u.id = s.journalist_user_id
       WHERE ${schoolFilterClause('s', 1)} AND s.status = 'pending'
       ORDER BY s.created_at ASC`,
      [schoolId]
    );

    const codeApps = await database.query(
      `SELECT a.id, a.title, a.url, a.town_class, a.status, a.created_at,
              u.username AS submitter_username, u.first_name AS submitter_first_name, u.last_name AS submitter_last_name
       FROM code_board_apps a
       JOIN users u ON u.id = a.engineer_user_id
       WHERE ${schoolFilterClause('a', 1)} AND a.status = 'pending'
       ORDER BY a.created_at ASC`,
      [schoolId]
    );

    let newsPopups: Array<{
      id: number;
      headline: string;
      body: string;
      image_data?: string | null;
      town_class: string;
      status: string;
      created_at: string;
      submitter_username: string;
      submitter_first_name?: string;
      submitter_last_name?: string;
    }> = [];
    if (await popupsTableReady()) {
      newsPopups = await database.query(
        `SELECT p.id, p.headline, p.body, p.image_data, p.town_class, p.status, p.created_at,
                u.username AS submitter_username, u.first_name AS submitter_first_name, u.last_name AS submitter_last_name
         FROM town_news_popups p
         JOIN users u ON u.id = p.creator_user_id
         WHERE ${schoolFilterClause('p', 1)} AND p.status = 'pending'
         ORDER BY p.created_at ASC`,
        [schoolId]
      );
    }

    const mapNews = newsStories.map((row: {
      id: number;
      headline: string;
      body: string;
      image_data?: string | null;
      widgets?: unknown;
      town_class: string;
      status: string;
      created_at: string;
      submitter_username: string;
      submitter_first_name?: string;
      submitter_last_name?: string;
    }) => ({
      id: row.id,
      headline: row.headline,
      body: row.body,
      image_data: row.image_data ?? null,
      widgets: parseTownNewsWidgetsFromDb(row.widgets),
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

    const mapApps = codeApps.map((row: {
      id: number;
      title: string;
      url: string;
      town_class: string;
      status: string;
      created_at: string;
      submitter_username: string;
      submitter_first_name?: string;
      submitter_last_name?: string;
    }) => ({
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
      story_xp_reward: STORY_XP_REWARD,
      story_earnings_reward: STORY_EARNINGS_REWARD,
      popup_ad_cost: POPUP_AD_COST,
    });
  } catch (error) {
    console.error('Content submissions pending error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /news/approve-all — approve all pending news stories (school-scoped)
router.post('/news/approve-all', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!(await tablesReady())) {
      return res.status(503).json({ error: 'Content submissions are not available yet. Please try again later.' });
    }

    const schoolId = req.schoolId ?? req.user?.school_id ?? null;
    const pendingStories = await database.query(
      `SELECT s.*, u.username AS journalist_username
       FROM town_news_stories s
       JOIN users u ON u.id = s.journalist_user_id
       WHERE ${schoolFilterClause('s', 1)} AND s.status = 'pending'
       ORDER BY s.created_at ASC`,
      [schoolId]
    );

    if (pendingStories.length === 0) {
      return res.json({
        message: 'No pending news stories to approve',
        approved: 0,
        failed: [],
      });
    }

    const failed: { id: number; error: string }[] = [];
    let approved = 0;

    for (const story of pendingStories) {
      try {
        await payStorySubmissionReward(
          story.journalist_user_id,
          story.journalist_username,
          story.town_class,
          story.school_id ?? null,
          story.headline
        );
        await database.run(
          `UPDATE town_news_stories
           SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1, denial_reason = NULL
           WHERE id = $2`,
          [req.user?.id ?? null, story.id]
        );
        approved += 1;
      } catch (err) {
        if (err instanceof Error && err.message === 'TREASURY_INSUFFICIENT') {
          failed.push({
            id: story.id,
            error: 'Town treasury has insufficient funds to pay the journalist.',
          });
        } else {
          failed.push({ id: story.id, error: 'Failed to approve story' });
        }
      }
    }

    const message =
      failed.length === 0
        ? `Approved ${approved} news stor${approved !== 1 ? 'ies' : 'y'} successfully`
        : `Approved ${approved} news stor${approved !== 1 ? 'ies' : 'y'}; ${failed.length} could not be approved`;

    res.json({ message, approved, failed });
  } catch (error) {
    console.error('Approve all news stories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /apps/approve-all — approve all pending code board apps (school-scoped)
router.post('/apps/approve-all', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!(await tablesReady())) {
      return res.status(503).json({ error: 'Content submissions are not available yet. Please try again later.' });
    }

    const schoolId = req.schoolId ?? req.user?.school_id ?? null;
    const pendingApps = await database.query(
      `SELECT a.id
       FROM code_board_apps a
       WHERE ${schoolFilterClause('a', 1)} AND a.status = 'pending'
       ORDER BY a.created_at ASC`,
      [schoolId]
    );

    if (pendingApps.length === 0) {
      return res.json({
        message: 'No pending code board apps to approve',
        approved: 0,
        failed: [],
      });
    }

    const failed: { id: number; error: string }[] = [];
    let approved = 0;

    for (const app of pendingApps) {
      try {
        await database.run(
          `UPDATE code_board_apps
           SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1, denial_reason = NULL
           WHERE id = $2 AND status = 'pending'`,
          [req.user?.id ?? null, app.id]
        );
        approved += 1;
      } catch {
        failed.push({ id: app.id, error: 'Failed to approve app' });
      }
    }

    const message =
      failed.length === 0
        ? `Approved ${approved} code board app${approved !== 1 ? 's' : ''} successfully`
        : `Approved ${approved} code board app${approved !== 1 ? 's' : ''}; ${failed.length} could not be approved`;

    res.json({ message, approved, failed });
  } catch (error) {
    console.error('Approve all code apps error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /news/:id/review — approve or deny a news story
router.post('/news/:id/review', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!(await tablesReady())) {
      return res.status(503).json({ error: 'Content submissions are not available yet. Please try again later.' });
    }

    const storyId = parseInt(String(req.params.id), 10);
    if (Number.isNaN(storyId)) {
      return res.status(400).json({ error: 'Invalid story id' });
    }

    const { status, denial_reason } = req.body ?? {};
    if (!isReviewStatus(status)) {
      return res.status(400).json({ error: 'status must be approved or denied' });
    }

    const schoolId = req.schoolId ?? req.user?.school_id ?? null;
    const story = await database.get(
      `SELECT s.*, u.username AS journalist_username
       FROM town_news_stories s
       JOIN users u ON u.id = s.journalist_user_id
       WHERE s.id = $1 AND ${schoolFilterClause('s', 2)}`,
      [storyId, schoolId]
    );
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }
    if (story.status !== 'pending') {
      return res.status(400).json({ error: 'Story has already been reviewed' });
    }

    if (status === 'approved') {
      try {
        await payStorySubmissionReward(
          story.journalist_user_id,
          story.journalist_username,
          story.town_class,
          story.school_id ?? null,
          story.headline
        );
      } catch (err) {
        if (err instanceof Error && err.message === 'TREASURY_INSUFFICIENT') {
          return res.status(400).json({
            error: 'Town treasury has insufficient funds to pay the journalist. Add funds before approving.',
          });
        }
        throw err;
      }
    }

    await database.run(
      `UPDATE town_news_stories
       SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2, denial_reason = $3
       WHERE id = $4`,
      [status, req.user?.id ?? null, status === 'denied' ? (denial_reason || null) : null, storyId]
    );

    res.json({ success: true, status });
  } catch (error) {
    console.error('Review news story error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /popups/:id/review — approve or deny a login pop-up ad
router.post('/popups/:id/review', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!(await popupsTableReady())) {
      return res.status(503).json({ error: 'Login pop-up ads are not available yet. Please try again later.' });
    }

    const popupId = parseInt(String(req.params.id), 10);
    if (Number.isNaN(popupId)) {
      return res.status(400).json({ error: 'Invalid pop-up id' });
    }

    const { status, denial_reason } = req.body ?? {};
    if (!isReviewStatus(status)) {
      return res.status(400).json({ error: 'status must be approved or denied' });
    }

    const schoolId = req.schoolId ?? req.user?.school_id ?? null;
    const popup = await database.get(
      `SELECT p.*, u.username AS creator_username
       FROM town_news_popups p
       JOIN users u ON u.id = p.creator_user_id
       WHERE p.id = $1 AND ${schoolFilterClause('p', 2)}`,
      [popupId, schoolId]
    );
    if (!popup) {
      return res.status(404).json({ error: 'Pop-up not found' });
    }
    if (popup.status !== 'pending') {
      return res.status(400).json({ error: 'Pop-up has already been reviewed' });
    }

    if (status === 'approved') {
      try {
        await chargePopupAdFee(
          popup.creator_user_id,
          popup.creator_username,
          popup.town_class,
          popup.school_id ?? null,
          popup.headline
        );
      } catch (err) {
        if (err instanceof Error && err.message === 'INSUFFICIENT_FUNDS') {
          return res.status(400).json({
            error: `The student does not have enough funds (R${POPUP_AD_COST.toLocaleString()} required). They must top up before you can approve.`,
          });
        }
        if (err instanceof Error && err.message === 'NO_ACCOUNT') {
          return res.status(400).json({ error: 'The student does not have a bank account.' });
        }
        throw err;
      }
    }

    await database.run(
      `UPDATE town_news_popups
       SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2, denial_reason = $3,
           payment_charged = $4
       WHERE id = $5`,
      [
        status,
        req.user?.id ?? null,
        status === 'denied' ? (denial_reason || null) : null,
        status === 'approved',
        popupId,
      ]
    );

    res.json({ success: true, status });
  } catch (error) {
    console.error('Review news popup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /apps/:id/review — approve or deny a code board app
router.post('/apps/:id/review', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!(await tablesReady())) {
      return res.status(503).json({ error: 'Content submissions are not available yet. Please try again later.' });
    }

    const appId = parseInt(String(req.params.id), 10);
    if (Number.isNaN(appId)) {
      return res.status(400).json({ error: 'Invalid app id' });
    }

    const { status, denial_reason } = req.body ?? {};
    if (!isReviewStatus(status)) {
      return res.status(400).json({ error: 'status must be approved or denied' });
    }

    const schoolId = req.schoolId ?? req.user?.school_id ?? null;
    const app = await database.get(
      `SELECT a.*
       FROM code_board_apps a
       WHERE a.id = $1 AND ${schoolFilterClause('a', 2)}`,
      [appId, schoolId]
    );
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }
    if (app.status !== 'pending') {
      return res.status(400).json({ error: 'App has already been reviewed' });
    }

    await database.run(
      `UPDATE code_board_apps
       SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2, denial_reason = $3
       WHERE id = $4`,
      [status, req.user?.id ?? null, status === 'denied' ? (denial_reason || null) : null, appId]
    );

    res.json({ success: true, status });
  } catch (error) {
    console.error('Review code app error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
