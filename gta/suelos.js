/* GTA Barcelona — Suelos: estado del asfalto y modelo de acera por calle y por barrio (etapa S, día 3).
   Módulo de datos sin dependencias, cargado antes de app.js. Lo usan:
     · app.js, al trazar las calles: BCN_SUELOS.asfalto(...) → desgaste continuo 0–4,99 por polilínea (va en uv.w del
       vértice de calzada y FS_ROAD lo lee como vInfo.w);
     · streets.js, al construir cada celda: BCN_SUELOS.acera(...) → [modelo de baldosa 0–5, desgaste 0–1] por tramo.
   Estados del asfalto (parte entera del desgaste): 0 nuevo · 1 seminuevo · 2 gastado normal · 3 bastante gastado · 4 muy gastado.
   Modelos de acera: 0 panot de flor estándar · 1 hexagonal del Passeig de Gràcia · 2 losa de la Diagonal · 3 panot nuevo y
   limpio · 4 panot sucio y dejado · 5 losas grandes modernas (22@, Diagonal Mar, Vila Olímpica).
   El reparto sale de BCN_RENTA (nivel económico por barrio, tabla de n3/comun.md), de la importancia de la vía, de las grandes
   avenidas reconocidas por su trazado (Diagonal, Gran Via, Passeig de Gràcia) y de un azar estable por zona y por tramo.
   window.BCN_RENTA = { nivel(x, z) → 0 muy alto … 4 muy bajo (periferia popular 3,4), barri(x, z) }. */
(function () {
'use strict';
// nivel económico por barrio (renta aproximada): 0 muy alto · 1 alto · 2 medio · 3 bajo · 4 muy bajo. Los que no están: medio
const NIVEL = {
  'Pedralbes': 0, 'Sarrià': 0, 'les Tres Torres': 0, 'Sant Gervasi - Galvany': 0, 'Sant Gervasi - la Bonanova': 0, 'Vallvidrera, el Tibidabo i les Planes': 0,
  'el Putxet i el Farró': 1, "la Dreta de l'Eixample": 1, 'les Corts': 1, 'Diagonal Mar i el Front Marítim del Poblenou': 1, 'la Vila Olímpica del Poblenou': 1,
  'la Maternitat i Sant Ramon': 1.6, "l'Antiga Esquerra de l'Eixample": 1.6,
  'el Raval': 3, 'la Barceloneta': 3, 'el Besòs i el Maresme': 3, 'el Bon Pastor': 3, 'Baró de Viver': 3, 'la Trinitat Vella': 3, 'la Marina del Prat Vermell': 3,
  'el Carmel': 2.7, 'la Verneda i la Pau': 2.7, 'la Prosperitat': 2.8, 'Canyelles': 2.8, 'la Guineueta': 2.6, 'Can Peguera': 3, 'el Turó de la Peira': 2.6,
  'Ciutat Meridiana': 4, 'Torre Baró': 4, 'Vallbona': 4, 'la Trinitat Nova': 4, 'les Roquetes': 4, 'Verdun': 4,
};
// zonas nuevas (urbanizadas después de 1990): losas grandes modernas
const NUEVO = new Set(['Diagonal Mar i el Front Marítim del Poblenou', 'la Vila Olímpica del Poblenou', 'el Parc i la Llacuna del Poblenou', 'Provençals del Poblenou']);
const PERIF = 3.4;                                           // fuera de los 73 barrios: L'Hospitalet, Cornellà, Badalona Sud…

let BAR = null;
function barri(x, z) {
  const B = window.BCN_BARRI ? window.BCN_BARRI.barris : (window.BCN_SUELOS._barris || null); if (!B) return null;
  if (!BAR) BAR = B.map(b => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const r of b.r) for (const q of r) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); } return [b, x0, z0, x1, z1]; });
  for (const [b, x0, z0, x1, z1] of BAR) {
    if (x < x0 || x > x1 || z < z0 || z > z1) continue;
    for (const r of b.r) { let ins = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const xi = r[i][0], zi = r[i][1], xj = r[j][0], zj = r[j][1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins; } if (ins) return b; }
  }
  return null;
}
// rejilla de 100 m en caché (la consulta de polígonos es cara y se hace por tramo)
const nivCache = new Map();
function nivel(x, z) {
  const k = Math.round(x / 100) * 100000 + Math.round(z / 100); let v = nivCache.get(k);
  if (v === undefined) { const b = barri(Math.round(x / 100) * 100, Math.round(z / 100) * 100); v = b ? (NIVEL[b.n] ?? 2) : PERIF;
    // fuera de Barcelona, al noroeste (Esplugues, Sant Just): no es periferia popular
    if (!b && x < 7600 && z > 13600) v = 1.8;
    nivCache.set(k, v); }
  return v;
}
const nuevoAt = (x, z) => { const b = barri(x, z); return !!b && NUEVO.has(b.n); };

