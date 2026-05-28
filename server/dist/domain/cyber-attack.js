"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CYBER_ATTACK_DAY_START_SQL = exports.CYBER_ATTACK_META = exports.CYBER_ATTACK_TYPES = exports.CYBER_REPAIR_APPROVE_XP = exports.CYBER_REPAIR_FEE = exports.CYBER_ATTACK_DAILY_LIMIT = void 0;
exports.pickRandomCyberAttackType = pickRandomCyberAttackType;
exports.CYBER_ATTACK_DAILY_LIMIT = 5;
exports.CYBER_REPAIR_FEE = 5000;
exports.CYBER_REPAIR_APPROVE_XP = 10;
exports.CYBER_ATTACK_TYPES = ['spyware_popup_storm'];
exports.CYBER_ATTACK_META = {
    spyware_popup_storm: {
        name: 'Spyware Pop-up Storm',
        description: 'Fake prize pop-ups flood your screen. Close them with × or wait — never click the prize!',
    },
};
function pickRandomCyberAttackType() {
    const idx = Math.floor(Math.random() * exports.CYBER_ATTACK_TYPES.length);
    return exports.CYBER_ATTACK_TYPES[idx];
}
/** Same day window as job challenge games (resets 04:00). */
exports.CYBER_ATTACK_DAY_START_SQL = `
  CASE WHEN CURRENT_TIME < '04:00:00' THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'
  ELSE CURRENT_DATE + INTERVAL '4 hours' END
`;
//# sourceMappingURL=cyber-attack.js.map