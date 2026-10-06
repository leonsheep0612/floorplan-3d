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

// 可調款式的沙發（尺寸參考 IKEA 台灣官網）
// s: arm 扶手寬、armH 扶手高、legH 腳高、seatH 座高、backD 椅背厚、n 座墊數、backCush 是否有背墊、leather、metalLeg、round
function sofaStyled(o, s) {
  const { w, d, h, color, color2 } = o;
  const g = new THREE.Group();
  const rr = s.leather ? 0.42 : 0.95;
  const fab = mat(color, { r: rr }), cush = mat(shade(color, s.leather ? 0.05 : 0.08), { r: rr - 0.04 });
  const leg = mat(color2, { r: 0.45, m: s.metalLeg ? 0.75 : 0 });
  const legH = s.legH ?? 10, seatH = s.seatH ?? 44, round = s.round ?? 5;
  const arm = Math.min(s.arm ?? 18, w * 0.15), armH = Math.min(s.armH ?? 62, h), backD = Math.min(s.backD ?? 20, d * 0.3);
  const cushT = 13, baseH = Math.max(6, seatH - legH - cushT);
  if (legH > 3) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const l = C(g, s.metalLeg ? 1 : 2, s.metalLeg ? 0.8 : 1.4, legH, sx * (w / 2 - 8), 0, sz * (d / 2 - 8), leg, 10);
      if (s.splay) { l.rotation.z = sx * 0.22; l.rotation.x = -sz * 0.22; }
      else if (!s.metalLeg) l.rotation.z = sx * 0.08;
    }
  }
  B(g, w, baseH, d, 0, legH, 0, fab, Math.min(round, 3));
  const backTop = s.backFrame ? h * s.backFrame : h;
  B(g, w, backTop - legH, backD, 0, legH, -d / 2 + backD / 2, fab, round);
  for (const sx of [-1, 1]) {
    if (s.rollArm) {
      // 圓弧扶手：下方方塊＋上緣半圓捲邊
      const rr = arm / 2;
      B(g, arm, armH - legH - rr, d, sx * (w / 2 - rr), legH, 0, fab, round);
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, d - 2, 28), fab);
      roll.rotation.x = Math.PI / 2; roll.position.set(sx * (w / 2 - rr), armH - rr, 0); roll.castShadow = true; g.add(roll);
      for (const sz of [-1, 1]) { const cap = new THREE.Mesh(new THREE.SphereGeometry(rr, 20, 12), fab); cap.scale.z = 0.35; cap.position.set(sx * (w / 2 - rr), armH - rr, sz * (d / 2 - 1)); g.add(cap); }
    } else B(g, arm, armH - legH, d, sx * (w / 2 - arm / 2), legH, 0, fab, round);
  }
  const inner = w - 2 * arm;
  const n = s.n ?? (inner > 150 ? 3 : inner > 95 ? 2 : 1), cw = inner / n;
  for (let i = 0; i < n; i++) {
    const x = -inner / 2 + cw * (i + 0.5);
    B(g, cw - 1.2, cushT + 2, d - backD - 2, x, legH + baseH - 2, backD / 2 + 1, cush, Math.min(round, 5));
  }
  if (s.backCush !== false) {
    // 背墊數可與座墊數不同（例如兩座墊三頭枕）
    const bn = s.backN ?? n, bw = inner / bn;
    for (let i = 0; i < bn; i++) {
      const x = -inner / 2 + bw * (i + 0.5);
      const bc = B(g, bw - 3, Math.max(10, h - seatH - 2), 15, x, seatH - 1, -d / 2 + backD + (s.backFrame ? -2 : 6), cush, 6);
      bc.rotation.x = -0.12;
    }
  }
  return g;
}
const sofaDef = (name, w, d, h, color, color2, s) => ({ name, cat: '沙發', w, d, h, color, color2, build: o => sofaStyled(o, s) });

// IKEA BOAXEL 壁掛式開放衣櫃：壁條＋支撐架＋層板／吊衣桿／網眼網籃，每格約 60cm
function boaxel({ w, d, h, color }) {
  const g = new THREE.Group();
  const metal = mat(color, { r: 0.4, m: 0.3 });
  const wire = mat(color, { r: 0.4, m: 0.3, o: 0.55 });
  const n = Math.max(1, Math.round(w / 60)), bw = w / n;
  const clothes = ['#e9e4da', '#c9b8a3', '#7d8a96', '#3f4650', '#b9a089', '#f4f1ea', '#8c6d5a', '#a7b2a0', '#d8c8b2'];
  let k = 11;
  const pick = () => { k = (k * 7 + 3) % 97; return k; };
  // 頂部安裝桿與壁條
  B(g, w, 3, 1.5, 0, h - 3, -d / 2 + 0.75, metal, 0, false);
  for (let i = 0; i <= n; i++) B(g, 2.5, h - 8, 1.2, -w / 2 + bw * i + (i === 0 ? 1.25 : i === n ? -1.25 : 0), 5, -d / 2 + 0.6, metal, 0, false);
  const brackets = y => { for (let i = 0; i <= n; i++) B(g, 1.2, 3, d - 2, -w / 2 + bw * i + (i === 0 ? 1 : i === n ? -1 : 0), y - 3, 0, metal, 0, false); };
  const shelf = (x, y, wid) => B(g, wid, 1.8, d - 1, x, y, 0.5, metal, 0.3);
  const rail = (x, y, wid) => { const r = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, wid, 10), metal); r.rotation.z = Math.PI / 2; r.position.set(x, y, 2); g.add(r); };
  const hang = (x0, wid, top, len) => {
    const cnt = Math.max(2, Math.floor((wid - 6) / 4.5));
    for (let c = 0; c < cnt; c++) {
      const l = len - (pick() % 4) * 7, x = x0 + 3 + c * ((wid - 6) / (cnt - 1));
      B(g, 1.6, l, d * 0.8, x, top - l - 2, 2, mat(clothes[pick() % clothes.length], { r: 1 }), 0.6);
    }
  };
  const basket = (x, y, wid, bh) => {
    B(g, wid - 2, bh, d - 4, x, y, 1, wire, 0.5, false);
    B(g, wid - 6, bh * 0.6, d - 10, x, y + 1, 1, mat(clothes[pick() % clothes.length], { r: 1 }), 1);
  };
  const folded = (x, y, wid) => { const c = mat(clothes[pick() % clothes.length], { r: 1 }); B(g, Math.min(30, wid * 0.55), 6 + (k % 5), d * 0.65, x, y + 1.8, 2, c, 1.5); };
  const topY = h - 8;
  brackets(topY);
  for (let i = 0; i < n; i++) {
    const x0 = -w / 2 + bw * i + 1.5, wid = bw - 3, cx = x0 + wid / 2;
    shelf(cx, topY, wid); folded(cx, topY, wid);
    const kind = n === 1 ? 0 : [0, 1, 2, 0][i % 4];
    if (kind === 0) {           // 長版吊掛
      rail(cx, topY - 6, wid); hang(x0, wid, topY - 6, 118);
    } else if (kind === 1) {    // 上下兩層吊掛
      rail(cx, topY - 6, wid); hang(x0, wid, topY - 6, 72);
      rail(cx, 98, wid); hang(x0, wid, 98, 66);
    } else {                    // 層板＋網籃
      for (const y of [150, 120]) { shelf(cx, y, wid); folded(cx, y, wid); }
      for (const y of [15, 45, 75]) basket(cx, y, wid, 24);
    }
  }
  brackets(150); brackets(120);
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