// grandes avenidas, por su trazado (coordenadas de mundo, sacadas de Nominatim): Diagonal, Gran Via y Passeig de Gràcia
const AVE = [
  { id: 'diagonal', tol: 40, P: [[7326, 13796], [8652, 14274], [10079, 14712], [12198, 15395], [13552, 15727], [14000, 15965], [15500, 16449], [16700, 16836]] },   // S2: al este de Glòries, ajustada a los tramos de roads.png (z ≈ 11450 + 0,3225·x)
  { id: 'granvia', tol: 34, P: [[9301, 11743], [10392, 12684], [11737, 13916], [12661, 14903], [13552, 15727], [15622, 17464]] },
  { id: 'pgracia', tol: 30, P: [[12047, 14394], [11261, 15189]] },
];
function avenida(x0, z0, x1, z1) {
  const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, L = Math.hypot(x1 - x0, z1 - z0) || 1, tx = (x1 - x0) / L, tz = (z1 - z0) / L;
  for (const A of AVE) for (let i = 0; i + 1 < A.P.length; i++) {
    const [ax, az] = A.P[i], [bx, bz] = A.P[i + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((mx - ax) * dx + (mz - az) * dz) / l2)), d = Math.hypot(mx - ax - dx * t, mz - az - dz * t);
    if (d < A.tol && Math.abs(tx * dx + tz * dz) / Math.sqrt(l2) > 0.9) return A.id;
  }
  return null;
}
// azar estable: por punto (tramo) y ruido suave por zona (~250 m), para que el estado vaya por rodales y no a saltos
const hash = (a, b) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const sm = t => t * t * (3 - 2 * t);
function zona(x, z, s) { const X = x / s, Z = z / s, i = Math.floor(X), j = Math.floor(Z), fx = sm(X - i), fz = sm(Z - j);
  const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1); return (a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + d * fx) * fz; }

