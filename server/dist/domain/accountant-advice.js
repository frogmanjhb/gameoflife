"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_ADVICE_LENGTH = exports.MIN_ADVICE_LENGTH = exports.ADVICE_EARNINGS_REWARD = exports.ADVICE_XP_REWARD = void 0;
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
    if ((0, accountant_assignments_1.hasAccountantJob)(client.job_name)) {
        throw new Error('CLIENT_IS_ACCOUNTANT');
    }
    if (!context.responsibleStudentIds.includes(client.id)) {
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
async function payAdviceReward(userId, username, townClass, schoolId) {
    const currentUser = await database_prod_1.default.get('SELECT job_level, job_experience_points FROM users WHERE id = $1', [userId]);
    const currentLevel = currentUser?.job_level || 1;
    const currentXP = currentUser?.job_experience_points || 0;
    const newXP = currentXP + exports.ADVICE_XP_REWARD;
    let newLevel = currentLevel;
    for (let level = currentLevel; level < 10; level++) {
        if (newXP >= (0, jobs_1.getXPForLevel)(level + 1))
            newLevel = level + 1;
        else
            break;
    }
    await database_prod_1.default.query('UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3', [newXP, newLevel, userId]);
    const account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [userId]);
    if (account && exports.ADVICE_EARNINGS_REWARD > 0) {
        const townSettings = schoolId != null
            ? await database_prod_1.default.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id = $2', [townClass, schoolId])
            : await database_prod_1.default.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id IS NULL', [townClass]);
        const treasuryBalance = parseFloat(townSettings?.treasury_balance || '0');
        if (treasuryBalance < exports.ADVICE_EARNINGS_REWARD) {
            throw new Error('TREASURY_INSUFFICIENT');
        }
        if (schoolId != null) {
            await database_prod_1.default.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3', [exports.ADVICE_EARNINGS_REWARD, townClass, schoolId]);
        }
        else {
            await database_prod_1.default.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL', [exports.ADVICE_EARNINGS_REWARD, townClass]);
        }
        await database_prod_1.default.query('INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)', [
            schoolId,
            townClass,
            exports.ADVICE_EARNINGS_REWARD,
            'withdrawal',
            `Accountant client advice payout to ${username}`,
            userId,
        ]);
        await database_prod_1.default.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [exports.ADVICE_EARNINGS_REWARD, account.id]);
        await database_prod_1.default.query(`INSERT INTO transactions (to_account_id, amount, transaction_type, description)
       VALUES ($1, $2, 'deposit', $3)`, [account.id, exports.ADVICE_EARNINGS_REWARD, 'ACCOUNTANT_CLIENT_ADVICE_EARN']);
    }
    return {
        experience_points: exports.ADVICE_XP_REWARD,
        earnings: exports.ADVICE_EARNINGS_REWARD,
        new_level: newLevel > currentLevel ? newLevel : null,
    };
}
//# sourceMappingURL=accountant-advice.js.map