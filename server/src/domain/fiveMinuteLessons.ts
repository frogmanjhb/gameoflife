export {
  SUGGESTIONS_PER_WEEK,
  SUGGESTION_XP_REWARD,
  SUGGESTION_EARNINGS_REWARD,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  WEEK_START_SQL,
  isTownClass,
  isValidTiming,
  timingLabel,
  sanitizeTitle,
  sanitizeDescription,
  type TownClass,
  type EventTiming,
} from './classEvents';

export const MAX_CLASS_CONTENT_LENGTH = 500;

export type LessonStatus = 'pending' | 'denied' | 'open' | 'closed';

export function hasFiveMinuteLessonJob(jobName: string | null | undefined): boolean {
  const n = (jobName || '').toLowerCase().trim();
  if (n.includes('event planner')) return false;
  return n.includes('teacher') || n.includes('principal');
}

export function sanitizeClassContent(classContent: unknown): string | null {
  if (typeof classContent !== 'string') return null;
  const trimmed = classContent.trim();
  if (!trimmed || trimmed.length > MAX_CLASS_CONTENT_LENGTH) return null;
  return trimmed;
}

export function lessonStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Awaiting teacher approval';
    case 'denied':
      return 'Not approved';
    case 'open':
      return 'Open for voting';
    case 'closed':
      return 'Closed';
    default:
      return status;
  }
}
