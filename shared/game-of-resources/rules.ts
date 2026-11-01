import { CONFIG } from './config';
import { PLANET } from './planet';

export type RuleResult = { ok: boolean; reason?: string; state: unknown; event?: Record<string, unknown>; summary?: Record<string, unknown> };

export const RULES = (() => {
const ITEMS = ['food', 'wood', 'stone', 'tools'];
  const ENV_KEYS = ['forest', 'soil', 'water', 'pollution', 'habitat'];
  const ENV_NAMES = { forest: 'Forest', soil: 'Soil', water: 'Water', pollution: 'Pollution', habitat: 'Natural Habitat' };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const clamp100 = (v) => Math.max(0, Math.min(100, Math.round(v)));
  const whole = (v) => Math.max(0, Math.floor(v));
  const ADJ = ['Swift', 'Quiet', 'Brave', 'Clever', 'Bright', 'Calm', 'Kind', 'Steady', 'Bold', 'Gentle', 'Keen', 'Lively', 'Wise', 'Sunny', 'Nimble', 'Patient', 'Cheerful', 'Honest'];
  const NOUN = ['Heron', 'Baobab', 'Kudu', 'Protea', 'Eland', 'Hornbill', 'Marula', 'Springbok', 'Weaver', 'Leopard', 'Fynbos', 'Gecko', 'Ibis', 'Oryx', 'Nyala', 'Aloe', 'Hoopoe', 'Sunbird', 'Meerkat', 'Tortoise'];

  const TILES = [];
  CONFIG.map.forEach((row, r) => [...row].forEach((ch, c) => {
    const d = CONFIG.tileCodes[ch];
    TILES.push({ key: `${r},${c}`, r, c, type: d.type, project: d.project || null, extra: false });
  }));
  CONFIG.bridgeTiles.forEach((t) => TILES.push({ key: `${t.r},${t.c}`, r: t.r, c: t.c, type: t.type, project: null, extra: true }));
  const TILE = Object.fromEntries(TILES.map((t) => [t.key, t]));

  const activeTiles = (s) => TILES.filter((t) => !t.extra || s.projects.bridge.done);
  const tilesOfType = (s, type) => activeTiles(s).filter((t) => t.type === type);
  const citizen = (s, id) => s.citizens.find((c) => c.id === id) || null;
  const levelFor = (xp) => 1 + Math.floor(xp / CONFIG.xpPerLevel);

  function waterBand(w) {
    return CONFIG.waterBands.find((b) => w >= b.min) || CONFIG.waterBands[CONFIG.waterBands.length - 1];
  }
  function devCounts(s) {
    const out = { farm: 0, forest: 0, quarry: 0, houses: 0 };
    Object.values(s.land || {}).forEach((o) => { if (o.dev && out[o.type] != null) out[o.type]++; });
    return out;
  }
  function devBonus(s) {
    const D = CONFIG.dev, n = devCounts(s);
    return { food: Math.min(D.farmMax, Math.floor(n.farm / D.farmPer)), forest: Math.min(D.forestMax, Math.floor(n.forest / D.forestPer)),
      stone: Math.min(D.quarryMax, Math.floor(n.quarry / D.quarryPer)), pollution: Math.min(D.quarryPollutionMax, n.quarry * D.quarryPollution),
      coins: n.houses * D.housesCoins, counts: n };
  }
  function farmYield(s) {
    const base = CONFIG.actions.farm.food + (s.projects.bridge.done ? CONFIG.projects.bridge.farmBonus : 0) + devBonus(s).food;
    return Math.max(CONFIG.minFood, Math.floor(base * waterBand(s.env.water).mult) - habPen(s, 'food'));
  }
  function habLevel(s) { return gaugeStatus('habitat', s.env.habitat == null ? 100 : s.env.habitat); }
  function habPen(s, kind) { const L = habLevel(s), H = CONFIG.habitat; return L === 'bad' ? (H.critical[kind] || 0) : L === 'warn' ? (H.pressure[kind] || 0) : 0; }
  const health = (s, key) => (s.tileHealth && s.tileHealth[key] != null ? s.tileHealth[key] : 100);
  function tileYield(base, h) { const P = CONFIG.places; return h >= P.full ? base : h >= P.low ? Math.max(1, base - 1) : Math.max(1, Math.floor(base / 2)); }
  function treesOn(s, key) {
    const cid = cellIdOf(key);
    if (cid != null) {
      const o = s.land && s.land[cid]; if (!o || o.type !== 'forest' || !o.dev) return 0;
      return Math.max(0, Math.min(CONFIG.treesPerTile, Math.round((s.env.forest / 100) * CONFIG.treesPerTile) - (s.harvest[key] || 0)));
    }
    const t = TILE[key];
    if (!t || t.type !== 'forest' || (t.extra && !s.projects.bridge.done)) return 0;
    const base = Math.round((s.env.forest / 100) * CONFIG.treesPerTile);
    return Math.max(0, Math.min(CONFIG.treesPerTile, base - (s.harvest[key] || 0)));
  }
  function storeBuyPrice(s, item) {
    const d = s.projects.market.done ? CONFIG.projects.market.storeDiscount : 0;
    return Math.max(1, CONFIG.store.buy[item] - d);
  }
  function storeSellPrice(s, item) {
    return Math.min(CONFIG.store.sell[item], storeBuyPrice(s, item));
  }
  function gaugeStatus(key, v) {
    const g = CONFIG.gaugeBands;
    if (key === 'pollution') return v <= g.pollutionGoodTo ? 'good' : v <= g.pollutionWarnTo ? 'warn' : 'bad';
    return v >= g.goodFrom ? 'good' : v >= g.warnFrom ? 'warn' : 'bad';
  }
  function projectProgress(s, k) {
    const cfg = CONFIG.projects[k]; const p = s.projects[k];
    let need = 0, have = 0;
    for (const it in cfg.mat) { need += cfg.mat[it]; have += Math.min(p.mat[it] || 0, cfg.mat[it]); }
    const mat = need ? Math.floor((have / need) * 100) : 100;
    const labour = cfg.labour ? Math.floor((Math.min(p.labour, cfg.labour) / cfg.labour) * 100) : 100;
    const combined = Math.floor((mat + labour) / 2);
    const stage = p.done ? 3 : combined >= 60 ? 2 : combined >= 25 ? 1 : 0;
    return { mat, labour, combined, stage };
  }
  function emptyProjects() {
    const out = {};
    for (const k in CONFIG.projects) out[k] = { mat: { wood: 0, stone: 0, tools: 0 }, labour: 0, done: false };
    return out;
  }
  function freshStats(s) {
    return {
      startEnv: { ...s.env }, startTreasury: s.treasury,
      produced: { food: 0, wood: 0, stone: 0, tools: 0 }, traded: 0,
      projStart: Object.fromEntries(Object.keys(s.projects).map((k) => [k, projectProgress(s, k).combined]))
    };
  }
  function makeName(s, rng) {
    const used = new Set(s.citizens.map((c) => c.name));
    for (let i = 0; i < 600; i++) {
      const n = ADJ[Math.floor(rng() * ADJ.length)] + ' ' + NOUN[Math.floor(rng() * NOUN.length)];
      if (!used.has(n)) return n;
    }
    for (const a of ADJ) for (const b of NOUN) { const n = a + ' ' + b; if (!used.has(n)) return n; }
    return 'Citizen ' + (s.citizens.length + 1);
  }
  function addLog(s, c, kind, text) {
    s.log.push({ id: s.seq++, round: s.round.n, cid: c ? c.id : null, name: c ? c.name : 'Village',
      prof: c ? CONFIG.professions[c.prof].name : '', kind, text, t: s.seq });
    if (s.log.length > CONFIG.logCap) s.log.splice(0, s.log.length - CONFIG.logCap);
  }
  function addCitizenMut(s, prof, rng) {
    const st = CONFIG.start;
    const c = { id: 'c' + (s.seq++), name: makeName(s, rng), prof,
      coins: st.coins, inv: { food: st.food, wood: st.wood, stone: st.stone, tools: st.tools },
      ap: CONFIG.apPerRound, xp: st.xp, hungry: false, apUsed: 0, actions: 0, contrib: 0, reflections: {},
      lastActiveRound: s.round.n, jobChangedRound: undefined };
    s.citizens.push(c);
    return c;
  }

  function isCitizenActive(c, roundN) {
    const base = c.lastActiveRound ?? roundN;
    return roundN - base < CONFIG.inactiveRounds;
  }

  function autoAssignProfession(s, rng = Math.random) {
    const counts = {};
    for (const p of Object.keys(CONFIG.professions)) counts[p] = 0;
    for (const c of s.citizens) {
      if (isCitizenActive(c, s.round.n)) counts[c.prof]++;
    }
    let min = Infinity;
    const cand = [];
    for (const p of Object.keys(counts)) {
      if (counts[p] < min) { min = counts[p]; cand.length = 0; cand.push(p); }
      else if (counts[p] === min) cand.push(p);
    }
    return cand[Math.floor(rng() * cand.length)];
  }

  function changeJob(s, cid, profession, opts) {
    const JC = { ...CONFIG.jobChange, ...(opts ?? {}) };
    if (JC.xpSource === 'civiclab') {
      return { ok: false, reason: 'Job change using CivicLab XP is not enabled yet.', state: s };
    }
    if (!CONFIG.professions[profession]) return { ok: false, reason: 'Choose a profession.', state: s };
    if (!s.round.open) return { ok: false, reason: 'The round is closed. Wait for your teacher to open the next round.', state: s };
    const c0 = citizen(s, cid);
    if (!c0) return { ok: false, reason: 'Choose a citizen first.', state: s };
    if (c0.prof === profession) return { ok: false, reason: 'You already have this job.', state: s };
    if (c0.xp < JC.xpCost) return { ok: false, reason: `You need at least ${JC.xpCost} XP to change job. You have ${c0.xp} XP.`, state: s };
    if (c0.jobChangedRound === s.round.n) return { ok: false, reason: 'You can only change job once each round.', state: s };
    const n = clone(s);
    const c = citizen(n, cid);
    const from = c.prof;
    c.xp = whole(c.xp - JC.xpCost);
    c.prof = profession;
    c.jobChangedRound = n.round.n;
    addLog(n, c, 'job', `${c.name} changed job from ${CONFIG.professions[from].name} to ${CONFIG.professions[profession].name} for ${JC.xpCost} XP.`);
    return { ok: true, state: n, event: { citizenId: cid, from, to: profession, xpSpent: JC.xpCost, xpSource: JC.xpSource } };
  }

  function teacherSetProfession(s, cid, profession) {
    if (!CONFIG.professions[profession]) return { ok: false, reason: 'Choose a profession.', state: s };
    const c0 = citizen(s, cid);
    if (!c0) return { ok: false, reason: 'Citizen not found.', state: s };
    if (c0.prof === profession) return { ok: false, reason: 'This citizen already has that job.', state: s };
    const n = clone(s);
    const c = citizen(n, cid);
    const from = c.prof;
    c.prof = profession;
    addLog(n, c, 'job', `${c.name}'s job was set to ${CONFIG.professions[profession].name} by the teacher (was ${CONFIG.professions[from].name}).`);
    return { ok: true, state: n, event: { citizenId: cid, from, to: profession, teacher: true } };
  }

  function defaultState(rng = Math.random) {
    const s = { schema: CONFIG.schema, seq: 1, round: { n: 1, open: true, settled: [] },
      treasury: CONFIG.start.treasury, env: { ...CONFIG.env }, harvest: {}, minedTotal: 0,
      citizens: [], activeId: null, listings: [], projects: emptyProjects(), log: [],
      stats: null, summaries: {}, lastSummary: null, land: {}, works: { reclaim: null, link: null }, tileHealth: {}, rested: {} };
    Object.keys(CONFIG.professions).forEach((p) => addCitizenMut(s, p, rng));
    s.activeId = s.citizens[0].id;
    s.stats = freshStats(s);
    return s;
  }
  // ---- the planet beyond the island ----
  const cellKey = (id) => 'cell:' + id;
  const cellIdOf = (key) => (typeof key === 'string' && key.startsWith('cell:') ? Number(key.slice(5)) : null);
  function cellType(s, id) {
    const c = PLANET.cells[id]; if (!c) return null;
    const o = s.land && s.land[id];
    if (c.key) {
      if (c.extra && !s.projects.bridge.done) return c.under || 'shallow';
      if (o) return o.type;
      return TILE[c.key].type === 'land' ? 'openland' : 'island';
    }
    return o ? o.type : c.type;
  }
  const HOME_WILD = PLANET.cells.filter((c) => c.home && ['beach', 'meadow', 'forest', 'grass'].includes(c.type)).map((c) => c.id);
  const isLand = (type) => type === 'island' || (!!CONFIG.terrain[type] && !CONFIG.terrain[type].water);
  const isSea = (type) => !!CONFIG.terrain[type] && !!CONFIG.terrain[type].sea;
  function villageLand(s) {                                   // every cell joined to the playable island by land or a bridge
    const seen = new Set(), stack = [];
    PLANET.cells.forEach((c) => { if (c.key && isLand(cellType(s, c.id))) { seen.add(c.id); stack.push(c.id); } });
    while (stack.length) {
      const id = stack.pop();
      for (const n of PLANET.cells[id].nb) { if (seen.has(n)) continue; const t = cellType(s, n); if (isLand(t) || t === 'bridge') { seen.add(n); stack.push(n); } }
    }
    return seen;
  }
  function seaStaysOpen(s, without) {                        // the ocean must stay one joined body of water
    const sea = (id) => { if (id === without) return false; const t = cellType(s, id); return t === 'bridge' ? isSea((s.land[id] && s.land[id].under) || 'shallow') : isSea(t); };
    let start = -1, total = 0;
    PLANET.cells.forEach((c) => { if (sea(c.id)) { total++; if (start < 0) start = c.id; } });
    if (start < 0) return true;
    const seen = new Set([start]), stack = [start];
    while (stack.length) { const x = stack.pop(); for (const n of PLANET.cells[x].nb) if (!seen.has(n) && sea(n)) { seen.add(n); stack.push(n); } }
    return seen.size === total;
  }
  function workCheck(s, kind, id) {
    const c = PLANET.cells[id]; if (!c) return 'Choose a tile first.';
    if (c.key) return c.extra ? 'This water is kept for the Stone Bridge.' : 'Choose water next to your land.';
    const t = cellType(s, id), vl = villageLand(s);
    const touches = c.nb.some((n) => vl.has(n) && isLand(cellType(s, n)));
    if (kind === 'reclaim') {
      if (t === 'deep') return 'This ocean is too deep to fill. Choose shallow ocean.';
      if (t !== 'shallow') return 'Only shallow ocean can be turned into land.';
      if (!touches) return 'New land must touch land your village already uses.';
      if (s.works.reclaim) return 'Finish the land reclamation that has already started.';
      if (!seaStaysOpen(s, id)) return 'This would cut off part of the ocean. Every ocean must stay joined to the open sea.';
      return '';
    }
    if (!(CONFIG.terrain[t] || {}).water || t === 'bridge') return 'Island bridges are built over water: ocean, a river or a lake.';
    if (!touches) return 'A bridge must start from land your village already uses.';
    if (!c.nb.some((n) => !vl.has(n) && isLand(cellType(s, n)))) return 'There is no new land to reach on the far side of this water.';
    if (s.works.link) return 'Finish the island bridge that has already started.';
    return '';
  }
  function startWork(s, cid, kind, id) {
    if (!CONFIG.works[kind]) return { ok: false, reason: 'Choose a project.', state: s };
    if (!s.round.open) return { ok: false, reason: 'The round is closed. Wait for your teacher to open the next round.', state: s };
    const c0 = citizen(s, cid); if (!c0) return { ok: false, reason: 'Choose a citizen first.', state: s };
    const why = workCheck(s, kind, id); if (why) return { ok: false, reason: why, state: s };
    const n = clone(s); n.works[kind] = { cell: id, mat: { wood: 0, stone: 0, tools: 0 } };
    addLog(n, citizen(n, cid), 'work', `${c0.name} started a ${CONFIG.works[kind].name.toLowerCase()} project.`);
    return { ok: true, state: n, event: { citizenId: cid, tileKey: cellKey(id) } };
  }
  function workProgress(s, kind) {
    const W = s.works && s.works[kind]; if (!W) return 0;
    const cfg = CONFIG.works[kind]; let need = 0, have = 0;
    for (const it in cfg.mat) { need += cfg.mat[it]; have += Math.min(W.mat[it] || 0, cfg.mat[it]); }
    return need ? Math.floor((have / need) * 100) : 100;
  }
  function upgradeState(s) {
    if (!s.land) s.land = {};
    if (!s.tileHealth) s.tileHealth = {};
    if (!s.rested) s.rested = {};
    if (s.env.habitat == null) s.env.habitat = CONFIG.env.habitat;
    if (s.stats && s.stats.startEnv && s.stats.startEnv.habitat == null) s.stats.startEnv.habitat = s.env.habitat;
    if (!s.works) s.works = { reclaim: null, link: null };
    return s;
  }
  function isValidState(s) {
    return s && s.schema === CONFIG.schema && Array.isArray(s.citizens) && s.citizens.length > 0 &&
      s.env && s.projects && s.round && s.stats && Object.keys(CONFIG.projects).every((k) => s.projects[k]);
  }

  // ---- choose tiles ----
  function pickTile(s, type, preferred) {
    if (preferred && TILE[preferred] && TILE[preferred].type === type && activeTiles(s).includes(TILE[preferred])) return TILE[preferred];
    return tilesOfType(s, type)[0] || null;
  }
  function workplaces(s, type) {                              // original tiles plus developed land of this type
    const out = activeTiles(s).filter((t) => t.type === type).map((t) => t.key);
    Object.entries(s.land || {}).forEach(([id, o]) => { if (o.dev && o.type === type) out.push(cellKey(Number(id))); });
    return out;
  }
  function pickPlace(s, type, preferred) {                   // the chosen place, or the healthiest one
    const list = workplaces(s, type); if (!list.length) return null;
    if (preferred && list.includes(preferred)) return preferred;
    return list.reduce((best, k) => (health(s, k) > health(s, best) ? k : best), list[0]);
  }
  function pickForest(s, preferred) {
    const list = workplaces(s, 'forest');
    if (preferred && list.includes(preferred) && treesOn(s, preferred) > 0) return preferred;
    let best = null, n = 0;
    for (const k of list) { const t = treesOn(s, k); if (t > n) { n = t; best = k; } }
    return best;
  }
  function fishSpot(s, vl) {
    return PLANET.cells.find((c) => fishable(s, c.id, vl));
  }
  function fishable(s, id, vl) {
    const c = PLANET.cells[id]; if (!c || c.key) return false;
    const t = cellType(s, id); if (!isSea(t) || t === 'bridge') return false;
    return c.nb.some((n) => vl.has(n) && isLand(cellType(s, n)));
  }

  // ---- plan: what an action would do, and whether it is allowed ----
  function plan(s, cid, id, opt = {}) {
    const A = CONFIG.actions[id];
    const c = citizen(s, cid);
    const out = { ok: false, reason: '', id, ap: A ? A.ap : 1, gains: {}, costs: {}, env: {}, coins: 0, treasury: 0,
      tiles: [], tileKey: null, project: opt.project || null, item: opt.item || null, qty: 0, note: '' };
    if (!A) { out.reason = 'This action does not exist.'; return out; }
    if (!c) { out.reason = 'Choose a citizen first.'; return out; }
    let why = '';
    if (A.prof && c.prof !== A.prof) why = `Only a ${CONFIG.professions[A.prof].name.toLowerCase()} can do this.`;
    if ((id === 'plant' || id === 'clean') && !CONFIG.communityActions) why = 'This action is switched off.';
    switch (id) {
      case 'farm': {
        const key = pickPlace(s, 'farm', opt.tileKey);
        out.tileKey = key; out.health = health(s, key);
        out.tiles = (key ? [key] : []).concat(tilesOfType(s, 'river').map((x) => x.key));
        out.gains.food = tileYield(farmYield(s), out.health); out.env = { soil: A.soil, water: A.water };
        break;
      }
      case 'chop': {
        out.gains.wood = A.wood; out.env = { forest: A.forest };
        const t = pickForest(s, opt.tileKey);
        out.tileKey = t; out.tiles = t ? [t] : workplaces(s, 'forest');
        if (!why && s.env.forest < A.minForest) why = `The forest is too weak to log. Forest health must be ${A.minForest} or more.`;
        else if (!why && !t) why = 'There are no trees left to chop.';
        break;
      }
      case 'mine': {
        const key = pickPlace(s, 'quarry', opt.tileKey);
        out.tileKey = key; out.health = health(s, key);
        out.tiles = (key ? [key] : []).concat(tilesOfType(s, 'river').map((x) => x.key));
        out.gains.stone = tileYield(A.stone + devBonus(s).stone, out.health); out.env = { pollution: A.pollution, water: A.water };
        break;
      }
      case 'rest': {
        const list = workplaces(s, 'farm');
        const key = opt.tileKey && list.includes(opt.tileKey) ? opt.tileKey : list.reduce((w, k) => (health(s, k) < health(s, w) ? k : w), list[0]);
        out.tileKey = key || null; out.tiles = key ? [key] : []; out.health = key ? health(s, key) : 100;
        out.env = { soil: A.soil };
        if (!why && !key) why = 'There is no farm to rest.';
        else if (!why && out.health >= 100 && s.env.soil >= 100) why = 'This field and the soil are already at full health.';
        break;
      }
      case 'craft': {
        out.costs = { ...A.cost }; out.gains.tools = A.tools;
        out.tileKey = '3,3'; out.tiles = TILES.filter((t) => t.type === 'town').map((t) => t.key);
        if (!why) for (const it in A.cost) if (c.inv[it] < A.cost[it]) { why = `Not enough ${it}: you need ${A.cost[it]}.`; break; }
        break;
      }
      case 'shift': {
        const k = opt.project; const cfg = CONFIG.projects[k];
        if (!cfg) { why = why || 'Choose a project first.'; break; }
        const site = TILES.find((t) => t.project === k);
        out.tileKey = site.key; out.tiles = [site.key];
        const p = s.projects[k];
        out.coins = s.treasury >= A.wage ? A.wage : 0; out.treasury = -out.coins;
        if (!out.coins) out.note = 'The treasury is too low to pay the wage. You still add the shift.';
        if (!why && p.done) why = 'This project is finished. It does not need more shifts.';
        else if (!why && p.labour >= cfg.labour) why = 'This project has all the builder shifts it needs. It still needs materials.';
        break;
      }
      case 'deliver': {
        out.coins = A.pay; out.treasury = -A.pay;
        out.tileKey = TILES.find((t) => t.project === 'market').key; out.tiles = [out.tileKey];
        if (!why && s.treasury < A.pay) why = 'The treasury cannot pay for a delivery right now.';
        break;
      }
      case 'plant': {
        out.env = { forest: A.forest };
        out.tiles = tilesOfType(s, 'forest').map((t) => t.key);
        const t = pickTile(s, 'forest', opt.tileKey); out.tileKey = t && t.key;
        if (!why && s.env.forest >= 100) why = 'The forest is already at full health.';
        break;
      }
      case 'clean': {
        out.env = { water: A.water, pollution: A.pollution };
        out.tiles = tilesOfType(s, 'river').map((t) => t.key);
        const t = pickTile(s, 'river', opt.tileKey); out.tileKey = t && t.key;
        if (!why && s.env.water >= 100 && s.env.pollution <= 0) why = 'The river is already clean.';
        break;
      }
      case 'donate': {
        const k = opt.project; const cfg = CONFIG.projects[k]; const item = opt.item;
        const qty = Math.floor(Number(opt.qty) || 0);
        if (!cfg) { why = why || 'Choose a project first.'; break; }
        const site = TILES.find((t) => t.project === k);
        out.tileKey = site.key; out.tiles = [site.key];
        const p = s.projects[k];
        const need = cfg.mat[item] != null ? cfg.mat[item] - (p.mat[item] || 0) : 0;
        out.qty = Math.max(0, Math.min(qty, need));
        if (out.qty) out.costs = { [item]: out.qty };
        if (!why && p.done) why = 'This project is finished. It does not need more donations.';
        else if (!why && !ITEMS.includes(item)) why = 'Choose what to donate.';
        else if (!why && need <= 0) why = `This project does not need any more ${item}.`;
        else if (!why && (qty < 1 || qty > A.maxUnits)) why = `You can donate 1 to ${A.maxUnits} at a time.`;
        else if (!why && c.inv[item] < out.qty) why = `Not enough ${item}: you have ${c.inv[item]}.`;
        break;
      }
    }
    if (id === 'develop') {
      const cell = cellIdOf(opt.cell), D = CONFIG.dev.to[opt.to];
      out.tileKey = opt.cell || null; out.tiles = opt.cell ? [opt.cell] : [];
      if (!D) why = why || 'Choose what to build.';
      else {
        out.costs = { ...D.cost };
        const t = cell == null ? null : cellType(s, cell);
        if (!why && (cell == null || !PLANET.cells[cell])) why = 'Choose a tile first.';
        else if (!why && !CONFIG.dev.from.includes(t)) why = `${(CONFIG.terrain[t] || { name: 'This tile' }).name} cannot be developed. Choose beach, grass, meadow, open land or new land.`;
        else if (!why && !villageLand(s).has(cell)) why = 'This land is not joined to your village yet.';
        if (!why) for (const it in D.cost) if (c.inv[it] < D.cost[it]) { why = `Not enough ${it}: you need ${D.cost[it]}.`; break; }
      }
    }
    if (id === 'develop' && CONFIG.dev.to[opt.to]) out.env = { habitat: CONFIG.habitat.dev[opt.to] || 0 };
    if (id === 'restore') {
      const cell = cellIdOf(opt.cell); const o = cell != null && s.land ? s.land[cell] : null;
      out.tileKey = opt.cell || null; out.tiles = opt.cell ? [opt.cell] : [];
      out.costs = { ...A.cost }; out.env = { habitat: A.habitat };
      if (!why && (!o || !o.dev || o.type === 'forest')) why = 'Only developed farms, quarries and houses can be restored to wild land.';
      else if (!why) for (const it in A.cost) if (c.inv[it] < A.cost[it]) { why = `Not enough ${it}: you need ${A.cost[it]}.`; break; }
    }
    if (id === 'fish') {
      const vl = villageLand(s); let cid = cellIdOf(opt.cell);
      if (opt.cell && !fishable(s, cid, vl)) { why = why || 'Fish in ocean that touches your land.'; cid = null; }
      else if (!opt.cell) { const spot = fishSpot(s, vl); cid = spot ? spot.id : null; }
      out.tileKey = cid != null ? cellKey(cid) : null; out.tiles = out.tileKey ? [out.tileKey] : [];
      out.gains.food = Math.max(0, A.food - habPen(s, 'fish')); out.env = { habitat: A.habitat };
      if (!why && cid == null) why = 'There is no ocean next to your land.';
      else if (!why && out.gains.food <= 0) why = 'There are almost no fish left. Natural Habitat is critical.';
    }
    if (id === 'giveWork') {
      const cfgW = CONFIG.works[opt.work], W = s.works && s.works[opt.work], item = opt.item, qty = Math.floor(Number(opt.qty) || 0);
      out.work = opt.work;
      if (!cfgW) why = why || 'Choose a project first.';
      else if (!W) why = why || 'This project has not started yet.';
      else {
        out.tileKey = cellKey(W.cell); out.tiles = [out.tileKey];
        const need = cfgW.mat[item] != null ? cfgW.mat[item] - (W.mat[item] || 0) : 0;
        out.qty = Math.max(0, Math.min(qty, need)); if (out.qty) out.costs = { [item]: out.qty };
        out.item = item;
        if (!why && !ITEMS.includes(item)) why = 'Choose what to donate.';
        else if (!why && need <= 0) why = `This project does not need any more ${item}.`;
        else if (!why && (qty < 1 || qty > CONFIG.actions.giveWork.maxUnits)) why = `You can donate 1 to ${CONFIG.actions.giveWork.maxUnits} at a time.`;
        else if (!why && c.inv[item] < out.qty) why = `Not enough ${item}: you have ${c.inv[item]}.`;
      }
    }
    if (!s.round.open) out.reason = 'The round is closed. Wait for your teacher to open the next round.';
    else if (c.ap < out.ap) out.reason = `You have used all your action points this round.`;
    else out.reason = why;
    out.ok = !out.reason;
    return out;
  }

  function completeIfReady(n, k, ev) {
    const p = n.projects[k];
    if (p.done) return;
    const pr = projectProgress(n, k);
    if (pr.mat >= 100 && pr.labour >= 100) {
      p.done = true;
      n.treasury += CONFIG.completionBonus;
      addLog(n, null, 'project', `The ${CONFIG.projects[k].name} is finished! The treasury gets ${CONFIG.completionBonus} coins.`);
      ev.completed = k;
    }
  }

  function doAction(s, cid, id, opt = {}) {
    const p = plan(s, cid, id, opt);
    if (!p.ok) return { ok: false, reason: p.reason, state: s };
    const n = clone(s); const c = citizen(n, cid); const A = CONFIG.actions[id];
    const ev = { ...p, citizenId: cid, levelUp: false, completed: null };
    const lvlBefore = levelFor(c.xp);
    c.ap -= p.ap; c.apUsed += p.ap; c.actions += 1;
    c.xp += CONFIG.xpPerAction + (n.projects.school.done ? CONFIG.projects.school.xpBonus : 0);
    for (const it in p.costs) c.inv[it] = whole(c.inv[it] - p.costs[it]);
    for (const it in p.gains) { c.inv[it] += p.gains[it]; n.stats.produced[it] += p.gains[it]; }
    for (const k in p.env) n.env[k] = clamp100(n.env[k] + p.env[k]);
    c.coins += p.coins; n.treasury = whole(n.treasury + p.treasury);
    let text = '';
    const envTxt = Object.entries(p.env).map(([k, v]) => `${ENV_NAMES[k]} ${v > 0 ? '+' : ''}${v}`).join(', ');
    switch (id) {
      case 'farm': n.tileHealth[p.tileKey] = Math.max(0, health(n, p.tileKey) - CONFIG.places.farmWear); text = `grew ${p.gains.food} food. ${envTxt}.`; break;
      case 'fish': text = `caught ${p.gains.food} fish. ${envTxt}.`; break;
      case 'rest':
        n.tileHealth[p.tileKey] = Math.min(100, health(n, p.tileKey) + A.condition); n.rested[p.tileKey] = true;
        if (n.tileHealth[p.tileKey] >= 100) delete n.tileHealth[p.tileKey];
        text = `rested and composted a field instead of harvesting. ${envTxt}.`; break;
      case 'restore': {
        const cell = cellIdOf(opt.cell), base = PLANET.cells[cell], was = CONFIG.dev.to[n.land[cell].type].name.toLowerCase();
        if (base.key || isLand(base.type)) delete n.land[cell]; else n.land[cell] = { type: 'meadow' };
        delete n.tileHealth[opt.cell]; delete n.harvest[opt.cell];
        text = `restored a ${was} to wild land. ${envTxt}.`; break;
      }
      case 'chop':
        n.harvest[p.tileKey] = (n.harvest[p.tileKey] || 0) + A.treesFelled;
        text = `chopped ${p.gains.wood} wood. ${envTxt}.`; break;
      case 'mine': n.minedTotal += p.gains.stone; n.tileHealth[p.tileKey] = Math.max(0, health(n, p.tileKey) - CONFIG.places.quarryWear); text = `mined ${p.gains.stone} stone. ${envTxt}.`; break;
      case 'craft': text = `made ${p.gains.tools} tool from 2 wood and 1 stone.`; break;
      case 'shift':
        n.projects[p.project].labour += 1; c.contrib += 1;
        text = `worked a building shift on the ${CONFIG.projects[p.project].name}.` + (p.coins ? ` Wage: ${p.coins} coins.` : ' The treasury could not pay the wage.');
        completeIfReady(n, p.project, ev); break;
      case 'deliver': text = `made a delivery for the village and earned ${p.coins} coins.`; break;
      case 'plant': text = `planted trees. ${envTxt}.`; break;
      case 'clean': text = `cleaned the river. ${envTxt}.`; break;
      case 'develop': {
        const cell = cellIdOf(opt.cell), before = (CONFIG.terrain[cellType(n, cell)] || {}).name || 'land';
        n.land[cell] = { type: opt.to, dev: true };
        text = `turned ${before.toLowerCase()} into a ${CONFIG.dev.to[opt.to].name.toLowerCase()}.`; break;
      }
      case 'giveWork': {
        const W = n.works[p.work], cfgW = CONFIG.works[p.work];
        W.mat[p.item] = (W.mat[p.item] || 0) + p.qty; c.contrib += p.qty;
        text = `donated ${p.qty} ${p.item} to the ${cfgW.name.toLowerCase()}.`;
        if (Object.keys(cfgW.mat).every((it) => (W.mat[it] || 0) >= cfgW.mat[it])) {
          if (p.work === 'reclaim') { n.land[W.cell] = { type: 'newland' }; n.env.water = clamp100(n.env.water + cfgW.water); n.env.habitat = clamp100(n.env.habitat + CONFIG.habitat.reclaim); addLog(n, null, 'work', `New land rises from the sea. Water ${cfgW.water}, Natural Habitat ${CONFIG.habitat.reclaim}.`); }
          else { n.land[W.cell] = { type: 'bridge', under: cellType(n, W.cell) }; n.env.habitat = clamp100(n.env.habitat + CONFIG.habitat.link); addLog(n, null, 'work', 'The island bridge is finished. The land across the water is now part of the village.'); }
          ev.workDone = p.work; ev.workCell = W.cell; n.works[p.work] = null;
        }
        break;
      }
      case 'donate':
        n.projects[p.project].mat[p.item] += p.qty; c.contrib += p.qty;
        text = `donated ${p.qty} ${p.item} to the ${CONFIG.projects[p.project].name}.`;
        completeIfReady(n, p.project, ev); break;
    }
    addLog(n, c, id, `${c.name} (${CONFIG.professions[c.prof].name}) ${text}`);
    c.lastActiveRound = n.round.n;
    if (levelFor(c.xp) > lvlBefore) { ev.levelUp = levelFor(c.xp); addLog(n, c, 'level', `${c.name} reached level ${ev.levelUp}.`); }
    return { ok: true, state: n, event: ev };
  }

  // ---- market ----
  function marketGuard(s, cid) {
    if (!s.round.open) return 'The round is closed. Wait for your teacher to open the next round.';
    if (!citizen(s, cid)) return 'Choose a citizen first.';
    return '';
  }
  function storeBuy(s, cid, item, qty = 1) {
    const g = marketGuard(s, cid); if (g) return { ok: false, reason: g, state: s };
    qty = Math.floor(qty); if (!ITEMS.includes(item) || qty < 1) return { ok: false, reason: 'Choose what to buy.', state: s };
    const cost = storeBuyPrice(s, item) * qty;
    if (citizen(s, cid).coins < cost) return { ok: false, reason: `Not enough coins: you need ${cost}.`, state: s };
    const n = clone(s); const c = citizen(n, cid);
    c.coins -= cost; n.treasury += cost; c.inv[item] += qty; n.stats.traded += cost;
    addLog(n, c, 'store', `${c.name} bought ${qty} ${item} from the Village Store for ${cost} coins.`);
    return { ok: true, state: n, event: { citizenId: cid, gains: { [item]: qty }, coins: -cost } };
  }
  function storeSell(s, cid, item, qty = 1) {
    const g = marketGuard(s, cid); if (g) return { ok: false, reason: g, state: s };
    qty = Math.floor(qty); if (!ITEMS.includes(item) || qty < 1) return { ok: false, reason: 'Choose what to sell.', state: s };
    const c0 = citizen(s, cid);
    if (c0.inv[item] < qty) return { ok: false, reason: `Not enough ${item}: you have ${c0.inv[item]}.`, state: s };
    const pay = storeSellPrice(s, item) * qty;
    if (s.treasury < pay) return { ok: false, reason: 'The Village Store cannot pay right now. The treasury is too low.', state: s };
    const n = clone(s); const c = citizen(n, cid);
    c.inv[item] -= qty; c.coins += pay; n.treasury -= pay; n.stats.traded += pay;
    addLog(n, c, 'store', `${c.name} sold ${qty} ${item} to the Village Store for ${pay} coins.`);
    return { ok: true, state: n, event: { citizenId: cid, coins: pay } };
  }
  function createListing(s, cid, item, qty, price) {
    const g = marketGuard(s, cid); if (g) return { ok: false, reason: g, state: s };
    qty = Math.floor(Number(qty)); price = Math.floor(Number(price));
    if (!ITEMS.includes(item)) return { ok: false, reason: 'Choose what to sell.', state: s };
    if (!(qty >= 1)) return { ok: false, reason: 'Sell at least 1.', state: s };
    if (!(price >= 1) || price > CONFIG.maxListingPrice) return { ok: false, reason: `Set a price from 1 to ${CONFIG.maxListingPrice} coins.`, state: s };
    const c0 = citizen(s, cid);
    if (c0.inv[item] < qty) return { ok: false, reason: `Not enough ${item}: you have ${c0.inv[item]}.`, state: s };
    const n = clone(s); const c = citizen(n, cid);
    c.inv[item] -= qty;
    const l = { id: 'l' + (n.seq++), sellerId: cid, item, qty, price };
    n.listings.push(l);
    addLog(n, c, 'list', `${c.name} listed ${qty} ${item} for ${price} coins each.`);
    return { ok: true, state: n, event: { citizenId: cid, listingId: l.id } };
  }
  function cancelListing(s, cid, lid) {
    if (!citizen(s, cid)) return { ok: false, reason: 'Choose a citizen first.', state: s };
    const l0 = s.listings.find((l) => l.id === lid);
    if (!l0) return { ok: false, reason: 'This listing is no longer for sale.', state: s };
    if (l0.sellerId !== cid) return { ok: false, reason: 'Only the seller can cancel this listing.', state: s };
    const n = clone(s); const c = citizen(n, cid); const l = n.listings.find((x) => x.id === lid);
    c.inv[l.item] += l.qty; n.listings = n.listings.filter((x) => x.id !== lid);
    addLog(n, c, 'cancel', `${c.name} cancelled a listing and got back ${l.qty} ${l.item}.`);
    return { ok: true, state: n, event: { citizenId: cid } };
  }
  function saleSplit(total) {
    const tax = Math.floor(total * CONFIG.taxRate);
    return { total, tax, seller: total - tax };
  }
  function buyListing(s, cid, lid, qty) {
    const g = marketGuard(s, cid); if (g) return { ok: false, reason: g, state: s };
    const l0 = s.listings.find((l) => l.id === lid);
    if (!l0) return { ok: false, reason: 'This listing is no longer for sale.', state: s };
    if (l0.sellerId === cid) return { ok: false, reason: 'You cannot buy your own listing.', state: s };
    qty = Math.floor(Number(qty));
    if (!(qty >= 1)) return { ok: false, reason: 'Buy at least 1.', state: s };
    if (qty > l0.qty) return { ok: false, reason: `Not enough stock: only ${l0.qty} left.`, state: s };
    const sp = saleSplit(qty * l0.price);
    if (citizen(s, cid).coins < sp.total) return { ok: false, reason: `Not enough coins: you need ${sp.total}.`, state: s };
    const n = clone(s); const buyer = citizen(n, cid); const l = n.listings.find((x) => x.id === lid);
    const seller = citizen(n, l.sellerId);
    buyer.coins -= sp.total; buyer.inv[l.item] += qty;
    if (seller) seller.coins += sp.seller; else n.treasury += sp.seller;
    n.treasury += sp.tax; l.qty -= qty; n.stats.traded += sp.total;
    if (l.qty <= 0) n.listings = n.listings.filter((x) => x.id !== lid);
    addLog(n, buyer, 'trade', `${buyer.name} bought ${qty} ${l.item} from ${seller ? seller.name : 'a seller'} for ${sp.total} coins. Tax to treasury: ${sp.tax}.`);
    return { ok: true, state: n, event: { citizenId: cid, gains: { [l.item]: qty }, coins: -sp.total } };
  }

  // ---- citizens and reflection ----
  function addCitizen(s, prof, rng = Math.random) {
    if (!CONFIG.professions[prof]) return { ok: false, reason: 'Choose a profession.', state: s };
    if (s.citizens.length >= CONFIG.maxCitizens) return { ok: false, reason: `The village is full. The limit is ${CONFIG.maxCitizens} citizens.`, state: s };
    const n = clone(s); const c = addCitizenMut(n, prof, rng); n.activeId = c.id;
    addLog(n, c, 'join', `${c.name} joined the village as a ${CONFIG.professions[prof].name.toLowerCase()}.`);
    return { ok: true, state: n };
  }
  function setActive(s, cid) {
    if (!citizen(s, cid)) return { ok: false, reason: 'That citizen does not exist.', state: s };
    const n = clone(s); n.activeId = cid; return { ok: true, state: n };
  }
  function saveReflection(s, cid, round, text) {
    const t = String(text || '').trim().slice(0, CONFIG.reflectionMax);
    if (!t) return { ok: false, reason: 'Write something before you save.', state: s };
    if (!citizen(s, cid)) return { ok: false, reason: 'Choose a citizen first.', state: s };
    const n = clone(s); citizen(n, cid).reflections[round] = t;
    return { ok: true, state: n };
  }

  // ---- rounds ----
  function openRound(s) { const n = clone(s); n.round.open = true; addLog(n, null, 'round', `Round ${n.round.n} is open.`); return { ok: true, state: n }; }
  function closeRound(s) { const n = clone(s); n.round.open = false; addLog(n, null, 'round', `Round ${n.round.n} is closed.`); return { ok: true, state: n }; }

  function settleRound(s) {
    if (s.round.settled.includes(s.round.n)) return { ok: false, reason: 'This round has already been settled.', state: s };
    const n = clone(s); const S = CONFIG.settlement;
    const before = { ...n.stats.startEnv }; const treasuryBefore = n.stats.startTreasury;
    const hungry = []; const hab = habLevel(n), H = CONFIG.habitat;
    for (const c of n.citizens) {
      if (!isCitizenActive(c, n.round.n)) {
        c.hungry = false;
        c.ap = CONFIG.apPerRound;
        c.apUsed = 0;
        continue;
      }
      if (c.inv.food >= S.foodPerCitizen) { c.inv.food -= S.foodPerCitizen; c.hungry = false; }
      else { c.hungry = true; hungry.push(c.name); }
      const loss = Math.max(c.hungry ? S.hungryApPenalty : 0, hab === 'bad' ? H.critical.ap : 0);   // never more than one penalty
      c.ap = Math.max(0, CONFIG.apPerRound - loss);
      c.apUsed = 0;
    }
    const d = { forest: S.forest, soil: S.soil, water: S.water, pollution: S.pollution };
    if (n.projects.wtp.done) { d.water += CONFIG.projects.wtp.water; d.pollution += CONFIG.projects.wtp.pollution; }
    const bonus = devBonus(n); d.forest += bonus.forest; d.pollution += bonus.pollution; n.treasury += bonus.coins;
    const wild = HOME_WILD.filter((id) => !n.land[id]).length;
    d.habitat = (wild >= H.wildMin ? H.wildRecover : 0) + Math.floor(bonus.counts.forest / H.forestPer) - Math.floor(bonus.counts.quarry / H.quarryPer);
    if (hab === 'warn') d.forest -= H.pressure.forest;
    if (hab === 'bad') d.forest = Math.min(d.forest, 0);
    for (const key in n.tileHealth) {
      const id = cellIdOf(key), type = id != null ? (n.land[id] || {}).type : (TILE[key] || {}).type;
      n.tileHealth[key] = Math.min(100, n.tileHealth[key] + (type === 'quarry' ? CONFIG.places.quarryRecover : CONFIG.places.recover) + (n.rested[key] ? CONFIG.places.restBonus : 0));
      if (n.tileHealth[key] >= 100) delete n.tileHealth[key];
    }
    n.rested = {};
    for (const k of ENV_KEYS) n.env[k] = clamp100(n.env[k] + d[k]);
    for (const key in n.harvest) { n.harvest[key] = whole(n.harvest[key] - S.treesRegrow); if (!n.harvest[key]) delete n.harvest[key]; }
    const projects = Object.keys(CONFIG.projects).map((k) => ({ key: k, before: n.stats.projStart[k], after: projectProgress(n, k).combined, done: n.projects[k].done }));
    const summary = { round: n.round.n, before, after: { ...n.env }, treasuryBefore, treasuryAfter: n.treasury,
      produced: { ...n.stats.produced }, traded: n.stats.traded, projects, hungry, nightChange: d };
    n.summaries[n.round.n] = summary; n.lastSummary = n.round.n;
    n.round.settled.push(n.round.n);
    addLog(n, null, 'round', `Round ${n.round.n} ended. ${hungry.length ? hungry.length + ' citizens went hungry.' : 'Nobody went hungry.'}`);
    return { ok: true, state: n, summary };
  }
  function advanceRound(s) {
    const r = settleRound(s);
    if (!r.ok) return r;
    const n = r.state;
    n.round.n += 1; n.round.open = true;
    n.stats = freshStats(n);
    addLog(n, null, 'round', `Round ${n.round.n} begins.`);
    return { ok: true, state: n, summary: r.summary };
  }
  function resetWorld(rng) { return { ok: true, state: defaultState(rng) }; }

  return { ITEMS, ENV_KEYS, ENV_NAMES, TILES, TILE, clone, activeTiles, tilesOfType, citizen, levelFor, waterBand, farmYield,
    treesOn, storeBuyPrice, storeSellPrice, gaugeStatus, projectProgress, defaultState, isValidState, plan, doAction,
    storeBuy, storeSell, createListing, cancelListing, buyListing, saleSplit, addCitizen, setActive, saveReflection,
    openRound, closeRound, settleRound, advanceRound, resetWorld,
    health, tileYield, habLevel, habPen, workplaces, fishable,
    cellKey, cellIdOf, cellType, isLand, isSea, villageLand, seaStaysOpen, workCheck, startWork, workProgress, devCounts, devBonus, upgradeState,
    isCitizenActive, autoAssignProfession, changeJob, teacherSetProfession };
})();
