"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POLICE_FINE_APPROVAL_EARNINGS = exports.POLICE_BONUS_APPROVAL_EARNINGS = exports.LAWYER_FINE_REVIEW_XP = exports.POLICE_FINE_BONUS_SUBMIT_XP = void 0;
exports.hasPoliceLieutenantJob = hasPoliceLieutenantJob;
exports.awardPoliceSubmitXp = awardPoliceSubmitXp;
exports.awardLawyerFineReviewXp = awardLawyerFineReviewXp;
exports.payPoliceBonusApprovalReward = payPoliceBonusApprovalReward;
exports.payPoliceFineApprovalReward = payPoliceFineApprovalReward;
const database_prod_1 = __importDefault(require("../database/database-prod"));
const jobs_1 = require("../routes/jobs");
const police_reputation_1 = require("./police-reputation");
exports.POLICE_FINE_BONUS_SUBMIT_XP = 5;
exports.LAWYER_FINE_REVIEW_XP = 10;
exports.POLICE_BONUS_APPROVAL_EARNINGS = 3000;
exports.POLICE_FINE_APPROVAL_EARNINGS = 1000;
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
async function payPoliceApprovalRewardFromTreasury(client, policeUserId, policeUsername, townClass, schoolId, grossEarnings, treasuryDescription, transactionDescription) {
    if (grossEarnings <= 0) {
        return { earnings: 0 };
    }
    const { netAmount: payout, reputation } = await (0, police_reputation_1.resolvePoliceNetEarnings)(policeUserId, grossEarnings);
    if (payout <= 0) {
        return { earnings: 0 };
    }
    const accountResult = await client.query('SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE', [policeUserId]);
    const account = accountResult.rows[0];
    if (!account) {
        return { earnings: 0 };
    }
    const townResult = schoolId != null
        ? await client.query('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id = $2 FOR UPDATE', [townClass, schoolId])
        : await client.query('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id IS NULL FOR UPDATE', [townClass]);
    const townRow = townResult.rows[0];
    const treasuryBalance = parseFloat(String(townRow?.treasury_balance ?? '0'));
    if (!townRow || treasuryBalance < payout) {
        throw new Error('TREASURY_INSUFFICIENT');
    }
    if (schoolId != null) {
        await client.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3', [payout, townClass, schoolId]);
    }
    else {
        await client.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL', [payout, townClass]);
    }
    const repNote = reputation.current >= 20
        ? ' (peak reputation +25%)'
        : reputation.earnings_multiplier < 1
            ? ` (${reputation.earnings_percent}% reputation pay)`
            : '';
    await client.query('INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)', [
        schoolId,
        townClass,
        payout,
        'withdrawal',
        `${treasuryDescription}${repNote}`,
        policeUserId,
    ]);
    await client.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [payout, account.id]);
    await client.query(`INSERT INTO transactions (to_account_id, amount, transaction_type, description)
     VALUES ($1, $2, 'deposit', $3)`, [account.id, payout, transactionDescription]);
    return { earnings: payout };
}
async function payPoliceBonusApprovalReward(client, policeUserId, policeUsername, townClass, schoolId) {
    return payPoliceApprovalRewardFromTreasury(client, policeUserId, policeUsername, townClass, schoolId, exports.POLICE_BONUS_APPROVAL_EARNINGS, `Police bonus submission payout to ${policeUsername}`, 'POLICE_BONUS_SUBMISSION_EARN');
}
async function payPoliceFineApprovalReward(client, policeUserId, policeUsername, townClass, schoolId) {
    return payPoliceApprovalRewardFromTreasury(client, policeUserId, policeUsername, townClass, schoolId, exports.POLICE_FINE_APPROVAL_EARNINGS, `Police fine submission payout to ${policeUsername}`, 'POLICE_FINE_SUBMISSION_EARN');
}
//# sourceMappingURL=police-fines.js.map