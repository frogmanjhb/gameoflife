import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { getXPForLevel } from './jobs';
import {
  DOCTOR_ILLNESS_DAILY_LIMIT,
  DOCTOR_ILLNESS_DAY_START_SQL,
  DOCTOR_ILLNESS_META,
  DOCTOR_SEE_DOCTOR_DELAY_MS,
  DOCTOR_CURE_FEE,
  DOCTOR_CURE_APPROVE_XP,
  pickRandomIllnessType,
  DoctorIllnessType,
} from '../domain/doctor-illness';
import { hasActiveApprovedHealthInsurance } from '../domain/insurance';

const router = Router();

function hasDoctorJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim().includes('doctor');
}

function illnessPayload(type: DoctorIllnessType) {
  const meta = DOCTOR_ILLNESS_META[type];
  return { illness_type: type, illness_name: meta.name, illness_description: meta.description };
}

async function countClassAssignmentsToday(
  schoolId: number | null,
  townClass: string
): Promise<number> {
  const row = await database.get(
    `SELECT COUNT(*)::int AS count FROM doctor_illness_assignments
     WHERE town_class = $1 AND school_id IS NOT DISTINCT FROM $2
     AND assigned_at >= (${DOCTOR_ILLNESS_DAY_START_SQL})`,
    [townClass, schoolId]
  );
  return row?.count ?? 0;
}

async function awardDoctorXp(doctorUserId: number, xp: number): Promise<{ new_level: number | null }> {
  const currentUser = await database.get(
    'SELECT job_level, job_experience_points FROM users WHERE id = $1',
    [doctorUserId]
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
    [newXP, newLevel, doctorUserId]
  );
  return { new_level: newLevel > currentLevel ? newLevel : null };
}