// 天花板軌道燈：吸頂軌道＋可調角度投射燈頭（elev 預設貼齊天花板）
function trackLight({ w, d, h, color }) {
  const g = new THREE.Group(), body = mat(color, { r: 0.45 }), lens = mat('#fff3dc', { r: 0.4, e: '#ffe2b0', ei: 1.4 });
  B(g, w, 3, Math.max(3.5, d * 0.6), 0, h - 3, 0, body, 0.5, false);
  const n = Math.max(1, Math.round(w / 60));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (w / n) * (i + 0.5), side = i % 2 ? 1 : -1;
    C(g, 0.8, 0.8, 4, x, h - 7, 0, body, 8).castShadow = false;
    const head = new THREE.Group();
    head.position.set(x, h - 8, 0);
    head.rotation.x = side * 0.55;
    const can = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 10, 18), body);
    can.position.y = -4; head.add(can);
    const lz = new THREE.Mesh(new THREE.CircleGeometry(3.1, 18), lens);
    lz.rotation.x = Math.PI / 2; lz.position.y = -9.1; head.add(lz);
    g.add(head);
  }
  const light = new THREE.PointLight('#ffe4bf', 0.3, Math.max(300, w * 1.4), 0);
  light.position.y = -20; g.add(light);
  return g;
}

// ── 圓弧造型 ─────────────────────────────────────────────
// 弧形扇面（給弧形沙發座面／椅背），中心在前方
function arcSector(rIn, rOut, t0, t1, height, m, bevel = 3) {
  const sh = new THREE.Shape();
  sh.absarc(0, 0, rOut, t0, t1, false);
  sh.absarc(0, 0, rIn, t1, t0, true);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: Math.max(1, height - 2 * bevel), bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 40 });
  const mesh = new THREE.Mesh(geo, m);
  mesh.rotation.x = -Math.PI / 2; mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
