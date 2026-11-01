"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeWorldSettings = mergeWorldSettings;
exports.isAutomationPaused = isAutomationPaused;
exports.parseSettleClock = parseSettleClock;
exports.localDateParts = localDateParts;
exports.localWeekdayIndex = localWeekdayIndex;
exports.zonedInstantUtc = zonedInstantUtc;
exports.isWeekendLocal = isWeekendLocal;
exports.nextRoundEndsAt = nextRoundEndsAt;
exports.isWorldDueForAdvance = isWorldDueForAdvance;
exports.advisoryLockKey = advisoryLockKey;
const types_1 = require("./types");
const MS_DAY = 86400000;
function mergeWorldSettings(raw) {
    return { ...types_1.DEFAULT_GOR_SETTINGS, ...(raw ?? {}) };
}
function isAutomationPaused(row) {
    return !!row.paused || !!row.settings?.automationPaused;
}
function parseSettleClock(settings) {
    const merged = mergeWorldSettings(settings);
    const m = /^(\d{1,2}):(\d{2})$/.exec(merged.settleTime ?? '06:00');
    if (!m)
        return { hour: 6, minute: 0 };
    return { hour: Math.min(23, Number(m[1])), minute: Math.min(59, Number(m[2])) };
}
function localDateParts(date, timeZone) {
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
    const [y, m, d] = fmt.format(date).split('-').map(Number);
    return { y, m, d };
}
function localWeekdayIndex(date, timeZone) {
    const wd = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
    const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return map[wd] ?? 0;
}
/** Fixed UTC+2 — South Africa has no daylight saving. */
function zonedInstantUtc(y, m, d, hour, minute, timeZone) {
    if (timeZone === 'Africa/Johannesburg') {
        return new Date(Date.UTC(y, m - 1, d, hour - 2, minute, 0, 0));
    }
    return new Date(Date.UTC(y, m - 1, d, hour, minute, 0, 0));
}
function isWeekendLocal(date, timeZone) {
    const w = localWeekdayIndex(date, timeZone);
    return w === 0 || w === 6;
}
function nextRoundEndsAt(settings, after) {
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
function isWorldDueForAdvance(row, now) {
    if (isAutomationPaused(row))
        return false;
    if (!row.round_ends_at)
        return false;
    return now.getTime() >= row.round_ends_at.getTime();
}
function advisoryLockKey(worldId) {
    return worldId;
}
//# sourceMappingURL=scheduleTime.js.map