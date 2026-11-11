/* GTA Barcelona — HITOS, lote c (torres y frente marítimo). Cada hito se declara con BCN_LM.add({...}) al cargar el
   script (ficha y constructor: DESARROLLO.md §10). Este fichero es SOLO del agente del lote c.
   Ejemplos de referencia del núcleo: Torre Glòries y Hotel W. */
(function () {
'use strict';
const { add, lib: L, K } = window.BCN_LM;

// Torre Glòries (antes Agbar). Silueta: bala de 145 m, planta elíptica de 40 × 37 m, recta hasta ~105 m y luego cúpula.
// Rasgos: la silueta; la piel de paneles de colores en degradado (rojos y naranjas abajo, azules arriba, cúpula plateada)
// con huecos sueltos; de noche, LED con los mismos colores.
add({ id: 'torre_glories', nombre: 'Torre Glòries', nivel: 'A', x: 13855, z: 15870, rot: 0, alto: 145, ancho: 40, largo: 37,
  noche: 'led', edificios: [141753, 141754, 141755, 141756, 141757, 141758, 141759],
  build(B, h, L) {
    L.aguja(B, 0, 0, -1.5, 146.5, 20, { lados: 56, pasos: 10, recto: 0.72, pot: 2, exp: 0.42, sz: 37 / 40, k: K.METAL,
      aux: L.aux.panel(2.2, 0.7, 0.2), cortes: 9,
      cols: [[0, '#93372f'], [0.12, '#a84a36'], [0.26, '#b4643e'], [0.4, '#b07a52'], [0.5, '#86687a'], [0.6, '#5d6f98'], [0.7, '#4b6694'],
             [0.78, '#7088ac'], [0.9, '#a6b4c8'], [1, '#c9d2de']] });
    // planta baja acristalada, algo retranqueada
    L.tambor(B, 0, 0, -1.5, 4.2, 19.3, { lados: 40, col: [40, 46, 54], k: K.CORTINA, aux: L.aux.cortina(4.2, 2.2, 0.1), sinTapa: true });
  } });

// Hotel W (la Vela). Silueta: vela de vidrio de 87 m sobre la punta de la nueva bocana: planta en media luna alargada de
// este a oeste (unos 58 × 25 m), canto oeste vertical y el borde de arriba que baja hacia el este (hasta ~65 m).
// Rasgos: la vela; vidrio espejo azul grisáceo con las líneas de los forjados; de noche, habitaciones encendidas.
add({ id: 'hotel_w', nombre: 'Hotel W', nivel: 'A', x: 13859, z: 11984, rot: 0, alto: 87, ancho: 58, largo: 26,
  noche: 'ventanas', edificios: [52511, 52520, 52521, 52522, 52523, 52524, 52525, 52526, 52527, 52528, 52529, 52530, 52531, 52532,
    52533, 52534, 52535, 52536, 52537, 52538, 52539, 52540],
  build(B, h, L) {
    // canto sur casi recto y cara norte curva (de la huella real), de oeste a este; z en función de x
    const sur = [[-17, -6], [-13, -10], [-5, -14], [3, -16.5], [12, -18], [21, -19], [30, -19], [37, -18], [41.5, -14]];
    const norte = [[-16.5, 1.5], [-13, 4.5], [-8, 6], [-2, 7], [6, 7], [15, 6], [23, 4.3], [30, 2], [37, -1.5], [41.5, -7]];
    const zAt = (pl, x) => { if (x <= pl[0][0]) return pl[0][1]; for (let i = 1; i < pl.length; i++) if (x <= pl[i][0]) { const t = (x - pl[i - 1][0]) / (pl[i][0] - pl[i - 1][0]); return pl[i - 1][1] + (pl[i][1] - pl[i - 1][1]) * t; } return pl[pl.length - 1][1]; };
    // la vela: el canto de proa (oeste) es vertical; la baluma (este) baja de 87 a 64 m. Cada nivel es la misma planta
    // recortada por el este a la altura que toca, con la cara norte algo hinchada a media altura
    const HT = 87.4, xEnd = y => Math.min(41.5, 9 + (HT - y) / 0.76), N = 12, niv = [];
    for (const y of [-1, 20, 40, 62.7, 68, 73, 78, 83, HT]) {
      const x0 = -17, x1 = xEnd(y), bul = 1.6 * Math.sin(Math.PI * Math.min(1, Math.max(0, y / HT))), pl = [];
      for (let i = 0; i <= N; i++) { const x = x0 + (x1 - x0) * i / N; pl.push([x, zAt(sur, x)]); }
      for (let i = N; i >= 0; i--) { const x = x0 + (x1 - x0) * i / N; pl.push([x, zAt(norte, x) + bul]); }
      niv.push([y, pl]);
    }
    L.loft(B, niv, [140, 160, 182], K.CORTINA, { aux: L.aux.cortina(3.15, 1.7, 0.3), techo: [70, 74, 80] });
    // remate de la proa (un canto algo más alto) y la cubierta técnica
    L.prisma(B, L.mover(L.rect(3.5, 8), -14.5, -1.5, -55), 86.5, 90, [150, 160, 170], K.METAL, { aux: L.aux.panel(1.2) });
    L.prisma(B, L.mover(L.rect(12, 8), -2, -4, -8), 86.8, 88.8, [120, 124, 128], K.LISO);
  } });

// ================================================================== utilidades locales del lote c
// Plantas reales: las de los datos (BREC), copiadas en metros relativos al centro del hito con rot 0 (x al este, z al
// norte), para que el constructor no dependa de h.plantas (vacías en tris.js) y la forma sea siempre la misma.
const areaPl = pl => { let a = 0; for (let i = 0; i < pl.length; i++) { const p = pl[i], q = pl[(i + 1) % pl.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
const centro = pl => { let x = 0, z = 0; for (const p of pl) { x += p[0]; z += p[1]; } return [x / pl.length, z / pl.length]; };
// desplaza una planta d m hacia fuera (inglete; vale para plantas poco cóncavas)
function inflar(pl, d) {
  const n = pl.length, s = areaPl(pl) > 0 ? 1 : -1, out = [];
  const nrm = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [s * dz / l, -s * dx / l]; };
  for (let i = 0; i < n; i++) {
    const a = pl[(i - 1 + n) % n], p = pl[i], b = pl[(i + 1) % n], n1 = nrm(a, p), n2 = nrm(p, b);
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz);
    if (ml < 1e-6) { mx = n1[0]; mz = n1[1]; } else { mx /= ml; mz /= ml; }
    const c = Math.max(0.35, mx * n1[0] + mz * n1[1]);
    out.push([p[0] + mx * d / c, p[1] + mz * d / c]);
  }
  return out;
}
// planta escalada respecto a su centro
const escalar = (pl, s) => { const c = centro(pl); return pl.map(p => [c[0] + (p[0] - c[0]) * s, c[1] + (p[1] - c[1]) * s]); };
// forjados o lamas: losas que sobresalen `sale` m, de `grueso` m, cada `paso` m entre y0 e y1
function bandas(L, B, pl, y0, y1, paso, grueso, sale, col) {
  const pi = inflar(pl, sale);
  for (let y = y0 + paso; y < y1 - grueso - 0.5; y += paso) L.prisma(B, pi, y, y + grueso, col, L.K.LISO);
}
// celosía de rombos delante de cada cara de una planta (a `sale` m), de y0 a y1, barras a 45° cada `paso` m
function rombos(L, B, pl, y0, y1, paso, r, sale, col) {
  const n = pl.length, s = areaPl(pl) > 0 ? 1 : -1, H = y1 - y0;
  for (let i = 0; i < n; i++) {
    const a = pl[i], b = pl[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], w = Math.hypot(dx, dz); if (w < 4) continue;
    const tx = dx / w, tz = dz / w, nx = s * tz, nz = -s * tx, P = (u, y) => [a[0] + tx * u + nx * sale, y0 + y, a[1] + tz * u + nz * sale];
    const f0 = ((i * 0.37) % 1) * paso;
    for (let c = -H + f0; c < w; c += paso) {            // u − y = c  y  u + y = c'
      const u0 = Math.max(0, c), u1 = Math.min(w, c + H); if (u1 - u0 > 0.5) L.bar(B, P(u0, u0 - c), P(u1, u1 - c), r, L.color(col), L.K.LISO);
    }
    for (let c = f0; c < w + H; c += paso) {
      const u0 = Math.max(0, c - H), u1 = Math.min(w, c); if (u1 - u0 > 0.5) L.bar(B, P(u0, c - u0), P(u1, c - u1), r, L.color(col), L.K.LISO);
    }
  }
}
// cuerpo de revolución elíptico a lo largo de +Z: secs = [[z, yc, semiancho, semialto], …] (normales suaves)
function cuerpo(L, B, secs, n, col, k, aux) {
  const m = secs.length; if (m < 2) return; col = L.color(col); B.grow(m * (n + 1), (m - 1) * n * 6); const v0 = B.nv;
  for (const [z, yc, w, hh] of secs) for (let i = 0; i <= n; i++) { const a = i / n * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a);
    L.pv(B, w * c, yc + hh * s, z, c / Math.max(w, 0.5), s / Math.max(hh, 0.5), 0, 1, col, k, aux); }
  for (let j = 0; j + 1 < m; j++) for (let i = 0; i < n; i++) { const a = v0 + j * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1; L.tri(B, a, c, d); L.tri(B, a, d, b); }
}

// ================================================================== Port Olímpic
// Hotel Arts. Silueta: prisma cuadrado de 154 m (35 m de lado) junto al Port Olímpic, gemelo en altura de la Torre Mapfre.
// Rasgos: el exoesqueleto blanco separado de la fachada (pilares, vigas cada ~4 plantas y cruces de San Andrés en cada
// recuadro) y, detrás, el vidrio oscuro. La planta de los datos es un rombo (cuadrado girado 45°): rot 45.
add({ id: 'hotel_arts', nombre: 'Hotel Arts', nivel: 'A', x: 14397.4, z: 14018.7, rot: 45, alto: 154, ancho: 36, largo: 36,
  noche: 'ventanas', edificios: [102614],
  build(B, h, L) {
    const S = 17.6, C = 15.6, H = 154, NV = 12, NB = 3, BL = [240, 240, 236];
    L.caja(B, 0, 0, -1.5, C * 2, C * 2, 149.5, 0, [52, 64, 78], K.CORTINA, { aux: L.aux.cortina(3.5, 1.6, 0.25), techo: [96, 100, 104] });
    L.caja(B, 0, 0, 148, 18, 18, 4, 0, [180, 182, 184], K.LISO);                       // cubierta técnica
    const esq = [[-S, -S], [S, -S], [S, S], [-S, S]], y = j => -1 + (H + 1) * j / NV;
    for (let f = 0; f < 4; f++) {
      const a = esq[f], b = esq[(f + 1) % 4], P = (t, yy) => [a[0] + (b[0] - a[0]) * t, yy, a[1] + (b[1] - a[1]) * t];
      for (let i = 0; i < NB; i++) L.bar(B, P(i / NB, -1.5), P(i / NB, H), i ? 0.55 : 0.8, BL, K.LISO);          // pilares
      for (let j = 1; j <= NV; j++) L.bar(B, P(0, y(j)), P(1, y(j)), 0.55, BL, K.LISO);                          // vigas
      for (let j = 0; j < NV; j++) for (let i = 0; i < NB; i++) {                                                // cruces
        L.bar(B, P(i / NB, y(j)), P((i + 1) / NB, y(j + 1)), 0.4, BL, K.LISO);
        L.bar(B, P((i + 1) / NB, y(j)), P(i / NB, y(j + 1)), 0.4, BL, K.LISO);
      }
    }
  } });

// Torre Mapfre. Silueta: el mismo prisma cuadrado de 154 m que el Hotel Arts, al otro lado de la dársena.
// Rasgos: vidrio verde azulado con una lama blanca corrida en cada planta (rayado horizontal) y el remate técnico.
add({ id: 'torre_mapfre', nombre: 'Torre Mapfre', nivel: 'A', x: 14492.8, z: 14116.5, rot: 45, alto: 154, ancho: 33, largo: 33,
  noche: 'ventanas', edificios: [102818],
  build(B, h, L) {
    const pl = L.rect(32.6, 32.6);
    L.prisma(B, pl, -1.5, 147, [92, 140, 152], K.CORTINA, { aux: L.aux.cortina(3.8, 1.5, 0.2), techo: [120, 124, 126] });
    bandas(L, B, pl, -1.5, 147, 3.8, 0.75, 0.9, [222, 226, 222]);
    L.prisma(B, L.rect(26, 26), 147, 152, [196, 200, 198], K.METAL, { aux: L.aux.panel(1.6, 0.15) });   // remate
    L.prisma(B, inflar(pl, 0.9), 146.2, 147.6, [230, 232, 230], K.LISO);
    L.mastil(B, 0, 0, 152, 6, 0.4, { col: [200, 200, 204] });
  } });

// Peix d'Or (Frank Gehry). Silueta: pez dorado de 56 m tendido sobre una pérgola al pie del Hotel Arts, cabeza baja y cola
// que se levanta. Rasgos: la silueta curva del pez y el dorado de las lamas; de noche, bañado en luz cálida.
add({ id: 'peix', nombre: "Peix d'Or", nivel: 'A', x: 14419.5, z: 13955.3, rot: 45, alto: 35, ancho: 20, largo: 56,
  noche: 'focos', edificios: [],
  build(B, h, L) {
    const OR = [204, 160, 82], aux = L.aux.panel(1.1, 0.35, 0);
    // cuerpo: z de la cabeza (−28) a la cola; centro, semiancho y semialto de cada sección
    cuerpo(L, B, [[-28.5, 12, 0.2, 0.2], [-26, 12.6, 2.4, 2.8], [-21, 14.4, 4.6, 5.8], [-14, 16.8, 6, 7.8], [-6, 19.2, 6.2, 8.4],
      [2, 21.8, 5.4, 7.6], [9, 24.6, 4.2, 6], [15, 27.4, 2.8, 4], [19, 29.4, 1.8, 2.6], [21.5, 30.6, 1.3, 2], [22.5, 31, 0.2, 0.2]],
      16, OR, K.METAL, aux);
    // cola (abanico vertical en dos lóbulos, levantada) y aleta dorsal
    L.poly(B, [[0, 29, 20.5], [0, 24.5, 26.5], [0, 27, 29], [0, 31.5, 26.6], [0, 37, 29.5], [0, 35.8, 25], [0, 33.2, 20.5]], OR, K.METAL, aux);
    L.poly(B, [[0, 28.5, -6], [0, 32, 1], [0, 31, 6], [0, 26.5, 7]], OR, K.METAL, aux);
    // pérgola sobre el zócalo y apoyos
    L.caja(B, 0, -2, 5.6, 22, 52, 0.7, 0, [214, 206, 188], K.LISO);
    for (const [x, z] of [[-8, -20], [8, -20], [-8, -2], [8, -2], [-8, 16], [8, 16]]) L.tambor(B, x, z, -1, 5.6, 0.45, { lados: 6, col: [214, 206, 188] });
    for (const [x, z, yt] of [[-3, -14, 9.6], [3, -14, 9.6], [-3, 0, 12.8], [3, 0, 12.8], [0, 10, 19]]) L.bar(B, [x * 1.6, 6.3, z], [x, yt, z], 0.35, [150, 120, 70], K.METAL);
  } });

// ================================================================== Barceloneta y Port Vell
// Torre Mare Nostrum (Gas Natural, Miralles–Tagliabue). Silueta: torre de vidrio de 86 m con, a media altura, un gran
// cuerpo horizontal que vuela hacia el oeste sobre la calle y otros volúmenes bajos escalonados.
// Rasgos: el voladizo y el vidrio espejo. Volúmenes de los datos; la torre, a su altura real (86 m frente a 60).
add({ id: 'torre_mare_nostrum', nombre: 'Torre Mare Nostrum', nivel: 'A', x: 13913.4, z: 13616.7, rot: 0, alto: 86, ancho: 80, largo: 90,
  noche: 'ventanas', edificios: [84484, 84485, 102644, 102645, 102646, 102647, 102648, 102649, 102652, 102653, 102654],
  build(B, h, L) {
    const V = [150, 174, 190], V2 = [132, 156, 172], cw = L.aux.cortina(3.6, 1.6, 0.3), T = [92, 98, 104];
    const ext = (pl, y0, y1, col, k, aux) => L.prisma(B, pl, y0, y1, col || V, k || K.CORTINA, { aux: aux || cw, techo: T });
    const torre = [[-23, 41], [-12, 28], [-7, 24], [3, 23], [21, 29], [21, 30], [22, 31], [20, 37], [3, 32], [-9, 52]];
    ext(torre, -1.5, 86);
    L.prisma(B, inflar(torre, -1.5), 86, 89, [120, 126, 132], K.METAL, { aux: L.aux.panel(1.5, 0.1) });
    ext([[-3, 16], [1, 13], [3, 11], [8, 9], [17, 9], [28, 12], [26, 17], [24, 17], [24, 18]], -1.5, 41.4, V2);
    ext([[-12, 28], [-3, 16], [17, 18], [9, 20], [8, 20], [6, 24], [3, 23], [-4, 24], [-7, 24]], 24.4, 41.4, V2);
    // el gran cuerpo horizontal en voladizo
    ext([[-54, 5], [-52, -4], [-17, -1], [-10, 1], [20, 9], [14, 9], [5, 10], [3, 11], [1, 13], [-3, 16], [-14, 16], [-19, 15]], 15.4, 30.4);
    ext([[-30, 12], [-18, 2], [-14, 1], [-10, 1], [20, 9], [14, 9], [5, 10], [3, 11], [1, 13], [-3, 16], [-14, 15]], -1.5, 15.4, [110, 128, 140]);
    for (const pl of [[[-26, 24], [-22, 24], [-21, 30], [-25, 30]], [[-22, 24], [-19, 23], [-18, 30], [-21, 30]], [[-29, 24], [-26, 24], [-25, 30], [-28, 30]], [[-19, 23], [-8, 23], [-14, 30], [-18, 30]]])
      ext(pl, -1.5, 30.4, V2);
    const BJ = [176, 180, 182];
    ext([[-7, -26], [-7, -28], [4, -56], [8, -55], [4, -48], [-3, -34], [-5, -30], [-5, -23], [-5, -19], [-3, -14], [-1, -10], [-3, -13], [-5, -16], [-7, -21]], -1.5, 10.4, BJ, K.VENTANAS, L.aux.ventanas(3.4, 2, 0.6, 0.5));
    ext([[-12, -22], [-12, -26], [-11, -30], [0, -57], [4, -56], [-7, -28], [-7, -24], [-5, -16], [-3, -13], [6, 2], [9, 6], [-8, -11], [-10, -13], [-11, -16], [-12, -19]], -1.5, 4, BJ, K.LISO, L.aux.liso(0));
  } });

// World Trade Center Barcelona (moll de Barcelona). Anillo de edificios de vidrio en forma de barco alrededor de una plaza
// elíptica, sobre el zócalo del muelle.
add({ id: 'wtc', nombre: 'World Trade Center', nivel: 'B', x: 13159.6, z: 12309.5, rot: 0, alto: 40, ancho: 98, largo: 111,
  noche: 'ventanas', edificios: [64243, 64252, 64262, 64289, 64290, 64291, 64292],
  build(B, h, L) {
    const zocalo = [[-56, 3], [-33, -16], [14, -50], [21, -71], [19, -49], [64, -2], [59, 22], [2, 40], [-24, 50], [-12, 38], [-35, 43], [-48, 28], [-54, 13], [-36, -1]];
    L.prisma(B, zocalo, -2, 3.2, [176, 170, 158], K.PIEDRA, { aux: L.aux.piedra(0.8, 1.6) });
    const ang = 122 * Math.PI / 180, cx = 2, cz = -4, rx0 = 21, rz0 = 33, rx1 = 39, rz1 = 52, N = 7;
    const P = (t, rx, rz) => { const u = Math.sin(t) * rx, v = Math.cos(t) * rz; return [cx + u * Math.cos(ang) + v * Math.sin(ang), cz - u * Math.sin(ang) + v * Math.cos(ang)]; };
    const sec = [[8, 82, 34], [98, 172, 30], [188, 262, 34], [278, 352, 30]];
    for (const [a0, a1, al] of sec) { const pl = [];
      for (let i = 0; i <= N; i++) pl.push(P((a0 + (a1 - a0) * i / N) * Math.PI / 180, rx1, rz1));
      for (let i = N; i >= 0; i--) pl.push(P((a0 + (a1 - a0) * i / N) * Math.PI / 180, rx0, rz0));
      L.prisma(B, pl, 3, al, [190, 200, 208], K.CORTINA, { aux: L.aux.cortina(3.6, 1.8, 0.2), techo: [150, 150, 148] });
      L.prisma(B, inflar(pl, 0.4), al, al + 1.2, [214, 204, 184], K.PIEDRA);
      bandas(L, B, pl, 3, al, 7.2, 0.8, 0.4, [214, 204, 184]);
    }
  } });

// Edifici Colón. Primer rascacielos de la ciudad (110 m): prisma oscuro con las últimas plantas que vuelan un poco.
add({ id: 'edifici_colon', nombre: 'Edifici Colón', nivel: 'B', x: 12628.4, z: 12902.7, rot: 0, alto: 110, ancho: 38, largo: 55,
  noche: 'ventanas', edificios: [79063, 79064, 79065, 79066, 79067],
  build(B, h, L) {
    const C = [96, 80, 64], C2 = [76, 64, 52], w = L.aux.ventanas(3.6, 1.6, 0.5, 0.62);
    L.prisma(B, [[-25, -20], [8, -29], [20, 7], [-2, 29], [-12, 27]], -1.5, 13.8, [150, 140, 126], K.VENTANAS, { aux: L.aux.ventanas(4.2, 3, 0.7, 0.6) });
    L.prisma(B, [[-18, -21], [1, -27], [4, -21], [10, -23], [16, -4], [0, 0], [-4, -4], [-6, -5], [-11, -5]], -1.5, 100, C, K.VENTANAS, { aux: w });
    L.prisma(B, [[-14, -15], [-9, -23], [4, -21], [13, -13], [9, -4], [-4, -5]], 100, 104, C2, K.VENTANAS, { aux: w });
    L.prisma(B, [[-15, -14], [-10, -24], [5, -23], [15, -13], [9, -3], [-5, -4]], 104, 108, C2, K.VENTANAS, { aux: w });
    L.prisma(B, [[-17, -14], [-10, -26], [6, -24], [16, -13], [10, -1], [-5, -3]], 108, 110.5, [70, 62, 56], K.LISO);
  } });

// ================================================================== Les Corts (Diagonal)
// Torres «la Caixa». Silueta: dos prismas negros de planta cuadrada con las esquinas achaflanadas a los dos lados de la
// sede (86 y 48 m, alturas de los datos), unidos por cuerpos bajos. Rasgos: muro cortina negro con montantes de aluminio.
add({ id: 'torres_caixa', nombre: 'Torres «la Caixa»', nivel: 'A', x: 8536.9, z: 14129.8, rot: 0, alto: 86, ancho: 34, largo: 138,
  noche: 'ventanas', edificios: [90403, 90429, 90811, 90812],
  build(B, h, L) {
    const N = [30, 34, 38], cw = L.aux.cortina(3.6, 1.25, 0.1), AL = [124, 132, 140];
    const t1 = [[-66, -19], [-62, -27], [-59, -29], [-55, -33], [-47, -32], [-43, -30], [-36, -26], [-35, -22], [-33, -17], [-34, -9], [-38, -6], [-41, 0], [-48, -1], [-53, 1], [-60, -3], [-63, -7], [-66, -11], [-65, -19]];
    const t2 = [[33, 13], [37, 6], [41, 3], [45, 0], [53, 1], [57, 2], [63, 6], [65, 10], [66, 15], [65, 24], [61, 26], [58, 32], [51, 32], [46, 33], [39, 29], [36, 25], [33, 21], [34, 13]];
    for (const [pl, al] of [[t1, 85.4], [t2, 48.2]]) {
      L.prisma(B, pl, -2.5, 5, [70, 74, 78], K.CORTINA, { aux: L.aux.cortina(5, 2.5, 0.05) });
      L.prisma(B, inflar(pl, 0.4), 5, al - 3, N, K.CORTINA, { aux: cw, techo: [60, 62, 64] });
      L.prisma(B, inflar(pl, 0.6), al - 3, al, AL, K.METAL, { aux: L.aux.panel(1.25, 0.1), techo: [70, 72, 74] });
      bandas(L, B, inflar(pl, 0.4), 5, al - 3, 3.6 * 4, 0.5, 0.25, AL);
    }
    L.prisma(B, [[-53, 1], [-52, -1], [-49, 1], [-48, -1], [-45, 0], [-44, -1], [-41, 0], [-41, -3], [-39, -2], [-38, -6], [-37, -6], [-36, -9], [-34, -9], [-38, 4], [-42, 3], [-42, 4]], -2.5, 14.2, N, K.CORTINA, { aux: cw });
    L.prisma(B, [[28, 27], [33, 13], [34, 13], [33, 17], [34, 17], [33, 21], [35, 22], [34, 24], [36, 25], [36, 26], [40, 28], [39, 29], [43, 30], [42, 32]], -2.5, 14, N, K.CORTINA, { aux: cw });
  } });

// Edificis Trade (Coderch). Cuatro torres de oficinas de vidrio oscuro con la fachada ondulada (plantas de curvas).
add({ id: 'edificis_trade', nombre: 'Edificis Trade', nivel: 'B', x: 8677.4, z: 13977.4, rot: 0, alto: 40, ancho: 51, largo: 107,
  noche: 'ventanas', edificios: [90621, 90623, 90851, 90852],
  build(B, h, L) {
    const P = [
      [[[-23, -39], [-23, -41], [-20, -46], [-19, -51], [-18, -52], [-15, -54], [-12, -54], [-7, -52], [-1, -51], [0, -50], [2, -47], [2, -44], [0, -38], [-1, -33], [-4, -30], [-5, -29], [-8, -29], [-9, -29], [-14, -32], [-19, -33], [-22, -35]], 34.8],
      [[[1, -10], [2, -13], [4, -16], [5, -23], [6, -24], [9, -25], [12, -26], [17, -22], [22, -22], [24, -21], [26, -18], [26, -14], [24, -10], [23, -6], [22, -3], [19, -1], [15, -1], [10, -3], [4, -4], [3, -6], [2, -7]], 36.3],
      [[[-26, 16], [-26, 14], [-23, 10], [-22, 4], [-21, 2], [-19, 1], [-17, 1], [-15, 1], [-10, 4], [-5, 4], [-2, 6], [-1, 8], [-1, 11], [-3, 16], [-4, 22], [-6, 24], [-8, 25], [-12, 26], [-17, 23], [-23, 22], [-25, 20]], 39.5],
      [[[-4, 45], [-3, 43], [-1, 37], [0, 32], [1, 30], [3, 29], [5, 29], [8, 29], [12, 31], [19, 33], [20, 34], [21, 36], [22, 40], [19, 45], [18, 51], [16, 53], [15, 54], [12, 54], [9, 54], [6, 52], [0, 51], [-3, 48]], 39.5]];
    for (const [pl, al] of P) {
      L.prisma(B, pl, -3, al, [40, 54, 56], K.CORTINA, { aux: L.aux.cortina(3.3, 1.1, 0.12), techo: [80, 84, 84] });
      bandas(L, B, pl, -3, al, 6.6, 0.6, 0.3, [64, 74, 74]);
      L.prisma(B, inflar(pl, 0.3), al, al + 1.6, [70, 78, 78], K.LISO);
    }
  } });

// ================================================================== Glòries y Poblenou
// Mercat dels Encants. Gran cubierta de espejo facetada, a 15–26 m, sobre el mercado en rampa.
add({ id: 'encants', nombre: 'Mercat dels Encants', nivel: 'B', x: 13609.9, z: 15594.2, rot: 0, alto: 26, ancho: 115, largo: 136,
  noche: 'nada', edificios: [139521],
  build(B, h, L) {
    const pl = [[-89, 7], [7, -89], [10, 72], [-6, 88], [-36, 58]], ESP = [206, 214, 222], aux = L.aux.panel(3.2, 0.35);
    L.prisma(B, pl, -5, 3.5, [150, 138, 120], K.LISO, { techo: [122, 112, 100] });
    const out = [];
    for (let i = 0; i < pl.length; i++) { const a = pl[i], b = pl[(i + 1) % pl.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 24));
      for (let j = 0; j < n; j++) out.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]); }
    const o2 = inflar(out, 4), c = centro(out), ys = out.map((p, i) => 15 + 5 * ((i * 7) % 3) + (p[1] + 90) * 0.035);
    const mid = out.map((p, i) => [c[0] + (o2[i][0] - c[0]) * 0.55, c[1] + (o2[i][1] - c[1]) * 0.55, 21 + 3 * ((i * 5) % 2)]);
    for (let i = 0; i < out.length; i++) { const j = (i + 1) % out.length, A = [o2[i][0], ys[i], o2[i][1]], Bp = [o2[j][0], ys[j], o2[j][1]], M = [mid[i][0], mid[i][2], mid[i][1]], N = [mid[j][0], mid[j][2], mid[j][1]];
      L.poly(B, [A, Bp, N], ESP, K.METAL, aux); L.poly(B, [A, N, M], L.shade(ESP, 0.93), K.METAL, aux);
      L.poly(B, [M, N, [c[0], 25, c[1]]], L.shade(ESP, 1.04), K.METAL, aux);
      if (i % 2 === 0) L.tambor(B, mid[i][0], mid[i][1], -1, mid[i][2], 0.5, { lados: 6, col: [190, 190, 192], k: K.METAL }); }
  } });

