// 家具庫：每個模型以基本幾何組成，原點在地面中心，正面朝 +Z，單位 cm。
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const mats = new Map();
export function mat(color, o = {}) {
  const key = color + '|' + JSON.stringify(o);
  if (!mats.has(key)) {
    mats.set(key, new THREE.MeshStandardMaterial({
      color, roughness: o.r ?? 0.75, metalness: o.m ?? 0,
      transparent: o.o != null, opacity: o.o ?? 1, depthWrite: o.o == null || o.o > 0.6,
      emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1,
      flatShading: !!o.flat, side: o.ds ? THREE.DoubleSide : THREE.FrontSide,
    }));
  }
  return mats.get(key);
}

export function shade(hex, f) {
  const c = new THREE.Color(hex);
  if (f < 0) c.lerp(new THREE.Color(0x000000), -f); else c.lerp(new THREE.Color(0xffffff), f);
  return '#' + c.getHexString();
}

// 盒子：y 為底面高度
function B(g, w, h, d, x, y, z, m, r = 0, shadow = true) {
  const mn = Math.min(w, h, d);
  const geo = r > 0 && mn > 1 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, mn / 2 - 0.05)) : new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = shadow; mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}
function C(g, rt, rb, h, x, y, z, m, seg = 24) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}
const METAL = () => mat('#b9bcbf', { r: 0.3, m: 0.8 });
const DARK = () => mat('#2b2b2d', { r: 0.6 });
const GROOVE = c => mat(shade(c, -0.35), { r: 0.9 });
const WHITE = () => mat('#fbfbfa', { r: 0.25 });
const GLASS = () => mat('#cfe6ee', { o: 0.25, r: 0.05, m: 0.1, ds: true });

// ── 建構函式 ──────────────────────────────────────────────
function sofa({ w, d, h, color, color2 }) {
  const g = new THREE.Group();
  const fab = mat(color, { r: 0.95 }), cush = mat(shade(color, 0.08), { r: 0.95 }), leg = mat(color2, { r: 0.5 });
  const legH = 10, baseH = 18, seatTop = 44;
  const arm = Math.min(18, w * 0.14), backD = Math.min(20, d * 0.26);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) C(g, 2, 1.5, legH, sx * (w / 2 - 7), 0, sz * (d / 2 - 7), leg, 10);
  B(g, w, baseH, d, 0, legH, 0, fab, 3);
  B(g, w, h - legH, backD, 0, legH, -d / 2 + backD / 2, fab, 5);
  for (const sx of [-1, 1]) B(g, arm, 62 - legH, d, sx * (w / 2 - arm / 2), legH, 0, fab, 6);
  const inner = w - 2 * arm, n = inner > 150 ? 3 : inner > 95 ? 2 : 1, cw = inner / n;
  for (let i = 0; i < n; i++) {
    const x = -inner / 2 + cw * (i + 0.5);
    B(g, cw - 1.5, seatTop - legH - baseH + 2, d - backD - 2, x, legH + baseH - 2, backD / 2 + 1, cush, 5);
    const bc = B(g, cw - 3, h - seatTop - 4, 15, x, seatTop - 2, -d / 2 + backD + 6, cush, 6);
    bc.rotation.x = -0.12;
  }
  return g;
}

function coffeeTable({ w, d, h, color }) {
  const g = new THREE.Group(), wood = mat(color, { r: 0.55 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 48), wood);
  top.scale.set(w, 1, d); top.position.y = h - 2; top.castShadow = top.receiveShadow = true; g.add(top);
  const shelf = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2, 48), wood);
  shelf.scale.set(w * 0.85, 1, d * 0.8); shelf.position.y = 12; shelf.castShadow = true; g.add(shelf);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) C(g, 1.8, 1.4, h - 4, sx * w * 0.27, 0, sz * d * 0.22, wood, 10);
  return g;
}

function sideTable({ w, d, h, color }) {
  const g = new THREE.Group(), wood = mat(color, { r: 0.55 }), r = Math.min(w, d) / 2;
  C(g, r, r, 3, 0, h - 3, 0, wood, 32);
  C(g, 2, 2, h - 3, 0, 0, 0, wood, 12);
  C(g, r * 0.6, r * 0.65, 2, 0, 0, 0, wood, 32);
  return g;
}

function tvCabinet({ w, d, h, color }) {
  const g = new THREE.Group(), wood = mat(color, { r: 0.6 }), gr = GROOVE(color);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 3, 8, 3, sx * (w / 2 - 6), 0, sz * (d / 2 - 5), DARK());
  B(g, w, h - 8, d, 0, 8, 0, wood, 1);
  const n = Math.max(2, Math.round(w / 60));
  for (let i = 1; i < n; i++) B(g, 0.6, h - 12, 0.4, -w / 2 + (w / n) * i, 10, d / 2 + 0.1, gr, 0, false);
  for (let i = 0; i < n; i++) B(g, 12, 1.2, 1.5, -w / 2 + (w / n) * (i + 0.5), h - 10, d / 2 + 0.6, METAL(), 0, false);
  return g;
}

