import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import * as P from './plan.js?v=8';
import { CATALOG, CATEGORIES, CEIL_H, buildFurniture, mat } from './furniture.js?v=8';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const deg = THREE.MathUtils.degToRad;
const STORE_KEY = 'fp3d.layout.v1';

// ── 基本場景 ─────────────────────────────────────────────
const viewport = $('#viewport');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
viewport.appendChild(renderer.domElement);
const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.className = 'labels';
viewport.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#ece8e1');
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

// 範圍
const BX0 = P.cx(285), BX1 = P.cx(1205), BZ0 = P.cz(65), BZ1 = P.cz(917);
const CX = (BX0 + BX1) / 2, CZ = (BZ0 + BZ1) / 2;

scene.add(new THREE.HemisphereLight('#fffaf0', '#b9b0a3', 0.55));
const sun = new THREE.DirectionalLight('#fff4e2', 1.6);
sun.position.set(CX - 500, 1400, CZ + 700);
sun.target.position.set(CX, 0, CZ);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -750, right: 750, top: 750, bottom: -750, near: 100, far: 3500 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.6;
scene.add(sun, sun.target);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000), new THREE.ShadowMaterial({ opacity: 0.12 }));
ground.rotation.x = -Math.PI / 2; ground.position.set(CX, -3, CZ); ground.receiveShadow = true;
scene.add(ground);

// ── 相機與控制 ───────────────────────────────────────────
const persp = new THREE.PerspectiveCamera(40, 1, 5, 20000);
const homePos = () => { const k = Math.max(1, 1.05 / (persp.aspect || 1.6)); return new THREE.Vector3(CX + 60 * k, 1650 * k, CZ + 820 * k); };
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 10000);
ortho.position.set(CX, 3000, CZ); ortho.up.set(0, 0, -1); ortho.lookAt(CX, 0, CZ);

const ctrlP = new OrbitControls(persp, renderer.domElement);
ctrlP.target.set(CX, 0, CZ);
ctrlP.enableDamping = true; ctrlP.dampingFactor = 0.08;
ctrlP.maxPolarAngle = deg(86); ctrlP.minDistance = 80; ctrlP.maxDistance = 5000;
ctrlP.screenSpacePanning = false;

const ctrlO = new OrbitControls(ortho, renderer.domElement);
ctrlO.target.set(CX, 0, CZ);
ctrlO.enableRotate = false; ctrlO.screenSpacePanning = true;
ctrlO.enableDamping = true; ctrlO.dampingFactor = 0.1;
ctrlO.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
ctrlO.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
ctrlO.minZoom = 0.3; ctrlO.maxZoom = 8;
ctrlO.enabled = false;

let mode = '3d';
let cam = persp, ctrl = ctrlP;

function resize() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  renderer.setSize(w, h); labelRenderer.setSize(w, h);
  persp.aspect = w / h; persp.updateProjectionMatrix();
  const half = 620, a = w / h;
  const hh = a > (BX1 - BX0) / (BZ1 - BZ0) ? half : half * ((BX1 - BX0) / (BZ1 - BZ0)) / a;
  Object.assign(ortho, { left: -hh * a, right: hh * a, top: hh, bottom: -hh });
  ortho.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewport);
resize();
persp.position.copy(homePos());

// ── 材質 ─────────────────────────────────────────────────
function canvasTex(size, draw, worldSize) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / worldSize, 1 / worldSize);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const woodTex = canvasTex(1024, (g, n) => {
  const r = rnd(7), rows = 12, rh = n / rows, pl = n / 2;
  for (let i = 0; i < rows; i++) {
    const off = r() * pl;
    for (let x = -pl; x < n + pl; x += pl) {
      const l = 33 + r() * 8, hue = 24 + r() * 6;
      g.fillStyle = `hsl(${hue},15%,${l}%)`;
      g.fillRect(x + off, i * rh, pl, rh);
      g.strokeStyle = `hsla(${hue},18%,${l - 10}%,0.3)`; g.lineWidth = 1;
      for (let k = 0; k < 7; k++) {
        const y = i * rh + 3 + r() * (rh - 6);
        g.beginPath(); g.moveTo(x + off, y);
        g.bezierCurveTo(x + off + pl * 0.3, y + r() * 4 - 2, x + off + pl * 0.6, y + r() * 4 - 2, x + off + pl, y);
        g.stroke();
      }
      g.fillStyle = 'rgba(60,40,25,0.35)'; g.fillRect(x + off, i * rh, 2, rh);
    }
    g.fillStyle = 'rgba(60,40,25,0.3)'; g.fillRect(0, i * rh, n, 2);
  }
}, 240);
const tileTex = (base, grout, tiles = 2) => canvasTex(512, (g, n) => {
  const r = rnd(11), s = n / tiles;
  g.fillStyle = grout; g.fillRect(0, 0, n, n);
  for (let i = 0; i < tiles; i++) for (let j = 0; j < tiles; j++) {
    const c = new THREE.Color(base); c.offsetHSL(0, 0, (r() - 0.5) * 0.03);
    g.fillStyle = '#' + c.getHexString(); g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
  }
}, 120);
const FLOORS = {
  wood: new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.55 }),
  tile: new THREE.MeshStandardMaterial({ map: tileTex('#8e8b86', '#76736e', 2), roughness: 0.5 }),
  tileLight: new THREE.MeshStandardMaterial({ map: tileTex('#cfcac1', '#b3aea5', 2), roughness: 0.7 }),
};
const WALL_SIDE = new THREE.MeshStandardMaterial({ color: '#f3f0ea', roughness: 0.92 });
const WALL_TOP = new THREE.MeshStandardMaterial({ color: '#56575a', roughness: 0.9 });
const WALL_MATS = [WALL_SIDE, WALL_SIDE, WALL_TOP, WALL_SIDE, WALL_SIDE, WALL_SIDE];

// ── 户型 ─────────────────────────────────────────────────
const rectCm = r => ({ x1: P.cx(r[0]), z1: P.cz(r[1]), x2: P.cx(r[2]), z2: P.cz(r[3]) });
const polyCm = poly => poly.map(([x, y]) => [P.cx(x), P.cz(y)]);
function polyArea(pts) { let a = 0; for (let i = 0; i < pts.length; i++) { const [x1, z1] = pts[i], [x2, z2] = pts[(i + 1) % pts.length]; a += x1 * z2 - x2 * z1; } return Math.abs(a / 2) / 10000; }
function polyCenter(pts) { const xs = pts.map(p => p[0]), zs = pts.map(p => p[1]); return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...zs) + Math.max(...zs)) / 2]; }
function polyMesh(pts, material, y) {
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
  m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true;
  return m;
}

const planGroup = new THREE.Group(); scene.add(planGroup);
const ceilingGroup = new THREE.Group(); scene.add(ceilingGroup);
let ceilOn = true;
const wallGroup = new THREE.Group(); scene.add(wallGroup);
const labelGroup = new THREE.Group(); scene.add(labelGroup);
const colliders = []; // 漫遊碰撞用
let wallHeight = P.CEIL;

function wallBox(r, y0, y1, mats = WALL_MATS) {
  if (y1 - y0 < 0.5) return;
  const m = new THREE.Mesh(new THREE.BoxGeometry(r.x2 - r.x1, y1 - y0, r.z2 - r.z1), mats);
  m.position.set((r.x1 + r.x2) / 2, (y0 + y1) / 2, (r.z1 + r.z2) / 2);
  m.castShadow = m.receiveShadow = true;
  wallGroup.add(m);
}
function plain(w, h, d, x, y, z, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true;
  wallGroup.add(m); return m;
}

// 天花板：只從下方看得到（BackSide），人視角與漫遊時顯示
function buildCeiling() {
  const m = new THREE.MeshStandardMaterial({ color: '#f3eee5', emissive: '#f3eee5', emissiveIntensity: 0.45, roughness: 0.95, side: THREE.BackSide });
  for (const room of P.ROOMS) {
    if (room.id.startsWith('bal')) continue;
    const c = polyMesh(polyCm(room.poly), m, P.CEIL);
    c.receiveShadow = false;
    ceilingGroup.add(c);
  }
}
buildCeiling();

