import database from '../database/database-prod';

/** Max student-initiated peer transfer requests per calendar day (server date). */
export const STUDENT_TRANSFER_DAILY_LIMIT = 3;

export type StudentTransferLimitStatus = {
  transfer_daily_limit: number;
  transfers_remaining_today: number;
  canRequestTransfer: boolean;
};

export async function countStudentTransferRequestsToday(fromUserId: number): Promise<number> {
  const row = await database.get<{ count: number }>(
    `SELECT COUNT(*)::int AS count
     FROM pending_transfers
     WHERE from_user_id = $1
       AND created_at::date = CURRENT_DATE`,
    [fromUserId]
  );
  return row?.count ?? 0;
}

export function getStudentTransferLimitStatus(todayCount: number): StudentTransferLimitStatus {
  const transfers_remaining_today = Math.max(0, STUDENT_TRANSFER_DAILY_LIMIT - todayCount);
  return {
    transfer_daily_limit: STUDENT_TRANSFER_DAILY_LIMIT,
    transfers_remaining_today,
    canRequestTransfer: transfers_remaining_today > 0,
  };
}

export async function getStudentTransferLimitStatusForUser(
  fromUserId: number
): Promise<StudentTransferLimitStatus> {
  const todayCount = await countStudentTransferRequestsToday(fromUserId);
  return getStudentTransferLimitStatus(todayCount);
}

export function dailyTransferLimitReason(): string {
  return `You can only request ${STUDENT_TRANSFER_DAILY_LIMIT} student transfers per day. Try again tomorrow.`;
}