// Disseny Hub (la «grapadora»). Bloque de chapa oscura levantado del suelo que vuela hacia la plaza de les Glòries,
// apoyado en una lámina alta del lado suroeste.
add({ id: 'disseny_hub', nombre: 'Disseny Hub', nivel: 'B', x: 13725.2, z: 15753.1, rot: 0, alto: 34, ancho: 40, largo: 54,
  noche: 'ventanas', edificios: [141731, 141732, 141744, 141745],
  build(B, h, L) {
    const OS = [62, 62, 64], aux = L.aux.panel(2.2, 0.15, 0.12);
    L.prisma(B, [[-19, 19], [19, -19], [33, -5], [-4, 33]], 14, 33.5, OS, K.METAL, { aux, techo: [80, 80, 82] });
    L.prisma(B, [[-12, 2], [12, -22], [17, -17], [-7, 7]], -3.5, 30.3, OS, K.METAL, { aux });
    L.prisma(B, [[-19, 19], [19, -19], [24, -14], [-14, 24]], -3.5, 14, [44, 52, 60], K.CORTINA, { aux: L.aux.cortina(4.5, 2, 0.1) });
    L.prisma(B, [[-8, -18], [-4, -22], [0, -18], [-4, -14]], -2, 3.1, [180, 180, 178], K.LISO);
    L.prisma(B, [[-18, -10], [-15, -13], [-12, -10], [-15, -7]], -1, 5, [180, 180, 178], K.LISO);
  } });

