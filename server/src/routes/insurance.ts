import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import {
  INSURANCE_RATE,
  VALID_INSURANCE_TYPES,
  todayInSA,
  toDateString,
  isPolicyEffectivelyActive,
  isInsuranceBrokerJob,
  classRequiresBrokerApproval,
  getClassInsuranceBrokers,
  awardInsuranceBroker,
  purchaseBatchAlreadyRewarded,
  payHealthInsuranceClinicClaim,
  payCyberInsuranceRepairClaim,
  calculateTeacherRefundAmount,
  canTeacherRefundInsuranceStatus,
  INSURANCE_TEACHER_REFUND_RATE,
  getEnabledInsuranceTypes,
  getInsuranceTypeSettings,
  setInsuranceTypeEnabled,
} from '../domain/insurance';

const router = Router();
const VALID_TYPES = VALID_INSURANCE_TYPES;

function mapPolicyWithActive(p: Record<string, unknown>, today: string) {
  const startStr = toDateString(p.week_start_date as string | Date | null);
  const status = String(p.status || 'approved');
  const weeks = Number(p.weeks) || 0;
  return {
    ...p,
    active: isPolicyEffectivelyActive(status, startStr || null, weeks, today),
  };
}

async function getStudentSalary(userId: number): Promise<number> {
  const row = await database.get(
    `SELECT (COALESCE(j.base_salary, 2000.00) * (1 + (COALESCE(u.job_level, 1) - 1) * 0.7222) * CASE WHEN COALESCE(j.is_contractual, false) THEN 1.5 ELSE 1.0 END) as salary
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.id = $1`,
    [userId]
  );
  return row ? parseFloat(row.salary) || 0 : 0;
}

async function getUserWithJob(userId: number) {
  return database.get(
    `SELECT u.id, u.username, u.first_name, u.last_name, u.class, u.school_id, j.name AS job_name
     FROM users u
     LEFT JOIN jobs j ON j.id = u.job_id
     WHERE u.id = $1`,
    [userId]
  );
}