function buildFloors() {
  for (const o of P.OUTLINE) planGroup.add(polyMesh(polyCm(o), new THREE.MeshStandardMaterial({ color: '#d8d4cc', roughness: 0.8 }), 0));
  for (const room of P.ROOMS) planGroup.add(polyMesh(polyCm(room.poly), FLOORS[room.floor], 0.3));
}

function buildWalls() {
  wallGroup.clear();
  colliders.length = 0;
  const H = wallHeight;
  for (const w of P.WALLS) { const r = rectCm(w); wallBox(r, 0, H); colliders.push(r); }
  for (const w of P.PARAPETS) {
    const r = rectCm(w); colliders.push(r);
    wallBox(r, 0, Math.min(P.PARAPET_H, H));
  }
  const frame = mat('#4f5256', { r: 0.5, m: 0.4 }), glass = mat('#cfe6ee', { o: 0.28, r: 0.05, m: 0.1, ds: true });
  for (const op of P.OPENINGS) {
    const r = rectCm(op.r), horiz = (r.x2 - r.x1) > (r.z2 - r.z1);
    const len = horiz ? r.x2 - r.x1 : r.z2 - r.z1, th = horiz ? r.z2 - r.z1 : r.x2 - r.x1;
    const mx = (r.x1 + r.x2) / 2, mz = (r.z1 + r.z2) / 2;
    if (op.kind !== 'door') colliders.push(r);
    if (op.sill > 0) wallBox(r, 0, Math.min(op.sill, H));
    if (op.head < H) wallBox(r, op.head, H);
    const top = Math.min(op.head, H);
    if (op.kind === 'window' || op.kind === 'slide') {
      if (op.sill >= H) continue;
      const gh = top - op.sill;
      const box = (a, h, y, along) => horiz ? plain(a, h, 6, mx + along, y, mz, frame) : plain(6, h, a, mx, y, mz + along, frame);
      const pane = horiz ? plain(len, gh, 1, mx, op.sill, mz, glass) : plain(1, gh, len, mx, op.sill, mz, glass);
      pane.castShadow = false;
      box(len, 4, op.sill, 0);
      if (top === op.head) box(len, 4, top - 4, 0);
      for (const s of [-1, 1]) box(4, gh, op.sill, s * (len / 2 - 2));
      box(3, gh, op.sill, 0);
    } else if (op.kind === 'door') {
      const dh = Math.min(op.head, H);
      const a1 = horiz ? r.x1 : r.z1, a2 = horiz ? r.x2 : r.z2;
      const pc = horiz ? mz : mx;
      const hinge = op.hinge ? a2 - 2.5 : a1 + 2.5;
      const leafLen = len - 4, p = pc + op.swing * (th / 2 + leafLen / 2);
      const leafMat = mat(op.main ? '#2f2420' : '#3b2c25', { r: 0.55 });
      if (horiz) plain(4, dh, leafLen, hinge, 0, p, leafMat); else plain(leafLen, dh, 4, p, 0, hinge, leafMat);
      // 門檻
      const sill = mat('#bdb7ad', { r: 0.6 });
      if (horiz) plain(len, 0.8, th, mx, 0, mz, sill); else plain(th, 0.8, len, mx, 0, mz, sill);
    }
  }
  tagWalls();
}

// ── 牆面自動透視：擋在相機與視點之間的牆降成矮牆 ─────────────
const outlinePolys = P.OUTLINE.map(polyCm);
function inPoly(x, z, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}
function tagWalls() {
  const b = new THREE.Box3();
  const out = (x, z) => !outlinePolys.some(p => inPoly(x, z, p));
  for (const m of wallGroup.children) {
    b.setFromObject(m);
    const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, hx = (b.max.x - b.min.x) / 2, hz = (b.max.z - b.min.z) / 2;
    const ext = out(cx - hx - 20, cz) || out(cx + hx + 20, cz) || out(cx, cz - hz - 20) || out(cx, cz + hz + 20);
    m.userData.cut = { cx, cz, ext, half: Math.max(hx, hz), y0: b.min.y, h: b.max.y - b.min.y, py: m.position.y, state: false };
  }
}
const STUB = 12;
function setCut(m, cut) {
  const u = m.userData.cut;
  if (u.state === cut) return;
  u.state = cut;
  if (!cut) { m.visible = true; m.scale.y = 1; m.position.y = u.py; return; }
  if (u.y0 >= STUB - 0.5) { m.visible = false; return; }
  const nh = STUB - u.y0;
  if (nh < u.h) { m.scale.y = nh / u.h; m.position.y = u.y0 + nh / 2; }
}
let cutOn = true;
function updateCutaway() {
  const active = cutOn && (mode === '3d' || mode === 'eye');
  const cx = cam.position.x, cz = cam.position.z;
  const vx = ctrl.target.x - cx, vz = ctrl.target.z - cz, dist = Math.hypot(vx, vz);
  const tanH = Math.tan(deg(persp.fov / 2)) * persp.aspect;
  for (const m of wallGroup.children) {
    const u = m.userData.cut; if (!u) continue;
    let cut = false;
    // 鳥瞰只透視外牆；人視角連隔間牆一起透視
    if (active && dist > 60 && (mode === 'eye' || u.ext)) {
      const px = u.cx - cx, pz = u.cz - cz;
      const t = (px * vx + pz * vz) / dist, perp = Math.abs(px * vz - pz * vx) / dist;
      cut = t > 0 && t < dist - 40 && perp < t * tanH + u.half + 60;
    }
    setCut(m, cut);
  }
  ceilingGroup.visible = ceilOn && (mode === 'eye' || mode === 'walk') && wallHeight >= P.CEIL;
  // 人視角：擋在鏡頭前、離視點 2.5m 以外的家具暫時隱藏
  const hideFurn = active && mode === 'eye' && dist > 60;
  if (eyeRoom && !inPoly(ctrl.target.x, ctrl.target.z, eyeRoom._pts)) eyeRoom = null;
  for (const [id, g] of objs) {
    let hide = false;
    if (hideFurn && id !== selId) {
      const px = g.position.x - cx, pz = g.position.z - cz;
      const t = (px * vx + pz * vz) / dist, perp = Math.abs(px * vz - pz * vx) / dist;
      const inRoom = eyeRoom && inPoly(g.position.x, g.position.z, eyeRoom._pts);
      hide = eyeRoom ? !inRoom && t < dist && perp < Math.max(t, 0) * tanH + 120
                     : t < dist - 250 && perp < Math.max(t, 0) * tanH + 120;
    }
    g.visible = !hide;
  }
}

function buildLabels() {
  const list = $('#roomList');
  list.innerHTML = '';
  let total = 0;
  for (const room of P.ROOMS) {
    const pts = polyCm(room.poly), area = polyArea(pts);
    total += area;
    const [lx, lz] = room.label ? [P.cx(room.label[0]), P.cz(room.label[1])] : polyCenter(pts);
    room._center = polyCenter(pts); room._pts = pts;
    const el = document.createElement('div');
    el.className = 'room-label';
    el.innerHTML = `<b>${room.name}</b><span>${area.toFixed(1)} m² · ${(area * 0.3025).toFixed(1)} 坪</span>`;
    const o = new CSS2DObject(el); o.position.set(lx, 5, lz); labelGroup.add(o);
    const li = document.createElement('button');
    li.className = 'room-item';
    li.innerHTML = `<span>${room.name}</span><small>${area.toFixed(1)} m²</small>`;
    li.onclick = () => flyToRoom(room);
    list.appendChild(li);
  }
  for (const s of P.SUBLABELS) {
    const el = document.createElement('div'); el.className = 'room-label sub'; el.innerHTML = `<b>${s.name}</b>`;
    const o = new CSS2DObject(el); o.position.set(P.cx(s.at[0]), 5, P.cz(s.at[1])); labelGroup.add(o);
  }
  $('#totalArea').textContent = `室內約 ${total.toFixed(1)} m²（${(total * 0.3025).toFixed(1)} 坪）`;
}

