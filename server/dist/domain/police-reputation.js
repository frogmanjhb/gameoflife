"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POLICE_REPUTATION_PEAK_MULTIPLIER = exports.POLICE_REPUTATION_DAILY_GAIN = exports.POLICE_REPUTATION_BONUS_GAIN = exports.POLICE_REPUTATION_FINE_PENALTY = exports.POLICE_REPUTATION_MAX = exports.POLICE_REPUTATION_START = void 0;
exports.getPoliceEarningsMultiplier = getPoliceEarningsMultiplier;
exports.buildPoliceReputationStatus = buildPoliceReputationStatus;
exports.applyPoliceEarningsMultiplier = applyPoliceEarningsMultiplier;
exports.syncPoliceReputation = syncPoliceReputation;
exports.adjustPoliceReputationOnSubmit = adjustPoliceReputationOnSubmit;
exports.resolvePoliceNetEarnings = resolvePoliceNetEarnings;
exports.getPoliceReputationIfPolice = getPoliceReputationIfPolice;
const database_prod_1 = __importDefault(require("../database/database-prod"));
const doctor_illness_1 = require("./doctor-illness");
function hasPoliceLieutenantJob(jobName) {
    return (jobName || '').toLowerCase().trim().includes('police lieutenant');
}
exports.POLICE_REPUTATION_START = 10;
exports.POLICE_REPUTATION_MAX = 20;
exports.POLICE_REPUTATION_FINE_PENALTY = 1;
exports.POLICE_REPUTATION_BONUS_GAIN = 2;
exports.POLICE_REPUTATION_DAILY_GAIN = 1;
exports.POLICE_REPUTATION_PEAK_MULTIPLIER = 1.25;
const MS_PER_CIVIC_DAY = 24 * 60 * 60 * 1000;
function getPoliceEarningsMultiplier(reputation) {
    const rep = Math.max(0, Math.floor(reputation));
    if (rep >= exports.POLICE_REPUTATION_MAX)
        return exports.POLICE_REPUTATION_PEAK_MULTIPLIER;
    if (rep >= 15)
        return 1;
    if (rep >= 10)
        return 0.75;
    if (rep >= 5)
        return 0.5;
    return 0.25;
}
function buildPoliceReputationStatus(reputation) {
    const current = Math.max(0, Math.min(exports.POLICE_REPUTATION_MAX, Math.floor(reputation)));
    const earnings_multiplier = getPoliceEarningsMultiplier(current);
    const earnings_percent = Math.round(earnings_multiplier * 100);
    let penalty_label = null;
    let bonus_label = null;
    if (current >= exports.POLICE_REPUTATION_MAX) {
        bonus_label = 'Peak reputation — +25% on fine and bonus pay';
    }
    else if (current < 5) {
        penalty_label = 'Critical reputation — you earn 75% less';
    }
    else if (current < 10) {
        penalty_label = 'Poor reputation — you earn 50% less';
    }
    else if (current < 15) {
        penalty_label = 'Low reputation — you earn 25% less';
    }
    return {
        current,
        max: exports.POLICE_REPUTATION_MAX,
        earnings_multiplier,
        earnings_percent,
        penalty_label,
        bonus_label,
    };
}
function applyPoliceEarningsMultiplier(grossAmount, reputation) {
    const gross = parseFloat(String(grossAmount));
    if (!Number.isFinite(gross) || gross <= 0)
        return 0;
    const multiplier = getPoliceEarningsMultiplier(reputation);
    return Math.round(gross * multiplier * 100) / 100;
}
/** Apply civic-day recovery (+1 per day missed, capped at max). */
async function syncPoliceReputation(userId) {
    const row = await database_prod_1.default.get(`SELECT police_reputation, police_reputation_recovered_at,
            (${doctor_illness_1.DOCTOR_ILLNESS_DAY_START_SQL}) AS period_start
     FROM users WHERE id = $1`, [userId]);
    if (!row) {
        return buildPoliceReputationStatus(exports.POLICE_REPUTATION_START);
    }
    let reputation = parseInt(String(row.police_reputation ?? exports.POLICE_REPUTATION_START), 10);
    if (!Number.isFinite(reputation))
        reputation = exports.POLICE_REPUTATION_START;
    const periodStart = new Date(row.period_start);
    const lastRecovered = row.police_reputation_recovered_at
        ? new Date(row.police_reputation_recovered_at)
        : null;
    if (!lastRecovered) {
        await database_prod_1.default.query(`UPDATE users
       SET police_reputation = LEAST($1, GREATEST(0, COALESCE(police_reputation, $2))),
           police_reputation_recovered_at = $3
       WHERE id = $4`, [exports.POLICE_REPUTATION_MAX, exports.POLICE_REPUTATION_START, periodStart, userId]);
        return buildPoliceReputationStatus(reputation);
    }
    if (lastRecovered.getTime() < periodStart.getTime()) {
        const periodsElapsed = Math.floor((periodStart.getTime() - lastRecovered.getTime()) / MS_PER_CIVIC_DAY);
        if (periodsElapsed > 0) {
            reputation = Math.min(exports.POLICE_REPUTATION_MAX, reputation + periodsElapsed * exports.POLICE_REPUTATION_DAILY_GAIN);
            await database_prod_1.default.query(`UPDATE users SET police_reputation = $1, police_reputation_recovered_at = $2 WHERE id = $3`, [reputation, periodStart, userId]);
        }
    }
    return buildPoliceReputationStatus(reputation);
}
async function adjustPoliceReputationOnSubmit(userId, type) {
    await syncPoliceReputation(userId);
    const delta = type === 'fine' ? -exports.POLICE_REPUTATION_FINE_PENALTY : exports.POLICE_REPUTATION_BONUS_GAIN;
    const updated = await database_prod_1.default.query(`UPDATE users
     SET police_reputation = LEAST(
       $4,
       GREATEST(0, COALESCE(police_reputation, $2) + $3)
     )
     WHERE id = $1
     RETURNING police_reputation`, [userId, exports.POLICE_REPUTATION_START, delta, exports.POLICE_REPUTATION_MAX]);
    const reputation = parseInt(String(updated[0]?.police_reputation ?? exports.POLICE_REPUTATION_START), 10);
    return buildPoliceReputationStatus(reputation);
}
async function resolvePoliceNetEarnings(policeUserId, grossAmount) {
    const reputation = await syncPoliceReputation(policeUserId);
    const netAmount = applyPoliceEarningsMultiplier(grossAmount, reputation.current);
    return { netAmount, reputation };
}
async function getPoliceReputationIfPolice(userId, jobName) {
    if (!hasPoliceLieutenantJob(jobName))
        return null;
    return syncPoliceReputation(userId);
}
//# sourceMappingURL=police-reputation.js.map