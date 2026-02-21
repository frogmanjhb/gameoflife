const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'src', 'games', 'valid-wordle-words.txt');
const destDir = path.join(__dirname, 'dist', 'games');
const dest = path.join(destDir, 'valid-wordle-words.txt');
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('Copied valid-wordle-words.txt to dist/games/');
} else {
  console.warn('valid-wordle-words.txt not found at', src);
}
