"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LAWYER_CLIENT_OVERLAP = exports.LAWYER_TARGET_CLIENTS = void 0;
exports.hasLawyerJob = hasLawyerJob;
exports.classUsesManualLawyerAssignments = classUsesManualLawyerAssignments;
exports.getClassLawyerRoster = getClassLawyerRoster;
exports.seedManualAssignmentsFromAutoSplit = seedManualAssignmentsFromAutoSplit;
exports.getLawyerClientIds = getLawyerClientIds;
exports.getLawyerIdsForStudent = getLawyerIdsForStudent;
exports.getManualClientRows = getManualClientRows;
const database_prod_1 = __importDefault(require("../database/database-prod"));
exports.LAWYER_TARGET_CLIENTS = 10;
exports.LAWYER_CLIENT_OVERLAP = 2;
function hasLawyerJob(jobName) {
    const n = (jobName || '').toLowerCase();
    return n.includes('lawyer');
}
async function tableExists() {
    try {
        await database_prod_1.default.query('SELECT 1 FROM lawyer_student_assignments LIMIT 1');
        return true;
    }
    catch {
        return false;
    }
}
async function classUsesManualLawyerAssignments(schoolId, townClass) {
    if (!(await tableExists()))
        return false;
    const row = await database_prod_1.default.get(`SELECT COUNT(*)::int AS count FROM lawyer_student_assignments
     WHERE town_class = $1 AND school_id IS NOT DISTINCT FROM $2`, [townClass, schoolId]);
    return (row?.count ?? 0) > 0;
}
function computeAutoClientIds(lawyerId, lawyerIds, studentIds) {
    if (!lawyerIds.length || !studentIds.length)
        return [];
    if (lawyerIds.length === 1)
        return studentIds;
    const sortedLawyerIds = lawyerIds.slice().sort((a, b) => a - b);
    const index = sortedLawyerIds.indexOf(lawyerId);
    if (index === -1)
        return [];
    const n = studentIds.length;
    const perLawyer = Math.max(1, Math.ceil(n / lawyerIds.length));
    const start = Math.max(0, index * perLawyer - exports.LAWYER_CLIENT_OVERLAP);
    const end = Math.min(n, (index + 1) * perLawyer + exports.LAWYER_CLIENT_OVERLAP);
    return studentIds.slice(start, end);
}
async function getClassLawyerRoster(className, schoolId) {
    const students = await database_prod_1.default.query(`SELECT u.id, j.name as job_name
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.role = 'student'
       AND u.class = $1
       AND ${schoolId !== null ? 'u.school_id = $2' : 'u.school_id IS NULL'}
     ORDER BY u.id`, schoolId !== null ? [className, schoolId] : [className]);
    const lawyerIds = [];
    const nonLawyerStudentIds = [];
    for (const s of students) {
        if (hasLawyerJob(s.job_name)) {
            lawyerIds.push(s.id);
        }
        else {
            nonLawyerStudentIds.push(s.id);
        }
    }
    return { lawyerIds, nonLawyerStudentIds };
}
async function seedManualAssignmentsFromAutoSplit(className, schoolId) {
    const { lawyerIds, nonLawyerStudentIds } = await getClassLawyerRoster(className, schoolId);
    for (const lawyerId of lawyerIds) {
        const clientIds = computeAutoClientIds(lawyerId, lawyerIds, nonLawyerStudentIds);
        for (const studentId of clientIds) {
            await database_prod_1.default.run(`INSERT INTO lawyer_student_assignments (lawyer_user_id, student_user_id, school_id, town_class)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (lawyer_user_id, student_user_id) DO NOTHING`, [lawyerId, studentId, schoolId, className]);
        }
    }
}
async function getLawyerClientIds(lawyerUserId) {
    const lawyer = await database_prod_1.default.get(`SELECT u.id, u.class, u.school_id, j.name as job_name
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.id = $1 AND u.role = 'student'`, [lawyerUserId]);
    if (!lawyer || !hasLawyerJob(lawyer.job_name) || !lawyer.class) {
        return [];
    }
    const className = lawyer.class;
    const schoolId = lawyer.school_id ?? null;
    const { lawyerIds, nonLawyerStudentIds } = await getClassLawyerRoster(className, schoolId);
    const useManual = await classUsesManualLawyerAssignments(schoolId, className);
    if (useManual) {
        const rows = await database_prod_1.default.query(`SELECT student_user_id FROM lawyer_student_assignments
       WHERE lawyer_user_id = $1 AND town_class = $2 AND school_id IS NOT DISTINCT FROM $3`, [lawyerUserId, className, schoolId]);
        return rows.map((r) => r.student_user_id);
    }
    return computeAutoClientIds(lawyerUserId, lawyerIds, nonLawyerStudentIds);
}
async function getLawyerIdsForStudent(studentUserId, townClass, schoolId) {
    const useManual = await classUsesManualLawyerAssignments(schoolId, townClass);
    if (useManual) {
        const rows = await database_prod_1.default.query(`SELECT lawyer_user_id FROM lawyer_student_assignments
       WHERE student_user_id = $1 AND town_class = $2 AND school_id IS NOT DISTINCT FROM $3`, [studentUserId, townClass, schoolId]);
        return rows.map((r) => r.lawyer_user_id);
    }
    const { lawyerIds, nonLawyerStudentIds } = await getClassLawyerRoster(townClass, schoolId);
    if (!nonLawyerStudentIds.includes(studentUserId)) {
        return [];
    }
    return lawyerIds.filter((lid) => computeAutoClientIds(lid, lawyerIds, nonLawyerStudentIds).includes(studentUserId));
}
async function getManualClientRows(lawyerUserId, className, schoolId) {
    return database_prod_1.default.query(`SELECT u.id, u.username, u.first_name, u.last_name, u.class
     FROM lawyer_student_assignments a
     JOIN users u ON u.id = a.student_user_id
     WHERE a.lawyer_user_id = $1 AND a.town_class = $2 AND a.school_id IS NOT DISTINCT FROM $3
     ORDER BY u.last_name NULLS LAST, u.first_name NULLS LAST, u.username`, [lawyerUserId, className, schoolId]);
}
//# sourceMappingURL=lawyer-assignments.js.map