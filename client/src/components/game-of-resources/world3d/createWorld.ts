/* eslint-disable */
// @ts-nocheck
// Extracted from game-of-resources-prototype.html — read-only renderer.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CONFIG, PLANET, RULES } from '@game-of-resources';

export type World3DCallbacks = {
  onSelect?: (key: string) => void;
  onAutoLite?: () => void;
  onInteract?: () => void;
  onFigureClick?: (citizenId: string) => void;
  onPlaceFigure?: (citizenId: string, tileKey: string, fx: number, fz: number) => void;
};

export function createWorld(
  host: HTMLElement,
  labelsEl: HTMLElement,
  cb: World3DCallbacks = {}
) {
  const reducedMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => reducedMQ.matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 220);
  const keyLight = new THREE.DirectionalLight(0xfff4e2, 1.6);
  keyLight.position.set(9, 15, 8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);                 // the one shadow map
  Object.assign(keyLight.shadow.camera, { left: -8.5, right: 8.5, top: 8.5, bottom: -8.5, near: 4, far: 40 });
  keyLight.shadow.bias = -0.0006; keyLight.shadow.normalBias = 0.03;
  scene.add(keyLight);
  const rim = new THREE.DirectionalLight(0x9cc8ff, 0.5);
  rim.position.set(-9, 5, -8);
  scene.add(rim);

  // ---- planet helpers ----
  // The planet is built at local radius R (cells about 1 unit apart) and the
  // whole group is scaled so that it appears with radius WORLD_R.
  const R = 10.8, WORLD_R = 6;
  const planet = new THREE.Group(); planet.scale.setScalar(WORLD_R / R); scene.add(planet);
  let view = null;                                            // latest state seen (read only)
  const UP = new THREE.Vector3(0, 1, 0);
  const V3 = THREE.Vector3;
  const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: true, ...o });
  const dummy = new THREE.Object3D();
  const qLoc = new THREE.Quaternion(), qTmp = new THREE.Quaternion(), eTmp = new THREE.Euler();
  function compose(f, h, yaw, roll, sx, sy, sz) {
    dummy.position.copy(f.n).multiplyScalar(R + h);
    eTmp.set(0, yaw, roll); qLoc.setFromEuler(eTmp);
    dummy.quaternion.copy(f.q).multiply(qLoc);
    dummy.scale.set(sx, sy, sz); dummy.updateMatrix();
    return dummy.matrix;
  }
  function placeObj(obj, f, h, sx = 1, sy = 1, sz = 1, yaw = 0) {
    obj.position.copy(f.n).multiplyScalar(R + h); obj.quaternion.copy(f.q); if (yaw) obj.quaternion.multiply(qTmp.setFromAxisAngle(UP, yaw)); obj.scale.set(sx, sy, sz);
  }

  // ---- hexagon globe from PLANET (shared with the rules) ----
  const gVerts = PLANET.verts.map((a) => new V3(a[0], a[1], a[2]));
  const gTris = PLANET.tris;
  const triCentre = gTris.map((t) => gVerts[t[0]].clone().add(gVerts[t[1]]).add(gVerts[t[2]]).normalize());
  const vTris = gVerts.map(() => []); gTris.forEach((t, ti) => t.forEach((v) => vTris[v].push(ti)));
  const E1 = new V3(...PLANET.E1);
  const EX = E1.clone().addScaledVector(UP, -E1.dot(UP)).normalize();
  const EZ = new V3().crossVectors(EX, UP);
  const Q0 = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(EX, UP, EZ));
  function frameAt(n) {
    let ref = EX; if (Math.abs(ref.dot(n)) > 0.95) ref = EZ;
    const x = ref.clone().addScaledVector(n, -ref.dot(n)).normalize();
    const z = new V3().crossVectors(x, n);
    return { n, x, z, q: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, n, z)), sx: 1, sz: 1 };
  }
  const cells = gVerts.map((n, id) => {
    const f = frameAt(n); const pc = PLANET.cells[id];
    const corners = vTris[id].map((ti) => triCentre[ti]).sort((p, q) => Math.atan2(q.dot(f.z), q.dot(f.x)) - Math.atan2(p.dot(f.z), p.dot(f.x)));   // anticlockwise seen from outside
    const d0 = corners[0].clone().addScaledVector(n, -corners[0].dot(n));
    f.phi = Math.atan2(d0.dot(f.z), d0.dot(f.x));
    f.rad = corners.reduce((sum, c) => sum + c.distanceTo(n), 0) / corners.length * R;
    return { id, n, f, corners, nb: pc.nb, key: pc.key, type: pc.type, home: !!pc.home, islet: !!pc.islet };
  });
  function surfN(x, z, out = new V3()) { return out.copy(UP).multiplyScalar(R).addScaledVector(EX, x).addScaledVector(EZ, z).normalize(); }
  function nq(x, z) { const n = surfN(x, z); return { n, q: new THREE.Quaternion().setFromUnitVectors(UP, n).multiply(Q0) }; }
  function tileNQ(f, ox, oz) {
    const n = f.n.clone().multiplyScalar(R).addScaledVector(f.x, ox * f.sx).addScaledVector(f.z, oz * f.sz).normalize();
    return { n, q: new THREE.Quaternion().setFromUnitVectors(f.n, n).multiply(f.q) };
  }
  const FR = {}, FLAT = {}, CELL_OF = {};
  cells.forEach((c) => {
    if (!c.key) return;
    FR[c.key] = c.f; CELL_OF[c.key] = c;
    const pp = c.n.clone().multiplyScalar(R / c.n.dot(UP)); FLAT[c.key] = [pp.dot(EX), pp.dot(EZ)];
  });
  const isCellKey = (key) => typeof key === 'string' && key.startsWith('cell:');
  const cellOfAny = (key) => (isCellKey(key) ? cells[Number(key.slice(5))] : CELL_OF[key]);
  const frameOfKey = (key) => cellOfAny(key).f;
  function flat(key) {
    if (FLAT[key]) return FLAT[key];
    const c = cellOfAny(key); if (!c || c.n.y < 0.3) return null;
    const pp = c.n.clone().multiplyScalar(R / c.n.dot(UP)); return [pp.dot(EX), pp.dot(EZ)];
  }
  const localPoint = (key, h, out) => out.copy(frameOfKey(key).n).multiplyScalar(R + h);

  // ---- hexagon cell meshes: each cell uses its exact outline, so neighbours fit with no gaps ----
  const INSET = 0.08, BEV = 0.045, BASE = 0.6;
  function cellMesh(list, mat) {
    let nv = 0, nt = 0;
    list.forEach((c) => { const k = c.corners.length; nv += 1 + 4 * k; nt += 5 * k; });
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
    const idx = new Uint32Array(nt * 3), triCell = new Int32Array(nt), vStart = [];
    let v = 0, t = 0;
    list.forEach((c, ci) => {
      const k = c.corners.length; vStart.push(v);
      const I = v + 1, Bv = v + 1 + k, St = v + 1 + 2 * k, Sb = v + 1 + 3 * k;
      for (let j = 0; j < k; j++) {
        const j1 = (j + 1) % k;
        idx.set([v, I + j, I + j1], t * 3); triCell[t++] = ci;
        idx.set([I + j, Bv + j, Bv + j1], t * 3); triCell[t++] = ci;
        idx.set([I + j, Bv + j1, I + j1], t * 3); triCell[t++] = ci;
        idx.set([St + j, Sb + j, Sb + j1], t * 3); triCell[t++] = ci;
        idx.set([St + j, Sb + j1, St + j1], t * 3); triCell[t++] = ci;
      }
      v += 1 + 4 * k;
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    const mesh = new THREE.Mesh(geo, mat); mesh.receiveShadow = true; planet.add(mesh);
    const tmp = new V3(), out = new V3(), cc = new THREE.Color();
    const put = (i, p, s, n, colr, shade) => { pos.set([p.x * s, p.y * s, p.z * s], i * 3); nor.set([n.x, n.y, n.z], i * 3); col.set([colr.r * shade, colr.g * shade, colr.b * shade], i * 3); };
    function write(ci, h, colour) {
      const c = list[ci], k = c.corners.length, b = vStart[ci]; cc.copy(colour);
      put(b, c.n, R + h, c.n, cc, 1);
      for (let j = 0; j < k; j++) {
        const cj = c.corners[j];
        tmp.copy(c.n).lerp(cj, 1 - INSET).normalize(); put(b + 1 + j, tmp, R + h, tmp, cc, 1);
        out.copy(cj).addScaledVector(c.n, -cj.dot(c.n)).normalize();
        tmp.copy(cj).add(out.clone().multiplyScalar(0.9)).normalize(); put(b + 1 + k + j, cj, R + h - BEV, tmp, cc, 0.9);
        put(b + 1 + 2 * k + j, cj, R + h - BEV, out, cc, 0.72);
        put(b + 1 + 3 * k + j, cj, R - BASE, out, cc, 0.55);
      }
    }
    function done() { geo.attributes.position.needsUpdate = true; geo.attributes.normal.needsUpdate = true; geo.attributes.color.needsUpdate = true; geo.computeBoundingSphere(); }
    return { mesh, list, triCell, write, done };
  }
  const vcMat = (o = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, ...o });

  // ---- atmosphere glow ----
  const atmoU = { uColor: { value: new THREE.Color(0x8fd3ff) }, uStrength: { value: 1 } };
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(WORLD_R * 1.17, 48, 32), new THREE.ShaderMaterial({
    uniforms: atmoU, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uColor; uniform float uStrength; varying vec3 vN; varying vec3 vV; void main(){ float d = -dot(vN, vV); float g = pow(smoothstep(0.0, 0.55, d), 1.6) * uStrength; gl_FragColor = vec4(uColor * g, g); }'
  }));
  scene.add(atmo);

  // ---- stars (visible at dusk and night) ----
  const STAR_N = 500; const starPos = new Float32Array(STAR_N * 3);
  for (let i = 0; i < STAR_N; i++) {
    const v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiplyScalar(90);
    starPos.set([v.x, v.y, v.z], i * 3);
  }
  const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false });
  const stars = new THREE.Points(starGeo, starMat); scene.add(stars);

  // ---- planet core (sits under every cell) ----
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(R - BASE + 0.03, 5), M(0x1d4a66, { flatShading: false }));
  planet.add(core);

  // ---- the playable island (RULES tiles) ----
  const TYPE_COL = { forest: 0x6f9e4f, farm: 0x9a6b3f, quarry: 0x9d9b94, land: 0xa9bd6e, town: 0xd8cdb0, site: 0xc9bb8a };
  const allTiles = RULES.TILES;
  const islandLandTiles = allTiles.filter((t) => t.type !== 'river');
  const riverTiles = allTiles.filter((t) => t.type === 'river');
  const islandLand = cellMesh(islandLandTiles.map((t) => CELL_OF[t.key]), vcMat());
  const riverMat = vcMat({ roughness: 0.25, emissive: 0x113344, emissiveIntensity: 0 });
  const islandRiver = cellMesh(riverTiles.map((t) => CELL_OF[t.key]), riverMat);
  let rise = 0, riseTarget = 0;                                   // bridge land: 0 = under the sea, 1 = risen
  const UNDER = {}; RULES.TILES.filter((t) => t.extra).forEach((t) => { UNDER[t.key] = PLANET.cells[PLANET.cellOfKey[t.key]].under || 'shallow'; });
  const yOff = (t) => (t.extra ? (1 - rise) * CONFIG.terrain[UNDER[t.key]].h : 0);
  const kx = (t) => (t.extra ? Math.max(1e-4, rise) : 1);
  const tileTop = (t) => (t.type === 'quarry' ? -0.2 : t.type === 'river' ? -0.06 : 0) + yOff(t);
  function topOfKey(key) {
    const c = cellOfAny(key); const ov = view && view.land && view.land[c.id];
    if (ov) return TERRAIN[ov.type].h;
    if (c.key) return tileTop(RULES.TILE[c.key]);
    return TERRAIN[effType(c)].h;
  }
  const landCol = islandLandTiles.map((t) => new THREE.Color(TYPE_COL[t.type]).offsetHSL(0, 0, ((t.r * 7 + t.c * 3) % 5) * 0.006));
  const mixCol = new THREE.Color(), underCol = new THREE.Color();
  const PIT_FLOOR = -0.56;                                     // quarry cells sit low; the stepped pit is drawn on top
  function writeIsland() {
    islandLandTiles.forEach((t, i) => {
      const ov = view && view.land && view.land[CELL_OF[t.key].id];
      if (ov) { const T = CONFIG.terrain[ov.type]; islandLand.write(i, ov.type === 'quarry' ? PIT_FLOOR : T.h, mixCol.set(T.col)); return; }
      if (t.extra) {
        const u = UNDER[t.key]; if (u === 'river') underCol.copy(riverColCur); else underCol.set(CONFIG.terrain[u].col);
        islandLand.write(i, tileTop(t), mixCol.lerpColors(underCol, landCol[i], Math.min(1, Math.max(0, (rise - 0.3) / 0.7))));
      } else islandLand.write(i, t.type === 'quarry' ? PIT_FLOOR : tileTop(t), landCol[i]);
    });
    islandLand.done();
  }
  const riverColCur = new THREE.Color(CONFIG.waterBands[0].colour), riverColTarget = riverColCur.clone();
  function writeRiver() { riverTiles.forEach((t, i) => islandRiver.write(i, tileTop(t), riverColCur)); islandRiver.done(); }
  writeIsland(); writeRiver();

  // ---- the rest of the globe: terrain from PLANET, changed by land works and development ----
  const TERRAIN = CONFIG.terrain;
  const hash3 = PLANET.hash3;
  const far = cells.filter((c) => !c.key);
  const effType = (c) => (view && view.land && view.land[c.id] ? view.land[c.id].type : c.type);
  const farLand = cellMesh(far, vcMat());                     // every far cell; water cells are tucked away under the core
  const farWaterCells = far.filter((c) => TERRAIN[c.type].water);
  const waterIdx = new Map(farWaterCells.map((c, i) => [c.id, i]));
  const waterU = { uTime: { value: 0 }, uAmp: { value: 0.025 } };
  const farWaterMat = vcMat({ roughness: 0.3 });
  farWaterMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = waterU.uTime; sh.uniforms.uAmp = waterU.uAmp;
    sh.vertexShader = 'uniform float uTime;\nuniform float uAmp;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      `#include <begin_vertex>
      vec3 pn = normalize(position);
      float wv = sin(pn.x * 23.0 + uTime * 0.9) * cos(pn.z * 19.0 + uTime * 0.7) + 0.5 * sin(pn.y * 29.0 + uTime * 1.2);
      transformed += pn * wv * uAmp;`);
  };
  const farWater = cellMesh(farWaterCells, farWaterMat);
  const HIDE = -BASE - 0.1, tmpC = new THREE.Color();
  function writeFar() {
    far.forEach((c, i) => {
      let t = effType(c); if (t === 'bridge') t = (view && view.land[c.id] && view.land[c.id].under) || 'shallow';
      const T = TERRAIN[t];
      if (t === 'river' && c.home) tmpC.copy(riverColCur); else tmpC.set(T.col).offsetHSL(0, 0, (hash3(c.id, 3, 7, 1) - 0.5) * (T.water ? 0.03 : 0.05));
      farLand.write(i, T.water ? HIDE : (t === 'quarry' ? PIT_FLOOR : T.h), tmpC);
      const wi = waterIdx.get(c.id);
      if (wi !== undefined) farWater.write(wi, T.water ? T.h : HIDE, tmpC);
    });
    farLand.done(); farWater.done();
  }
  // decorations: rebuilt only when the land changes
  const pool = (geo, mat, cap, shadow = true) => { const m = new THREE.InstancedMesh(geo, mat, cap); m.count = 0; m.castShadow = shadow; planet.add(m); return m; };
  const farTreeGeo = new THREE.ConeGeometry(0.15, 0.46, 6); farTreeGeo.translate(0, 0.25, 0);
  const peakGeo = new THREE.ConeGeometry(0.4, 0.6, 6); peakGeo.translate(0, 0.3, 0);
  const snowGeo = new THREE.ConeGeometry(0.16, 0.25, 6); snowGeo.translate(0, 0.475, 0);
  const sproutGeo = new THREE.ConeGeometry(0.05, 0.15, 5); sproutGeo.translate(0, 0.075, 0);
  const rockGeo = new THREE.DodecahedronGeometry(0.12, 0); rockGeo.translate(0, 0.06, 0);
  const hutGeo = new THREE.BoxGeometry(0.2, 0.16, 0.2); hutGeo.translate(0, 0.08, 0);
  const hutRoofGeo = new THREE.ConeGeometry(0.17, 0.13, 4); hutRoofGeo.rotateY(Math.PI / 4); hutRoofGeo.translate(0, 0.225, 0);
  const deckGeo = new THREE.BoxGeometry(1.05, 0.07, 0.34); deckGeo.translate(0, 0.12, 0);
  const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.34, 5); postGeo.translate(0, 0.08, 0);
  const moundGeo = new THREE.ConeGeometry(0.3, 0.16, 7); moundGeo.translate(0, 0.02, 0);
  const D = {
    trees: pool(farTreeGeo, M(0x3f7d3a), 3600), peaks: pool(peakGeo, M(0x8a8478), 260), snows: pool(snowGeo, M(0xf6f8fa), 260, false),
    sprouts: pool(sproutGeo, M(0xffffff), 1400), rocks: pool(rockGeo, M(0x8d8b85), 500), huts: pool(hutGeo, M(0xf3e6c8), 700),
    roofs: pool(hutRoofGeo, M(0xc4473a), 700), decks: pool(deckGeo, M(0xb9b4a8), 80), posts: pool(postGeo, M(0xb07a45), 400), mounds: pool(moundGeo, M(0xd9c48f), 40, false)
  };
  const put = (m, f, h, yaw = 0, s = 1, sy = s) => { if (m.count < m.instanceMatrix.count) m.setMatrixAt(m.count++, compose(f, h, yaw, 0, s, sy, s)); };
  function writeDecor() {
    Object.values(D).forEach((m) => { m.count = 0; });
    const devIsland = cells.filter((c) => c.key && view && view.land && view.land[c.id]);
    far.concat(devIsland).forEach((c) => {
      const t = effType(c), T = TERRAIN[t], h = T.h, rnd2 = (k) => hash3(c.id, k, 2, 2);
      const devd = view && view.land && view.land[c.id] && view.land[c.id].dev;
      if (t === 'forest') { const nT = devd ? Math.round(RULES.treesOn(view, 'cell:' + c.id) / CONFIG.treesPerTile * 4) : 4; [[-0.2, -0.16], [0.18, -0.1], [-0.04, 0.2], [0.22, 0.2]].slice(0, nT).forEach(([x, z], k) => put(D.trees, tileNQ(c.f, x, z), h, rnd2(k) * 6, 0.9 + rnd2(k) * 0.5)); }
      else if ((t === 'grass' || t === 'meadow') && hash3(c.id, 1, 1, 4) > 0.6) put(D.trees, tileNQ(c.f, 0.1, -0.1), h, 3, 1.15);
      else if (t === 'beach' && c.islet) put(D.trees, tileNQ(c.f, 0.05, 0), h, 1, 1);
      else if (t === 'mountain') { const sy = 0.9 + (PLANET.cells[c.id].e - 0.34) * 1.5; put(D.peaks, c.f, h - 0.02, c.id, 1, sy); if (PLANET.cells[c.id].e > 0.5 || c.n.y < -0.4) put(D.snows, c.f, h - 0.02, c.id, 1, sy); }
      else if (t === 'farm') { const hp = view ? RULES.health(view, 'cell:' + c.id) : 100; sproutCol.set(0x4f9a3c).lerp(cropPale, (1 - hp / 100) * 0.75); [-0.24, 0, 0.24].forEach((z) => [-0.24, 0, 0.24].forEach((x) => { D.sprouts.setColorAt(D.sprouts.count, sproutCol); put(D.sprouts, tileNQ(c.f, x, z), h); })); }
      else if (t === 'houses') [[-0.18, -0.12], [0.18, -0.08], [0, 0.2]].forEach(([x, z], k) => { const f = tileNQ(c.f, x, z); put(D.huts, f, h, k * 0.4); put(D.roofs, f, h, k * 0.4); });
      else if (t === 'bridge') {
        const land = c.nb.map((id) => cells[id]).filter((o) => o.key || !TERRAIN[effType(o)].water);
        let yaw = 0;
        if (land.length >= 2) { const d = land[land.length - 1].n.clone().sub(land[0].n); yaw = -Math.atan2(d.dot(c.f.z), d.dot(c.f.x)); }
        put(D.decks, c.f, 0, yaw);
      }
    });
    // work sites in progress
    const works = (view && view.works) || {};
    if (works.reclaim) { const c = cells[works.reclaim.cell]; put(D.mounds, c.f, TERRAIN.shallow.h, 0, 1 + RULES.workProgress(view, 'reclaim') / 100); [[-0.3, -0.3], [0.3, -0.3], [0.3, 0.3], [-0.3, 0.3]].forEach(([x, z]) => put(D.posts, tileNQ(c.f, x, z), TERRAIN.shallow.h)); }
    if (works.link) { const c = cells[works.link.cell]; [[-0.38, -0.12], [-0.38, 0.12], [0.38, -0.12], [0.38, 0.12], [0, -0.12], [0, 0.12]].forEach(([x, z]) => put(D.posts, tileNQ(c.f, x, z), TERRAIN.shallow.h, 0, 1, 0.6 + RULES.workProgress(view, 'link') / 100)); }
    Object.values(D).forEach((m) => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  }
  const sproutCol = new THREE.Color();
  const homeRivers = far.filter((c) => c.home && c.type === 'river');
  function writeHomeRivers() {
    homeRivers.forEach((c) => { const wi = waterIdx.get(c.id); if (wi !== undefined && effType(c) === 'river') farWater.write(wi, TERRAIN.river.h, riverColCur); });
    farWater.done();
  }
  writeFar(); writeDecor();
  let landSig = '', decorSig = '';

  // ---- trees (InstancedMesh) ----
  const forestTiles = allTiles.filter((t) => t.type === 'forest');
  const SLOTS = [[-0.28, -0.26], [0.06, -0.3], [0.3, -0.04], [-0.24, 0.14], [0.06, 0.12], [0.28, 0.3]];
  const trunkGeo = new THREE.CylinderGeometry(0.035, 0.05, 0.16, 6); trunkGeo.translate(0, 0.08, 0);
  const crownGeo = new THREE.ConeGeometry(0.17, 0.42, 7); crownGeo.translate(0, 0.36, 0);
  const nTrees = forestTiles.length * SLOTS.length;
  const trunks = new THREE.InstancedMesh(trunkGeo, M(0x7a5232), nTrees);
  const crowns = new THREE.InstancedMesh(crownGeo, M(0xffffff), nTrees);
  trunks.castShadow = crowns.castShadow = true;
  planet.add(trunks, crowns);
  const trees = [];
  forestTiles.forEach((t) => SLOTS.forEach(([sx, sz], j) => {
    const h = ((t.r * 31 + t.c * 17 + j * 13) % 100) / 100;
    const ox = sx + (h - 0.5) * 0.08, oz = sz + (h - 0.5) * 0.06;
    trees.push({ tile: t, j, f: tileNQ(FR[t.key], ox, oz), size: 0.85 + h * 0.35, phase: h * 6.28, cur: 0, target: 0, fall: -1, dir: h > 0.5 ? 1 : -1, hue: h });
  }));
  const crownHealthy = new THREE.Color(0x3f7d3a), crownWeak = new THREE.Color(0x8a9a4a);
  const crownCol = new THREE.Color(), tmpCol = new THREE.Color();

  // ---- farms ----
  const farmTiles = allTiles.filter((t) => t.type === 'farm');
  const cropGeo = new THREE.ConeGeometry(0.05, 0.16, 5); cropGeo.translate(0, 0.08, 0);
  const furrowGeo = new THREE.BoxGeometry(0.86, 0.035, 0.11); furrowGeo.translate(0, 0.0175, 0);
  const crops = new THREE.InstancedMesh(cropGeo, M(0xffffff), farmTiles.length * 12);
  const furrows = new THREE.InstancedMesh(furrowGeo, M(0x6f4a2a), farmTiles.length * 3);
  crops.castShadow = true; furrows.receiveShadow = true; crops.visible = furrows.visible = false;   // replaced by the hexagon fields
  planet.add(crops, furrows);
  const cropF = [], furF = [];
  farmTiles.forEach((tile) => {
    const F0 = FR[tile.key];
    [-0.27, 0, 0.27].forEach((dz, row) => {
      furF.push({ tile, f: tileNQ(F0, 0, dz), sx: 0.75 });
      [-0.3, -0.1, 0.1, 0.3].forEach((dx, k) => cropF.push({ tile, f: tileNQ(F0, dx, dz), row, k, dx }));
    });
  });
  const tmpCrop = new THREE.Color();
  const cropRich = new THREE.Color(0x3f9a3a), cropPale = new THREE.Color(0xd8cf7a), cropCur = new THREE.Color(0x3f9a3a), cropTarget = new THREE.Color(0x3f9a3a);
  function writeFarms(t, idleNow) {
    furF.forEach((o, i) => { const k = kx(o.tile); furrows.setMatrixAt(i, compose(o.f, yOff(o.tile), 0, 0, o.sx * k, k, k)); });
    cropF.forEach((o, i) => {
      const sway = idleNow && !reduced() ? Math.sin(t * 2 + o.dx * 4 + o.row) * 0.06 : 0;
      const s = (0.9 + ((o.k + o.row) % 3) * 0.1) * kx(o.tile);
      const hp = view ? RULES.health(view, o.tile.key) : 100; tmpCrop.copy(cropCur).lerp(cropPale, (1 - hp / 100) * 0.75);
      crops.setMatrixAt(i, compose(o.f, yOff(o.tile) + 0.03, 0, sway, s, s, s)); crops.setColorAt(i, tmpCrop);
    });
    crops.instanceMatrix.needsUpdate = true; crops.instanceColor.needsUpdate = true; furrows.instanceMatrix.needsUpdate = true;
  }

  // ---- quarry ----
  const quarryTiles = allTiles.filter((t) => t.type === 'quarry');
  const ringMat = M(0x8d8b85), floorMat = M(0x6d6b66);
  const quarries = quarryTiles.map((t) => {
    const g = new THREE.Group(); placeObj(g, FR[t.key], 0, 0.78, 1, 0.78);
    const rings = [];
    for (let k = 0; k < 4; k++) {
      const a = 0.485 - k * 0.1, w = 0.1;
      const shape = new THREE.Shape(); shape.moveTo(-a, -a); shape.lineTo(a, -a); shape.lineTo(a, a); shape.lineTo(-a, a); shape.lineTo(-a, -a);
      const hole = new THREE.Path(); const b = a - w; hole.moveTo(-b, -b); hole.lineTo(-b, b); hole.lineTo(b, b); hole.lineTo(b, -b); hole.lineTo(-b, -b);
      shape.holes.push(hole);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false }); geo.rotateX(-Math.PI / 2); geo.translate(0, -0.05, 0);
      const m = new THREE.Mesh(geo, ringMat); m.position.y = -k * 0.045; m.receiveShadow = true; m.castShadow = true;
      g.add(m); rings.push(m);
    }
    const floor = new THREE.Mesh(new THREE.BoxGeometry(1, 0.04, 1), floorMat); g.add(floor);
    planet.add(g);
    return { g, rings, floor };
  });
  function writeQuarry(mined) {
    quarries.forEach((q) => { q.g.visible = false; });   // replaced by the hexagonal pits
    return;
    const d = Math.min(3, Math.floor(mined / CONFIG.quarryStep));
    quarries.forEach((q) => {
      q.rings.forEach((r, k) => { r.visible = k <= d; });
      const inner = 2 * (0.485 - d * 0.1 - 0.1);
      q.floor.scale.set(inner, 1, inner); q.floor.position.y = -d * 0.045 - 0.07;
    });
  }

  // ---- farm fields and quarry pits, shaped to each cell's own hexagon ----
  const local2 = (c, corner, r = 1) => { const v = corner.clone().addScaledVector(c.n, -corner.dot(c.n)); return [v.dot(c.f.x) * R * r, v.dot(c.f.z) * R * r]; };
  const fieldPool = (geo, mat, cap, shadow = true) => { const m = new THREE.InstancedMesh(geo, mat, cap); m.count = 0; m.castShadow = shadow; m.receiveShadow = true; planet.add(m); return m; };
  const ridgeGeo = new THREE.BoxGeometry(1, 0.035, 0.065); ridgeGeo.translate(0, 0.0175, 0);
  const maizeGeo = new THREE.ConeGeometry(0.032, 0.24, 5); maizeGeo.translate(0, 0.12, 0);
  const wheatGeo = new THREE.ConeGeometry(0.03, 0.1, 4); wheatGeo.translate(0, 0.05, 0);
  const vegGeo = new THREE.IcosahedronGeometry(0.042, 0); vegGeo.translate(0, 0.04, 0);
  const hedgeGeo = new THREE.BoxGeometry(1, 0.09, 0.07); hedgeGeo.translate(0, 0.045, 0);
  const hayGeo = new THREE.CylinderGeometry(0.07, 0.075, 0.09, 10); hayGeo.rotateZ(Math.PI / 2); hayGeo.translate(0, 0.075, 0);
  const rubbleGeo = new THREE.ConeGeometry(0.15, 0.13, 6); rubbleGeo.translate(0, 0.065, 0);
  const boulderGeo = new THREE.DodecahedronGeometry(0.07, 0); boulderGeo.translate(0, 0.05, 0);
  const cartGeo = new THREE.BoxGeometry(0.14, 0.07, 0.09); cartGeo.translate(0, 0.06, 0);
  const F = {
    ridges: fieldPool(ridgeGeo, M(0x6b4426), 900, false), maize: fieldPool(maizeGeo, M(0xffffff), 3000), wheat: fieldPool(wheatGeo, M(0xffffff), 3000),
    veg: fieldPool(vegGeo, M(0xffffff), 3000), hedges: fieldPool(hedgeGeo, M(0x3f6e2f), 700), hay: fieldPool(hayGeo, M(0xd9b45a), 120),
    rubble: fieldPool(rubbleGeo, M(0x9a958b), 120), boulders: fieldPool(boulderGeo, M(0x8a867e), 400), carts: fieldPool(cartGeo, M(0x8a5a33), 120)
  };
  const CROP = [
    { pool: 'maize', ok: new THREE.Color(0x4f9a3c), worn: new THREE.Color(0xc9b46a), step: 0.1 },
    { pool: 'wheat', ok: new THREE.Color(0xd8b34a), worn: new THREE.Color(0x9a7b4a), step: 0.075 },
    { pool: 'veg', ok: new THREE.Color(0x5aa848), worn: new THREE.Color(0xb7a764), step: 0.1 }
  ];
  const cropCol = new THREE.Color();
  const putF = (m, f, h, yaw, sx, sy, sz) => { if (m.count < m.instanceMatrix.count) { m.setMatrixAt(m.count, compose(f, h, yaw, 0, sx, sy, sz)); m.count++; return m.count - 1; } return -1; };
  // where a horizontal line crosses the hexagon, in row-aligned coordinates
  function rowSpan(poly, w) {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < poly.length; i++) {
      const [u1, w1] = poly[i], [u2, w2] = poly[(i + 1) % poly.length];
      if ((w1 - w) * (w2 - w) > 0 || w1 === w2) continue;
      const u = u1 + (u2 - u1) * (w - w1) / (w2 - w1); lo = Math.min(lo, u); hi = Math.max(hi, u);
    }
    return hi > lo ? [lo, hi] : null;
  }
  function farmPlaces() {
    const out = [];
    RULES.TILES.forEach((t) => { if (t.type !== 'farm') return; const c = CELL_OF[t.key]; if (view && view.land && view.land[c.id]) return; out.push({ c, key: t.key, h: tileTop(t), k: kx(t) }); });
    cells.forEach((c) => { const o = view && view.land && view.land[c.id]; if (o && o.type === 'farm') out.push({ c, key: 'cell:' + c.id, h: TERRAIN.farm.h, k: 1 }); });
    return out;
  }
  function quarryPlaces() {
    const out = [];
    RULES.TILES.forEach((t) => { if (t.type === 'quarry') out.push({ c: CELL_OF[t.key], key: t.key }); });
    cells.forEach((c) => { const o = view && view.land && view.land[c.id]; if (o && o.type === 'quarry') out.push({ c, key: 'cell:' + c.id }); });
    return out;
  }
  function writeFields() {
    ['ridges', 'maize', 'wheat', 'veg', 'hedges', 'hay'].forEach((k) => { F[k].count = 0; });
    const places = farmPlaces(); const farmIds = new Set(places.map((p) => p.c.id));
    const soil = view ? view.env.soil : 75;
    places.forEach(({ c, key, h, k }) => {
      if (k < 0.05) return;
      const hp = view ? RULES.health(view, key) : 100;
      const wear = Math.min(1, Math.max(1 - hp / 100, (1 - soil / 100) * 0.6));
      const keep = hp >= CONFIG.places.full ? 1 : hp >= CONFIG.places.low ? 0.6 : 0.25;
      const crop = CROP[Math.floor(hash3(c.id, 7, 7, 3) * 3) % 3];
      cropCol.copy(crop.ok).lerp(crop.worn, wear * 0.85);
      const theta = c.f.phi + Math.PI * 2 / 3 + (Math.floor(hash3(c.id, 2, 9, 5) * 3) % 3) * Math.PI / 3;   // rows run parallel to a hexagon edge
      const ct = Math.cos(theta), st = Math.sin(theta);
      const poly = c.corners.map((cj) => { const [x, z] = local2(c, cj, 0.94); return [x * ct + z * st, -x * st + z * ct]; });
      for (let row = -3; row <= 3; row++) {
        const w = row * 0.12; const span = rowSpan(poly, w); if (!span) continue;
        const lo = span[0] + 0.05, hi = span[1] - 0.05; if (hi - lo < 0.12) continue;
        const mid = (lo + hi) / 2;
        const at = (u) => tileNQ(c.f, u * ct - w * st, u * st + w * ct);
        putF(F.ridges, at(mid), h, -theta, (hi - lo) * k, k, k);
        let i = 0;
        for (let u = lo + 0.03; u <= hi - 0.03; u += crop.step, i++) {
          if (hash3(c.id, row + 9, i, 11) > keep) continue;
          const s = (0.85 + hash3(c.id, row, i, 13) * 0.35) * k;
          const idx = putF(F[crop.pool], at(u), h + 0.02, hash3(c.id, i, row, 4) * 6, s, s, s);
          if (idx >= 0) F[crop.pool].setColorAt(idx, cropCol);
        }
      }
      // hedges where the field meets land that is not another field
      if (!lite) c.corners.forEach((cj, j) => {
        const cj1 = c.corners[(j + 1) % c.corners.length];
        const midDir = cj.clone().add(cj1).normalize();
        let best = null, bd = -2; c.nb.forEach((id) => { const d = cells[id].n.dot(midDir); if (d > bd) { bd = d; best = cells[id]; } });
        if (!best || farmIds.has(best.id)) return;
        const bt = best.key ? (RULES.TILE[best.key].type === 'river' || (RULES.TILE[best.key].extra && rise < 0.5) ? 'water' : 'land') : (TERRAIN[effType(best)].water ? 'water' : 'land');
        if (bt === 'water' || hash3(c.id, j, 3, 17) > 0.75) return;
        const [ax, az] = local2(c, cj, 0.9), [bx, bz] = local2(c, cj1, 0.9);
        putF(F.hedges, tileNQ(c.f, (ax + bx) / 2, (az + bz) / 2), h, -Math.atan2(bz - az, bx - ax), Math.hypot(bx - ax, bz - az) * 0.92 * k, k, k);
      });
      if (!lite && hash3(c.id, 5, 5, 5) > 0.6) { const [hx, hz] = local2(c, c.corners[2], 0.62); putF(F.hay, tileNQ(c.f, hx, hz), h, c.id, k, k, k); }
    });
    Object.values(F).forEach((m) => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  }
  // stepped hexagonal quarry pits: benches follow the hexagon, rock layers show in the walls
  const pitMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, flatShading: true, side: THREE.DoubleSide });
  const pitMesh = new THREE.Mesh(new THREE.BufferGeometry(), pitMat); pitMesh.receiveShadow = true; pitMesh.castShadow = true; planet.add(pitMesh);
  const STRATA = [0x8f8a80, 0x9e8f74, 0x7f7a71, 0x948670, 0x878278, 0x8f826c].map((x) => new THREE.Color(x));
  const PIT_R = [1, 0.86, 0.72, 0.59, 0.47, 0.36], PIT_STEP = 0.1;
  const pv = new V3();
  function writePits() {
    ['rubble', 'boulders', 'carts'].forEach((k) => { F[k].count = 0; });
    const pos = [], col = [];
    const depth = view ? Math.min(3, Math.floor(view.minedTotal / CONFIG.quarryStep)) : 0;
    const K = 3 + Math.min(2, depth), yK = -K * PIT_STEP;
    const P = (c, dir, r, y) => pv.copy(c.n).lerp(dir, r).normalize().multiplyScalar(R + y).toArray();
    const tri = (a, b, d, cl) => { pos.push(...a, ...b, ...d); for (let i = 0; i < 3; i++) col.push(cl.r, cl.g, cl.b); };
    const quad = (a, b, d, e, cl) => { tri(a, b, d, cl); tri(a, d, e, cl); };
    const wallCol = new THREE.Color(), floorCol = new THREE.Color();
    quarryPlaces().forEach(({ c, key }) => {
      const hp = view ? RULES.health(view, key) : 100;
      const n = c.corners.length;
      for (let k = 0; k < K; k++) {
        const y = -k * PIT_STEP, r0 = PIT_R[k], r1 = PIT_R[k + 1], bench = STRATA[k % STRATA.length];
        wallCol.copy(STRATA[(k + 3) % STRATA.length]).multiplyScalar(0.62);
        for (let j = 0; j < n; j++) {
          const a = c.corners[j], b = c.corners[(j + 1) % n];
          quad(P(c, a, r1, y), P(c, a, r0, y), P(c, b, r0, y), P(c, b, r1, y), bench);
          quad(P(c, a, r1, y), P(c, b, r1, y), P(c, b, r1, y - PIT_STEP), P(c, a, r1, y - PIT_STEP), wallCol);
        }
      }
      floorCol.set(hp < CONFIG.places.low ? 0x5a8fb0 : 0x7d7a73);         // rainwater pools in an exhausted quarry
      const centre = pv.copy(c.n).multiplyScalar(R + yK).toArray();
      for (let j = 0; j < n; j++) tri(centre, P(c, c.corners[j], PIT_R[K], yK), P(c, c.corners[(j + 1) % n], PIT_R[K], yK), floorCol);
      // ramp road from the rim down to the floor
      const ca = c.corners[0].clone().multiplyScalar(0.58).add(c.corners[1].clone().multiplyScalar(0.42)).normalize();
      const cb = c.corners[0].clone().multiplyScalar(0.42).add(c.corners[1].clone().multiplyScalar(0.58)).normalize();
      quad(P(c, ca, PIT_R[K] * 0.92, yK + 0.012), P(c, cb, PIT_R[K] * 0.92, yK + 0.012), P(c, cb, 0.97, 0.012), P(c, ca, 0.97, 0.012), new THREE.Color(0xcdb88e));
      // rubble on the rim, boulders and a cart on the floor
      const [rx, rz] = local2(c, c.corners[3], 0.9); putF(F.rubble, tileNQ(c.f, rx, rz), 0, c.id, 1, 1, 1);
      [[4, 0.55], [5, 0.4]].forEach(([j, r], q) => { const [bx, bz] = local2(c, c.corners[j % n], PIT_R[K] * r); putF(F.boulders, tileNQ(c.f, bx, bz), yK, q * 2, 1 + q * 0.4, 1, 1 + q * 0.4); });
      const mid01 = c.corners[0].clone().add(c.corners[1]).normalize(); const [kx2, kz2] = local2(c, mid01, PIT_R[K] * 0.45);
      putF(F.carts, tileNQ(c.f, kx2, kz2), yK, c.f.phi, 1, 1, 1);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    pitMesh.geometry.dispose(); pitMesh.geometry = g;
    ['rubble', 'boulders', 'carts'].forEach((k) => { F[k].instanceMatrix.needsUpdate = true; });
  }

  // ---- particles ----
  function softTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const soft = softTexture();
  const DUST_N = 48, HAZE_N = 64;
  const dustGeo = new THREE.BufferGeometry(); const dustPos = new Float32Array(DUST_N * 3); const dustSeed = [];
  for (let i = 0; i < DUST_N; i++) {
    const [qx, qz] = flat(quarryTiles[i % quarryTiles.length].key);
    dustSeed.push({ n: surfN(qx + (Math.random() - 0.5) * 0.8, qz + (Math.random() - 0.5) * 0.8), y: Math.random(), s: 0.2 + Math.random() * 0.3 });
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ size: 0.13, map: soft, color: 0xb9b3a6, transparent: true, opacity: 0, depthWrite: false });
  planet.add(new THREE.Points(dustGeo, dustMat));
  const hazeGeo = new THREE.BufferGeometry(); const hazePos = new Float32Array(HAZE_N * 3); const hazeSeed = [];
  for (let i = 0; i < HAZE_N; i++) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * 5; hazeSeed.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, y: 0.8 + Math.random() * 1.6, p: Math.random() * 6.28 }); }
  hazeGeo.setAttribute('position', new THREE.BufferAttribute(hazePos, 3));
  const hazeMat = new THREE.PointsMaterial({ size: 1.0, map: soft, color: 0x868b92, transparent: true, opacity: 0, depthWrite: false });
  planet.add(new THREE.Points(hazeGeo, hazeMat));
  const hv = new THREE.Vector3();

  // ---- clouds orbiting the planet ----
  const cloudMat = M(0xffffff, { roughness: 1, transparent: true, opacity: 0.92 });
  const clouds = [];
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group();
    [[0, 0, 0, 0.5], [0.45, -0.05, 0.1, 0.38], [-0.45, -0.08, -0.05, 0.34], [0.1, 0.18, 0, 0.32]].forEach(([x, y, z, r]) => {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), cloudMat); m.position.set(x, y, z); g.add(m);
    });
    const axis = new THREE.Vector3(Math.random() - 0.5, 1.6, Math.random() - 0.5).normalize();
    const base = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(1, 0, 0.3)).normalize().multiplyScalar(WORLD_R + 2.2 + (i % 2) * 0.6);
    g.userData = { axis, base, a: i * 1.25, sp: 0.03 + (i % 3) * 0.01 };
    scene.add(g); clouds.push(g);
  }

  // ---- project sites ----
  const wood = M(0xb07a45), stoneM = M(0xb9b4a8), cream = M(0xefe3c4), roofRed = M(0xc4473a), white = M(0xf6f1e6), slate = M(0x5f6f7d), tank = M(0x8fb3c2);
  const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; return m; };
  const cyl = (rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 10) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y + h / 2, z); m.castShadow = true; return m; };
  function stagePlot() {
    const g = new THREE.Group();
    [[-0.35, -0.35], [0.35, -0.35], [0.35, 0.35], [-0.35, 0.35]].forEach(([x, z]) => g.add(cyl(0.02, 0.02, 0.16, wood, x, 0, z, 5)));
    g.add(box(0.72, 0.012, 0.03, white, 0, 0.1, -0.35)); g.add(box(0.72, 0.012, 0.03, white, 0, 0.1, 0.35));
    g.add(box(0.03, 0.012, 0.72, white, -0.35, 0.1, 0)); g.add(box(0.03, 0.012, 0.72, white, 0.35, 0.1, 0));
    return g;
  }
  function stageFoundation() { const g = new THREE.Group(); g.add(box(0.76, 0.08, 0.76, stoneM)); return g; }
  function stageScaffold() {
    const g = stageFoundation();
    [[-0.33, -0.33], [0.33, -0.33], [0.33, 0.33], [-0.33, 0.33]].forEach(([x, z]) => g.add(box(0.04, 0.42, 0.04, wood, x, 0.08, z)));
    g.add(box(0.7, 0.04, 0.04, wood, 0, 0.48, -0.33)); g.add(box(0.7, 0.04, 0.04, wood, 0, 0.48, 0.33));
    g.add(box(0.04, 0.04, 0.7, wood, -0.33, 0.48, 0)); g.add(box(0.04, 0.04, 0.7, wood, 0.33, 0.48, 0));
    g.add(box(0.66, 0.16, 0.66, cream, 0, 0.08, 0));
    return g;
  }
  function gable(w, d, h, mat, y) {
    const geo = new THREE.CylinderGeometry(h, h, d, 3); geo.rotateX(Math.PI / 2); geo.rotateZ(Math.PI / 2);
    const m = new THREE.Mesh(geo, mat); m.position.y = y + h * 0.5; m.scale.x = w / (h * 1.73); m.castShadow = true; return m;
  }
  function finished(k) {
    const g = new THREE.Group();
    if (k === 'market') {
      g.add(box(0.7, 0.22, 0.5, cream));
      for (let i = 0; i < 4; i++) { const s = box(0.18, 0.03, 0.62, i % 2 ? white : roofRed, -0.27 + i * 0.18, 0.3, 0); s.rotation.x = 0.12; g.add(s); }
      g.add(box(0.12, 0.12, 0.12, wood, 0.42, 0, 0.2)); g.add(box(0.1, 0.1, 0.1, wood, 0.42, 0, -0.05));
    } else if (k === 'school') {
      g.add(box(0.74, 0.34, 0.46, cream)); g.add(gable(0.8, 0.52, 0.2, roofRed, 0.34));
      g.add(box(0.14, 0.18, 0.02, wood, 0, 0, 0.235)); g.add(cyl(0.012, 0.012, 0.5, slate, 0.42, 0, 0.18, 5));
      g.add(box(0.16, 0.1, 0.01, M(0x2f7d6d), 0.5, 0.38, 0.18));
    } else if (k === 'bridge') {           // centred on the river tile it crosses
      g.add(box(2.3, 0.08, 0.42, stoneM, 0, 0.1, 0));
      g.add(box(2.3, 0.08, 0.04, stoneM, 0, 0.18, -0.19)); g.add(box(2.3, 0.08, 0.04, stoneM, 0, 0.18, 0.19));
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.06, 6, 14, Math.PI), stoneM); arch.position.set(0, -0.1, 0); arch.castShadow = true; g.add(arch);
      g.add(box(0.2, 0.25, 0.42, stoneM, -0.55, -0.15, 0)); g.add(box(0.2, 0.25, 0.42, stoneM, 0.55, -0.15, 0));
    } else {
      g.add(cyl(0.18, 0.18, 0.3, tank, -0.18, 0, -0.12, 14)); g.add(cyl(0.15, 0.15, 0.26, tank, 0.2, 0, -0.14, 14));
      g.add(box(0.4, 0.2, 0.26, cream, 0, 0, 0.2)); g.add(box(0.5, 0.04, 0.04, slate, 0, 0.14, -0.13));
    }
    return g;
  }
  const sites = {};
  allTiles.filter((t) => t.type === 'site').forEach((t) => {
    const g = new THREE.Group(); placeObj(g, FR[t.key], 0, 0.85, 0.85, 0.85);
    const stages = [stagePlot(), stageFoundation(), stageScaffold(), finished(t.project)];
    stages.slice(0, 3).forEach((s) => g.add(s));
    if (t.project === 'bridge') {
      const bg = new THREE.Group(); placeObj(bg, FR['7,4'], -0.06, 0.9, 0.85, 0.85); bg.add(stages[3]); planet.add(bg);
    } else g.add(stages[3]);
    planet.add(g);
    sites[t.project] = { key: t.key, stages };
  });

  // ---- town houses ----
  const townKeys = RULES.TILES.filter((t) => t.type === 'town').map((t) => FLAT[t.key]);
  const TOWN = [townKeys.reduce((s, p) => s + p[0], 0) / townKeys.length, townKeys.reduce((s, p) => s + p[1], 0) / townKeys.length];

  function tileKeyAtFlat(x, z) {
    let best = null;
    let bestD = 1e9;
    const consider = (key) => {
      const fl = flat(key);
      if (!fl) return;
      const d = Math.hypot(x - fl[0], z - fl[1]);
      if (d < bestD) {
        bestD = d;
        best = key;
      }
    };
    for (const key in FLAT) consider(key);
    cells.forEach((c) => {
      if (!c.key) consider('cell:' + c.id);
    });
    return best;
  }
  function randomFlatInHex(key) {
    if (!key) return [TOWN[0] + rnd(), TOWN[1] + rnd()];
    const f = frameOfKey(key);
    if (!f) return [TOWN[0] + rnd(), TOWN[1] + rnd()];
    const ox = (Math.random() - 0.5) * 0.62;
    const oz = (Math.random() - 0.5) * 0.62;
    const n = f.n.clone().multiplyScalar(R).addScaledVector(f.x, ox * f.sx).addScaledVector(f.z, oz * f.sz).normalize();
    const pp = n.clone().multiplyScalar(R / n.dot(UP));
    return [pp.dot(EX), pp.dot(EZ)];
  }
  const houseBody = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.16, 0.2).translate(0, 0.08, 0), M(0xffffff), 25);
  const roofGeo = new THREE.ConeGeometry(0.17, 0.13, 4); roofGeo.rotateY(Math.PI / 4); roofGeo.translate(0, 0.225, 0);
  const houseRoof = new THREE.InstancedMesh(roofGeo, M(0xffffff), 25);
  houseBody.castShadow = houseRoof.castShadow = true;
  planet.add(houseBody, houseRoof);
  const HOUSE_SPOTS = [];
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) HOUSE_SPOTS.push([(-0.76 + i * 0.38) * 0.72, (-0.76 + j * 0.38) * 0.72]);
  HOUSE_SPOTS.sort((a, b) => Math.hypot(b[0], b[1]) - Math.hypot(a[0], a[1]));
  const HOUSE_F = HOUSE_SPOTS.map(([x, z]) => nq(TOWN[0] + x, TOWN[1] + z));
  const HOUSE_COLS = [0xf3e6c8, 0xe9d3b0, 0xf6efe0, 0xdcc7a0], ROOF_COLS = [0xc4473a, 0x9a6b3f, 0x2f7d6d, 0xd0662f];
  function writeHouses(count) {
    for (let i = 0; i < 25; i++) {
      const s = i < count ? 1 : 1e-4; const m = compose(HOUSE_F[i], 0, (i % 4) * 0.2, 0, s, s, s);
      houseBody.setMatrixAt(i, m); houseRoof.setMatrixAt(i, m);
      houseBody.setColorAt(i, tmpCol.set(HOUSE_COLS[i % 4])); houseRoof.setColorAt(i, tmpCol.set(ROOF_COLS[(i * 3) % 4]));
    }
    [houseBody, houseRoof].forEach((m) => { m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; });
  }

  // ---- citizen figures (positions kept in flat grid coordinates) ----
  const FIG_N = 10; const SKIN = [0xf0c8a0, 0xc98e5e, 0x8d5a3b, 0x5c3a26];
  const bodyGeo = new THREE.CapsuleGeometry(0.045, 0.09, 3, 8); bodyGeo.translate(0, 0.09, 0);
  const headGeo = new THREE.SphereGeometry(0.045, 10, 8); headGeo.translate(0, 0.21, 0);
  const ringGeo = new THREE.RingGeometry(0.07, 0.1, 20); ringGeo.rotateX(-Math.PI / 2);
  const rnd = () => (Math.random() - 0.5) * 1.2;
  const hexColor = (hex) => {
    if (typeof hex !== 'string') return new THREE.Color(0xffffff);
    const h = hex.startsWith('#') ? hex : `#${hex}`;
    return new THREE.Color(h);
  };
  const applyFigureLook = (f, citizen, profHex) => {
    const av = citizen && citizen.avatar;
    const clothes = av && av.clothes != null ? av.clothes : profHex;
    f.body.material.color.copy(hexColor(clothes));
    f.head.material.color.copy(hexColor((av && av.skin) || '#f0c8a0'));
    f.ring.material.color.copy(hexColor((av && av.ring) || '#ffd166'));
    const posSig = av && av.pos ? `${av.pos.fx},${av.pos.fz}` : '';
    if (f.posSig !== posSig) {
      f.posSig = posSig;
      if (av && av.pos) {
        f.fx = av.pos.fx;
        f.fz = av.pos.fz;
        f.hexKey = tileKeyAtFlat(f.fx, f.fz);
        f.placed = true;
        f.walk = null;
        const [tx, tz] = randomFlatInHex(f.hexKey);
        f.tx = tx;
        f.tz = tz;
      } else {
        f.placed = false;
        f.hexKey = null;
      }
    }
  };
  const figures = [];
  for (let i = 0; i < FIG_N; i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(bodyGeo, M(0xffffff));
    const head = new THREE.Mesh(headGeo, M(SKIN[i % 4]));
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffd166, side: THREE.DoubleSide, depthWrite: false }));
    ring.position.set(0, 0.012, 0);
    ring.renderOrder = 2;
    body.castShadow = head.castShadow = true;
    g.add(body, head, ring);
    g.visible = false;
    planet.add(g);
    figures.push({
      g,
      body,
      head,
      ring,
      cid: null,
      fx: TOWN[0] + rnd(),
      fz: TOWN[1] + rnd(),
      fy: 0,
      yaw: 0,
      tx: TOWN[0] + rnd(),
      tz: TOWN[1] + rnd(),
      walk: null,
      placed: false,
      hexKey: null,
      posSig: '',
    });
  }

  // ---- selection, cursor, highlights ----
  const HEXR = 0.58;
  const selBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(HEXR, HEXR, 0.34, 6)), new THREE.LineBasicMaterial({ color: 0xffc94a }));
  selBox.visible = false; planet.add(selBox);
  const glowGeo = new THREE.CircleGeometry(HEXR * 0.96, 6); glowGeo.rotateX(-Math.PI / 2);
  const selGlow = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
  selGlow.visible = false; planet.add(selGlow);
  const cursor = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(HEXR, HEXR, 0.06, 6)), new THREE.LineDashedMaterial({ color: 0x2f7d6d, dashSize: 0.12, gapSize: 0.08 }));
  cursor.computeLineDistances(); cursor.visible = false; planet.add(cursor);
  const hiMesh = new THREE.InstancedMesh(glowGeo, new THREE.MeshBasicMaterial({ color: 0x6cc4ad, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }), allTiles.length);
  hiMesh.count = 0; planet.add(hiMesh);
  let selectedKey = null, previewKeys = [];

  // ---- confetti ----
  const confetti = []; const confGeo = new THREE.PlaneGeometry(0.05, 0.03);
  function celebrate(k) {
    if (reduced() || lite) return;
    const p = planet.localToWorld(localPoint(sites[k] ? sites[k].key : k, 0.6, new THREE.Vector3())); const n = p.clone().normalize();
    const cols = [0xffd166, 0x2f7d6d, 0xc4473a, 0x3a8fc7, 0xffffff];
    for (let i = 0; i < 50; i++) {
      const m = new THREE.Mesh(confGeo, new THREE.MeshBasicMaterial({ color: cols[i % 5], side: THREE.DoubleSide }));
      m.position.copy(p); scene.add(m);
      const v = n.clone().multiplyScalar(2 + Math.random() * 1.5).add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(2));
      confetti.push({ m, v, n, life: 2.2 });
    }
  }

  // ---- labels layer (positions are planet-local; hidden on the far side) ----
  const labels = [];
  function addLabel(el, getPos, isVisible = () => true) { labelsEl.appendChild(el); const L = { el, getPos, isVisible }; labels.push(L); return L; }
  function removeLabel(L) { L.el.remove(); const i = labels.indexOf(L); if (i >= 0) labels.splice(i, 1); }
  const v3 = new THREE.Vector3(), wp = new THREE.Vector3(), toCam = new THREE.Vector3();
  let showLabels = false;
  const PIN_TILES = [{ key: '1,0', icon: 'i-tree', name: 'Forest' }, { key: '0,5', icon: 'i-wheat', name: 'Farms' }, { key: '1,7', icon: 'i-stone', name: 'Quarry' }, { key: '4,2', icon: 'i-river', name: 'River' }];
  Object.entries(sites).forEach(([k, s]) => PIN_TILES.push({ key: s.key, icon: CONFIG.projects[k].icon, name: CONFIG.projects[k].name, project: k }));
  const pins = PIN_TILES.map((pt) => {
    const b = document.createElement('button'); b.className = 'pin'; b.type = 'button';
    b.setAttribute('aria-label', `Select ${pt.name}`);
    b.innerHTML = `<span class="pin-dot"><svg class="ic sm" aria-hidden="true"><use href="#${pt.icon}"/></svg></span>`;
    b.addEventListener('click', (e) => { e.stopPropagation(); cb.onSelect(pt.key); });
    const L = addLabel(b, () => localPoint(pt.key, 0.95, v3));
    L.pin = true; L.pt = pt; return L;
  });
  PIN_TILES.forEach((pt) => {
    const el = document.createElement('div'); el.className = 'lbl3d tile-name'; el.textContent = pt.name;
    addLabel(el, () => localPoint(pt.key, 1.45, v3), () => showLabels);
  });
  const multLabels = farmTiles.map((t, i) => {
    const el = document.createElement('div'); el.className = 'lbl3d mult';
    return addLabel(el, () => localPoint(t.key, 0.35 + yOff(t), v3), () => (i === 0 || showLabels) && (!t.extra || rise > 0.5));
  });
  const selLabel = (() => { const el = document.createElement('div'); el.className = 'lbl3d sel'; return addLabel(el, () => localPoint(selectedKey, 0.62, v3), () => !!selectedKey); })();
  const floats = [];
  function floatLabel(key, text, delay = 0) {
    if (!key) return;
    const el = document.createElement('div'); el.className = 'lbl3d float'; el.textContent = text; el.setAttribute('aria-hidden', 'true');
    floats.push({ L: addLabel(el, () => localPoint(key, 0.7, v3)), t: -delay });
  }

  // ---- camera: fixed view direction; the planet itself turns ----
  const ZMAX = 4.5;                                           // smaller cells, so the camera can come closer
  const PHI = THREE.MathUtils.degToRad(30);
  const VIEW = new THREE.Vector3(0, Math.sin(PHI), Math.cos(PHI));      // from the look point towards the camera
  const CAM_UP = new THREE.Vector3(0, Math.cos(PHI), -Math.sin(PHI));
  const CAM_RIGHT = new THREE.Vector3(1, 0, 0);
  const HOME_DIR = new THREE.Vector3(0, Math.sin(PHI + 0.42), Math.cos(PHI + 0.42));   // island pole tilted towards the camera
  const HOME = { q: new THREE.Quaternion().setFromUnitVectors(UP, HOME_DIR).multiply(new THREE.Quaternion().setFromAxisAngle(UP, -0.62)),
    target: HOME_DIR.clone().multiplyScalar(WORLD_R * 0.8), zoom: 1.9 };
  const cam = { zoom: HOME.zoom, zoomGoal: HOME.zoom, wUp: 0, wRight: 0, rotQueue: 0, tour: 0, qGoal: null,
    target: HOME.target.clone(), targetGoal: HOME.target.clone(), fit: 28, fitGoal: 28 };
  planet.quaternion.copy(HOME.q);
  let W = 1, H = 1, lastInteract = performance.now(), idle = false;
  const touch = () => { lastInteract = performance.now(); cb.onInteract && cb.onInteract(); };
  const spinWorld = (axis, ang) => { qTmp.setFromAxisAngle(axis, ang); planet.quaternion.premultiply(qTmp); };
  const spinLocal = (ang) => { qTmp.setFromAxisAngle(UP, ang); planet.quaternion.multiply(qTmp); if (cam.qGoal) cam.qGoal.multiply(qTmp); };

  function resize() {
    const r = host.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const shift = Math.min(44, H * 0.06) * 2;            // keep the planet above the turn pill and caption
    camera.setViewOffset(W, H + shift, 0, shift, W, H);
    camera.updateProjectionMatrix();
    const halfV = THREE.MathUtils.degToRad(15), halfH = Math.atan(Math.tan(halfV) * camera.aspect);
    cam.fitGoal = 7.6 / Math.sin(Math.min(halfV, halfH));
  }
  const ro = new ResizeObserver(resize); ro.observe(host);

  // ---- pointer input ----
  const el = renderer.domElement; const pointers = new Map();
  let drag = null, pinchD = 0, placingMode = false;
  const raycaster = new THREE.Raycaster(); const ndc = new THREE.Vector2();
  function figureFromHit(obj) {
    let o = obj;
    while (o) {
      const f = figures.find((fig) => fig.g === o);
      if (f) return f;
      o = o.parent;
    }
    return null;
  }
  function pickFigure(e) {
    const r = el.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const roots = figures.filter((f) => f.g.visible).map((f) => f.g);
    const hit = raycaster.intersectObjects(roots, true)[0];
    if (!hit) return null;
    const f = figureFromHit(hit.object);
    return f && f.cid ? f.cid : null;
  }
  function pick(e) {
    const r = el.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects([islandLand.mesh, islandRiver.mesh, farLand.mesh, farWater.mesh], false)[0];
    if (!hit || hit.faceIndex == null) return null;
    const src = hit.object === islandLand.mesh ? islandLand : hit.object === islandRiver.mesh ? islandRiver : hit.object === farLand.mesh ? farLand : farWater;
    const cell = src.list[src.triCell[hit.faceIndex]];
    if (cell.key && !(RULES.TILE[cell.key].extra && rise < 0.5)) return cell.key;
    return 'cell:' + cell.id;
  }
  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', endPointer);
  el.addEventListener('pointercancel', endPointer);
  el.addEventListener('dblclick', onDblClick);
  el.addEventListener('wheel', onWheel, { passive: false });

  function onPointerDown(e) {
    el.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    touch(); cam.wUp = cam.wRight = 0; cam.tour = 0; cam.qGoal = null;
    if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinchD = Math.hypot(a.x - b.x, a.y - b.y); if (drag) drag.moved = 99; }
  }
  function onPointerMove(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchD > 0) { cam.zoomGoal = THREE.MathUtils.clamp(cam.zoomGoal * (d / pinchD), 0.7, ZMAX); cam.zoom = cam.zoomGoal; }
      pinchD = d; touch(); return;
    }
    if (!drag) return;
    const now = performance.now(); const dt = Math.max(1, now - drag.t) / 1000;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    const k = 0.005 / Math.sqrt(cam.zoom);
    spinWorld(CAM_UP, dx * k); spinWorld(CAM_RIGHT, dy * k);
    cam.wUp = cam.wUp * 0.5 + (dx * k / dt) * 0.5; cam.wRight = cam.wRight * 0.5 + (dy * k / dt) * 0.5;
    drag.x = e.clientX; drag.y = e.clientY; drag.t = now; touch();
  }
  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchD = 0;
    if (drag && pointers.size === 0) {
      if (performance.now() - drag.t > 90 || reduced()) { cam.wUp = 0; cam.wRight = 0; }
      if (drag.moved < 6) {
        if (placingMode && view && view.activeId) {
          const k = pick(e);
          if (k) {
            const fl = flat(k);
            if (fl) {
              const [x, z] = fl;
              cb.onPlaceFigure && cb.onPlaceFigure(view.activeId, k, x + 0.15, z + 0.15);
            }
            drag = null;
            return;
          }
          drag = null;
          return;
        }
        const fc = pickFigure(e);
        if (fc && view && fc === view.activeId) {
          cb.onFigureClick && cb.onFigureClick(fc);
          drag = null;
          return;
        }
        const k = pick(e);
        if (k) cb.onSelect && cb.onSelect(k);
      }
      drag = null;
    }
  }
  function onDblClick(e) { const k = pick(e); if (k) flyTo(k); else home(); touch(); }
  function onWheel(e) {
    e.preventDefault();
    cam.zoomGoal = THREE.MathUtils.clamp(cam.zoomGoal * Math.exp(-e.deltaY * 0.0016), 0.7, ZMAX);
    touch();
  }

  function zoomBy(f) { cam.zoomGoal = THREE.MathUtils.clamp(cam.zoomGoal * f, 0.7, ZMAX); touch(); }
  function rotate(dir) { cam.rotQueue += dir * Math.PI / 2; touch(); }
  function tour() { if (reduced()) return false; cam.tour = Math.PI * 2; cam.qGoal = null; touch(); return true; }
  function home() {
    cam.rotQueue = 0; cam.tour = 0; cam.wUp = cam.wRight = 0;
    cam.qGoal = HOME.q.clone(); cam.zoomGoal = HOME.zoom; cam.targetGoal.copy(HOME.target); touch();
  }
  function flyTo(key) { flyToNormal(frameOfKey(key).n); }
  function showFar(s) {
    const L = TERRAIN[s.type];
    const p = s.n.clone().multiplyScalar(R + L.h + 0.5);
    const el = document.createElement('div'); el.className = 'lbl3d tile-name'; el.textContent = s.water ? L.name : `${s.home ? 'Wild land' : 'Far away'}: ${L.name}`;
    floats.push({ L: addLabel(el, () => v3.copy(p)), t: -0.9 });
    if (cb.onFar) cb.onFar(L.name);
  }
  function flyToNormal(nLocal) {
    const nW = nLocal.clone().applyQuaternion(planet.quaternion);
    cam.qGoal = new THREE.Quaternion().setFromUnitVectors(nW, VIEW).multiply(planet.quaternion);
    cam.rotQueue = 0; cam.tour = 0; cam.wUp = cam.wRight = 0;
    cam.targetGoal.copy(VIEW).multiplyScalar(WORLD_R); cam.zoomGoal = 3; touch();
  }

  // ---- light / mood ----
  let lightMode = 'day', lightLevel = 1, lite = false, autoLiteAllowed = true;
  const LCOL = { day: new THREE.Color(0xfff4e2), dusk: new THREE.Color(0xffb784), night: new THREE.Color(0x7088bb) };
  const ATMO = { day: new THREE.Color(0x8fd3ff), dusk: new THREE.Color(0xff9e6b), night: new THREE.Color(0x4a63a8) };
  const LVL = { day: 1, dusk: 0.5, night: 0.16 };
  function setLight(mode) { lightMode = mode; }
  function setLite(on) {
    lite = !!on; renderer.shadowMap.enabled = !lite; keyLight.castShadow = !lite;
    renderer.setPixelRatio(lite ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)); resize();
    scene.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.needsUpdate = true; }); });
    dustGeo.setDrawRange(0, lite ? 14 : DUST_N); hazeGeo.setDrawRange(0, lite ? 22 : HAZE_N);
    starGeo.setDrawRange(0, lite ? 200 : STAR_N);
  }

  // ---- sync with state (read only) ----
  function sync(s) {
    view = s;
    riseTarget = s.projects.bridge.done ? 1 : 0;
    if (reduced() && rise !== riseTarget) { rise = riseTarget; writeIsland(); }
    trees.forEach((tr) => {
      const n = RULES.treesOn(s, tr.tile.key); const tgt = tr.j < n ? 1 : 0;
      if (tr.target === 1 && tgt === 0 && tr.cur > 0.5 && !reduced()) tr.fall = 0;
      if (reduced()) { tr.cur = tgt; tr.fall = -1; }
      tr.target = tgt;
    });
    cropTarget.lerpColors(cropPale, cropRich, s.env.soil / 100);
    riverColTarget.set(RULES.waterBand(s.env.water).colour);
    writeQuarry(s.minedTotal); writeFields(); writePits();
    for (const k in sites) {
      const st = RULES.projectProgress(s, k).stage;
      sites[k].stages.forEach((g, i) => { g.visible = i === st; });
    }
    writeHouses(Math.max(1, Math.ceil(s.citizens.length / 5)));
    const sig = JSON.stringify([s.land, s.works]);
    const dsig = JSON.stringify([s.harvest, s.tileHealth, s.env.forest]);
    if (sig !== landSig) { landSig = sig; decorSig = dsig; writeFar(); writeDecor(); writeIsland(); syncWorkPins(s); }
    else if (dsig !== decorSig) { decorSig = dsig; writeDecor(); }
    const band = RULES.waterBand(s.env.water); const y = RULES.farmYield(s);
    multLabels.forEach((L) => { L.el.textContent = `${band.words === 'a full harvest' ? 'Full harvest' : band.words[0].toUpperCase() + band.words.slice(1) + ' harvest'}: ${y} food`; });
    pins.forEach((L) => { L.el.classList.toggle('done', !!(L.pt.project && s.projects[L.pt.project].done)); L.el.classList.toggle('is-sel', L.pt.key === selectedKey); });
    const list = s.citizens.slice(0, FIG_N);
    if (!list.find((c) => c.id === s.activeId)) { const a = s.citizens.find((c) => c.id === s.activeId); if (a) list[list.length - 1] = a; }
    figures.forEach((f, i) => {
      const c = list[i];
      if (!c) { f.g.visible = false; f.cid = null; f.ring.visible = false; return; }
      const profHex = CONFIG.professions[c.prof].colour;
      if (f.cid !== c.id) {
        f.walk = null;
        f.posSig = '';
        if (!(c.avatar && c.avatar.pos)) {
          f.fx = TOWN[0] + rnd();
          f.fz = TOWN[1] + rnd();
          f.placed = false;
          f.hexKey = null;
          f.tx = TOWN[0] + rnd();
          f.tz = TOWN[1] + rnd();
        }
      }
      f.cid = c.id;
      f.g.visible = true;
      applyFigureLook(f, c, profHex);
    });
  }
  const figureFor = (cid) => figures.find((f) => f.cid === cid) || null;
  function playAction(cid, key) {
    if (typeof key === 'number') key = 'cell:' + key;
    const f = figureFor(cid); if (!f || !key || reduced()) return;
    const fl = flat(key); if (!fl) return;
    const [x, z] = fl;
    f.walk = { x0: f.fx, z0: f.fz, x1: x + 0.18, z1: z + 0.18, t: 0 };
  }
  function select(key) {
    selectedKey = key;
    if (key) { const f = frameOfKey(key); const tt = topOfKey(key); const s = f.rad / HEXR; placeObj(selBox, f, tt + 0.08, s, 1, s, Math.PI / 2 - f.phi); placeObj(selGlow, f, tt + 0.02, s, 1, s, -f.phi); }
    selBox.visible = selGlow.visible = !!key;
    if (view) sync(view);
  }
  function setSelLabel(text) { selLabel.el.textContent = text; }
  const workPins = {};
  function syncWorkPins(s) {
    ['reclaim', 'link'].forEach((kind) => {
      const W = s.works && s.works[kind];
      if (workPins[kind] && (!W || workPins[kind].cell !== W.cell)) { removeLabel(workPins[kind].L); delete workPins[kind]; }
      if (W && !workPins[kind]) {
        const b = document.createElement('button'); b.className = 'pin'; b.type = 'button';
        b.setAttribute('aria-label', `Select the ${CONFIG.works[kind].name.toLowerCase()} site`);
        b.innerHTML = `<span class="pin-dot"><svg class="ic sm" aria-hidden="true"><use href="#${CONFIG.works[kind].icon}"/></svg></span>`;
        const key = 'cell:' + W.cell;
        b.addEventListener('click', (e) => { e.stopPropagation(); cb.onSelect(key); });
        const L = addLabel(b, () => localPoint(key, 0.95, v3)); L.pin = true; L.pt = { key };
        workPins[kind] = { cell: W.cell, L };
      }
    });
  }
  function setCursor(key) {
    cursor.visible = !!key;
    if (!key) return;
    const f = frameOfKey(key);
    if (!f) {
      cursor.visible = false;
      return;
    }
    const tt = topOfKey(key);
    const s = f.rad / HEXR;
    placeObj(cursor, f, tt + 0.04, s, 1, s, Math.PI / 2 - f.phi);
  }
  function setPreview(keys) { previewKeys = keys || []; }
  function setLabels(on) { showLabels = !!on; }

  // ---- frame loop ----
  let running = true, last = performance.now(), fpsAcc = 0, fpsFrames = 0, slowSecs = 0, warm = 0;
  function update(dt, t) {
    idle = performance.now() - lastInteract > 2000;
    const k7 = reduced() ? 1 : 1 - Math.exp(-dt * 7);
    // planet rotation
    if (!drag && (cam.wUp || cam.wRight)) {
      spinWorld(CAM_UP, cam.wUp * dt); spinWorld(CAM_RIGHT, cam.wRight * dt);
      const decay = Math.exp(-dt * 4.5); cam.wUp *= decay; cam.wRight *= decay;
      if (Math.abs(cam.wUp) + Math.abs(cam.wRight) < 1e-4) cam.wUp = cam.wRight = 0;
    }
    if (cam.rotQueue) { const step = reduced() ? cam.rotQueue : cam.rotQueue * (1 - Math.exp(-dt * 4.2)); spinLocal(step); cam.rotQueue -= step; if (Math.abs(cam.rotQueue) < 0.0005) cam.rotQueue = 0; }
    if (cam.tour > 0) { const st = Math.min(cam.tour, dt * (Math.PI * 2 / 16)); spinLocal(st); cam.tour -= st; }
    if (cam.qGoal) { planet.quaternion.slerp(cam.qGoal, k7); if (planet.quaternion.angleTo(cam.qGoal) < 0.001) { planet.quaternion.copy(cam.qGoal); cam.qGoal = null; } }
    planet.updateMatrixWorld(true);
    // camera
    cam.zoom += (cam.zoomGoal - cam.zoom) * k7;
    cam.target.lerp(cam.targetGoal, k7);
    cam.fit += (cam.fitGoal - cam.fit) * k7;
    camera.position.copy(cam.target).addScaledVector(VIEW, cam.fit / cam.zoom);
    camera.lookAt(cam.target); camera.updateMatrixWorld();
    // light, sea, sky
    lightLevel += (LVL[lightMode] - lightLevel) * (reduced() ? 1 : 1 - Math.exp(-dt * 2.5));
    const lt = lightLevel, hi = lt > 0.5;
    const f = hi ? (lt - 0.5) / 0.5 : Math.max(0, (lt - 0.16) / 0.34);
    keyLight.color.lerpColors(hi ? LCOL.dusk : LCOL.night, hi ? LCOL.day : LCOL.dusk, f); keyLight.intensity = 0.35 + 1.25 * lt;
    scene.environmentIntensity = 0.9 * (0.3 + 0.7 * lt);
    atmoU.uColor.value.lerpColors(hi ? ATMO.dusk : ATMO.night, hi ? ATMO.day : ATMO.dusk, f);
    atmoU.uStrength.value = 0.75 + 0.25 * lt;
    starMat.opacity = Math.min(1, Math.max(0, (0.78 - lt) / 0.4));
    if (!reduced() && !lite) waterU.uTime.value += dt;
    // new land rising after the bridge
    if (Math.abs(rise - riseTarget) > 0.001) { rise += (riseTarget - rise) * (1 - Math.exp(-dt * 1.6)); if (Math.abs(rise - riseTarget) < 0.002) rise = riseTarget; writeIsland(); writeFields(); }
    if (Math.abs(riverColCur.r - riverColTarget.r) + Math.abs(riverColCur.g - riverColTarget.g) + Math.abs(riverColCur.b - riverColTarget.b) > 0.004) { riverColCur.lerp(riverColTarget, reduced() ? 1 : 1 - Math.exp(-dt * 2)); writeRiver(); writeHomeRivers(); if (rise < 1) writeIsland(); }
    riverMat.emissiveIntensity = idle && !reduced() ? 0.12 + Math.sin(t * 2.2) * 0.08 : 0.06;
    // trees
    const pol = view ? view.env.pollution : 0;
    crownCol.lerpColors(crownWeak, crownHealthy, (view ? view.env.forest : 80) / 100);
    trees.forEach((tr, i) => {
      let rotZ = 0, s = tr.cur;
      if (tr.fall >= 0) {
        tr.fall += dt / 0.9; rotZ = Math.min(1, tr.fall / 0.65) * (Math.PI / 2) * tr.dir;
        s = tr.fall > 0.65 ? Math.max(0, 1 - (tr.fall - 0.65) / 0.35) : 1;
        if (tr.fall >= 1) { tr.fall = -1; tr.cur = 0; s = 0; }
      } else {
        tr.cur += (tr.target - tr.cur) * (1 - Math.exp(-dt * (tr.target ? 1.6 : 6)));
        s = tr.cur;
        if (idle && !reduced()) rotZ = Math.sin(t * 1.4 + tr.phase) * 0.035;
      }
      const sc = Math.max(1e-4, s * tr.size);
      const m = compose(tr.f, yOff(tr.tile), tr.phase, rotZ, sc, sc, sc);
      trunks.setMatrixAt(i, m); crowns.setMatrixAt(i, m);
      crowns.setColorAt(i, tmpCol.copy(crownCol).offsetHSL((tr.hue - 0.5) * 0.04, 0, (tr.hue - 0.5) * 0.06));
    });
    trunks.instanceMatrix.needsUpdate = true; crowns.instanceMatrix.needsUpdate = true; crowns.instanceColor.needsUpdate = true;
    // particles
    const dustN = lite ? 14 : DUST_N;
    for (let i = 0; i < dustN; i++) { const d = dustSeed[i]; if (!reduced()) d.y += dt * d.s; if (d.y > 1.2) d.y = 0; hv.copy(d.n).multiplyScalar(R + 0.05 + d.y); dustPos.set([hv.x, hv.y, hv.z], i * 3); }
    dustGeo.attributes.position.needsUpdate = true;
    dustMat.opacity = Math.max(0, (pol - 10) / 90) * 0.75;
    const hazeN = lite ? 22 : HAZE_N;
    for (let i = 0; i < hazeN; i++) { const h = hazeSeed[i]; const w = reduced() ? 0 : Math.sin(t * 0.2 + h.p) * 0.4; surfN(h.x + w, h.z, hv).multiplyScalar(R + h.y); hazePos.set([hv.x, hv.y, hv.z], i * 3); }
    hazeGeo.attributes.position.needsUpdate = true;
    hazeMat.opacity = Math.max(0, (pol - 15) / 85) * 0.5;
    // clouds
    clouds.forEach((g) => { const u = g.userData; if (!reduced()) u.a += dt * u.sp; g.position.copy(u.base).applyAxisAngle(u.axis, u.a); g.lookAt(0, 0, 0); });
    // figures
    figures.forEach((fg) => {
      if (!fg.g.visible) return;
      fg.fy = 0;
      if (fg.walk) {
        const w = fg.walk; w.t += dt;
        if (w.t < 1.1) { const k = w.t / 1.1; fg.fx = w.x0 + (w.x1 - w.x0) * k; fg.fz = w.z0 + (w.z1 - w.z0) * k; fg.yaw = Math.atan2(w.x1 - w.x0, w.z1 - w.z0); }
        else if (w.t < 2.1) { fg.fx = w.x1; fg.fz = w.z1; fg.fy = Math.abs(Math.sin((w.t - 1.1) * 9)) * 0.06; }
        else if (w.t < 3.2) { const k = (w.t - 2.1) / 1.1; fg.fx = w.x1 + (w.x0 - w.x1) * k; fg.fz = w.z1 + (w.z0 - w.z1) * k; fg.yaw = Math.atan2(w.x0 - w.x1, w.z0 - w.z1); }
        else fg.walk = null;
      } else if (!reduced()) {
        const dx = fg.tx - fg.fx;
        const dz = fg.tz - fg.fz;
        const d = Math.hypot(dx, dz);
        if (d < 0.05) {
          if (fg.hexKey) {
            const t = randomFlatInHex(fg.hexKey);
            fg.tx = t[0];
            fg.tz = t[1];
          } else {
            fg.tx = TOWN[0] + rnd();
            fg.tz = TOWN[1] + rnd();
          }
        } else {
          const sp = (idle ? 0.22 : 0.12) * dt;
          fg.fx += (dx / d) * sp;
          fg.fz += (dz / d) * sp;
          fg.yaw = Math.atan2(dx, dz);
        }
      }
      const fr = nq(fg.fx, fg.fz);
      fg.g.position.copy(fr.n).multiplyScalar(R + fg.fy);
      fg.g.quaternion.copy(fr.q).multiply(qLoc.setFromAxisAngle(UP, fg.yaw));
      if (fg.ring) {
        fg.ring.visible = fg.g.visible;
      }
    });
    if (placingMode) setCursor(selectedKey);
    // highlights
    const keys = previewKeys.filter((k) => isCellKey(k) || (RULES.TILE[k] && (!RULES.TILE[k].extra || rise > 0.5)));
    hiMesh.count = keys.length;
    keys.forEach((k, i) => { const fr = frameOfKey(k); const s = fr.rad / HEXR; hiMesh.setMatrixAt(i, compose(fr, topOfKey(k) + 0.03, -fr.phi, 0, s, 1, s)); });
    hiMesh.instanceMatrix.needsUpdate = true;
    hiMesh.material.opacity = reduced() ? 0.4 : 0.3 + Math.sin(t * 5) * 0.15;
    selGlow.material.opacity = reduced() ? 0.35 : 0.28 + Math.sin(t * 3) * 0.1;
    // confetti (falls back towards the planet)
    for (let i = confetti.length - 1; i >= 0; i--) {
      const c = confetti[i]; c.life -= dt; c.v.addScaledVector(c.n, -4 * dt); c.m.position.addScaledVector(c.v, dt); c.m.rotation.x += dt * 6; c.m.rotation.y += dt * 4;
      if (c.life <= 0) { scene.remove(c.m); c.m.material.dispose(); confetti.splice(i, 1); }
    }
    // labels: hide anything on the far side of the planet
    for (const L of labels) {
      if (!L.isVisible()) { L.el.style.display = 'none'; continue; }
      wp.copy(L.getPos()); planet.localToWorld(wp);
      toCam.subVectors(camera.position, wp);
      if (wp.dot(toCam) < 0) { L.el.style.display = 'none'; continue; }
      v3.copy(wp).project(camera);
      if (v3.z > 1 || v3.x < -1.2 || v3.x > 1.2 || v3.y < -1.2 || v3.y > 1.2) { L.el.style.display = 'none'; continue; }
      L.el.style.display = '';
      const x = (v3.x * 0.5 + 0.5) * W, y = (-v3.y * 0.5 + 0.5) * H;
      L.el.style.transform = L.pin ? `translate(${x - 22}px,${y - 44}px)` : `translate(${x}px,${y}px) translate(-50%,-100%)`;
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const fl = floats[i]; fl.t += dt;
      if (fl.t < 0) { fl.L.el.style.opacity = 0; continue; }
      const k = fl.t / 1.6; fl.L.el.style.opacity = reduced() ? (k < 0.9 ? 1 : 0) : String(Math.max(0, 1 - k * k));
      if (!reduced()) fl.L.el.style.marginTop = `${-k * 46}px`;
      if (fl.t > 1.6) { removeLabel(fl.L); floats.splice(i, 1); }
    }
  }
  function frame(now) {
    if (!running) return;
    const raw = Math.max(0, (now - last) / 1000); const dt = Math.min(0.05, raw); last = now;
    update(dt, now / 1000);
    renderer.render(scene, camera);
    // automatic Lite mode if below 30 fps for 3 seconds (measured in real time)
    warm += raw; fpsAcc += raw; fpsFrames++;
    if (fpsAcc >= 1) {
      const fps = fpsFrames / fpsAcc; fpsAcc = 0; fpsFrames = 0;
      if (warm > 4 && !lite && autoLiteAllowed) { slowSecs = fps < 30 ? slowSecs + 1 : 0; if (slowSecs >= 3) { setLite(true); cb.onAutoLite && cb.onAutoLite(); } }
    }
    requestAnimationFrame(frame);
  }
  function onVisibilityChange() {
    if (document.hidden) running = false;
    else if (!running) { running = true; last = performance.now(); fpsAcc = 0; fpsFrames = 0; requestAnimationFrame(frame); }
  }
  document.addEventListener('visibilitychange', onVisibilityChange);
  resize(); writeFarms(0, false);
  requestAnimationFrame(frame);

  function dispose() {
    running = false;
    ro.disconnect();
    el.removeEventListener('pointerdown', onPointerDown);
    el.removeEventListener('pointermove', onPointerMove);
    el.removeEventListener('pointerup', endPointer);
    el.removeEventListener('pointercancel', endPointer);
    el.removeEventListener('dblclick', onDblClick);
    el.removeEventListener('wheel', onWheel);
    document.removeEventListener('visibilitychange', onVisibilityChange);
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
    disableAutoLite: () => { autoLiteAllowed = false; }, zoomBy, rotate, tour, home, flyTo, playAction, floatLabel, celebrate, touch,
    setPlacingMode: (on) => { placingMode = !!on; if (placingMode) cursor.visible = true; touch(); },
    isPlacingMode: () => placingMode,
    dispose };
}