// Hotel Melià Sky (Perrault). Lámina alta de 116 m con un cuerpo que vuela arriba sobre otra lámina más baja.
add({ id: 'melia_sky', nombre: 'Hotel Melià Sky', nivel: 'B', x: 14791.3, z: 16161.7, rot: 0, alto: 116, ancho: 18, largo: 36,
  noche: 'ventanas', edificios: [159825, 159826, 159829, 160270, 160273, 160275, 160278, 160282, 160293, 160297],
  build(B, h, L) {
    const OS = [52, 62, 74], CL = [214, 218, 214], cw = L.aux.cortina(3.4, 1.4, 0.3), vw = L.aux.ventanas(3.4, 2.4, 0.55, 0.55);
    const ext = (pl, y0, y1, col, k, aux) => L.prisma(B, pl, y0, y1, col, k, { aux, techo: [96, 98, 100] });
    ext([[-16, -12], [-11, -15], [7, 17], [1, 20]], 24.9, 115.9, OS, K.CORTINA, cw);
    ext([[-11, -15], [-8, -16], [9, 16], [7, 17]], -1.2, 115.9, OS, K.CORTINA, cw);
    ext([[-8, -16], [-1, -20], [16, 12], [9, 16]], -1.1, 94.9, CL, K.VENTANAS, vw);
    ext([[-6, -12], [-4, -13], [-5, -15], [0, -18], [16, 12], [11, 15], [9, 11], [7, 12]], -1.1, 74.5, CL, K.VENTANAS, vw);
    ext([[-16, -12], [-11, -15], [-7, -9], [-9, -8], [-8, -6], [-6, -7], [7, 17], [1, 20]], -1.3, 24.9, [70, 76, 84], K.CORTINA, cw);
    ext([[-6, -7], [-4, -8], [9, 16], [7, 17]], -1.1, 96.9, OS, K.CORTINA, cw);
    ext([[-11, -15], [-8, -16], [-5, -10], [-7, -9]], -1.2, 96.9, OS, K.CORTINA, cw);
  } });

