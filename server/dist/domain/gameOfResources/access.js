"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTownClass = isTownClass;
exports.displayNameForUser = displayNameForUser;
exports.tablesReady = tablesReady;
exports.requireApprovedStudentWithRules = requireApprovedStudentWithRules;
exports.resolveStudentTown = resolveStudentTown;
exports.resolveTeacherTown = resolveTeacherTown;
exports.loadDisplayNameMap = loadDisplayNameMap;
exports.generateNickname = generateNickname;
exports.stripHtml = stripHtml;
exports.jobChangeOptsFromSettings = jobChangeOptsFromSettings;
exports.isProfessionId = isProfessionId;
exports.requireTeacherForSchool = requireTeacherForSchool;
exports.schoolIdFromRequest = schoolIdFromRequest;
const database_prod_1 = __importDefault(require("../../database/database-prod"));
const shared_1 = require("./shared");
const TOWN_CLASSES = ['6A', '6B', '6C'];
function isTownClass(v) {
    return typeof v === 'string' && TOWN_CLASSES.includes(v);
}
function displayNameForUser(user) {
    const first = user.first_name?.trim();
    const last = user.last_name?.trim();
    if (first && last)
        return `${first} ${last}`;
    if (first)
        return first;
    return user.username;
}
async function tablesReady() {
    try {
        await database_prod_1.default.query('SELECT 1 FROM gor_worlds LIMIT 1');
        return true;
    }
    catch {
        return false;
    }
}
async function requireApprovedStudentWithRules(req, res) {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return null;
    }
    if (req.user.role !== 'student') {
        res.status(403).json({ error: 'Only students can use this endpoint.' });
        return null;
    }
    if (req.user.status === 'pending') {
        res.status(403).json({ error: 'Your account is still waiting for teacher approval.' });
        return null;
    }
    const row = await database_prod_1.default.get('SELECT rules_agreed_at FROM users WHERE id = $1', [req.user.id]);
    if (!row?.rules_agreed_at) {
        res.status(403).json({ error: 'You must agree to Town Rules before using Game of Resources.' });
        return null;
    }
    if (!req.schoolId) {
        res.status(403).json({ error: 'School context required' });
        return null;
    }
    if (!isTownClass(req.user.class)) {
        res.status(400).json({ error: 'Your account has no valid town class.' });
        return null;
    }
    return req.user;
}
function resolveStudentTown(user) {
    return user.class;
}
function resolveTeacherTown(req, res) {
    const q = req.query.town_class ?? req.body?.town_class;
    if (!isTownClass(q)) {
        res.status(400).json({ error: 'Choose a town class: 6A, 6B, or 6C.' });
        return null;
    }
    return q;
}
async function loadDisplayNameMap(client, schoolId, townClass) {
    const res = await client.query(`SELECT id, username, first_name, last_name FROM users
     WHERE school_id = $1 AND class = $2 AND role = 'student'`, [schoolId, townClass]);
    const map = new Map();
    for (const row of res.rows) {
        map.set(row.id, displayNameForUser(row));
    }
    return map;
}
function generateNickname(userId, worldSeed) {
    const rng = (0, shared_1.mulberry)(worldSeed ^ userId);
    const ADJ = ['Swift', 'Quiet', 'Brave', 'Clever', 'Bright', 'Calm', 'Kind', 'Steady', 'Bold', 'Gentle'];
    const NOUN = ['Heron', 'Baobab', 'Kudu', 'Protea', 'Eland', 'Hornbill', 'Marula', 'Springbok', 'Weaver', 'Leopard'];
    return `${ADJ[Math.floor(rng() * ADJ.length)]} ${NOUN[Math.floor(rng() * NOUN.length)]}`;
}
function stripHtml(text) {
    return text.replace(/<[^>]*>/g, '').trim();
}
function jobChangeOptsFromSettings(settings) {
    const jc = settings?.jobChange ?? {};
    return {
        xpCost: jc.xpCost ?? shared_1.CONFIG.jobChange.xpCost,
        perRound: jc.perRound ?? shared_1.CONFIG.jobChange.perRound,
        xpSource: (jc.xpSource ?? shared_1.CONFIG.jobChange.xpSource),
    };
}
function isProfessionId(v) {
    return typeof v === 'string' && v in shared_1.CONFIG.professions;
}
async function requireTeacherForSchool(req, res) {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return null;
    }
    if (req.user.role !== 'teacher') {
        res.status(403).json({ error: 'Only teachers can use this endpoint.' });
        return null;
    }
    const schoolId = req.schoolId ?? req.user.school_id;
    if (schoolId == null) {
        res.status(403).json({ error: 'School context required' });
        return null;
    }
    return req.user;
}
function schoolIdFromRequest(req) {
    const id = req.schoolId ?? req.user?.school_id;
    if (id == null)
        throw new Error('School context required');
    return id;
}
//# sourceMappingURL=access.js.map