// 懸空電視櫃：木作外框、清水模灰抽屜面板、中央開放木格（離地由 elev 控制）
function tvFloating({ w, d, h, color, color2 }) {
  const g = new THREE.Group(), wood = mat(color2, { r: 0.6 }), front = mat(color, { r: 0.85 });
  const t = 2.5, ih = h - 2 * t;
  B(g, w, t, d, 0, h - t, 0, wood, 0.5);
  B(g, w, t, d, 0, 0, 0, wood, 0.5);
  for (const s of [-1, 1]) B(g, t, ih, d, s * (w / 2 - t / 2), t, 0, wood);
  B(g, w - 2 * t, ih, 1.5, 0, t, -d / 2 + 0.75, mat(shade(color2, -0.12), { r: 0.7 }));
  const nw = Math.min(70, w * 0.22), sw = (w - 2 * t - nw) / 2;
  for (const s of [-1, 1]) B(g, 2, ih, d - 2, s * (nw / 2 + 1), t, 1, wood);
  const groove = mat('#4a4744', { r: 0.9 });
  for (const s of [-1, 1]) {
    const n = sw > 100 ? 2 : 1, pw = (sw - 2) / n;
    for (let i = 0; i < n; i++) {
      const x = s * (nw / 2 + 2 + pw * (i + 0.5));
      B(g, pw - 0.6, ih - 0.6, 2, x, t + 0.3, d / 2 - 1, front, 0.3);
      B(g, pw * 0.35, 0.8, 0.4, x, h - t - 3, d / 2 + 0.05, groove, 0, false);
    }
  }
  return g;
}

function tv({ w, d, h, color }) {
  const g = new THREE.Group();
  B(g, w * 0.3, 1.5, 22, 0, 0, 0, DARK());
  B(g, 6, 8, 3, 0, 1.5, -2, DARK());
  const body = mat(color, { r: 0.4, m: 0.3 });
  B(g, w, h, d, 0, 8, -2, body, 1);
  B(g, w - 2.5, h - 2.5, 0.4, 0, 9.25, -2 + d / 2 + 0.1, mat('#0b0e13', { r: 0.12, m: 0.5 }), 0, false);
  return g;
}

function rug({ w, d, h, color }) {
  const g = new THREE.Group();
  B(g, w, Math.max(h, 0.8), d, 0, 0, 0, mat(color, { r: 1 }), 0, false);
  B(g, w - 16, 0.2, d - 16, 0, Math.max(h, 0.8), 0, mat(shade(color, -0.08), { r: 1 }), 0, false);
  return g;
}
function rugRound({ w, d, h, color }) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, Math.max(h, 0.8), 48), mat(color, { r: 1 }));
  m.scale.set(w, 1, d); m.position.y = Math.max(h, 0.8) / 2; m.receiveShadow = true; g.add(m);
  const r2 = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.33, 48), mat(shade(color, -0.2), { r: 1 }));
  r2.rotation.x = -Math.PI / 2; r2.scale.set(w, d, 1); r2.position.y = Math.max(h, 0.8) + 0.1; g.add(r2);
  return g;
}

function floorLamp({ w, h, color }) {
  const g = new THREE.Group(), r = w / 2;
  C(g, r * 0.6, r * 0.65, 2.5, 0, 0, 0, DARK(), 24);
  C(g, 1, 1, h - 30, 0, 2.5, 0, METAL(), 10);
  const shadeM = mat(color, { r: 0.9, e: '#ffe9c2', ei: 0.55 });
  C(g, r * 0.65, r, 30, 0, h - 32, 0, shadeM, 32);
  return g;
}

function bookshelf({ w, d, h, color }) {
  const g = new THREE.Group(), wood = mat(color, { r: 0.6 }), t = 2;
  B(g, t, h, d, -w / 2 + t / 2, 0, 0, wood); B(g, t, h, d, w / 2 - t / 2, 0, 0, wood);
  B(g, w, t, d, 0, h - t, 0, wood); B(g, w, 6, d, 0, 0, 0, wood);
  B(g, w - 2 * t, h - 8, 1, 0, 6, -d / 2 + 0.5, mat(shade(color, -0.12)));
  const shelves = Math.max(2, Math.round((h - 8) / 36));
  const sh = (h - 6 - t) / shelves;
  const pal = ['#8c6d5a', '#5d7287', '#c9b79c', '#7a8a6b', '#b55d4c', '#e4dccd', '#3e4a59'];
  let k = 3;
  for (let s = 0; s < shelves; s++) {
    const y = 6 + s * sh;
    if (s > 0) B(g, w - 2 * t, t, d - 1, 0, y - t, 0.5, wood);
    let x = -w / 2 + t + 1;
    while (x < w / 2 - t - 6) {
      k = (k * 7 + 3) % 97;
      const bw = 2 + (k % 4), bh = Math.min(sh - 6, 18 + (k % 9));
      if (x + bw > w / 2 - t - 1) break;
      if (k % 11 !== 0) B(g, bw, bh, d * 0.7, x + bw / 2, y, 0, mat(pal[k % pal.length], { r: 0.8 }), 0, false);
      x += bw + 0.3 + (k % 13 === 0 ? 8 : 0);
    }
  }
  return g;
}