// 弧形沙發：靠背呈弧線包覆，無扶手
function curvedSofa({ w, d, h, color, color2 }) {
  const g = new THREE.Group(), fab = mat(color, { r: 0.95 }), cush = mat(shade(color, 0.07), { r: 0.95 }), leg = mat(color2, { r: 0.5 });
  const sd = d * 0.62, s = d - sd, R = (w * w / 4 + s * s) / (2 * s), A = Math.asin(Math.min(1, (w / 2) / R));
  const cz = -d / 2 + R, t0 = Math.PI / 2 - A, t1 = Math.PI / 2 + A, legH = 8, backT = 18;
  const place = (m, y) => { m.position.set(0, y, cz); g.add(m); };
  // 形狀座標 y = -z，所以中心放在 z = cz
  place(arcSector(R - sd - backT * 0.2, R - 2, t0 + 0.02, t1 - 0.02, 20, fab, 3), legH);
  place(arcSector(R - sd + 2, R - backT, t0 + 0.04, t1 - 0.04, 14, cush, 5), legH + 18);
  place(arcSector(R - backT, R, t0, t1, h - legH, fab, 6), legH);
  for (const a of [-A * 0.8, 0, A * 0.8]) for (const rr of [R - 8, R - sd + 6]) C(g, 2, 1.5, legH, Math.sin(a) * rr, 0, cz - Math.cos(a) * rr, leg, 10);
  return g;
}
// 圓桶單人椅／旋轉休閒椅：弧形椅殼＋圓座墊
function roundChair({ w, d, h, color, color2 }, s = {}) {
  const g = new THREE.Group(), fab = mat(color, { r: 0.95, ds: true }), cush = mat(shade(color, 0.08), { r: 0.95 }), base = mat(color2, { r: 0.4, m: s.swivel ? 0.5 : 0 });
  const R = Math.min(w, d) / 2 - 3, seatY = s.seatH ?? 40, legH = s.swivel ? 0 : 14;
  if (s.swivel) { C(g, R * 0.6, R * 0.65, 2, 0, 0, 0, base, 32); C(g, 3, 3, seatY - 14, 0, 2, 0, base, 16); }
  else for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + (i * Math.PI) / 2; C(g, 1.8, 1.3, legH, Math.sin(a) * R * 0.7, 0, Math.cos(a) * R * 0.7, base, 10); }
  const y0 = s.swivel ? seatY - 14 : legH;
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.92, seatY - y0 - 6, 40), fab);
  bowl.position.y = y0 + (seatY - y0 - 6) / 2; bowl.castShadow = true; g.add(bowl);
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.86, R * 0.88, 10, 40), cush);
  seat.position.set(0, seatY - 4, 2); seat.castShadow = true; g.add(seat);
  const L = s.arc ?? 4.4, bh = h - y0 - 4;
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, bh, 48, 1, true, Math.PI - L / 2, L), fab);
  shell.position.y = y0 + bh / 2; shell.castShadow = true; g.add(shell);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R - 3, 4, 12, 48, L), fab);
  rim.rotation.x = -Math.PI / 2;
  const rg = new THREE.Group(); rg.add(rim); rg.position.y = h - 4; rg.rotation.y = Math.PI / 2 - L / 2; g.add(rg);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(R - 6, R - 6, bh - 12, 48, 1, true, Math.PI - L / 2 + 0.1, L - 0.2), cush);
  inner.position.y = seatY + (bh - 12) / 2 - 2; g.add(inner);
  return g;
}
// DYVLINGE：無扶手、拉扣蓬鬆坐墊與靠背、五爪鍍鉻旋轉腳
function tuftedSwivel({ w, d, h, color, color2 }) {
  const g = new THREE.Group(), fab = mat(color, { r: 0.97 }), dark = mat(shade(color, -0.18), { r: 0.97 });
  const chrome = mat(color2, { r: 0.25, m: 0.55 });
  // 五爪腳
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 5, L = Math.min(w, d) * 0.44;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, L), chrome);
    spoke.position.set(Math.sin(a) * L / 2, 5, Math.cos(a) * L / 2);
    spoke.rotation.y = a; spoke.castShadow = true; g.add(spoke);
    C(g, 2.4, 2.4, 1.6, Math.sin(a) * L, 0, Math.cos(a) * L, mat('#2b2b2b', { r: 0.6 }), 12);
  }
  C(g, 3.2, 3.6, 4, 0, 4, 0, chrome, 16);
  C(g, 2.2, 2.2, 16, 0, 8, 0, chrome, 16);
  B(g, w * 0.55, 3, d * 0.45, 0, 22, 0, mat('#2b2b2b', { r: 0.6 }), 1);
  // 坐墊（略往後傾的蓬鬆厚墊）
  const seatTop = 43, seatT = 17, sd = Math.min(d - 8, 62);
  const seat = B(g, w, seatT, sd, 0, seatTop - seatT, d / 2 - sd / 2 - 2, fab, 7.5);
  seat.rotation.x = -0.05;
  // 靠背（後傾、上緣圓潤）
  const backH = h - seatTop + 14, backT = 16;
  const back = B(g, w - 2, backH, backT, 0, 0, 0, fab, 7.5);
  back.position.set(0, seatTop - 10 + backH / 2, -d / 2 + backT / 2 + 6);
  back.rotation.x = -0.26;
  // 拉扣
  const btn = (x, y, z, parent) => { const s = new THREE.Mesh(new THREE.SphereGeometry(1.3, 10, 8), dark); s.position.set(x, y, z); parent.add(s); };
  for (const bx of [-w * 0.18, w * 0.18]) for (const bz of [-sd * 0.15, sd * 0.2]) btn(bx, seatT / 2 + 0.2, bz, seat);
  for (const bx of [-w * 0.18, w * 0.18]) for (const by of [-backH * 0.12, backH * 0.2]) btn(bx, by, backT / 2 + 0.2, back);
  // 坐墊與靠背交接的軟墊縫
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, w - 6, 24), fab);
  roll.rotation.z = Math.PI / 2; roll.position.set(0, seatTop - 3, -d / 2 + 20); g.add(roll);
  return g;
}

// 高背扶手椅（STRANDMON 類）：翼型椅背＋捲邊扶手＋木腳
function wingChair({ w, d, h, color, color2 }) {
  const g = new THREE.Group(), fab = mat(color, { r: 0.95 }), cush = mat(shade(color, 0.07), { r: 0.95 }), leg = mat(color2, { r: 0.5 });
  const legH = 16, arm = 14;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) C(g, 2.2, 1.6, legH, sx * (w / 2 - 6), 0, sz * (d / 2 - 8), leg, 12);
  B(g, w - 4, 16, d - 6, 0, legH, 2, fab, 5);
  B(g, w - 2 * arm - 2, 10, d - 22, 0, legH + 14, 8, cush, 5);
  B(g, w - 8, h - legH, 18, 0, legH, -d / 2 + 11, fab, 8);
  for (const sx of [-1, 1]) {
    B(g, arm, 46, d - 16, sx * (w / 2 - arm / 2 - 1), legH, 4, fab, 6);
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(arm / 2 + 2, arm / 2 + 2, d - 16, 24), fab);
    roll.rotation.x = Math.PI / 2; roll.position.set(sx * (w / 2 - arm / 2 - 1), legH + 46, 4); roll.castShadow = true; g.add(roll);
    const wing = B(g, 8, h - legH - 50, 28, sx * (w / 2 - 6), legH + 50, -d / 2 + 22, fab, 4);
    wing.rotation.y = sx * -0.25;
  }
  B(g, w - 2 * arm - 6, h - legH - 40, 10, 0, legH + 24, -d / 2 + 22, cush, 5).rotation.x = -0.1;
  return g;
}
// POÄNG：彎曲木框懸臂椅
function bentChair({ w, d, h, color, color2 }) {
  const g = new THREE.Group(), wood = mat(color2, { r: 0.5 }), cush = mat(color, { r: 0.95 });
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 - 3);
    const pts = [[d * 0.45, 2], [-d * 0.32, 2], [-d * 0.42, 6], [-d * 0.2, 22], [d * 0.25, 46], [d * 0.42, 50], [d * 0.46, 40], [d * 0.46, 2]]
      .map(([z, y]) => new THREE.Vector3(x, y, z));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.2), 80, 2, 8, true), wood);
    tube.castShadow = true; g.add(tube);
  }
  const seat = B(g, w - 10, 9, d * 0.5, 0, 34, d * 0.1, cush, 4); seat.rotation.x = 0.18;
  const back = B(g, w - 12, h * 0.6, 9, 0, 38, -d * 0.28, cush, 4); back.rotation.x = -0.42;
  B(g, w - 10, 3, 4, 0, h - 8, -d * 0.48, wood, 1);
  return g;
}

