/**
 * Per-town "clear transaction history" hides older rows from API responses only.
 * Data remains in the transactions table.
 */
export declare function teacherSchoolTransactionVisibilitySql(schoolId: number | null, schoolParamIndex: number): {
    fragment: string;
    params: unknown[];
};
export declare function studentTownTransactionVisibilitySql(schoolId: number | null, studentClass: string, schoolParamIndex: number, classParamIndex: number): {
    fragment: string;
    params: unknown[];
};
//# sourceMappingURL=transaction-history-visibility.d.ts.map