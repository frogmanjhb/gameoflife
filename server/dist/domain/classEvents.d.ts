export declare const SUGGESTIONS_PER_WEEK = 2;
export declare const SUGGESTION_XP_REWARD = 10;
export declare const SUGGESTION_EARNINGS_REWARD = 2000;
export declare const MAX_TITLE_LENGTH = 200;
export declare const MAX_DESCRIPTION_LENGTH = 500;
export type TownClass = '6A' | '6B' | '6C';
export type EventTiming = 'before_class' | 'after_class' | 'during_class';
export type EventStatus = 'open' | 'closed';
export declare function isTownClass(value: unknown): value is TownClass;
export declare function hasEventPlannerJob(jobName: string | null | undefined): boolean;
export declare function isValidTiming(value: unknown): value is EventTiming;
export declare function timingLabel(timing: EventTiming): string;
/** PostgreSQL expression for start of current ISO week (Monday). */
export declare const WEEK_START_SQL = "date_trunc('week', CURRENT_TIMESTAMP)";
export declare function sanitizeTitle(title: unknown): string | null;
export declare function sanitizeDescription(description: unknown): string | null;
//# sourceMappingURL=classEvents.d.ts.map