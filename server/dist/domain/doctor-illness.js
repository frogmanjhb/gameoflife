"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOCTOR_ILLNESS_DAY_START_SQL = exports.DOCTOR_ILLNESS_META = exports.DOCTOR_ILLNESS_TYPES = exports.DOCTOR_CURE_APPROVE_XP = exports.DOCTOR_CURE_FEE = exports.DOCTOR_SEE_DOCTOR_DELAY_MS = exports.DOCTOR_ILLNESS_UNTREATED_EXPIRY_MS = exports.DOCTOR_ILLNESS_UNTREATED_EXPIRY_DAYS = exports.DOCTOR_ILLNESS_DAILY_LIMIT = void 0;
exports.pickRandomIllnessType = pickRandomIllnessType;
exports.expireUntreatedIllnesses = expireUntreatedIllnesses;
const database_prod_1 = __importDefault(require("../database/database-prod"));
exports.DOCTOR_ILLNESS_DAILY_LIMIT = 2;
exports.DOCTOR_ILLNESS_UNTREATED_EXPIRY_DAYS = 2;
exports.DOCTOR_ILLNESS_UNTREATED_EXPIRY_MS = exports.DOCTOR_ILLNESS_UNTREATED_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
exports.DOCTOR_SEE_DOCTOR_DELAY_MS = 2 * 60 * 1000;
exports.DOCTOR_CURE_FEE = 5000;
exports.DOCTOR_CURE_APPROVE_XP = 10;
exports.DOCTOR_ILLNESS_TYPES = [
    'verdigris_vertigo',
    'button_lock_fever',
    'creep_crawlies',
];
exports.DOCTOR_ILLNESS_META = {
    verdigris_vertigo: {
        name: 'Verdigris Vertigo',
        description: 'Intense wavy green haze—the whole screen lurches and sways.',
    },
    button_lock_fever: {
        name: 'Town Hall Lockdown',
        description: 'About 85% of the screen greys out—Town Hub is locked until clinic opens.',
    },
    creep_crawlies: {
        name: 'Treasury Beetle Plague',
        description: 'Hundreds of treasury beetles swarm across your screen.',
    },
};
function pickRandomIllnessType() {
    const idx = Math.floor(Math.random() * exports.DOCTOR_ILLNESS_TYPES.length);
    return exports.DOCTOR_ILLNESS_TYPES[idx];
}
/** Same day window as job challenge games (resets 04:00). */
exports.DOCTOR_ILLNESS_DAY_START_SQL = `
  CASE WHEN CURRENT_TIME < '04:00:00' THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'
  ELSE CURRENT_DATE + INTERVAL '4 hours' END
`;
/** Untreated = no clinic payment or insurance claim submitted. Sets cured_at for natural recovery. */
async function expireUntreatedIllnesses(patientUserId) {
    const interval = `${exports.DOCTOR_ILLNESS_UNTREATED_EXPIRY_DAYS} days`;
    if (patientUserId != null) {
        await database_prod_1.default.query(`UPDATE doctor_illness_assignments
       SET cured_at = CURRENT_TIMESTAMP
       WHERE patient_user_id = $1
         AND cured_at IS NULL
         AND cure_requested_at IS NULL
         AND insurance_claim_requested_at IS NULL
         AND assigned_at <= CURRENT_TIMESTAMP - $2::interval`, [patientUserId, interval]);
        return;
    }
    await database_prod_1.default.query(`UPDATE doctor_illness_assignments
     SET cured_at = CURRENT_TIMESTAMP
     WHERE cured_at IS NULL
       AND cure_requested_at IS NULL
       AND insurance_claim_requested_at IS NULL
       AND assigned_at <= CURRENT_TIMESTAMP - $1::interval`, [interval]);
}
//# sourceMappingURL=doctor-illness.js.map