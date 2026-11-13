/* GTA Barcelona — Especies de árbol de calle (etapa ARB). Lo usa streets.js.
   Siete especies típicas de Barcelona (ocho mallas: la palmera tiene dos variantes), cada una con sus tres niveles de detalle
   (árbol completo, copa de tarjetas e impostor):
     0 plátano de sombra · 1 almez (lledoner) · 2 naranjo amargo · 3 palmera Washingtonia · 4 jacaranda · 5 tipuana ·
     6 pino piñonero · 7 palmera datilera (Phoenix; sale en los tramos de palmera, ~45 %).
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
// bm: corteza dibujada en el sombreador en vez de la del plátano (1 placas rojizas del pino, 2 fibra de la Washingtonia,
//     3 cicatrices de hoja de la Phoenix) · l.flat: tarjetas casi horizontales (copa en parasol) · l.mid: hojas también a
//     media rama (copa que tapa las ramas)
const SP = [
  { id: 'platan', n: 'plàtan', g: { h: 5.4, r: 0.3, n: 5, y0: 4.9, len: [3.1, 3.9], up: 0.75, out: 0.66, rad: 0.19, kl: 0.68, dh: 3 },
    l: { nN: 620, sN: [0.42, 0.78], DN: 1, ys: [-0.7, 0.8], nF: 90, sF: [1.15, 1.9], DF: 1.2 }, imp: [5.2, 12.5],
    bark: [1, 1, 1, 1], leaf: [1, 1, 1, 0.82], fl: 0 },
  { id: 'lledoner', n: 'lledoner', g: { h: 3.4, r: 0.22, n: 6, y0: 3.0, len: [2.5, 3.1], up: 0.86, out: 0.55, rad: 0.14, kl: 0.66, dh: 3 },
    l: { nN: 620, sN: [0.44, 0.76], DN: 0.95, ys: [-0.7, 0.8], nF: 95, sF: [1.1, 1.75], DF: 1.1 }, imp: [3.8, 11],
    bark: [0.72, 0.73, 0.76, 0.15], leaf: [0.8, 0.84, 0.84, 0.55], fl: 0 },
  { id: 'taronger', n: 'taronger', g: { h: 1.4, r: 0.12, n: 5, y0: 1.25, len: [1.1, 1.4], up: 0.82, out: 0.55, rad: 0.08, kl: 0.66, dh: 2 },
    l: { nN: 520, sN: [0.34, 0.54], DN: 0.68, ys: [-1.1, 0.8], nF: 64, sF: [0.75, 1.1], DF: 0.75 }, imp: [2.2, 5.0],
    bark: [0.55, 0.53, 0.5, 0.2], leaf: [0.82, 0.97, 0.78, 0.95], fl: 0 },
  { id: 'palmera', n: 'palmera', g: { h: 11.5, r: 0.27, n: 0, y0: 11.5, len: [0, 0], up: 0, out: 0, rad: 0, kl: 0, dh: 0 },
    l: { nN: 22, sN: [3.6, 4.4], nF: 12, sF: [3.6, 4.4] }, imp: [3.6, 14],
    bark: [1, 1, 1, 1], bm: 2, leaf: [1, 1, 1, 0.85], fl: 0 },
  { id: 'jacaranda', n: 'jacaranda', g: { h: 3.0, r: 0.2, n: 4, y0: 2.8, len: [2.4, 3.0], up: 0.62, out: 0.8, rad: 0.13, kl: 0.7, dh: 3 },
    l: { nN: 460, sN: [0.4, 0.72], DN: 1.25, ys: [-0.5, 0.7], nF: 70, sF: [1.1, 1.7], DF: 1.3 }, imp: [4.6, 9.5],
    bark: [0.55, 0.5, 0.47, 0.15], leaf: [1.06, 1.1, 0.96, 0.9], fl: 0.55 },
  { id: 'tipuana', n: 'tipuana', g: { h: 4.2, r: 0.3, n: 6, y0: 3.8, len: [3.5, 4.3], up: 0.55, out: 0.86, rad: 0.11, kl: 0.7, dh: 2 },
    l: { nN: 1250, sN: [0.45, 0.8], DN: 1.7, ys: [-0.95, 0.55], mid: 1, nF: 130, sF: [1.4, 2.2], DF: 1.5 }, imp: [6.6, 12.5],
    bark: [0.62, 0.56, 0.5, 0.15], leaf: [0.94, 0.9, 0.8, 0.62], fl: 0 },
  { id: 'pi', n: 'pi pinyer', g: { h: 8.6, r: 0.33, n: 7, y0: 8.0, len: [3.2, 4.1], up: 0.26, out: 0.96, rad: 0.15, kl: 0.72, dh: 2, lean: 1.4 },
    l: { nN: 820, sN: [0.6, 1.0], DN: 1.25, ys: [-0.2, 0.3], flat: 1, mid: 1, nF: 95, sF: [1.5, 2.2], DF: 1.3 }, imp: [6.8, 12.5],
    bark: [1, 1, 1, 1], bm: 1, leaf: [0.74, 0.86, 0.8, 0.72], fl: 0 },
  // 7: palmera datilera (Phoenix): tronco grueso con cicatrices de hoja, corona de muchas hojas largas y arqueadas
  { id: 'phoenix', n: 'palmera datilera', g: { h: 8.6, r: 0.42, n: 0, y0: 8.6, len: [0, 0], up: 0, out: 0, rad: 0, kl: 0, dh: 0 },
    l: { nN: 40, sN: [4.4, 5.4], nF: 18, sF: [4.4, 5.4] }, imp: [5.2, 12],
    bark: [1, 1, 1, 1], bm: 3, leaf: [0.8, 0.92, 0.88, 0.78], fl: 0 },
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
  // G1V3: frente marítimo (Barceloneta, Vila Olímpica, Diagonal Mar): paseos y calles anchas con palmeras (Washingtonia en fila
  // y Phoenix), como el Passeig Marítim de las fotos del usuario; antes el paseo peatonal salía de plátanos
  if (B && SEA.has(B.n) && (rambla || hw >= 6)) { w.fill(0); w[3] = 1; }
  else if (rambla) { w.fill(0); w[0] = 0.85; w[3] = 0.1; w[1] = 0.05; }
  else if (hw >= 8) { w[0] *= 1.5; w[5] *= 2.2; w[3] *= 1.3; w[2] *= 0.15; w[1] *= 0.6; }
  // REV: en el Eixample las calles de 20 m tienen calzada estrecha en los datos (hw ≈ 3) pero aceras anchas con plátanos: sin el
  // ajuste de calle estrecha (que llenaba calles enteras de naranjos y, desde el aire, las dejaba peladas y, de noche, en franjas de luz)
  else if (hw < 3.6 && f !== 'eixample') { w[2] *= 1.8; w[1] *= 1.3; w[5] *= 0.3; w[6] *= 0.4; w[0] *= 0.7; }
  seed(Math.round(th / 0.05) & 0xffff, Math.round(c / 18) | 0, Math.floor(al / 320) | 0, 71);
  let r = R() * w.reduce((a, b) => a + b, 0); v = 0;
  for (; v < 6; v++) { r -= w[v]; if (r < 0) break; }
  if (v === 3 && R() < 0.45) v = 7;                                   // palmera: Washingtonia o Phoenix (por tramo)
  segCache.set(s, v); return v;
}

// ---------------------------------------------------------------- geometría
function treeGeo(sp, hi) {
  const g = sp.g, k0 = SP.indexOf(sp);
  if (k0 === 0) seedRaw(5); else seed(900 + k0, hi ? 1 : 0);
  const P = [], Nn = [], U = [], I = [];
  // us: escala de la u (vuelta al tronco). Con corteza del sombreador (bm) las ramas la reducen con su radio, para que las
  // placas o rombos tengan el mismo tamaño en el tronco y en las ramas; el plátano y las de corteza de textura, como antes
  const ring = (c, ax, r, sides, v, us) => {
    let ux = -ax[2], uy = 0, uz = ax[0]; let l = Math.hypot(ux, uy, uz); if (l < 1e-4) { ux = 1; uz = 0; l = 1; } ux /= l; uz /= l;
    const wx = ax[1] * uz - ax[2] * uy, wy = ax[2] * ux - ax[0] * uz, wz = ax[0] * uy - ax[1] * ux;
    const base = P.length / 3;
    for (let k = 0; k <= sides; k++) { const a = k / sides * 6.2832, ca = Math.cos(a), sa = Math.sin(a);
      const nx = ux * ca + wx * sa, ny = uy * ca + wy * sa, nz = uz * ca + wz * sa;
      P.push(c[0] + nx * r, c[1] + ny * r, c[2] + nz * r); Nn.push(nx, ny, nz); U.push(k / sides * us, v); }
    return base;
  };
  const tube = (pts, rad, sides, us = 1) => {
    let prev = -1, v = 0;
    for (let k = 0; k < pts.length; k++) {
      const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], ax = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(...ax); ax[0] /= l; ax[1] /= l; ax[2] /= l;
      if (k) v += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1], pts[k][2] - pts[k - 1][2]);
      const cur = ring(pts[k], ax, rad(k / (pts.length - 1)), sides, v, us);
      if (prev >= 0) for (let s = 0; s < sides; s++) I.push(prev + s, cur + s, cur + s + 1, prev + s, cur + s + 1, prev + s + 1);
      prev = cur;
    }
  };
  const lean = g.lean || 0, lx = t => lean * Math.pow(t, 1.6);
  const NT = hi ? 14 : 4, trunk = [];
  for (let k = 0; k <= NT; k++) trunk.push([lx(k / NT), k / NT * g.h, 0]);
  const rk = g.r / 0.3;
  if (sp.id === 'phoenix') tube(trunk, E => g.r * (1.08 - 0.12 * E) + 0.22 * Math.pow(1 - Math.min(1, E * 6), 2), hi ? 12 : 6);
  else if (sp.id === 'palmera') tube(trunk, E => g.r * (1.25 - 0.4 * E) + 0.25 * Math.pow(1 - Math.min(1, E * 8), 2), hi ? 10 : 5);
  else tube(trunk, E => rk * (0.3 * (1 - E * 0.5) + 0.2 * Math.pow(1 - Math.min(1, E * 5), 2)), hi ? 14 : 6);
  const tips = [], mids = [];
  const br = (E, dir, len, rad, depth) => {
    const Pp = [E[0] + dir[0] * len, E[1] + dir[1] * len, E[2] + dir[2] * len];
    const M = [(E[0] + Pp[0]) / 2 + R(-0.25, 0.25), (E[1] + Pp[1]) / 2 + R(-0.1, 0.2), (E[2] + Pp[2]) / 2 + R(-0.25, 0.25)];
    tube([E, M, Pp], t => rad * (1 - 0.5 * t), depth === 0 ? (hi ? 9 : 5) : depth === 1 ? 5 : 3, sp.bm ? Math.max(0.2, rad / g.r) : 1);
    if (depth >= 1 || g.dh <= 2) mids.push(M);
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
  } else if (sp.id === 'phoenix') {  // «piña» de bases de hoja bajo la corona
    const top = g.h; tube([[0, top - 1.2, 0], [0, top - 0.5, 0], [0, top + 0.25, 0]], t => g.r * 0.95 + 0.2 * Math.sin(t * 3.1416), hi ? 12 : 6);
    tips.push([0, top + 0.3, 0]);
  }
  return { bark: { P: new Float32Array(P), N: new Float32Array(Nn), U: new Float32Array(U), I: new Uint32Array(I) }, tips, mids };
}
// tarjetas de hojas alrededor de las puntas de las ramas (normales hacia fuera de la copa)
function leafGeo(sp, tips0, far, mids) {
  const tips = sp.l.mid && mids ? tips0.concat(mids) : tips0;
  const L = sp.l, k0 = SP.indexOf(sp);
  if (k0 === 0) seedRaw(41); else seed(950 + k0, far ? 1 : 0);
  const n = far ? L.nF : L.nN, s0 = (far ? L.sF : L.sN)[0], s1 = (far ? L.sF : L.sN)[1], D = far ? L.DF : L.DN;
  const fy = tips.reduce((a, t) => a + t[1], 0) / tips.length;
  const P = [], N = [], U = [], I = [];
  for (let q = 0; q < n; q++) {
    const Wt = tips[Math.floor(R() * tips.length)], x = Wt[0] + R(-D, D), y = Wt[1] + R(D * L.ys[0], D * L.ys[1]), z = Wt[2] + R(-D, D), s = R(s0, s1), t = R(6.28), c0 = R(-1.2, 1.2), c = L.flat ? Math.sign(c0 || 1) * (0.85 + Math.abs(c0) * 0.42) : c0;
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
  const ph = sp.id === 'phoenix'; seed(ph ? 975 : 970, far ? 1 : 0);
  const n = far ? sp.l.nF : sp.l.nN, seg = far ? 2 : 4, top = sp.g.h + 0.15;
  const P = [], N = [], U = [], I = [];
  for (let f = 0; f < n; f++) {
    const az = f * 2.39996 + R(-0.2, 0.2), inner = f / n, e0 = (ph ? 1.25 - inner * 1.15 : 1.05 - inner * 1.35) + R(-0.12, 0.12), len = R(sp.l.sN[0], sp.l.sN[1]) * (0.75 + 0.35 * inner), w = ph ? R(0.5, 0.65) : R(0.55, 0.75);
    const cx = Math.cos(az), cz = Math.sin(az), sx = -cz, sz = cx;
    let p = [cx * 0.25, top + R(-0.2, 0.3), cz * 0.25], el = e0; const base = P.length / 3;
    for (let k = 0; k <= seg; k++) {
      const t = k / seg, ww = w * Math.sin(Math.min(1, 0.25 + t) * 2.6) * (k === seg ? 0.25 : 1), v = Math.cos(el), up = 0.22 * ww;
      const nx = cx * 0.45, ny = 1, nz = cz * 0.45, nl = Math.hypot(nx, ny, nz);
      P.push(p[0] - sx * ww, p[1] + up, p[2] - sz * ww, p[0] + sx * ww, p[1] + up, p[2] + sz * ww);
      N.push(nx / nl, ny / nl, nz / nl, nx / nl, ny / nl, nz / nl); U.push(0, t, 1, t);
      if (k < seg) { const d = len / seg; p = [p[0] + cx * v * d, p[1] + Math.sin(el) * d, p[2] + cz * v * d]; el -= (ph ? 0.42 + 0.18 * inner : 0.32 + 0.25 * inner) * (4 / seg); }
    }
    for (let k = 0; k < seg; k++) { const a = base + k * 2; I.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  }
  return { P: new Float32Array(P), N: new Float32Array(N), U: new Float32Array(U), I: new Uint32Array(I) };
}
function impGeo(sp) {
  const [hwid, h] = sp.imp, P = [], N = [], U = [], I = [];
  for (const a of [0, Math.PI / 3, 2 * Math.PI / 3]) { const c = Math.cos(a) * hwid, s = Math.sin(a) * hwid, base = P.length / 3;
    for (const [w, y, u, v] of [[-1, 0, 0, 0], [1, 0, 1, 0], [1, h, 1, 1], [-1, h, 0, 1]]) { P.push(c * w, y, s * w); N.push(-s / hwid, 0.3, c / hwid); U.push(u, v); }
    I.push(base, base + 1, base + 2, base, base + 2, base + 3); }
  return { P: new Float32Array(P), N: new Float32Array(N), U: new Float32Array(U), I: new Uint32Array(I) };
}
// los tres niveles de una especie: { nearBark, nearLeaf, farBark, farLeaf, imp }
function build(k) {
  const sp = SP[k], gHi = treeGeo(sp, true), gLo = treeGeo(sp, false), palm = sp.id === 'palmera' || sp.id === 'phoenix';
  return { nearBark: gHi.bark, nearLeaf: palm ? frondGeo(sp, false) : leafGeo(sp, gHi.tips, false, gHi.mids),
           farBark: gLo.bark, farLeaf: palm ? frondGeo(sp, true) : leafGeo(sp, gHi.tips, true, gHi.mids), imp: impGeo(sp) };
}

// ---------------------------------------------------------------- plantón (ARB3): árbol recién plantado con tutores
// Para las calles que se quedan sin árbol adulto (tercera persona): tronco fino de ~2,3 m con cuatro ramitas y una copita de
// pocas hojas (atlas del plátano), y dos variantes de sujeción: A, tres tutores de madera en triángulo con travesaños y
// atados de goma al tronco; B, dos tutores con travesaño y protector metálico (jaula de varillas). Todo a escala 1, base en y = 0.
// Devuelve { trunk, leaf, stakesA, stakesB, guard } (cada uno P/N/U/I) para cinco mallas de instancias en streets.js
function sapling() {
  seed(991, 3);
  const mk = () => ({ P: [], N: [], U: [], I: [] });
  const tube = (G, pts, rad, sides, u0 = 0) => {   // u0: columna del atlas (0 madera o corteza, 0,5 cinta del atado)
    let prev = -1, v = 0;
    for (let k = 0; k < pts.length; k++) {
      const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], ax = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(...ax); ax[0] /= l; ax[1] /= l; ax[2] /= l;
      if (k) v += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1], pts[k][2] - pts[k - 1][2]);
      let ux = -ax[2], uz = ax[0], ul = Math.hypot(ux, uz); if (ul < 1e-4) { ux = 1; uz = 0; ul = 1; } ux /= ul; uz /= ul;
      const wx = ax[1] * uz, wy = ax[2] * ux - ax[0] * uz, wz = -ax[1] * ux, r = rad(k / (pts.length - 1)), c = pts[k], base = G.P.length / 3;
      for (let q = 0; q <= sides; q++) { const an = q / sides * 6.2832, ca = Math.cos(an), sa = Math.sin(an), nx = ux * ca + wx * sa, ny = wy * sa, nz = uz * ca + wz * sa;
        G.P.push(c[0] + nx * r, c[1] + ny * r, c[2] + nz * r); G.N.push(nx, ny, nz); G.U.push(u0 + q / sides * 0.25, v * 2); }
      if (prev >= 0) for (let q = 0; q < sides; q++) G.I.push(prev + q, base + q, base + q + 1, prev + q, base + q + 1, prev + q + 1);
      prev = base;
    }
  };
  const rod = (G, a, b, r, sides, u0 = 0) => tube(G, [a, b], () => r, sides, u0);
  const trunk = mk(), leaf = mk(), stakesA = mk(), stakesB = mk(), guard = mk();
  // tronco: algo torcido, de 3,5 a 1,2 cm de radio, y cuatro ramitas en la punta
  const H = 2.3, tp = [];
  for (let k = 0; k <= 6; k++) { const t = k / 6; tp.push([0.03 * Math.sin(t * 4.1) * t, t * H, 0.025 * Math.sin(t * 3.3 + 1) * t]); }
  tube(trunk, tp, t => 0.036 - 0.024 * t, 6);
  const top = tp[6], tips = [top];
  for (let b = 0; b < 4; b++) { const a = b * 1.57 + R(-0.4, 0.4), y0 = H - 0.12 - b * 0.11, L = R(0.32, 0.5);
    const s = [top[0] * y0 / H, y0, top[2] * y0 / H], e = [s[0] + Math.cos(a) * L * 0.75, y0 + L * 0.66, s[2] + Math.sin(a) * L * 0.75];
    tube(trunk, [s, [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2 + 0.03, (s[2] + e[2]) / 2], e], t => 0.011 - 0.006 * t, 3); tips.push(e); }
  // ARB4: copa joven pequeña pero visible: ~1 m de diámetro (elipsoide de 0,5 × 0,42 m alrededor de la punta), 44 tarjetas
  // del atlas del plátano algo separadas (se ve a través) y normales hacia fuera; verde claro en el material (sapL)
  const cc = [top[0], H + 0.06, top[2]];
  // G1V3: copa más llena (96 tarjetas en 0,7 × 0,55 m)
  for (let q = 0; q < 96; q++) {
    const f = R(6.2832), ct = R(-0.75, 0.95), rr = Math.cbrt(R(0.25, 1)), x = cc[0] + Math.cos(f) * Math.sqrt(1 - ct * ct) * 0.7 * rr,
      y = cc[1] + 0.12 + ct * 0.55 * rr, z = cc[2] + Math.sin(f) * Math.sqrt(1 - ct * ct) * 0.7 * rr, sz = R(0.16, 0.26), th = R(6.28), c = R(-1, 1);
    const a = [Math.cos(th), 0, Math.sin(th)], bb = [-Math.sin(th) * Math.sin(c), Math.cos(c), Math.cos(th) * Math.sin(c)], base = leaf.P.length / 3;
    for (const [w, e] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const px = x + (a[0] * w + bb[0] * e) * sz, py = y + (a[1] * w + bb[1] * e) * sz, pz = z + (a[2] * w + bb[2] * e) * sz;
      leaf.P.push(px, py, pz); const nx = px - cc[0], ny = (py - cc[1]) * 1.2 + 0.25, nz = pz - cc[2], l = Math.hypot(nx, ny, nz); leaf.N.push(nx / l, ny / l, nz / l); leaf.U.push((w + 1) / 2 * 0.5, (e + 1) / 2 * 0.5);
    }
    leaf.I.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  // atado de cinta: anillo ancho alrededor del tronco a la altura y (columna de cinta del atlas de madera)
  const tieRing = (G, y, r) => tube(G, [[top[0] * y / H, y - 0.025, top[2] * y / H], [top[0] * y / H, y + 0.025, top[2] * y / H]], () => r, 7, 0.5);
  // A: tres tutores (Ø 6 cm, 1,8 m) en triángulo de 30 cm de radio, dos travesaños y tres atados al tronco a 1,35 m
  // G1V3: A es un solo tutor fino (Ø 4 cm, 1,55 m) junto al tronco con su atado (antes tres palos de 1,8 m con travesaños:
  // se leían como andamios en la acera)
  rod(stakesA, [0.09, -0.1, 0.0], [0.09, 1.55, 0.0], 0.02, 5); rod(stakesA, [0.09, 1.2, 0.0], [0.02, 1.2, 0.0], 0.01, 4, 0.5);
  rod(stakesA, [0.09, 1.17, 0.0], [0.09, 1.23, 0.0], 0.026, 5, 0.5);
  tieRing(stakesA, 1.2, 0.04);
  // B: dos tutores con travesaño arriba y atados; protector de 8 varillas y dos aros (Ø 40 cm, 1,2 m)
  for (const x of [-0.32, 0.32]) { rod(stakesB, [x, -0.1, 0.02], [x, 1.85, 0.02], 0.03, 5); rod(stakesB, [x, 1.4, 0.02], [x * 0.1, 1.4, 0.01], 0.012, 4, 0.5);
    rod(stakesB, [x, 1.37, 0.02], [x, 1.43, 0.02], 0.036, 5, 0.5); }
  tieRing(stakesB, 1.4, 0.04);
  rod(stakesB, [-0.32, 1.7, 0.02], [0.32, 1.7, 0.02], 0.02, 4);
  for (let k = 0; k < 8; k++) { const a = k / 8 * 6.2832; rod(guard, [Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2], [Math.cos(a) * 0.2, 1.2, Math.sin(a) * 0.2], 0.007, 3); }
  for (const y of [0.08, 0.62, 1.16]) for (let k = 0; k < 8; k++) { const a = k / 8 * 6.2832, b = (k + 1) / 8 * 6.2832;
    rod(guard, [Math.cos(a) * 0.2, y, Math.sin(a) * 0.2], [Math.cos(b) * 0.2, y, Math.sin(b) * 0.2], 0.009, 3); }
  const fin = G => ({ P: new Float32Array(G.P), N: new Float32Array(G.N), U: new Float32Array(G.U), I: new Uint32Array(G.I) });
  return { trunk: fin(trunk), leaf: fin(leaf), stakesA: fin(stakesA), stakesB: fin(stakesB), guard: fin(guard) };
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
  } else if (sp.id === 'palmera' || sp.id === 'phoenix') {   // hoja de palmera: raquis central y foliolos (u a lo ancho, v a lo largo)
    const ph = sp.id === 'phoenix';                              // Phoenix: foliolos más finos y juntos, verde algo azulado
    g.strokeStyle = ph ? rgb(150, 140, 80) : rgb(120, 125, 70); g.lineWidth = 7; g.beginPath(); g.moveTo(S / 2, 0); g.lineTo(S / 2, S); g.stroke();
    for (let v = 6; v < S - 4; v += ph ? 5 : 7) { const t = v / S, len = S * 0.5 * Math.sin(Math.min(1, 0.15 + t) * 2.8) * R(0.85, 1);
      for (const sd of [-1, 1]) { const gr = 85 + R(70); g.strokeStyle = ph ? rgb(gr * 0.58, gr * 0.95, gr * 0.55) : rgb(gr * 0.6, gr, gr * 0.38); g.lineWidth = ph ? R(2.5, 4) : R(4, 6);
        g.beginPath(); g.moveTo(S / 2, v); g.quadraticCurveTo(S / 2 + sd * len * 0.6, v + len * 0.12, S / 2 + sd * len, v + len * 0.35 + R(-6, 6)); g.stroke(); } }
  } else if (sp.id === 'jacaranda') {  // hoja bipinnada (foliolos menudos, verde claro) y racimos de flor lila
    for (let u = 0; u < (far ? 170 : 105); u++) { const [x, y] = disc(), a = R(6.28), L = R(40, 70) * sc, gr = 95 + R(70);
      for (let t = 0; t < 1; t += 0.09) { const px = x + Math.cos(a) * L * t, py = y + Math.sin(a) * L * t;
        for (const sd of [-1, 1]) ovalLeaf(g, px + Math.cos(a + sd * 1.3) * 6 * sc, py + Math.sin(a + sd * 1.3) * 6 * sc, 5.5 * sc, a + sd * 1.3 + 1.57, 0.45, [gr * 0.62, gr, gr * 0.42], 0.1); } }
    for (let u = 0; u < (far ? 170 : 60); u++) { const [x, y] = disc();   // flor: lila, densa (de lejos domina la copa)
      for (let q = 0; q < 30; q++) { const f = R(6.28), r = R(20) * sc; g.fillStyle = rgb(172 + R(30), 118 + R(25), 222 + R(30)); g.beginPath(); g.arc(x + Math.cos(f) * r, y + Math.sin(f) * r, R(3.5, 6) * sc, 0, 6.29); g.fill(); } }
  } else if (sp.id === 'tipuana') {    // hoja pinnada: foliolos ovalados, verde amarillento
    for (let u = 0; u < (far ? 420 : 280); u++) { const [x, y] = disc(), a = R(6.28), L = R(40, 66) * sc, gr = 105 + R(75);   // foliolos finos
      for (let t = 0; t < 1; t += 0.09) { const px = x + Math.cos(a) * L * t, py = y + Math.sin(a) * L * t;
        for (const sd of [-1, 1]) ovalLeaf(g, px + Math.cos(a + sd * 1.4) * 6 * sc, py + Math.sin(a + sd * 1.4) * 6 * sc, 5.5 * sc, a + sd * 1.4 + 1.57, 0.45, [gr * 0.76, gr, gr * 0.32], 0.12); } }
  } else if (sp.id === 'pi') {         // penachos de acículas largas, verde oscuro
    for (let u = 0; u < (far ? 270 : 170); u++) { const [x, y] = disc(), gr = 60 + R(65), L = R(30, 50) * sc;
      g.strokeStyle = rgb(gr * 0.55, gr, gr * 0.42); g.lineWidth = 3.2 * sc + 0.8;
      for (let q = 0; q < 26; q++) { const a = R(6.28), l = L * R(0.6, 1); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * 0.8); g.stroke(); } }
  }
  return cv;
}
// impostor (silueta lejana). G1V1: la copa son ramilletes con claroscuro (luz arriba, sombra abajo y dentro) y borde de
// hojas sueltas, sobre unas ramas que asoman; antes, ~1 100 puntos de color al azar que de lejos centelleaban («pixelado»)
function impCanvas(k) {
  const sp = SP[k], S = k === 0 ? 512 : 256, [cv, g] = canvas(S); seed(1010 + k, 7);
  const [hw, h] = sp.imp, px = m => S / 2 + m / hw * S / 2, py = m => S - m / h * S;   // metros → píxeles
  const trunk = (yTop, r, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(px(-r), S); g.lineTo(px(r), S); g.lineTo(px(r * 0.6), py(yTop)); g.lineTo(px(-r * 0.6), py(yTop)); g.fill(); };
  const clumps = (cx, cy, rx, ry, n, rc, col, under) => {
    const L = [];
    for (let i = 0; i < n; i++) { const a = R(6.28), rr = Math.sqrt(R()) * 0.86, x = cx + Math.cos(a) * rr * rx, y = cy + Math.sin(a) * rr * ry * (under && Math.sin(a) < 0 ? 0.8 : 1);
      const r = R(rc[0], rc[1]); L.push([Math.max(-hw + r, Math.min(hw - r, x)), Math.min(h - r * 0.95, y), r]); }
    L.sort((a, b) => a[1] - b[1]);
    const sc = S / 2 / hw;
    for (const [x, y, r] of L) {
      const hi = 0.62 + 0.5 * ((y - cy) / ry * 0.5 + 0.5) + R(-0.08, 0.08), X = px(x), Y = py(y), rp = r * sc;
      const T = g.createRadialGradient(X - rp * 0.3, Y - rp * 0.4, rp * 0.05, X, Y, rp);
      T.addColorStop(0, rgb(col[0] * col[3] * hi * 1.3, col[1] * col[3] * hi * 1.3, col[2] * col[3] * hi * 1.3));
      T.addColorStop(1, rgb(col[0] * col[3] * hi * 0.55, col[1] * col[3] * hi * 0.55, col[2] * col[3] * hi * 0.55));
      g.fillStyle = T; g.beginPath(); g.ellipse(X, Y, rp * 0.8, rp * 0.74, R(3.14), 0, 6.3); g.fill();
      for (let q = 0; q < 12; q++) { const a = R(6.28), d = rp * R(0.62, 0.95), gr = col[3] * hi * R(0.6, 1.25);
        g.fillStyle = rgb(col[0] * gr, col[1] * gr, col[2] * gr); g.beginPath(); g.ellipse(X + Math.cos(a) * d, Y + Math.sin(a) * d, rp * 0.16, rp * 0.09, a, 0, 6.3); g.fill(); }
    } };
  const branches = (y0, y1, n, col) => { g.strokeStyle = col; g.lineCap = 'round';
    for (let i = 0; i < n; i++) { const a = (i / n - 0.5) * 2.2 + R(-0.15, 0.15); g.lineWidth = S * 0.012; g.beginPath(); g.moveTo(px(0), py(y0));
      g.quadraticCurveTo(px(Math.sin(a) * hw * 0.25), py((y0 + y1) / 2), px(Math.sin(a) * hw * 0.62), py(y1 - Math.abs(a) * 0.8)); g.stroke(); } };
  if (sp.id === 'palmera' || sp.id === 'phoenix') {
    const ph = sp.id === 'phoenix', nf = ph ? 36 : 22;
    trunk(sp.g.h, ph ? 0.46 : 0.32, ph ? '#7a6347' : '#6e5b45'); g.fillStyle = '#5a4934'; g.beginPath(); g.ellipse(px(0), py(sp.g.h - 0.8), S * (ph ? 0.08 : 0.06), S * 0.07, 0, 0, 6.3); g.fill();
    for (let f = 0; f < nf; f++) { const a = f * 2.39996, c = Math.cos(a), e = (ph ? 1.2 - (f / nf) * 1.1 : 0.9 - (f / nf) * 1.3), L = ph ? 4.6 : 3.4; let x = 0, y = sp.g.h + 0.2, el = e;
      const gr = 85 + R(60); g.strokeStyle = ph ? rgb(gr * 0.56, gr * 0.92, gr * 0.52) : rgb(gr * 0.6, gr, gr * 0.38); g.lineWidth = ph ? 5 : 6; g.beginPath(); g.moveTo(px(x), py(y));
      for (let s = 0; s < 4; s++) { x += c * Math.cos(el) * L / 4; y += Math.sin(el) * L / 4; el -= ph ? 0.45 : 0.35; g.lineTo(px(x), py(y)); } g.stroke(); }
    return cv;
  }
  const c = { platan: [0.7, 1, 0.34, 120], lledoner: [0.62, 0.96, 0.5, 100], taronger: [0.46, 0.98, 0.3, 82], jacaranda: [0.68, 1, 0.46, 128], tipuana: [0.82, 1, 0.32, 132], pi: [0.5, 0.92, 0.5, 86] }[sp.id];
  const g0 = sp.g, top = { platan: 12.2, lledoner: 10.3, taronger: 4.7, jacaranda: 9.0, tipuana: 11.0, pi: 11.0 }[sp.id];
  if (sp.id === 'pi') { trunk(g0.h + 0.4, 0.33, '#7a4630'); branches(g0.h - 0.6, top - 1.2, 5, '#5e3a28'); clumps(0.9, top - 1.0, hw * 0.92, 1.05, 34, [0.9, 1.5], c, true); }
  else { trunk(g0.y0 + 0.5, g0.r, k === 0 ? '#8a7a62' : '#6d5a44'); const cy = (top + g0.y0) / 2 + 0.6, ry = (top - g0.y0) / 2 + 0.3;
    branches(g0.y0, cy + ry * 0.2, 5, k === 0 ? '#7a6a54' : '#5e4c3a');
    clumps(0, cy, hw * 0.9, ry, k === 0 ? 70 : 52, k === 2 ? [0.45, 0.8] : [0.9, 1.6], c, true);
    if (sp.id === 'jacaranda') clumps(0, cy + ry * 0.15, hw * 0.8, ry * 0.8, 24, [0.45, 0.85], [0.8, 0.58, 1.0, 170], false);
    if (sp.id === 'taronger') { g.fillStyle = '#e07a1c'; for (let i = 0; i < 60; i++) { const a = R(6.28), rr = Math.sqrt(R()) * 0.8; g.beginPath(); g.arc(px(Math.cos(a) * rr * hw * 0.8), py(cy + Math.sin(a) * rr * ry * 0.75), R(1.6, 2.6), 0, 6.3); g.fill(); } } }
  return cv;
}


// ---------------------------------------------------------------- ARB4: tutor de pino, alcorque cuadrado y su reja
// atlas del tutor: columna 0–0,5 madera de pino clara con veta a lo largo (v), columna 0,5–1 cinta del atado (caucho verde oscuro)
function stakeCanvas() {
  const [cv, g] = canvas(128); seed(993, 0);
  g.fillStyle = rgb(168, 138, 96); g.fillRect(0, 0, 64, 128);
  for (let k = 0; k < 26; k++) { const x = R(64), w = R(0.6, 2.2), c = R(118, 150); g.fillStyle = rgb(c, c * 0.8, c * 0.55); g.fillRect(x, 0, w, 128); }
  for (let k = 0; k < 5; k++) { g.fillStyle = rgb(120, 92, 60); g.beginPath(); g.ellipse(R(6, 58), R(128), R(1.5, 3), R(3, 6), 0, 0, 6.3); g.fill(); }   // nudos
  g.fillStyle = rgb(36, 46, 34); g.fillRect(64, 0, 64, 128);
  for (let y = 0; y < 128; y += 9) { g.fillStyle = rgb(48, 60, 44); g.fillRect(64, y, 64, 2); }
  return cv;
}
// normal plana (para materiales de corteza que no la necesitan)
function flatCanvas() { const [cv, g] = canvas(8); g.fillStyle = rgb(128, 128, 255); g.fillRect(0, 0, 8, 8); return cv; }
// alcorque de 1,2 m (marco de piedra de 10 cm y 1 m de tierra) visto desde arriba; con reja: rejilla radial de fundición
// fina (ranuras de ~2 cm) sobre la tierra, en dos mitades y con el hueco central para el tronco (Ø 40 cm)
function pitCanvas(grate) {
  const N = 512, [cv, g] = canvas(N), m = N / 1.2, F = 0.1 * m; seed(grate ? 995 : 994, 0);
  // marco: piedra gris clara con grano y junta de mortero oscura en los bordes y en las esquinas a inglete
  g.fillStyle = rgb(112, 108, 100); g.fillRect(0, 0, N, N);
  for (let k = 0; k < 2600; k++) { const c = R(88, 134); g.fillStyle = rgb(c, c * 0.97, c * 0.92); g.fillRect(R(N), R(N), R(1, 3), R(1, 3)); }
  g.strokeStyle = rgb(52, 49, 45); g.lineWidth = 3; g.strokeRect(1.5, 1.5, N - 3, N - 3); g.lineWidth = 2;
  g.beginPath(); for (const [a, b] of [[0, 0], [N, 0], [N, N], [0, N]]) { g.moveTo(a, b); g.lineTo(a ? N - F : F, b ? N - F : F); } g.stroke();
  // tierra con hojarasca (hojas secas de plátano, pardas y ocres) y alguna ramita
  g.fillStyle = rgb(56, 43, 32); g.fillRect(F, F, N - 2 * F, N - 2 * F);
  for (let k = 0; k < 900; k++) { const c = R(34, 84); g.fillStyle = rgb(c, c * 0.8, c * 0.6); g.beginPath(); g.arc(R(F, N - F), R(F, N - F), R(1, 5), 0, 6.3); g.fill(); }
  for (let k = 0; k < 46; k++) { const x = R(F, N - F), y = R(F, N - F), sc = R(6, 12), t = R(6.3), c = [[118, 92, 62], [98, 76, 52], [132, 110, 74], [84, 66, 48]][k % 4];
    g.save(); g.translate(x, y); g.rotate(t); g.fillStyle = rgb(c[0] * R(0.8, 1.1), c[1] * R(0.8, 1.1), c[2]); g.beginPath();
    for (let a = 0; a < 10; a++) { const an = a / 10 * 6.2832, r = sc * (a % 2 ? 0.55 : 1); g.lineTo(Math.cos(an) * r, Math.sin(an) * r * 0.85); } g.fill(); g.restore(); }
  g.strokeStyle = rgb(60, 44, 30); g.lineWidth = 2; for (let k = 0; k < 6; k++) { const x = R(F, N - F), y = R(F, N - F), t = R(6.3), l = R(15, 40); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(t) * l, y + Math.sin(t) * l); g.stroke(); }
  // sombra de contacto junto al marco (la tierra queda 2 cm por debajo)
  for (let k = 0; k < 6; k++) { g.strokeStyle = `rgba(0,0,0,${0.16 - k * 0.025})`; g.lineWidth = 2; g.strokeRect(F + k * 2 + 1, F + k * 2 + 1, N - 2 * F - k * 4 - 2, N - 2 * F - k * 4 - 2); }
  if (grate) {
    // reja: placa de fundición gris oscura con ranuras radiales en cuatro coronas y marco liso; el hueco central muestra la tierra
    const c0 = N / 2, Ri = 0.2 * m, img = g.getImageData(0, 0, N, N), soil = new Uint8ClampedArray(img.data);
    g.fillStyle = rgb(60, 60, 62); g.fillRect(F, F, N - 2 * F, N - 2 * F);
    for (let k = 0; k < 1500; k++) { const c = R(40, 70); g.fillStyle = rgb(c, c * 0.98, c * 0.96); g.fillRect(R(F, N - F), R(F, N - F), R(1, 3), R(1, 3)); }
    g.fillStyle = rgb(20, 16, 12);
    const rings = [[Ri + 8, Ri + 0.075 * m, 40], [Ri + 0.095 * m, Ri + 0.17 * m, 56], [Ri + 0.19 * m, Ri + 0.265 * m, 72], [Ri + 0.285 * m, 0.475 * m, 88]];
    for (const [r0, r1, n] of rings) for (let k = 0; k < n; k++) { const a = (k + 0.5) / n * 6.2832, ca = Math.cos(a), sa = Math.sin(a);
      g.save(); g.translate(c0, c0); g.rotate(a); g.fillRect(r0, -2.2, r1 - r0, 4.4); g.restore();
      void ca; void sa; }
    g.strokeStyle = rgb(30, 30, 32); g.lineWidth = 2; g.strokeRect(F + 4, F + 4, N - 2 * F - 8, N - 2 * F - 8);
    g.beginPath(); g.moveTo(c0, F); g.lineTo(c0, N - F); g.stroke();   // junta entre las dos mitades
    // el hueco central y las esquinas fuera del último anillo: tierra (se copia la de antes)
    const out = g.getImageData(0, 0, N, N), d = out.data;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const r = Math.hypot(x - c0, y - c0), q = (y * N + x) * 4;
      if (r < Ri) for (let c = 0; c < 3; c++) d[q + c] = soil[q + c];
      else if (r < Ri + 8 && x > F && y > F) for (let c = 0; c < 3; c++) d[q + c] = 46; }
    g.putImageData(out, 0, 0);
  }
  return cv;
}
// geometría del alcorque (local: centro en el origen, y = 0 la acera): marco de 1,2 m con su canto 1,5 cm sobre la acera y
// faldón hasta 4 cm por debajo (absorbe la pendiente), paredes interiores y la tierra 1 cm sobre la acera (2 cm hundida).
// uv: planta del atlas (v ×2, el sombreado de corteza la divide entre dos)
function pitGeo() {
  const P = [], N = [], U = [], I = [], A = 0.6, a = 0.5, yT = 0.025, yS = 0.008, yB = -0.04;
  const uv = (x, z) => [x / 1.2 + 0.5, (z / 1.2 + 0.5) * 2];
  const quad = (p, n) => { const b = P.length / 3; for (const q of p) { P.push(...q); N.push(...n); U.push(...uv(q[0], q[2])); } I.push(b, b + 2, b + 1, b, b + 3, b + 2); };
  quad([[-a, yS, -a], [a, yS, -a], [a, yS, a], [-a, yS, a]], [0, 1, 0]);                       // tierra
  for (let s = 0; s < 4; s++) {
    const r = (x, z) => s === 0 ? [x, z] : s === 1 ? [-z, x] : s === 2 ? [-x, -z] : [z, -x], P2 = (x, y, z) => { const [u, v] = r(x, z); return [u, y, v]; }, n2 = (x, y, z) => { const [u, v] = r(x, z); return [u, y, v]; };
    quad([P2(-A, yT, -A), P2(A, yT, -A), P2(a, yT, -a), P2(-a, yT, -a)], n2(0, 1, 0));             // canto del marco
    quad([P2(-a, yT, -a), P2(a, yT, -a), P2(a, yS, -a), P2(-a, yS, -a)], n2(0, 0, 1));             // pared interior
    quad([P2(-A, yB, -A), P2(A, yB, -A), P2(A, yT, -A), P2(-A, yT, -A)], n2(0, 0, -1));            // faldón exterior
  }
  // las caras van en sentido horario visto desde fuera (Babylon, mano izquierda); se dibujan sin recorte de caras ocultas
  return { P: new Float32Array(P), N: new Float32Array(N), U: new Float32Array(U), I: new Uint32Array(I) };
}

// G1V1 · viento en el vértice (VS_TREE de streets.js): balanceo de las hojas que crece con la altura sobre el fuste, racha
// lenta que recorre la calle y temblor de cada tarjeta de hojas (uKind 1). Fase por ejemplar (posición de la instancia)
const WIND_GLSL = `
vec3 treeWind(vec3 p, mat4 W, float kind){
  // el fuste y las ramas, quietos: el mapa de sombras (lighting.js) es estático y una corteza que se mueve se sombrea a sí
  // misma (tronco negro). Solo se mueven las hojas y el impostor, poco (≤ 10 cm), por la misma razón
  if (kind < 0.5) return vec3(0.0);
  vec2 o = W[3].xz; float ph = dot(o, vec2(0.113, 0.071));
  float gust = 0.6 + 0.4*sin(uTime*0.41 + o.x*0.006 + o.y*0.004), h = max(p.y - 2.2, 0.0);
  vec3 d = vec3(sin(uTime*1.07 + ph) + 0.3*sin(uTime*2.3 + ph*1.7), 0.0, 0.6*sin(uTime*0.83 + ph*1.3))*0.0012*h*h*gust;
  if (kind > 0.5 && kind < 1.5) d += vec3(sin(uTime*6.3 + dot(p, vec3(3.1, 2.3, 1.7)) + ph), 0.6*sin(uTime*7.1 + dot(p, vec3(1.3, 2.9, 2.1))),
    sin(uTime*5.7 + dot(p, vec3(2.2, 1.1, 3.3))))*0.03*gust*min(h*0.35, 1.0);
  return d;
}`;
window.BCN_TREES = { WIND_GLSL, SP, pick, build, sapling, leafCanvas, impCanvas, familyOf, stakeCanvas, flatCanvas, pitCanvas, pitGeo };
})();
