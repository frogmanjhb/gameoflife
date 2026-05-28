import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { isReviewStatus } from '../domain/contentApproval';
import { payStorySubmissionReward, STORY_EARNINGS_REWARD, STORY_XP_REWARD } from '../domain/townNews';

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
      `SELECT s.id, s.headline, s.body, s.image_data, s.town_class, s.status, s.created_at,
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

    const mapNews = newsStories.map((row: {
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
    }) => ({
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

    res.json({
      news_stories: mapNews,
      code_apps: mapApps,
      pending_count: mapNews.length + mapApps.length,
      story_xp_reward: STORY_XP_REWARD,
      story_earnings_reward: STORY_EARNINGS_REWARD,
    });
  } catch (error) {
    console.error('Content submissions pending error:', error);
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
