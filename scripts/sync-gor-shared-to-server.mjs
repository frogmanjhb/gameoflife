import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const src = path.join(root, 'shared', 'game-of-resources');
const dest = path.join(root, 'server', 'src', 'domain', 'gameOfResources', 'shared');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const name of fs.readdirSync(from)) {
    const sf = path.join(from, name);
    const df = path.join(to, name);
    if (fs.statSync(sf).isDirectory()) copyDir(sf, df);
    else {
      if (name.endsWith('.ts')) {
        const body = fs.readFileSync(sf, 'utf8');
        const header = body.startsWith('// @ts-nocheck') ? '' : '// @ts-nocheck\n';
        fs.writeFileSync(df, header + body);
      } else fs.copyFileSync(sf, df);
    }
  }
}

fs.rmSync(dest, { recursive: true, force: true });
copyDir(src, dest);
console.log('Synced shared/game-of-resources -> server/src/domain/gameOfResources/shared');
