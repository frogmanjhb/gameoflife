import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { getXPForLevel } from './jobs';
import {
  MAX_POSTERS,
  WEEKLY_EARNINGS_PER_POSTER,
  WEEKLY_XP_PER_POSTER,
  calculateWeeklyPayout,
  canCollectWeeklyPayout,
  hasGraphicDesignerJob,
  isTownClass,
  isValidImageData,
} from '../domain/noticeBoard';

const router = Router();

async function getGraphicDesignerUser(userId: number) {
  return database.get(
    `SELECT u.id, u.class, u.school_id, u.username, j.name AS job_name
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.id = $1`,
    [userId]
  );
}

async function requireGraphicDesigner(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== 'student') {
    res.status(403).json({ error: 'Only students can manage the notice board' });
    return null;
  }
  const user = await getGraphicDesignerUser(req.user.id);
  if (!user || !hasGraphicDesignerJob(user.job_name)) {
    res.status(403).json({ error: 'Only Graphic Designers can manage the notice board' });
    return null;
  }
  if (!isTownClass(user.class)) {
    res.status(400).json({ error: 'Your account must be assigned to a town class (6A, 6B, or 6C)' });
    return null;
  }
  return user;
}

async function getSettingsForTown(schoolId: number | null, townClass: string) {
  if (schoolId != null) {
    return database.get(
      'SELECT * FROM notice_board_settings WHERE school_id = $1 AND town_class = $2',
      [schoolId, townClass]
    );
  }
  return database.get(
    'SELECT * FROM notice_board_settings WHERE school_id IS NULL AND town_class = $1',
    [townClass]
  );
}

async function getPostersForTown(schoolId: number | null, townClass: string) {
  if (schoolId != null) {
    return database.query(
      `SELECT id, title, image_data, created_at, designer_user_id
       FROM notice_board_posters
       WHERE school_id = $1 AND town_class = $2
       ORDER BY created_at DESC`,
      [schoolId, townClass]
    );
  }
  return database.query(
    `SELECT id, title, image_data, created_at, designer_user_id
     FROM notice_board_posters
     WHERE school_id IS NULL AND town_class = $1
     ORDER BY created_at DESC`,
    [townClass]
  );
}

async function getFirstPosterAt(schoolId: number | null, townClass: string): Promise<string | null> {
  const row = schoolId != null
    ? await database.get(
        'SELECT MIN(created_at) AS first_at FROM notice_board_posters WHERE school_id = $1 AND town_class = $2',
        [schoolId, townClass]
      )
    : await database.get(
        'SELECT MIN(created_at) AS first_at FROM notice_board_posters WHERE school_id IS NULL AND town_class = $1',
        [townClass]
      );
  return row?.first_at ?? null;
}

function buildManageStatus(
  settings: { enabled?: boolean; last_payout_collected_at?: string | null } | null,
  posters: { id: number; title?: string | null; created_at: string; image_data?: string }[],
  firstPosterAt: string | null
) {
  const posterCount = posters.length;
  const weekly = calculateWeeklyPayout(posterCount);
  const canCollect = posterCount > 0 && canCollectWeeklyPayout(
    settings?.last_payout_collected_at ?? null,
    firstPosterAt
  );

  return {
    enabled: settings?.enabled === true,
    poster_count: posterCount,
    weekly_earnings_per_poster: WEEKLY_EARNINGS_PER_POSTER,
    weekly_xp_per_poster: WEEKLY_XP_PER_POSTER,
    potential_weekly_earnings: weekly.earnings,
    potential_weekly_xp: weekly.experience_points,
    can_collect_weekly: canCollect,
    last_payout_collected_at: settings?.last_payout_collected_at ?? null,
    posters: posters.map((p) => ({
      id: p.id,
      title: p.title,
      created_at: p.created_at,
      image_data: p.image_data,
    })),
  };
}