// ================================================================== Fòrum y Diagonal Mar
// Edifici Fòrum (Herzog & de Meuron). Silueta: gran triángulo de ~180 m de lado, bajo y levantado del suelo sobre
// pilares, con la plaza cubierta debajo. Rasgos: la fachada azul ultramar rugosa con «grietas» de vidrio y el sofito de
// espejo. Planta de los datos.
add({ id: 'edifici_forum', nombre: 'Edifici Fòrum', nivel: 'A', x: 16520.2, z: 16706.1, rot: 0, alto: 25, ancho: 164, largo: 177,
  noche: 'focos', edificios: [161386, 161387],
  build(B, h, L) {
    const AZ = [34, 64, 140], pl = [[-120, 10], [-95, -10], [-79, -35], [-54, -62], [-48, -62], [-1, -120], [13, -69], [17, -53], [20, -50], [35, 1], [40, 18], [35, 56], [10, 50], [6, 48], [-7, 41], [-53, 31], [-61, 28], [-81, 19]];
    const Y0 = 6, Y1 = 24.5;
    L.prisma(B, pl, Y0, Y1, AZ, K.PIEDRA, { aux: L.aux.piedra(0.9, 2.2), techo: [150, 150, 146] });
    L.poly(B, pl.map(p => [p[0], Y0 - 0.05, p[1]]), [150, 160, 176], K.METAL, L.aux.panel(2.5, 0.25));   // sofito
    // grietas de vidrio: tiras quebradas sobre las caras largas
    const s = areaPl(pl) > 0 ? 1 : -1;
    for (let i = 0; i < pl.length; i++) { const a = pl[i], b = pl[(i + 1) % pl.length], dx = b[0] - a[0], dz = b[1] - a[1], w = Math.hypot(dx, dz); if (w < 18) continue;
      const tx = dx / w, tz = dz / w, nx = s * tz * 0.25, nz = -s * tx * 0.25, n = Math.floor(w / 20);
      for (let k = 0; k < n; k++) { let u = (k + 0.5) * w / n + ((i * 13 + k * 7) % 5 - 2);
        for (let j = 0; j < 4; j++) { const ya = Y0 + (Y1 - Y0) * j / 4, yb = Y0 + (Y1 - Y0) * (j + 1) / 4, u2 = Math.max(1, Math.min(w - 2.5, u + ((i + k + j) % 3 - 1) * 2.5)), wd = 1.2 + ((k + j) % 2) * 0.8;
          const P = (uu, y) => [a[0] + tx * uu + nx, y, a[1] + tz * uu + nz];
          L.q4(B, P(u, ya), P(u + wd, ya), P(u2 + wd, yb), P(u2, yb), [70, 96, 120], K.CORTINA, L.aux.cortina(3, 1, 0.3)); u = u2; } } }
    // pilares y núcleos bajo el triángulo, y los recintos acristalados de la planta baja
    const T = [[-120, 10], [-1, -120], [35, 56]];
    for (const [p, q, r] of [[0.6, 0.2, 0.2], [0.2, 0.6, 0.2], [0.2, 0.2, 0.6], [0.34, 0.33, 0.33], [0.45, 0.45, 0.1], [0.1, 0.45, 0.45], [0.45, 0.1, 0.45], [0.7, 0.05, 0.25], [0.05, 0.7, 0.25]])
      L.tambor(B, T[0][0] * p + T[1][0] * q + T[2][0] * r, T[0][1] * p + T[1][1] * q + T[2][1] * r, -2, Y0, 2.2, { lados: 8, col: [176, 174, 168] });
    L.prisma(B, [[-75, 21], [-66, 7], [-66, 3], [-75, -2], [-70, -9], [-75, -35], [-58, -52], [-44, -50], [-46, -57], [5, -69], [45, 34], [49, 48], [1, 33], [-11, 37], [-16, 35], [-18, 40], [-24, 38], [-23, 33], [-60, 21], [-65, 28]].map(p => [p[0] * 0.55 - 8, p[1] * 0.55 - 6]),
      -3, Y0, [48, 58, 66], K.CORTINA, { aux: L.aux.cortina(6, 3, 0.15), sinTecho: true });
  } });