function plant({ w, h }) {
  const g = new THREE.Group();
  const pr = w * 0.32, ph = Math.min(h * 0.32, 40);
  C(g, pr, pr * 0.78, ph, 0, 0, 0, mat('#e3ddd1', { r: 0.8 }), 24);
  C(g, pr * 0.92, pr * 0.92, 1, 0, ph - 2, 0, mat('#5b4a3a', { r: 1 }), 24);
  const leaf = [mat('#5f8a4e', { r: 0.8, flat: true }), mat('#4d7740', { r: 0.8, flat: true }), mat('#76a05f', { r: 0.8, flat: true })];
  const fh = h - ph, R = w / 2;
  const pts = [[0, 0.55, 0, 0.55], [0.35, 0.4, 0.2, 0.42], [-0.3, 0.45, -0.25, 0.42], [0.1, 0.8, -0.2, 0.4], [-0.2, 0.3, 0.3, 0.38], [0.25, 0.7, 0.3, 0.33]];
  pts.forEach(([x, y, z, s], i) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(R * s, 0), leaf[i % 3]);
    m.position.set(x * R, ph + y * fh, z * R); m.scale.y = (fh / R) * 0.55; m.rotation.y = i;
    m.castShadow = true; g.add(m);
  });
  C(g, 1.2, 1.5, fh * 0.6, 0, ph - 2, 0, mat('#6b5440'), 6);
  return g;
}

function bed({ w, d, h, color, color2 }) {
  const g = new THREE.Group(), wood = mat(color, { r: 0.6 });
  const linen = mat(color2, { r: 0.95 }), white = mat('#f7f5f0', { r: 0.95 });
  B(g, w, 28, d, 0, 0, 0, wood, 2);
  B(g, w - 6, 22, d - 12, 0, 26, 4, white, 6);
  B(g, w - 2, 5, d * 0.64, 0, 46, d / 2 - d * 0.32 - 3, linen, 2.4);
  B(g, w + 1, 5.5, d * 0.16, 0, 46.2, d / 2 - d * 0.2, mat(shade(color2, -0.35), { r: 0.95 }), 2.4);
  const n = w >= 140 ? 2 : 1, pw = (w - 20) / n;
  for (let i = 0; i < n; i++) B(g, pw - 6, 12, 38, -w / 2 + 10 + pw * (i + 0.5), 47, -d / 2 + 34, white, 5);
  B(g, w, h, 8, 0, 0, -d / 2 + 4, wood, 1.5);
  B(g, w - 10, h - 40, 3, 0, 34, -d / 2 + 9, mat(shade(color2, -0.1), { r: 1 }), 1.2);
  return g;
}

function cabinet({ w, d, h, color }, doorW = 50) {
  const g = new THREE.Group(), body = mat(color, { r: 0.6 }), gr = GROOVE(color);
  B(g, w, h, d, 0, 0, 0, body, 0.8);
  B(g, w - 1, 6, 0.4, 0, 0, d / 2 + 0.1, mat(shade(color, -0.25)), 0, false);
  const n = Math.max(1, Math.round(w / doorW));
  for (let i = 1; i < n; i++) B(g, 0.6, h - 8, 0.4, -w / 2 + (w / n) * i, 7, d / 2 + 0.1, gr, 0, false);
  if (h > 150) B(g, w - 1, 0.6, 0.4, 0, h - 45, d / 2 + 0.1, gr, 0, false);
  const hy = h > 150 ? Math.min(100, h * 0.47) : h * 0.6;
  for (let i = 0; i < n; i++) {
    const side = n === 1 ? 0.35 : (i % 2 === 0 ? 0.42 : -0.42);
    const x = -w / 2 + (w / n) * (i + 0.5) + side * (w / n);
    B(g, 1.4, Math.min(22, h * 0.15), 1.4, x, hy - Math.min(11, h * 0.075), d / 2 + 0.8, METAL(), 0, false);
  }
  return g;
}

