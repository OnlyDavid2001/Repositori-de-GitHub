/* GTA Barcelona — Especies de árbol de calle (etapa ARB). Lo usa streets.js.
   Siete especies típicas de Barcelona, cada una con sus tres niveles de detalle (árbol completo, copa de tarjetas e impostor):
     0 plátano de sombra · 1 almez (lledoner) · 2 naranjo amargo · 3 palmera (Washingtonia) · 4 jacaranda · 5 tipuana ·
     6 pino piñonero.
   Aquí van solo datos y geometría (sin Babylon): parámetros de porte, dibujo de las hojas y de la silueta lejana en canvas,
   mallas (posiciones, normales, uv, índices) y el reparto por calle (`pick`). streets.js crea texturas, materiales e
   instancias. El plátano sale idéntico al de antes (mismas secuencias `seedRaw` heredadas de Transeúnte); las especies
   nuevas usan `seed(…)`.
   Reparto: toda una calle (misma recta) o un tramo de ~320 m lleva la misma especie, elegida con pesos según la familia de
   barrio (n2/comun.md), el ancho de la calzada y si es rambla. */
(function () {
'use strict';
const { seed, seedRaw, R, hash2 } = window.BCN_GEO;

// ---------------------------------------------------------------- especies
// g: porte (tronco h/r, n ramas madre desde y0, largo len, dirección up/out, radio rad, factor de hijas kl, profundidad dh,
//    inclinación del tronco lean) · l: hojas (cerca nN tarjetas de sN m, separación DN, alto relativo ys; lejos nF/sF/DF)
// imp: impostor (semiancho, alto) · bark: tinte de la corteza (rgb, cuánto del moteado del plátano se queda)
// leaf: ganancia de color de las hojas (rgb, saturación) · fl: fracción de ejemplares en flor (jacaranda)
const SP = [
  { id: 'platan', n: 'plàtan', g: { h: 5.4, r: 0.3, n: 5, y0: 4.9, len: [3.1, 3.9], up: 0.75, out: 0.66, rad: 0.19, kl: 0.68, dh: 3 },
    l: { nN: 620, sN: [0.42, 0.78], DN: 1, ys: [-0.7, 0.8], nF: 90, sF: [1.15, 1.9], DF: 1.2 }, imp: [5.2, 12.5],
    bark: [1, 1, 1, 1], leaf: [1, 1, 1, 0.82], fl: 0 },
  { id: 'lledoner', n: 'lledoner', g: { h: 3.4, r: 0.22, n: 6, y0: 3.0, len: [2.5, 3.1], up: 0.86, out: 0.55, rad: 0.14, kl: 0.66, dh: 3 },
    l: { nN: 620, sN: [0.44, 0.76], DN: 0.95, ys: [-0.7, 0.8], nF: 95, sF: [1.1, 1.75], DF: 1.1 }, imp: [3.8, 11],
    bark: [0.72, 0.73, 0.76, 0.15], leaf: [0.92, 0.97, 0.95, 0.78], fl: 0 },
  { id: 'taronger', n: 'taronger', g: { h: 1.4, r: 0.12, n: 5, y0: 1.25, len: [1.1, 1.4], up: 0.82, out: 0.55, rad: 0.08, kl: 0.66, dh: 2 },
    l: { nN: 520, sN: [0.34, 0.54], DN: 0.68, ys: [-1.1, 0.8], nF: 64, sF: [0.75, 1.1], DF: 0.75 }, imp: [2.2, 5.0],
    bark: [0.55, 0.53, 0.5, 0.2], leaf: [0.95, 1.0, 0.95, 0.9], fl: 0 },
  { id: 'palmera', n: 'palmera', g: { h: 11.5, r: 0.27, n: 0, y0: 11.5, len: [0, 0], up: 0, out: 0, rad: 0, kl: 0, dh: 0 },
    l: { nN: 22, sN: [3.6, 4.4], nF: 12, sF: [3.6, 4.4] }, imp: [3.6, 14],
    bark: [0.6, 0.5, 0.4, 0.1], leaf: [1, 1, 1, 0.85], fl: 0 },
  { id: 'jacaranda', n: 'jacaranda', g: { h: 3.0, r: 0.2, n: 4, y0: 2.8, len: [2.4, 3.0], up: 0.62, out: 0.8, rad: 0.13, kl: 0.7, dh: 3 },
    l: { nN: 460, sN: [0.4, 0.72], DN: 1.25, ys: [-0.5, 0.7], nF: 70, sF: [1.1, 1.7], DF: 1.3 }, imp: [4.6, 9.5],
    bark: [0.55, 0.5, 0.47, 0.15], leaf: [1, 1, 1, 0.9], fl: 0.55 },
  { id: 'tipuana', n: 'tipuana', g: { h: 4.0, r: 0.3, n: 6, y0: 3.7, len: [3.6, 4.4], up: 0.45, out: 0.9, rad: 0.18, kl: 0.66, dh: 3 },
    l: { nN: 640, sN: [0.55, 0.95], DN: 1.1, ys: [-0.4, 0.6], nF: 95, sF: [1.4, 2.2], DF: 1.25 }, imp: [6.4, 12.5],
    bark: [0.62, 0.56, 0.5, 0.15], leaf: [1.0, 1.02, 0.95, 0.85], fl: 0 },
  { id: 'pi', n: 'pi pinyer', g: { h: 7.2, r: 0.3, n: 6, y0: 6.6, len: [2.7, 3.4], up: 0.42, out: 0.92, rad: 0.15, kl: 0.72, dh: 2, lean: 0.9 },
    l: { nN: 600, sN: [0.55, 0.9], DN: 1.2, ys: [-0.25, 0.35], nF: 90, sF: [1.4, 2.1], DF: 1.3 }, imp: [5.8, 12.5],
    bark: [0.78, 0.5, 0.36, 0.1], leaf: [0.9, 0.95, 0.9, 0.85], fl: 0 },
];

// ---------------------------------------------------------------- reparto por calle
const FAM = {};
const fam = (f, list) => { for (const n of list) FAM[n] = f; };
fam('eixample', ["la Dreta de l'Eixample", "l'Antiga Esquerra de l'Eixample", "la Nova Esquerra de l'Eixample", 'Sant Antoni', 'el Fort Pienc', 'la Sagrada Família']);
fam('gracia', ['la Vila de Gràcia', "el Camp d'en Grassot i Gràcia Nova", 'la Salut', 'Vallcarca i els Penitents', 'el Coll']);
fam('ciutat_vella', ['el Barri Gòtic', 'Sant Pere, Santa Caterina i la Ribera']);
fam('raval', ['el Raval']); fam('barceloneta', ['la Barceloneta']);
fam('poble_sec', ['el Poble-sec', 'la Font de la Guatlla', 'la Marina de Port', 'la Marina del Prat Vermell']);
fam('sants', ['Sants', 'Hostafrancs', 'la Bordeta', 'Sants - Badal']);
fam('les_corts', ['les Corts', 'la Maternitat i Sant Ramon']);
fam('sant_gervasi', ['Sant Gervasi - Galvany', 'Sant Gervasi - la Bonanova', 'el Putxet i el Farró', 'les Tres Torres']);
fam('sarria_pedralbes', ['Sarrià', 'Pedralbes', 'Vallvidrera, el Tibidabo i les Planes']);
fam('poblenou', ['el Poblenou', 'el Parc i la Llacuna del Poblenou', 'Provençals del Poblenou', 'la Vila Olímpica del Poblenou', 'Diagonal Mar i el Front Marítim del Poblenou']);
const SEA = new Set(['la Vila Olímpica del Poblenou', 'Diagonal Mar i el Front Marítim del Poblenou', 'la Barceloneta']);
//                    plàtan lledon tarong palm  jacar  tipua  pi
const W = {
  eixample:         [0.66, 0.07, 0.04, 0.02, 0.10, 0.09, 0.02],
  gracia:           [0.18, 0.40, 0.20, 0.03, 0.12, 0.03, 0.04],
  ciutat_vella:     [0.22, 0.38, 0.26, 0.08, 0.04, 0.00, 0.02],
  raval:            [0.25, 0.36, 0.24, 0.08, 0.05, 0.00, 0.02],
  barceloneta:      [0.15, 0.20, 0.15, 0.40, 0.05, 0.00, 0.05],
  poblenou:         [0.26, 0.15, 0.08, 0.18, 0.13, 0.15, 0.05],
  poble_sec:        [0.24, 0.20, 0.10, 0.05, 0.08, 0.07, 0.26],
  sants:            [0.40, 0.20, 0.10, 0.03, 0.12, 0.10, 0.05],
  les_corts:        [0.36, 0.18, 0.08, 0.04, 0.12, 0.12, 0.10],
  sant_gervasi:     [0.28, 0.16, 0.10, 0.05, 0.16, 0.10, 0.15],
  sarria_pedralbes: [0.24, 0.16, 0.10, 0.04, 0.14, 0.10, 0.22],
  sant_andreu:      [0.36, 0.20, 0.10, 0.05, 0.10, 0.12, 0.07],
  horta_guinardo:   [0.30, 0.20, 0.10, 0.04, 0.10, 0.10, 0.16],
  nou_barris:       [0.34, 0.22, 0.10, 0.04, 0.10, 0.12, 0.08],
  periferia:        [0.40, 0.20, 0.10, 0.05, 0.08, 0.10, 0.07],
};
function familyOf(b) {
  if (!b) return 'periferia';
  if (FAM[b.n]) return FAM[b.n];
  if (b.d === 'Sant Andreu' || b.d === 'Sant Martí') return 'sant_andreu';
  if (b.d === 'Horta-Guinardó') return 'horta_guinardo';
  if (b.d === 'Nou Barris') return 'nou_barris';
  return 'periferia';
}
// especie de un tramo (ax, az)–(bx, bz): la recta (ángulo y distancia al origen, redondeados) y el tramo de ~320 m a lo largo
// de ella dan la clave, así que toda la calle (aunque esté partida en muchos tramos y celdas) cae igual
const segCache = new Map();
function pick(s, ax, az, bx, bz, hw, rambla) {
  let v = segCache.get(s); if (v !== undefined) return v;
  let dx = bx - ax, dz = bz - az; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
  if (dz < 0 || (dz === 0 && dx < 0)) { dx = -dx; dz = -dz; }       // ángulo en [0, π)
  const th = Math.atan2(dz, dx), c = -ax * dz + az * dx, mx = (ax + bx) / 2, mz = (az + bz) / 2, al = mx * dx + mz * dz;
  const B = window.BCN_BARRI ? window.BCN_BARRI.at(mx, mz) : null, f = familyOf(B);
  const w = (B && SEA.has(B.n) ? [0.12, 0.12, 0.08, 0.42, 0.08, 0.13, 0.05] : W[f]).slice();
  if (rambla) { w.fill(0); w[0] = 0.85; w[3] = 0.1; w[1] = 0.05; }
  else if (hw >= 8) { w[0] *= 1.5; w[5] *= 2.2; w[3] *= 1.3; w[2] *= 0.15; w[1] *= 0.6; }
  else if (hw < 3.6) { w[2] *= 1.8; w[1] *= 1.3; w[5] *= 0.3; w[6] *= 0.4; w[0] *= 0.7; }
  seed(Math.round(th / 0.05) & 0xffff, Math.round(c / 18) | 0, Math.floor(al / 320) | 0, 71);
  let r = R() * w.reduce((a, b) => a + b, 0); v = 0;
  for (; v < 6; v++) { r -= w[v]; if (r < 0) break; }
  segCache.set(s, v); return v;
}

// ---------------------------------------------------------------- geometría
function treeGeo(sp, hi) {
  const g = sp.g, k0 = SP.indexOf(sp);
  if (k0 === 0) seedRaw(5); else seed(900 + k0, hi ? 1 : 0);
  const P = [], Nn = [], U = [], I = [];
  const ring = (c, ax, r, sides, v) => {
    let ux = -ax[2], uy = 0, uz = ax[0]; let l = Math.hypot(ux, uy, uz); if (l < 1e-4) { ux = 1; uz = 0; l = 1; } ux /= l; uz /= l;
    const wx = ax[1] * uz - ax[2] * uy, wy = ax[2] * ux - ax[0] * uz, wz = ax[0] * uy - ax[1] * ux;
    const base = P.length / 3;
    for (let k = 0; k <= sides; k++) { const a = k / sides * 6.2832, ca = Math.cos(a), sa = Math.sin(a);
      const nx = ux * ca + wx * sa, ny = uy * ca + wy * sa, nz = uz * ca + wz * sa;
      P.push(c[0] + nx * r, c[1] + ny * r, c[2] + nz * r); Nn.push(nx, ny, nz); U.push(k / sides, v); }
    return base;
  };
  const tube = (pts, rad, sides) => {
    let prev = -1, v = 0;
    for (let k = 0; k < pts.length; k++) {
      const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], ax = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(...ax); ax[0] /= l; ax[1] /= l; ax[2] /= l;
      if (k) v += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1], pts[k][2] - pts[k - 1][2]);
      const cur = ring(pts[k], ax, rad(k / (pts.length - 1)), sides, v);
      if (prev >= 0) for (let s = 0; s < sides; s++) I.push(prev + s, cur + s, cur + s + 1, prev + s, cur + s + 1, prev + s + 1);
      prev = cur;
    }
  };
  const lean = g.lean || 0, lx = t => lean * Math.pow(t, 1.6);
  const NT = hi ? 14 : 4, trunk = [];
  for (let k = 0; k <= NT; k++) trunk.push([lx(k / NT), k / NT * g.h, 0]);
  const rk = g.r / 0.3;
  if (sp.id === 'palmera') tube(trunk, E => g.r * (1.25 - 0.4 * E) + 0.25 * Math.pow(1 - Math.min(1, E * 8), 2), hi ? 10 : 5);
  else tube(trunk, E => rk * (0.3 * (1 - E * 0.5) + 0.2 * Math.pow(1 - Math.min(1, E * 5), 2)), hi ? 14 : 6);
  const tips = [];
  const br = (E, dir, len, rad, depth) => {
    const Pp = [E[0] + dir[0] * len, E[1] + dir[1] * len, E[2] + dir[2] * len];
    const M = [(E[0] + Pp[0]) / 2 + R(-0.25, 0.25), (E[1] + Pp[1]) / 2 + R(-0.1, 0.2), (E[2] + Pp[2]) / 2 + R(-0.25, 0.25)];
    tube([E, M, Pp], t => rad * (1 - 0.5 * t), depth === 0 ? (hi ? 9 : 5) : depth === 1 ? 5 : 3);
    if (depth >= (hi ? g.dh : 0)) { tips.push(Pp); return; }
    for (let b = 0; b < 3; b++) {
      const a = R(6.28), q = R(0.25, 0.6); let Wd = [dir[0] + Math.cos(a) * q, dir[1] + R(0.05, 0.4) * (g.up < 0.5 ? 0.4 : 1), dir[2] + Math.sin(a) * q]; const l = Math.hypot(...Wd); Wd = Wd.map(x => x / l);
      const Z = b === 0 ? 1 : R(0.55, 0.9);
      br([E[0] + (Pp[0] - E[0]) * Z, E[1] + (Pp[1] - E[1]) * Z, E[2] + (Pp[2] - E[2]) * Z], Wd, len * g.kl, rad * 0.55, depth + 1);
    }
  };
  for (let k = 0; k < g.n; k++) { const a = k * 6.2832 / g.n + R(0.3); br([lx(g.y0 / g.h), g.y0 + k * 0.1, 0], [Math.cos(a) * g.out, g.up, Math.sin(a) * g.out], R(g.len[0], g.len[1]), g.rad, 0); }
  if (sp.id === 'palmera') {        // falda de hojas secas bajo la corona (corteza teñida)
    const top = g.h; tube([[0, top - 1.9, 0], [0, top - 0.9, 0], [0, top + 0.1, 0]], t => 0.3 + 0.32 * Math.sin(t * 3.1416) + 0.12 * t, hi ? 10 : 5);
    tips.push([0, top + 0.2, 0]);
  }
  return { bark: { P: new Float32Array(P), N: new Float32Array(Nn), U: new Float32Array(U), I: new Uint32Array(I) }, tips };
}
// tarjetas de hojas alrededor de las puntas de las ramas (normales hacia fuera de la copa)
function leafGeo(sp, tips, far) {
  const L = sp.l, k0 = SP.indexOf(sp);
  if (k0 === 0) seedRaw(41); else seed(950 + k0, far ? 1 : 0);
  const n = far ? L.nF : L.nN, s0 = (far ? L.sF : L.sN)[0], s1 = (far ? L.sF : L.sN)[1], D = far ? L.DF : L.DN;
  const fy = tips.reduce((a, t) => a + t[1], 0) / tips.length;
  const P = [], N = [], U = [], I = [];
  for (let q = 0; q < n; q++) {
    const Wt = tips[Math.floor(R() * tips.length)], x = Wt[0] + R(-D, D), y = Wt[1] + R(D * L.ys[0], D * L.ys[1]), z = Wt[2] + R(-D, D), s = R(s0, s1), t = R(6.28), c = R(-1.2, 1.2);
    const a = [Math.cos(t), 0, Math.sin(t)], b = [-Math.sin(t) * Math.sin(c), Math.cos(c), Math.cos(t) * Math.sin(c)], base = P.length / 3;
    for (const [w, e] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const px = x + (a[0] * w + b[0] * e) * s, py = y + (a[1] * w + b[1] * e) * s, pz = z + (a[2] * w + b[2] * e) * s;
      P.push(px, py, pz); const nx = px, ny = py - fy + 1.2, nz = pz, l = Math.hypot(nx, ny, nz); N.push(nx / l, ny / l, nz / l); U.push((w + 1) / 2, (e + 1) / 2);
    }
    I.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return { P: new Float32Array(P), N: new Float32Array(N), U: new Float32Array(U), I: new Uint32Array(I) };
}
// hojas de palmera: tiras curvadas que salen de la corona y caen (uv: u a lo ancho, v a lo largo)
function frondGeo(sp, far) {
  seed(970, far ? 1 : 0);
  const n = far ? sp.l.nF : sp.l.nN, seg = far ? 2 : 4, top = sp.g.h + 0.15;
  const P = [], N = [], U = [], I = [];
  for (let f = 0; f < n; f++) {
    const az = f * 2.39996 + R(-0.2, 0.2), inner = f / n, e0 = 1.05 - inner * 1.35 + R(-0.12, 0.12), len = R(sp.l.sN[0], sp.l.sN[1]) * (0.75 + 0.35 * inner), w = R(0.55, 0.75);
    const cx = Math.cos(az), cz = Math.sin(az), sx = -cz, sz = cx;
    let p = [cx * 0.25, top + R(-0.2, 0.3), cz * 0.25], el = e0; const base = P.length / 3;
    for (let k = 0; k <= seg; k++) {
      const t = k / seg, ww = w * Math.sin(Math.min(1, 0.25 + t) * 2.6) * (k === seg ? 0.25 : 1), v = Math.cos(el), up = 0.22 * ww;
      const nx = cx * 0.45, ny = 1, nz = cz * 0.45, nl = Math.hypot(nx, ny, nz);
      P.push(p[0] - sx * ww, p[1] + up, p[2] - sz * ww, p[0] + sx * ww, p[1] + up, p[2] + sz * ww);
      N.push(nx / nl, ny / nl, nz / nl, nx / nl, ny / nl, nz / nl); U.push(0, t, 1, t);
      if (k < seg) { const d = len / seg; p = [p[0] + cx * v * d, p[1] + Math.sin(el) * d, p[2] + cz * v * d]; el -= (0.32 + 0.25 * inner) * (4 / seg); }
    }
    for (let k = 0; k < seg; k++) { const a = base + k * 2; I.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  }
  return { P: new Float32Array(P), N: new Float32Array(N), U: new Float32Array(U), I: new Uint32Array(I) };
}
function impGeo(sp) {
  const [hwid, h] = sp.imp, P = [], N = [], U = [], I = [];
  for (const a of [0, Math.PI / 2]) { const c = Math.cos(a) * hwid, s = Math.sin(a) * hwid, base = P.length / 3;
    for (const [w, y, u, v] of [[-1, 0, 0, 0], [1, 0, 1, 0], [1, h, 1, 1], [-1, h, 0, 1]]) { P.push(c * w, y, s * w); N.push(-s / hwid, 0.3, c / hwid); U.push(u, v); }
    I.push(base, base + 1, base + 2, base, base + 2, base + 3); }
  return { P: new Float32Array(P), N: new Float32Array(N), U: new Float32Array(U), I: new Uint32Array(I) };
}
// los tres niveles de una especie: { nearBark, nearLeaf, farBark, farLeaf, imp }
function build(k) {
  const sp = SP[k], gHi = treeGeo(sp, true), gLo = treeGeo(sp, false), palm = sp.id === 'palmera';
  return { nearBark: gHi.bark, nearLeaf: palm ? frondGeo(sp, false) : leafGeo(sp, gHi.tips, false),
           farBark: gLo.bark, farLeaf: palm ? frondGeo(sp, true) : leafGeo(sp, gHi.tips, true), imp: impGeo(sp) };
}

// ---------------------------------------------------------------- texturas (canvas)
const rgb = (r, g, b, a) => a === undefined ? `rgb(${r | 0},${g | 0},${b | 0})` : `rgba(${r | 0},${g | 0},${b | 0},${a})`;
function canvas(size) { const cv = document.createElement('canvas'); cv.width = cv.height = size; return [cv, cv.getContext('2d', { willReadFrequently: true })]; }
// plátano: atlas dibujado como en Transeúnte (cerca: hojas grandes; lejos: más y menudas)
function platanCanvas(far, size) {
  const [cv, g] = canvas(size);
  seedRaw(far ? 62 : 61);
  const leaf = (x, y, sc, rot, gr) => {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.beginPath(); g.moveTo(0, 1);
    for (const [S, M] of [[-2.7, .36], [-2.15, .62], [-1.75, .42], [-1.05, .92], [-.72, .5], [-.3, .78], [0, 1.05], [.3, .78], [.72, .5], [1.05, .92], [1.75, .42], [2.15, .62], [2.7, .36]]) g.lineTo(Math.sin(S) * M, -Math.cos(S) * M);
    g.closePath();
    const xr = gr * 0.72 + R(-10, 10), xg = gr, xb = gr * 0.3, T = g.createLinearGradient(0, -1, 0, 1);
    T.addColorStop(0, `rgb(${xr * 1.18 | 0},${xg * 1.16 | 0},${xb * 1.1 | 0})`); T.addColorStop(1, `rgb(${xr * 0.78 | 0},${xg * 0.8 | 0},${xb * 0.8 | 0})`);
    g.fillStyle = T; g.fill(); g.strokeStyle = `rgba(${xr * 1.5 | 0},${xg * 1.38 | 0},${xb * 1.3 | 0},.55)`; g.lineWidth = 0.028; g.beginPath();
    for (const S of [-1.05, -0.3, 0, 0.3, 1.05]) { g.moveTo(0, 0.55); g.lineTo(Math.sin(S) * 0.85, -Math.cos(S) * 0.85); }
    g.stroke(); g.restore();
  };
  const k = size / 1024, n = far ? 240 : 96;
  for (let u = 0; u < n; u++) { const f = R(6.28), rr = Math.pow(R(), 0.55) * size * 0.44; leaf(size / 2 + Math.cos(f) * rr, size / 2 + Math.sin(f) * rr, (far ? R(44, 74) : R(60, 104)) * k, R(6.28), 74 + R(82)); }
  return cv;
}
// hoja simple (lanceolada u ovalada) con nervio: base de las demás especies de hoja ancha
function ovalLeaf(g, x, y, sc, rot, w, col, gloss) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.beginPath(); g.moveTo(0, 1);
  g.quadraticCurveTo(w * 1.3, 0.1, 0, -1); g.quadraticCurveTo(-w * 1.3, 0.1, 0, 1); g.closePath();
  const T = g.createLinearGradient(-w, -1, w, 1); T.addColorStop(0, rgb(col[0] * (1.1 + gloss), col[1] * (1.1 + gloss), col[2] * (1.1 + gloss))); T.addColorStop(1, rgb(col[0] * 0.75, col[1] * 0.78, col[2] * 0.75));
  g.fillStyle = T; g.fill(); g.strokeStyle = rgb(col[0] * 1.35, col[1] * 1.3, col[2] * 1.2, 0.5); g.lineWidth = 0.04; g.beginPath(); g.moveTo(0, 0.95); g.lineTo(0, -0.9); g.stroke(); g.restore();
}
function leafCanvas(k, far) {
  if (k === 0) return platanCanvas(far, 1024);
  const S = 512, [cv, g] = canvas(S), sp = SP[k];
  seed(990 + k, far ? 1 : 0);
  const disc = () => { const f = R(6.28), rr = Math.pow(R(), 0.55) * S * 0.44; return [S / 2 + Math.cos(f) * rr, S / 2 + Math.sin(f) * rr]; };
  const sc = far ? 0.62 : 1;
  if (sp.id === 'lledoner') {          // hoja lanceolada, verde algo grisáceo, menuda y apretada
    for (let u = 0; u < (far ? 460 : 300); u++) { const [x, y] = disc(), gr = 70 + R(80); ovalLeaf(g, x, y, R(17, 27) * sc, R(6.28), 0.42, [gr * 0.66, gr, gr * 0.44], 0.05); }
  } else if (sp.id === 'taronger') {   // hoja ovalada brillante, verde oscuro, con naranjas
    for (let u = 0; u < (far ? 480 : 340); u++) { const [x, y] = disc(), gr = 55 + R(70); ovalLeaf(g, x, y, R(16, 24) * sc, R(6.28), 0.55, [gr * 0.48, gr, gr * 0.3], 0.25); }
    for (let u = 0; u < (far ? 30 : 16); u++) { const [x, y] = disc(), r = R(11, 15) * sc;
      const T = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r); T.addColorStop(0, '#ffb24a'); T.addColorStop(1, '#d9660f');
      g.fillStyle = T; g.beginPath(); g.arc(x, y, r, 0, 6.29); g.fill(); }
  } else if (sp.id === 'palmera') {    // hoja de palmera: raquis central y foliolos que se abren hacia arriba (u a lo ancho, v a lo largo)
    g.strokeStyle = rgb(120, 125, 70); g.lineWidth = 7; g.beginPath(); g.moveTo(S / 2, 0); g.lineTo(S / 2, S); g.stroke();
    for (let v = 6; v < S - 4; v += 7) { const t = v / S, len = S * 0.5 * Math.sin(Math.min(1, 0.15 + t) * 2.8) * R(0.85, 1);
      for (const sd of [-1, 1]) { const gr = 85 + R(70); g.strokeStyle = rgb(gr * 0.6, gr, gr * 0.38); g.lineWidth = R(4, 6);
        g.beginPath(); g.moveTo(S / 2, v); g.quadraticCurveTo(S / 2 + sd * len * 0.6, v + len * 0.12, S / 2 + sd * len, v + len * 0.35 + R(-6, 6)); g.stroke(); } }
  } else if (sp.id === 'jacaranda') {  // hoja bipinnada (foliolos menudos, verde claro) y racimos de flor lila
    for (let u = 0; u < (far ? 170 : 105); u++) { const [x, y] = disc(), a = R(6.28), L = R(40, 70) * sc, gr = 95 + R(70);
      for (let t = 0; t < 1; t += 0.09) { const px = x + Math.cos(a) * L * t, py = y + Math.sin(a) * L * t;
        for (const sd of [-1, 1]) ovalLeaf(g, px + Math.cos(a + sd * 1.3) * 6 * sc, py + Math.sin(a + sd * 1.3) * 6 * sc, 5.5 * sc, a + sd * 1.3 + 1.57, 0.45, [gr * 0.62, gr, gr * 0.42], 0.1); } }
    for (let u = 0; u < (far ? 60 : 34); u++) { const [x, y] = disc();
      for (let q = 0; q < 26; q++) { const f = R(6.28), r = R(18) * sc; g.fillStyle = rgb(150 + R(30), 115 + R(25), 205 + R(35)); g.beginPath(); g.arc(x + Math.cos(f) * r, y + Math.sin(f) * r, R(3.5, 6) * sc, 0, 6.29); g.fill(); } }
  } else if (sp.id === 'tipuana') {    // hoja pinnada: foliolos ovalados, verde amarillento
    for (let u = 0; u < (far ? 240 : 150); u++) { const [x, y] = disc(), a = R(6.28), L = R(45, 75) * sc, gr = 100 + R(75);
      for (let t = 0; t < 1; t += 0.12) { const px = x + Math.cos(a) * L * t, py = y + Math.sin(a) * L * t;
        for (const sd of [-1, 1]) ovalLeaf(g, px + Math.cos(a + sd * 1.4) * 8 * sc, py + Math.sin(a + sd * 1.4) * 8 * sc, 8 * sc, a + sd * 1.4 + 1.57, 0.5, [gr * 0.74, gr, gr * 0.32], 0.1); } }
  } else if (sp.id === 'pi') {         // penachos de acículas largas, verde oscuro
    for (let u = 0; u < (far ? 270 : 170); u++) { const [x, y] = disc(), gr = 60 + R(65), L = R(30, 50) * sc;
      g.strokeStyle = rgb(gr * 0.55, gr, gr * 0.42); g.lineWidth = 3.2 * sc + 0.8;
      for (let q = 0; q < 26; q++) { const a = R(6.28), l = L * R(0.6, 1); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * 0.8); g.stroke(); } }
  }
  return cv;
}
// impostor (silueta lejana): tronco y masa de copa con manchas de luz y sombra
function impCanvas(k) {
  const sp = SP[k];
  if (k === 0) {
    const S = 512, [cv, g] = canvas(S); seedRaw(63);
    g.fillStyle = '#6d5a44'; g.beginPath(); g.moveTo(S * 0.47, S); g.lineTo(S * 0.53, S); g.lineTo(S * 0.515, S * 0.45); g.lineTo(S * 0.485, S * 0.45); g.fill();
    for (let i = 0; i < 1400; i++) { const a = R(6.28), rr = Math.sqrt(R()); const x = S / 2 + Math.cos(a) * rr * S * 0.46, y = S * 0.36 + Math.sin(a) * rr * S * 0.3;
      const gr = 70 + R(90); g.fillStyle = `rgb(${gr * 0.72 | 0},${gr | 0},${gr * 0.3 | 0})`; g.beginPath(); g.arc(x, y, R(5, 13), 0, 6.3); g.fill(); }
    return cv;
  }
  const S = 256, [cv, g] = canvas(S); seed(1010 + k);
  const [hw, h] = sp.imp, px = m => S / 2 + m / hw * S / 2, py = m => S - m / h * S;   // metros → píxeles
  const trunk = (yTop, r, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(px(-r), S); g.lineTo(px(r), S); g.lineTo(px(r * 0.6), py(yTop)); g.lineTo(px(-r * 0.6), py(yTop)); g.fill(); };
  const blob = (cx, cy, rx, ry, n, rad, col) => { for (let i = 0; i < n; i++) { const a = R(6.28), rr = Math.sqrt(R()), x = cx + Math.cos(a) * rr * rx, y = cy + Math.sin(a) * rr * ry, gr = col[3] + R(col[4]) + (cy - y) / ry * 18;
    g.fillStyle = rgb(gr * col[0], gr * col[1], gr * col[2]); g.beginPath(); g.arc(px(x), py(y), R(rad[0], rad[1]), 0, 6.3); g.fill(); } };
  if (sp.id === 'palmera') {
    trunk(sp.g.h, 0.32, '#6e5b45'); g.fillStyle = '#5a4934'; g.beginPath(); g.ellipse(px(0), py(sp.g.h - 0.8), S * 0.06, S * 0.07, 0, 0, 6.3); g.fill();
    for (let f = 0; f < 22; f++) { const a = f * 2.39996, c = Math.cos(a), e = 0.9 - (f / 22) * 1.3, L = 3.4; let x = 0, y = sp.g.h + 0.2, el = e;
      const gr = 85 + R(60); g.strokeStyle = rgb(gr * 0.6, gr, gr * 0.38); g.lineWidth = 6; g.beginPath(); g.moveTo(px(x), py(y));
      for (let s = 0; s < 4; s++) { x += c * Math.cos(el) * L / 4; y += Math.sin(el) * L / 4; el -= 0.35; g.lineTo(px(x), py(y)); } g.stroke(); }
    return cv;
  }
  const c = { lledoner: [0.66, 1, 0.46, 62, 70], taronger: [0.5, 1, 0.32, 52, 60], jacaranda: [0.64, 1, 0.44, 80, 70], tipuana: [0.74, 1, 0.34, 85, 75], pi: [0.56, 1, 0.42, 55, 55] }[sp.id];
  const g0 = sp.g, top = { lledoner: 10.3, taronger: 4.7, jacaranda: 9.0, tipuana: 11.8, pi: 11.4 }[sp.id];
  if (sp.id === 'pi') { trunk(g0.h + 0.5, 0.3, '#6a4630'); blob(0.6, top - 1.1, hw * 0.92, 1.5, 900, [3, 8], c); }
  else { trunk(g0.y0 + 0.5, g0.r, '#6d5a44'); const cy = (top + g0.y0) / 2 + 0.6, ry = (top - g0.y0) / 2 + 0.3; blob(0, cy, hw * 0.92, ry, 1100, [3, 8], c);
    if (sp.id === 'jacaranda') blob(0, cy + ry * 0.2, hw * 0.75, ry * 0.7, 220, [3, 6], [0.78, 0.62, 1.0, 150, 50]);
    if (sp.id === 'taronger') blob(0, cy, hw * 0.8, ry * 0.75, 70, [2, 3.5], [1, 0.55, 0.12, 200, 40]); }
  return cv;
}

window.BCN_TREES = { SP, pick, build, leafCanvas, impCanvas, familyOf };
})();
