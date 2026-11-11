/* GTA Barcelona — HITOS, lote a (Gaudí y el modernismo). Cada hito se declara con BCN_LM.add({...}) al cargar el script
   (ficha y constructor: DESARROLLO.md §10). Este fichero es SOLO del agente del lote a. */
(function () {
'use strict';
const { add, lib: L, K } = window.BCN_LM;
const C = L.color;

// Edificios del registro (BREC) que sustituye cada hito (de data/hitos_catalogo.json; incluyen las partes apiladas de OSM)
const ED = {
  sagrada_familia: [136884,136885,138817,138818,138820,139042,139043,139044,139045,139046,139047,139048,139049,139050,139051,139052,139053,139054,139055,139056,139057,139058,139059,139060,139061,139062,139063,139064,139065,139066,139067,139068,139069,139070,139071,139072,139073,139074,139075,139076,139077,139078,139079,139080,139081,139082,139083,139084,139085,139086,139087,139088,139089,139090,139091,139092,139093,139094,139095,139096,139097,139098,139099,139100,139101,139102,139103,139104,139105,139106,139107,139108,139109,139110,139111,139112,139113,139114,139115,139116,139117,139118,139119,139120,139121,139122,139123,139124,139125,139126,139127,139128,139129,139130,139131,139132,139133,139134,139135,139136,139137,139138,139139,139140,139141,139142,139143,139144,139145,139146,139147,139148,139149,139150,139151,139152,139153,139154,139155,139156,139157,139158,139159,139160,139161,139162,139163,139164,139165,139166,139167,139168,139169,139170,139171,139172,139173,139174,139176,139177,139178,139179,139180,139181,139182,139183,139184,139185],
  casa_mila: [112845,112869,112891,112898,112938,112948,112964,112975,112981,112989,112992,112993,113010],
  casa_batllo: [114428],
  casa_amatller: [114377],
  casa_lleo_morera: [114478,115079],
  park_guell: [164249,164254,164255,164256,164272,164377,164400,164407,164417,164419,164430,164454,164474,164478,164491,164494,164561,164601,164645,164646,164647,164648,164649],
  sant_pau: [155107,155298,155299,155300,155301,155302,155495,155500,155501,155504,155509,155514,155522,155523,155524,155528,155541,155585,155595,155598,155607,155631,155833,155836,155839,155840,155841,155845,155846,155853,155866,155874,155913,155916,155919,155922,155927,155928,155932,155935,155936,155937,155938,155940,155948,155949,155951,155952,155955,155960,155964,155965,155969,155972,155975,155977,155981,155997,155998,156005,156012,156013,156014,156020,156024,156026,156028,156029,156034,156036,156129,166277,166278,166279,166286,166287,166293,166294,166295,166296,166297,166302,166303,166304,166307,166308,166309,166311,166312,166313,166314,166315,166316,166317,166319,166320,166321,166323,166325,166332,166333,166335,166336,166337,166339,166340,166344,166345,166346,166348,166349,166351,166352,166355,166357,166358,166360,166364,166366,166367,166368,166369,166370,166371,166372,166373,166374,166375,166376,166377,166378,166379,166380,166381,166382,166383,166384,166385,166386,166388,166390,166400,166401,166404,166405,166407,166785,166789,167173,167182,168055,168166,168169,168262,168263,168264,168265,168480,168481,168482,168483,168538,168609],
  palau_musica: [97284],
  casa_vicens: [127731,127733,131450],
  palau_guell: [79036],
  bellesguard: [147126],
  casa_punxes: [133912,133914,133923,133924,133926,133929,133938,133944,134071,134072,134073,134077,134078,134079,134080,134081,134083,134084,134085,134086,134087,134088,134089,134090,134091,134092,134093,134094,134095,134096,134098,134100,134101,134102,134103,134104,135676,135687,135688,135689,135690,135692,135693,135694,135695,135696,135697,135698,135700,136036,136037],
  pavellons_guell: [90015],
  teresianes: [],
  fundacio_tapies: [112626],
  monumental: [139529,139539,139540,139541,139542,139543,139544,139545,139546,139547,139548,139549,139550,139551,139552,139553,139554,139555,139556],
  universitat: [95418,95419,95422,95423,95424,95426,95427,95429,95430,95431,95432,95433,95434,95437,95438,95440,95441,95445,95446,95447,95449,95450,95451,95452,95453],
  mercat_sant_antoni: [77046,77047,77048,77049,77050,77051,77160,77161],
  castell_tres_dragons: [99107],
  casa_calvet: [115277,116764],
};

// ------------------------------------------------------------------ utilidades locales
// huso: sólido de revolución centrado en (x, z) con perfil [[r, y, color?], …] de abajo arriba (tapa arriba si r > 0)
function huso(B, x, z, prof, lados, col, k, aux) {
  L.rev(B, L.F0, x, z, prof.map(p => p[2] ? [p[0], p[1], C(p[2])] : [p[0], p[1]]), lados, C(col), k, { aux, cap: 1 });
}
// medio huso (arco de a0 a a1, en radianes: 0 = +X, π/2 = +Z)
function arcoRev(B, x, z, prof, lados, col, k, a0, a1, aux) {
  L.rev(B, L.F0, x, z, prof.map(p => p[2] ? [p[0], p[1], C(p[2])] : [p[0], p[1]]), lados, C(col), k, { aux, cap: 1, a0, a1 });
}
// estrella de 12 puntas (vértices de un icosaedro) centrada en (x, y, z), de radio r
function estrella(B, x, y, z, r, col, k, aux) {
  const t = (1 + Math.sqrt(5)) / 2, V = [];
  for (const [a, b] of [[-1, t], [1, t], [-1, -t], [1, -t]]) V.push([a, b, 0], [0, a, b], [b, 0, a]);
  const c = C(col), ri = r * 0.32;
  for (const v of V) {
    const l = Math.hypot(v[0], v[1], v[2]), d = [v[0] / l, v[1] / l, v[2] / l];
    // base triangular perpendicular a d
    let u = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const p = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]], pl = Math.hypot(...p);
    const e1 = p.map(q => q / pl), e2 = [d[1] * e1[2] - d[2] * e1[1], d[2] * e1[0] - d[0] * e1[2], d[0] * e1[1] - d[1] * e1[0]];
    const base = [0, 1, 2].map(i => { const a = i * 2 * Math.PI / 3; return [x + ri * (Math.cos(a) * e1[0] + Math.sin(a) * e2[0]), y + ri * (Math.cos(a) * e1[1] + Math.sin(a) * e2[1]), z + ri * (Math.cos(a) * e1[2] + Math.sin(a) * e2[2])]; });
    const tip = [x + d[0] * r, y + d[1] * r, z + d[2] * r];
    for (let i = 0; i < 3; i++) L.poly(B, [base[i], base[(i + 1) % 3], tip], c, k, aux);
  }
}

