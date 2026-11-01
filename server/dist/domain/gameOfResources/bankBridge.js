"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bridgeSettingsFromWorld = bridgeSettingsFromWorld;
exports.bankRandFromCoins = bankRandFromCoins;
exports.citizenCoins = citizenCoins;
exports.deductGameCoins = deductGameCoins;
exports.countPendingRedemptionsForUser = countPendingRedemptionsForUser;
const worldRepository_1 = require("./worldRepository");
const shared_1 = require("./shared");
function bridgeSettingsFromWorld(settings) {
    return {
        enabled: !!settings.bankBridgeEnabled,
        coinsPerRand: Math.max(1, Math.floor(settings.bankBridgeCoinsPerRand ?? 10)),
    };
}
function bankRandFromCoins(coins, coinsPerRand) {
    const wholeCoins = Math.floor(coins);
    const units = Math.floor(wholeCoins / coinsPerRand);
    return units;
}
function citizenCoins(bundle, userId) {
    const cid = (0, worldRepository_1.citizenIdForUser)(userId);
    const c = bundle.state.citizens.find((x) => x.id === cid);
    return c?.coins ?? 0;
}
function deductGameCoins(bundle, userId, amount) {
    const cid = (0, worldRepository_1.citizenIdForUser)(userId);
    const c = shared_1.RULES.citizen(bundle.state, cid);
    if (!c)
        return { ok: false, reason: 'You are not a citizen in this world yet.' };
    if (c.coins < amount)
        return { ok: false, reason: 'You do not have enough game coins.' };
    const n = shared_1.RULES.clone(bundle.state);
    const citizen = shared_1.RULES.citizen(n, cid);
    citizen.coins -= amount;
    return { ok: true, state: n };
}
async function countPendingRedemptionsForUser(client, worldId, userId) {
    const res = await client.query(`SELECT COALESCE(SUM(game_coins), 0)::int AS total
     FROM gor_coin_redemptions
     WHERE world_id = $1 AND user_id = $2 AND status = 'pending'`, [worldId, userId]);
    return Number(res.rows[0]?.total ?? 0);
}
//# sourceMappingURL=bankBridge.js.map