// 參考底圖
const overlayTex = new THREE.TextureLoader().load(P.PLAN_IMAGE.src);
overlayTex.colorSpace = THREE.SRGBColorSpace;
const [ix1, iy1, ix2, iy2] = P.PLAN_IMAGE.rect;
const overlay = new THREE.Mesh(
  new THREE.PlaneGeometry((ix2 - ix1) * P.S, (iy2 - iy1) * P.S),
  new THREE.MeshBasicMaterial({ map: overlayTex, transparent: true, opacity: 0.75, depthWrite: false, toneMapped: false })
);
overlay.rotation.x = -Math.PI / 2;
overlay.position.set(P.cx((ix1 + ix2) / 2), 1.5, P.cz((iy1 + iy2) / 2));
overlay.renderOrder = 2; overlay.visible = false;
scene.add(overlay);

buildFloors(); buildWalls(); buildLabels();

// ── 家具狀態 ─────────────────────────────────────────────
const furnRoot = new THREE.Group(); scene.add(furnRoot);
let items = [];
const objs = new Map();
let selId = null;
let uid = 1;
const newId = () => 'f' + (uid++).toString(36) + Date.now().toString(36).slice(-3);

function makeItem(type, x, z, extra = {}) {
  const def = CATALOG[type];
  return { id: newId(), type, x, z, w: def.w, d: def.d, h: def.h, rot: 0, elev: def.elev || 0, color: def.color, color2: def.color2 || null, name: def.name, ...extra };
}
function defaultLayout() {
  return P.DEFAULT_LAYOUT.map(f => {
    const extra = { ...f }; delete extra.t; delete extra.c;
    if (extra.name == null) delete extra.name;
    if (extra.rot != null) extra.rot = normRot(extra.rot);
    return makeItem(f.t, round1(P.cx(f.c[0])), round1(P.cz(f.c[1])), extra);
  });
}
const round1 = v => Math.round(v * 10) / 10;

function disposeObj(g) { g.traverse(m => { if (m.isMesh) m.geometry.dispose(); }); }
function syncObj(it) {
  const old = objs.get(it.id);
  if (old) { furnRoot.remove(old); disposeObj(old); }
  const g = buildFurniture(it);
  g.position.set(it.x, it.elev || 0, it.z);
  g.rotation.y = deg(it.rot);
  g.userData.fid = it.id;
  furnRoot.add(g); objs.set(it.id, g);
}
function placeObj(it) {
  const g = objs.get(it.id); if (!g) return;
  g.position.set(it.x, it.elev || 0, it.z); g.rotation.y = deg(it.rot);
}
function setItems(list) {
  for (const g of objs.values()) { furnRoot.remove(g); disposeObj(g); }
  objs.clear();
  items = list.filter(it => CATALOG[it.type]);
  items.forEach(syncObj);
  select(null);
}

// ── 選取外框 ─────────────────────────────────────────────
const selHelper = new THREE.Group(); scene.add(selHelper);
const selMat = new THREE.LineBasicMaterial({ color: '#d0743c', depthTest: false, transparent: true });
const selFill = new THREE.MeshBasicMaterial({ color: '#d0743c', transparent: true, opacity: 0.12, depthTest: false });
function buildSelHelper() {
  selHelper.clear();
  const it = items.find(i => i.id === selId); if (!it) return;
  const { w, d } = it, pad = 3;
  const pts = [[-w / 2 - pad, -d / 2 - pad], [w / 2 + pad, -d / 2 - pad], [w / 2 + pad, d / 2 + pad], [-w / 2 - pad, d / 2 + pad]];
  const geo = new THREE.BufferGeometry().setFromPoints(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  const loop = new THREE.LineLoop(geo, selMat); loop.renderOrder = 10;
  const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(box), selMat);
  edges.scale.set(w + pad * 2, it.h + (it.elev || 0) + 2, d + pad * 2); edges.renderOrder = 10;
  const fill = new THREE.Mesh(new THREE.PlaneGeometry(w + pad * 2, d + pad * 2), selFill);
  fill.rotation.x = -Math.PI / 2; fill.position.y = 0.5; fill.renderOrder = 9;
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(Math.min(10, w / 5), Math.min(16, d / 2), 3), new THREE.MeshBasicMaterial({ color: '#d0743c', depthTest: false }));
  arrow.rotation.x = Math.PI / 2; arrow.position.set(0, 1, d / 2 + pad + 12); arrow.renderOrder = 11;
  selHelper.add(loop, edges, fill, arrow);
  syncHelper();
}
function syncHelper() {
  const it = items.find(i => i.id === selId); if (!it) return;
  selHelper.position.set(it.x, 0.6, it.z); selHelper.rotation.y = deg(it.rot);
}

// ── 歷史紀錄與儲存 ───────────────────────────────────────
const hist = []; let hIndex = -1;
const snap = () => JSON.stringify(items);
function commit(save = true) {
  hist.splice(hIndex + 1);
  hist.push(snap());
  if (hist.length > 120) hist.shift();
  hIndex = hist.length - 1;
  if (save) persist();
  updateUndo();
  updatePlanState();
}
function persist() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ v: 5, items })); } catch { /* 私密模式等 */ }
}
function restore(i) {
  hIndex = i;
  const keep = selId;
  setItems(JSON.parse(hist[i]));
  if (items.some(it => it.id === keep)) select(keep);
  persist(); updateUndo(); updatePlanState();
}
const undo = () => hIndex > 0 && restore(hIndex - 1);
const redo = () => hIndex < hist.length - 1 && restore(hIndex + 1);
function updateUndo() { $('#btnUndo').disabled = hIndex <= 0; $('#btnRedo').disabled = hIndex >= hist.length - 1; }

// ── 選取與屬性面板 ───────────────────────────────────────
const panel = $('#props');
function select(id) {
  selId = id;
  buildSelHelper();
  const it = items.find(i => i.id === id);
  document.body.classList.toggle('has-sel', !!it);
  if (!it) return;
  const def = CATALOG[it.type];
  $('#pName').value = it.name || def.name;
  $('#pType').textContent = def.name;
  $('#pW').value = Math.round(it.w); $('#pD').value = Math.round(it.d); $('#pH').value = Math.round(it.h);
  $('#pElev').value = Math.round(it.elev || 0);
  $('#pRot').value = Math.round(it.rot); $('#pRotVal').textContent = Math.round(it.rot) + '°';
  $('#pColor').value = it.color || def.color;
  $('#pColor2Row').hidden = !def.color2;
  $('#pSw2Row').hidden = !def.color2;
  const same = Object.entries(CATALOG).filter(([, d]) => d.cat === def.cat);
  const sel = $('#pStyle');
  sel.innerHTML = same.map(([k, d]) => `<option value="${k}">${d.name}　${d.w}×${d.d}</option>`).join('');
  sel.value = it.type;
  $('#pStyleRow').hidden = same.length < 2;
  if (def.color2) $('#pColor2').value = it.color2 || def.color2;
}
const selItem = () => items.find(i => i.id === selId);

function updateSel(fn, rebuild = false) {
  const it = selItem(); if (!it) return;
  fn(it);
  if (rebuild) syncObj(it); else placeObj(it);
  buildSelHelper();
}
const normRot = r => ((Math.round(r) % 360) + 360) % 360;

