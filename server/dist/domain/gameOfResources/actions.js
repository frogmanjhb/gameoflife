"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateActionOpt = validateActionOpt;
exports.runDoAction = runDoAction;
exports.runMarketAction = runMarketAction;
exports.runStartWork = runStartWork;
exports.runJobChange = runJobChange;
exports.runSaveReflection = runSaveReflection;
exports.runTeacherRound = runTeacherRound;
exports.persistAdvanceSummary = persistAdvanceSummary;
exports.runRuleChecks = runRuleChecks;
const shared_1 = require("./shared");
const worldRepository_1 = require("./worldRepository");
const access_1 = require("./access");
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
function validateActionOpt(type, opt) {
    if (!opt || typeof opt !== 'object')
        return null;
    if (type === 'donate' || type === 'giveWork') {
        const qty = Number(opt.qty);
        if (!Number.isFinite(qty) || qty < 1 || qty > 99)
            return 'Quantity must be between 1 and 99.';
    }
    if (type === 'develop' && typeof opt.to !== 'string')
        return 'Choose what to build.';
    if (type === 'shift' || type === 'donate') {
        if (typeof opt.project !== 'string' || !(opt.project in shared_1.CONFIG.projects))
            return 'Choose a valid project.';
    }
    if (opt.item != null && !shared_1.RULES.ITEMS.includes(opt.item))
        return 'Choose a valid item.';
    return null;
}
function runDoAction(bundle, userId, actionId, opt = {}) {
    if (!ACTION_IDS.has(actionId)) {
        return { ok: false, reason: 'This action does not exist.' };
    }
    const err = validateActionOpt(actionId, opt);
    if (err)
        return { ok: false, reason: err };
    const cid = (0, worldRepository_1.citizenIdForUser)(userId);
    const r = shared_1.RULES.doAction(bundle.state, cid, actionId, opt);
    return { ok: r.ok, reason: r.reason, state: r.state, event: r.event };
}
function runMarketAction(bundle, userId, kind, payload) {
    const cid = (0, worldRepository_1.citizenIdForUser)(userId);
    let r;
    switch (kind) {
        case 'storeBuy':
            r = shared_1.RULES.storeBuy(bundle.state, cid, payload.item, Number(payload.qty) || 1);
            break;
        case 'storeSell':
            r = shared_1.RULES.storeSell(bundle.state, cid, payload.item, Number(payload.qty) || 1);
            break;
        case 'list':
            r = shared_1.RULES.createListing(bundle.state, cid, payload.item, Number(payload.qty), Number(payload.price));
            break;
        case 'cancel':
            r = shared_1.RULES.cancelListing(bundle.state, cid, String(payload.listingId));
            break;
        case 'buy':
            r = shared_1.RULES.buyListing(bundle.state, cid, String(payload.listingId), Number(payload.qty));
            break;
        default:
            return { ok: false, reason: 'Unknown market action.' };
    }
    return { ok: r.ok, reason: r.reason, state: r.state, event: r.event };
}
function runStartWork(bundle, userId, kind, cellId) {
    if (!shared_1.CONFIG.works[kind])
        return { ok: false, reason: 'Choose a valid land work.' };
    const cid = (0, worldRepository_1.citizenIdForUser)(userId);
    const r = shared_1.RULES.startWork(bundle.state, cid, kind, cellId);
    return { ok: r.ok, reason: r.reason, state: r.state, event: r.event };
}
async function runJobChange(client, bundle, userId, profession, settings) {
    const cid = (0, worldRepository_1.citizenIdForUser)(userId);
    const opts = (0, access_1.jobChangeOptsFromSettings)(settings);
    const r = shared_1.RULES.changeJob(bundle.state, cid, profession, opts);
    if (!r.ok)
        return { ok: false, reason: r.reason };
    const event = r.event;
    const citizenRowId = bundle.userIdToCitizenRowId.get(userId);
    if (citizenRowId != null && event.from && event.to) {
        await (0, worldRepository_1.insertJobChangeAudit)(client, bundle.row.id, citizenRowId, event.from, event.to, event.xpSpent ?? opts.xpCost, event.xpSource ?? opts.xpSource, bundle.row.round_number);
    }
    return { ok: true, state: r.state, event: r.event };
}
async function runSaveReflection(client, bundle, userId, round, text) {
    const cleaned = (0, access_1.stripHtml)(text).slice(0, shared_1.CONFIG.reflectionMax);
    const cid = (0, worldRepository_1.citizenIdForUser)(userId);
    const r = shared_1.RULES.saveReflection(bundle.state, cid, round, cleaned);
    if (!r.ok)
        return { ok: false, reason: r.reason };
    const citizenRowId = bundle.userIdToCitizenRowId.get(userId);
    if (citizenRowId != null) {
        await (0, worldRepository_1.persistReflectionRow)(client, citizenRowId, bundle.row.id, round, cleaned);
    }
    return { ok: true, state: r.state };
}
function runTeacherRound(bundle, op) {
    let r;
    if (op === 'open')
        r = shared_1.RULES.openRound(bundle.state);
    else if (op === 'close')
        r = shared_1.RULES.closeRound(bundle.state);
    else
        r = shared_1.RULES.advanceRound(bundle.state);
    return {
        ok: r.ok,
        reason: r.reason,
        state: r.state,
        summary: r.summary,
    };
}
async function persistAdvanceSummary(client, bundle, summary) {
    if (!summary || summary.round == null)
        return;
    await (0, worldRepository_1.saveRoundSummaryRow)(client, bundle.row.id, Number(summary.round), summary);
}
function runRuleChecks() {
    const checks = [
        ['default state is valid', () => shared_1.RULES.isValidState(shared_1.RULES.defaultState((0, shared_1.mulberry)(1)))],
        [
            'plan rejects closed round',
            () => {
                const s = shared_1.RULES.defaultState((0, shared_1.mulberry)(2));
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
                return !shared_1.RULES.plan(s, 'c-test', 'farm').ok;
            },
        ],
    ];
    return checks.map(([name, fn]) => {
        try {
            return { name, pass: !!fn() };
        }
        catch (e) {
            return { name, pass: false, err: e instanceof Error ? e.message : String(e) };
        }
    });
}
//# sourceMappingURL=actions.js.map