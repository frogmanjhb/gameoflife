"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElapsedMsSincePlayedAt = getElapsedMsSincePlayedAt;
/**
 * Computes how many milliseconds have elapsed since the given `played_at`
 * timestamp, using the database clock for both ends (NOW() - played_at).
 *
 * This prevents issues caused by clock skew between the API server and DB.
 */
async function getElapsedMsSincePlayedAt(database, playedAt) {
    const row = await database.get(`
      SELECT EXTRACT(EPOCH FROM (NOW() - $1::timestamp)) * 1000 as elapsed_ms
    `, [playedAt]);
    return Number(row?.elapsed_ms ?? 0);
}
//# sourceMappingURL=min-duration.js.map