// 常用色票：點一下套用到主色／配色
const SWATCHES = [
  ['#efe9df', '米白'], ['#e3e1dc', '灰白'], ['#c9c9c6', '淺灰'], ['#8f9497', '灰'], ['#4a4b4d', '深灰'], ['#232323', '黑'],
  ['#d6c7ad', '燕麥'], ['#b9946b', '駝色'], ['#c9a77d', '橡木'], ['#6e4b2e', '胡桃木'], ['#9b6a3c', '焦糖皮'],
  ['#8a9a7b', '鼠尾草綠'], ['#7d8a96', '霧藍'], ['#b55d4c', '磚紅'], ['#e8692a', '橘'], ['#c9a24a', '黃銅'],
];
for (const [box, key, input] of [['#pSw1', 'color', '#pColor'], ['#pSw2', 'color2', '#pColor2']]) {
  const el = $(box);
  for (const [c, n] of SWATCHES) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sw'; b.style.background = c; b.title = n; b.setAttribute('aria-label', n);
    b.onclick = () => { updateSel(it => { it[key] = c; }, true); $(input).value = c; commit(); };
    el.appendChild(b);
  }
}
$('#pStyle').addEventListener('change', e => {
  const t = e.target.value, def = CATALOG[t];
  if (!def) return;
  updateSel(it => {
    const keepName = it.name && it.name !== CATALOG[it.type].name;
    Object.assign(it, { type: t, w: def.w, d: def.d, h: def.h, color: def.color, color2: def.color2 || null, elev: def.elev ?? it.elev ?? 0 });
    if (!keepName) it.name = def.name;
  }, true);
  select(selId); commit();
});
$('#pName').addEventListener('change', e => { updateSel(it => it.name = e.target.value.trim() || CATALOG[it.type].name); commit(); });
for (const [id, key, min] of [['#pW', 'w', 5], ['#pD', 'd', 1], ['#pH', 'h', 1]]) {
  $(id).addEventListener('change', e => {
    const v = Math.max(min, Math.min(1000, +e.target.value || min));
    e.target.value = v; updateSel(it => it[key] = v, true); commit();
  });
}
$('#pElev').addEventListener('change', e => { const v = Math.max(0, Math.min(250, +e.target.value || 0)); e.target.value = v; updateSel(it => it.elev = v, true); commit(); });
$('#pRot').addEventListener('input', e => { updateSel(it => it.rot = normRot(+e.target.value)); $('#pRotVal').textContent = e.target.value + '°'; });
$('#pRot').addEventListener('change', () => commit());
$('#pColor').addEventListener('input', e => updateSel(it => it.color = e.target.value, true));
$('#pColor').addEventListener('change', () => commit());
$('#pColor2').addEventListener('input', e => updateSel(it => it.color2 = e.target.value, true));
$('#pColor2').addEventListener('change', () => commit());
$('#pResetColor').onclick = () => { updateSel(it => { const d = CATALOG[it.type]; it.color = d.color; it.color2 = d.color2 || null; }, true); select(selId); commit(); };

function rotateSel(delta) { if (!selItem()) return; updateSel(it => it.rot = normRot(it.rot + delta)); select(selId); commit(); }
function deleteSel() {
  const it = selItem(); if (!it) return;
  const g = objs.get(it.id); furnRoot.remove(g); disposeObj(g); objs.delete(it.id);
  items = items.filter(i => i !== it); select(null); commit();
}
function duplicateSel() {
  const it = selItem(); if (!it) return;
  const c = { ...it, id: newId(), x: it.x + 30, z: it.z + 30 };
  items.push(c); syncObj(c); select(c.id); commit();
}
$('#pRotL').onclick = () => rotateSel(-90);
$('#pRotR').onclick = () => rotateSel(90);
$('#pDup').onclick = duplicateSel;
$('#pDel').onclick = deleteSel;
$('#pClose').onclick = () => select(null);

// ── 拖曳互動 ─────────────────────────────────────────────
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function setRay(e) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, cam);
}
function pick(e) {
  setRay(e);
  const hit = ray.intersectObjects(furnRoot.children.filter(g => g.visible), true).find(h => h.object.userData.fid);
  return hit ? hit.object.userData.fid : null;
}
function floorPoint(e) {
  setRay(e);
  const p = new THREE.Vector3();
  return ray.ray.intersectPlane(floorPlane, p) ? p : null;
}

let snapOn = true;
function halfExtents(it) {
  const a = deg(it.rot), c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
  return [(it.w * c + it.d * s) / 2, (it.w * s + it.d * c) / 2];
}
const SNAP_SURFACES = [...P.WALLS, ...P.PARAPETS, ...P.OPENINGS.filter(o => o.kind !== 'door').map(o => o.r)].map(rectCm);
function snapPos(it, x, z) {
  if (!snapOn) return [x, z];
  x = Math.round(x / 5) * 5; z = Math.round(z / 5) * 5;
  if (it.rot % 90 !== 0) return [x, z];
  const [hx, hz] = halfExtents(it), SN = 14;
  let bx = SN, bz = SN, sx = x, sz = z;
  for (const r of SNAP_SURFACES) {
    if (z + hz > r.z1 + 1 && z - hz < r.z2 - 1) {
      const d1 = Math.abs(x - hx - r.x2), d2 = Math.abs(x + hx - r.x1);
      if (d1 < bx) { bx = d1; sx = r.x2 + hx; }
      if (d2 < bx) { bx = d2; sx = r.x1 - hx; }
    }
    if (x + hx > r.x1 + 1 && x - hx < r.x2 - 1) {
      const d1 = Math.abs(z - hz - r.z2), d2 = Math.abs(z + hz - r.z1);
      if (d1 < bz) { bz = d1; sz = r.z2 + hz; }
      if (d2 < bz) { bz = d2; sz = r.z1 - hz; }
    }
  }
  return [round1(sx), round1(sz)];
}
const clampX = v => Math.max(BX0 - 200, Math.min(BX1 + 200, v));
const clampZ = v => Math.max(BZ0 - 200, Math.min(BZ1 + 200, v));

let drag = null, down = null;
viewport.addEventListener('pointerdown', e => {
  if (mode === 'walk' || e.target !== renderer.domElement) return;
  down = { x: e.clientX, y: e.clientY };
  if (e.button !== 0) return;
  const id = pick(e);
  if (!id) return;
  e.stopPropagation(); // 不交給 OrbitControls
  select(id);
  const it = selItem(), p = floorPoint(e);
  if (!p) return;
  drag = { id, ox: it.x - p.x, oz: it.z - p.z, moved: false, pid: e.pointerId };
  renderer.domElement.setPointerCapture(e.pointerId);
  viewport.classList.add('dragging');
}, true);

window.addEventListener('pointermove', e => {
  if (mode === 'walk') return;
  if (drag && e.pointerId === drag.pid) {
    const p = floorPoint(e); if (!p) return;
    const it = selItem();
    const [x, z] = snapPos(it, clampX(p.x + drag.ox), clampZ(p.z + drag.oz));
    if (x !== it.x || z !== it.z) { it.x = x; it.z = z; placeObj(it); syncHelper(); drag.moved = true; showCoords(it); }
    return;
  }
  if (e.target === renderer.domElement && e.pointerType === 'mouse' && !e.buttons) hoverCheck(e);
});
let hoverT = 0;
function hoverCheck(e) {
  const now = performance.now(); if (now - hoverT < 50) return; hoverT = now;
  viewport.classList.toggle('hover-item', !!pick(e));
}
window.addEventListener('pointerup', e => {
  if (drag && e.pointerId === drag.pid) {
    if (drag.moved) commit();
    drag = null; viewport.classList.remove('dragging'); hideCoords();
    return;
  }
  if (down && e.target === renderer.domElement && mode !== 'walk') {
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    if (moved < 5 && e.button === 0 && !pick(e)) select(null);
  }
  down = null;
});

const coordEl = $('#coords');
function showCoords(it) { coordEl.hidden = false; coordEl.textContent = `X ${Math.round(it.x)}  ·  Y ${Math.round(it.z)} cm`; }
function hideCoords() { coordEl.hidden = true; }

