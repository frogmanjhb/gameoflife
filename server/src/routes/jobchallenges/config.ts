/**
 * Shared configuration for all job challenge games.
 * All job challenges (Architect, future roles) use the same daily limit.
 */
export const JOB_CHALLENGES_DAILY_LIMIT = 3;

// Anti-spam: maximum completed job-challenge submissions per user
// allowed within the "recent" time window checked in each /submit route.
// The routes currently use a fixed time window of `NOW() - INTERVAL '3 minutes'`,
// and block when the user already has `>= JOB_GAME_RECENT_COMPLETIONS_LIMIT`
// completed sessions in that window (i.e. max allowed is this limit).
export const JOB_GAME_RECENT_COMPLETIONS_LIMIT = 5;
