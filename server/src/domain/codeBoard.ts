export const STAR_XP_REWARD = 5;
export const STAR_EARNINGS_REWARD = 1000;
export const CLICK_XP_REWARD = 5;
export const CLICK_EARNINGS_REWARD = 500;
export const MAX_APPS_PER_ENGINEER = 10;
export const MAX_TITLE_LENGTH = 200;
export const MAX_URL_LENGTH = 2048;

export type TownClass = '6A' | '6B' | '6C';

export function isTownClass(value: unknown): value is TownClass {
  return value === '6A' || value === '6B' || value === '6C';
}

export function hasSoftwareEngineerJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim().includes('software engineer');
}

export function sanitizeTitle(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().slice(0, MAX_TITLE_LENGTH);
}

export function sanitizeUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().slice(0, MAX_URL_LENGTH);
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
