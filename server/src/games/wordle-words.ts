// Word lists for Wordle chore game.
// - Answer words come from valid-wordle-words.txt
// - Additional allowed guesses (never used as answers) come from wordle_guess_list.txt

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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

function loadAnswerWords(): string[] {
  try {
    // At runtime we're in dist/games/, so look for valid-wordle-words.txt next to this file
    const dir = __dirname;
    const path = join(dir, 'valid-wordle-words.txt');
    if (existsSync(path)) {
      const content = readFileSync(path, 'utf-8');

      // Support both "one word per line" and the grouped "Wordle Words List Starting With X" format
      const normalized = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(
          (line) =>
            line.length > 0 &&
            !/^wordle words list starting with/i.test(line),
        )
        .join(' ');

      const words = Array.from(
        new Set(
          normalized
            .split(/\s+/)
            .map((w) => w.trim().toLowerCase())
            .filter((w) => w.length === 5 && /^[a-z]+$/.test(w)),
        ),
      );

      if (words.length > 0) return words;
    }
  } catch (_) {
    // ignore
  }
  return FALLBACK_WORDS;
}

function loadGuessList(): string[] {
  try {
    const dir = __dirname;
    const path = join(dir, 'wordle_guess_list.txt');
    if (existsSync(path)) {
      const content = readFileSync(path, 'utf-8');

      const words = Array.from(
        new Set(
          content
            .split(/\r?\n/)
            .map((w) => w.trim().toLowerCase())
            .filter((w) => w.length === 5 && /^[a-z]+$/.test(w)),
        ),
      );

      if (words.length > 0) return words;
    }
  } catch (_) {
    // ignore
  }
  return [];
}

const ANSWER_WORDS_RAW = loadAnswerWords();
const GUESS_LIST_WORDS = loadGuessList();
const GUESS_LIST_SET = new Set(GUESS_LIST_WORDS);

// Public answer list: never includes any word that appears in the guess-only list
export const WORDLE_WORDS: string[] = ANSWER_WORDS_RAW.filter(
  (w) => !GUESS_LIST_SET.has(w),
);

// All words that are allowed as guesses (answers + guess-only words)
export const WORDLE_GUESS_WORDS: string[] = Array.from(
  new Set([...WORDLE_WORDS, ...GUESS_LIST_WORDS]),
);

// Normalize for comparison: lowercase, trim
export function normalizeWord(w: string): string {
  return w.trim().toLowerCase();
}

export function getRandomWord(): string {
  const idx = Math.floor(Math.random() * WORDLE_WORDS.length);
  return WORDLE_WORDS[idx];
}

export function isValidWord(word: string): boolean {
  const n = normalizeWord(word);
  return n.length === 5 && WORDLE_GUESS_WORDS.includes(n);
}
