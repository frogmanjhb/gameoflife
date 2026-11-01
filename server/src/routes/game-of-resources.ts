import { Router, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import {
  displayNameForUser,
  isProfessionId,
  requireApprovedStudentWithRules,
  requireTeacherForSchool,
  resolveStudentTown,
  resolveTeacherTown,
  schoolIdFromRequest,
  stripHtml,
  tablesReady,
  loadDisplayNameMap,
  requireStudentInTown,
} from '../domain/gameOfResources/access';
import {
  runDoAction,
  runJobChange,
  runMarketAction,
  runRuleChecks,
  runSaveReflection,
  runStartWork,
  runTeacherRound,
  runTeacherSetProfession,
  validateActionOpt,
} from '../domain/gameOfResources/actions';
import { checkRateLimit } from '../domain/gameOfResources/rateLimit';
import { nextRoundEndsAt } from '../domain/gameOfResources/scheduleTime';
import { notifyWorldVersion, subscribeWorld } from '../domain/gameOfResources/liveUpdates';
import { CONFIG, RULES } from '../domain/gameOfResources/shared';
import type { GameState } from '../domain/gameOfResources/shared';
import type { TownClass } from '../domain/gameOfResources/types';
import {
  bankRandFromCoins,
  bridgeSettingsFromWorld,
  citizenCoins,
  countPendingRedemptionsForUser,
  deductGameCoins,
} from '../domain/gameOfResources/bankBridge';
import {
  getOrCreateWorldLocked,
  resetWorldForTown,
  updateCitizenAvatar,
  updateWorldSettings,
  userIdFromCitizenId,
  citizenIdForUser,
  saveWorldState,
} from '../domain/gameOfResources/worldRepository';
import {
  applyGameplayAndSave,
  buildStatusForStudent,
  withWorldTransaction,
} from '../domain/gameOfResources/worldSession';
import { validateAvatarPatch, parseGorAvatar } from '../domain/gameOfResources/avatar';

const router = Router();

async function migrationGuard(res: Response): Promise<boolean> {
  if (!(await tablesReady())) {
    res.status(503).json({ error: 'Game of Resources is not set up yet. Ask your teacher to run the database migration.' });
    return false;
  }
  return true;
}

function validationFailed(req: AuthenticatedRequest, res: Response): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array()[0]?.msg || 'Invalid request.' });
    return true;
  }
  return false;
}

function rateLimitUser(userId: number, res: Response): boolean {
  const key = `gor:action:${userId}`;
  if (!checkRateLimit(key, 10, 10_000)) {
    res.status(429).json({ error: 'You are acting too quickly. Wait a few seconds and try again.' });
    return false;
  }
  return true;
}