// ── 家具庫 ───────────────────────────────────────────────
function addFurniture(type, at) {
  let x, z;
  if (at) { x = at.x; z = at.z; } else { const t = ctrl.target; x = t.x; z = t.z; }
  const it = makeItem(type, 0, 0);
  [it.x, it.z] = snapPos(it, clampX(x), clampZ(z));
  items.push(it); syncObj(it); select(it.id); commit();
  if (matchMedia('(max-width: 820px)').matches) document.body.classList.remove('lib-open');
}

function renderThumbs() {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setSize(150, 150); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  const sc = new THREE.Scene();
  sc.environment = scene.environment;
  sc.add(new THREE.HemisphereLight('#ffffff', '#bbb', 0.7));
  const dl = new THREE.DirectionalLight('#fff', 1.4); dl.position.set(1, 2, 1.5); sc.add(dl);
  const c = new THREE.PerspectiveCamera(30, 1, 1, 5000);
  const out = {};
  for (const [type, def] of Object.entries(CATALOG)) {
    const g = buildFurniture({ id: '_', type, w: def.w, d: def.d, h: def.h, elev: def.elev ? CEIL_H - def.h - 30 : 0 });
    sc.add(g);
    const box = new THREE.Box3().setFromObject(g), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
    const rad = size.length() / 2;
    const dir = new THREE.Vector3(0.8, 0.75, 1.1).normalize();
    c.position.copy(ctr).addScaledVector(dir, rad / Math.sin(deg(15)) * 1.02); c.lookAt(ctr);
    r.render(sc, c);
    out[type] = r.domElement.toDataURL();
    sc.remove(g); disposeObj(g);
  }
  r.dispose(); r.forceContextLoss();
  return out;
}

function buildLibrary() {
  const thumbs = renderThumbs();
  const tabs = $('#catTabs'), grid = $('#libGrid');
  let cat = 'all', q = '';
  const draw = () => {
    grid.innerHTML = '';
    for (const [type, def] of Object.entries(CATALOG)) {
      if (cat !== 'all' && def.cat !== cat) continue;
      if (q && !def.name.includes(q)) continue;
      const b = document.createElement('button');
      b.className = 'lib-item'; b.draggable = true; b.title = `${def.name}  ${def.w}×${def.d}×${def.h} cm`;
      b.innerHTML = `<img src="${thumbs[type]}" alt=""><span>${def.name}</span><small>${def.w}×${def.d}</small>`;
      b.onclick = () => addFurniture(type);
      b.addEventListener('dragstart', e => { e.dataTransfer.setData('text/fp3d', type); e.dataTransfer.effectAllowed = 'copy'; });
      grid.appendChild(b);
    }
  };
  const mk = (key, label) => {
    const b = document.createElement('button'); b.textContent = label; b.dataset.cat = key;
    b.onclick = () => { cat = key; $$('#catTabs button').forEach(x => x.classList.toggle('on', x === b)); draw(); };
    tabs.appendChild(b); return b;
  };
  mk('all', '全部').classList.add('on');
  CATEGORIES.forEach(c => mk(c, c));
  $('#libSearch').addEventListener('input', e => { q = e.target.value.trim(); draw(); });
  draw();
}
viewport.addEventListener('dragover', e => { if (e.dataTransfer.types.includes('text/fp3d')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } });
viewport.addEventListener('drop', e => {
  const type = e.dataTransfer.getData('text/fp3d');
  if (!type || !CATALOG[type] || mode === 'walk') return;
  e.preventDefault();
  const p = floorPoint(e); addFurniture(type, p);
});

// ── 視角 ─────────────────────────────────────────────────
let tween = null;
function tweenTo(camPos, target, dur = 700, zoom) {
  const c = cam;
  tween = { c, t0: performance.now(), dur, p0: c.position.clone(), p1: camPos.clone(), g0: ctrl.target.clone(), g1: target.clone(), z0: c.zoom, z1: zoom ?? c.zoom };
}
function setMode(m) {
  if (m === mode) return;
  if (mode === 'walk') exitWalk();
  if (mode === 'eye') exitEye();
  mode = m;
  $$('.view-btn').forEach(b => b.classList.toggle('on', b.dataset.view === m));
  document.body.dataset.mode = m;
  ctrlP.enabled = m === '3d' || m === 'eye'; ctrlO.enabled = m === 'top';
  if (m === '3d' || m === 'eye') { cam = persp; ctrl = ctrlP; }
  if (m === 'top') { cam = ortho; ctrl = ctrlO; }
  tween = null;
  if (m === 'walk') enterWalk();
  if (m === 'eye') enterEye();
}

// ── 人視角：視線高度環視，前方的牆自動透視 ────────────────
const EYE_T = 100, EYE_POLAR = deg(82);
let eyeSaved = null, eyeRoom = null;
function eyePose(x, z, dist, theta) {
  const t = new THREE.Vector3(x, EYE_T, z);
  return [new THREE.Vector3().setFromSphericalCoords(dist, EYE_POLAR, theta).add(t), t];
}
function enterEye() {
  eyeSaved = { p: persp.position.clone(), t: ctrlP.target.clone() };
  ctrlP.minPolarAngle = ctrlP.maxPolarAngle = EYE_POLAR;
  ctrlP.minDistance = 120; ctrlP.maxDistance = 1500;
  persp.fov = 55; persp.updateProjectionMatrix();
  eyeRoom = P.ROOMS[0];
  const [p, t] = eyePose(P.cx(690), P.cz(330), 560, deg(eyeRoom.eye));
  persp.position.copy(p); ctrlP.target.copy(t); ctrlP.update();
  select(null);
}
function exitEye() {
  ctrlP.minPolarAngle = 0; ctrlP.maxPolarAngle = deg(86);
  ctrlP.minDistance = 80; ctrlP.maxDistance = 5000;
  persp.fov = 40; persp.updateProjectionMatrix();
  if (eyeSaved) { persp.position.copy(eyeSaved.p); ctrlP.target.copy(eyeSaved.t); }
  ctrlP.update();
}
$$('.view-btn').forEach(b => b.onclick = () => setMode(b.dataset.view));

function flyToRoom(room) {
  const [x, z] = room._center;
  const xs = room._pts.map(p => p[0]), zs = room._pts.map(p => p[1]);
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
  if (mode === 'walk') { walk.pos.set(x, EYE, z); return; }
  if (mode === 'eye') {
    const off = cam.position.clone().sub(ctrl.target);
    const theta = room.eye != null ? deg(room.eye) : Math.atan2(off.x, off.z);
    const [lx, lz] = room.label ? [P.cx(room.label[0]), P.cz(room.label[1])] : [x, z];
    const [p, t] = eyePose(lx, lz, Math.min(1100, span * 0.75 + 240), theta);
    eyeRoom = room;
    tweenTo(p, t);
    if (matchMedia('(max-width: 820px)').matches) document.body.classList.remove('lib-open');
    return;
  }
  if (mode === 'top') { const zoom = Math.min(4, (ortho.top * 1.6) / (span + 120)); tweenTo(new THREE.Vector3(x, 3000, z), new THREE.Vector3(x, 0, z), 600, zoom); return; }
  const dist = span * 1.5 + 250;
  tweenTo(new THREE.Vector3(x + dist * 0.15, dist * 0.95, z + dist * 0.7), new THREE.Vector3(x, 0, z));
  if (matchMedia('(max-width: 820px)').matches) document.body.classList.remove('lib-open');
}
function resetView() {
  if (mode === 'top') tweenTo(new THREE.Vector3(CX, 3000, CZ), new THREE.Vector3(CX, 0, CZ), 600, 1);
  else if (mode === '3d') tweenTo(homePos(), new THREE.Vector3(CX, 0, CZ));
  else if (mode === 'eye') { eyeRoom = P.ROOMS[0]; const [p, t] = eyePose(P.cx(690), P.cz(330), 560, deg(eyeRoom.eye)); tweenTo(p, t); }
}
$('#btnFit').onclick = resetView;

