/* GTA Barcelona — Interiores y planta baja (hook de facades.js).
   Todo lo que se construye entre la acera y la cota F1 de cada tramo de fachada: portal, comercios y ventanas de planta
   baja con reja; más el atlas de rótulos y la tabla de comercios.
   Los comercios se ven por dentro SIN geometría («interior mapping»): el quad del vidrio lleva el tipo K.SHOPWIN y su
   shader traza, por píxel, un rayo dentro de una habitación virtual (caja + capas de mobiliario en paralaje). Qué hay en
   cada comercio lo dice una fila de TYPES, que viaja al shader en una textura de parámetros (tShop).
   window.BCN_INTERIORS = { SHOPS, TYPES, force, paramData(), init(ctx) → { groundFloor(env, run), signTex } }.
   Contrato de env/run: DESARROLLO.md §6; comercios, empaquetado y capas del shader: §8.
   Tipos de material propios: ids 20–39, con BCN_GEO.regKind() al cargar el script. */
(function () {
'use strict';
const { K, regKind, quad, rect, jamb, hpl, box, lattice, shade, mixc, signAux, pbrAux, subAux, rev, sphere, R } = window.BCN_GEO;

// ------------------------------------------------------------------ tabla de comercios: una fila por tipo
// Vocabulario de las filas (los números son los que lee el shader):
const FL = { DAMERO: 0, TARIMA: 1, TERRAZO: 2, BALDOSA: 3 };                    // suelo
const LAMP = { FOCOS: 0, TUBOS: 1, CALIDA: 2 };                                  // luminarias del techo
const BACK = { LISO: 0, ESTANTES: 1, BOTELLERO: 2, ESPEJOS: 3, HERRAMIENTAS: 4, PIZARRAS: 5, PERCHERO: 6, GAFAS: 7, CUADROS: 8 };   // pared del fondo
const LY = { NADA: 0, MOSTRADOR: 1, BARRA: 2, MESAS: 3, MANTELES: 4, SILLONES: 5, LINEALES: 6, BURRAS: 7, ISLA: 8, CAJAS: 9, CUBOS: 10,
  TARIMA: 11, MANIQUIES: 12, CARTELES: 13, CRUZ: 14 };                           // capas de mobiliario (planos paralelos al vidrio)
const PAL = { VARIADO: 0, FARMACIA: 1, LIBROS: 2, BOTELLAS: 3, PAN: 4, FERRETERIA: 5, FRUTA: 6, QUESO: 7, FLORES: 8, ROPA: 9, HELADO: 10, GAFAS: 11 };   // colores del género
const SH = { CAJA: 0, REDONDO: 1, BOTELLA: 2, LOMO: 3, HERRAMIENTA: 4, GAFAS: 5, MIXTO: 6 };   // forma del género
// Cada fila: n rótulo (catalán) · w frecuencia relativa · sign [fondo, letra] del rótulo · awn color del toldo · wall pared ·
// floor [patrón, color A, color B] · warm calidez de la luz (0 fría … 1 cálida) · lamp luminarias · back [qué hay en la pared
// del fondo, color del mueble] · far / near / shelf [capa a ~3,1 m / a 1,7 m / repisa del escaparate a 0,4 m, color] ·
// acc color de acento · pal y shape: colores y forma del género. AÑADIR UN TIPO = AÑADIR UNA FILA (máx. 32; su índice es el tipo).
const TYPES = [
  { n: 'FORN DE PA', w: 10, sign: ['#6b3d14', '#f6e8c9'], awn: [150, 90, 40], wall: [226, 205, 170], floor: [FL.DAMERO, [176, 104, 72], [206, 160, 120]], warm: 0.85, lamp: LAMP.FOCOS,
    back: [BACK.ESTANTES, [150, 105, 60]], far: [LY.MOSTRADOR, [140, 96, 56]], near: [LY.NADA, [0, 0, 0]], shelf: [LY.TARIMA, [120, 84, 50]], acc: [200, 160, 90], pal: PAL.PAN, shape: SH.REDONDO },
  { n: 'FARMÀCIA', w: 5, sign: ['#0f6b3a', '#ffffff'], awn: [31, 110, 66], wall: [206, 214, 210], floor: [FL.BALDOSA, [214, 218, 220], [170, 176, 180]], warm: 0.15, lamp: LAMP.FOCOS,
    back: [BACK.ESTANTES, [200, 204, 200]], far: [LY.MOSTRADOR, [204, 208, 206]], near: [LY.ISLA, [198, 200, 198]], shelf: [LY.CRUZ, [220, 224, 222]], acc: [40, 170, 80], pal: PAL.FARMACIA, shape: SH.CAJA },
  { n: 'FERRETERIA', w: 4, sign: ['#2b2b2f', '#f2c230'], awn: [60, 60, 66], wall: [168, 164, 156], floor: [FL.TERRAZO, [120, 116, 110], [156, 150, 140]], warm: 0.4, lamp: LAMP.TUBOS,
    back: [BACK.HERRAMIENTAS, [176, 140, 90]], far: [LY.MOSTRADOR, [96, 84, 70]], near: [LY.ISLA, [92, 92, 98]], shelf: [LY.TARIMA, [70, 70, 74]], acc: [200, 60, 40], pal: PAL.FERRETERIA, shape: SH.CAJA },
  { n: 'BAR', w: 13, sign: ['#7c1d22', '#f6e8c9'], awn: [166, 36, 33], wall: [98, 62, 44], floor: [FL.DAMERO, [44, 40, 38], [190, 180, 160]], warm: 1.0, lamp: LAMP.CALIDA,
    back: [BACK.BOTELLERO, [70, 42, 26]], far: [LY.BARRA, [84, 50, 30]], near: [LY.MESAS, [60, 40, 28]], shelf: [LY.NADA, [0, 0, 0]], acc: [220, 170, 70], pal: PAL.BOTELLAS, shape: SH.BOTELLA },
  { n: 'FRUITERIA', w: 7, sign: ['#2f6b1e', '#fff4c9'], awn: [46, 110, 50], wall: [214, 226, 200], floor: [FL.BALDOSA, [190, 186, 170], [140, 138, 128]], warm: 0.5, lamp: LAMP.TUBOS,
    back: [BACK.ESTANTES, [150, 120, 80]], far: [LY.CAJAS, [176, 140, 90]], near: [LY.NADA, [0, 0, 0]], shelf: [LY.CAJAS, [176, 140, 90]], acc: [80, 150, 60], pal: PAL.FRUTA, shape: SH.REDONDO },
  { n: 'LLIBRERIA', w: 4, sign: ['#1c2c52', '#f6e8c9'], awn: [38, 56, 107], wall: [200, 178, 140], floor: [FL.TARIMA, [130, 90, 54], [130, 90, 54]], warm: 0.8, lamp: LAMP.FOCOS,
    back: [BACK.ESTANTES, [110, 70, 40]], far: [LY.ISLA, [100, 66, 40]], near: [LY.NADA, [0, 0, 0]], shelf: [LY.TARIMA, [96, 64, 40]], acc: [150, 40, 40], pal: PAL.LIBROS, shape: SH.LOMO },
  { n: 'FLORISTERIA', w: 4, sign: ['#3d1c4c', '#f9e3ee'], awn: [120, 60, 110], wall: [222, 228, 214], floor: [FL.TERRAZO, [90, 96, 92], [130, 136, 130]], warm: 0.5, lamp: LAMP.FOCOS,
    back: [BACK.ESTANTES, [120, 130, 110]], far: [LY.CUBOS, [70, 80, 76]], near: [LY.NADA, [0, 0, 0]], shelf: [LY.CUBOS, [60, 70, 66]], acc: [200, 80, 120], pal: PAL.FLORES, shape: SH.REDONDO },
  { n: 'RESTAURANT', w: 9, sign: ['#3a1512', '#e9cf8a'], awn: [110, 30, 34], wall: [186, 150, 118], floor: [FL.TARIMA, [96, 64, 40], [96, 64, 40]], warm: 0.95, lamp: LAMP.CALIDA,
    back: [BACK.CUADROS, [90, 56, 36]], far: [LY.MANTELES, [70, 44, 30]], near: [LY.MANTELES, [70, 44, 30]], shelf: [LY.NADA, [0, 0, 0]], acc: [236, 232, 220], pal: PAL.BOTELLAS, shape: SH.BOTELLA },
  { n: 'PERRUQUERIA', w: 7, sign: ['#2b2b2f', '#f3d7e0'], awn: [60, 60, 66], wall: [210, 198, 200], floor: [FL.BALDOSA, [200, 196, 196], [150, 146, 148]], warm: 0.45, lamp: LAMP.FOCOS,
    back: [BACK.ESPEJOS, [40, 40, 44]], far: [LY.SILLONES, [30, 30, 34]], near: [LY.NADA, [0, 0, 0]], shelf: [LY.NADA, [0, 0, 0]], acc: [210, 120, 150], pal: PAL.VARIADO, shape: SH.BOTELLA },
  { n: 'MODA', w: 7, sign: ['#151517', '#f2f0ea'], awn: [219, 204, 168], wall: [212, 204, 190], floor: [FL.TARIMA, [190, 160, 120], [190, 160, 120]], warm: 0.6, lamp: LAMP.FOCOS,
    back: [BACK.PERCHERO, [200, 190, 170]], far: [LY.BURRAS, [160, 160, 165]], near: [LY.NADA, [0, 0, 0]], shelf: [LY.MANIQUIES, [226, 220, 210]], acc: [20, 20, 24], pal: PAL.ROPA, shape: SH.CAJA },
  { n: 'GELATERIA', w: 3, sign: ['#d9668a', '#ffffff'], awn: [230, 150, 170], wall: [190, 228, 214], floor: [FL.DAMERO, [240, 240, 236], [240, 170, 190]], warm: 0.5, lamp: LAMP.FOCOS,
    back: [BACK.PIZARRAS, [240, 236, 228]], far: [LY.MOSTRADOR, [244, 240, 232]], near: [LY.MESAS, [226, 150, 170]], shelf: [LY.NADA, [0, 0, 0]], acc: [240, 120, 150], pal: PAL.HELADO, shape: SH.REDONDO },
  { n: 'CAFÈ', w: 10, sign: ['#17594c', '#f6e8c9'], awn: [31, 77, 56], wall: [70, 92, 78], floor: [FL.TARIMA, [120, 84, 54], [120, 84, 54]], warm: 0.9, lamp: LAMP.CALIDA,
    back: [BACK.PIZARRAS, [84, 56, 36]], far: [LY.MOSTRADOR, [96, 64, 40]], near: [LY.MESAS, [70, 48, 32]], shelf: [LY.NADA, [0, 0, 0]], acc: [230, 200, 140], pal: PAL.PAN, shape: SH.REDONDO },
  { n: 'QUEVIURES', w: 10, sign: ['#5c3b16', '#f6e8c9'], awn: [166, 36, 33], wall: [226, 214, 180], floor: [FL.DAMERO, [206, 196, 174], [150, 70, 56]], warm: 0.7, lamp: LAMP.TUBOS,
    back: [BACK.ESTANTES, [140, 100, 60]], far: [LY.MOSTRADOR, [130, 92, 56]], near: [LY.NADA, [0, 0, 0]], shelf: [LY.TARIMA, [120, 86, 54]], acc: [190, 60, 40], pal: PAL.VARIADO, shape: SH.MIXTO },
  { n: 'ÒPTICA', w: 3, sign: ['#1a4f8a', '#ffffff'], awn: [38, 56, 107], wall: [212, 212, 208], floor: [FL.BALDOSA, [206, 208, 210], [160, 162, 166]], warm: 0.2, lamp: LAMP.FOCOS,
    back: [BACK.GAFAS, [214, 214, 210]], far: [LY.MOSTRADOR, [204, 204, 200]], near: [LY.ISLA, [198, 200, 202]], shelf: [LY.TARIMA, [236, 236, 232]], acc: [30, 90, 160], pal: PAL.GAFAS, shape: SH.GAFAS },
  { n: 'PAPERERIA', w: 4, sign: ['#b8401c', '#fff4c9'], awn: [219, 204, 168], wall: [200, 216, 232], floor: [FL.BALDOSA, [196, 190, 176], [150, 146, 136]], warm: 0.5, lamp: LAMP.TUBOS,
    back: [BACK.ESTANTES, [220, 220, 214]], far: [LY.MOSTRADOR, [70, 110, 160]], near: [LY.ISLA, [210, 206, 196]], shelf: [LY.TARIMA, [60, 100, 150]], acc: [230, 180, 40], pal: PAL.VARIADO, shape: SH.CAJA },
  { n: 'FORMATGERIA', w: 3, sign: ['#6b5a1e', '#fff4c9'], awn: [150, 120, 40], wall: [232, 220, 188], floor: [FL.DAMERO, [220, 210, 190], [80, 68, 56]], warm: 0.8, lamp: LAMP.FOCOS,
    back: [BACK.ESTANTES, [130, 92, 54]], far: [LY.MOSTRADOR, [228, 224, 212]], near: [LY.NADA, [0, 0, 0]], shelf: [LY.TARIMA, [120, 84, 50]], acc: [200, 150, 40], pal: PAL.QUESO, shape: SH.REDONDO },
  // solo en comercios anchos (lo decide shopPlan): w = 0 lo deja fuera del sorteo general
  { n: 'SUPERMERCAT', w: 0, sign: ['#c8201c', '#ffffff'], awn: [166, 36, 33], wall: [204, 208, 206], floor: [FL.BALDOSA, [222, 222, 216], [170, 170, 166]], warm: 0.05, lamp: LAMP.TUBOS,
    back: [BACK.ESTANTES, [184, 188, 190]], far: [LY.LINEALES, [190, 192, 194]], near: [LY.NADA, [0, 0, 0]], shelf: [LY.CARTELES, [0, 0, 0]], acc: [220, 40, 40], pal: PAL.VARIADO, shape: SH.MIXTO },
];
const SHOPS = TYPES.map(t => t.n), SUPER = SHOPS.indexOf('SUPERMERCAT');
const WSUM = TYPES.reduce((s, t) => s + t.w, 0);
const pickType = r => { let x = r * WSUM; for (let i = 0; i < TYPES.length; i++) { x -= TYPES[i].w; if (x < 0) return i; } return 0; };
// colores del género: 8 por paleta (repetir un color le da más peso). La paleta 0 (VARIADO) es un arcoíris que hace el shader
const PALS = { [PAL.FARMACIA]: [[240, 245, 242], [240, 245, 242], [236, 240, 244], [244, 244, 238], [240, 245, 242], [170, 215, 180], [160, 200, 230], [235, 170, 190]],
  [PAL.LIBROS]: [[110, 40, 30], [40, 60, 100], [150, 120, 60], [60, 90, 60], [170, 150, 120], [90, 30, 60], [30, 40, 50], [190, 80, 40]],
  [PAL.BOTELLAS]: [[26, 61, 31], [26, 61, 31], [20, 50, 30], [107, 51, 15], [107, 51, 15], [90, 40, 12], [158, 168, 153], [150, 160, 150]],
  [PAL.PAN]: [[168, 102, 41], [190, 125, 55], [210, 150, 75], [225, 170, 95], [237, 189, 107], [200, 140, 60], [180, 110, 50], [230, 180, 110]],
  [PAL.FERRETERIA]: [[115, 120, 128], [115, 120, 128], [100, 104, 110], [191, 41, 26], [191, 41, 26], [230, 173, 26], [230, 173, 26], [31, 77, 140]],
  [PAL.FRUTA]: [[204, 31, 20], [204, 31, 20], [242, 133, 15], [242, 133, 15], [237, 204, 36], [92, 153, 36], [92, 153, 36], [102, 31, 87]],
  [PAL.QUESO]: [[242, 214, 122], [242, 214, 122], [242, 214, 122], [235, 200, 100], [235, 200, 100], [219, 128, 36], [219, 128, 36], [250, 235, 170]],
  [PAL.FLORES]: [[230, 64, 102], [230, 64, 102], [245, 209, 51], [245, 242, 235], [148, 77, 191], [230, 51, 31], [245, 140, 40], [245, 170, 190]],
  [PAL.ROPA]: [[23, 23, 28], [23, 23, 28], [204, 189, 158], [204, 189, 158], [31, 46, 87], [128, 31, 41], [199, 153, 41], [120, 120, 125]],
  [PAL.HELADO]: [[245, 168, 189], [245, 168, 189], [168, 209, 133], [247, 235, 184], [247, 235, 184], [92, 56, 36], [250, 184, 66], [230, 90, 110]],
  [PAL.GAFAS]: [[18, 15, 15], [18, 15, 15], [18, 15, 15], [18, 15, 15], [18, 15, 15], [107, 61, 26], [107, 61, 26], [107, 61, 26]] };
// textura de datos del shader: 16 columnas × 32 filas RGBA8. Columnas 0–7, parámetros del tipo (fila = tipo): 0 pared + patrón
// de suelo · 1 suelo A + calidez · 2 suelo B + luminarias · 3 mueble del fondo + qué hay al fondo · 4, 5, 6 color + id de las
// capas lejana, cercana y repisa · 7 acento + (paleta + 16·forma). Columnas 8–15, los 8 colores de cada paleta (fila = paleta)
const PARW = 16, PARH = 32;
function paramData() {
  const d = new Uint8Array(PARW * PARH * 4), put = (r, c, rgb, a) => d.set([rgb[0], rgb[1], rgb[2], a], (r * PARW + c) * 4);
  TYPES.forEach((t, r) => {
    put(r, 0, t.wall, t.floor[0]); put(r, 1, t.floor[1], Math.round(t.warm * 255)); put(r, 2, t.floor[2], t.lamp); put(r, 3, t.back[1], t.back[0]);
    put(r, 4, t.far[1], t.far[0]); put(r, 5, t.near[1], t.near[0]); put(r, 6, t.shelf[1], t.shelf[0]); put(r, 7, t.acc, t.pal + 16 * t.shape); });
  for (const k in PALS) PALS[k].forEach((c, i) => put(+k, 8 + i, c, 255));
  return d;
}
// depuración: ?shop=<índice o nombre> fuerza el tipo de todos los comercios (también BCN_INTERIORS.force = n y reconstruir)
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();
function parseForce() {
  let q = null; try { q = new URLSearchParams(location.search).get('shop'); } catch (e) { /* sin URL */ }
  if (q === null || q === '') return -1;
  if (/^\d+$/.test(q)) return Math.min(TYPES.length - 1, +q);
  const k = norm(q), i = SHOPS.findIndex(s => norm(s).startsWith(k));
  return i;
}

// ------------------------------------------------------------------ shader del escaparate (tipo K.SHOPWIN)
// Empaquetado por vértice (lo escribe glassQuad): color.r = ancho del local/16 m · color.g = tipo (5 bits) + 32·sentido del
// marco + 64·es la puerta · color.b = semilla · aux.x = u/ancho · aux.y = (y sobre el suelo + 1)/6 m · aux.z = alto/8 m ·
// aux.w = fondo/16,32 m (nunca 255: es la marca de sustituto).
// Funciones reutilizables (prefijo «sh»): shRoom() devuelve lo que se ve dentro de la habitación y shGlass() le pone el vidrio.
const SHOP_DECL = `
uniform sampler2D tShop;
// textura de datos: columnas 0-7 parámetros del tipo (fila = tipo), columnas 8-15 colores de cada paleta (fila = paleta)
vec4 shPar(float c, float t){ return texture2D(tShop, vec2((c + 0.5)/16.0, (t + 0.5)/32.0)); }
// cobertura suavizada (px = metros por píxel): rectángulo [a, b], círculo de radio r y trapecio simétrico de y0 a y1
float shR(vec2 p, vec2 a, vec2 b, float px){ vec2 d = min(p - a, b - p); return clamp(min(d.x, d.y)/px + 0.5, 0.0, 1.0); }
float shC(vec2 p, float r, float px){ return clamp((r - length(p))/px + 0.5, 0.0, 1.0); }
float shT(vec2 q, float y0, float y1, float w0, float w1, float px){ float w = mix(w0, w1, clamp((q.y - y0)/(y1 - y0), 0.0, 1.0));
  return clamp(min(min(q.y - y0, y1 - q.y), w - abs(q.x))/px + 0.5, 0.0, 1.0); }
float shS(float x, float px){ return clamp(x/px + 0.5, 0.0, 1.0); }
// las capas se componen con alfa premultiplicado
vec4 shOv(vec4 d, vec3 c, float a){ return vec4(c*a, a) + d*(1.0 - a); }
float shPitch(float s){ return s < 0.5 ? 0.15 : (s < 1.5 ? 0.24 : (s < 2.5 ? 0.10 : (s < 3.5 ? 0.045 : (s < 5.5 ? 0.24 : 0.13)))); }
// color de un artículo: la paleta 0 es un arcoíris apagado (un tercio, en tonos de cartón y papel) y las demás salen de la textura (8 colores por paleta)
vec3 shPal(float pal, float h){
  if (pal < 0.5) return mix(vec3(0.62, 0.58, 0.52), 0.52 + 0.35*cos(6.2832*(h + vec3(0.0, 0.33, 0.67))), step(0.35, fract(h*3.3))*0.75);
  return shPar(8.0 + floor(fract(h*5.71 + 0.13)*8.0), pal).rgb*(0.86 + 0.26*fract(h*13.7));
}
// fila de artículos de pie sobre y = 0 (p en metros), uno cada pitch metros y de hasta hm de alto.
// Formas: 0 caja con etiqueta · 1 redondo (pan, fruta, queso) · 2 botella · 3 lomo de libro · 4 herramienta colgada (y hacia abajo) · 5 gafas · 6 cajas y botellas
// OJO: cada llamada se copia entera al compilar. Las funciones de abajo preparan los argumentos y la llaman UNA vez cada una
vec4 shItems(vec2 p, float pitch, float hm, float shape, float pal, float sd, float px){
  if (p.y < -px || p.y > hm + px) return vec4(0.0);
  // de lejos los artículos se agrupan en bloques de al menos píxel y medio de ancho: manchas de color estables, sin parpadeo
  float grp = exp2(ceil(log2(max(px/pitch*1.6, 1.0))));
  if (grp > 1.5) { pitch *= grp; if (shape < 4.5) shape = 0.0; }
  float xi = p.x/pitch, i = floor(xi), fx = fract(xi) - 0.5, ax = abs(fx), e = px/pitch;
  float h1 = hash21(vec2(i, sd)), h2 = hash21(vec2(i + 7.0, sd + 2.3)), h3 = fract(h1*37.7 + h2*3.1);
  if (shape > 5.5) shape = h3 < 0.55 ? 0.0 : 2.0;
  vec3 col = shPal(pal, h1);
  float hh = hm*(0.62 + 0.38*h2), wy = p.y/hh, m;
  if (shape < 0.5) {
    m = clamp((0.30 + 0.14*h3 - ax)/e + 0.5, 0.0, 1.0);
    if (pal < 8.5 || pal > 9.5) col = mix(col, vec3(0.93, 0.92, 0.88), 0.6*step(0.35, wy)*step(wy, 0.7)*step(0.45, h3)*step(grp, 1.5));
    col *= 0.86 + 0.28*fx;
  } else if (shape < 1.5) {
    hh = min(hm, pitch*(0.55 + 0.3*h2)); wy = p.y/hh;
    vec2 q = vec2(fx/0.46, wy*2.0 - 1.0); float dq = length(q);
    m = clamp((1.0 - dq)/(e/0.46) + 0.5, 0.0, 1.0);
    col *= 0.70 + 0.45*(1.0 - dq*dq) + 0.25*(1.0 - smoothstep(0.0, 0.5, length(q - vec2(-0.3, 0.35))));
  } else if (shape < 2.5) {
    float w = mix(0.30, 0.10, smoothstep(0.55, 0.72, wy));
    m = clamp((w - ax)/e + 0.5, 0.0, 1.0);
    col = mix(col, vec3(0.90, 0.86, 0.72), step(0.2, wy)*step(wy, 0.46)*step(0.3, h3));
    col += 0.25*(1.0 - smoothstep(0.0, 0.06, abs(fx + 0.12)));
  } else if (shape < 3.5) {
    hh = hm*(0.74 + 0.26*h2); wy = p.y/hh;
    m = clamp((0.47 - ax)/e + 0.5, 0.0, 1.0);
    col = mix(col, vec3(0.85, 0.75, 0.45), step(0.72, wy)*step(wy, 0.82)*step(0.5, h3))*(0.8 + 0.2*cos(fx*6.2832));
  } else if (shape < 4.5) {
    float w = h3 < 0.5 ? (wy < 0.28 ? 0.36 : 0.08) : ((wy < 0.14 || wy > 0.86) ? 0.17 : 0.07);
    m = clamp((w - ax)/e + 0.5, 0.0, 1.0);
    if (h3 >= 0.5 || wy < 0.28) col = vec3(0.62, 0.64, 0.67);
  } else {
    hh = hm; wy = p.y/hh;
    vec2 q = vec2(ax - 0.22, (p.y - hm*0.5)/pitch); float rq = length(q);
    m = clamp((0.035 - abs(rq - 0.15))/e + 0.5, 0.0, 1.0);
    m = max(m, clamp((0.02 - abs(q.y - 0.03))/e + 0.5, 0.0, 1.0)*step(ax, 0.08));
    m = max(m, 0.35*step(rq, 0.15));
  }
  m *= clamp(p.y/px + 0.5, 0.0, 1.0)*clamp((hh - p.y)/px + 0.5, 0.0, 1.0);
  return vec4(col*m, m);
}
// UNA PARED con lo que lleve: la del fondo, las laterales y las caras de las góndolas. q = (x, y) sobre la pared, ww = su
// ancho, x0 = tramo libre al principio (las laterales no llevan estantes en el primer metro), gon = 1 en una góndola.
// Cada rama prepara el fondo (c), su fila de artículos (i…) y lo que va por delante (ov), y al final se pinta todo de una vez
vec3 shBack(float id, vec2 q, float ww, float x0, float gon, vec3 wall, vec3 furn, vec3 acc, float shape, float pal, float sd, float px){
  vec3 c = wall*(q.y < 0.1 ? 0.6 : (q.y < 0.95 ? 0.88 : (q.y < 1.0 ? 1.06 : 1.0)));
  vec2 ip = vec2(0.0, -9.0); float ipit = shPitch(shape), ihm = 0.3, ish = shape, ipal = pal, isd = sd, im = 1.0;
  vec4 ov = vec4(0.0);
  if (id < 0.5) { if (gon > 0.5) c = wall; }
  else if (id < 1.5) {
    // 1 estanterías llenas de pared a pared, con un friso de color encima (en una góndola, el mueble entero)
    float mg = gon > 0.5 ? 0.0 : 0.12, rh = gon > 0.5 ? 0.36 : 0.4;
    vec2 u = vec2(q.x - x0 - mg, q.y), usz = vec2(ww - x0 - 2.0*mg, gon > 0.5 ? 1.8 : 2.3);
    float a = shR(u, vec2(0.0), usz, px), r = floor(u.y/rh), y = u.y - r*rh, lv = smoothstep(0.03, 0.12, px);
    c = mix(c, furn*0.40*mix(1.0, 0.6, smoothstep(rh*0.45, rh, y)), a);
    ip = vec2(u.x + r*0.37, y - 0.04); ipit *= 0.85 + 0.3*hash21(vec2(r, sd)); ihm = rh - 0.10; isd = sd + r*3.1; im = a;
    float mw = usz.x/max(1.0, floor(usz.x/1.05 + 0.5)), mx = abs(fract(u.x/mw + 0.5) - 0.5)*mw;
    ov = shOv(ov, furn, a*(1.0 - smoothstep(0.04 - px, 0.04 + px, y))*(1.0 - 0.5*lv));
    ov = shOv(ov, furn*0.9, a*(1.0 - smoothstep(0.025 - px, 0.025 + px, mx))*(1.0 - lv));
    if (gon < 0.5) ov = shOv(ov, acc, 0.85*shR(q, vec2(x0 + 0.12, 2.45), vec2(ww - 0.12, 2.68), px));
  } else if (id < 2.5) {
    // 2 botellero retroiluminado sobre un mueble bajo
    float r = floor((q.y - 1.02)/0.46), y = q.y - 1.02 - r*0.46, a = shR(q, vec2(0.5, 1.02), vec2(ww - 0.5, 2.40), px);
    c = mix(wall*0.8, mix(vec3(1.05, 0.74, 0.36), vec3(1.35, 1.10, 0.70), smoothstep(0.0, 0.46, y)), a);
    ip = vec2(q.x + r*0.031, y - 0.03); ipit = 0.105; ihm = 0.37; ish = 2.0; ipal = 3.0; isd = sd + r; im = a;
    ov = shOv(ov, vec3(1.5, 1.4, 1.2), a*(1.0 - smoothstep(0.012, 0.012 + px, abs(y - 0.015))));
    ov = shOv(ov, furn*(0.7 + 0.3*step(0.05, fract(q.x/0.7))), shR(q, vec2(0.3, 0.0), vec2(ww - 0.3, 0.95), px));
  } else if (id < 3.5) {
    // 3 espejos con marco de bombillas y repisa
    float cw = ww/max(1.0, floor(ww/1.6)), cx = (fract(q.x/cw) - 0.5)*cw;
    vec2 m = vec2(cx, q.y - 1.6);
    c = mix(c, furn, shR(m, vec2(-0.44, -0.64), vec2(0.44, 0.64), px));
    c = mix(c, mix(vec3(0.50, 0.58, 0.62), vec3(0.86, 0.90, 0.92), smoothstep(-0.6, 0.6, m.y + m.x*0.6)), shR(m, vec2(-0.36, -0.56), vec2(0.36, 0.56), px));
    float ds = length(vec2(abs(m.x) - 0.40, (fract(m.y/0.16) - 0.5)*0.16)), dtp = length(vec2((fract(m.x/0.16) - 0.5)*0.16, m.y - 0.60));
    float db = min(ds + step(0.62, abs(m.y)), dtp + step(0.42, abs(m.x)));
    c += vec3(1.0, 0.92, 0.72)*(3.0*clamp((0.03 - db)/px + 0.5, 0.0, 1.0) + 0.5*exp(-db*db*500.0));
    ov = shOv(ov, furn*1.4, shR(q, vec2(0.2, 0.80), vec2(ww - 0.2, 0.86), px));
  } else if (id < 4.5) {
    // 4 panel perforado con herramientas colgadas, sobre cajoneras
    float r = floor((q.y - 1.0)/0.5), a = shR(q, vec2(0.3, 1.0), vec2(ww - 0.3, 2.5), px);
    c = mix(c, furn*(1.0 - 0.22*(1.0 - smoothstep(0.008, 0.012 + px, length(fract(q/0.05) - 0.5)*0.05))*(1.0 - smoothstep(0.008, 0.03, px))), a);
    ip = vec2(q.x + r*0.11, 0.46 - (q.y - 1.0 - r*0.5)); ipit = 0.21; ihm = 0.42; ish = 4.0; ipal = 5.0; isd = sd + r*2.0; im = a;
    vec2 g = fract(q/vec2(0.3, 0.18));
    ov = shOv(ov, vec3(0.42, 0.45, 0.48)*(0.72 + 0.28*step(0.08, g.x)*step(0.12, g.y)), shR(q, vec2(0.3, 0.0), vec2(ww - 0.3, 0.92), px));
  } else if (id < 5.5) {
    // 5 pizarras con la carta, balda de tarros, mueble bajo y cafetera
    float cw = ww/max(1.0, floor(ww/1.5)), cx = (fract(q.x/cw) - 0.5)*cw, mx = ww*0.3;
    vec2 m = vec2(cx, q.y - 2.3);
    float ln = step(0.55, fract(m.y/0.11))*step(0.35, vnoise(vec2(q.x*30.0, floor(m.y/0.11)*7.0 + sd)))*step(abs(cx), cw*0.5 - 0.25);
    c = mix(c, mix(vec3(0.07, 0.09, 0.08), vec3(0.85), ln*0.7*(1.0 - smoothstep(0.008, 0.035, px))), shR(m, vec2(-cw*0.5 + 0.12, -0.38), vec2(cw*0.5 - 0.12, 0.38), px));
    ip = vec2(q.x, q.y - 1.42); ipit = 0.14; ihm = 0.26; ish = 0.0; ipal = 0.0; isd = sd + 4.0;
    ov = shOv(ov, furn*1.25, shR(q, vec2(0.2, 1.37), vec2(ww - 0.2, 1.42), px));
    ov = shOv(ov, furn, shR(q, vec2(0.2, 0.0), vec2(ww - 0.2, 0.92), px));
    ov = shOv(ov, vec3(0.72, 0.73, 0.75)*(0.8 + 0.3*step(1.12, q.y)), shR(q, vec2(mx, 0.92), vec2(mx + 0.7, 1.32), px));
  } else if (id < 6.5) {
    // 6 barra con ropa colgada y, encima, balda de prendas dobladas
    float up = step(1.9, q.y);
    ip = up > 0.5 ? vec2(q.x, q.y - 2.05) : vec2(q.x, 1.72 - q.y); ipit = up > 0.5 ? 0.34 : 0.16; ihm = up > 0.5 ? 0.2 : 0.95;
    ish = 0.0; ipal = 9.0; isd = sd + up*3.0; im = shR(q, vec2(0.3, -1.0), vec2(ww - 0.3, 9.0), px);
    ov = shOv(ov, vec3(0.75), shR(q, vec2(0.3, 1.72), vec2(ww - 0.3, 1.75), px));
    ov = shOv(ov, furn, shR(q, vec2(0.3, 2.0), vec2(ww - 0.3, 2.05), px));
  } else if (id < 7.5) {
    // 7 paneles retroiluminados con filas de gafas
    float cw = ww/max(1.0, floor(ww/1.3)), ci = floor(q.x/cw);
    vec2 m = vec2(q.x - ci*cw - 0.15, q.y - 0.85);
    float r = floor(m.y/0.25), y = m.y - r*0.25, a = shR(m, vec2(0.0), vec2(cw - 0.3, 1.5), px);
    c = mix(c, vec3(1.22, 1.24, 1.20), a);
    ip = vec2(m.x + 0.03, y - 0.06); ipit = 0.26; ihm = 0.15; ish = 5.0; ipal = 11.0; isd = sd + r + ci*5.0; im = a;
    ov = shOv(ov, vec3(0.78), a*0.7*(1.0 - smoothstep(0.012, 0.012 + px, abs(y - 0.045))));
  } else {
    // 8 cuadros y arrimadero de madera
    float ci = floor(q.x/1.5), cx = (fract(q.x/1.5) - 0.5)*1.5, hq = hash21(vec2(ci, sd));
    vec2 hs = vec2(0.32 + 0.2*hq, 0.26 + 0.22*fract(hq*7.7)), m = vec2(cx, q.y - 1.8);
    vec3 pa = 0.45 + 0.25*cos(6.2832*(hq + vec3(0.0, 0.33, 0.67))), pb = 0.40 + 0.25*cos(6.2832*(hq + vec3(0.35, 0.68, 1.02)));
    c = mix(c, furn*0.7, shR(m, -hs, hs, px));
    c = mix(c, mix(pa, pb, smoothstep(-hs.y, hs.y, m.y + 0.3*sin(m.x*9.0))), shR(m, -hs + 0.04, hs - 0.04, px));
    ov = shOv(ov, furn*(0.8 + 0.2*step(0.04, fract(q.x/0.5))), shR(q, vec2(0.0), vec2(ww, 1.0), px));
    ov = shOv(ov, furn*1.3, shR(q, vec2(0.0, 1.0), vec2(ww, 1.05), px));
  }
  vec4 it = shItems(ip, ipit, ihm, ish, ipal, isd, px)*im;
  c = c*(1.0 - it.a) + it.rgb;
  return c*(1.0 - ov.a) + ov.rgb;
}
// capa de mobiliario en un plano paralelo al vidrio: p = (x, y) en metros, W = ancho del local. Color premultiplicado + alfa.
// Como shBack: cada rama pinta lo de detrás (o), prepara su fila de artículos (i…) y lo de delante (ov)
vec4 shLayer(float id, vec2 p, float W, vec3 col, vec3 acc, float shape, float pal, float sd, float px){
  vec4 o = vec4(0.0), ov = vec4(0.0);
  if (id < 0.5 || p.y > 2.9) return o;
  vec2 ip = vec2(0.0, -9.0); float ipit = shPitch(shape), ihm = 0.3, ish = shape, ipal = pal, isd = sd, im = 1.0;
  if (id < 1.5) {
    // 1 mostrador con vitrina de vidrio (género en dos alturas) y caja registradora
    float L = clamp(W - 1.4, 1.2, 3.6), x0 = hash21(vec2(sd, 1.7)) < 0.5 ? 0.6 : W - 0.6 - L, vx = L*0.66;
    vec2 q = vec2(p.x - x0, p.y);
    vec3 c = col*(0.78 + 0.22*step(0.05, fract(q.x/0.6)));
    c = mix(c, col*0.45, step(q.y, 0.1));
    c = mix(c, min(col*1.35 + 0.08, vec3(1.0)), step(0.87, q.y));
    o = shOv(o, c, shR(q, vec2(0.0), vec2(L, 0.92), px));
    float a = shR(q, vec2(0.12, 0.92), vec2(vx, 1.38), px), up = step(1.16, q.y);
    o = shOv(o, vec3(0.86, 0.92, 0.92), a);
    ip = vec2(q.x + up*0.07, q.y - 0.95 - up*0.22); ihm = 0.16; isd = sd + 5.0 + up*4.0; im = a;
    ov = shOv(ov, vec3(0.97), a*(1.0 - smoothstep(0.012, 0.012 + px, min(abs(q.y - 1.15), abs(q.y - 1.37)))));
    ov = shOv(ov, vec3(0.13, 0.13, 0.15), shR(q, vec2(vx + 0.3, 0.92), vec2(vx + 0.72, 1.2), px));
  } else if (id < 2.5) {
    // 2 barra de bar con reposapiés de latón y taburetes delante
    vec2 q = vec2(p.x - 0.7, p.y); float L = W - 1.4;
    vec3 c = col*(0.75 + 0.25*step(0.04, fract(q.x/0.45)));
    c = mix(c, acc*0.9, 1.0 - smoothstep(0.012, 0.012 + px, abs(q.y - 0.22)));
    c = mix(c, col*1.5 + 0.05, step(1.06, q.y));
    o = shOv(o, c, shR(q, vec2(0.0), vec2(L, 1.12), px));
    vec2 s = vec2((fract(q.x/0.72) - 0.5)*0.72, q.y);
    float st = max(shR(s, vec2(-0.17, 0.72), vec2(0.17, 0.80), px), shR(s, vec2(-0.02, 0.0), vec2(0.02, 0.72), px));
    o = shOv(o, vec3(0.10, 0.09, 0.09), max(st, shR(s, vec2(-0.14, 0.26), vec2(0.14, 0.29), px))*step(0.0, q.x)*step(q.x, L));
  } else if (id < 4.5) {
    // 3 mesas y sillas · 4 lo mismo con mantel
    float cw = W/max(1.0, floor(W/1.9)), ci = floor(p.x/cw);
    vec2 q = vec2((fract(p.x/cw) - 0.5)*cw + (hash21(vec2(ci, sd)) - 0.5)*0.3, p.y), aq = vec2(abs(q.x), q.y);
    float ch = max(shR(aq, vec2(0.50, 0.42), vec2(0.90, 0.47), px), shR(aq, vec2(0.86, 0.42), vec2(0.90, 0.92), px));
    o = shOv(o, col, max(ch, max(shR(aq, vec2(0.51, 0.0), vec2(0.54, 0.42), px), shR(aq, vec2(0.86, 0.0), vec2(0.89, 0.42), px))));
    o = shOv(o, col*1.3, max(shR(q, vec2(-0.42, 0.72), vec2(0.42, 0.76), px), shR(q, vec2(-0.03, 0.0), vec2(0.03, 0.72), px)));
    if (id > 3.5) o = shOv(o, acc*(0.9 + 0.1*step(0.74, q.y)), shT(q, 0.42, 0.77, 0.47, 0.43, px));
    o = shOv(o, vec3(0.12, 0.22, 0.12), shR(q, vec2(-0.20, 0.77), vec2(-0.14, 1.03), px));
    o = shOv(o, vec3(0.90, 0.92, 0.92), 0.8*max(shR(q, vec2(0.02, 0.77), vec2(0.08, 0.90), px), shR(q, vec2(0.20, 0.77), vec2(0.26, 0.90), px)));
  } else if (id < 5.5) {
    // 5 sillones de peluquería, de espaldas, con pie cromado
    float cw = W/max(1.0, floor(W/1.6)); vec2 q = vec2((fract(p.x/cw) - 0.5)*cw, p.y);
    float m = max(shR(q, vec2(-0.30, 0.42), vec2(0.30, 0.60), px), shR(q, vec2(-0.26, 0.55), vec2(0.26, 1.18), px));
    m = max(m, shR(vec2(abs(q.x), q.y), vec2(0.28, 0.58), vec2(0.36, 0.78), px));
    o = shOv(o, col*(1.0 + 1.5*(1.0 - smoothstep(0.0, 0.2, abs(q.x + 0.1)))*step(0.6, q.y)), m);
    o = shOv(o, vec3(0.72, 0.74, 0.76), max(shR(q, vec2(-0.04, 0.08), vec2(0.04, 0.42), px), shR(q, vec2(-0.28, 0.0), vec2(0.28, 0.06), px)));
  } else if (id < 7.5) {
    // 7 burras con ropa colgada
    float cw = W/max(1.0, floor(W/2.3)), ci = floor(p.x/cw); vec2 q = vec2((fract(p.x/cw) - 0.5)*cw, p.y);
    ip = vec2(q.x + ci*0.31, 1.5 - q.y); ipit = 0.13; ihm = 0.85; ish = 0.0; ipal = 9.0; isd = sd + ci; im = step(abs(q.x), 0.72);
    ov = shOv(ov, vec3(0.70, 0.71, 0.73), max(shR(q, vec2(-0.78, 1.5), vec2(0.78, 1.53), px), shR(vec2(abs(q.x), q.y), vec2(0.75, 0.0), vec2(0.78, 1.53), px)));
  } else if (id < 8.5) {
    // 8 isla: mesa baja con género encima
    float cw = W/max(1.0, floor(W/2.6)), ci = floor(p.x/cw); vec2 q = vec2((fract(p.x/cw) - 0.5)*cw, p.y);
    o = shOv(o, col*(0.8 + 0.2*step(0.7, q.y)), shR(q, vec2(-0.72, 0.0), vec2(0.72, 0.78), px));
    ip = vec2(q.x + ci*0.4, q.y - 0.78); isd = sd + ci*3.0; im = step(abs(q.x), 0.68);
  } else if (id < 9.5) {
    // 9 caballete de cajas inclinadas: tres filas escalonadas, cada caja con una fruta
    float cw = 0.62, ci = floor(p.x/cw); vec2 q = vec2(fract(p.x/cw)*cw, p.y);
    float inx = shR(q, vec2(0.03, -1.0), vec2(cw - 0.03, 9.0), px);
    for (int k = 0; k < 3; k++) {
      float kk = 2.0 - float(k), y0 = 0.30 + 0.30*kk;
      vec3 fc = shPar(8.0 + floor(hash21(vec2(ci + kk*13.0, sd))*8.0), 6.0).rgb;
      vec2 f = vec2((fract(p.x/0.15 + kk*0.5) - 0.5)*0.15, p.y - y0 - 0.27);
      o = shOv(o, fc*(0.72 + 0.4*(1.0 - smoothstep(0.0, 0.07, length(f - vec2(-0.02, 0.02))))), shC(f, 0.07, px)*inx);
      f = vec2((fract(p.x/0.15 + kk*0.5 + 0.5) - 0.5)*0.15, f.y + 0.07);
      o = shOv(o, fc*(0.72 + 0.4*(1.0 - smoothstep(0.0, 0.07, length(f - vec2(-0.02, 0.02))))), shC(f, 0.07, px)*inx);
      o = shOv(o, col*(0.78 + 0.22*step(0.5, fract(p.y/0.07))), shR(q, vec2(0.02, y0), vec2(cw - 0.02, y0 + 0.2), px));
    }
    o = shOv(o, col*0.5, shR(q, vec2(0.04, 0.0), vec2(cw - 0.04, 0.3), px));
  } else if (id < 10.5) {
    // 10 cubos de flores
    float cw = 0.5, ci = floor(p.x/cw); vec2 q = vec2((fract(p.x/cw) - 0.5)*cw, p.y);
    float hq = hash21(vec2(ci, sd)), bh = 0.30 + 0.25*hq;
    float fl = mix(step(0.55, vnoise(p*38.0 + sd)), 0.45, smoothstep(0.012, 0.04, px));
    o = shOv(o, mix(vec3(0.16, 0.36, 0.14), shPar(8.0 + floor(hq*8.0), 8.0).rgb, fl), shC(vec2(q.x, (q.y - bh - 0.34)*0.8), 0.22, px*1.5));
    o = shOv(o, vec3(0.14, 0.30, 0.12), shR(q, vec2(-0.08, bh), vec2(0.08, bh + 0.2), px));
    o = shOv(o, col*(0.8 + 0.5*smoothstep(-0.15, 0.15, q.x)), shT(q, 0.0, bh, 0.12, 0.16, px));
  } else if (id < 11.5 || id > 13.5) {
    // 11 tarima de escaparate con género en dos alturas · 14 lo mismo con una cruz verde luminosa
    float ci = floor(p.x/1.3), up = step(0.5, hash21(vec2(ci, sd + 8.0))); vec2 q = vec2(fract(p.x/1.3)*1.3, p.y);
    o = shOv(o, col, shR(p, vec2(0.0), vec2(W, 0.5), px));
    o = shOv(o, col*1.2, up*shR(q, vec2(0.1, 0.5), vec2(0.9, 0.75), px));
    ip = vec2(p.x, p.y - 0.5 - 0.25*up*step(0.1, q.x)*step(q.x, 0.9)); ipit *= 1.6; ihm = 0.42; isd = sd + 21.0;
    if (id > 13.5) {
      vec2 m = vec2(p.x - (hash21(vec2(sd, 4.0)) < 0.5 ? 1.1 : W - 1.1), p.y - 2.35);
      ov = shOv(ov, vec3(0.15, 1.0, 0.35)*2.4, max(shR(m, vec2(-0.30, -0.10), vec2(0.30, 0.10), px), shR(m, vec2(-0.10, -0.30), vec2(0.10, 0.30), px)));
      ov.rgb += vec3(0.05, 0.6, 0.2)*0.5*exp(-dot(m, m)*7.0);
    }
  } else if (id < 12.5) {
    // 12 maniquíes sobre la tarima del escaparate: de cuerpo entero (pantalón con chaqueta o camiseta, o vestido) y bustos de
    // sastre con peana. Silueta: cabeza ovalada, cuello, hombros caídos, cintura, caderas, brazos algo abiertos y piernas separadas
    float cw = W/max(1.0, floor(W/1.5)), ci = floor(p.x/cw), hq = hash21(vec2(ci, sd)), h2 = fract(hq*7.31 + 0.17);
    vec2 q = vec2((fract(p.x/cw) - 0.5)*cw + (hq - 0.5)*0.3, p.y - 0.5), aq = vec2(abs(q.x), q.y);
    vec3 c1 = shPal(9.0, hq), c2 = shPal(9.0, fract(hq*3.7 + 0.2)), mq = acc*1.3 + 0.08;
    float rd = 0.84 + 0.30*(1.0 - smoothstep(0.0, 0.11, abs(q.x + 0.04))), lrd = 0.84 + 0.30*(1.0 - smoothstep(0.0, 0.05, abs(aq.x - 0.075)));
    o = shOv(o, col*0.9, shR(p, vec2(0.0), vec2(W, 0.5), px));
    float hip = max(shT(q, 0.80, 0.90, 0.158, 0.166, px), shT(q, 0.89, 1.03, 0.166, 0.124, px));
    float tor = max(max(shT(q, 1.02, 1.31, 0.124, 0.172, px), shT(q, 1.30, 1.43, 0.172, 0.200, px)), shT(q, 1.42, 1.49, 0.200, 0.050, px));
    float vn = shT(q, 1.30, 1.50, 0.0, 0.066, px);
    if (hq < 0.24) {
      o = shOv(o, vec3(0.17, 0.16, 0.16), max(shT(q, 0.0, 0.045, 0.20, 0.07, px), shR(q, vec2(-0.016, 0.0), vec2(0.016, 0.85), px)));
      o = shOv(o, vec3(0.80, 0.74, 0.62)*rd, max(hip, tor));
      o = shOv(o, c1*rd, max(tor, hip*step(0.5, h2))*(1.0 - vn));
      o = shOv(o, vec3(0.30, 0.20, 0.12), max(shR(q, vec2(-0.045, 1.48), vec2(0.045, 1.53), px), shC(q - vec2(0.0, 1.56), 0.034, px)));
    } else {
      float slv = step(0.5, h2), axc = mix(0.268, 0.224, smoothstep(0.80, 1.42, q.y));
      float leg = shT(vec2(aq.x - 0.088, q.y), 0.04, 0.88, 0.040, 0.080, px), arm = shT(vec2(aq.x - axc, q.y), 0.82, 1.45, 0.030, 0.052, px);
      float body = max(max(leg, arm), shC(vec2(aq.x - 0.270, (q.y - 0.79)*0.65), 0.034, px));
      o = shOv(o, mq*lrd, body);
      o = shOv(o, mq*rd, max(max(hip, tor), max(shC(vec2(q.x, (q.y - 1.665)*0.80), 0.088, px), shR(q, vec2(-0.040, 1.46), vec2(0.040, 1.60), px))));
      o = shOv(o, vec3(0.07, 0.06, 0.06), shR(aq, vec2(0.040, 0.0), vec2(0.150, 0.05), px));
      if (hq > 0.64) {
        o = shOv(o, c1*rd, max(tor*(1.0 - vn), shT(q, 0.40, 1.04, 0.26, 0.124, px)));
        o = shOv(o, c1*lrd, arm*slv*shS(q.y - 1.24, px));
      } else {
        o = shOv(o, c2*lrd, leg*shS(q.y - 0.07, px));
        o = shOv(o, c2*rd, hip);
        o = shOv(o, c1*rd, max(tor, hip*shS(q.y - 0.94, px)));
        o = shOv(o, c1*lrd, arm*shS(q.y - mix(1.24, 0.88, slv), px));
        o = shOv(o, vec3(0.90, 0.89, 0.86), vn*tor*slv);
        o = shOv(o, c1*0.55, slv*shR(q, vec2(-0.005, 0.94), vec2(0.005, 1.31), px));
      }
    }
  } else {
    // 13 carteles de oferta colgados tras el vidrio, arriba: papel, franja de color con el reclamo, dos líneas de texto y el
    // precio en grande (tres cifras de siete segmentos con su coma, acabado en 9)
    float ci = floor(p.x/1.7), hq = hash21(vec2(ci, sd)), h2 = fract(hq*9.7 + 0.3), lv = 1.0 - smoothstep(0.012, 0.05, px);
    vec2 q = vec2((fract(p.x/1.7) - 0.5)*1.7 + (hq - 0.5)*0.5, p.y - 2.2 - 0.3*fract(hq*5.3));
    vec3 band = h2 < 0.6 ? vec3(0.86, 0.12, 0.10) : (h2 < 0.8 ? vec3(0.10, 0.36, 0.70) : vec3(0.12, 0.52, 0.22));
    vec3 c = hq > 0.78 ? vec3(0.98, 0.86, 0.16) : vec3(0.97, 0.96, 0.92), ink = hq > 0.78 ? vec3(0.78, 0.08, 0.06) : band;
    float wd = shR(q, vec2(-0.27, 0.185), vec2(0.27, 0.255), px)*step(0.22, fract(q.x/0.09 + 0.1));
    c = mix(c, mix(band, vec3(0.98), wd*lv), shR(q, vec2(-0.41, 0.14), vec2(0.41, 0.31), px));
    float tl = max(shR(q, vec2(-0.32, 0.075), vec2(0.18, 0.10), px)*step(0.2, fract(q.x/0.13 + hq)), shR(q, vec2(-0.32, 0.03), vec2(0.02, 0.055), px)*step(0.25, fract(q.x/0.11 + h2)));
    c = mix(c, vec3(0.25), tl*0.8*lv);
    vec2 dg = vec2((q.x + 0.29)/0.19, (q.y + 0.25)/0.125), dp = vec2(fract(dg.x)*1.52, dg.y);
    float di = floor(dg.x), hn = hash21(vec2(ci*3.0 + di, sd + 5.0)), n = di < 0.5 ? 1.0 + floor(hn*5.0) : (di < 1.5 ? floor(hn*9.99) : 9.0), e = px/0.125;
    float mk = n < 0.5 ? 126.0 : (n < 1.5 ? 48.0 : (n < 2.5 ? 109.0 : (n < 3.5 ? 121.0 : (n < 4.5 ? 51.0 : (n < 5.5 ? 91.0 : (n < 6.5 ? 95.0 : (n < 7.5 ? 112.0 : (n < 8.5 ? 127.0 : 123.0))))))));
    float sg = max(max(mod(floor(mk/64.0), 2.0)*shR(dp, vec2(0.0, 1.78), vec2(1.0, 2.0), e), mod(floor(mk), 2.0)*shR(dp, vec2(0.0, 0.89), vec2(1.0, 1.11), e)), mod(floor(mk/8.0), 2.0)*shR(dp, vec2(0.0), vec2(1.0, 0.22), e));
    sg = max(sg, max(mod(floor(mk/2.0), 2.0)*shR(dp, vec2(0.0, 1.0), vec2(0.22, 2.0), e), mod(floor(mk/32.0), 2.0)*shR(dp, vec2(0.78, 1.0), vec2(1.0, 2.0), e)));
    sg = max(sg, max(mod(floor(mk/4.0), 2.0)*shR(dp, vec2(0.0), vec2(0.22, 1.0), e), mod(floor(mk/16.0), 2.0)*shR(dp, vec2(0.78, 0.0), vec2(1.0, 1.0), e)));
    sg = max(sg*step(0.0, dg.x)*step(dg.x, 3.0), shR(q, vec2(-0.150, -0.272), vec2(-0.118, -0.215), px));
    c = mix(c, ink, sg*(1.0 - smoothstep(0.03, 0.10, px)));
    o = shOv(o, c, step(0.35, hq)*shR(q, vec2(-0.41, -0.31), vec2(0.41, 0.31), px));
  }
  vec4 it = shItems(ip, ipit, ihm, ish, ipal, isd, px)*im;
  o = it + o*(1.0 - it.a);
  return ov + o*(1.0 - ov.a);
}
// HABITACIÓN VIRTUAL vista desde su vidrio. o = punto del vidrio (x a lo largo desde el extremo de la habitación, y sobre el
// suelo), d = rayo de vista en esos ejes (x, y, z hacia dentro), sz = (ancho, alto, fondo) en metros, tp = fila de parámetros,
// sd = semilla, px = metros por píxel sobre el vidrio, dist = distancia de la cámara al vidrio, door = 1 si se mira por la
// puerta (sin repisa de escaparate). Devuelve la luz propia del interior (las luminarias pasan de 1): va a emit(), sin sol
vec3 shRoom(vec2 o, vec3 d, vec3 sz, float tp, float sd, float px, float dist, float door){
  vec4 p0 = shPar(0.0, tp), p1 = shPar(1.0, tp), p2 = shPar(2.0, tp), p3 = shPar(3.0, tp), p4 = shPar(4.0, tp), p5 = shPar(5.0, tp), p6 = shPar(6.0, tp), p7 = shPar(7.0, tp);
  float fpat = floor(p0.a*255.0 + 0.5), lamp = floor(p2.a*255.0 + 0.5), idB = floor(p3.a*255.0 + 0.5), idF = floor(p4.a*255.0 + 0.5), idN = floor(p5.a*255.0 + 0.5), idS = floor(p6.a*255.0 + 0.5);
  float ps = floor(p7.a*255.0 + 0.5), shape = floor(ps/16.0), pal = ps - shape*16.0;
  vec3 tint = mix(vec3(0.90, 0.96, 1.04), vec3(1.08, 0.94, 0.76), p1.a);
  o = clamp(o, vec2(0.02), sz.xy - 0.02);
  d.z = max(d.z, 0.03);
  d += step(abs(d), vec3(1e-4))*2e-4;
  vec3 ro = vec3(o, 0.0);
  // la caja: primera pared que toca el rayo
  float tx = (d.x > 0.0 ? sz.x - o.x : -o.x)/d.x, ty = (d.y > 0.0 ? sz.y - o.y : -o.y)/d.y, tz = sz.z/d.z;
  float t = min(tx, min(ty, tz)), kx = clamp(abs(d.z/d.x), 1.0, 40.0);
  vec3 h = ro + d*t;
  // lineales de supermercado: góndolas de verdad (cajas perpendiculares al vidrio) que el rayo puede tocar antes que la caja
  float tg = 1e9, gi = 0.0, sp = sz.x/max(1.0, floor(sz.x/2.5));
  if (idF > 5.5 && idF < 6.5) for (int k = 0; k < 6; k++) {
    float fk = float(k);
    if ((fk + 0.5)*sp > sz.x) break;
    vec3 ta = (vec3((fk + 0.5)*sp - 0.38, 0.0, 1.5) - ro)/d, tb = (vec3((fk + 0.5)*sp + 0.38, 1.8, sz.z - 0.7) - ro)/d;
    vec3 t0 = min(ta, tb), t1 = max(ta, tb);
    float tn = max(max(t0.x, t0.y), t0.z), tf = min(min(t1.x, t1.y), t1.z);
    if (tn < tf && tn > 0.0 && tn < tg) { tg = tn; gi = fk; }
  }
  // qué superficie se ve: una pared (fondo, lateral o cara de góndola: todas las pinta shBack) o el suelo o el techo
  float wid = -1.0, ww = sz.x, wx0 = 0.0, gon = 0.0, wsd = sd, pf = px*(1.0 + min(t, tg)/dist), wpx = pf, ao = 1.0;
  vec2 wq = h.xy; vec3 wcol = p0.rgb, wfurn = p3.rgb;
  if (tg < t) {
    t = tg; h = ro + d*tg; gon = 1.0; wfurn = p4.rgb; wcol = p4.rgb*0.8;
    float gc = (gi + 0.5)*sp;
    if (abs(h.z - 1.5) < 0.004) { wid = 1.0; wq = vec2(h.x - gc + 0.38, h.y); ww = 0.76; wsd = sd + gi; }
    else if (h.y > 1.795) wid = 0.0;
    else { wid = 1.0; wq = vec2(h.z - 1.5, h.y); ww = sz.z - 2.2; wsd = sd + gi*2.0 + step(gc, h.x); wpx = pf*kx; }
  } else {
    vec3 e3 = vec3(min(h.x, sz.x - h.x), min(h.y, sz.y - h.y), sz.z - h.z);
    ao = 0.70 + 0.30*smoothstep(0.0, 0.7, e3.x + e3.y + e3.z - min(e3.x, min(e3.y, e3.z)) - max(e3.x, max(e3.y, e3.z)));
    if (t == tz) wid = idB;
    else if (t != ty) {
      // paredes laterales: las estanterías del fondo siguen por los lados (dejando libre el primer metro), y también los espejos, los percheros y los cuadros
      bool shel = idB > 0.5 && idB < 1.5;
      wid = (shel || (idB > 2.5 && idB < 3.5) || (idB > 5.5 && idB < 6.5) || idB > 7.5) ? idB : 0.0;
      wq = h.zy; ww = sz.z; wx0 = shel ? 1.0 : 0.0; wsd = sd + (d.x > 0.0 ? 11.0 : 23.0); wpx = pf*kx;
    }
  }
  vec3 c, glow = vec3(0.0);
  if (wid > -0.5) c = shBack(wid, wq, ww, wx0, gon, wcol, wfurn, p7.rgb, shape, pal, wsd, wpx);
  else {
    float pl = pf*clamp(abs(d.z/d.y), 1.0, 40.0);
    if (d.y < 0.0) {
      // suelo: damero, tarima, terrazo o baldosa grande
      vec2 q = h.xz; vec3 fa = p1.rgb, fb = p2.rgb;
      if (fpat < 0.5) { vec2 g = q/0.4, jf = abs(fract(g) - 0.5);
        c = mix(mix(fa, fb, mod(floor(g.x) + floor(g.y), 2.0)), (fa + fb)*0.5, smoothstep(0.12, 0.4, pl));
        c *= 1.0 - 0.22*smoothstep(0.47, 0.49, max(jf.x, jf.y))*(1.0 - smoothstep(0.004, 0.02, pl)); }
      else if (fpat < 1.5) { float bi = floor(q.x/0.14), hb = hash21(vec2(bi, sd)), lv = smoothstep(0.04, 0.14, pl);
        c = fa*mix(0.80 + 0.36*hb, 0.98, lv);
        c *= 1.0 - 0.3*(1.0 - lv)*max(smoothstep(0.44, 0.48, abs(fract(q.x/0.14) - 0.5)), 1.0 - smoothstep(0.0, 0.012, fract(q.y/1.3 + hb*7.0)*1.3)); }
      else if (fpat < 2.5) c = mix(fa, fb, smoothstep(0.55, 0.75, vnoise(q*38.0))*(1.0 - smoothstep(0.01, 0.04, pl)))*(0.94 + 0.12*vnoise(q*3.0));
      else { vec2 jf = abs(fract(q/0.6) - 0.5); c = mix(fa, fb, smoothstep(0.482, 0.492, max(jf.x, jf.y))*(1.0 - smoothstep(0.006, 0.03, pl)))*(0.95 + 0.1*hash21(floor(q/0.6) + sd)*(1.0 - smoothstep(0.1, 0.5, pl))); }
    } else {
      // techo con luminarias: focos empotrados, tubos fluorescentes o focos cálidos sobre techo oscuro
      float lum;
      c = lamp > 1.5 ? p0.rgb*0.55 : mix(p0.rgb, vec3(0.92), 0.6)*0.92;
      if (lamp < 0.5 || lamp > 1.5) { float ls = lamp < 0.5 ? 1.3 : 1.7; vec2 g = (fract(h.xz/ls + 0.5) - 0.5)*ls; float r = length(g);
        lum = clamp((0.10 - r)/pl + 0.5, 0.0, 1.0) + 0.22*exp(-r*r*10.0); }
      else { vec2 g = vec2((fract(h.x/1.9) - 0.5)*1.9, (fract(h.z/1.7 + 0.5) - 0.5)*1.7);
        lum = shR(g, vec2(-0.62, -0.07), vec2(0.62, 0.07), pl) + 0.18*exp(-g.y*g.y*8.0); }
      glow = tint*mix(lum, 0.22, smoothstep(0.08, 0.5, pl))*4.5;
    }
  }
  c = c*tint*mix(1.0, 0.66, clamp(h.z/sz.z, 0.0, 1.0))*ao + glow;
  // tres capas de mobiliario en planos paralelos al vidrio, de atrás adelante (lejana, cercana y repisa del escaparate):
  // solo se ven si el rayo las cruza antes de dar con la pared o la góndola
  for (int k = 0; k < 3; k++) {
    float lid = k == 0 ? idF : (k == 1 ? idN : idS), tl = (k == 0 ? min(3.1, sz.z - 1.2) : (k == 1 ? 1.7 : 0.42))/d.z;
    if (lid < 0.5 || (lid > 5.5 && lid < 6.5) || tl >= t || (k == 2 && door > 0.5)) continue;
    vec4 L = shLayer(lid, o + d.xy*tl, sz.x, k == 0 ? p4.rgb : (k == 1 ? p5.rgb : p6.rgb), p7.rgb, shape, pal, sd + 3.0 + 2.0*float(k), px*(1.0 + tl/dist));
    c = L.rgb*tint*(k == 0 ? 0.80 : (k == 1 ? 0.92 : 1.0)) + c*(1.0 - L.a);
  }
  return c;
}
// el vidrio delante de la habitación: el interior con su luz propia (más al anochecer) y el reflejo del entorno con Fresnel
vec3 shGlass(vec3 room, vec3 V, vec3 N){
  // Fresnel de un vidrio de dos caras: ~7 % de frente, 12 % a 55 grados, 23 % a 65, 42 % a 75 y 64 % a 82 (en rasante manda el reflejo)
  float k = clamp(0.07 + 0.93*pow(1.0 - max(dot(N, V), 0.0), 3.2), 0.0, 1.0), lum = dot(room, vec3(0.30, 0.59, 0.11));
  // al anochecer la tienda brilla más, pero lo claro sube poco (con la cadena HDR un color claro florece por encima de ~1,6),
  // lo oscuro sube más y las luminarias (que ya pasan de 1) se quedan como de día
  // G1F2: de día el interior se ve MÁS OSCURO que la fachada al sol (como en las fotos: el escaparate es un hueco con género, no
  // una pantalla), y lo muy claro (paredes blancas de farmacia, óptica, súper) se comprime para que no se queme ni de día ni de noche
  // G1F3: compresión más fuerte desde gris medio (el fondo claro ya no se lee como una caja blanca vacía) y de día algo más oscuro
  room /= 1.0 + 1.1*max(lum - 0.30, 0.0)*(1.0 - smoothstep(1.4, 2.6, lum));
  float g = mix(0.50, mix(mix(2.0, 1.35, smoothstep(0.18, 0.62, lum)), 1.0, smoothstep(1.2, 2.4, lum)), uDusk);
  // de noche cerrada la exposición sube algo más (el ojo se adapta). De madrugada el comercio está cerrado y queda una luz de vigilancia
  g *= (1.0 - 0.12*uNight)*(1.0 - 0.93*uLate*uDusk);
  // G1F3: el reflejo pesa más (Fresnel algo más abierto) y lo que se refleja por debajo de ~20 grados es la fachada de enfrente,
  // en sombra (oscura y templada), no la bruma clara del horizonte: el vidrio se lee como vidrio y no como un panel gris
  k = clamp(max(k, 0.11 + 0.89*pow(1.0 - max(dot(N, V), 0.0), 2.4)), 0.0, 1.0);
  vec3 r = reflect(-V, N), env = envRefl(r, 0.0);
  float opp = 1.0 - smoothstep(0.05, 0.45, r.y);
  env = mix(env, env*vec3(0.42, 0.38, 0.34)*(0.85 + 0.3*vnoise(vec2(atan(r.z, r.x)*40.0, r.y*12.0))), opp*(1.0 - 0.6*uDusk));
  return emit(room, g)*(1.0 - k) + env*k*(1.0 - 0.4*uDusk);
}
// G1F3 · ¿cierra este comercio a esta hora? De noche cerrada la mayoría baja la persiana metálica (hacia las 21–22 h); bares,
// restaurantes y cafés siguen casi todos abiertos, y alguna farmacia de guardia. tp = tipo (fila de TYPES), sd = semilla del local
float shClosed(float tp, float sd){
  float open = (tp > 2.5 && tp < 3.5) || (tp > 6.5 && tp < 7.5) || (tp > 10.5 && tp < 11.5) ? 0.22 : (tp > 0.5 && tp < 1.5 ? 0.7 : 1.0);
  float frac = (0.86*smoothstep(0.45, 0.95, uNight) + 0.1*uLate)*open;
  return step(hash21(vec2(sd, 17.3)), frac);
}`;
regKind('SHOPWIN', 20, `
    float sw = vCol.r*16.0, stb = floor(vCol.g*255.0 + 0.5), stp = mod(stb, 32.0), sfl = floor(stb/32.0);
    vec2 so = vec2(vInfo.x*sw, vInfo.y*6.0 - 1.0);
    float spx = max(max(fwidth(so.x), fwidth(so.y)), 1e-4);
    vec3 stu = T*(mod(sfl, 2.0) > 0.5 ? -1.0 : 1.0);
    float ssd = floor(vCol.b*255.0 + 0.5);
    if (shClosed(stp, ssd) < 0.5) {
      vec3 srm = shRoom(so, vec3(-dot(V, stu), -V.y, dot(V, n)), vec3(sw, vInfo.z*8.0, vInfo.w*16.32), stp, ssd, spx, dist, step(1.5, mod(sfl, 4.0)));
      vec3 c = shGlass(srm, V, N);
      FRAG(c); return;
    }
    // G1F3 · cerrado: persiana metálica bajada sobre el vidrio (lamas onduladas cada 8 cm, guía y barra de abajo), galvanizada o
    // pintada, con mugre abajo y, en la mitad de los locales, pintadas. Sigue al sombreado común (sol, ambiente y farolas)
    float hc = hash21(vec2(ssd, 4.1)), sq = so.y/0.08, sfw = fwidth(sq), sfar = smoothstep(0.3, 0.9, sfw);
    alb = hc < 0.5 ? vec3(0.50, 0.51, 0.50) : (hc < 0.72 ? vec3(0.36, 0.37, 0.38) : (hc < 0.86 ? vec3(0.22, 0.32, 0.25) : vec3(0.36, 0.18, 0.15)));
    alb *= mix(0.86 + 0.28*vnoise(so*vec2(0.7, 3.0) + ssd), 1.0, sfar*0.5);
    float sl = sin(sq*6.2832);
    alb *= mix(0.84 + 0.16*sl, 0.95, sfar);
    N = normalize(N + vec3(0.0, 1.0, 0.0)*cos(sq*6.2832)*0.35*(1.0 - sfar));
    alb *= mix(0.62, 1.0, smoothstep(0.0, 0.9, so.y))*(1.0 - 0.18*smoothstep(0.55, 0.85, vnoise(so*vec2(1.3, 0.5) + ssd*3.1)));
    if (hash21(vec2(ssd, 8.9)) < 0.55) {
      // grafiti: manchas de pintura de dos colores con contorno oscuro, en la mitad baja
      // trazos de firma (tags): bandas finas y onduladas de un color apagado con algún relleno, solo en una franja a media altura
      vec2 gq = so*vec2(2.2, 3.2) + ssd*1.7;
      float band = (1.0 - smoothstep(0.35, 0.95, abs(so.y - 1.0 - 0.25*sin(so.x*1.3 + ssd))))*step(0.35, vnoise(vec2(so.x*0.8, ssd)));
      float gn = vnoise(gq)*0.6 + vnoise(gq*2.3)*0.4, line = 1.0 - smoothstep(0.012, 0.035, abs(gn - 0.5));
      float fill = smoothstep(0.62, 0.66, gn);
      vec3 gc = mix(vec3(0.42), 0.42 + 0.3*cos(6.2832*(hash21(vec2(ssd, 2.2)) + vec3(0.0, 0.33, 0.67))), 0.7);
      alb = mix(alb, mix(gc, vec3(0.08), 0.5*step(0.5, hash21(vec2(ssd, 5.5)))), max(line, fill*0.6)*band*(1.0 - sfar*0.6));
    }
    rough = 0.55; metal = 0.35;`, SHOP_DECL);

// ------------------------------------------------------------------ zaguanes y pisos (tipo K.HOMEWIN): la misma técnica, otra habitación
// Empaquetado por vértice (lo escribe roomQuad): color.r = ancho/16 m · color.g = modo (0 zaguán, 1 piso) + 2·sentido del marco ·
// color.b = semilla (1–255) · aux.x = u/ancho · aux.y = (y sobre el suelo + 1)/6 m · aux.z = alto/8 m · aux.w = fondo/16,32 m.
// De día el interior es la luz que entra (oscuro) y de noche lo enciende su lámpara según las reglas del preludio:
// zaguán con uDusk (más tenue de madrugada, uLate), piso con homeOn(h).
const HOME_DECL = `
// color de pared de un piso: tonos de casa (crema, salvia, terracota, azul pálido, ocre, blanco roto) según la semilla
vec3 hmWall(float h){ return h < 0.3 ? vec3(0.86, 0.80, 0.68) : (h < 0.45 ? vec3(0.66, 0.74, 0.62) : (h < 0.6 ? vec3(0.80, 0.56, 0.44) :
  (h < 0.72 ? vec3(0.62, 0.72, 0.80) : (h < 0.85 ? vec3(0.86, 0.72, 0.44) : vec3(0.90, 0.88, 0.84))))); }
// capa de muebles de un piso (plano paralelo al vidrio): sofá con lámpara de pie, librería con cuadro, mesa con sillas o
// cómoda con televisor. p = (x, y) en metros. Devuelve color premultiplicado + alfa
vec4 hmFurn(vec2 p, float W, float sd, float px){
  vec4 o = vec4(0.0);
  float h = hash21(vec2(sd, 1.9)), hc = hash21(vec2(sd, 6.1)), xc = W*(0.35 + 0.3*hash21(vec2(sd, 2.7)));
  vec3 fc = 0.30 + 0.28*cos(6.2832*(hc + vec3(0.0, 0.33, 0.67)));
  vec2 q = vec2(p.x - xc, p.y);
  if (h < 0.3) {
    // respaldo de sofá con cojines y, al lado, lámpara de pie con pantalla
    o = shOv(o, fc*0.8, shR(q, vec2(-1.0, 0.0), vec2(1.0, 0.62), px));
    o = shOv(o, fc*(0.9 + 0.12*cos(q.x*7.0)), shR(q, vec2(-0.95, 0.62), vec2(0.95, 0.88), px));
    o = shOv(o, fc*1.15, max(shR(q, vec2(-1.08, 0.0), vec2(-0.92, 0.72), px), shR(q, vec2(0.92, 0.0), vec2(1.08, 0.72), px)));
    o = shOv(o, vec3(0.85, 0.80, 0.70) - fc*0.2, shC(vec2(q.x + 0.55, (q.y - 0.95)*1.4), 0.15, px));
    vec2 l = vec2(q.x - 1.35, q.y);
    o = shOv(o, vec3(0.12), shR(l, vec2(-0.015, 0.0), vec2(0.015, 1.45), px));
    o = shOv(o, vec3(0.95, 0.88, 0.70), shT(l, 1.42, 1.70, 0.20, 0.13, px));
  } else if (h < 0.55) {
    // librería llena y un cuadro al lado
    vec2 b = vec2(q.x + 0.5, q.y);
    float a = shR(b, vec2(-0.6, 0.0), vec2(0.6, 2.0), px), r = floor(b.y/0.36), y = b.y - r*0.36;
    float bk = step(0.06, y)*step(y, 0.32)*step(0.25, hash21(vec2(floor(b.x/0.045), r + sd)));
    vec3 bc = 0.35 + 0.25*cos(6.2832*(hash21(vec2(floor(b.x/0.045), r)) + vec3(0.0, 0.4, 0.7)));
    o = shOv(o, mix(fc*0.6, mix(vec3(0.38), bc, 1.0 - smoothstep(0.01, 0.04, px)), bk*step(y, 0.32 - 0.1*hash21(vec2(floor(b.x/0.045), r*3.0)))), a);
    vec2 c = vec2(q.x - 0.75, q.y - 1.5);
    o = shOv(o, vec3(0.15), shR(c, vec2(-0.32, -0.25), vec2(0.32, 0.25), px));
    o = shOv(o, mix(fc*1.4, vec3(0.8, 0.7, 0.5), smoothstep(-0.2, 0.2, c.y + 0.3*sin(c.x*7.0))), shR(c, vec2(-0.28, -0.21), vec2(0.28, 0.21), px));
  } else if (h < 0.78) {
    // mesa con mantel, dos sillas y un jarrón
    vec2 aq = vec2(abs(q.x), q.y);
    o = shOv(o, fc*0.7, max(shR(aq, vec2(0.62, 0.0), vec2(0.66, 0.95), px), shR(aq, vec2(0.48, 0.44), vec2(0.66, 0.48), px)));
    o = shOv(o, vec3(0.30, 0.20, 0.12), shR(aq, vec2(0.36, 0.0), vec2(0.40, 0.74), px));
    o = shOv(o, vec3(0.88, 0.86, 0.80), shT(q, 0.50, 0.78, 0.48, 0.45, px));
    o = shOv(o, vec3(0.30, 0.40, 0.60), shR(q, vec2(-0.05, 0.78), vec2(0.05, 0.98), px));
  } else {
    // cómoda baja con un televisor encima
    o = shOv(o, fc*0.65*(0.85 + 0.15*step(0.03, abs(fract(q.y/0.24) - 0.5)*0.24)), shR(q, vec2(-0.8, 0.0), vec2(0.8, 0.72), px));
    o = shOv(o, vec3(0.04), shR(q, vec2(-0.5, 0.76), vec2(0.5, 1.36), px));
    o = shOv(o, vec3(0.06), shR(q, vec2(-0.06, 0.72), vec2(0.06, 0.78), px));
  }
  return o;
}
// HABITACIÓN de zaguán (mode 0) o de piso (mode 1) vista desde su vidrio; mismos ejes que shRoom. Devuelve la luz que sale
vec3 hmRoom(vec2 o, vec3 d, vec3 sz, float mode, float sd, float px, float dist){
  float h1 = hash21(vec2(sd, 3.7)), h2 = hash21(vec2(sd, 9.1)), h3 = hash21(vec2(sd*1.3, 5.3));
  bool zg = mode < 0.5;
  // G1F3 · de lejos (> ~130 m) no se traza la habitación: su tono medio, con la misma regla de encendido (coste de fragmento)
  if (!zg && dist > 130.0) {
    float fon = homeOn(fract(sd*0.6180339 + 0.21));
    if (mode > 1.5) fon = max(fon, homeOn(fract(sd*0.3819660 + 0.63)));
    vec3 ft = h3 < 0.05 ? vec3(0.55, 0.72, 1.25) : (h3 < 0.14 ? vec3(0.92, 0.98, 1.08) : vec3(1.14, 0.90, 0.62));
    return hmWall(h1)*0.6*((0.44 + 0.2*h3)*(1.0 - 0.92*uDusk)*0.7 + fon*1.2)*mix(vec3(1.0), ft, fon) + ft*fon*0.35;
  }
  o = clamp(o, vec2(0.02), sz.xy - 0.02);
  d.z = max(d.z, 0.03);
  d += step(abs(d), vec3(1e-4))*2e-4;
  vec3 ro = vec3(o, 0.0);
  float tx = (d.x > 0.0 ? sz.x - o.x : -o.x)/d.x, ty = (d.y > 0.0 ? sz.y - o.y : -o.y)/d.y, tz = sz.z/d.z;
  float t = min(tx, min(ty, tz));
  vec3 h = ro + d*t;
  float pf = px*(1.0 + t/dist), kx = clamp(abs(d.z/d.x), 1.0, 40.0), pl = pf*clamp(abs(d.z/d.y), 1.0, 40.0);
  vec3 wall = zg ? (h1 < 0.5 ? vec3(0.84, 0.78, 0.64) : (h1 < 0.8 ? vec3(0.70, 0.76, 0.68) : vec3(0.80, 0.66, 0.54))) : hmWall(h1);
  vec3 c, glow = vec3(0.0);
  // lámparas: el zaguán, una o dos en el eje; el piso, una en el centro
  float lz = zg ? (h.z < sz.z*0.5 ? 2.4 : 6.4) : sz.z*0.45;
  vec2 lc = vec2(sz.x*0.5, lz);
  if (t == ty && d.y > 0.0) {
    // techo
    c = wall*0.95;
    float r = length(h.xz - lc), rl = zg ? 0.17 : 0.14;
    glow = vec3(1.0)*(clamp((rl - r)/pl + 0.5, 0.0, 1.0)*4.0 + 0.6*exp(-r*r*4.0));
  } else if (t == ty) {
    // suelo: zaguán de mármol en damero girado o de baldosa hidráulica con roseta; piso de tarima
    vec2 q = h.xz;
    if (zg && h2 < 0.55) { vec2 g = vec2(q.x + q.y, q.y - q.x)/0.5;
      c = mix(mix(vec3(0.86, 0.84, 0.80), vec3(0.16, 0.15, 0.15), mod(floor(g.x) + floor(g.y), 2.0)), vec3(0.5), smoothstep(0.1, 0.35, pl)); }
    else if (zg) { vec2 g = fract(q/0.4) - 0.5; float rr = length(g), lv = smoothstep(0.02, 0.1, pl);
      c = mix(mix(vec3(0.78, 0.72, 0.62), vec3(0.62, 0.22, 0.16), (1.0 - smoothstep(0.14, 0.16, rr))*step(0.08, rr) + step(0.47, max(abs(g.x), abs(g.y)))*0.6), vec3(0.66, 0.52, 0.42), lv); }
    else { float bi = floor(q.x/0.12), hb = hash21(vec2(bi, sd)), lv = smoothstep(0.04, 0.12, pl);
      c = vec3(0.55, 0.38, 0.24)*mix(0.82 + 0.3*hb, 0.97, lv)*(1.0 - 0.25*(1.0 - lv)*smoothstep(0.44, 0.48, abs(fract(q.x/0.12) - 0.5))); }
  } else if (t == tz) {
    // pared del fondo
    vec2 q = h.xy; c = wall;
    if (zg) {
      // zócalo de mármol, escalera que arranca hacia un lado y puerta del ascensor al otro
      float sl = h3 < 0.5 ? q.x : sz.x - q.x, ws = min(1.4, sz.x*0.52), stp = min(floor(sl/0.3) + 1.0, 6.0);
      c = mix(c, vec3(0.50, 0.44, 0.38), 1.0 - shS(q.y - 1.05, px));
      float sm = (1.0 - shS(q.y - stp*0.17, px))*(1.0 - shS(sl - ws, px));
      c = mix(c, vec3(0.80, 0.76, 0.70)*(0.85 + 0.15*step(0.03, fract(q.y/0.17)*0.17)), sm);
      c = mix(c, vec3(0.10, 0.08, 0.06), (1.0 - shS(abs(q.y - min(sl, ws)*0.567 - 0.95) - 0.025, px))*(1.0 - shS(sl - ws, px)));
      float ex = sz.x - ws*0.5 - 0.15, ec = h3 < 0.5 ? ex : sz.x - ex;
      vec2 e = vec2(q.x - ec, q.y);
      c = mix(c, vec3(0.30, 0.31, 0.33), shR(e, vec2(-0.55, 0.0), vec2(0.55, 2.25), px));
      c = mix(c, vec3(0.62, 0.64, 0.66)*(0.9 + 0.1*cos(e.x*40.0)*(1.0 - smoothstep(0.004, 0.02, px))), shR(e, vec2(-0.45, 0.0), vec2(0.45, 2.1), px));
      c = mix(c, vec3(0.20, 0.20, 0.22), shR(e, vec2(-0.008, 0.0), vec2(0.008, 2.1), px));
      glow += vec3(1.2, 0.9, 0.5)*shC(e - vec2(0.62, 1.1), 0.025, px);
    } else {
      // puerta al pasillo (oscura) y un cuadro
      float dx = sz.x*(h3 < 0.5 ? 0.2 : 0.8);
      c = mix(c, vec3(0.14, 0.12, 0.10), shR(q - vec2(dx, 0.0), vec2(-0.42, 0.0), vec2(0.42, 2.05), px));
      vec2 pq = q - vec2(sz.x - dx, 1.55);
      c = mix(c, vec3(0.12), shR(pq, vec2(-0.3, -0.22), vec2(0.3, 0.22), px));
      c = mix(c, 0.45 + 0.25*cos(6.2832*(h2 + vec3(0.0, 0.33, 0.67) + pq.y)), shR(pq, vec2(-0.26, -0.18), vec2(0.26, 0.18), px));
    }
    c *= 1.0 - 0.35*(1.0 - shS(q.y - 0.1, px));
  } else {
    // paredes laterales: el zaguán con zócalo y buzones en una; el piso con rodapié
    vec2 q = h.zy; c = wall;
    if (zg) {
      c = mix(c, vec3(0.50, 0.44, 0.38), 1.0 - shS(q.y - 1.05, pf*kx));
      c = mix(c, vec3(0.72, 0.68, 0.62), shR(q, vec2(0.0, 1.02), vec2(sz.z, 1.08), pf*kx));
      if ((d.x > 0.0) == (h2 < 0.5)) {
        vec2 m = q - vec2(1.6, 1.25), g = fract(m/vec2(0.34, 0.21));
        float a = shR(m, vec2(0.0), vec2(1.36, 0.63), pf*kx);
        c = mix(c, mix(vec3(0.45, 0.30, 0.16), vec3(0.72, 0.58, 0.30), step(0.12, g.x)*step(g.x, 0.88)*step(0.6, g.y)*step(g.y, 0.72)), a);
      }
    } else c = mix(c, vec3(0.92, 0.90, 0.86), 1.0 - shS(q.y - 0.1, pf*kx));
  }
  // luz: de día la que entra por la ventana (cae hacia el fondo) y la lámpara, y de noche solo la lámpara, si está encendida
  float dep = clamp(h.z/sz.z, 0.0, 1.0), on, day;
  vec3 tint;
  if (zg) {
    on = step(0.2, h2)*uDusk*(1.0 - 0.45*uLate);
    day = mix(0.55, 0.8, step(0.2, h2));
    tint = vec3(1.08, 0.94, 0.74);
  } else {
    on = homeOn(fract(sd*0.6180339 + 0.21));
    // G1F1: ventana tras visillo (todas las de la fachada): la regla de antes, por celda de vidrio, encendía a menudo dos
    // trozos por ventana (~1 de cada 2 con luz al anochecer). Mismo reparto, con dos sorteos
    if (mode > 1.5) on = max(on, homeOn(fract(sd*0.3819660 + 0.63)));
    day = 0.44 + 0.2*h3;
    // G1F1: casi todas cálidas (bombilla), como en las fotos del usuario; alguna LED fría y algún televisor
    tint = h3 < 0.05 ? vec3(0.55, 0.72, 1.25)*(0.8 + 0.2*sin(uTime*7.0 + sd)) : (h3 < 0.14 ? vec3(0.92, 0.98, 1.08) : vec3(1.14, 0.90, 0.62));
  }
  float lv = day*(1.0 - 0.92*uDusk)*mix(1.0, 0.55, dep) + on*1.5*mix(1.0, 0.75, dep);
  vec3 lamp = glow*mix(zg ? step(0.2, h2)*0.35 : 0.0, 1.0, on);
  c = c*lv*mix(vec3(1.0), tint, min(1.0, on + (zg ? 0.5 : 0.0))) + lamp*tint;
  // piso: muebles insinuados en un plano a 1,6–2,2 m y cortinas a los lados del vidrio
  if (!zg) {
    float tf = (1.6 + 0.6*h2)/d.z;
    if (tf < t) { vec4 L = hmFurn(o + d.xy*tf, sz.x, sd, px*(1.0 + tf/dist)); c = L.rgb*lv*mix(vec3(1.0), tint, on) + c*(1.0 - L.a); }
    vec2 cp = o + d.xy*(0.12/d.z);
    float cw = 0.12 + 0.2*h2, fold = 0.82 + 0.18*cos(cp.x*38.0)*(1.0 - smoothstep(0.01, 0.04, px));
    float cm = max(shR(cp, vec2(0.25, 0.0), vec2(0.5 + cw, sz.y), px), shR(cp, vec2(sz.x - 0.5 - cw, 0.0), vec2(sz.x - 0.25, sz.y), px));
    vec3 cc = h1 > 0.5 ? vec3(0.92, 0.88, 0.80) : 0.55 + 0.25*cos(6.2832*(h3 + vec3(0.1, 0.4, 0.7)));
    float sheer = mode > 1.5 ? step(0.42, h3)*mix(0.42, 0.62, h1) : step(0.7, h3)*0.35;   // G1F1: ventanas cerradas, más visillos
    c = mix(c, cc*fold*(0.45*lv + 0.2*on + 0.42*(1.0 - uDusk))*mix(vec3(1.0), tint, on), max(cm*0.92, sheer));   // G1F1: la tela toma el color de la lámpara
  } else {
    // zaguán: una planta grande en su maceta
    float tp = 2.2/d.z;
    if (tp < t) {
      vec2 p = o + d.xy*tp - vec2(h2 < 0.5 ? sz.x - 0.45 : 0.45, 0.0); float ppx = px*(1.0 + tp/dist);
      float leaf = shC(vec2(p.x, (p.y - 0.95)*0.75), 0.36, ppx)*mix(step(0.35, vnoise(p*22.0 + sd)), 0.8, smoothstep(0.01, 0.05, ppx));
      vec4 L = shOv(vec4(0.0), vec3(0.16, 0.30, 0.12)*(0.8 + 0.4*vnoise(p*9.0)), leaf);
      L = shOv(L, vec3(0.50, 0.28, 0.18), shT(p, 0.0, 0.5, 0.15, 0.2, ppx));
      c = L.rgb*lv*tint + c*(1.0 - L.a);
    }
  }
  return c;
}
// vidrio de portal o de ventana: el interior y el reflejo con el Fresnel de shGlass. En el portal, reja de forja sobre el vidrio
vec3 hmGlass(vec3 room, vec3 V, vec3 N, vec2 o, float W, float mode, float px, float sd){
  vec3 r = reflect(-V, N);
  // G1F3: Fresnel más abierto en los pisos (vistos desde la calle, en rasante, brillan del cielo como en las fotos)
  float k = clamp(mode < 0.5 ? 0.07 + 0.90*pow(1.0 - max(dot(N, V), 0.0), 3.2) : 0.13 + 0.87*pow(1.0 - max(dot(N, V), 0.0), 2.2), 0.0, 1.0);
  vec3 c = emit(room, 1.0)*(1.0 - k) + envRefl(r, 0.0)*k*(1.0 - 0.4*uDusk) + uSunCol*pow(max(dot(r, uSunDir), 0.0), 350.0)*2.0;
  if (mode < 0.5) {
    // reja: barrotes cada 12 cm, dos travesaños y una banda de anillos; de lejos se funde a su tono medio
    // dos modelos según la semilla: banda de anillos a media altura, o barrotes más juntos con la banda arriba y rombos abajo
    float vb = step(0.5, hash21(vec2(sd, 7.7))), x = o.x - 0.35, bw = mix(0.12, 0.10, vb), fx = abs(fract(x/bw) - 0.5)*bw, e = px*0.8;
    float m = 1.0 - shS(fx - 0.008, e), b0 = mix(1.0, 2.1, vb), b1 = mix(1.6, 2.55, vb);
    m = max(m, 1.0 - shS(min(min(abs(o.y - 0.75), abs(o.y - 2.05)), min(abs(o.y - b0 + 0.04), abs(o.y - b1 - 0.04))*vb + (1.0 - vb)*9.0) - 0.014, e));
    vec2 q = vec2((fract(x/bw) - 0.5)*bw, (fract((o.y - b0)/bw) - 0.5)*bw);
    m = max(m, (1.0 - shS(abs(length(q) - 0.045) - 0.006, e))*step(b0, o.y)*step(o.y, b1));
    vec2 rq = abs(fract(vec2(x, o.y)/0.2) - 0.5)*0.2;
    m = max(m, vb*(1.0 - shS(abs(rq.x + rq.y - 0.1) - 0.006, e))*step(0.8, o.y)*step(o.y, 1.6));
    m = mix(m, 0.32, smoothstep(0.01, 0.03, px));
    c = mix(c, shade(vec3(0.05, 0.05, 0.055), N, V, 0.45, 0.0, 1.0), m);
  }
  return c;
}`;
regKind('HOMEWIN', 21, `
    float hw = vCol.r*16.0, hb = floor(vCol.g*255.0 + 0.5), hmode = mod(hb, 2.0) + step(3.5, hb);   // G1F1: 2 = piso tras visillo
    vec2 ho = vec2(vInfo.x*hw, vInfo.y*6.0 - 1.0);
    float hpx = max(max(fwidth(ho.x), fwidth(ho.y)), 1e-4);
    vec3 htu = T*(mod(floor(hb/2.0), 2.0) > 0.5 ? -1.0 : 1.0);
    vec3 hrm = hmRoom(ho, vec3(-dot(V, htu), -V.y, dot(V, n)), vec3(hw, vInfo.z*8.0, vInfo.w*16.32), hmode, floor(vCol.b*255.0 + 0.5), hpx, dist);
    vec3 c = hmGlass(hrm, V, N, ho, hw, hmode, hpx, floor(vCol.b*255.0 + 0.5));
    FRAG(c); return;`, HOME_DECL);
// vidrio de zaguán o de piso: un quad K.HOMEWIN con las coordenadas de su habitación. rm = { x0, W, yF, H, D, mode, seed }
// (x0 = u del extremo de la habitación, yF = cota de su suelo). Lo usan portalBay y, a través de env, las ventanas de details.js
function roomQuad(B, F, u0, u1, y0, y1, d, rm) {
  if (!B || u1 - u0 < 0.02 || y1 - y0 < 0.02) return;
  const Wb = Math.max(1, Math.min(255, Math.round(rm.W / 16 * 255))), W = Wb / 255 * 16;
  const X = v => Math.max(0, Math.min(255, Math.round((v - rm.x0) / W * 255))), Y = v => Math.max(0, Math.min(255, Math.round((v - rm.yF + 1) / 6 * 255)));
  const h = Math.min(255, Math.round(rm.H / 8 * 255)), dd = Math.min(250, Math.round(rm.D / 16.32 * 255));
  const dir = (-F.nz * F.tx + F.nx * F.tz) > 0 ? 0 : 1;
  quad(B, F, u0, y0, d, u1, y0, d, u1, y1, d, u0, y1, d, [Wb, rm.mode + 2 * dir + (rm.veil ? 4 : 0), rm.seed], K.HOMEWIN,
    [X(u0), Y(y0), h, dd, X(u1), Y(y0), h, dd, X(u1), Y(y1), h, dd, X(u0), Y(y1), h, dd]);
}

// G1F1: desgaste de los paños de muro de la planta baja (churretes bajo la faja y zócalo sucio): canal auxiliar de facades.js
// (env.wa). Todos con el mismo borde de referencia, F1, para que los solapes de los paños den lo mismo
const wa = (env, F, u0, u1, y0, y1) => env.wa ? env.wa(F, u0, u1, y0, y1, env.F1) : undefined;

const API = window.BCN_INTERIORS = { SHOPS, TYPES, force: parseForce(), paramData, paramSize: [PARW, PARH], roomQuad, log: null, init(ctx) {
  const { scene } = ctx;
  // rótulos: un atlas de 2 × 16 celdas de 512 × 64 (proporción 8:1), una por tipo, con sus colores
  const sign = new BABYLON.DynamicTexture('signs', { width: 1024, height: 1024 }, scene, true);
  {
    const g = sign.getContext();
    TYPES.forEach((t, r) => { const x = (r % 2) * 512, y = (15 - (r >> 1)) * 64;
      g.fillStyle = t.sign[0]; g.fillRect(x, y, 512, 64); g.strokeStyle = t.sign[1]; g.globalAlpha = 0.55; g.lineWidth = 2; g.strokeRect(x + 6, y + 6, 500, 52); g.globalAlpha = 1;
      g.fillStyle = t.sign[1]; g.font = 'bold 40px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t.n, x + 256, y + 34, 470); });
    sign.update(true); sign.wrapU = sign.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE; sign.anisotropicFilteringLevel = 8;
  }
  const par = BABYLON.RawTexture.CreateRGBATexture(paramData(), PARW, PARH, scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);
  par.wrapU = par.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
  for (const m of ctx.detail.mats) { m.setTexture('tSign', sign); m.setTexture('tShop', par); }
  const ACERO = pbrAux(0.3, 1, 0, 0), NEON = pbrAux(0.5, 0, 0, 1), FRAME = [24, 24, 27];

  // ---------------------------------------------------------------- planta baja de un tramo (de calle o de patio)
  // Azar: cada vano siembra su ámbito, env.rnd(2, tramo, vano), y cada comercio el suyo, env.rnd(10, tramo, primer vano), y
  // sacan de golpe sus números: las capas BASE y ORNAMENTO ven los mismos, y nada depende de los demás vanos ni módulos.
  function groundFloor(env, run) {
    const { W0, W1, F1, y0, u, stone, iron, shops, shopsHere, windowHole } = env, KSB = K.FXPIEDRA !== undefined ? K.FXPIEDRA : K.STONE;   // n3 E4: sillería sin teñir (el tono, el de la fachada)
    const { cover, street, nb, bw, N, wallC, gnd } = run;
    if (F1 <= cover + 0.3) return;                            // tapado por el vecino
    const yB = Math.max(y0, cover - 0.3), gls = [];
    for (let W = 0; W < nb; W++) gls.push(Math.min(gnd((W + 0.5) * bw), F1 - 2.7));   // cota de la acera delante de cada vano (city.walkAt), con tope
    // Condal City · kit (kit.js): ¿comercio en este tramo? (provisional hasta la Fase 4: densidad comercial real del sitio por el
    // factor del estilo; ?pb=0/1 lo fuerza), planta baja del estilo (V.pb) y retranqueo (V.pbRec: soportales, pilotis, patio)
    const V = env.V, KIT = window.BCN_KIT, kit = V && V.kit && KIT ? KIT : null;
    let com = street && shopsHere;
    // F2R: los estilos comerciales (V.com ≥ 0,5) conservan todo el comercio de antes; solo los poco comerciales (villas, casas
    // baratas, polígonos…) lo sortean con la densidad del sitio
    if (kit && com) { env.rnd(7, 2, run.i); const rc = R(); com = kit.pbForce !== null ? kit.pbForce === 1 : V.com >= 0.5 || rc < env.pCom; }
    const dep = kit && street ? V.pbRec || 0 : 0;
    let F = run.F, rg = run;
    if (dep > 0) {
      const F0 = run.F, L = run.L, gm = Math.min(...gls);
      F = { x: F0.x - F0.nx * dep, z: F0.z - F0.nz * dep, tx: F0.tx, tz: F0.tz, nx: F0.nx, nz: F0.nz };
      rg = Object.assign({}, run, { F });
      jamb(W0, F0, 0.01, yB, F1, -dep, 0, shade(wallC, 0.9), env.kw); jamb(W0, F0, L - 0.01, yB, F1, -dep, 0, shade(wallC, 0.9), env.kw);
      hpl(W0, F0, 0, L, F1 - 0.02, -dep, 0, shade(env.uV || u, 0.86), K.STUCCO);                      // techo de los soportales
      hpl(W0, F0, 0, L, gm + 0.03, -dep, 0, [150, 146, 138], KSB);                                  // suelo de losas
      const fr = V.pbFr && kit.P[V.pbFr];
      for (let W = 0; W <= nb; W++) { const a = W * bw;
        if (fr) { if (W < nb) fr(env, run, { W, nb, a, bw, gl: gls[W], yB, dep }); }
        else box(W0, F0, Math.max(0, a - 0.22), Math.min(L, a + 0.22), yB, F1, -0.5, 0, wallC, env.kw || K.STUCCO); }
    }
    const plan = com ? shopPlan(env, rg, gls) : null;
    const pbf = kit && street && V.pb ? kit.P[V.pb] : null;
    for (let W = 0; W < nb; W++) {
      const a = W * bw, c = a + bw / 2, gl = gls[W];
      env.rnd(2, run.i, W);
      const rr = [R(), R(), R(), R(), R(), R()];
      env.pbPortal = W === N;                                     // F2R: P.puerta dibuja el zaguán iluminado en el portal
      if (pbf && (W === N || !plan) && pbf(env, rg, { W, a, c, bw, gl, yB, rr, portal: W === N, F, dep, com: !!plan, esquina: W === 0 && run.esq0 ? -1 : W === nb - 1 && run.esq1 ? 1 : 0 }) !== false) continue;
      if (street && W === N) { portalBay(env, rg, a, c, gl, yB, rr); continue; }
      if (plan) { shopBay(env, rg, W, gl, yB, plan.of[W]); continue; }
      // ventana de planta baja (con reja si da a la calle)
      const ww = Math.min(street ? 1.25 : 1.05, bw - 0.9), tt = c - ww / 2, ct = c + ww / 2;
      const st = gl + 1.0, yt = Math.min(F1 - 0.45, st + (street ? 1.9 : 1.45));
      const gc = street && shops ? stone : wallC, gk = street && shops ? KSB : K.STUCCO;
      if (yt - st < 0.6) { rect(W0, F, a, a + bw, yB, F1, 0, gc, gk, wa(env, F, a, a + bw, yB, F1)); continue; }
      windowHole(W0, F, a, a + bw, tt, ct, yB, F1, st, yt, street ? 0.3 : 0.2, gc, gk, rr[0] < 0.6 ? 0.2 + rr[1] * 0.5 : 0);
      if (street) { lattice(W0, F, tt, ct, st, yt, 0.05, iron, K.IRON, 1); box(W1, F, tt - 0.05, ct + 0.05, st - 0.08, st, 0, 0.12, shade(gc, 1.05), gk); }
      else box(W1, F, tt - 0.05, ct + 0.05, st - 0.07, st, 0, 0.09, u, K.STUCCO);
    }
    env.pbPortal = false;
    if (plan) for (const s of plan.list) { shopFront(env, rg, s); terrace(env, rg, s); }
  }

  // ---------------------------------------------------------------- comercios
  // Reparto: cada grupo de vanos contiguos a un lado del portal se parte en comercios de hasta 4 vanos o ~14 m. Cada comercio
  // (ámbito env.rnd(10, tramo, primer vano)) tiene un tipo estable, un vano que es su puerta, y una habitación virtual común a
  // todos sus vidrios: origen x0 (u del extremo), ancho W, suelo yF, alto H y fondo D.
  const opening = (run, W) => { const Uw = run.bw * 0.84, B_ = W * run.bw + (run.bw - Uw) / 2; return [B_, B_ + Uw]; };
  const topOf = (env, gl) => Math.min(env.F1 - 1.0, gl + 3.4);
  // persianas metálicas: galvanizado, gris oscuro, verde y granate de carpintería vieja (pintura gastada: patrón 3 no; lamas: 1)
  const SHUTC = [[150, 152, 150], [150, 152, 150], [128, 130, 132], [88, 92, 96], [56, 84, 66], [104, 52, 46]], SHUTA = pbrAux(0.55, 0.6, 1, 0);
  function shopPlan(env, run, gls) {
    const { nb, bw, N, F } = run, list = [], of = [];
    const maxB = Math.max(1, Math.min(4, Math.floor(14 / bw)));
    const seg = (a, b) => { const n = b - a; if (n <= 0) return; const k = Math.ceil(n / maxB);
      for (let j = 0; j < k; j++) { const w0 = a + Math.round(n * j / k), w1 = a + Math.round(n * (j + 1) / k); if (w1 > w0) list.push({ w0, w1 }); } };
    if (N >= 0) { seg(0, N); seg(N + 1, nb); } else seg(0, nb);
    const dir = (-F.nz * F.tx + F.nx * F.tz) > 0 ? 0 : 1;     // ¿la tangente T del shader va en el sentido de u?
    const prev = [];   // G1F3: en un mismo frente no se repite el tipo de los dos comercios anteriores (antes salían dos «FORN DE PA» seguidos)
    for (const s of list) {
      env.rnd(10, run.i, s.w0);
      const r = [R(), R(), R(), R(), R(), R()], n = s.w1 - s.w0;
      s.type = API.force >= 0 ? API.force : n >= 3 && n * bw >= 9.5 && r[0] < 0.3 ? SUPER : pickType(r[1]);
      for (let j = 1; j < 4 && API.force < 0 && prev.indexOf(s.type) >= 0; j++) s.type = pickType((r[1] * 7.13 + j * 0.377) % 1);
      prev.unshift(s.type); prev.length = Math.min(prev.length, 2);
      s.T = TYPES[s.type];
      s.door = s.w0 + Math.min(n - 1, (r[2] * n) | 0);
      s.sign = r[3] < 0.93; s.awn = r[4] < 0.35; s.seed = 1 + ((r[5] * 254) | 0);
      s.uA = opening(run, s.w0)[0]; s.uB = opening(run, s.w1 - 1)[1];
      // G1F2 · persiana metálica: ~9 % de los locales cerrados (todas bajadas, la de la puerta también) y ~22 % con alguna
      // bajada a medias (el que abre tarde o el que guarda el escaparate). r2 de un sorteo propio para no mover los de arriba
      const r2 = [R(), R(), R(), R()];
      s.shut = r2[0] < 0.09 ? 2 : r2[0] < 0.31 ? 1 : 0; s.shutR = r2[1]; s.shutC = SHUTC[(r2[2] * SHUTC.length) | 0];
      // G1F2 · toldo solo si cabe: se mide el paso libre delante (hasta la fachada de enfrente) en los dos extremos y el centro;
      // en callejones (< 4,2 m) no hay toldo y si no, sale como mucho a un cuarto del paso (antes cruzaba las calles del Gòtic)
      if (s.awn && run.r && ctx.city) { const r_ = run.r; let w = 9;
        for (const u of [s.uA + 0.2, (s.uA + s.uB) / 2, s.uB - 0.2]) for (let t = 0.6; t < w; t += 0.3) {
          if (ctx.city.coverAt(r_.ax + r_.tx * u + r_.nx * t, r_.az + r_.tz * u + r_.nz * t, -1) > -1e8) { w = t; break; } }
        s.awnD = Math.min(1.35, w * 0.25); if (w < 4.2) s.awn = false; }
      s.yF = gls[s.door] + 0.03; s.top = -1e9;
      for (let W = s.w0; W < s.w1; W++) { s.top = Math.max(s.top, topOf(env, gls[W])); of[W] = s; }
      const Wd = Math.min(16, s.uB - s.uA + 0.6), H = Math.min(7.9, Math.max(3.3, s.top - s.yF + 0.2)), D = Math.max(4, Math.min(5.5, Wd * 0.9));
      s.x0 = s.uA - 0.3; s.Wb = Math.max(1, Math.round(Wd / 16 * 255)); s.W = s.Wb / 255 * 16;
      s.Hb = Math.round(H / 8 * 255); s.Db = Math.round(D / 16.32 * 255); s.tb = s.type + 32 * dir;
    }
    return { list, of };
  }
  // vidrio de comercio: un quad K.SHOPWIN con las coordenadas de habitación en sus bytes (empaquetado: ver SHOP_DECL)
  function glassQuad(B, F, u0, u1, y0, y1, d, s, door) {
    if (!B || u1 - u0 < 0.02 || y1 - y0 < 0.02) return;
    const X = v => Math.max(0, Math.min(255, Math.round((v - s.x0) / s.W * 255))), Y = v => Math.max(0, Math.min(255, Math.round((v - s.yF + 1) / 6 * 255)));
    const h = s.Hb, dd = s.Db;
    quad(B, F, u0, y0, d, u1, y0, d, u1, y1, d, u0, y1, d, [s.Wb, s.tb + (door ? 64 : 0), s.seed], K.SHOPWIN,
      [X(u0), Y(y0), h, dd, X(u1), Y(y0), h, dd, X(u1), Y(y1), h, dd, X(u0), Y(y1), h, dd]);
  }
  // n3 E1 · COLOR DE LOS BAJOS FUNDIDO CON SU FACHADA. Los machones, el dintel, el zócalo, los marcos y la faja del rótulo de
  // cada comercio toman tonos derivados del color de su edificio (d.col, el de la paleta): una de tres versiones estables por
  // edificio (la misma en todos sus bajos): piedra del mismo tono algo más oscura, el tono más saturado y oscuro, o un tono
  // muy oscuro del color (carpintería pintada a juego). Sillería solo en luminancia (K.FXPIEDRA): no cambia el tono. Los
  // interiores, los rótulos, los toldos y los escaparates no se tocan.
  const sat = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3; return c.map(v => Math.max(0, Math.min(255, Math.round(l + (v - l) * k)))); };
  function shopCols(env) {
    if (env._shopC) return env._shopC;
    const p = env.p, h = ((Math.imul(env.b ^ 0x5bd1e995, 0x9e3779b1) >>> 0) >> 8) % 3;
    // n3 E4: el MISMO tono de la fachada (sin subir la saturación, que lo llevaba a otro color): igual algo más oscuro, más
    // piedra (algo de gris cálido) o más oscuro; marcos y faja del rótulo, un tono oscuro de ese mismo color
    const sc = h === 0 ? shade(p, 0.92) : h === 1 ? shade(mixc(p, [176, 166, 150], 0.28), 0.9) : shade(sat(p, 1.15), 0.8);
    const met = shade(sat(p, 1.35), h === 2 ? 0.34 : 0.4);
    return (env._shopC = { sc, met, kS: K.FXPIEDRA !== undefined ? K.FXPIEDRA : KS });
  }
  // un vano de comercio: machones y dintel de piedra y, dentro, el escaparate o la puerta de vidrio de la tienda
  function shopBay(env, run, W, gl, yB, s) {
    const { W0, W1, F1 } = env, { F, bw } = run;
    const a = W * bw, [B_, V_] = opening(run, W), Uw = V_ - B_;
    const SC = shopCols(env), KS = SC.kS;
    const top = topOf(env, gl), sill = gl + 0.5, sc = SC.sc, dk = shade(sc, 0.78), base = shade(sc, 0.86), met = SC.met;
    rect(W0, F, a, B_, yB, F1, 0, sc, KS, wa(env, F, a, B_, yB, F1)); rect(W0, F, V_, a + bw, yB, F1, 0, sc, KS, wa(env, F, V_, a + bw, yB, F1)); rect(W0, F, B_, V_, top, F1, 0, sc, KS, wa(env, F, B_, V_, top, F1));
    jamb(W0, F, B_, sill, top, -0.4, 0, dk, KS); jamb(W0, F, V_, sill, top, -0.4, 0, dk, KS);
    hpl(W0, F, B_, V_, top, -0.4, 0, shade(sc, 0.68), KS);
    if (W !== s.door) {
      rect(W0, F, B_, V_, yB, sill, 0, base, KS, wa(env, F, B_, V_, yB, sill)); hpl(W0, F, B_, V_, sill, -0.4, 0, shade(sc, 0.72), KS);
      glassQuad(W0, F, B_, V_, sill, top, -0.36, s, false);
      box(W0, F, B_ + Uw * 0.5 - 0.03, B_ + Uw * 0.5 + 0.03, sill, top, -0.38, -0.3, met, K.METAL);
      box(W0, F, B_, V_, sill, sill + 0.08, -0.4, -0.3, met, K.METAL);
      if (W1) { box(W1, F, B_, B_ + 0.05, sill, top, -0.4, -0.3, met, K.METAL, 4); box(W1, F, V_ - 0.05, V_, sill, top, -0.4, -0.3, met, K.METAL, 4);
        box(W1, F, B_, V_, top - 0.06, top, -0.4, -0.3, met, K.METAL, 2); }
    } else {
      // puerta de vidrio centrada, con vidrios fijos a los lados y montante encima. El umbral baja hasta la acera
      const dc = (B_ + V_) / 2, x0 = dc - 0.55, x1 = dc + 0.55, th = gl + 0.03, dt = Math.min(top - 0.3, th + 2.25);
      rect(W0, F, B_, x0, yB, sill, 0, base, KS, wa(env, F, B_, x0, yB, sill)); rect(W0, F, x1, V_, yB, sill, 0, base, KS, wa(env, F, x1, V_, yB, sill)); rect(W0, F, x0, x1, yB, th, 0, base, KS, wa(env, F, x0, x1, yB, th));
      hpl(W0, F, B_, x0, sill, -0.4, 0, shade(sc, 0.72), KS); hpl(W0, F, x1, V_, sill, -0.4, 0, shade(sc, 0.72), KS);
      jamb(W0, F, x0, th, sill, -0.4, 0, dk, KS); jamb(W0, F, x1, th, sill, -0.4, 0, dk, KS);
      hpl(W0, F, x0, x1, th, -0.4, 0, shade(sc, 0.9), KS);
      glassQuad(W0, F, B_, x0, sill, top, -0.36, s, false); glassQuad(W0, F, x1, V_, sill, top, -0.36, s, false);
      glassQuad(W0, F, x0, x1, th, dt, -0.36, s, true); glassQuad(W0, F, x0, x1, dt, top, -0.36, s, false);
      box(W0, F, x0 - 0.04, x0 + 0.03, th, top, -0.38, -0.3, met, K.METAL); box(W0, F, x1 - 0.03, x1 + 0.04, th, top, -0.38, -0.3, met, K.METAL);
      box(W0, F, x0, x1, dt - 0.03, dt + 0.04, -0.38, -0.3, met, K.METAL);
      box(W0, F, B_, x0, sill, sill + 0.08, -0.4, -0.3, met, K.METAL); box(W0, F, x1, V_, sill, sill + 0.08, -0.4, -0.3, met, K.METAL);
      if (W1) {
        box(W1, F, x0 + 0.03, x1 - 0.03, th, th + 0.14, -0.38, -0.31, met, K.METAL, 1);                     // zócalo de la hoja
        box(W1, F, x1 - 0.2, x1 - 0.16, th + 0.8, th + 1.4, -0.3, -0.25, [200, 202, 206], K.PBR, 7, ACERO);   // tirador
        box(W1, F, x1 - 0.2, x1 - 0.16, th + 0.9, th + 0.94, -0.36, -0.3, [200, 202, 206], K.PBR, 4, ACERO);
        box(W1, F, x1 - 0.2, x1 - 0.16, th + 1.26, th + 1.3, -0.36, -0.3, [200, 202, 206], K.PBR, 4, ACERO);
        box(W1, F, B_, B_ + 0.05, sill, top, -0.4, -0.3, met, K.METAL, 4); box(W1, F, V_ - 0.05, V_, sill, top, -0.4, -0.3, met, K.METAL, 4);
        box(W1, F, B_, V_, top - 0.06, top, -0.4, -0.3, met, K.METAL, 2);
      }
    }
    if (s.awn) { const ac = s.T.awn, aD = s.awnD || 1.35, aY = top - 0.7 * aD / 1.35;
      quad(W0, F, B_, top - 0.02, 0.05, V_, top - 0.02, 0.05, V_, aY, aD, B_, aY, aD, ac, K.AWN);
      quad(W1, F, B_, aY, aD, V_, aY, aD, V_, aY - 0.2, aD, B_, aY - 0.2, aD, ac, K.AWN); }
    // persiana metálica enrollable delante del vidrio (por delante de marcos y montantes, -0,27 m), con guías y barra de abajo
    if (s.shut) { const isD = W === s.door, h0 = isD ? gl + 0.03 : sill;
      const bot = s.shut === 2 ? h0 : W === s.door ? top + 1 : top - (top - h0) * (0.18 + 0.5 * ((s.shutR * 7.3 + W * 0.37) % 1));
      if (bot < top - 0.05 && (s.shut === 2 || ((s.shutR * 13.1 + W * 0.61) % 1) < 0.6)) {
        const bc = shade(s.shutC, 0.8);
        rect(W0, F, B_ + 0.04, V_ - 0.04, bot, top, -0.27, s.shutC, K.PBR, SHUTA);
        box(W0, F, B_ + 0.04, V_ - 0.04, bot - 0.05, bot, -0.29, -0.25, bc, K.METAL, 2);
        if (W1) { box(W1, F, B_ + 0.01, B_ + 0.05, h0, top, -0.3, -0.26, bc, K.METAL, 4); box(W1, F, V_ - 0.05, V_ - 0.01, h0, top, -0.3, -0.26, bc, K.METAL, 4); }
      }
    }
  }
  // lo que es del comercio entero: rótulo centrado sobre sus vanos y, en la farmacia, la cruz luminosa en banderola
  function shopFront(env, run, s) {
    const { W0, W1, F1 } = env, { F } = run;
    const sv0 = s.top + 0.12, hmax = Math.min(0.56, F1 - 0.2 - sv0);
    if (s.sign && hmax > 0.22) {
      const w = Math.min(hmax * 8, s.uB - s.uA - 0.1), h = w / 8, uc = (s.uA + s.uB) / 2, y = sv0 + (hmax - h) / 2;
      quad(W0, F, uc - w / 2, y, 0.085, uc + w / 2, y, 0.085, uc + w / 2, y + h, 0.085, uc - w / 2, y + h, 0.085, [255, 255, 255], K.SIGN, signAux(s.type));   // 2,5 cm delante de la faja (antes 1 cm: parpadeaba de lejos)
      box(W1, F, uc - w / 2 - 0.03, uc + w / 2 + 0.03, y - 0.03, y + h + 0.03, 0, 0.06, shopCols(env).met, K.METAL);   // faja del rótulo, a juego
    }
    if (s.T.shelf[0] === LY.CRUZ) { const uc = s.uA - 0.14, y = s.top - 0.5, g = [40, 215, 95];
      box(W0, F, uc - 0.04, uc + 0.04, y - 0.11, y + 0.11, 0.2, 0.86, g, K.PBR, 7, NEON); box(W0, F, uc - 0.04, uc + 0.04, y - 0.33, y + 0.33, 0.42, 0.64, g, K.PBR, 7, NEON);
      box(W1, F, uc - 0.015, uc + 0.015, y - 0.02, y + 0.02, 0, 0.2, FRAME, K.METAL); }
  }
  // ---------------------------------------------------------------- terrazas de bar
  // Delante de BAR, CAFÈ, RESTAURANT y GELATERIA cuando la acera es ancha (≥ 5,2 m de la fachada al borde de la vía): pegadas a
  // la fachada y sin pasar de ~3,2 m del bordillo (ahí van árboles, farolas y bancos). 2–6 mesas redondas de pie central con 2–4
  // sillas, sombrillas del color del toldo (si el local no tiene toldo), jardineras en los extremos y una pizarra junto a la
  // puerta. ORNAMENTO con detalle; en BASE, tableros y sombrillas de pocos lados marcados como sustitutos (no aparecen de golpe).
  // Azar: ámbito env.rnd(11, tramo, primer vano del comercio), 40 números de golpe.
  const TERR = new Set(['BAR', 'CAFÈ', 'RESTAURANT', 'GELATERIA'].map(n => SHOPS.indexOf(n)));
  const PINT = pbrAux(0.4, 0, 0, 0), ALU = pbrAux(0.35, 1, 0, 0), RATTAN = pbrAux(0.7, 0, 1, 0), TELA = pbrAux(0.85, 0, 0, 0), PIZ = pbrAux(0.8, 0, 1, 0), SUB = subAux();
  function terrace(env, run, s) {
    const { W0, W1 } = env, { F, r } = run;
    env.rnd(11, run.i, s.w0);
    const q = []; for (let j = 0; j < 40; j++) q.push(R());
    if (!run.street || !TERR.has(s.type) || q[0] > 0.85) return;
    const city = ctx.city, wp = (u, d) => [r.ax + r.tx * u + r.nx * d, r.az + r.tz * u + r.nz * d];
    let S = 1e9;
    for (const u of [s.uA, (s.uA + s.uB) / 2, s.uB]) { const [x, z] = wp(u, 0.3); S = Math.min(S, city.roadDist(x, z) + 0.3); }
    if (API.log) { const [x, z] = wp((s.uA + s.uB) / 2, 0); API.log.push(['T', +x.toFixed(1), +z.toFixed(1), r.nx, r.nz, +S.toFixed(2)]); }
    if (!(S >= 5.2) || S > 60) return;
    const D1 = Math.min(2.9, S - 3.2), dC = (0.6 + D1) / 2, [dB0, dB1] = opening(run, s.door), doorU = (dB0 + dB1) / 2;
    const free = (u, d) => { const [x, z] = wp(u, d); return city.coverAt(x, z, -1) < -1e8; };
    const yAt = (u, d) => { const [x, z] = wp(u, d); return city.walkAt(x, z); };
    const top = q[1] < 0.5 ? [226, 222, 214] : [48, 50, 54], foot = [38, 38, 42];
    const chC = q[2] < 0.4 ? [176, 178, 182] : q[2] < 0.7 ? [150, 106, 60] : [40, 78, 60], chA = q[2] < 0.4 ? ALU : q[2] < 0.7 ? RATTAN : PINT;
    const awn = s.T.awn, umb = !s.awn;
    // mesas: una cada 1,9 m a lo largo del comercio, sin tapar la puerta
    const slots = [];
    for (let u = s.uA + 0.7; u <= s.uB - 0.7 && slots.length < 6; u += 1.9) if (Math.abs(u - doorU) > 1.1 && free(u, dC) && free(u, D1)) slots.push(u);
    if (slots.length < 2) return;
    slots.forEach((u, j) => {
      const y = yAt(u, dC), n = 2 + ((q[4 + j] * 3) | 0);
      rev(W1, F, u, dC, [[0.24, y], [0.24, y + 0.03], [0.035, y + 0.06], [0.03, y + 0.7], [0.3, y + 0.71, top], [0.34, y + 0.715, top], [0.34, y + 0.745, top], [0, y + 0.745, top]], 12, foot, K.PBR, { aux: PINT });
      rev(W0, F, u, dC, [[0.34, y + 0.70], [0.34, y + 0.745], [0, y + 0.745]], 6, top, K.PLAIN, { aux: SUB });
      // sillas alrededor (a lo largo y hacia la calle primero; la de cara a la fachada, la última)
      const pos = [[-0.62, 0], [0.62, 0], [0, 0.6], [0, -0.6]];
      for (let k = 0; k < n; k++) chair(W1, u + pos[k][0], dC + pos[k][1], pos[k][0] ? Math.sign(pos[k][0]) : 0, pos[k][1] ? Math.sign(pos[k][1]) : 0, y, chC, chA);
      // sombrilla abierta o cerrada sobre algunas mesas
      if (umb && q[12 + j] < 0.6) {
        rev(W1, F, u, dC, [[0.022, y + 0.745], [0.022, y + 2.35]], 5, [60, 60, 64], K.PBR, { aux: PINT });
        if (q[20 + j] < 0.75) {
          const cr = 0.95, hy = y + 2.08;
          rev(W1, F, u, dC, [[cr, hy - 0.1], [cr, hy], [0, hy + 0.4]], 10, awn, K.PBR, { aux: TELA });
          rev(W1, F, u, dC, [[0, hy + 0.38], [cr - 0.01, hy - 0.01]], 10, shade(awn, 0.62), K.PBR, { aux: TELA });
          rev(W0, F, u, dC, [[cr, hy], [0, hy + 0.4]], 6, awn, K.PLAIN, { aux: SUB });
        } else rev(W1, F, u, dC, [[0.03, y + 1.25], [0.11, y + 1.95], [0.0, y + 2.5]], 7, awn, K.PBR, { aux: TELA });
      }
    });
    // jardineras en los extremos de la terraza, perpendiculares a la fachada
    const shrub = [52, 96, 46];
    for (const u of [slots[0] - 1.05, slots[slots.length - 1] + 1.05]) {
      if (!free(u, dC)) continue;
      const y = yAt(u, dC), d0 = 0.65, d1 = Math.max(d0 + 0.8, D1 - 0.1);
      box(W0, F, u - 0.2, u + 0.2, y - 0.05, y + 0.45, d0, d1, [120, 92, 66], K.PBR, 7, RATTAN);
      if (W1) for (let k = 0; k < 3; k++) { const dd = d0 + (d1 - d0) * (k + 0.5) / 3;
        sphere(W1, F, u, y + 0.62, dd, 0.26 + 0.05 * q[30 + k], 7, 4, mixc(shrub, [90, 130, 50], q[33 + k] * 0.5), K.LEAF, undefined, 0.8); }
    }
    // pizarra de caballete junto a la puerta
    if (W1) {
      const u = doorU + (q[3] < 0.5 ? -1 : 1) * (dB1 - dB0) * 0.5 + (q[3] < 0.5 ? -0.45 : 0.45), dP = 0.75, y = yAt(u, dP);
      for (const sg of [1, -1]) {
        quad(W1, F, u - 0.3, y, dP + sg * 0.24, u + 0.3, y, dP + sg * 0.24, u + 0.3, y + 1.0, dP, u - 0.3, y + 1.0, dP, [120, 84, 50], K.PBR, PINT);
        quad(W1, F, u - 0.25, y + 0.12, dP + sg * 0.215, u + 0.25, y + 0.12, dP + sg * 0.215, u + 0.25, y + 0.93, dP + sg * 0.02, u - 0.25, y + 0.93, dP + sg * 0.02, [34, 38, 36], K.PBR, PIZ);
      }
    }
    // silla de terraza: asiento, cuatro patas y respaldo en el lado opuesto a la mesa (su, sd = hacia dónde queda la silla)
    function chair(B, cu, cd, su, sd, y, col, aux) {
      if (!B) return;
      const h = 0.21, ys = y + 0.45;
      box(B, F, cu - h, cu + h, ys - 0.035, ys, cd - h, cd + h, col, K.PBR, 7, aux);
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(B, F, cu + a * (h - 0.03) - 0.014, cu + a * (h - 0.03) + 0.014, y, ys - 0.035, cd + b * (h - 0.03) - 0.014, cd + b * (h - 0.03) + 0.014, col, K.PBR, 4, aux);
      if (su) box(B, F, cu + su * h - 0.03, cu + su * h, ys, ys + 0.42, cd - h, cd + h, col, K.PBR, 7, aux);
      else box(B, F, cu - h, cu + h, ys, ys + 0.42, cd + sd * h - (sd > 0 ? 0.03 : 0), cd + sd * h + (sd > 0 ? 0 : 0.03), col, K.PBR, 7, aux);
    }
  }
  // portal: puerta de madera con montante de vidrio, recercado de piedra y farol
  function portalBay(env, run, a, c, gl, yB, rr) {
    const { W0, W1, F1, stone, wood, glass, iron } = env, { F, bw } = run, KSB = K.FXPIEDRA !== undefined ? K.FXPIEDRA : K.STONE;   // n3 E4: sillería sin teñir
    const dw = Math.min(1.2, bw / 2 - 0.35), dtop = Math.min(F1 - 0.55, gl + 3.5), x0 = c - dw, x1 = c + dw, sc = stone;
    rect(W0, F, a, x0, yB, F1, 0, sc, KSB, wa(env, F, a, x0, yB, F1)); rect(W0, F, x1, a + bw, yB, F1, 0, sc, KSB, wa(env, F, x1, a + bw, yB, F1)); rect(W0, F, x0, x1, dtop, F1, 0, sc, KSB, wa(env, F, x0, x1, dtop, F1));
    // umbral a ras del peldaño y zócalo debajo: sin huecos aunque la acera baje por un lado (calle en cuesta)
    hpl(W0, F, x0, x1, gl + 0.12, -0.45, 0, sc, KSB); rect(W0, F, x0, x1, yB, gl + 0.12, 0, shade(sc, 0.85), KSB, wa(env, F, x0, x1, yB, gl + 0.12));
    jamb(W0, F, x0, gl, dtop, -0.45, 0, shade(sc, 0.6), KSB); jamb(W0, F, x1, gl, dtop, -0.45, 0, shade(sc, 0.6), KSB);
    hpl(W0, F, x0, x1, dtop, -0.45, 0, shade(sc, 0.5), KSB);
    // puerta de dos hojas de vidrio con reja de forja (la dibuja el shader K.HOMEWIN) y, detrás, el zaguán: estrecho, ~3,3 m
    // de alto y 9 m de fondo. Marco y zócalo de madera, travesaño del montante, tirador de latón
    if (API.log) API.log.push(['P', +(run.r.ax + run.r.tx * c).toFixed(1), +(run.r.az + run.r.tz * c).toFixed(1), run.r.nx, run.r.nz]);
    const tr = dtop - 0.85, zt = gl + 0.12 + 0.42, yF = gl + 0.12, dg = -0.43;
    const rm = { x0: x0 - 0.35, W: x1 - x0 + 0.7, yF, H: Math.max(3.3, dtop - yF + 0.25), D: 9, mode: 0, seed: 1 + ((rr[1] * 254) | 0) };
    roomQuad(W0, F, x0, x1, zt, dtop, dg, rm);
    const fr = shade(wood, 0.8);
    rect(W0, F, x0, x1, gl + 0.12, zt, -0.42, wood, K.WOOD);                                          // zócalo
    box(W0, F, x0, x0 + 0.1, zt, dtop, -0.43, -0.37, fr, K.WOOD, 4); box(W0, F, x1 - 0.1, x1, zt, dtop, -0.43, -0.37, fr, K.WOOD, 4);   // largueros
    box(W0, F, c - 0.06, c + 0.06, zt, tr, -0.43, -0.36, fr, K.WOOD, 4);                               // encuentro de las hojas
    box(W0, F, x0, x1, tr - 0.06, tr + 0.06, -0.43, -0.36, fr, K.WOOD, 3);                             // travesaño del montante
    box(W0, F, x0, x1, dtop - 0.08, dtop, -0.43, -0.37, fr, K.WOOD, 2);
    box(W0, F, x0, x1, zt - 0.05, zt + 0.03, -0.43, -0.37, fr, K.WOOD, 1);
    box(W0, F, x0 - 0.25, x1 + 0.25, gl - 0.2, gl + 0.12, 0, 0.55, shade(sc, 1.15), KSB);
    if (W1) {
      box(W1, F, x0 - 0.34, x0, gl + 0.3, dtop + 0.1, 0, 0.28, shade(sc, 1.05), KSB); box(W1, F, x1, x1 + 0.34, gl + 0.3, dtop + 0.1, 0, 0.28, shade(sc, 1.05), KSB);
      box(W1, F, x0 - 0.44, x1 + 0.44, dtop + 0.1, dtop + 0.3, 0, 0.4, shade(sc, 1.08), KSB);
      box(W1, F, c - 0.24, c + 0.24, dtop - 0.08, dtop + 0.42, 0, 0.5, shade(sc, 1.15), KSB);
      for (const [l0, l1] of [[x0 + 0.1, c - 0.06], [c + 0.06, x1 - 0.1]])                           // plafones del zócalo
        box(W1, F, l0 + 0.06, l1 - 0.06, gl + 0.2, zt - 0.1, -0.42, -0.39, shade(wood, 1.12), K.WOOD, 7);
      const LATON = pbrAux(0.3, 1, 0, 0), brass = [196, 152, 70];
      for (const s of [-1, 1]) { box(W1, F, c + s * 0.1 - 0.02, c + s * 0.1 + 0.02, gl + 1.0, gl + 1.45, -0.32, -0.29, brass, K.PBR, 7, LATON);
        box(W1, F, c + s * 0.1 - 0.02, c + s * 0.1 + 0.02, gl + 1.03, gl + 1.07, -0.36, -0.32, brass, K.PBR, 4, LATON);
        box(W1, F, c + s * 0.1 - 0.02, c + s * 0.1 + 0.02, gl + 1.38, gl + 1.42, -0.36, -0.32, brass, K.PBR, 4, LATON); }
      // placa del número (esmalte claro con canto oscuro) sobre la pilastra derecha y portero automático en la izquierda
      box(W1, F, x1 + 0.05, x1 + 0.29, gl + 2.05, gl + 2.25, 0.28, 0.3, [30, 44, 80], K.PBR, 7, pbrAux(0.25, 0, 0, 0));
      box(W1, F, x1 + 0.07, x1 + 0.27, gl + 2.07, gl + 2.23, 0.3, 0.305, [228, 228, 220], K.PBR, 1, pbrAux(0.25, 0, 0, 0));
      box(W1, F, x0 - 0.29, x0 - 0.05, gl + 1.2, gl + 1.72, 0.28, 0.305, [150, 152, 156], K.PBR, 7, ACERO);
      box(W1, F, x0 - 0.25, x0 - 0.09, gl + 1.6, gl + 1.68, 0.305, 0.31, [40, 40, 44], K.PBR, 1, pbrAux(0.6, 0, 0, 0));
      for (let q = 0; q < 4; q++) box(W1, F, x0 - 0.21, x0 - 0.13, gl + 1.26 + q * 0.08, gl + 1.31 + q * 0.08, 0.305, 0.315, [210, 210, 214], K.PBR, 1, ACERO);
      if (rr[0] < 0.6) { box(W1, F, x1 + 0.42, x1 + 0.6, gl + 2.6, gl + 3.0, 0.12, 0.32, [235, 220, 180], K.LAMP); box(W1, F, x1 + 0.48, x1 + 0.54, gl + 3.0, gl + 3.2, 0, 0.3, iron, K.METAL); }
    }
  }

  if (window.BCN_KIT) window.BCN_KIT.TI = { portalBay, roomQuad };   // planta baja de siempre, para las piezas «pb» del kit
  return { groundFloor, signTex: sign };
} };
})();