// GET /api/insurance/quote - Student: get cost for selected types and weeks (server computes 5%)
router.get('/quote', authenticateToken, requireTenant, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can get insurance quotes' });
    }
    const salary = await getStudentSalary(req.user.id);
    const perTypePerWeek = Math.round(salary * INSURANCE_RATE * 100) / 100;
    const brokerRequired = await classRequiresBrokerApproval(
      req.user.school_id ?? null,
      req.user.class ?? null,
      req.user.id
    );
    const enabledTypes = await getEnabledInsuranceTypes(req.user.school_id ?? null);
    const typeSettings = await getInsuranceTypeSettings(req.user.school_id ?? null);
    res.json({
      salary,
      rate_percent: INSURANCE_RATE * 100,
      per_type_per_week: perTypePerWeek,
      types: enabledTypes,
      type_settings: typeSettings,
      broker_required: brokerRequired,
    });
  } catch (error) {
    console.error('Insurance quote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/insurance/my-policies - Student: my purchases (active + history)
router.get('/my-policies', authenticateToken, requireTenant, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can view their policies' });
    }
    const policies = await database.query(
      `SELECT id, insurance_type, weeks, total_cost, week_start_date, created_at, status,
              reviewed_at, denial_reason, refunded_at, refund_amount
       FROM insurance_purchases
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    const today = todayInSA();
    res.json((policies as Record<string, unknown>[]).map((p) => mapPolicyWithActive(p, today)));
  } catch (error) {
    console.error('My policies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/insurance/purchase - Student: buy insurance (types + weeks)
router.post(
  '/purchase',
  authenticateToken,
  requireTenant,
  [
    body('types').isArray().withMessage('types must be an array'),
    body('types.*').isIn(VALID_TYPES).withMessage('Each type must be health, cyber, or property'),
    body('weeks').isInt({ min: 1, max: 52 }).withMessage('weeks must be between 1 and 52'),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || req.user.role !== 'student') {
        return res.status(403).json({ error: 'Only students can purchase insurance' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { types, weeks } = req.body as { types: typeof VALID_TYPES[number][]; weeks: number };
      const uniqueTypes = [...new Set(types)] as typeof VALID_TYPES[number][];
      if (uniqueTypes.length === 0) {
        return res.status(400).json({ error: 'Select at least one insurance type' });
      }

      const enabledTypes = await getEnabledInsuranceTypes(req.user.school_id ?? null);
      const blockedTypes = uniqueTypes.filter((t) => !enabledTypes.includes(t));
      if (blockedTypes.length > 0) {
        return res.status(400).json({
          error: `${blockedTypes.join(', ')} insurance is not available at your school.`,
        });
      }

      const salary = await getStudentSalary(req.user.id);
      if (salary <= 0) {
        return res.status(400).json({
          error: 'You need a job to buy insurance. Insurance cost is 5% of your salary per type per week.',
        });
      }

      const perTypePerWeek = salary * INSURANCE_RATE;
      const totalCost = Math.round(uniqueTypes.length * perTypePerWeek * weeks * 100) / 100;
      if (totalCost <= 0) {
        return res.status(400).json({ error: 'Invalid cost calculation' });
      }

      const account = await database.get('SELECT id, balance FROM accounts WHERE user_id = $1', [req.user.id]);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      const balance = parseFloat(account.balance) || 0;
      if (balance < totalCost) {
        return res.status(400).json({
          error: `Insufficient balance. You need ${totalCost.toFixed(2)} but have ${balance.toFixed(2)}.`,
        });
      }

      const brokerRequired = await classRequiresBrokerApproval(
        req.user.school_id ?? null,
        req.user.class ?? null,
        req.user.id
      );
      const status = brokerRequired ? 'pending_broker' : 'approved';
      const weekStart = brokerRequired ? null : todayInSA();
      const schoolId = req.user.school_id ?? null;
      const townClass = req.user.class ?? null;

      const client = await database.pool.connect();
      try {
        await client.query('BEGIN');
        const accountRow = await client.query('SELECT id, balance FROM accounts WHERE user_id = $1 FOR UPDATE', [
          req.user.id,
        ]);
        const acc = accountRow.rows[0];
        if (!acc || parseFloat(acc.balance) < totalCost) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            error: `Insufficient balance. You need ${totalCost.toFixed(2)} but have ${balance.toFixed(2)}.`,
          });
        }
        const newBalance = Math.round((balance - totalCost) * 100) / 100;
        await client.query('UPDATE accounts SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
          newBalance,
          account.id,
        ]);
        const typeLabels: Record<string, string> = { health: 'Health', cyber: 'Cyber', property: 'Property' };
        const descParts = uniqueTypes.map((t) => `${typeLabels[t]} (${weeks} wk)`).join(', ');
        const txDesc =
          status === 'pending_broker'
            ? `Insurance request (pending broker): ${descParts} - R${totalCost.toFixed(2)}`
            : `Insurance: ${descParts} - R${totalCost.toFixed(2)}`;
        await client.query(
          'INSERT INTO transactions (from_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
          [account.id, totalCost, 'insurance', txDesc]
        );
        for (const insuranceType of uniqueTypes) {
          const costForType = Math.round(perTypePerWeek * weeks * 100) / 100;
          await client.query(
            `INSERT INTO insurance_purchases
               (user_id, insurance_type, weeks, total_cost, week_start_date, status, town_class, school_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [req.user!.id, insuranceType, weeks, costForType, weekStart, status, townClass, schoolId]
          );
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }

      res.status(201).json({
        message:
          status === 'pending_broker'
            ? 'Insurance request submitted. Your town insurance broker must approve it before coverage starts.'
            : 'Insurance purchased successfully',
        total_cost: totalCost,
        types: uniqueTypes,
        weeks,
        week_start_date: weekStart,
        status,
        pending_broker: status === 'pending_broker',
      });
    } catch (error) {
      console.error('Insurance purchase error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/insurance/broker/pending - Insurance broker: pending requests in their town class
router.get('/broker/pending', authenticateToken, requireTenant, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can access broker tools' });
    }

    const reviewer = await getUserWithJob(req.user.id);
    if (!reviewer || !isInsuranceBrokerJob(reviewer.job_name)) {
      return res.status(403).json({ error: 'Only the town insurance broker can review insurance requests' });
    }
    if (!reviewer.class) {
      return res.status(400).json({ error: 'You must belong to a town class to review insurance' });
    }

    const rows = await database.query(
      `SELECT ip.id, ip.user_id, ip.insurance_type, ip.weeks, ip.total_cost, ip.created_at,
              u.username, u.first_name, u.last_name, u.class
       FROM insurance_purchases ip
       JOIN users u ON u.id = ip.user_id
       WHERE ip.status = 'pending_broker'
         AND ip.town_class = $1
         AND ip.school_id IS NOT DISTINCT FROM $2
         AND ip.user_id != $3
       ORDER BY ip.created_at ASC`,
      [reviewer.class, reviewer.school_id ?? null, req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Insurance broker pending error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/insurance/broker/requests/:id/review - Insurance broker: approve or deny
router.put(
  '/broker/requests/:id/review',
  authenticateToken,
  requireTenant,
  body('status').isIn(['approved', 'denied']),
  body('denial_reason').optional().isString(),
  async (req: AuthenticatedRequest, res: Response) => {
    const client = await database.pool.connect();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.user || req.user.role !== 'student') {
        return res.status(403).json({ error: 'Only students can review insurance requests' });
      }

      const reviewer = await getUserWithJob(req.user.id);
      if (!reviewer || !isInsuranceBrokerJob(reviewer.job_name)) {
        return res.status(403).json({ error: 'Only the town insurance broker can review insurance requests' });
      }
      if (!reviewer.class) {
        return res.status(400).json({ error: 'You must belong to a town class to review insurance' });
      }

      const requestId = parseInt(String(req.params.id), 10);
      if (!requestId || Number.isNaN(requestId)) {
        return res.status(400).json({ error: 'Invalid request id' });
      }

      const { status, denial_reason: denialReason } = req.body as {
        status: 'approved' | 'denied';
        denial_reason?: string;
      };

      const purchase = await database.get(
        `SELECT ip.*, u.username AS applicant_username
         FROM insurance_purchases ip
         JOIN users u ON u.id = ip.user_id
         WHERE ip.id = $1`,
        [requestId]
      );

      if (!purchase || String(purchase.status).toLowerCase() !== 'pending_broker') {
        return res.status(404).json({ error: 'Insurance request not found or already reviewed' });
      }
      if (purchase.town_class !== reviewer.class) {
        return res.status(403).json({ error: 'You can only review insurance for your town class' });
      }
      if ((purchase.school_id ?? null) !== (reviewer.school_id ?? null)) {
        return res.status(403).json({ error: 'You can only review insurance in your school' });
      }
      if (purchase.user_id === req.user.id) {
        return res.status(400).json({ error: 'You cannot approve your own insurance request' });
      }

      await client.query('BEGIN');

      if (status === 'approved') {
        const weekStart = todayInSA();
        await client.query(
          `UPDATE insurance_purchases
           SET status = 'approved',
               week_start_date = $1,
               reviewed_by = $2,
               reviewed_at = CURRENT_TIMESTAMP,
               denial_reason = NULL
           WHERE id = $3`,
          [weekStart, req.user.id, requestId]
        );
        let brokerReward = { earnings: 0, experience_points: 0, new_level: null as number | null, reward_skipped_reason: null as string | null };
        try {
          const batchAlreadyRewarded = await purchaseBatchAlreadyRewarded(
            client,
            req.user.id,
            purchase.user_id as number,
            purchase.created_at as string | Date,
            requestId
          );
          brokerReward = await awardInsuranceBroker(
            client,
            req.user.id,
            reviewer.username,
            reviewer.school_id ?? null,
            reviewer.class,
            'Insurance purchase approval',
            {
              referenceAmount: parseFloat(String(purchase.total_cost)),
              purchaseBatchAlreadyRewarded: batchAlreadyRewarded,
            }
          );
        } catch (rewardError) {
          await client.query('ROLLBACK');
          const msg = rewardError instanceof Error ? rewardError.message : 'Could not pay broker earnings';
          return res.status(400).json({ error: msg });
        }
        await client.query('COMMIT');
        return res.json({
          success: true,
          status: 'approved',
          week_start_date: weekStart,
          applicant_username: purchase.applicant_username,
          insurance_type: purchase.insurance_type,
          earnings: brokerReward.earnings,
          experience_points: brokerReward.experience_points,
          new_level: brokerReward.new_level,
          reward_skipped_reason: brokerReward.reward_skipped_reason,
        });
      }

      const refundAmount = parseFloat(String(purchase.total_cost));
      const accountRow = await client.query(
        'SELECT id, balance FROM accounts WHERE user_id = $1 FOR UPDATE',
        [purchase.user_id]
      );
      const account = accountRow.rows[0];
      if (!account) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Applicant account not found for refund' });
      }

      const newBalance = Math.round((parseFloat(account.balance) + refundAmount) * 100) / 100;
      await client.query('UPDATE accounts SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
        newBalance,
        account.id,
      ]);
      await client.query(
        `INSERT INTO transactions (to_account_id, amount, transaction_type, description)
         VALUES ($1, $2, 'insurance', $3)`,
        [
          account.id,
          refundAmount,
          `Insurance refund — ${purchase.insurance_type} request denied${denialReason ? `: ${denialReason}` : ''}`,
        ]
      );
      await client.query(
        `UPDATE insurance_purchases
         SET status = 'denied',
             reviewed_by = $1,
             reviewed_at = CURRENT_TIMESTAMP,
             denial_reason = $2
         WHERE id = $3`,
        [req.user.id, denialReason?.trim() || null, requestId]
      );
      await client.query('COMMIT');

      res.json({
        success: true,
        status: 'denied',
        refunded: refundAmount,
        applicant_username: purchase.applicant_username,
        insurance_type: purchase.insurance_type,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Insurance broker review error:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }
);

// GET /api/insurance/broker/pending-claims - Insurance broker: pending clinic claim approvals
router.get('/broker/pending-claims', authenticateToken, requireTenant, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can access broker tools' });
    }

    const reviewer = await getUserWithJob(req.user.id);
    if (!reviewer || !isInsuranceBrokerJob(reviewer.job_name)) {
      return res.status(403).json({ error: 'Only the town insurance broker can review insurance claims' });
    }
    if (!reviewer.class) {
      return res.status(400).json({ error: 'You must belong to a town class to review insurance claims' });
    }

    const rows = await database.query(
      `SELECT a.id, a.illness_type, a.cure_fee, a.insurance_claim_requested_at,
              p.username AS patient_username,
              COALESCE(NULLIF(TRIM(CONCAT(p.first_name, ' ', p.last_name)), ''), p.username) AS patient_display_name
       FROM doctor_illness_assignments a
       JOIN users p ON p.id = a.patient_user_id
       WHERE a.town_class = $1
         AND a.school_id IS NOT DISTINCT FROM $2
         AND a.insurance_claim_requested_at IS NOT NULL
         AND a.cure_requested_at IS NULL
         AND a.cured_at IS NULL
         AND a.patient_user_id != $3
       ORDER BY a.insurance_claim_requested_at ASC`,
      [reviewer.class, reviewer.school_id ?? null, req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Insurance broker pending claims error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/insurance/broker/claims/:assignmentId/review - Insurance broker: approve/deny clinic claim
router.put(
  '/broker/claims/:assignmentId/review',
  authenticateToken,
  requireTenant,
  body('status').isIn(['approved', 'denied']),
  body('denial_reason').optional().isString(),
  async (req: AuthenticatedRequest, res: Response) => {
    const client = await database.pool.connect();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.user || req.user.role !== 'student') {
        return res.status(403).json({ error: 'Only students can review insurance claims' });
      }

      const reviewer = await getUserWithJob(req.user.id);
      if (!reviewer || !isInsuranceBrokerJob(reviewer.job_name)) {
        return res.status(403).json({ error: 'Only the town insurance broker can review insurance claims' });
      }
      if (!reviewer.class) {
        return res.status(400).json({ error: 'You must belong to a town class to review insurance claims' });
      }

      const assignmentId = parseInt(String(req.params.assignmentId), 10);
      if (!assignmentId || Number.isNaN(assignmentId)) {
        return res.status(400).json({ error: 'Invalid assignment id' });
      }

      const { status, denial_reason: denialReason } = req.body as {
        status: 'approved' | 'denied';
        denial_reason?: string;
      };

      const assignment = await database.get(
        `SELECT a.*, p.username AS patient_username,
                COALESCE(NULLIF(TRIM(CONCAT(p.first_name, ' ', p.last_name)), ''), p.username) AS patient_display_name
         FROM doctor_illness_assignments a
         JOIN users p ON p.id = a.patient_user_id
         WHERE a.id = $1`,
        [assignmentId]
      );

      if (
        !assignment ||
        !assignment.insurance_claim_requested_at ||
        assignment.cure_requested_at ||
        assignment.cured_at
      ) {
        return res.status(404).json({ error: 'Insurance claim not found or already reviewed' });
      }
      if (assignment.town_class !== reviewer.class) {
        return res.status(403).json({ error: 'You can only review insurance claims for your town class' });
      }
      if ((assignment.school_id ?? null) !== (reviewer.school_id ?? null)) {
        return res.status(403).json({ error: 'You can only review insurance claims in your school' });
      }
      if (assignment.patient_user_id === req.user.id) {
        return res.status(400).json({ error: 'You cannot approve your own insurance claim' });
      }

      await client.query('BEGIN');

      if (status === 'denied') {
        await client.query(
          `UPDATE doctor_illness_assignments
           SET insurance_claim_requested_at = NULL,
               insurance_claim_reviewed_by = $1,
               insurance_claim_reviewed_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [req.user.id, assignmentId]
        );
        await client.query('COMMIT');
        return res.json({
          success: true,
          status: 'denied',
          patient_username: assignment.patient_username,
          patient_display_name: assignment.patient_display_name,
        });
      }

      const doctorAccount = await database.get('SELECT id FROM accounts WHERE user_id = $1', [
        assignment.assigned_by_user_id,
      ]);
      if (!doctorAccount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Doctor bank account not found for insurance payment' });
      }

      const cureFee = parseFloat(String(assignment.cure_fee ?? 0));
      await payHealthInsuranceClinicClaim(
        client,
        assignmentId,
        assignment.assigned_by_user_id,
        doctorAccount.id,
        cureFee,
        assignment.illness_type,
        { townClass: assignment.town_class, schoolId: assignment.school_id ?? null }
      );
      await client.query(
        `UPDATE doctor_illness_assignments
         SET insurance_claim_reviewed_by = $1,
             insurance_claim_reviewed_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [req.user.id, assignmentId]
      );

      let brokerReward = { earnings: 0, experience_points: 0, new_level: null as number | null, reward_skipped_reason: null as string | null };
      try {
        brokerReward = await awardInsuranceBroker(
          client,
          req.user.id,
          reviewer.username,
          reviewer.school_id ?? null,
          reviewer.class,
          'Insurance clinic claim approval',
          { referenceAmount: cureFee }
        );
      } catch (rewardError) {
        await client.query('ROLLBACK');
        const msg = rewardError instanceof Error ? rewardError.message : 'Could not pay broker earnings';
        return res.status(400).json({ error: msg });
      }

      await client.query('COMMIT');
      res.json({
        success: true,
        status: 'approved',
        patient_username: assignment.patient_username,
        patient_display_name: assignment.patient_display_name,
        cure_fee: cureFee,
        earnings: brokerReward.earnings,
        experience_points: brokerReward.experience_points,
        new_level: brokerReward.new_level,
        reward_skipped_reason: brokerReward.reward_skipped_reason,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Insurance broker claim review error:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }
);

// GET /api/insurance/broker/pending-cyber-claims - Insurance broker: pending IT repair claim approvals
router.get('/broker/pending-cyber-claims', authenticateToken, requireTenant, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can access broker tools' });
    }

    const reviewer = await getUserWithJob(req.user.id);
    if (!reviewer || !isInsuranceBrokerJob(reviewer.job_name)) {
      return res.status(403).json({ error: 'Only the town insurance broker can review insurance claims' });
    }
    if (!reviewer.class) {
      return res.status(400).json({ error: 'You must belong to a town class to review insurance claims' });
    }

    try {
      await database.query('SELECT 1 FROM cyber_attack_assignments LIMIT 1');
    } catch {
      return res.json([]);
    }

    const rows = await database.query(
      `SELECT a.id, a.attack_type, a.repair_fee, a.insurance_claim_requested_at,
              v.username AS victim_username,
              COALESCE(NULLIF(TRIM(CONCAT(v.first_name, ' ', v.last_name)), ''), v.username) AS victim_display_name
       FROM cyber_attack_assignments a
       JOIN users v ON v.id = a.victim_user_id
       WHERE a.town_class = $1
         AND a.school_id IS NOT DISTINCT FROM $2
         AND a.insurance_claim_requested_at IS NOT NULL
         AND a.repair_requested_at IS NULL
         AND a.repaired_at IS NULL
         AND a.victim_user_id != $3
       ORDER BY a.insurance_claim_requested_at ASC`,
      [reviewer.class, reviewer.school_id ?? null, req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Insurance broker pending cyber claims error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/insurance/broker/cyber-claims/:assignmentId/review - Insurance broker: approve/deny IT repair claim
router.put(
  '/broker/cyber-claims/:assignmentId/review',
  authenticateToken,
  requireTenant,
  body('status').isIn(['approved', 'denied']),
  body('denial_reason').optional().isString(),
  async (req: AuthenticatedRequest, res: Response) => {
    const client = await database.pool.connect();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.user || req.user.role !== 'student') {
        return res.status(403).json({ error: 'Only students can review insurance claims' });
      }

      const reviewer = await getUserWithJob(req.user.id);
      if (!reviewer || !isInsuranceBrokerJob(reviewer.job_name)) {
        return res.status(403).json({ error: 'Only the town insurance broker can review insurance claims' });
      }
      if (!reviewer.class) {
        return res.status(400).json({ error: 'You must belong to a town class to review insurance claims' });
      }

      const assignmentId = parseInt(String(req.params.assignmentId), 10);
      if (!assignmentId || Number.isNaN(assignmentId)) {
        return res.status(400).json({ error: 'Invalid assignment id' });
      }

      const { status, denial_reason: denialReason } = req.body as {
        status: 'approved' | 'denied';
        denial_reason?: string;
      };

      const assignment = await database.get(
        `SELECT a.*, v.username AS victim_username,
                COALESCE(NULLIF(TRIM(CONCAT(v.first_name, ' ', v.last_name)), ''), v.username) AS victim_display_name
         FROM cyber_attack_assignments a
         JOIN users v ON v.id = a.victim_user_id
         WHERE a.id = $1`,
        [assignmentId]
      );

      if (
        !assignment ||
        !assignment.insurance_claim_requested_at ||
        assignment.repair_requested_at ||
        assignment.repaired_at
      ) {
        return res.status(404).json({ error: 'Insurance claim not found or already reviewed' });
      }
      if (assignment.town_class !== reviewer.class) {
        return res.status(403).json({ error: 'You can only review insurance claims for your town class' });
      }
      if ((assignment.school_id ?? null) !== (reviewer.school_id ?? null)) {
        return res.status(403).json({ error: 'You can only review insurance claims in your school' });
      }
      if (assignment.victim_user_id === req.user.id) {
        return res.status(400).json({ error: 'You cannot approve your own insurance claim' });
      }

      await client.query('BEGIN');

      if (status === 'denied') {
        await client.query(
          `UPDATE cyber_attack_assignments
           SET insurance_claim_requested_at = NULL,
               insurance_claim_reviewed_by = $1,
               insurance_claim_reviewed_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [req.user.id, assignmentId]
        );
        await client.query('COMMIT');
        return res.json({
          success: true,
          status: 'denied',
          victim_username: assignment.victim_username,
          victim_display_name: assignment.victim_display_name,
        });
      }

      const engineerAccount = await database.get('SELECT id FROM accounts WHERE user_id = $1', [
        assignment.assigned_by_user_id,
      ]);
      if (!engineerAccount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Software Engineer bank account not found for insurance payment' });
      }

      const repairFee = parseFloat(String(assignment.repair_fee ?? 0));
      await payCyberInsuranceRepairClaim(
        client,
        assignmentId,
        engineerAccount.id,
        repairFee,
        assignment.attack_type
      );
      await client.query(
        `UPDATE cyber_attack_assignments
         SET insurance_claim_reviewed_by = $1,
             insurance_claim_reviewed_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [req.user.id, assignmentId]
      );

      let brokerReward = { earnings: 0, experience_points: 0, new_level: null as number | null, reward_skipped_reason: null as string | null };
      try {
        brokerReward = await awardInsuranceBroker(
          client,
          req.user.id,
          reviewer.username,
          reviewer.school_id ?? null,
          reviewer.class,
          'Insurance cyber repair claim approval',
          { referenceAmount: repairFee }
        );
      } catch (rewardError) {
        await client.query('ROLLBACK');
        const msg = rewardError instanceof Error ? rewardError.message : 'Could not pay broker earnings';
        return res.status(400).json({ error: msg });
      }

      await client.query('COMMIT');
      res.json({
        success: true,
        status: 'approved',
        victim_username: assignment.victim_username,
        victim_display_name: assignment.victim_display_name,
        repair_fee: repairFee,
        earnings: brokerReward.earnings,
        experience_points: brokerReward.experience_points,
        new_level: brokerReward.new_level,
        reward_skipped_reason: brokerReward.reward_skipped_reason,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Insurance broker cyber claim review error:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }
);

// GET /api/insurance/purchases - Teacher: all purchases with filters
router.get('/purchases', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.schoolId ?? req.user?.school_id ?? null;
    if (schoolId === null) {
      return res.status(403).json({ error: 'School context required' });
    }

    const classFilter = req.query.class as string | undefined;
    const typeFilter = req.query.type as string | undefined;
    const username = req.query.username as string | undefined;

    let sql = `
      SELECT ip.id, ip.user_id, ip.insurance_type, ip.weeks, ip.total_cost, ip.week_start_date, ip.created_at,
             ip.status, ip.reviewed_at, ip.denial_reason, ip.refunded_at, ip.refund_amount,
             u.username, u.first_name, u.last_name, u.class
      FROM insurance_purchases ip
      JOIN users u ON ip.user_id = u.id
      WHERE u.school_id = $1 AND u.role = 'student'
    `;
    const params: (string | number)[] = [schoolId];

    if (classFilter) {
      params.push(classFilter);
      sql += ` AND u.class = $${params.length}`;
    }
    if (typeFilter && VALID_TYPES.includes(typeFilter as typeof VALID_TYPES[number])) {
      params.push(typeFilter);
      sql += ` AND ip.insurance_type = $${params.length}`;
    }
    if (username) {
      params.push(username);
      sql += ` AND u.username = $${params.length}`;
    }

    sql += ' ORDER BY ip.created_at DESC';

    const rows = await database.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Insurance purchases list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/insurance/type-settings - Teacher: which insurance types students can buy
router.get(
  '/type-settings',
  authenticateToken,
  requireTenant,
  requireRole(['teacher']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId ?? req.user?.school_id ?? null;
      if (schoolId === null) {
        return res.status(403).json({ error: 'School context required' });
      }
      const types = await getInsuranceTypeSettings(schoolId);
      res.json({ types });
    } catch (error) {
      console.error('Insurance type settings get error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /api/insurance/type-settings/:type - Teacher: enable or disable an insurance type for the school
router.put(
  '/type-settings/:type',
  authenticateToken,
  requireTenant,
  requireRole(['teacher']),
  body('enabled').isBoolean().withMessage('enabled must be true or false'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const schoolId = req.schoolId ?? req.user?.school_id ?? null;
      if (schoolId === null) {
        return res.status(403).json({ error: 'School context required' });
      }

      const insuranceType = String(req.params.type).toLowerCase();
      if (!VALID_TYPES.includes(insuranceType as typeof VALID_TYPES[number])) {
        return res.status(400).json({ error: 'Invalid insurance type' });
      }

      const { enabled } = req.body as { enabled: boolean };

      if (!enabled) {
        const currentlyEnabled = await getEnabledInsuranceTypes(schoolId);
        if (currentlyEnabled.length <= 1 && currentlyEnabled.includes(insuranceType as typeof VALID_TYPES[number])) {
          return res.status(400).json({ error: 'At least one insurance type must remain available' });
        }
      }

      await setInsuranceTypeEnabled(
        schoolId,
        insuranceType as typeof VALID_TYPES[number],
        enabled,
        req.user!.id
      );

      const types = await getInsuranceTypeSettings(schoolId);
      res.json({ types });
    } catch (error) {
      console.error('Insurance type settings update error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/insurance/purchases/:id/refund - Teacher: refund 90% of insurance premium
router.post(
  '/purchases/:id/refund',
  authenticateToken,
  requireTenant,
  requireRole(['teacher']),
  async (req: AuthenticatedRequest, res: Response) => {
    const client = await database.pool.connect();
    try {
      const schoolId = req.schoolId ?? req.user?.school_id ?? null;
      if (schoolId === null) {
        return res.status(403).json({ error: 'School context required' });
      }

      const purchaseId = parseInt(String(req.params.id), 10);
      if (!purchaseId || Number.isNaN(purchaseId)) {
        return res.status(400).json({ error: 'Invalid purchase id' });
      }

      const purchase = await database.get(
        `SELECT ip.*, u.username AS student_username
         FROM insurance_purchases ip
         JOIN users u ON u.id = ip.user_id
         WHERE ip.id = $1 AND u.school_id = $2 AND u.role = 'student'`,
        [purchaseId, schoolId]
      );

      if (!purchase) {
        return res.status(404).json({ error: 'Insurance purchase not found' });
      }

      const status = String(purchase.status || '').toLowerCase();
      if (status === 'refunded') {
        return res.status(400).json({ error: 'This insurance purchase has already been refunded' });
      }
      if (status === 'denied') {
        return res.status(400).json({ error: 'Denied insurance requests were already refunded in full' });
      }
      if (!canTeacherRefundInsuranceStatus(status)) {
        return res.status(400).json({ error: 'This insurance purchase cannot be refunded' });
      }

      const totalCost = parseFloat(String(purchase.total_cost));
      if (isNaN(totalCost) || totalCost <= 0) {
        return res.status(400).json({ error: 'Invalid purchase amount' });
      }

      const refundAmount = calculateTeacherRefundAmount(totalCost);
      if (refundAmount <= 0) {
        return res.status(400).json({ error: 'Invalid refund amount' });
      }

      await client.query('BEGIN');

      const accountRow = await client.query(
        'SELECT id, balance FROM accounts WHERE user_id = $1 FOR UPDATE',
        [purchase.user_id]
      );
      const account = accountRow.rows[0];
      if (!account) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Student account not found for refund' });
      }

      const newBalance = Math.round((parseFloat(account.balance) + refundAmount) * 100) / 100;
      await client.query('UPDATE accounts SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
        newBalance,
        account.id,
      ]);

      const typeLabels: Record<string, string> = { health: 'Health', cyber: 'Cyber', property: 'Property' };
      const typeLabel = typeLabels[purchase.insurance_type] || purchase.insurance_type;
      await client.query(
        `INSERT INTO transactions (to_account_id, amount, transaction_type, description)
         VALUES ($1, $2, 'insurance', $3)`,
        [
          account.id,
          refundAmount,
          `Insurance refund (90%) — ${typeLabel} (${purchase.weeks} wk) for ${purchase.student_username}`,
        ]
      );

      await client.query(
        `UPDATE insurance_purchases
         SET status = 'refunded',
             refund_amount = $1,
             refunded_at = CURRENT_TIMESTAMP,
             refunded_by = $2
         WHERE id = $3`,
        [refundAmount, req.user!.id, purchaseId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        refund_amount: refundAmount,
        original_cost: totalCost,
        refund_percent: INSURANCE_TEACHER_REFUND_RATE * 100,
        student_username: purchase.student_username,
        insurance_type: purchase.insurance_type,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Insurance teacher refund error:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }
);

// GET /api/insurance/classes - Teacher: list classes that have insurance purchases
router.get('/classes', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.schoolId ?? req.user?.school_id ?? null;
    if (schoolId === null) return res.status(403).json({ error: 'School context required' });
    const rows = await database.query(
      `SELECT DISTINCT u.class FROM insurance_purchases ip JOIN users u ON ip.user_id = u.id WHERE u.school_id = $1 AND u.class IS NOT NULL ORDER BY u.class`,
      [schoolId]
    );
    res.json(rows.map((r: { class: string }) => r.class));
  } catch (error) {
    console.error('Insurance classes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { getClassInsuranceBrokers, classRequiresBrokerApproval, hasActiveApprovedHealthInsurance } from '../domain/insurance';
export default router;
