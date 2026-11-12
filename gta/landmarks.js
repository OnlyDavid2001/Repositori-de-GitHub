/* GTA Barcelona — HITOS: edificios y monumentos singulares (núcleo). Guía completa: DESARROLLO.md §10.
   window.BCN_LM (disponible al cargar este fichero, antes de los lotes landmarks_a.js … landmarks_e.js):
     · add(ficha): declara un hito. Ficha: { id, nombre, x, z, rot, alto, noche, edificios, nivel, build(B, h, lib) } y,
       opcionales, { y, dy, ancho, largo, led, ocultar, retoque, fachada, etiqueta }.
     · K: tipos de material de los hitos (viajan en el alfa del color de vértice, como en GB) · lib: biblioteca de arquetipos.
   window.BCN_LANDMARKS = { init(ctx) → { update(), busy(), stats() } }: construye una malla por hito (siempre cargada, sin
   niveles de detalle), oculta los volúmenes simples que sustituye y publica window.BCN.lm (view, stats, near, list).
   Coordenadas del constructor: metros LOCALES del hito, origen en el centro de la base (y = 0 en la cota de la base),
   +Z = el rumbo «rot» de la ficha, +X a su derecha. El núcleo gira y coloca la malla. */
(function () {
'use strict';
const GEO = window.BCN_GEO;
const { GB, F0, quad, rev, tube, sphere, obox, bar, cyl } = GEO;

// ------------------------------------------------------------------ tipos de material (shader propio de los hitos)
// El auxiliar (4 bytes por vértice) lo leen algunos tipos; créalo con las funciones lib.aux…, nunca a mano.
const K = { PIEDRA: 1, LISO: 2, VENTANAS: 3, CORTINA: 4, METAL: 5, TEJA: 6, TRENCADIS: 7, CESPED: 8, GRADA: 9, AGUA: 10, EMISIVO: 11, LADRILLO: 12 };
const NOCHE = { nada: 0, focos: 1, led: 2, ventanas: 3 };

// ------------------------------------------------------------------ registro de fichas
const FICHAS = [], IDS = new Set();
let started = false;
function add(f) {
  try {
    if (!f || typeof f.id !== 'string' || !/^[a-z0-9_]+$/.test(f.id)) throw new Error('id no válido (minúsculas, dígitos y «_»): ' + (f && f.id));
    if (IDS.has(f.id)) throw new Error('id repetido: ' + f.id);
    if (!isFinite(f.x) || !isFinite(f.z)) throw new Error(f.id + ': faltan x, z');
    if (f.build && typeof f.build !== 'function') throw new Error(f.id + ': build tiene que ser una función');
    if (started) throw new Error(f.id + ': BCN_LM.add() después de iniciarse el módulo (decláralo al cargar el script)');
    IDS.add(f.id); FICHAS.push(f);
  } catch (e) { console.warn('Hito descartado: ' + e.message); }
}

// ------------------------------------------------------------------ escritura de vértices
// pv: un vértice (el que llama ha hecho B.grow). sm = normal suave (no se voltea hacia la cámara). a = auxiliar (lee 4 bytes)
function pv(B, x, y, z, nx, ny, nz, sm, col, k, a) {
  const v = B.nv++, o = v * 3, q = v * 4, l = Math.hypot(nx, ny, nz) || 1;
  B.p[o] = x; B.p[o + 1] = y; B.p[o + 2] = z;
  B.n[q] = Math.round(nx / l * 127 + 128); B.n[q + 1] = Math.round(ny / l * 127 + 128); B.n[q + 2] = Math.round(nz / l * 127 + 128); B.n[q + 3] = sm ? 255 : 0;
  B.c[q] = col[0]; B.c[q + 1] = col[1]; B.c[q + 2] = col[2]; B.c[q + 3] = k;
  if (a) { B.a[q] = a[0]; B.a[q + 1] = a[1]; B.a[q + 2] = a[2]; B.a[q + 3] = a[3]; } else { B.a[q] = B.a[q + 1] = B.a[q + 2] = B.a[q + 3] = 0; }
  return v;
}
const tri = (B, a, b, c) => { const i = B.i; i[B.ni++] = a; i[B.ni++] = b; i[B.ni++] = c; };
// polígono plano (cóncavo vale; sin agujeros salvo `holes` = índices de inicio como en earcut): pts = [[x, y, z], …]
function poly(B, pts, col, k, aux, holes) {
  const n = pts ? pts.length : 0; if (!B || n < 3) return;
  let nx = 0, ny = 0, nz = 0;                                  // normal de Newell
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]); }
  const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz); if (ax + ay + az < 1e-9) return;
  const i0 = ax >= ay && ax >= az ? 1 : 0, i1 = az > ax && az > ay ? 1 : 2;   // se proyecta en el plano del eje dominante
  const flat2 = []; for (const p of pts) flat2.push(p[i0], p[i1]);
  const t = window.earcut(flat2, holes || null, 2); if (!t.length) return;
  B.grow(n, t.length); const v0 = B.nv;
  for (const p of pts) pv(B, p[0], p[1], p[2], nx, ny, nz, 0, col, k, aux);
  for (let j = 0; j < t.length; j += 3) tri(B, v0 + t[j], v0 + t[j + 1], v0 + t[j + 2]);
}
// cuadrilátero plano en coordenadas locales (a, b, c, d = [x, y, z])
const q4 = (B, a, b, c, d, col, k, aux) => quad(B, F0, a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], d[0], d[1], d[2], col, k, aux);

// transforma los vértices de B desde v0: escala (sx, sz) respecto al origen, gira ang grados (rumbo: +Z hacia +X) y traslada
// (x, z). Corrige las normales. Así cualquier pieza se modela centrada y luego se coloca.
function xf(B, v0, x, z, ang, sx, sz, dy) {
  sx = sx || 1; sz = sz || 1; dy = dy || 0; const a = (ang || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), P = B.p, N = B.n;
  for (let v = v0; v < B.nv; v++) {
    const o = v * 3, q = v * 4, px = P[o] * sx, pz = P[o + 2] * sz;
    P[o] = x + px * c + pz * s; P[o + 1] += dy; P[o + 2] = z - px * s + pz * c;
    let nx = (N[q] - 128) / 127 / sx, ny = (N[q + 1] - 128) / 127, nz = (N[q + 2] - 128) / 127 / sz;
    const rx = nx * c + nz * s, rz = -nx * s + nz * c, l = Math.hypot(rx, ny, rz) || 1;
    N[q] = Math.round(rx / l * 127 + 128); N[q + 1] = Math.round(ny / l * 127 + 128); N[q + 2] = Math.round(rz / l * 127 + 128);
  }
}

