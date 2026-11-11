/* GTA Barcelona — HITOS, lote d (Ciutat Vella, puerto y monumentos). Cada hito se declara con BCN_LM.add({...}) al cargar
   el script (ficha y constructor: DESARROLLO.md §10). Este fichero es SOLO del agente del lote d.
   Ejemplo de referencia del núcleo: Arc de Triomf.
   Las plantas de los datos van copiadas a mano (simplificadas) en coordenadas locales de cada hito: así los constructores no
   dependen de h.edif (que en tools/hitos/tris.js viene vacío) y no fallan con datos raros. */
(function () {
'use strict';
const { add, lib: L, K } = window.BCN_LM;

// ------------------------------------------------------------------ piezas propias del lote
const PIEDRA = [184, 166, 136], PIEDRA2 = [150, 136, 112], OSCURO = [52, 48, 46], VIDRIO = [62, 66, 82];
const aPie = L.aux.piedra(0.6, 1.2);
// perfil de arco apuntado (puerta o ventanal gótico) de ancho w, arranque a y1 y clave a y2, con base en y0
const apuntado = (w, y0, y1, y2, x) => { x = x || 0; const p = [[x - w / 2, y0], [x + w / 2, y0], [x + w / 2, y1]];
  for (let i = 1; i < 5; i++) { const t = i / 5; p.push([x + w / 2 * (1 - t) * (1 - t * 0.35), y1 + (y2 - y1) * Math.sin(t * Math.PI / 2)]); }
  p.push([x, y2]); for (let i = 4; i >= 1; i--) { const t = i / 5; p.push([x - w / 2 * (1 - t) * (1 - t * 0.35), y1 + (y2 - y1) * Math.sin(t * Math.PI / 2)]); }
  p.push([x - w / 2, y1]); return p; };
const circulo = (cx, cy, r, n) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; };
// rosetón en un muro perpendicular a Z (la cara mira a −Z si dir = −1): marco de piedra, vidrio y radios de tracería
function roseton(B, x, y, z, r, dir, col) {
  const d = dir < 0 ? -1 : 1;
  L.extruir(B, circulo(x, y, r * 1.18, 20), z, z + d * 0.5, col || PIEDRA, K.PIEDRA);
  L.extruir(B, circulo(x, y, r, 20), z - d * 0.12, z, VIDRIO, K.LISO);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI; L.bar(B, [x - Math.cos(a) * r, y - Math.sin(a) * r, z - d * 0.2], [x + Math.cos(a) * r, y + Math.sin(a) * r, z - d * 0.2], 0.16, col || PIEDRA, K.PIEDRA); }
}
// torre octogonal con franjas oscuras (huecos del campanario): bandas = [[y0, y1], …]
function torreOct(B, x, z, y0, y1, r, col, bandas, o) {
  o = o || {}; const c = L.color(col), dk = L.shade(c, 0.5), prof = [[r, y0, c]];
  for (const [a, b] of bandas || []) prof.push([r, a, c], [r, a, dk], [r, b, dk], [r, b, c]);
  prof.push([r, y1, c], [r * 0.001, y1, L.shade(c, 0.85)]);
  L.rev(B, L.F0, x, z, prof, o.lados || 8, c, o.k || K.PIEDRA, { aux: o.aux || aPie });
}
// torre de celosía de cuatro patas (planta cuadrada; semiancho w0 abajo y w1 arriba), con n tramos arriostrados en X
function celosia(B, y0, y1, w0, w1, n, col, r) {
  const W = y => w0 + (w1 - w0) * (y - y0) / (y1 - y0), C = [[1, 1], [-1, 1], [-1, -1], [1, -1]], P = (i, y) => [C[i][0] * W(y), y, C[i][1] * W(y)];
  for (let i = 0; i < 4; i++) L.bar(B, P(i, y0), P(i, y1), r * 1.8, col, K.METAL);
  for (let j = 0; j < n; j++) { const ya = y0 + (y1 - y0) * j / n, yb = y0 + (y1 - y0) * (j + 1) / n;
    for (let i = 0; i < 4; i++) { const i2 = (i + 1) % 4;
      L.bar(B, P(i, yb), P(i2, yb), r, col, K.METAL);
      L.bar(B, P(i, ya), P(i2, yb), r * 0.8, col, K.METAL); L.bar(B, P(i2, ya), P(i, yb), r * 0.8, col, K.METAL); } }
}
// pináculo gótico: fuste cuadrado y chapitel
function pinaculo(B, x, z, y0, alto, lado, col) {
  L.caja(B, x, z, y0, lado, lado, alto * 0.55, 0, col, K.PIEDRA);
  L.piramide(B, x, z, y0 + alto * 0.55, lado * 1.1, lado * 1.1, alto * 0.45, { col, k: K.PIEDRA });
}

// ================================================================== NIVEL A

// Monument a Colom. Silueta: columna de hierro de 60 m sobre un basamento escalonado de piedra; arriba, el globo y la
// estatua. Rasgos: la columna muy esbelta y oscura con capitel; la estatua señalando al mar (rumbo del brazo = rot); los
// ocho leones de bronce alrededor del pedestal octogonal.
add({ id: 'colom', nombre: 'Monument a Colom', nivel: 'A', x: 12843.5, z: 12802, rot: 125, alto: 60, ancho: 28, largo: 28,
  noche: 'focos', edificios: [82738, 82739, 82740, 82741],
  build(B, h, L) {
    const P1 = [204, 184, 142], P2 = [178, 160, 124], BR = [70, 70, 60], BR2 = [104, 98, 76], ORO = [196, 164, 92];
    // escalinata circular, plataforma y basamento octogonal
    L.tambor(B, 0, 0, -2, 0.45, 14, { lados: 32, col: P2, k: K.PIEDRA, aux: aPie });
    L.tambor(B, 0, 0, 0.45, 1.2, 12.3, { lados: 32, col: P1, k: K.PIEDRA, aux: aPie });
    L.tambor(B, 0, 0, 1.2, 5.6, 9.2, { lados: 8, col: P1, k: K.PIEDRA, aux: aPie });
    L.tambor(B, 0, 0, 5.6, 6.3, 9.7, { lados: 8, col: P2, k: K.PIEDRA });
    // ocho leones de bronce sobre pedestales, mirando hacia fuera
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * 2 * Math.PI, deg = a * 180 / Math.PI, s = Math.sin(a), c = Math.cos(a);
      L.caja(B, s * 10.6, c * 10.6, 1.2, 2.2, 4.2, 1.0, deg, P2, K.PIEDRA);
      L.caja(B, s * 10.6, c * 10.6, 2.2, 1.2, 2.8, 1.2, deg, BR, K.METAL);
      L.caja(B, s * 11.9, c * 11.9, 2.6, 1.3, 1.1, 1.5, deg, BR, K.METAL); }
    // pedestal: núcleo con relieves de bronce y cuatro contrafuertes con figuras sentadas
    L.caja(B, 0, 0, 6.3, 7.4, 7.4, 10, 45, P1, K.PIEDRA, { aux: aPie });
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, s = Math.sin(a), c = Math.cos(a), deg = i * 90;
      L.caja(B, s * 3.75, c * 3.75, 8.2, 3.6, 0.3, 3.2, deg + 45 - 45, BR2, K.METAL);                    // relieve
      const sx = Math.sin(a + Math.PI / 4) * 5.4, sz = Math.cos(a + Math.PI / 4) * 5.4;
      L.caja(B, sx, sz, 6.3, 2.6, 2.6, 4.8, deg + 45, P2, K.PIEDRA);                                         // contrafuerte
      L.aguja(B, sx, sz, 11.1, 3.0, 0.85, { lados: 6, pasos: 3, recto: 0.4, col: BR, k: K.METAL });       // figura
      L.esfera(B, sx, 14.4, sz, 0.42, { gajos: 6, anillos: 4, col: BR, k: K.METAL }); }
    L.caja(B, 0, 0, 16.3, 8.6, 8.6, 0.8, 45, P2, K.PIEDRA);
    L.tambor(B, 0, 0, 17.1, 21, 3.3, { lados: 8, col: P1, k: K.PIEDRA, aux: aPie });
    for (let i = 0; i < 4; i++) { const a = (i + 0.5) * Math.PI / 2, s = Math.sin(a), c = Math.cos(a);              // famas aladas
      L.aguja(B, s * 3.3, c * 3.3, 17.1, 4.6, 0.55, { lados: 6, pasos: 3, recto: 0.5, col: BR, k: K.METAL });
      L.caja(B, s * 3.6, c * 3.6, 19.6, 0.25, 1.8, 2.2, i * 90 + 45 + 90, BR, K.METAL); }
    // columna: basa, fuste afilado con anillos, capitel y ábaco
    L.tambor(B, 0, 0, 21, 22.3, 2.7, { lados: 16, col: BR2, k: K.METAL });
    L.rev(B, L.F0, 0, 0, [[2.15, 22.3], [1.8, 23.2], [1.75, 26], [1.95, 26.2], [1.95, 26.9], [1.72, 27.1], [1.45, 49]], 16, BR, K.METAL);
    L.rev(B, L.F0, 0, 0, [[1.45, 49], [1.7, 49.6], [2.3, 50.9], [2.55, 51.3], [0.01, 51.3]], 16, BR2, K.METAL);
    L.caja(B, 0, 0, 51.3, 5.2, 5.2, 0.7, 45, BR2, K.METAL);
    // globo con corona
    L.tambor(B, 0, 0, 52, 52.6, 1.6, { lados: 12, col: BR2, k: K.METAL });
    L.esfera(B, 0, 54.1, 0, 1.75, { gajos: 12, anillos: 7, col: BR2, k: K.METAL });
    L.tambor(B, 0, 0, 53.7, 54.3, 1.95, { lados: 12, col: ORO, k: K.METAL, sinTapa: true });
    // estatua de Colón: cuerpo con capa, cabeza y el brazo derecho extendido hacia +Z (el mar)
    L.rev(B, L.F0, 0, 0, [[0.95, 55.4], [0.85, 57.2], [0.98, 58.3], [0.75, 58.9], [0.3, 59.1], [0.01, 59.1]], 10, BR, K.METAL);
    L.esfera(B, 0, 59.5, 0, 0.42, { gajos: 8, anillos: 5, col: BR, k: K.METAL });
    L.bar(B, [0.55, 58.6, 0.1], [0.7, 59.5, 2.5], 0.19, BR, K.METAL);
    L.bar(B, [-0.65, 58.5, 0], [-0.85, 57.1, 0.35], 0.18, BR, K.METAL);
  } });

