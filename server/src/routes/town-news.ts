import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import {
  STORY_EARNINGS_REWARD,
  STORY_XP_REWARD,
  canSubmitTownNews,
  isTownClass,
  sanitizeBody,
  sanitizeHeadline,
  sanitizeOptionalImage,
} from '../domain/townNews';
import { resolveViewerTownClass, viewerTownClassError } from '../domain/townScope';
import { ContentSubmissionStatus } from '../domain/contentApproval';

const router = Router();

async function tablesReady(): Promise<boolean> {
  try {
    await database.query('SELECT 1 FROM town_news_stories LIMIT 1');
    return true;
  } catch {
    return false;
  }
}

async function getStudentUser(userId: number) {
  return database.get(
    `SELECT u.id, u.class, u.school_id, u.username, u.first_name, u.last_name, u.role, j.name AS job_name
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.id = $1`,
    [userId]
  );
}

async function requireTownNewsContributor(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== 'student') {
    res.status(403).json({ error: 'Only students can submit town news stories' });
    return null;
  }
  const user = await getStudentUser(req.user.id);
  if (!user || !canSubmitTownNews(user.job_name)) {
    res.status(403).json({ error: 'Only Journalists and Graphic Designers can submit to the Town News Board' });
    return null;
  }
  if (!isTownClass(user.class)) {
    res.status(400).json({ error: 'Your account must be assigned to a town class (6A, 6B, or 6C)' });
    return null;
  }
  return user;
}

function displayName(user: { first_name?: string; last_name?: string; username?: string }) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
  return name || user.username || 'Journalist';
}

function mapStoryRow(row: {
  id: number;
  headline: string;
  body: string;
  image_data?: string | null;
  created_at: string;
  status?: ContentSubmissionStatus;
  denial_reason?: string | null;
  journalist_user_id?: number;
  journalist_username?: string;
  journalist_first_name?: string;
  journalist_last_name?: string;
}) {
  return {
    id: row.id,
    headline: row.headline,
    body: row.body,
    image_data: row.image_data ?? null,
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

async function getApprovedStoriesForTown(schoolId: number | null, townClass: string) {
  const rows = schoolId != null
    ? await database.query(
        `SELECT s.*, u.username AS journalist_username, u.first_name AS journalist_first_name, u.last_name AS journalist_last_name
         FROM town_news_stories s
         JOIN users u ON u.id = s.journalist_user_id
         WHERE s.school_id = $1 AND s.town_class = $2 AND s.status = 'approved'
         ORDER BY s.created_at DESC`,
        [schoolId, townClass]
      )
    : await database.query(
        `SELECT s.*, u.username AS journalist_username, u.first_name AS journalist_first_name, u.last_name AS journalist_last_name
         FROM town_news_stories s
         JOIN users u ON u.id = s.journalist_user_id
         WHERE s.school_id IS NULL AND s.town_class = $1 AND s.status = 'approved'
         ORDER BY s.created_at DESC`,
        [townClass]
      );
  return rows.map((row: Parameters<typeof mapStoryRow>[0]) => mapStoryRow(row));
}

// GET /manage — journalist / graphic designer view
router.get('/manage', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contributor = await requireTownNewsContributor(req, res);
    if (!contributor) return;
    if (!(await tablesReady())) {
      return res.status(503).json({ error: 'Town News Board is not available yet. Please try again later.' });
    }

    const schoolId = contributor.school_id ?? null;
    const rows = schoolId != null
      ? await database.query(
          `SELECT id, headline, body, image_data, status, denial_reason, created_at
           FROM town_news_stories
           WHERE school_id = $1 AND town_class = $2 AND journalist_user_id = $3
           ORDER BY created_at DESC`,
          [schoolId, contributor.class, contributor.id]
        )
      : await database.query(
          `SELECT id, headline, body, image_data, status, denial_reason, created_at
           FROM town_news_stories
           WHERE school_id IS NULL AND town_class = $1 AND journalist_user_id = $2
           ORDER BY created_at DESC`,
          [contributor.class, contributor.id]
        );

    res.json({
      stories: rows.map((row: Parameters<typeof mapStoryRow>[0]) => mapStoryRow(row)),
      story_xp_reward: STORY_XP_REWARD,
      story_earnings_reward: STORY_EARNINGS_REWARD,
    });
  } catch (error) {
    console.error('Town news manage error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stories — public town feed (approved only)
router.get('/stories', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }
    if (!(await tablesReady())) {
      return res.status(503).json({ error: 'Town News Board is not available yet. Please try again later.' });
    }

    const townClass = resolveViewerTownClass(req.user, req.query.class);
    if (!townClass) {
      return res.status(400).json({ error: viewerTownClassError(req.user.role) });
    }

    const stories = await getApprovedStoriesForTown(req.user.school_id ?? null, townClass);
    res.json({ stories });
  } catch (error) {
    console.error('Town news stories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /stories — journalist or graphic designer submits (pending teacher approval)
router.post('/stories', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contributor = await requireTownNewsContributor(req, res);
    if (!contributor) return;
    if (!(await tablesReady())) {
      return res.status(503).json({ error: 'Town News Board is not available yet. Please try again later.' });
    }

    const headline = sanitizeHeadline(req.body?.headline);
    const body = sanitizeBody(req.body?.body);
    const imageRaw = req.body?.image_data;
    let image_data: string | null = null;

    if (imageRaw != null && imageRaw !== '') {
      image_data = sanitizeOptionalImage(imageRaw);
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

    const schoolId = contributor.school_id ?? null;
    const townClass = contributor.class;

    const rows = await database.query(
      `INSERT INTO town_news_stories (school_id, town_class, journalist_user_id, headline, body, image_data, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, headline, body, image_data, status, denial_reason, created_at`,
      [schoolId, townClass, contributor.id, headline, body, image_data]
    );

    res.status(201).json({
      story: mapStoryRow(rows[0]),
      message: 'Story submitted for teacher approval. You will earn XP and payment once it is approved.',
    });
  } catch (error) {
    console.error('Town news submit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /stories/:id — contributor removes own story
router.delete('/stories/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contributor = await requireTownNewsContributor(req, res);
    if (!contributor) return;
    if (!(await tablesReady())) {
      return res.status(503).json({ error: 'Town News Board is not available yet. Please try again later.' });
    }

    const storyId = parseInt(String(req.params.id), 10);
    if (Number.isNaN(storyId)) {
      return res.status(400).json({ error: 'Invalid story id' });
    }

    const schoolId = contributor.school_id ?? null;
    const existing = schoolId != null
      ? await database.get(
          'SELECT id FROM town_news_stories WHERE id = $1 AND school_id = $2 AND town_class = $3 AND journalist_user_id = $4',
          [storyId, schoolId, contributor.class, contributor.id]
        )
      : await database.get(
          'SELECT id FROM town_news_stories WHERE id = $1 AND school_id IS NULL AND town_class = $2 AND journalist_user_id = $3',
          [storyId, contributor.class, contributor.id]
        );
    if (!existing) {
      return res.status(404).json({ error: 'Story not found or you cannot delete it' });
    }

    await database.run('DELETE FROM town_news_stories WHERE id = $1', [storyId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Town news delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
