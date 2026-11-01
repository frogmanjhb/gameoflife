import type { GorWorldRow, GorWorldSettings } from './types';
import { DEFAULT_GOR_SETTINGS } from './types';

const MS_DAY = 86_400_000;

export function mergeWorldSettings(raw: GorWorldSettings | undefined): GorWorldSettings {
  return { ...DEFAULT_GOR_SETTINGS, ...(raw ?? {}) };
}

export function isAutomationPaused(row: Pick<GorWorldRow, 'paused' | 'settings'>): boolean {
  return !!row.paused || !!row.settings?.automationPaused;
}

export function parseSettleClock(settings: GorWorldSettings): { hour: number; minute: number } {
  const merged = mergeWorldSettings(settings);
  const m = /^(\d{1,2}):(\d{2})$/.exec(merged.settleTime ?? '06:00');
  if (!m) return { hour: 6, minute: 0 };
  return { hour: Math.min(23, Number(m[1])), minute: Math.min(59, Number(m[2])) };
}

export function localDateParts(date: Date, timeZone: string): { y: number; m: number; d: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  const [y, m, d] = fmt.format(date).split('-').map(Number);
  return { y, m, d };
}

export function localWeekdayIndex(date: Date, timeZone: string): number {
  const wd = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[wd] ?? 0;
}

/** Fixed UTC+2 — South Africa has no daylight saving. */
export function zonedInstantUtc(
  y: number,
  m: number,
  d: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  if (timeZone === 'Africa/Johannesburg') {
    return new Date(Date.UTC(y, m - 1, d, hour - 2, minute, 0, 0));
  }
  return new Date(Date.UTC(y, m - 1, d, hour, minute, 0, 0));
}

export function isWeekendLocal(date: Date, timeZone: string): boolean {
  const w = localWeekdayIndex(date, timeZone);
  return w === 0 || w === 6;
}

export function nextRoundEndsAt(settings: GorWorldSettings, after: Date): Date {
  const merged = mergeWorldSettings(settings);
  const tz = merged.timezone ?? 'Africa/Johannesburg';
  const { hour, minute } = parseSettleClock(merged);
  let probe = new Date(after.getTime());

  for (let attempt = 0; attempt < 400; attempt++) {
    const { y, m, d } = localDateParts(probe, tz);
    let candidate = zonedInstantUtc(y, m, d, hour, minute, tz);
    if (candidate.getTime() <= after.getTime() + 1000) {
      probe = new Date(probe.getTime() + MS_DAY);
      continue;
    }
    while (merged.weekendPause && isWeekendLocal(candidate, tz)) {
      candidate = new Date(candidate.getTime() + MS_DAY);
    }
    return candidate;
  }
  return new Date(after.getTime() + MS_DAY);
}

export function isWorldDueForAdvance(row: GorWorldRow, now: Date): boolean {
  if (isAutomationPaused(row)) return false;
  if (!row.round_ends_at) return false;
  return now.getTime() >= row.round_ends_at.getTime();
}

export function advisoryLockKey(worldId: number): number {
  return worldId;
}