// ================================================================== SAGRADA FAMÍLIA (acabada)
// Silueta: racimo de 18 agujas de Gaudí (husos parabólicos) que sube escalonado hasta la torre de Jesucrist (172,5 m) en
// el crucero; 4 torres de apóstoles en cada una de las tres fachadas (Naixement al NE, Passió al SO, Glòria al SE).
// Rasgos: (1) la torre central con la cruz blanca de cuatro brazos, la de la Mare de Déu con la estrella y los cuatro
// evangelistas alrededor; (2) las torres de apóstoles de pan de azúcar con pináculos de trencadís dorado, rojo y blanco;
// (3) piedra ocre (el Naixement, más oscuro), naves con frutas de colores en los pináculos.
// Ejes locales (de los datos): +Z = rumbo 136° = hacia la Glòria (c/ Mallorca); −Z = ábside (Provença); −X = Naixement
// (c/ Marina); +X = Passió (c/ Sardenya). Crucero en (−1,9, −18,4).
add({ id: 'sagrada_familia', nombre: 'Sagrada Família', nivel: 'A', x: 12597.9, z: 15875.2, rot: 136, alto: 172.5, ancho: 84, largo: 142,
  noche: 'focos', edificios: ED.sagrada_familia,
  build(B, h, L) {
    const AX = -1.9, CZ = -18.4;                                   // eje de la nave y centro del crucero
    const OCRE = [186, 165, 128], OSCURO = [142, 130, 110], CLARO = [198, 190, 172], BLANCO = [238, 234, 224];
    const aV = L.aux.ventanas(11, 7.8, 0.36, 0.72);                // ventanales altos de las naves (de noche, vidrieras)
    const ORO = [232, 190, 70], ROJO = [206, 74, 56], VERDE = [70, 128, 78];
    const aP = L.aux.piedra(0.7, 1.4), y0 = -2.5;

    // celosías de las agujas: anillos alternos más oscuros entre ya y yb (cada `paso` m) sobre un perfil [[r, y], …]
    function bandas(prof, col, ya, yb, paso, osc) {
      const rAt = y => { for (let i = 1; i < prof.length; i++) if (y <= prof[i][1]) { const t = (y - prof[i - 1][1]) / (prof[i][1] - prof[i - 1][1]); return prof[i - 1][0] + (prof[i][0] - prof[i - 1][0]) * t; } return prof[prof.length - 1][0]; };
      const out = prof.filter(p => p[1] < ya).map(p => [p[0], p[1], col]), dark = L.shade(col, osc || 0.7);
      let i = 0; for (let y = ya; y < yb; y += paso, i++) out.push([rAt(y), y, i % 2 ? dark : col]);
      return out.concat(prof.filter(p => p[1] >= yb).map(p => [p[0], p[1], col]));
    }
    // ---- torres de apóstoles: fuste cuadrado hasta la cornisa, huso parabólico y pináculo de trencadís (mitra)
    function apostol(x, z, H, piedra) {
      L.caja(B, x, z, y0, 7.2, 7.2, 36 - y0, 0, piedra, K.PIEDRA, { aux: aP });
      huso(B, x, z, bandas([[3.75, 35.5], [3.7, 0.42 * H], [3.4, 0.57 * H], [2.9, 0.70 * H], [2.2, 0.79 * H]], piedra, 0.45 * H, 0.77 * H, 4.2), 12, piedra, K.LISO);
      huso(B, x, z, [[2.2, 0.79 * H, ORO], [2.75, 0.845 * H, ORO], [2.45, 0.895 * H, ROJO], [1.45, 0.94 * H, ROJO], [0.7, 0.972 * H, BLANCO], [0, H - 1.4, BLANCO]], 8, ORO, K.TRENCADIS);
      L.esfera(B, x, H - 1.1, z, 1.05, { gajos: 6, anillos: 4, col: BLANCO, k: K.TRENCADIS });
    }
    // Naixement (−X, más bajas y oscuras), Passió (+X), Glòria (+Z, más abierta: la fachada es más ancha)
    for (const [dz, Hn, Hp] of [[-15.2, 99.6, 108.6], [-7.6, 108.6, 113.6], [7.6, 108.6, 113.6], [15.2, 99.6, 108.6]]) {
      apostol(-36.1, CZ + dz, Hn, OSCURO);
      apostol(34.6, CZ + dz, Hp, OCRE);
    }
    for (const [dx, H] of [[-17, 106], [-8.5, 112], [8.5, 112], [17, 106]]) apostol(AX + dx, 31.5, H, CLARO);

    // ---- naves: cinco naves (laterales a 33 m, central a 45 m con cubierta a dos aguas) y crucero de tres naves
    const tapa = { aux: aP, techo: [176, 160, 128] };
    const tapaV = { aux: aV, techo: [150, 136, 110] };
    L.caja(B, AX, -6.5, y0, 46, 83, 33.6 - y0, 0, OCRE, K.VENTANAS, tapaV);               // naves laterales (z −48 … 35)
    L.caja(B, AX - 1.5, CZ, y0, 71, 34, 33.6 - y0, 0, OCRE, K.VENTANAS, tapaV);           // crucero con sus laterales
    L.caja(B, AX, -6.5, 33, 18, 83, 13, 0, OCRE, K.VENTANAS, { aux: L.aux.ventanas(13, 7.8, 0.4, 0.7), techo: [150, 136, 110] });   // nave central
    L.cubierta(B, AX, -6.5, 46, 18.6, 83, 13, { tipo: 'dos', col: [170, 150, 118], k: K.PIEDRA, colHastial: OCRE });
    L.caja(B, AX - 1.5, CZ, 33, 66, 17, 13, 0, OCRE, K.VENTANAS, { aux: L.aux.ventanas(13, 7.8, 0.4, 0.7), techo: [150, 136, 110] });   // crucero central
    L.cubierta(B, AX - 1.5, CZ, 46, 66, 17.6, 13, { tipo: 'dos', ang: 90, col: [170, 150, 118], k: K.PIEDRA, colHastial: OCRE });
    // frutas de colores sobre los pináculos de la nave y del crucero
    const FR = [[214, 72, 52], [236, 176, 52], [226, 120, 46], [120, 160, 70], [200, 60, 90]];
    let fi = 0;
    for (let z = -44; z <= 26; z += 7.8) for (const s of [-1, 1]) {
      if (Math.abs(z - CZ) < 10) continue;
      L.tambor(B, AX + s * 9.4, z, 44, 47.5, 0.7, { lados: 5, col: OCRE, k: K.PIEDRA });
      L.esfera(B, AX + s * 9.4, 48.6, z, 1.3, { gajos: 6, anillos: 4, col: FR[fi++ % FR.length], k: K.TRENCADIS });
    }
    for (const x of [-30, -22, 18, 26]) for (const s of [-1, 1]) {
      L.tambor(B, x, CZ + s * 8.9, 44, 47.5, 0.7, { lados: 5, col: OCRE, k: K.PIEDRA });
      L.esfera(B, x, 48.6, CZ + s * 8.9, 1.3, { gajos: 6, anillos: 4, col: FR[fi++ % FR.length], k: K.TRENCADIS });
    }

    // ---- ábside (−Z): girola con capillas a 33 m, cabecera a 45 m con media cúpula, y siete agujas
    const PI = Math.PI, ZA = -48;
    arcoRev(B, AX, ZA, [[22, y0], [22, 33.6]], 14, OCRE, K.PIEDRA, PI, 2 * PI);
    arcoRev(B, AX, ZA, [[9.4, 33], [9.4, 46], [8.6, 50], [6.2, 54], [0, 57]], 10, OCRE, K.PIEDRA, PI, 2 * PI);
    for (let i = 0; i < 7; i++) {
      const a = PI + PI * (i + 0.5) / 7, x = AX + Math.cos(a) * 18.5, z = ZA + Math.sin(a) * 18.5;
      huso(B, x, z, [[1.5, 33], [1.3, 46], [0.8, 54], [0.9, 55, ORO], [0, 59, ORO]], 6, CLARO, K.LISO);
    }

    // ---- cimborrio del crucero, de donde salen las cinco torres centrales
    huso(B, AX, CZ, [[17.5, 44], [16.5, 54], [13.5, 63], [10, 69]], 16, CLARO, K.LISO);
    // evangelistas (135 m): husos con su símbolo blanco arriba
    for (const [dx, dz] of [[-10.9, -11.2], [-10.9, 10.7], [11, 10.8], [11, -11.1]]) {
      const x = AX + dx, z = CZ + dz;
      huso(B, x, z, bandas([[4.0, 44], [3.9, 70], [3.5, 96], [2.7, 114], [1.9, 121]], CLARO, 66, 118, 4.5, 0.82), 12, CLARO, K.LISO);
      huso(B, x, z, [[1.9, 121, CLARO], [2.9, 125, BLANCO], [2.8, 129.5, BLANCO], [1.5, 133, BLANCO], [0, 135.5, BLANCO]], 8, BLANCO, K.TRENCADIS);
    }
    // Mare de Déu (138 m) sobre el ábside, con la estrella de doce puntas
    const MX = -1.3, MZ = -41.8;
    huso(B, MX, MZ, bandas([[8.6, 44], [8.4, 62], [7.8, 82], [6.7, 101], [5.2, 117], [3.5, 127], [2.1, 130]], CLARO, 64, 124, 5, 0.82), 14, CLARO, K.LISO);
    huso(B, MX, MZ, [[2.1, 130], [1.0, 131.2], [0.8, 132]], 6, [190, 196, 205], K.METAL);
    estrella(B, MX, 134.6, MZ, 3.8, [250, 244, 220], K.EMISIVO, L.aux.emisivo(1.6, true));
    // Jesucrist (172,5 m): huso ancho que se aclara arriba (cerámica blanca) y cruz de cuatro brazos
    huso(B, AX, CZ, [[9.6, 64, CLARO], [9.2, 72, CLARO], [7.9, 82, CLARO], [7.0, 93, CLARO], [5.7, 104, CLARO], [4.6, 116, [228, 222, 206]],
      [3.4, 128, BLANCO], [2.4, 141, BLANCO], [1.6, 151, BLANCO], [1.1, 155.5, BLANCO]], 16, CLARO, K.LISO);
    // la cruz de cuatro brazos, blanca (EMISIVO se vería gris de día: queda con la luz de los focos, débil a 170 m)
    const CR = [246, 246, 240];
    L.caja(B, AX, CZ, 155, 2.4, 2.4, 17.5, 0, CR, K.LISO);
    L.caja(B, AX, CZ, 164.4, 13.5, 2.4, 2.4, 0, CR, K.LISO);
    L.caja(B, AX, CZ, 164.4, 2.4, 13.5, 2.4, 0, CR, K.LISO);

    // ---- fachada del Naixement (−X): cuerpo oscuro entre las torres, tres hastiales y el ciprés verde
    L.caja(B, -36.6, CZ, y0, 8, 37, 34 - y0, 0, OSCURO, K.PIEDRA, { aux: aP });
    L.piramide(B, -37, CZ, 33.5, 7.5, 13, 16, { col: OSCURO, k: K.PIEDRA });
    for (const s of [-1, 1]) L.piramide(B, -37, CZ + s * 11.4, 33.5, 6, 6, 8, { col: OSCURO, k: K.PIEDRA });
    L.aguja(B, -38.5, CZ, 46, 17, 3.2, { lados: 8, pasos: 5, pot: 1, exp: 1, col: VERDE, k: K.TRENCADIS, remate: { r: 0.6, col: BLANCO, k: K.TRENCADIS } });
    // ---- fachada de la Passió (+X): muro desnudo, pórtico de columnas inclinadas y friso de «huesos»
    L.caja(B, 35.2, CZ, y0, 7, 37, 32 - y0, 0, OCRE, K.PIEDRA, { aux: aP });
    L.caja(B, 41.5, CZ, 21, 6, 30, 3, 0, [190, 172, 136], K.PIEDRA);
    for (let i = 0; i < 6; i++) { const z = CZ - 12.5 + i * 5;
      L.bar(B, [43.2, y0, z], [40.5, 21.2, z], 0.75, C([196, 178, 142]), K.PIEDRA); }
    for (let i = 0; i < 18; i++) { const z = CZ - 13.6 + i * 1.6;
      L.bar(B, [41.8, 24, z], [41.8, 30 + 5 * Math.sin(PI * i / 17), z], 0.38, C(CLARO), K.PIEDRA); }
    // ---- fachada de la Glòria (+Z): frente ancho, pórtico de ocho columnas con linternas y escalinata sobre Mallorca
    L.caja(B, AX - 0.5, 31, y0, 54, 8, 40 - y0, 0, CLARO, K.VENTANAS, { aux: L.aux.ventanas(12, 6.8, 0.5, 0.75) });
    L.piramide(B, AX, 31, 39.5, 14, 6, 18, { col: CLARO, k: K.PIEDRA });
    const px = [-26.8, -19.3, -11.8, -5.5, 0.9, 7.2, 14.7, 22.2];
    px.forEach((x, i) => { const top = i >= 2 && i <= 5 ? 50.6 : 36.6;
      L.tambor(B, x, 39, y0, top - 9, 1.25, { lados: 8, col: CLARO, k: K.PIEDRA });
      huso(B, x, 39, [[1.25, top - 9, CLARO], [2.0, top - 6, ORO], [1.6, top - 3, ROJO], [0, top, BLANCO]], 8, ORO, K.TRENCADIS); });
    L.caja(B, AX - 0.5, 40.5, 20, 54, 5, 2, 0, CLARO, K.PIEDRA);                             // dintel del pórtico
    L.caja(B, -2.5, 53, 3.9, 60, 24, 1, 0, [196, 186, 164], K.PIEDRA);                      // puente-plaza sobre Mallorca
    for (const z of [44, 61]) for (const x of [-28.4, -15.4, -2.4, 10.6, 23.6]) L.tambor(B, x, z, -3, 3.9, 0.6, { lados: 6, col: [180, 170, 150], k: K.LISO });
    for (let i = 0; i < 5; i++) L.caja(B, -2.5, 66 + i * 1.1, y0, 60, 1.1, 4.9 - i * 1.0 - y0, 0, [196, 186, 164], K.PIEDRA);

    // ---- claustro perimetral bajo, sacristías con cúpula en las esquinas del ábside y las Escoles de techo ondulado
    const CL = [196, 178, 140], cl = { aux: aP, techo: [150, 132, 108] };
    L.caja(B, 0, -71 + 3, y0, 84, 6, 13 - y0, 0, CL, K.PIEDRA, cl);
    for (const s of [-1, 1]) L.caja(B, s * 39, -17, y0, 6, 102, 13 - y0, 0, CL, K.PIEDRA, cl);
    for (const sx of [-31.6, 27.8]) {
      L.tambor(B, sx, -63.6, y0, 18, 9, { lados: 12, col: OCRE, k: K.PIEDRA, aux: aP });
      huso(B, sx, -63.6, bandas([[9, 18], [8.2, 26], [6, 33], [3.2, 38]], OCRE, 19, 37, 2.6, 0.78), 12, OCRE, K.LISO);
      huso(B, sx, -63.6, [[3.2, 38, ORO], [2.2, 41, ROJO], [0, 46, BLANCO]], 8, ORO, K.TRENCADIS);
    }
    const esc = [];
    for (let i = 0; i <= 12; i++) esc.push([30, 2 + 26 * i / 12]);
    for (let i = 12; i >= 0; i--) esc.push([38, 2 + 26 * i / 12]);
    L.prisma(B, esc, y0, (x, z) => 6.5 + 1.1 * Math.sin((z - 2) / 26 * 3 * 2 * PI) * (x < 34 ? 1 : -1), [214, 186, 150], K.LADRILLO, { aux: L.aux.ladrillo(0.3, 0.6), techo: [176, 150, 120] });
  } });

})();