// Pèrgola fotovoltaica del Fòrum. Gran placa inclinada (112 × 50 m) mirando al sur sobre cuatro pilares de hormigón.
add({ id: 'pergola_forum', nombre: 'Pèrgola fotovoltaica', nivel: 'B', x: 16978.4, z: 16785.4, rot: 0, alto: 50, ancho: 112, largo: 50,
  noche: 'nada', edificios: [], sombra: true,
  build(B, h, L) {
    const W = 56, t = 34 * Math.PI / 180, D = 25 * Math.cos(t), ylo = 22, yhi = ylo + 50 * Math.sin(t), e = 1.4;
    const ny = Math.cos(t), nz = -Math.sin(t), c = [[-W, ylo, -D], [W, ylo, -D], [W, yhi, D], [-W, yhi, D]], up = p => [p[0], p[1] + ny * e, p[2] + nz * e];
    L.poly(B, c.map(up), [40, 54, 86], K.METAL, L.aux.panel(2, 0.25));
    L.poly(B, c, [196, 194, 188], K.LISO);
    for (let i = 0; i < 4; i++) { const a = c[i], b = c[(i + 1) % 4]; L.q4(B, a, b, up(b), up(a), [170, 168, 164], K.LISO); }
    const yz = z => ylo + (z + D) * Math.tan(t);
    for (const [x, z] of [[-30, -10], [30, -10], [-30, 12], [30, 12]]) L.bar(B, [x * 1.25, -2, z * 1.3], [x, yz(z) - 0.2, z], 1.7, [184, 180, 172], K.LISO);
    L.caja(B, 0, -10, yz(-10) - 2.5, 64, 1.6, 2.4, 0, [184, 180, 172], K.LISO);
    L.caja(B, 0, 12, yz(12) - 2.5, 64, 1.6, 2.4, 0, [184, 180, 172], K.LISO);
  } });

