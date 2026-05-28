"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_CLASS_CONTENT_LENGTH = exports.sanitizeDescription = exports.sanitizeTitle = exports.timingLabel = exports.isValidTiming = exports.isTownClass = exports.WEEK_START_SQL = exports.MAX_DESCRIPTION_LENGTH = exports.MAX_TITLE_LENGTH = exports.SUGGESTION_EARNINGS_REWARD = exports.SUGGESTION_XP_REWARD = exports.SUGGESTIONS_PER_WEEK = void 0;
exports.hasFiveMinuteLessonJob = hasFiveMinuteLessonJob;
exports.sanitizeClassContent = sanitizeClassContent;
exports.lessonStatusLabel = lessonStatusLabel;
var classEvents_1 = require("./classEvents");
Object.defineProperty(exports, "SUGGESTIONS_PER_WEEK", { enumerable: true, get: function () { return classEvents_1.SUGGESTIONS_PER_WEEK; } });
Object.defineProperty(exports, "SUGGESTION_XP_REWARD", { enumerable: true, get: function () { return classEvents_1.SUGGESTION_XP_REWARD; } });
Object.defineProperty(exports, "SUGGESTION_EARNINGS_REWARD", { enumerable: true, get: function () { return classEvents_1.SUGGESTION_EARNINGS_REWARD; } });
Object.defineProperty(exports, "MAX_TITLE_LENGTH", { enumerable: true, get: function () { return classEvents_1.MAX_TITLE_LENGTH; } });
Object.defineProperty(exports, "MAX_DESCRIPTION_LENGTH", { enumerable: true, get: function () { return classEvents_1.MAX_DESCRIPTION_LENGTH; } });
Object.defineProperty(exports, "WEEK_START_SQL", { enumerable: true, get: function () { return classEvents_1.WEEK_START_SQL; } });
Object.defineProperty(exports, "isTownClass", { enumerable: true, get: function () { return classEvents_1.isTownClass; } });
Object.defineProperty(exports, "isValidTiming", { enumerable: true, get: function () { return classEvents_1.isValidTiming; } });
Object.defineProperty(exports, "timingLabel", { enumerable: true, get: function () { return classEvents_1.timingLabel; } });
Object.defineProperty(exports, "sanitizeTitle", { enumerable: true, get: function () { return classEvents_1.sanitizeTitle; } });
Object.defineProperty(exports, "sanitizeDescription", { enumerable: true, get: function () { return classEvents_1.sanitizeDescription; } });
exports.MAX_CLASS_CONTENT_LENGTH = 500;
function hasFiveMinuteLessonJob(jobName) {
    const n = (jobName || '').toLowerCase().trim();
    if (n.includes('event planner'))
        return false;
    return n.includes('teacher') || n.includes('principal');
}
function sanitizeClassContent(classContent) {
    if (typeof classContent !== 'string')
        return null;
    const trimmed = classContent.trim();
    if (!trimmed || trimmed.length > exports.MAX_CLASS_CONTENT_LENGTH)
        return null;
    return trimmed;
}
function lessonStatusLabel(status) {
    switch (status) {
        case 'pending':
            return 'Awaiting teacher approval';
        case 'denied':
            return 'Not approved';
        case 'open':
            return 'Open for voting';
        case 'closed':
            return 'Closed';
        default:
            return status;
    }
}
//# sourceMappingURL=fiveMinuteLessons.js.map