// Catedral de Barcelona. Silueta: mole gótica de 94 m con la fachada neogótica al Pla de la Seu (−Z, al noroeste) y su
// cimborio-aguja de 70 m justo detrás; dos agujas laterales en la fachada; dos campanarios octogonales sobre el crucero.
// Rasgos: las tres agujas de la fachada; los campanarios octogonales; piedra gris dorada con pináculos.
add({ id: 'catedral', nombre: 'Catedral de Barcelona', nivel: 'A', x: 12750.6, z: 13711, rot: 134, alto: 70, ancho: 45, largo: 94,
  noche: 'focos', edificios: [95948, 95950, 95952, 95957, 95960, 96096, 96097],
  build(B, h, L) {
    const C = [186, 168, 134], C2 = [160, 146, 118], TJ = [128, 118, 104];
    // cuerpo (naves laterales y capillas) con la planta de los datos
    const cuerpo = [[19.6, -46.3], [20.2, -45.5], [19.9, -37.3], [19.1, -37.2], [18.9, 2.5], [22.6, 5.4], [22.5, 14], [20.3, 14.1], [20.3, 22.8],
      [12.9, 22.8], [12.8, 28.8], [11.5, 34.3], [7.3, 39], [1.5, 41.9], [-4.8, 41.7], [-10.2, 38.9], [-13.8, 34.2], [-14.8, 28.5], [-14.5, 14.3],
      [-13.5, 5.8], [-16.8, 3.1], [-16.2, -15.2], [-20.9, -15.3], [-19.9, -45.2], [-18.8, -46.1], [-7.5, -46.2], [6.6, -47], [7, -46.2]];
    L.prisma(B, cuerpo, -2, 23, C, K.PIEDRA, { aux: aPie, techo: C2 });
    // corona de capillas de la girola
    const girola = [[18.1, 22.7], [17.2, 26.2], [16.7, 31], [17.1, 34.4], [14.3, 39.4], [10.2, 43.5], [4.6, 46.2], [-0.1, 47], [-6.2, 45.4], [-11.5, 44.4],
      [-16.1, 40.6], [-19.2, 36.5], [-22, 26.6], [-21.8, 13.7], [-14.5, 14.3], [-14.8, 28.5], [-13.8, 34.2], [-10.2, 38.9], [-4.8, 41.7], [1.5, 41.9],
      [7.3, 39], [11.5, 34.3], [12.8, 28.8], [12.9, 22.8]];
    L.prisma(B, girola, -2, 15, C2, K.PIEDRA, { aux: aPie });
    // nave central y ábside, más altos, con tejado a dos aguas de piedra
    const nave = [[6.4, -44], [5.9, 27.9], [5.1, 31], [2.9, 33.7], [0.2, 34.9], [-3, 35.1], [-5.5, 33.6], [-7.4, 31.1], [-7.8, 28.1], [-7.1, -44]];
    L.prisma(B, nave, 20, 31, C, K.PIEDRA, { aux: aPie });
    L.cubierta(B, -0.5, -8, 31, 13.6, 72, 4.2, { col: TJ, k: K.PIEDRA, colHastial: C });
    // pináculos sobre los contrafuertes de las naves laterales
    for (let z = -20; z <= 26; z += 6.5) for (const x of [-11.5, 10.8]) pinaculo(B, x, z, 23, 6, 1.1, C);
    // fachada neogótica: muro, gablete, portada apuntada y rosetón, con pináculos en el gablete
    L.caja(B, 0, -45.6, -2, 27, 3, 29, 0, C, K.PIEDRA, { aux: aPie });
    L.extruir(B, [[-12.5, 27], [12.5, 27], [0, 41]], -47.1, -44.1, C, K.PIEDRA, { aux: aPie });
    L.extruir(B, apuntado(6.5, -1, 8, 15), -47.4, -47.1, OSCURO, K.LISO);
    roseton(B, 0, 20, -47.1, 3.4, -1, C);
    for (const x of [-7, 7]) { L.caja(B, x, -47.4, -2, 1.4, 1.4, 29, 0, C2, K.PIEDRA); pinaculo(B, x, -47.4, 27, 9, 1.4, C); }
    pinaculo(B, 0, -45.6, 40, 6, 1.2, C);
    // agujas laterales de la fachada (torres cuadradas con chapitel octogonal y pináculos)
    for (const x of [15.8, -15.9]) {
      L.caja(B, x, -41, -2, 6, 6, 31, 0, C, K.PIEDRA, { aux: aPie });
      L.aguja(B, x, -41, 31, 12.5, 2.9, { lados: 8, pasos: 3, pot: 1, exp: 1, col: C, k: K.PIEDRA });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) pinaculo(B, x + sx * 2.6, -41 + sz * 2.6, 31, 4.5, 0.8, C); }
    // cimborio octogonal con la aguja central de 70 m
    torreOct(B, -0.6, -31.8, -2, 43, 7.4, C, [[36, 41]]);
    torreOct(B, -0.6, -31.8, 43, 48.5, 6.2, C2, [[44, 47.5]]);
    L.aguja(B, -0.6, -31.8, 48.5, 21.5, 5.2, { lados: 8, pasos: 4, pot: 1, exp: 1, col: C, k: K.PIEDRA, remate: { r: 0.5, col: [200, 180, 120] } });
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * 2 * Math.PI; pinaculo(B, -0.6 + Math.sin(a) * 6.8, -31.8 + Math.cos(a) * 6.8, 43, 7, 0.9, C); }
    // campanarios octogonales sobre los brazos del crucero
    for (const x of [17, -17.5]) {
      torreOct(B, x, 8.5, -2, 47, 4.6, C, [[39, 45.5]]);
      L.tambor(B, x, 8.5, 47, 48, 5, { lados: 8, col: C2, k: K.PIEDRA });
      for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * 2 * Math.PI; pinaculo(B, x + Math.sin(a) * 4.4, 8.5 + Math.cos(a) * 4.4, 48, 4, 0.6, C); } }
  } });

