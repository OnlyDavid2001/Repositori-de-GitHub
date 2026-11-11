/* GTA Barcelona — HITOS, lote b (Camp Nou y Montjuïc). Cada hito se declara con BCN_LM.add({...}) al cargar el script
   (ficha y constructor: DESARROLLO.md §10). Este fichero es SOLO del agente del lote b.
   Funciones locales (no están en el núcleo): superelipses y «estadio» parametrizados por el rayo desde el centro (así dos
   anillos con el mismo número de puntos casan para hacer coronas), bandas verticales y coronas con color por tramo, y
   huecos (arcos de medio punto o de herradura) pintados como polígonos oscuros pegados al muro. */
(function () {
'use strict';
const { add, lib: L, K } = window.BCN_LM;

// ------------------------------------------------------------------ utilidades locales
const RAD = Math.PI / 180;
const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
// cota del terreno local segura (h.y puede faltar o no ser finita)
const hy = (h, x, z) => { try { return num(h && h.y ? h.y(x, z) : 0, 0); } catch (e) { return 0; } };
// superelipse por rayo: punto del borde en la dirección t (rad, desde +Z hacia +X); p = 2 elipse, p grande = rectángulo
const seRay = (rx, rz, p, t) => { const s = Math.sin(t), c = Math.cos(t), d = 1 / Math.pow(Math.pow(Math.abs(s / rx), p) + Math.pow(Math.abs(c / rz), p), 1 / p); return [s * d, c * d]; };
// estadio (cápsula de radio r con rectas de semilargo s a lo largo de Z), por rayo
const capRay = (r, s, t) => {
  const dx = Math.sin(t), dz = Math.cos(t);
  if (Math.abs(dx) > 1e-6) { const d = r / Math.abs(dx); if (Math.abs(d * dz) <= s) return [dx * d, dz * d]; }
  const cz = dz >= 0 ? s : -s, b = dz * cz, d = b + Math.sqrt(Math.max(0, b * b - cz * cz + r * r));
  return [dx * d, dz * d];
};
// anillo de n puntos (cerrado) o arco de a0 a a1 grados (n + 1 puntos) con una función de rayo
const anilloPts = (f, n, a0, a1) => { const o = [], full = a0 === undefined, A0 = full ? 0 : a0 * RAD, A1 = full ? 2 * Math.PI : a1 * RAD, m = full ? n : n + 1;
  for (let i = 0; i < m; i++) o.push(f(A0 + (A1 - A0) * i / n)); return o; };
const SE = (rx, rz, p, n, a0, a1, dx, dz) => anilloPts(t => seRay(rx, rz, p, t), n, a0, a1).map(q => [q[0] + (dx || 0), q[1] + (dz || 0)]);
const CAP = (r, s, n, a0, a1) => anilloPts(t => capRay(r, s, t), n, a0, a1);
const Y = (y, p) => (typeof y === 'function' ? num(y(p[0], p[1]), 0) : y);
const C = (c, i) => (typeof c === 'function' ? c(i) : c);
// banda vertical a lo largo de una polilínea (cerrada salvo abierto) de y0 a y1 (números o funciones (x, z))
function banda(B, pts, y0, y1, col, k, aux, abierto) {
  if (!pts || pts.length < 2) return; const n = pts.length, m = abierto ? n - 1 : n; col = typeof col === 'function' ? col : L.color(col);
  for (let i = 0; i < m; i++) { const a = pts[i], b = pts[(i + 1) % n]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-4) continue;
    L.q4(B, [a[0], Y(y0, a), a[1]], [b[0], Y(y0, b), b[1]], [b[0], Y(y1, b), b[1]], [a[0], Y(y1, a), a[1]], C(col, i), k, aux); }
}
// corona entre dos anillos con el mismo número de puntos (interior a yi, exterior a yo)
function corona(B, pi, yi, po, yo, col, k, aux, abierto) {
  if (!pi || !po || pi.length !== po.length || pi.length < 2) return; const n = pi.length, m = abierto ? n - 1 : n; col = typeof col === 'function' ? col : L.color(col);
  for (let i = 0; i < m; i++) { const j = (i + 1) % n;
    L.q4(B, [pi[i][0], Y(yi, pi[i]), pi[i][1]], [pi[j][0], Y(yi, pi[j]), pi[j][1]], [po[j][0], Y(yo, po[j]), po[j][1]], [po[i][0], Y(yo, po[i]), po[i][1]], C(col, i), k, aux); }
}
// hueco pintado sobre un muro: centro (px, pz) en planta, tangente (tx, tz) y normal hacia fuera (nx, nz); de y0 a y1, ancho w.
//   tipo 'medio' (medio punto), 'herradura' o 'recto'
function hueco(B, px, pz, tx, tz, nx, nz, y0, y1, w, tipo, col) {
  const o = 0.18, P = (u, y) => [px + tx * u + nx * o, y, pz + tz * u + nz * o], r = w / 2, pts = [];
  if (tipo === 'recto') { pts.push(P(-r, y0), P(r, y0), P(r, y1), P(-r, y1)); }
  else if (tipo === 'herradura') { const R = r * 1.12, yc = y1 - R, a0 = -25 * RAD;
    pts.push(P(-R * Math.cos(a0), y0), P(R * Math.cos(a0), y0));
    for (let i = 0; i <= 10; i++) { const a = a0 + (Math.PI - 2 * a0) * i / 10; pts.push(P(R * Math.cos(a), yc + R * Math.sin(a))); } }
  else { const yc = y1 - r; pts.push(P(-r, y0), P(r, y0));
    for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8; pts.push(P(r * Math.cos(a), yc + r * Math.sin(a))); } }
  L.poly(B, pts, L.color(col), K.LISO);
}
// huecos repartidos a lo largo de un anillo cerrado (uno por tramo si cabe; `cada` tramos)
function huecosAnillo(B, pts, y0, y1, w, tipo, col, cada, desfase) {
  const n = pts.length; cada = cada || 1;
  for (let i = desfase || 0; i < n; i += cada) { const a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
    if (l < w * 1.3) continue; const tx = dx / l, tz = dz / l;
    // normal hacia fuera: la que se aleja del centro (0, 0) del anillo
    let nx = tz, nz = -tx; const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2; if (nx * mx + nz * mz < 0) { nx = -nx; nz = -nz; }
    hueco(B, mx, mz, tx, tz, nx, nz, y0, y1, w, tipo, col); }
}
// planta (primer anillo) del edificio b de los sustituidos, o null
const plantaDe = (h, b) => { const e = (h.edif || []).find(q => q && q.b === b); const p = e && e.plantas && e.plantas[0]; return p && p.length >= 3 && p.every(q => q && isFinite(q[0]) && isFinite(q[1])) ? p : null; };
const caja2 = p => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of p) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); } return { x0, x1, z0, z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, w: x1 - x0, l: z1 - z0 }; };
const minY = (h, p, d) => { let m = 0; for (const q of p || []) m = Math.min(m, hy(h, q[0], q[1])); return m - (d === undefined ? 2 : d); };
const escalar = (p, f) => { const c = caja2(p); return p.map(q => [c.cx + (q[0] - c.cx) * f, c.cz + (q[1] - c.cz) * f]); };
// almenas a lo largo de un anillo cerrado
function almenas(B, pts, y, paso, an, fo, al, col, k) {
  const n = pts.length;
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < paso * 0.6) continue;
    const m = Math.max(1, Math.floor(l / paso)), ang = Math.atan2(dx, dz) / RAD;
    for (let j = 0; j < m; j++) { const t = (j + 0.5) / m; L.caja(B, a[0] + dx * t, a[1] + dz * t, y, fo, an, al, ang, col, k); } }
}