// ------------------------------------------------------------------ auxiliares y colores
const clampB = v => Math.max(0, Math.min(255, Math.round(v)));
const aux4 = (x, y, z, w) => { const a = [clampB(x), clampB(y), clampB(z), clampB(w)]; return a.concat(a, a, a); };
const dm = m => (m || 0) * 10;              // metros → decímetros (byte: hasta 25,5 m)
const AUX = {
  // sillares: alto de hilada y largo de sillar (m)
  piedra: (hilada, sillar) => aux4(dm(hilada), dm(sillar), 0, 0),
  ladrillo: (hilada, pieza) => aux4(dm(hilada), dm(pieza), 0, 0),
  // muro con ventanas: alto de planta y ancho de vano (m), y qué fracción de vano y de planta es hueco (0–1)
  ventanas: (planta, vano, ancho, alto) => aux4(dm(planta || 3.5), dm(vano || 3), (ancho || 0.45) * 255, (alto || 0.55) * 255),
  // muro cortina: alto de planta y paso de montantes (m), y variación de tono entre paños (0–1)
  cortina: (planta, montante, variacion) => aux4(dm(planta || 3.8), dm(montante || 1.5), (variacion === undefined ? 0.35 : variacion) * 255, 0),
  // paneles: lado (m), variación de tono (0–1) y fracción de paneles que son ventana (0–1)
  panel: (lado, variacion, ventanas) => aux4(dm(lado || 1.5), (variacion || 0) * 255, (ventanas || 0) * 255, 0),
  // liso: si se da, despiece de paneles cada `lado` m
  liso: lado => aux4(dm(lado), 0, 0, 0),
  // césped: ancho de franja (m) · gradas: alto de fila (m) y número de sectores de color por vuelta
  cesped: franja => aux4(dm(franja || 5), 0, 0, 0),
  grada: (fila, sectores) => aux4(dm(fila || 0.85), sectores || 16, 0, 0),
  // emisivo: ganancia (0–4) y si solo se enciende de noche
  emisivo: (ganancia, soloNoche) => aux4((ganancia === undefined ? 1 : ganancia) * 63.75, soloNoche ? 255 : 0, 0, 0),
};
// '#b23a3a' → [178, 58, 58] (también acepta [r, g, b])
const color = h => Array.isArray(h) ? h : [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t | 0, a[1] + (b[1] - a[1]) * t | 0, a[2] + (b[2] - a[2]) * t | 0];
const shadeC = (c, f) => [Math.min(255, c[0] * f) | 0, Math.min(255, c[1] * f) | 0, Math.min(255, c[2] * f) | 0];
// color por tramos de altura: cols = [[t, color], …] con t de 0 a 1, ordenado
function ramp(cols, t) {
  if (!cols || !cols.length) return [200, 200, 200];
  if (t <= cols[0][0]) return color(cols[0][1]);
  for (let i = 1; i < cols.length; i++) if (t <= cols[i][0]) return mixc(color(cols[i - 1][1]), color(cols[i][1]), (t - cols[i - 1][0]) / Math.max(1e-6, cols[i][0] - cols[i - 1][0]));
  return color(cols[cols.length - 1][1]);
}

// ------------------------------------------------------------------ plantas (polígonos [[x, z], …] centrados)
const rect = (ancho, largo) => [[-ancho / 2, -largo / 2], [ancho / 2, -largo / 2], [ancho / 2, largo / 2], [-ancho / 2, largo / 2]];
const elipse = (rx, rz, n) => { n = n || 24; const o = []; for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI; o.push([Math.cos(a) * rx, Math.sin(a) * rz]); } return o; };
const poligono = (r, n, ang0) => { const o = [], a0 = (ang0 || 0) * Math.PI / 180; for (let i = 0; i < n; i++) { const a = a0 + i / n * 2 * Math.PI; o.push([Math.sin(a) * r, Math.cos(a) * r]); } return o; };
// mueve una planta: escala s (o [sx, sz]), gira ang grados y traslada (dx, dz)
const mover = (pl, dx, dz, ang, s) => { const a = (ang || 0) * Math.PI / 180, c = Math.cos(a), si = Math.sin(a), sx = Array.isArray(s) ? s[0] : (s || 1), sz = Array.isArray(s) ? s[1] : (s || 1);
  return pl.map(p => { const x = p[0] * sx, z = p[1] * sz; return [(dx || 0) + x * c + z * si, (dz || 0) - x * si + z * c]; }); };
const okPl = pl => Array.isArray(pl) && pl.length >= 3 && pl.every(p => p && isFinite(p[0]) && isFinite(p[1]));

