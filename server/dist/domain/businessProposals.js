"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROPOSAL_APPROVE_XP = void 0;
exports.hasEntrepreneurJob = hasEntrepreneurJob;
exports.awardProposalApprovalXp = awardProposalApprovalXp;
const database_prod_1 = __importDefault(require("../database/database-prod"));
const jobs_1 = require("../routes/jobs");
exports.PROPOSAL_APPROVE_XP = 50;
function hasEntrepreneurJob(jobName) {
    return (jobName || '').toLowerCase().trim().includes('entrepreneur');
}
async function awardProposalApprovalXp(userId) {
    const currentUser = await database_prod_1.default.get('SELECT job_level, job_experience_points FROM users WHERE id = $1', [userId]);
    const currentLevel = currentUser?.job_level || 1;
    const currentXP = currentUser?.job_experience_points || 0;
    const newXP = currentXP + exports.PROPOSAL_APPROVE_XP;
    let newLevel = currentLevel;
    for (let level = currentLevel; level < 10; level++) {
        if (newXP >= (0, jobs_1.getXPForLevel)(level + 1))
            newLevel = level + 1;
        else
            break;
    }
    await database_prod_1.default.query('UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3', [newXP, newLevel, userId]);
    return {
        experience_points: exports.PROPOSAL_APPROVE_XP,
        new_level: newLevel > currentLevel ? newLevel : null,
    };
}
//# sourceMappingURL=businessProposals.js.map