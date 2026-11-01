import type { PoolClient } from 'pg';
import database from '../../database/database-prod';
import { RULES } from './shared';
import { persistAdvanceSummary } from './actions';
import { notifyWorldVersion } from './liveUpdates';
import {
  advisoryLockKey,
  isAutomationPaused,
  isWorldDueForAdvance,
  nextRoundEndsAt,
} from './scheduleTime';
import type { GorWorldRow } from './types';
import {
  loadLockedWorldById,
  saveWorldState,
  updateWorldRoundSchedule,
} from './worldRepository';

export type SchedulerTickResult = {
  scanned: number;
  advanced: number;
  scheduled: number;
  skipped: number;
  errors: number;
};

export async function tryAdvanceScheduledWorld(
  client: PoolClient,
  worldId: number,
  now: Date
): Promise<'advanced' | 'scheduled' | 'skipped' | 'busy'> {
  const lock = await client.query(`SELECT pg_try_advisory_xact_lock($1) AS ok`, [advisoryLockKey(worldId)]);
  if (!lock.rows[0]?.ok) return 'busy';

  const bundle = await loadLockedWorldById(client, worldId);
  if (!bundle) return 'skipped';

  if (isAutomationPaused(bundle.row)) return 'skipped';

  if (!bundle.row.round_ends_at) {
    const ends = nextRoundEndsAt(bundle.row.settings, now);
    await updateWorldRoundSchedule(client, bundle.row.id, now, ends);
    return 'scheduled';
  }

  if (!isWorldDueForAdvance(bundle.row, now)) return 'skipped';

  const expectedRound = bundle.row.round_number;
  if (bundle.row.settled_rounds.includes(expectedRound)) {
    return 'skipped';
  }

  const gameplay = RULES.advanceRound(bundle.state) as {
    ok: boolean;
    reason?: string;
    state: typeof bundle.state;
    summary?: Record<string, unknown>;
  };
  if (!gameplay.ok) return 'skipped';

  const startedAt = now;
  const endsAt = nextRoundEndsAt(bundle.row.settings, startedAt);

  const row = await saveWorldState(client, bundle, gameplay.state, {
    expectedVersion: bundle.row.version,
    expectedRoundNumber: expectedRound,
    roundStartedAt: startedAt,
    roundEndsAt: endsAt,
  });

  if (!row) return 'skipped';
  bundle.row = row;

  if (gameplay.summary) {
    await persistAdvanceSummary(client, bundle, gameplay.summary);
  }
  notifyWorldVersion(row.id, row.version);
  return 'advanced';
}

export async function runGameOfResourcesSchedulerTick(now = new Date()): Promise<SchedulerTickResult> {
  const result: SchedulerTickResult = {
    scanned: 0,
    advanced: 0,
    scheduled: 0,
    skipped: 0,
    errors: 0,
  };

  let rows: { id: number }[] = [];
  try {
    rows = await database.query(
      `SELECT id FROM gor_worlds
       WHERE paused = false
         AND COALESCE((settings->>'automationPaused')::boolean, false) = false`
    );
  } catch {
    return result;
  }

  result.scanned = rows.length;

  for (const { id } of rows) {
    const client = await database.getClient();
    try {
      await client.query('BEGIN');
      const outcome = await tryAdvanceScheduledWorld(client, id, now);
      await client.query('COMMIT');
      if (outcome === 'advanced') result.advanced++;
      else if (outcome === 'scheduled') result.scheduled++;
      else result.skipped++;
    } catch (e) {
      await client.query('ROLLBACK');
      result.errors++;
      console.error(`Game of Resources scheduler failed for world ${id}:`, e);
    } finally {
      client.release();
    }
  }

  return result;
}

let intervalHandle: ReturnType<typeof setInterval> | null = null;

export function startGameOfResourcesScheduler(options?: { intervalMs?: number }): void {
  if (intervalHandle) return;
  const intervalMs = options?.intervalMs ?? 60_000;
  const tick = () => {
    runGameOfResourcesSchedulerTick().catch((e) => console.error('GOR scheduler tick error:', e));
  };
  tick();
  intervalHandle = setInterval(tick, intervalMs);
}

export function stopGameOfResourcesSchedulerForTests(): void {
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = null;
}

export async function ensureWorldSchedule(
  client: PoolClient,
  row: GorWorldRow,
  now: Date
): Promise<GorWorldRow> {
  if (row.round_ends_at) return row;
  const ends = nextRoundEndsAt(row.settings, now);
  return updateWorldRoundSchedule(client, row.id, now, ends);
}