// ------------------------------------------------------------------ biblioteca de arquetipos (todas: B primero, metros locales)
// prisma: extruye la planta de y0 a y1 (número, o función (x, z) → y para cubiertas inclinadas).
//   o = { aux, techo: color de la tapa, kTecho, auxTecho, sinTecho, suelo: true (tapa de abajo) }
function prisma(B, pl, y0, y1, col, k, o) {
  if (!B || !okPl(pl)) return; o = o || {}; col = color(col); k = k || K.LISO;
  const Y = typeof y1 === 'function' ? y1 : () => y1, n = pl.length;
  for (let i = 0; i < n; i++) { const a = pl[i], b = pl[(i + 1) % n], ya = Y(a[0], a[1]), yb = Y(b[0], b[1]);
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-4) continue;
    q4(B, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], yb, b[1]], [a[0], ya, a[1]], col, k, o.aux); }
  if (!o.sinTecho) poly(B, pl.map(p => [p[0], Y(p[0], p[1]), p[1]]), o.techo ? color(o.techo) : shadeC(col, 0.92), o.kTecho || (k === K.CORTINA || k === K.VENTANAS ? K.LISO : k), o.auxTecho);
  if (o.suelo) poly(B, pl.map(p => [p[0], y0, p[1]]), shadeC(col, 0.7), k, o.aux);
}
// loft: une plantas con el MISMO número de vértices a distintas alturas (de abajo arriba): niveles = [[y, planta], …].
//   Sirve para lo que se estrecha, se tuerce o se curva en altura (velas, torres que giran). o como en prisma
function loft(B, niveles, col, k, o) {
  if (!B || !Array.isArray(niveles) || niveles.length < 2) return; o = o || {}; col = color(col); k = k || K.LISO;
  const n = niveles[0][1] && niveles[0][1].length; if (!niveles.every(l => okPl(l[1]) && l[1].length === n && isFinite(l[0]))) return;
  for (let j = 0; j + 1 < niveles.length; j++) { const [y0, p0] = niveles[j], [y1, p1] = niveles[j + 1];
    for (let i = 0; i < n; i++) { const i1 = (i + 1) % n;
      q4(B, [p0[i][0], y0, p0[i][1]], [p0[i1][0], y0, p0[i1][1]], [p1[i1][0], y1, p1[i1][1]], [p1[i][0], y1, p1[i][1]], col, k, o.aux); } }
  const [yt, pt] = niveles[niveles.length - 1], [yb, pb] = niveles[0];
  if (!o.sinTecho) poly(B, pt.map(p => [p[0], yt, p[1]]), o.techo ? color(o.techo) : shadeC(col, 0.92), o.kTecho || (k === K.CORTINA || k === K.VENTANAS ? K.LISO : k), o.auxTecho);
  if (o.suelo) poly(B, pb.map(p => [p[0], yb, p[1]]), shadeC(col, 0.7), k, o.aux);
}
// caja: centro (x, z), base y0, ancho (X de la pieza), largo (Z de la pieza), alto, girada ang grados. o como en prisma
function caja(B, x, z, y0, ancho, largo, alto, ang, col, k, o) { prisma(B, mover(rect(ancho, largo), x, z, ang), y0, y0 + alto, col, k, o); }
// extruir: perfil vertical [[u, y], …] (u a lo largo de X de la pieza) extruido en Z de d0 a d1, y colocado en (x, z, ang).
//   o = { aux, x, z, ang, tapas: false para no cerrar las caras de delante y detrás }
function extruir(B, perfil, d0, d1, col, k, o) {
  if (!B || !okPl(perfil)) return; o = o || {}; col = color(col); k = k || K.LISO; const v0 = B.nv, n = perfil.length;
  if (o.tapas !== false) for (const d of [d0, d1]) poly(B, perfil.map(p => [p[0], p[1], d]), col, k, o.aux);
  for (let i = 0; i < n; i++) { const a = perfil[i], b = perfil[(i + 1) % n]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-4) continue;
    q4(B, [a[0], a[1], d0], [b[0], b[1], d0], [b[0], b[1], d1], [a[0], a[1], d1], Math.abs(b[1] - a[1]) < 1e-3 ? shadeC(col, 0.95) : col, k, o.aux); }
  xf(B, v0, o.x || 0, o.z || 0, o.ang || 0);
}
// torre: prisma con retranqueos y coronación.
//   o = { x, z, ang, y0, alto, planta | ancho + largo | radio (+ lados), col, k (CORTINA), aux, techo,
//         tramos: [[desde (fracción del alto), escala], …] (retranqueos: a partir de esa altura la planta se escala),
//         corona: { alto, escala, col, k, aux } }
function torre(B, o) {
  if (!B || !o) return; const v0 = B.nv, alto = o.alto || 30, y0 = o.y0 || 0, col = color(o.col || [150, 165, 180]), k = o.k || K.CORTINA;
  const pl = o.planta || (o.radio ? elipse(o.radio, o.radio, o.lados || 24) : rect(o.ancho || 20, o.largo || 20)); if (!okPl(pl)) return;
  const tr = [[0, 1]].concat(o.tramos || []);
  for (let i = 0; i < tr.length; i++) {
    const ya = y0 + tr[i][0] * alto, yb = y0 + (i + 1 < tr.length ? tr[i + 1][0] : 1) * alto; if (yb - ya < 0.05) continue;
    prisma(B, mover(pl, 0, 0, 0, tr[i][1]), ya, yb, col, k, { aux: o.aux, techo: o.techo });
  }
  if (o.corona) { const c = o.corona, s = (c.escala || 1.02) * tr[tr.length - 1][1];
    prisma(B, mover(pl, 0, 0, 0, s), y0 + alto, y0 + alto + (c.alto || 3), c.col ? color(c.col) : shadeC(col, 0.8), c.k || K.LISO, { aux: c.aux }); }
  xf(B, v0, o.x || 0, o.z || 0, o.ang || 0);
}
// aguja: huso de revolución con base en (x, y0, z), radio r y alto `alto`.
//   Perfil: radio constante hasta la fracción `recto` del alto y después r·(1 − s^pot)^exp (s de 0 a 1 en el resto).
//   pot 1 / exp 0,5 = paraboloide (agujas de Gaudí) · pot 2 / exp 0,5 = media elipse (bala) · pot 1 / exp 1 = cono.
//   o = { lados 20, pasos 10, recto 0, pot 1, exp 0.5, col, cols: [[t, color], …] por altura (t de 0 a 1), cortes (anillos
//         intermedios del tramo recto: 6 si hay cols), k, aux, sx, sz (planta elíptica),
//         remate: { alto, r, col, k, forma: 'esfera' | 'cono' } }
function aguja(B, x, z, y0, alto, r, o) {
  if (!B || !(alto > 0) || !(r > 0)) return; o = o || {}; const v0 = B.nv, pasos = o.pasos || 10, rec = Math.max(0, Math.min(0.98, o.recto || 0)), pot = o.pot || 1, ex = o.exp === undefined ? 0.5 : o.exp;
  const col = color(o.col || [200, 190, 170]), cc = t => o.cols ? ramp(o.cols, t) : col, prof = [];
  prof.push([r, 0, cc(0)]);
  if (rec > 0) { const nc = o.cortes === undefined ? (o.cols ? 6 : 0) : o.cortes;      // anillos intermedios del tramo recto (para el degradado)
    for (let i = 1; i <= nc; i++) prof.push([r, rec * alto * i / (nc + 1), cc(rec * i / (nc + 1))]);
    prof.push([r, rec * alto, cc(rec)]); }
  for (let i = 1; i <= pasos; i++) { const s = i / pasos, t = rec + s * (1 - rec); prof.push([i === pasos ? 0 : r * Math.pow(Math.max(0, 1 - Math.pow(s, pot)), ex), t * alto, cc(t)]); }
  rev(B, F0, 0, 0, prof, o.lados || 20, col, o.k || K.LISO, { aux: o.aux });
  if (o.sx || o.sz) xf(B, v0, 0, 0, 0, o.sx || 1, o.sz || 1);
  if (o.remate) { const m = o.remate, rr = m.r || r * 0.12, mc = color(m.col || col);
    if (m.forma === 'cono') rev(B, F0, 0, 0, [[rr, alto - rr], [0, alto + (m.alto || rr * 4)]], 8, mc, m.k || K.METAL);
    else sphere(B, F0, 0, alto + rr * 0.6, 0, rr, 10, 6, mc, m.k || K.METAL); }
  xf(B, v0, x, z, 0, 1, 1, y0);
}
// cúpula: media elipse de revolución sobre (x, y0, z), radio r y flecha `alto`. o = { lados 24, anillos 7, col, k, aux, linterna: { r, alto, col, k } }
function cupula(B, x, z, y0, r, alto, o) {
  if (!B || !(r > 0)) return; o = o || {}; const n = o.anillos || 7, col = color(o.col || [190, 180, 160]), prof = [];
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI / 2; prof.push([i === n ? 0 : r * Math.cos(a), y0 + alto * Math.sin(a)]); }
  rev(B, F0, x, z, prof, o.lados || 24, col, o.k || K.LISO, { aux: o.aux });
  if (o.linterna) { const l = o.linterna, lr = l.r || r * 0.15, la = l.alto || lr * 2.5, lc = color(l.col || col);
    tambor(B, x, z, y0 + alto * 0.97, y0 + alto + la * 0.6, lr, { col: lc, k: l.k || o.k, lados: 8 });
    rev(B, F0, x, z, [[lr * 1.1, y0 + alto + la * 0.6], [0, y0 + alto + la]], 8, lc, l.k || o.k || K.LISO); }
}
// tambor: cilindro (o tronco de cono con o.r1) de y0 a y1, con tapa. o = { lados 24, col, k, aux, r1, sinTapa, a0, a1 (arco parcial, rad) }
function tambor(B, x, z, y0, y1, r, o) {
  if (!B || !(r > 0) || !(y1 > y0)) return; o = o || {};
  rev(B, F0, x, z, [[r, y0], [o.r1 === undefined ? r : o.r1, y1]], o.lados || 24, color(o.col || [200, 195, 185]), o.k || K.LISO, { aux: o.aux, cap: o.sinTapa ? 0 : 1, a0: o.a0, a1: o.a1 });
}
// cubierta sobre un rectángulo ancho × largo (largo en Z de la pieza) con base en y0 y altura de cumbrera `alto`.
//   o = { tipo: 'dos' (a dos aguas, cumbrera a lo largo) | 'cuatro' | 'boveda' | 'piramide', ang, col, k (TEJA), aux, vuelo 0 }
function cubierta(B, x, z, y0, ancho, largo, alto, o) {
  if (!B || !(ancho > 0) || !(largo > 0)) return; o = o || {}; const v0 = B.nv, col = color(o.col || [168, 82, 58]), k = o.k || K.TEJA, a = o.aux, tipo = o.tipo || 'dos';
  const w = ancho / 2 + (o.vuelo || 0), l = largo / 2 + (o.vuelo || 0), y1 = y0 + alto;
  if (tipo === 'boveda') {
    const n = 10; B.grow((n + 1) * 2, n * 6);
    const base = B.nv; for (let i = 0; i <= n; i++) { const t = Math.PI * i / n, cx = -Math.cos(t) * w, cy = y0 + Math.sin(t) * alto, nx = -Math.cos(t) / w, ny = Math.sin(t) / alto;
      pv(B, cx, cy, -l, nx, ny, 0, 1, col, k, a); pv(B, cx, cy, l, nx, ny, 0, 1, col, k, a); }
    for (let i = 0; i < n; i++) { const p = base + i * 2; tri(B, p, p + 2, p + 3); tri(B, p, p + 3, p + 1); }
    for (const d of [-l, l]) { const pts = []; for (let i = 0; i <= n; i++) { const t = Math.PI * i / n; pts.push([-Math.cos(t) * w, y0 + Math.sin(t) * alto, d]); } poly(B, pts, shadeC(col, 0.9), k, a); }
  } else if (tipo === 'piramide' || (tipo === 'cuatro' && largo <= ancho)) {
    const c = [[-w, y0, -l], [w, y0, -l], [w, y0, l], [-w, y0, l]], t = [0, y1, 0];
    for (let i = 0; i < 4; i++) poly(B, [c[i], c[(i + 1) % 4], t], col, k, a);
  } else if (tipo === 'cuatro') {
    const r = l - w;
    poly(B, [[-w, y0, -l], [w, y0, -l], [0, y1, -r]], col, k, a); poly(B, [[w, y0, l], [-w, y0, l], [0, y1, r]], col, k, a);
    q4(B, [w, y0, -l], [w, y0, l], [0, y1, r], [0, y1, -r], col, k, a); q4(B, [-w, y0, l], [-w, y0, -l], [0, y1, -r], [0, y1, r], col, k, a);
  } else {
    q4(B, [w, y0, -l], [w, y0, l], [0, y1, l], [0, y1, -l], col, k, a); q4(B, [-w, y0, l], [-w, y0, -l], [0, y1, -l], [0, y1, l], col, k, a);
    const g = o.colHastial ? color(o.colHastial) : shadeC(col, 0.85), kg = o.kHastial || k;
    poly(B, [[-w, y0, -l], [w, y0, -l], [0, y1, -l]], g, kg, a); poly(B, [[w, y0, l], [-w, y0, l], [0, y1, l]], g, kg, a);
  }
  xf(B, v0, x, z, o.ang || 0);
}
// nave de iglesia a lo largo de +Z (fachada en −Z, ábside en +Z), centrada en (x, z).
//   o = { x, z, ang, ancho, largo, alto (cornisa), col, k (PIEDRA), aux, tejado (color), abside: true,
//         campanarios: 0 | 1 | 2, altoCamp (1,8·alto), ladoCamp (0,32·ancho), agujaCamp: true (chapitel) | false (terraza), colCamp }
function nave(B, o) {
  if (!B || !o) return; const v0 = B.nv, an = o.ancho || 16, la = o.largo || 40, al = o.alto || 18, col = color(o.col || [196, 180, 150]), k = o.k || K.PIEDRA, tj = o.tejado || [120, 110, 100];
  caja(B, 0, 0, 0, an, la, al, 0, col, k, { aux: o.aux });
  cubierta(B, 0, 0, al, an, la, an * 0.38, { col: tj, colHastial: col, kHastial: k });
  if (o.abside !== false) { const r = an * 0.45; tambor(B, 0, la / 2, 0, al * 0.85, r, { col, k, aux: o.aux, a0: 0, a1: Math.PI, lados: 10, sinTapa: true });
    rev(B, F0, 0, la / 2, [[r, al * 0.85], [0, al * 0.85 + r * 0.7]], 10, color(tj), K.TEJA, { a0: 0, a1: Math.PI }); }
  const nc = o.campanarios || 0, s = o.ladoCamp || an * 0.32, ac = o.altoCamp || al * 1.8, cc = color(o.colCamp || col);
  const pos = nc === 2 ? [[-an / 2 + s / 2, -la / 2 - s * 0.2], [an / 2 - s / 2, -la / 2 - s * 0.2]] : nc === 1 ? [[0, -la / 2 - s / 2]] : [];
  for (const p of pos) { caja(B, p[0], p[1], 0, s, s, ac, 0, cc, k, { aux: o.aux });
    if (o.agujaCamp !== false) cubierta(B, p[0], p[1], ac, s, s, s * 1.6, { tipo: 'piramide', col: tj }); }
  xf(B, v0, o.x || 0, o.z || 0, o.ang || 0);
}
// columnata: n columnas de radio r entre (x0, z0) y (x1, z1), de y0 a y0 + alto, con entablamento encima.
//   o = { col, k (PIEDRA), lados 8, entablamento: alto (0,12·alto; 0 = sin), colEnt }
function columnata(B, x0, z0, x1, z1, y0, alto, n, r, o) {
  if (!B || !(n >= 1)) return; o = o || {}; const col = color(o.col || [215, 205, 185]), k = o.k || K.PIEDRA, e = o.entablamento === undefined ? alto * 0.12 : o.entablamento;
  for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); tambor(B, x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, y0, y0 + alto - e, r, { col, k, lados: o.lados || 8, sinTapa: e > 0 }); }
  if (e > 0) { const L = Math.hypot(x1 - x0, z1 - z0) + r * 3, ang = Math.atan2(x1 - x0, z1 - z0) * 180 / Math.PI;
    caja(B, (x0 + x1) / 2, (z0 + z1) / 2, y0 + alto - e, r * 2.6, L, e, ang, color(o.colEnt || col), k); }
}
// arco (de triunfo, puerta): bloque ancho × fondo × alto con un vano de anchura `luz` y clave a `altoLuz` (medio punto),
//   centrado en (x, z), con el paso a lo largo de Z de la pieza. o = { ang, col, k, aux, pasos 10 }
function arco(B, x, z, y0, ancho, fondo, alto, luz, altoLuz, o) {
  if (!B) return; o = o || {}; const w = ancho / 2, h = luz / 2, sp = Math.max(0, altoLuz - h), n = o.pasos || 10, pf = [[-w, y0], [-h, y0]];
  for (let i = 0; i <= n; i++) { const t = Math.PI * (1 - i / n); pf.push([Math.cos(t) * h, y0 + sp + Math.sin(t) * h]); }
  pf.push([h, y0], [w, y0], [w, y0 + alto], [-w, y0 + alto]);
  extruir(B, pf, -fondo / 2, fondo / 2, o.col || [170, 80, 60], o.k || K.LADRILLO, { aux: o.aux, x, z, ang: o.ang });
}
// chimenea: fuste de revolución de radio r0 abajo a r1 arriba. o = { lados 16, col, k (LISO), aux, bandas: [[y0, y1, color], …], boca: color del remate }
function chimenea(B, x, z, y0, alto, r0, r1, o) {
  if (!B || !(alto > 0)) return; o = o || {}; const col = color(o.col || [190, 185, 178]), rA = y => r0 + (r1 - r0) * Math.min(1, Math.max(0, y / alto)), prof = [[r0, y0, col]];
  for (const b of (o.bandas || []).slice().sort((p, q) => p[0] - q[0])) { const bc = color(b[2]);
    prof.push([rA(b[0]), y0 + b[0], col], [rA(b[0]), y0 + b[0], bc], [rA(b[1]), y0 + b[1], bc], [rA(b[1]), y0 + b[1], col]); }
  prof.push([r1, y0 + alto, col]);
  const boca = color(o.boca || shadeC(col, 0.55)); prof.push([r1, y0 + alto, boca], [r1 * 0.85, y0 + alto, boca], [r1 * 0.85, y0 + alto - 2, [30, 28, 26]], [0, y0 + alto - 2, [30, 28, 26]]);
  rev(B, F0, x, z, prof, o.lados || 16, col, o.k || K.LISO, { aux: o.aux });
}
// grada: anillo de graderío elíptico con pendiente, centrado en (cx, cz): borde interior (rx0, rz0) a la cota y0 y borde
//   exterior (rx1, rz1) a y1, con muro exterior hasta el suelo. o = { lados 48, ang, col, k (GRADA), aux, muro: color, kMuro,
//   auxMuro, sinMuro, a0, a1 (tramo parcial en grados, desde +Z hacia +X) }
function grada(B, cx, cz, rx0, rz0, y0, rx1, rz1, y1, o) {
  if (!B) return; o = o || {}; const v0 = B.nv, n = o.lados || 48, col = color(o.col || [150, 40, 50]), k = o.k || K.GRADA, a = o.aux || aux4(8.5, 16, 0, 0);
  const full = o.a0 === undefined, A0 = (o.a0 || 0) * Math.PI / 180, A1 = full ? A0 + 2 * Math.PI : o.a1 * Math.PI / 180, mc = color(o.muro || [205, 200, 192]);
  const P = (t, rx, rz) => [Math.sin(t) * rx, Math.cos(t) * rz];
  for (let i = 0; i < n; i++) { const t0 = A0 + (A1 - A0) * i / n, t1 = A0 + (A1 - A0) * (i + 1) / n;
    const a0 = P(t0, rx0, rz0), b0 = P(t1, rx0, rz0), a1 = P(t0, rx1, rz1), b1 = P(t1, rx1, rz1);
    q4(B, [a0[0], y0, a0[1]], [b0[0], y0, b0[1]], [b1[0], y1, b1[1]], [a1[0], y1, a1[1]], col, k, a); }
  if (!o.sinMuro) { B.grow((n + 1) * 2, n * 6); const base = B.nv;
    for (let i = 0; i <= n; i++) { const t = A0 + (A1 - A0) * i / n, p = P(t, rx1, rz1), nx = Math.sin(t) / rx1, nz = Math.cos(t) / rz1;
      pv(B, p[0], -1, p[1], nx, 0, nz, 1, mc, o.kMuro || K.LISO, o.auxMuro); pv(B, p[0], y1, p[1], nx, 0, nz, 1, mc, o.kMuro || K.LISO, o.auxMuro); }
    for (let i = 0; i < n; i++) { const p = base + i * 2; tri(B, p, p + 2, p + 3); tri(B, p, p + 3, p + 1); }
    if (y0 > 0.3) for (let i = 0; i < n; i++) { const t0 = A0 + (A1 - A0) * i / n, t1 = A0 + (A1 - A0) * (i + 1) / n, p = P(t0, rx0, rz0), q = P(t1, rx0, rz0);
      q4(B, [p[0], 0, p[1]], [q[0], 0, q[1]], [q[0], y0, q[1]], [p[0], y0, p[1]], mc, o.kMuro || K.LISO); } }
  xf(B, v0, cx, cz, o.ang || 0);
}
// anillo plano (corona circular o elíptica) a la cota y (o de y a o.y1 en el borde exterior: anillo inclinado).
//   o = { lados 48, rz: proporción Z/X (1), col, k, aux, ang } · disco: lo mismo con r0 = 0
function anillo(B, cx, cz, r0, r1, y, o) {
  if (!B || !(r1 > r0)) return; o = o || {}; const v0 = B.nv, n = o.lados || 48, s = o.rz || 1, col = color(o.col || [220, 220, 222]), k = o.k || K.METAL, yo = o.y1 === undefined ? y : o.y1;
  for (let i = 0; i < n; i++) { const t0 = i / n * 2 * Math.PI, t1 = (i + 1) / n * 2 * Math.PI, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
    if (r0 > 1e-3) q4(B, [s0 * r0, y, c0 * r0 * s], [s1 * r0, y, c1 * r0 * s], [s1 * r1, yo, c1 * r1 * s], [s0 * r1, yo, c0 * r1 * s], col, k, o.aux);
    else poly(B, [[0, y, 0], [s1 * r1, yo, c1 * r1 * s], [s0 * r1, yo, c0 * r1 * s]], col, k, o.aux); }
  xf(B, v0, cx, cz, o.ang || 0);
}
const disco = (B, cx, cz, r, y, o) => anillo(B, cx, cz, 0, r, y, o);
// mástil: fuste (r abajo, o.r1 arriba) con vientos. o = { col, k (METAL), lados 8, r1, vientos: { n 3, alturas [0.5, 0.9], dist (0,35·alto), col } }
function mastil(B, x, z, y0, alto, r, o) {
  if (!B || !(alto > 0)) return; o = o || {}; const col = color(o.col || [210, 210, 214]);
  tambor(B, x, z, y0, y0 + alto, r, { r1: o.r1 === undefined ? r * 0.5 : o.r1, col, k: o.k || K.METAL, lados: o.lados || 8 });
  const v = o.vientos; if (!v) return; const nv = v.n || 3, d = v.dist || alto * 0.35, vc = color(v.col || [90, 90, 95]);
  for (const hf of (v.alturas || [0.5, 0.9])) for (let i = 0; i < nv; i++) { const t = i / nv * 2 * Math.PI + 0.3;
    bar(B, [x + Math.sin(t) * d, y0, z + Math.cos(t) * d], [x, y0 + alto * hf, z], 0.12, vc, K.METAL); }
}
// pirámide de base ancho × largo y vértice a y0 + alto. o = { ang, col, k, aux }
const piramide = (B, x, z, y0, ancho, largo, alto, o) => cubierta(B, x, z, y0, ancho, largo, alto, Object.assign({ tipo: 'piramide' }, o || {}));
// esfera (o elipsoide con o.sy): o = { gajos 16, anillos 10, col, k, aux, sy }
const esfera = (B, x, y, z, r, o) => { o = o || {}; sphere(B, F0, x, y, z, r, o.gajos || 16, o.anillos || 10, color(o.col || [200, 200, 200]), o.k || K.LISO, o.aux, o.sy); };