// Santa Maria del Mar. Silueta: bloque macizo de piedra (nave de 33 m y naves laterales de 26 m), fachada plana a la
// plaça de Santa Maria (−Z) entre dos campanarios octogonales esbeltos de 40 m con remate plano. Rasgos: los dos
// campanarios; el gran rosetón sobre la portada; los contrafuertes. (Eje real: 30°, no los 53° del catálogo.)
add({ id: 'santa_maria_mar', nombre: 'Santa Maria del Mar', nivel: 'A', x: 13207.5, z: 13687.8, rot: 30, alto: 42, ancho: 30, largo: 78,
  noche: 'focos', edificios: [99176, 99177, 99178, 99179, 99180, 99181, 99182, 99183, 99184, 99185, 99186, 99187, 99188, 99189, 99190,
    99191, 99192, 99193, 99194, 99195, 99196],
  build(B, h, L) {
    const C = [184, 164, 130], C2 = [158, 142, 114];
    const lat = [[-13, -38.6], [13, -38.6], [12.9, 26], [11.7, 31.5], [8.1, 36.2], [3.2, 38.5], [-3, 38.5], [-8.6, 35.9], [-11.9, 31.4], [-12.8, 27.6]];
    L.prisma(B, lat, -2, 26, C, K.PIEDRA, { aux: aPie, techo: C2 });
    const cen = [[-7.3, -38.6], [7.3, -38.6], [7.2, 26], [6.1, 28.8], [4.3, 31.3], [1.7, 32.6], [-1.6, 32.7], [-4.7, 31.1], [-6.4, 28.8], [-7, 26]];
    L.prisma(B, cen, 25, 32.5, C, K.PIEDRA, { aux: aPie, techo: C2 });
    L.cubierta(B, 0, -6, 32.5, 14.6, 64, 1.6, { col: [150, 124, 100] });
    // contrafuertes macizos en los costados y sobre las naves laterales
    for (let z = -30; z <= 22; z += 8.6) for (const s of [-1, 1]) {
      L.caja(B, s * 13.6, z, -2, 1.6, 2.4, 27.5, 0, C, K.PIEDRA, { aux: aPie });
      L.caja(B, s * 8.1, z, 25, 1.8, 2, 6.5, 0, C2, K.PIEDRA); }
    // fachada: contrafuertes, portada apuntada, rosetón y galería
    for (const x of [-7.8, 7.8]) L.caja(B, x, -39.3, -2, 2.2, 1.6, 30, 0, C2, K.PIEDRA, { aux: aPie });
    L.extruir(B, apuntado(5.5, -1, 7.5, 12.5), -38.9, -38.6, OSCURO, K.LISO);
    roseton(B, 0, 20.5, -38.75, 4.6, -1, C);
    L.caja(B, 0, -39, 29, 14, 0.9, 1.2, 0, C2, K.PIEDRA);
    // campanarios octogonales esbeltos, con remate plano y huecos en los dos cuerpos altos
    for (const x of [-15, 15]) {
      torreOct(B, x, -36, -2, 34, 3.1, C, [[27, 32.5]]);
      L.tambor(B, x, -36, 34, 35, 3.5, { lados: 8, col: C2, k: K.PIEDRA });
      torreOct(B, x, -36, 35, 41, 2.7, C, [[36, 39.8]]);
      L.tambor(B, x, -36, 41, 42, 3, { lados: 8, col: C2, k: K.PIEDRA }); }
  } });

// Arc de Triomf. Silueta: arco de 29 m de alto y 29,5 de ancho, un solo vano de medio punto, a lo largo del passeig de
// Lluís Companys (el paso mira al 133°). Rasgos: ladrillo rojo neomudéjar; friso de piedra clara sobre el vano; remate
// almenado con cuatro pináculos en las esquinas rematados con bolas doradas.
add({ id: 'arc_triomf', nombre: 'Arc de Triomf', nivel: 'A', x: 13099.5, z: 14491.5, rot: 133, alto: 29.5, ancho: 29.5, largo: 10.4,
  noche: 'focos', edificios: [118700, 119009, 119010],
  build(B, h, L) {
    const W = 29.5, D = 10, LAD = [164, 80, 58], LAD2 = [138, 64, 48], PIE = [206, 186, 152], ORO = [206, 168, 84];
    const aL = L.aux.ladrillo(0.3, 0.6), aP = L.aux.piedra(0.55, 1.1);
    // cuerpo: arco de medio punto de 10,5 m de luz con la clave a 20 m (arranca 1 m bajo tierra por si hay pendiente)
    L.arco(B, 0, 0, -1, W, D, 24.5, 10.5, 21, { col: LAD, k: K.LADRILLO, aux: aL, pasos: 14 });
    // zócalo de piedra en los dos machones
    for (const s of [-1, 1]) L.caja(B, s * 10, 0, -1, 9.8, D + 0.5, 3.2, 0, PIE, K.PIEDRA, { aux: aP });
    // rosca del arco en piedra, por las dos caras
    const rosca = []; const ro = 5.95, ri = 5.25, ys = 20 - 5.25;
    for (let i = 0; i <= 12; i++) { const t = Math.PI * i / 12; rosca.push([Math.cos(t) * ro, ys + Math.sin(t) * ro]); }
    for (let i = 12; i >= 0; i--) { const t = Math.PI * i / 12; rosca.push([Math.cos(t) * ri, ys + Math.sin(t) * ri]); }
    for (const d of [D / 2 - 0.05, -D / 2 - 0.3]) L.extruir(B, rosca, d, d + 0.35, PIE, K.PIEDRA, { aux: aP });
    // friso de piedra clara sobre el vano y cornisa
    L.caja(B, 0, 0, 20.6, W + 0.4, D + 0.6, 2.8, 0, PIE, K.PIEDRA, { aux: aP });
    L.caja(B, 0, 0, 23.4, W + 0.9, D + 1.1, 0.6, 0, [190, 170, 140], K.PIEDRA);
    // ático de ladrillo y almenas escalonadas
    L.caja(B, 0, 0, 24, W, D, 2.2, 0, LAD2, K.LADRILLO, { aux: aL });
    for (const [x0, z0, x1, z1, n] of [[-W / 2, -D / 2, W / 2, -D / 2, 12], [-W / 2, D / 2, W / 2, D / 2, 12], [-W / 2, -D / 2, -W / 2, D / 2, 4], [W / 2, -D / 2, W / 2, D / 2, 4]])
      for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
        L.caja(B, x, z, 26.2, 0.9, 0.9, 1.3, 0, LAD, K.LADRILLO); L.caja(B, x, z, 27.5, 0.5, 0.5, 0.5, 0, LAD, K.LADRILLO); }
    // cuatro pináculos en las esquinas: pilastra, templete de piedra, cupulín y bola dorada
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * (W / 2 - 0.9), z = sz * (D / 2 - 0.9);
      L.caja(B, x, z, -1, 2.4, 2.4, 28.2, 0, LAD2, K.LADRILLO, { aux: aL });
      L.tambor(B, x, z, 28.2, 29.6, 1.05, { lados: 8, col: PIE, k: K.PIEDRA });
      L.cupula(B, x, z, 29.6, 1.15, 1.1, { lados: 8, anillos: 3, col: ORO, k: K.METAL });
      L.esfera(B, x, 31.2, z, 0.5, { gajos: 8, anillos: 5, col: ORO, k: K.METAL });
    }
  } });