// 開放式衣櫃：木作框架，吊掛區（吊桿＋衣物）與層板區交替
function wardrobeOpen({ w, d, h, color, color2 }) {
  const g = new THREE.Group(), wood = mat(color, { r: 0.6 }), back = mat(color2, { r: 0.85 }), t = 2.5;
  B(g, w, 8, d - 2, 0, 0, -1, mat(shade(color, -0.3)));
  B(g, w, t, d, 0, 8, 0, wood);
  B(g, w, t, d, 0, h - t, 0, wood, 0.5);
  B(g, w - 2 * t, h - 8 - t, 1.2, 0, 8, -d / 2 + 0.6, back);
  const n = Math.max(1, Math.round(w / 90)), sw = (w - t) / n;
  for (let i = 0; i <= n; i++) B(g, t, h - 8 - t, d, -w / 2 + t / 2 + sw * i, 8, 0, wood);
  const clothes = ['#e9e4da', '#c9b8a3', '#7d8a96', '#3f4650', '#b9a089', '#f4f1ea', '#8c6d5a', '#a7b2a0'];
  const metal = mat('#b9bcbf', { r: 0.3, m: 0.8 });
  let k = 5;
  for (let i = 0; i < n; i++) {
    const x0 = -w / 2 + t + sw * i, iw = sw - t, cx = x0 + iw / 2;
    const shelvesOnly = n >= 3 && i === Math.floor(n / 2);
    // 頂部收納層板
    B(g, iw, t, d - 2, cx, h - 40, 1, wood);
    if (shelvesOnly) {
      for (let y = 8 + t + 36; y < h - 50; y += 36) {
        B(g, iw, t, d - 2, cx, y, 1, wood);
        k = (k * 7 + 3) % 97;
        B(g, iw * 0.7, 8 + (k % 6), d * 0.6, cx, y + t, 2, mat(clothes[k % clothes.length], { r: 1 }), 2);
      }
      continue;
    }
    // 下方抽屜
    B(g, iw - 1, 26, d - 3, cx, 8 + t, 0.5, wood, 0.5);
    B(g, iw - 1, 0.6, 0.4, cx, 8 + t + 13, d / 2 - 0.8, mat(shade(color, -0.35)), 0, false);
    B(g, iw, t, d - 2, cx, 8 + t + 26, 1, wood);
    // 吊桿與衣物
    const ry = h - 48;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, iw, 12), metal);
    rod.rotation.z = Math.PI / 2; rod.position.set(cx, ry, 0); g.add(rod);
    const count = Math.max(2, Math.floor((iw - 6) / 5));
    for (let c = 0; c < count; c++) {
      k = (k * 7 + 3) % 97;
      const len = 70 + (k % 5) * 12, x = x0 + 4 + c * ((iw - 8) / (count - 1 || 1));
      B(g, 1.6, len, d * 0.82, x, ry - len - 2, 0, mat(clothes[k % clothes.length], { r: 1 }), 0.6);
    }
  }
  return g;
}

// 人形：身高參考
function person({ w, d, h, color }) {
  const g = new THREE.Group(), m = mat(color, { r: 0.7 }), s = h / 170;
  for (const sx of [-1, 1]) C(g, 5.5 * s, 4.5 * s, 82 * s, sx * 9 * s, 0, 0, m, 14);
  B(g, Math.min(w, 38 * s), 58 * s, Math.min(d, 22 * s), 0, 80 * s, 0, m, 9 * s);
  for (const sx of [-1, 1]) {
    const arm = C(g, 3.8 * s, 3.2 * s, 62 * s, sx * 22 * s, 76 * s, 0, m, 12);
    arm.rotation.z = sx * 0.06;
  }
  C(g, 4.5 * s, 5 * s, 8 * s, 0, 137 * s, 0, m, 12);
  const head = new THREE.Mesh(new THREE.SphereGeometry(11 * s, 24, 18), m);
  head.scale.y = 1.15; head.position.y = h - 12.5 * s; head.castShadow = true; g.add(head);
  return g;
}

function drawers({ w, d, h, color }, rows) {
  const g = new THREE.Group(), body = mat(color, { r: 0.6 }), gr = GROOVE(color);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) C(g, 1.5, 1.2, 8, sx * (w / 2 - 4), 0, sz * (d / 2 - 4), body, 8);
  B(g, w, h - 8, d, 0, 8, 0, body, 1);
  const rh = (h - 10) / rows;
  for (let i = 1; i < rows; i++) B(g, w - 2, 0.6, 0.4, 0, 9 + rh * i, d / 2 + 0.1, gr, 0, false);
  for (let i = 0; i < rows; i++) B(g, Math.min(14, w * 0.3), 1.2, 1.4, 0, 9 + rh * (i + 0.5), d / 2 + 0.6, METAL(), 0, false);
  return g;
}