// ── 漫遊 ─────────────────────────────────────────────────
const EYE = 155;
const walk = { pos: new THREE.Vector3(), yaw: 0, pitch: 0, keys: {}, saved: null, look: null };
function enterWalk() {
  walk.saved = { p: persp.position.clone(), t: ctrlP.target.clone() };
  cam = persp; ctrl = ctrlP; ctrlP.enabled = false;
  walk.pos.set(P.cx(560), EYE, P.cz(760));
  walk.yaw = deg(-12); walk.pitch = -0.08;
  persp.fov = 65; persp.updateProjectionMatrix();
  select(null);
  toast(matchMedia('(pointer: coarse)').matches ? '拖曳畫面轉向，用方向鍵移動' : '點畫面鎖定滑鼠 · WASD 移動 · Shift 加速 · Esc 釋放');
}
function exitWalk() {
  if (document.pointerLockElement) document.exitPointerLock();
  persp.fov = 40; persp.updateProjectionMatrix();
  if (walk.saved) { persp.position.copy(walk.saved.p); ctrlP.target.copy(walk.saved.t); }
  ctrlP.update();
}
renderer.domElement.addEventListener('click', () => {
  if (mode === 'walk' && !matchMedia('(pointer: coarse)').matches && !document.pointerLockElement) renderer.domElement.requestPointerLock?.();
});
document.addEventListener('mousemove', e => {
  if (mode !== 'walk' || document.pointerLockElement !== renderer.domElement) return;
  walk.yaw -= e.movementX * 0.0022; walk.pitch = Math.max(-1.3, Math.min(1.3, walk.pitch - e.movementY * 0.0022));
});
renderer.domElement.addEventListener('pointerdown', e => { if (mode === 'walk' && e.pointerType !== 'mouse') walk.look = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('pointermove', e => {
  if (mode !== 'walk' || !walk.look) return;
  walk.yaw += (e.clientX - walk.look.x) * 0.005; walk.pitch = Math.max(-1.3, Math.min(1.3, walk.pitch + (e.clientY - walk.look.y) * 0.005));
  walk.look = { x: e.clientX, y: e.clientY };
});
window.addEventListener('pointerup', () => { walk.look = null; });
$$('#walkPad button').forEach(b => {
  const k = b.dataset.k;
  b.addEventListener('pointerdown', e => { e.preventDefault(); walk.keys[k] = true; });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { walk.keys[k] = false; });
});
function blocked(x, z) {
  const R = 18;
  return colliders.some(r => x > r.x1 - R && x < r.x2 + R && z > r.z1 - R && z < r.z2 + R);
}
function updateWalk(dt) {
  const k = walk.keys, f = (k.w || k.ArrowUp ? 1 : 0) - (k.s || k.ArrowDown ? 1 : 0), s = (k.d || k.ArrowRight ? 1 : 0) - (k.a || k.ArrowLeft ? 1 : 0);
  if (f || s) {
    const sp = (k.Shift ? 320 : 160) * dt;
    const fx = -Math.sin(walk.yaw), fz = -Math.cos(walk.yaw);
    const dx = (fx * f - fz * s), dz = (fz * f + fx * s), n = Math.hypot(dx, dz) || 1;
    const nx = walk.pos.x + (dx / n) * sp, nz = walk.pos.z + (dz / n) * sp;
    if (!blocked(nx, walk.pos.z)) walk.pos.x = nx;
    if (!blocked(walk.pos.x, nz)) walk.pos.z = nz;
  }
  persp.position.copy(walk.pos);
  persp.rotation.set(walk.pitch, walk.yaw, 0, 'YXZ');
}

// ── 鍵盤 ─────────────────────────────────────────────────
window.addEventListener('keydown', e => {
  if (e.target.closest?.('input, textarea, select')) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mode === 'walk') {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    walk.keys[key] = true;
    if (e.key.startsWith('Arrow')) e.preventDefault();
  }
  if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
  if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateSel(); return; }
  if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); quickSavePlan(); return; }
  if (mod) return;
  if (e.key === 't' || e.key === 'T') { setMode(mode === '3d' ? 'top' : '3d'); return; }
  if (mode === 'walk') return;
  const it = selItem();
  switch (e.key) {
    case 'r': rotateSel(90); break;
    case 'R': rotateSel(-90); break;
    case 'q': case 'Q': rotateSel(-15); break;
    case 'e': case 'E': rotateSel(15); break;
    case 'Delete': case 'Backspace': if (it) { e.preventDefault(); deleteSel(); } break;
    case 'Escape': select(null); break;
    case 'f': case 'F': resetView(); break;
    case 'ArrowUp': case 'ArrowDown': case 'ArrowLeft': case 'ArrowRight': {
      if (!it) return;
      e.preventDefault();
      const st = e.shiftKey ? 1 : 5;
      const d = { ArrowUp: [0, -st], ArrowDown: [0, st], ArrowLeft: [-st, 0], ArrowRight: [st, 0] }[e.key];
      it.x = round1(it.x + d[0]); it.z = round1(it.z + d[1]); placeObj(it); syncHelper();
      clearTimeout(nudgeT); nudgeT = setTimeout(() => commit(), 400);
    }
  }
});
let nudgeT;
window.addEventListener('keyup', e => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  walk.keys[key] = false;
  if (e.key === 'Shift') walk.keys.Shift = false;
});
window.addEventListener('blur', () => { walk.keys = {}; });

// ── 工具列 ───────────────────────────────────────────────
$$('.wall-btn').forEach(b => b.onclick = () => {
  wallHeight = +b.dataset.h;
  $$('.wall-btn').forEach(x => x.classList.toggle('on', x === b));
  buildWalls();
});
$('#tglLabels').onchange = e => { labelGroup.visible = e.target.checked; labelRenderer.domElement.style.display = e.target.checked ? '' : 'none'; };
$('#tglPlan').onchange = e => { overlay.visible = e.target.checked; };
$('#tglSnap').onchange = e => { snapOn = e.target.checked; };
$('#tglCut').onchange = e => { cutOn = e.target.checked; };
$('#tglCeil').onchange = e => { ceilOn = e.target.checked; };
$('#btnUndo').onclick = undo;
$('#btnRedo').onclick = redo;
$('#btnReset').onclick = () => {
  if (!confirm('要還原成預設的家具配置嗎？目前的擺設會被取代（可用「復原」找回）。')) return;
  setItems(defaultLayout()); commit(); toast('已還原預設配置');
};
$('#btnClear').onclick = () => {
  if (!confirm('清空所有家具？（可用「復原」找回）')) return;
  setItems([]); commit();
};
$('#btnShot').onclick = () => {
  selHelper.visible = false;
  renderer.render(scene, cam);
  const url = renderer.domElement.toDataURL('image/png');
  selHelper.visible = true;
  download(url, 'floorplan-3d.png');
};
$('#btnExport').onclick = () => {
  const blob = new Blob([JSON.stringify({ v: 2, items, plans }, null, 1)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); download(url, 'floorplan-layout.json'); setTimeout(() => URL.revokeObjectURL(url), 2000);
};
$('#btnImport').onclick = () => $('#fileImport').click();
$('#fileImport').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!Array.isArray(data.items)) throw new Error('格式不符');
    const added = importPlans(data.plans);
    setItems(data.items.map(sanitize).filter(Boolean)); commit();
    toast(added ? `已匯入配置與 ${added} 個方案` : '已匯入配置');
  } catch (err) { toast('匯入失敗：' + err.message); }
  e.target.value = '';
};
$('#btnShare').onclick = async () => {
  try {
    const code = await encodeLayout(items);
    const url = location.origin + location.pathname + '#L=' + code;
    await navigator.clipboard?.writeText(url).catch(() => {});
    $('#shareUrl').value = url;
    $('#shareDlg').showModal();
  } catch (err) { toast('產生連結失敗：' + err.message); }
};
$('#shareCopy').onclick = async () => {
  const inp = $('#shareUrl'); inp.select();
  try { await navigator.clipboard.writeText(inp.value); toast('已複製連結'); } catch { document.execCommand('copy'); toast('已複製連結'); }
};
$('#btnRef').onclick = () => $('#refDlg').showModal();
$$('dialog .dlg-close').forEach(b => b.onclick = () => b.closest('dialog').close());
// ── 操作手冊 ─────────────────────────────────────────────
const GUIDE_KEY = 'fp3d.guide';
const guide = $('#guide'), guidePill = $('#guidePill');
const guideTabs = $$('.guide-tabs button');
let guidePageIdx = 0;
function guideGo(i) {
  guidePageIdx = Math.max(0, Math.min(guideTabs.length - 1, i));
  const key = guideTabs[guidePageIdx].dataset.g;
  guideTabs.forEach(b => b.classList.toggle('on', b.dataset.g === key));
  $$('.guide-body article').forEach(a => a.classList.toggle('on', a.dataset.g === key));
  $('.guide-body').scrollTop = 0;
  guideTabs[guidePageIdx].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  $('#guidePage').textContent = `${guidePageIdx + 1} / ${guideTabs.length}`;
  $('#guidePrev').disabled = guidePageIdx === 0;
  $('#guideNext').textContent = guidePageIdx === guideTabs.length - 1 ? '開始使用' : '下一頁';
}
function guideOpen(page) {
  guide.hidden = false; guidePill.hidden = true;
  requestAnimationFrame(() => guide.classList.add('show'));
  if (page != null) guideGo(page);
  try { localStorage.setItem(GUIDE_KEY, 'open'); } catch { /* 忽略 */ }
}
function guideMinimize() {
  guide.classList.remove('show');
  setTimeout(() => { guide.hidden = true; guidePill.hidden = false; }, 220);
  try { localStorage.setItem(GUIDE_KEY, 'min'); } catch { /* 忽略 */ }
}
guideTabs.forEach((b, i) => b.onclick = () => guideGo(i));
$('#guidePrev').onclick = () => guideGo(guidePageIdx - 1);
$('#guideNext').onclick = () => guidePageIdx === guideTabs.length - 1 ? guideMinimize() : guideGo(guidePageIdx + 1);
$('#guideMin').onclick = guideMinimize;
guidePill.onclick = () => guideOpen();
$('#btnHelp').onclick = () => { document.body.classList.remove('more-open'); guideOpen(); };
guideGo(0);
{
  let st = null;
  try { st = localStorage.getItem(GUIDE_KEY); } catch { /* 忽略 */ }
  if (st === 'min') guidePill.hidden = false; else guideOpen(0);
}
$('#btnLib').onclick = () => document.body.classList.toggle('lib-open');
$('#libScrim').onclick = () => document.body.classList.remove('lib-open');
$('#btnMore').onclick = e => { e.stopPropagation(); document.body.classList.toggle('more-open'); };
document.addEventListener('click', e => { if (!e.target.closest('#moreMenu')) document.body.classList.remove('more-open'); });

