import database from '../database/database-prod';

export const LAWYER_TARGET_CLIENTS = 10;
export const LAWYER_CLIENT_OVERLAP = 2;

export function hasLawyerJob(jobName: string | null | undefined): boolean {
  const n = (jobName || '').toLowerCase();
  return n.includes('lawyer');
}

export interface LawyerContext {
  lawyer: { id: number; class: string | null; school_id: number | null; job_name: string | null };
  clientStudentIds: number[];
}

async function tableExists(): Promise<boolean> {
  try {
    await database.query('SELECT 1 FROM lawyer_student_assignments LIMIT 1');
    return true;
  } catch {
    return false;
  }
}

export async function classUsesManualLawyerAssignments(
  schoolId: number | null,
  townClass: string
): Promise<boolean> {
  if (!(await tableExists())) return false;
  const row = await database.get(
    `SELECT COUNT(*)::int AS count FROM lawyer_student_assignments
     WHERE town_class = $1 AND school_id IS NOT DISTINCT FROM $2`,
    [townClass, schoolId]
  );
  return (row?.count ?? 0) > 0;
}

function computeAutoClientIds(
  lawyerId: number,
  lawyerIds: number[],
  studentIds: number[]
): number[] {
  if (!lawyerIds.length || !studentIds.length) return [];
  if (lawyerIds.length === 1) return studentIds;

  const sortedLawyerIds = lawyerIds.slice().sort((a, b) => a - b);
  const index = sortedLawyerIds.indexOf(lawyerId);
  if (index === -1) return [];

  const n = studentIds.length;
  const perLawyer = Math.max(1, Math.ceil(n / lawyerIds.length));
  const start = Math.max(0, index * perLawyer - LAWYER_CLIENT_OVERLAP);
  const end = Math.min(n, (index + 1) * perLawyer + LAWYER_CLIENT_OVERLAP);
  return studentIds.slice(start, end);
}

export async function getClassLawyerRoster(
  className: string,
  schoolId: number | null
): Promise<{
  lawyerIds: number[];
  nonLawyerStudentIds: number[];
}> {
  const students = await database.query(
    `SELECT u.id, j.name as job_name
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.role = 'student'
       AND u.class = $1
       AND ${schoolId !== null ? 'u.school_id = $2' : 'u.school_id IS NULL'}
     ORDER BY u.id`,
    schoolId !== null ? [className, schoolId] : [className]
  );
  const lawyerIds: number[] = [];
  const nonLawyerStudentIds: number[] = [];
  for (const s of students) {
    if (hasLawyerJob(s.job_name)) {
      lawyerIds.push(s.id);
    } else {
      nonLawyerStudentIds.push(s.id);
    }
  }
  return { lawyerIds, nonLawyerStudentIds };
}

export async function seedManualAssignmentsFromAutoSplit(
  className: string,
  schoolId: number | null
): Promise<void> {
  const { lawyerIds, nonLawyerStudentIds } = await getClassLawyerRoster(className, schoolId);
  for (const lawyerId of lawyerIds) {
    const clientIds = computeAutoClientIds(lawyerId, lawyerIds, nonLawyerStudentIds);
    for (const studentId of clientIds) {
      await database.run(
        `INSERT INTO lawyer_student_assignments (lawyer_user_id, student_user_id, school_id, town_class)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (lawyer_user_id, student_user_id) DO NOTHING`,
        [lawyerId, studentId, schoolId, className]
      );
    }
  }
}

export async function getLawyerClientIds(lawyerUserId: number): Promise<number[]> {
  const lawyer = await database.get(
    `SELECT u.id, u.class, u.school_id, j.name as job_name
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.id = $1 AND u.role = 'student'`,
    [lawyerUserId]
  );
  if (!lawyer || !hasLawyerJob(lawyer.job_name) || !lawyer.class) {
    return [];
  }
  const className = lawyer.class;
  const schoolId: number | null = lawyer.school_id ?? null;
  const { lawyerIds, nonLawyerStudentIds } = await getClassLawyerRoster(className, schoolId);

  const useManual = await classUsesManualLawyerAssignments(schoolId, className);
  if (useManual) {
    const rows = await database.query(
      `SELECT student_user_id FROM lawyer_student_assignments
       WHERE lawyer_user_id = $1 AND town_class = $2 AND school_id IS NOT DISTINCT FROM $3`,
      [lawyerUserId, className, schoolId]
    );
    return rows.map((r: { student_user_id: number }) => r.student_user_id);
  }
  return computeAutoClientIds(lawyerUserId, lawyerIds, nonLawyerStudentIds);
}

export async function getLawyerIdsForStudent(
  studentUserId: number,
  townClass: string,
  schoolId: number | null
): Promise<number[]> {
  const useManual = await classUsesManualLawyerAssignments(schoolId, townClass);
  if (useManual) {
    const rows = await database.query(
      `SELECT lawyer_user_id FROM lawyer_student_assignments
       WHERE student_user_id = $1 AND town_class = $2 AND school_id IS NOT DISTINCT FROM $3`,
      [studentUserId, townClass, schoolId]
    );
    return rows.map((r: { lawyer_user_id: number }) => r.lawyer_user_id);
  }
  const { lawyerIds, nonLawyerStudentIds } = await getClassLawyerRoster(townClass, schoolId);
  if (!nonLawyerStudentIds.includes(studentUserId)) {
    return [];
  }
  return lawyerIds.filter((lid) =>
    computeAutoClientIds(lid, lawyerIds, nonLawyerStudentIds).includes(studentUserId)
  );
}

export async function getManualClientRows(
  lawyerUserId: number,
  className: string,
  schoolId: number | null
) {
  return database.query(
    `SELECT u.id, u.username, u.first_name, u.last_name, u.class
     FROM lawyer_student_assignments a
     JOIN users u ON u.id = a.student_user_id
     WHERE a.lawyer_user_id = $1 AND a.town_class = $2 AND a.school_id IS NOT DISTINCT FROM $3
     ORDER BY u.last_name NULLS LAST, u.first_name NULLS LAST, u.username`,
    [lawyerUserId, className, schoolId]
  );
}
