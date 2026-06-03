"use strict";
/**
 * Per-town "clear transaction history" hides older rows from API responses only.
 * Data remains in the transactions table.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherSchoolTransactionVisibilitySql = teacherSchoolTransactionVisibilitySql;
exports.studentTownTransactionVisibilitySql = studentTownTransactionVisibilitySql;
function teacherSchoolTransactionVisibilitySql(schoolId, schoolParamIndex) {
    return {
        fragment: `AND NOT EXISTS (
      SELECT 1
      FROM town_settings ts
      WHERE (ts.school_id IS NOT DISTINCT FROM $${schoolParamIndex})
        AND ts.transaction_history_cleared_at IS NOT NULL
        AND t.created_at < ts.transaction_history_cleared_at
        AND (fu.class = ts.class OR tu.class = ts.class)
    )`,
        params: [schoolId],
    };
}
function studentTownTransactionVisibilitySql(schoolId, studentClass, schoolParamIndex, classParamIndex) {
    return {
        fragment: `AND NOT EXISTS (
      SELECT 1
      FROM town_settings ts
      WHERE (ts.school_id IS NOT DISTINCT FROM $${schoolParamIndex})
        AND ts.class = $${classParamIndex}
        AND ts.transaction_history_cleared_at IS NOT NULL
        AND t.created_at < ts.transaction_history_cleared_at
    )`,
        params: [schoolId, studentClass],
    };
}
//# sourceMappingURL=transaction-history-visibility.js.map