"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_URL_LENGTH = exports.MAX_TITLE_LENGTH = exports.MAX_APPS_PER_ENGINEER = exports.CLICK_EARNINGS_REWARD = exports.CLICK_XP_REWARD = exports.STAR_EARNINGS_REWARD = exports.STAR_XP_REWARD = void 0;
exports.isTownClass = isTownClass;
exports.hasSoftwareEngineerJob = hasSoftwareEngineerJob;
exports.sanitizeTitle = sanitizeTitle;
exports.sanitizeUrl = sanitizeUrl;
exports.STAR_XP_REWARD = 5;
exports.STAR_EARNINGS_REWARD = 1000;
exports.CLICK_XP_REWARD = 5;
exports.CLICK_EARNINGS_REWARD = 500;
exports.MAX_APPS_PER_ENGINEER = 10;
exports.MAX_TITLE_LENGTH = 200;
exports.MAX_URL_LENGTH = 2048;
function isTownClass(value) {
    return value === '6A' || value === '6B' || value === '6C';
}
function hasSoftwareEngineerJob(jobName) {
    return (jobName || '').toLowerCase().trim().includes('software engineer');
}
function sanitizeTitle(raw) {
    if (typeof raw !== 'string')
        return '';
    return raw.trim().slice(0, exports.MAX_TITLE_LENGTH);
}
function sanitizeUrl(raw) {
    if (typeof raw !== 'string')
        return null;
    const trimmed = raw.trim().slice(0, exports.MAX_URL_LENGTH);
    if (!trimmed)
        return null;
    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
            return null;
        return parsed.toString();
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=codeBoard.js.map