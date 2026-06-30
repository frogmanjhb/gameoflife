/**
 * Per-town "clear transaction history" hides older rows from API responses only.
 * Data remains in the transactions table.
 */

export function teacherSchoolTransactionVisibilitySql(
  schoolId: number | null,
  schoolParamIndex: number
): { fragment: string; params: unknown[] } {
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

export function teacherSchoolTransactionFilter(
  schoolId: number | null
): { schoolCondition: string; visibilityFragment: string; params: unknown[] } {
  const schoolCondition =
    schoolId !== null
      ? '(fa.user_id IS NULL OR fu.school_id = $1) AND (ta.user_id IS NULL OR tu.school_id = $1)'
      : '(fa.user_id IS NULL OR fu.school_id IS NULL) AND (ta.user_id IS NULL OR tu.school_id IS NULL)';
  const params = schoolId !== null ? [schoolId] : [];
  const visibility = teacherSchoolTransactionVisibilitySql(schoolId, params.length + 1);
  return {
    schoolCondition,
    visibilityFragment: visibility.fragment,
    params: [...params, ...visibility.params],
  };
}

export function studentTownTransactionVisibilitySql(
  schoolId: number | null,
  studentClass: string,
  schoolParamIndex: number,
  classParamIndex: number
): { fragment: string; params: unknown[] } {
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
