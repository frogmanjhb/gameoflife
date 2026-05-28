import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { getXPForLevel } from './jobs';
import {
  CYBER_ATTACK_DAILY_LIMIT,
  CYBER_ATTACK_DAY_START_SQL,
  CYBER_ATTACK_META,
  CYBER_REPAIR_FEE,
  CYBER_REPAIR_APPROVE_XP,
  pickRandomCyberAttackType,
  CyberAttackType,
} from '../domain/cyber-attack';
import {
  classRequiresBrokerApproval,
  hasActiveApprovedCyberInsurance,
  payCyberInsuranceRepairClaim,
} from '../domain/insurance';

const router = Router();

function hasSoftwareEngineerJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim().includes('software engineer');
}

function attackPayload(type: CyberAttackType) {
  const meta = CYBER_ATTACK_META[type];
  return { attack_type: type, attack_name: meta.name, attack_description: meta.description };
}

async function countClassAssignmentsToday(
  schoolId: number | null,
  townClass: string
): Promise<number> {
  const row = await database.get(
    `SELECT COUNT(*)::int AS count FROM cyber_attack_assignments
     WHERE town_class = $1 AND school_id IS NOT DISTINCT FROM $2
     AND assigned_at >= (${CYBER_ATTACK_DAY_START_SQL})`,
    [townClass, schoolId]
  );
  return row?.count ?? 0;
}

async function awardSoftwareEngineerXp(
  engineerUserId: number,
  xp: number
): Promise<{ new_level: number | null }> {
  const currentUser = await database.get(
    'SELECT job_level, job_experience_points FROM users WHERE id = $1',
    [engineerUserId]
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
    [newXP, newLevel, engineerUserId]
  );
  return { new_level: newLevel > currentLevel ? newLevel : null };
}

