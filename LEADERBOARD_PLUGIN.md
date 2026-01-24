# Leaderboard Plugin

A fun and engaging leaderboard system for the Math Game in the Game of Life Banking application. Shows the top 5 performers overall and per class with duck emoji rankings! 🦆

## Features

### Overall Leaderboard
- Shows top 5 students across all classes (6A, 6B, 6C)
- Ranked by total points earned from math games
- Displays games played, high scores for each difficulty level

### Class-Specific Leaderboards
- Individual leaderboards for each class (6A, 6B, 6C)
- Top 5 performers per class
- Encourages friendly competition within classes

### Fun Visual Design
- 🦆 Duck emojis for rankings (inspired by the duck race image)
- Color-coded ranks:
  - 🥇 1st Place: Gold (yellow)
  - 🥈 2nd Place: Silver (gray)
  - 🥉 3rd Place: Bronze (orange)
  - 4th & 5th: Blue tones
- Animated hover effects
- Responsive design for all screen sizes

## Implementation Details

### Backend (API Routes)

**File**: `server/src/routes/leaderboard.ts`

Three main endpoints:

1. **GET `/api/leaderboard/overall`**
   - Returns top 5 students across all classes
   - Sorted by total points (descending)
   - Includes rank, points, games played, and high scores

2. **GET `/api/leaderboard/class/:className`**
   - Returns top 5 students for a specific class (6A, 6B, or 6C)
   - Same sorting and data as overall

3. **GET `/api/leaderboard/all-classes`**
   - Returns all three class leaderboards in one request
   - Optimized for displaying class tabs

**Data Calculation**:
- Total points: Sum of all `score` values from `math_game_sessions`
- High scores: Maximum scores per difficulty from `math_game_high_scores`
- Ranking: Uses `ROW_NUMBER()` SQL function for precise ranking

### Frontend Component

**File**: `client/src/components/plugins/LeaderboardPlugin.tsx`

**Features**:
- Tab navigation between Overall and class-specific views
- Real-time data fetching from API
- Loading states with spinners
- Empty states with friendly messages
- Responsive card-based layout
- High score display for Easy, Medium, and Hard difficulties

### Database

**Migration**: `server/migrations/018_add_leaderboard_plugin.sql`

Adds the Leaderboard plugin entry to the `plugins` table:
- Name: "Leaderboard"
- Icon: 🏆
- Route: `/leaderboard`
- Enabled by default

## Usage

### For Students
1. Navigate to the Leaderboard plugin from the dashboard
2. View your ranking among peers
3. Switch between Overall and class-specific views
4. See your classmates' achievements
5. Get motivated to play more math games!

### For Teachers
- Leaderboard is automatically available when the plugin is enabled
- Can toggle the plugin on/off in Plugin Management
- No additional configuration needed
- Students only see their own class and overall rankings

## Ranking System

Rankings are determined by:
1. **Total Points** (primary): Sum of all points earned across all math games
2. **Games Played** (tiebreaker): If two students have the same points, the one with fewer games played ranks higher (better efficiency)

Points are earned in the Math Game based on:
- Correct answers
- Difficulty level (Easy: 1x, Medium: 1.2x, Hard: 1.5x)
- Answer streaks (5+ = 1.5x, 10+ = 2x, 15+ = 2.5x)

## Technical Notes

### Security
- All endpoints require authentication (`authenticateToken` middleware)
- Students can only view leaderboards, not modify them
- Class filtering prevents cross-class data leaks

### Performance
- SQL queries use `ROW_NUMBER()` for efficient ranking
- Results are limited to top 5 per leaderboard
- Indexes on `user_id` and `difficulty` in math game tables

### Scalability
- Leaderboard queries are optimized with proper JOINs and aggregations
- Only active players (with games played > 0) appear on leaderboards
- Can easily extend to show top 10, 20, etc. by changing LIMIT

## Future Enhancements

Possible improvements:
- [ ] Add time period filters (daily, weekly, monthly)
- [ ] Show student's own rank if not in top 5
- [ ] Add "Most Improved" category
- [ ] Display achievement badges
- [ ] Add prize/reward system for top performers
- [ ] Export leaderboard as PDF or image
- [ ] Add animation when rankings change
- [ ] Show streak statistics

## Development

To add new leaderboard types:
1. Add new endpoint in `server/src/routes/leaderboard.ts`
2. Update frontend component to display new data
3. Consider adding new tabs or views as needed

## Deployment

The plugin is automatically included when:
1. Server code is compiled: `npm run build` (in server directory)
2. Migration is run: `node add-leaderboard-plugin.js` (in server directory)
3. Client is built: `npm run build` (in client directory)
4. Server is restarted

Migration runs automatically on server startup if not already applied.
