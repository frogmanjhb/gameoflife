import { RULES } from '@game-of-resources';
import type { GameState } from '@game-of-resources';
import type { GorPlayerView, GorSelfCitizen, GorAvatar } from '../../types/gameOfResources';

export type GorCitizenVisual = GameState['citizens'][0] & { avatar?: GorAvatar };

function selfToCitizen(self: GorSelfCitizen): GorCitizenVisual {
  return {
    id: self.id,
    name: self.name,
    prof: self.profession as GameState['citizens'][0]['prof'],
    coins: self.coins,
    inv: { ...self.inv },
    ap: self.ap,
    xp: self.xp,
    hungry: self.hungry,
    apUsed: self.apUsed,
    actions: self.actions,
    contrib: self.contrib,
    reflections: {},
    avatar: self.avatar,
  };
}

/** Rebuild a GameState slice for RULES.plan and the 3D sync (server is authoritative). */
export function viewToGameState(view: GorPlayerView): GameState {
  const citizens: GorCitizenVisual[] = (view.citizens ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    prof: c.profession as GameState['citizens'][0]['prof'],
    coins: 0,
    inv: { food: 0, wood: 0, stone: 0, tools: 0 },
    ap: 0,
    xp: 0,
    hungry: c.hungry,
    apUsed: 0,
    actions: c.actions,
    contrib: c.contrib,
    reflections: {},
    avatar: c.avatar,
  }));
  if (view.self) {
    const idx = citizens.findIndex((c) => c.id === view.self!.id);
    const full = selfToCitizen(view.self);
    if (idx >= 0) citizens[idx] = full;
    else citizens.push(full);
  }

  const listings = (view.listings ?? []).map((l) => ({
    id: l.id,
    sellerId: l.sellerId,
    item: l.item,
    qty: l.qty,
    price: l.price,
  }));

  const log = (view.log ?? []).map((e) => ({
    t: e.id,
    round: e.round,
    cid: e.citizenId,
    name: e.name,
    prof: e.professionName,
    kind: e.kind,
    text: e.text,
  }));

  const base = RULES.defaultState(() => 0.5) as GameState;
  return {
    ...base,
    seq: base.seq,
    round: {
      n: view.round.n,
      open: view.round.open,
      settled: [...view.round.settled],
    },
    treasury: view.treasury,
    env: { ...view.env },
    projects: RULES.clone(view.projects) as GameState['projects'],
    land: RULES.clone(view.land) as GameState['land'],
    works: RULES.clone(view.works) as GameState['works'],
    harvest: base.harvest,
    tileHealth: { ...view.tileHealth },
    rested: base.rested,
    minedTotal: base.minedTotal,
    stats: base.stats,
    citizens: citizens as GameState['citizens'],
    activeId: view.self?.id ?? null,
    listings,
    log,
    summaries: view.summaries,
    lastSummary: view.lastSummary,
  };
}

export function formatCountdown(endsAt: string | null): string | null {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return 'Settling soon';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `Next round in ${h} h ${m} min`;
  return `Next round in ${m} min`;
}
