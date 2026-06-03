"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACCOUNTANT_ADVICE_DAILY_REWARD_LIMIT = exports.MAX_ADVICE_LENGTH = exports.MIN_ADVICE_LENGTH = exports.ADVICE_EARNINGS_REWARD = exports.ADVICE_XP_REWARD = void 0;
exports.sanitizeAdvice = sanitizeAdvice;
exports.tablesReady = tablesReady;
exports.resolveAccountantClient = resolveAccountantClient;
exports.payAdviceReward = payAdviceReward;
const database_prod_1 = __importDefault(require("../database/database-prod"));
const jobs_1 = require("../routes/jobs");
const accountant_assignments_1 = require("./accountant-assignments");
exports.ADVICE_XP_REWARD = 10;
exports.ADVICE_EARNINGS_REWARD = 500;
exports.MIN_ADVICE_LENGTH = 20;
exports.MAX_ADVICE_LENGTH = 2000;
/** Max rewarded advice submissions per accountant per game day (resets 04:00). */
exports.ACCOUNTANT_ADVICE_DAILY_REWARD_LIMIT = 10;
const GAME_DAY_START_SQL = `
  CASE
    WHEN CURRENT_TIME < '04:00:00'
    THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'
    ELSE CURRENT_DATE + INTERVAL '4 hours'
  END
`;
function sanitizeAdvice(text) {
    return text.replace(/\s+/g, ' ').trim();
}
async function tablesReady() {
    try {
        await database_prod_1.default.query('SELECT 1 FROM accountant_client_advice LIMIT 1');
        return true;
    }
    catch {
        return false;
    }
}
async function resolveAccountantClient(accountantUserId, clientUsername) {
    const context = await (0, accountant_assignments_1.getAccountantContext)(accountantUserId);
    const client = await database_prod_1.default.get(`SELECT u.id, u.username, u.first_name, u.last_name, u.class, u.school_id, j.name AS job_name
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.username = $1 AND u.role = 'student'`, [clientUsername]);
    if (!client) {
        throw new Error('CLIENT_NOT_FOUND');
    }
    if (!(0, accountant_assignments_1.isManagedClient)(context, client.id)) {
        throw new Error('NOT_YOUR_CLIENT');
    }
    const accountantSchool = context.accountant.school_id ?? null;
    const clientSchool = client.school_id ?? null;
    if (accountantSchool !== null && clientSchool !== accountantSchool) {
        throw new Error('NOT_YOUR_CLIENT');
    }
    if (context.accountant.class && client.class && context.accountant.class !== client.class) {
        throw new Error('NOT_YOUR_CLIENT');
    }
    return { accountant: context.accountant, client };
}
async function countRewardedAdviceToday(accountantUserId) {
    const row = await database_prod_1.default.get(`SELECT COUNT(*)::int AS count
     FROM transactions t
     JOIN accounts a ON t.to_account_id = a.id
     WHERE a.user_id = $1
       AND t.transaction_type = 'deposit'
       AND t.description = 'ACCOUNTANT_CLIENT_ADVICE_EARN'
       AND t.created_at >= (${GAME_DAY_START_SQL})`, [accountantUserId]);
    return typeof row?.count === 'number' ? row.count : parseInt(String(row?.count ?? '0'), 10) || 0;
}
async function countAdviceSubmissionsForClientToday(accountantUserId, clientUserId) {
    const row = await database_prod_1.default.get(`SELECT COUNT(*)::int AS count
     FROM accountant_client_advice
     WHERE accountant_user_id = $1
       AND client_user_id = $2
       AND created_at >= (${GAME_DAY_START_SQL})`, [accountantUserId, clientUserId]);
    return typeof row?.count === 'number' ? row.count : parseInt(String(row?.count ?? '0'), 10) || 0;
}
function resolveAdviceRewardAmounts(input) {
    if (input.clientUserId <= 0) {
        return {
            experience_points: 0,
            earnings: 0,
            reward_skipped_reason: 'Invalid client for advice reward',
        };
    }
    return {
        experience_points: exports.ADVICE_XP_REWARD,
        earnings: exports.ADVICE_EARNINGS_REWARD,
        reward_skipped_reason: null,
    };
}
async function payAdviceReward(userId, username, townClass, schoolId, input) {
    let { experience_points, earnings, reward_skipped_reason } = resolveAdviceRewardAmounts(input);
    if (!reward_skipped_reason) {
        const submissionsForClientToday = await countAdviceSubmissionsForClientToday(userId, input.clientUserId);
        if (submissionsForClientToday > 1) {
            experience_points = 0;
            earnings = 0;
            reward_skipped_reason = 'You can only earn once per client per day for advice';
        }
    }
    if (!reward_skipped_reason && experience_points > 0) {
        const rewardedToday = await countRewardedAdviceToday(userId);
        if (rewardedToday >= exports.ACCOUNTANT_ADVICE_DAILY_REWARD_LIMIT) {
            experience_points = 0;
            earnings = 0;
            reward_skipped_reason = `Daily advice reward limit reached (${exports.ACCOUNTANT_ADVICE_DAILY_REWARD_LIMIT} per day)`;
        }
    }
    const currentUser = await database_prod_1.default.get('SELECT job_level, job_experience_points FROM users WHERE id = $1', [userId]);
    const currentLevel = currentUser?.job_level || 1;
    const currentXP = currentUser?.job_experience_points || 0;
    let newLevel = currentLevel;
    if (experience_points > 0) {
        const newXP = currentXP + experience_points;
        newLevel = currentLevel;
        for (let level = currentLevel; level < 10; level++) {
            if (newXP >= (0, jobs_1.getXPForLevel)(level + 1))
                newLevel = level + 1;
            else
                break;
        }
        await database_prod_1.default.query('UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3', [newXP, newLevel, userId]);
    }
    if (earnings <= 0) {
        return {
            experience_points,
            earnings: 0,
            new_level: experience_points > 0 && newLevel > currentLevel ? newLevel : null,
            reward_skipped_reason,
        };
    }
    const account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [userId]);
    if (!account) {
        return {
            experience_points,
            earnings: 0,
            new_level: experience_points > 0 && newLevel > currentLevel ? newLevel : null,
            reward_skipped_reason: reward_skipped_reason ?? 'Account not found for reward payout',
        };
    }
    const townSettings = schoolId != null
        ? await database_prod_1.default.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id = $2', [townClass, schoolId])
        : await database_prod_1.default.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id IS NULL', [townClass]);
    const treasuryBalance = parseFloat(townSettings?.treasury_balance || '0');
    if (treasuryBalance < earnings) {
        throw new Error('TREASURY_INSUFFICIENT');
    }
    if (schoolId != null) {
        await database_prod_1.default.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3', [earnings, townClass, schoolId]);
    }
    else {
        await database_prod_1.default.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL', [earnings, townClass]);
    }
    await database_prod_1.default.query('INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)', [
        schoolId,
        townClass,
        earnings,
        'withdrawal',
        `Accountant client advice payout to ${username}`,
        userId,
    ]);
    await database_prod_1.default.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [earnings, account.id]);
    await database_prod_1.default.query(`INSERT INTO transactions (to_account_id, amount, transaction_type, description)
     VALUES ($1, $2, 'deposit', $3)`, [account.id, earnings, 'ACCOUNTANT_CLIENT_ADVICE_EARN']);
    return {
        experience_points,
        earnings,
        new_level: newLevel > currentLevel ? newLevel : null,
        reward_skipped_reason,
    };
}
//# sourceMappingURL=accountant-advice.js.map