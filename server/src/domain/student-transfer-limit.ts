import database from '../database/database-prod';

/** Max student-initiated peer transfer requests per calendar day (server date). */
export const STUDENT_TRANSFER_DAILY_LIMIT = 3;

/** Minimum amount for student peer transfer requests (blocks micro-transfer abuse). */
export const STUDENT_PEER_TRANSFER_MIN_AMOUNT = 5;

/** Max concurrent pending transfer requests per student. */
export const STUDENT_MAX_PENDING_TRANSFERS = 3;

/** Rolling window for burst detection on new transfer requests. */
export const STUDENT_TRANSFER_BURST_MINUTES = 5;

/** Max transfer requests created within the burst window. */
export const STUDENT_TRANSFER_BURST_LIMIT = 3;

/** Max transfers a teacher may approve in one approve-all action. */
export const TEACHER_TRANSFER_APPROVE_ALL_MAX = 25;

export type StudentTransferLimitStatus = {
  transfer_daily_limit: number;
  transfers_remaining_today: number;
  canRequestTransfer: boolean;
  peer_transfer_min_amount: number;
  pending_transfers_count: number;
  max_pending_transfers: number;
};

type TxClient = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount?: number }>;
};

export async function countStudentTransferRequestsToday(fromUserId: number): Promise<number> {
  const row = await database.get(
    `SELECT COUNT(*)::int AS count
     FROM pending_transfers
     WHERE from_user_id = $1
       AND created_at::date = CURRENT_DATE`,
    [fromUserId]
  );
  return row?.count ?? 0;
}

export async function countPendingTransfersForUser(fromUserId: number): Promise<number> {
  const row = await database.get(
    `SELECT COUNT(*)::int AS count
     FROM pending_transfers
     WHERE from_user_id = $1 AND status = 'pending'`,
    [fromUserId]
  );
  return row?.count ?? 0;
}

async function countTransferRequestsInBurstWindow(fromUserId: number): Promise<number> {
  const row = await database.get(
    `SELECT COUNT(*)::int AS count
     FROM pending_transfers
     WHERE from_user_id = $1
       AND created_at >= NOW() - ($2::text || ' minutes')::interval`,
    [fromUserId, String(STUDENT_TRANSFER_BURST_MINUTES)]
  );
  return row?.count ?? 0;
}

async function hasDuplicatePendingTransfer(
  fromUserId: number,
  toUserId: number,
  amount: number,
  description: string
): Promise<boolean> {
  const row = await database.get(
    `SELECT 1 AS found
     FROM pending_transfers
     WHERE from_user_id = $1
       AND to_user_id = $2
       AND status = 'pending'
       AND amount = $3
       AND LOWER(TRIM(description)) = LOWER(TRIM($4))
     LIMIT 1`,
    [fromUserId, toUserId, amount, description]
  );
  return Boolean(row?.found);
}

export function getStudentTransferLimitStatus(
  todayCount: number,
  pendingCount: number
): StudentTransferLimitStatus {
  const transfers_remaining_today = Math.max(0, STUDENT_TRANSFER_DAILY_LIMIT - todayCount);
  const atPendingCap = pendingCount >= STUDENT_MAX_PENDING_TRANSFERS;
  return {
    transfer_daily_limit: STUDENT_TRANSFER_DAILY_LIMIT,
    transfers_remaining_today,
    canRequestTransfer: transfers_remaining_today > 0 && !atPendingCap,
    peer_transfer_min_amount: STUDENT_PEER_TRANSFER_MIN_AMOUNT,
    pending_transfers_count: pendingCount,
    max_pending_transfers: STUDENT_MAX_PENDING_TRANSFERS,
  };
}

export async function getStudentTransferLimitStatusForUser(
  fromUserId: number
): Promise<StudentTransferLimitStatus> {
  const [todayCount, pendingCount] = await Promise.all([
    countStudentTransferRequestsToday(fromUserId),
    countPendingTransfersForUser(fromUserId),
  ]);
  return getStudentTransferLimitStatus(todayCount, pendingCount);
}

export function dailyTransferLimitReason(): string {
  return `You can only request ${STUDENT_TRANSFER_DAILY_LIMIT} student transfers per day. Try again tomorrow.`;
}

export function peerTransferMinAmountReason(): string {
  return `Minimum transfer amount is R${STUDENT_PEER_TRANSFER_MIN_AMOUNT.toFixed(2)}.`;
}

export function pendingTransferCapReason(pendingCount: number): string {
  return `You already have ${pendingCount} transfer request${pendingCount === 1 ? '' : 's'} waiting for approval. Wait for those to be reviewed before requesting more.`;
}