// Torre Diagonal ZeroZero. Prisma de vidrio de 110 m en el arranque de la Diagonal, con la celosía de rombos de acero.
add({ id: 'diagonal_zerozero', nombre: 'Torre Diagonal ZeroZero', nivel: 'B', x: 16452.8, z: 16798.5, rot: 0, alto: 110, ancho: 31, largo: 65,
  noche: 'ventanas', edificios: [161373],
  build(B, h, L) {
    const pl = [[-26, -25], [23, -9], [29, 16], [3, 18], [-11, -4]];
    L.prisma(B, pl, -2.5, 110, [150, 168, 184], K.CORTINA, { aux: L.aux.cortina(3.7, 1.5, 0.3), techo: [120, 122, 124] });
    rombos(L, B, pl, -2, 110, 11, 0.32, 0.9, [226, 230, 234]);
    L.prisma(B, inflar(pl, 0.9), 109.2, 110.6, [226, 230, 234], K.LISO);
  } });

// Hotel Princess. Dos torres de distinta altura (97 y 78 m) de vidrio oscuro con franjas de panel claro.
add({ id: 'hotel_princess', nombre: 'Hotel Princess', nivel: 'B', x: 16358.5, z: 16801.7, rot: 0, alto: 97, ancho: 34, largo: 82,
  noche: 'ventanas', edificios: [161483, 176088],
  build(B, h, L) {
    const a = [[-41, -11], [-21, -31], [-6, -21], [4, -17], [-5, 1], [-11, -2], [-10, -3], [-22, -8], [-29, -1], [-32, -3], [-35, 0]], b = [[14, 1], [24, -2], [38, 17], [36, 18]];
    for (const [pl, al] of [[a, 97], [b, 77.8]]) {
      L.prisma(B, pl, -1.5, al, [56, 70, 86], K.CORTINA, { aux: L.aux.cortina(3.5, 1.5, 0.2), techo: [110, 112, 114] });
      bandas(L, B, pl, -1.5, al, 7, 1.1, 0.3, [216, 220, 216]);
      L.prisma(B, inflar(pl, 0.3), al, al + 2, [216, 220, 216], K.LISO);
    }
  } });

