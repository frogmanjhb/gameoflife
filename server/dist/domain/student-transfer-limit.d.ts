/** Max student-initiated peer transfer requests per calendar day (server date). */
export declare const STUDENT_TRANSFER_DAILY_LIMIT = 3;
/** Minimum amount for student peer transfer requests (blocks micro-transfer abuse). */
export declare const STUDENT_PEER_TRANSFER_MIN_AMOUNT = 5;
/** Max concurrent pending transfer requests per student. */
export declare const STUDENT_MAX_PENDING_TRANSFERS = 3;
/** Rolling window for burst detection on new transfer requests. */
export declare const STUDENT_TRANSFER_BURST_MINUTES = 5;
/** Max transfer requests created within the burst window. */
export declare const STUDENT_TRANSFER_BURST_LIMIT = 3;
/** Max transfers a teacher may approve in one approve-all action. */
export declare const TEACHER_TRANSFER_APPROVE_ALL_MAX = 25;
export type StudentTransferLimitStatus = {
    transfer_daily_limit: number;
    transfers_remaining_today: number;
    canRequestTransfer: boolean;
    peer_transfer_min_amount: number;
    pending_transfers_count: number;
    max_pending_transfers: number;
};
export declare function countStudentTransferRequestsToday(fromUserId: number): Promise<number>;
export declare function countPendingTransfersForUser(fromUserId: number): Promise<number>;
export declare function getStudentTransferLimitStatus(todayCount: number, pendingCount: number): StudentTransferLimitStatus;
export declare function getStudentTransferLimitStatusForUser(fromUserId: number): Promise<StudentTransferLimitStatus>;
export declare function dailyTransferLimitReason(): string;
export declare function peerTransferMinAmountReason(): string;
export declare function pendingTransferCapReason(pendingCount: number): string;
export declare function transferBurstLimitReason(): string;
export declare function validatePeerTransferAmount(amount: number): {
    ok: true;
} | {
    ok: false;
    error: string;
};
export declare function assertCanCreateStudentTransferRequest(fromUserId: number, toUserId: number, amount: number, description: string): Promise<{
    ok: true;
} | {
    ok: false;
    error: string;
}>;
/** Creates a pending transfer after re-checking limits under row lock (prevents parallel spam). */
export declare function createStudentTransferRequest(fromUserId: number, toUserId: number, amount: number, description: string): Promise<{
    ok: true;
} | {
    ok: false;
    error: string;
}>;
export declare function validatePeerTransferForApproval(amount: number): {
    ok: true;
} | {
    ok: false;
    error: string;
};
//# sourceMappingURL=student-transfer-limit.d.ts.map