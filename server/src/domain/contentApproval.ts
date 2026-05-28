export type ContentSubmissionStatus = 'pending' | 'approved' | 'denied';

export function isReviewStatus(value: unknown): value is 'approved' | 'denied' {
  return value === 'approved' || value === 'denied';
}
