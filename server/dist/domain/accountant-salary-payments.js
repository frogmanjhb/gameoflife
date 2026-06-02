"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SALARY_PAYMENT_EARNINGS_REWARD = exports.SALARY_PAYMENT_XP_REWARD = void 0;
exports.getWeekStartMonday = getWeekStartMonday;
exports.getWeekEndSunday = getWeekEndSunday;
exports.tablesReady = tablesReady;
exports.getAccountantSalaryDashboard = getAccountantSalaryDashboard;
exports.resolveAccountantSalaryClient = resolveAccountantSalaryClient;
exports.payClientWeeklySalary = payClientWeeklySalary;
const database_prod_1 = __importDefault(require("../database/database-prod"));
const jobs_1 = require("../routes/jobs");
const attendance_1 = require("./attendance");
const doctor_reputation_1 = require("./doctor-reputation");
const accountant_assignments_1 = require("./accountant-assignments");
exports.SALARY_PAYMENT_XP_REWARD = 3;
exports.SALARY_PAYMENT_EARNINGS_REWARD = 300;
function getWeekStartMonday(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
}
function getWeekEndSunday(weekStart) {
    const d = new Date(`${weekStart}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + 6);
    return d.toISOString().slice(0, 10);
}
async function calculateProgressiveTax(salary) {
    const bracket = await database_prod_1.default.get(`SELECT tax_rate FROM tax_brackets
     WHERE min_salary <= $1 AND (max_salary IS NULL OR max_salary >= $1)
     ORDER BY min_salary DESC LIMIT 1`, [salary]);
    const taxRate = bracket?.tax_rate || 0;
    const taxAmount = Math.round(((salary * taxRate) / 100) * 100) / 100;
    const netAmount = Math.round((salary - taxAmount) * 100) / 100;
    return { taxRate, taxAmount, netAmount };
}
async function getTownSettings(townClass, schoolId) {
    if (schoolId != null) {
        return database_prod_1.default.get('SELECT * FROM town_settings WHERE class = $1 AND school_id = $2', [
            townClass,
            schoolId,
        ]);
    }
    return database_prod_1.default.get('SELECT * FROM town_settings WHERE class = $1 AND school_id IS NULL', [
        townClass,
    ]);
}
async function tablesReady() {
    try {
        await database_prod_1.default.query('SELECT 1 FROM accountant_salary_payments LIMIT 1');
        return true;
    }
    catch {
        return false;
    }
}
async function getStudentSalaryInfo(studentId) {
    const row = await database_prod_1.default.get(`SELECT u.id,
            a.id AS account_id,
            j.name AS job_name,
            (COALESCE(j.base_salary, 2000.00) *
             (1 + (COALESCE(u.job_level, 1) - 1) * 0.7222) *
             CASE WHEN COALESCE(j.is_contractual, false) THEN 1.5 ELSE 1.0 END) AS gross_salary
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     LEFT JOIN accounts a ON u.id = a.user_id
     WHERE u.id = $1 AND u.role = 'student'`, [studentId]);
    if (!row || !row.job_name)
        return null;
    return {
        account_id: row.account_id ?? null,
        job_name: row.job_name,
        gross_salary: parseFloat(row.gross_salary) || 0,
        absent_without_sick_note: false,
    };
}
async function getAccountantSalaryDashboard(accountantUserId) {
    const context = await (0, accountant_assignments_1.getAccountantContext)(accountantUserId);
    const weekStart = getWeekStartMonday();
    const weekEnd = getWeekEndSunday(weekStart);
    const townClass = context.accountant.class;
    const schoolId = context.accountant.school_id ?? null;
    if (!townClass) {
        return {
            week_start: weekStart,
            week_end: weekEnd,
            payment_xp_reward: exports.SALARY_PAYMENT_XP_REWARD,
            payment_earnings_reward: exports.SALARY_PAYMENT_EARNINGS_REWARD,
            clients: [],
            payment_history: [],
        };
    }
    const town = await getTownSettings(townClass, schoolId);
    const absentIds = await (0, attendance_1.getAbsentWithoutSickNoteStudentIds)(townClass, schoolId, context.responsibleStudentIds);
    const weekPayments = await database_prod_1.default.query(`SELECT p.student_user_id, p.accountant_user_id, acc.username AS accountant_username
     FROM accountant_salary_payments p
     JOIN users acc ON acc.id = p.accountant_user_id
     WHERE p.town_class = $1
       AND p.week_start = $2
       AND p.school_id IS NOT DISTINCT FROM $3`, [townClass, weekStart, schoolId]);
    const paidMap = new Map(weekPayments.map((r) => [
        r.student_user_id,
        r.accountant_username,
    ]));
    const clientIds = [...context.responsibleStudentIds];
    if (context.supervisedAccountantId != null &&
        !clientIds.includes(context.supervisedAccountantId)) {
        clientIds.push(context.supervisedAccountantId);
    }
    const clients = [];
    for (const studentId of clientIds) {
        const student = await database_prod_1.default.get(`SELECT u.id, u.username, u.first_name, u.last_name, u.class, j.name AS job_name
       FROM users u
       LEFT JOIN jobs j ON u.job_id = j.id
       WHERE u.id = $1`, [studentId]);
        if (!student)
            continue;
        const salaryInfo = await getStudentSalaryInfo(studentId);
        const paidThisWeek = paidMap.has(studentId);
        const paidBy = paidMap.get(studentId) ?? null;
        if (!salaryInfo) {
            clients.push({
                id: student.id,
                username: student.username,
                first_name: student.first_name,
                last_name: student.last_name,
                class: student.class,
                job_name: student.job_name,
                gross_salary: null,
                net_salary: null,
                paid_this_week: paidThisWeek,
                paid_by_accountant_username: paidBy,
                can_pay: false,
                ineligible_reason: paidThisWeek
                    ? 'Already paid this week'
                    : 'Student has no job assigned',
            });
            continue;
        }
        let grossSalary = salaryInfo.gross_salary;
        const absentWithoutSickNote = absentIds.has(studentId);
        if (absentWithoutSickNote) {
            grossSalary = grossSalary * attendance_1.ABSENT_NO_SICK_NOTE_PAY_FACTOR;
        }
        let netSalary = grossSalary;
        if (town?.tax_enabled) {
            const taxInfo = await calculateProgressiveTax(grossSalary);
            netSalary = taxInfo.netAmount;
        }
        let ineligibleReason = null;
        if (paidThisWeek) {
            ineligibleReason = 'Already paid this week';
        }
        else if (!salaryInfo.account_id) {
            ineligibleReason = 'Student has no bank account';
        }
        clients.push({
            id: student.id,
            username: student.username,
            first_name: student.first_name,
            last_name: student.last_name,
            class: student.class,
            job_name: salaryInfo.job_name,
            gross_salary: grossSalary,
            net_salary: netSalary,
            paid_this_week: paidThisWeek,
            paid_by_accountant_username: paidBy,
            can_pay: !paidThisWeek && !!salaryInfo.account_id,
            ineligible_reason: ineligibleReason,
        });
    }
    const paymentHistory = await database_prod_1.default.query(`SELECT p.id, p.student_user_id, p.gross_salary, p.tax_amount, p.net_salary, p.job_name,
            p.week_start, p.paid_at,
            s.username AS student_username, s.first_name AS student_first_name, s.last_name AS student_last_name
     FROM accountant_salary_payments p
     JOIN users s ON s.id = p.student_user_id
     WHERE p.accountant_user_id = $1
     ORDER BY p.paid_at DESC
     LIMIT 50`, [accountantUserId]);
    return {
        week_start: weekStart,
        week_end: weekEnd,
        payment_xp_reward: exports.SALARY_PAYMENT_XP_REWARD,
        payment_earnings_reward: exports.SALARY_PAYMENT_EARNINGS_REWARD,
        clients,
        payment_history: paymentHistory.map((row) => ({
            id: row.id,
            student_user_id: row.student_user_id,
            student_username: row.student_username,
            student_first_name: row.student_first_name,
            student_last_name: row.student_last_name,
            gross_salary: parseFloat(String(row.gross_salary)),
            tax_amount: parseFloat(String(row.tax_amount)),
            net_salary: parseFloat(String(row.net_salary)),
            job_name: row.job_name,
            week_start: String(row.week_start).slice(0, 10),
            paid_at: String(row.paid_at),
        })),
    };
}
async function payAccountantReward(client, userId, username, townClass, schoolId) {
    const currentUser = await database_prod_1.default.get('SELECT job_level, job_experience_points FROM users WHERE id = $1', [userId]);
    const currentLevel = currentUser?.job_level || 1;
    const currentXP = currentUser?.job_experience_points || 0;
    const newXP = currentXP + exports.SALARY_PAYMENT_XP_REWARD;
    let newLevel = currentLevel;
    for (let level = currentLevel; level < 10; level++) {
        if (newXP >= (0, jobs_1.getXPForLevel)(level + 1))
            newLevel = level + 1;
        else
            break;
    }
    await client.query('UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3', [
        newXP,
        newLevel,
        userId,
    ]);
    const account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [userId]);
    if (!account || exports.SALARY_PAYMENT_EARNINGS_REWARD <= 0) {
        return {
            experience_points: exports.SALARY_PAYMENT_XP_REWARD,
            earnings: 0,
            new_level: newLevel > currentLevel ? newLevel : null,
        };
    }
    if (schoolId != null) {
        await client.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3', [exports.SALARY_PAYMENT_EARNINGS_REWARD, townClass, schoolId]);
    }
    else {
        await client.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL', [exports.SALARY_PAYMENT_EARNINGS_REWARD, townClass]);
    }
    await client.query('INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)', [
        schoolId,
        townClass,
        exports.SALARY_PAYMENT_EARNINGS_REWARD,
        'withdrawal',
        `Accountant weekly salary payout to ${username}`,
        userId,
    ]);
    await client.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [exports.SALARY_PAYMENT_EARNINGS_REWARD, account.id]);
    await client.query(`INSERT INTO transactions (to_account_id, amount, transaction_type, description)
     VALUES ($1, $2, 'deposit', $3)`, [account.id, exports.SALARY_PAYMENT_EARNINGS_REWARD, 'ACCOUNTANT_SALARY_PAYMENT_EARN']);
    return {
        experience_points: exports.SALARY_PAYMENT_XP_REWARD,
        earnings: exports.SALARY_PAYMENT_EARNINGS_REWARD,
        new_level: newLevel > currentLevel ? newLevel : null,
    };
}
async function resolveAccountantSalaryClient(accountantUserId, clientUsername) {
    const context = await (0, accountant_assignments_1.getAccountantContext)(accountantUserId);
    const client = await database_prod_1.default.get(`SELECT u.id, u.username, u.first_name, u.last_name, u.class, u.school_id, j.name AS job_name
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.username = $1 AND u.role = 'student'`, [clientUsername]);
    if (!client) {
        throw new Error('CLIENT_NOT_FOUND');
    }
    const isAssignedStudent = context.responsibleStudentIds.includes(client.id);
    const isSupervisedAccountant = (0, accountant_assignments_1.hasAccountantJob)(client.job_name) && client.id === context.supervisedAccountantId;
    if (!isAssignedStudent && !isSupervisedAccountant) {
        throw new Error('NOT_YOUR_CLIENT');
    }
    if ((0, accountant_assignments_1.hasAccountantJob)(client.job_name) && !isSupervisedAccountant) {
        throw new Error('CLIENT_IS_ACCOUNTANT');
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
async function payClientWeeklySalary(accountantUserId, clientUsername) {
    if (!(await tablesReady())) {
        throw new Error('TABLES_NOT_READY');
    }
    const { accountant, client } = await resolveAccountantSalaryClient(accountantUserId, clientUsername);
    const townClass = accountant.class || client.class;
    if (!townClass) {
        throw new Error('NO_TOWN_CLASS');
    }
    const schoolId = accountant.school_id ?? client.school_id ?? null;
    const weekStart = getWeekStartMonday();
    const existing = await database_prod_1.default.get(`SELECT id FROM accountant_salary_payments
     WHERE student_user_id = $1 AND town_class = $2 AND week_start = $3
       AND school_id IS NOT DISTINCT FROM $4`, [client.id, townClass, weekStart, schoolId]);
    if (existing) {
        throw new Error('ALREADY_PAID_THIS_WEEK');
    }
    const salaryRow = await database_prod_1.default.get(`SELECT u.id, a.id AS account_id, j.name AS job_name,
            (COALESCE(j.base_salary, 2000.00) *
             (1 + (COALESCE(u.job_level, 1) - 1) * 0.7222) *
             CASE WHEN COALESCE(j.is_contractual, false) THEN 1.5 ELSE 1.0 END) AS gross_salary
     FROM users u
     JOIN jobs j ON u.job_id = j.id
     LEFT JOIN accounts a ON u.id = a.user_id
     WHERE u.id = $1`, [client.id]);
    if (!salaryRow?.account_id) {
        throw new Error('NO_ACCOUNT');
    }
    if (!salaryRow.job_name) {
        throw new Error('NO_JOB');
    }
    const town = await getTownSettings(townClass, schoolId);
    if (!town) {
        throw new Error('TOWN_NOT_FOUND');
    }
    const absentIds = await (0, attendance_1.getAbsentWithoutSickNoteStudentIds)(townClass, schoolId, [client.id]);
    let grossSalary = parseFloat(salaryRow.gross_salary) || 0;
    const absentWithoutSickNote = absentIds.has(client.id);
    if (absentWithoutSickNote) {
        grossSalary = grossSalary * attendance_1.ABSENT_NO_SICK_NOTE_PAY_FACTOR;
    }
    let doctorReputationReduced = false;
    if ((0, attendance_1.hasDoctorJob)(salaryRow.job_name)) {
        const doctorRep = await (0, doctor_reputation_1.syncDoctorReputation)(client.id);
        const reputationSalary = (0, doctor_reputation_1.applyDoctorEarningsMultiplier)(grossSalary, doctorRep.current);
        if (reputationSalary < grossSalary) {
            doctorReputationReduced = true;
            grossSalary = reputationSalary;
        }
    }
    let taxRate = 0;
    let taxAmount = 0;
    let netSalary = grossSalary;
    if (town.tax_enabled) {
        const taxInfo = await calculateProgressiveTax(grossSalary);
        taxRate = taxInfo.taxRate;
        taxAmount = taxInfo.taxAmount;
        netSalary = taxInfo.netAmount;
    }
    const totalTreasuryNeeded = netSalary + exports.SALARY_PAYMENT_EARNINGS_REWARD;
    if (parseFloat(town.treasury_balance) < totalTreasuryNeeded) {
        throw new Error('TREASURY_INSUFFICIENT');
    }
    const accountantUser = await database_prod_1.default.get('SELECT username FROM users WHERE id = $1', [
        accountantUserId,
    ]);
    const clientConn = await database_prod_1.default.pool.connect();
    try {
        await clientConn.query('BEGIN');
        await clientConn.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [netSalary, salaryRow.account_id]);
        const salaryReductions = [];
        if (absentWithoutSickNote)
            salaryReductions.push('absent without sick note');
        if (doctorReputationReduced)
            salaryReductions.push('low doctor reputation');
        const reducedNote = salaryReductions.length > 0 ? `; reduced — ${salaryReductions.join('; ')}` : '';
        const salaryDescription = town.tax_enabled
            ? `Salary for ${salaryRow.job_name} (paid by Chartered Accountant${reducedNote}: R${grossSalary.toFixed(2)} - ${taxRate}% tax = R${netSalary.toFixed(2)})`
            : `Salary for ${salaryRow.job_name} (paid by Chartered Accountant${reducedNote})`;
        await clientConn.query('INSERT INTO transactions (to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)', [salaryRow.account_id, netSalary, 'salary', salaryDescription]);
        if (town.tax_enabled && taxAmount > 0) {
            await clientConn.query(`INSERT INTO tax_transactions
         (user_id, town_class, gross_amount, tax_amount, net_amount, tax_rate_applied, transaction_type, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
                client.id,
                townClass,
                grossSalary,
                taxAmount,
                netSalary,
                taxRate,
                'salary',
                `Tax on salary for ${salaryRow.job_name} (paid by Chartered Accountant)`,
            ]);
        }
        if (schoolId != null) {
            await clientConn.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3', [netSalary, townClass, schoolId]);
        }
        else {
            await clientConn.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL', [netSalary, townClass]);
        }
        await clientConn.query('INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)', [
            schoolId,
            townClass,
            -netSalary,
            'salary_payment',
            `Weekly salary to ${client.username} (Chartered Accountant)`,
            accountantUserId,
        ]);
        if (town.tax_enabled && taxAmount > 0) {
            await clientConn.query('INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)', [
                schoolId,
                townClass,
                taxAmount,
                'tax_collection',
                `Income tax on salary for ${client.username} (Chartered Accountant)`,
                accountantUserId,
            ]);
        }
        await clientConn.query(`INSERT INTO accountant_salary_payments
       (accountant_user_id, student_user_id, school_id, town_class, week_start, gross_salary, tax_amount, net_salary, job_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
            accountantUserId,
            client.id,
            schoolId,
            townClass,
            weekStart,
            grossSalary,
            taxAmount,
            netSalary,
            salaryRow.job_name,
        ]);
        const reward = await payAccountantReward(clientConn, accountantUserId, accountantUser?.username || 'accountant', townClass, schoolId);
        await clientConn.query('COMMIT');
        return {
            gross_salary: grossSalary,
            tax_amount: taxAmount,
            net_salary: netSalary,
            job_name: salaryRow.job_name,
            experience_points: reward.experience_points,
            earnings: reward.earnings,
            new_level: reward.new_level,
            week_start: weekStart,
        };
    }
    catch (error) {
        await clientConn.query('ROLLBACK');
        if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
            throw new Error('ALREADY_PAID_THIS_WEEK');
        }
        throw error;
    }
    finally {
        clientConn.release();
    }
}
//# sourceMappingURL=accountant-salary-payments.js.map