// Torres de viviendas de Diagonal Mar (alrededor del parque): prismas claros con los balcones corridos.
add({ id: 'torres_diagonal_mar', nombre: 'Torres de Diagonal Mar', nivel: 'B', x: 16055, z: 16302, rot: 0, alto: 88, ancho: 66, largo: 352,
  noche: 'ventanas', edificios: [160844, 160845, 161456, 161458, 161464, 161465], etiqueta: false,
  build(B, h, L) {
    const CL = [232, 228, 218], vw = L.aux.ventanas(3, 3.2, 0.78, 0.5), T = [180, 176, 170];
    const ext = (pl, y0, y1, col, k, aux) => L.prisma(B, pl, y0, y1, col || CL, k || K.VENTANAS, { aux: aux || vw, techo: T });
    ext([[-75, 159], [-67, 134], [-64, 135], [-64, 134], [-48, 139], [-48, 140], [-45, 141], [-46, 144], [-47, 150], [-49, 157], [-52, 162], [-53, 166], [-56, 165], [-56, 166], [-72, 161], [-72, 160]], -1.5, 71.3);
    ext([[-64, 152], [-62, 145], [-56, 147], [-58, 154]], 71, 74.5, [120, 136, 150], K.LISO, L.aux.liso(0));
    ext([[-2, -60], [4, -74], [3, -74], [12, -90], [18, -84], [19, -86], [25, -83], [19, -69], [19, -68], [11, -54], [4, -58], [4, -57]], -1.5, 74.9);
    ext([[67, -120], [85, -138], [85, -139], [97, -147], [103, -139], [106, -141], [112, -136], [93, -117], [93, -117], [80, -107], [75, -116], [73, -114]], -1.5, 88.4);
    ext([[-39, 46], [-31, 21], [-29, 22], [-28, 21], [-12, 26], [-12, 27], [-9, 28], [-11, 32], [-11, 38], [-14, 44], [-16, 50], [-17, 53], [-20, 52], [-21, 53], [-37, 48], [-36, 46]], -1.5, 71.6);
    ext([[-29, 39], [-27, 33], [-20, 35], [-22, 42]], 71, 74.8, [120, 136, 150], K.LISO, L.aux.liso(0));
  } });