function download(url, name) { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }

// ── 分享連結編碼 ─────────────────────────────────────────
const KEYS = ['type', 'x', 'z', 'w', 'd', 'h', 'rot', 'elev', 'color', 'color2', 'name'];
function sanitize(o) {
  if (!o || !CATALOG[o.type]) return null;
  const def = CATALOG[o.type], num = (v, d) => (Number.isFinite(+v) ? +v : d);
  const color = /^#[0-9a-f]{6}$/i.test(o.color) ? o.color : def.color;
  const color2 = /^#[0-9a-f]{6}$/i.test(o.color2) ? o.color2 : (def.color2 || null);
  return { id: newId(), type: o.type, x: num(o.x, CX), z: num(o.z, CZ), w: num(o.w, def.w), d: num(o.d, def.d), h: num(o.h, def.h),
    rot: normRot(num(o.rot, 0)), elev: num(o.elev, 0), color, color2, name: String(o.name ?? def.name).slice(0, 40) };
}
async function encodeLayout(list) {
  const rows = list.map(it => KEYS.map(k => {
    const v = it[k], def = CATALOG[it.type];
    if (k === 'name' && v === def.name) return 0;
    if (k === 'color' && v === def.color) return 0;
    if (k === 'color2' && (v === def.color2 || !v)) return 0;
    return typeof v === 'number' ? Math.round(v) : v;
  }));
  const bytes = new TextEncoder().encode(JSON.stringify(rows));
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  const buf = new Uint8Array(await new Response(stream).arrayBuffer());
  let s = ''; buf.forEach(b => s += String.fromCharCode(b));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function decodeLayout(code) {
  const b = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(b, c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  const rows = JSON.parse(await new Response(stream).text());
  return rows.map(r => { const o = {}; KEYS.forEach((k, i) => { if (r[i] !== 0 || ['x', 'z', 'rot', 'elev'].includes(k)) o[k] = r[i]; }); return sanitize(o); }).filter(Boolean);
}

// ── 方案 ─────────────────────────────────────────────────
const PLANS_KEY = 'fp3d.plans', ACTIVE_KEY = 'fp3d.activePlan';
let plans = [], activePlan = null;
try {
  const p = JSON.parse(localStorage.getItem(PLANS_KEY) || '[]');
  if (Array.isArray(p)) plans = p.filter(x => x && Array.isArray(x.items));
  activePlan = localStorage.getItem(ACTIVE_KEY);
  if (!plans.some(x => x.id === activePlan)) activePlan = null;
} catch { /* 忽略 */ }

function savePlans() {
  try {
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
    if (activePlan) localStorage.setItem(ACTIVE_KEY, activePlan); else localStorage.removeItem(ACTIVE_KEY);
    return true;
  } catch { toast('瀏覽器儲存空間不足，請刪除一些方案'); return false; }
}
const layoutSig = list => JSON.stringify(list.map(it => KEYS.map(k => (typeof it[k] === 'number' ? Math.round(it[k] * 10) / 10 : (it[k] ?? null)))));
const cloneItems = () => JSON.parse(JSON.stringify(items));
const getPlan = id => plans.find(p => p.id === id);
const planDirty = () => { const p = getPlan(activePlan); return !p || layoutSig(p.items) !== layoutSig(items); };

function updatePlanState() {
  const el = $('#planState'), p = getPlan(activePlan);
  if (!p) { el.textContent = plans.length ? '未存成方案' : '未儲存'; el.className = ''; return; }
  const dirty = planDirty();
  el.textContent = p.name + (dirty ? ' · 已修改' : '');
  el.className = dirty ? 'dirty' : 'clean';
}

function planThumb() {
  const vis = selHelper.visible; selHelper.visible = false;
  renderer.render(scene, cam);
  const src = renderer.domElement, W = 240, H = 150;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#ece8e1'; g.fillRect(0, 0, W, H);
  const s = Math.max(W / src.width, H / src.height) * 1.15, w = src.width * s, h = src.height * s;
  g.drawImage(src, (W - w) / 2, (H - h) / 2, w, h);
  selHelper.visible = vis;
  return c.toDataURL('image/jpeg', 0.72);
}

function saveNewPlan(name) {
  name = (name || '').trim() || `方案 ${plans.length + 1}`;
  const p = { id: 'p' + Date.now().toString(36), name: name.slice(0, 30), items: cloneItems(), savedAt: Date.now(), thumb: planThumb() };
  const prev = activePlan;
  plans.unshift(p); activePlan = p.id;
  if (!savePlans()) { plans.shift(); activePlan = prev; return; }
  renderPlans(); updatePlanState(); toast(`已存成「${p.name}」`);
}
function overwritePlan(id, ask = true) {
  const p = getPlan(id); if (!p) return;
  if (ask && !confirm(`用目前的擺設覆蓋「${p.name}」？`)) return;
  const old = { items: p.items, savedAt: p.savedAt, thumb: p.thumb }, prev = activePlan;
  Object.assign(p, { items: cloneItems(), savedAt: Date.now(), thumb: planThumb() });
  activePlan = id;
  if (!savePlans()) { Object.assign(p, old); activePlan = prev; return; }
  renderPlans(); updatePlanState(); toast(`已更新「${p.name}」`);
}
function loadPlan(id) {
  const p = getPlan(id); if (!p) return;
  if (planDirty() && layoutSig(p.items) !== layoutSig(items)) {
    const cur = getPlan(activePlan);
    const what = cur ? `「${cur.name}」有還沒存進方案的修改` : '目前的擺設還沒存成方案';
    if (!confirm(`${what}，載入「${p.name}」後會被取代（可按復原找回）。要繼續嗎？`)) return;
  }
  setItems(p.items.map(sanitize).filter(Boolean));
  activePlan = id; savePlans();
  commit(); renderPlans(); toast(`已載入「${p.name}」`);
}
function renamePlan(id) {
  const p = getPlan(id); if (!p) return;
  const n = prompt('方案名稱', p.name);
  if (n == null || !n.trim()) return;
  p.name = n.trim().slice(0, 30); savePlans(); renderPlans(); updatePlanState();
}
function deletePlan(id) {
  const p = getPlan(id); if (!p) return;
  if (!confirm(`刪除方案「${p.name}」？目前畫面上的擺設不會受影響。`)) return;
  plans = plans.filter(x => x !== p);
  if (activePlan === id) activePlan = null;
  savePlans(); renderPlans(); updatePlanState();
}
function quickSavePlan() {
  if (getPlan(activePlan)) overwritePlan(activePlan, false); else openPlans();
}
function importPlans(list) {
  if (!Array.isArray(list)) return 0;
  let n = 0;
  for (const x of list) {
    if (!x || !Array.isArray(x.items)) continue;
    plans.push({
      id: 'p' + Date.now().toString(36) + n++, name: String(x.name || '匯入的方案').slice(0, 30),
      items: x.items.map(sanitize).filter(Boolean), savedAt: Number(x.savedAt) || Date.now(),
      thumb: typeof x.thumb === 'string' && x.thumb.startsWith('data:image/') ? x.thumb : '',
    });
  }
  if (n) { savePlans(); renderPlans(); }
  return n;
}

const fmtTime = t => new Date(t).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
function renderPlans() {
  const box = $('#planList');
  box.innerHTML = '';
  $('#planName').placeholder = `方案名稱，例如：方案 ${plans.length + 1}`;
  if (!plans.length) {
    box.innerHTML = '<div class="plan-empty">還沒有方案。輸入名稱後按「存成新方案」，就能把目前的擺設留下來。</div>';
    return;
  }
  const dirty = planDirty();
  for (const p of plans) {
    const on = p.id === activePlan;
    const row = document.createElement('div');
    row.className = 'plan-item' + (on ? ' on' : '');
    const img = document.createElement('div');
    img.className = 'plan-thumb';
    if (p.thumb) img.style.backgroundImage = `url("${p.thumb}")`;
    const meta = document.createElement('div');
    meta.className = 'plan-meta';
    const b = document.createElement('b');
    b.textContent = p.name;
    if (on) { const tag = document.createElement('span'); tag.className = 'plan-tag'; tag.textContent = dirty ? '使用中 · 已修改' : '使用中'; b.append(' ', tag); }
    const sm = document.createElement('small');
    sm.textContent = `${fmtTime(p.savedAt)} · ${p.items.length} 件家具`;
    meta.append(b, sm);
    const acts = document.createElement('div');
    acts.className = 'plan-acts';
    const mk = (label, fn, cls = '') => { const x = document.createElement('button'); x.type = 'button'; x.className = 'btn ' + cls; x.textContent = label; x.onclick = fn; acts.appendChild(x); };
    mk('載入', () => loadPlan(p.id), on ? '' : 'primary');
    mk('更新', () => overwritePlan(p.id));
    mk('改名', () => renamePlan(p.id), 'ghost');
    mk('刪除', () => deletePlan(p.id), 'ghost danger');
    row.append(img, meta, acts);
    box.appendChild(row);
  }
}
function openPlans() { renderPlans(); $('#planName').value = ''; $('#plansDlg').showModal(); }
$('#btnPlans').onclick = openPlans;
$('#planForm').addEventListener('submit', e => { e.preventDefault(); saveNewPlan($('#planName').value); $('#planName').value = ''; });

// ── 迴圈 ─────────────────────────────────────────────────
const clock = new THREE.Clock();
function loop() {
  const dt = Math.min(clock.getDelta(), 0.1);
  if (tween) {
    const t = Math.min(1, (performance.now() - tween.t0) / tween.dur), k = 1 - Math.pow(1 - t, 3);
    tween.c.position.lerpVectors(tween.p0, tween.p1, k);
    ctrl.target.lerpVectors(tween.g0, tween.g1, k);
    if (tween.c.isOrthographicCamera) { tween.c.zoom = tween.z0 + (tween.z1 - tween.z0) * k; tween.c.updateProjectionMatrix(); }
    if (t >= 1) tween = null;
  }
  if (mode === 'walk') updateWalk(dt); else ctrl.update();
  updateCutaway();
  renderer.render(scene, cam);
  labelRenderer.render(scene, cam);
  requestAnimationFrame(loop);
}

// ── 啟動 ─────────────────────────────────────────────────
async function init() {
  let list = null, fromShare = false;
  const m = location.hash.match(/#L=([\w-]+)/);
  if (m) { try { list = await decodeLayout(m[1]); fromShare = true; } catch { toast('分享連結無法讀取，改用本機配置'); } }
  if (!list) {
    try { const s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); if (s && Array.isArray(s.items)) {
      list = s.items.map(sanitize).filter(Boolean);
      // v2 新增餐廳吊燈：舊存檔自動補上
      if ((s.v || 1) < 2 && !list.some(it => it.type === 'pendant')) list.push(...defaultLayout().filter(it => it.type === 'pendant'));
      // v3 電視櫃改為懸空電視櫃：把原本的電視櫃換掉，電視移到櫃子上方
      if ((s.v || 1) < 3 && !list.some(it => it.type === 'tv_floating')) {
        const def = defaultLayout().find(it => it.type === 'tv_floating');
        const old = list.find(it => it.type === 'tv_cabinet');
        if (old) Object.assign(old, { type: 'tv_floating', w: def.w, d: def.d, h: def.h, elev: def.elev, color: def.color, color2: def.color2, name: def.name });
        else list.push(def);
        const top = (old || def).elev + def.h;
        list.filter(it => it.type === 'tv' && it.elev < top).forEach(it => { it.elev = top + 25; });
      }
      // v5 主臥衣櫃改為 IKEA BOAXEL 240cm，加入天花板軌道燈
      if ((s.v || 1) < 5) {
        const dl = defaultLayout();
        const old = list.find(it => (it.type === 'wardrobe_open' || it.type === 'wardrobe') && it.w >= 300);
        if (old) list[list.indexOf(old)] = dl.find(it => it.type === 'boaxel');
        if (!list.some(it => it.type === 'track_light')) list.push(...dl.filter(it => it.type === 'track_light'));
      }
      // v4 衣櫃改為開放式，並加入人形身高參考
      if ((s.v || 1) < 4) {
        const dl = defaultLayout();
        const wo = dl.find(it => it.type === 'wardrobe_open');
        const old = list.find(it => it.type === 'wardrobe' && it.w >= 300);
        if (old) {
          // 加深後保持背板貼牆（rot 270 時背面朝 +X）
          if (old.rot === 270) old.x = round1(old.x - (wo.d - old.d) / 2);
          Object.assign(old, { type: 'wardrobe_open', d: wo.d, color: wo.color, color2: wo.color2, name: wo.name });
        }
        if (!list.some(it => it.type === 'person')) list.push(dl.find(it => it.type === 'person'));
      }
    } } catch { /* 忽略 */ }
  }
  setItems(list || defaultLayout());
  commit(!fromShare ? true : false);
  if (fromShare) { toast('已載入分享的配置（修改後會存到你的瀏覽器）'); window.history.replaceState(null, "", location.pathname); }
  buildLibrary();
  document.body.classList.add('ready');
  loop();
}
init();