const lib = { K, aux: AUX, aux4, color, mixc, shade: shadeC, ramp, rect, elipse, poligono, mover, xf, pv, tri, poly, q4,
  prisma, loft, caja, extruir, torre, aguja, cupula, tambor, cubierta, nave, columnata, arco, chimenea, grada, anillo, disco, mastil, piramide, esfera,
  // primitivas de geo.js por si hacen falta (marco F0 = coordenadas locales del hito)
  F0, quad, rev, tube, sphere, obox, bar, cyl };

window.BCN_LM = { add, lib, K, NOCHE, fichas: FICHAS };

// ?lmtest=1: fichas de prueba del núcleo (DESARROLLO.md §10.7): un constructor que lanza, otro que deja vértices NaN (los
// dos deben quedarse con su volumen genérico) y un retoque de nivel C (color, estilo y altura) junto al Hotel W
if (/[?&]lmtest=1/.test(location.search)) {
  add({ id: 'prueba_falla', nombre: 'Prueba falla', x: 13820, z: 11986, alto: 30, edificios: [52518], build() { throw new Error('fallo a propósito'); } });
  add({ id: 'prueba_nan', x: 13820, z: 11986, alto: 30, edificios: [52519], build(B, h, L) { L.caja(B, 0, 0, 0, 10, 10, NaN, 0, [255, 0, 0]); } });
  add({ id: 'prueba_retoque', nombre: 'Prueba retoque', nivel: 'C', x: 13790, z: 11998, alto: 60, edificios: [52541], ocultar: false,
    retoque: { color: '#3060c0', estilo: 3, alto: 60 } });
}

