export declare const TRANSFER_APPROVAL_XP_REWARD = 1;
export declare const TRANSFER_APPROVAL_EARNINGS_REWARD = 500;
/** Transfers below this amount can be approved but earn no accountant reward. */
export declare const TRANSFER_APPROVAL_MIN_REWARD_AMOUNT = 50;
/** Max rewarded transfer approvals per accountant per game day (resets 04:00). */
export declare const ACCOUNTANT_TRANSFER_APPROVAL_DAILY_REWARD_LIMIT = 10;
type TxClient = {
    query: (sql: string, params?: unknown[]) => Promise<{
        rows: Record<string, unknown>[];
        rowCount?: number;
    }>;
};
export type TransferApprovalRewardInput = {
    transferAmount: number;
    toUserId: number;
    accountantUserId: number;
};
export type TransferApprovalRewardResult = {
    experience_points: number;
    earnings: number;
    new_level: number | null;
    reward_skipped_reason: string | null;
};
export declare function payTransferApprovalReward(client: TxClient, userId: number, username: string, townClass: string, schoolId: number | null, input: TransferApprovalRewardInput): Promise<TransferApprovalRewardResult>;
export {};
//# sourceMappingURL=accountant-transfer-approval.d.ts.map