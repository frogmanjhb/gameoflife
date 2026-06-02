export declare const TRANSFER_APPROVAL_XP_REWARD = 1;
export declare const TRANSFER_APPROVAL_EARNINGS_REWARD = 500;
type TxClient = {
    query: (sql: string, params?: unknown[]) => Promise<{
        rows: Record<string, unknown>[];
    }>;
};
export declare function payTransferApprovalReward(client: TxClient, userId: number, username: string, townClass: string, schoolId: number | null): Promise<{
    experience_points: number;
    earnings: number;
    new_level: number | null;
}>;
export {};
//# sourceMappingURL=accountant-transfer-approval.d.ts.map