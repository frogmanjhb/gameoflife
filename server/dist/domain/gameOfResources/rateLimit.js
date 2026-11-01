"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRateLimit = checkRateLimit;
exports.resetRateLimitsForTests = resetRateLimitsForTests;
const buckets = new Map();
/** Simple sliding-window limiter: max `limit` events per `windowMs`. */
function checkRateLimit(key, limit, windowMs) {
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
function resetRateLimitsForTests() {
    buckets.clear();
}
//# sourceMappingURL=rateLimit.js.map