// ================================================================== NIVEL B

// Santa Maria del Pi: nave gótica única con gran rosetón en la fachada (−Z de la nave) y campanario octogonal macizo de
// 54 m junto a la cabecera. La nave va girada −7,6° en el marco del catálogo (su eje real); el anexo bajo se rehace.
add({ id: 'santa_maria_pi', nombre: 'Santa Maria del Pi', nivel: 'B', x: 12526.1, z: 13492.3, rot: 135, alto: 54, ancho: 40, largo: 64,
  noche: 'focos', edificios: [81910, 82725, 82726, 82727],
  build(B, h, L) {
    const C = [186, 168, 136], C2 = [160, 146, 118];
    const v0 = B.nv;
    L.nave(B, { ancho: 21, largo: 46, alto: 25, col: C, k: K.PIEDRA, aux: aPie, tejado: [150, 132, 110] });
    L.caja(B, 0, -23.4, -2, 21, 1.2, 29, 0, C, K.PIEDRA, { aux: aPie });                      // hastial de la fachada
    L.extruir(B, apuntado(4.5, -1, 6, 10), -24.3, -24, OSCURO, K.LISO);
    roseton(B, 0, 17, -24.1, 4.8, -1, C);
    for (let z = -16; z <= 16; z += 8) for (const s of [-1, 1]) L.caja(B, s * 11.2, z, -2, 1.4, 2, 26, 0, C2, K.PIEDRA);
    L.xf(B, v0, -17, -9, -7.6);
    // campanario octogonal
    torreOct(B, 2.2, 17.5, -2, 50, 4.6, C, [[40, 47]]);
    L.tambor(B, 2.2, 17.5, 50, 51.5, 5, { lados: 8, col: C2, k: K.PIEDRA });
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * 2 * Math.PI; pinaculo(B, 2.2 + Math.sin(a) * 4.5, 17.5 + Math.cos(a) * 4.5, 51.5, 2.6, 0.5, C); }
    // anexos bajos (rectoría y sacristía) con la planta de los datos
    L.prisma(B, [[-6, -13], [4, -4], [7.9, 9.8], [27.2, 4.7], [30.4, 14.1], [20.4, 19.5], [8.5, 21.8], [-1, 13], [-10.7, 10.4]], -1.5, 10, [196, 182, 156], K.LISO,
      { techo: [150, 120, 100] });
  } });

// Basílica de la Mercè: nave barroca con cúpula y, encima, la gran estatua de la Mercè. Encaje dudoso: los datos no tienen
// la basílica (manzana de volúmenes bajos); la nave va a lo largo del volumen #83406 y la cúpula sobre #83401.
add({ id: 'merce', nombre: 'Basílica de la Mercè', nivel: 'B', x: 12997.7, z: 13215.9, rot: 135, alto: 48, ancho: 30, largo: 56,
  noche: 'focos', edificios: [83406, 83401],
  build(B, h, L) {
    const C = [206, 186, 146], C2 = [172, 160, 138], BR = [96, 92, 82];
    const v0 = B.nv;
    L.nave(B, { ancho: 18, largo: 46, alto: 20, col: C, k: K.PIEDRA, aux: aPie, tejado: [160, 96, 70], abside: false });
    // fachada barroca con remate curvo
    const pf = [[-10, -2], [10, -2], [10, 22]]; for (let i = 0; i <= 8; i++) { const t = i / 8 * Math.PI; pf.push([Math.cos(t) * 10 * (i === 0 || i === 8 ? 1 : 0.9), 22 + Math.sin(t) * 5]); } pf.push([-10, 22]);
    L.extruir(B, pf, -24.2, -22.4, C, K.PIEDRA, { aux: aPie });
    L.extruir(B, [[-2.4, -1], [2.4, -1], [2.4, 6], [0, 8.4], [-2.4, 6]], -24.5, -24.2, OSCURO, K.LISO);
    // cúpula sobre tambor, linterna y estatua
    L.tambor(B, 0, 13, 18, 28, 8.4, { lados: 16, col: C, k: K.PIEDRA, aux: aPie });
    L.cupula(B, 0, 13, 28, 8.4, 8.5, { lados: 16, anillos: 5, col: C2, k: K.PIEDRA });
    L.tambor(B, 0, 13, 36, 40, 1.7, { lados: 8, col: C, k: K.PIEDRA });
    L.rev(B, L.F0, 0, 13, [[1.3, 40], [1.15, 43.5], [0.9, 45], [0.4, 46], [0.01, 46.1]], 8, BR, K.METAL);
    L.esfera(B, 0, 46.6, 13, 0.55, { gajos: 6, anillos: 4, col: BR, k: K.METAL });
    L.bar(B, [0, 45.6, 13], [0, 47.8, 13.4], 0.2, BR, K.METAL);
    L.xf(B, v0, -12, 3, 85);
  } });

// Cascada de la Ciutadella: monumento en U abierto al sur, con rampas laterales que suben hacia el centro, un arco
// triunfal con columnas y, encima, la cuadriga dorada; agua que cae del centro al estanque. Ejes del mundo (rot 0).
add({ id: 'cascada', nombre: 'Cascada de la Ciutadella', nivel: 'B', x: 13591.8, z: 14361.9, rot: 0, alto: 32, ancho: 81, largo: 85,
  noche: 'focos', edificios: [99108, 99109],
  build(B, h, L) {
    const C = [204, 184, 140], ROC = [150, 134, 108], ORO = [210, 172, 86];
    const U = [[-41, -42], [-35, -42], [-35, -29], [-15, -30], [-15, -4], [-9, 5], [6, 5], [13, -3], [13, -31], [33, -31], [33, -43], [40, -42], [40, -23],
      [27, -23], [27, 2], [14, 15], [10, 16], [-11, 16], [-14, 15], [-27, 1], [-28, -22], [-40, -22]];
    L.prisma(B, U, -1.5, (x) => Math.max(2.5, Math.min(9, 12 - Math.abs(x) * 0.25)), C, K.PIEDRA, { aux: aPie });
    // roca de la que sale la cascada y estanque dentro de la U
    L.caja(B, -1, 1, -1.5, 22, 8, 8.5, 0, ROC, K.PIEDRA, { aux: L.aux.piedra(1.2, 2.2) });
    L.q4(B, [-6, 6.5, -3.1], [4, 6.5, -3.1], [5, 0.5, -9], [-7, 0.5, -9], [150, 180, 190], K.AGUA);
    L.poly(B, [[-14, 0.4, -29], [12, 0.4, -29], [12, 0.4, -5], [-14, 0.4, -5]], [80, 110, 115], K.AGUA);
    // cuerpo central: arco con columnas, ático y cuerpo trasero
    L.caja(B, -0.5, 26, -1.5, 17, 30, 16, 0, ROC, K.PIEDRA, { aux: aPie });
    L.arco(B, -0.5, 9, 8, 32, 8, 18, 10, 14.5, { col: C, k: K.PIEDRA, aux: aPie, pasos: 10 });
    L.caja(B, -0.5, 12.5, 8, 10, 1, 13, 0, [80, 76, 70], K.PIEDRA);
    for (const [x0, x1] of [[-14.5, -7.5], [6.5, 13.5]]) L.columnata(B, x0, 4.3, x1, 4.3, 8, 15, 2, 0.75, { col: C, entablamento: 1.4 });
    L.caja(B, -0.5, 9, 26, 20, 6, 2.6, 0, C, K.PIEDRA, { aux: aPie });
    // cuadriga dorada
    L.caja(B, -0.5, 9, 28.6, 6.5, 5, 1, 0, C, K.PIEDRA);
    for (const x of [-2.6, -1.1, 0.1, 1.6]) { L.caja(B, x, 7.6, 29.6, 0.7, 2.3, 1.6, 0, ORO, K.METAL); L.caja(B, x, 6.3, 30.6, 0.45, 0.9, 1.3, 0, ORO, K.METAL); }
    L.caja(B, -0.5, 10.1, 29.6, 2.6, 1.4, 1.4, 0, ORO, K.METAL);
    L.aguja(B, -0.5, 10.5, 30.6, 2.8, 0.45, { lados: 6, pasos: 3, recto: 0.6, col: ORO, k: K.METAL });
    L.bar(B, [-0.5, 32.6, 10.5], [-0.2, 34.2, 9.6], 0.12, ORO, K.METAL);
  } });

