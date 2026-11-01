const buckets = new Map<string, number[]>();

/** Simple sliding-window limiter: max `limit` events per `windowMs`. */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const list = buckets.get(key) ?? [];
  const fresh = list.filter((t) => now - t < windowMs);
  if (fresh.length >= limit) {
    buckets.set(key, fresh);
    return false;
  }
  fresh.push(now);
  buckets.set(key, fresh);
  return true;
}

export function resetRateLimitsForTests(): void {
  buckets.clear();
}