const BLAU = L.color('#2b4a8a'), GRANA = L.color('#a50044');

// =================================================================== CAMP NOU (acabado)
// Silueta: gran cuenco oval (rectángulo de esquinas muy redondeadas) de ~60 m, liso por fuera y abierto en el centro.
// Rasgos: anillos horizontales blancos de las terrazas que envuelven todo el estadio (con antepechos azul y grana y el
// fondo oscuro), la gran cubierta en anillo blanca sobre las gradas, tres graderíos en azul y grana y el césped.
add({ id: 'camp_nou', nombre: 'Camp Nou', nivel: 'A', x: 8253.4, z: 13411.6, rot: 158, alto: 60, ancho: 205, largo: 250,
  noche: 'focos', edificios: [70092, 70093, 70094, 70095, 70096],
  build(B, h, L) {
    const N = 88, P = 2.7, BLA = [234, 234, 230], OSC = [58, 60, 66];
    let yF = -1e9; for (let x = -40; x <= 40; x += 10) for (let z = -60; z <= 60; z += 10) yF = Math.max(yF, hy(h, x, z));
    yF = Math.min(6, Math.max(-4, yF)) + 0.3;
    const se = (rx, rz) => SE(rx, rz, P, N);
    // césped y su orla
    L.poly(B, [[-36, yF + 0.05, -55], [36, yF + 0.05, -55], [36, yF + 0.05, 55], [-36, yF + 0.05, 55]], [62, 128, 60], K.CESPED, L.aux.cesped(5.25));
    L.poly(B, se(42, 62).map(p => [p[0], yF, p[1]]), [52, 104, 54], K.CESPED, L.aux.cesped(5.25));
    // tres graderíos continuos: sectores azul y grana (cada graderío desfasado), frentes blancos
    const sect = (off, w) => i => (((i + off) / w | 0) % 2 ? BLAU : GRANA);
    const T = [[40, 62, 0.8, 64, 86, 15, 0], [61, 83, 19, 81, 104, 34, 2], [78, 101, 38, 95, 118, 53, 4]];
    let yPrev = yF;
    for (const t of T) {
      const pin = se(t[0], t[1]), pout = se(t[3], t[4]);
      banda(B, pin, yPrev, yF + t[2], t[6] ? BLA : [40, 44, 52], K.LISO);
      corona(B, pin, yF + t[2], pout, yF + t[5], sect(t[6], 4), K.GRADA, L.aux.grada(0.85, 0));
      yPrev = yF + t[5] - 0.5;
    }
    // fachada: fondo oscuro retranqueado y 8 terrazas en voladizo (losa blanca + antepecho azul o grana por tramos)
    const SR = se(94, 116), SO = se(100, 122), SA = se(99.6, 121.6), y0 = Math.min(-3, yF - 3);
    banda(B, SR, y0, 56, OSC, K.LISO);
    const anteC = (lv) => i => L.mixc(((i + lv * 3) / 6 | 0) % 2 ? BLAU : GRANA, BLA, 0.25);
    for (let lv = 0; lv < 8; lv++) {
      const yk = yF + 2 + lv * 6.9;
      banda(B, SO, yk - 1.3, yk, BLA, K.LISO);
      corona(B, SR, yk, SO, yk, [214, 214, 210], K.LISO);
      banda(B, SA, yk, yk + 1.1, anteC(lv), K.LISO);
    }
    // remate de la fachada y gran cubierta en anillo (ligeramente inclinada), con su anillo interior oscuro
    banda(B, SO, yF + 55, yF + 59.5, BLA, K.METAL, L.aux.panel(3, 0.1, 0));
    const RI = se(60, 82), RO = se(100.5, 122.5);
    corona(B, RI, yF + 57.2, RO, yF + 59.5, [238, 238, 236], K.METAL, L.aux.panel(4, 0.12, 0));
    banda(B, RI, yF + 55.6, yF + 57.2, [90, 92, 98], K.METAL, L.aux.panel(2, 0.1, 0));
    corona(B, RI, yF + 55.6, se(66, 88), yF + 56.6, [180, 182, 186], K.METAL);
    // pasarelas de acceso (dos puentes en los fondos) que bajan del primer anillo a la calle
    for (const s of [-1, 1]) L.caja(B, 0, s * 128, y0, 26, 14, yF + 2 - y0, 0, [200, 200, 196], K.LISO);
  } });

// Palau Blaugrana: retoque del volumen existente (pabellón bajo y ancho, gris claro)
add({ id: 'palau_blaugrana', nombre: 'Palau Blaugrana', nivel: 'C', x: 8028, z: 13319.5, rot: 158, alto: 18, noche: 'nada',
  edificios: [69987, 70097], ocultar: false, fachada: false, retoque: { color: '#c8c4bc', estilo: 1, alto: 18 } });

