"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_IMAGE_BYTES = exports.MAX_BODY_LENGTH = exports.MAX_HEADLINE_LENGTH = exports.TOWN_NEWS_DAY_START_SQL = exports.TOWN_NEWS_STORIES_PAGE_SIZE = exports.TOWN_NEWS_DAILY_POST_LIMIT = exports.STORY_EARNINGS_REWARD = exports.STORY_XP_REWARD = void 0;
exports.isTownClass = isTownClass;
exports.hasJournalistJob = hasJournalistJob;
exports.hasGraphicDesignerJob = hasGraphicDesignerJob;
exports.hasEntrepreneurJob = hasEntrepreneurJob;
exports.canSubmitTownNews = canSubmitTownNews;
exports.countTodayStorySubmissions = countTodayStorySubmissions;
exports.getStoryPostQuota = getStoryPostQuota;
exports.estimateImageBytes = estimateImageBytes;
exports.isValidImageData = isValidImageData;
exports.sanitizeHeadline = sanitizeHeadline;
exports.sanitizeBody = sanitizeBody;
exports.sanitizeOptionalImage = sanitizeOptionalImage;
exports.payStorySubmissionReward = payStorySubmissionReward;
const database_prod_1 = __importDefault(require("../database/database-prod"));
const jobs_1 = require("../routes/jobs");
exports.STORY_XP_REWARD = 20;
exports.STORY_EARNINGS_REWARD = 5000;
/** Max town news story submissions per contributor per day (resets at 4:00 AM server time). */
exports.TOWN_NEWS_DAILY_POST_LIMIT = 2;
/** Approved stories fetched per "load more" on the public Town News feed. */
exports.TOWN_NEWS_STORIES_PAGE_SIZE = 20;
/** Civic day boundary (resets 04:00 server time), same as story post quota. */
exports.TOWN_NEWS_DAY_START_SQL = `
  CASE WHEN CURRENT_TIME < '04:00:00' THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'
  ELSE CURRENT_DATE + INTERVAL '4 hours' END
`;
exports.MAX_HEADLINE_LENGTH = 200;
exports.MAX_BODY_LENGTH = 8000;
exports.MAX_IMAGE_BYTES = 2 * 1024 * 1024;
function isTownClass(value) {
    return value === '6A' || value === '6B' || value === '6C';
}
function hasJournalistJob(jobName) {
    return (jobName || '').toLowerCase().trim().includes('journalist');
}
function hasGraphicDesignerJob(jobName) {
    return (jobName || '').toLowerCase().trim().includes('graphic designer');
}
function hasEntrepreneurJob(jobName) {
    return (jobName || '').toLowerCase().trim().includes('entrepreneur');
}
function canSubmitTownNews(jobName) {
    return (hasJournalistJob(jobName) ||
        hasGraphicDesignerJob(jobName) ||
        hasEntrepreneurJob(jobName));
}
/** Count story rows created since the current civic day (4:00 AM boundary). */
async function countTodayStorySubmissions(journalistUserId) {
    const rows = await database_prod_1.default.query(`SELECT COUNT(*)::int AS count FROM town_news_stories
     WHERE journalist_user_id = $1
     AND created_at >= (${exports.TOWN_NEWS_DAY_START_SQL})`, [journalistUserId]);
    return parseInt(String(rows[0]?.count ?? 0), 10);
}
async function getStoryPostQuota(journalistUserId) {
    const todayCount = await countTodayStorySubmissions(journalistUserId);
    const remaining = Math.max(0, exports.TOWN_NEWS_DAILY_POST_LIMIT - todayCount);
    return { remaining_posts: remaining, daily_post_limit: exports.TOWN_NEWS_DAILY_POST_LIMIT };
}
function estimateImageBytes(imageData) {
    const base64 = imageData.includes(',') ? imageData.split(',')[1] : imageData;
    return Math.ceil((base64.length * 3) / 4);
}
function isValidImageData(imageData) {
    if (typeof imageData !== 'string' || !imageData.trim())
        return false;
    if (!/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(imageData))
        return false;
    return estimateImageBytes(imageData) <= exports.MAX_IMAGE_BYTES;
}
function sanitizeHeadline(raw) {
    if (typeof raw !== 'string')
        return '';
    return raw.trim().slice(0, exports.MAX_HEADLINE_LENGTH);
}
function sanitizeBody(raw) {
    if (typeof raw !== 'string')
        return '';
    return raw.trim().slice(0, exports.MAX_BODY_LENGTH);
}
function sanitizeOptionalImage(raw) {
    if (raw == null || raw === '')
        return null;
    if (!isValidImageData(raw))
        return null;
    return raw;
}
async function payStorySubmissionReward(journalistUserId, journalistUsername, townClass, schoolId, headline) {
    const xp = exports.STORY_XP_REWARD;
    const earnings = exports.STORY_EARNINGS_REWARD;
    const currentUser = await database_prod_1.default.get('SELECT job_level, job_experience_points FROM users WHERE id = $1', [journalistUserId]);
    const currentLevel = currentUser?.job_level || 1;
    const currentXP = currentUser?.job_experience_points || 0;
    const newXP = currentXP + xp;
    let newLevel = currentLevel;
    for (let level = currentLevel; level < 10; level++) {
        if (newXP >= (0, jobs_1.getXPForLevel)(level + 1))
            newLevel = level + 1;
        else
            break;
    }
    const townSettings = schoolId != null
        ? await database_prod_1.default.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id = $2', [townClass, schoolId])
        : await database_prod_1.default.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id IS NULL', [townClass]);
    const treasuryBalance = parseFloat(townSettings?.treasury_balance || '0');
    if (treasuryBalance < earnings) {
        throw new Error('TREASURY_INSUFFICIENT');
    }
    await database_prod_1.default.query('UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3', [newXP, newLevel, journalistUserId]);
    const account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [journalistUserId]);
    if (account) {
        if (schoolId != null) {
            await database_prod_1.default.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3', [earnings, townClass, schoolId]);
        }
        else {
            await database_prod_1.default.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL', [earnings, townClass]);
        }
        await database_prod_1.default.query(`INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`, [schoolId, townClass, earnings, 'withdrawal', `Town News story "${headline}" by ${journalistUsername}`, journalistUserId]);
        await database_prod_1.default.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [earnings, account.id]);
        await database_prod_1.default.query(`INSERT INTO transactions (to_account_id, amount, transaction_type, description)
       VALUES ($1, $2, 'deposit', $3)`, [account.id, earnings, `Town News story: ${headline}`]);
    }
    return {
        new_level: newLevel > currentLevel ? newLevel : null,
        experience_points: xp,
        earnings,
    };
}
//# sourceMappingURL=townNews.js.map