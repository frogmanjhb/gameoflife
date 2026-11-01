import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from '../../../../shared/game-of-resources/config';
import { PLANET } from '../../../../shared/game-of-resources/planet';
import { RULES } from '../../../../shared/game-of-resources/rules';
import { mulberry } from '../../../../shared/game-of-resources/rng';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

function fillWork(s: ReturnType<typeof RULES.defaultState>, kind: 'reclaim' | 'link') {
  const c0 = s.citizens[0];
  c0.inv.stone += 60;
  c0.inv.wood += 60;
  c0.inv.tools += 20;
  c0.inv.food += 60;
  let state = s;
  for (let i = 0; i < 300 && state.works[kind]; i++) {
    const W = state.works[kind] as { mat: Record<string, number> };
    const cfg = CONFIG.works[kind];
    const item = Object.keys(cfg.mat).find((it) => (W.mat[it] || 0) < cfg.mat[it]);
    const r = RULES.doAction(state, c0.id, 'giveWork', { work: kind, item, qty: 3 });
    state = r.ok ? (r.state as typeof s) : (RULES.advanceRound(state).state as typeof s);
  }
  return state;
}

const TESTS: Array<[string, () => boolean]> = [
  ['Action points can never go above 6', () => {
    let s = RULES.defaultState(mulberry(1));
    const f = s.citizens.find((c) => c.prof === 'farmer')!;
    for (let i = 0; i < 6; i++) {
      const r = RULES.doAction(s, f.id, 'farm');
      if (!r.ok) throw new Error('action ' + i + ' failed');
      s = r.state as typeof s;
    }
    if (RULES.doAction(s, f.id, 'farm').ok) throw new Error('7th action allowed');
    s = RULES.advanceRound(s).state as typeof s;
    s = RULES.advanceRound(s).state as typeof s;
    return s.citizens.every((c) => c.ap <= CONFIG.apPerRound);
  }],
  ['You cannot buy without enough coins or stock', () => {
    let s = RULES.defaultState(mulberry(2));
    const [a, b] = s.citizens;
    s.citizens[0].coins = 0;
    if (RULES.storeBuy(s, a.id, 'food', 1).ok) throw new Error('bought with no coins');
    s = RULES.createListing(s, b.id, 'wood', 1, 3).state as typeof s;
    const lid = s.listings[0].id;
    if (RULES.buyListing(s, s.citizens[2].id, lid, 2).ok) throw new Error('bought more than stock');
    return !RULES.buyListing(s, a.id, lid, 1).ok;
  }],
  ['Seller and treasury get the right amounts after tax', () => {
    let s = RULES.defaultState(mulberry(3));
    const seller = s.citizens[0];
    const buyer = s.citizens[1];
    s = RULES.createListing(s, seller.id, 'wood', 2, 10).state as typeof s;
    const t0 = s.treasury;
    const c0 = RULES.citizen(s, seller.id)!.coins;
    const b0 = RULES.citizen(s, buyer.id)!.coins;
    s = RULES.buyListing(s, buyer.id, s.listings[0].id, 2).state as typeof s;
    return (
      RULES.citizen(s, seller.id)!.coins === c0 + 19 &&
      s.treasury === t0 + 1 &&
      RULES.citizen(s, buyer.id)!.coins === b0 - 20 &&
      !RULES.buyListing(s, seller.id, 'none', 1).ok
    );
  }],
  ['Donated items cannot be traded', () => {
    let s = RULES.defaultState(mulberry(4));
    const c = s.citizens[0];
    s = RULES.doAction(s, c.id, 'donate', { project: 'market', item: 'wood', qty: 2 }).state as typeof s;
    return (
      RULES.citizen(s, c.id)!.inv.wood === 0 &&
      !RULES.createListing(s, c.id, 'wood', 1, 5).ok &&
      !RULES.storeSell(s, c.id, 'wood', 1).ok
    );
  }],
  ['Finished projects reject donations and shifts', () => {
    const s = RULES.defaultState(mulberry(5));
    s.projects.market.done = true;
    const b = s.citizens.find((c) => c.prof === 'builder')!;
    return (
      !RULES.doAction(s, s.citizens[0].id, 'donate', { project: 'market', item: 'wood', qty: 1 }).ok &&
      !RULES.doAction(s, b.id, 'shift', { project: 'market' }).ok
    );
  }],
  ['Projects need both materials and builder shifts', () => {
    let s = RULES.defaultState(mulberry(6));
    const b = s.citizens.find((c) => c.prof === 'builder')!;
    s.projects.market.mat = { ...CONFIG.projects.market.mat };
    s.citizens[0].inv.wood = 5;
    if (RULES.doAction(s, s.citizens[0].id, 'donate', { project: 'market', item: 'wood', qty: 1 }).ok) {
      throw new Error('over-donation allowed');
    }
    for (let i = 0; i < CONFIG.projects.market.labour - 1; i++) {
      s = RULES.doAction(s, b.id, 'shift', { project: 'market' }).state as typeof s;
    }
    if (s.projects.market.done) throw new Error('finished without full labour');
    const t0 = s.treasury;
    s = RULES.doAction(s, b.id, 'shift', { project: 'market' }).state as typeof s;
    return s.projects.market.done && s.treasury === t0 - CONFIG.actions.shift.wage + CONFIG.completionBonus;
  }],
  ['The Water Treatment Plant applies its effects', () => {
    const s = RULES.defaultState(mulberry(7));
    s.env.water = 40;
    s.env.pollution = 50;
    s.projects.wtp.done = true;
    const n = RULES.advanceRound(s).state as typeof s;
    const S = CONFIG.settlement;
    const P = CONFIG.projects.wtp;
    return n.env.water === 40 + S.water + P.water && n.env.pollution === 50 + S.pollution + P.pollution;
  }],
  ['Low water reduces farm output correctly', () => {
    const s = RULES.defaultState(mulberry(8));
    const out: number[] = [];
    for (const w of [90, 60, 30, 10]) {
      s.env.water = w;
      out.push(RULES.farmYield(s));
    }
    return out.join(',') === '3,2,1,1';
  }],
  ['Ending a round applies action points and land changes exactly once', () => {
    let s = RULES.defaultState(mulberry(9));
    const f = s.citizens.find((c) => c.prof === 'farmer')!;
    s = RULES.doAction(s, f.id, 'farm').state as typeof s;
    const env0 = { ...s.env };
    const r = RULES.advanceRound(s);
    const n = r.state as typeof s;
    const S = CONFIG.settlement;
    const ok =
      n.env.forest === Math.min(100, env0.forest + S.forest) &&
      n.env.soil === env0.soil + S.soil &&
      n.env.water === env0.water + S.water &&
      n.env.pollution === env0.pollution + S.pollution;
    const again = { ...RULES.clone(n), round: { ...n.round, n: (r.summary as { round: number }).round } };
    return (
      ok &&
      n.citizens.every((c) => c.ap === CONFIG.apPerRound && c.apUsed === 0) &&
      !RULES.settleRound(again).ok &&
      n.round.settled.length === 1
    );
  }],
  ['No value ever goes below zero', () => {
    const rng = mulberry(10);
    let s = RULES.defaultState(rng);
    const acts = ['farm', 'chop', 'mine', 'craft', 'shift', 'deliver', 'plant', 'clean', 'donate', 'fish', 'rest'];
    const pk = Object.keys(CONFIG.projects);
    for (let i = 0; i < 600; i++) {
      const c = s.citizens[Math.floor(rng() * s.citizens.length)];
      const x = rng();
      let r;
      if (x < 0.6) {
        r = RULES.doAction(s, c.id, acts[Math.floor(rng() * acts.length)], {
          project: pk[Math.floor(rng() * 4)],
          item: RULES.ITEMS[Math.floor(rng() * 4)],
          qty: 1 + Math.floor(rng() * 3),
        });
      } else if (x < 0.7) r = RULES.storeBuy(s, c.id, RULES.ITEMS[Math.floor(rng() * 4)], 1);
      else if (x < 0.78) r = RULES.storeSell(s, c.id, RULES.ITEMS[Math.floor(rng() * 4)], 1);
      else if (x < 0.86) r = RULES.createListing(s, c.id, RULES.ITEMS[Math.floor(rng() * 4)], 1, 1 + Math.floor(rng() * 9));
      else if (x < 0.94 && s.listings.length) r = RULES.buyListing(s, c.id, s.listings[0].id, 1);
      else r = RULES.advanceRound(s);
      if (r.ok) s = r.state as typeof s;
    }
    const nums = [
      s.treasury,
      ...Object.values(s.env),
      ...s.citizens.flatMap((c) => [c.coins, c.ap, c.xp, ...Object.values(c.inv)]),
      ...Object.values(s.projects).flatMap((p) => [p.labour, ...Object.values(p.mat)]),
      ...s.listings.map((l) => l.qty),
      ...Object.values(s.tileHealth),
    ];
    return nums.every((v) => Number.isInteger(v) && v >= 0) && Object.values(s.env).every((v) => v <= 100);
  }],
  ['Land reclamation must touch village land and creates land that can be developed', () => {
    let s = RULES.defaultState(mulberry(11));
    const vl = RULES.villageLand(s);
    const farSea = PLANET.cells.find(
      (c) => RULES.cellType(s, c.id) === 'shallow' && !c.key && !c.nb.some((n) => vl.has(n))
    );
    if (RULES.startWork(s, s.citizens[0].id, 'reclaim', farSea!.id).ok) throw new Error('reclaimed ocean far from the village');
    const spot = PLANET.cells.find((c) => RULES.workCheck(s, 'reclaim', c.id) === '');
    s = RULES.startWork(s, s.citizens[0].id, 'reclaim', spot!.id).state as typeof s;
    s = fillWork(s, 'reclaim');
    if (RULES.cellType(s, spot!.id) !== 'newland' || s.works.reclaim || !RULES.villageLand(s).has(spot!.id)) {
      throw new Error('no new land');
    }
    s.citizens[0].inv.wood += 2;
    const r = RULES.doAction(s, s.citizens[0].id, 'develop', { cell: RULES.cellKey(spot!.id), to: 'farm' });
    return r.ok && RULES.cellType(r.state as typeof s, spot!.id) === 'farm' && RULES.devCounts(r.state as typeof s).farm === 1;
  }],
  ['Natural Habitat stays between 0 and 100', () => {
    const id = PLANET.cellOfKey[RULES.TILES.find((t) => t.type === 'land')!.key];
    let s = RULES.defaultState(mulberry(15));
    s.env.habitat = 2;
    s.citizens[0].inv.wood += 2;
    const a = RULES.doAction(s, s.citizens[0].id, 'develop', { cell: RULES.cellKey(id), to: 'farm' });
    s = RULES.defaultState(mulberry(15));
    s.env.habitat = 99;
    const b = RULES.doAction(s, s.citizens[0].id, 'develop', { cell: RULES.cellKey(id), to: 'forest' });
    return a.ok && (a.state as typeof s).env.habitat === 0 && b.ok && (b.state as typeof s).env.habitat === 100;
  }],
  ['Each development changes Natural Habitat by the right amount', () => {
    const id = PLANET.cellOfKey[RULES.TILES.find((t) => t.type === 'land')!.key];
    return Object.keys(CONFIG.dev.to).every((to) => {
      const s = RULES.defaultState(mulberry(16));
      const c = s.citizens[0];
      c.inv.wood += 5;
      c.inv.stone += 5;
      c.inv.tools += 5;
      const r = RULES.doAction(s, c.id, 'develop', { cell: RULES.cellKey(id), to });
      return r.ok && (r.state as typeof s).env.habitat === s.env.habitat + CONFIG.habitat.dev[to as keyof typeof CONFIG.habitat.dev];
    });
  }],
  ['A worn farm tile gives less food', () => {
    let s = RULES.defaultState(mulberry(17));
    const f = s.citizens.find((c) => c.prof === 'farmer')!;
    const key = RULES.TILES.find((t) => t.type === 'farm')!.key;
    const got: number[] = [];
    for (let i = 0; i < 6; i++) {
      const r = RULES.doAction(s, f.id, 'farm', { tileKey: key });
      if (!r.ok) throw new Error(r.reason);
      got.push((r.event as { gains: { food: number } }).gains.food);
      s = r.state as typeof s;
    }
    return got.join(',') === '3,3,3,2,1,1' && RULES.health(s, key) === 0;
  }],
  ['Resting a field costs 2 AP, gives no food and helps the soil', () => {
    let s = RULES.defaultState(mulberry(19));
    const f = s.citizens.find((c) => c.prof === 'farmer')!;
    const key = RULES.TILES.find((t) => t.type === 'farm')!.key;
    s.tileHealth[key] = 30;
    s.env.soil = 50;
    const food0 = f.inv.food;
    const r = RULES.doAction(s, f.id, 'rest', { tileKey: key });
    if (!r.ok) throw new Error(r.reason);
    const f2 = RULES.citizen(r.state as typeof s, f.id)!;
    const n = RULES.advanceRound(r.state as typeof s).state as typeof s;
    return (
      f2.ap === CONFIG.apPerRound - 2 &&
      f2.inv.food === food0 &&
      (r.state as typeof s).env.soil === 53 &&
      RULES.health(r.state as typeof s, key) === 50 &&
      RULES.health(n, key) === 50 + CONFIG.places.recover + CONFIG.places.restBonus
    );
  }],
  ['Restoring land costs 3 AP plus materials and raises Natural Habitat', () => {
    const id = PLANET.cellOfKey[RULES.TILES.find((t) => t.type === 'land')!.key];
    const key = RULES.cellKey(id);
    let s = RULES.defaultState(mulberry(20));
    const c = s.citizens[0];
    c.inv.wood += 6;
    c.inv.tools += 2;
    s = RULES.doAction(s, c.id, 'develop', { cell: key, to: 'farm' }).state as typeof s;
    const h0 = s.env.habitat;
    const c0 = RULES.citizen(s, c.id)!;
    const r = RULES.doAction(s, c.id, 'restore', { cell: key });
    if (!r.ok) throw new Error(r.reason);
    const c1 = RULES.citizen(r.state as typeof s, c.id)!;
    return (
      RULES.cellType(r.state as typeof s, id) === 'openland' &&
      (r.state as typeof s).env.habitat === h0 + CONFIG.actions.restore.habitat &&
      c1.ap === c0.ap - 3 &&
      c1.inv.tools === c0.inv.tools - 1 &&
      c1.inv.wood === c0.inv.wood - 2
    );
  }],
  ['A critical Natural Habitat removes exactly one AP', () => {
    const s = RULES.defaultState(mulberry(18));
    s.env.habitat = 20;
    s.citizens[0].inv.food = 0;
    const n = RULES.advanceRound(s).state as typeof s;
    return n.citizens.every((c) => c.ap === CONFIG.apPerRound - 1);
  }],
  ['Open land on the island can be developed', () => {
    let s = RULES.defaultState(mulberry(14));
    const key = RULES.TILES.find((t) => t.type === 'land')!.key;
    const id = PLANET.cellOfKey[key];
    if (RULES.cellType(s, id) !== 'openland') throw new Error('not open land');
    s.citizens[0].inv.wood += 2;
    s.citizens[0].inv.stone += 2;
    const r = RULES.doAction(s, s.citizens[0].id, 'develop', { cell: RULES.cellKey(id), to: 'houses' });
    return r.ok && RULES.cellType(r.state as typeof s, id) === 'houses' && RULES.devBonus(r.state as typeof s).coins === CONFIG.dev.housesCoins;
  }],
  ['Oceans cannot be cut off from the open sea', () => {
    const s = RULES.defaultState(mulberry(12));
    const ok = (t: string) => t === 'shallow' || RULES.isLand(t);
    const x = PLANET.cells.find(
      (c) =>
        RULES.workCheck(s, 'reclaim', c.id) === '' &&
        c.nb.every((n) => !PLANET.cells[n].key && ok(RULES.cellType(s, n))) &&
        c.nb.filter((n) => RULES.cellType(s, n) === 'shallow').length >= 2
    );
    if (!x) throw new Error('no test spot found');
    const seaNb = x.nb.filter((n) => RULES.cellType(s, n) === 'shallow');
    const y = seaNb.pop()!;
    seaNb.forEach((n) => {
      s.land[n] = { type: 'newland' };
    });
    return RULES.workCheck(s, 'reclaim', y) !== '' && !RULES.seaStaysOpen(s, y) && RULES.workCheck(s, 'reclaim', x.id) === '';
  }],
  ['An island bridge joins another island to the village', () => {
    let s = RULES.defaultState(mulberry(13));
    const vl = RULES.villageLand(s);
    const shallow = (id: number) => RULES.cellType(s, id) === 'shallow' && !PLANET.cells[id].key;
    const prev = new Map<number, number>();
    const queue: number[] = [];
    PLANET.cells.forEach((c) => {
      if (shallow(c.id) && c.nb.some((n) => vl.has(n) && RULES.isLand(RULES.cellType(s, n)))) {
        prev.set(c.id, -1);
        queue.push(c.id);
      }
    });
    let goal = -1;
    while (queue.length && goal < 0) {
      const id = queue.shift()!;
      if (PLANET.cells[id].nb.some((n) => !vl.has(n) && RULES.isLand(RULES.cellType(s, n)))) {
        goal = id;
        break;
      }
      PLANET.cells[id].nb.forEach((n) => {
        if (!prev.has(n) && shallow(n)) {
          prev.set(n, id);
          queue.push(n);
        }
      });
    }
    if (goal < 0) throw new Error('no island in reach');
    for (let at = prev.get(goal)!; at >= 0; at = prev.get(at)!) s.land[at] = { type: 'newland' };
    const why = RULES.workCheck(s, 'link', goal);
    if (why) throw new Error(why);
    const vl2 = RULES.villageLand(s);
    const other = PLANET.cells[goal].nb.find((n) => !vl2.has(n) && RULES.isLand(RULES.cellType(s, n)))!;
    s = RULES.startWork(s, s.citizens[0].id, 'link', goal).state as typeof s;
    s = fillWork(s, 'link');
    return RULES.cellType(s, goal) === 'bridge' && RULES.villageLand(s).has(other);
  }],
];