// =================================================================== ESTADI OLÍMPIC LLUÍS COMPANYS
// Silueta: estadio alargado N-S de muros rectos (planta de los datos, 184 × 277 m) de ~22 m con cornisa.
// Rasgos: fachada de piedra ocre con arcadas, la marquesina blanca curva de la tribuna (oeste), pista roja y césped,
// pórtico de entrada con dos grupos ecuestres (este) y el pebetero (sur).
add({ id: 'estadi_olimpic', nombre: 'Estadi Olímpic Lluís Companys', nivel: 'A', x: 10983.3, z: 11594.6, rot: 2, alto: 32, ancho: 184, largo: 277,
  noche: 'focos', edificios: [52371, 52372],
  build(B, h, L) {
    let rx = 90, rz = 136, cx = 0, cz = 0;
    const pl = plantaDe(h, 52371);
    if (pl) { const c = caja2(pl); if (c.w > 120 && c.w < 240 && c.l > 180 && c.l < 330) { rx = c.w / 2 - 1; rz = c.l / 2 - 2; cx = c.cx; cz = c.cz; } }
    const N = 96, P = 3.4, OCRE = L.color('#d2b48c'), v0 = B.nv;
    const yb = Math.min(-3, minY(h, SE(rx, rz, P, 24), 2));
    const F = SE(rx, rz, P, N), FI = SE(rx - 5, rz - 5, P, N), FO = SE(rx + 0.6, rz + 0.6, P, N);
    banda(B, F, yb, 21, OCRE, K.PIEDRA, L.aux.piedra(0.7, 1.4));
    banda(B, FO, 21, 23, [228, 210, 172], K.PIEDRA, L.aux.piedra(0.5, 1.2));
    corona(B, FI, 23, FO, 23, [196, 176, 140], K.PIEDRA);
    banda(B, FI, 19, 23, [188, 168, 134], K.PIEDRA);
    huecosAnillo(B, F, 11.5, 18.5, 3.4, 'medio', [52, 44, 36]);
    huecosAnillo(B, F, 0.5, 5.2, 2.6, 'recto', [60, 50, 40], 2);
    // pista (cápsula de 400 m), césped y gradas hasta la cornisa
    const yP = 0.4, TI = CAP(36.5, 42.2, N), TO = CAP(46.5, 42.2, N), GI = CAP(48.5, 42.2, N);
    L.poly(B, TI.map(p => [p[0], yP, p[1]]), [70, 140, 64], K.CESPED, L.aux.cesped(5));
    corona(B, TI, yP, TO, yP, [181, 84, 58], K.LISO);
    corona(B, TO, yP, GI, yP + 0.2, [150, 140, 128], K.LISO);
    const GO = anilloPts(t => seRay(rx - 5, rz - 5, P, t), N);
    // GI y GO deben casar punto a punto: los dos por rayo con el mismo t
    corona(B, GI, yP + 1.2, GO, 19, i => (i % 12 < 6 ? [156, 152, 146] : [138, 136, 132]), K.GRADA, L.aux.grada(0.8, 0));
    banda(B, GI, yP, yP + 1.2, [70, 80, 96], K.LISO);
    // marquesina blanca curva de la tribuna (oeste: t ≈ 270°)
    const MI = SE(rx - 26, rz - 40, P, 24, 236, 304), MO = SE(rx - 2, rz - 2, P, 24, 232, 308);
    corona(B, MI, 32, MO, 27.5, [240, 238, 232], K.METAL, L.aux.panel(3, 0.08, 0), true);
    banda(B, MI, 31.1, 32, [222, 220, 214], K.METAL, null, true);
    for (let i = 2; i <= 22; i += 4) { const p = MO[i]; L.tambor(B, p[0], p[1], 21, 27.2, 0.5, { lados: 6, col: [230, 228, 222], k: K.LISO }); }
    // pórtico de entrada (este, t = 90°) con columnas y dos grupos ecuestres; pebetero al sur
    const g = seRay(rx, rz, P, Math.PI / 2);
    L.caja(B, g[0] - 2, 0, yb, 8, 40, 27 - yb, 0, [222, 204, 168], K.PIEDRA, { aux: L.aux.piedra(0.7, 1.4) });
    L.columnata(B, g[0] + 3.5, -14, g[0] + 3.5, 14, yb, 22 - yb, 6, 1.1, { col: [228, 214, 182], entablamento: 2.4 });
    for (const s of [-1, 1]) { L.caja(B, g[0] + 1, s * 13, 27, 4, 5, 2, 0, [222, 204, 168], K.PIEDRA);
      L.caja(B, g[0] + 1, s * 13, 29, 1.6, 3.6, 2.4, 0, [88, 98, 84], K.METAL); L.caja(B, g[0] + 1, s * 13 + s * 0.6, 31.4, 1.2, 1.2, 2.2, 0, [88, 98, 84], K.METAL); }
    const pb = seRay(rx - 3, rz - 3, P, 200 * RAD);
    L.tambor(B, pb[0], pb[1], 18, 27, 0.9, { lados: 8, col: [200, 190, 170], k: K.PIEDRA });
    L.tambor(B, pb[0], pb[1], 27, 29.5, 0.9, { r1: 3, lados: 12, col: [110, 108, 104], k: K.METAL });
    L.xf(B, v0, cx, cz, 0);
  } });

// =================================================================== PALAU SANT JORDI
// Silueta: caparazón metálico gris rebajado (planta casi rectangular, 110 × 132 m) sobre un zócalo macizo; la parte central
// se levanta en cúpula hasta ~45 m. Rasgos: la cúpula rebajada gris, la franja de lucernarios entre el tejado perimetral
// y la cúpula, el zócalo de ladrillo y hormigón.
add({ id: 'palau_sant_jordi', nombre: 'Palau Sant Jordi', nivel: 'A', x: 10722.1, z: 11449.3, rot: 1, alto: 45, ancho: 110, largo: 132,
  noche: 'focos', edificios: [52375, 52376],
  build(B, h, L) {
    const N = 64, rx = 54, rz = 65.5, yb = Math.min(-3, minY(h, SE(rx, rz, 4, 16), 2));
    const lvl = (s, p) => SE(rx * s, rz * s, p, N);
    banda(B, lvl(0.985, 4.2), yb, 8, [196, 166, 138], K.LADRILLO, L.aux.ladrillo(0.3, 0.6));
    banda(B, lvl(0.99, 4.2), 0, 3.4, [150, 146, 140], K.LISO);
    const GR = [140, 148, 156], VID = [62, 76, 92];
    // tejado perimetral (alero), franja de lucernarios y cúpula
    L.loft(B, [[8, lvl(1.03, 4.2)], [10.5, lvl(0.97, 4.0)], [14, lvl(0.88, 3.6)]], GR, K.METAL, { aux: L.aux.panel(2.5, 0.25, 0), sinTecho: true });
    L.loft(B, [[14, lvl(0.88, 3.6)], [19, lvl(0.85, 3.4)]], VID, K.CORTINA, { aux: L.aux.cortina(2.5, 1.2, 0.2), sinTecho: true });
    L.loft(B, [[19, lvl(0.85, 3.4)], [26, lvl(0.8, 3.0)], [33, lvl(0.68, 2.7)], [39, lvl(0.5, 2.4)], [43, lvl(0.3, 2.2)], [45, lvl(0.12, 2.1)]],
      [150, 156, 164], K.METAL, { aux: L.aux.panel(2.2, 0.3, 0), techo: [156, 160, 166], kTecho: K.METAL });
    // lucernarios en franja a lo largo de la cumbre
    L.caja(B, 0, 0, 44.6, 4, 70, 0.9, 0, VID, K.CORTINA, { aux: L.aux.cortina(2, 1.2, 0.2) });
    // bosque de columnas finas de la explanada (Utsurohi), al oeste
    for (let i = 0; i < 18; i++) { const a = h.R ? h.R(0, 1) : (i * 0.37) % 1, b = h.R ? h.R(0, 1) : (i * 0.61) % 1;
      L.tambor(B, -rx - 18 - a * 22, -30 + b * 60, hy(h, -rx - 18 - a * 22, -30 + b * 60) - 1, 9 + a * 5, 0.18, { lados: 5, col: [190, 192, 196], k: K.METAL }); }
  } });