// ------------------------------------------------------------------ shader de los hitos
// Formato de vértice = el de GB: position, color (rgb + tipo en a), uv (auxiliar), nrm (xyz + 255 si es suave).
// Por malla (onBind): uLmN = (modo de noche, color LED rgb) · uLmH = (alto del hito, semilla).
const VS_LM = `precision highp float;
attribute vec3 position; attribute vec4 color; attribute vec4 uv; attribute vec4 nrm; uniform mat4 world; uniform mat4 viewProjection;
varying vec3 vPos; varying vec3 vLoc; varying vec4 vCol; varying vec4 vInfo; varying vec3 vN; varying float vSm;
void main(){ vec4 wp = world*vec4(position,1.0); vPos = wp.xyz; vLoc = position; vCol = color; vInfo = uv; vN = nrm.xyz*2.0 - 1.0; vSm = nrm.w; gl_Position = viewProjection*wp; }`;
const FS_LM = `
varying vec3 vLoc; varying vec4 vCol; varying vec4 vInfo; varying vec3 vN; varying float vSm;
uniform vec4 uLmN; uniform vec4 uLmH;
// línea antialiasada de anchura w (fracción del periodo) centrada en los enteros de x. De lejos vale su media, w
float lnAA(float x, float w){
  float fw = fwidth(x), d = abs(fract(x + 0.5) - 0.5);
  float l = 1.0 - smoothstep(0.5*w - fw, 0.5*w + fw, d);
  return mix(l, w, smoothstep(0.3, 0.6, fw)); }
// cuánto se ve el detalle de un patrón de periodo 1 en x (1 cerca, 0 cuando ya no cabe en un píxel)
float detAA(float x){ return 1.0 - smoothstep(0.15, 0.5, fwidth(x)); }
void main(){
  vec3 V = uCam - vPos; float dist = length(V); V /= dist;
  vec3 n = normalize(vN);
  if (vSm < 0.5 && dot(n, V) < 0.0) n = -n;
  float kind = floor(vCol.a*255.0 + 0.5);
  vec3 alb = vCol.rgb, N = n, emis = vec3(0.0);
  float rough = 0.82, metal = 0.0, ao = 1.0;
  vec4 a = vInfo*25.5;
  float y = vLoc.y;
  bool horiz = abs(n.y) > 0.7;
  // coordenadas de cara en metros: a lo largo del muro (u) y altura. En lo curvo, arco alrededor del eje vertical del hito
  vec3 tg = normalize(vec3(-n.z, 0.0, n.x) + vec3(1e-5, 0.0, 0.0));
  float u = vSm > 0.5 ? atan(vLoc.z, vLoc.x + 1e-4)*length(vLoc.xz) : dot(vLoc, tg);
  vec2 P = horiz ? vLoc.xz : vec2(u, y);
  float win = 0.0, wh = 0.0, wcool = 0.0, pz = 1.0;
  if (kind < 1.5 || abs(kind - 12.0) < 0.5) {
    // piedra (sillares) o ladrillo: hiladas a soga, juntas y algo de variación por pieza
    bool lad = kind > 1.5;
    float hh = a.x > 0.05 ? a.x : (lad ? 0.3 : 0.6), sw = a.y > 0.05 ? a.y : (lad ? 0.6 : 1.2);
    float row = floor(P.y/hh), bx = P.x/sw + 0.5*mod(row, 2.0);
    float j = horiz ? 0.0 : max(lnAA(P.y/hh, lad ? 0.12 : 0.07), lnAA(bx, lad ? 0.08 : 0.05));
    float hv = hash21(vec2(floor(bx), row));
    alb *= mix(1.0, 0.86 + 0.28*hv, detAA(bx)*(horiz ? 0.4 : 1.0))*(1.0 - (lad ? 0.25 : 0.2)*j);
    alb *= 0.93 + 0.14*vnoise(P*0.08);
    rough = 0.88;
  } else if (kind < 2.5) {
    // liso: estuco u hormigón, con despiece de paneles opcional
    alb *= 0.94 + 0.12*vnoise(P*0.35);
    if (a.x > 0.05) alb *= 1.0 - 0.14*max(lnAA(P.x/a.x, 0.04), lnAA(P.y/a.x, 0.04));
    rough = 0.85;
  } else if (kind < 3.5) {
    // muro con ventanas: rejilla de huecos (alto de planta, vano, fracción de hueco)
    float fp = a.x > 0.05 ? a.x : 3.5, vw = a.y > 0.05 ? a.y : 3.0, hf = vInfo.z > 0.01 ? vInfo.z : 0.45, hv = vInfo.w > 0.01 ? vInfo.w : 0.55;
    vec2 q = vec2(P.x/vw, P.y/fp);
    float hole = horiz ? 0.0 : lnAA(q.x - 0.5, hf)*lnAA(q.y - 0.5, hv)*step(0.5, y);
    alb *= 0.94 + 0.12*vnoise(P*0.3);
    alb = mix(alb, vec3(0.075, 0.085, 0.10), hole);
    rough = mix(0.85, 0.18, hole);
    win = hole; wh = hash21(floor(q) + uLmH.y);
  } else if (kind < 4.5) {
    // muro cortina: montantes y forjados, vidrio reflectante con tono por paño
    float fp = a.x > 0.05 ? a.x : 3.8, mw = a.y > 0.05 ? a.y : 1.5;
    vec2 q = vec2(P.x/mw, P.y/fp), cl = floor(q);
    if (horiz) { alb *= 0.75; rough = 0.6; }
    else {
      float mull = max(lnAA(q.y, 0.07), lnAA(q.x, 0.06));
      float hv = hash21(cl + uLmH.y);
      alb *= mix(1.0, 1.0 + (hv - 0.5)*vInfo.z*1.2, detAA(q.x));
      alb = mix(alb, vec3(0.62, 0.64, 0.66)*0.75, mull);
      rough = mix(0.10, 0.5, mull); metal = mix(0.5, 0.0, mull);
      win = 1.0 - mull; wh = hash21(cl + uLmH.y*1.37); wcool = step(0.5, fract(wh*11.3));
    }
  } else if (kind < 5.5) {
    // panel metálico o chapa: juntas, variación de tono y huecos sueltos
    float sd = a.x > 0.05 ? a.x : 1.5;
    vec2 q = P/sd, cl = floor(q);
    float hv = hash21(cl + uLmH.y), d = detAA(q.x), h2 = fract(hv*7.13) - 0.5, h3 = fract(hv*3.71) - 0.5;
    float hole = horiz ? 0.0 : step(hv, vInfo.z)*step(0.5, y);
    alb *= mix(vec3(1.0), vec3(1.0 + h2*vInfo.y*1.3) + vec3(h3, 0.0, -h3)*vInfo.y*0.7, d);
    pz = 0.5 + fract(hv*5.17);
    alb *= 1.0 - 0.12*max(lnAA(q.x, 0.05), lnAA(q.y, 0.05));
    alb = mix(alb, vec3(0.08, 0.09, 0.11), hole*mix(vInfo.z, 1.0, d));
    rough = 0.38; metal = 0.25*(1.0 - hole);
    win = hole*d; wh = fract(hv*13.7);
  } else if (kind < 6.5) {
    // teja: hiladas y variación por pieza
    float row = floor(P.y/0.35);
    alb *= mix(1.0, 0.84 + 0.3*hash21(vec2(floor(P.x/0.5 + 0.5*mod(row, 2.0)), row)), detAA(P.x/0.5));
    alb *= 1.0 - 0.18*lnAA(P.y/0.35, 0.18);
    alb *= 0.9 + 0.2*vnoise(P*0.12);
    rough = 0.72;
  } else if (kind < 7.5) {
    // trencadís: teselas de cerámica rota de colores sobre el color base
    vec2 q = P*3.2 + vec2(vnoise(P*1.7), vnoise(P*1.7 + 7.0))*0.9;
    float hv = hash21(floor(q)), d = detAA(q.x);
    vec3 t = hv < 0.34 ? alb : hv < 0.52 ? vec3(0.93, 0.92, 0.88) : hv < 0.66 ? vec3(0.20, 0.42, 0.78) : hv < 0.80 ? vec3(0.90, 0.72, 0.22) : hv < 0.90 ? vec3(0.30, 0.62, 0.38) : vec3(0.78, 0.30, 0.22);
    vec3 avg = alb*0.45 + vec3(0.62, 0.62, 0.55)*0.55;
    alb = mix(avg, t*(1.0 - 0.35*lnAA(q.x, 0.08))*(1.0 - 0.35*lnAA(q.y, 0.08)), d);
    rough = 0.32;
  } else if (kind < 8.5) {
    // césped de estadio: franjas de corte
    float fr = a.x > 0.05 ? a.x : 5.0;
    alb *= 0.92 + 0.14*lnAA(P.x/(2.0*fr), 0.5);
    rough = 0.95;
  } else if (kind < 9.5) {
    // gradas: filas de asientos (por la altura) y sectores de color alrededor
    float fl = a.x > 0.05 ? a.x : 0.85, ns = vInfo.y > 0.01 ? vInfo.y*255.0 : 16.0;
    float sec = floor((atan(vLoc.z, vLoc.x + 1e-4)/6.2832 + 0.5)*ns);
    alb *= mix(1.0, 0.82 + 0.3*hash21(vec2(sec, 3.7) + uLmH.y), 0.8);
    alb *= 1.0 - 0.35*lnAA(y/fl, 0.3);
    rough = 0.7;
  } else if (kind < 10.5) {
    // agua: casi un espejo con oleaje suave
    N = normalize(n + vec3(vnoise(vLoc.xz*0.6 + uTime*0.35) - 0.5, 0.0, vnoise(vLoc.zx*0.6 - uTime*0.3) - 0.5)*0.14);
    alb *= 0.5; rough = 0.06;
  } else if (kind < 11.5) {
    // emisivo: luz propia con el color del vértice (aux.x ganancia, aux.y: solo de noche)
    float g = vInfo.x*4.0*(vInfo.y > 0.5 ? uDusk : 1.0);
    emis += emit(alb, g); alb *= 0.45; rough = 0.5;
  } else {
    alb *= 0.94 + 0.12*vnoise(P*0.35);
  }
  // NOCHE (por hito): 1 focos (baño cálido desde abajo que cae con la altura), 2 led (color propio), 3 ventanas
  float mode = uLmN.x, H = max(uLmH.x, 1.0);
  if (uDusk > 0.001) {
    float on = homeOn(wh), offi = uDusk*step(fract(wh*5.3), 0.55*homeFrac());
    vec3 wcol = mix(vec3(1.0, 0.78, 0.50), vec3(0.80, 0.90, 1.0), wcool);
    float wl = kind > 3.5 && kind < 4.5 ? offi : on;
    if (mode > 0.5 && mode < 1.5) {
      float f = (0.10 + 0.90*exp(-max(y, 0.0)/(0.45*H)))*(1.0 - 0.75*smoothstep(0.4, 0.9, n.y)) + 0.3*max(-n.y, 0.0);
      emis += emit(alb*vec3(1.0, 0.80, 0.56), 1.1*f*uDusk*(1.0 - 0.55*uLate));
      emis += emit(wcol*win, 0.55*wl);
    } else if (mode > 1.5 && mode < 2.5) {
      vec3 lc = dot(uLmN.yzw, vec3(1.0)) > 0.01 ? uLmN.yzw : alb/max(max(alb.r, max(alb.g, alb.b)), 0.05);
      lc = clamp(mix(vec3(dot(lc, vec3(0.3, 0.59, 0.11))), lc, 1.7), 0.0, 1.0);
      emis += emit(lc, 0.5*pz*uDusk*(1.0 - 0.45*uLate)*(1.0 - 0.7*smoothstep(0.5, 0.95, -n.y))*(1.0 - 0.45*win));
    } else if (mode > 2.5) {
      emis += emit(wcol*win, 0.7*wl);
    }
  }
  // aura nocturna de la calle en la parte baja de los muros (como los volúmenes simples)
  if (uGlow.y > 0.001 && !horiz) emis += emit(kAura*alb, 0.8*exp(-max(y, 0.0)/6.0)*uGlow.y);
  vec3 c = shade(alb, N, V, rough, metal, ao) + emis;
  FRAG(c);
}`;