// Parlament de Catalunya (antiguo arsenal): palacio ocre de dos plantas con patios, cuerpo transversal más alto y salón
// central octogonal con cúpula baja. Plantas de los datos.
add({ id: 'parlament', nombre: 'Parlament de Catalunya', nivel: 'B', x: 13788.2, z: 14167.7, rot: 148, alto: 20, ancho: 72, largo: 98,
  noche: 'focos', edificios: [102656, 102658, 102659, 102660, 102662, 102663, 102665, 102666, 102667, 102668, 102669, 102670, 102671, 102672, 102676],
  build(B, h, L) {
    const C = [214, 194, 152], CO = [236, 226, 206], aV = L.aux.ventanas(4.6, 3.4, 0.4, 0.55);
    const R = [[-35, -11, -1, 23, 14], [-11, 4, -21, 43, 14], [20, 36, -28, 49, 14], [-36, 36, -28, -16, 14], [-16, -11, -16, -1, 14], [4, 20, 4, 19, 14],
      [-35, -11, 4, 18, 17], [-35, -30, 23, 37, 14], [4, 21, 18, 37, 17], [-36, -29, -16, -1, 14], [-16, -11, 23, 37, 14], [4, 20, -16, 4, 14],
      [20, 36, 4, 18, 17], [-36, -27, -49, -28, 7]];
    for (const [x0, x1, z0, z1, a] of R) {
      L.caja(B, (x0 + x1) / 2, (z0 + z1) / 2, -1.5, x1 - x0, z1 - z0, a + 1.5, 0, C, K.VENTANAS, { aux: aV, techo: [176, 160, 136] });
      L.caja(B, (x0 + x1) / 2, (z0 + z1) / 2, a - 0.2, x1 - x0 + 0.8, z1 - z0 + 0.8, 0.7, 0, CO, K.PIEDRA); }
    L.prisma(B, [[3, 8], [4, 14], [0, 18], [-6, 18], [-10, 14], [-10, 8], [-6, 4], [-1, 4]], -1.5, 18, C, K.PIEDRA, { aux: aPie });
    L.cupula(B, -3, 11, 18, 5.6, 3.2, { lados: 8, anillos: 3, col: [120, 128, 132], k: K.METAL, linterna: { r: 1, alto: 2.4 } });
  } });

// Estació de França: dos grandes naves curvas de hierro y vidrio (rectas y luego en curva hacia el +Z) y el edificio de
// viajeros clasicista en la cabecera (−Z). Plantas de los datos.
add({ id: 'estacio_franca', nombre: 'Estació de França', nivel: 'B', x: 13566.5, z: 13708.6, rot: 114, alto: 30, ancho: 137, largo: 235,
  noche: 'ventanas', edificios: [99155, 99156, 99157, 102640, 102641],
  build(B, h, L) {
    const C = [216, 204, 180], M = [138, 146, 154], aV = L.aux.ventanas(5, 4, 0.45, 0.6), aM = L.aux.panel(2.4, 0.25, 0.3);
    // edificio de viajeros, alas laterales y pabellón central
    L.prisma(B, [[-68, -99], [54, -118], [55, -117], [60, -80], [-68, -80]], -1.5, 18, C, K.VENTANAS, { aux: aV, techo: [170, 160, 146] });
    L.caja(B, -4, -95, 17, 34, 22, 6, 6, C, K.VENTANAS, { aux: aV });
    L.cubierta(B, -4, -95, 23, 34, 22, 4, { tipo: 'cuatro', ang: 6, col: [110, 116, 122], k: K.METAL });
    L.prisma(B, [[44, -80], [60, -80], [68, -32], [68, 26], [44, 26]], -1.5, 11, C, K.VENTANAS, { aux: aV });
    L.prisma(B, [[-68, -80], [-50, -80], [-50, 37], [-68, 37]], -1.5, 11, C, K.VENTANAS, { aux: aV });
    // dos naves de bóveda: tramo recto y tres tramos en curva
    const nave = (x0, z0, x1, z1, w) => { const ang = Math.atan2(x1 - x0, z1 - z0) * 180 / Math.PI, l = Math.hypot(x1 - x0, z1 - z0) + 2, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      L.caja(B, cx, cz, -1.5, w, l, 12.5, ang, M, K.METAL, { aux: aM, sinTecho: true });
      L.cubierta(B, cx, cz, 11, w, l, w * 0.38, { tipo: 'boveda', ang, col: [150, 158, 166], k: K.METAL, aux: aM }); };
    for (const P of [[[-27, -80], [-27, 26], [-31, 56], [-37, 85], [-45, 112]], [[20, -80], [20, 26], [15, 55], [6, 86], [-7, 116]]])
      for (let i = 0; i + 1 < P.length; i++) nave(P[i][0], P[i][1], P[i + 1][0], P[i + 1][1], i === 0 ? 46 : 44 - i * 2);
  } });

// Mercat de Santa Caterina: muros del mercado antiguo y la gran cubierta ondulada de cerámica de colores.
add({ id: 'santa_caterina', nombre: 'Mercat de Santa Caterina', nivel: 'B', x: 12919.2, z: 13948.3, rot: 129, alto: 20, ancho: 70, largo: 86,
  noche: 'nada', edificios: [100070],
  build(B, h, L) {
    const W = 70, D = 86, NX = 10, NZ = 14, PAL = [[63, 143, 63], [224, 128, 58], [232, 197, 71], [196, 82, 52], [86, 160, 110], [240, 168, 60]];
    L.caja(B, 0, 0, -1.5, W, D, 9.5, 0, [226, 216, 194], K.VENTANAS, { aux: L.aux.ventanas(8, 5.4, 0.62, 0.72), sinTecho: true });
    const Y = (x, z) => 13 + 3.6 * Math.sin(z / D * Math.PI * 3 + 0.6) * (0.75 + 0.25 * Math.cos(x / W * Math.PI)) + 1.5 * Math.cos(x / W * Math.PI);
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
      const x0 = -W / 2 + W * i / NX, x1 = x0 + W / NX, z0 = -D / 2 + D * j / NZ, z1 = z0 + D / NZ, c = PAL[(i * 7 + j * 3 + ((i * j) % 4)) % PAL.length];
      L.q4(B, [x0, Y(x0, z0), z0], [x1, Y(x1, z0), z0], [x1, Y(x1, z1), z1], [x0, Y(x0, z1), z1], c, K.TRENCADIS); }
    // faldón entre los muros y la cubierta (estructura de madera y acero)
    const F = [96, 84, 70];
    for (let i = 0; i < NX; i++) for (const z of [-D / 2, D / 2]) { const x0 = -W / 2 + W * i / NX, x1 = x0 + W / NX; L.q4(B, [x0, 8, z], [x1, 8, z], [x1, Y(x1, z), z], [x0, Y(x0, z), z], F, K.METAL); }
    for (let j = 0; j < NZ; j++) for (const x of [-W / 2, W / 2]) { const z0 = -D / 2 + D * j / NZ, z1 = z0 + D / NZ; L.q4(B, [x, 8, z0], [x, 8, z1], [x, Y(x, z1), z1], [x, Y(x, z0), z0], F, K.METAL); }
  } });

