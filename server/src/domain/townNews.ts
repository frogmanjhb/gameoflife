import database from '../database/database-prod';
import { getXPForLevel } from '../routes/jobs';

export const STORY_XP_REWARD = 20;
export const STORY_EARNINGS_REWARD = 5000;
/** Max town news story submissions per contributor per day (resets at 4:00 AM server time). */
export const TOWN_NEWS_DAILY_POST_LIMIT = 2;
export const MAX_HEADLINE_LENGTH = 200;
export const MAX_BODY_LENGTH = 8000;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export type TownClass = '6A' | '6B' | '6C';

export function isTownClass(value: unknown): value is TownClass {
  return value === '6A' || value === '6B' || value === '6C';
}

export function hasJournalistJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim().includes('journalist');
}

export function hasGraphicDesignerJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim().includes('graphic designer');
}

export function hasEntrepreneurJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim().includes('entrepreneur');
}

export function canSubmitTownNews(jobName: string | null | undefined): boolean {
  return (
    hasJournalistJob(jobName) ||
    hasGraphicDesignerJob(jobName) ||
    hasEntrepreneurJob(jobName)
  );
}

/** Count story rows created since the current civic day (4:00 AM boundary). */
export async function countTodayStorySubmissions(journalistUserId: number): Promise<number> {
  const rows = await database.query(
    `SELECT COUNT(*)::int AS count FROM town_news_stories
     WHERE journalist_user_id = $1
     AND created_at >= (
       CASE WHEN CURRENT_TIME < '04:00:00' THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'
       ELSE CURRENT_DATE + INTERVAL '4 hours' END
     )`,
    [journalistUserId]
  );
  return parseInt(String(rows[0]?.count ?? 0), 10);
}

export async function getStoryPostQuota(journalistUserId: number): Promise<{
  remaining_posts: number;
  daily_post_limit: number;
}> {
  const todayCount = await countTodayStorySubmissions(journalistUserId);
  const remaining = Math.max(0, TOWN_NEWS_DAILY_POST_LIMIT - todayCount);
  return { remaining_posts: remaining, daily_post_limit: TOWN_NEWS_DAILY_POST_LIMIT };
}

export function estimateImageBytes(imageData: string): number {
  const base64 = imageData.includes(',') ? imageData.split(',')[1] : imageData;
  return Math.ceil((base64.length * 3) / 4);
}

export function isValidImageData(imageData: unknown): imageData is string {
  if (typeof imageData !== 'string' || !imageData.trim()) return false;
  if (!/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(imageData)) return false;
  return estimateImageBytes(imageData) <= MAX_IMAGE_BYTES;
}

export function sanitizeHeadline(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().slice(0, MAX_HEADLINE_LENGTH);
}

export function sanitizeBody(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().slice(0, MAX_BODY_LENGTH);
}

export function sanitizeOptionalImage(raw: unknown): string | null {
  if (raw == null || raw === '') return null;
  if (!isValidImageData(raw)) return null;
  return raw;
}

export async function payStorySubmissionReward(
  journalistUserId: number,
  journalistUsername: string,
  townClass: string,
  schoolId: number | null,
  headline: string
): Promise<{ new_level: number | null; experience_points: number; earnings: number }> {
  const xp = STORY_XP_REWARD;
  const earnings = STORY_EARNINGS_REWARD;

  const currentUser = await database.get(
    'SELECT job_level, job_experience_points FROM users WHERE id = $1',
    [journalistUserId]
  );
  const currentLevel = currentUser?.job_level || 1;
  const currentXP = currentUser?.job_experience_points || 0;
  const newXP = currentXP + xp;
  let newLevel = currentLevel;
  for (let level = currentLevel; level < 10; level++) {
    if (newXP >= getXPForLevel(level + 1)) newLevel = level + 1;
    else break;
  }

  const townSettings = schoolId != null
    ? await database.get(
        'SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id = $2',
        [townClass, schoolId]
      )
    : await database.get(
        'SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id IS NULL',
        [townClass]
      );
  const treasuryBalance = parseFloat(townSettings?.treasury_balance || '0');
  if (treasuryBalance < earnings) {
    throw new Error('TREASURY_INSUFFICIENT');
  }

  await database.query(
    'UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3',
    [newXP, newLevel, journalistUserId]
  );

  const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [journalistUserId]);
  if (account) {
    if (schoolId != null) {
      await database.query(
        'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3',
        [earnings, townClass, schoolId]
      );
    } else {
      await database.query(
        'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL',
        [earnings, townClass]
      );
    }
    await database.query(
      `INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [schoolId, townClass, earnings, 'withdrawal', `Town News story "${headline}" by ${journalistUsername}`, journalistUserId]
    );
    await database.query(
      'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [earnings, account.id]
    );
    await database.query(
      `INSERT INTO transactions (to_account_id, amount, transaction_type, description)
       VALUES ($1, $2, 'deposit', $3)`,
      [account.id, earnings, `Town News story: ${headline}`]
    );
  }

  return {
    new_level: newLevel > currentLevel ? newLevel : null,
    experience_points: xp,
    earnings,
  };
}
