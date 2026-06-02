"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOCTOR_REPUTATION_DAILY_GAIN = exports.DOCTOR_REPUTATION_ASSIGN_PENALTY = exports.DOCTOR_REPUTATION_MAX = exports.DOCTOR_REPUTATION_START = void 0;
exports.getDoctorEarningsMultiplier = getDoctorEarningsMultiplier;
exports.buildDoctorReputationStatus = buildDoctorReputationStatus;
exports.applyDoctorEarningsMultiplier = applyDoctorEarningsMultiplier;
exports.syncDoctorReputation = syncDoctorReputation;
exports.decrementDoctorReputationOnAssign = decrementDoctorReputationOnAssign;
exports.resolveDoctorNetEarnings = resolveDoctorNetEarnings;
exports.getDoctorReputationIfDoctor = getDoctorReputationIfDoctor;
const database_prod_1 = __importDefault(require("../database/database-prod"));
const doctor_illness_1 = require("./doctor-illness");
const attendance_1 = require("./attendance");
exports.DOCTOR_REPUTATION_START = 20;
exports.DOCTOR_REPUTATION_MAX = 20;
exports.DOCTOR_REPUTATION_ASSIGN_PENALTY = 3;
exports.DOCTOR_REPUTATION_DAILY_GAIN = 1;
const MS_PER_CIVIC_DAY = 24 * 60 * 60 * 1000;
function getDoctorEarningsMultiplier(reputation) {
    const rep = Math.max(0, Math.floor(reputation));
    if (rep >= 15)
        return 1;
    if (rep >= 10)
        return 0.65;
    if (rep >= 5)
        return 0.4;
    return 0.2;
}
function buildDoctorReputationStatus(reputation) {
    const current = Math.max(0, Math.min(exports.DOCTOR_REPUTATION_MAX, Math.floor(reputation)));
    const earnings_multiplier = getDoctorEarningsMultiplier(current);
    const earnings_percent = Math.round(earnings_multiplier * 100);
    let penalty_label = null;
    if (current < 5) {
        penalty_label = 'Critical reputation — you earn 80% less';
    }
    else if (current < 10) {
        penalty_label = 'Poor reputation — you earn 60% less';
    }
    else if (current < 15) {
        penalty_label = 'Low reputation — you earn 35% less';
    }
    return {
        current,
        max: exports.DOCTOR_REPUTATION_MAX,
        earnings_multiplier,
        earnings_percent,
        penalty_label,
    };
}
function applyDoctorEarningsMultiplier(grossAmount, reputation) {
    const gross = parseFloat(String(grossAmount));
    if (!Number.isFinite(gross) || gross <= 0)
        return 0;
    const multiplier = getDoctorEarningsMultiplier(reputation);
    return Math.round(gross * multiplier * 100) / 100;
}
/** Apply civic-day recovery (+1 per day missed, capped at max). */
async function syncDoctorReputation(userId) {
    const row = await database_prod_1.default.get(`SELECT doctor_reputation, doctor_reputation_recovered_at,
            (${doctor_illness_1.DOCTOR_ILLNESS_DAY_START_SQL}) AS period_start
     FROM users WHERE id = $1`, [userId]);
    if (!row) {
        return buildDoctorReputationStatus(exports.DOCTOR_REPUTATION_START);
    }
    let reputation = parseInt(String(row.doctor_reputation ?? exports.DOCTOR_REPUTATION_START), 10);
    if (!Number.isFinite(reputation))
        reputation = exports.DOCTOR_REPUTATION_START;
    const periodStart = new Date(row.period_start);
    const lastRecovered = row.doctor_reputation_recovered_at
        ? new Date(row.doctor_reputation_recovered_at)
        : null;
    if (!lastRecovered) {
        await database_prod_1.default.query(`UPDATE users
       SET doctor_reputation = LEAST($1, GREATEST(0, COALESCE(doctor_reputation, $2))),
           doctor_reputation_recovered_at = $3
       WHERE id = $4`, [exports.DOCTOR_REPUTATION_MAX, exports.DOCTOR_REPUTATION_START, periodStart, userId]);
        return buildDoctorReputationStatus(reputation);
    }
    if (lastRecovered.getTime() < periodStart.getTime()) {
        const periodsElapsed = Math.floor((periodStart.getTime() - lastRecovered.getTime()) / MS_PER_CIVIC_DAY);
        if (periodsElapsed > 0) {
            reputation = Math.min(exports.DOCTOR_REPUTATION_MAX, reputation + periodsElapsed * exports.DOCTOR_REPUTATION_DAILY_GAIN);
            await database_prod_1.default.query(`UPDATE users SET doctor_reputation = $1, doctor_reputation_recovered_at = $2 WHERE id = $3`, [reputation, periodStart, userId]);
        }
    }
    return buildDoctorReputationStatus(reputation);
}
async function decrementDoctorReputationOnAssign(userId) {
    await syncDoctorReputation(userId);
    const updated = await database_prod_1.default.query(`UPDATE users
     SET doctor_reputation = GREATEST(
       0,
       COALESCE(doctor_reputation, $2) - $3
     )
     WHERE id = $1
     RETURNING doctor_reputation`, [userId, exports.DOCTOR_REPUTATION_START, exports.DOCTOR_REPUTATION_ASSIGN_PENALTY]);
    const reputation = parseInt(String(updated[0]?.doctor_reputation ?? 0), 10);
    return buildDoctorReputationStatus(reputation);
}
/** Gross doctor earnings after reputation sync (for games, salary, clinic). */
async function resolveDoctorNetEarnings(doctorUserId, grossAmount) {
    const reputation = await syncDoctorReputation(doctorUserId);
    const netAmount = applyDoctorEarningsMultiplier(grossAmount, reputation.current);
    return { netAmount, reputation };
}
async function getDoctorReputationIfDoctor(userId, jobName) {
    if (!(0, attendance_1.hasDoctorJob)(jobName))
        return null;
    return syncDoctorReputation(userId);
}
//# sourceMappingURL=doctor-reputation.js.map