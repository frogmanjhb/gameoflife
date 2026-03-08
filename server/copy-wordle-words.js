const fs = require('fs');
const path = require('path');
const destDir = path.join(__dirname, 'dist', 'games');
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

const toCopy = [
  { name: 'valid-wordle-words.txt', src: path.join(__dirname, 'src', 'games', 'valid-wordle-words.txt') },
  { name: 'wordle_guess_list.txt', src: path.join(__dirname, 'src', 'games', 'wordle_guess_list.txt') }
];

toCopy.forEach(({ name, src }) => {
  const dest = path.join(destDir, name);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('Copied', name, 'to dist/games/');
  } else {
    console.warn(name, 'not found at', src, '- ensure it exists in dist/games/ for Wordle to accept all valid guesses.');
  }
});
