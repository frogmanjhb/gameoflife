export declare const STORY_XP_REWARD = 20;
export declare const STORY_EARNINGS_REWARD = 5000;
/** Max town news story submissions per contributor per day (resets at 4:00 AM server time). */
export declare const TOWN_NEWS_DAILY_POST_LIMIT = 2;
/** Approved stories fetched per "load more" on the public Town News feed. */
export declare const TOWN_NEWS_STORIES_PAGE_SIZE = 20;
/** Civic day boundary (resets 04:00 server time), same as story post quota. */
export declare const TOWN_NEWS_DAY_START_SQL = "\n  CASE WHEN CURRENT_TIME < '04:00:00' THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'\n  ELSE CURRENT_DATE + INTERVAL '4 hours' END\n";
export declare const MAX_HEADLINE_LENGTH = 200;
export declare const MAX_BODY_LENGTH = 8000;
export declare const MAX_IMAGE_BYTES: number;
export type TownClass = '6A' | '6B' | '6C';
export declare function isTownClass(value: unknown): value is TownClass;
export declare function hasJournalistJob(jobName: string | null | undefined): boolean;
export declare function hasGraphicDesignerJob(jobName: string | null | undefined): boolean;
export declare function hasEntrepreneurJob(jobName: string | null | undefined): boolean;
export declare function canSubmitTownNews(jobName: string | null | undefined): boolean;
/** Count story rows created since the current civic day (4:00 AM boundary). */
export declare function countTodayStorySubmissions(journalistUserId: number): Promise<number>;
export declare function getStoryPostQuota(journalistUserId: number): Promise<{
    remaining_posts: number;
    daily_post_limit: number;
}>;
export declare function estimateImageBytes(imageData: string): number;
export declare function isValidImageData(imageData: unknown): imageData is string;
export declare function sanitizeHeadline(raw: unknown): string;
export declare function sanitizeBody(raw: unknown): string;
export declare function sanitizeOptionalImage(raw: unknown): string | null;
export declare function payStorySubmissionReward(journalistUserId: number, journalistUsername: string, townClass: string, schoolId: number | null, headline: string): Promise<{
    new_level: number | null;
    experience_points: number;
    earnings: number;
}>;
//# sourceMappingURL=townNews.d.ts.map