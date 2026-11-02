"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEACHER_TRANSFER_APPROVE_ALL_MAX = exports.STUDENT_TRANSFER_BURST_LIMIT = exports.STUDENT_TRANSFER_BURST_MINUTES = exports.STUDENT_MAX_PENDING_TRANSFERS = exports.STUDENT_PEER_TRANSFER_MIN_AMOUNT = exports.STUDENT_TRANSFER_DAILY_LIMIT = void 0;
exports.countStudentTransferRequestsToday = countStudentTransferRequestsToday;
exports.countPendingTransfersForUser = countPendingTransfersForUser;
exports.getStudentTransferLimitStatus = getStudentTransferLimitStatus;
exports.getStudentTransferLimitStatusForUser = getStudentTransferLimitStatusForUser;
exports.dailyTransferLimitReason = dailyTransferLimitReason;
exports.peerTransferMinAmountReason = peerTransferMinAmountReason;
exports.pendingTransferCapReason = pendingTransferCapReason;
exports.transferBurstLimitReason = transferBurstLimitReason;
exports.validatePeerTransferAmount = validatePeerTransferAmount;
exports.assertCanCreateStudentTransferRequest = assertCanCreateStudentTransferRequest;
exports.createStudentTransferRequest = createStudentTransferRequest;
exports.validatePeerTransferForApproval = validatePeerTransferForApproval;
const database_prod_1 = __importDefault(require("../database/database-prod"));
/** Max student-initiated peer transfer requests per calendar day (server date). */
exports.STUDENT_TRANSFER_DAILY_LIMIT = 3;
/** Minimum amount for student peer transfer requests (blocks micro-transfer abuse). */
exports.STUDENT_PEER_TRANSFER_MIN_AMOUNT = 5;
/** Max concurrent pending transfer requests per student. */
exports.STUDENT_MAX_PENDING_TRANSFERS = 3;
/** Rolling window for burst detection on new transfer requests. */
exports.STUDENT_TRANSFER_BURST_MINUTES = 5;
/** Max transfer requests created within the burst window. */
exports.STUDENT_TRANSFER_BURST_LIMIT = 3;
/** Max transfers a teacher may approve in one approve-all action. */
exports.TEACHER_TRANSFER_APPROVE_ALL_MAX = 25;
async function countStudentTransferRequestsToday(fromUserId) {
    const row = await database_prod_1.default.get(`SELECT COUNT(*)::int AS count
     FROM pending_transfers
     WHERE from_user_id = $1
       AND created_at::date = CURRENT_DATE`, [fromUserId]);
    return row?.count ?? 0;
}
async function countPendingTransfersForUser(fromUserId) {
    const row = await database_prod_1.default.get(`SELECT COUNT(*)::int AS count
     FROM pending_transfers
     WHERE from_user_id = $1 AND status = 'pending'`, [fromUserId]);
    return row?.count ?? 0;
}
async function countTransferRequestsInBurstWindow(fromUserId) {
    const row = await database_prod_1.default.get(`SELECT COUNT(*)::int AS count
     FROM pending_transfers
     WHERE from_user_id = $1
       AND created_at >= NOW() - ($2::text || ' minutes')::interval`, [fromUserId, String(exports.STUDENT_TRANSFER_BURST_MINUTES)]);
    return row?.count ?? 0;
}
async function hasDuplicatePendingTransfer(fromUserId, toUserId, amount, description) {
    const row = await database_prod_1.default.get(`SELECT 1 AS found
     FROM pending_transfers
     WHERE from_user_id = $1
       AND to_user_id = $2
       AND status = 'pending'
       AND amount = $3
       AND LOWER(TRIM(description)) = LOWER(TRIM($4))
     LIMIT 1`, [fromUserId, toUserId, amount, description]);
    return Boolean(row?.found);
}
function getStudentTransferLimitStatus(todayCount, pendingCount) {
    const transfers_remaining_today = Math.max(0, exports.STUDENT_TRANSFER_DAILY_LIMIT - todayCount);
    const atPendingCap = pendingCount >= exports.STUDENT_MAX_PENDING_TRANSFERS;
    return {
        transfer_daily_limit: exports.STUDENT_TRANSFER_DAILY_LIMIT,
        transfers_remaining_today,
        canRequestTransfer: transfers_remaining_today > 0 && !atPendingCap,
        peer_transfer_min_amount: exports.STUDENT_PEER_TRANSFER_MIN_AMOUNT,
        pending_transfers_count: pendingCount,
        max_pending_transfers: exports.STUDENT_MAX_PENDING_TRANSFERS,
    };
}
async function getStudentTransferLimitStatusForUser(fromUserId) {
    const [todayCount, pendingCount] = await Promise.all([
        countStudentTransferRequestsToday(fromUserId),
        countPendingTransfersForUser(fromUserId),
    ]);
    return getStudentTransferLimitStatus(todayCount, pendingCount);
}
function dailyTransferLimitReason() {
    return `You can only request ${exports.STUDENT_TRANSFER_DAILY_LIMIT} student transfers per day. Try again tomorrow.`;
}
function peerTransferMinAmountReason() {
    return `Minimum transfer amount is R${exports.STUDENT_PEER_TRANSFER_MIN_AMOUNT.toFixed(2)}.`;
}
function pendingTransferCapReason(pendingCount) {
    return `You already have ${pendingCount} transfer request${pendingCount === 1 ? '' : 's'} waiting for approval. Wait for those to be reviewed before requesting more.`;
}
function transferBurstLimitReason() {
    return `Too many transfer requests in a short time. Please wait a few minutes and try again.`;
}
function validatePeerTransferAmount(amount) {
    const rounded = Math.round(amount * 100) / 100;
    if (isNaN(rounded) || rounded < exports.STUDENT_PEER_TRANSFER_MIN_AMOUNT) {
        return { ok: false, error: peerTransferMinAmountReason() };
    }
    return { ok: true };
}
async function assertCanCreateStudentTransferRequest(fromUserId, toUserId, amount, description) {
    const amountCheck = validatePeerTransferAmount(amount);
    if (!amountCheck.ok) {
        return amountCheck;
    }
    const [todayCount, pendingCount, burstCount] = await Promise.all([
        countStudentTransferRequestsToday(fromUserId),
        countPendingTransfersForUser(fromUserId),
        countTransferRequestsInBurstWindow(fromUserId),
    ]);
    if (todayCount >= exports.STUDENT_TRANSFER_DAILY_LIMIT) {
        return { ok: false, error: dailyTransferLimitReason() };
    }
    if (pendingCount >= exports.STUDENT_MAX_PENDING_TRANSFERS) {
        return { ok: false, error: pendingTransferCapReason(pendingCount) };
    }
    if (burstCount >= exports.STUDENT_TRANSFER_BURST_LIMIT) {
        return { ok: false, error: transferBurstLimitReason() };
    }
    const normalizedDescription = description.trim() || `Transfer request`;
    if (await hasDuplicatePendingTransfer(fromUserId, toUserId, amount, normalizedDescription)) {
        return {
            ok: false,
            error: 'You already have a pending transfer with the same recipient, amount, and description.',
        };
    }
    return { ok: true };
}
async function assertCanCreateStudentTransferRequestInTx(client, fromUserId, toUserId, amount, description) {
    const amountCheck = validatePeerTransferAmount(amount);
    if (!amountCheck.ok) {
        return amountCheck;
    }
    await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [fromUserId]);
    const todayResult = await client.query(`SELECT COUNT(*)::int AS count
     FROM pending_transfers
     WHERE from_user_id = $1 AND created_at::date = CURRENT_DATE`, [fromUserId]);
    const pendingResult = await client.query(`SELECT COUNT(*)::int AS count
     FROM pending_transfers
     WHERE from_user_id = $1 AND status = 'pending'`, [fromUserId]);
    const burstResult = await client.query(`SELECT COUNT(*)::int AS count
     FROM pending_transfers
     WHERE from_user_id = $1
       AND created_at >= NOW() - ($2::text || ' minutes')::interval`, [fromUserId, String(exports.STUDENT_TRANSFER_BURST_MINUTES)]);
    const todayCount = Number(todayResult.rows[0]?.count ?? 0);
    const pendingCount = Number(pendingResult.rows[0]?.count ?? 0);
    const burstCount = Number(burstResult.rows[0]?.count ?? 0);
    if (todayCount >= exports.STUDENT_TRANSFER_DAILY_LIMIT) {
        return { ok: false, error: dailyTransferLimitReason() };
    }
    if (pendingCount >= exports.STUDENT_MAX_PENDING_TRANSFERS) {
        return { ok: false, error: pendingTransferCapReason(pendingCount) };
    }
    if (burstCount >= exports.STUDENT_TRANSFER_BURST_LIMIT) {
        return { ok: false, error: transferBurstLimitReason() };
    }
    const dupResult = await client.query(`SELECT 1 AS found
     FROM pending_transfers
     WHERE from_user_id = $1
       AND to_user_id = $2
       AND status = 'pending'
       AND amount = $3
       AND LOWER(TRIM(description)) = LOWER(TRIM($4))
     LIMIT 1`, [fromUserId, toUserId, amount, description]);
    if (dupResult.rows[0]?.found) {
        return {
            ok: false,
            error: 'You already have a pending transfer with the same recipient, amount, and description.',
        };
    }
    return { ok: true };
}
/** Creates a pending transfer after re-checking limits under row lock (prevents parallel spam). */
async function createStudentTransferRequest(fromUserId, toUserId, amount, description) {
    const normalizedDescription = description.trim() || 'Transfer request';
    const client = await database_prod_1.default.pool.connect();
    try {
        await client.query('BEGIN');
        const guard = await assertCanCreateStudentTransferRequestInTx(client, fromUserId, toUserId, amount, normalizedDescription);
        if (!guard.ok) {
            await client.query('ROLLBACK');
            return guard;
        }
        await client.query(`INSERT INTO pending_transfers (from_user_id, to_user_id, amount, description, status)
       VALUES ($1, $2, $3, $4, 'pending')`, [fromUserId, toUserId, amount, normalizedDescription]);
        await client.query('COMMIT');
        return { ok: true };
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
function validatePeerTransferForApproval(amount) {
    return validatePeerTransferAmount(amount);
}
//# sourceMappingURL=student-transfer-limit.js.map