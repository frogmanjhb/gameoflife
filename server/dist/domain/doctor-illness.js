"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOCTOR_ILLNESS_DAY_START_SQL = exports.DOCTOR_ILLNESS_META = exports.DOCTOR_ILLNESS_TYPES = exports.DOCTOR_CURE_APPROVE_XP = exports.DOCTOR_CURE_FEE = exports.DOCTOR_SEE_DOCTOR_DELAY_MS = exports.DOCTOR_ILLNESS_DAILY_LIMIT = void 0;
exports.pickRandomIllnessType = pickRandomIllnessType;
exports.DOCTOR_ILLNESS_DAILY_LIMIT = 5;
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
//# sourceMappingURL=doctor-illness.js.map