function diningTable({ w, d, h, color }) {
  const g = new THREE.Group(), wood = mat(color, { r: 0.55 });
  B(g, w, 4, d, 0, h - 4, 0, wood, 1);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 4, h - 4, 4, sx * (w / 2 - 6), 0, sz * (d / 2 - 6), wood);
  B(g, w - 14, 6, 2, 0, h - 10, d / 2 - 6, wood); B(g, w - 14, 6, 2, 0, h - 10, -d / 2 + 6, wood);
  return g;
}
function roundTable({ w, d, h, color }) {
  const g = new THREE.Group(), wood = mat(color, { r: 0.55 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 48), wood);
  top.scale.set(w, 1, d); top.position.y = h - 2; top.castShadow = top.receiveShadow = true; g.add(top);
  C(g, 3.5, 4, h - 4, 0, 0, 0, wood, 16);
  C(g, w * 0.25, w * 0.27, 2.5, 0, 0, 0, wood, 32);
  return g;
}

function chair({ w, d, h, color, color2 }) {
  const g = new THREE.Group(), wood = mat(color, { r: 0.55 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 3, 44, 3, sx * (w / 2 - 3), 0, sz * (d / 2 - 3), wood);
  B(g, w, 4, d, 0, 43, 0, wood, 1);
  B(g, w - 5, 3, d - 7, 0, 47, 1.5, mat(color2, { r: 0.95 }), 1.2);
  for (const sx of [-1, 1]) B(g, 3, h - 47, 3, sx * (w / 2 - 3), 47, -d / 2 + 2, wood);
  B(g, w, 12, 2.5, 0, h - 14, -d / 2 + 2, wood, 1);
  return g;
}

function officeChair({ w, d, h, color }) {
  const g = new THREE.Group(), m = mat(color, { r: 0.85 }), base = DARK();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2, s = B(g, w * 0.42, 3, 4, Math.sin(a) * w * 0.21, 4, Math.cos(a) * w * 0.21, base);
    s.rotation.y = a + Math.PI / 2;
    C(g, 2.5, 2.5, 4, Math.sin(a) * w * 0.42, 0, Math.cos(a) * w * 0.42, base, 10);
  }
  C(g, 2.5, 2.5, 36, 0, 6, 0, METAL(), 12);
  B(g, w * 0.82, 8, d * 0.78, 0, 42, 2, m, 4);
  const back = B(g, w * 0.78, h - 58, 6, 0, 56, -d * 0.36, m, 3);
  back.rotation.x = -0.08;
  B(g, 4, 14, 4, 0, 46, -d * 0.36, base);
  return g;
}

function counter({ w, d, h, color, color2 }, withSink = true) {
  const g = new THREE.Group(), cab = mat(color, { r: 0.55 }), top = mat(color2, { r: 0.35 }), gr = GROOVE(color);
  B(g, w, 10, d - 6, 0, 0, -3, mat(shade(color, -0.4)));
  B(g, w, h - 14, d - 2, 0, 10, -1, cab);
  B(g, w, 4, d, 0, h - 4, 0, top, 0.5);
  const n = Math.max(1, Math.round(w / 60));
  for (let i = 1; i < n; i++) B(g, 0.6, h - 18, 0.4, -w / 2 + (w / n) * i, 12, d / 2 - 1.8, gr, 0, false);
  for (let i = 0; i < n; i++) B(g, 12, 1.2, 1.4, -w / 2 + (w / n) * (i + 0.5), h - 12, d / 2 - 1.2, METAL(), 0, false);
  if (withSink) {
    const sx = w * 0.3, sw = Math.min(55, w * 0.3);
    B(g, sw, 0.6, d * 0.62, sx, h, 2, mat('#9aa0a6', { r: 0.25, m: 0.8 }), 0, false);
    B(g, sw - 6, 0.7, d * 0.62 - 6, sx, h, 2, mat('#6e7378', { r: 0.3, m: 0.8 }), 0, false);
    C(g, 1.3, 1.5, 26, sx, h, -d / 2 + 7, METAL(), 12);
    B(g, 2, 2, 14, sx, h + 24, -d / 2 + 13, METAL(), 0.8);
    const kx = -w * 0.28, kw = Math.min(60, w * 0.32);
    B(g, kw, 0.8, d * 0.75, kx, h, 1, mat('#1d1f22', { r: 0.15, m: 0.3 }), 0, false);
    for (const o of [-1, 1]) C(g, 8, 8, 0.6, kx + o * kw * 0.25, h + 0.8, 1, mat('#55595e', { r: 0.4, m: 0.6 }), 24);
  }
  return g;
}

