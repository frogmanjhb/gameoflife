# Leaderboard Plugin - Testing Guide

## Quick Start

### 1. Backend Setup
```bash
cd server
npm run build
node add-leaderboard-plugin.js
npm start
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```

### 3. Access the Leaderboard
1. Login to the application
2. Look for the 🏆 Leaderboard plugin on your dashboard
3. Click to view rankings

## What to Test

### Visual Elements
- [ ] Duck emojis (🦆) appear for each rank
- [ ] Color coding is correct:
  - 1st place: Gold/Yellow
  - 2nd place: Silver/Gray
  - 3rd place: Bronze/Orange
  - 4th & 5th: Blue tones
- [ ] Cards have hover effects (scale up slightly)
- [ ] Responsive design works on mobile and desktop

### Functionality
- [ ] Overall leaderboard shows top 5 across all classes
- [ ] Class tabs (6A, 6B, 6C) show correct students
- [ ] Switching between tabs is smooth
- [ ] Loading spinner appears while fetching data
- [ ] Empty state appears when no games have been played
- [ ] Student names display correctly (first + last name)
- [ ] Total points are accurate
- [ ] Games played count is correct
- [ ] High scores for each difficulty level are shown

### Data Accuracy
Test by:
1. Playing math games with different students
2. Checking that points accumulate correctly
3. Verifying ranks update when new high scores are achieved
4. Ensuring class filtering works (students only see their class + overall)

## API Endpoints

Test these endpoints manually if needed:

```bash
# Get overall leaderboard (top 5)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/leaderboard/overall

# Get class-specific leaderboard
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/leaderboard/class/6A

# Get all classes at once
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/leaderboard/all-classes
```

## Troubleshooting

### Plugin doesn't appear on dashboard
- Check if plugin is enabled in Plugin Management
- Verify migration ran successfully: `node add-leaderboard-plugin.js`
- Check server logs for errors

### No data showing
- Ensure students have played at least one math game
- Check database has `math_game_sessions` and `math_game_high_scores` tables
- Verify API calls are successful (check browser console)

### Rank calculations seem wrong
- Total points = sum of all scores from all math games played
- Ties are broken by games played (fewer games = higher rank)
- Only students with games_played > 0 appear on leaderboard

## Sample Data

To generate test data quickly:
1. Create multiple student accounts (different classes)
2. Play math games with each student
3. Vary the scores to see different rankings
4. Play games on different difficulty levels to test high score display

## Performance Notes

- Queries are optimized with proper JOINs
- Results limited to top 5 per leaderboard
- Real-time updates (refresh page to see latest rankings)
- No caching (always fresh data)

## Known Issues

None currently. If you find any bugs, please document:
- What you were doing
- What you expected
- What actually happened
- Browser console errors (if any)
