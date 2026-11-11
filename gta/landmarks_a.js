/* GTA Barcelona — HITOS, lote a (Gaudí y el modernismo). Cada hito se declara con BCN_LM.add({...}) al cargar el script
   (ficha y constructor: DESARROLLO.md §10). Este fichero es SOLO del agente del lote a. */
(function () {
'use strict';
const { add, lib: L, K } = window.BCN_LM;
const C = L.color;

// Edificios del registro (BREC) que sustituye cada hito (de data/hitos_catalogo.json; incluyen las partes apiladas de OSM)
const ED = {
  // Park Güell: solo los dos pabellones de la entrada (164377, con la torre; 164419) y el contorno del banco (164601).
  // El resto de la selección del catálogo son la escuela del parque y casas de fuera del recinto (comprobado en planta).
  park_guell: [164377, 164419, 164601],
  // Sant Pau: pabellón de la Administració (166388, en V, alineado con el Eixample) y los pabellones alineados N-S del
  // recinto (|x + 5| < 95 m, −70 < z < 175 m en local). La selección del catálogo traía además 89 casas del Eixample.
  sant_pau: [166388,166287,166293,166294,166295,166296,166297,166302,166303,166304,166308,166317,166319,166320,166321,166337,166339,166340,166344,166345,166346,166348,166351,166352,166355,166357,166358,166360,166364,166366,166367,166368,166369,166370,166371,166372,166373,166374,166375,166376,166377,166378,166379,166380,166381,166382,166383,166384,166385,166386,168055,168480,168481,168482,168483],
  sagrada_familia: [136884,136885,138817,138818,138820,139042,139043,139044,139045,139046,139047,139048,139049,139050,139051,139052,139053,139054,139055,139056,139057,139058,139059,139060,139061,139062,139063,139064,139065,139066,139067,139068,139069,139070,139071,139072,139073,139074,139075,139076,139077,139078,139079,139080,139081,139082,139083,139084,139085,139086,139087,139088,139089,139090,139091,139092,139093,139094,139095,139096,139097,139098,139099,139100,139101,139102,139103,139104,139105,139106,139107,139108,139109,139110,139111,139112,139113,139114,139115,139116,139117,139118,139119,139120,139121,139122,139123,139124,139125,139126,139127,139128,139129,139130,139131,139132,139133,139134,139135,139136,139137,139138,139139,139140,139141,139142,139143,139144,139145,139146,139147,139148,139149,139150,139151,139152,139153,139154,139155,139156,139157,139158,139159,139160,139161,139162,139163,139164,139165,139166,139167,139168,139169,139170,139171,139172,139173,139174,139176,139177,139178,139179,139180,139181,139182,139183,139184,139185],
  casa_mila: [112845,112869,112891,112898,112938,112948,112964,112975,112981,112989,112992,112993,113010],
  casa_batllo: [114428, 114974, 114395, 114407],          // + el cuerpo delantero (114974, fachada a z ≈ 19,5) y piezas de cubierta
  casa_amatller: [114377, 114379, 114435],               // + los cuerpos delanteros sobre el paseo
  casa_lleo_morera: [114478,115079],
  park_guell_cat: [164249,164254,164255,164256,164272,164377,164400,164407,164417,164419,164430,164454,164474,164478,164491,164494,164561,164601,164645,164646,164647,164648,164649],
  sant_pau_cat: [155107,155298,155299,155300,155301,155302,155495,155500,155501,155504,155509,155514,155522,155523,155524,155528,155541,155585,155595,155598,155607,155631,155833,155836,155839,155840,155841,155845,155846,155853,155866,155874,155913,155916,155919,155922,155927,155928,155932,155935,155936,155937,155938,155940,155948,155949,155951,155952,155955,155960,155964,155965,155969,155972,155975,155977,155981,155997,155998,156005,156012,156013,156014,156020,156024,156026,156028,156029,156034,156036,156129,166277,166278,166279,166286,166287,166293,166294,166295,166296,166297,166302,166303,166304,166307,166308,166309,166311,166312,166313,166314,166315,166316,166317,166319,166320,166321,166323,166325,166332,166333,166335,166336,166337,166339,166340,166344,166345,166346,166348,166349,166351,166352,166355,166357,166358,166360,166364,166366,166367,166368,166369,166370,166371,166372,166373,166374,166375,166376,166377,166378,166379,166380,166381,166382,166383,166384,166385,166386,166388,166390,166400,166401,166404,166405,166407,166785,166789,167173,167182,168055,168166,168169,168262,168263,168264,168265,168480,168481,168482,168483,168538,168609],
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

// ================================================================== CASA MILÀ (LA PEDRERA)
// Silueta: bloque de esquina de 6 plantas con el chaflán redondeado, sin aristas, y la azotea poblada de chimeneas.
// Rasgos: (1) fachada de piedra crema que ondula en planta y en altura (los cantos de forjado salen como olas);
// (2) balcones de hierro negro enmarañado en cada vano; (3) desván blanco con el borde ondulado y chimeneas-guerrero.
// Ejes (datos): fachadas a −Z (Pg. de Gràcia) y a +X (Provença), chaflán curvo entre ellas; medianeras a −X y +Z.
add({ id: 'casa_mila', nombre: 'Casa Milà (La Pedrera)', nivel: 'A', x: 11535.7, z: 14987.7, rot: 48, alto: 34, ancho: 35, largo: 58,
  noche: 'focos', edificios: ED.casa_mila,
  build(B, h, L) {
    const PI = Math.PI, CREMA = [214, 202, 178], BLANCO = [236, 230, 216], HIERRO = [46, 46, 42];
    // línea de fachada (Pg. de Gràcia → chaflán curvo → Provença), remuestreada cada ~1,4 m
    const fach = [];
    const tramo = (a, b, n) => { for (let i = 0; i < n; i++) fach.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]); };
    tramo([-17.4, -28.7], [1.5, -28.7], 14);
    for (let i = 0; i < 14; i++) { const t = i / 14 * PI / 2; fach.push([1.5 + 14.5 * Math.sin(t), -14.2 - 14.5 * Math.cos(t)]); }
    tramo([16, -14.2], [16, 29.2], 31); fach.push([16, 29.2]);
    // longitud de arco y normal hacia fuera de cada punto
    const sArc = [0]; for (let i = 1; i < fach.length; i++) sArc.push(sArc[i - 1] + Math.hypot(fach[i][0] - fach[i - 1][0], fach[i][1] - fach[i - 1][1]));
    const nor = fach.map((p, i) => { const a = fach[Math.max(0, i - 1)], b = fach[Math.min(fach.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [dz / l, -dx / l]; });
    const NF = fach.length, back = [[-13.6, 28.6], [-13.2, 2.4], [-17.4, 2.4]];      // medianeras
    // ondulación: olas a lo largo de la fachada (~9 m) que se desplazan de planta en planta, y cantos de forjado salientes
    const PL = 3.55, ola = (sa, y) => 0.55 * Math.sin(2 * PI * sa / 9 + 0.9 * Math.sin(y * 0.55)) + 0.32 * Math.cos(2 * PI * y / PL);
    const anillo = (y, d) => fach.map((p, i) => { const o = ola(sArc[i], y) + d; return [p[0] + nor[i][0] * o, p[1] + nor[i][1] * o]; }).concat(back.map(p => [p[0] + (d < 0 ? 0.8 : 0), p[1]]));
    const niv = []; for (let y = -1.5; y <= 21.4; y += PL / 2) niv.push([y, anillo(y, 0)]);
    L.loft(B, niv, CREMA, K.VENTANAS, { aux: L.aux.ventanas(PL, 4.2, 0.42, 0.5), sinTecho: true });
    // cubierta del cuerpo principal con los dos patios
    const top = niv[niv.length - 1][1], yT = niv[niv.length - 1][0];
    const p1 = [[-8.5, -19], [-5.9, -20.4], [-2.2, -20.5], [0.3, -19.5], [1.8, -18.2], [3.3, -15.8], [3.5, -13.5], [1, -8.7], [-0.8, -7.6], [-4.1, -7.1], [-7.3, -7.5], [-8.9, -8.5], [-10.3, -12.9], [-9.7, -16.4]];
    const p2 = [[-2.5, 3.5], [0.2, 2], [4.8, 1.1], [7.1, 3.1], [8.2, 8.8], [7.5, 17.6], [6.8, 20.3], [5.4, 21.2], [1.2, 21.9], [-0.8, 21.5], [-4, 18.8], [-4.6, 15.3], [-4.3, 8.3], [-3.8, 5.7]];
    for (const pt of [p1, p2]) L.prisma(B, pt, 0, yT, [176, 166, 146], K.VENTANAS, { aux: L.aux.ventanas(PL, 2.6, 0.5, 0.55), sinTecho: true });
    const conHuecos = (ring, y) => { const pts = ring.concat(p1, p2).map(p => [p[0], y, p[1]]); L.poly(B, pts, [190, 182, 166], K.LISO, null, [ring.length, ring.length + p1.length]); };
    conHuecos(top, yT);
    // balcones de hierro: una maraña oscura en cada vano (~4,2 m) de las plantas 1–5
    const sTot = sArc[NF - 1];
    for (let f = 1; f <= 5; f++) { const y = f * PL + 0.15;
      for (let sa = 2.1 + (f % 2) * 0.6; sa < sTot - 1; sa += 4.2) {
        let i = 1; while (i < NF - 1 && sArc[i] < sa) i++;
        const t = (sa - sArc[i - 1]) / Math.max(1e-3, sArc[i] - sArc[i - 1]), x = fach[i - 1][0] + (fach[i][0] - fach[i - 1][0]) * t, z = fach[i - 1][1] + (fach[i][1] - fach[i - 1][1]) * t;
        const n = nor[i], o = ola(sa, y) + 0.45, tx = -n[1], tz = n[0], w = 1.25 + 0.25 * Math.sin(sa * 3.1 + f);
        const cx = x + n[0] * o, cz = z + n[1] * o, hb = 1.05 + 0.2 * Math.cos(sa * 2.3 + f);
        L.q4(B, [cx - tx * w, y, cz - tz * w], [cx + tx * w, y, cz + tz * w], [cx + tx * w * 0.8, y + hb, cz + tz * w * 0.8], [cx - tx * w * 0.9, y + hb * 0.9, cz - tz * w * 0.9], HIERRO, K.METAL);
      } }
    // desván: algo retranqueado, blanco, con el borde superior ondulado
    const des = anillo(yT, -1.3), yD = yT + 3.2;
    for (let i = 0; i < des.length; i++) { const a = des[i], b = des[(i + 1) % des.length], sa = i < NF ? sArc[i] : 0, sb = i + 1 < NF ? sArc[i + 1] : 0;
      const ya = yD + (i < NF ? 0.9 * Math.sin(2 * PI * sa / 11) : 0), yb = yD + (i + 1 < NF ? 0.9 * Math.sin(2 * PI * sb / 11) : 0);
      L.q4(B, [a[0], yT, a[1]], [b[0], yT, b[1]], [b[0], yb, b[1]], [a[0], ya, a[1]], BLANCO, K.VENTANAS, L.aux.ventanas(3.2, 1.6, 0.35, 0.3)); }
    conHuecos(des, yD - 0.4);
    // azotea: salidas de escalera (trencadís) y chimeneas-guerrero
    const az = yD - 0.4;
    for (const [x, z, r, a] of [[-12, -24, 1.7, 5.5], [10, -17, 1.6, 5], [11.5, 6, 1.7, 5.6], [-9, 0, 1.5, 5], [10.5, 24, 1.5, 4.8], [-9, 24, 1.4, 4.6]])
      huso(B, x, z, [[r, az], [r * 1.1, az + a * 0.35], [r * 0.7, az + a * 0.7], [r * 0.45, az + a * 0.82], [0, az + a]], 8, BLANCO, K.TRENCADIS);
    for (const [x, z] of [[-14, -26], [-6, -24.5], [-1, -24], [4, -24], [7.5, -21.5], [12.5, -11], [12.6, -3], [12.4, 12], [12, 18.5], [-12, -4], [-11, 8], [-10.5, 15], [-7.5, -2.5], [2, 25.5], [-3, 25.2], [-14.5, -10]]) {
      const hh = 2.8 + h.R(0, 1.4), r = 0.55 + h.R(0, 0.2);
      huso(B, x, z, [[r, az], [r * 0.85, az + hh * 0.45], [r * 1.35, az + hh * 0.62], [r * 1.25, az + hh * 0.78], [r * 0.5, az + hh * 0.9], [0, az + hh]], 6, h.R() < 0.3 ? [120, 140, 100] : CREMA, h.R() < 0.4 ? K.TRENCADIS : K.LISO);
    }
  } });

// ================================================================== CASA BATLLÓ
// Silueta: casa entre medianeras de 15 m de frente; la cubierta remata la fachada con un lomo de dragón y una torrecilla a
// un lado. Rasgos: (1) lomo de dragón de escamas de colores (verde-azul a rosado) con la cresta de bolas; (2) fachada de
// trencadís azul-verde con balcones-máscara blancos; (3) planta baja y principal de piedra con grandes huecos y huesos.
// Ejes (datos): fachada a +Z (Pg. de Gràcia, al NE), en z ≈ 19,5 (cuerpo delantero 114974); torrecilla a +X (lado Amatller).
add({ id: 'casa_batllo', nombre: 'Casa Batlló', nivel: 'A', x: 11775.8, z: 14563.1, rot: 46, alto: 32, ancho: 15, largo: 30,
  noche: 'focos', edificios: ED.casa_batllo,
  build(B, h, L) {
    const PI = Math.PI, W = 14.8, ZF = 19.4, PIE = [204, 192, 166], BLANCO = [238, 234, 222], AZUL = [92, 156, 176];
    // cuerpo trasero (patio de manzana) y medianeras
    L.caja(B, 0, 2.2, -1.5, W, 34.4, 22.5, 0, [196, 186, 166], K.VENTANAS, { aux: L.aux.ventanas(3.4, 3.2, 0.4, 0.5), techo: [150, 140, 125] });
    // fachada principal: zócalo de piedra con los grandes huecos (huesos) y planos de trencadís azul-verde con ligera ondulación
    L.caja(B, 0, ZF + 0.3, -1.5, W, 0.7, 8.5, 0, PIE, K.VENTANAS, { aux: L.aux.ventanas(8.5, 3.7, 0.72, 0.72) });
    const N = 10;
    for (let j = 0; j < 4; j++) { const ya = 7 + j * 4.1, yb = ya + 4.1;
      for (let i = 0; i < N; i++) { const xa = -W / 2 + W * i / N, xb = -W / 2 + W * (i + 1) / N, za = ZF + 0.3 + 0.35 * Math.sin(xa * 0.8 + j), zb = ZF + 0.3 + 0.35 * Math.sin(xb * 0.8 + j);
        L.q4(B, [xa, ya, za], [xb, ya, zb], [xb, yb, zb], [xa, yb, za], L.mixc(AZUL, [120, 168, 140], ((i * 7 + j * 3) % 5) / 5), K.LISO, L.aux.liso(0.7)); } }
    // ventanas oscuras y balcones-máscara (tres por planta)
    for (let j = 0; j < 4; j++) for (const x of [-4.6, 0, 4.6]) { const y = 8.4 + j * 4.1;
      L.q4(B, [x - 1, y, ZF + 0.72], [x + 1, y, ZF + 0.72], [x + 1, y + 2.5, ZF + 0.72], [x - 1, y + 2.5, ZF + 0.72], [40, 48, 56], K.LISO);
      L.esfera(B, x, y + 0.15, ZF + 0.9, 1.05, { gajos: 6, anillos: 4, sy: 0.55, col: BLANCO, k: K.LISO }); }
    // lomo de dragón: bóveda de escamas sobre la fachada, de −X hasta la torrecilla, con la cresta de bolas
    const xa = -W / 2, xb = 3.6, NX = 12, NT = 6;
    const lomo = t => 1.0 + 3.6 * Math.pow(Math.sin(PI * Math.min(1, t * 1.15)), 0.7);
    const P = (t, th) => [xa + (xb - xa) * t, 23.5 + lomo(t) * Math.sin(th), ZF - 2.1 + 2.2 * Math.cos(th)];
    for (let i = 0; i < NX; i++) for (let j = 0; j < NT; j++) {
      const t0 = i / NX, t1 = (i + 1) / NX, a0 = PI * j / NT, a1 = PI * (j + 1) / NT;
      const col = L.ramp([[0, '#3f8f86'], [0.45, '#4f7fb0'], [0.75, '#b0708a'], [1, '#d9844a']], (t0 + t1) / 2);
      L.q4(B, P(t0, a0), P(t1, a0), P(t1, a1), P(t0, a1), L.shade(col, 0.9 + 0.2 * ((i + j) % 2)), K.TEJA);
    }
    L.poly(B, Array.from({ length: NT + 1 }, (_, j) => P(0, PI * j / NT)), [180, 170, 150], K.LISO);
    for (let i = 1; i < NX; i++) { const p = P(i / NX, PI / 2); L.esfera(B, p[0], p[1] + 0.35, p[2], 0.5, { gajos: 6, anillos: 4, col: [226, 196, 96], k: K.TRENCADIS }); }
    // torrecilla con bulbo y cruz de cuatro brazos
    L.tambor(B, 5.6, ZF - 1.6, 20, 29.5, 1.25, { lados: 10, col: PIE, k: K.TRENCADIS });
    huso(B, 5.6, ZF - 1.6, [[1.25, 29.5], [1.65, 30.4], [1.1, 31.3], [0.3, 31.8]], 10, [216, 180, 90], K.TRENCADIS);
    L.caja(B, 5.6, ZF - 1.6, 31.6, 0.35, 0.35, 2.4, 0, BLANCO, K.LISO);
    L.caja(B, 5.6, ZF - 1.6, 32.9, 1.6, 0.35, 0.35, 0, BLANCO, K.LISO);
    L.caja(B, 5.6, ZF - 1.6, 32.9, 0.35, 1.6, 0.35, 0, BLANCO, K.LISO);
  } });

// ================================================================== CASA AMATLLER (nivel B)
// Casa entre medianeras junto a la Batlló: fachada rosada con esgrafiados y hastial escalonado flamenco. Fachada a −X (NE),
// en x ≈ −17,8 (cuerpos delanteros 114379 y 114435), de z −8,6 a 4,6.
add({ id: 'casa_amatller', nombre: 'Casa Amatller', nivel: 'B', x: 11788.5, z: 14552.5, rot: 136, alto: 28, ancho: 17, largo: 18,
  noche: 'focos', edificios: ED.casa_amatller,
  build(B, h, L) {
    const ROSA = [226, 196, 166], OCRE = [196, 150, 110], ROJO = [176, 74, 60];
    const XF = -17.8, ZC = -2;
    L.caja(B, (XF + 8.4) / 2, -0.5, -1.5, 8.4 - XF, 17, 21.5, 0, ROSA, K.VENTANAS, { aux: L.aux.ventanas(3.6, 3.4, 0.42, 0.55), techo: [150, 136, 120] });
    // hastial escalonado sobre la fachada (−X): siete peldaños con remates rojos
    const st = [[0, 8.8, 4.4], [1, 6.4, 2.9], [2, 4.2, 1.7], [3, 2.2, 0.8]];
    for (const [i, a, al] of st) { const y = 20 + i * 1.6;
      L.caja(B, XF + 0.6, ZC, y, 1.2, a * 1.55, 1.6, 0, ROSA, K.LISO);
      if (i < 3) for (const s of [-1, 1]) L.caja(B, XF + 0.6, ZC + s * (a * 0.775 - 0.4), y + 1.6, 1.3, 0.8, 0.35, 0, ROJO, K.TRENCADIS); }
    L.caja(B, XF + 0.6, ZC, 26.4, 1.3, 1.4, 0.8, 0, ROJO, K.TRENCADIS);
    L.cubierta(B, XF + 5.6, ZC, 20, 13.6, 10, 6, { tipo: 'dos', ang: 90, col: [150, 80, 60], colHastial: ROSA });
    L.caja(B, XF - 0.1, ZC, 15, 0.4, 12.6, 3.2, 0, OCRE, K.PIEDRA);                       // friso de esgrafiado
  } });

// ================================================================== PARK GÜELL (zona monumental)
// Silueta: en la ladera, dos pabellones de cuento junto a la puerta de c/ Olot, la escalinata que sube al noroeste hasta la
// columnata de la Sala Hipòstila y, encima, la plaza alargada rodeada por el banco ondulado.
// Rasgos: (1) cubiertas de «nata» de trencadís marrón y crema, una con la torre azul y blanca de cruz de cuatro brazos y la
// otra con la seta; (2) el banco serpenteante multicolor al borde de la plaza; (3) columnas dóricas blancas bajo la plaza
// y el dragón de la escalinata. Posición (comprobada en planta, no la del catálogo): origen en la puerta, entre los dos
// pabellones de los datos; +Z = 315° (escalinata arriba); la plaza, del suelo del juego: centro (−3,5, 78), 87 × 41 m.
add({ id: 'park_guell', nombre: 'Park Güell', nivel: 'A', x: 10820.3, z: 17006.7, rot: 315, alto: 22, ancho: 60, largo: 130,
  noche: 'focos', edificios: ED.park_guell,
  build(B, h, L) {
    const PI = Math.PI, PEDRA = [142, 112, 82], CREMA = [236, 228, 208], MARRO = [152, 100, 66], BLAU = [70, 118, 186], BLANC = [232, 226, 212];
    const gy = (x, z) => { const v = h.y(x, z); return isFinite(v) ? v : 0; };
    // ---- pabellones de la entrada
    function pabellon(x, z, torre) {
      const y0 = Math.min(gy(x - 5, z - 5), gy(x + 5, z + 5), gy(x - 5, z + 5), gy(x + 5, z - 5)) - 1, yt = gy(x, z) + 7;
      L.caja(B, x, z, y0, 9.5, 11, yt - y0, 0, PEDRA, K.PIEDRA, { aux: L.aux.piedra(0.5, 0.7), sinTecho: true });
      const v0 = B.nv;
      huso(B, 0, 0, [[6.1, 0, CREMA], [5.8, 1.1, MARRO], [4.8, 3, MARRO], [3.6, 4.1, CREMA], [1.8, 5.3, MARRO], [0, 6.1, CREMA]], 12, MARRO, K.TRENCADIS);
      L.xf(B, v0, x, z, 0, 0.88, 1.02, yt - 0.2);
      for (let i = 0; i < 10; i++) { const a = 2 * PI * i / 10; L.esfera(B, x + Math.cos(a) * 5.3, yt + 0.9, z + Math.sin(a) * 5.6, 0.55, { gajos: 5, anillos: 3, col: BLANC, k: K.TRENCADIS }); }
      if (torre) {                                                   // torre de damero azul y blanco con la cruz de cuatro brazos
        const tx = x + 3.3, tz = z - 3.6;
        L.tambor(B, tx, tz, y0, yt + 10.5, 1.55, { lados: 10, r1: 1.2, col: BLAU, k: K.TRENCADIS });
        huso(B, tx, tz, [[1.2, yt + 10.5], [1.55, yt + 11.4], [0.8, yt + 12.6], [0, yt + 13.2]], 10, CREMA, K.TRENCADIS);
        L.caja(B, tx, tz, yt + 13, 0.35, 0.35, 1.9, 0, BLANC, K.LISO);
        L.caja(B, tx, tz, yt + 14, 1.6, 0.35, 0.35, 0, BLANC, K.LISO);
        L.caja(B, tx, tz, yt + 14, 0.35, 1.6, 0.35, 0, BLANC, K.LISO);
      } else {                                                       // la seta (amanita) en lo alto
        L.tambor(B, x, z, yt + 5.6, yt + 7.4, 0.35, { lados: 6, col: BLANC, k: K.LISO });
        huso(B, x, z, [[0.3, yt + 7.2], [1.4, yt + 7.7, [196, 56, 46]], [1.1, yt + 8.3, [196, 56, 46]], [0, yt + 8.7, [210, 70, 56]]], 10, [196, 56, 46], K.TRENCADIS);
      }
    }
    pabellon(11.9, -0.85, true); pabellon(-11.9, 0.85, false);
    // muro de la calle con remate de trencadís y la verja negra
    for (const [xa, xb] of [[-44, -17.5], [17.5, 44]]) { const xm = (xa + xb) / 2;
      L.caja(B, xm, -1.2, gy(xm, -1.2) - 1.5, xb - xa, 1.1, 4.2, 0, PEDRA, K.PIEDRA, { aux: L.aux.piedra(0.5, 0.7) });
      L.caja(B, xm, -1.2, gy(xm, -1.2) + 2.7, xb - xa, 1.3, 0.4, 0, CREMA, K.TRENCADIS); }
    L.caja(B, 0, -1.2, gy(0, -1.2) - 0.5, 13, 0.25, 3.4, 0, [34, 34, 32], K.METAL);
    // ---- escalinata doble con el dragón, hasta el suelo de la sala (y ≈ 7)
    const NS = 10, YS = 7.2, PY = 18.5;                                 // cota de la sala y de la plaza
    for (let i = 0; i < NS; i++) { const z = 4 + i * 2.9, top = 0.4 + (YS - 0.4) * (i + 1) / NS;
      L.caja(B, 0, z + 1.45, Math.min(gy(0, z), top) - 1.2, 20, 2.9, top - Math.min(gy(0, z), top) + 1.2, 0, [204, 192, 168], K.PIEDRA, { aux: L.aux.piedra(0.3, 0.9) });
      L.caja(B, 0, z + 1.45, top, 3.2, 2.9, 1.3, 0, PEDRA, K.PIEDRA); }
    const vd = B.nv;
    L.esfera(B, 0, 0, 0, 1.1, { gajos: 8, anillos: 5, sy: 0.6, col: [86, 156, 96], k: K.TRENCADIS });
    L.xf(B, vd, 0, 15.5, 0, 0.75, 2.1, 0.4 + (YS - 0.4) * 0.45 + 1.6);
    // ---- plaza alargada (estadio de 41 × 87 m) sobre la Sala Hipòstila; plana a PY (el terreno del juego sube por detrás y
    //      tapa el extremo NO)
    const PCX = -3.5, PCZ = 78, R = 20.5, HL = 23, pl = [];
    for (let i = 0; i <= 12; i++) { const a = PI + PI * i / 12; pl.push([PCX + Math.cos(a) * R, PCZ - HL + Math.sin(a) * R]); }      // extremo SE (−Z)
    for (let i = 0; i <= 12; i++) { const a = PI * i / 12; pl.push([PCX + Math.cos(a) * R, PCZ + HL + Math.sin(a) * R]); }          // extremo NO
    L.poly(B, pl.map(p => [p[0], PY, p[1]]), [214, 200, 172], K.LISO);
    // muro de contención (salvo bajo la columnata del extremo SE) y el banco serpenteante de trencadís
    const FR = [[230, 226, 214], [64, 120, 190], [214, 178, 64], [86, 156, 96], [200, 80, 60]];
    for (let i = 0; i < pl.length; i++) { const a = pl[i], b = pl[(i + 1) % pl.length];
      const front = a[1] < PCZ - HL + 2 && b[1] < PCZ - HL + 2;
      const ya = Math.min(gy(a[0], a[1]), PY) - 1, yb = Math.min(gy(b[0], b[1]), PY) - 1;
      if (!front) L.q4(B, [a[0], ya, a[1]], [b[0], yb, b[1]], [b[0], PY, b[1]], [a[0], PY, a[1]], PEDRA, K.PIEDRA, L.aux.piedra(0.5, 0.7)); }
    // banco: recorre el contorno del extremo SE y los lados hasta z ≈ 95, ondulando hacia dentro y hacia fuera
    const ban = [];
    for (let i = 0; i < pl.length; i++) if (pl[i][1] < 96) ban.push(pl[i]);
    const ben = [];
    for (let i = 0; i + 1 < ban.length; i++) { const a = ban[i], b = ban[i + 1], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.3));
      for (let j = 0; j < n; j++) ben.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]); }
    for (let i = 0; i + 1 < ben.length; i++) {
      const w = j => { const p = ben[j], dx = p[0] - PCX, dz = p[1] - Math.max(PCZ - HL, Math.min(PCZ + HL, p[1])), l = Math.hypot(dx, dz) || 1, o = 0.9 * Math.sin(j * 0.9) - 0.6; return [p[0] + dx / l * o, p[1] + dz / l * o]; };
      const a = w(i), b = w(i + 1), col = FR[Math.floor(i / 3) % FR.length];
      L.q4(B, [a[0], PY - 0.6, a[1]], [b[0], PY - 0.6, b[1]], [b[0], PY + 1.05, b[1]], [a[0], PY + 1.05, a[1]], col, K.TRENCADIS);
    }
    // ---- Sala Hipòstila: columnas dóricas blancas bajo el extremo SE de la plaza, fondo en sombra
    const ins = (x, z) => { const dz = Math.max(0, (PCZ - HL) - z); return Math.hypot(x - PCX, dz) < R - 1.6; };
    for (let zr = 0; zr < 4; zr++) for (let xi = -5; xi <= 5; xi++) {
      const x = PCX + xi * 4.2, z = PCZ - HL - 17.5 + zr * 5.2;
      if (!ins(x, z)) continue;
      L.tambor(B, x, z, Math.min(YS, gy(x, z)) - 0.5, PY - 1.7, zr === 0 ? 0.9 : 0.78, { lados: 8, col: BLANC, k: K.LISO });
      L.caja(B, x, z, PY - 1.8, 2.2, 2.2, 0.5, 0, BLANC, K.LISO);
    }
    L.caja(B, PCX, PCZ - HL + 2, YS - 1, 2 * R - 2, 1, PY - YS + 1, 0, [70, 64, 56], K.LISO);          // fondo de la sala
    L.caja(B, PCX, PCZ - HL - 10, YS - 0.6, 2 * R - 4, 22, 0.6, 0, [196, 186, 164], K.PIEDRA);         // suelo de la sala
    // cornisa ondulada blanca (con gárgolas) bajo el banco, en el frente de la columnata
    for (let i = 0; i < 12; i++) { const a0 = PI + PI * i / 12, a1 = PI + PI * (i + 1) / 12;
      const p = t => [PCX + Math.cos(t) * (R + 0.3), PCZ - HL + Math.sin(t) * (R + 0.3)], A = p(a0), Bp = p(a1);
      L.q4(B, [A[0], PY - 1.8, A[1]], [Bp[0], PY - 1.8, Bp[1]], [Bp[0], PY - 0.5, Bp[1]], [A[0], PY - 0.5, A[1]], CREMA, K.TRENCADIS); }
  } });