function fridge({ w, d, h, color }) {
  const g = new THREE.Group(), m = mat(color, { r: 0.35, m: 0.4 });
  B(g, w, h, d, 0, 0, 0, m, 2.5);
  B(g, w - 2, 0.7, 0.4, 0, h * 0.62, d / 2 + 0.05, mat('#151515'), 0, false);
  B(g, 0.6, h * 0.62 - 4, 0.4, 0, 4, d / 2 + 0.05, mat('#151515'), 0, false);
  B(g, 2, 28, 3, -3, h * 0.62 + 6, d / 2 + 1, METAL());
  for (const o of [-1, 1]) B(g, 2, 26, 3, o * 3.5, h * 0.62 - 34, d / 2 + 1, METAL());
  return g;
}

function appliance({ w, d, h, color }) {
  const g = new THREE.Group(), m = mat(color, { r: 0.28, m: 0.75 });
  B(g, w, h, d, 0, 0, 0, m, 1);
  B(g, w - 4, h * 0.6, 0.5, 0, h * 0.12, d / 2 + 0.1, mat('#2a2d31', { r: 0.2, m: 0.4, o: 0.9 }), 0, false);
  B(g, w * 0.6, 2, 2, 0, h * 0.78, d / 2 + 0.8, METAL());
  B(g, w - 4, 6, 0.5, 0, h - 9, d / 2 + 0.1, mat('#1a1a1a'), 0, false);
  return g;
}

function washer({ w, d, h, color }) {
  const g = new THREE.Group(), m = mat(color, { r: 0.35 });
  B(g, w, h, d, 0, 0, 0, m, 3);
  const r = Math.min(w, h) * 0.3;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(r + 2.5, r + 2.5, 3, 32), METAL());
  ring.rotation.x = Math.PI / 2; ring.position.set(0, h * 0.45, d / 2 + 0.5); g.add(ring);
  const gl = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 3.4, 32), mat('#2c3b47', { r: 0.1, m: 0.3 }));
  gl.rotation.x = Math.PI / 2; gl.position.set(0, h * 0.45, d / 2 + 0.6); g.add(gl);
  B(g, w - 6, 8, 0.6, 0, h - 12, d / 2, mat('#d9dadb'), 0, false);
  C(g, 2.5, 2.5, 1.5, w * 0.28, h - 8, d / 2 + 0.2, METAL(), 16).rotation.x = Math.PI / 2;
  return g;
}

function toilet({ w, d, h, color }) {
  const g = new THREE.Group(), m = mat(color, { r: 0.18 });
  const tankD = 18;
  B(g, w, h - 38, tankD, 0, 38, -d / 2 + tankD / 2, m, 3);
  B(g, w + 1, 2, tankD + 1, 0, h - 1, -d / 2 + tankD / 2, m, 1);
  const bd = d - tankD + 2, bz = -d / 2 + tankD - 2 + bd / 2;
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.38, 38, 32), m);
  bowl.scale.set(w * 0.95, 1, bd); bowl.position.set(0, 19, bz); bowl.castShadow = bowl.receiveShadow = true; g.add(bowl);
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.5, 32), mat('#ffffff', { r: 0.3 }));
  seat.scale.set(w, 1, bd); seat.position.set(0, 39.5, bz); seat.castShadow = true; g.add(seat);
  return g;
}

function vanity({ w, d, h, color }) {
  const g = new THREE.Group(), cab = mat(color, { r: 0.6 }), white = WHITE();
  B(g, w, h - 3 - 18, d - 2, 0, 18, -1, cab, 0.8);
  B(g, w - 2, 0.5, 0.4, 0, (h + 18) / 2 - 2, d / 2 - 1.9, GROOVE(color), 0, false);
  B(g, w, 3, d, 0, h - 3, 0, white, 0.5);
  B(g, Math.min(48, w * 0.65), 12, d * 0.62, 0, h, 2, white, 4);
  B(g, Math.min(40, w * 0.55), 0.6, d * 0.5, 0, h + 11.6, 2, mat('#d7dde0', { r: 0.1 }), 0, false);
  C(g, 1.2, 1.4, 22, 0, h, -d / 2 + 4, METAL(), 12);
  B(g, 2, 2, 10, 0, h + 20, -d / 2 + 8, METAL(), 0.8);
  B(g, w * 0.8, 70, 1.5, 0, h + 30, -d / 2 + 0.75, mat('#dfe7ea', { r: 0.05, m: 0.9 }), 0.5);
  return g;
}

