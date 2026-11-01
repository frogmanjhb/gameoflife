"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryAdvanceScheduledWorld = tryAdvanceScheduledWorld;
exports.runGameOfResourcesSchedulerTick = runGameOfResourcesSchedulerTick;
exports.startGameOfResourcesScheduler = startGameOfResourcesScheduler;
exports.stopGameOfResourcesSchedulerForTests = stopGameOfResourcesSchedulerForTests;
exports.ensureWorldSchedule = ensureWorldSchedule;
const database_prod_1 = __importDefault(require("../../database/database-prod"));
const shared_1 = require("./shared");
const actions_1 = require("./actions");
const liveUpdates_1 = require("./liveUpdates");
const scheduleTime_1 = require("./scheduleTime");
const worldRepository_1 = require("./worldRepository");
async function tryAdvanceScheduledWorld(client, worldId, now) {
    const lock = await client.query(`SELECT pg_try_advisory_xact_lock($1) AS ok`, [(0, scheduleTime_1.advisoryLockKey)(worldId)]);
    if (!lock.rows[0]?.ok)
        return 'busy';
    const bundle = await (0, worldRepository_1.loadLockedWorldById)(client, worldId);
    if (!bundle)
        return 'skipped';
    if ((0, scheduleTime_1.isAutomationPaused)(bundle.row))
        return 'skipped';
    if (!bundle.row.round_ends_at) {
        const ends = (0, scheduleTime_1.nextRoundEndsAt)(bundle.row.settings, now);
        await (0, worldRepository_1.updateWorldRoundSchedule)(client, bundle.row.id, now, ends);
        return 'scheduled';
    }
    if (!(0, scheduleTime_1.isWorldDueForAdvance)(bundle.row, now))
        return 'skipped';
    const expectedRound = bundle.row.round_number;
    if (bundle.row.settled_rounds.includes(expectedRound)) {
        return 'skipped';
    }
    const gameplay = shared_1.RULES.advanceRound(bundle.state);
    if (!gameplay.ok)
        return 'skipped';
    const startedAt = now;
    const endsAt = (0, scheduleTime_1.nextRoundEndsAt)(bundle.row.settings, startedAt);
    const row = await (0, worldRepository_1.saveWorldState)(client, bundle, gameplay.state, {
        expectedVersion: bundle.row.version,
        expectedRoundNumber: expectedRound,
        roundStartedAt: startedAt,
        roundEndsAt: endsAt,
    });
    if (!row)
        return 'skipped';
    bundle.row = row;
    if (gameplay.summary) {
        await (0, actions_1.persistAdvanceSummary)(client, bundle, gameplay.summary);
    }
    (0, liveUpdates_1.notifyWorldVersion)(row.id, row.version);
    return 'advanced';
}
async function runGameOfResourcesSchedulerTick(now = new Date()) {
    const result = {
        scanned: 0,
        advanced: 0,
        scheduled: 0,
        skipped: 0,
        errors: 0,
    };
    let rows = [];
    try {
        rows = await database_prod_1.default.query(`SELECT id FROM gor_worlds
       WHERE paused = false
         AND COALESCE((settings->>'automationPaused')::boolean, false) = false`);
    }
    catch {
        return result;
    }
    result.scanned = rows.length;
    for (const { id } of rows) {
        const client = await database_prod_1.default.getClient();
        try {
            await client.query('BEGIN');
            const outcome = await tryAdvanceScheduledWorld(client, id, now);
            await client.query('COMMIT');
            if (outcome === 'advanced')
                result.advanced++;
            else if (outcome === 'scheduled')
                result.scheduled++;
            else
                result.skipped++;
        }
        catch (e) {
            await client.query('ROLLBACK');
            result.errors++;
            console.error(`Game of Resources scheduler failed for world ${id}:`, e);
        }
        finally {
            client.release();
        }
    }
    return result;
}
let intervalHandle = null;
function startGameOfResourcesScheduler(options) {
    if (intervalHandle)
        return;
    const intervalMs = options?.intervalMs ?? 60000;
    const tick = () => {
        runGameOfResourcesSchedulerTick().catch((e) => console.error('GOR scheduler tick error:', e));
    };
    tick();
    intervalHandle = setInterval(tick, intervalMs);
}
function stopGameOfResourcesSchedulerForTests() {
    if (intervalHandle)
        clearInterval(intervalHandle);
    intervalHandle = null;
}
async function ensureWorldSchedule(client, row, now) {
    if (row.round_ends_at)
        return row;
    const ends = (0, scheduleTime_1.nextRoundEndsAt)(row.settings, now);
    return (0, worldRepository_1.updateWorldRoundSchedule)(client, row.id, now, ends);
}
//# sourceMappingURL=scheduler.js.map