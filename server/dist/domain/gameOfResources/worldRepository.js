"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.citizenIdForUser = citizenIdForUser;
exports.userIdFromCitizenId = userIdFromCitizenId;
exports.worldSeedForTown = worldSeedForTown;
exports.createInitialGameState = createInitialGameState;
exports.lockWorldRow = lockWorldRow;
exports.loadLockedWorld = loadLockedWorld;
exports.createWorld = createWorld;
exports.getOrCreateWorldLocked = getOrCreateWorldLocked;
exports.applyDisplayNamesToState = applyDisplayNamesToState;
exports.ensureCitizen = ensureCitizen;
exports.saveWorldState = saveWorldState;
exports.loadLockedWorldById = loadLockedWorldById;
exports.updateWorldRoundSchedule = updateWorldRoundSchedule;
exports.insertJobChangeAudit = insertJobChangeAudit;
exports.tablesReady = tablesReady;
exports.persistReflectionRow = persistReflectionRow;
exports.saveRoundSummaryRow = saveRoundSummaryRow;
exports.updateWorldSettings = updateWorldSettings;
exports.updateCitizenAvatar = updateCitizenAvatar;
exports.resetWorldForTown = resetWorldForTown;
const shared_1 = require("./shared");
const types_1 = require("./types");
const scheduleTime_1 = require("./scheduleTime");
const LOG_LOAD_LIMIT = 500;
function citizenIdForUser(userId) {
    return `u${userId}`;
}
function userIdFromCitizenId(citizenId) {
    if (!citizenId.startsWith('u'))
        return null;
    const n = Number(citizenId.slice(1));
    return Number.isFinite(n) ? n : null;
}
const PG_INT_MAX = 2147483647;
function worldSeedForTown(schoolId, townClass) {
    let h = Math.imul(schoolId, 2654435761);
    for (let i = 0; i < townClass.length; i++) {
        h = Math.imul(h ^ townClass.charCodeAt(i), 1597334677);
    }
    const u = (h >>> 0) || 1;
    return (u % PG_INT_MAX) || 1;
}
function parseJsonRecord(value, fallback) {
    if (value == null)
        return fallback;
    if (typeof value === 'object')
        return value;
    return fallback;
}
function landToState(raw) {
    const out = {};
    for (const [k, v] of Object.entries(raw || {})) {
        const id = Number(k);
        if (!Number.isFinite(id))
            continue;
        out[id] = v;
    }
    return out;
}
function landFromState(land) {
    const out = {};
    for (const [k, v] of Object.entries(land || {})) {
        out[String(k)] = v;
    }
    return out;
}
function emptyProjects() {
    const out = {};
    for (const k of Object.keys(shared_1.CONFIG.projects)) {
        out[k] = { mat: { wood: 0, stone: 0, tools: 0 }, labour: 0, done: false };
    }
    return out;
}
function createInitialGameState(seed) {
    const rng = (0, shared_1.mulberry)(seed);
    const s = shared_1.RULES.defaultState(rng);
    s.citizens = [];
    s.activeId = null;
    s.listings = [];
    s.log = [];
    s.summaries = {};
    s.lastSummary = null;
    s.seq = 1;
    return shared_1.RULES.upgradeState(s);
}
function rowToGameState(row, citizens, listings, logs, summaries) {
    const state = {
        schema: shared_1.CONFIG.schema,
        seq: row.seq,
        round: {
            n: row.round_number,
            open: row.round_open,
            settled: [...(row.settled_rounds || [])],
        },
        treasury: row.treasury,
        env: { ...parseJsonRecord(row.env, shared_1.CONFIG.env) },
        harvest: { ...parseJsonRecord(row.harvest, {}) },
        minedTotal: row.mined_total,
        citizens: citizens.map(citizenRowToState),
        activeId: null,
        listings: listings.map((l) => ({
            id: l.listing_key,
            sellerId: citizenIdForUser(l.seller_user_id),
            item: l.item,
            qty: l.qty,
            price: l.price,
        })),
        projects: parseJsonRecord(row.projects, emptyProjects()),
        log: logs
            .slice()
            .reverse()
            .map((l) => ({
            id: l.seq,
            round: l.round_number,
            cid: l.citizen_user_id != null ? citizenIdForUser(l.citizen_user_id) : null,
            name: '',
            prof: '',
            kind: l.kind,
            text: l.text,
            t: l.seq,
        })),
        stats: row.stats,
        summaries,
        lastSummary: summaries && Object.keys(summaries).length
            ? Math.max(...Object.keys(summaries).map(Number))
            : null,
        land: landToState(row.land),
        works: parseJsonRecord(row.works, { reclaim: null, link: null }),
        tileHealth: { ...parseJsonRecord(row.tile_health, {}) },
        rested: { ...parseJsonRecord(row.rested, {}) },
    };
    return shared_1.RULES.upgradeState(state);
}
function citizenRowToState(c) {
    const reflections = {};
    for (const [k, v] of Object.entries(parseJsonRecord(c.reflections, {}))) {
        reflections[Number(k)] = String(v);
    }
    const displayName = c.nickname?.trim() || '';
    return {
        id: citizenIdForUser(c.user_id),
        name: displayName || `Citizen ${c.user_id}`,
        prof: c.profession,
        coins: c.coins,
        inv: {
            food: c.food,
            wood: c.wood,
            stone: c.stone,
            tools: c.tools,
        },
        ap: c.ap,
        xp: c.xp,
        hungry: c.hungry,
        apUsed: c.ap_used,
        actions: c.actions,
        contrib: c.contrib,
        reflections,
        lastActiveRound: c.last_active_round ?? undefined,
        jobChangedRound: c.job_changed_round ?? undefined,
    };
}
function mapWorldRow(r) {
    return {
        id: r.id,
        school_id: r.school_id,
        town_class: r.town_class,
        seed: r.seed,
        seq: r.seq,
        round_number: r.round_number,
        round_open: r.round_open,
        round_started_at: r.round_started_at || null,
        round_ends_at: r.round_ends_at || null,
        paused: r.paused,
        treasury: r.treasury,
        env: parseJsonRecord(r.env, shared_1.CONFIG.env),
        mined_total: r.mined_total,
        projects: parseJsonRecord(r.projects, emptyProjects()),
        land: parseJsonRecord(r.land, {}),
        works: parseJsonRecord(r.works, { reclaim: null, link: null }),
        harvest: parseJsonRecord(r.harvest, {}),
        tile_health: parseJsonRecord(r.tile_health, {}),
        rested: parseJsonRecord(r.rested, {}),
        stats: r.stats || null,
        settled_rounds: r.settled_rounds || [],
        settings: { ...types_1.DEFAULT_GOR_SETTINGS, ...parseJsonRecord(r.settings, {}) },
        version: r.version,
    };
}
async function loadSummaries(client, worldId) {
    const res = await client.query(`SELECT round_number, summary FROM gor_round_summaries WHERE world_id = $1 ORDER BY round_number`, [worldId]);
    const out = {};
    for (const row of res.rows) {
        out[row.round_number] = row.summary;
    }
    return out;
}
async function loadCitizens(client, worldId) {
    const res = await client.query(`SELECT * FROM gor_citizens WHERE world_id = $1 ORDER BY id`, [worldId]);
    return res.rows;
}
async function loadListings(client, worldId) {
    const res = await client.query(`SELECT * FROM gor_listings WHERE world_id = $1 ORDER BY id`, [worldId]);
    return res.rows;
}
async function loadRecentLogs(client, worldId) {
    const res = await client.query(`SELECT * FROM (
       SELECT * FROM gor_log WHERE world_id = $1 ORDER BY id DESC LIMIT $2
     ) sub ORDER BY id ASC`, [worldId, LOG_LOAD_LIMIT]);
    return res.rows;
}
async function lockWorldRow(client, schoolId, townClass) {
    const res = await client.query(`SELECT * FROM gor_worlds WHERE school_id = $1 AND town_class = $2 FOR UPDATE`, [schoolId, townClass]);
    if (!res.rows.length)
        return null;
    return mapWorldRow(res.rows[0]);
}
async function loadLockedWorld(client, schoolId, townClass) {
    const row = await lockWorldRow(client, schoolId, townClass);
    if (!row)
        return null;
    const [citizenRows, listings, logs, summaries] = await Promise.all([
        loadCitizens(client, row.id),
        loadListings(client, row.id),
        loadRecentLogs(client, row.id),
        loadSummaries(client, row.id),
    ]);
    const state = rowToGameState(row, citizenRows, listings, logs, summaries);
    const userIdToCitizenRowId = new Map();
    for (const c of citizenRows) {
        userIdToCitizenRowId.set(c.user_id, c.id);
    }
    return { row, state, citizenRows, userIdToCitizenRowId };
}
async function createWorld(client, schoolId, townClass) {
    const seed = worldSeedForTown(schoolId, townClass);
    const initial = createInitialGameState(seed);
    const settings = { ...types_1.DEFAULT_GOR_SETTINGS };
    const res = await client.query(`INSERT INTO gor_worlds (
      school_id, town_class, seed, seq, round_number, round_open, treasury, env,
      mined_total, projects, land, works, harvest, tile_health, rested, stats, settled_rounds, settings
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8::jsonb,
      $9, $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, $14::jsonb, $15::jsonb, $16::jsonb, $17, $18::jsonb
    )
    ON CONFLICT (school_id, town_class) DO NOTHING
    RETURNING *`, [
        schoolId,
        townClass,
        seed,
        initial.seq,
        initial.round.n,
        initial.round.open,
        initial.treasury,
        JSON.stringify(initial.env),
        initial.minedTotal,
        JSON.stringify(initial.projects),
        JSON.stringify(landFromState(initial.land)),
        JSON.stringify(initial.works),
        JSON.stringify(initial.harvest),
        JSON.stringify(initial.tileHealth),
        JSON.stringify(initial.rested),
        JSON.stringify(initial.stats),
        initial.round.settled,
        JSON.stringify(settings),
    ]);
    if (res.rows.length) {
        const row = mapWorldRow(res.rows[0]);
        const now = new Date();
        const ends = (0, scheduleTime_1.nextRoundEndsAt)(settings, now);
        await client.query(`UPDATE gor_worlds SET round_started_at = $1, round_ends_at = $2 WHERE id = $3`, [now, ends, row.id]);
        row.round_started_at = now;
        row.round_ends_at = ends;
        return {
            row,
            state: initial,
            citizenRows: [],
            userIdToCitizenRowId: new Map(),
        };
    }
    const loaded = await loadLockedWorld(client, schoolId, townClass);
    if (!loaded)
        throw new Error('Failed to create or load Game of Resources world');
    return loaded;
}
async function getOrCreateWorldLocked(client, schoolId, townClass) {
    const existing = await loadLockedWorld(client, schoolId, townClass);
    if (existing)
        return existing;
    return createWorld(client, schoolId, townClass);
}
function applyDisplayNamesToState(state, lookup, useNicknames) {
    const n = shared_1.RULES.clone(state);
    for (const c of n.citizens) {
        const uid = userIdFromCitizenId(c.id);
        if (uid == null)
            continue;
        if (useNicknames && c.name && !c.name.startsWith('Citizen ')) {
            continue;
        }
        c.name = lookup(uid);
    }
    return n;
}
async function ensureCitizen(client, bundle, userId, opts) {
    const existing = bundle.citizenRows.find((c) => c.user_id === userId);
    if (existing) {
        return bundle;
    }
    const st = shared_1.CONFIG.start;
    const res = await client.query(`INSERT INTO gor_citizens (
      world_id, user_id, profession, nickname, coins, food, wood, stone, tools,
      ap, xp, last_active_round
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`, [
        bundle.row.id,
        userId,
        opts.profession,
        opts.nickname ?? null,
        st.coins,
        st.food,
        st.wood,
        st.stone,
        st.tools,
        shared_1.CONFIG.apPerRound,
        st.xp,
        bundle.row.round_number,
    ]);
    const row = res.rows[0];
    const state = shared_1.RULES.clone(bundle.state);
    const citizen = citizenRowToState(row);
    citizen.name = opts.displayName;
    state.citizens.push(citizen);
    bundle.citizenRows.push(row);
    bundle.userIdToCitizenRowId.set(userId, row.id);
    bundle.state = state;
    return bundle;
}
async function saveWorldState(client, bundle, state, options) {
    const { expectedVersion } = options;
    const newLogFromSeq = options.newLogFromSeq ?? state.seq;
    const params = [
        state.seq,
        state.round.n,
        state.round.open,
        state.treasury,
        JSON.stringify(state.env),
        state.minedTotal,
        JSON.stringify(state.projects),
        JSON.stringify(landFromState(state.land)),
        JSON.stringify(state.works),
        JSON.stringify(state.harvest),
        JSON.stringify(state.tileHealth),
        JSON.stringify(state.rested),
        state.stats ? JSON.stringify(state.stats) : null,
        state.round.settled,
    ];
    let sql = `UPDATE gor_worlds SET
      seq = $1,
      round_number = $2,
      round_open = $3,
      treasury = $4,
      env = $5::jsonb,
      mined_total = $6,
      projects = $7::jsonb,
      land = $8::jsonb,
      works = $9::jsonb,
      harvest = $10::jsonb,
      tile_health = $11::jsonb,
      rested = $12::jsonb,
      stats = $13::jsonb,
      settled_rounds = $14,
      version = version + 1,
      updated_at = CURRENT_TIMESTAMP`;
    if (options.roundStartedAt !== undefined) {
        params.push(options.roundStartedAt);
        sql += `, round_started_at = $${params.length}`;
    }
    if (options.roundEndsAt !== undefined) {
        params.push(options.roundEndsAt);
        sql += `, round_ends_at = $${params.length}`;
    }
    params.push(bundle.row.id);
    const idIdx = params.length;
    params.push(expectedVersion);
    const verIdx = params.length;
    sql += ` WHERE id = $${idIdx} AND version = $${verIdx}`;
    if (options.expectedRoundNumber != null) {
        params.push(options.expectedRoundNumber);
        sql += ` AND round_number = $${params.length}`;
    }
    sql += ` RETURNING *`;
    const update = await client.query(sql, params);
    if (!update.rows.length) {
        if (options.expectedRoundNumber != null)
            return null;
        throw new Error('World version conflict — refresh and try again.');
    }
    for (const c of state.citizens) {
        const uid = userIdFromCitizenId(c.id);
        if (uid == null)
            continue;
        const reflections = {};
        for (const [rk, rv] of Object.entries(c.reflections || {})) {
            reflections[String(rk)] = rv;
        }
        await client.query(`UPDATE gor_citizens SET
        profession = $1,
        coins = $2,
        food = $3,
        wood = $4,
        stone = $5,
        tools = $6,
        ap = $7,
        xp = $8,
        hungry = $9,
        ap_used = $10,
        actions = $11,
        contrib = $12,
        reflections = $13::jsonb,
        last_active_round = $14,
        job_changed_round = $15
      WHERE world_id = $16 AND user_id = $17`, [
            c.prof,
            c.coins,
            c.inv.food,
            c.inv.wood,
            c.inv.stone,
            c.inv.tools,
            c.ap,
            c.xp,
            c.hungry,
            c.apUsed,
            c.actions,
            c.contrib,
            JSON.stringify(reflections),
            c.lastActiveRound ?? null,
            c.jobChangedRound ?? null,
            bundle.row.id,
            uid,
        ]);
    }
    await client.query(`DELETE FROM gor_listings WHERE world_id = $1`, [bundle.row.id]);
    for (const l of state.listings) {
        const sellerUid = userIdFromCitizenId(l.sellerId);
        if (sellerUid == null)
            continue;
        await client.query(`INSERT INTO gor_listings (world_id, listing_key, seller_user_id, item, qty, price)
       VALUES ($1, $2, $3, $4, $5, $6)`, [bundle.row.id, l.id, sellerUid, l.item, l.qty, l.price]);
    }
    const prevSeq = bundle.row.seq;
    for (const entry of state.log) {
        const seq = entry.t;
        if (seq <= prevSeq || seq < newLogFromSeq)
            continue;
        const cid = entry.cid;
        const uid = cid ? userIdFromCitizenId(cid) : null;
        await client.query(`INSERT INTO gor_log (world_id, round_number, citizen_user_id, kind, text, seq)
       VALUES ($1, $2, $3, $4, $5, $6)`, [bundle.row.id, entry.round, uid, entry.kind, entry.text, seq]);
    }
    const row = mapWorldRow(update.rows[0]);
    bundle.row = row;
    bundle.state = state;
    return row;
}
async function loadLockedWorldById(client, worldId) {
    const res = await client.query(`SELECT * FROM gor_worlds WHERE id = $1 FOR UPDATE`, [worldId]);
    if (!res.rows.length)
        return null;
    const row = mapWorldRow(res.rows[0]);
    const [citizenRows, listings, logs, summaries] = await Promise.all([
        loadCitizens(client, row.id),
        loadListings(client, row.id),
        loadRecentLogs(client, row.id),
        loadSummaries(client, row.id),
    ]);
    const state = rowToGameState(row, citizenRows, listings, logs, summaries);
    const userIdToCitizenRowId = new Map();
    for (const c of citizenRows) {
        userIdToCitizenRowId.set(c.user_id, c.id);
    }
    return { row, state, citizenRows, userIdToCitizenRowId };
}
async function updateWorldRoundSchedule(client, worldId, startedAt, endsAt) {
    const res = await client.query(`UPDATE gor_worlds SET round_started_at = $1, round_ends_at = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 RETURNING *`, [startedAt, endsAt, worldId]);
    if (!res.rows.length)
        throw new Error('World not found.');
    return mapWorldRow(res.rows[0]);
}
async function insertJobChangeAudit(client, worldId, citizenRowId, fromProf, toProf, xpSpent, xpSource, roundNumber) {
    await client.query(`INSERT INTO gor_job_changes (world_id, citizen_id, from_profession, to_profession, xp_spent, xp_source, round_number)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`, [worldId, citizenRowId, fromProf, toProf, xpSpent, xpSource, roundNumber]);
}
async function tablesReady(client) {
    const res = await client.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'gor_worlds' LIMIT 1`);
    return res.rows.length > 0;
}
async function persistReflectionRow(client, citizenRowId, worldId, roundNumber, text) {
    await client.query(`INSERT INTO gor_reflections (world_id, citizen_id, round_number, text)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (citizen_id, round_number) DO UPDATE SET text = EXCLUDED.text`, [worldId, citizenRowId, roundNumber, text.slice(0, shared_1.CONFIG.reflectionMax)]);
}
async function saveRoundSummaryRow(client, worldId, roundNumber, summary) {
    await client.query(`INSERT INTO gor_round_summaries (world_id, round_number, summary)
     VALUES ($1, $2, $3::jsonb)
     ON CONFLICT (world_id, round_number) DO UPDATE SET summary = EXCLUDED.summary`, [worldId, roundNumber, JSON.stringify(summary)]);
}
async function updateWorldSettings(client, worldId, settings, expectedVersion, paused) {
    const res = await client.query(`UPDATE gor_worlds SET settings = $1::jsonb,
      paused = COALESCE($4, paused),
      version = version + 1,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND version = $3 RETURNING *`, [JSON.stringify(settings), worldId, expectedVersion, paused ?? null]);
    if (!res.rows.length)
        throw new Error('World version conflict — refresh and try again.');
    return mapWorldRow(res.rows[0]);
}
async function updateCitizenAvatar(client, worldId, userId, avatar) {
    const res = await client.query(`UPDATE gor_citizens SET avatar = $1::jsonb WHERE world_id = $2 AND user_id = $3 RETURNING *`, [JSON.stringify(avatar), worldId, userId]);
    if (!res.rows.length)
        return null;
    return res.rows[0];
}
async function resetWorldForTown(client, worldId) {
    await client.query(`DELETE FROM gor_job_changes WHERE world_id = $1`, [worldId]);
    await client.query(`DELETE FROM gor_reflections WHERE world_id = $1`, [worldId]);
    await client.query(`DELETE FROM gor_round_summaries WHERE world_id = $1`, [worldId]);
    await client.query(`DELETE FROM gor_log WHERE world_id = $1`, [worldId]);
    await client.query(`DELETE FROM gor_listings WHERE world_id = $1`, [worldId]);
    await client.query(`DELETE FROM gor_citizens WHERE world_id = $1`, [worldId]);
    const row = await client.query(`SELECT seed FROM gor_worlds WHERE id = $1`, [worldId]);
    const seed = row.rows[0]?.seed ?? 1;
    const initial = createInitialGameState(seed);
    await client.query(`UPDATE gor_worlds SET
      seq = $1, round_number = $2, round_open = true, treasury = $3, env = $4::jsonb,
      mined_total = 0, projects = $5::jsonb, land = '{}'::jsonb,
      works = $6::jsonb, harvest = '{}'::jsonb, tile_health = '{}'::jsonb, rested = '{}'::jsonb,
      stats = $7::jsonb, settled_rounds = '{}', version = version + 1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $8`, [
        initial.seq,
        initial.round.n,
        initial.treasury,
        JSON.stringify(initial.env),
        JSON.stringify(initial.projects),
        JSON.stringify(initial.works),
        JSON.stringify(initial.stats),
        worldId,
    ]);
}
//# sourceMappingURL=worldRepository.js.map