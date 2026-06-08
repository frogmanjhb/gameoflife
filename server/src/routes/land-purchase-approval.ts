import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { getXPForLevel } from './jobs';
import { hasFinancialManagerJob } from '../domain/landProperty';
import {
  buildPurchaseCostBreakdown,
  calculateEngineerFeeShare,
  calculateFmFee,
  calculateTotalEngineerFee,
  FM_LAND_REVIEW_XP,
  LAND_ENGINEER_REVIEW_XP,
  isLandEngineerJob,
  RequiredEngineer,
} from '../domain/landPurchaseApproval';

const router = Router();

export async function getRequiredLandEngineers(
  schoolId: number | null,
  townClass: string,
  excludeUserId?: number
): Promise<RequiredEngineer[]> {
  const params: unknown[] = [townClass];
  let schoolFilter = 'u.school_id IS NULL';
  if (schoolId !== null) {
    schoolFilter = 'u.school_id = $2';
    params.push(schoolId);
  }
  let excludeFilter = '';
  if (excludeUserId !== undefined) {
    excludeFilter = ` AND u.id != $${params.length + 1}`;
    params.push(excludeUserId);
  }

  return database.query(
    `SELECT u.id, u.username, u.first_name, u.last_name, j.name AS job_name
     FROM users u
     JOIN jobs j ON j.id = u.job_id
     WHERE u.role = 'student'
       AND u.class = $1
       AND ${schoolFilter}
       AND (
         LOWER(j.name) LIKE '%architect%'
         OR LOWER(j.name) LIKE '%civil engineer%'
       )${excludeFilter}
     ORDER BY u.id`,
    params
  );
}

export async function getEngineerApprovalsForRequest(requestId: number) {
  return database.query(
    `SELECT lpea.*,
            u.username AS approver_username,
            u.first_name AS approver_first_name,
            u.last_name AS approver_last_name
     FROM land_purchase_engineer_approvals lpea
     JOIN users u ON u.id = lpea.approver_id
     WHERE lpea.request_id = $1
     ORDER BY lpea.approved_at ASC`,
    [requestId]
  );
}

export async function maybeAdvanceToTeacherReview(
  requestId: number,
  buyerId: number,
  schoolId: number | null,
  townClass: string
): Promise<void> {
  const requiredEngineers = await getRequiredLandEngineers(schoolId, townClass, buyerId);
  if (requiredEngineers.length === 0) {
    await database.run(
      `UPDATE land_purchase_requests
       SET status = 'pending_teacher', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'pending_engineer'`,
      [requestId]
    );
    return;
  }
  const engineerApprovals = await getEngineerApprovalsForRequest(requestId);
  if (engineerApprovals.length >= requiredEngineers.length) {
    await database.run(
      `UPDATE land_purchase_requests
       SET status = 'pending_teacher', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'pending_engineer'`,
      [requestId]
    );
  }
}

export async function townHasFinancialManager(
  schoolId: number | null,
  townClass: string
): Promise<boolean> {
  const params: unknown[] = [townClass];
  let schoolFilter = 'u.school_id IS NULL';
  if (schoolId !== null) {
    schoolFilter = 'u.school_id = $2';
    params.push(schoolId);
  }
  const row = await database.get(
    `SELECT COUNT(*)::int AS count
     FROM users u
     JOIN jobs j ON j.id = u.job_id
     WHERE u.role = 'student'
       AND u.class = $1
       AND ${schoolFilter}
       AND LOWER(j.name) LIKE '%financial manager%'`,
    params
  );
  return (row?.count ?? 0) > 0;
}