router.get('/doctor-status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can access doctor illness tools' });
    }
    const userId = req.user.id;
    const user = await database.get(
      `SELECT u.*, j.name AS job_name FROM users u
       LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`,
      [userId]
    );
    if (!user || !hasDoctorJob(user.job_name)) {
      return res.status(403).json({ error: 'Only Junior Doctors can assign illnesses' });
    }
    if (!req.user.class) {
      return res.status(400).json({ error: 'You must belong to a town class to assign illnesses' });
    }

    try {
      await database.query('SELECT 1 FROM doctor_illness_assignments LIMIT 1');
    } catch {
      return res.json({
        remaining_today: DOCTOR_ILLNESS_DAILY_LIMIT,
        daily_limit: DOCTOR_ILLNESS_DAILY_LIMIT,
        cure_fee: DOCTOR_CURE_FEE,
        cure_approve_xp: DOCTOR_CURE_APPROVE_XP,
        pending_cures: [],
        recent_assignments: [],
      });
    }

    const used = await countClassAssignmentsToday(req.user.school_id ?? null, req.user.class);
    const recent = await database.query(
      `SELECT a.id, a.illness_type, a.assigned_at, a.cured_at, a.cure_requested_at,
              p.username AS patient_username,
              COALESCE(NULLIF(TRIM(CONCAT(p.first_name, ' ', p.last_name)), ''), p.username) AS patient_display_name
       FROM doctor_illness_assignments a
       JOIN users p ON p.id = a.patient_user_id
       WHERE a.town_class = $1 AND a.school_id IS NOT DISTINCT FROM $2
         AND a.assigned_at >= (${DOCTOR_ILLNESS_DAY_START_SQL})
       ORDER BY a.assigned_at DESC
       LIMIT 10`,
      [req.user.class, req.user.school_id ?? null]
    );

    const pendingCures = await database.query(
      `SELECT a.id, a.illness_type, a.cure_fee, a.cure_requested_at,
              p.username AS patient_username,
              COALESCE(NULLIF(TRIM(CONCAT(p.first_name, ' ', p.last_name)), ''), p.username) AS patient_display_name
       FROM doctor_illness_assignments a
       JOIN users p ON p.id = a.patient_user_id
       WHERE a.assigned_by_user_id = $1
         AND a.cured_at IS NULL
         AND a.cure_requested_at IS NOT NULL
       ORDER BY a.cure_requested_at ASC`,
      [userId]
    );

    res.json({
      remaining_today: Math.max(0, DOCTOR_ILLNESS_DAILY_LIMIT - used),
      daily_limit: DOCTOR_ILLNESS_DAILY_LIMIT,
      cure_fee: DOCTOR_CURE_FEE,
      cure_approve_xp: DOCTOR_CURE_APPROVE_XP,
      pending_cures: pendingCures.map((r: Record<string, unknown>) => {
        const type = r.illness_type as DoctorIllnessType;
        const meta = DOCTOR_ILLNESS_META[type];
        return {
          id: r.id,
          patient_username: r.patient_username,
          patient_display_name: r.patient_display_name,
          illness_type: type,
          illness_name: meta?.name ?? type,
          cure_fee: parseFloat(String(r.cure_fee ?? DOCTOR_CURE_FEE)),
          cure_requested_at: r.cure_requested_at,
        };
      }),
      recent_assignments: recent.map((r: Record<string, unknown>) => {
        const type = r.illness_type as DoctorIllnessType;
        const meta = DOCTOR_ILLNESS_META[type];
        let illness_status: 'sick' | 'pending_cure' | 'recovered' = 'sick';
        if (r.cured_at) illness_status = 'recovered';
        else if (r.cure_requested_at) illness_status = 'pending_cure';
        return {
          id: r.id,
          patient_username: r.patient_username,
          patient_display_name: r.patient_display_name,
          illness_type: type,
          illness_name: meta?.name ?? type,
          assigned_at: r.assigned_at,
          cured_at: r.cured_at,
          illness_status,
        };
      }),
    });
  } catch (error) {
    console.error('Doctor illness doctor-status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/assign', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can assign illnesses' });
    }
    const doctorId = req.user.id;
    const user = await database.get(
      `SELECT u.*, j.name AS job_name FROM users u
       LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`,
      [doctorId]
    );
    if (!user || !hasDoctorJob(user.job_name)) {
      return res.status(403).json({ error: 'Only Junior Doctors can assign illnesses' });
    }
    if (!req.user.class) {
      return res.status(400).json({ error: 'You must belong to a town class to assign illnesses' });
    }

    try {
      await database.query('SELECT 1 FROM doctor_illness_assignments LIMIT 1');
    } catch {
      return res.status(503).json({ error: 'Illness feature not available yet. Please try again later.' });
    }

    const schoolId = req.user.school_id ?? null;
    const townClass = req.user.class;
    const used = await countClassAssignmentsToday(schoolId, townClass);
    if (used >= DOCTOR_ILLNESS_DAILY_LIMIT) {
      return res.status(400).json({
        error: `Your town class has already reached the daily limit of ${DOCTOR_ILLNESS_DAILY_LIMIT} sick students.`,
      });
    }

    const patient = await database.get(
      `SELECT u.id, u.username,
              COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.username) AS display_name
       FROM users u
       WHERE u.role = 'student'
         AND u.status = 'approved'
         AND u.class = $1
         AND u.school_id IS NOT DISTINCT FROM $2
         AND u.id != $3
         AND NOT EXISTS (
           SELECT 1 FROM doctor_illness_assignments d
           WHERE d.patient_user_id = u.id AND d.cured_at IS NULL
         )
       ORDER BY RANDOM()
       LIMIT 1`,
      [townClass, schoolId, doctorId]
    );

    if (!patient) {
      return res.status(400).json({
        error: 'No eligible classmates available (everyone may already be sick or pending approval).',
      });
    }

    const illnessType = pickRandomIllnessType();
    const inserted = await database.query(
      `INSERT INTO doctor_illness_assignments
         (patient_user_id, assigned_by_user_id, illness_type, school_id, town_class, cure_fee)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, assigned_at`,
      [patient.id, doctorId, illnessType, schoolId, townClass, DOCTOR_CURE_FEE]
    );
    const row = inserted[0];
    const meta = DOCTOR_ILLNESS_META[illnessType];

    res.json({
      success: true,
      assignment: {
        id: row.id,
        patient_username: patient.username,
        patient_display_name: patient.display_name,
        illness_type: illnessType,
        illness_name: meta.name,
        assigned_at: row.assigned_at,
      },
      remaining_today: Math.max(0, DOCTOR_ILLNESS_DAILY_LIMIT - used - 1),
    });
  } catch (error) {
    console.error('Doctor illness assign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/my-status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can check illness status' });
    }

    try {
      await database.query('SELECT 1 FROM doctor_illness_assignments LIMIT 1');
    } catch {
      return res.json({ active: false });
    }

    const row = await database.get(
      `SELECT illness_type, assigned_at, cure_requested_at, cure_fee,
              d.username AS doctor_username,
              COALESCE(NULLIF(TRIM(CONCAT(d.first_name, ' ', d.last_name)), ''), d.username) AS doctor_display_name
       FROM doctor_illness_assignments a
       JOIN users d ON d.id = a.assigned_by_user_id
       WHERE a.patient_user_id = $1 AND a.cured_at IS NULL
       ORDER BY a.assigned_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (!row) {
      return res.json({ active: false });
    }

    const assignedAt = new Date(row.assigned_at).getTime();
    const seeDoctorAt = assignedAt + DOCTOR_SEE_DOCTOR_DELAY_MS;
    const now = Date.now();
    const pendingCure = !!row.cure_requested_at;
    const canPayForCure = !pendingCure && now >= seeDoctorAt;
    const type = row.illness_type as DoctorIllnessType;
    const cureFee = parseFloat(String(row.cure_fee ?? DOCTOR_CURE_FEE));
    const healthInsuranceCoversClinic = await hasActiveApprovedHealthInsurance(req.user.id);

    res.json({
      active: true,
      pending_cure: pendingCure,
      cure_fee: cureFee,
      health_insurance_covers_clinic: healthInsuranceCoversClinic,
      doctor_username: row.doctor_username,
      doctor_display_name: row.doctor_display_name,
      assigned_at: row.assigned_at,
      see_doctor_available_at: new Date(seeDoctorAt).toISOString(),
      can_see_doctor: canPayForCure,
      seconds_until_see_doctor: pendingCure || canPayForCure ? 0 : Math.ceil((seeDoctorAt - now) / 1000),
      ...illnessPayload(type),
    });
  } catch (error) {
    console.error('Doctor illness my-status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/see-doctor', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can visit the doctor' });
    }

    try {
      await database.query('SELECT 1 FROM doctor_illness_assignments LIMIT 1');
    } catch {
      return res.status(503).json({ error: 'Illness feature not available yet. Please try again later.' });
    }

    const row = await database.get(
      `SELECT a.id, a.illness_type, a.assigned_at, a.cure_requested_at, a.cure_fee,
              a.assigned_by_user_id, d.username AS doctor_username
       FROM doctor_illness_assignments a
       JOIN users d ON d.id = a.assigned_by_user_id
       WHERE a.patient_user_id = $1 AND a.cured_at IS NULL
       ORDER BY a.assigned_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (!row) {
      return res.status(400).json({ error: 'You are not currently sick' });
    }

    if (row.cure_requested_at) {
      return res.status(400).json({ error: 'You have already paid. Waiting for your doctor to approve the cure.' });
    }

    const seeDoctorAt = new Date(row.assigned_at).getTime() + DOCTOR_SEE_DOCTOR_DELAY_MS;
    if (Date.now() < seeDoctorAt) {
      const secondsLeft = Math.ceil((seeDoctorAt - Date.now()) / 1000);
      return res.status(400).json({
        error: `The clinic opens in ${secondsLeft} second${secondsLeft === 1 ? '' : 's'}.`,
      });
    }

    const cureFee = parseFloat(String(row.cure_fee ?? DOCTOR_CURE_FEE));
    const doctorAccount = await database.get('SELECT * FROM accounts WHERE user_id = $1', [row.assigned_by_user_id]);
    if (!doctorAccount) {
      return res.status(400).json({ error: 'Doctor bank account not found for payment' });
    }

    const paidByInsurance = await hasActiveApprovedHealthInsurance(req.user.id);

    if (paidByInsurance) {
      await database.query(
        'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [cureFee, doctorAccount.id]
      );
      await database.query(
        `INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description)
         VALUES (NULL, $1, $2, 'insurance', $3)`,
        [
          doctorAccount.id,
          cureFee,
          `Health insurance claim — ${row.illness_type} clinic fee (awaiting doctor approval)`,
        ]
      );
    } else {
      const patientAccount = await database.get('SELECT * FROM accounts WHERE user_id = $1', [req.user.id]);
      if (!patientAccount) {
        return res.status(400).json({ error: 'Bank account not found for payment' });
      }
      const patientBalance = parseFloat(patientAccount.balance);
      if (isNaN(patientBalance) || patientBalance < cureFee) {
        return res.status(400).json({ error: `Insufficient funds. Clinic fee is $${cureFee.toFixed(2)}.` });
      }

      await database.query(
        'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [cureFee, patientAccount.id]
      );
      await database.query(
        'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [cureFee, doctorAccount.id]
      );
      await database.query(
        `INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description)
         VALUES ($1, $2, $3, 'transfer', $4)`,
        [
          patientAccount.id,
          doctorAccount.id,
          cureFee,
          `Clinic visit fee — ${row.illness_type} (awaiting doctor approval)`,
        ]
      );
    }

    await database.query(
      `UPDATE doctor_illness_assignments
       SET cure_requested_at = CURRENT_TIMESTAMP,
           cure_paid_at = CURRENT_TIMESTAMP,
           paid_by_insurance = $2
       WHERE id = $1`,
      [row.id, paidByInsurance]
    );

    res.json({
      success: true,
      cured: false,
      pending_cure: true,
      cure_fee: cureFee,
      paid_by_insurance: paidByInsurance,
      doctor_username: row.doctor_username,
      illness_type: row.illness_type,
    });
  } catch (error) {
    console.error('Doctor illness see-doctor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/approve-cure/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can approve cures' });
    }
    const doctorId = req.user.id;
    const user = await database.get(
      `SELECT u.*, j.name AS job_name FROM users u
       LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`,
      [doctorId]
    );
    if (!user || !hasDoctorJob(user.job_name)) {
      return res.status(403).json({ error: 'Only Junior Doctors can approve cures' });
    }

    const assignmentId = parseInt(String(req.params.id), 10);
    if (!assignmentId || Number.isNaN(assignmentId)) {
      return res.status(400).json({ error: 'Invalid assignment id' });
    }

    const row = await database.get(
      `SELECT a.*, p.username AS patient_username,
              COALESCE(NULLIF(TRIM(CONCAT(p.first_name, ' ', p.last_name)), ''), p.username) AS patient_display_name
       FROM doctor_illness_assignments a
       JOIN users p ON p.id = a.patient_user_id
       WHERE a.id = $1`,
      [assignmentId]
    );

    if (!row) {
      return res.status(404).json({ error: 'Cure request not found' });
    }
    if (row.assigned_by_user_id !== doctorId) {
      return res.status(403).json({ error: 'You can only approve cures for patients you treated' });
    }
    if (row.cured_at) {
      return res.status(400).json({ error: 'This patient has already been cured' });
    }
    if (!row.cure_requested_at) {
      return res.status(400).json({ error: 'This patient has not paid for a clinic visit yet' });
    }

    await database.query(
      `UPDATE doctor_illness_assignments SET cured_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [assignmentId]
    );

    const xpResult = await awardDoctorXp(doctorId, DOCTOR_CURE_APPROVE_XP);

    res.json({
      success: true,
      cured: true,
      patient_username: row.patient_username,
      patient_display_name: row.patient_display_name,
      experience_points: DOCTOR_CURE_APPROVE_XP,
      new_level: xpResult.new_level,
    });
  } catch (error) {
    console.error('Doctor illness approve-cure error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