// =================================================================== TORRE DE CALATRAVA
// Silueta: fuste blanco esbelto e inclinado (≈ 15°) de 136 m, que se afila hasta una aguja. Rasgos: la inclinación,
// el anillo semicircular de antenas a media altura y la base de trencadís.
add({ id: 'torre_calatrava', nombre: 'Torre de Calatrava', nivel: 'A', x: 10559.2, z: 11544.8, rot: 0, alto: 136, ancho: 16, largo: 44,
  noche: 'focos', edificios: [52411, 52412, 52413],
  build(B, h, L) {
    const BL = [242, 242, 238], top = 136, lean = 36, y0 = Math.min(-3, hy(h, 0, 0) - 3);
    const zc = y => lean * Math.pow(Math.max(0, y - 6) / (top - 6), 1.15);
    // base: zócalo elíptico revestido de trencadís
    const v0 = B.nv; L.tambor(B, 0, 0, y0, 6, 8, { lados: 20, r1: 6.5, col: [222, 222, 214], k: K.TRENCADIS }); L.xf(B, v0, 0, 1, 0, 1, 1.35);
    // fuste: sección lenticular que se afila (loft de 10 niveles)
    const niv = [];
    for (let i = 0; i <= 10; i++) { const y = 4 + (top - 4) * i / 10, f = 1 - i / 10;
      niv.push([y, L.mover(L.elipse(0.5 + 2.6 * Math.pow(f, 0.8), 0.6 + 4.6 * Math.pow(f, 0.9), 10), 0, zc(y))]); }
    L.loft(B, niv, BL, K.LISO, { aux: L.aux.liso(3) });
    // anillo semicircular a media altura, perpendicular al fuste, por detrás
    const yc = 60, cz = zc(yc), ax = [0, 1, lean / (top - 6) * 1.15], la = Math.hypot(ax[1], ax[2]), e2 = [0, -ax[2] / la, ax[1] / la];
    const R0 = 9.5, R1 = 12, n = 16;
    for (let i = 0; i < n; i++) { const a = Math.PI * i / n, b = Math.PI * (i + 1) / n;
      const P = (r, t) => [Math.cos(t) * r, yc - Math.sin(t) * r * e2[1], cz - Math.sin(t) * r * e2[2]];
      L.q4(B, P(R0, a), P(R0, b), P(R1, b), P(R1, a), [226, 226, 222], K.METAL); }
    for (let i = 0; i <= 8; i++) { const t = Math.PI * i / 8, p = [Math.cos(t) * 12, yc - Math.sin(t) * 12 * e2[1], cz - Math.sin(t) * 12 * e2[2]];
      L.bar(B, p, [p[0] * 1.25, p[1] + 3, p[2] - Math.sin(t) * 3 * e2[2]], 0.25, [200, 200, 196], K.METAL); }
    // brazo que une el anillo al fuste
    L.q4(B, [-1, yc - 1, cz], [1, yc - 1, cz], [1, yc - 9.5 * e2[1], cz - 9.5 * e2[2]], [-1, yc - 9.5 * e2[1], cz - 9.5 * e2[2]], [226, 226, 222], K.METAL);
  } });

