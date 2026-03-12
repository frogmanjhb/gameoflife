"use strict";
// Word lists for Wordle chore game.
// - Answer words come from valid-wordle-words.txt
// - Additional allowed guesses (never used as answers) come from wordle_guess_list.txt
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORDLE_GUESS_WORDS = exports.WORDLE_WORDS = void 0;
exports.normalizeWord = normalizeWord;
exports.getRandomWord = getRandomWord;
exports.isValidWord = isValidWord;
const fs_1 = require("fs");
const path_1 = require("path");
const FALLBACK_WORDS = [
    'about', 'above', 'actor', 'adult', 'after', 'again', 'agent', 'agree', 'ahead', 'alarm',
    'album', 'alert', 'alike', 'alive', 'allow', 'alone', 'along', 'alter', 'among', 'angel',
    'anger', 'angle', 'angry', 'apart', 'apple', 'apply', 'arena', 'argue', 'arise', 'array',
    'asset', 'audio', 'audit', 'avoid', 'award', 'aware', 'bread', 'break', 'build', 'chair',
    'chief', 'child', 'class', 'clean', 'clear', 'clock', 'close', 'cloud', 'coast', 'color',
    'could', 'count', 'court', 'cover', 'craft', 'cream', 'cross', 'crowd', 'dance', 'death',
    'dream', 'dress', 'drink', 'earth', 'enemy', 'enjoy', 'enter', 'equal', 'event', 'every',
    'faith', 'false', 'field', 'first', 'floor', 'focus', 'force', 'front', 'fruit', 'glass',
    'grass', 'great', 'green', 'group', 'guess', 'guest', 'heart', 'horse', 'hotel', 'house',
    'human', 'ideal', 'image', 'issue', 'judge', 'juice', 'known', 'label', 'large', 'later',
    'learn', 'least', 'leave', 'level', 'light', 'limit', 'local', 'major', 'maker', 'march',
    'match', 'maybe', 'metal', 'model', 'money', 'month', 'motor', 'mouse', 'mouth', 'music',
    'never', 'night', 'north', 'novel', 'nurse', 'occur', 'ocean', 'offer', 'order', 'other',
    'panel', 'paper', 'party', 'peace', 'phase', 'phone', 'place', 'plain', 'plane', 'plant',
    'point', 'power', 'press', 'price', 'prime', 'proof', 'proud', 'quick', 'quiet', 'quote',
    'radio', 'raise', 'range', 'reach', 'ready', 'right', 'river', 'round', 'scale', 'score',
    'sense', 'serve', 'seven', 'shape', 'share', 'sharp', 'sheet', 'shift', 'shine', 'short',
    'sight', 'since', 'skill', 'sleep', 'small', 'smart', 'smile', 'solid', 'sound', 'south',
    'space', 'speak', 'speed', 'spend', 'sport', 'staff', 'stage', 'stand', 'start', 'state',
    'steam', 'stick', 'still', 'stock', 'stone', 'store', 'storm', 'story', 'study', 'style',
    'sugar', 'table', 'taken', 'taste', 'teach', 'thank', 'theme', 'there', 'these', 'thing',
    'think', 'those', 'three', 'throw', 'times', 'title', 'today', 'total', 'touch', 'tough',
    'tower', 'track', 'trade', 'train', 'treat', 'trial', 'tribe', 'trick', 'trust', 'truth',
    'under', 'union', 'until', 'upper', 'usual', 'valid', 'value', 'video', 'visit', 'voice',
    'water', 'wheel', 'where', 'which', 'while', 'white', 'whole', 'woman', 'world', 'would',
    'write', 'wrong', 'young', 'youth'
];
// Resolve directory containing word list files.
// Supports both:
// - Running from compiled code: __dirname === server/dist/games
// - Running from source (e.g. ts-node/tsx): __dirname === server/src/games
function getWordListDir() {
    const sameDir = __dirname;
    if ((0, fs_1.existsSync)((0, path_1.join)(sameDir, 'valid-wordle-words.txt')))
        return sameDir;
    // When running from source, word lists may live in dist/games (compiled assets)
    const distGames = (0, path_1.join)(__dirname, '..', '..', 'dist', 'games');
    if ((0, fs_1.existsSync)((0, path_1.join)(distGames, 'valid-wordle-words.txt')))
        return distGames;
    // When running from compiled code, word lists may live in src/games (checked-out source on server)
    const srcGames = (0, path_1.join)(__dirname, '..', '..', 'src', 'games');
    if ((0, fs_1.existsSync)((0, path_1.join)(srcGames, 'valid-wordle-words.txt')))
        return srcGames;
    return sameDir;
}
function loadAnswerWords() {
    try {
        const dir = getWordListDir();
        const filePath = (0, path_1.join)(dir, 'valid-wordle-words.txt');
        if ((0, fs_1.existsSync)(filePath)) {
            const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
            // Support both "one word per line" and the grouped "Wordle Words List Starting With X" format
            const normalized = content
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter((line) => line.length > 0 &&
                !/^wordle words list starting with/i.test(line))
                .join(' ');
            const words = Array.from(new Set(normalized
                .split(/\s+/)
                .map((w) => w.trim().toLowerCase())
                .filter((w) => w.length === 5 && /^[a-z]+$/.test(w))));
            if (words.length > 0)
                return words;
        }
    }
    catch (_) {
        // ignore
    }
    return FALLBACK_WORDS;
}
function loadGuessList() {
    try {
        const dir = getWordListDir();
        const filePath = (0, path_1.join)(dir, 'wordle_guess_list.txt');
        if ((0, fs_1.existsSync)(filePath)) {
            const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
            const words = Array.from(new Set(content
                .split(/\r?\n/)
                .map((w) => w.trim().toLowerCase())
                .filter((w) => w.length === 5 && /^[a-z]+$/.test(w))));
            if (words.length > 0)
                return words;
        }
    }
    catch (_) {
        // ignore
    }
    return [];
}
const ANSWER_WORDS_RAW = loadAnswerWords();
const GUESS_LIST_WORDS = loadGuessList();
const GUESS_LIST_SET = new Set(GUESS_LIST_WORDS);
// Public answer list: never includes any word that appears in the guess-only list
exports.WORDLE_WORDS = ANSWER_WORDS_RAW.filter((w) => !GUESS_LIST_SET.has(w));
// All words that are allowed as guesses (answers + guess-only words)
exports.WORDLE_GUESS_WORDS = Array.from(new Set([...exports.WORDLE_WORDS, ...GUESS_LIST_WORDS]));
// Normalize for comparison: lowercase, trim
function normalizeWord(w) {
    return w.trim().toLowerCase();
}
function getRandomWord() {
    if (exports.WORDLE_WORDS.length === 0) {
        return exports.WORDLE_GUESS_WORDS.length > 0
            ? exports.WORDLE_GUESS_WORDS[Math.floor(Math.random() * exports.WORDLE_GUESS_WORDS.length)]
            : FALLBACK_WORDS[Math.floor(Math.random() * FALLBACK_WORDS.length)];
    }
    const idx = Math.floor(Math.random() * exports.WORDLE_WORDS.length);
    return exports.WORDLE_WORDS[idx];
}
function isValidWord(word) {
    const n = normalizeWord(word);
    return n.length === 5 && exports.WORDLE_GUESS_WORDS.includes(n);
}
//# sourceMappingURL=wordle-words.js.map