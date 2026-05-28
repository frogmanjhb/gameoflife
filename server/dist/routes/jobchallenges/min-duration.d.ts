/**
 * Computes how many milliseconds have elapsed since the given `played_at`
 * timestamp, using the database clock for both ends (NOW() - played_at).
 *
 * This prevents issues caused by clock skew between the API server and DB.
 */
export declare function getElapsedMsSincePlayedAt(database: any, playedAt: any): Promise<number>;
//# sourceMappingURL=min-duration.d.ts.map