async function studentGameplayResponse(
  res: Response,
  userId: number,
  displayName: string,
  townClass: TownClass,
  schoolId: number,
  play: (
    client: import('pg').PoolClient,
    bundle: import('../domain/gameOfResources/types').LockedWorldBundle
  ) => Promise<{ ok: boolean; reason?: string; state?: import('../domain/gameOfResources/shared').GameState; event?: Record<string, unknown>; summary?: Record<string, unknown>; clientVersion?: number }>,
  options?: { advanceSummary?: boolean }
): Promise<void> {
  try {
    const outcome = await withWorldTransaction(schoolId, townClass, async (client, bundle) => {
      await buildStatusForStudent(client, bundle, userId, displayName);
      const gameplay = await play(client, bundle);
      if (gameplay.clientVersion != null && gameplay.clientVersion !== bundle.row.version) {
        return {
          ok: false as const,
          conflict: true as const,
          reason: 'The world changed while you were playing. Refresh and try again.',
        };
      }
      if (!gameplay.ok) {
        return { ok: false as const, reason: gameplay.reason };
      }
      await applyGameplayAndSave(client, bundle, userId, gameplay, options);
      const viewStatus = await buildStatusForStudent(client, bundle, userId, displayName);
      return { ok: true as const, viewStatus, event: gameplay.event };
    });

    if (!outcome.ok) {
      if ('conflict' in outcome && outcome.conflict) {
        res.status(409).json({ error: outcome.reason });
        return;
      }
      res.status(400).json({ error: outcome.reason || 'Action failed.' });
      return;
    }
    res.json({
      ...outcome.viewStatus.view,
      firstVisit: outcome.viewStatus.firstVisit,
      assignedProfession: outcome.viewStatus.assignedProfession,
      assignedProfessionName: outcome.viewStatus.assignedProfessionName,
      event: outcome.event ?? null,
    });
  } catch (e) {
    console.error('Game of Resources action failed:', e);
    const msg = e instanceof Error ? e.message : 'Internal server error';
    if (msg.includes('version conflict')) {
      res.status(409).json({ error: msg });
      return;
    }
    res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
}

router.get(
  '/status',
  authenticateToken,
  requireTenant,
  query('since').optional().isInt({ min: 0 }).withMessage('since must be a version number'),
  async (req: AuthenticatedRequest, res: Response) => {
    if (validationFailed(req, res)) return;
    if (!(await migrationGuard(res))) return;
    const user = await requireApprovedStudentWithRules(req, res);
    if (!user) return;

    const since = req.query.since != null ? Number(req.query.since) : null;
    const townClass = resolveStudentTown(user);
    const schoolId = schoolIdFromRequest(req);
    const displayName = displayNameForUser(user);

    try {
      const payload = await withWorldTransaction(schoolId, townClass, async (client, bundle) => {
        if (since != null && since === bundle.row.version) {
          return { unchanged: true as const, version: bundle.row.version };
        }
        return { unchanged: false as const, ...(await buildStatusForStudent(client, bundle, user.id, displayName)) };
      });

      if ('unchanged' in payload && payload.unchanged) {
        return res.json({ unchanged: true, version: payload.version });
      }

      res.json({
        ...payload.view,
        firstVisit: payload.firstVisit,
        assignedProfession: payload.assignedProfession,
        assignedProfessionName: payload.assignedProfessionName,
      });
    } catch (e) {
      console.error('Game of Resources status failed:', e);
      res.status(500).json({ error: 'Could not load the world. Try again.' });
    }
  }
);

router.get('/events', authenticateToken, requireTenant, async (req: AuthenticatedRequest, res: Response) => {
  if (!(await migrationGuard(res))) return;
  const user = await requireApprovedStudentWithRules(req, res);
  if (!user) return;
  const townClass = resolveStudentTown(user);
  const schoolId = schoolIdFromRequest(req);

  try {
    const client = await database.getClient();
    try {
      await client.query('BEGIN');
      const bundle = await getOrCreateWorldLocked(client, schoolId, townClass);
      await client.query('COMMIT');
      subscribeWorld(bundle.row.id, res);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('Game of Resources SSE failed:', e);
    if (!res.headersSent) res.status(500).json({ error: 'Could not open live updates.' });
  }
});

router.post(
  '/action',
  authenticateToken,
  requireTenant,
  body('type').isString().trim().notEmpty().withMessage('Choose an action.'),
  body('opt').optional().isObject().withMessage('opt must be an object'),
  body('clientVersion').optional().isInt({ min: 0 }),
  async (req: AuthenticatedRequest, res: Response) => {
    if (validationFailed(req, res)) return;
    if (!(await migrationGuard(res))) return;
    const user = await requireApprovedStudentWithRules(req, res);
    if (!user) return;
    if (!rateLimitUser(user.id, res)) return;

    const type = String(req.body.type);
    const opt = (req.body.opt ?? {}) as Record<string, unknown>;
    const err = validateActionOpt(type, opt);
    if (err) {
      res.status(400).json({ error: err });
      return;
    }

    const townClass = resolveStudentTown(user);
    const schoolId = schoolIdFromRequest(req);
    const displayName = displayNameForUser(user);
    const clientVersion = req.body.clientVersion != null ? Number(req.body.clientVersion) : undefined;

    await studentGameplayResponse(res, user.id, displayName, townClass, schoolId, async (_client, bundle) => {
      const r = runDoAction(bundle, user.id, type, opt);
      return { ...r, clientVersion };
    });
  }
);

function marketRoute(
  path: string,
  kind: 'storeBuy' | 'storeSell' | 'list' | 'cancel' | 'buy',
  validators: ReturnType<typeof body>[]
) {
  router.post(
    path,
    authenticateToken,
    requireTenant,
    ...validators,
    async (req: AuthenticatedRequest, res: Response) => {
      if (validationFailed(req, res)) return;
      if (!(await migrationGuard(res))) return;
      const user = await requireApprovedStudentWithRules(req, res);
      if (!user) return;
      if (!rateLimitUser(user.id, res)) return;

      const townClass = resolveStudentTown(user);
      const schoolId = schoolIdFromRequest(req);
      const displayName = displayNameForUser(user);
      const payload = { ...req.body, clientVersion: req.body.clientVersion };

      await studentGameplayResponse(res, user.id, displayName, townClass, schoolId, async (_client, bundle) => {
        const r = runMarketAction(bundle, user.id, kind, payload);
        return { ...r, clientVersion: payload.clientVersion };
      });
    }
  );
}

marketRoute('/market/store-buy', 'storeBuy', [
  body('item').isIn(RULES.ITEMS).withMessage('Choose a valid item.'),
  body('qty').optional().isInt({ min: 1, max: 99 }),
  body('clientVersion').optional().isInt({ min: 0 }),
]);
marketRoute('/market/store-sell', 'storeSell', [
  body('item').isIn(RULES.ITEMS).withMessage('Choose a valid item.'),
  body('qty').optional().isInt({ min: 1, max: 99 }),
  body('clientVersion').optional().isInt({ min: 0 }),
]);
marketRoute('/market/list', 'list', [
  body('item').isIn(RULES.ITEMS).withMessage('Choose a valid item.'),
  body('qty').isInt({ min: 1, max: 99 }),
  body('price').isInt({ min: 1, max: 9999 }),
  body('clientVersion').optional().isInt({ min: 0 }),
]);
marketRoute('/market/cancel', 'cancel', [
  body('listingId').isString().trim().notEmpty(),
  body('clientVersion').optional().isInt({ min: 0 }),
]);
marketRoute('/market/buy', 'buy', [
  body('listingId').isString().trim().notEmpty(),
  body('qty').isInt({ min: 1, max: 99 }),
  body('clientVersion').optional().isInt({ min: 0 }),
]);

router.post(
  '/works/start',
  authenticateToken,
  requireTenant,
  body('kind').isIn(['reclaim', 'link']).withMessage('Choose reclaim or link.'),
  body('cellId').isInt({ min: 0, max: 2000 }),
  body('clientVersion').optional().isInt({ min: 0 }),
  async (req: AuthenticatedRequest, res: Response) => {
    if (validationFailed(req, res)) return;
    if (!(await migrationGuard(res))) return;
    const user = await requireApprovedStudentWithRules(req, res);
    if (!user) return;
    if (!rateLimitUser(user.id, res)) return;

    const townClass = resolveStudentTown(user);
    const schoolId = schoolIdFromRequest(req);
    const displayName = displayNameForUser(user);
    const kind = req.body.kind as 'reclaim' | 'link';
    const cellId = Number(req.body.cellId);

    await studentGameplayResponse(res, user.id, displayName, townClass, schoolId, async (_client, bundle) => {
      const r = runStartWork(bundle, user.id, kind, cellId);
      return { ...r, clientVersion: req.body.clientVersion };
    });
  }
);

router.post(
  '/job/change',
  authenticateToken,
  requireTenant,
  body('profession').custom((v) => {
    if (!isProfessionId(v)) throw new Error('Choose a valid profession.');
    return true;
  }),
  body('clientVersion').optional().isInt({ min: 0 }),
  async (req: AuthenticatedRequest, res: Response) => {
    if (validationFailed(req, res)) return;
    if (!(await migrationGuard(res))) return;
    const user = await requireApprovedStudentWithRules(req, res);
    if (!user) return;
    if (!rateLimitUser(user.id, res)) return;

    const townClass = resolveStudentTown(user);
    const schoolId = schoolIdFromRequest(req);
    const displayName = displayNameForUser(user);
    const profession = req.body.profession;

    await studentGameplayResponse(res, user.id, displayName, townClass, schoolId, async (client, bundle) => {
      const r = await runJobChange(client, bundle, user.id, profession, bundle.row.settings);
      return { ...r, clientVersion: req.body.clientVersion };
    });
  }
);

router.post(
  '/avatar',
  authenticateToken,
  requireTenant,
  async (req: AuthenticatedRequest, res: Response) => {
    if (!(await migrationGuard(res))) return;
    const user = await requireApprovedStudentWithRules(req, res);
    if (!user) return;
    if (!rateLimitUser(user.id, res)) return;

    const townClass = resolveStudentTown(user);
    const schoolId = schoolIdFromRequest(req);
    const displayName = displayNameForUser(user);
    const patch = req.body as Record<string, unknown>;

    try {
      const payload = await withWorldTransaction(schoolId, townClass, async (client, bundle) => {
        const cid = citizenIdForUser(user.id);
        const citizen = bundle.state.citizens.find((c) => c.id === cid);
        if (!citizen) {
          return { ok: false as const, reason: 'Citizen not found.' };
        }
        const row0 = bundle.citizenRows.find((r) => r.user_id === user.id);
        const current = parseGorAvatar(row0?.avatar, citizen.prof);
        const validated = validateAvatarPatch(current, patch);
        if (!validated.ok) {
          return { ok: false as const, reason: validated.reason };
        }
        const row = await updateCitizenAvatar(client, bundle.row.id, user.id, validated.avatar);
        if (!row) {
          return { ok: false as const, reason: 'Citizen not found.' };
        }
        const idx = bundle.citizenRows.findIndex((r) => r.user_id === user.id);
        if (idx >= 0) bundle.citizenRows[idx] = row;
        return { ok: true as const, ...(await buildStatusForStudent(client, bundle, user.id, displayName)) };
      });
      if (!payload.ok) {
        res.status(400).json({ error: payload.reason });
        return;
      }
      res.json({
        ...payload.view,
        firstVisit: payload.firstVisit,
        assignedProfession: payload.assignedProfession,
        assignedProfessionName: payload.assignedProfessionName,
      });
    } catch (e) {
      console.error('Game of Resources avatar failed:', e);
      res.status(500).json({ error: 'Could not save your character.' });
    }
  }
);

router.post(
  '/reflection',
  authenticateToken,
  requireTenant,
  body('round').isInt({ min: 1 }),
  body('text').isString().isLength({ max: CONFIG.reflectionMax }),
  body('clientVersion').optional().isInt({ min: 0 }),
  async (req: AuthenticatedRequest, res: Response) => {
    if (validationFailed(req, res)) return;
    if (!(await migrationGuard(res))) return;
    const user = await requireApprovedStudentWithRules(req, res);
    if (!user) return;
    if (!rateLimitUser(user.id, res)) return;

    const townClass = resolveStudentTown(user);
    const schoolId = schoolIdFromRequest(req);
    const displayName = displayNameForUser(user);
    const text = stripHtml(String(req.body.text));
    const round = Number(req.body.round);

    await studentGameplayResponse(res, user.id, displayName, townClass, schoolId, async (client, bundle) => {
      const r = await runSaveReflection(client, bundle, user.id, round, text);
      return { ...r, clientVersion: req.body.clientVersion };
    });
  }
);

router.get(
  '/teacher/worlds',
  authenticateToken,
  requireTenant,
  async (req: AuthenticatedRequest, res: Response) => {
    if (!(await migrationGuard(res))) return;
    if (!(await requireTeacherForSchool(req, res))) return;
    const schoolId = schoolIdFromRequest(req);
    const rows = await database.query(
      `SELECT w.id, w.town_class, w.round_number, w.round_open, w.version, w.paused,
              w.round_started_at, w.round_ends_at, w.settings,
              (SELECT COUNT(*)::int FROM gor_citizens c WHERE c.world_id = w.id) AS citizen_count
       FROM gor_worlds w
       WHERE w.school_id = $1
       ORDER BY w.town_class`,
      [schoolId]
    );
    res.json(rows);
  }
);

async function teacherRoundRoute(
  op: 'open' | 'close' | 'advance',
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!(await migrationGuard(res))) return;
  if (!(await requireTeacherForSchool(req, res))) return;
  const townClass = resolveTeacherTown(req, res);
  if (!townClass) return;
  const schoolId = schoolIdFromRequest(req);

  try {
    const result = await withWorldTransaction(schoolId, townClass, async (client, bundle) => {
      const gameplay = runTeacherRound(bundle, op);
      if (!gameplay.ok) return { ok: false as const, reason: gameplay.reason };
      const now = new Date();
      const schedule =
        op === 'advance'
          ? { roundStartedAt: now, roundEndsAt: nextRoundEndsAt(bundle.row.settings, now) }
          : {};
      const saved = await applyGameplayAndSave(client, bundle, 0, gameplay, {
        advanceSummary: op === 'advance',
        ...schedule,
      });
      return { ok: true as const, version: saved.row.version, summary: gameplay.summary ?? null };
    });
    if (!result.ok) {
      res.status(400).json({ error: result.reason || 'Could not change the round.' });
      return;
    }
    res.json({ ok: true, version: result.version, summary: result.summary });
  } catch (e) {
    console.error('Game of Resources teacher round failed:', e);
    res.status(500).json({ error: 'Could not change the round.' });
  }
}

router.post('/teacher/round/open', authenticateToken, requireTenant, (req, res) => teacherRoundRoute('open', req, res));
router.post('/teacher/round/close', authenticateToken, requireTenant, (req, res) => teacherRoundRoute('close', req, res));
router.post('/teacher/round/advance', authenticateToken, requireTenant, (req, res) =>
  teacherRoundRoute('advance', req, res)
);

router.put(
  '/teacher/settings',
  authenticateToken,
  requireTenant,
  body('town_class').isIn(['6A', '6B', '6C']),
  body('settings').isObject(),
  async (req: AuthenticatedRequest, res: Response) => {
    if (validationFailed(req, res)) return;
    if (!(await migrationGuard(res))) return;
    if (!(await requireTeacherForSchool(req, res))) return;
    const townClass = req.body.town_class as TownClass;
    const schoolId = schoolIdFromRequest(req);
    const incoming = req.body.settings as Record<string, unknown>;

    try {
      const row = await withWorldTransaction(schoolId, townClass, async (client, bundle) => {
        const merged = { ...bundle.row.settings, ...incoming };
        const paused =
          typeof incoming.automationPaused === 'boolean' ? incoming.automationPaused : undefined;
        return updateWorldSettings(client, bundle.row.id, merged, bundle.row.version, paused);
      });
      res.json({ settings: row.settings, version: row.version });
    } catch (e) {
      console.error('Game of Resources settings failed:', e);
      res.status(500).json({ error: 'Could not save settings.' });
    }
  }
);

router.get(
  '/teacher/citizens',
  authenticateToken,
  requireTenant,
  query('town_class').isIn(['6A', '6B', '6C']),
  async (req: AuthenticatedRequest, res: Response) => {
    if (validationFailed(req, res)) return;
    if (!(await migrationGuard(res))) return;
    if (!(await requireTeacherForSchool(req, res))) return;
    const townClass = req.query.town_class as TownClass;
    const schoolId = schoolIdFromRequest(req);

    try {
      const rows = await withWorldTransaction(schoolId, townClass, async (client, bundle) => {
        const names = await loadDisplayNameMap(client, schoolId, townClass);
        return bundle.state.citizens.map((c: GameState['citizens'][0]) => {
          const uid = userIdFromCitizenId(c.id);
          if (uid == null) return null;
          return {
            userId: uid,
            name: names.get(uid) ?? c.name,
            profession: c.prof,
            professionName: CONFIG.professions[c.prof].name,
            hungry: c.hungry,
            level: RULES.levelFor(c.xp),
            actions: c.actions,
            contrib: c.contrib,
            lastActiveRound: c.lastActiveRound ?? null,
            inactive: !RULES.isCitizenActive(c, bundle.state.round.n),
          };
        }).filter(Boolean);
      });
      res.json(rows);
    } catch (e) {
      console.error('Game of Resources teacher citizens failed:', e);
      res.status(500).json({ error: 'Could not load citizens.' });
    }
  }
);

router.get(
  '/teacher/status',
  authenticateToken,
  requireTenant,
  query('town_class').isIn(['6A', '6B', '6C']),
  query('user_id').isInt({ min: 1 }).withMessage('Choose a student.'),
  query('since').optional().isInt({ min: 0 }),
  async (req: AuthenticatedRequest, res: Response) => {
    if (validationFailed(req, res)) return;
    if (!(await migrationGuard(res))) return;
    if (!(await requireTeacherForSchool(req, res))) return;
    const townClass = req.query.town_class as TownClass;
    const targetUserId = Number(req.query.user_id);
    const since = req.query.since != null ? Number(req.query.since) : null;
    const schoolId = schoolIdFromRequest(req);

    try {
      const payload = await withWorldTransaction(schoolId, townClass, async (client, bundle) => {
        if (!(await requireStudentInTown(client, schoolId, townClass, targetUserId, res))) {
          throw new Error('__abort__');
        }
        if (since != null && since === bundle.row.version) {
          return { unchanged: true as const, version: bundle.row.version };
        }
        const nameMap = await loadDisplayNameMap(client, schoolId, townClass);
        const displayName = nameMap.get(targetUserId) ?? `Student ${targetUserId}`;
        const status = await buildStatusForStudent(client, bundle, targetUserId, displayName);
        return { unchanged: false as const, ...status };
      });

      if ('unchanged' in payload && payload.unchanged) {
        return res.json({ unchanged: true, version: payload.version });
      }

      res.json({
        ...payload.view,
        firstVisit: payload.firstVisit,
        assignedProfession: payload.assignedProfession,
        assignedProfessionName: payload.assignedProfessionName,
        previewUserId: targetUserId,
      });
    } catch (e) {
      if (e instanceof Error && e.message === '__abort__') return;
      console.error('Game of Resources teacher status failed:', e);
      res.status(500).json({ error: 'Could not load the world for that student.' });
    }
  }
);

router.post(
  '/teacher/citizens/profession',
  authenticateToken,
  requireTenant,
  body('town_class').isIn(['6A', '6B', '6C']),
  body('user_id').isInt({ min: 1 }),
  body('profession').custom((v) => isProfessionId(v) || Promise.reject('Choose a valid profession.')),
  async (req: AuthenticatedRequest, res: Response) => {
    if (validationFailed(req, res)) return;
    if (!(await migrationGuard(res))) return;
    if (!(await requireTeacherForSchool(req, res))) return;
    const townClass = req.body.town_class as TownClass;
    const targetUserId = Number(req.body.user_id);
    const profession = req.body.profession as import('../domain/gameOfResources/shared').ProfessionId;
    const schoolId = schoolIdFromRequest(req);

    try {
      const outcome = await withWorldTransaction(schoolId, townClass, async (client, bundle) => {
        if (!(await requireStudentInTown(client, schoolId, townClass, targetUserId, res))) {
          throw new Error('__abort__');
        }
        const gameplay = runTeacherSetProfession(bundle, targetUserId, profession);
        if (!gameplay.ok) {
          return { ok: false as const, reason: gameplay.reason || 'Could not set profession.' };
        }
        await applyGameplayAndSave(client, bundle, targetUserId, gameplay);
        return { ok: true as const };
      });
      if (!outcome.ok) {
        res.status(400).json({ error: outcome.reason });
        return;
      }
      res.json({ ok: true });
    } catch (e) {
      if (e instanceof Error && e.message === '__abort__') return;
      console.error('Game of Resources teacher profession failed:', e);
      res.status(500).json({ error: 'Could not set profession.' });
    }
  }
);

router.get(
  '/teacher/export.csv',
  authenticateToken,
  requireTenant,
  query('town_class').isIn(['6A', '6B', '6C']),
  async (req: AuthenticatedRequest, res: Response) => {
    if (validationFailed(req, res)) return;
    if (!(await migrationGuard(res))) return;
    if (!(await requireTeacherForSchool(req, res))) return;
    const townClass = req.query.town_class as TownClass;
    const schoolId = schoolIdFromRequest(req);

    const world = await database.get(
      `SELECT id FROM gor_worlds WHERE school_id = $1 AND town_class = $2`,
      [schoolId, townClass]
    );
    if (!world) {
      res.status(404).json({ error: 'This town has not opened Game of Resources yet.' });
      return;
    }

    const logs = await database.query(
      `SELECT round_number, kind, text, created_at FROM gor_log WHERE world_id = $1 ORDER BY id`,
      [world.id]
    );
    const reflections = await database.query(
      `SELECT r.round_number, r.text, u.username, u.first_name, u.last_name
       FROM gor_reflections r
       JOIN gor_citizens c ON c.id = r.citizen_id
       JOIN users u ON u.id = c.user_id
       WHERE r.world_id = $1
       ORDER BY r.round_number, u.username`,
      [world.id]
    );

    const lines = ['type,round,text,user,created_at'];
    for (const row of logs) {
      lines.push(
        `log,${row.round_number},"${String(row.text).replace(/"/g, '""')}",,${row.created_at?.toISOString?.() ?? ''}`
      );
    }
    for (const row of reflections) {
      const name = displayNameForUser(row);
      lines.push(
        `reflection,${row.round_number},"${String(row.text).replace(/"/g, '""')}","${name.replace(/"/g, '""')}",`
      );
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="game-of-resources-${townClass}.csv"`);
    res.send(lines.join('\n'));
  }
);

router.post(
  '/teacher/reset',
  authenticateToken,
  requireTenant,
  body('town_class').isIn(['6A', '6B', '6C']),
  body('confirm').equals('RESET').withMessage('Type RESET to confirm.'),
  async (req: AuthenticatedRequest, res: Response) => {
    if (validationFailed(req, res)) return;
    if (!(await migrationGuard(res))) return;
    if (!(await requireTeacherForSchool(req, res))) return;
    const townClass = req.body.town_class as TownClass;
    const schoolId = schoolIdFromRequest(req);

    try {
      await withWorldTransaction(schoolId, townClass, async (client, bundle) => {
        await resetWorldForTown(client, bundle.row.id);
      });
      res.json({ ok: true });
    } catch (e) {
      console.error('Game of Resources reset failed:', e);
      res.status(500).json({ error: 'Could not reset this world.' });
    }
  }
);

router.post('/teacher/run-checks', authenticateToken, requireTenant, async (req: AuthenticatedRequest, res: Response) => {
  if (!(await requireTeacherForSchool(req, res))) return;
  const checks = runRuleChecks();
  const allPass = checks.every((c) => c.pass);
  res.json({ ok: allPass, checks });
});

router.post(
  '/bank-bridge/request',
  authenticateToken,
  requireTenant,
  body('coins').isInt({ min: 1, max: 99999 }),
  async (req: AuthenticatedRequest, res: Response) => {
    if (validationFailed(req, res)) return;
    if (!(await migrationGuard(res))) return;
    const user = await requireApprovedStudentWithRules(req, res);
    if (!user) return;
    const townClass = resolveStudentTown(user);
    const schoolId = schoolIdFromRequest(req);
    const coins = Number(req.body.coins);

    try {
      const row = await withWorldTransaction(schoolId, townClass, async (client, bundle) => {
        await buildStatusForStudent(client, bundle, user.id, displayNameForUser(user));
        const bridge = bridgeSettingsFromWorld(bundle.row.settings);
        if (!bridge.enabled) {
          return { ok: false as const, reason: 'Your teacher has not turned on coin conversion.' };
        }
        const randUnits = bankRandFromCoins(coins, bridge.coinsPerRand);
        if (randUnits < 1) {
          return {
            ok: false as const,
            reason: `You need at least ${bridge.coinsPerRand} game coins for R1.`,
          };
        }
        const bankAmount = randUnits;
        const coinsNeeded = randUnits * bridge.coinsPerRand;
        const pending = await countPendingRedemptionsForUser(client, bundle.row.id, user.id);
        const available = citizenCoins(bundle, user.id) - pending;
        if (coinsNeeded > available) {
          return { ok: false as const, reason: 'You do not have enough game coins (including pending requests).' };
        }
        const ins = await client.query(
          `INSERT INTO gor_coin_redemptions (world_id, user_id, game_coins, bank_amount, coins_per_rand, status)
           VALUES ($1, $2, $3, $4, $5, 'pending')
           RETURNING id, game_coins, bank_amount, coins_per_rand, status, created_at`,
          [bundle.row.id, user.id, coinsNeeded, bankAmount, bridge.coinsPerRand]
        );
        return { ok: true as const, request: ins.rows[0] };
      });
      if (!row.ok) {
        res.status(400).json({ error: row.reason });
        return;
      }
      res.json({
        message: 'Your teacher must approve this conversion before money moves to your bank account.',
        request: row.request,
      });
    } catch (e) {
      console.error('GOR bank bridge request failed:', e);
      res.status(500).json({ error: 'Could not submit your conversion request.' });
    }
  }
);

router.get(
  '/bank-bridge/pending',
  authenticateToken,
  requireTenant,
  query('town_class').isIn(['6A', '6B', '6C']),
  async (req: AuthenticatedRequest, res: Response) => {
    if (validationFailed(req, res)) return;
    if (!(await migrationGuard(res))) return;
    if (!(await requireTeacherForSchool(req, res))) return;
    const townClass = req.query.town_class as TownClass;
    const schoolId = schoolIdFromRequest(req);
    const world = await database.get(
      `SELECT id FROM gor_worlds WHERE school_id = $1 AND town_class = $2`,
      [schoolId, townClass]
    );
    if (!world) {
      res.json([]);
      return;
    }
    const rows = await database.query(
      `SELECT r.*, u.username, u.first_name, u.last_name
       FROM gor_coin_redemptions r
       JOIN users u ON u.id = r.user_id
       WHERE r.world_id = $1 AND r.status = 'pending'
       ORDER BY r.created_at ASC`,
      [world.id]
    );
    res.json(rows);
  }
);

async function reviewBankBridge(
  req: AuthenticatedRequest,
  res: Response,
  approve: boolean
): Promise<void> {
  if (!(await migrationGuard(res))) return;
  if (!(await requireTeacherForSchool(req, res))) return;
  const townClass = resolveTeacherTown(req, res);
  if (!townClass) return;
  const schoolId = schoolIdFromRequest(req);
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'Invalid request.' });
    return;
  }

  try {
    const result = await withWorldTransaction(schoolId, townClass, async (client, bundle) => {
      const lock = await client.query(
        `SELECT * FROM gor_coin_redemptions WHERE id = $1 AND world_id = $2 FOR UPDATE`,
        [id, bundle.row.id]
      );
      if (!lock.rows.length) return { ok: false as const, reason: 'Request not found.' };
      const row = lock.rows[0];
      if (row.status !== 'pending') return { ok: false as const, reason: 'This request was already reviewed.' };

      if (!approve) {
        await client.query(
          `UPDATE gor_coin_redemptions SET status = 'denied', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [req.user!.id, id]
        );
        return { ok: true as const, denied: true as const };
      }

      const deduct = deductGameCoins(bundle, row.user_id, row.game_coins);
      if (!deduct.ok || !deduct.state) {
        return { ok: false as const, reason: deduct.reason || 'Could not deduct game coins.' };
      }

      const acctRes = await client.query('SELECT * FROM accounts WHERE user_id = $1', [row.user_id]);
      const account = acctRes.rows[0];
      if (!account) return { ok: false as const, reason: 'Student bank account not found.' };

      const saved = await saveWorldState(client, bundle, deduct.state, { expectedVersion: bundle.row.version });
      if (!saved) {
        return { ok: false as const, reason: 'World version conflict — refresh and try again.' };
      }

      const amount = parseFloat(row.bank_amount);
      await client.query(`UPDATE accounts SET balance = balance + $1 WHERE id = $2`, [amount, account.id]);
      await client.query(
        `INSERT INTO transactions (to_account_id, amount, transaction_type, description)
         VALUES ($1, $2, 'deposit', $3)`,
        [
          account.id,
          amount,
          `Game of Resources: ${row.game_coins} game coins converted to R${amount} (teacher approved)`,
        ]
      );
      await client.query(
        `UPDATE gor_coin_redemptions SET status = 'approved', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [req.user!.id, id]
      );
      return {
        ok: true as const,
        approved: true as const,
        bank_amount: amount,
        worldId: saved.id,
        worldVersion: saved.version,
      };
    });

    if (!result.ok) {
      res.status(400).json({ error: result.reason });
      return;
    }
    if ('approved' in result && result.approved && result.worldId != null && result.worldVersion != null) {
      notifyWorldVersion(result.worldId, result.worldVersion);
    }
    res.json(result);
  } catch (e) {
    console.error('GOR bank bridge review failed:', e);
    res.status(500).json({ error: 'Could not review this conversion.' });
  }
}

router.post(
  '/bank-bridge/:id/approve',
  authenticateToken,
  requireTenant,
  body('town_class').isIn(['6A', '6B', '6C']),
  (req, res) => reviewBankBridge(req, res, true)
);
router.post(
  '/bank-bridge/:id/deny',
  authenticateToken,
  requireTenant,
  body('town_class').isIn(['6A', '6B', '6C']),
  (req, res) => reviewBankBridge(req, res, false)
);

export default router;