// ================================================================== RECINTE MODERNISTA DE SANT PAU
// Silueta: ciudad de pabellones de ladrillo rojo girada 45° respecto al Eixample, con cubiertas y cúpulas de cerámica de
// colores; el pabellón de la Administració, en V sobre la esquina de Sant Antoni M. Claret, con la torre del reloj.
// Rasgos: (1) ladrillo rojo; (2) cubiertas y cúpulas vidriadas verdes, ocres y azules; (3) la torre central de la entrada.
// Los pabellones se levantan sobre sus plantas reales (h.edif); la Administració, con sus alas y torres a mano.
add({ id: 'sant_pau', nombre: 'Recinte Modernista de Sant Pau', nivel: 'A', x: 12599.2, z: 16904.1, rot: 0, alto: 48, ancho: 200, largo: 300,
  noche: 'focos', edificios: ED.sant_pau,
  build(B, h, L) {
    const LAD = [176, 86, 62], PIE = [222, 206, 170], aL = L.aux.ladrillo(0.3, 0.6);
    const TEJ = [[78, 128, 98], [200, 160, 82], [92, 118, 150], [184, 110, 76], [104, 146, 120]];
    // rectángulo mínimo de una planta: { cx, cz, w (ancho), l (largo ≥ ancho), ang }
    function obb(pl) {
      let best = null;
      for (let a = 0; a < 90; a += 5) { const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
        let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
        for (const p of pl) { const u = p[0] * c - p[1] * s, v = p[0] * s + p[1] * c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
        const ar = (u1 - u0) * (v1 - v0);
        if (!best || ar < best.ar) { const um = (u0 + u1) / 2, vm = (v0 + v1) / 2; best = { ar, cx: um * c + vm * s, cz: -um * s + vm * c, w: u1 - u0, l: v1 - v0, ang: a }; } }
      if (best && best.w > best.l) { const t = best.w; best.w = best.l; best.l = t; best.ang += 90; }
      return best;
    }
    let n = 0;
    for (const e of h.edif) {
      const pl = e.plantas && e.plantas[0];
      if (!pl || pl.length < 3 || !(e.alto > e.y0 + 1) || e.b === 166388) continue;
      const y1 = e.alto, tc = TEJ[n++ % TEJ.length];
      L.prisma(B, pl, e.y0 - 0.6, y1, LAD, K.LADRILLO, { aux: aL, techo: L.shade(tc, 0.8) });
      const o = obb(pl); if (!o || o.w < 4) continue;
      L.caja(B, o.cx, o.cz, y1 - 0.9, o.w + 0.5, o.l + 0.5, 0.9, o.ang, PIE, K.PIEDRA);                 // cornisa de piedra
      L.cubierta(B, o.cx, o.cz, y1, o.w + 0.6, o.l + 0.6, Math.min(o.w, o.l) * 0.32, { tipo: 'cuatro', ang: o.ang, col: tc, k: K.TEJA });
      if (o.w * o.l > 150) {                                          // cúpula vidriada en el extremo que mira al eje del recinto
        const a = o.ang * Math.PI / 180, dx = Math.sin(a), dz = Math.cos(a);
        const sx = (o.cx + 5) * dx > 0 ? -1 : 1, d = (o.l / 2 - o.w * 0.3) * sx;
        const cx = o.cx + dx * d, cz = o.cz + dz * d, r = Math.min(4.2, o.w * 0.32), c2 = TEJ[(n + 2) % TEJ.length];
        L.tambor(B, cx, cz, y1, y1 + 2.4, r, { lados: 10, col: LAD, k: K.LADRILLO });
        L.cupula(B, cx, cz, y1 + 2.4, r * 1.08, r * 1.1, { lados: 10, anillos: 4, col: c2, k: K.TEJA, linterna: { r: r * 0.25, alto: r * 0.9, col: [214, 176, 80] } });
      }
    }
    // ---- Administració: planta real en V, alas con cubiertas a cuatro aguas, torre del reloj y cúpulas en los extremos
    const ad = h.edif.find(e => e.b === 166388);
    const y0 = ad ? ad.y0 - 0.6 : -8.9, y1 = ad ? ad.alto : 14.8;
    if (ad && ad.plantas[0] && ad.plantas[0].length > 2) L.prisma(B, ad.plantas[0], y0, y1, LAD, K.LADRILLO, { aux: aL, techo: [150, 110, 80] });
    else for (const [x, z, w, l, a] of [[-6, -93, 16, 20, 0], [-31, -101, 8, 30, 57], [17, -103.5, 8, 32, 118]]) L.caja(B, x, z, y0, w, l, y1 - y0, a, LAD, K.LADRILLO, { aux: aL });
    L.cubierta(B, -6, -93, y1, 16.6, 20.6, 5, { tipo: 'cuatro', col: TEJ[0], k: K.TEJA });
    L.cubierta(B, -31, -101, y1, 8.6, 30, 3.2, { tipo: 'cuatro', ang: 57, col: TEJ[1], k: K.TEJA });
    L.cubierta(B, 17, -103.5, y1, 8.6, 32, 3.2, { tipo: 'cuatro', ang: 118, col: TEJ[1], k: K.TEJA });
    for (const [x, z] of [[-43.5, -108.5], [30.5, -110]]) {
      L.tambor(B, x, z, y1 - 1, y1 + 3, 3.2, { lados: 10, col: PIE, k: K.PIEDRA });
      L.cupula(B, x, z, y1 + 3, 3.5, 4.2, { lados: 10, anillos: 4, col: TEJ[0], k: K.TEJA, linterna: { r: 0.8, alto: 3, col: [214, 176, 80] } });
    }
    // torre del reloj sobre la entrada (cara sur del cuerpo central)
    const tx = -6, tz = -100;
    L.caja(B, tx, tz, y0, 8.5, 8.5, y1 + 10 - y0, 0, LAD, K.LADRILLO, { aux: aL });
    L.caja(B, tx, tz, y1 + 9, 9.4, 9.4, 1.2, 0, PIE, K.PIEDRA);
    L.esfera(B, tx, y1 + 6, tz - 4.35, 1.4, { gajos: 10, anillos: 4, sy: 1, col: [236, 232, 220], k: K.LISO });   // esfera del reloj
    L.tambor(B, tx, tz, y1 + 10.2, y1 + 14.5, 3.4, { lados: 8, col: PIE, k: K.PIEDRA });
    L.aguja(B, tx, tz, y1 + 14.5, 11, 3.9, { lados: 8, pasos: 5, pot: 1, exp: 0.8, col: TEJ[0], cols: [[0, '#d6a640'], [0.5, '#4f9a72'], [1, '#3f7f9a']], k: K.TEJA, remate: { r: 0.5, col: [214, 176, 80] } });
  } });

})();