// Mercat de la Boqueria: nave metálica con tres cubiertas y, a La Rambla (+Z), la portada modernista de hierro: gran arco
// con vidriera de colores en el tímpano.
add({ id: 'boqueria', nombre: 'Mercat de la Boqueria', nivel: 'B', x: 12324.6, z: 13473.3, rot: 59, alto: 19, ancho: 40, largo: 97,
  noche: 'nada', edificios: [79055, 79057, 79058],
  build(B, h, L) {
    const V = [86, 120, 98], V2 = [70, 98, 82];
    L.caja(B, 0, 0, -1.5, 40, 96, 10, 0, V, K.METAL, { aux: L.aux.panel(2, 0.2, 0.35), sinTecho: true });
    for (const x of [-13.33, 0, 13.33]) L.cubierta(B, x, 0, 8.5, 13.4, 96, 3.6, { col: [120, 130, 128], k: K.METAL, colHastial: V2, kHastial: K.METAL });
    // portada: dos pilares, arco de hierro y tímpano de vidriera
    const z = 48.6, ar = []; for (let i = 0; i <= 14; i++) { const t = Math.PI * i / 14; ar.push([Math.cos(t) * 9.4, 10 + Math.sin(t) * 9.4]); }
    for (let i = 14; i >= 0; i--) { const t = Math.PI * i / 14; ar.push([Math.cos(t) * 7.8, 10 + Math.sin(t) * 7.8]); }
    L.extruir(B, ar, z, z + 1.2, V2, K.METAL);
    const ti = []; for (let i = 0; i <= 14; i++) { const t = Math.PI * i / 14; ti.push([Math.cos(t) * 7.8, 10 + Math.sin(t) * 7.8]); }
    L.extruir(B, ti, z + 0.4, z + 0.7, [232, 200, 120], K.TRENCADIS);
    for (const s of [-1, 1]) L.caja(B, s * 8.6, z + 0.6, -1.5, 1.6, 1.6, 11.5, 0, V2, K.METAL);
    L.caja(B, 0, z + 0.6, 9.4, 17.4, 1, 0.6, 0, V2, K.METAL);
  } });

// MACBA: volumen blanco de Richard Meier; a la plaça dels Àngels (+X), el atrio acristalado de las rampas bajo una visera
// horizontal, el cilindro blanco junto a la entrada y la torre blanca en el extremo.
add({ id: 'macba', nombre: 'MACBA', nivel: 'B', x: 11931.4, z: 13620.2, rot: 59, alto: 26, ancho: 47, largo: 109,
  noche: 'nada', edificios: [94812],
  build(B, h, L) {
    const BL = [240, 240, 236], aL = L.aux.liso(1.6);
    L.caja(B, -4.5, 0, -2, 37, 108, 22, 0, BL, K.LISO, { aux: aL });
    L.caja(B, 18.5, 12, -2, 9, 76, 21, 0, [190, 204, 214], K.CORTINA, { aux: L.aux.cortina(4.2, 1.6, 0.1) });
    for (let i = 0; i < 4; i++) L.q4(B, [15, 1 + i * 5, -20 + i * 4], [22, 1 + i * 5, -20 + i * 4], [22, 6 + i * 5, 44 - i * 4], [15, 6 + i * 5, 44 - i * 4], BL, K.LISO); // rampas tras el vidrio
    L.caja(B, 19.5, 12, 21, 12, 78, 0.8, 0, BL, K.LISO);
    L.tambor(B, 16.5, -32, -2, 18, 7, { lados: 20, col: BL, k: K.LISO });
    L.caja(B, 13, 47, -2, 12, 12, 27, 0, BL, K.VENTANAS, { aux: L.aux.ventanas(4, 4, 0.3, 0.4) });
  } });

// Drassanes Reials: naves góticas paralelas con cubiertas de teja a dos aguas (plantas de los datos).
add({ id: 'drassanes', nombre: 'Drassanes Reials', nivel: 'B', x: 12707.4, z: 12755.4, rot: 115, alto: 16, ancho: 116, largo: 117,
  noche: 'focos', edificios: [63075, 63076, 63077, 63079, 63080, 63083, 63084, 63088, 63090, 63091, 63092, 63093, 63094, 79062],
  build(B, h, L) {
    const C = [184, 166, 136], TJ = [176, 88, 60];
    const N = [[-58, -45, -29, 35], [-46, -33, -29, 35], [-33, -20.5, -4, 35], [-20.5, -6.5, -5, 58], [-6.5, 3, -59, 58], [3, 12, -59, 58], [12, 30, -58, 58.5],
      [30, 39.5, -58, 59], [39.5, 48, -58, 59], [48, 58, -58, 59]];
    for (const [x0, x1, z0, z1] of N) { const w = x1 - x0, al = w > 15 ? 10 : 8;
      L.caja(B, (x0 + x1) / 2, (z0 + z1) / 2, -1.5, w, z1 - z0, al + 1.5, 0, C, K.PIEDRA, { aux: aPie, sinTecho: true });
      L.cubierta(B, (x0 + x1) / 2, (z0 + z1) / 2, al, w, z1 - z0, w * 0.36, { col: TJ, colHastial: C, kHastial: K.PIEDRA }); }
  } });

// El Born CCM (antiguo mercado): nave central y naves laterales de hierro con cubiertas de cinc, nave transversal y la
// linterna octogonal en el cruce.
add({ id: 'born_ccm', nombre: 'El Born CCM (antic mercat)', nivel: 'B', x: 13357.9, z: 13910.8, rot: 135, alto: 27, ancho: 60, largo: 138,
  noche: 'nada', edificios: [99110, 99111, 99158, 99159, 99160, 99161, 99162, 99163, 99164, 99165, 99166, 99167, 99168, 99169, 99170, 99171, 99172,
    99173, 99174],
  build(B, h, L) {
    const HI = [84, 100, 96], ZN = [128, 138, 140], aM = L.aux.panel(1.8, 0.15, 0.45);
    for (const s of [-1, 1]) { L.caja(B, s * 22.5, 0, -1.5, 15, 138, 9, 0, HI, K.METAL, { aux: aM, sinTecho: true });
      L.cubierta(B, s * 22.5, 0, 7.5, 15, 138, 3.2, { col: ZN, k: K.METAL, colHastial: HI, kHastial: K.METAL }); }
    L.caja(B, 0, 0, -1.5, 30, 134, 12.5, 0, HI, K.METAL, { aux: aM, sinTecho: true });
    L.cubierta(B, 0, 0, 11, 30, 134, 5.5, { col: ZN, k: K.METAL, colHastial: HI, kHastial: K.METAL });
    L.caja(B, 0, 0, -1.5, 60, 26, 12.5, 0, HI, K.METAL, { aux: aM, sinTecho: true });
    L.cubierta(B, 0, 0, 11, 26, 60, 5.5, { ang: 90, col: ZN, k: K.METAL, colHastial: HI, kHastial: K.METAL });
    L.tambor(B, 0, 0, 14, 19.5, 12.5, { lados: 8, col: HI, k: K.METAL, aux: L.aux.panel(1.6, 0.1, 0.6), sinTapa: true });
    L.rev(B, L.F0, 0, 0, [[13.2, 19.5], [9, 22.5], [3, 24.5], [0.01, 24.6]], 8, ZN, K.METAL);
    L.tambor(B, 0, 0, 24, 26, 2.2, { lados: 8, col: HI, k: K.METAL });
    L.aguja(B, 0, 0, 26, 1.8, 2.3, { lados: 8, pasos: 2, pot: 1, exp: 1, col: ZN, k: K.METAL });
  } });