// ------------------------------------------------------------------ módulo
const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
window.BCN_LANDMARKS = { init(ctx) {
  started = true;
  const { scene, engine, mkMat, reg, heightAt, BREC, bldChunks, PAL } = ctx, VB = BABYLON.VertexBuffer;
  const MAT = mkMat('lm', VS_LM, FS_LM, ['position', 'color', 'uv', 'nrm'], ['uLmN', 'uLmH']);
  MAT.onBindObservable.add(mesh => { const e = MAT.getEffect(), o = mesh && mesh.metadata && mesh.metadata.bcn && mesh.metadata.bcn.lm; if (!e || !o) return;
    e.setFloat4('uLmN', o.n[0], o.n[1], o.n[2], o.n[3]); e.setFloat4('uLmH', o.h[0], o.h[1], 0, 0); });

  // edificio b del registro: { cls, yb, y0, y1, rings: [Float64Array x, z, …] } en mundo (lo mismo que ctx.city.bget, que aún no existe)
  function brec(b) {
    if (!(b >= 0 && b < BREC.n)) return null;
    const dv = BREC.dv[BREC.cont[b]]; let p = BREC.off[b];
    const nR = dv.getUint8(p), cls = dv.getUint8(p + 1), seed = dv.getUint8(p + 2), n = dv.getUint16(p + 4, true);
    const yb = dv.getInt16(p + 6, true) / 10, y0 = dv.getInt16(p + 8, true) / 10, y1 = dv.getInt16(p + 10, true) / 10; p += 12;
    const rsz = []; if (nR > 1) { for (let k = 0; k < nR; k++, p += 2) rsz.push(dv.getUint16(p, true)); } else rsz.push(n);
    const ch = bldChunks[BREC.chunk[b]], rings = [];
    for (const m of rsz) { const a = new Float64Array(m * 2); for (let j = 0; j < m; j++, p += 4) { a[j * 2] = dv.getInt16(p, true) / 10 + ch.ox; a[j * 2 + 1] = dv.getInt16(p + 2, true) / 10 + ch.oz; } rings.push(a); }
    return { b, cls, seed, yb, y0, y1, rings };
  }
  // cambios en los volúmenes simples, agrupados por trozo y aplicados una sola vez: ocultar (colapsar los vértices) y retocar
  const chEdits = new Map();
  const chEdit = b => { const c = BREC.chunk[b]; let e = chEdits.get(c); if (!e) chEdits.set(c, e = { hide: [], tweak: [] }); return e; };
  function applyEdits() {
    for (const [ci, e] of chEdits) {
      const ch = bldChunks[ci], mesh = ch.mesh;
      const pos = mesh.getVerticesData('position');
      if (!pos) { console.warn('Hitos: no se pueden leer las posiciones del trozo ' + mesh.name); continue; }
      for (const b of e.hide) { const v0 = BREC.v0[b], x = pos[v0 * 3], yy = pos[v0 * 3 + 1], z = pos[v0 * 3 + 2];
        for (let v = v0; v < BREC.v1[b]; v++) { pos[v * 3] = x; pos[v * 3 + 1] = yy; pos[v * 3 + 2] = z; } }
      let col = null, infDirty = false;
      for (const t of e.tweak) {
        const { b, r, yb } = t, v0 = BREC.v0[b], v1 = BREC.v1[b];
        if (r.alto > 0) { const Ht = Math.round(r.alto * 10);
          for (let v = v0 + 1; v < v1; v += 2) { pos[v * 3 + 1] = yb + r.alto; const o = v * 4; ch.inf[o] = Ht; ch.inf[o + 1] = Ht; ch.inf[o - 3] = Ht; }
          infDirty = true; }
        if (r.color || r.estilo !== undefined) {
          if (!col) { const vb = mesh.getVertexBuffer('color'), d = vb && vb.getData(); if (!d) continue;
            col = d instanceof Uint8Array ? new Uint8Array(d) : Uint8Array.from(d, x => Math.round(x * 255)); }
          const c3 = r.color ? color(r.color) : null;
          for (let v = v0; v < v1; v++) { const o = v * 4; if (c3) { col[o] = c3[0]; col[o + 1] = c3[1]; col[o + 2] = c3[2]; }
            if (r.estilo !== undefined) col[o + 3] = ((r.estilo & 15) << 4) | (col[o + 3] & 15); }
        }
      }
      if (e.hide.length || e.tweak.some(t => t.r.alto > 0)) mesh.setVerticesData('position', pos, false);
      if (col) mesh.setVerticesBuffer(new VB(engine, col, 'color', false, false, 4, false, 0, 4, VB.UNSIGNED_BYTE, true));
      if (infDirty) ch.vbInfo.update(ch.inf);
    }
  }

  const ST = { hitos: 0, tris: 0, errores: [], ocultos: 0, retocados: 0, list: [] }, byId = new Map();
  for (const f of FICHAS) {
    const rot = (f.rot || 0) * Math.PI / 180, cs = Math.cos(rot), sn = Math.sin(rot);
    const yb = f.y !== undefined ? f.y : heightAt(f.x, f.z) + (f.dy || 0);
    const toL = (wx, wz) => { const dx = wx - f.x, dz = wz - f.z; return [dx * cs - dz * sn, dx * sn + dz * cs]; };
    const edif = [];
    for (const b of (f.edificios || [])) { const d = brec(b); if (!d) { console.warn('Hito ' + f.id + ': edificio ' + b + ' fuera del registro'); continue; }
      edif.push({ b, cls: d.cls, ybB: d.yb, alto: d.y1 - yb, y0: d.y0 - yb, plantas: d.rings.map(r => { const o = []; for (let i = 0; i < r.length; i += 2) o.push(toL(r[i], r[i + 1])); return o; }) }); }
    const rec = { id: f.id, nombre: f.nombre || f.id, nivel: f.nivel || 'B', x: f.x, z: f.z, yb, rot: f.rot || 0, alto: f.alto || 20, ancho: f.ancho || 0, largo: f.largo || 0, tris: 0, ok: false, mesh: null, r: 0 };
    let mesh = null;
    if (f.build) {
      try {
        const h = { id: f.id, x: f.x, z: f.z, yb, rot: f.rot || 0, alto: rec.alto, ancho: f.ancho, largo: f.largo, seed: hashStr(f.id) % 100000, edif,
          plantas: edif.map(e => e.plantas[0]),
          y: (lx, lz) => heightAt(f.x + lx * cs + lz * sn, f.z - lx * sn + lz * cs) - yb,
          mundo: (lx, lz) => [f.x + lx * cs + lz * sn, f.z - lx * sn + lz * cs], local: toL,
          R: (a, b) => GEO.R(a, b) };
        GEO.seed(h.seed, 77);
        const B = new GB(0, 0);
        f.build(B, h, lib);
        if (!B.nv || !B.ni) throw new Error('el constructor no ha emitido geometría');
        const P = B.p, Nn = B.n; let r2 = 0;
        for (let v = 0; v < B.nv; v++) { const o = v * 3, q = v * 4, x = P[o], z = P[o + 2];
          if (!isFinite(x) || !isFinite(P[o + 1]) || !isFinite(z)) throw new Error('vértice no finito (' + v + ')');
          P[o] = x * cs + z * sn; P[o + 2] = -x * sn + z * cs; r2 = Math.max(r2, x * x + z * z);
          const nx = Nn[q] - 128, nz = Nn[q + 2] - 128; Nn[q] = Math.round(128 + nx * cs + nz * sn); Nn[q + 2] = Math.round(128 - nx * sn + nz * cs); }
        mesh = new BABYLON.Mesh('lm_' + f.id, scene);
        mesh.setVerticesData('position', P.slice(0, B.nv * 3), false);
        mesh.setVerticesBuffer(new VB(engine, B.c.slice(0, B.nv * 4), 'color', false, false, 4, false, 0, 4, VB.UNSIGNED_BYTE, true));
        mesh.setVerticesBuffer(new VB(engine, B.a.slice(0, B.nv * 4), 'uv', false, false, 4, false, 0, 4, VB.UNSIGNED_BYTE, true));
        mesh.setVerticesBuffer(new VB(engine, Nn.slice(0, B.nv * 4), 'nrm', false, false, 4, false, 0, 4, VB.UNSIGNED_BYTE, true));
        mesh.setIndices(B.i.slice(0, B.ni), B.nv);
        mesh.material = MAT; mesh.isPickable = false; mesh.renderingGroupId = 1;
        mesh.position.set(f.x, yb, f.z); mesh.freezeWorldMatrix(); mesh.doNotSyncBoundingInfo = true;
        const lc = f.led ? color(f.led) : [0, 0, 0];
        reg(mesh, { cast: f.sombra !== false, layer: 'lm', lm: { id: f.id, n: [NOCHE[f.noche] || 0, lc[0] / 255, lc[1] / 255, lc[2] / 255], h: [rec.alto, (h.seed % 997) / 7] } });
        rec.tris = B.ni / 3; rec.r = Math.sqrt(r2); rec.ok = true; rec.mesh = mesh; ST.tris += rec.tris; ST.hitos++;
      } catch (e) {
        if (mesh) mesh.dispose(); mesh = null;
        ST.errores.push(f.id); console.warn('Hito «' + f.id + '»: el constructor ha fallado, se queda el volumen genérico. ' + (e && e.message || e));
      }
    }
    // volúmenes simples: se ocultan solo si el hito se ha construido; los de nivel C (ocultar: false) se retocan
    { let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9, hh = 0;                       // extensión de los volúmenes sustituidos (para la vista)
      for (const e of edif) { const bb = BREC.bb, k = e.b * 4; x0 = Math.min(x0, bb[k]); z0 = Math.min(z0, bb[k + 1]); x1 = Math.max(x1, bb[k + 2]); z1 = Math.max(z1, bb[k + 3]); hh = Math.max(hh, e.alto); }
      rec.ext = edif.length ? Math.max(x1 - x0, z1 - z0) : 0; rec.altoEd = hh; }
    const hide = rec.ok && f.ocultar !== false;
    for (const e of edif) {
      if (hide) { chEdit(e.b).hide.push(e.b); BREC.elig[e.b] = 0; ST.ocultos++; continue; }
      if (f.retoque) { chEdit(e.b).tweak.push({ b: e.b, r: f.retoque, yb: e.ybB }); ST.retocados++; }
      if (f.fachada === false) BREC.elig[e.b] = 0;
    }
    if (f.nombre && f.etiqueta !== false && ctx.label && (rec.ok || f.retoque)) ctx.label(f.nombre, f.x, yb + rec.alto + 18, f.z);
    ST.list.push(rec); byId.set(f.id, rec);
  }
  try { applyEdits(); } catch (e) { console.warn('Hitos: no se han podido retocar los volúmenes simples', e); }
  // FIX3: nivel de detalle por ficha (§10.9): con puerto, aeropuerto y plazas los hitos suman ~700 k triángulos. Las fichas
  // pequeñas se ocultan a distancia (LOD de Babylon con malla nula, como hace aeropuerto.js con las suyas): a lim m una ficha de
  // tamaño s (alto o radio del modelo) ocupa ~1/80 del alto de la vista (una de 100 m, a 8 km; las del aeropuerto y el puerto
  // siguen viéndose desde el aire sobre ellas)
  for (const r of ST.list) { if (!r.mesh) continue; const sz = Math.max(r.alto || 0, r.r || 0);
    r.lim = Math.max(450, 80 * sz); r.mesh.addLODLevel(r.lim, null); }

  // vista de cámara que encuadra el hito: órbita a k veces su tamaño (alto y ancho/largo de la ficha; sin ellos, el radio del
  // modelo o la extensión de los volúmenes sustituidos), nunca a menos de 60 m, con elevación elev (grados) desde el rumbo dado
  function view(id, rumbo, k, elev) {
    const r = byId.get(id); if (!r) return null;
    const dim = r.ancho || r.largo, S = Math.max(r.alto || 0, dim ? Math.max(r.ancho || 0, r.largo || 0) : Math.max(2 * (r.r || 0), r.ext || 0), 12), D = Math.max(S * (k || 2.4), 60), az = (rumbo === undefined ? 210 : rumbo) * Math.PI / 180, el = (elev === undefined ? 30 : elev) * Math.PI / 180;
    const ty = r.yb + r.alto * 0.42, hd = D * Math.cos(el), x = r.x + Math.sin(az) * hd, z = r.z + Math.cos(az) * hd;
    const y = Math.max(ty + D * Math.sin(el), heightAt(x, z) + 6);
    return { x, y, z, yaw: Math.atan2(r.x - x, r.z - z), pitch: Math.atan2(y - ty, hd), walk: false };
  }
  // edificios del registro cuyo centro cae a menos de r m de (x, z): para preparar las fichas
  function near(x, z, r) {
    const o = [], bb = BREC.bb;
    for (let b = 0; b < BREC.n; b++) { const cx = (bb[b * 4] + bb[b * 4 + 2]) / 2, cz = (bb[b * 4 + 1] + bb[b * 4 + 3]) / 2, d = Math.hypot(cx - x, cz - z);
      if (d > r) continue; const e = brec(b); o.push({ b, cls: e.cls, alto: Math.round((e.y1 - e.yb) * 10) / 10, y0: Math.round((e.y0 - e.yb) * 10) / 10, cx: Math.round(cx), cz: Math.round(cz), d: Math.round(d), ancho: Math.round(bb[b * 4 + 2] - bb[b * 4]), fondo: Math.round(bb[b * 4 + 3] - bb[b * 4 + 1]) }); }
    return o.sort((p, q) => p.d - q.d);
  }
  // trisVis: triángulos de hitos dentro de su distancia de dibujo desde la cámara (sin contar el encuadre)
  const trisVis = () => { const c = scene.activeCamera; if (!c) return ST.tris; const p = c.globalPosition || c.position; let t = 0;
    for (const r of ST.list) { if (!r.mesh) continue; const lv = r.mesh.getLODLevels(), lim = lv.length ? Math.min(...lv.map(l => l.distanceOrScreenCoverage)) : 1e9;
      if (Math.hypot(r.x - p.x, r.yb - p.y, r.z - p.z) < lim) t += r.tris; } return t; };
  const stats = () => ({ hitos: ST.hitos, fichas: FICHAS.length, tris: ST.tris, trisVis: trisVis(), errores: ST.errores.slice(), ocultos: ST.ocultos, retocados: ST.retocados });
  const api = { view, near, stats, get: id => byId.get(id) || null,
    list: () => ST.list.map(r => ({ id: r.id, nombre: r.nombre, nivel: r.nivel, ok: r.ok, tris: r.tris, x: r.x, z: r.z, yb: r.yb, alto: r.alto })) };
  window.BCN.lm = api;
  return { update() {}, busy: () => false, stats, api };
} };
})();
