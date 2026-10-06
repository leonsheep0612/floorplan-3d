// 户型資料：座標以原始平面圖（尺寸圖，1/40）的像素為單位，載入時換算成公分。
// 比例由圖上 150cm 與沙發 240cm 標註校正：1 px ≈ 1.154 cm。

export const S = 1.154;
const OX = 285, OY = 65;
export const cx = px => (px - OX) * S;
export const cz = py => (py - OY) * S;
export const CEIL = 278; // CH 278

// 參考底圖（assets/plan.jpg 為原圖裁切 [270,40]–[1225,935]）
export const PLAN_IMAGE = { src: 'assets/plan.jpg', rect: [270, 40, 1225, 935] };

// 實牆 [x1, y1, x2, y2]
export const WALLS = [
  [415, 168, 510, 181], [665, 168, 780, 181], [880, 168, 975, 181], [1105, 168, 1205, 181],
  [1190, 181, 1205, 772],
  [415, 181, 430, 713], [285, 713, 430, 728], [285, 713, 300, 917],
  [405, 903, 1035, 917],
  [910, 181, 925, 437],
  [655, 515, 740, 530], [790, 515, 815, 530], [885, 515, 1110, 530],
  [655, 530, 670, 757], [798, 530, 812, 757], [1025, 530, 1040, 757],
  [655, 757, 870, 772], [985, 757, 1205, 772],
  [800, 850, 815, 903], [1020, 772, 1035, 903],
  [495, 65, 510, 168],
];

// 陽台矮牆 / 欄杆
export const PARAPETS = [[510, 67, 742, 80], [729, 80, 742, 168]];
export const PARAPET_H = 110;

// 門窗開口。sill = 窗台高 (U)，head = 開口上緣；門：hinge 0=起點 1=終點，swing = 開向（+1/-1）
export const OPENINGS = [
  { r: [510, 168, 665, 181], kind: 'slide', sill: 0, head: 215 },
  { r: [780, 168, 880, 181], kind: 'window', sill: 32, head: 216 },
  { r: [975, 168, 1105, 181], kind: 'window', sill: 32, head: 216 },
  { r: [870, 757, 985, 772], kind: 'window', sill: 107, head: 215 },
  { r: [300, 903, 405, 917], kind: 'door', head: 213, hinge: 0, swing: -1, main: true },
  { r: [910, 437, 925, 515], kind: 'door', head: 210, hinge: 1, swing: 1 },
  { r: [740, 515, 790, 530], kind: 'door', head: 210, hinge: 1, swing: 1 },
  { r: [815, 515, 885, 530], kind: 'door', head: 210, hinge: 0, swing: 1 },
  { r: [1110, 515, 1190, 530], kind: 'door', head: 210, hinge: 1, swing: 1 },
  { r: [800, 772, 815, 850], kind: 'door', head: 210, hinge: 1, swing: 1 },
];

// 室內地坪（淨尺寸，用於材質與面積）
export const ROOMS = [
  { id: 'living', name: '客餐廳', floor: 'wood', label: [690, 300],
    poly: [[430, 181], [910, 181], [910, 515], [655, 515], [655, 772], [800, 772], [800, 903], [300, 903], [300, 728], [430, 728]] },
  { id: 'master', name: '主臥', floor: 'wood', poly: [[925, 181], [1190, 181], [1190, 515], [925, 515]] },
  { id: 'second', name: '次臥', floor: 'wood', poly: [[812, 530], [1025, 530], [1025, 757], [812, 757]] },
  { id: 'bathA', name: '衛浴 A', floor: 'tile', poly: [[670, 530], [798, 530], [798, 757], [670, 757]] },
  { id: 'bathB', name: '衛浴 B', floor: 'tile', poly: [[1040, 530], [1190, 530], [1190, 757], [1040, 757]] },
  { id: 'balF', name: '前陽台', floor: 'tileLight', poly: [[510, 80], [729, 80], [729, 168], [510, 168]] },
  { id: 'balR', name: '後陽台', floor: 'tileLight', poly: [[815, 772], [1020, 772], [1020, 903], [815, 903]] },
];

// 不計面積的區域標示
export const SUBLABELS = [
  { name: '餐廳', at: [545, 600] },
  { name: '廚房', at: [700, 820] },
  { name: '玄關', at: [362, 830] },
];

// 外框（底板，門檻處可見）
export const OUTLINE = [
  [[415, 168], [1205, 168], [1205, 772], [1035, 772], [1035, 917], [285, 917], [285, 713], [415, 713]],
  [[495, 65], [742, 65], [742, 168], [495, 168]],
];

// 預設家具（c = 平面圖中心點 px；尺寸 cm；rot 度，0 = 正面朝下方）
export const DEFAULT_LAYOUT = [
  { t: 'rug', c: [655, 314], rot: 90, w: 220, d: 170 },
  { t: 'sofa', c: [742, 314], rot: -90 },
  { t: 'coffee_table', c: [632, 314], rot: 90 },
  { t: 'tv_cabinet', c: [446, 320], rot: 90, w: 220, d: 36 },
  { t: 'tv', c: [436, 320], rot: 90, elev: 55 },
  { t: 'floor_lamp', c: [872, 222] },
  { t: 'plant', c: [882, 478] },
  { t: 'cabinet_tall', c: [449, 605], rot: 90, w: 365, d: 45, name: '餐廳收納高櫃' },
  { t: 'shoe_cabinet', c: [365, 746], w: 150, d: 40, h: 215, name: '玄關櫃' },
  { t: 'shelf_thin', c: [646, 645], rot: -90, w: 260, name: '展示薄櫃' },
  { t: 'dining_table', c: [522, 650] },
  { t: 'chair', c: [497, 612] },
  { t: 'chair', c: [547, 612] },
  { t: 'chair', c: [497, 688], rot: 180 },
  { t: 'chair', c: [547, 688], rot: 180 },
  { t: 'fridge', c: [457, 872], rot: 180 },
  { t: 'appliance', c: [549, 869], rot: 180 },
  { t: 'counter', c: [697, 880], rot: 180, w: 235, d: 55 },
  { t: 'rug', c: [1020, 311], rot: 90, w: 200, d: 220, color: '#d9cdb8' },
  { t: 'bed_queen', c: [1006, 311], rot: 90 },
  { t: 'nightstand', c: [950, 210], rot: 90 },
  { t: 'wardrobe', c: [1171, 348], rot: -90, w: 360, d: 44 },
  { t: 'rug_round', c: [885, 650] },
  { t: 'bed_single', c: [970, 622] },
  { t: 'desk', c: [836, 640], rot: 90, w: 120, d: 50 },
  { t: 'office_chair', c: [878, 640], rot: -90 },
  { t: 'shower', c: [707, 571] },
  { t: 'vanity', c: [691, 668], rot: 90 },
  { t: 'toilet', c: [770, 668], rot: -90 },
  { t: 'shower', c: [1082, 575] },
  { t: 'vanity', c: [1061, 672], rot: 90 },
  { t: 'toilet', c: [1162, 676], rot: -90 },
  { t: 'washer', c: [990, 870], rot: -90 },
  { t: 'plant', c: [985, 800] },
  { t: 'plant', c: [560, 112] },
];
