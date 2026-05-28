export const SUGGESTIONS_PER_WEEK = 2;
export const SUGGESTION_XP_REWARD = 10;
export const SUGGESTION_EARNINGS_REWARD = 2000;
export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 500;

export type TownClass = '6A' | '6B' | '6C';
export type EventTiming = 'before_class' | 'after_class' | 'during_class';
export type EventStatus = 'open' | 'closed';

export function isTownClass(value: unknown): value is TownClass {
  return value === '6A' || value === '6B' || value === '6C';
}

export function hasEventPlannerJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim().includes('event planner');
}

export function isValidTiming(value: unknown): value is EventTiming {
  return value === 'before_class' || value === 'after_class' || value === 'during_class';
}

export function timingLabel(timing: EventTiming): string {
  switch (timing) {
    case 'before_class':
      return 'Before class';
    case 'after_class':
      return 'After class';
    case 'during_class':
      return 'During class';
    default:
      return timing;
  }
}

/** PostgreSQL expression for start of current ISO week (Monday). */
export const WEEK_START_SQL = `date_trunc('week', CURRENT_TIMESTAMP)`;

export function sanitizeTitle(title: unknown): string | null {
  if (typeof title !== 'string') return null;
  const trimmed = title.trim();
  if (!trimmed || trimmed.length > MAX_TITLE_LENGTH) return null;
  return trimmed;
}

export function sanitizeDescription(description: unknown): string | null {
  if (description == null || description === '') return null;
  if (typeof description !== 'string') return null;
  const trimmed = description.trim();
  if (trimmed.length > MAX_DESCRIPTION_LENGTH) return null;
  return trimmed || null;
}
