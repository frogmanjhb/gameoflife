// Utility script to clean the Wordle guess list by removing inappropriate words.
// Run with: node scripts/clean-wordle-guess-list.js

const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

// Basic list of inappropriate words / substrings to exclude from guesses.
// Intentionally kept broad; all checks are case-insensitive and applied to the whole word.
const bannedSubstrings = [
  // General profanity
  'fuck',
  'shit',
  'bitch',
  'bastard',
  'cunt',
  'dick',
  'piss',
  'wank',
  'slut',
  'whore',
  'cock',
  'balls',
  'crap',
  'prick',
  'twat',

  // Sexual terms
  'sex',
  'sexy',
  'porn',
  'penis',
  'vagin',
  'boob',
  'naked',
  'horny',
  'orgasm',
  'erect',
  'sperm',
  'cum',
  'pussy',

  // Common English slurs and hate speech terms (not exhaustive)
  'chink',
  'spic',
  'wetback',
  'fag',
  'dyke',
  'tranny',
  'retard',
  'retarded',
  'moron',
  'idiot',

  // Drug / self-harm heavy terms
  'suicid',
  'suicide',
  'heroin',
  'coke',
  'crack',
  'meth',
];

const bannedPatterns = bannedSubstrings.map((s) => new RegExp(s, 'i'));

function isInappropriate(word) {
  const w = (word || '').toLowerCase();
  if (!w) return false;
  return bannedPatterns.some((re) => re.test(w));
}

function main() {
  const filePath = join(__dirname, '..', 'dist', 'games', 'wordle_guess_list.txt');
  const original = readFileSync(filePath, 'utf-8');

  const lines = original.split(/\r?\n/);
  const kept = [];
  const removed = [];

  for (const line of lines) {
    const word = line.trim();
    if (!word) continue;
    if (isInappropriate(word)) {
      removed.push(word);
    } else {
      kept.push(word);
    }
  }

  const deduped = Array.from(new Set(kept));
  deduped.sort();

  writeFileSync(filePath, deduped.join('\n') + '\n', 'utf-8');

  console.log(`Cleaned wordle_guess_list.txt`);
  console.log(`Original words: ${lines.filter((l) => l.trim()).length}`);
  console.log(`Removed inappropriate: ${removed.length}`);
  console.log(`Remaining (deduped): ${deduped.length}`);
}

main();

