import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { getXPForLevel } from './jobs';
import {
  ABSENT_NO_SICK_NOTE_PAY_FACTOR,
  ATTENDANCE_REGISTER_XP,
  AttendanceEntryStatus,
  SICK_NOTE_APPROVE_XP,
  getTodayRegisterId,
  resolveRegisterSubmitterRole,
  resolveSickNoteReviewer,
  reviewerRoleLabel,
  userCanReviewSickNotes,
  userCanSubmitRegister,
} from '../domain/attendance';

const router = Router();

function displayName(row: {
  username: string;
  first_name?: string | null;
  last_name?: string | null;
}): string {
  const full = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
  return full || row.username;
}

async function awardXp(userId: number, xp: number): Promise<{ new_level: number | null }> {
  const currentUser = await database.get(
    'SELECT job_level, job_experience_points FROM users WHERE id = $1',
    [userId]
  );
  const currentLevel = currentUser?.job_level || 1;
  const currentXP = currentUser?.job_experience_points || 0;
  const newXP = currentXP + xp;
  let newLevel = currentLevel;
  for (let level = currentLevel; level < 10; level++) {
    if (newXP >= getXPForLevel(level + 1)) newLevel = level + 1;
    else break;
  }
  await database.query(
    'UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3',
    [newXP, newLevel, userId]
  );
  return { new_level: newLevel > currentLevel ? newLevel : null };
}

async function tablesReady(): Promise<boolean> {
  try {
    await database.query('SELECT 1 FROM attendance_registers LIMIT 1');
    return true;
  } catch {
    return false;
  }
}

async function fetchTownStudents(schoolId: number | null, townClass: string) {
  return database.query(
    `SELECT u.id, u.username, u.first_name, u.last_name
     FROM users u
     WHERE u.role = 'student' AND u.status = 'approved'
       AND u.class = $1 AND u.school_id IS NOT DISTINCT FROM $2
     ORDER BY u.username ASC`,
    [townClass, schoolId]
  );
}

