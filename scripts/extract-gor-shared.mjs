/**
 * One-time / maintenance: extract CONFIG, FACTS, PLANET, RULES from the HTML prototype
 * into shared/game-of-resources/*.ts
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'game-of-resources-prototype.html'), 'utf8');
const pureStart = html.indexOf('/*@PURE-START*/');
const pureEnd = html.indexOf('/*@PURE-END*/');
const pure = html.slice(pureStart, pureEnd);

function sliceBetween(src, startMarker, endMarker) {
  const a = src.indexOf(startMarker);
  const b = src.indexOf(endMarker, a);
  if (a < 0 || b < 0) throw new Error(`Missing ${startMarker}`);
  return src.slice(a + startMarker.length, b).trim();
}

const configBlock = sliceBetween(pure, 'const CONFIG =', '// FACTS');
const factsBlock = sliceBetween(pure, 'const FACTS =', '// RULES');
const planetBlock = sliceBetween(pure, 'const PLANET = (() => {', '})();\n\nconst RULES');
const rulesBlock = sliceBetween(pure, 'const RULES = (() => {', '})();');

const outDir = path.join(root, 'shared', 'game-of-resources');
fs.mkdirSync(outDir, { recursive: true });

const configBody = configBlock.trim().replace(/;\s*$/, '').replace(/\n\s*logCap: 2000\s*$/, '\n  logCap: 2000,\n  inactiveRounds: 3,\n  jobChange: {\n    xpCost: 30,\n    perRound: 1,\n    xpSource: \'game\' as const,\n  }');

const configTs = `// Balancing values — extracted from game-of-resources-prototype.html
// Values marked ASSUMPTION were not available from the Our World brief at build time.

export const CONFIG = ${configBody}} as const;
`;

const factsTs = `// TEACHER CHECK REQUIRED: a teacher must check every fact before use.

export const FACTS = ${factsBlock.trim().replace(/;\s*$/, '')};
`;

const planetTs = `import { CONFIG } from './config';

export type PlanetCell = {
  id: number;
  n: [number, number, number];
  nb: number[];
  key: string | null;
  extra: boolean;
  type?: string;
  home?: boolean;
  islet?: boolean;
  land?: boolean;
  under?: string;
  tileType?: string;
  e?: number;
  m?: number;
  d?: number;
  comp?: number;
};

export type Planet = {
  UP: [number, number, number];
  E1: [number, number, number];
  G0: [number, number, number];
  verts: [number, number, number][];
  tris: number[][];
  cells: PlanetCell[];
  cellOfKey: Record<string, number>;
  hash3: (x: number, y: number, z: number, s: number) => number;
  HOME_MAX: number;
};

export const PLANET: Planet = (() => {
${planetBlock}
})();
`;

const rulesTs = `import { CONFIG } from './config';
import { PLANET } from './planet';
import type { GameState, ProfessionId, Rng } from './types';

export type RuleResult<T = GameState> = { ok: boolean; reason?: string; state: T; event?: Record<string, unknown>; summary?: Record<string, unknown> };

export const RULES = (() => {
${rulesBlock}
})();
`;

fs.writeFileSync(path.join(outDir, 'config.ts'), configTs);
fs.writeFileSync(path.join(outDir, 'facts.ts'), factsTs);
fs.writeFileSync(path.join(outDir, 'planet.ts'), planetTs);
fs.writeFileSync(path.join(outDir, 'rules.ts'), rulesTs);
console.log('Wrote shared/game-of-resources/{config,facts,planet,rules}.ts');