// desgaste del asfalto de un tramo (o polilínea) de calzada de clase cls y semiancho hw entre (x0, z0) y (x1, z1)
const BASE = [0.45, 1.35, 2.25, 3.05, 3.85];
function asfalto(cls, hw, x0, z0, x1, z1) {
  const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, n = nivel(mx, mz), i = Math.floor(n), f = n - i;
  let w = i >= 4 ? BASE[4] : BASE[i] * (1 - f) + BASE[i + 1] * f;
  const av = avenida(x0, z0, x1, z1), h = hash(Math.round(mx * 0.5), Math.round(mz * 0.5)), zn = zona(mx, mz, 260);
  w += (zn - 0.5) * 1.1 + (h - 0.5) * 0.25;   // G1S2: menos azar por polilínea (antes 0,7): en los cruces se apilaban cintas de tonos muy distintos
  if (cls <= 1 || cls === 10) w = 1.1 + (h - 0.5) * 0.8;                 // autopistas y rondas: mantenimiento propio, seminuevas
  else if (cls === 2) w -= 0.35;                                          // vías principales: se reasfaltan antes
  else if (cls === 6 || cls === 8 || cls === 11) w += 0.45;               // servicio, accesos: lo último que se arregla
  if (av) w = (av === 'pgracia' ? 1.05 : 1.25) + (h - 0.5) * 0.5;   // FIX3: seminuevas de verdad (antes 0,85 rozaba «nuevo»)         // Diagonal, Gran Via, Passeig de Gràcia: seminuevas
  const h2 = hash(Math.round(mz * 0.37) + 17, Math.round(mx * 0.41) - 5);
  if (!av && h2 < 0.06) w = 0.25 + h2 * 4;                                // tramo recién asfaltado en cualquier barrio
  else if (!av && h2 > 0.95 && n >= 2) w += 0.9;                         // tramo dejado
  return Math.max(0, Math.min(4.99, w));
}
// G1S3: el asfalto «nuevo» y «seminuevo» (estados 0–1, albedo 0,10–0,12 en FS_ROAD) se veía negro puro y liso a pie de
// calle. Lo que queda por debajo de 1,8 se comprime a 1,5–1,8: albedo de lejos 0,14–0,15 (gris oscuro de asfalto con
// árido) y, de cerca, el asfalto fotografiado con su grano en vez del tono liso de «nuevo»; por debajo de 1,8 FS_ROAD aún
// no pone parches de reparación, así que no aparecen rectángulos nuevos. De 1,8 para arriba no cambia nada. Las aceras
// siguen usando el desgaste de antes (asfalto0).
const asfalto0 = asfalto;
function asfaltoG1(cls, hw, x0, z0, x1, z1) { const w = asfalto0(cls, hw, x0, z0, x1, z1); return w < 1.8 ? 1.5 + w * (0.3 / 1.8) : w; }
// modelo de acera y desgaste (0–1) de un tramo con aceras
function acera(cls, hw, x0, z0, x1, z1) {
  const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, av = avenida(x0, z0, x1, z1), w = asfalto0(cls, hw, x0, z0, x1, z1);
  const n = nivel(mx, mz), zn = zona(mx + 913, mz - 377, 220), wr = Math.min(1, Math.max(0, (w - 0.2) / 4.4));
  if (av === 'pgracia') return [1, Math.min(wr, 0.3)];
  if (av === 'diagonal') return [2, Math.min(wr, 0.35)];
  if (av === 'granvia') return [0, Math.min(wr, 0.4)];
  if (nuevoAt(mx, mz)) return [zn < 0.68 ? 5 : 3, Math.min(wr, 0.4)];
  let m = 0;
  if (n < 0.5) m = zn < 0.55 ? 3 : 0;
  else if (n < 1.5) m = zn < 0.3 ? 3 : 0;
  else if (n < 2.5) m = zn > 0.88 ? 4 : zn < 0.08 ? 3 : 0;
  else if (n < 3.5) m = zn < 0.5 ? 4 : 0;
  else m = zn < 0.75 ? 4 : 0;
  if (m === 3) return [3, Math.min(wr, 0.25)];
  if (m === 4) return [4, Math.max(wr, 0.6)];
  return [0, wr];
}
// ---------------------------------------------------------------- S2 · calles planas
// El relieve es una malla de 20 m (MDT): bajo una calle de 10–12 m mete facetas, quiebros y bultos. allanar() rehace la cota de
// las calles en una rejilla de 5 m (solo alrededor de ellas, teselas de 260 m): la superficie de la calle es el relieve
// suavizado con un filtro de unos 10 m que solo mira el suelo de las calzadas (convolución normalizada con la máscara de
// calzada: un talud, un muro o una trinchera vecina no la arrastran). Un plano inclinado no cambia con el filtro, así que la
// cuesta real se conserva (Gràcia, Horta, Montjuïc), pero los quiebros de las facetas y los bultos desaparecen, la sección
// transversal queda recta y en los cruces las dos calles comparten la misma superficie. La corrección pesa 1 en la calzada y
// hasta 3 m más allá del bordillo y se apaga a 10 m. Autopistas y rondas (clases 0, 1, 10) no entran en la máscara.
// app.js la usa en heightAt (FLAT.h: así la siguen calzada, aceras, bordillos, árboles y mobiliario) y hunde la malla del
// terreno lo justo para que no asome por encima de las calles (low: mínimo de la corrección alrededor de cada nudo de 20 m).
const RAS = new Set([2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 15]);   // G1S1: también las pistas de tierra (9) y las clases 12 y 15
function segsOf(polys) {
  const seg = [];
  for (const P of polys) { if (!RAS.has(P.cls)) continue;
    for (let k = 0; k + 1 < P.xs.length; k++) if (P.xs[k] !== P.xs[k + 1] || P.zs[k] !== P.zs[k + 1]) seg.push(P.xs[k], P.zs[k], P.xs[k + 1], P.zs[k + 1], P.hw); }
  return Float64Array.from(seg);
}
// S3: el cálculo por teselas (calc) va aparte para poder repartirlo entre varios workers (allanarPar): part = [w, nW] hace solo
// las teselas con clave % nW == w. low se combina con el mínimo y las teselas no se solapan: el resultado es idéntico
function calc(h0, seg, WX, WZ, GW, GH, CELL, part) {
  const CS = 5, TN = 52, TS = CS * TN, NTX = Math.ceil(WX / TS), NTZ = Math.ceil(WZ / TS), RB = 11, FW = 5, Q = 0.01, MG = 6, N = TN + 2 * MG, BR = 2;
  const NS = seg.length / 5, bucket = new Map(), RM = MG * CS;
  for (let s = 0; s < NS; s++) { const o = s * 5, r = seg[o + 4] + RB + RM;
    const i0 = Math.max(0, Math.floor((Math.min(seg[o], seg[o + 2]) - r) / TS)), i1 = Math.min(NTX - 1, Math.floor((Math.max(seg[o], seg[o + 2]) + r) / TS));
    const j0 = Math.max(0, Math.floor((Math.min(seg[o + 1], seg[o + 3]) - r) / TS)), j1 = Math.min(NTZ - 1, Math.floor((Math.max(seg[o + 1], seg[o + 3]) + r) / TS));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * NTX + i; let l = bucket.get(k); if (!l) bucket.set(k, l = []); l.push(s); } }
  const tiles = new Array(NTX * NTZ).fill(null), low = new Float32Array(GW * GH);
  let nodes = 0, moved = 0, sum = 0, mx = 0;
  const WG = new Float32Array(N * N), HH = new Float32Array(N * N), A = new Float32Array(N * N), B = new Float32Array(N * N);
  const TA = new Float32Array(N), TB = new Float32Array(N), OA = new Float32Array(N), OB = new Float32Array(N), RA = new Float32Array(N * N), RB2 = new Float32Array(N * N), FL = new Uint8Array(N * N), LS = new Float32Array(N * N), LW = new Float32Array(N * N);
  // S3: caja de radio BR dos veces (≈ gaussiana de σ ≈ 10 m), A y B a la vez, filas vacías saltadas y, por columnas, solo las
  // columnas de la tesela (las del margen no se usan). Mismo resultado que antes, ~3× más rápido
  const pass2 = (n) => { for (let pass = 0; pass < 2; pass++) { let a = 0, b = 0; for (let k = 0; k < BR && k < n; k++) { a += TA[k]; b += TB[k]; }
      for (let k = 0; k < n; k++) { if (k + BR < n) { a += TA[k + BR]; b += TB[k + BR]; } if (k - BR - 1 >= 0) { a -= TA[k - BR - 1]; b -= TB[k - BR - 1]; } OA[k] = a; OB[k] = b; }
      TA.set(OA); TB.set(OB); } };
  const box2 = () => {
    for (let r = 0; r < N; r++) { const o = r * N; let nz = false; for (let k = 0; k < N; k++) if (B[o + k]) { nz = true; break; }
      if (!nz) { RA.fill(0, o, o + N); RB2.fill(0, o, o + N); continue; }
      for (let k = 0; k < N; k++) { TA[k] = A[o + k]; TB[k] = B[o + k]; } pass2(N);
      for (let k = 0; k < N; k++) { RA[o + k] = TA[k]; RB2[o + k] = TB[k]; } }
    for (let c = 0; c < N; c++) { let nz = false; for (let k = 0; k < N; k++) { const v = RB2[k * N + c]; TA[k] = RA[k * N + c]; TB[k] = v; if (v) nz = true; }
      if (!nz) { for (let k = 0; k < N; k++) { A[k * N + c] = 0; B[k * N + c] = 0; } continue; }
      pass2(N); for (let k = 0; k < N; k++) { A[k * N + c] = TA[k]; B[k * N + c] = TB[k]; } } };
  for (const [key, list] of bucket) { if (part && key % part[1] !== part[0]) continue;
    const ti = key % NTX, tj = (key / NTX) | 0, bx = ti * TS - RM, bz = tj * TS - RM; let T = null;
    WG.fill(0); A.fill(0); B.fill(0); FL.fill(0);
    const each = visit => { for (const s of list) { const o = s * 5, ax = seg[o], az = seg[o + 1], dx = seg[o + 2] - ax, dz = seg[o + 3] - az, hw = seg[o + 4], r = hw + RB;
      const l2 = dx * dx + dz * dz, ln = Math.sqrt(l2), ux = dx / ln, uz = dz / ln;
      const i0 = Math.max(0, Math.ceil((Math.min(ax, ax + dx) - r - bx) / CS)), i1 = Math.min(N - 1, Math.floor((Math.max(ax, ax + dx) + r - bx) / CS));
      const j0 = Math.max(0, Math.ceil((Math.min(az, az + dz) - r - bz) / CS)), j1 = Math.min(N - 1, Math.floor((Math.max(az, az + dz) + r - bz) / CS));
      for (let j = j0; j <= j1; j++) { const z = bz + j * CS, pz = z - az;
        let xa = bx + i0 * CS, xb = bx + i1 * CS;
        if (Math.abs(uz) > 1e-6) { const c1 = (pz * ux - r) / uz, c2 = (pz * ux + r) / uz; xa = Math.max(xa, ax + Math.min(c1, c2)); xb = Math.min(xb, ax + Math.max(c1, c2)); }
        else if (Math.abs(pz) > r) continue;
        if (Math.abs(ux) > 1e-6) { const c1 = (-r - pz * uz) / ux, c2 = (ln + r - pz * uz) / ux; xa = Math.max(xa, ax + Math.min(c1, c2)); xb = Math.min(xb, ax + Math.max(c1, c2)); }
        else if (pz * uz < -r || pz * uz > ln + r) continue;
        const ia = Math.max(i0, Math.ceil((xa - bx) / CS)), ib = Math.min(i1, Math.floor((xb - bx) / CS));
        for (let i = ia; i <= ib; i++) {
          const px = bx + i * CS - ax; let t = (px * ux + pz * uz) / ln; t = t < 0 ? 0 : t > 1 ? 1 : t;
          const qx = px - dx * t, qz = pz - dz * t, e = Math.sqrt(qx * qx + qz * qz) - hw; if (e >= RB) continue;
          visit(j * N + i, e, hw, ax + dx * t, az + dz * t, z, i);
        } } } };
    // banda a nivel: hasta FW m del borde de la calzada (aceras) y talud hasta RB; en las pistas y sendas (semiancho < 2,5 m),
    // 1,5 m de arcén a nivel y talud hasta 7 m, para no abrir una explanada en el monte
    each((q, e, hw, cx, cz, z, i) => { const fw = hw < 2.5 ? 1.5 : FW, rb = hw < 2.5 ? 7 : RB; if (e >= rb) return;
      const w = e <= fw ? 1 : 1 - (e - fw) / (rb - fw), ww = w * w * (3 - 2 * w);
      if (ww > WG[q]) WG[q] = ww;
      if (e <= 1 && !B[q]) { B[q] = 1; FL[q] = 1; const H = h0(bx + i * CS, z); HH[q] = H; A[q] = H; } });
    box2();
    // G1S1 · sección transversal a nivel: cada nudo toma la cota filtrada del punto del EJE más cercano de cada tramo que lo
    // alcanza (no la suya), con más peso cuanto más dentro de la calzada. Así calzada, aceras y arcenes quedan horizontales de
    // lado a lado (sin inclinación lateral), la pendiente a lo largo se conserva suavizada y en los cruces las calles se funden
    LS.fill(0); LW.fill(0);
    const sf = (fx, fz) => { fx = fx < 0 ? 0 : fx > N - 1.001 ? N - 1.001 : fx; fz = fz < 0 ? 0 : fz > N - 1.001 ? N - 1.001 : fz;
      const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, k = j * N + i;
      const a = (A[k] * (1 - u) + A[k + 1] * u) * (1 - v) + (A[k + N] * (1 - u) + A[k + N + 1] * u) * v;
      const b = (B[k] * (1 - u) + B[k + 1] * u) * (1 - v) + (B[k + N] * (1 - u) + B[k + N + 1] * u) * v;
      return b > 1e-3 ? a / b : NaN; };
    each((q, e, hw, cx, cz) => { if (e >= (hw < 2.5 ? 7 : RB)) return; const L = sf((cx - bx) / CS, (cz - bz) / CS); if (L !== L) return;
      const f = (RB - e) / (RB + hw), wk = f * f + 1e-4; LS[q] += wk * L; LW[q] += wk; });
    for (let j = MG; j < MG + TN; j++) for (let i = MG; i < MG + TN; i++) { const q = j * N + i, w = WG[q]; if (!w || B[q] < 1e-3) continue;
      const x = bx + i * CS, z = bz + j * CS, H = FL[q] ? HH[q] : h0(x, z), cf = Math.min(1, B[q] / 6);
      const dl = ((LW[q] > 0 ? LS[q] / LW[q] : A[q] / B[q]) - H) * w * cf * cf * (3 - 2 * cf), v = Math.max(-32000, Math.min(32000, Math.round(dl / Q)));
      nodes++; if (!v) continue;
      if (!T) T = new Int16Array(TN * TN); T[(j - MG) * TN + (i - MG)] = v; moved++; sum += Math.abs(dl); mx = Math.max(mx, Math.abs(dl));
      if (v < 0) { const gi0 = Math.ceil((x - CELL) / CELL), gj0 = Math.ceil((z - CELL) / CELL);
        for (let gj = gj0; gj <= gj0 + 2; gj++) for (let gi = gi0; gi <= gi0 + 2; gi++) { if (gi < 0 || gj < 0 || gi >= GW || gj >= GH || Math.abs(gi * CELL - x) >= CELL || Math.abs(gj * CELL - z) >= CELL) continue;
          const o = gj * GW + gi; if (v * Q < low[o]) low[o] = v * Q; } }
    }
    if (T) tiles[key] = T;
  }
  return { tiles, low, stats: { nodes, moved, sum, max: mx } };
}
function finish(R, h0, WX, WZ) {
  const CS = 5, TN = 52, TS = CS * TN, NTX = Math.ceil(WX / TS), NTZ = Math.ceil(WZ / TS), Q = 0.01, tiles = R.tiles, low = R.low, st = R.stats;
  const node = (i, j) => { const T = tiles[((j / TN) | 0) * NTX + ((i / TN) | 0)]; return T ? T[(j % TN) * TN + (i % TN)] : 0; };
  // cota corregida: donde hay corrección, interpolación bilineal de (terreno + corrección) en los nudos de 5 m (así las facetas de
  // 20 m del relieve no se cuelan en la calle); lejos de las calles, el terreno tal cual
  function h(x, z) {
    if (!(x >= 0 && z >= 0 && x < NTX * TS - CS && z < NTZ * TS - CS)) return h0(x, z);
    const fx = x / CS, fz = z / CS, i = fx | 0, j = fz | 0, u = fx - i, v = fz - j;
    const a = node(i, j), b = node(i + 1, j), c = node(i, j + 1), d = node(i + 1, j + 1);
    if (!a && !b && !c && !d) return h0(x, z);
    const X = i * CS, Z = j * CS;
    return ((h0(X, Z) + a * Q) * (1 - u) + (h0(X + CS, Z) + b * Q) * u) * (1 - v) + ((h0(X, Z + CS) + c * Q) * (1 - u) + (h0(X + CS, Z + CS) + d * Q) * u) * v;
  }
  return { h, low, raw: R, stats: { nodes: st.nodes, moved: st.moved, mean: st.moved ? st.sum / st.moved : 0, max: st.max, tiles: tiles.filter(Boolean).length } };
}
// FIX3: corrección precalculada (data/allanado.bin.gz; la genera tools/allanado.sh con el arnés). Formato (little endian):
// Uint32 [magia 'FLAT', clave, nº de teselas posibles, nº de teselas, nº de nudos de low ≠ 0, largo de low], Float64 stats×4,
// Int32 claves de tesela, Int16 teselas (52×52 cada una, en pasos de 2 cm), Int16 low entero en cm.
// La clave (preClave) resume las entradas: si cambian las calles o el relieve, no coincide y se recalcula como siempre
const MAGIC = 0x33414c46;   // 'FLA3': teselas guardadas a 2 cm (la mitad del valor; ~3,3 MB comprimido en vez de 4,9)
function preClave(polys, h0, WX, WZ) { let h = 2166136261 >>> 0; const mix = v => { h = Math.imul(h ^ (v | 0), 16777619) >>> 0; };
  mix(polys.length); mix(WX); mix(WZ); mix(8);   // 8: versión del cálculo (G1S1: sección a nivel y pistas) (súbela si cambias calc)
  for (let k = 0; k < polys.length; k += 97) { const p = polys[k]; mix(p.cls); mix(p.hw * 10); mix(p.xs.length); mix(p.xs[0] * 10); mix(p.zs[0] * 10); }
  for (let j = 1; j < 16; j++) for (let i = 1; i < 16; i++) mix(Math.round(h0(WX * i / 16, WZ * j / 16) * 100));
  return h; }
