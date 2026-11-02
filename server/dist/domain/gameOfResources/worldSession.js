"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withWorldTransaction = withWorldTransaction;
exports.ensureStudentCitizen = ensureStudentCitizen;
exports.buildStatusForStudent = buildStatusForStudent;
exports.applyGameplayAndSave = applyGameplayAndSave;
exports.saveBundleIfDirty = saveBundleIfDirty;
const database_prod_1 = __importDefault(require("../../database/database-prod"));
const shared_1 = require("./shared");
const worldRepository_1 = require("./worldRepository");
const view_1 = require("./view");
const access_1 = require("./access");
const liveUpdates_1 = require("./liveUpdates");
const actions_1 = require("./actions");
const avatar_1 = require("./avatar");
async function withWorldTransaction(schoolId, townClass, fn) {
    const client = await database_prod_1.default.getClient();
    try {
        await client.query('BEGIN');
        const bundle = await (0, worldRepository_1.getOrCreateWorldLocked)(client, schoolId, townClass);
        const result = await fn(client, bundle);
        await client.query('COMMIT');
        return result;
    }
    catch (e) {
        await client.query('ROLLBACK');
        throw e;
    }
    finally {
        client.release();
    }
}
async function ensureStudentCitizen(client, bundle, userId, displayName) {
    const had = bundle.citizenRows.some((c) => c.user_id === userId);
    if (had) {
        const c = bundle.state.citizens.find((x) => x.id === (0, worldRepository_1.citizenIdForUser)(userId));
        if (c && c.lastActiveRound !== bundle.row.round_number) {
            c.lastActiveRound = bundle.row.round_number;
            await client.query(`UPDATE gor_citizens SET last_active_round = $1 WHERE world_id = $2 AND user_id = $3`, [bundle.row.round_number, bundle.row.id, userId]);
            const row = bundle.citizenRows.find((r) => r.user_id === userId);
            if (row)
                row.last_active_round = bundle.row.round_number;
        }
        return { bundle, firstVisit: false, dirty: false };
    }
    const useNick = !!bundle.row.settings.useNicknames;
    const nickname = useNick ? (0, access_1.generateNickname)(userId, bundle.row.seed) : null;
    const prof = shared_1.RULES.autoAssignProfession(bundle.state, (0, shared_1.mulberry)(bundle.row.seed ^ userId));
    bundle = await (0, worldRepository_1.ensureCitizen)(client, bundle, userId, {
        profession: prof,
        nickname,
        displayName: useNick && nickname ? nickname : displayName,
    });
    return { bundle, firstVisit: true, profession: prof, dirty: true };
}
async function buildStatusForStudent(client, bundle, userId, displayName) {
    const ensured = await ensureStudentCitizen(client, bundle, userId, displayName);
    bundle = ensured.bundle;
    if (ensured.dirty) {
        await (0, worldRepository_1.saveWorldState)(client, bundle, bundle.state, { expectedVersion: bundle.row.version });
    }
    const nameMap = await (0, access_1.loadDisplayNameMap)(client, bundle.row.school_id, bundle.row.town_class);
    const avatarByUser = new Map(bundle.citizenRows.map((r) => [r.user_id, (0, avatar_1.parseGorAvatar)(r.avatar, r.profession)]));
    const view = (0, view_1.buildPlayerView)({
        row: bundle.row,
        state: bundle.state,
        viewerUserId: userId,
        displayNameForUser: (id) => nameMap.get(id) ?? `Student ${id}`,
        useNicknames: !!bundle.row.settings.useNicknames,
        getAvatar: (uid, prof) => avatarByUser.get(uid) ?? (0, avatar_1.parseGorAvatar)(undefined, prof),
    });
    return {
        view,
        firstVisit: ensured.firstVisit,
        assignedProfession: ensured.profession,
        assignedProfessionName: ensured.profession
            ? shared_1.CONFIG.professions[ensured.profession].name
            : undefined,
    };
}
async function applyGameplayAndSave(client, bundle, userId, gameplay, options) {
    if (!gameplay.ok || !gameplay.state) {
        return { bundle, row: bundle.row };
    }
    const prevVersion = bundle.row.version;
    const row = await (0, worldRepository_1.saveWorldState)(client, bundle, gameplay.state, {
        expectedVersion: prevVersion,
        newLogFromSeq: bundle.row.seq + 1,
        roundStartedAt: options?.roundStartedAt,
        roundEndsAt: options?.roundEndsAt,
    });
    if (!row) {
        throw new Error('World version conflict — refresh and try again.');
    }
    if (options?.advanceSummary && gameplay.summary) {
        await (0, actions_1.persistAdvanceSummary)(client, bundle, gameplay.summary);
    }
    (0, liveUpdates_1.notifyWorldVersion)(row.id, row.version);
    bundle.row = row;
    return { bundle, row };
}
async function saveBundleIfDirty(client, bundle) {
    await (0, worldRepository_1.saveWorldState)(client, bundle, bundle.state, { expectedVersion: bundle.row.version });
}
//# sourceMappingURL=worldSession.js.map