// =================================================================== PALAU NACIONAL (MNAC)
// Silueta: palacio ancho de piedra ocre sobre la ladera, mirando a la Pl. d'Espanya (NNO), con una gran cúpula central
// elíptica que domina, dos cúpulas menores y cuatro torres-campanario en las esquinas. Rasgos: cúpula central, torres,
// escalinatas y cascadas que bajan hacia la Font Màgica.
// Marco: rot 334 → +Z = la fachada principal (al NNO), X a lo largo de la fachada.
add({ id: 'palau_nacional', nombre: 'Palau Nacional (MNAC)', nivel: 'A', x: 10820.8, z: 11985, rot: 334, alto: 52, ancho: 168, largo: 147,
  noche: 'focos', edificios: [52387, 52388, 52389],
  build(B, h, L) {
    const OCRE = L.color('#d6c39c'), CLA = [226, 212, 182], DOM = L.color('#8c8478'), PI = L.aux.piedra(0.7, 1.4);
    const pl = plantaDe(h, 52389) || L.rect(160, 130);
    const c = caja2(pl), yb = Math.min(-3, minY(h, pl, 3));
    L.prisma(B, pl, yb, 12, OCRE, K.PIEDRA, { aux: PI, techo: [196, 182, 150] });
    const W = Math.min(150, c.w * 0.86), D = Math.min(100, c.l * 0.62), cx = c.cx, cz = c.cz, fz = cz + D / 2;
    // cuerpo principal con ventanales y cuerpo central adelantado con columnata
    L.caja(B, cx, cz, 11, W, D, 13, 0, OCRE, K.VENTANAS, { aux: L.aux.ventanas(6.5, 6, 0.32, 0.5), techo: [180, 168, 140] });
    L.caja(B, cx, cz, 23.5, W + 1.5, D + 1.5, 1.4, 0, CLA, K.PIEDRA);
    L.caja(B, cx, fz + 3, 11, 46, 8, 17, 0, OCRE, K.PIEDRA, { aux: PI });
    L.columnata(B, cx - 20, fz + 8.5, cx + 20, fz + 8.5, 12, 15, 8, 0.9, { col: CLA, entablamento: 2.2 });
    L.caja(B, cx, fz + 6, 26.5, 50, 12, 2.5, 0, CLA, K.PIEDRA);
    // gran cúpula central elíptica sobre tambor con linterna
    let v0 = B.nv;
    L.tambor(B, 0, 0, 24, 33, 17, { lados: 28, col: OCRE, k: K.VENTANAS, aux: L.aux.ventanas(9, 4.5, 0.4, 0.55) });
    L.cupula(B, 0, 0, 33, 17.6, 13, { lados: 28, col: DOM, k: K.METAL, aux: L.aux.panel(2, 0.15, 0), linterna: { r: 3, alto: 7, col: CLA, k: K.PIEDRA } });
    L.xf(B, v0, cx, cz - 4, 0, 1, 1.32);
    // dos cúpulas menores a los lados
    for (const s of [-1, 1]) { const x = cx + s * 36, z = cz + 6;
      L.tambor(B, x, z, 24, 29, 7.5, { lados: 16, col: OCRE, k: K.PIEDRA, aux: PI });
      L.cupula(B, x, z, 29, 7.8, 7, { lados: 16, col: DOM, k: K.METAL, linterna: { r: 1.3, alto: 3, col: CLA, k: K.PIEDRA } }); }
    // cuatro torres-campanario en las esquinas del cuerpo principal
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = cx + sx * (W / 2 - 5), z = cz + sz * (D / 2 - 5);
      L.caja(B, x, z, 24, 7, 7, 15, 0, OCRE, K.PIEDRA, { aux: PI });
      L.caja(B, x, z, 39, 6, 6, 5, 0, CLA, K.PIEDRA);
      for (const f of [[0, 1], [0, -1], [1, 0], [-1, 0]])
        hueco(B, x + f[0] * 3.05, z + f[1] * 3.05, f[1], -f[0], f[0], f[1], 39.6, 43.4, 2.2, 'medio', [50, 44, 38]);
      L.cupula(B, x, z, 44, 3.2, 4, { lados: 10, col: DOM, k: K.METAL, linterna: { r: 0.6, alto: 2.5, col: CLA, k: K.PIEDRA } }); }
    // escalinatas y cascadas que bajan hacia la Pl. d'Espanya
    for (let i = 0; i < 9; i++) { const z = c.z1 + 4 + i * 8, yt = hy(h, cx, z) + 0.6;
      L.caja(B, cx, z, yt - 4, 46, 8.4, 4, 0, [210, 198, 170], K.PIEDRA, { aux: L.aux.piedra(0.35, 1.2) });
      L.poly(B, [[cx - 3.5, yt + 0.05, z - 4], [cx + 3.5, yt + 0.05, z - 4], [cx + 3.5, yt + 0.05, z + 4], [cx - 3.5, yt + 0.05, z + 4]], [80, 130, 160], K.AGUA); }
  } });

// =================================================================== FONT MÀGICA
add({ id: 'font_magica', nombre: 'Font Màgica', nivel: 'B', x: 10659.9, z: 12308, rot: 65, alto: 18, ancho: 50, largo: 65,
  noche: 'focos', edificios: [],
  build(B, h, L) {
    const N = 40, PIE = L.color('#c9b48a'), E = (rx, rz) => SE(rx, rz, 2, N), y0 = Math.min(-2, hy(h, 0, 0) - 2);
    banda(B, E(25, 32.5), y0, 0.9, PIE, K.PIEDRA, L.aux.piedra(0.45, 1));
    corona(B, E(23.2, 30.5), 0.9, E(25, 32.5), 0.9, [214, 200, 168], K.PIEDRA);
    banda(B, E(23.2, 30.5), 0.3, 0.9, PIE, K.PIEDRA);
    L.poly(B, E(23.2, 30.5).map(p => [p[0], 0.3, p[1]]), [96, 150, 190], K.AGUA);
    // segundo vaso, escalonado, y la isla central
    banda(B, E(14, 19), 0.3, 1.0, PIE, K.PIEDRA);
    L.poly(B, E(14, 19).map(p => [p[0], 1.0, p[1]]), [96, 150, 190], K.AGUA);
    L.tambor(B, 0, 0, 0.5, 1.5, 4, { lados: 14, col: PIE, k: K.PIEDRA });
    // chorros (de noche se encienden de colores)
    const COL = [[236, 150, 220], [140, 200, 250], [250, 210, 140], [170, 240, 200]];
    L.aguja(B, 0, 0, 1.4, 18, 1.1, { lados: 8, pasos: 4, pot: 1, exp: 1.6, col: [225, 235, 245], k: K.EMISIVO, aux: L.aux.emisivo(1.6, true) });
    for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * Math.PI, x = Math.sin(a) * 9, z = Math.cos(a) * 12.5;
      L.aguja(B, x, z, 0.9, 6 + (i % 2) * 3, 0.45, { lados: 6, pasos: 2, pot: 1, exp: 1.4, col: COL[i % 4], k: K.EMISIVO, aux: L.aux.emisivo(1.4, true) }); }
  } });

// =================================================================== LES QUATRE COLUMNES
add({ id: 'quatre_columnes', nombre: 'Les Quatre Columnes', nivel: 'B', x: 10690.2, z: 12251, rot: 65, alto: 21, ancho: 6, largo: 40,
  noche: 'focos', edificios: [],
  build(B, h, L) {
    const col = L.color('#d8ccb4');
    for (const z of [-15, -5, 5, 15]) { const yb = Math.min(-1.5, hy(h, 0, z) - 1.5);
      L.caja(B, 0, z, yb, 2.8, 2.8, 1.6 - yb, 0, col, K.PIEDRA);
      L.tambor(B, 0, z, 1.6, 18.6, 0.85, { r1: 0.74, lados: 12, col, k: K.PIEDRA, sinTapa: true });
      L.caja(B, 0, z, 18.6, 2.7, 1.9, 0.9, 0, col, K.PIEDRA);
      L.caja(B, 0, z, 19.5, 2.2, 2.2, 0.6, 0, col, K.PIEDRA); }
  } });

