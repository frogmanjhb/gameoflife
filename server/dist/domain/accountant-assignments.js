"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasAccountantJob = hasAccountantJob;
exports.classUsesManualAccountantAssignments = classUsesManualAccountantAssignments;
exports.getClassAccountantRoster = getClassAccountantRoster;
exports.seedManualAssignmentsFromAutoSplit = seedManualAssignmentsFromAutoSplit;
exports.getAccountantContext = getAccountantContext;
exports.getManualClientRows = getManualClientRows;
const database_prod_1 = __importDefault(require("../database/database-prod"));
function hasAccountantJob(jobName) {
    return (jobName || '').toLowerCase().includes('accountant');
}
async function tableExists() {
    try {
        await database_prod_1.default.query('SELECT 1 FROM accountant_student_assignments LIMIT 1');
        return true;
    }
    catch {
        return false;
    }
}
async function classUsesManualAccountantAssignments(schoolId, townClass) {
    if (!(await tableExists()))
        return false;
    const row = await database_prod_1.default.get(`SELECT COUNT(*)::int AS count FROM accountant_student_assignments
     WHERE town_class = $1 AND school_id IS NOT DISTINCT FROM $2`, [townClass, schoolId]);
    return (row?.count ?? 0) > 0;
}
function computeAutoSplit(accountantId, accountantIds, nonAccountantStudentIds) {
    const totalAccountants = accountantIds.length || 1;
    if (totalAccountants === 1) {
        return { responsibleStudentIds: nonAccountantStudentIds, supervisedAccountantId: null };
    }
    const sortedAccountantIds = accountantIds.slice().sort((a, b) => a - b);
    const index = sortedAccountantIds.indexOf(accountantId);
    if (index === -1) {
        return { responsibleStudentIds: [], supervisedAccountantId: null };
    }
    const chunkSize = Math.ceil(nonAccountantStudentIds.length / totalAccountants);
    const start = index * chunkSize;
    const end = start + chunkSize;
    const responsibleStudentIds = nonAccountantStudentIds.slice(start, end);
    const supervisedAccountantId = sortedAccountantIds.length > 1
        ? sortedAccountantIds[(index + 1) % sortedAccountantIds.length]
        : null;
    return { responsibleStudentIds, supervisedAccountantId };
}
async function getClassAccountantRoster(className, schoolId) {
    const students = await database_prod_1.default.query(`SELECT u.id, j.name as job_name
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.role = 'student'
       AND u.class = $1
       AND ${schoolId !== null ? 'u.school_id = $2' : 'u.school_id IS NULL'}
     ORDER BY u.id`, schoolId !== null ? [className, schoolId] : [className]);
    const accountantIds = [];
    const nonAccountantStudentIds = [];
    for (const s of students) {
        if (hasAccountantJob(s.job_name)) {
            accountantIds.push(s.id);
        }
        else {
            nonAccountantStudentIds.push(s.id);
        }
    }
    return { accountantIds, nonAccountantStudentIds, students };
}
async function seedManualAssignmentsFromAutoSplit(className, schoolId) {
    const { accountantIds, nonAccountantStudentIds } = await getClassAccountantRoster(className, schoolId);
    for (const accountantId of accountantIds) {
        const { responsibleStudentIds } = computeAutoSplit(accountantId, accountantIds, nonAccountantStudentIds);
        for (const studentId of responsibleStudentIds) {
            await database_prod_1.default.run(`INSERT INTO accountant_student_assignments (accountant_user_id, student_user_id, school_id, town_class)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (accountant_user_id, student_user_id) DO NOTHING`, [accountantId, studentId, schoolId, className]);
        }
    }
}
async function getAccountantContext(userId) {
    const accountant = await database_prod_1.default.get(`SELECT u.id, u.class, u.school_id, j.name as job_name
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.id = $1 AND u.role = 'student'`, [userId]);
    if (!accountant || !hasAccountantJob(accountant.job_name)) {
        throw new Error('NOT_ACCOUNTANT');
    }
    const className = accountant.class || null;
    const schoolId = accountant.school_id ?? null;
    if (!className) {
        return { accountant, responsibleStudentIds: [], supervisedAccountantId: null };
    }
    const { accountantIds, nonAccountantStudentIds } = await getClassAccountantRoster(className, schoolId);
    const auto = computeAutoSplit(accountant.id, accountantIds, nonAccountantStudentIds);
    const useManual = await classUsesManualAccountantAssignments(schoolId, className);
    if (useManual) {
        const rows = await database_prod_1.default.query(`SELECT student_user_id FROM accountant_student_assignments
       WHERE accountant_user_id = $1 AND town_class = $2 AND school_id IS NOT DISTINCT FROM $3`, [accountant.id, className, schoolId]);
        const responsibleStudentIds = rows.map((r) => r.student_user_id);
        return {
            accountant,
            responsibleStudentIds,
            supervisedAccountantId: auto.supervisedAccountantId
        };
    }
    return {
        accountant,
        responsibleStudentIds: auto.responsibleStudentIds,
        supervisedAccountantId: auto.supervisedAccountantId
    };
}
async function getManualClientRows(accountantUserId, className, schoolId) {
    return database_prod_1.default.query(`SELECT u.id, u.username, u.first_name, u.last_name, u.class
     FROM accountant_student_assignments a
     JOIN users u ON u.id = a.student_user_id
     WHERE a.accountant_user_id = $1 AND a.town_class = $2 AND a.school_id IS NOT DISTINCT FROM $3
     ORDER BY u.last_name NULLS LAST, u.first_name NULLS LAST, u.username`, [accountantUserId, className, schoolId]);
}
//# sourceMappingURL=accountant-assignments.js.map