// GET /manage — graphic designer management view
router.get('/manage', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const designer = await requireGraphicDesigner(req, res);
    if (!designer) return;

    try {
      await database.query('SELECT 1 FROM notice_board_settings LIMIT 1');
    } catch {
      return res.status(503).json({ error: 'Notice board feature not available yet. Please try again later.' });
    }

    const schoolId = designer.school_id ?? null;
    const townClass = designer.class;
    const settings = await getSettingsForTown(schoolId, townClass);
    const posters = await getPostersForTown(schoolId, townClass);
    const firstPosterAt = await getFirstPosterAt(schoolId, townClass);

    res.json(buildManageStatus(settings, posters, firstPosterAt));
  } catch (error) {
    console.error('Notice board manage error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /posters — public view for students in town when board is enabled
router.get('/posters', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    try {
      await database.query('SELECT 1 FROM notice_board_settings LIMIT 1');
    } catch {
      return res.status(503).json({ error: 'Notice board feature not available yet. Please try again later.' });
    }

    const townClass = req.user.class;
    if (!isTownClass(townClass)) {
      return res.status(400).json({ error: 'Town class required to view the notice board' });
    }

    const schoolId = req.user.school_id ?? null;
    const settings = await getSettingsForTown(schoolId, townClass);
    if (!settings?.enabled) {
      return res.status(403).json({ error: 'Notice board is not enabled for your town' });
    }

    const posters = await getPostersForTown(schoolId, townClass);
    const designer = settings.designer_user_id
      ? await database.get(
          'SELECT first_name, last_name, username FROM users WHERE id = $1',
          [settings.designer_user_id]
        )
      : null;

    res.json({
      enabled: true,
      designer_name: designer
        ? [designer.first_name, designer.last_name].filter(Boolean).join(' ') || designer.username
        : null,
      posters: posters.map((p: { id: number; title?: string | null; image_data: string; created_at: string }) => ({
        id: p.id,
        title: p.title,
        image_data: p.image_data,
        created_at: p.created_at,
      })),
    });
  } catch (error) {
    console.error('Notice board posters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /toggle — graphic designer enables/disables notice board for their town
router.put('/toggle', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const designer = await requireGraphicDesigner(req, res);
    if (!designer) return;

    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be a boolean' });
    }

    const schoolId = designer.school_id ?? null;
    const townClass = designer.class;

    if (schoolId != null) {
      await database.query(
        `INSERT INTO notice_board_settings (school_id, town_class, designer_user_id, enabled, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (school_id, town_class)
         DO UPDATE SET enabled = EXCLUDED.enabled, designer_user_id = EXCLUDED.designer_user_id, updated_at = CURRENT_TIMESTAMP`,
        [schoolId, townClass, designer.id, enabled]
      );
    } else {
      const existing = await database.get(
        'SELECT id FROM notice_board_settings WHERE school_id IS NULL AND town_class = $1',
        [townClass]
      );
      if (existing) {
        await database.run(
          'UPDATE notice_board_settings SET enabled = $1, designer_user_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          [enabled, designer.id, existing.id]
        );
      } else {
        await database.run(
          'INSERT INTO notice_board_settings (school_id, town_class, designer_user_id, enabled) VALUES (NULL, $1, $2, $3)',
          [townClass, designer.id, enabled]
        );
      }
    }

    const settings = await getSettingsForTown(schoolId, townClass);
    const posters = await getPostersForTown(schoolId, townClass);
    const firstPosterAt = await getFirstPosterAt(schoolId, townClass);

    res.json(buildManageStatus(settings, posters, firstPosterAt));
  } catch (error) {
    console.error('Notice board toggle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /posters — upload a poster image
router.post('/posters', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const designer = await requireGraphicDesigner(req, res);
    if (!designer) return;

    const { image_data, title } = req.body;
    if (!isValidImageData(image_data)) {
      return res.status(400).json({ error: 'Invalid image. Upload a JPEG, PNG, WebP, or GIF under 2 MB.' });
    }

    const safeTitle = typeof title === 'string' && title.trim() ? title.trim().slice(0, 255) : null;
    const schoolId = designer.school_id ?? null;
    const townClass = designer.class;

    const countRow = schoolId != null
      ? await database.get(
          'SELECT COUNT(*) AS count FROM notice_board_posters WHERE school_id = $1 AND town_class = $2',
          [schoolId, townClass]
        )
      : await database.get(
          'SELECT COUNT(*) AS count FROM notice_board_posters WHERE school_id IS NULL AND town_class = $1',
          [townClass]
        );

    if (parseInt(String(countRow?.count ?? 0), 10) >= MAX_POSTERS) {
      return res.status(400).json({ error: `Maximum of ${MAX_POSTERS} posters allowed on the notice board` });
    }

    await database.run(
      `INSERT INTO notice_board_posters (school_id, town_class, designer_user_id, title, image_data)
       VALUES ($1, $2, $3, $4, $5)`,
      [schoolId, townClass, designer.id, safeTitle, image_data]
    );

    const settings = await getSettingsForTown(schoolId, townClass);
    const posters = await getPostersForTown(schoolId, townClass);
    const firstPosterAt = await getFirstPosterAt(schoolId, townClass);

    res.status(201).json(buildManageStatus(settings, posters, firstPosterAt));
  } catch (error) {
    console.error('Notice board upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /posters/:id — remove a poster
router.delete('/posters/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const designer = await requireGraphicDesigner(req, res);
    if (!designer) return;

    const posterId = parseInt(req.params.id, 10);
    if (Number.isNaN(posterId)) {
      return res.status(400).json({ error: 'Invalid poster ID' });
    }

    const schoolId = designer.school_id ?? null;
    const townClass = designer.class;

    const poster = schoolId != null
      ? await database.get(
          'SELECT id FROM notice_board_posters WHERE id = $1 AND school_id = $2 AND town_class = $3 AND designer_user_id = $4',
          [posterId, schoolId, townClass, designer.id]
        )
      : await database.get(
          'SELECT id FROM notice_board_posters WHERE id = $1 AND school_id IS NULL AND town_class = $2 AND designer_user_id = $3',
          [posterId, townClass, designer.id]
        );

    if (!poster) {
      return res.status(404).json({ error: 'Poster not found' });
    }

    await database.run('DELETE FROM notice_board_posters WHERE id = $1', [posterId]);

    const settings = await getSettingsForTown(schoolId, townClass);
    const posters = await getPostersForTown(schoolId, townClass);
    const firstPosterAt = await getFirstPosterAt(schoolId, townClass);

    res.json(buildManageStatus(settings, posters, firstPosterAt));
  } catch (error) {
    console.error('Notice board delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /collect-weekly — collect R500 + 5 XP per poster per week
router.post('/collect-weekly', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const designer = await requireGraphicDesigner(req, res);
    if (!designer) return;

    const schoolId = designer.school_id ?? null;
    const townClass = designer.class;
    const settings = await getSettingsForTown(schoolId, townClass);
    const posters = await getPostersForTown(schoolId, townClass);
    const firstPosterAt = await getFirstPosterAt(schoolId, townClass);

    if (posters.length === 0) {
      return res.status(400).json({ error: 'Upload at least one poster before collecting weekly earnings' });
    }

    if (!canCollectWeeklyPayout(settings?.last_payout_collected_at ?? null, firstPosterAt)) {
      return res.status(400).json({ error: 'Weekly earnings already collected. Try again next week.' });
    }

    const { earnings, experience_points } = calculateWeeklyPayout(posters.length);
    const userId = designer.id;

    const currentUser = await database.get(
      'SELECT job_level, job_experience_points FROM users WHERE id = $1',
      [userId]
    );
    const currentLevel = currentUser?.job_level || 1;
    const currentXP = currentUser?.job_experience_points || 0;
    const newXP = currentXP + experience_points;
    let newLevel = currentLevel;
    for (let level = currentLevel; level < 10; level++) {
      if (newXP >= getXPForLevel(level + 1)) newLevel = level + 1;
      else break;
    }

    await database.query(
      'UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3',
      [newXP, newLevel, userId]
    );

    const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [userId]);
    if (account && earnings > 0) {
      if (schoolId != null || isTownClass(townClass)) {
        const townSettings = schoolId != null
          ? await database.get(
              'SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id = $2',
              [townClass, schoolId]
            )
          : await database.get(
              'SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id IS NULL',
              [townClass]
            );
        const treasuryBalance = parseFloat(townSettings?.treasury_balance || '0');
        if (treasuryBalance < earnings) {
          return res.status(400).json({
            error: 'Town treasury has insufficient funds to pay out your earnings. Please contact your teacher.',
          });
        }
        if (schoolId != null) {
          await database.query(
            'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3',
            [earnings, townClass, schoolId]
          );
        } else {
          await database.query(
            'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL',
            [earnings, townClass]
          );
        }
        await database.query(
          `INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [schoolId, townClass, earnings, 'withdrawal', `Notice Board weekly payout to ${designer.username}`, userId]
        );
      }
      await database.query(
        'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [earnings, account.id]
      );
      await database.query(
        `INSERT INTO transactions (to_account_id, amount, transaction_type, description)
         VALUES ($1, $2, 'deposit', $3)`,
        [account.id, earnings, `Notice Board weekly earnings (${posters.length} poster${posters.length === 1 ? '' : 's'})`]
      );
    }

    if (schoolId != null) {
      await database.query(
        `INSERT INTO notice_board_settings (school_id, town_class, designer_user_id, enabled, last_payout_collected_at, updated_at)
         VALUES ($1, $2, $3, COALESCE($4, false), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (school_id, town_class)
         DO UPDATE SET last_payout_collected_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`,
        [schoolId, townClass, userId, settings?.enabled ?? false]
      );
    } else if (settings?.id) {
      await database.run(
        'UPDATE notice_board_settings SET last_payout_collected_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [settings.id]
      );
    } else {
      await database.run(
        'INSERT INTO notice_board_settings (school_id, town_class, designer_user_id, enabled, last_payout_collected_at) VALUES (NULL, $1, $2, false, CURRENT_TIMESTAMP)',
        [townClass, userId]
      );
    }

    const refreshedSettings = await getSettingsForTown(schoolId, townClass);
    const refreshedPosters = await getPostersForTown(schoolId, townClass);
    const refreshedFirstAt = await getFirstPosterAt(schoolId, townClass);

    res.json({
      ...buildManageStatus(refreshedSettings, refreshedPosters, refreshedFirstAt),
      collected_earnings: earnings,
      collected_experience_points: experience_points,
      new_level: newLevel > currentLevel ? newLevel : null,
    });
  } catch (error) {
    console.error('Notice board collect weekly error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /town-status — used by plugins list to check if notice board is live for a town
router.get('/town-status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.class || !isTownClass(req.user.class)) {
      return res.json({ enabled: false });
    }
    try {
      await database.query('SELECT 1 FROM notice_board_settings LIMIT 1');
    } catch {
      return res.json({ enabled: false });
    }
    const schoolId = req.user.school_id ?? null;
    const settings = await getSettingsForTown(schoolId, req.user.class);
    res.json({ enabled: settings?.enabled === true });
  } catch (error) {
    console.error('Notice board town status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

export async function isNoticeBoardLiveForTown(
  schoolId: number | null,
  townClass: string | null | undefined
): Promise<boolean> {
  if (!isTownClass(townClass)) return false;
  try {
    await database.query('SELECT 1 FROM notice_board_settings LIMIT 1');
  } catch {
    return false;
  }
  const settings = await getSettingsForTown(schoolId, townClass);
  return settings?.enabled === true;
}
