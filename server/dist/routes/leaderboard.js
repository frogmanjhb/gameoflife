"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get overall leaderboard (top 5 across all classes)
router.get('/overall', auth_1.authenticateToken, async (req, res) => {
    try {
        // Check if math game tables exist
        try {
            await database_prod_1.default.query('SELECT 1 FROM math_game_sessions LIMIT 1');
        }
        catch (tableError) {
            return res.json({ leaderboard: [] });
        }
        const leaderboard = await database_prod_1.default.query(`
      WITH player_stats AS (
        SELECT 
          u.id as user_id,
          u.username,
          u.first_name,
          u.last_name,
          u.class,
          COALESCE(SUM(mgs.score), 0) as total_points,
          COUNT(mgs.id) as games_played,
          COALESCE(MAX(CASE WHEN mgh.difficulty = 'easy' THEN mgh.high_score ELSE 0 END), 0) as high_score_easy,
          COALESCE(MAX(CASE WHEN mgh.difficulty = 'medium' THEN mgh.high_score ELSE 0 END), 0) as high_score_medium,
          COALESCE(MAX(CASE WHEN mgh.difficulty = 'hard' THEN mgh.high_score ELSE 0 END), 0) as high_score_hard
        FROM users u
        LEFT JOIN math_game_sessions mgs ON u.id = mgs.user_id
        LEFT JOIN math_game_high_scores mgh ON u.id = mgh.user_id
        WHERE u.role = 'student'
        GROUP BY u.id, u.username, u.first_name, u.last_name, u.class
        HAVING COUNT(mgs.id) > 0
      )
      SELECT 
        *,
        ROW_NUMBER() OVER (ORDER BY total_points DESC, games_played ASC) as rank
      FROM player_stats
      ORDER BY total_points DESC, games_played ASC
      LIMIT 5
    `);
        res.json({ leaderboard });
    }
    catch (error) {
        console.error('Get overall leaderboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get class-specific leaderboard (top 5 per class)
router.get('/class/:className', auth_1.authenticateToken, async (req, res) => {
    try {
        const className = req.params.className;
        // Validate class name
        if (!['6A', '6B', '6C'].includes(className)) {
            return res.status(400).json({ error: 'Invalid class name' });
        }
        // Check if math game tables exist
        try {
            await database_prod_1.default.query('SELECT 1 FROM math_game_sessions LIMIT 1');
        }
        catch (tableError) {
            return res.json({ leaderboard: [] });
        }
        const leaderboard = await database_prod_1.default.query(`
      WITH player_stats AS (
        SELECT 
          u.id as user_id,
          u.username,
          u.first_name,
          u.last_name,
          u.class,
          COALESCE(SUM(mgs.score), 0) as total_points,
          COUNT(mgs.id) as games_played,
          COALESCE(MAX(CASE WHEN mgh.difficulty = 'easy' THEN mgh.high_score ELSE 0 END), 0) as high_score_easy,
          COALESCE(MAX(CASE WHEN mgh.difficulty = 'medium' THEN mgh.high_score ELSE 0 END), 0) as high_score_medium,
          COALESCE(MAX(CASE WHEN mgh.difficulty = 'hard' THEN mgh.high_score ELSE 0 END), 0) as high_score_hard
        FROM users u
        LEFT JOIN math_game_sessions mgs ON u.id = mgs.user_id
        LEFT JOIN math_game_high_scores mgh ON u.id = mgh.user_id
        WHERE u.role = 'student' AND u.class = $1
        GROUP BY u.id, u.username, u.first_name, u.last_name, u.class
        HAVING COUNT(mgs.id) > 0
      )
      SELECT 
        *,
        ROW_NUMBER() OVER (ORDER BY total_points DESC, games_played ASC) as rank
      FROM player_stats
      ORDER BY total_points DESC, games_played ASC
      LIMIT 5
    `, [className]);
        res.json({ leaderboard });
    }
    catch (error) {
        console.error('Get class leaderboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get all classes leaderboards at once
router.get('/all-classes', auth_1.authenticateToken, async (req, res) => {
    try {
        // Check if math game tables exist
        try {
            await database_prod_1.default.query('SELECT 1 FROM math_game_sessions LIMIT 1');
        }
        catch (tableError) {
            return res.json({
                '6A': [],
                '6B': [],
                '6C': []
            });
        }
        // Fetch leaderboards for all classes
        const classes = ['6A', '6B', '6C'];
        const allLeaderboards = {};
        for (const className of classes) {
            const leaderboard = await database_prod_1.default.query(`
        WITH player_stats AS (
          SELECT 
            u.id as user_id,
            u.username,
            u.first_name,
            u.last_name,
            u.class,
            COALESCE(SUM(mgs.score), 0) as total_points,
            COUNT(mgs.id) as games_played,
            COALESCE(MAX(CASE WHEN mgh.difficulty = 'easy' THEN mgh.high_score ELSE 0 END), 0) as high_score_easy,
            COALESCE(MAX(CASE WHEN mgh.difficulty = 'medium' THEN mgh.high_score ELSE 0 END), 0) as high_score_medium,
            COALESCE(MAX(CASE WHEN mgh.difficulty = 'hard' THEN mgh.high_score ELSE 0 END), 0) as high_score_hard
          FROM users u
          LEFT JOIN math_game_sessions mgs ON u.id = mgs.user_id
          LEFT JOIN math_game_high_scores mgh ON u.id = mgh.user_id
          WHERE u.role = 'student' AND u.class = $1
          GROUP BY u.id, u.username, u.first_name, u.last_name, u.class
          HAVING COUNT(mgs.id) > 0
        )
        SELECT 
          *,
          ROW_NUMBER() OVER (ORDER BY total_points DESC, games_played ASC) as rank
        FROM player_stats
        ORDER BY total_points DESC, games_played ASC
        LIMIT 5
      `, [className]);
            allLeaderboards[className] = leaderboard;
        }
        res.json(allLeaderboards);
    }
    catch (error) {
        console.error('Get all classes leaderboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=leaderboard.js.map