// =================================================================== TORRES VENECIANES
add({ id: 'torres_venecianes', nombre: 'Torres Venecianes', nivel: 'B', x: 10502.1, z: 12628.6, rot: 63, alto: 48, ancho: 9, largo: 50,
  noche: 'focos', edificios: [58995, 59058, 59059, 59060, 59061, 59062, 59063, 59064],
  build(B, h, L) {
    const LAD = L.color('#b5543a'), PIE = L.color('#d8ccb4'), OSC = [44, 36, 32];
    for (const s of [-1, 1]) { const z = s * 21, yb = Math.min(-2, hy(h, 0, z) - 2);
      L.caja(B, 0, z, yb, 7, 7, 34 - yb, 0, LAD, K.LADRILLO, { aux: L.aux.ladrillo(0.3, 0.6) });
      L.caja(B, 0, z, yb, 7.8, 7.8, 3 - yb, 0, PIE, K.PIEDRA);
      L.caja(B, 0, z, 33.5, 8, 8, 0.6, 0, PIE, K.PIEDRA);
      L.caja(B, 0, z, 34.1, 7.2, 7.2, 6, 0, LAD, K.LADRILLO, { aux: L.aux.ladrillo(0.3, 0.6) });
      for (const f of [[0, 1], [0, -1], [1, 0], [-1, 0]]) for (const u of [-1.6, 1.6])
        hueco(B, f[0] * 3.6 + f[1] * u, z + f[1] * 3.6 - f[0] * u, f[1], -f[0], f[0], f[1], 35, 39.2, 1.9, 'medio', OSC);
      L.caja(B, 0, z, 40.1, 8, 8, 0.6, 0, PIE, K.PIEDRA);
      L.piramide(B, 0, z, 40.7, 6.6, 6.6, 7.6, { col: [150, 70, 52], k: K.TEJA });
      for (const a of [-1, 1]) for (const b of [-1, 1]) L.piramide(B, a * 3.4, z + b * 3.4, 40.7, 1, 1, 2.2, { col: PIE, k: K.PIEDRA }); }
  } });

// =================================================================== LAS ARENAS
// Silueta: tambor circular de ladrillo rojo de ~20 m y ~92 m de diámetro con una gran cubierta-mirador plana que vuela
// sobre él y una cúpula baja encima. Rasgos: anillo neomudéjar de ladrillo con dos órdenes de arcos de herradura y bandas
// de cerámica clara; la cubierta-mirador; la torre de ascensores exterior.
add({ id: 'arenas', nombre: 'Las Arenas', nivel: 'A', x: 10463.3, z: 12880.9, rot: 49, alto: 36, ancho: 100, largo: 100,
  noche: 'focos', edificios: [75880, 75894, 75895, 75896, 75897, 75898, 75940, 75941, 75942, 75943, 75951, 75952],
  build(B, h, L) {
    const R = 46, LAD = L.color('#b5543a'), CER = L.color('#e6dcc4'), yb = Math.min(-3, minY(h, L.poligono(R, 12), 2));
    L.tambor(B, 0, 0, yb, 20, R, { lados: 56, col: LAD, k: K.LADRILLO, aux: L.aux.ladrillo(0.3, 0.6), sinTapa: true });
    L.tambor(B, 0, 0, 10.3, 11.3, R + 0.25, { lados: 56, col: CER, k: K.LISO, sinTapa: true });
    L.tambor(B, 0, 0, 18.6, 19.4, R + 0.25, { lados: 56, col: [70, 120, 150], k: K.TRENCADIS, sinTapa: true });
    L.tambor(B, 0, 0, 19.4, 21, R + 0.6, { lados: 56, col: CER, k: K.PIEDRA, sinTapa: true });
    L.anillo(B, 0, 0, R - 3, R + 0.6, 21, { lados: 56, col: [200, 190, 172], k: K.PIEDRA });
    const ring = L.poligono(R, 40);
    huecosAnillo(B, ring, 1.5, 9.2, 4.2, 'herradura', [46, 32, 28]);
    huecosAnillo(B, L.poligono(R, 40, 4.5), 12.4, 17.6, 3, 'herradura', [46, 32, 28]);
    // cubierta-mirador: vidrio retranqueado, columnas, losa que vuela y cúpula baja
    L.tambor(B, 0, 0, 21, 27, R - 3, { lados: 40, col: [70, 84, 96], k: K.CORTINA, aux: L.aux.cortina(3, 1.8, 0.2), sinTapa: true });
    for (let i = 0; i < 20; i++) { const a = i / 20 * 2 * Math.PI; L.tambor(B, Math.sin(a) * (R + 2), Math.cos(a) * (R + 2), 21, 27, 0.45, { lados: 6, col: [215, 215, 210], k: K.LISO }); }
    L.tambor(B, 0, 0, 27, 28.2, R + 4, { lados: 56, col: [214, 214, 210], k: K.LISO, sinTapa: true });
    L.anillo(B, 0, 0, 27, R + 4, 28.2, { lados: 56, col: [196, 196, 192], k: K.LISO });
    L.cupula(B, 0, 0, 28.2, 27, 7, { lados: 32, col: L.color('#8c949c'), k: K.METAL, aux: L.aux.panel(2, 0.2, 0) });
    // torre de ascensores exterior (sur) con pasarela
    L.caja(B, 0, -(R + 9), yb, 7, 7, 34 - yb, 0, [210, 214, 216], K.CORTINA, { aux: L.aux.cortina(3.5, 1.4, 0.1) });
    L.caja(B, 0, -(R + 4), 26, 3, 6, 2.2, 0, [200, 200, 196], K.LISO);
  } });

