"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEEK_START_SQL = exports.MAX_DESCRIPTION_LENGTH = exports.MAX_TITLE_LENGTH = exports.SUGGESTION_EARNINGS_REWARD = exports.SUGGESTION_XP_REWARD = exports.SUGGESTIONS_PER_WEEK = void 0;
exports.isTownClass = isTownClass;
exports.hasEventPlannerJob = hasEventPlannerJob;
exports.isValidTiming = isValidTiming;
exports.timingLabel = timingLabel;
exports.sanitizeTitle = sanitizeTitle;
exports.sanitizeDescription = sanitizeDescription;
exports.SUGGESTIONS_PER_WEEK = 2;
exports.SUGGESTION_XP_REWARD = 10;
exports.SUGGESTION_EARNINGS_REWARD = 2000;
exports.MAX_TITLE_LENGTH = 200;
exports.MAX_DESCRIPTION_LENGTH = 500;
function isTownClass(value) {
    return value === '6A' || value === '6B' || value === '6C';
}
function hasEventPlannerJob(jobName) {
    return (jobName || '').toLowerCase().trim().includes('event planner');
}
function isValidTiming(value) {
    return value === 'before_class' || value === 'after_class' || value === 'during_class';
}
function timingLabel(timing) {
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
exports.WEEK_START_SQL = `date_trunc('week', CURRENT_TIMESTAMP)`;
function sanitizeTitle(title) {
    if (typeof title !== 'string')
        return null;
    const trimmed = title.trim();
    if (!trimmed || trimmed.length > exports.MAX_TITLE_LENGTH)
        return null;
    return trimmed;
}
function sanitizeDescription(description) {
    if (description == null || description === '')
        return null;
    if (typeof description !== 'string')
        return null;
    const trimmed = description.trim();
    if (trimmed.length > exports.MAX_DESCRIPTION_LENGTH)
        return null;
    return trimmed || null;
}
//# sourceMappingURL=classEvents.js.map