import type { PoolClient } from 'pg';
import { CONFIG, RULES, mulberry } from './shared';
import type { GameState, InventoryItem, ProfessionId } from './shared';
import {
  citizenIdForUser,
  insertJobChangeAudit,
  saveRoundSummaryRow,
  persistReflectionRow,
} from './worldRepository';
import type { LockedWorldBundle } from './types';
import { jobChangeOptsFromSettings, stripHtml } from './access';
import type { GorWorldSettings } from './types';

export type GameplayResult = {
  ok: boolean;
  reason?: string;
  state?: GameState;
  event?: Record<string, unknown>;
  summary?: Record<string, unknown>;
};

const ACTION_IDS = new Set([
  'farm',
  'chop',
  'mine',
  'craft',
  'shift',
  'deliver',
  'plant',
  'clean',
  'donate',
  'develop',
  'fish',
  'rest',
  'restore',
  'giveWork',
]);

export function validateActionOpt(type: string, opt: Record<string, unknown>): string | null {
  if (!opt || typeof opt !== 'object') return null;
  if (type === 'donate' || type === 'giveWork') {
    const qty = Number(opt.qty);
    if (!Number.isFinite(qty) || qty < 1 || qty > 99) return 'Quantity must be between 1 and 99.';
  }
  if (type === 'develop' && typeof opt.to !== 'string') return 'Choose what to build.';
  if (type === 'shift' || type === 'donate') {
    if (typeof opt.project !== 'string' || !(opt.project in CONFIG.projects)) return 'Choose a valid project.';
  }
  if (opt.item != null && !RULES.ITEMS.includes(opt.item as InventoryItem)) return 'Choose a valid item.';
  return null;
}

export function runDoAction(
  bundle: LockedWorldBundle,
  userId: number,
  actionId: string,
  opt: Record<string, unknown> = {}
): GameplayResult {
  if (!ACTION_IDS.has(actionId)) {
    return { ok: false, reason: 'This action does not exist.' };
  }
  const err = validateActionOpt(actionId, opt);
  if (err) return { ok: false, reason: err };
  const cid = citizenIdForUser(userId);
  const r = RULES.doAction(bundle.state, cid, actionId, opt);
  return { ok: r.ok, reason: r.reason, state: r.state as GameState, event: r.event as Record<string, unknown> };
}

export function runMarketAction(
  bundle: LockedWorldBundle,
  userId: number,
  kind: 'storeBuy' | 'storeSell' | 'list' | 'cancel' | 'buy',
  payload: Record<string, unknown>
): GameplayResult {
  const cid = citizenIdForUser(userId);
  let r;
  switch (kind) {
    case 'storeBuy':
      r = RULES.storeBuy(bundle.state, cid, payload.item as InventoryItem, Number(payload.qty) || 1);
      break;
    case 'storeSell':
      r = RULES.storeSell(bundle.state, cid, payload.item as InventoryItem, Number(payload.qty) || 1);
      break;
    case 'list':
      r = RULES.createListing(
        bundle.state,
        cid,
        payload.item as InventoryItem,
        Number(payload.qty),
        Number(payload.price)
      );
      break;
    case 'cancel':
      r = RULES.cancelListing(bundle.state, cid, String(payload.listingId));
      break;
    case 'buy':
      r = RULES.buyListing(bundle.state, cid, String(payload.listingId), Number(payload.qty));
      break;
    default:
      return { ok: false, reason: 'Unknown market action.' };
  }
  return { ok: r.ok, reason: r.reason, state: r.state as GameState, event: r.event as Record<string, unknown> };
}

export function runStartWork(
  bundle: LockedWorldBundle,
  userId: number,
  kind: 'reclaim' | 'link',
  cellId: number
): GameplayResult {
  if (!CONFIG.works[kind]) return { ok: false, reason: 'Choose a valid land work.' };
  const cid = citizenIdForUser(userId);
  const r = RULES.startWork(bundle.state, cid, kind, cellId);
  return { ok: r.ok, reason: r.reason, state: r.state as GameState, event: r.event as Record<string, unknown> };
}