describe('Game of Resources — prototype rule checks', () => {
  for (const [name, fn] of TESTS) {
    it(name, () => {
      expect(fn()).toBe(true);
    });
  }
});

describe('Game of Resources — job change and auto-assign', () => {
  it('autoAssignProfession picks the profession with the fewest active citizens', () => {
    const s = RULES.defaultState(mulberry(21));
    s.citizens = s.citizens.slice(0, 2);
    s.citizens[0].prof = 'farmer';
    s.citizens[1].prof = 'farmer';
    s.round.n = 5;
    s.citizens[0].lastActiveRound = 5;
    s.citizens[1].lastActiveRound = 5;
    expect(RULES.autoAssignProfession(s, () => 0)).toBe('logger');
  });

  it('changeJob costs 30 XP and blocks invalid changes', () => {
    let s = RULES.defaultState(mulberry(22));
    const c = s.citizens[0];
    c.xp = 29;
    expect(RULES.changeJob(s, c.id, 'logger').ok).toBe(false);
    c.xp = 30;
    expect(RULES.changeJob(s, c.id, c.prof).ok).toBe(false);
    const r = RULES.changeJob(s, c.id, 'logger');
    expect(r.ok).toBe(true);
    const c1 = RULES.citizen(r.state as typeof s, c.id)!;
    expect(c1.xp).toBe(0);
    expect(c1.prof).toBe('logger');
    expect(RULES.changeJob(r.state as typeof s, c.id, 'miner').ok).toBe(false);
  });

  it('inactive citizens do not eat or go hungry at settlement', () => {
    let s = RULES.defaultState(mulberry(23));
    const c = s.citizens[0];
    c.inv.food = 0;
    c.lastActiveRound = 1;
    s.round.n = 4;
    const n = RULES.advanceRound(s).state as typeof s;
    const c2 = RULES.citizen(n, c.id)!;
    expect(c2.hungry).toBe(false);
    expect(c2.inv.food).toBe(0);
  });

  it('civiclab XP source for job change is stubbed', () => {
    const rulesSrc = readFileSync(path.join(repoRoot, 'shared/game-of-resources/rules.ts'), 'utf8');
    expect(rulesSrc).toContain("JC.xpSource === 'civiclab'");
    expect(rulesSrc).toContain('CivicLab XP is not enabled yet');
  });
});
