import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import {
  classUsesManualAccountantAssignments,
  getAccountantContext,
  getAccountantIdsForStudent,
  getClassAccountantRoster,
  getManagedClientUserIds,
  getManualClientRows,
  hasAccountantJob,
  seedManualAssignmentsFromAutoSplit,
} from '../domain/accountant-assignments';
import { getDoctorIdsForStudent } from '../domain/doctor-assignments';
import {
  classUsesManualLawyerAssignments,
  getClassLawyerRoster,
  getLawyerClientIds,
  getLawyerIdsForStudent,
  getManualClientRows as getLawyerManualClientRows,
  hasLawyerJob,
  seedManualAssignmentsFromAutoSplit as seedLawyerAssignmentsFromAutoSplit,
} from '../domain/lawyer-assignments';
import { buildStudentEarningsProfile } from '../domain/studentEarningsProfile';
import { studentTownTransactionVisibilitySql } from '../domain/transaction-history-visibility';

const router = Router();

// TEMPORARY: Diagnose student data issues (teachers only, same school)
router.get('/diagnose/:searchTerm', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { searchTerm } = req.params;
    const searchLower = `%${searchTerm.toLowerCase()}%`;
    
    // Search for students by name or username (case-insensitive), same school only
    const students = await database.query(`
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.class,
        u.email,
        u.status,
        u.role,
        u.created_at,
        u.password_hash IS NOT NULL as has_password,
        LENGTH(u.password_hash) as password_hash_length,
        a.id as account_id,
        a.account_number,
        a.balance
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      WHERE (LOWER(u.first_name) LIKE $1 
         OR LOWER(u.last_name) LIKE $1 
         OR LOWER(u.username) LIKE $1)
        AND u.role = 'student'
        AND u.school_id = $2
    `, [searchLower, req.schoolId]);

    // Get additional info for each student found
    const diagnosticInfo = students.map((s: any) => ({
      ...s,
      username_encoded: encodeURIComponent(s.username || ''),
      username_length: s.username ? s.username.length : 0,
      username_chars: s.username ? s.username.split('').map((c: string) => `${c}(${c.charCodeAt(0)})`) : [],
      issues: []
    }));

    // Check for potential issues
    diagnosticInfo.forEach((s: any) => {
      if (!s.username) s.issues.push('Missing username');
      if (!s.has_password) s.issues.push('Missing password hash');
      if (!s.account_id) s.issues.push('Missing bank account');
      if (s.status !== 'approved') s.issues.push(`Status is "${s.status}" (not approved)`);
      if (s.username && s.username !== s.username.trim()) s.issues.push('Username has leading/trailing whitespace');
    });

    res.json({
      searchTerm,
      found: students.length,
      students: diagnosticInfo
    });
  } catch (error) {
    console.error('Diagnose student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get students in the same class as the current student
router.get('/classmates', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can access classmates' });
    }

    if (!req.user.class) {
      console.log('⚠️ Student has no class assigned:', req.user.username);
      return res.json([]);
    }

    console.log('🔍 Getting classmates for student:', req.user.username, 'in class:', req.user.class);
    
    const classmates = await database.query(`
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.class
      FROM users u
      WHERE u.role = 'student' 
        AND u.class = $1 
        AND u.id != $2
        AND u.school_id = $3
      ORDER BY u.first_name, u.last_name
    `, [req.user.class, req.user.id, req.user.school_id]);

    console.log('📊 Found classmates:', classmates.length);
    res.json(classmates);
  } catch (error) {
    console.error('Get classmates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all students who can receive transfers (any class in same school - for cross-class transfers)
router.get('/transfer-recipients', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can access transfer recipients' });
    }

    const schoolId = req.user.school_id ?? null;

    const recipients = await database.query(`
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.class
      FROM users u
      WHERE u.role = 'student' 
        AND u.id != $1
        AND (u.school_id = $2 OR ($2 IS NULL AND u.school_id IS NULL))
      ORDER BY u.class, u.first_name, u.last_name
    `, [req.user.id, schoolId]);

    res.json(recipients);
  } catch (error) {
    console.error('Get transfer recipients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function formatTownProfessionalRow(row: {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
}) {
  const displayName =
    [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || row.username;
  return {
    id: row.id,
    username: row.username,
    first_name: row.first_name,
    last_name: row.last_name,
    display_name: displayName,
  };
}

async function fetchTownProfessionalsByIds(userIds: number[]) {
  if (!userIds.length) return [];
  const rows = await database.query(
    `SELECT u.id, u.username, u.first_name, u.last_name
     FROM users u
     WHERE u.id = ANY($1::int[])
     ORDER BY u.last_name NULLS LAST, u.first_name NULLS LAST, u.username`,
    [userIds]
  );
  return rows.map(formatTownProfessionalRow);
}

// Student self-service: town accountant, lawyer(s), and doctor
router.get('/me/town-professionals', authenticateToken, requireTenant, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can view their town professionals' });
    }

    const townClass = req.user.class;
    if (!townClass) {
      return res.json({ accountant: null, lawyers: [], doctor: null });
    }

    const schoolId = req.user.school_id ?? req.schoolId ?? null;
    const studentId = req.user.id;

    const [accountantIds, lawyerIds, doctorIds] = await Promise.all([
      getAccountantIdsForStudent(studentId, townClass, schoolId),
      getLawyerIdsForStudent(studentId, townClass, schoolId),
      getDoctorIdsForStudent(studentId, townClass, schoolId),
    ]);

    const [accountants, lawyers, doctors] = await Promise.all([
      fetchTownProfessionalsByIds(accountantIds),
      fetchTownProfessionalsByIds(lawyerIds),
      fetchTownProfessionalsByIds(doctorIds),
    ]);

    res.json({
      accountant: accountants[0] ?? null,
      lawyers,
      doctor: doctors[0] ?? null,
    });
  } catch (error) {
    console.error('Get student town professionals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Student self-service: XP and money earned breakdown
router.get('/me/earnings-profile', authenticateToken, requireTenant, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can view their earnings profile' });
    }

    const profile = await buildStudentEarningsProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Get student earnings profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all students with their account balances (teachers only)
router.get('/', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (process.env.DEBUG === '1' || process.env.VERBOSE_LOGGING === '1') console.log('🔍 Getting students for teacher:', req.user?.username, 'school:', req.schoolId);
    
    const students = await database.query(`
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.class,
        u.email,
        u.job_id,
        u.job_level,
        u.status,
        u.account_frozen,
        u.created_at,
        a.account_number,
        a.balance,
        a.updated_at as last_activity,
        j.name as job_name,
        (COALESCE(j.base_salary, 2000.00) * (1 + (COALESCE(u.job_level, 1) - 1) * 0.7222) * CASE WHEN COALESCE(j.is_contractual, false) THEN 1.5 ELSE 1.0 END) as job_salary
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      LEFT JOIN jobs j ON u.job_id = j.id
      WHERE u.role = 'student' AND u.school_id = $1
      ORDER BY u.class, u.last_name, u.first_name
    `, [req.schoolId]);

    if (process.env.DEBUG === '1' || process.env.VERBOSE_LOGGING === '1') console.log('📊 Found students:', students.length);
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending students (teachers only)
router.get('/pending', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (process.env.DEBUG === '1' || process.env.VERBOSE_LOGGING === '1') console.log('🔍 Getting pending students for teacher:', req.user?.username, 'school:', req.schoolId);
    
    const pendingStudents = await database.query(`
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.class,
        u.email,
        u.status,
        u.created_at,
        a.account_number,
        a.balance
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      WHERE u.role = 'student' AND u.status = 'pending' AND u.school_id = $1
      ORDER BY u.created_at ASC
    `, [req.schoolId]);

    if (process.env.DEBUG === '1' || process.env.VERBOSE_LOGGING === '1') console.log('📊 Found pending students:', pendingStudents.length);
    res.json(pendingStudents);
  } catch (error) {
    console.error('Get pending students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve a pending student (teachers only)
router.post('/:username/approve', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.params;

    // Get student info
    const student = await database.get(`
      SELECT u.id, u.username, u.role, u.status
      FROM users u
      WHERE u.username = $1 AND u.role = 'student' AND u.school_id = $2
    `, [username, req.schoolId]);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.status !== 'pending') {
      return res.status(400).json({ error: `Student is already ${student.status}` });
    }

    // Update student status to approved
    await database.run(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['approved', student.id]
    );

    console.log(`✅ Teacher ${req.user?.username} approved student ${username}`);
    res.json({ message: `Student ${username} has been approved successfully` });
  } catch (error) {
    console.error('Approve student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deny a pending student (teachers only)
router.post('/:username/deny', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.params;
    const { reason } = req.body;

    // Get student info
    const student = await database.get(`
      SELECT u.id, u.username, u.role, u.status
      FROM users u
      WHERE u.username = $1 AND u.role = 'student' AND u.school_id = $2
    `, [username, req.schoolId]);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.status !== 'pending') {
      return res.status(400).json({ error: `Student is already ${student.status}` });
    }

    // Update student status to denied
    await database.run(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['denied', student.id]
    );

    console.log(`❌ Teacher ${req.user?.username} denied student ${username}${reason ? `: ${reason}` : ''}`);
    res.json({ message: `Student ${username} has been denied` });
  } catch (error) {
    console.error('Deny student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a student (teachers only)
router.delete('/:username', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.params;

    // Get student info first
    const student = await database.get(`
      SELECT u.id, u.username, u.role
      FROM users u
      WHERE u.username = $1 AND u.role = 'student' AND u.school_id = $2
    `, [username, req.schoolId]);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get the student's account
    const account = await database.get('SELECT id FROM accounts WHERE user_id = $1', [student.id]);

    // Delete related data in order (respecting foreign key constraints)
    // 1. Delete transactions involving this account
    if (account) {
      await database.run('DELETE FROM transactions WHERE from_account_id = $1 OR to_account_id = $1', [account.id]);
    }

    // 2. Delete loan payments for loans where student is borrower
    await database.run(`
      DELETE FROM loan_payments WHERE loan_id IN (
        SELECT id FROM loans WHERE borrower_id = $1
      )
    `, [student.id]);

    // 3. Delete loans where student is borrower
    await database.run('DELETE FROM loans WHERE borrower_id = $1', [student.id]);

    // 4. Delete job applications
    await database.run('DELETE FROM job_applications WHERE user_id = $1', [student.id]);

    // 5. Delete land purchase requests
    await database.run('DELETE FROM land_purchase_requests WHERE user_id = $1', [student.id]);

    // 6. Update owned land parcels (set owner to null)
    await database.run('UPDATE land_parcels SET owner_id = NULL WHERE owner_id = $1', [student.id]);

    // 7. Delete tender applications
    await database.run('DELETE FROM tender_applications WHERE applicant_id = $1', [student.id]);

    // 8. Delete math game sessions
    await database.run('DELETE FROM math_game_sessions WHERE user_id = $1', [student.id]);

    // 9. Delete the account
    if (account) {
      await database.run('DELETE FROM accounts WHERE user_id = $1', [student.id]);
    }

    // 10. Finally, delete the user
    await database.run('DELETE FROM users WHERE id = $1', [student.id]);

    console.log(`🗑️ Teacher ${req.user?.username} deleted student ${username}`);
    res.json({ message: `Student ${username} has been deleted successfully` });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Freeze/unfreeze a student's account (teachers only)
router.post('/:username/freeze', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.params;
    const frozen = req.body?.frozen === true;

    const student = await database.get(
      'SELECT u.id, u.username FROM users u WHERE u.username = $1 AND u.role = $2 AND u.school_id = $3',
      [username, 'student', req.schoolId]
    );

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await database.run(
      'UPDATE users SET account_frozen = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [frozen, student.id]
    );

    res.json({ message: frozen ? 'Account frozen' : 'Account unfrozen', frozen });
  } catch (error) {
    console.error('Freeze student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset student password (teachers only)
router.post('/:username/reset-password', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.params;
    const reveal = req.body?.reveal === true;

    // Get student info
    const student = await database.get(`
      SELECT u.id, u.username, u.role
      FROM users u
      WHERE u.username = $1 AND u.role = 'student' AND u.school_id = $2
    `, [username, req.schoolId]);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Generate a temporary password (8 characters, alphanumeric)
    const generateTempPassword = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
      let password = '';
      for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const temporaryPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // Update the student's password
    await database.run(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, student.id]
    );

    console.log(`🔑 Teacher ${req.user?.username} reset password for student ${username}`);
    
    res.json(
      reveal
        ? {
            message: 'Password reset successfully',
            temporary_password: temporaryPassword,
            username: student.username
          }
        : {
            message: 'Password reset successfully',
            username: student.username
          }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle whether a student is hidden from leaderboards (teachers only)
router.post('/:username/leaderboard-visibility', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.params;
    const hidden = req.body?.hidden === true;

    const student = await database.get(
      'SELECT id FROM users WHERE username = $1 AND role = $2 AND school_id = $3',
      [username, 'student', req.schoolId]
    );

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await database.run(
      'UPDATE users SET hide_from_leaderboards = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hidden, student.id]
    );

    res.json({ message: hidden ? 'Student hidden from leaderboards' : 'Student made visible on leaderboards', hidden });
  } catch (error) {
    console.error('Toggle leaderboard visibility error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Lawyer client assignments (teachers only, same school)
router.get(
  '/:username/lawyer-assignments',
  authenticateToken,
  requireTenant,
  requireRole(['teacher']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { username } = req.params;
      const schoolId = req.schoolId ?? req.user?.school_id ?? null;

      const student = await database.get(
        `SELECT u.id, u.username, u.class, u.school_id, j.name AS job_name
         FROM users u
         LEFT JOIN jobs j ON u.job_id = j.id
         WHERE u.username = $1 AND u.role = 'student'
           AND ${schoolId !== null ? 'u.school_id = $2' : 'u.school_id IS NULL'}`,
        schoolId !== null ? [username, schoolId] : [username]
      );

      if (!student) return res.status(404).json({ error: 'Student not found' });
      if (!hasLawyerJob(student.job_name)) {
        return res.status(400).json({ error: 'Student is not a Lawyer' });
      }
      if (!student.class) {
        return res.status(400).json({ error: 'Lawyer has no town class' });
      }

      const className = student.class;
      const manualMode = await classUsesManualLawyerAssignments(schoolId, className);

      let clients;
      if (manualMode) {
        clients = await getLawyerManualClientRows(student.id, className, schoolId);
      } else {
        const clientIds = await getLawyerClientIds(student.id);
        if (!clientIds.length) {
          clients = [];
        } else {
          const placeholders = clientIds.map((_, idx) => `$${idx + 1}`).join(', ');
          clients = await database.query(
            `SELECT u.id, u.username, u.first_name, u.last_name, u.class
             FROM users u WHERE u.id IN (${placeholders})
             ORDER BY u.last_name NULLS LAST, u.first_name NULLS LAST, u.username`,
            clientIds
          );
        }
      }

      const { lawyerIds, nonLawyerStudentIds } = await getClassLawyerRoster(className, schoolId);
      const assignableIds = [
        ...nonLawyerStudentIds,
        ...lawyerIds.filter((id: number) => id !== student.id),
      ];

      const assignmentRows = manualMode
        ? await database.query(
            `SELECT a.student_user_id, a.lawyer_user_id,
                    l.username AS lawyer_username,
                    l.first_name AS lawyer_first_name,
                    l.last_name AS lawyer_last_name
             FROM lawyer_student_assignments a
             JOIN users l ON l.id = a.lawyer_user_id
             WHERE a.town_class = $1 AND a.school_id IS NOT DISTINCT FROM $2`,
            [className, schoolId]
          )
        : [];

      const assignmentByStudent = new Map<number, {
        lawyer_user_id: number;
        lawyer_username: string;
        lawyer_first_name: string | null;
        lawyer_last_name: string | null;
      }[]>();
      for (const row of assignmentRows) {
        const list = assignmentByStudent.get(row.student_user_id) ?? [];
        list.push({
          lawyer_user_id: row.lawyer_user_id,
          lawyer_username: row.lawyer_username,
          lawyer_first_name: row.lawyer_first_name,
          lawyer_last_name: row.lawyer_last_name,
        });
        assignmentByStudent.set(row.student_user_id, list);
      }

      const assignableRaw = assignableIds.length
        ? await database.query(
            `SELECT u.id, u.username, u.first_name, u.last_name, u.class, j.name AS job_name
             FROM users u
             LEFT JOIN jobs j ON u.job_id = j.id
             WHERE u.id = ANY($1::int[])
             ORDER BY u.last_name NULLS LAST, u.first_name NULLS LAST, u.username`,
            [assignableIds]
          )
        : [];

      const assignable = assignableRaw.map((s: { id: number; username: string; first_name?: string; last_name?: string; class?: string; job_name?: string }) => {
        const assignedLawyers = assignmentByStudent.get(s.id) ?? [];
        return {
          ...s,
          assigned_lawyers: assignedLawyers.map((a) => ({
            lawyer_user_id: a.lawyer_user_id,
            lawyer_username: a.lawyer_username,
            lawyer_first_name: a.lawyer_first_name,
            lawyer_last_name: a.lawyer_last_name,
          })),
        };
      });

      res.json({ clients, assignable, manual_mode: manualMode });
    } catch (error) {
      console.error('Get lawyer assignments (teacher) error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.post(
  '/:username/lawyer-assignments',
  authenticateToken,
  requireTenant,
  requireRole(['teacher']),
  [
    body('student_id').isInt().withMessage('Student ID is required'),
    body('action').isIn(['add', 'remove']).withMessage('Action must be add or remove'),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username } = req.params;
      const { student_id: targetStudentId, action } = req.body as { student_id: number; action: 'add' | 'remove' };
      const schoolId = req.schoolId ?? req.user?.school_id ?? null;

      const lawyer = await database.get(
        `SELECT u.id, u.username, u.class, u.school_id, j.name AS job_name
         FROM users u
         LEFT JOIN jobs j ON u.job_id = j.id
         WHERE u.username = $1 AND u.role = 'student'
           AND ${schoolId !== null ? 'u.school_id = $2' : 'u.school_id IS NULL'}`,
        schoolId !== null ? [username, schoolId] : [username]
      );

      if (!lawyer) return res.status(404).json({ error: 'Student not found' });
      if (!hasLawyerJob(lawyer.job_name)) {
        return res.status(400).json({ error: 'Student is not a Lawyer' });
      }
      if (!lawyer.class) {
        return res.status(400).json({ error: 'Lawyer has no town class' });
      }

      const className = lawyer.class;
      const targetStudent = await database.get(
        `SELECT u.id, u.class, u.school_id, j.name AS job_name
         FROM users u
         LEFT JOIN jobs j ON u.job_id = j.id
         WHERE u.id = $1 AND u.role = 'student'`,
        [targetStudentId]
      );

      if (!targetStudent) return res.status(404).json({ error: 'Target student not found' });
      if (schoolId !== null && targetStudent.school_id !== schoolId) {
        return res.status(404).json({ error: 'Target student not found' });
      }
      if (targetStudent.class !== className) {
        return res.status(400).json({ error: 'Student must be in the same town class as the lawyer' });
      }
      if (targetStudentId === lawyer.id) {
        return res.status(400).json({ error: 'A lawyer cannot be assigned to themselves' });
      }

      const manualMode = await classUsesManualLawyerAssignments(schoolId, className);
      if (!manualMode) {
        await seedLawyerAssignmentsFromAutoSplit(className, schoolId);
      }

      if (action === 'add') {
        const alreadyLinked = await database.get(
          `SELECT id FROM lawyer_student_assignments
           WHERE lawyer_user_id = $1 AND student_user_id = $2
             AND town_class = $3 AND school_id IS NOT DISTINCT FROM $4`,
          [lawyer.id, targetStudentId, className, schoolId]
        );
        if (alreadyLinked) {
          return res.status(400).json({ error: 'This student is already assigned to this lawyer' });
        }
        await database.run(
          `INSERT INTO lawyer_student_assignments (lawyer_user_id, student_user_id, school_id, town_class)
           VALUES ($1, $2, $3, $4)`,
          [lawyer.id, targetStudentId, schoolId, className]
        );
      } else {
        const existing = await database.get(
          `SELECT id FROM lawyer_student_assignments
           WHERE lawyer_user_id = $1 AND student_user_id = $2
             AND town_class = $3 AND school_id IS NOT DISTINCT FROM $4`,
          [lawyer.id, targetStudentId, className, schoolId]
        );
        if (!existing) {
          return res.status(400).json({ error: 'This student is not assigned to this lawyer' });
        }
        await database.run(
          `DELETE FROM lawyer_student_assignments
           WHERE lawyer_user_id = $1 AND student_user_id = $2
             AND town_class = $3 AND school_id IS NOT DISTINCT FROM $4`,
          [lawyer.id, targetStudentId, className, schoolId]
        );
      }

      const clients = await getLawyerManualClientRows(lawyer.id, className, schoolId);
      res.json({ message: action === 'add' ? 'Student assigned' : 'Student removed', clients, manual_mode: true });
    } catch (error) {
      console.error('Update lawyer assignments (teacher) error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Chartered Accountant client assignments (teachers only, same school)
router.get(
  '/:username/accountant-assignments',
  authenticateToken,
  requireTenant,
  requireRole(['teacher']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { username } = req.params;
      const schoolId = req.schoolId ?? req.user?.school_id ?? null;

      const student = await database.get(
        `SELECT u.id, u.username, u.class, u.school_id, j.name AS job_name
         FROM users u
         LEFT JOIN jobs j ON u.job_id = j.id
         WHERE u.username = $1 AND u.role = 'student'
           AND ${schoolId !== null ? 'u.school_id = $2' : 'u.school_id IS NULL'}`,
        schoolId !== null ? [username, schoolId] : [username]
      );

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      if (!hasAccountantJob(student.job_name)) {
        return res.status(400).json({ error: 'Student is not a Chartered Accountant' });
      }
      if (!student.class) {
        return res.status(400).json({ error: 'Accountant has no town class' });
      }

      const className = student.class;
      const manualMode = await classUsesManualAccountantAssignments(schoolId, className);

      let clients;
      if (manualMode) {
        clients = await getManualClientRows(student.id, className, schoolId);
      } else {
        const context = await getAccountantContext(student.id);
        const userIds = getManagedClientUserIds(context);
        if (!userIds.length) {
          clients = [];
        } else {
          const placeholders = userIds.map((_, idx) => `$${idx + 1}`).join(', ');
          clients = await database.query(
            `SELECT u.id, u.username, u.first_name, u.last_name, u.class
             FROM users u WHERE u.id IN (${placeholders})
             ORDER BY u.last_name NULLS LAST, u.first_name NULLS LAST, u.username`,
            userIds
          );
        }
      }

      const { accountantIds, nonAccountantStudentIds } = await getClassAccountantRoster(className, schoolId);
      const assignableIds = [
        ...nonAccountantStudentIds,
        ...accountantIds.filter((id: number) => id !== student.id),
      ];
      const assignmentRows = manualMode
        ? await database.query(
            `SELECT a.student_user_id, a.accountant_user_id,
                    acc.username AS accountant_username,
                    acc.first_name AS accountant_first_name,
                    acc.last_name AS accountant_last_name
             FROM accountant_student_assignments a
             JOIN users acc ON acc.id = a.accountant_user_id
             WHERE a.town_class = $1 AND a.school_id IS NOT DISTINCT FROM $2`,
            [className, schoolId]
          )
        : [];

      const assignmentByStudent = new Map<number, {
        accountant_user_id: number;
        accountant_username: string;
        accountant_first_name: string | null;
        accountant_last_name: string | null;
      }[]>();
      for (const row of assignmentRows) {
        const list = assignmentByStudent.get(row.student_user_id) ?? [];
        list.push({
          accountant_user_id: row.accountant_user_id,
          accountant_username: row.accountant_username,
          accountant_first_name: row.accountant_first_name,
          accountant_last_name: row.accountant_last_name,
        });
        assignmentByStudent.set(row.student_user_id, list);
      }

      const assignableRaw = assignableIds.length
        ? await database.query(
            `SELECT u.id, u.username, u.first_name, u.last_name, u.class, j.name AS job_name
             FROM users u
             LEFT JOIN jobs j ON u.job_id = j.id
             WHERE u.id = ANY($1::int[])
             ORDER BY u.last_name NULLS LAST, u.first_name NULLS LAST, u.username`,
            [assignableIds]
          )
        : [];

      const assignable = assignableRaw.map((s: {
        id: number;
        username: string;
        first_name?: string;
        last_name?: string;
        class?: string;
      }) => {
        const assignedAccountants = assignmentByStudent.get(s.id) ?? [];
        return {
          ...s,
          assigned_accountants: assignedAccountants.map((a) => ({
            accountant_user_id: a.accountant_user_id,
            accountant_username: a.accountant_username,
            accountant_first_name: a.accountant_first_name,
            accountant_last_name: a.accountant_last_name,
          })),
        };
      });

      res.json({ clients, assignable, manual_mode: manualMode });
    } catch (error) {
      console.error('Get accountant assignments (teacher) error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.post(
  '/:username/accountant-assignments',
  authenticateToken,
  requireTenant,
  requireRole(['teacher']),
  [
    body('student_id').isInt().withMessage('Student ID is required'),
    body('action').isIn(['add', 'remove']).withMessage('Action must be add or remove'),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username } = req.params;
      const { student_id: targetStudentId, action } = req.body as { student_id: number; action: 'add' | 'remove' };
      const schoolId = req.schoolId ?? req.user?.school_id ?? null;

      const accountant = await database.get(
        `SELECT u.id, u.username, u.class, u.school_id, j.name AS job_name
         FROM users u
         LEFT JOIN jobs j ON u.job_id = j.id
         WHERE u.username = $1 AND u.role = 'student'
           AND ${schoolId !== null ? 'u.school_id = $2' : 'u.school_id IS NULL'}`,
        schoolId !== null ? [username, schoolId] : [username]
      );

      if (!accountant) {
        return res.status(404).json({ error: 'Student not found' });
      }
      if (!hasAccountantJob(accountant.job_name)) {
        return res.status(400).json({ error: 'Student is not a Chartered Accountant' });
      }
      if (!accountant.class) {
        return res.status(400).json({ error: 'Accountant has no town class' });
      }

      const className = accountant.class;

      const targetStudent = await database.get(
        `SELECT u.id, u.class, u.school_id, j.name AS job_name
         FROM users u
         LEFT JOIN jobs j ON u.job_id = j.id
         WHERE u.id = $1 AND u.role = 'student'`,
        [targetStudentId]
      );

      if (!targetStudent) {
        return res.status(404).json({ error: 'Target student not found' });
      }
      if (schoolId !== null && targetStudent.school_id !== schoolId) {
        return res.status(404).json({ error: 'Target student not found' });
      }
      if (targetStudent.class !== className) {
        return res.status(400).json({ error: 'Student must be in the same town class as the accountant' });
      }
      if (targetStudentId === accountant.id) {
        return res.status(400).json({ error: 'An accountant cannot be assigned to themselves' });
      }

      const manualMode = await classUsesManualAccountantAssignments(schoolId, className);
      if (!manualMode) {
        await seedManualAssignmentsFromAutoSplit(className, schoolId);
      }

      if (action === 'add') {
        const alreadyLinked = await database.get(
          `SELECT id FROM accountant_student_assignments
           WHERE accountant_user_id = $1 AND student_user_id = $2
             AND town_class = $3 AND school_id IS NOT DISTINCT FROM $4`,
          [accountant.id, targetStudentId, className, schoolId]
        );
        if (alreadyLinked) {
          return res.status(400).json({ error: 'This student is already assigned to this accountant' });
        }
        await database.run(
          `INSERT INTO accountant_student_assignments (accountant_user_id, student_user_id, school_id, town_class)
           VALUES ($1, $2, $3, $4)`,
          [accountant.id, targetStudentId, schoolId, className]
        );
      } else {
        const existing = await database.get(
          `SELECT id FROM accountant_student_assignments
           WHERE accountant_user_id = $1 AND student_user_id = $2
             AND town_class = $3 AND school_id IS NOT DISTINCT FROM $4`,
          [accountant.id, targetStudentId, className, schoolId]
        );
        if (!existing) {
          return res.status(400).json({ error: 'This student is not assigned to this accountant' });
        }
        await database.run(
          `DELETE FROM accountant_student_assignments
           WHERE accountant_user_id = $1 AND student_user_id = $2
             AND town_class = $3 AND school_id IS NOT DISTINCT FROM $4`,
          [accountant.id, targetStudentId, className, schoolId]
        );
      }

      const clients = await getManualClientRows(accountant.id, className, schoolId);
      res.json({ message: action === 'add' ? 'Student assigned' : 'Student removed', clients, manual_mode: true });
    } catch (error) {
      console.error('Update accountant assignments (teacher) error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get account details by account number (teachers only, same school) - MUST be before /:username/details to avoid "account" matching as username
router.get('/account/:accountNumber/details', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountNumber } = req.params;
    const schoolId = req.schoolId ?? req.user?.school_id ?? null;

    // Get account with user info
    const account = await database.get(`
      SELECT 
        a.id as account_id,
        a.account_number,
        a.balance,
        a.created_at as account_created_at,
        a.updated_at as last_activity,
        u.id as user_id,
        u.username,
        u.first_name,
        u.last_name,
        u.class,
        u.email,
        u.status,
        u.created_at as user_created_at,
        u.updated_at as user_updated_at,
        u.job_id,
        u.job_level,
        u.job_experience_points,
        u.school_id as user_school_id,
        j.name as job_name,
        j.description as job_description,
        (COALESCE(j.base_salary, 2000.00) * (1 + (COALESCE(u.job_level, 1) - 1) * 0.7222) * CASE WHEN COALESCE(j.is_contractual, false) THEN 1.5 ELSE 1.0 END) as job_salary,
        j.company_name as job_company_name
      FROM accounts a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN jobs j ON u.job_id = j.id
      WHERE a.account_number = $1
    `, [accountNumber]);

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // If account has a user, they must be in teacher's school
    if (account.user_id && schoolId !== null && account.user_school_id !== schoolId) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // If no user associated, return account info only
    if (!account.user_id) {
      return res.json({
        account: {
          account_number: account.account_number,
          balance: account.balance,
          created_at: account.account_created_at,
          last_activity: account.last_activity,
          orphaned: true
        },
        student: null,
        transactions: [],
        loans: [],
        landParcels: [],
        mathGameSessions: [],
        pizzaContributions: [],
        shopPurchases: [],
        insurancePurchases: [],
        jobApplications: [],
        suggestions: [],
        bugReports: [],
        stats: {
          total_transactions: 0,
          total_transfers_sent: 0,
          total_transfers_received: 0,
          total_deposits: 0,
          total_withdrawals: 0,
          math_games_played: 0,
          total_math_earnings: 0,
          pizza_contributions_total: 0,
          shop_purchases_total: 0,
          insurance_purchases_total: 0,
          land_parcels_owned: 0,
          land_value_total: 0,
          active_loans: 0,
          total_loan_debt: 0,
          total_wordle_games: 0,
          total_wordle_earnings: 0,
          total_wordle_xp: 0,
          total_job_challenge_sessions: 0,
          total_job_challenge_xp: 0
        }
      });
    }

    const detailSchoolId = account.user_school_id ?? schoolId ?? null;
    const detailClass = account.class;
    const detailAccountParams: unknown[] = [account.account_id, account.account_id];
    const detailVisibility =
      detailClass && ['6A', '6B', '6C'].includes(detailClass)
        ? studentTownTransactionVisibilitySql(
            detailSchoolId,
            detailClass,
            detailAccountParams.length + 1,
            detailAccountParams.length + 2
          )
        : { fragment: '', params: [] as unknown[] };

    // Get all transactions
    const transactions = await database.query(
      `
      SELECT 
        t.*,
        fu.username as from_username,
        fu.first_name as from_first_name,
        fu.last_name as from_last_name,
        tu.username as to_username,
        tu.first_name as to_first_name,
        tu.last_name as to_last_name
      FROM transactions t
      LEFT JOIN accounts fa ON t.from_account_id = fa.id
      LEFT JOIN users fu ON fa.user_id = fu.id
      LEFT JOIN accounts ta ON t.to_account_id = ta.id
      LEFT JOIN users tu ON ta.user_id = tu.id
      WHERE (t.from_account_id = $1 OR t.to_account_id = $2)
      ${detailVisibility.fragment}
      ORDER BY t.created_at DESC
    `,
      [...detailAccountParams, ...detailVisibility.params]
    );

    // Get loans
    const loans = await database.query(`
      SELECT 
        l.*,
        COALESCE(SUM(lp.amount), 0) as total_paid
      FROM loans l
      LEFT JOIN loan_payments lp ON l.id = lp.loan_id
      WHERE l.borrower_id = $1
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `, [account.user_id]);

    // Get land parcels
    const landParcels = await database.query(`
      SELECT * FROM land_parcels
      WHERE owner_id = $1
      ORDER BY purchased_at DESC
    `, [account.user_id]);

    // Get math game sessions
    const mathGameSessions = await database.query(`
      SELECT * FROM math_game_sessions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [account.user_id]);

    // Get pizza contributions (from transactions, same as username route)
    const pizzaContributions = await database.query(`
      SELECT t.amount, t.description, t.created_at
      FROM transactions t
      JOIN accounts a ON t.from_account_id = a.id
      WHERE a.user_id = $1 AND t.description LIKE '%pizza%'
      ORDER BY t.created_at DESC
    `, [account.user_id]);

    // Get Winkel (shop) purchases (from transactions, same as username route)
    const shopPurchases = await database.query(`
      SELECT t.amount, t.description, t.created_at
      FROM transactions t
      JOIN accounts a ON t.from_account_id = a.id
      WHERE a.user_id = $1 AND t.description LIKE '%Winkel%'
      ORDER BY t.created_at DESC
    `, [account.user_id]);

    // Get insurance purchases
    const insurancePurchases = await database.query(`
      SELECT id, insurance_type, weeks, total_cost, week_start_date, created_at
      FROM insurance_purchases
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [account.user_id]);

    // Get job applications
    const jobApplications = await database.query(`
      SELECT * FROM job_applications
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [account.user_id]);

    // Get suggestions (content field, not title/description)
    const suggestions = await database.query(`
      SELECT
        id,
        content,
        status,
        reviewed_at,
        reward_paid,
        created_at
      FROM suggestions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [account.user_id]);

    // Get bug reports
    const bugReports = await database.query(`
      SELECT
        id,
        title,
        description,
        status,
        reviewed_at,
        reward_paid,
        created_at
      FROM bug_reports
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [account.user_id]);

    // Wordle stats for this student
    const wordleStats = await database.get(
      `
      SELECT 
        COUNT(*) FILTER (WHERE status IN ('won','lost'))::int as total_games,
        COALESCE(SUM(earnings), 0)::numeric as total_earnings,
        COALESCE(SUM(CASE WHEN status = 'won' THEN 10 ELSE 0 END), 0)::int as total_xp
      FROM wordle_sessions
      WHERE user_id = $1
      `,
      [account.user_id]
    );

    // Job challenge stats (all job challenge games combined) for this student
    const jobStats = await database.get(
      `
      WITH job_sessions AS (
        SELECT experience_points FROM architect_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM accountant_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM software_engineer_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM marketing_manager_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM graphic_designer_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM journalist_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM event_planner_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM financial_manager_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM hr_director_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM police_lieutenant_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM lawyer_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM town_planner_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM electrical_engineer_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM civil_engineer_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM principal_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM teacher_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM nurse_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM doctor_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM retail_manager_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM entrepreneur_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM insurance_manager_game_sessions WHERE user_id = $1
      )
      SELECT 
        COUNT(*)::int as total_sessions,
        COALESCE(SUM(experience_points), 0)::int as total_xp
      FROM job_sessions
      `,
      [account.user_id]
    );

    // Calculate statistics
    const stats = {
      total_transactions: transactions.length,
      total_transfers_sent: transactions.filter((t: any) => 
        t.transaction_type === 'transfer' && t.from_username === account.username
      ).reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0),
      total_transfers_received: transactions.filter((t: any) => 
        t.transaction_type === 'transfer' && t.to_username === account.username
      ).reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0),
      total_deposits: transactions.filter((t: any) => 
        t.transaction_type === 'deposit'
      ).reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0),
      total_withdrawals: transactions.filter((t: any) => 
        t.transaction_type === 'withdrawal'
      ).reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0),
      math_games_played: mathGameSessions.length,
      total_math_earnings: mathGameSessions.reduce((sum: number, s: any) => sum + parseFloat(s.earnings), 0),
      pizza_contributions_total: pizzaContributions.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0),
      shop_purchases_total: shopPurchases.reduce((sum: number, s: any) => sum + parseFloat(s.amount), 0),
      insurance_purchases_total: insurancePurchases.reduce((sum: number, p: any) => sum + parseFloat(p.total_cost), 0),
      land_parcels_owned: landParcels.length,
      land_value_total: landParcels.reduce((sum: number, l: any) => sum + parseFloat(l.value), 0),
      active_loans: loans.filter((l: any) => l.status === 'active').length,
      total_loan_debt: loans.filter((l: any) => l.status === 'active').reduce((sum: number, l: any) => sum + parseFloat(l.outstanding_balance), 0),
      total_wordle_games: wordleStats?.total_games ?? 0,
      total_wordle_earnings: parseFloat(wordleStats?.total_earnings ?? 0),
      total_wordle_xp: wordleStats?.total_xp ?? 0,
      total_job_challenge_sessions: jobStats?.total_sessions ?? 0,
      total_job_challenge_xp: jobStats?.total_xp ?? 0
    };

    const earningsProfile = await buildStudentEarningsProfile(account.user_id);

    res.json({
      account: {
        account_number: account.account_number,
        balance: account.balance,
        created_at: account.account_created_at,
        last_activity: account.last_activity
      },
      student: {
        id: account.user_id,
        username: account.username,
        first_name: account.first_name,
        last_name: account.last_name,
        class: account.class,
        email: account.email,
        status: account.status,
        created_at: account.user_created_at,
        updated_at: account.user_updated_at,
        job_id: account.job_id,
        job_level: account.job_level,
        job_experience_points: account.job_experience_points,
        job_name: account.job_name,
        job_description: account.job_description,
        job_salary: account.job_salary,
        job_company_name: account.job_company_name,
        account_number: account.account_number,
        balance: account.balance,
        last_activity: account.last_activity
      },
      transactions,
      loans,
      landParcels,
      mathGameSessions,
      pizzaContributions,
      shopPurchases,
      insurancePurchases,
      jobApplications,
      suggestions,
      bugReports,
      stats,
      earnings_profile: earningsProfile
    });
  } catch (error) {
    console.error('Get account details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comprehensive student details (teachers only, same school)
router.get('/:username/details', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.params;
    
    console.log('🔍 Looking up student details for username:', JSON.stringify(username));
    console.log('🔍 Username length:', username?.length);
    console.log('🔍 Username chars:', username?.split('').map(c => `${c}(${c.charCodeAt(0)})`));

    // Get student info with job details (same school only)
    const student = await database.get(`
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.class,
        u.email,
        u.status,
        u.created_at,
        u.updated_at,
        u.job_id,
        u.job_level,
        u.job_experience_points,
        j.name as job_name,
        j.description as job_description,
        (COALESCE(j.base_salary, 2000.00) * (1 + (COALESCE(u.job_level, 1) - 1) * 0.7222) * CASE WHEN COALESCE(j.is_contractual, false) THEN 1.5 ELSE 1.0 END) as job_salary,
        j.company_name as job_company_name,
        a.account_number,
        a.balance,
        a.updated_at as last_activity
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      LEFT JOIN jobs j ON u.job_id = j.id
      WHERE u.username = $1 AND u.role = 'student' AND u.school_id = $2
    `, [username, req.schoolId]);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [student.id]);

    // Get all transactions
    let transactions = [];
    if (account) {
      const detailSchoolId = student.school_id ?? req.schoolId ?? null;
      const detailClass = student.class;
      const detailAccountParams: unknown[] = [account.id, account.id];
      const detailVisibility =
        detailClass && ['6A', '6B', '6C'].includes(detailClass)
          ? studentTownTransactionVisibilitySql(
              detailSchoolId,
              detailClass,
              detailAccountParams.length + 1,
              detailAccountParams.length + 2
            )
          : { fragment: '', params: [] as unknown[] };

      transactions = await database.query(
        `
        SELECT 
          t.*,
          fu.username as from_username,
          fu.first_name as from_first_name,
          fu.last_name as from_last_name,
          tu.username as to_username,
          tu.first_name as to_first_name,
          tu.last_name as to_last_name
        FROM transactions t
        LEFT JOIN accounts fa ON t.from_account_id = fa.id
        LEFT JOIN users fu ON fa.user_id = fu.id
        LEFT JOIN accounts ta ON t.to_account_id = ta.id
        LEFT JOIN users tu ON ta.user_id = tu.id
        WHERE (t.from_account_id = $1 OR t.to_account_id = $2)
        ${detailVisibility.fragment}
        ORDER BY t.created_at DESC
      `,
        [...detailAccountParams, ...detailVisibility.params]
      );
    }

    // Get loans
    const loans = await database.query(`
      SELECT 
        l.*,
        COALESCE(SUM(lp.amount), 0) as total_paid,
        CASE 
          WHEN l.status = 'active' AND l.monthly_payment > 0 THEN 
            GREATEST(0, CEIL(l.outstanding_balance / (l.monthly_payment / 4.33)))
          ELSE 0 
        END as payments_remaining
      FROM loans l
      LEFT JOIN loan_payments lp ON l.id = lp.loan_id
      WHERE l.borrower_id = $1
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `, [student.id]);

    // Get land parcels owned
    const landParcels = await database.query(`
      SELECT 
        id,
        grid_code,
        biome_type,
        value,
        risk_level,
        purchased_at
      FROM land_parcels
      WHERE owner_id = $1
      ORDER BY purchased_at DESC
    `, [student.id]);

    // Get math game sessions
    const mathGameSessions = await database.query(`
      SELECT 
        id,
        difficulty,
        score,
        correct_answers,
        total_problems,
        earnings,
        played_at
      FROM math_game_sessions
      WHERE user_id = $1
      ORDER BY played_at DESC
    `, [student.id]);

    // Get pizza time contributions
    const pizzaContributions = await database.query(`
      SELECT 
        t.amount,
        t.description,
        t.created_at
      FROM transactions t
      JOIN accounts a ON t.from_account_id = a.id
      WHERE a.user_id = $1 AND t.description LIKE '%pizza%'
      ORDER BY t.created_at DESC
    `, [student.id]);

    // Get Winkel (shop) purchases
    const shopPurchases = await database.query(`
      SELECT 
        t.amount,
        t.description,
        t.created_at
      FROM transactions t
      JOIN accounts a ON t.from_account_id = a.id
      WHERE a.user_id = $1 AND t.description LIKE '%Winkel%'
      ORDER BY t.created_at DESC
    `, [student.id]);

    // Get insurance purchases
    const insurancePurchases = await database.query(`
      SELECT id, insurance_type, weeks, total_cost, week_start_date, created_at
      FROM insurance_purchases
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [student.id]);

    // Get job application history
    const jobApplications = await database.query(`
      SELECT 
        ja.id,
        ja.status,
        ja.created_at,
        ja.reviewed_at,
        j.name as job_name,
        COALESCE(j.base_salary, 2000.00) as job_salary
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.user_id = $1
      ORDER BY ja.created_at DESC
    `, [student.id]);

    // Get Suggestions & Bug reports (recent)
    const suggestions = await database.query(
      `
      SELECT
        id,
        content,
        status,
        reviewed_at,
        reward_paid,
        created_at
      FROM suggestions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
      `,
      [student.id]
    );

    const bugReports = await database.query(
      `
      SELECT
        id,
        title,
        description,
        status,
        reviewed_at,
        reward_paid,
        created_at
      FROM bug_reports
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
      `,
      [student.id]
    );

    // Wordle stats for this student
    const wordleStats = await database.get(
      `
      SELECT 
        COUNT(*) FILTER (WHERE status IN ('won','lost'))::int as total_games,
        COALESCE(SUM(earnings), 0)::numeric as total_earnings,
        COALESCE(SUM(CASE WHEN status = 'won' THEN 10 ELSE 0 END), 0)::int as total_xp
      FROM wordle_sessions
      WHERE user_id = $1
      `,
      [student.id]
    );

    // Job challenge stats (all job challenge games combined) for this student
    const jobStats = await database.get(
      `
      WITH job_sessions AS (
        SELECT experience_points FROM architect_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM accountant_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM software_engineer_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM marketing_manager_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM graphic_designer_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM journalist_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM event_planner_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM financial_manager_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM hr_director_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM police_lieutenant_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM lawyer_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM town_planner_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM electrical_engineer_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM civil_engineer_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM principal_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM teacher_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM nurse_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM doctor_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM retail_manager_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM entrepreneur_game_sessions WHERE user_id = $1
        UNION ALL
        SELECT experience_points FROM insurance_manager_game_sessions WHERE user_id = $1
      )
      SELECT 
        COUNT(*)::int as total_sessions,
        COALESCE(SUM(experience_points), 0)::int as total_xp
      FROM job_sessions
      `,
      [student.id]
    );

    // Calculate statistics
    const stats = {
      total_transactions: transactions.length,
      total_transfers_sent: transactions.filter(t => 
        t.transaction_type === 'transfer' && t.from_username === student.username
      ).reduce((sum, t) => sum + parseFloat(t.amount), 0),
      total_transfers_received: transactions.filter(t => 
        t.transaction_type === 'transfer' && t.to_username === student.username
      ).reduce((sum, t) => sum + parseFloat(t.amount), 0),
      total_deposits: transactions.filter(t => 
        t.transaction_type === 'deposit'
      ).reduce((sum, t) => sum + parseFloat(t.amount), 0),
      total_withdrawals: transactions.filter(t => 
        t.transaction_type === 'withdrawal'
      ).reduce((sum, t) => sum + parseFloat(t.amount), 0),
      math_games_played: mathGameSessions.length,
      total_math_earnings: mathGameSessions.reduce((sum, s) => sum + parseFloat(s.earnings), 0),
      pizza_contributions_total: pizzaContributions.reduce((sum, p) => sum + parseFloat(p.amount), 0),
      shop_purchases_total: shopPurchases.reduce((sum, s) => sum + parseFloat(s.amount), 0),
      insurance_purchases_total: insurancePurchases.reduce((sum, p) => sum + parseFloat(p.total_cost), 0),
      land_parcels_owned: landParcels.length,
      land_value_total: landParcels.reduce((sum, l) => sum + parseFloat(l.value), 0),
      active_loans: loans.filter(l => l.status === 'active').length,
      total_loan_debt: loans.filter(l => l.status === 'active').reduce((sum, l) => sum + parseFloat(l.outstanding_balance), 0),
      total_wordle_games: wordleStats?.total_games ?? 0,
      total_wordle_earnings: parseFloat(wordleStats?.total_earnings ?? 0),
      total_wordle_xp: wordleStats?.total_xp ?? 0,
      total_job_challenge_sessions: jobStats?.total_sessions ?? 0,
      total_job_challenge_xp: jobStats?.total_xp ?? 0
    };

    const earningsProfile = await buildStudentEarningsProfile(student.id);

    res.json({
      student,
      transactions,
      loans,
      landParcels,
      mathGameSessions,
      pizzaContributions,
      shopPurchases,
      insurancePurchases,
      jobApplications,
      suggestions,
      bugReports,
      stats,
      earnings_profile: earningsProfile
    });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete an account by account number (teachers only, same school) - for orphaned accounts
router.delete('/account/:accountNumber', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountNumber } = req.params;
    const schoolId = req.schoolId ?? req.user?.school_id ?? null;

    // Get account info
    const account = await database.get('SELECT id, user_id FROM accounts WHERE account_number = $1', [accountNumber]);

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // If account has a user, check user exists and is in this school
    let user = null;
    if (account.user_id) {
      user = await database.get('SELECT id, username, role, school_id FROM users WHERE id = $1', [account.user_id]);
      if (user && schoolId !== null && user.school_id !== schoolId) {
        return res.status(404).json({ error: 'Account not found' });
      }
    }

    // Delete related data in order (respecting foreign key constraints)
    // 1. Delete transactions involving this account
    await database.run('DELETE FROM transactions WHERE from_account_id = $1 OR to_account_id = $1', [account.id]);

    // 2. If user exists, delete user-related data
    if (user && user.role === 'student') {
      // Delete loan payments for loans where student is borrower
      await database.run(`
        DELETE FROM loan_payments WHERE loan_id IN (
          SELECT id FROM loans WHERE borrower_id = $1
        )
      `, [user.id]);

      // Delete loans where student is borrower
      await database.run('DELETE FROM loans WHERE borrower_id = $1', [user.id]);

      // Delete job applications
      await database.run('DELETE FROM job_applications WHERE user_id = $1', [user.id]);

      // Delete land purchase requests
      await database.run('DELETE FROM land_purchase_requests WHERE user_id = $1', [user.id]);

      // Update owned land parcels (set owner to null)
      await database.run('UPDATE land_parcels SET owner_id = NULL WHERE owner_id = $1', [user.id]);

      // Delete tender applications
      await database.run('DELETE FROM tender_applications WHERE applicant_id = $1', [user.id]);

      // Delete math game sessions
      await database.run('DELETE FROM math_game_sessions WHERE user_id = $1', [user.id]);

      // Delete the user
      await database.run('DELETE FROM users WHERE id = $1', [user.id]);
    }

    // Delete the account
    await database.run('DELETE FROM accounts WHERE id = $1', [account.id]);

    console.log(`🗑️ Teacher ${req.user?.username} deleted account ${accountNumber}${user ? ` (and associated user ${user.username})` : ' (orphaned account)'}`);
    res.json({ 
      message: `Account ${accountNumber} has been deleted successfully${user ? ` along with associated student account` : ' (orphaned account)'}` 
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student details with loan information (teachers only, same school) - Legacy endpoint
router.get('/:username', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.params;

    // Get student info (same school only)
    const student = await database.get(`
      SELECT 
        u.id,
        u.username,
        u.created_at,
        a.account_number,
        a.balance,
        a.updated_at as last_activity
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      WHERE u.username = $1 AND u.role = 'student' AND u.school_id = $2
    `, [username, req.schoolId]);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get student's loans
    const loans = await database.query(`
      SELECT 
        l.*,
        COALESCE(SUM(lp.amount), 0) as total_paid
      FROM loans l
      LEFT JOIN loan_payments lp ON l.id = lp.loan_id
      WHERE l.borrower_id = $1
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `, [student.id]);

    // Get recent transactions
    const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [student.id]);
    let transactions = [];
    if (account) {
      transactions = await database.query(`
        SELECT 
          t.*,
          fu.username as from_username,
          tu.username as to_username
        FROM transactions t
        LEFT JOIN accounts fa ON t.from_account_id = fa.id
        LEFT JOIN users fu ON fa.user_id = fu.id
        LEFT JOIN accounts ta ON t.to_account_id = ta.id
        LEFT JOIN users tu ON ta.user_id = tu.id
        WHERE t.from_account_id = $1 OR t.to_account_id = $2
        ORDER BY t.created_at DESC
        LIMIT 10
      `, [account.id, account.id]);
    }

    res.json({
      student,
      loans,
      recent_transactions: transactions
    });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