export async function runJobChange(
  client: PoolClient,
  bundle: LockedWorldBundle,
  userId: number,
  profession: ProfessionId,
  settings: GorWorldSettings
): Promise<GameplayResult> {
  const cid = citizenIdForUser(userId);
  const opts = jobChangeOptsFromSettings(settings);
  const r = RULES.changeJob(bundle.state, cid, profession, opts);
  if (!r.ok) return { ok: false, reason: r.reason };
  const event = r.event as { from?: string; to?: string; xpSpent?: number; xpSource?: string };
  const citizenRowId = bundle.userIdToCitizenRowId.get(userId);
  if (citizenRowId != null && event.from && event.to) {
    await insertJobChangeAudit(
      client,
      bundle.row.id,
      citizenRowId,
      event.from,
      event.to,
      event.xpSpent ?? opts.xpCost,
      event.xpSource ?? opts.xpSource,
      bundle.row.round_number
    );
  }
  return { ok: true, state: r.state as GameState, event: r.event as Record<string, unknown> };
}

export async function runSaveReflection(
  client: PoolClient,
  bundle: LockedWorldBundle,
  userId: number,
  round: number,
  text: string
): Promise<GameplayResult> {
  const cleaned = stripHtml(text).slice(0, CONFIG.reflectionMax);
  const cid = citizenIdForUser(userId);
  const r = RULES.saveReflection(bundle.state, cid, round, cleaned);
  if (!r.ok) return { ok: false, reason: r.reason };
  const citizenRowId = bundle.userIdToCitizenRowId.get(userId);
  if (citizenRowId != null) {
    await persistReflectionRow(client, citizenRowId, bundle.row.id, round, cleaned);
  }
  return { ok: true, state: r.state as GameState };
}

export function runTeacherSetProfession(
  bundle: LockedWorldBundle,
  targetUserId: number,
  profession: ProfessionId
): GameplayResult {
  const cid = citizenIdForUser(targetUserId);
  const r = RULES.teacherSetProfession(bundle.state, cid, profession);
  return { ok: r.ok, reason: r.reason, state: r.state as GameState, event: r.event as Record<string, unknown> };
}

export function runTeacherRound(
  bundle: LockedWorldBundle,
  op: 'open' | 'close' | 'advance'
): GameplayResult {
  let r: GameplayResult;
  if (op === 'open') r = RULES.openRound(bundle.state) as GameplayResult;
  else if (op === 'close') r = RULES.closeRound(bundle.state) as GameplayResult;
  else r = RULES.advanceRound(bundle.state) as GameplayResult;
  return {
    ok: r.ok,
    reason: r.reason,
    state: r.state as GameState,
    summary: r.summary as Record<string, unknown> | undefined,
  };
}

export async function persistAdvanceSummary(
  client: PoolClient,
  bundle: LockedWorldBundle,
  summary: Record<string, unknown> | undefined
): Promise<void> {
  if (!summary || summary.round == null) return;
  await saveRoundSummaryRow(client, bundle.row.id, Number(summary.round), summary);
}

export function runRuleChecks(): { name: string; pass: boolean; err?: string }[] {
  const checks: Array<[string, () => boolean]> = [
    ['default state is valid', () => RULES.isValidState(RULES.defaultState(mulberry(1)))],
    [
      'plan rejects closed round',
      () => {
        const s = RULES.defaultState(mulberry(2)) as GameState;
        s.round.open = false;
        s.citizens.push({
          id: 'c-test',
          name: 'Test',
          prof: 'farmer',
          coins: 0,
          inv: { food: 1, wood: 0, stone: 0, tools: 0 },
          ap: 3,
          xp: 0,
          hungry: false,
          apUsed: 0,
          actions: 0,
          contrib: 0,
          reflections: {},
        });
        return !RULES.plan(s, 'c-test', 'farm').ok;
      },
    ],
  ];
  return checks.map(([name, fn]) => {
    try {
      return { name, pass: !!fn() };
    } catch (e) {
      return { name, pass: false, err: e instanceof Error ? e.message : String(e) };
    }
  });
}
