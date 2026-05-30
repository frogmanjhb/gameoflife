"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LAWYER_FINE_REVIEW_XP = exports.POLICE_FINE_BONUS_SUBMIT_XP = void 0;
exports.hasPoliceLieutenantJob = hasPoliceLieutenantJob;
exports.awardPoliceSubmitXp = awardPoliceSubmitXp;
exports.awardLawyerFineReviewXp = awardLawyerFineReviewXp;
const database_prod_1 = __importDefault(require("../database/database-prod"));
const jobs_1 = require("../routes/jobs");
exports.POLICE_FINE_BONUS_SUBMIT_XP = 5;
exports.LAWYER_FINE_REVIEW_XP = 10;
function hasPoliceLieutenantJob(jobName) {
    return (jobName || '').toLowerCase().trim().includes('police lieutenant');
}
async function awardJobXp(userId, xpAmount) {
    const currentUser = await database_prod_1.default.get('SELECT job_level, job_experience_points FROM users WHERE id = $1', [userId]);
    const currentLevel = currentUser?.job_level || 1;
    const currentXP = currentUser?.job_experience_points || 0;
    const newXP = currentXP + xpAmount;
    let newLevel = currentLevel;
    for (let level = currentLevel; level < 10; level++) {
        if (newXP >= (0, jobs_1.getXPForLevel)(level + 1))
            newLevel = level + 1;
        else
            break;
    }
    await database_prod_1.default.query('UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3', [newXP, newLevel, userId]);
    return {
        experience_points: xpAmount,
        new_level: newLevel > currentLevel ? newLevel : null,
    };
}
async function awardPoliceSubmitXp(userId) {
    return awardJobXp(userId, exports.POLICE_FINE_BONUS_SUBMIT_XP);
}
async function awardLawyerFineReviewXp(userId) {
    return awardJobXp(userId, exports.LAWYER_FINE_REVIEW_XP);
}
//# sourceMappingURL=police-fines.js.map