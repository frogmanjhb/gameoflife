import { CONFIG } from './config';

export type PlanetCell = {
  id: number;
  n: [number, number, number];
  nb: number[];
  key: string | null;
  extra: boolean;
  type?: string;
  home?: boolean;
  islet?: boolean;
  land?: boolean;
  under?: string;
  tileType?: string;
  e?: number;
  m?: number;
  d?: number;
  comp?: number;
};

export type Planet = {
  UP: [number, number, number];
  E1: [number, number, number];
  G0: [number, number, number];
  verts: [number, number, number][];
  tris: number[][];
  cells: PlanetCell[];
  cellOfKey: Record<string, number>;
  hash3: (x: number, y: number, z: number, s: number) => number;
  HOME_MAX: number;
};

export const PLANET: Planet = (() => {
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => mul(a, 1 / Math.hypot(a[0], a[1], a[2]));
  const d2 = (a, b) => { const d = sub(a, b); return dot(d, d); };
  const UP = [0, 1, 0], FREQ = 12, GOLD = (1 + Math.sqrt(5)) / 2;
  let IV = [[-1, GOLD, 0], [1, GOLD, 0], [-1, -GOLD, 0], [1, -GOLD, 0], [0, -1, GOLD], [0, 1, GOLD], [0, -1, -GOLD], [0, 1, -GOLD], [GOLD, 0, -1], [GOLD, 0, 1], [-GOLD, 0, -1], [-GOLD, 0, 1]].map(norm);
  const IF = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  // turn the globe so the middle of face 0 points straight up: the island sits there, far from any pentagon
  const c0 = norm(add(add(IV[IF[0][0]], IV[IF[0][1]]), IV[IF[0][2]]));
  const ax = norm(cross(c0, UP)), ang = Math.acos(Math.min(1, dot(c0, UP)));
  const rot = (p) => { const c = Math.cos(ang), s = Math.sin(ang); return add(add(mul(p, c), mul(cross(ax, p), s)), mul(ax, dot(ax, p) * (1 - c))); };
  IV = IV.map(rot);
  const verts = [], keyMap = new Map(), tris = [];
  const vid = (p) => { const k = `${Math.round(p[0] * 1e4)},${Math.round(p[1] * 1e4)},${Math.round(p[2] * 1e4)}`; let id = keyMap.get(k); if (id === undefined) { id = verts.length; verts.push(p); keyMap.set(k, id); } return id; };
  IF.forEach(([a, b, c]) => {
    const A = IV[a], B = IV[b], C = IV[c], idx = [];
    for (let i = 0; i <= FREQ; i++) { idx[i] = []; for (let j = 0; j <= FREQ - i; j++) idx[i][j] = vid(norm(add(add(A, mul(sub(B, A), i / FREQ)), mul(sub(C, A), j / FREQ)))); }
    for (let i = 0; i < FREQ; i++) for (let j = 0; j < FREQ - i; j++) {
      tris.push([idx[i][j], idx[i + 1][j], idx[i][j + 1]]);
      if (j < FREQ - i - 1) tris.push([idx[i + 1][j], idx[i + 1][j + 1], idx[i][j + 1]]);
    }
  });
  const nbs = verts.map(() => new Set());
  tris.forEach((t) => { for (let k = 0; k < 3; k++) for (let m = 0; m < 3; m++) if (k !== m) nbs[t[k]].add(t[m]); });
  const cells = verts.map((n, id) => ({ id, n, nb: [...nbs[id]], key: null, extra: false }));

  // ---- the playable island: RULES tiles laid out as an odd-row offset hexagon grid ----
  const FA = IV[IF[0][0]], FB = IV[IF[0][1]], FC = IV[IF[0][2]];
  const E1 = mul(sub(FB, FA), 1 / FREQ), E2 = mul(sub(FC, FA), 1 / FREQ), G0 = mul(add(add(FA, FB), FC), 1 / 3);
  const tiles = [];
  CONFIG.map.forEach((row, r) => [...row].forEach((ch, c) => tiles.push({ key: `${r},${c}`, r, c, extra: false, type: CONFIG.tileCodes[ch].type })));
  CONFIG.bridgeTiles.forEach((t) => tiles.push({ key: `${t.r},${t.c}`, r: t.r, c: t.c, extra: true, type: t.type }));
  const cellOfKey = {};
  tiles.map((t) => { const q = t.c - (t.r - (t.r & 1)) / 2; return { t, p: norm(add(add(G0, mul(E1, q - 2)), mul(E2, t.r - 4))) }; })
    .sort((a, b) => b.p[1] - a.p[1]).forEach(({ t, p }) => {
      let best = null, bd = 9;
      for (const c of cells) { if (c.key) continue; const d = d2(c.n, p); if (d < bd) { bd = d; best = c; } }
      best.key = t.key; best.extra = t.extra; best.tileType = t.type; cellOfKey[t.key] = best.id;
    });

  // ---- terrain from seeded noise ----
  function hash3(x, y, z, s) { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177) ^ Math.imul(s, 2654435761); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  function vnoise(x, y, z, s) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), sm = (t) => t * t * (3 - 2 * t);
    const u = sm(x - xi), v = sm(y - yi), w = sm(z - zi), L = (a, b, t) => a + (b - a) * t, h = (i, j, k) => hash3(xi + i, yi + j, zi + k, s);
    return L(L(L(h(0, 0, 0), h(1, 0, 0), u), L(h(0, 1, 0), h(1, 1, 0), u), v), L(L(h(0, 0, 1), h(1, 0, 1), u), L(h(0, 1, 1), h(1, 1, 1), u), v), w) * 2 - 1;
  }
  const fbm = (p, s) => vnoise(p[0] * 1.6, p[1] * 1.6, p[2] * 1.6, s) * 0.6 + vnoise(p[0] * 3.2, p[1] * 3.2, p[2] * 3.2, s + 7) * 0.3 + vnoise(p[0] * 6.4, p[1] * 6.4, p[2] * 6.4, s + 13) * 0.15;
  const T = CONFIG.terrain;
  const islandIds = new Set(cells.filter((c) => c.key).map((c) => c.id));
  const dist = new Map(); islandIds.forEach((id) => dist.set(id, 0));
  let frontier = [...islandIds];
  for (let d = 1; d <= 10; d++) { const nx = []; frontier.forEach((id) => cells[id].nb.forEach((n) => { if (!dist.has(n)) { dist.set(n, d); nx.push(n); } })); frontier = nx; }
  // keep a channel of open sea from the Stone Bridge tiles out to the ocean: no wild land where those tiles are as close as the rest of the island
  const bdist = new Map(); let bf = cells.filter((c) => c.extra).map((c) => c.id); bf.forEach((id) => bdist.set(id, 0));
  for (let d = 1; d <= 12; d++) { const nx = []; bf.forEach((id) => cells[id].nb.forEach((n) => { if (!bdist.has(n) && !islandIds.has(n)) { bdist.set(n, d); nx.push(n); } })); bf = nx; }
  const nearBridge = new Set(); cells.forEach((c) => { if (!c.key && bdist.has(c.id) && bdist.get(c.id) <= (dist.get(c.id) ?? 99) + 1) nearBridge.add(c.id); });
  const LAND = -0.04, HOME_MAX = 5, MIN_LAND = 10;
  const far = cells.filter((c) => !c.key);
  far.forEach((c) => {
    c.e = fbm(c.n, 29); c.m = fbm(c.n, 37); c.d = dist.has(c.id) ? dist.get(c.id) : 99;
    c.nbc = c.nb.map((id) => cells[id]).filter((o) => !o.key);
    const reach = 1.5 + (fbm(c.n, 51) + 0.6) * 3.2;            // irregular coastline: about 1 to 5 cells of wild land
    if (nearBridge.has(c.id)) c.land = false;
    else if (c.d <= Math.min(HOME_MAX, reach)) { c.land = true; c.home = true; }
    else if (c.d <= HOME_MAX + 2) c.land = false;             // open sea around the home island
    else c.land = c.e > LAND;
  });
  for (let pass = 0; pass < 3; pass++) {                      // smooth coastlines (removes thin strands and specks)
    const next = new Map();
    far.forEach((c) => {
      if (c.home || nearBridge.has(c.id) || c.d <= HOME_MAX + 2) return;
      const ln = c.nbc.filter((o) => o.land).length, k = c.nbc.length;
      next.set(c.id, c.land ? ln >= Math.ceil(k / 2) - 1 : ln >= Math.ceil(k / 2) + 1);
    });
    far.forEach((c) => { if (next.has(c.id)) c.land = next.get(c.id); });
  }
  const seen = new Set(), comps = [];                         // landmasses of MIN_LAND cells or more, plus two islets
  far.forEach((c) => {
    if (!c.land || c.home || seen.has(c.id)) return;
    const comp = [], stack = [c]; seen.add(c.id);
    while (stack.length) { const x = stack.pop(); comp.push(x); x.nbc.forEach((o) => { if (o.land && !o.home && !seen.has(o.id)) { seen.add(o.id); stack.push(o); } }); }
    comp.forEach((x) => { x.comp = comp.length; });
    comps.push(comp);
  });
  let islets = 0;
  comps.filter((cp) => cp.length < MIN_LAND).sort((a, b) => a.length - b.length).forEach((cp) => {
    if (cp.length <= 2 && islets < 2) { islets++; cp.forEach((x) => { x.islet = true; }); }
    else cp.forEach((x) => { x.land = false; x.e = Math.min(x.e, LAND - 0.08); });
  });
  far.filter((c) => !c.land && c.d > HOME_MAX + 3 && c.n[1] > -0.7 && c.nbc.every((o) => !o.land && o.nbc.every((q) => !q.land)))
    .sort((a, b) => hash3(a.id, 4, 4, 8) - hash3(b.id, 4, 4, 8)).forEach((c) => {
      if (islets >= 2 || c.nbc.some((o) => o.islet || o.nbc.some((q) => q.islet))) return;
      c.land = true; c.islet = true; c.comp = 1; islets++;
    });
  const isWater = (o) => (o.key ? o.extra : !o.land);
  far.forEach((c) => {
    const y = c.n[1];
    if (!c.land) { c.type = y < -0.86 ? 'icewater' : (c.e < -0.25 && c.d > HOME_MAX + 2) ? 'deep' : 'shallow'; return; }
    const wn = c.nb.filter((id) => isWater(cells[id])).length;
    const sandy = wn >= 3 && fbm(c.n, 61) > -0.1;
    if (c.islet) c.type = 'beach';
    else if (c.home) c.type = sandy ? 'beach' : c.m > 0.02 ? 'forest' : 'meadow';
    else if (y < -0.82) c.type = 'ice';
    else if (c.e > 0.34) c.type = 'mountain';
    else if (sandy && c.comp >= 14 && c.e < 0.12) c.type = 'beach';
    else if (wn === 0 && c.comp >= 40 && c.m > 0.3 && c.e < 0.2) c.type = 'lake';
    else if (Math.abs(y) < 0.35 && c.m < -0.22) c.type = 'desert';
    else c.type = c.m > 0.05 ? 'forest' : 'grass';
  });
  far.forEach((c) => {                                        // every beach touches inland ground
    if (c.type !== 'beach' || c.islet) return;
    const inland = c.nb.some((id) => { const o = cells[id]; return o.key ? !o.extra : (o.land && o.type !== 'beach' && o.type !== 'lake'); });
    if (!inland) c.type = c.home ? 'meadow' : (c.m > 0.05 ? 'forest' : 'grass');
  });
  const outward = (from) => from.nb.map((id) => cells[id]).filter((o) => !o.key && o.home && o.type !== 'river' && o.type !== 'lake').sort((a, b) => b.d - a.d)[0];
  const src = outward(cells[cellOfKey['0,3']]); if (src) src.type = 'lake';   // the island river rises from a lake
  let cur = cells[cellOfKey['7,4']];
  for (let step = 0; step < 8; step++) {
    if (cur.nb.some((id) => !cells[id].key && !cells[id].land)) break;
    const next = outward(cur); if (!next) break;
    next.type = 'river'; cur = next;
  }
  far.filter((c) => !c.home && c.comp >= 40 && (c.type === 'mountain' || (c.e > 0.22 && c.land && !c.islet))).sort((a, b) => b.e - a.e).slice(0, 8).forEach((s0) => {
    let at = s0;
    for (let step = 0; step < 18; step++) {
      const next = at.nbc.filter((o) => o.e < at.e && !o.home).sort((a, b) => a.e - b.e)[0];
      if (!next || T[next.type].water) break;
      if (next.type !== 'mountain' && next.type !== 'ice') next.type = 'river';
      at = next;
    }
  });
  // oceans cannot be landlocked: any sea not joined to the main ocean becomes a lake
  const wseen = new Set(), wcomps = [];
  far.forEach((c) => {
    if (!T[c.type].sea || wseen.has(c.id)) return;
    const comp = [], stack = [c]; wseen.add(c.id);
    while (stack.length) { const x = stack.pop(); comp.push(x); x.nbc.forEach((o) => { if (T[o.type].sea && !wseen.has(o.id)) { wseen.add(o.id); stack.push(o); } }); }
    wcomps.push(comp);
  });
  wcomps.sort((a, b) => b.length - a.length).slice(1).forEach((cp) => cp.forEach((x) => { x.type = 'lake'; }));
  // the Stone Bridge tiles take the water beside them (river, lake or ocean) until the new land rises
  cells.filter((c) => c.extra).forEach((c) => {
    const count = { river: 0, lake: 0, shallow: 0 };
    c.nb.forEach((id) => {
      const o = cells[id];
      if (o.key) { if (!o.extra && o.tileType === 'river') count.river++; return; }
      if (o.type === 'river' || o.type === 'lake') count[o.type]++; else if (T[o.type].sea) count.shallow++;
    });
    c.under = ['river', 'lake', 'shallow'].reduce((best, k) => (count[k] > count[best] ? k : best), 'shallow');
    if (count.river && count.river >= count.shallow && count.river >= count.lake) c.under = 'river';
  });
  far.forEach((c) => { delete c.nbc; });
  return { UP, E1, G0, verts, tris, cells, cellOfKey, hash3, HOME_MAX };
})();