// Edifici de la Duana (1902): palacio de piedra ocre junto al muelle, con torres de esquina rematadas por cúpulas verdes.
add({ id: 'duana', nombre: 'Edifici de la Duana', nivel: 'B', x: 12889, z: 12537.7, rot: 122, alto: 30, ancho: 32, largo: 73,
  noche: 'focos', edificios: [64248],
  build(B, h, L) {
    const C = [214, 194, 152], VC = [94, 130, 108];
    L.prisma(B, [[15.9, -36.3], [15.7, -11.8], [0.3, -11.8], [-0.1, 36.2], [-16, 36.2], [-15.4, -36.4]], -1.5, 20, C, K.VENTANAS,
      { aux: L.aux.ventanas(5, 3.6, 0.45, 0.6), techo: [170, 156, 132] });
    for (const [x, z] of [[-13, -33.5], [13, -33.5], [13, -14.5], [-13, 33.5], [-2.5, 33.5]]) {
      L.tambor(B, x, z, 18, 25, 3.4, { lados: 8, col: C, k: K.PIEDRA, aux: aPie });
      L.cupula(B, x, z, 25, 3.6, 4.2, { lados: 8, anillos: 3, col: VC, k: K.METAL, linterna: { r: 0.6, alto: 1.8 } }); }
    L.caja(B, 0, -24, 20, 10, 8, 3, 0, C, K.PIEDRA);
    L.cupula(B, 0, -24, 23, 4.5, 4.5, { lados: 12, anillos: 4, col: VC, k: K.METAL });
  } });

// Edifici de Correus (Via Laietana / Pg. de Colom): bloque noucentista con cuatro torres de esquina con cúpula.
add({ id: 'correus', nombre: 'Edifici de Correus', nivel: 'B', x: 13138.9, z: 13444.6, rot: 45, alto: 36, ancho: 50, largo: 52,
  noche: 'focos', edificios: [83131, 83133, 83134, 83135, 83136, 84258],
  build(B, h, L) {
    const C = [218, 206, 182], CP = [118, 134, 138];
    L.prisma(B, [[-27, 17.5], [-17.5, -26.3], [17.5, -22], [21.5, -11], [14.3, 18.5], [8.5, 25], [-5.7, 17.5]], -1.5, 24, C, K.VENTANAS,
      { aux: L.aux.ventanas(4.6, 3.4, 0.42, 0.6), techo: [176, 166, 150] });
    L.prisma(B, [[-25.5, 16.2], [-16.6, -24.6], [16.5, -20.6], [20.1, -10.6], [13.2, 17.4], [8, 23.4], [-5.4, 16.2]], 24, 25.2, [236, 228, 210], K.PIEDRA);
    for (const [x, z] of [[17.5, -18.5], [8.5, 22], [-24.5, 15.5], [-17, -23.5]]) {
      L.tambor(B, x, z, -1.5, 30, 4.4, { lados: 12, col: C, k: K.VENTANAS, aux: L.aux.ventanas(4.6, 2.8, 0.4, 0.6) });
      L.tambor(B, x, z, 30, 31, 4.8, { lados: 12, col: [236, 228, 210], k: K.PIEDRA });
      L.cupula(B, x, z, 31, 4.4, 4.6, { lados: 12, anillos: 4, col: CP, k: K.METAL, linterna: { r: 0.7, alto: 2 } }); }
  } });

// Plaça de Sant Jaume: Palau de la Generalitat (al noroeste, −Z) y Casa de la Ciutat (al sureste, +Z) enfrentados. Los
// volúmenes de los datos recogen también partes de las manzanas vecinas, así que NO se ocultan: se retocan (piedra, sin
// fachada de vivienda, 19 m) y se añaden las dos fachadas a la plaza. Generalitat: renacentista, con columnas pareadas y
// frontón sobre la portada. Ajuntament: neoclásica, con pórtico de cuatro columnas y balaustrada.
add({ id: 'sant_jaume', nombre: 'Palau de la Generalitat i Casa de la Ciutat', nivel: 'B', x: 12786.3, z: 13550.5, rot: 135, alto: 24,
  ancho: 60, largo: 90, noche: 'focos', edificios: [79132, 79133, 79139, 82748, 82750, 82751, 82752, 82753, 82754],
  ocultar: false, fachada: false, retoque: { color: '#c6b28c', alto: 19 },
  build(B, h, L) {
    const C = [204, 186, 146], C2 = [180, 164, 130];
    const fachada = (cx, cz, dir, w, alto) => {                     // dir: +1 mira a +Z, −1 a −Z
      const y0 = Math.min(h.y(cx - w / 2, cz), h.y(cx + w / 2, cz), h.y(cx, cz)) - 1.5, f = cz + dir * 0.6;
      L.caja(B, cx, cz, y0, w, 1.2, alto - y0, 0, C, K.VENTANAS, { aux: L.aux.ventanas(5.2, 3.6, 0.4, 0.55) });
      L.caja(B, cx, f + dir * 0.1, alto - 0.2, w + 0.8, 1.2, 0.8, 0, C2, K.PIEDRA);
      L.extruir(B, [[cx - 2.2, y0], [cx + 2.2, y0], [cx + 2.2, h.y(cx, cz) + 5.5], [cx, h.y(cx, cz) + 7.6], [cx - 2.2, h.y(cx, cz) + 5.5]], f, f + dir * 0.25, OSCURO, K.LISO);
      return { y: h.y(cx, cz), f };
    };
    // Generalitat (mira a la plaza, +Z)
    const g = fachada(-9, -31.4, 1, 30, 20);
    for (const dx of [-5, -3.6, 3.6, 5]) { L.tambor(B, -9 + dx, g.f + 0.6, g.y - 1.5, g.y + 9, 0.5, { lados: 8, col: C, k: K.PIEDRA });
      L.tambor(B, -9 + dx, g.f + 0.6, g.y + 10, g.y + 16.5, 0.42, { lados: 8, col: C, k: K.PIEDRA }); }
    L.caja(B, -9, g.f + 0.7, g.y + 9, 12, 1.6, 1, 0, C2, K.PIEDRA);
    L.extruir(B, [[-15.5, g.y + 16.5], [-2.5, g.y + 16.5], [-9, g.y + 20.5]], g.f, g.f + 1.2, C, K.PIEDRA);
    // Casa de la Ciutat (mira a la plaza, −Z)
    const a = fachada(-15, 10.8, -1, 30, 19);
    for (const dx of [-5.4, -1.8, 1.8, 5.4]) L.tambor(B, -15 + dx, a.f - 0.7, a.y + 5.5, a.y + 15.5, 0.55, { lados: 8, col: C, k: K.PIEDRA });
    L.caja(B, -15, a.f - 0.7, a.y - 1.5, 13, 2, 7, 0, C2, K.PIEDRA);
    L.caja(B, -15, a.f - 0.7, a.y + 15.5, 13, 2, 1.4, 0, C2, K.PIEDRA);
    for (let i = 0; i <= 10; i++) L.caja(B, -21 + i * 1.2, a.f - 0.2, 19.6, 0.35, 0.35, 1.1, 0, C, K.PIEDRA);
  } });

// Torres del telefèric del port: celosías de acero con la sala de máquinas arriba.
// Torre Jaume I (107 m, en el Moll de Barcelona): estación a 70 m y celosía más fina hasta la sala alta.
add({ id: 'torre_jaume_i', nombre: 'Torre Jaume I', nivel: 'B', x: 13034.9, z: 12386.5, rot: 123, alto: 107, ancho: 12, largo: 12,
  noche: 'focos', edificios: [64247, 64319, 64320, 64321, 64322, 64323, 64324],
  build(B, h, L) {
    const AC = [122, 104, 88], GR = [200, 196, 188];
    L.caja(B, 0, 0, -1.5, 11, 11, 7.5, 0, [170, 166, 158], K.LISO);
    celosia(B, 6, 70, 5.2, 3, 10, AC, 0.22);
    L.caja(B, 0, 0, 70, 12, 12, 7, 0, [150, 164, 176], K.CORTINA, { aux: L.aux.cortina(3.5, 1.5, 0.15), techo: GR });
    L.caja(B, 0, 0, 77, 13, 13, 0.8, 0, AC, K.METAL);
    celosia(B, 77.8, 98, 2.6, 1.8, 3, AC, 0.18);
    L.caja(B, 0, 0, 98, 6.5, 6.5, 5, 0, [150, 164, 176], K.CORTINA, { aux: L.aux.cortina(2.5, 1.3, 0.15), techo: GR });
    L.mastil(B, 0, 0, 103, 4.5, 0.3, { col: AC });
  } });