// =================================================================== CASTELL DE MONTJUÏC
// Silueta: fortaleza baja y extensa en la cima: planta en estrella de baluartes (de los datos) con muros en talud,
// cuerpo central cuadrado con patio y una torre de vigía. Rasgos: los baluartes, el foso, la torre de vigía.
add({ id: 'castell_montjuic', nombre: 'Castell de Montjuïc', nivel: 'A', x: 11842.8, z: 11426.8, rot: 61, alto: 26, ancho: 166, largo: 222,
  noche: 'focos', edificios: [52440, 52444, 52449, 52450, 52451],
  build(B, h, L) {
    const PIE = L.color('#c4a77d'), OSC = L.color('#8c7a5a'), VER = L.color('#6a7a4a');
    const fb = () => { const o = []; for (const p of [[-70, -95], [-30, -80], [0, -110], [30, -80], [70, -95], [60, -40], [80, 0], [60, 40], [70, 95], [30, 80], [0, 110], [-30, 80], [-70, 95], [-60, 40], [-80, 0], [-60, -40]]) o.push(p); return o; };
    const ext = plantaDe(h, 52440) || fb(), cen = plantaDe(h, 52444) || L.rect(60, 60);
    const base = (x, z) => Math.min(-1, hy(h, x, z)) - 2.5, top = 10;
    // foso (franja oscura alrededor), muro en talud y adarve
    const ce = caja2(ext), F = ext.map(q => { const dx = q[0] - ce.cx, dz = q[1] - ce.cz, l = Math.hypot(dx, dz) || 1; return [q[0] + dx / l * 9, q[1] + dz / l * 9]; });
    corona(B, ext, (x, z) => hy(h, x, z) + 0.15, F, (x, z) => hy(h, x, z) + 0.15, VER, K.LISO);
    const T = ext.map(q => { const dx = q[0] - ce.cx, dz = q[1] - ce.cz, l = Math.hypot(dx, dz) || 1; return [q[0] - dx / l * 1.6, q[1] - dz / l * 1.6]; });
    corona(B, ext, base, T, top, PIE, K.PIEDRA, L.aux.piedra(0.6, 1.3));
    L.poly(B, T.map(p => [p[0], top, p[1]]), [150, 144, 112], K.LISO);
    banda(B, T, top, top + 1.3, [206, 186, 150], K.PIEDRA);
    // cuerpo central con patio, y torre de vigía en la esquina que mira al mar
    const cc = caja2(cen), yc = minY(h, cen, 2);
    L.prisma(B, cen, yc, 17, PIE, K.VENTANAS, { aux: L.aux.ventanas(4.5, 5, 0.22, 0.4), techo: [176, 160, 128] });
    banda(B, cen, 17, 18.3, [206, 186, 150], K.PIEDRA);
    L.poly(B, escalar(cen, 0.55).map(p => [p[0], 17.06, p[1]]), OSC, K.PIEDRA);
    let tv = cen[0]; for (const q of cen) if (q[0] > tv[0]) tv = q;
    const tx = tv[0] - Math.sign(tv[0] - cc.cx) * 4, tz = tv[1] - Math.sign(tv[1] - cc.cz) * 4;
    L.caja(B, tx, tz, 16, 6, 6, 10, 0, PIE, K.PIEDRA, { aux: L.aux.piedra(0.6, 1.2) });
    almenas(B, L.mover(L.rect(6.4, 6.4), tx, tz), 26, 1.6, 0.8, 0.5, 1, [206, 186, 150], K.PIEDRA);
    L.mastil(B, tx, tz, 26, 8, 0.12, { col: [220, 220, 220] });
  } });

// Piscines Bernat Picornell y Piscina Municipal de Montjuïc: retoques (cajas claras, sin fachada de viviendas)
add({ id: 'picornell', nombre: 'Piscines Bernat Picornell', nivel: 'C', x: 10537.8, z: 11702.3, rot: 92, alto: 13, noche: 'nada',
  edificios: [52385], ocultar: false, fachada: false, retoque: { color: '#d8d8d0', estilo: 1, alto: 13 } });
add({ id: 'piscina_montjuic', nombre: 'Piscina Municipal de Montjuïc', nivel: 'C', x: 11775, z: 12079.3, rot: 0, alto: 12, noche: 'nada',
  edificios: [60293], ocultar: false, fachada: false, retoque: { color: '#d8d8d0', estilo: 1, alto: 10 } });

// =================================================================== PAVELLÓ MIES VAN DER ROHE
add({ id: 'pavello_mies', nombre: 'Pavelló Mies van der Rohe', nivel: 'B', x: 10512.1, z: 12241.7, rot: 65, alto: 5, ancho: 25, largo: 56,
  noche: 'focos', edificios: [58997],
  build(B, h, L) {
    const TRV = L.color('#d8ccb4'), BLA = L.color('#f2f2ee'), VID = L.color('#2a3a3a'), yb = Math.min(-2, hy(h, 0, 0) - 2), pt = 1.2;
    L.caja(B, 0, 0, yb, 25, 56, pt - yb, 0, TRV, K.PIEDRA, { aux: L.aux.piedra(0.6, 1.1) });
    L.poly(B, [[-11, pt + 0.04, -26.5], [5, pt + 0.04, -26.5], [5, pt + 0.04, -9], [-11, pt + 0.04, -9]], [70, 104, 112], K.AGUA);
    L.poly(B, [[3, pt + 0.04, 18], [11, pt + 0.04, 18], [11, pt + 0.04, 26.5], [3, pt + 0.04, 26.5]], [70, 104, 112], K.AGUA);
    L.caja(B, -11.6, 5, pt, 0.35, 34, 3.1, 0, TRV, K.PIEDRA);
    L.caja(B, -1, 4, pt, 6, 0.2, 3.1, 0, [196, 152, 84], K.LISO);
    L.caja(B, 4, 0, pt, 0.12, 12, 3.1, 0, VID, K.CORTINA, { aux: L.aux.cortina(3.1, 1.6, 0.1) });
    L.caja(B, -4, 10, pt, 10, 0.12, 3.1, 0, VID, K.CORTINA, { aux: L.aux.cortina(3.1, 1.6, 0.1) });
    L.caja(B, 7, 14, pt, 9, 0.3, 3.1, 0, [70, 92, 76], K.LISO);
    L.caja(B, 0, 3, pt + 3.1, 15, 25, 0.38, 0, BLA, K.LISO);
    L.caja(B, -6.5, 21.5, pt, 8, 7, 3.1, 0, TRV, K.PIEDRA);
    L.caja(B, -6.5, 21.5, pt + 3.1, 9, 8, 0.38, 0, BLA, K.LISO);
    for (const x of [-4, 3]) for (const z of [-4, 3.5, 11]) L.tambor(B, x, z, pt, pt + 3.1, 0.14, { lados: 4, col: [190, 196, 200], k: K.METAL });
    L.caja(B, 7, 22, pt, 0.5, 0.5, 1.9, 0, [60, 54, 46], K.METAL);
  } });

// =================================================================== CAIXAFORUM (CASARAMONA)
add({ id: 'caixaforum', nombre: 'CaixaForum (Casaramona)', nivel: 'B', x: 10462.3, z: 12345.4, rot: 135, alto: 30, ancho: 83, largo: 91,
  noche: 'focos', edificios: [59057],
  build(B, h, L) {
    const LAD = L.color('#b5543a'), PIE = L.color('#e0d2b0');
    const pl = plantaDe(h, 59057) || L.rect(80, 88), c = caja2(pl), yb = minY(h, pl, 2);
    L.prisma(B, pl, yb, 11, LAD, K.LADRILLO, { aux: L.aux.ladrillo(0.3, 0.6), techo: [150, 120, 100] });
    banda(B, pl, 10.2, 11, PIE, K.PIEDRA);
    almenas(B, pl, 11, 4.2, 1.6, 0.6, 1.3, PIE, K.PIEDRA);
    // dos torres de aguja en las esquinas de la fachada (+Z)
    const esq = s => { let best = null, bv = -1e9; for (const q of pl) { const v = q[1] + s * q[0] * 0.8; if (v > bv) { bv = v; best = q; } } return best; };
    for (const s of [-1, 1]) { const q = esq(s); const x = q[0] - Math.sign(q[0] - c.cx) * 5, z = q[1] - Math.sign(q[1] - c.cz) * 5, al = s > 0 ? 24 : 20;
      L.caja(B, x, z, yb, 6.5, 6.5, al - yb, 0, LAD, K.LADRILLO, { aux: L.aux.ladrillo(0.3, 0.6) });
      L.caja(B, x, z, al - 2, 7.2, 7.2, 1.6, 0, PIE, K.PIEDRA);
      L.aguja(B, x, z, al - 0.4, 10, 3.2, { lados: 8, pasos: 4, pot: 1, exp: 0.9, col: [196, 186, 166], k: K.PIEDRA, remate: { alto: 1.6, r: 0.25, col: [120, 130, 120] } });
      L.tambor(B, x, z, al - 0.4, al + 1.2, 3.25, { lados: 8, col: [76, 120, 140], k: K.TRENCADIS, sinTapa: true }); }
  } });

