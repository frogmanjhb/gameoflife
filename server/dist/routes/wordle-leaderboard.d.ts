declare const router: import("express-serve-static-core").Router;
export interface WordleLeaderboardEntry {
    user_id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    class?: string;
    total_earnings: number;
    games_played: number;
    wins: number;
    best_guesses: number | null;
    rank: number;
}
export default router;
//# sourceMappingURL=wordle-leaderboard.d.ts.map