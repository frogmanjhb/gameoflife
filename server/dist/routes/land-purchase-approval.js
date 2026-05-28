"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequiredLandEngineers = getRequiredLandEngineers;
exports.getEngineerApprovalsForRequest = getEngineerApprovalsForRequest;
exports.maybeAdvanceToTeacherReview = maybeAdvanceToTeacherReview;
exports.enrichPurchaseRequestWithEngineers = enrichPurchaseRequestWithEngineers;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
const landPurchaseApproval_1 = require("../domain/landPurchaseApproval");
const router = (0, express_1.Router)();
async function getRequiredLandEngineers(schoolId, townClass, excludeUserId) {
    const params = [townClass];
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
    return database_prod_1.default.query(`SELECT u.id, u.username, u.first_name, u.last_name, j.name AS job_name
     FROM users u
     JOIN jobs j ON j.id = u.job_id
     WHERE u.role = 'student'
       AND u.class = $1
       AND ${schoolFilter}
       AND (
         LOWER(j.name) LIKE '%architect%'
         OR LOWER(j.name) LIKE '%civil engineer%'
       )${excludeFilter}
     ORDER BY u.id`, params);
}
async function getEngineerApprovalsForRequest(requestId) {
    return database_prod_1.default.query(`SELECT lpea.*,
            u.username AS approver_username,
            u.first_name AS approver_first_name,
            u.last_name AS approver_last_name
     FROM land_purchase_engineer_approvals lpea
     JOIN users u ON u.id = lpea.approver_id
     WHERE lpea.request_id = $1
     ORDER BY lpea.approved_at ASC`, [requestId]);
}
async function maybeAdvanceToTeacherReview(requestId, buyerId, schoolId, townClass) {
    const requiredEngineers = await getRequiredLandEngineers(schoolId, townClass, buyerId);
    if (requiredEngineers.length === 0) {
        await database_prod_1.default.run(`UPDATE land_purchase_requests
       SET status = 'pending_teacher', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'pending_engineer'`, [requestId]);
        return;
    }
    const engineerApprovals = await getEngineerApprovalsForRequest(requestId);
    if (engineerApprovals.length >= requiredEngineers.length) {
        await database_prod_1.default.run(`UPDATE land_purchase_requests
       SET status = 'pending_teacher', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'pending_engineer'`, [requestId]);
    }
}
async function enrichPurchaseRequestWithEngineers(request) {
    const townClass = request.parcel_town_class;
    const schoolId = request.school_id ?? null;
    const buyerId = request.user_id;
    const requestId = request.id;
    const status = String(request.status || '').toLowerCase();
    if (status === 'pending_engineer' && townClass && buyerId) {
        await maybeAdvanceToTeacherReview(requestId, buyerId, schoolId, townClass);
        const refreshed = await database_prod_1.default.get('SELECT status FROM land_purchase_requests WHERE id = $1', [requestId]);
        if (refreshed) {
            request.status = refreshed.status;
        }
    }
    const requiredEngineers = townClass && buyerId
        ? await getRequiredLandEngineers(schoolId, townClass, buyerId)
        : [];
    const engineerApprovals = await getEngineerApprovalsForRequest(request.id);
    const offeredPrice = Number(request.offered_price) || 0;
    return {
        ...request,
        required_engineers: requiredEngineers,
        engineer_approvals: engineerApprovals,
        engineer_approvals_received: engineerApprovals.length,
        engineer_approvals_required: requiredEngineers.length,
        engineer_fee_total: (0, landPurchaseApproval_1.calculateTotalEngineerFee)(offeredPrice),
        engineer_fee_per_approver: requiredEngineers.length > 0
            ? (0, landPurchaseApproval_1.calculateEngineerFeeShare)(offeredPrice, requiredEngineers.length)
            : 0,
    };
}
async function getUserWithJob(userId) {
    return database_prod_1.default.get(`SELECT u.id, u.username, u.first_name, u.last_name, u.class, u.school_id, j.name AS job_name
     FROM users u
     LEFT JOIN jobs j ON j.id = u.job_id
     WHERE u.id = $1`, [userId]);
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
         r.username AS reviewer_username
  FROM land_purchase_requests lpr
  JOIN users u ON lpr.user_id = u.id
  JOIN land_parcels lp ON lpr.parcel_id = lp.id
  LEFT JOIN users r ON lpr.reviewed_by = r.id
`;
// PUT /purchase-requests/:id/engineer-review — Architect or Civil Engineer approves/denies
router.put('/purchase-requests/:id/engineer-review', auth_1.authenticateToken, (0, express_validator_1.body)('status').isIn(['approved', 'denied']), (0, express_validator_1.body)('denial_reason').optional().isString(), async (req, res) => {
    const client = await database_prod_1.default.pool.connect();
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students with Architect or Civil Engineer jobs can review purchases' });
        }
        const requestId = parseInt(req.params.id, 10);
        const { status, denial_reason } = req.body;
        const reviewer = await getUserWithJob(req.user.id);
        if (!reviewer || !(0, landPurchaseApproval_1.isLandEngineerJob)(reviewer.job_name)) {
            return res.status(403).json({ error: 'Only Architects and Civil Engineers can review land purchases' });
        }
        const purchaseRequest = await database_prod_1.default.get(`${purchaseRequestSelect} WHERE lpr.id = $1`, [requestId]);
        if (!purchaseRequest || String(purchaseRequest.status).toLowerCase() !== 'pending_engineer') {
            return res.status(404).json({ error: 'Purchase request not found or not awaiting engineer approval' });
        }
        if (reviewer.class !== purchaseRequest.parcel_town_class) {
            return res.status(403).json({ error: 'You can only review purchases in your town class' });
        }
        if ((reviewer.school_id ?? null) !== (purchaseRequest.school_id ?? null)) {
            return res.status(403).json({ error: 'You can only review purchases in your school' });
        }
        if (purchaseRequest.user_id === req.user.id) {
            return res.status(400).json({ error: 'You cannot approve your own purchase request' });
        }
        const requiredEngineers = await getRequiredLandEngineers(purchaseRequest.school_id ?? null, purchaseRequest.parcel_town_class, purchaseRequest.user_id);
        const isRequired = requiredEngineers.some((e) => e.id === req.user.id);
        if (!isRequired) {
            return res.status(403).json({ error: 'You are not a required approver for this purchase' });
        }
        const existingApproval = await database_prod_1.default.get('SELECT id FROM land_purchase_engineer_approvals WHERE request_id = $1 AND approver_id = $2', [requestId, req.user.id]);
        if (existingApproval) {
            return res.status(400).json({ error: 'You have already reviewed this purchase request' });
        }
        await client.query('BEGIN');
        if (status === 'denied') {
            await client.query(`UPDATE land_purchase_requests
           SET status = 'denied',
               denial_reason = $1,
               reviewed_by = $2,
               reviewed_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`, [denial_reason || `Denied by ${reviewer.job_name}`, req.user.id, requestId]);
            await client.query('COMMIT');
            const updated = await enrichPurchaseRequestWithEngineers((await database_prod_1.default.get(`${purchaseRequestSelect} WHERE lpr.id = $1`, [requestId])));
            return res.json({ message: 'Purchase request denied', request: updated });
        }
        const offeredPrice = Number(purchaseRequest.offered_price) || 0;
        const feeShare = (0, landPurchaseApproval_1.calculateEngineerFeeShare)(offeredPrice, requiredEngineers.length);
        const buyerAccountRes = await client.query('SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE', [purchaseRequest.user_id]);
        const engineerAccountRes = await client.query('SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE', [req.user.id]);
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
            await client.query('UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [feeShare, buyerAccount.id]);
            await client.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [feeShare, engineerAccount.id]);
            await client.query(`INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description)
           VALUES ($1, $2, $3, 'transfer', $4)`, [
                buyerAccount.id,
                engineerAccount.id,
                feeShare,
                `Land purchase approval fee: Plot ${purchaseRequest.parcel_grid_code}`,
            ]);
        }
        await client.query(`INSERT INTO land_purchase_engineer_approvals (request_id, approver_id, job_name, fee_amount)
         VALUES ($1, $2, $3, $4)`, [requestId, req.user.id, reviewer.job_name, feeShare]);
        const approvalCountRes = await client.query('SELECT COUNT(*)::int AS count FROM land_purchase_engineer_approvals WHERE request_id = $1', [requestId]);
        const approvalCount = approvalCountRes.rows[0]?.count ?? 0;
        if (approvalCount >= requiredEngineers.length) {
            await client.query(`UPDATE land_purchase_requests
           SET status = 'pending_teacher', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`, [requestId]);
        }
        await client.query('COMMIT');
        const updatedRow = await database_prod_1.default.get(`${purchaseRequestSelect} WHERE lpr.id = $1`, [requestId]);
        const updated = await enrichPurchaseRequestWithEngineers(updatedRow);
        const advanced = approvalCount >= requiredEngineers.length;
        res.json({
            message: advanced
                ? 'Approved — request sent to teacher for final approval'
                : `Approved — you received ${feeShare > 0 ? `R${feeShare}` : 'no fee'}. Waiting for other engineers.`,
            request: updated,
            fee_paid: feeShare,
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Failed engineer review:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
exports.default = router;
//# sourceMappingURL=land-purchase-approval.js.map