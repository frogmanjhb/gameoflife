import { CONFIG, RULES } from './shared';
import type { GameState, InventoryItem } from './shared';
import { citizenIdForUser, userIdFromCitizenId } from './worldRepository';
import type { GorAvatar } from './avatar';
import { parseGorAvatar } from './avatar';
import type { GorWorldRow, GorWorldSettings } from './types';

export type PublicCitizenView = {
  id: string;
  userId: number;
  name: string;
  profession: string;
  professionName: string;
  hungry: boolean;
  level: number;
  actions: number;
  contrib: number;
  avatar: GorAvatar;
};

export type SelfCitizenView = PublicCitizenView & {
  coins: number;
  inv: Record<InventoryItem, number>;
  ap: number;
  apUsed: number;
  xp: number;
  jobChangedThisRound: boolean;
  jobChangeXpCost: number;
  jobChangeXpAfter: number | null;
  levelAfterJobChange: number | null;
};

export type GorListingView = {
  id: string;
  sellerId: string;
  sellerName: string;
  item: InventoryItem;
  qty: number;
  price: number;
};

export type GorLogView = {
  id: number;
  round: number;
  citizenId: string | null;
  name: string;
  professionName: string;
  kind: string;
  text: string;
};

export type GorWorldPlayerView = {
  version: number;
  worldId: number;
  seed: number;
  settings: GorWorldSettings;
  round: {
    n: number;
    open: boolean;
    settled: number[];
    startedAt: string | null;
    endsAt: string | null;
  };
  treasury: number;
  env: GameState['env'];
  projects: GameState['projects'];
  land: GameState['land'];
  works: GameState['works'];
  tileHealth: GameState['tileHealth'];
  listings: GorListingView[];
  log: GorLogView[];
  citizens: PublicCitizenView[];
  self: SelfCitizenView | null;
  summaries: GameState['summaries'];
  lastSummary: number | null;
};

export type BuildViewInput = {
  row: GorWorldRow;
  state: GameState;
  viewerUserId: number;
  displayNameForUser: (userId: number) => string;
  useNicknames: boolean;
  getAvatar?: (userId: number, profession: string) => GorAvatar;
};

function jobChangeSettings(settings: GorWorldSettings) {
  return {
    xpCost: settings.jobChange?.xpCost ?? CONFIG.jobChange.xpCost,
    perRound: settings.jobChange?.perRound ?? CONFIG.jobChange.perRound,
    xpSource: settings.jobChange?.xpSource ?? CONFIG.jobChange.xpSource,
  };
}

function citizenDisplayName(
  citizen: GameState['citizens'][0],
  userId: number,
  displayNameForUser: (userId: number) => string,
  useNicknames: boolean
): string {
  if (useNicknames && citizen.name && !citizen.name.startsWith('Citizen ')) {
    return citizen.name;
  }
  return displayNameForUser(userId);
}

export function buildPlayerView(input: BuildViewInput): GorWorldPlayerView {
  const { row, state, viewerUserId, displayNameForUser, useNicknames, getAvatar } = input;
  const jc = jobChangeSettings(row.settings);
  const selfId = citizenIdForUser(viewerUserId);

  const citizens: PublicCitizenView[] = [];
  let self: SelfCitizenView | null = null;

  for (const c of state.citizens) {
    const uid = userIdFromCitizenId(c.id);
    if (uid == null) continue;
    const name = citizenDisplayName(c, uid, displayNameForUser, useNicknames);
    const avatar = getAvatar
      ? getAvatar(uid, c.prof)
      : parseGorAvatar(undefined, c.prof as import('./shared').ProfessionId);
    const base: PublicCitizenView = {
      id: c.id,
      userId: uid,
      name,
      profession: c.prof,
      professionName: CONFIG.professions[c.prof].name,
      hungry: c.hungry,
      level: RULES.levelFor(c.xp),
      actions: c.actions,
      contrib: c.contrib,
      avatar,
    };
    if (c.id === selfId) {
      const xpAfter = c.xp - jc.xpCost;
      self = {
        ...base,
        coins: c.coins,
        inv: { ...c.inv },
        ap: c.ap,
        apUsed: c.apUsed,
        xp: c.xp,
        jobChangedThisRound: c.jobChangedRound === state.round.n,
        jobChangeXpCost: jc.xpCost,
        jobChangeXpAfter: c.xp >= jc.xpCost ? xpAfter : null,
        levelAfterJobChange: c.xp >= jc.xpCost ? RULES.levelFor(xpAfter) : null,
      };
    } else {
      citizens.push(base);
    }
  }

  citizens.sort((a, b) => a.name.localeCompare(b.name));

  const nameByCitizenId = new Map<string, string>();
  for (const c of state.citizens) {
    const uid = userIdFromCitizenId(c.id);
    if (uid == null) continue;
    nameByCitizenId.set(c.id, citizenDisplayName(c, uid, displayNameForUser, useNicknames));
  }

  const listings: GorListingView[] = state.listings.map((l) => ({
    id: l.id,
    sellerId: l.sellerId,
    sellerName: nameByCitizenId.get(l.sellerId) || 'Village',
    item: l.item,
    qty: l.qty,
    price: l.price,
  }));

  const log: GorLogView[] = state.log.slice(-200).map((entry) => {
    const cid = (entry.cid as string) || null;
    const profKey = cid ? state.citizens.find((x) => x.id === cid)?.prof : null;
    return {
      id: entry.t as number,
      round: entry.round as number,
      citizenId: cid,
      name: cid ? nameByCitizenId.get(cid) || (entry.name as string) || 'Village' : 'Village',
      professionName: profKey ? CONFIG.professions[profKey].name : (entry.prof as string) || '',
      kind: entry.kind as string,
      text: entry.text as string,
    };
  });

  return {
    version: row.version,
    worldId: row.id,
    seed: row.seed,
    settings: row.settings,
    round: {
      n: state.round.n,
      open: state.round.open,
      settled: [...state.round.settled],
      startedAt: row.round_started_at ? row.round_started_at.toISOString() : null,
      endsAt: row.round_ends_at ? row.round_ends_at.toISOString() : null,
    },
    treasury: state.treasury,
    env: { ...state.env },
    projects: RULES.clone(state.projects) as GameState['projects'],
    land: RULES.clone(state.land) as GameState['land'],
    works: RULES.clone(state.works) as GameState['works'],
    tileHealth: { ...state.tileHealth },
    listings,
    log,
    citizens,
    self,
    summaries: state.summaries,
    lastSummary: state.lastSummary,
  };
}

/** Strip private fields from full state for non-owner clients (API safety net). */
export function redactStateForUser(state: GameState, viewerUserId: number): GameState {
  const selfId = citizenIdForUser(viewerUserId);
  const n = RULES.clone(state) as GameState;
  n.citizens = n.citizens.map((c) => {
    if (c.id === selfId) return c;
    return {
      ...c,
      coins: 0,
      xp: 0,
      ap: 0,
      apUsed: 0,
      inv: { food: 0, wood: 0, stone: 0, tools: 0 },
      reflections: {},
    };
  });
  return n;
}