// ── 書櫃・層架 ───────────────────────────────────────────
// KALLAX 方格櫃
function kallax({ w, d, h, color, color2 }) {
  const g = new THREE.Group(), m = mat(color, { r: 0.6 }), t = 4, ti = 1.6;
  const cols = Math.max(1, Math.round((w - t) / 37)), rows = Math.max(1, Math.round((h - t) / 37));
  B(g, w, t, d, 0, 0, 0, m); B(g, w, t, d, 0, h - t, 0, m, 0.5);
  for (const s of [-1, 1]) B(g, t, h - 2 * t, d, s * (w / 2 - t / 2), t, 0, m);
  const cw = (w - 2 * t) / cols, rh = (h - 2 * t) / rows;
  for (let i = 1; i < cols; i++) B(g, ti, h - 2 * t, d, -w / 2 + t + cw * i, t, 0, m);
  for (let j = 1; j < rows; j++) B(g, w - 2 * t, ti, d, 0, t + rh * j - ti / 2, 0, m);
  const box = mat(color2, { r: 0.9 }), pal = ['#8c6d5a', '#5d7287', '#c9b79c', '#7a8a6b', '#e4dccd', '#3e4a59'];
  let k = 7;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    k = (k * 7 + 3) % 97;
    const x = -w / 2 + t + cw * (i + 0.5), y = t + rh * j + ti / 2;
    if (k % 3 === 0) B(g, cw - 4, rh - 5, d - 4, x, y, 1, box, 1.5);
    else if (k % 3 === 1) for (let b = 0; b < 6; b++) B(g, 2.6, rh * 0.7 - (b % 3) * 2, d * 0.7, x - cw / 2 + 5 + b * 3.2, y, 0, mat(pal[(k + b) % pal.length], { r: 0.8 }), 0, false);
  }
  return g;
}
// 梯形書架（靠牆斜放）
function ladderShelf({ w, d, h, color }) {
  const g = new THREE.Group(), m = mat(color, { r: 0.6 });
  for (const s of [-1, 1]) {
    const rail = B(g, 3, h / Math.cos(0.17), 4, s * (w / 2 - 1.5), 0, 0, m);
    rail.rotation.x = 0.17; rail.position.z = 0; rail.position.y = h / 2;
  }
  const n = Math.max(3, Math.round(h / 42));
  for (let i = 0; i < n; i++) {
    const y = 8 + (h - 30) * (i / (n - 1)), depth = d * (1 - i / (n + 1)), z = d / 2 - depth / 2 - (d - depth) * 0.0;
    B(g, w - 6, 2, depth, 0, y, z - (d - depth) / 2 + (d - depth) / 2, m, 0.4);
  }
  return g;
}
// MUJI SUS 層架：四角立柱＋側面橫桿＋鋼板層板，層數依高度
function sus({ w, d, h, color, color2 }) {
  const g = new THREE.Group(), m = mat(color, { r: 0.35, m: 0.55 }), sh = mat(color2 || color, { r: 0.45, m: color2 ? 0 : 0.5 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 2.2, h, 2.2, sx * (w / 2 - 1.1), 0, sz * (d / 2 - 1.1), m, 0.4);
  const n = h <= 95 ? 3 : h <= 135 ? 4 : 5;
  for (let i = 0; i < n; i++) {
    const y = 4 + (h - 7) * (i / (n - 1));
    B(g, w - 4, 1.6, d - 3, 0, y, 0, sh, 0.3);
    for (const sz of [-1, 1]) B(g, w - 4, 1.2, 1, 0, y + 1.6, sz * (d / 2 - 1), m, 0, false);
    for (const sx of [-1, 1]) B(g, 1, 1.2, d - 4, sx * (w / 2 - 1.1), y + 1.6, 0, m, 0, false);
  }
  const pal = ['#e9e4da', '#c9b8a3', '#8c6d5a', '#7d8a96', '#f4f1ea'];
  let k = 3;
  for (let i = 0; i < n - 1; i++) {
    k = (k * 7 + 3) % 97;
    const y = 4 + (h - 7) * (i / (n - 1)) + 1.6;
    if (k % 2) B(g, Math.min(36, w * 0.6), 22, d * 0.75, -w * 0.12, y, 0, mat(pal[k % pal.length], { r: 0.95 }), 2);
    else for (let b = 0; b < 7; b++) B(g, 2.6, 20 + (b % 3) * 3, d * 0.6, -w / 2 + 6 + b * 3.3, y, 0, mat(pal[(k + b) % pal.length], { r: 0.8 }), 0, false);
  }
  return g;
}

// ── 書桌 ─────────────────────────────────────────────────
// 升降桌／工作桌：桌面＋T 型雙柱腳架（h = 桌面高度，可自行調整）
function standDesk({ w, d, h, color, color2 }, s = {}) {
  const g = new THREE.Group(), top = mat(color, { r: 0.55 }), fr = mat(color2, { r: 0.4, m: 0.4 });
  B(g, w, 2.5, d, 0, h - 2.5, 0, top, 0.6);
  const lx = w / 2 - Math.min(14, w * 0.12);
  for (const sx of [-1, 1]) {
    B(g, 6, 3, d - 8, sx * lx, 0, 0, fr, 0.8);
    if (s.lift !== false) {
      B(g, 7, (h - 5) * 0.52, 5.5, sx * lx, 3, 0, fr, 0.5);
      B(g, 5.6, (h - 5) * 0.52, 4.2, sx * lx, 3 + (h - 5) * 0.48, 0, fr, 0.5);
    } else B(g, 5, h - 5.5, 5, sx * lx, 3, 0, fr, 0.5);
    B(g, 5, 3, d - 10, sx * lx, h - 5.5, 0, fr, 0.5);
  }
  B(g, 2 * lx - 6, 4, 4, 0, h - 7, -d * 0.1, fr, 0.5);
  if (s.lift !== false) B(g, 10, 2, 5, w / 2 - 14, h - 4.5, d / 2 - 3, mat('#2b2b2b', { r: 0.5 }), 0.8, false);
  return g;
}

// ── 燈飾（主色＝燈罩／本體，配色＝底座／支架）──────────────
const glow = (c, ei = 0.45) => mat(c, { r: 0.9, e: c, ei });
function domeMesh(r, hgt, m, open = true) {
  const s = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2), m);
  s.scale.set(r, hgt, r); s.castShadow = true; m.side = open ? THREE.DoubleSide : m.side;
  return s;
}
function tableLamp({ w, d, h, color, color2 }, s) {
  const g = new THREE.Group(), base = mat(color2, { r: s.baseR ?? 0.35, m: s.baseM ?? 0 });
  const R = Math.min(w, d) / 2;
  if (s.base === 'ceramic') {
    const b = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), base);
    b.scale.set(R * 0.62, h * 0.24, R * 0.62); b.position.y = h * 0.24; b.castShadow = true; g.add(b);
    C(g, 0.8, 0.8, h * 0.18, 0, h * 0.46, 0, base, 8);
  } else if (s.base === 'glassBody') {
    C(g, R * 0.55, R * 0.6, 3, 0, 0, 0, base, 24);
  } else {
    C(g, R * 0.55, R * 0.6, 2, 0, 0, 0, base, 24);
    C(g, 0.9, 0.9, h * (s.shade === 'dome' ? 0.72 : 0.6), 0, 2, 0, base, 10);
  }
  if (s.shade === 'drum') C(g, R * (s.taper ?? 0.85), R, h * 0.4, 0, h * 0.6, 0, glow(color, 0.35), 32);
  else if (s.shade === 'globe') {
    const gl = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 24), mat(color, { r: 0.2, e: color, ei: 0.55, o: 0.92 }));
    gl.position.y = h - R; g.add(gl);
  } else if (s.shade === 'dome') {
    const dm = domeMesh(R, h * 0.32, mat(color, { r: 0.35 })); dm.position.y = h * 0.68; g.add(dm);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(R * 0.92, 32), glow('#fff1d6', 0.9));
    disc.rotation.x = Math.PI / 2; disc.position.y = h * 0.68 + 0.3; g.add(disc);
  }
  return g;
}
function floorLampStyled({ w, d, h, color, color2 }, s) {
  const g = new THREE.Group(), stand = mat(color2, { r: 0.45, m: s.metal ? 0.6 : 0 }), R = Math.min(w, d) / 2;
  if (s.type === 'tripod') {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2, leg = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.4, h * 0.72, 8), stand);
      leg.position.set(Math.sin(a) * R * 0.38, h * 0.35, Math.cos(a) * R * 0.38);
      leg.rotation.set(Math.cos(a) * 0.28, 0, -Math.sin(a) * 0.28); leg.castShadow = true; g.add(leg);
    }
    C(g, R * 0.75, R * 0.9, h * 0.28, 0, h * 0.7, 0, glow(color, 0.35), 32);
  } else if (s.type === 'reading') {
    C(g, R * 0.7, R * 0.75, 2.5, 0, 0, 0, stand, 24);
    C(g, 1, 1, h - 20, 0, 2.5, 0, stand, 10);
    const arm = B(g, 2, 2, 30, 0, h - 18, 12, stand, 0.6); arm.rotation.x = -0.5;
    const head = new THREE.Mesh(new THREE.CylinderGeometry(4, 9, 16, 24, 1, true), mat(color, { r: 0.4, m: 0.3, ds: true }));
    head.position.set(0, h - 18, 26); head.rotation.x = 0.6; head.castShadow = true; g.add(head);
  } else if (s.type === 'arc') {
    B(g, 30, 4, 30, -w / 2 + 15, 0, 0, mat(color2, { r: 0.3 }), 1);
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-w / 2 + 15, 4, 0), new THREE.Vector3(-w / 2 + 15, h + 30, 0), new THREE.Vector3(w / 2 - 20, h - 10, 0));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 1.2, 8), mat('#b9bcbf', { r: 0.25, m: 0.8 }));
    tube.castShadow = true; g.add(tube);
    const dm = domeMesh(20, 16, mat(color, { r: 0.35, m: 0.2 })); dm.position.set(w / 2 - 20, h - 28, 0); g.add(dm);
  } else { // 直立布罩（ÖKENSAND 類）
    C(g, R * 0.55, R * 0.6, 2.5, 0, 0, 0, stand, 24);
    C(g, 1.6, 1.6, h - 34, 0, 2.5, 0, stand, 10);
    C(g, R * 0.7, R, 34, 0, h - 34, 0, glow(color, 0.4), 32);
  }
  return g;
}
// 壁燈：背面貼牆（-Z），elev 為底部離地高度
function wallLamp({ w, d, h, color, color2 }, s) {
  const g = new THREE.Group(), metal = mat(color2, { r: 0.35, m: 0.5 });
  if (s.type === 'disc') {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, d, 40), mat(color, { r: 0.5 }));
    disc.rotation.x = Math.PI / 2; disc.position.set(0, h / 2, 0); g.add(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(w / 2 - 1.5, 1, 8, 40), glow('#fff1d6', 1));
    ring.position.set(0, h / 2, d / 2); g.add(ring);
  } else if (s.type === 'globe') {
    B(g, 10, 14, 1.5, 0, h / 2 - 7, -d / 2 + 0.75, metal, 0.5);
    B(g, 2, 2, d * 0.5, 0, h / 2 - 1, -d / 4, metal, 0.6);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(Math.min(w, h) / 2 - 1, 28, 20), mat(color, { r: 0.1, e: '#fff1d6', ei: 0.35, o: 0.45 }));
    gl.position.set(0, h / 2, d / 2 - Math.min(w, h) / 2); g.add(gl);
  } else { // 擺臂閱讀壁燈
    B(g, 6, 12, 2, 0, h - 14, -d / 2 + 1, metal, 0.6);
    B(g, 1.6, 1.6, d - 10, 0, h - 9, 0, metal, 0.5);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 8, 14, 24, 1, true), mat(color, { r: 0.45, ds: true }));
    head.position.set(0, h - 18, d / 2 - 8); head.castShadow = true; g.add(head);
  }
  return g;
}
function pendantStyled({ w, d, h, color, color2, elev }, s) {
  const g = new THREE.Group(), r = w / 2;
  if (s.shape === 'cone') {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.25, r, h, 40, 1, true), mat(color, { r: 0.4, ds: true }));
    c.position.y = h / 2; c.castShadow = true; g.add(c);
  } else g.add(domeMesh(r, h, mat(color, { r: s.matte ? 0.8 : 0.3, ds: true })));
  if (s.cap) C(g, r * 0.3, r * 0.34, 5, 0, h - 2, 0, mat(color2, { r: 0.6 }), 24);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r * 0.9, 40), glow('#fff4e2', 1));
  disc.rotation.x = Math.PI / 2; disc.position.y = 0.3; g.add(disc);
  const cord = Math.max(5, CEIL_H - (elev || 0) - h);
  C(g, 0.35, 0.35, cord, 0, h, 0, mat('#f2f2f2', { r: 0.5 }), 6).castShadow = false;
  C(g, 5, 5, 1.5, 0, h + cord - 1.5, 0, mat('#f2f2f2', { r: 0.5 }), 24).castShadow = false;
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
export const CATEGORIES = ['沙發', '單人椅', '客廳', '書桌', '書櫃・層架', '燈具', '臥室', '餐廚', '衛浴', '收納', '書房・其他'];

