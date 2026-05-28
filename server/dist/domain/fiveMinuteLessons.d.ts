export { SUGGESTIONS_PER_WEEK, SUGGESTION_XP_REWARD, SUGGESTION_EARNINGS_REWARD, MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH, WEEK_START_SQL, isTownClass, isValidTiming, timingLabel, sanitizeTitle, sanitizeDescription, type TownClass, type EventTiming, } from './classEvents';
export declare const MAX_CLASS_CONTENT_LENGTH = 500;
export type LessonStatus = 'pending' | 'denied' | 'open' | 'closed';
export declare function hasFiveMinuteLessonJob(jobName: string | null | undefined): boolean;
export declare function sanitizeClassContent(classContent: unknown): string | null;
export declare function lessonStatusLabel(status: string): string;
//# sourceMappingURL=fiveMinuteLessons.d.ts.map