export async function enrichPurchaseRequestWithEngineers(request: Record<string, unknown>) {
  const townClass = request.parcel_town_class as string;
  const schoolId = (request.school_id as number | null | undefined) ?? null;
  const buyerId = request.user_id as number;
  const requestId = request.id as number;
  const status = String(request.status || '').toLowerCase();

  if (status === 'pending_engineer' && townClass && buyerId) {
    await maybeAdvanceToTeacherReview(requestId, buyerId, schoolId, townClass);
    const refreshed = await database.get(
      'SELECT status FROM land_purchase_requests WHERE id = $1',
      [requestId]
    );
    if (refreshed) {
      request.status = refreshed.status;
    }
  }

  const requiredEngineers = townClass && buyerId
    ? await getRequiredLandEngineers(schoolId, townClass, buyerId)
    : [];
  const engineerApprovals = await getEngineerApprovalsForRequest(request.id as number);
  const offeredPrice = Number(request.offered_price) || 0;
  const buyerAccount = await database.get(
    'SELECT balance FROM accounts WHERE user_id = $1',
    [buyerId]
  );
  const buyerBalance = Number(buyerAccount?.balance) || 0;
  const cost_breakdown = buildPurchaseCostBreakdown(
    offeredPrice,
    requiredEngineers.length,
    buyerBalance
  );

  return {
    ...request,
    required_engineers: requiredEngineers,
    engineer_approvals: engineerApprovals,
    engineer_approvals_received: engineerApprovals.length,
    engineer_approvals_required: requiredEngineers.length,
    engineer_fee_total: calculateTotalEngineerFee(offeredPrice, requiredEngineers.length),
    engineer_fee_per_approver:
      requiredEngineers.length > 0
        ? calculateEngineerFeeShare(offeredPrice, requiredEngineers.length)
        : 0,
    professional_fee_total: cost_breakdown.professional_fee_total,
    fm_fee: cost_breakdown.fm_fee,
    cost_breakdown,
  };
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

const purchaseRequestSelect = `
  SELECT lpr.*,
         u.username AS applicant_username,
         u.first_name AS applicant_first_name,
         u.last_name AS applicant_last_name,
         u.class AS applicant_class,
         lp.grid_code AS parcel_grid_code,
         lp.biome_type AS parcel_biome_type,
         lp.value AS parcel_value,
         lp.town_class AS parcel_town_class,
         r.username AS reviewer_username,
         fm.username AS fm_reviewer_username
  FROM land_purchase_requests lpr
  JOIN users u ON lpr.user_id = u.id
  JOIN land_parcels lp ON lpr.parcel_id = lp.id
  LEFT JOIN users r ON lpr.reviewed_by = r.id
  LEFT JOIN users fm ON fm.id = lpr.fm_reviewed_by
`;

// GET /purchase-requests/fm-queue — Financial Manager pending purchase reviews
router.get('/purchase-requests/fm-queue', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== 'student') {
      return res.status(403).json({ error: 'Only students can view the FM purchase queue' });
    }
    const fm = await getUserWithJob(req.user!.id);
    if (!fm || !hasFinancialManagerJob(fm.job_name)) {
      return res.status(403).json({ error: 'Only the Financial Manager can view this queue' });
    }
    if (!fm.class) {
      return res.json([]);
    }
    const schoolId = fm.school_id ?? null;
    const rows = schoolId !== null
      ? await database.query(
          `${purchaseRequestSelect}
           WHERE lpr.status = 'pending_fm'
             AND lp.town_class = $1
             AND lpr.school_id = $2
             AND lpr.user_id != $3
           ORDER BY lpr.created_at ASC`,
          [fm.class, schoolId, req.user!.id]
        )
      : await database.query(
          `${purchaseRequestSelect}
           WHERE lpr.status = 'pending_fm'
             AND lp.town_class = $1
             AND lpr.school_id IS NULL
             AND lpr.user_id != $2
           ORDER BY lpr.created_at ASC`,
          [fm.class, req.user!.id]
        );
    const enriched = await Promise.all(rows.map((row) => enrichPurchaseRequestWithEngineers(row)));
    res.json(enriched);
  } catch (error) {
    console.error('Failed to fetch FM purchase queue:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /purchase-requests/:id/fm-review — Financial Manager approves/denies affordability
router.put('/purchase-requests/:id/fm-review',
  authenticateToken,
  body('status').isIn(['approved', 'denied']),
  body('denial_reason').optional().isString(),
  async (req: AuthenticatedRequest, res: Response) => {
    const client = await database.pool.connect();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      if (req.user!.role !== 'student') {
        return res.status(403).json({ error: 'Only the Financial Manager can review purchases' });
      }

      const requestId = parseInt(req.params.id, 10);
      const { status, denial_reason } = req.body;

      const reviewer = await getUserWithJob(req.user!.id);
      if (!reviewer || !hasFinancialManagerJob(reviewer.job_name)) {
        return res.status(403).json({ error: 'Only the Financial Manager can review purchases' });
      }
      if (!reviewer.class) {
        return res.status(400).json({ error: 'You must belong to a town class to review purchases' });
      }

      const purchaseRequest = await database.get(`${purchaseRequestSelect} WHERE lpr.id = $1`, [requestId]);
      if (!purchaseRequest || String(purchaseRequest.status).toLowerCase() !== 'pending_fm') {
        return res.status(404).json({ error: 'Purchase request not found or not awaiting Financial Manager approval' });
      }
      if (reviewer.class !== purchaseRequest.parcel_town_class) {
        return res.status(403).json({ error: 'You can only review purchases in your town class' });
      }
      if ((reviewer.school_id ?? null) !== (purchaseRequest.school_id ?? null)) {
        return res.status(403).json({ error: 'You can only review purchases in your school' });
      }
      if (purchaseRequest.user_id === req.user!.id) {
        return res.status(400).json({ error: 'You cannot approve your own purchase request' });
      }

      if (status === 'denied') {
        await database.run(
          `UPDATE land_purchase_requests
           SET status = 'denied',
               denial_reason = $1,
               fm_reviewed_by = $2,
               fm_reviewed_at = CURRENT_TIMESTAMP,
               reviewed_by = $2,
               reviewed_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [denial_reason || 'Denied by Financial Manager', req.user!.id, requestId]
        );
        const updated = await enrichPurchaseRequestWithEngineers(
          (await database.get(`${purchaseRequestSelect} WHERE lpr.id = $1`, [requestId]))!
        );
        return res.json({ message: 'Purchase request denied', request: updated });
      }

      const offeredPrice = Number(purchaseRequest.offered_price) || 0;
      const requiredEngineers = await getRequiredLandEngineers(
        purchaseRequest.school_id ?? null,
        purchaseRequest.parcel_town_class,
        purchaseRequest.user_id
      );
      const fmFee = calculateFmFee(offeredPrice, requiredEngineers.length);

      await client.query('BEGIN');

      const buyerAccountRes = await client.query(
        'SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE',
        [purchaseRequest.user_id]
      );
      const fmAccountRes = await client.query(
        'SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE',
        [req.user!.id]
      );
      const buyerAccount = buyerAccountRes.rows[0];
      const fmAccount = fmAccountRes.rows[0];
      if (!buyerAccount || !fmAccount) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Buyer or Financial Manager account not found' });
      }

      const buyerBalance = parseFloat(buyerAccount.balance);
      const affordability = buildPurchaseCostBreakdown(
        offeredPrice,
        requiredEngineers.length,
        buyerBalance
      );
      if (!affordability.can_afford) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Buyer cannot afford total cost of R${affordability.total_required} (plot R${affordability.plot_price} + professional fees R${affordability.professional_fee_total})`,
          cost_breakdown: affordability,
        });
      }

      if (fmFee > 0) {
        await client.query(
          'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [fmFee, buyerAccount.id]
        );
        await client.query(
          'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [fmFee, fmAccount.id]
        );
        await client.query(
          `INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description)
           VALUES ($1, $2, $3, 'transfer', $4)`,
          [
            buyerAccount.id,
            fmAccount.id,
            fmFee,
            `Land purchase FM review fee: Plot ${purchaseRequest.parcel_grid_code}`,
          ]
        );
      }

      const nextStatus = requiredEngineers.length > 0 ? 'pending_engineer' : 'pending_teacher';
      await client.query(
        `UPDATE land_purchase_requests
         SET status = $1,
             fm_reviewed_by = $2,
             fm_reviewed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [nextStatus, req.user!.id, requestId]
      );

      const userRowResult = await client.query(
        'SELECT job_level, job_experience_points FROM users WHERE id = $1 FOR UPDATE',
        [req.user!.id]
      );
      const userRow = userRowResult.rows[0];
      const currentLevel = Number.isInteger(userRow?.job_level) ? userRow.job_level : 1;
      const currentXP = typeof userRow?.job_experience_points === 'number' ? userRow.job_experience_points : 0;
      const newXP = currentXP + FM_LAND_REVIEW_XP;
      let newLevel = currentLevel;
      for (let level = currentLevel; level < 10; level++) {
        if (newXP >= getXPForLevel(level + 1)) newLevel = level + 1;
        else break;
      }
      await client.query(
        'UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3',
        [newXP, newLevel, req.user!.id]
      );

      await client.query('COMMIT');

      const updatedRow = await database.get(`${purchaseRequestSelect} WHERE lpr.id = $1`, [requestId]);
      const updated = await enrichPurchaseRequestWithEngineers(updatedRow);
      res.json({
        message:
          nextStatus === 'pending_engineer'
            ? 'Approved — sent to Architects and Civil Engineers for review'
            : 'Approved — sent to teacher for final approval',
        request: updated,
        fee_paid: fmFee,
        cost_breakdown: affordability,
        experience_points: FM_LAND_REVIEW_XP,
        new_level: newLevel > currentLevel ? newLevel : null,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed FM purchase review:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }
);

// PUT /purchase-requests/:id/engineer-review — Architect or Civil Engineer approves only
router.put('/purchase-requests/:id/engineer-review',
  authenticateToken,
  body('status').isIn(['approved']),
  async (req: AuthenticatedRequest, res: Response) => {
    const client = await database.pool.connect();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (req.user!.role !== 'student') {
        return res.status(403).json({ error: 'Only students with Architect or Civil Engineer jobs can review purchases' });
      }

      const requestId = parseInt(req.params.id, 10);

      const reviewer = await getUserWithJob(req.user!.id);
      if (!reviewer || !isLandEngineerJob(reviewer.job_name)) {
        return res.status(403).json({ error: 'Only Architects and Civil Engineers can review land purchases' });
      }

      const purchaseRequest = await database.get(`${purchaseRequestSelect} WHERE lpr.id = $1`, [requestId]);
      if (!purchaseRequest || String(purchaseRequest.status).toLowerCase() !== 'pending_engineer') {
        return res.status(404).json({ error: 'Purchase request not found or not awaiting engineer approval' });
      }

      if (reviewer.class !== purchaseRequest.parcel_town_class) {
        return res.status(403).json({ error: 'You can only review purchases in your town class' });
      }
      if ((reviewer.school_id ?? null) !== (purchaseRequest.school_id ?? null)) {
        return res.status(403).json({ error: 'You can only review purchases in your school' });
      }
      if (purchaseRequest.user_id === req.user!.id) {
        return res.status(400).json({ error: 'You cannot approve your own purchase request' });
      }

      const requiredEngineers = await getRequiredLandEngineers(
        purchaseRequest.school_id ?? null,
        purchaseRequest.parcel_town_class,
        purchaseRequest.user_id
      );
      const isRequired = requiredEngineers.some((e) => e.id === req.user!.id);
      if (!isRequired) {
        return res.status(403).json({ error: 'You are not a required approver for this purchase' });
      }

      const existingApproval = await database.get(
        'SELECT id FROM land_purchase_engineer_approvals WHERE request_id = $1 AND approver_id = $2',
        [requestId, req.user!.id]
      );
      if (existingApproval) {
        return res.status(400).json({ error: 'You have already reviewed this purchase request' });
      }

      await client.query('BEGIN');

      const offeredPrice = Number(purchaseRequest.offered_price) || 0;
      const feeShare = calculateEngineerFeeShare(offeredPrice, requiredEngineers.length);

      const buyerAccountRes = await client.query(
        'SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE',
        [purchaseRequest.user_id]
      );
      const engineerAccountRes = await client.query(
        'SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE',
        [req.user!.id]
      );
      const buyerAccount = buyerAccountRes.rows[0];
      const engineerAccount = engineerAccountRes.rows[0];
      if (!buyerAccount || !engineerAccount) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Buyer or engineer account not found' });
      }

      const buyerBalance = parseFloat(buyerAccount.balance);
      if (buyerBalance < feeShare) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Buyer has insufficient balance for the ${feeShare > 0 ? 'approval fee' : 'purchase'}`,
        });
      }

      if (feeShare > 0) {
        await client.query(
          'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [feeShare, buyerAccount.id]
        );
        await client.query(
          'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [feeShare, engineerAccount.id]
        );
        await client.query(
          `INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description)
           VALUES ($1, $2, $3, 'transfer', $4)`,
          [
            buyerAccount.id,
            engineerAccount.id,
            feeShare,
            `Land purchase approval fee: Plot ${purchaseRequest.parcel_grid_code}`,
          ]
        );
      }

      await client.query(
        `INSERT INTO land_purchase_engineer_approvals (request_id, approver_id, job_name, fee_amount)
         VALUES ($1, $2, $3, $4)`,
        [requestId, req.user!.id, reviewer.job_name, feeShare]
      );

      const approvalCountRes = await client.query(
        'SELECT COUNT(*)::int AS count FROM land_purchase_engineer_approvals WHERE request_id = $1',
        [requestId]
      );
      const approvalCount = approvalCountRes.rows[0]?.count ?? 0;

      if (approvalCount >= requiredEngineers.length) {
        await client.query(
          `UPDATE land_purchase_requests
           SET status = 'pending_teacher', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [requestId]
        );
      }

      let engineerXpAwarded = 0;
      let engineerNewLevel: number | null = null;
      if (isLandEngineerJob(reviewer.job_name)) {
        const engineerUserResult = await client.query(
          'SELECT job_level, job_experience_points FROM users WHERE id = $1 FOR UPDATE',
          [req.user!.id]
        );
        const engineerUser = engineerUserResult.rows[0];
        const currentLevel = Number.isInteger(engineerUser?.job_level) ? engineerUser.job_level : 1;
        const currentXP = typeof engineerUser?.job_experience_points === 'number' ? engineerUser.job_experience_points : 0;
        const newXP = currentXP + LAND_ENGINEER_REVIEW_XP;
        let newLevel = currentLevel;
        for (let level = currentLevel; level < 10; level++) {
          if (newXP >= getXPForLevel(level + 1)) newLevel = level + 1;
          else break;
        }
        await client.query(
          'UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3',
          [newXP, newLevel, req.user!.id]
        );
        engineerXpAwarded = LAND_ENGINEER_REVIEW_XP;
        engineerNewLevel = newLevel > currentLevel ? newLevel : null;
      }

      await client.query('COMMIT');

      const updatedRow = await database.get(`${purchaseRequestSelect} WHERE lpr.id = $1`, [requestId]);
      const updated = await enrichPurchaseRequestWithEngineers(updatedRow);
      const advanced = approvalCount >= requiredEngineers.length;
      res.json({
        message: advanced
          ? 'Approved — request sent to teacher for final approval'
          : `Approved — you received ${feeShare > 0 ? `R${feeShare}` : 'no fee'}. Waiting for other engineers.`,
        request: updated,
        fee_paid: feeShare,
        experience_points: engineerXpAwarded,
        new_level: engineerNewLevel,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed engineer review:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }
);

export default router;