// Torre Sant Sebastià (78 m, en la Barceloneta): celosía hasta el restaurante cilíndrico de arriba.
add({ id: 'torre_sant_sebastia', nombre: 'Torre Sant Sebastià', nivel: 'B', x: 13679.8, z: 12501.5, rot: 90, alto: 78, ancho: 14, largo: 14,
  noche: 'focos', edificios: [64416, 64417, 64418],
  build(B, h, L) {
    const AC = [122, 104, 88], GR = [200, 196, 188];
    L.caja(B, 0, 0, -1.5, 9, 9, 5, 0, [170, 166, 158], K.LISO);
    celosia(B, 3.5, 66, 3.6, 2.2, 9, AC, 0.2);
    L.tambor(B, 0, 0, 66, 67, 4.5, { lados: 12, col: AC, k: K.METAL });
    L.tambor(B, 0, 0, 67, 74.5, 6.6, { lados: 16, col: [150, 164, 176], k: K.CORTINA, aux: L.aux.cortina(3.7, 1.4, 0.15) });
    L.tambor(B, 0, 0, 74.5, 75.6, 7, { lados: 16, col: GR, k: K.METAL });
    L.mastil(B, 0, 0, 75.6, 2.8, 0.3, { col: AC });
  } });

// El Cap de Barcelona (Lichtenstein): cabeza de 14 m de perfil, plana como una viñeta, de cerámica de colores. Movido
// unos 90 m hacia el mar respecto al catálogo (la coordenada de memoria caía dentro de una manzana): en el paseo del
// Moll de la Fusta, al otro lado de la calzada del Passeig de Colom, fuera de la arboleda.
add({ id: 'cap_barcelona', nombre: 'El Cap de Barcelona', nivel: 'B', x: 13181, z: 13304, rot: 135, alto: 14, ancho: 8, largo: 4,
  noche: 'focos', edificios: [],
  build(B, h, L) {
    L.caja(B, 0, 0, -1.5, 5, 3.2, 2, 0, [190, 186, 178], K.LISO);
    const cab = [[-2.6, 0.5], [2.4, 0.5], [2.2, 2.6], [1.6, 4.2], [2.7, 5.6], [3.6, 6.8], [3.3, 7.4], [3.9, 8.2], [3.1, 8.9], [3.3, 10.4], [2.4, 12.4],
      [0.3, 14], [-2.2, 13.4], [-3.6, 11], [-3.4, 8], [-2.4, 6], [-3, 3.5]];
    L.extruir(B, cab, -0.9, 0.9, [242, 238, 228], K.TRENCADIS);
    L.extruir(B, [[-3.7, 9.5], [-2.3, 13.5], [0.3, 14.1], [1.6, 13.6], [-0.8, 11.8], [-1.8, 9.2]], -1.05, 1.05, [228, 196, 64], K.LISO);
    L.extruir(B, [[2.6, 6.2], [3.4, 6.9], [2.8, 7.2], [2.3, 6.8]], -1, 1, [204, 70, 56], K.LISO);
    L.extruir(B, [[-0.6, 1.4], [1.6, 2.4], [0.8, 5], [-1.6, 4.2]], -1.02, 1.02, [43, 95, 168], K.LISO);
    L.extruir(B, circulo(1.2, 9.6, 0.5, 8), -1.08, 1.08, [30, 30, 34], K.LISO);
  } });

// L'Estel Ferit (Rebecca Horn): cuatro cubos de acero oxidado apilados y torcidos, en la arena.
add({ id: 'estel_ferit', nombre: "L'Estel Ferit", nivel: 'B', x: 13940.8, z: 12837.3, rot: 0, alto: 10, ancho: 4, largo: 4,
  noche: 'nada', edificios: [], sombra: true,
  build(B, h, L) {
    const R = [142, 88, 56], a = L.aux.panel(1.1, 0.35, 0.3);
    [[0, 0, -1, 2.6, 0], [0.35, -0.2, 1.6, 2.5, 11], [-0.3, 0.3, 4.1, 2.5, -9], [0.5, 0.1, 6.6, 2.5, 21]].forEach(([x, z, y, s, ang]) =>
      L.caja(B, x, z, y, s, s, 2.5, ang, R, K.METAL, { aux: a }));
  } });

// El Llapis (Monument a la República, Cinc d'Oros): obelisco blanco muy fino de 33 m. La coordenada de memoria caía dentro
// de una manzana; va en el mayor claro cercano (el cruce, unos 95 m al noroeste).
add({ id: 'llapis', nombre: "El Llapis (Cinc d'Oros)", nivel: 'B', x: 11271, z: 15078, rot: 45, alto: 33, ancho: 3, largo: 3,
  noche: 'focos', edificios: [],
  build(B, h, L) {
    L.caja(B, 0, 0, -1.5, 3.2, 3.2, 2.3, 0, [200, 196, 188], K.PIEDRA);
    L.aguja(B, 0, 0, 0.8, 32, 1.05, { lados: 4, pasos: 2, recto: 0.93, pot: 1, exp: 1, col: [242, 242, 236], k: K.LISO });
  } });

// Rambla de Mar: pasarela ondulada de madera sobre el agua del Port Vell, con barandillas y farolas, del muelle de Colom
// (−Z) al Moll d'Espanya (+Z). Posición y rumbo ajustados con una vista cenital (el catálogo la dejaba en el agua).
add({ id: 'rambla_mar', nombre: 'Rambla de Mar', nivel: 'B', x: 13068, z: 12757, y: 1.4, rot: 112, alto: 6, ancho: 20, largo: 215,
  noche: 'nada', edificios: [], sombra: false,
  build(B, h, L) {
    const MAD = [140, 106, 74], GR = [196, 196, 190], N = 32, Lg = 215, W = 5;
    const X = z => 7 * Math.sin(z / Lg * Math.PI * 2), Y = z => 1.6 + 1.1 * Math.max(0, Math.sin(z / Lg * Math.PI * 3));
    for (let i = 0; i < N; i++) { const z0 = -Lg / 2 + Lg * i / N, z1 = z0 + Lg / N, a0 = X(z0), a1 = X(z1), y0 = Y(z0), y1 = Y(z1);
      L.q4(B, [a0 - W, y0, z0], [a0 + W, y0, z0], [a1 + W, y1, z1], [a1 - W, y1, z1], MAD, K.LISO, L.aux.liso(0.9));
      for (const s of [-1, 1]) { L.q4(B, [a0 + s * W, y0 - 0.9, z0], [a1 + s * W, y1 - 0.9, z1], [a1 + s * W, y1, z1], [a0 + s * W, y0, z0], GR, K.LISO);
        L.q4(B, [a0 + s * W, y0 + 0.9, z0], [a1 + s * W, y1 + 0.9, z1], [a1 + s * W, y1 + 1.1, z1], [a0 + s * W, y0 + 1.1, z0], GR, K.METAL); }
      if (i % 4 === 0) { L.tambor(B, a0, z0, -3, y0 - 0.9, 0.6, { lados: 6, col: [120, 120, 118], k: K.LISO });
        L.tambor(B, a0 + W - 0.4, z0, y0, y0 + 6, 0.1, { lados: 4, col: GR, k: K.METAL }); L.caja(B, a0 + W - 1, z0, y0 + 6, 1.4, 0.4, 0.3, 0, GR, K.METAL); } }
  } });

})();