// =================================================================== POBLE ESPANYOL (Torres d'Àvila)
// La puerta del recinto (lado E): dos torres almenadas de piedra con el lienzo de muralla y la puerta entre ellas.
add({ id: 'poble_espanyol', nombre: 'Poble Espanyol', nivel: 'B', x: 10428.9, z: 12039.3, rot: 70, alto: 24, ancho: 40, largo: 14,
  noche: 'focos', edificios: [],
  build(B, h, L) {
    const PIE = L.color('#b8a688'), OSC = L.color('#8c7a5a'), yb = Math.min(-2, hy(h, 0, 0) - 2);
    L.arco(B, 0, 0, yb, 12, 6, 16 - yb, 5, 9 - yb, { col: PIE, k: K.PIEDRA, aux: L.aux.piedra(0.6, 1.2) });
    almenas(B, L.rect(12, 6), 16, 1.8, 0.9, 0.6, 1.2, PIE, K.PIEDRA);
    for (const s of [-1, 1]) {
      L.tambor(B, s * 9, 0, yb, 21, 4.8, { lados: 14, col: PIE, k: K.PIEDRA, aux: L.aux.piedra(0.6, 1.2) });
      L.tambor(B, s * 9, 0, 20.4, 21.2, 5.2, { lados: 14, col: OSC, k: K.PIEDRA });
      almenas(B, L.mover(L.poligono(5, 10), s * 9, 0), 21.2, 1.4, 1, 0.7, 1.4, PIE, K.PIEDRA);
      L.caja(B, s * 20, -1, yb, 13, 3, 13 - yb, 0, PIE, K.PIEDRA, { aux: L.aux.piedra(0.6, 1.2) });
      almenas(B, L.mover(L.rect(13, 3), s * 20, -1), 13, 1.8, 0.9, 0.6, 1.1, PIE, K.PIEDRA); }
  } });

// =================================================================== FUNDACIÓ JOAN MIRÓ
add({ id: 'fundacio_miro', nombre: 'Fundació Joan Miró', nivel: 'B', x: 11339.3, z: 12016.5, rot: 49, alto: 14, ancho: 66, largo: 87,
  noche: 'nada', edificios: [60046],
  build(B, h, L) {
    const BLA = L.color('#f2f2ee'), pl = plantaDe(h, 60046) || L.rect(60, 80), c = caja2(pl), yb = minY(h, pl, 2);
    L.prisma(B, pl, yb, 6.5, BLA, K.LISO, { aux: L.aux.liso(2), techo: [226, 226, 222] });
    // lucernarios en cuarto de cilindro y torre octogonal
    const pf = [[0, 6.4], [0, 11]]; for (let i = 1; i <= 6; i++) { const a = Math.PI / 2 * i / 6; pf.push([Math.sin(a) * 4.6, 6.4 + Math.cos(a) * 4.6]); }
    for (const [dx, dz] of [[-12, -10], [4, -10], [-6, 12], [10, 14]])
      L.extruir(B, pf, -5, 5, BLA, K.LISO, { x: c.cx + dx, z: c.cz + dz, ang: 90 });
    L.tambor(B, c.cx + c.w * 0.3, c.cz - c.l * 0.3, yb, 13.5, 5, { lados: 8, col: BLA, k: K.LISO });
  } });

// =================================================================== TEATRE GREC (de nivel C a B: el volumen era una caja de 12 m)
add({ id: 'teatre_grec', nombre: 'Teatre Grec', nivel: 'B', x: 11321.5, z: 12118.6, rot: 178, alto: 12, ancho: 50, largo: 30,
  noche: 'nada', edificios: [60045, 60294],
  build(B, h, L) {
    const PIE = L.color('#c9b48a'), yb = Math.min(-1, hy(h, 0, 0) - 1), yo = Math.max(9, hy(h, 0, 25) + 1);
    L.grada(B, 0, 0, 9, 9, 0.4, 25, 25, yo, { lados: 18, a0: -90, a1: 90, col: PIE, k: K.GRADA, aux: L.aux.grada(0.6, 0), muro: [150, 140, 110] });
    L.caja(B, 0, -3, yb, 26, 5, 1.2 - yb, 0, [190, 172, 136], K.PIEDRA);
    L.caja(B, 0, -6.2, yb, 26, 1.4, 6 - yb, 0, PIE, K.PIEDRA, { aux: L.aux.piedra(0.6, 1.2) });
  } });

// =================================================================== VELÒDROM D'HORTA
add({ id: 'velodrom_horta', nombre: "Velòdrom d'Horta", nivel: 'B', x: 10492.7, z: 19741.8, rot: 45, alto: 12, ancho: 128, largo: 128,
  noche: 'nada', edificios: [207295, 207296],
  build(B, h, L) {
    const N = 64, HOR = L.color('#c8c4bc'), yb = Math.min(-2, minY(h, SE(62, 62, 2.2, 12), 2));
    const R = (rx, rz) => SE(rx, rz, 2.4, N);
    L.poly(B, R(28, 44).map(p => [p[0], 0.3, p[1]]), [104, 138, 88], K.CESPED, L.aux.cesped(4));
    corona(B, R(28, 44), 0.3, R(36, 52), 3.2, [176, 128, 96], K.LISO);
    banda(B, R(36, 52), 0.3, 3.2, [120, 116, 110], K.LISO);
    corona(B, R(38, 54), 3.4, R(60, 62), 11, HOR, K.GRADA, L.aux.grada(0.8, 0));
    banda(B, R(38, 54), 0.3, 3.4, HOR, K.LISO);
    banda(B, R(60, 62), yb, 11, [186, 182, 174], K.LISO);
    banda(B, R(60.3, 62.3), 11, 12, [206, 202, 194], K.LISO);
  } });

})();
