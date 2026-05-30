"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMPTY_TOWN_NEWS_WIDGETS = exports.TOWN_NEWS_EMOJIS = exports.TOWN_NEWS_ACCENTS = exports.TOWN_NEWS_HEADLINE_STYLES = exports.TOWN_NEWS_BADGES = void 0;
exports.parseTownNewsWidgetsFromDb = parseTownNewsWidgetsFromDb;
exports.sanitizeTownNewsWidgets = sanitizeTownNewsWidgets;
exports.widgetsToJson = widgetsToJson;
exports.TOWN_NEWS_BADGES = [
    'breaking',
    'exclusive',
    'sponsored',
    'grand_opening',
    'town_alert',
];
exports.TOWN_NEWS_HEADLINE_STYLES = [
    'classic',
    'tabloid',
    'business_ad',
    'event_poster',
];
exports.TOWN_NEWS_ACCENTS = ['teal', 'gold', 'red'];
exports.TOWN_NEWS_EMOJIS = [
    '🏛️',
    '💰',
    '🎉',
    '⚠️',
    '🛍️',
    '🏥',
    '📢',
    '🎯',
    '⭐',
    '🚌',
];
exports.EMPTY_TOWN_NEWS_WIDGETS = {};
function isBadge(value) {
    return typeof value === 'string' && exports.TOWN_NEWS_BADGES.includes(value);
}
function isHeadlineStyle(value) {
    return typeof value === 'string' && exports.TOWN_NEWS_HEADLINE_STYLES.includes(value);
}
function isAccent(value) {
    return typeof value === 'string' && exports.TOWN_NEWS_ACCENTS.includes(value);
}
function parseTownNewsWidgetsFromDb(raw) {
    if (raw == null || raw === '')
        return { ...exports.EMPTY_TOWN_NEWS_WIDGETS };
    let obj = raw;
    if (typeof raw === 'string') {
        try {
            obj = JSON.parse(raw);
        }
        catch {
            return { ...exports.EMPTY_TOWN_NEWS_WIDGETS };
        }
    }
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return { ...exports.EMPTY_TOWN_NEWS_WIDGETS };
    }
    return sanitizeTownNewsWidgets(obj);
}
function sanitizeTownNewsWidgets(raw) {
    if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
        return { ...exports.EMPTY_TOWN_NEWS_WIDGETS };
    }
    const input = raw;
    const out = {};
    if (input.badge != null && input.badge !== '') {
        if (isBadge(input.badge))
            out.badge = input.badge;
    }
    if (input.headline_style != null && input.headline_style !== '') {
        if (isHeadlineStyle(input.headline_style))
            out.headline_style = input.headline_style;
    }
    if (input.accent != null && input.accent !== '') {
        if (isAccent(input.accent))
            out.accent = input.accent;
    }
    if (Array.isArray(input.emojis)) {
        const allowed = new Set(exports.TOWN_NEWS_EMOJIS);
        const picked = [];
        for (const e of input.emojis) {
            if (typeof e !== 'string' || !allowed.has(e))
                continue;
            if (picked.includes(e))
                continue;
            picked.push(e);
            if (picked.length >= 5)
                break;
        }
        if (picked.length > 0)
            out.emojis = picked;
    }
    return out;
}
function widgetsToJson(widgets) {
    return JSON.stringify(widgets);
}
//# sourceMappingURL=townNewsWidgets.js.map