router.get('/engineer-status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can access cyber attack tools' });
    }
    const userId = req.user.id;
    const user = await database.get(
      `SELECT u.*, j.name AS job_name FROM users u
       LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`,
      [userId]
    );
    if (!user || !hasSoftwareEngineerJob(user.job_name)) {
      return res.status(403).json({ error: 'Only Software Engineers can launch cyber attacks' });
    }
    if (!req.user.class) {
      return res.status(400).json({ error: 'You must belong to a town class to launch cyber attacks' });
    }

    try {
      await database.query('SELECT 1 FROM cyber_attack_assignments LIMIT 1');
    } catch {
      return res.json({
        remaining_today: CYBER_ATTACK_DAILY_LIMIT,
        daily_limit: CYBER_ATTACK_DAILY_LIMIT,
        repair_fee: CYBER_REPAIR_FEE,
        repair_approve_xp: CYBER_REPAIR_APPROVE_XP,
        pending_repairs: [],
        recent_assignments: [],
      });
    }

    const used = await countClassAssignmentsToday(req.user.school_id ?? null, req.user.class);
    const recent = await database.query(
      `SELECT a.id, a.attack_type, a.assigned_at, a.repaired_at, a.repair_requested_at,
              v.username AS victim_username,
              COALESCE(NULLIF(TRIM(CONCAT(v.first_name, ' ', v.last_name)), ''), v.username) AS victim_display_name
       FROM cyber_attack_assignments a
       JOIN users v ON v.id = a.victim_user_id
       WHERE a.town_class = $1 AND a.school_id IS NOT DISTINCT FROM $2
         AND a.assigned_at >= (${CYBER_ATTACK_DAY_START_SQL})
       ORDER BY a.assigned_at DESC
       LIMIT 10`,
      [req.user.class, req.user.school_id ?? null]
    );

    const pendingRepairs = await database.query(
      `SELECT a.id, a.attack_type, a.repair_fee, a.repair_requested_at,
              v.username AS victim_username,
              COALESCE(NULLIF(TRIM(CONCAT(v.first_name, ' ', v.last_name)), ''), v.username) AS victim_display_name
       FROM cyber_attack_assignments a
       JOIN users v ON v.id = a.victim_user_id
       WHERE a.assigned_by_user_id = $1
         AND a.repaired_at IS NULL
         AND a.repair_requested_at IS NOT NULL
       ORDER BY a.repair_requested_at ASC`,
      [userId]
    );

    res.json({
      remaining_today: Math.max(0, CYBER_ATTACK_DAILY_LIMIT - used),
      daily_limit: CYBER_ATTACK_DAILY_LIMIT,
      repair_fee: CYBER_REPAIR_FEE,
      repair_approve_xp: CYBER_REPAIR_APPROVE_XP,
      pending_repairs: pendingRepairs.map((r: Record<string, unknown>) => {
        const type = r.attack_type as CyberAttackType;
        const meta = CYBER_ATTACK_META[type];
        return {
          id: r.id,
          victim_username: r.victim_username,
          victim_display_name: r.victim_display_name,
          attack_type: type,
          attack_name: meta?.name ?? type,
          repair_fee: parseFloat(String(r.repair_fee ?? CYBER_REPAIR_FEE)),
          repair_requested_at: r.repair_requested_at,
        };
      }),
      recent_assignments: recent.map((r: Record<string, unknown>) => {
        const type = r.attack_type as CyberAttackType;
        const meta = CYBER_ATTACK_META[type];
        let attack_status: 'active' | 'pending_repair' | 'repaired' = 'active';
        if (r.repaired_at) attack_status = 'repaired';
        else if (r.repair_requested_at) attack_status = 'pending_repair';
        return {
          id: r.id,
          victim_username: r.victim_username,
          victim_display_name: r.victim_display_name,
          attack_type: type,
          attack_name: meta?.name ?? type,
          assigned_at: r.assigned_at,
          repaired_at: r.repaired_at,
          attack_status,
        };
      }),
    });
  } catch (error) {
    console.error('Cyber attack engineer-status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/assign', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can launch cyber attacks' });
    }
    const engineerId = req.user.id;
    const user = await database.get(
      `SELECT u.*, j.name AS job_name FROM users u
       LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`,
      [engineerId]
    );
    if (!user || !hasSoftwareEngineerJob(user.job_name)) {
      return res.status(403).json({ error: 'Only Software Engineers can launch cyber attacks' });
    }
    if (!req.user.class) {
      return res.status(400).json({ error: 'You must belong to a town class to launch cyber attacks' });
    }

    try {
      await database.query('SELECT 1 FROM cyber_attack_assignments LIMIT 1');
    } catch {
      return res.status(503).json({ error: 'Cyber attack feature not available yet. Please try again later.' });
    }

    const schoolId = req.user.school_id ?? null;
    const townClass = req.user.class;
    const used = await countClassAssignmentsToday(schoolId, townClass);
    if (used >= CYBER_ATTACK_DAILY_LIMIT) {
      return res.status(400).json({
        error: `Your town class has already reached the daily limit of ${CYBER_ATTACK_DAILY_LIMIT} cyber attacks.`,
      });
    }

    const victim = await database.get(
      `SELECT u.id, u.username,
              COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.username) AS display_name
       FROM users u
       WHERE u.role = 'student'
         AND u.status = 'approved'
         AND u.class = $1
         AND u.school_id IS NOT DISTINCT FROM $2
         AND u.id != $3
         AND NOT EXISTS (
           SELECT 1 FROM cyber_attack_assignments c
           WHERE c.victim_user_id = u.id AND c.repaired_at IS NULL
         )
       ORDER BY RANDOM()
       LIMIT 1`,
      [townClass, schoolId, engineerId]
    );

    if (!victim) {
      return res.status(400).json({
        error: 'No eligible classmates available (everyone may already be under attack).',
      });
    }

    const attackType = pickRandomCyberAttackType();
    const inserted = await database.query(
      `INSERT INTO cyber_attack_assignments
         (victim_user_id, assigned_by_user_id, attack_type, school_id, town_class, repair_fee)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, assigned_at`,
      [victim.id, engineerId, attackType, schoolId, townClass, CYBER_REPAIR_FEE]
    );
    const row = inserted[0];
    const meta = CYBER_ATTACK_META[attackType];

    res.json({
      success: true,
      assignment: {
        id: row.id,
        victim_username: victim.username,
        victim_display_name: victim.display_name,
        attack_type: attackType,
        attack_name: meta.name,
        assigned_at: row.assigned_at,
      },
      remaining_today: Math.max(0, CYBER_ATTACK_DAILY_LIMIT - used - 1),
    });
  } catch (error) {
    console.error('Cyber attack assign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/my-status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can check cyber attack status' });
    }

    try {
      await database.query('SELECT 1 FROM cyber_attack_assignments LIMIT 1');
    } catch {
      return res.json({ active: false });
    }

    const row = await database.get(
      `SELECT attack_type, assigned_at, repair_requested_at, repair_fee, insurance_claim_requested_at,
              e.username AS engineer_username,
              COALESCE(NULLIF(TRIM(CONCAT(e.first_name, ' ', e.last_name)), ''), e.username) AS engineer_display_name
       FROM cyber_attack_assignments a
       JOIN users e ON e.id = a.assigned_by_user_id
       WHERE a.victim_user_id = $1 AND a.repaired_at IS NULL
       ORDER BY a.assigned_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (!row) {
      return res.json({ active: false });
    }

    const pendingRepair = !!row.repair_requested_at;
    const pendingInsuranceClaim = !!row.insurance_claim_requested_at && !pendingRepair;
    const type = row.attack_type as CyberAttackType;
    const repairFee = parseFloat(String(row.repair_fee ?? CYBER_REPAIR_FEE));
    const cyberInsuranceCoversRepair = await hasActiveApprovedCyberInsurance(req.user.id);
    const brokerRequired = await classRequiresBrokerApproval(
      req.user.school_id ?? null,
      req.user.class ?? null
    );

    res.json({
      active: true,
      pending_repair: pendingRepair,
      pending_insurance_claim: pendingInsuranceClaim,
      repair_fee: repairFee,
      cyber_insurance_covers_repair: cyberInsuranceCoversRepair,
      insurance_broker_required: brokerRequired && cyberInsuranceCoversRepair,
      engineer_username: row.engineer_username,
      engineer_display_name: row.engineer_display_name,
      assigned_at: row.assigned_at,
      ...attackPayload(type),
    });
  } catch (error) {
    console.error('Cyber attack my-status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/self-resolve', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can resolve cyber attacks' });
    }

    try {
      await database.query('SELECT 1 FROM cyber_attack_assignments LIMIT 1');
    } catch {
      return res.status(503).json({ error: 'Cyber attack feature not available yet. Please try again later.' });
    }

    const row = await database.get(
      `SELECT id, repair_requested_at, insurance_claim_requested_at
       FROM cyber_attack_assignments
       WHERE victim_user_id = $1 AND repaired_at IS NULL
       ORDER BY assigned_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (!row) {
      return res.status(400).json({ error: 'You are not currently under cyber attack' });
    }

    if (row.repair_requested_at || row.insurance_claim_requested_at) {
      return res.status(400).json({ error: 'IT repair is already in progress' });
    }

    await database.query(
      `UPDATE cyber_attack_assignments SET repaired_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [row.id]
    );

    res.json({ success: true, repaired: true });
  } catch (error) {
    console.error('Cyber attack self-resolve error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/call-it', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can call IT for repair' });
    }

    try {
      await database.query('SELECT 1 FROM cyber_attack_assignments LIMIT 1');
    } catch {
      return res.status(503).json({ error: 'Cyber attack feature not available yet. Please try again later.' });
    }

    const row = await database.get(
      `SELECT a.id, a.attack_type, a.repair_requested_at, a.repair_fee,
              a.insurance_claim_requested_at, a.assigned_by_user_id, e.username AS engineer_username
       FROM cyber_attack_assignments a
       JOIN users e ON e.id = a.assigned_by_user_id
       WHERE a.victim_user_id = $1 AND a.repaired_at IS NULL
       ORDER BY a.assigned_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (!row) {
      return res.status(400).json({ error: 'You are not currently under cyber attack' });
    }

    if (row.repair_requested_at) {
      return res.status(400).json({ error: 'You have already paid. Waiting for IT to approve the repair.' });
    }

    if (row.insurance_claim_requested_at) {
      return res.status(400).json({
        error: 'Your insurance claim is waiting for your town insurance manager to approve payment.',
      });
    }

    const repairFee = parseFloat(String(row.repair_fee ?? CYBER_REPAIR_FEE));
    const hasCyberInsurance = await hasActiveApprovedCyberInsurance(req.user.id);
    const brokerRequired = await classRequiresBrokerApproval(
      req.user.school_id ?? null,
      req.user.class ?? null
    );

    if (hasCyberInsurance && brokerRequired) {
      await database.query(
        `UPDATE cyber_attack_assignments
         SET insurance_claim_requested_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [row.id]
      );
      return res.json({
        success: true,
        repaired: false,
        pending_repair: false,
        pending_insurance_claim: true,
        repair_fee: repairFee,
        paid_by_insurance: false,
        engineer_username: row.engineer_username,
        attack_type: row.attack_type,
      });
    }

    const engineerAccount = await database.get('SELECT * FROM accounts WHERE user_id = $1', [
      row.assigned_by_user_id,
    ]);
    if (!engineerAccount) {
      return res.status(400).json({ error: 'Software Engineer bank account not found for payment' });
    }

    if (hasCyberInsurance) {
      await payCyberInsuranceRepairClaim(database, row.id, engineerAccount.id, repairFee, row.attack_type);
    } else {
      const victimAccount = await database.get('SELECT * FROM accounts WHERE user_id = $1', [req.user.id]);
      if (!victimAccount) {
        return res.status(400).json({ error: 'Bank account not found for payment' });
      }
      const victimBalance = parseFloat(victimAccount.balance);
      if (isNaN(victimBalance) || victimBalance < repairFee) {
        return res.status(400).json({ error: `Insufficient funds. IT repair fee is R${repairFee.toFixed(2)}.` });
      }

      await database.query(
        'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [repairFee, victimAccount.id]
      );
      await database.query(
        'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [repairFee, engineerAccount.id]
      );
      await database.query(
        `INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description)
         VALUES ($1, $2, $3, 'transfer', $4)`,
        [
          victimAccount.id,
          engineerAccount.id,
          repairFee,
          `IT repair fee — ${row.attack_type} (awaiting engineer approval)`,
        ]
      );
      await database.query(
        `UPDATE cyber_attack_assignments
         SET repair_requested_at = CURRENT_TIMESTAMP,
             repair_paid_at = CURRENT_TIMESTAMP,
             paid_by_insurance = FALSE
         WHERE id = $1`,
        [row.id]
      );
    }

    res.json({
      success: true,
      repaired: false,
      pending_repair: true,
      pending_insurance_claim: false,
      repair_fee: repairFee,
      paid_by_insurance: hasCyberInsurance,
      engineer_username: row.engineer_username,
      attack_type: row.attack_type,
    });
  } catch (error) {
    console.error('Cyber attack call-it error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/approve-repair/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can approve repairs' });
    }
    const engineerId = req.user.id;
    const user = await database.get(
      `SELECT u.*, j.name AS job_name FROM users u
       LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`,
      [engineerId]
    );
    if (!user || !hasSoftwareEngineerJob(user.job_name)) {
      return res.status(403).json({ error: 'Only Software Engineers can approve IT repairs' });
    }

    const assignmentId = parseInt(String(req.params.id), 10);
    if (!assignmentId || Number.isNaN(assignmentId)) {
      return res.status(400).json({ error: 'Invalid assignment id' });
    }

    const row = await database.get(
      `SELECT a.*, v.username AS victim_username,
              COALESCE(NULLIF(TRIM(CONCAT(v.first_name, ' ', v.last_name)), ''), v.username) AS victim_display_name
       FROM cyber_attack_assignments a
       JOIN users v ON v.id = a.victim_user_id
       WHERE a.id = $1`,
      [assignmentId]
    );

    if (!row) {
      return res.status(404).json({ error: 'Repair request not found' });
    }
    if (row.assigned_by_user_id !== engineerId) {
      return res.status(403).json({ error: 'You can only approve repairs for attacks you launched' });
    }
    if (row.repaired_at) {
      return res.status(400).json({ error: 'This victim has already been repaired' });
    }
    if (!row.repair_requested_at) {
      return res.status(400).json({ error: 'This victim has not paid for IT repair yet' });
    }

    await database.query(
      `UPDATE cyber_attack_assignments SET repaired_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [assignmentId]
    );

    const xpResult = await awardSoftwareEngineerXp(engineerId, CYBER_REPAIR_APPROVE_XP);

    res.json({
      success: true,
      repaired: true,
      victim_username: row.victim_username,
      victim_display_name: row.victim_display_name,
      experience_points: CYBER_REPAIR_APPROVE_XP,
      new_level: xpResult.new_level,
    });
  } catch (error) {
    console.error('Cyber attack approve-repair error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
