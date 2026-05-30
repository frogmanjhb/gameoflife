import database from '../database/database-prod';
import { getXPForLevel } from '../routes/jobs';

export const POLICE_FINE_BONUS_SUBMIT_XP = 5;
export const LAWYER_FINE_REVIEW_XP = 10;

export function hasPoliceLieutenantJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim().includes('police lieutenant');
}

async function awardJobXp(
  userId: number,
  xpAmount: number
): Promise<{ experience_points: number; new_level: number | null }> {
  const currentUser = await database.get(
    'SELECT job_level, job_experience_points FROM users WHERE id = $1',
    [userId]
  );
  const currentLevel = currentUser?.job_level || 1;
  const currentXP = currentUser?.job_experience_points || 0;
  const newXP = currentXP + xpAmount;
  let newLevel = currentLevel;
  for (let level = currentLevel; level < 10; level++) {
    if (newXP >= getXPForLevel(level + 1)) newLevel = level + 1;
    else break;
  }
  await database.query(
    'UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3',
    [newXP, newLevel, userId]
  );
  return {
    experience_points: xpAmount,
    new_level: newLevel > currentLevel ? newLevel : null,
  };
}

export async function awardPoliceSubmitXp(
  userId: number
): Promise<{ experience_points: number; new_level: number | null }> {
  return awardJobXp(userId, POLICE_FINE_BONUS_SUBMIT_XP);
}

export async function awardLawyerFineReviewXp(
  userId: number
): Promise<{ experience_points: number; new_level: number | null }> {
  return awardJobXp(userId, LAWYER_FINE_REVIEW_XP);
}