export const CATALOG = {
  sofa:          sofaDef('三人沙發（圓扶手）', 240, 88, 80, '#e6ddcd', '#6b4f36', { arm: 22, armH: 62, legH: 10, seatH: 44, backD: 20, n: 3, round: 9, rollArm: true }),
  // 布沙發：YKS 擇木深耕 伊達三人座（207×93×106，座高 45）
  sofa_yks_ida:    sofaDef('布 YKS 伊達三人座 灰', 207, 93, 106, '#8f9497', '#1f1f1f', { arm: 18, armH: 64, legH: 14, seatH: 45, backD: 16, n: 2, backN: 3, backFrame: 0.72, round: 9, rollArm: true, metalLeg: true, splay: true }),
  sofa_yks_ida_w:  sofaDef('布 YKS 伊達三人座 米白', 207, 93, 106, '#e9e4da', '#1f1f1f', { arm: 18, armH: 64, legH: 14, seatH: 45, backD: 16, n: 2, backN: 3, backFrame: 0.72, round: 9, rollArm: true, metalLeg: true, splay: true }),
  sofa_curve:    { name: '弧形沙發', cat: '沙發', w: 240, d: 105, h: 75, color: '#e6ddcd', color2: '#6e4b2e', build: curvedSofa },
  // 布沙發
  sofa_kivik:      sofaDef('布 KIVIK 三人座', 228, 95, 83, '#c9c1b2', '#3a3a3a', { arm: 24, armH: 64, legH: 3, seatH: 45, backD: 22, n: 3, round: 11, rollArm: true }),
  sofa_vimle:      sofaDef('布 VIMLE 三人座', 241, 98, 83, '#b9a58e', '#3a3a3a', { arm: 15, armH: 68, legH: 6, seatH: 48, backD: 20, n: 3, round: 9 }),
  sofa_lillesater: sofaDef('布 LILLESÄTER 三人座', 201, 90, 69, '#b8b468', '#3a3a3a', { arm: 8, armH: 60, legH: 2, seatH: 44, backD: 14, n: 1, backCush: false, round: 10 }),
  sofa_mannarp:    sofaDef('布 MANNARP 三人座', 198, 95, 90, '#ddd2bf', '#6e4b2e', { arm: 10, armH: 62, legH: 16, seatH: 45, backD: 14, n: 3, round: 8, rollArm: true }),
  // 皮沙發
  sofa_landskrona: sofaDef('皮 LANDSKRONA 三人座', 204, 89, 78, '#9b6a3c', '#6e4b2e', { arm: 12, armH: 64, legH: 16, seatH: 44, backD: 16, n: 3, leather: true, round: 6 }),
  sofa_stockholm:  sofaDef('皮 STOCKHOLM 三人座', 211, 88, 80, '#c99a66', '#5a3d28', { arm: 15, armH: 72, legH: 14, seatH: 43, backD: 16, n: 3, leather: true, round: 7 }),
  sofa_klippan:    sofaDef('皮 KLIPPAN 雙人座', 177, 88, 66, '#2a2a2a', '#2a2a2a', { arm: 20, armH: 66, legH: 3, seatH: 43, backD: 22, n: 1, backCush: false, leather: true, round: 9, rollArm: true }),
  sofa_hemlingby:  sofaDef('皮 HEMLINGBY 雙人座', 145, 72, 72, '#2a2a2a', '#333333', { arm: 8, armH: 61, legH: 14.5, seatH: 42, backD: 12, n: 2, backCush: false, leather: true, metalLeg: true, round: 3 }),
  sofa_vimle_l:    sofaDef('皮 VIMLE 三人座', 241, 98, 80, '#2b2b2b', '#2b2b2b', { arm: 15, armH: 65, legH: 4, seatH: 45, backD: 20, n: 3, leather: true, round: 9 }),
  sofa_kivik_l:    sofaDef('皮 KIVIK 三人座', 227, 95, 83, '#2d2d2d', '#2b2b2b', { arm: 24, armH: 64, legH: 3, seatH: 45, backD: 22, n: 3, leather: true, round: 11, rollArm: true }),
  // 單人椅（尺寸參考 IKEA 台灣官網）
  armchair:          { name: 'STOCKHOLM 2025 扶手椅', cat: '單人椅', w: 76, d: 72, h: 68, color: '#cfcac2', color2: '#f2f2f0', build: o => roundChair(o, { seatH: 40, arc: 4.2 }) },
  armchair_strandmon:{ name: 'STRANDMON 高背扶手椅', cat: '單人椅', w: 82, d: 96, h: 101, color: '#5b6f8a', color2: '#5a3d28', build: wingChair },
  armchair_poang:    { name: 'POÄNG 扶手椅', cat: '單人椅', w: 68, d: 82, h: 100, color: '#8a9aa6', color2: '#d9b98a', build: bentChair },
  armchair_dyvlinge: { name: 'DYVLINGE 旋轉休閒椅', cat: '單人椅', w: 63, d: 75, h: 68, color: '#e0661f', color2: '#c9ccce', build: tuftedSwivel },
  armchair_lillesater:{ name: 'LILLESÄTER 旋轉休閒椅', cat: '單人椅', w: 70, d: 70, h: 75, color: '#2f3e5c', color2: '#2b2b2b', build: o => roundChair(o, { swivel: true, seatH: 42, arc: 5.0 }) },
  armchair_box:      { ...sofaDef('方正單人沙發', 85, 82, 80, '#cdbfa8', '#6b4f36', { arm: 16, armH: 62, legH: 10, seatH: 44, backD: 18, n: 1, round: 8 }), cat: '單人椅' },
  coffee_table:  { name: '茶几', cat: '客廳', w: 100, d: 50, h: 40, color: '#c49a6c', build: coffeeTable },
  side_table:    { name: '邊几', cat: '客廳', w: 45, d: 45, h: 50, color: '#c49a6c', build: sideTable },
  tv_floating:   { name: '懸空電視櫃', cat: '客廳', w: 280, d: 40, h: 40, elev: 25, color: '#bdbab4', color2: '#a8835e', build: tvFloating },
  tv_cabinet:    { name: '電視櫃', cat: '客廳', w: 200, d: 40, h: 45, color: '#c49a6c', build: tvCabinet },
  tv:            { name: '電視 65吋', cat: '客廳', w: 145, d: 6, h: 84, color: '#1d1d1f', build: tv },
  rug:           { name: '地毯', cat: '客廳', w: 200, d: 140, h: 1, color: '#e9e2d6', build: rug },
  rug_round:     { name: '圓地毯', cat: '客廳', w: 120, d: 120, h: 1, color: '#c8b59a', build: rugRound },
  pendant:       { name: '吊燈（橘色圓罩）', cat: '燈具', w: 50, d: 50, h: 15, elev: 150, color: '#e8692a', build: pendant },
  pendant_vaxjo: { name: 'VÄXJÖ 吊燈', cat: '燈具', w: 38, d: 38, h: 20, elev: 160, color: '#d9cdb7', color2: '#d9cdb7', build: o => pendantStyled(o, { matte: true }) },
  pendant_bunkeflo:{ name: 'BUNKEFLO 吊燈', cat: '燈具', w: 36, d: 36, h: 18, elev: 160, color: '#f2f2f0', color2: '#d7b98a', build: o => pendantStyled(o, { matte: true, cap: true }) },
  pendant_cone:  { name: '錐形吊燈', cat: '燈具', w: 30, d: 30, h: 28, elev: 150, color: '#2b2b2b', color2: '#c9a24a', build: o => pendantStyled(o, { shape: 'cone', cap: true }) },
  track_light:   { name: '軌道燈', cat: '燈具', w: 240, d: 6, h: 14, elev: CEIL_H - 14, color: '#f5f5f3', build: trackLight },
  floor_lamp:    { name: '立燈（布罩）', cat: '燈具', w: 40, d: 40, h: 160, color: '#f3ead8', build: floorLamp },
  floor_okensand:{ name: 'ÖKENSAND 落地燈', cat: '燈具', w: 40, d: 40, h: 150, color: '#f4efe4', color2: '#d7b98a', build: o => floorLampStyled(o, {}) },
  floor_ranarp:  { name: 'RANARP 落地閱讀燈', cat: '燈具', w: 40, d: 40, h: 153, color: '#2b2b2b', color2: '#2b2b2b', build: o => floorLampStyled(o, { type: 'reading', metal: true }) },
  floor_lauters: { name: 'LAUTERS 三腳落地燈', cat: '燈具', w: 50, d: 50, h: 145, color: '#f4efe4', color2: '#9b7653', build: o => floorLampStyled(o, { type: 'tripod' }) },
  floor_arc:     { name: '弧形立燈', cat: '燈具', w: 160, d: 35, h: 200, color: '#2b2b2b', color2: '#e8e6e1', build: o => floorLampStyled(o, { type: 'arc' }) },
  table_dejsa:   { name: 'DEJSA 桌燈（玻璃球）', cat: '燈具', w: 28, d: 28, h: 41, color: '#f6f1e6', color2: '#d9cdb7', build: o => tableLamp(o, { base: 'glassBody', shade: 'globe' }) },
  table_blasverk:{ name: 'BLÅSVERK 桌燈', cat: '燈具', w: 26, d: 26, h: 36, color: '#e8dfcf', color2: '#e8dfcf', build: o => tableLamp(o, { base: 'ceramic', shade: 'drum' }) },
  table_tarnaby: { name: 'TÄRNABY 蘑菇桌燈', cat: '燈具', w: 18, d: 18, h: 25, color: '#2f2f2f', color2: '#2f2f2f', build: o => tableLamp(o, { shade: 'dome' }) },
  table_arstid:  { name: 'ÅRSTID 桌燈', cat: '燈具', w: 22, d: 22, h: 55, color: '#f4efe4', color2: '#c9a24a', build: o => tableLamp(o, { shade: 'drum', taper: 1, baseM: 0.8, baseR: 0.3 }) },
  table_blidvader:{ name: 'BLIDVÄDER 桌燈', cat: '燈具', w: 30, d: 30, h: 50, color: '#e3d8c4', color2: '#f1ece2', build: o => tableLamp(o, { base: 'ceramic', shade: 'drum' }) },
  wall_nymane:   { name: 'NYMÅNE 擺臂壁燈', cat: '燈具', w: 15, d: 40, h: 30, elev: 120, color: '#f2f2f0', color2: '#f2f2f0', build: o => wallLamp(o, {}) },
  wall_varmblixt:{ name: 'VARMBLIXT 圓形壁燈', cat: '燈具', w: 30, d: 6, h: 30, elev: 160, color: '#f2f2f0', color2: '#f2f2f0', build: o => wallLamp(o, { type: 'disc' }) },
  wall_solklint: { name: 'SOLKLINT 玻璃壁燈', cat: '燈具', w: 18, d: 22, h: 20, elev: 170, color: '#e8eef0', color2: '#c9a24a', build: o => wallLamp(o, { type: 'globe' }) },
  bed_queen:     { name: '雙人床 6尺', cat: '臥室', w: 182, d: 190, h: 100, color: '#c49a6c', color2: '#9a8471', build: bed },
  bed_double:    { name: '雙人床 5尺', cat: '臥室', w: 152, d: 188, h: 95, color: '#c49a6c', color2: '#b7a48f', build: bed },
  bed_single:    { name: '單人床', cat: '臥室', w: 105, d: 188, h: 90, color: '#c49a6c', color2: '#e3d6c3', build: bed },
  boaxel:        { name: 'IKEA BOAXEL 壁掛衣櫃', cat: '臥室', w: 240, d: 40, h: 201, color: '#f1f1ef', build: boaxel },
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
  bookshelf:     { name: '開放書櫃', cat: '書櫃・層架', w: 80, d: 30, h: 180, color: '#c49a6c', build: bookshelf },
  bookshelf_low: { name: '矮書櫃', cat: '書櫃・層架', w: 120, d: 30, h: 80, color: '#c49a6c', build: bookshelf },
  billy:         { name: 'IKEA BILLY 書櫃', cat: '書櫃・層架', w: 80, d: 28, h: 202, color: '#f3f3f1', build: bookshelf },
  kallax_4x4:    { name: 'IKEA KALLAX 4×4 方格櫃', cat: '書櫃・層架', w: 147, d: 39, h: 147, color: '#f3f3f1', color2: '#cfc6b6', build: kallax },
  kallax_2x4:    { name: 'IKEA KALLAX 2×4 方格櫃', cat: '書櫃・層架', w: 77, d: 39, h: 147, color: '#f3f3f1', color2: '#cfc6b6', build: kallax },
  kallax_4x1:    { name: 'IKEA KALLAX 4×1 矮櫃', cat: '書櫃・層架', w: 147, d: 39, h: 42, color: '#c9a77d', color2: '#e9e2d6', build: kallax },
  ladder_shelf:  { name: '梯形書架', cat: '書櫃・層架', w: 60, d: 35, h: 180, color: '#b08d68', build: ladderShelf },
  sus_s:         { name: 'MUJI SUS 層架 小', cat: '書櫃・層架', w: 58, d: 41, h: 83, color: '#d3d4d2', color2: '#d3d4d2', build: sus },
  sus_m:         { name: 'MUJI SUS 層架 中', cat: '書櫃・層架', w: 58, d: 41, h: 120, color: '#d3d4d2', color2: '#d3d4d2', build: sus },
  sus_l:         { name: 'MUJI SUS 層架 大', cat: '書櫃・層架', w: 58, d: 41, h: 175.5, color: '#d3d4d2', color2: '#d3d4d2', build: sus },
  sus_wm:        { name: 'MUJI SUS 層架 寬／中', cat: '書櫃・層架', w: 86, d: 41, h: 120, color: '#4a4b4d', color2: '#4a4b4d', build: sus },
  sus_wl:        { name: 'MUJI SUS 層架 寬／大', cat: '書櫃・層架', w: 86, d: 41, h: 175.5, color: '#4a4b4d', color2: '#4a4b4d', build: sus },
  desk:          { name: '書桌', cat: '書桌', w: 120, d: 60, h: 75, color: '#c49a6c', build: desk },
  desk_trotten:  { name: 'IKEA TROTTEN 書桌', cat: '書桌', w: 120, d: 70, h: 75, color: '#d8c3a5', color2: '#f2f2f0', build: o => standDesk(o, { lift: false }) },
  desk_trotten_e:{ name: 'IKEA TROTTEN 電動升降桌', cat: '書桌', w: 160, d: 80, h: 75, color: '#f2f2f0', color2: '#f2f2f0', build: standDesk },
  desk_mittzon:  { name: 'IKEA MITTZON 電動升降桌', cat: '書桌', w: 140, d: 80, h: 75, color: '#f2f2f0', color2: '#f2f2f0', build: standDesk },
  desk_mittzon_s:{ name: 'IKEA MITTZON 升降桌 樺木', cat: '書桌', w: 120, d: 60, h: 75, color: '#d9bf95', color2: '#f2f2f0', build: standDesk },
  desk_gladhojden:{ name: 'IKEA GLADHÖJDEN 升降桌', cat: '書桌', w: 100, d: 60, h: 75, color: '#f2f2f0', color2: '#f2f2f0', build: standDesk },
  desk_idasen:   { name: 'IKEA IDÅSEN 電動升降桌', cat: '書桌', w: 160, d: 80, h: 75, color: '#3b3b3b', color2: '#2b2b2b', build: standDesk },
  office_chair:  { name: '辦公椅', cat: '書桌', w: 60, d: 60, h: 95, color: '#45474b', build: officeChair },
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