function shower({ w, d, h }) {
  const g = new THREE.Group(), glass = GLASS(), metal = METAL();
  B(g, w, 4, d, 0, 0, 0, mat('#e9e9e7', { r: 0.4 }), 1);
  B(g, w * 0.55, h - 6, 0.8, -w * 0.225, 4, d / 2 - 0.4, glass, 0, false);
  B(g, 0.8, h - 6, d, w / 2 - 0.4, 4, 0, glass, 0, false);
  B(g, w, 1.5, 1.5, 0, h - 2, d / 2 - 0.4, metal, 0, false);
  B(g, 1.5, 1.5, d, w / 2 - 0.4, h - 2, 0, metal, 0, false);
  C(g, 1, 1, h - 10, -w / 2 + 5, 4, -d / 2 + 3, metal, 10);
  C(g, 9, 9, 1.5, -w / 2 + 14, h - 10, -d / 2 + 14, metal, 24);
  B(g, 1.5, 1.5, 12, -w / 2 + 5, h - 10, -d / 2 + 9, metal, 0, false);
  return g;
}

function bathtub({ w, d, h, color }) {
  const g = new THREE.Group(), m = mat(color, { r: 0.18 });
  B(g, w, h, d, 0, 0, 0, m, 5);
  B(g, w - 12, 0.8, d - 12, 0, h - 5, 0, mat('#bfe0ea', { r: 0.05, o: 0.85 }), 3, false);
  C(g, 1.2, 1.2, 12, -w / 2 + 4, h, 0, METAL(), 12);
  return g;
}

function desk({ w, d, h, color }) {
  const g = new THREE.Group(), wood = mat(color, { r: 0.55 });
  B(g, w, 3, d, 0, h - 3, 0, wood, 0.8);
  for (const sx of [-1, 1]) B(g, 3, h - 3, d - 2, sx * (w / 2 - 1.5), 0, 0, wood);
  B(g, w - 6, 30, 1.5, 0, h - 33, -d / 2 + 3, wood);
  B(g, 40, 14, d - 6, w / 2 - 23, h - 17, 0, wood);
  B(g, 12, 1.2, 1.4, w / 2 - 23, h - 10, d / 2 - 2.3, METAL(), 0, false);
  return g;
}

function island(o) { return counter(o, false); }

function pendant({ w, d, h, color, elev }) {
  const g = new THREE.Group(), r = w / 2;
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat(color, { r: 0.22, m: 0.05, ds: true }));
  shell.scale.set(r, h, d / 2); shell.castShadow = true; g.add(shell);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(1, 48), mat('#fff6e6', { r: 0.9, e: '#ffe4b8', ei: 1.1 }));
  glow.rotation.x = Math.PI / 2; glow.scale.set(r * 0.94, d / 2 * 0.94, 1); glow.position.y = 0.4; g.add(glow);
  const top = h;
  const cord = Math.max(5, (CEIL_H - (elev || 0)) - top);
  C(g, 0.35, 0.35, cord, 0, top, 0, mat('#f2f2f2', { r: 0.5 }), 6).castShadow = false;
  C(g, 5, 5, 1.5, 0, top + cord - 1.5, 0, mat('#f2f2f2', { r: 0.5 }), 24).castShadow = false;
  const light = new THREE.PointLight('#ffd7a3', 0.9, 260, 0);
  light.position.y = -6; g.add(light);
  return g;
}


// ── 目錄 ────────────────────────────────────────────────
export const CEIL_H = 278;
export const CATEGORIES = ['客廳', '臥室', '餐廚', '衛浴', '收納', '燈具', '書房・其他'];

