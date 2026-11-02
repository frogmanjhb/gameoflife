"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const access_1 = require("../domain/gameOfResources/access");
const actions_1 = require("../domain/gameOfResources/actions");
const rateLimit_1 = require("../domain/gameOfResources/rateLimit");
const scheduleTime_1 = require("../domain/gameOfResources/scheduleTime");
const liveUpdates_1 = require("../domain/gameOfResources/liveUpdates");
const shared_1 = require("../domain/gameOfResources/shared");
const bankBridge_1 = require("../domain/gameOfResources/bankBridge");
const worldRepository_1 = require("../domain/gameOfResources/worldRepository");
const worldSession_1 = require("../domain/gameOfResources/worldSession");
const avatar_1 = require("../domain/gameOfResources/avatar");
const router = (0, express_1.Router)();
async function migrationGuard(res) {
    if (!(await (0, access_1.tablesReady)())) {
        res.status(503).json({ error: 'Game of Resources is not set up yet. Ask your teacher to run the database migration.' });
        return false;
    }
    return true;
}
function validationFailed(req, res) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ error: errors.array()[0]?.msg || 'Invalid request.' });
        return true;
    }
    return false;
}
function rateLimitUser(userId, res) {
    const key = `gor:action:${userId}`;
    if (!(0, rateLimit_1.checkRateLimit)(key, 10, 10000)) {
        res.status(429).json({ error: 'You are acting too quickly. Wait a few seconds and try again.' });
        return false;
    }
    return true;
}
async function studentGameplayResponse(res, userId, displayName, townClass, schoolId, play, options) {
    try {
        const outcome = await (0, worldSession_1.withWorldTransaction)(schoolId, townClass, async (client, bundle) => {
            await (0, worldSession_1.buildStatusForStudent)(client, bundle, userId, displayName);
            const gameplay = await play(client, bundle);
            if (gameplay.clientVersion != null && gameplay.clientVersion !== bundle.row.version) {
                return {
                    ok: false,
                    conflict: true,
                    reason: 'The world changed while you were playing. Refresh and try again.',
                };
            }
            if (!gameplay.ok) {
                return { ok: false, reason: gameplay.reason };
            }
            await (0, worldSession_1.applyGameplayAndSave)(client, bundle, userId, gameplay, options);
            const viewStatus = await (0, worldSession_1.buildStatusForStudent)(client, bundle, userId, displayName);
            return { ok: true, viewStatus, event: gameplay.event };
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
    }
    catch (e) {
        console.error('Game of Resources action failed:', e);
        const msg = e instanceof Error ? e.message : 'Internal server error';
        if (msg.includes('version conflict')) {
            res.status(409).json({ error: msg });
            return;
        }
        res.status(500).json({ error: 'Something went wrong. Try again.' });
    }
}
router.get('/status', auth_1.authenticateToken, tenant_1.requireTenant, (0, express_validator_1.query)('since').optional().isInt({ min: 0 }).withMessage('since must be a version number'), async (req, res) => {
    if (validationFailed(req, res))
        return;
    if (!(await migrationGuard(res)))
        return;
    const user = await (0, access_1.requireApprovedStudentWithRules)(req, res);
    if (!user)
        return;
    const since = req.query.since != null ? Number(req.query.since) : null;
    const townClass = (0, access_1.resolveStudentTown)(user);
    const schoolId = (0, access_1.schoolIdFromRequest)(req);
    const displayName = (0, access_1.displayNameForUser)(user);
    try {
        const payload = await (0, worldSession_1.withWorldTransaction)(schoolId, townClass, async (client, bundle) => {
            if (since != null && since === bundle.row.version) {
                return { unchanged: true, version: bundle.row.version };
            }
            return { unchanged: false, ...(await (0, worldSession_1.buildStatusForStudent)(client, bundle, user.id, displayName)) };
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
    }
    catch (e) {
        console.error('Game of Resources status failed:', e);
        res.status(500).json({ error: 'Could not load the world. Try again.' });
    }
});
router.get('/events', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    if (!(await migrationGuard(res)))
        return;
    const user = await (0, access_1.requireApprovedStudentWithRules)(req, res);
    if (!user)
        return;
    const townClass = (0, access_1.resolveStudentTown)(user);
    const schoolId = (0, access_1.schoolIdFromRequest)(req);
    try {
        const client = await database_prod_1.default.getClient();
        try {
            await client.query('BEGIN');
            const bundle = await (0, worldRepository_1.getOrCreateWorldLocked)(client, schoolId, townClass);
            await client.query('COMMIT');
            (0, liveUpdates_1.subscribeWorld)(bundle.row.id, res);
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        finally {
            client.release();
        }
    }
    catch (e) {
        console.error('Game of Resources SSE failed:', e);
        if (!res.headersSent)
            res.status(500).json({ error: 'Could not open live updates.' });
    }
});
router.post('/action', auth_1.authenticateToken, tenant_1.requireTenant, (0, express_validator_1.body)('type').isString().trim().notEmpty().withMessage('Choose an action.'), (0, express_validator_1.body)('opt').optional().isObject().withMessage('opt must be an object'), (0, express_validator_1.body)('clientVersion').optional().isInt({ min: 0 }), async (req, res) => {
    if (validationFailed(req, res))
        return;
    if (!(await migrationGuard(res)))
        return;
    const user = await (0, access_1.requireApprovedStudentWithRules)(req, res);
    if (!user)
        return;
    if (!rateLimitUser(user.id, res))
        return;
    const type = String(req.body.type);
    const opt = (req.body.opt ?? {});
    const err = (0, actions_1.validateActionOpt)(type, opt);
    if (err) {
        res.status(400).json({ error: err });
        return;
    }
    const townClass = (0, access_1.resolveStudentTown)(user);
    const schoolId = (0, access_1.schoolIdFromRequest)(req);
    const displayName = (0, access_1.displayNameForUser)(user);
    const clientVersion = req.body.clientVersion != null ? Number(req.body.clientVersion) : undefined;
    await studentGameplayResponse(res, user.id, displayName, townClass, schoolId, async (_client, bundle) => {
        const r = (0, actions_1.runDoAction)(bundle, user.id, type, opt);
        return { ...r, clientVersion };
    });
});
function marketRoute(path, kind, validators) {
    router.post(path, auth_1.authenticateToken, tenant_1.requireTenant, ...validators, async (req, res) => {
        if (validationFailed(req, res))
            return;
        if (!(await migrationGuard(res)))
            return;
        const user = await (0, access_1.requireApprovedStudentWithRules)(req, res);
        if (!user)
            return;
        if (!rateLimitUser(user.id, res))
            return;
        const townClass = (0, access_1.resolveStudentTown)(user);
        const schoolId = (0, access_1.schoolIdFromRequest)(req);
        const displayName = (0, access_1.displayNameForUser)(user);
        const payload = { ...req.body, clientVersion: req.body.clientVersion };
        await studentGameplayResponse(res, user.id, displayName, townClass, schoolId, async (_client, bundle) => {
            const r = (0, actions_1.runMarketAction)(bundle, user.id, kind, payload);
            return { ...r, clientVersion: payload.clientVersion };
        });
    });
}
marketRoute('/market/store-buy', 'storeBuy', [
    (0, express_validator_1.body)('item').isIn(shared_1.RULES.ITEMS).withMessage('Choose a valid item.'),
    (0, express_validator_1.body)('qty').optional().isInt({ min: 1, max: 99 }),
    (0, express_validator_1.body)('clientVersion').optional().isInt({ min: 0 }),
]);
marketRoute('/market/store-sell', 'storeSell', [
    (0, express_validator_1.body)('item').isIn(shared_1.RULES.ITEMS).withMessage('Choose a valid item.'),
    (0, express_validator_1.body)('qty').optional().isInt({ min: 1, max: 99 }),
    (0, express_validator_1.body)('clientVersion').optional().isInt({ min: 0 }),
]);
marketRoute('/market/list', 'list', [
    (0, express_validator_1.body)('item').isIn(shared_1.RULES.ITEMS).withMessage('Choose a valid item.'),
    (0, express_validator_1.body)('qty').isInt({ min: 1, max: 99 }),
    (0, express_validator_1.body)('price').isInt({ min: 1, max: 9999 }),
    (0, express_validator_1.body)('clientVersion').optional().isInt({ min: 0 }),
]);
marketRoute('/market/cancel', 'cancel', [
    (0, express_validator_1.body)('listingId').isString().trim().notEmpty(),
    (0, express_validator_1.body)('clientVersion').optional().isInt({ min: 0 }),
]);
marketRoute('/market/buy', 'buy', [
    (0, express_validator_1.body)('listingId').isString().trim().notEmpty(),
    (0, express_validator_1.body)('qty').isInt({ min: 1, max: 99 }),
    (0, express_validator_1.body)('clientVersion').optional().isInt({ min: 0 }),
]);
router.post('/works/start', auth_1.authenticateToken, tenant_1.requireTenant, (0, express_validator_1.body)('kind').isIn(['reclaim', 'link']).withMessage('Choose reclaim or link.'), (0, express_validator_1.body)('cellId').isInt({ min: 0, max: 2000 }), (0, express_validator_1.body)('clientVersion').optional().isInt({ min: 0 }), async (req, res) => {
    if (validationFailed(req, res))
        return;
    if (!(await migrationGuard(res)))
        return;
    const user = await (0, access_1.requireApprovedStudentWithRules)(req, res);
    if (!user)
        return;
    if (!rateLimitUser(user.id, res))
        return;
    const townClass = (0, access_1.resolveStudentTown)(user);
    const schoolId = (0, access_1.schoolIdFromRequest)(req);
    const displayName = (0, access_1.displayNameForUser)(user);
    const kind = req.body.kind;
    const cellId = Number(req.body.cellId);
    await studentGameplayResponse(res, user.id, displayName, townClass, schoolId, async (_client, bundle) => {
        const r = (0, actions_1.runStartWork)(bundle, user.id, kind, cellId);
        return { ...r, clientVersion: req.body.clientVersion };
    });
});
router.post('/job/change', auth_1.authenticateToken, tenant_1.requireTenant, (0, express_validator_1.body)('profession').custom((v) => {
    if (!(0, access_1.isProfessionId)(v))
        throw new Error('Choose a valid profession.');
    return true;
}), (0, express_validator_1.body)('clientVersion').optional().isInt({ min: 0 }), async (req, res) => {
    if (validationFailed(req, res))
        return;
    if (!(await migrationGuard(res)))
        return;
    const user = await (0, access_1.requireApprovedStudentWithRules)(req, res);
    if (!user)
        return;
    if (!rateLimitUser(user.id, res))
        return;
    const townClass = (0, access_1.resolveStudentTown)(user);
    const schoolId = (0, access_1.schoolIdFromRequest)(req);
    const displayName = (0, access_1.displayNameForUser)(user);
    const profession = req.body.profession;
    await studentGameplayResponse(res, user.id, displayName, townClass, schoolId, async (client, bundle) => {
        const r = await (0, actions_1.runJobChange)(client, bundle, user.id, profession, bundle.row.settings);
        return { ...r, clientVersion: req.body.clientVersion };
    });
});
router.post('/avatar', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    if (!(await migrationGuard(res)))
        return;
    const user = await (0, access_1.requireApprovedStudentWithRules)(req, res);
    if (!user)
        return;
    if (!rateLimitUser(user.id, res))
        return;
    const townClass = (0, access_1.resolveStudentTown)(user);
    const schoolId = (0, access_1.schoolIdFromRequest)(req);
    const displayName = (0, access_1.displayNameForUser)(user);
    const patch = req.body;
    try {
        const payload = await (0, worldSession_1.withWorldTransaction)(schoolId, townClass, async (client, bundle) => {
            const cid = (0, worldRepository_1.citizenIdForUser)(user.id);
            const citizen = bundle.state.citizens.find((c) => c.id === cid);
            if (!citizen) {
                return { ok: false, reason: 'Citizen not found.' };
            }
            const row0 = bundle.citizenRows.find((r) => r.user_id === user.id);
            const current = (0, avatar_1.parseGorAvatar)(row0?.avatar, citizen.prof);
            const validated = (0, avatar_1.validateAvatarPatch)(current, patch);
            if (!validated.ok) {
                return { ok: false, reason: validated.reason };
            }
            const row = await (0, worldRepository_1.updateCitizenAvatar)(client, bundle.row.id, user.id, validated.avatar);
            if (!row) {
                return { ok: false, reason: 'Citizen not found.' };
            }
            const idx = bundle.citizenRows.findIndex((r) => r.user_id === user.id);
            if (idx >= 0)
                bundle.citizenRows[idx] = row;
            return { ok: true, ...(await (0, worldSession_1.buildStatusForStudent)(client, bundle, user.id, displayName)) };
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
    }
    catch (e) {
        console.error('Game of Resources avatar failed:', e);
        res.status(500).json({ error: 'Could not save your character.' });
    }
});
router.post('/reflection', auth_1.authenticateToken, tenant_1.requireTenant, (0, express_validator_1.body)('round').isInt({ min: 1 }), (0, express_validator_1.body)('text').isString().isLength({ max: shared_1.CONFIG.reflectionMax }), (0, express_validator_1.body)('clientVersion').optional().isInt({ min: 0 }), async (req, res) => {
    if (validationFailed(req, res))
        return;
    if (!(await migrationGuard(res)))
        return;
    const user = await (0, access_1.requireApprovedStudentWithRules)(req, res);
    if (!user)
        return;
    if (!rateLimitUser(user.id, res))
        return;
    const townClass = (0, access_1.resolveStudentTown)(user);
    const schoolId = (0, access_1.schoolIdFromRequest)(req);
    const displayName = (0, access_1.displayNameForUser)(user);
    const text = (0, access_1.stripHtml)(String(req.body.text));
    const round = Number(req.body.round);
    await studentGameplayResponse(res, user.id, displayName, townClass, schoolId, async (client, bundle) => {
        const r = await (0, actions_1.runSaveReflection)(client, bundle, user.id, round, text);
        return { ...r, clientVersion: req.body.clientVersion };
    });
});
router.get('/teacher/worlds', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    if (!(await migrationGuard(res)))
        return;
    if (!(await (0, access_1.requireTeacherForSchool)(req, res)))
        return;
    const schoolId = (0, access_1.schoolIdFromRequest)(req);
    const rows = await database_prod_1.default.query(`SELECT w.id, w.town_class, w.round_number, w.round_open, w.version, w.paused,
              w.round_started_at, w.round_ends_at, w.settings,
              (SELECT COUNT(*)::int FROM gor_citizens c WHERE c.world_id = w.id) AS citizen_count
       FROM gor_worlds w
       WHERE w.school_id = $1
       ORDER BY w.town_class`, [schoolId]);
    res.json(rows);
});
async function teacherRoundRoute(op, req, res) {
    if (!(await migrationGuard(res)))
        return;
    if (!(await (0, access_1.requireTeacherForSchool)(req, res)))
        return;
    const townClass = (0, access_1.resolveTeacherTown)(req, res);
    if (!townClass)
        return;
    const schoolId = (0, access_1.schoolIdFromRequest)(req);
    try {
        const result = await (0, worldSession_1.withWorldTransaction)(schoolId, townClass, async (client, bundle) => {
            const gameplay = (0, actions_1.runTeacherRound)(bundle, op);
            if (!gameplay.ok)
                return { ok: false, reason: gameplay.reason };
            const now = new Date();
            const schedule = op === 'advance'
                ? { roundStartedAt: now, roundEndsAt: (0, scheduleTime_1.nextRoundEndsAt)(bundle.row.settings, now) }
                : {};
            const saved = await (0, worldSession_1.applyGameplayAndSave)(client, bundle, 0, gameplay, {
                advanceSummary: op === 'advance',
                ...schedule,
            });
            return { ok: true, version: saved.row.version, summary: gameplay.summary ?? null };
        });
        if (!result.ok) {
            res.status(400).json({ error: result.reason || 'Could not change the round.' });
            return;
        }
        res.json({ ok: true, version: result.version, summary: result.summary });
    }
    catch (e) {
        console.error('Game of Resources teacher round failed:', e);
        res.status(500).json({ error: 'Could not change the round.' });
    }
}
router.post('/teacher/round/open', auth_1.authenticateToken, tenant_1.requireTenant, (req, res) => teacherRoundRoute('open', req, res));
router.post('/teacher/round/close', auth_1.authenticateToken, tenant_1.requireTenant, (req, res) => teacherRoundRoute('close', req, res));
router.post('/teacher/round/advance', auth_1.authenticateToken, tenant_1.requireTenant, (req, res) => teacherRoundRoute('advance', req, res));
router.put('/teacher/settings', auth_1.authenticateToken, tenant_1.requireTenant, (0, express_validator_1.body)('town_class').isIn(['6A', '6B', '6C']), (0, express_validator_1.body)('settings').isObject(), async (req, res) => {
    if (validationFailed(req, res))
        return;
    if (!(await migrationGuard(res)))
        return;
    if (!(await (0, access_1.requireTeacherForSchool)(req, res)))
        return;
    const townClass = req.body.town_class;
    const schoolId = (0, access_1.schoolIdFromRequest)(req);
    const incoming = req.body.settings;
    try {
        const row = await (0, worldSession_1.withWorldTransaction)(schoolId, townClass, async (client, bundle) => {
            const merged = { ...bundle.row.settings, ...incoming };
            const paused = typeof incoming.automationPaused === 'boolean' ? incoming.automationPaused : undefined;
            return (0, worldRepository_1.updateWorldSettings)(client, bundle.row.id, merged, bundle.row.version, paused);
        });
        res.json({ settings: row.settings, version: row.version });
    }
    catch (e) {
        console.error('Game of Resources settings failed:', e);
        res.status(500).json({ error: 'Could not save settings.' });
    }
});
router.get('/teacher/citizens', auth_1.authenticateToken, tenant_1.requireTenant, (0, express_validator_1.query)('town_class').isIn(['6A', '6B', '6C']), async (req, res) => {
    if (validationFailed(req, res))
        return;
    if (!(await migrationGuard(res)))
        return;
    if (!(await (0, access_1.requireTeacherForSchool)(req, res)))
        return;
    const townClass = req.query.town_class;
    const schoolId = (0, access_1.schoolIdFromRequest)(req);
    try {
        const rows = await (0, worldSession_1.withWorldTransaction)(schoolId, townClass, async (client, bundle) => {
            const names = await (0, access_1.loadDisplayNameMap)(client, schoolId, townClass);
            return bundle.state.citizens.map((c) => {
                const uid = (0, worldRepository_1.userIdFromCitizenId)(c.id);
                if (uid == null)
                    return null;
                return {
                    userId: uid,
                    name: names.get(uid) ?? c.name,
                    profession: c.prof,
                    professionName: shared_1.CONFIG.professions[c.prof].name,
                    hungry: c.hungry,
                    level: shared_1.RULES.levelFor(c.xp),
                    actions: c.actions,
                    contrib: c.contrib,
                    lastActiveRound: c.lastActiveRound ?? null,
                    inactive: !shared_1.RULES.isCitizenActive(c, bundle.state.round.n),
                };
            }).filter(Boolean);
        });
        res.json(rows);
    }
    catch (e) {
        console.error('Game of Resources teacher citizens failed:', e);
        res.status(500).json({ error: 'Could not load citizens.' });
    }
});
router.get('/teacher/status', auth_1.authenticateToken, tenant_1.requireTenant, (0, express_validator_1.query)('town_class').isIn(['6A', '6B', '6C']), (0, express_validator_1.query)('user_id').isInt({ min: 1 }).withMessage('Choose a student.'), (0, express_validator_1.query)('since').optional().isInt({ min: 0 }), async (req, res) => {
    if (validationFailed(req, res))
        return;
    if (!(await migrationGuard(res)))
        return;
    if (!(await (0, access_1.requireTeacherForSchool)(req, res)))
        return;
    const townClass = req.query.town_class;
    const targetUserId = Number(req.query.user_id);
    const since = req.query.since != null ? Number(req.query.since) : null;
    const schoolId = (0, access_1.schoolIdFromRequest)(req);
    try {
        const payload = await (0, worldSession_1.withWorldTransaction)(schoolId, townClass, async (client, bundle) => {
            if (!(await (0, access_1.requireStudentInTown)(client, schoolId, townClass, targetUserId, res))) {
                throw new Error('__abort__');
            }
            if (since != null && since === bundle.row.version) {
                return { unchanged: true, version: bundle.row.version };
            }
            const nameMap = await (0, access_1.loadDisplayNameMap)(client, schoolId, townClass);
            const displayName = nameMap.get(targetUserId) ?? `Student ${targetUserId}`;
            const status = await (0, worldSession_1.buildStatusForStudent)(client, bundle, targetUserId, displayName);
            return { unchanged: false, ...status };
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
    }
    catch (e) {
        if (e instanceof Error && e.message === '__abort__')
            return;
        console.error('Game of Resources teacher status failed:', e);
        res.status(500).json({ error: 'Could not load the world for that student.' });
    }
});
router.post('/teacher/citizens/profession', auth_1.authenticateToken, tenant_1.requireTenant, (0, express_validator_1.body)('town_class').isIn(['6A', '6B', '6C']), (0, express_validator_1.body)('user_id').isInt({ min: 1 }), (0, express_validator_1.body)('profession').custom((v) => (0, access_1.isProfessionId)(v) || Promise.reject('Choose a valid profession.')), async (req, res) => {
    if (validationFailed(req, res))
        return;
    if (!(await migrationGuard(res)))
        return;
    if (!(await (0, access_1.requireTeacherForSchool)(req, res)))
        return;
    const townClass = req.body.town_class;
    const targetUserId = Number(req.body.user_id);
    const profession = req.body.profession;
    const schoolId = (0, access_1.schoolIdFromRequest)(req);
    try {
        const outcome = await (0, worldSession_1.withWorldTransaction)(schoolId, townClass, async (client, bundle) => {
            if (!(await (0, access_1.requireStudentInTown)(client, schoolId, townClass, targetUserId, res))) {
                throw new Error('__abort__');
            }
            const gameplay = (0, actions_1.runTeacherSetProfession)(bundle, targetUserId, profession);
            if (!gameplay.ok) {
                return { ok: false, reason: gameplay.reason || 'Could not set profession.' };
            }
            await (0, worldSession_1.applyGameplayAndSave)(client, bundle, targetUserId, gameplay);
            return { ok: true };
        });
        if (!outcome.ok) {
            res.status(400).json({ error: outcome.reason });
            return;
        }
        res.json({ ok: true });
    }
    catch (e) {
        if (e instanceof Error && e.message === '__abort__')
            return;
        console.error('Game of Resources teacher profession failed:', e);
        res.status(500).json({ error: 'Could not set profession.' });
    }
});
router.get('/teacher/export.csv', auth_1.authenticateToken, tenant_1.requireTenant, (0, express_validator_1.query)('town_class').isIn(['6A', '6B', '6C']), async (req, res) => {
    if (validationFailed(req, res))
        return;
    if (!(await migrationGuard(res)))
        return;
    if (!(await (0, access_1.requireTeacherForSchool)(req, res)))
        return;
    const townClass = req.query.town_class;
    const schoolId = (0, access_1.schoolIdFromRequest)(req);
    const world = await database_prod_1.default.get(`SELECT id FROM gor_worlds WHERE school_id = $1 AND town_class = $2`, [schoolId, townClass]);
    if (!world) {
        res.status(404).json({ error: 'This town has not opened Game of Resources yet.' });
        return;
    }
    const logs = await database_prod_1.default.query(`SELECT round_number, kind, text, created_at FROM gor_log WHERE world_id = $1 ORDER BY id`, [world.id]);
    const reflections = await database_prod_1.default.query(`SELECT r.round_number, r.text, u.username, u.first_name, u.last_name
       FROM gor_reflections r
       JOIN gor_citizens c ON c.id = r.citizen_id
       JOIN users u ON u.id = c.user_id
       WHERE r.world_id = $1
       ORDER BY r.round_number, u.username`, [world.id]);
    const lines = ['type,round,text,user,created_at'];
    for (const row of logs) {
        lines.push(`log,${row.round_number},"${String(row.text).replace(/"/g, '""')}",,${row.created_at?.toISOString?.() ?? ''}`);
    }
    for (const row of reflections) {
        const name = (0, access_1.displayNameForUser)(row);
        lines.push(`reflection,${row.round_number},"${String(row.text).replace(/"/g, '""')}","${name.replace(/"/g, '""')}",`);
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="game-of-resources-${townClass}.csv"`);
    res.send(lines.join('\n'));
});
router.post('/teacher/reset', auth_1.authenticateToken, tenant_1.requireTenant, (0, express_validator_1.body)('town_class').isIn(['6A', '6B', '6C']), (0, express_validator_1.body)('confirm').equals('RESET').withMessage('Type RESET to confirm.'), async (req, res) => {
    if (validationFailed(req, res))
        return;
    if (!(await migrationGuard(res)))
        return;
    if (!(await (0, access_1.requireTeacherForSchool)(req, res)))
        return;
    const townClass = req.body.town_class;
    const schoolId = (0, access_1.schoolIdFromRequest)(req);
    try {
        await (0, worldSession_1.withWorldTransaction)(schoolId, townClass, async (client, bundle) => {
            await (0, worldRepository_1.resetWorldForTown)(client, bundle.row.id);
        });
        res.json({ ok: true });
    }
    catch (e) {
        console.error('Game of Resources reset failed:', e);
        res.status(500).json({ error: 'Could not reset this world.' });
    }
});
router.post('/teacher/run-checks', auth_1.authenticateToken, tenant_1.requireTenant, async (req, res) => {
    if (!(await (0, access_1.requireTeacherForSchool)(req, res)))
        return;
    const checks = (0, actions_1.runRuleChecks)();
    const allPass = checks.every((c) => c.pass);
    res.json({ ok: allPass, checks });
});
router.post('/bank-bridge/request', auth_1.authenticateToken, tenant_1.requireTenant, (0, express_validator_1.body)('coins').isInt({ min: 1, max: 99999 }), async (req, res) => {
    if (validationFailed(req, res))
        return;
    if (!(await migrationGuard(res)))
        return;
    const user = await (0, access_1.requireApprovedStudentWithRules)(req, res);
    if (!user)
        return;
    const townClass = (0, access_1.resolveStudentTown)(user);
    const schoolId = (0, access_1.schoolIdFromRequest)(req);
    const coins = Number(req.body.coins);
    try {
        const row = await (0, worldSession_1.withWorldTransaction)(schoolId, townClass, async (client, bundle) => {
            await (0, worldSession_1.buildStatusForStudent)(client, bundle, user.id, (0, access_1.displayNameForUser)(user));
            const bridge = (0, bankBridge_1.bridgeSettingsFromWorld)(bundle.row.settings);
            if (!bridge.enabled) {
                return { ok: false, reason: 'Your teacher has not turned on coin conversion.' };
            }
            const randUnits = (0, bankBridge_1.bankRandFromCoins)(coins, bridge.coinsPerRand);
            if (randUnits < 1) {
                return {
                    ok: false,
                    reason: `You need at least ${bridge.coinsPerRand} game coins for R1.`,
                };
            }
            const bankAmount = randUnits;
            const coinsNeeded = randUnits * bridge.coinsPerRand;
            const pending = await (0, bankBridge_1.countPendingRedemptionsForUser)(client, bundle.row.id, user.id);
            const available = (0, bankBridge_1.citizenCoins)(bundle, user.id) - pending;
            if (coinsNeeded > available) {
                return { ok: false, reason: 'You do not have enough game coins (including pending requests).' };
            }
            const ins = await client.query(`INSERT INTO gor_coin_redemptions (world_id, user_id, game_coins, bank_amount, coins_per_rand, status)
           VALUES ($1, $2, $3, $4, $5, 'pending')
           RETURNING id, game_coins, bank_amount, coins_per_rand, status, created_at`, [bundle.row.id, user.id, coinsNeeded, bankAmount, bridge.coinsPerRand]);
            return { ok: true, request: ins.rows[0] };
        });
        if (!row.ok) {
            res.status(400).json({ error: row.reason });
            return;
        }
        res.json({
            message: 'Your teacher must approve this conversion before money moves to your bank account.',
            request: row.request,
        });
    }
    catch (e) {
        console.error('GOR bank bridge request failed:', e);
        res.status(500).json({ error: 'Could not submit your conversion request.' });
    }
});
router.get('/bank-bridge/pending', auth_1.authenticateToken, tenant_1.requireTenant, (0, express_validator_1.query)('town_class').isIn(['6A', '6B', '6C']), async (req, res) => {
    if (validationFailed(req, res))
        return;
    if (!(await migrationGuard(res)))
        return;
    if (!(await (0, access_1.requireTeacherForSchool)(req, res)))
        return;
    const townClass = req.query.town_class;
    const schoolId = (0, access_1.schoolIdFromRequest)(req);
    const world = await database_prod_1.default.get(`SELECT id FROM gor_worlds WHERE school_id = $1 AND town_class = $2`, [schoolId, townClass]);
    if (!world) {
        res.json([]);
        return;
    }
    const rows = await database_prod_1.default.query(`SELECT r.*, u.username, u.first_name, u.last_name
       FROM gor_coin_redemptions r
       JOIN users u ON u.id = r.user_id
       WHERE r.world_id = $1 AND r.status = 'pending'
       ORDER BY r.created_at ASC`, [world.id]);
    res.json(rows);
});
async function reviewBankBridge(req, res, approve) {
    if (!(await migrationGuard(res)))
        return;
    if (!(await (0, access_1.requireTeacherForSchool)(req, res)))
        return;
    const townClass = (0, access_1.resolveTeacherTown)(req, res);
    if (!townClass)
        return;
    const schoolId = (0, access_1.schoolIdFromRequest)(req);
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'Invalid request.' });
        return;
    }
    try {
        const result = await (0, worldSession_1.withWorldTransaction)(schoolId, townClass, async (client, bundle) => {
            const lock = await client.query(`SELECT * FROM gor_coin_redemptions WHERE id = $1 AND world_id = $2 FOR UPDATE`, [id, bundle.row.id]);
            if (!lock.rows.length)
                return { ok: false, reason: 'Request not found.' };
            const row = lock.rows[0];
            if (row.status !== 'pending')
                return { ok: false, reason: 'This request was already reviewed.' };
            if (!approve) {
                await client.query(`UPDATE gor_coin_redemptions SET status = 'denied', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP WHERE id = $2`, [req.user.id, id]);
                return { ok: true, denied: true };
            }
            const deduct = (0, bankBridge_1.deductGameCoins)(bundle, row.user_id, row.game_coins);
            if (!deduct.ok || !deduct.state) {
                return { ok: false, reason: deduct.reason || 'Could not deduct game coins.' };
            }
            const acctRes = await client.query('SELECT * FROM accounts WHERE user_id = $1', [row.user_id]);
            const account = acctRes.rows[0];
            if (!account)
                return { ok: false, reason: 'Student bank account not found.' };
            const saved = await (0, worldRepository_1.saveWorldState)(client, bundle, deduct.state, { expectedVersion: bundle.row.version });
            if (!saved) {
                return { ok: false, reason: 'World version conflict — refresh and try again.' };
            }
            const amount = parseFloat(row.bank_amount);
            await client.query(`UPDATE accounts SET balance = balance + $1 WHERE id = $2`, [amount, account.id]);
            await client.query(`INSERT INTO transactions (to_account_id, amount, transaction_type, description)
         VALUES ($1, $2, 'deposit', $3)`, [
                account.id,
                amount,
                `Game of Resources: ${row.game_coins} game coins converted to R${amount} (teacher approved)`,
            ]);
            await client.query(`UPDATE gor_coin_redemptions SET status = 'approved', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP WHERE id = $2`, [req.user.id, id]);
            return {
                ok: true,
                approved: true,
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
            (0, liveUpdates_1.notifyWorldVersion)(result.worldId, result.worldVersion);
        }
        res.json(result);
    }
    catch (e) {
        console.error('GOR bank bridge review failed:', e);
        res.status(500).json({ error: 'Could not review this conversion.' });
    }
}
router.post('/bank-bridge/:id/approve', auth_1.authenticateToken, tenant_1.requireTenant, (0, express_validator_1.body)('town_class').isIn(['6A', '6B', '6C']), (req, res) => reviewBankBridge(req, res, true));
router.post('/bank-bridge/:id/deny', auth_1.authenticateToken, tenant_1.requireTenant, (0, express_validator_1.body)('town_class').isIn(['6A', '6B', '6C']), (req, res) => reviewBankBridge(req, res, false));
exports.default = router;
//# sourceMappingURL=game-of-resources.js.map