export function transferBurstLimitReason(): string {
  return `Too many transfer requests in a short time. Please wait a few minutes and try again.`;
}

export function validatePeerTransferAmount(amount: number): { ok: true } | { ok: false; error: string } {
  const rounded = Math.round(amount * 100) / 100;
  if (isNaN(rounded) || rounded < STUDENT_PEER_TRANSFER_MIN_AMOUNT) {
    return { ok: false, error: peerTransferMinAmountReason() };
  }
  return { ok: true };
}

export async function assertCanCreateStudentTransferRequest(
  fromUserId: number,
  toUserId: number,
  amount: number,
  description: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const amountCheck = validatePeerTransferAmount(amount);
  if (!amountCheck.ok) {
    return amountCheck;
  }

  const [todayCount, pendingCount, burstCount] = await Promise.all([
    countStudentTransferRequestsToday(fromUserId),
    countPendingTransfersForUser(fromUserId),
    countTransferRequestsInBurstWindow(fromUserId),
  ]);

  if (todayCount >= STUDENT_TRANSFER_DAILY_LIMIT) {
    return { ok: false, error: dailyTransferLimitReason() };
  }
  if (pendingCount >= STUDENT_MAX_PENDING_TRANSFERS) {
    return { ok: false, error: pendingTransferCapReason(pendingCount) };
  }
  if (burstCount >= STUDENT_TRANSFER_BURST_LIMIT) {
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

async function assertCanCreateStudentTransferRequestInTx(
  client: TxClient,
  fromUserId: number,
  toUserId: number,
  amount: number,
  description: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const amountCheck = validatePeerTransferAmount(amount);
  if (!amountCheck.ok) {
    return amountCheck;
  }

  await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [fromUserId]);

  const todayResult = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM pending_transfers
     WHERE from_user_id = $1 AND created_at::date = CURRENT_DATE`,
    [fromUserId]
  );
  const pendingResult = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM pending_transfers
     WHERE from_user_id = $1 AND status = 'pending'`,
    [fromUserId]
  );
  const burstResult = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM pending_transfers
     WHERE from_user_id = $1
       AND created_at >= NOW() - ($2::text || ' minutes')::interval`,
    [fromUserId, String(STUDENT_TRANSFER_BURST_MINUTES)]
  );

  const todayCount = Number(todayResult.rows[0]?.count ?? 0);
  const pendingCount = Number(pendingResult.rows[0]?.count ?? 0);
  const burstCount = Number(burstResult.rows[0]?.count ?? 0);

  if (todayCount >= STUDENT_TRANSFER_DAILY_LIMIT) {
    return { ok: false, error: dailyTransferLimitReason() };
  }
  if (pendingCount >= STUDENT_MAX_PENDING_TRANSFERS) {
    return { ok: false, error: pendingTransferCapReason(pendingCount) };
  }
  if (burstCount >= STUDENT_TRANSFER_BURST_LIMIT) {
    return { ok: false, error: transferBurstLimitReason() };
  }

  const dupResult = await client.query(
    `SELECT 1 AS found
     FROM pending_transfers
     WHERE from_user_id = $1
       AND to_user_id = $2
       AND status = 'pending'
       AND amount = $3
       AND LOWER(TRIM(description)) = LOWER(TRIM($4))
     LIMIT 1`,
    [fromUserId, toUserId, amount, description]
  );
  if (dupResult.rows[0]?.found) {
    return {
      ok: false,
      error: 'You already have a pending transfer with the same recipient, amount, and description.',
    };
  }

  return { ok: true };
}

/** Creates a pending transfer after re-checking limits under row lock (prevents parallel spam). */
export async function createStudentTransferRequest(
  fromUserId: number,
  toUserId: number,
  amount: number,
  description: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalizedDescription = description.trim() || 'Transfer request';
  const client = await database.pool.connect();
  try {
    await client.query('BEGIN');
    const guard = await assertCanCreateStudentTransferRequestInTx(
      client,
      fromUserId,
      toUserId,
      amount,
      normalizedDescription
    );
    if (!guard.ok) {
      await client.query('ROLLBACK');
      return guard;
    }
    await client.query(
      `INSERT INTO pending_transfers (from_user_id, to_user_id, amount, description, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [fromUserId, toUserId, amount, normalizedDescription]
    );
    await client.query('COMMIT');
    return { ok: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export function validatePeerTransferForApproval(
  amount: number
): { ok: true } | { ok: false; error: string } {
  return validatePeerTransferAmount(amount);
}