export const CATALOG = {
  sofa:          { name: '三人沙發', cat: '客廳', w: 240, d: 85, h: 80, color: '#e6ddcd', color2: '#6b4f36', build: sofa },
  armchair:      { name: '單人沙發', cat: '客廳', w: 85, d: 82, h: 80, color: '#cdbfa8', color2: '#6b4f36', build: sofa },
  coffee_table:  { name: '茶几', cat: '客廳', w: 100, d: 50, h: 40, color: '#c49a6c', build: coffeeTable },
  side_table:    { name: '邊几', cat: '客廳', w: 45, d: 45, h: 50, color: '#c49a6c', build: sideTable },
  tv_floating:   { name: '懸空電視櫃', cat: '客廳', w: 280, d: 40, h: 40, elev: 25, color: '#bdbab4', color2: '#a8835e', build: tvFloating },
  tv_cabinet:    { name: '電視櫃', cat: '客廳', w: 200, d: 40, h: 45, color: '#c49a6c', build: tvCabinet },
  tv:            { name: '電視 65吋', cat: '客廳', w: 145, d: 6, h: 84, color: '#1d1d1f', build: tv },
  rug:           { name: '地毯', cat: '客廳', w: 200, d: 140, h: 1, color: '#e9e2d6', build: rug },
  rug_round:     { name: '圓地毯', cat: '客廳', w: 120, d: 120, h: 1, color: '#c8b59a', build: rugRound },
  pendant:       { name: '吊燈', cat: '燈具', w: 50, d: 50, h: 15, elev: 150, color: '#e8692a', build: pendant },
  floor_lamp:    { name: '立燈', cat: '燈具', w: 40, d: 40, h: 160, color: '#f3ead8', build: floorLamp },
  bed_queen:     { name: '雙人床 6尺', cat: '臥室', w: 182, d: 190, h: 100, color: '#c49a6c', color2: '#9a8471', build: bed },
  bed_double:    { name: '雙人床 5尺', cat: '臥室', w: 152, d: 188, h: 95, color: '#c49a6c', color2: '#b7a48f', build: bed },
  bed_single:    { name: '單人床', cat: '臥室', w: 105, d: 188, h: 90, color: '#c49a6c', color2: '#e3d6c3', build: bed },
  wardrobe_open: { name: '開放式衣櫃', cat: '臥室', w: 180, d: 55, h: 215, color: '#b08d68', color2: '#ece7df', build: wardrobeOpen },
  wardrobe:      { name: '衣櫃（有門）', cat: '臥室', w: 180, d: 60, h: 215, color: '#c9a37a', build: o => cabinet(o, 50) },
  nightstand:    { name: '床頭櫃', cat: '臥室', w: 45, d: 40, h: 50, color: '#c49a6c', build: o => drawers(o, 2) },
  dresser:       { name: '斗櫃', cat: '臥室', w: 100, d: 45, h: 85, color: '#c49a6c', build: o => drawers(o, 4) },
  dining_table:  { name: '餐桌', cat: '餐廚', w: 120, d: 60, h: 75, color: '#c49a6c', build: diningTable },
  round_table:   { name: '圓餐桌', cat: '餐廚', w: 90, d: 90, h: 75, color: '#c49a6c', build: roundTable },
  chair:         { name: '餐椅', cat: '餐廚', w: 45, d: 50, h: 82, color: '#b8875a', color2: '#e8e0d2', build: chair },
  counter:       { name: '廚具（水槽・爐台）', cat: '餐廚', w: 240, d: 60, h: 88, color: '#f1eee8', color2: '#dedad3', build: counter },
  island:        { name: '中島', cat: '餐廚', w: 150, d: 80, h: 90, color: '#c49a6c', color2: '#efece6', build: island },
  fridge:        { name: '冰箱', cat: '餐廚', w: 80, d: 70, h: 185, color: '#3a3a3c', build: fridge },
  appliance:     { name: '電器櫃', cat: '餐廚', w: 70, d: 65, h: 95, color: '#c3c7cb', build: appliance },
  toilet:        { name: '馬桶', cat: '衛浴', w: 40, d: 68, h: 75, color: '#ffffff', build: toilet },
  vanity:        { name: '浴櫃洗手台', cat: '衛浴', w: 70, d: 45, h: 85, color: '#c9a37a', build: vanity },
  shower:        { name: '淋浴間', cat: '衛浴', w: 80, d: 80, h: 200, color: '#e9e9e7', build: shower },
  bathtub:       { name: '浴缸', cat: '衛浴', w: 150, d: 75, h: 55, color: '#fafafa', build: bathtub },
  washer:        { name: '洗衣機', cat: '衛浴', w: 60, d: 60, h: 85, color: '#f5f5f4', build: washer },
  cabinet_tall:  { name: '高櫃', cat: '收納', w: 100, d: 45, h: 215, color: '#ece7df', build: o => cabinet(o, 45) },
  shoe_cabinet:  { name: '鞋櫃', cat: '收納', w: 120, d: 40, h: 110, color: '#ece7df', build: o => cabinet(o, 45) },
  shelf_thin:    { name: '薄櫃', cat: '收納', w: 100, d: 20, h: 232, color: '#ece7df', build: o => cabinet(o, 45) },
  bookshelf:     { name: '書櫃', cat: '收納', w: 80, d: 30, h: 180, color: '#c49a6c', build: bookshelf },
  desk:          { name: '書桌', cat: '書房・其他', w: 120, d: 60, h: 75, color: '#c49a6c', build: desk },
  office_chair:  { name: '辦公椅', cat: '書房・其他', w: 60, d: 60, h: 95, color: '#45474b', build: officeChair },
  person:        { name: '人形（身高參考）', cat: '書房・其他', w: 50, d: 28, h: 170, color: '#9aa7b4', build: person },
  plant:         { name: '盆栽', cat: '書房・其他', w: 45, d: 45, h: 110, color: '#5f8a4e', build: plant },
};

export function buildFurniture(it) {
  const def = CATALOG[it.type];
  const o = { w: it.w, d: it.d, h: it.h, elev: it.elev || 0, color: it.color || def.color, color2: it.color2 || def.color2 || '#888888' };
  const g = def.build(o);
  g.traverse(m => { if (m.isMesh) m.userData.fid = it.id; });
  return g;
}
