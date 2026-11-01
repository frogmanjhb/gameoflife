/**
 * Extract createWorld from game-of-resources-prototype.html into client TS module.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'game-of-resources-prototype.html'), 'utf8');
const start = html.indexOf('function createWorld(host, labelsEl, cb) {');
const end = html.indexOf('\n// =====================================================================\n// UI', start);
if (start < 0 || end < 0) throw new Error('createWorld block not found');

let body = html.slice(start, end).trim();
body = body.replace(
  /^function createWorld\(host, labelsEl, cb\) \{/,
  `export type World3DCallbacks = {
  onSelect?: (key: string) => void;
  onAutoLite?: () => void;
};

export function createWorld(
  host: HTMLElement,
  labelsEl: HTMLElement,
  cb: World3DCallbacks = {}
) {`
);

const header = `/* eslint-disable */
// @ts-nocheck
// Extracted from game-of-resources-prototype.html — read-only renderer.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CONFIG, PLANET, RULES } from '@game-of-resources';

`;

const footer = `
`;

const outPath = path.join(root, 'client/src/components/game-of-resources/world3d/createWorld.ts');
fs.mkdirSync(path.dirname(outPath), { recursive: true });

let full = header + body + footer;

// Add dispose to returned API
full = full.replace(
  'return { sync, select, setSelLabel, setCursor, setPreview, setLabels, setLight, setLite, isLite: () => lite,\n    disableAutoLite: () => { autoLiteAllowed = false; }, zoomBy, rotate, tour, home, flyTo, playAction, floatLabel, celebrate, touch };',
  `function dispose() {
    running = false;
    ro.disconnect();
    host.removeEventListener('pointerdown', onDown);
    host.removeEventListener('pointermove', onMove);
    host.removeEventListener('pointerup', onUp);
    host.removeEventListener('pointercancel', onUp);
    host.removeEventListener('wheel', onWheel);
    renderer.dispose();
    pmrem.dispose();
    if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      mats.forEach((m) => m.dispose?.());
    });
    labels.forEach((L) => L.el.remove());
  }

  return { sync, select, setSelLabel, setCursor, setPreview, setLabels, setLight, setLite, isLite: () => lite,
    disableAutoLite: () => { autoLiteAllowed = false; }, zoomBy, rotate, tour, home, flyTo, playAction, floatLabel, celebrate, touch, dispose };`
);

fs.writeFileSync(outPath, full);
console.log('Wrote', outPath, full.length, 'chars');
