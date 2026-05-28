export const WEEKLY_EARNINGS_PER_POSTER = 500;
export const WEEKLY_XP_PER_POSTER = 5;
export const MAX_POSTERS = 20;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export type TownClass = '6A' | '6B' | '6C';

export function isTownClass(value: unknown): value is TownClass {
  return value === '6A' || value === '6B' || value === '6C';
}

export function hasGraphicDesignerJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim().includes('graphic designer');
}

export function getCompleteWeeksSince(dateIso: string | Date | null | undefined): number {
  if (!dateIso) return 0;
  const start = new Date(dateIso);
  if (Number.isNaN(start.getTime())) return 0;
  const diffMs = Date.now() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)));
}

export function canCollectWeeklyPayout(
  lastPayoutCollectedAt: string | null | undefined,
  firstPosterAt: string | null | undefined
): boolean {
  const anchor = lastPayoutCollectedAt || firstPosterAt;
  if (!anchor) return false;
  return getCompleteWeeksSince(anchor) >= 1;
}

export function calculateWeeklyPayout(posterCount: number): { earnings: number; experience_points: number } {
  const count = Math.max(0, posterCount);
  return {
    earnings: count * WEEKLY_EARNINGS_PER_POSTER,
    experience_points: count * WEEKLY_XP_PER_POSTER,
  };
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
