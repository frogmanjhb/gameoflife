"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPlayerView = buildPlayerView;
exports.redactStateForUser = redactStateForUser;
const shared_1 = require("./shared");
const worldRepository_1 = require("./worldRepository");
function jobChangeSettings(settings) {
    return {
        xpCost: settings.jobChange?.xpCost ?? shared_1.CONFIG.jobChange.xpCost,
        perRound: settings.jobChange?.perRound ?? shared_1.CONFIG.jobChange.perRound,
        xpSource: settings.jobChange?.xpSource ?? shared_1.CONFIG.jobChange.xpSource,
    };
}
function citizenDisplayName(citizen, userId, displayNameForUser, useNicknames) {
    if (useNicknames && citizen.name && !citizen.name.startsWith('Citizen ')) {
        return citizen.name;
    }
    return displayNameForUser(userId);
}
function buildPlayerView(input) {
    const { row, state, viewerUserId, displayNameForUser, useNicknames } = input;
    const jc = jobChangeSettings(row.settings);
    const selfId = (0, worldRepository_1.citizenIdForUser)(viewerUserId);
    const citizens = [];
    let self = null;
    for (const c of state.citizens) {
        const uid = (0, worldRepository_1.userIdFromCitizenId)(c.id);
        if (uid == null)
            continue;
        const name = citizenDisplayName(c, uid, displayNameForUser, useNicknames);
        const base = {
            id: c.id,
            userId: uid,
            name,
            profession: c.prof,
            professionName: shared_1.CONFIG.professions[c.prof].name,
            hungry: c.hungry,
            level: shared_1.RULES.levelFor(c.xp),
            actions: c.actions,
            contrib: c.contrib,
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
                levelAfterJobChange: c.xp >= jc.xpCost ? shared_1.RULES.levelFor(xpAfter) : null,
            };
        }
        else {
            citizens.push(base);
        }
    }
    citizens.sort((a, b) => a.name.localeCompare(b.name));
    const nameByCitizenId = new Map();
    for (const c of state.citizens) {
        const uid = (0, worldRepository_1.userIdFromCitizenId)(c.id);
        if (uid == null)
            continue;
        nameByCitizenId.set(c.id, citizenDisplayName(c, uid, displayNameForUser, useNicknames));
    }
    const listings = state.listings.map((l) => ({
        id: l.id,
        sellerId: l.sellerId,
        sellerName: nameByCitizenId.get(l.sellerId) || 'Village',
        item: l.item,
        qty: l.qty,
        price: l.price,
    }));
    const log = state.log.slice(-200).map((entry) => {
        const cid = entry.cid || null;
        const profKey = cid ? state.citizens.find((x) => x.id === cid)?.prof : null;
        return {
            id: entry.t,
            round: entry.round,
            citizenId: cid,
            name: cid ? nameByCitizenId.get(cid) || entry.name || 'Village' : 'Village',
            professionName: profKey ? shared_1.CONFIG.professions[profKey].name : entry.prof || '',
            kind: entry.kind,
            text: entry.text,
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
        projects: shared_1.RULES.clone(state.projects),
        land: shared_1.RULES.clone(state.land),
        works: shared_1.RULES.clone(state.works),
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
function redactStateForUser(state, viewerUserId) {
    const selfId = (0, worldRepository_1.citizenIdForUser)(viewerUserId);
    const n = shared_1.RULES.clone(state);
    n.citizens = n.citizens.map((c) => {
        if (c.id === selfId)
            return c;
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
//# sourceMappingURL=view.js.map