// Torre de les Aigües del Besòs (1882). Torre de ladrillo alta y esbelta con el depósito arriba.
add({ id: 'torre_aigues_besos', nombre: 'Torre de les Aigües del Besòs', nivel: 'B', x: 15760.8, z: 16104, rot: 0, alto: 63, ancho: 8, largo: 8,
  noche: 'focos', edificios: [161363, 161364, 161365],
  build(B, h, L) {
    const LAD = [178, 86, 60], aux = L.aux.ladrillo(0.3, 0.6);
    L.prisma(B, L.poligono(4.2, 8, 22.5), -1.5, 4, [190, 170, 140], K.PIEDRA, { aux: L.aux.piedra(0.6, 1.2) });
    L.tambor(B, 0, 0, 4, 50, 3.4, { r1: 2.4, lados: 12, col: LAD, k: K.LADRILLO, aux });
    L.tambor(B, 0, 0, 50, 51, 3.2, { lados: 12, col: [200, 184, 160], k: K.PIEDRA });
    L.tambor(B, 0, 0, 51, 58, 3.3, { lados: 12, col: LAD, k: K.LADRILLO, aux });
    L.tambor(B, 0, 0, 58, 59, 3.7, { lados: 12, col: [200, 184, 160], k: K.PIEDRA });
    L.cupula(B, 0, 0, 59, 3.4, 3.5, { lados: 12, anillos: 4, col: [120, 110, 100], k: K.METAL, linterna: { r: 0.6, alto: 1.8 } });
  } });

// Tres Xemeneies del Besòs (Sant Adrià). Tres fustes de hormigón de 200 m en fila a lo largo de la playa (rumbo 48), con
// la nave de turbinas al pie (esa queda del volumen de los datos, #207013). Los datos ya tienen las chimeneas, pero cada una
// sale de un bloque de 95 m de 27 × 27 m que no existe: se sustituyen por los fustes exentos, en sus posiciones.
// (La posición del catálogo, tomada del poi, se iba 265 m al oeste.)
add({ id: 'xemeneies_besos', nombre: 'Tres Xemeneies', nivel: 'B', x: 17683, z: 18430.5, rot: 48, alto: 200, ancho: 20, largo: 140,
  noche: 'nada', edificios: [189712, 189713, 189715, 189716, 189717, 189718, 189719, 206704, 206705, 206706, 206713,
    207003, 207004, 207005, 207006, 207007, 207008, 207009, 207010, 207011, 207012],
  build(B, h, L) {
    const HO = [206, 202, 194];
    for (const [x, z] of [[0.6, -63.7], [0, 0], [0.8, 53.1]]) {
      L.chimenea(B, x, z, -2, 202, 8.6, 4.8, { lados: 20, col: HO, bandas: [[186, 197, [172, 168, 162]]] });
      L.tambor(B, x, z, -2, 6, 11, { lados: 16, col: [184, 178, 168], k: K.LISO });
    }
  } });

// ================================================================== nivel C: retoque del volumen existente
add({ id: 'torre_urquinaona', nombre: 'Torre Urquinaona', nivel: 'C', x: 12453.8, z: 14354.2, rot: 136, alto: 73,
  noche: 'ventanas', edificios: [96044, 98005], ocultar: false, fachada: false, retoque: { color: '#8e9092', estilo: 3, alto: 73 } });
add({ id: 'torre_melina', nombre: 'Torre Melina', nivel: 'C', x: 7056.5, z: 13426.8, rot: 127, alto: 90,
  noche: 'ventanas', edificios: [68831], ocultar: false, fachada: false, retoque: { color: '#7f9fbf', estilo: 3, alto: 90 } });

})();
