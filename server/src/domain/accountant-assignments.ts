import database from '../database/database-prod';

export function hasAccountantJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().includes('accountant');
}

export interface AccountantContext {
  accountant: { id: number; class: string | null; school_id: number | null; job_name: string | null };
  responsibleStudentIds: number[];
  supervisedAccountantId: number | null;
}

/** Students and accountant peers this accountant may manage (advice, salary, transfer approvals). */
export function getManagedClientUserIds(context: AccountantContext): number[] {
  const ids = [...context.responsibleStudentIds];
  if (
    context.supervisedAccountantId != null &&
    !ids.includes(context.supervisedAccountantId)
  ) {
    ids.push(context.supervisedAccountantId);
  }
  return ids;
}

export function isManagedClient(context: AccountantContext, clientUserId: number): boolean {
  return getManagedClientUserIds(context).includes(clientUserId);
}

async function tableExists(): Promise<boolean> {
  try {
    await database.query('SELECT 1 FROM accountant_student_assignments LIMIT 1');
    return true;
  } catch {
    return false;
  }
}

export async function classUsesManualAccountantAssignments(
  schoolId: number | null,
  townClass: string
): Promise<boolean> {
  if (!(await tableExists())) return false;
  const row = await database.get(
    `SELECT COUNT(*)::int AS count FROM accountant_student_assignments
     WHERE town_class = $1 AND school_id IS NOT DISTINCT FROM $2`,
    [townClass, schoolId]
  );
  return (row?.count ?? 0) > 0;
}

function computeAutoSplit(
  accountantId: number,
  accountantIds: number[],
  nonAccountantStudentIds: number[]
): { responsibleStudentIds: number[]; supervisedAccountantId: number | null } {
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
  const supervisedAccountantId =
    sortedAccountantIds.length > 1
      ? sortedAccountantIds[(index + 1) % sortedAccountantIds.length]
      : null;
  return { responsibleStudentIds, supervisedAccountantId };
}

export async function getClassAccountantRoster(
  className: string,
  schoolId: number | null
): Promise<{
  accountantIds: number[];
  nonAccountantStudentIds: number[];
  students: { id: number; job_name: string | null }[];
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
  const accountantIds: number[] = [];
  const nonAccountantStudentIds: number[] = [];
  for (const s of students) {
    if (hasAccountantJob(s.job_name)) {
      accountantIds.push(s.id);
    } else {
      nonAccountantStudentIds.push(s.id);
    }
  }
  return { accountantIds, nonAccountantStudentIds, students };
}

export async function seedManualAssignmentsFromAutoSplit(
  className: string,
  schoolId: number | null
): Promise<void> {
  const { accountantIds, nonAccountantStudentIds } = await getClassAccountantRoster(className, schoolId);
  for (const accountantId of accountantIds) {
    const { responsibleStudentIds } = computeAutoSplit(
      accountantId,
      accountantIds,
      nonAccountantStudentIds
    );
    for (const studentId of responsibleStudentIds) {
      await database.run(
        `INSERT INTO accountant_student_assignments (accountant_user_id, student_user_id, school_id, town_class)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (accountant_user_id, student_user_id) DO NOTHING`,
        [accountantId, studentId, schoolId, className]
      );
    }
  }
}

export async function getAccountantContext(userId: number): Promise<AccountantContext> {
  const accountant = await database.get(
    `SELECT u.id, u.class, u.school_id, j.name as job_name
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.id = $1 AND u.role = 'student'`,
    [userId]
  );

  if (!accountant || !hasAccountantJob(accountant.job_name)) {
    throw new Error('NOT_ACCOUNTANT');
  }

  const className: string | null = accountant.class || null;
  const schoolId: number | null = accountant.school_id ?? null;

  if (!className) {
    return { accountant, responsibleStudentIds: [], supervisedAccountantId: null };
  }

  const { accountantIds, nonAccountantStudentIds } = await getClassAccountantRoster(className, schoolId);
  const auto = computeAutoSplit(accountant.id, accountantIds, nonAccountantStudentIds);

  const useManual = await classUsesManualAccountantAssignments(schoolId, className);
  if (useManual) {
    const rows = await database.query(
      `SELECT student_user_id FROM accountant_student_assignments
       WHERE accountant_user_id = $1 AND town_class = $2 AND school_id IS NOT DISTINCT FROM $3`,
      [accountant.id, className, schoolId]
    );
    const responsibleStudentIds = rows.map((r: { student_user_id: number }) => r.student_user_id);
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

export async function getManualClientRows(
  accountantUserId: number,
  className: string,
  schoolId: number | null
) {
  return database.query(
    `SELECT u.id, u.username, u.first_name, u.last_name, u.class
     FROM accountant_student_assignments a
     JOIN users u ON u.id = a.student_user_id
     WHERE a.accountant_user_id = $1 AND a.town_class = $2 AND a.school_id IS NOT DISTINCT FROM $3
     ORDER BY u.last_name NULLS LAST, u.first_name NULLS LAST, u.username`,
    [accountantUserId, className, schoolId]
  );
}