function pack(F, clave) {
  const R = F.raw, keys = [], lowI = []; R.tiles.forEach((T, k) => { if (T) keys.push(k); });
  const TT = 52 * 52, nb = 24 + 32 + keys.length * 4 + keys.length * TT * 2 + R.low.length * 2, buf = new ArrayBuffer(nb), dv = new DataView(buf); let o = 0;
  for (const v of [MAGIC, clave, R.tiles.length, keys.length, lowI.length, R.low.length]) { dv.setUint32(o, v, true); o += 4; }
  for (const v of [R.stats.nodes, R.stats.moved, R.stats.sum, R.stats.max]) { dv.setFloat64(o, v, true); o += 8; }
  for (const k of keys) { dv.setInt32(o, k, true); o += 4; }
  for (const k of keys) { const T = R.tiles[k]; for (let q = 0; q < TT; q++) { dv.setInt16(o, Math.round(T[q] / 2), true); o += 2; } }
  for (let i = 0; i < R.low.length; i++) { dv.setInt16(o, Math.max(-32000, Math.round(R.low[i] * 100)), true); o += 2; }
  return new Uint8Array(buf);
}
function unpack(buf, clave, h0, WX, WZ) {
  const dv = new DataView(buf); let o = 0; const u = () => { const v = dv.getUint32(o, true); o += 4; return v; };
  if (u() !== MAGIC || u() !== clave) return null;
  const nT = u(), nk = u(), nl = u(), nLow = u(), st = {}; for (const n of ['nodes', 'moved', 'sum', 'max']) { st[n] = dv.getFloat64(o, true); o += 8; }
  const TT = 52 * 52, tiles = new Array(nT).fill(null), keys = []; for (let i = 0; i < nk; i++) { keys.push(dv.getInt32(o, true)); o += 4; }
  for (const k of keys) { const T = new Int16Array(TT); for (let q = 0; q < TT; q++) { T[q] = 2 * dv.getInt16(o, true); o += 2; } tiles[k] = T; }
  const low = new Float32Array(nLow); for (let i = 0; i < nLow; i++) { low[i] = dv.getInt16(o, true) / 100; o += 2; }
  return finish({ tiles, low, stats: st }, h0, WX, WZ);
}
function allanar(h0, polys, WX, WZ, GW, GH, CELL) { return finish(calc(h0, segsOf(polys), WX, WZ, GW, GH, CELL), h0, WX, WZ); }
// S3: lo mismo en paralelo (workers de un Blob). h0src es el código de la función de cota cruda y env sus variables libres
// (tablas incluidas). Si no hay workers o algo falla, el que llama vuelve a allanar() en el hilo principal
function allanarPar(h0, h0src, env, polys, WX, WZ, GW, GH, CELL, nW) {
  const seg = segsOf(polys), names = Object.keys(env);
  const src = "'use strict';const RAS=null;" + calc.toString() + "\nonmessage=e=>{const d=e.data;const h0=new Function(" + names.map(n => JSON.stringify(n)).join(',') +
    ",'return '+d.h0src)(...d.vals);const R=calc(h0,d.seg,d.WX,d.WZ,d.GW,d.GH,d.CELL,d.part);const keys=[],bufs=[];" +
    "R.tiles.forEach((T,k)=>{if(T){keys.push(k);bufs.push(T);}});postMessage({keys,bufs,low:R.low,stats:R.stats},[R.low.buffer].concat(bufs.map(b=>b.buffer)));};";
  const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
  const vals = names.map(n => env[n]);
  return Promise.all(Array.from({ length: nW }, (_, w) => new Promise((res, rej) => {
    const wk = new Worker(url); wk.onerror = e => { wk.terminate(); rej(new Error(e.message || 'worker')); };
    wk.onmessage = e => { wk.terminate(); res(e.data); };
    wk.postMessage({ h0src, vals, seg, WX, WZ, GW, GH, CELL, part: [w, nW] });
  }))).then(parts => {
    URL.revokeObjectURL(url);
    const TS = 5 * 52, tiles = new Array(Math.ceil(WX / TS) * Math.ceil(WZ / TS)).fill(null), low = parts[0].low, st = { nodes: 0, moved: 0, sum: 0, max: 0 };
    for (const P of parts) { P.keys.forEach((k, i) => { tiles[k] = P.bufs[i]; });
      if (P !== parts[0]) for (let i = 0; i < low.length; i++) if (P.low[i] < low[i]) low[i] = P.low[i];
      st.nodes += P.stats.nodes; st.moved += P.stats.moved; st.sum += P.stats.sum; st.max = Math.max(st.max, P.stats.max); }
    return finish({ tiles, low, stats: st }, h0, WX, WZ);
  });
}
window.BCN_SUELOS = { asfalto: asfaltoG1, asfalto0, acera, avenida, nivel, barri, NIVEL, allanar, allanarPar, preClave, pack, unpack };
window.BCN_RENTA = { nivel, barri, NIVEL, PERIF };
})();