router.get('/register-status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can access attendance register' });
    }
    if (!req.user.class) {
      return res.status(400).json({ error: 'You must belong to a town class' });
    }

    if (!(await tablesReady())) {
      return res.json({
        can_submit: false,
        submitter_role: null,
        already_submitted_today: false,
        submit_xp: ATTENDANCE_REGISTER_XP,
        pay_penalty_factor: ABSENT_NO_SICK_NOTE_PAY_FACTOR,
        students: [],
        reason: 'Attendance register is not available yet.',
      });
    }

    const schoolId = req.user.school_id ?? null;
    const townClass = req.user.class;
    const submitterRole = await resolveRegisterSubmitterRole(schoolId, townClass);

    const user = await database.get(
      `SELECT u.*, j.name AS job_name FROM users u
       LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`,
      [req.user.id]
    );

    const students = await fetchTownStudents(schoolId, townClass);
    const todayRegisterId = await getTodayRegisterId(schoolId, townClass);
    const canSubmit =
      submitterRole !== null && userCanSubmitRegister(user?.job_name, submitterRole);

    let todayEntries: { student_user_id: number; status: AttendanceEntryStatus }[] = [];
    if (todayRegisterId) {
      todayEntries = await database.query(
        `SELECT student_user_id, status FROM attendance_register_entries WHERE register_id = $1`,
        [todayRegisterId]
      );
    }

    res.json({
      can_submit: canSubmit && !todayRegisterId,
      submitter_role: submitterRole,
      already_submitted_today: !!todayRegisterId,
      submit_xp: ATTENDANCE_REGISTER_XP,
      pay_penalty_factor: ABSENT_NO_SICK_NOTE_PAY_FACTOR,
      students: students.map((s: Record<string, unknown>) => ({
        id: s.id,
        username: s.username,
        display_name: displayName(s as { username: string; first_name?: string; last_name?: string }),
      })),
      today_entries: todayEntries,
      reason: !submitterRole
        ? 'Your town needs a Nurse or Doctor to take daily register.'
        : !canSubmit
          ? submitterRole === 'nurse'
            ? 'Only the town Nurse can submit register while a Nurse is employed.'
            : 'Only the town Doctor can submit register (no Nurse in town).'
          : todayRegisterId
            ? 'Register already submitted for today.'
            : null,
    });
  } catch (error) {
    console.error('Attendance register-status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post(
  '/submit-register',
  authenticateToken,
  [body('entries').isArray({ min: 1 }).withMessage('Entries are required')],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || req.user.role !== 'student') {
        return res.status(403).json({ error: 'Only students can submit attendance register' });
      }
      if (!req.user.class) {
        return res.status(400).json({ error: 'You must belong to a town class' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!(await tablesReady())) {
        return res.status(503).json({ error: 'Attendance register is not available yet.' });
      }

      const schoolId = req.user.school_id ?? null;
      const townClass = req.user.class;
      const submitterRole = await resolveRegisterSubmitterRole(schoolId, townClass);

      if (!submitterRole) {
        return res.status(400).json({ error: 'Your town has no Nurse or Doctor to take register.' });
      }

      const user = await database.get(
        `SELECT u.*, j.name AS job_name FROM users u
         LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`,
        [req.user.id]
      );

      if (!userCanSubmitRegister(user?.job_name, submitterRole)) {
        return res.status(403).json({
          error:
            submitterRole === 'nurse'
              ? 'Only the town Nurse can submit the daily register.'
              : 'Only the town Doctor can submit the daily register when no Nurse is employed.',
        });
      }

      if (await getTodayRegisterId(schoolId, townClass)) {
        return res.status(400).json({ error: 'Register has already been submitted for today.' });
      }

      const students = await fetchTownStudents(schoolId, townClass);
      const studentIds = new Set(students.map((s: { id: number }) => s.id));
      const entries = req.body.entries as { student_user_id: number; status: string }[];

      if (entries.length !== studentIds.size) {
        return res.status(400).json({ error: 'You must mark every student in your town as present or absent.' });
      }

      const seen = new Set<number>();
      for (const entry of entries) {
        const sid = Number(entry.student_user_id);
        if (!studentIds.has(sid)) {
          return res.status(400).json({ error: 'Invalid student in register entries.' });
        }
        if (seen.has(sid)) {
          return res.status(400).json({ error: 'Duplicate student in register entries.' });
        }
        seen.add(sid);
        if (entry.status !== 'present' && entry.status !== 'absent') {
          return res.status(400).json({ error: 'Each entry must be present or absent.' });
        }
      }

      const reviewer = await resolveSickNoteReviewer(schoolId, townClass);
      const client = await database.pool.connect();

      try {
        await client.query('BEGIN');

        const regResult = await client.query(
          `INSERT INTO attendance_registers (school_id, town_class, submitted_by_user_id)
           VALUES ($1, $2, $3) RETURNING id, submitted_at`,
          [schoolId, townClass, req.user.id]
        );
        const registerId = regResult.rows[0].id;

        let absentCount = 0;
        for (const entry of entries) {
          const status = entry.status as AttendanceEntryStatus;
          const entryResult = await client.query(
            `INSERT INTO attendance_register_entries (register_id, student_user_id, status)
             VALUES ($1, $2, $3) RETURNING id`,
            [registerId, entry.student_user_id, status]
          );

          if (status === 'absent') {
            absentCount++;
            await client.query(
              `INSERT INTO sick_notes
                 (register_entry_id, student_user_id, reviewer_user_id, reviewer_role, status)
               VALUES ($1, $2, $3, $4, 'awaiting_submission')`,
              [
                entryResult.rows[0].id,
                entry.student_user_id,
                reviewer?.user_id ?? null,
                reviewer?.role ?? 'none',
              ]
            );
          }
        }

        await client.query('COMMIT');

        const xpResult = await awardXp(req.user.id, ATTENDANCE_REGISTER_XP);

        res.json({
          success: true,
          register_id: registerId,
          absent_count: absentCount,
          experience_points: ATTENDANCE_REGISTER_XP,
          new_level: xpResult.new_level,
          sick_note_reviewer: reviewer
            ? { role: reviewer.role, label: reviewerRoleLabel(reviewer.role) }
            : null,
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Attendance submit-register error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get('/my-sick-note', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can check sick note status' });
    }

    if (!(await tablesReady())) {
      return res.json({ required: false });
    }

    const row = await database.get(
      `SELECT sn.id, sn.status, sn.explanation, sn.submitted_at, sn.reviewer_role,
              r.submitted_at AS register_date
       FROM sick_notes sn
       JOIN attendance_register_entries e ON e.id = sn.register_entry_id
       JOIN attendance_registers r ON r.id = e.register_id
       WHERE sn.student_user_id = $1 AND sn.status = 'awaiting_submission'
       ORDER BY r.submitted_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (!row) {
      return res.json({ required: false });
    }

    res.json({
      required: true,
      sick_note: {
        id: row.id,
        register_date: row.register_date,
        reviewer_role: row.reviewer_role,
        reviewer_label: reviewerRoleLabel(row.reviewer_role),
      },
    });
  } catch (error) {
    console.error('Attendance my-sick-note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post(
  '/submit-sick-note',
  authenticateToken,
  [
    body('sick_note_id').isInt().withMessage('Sick note id is required'),
    body('explanation').trim().isLength({ min: 3, max: 2000 }).withMessage('Explanation is required'),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || req.user.role !== 'student') {
        return res.status(403).json({ error: 'Only students can submit sick notes' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!(await tablesReady())) {
        return res.status(503).json({ error: 'Sick notes are not available yet.' });
      }

      const sickNoteId = Number(req.body.sick_note_id);
      const explanation = String(req.body.explanation).trim();

      const row = await database.get(
        `SELECT * FROM sick_notes WHERE id = $1 AND student_user_id = $2`,
        [sickNoteId, req.user.id]
      );

      if (!row) {
        return res.status(404).json({ error: 'Sick note not found' });
      }
      if (row.status !== 'awaiting_submission') {
        return res.status(400).json({ error: 'This sick note has already been submitted.' });
      }

      await database.query(
        `UPDATE sick_notes
         SET explanation = $1, status = 'pending_review', submitted_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [explanation, sickNoteId]
      );

      res.json({
        success: true,
        status: 'pending_review',
        reviewer_label: reviewerRoleLabel(row.reviewer_role),
      });
    } catch (error) {
      console.error('Attendance submit-sick-note error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get('/sick-note-queue', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can view sick note queue' });
    }

    const user = await database.get(
      `SELECT u.*, j.name AS job_name FROM users u
       LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`,
      [req.user.id]
    );

    if (!userCanReviewSickNotes(user?.job_name)) {
      return res.status(403).json({ error: 'Only HR Director, Financial Manager, or Lawyer can review sick notes' });
    }

    if (!(await tablesReady())) {
      return res.json({ pending: [], approve_xp: SICK_NOTE_APPROVE_XP });
    }

    const pending = await database.query(
      `SELECT sn.id, sn.explanation, sn.submitted_at, sn.reviewer_role,
              u.username AS student_username,
              COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.username) AS student_display_name,
              r.submitted_at AS register_date
       FROM sick_notes sn
       JOIN users u ON u.id = sn.student_user_id
       JOIN attendance_register_entries e ON e.id = sn.register_entry_id
       JOIN attendance_registers r ON r.id = e.register_id
       WHERE sn.status = 'pending_review'
         AND sn.reviewer_user_id = $1
       ORDER BY sn.submitted_at ASC`,
      [req.user.id]
    );

    res.json({
      pending: pending.map((r: Record<string, unknown>) => ({
        id: r.id,
        student_username: r.student_username,
        student_display_name: r.student_display_name,
        explanation: r.explanation,
        submitted_at: r.submitted_at,
        register_date: r.register_date,
      })),
      approve_xp: SICK_NOTE_APPROVE_XP,
    });
  } catch (error) {
    console.error('Attendance sick-note-queue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post(
  '/review-sick-note/:id',
  authenticateToken,
  [body('approved').isBoolean().withMessage('approved must be true or false')],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || req.user.role !== 'student') {
        return res.status(403).json({ error: 'Only students can review sick notes' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await database.get(
        `SELECT u.*, j.name AS job_name FROM users u
         LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`,
        [req.user.id]
      );

      if (!userCanReviewSickNotes(user?.job_name)) {
        return res.status(403).json({ error: 'Only HR Director, Financial Manager, or Lawyer can review sick notes' });
      }

      const sickNoteId = parseInt(String(req.params.id), 10);
      if (!sickNoteId || Number.isNaN(sickNoteId)) {
        return res.status(400).json({ error: 'Invalid sick note id' });
      }

      const row = await database.get(
        `SELECT sn.*,
                u.username AS student_username,
                COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.username) AS student_display_name
         FROM sick_notes sn
         JOIN users u ON u.id = sn.student_user_id
         WHERE sn.id = $1`,
        [sickNoteId]
      );

      if (!row) {
        return res.status(404).json({ error: 'Sick note not found' });
      }
      if (row.reviewer_user_id !== req.user.id) {
        return res.status(403).json({ error: 'This sick note is not assigned to you for review' });
      }
      if (row.status !== 'pending_review') {
        return res.status(400).json({ error: 'This sick note is not awaiting review' });
      }

      const approved = !!req.body.approved;
      const newStatus = approved ? 'approved' : 'denied';

      await database.query(
        `UPDATE sick_notes
         SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by_user_id = $2
         WHERE id = $3`,
        [newStatus, req.user.id, sickNoteId]
      );

      let xpResult: { new_level: number | null } = { new_level: null };
      let xpAwarded = 0;
      if (approved) {
        xpAwarded = SICK_NOTE_APPROVE_XP;
        xpResult = await awardXp(req.user.id, SICK_NOTE_APPROVE_XP);
      }

      res.json({
        success: true,
        approved,
        student_display_name: row.student_display_name,
        experience_points: xpAwarded,
        new_level: xpResult.new_level,
      });
    } catch (error) {
      console.error('Attendance review-sick-note error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
