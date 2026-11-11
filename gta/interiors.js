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
const { K, regKind, quad, rect, jamb, hpl, box, lattice, shade, signAux, pbrAux, R } = window.BCN_GEO;

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
  { n: 'FARMÀCIA', w: 5, sign: ['#0f6b3a', '#ffffff'], awn: [31, 110, 66], wall: [236, 240, 238], floor: [FL.BALDOSA, [214, 218, 220], [170, 176, 180]], warm: 0.15, lamp: LAMP.FOCOS,
    back: [BACK.ESTANTES, [230, 232, 230]], far: [LY.MOSTRADOR, [232, 236, 234]], near: [LY.ISLA, [225, 228, 226]], shelf: [LY.CRUZ, [220, 224, 222]], acc: [40, 170, 80], pal: PAL.FARMACIA, shape: SH.CAJA },
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
  { n: 'PERRUQUERIA', w: 7, sign: ['#2b2b2f', '#f3d7e0'], awn: [60, 60, 66], wall: [232, 224, 226], floor: [FL.BALDOSA, [200, 196, 196], [150, 146, 148]], warm: 0.45, lamp: LAMP.FOCOS,
    back: [BACK.ESPEJOS, [40, 40, 44]], far: [LY.SILLONES, [30, 30, 34]], near: [LY.NADA, [0, 0, 0]], shelf: [LY.NADA, [0, 0, 0]], acc: [210, 120, 150], pal: PAL.VARIADO, shape: SH.BOTELLA },
  { n: 'MODA', w: 7, sign: ['#151517', '#f2f0ea'], awn: [219, 204, 168], wall: [236, 230, 220], floor: [FL.TARIMA, [190, 160, 120], [190, 160, 120]], warm: 0.6, lamp: LAMP.FOCOS,
    back: [BACK.PERCHERO, [200, 190, 170]], far: [LY.BURRAS, [160, 160, 165]], near: [LY.NADA, [0, 0, 0]], shelf: [LY.MANIQUIES, [226, 220, 210]], acc: [20, 20, 24], pal: PAL.ROPA, shape: SH.CAJA },
  { n: 'GELATERIA', w: 3, sign: ['#d9668a', '#ffffff'], awn: [230, 150, 170], wall: [190, 228, 214], floor: [FL.DAMERO, [240, 240, 236], [240, 170, 190]], warm: 0.5, lamp: LAMP.FOCOS,
    back: [BACK.PIZARRAS, [240, 236, 228]], far: [LY.MOSTRADOR, [244, 240, 232]], near: [LY.MESAS, [226, 150, 170]], shelf: [LY.NADA, [0, 0, 0]], acc: [240, 120, 150], pal: PAL.HELADO, shape: SH.REDONDO },
  { n: 'CAFÈ', w: 10, sign: ['#17594c', '#f6e8c9'], awn: [31, 77, 56], wall: [70, 92, 78], floor: [FL.TARIMA, [120, 84, 54], [120, 84, 54]], warm: 0.9, lamp: LAMP.CALIDA,
    back: [BACK.PIZARRAS, [84, 56, 36]], far: [LY.MOSTRADOR, [96, 64, 40]], near: [LY.MESAS, [70, 48, 32]], shelf: [LY.NADA, [0, 0, 0]], acc: [230, 200, 140], pal: PAL.PAN, shape: SH.REDONDO },
  { n: 'QUEVIURES', w: 10, sign: ['#5c3b16', '#f6e8c9'], awn: [166, 36, 33], wall: [226, 214, 180], floor: [FL.DAMERO, [206, 196, 174], [150, 70, 56]], warm: 0.7, lamp: LAMP.TUBOS,
    back: [BACK.ESTANTES, [140, 100, 60]], far: [LY.MOSTRADOR, [130, 92, 56]], near: [LY.NADA, [0, 0, 0]], shelf: [LY.TARIMA, [120, 86, 54]], acc: [190, 60, 40], pal: PAL.VARIADO, shape: SH.MIXTO },
  { n: 'ÒPTICA', w: 3, sign: ['#1a4f8a', '#ffffff'], awn: [38, 56, 107], wall: [240, 240, 238], floor: [FL.BALDOSA, [206, 208, 210], [160, 162, 166]], warm: 0.2, lamp: LAMP.FOCOS,
    back: [BACK.GAFAS, [250, 250, 246]], far: [LY.MOSTRADOR, [236, 236, 232]], near: [LY.ISLA, [228, 230, 232]], shelf: [LY.TARIMA, [236, 236, 232]], acc: [30, 90, 160], pal: PAL.GAFAS, shape: SH.GAFAS },
  { n: 'PAPERERIA', w: 4, sign: ['#b8401c', '#fff4c9'], awn: [219, 204, 168], wall: [200, 216, 232], floor: [FL.BALDOSA, [196, 190, 176], [150, 146, 136]], warm: 0.5, lamp: LAMP.TUBOS,
    back: [BACK.ESTANTES, [220, 220, 214]], far: [LY.MOSTRADOR, [70, 110, 160]], near: [LY.ISLA, [210, 206, 196]], shelf: [LY.TARIMA, [60, 100, 150]], acc: [230, 180, 40], pal: PAL.VARIADO, shape: SH.CAJA },
  { n: 'FORMATGERIA', w: 3, sign: ['#6b5a1e', '#fff4c9'], awn: [150, 120, 40], wall: [232, 220, 188], floor: [FL.DAMERO, [220, 210, 190], [80, 68, 56]], warm: 0.8, lamp: LAMP.FOCOS,
    back: [BACK.ESTANTES, [130, 92, 54]], far: [LY.MOSTRADOR, [228, 224, 212]], near: [LY.NADA, [0, 0, 0]], shelf: [LY.TARIMA, [120, 84, 50]], acc: [200, 150, 40], pal: PAL.QUESO, shape: SH.REDONDO },
  // solo en comercios anchos (lo decide shopPlan): w = 0 lo deja fuera del sorteo general
  { n: 'SUPERMERCAT', w: 0, sign: ['#c8201c', '#ffffff'], awn: [166, 36, 33], wall: [238, 240, 240], floor: [FL.BALDOSA, [222, 222, 216], [170, 170, 166]], warm: 0.05, lamp: LAMP.TUBOS,
    back: [BACK.ESTANTES, [225, 228, 230]], far: [LY.LINEALES, [228, 230, 232]], near: [LY.NADA, [0, 0, 0]], shelf: [LY.CARTELES, [0, 0, 0]], acc: [220, 40, 40], pal: PAL.VARIADO, shape: SH.MIXTO },
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
// color de un artículo: la paleta 0 es un arcoíris suave y las demás salen de la textura (8 colores por paleta)
vec3 shPal(float pal, float h){
  if (pal < 0.5) return 0.52 + 0.35*cos(6.2832*(h + vec3(0.0, 0.33, 0.67)));
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
  float g = mix(1.05, mix(mix(2.2, 1.5, smoothstep(0.18, 0.62, lum)), 1.05, smoothstep(1.2, 2.4, lum)), uDusk);
  return emit(room, g)*(1.0 - k) + envRefl(reflect(-V, N), 0.0)*k*(1.0 - 0.4*uDusk);
}`;
regKind('SHOPWIN', 20, `
    float sw = vCol.r*16.0, stb = floor(vCol.g*255.0 + 0.5), stp = mod(stb, 32.0), sfl = floor(stb/32.0);
    vec2 so = vec2(vInfo.x*sw, vInfo.y*6.0 - 1.0);
    float spx = max(max(fwidth(so.x), fwidth(so.y)), 1e-4);
    vec3 stu = T*(mod(sfl, 2.0) > 0.5 ? -1.0 : 1.0);
    vec3 srm = shRoom(so, vec3(-dot(V, stu), -V.y, dot(V, n)), vec3(sw, vInfo.z*8.0, vInfo.w*16.32), stp, floor(vCol.b*255.0 + 0.5), spx, dist, step(1.5, mod(sfl, 4.0)));
    vec3 c = shGlass(srm, V, N);
    FRAG(c); return;`, SHOP_DECL);

const API = window.BCN_INTERIORS = { SHOPS, TYPES, force: parseForce(), paramData, paramSize: [PARW, PARH], init(ctx) {
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
    const { W0, W1, F1, y0, u, stone, iron, shops, shopsHere, windowHole } = env;
    const { F, cover, street, nb, bw, N, wallC, gnd } = run;
    if (F1 <= cover + 0.3) return;                            // tapado por el vecino
    const yB = Math.max(y0, cover - 0.3), gls = [];
    for (let W = 0; W < nb; W++) gls.push(Math.min(gnd((W + 0.5) * bw), F1 - 2.7));   // cota de la acera delante de cada vano (city.walkAt), con tope
    const plan = street && shopsHere ? shopPlan(env, run, gls) : null;
    for (let W = 0; W < nb; W++) {
      const a = W * bw, c = a + bw / 2, gl = gls[W];
      env.rnd(2, run.i, W);
      const rr = [R(), R(), R(), R(), R(), R()];
      if (street && W === N) { portalBay(env, run, a, c, gl, yB, rr); continue; }
      if (plan) { shopBay(env, run, W, gl, yB, plan.of[W]); continue; }
      // ventana de planta baja (con reja si da a la calle)
      const ww = Math.min(street ? 1.25 : 1.05, bw - 0.9), tt = c - ww / 2, ct = c + ww / 2;
      const st = gl + 1.0, yt = Math.min(F1 - 0.45, st + (street ? 1.9 : 1.45));
      const gc = street && shops ? stone : wallC, gk = street && shops ? K.STONE : K.STUCCO;
      if (yt - st < 0.6) { rect(W0, F, a, a + bw, yB, F1, 0, gc, gk); continue; }
      windowHole(W0, F, a, a + bw, tt, ct, yB, F1, st, yt, street ? 0.3 : 0.2, gc, gk, rr[0] < 0.6 ? 0.2 + rr[1] * 0.5 : 0);
      if (street) { lattice(W0, F, tt, ct, st, yt, 0.05, iron, K.IRON, 1); box(W1, F, tt - 0.05, ct + 0.05, st - 0.08, st, 0, 0.12, shade(gc, 1.05), gk); }
      else box(W1, F, tt - 0.05, ct + 0.05, st - 0.07, st, 0, 0.09, u, K.STUCCO);
    }
    if (plan) for (const s of plan.list) shopFront(env, run, s);
  }

  // ---------------------------------------------------------------- comercios
  // Reparto: cada grupo de vanos contiguos a un lado del portal se parte en comercios de hasta 4 vanos o ~14 m. Cada comercio
  // (ámbito env.rnd(10, tramo, primer vano)) tiene un tipo estable, un vano que es su puerta, y una habitación virtual común a
  // todos sus vidrios: origen x0 (u del extremo), ancho W, suelo yF, alto H y fondo D.
  const opening = (run, W) => { const Uw = run.bw * 0.84, B_ = W * run.bw + (run.bw - Uw) / 2; return [B_, B_ + Uw]; };
  const topOf = (env, gl) => Math.min(env.F1 - 1.0, gl + 3.4);
  function shopPlan(env, run, gls) {
    const { nb, bw, N, F } = run, list = [], of = [];
    const maxB = Math.max(1, Math.min(4, Math.floor(14 / bw)));
    const seg = (a, b) => { const n = b - a; if (n <= 0) return; const k = Math.ceil(n / maxB);
      for (let j = 0; j < k; j++) { const w0 = a + Math.round(n * j / k), w1 = a + Math.round(n * (j + 1) / k); if (w1 > w0) list.push({ w0, w1 }); } };
    if (N >= 0) { seg(0, N); seg(N + 1, nb); } else seg(0, nb);
    const dir = (-F.nz * F.tx + F.nx * F.tz) > 0 ? 0 : 1;     // ¿la tangente T del shader va en el sentido de u?
    for (const s of list) {
      env.rnd(10, run.i, s.w0);
      const r = [R(), R(), R(), R(), R(), R()], n = s.w1 - s.w0;
      s.type = API.force >= 0 ? API.force : n >= 3 && n * bw >= 9.5 && r[0] < 0.3 ? SUPER : pickType(r[1]);
      s.T = TYPES[s.type];
      s.door = s.w0 + Math.min(n - 1, (r[2] * n) | 0);
      s.sign = r[3] < 0.93; s.awn = r[4] < 0.35; s.seed = 1 + ((r[5] * 254) | 0);
      s.uA = opening(run, s.w0)[0]; s.uB = opening(run, s.w1 - 1)[1];
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
  // un vano de comercio: machones y dintel de piedra y, dentro, el escaparate o la puerta de vidrio de la tienda
  function shopBay(env, run, W, gl, yB, s) {
    const { W0, W1, F1, stone } = env, { F, bw } = run;
    const a = W * bw, [B_, V_] = opening(run, W), Uw = V_ - B_;
    const top = topOf(env, gl), sill = gl + 0.5, sc = stone, dk = shade(sc, 0.55), base = shade(sc, 0.85), met = FRAME;
    rect(W0, F, a, B_, yB, F1, 0, sc, K.STONE); rect(W0, F, V_, a + bw, yB, F1, 0, sc, K.STONE); rect(W0, F, B_, V_, top, F1, 0, sc, K.STONE);
    jamb(W0, F, B_, sill, top, -0.4, 0, dk, K.STONE); jamb(W0, F, V_, sill, top, -0.4, 0, dk, K.STONE);
    hpl(W0, F, B_, V_, top, -0.4, 0, shade(sc, 0.5), K.STONE);
    if (W !== s.door) {
      rect(W0, F, B_, V_, yB, sill, 0, base, K.STONE); hpl(W0, F, B_, V_, sill, -0.4, 0, shade(sc, 0.72), K.STONE);
      glassQuad(W0, F, B_, V_, sill, top, -0.36, s, false);
      box(W0, F, B_ + Uw * 0.5 - 0.03, B_ + Uw * 0.5 + 0.03, sill, top, -0.38, -0.3, met, K.METAL);
      box(W0, F, B_, V_, sill, sill + 0.08, -0.4, -0.3, met, K.METAL);
      if (W1) { box(W1, F, B_, B_ + 0.05, sill, top, -0.4, -0.3, met, K.METAL, 4); box(W1, F, V_ - 0.05, V_, sill, top, -0.4, -0.3, met, K.METAL, 4);
        box(W1, F, B_, V_, top - 0.06, top, -0.4, -0.3, met, K.METAL, 2); }
    } else {
      // puerta de vidrio centrada, con vidrios fijos a los lados y montante encima. El umbral baja hasta la acera
      const dc = (B_ + V_) / 2, x0 = dc - 0.55, x1 = dc + 0.55, th = gl + 0.03, dt = Math.min(top - 0.3, th + 2.25);
      rect(W0, F, B_, x0, yB, sill, 0, base, K.STONE); rect(W0, F, x1, V_, yB, sill, 0, base, K.STONE); rect(W0, F, x0, x1, yB, th, 0, base, K.STONE);
      hpl(W0, F, B_, x0, sill, -0.4, 0, shade(sc, 0.72), K.STONE); hpl(W0, F, x1, V_, sill, -0.4, 0, shade(sc, 0.72), K.STONE);
      jamb(W0, F, x0, th, sill, -0.4, 0, dk, K.STONE); jamb(W0, F, x1, th, sill, -0.4, 0, dk, K.STONE);
      hpl(W0, F, x0, x1, th, -0.4, 0, shade(sc, 0.9), K.STONE);
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
    if (s.awn) { const ac = s.T.awn;
      quad(W0, F, B_, top - 0.02, 0.05, V_, top - 0.02, 0.05, V_, top - 0.7, 1.35, B_, top - 0.7, 1.35, ac, K.AWN);
      quad(W1, F, B_, top - 0.7, 1.35, V_, top - 0.7, 1.35, V_, top - 0.9, 1.35, B_, top - 0.9, 1.35, ac, K.AWN); }
  }
  // lo que es del comercio entero: rótulo centrado sobre sus vanos y, en la farmacia, la cruz luminosa en banderola
  function shopFront(env, run, s) {
    const { W0, W1, F1 } = env, { F } = run;
    const sv0 = s.top + 0.12, hmax = Math.min(0.56, F1 - 0.2 - sv0);
    if (s.sign && hmax > 0.22) {
      const w = Math.min(hmax * 8, s.uB - s.uA - 0.1), h = w / 8, uc = (s.uA + s.uB) / 2, y = sv0 + (hmax - h) / 2;
      quad(W0, F, uc - w / 2, y, 0.07, uc + w / 2, y, 0.07, uc + w / 2, y + h, 0.07, uc - w / 2, y + h, 0.07, [255, 255, 255], K.SIGN, signAux(s.type));
      box(W1, F, uc - w / 2 - 0.03, uc + w / 2 + 0.03, y - 0.03, y + h + 0.03, 0, 0.06, [30, 30, 32], K.METAL);
    }
    if (s.T.shelf[0] === LY.CRUZ) { const uc = s.uA - 0.14, y = s.top - 0.5, g = [40, 215, 95];
      box(W0, F, uc - 0.04, uc + 0.04, y - 0.11, y + 0.11, 0.2, 0.86, g, K.PBR, 7, NEON); box(W0, F, uc - 0.04, uc + 0.04, y - 0.33, y + 0.33, 0.42, 0.64, g, K.PBR, 7, NEON);
      box(W1, F, uc - 0.015, uc + 0.015, y - 0.02, y + 0.02, 0, 0.2, FRAME, K.METAL); }
  }
  // portal: puerta de madera con montante de vidrio, recercado de piedra y farol
  function portalBay(env, run, a, c, gl, yB, rr) {
    const { W0, W1, F1, stone, wood, glass, iron } = env, { F, bw } = run;
    const dw = Math.min(1.2, bw / 2 - 0.35), dtop = Math.min(F1 - 0.55, gl + 3.5), x0 = c - dw, x1 = c + dw, sc = stone;
    rect(W0, F, a, x0, yB, F1, 0, sc, K.STONE); rect(W0, F, x1, a + bw, yB, F1, 0, sc, K.STONE); rect(W0, F, x0, x1, dtop, F1, 0, sc, K.STONE);
    // umbral a ras del peldaño y zócalo debajo: sin huecos aunque la acera baje por un lado (calle en cuesta)
    hpl(W0, F, x0, x1, gl + 0.12, -0.45, 0, sc, K.STONE); rect(W0, F, x0, x1, yB, gl + 0.12, 0, shade(sc, 0.85), K.STONE);
    jamb(W0, F, x0, gl, dtop, -0.45, 0, shade(sc, 0.6), K.STONE); jamb(W0, F, x1, gl, dtop, -0.45, 0, shade(sc, 0.6), K.STONE);
    hpl(W0, F, x0, x1, dtop, -0.45, 0, shade(sc, 0.5), K.STONE);
    const tr = dtop - 0.95;
    rect(W0, F, x0, x1, gl, tr, -0.42, wood, K.WOOD); rect(W0, F, x0, x1, tr, dtop, -0.43, glass, K.GLASS);
    box(W0, F, x0 - 0.25, x1 + 0.25, gl - 0.2, gl + 0.12, 0, 0.55, shade(sc, 1.15), K.STONE);
    if (W1) {
      box(W1, F, x0 - 0.34, x0, gl + 0.3, dtop + 0.1, 0, 0.28, shade(sc, 1.05), K.STONE); box(W1, F, x1, x1 + 0.34, gl + 0.3, dtop + 0.1, 0, 0.28, shade(sc, 1.05), K.STONE);
      box(W1, F, x0 - 0.44, x1 + 0.44, dtop + 0.1, dtop + 0.3, 0, 0.4, shade(sc, 1.08), K.STONE);
      box(W1, F, c - 0.24, c + 0.24, dtop - 0.08, dtop + 0.42, 0, 0.5, shade(sc, 1.15), K.STONE);
      box(W1, F, c - 0.02, c + 0.02, gl, tr, -0.42, -0.39, shade(wood, 0.6), K.WOOD);
      for (const [l0, l1] of [[x0 + 0.12, c - 0.12], [c + 0.12, x1 - 0.12]]) {
        box(W1, F, l0, l1, gl + 0.3, gl + 1.1, -0.42, -0.37, shade(wood, 1.15), K.WOOD); box(W1, F, l0, l1, gl + 1.35, tr - 0.2, -0.42, -0.37, shade(wood, 1.15), K.WOOD); }
      for (const s of [-1, 1]) box(W1, F, c + s * 0.09 - 0.025, c + s * 0.09 + 0.025, gl + 1.0, gl + 1.32, -0.39, -0.33, [184, 140, 56], K.METAL);
      for (let q = 1; q < 6; q++) { const xx = x0 + (x1 - x0) * q / 6; box(W1, F, xx - 0.015, xx + 0.015, tr, dtop, -0.42, -0.39, iron, K.METAL); }
      if (rr[0] < 0.6) { box(W1, F, x1 + 0.42, x1 + 0.6, gl + 2.6, gl + 3.0, 0.12, 0.32, [235, 220, 180], K.LAMP); box(W1, F, x1 + 0.48, x1 + 0.54, gl + 3.0, gl + 3.2, 0, 0.3, iron, K.METAL); }
    }
  }

  return { groundFloor, signTex: sign };
} };
})();
