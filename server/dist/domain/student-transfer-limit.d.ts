/** Max student-initiated peer transfer requests per calendar day (server date). */
export declare const STUDENT_TRANSFER_DAILY_LIMIT = 3;
export type StudentTransferLimitStatus = {
    transfer_daily_limit: number;
    transfers_remaining_today: number;
    canRequestTransfer: boolean;
};
export declare function countStudentTransferRequestsToday(fromUserId: number): Promise<number>;
export declare function getStudentTransferLimitStatus(todayCount: number): StudentTransferLimitStatus;
export declare function getStudentTransferLimitStatusForUser(fromUserId: number): Promise<StudentTransferLimitStatus>;
export declare function dailyTransferLimitReason(): string;
//# sourceMappingURL=student-transfer-limit.d.ts.map