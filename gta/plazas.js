/* GTA Barcelona — Plazas (etapa PLAZAS, P1).
   Todas las plazas con nombre de Barcelona (data/plazas.json: inventario de Nominatim/OSM con su contorno en coordenadas del
   juego, superficie, tipo y eje principal) reciben:
     · pavimento propio (losa de granito, panot, sauló, caucho de juegos, césped de parterre, piedra lisa, reja de alcorque)
       en una malla a ras de acera, solo donde no hay calzada ni edificio (el contorno real lo recortan las calles);
     · equipamiento según tamaño y forma: árboles en alcorque o en parterre, farolas, bancos (el «banc romàntic» de
       furniture.js y bancos de piedra), papeleras, fuente de beber tipo Canaletes, zona de juegos sobre caucho, quiosco,
       pérgola, aparcabicis, mesa de ping-pong;
     · plazas singulares fieles (P1): Catalunya, Espanya, Glòries y Lesseps (P2 añadirá más). Los monumentos grandes (fuente
       de la Plaça d'Espanya, Canòpia Urbana) son hitos (BCN_LM): siempre cargados y con focos de noche.
   Contrato: window.BCN_PLAZAS = { init(ctx) → { update, busy, stats, flush, list } } (addMod('plz')). Se construye por plaza,
   en segundo plano y por distancia: capa sencilla (pavimento + equipamiento + mobiliario sencillo) a < 420 m y capa de
   detalle del mobiliario (furniture.js, nivel 2) a < 90 m, con el mismo relevo tramado que las calles (uCellHi/uFurnHi).
   Tipos de material propios (ids 140–149): PLZ_LEAF 141 (copas), PLZ_WATER 142 (agua); el pavimento lleva material propio. */
(function () {
'use strict';
const G = window.BCN_GEO;
const { K, F0, GB, quad, box, rev, tube, sphere, obox, bar, shade, mixc, seed, R, hash2, regKind } = G;

// ------------------------------------------------------------------ tipos de material (al cargar: el shader de detalle se monta en init de facades.js)
// Pavimento: material propio (no el de detalle) para que se vea desde el dron: fundido tramado a 560–640 m, no a ~245 m.
// Formato de vértice = el de GB: color = albedo base; auxiliar por vértice = (dibujo, luz de farola cocida 0–1, desgaste 0–1, 0)
const VS_PAV = `precision highp float;
attribute vec3 position; attribute vec4 color; attribute vec4 uv; uniform mat4 world; uniform mat4 viewProjection;
varying vec3 vPos; varying vec4 vCol; varying vec4 vInfo;
void main(){ vec4 wp = world*vec4(position, 1.0); vPos = wp.xyz; vCol = color; vInfo = uv; gl_Position = viewProjection*wp; }`;
const FS_PAV = `
varying vec4 vCol; varying vec4 vInfo; uniform vec2 uPavFade;
void main(){
  vec3 V = uCam - vPos; float dist = length(V); V /= dist;
  if (dith() < smoothstep(uPavFade.x, uPavFade.y, dist)) discard;
  vec3 alb = vCol.rgb, N = vec3(0.0, 1.0, 0.0), emis = vec3(0.0); float rough = 0.85;

  float pat = floor(vInfo.x*255.0 + 0.5), pGlow = vInfo.y, pWear = vInfo.z;
  vec2 W = vPos.xz; float fw = fwidth(W.x) + fwidth(W.y);
  float n1 = vnoise(W*0.31)*0.55 + vnoise(W*0.045)*0.45, n2 = vnoise(W*2.3);
  if (pat < 1.5) {                                  // 1: losas de granito de 60×40 a matajunta
    vec2 q = W/vec2(0.6, 0.4); q.x += 0.5*floor(q.y); vec2 id = floor(q), f = fract(q);
    float j = min(min(f.x, 1.0 - f.x)*0.6, min(f.y, 1.0 - f.y)*0.4), jt = smoothstep(0.003, 0.011, j), aa = smoothstep(0.02, 0.1, fw);
    alb *= mix(mix(0.8, 1.0, jt)*mix(0.9, 1.08, hash21(id)), 0.97, aa)*mix(0.86, 1.08, n1*0.6 + n2*0.4); rough = 0.8;
  } else if (pat < 2.5) {                           // 2: panot de 20×20 (las cuatro pastillas, insinuadas)
    vec2 q = W*5.0, f = fract(q) - 0.5; float aa = smoothstep(0.05, 0.25, fw*5.0);
    float jt = smoothstep(0.43, 0.48, max(abs(f.x), abs(f.y))), fl = 1.0 - smoothstep(0.0, 0.05, abs(length(abs(f) - 0.25) - 0.13));
    alb *= mix((1.0 - 0.28*jt)*(1.0 - 0.14*fl), 0.9, aa)*mix(0.84, 1.08, n1);
  } else if (pat < 3.5) {                           // 3: sauló (arena compactada)
    alb *= mix(0.8, 1.12, n1)*mix(0.9, 1.07, vnoise(W*9.0)); rough = 0.96;
  } else if (pat < 4.5) {                           // 4: caucho de juegos infantiles
    alb *= mix(0.9, 1.06, vnoise(W*14.0))*mix(0.92, 1.04, n1); rough = 0.92;
  } else if (pat < 5.5) {                           // 5: césped de parterre
    float g = vnoise(W*0.6)*0.45 + vnoise(W*4.5)*0.3 + vnoise(W*0.08)*0.25;
    alb *= mix(0.68, 1.18, g); rough = 0.95;
  } else if (pat < 6.5) {                           // 6: piedra lisa (bordillos de parterre, incrustaciones)
    alb *= mix(0.9, 1.05, n2); rough = 0.55;
  } else {                                          // 7: reja de fundición del alcorque, con tierra debajo
    vec2 q = fract(W*4.0) - 0.5; float b = step(0.36, max(abs(q.x), abs(q.y)));
    alb = mix(vec3(0.34, 0.27, 0.19)*(0.7 + 0.6*vnoise(W*9.0)), vec3(0.08), b*0.85*(1.0 - smoothstep(0.05, 0.2, fw*4.0)));
  }
  alb *= mix(1.0, mix(0.7, 1.0, n1), pWear);         // suciedad y desgaste
  if (uGlow.x > 0.001) {                            // de noche: aura de la calle + charcos de las farolas de la plaza (cocidos)
    float gW = (0.2 + 1.6*pGlow*pGlow)*(1.0 - 0.85*smoothstep(200.0, 380.0, vPos.y));
    gW *= mix(1.0, 0.45, smoothstep(25.0, 140.0, uCam.y - vPos.y));
    emis = emit(kAura*(min(alb, vec3(0.4))*0.95 + 0.05), gW*0.7*uGlow.x);
  }
  FRAG(shade(alb, N, V, rough, 0.0, 1.0) + emis);
}`;
// PLZ_LEAF: copa de árbol de plaza (elipsoides suaves). Color de vértice = verde de la especie
regKind('PLZ_LEAF', 141, `
    vec3 q = vLoc*1.9; float nz = vnoise(q.xz + q.y*0.7)*0.6 + vnoise(q.xz*3.1 - q.y*1.3)*0.4;
    alb = vCol.rgb*mix(0.55, 1.2, nz)*(1.0 - 0.3*step(0.72, vnoise(vLoc.xz*5.0 + vLoc.y*4.0)));
    rough = 0.9; ao = mix(0.5, 1.0, clamp(n.y*0.5 + 0.5, 0.0, 1.0));
    if (uGlow.x > 0.001) emis = emit(kAura*alb*0.7, 0.3*uGlow.x*(1.0 - clamp(n.y, 0.0, 1.0)));`);
// PLZ_WATER: agua de fuente (lámina con oleaje; las caras verticales son chorros). auxiliar.y = focos bajo el agua de noche
regKind('PLZ_WATER', 142, `
    float t = uTime*0.6; vec2 w = vPos.xz;
    if (an.y > 0.6) { float h1 = vnoise(w*1.3 + vec2(t, 0.3*t)), h2 = vnoise(w*3.1 - vec2(0.4*t, t));
      N = normalize(vec3((h1 - 0.5)*0.22 + (h2 - 0.5)*0.12, 1.0, (h2 - 0.5)*0.22)); alb = vCol.rgb*0.55; rough = 0.06; }
    else { alb = mix(vCol.rgb, vec3(0.93), 0.65)*(0.8 + 0.4*vnoise(vec2((w.x + w.y)*3.0, vLoc.y*3.0 - t*5.0))); rough = 0.35; }
    emis = emit(vec3(0.7, 0.86, 1.0)*(alb + 0.1), vInfo.y*uDusk*2.2*(1.0 - 0.6*uLate));`);

// ------------------------------------------------------------------ utilidades
const D2R = Math.PI / 180;
const pav = (pat, glow4, wear) => { const o = []; for (let k = 0; k < 4; k++) o.push(pat, Math.round(glow4[k] * 255), Math.round(wear * 255), 0); return o; };
const SIMPLE = 1, HIGH = 2;
// acabados «siempre» (nivel 0 del auxiliar de K.FURN): lo propio de las plazas, sin relevo de nivel
const fa0 = (rough, metal, pat) => { const a = [Math.round(rough * 255), Math.round(metal * 255), pat, 0]; return a.concat(a, a, a); };
const A0 = { PAINT: fa0(0.42, 0, 0), STEEL: fa0(0.4, 1, 0), CAST: fa0(0.5, 0, 3), MATTE: fa0(0.62, 0, 0), STONE: fa0(0.75, 0, 0), WOOD: fa0(0.5, 0, 5), PLASTIC: fa0(0.5, 0, 4), GLOSS: fa0(0.3, 0, 0), BRONZE: fa0(0.38, 1, 3), LENS: fa0(0.25, 0, 6) };
function inPoly(r, x, z) { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j];
  if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function edgeDist(r, x, z) { let d = 1e9; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[j], b = r[i], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz;
  let t = l2 > 0 ? ((x - a[0]) * dx + (z - a[1]) * dz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; d = Math.min(d, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t)); } return d; }
const sid = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 1000003; };

// ------------------------------------------------------------------ colores
const C = {
  granite: [150, 146, 140], graniteL: [166, 161, 152], graniteD: [104, 102, 100], pink: [178, 148, 136], panot: [146, 140, 132], saulo: [184, 160, 122],
  rubberR: [150, 62, 48], rubberG: [70, 118, 72], rubberB: [62, 96, 140], grass: [82, 110, 52], grassD: [64, 92, 44], curb: [160, 156, 148],
  iron: [40, 42, 45], green: [34, 62, 46], wood: [128, 82, 46], stone: [176, 168, 152], bronze: [92, 74, 52], water: [52, 86, 96], white: [222, 222, 216],
};
// especies de árbol de plaza: [copa, tronco, alto de tronco, radio de copa, forma (0 redonda, 1 parasol de pino, 2 columna)]
const TREES = { platan: [[92, 118, 58], [112, 106, 88], 4.0, 3.1, 0], lledoner: [[78, 104, 62], [110, 108, 104], 2.8, 3.0, 0], pi: [[58, 84, 50], [104, 76, 56], 6.0, 4.2, 1],
  tipuana: [[96, 122, 60], [104, 92, 78], 3.2, 4.0, 0], xiprer: [[46, 72, 46], [92, 74, 58], 1.0, 1.2, 2], taronger: [[60, 96, 48], [96, 86, 70], 1.6, 1.6, 0] };

// ------------------------------------------------------------------ piezas propias (marco F: u, y, d; coordenadas de la malla)
function tree(B, F, y, sp, h) {
  const [lc, tc, th, cr, form] = sp, s = 0.85 + 0.3 * h;
  rev(B, F, 0, 0, [[0.2 * s, y - 0.1], [0.15 * s, y + th * 0.6 * s], [0.12 * s, y + th * s]], 6, tc, K.FURN, { aux: A0.MATTE, cap: 1 });
  if (form === 2) { sphere(B, F, 0, y + th + 3.4 * s, 0, cr * s, 7, 6, lc, K.PLZ_LEAF, null, 3.2); return; }
  if (form === 1) { // pino piñonero: tronco largo algo inclinado y copa en parasol
    sphere(B, F, 0.4, y + th * s + 0.8, 0, cr * s, 9, 5, lc, K.PLZ_LEAF, null, 0.38);
    sphere(B, F, -1.2 * s, y + th * s + 0.4, 1.0 * s, cr * 0.6 * s, 7, 4, mixc(lc, [40, 60, 36], 0.3), K.PLZ_LEAF, null, 0.45); return; }
  const top = y + th * s;
  sphere(B, F, 0, top + cr * 0.55 * s, 0, cr * s, 8, 6, lc, K.PLZ_LEAF, null, 0.82);
  sphere(B, F, cr * 0.45 * s, top + cr * 0.35 * s, cr * 0.25 * s, cr * 0.62 * s, 7, 5, shade(lc, 1.08), K.PLZ_LEAF, null, 0.8);
  sphere(B, F, -cr * 0.4 * s, top + cr * 0.4 * s, -cr * 0.3 * s, cr * 0.6 * s, 7, 5, shade(lc, 0.92), K.PLZ_LEAF, null, 0.8);
}
// banco moderno de piedra (bloque de granito, a veces con asiento de listones)
function stoneBench(B, F, y, len, wood) {
  box(B, F, -len / 2, len / 2, y, y + 0.42, -0.3, 0.3, C.stone, K.FURN, 7, A0.STONE);
  if (wood) for (let q = 0; q < 4; q++) box(B, F, -len / 2 + 0.05, len / 2 - 0.05, y + 0.42, y + 0.46, -0.27 + q * 0.14, -0.17 + q * 0.14, C.wood, K.FURN, 1, A0.WOOD);
}
// fuente de beber tipo Canaletes: columna de fundición con cuatro caños, pila y farol de cuatro brazos
function canaletes(B, F, y) {
  rev(B, F, 0, 0, [[0.55, y], [0.55, y + 0.2], [0.42, y + 0.25], [0.42, y + 0.32]], 10, C.stone, K.FURN, { aux: A0.STONE, cap: 1 });
  rev(B, F, 0, 0, [[0.26, y + 0.3], [0.2, y + 0.6], [0.14, y + 0.7], [0.12, y + 1.3], [0.17, y + 1.4], [0.09, y + 1.55], [0.07, y + 3.4], [0.12, y + 3.5]], 8, C.iron, K.FURN, { aux: A0.CAST, cap: 1 });
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
    tube(B, F, [[c * 0.12, y + 1.05, s * 0.12], [c * 0.3, y + 1.0, s * 0.3]], 0.025, 4, [170, 150, 90], K.FURN, { aux: A0.BRONZE });
    tube(B, F, [[0, y + 3.3, 0], [c * 0.45, y + 3.55, s * 0.45]], 0.03, 4, C.iron, K.FURN, { aux: A0.CAST });
    sphere(B, F, c * 0.45, y + 3.7, s * 0.45, 0.13, 6, 4, [255, 236, 190], K.FURN, A0.LENS, 1.3); }
}
// zona de juegos: tobogán con torre, columpio doble y muelle
function playground(B, F, y, h) {
  const red = [196, 64, 44], yel = [220, 176, 40], blu = [54, 102, 168];
  for (const [u, d] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) box(B, F, u * 0.8 - 0.06, u * 0.8 + 0.06, y, y + 2.6, d * 0.8 - 0.06, d * 0.8 + 0.06, blu, K.FURN, 7, A0.PAINT);
  box(B, F, -0.85, 0.85, y + 1.2, y + 1.3, -0.85, 0.85, [150, 110, 70], K.FURN, 7, A0.WOOD);
  for (const s of [-1, 1]) box(B, F, -0.85, 0.85, y + 1.3, y + 2.0, s * 0.85 - 0.03, s * 0.85 + 0.03, yel, K.FURN, 7, A0.PLASTIC);
  quad(B, F, -0.35, y + 1.25, 0.85, 0.35, y + 1.25, 0.85, 0.35, y + 0.15, 3.4, -0.35, y + 0.15, 3.4, red, K.FURN, A0.PLASTIC);
  for (const s of [-1, 1]) quad(B, F, s * 0.38, y + 1.45, 0.85, s * 0.38, y + 1.25, 0.85, s * 0.38, y + 0.15, 3.4, s * 0.38, y + 0.35, 3.4, red, K.FURN, A0.PLASTIC);
  rev(B, F, 0, 0, [[0.5, y + 2.6], [0, y + 3.4]], 4, red, K.FURN, { aux: A0.PLASTIC, cap: 0 });
  // columpio
  const u0 = 3.2;
  for (const s of [-1, 1]) { tube(B, F, [[u0 - 1.0, y, s * 1.6], [u0, y + 2.3, s * 1.6], [u0 + 1.0, y, s * 1.6]], 0.05, 5, blu, K.FURN, { aux: A0.PAINT }); }
  tube(B, F, [[u0, y + 2.3, -1.6], [u0, y + 2.3, 1.6]], 0.05, 5, blu, K.FURN, { aux: A0.PAINT });
  for (const s of [-0.7, 0.7]) {
    for (const e of [-0.2, 0.2]) tube(B, F, [[u0, y + 2.3, s + e], [u0, y + 0.5, s + e]], 0.012, 3, C.iron, K.FURN, { aux: A0.STEEL });
    box(B, F, u0 - 0.15, u0 + 0.15, y + 0.45, y + 0.5, s - 0.22, s + 0.22, [30, 30, 32], K.FURN, 7, A0.PLASTIC); }
  // balancín de muelle
  rev(B, F, -3.0, 0.5, [[0.12, y], [0.12, y + 0.4]], 6, [60, 60, 64], K.FURN, { aux: A0.STEEL, cap: 1 });
  sphere(B, F, -3.0, y + 0.65, 0.5, 0.35, 7, 5, h > 0.5 ? yel : [60, 150, 70], K.FURN, A0.PLASTIC, 0.7);
}
// quiosco de prensa: caja con tejadillo volado y toldo
function kiosk(B, F, y) {
  box(B, F, -1.3, 1.3, y, y + 2.5, -0.9, 0.9, C.green, K.FURN, 7, A0.PAINT);
  box(B, F, -1.6, 1.6, y + 2.5, y + 2.75, -1.2, 1.2, shade(C.green, 0.8), K.FURN, 7, A0.PAINT);
  box(B, F, -1.2, 1.2, y + 0.9, y + 2.2, 0.9, 0.95, [196, 190, 170], K.FURN, 4, A0.MATTE);
  quad(B, F, -1.5, y + 2.4, 1.2, 1.5, y + 2.4, 1.2, 1.5, y + 2.0, 1.9, -1.5, y + 2.0, 1.9, [170, 60, 50], K.FURN, A0.PLASTIC);
}
// pérgola: pilares y vigas de madera, con emparrado verde
function pergola(B, F, y, len) {
  const n = Math.max(2, Math.round(len / 3));
  for (let k = 0; k <= n; k++) { const u = -len / 2 + k * len / n;
    for (const d of [-1.6, 1.6]) box(B, F, u - 0.1, u + 0.1, y, y + 2.8, d - 0.1, d + 0.1, [120, 84, 56], K.FURN, 7, A0.WOOD);
    box(B, F, u - 0.06, u + 0.06, y + 2.8, y + 2.95, -1.9, 1.9, [120, 84, 56], K.FURN, 7, A0.WOOD); }
  for (const d of [-1.6, 1.6]) box(B, F, -len / 2 - 0.2, len / 2 + 0.2, y + 2.95, y + 3.1, d - 0.08, d + 0.08, [120, 84, 56], K.FURN, 7, A0.WOOD);
  for (let k = 0; k < n; k++) { const u = -len / 2 + (k + 0.5) * len / n; sphere(B, F, u, y + 3.15, 0, 1.7, 7, 4, [74, 104, 50], K.PLZ_LEAF, null, 0.25); }
}
function pingpong(B, F, y) {
  box(B, F, -0.3, 0.3, y, y + 0.7, -0.5, 0.5, [140, 140, 136], K.FURN, 7, A0.STONE);
  box(B, F, -1.37, 1.37, y + 0.7, y + 0.76, -0.76, 0.76, [70, 104, 92], K.FURN, 7, A0.STONE);
  box(B, F, -0.01, 0.01, y + 0.76, y + 0.92, -0.8, 0.8, C.iron, K.FURN, 4, A0.STEEL);
}
function bikeRack(B, F, y, n) { for (let k = 0; k < n; k++) { const u = (k - (n - 1) / 2) * 0.9;
  tube(B, F, [[u, y, -0.4], [u, y + 0.75, -0.4], [u, y + 0.75, 0.4], [u, y, 0.4]], 0.03, 4, [150, 152, 156], K.FURN, { aux: A0.STEEL }); } }
// estatua genérica sobre pedestal (figura de bronce o de piedra, sin parecido con ninguna concreta)
function statue(B, F, y, ph, col, a) {
  box(B, F, -0.7, 0.7, y, y + ph, -0.7, 0.7, C.stone, K.FURN, 7, A0.STONE);
  box(B, F, -0.8, 0.8, y + ph, y + ph + 0.12, -0.8, 0.8, shade(C.stone, 0.95), K.FURN, 7, A0.STONE);
  const yb = y + ph + 0.12, ac = a || A0.BRONZE;
  rev(B, F, 0, 0, [[0.26, yb], [0.3, yb + 0.5], [0.24, yb + 0.95], [0.3, yb + 1.25], [0.22, yb + 1.45], [0.08, yb + 1.52], [0.1, yb + 1.6]], 7, col, K.FURN, { aux: ac, cap: 0 });
  sphere(B, F, 0, yb + 1.72, 0, 0.13, 6, 4, col, K.FURN, ac);
}
// estanque redondo con estatua en el centro (la Deessa, Plaça de Catalunya)
function pond(B, F, y, r) {
  rev(B, F, 0, 0, [[r + 0.45, y - 0.1], [r + 0.45, y + 0.5], [r + 0.2, y + 0.55]], 24, C.stone, K.FURN, { aux: A0.STONE, cap: 0 });
  rev(B, F, 0, 0, [[0, y + 0.38], [r + 0.2, y + 0.38]], 24, C.water, K.PLZ_WATER, { aux: [0, 140, 0, 0] });
  statue(B, F, y + 0.38, 1.2, [222, 214, 200], A0.STONE);
}
// monumento a Macià (Plaça de Catalunya): escalera invertida de piedra, cada peldaño más ancho que el de abajo, y busto
function macia(B, F, y) {
  box(B, F, -3.2, 3.2, y - 0.4, y + 0.35, -3.2, 3.2, [150, 144, 132], K.FURN, 7, A0.STONE);
  for (let k = 0; k < 14; k++) { const w = 0.7 + k * 0.17, u0 = -1.6 + k * 0.08;
    box(B, F, u0, u0 + w, y + 0.35 + k * 0.42, y + 0.77 + k * 0.42, -0.9, 0.9, shade([196, 184, 160], 0.94 + 0.012 * k), K.FURN, 7, A0.STONE); }
  box(B, F, 1.6, 2.1, y + 0.35, y + 1.9, -0.25, 0.25, [120, 116, 108], K.FURN, 7, A0.STONE);
  sphere(B, F, 1.85, y + 2.15, 0, 0.26, 7, 5, C.bronze, K.FURN, A0.BRONZE, 1.2);
}
// fuente rectangular con vaso de piedra, lámina de agua, chorros y grupo escultórico (Plaça de Catalunya)
function fountainRect(B, F, y, L, Wd) {
  const rim = C.stone;
  box(B, F, -L / 2 - 0.5, L / 2 + 0.5, y, y + 0.55, -Wd / 2 - 0.5, -Wd / 2, rim, K.FURN, 7, A0.STONE);
  box(B, F, -L / 2 - 0.5, L / 2 + 0.5, y, y + 0.55, Wd / 2, Wd / 2 + 0.5, rim, K.FURN, 7, A0.STONE);
  box(B, F, -L / 2 - 0.5, -L / 2, y, y + 0.55, -Wd / 2, Wd / 2, rim, K.FURN, 7, A0.STONE);
  box(B, F, L / 2, L / 2 + 0.5, y, y + 0.55, -Wd / 2, Wd / 2, rim, K.FURN, 7, A0.STONE);
  const wa = [0, 140, 0, 0, 0, 140, 0, 0, 0, 140, 0, 0, 0, 140, 0, 0];
  quad(B, F, -L / 2, y + 0.4, -Wd / 2, L / 2, y + 0.4, -Wd / 2, L / 2, y + 0.4, Wd / 2, -L / 2, y + 0.4, Wd / 2, C.water, K.PLZ_WATER, wa);
  for (let k = 0; k < 6; k++) { const u = -L / 2 + 1.5 + k * (L - 3) / 5; for (const d of [-Wd / 2 + 0.9, Wd / 2 - 0.9])
    rev(B, F, u, d, [[0.07, y + 0.4], [0.05, y + 1.9], [0.0, y + 2.2]], 4, [200, 220, 230], K.PLZ_WATER, { aux: [0, 140, 0, 0], cap: 0 }); }
  box(B, F, -1.4, 1.4, y + 0.4, y + 1.6, -1.0, 1.0, rim, K.FURN, 7, A0.STONE);
  statue(B, F, y + 1.6, 0.3, [214, 206, 190], A0.STONE);
}

// ------------------------------------------------------------------ hitos de las plazas (BCN_LM): se dan de alta en cuanto landmarks.js publica window.BCN_LM
const LMQ = [];
function lmLater(f) { LMQ.push(f); }
(function hookLM() {
  const flush = lm => { for (const f of LMQ) try { lm.add(f); } catch (e) { console.warn('Plazas: hito ' + f.id + ' no añadido', e); } LMQ.length = 0; };
  if (window.BCN_LM) return setTimeout(() => flush(window.BCN_LM));
  let v; Object.defineProperty(window, 'BCN_LM', { configurable: true, enumerable: true, get: () => v,
    set(x) { v = x; Object.defineProperty(window, 'BCN_LM', { value: x, writable: true, configurable: true, enumerable: true }); flush(x); } });
})();
// fuente monumental de la Plaça d'Espanya (Jujol, 1929): estanque circular, cuerpo triangular con tres grupos de columnas jónicas,
// tres grupos escultóricos de agua en los lados y remate central. Modelo sencillo de proporciones; sin pretensión de detalle escultórico
lmLater({ id: 'font_pl_espanya', nombre: "Font de la Plaça d'Espanya", nivel: 'B', x: 10446.2, z: 12741.6, rot: 63, alto: 24, ancho: 34, largo: 34, noche: 'focos', edificios: [59002],   // 59002: el volumen genérico que ocupaba la fuente
  build(B, h, L) {
    const KK = window.BCN_LM.K, ST = [206, 202, 192], STD = [178, 172, 162], BR = [96, 82, 60], WT = [62, 100, 112];
    const R0 = 15.5;
    L.prisma(B, L.poligono(R0 + 1.2, 48, 0), -0.8, 0.25, STD, KK.PIEDRA, { aux: L.aux.piedra(0.4, 1.2) });                 // plataforma
    L.prisma(B, L.poligono(R0 + 0.6, 48, 0), 0.25, 0.95, ST, KK.PIEDRA, { sinTecho: true });                                 // pretil exterior
    L.prisma(B, L.poligono(R0, 48, 0), 0.25, 0.95, ST, KK.PIEDRA, { sinTecho: true });                                       // pretil interior
    L.anillo(B, 0, 0, R0, R0 + 0.6, 0.95, { col: ST, k: KK.PIEDRA });
    L.disco(B, 0, 0, R0, 0.7, { col: WT, k: KK.AGUA });
    const tri = (r, a0) => L.poligono(r, 3, a0);
    L.prisma(B, tri(8.0, 90), 0.5, 2.2, STD, KK.PIEDRA, { aux: L.aux.piedra(0.5, 1.0) });
    L.prisma(B, tri(6.9, 90), 2.2, 4.2, ST, KK.PIEDRA);
    L.prisma(B, tri(2.9, 90), 4.2, 13.5, ST, KK.PIEDRA, { aux: L.aux.piedra(0.6, 1.2) });
    L.prisma(B, tri(7.4, 90), 15.6, 16.3, STD, KK.PIEDRA);
    L.prisma(B, tri(2.4, 90), 16.3, 19.5, ST, KK.PIEDRA);
    L.aguja(B, 0, 0, 19.5, 3.4, 1.3, { lados: 10, col: ST, k: KK.PIEDRA, pot: 1, exp: 0.5 });
    L.esfera(B, 0, 23.4, 0, 0.8, { col: BR, k: KK.METAL });
    for (let k = 0; k < 3; k++) { const a = (90 + k * 120) * D2R, cx = Math.cos(a), cz = Math.sin(a);
      // grupo de tres columnas en cada vértice, con capitel y figura de bronce
      for (const off of [-1.2, 0, 1.2]) { const x = cx * 6.4 - cz * off, z = cz * 6.4 + cx * off;
        L.tambor(B, x, z, 4.2, 15.6, 0.42, { lados: 10, col: ST, k: KK.PIEDRA, r1: 0.36 });
        L.caja(B, x, z, 15.6, 1.1, 1.1, 0.5, 0, STD, KK.PIEDRA); }
            L.aguja(B, cx * 6.4, cz * 6.4, 16.3, 2.6, 0.55, { lados: 8, col: BR, k: KK.METAL, pot: 2, exp: 0.5 });
      // grupo escultórico de agua en cada lado (entre vértices) y su caño
      const b = a + 60 * D2R, sx = Math.cos(b) * 5.2, sz = Math.sin(b) * 5.2;
      L.esfera(B, sx, 3.6, sz, 1.4, { col: [190, 180, 160], k: KK.PIEDRA, sy: 1.5 });
      L.esfera(B, sx * 1.12, 2.4, sz * 1.12, 1.1, { col: [190, 180, 160], k: KK.PIEDRA, sy: 0.9 });
      L.tambor(B, Math.cos(b) * 8.2, Math.sin(b) * 8.2, 0.7, 1.4, 0.5, { lados: 8, col: [214, 230, 236], k: KK.AGUA, r1: 0.05 });
      for (let j = 0; j < 4; j++) { const c = b + (j - 1.5) * 0.25; L.tambor(B, Math.cos(c) * 12.5, Math.sin(c) * 12.5, 0.7, 3.2, 0.09, { lados: 5, col: [214, 230, 236], k: KK.AGUA, r1: 0.02 }); }
    }
  } });
// Canòpia Urbana de Glòries: gran cubierta de celosía metálica blanca sobre pilares finos, con trepadoras (posición y tamaño aproximados)
lmLater({ id: 'canopia_glories', nombre: 'Canòpia Urbana', nivel: 'B', x: 13612, z: 15742, rot: 44, alto: 12, ancho: 34, largo: 110, noche: 'nada', edificios: [140877], sombra: true,   // 140877: torre de 30 m en mitad del parque que hoy no existe
  build(B, h, L) {
    const KK = window.BCN_LM.K, WH = [228, 228, 222], GR = [84, 116, 60], Y = 10.5, NX = 9, NZ = 28, SX = 34 / (NX - 1), SZ = 110 / (NZ - 1);
    const P = (i, j) => [-17 + i * SX, Y + 0.6 * Math.sin(j * 0.45 + i * 0.7), -55 + j * SZ];
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const p = P(i, j);
      if (i + 1 < NX) L.bar(B, p, P(i + 1, j), 0.07, WH, KK.METAL);
      if (j + 1 < NZ) L.bar(B, p, P(i, j + 1), 0.07, WH, KK.METAL);
      if (i + 1 < NX && j + 1 < NZ) L.bar(B, p, (i + j) % 2 ? P(i + 1, j + 1) : P(i + 1, j + 1), 0.05, WH, KK.METAL); }
    for (let j = 1; j < NZ - 1; j += 3) for (let i = 1; i < NX - 1; i += 3) { const p = P(i, j), q = [p[0], -0.5, p[2]];
      L.tambor(B, p[0], p[2], -0.5, p[1], 0.22, { lados: 8, col: WH, k: KK.METAL });
      for (const [dx, dz] of [[SX, 0], [-SX, 0], [0, SZ], [0, -SZ]]) L.bar(B, [p[0], p[1] - 3.2, p[2]], [p[0] + dx, p[1], p[2] + dz], 0.06, WH, KK.METAL);
      L.tambor(B, q[0], q[2], -0.5, 0.6, 1.0, { lados: 8, col: [120, 116, 108], k: KK.LISO });
      L.esfera(B, q[0], 1.5, q[2], 1.1, { col: GR, k: KK.CESPED, sy: 1.0 }); }
    // trepadoras sobre la celosía: manchas verdes
    for (let j = 0; j < NZ - 1; j += 2) for (let i = (j / 2) % 2; i < NX - 1; i += 2) { const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
      L.q4(B, [a[0], a[1] + 0.12, a[2]], [b[0], b[1] + 0.12, b[2]], [c[0], c[1] + 0.12, c[2]], [d[0], d[1] + 0.12, d[2]], GR, KK.CESPED); }
  } });

// ------------------------------------------------------------------ plazas singulares: disposición propia (zona de pavimento y objetos)
// Cada una: { match(nombre), area?(p) → contorno propio, zone(u, v, x, z, e) → [dibujo, color, desgaste] o null, objs(ctx de colocación) }
// u, v: coordenadas en el eje de la plaza (u a lo largo de ang); e: distancia al borde del contorno
const SING = [];
// Plaça de Catalunya (posiciones de OSM): explanada circular de granito claro con la rosa de los vientos en el centro, anillo con
// las estatuas (cada una en su sitio) y las fuentes (las Fonts Bessones al noroeste y la del lado de levante), paseos de
// granito hacia las cuatro esquinas y cuatro parterres de césped con plátanos; al sur, la Deessa en su estanque y el monumento a Macià
const CAT = { c: [12207.5, 14056.0], deessa: [12212.5, 13989.6], macia: [12212.3, 13970.8], fonts: [[12158.4, 14086.0, 1], [12272.0, 14053.9, 0]],
  art: [[12259.1, 14023.2], [12248.3, 14009.3], [12243.3, 14096.4], [12169.2, 14016.5], [12254.1, 14082.9], [12159.3, 14030.7], [12222.7, 14108.6], [12263.8, 14063.9],
    [12193.2, 13998.8], [12231.4, 13998.9], [12265.4, 14042.7], [12152.3, 14054.3], [12175.4, 14091.6], [12162.8, 14097.0], [12180.9, 14096.1], [12187.2, 14101.6],
    [12168.2, 14087.9], [12176.8, 14117.4], [12155.2, 14100.9], [12178.7, 14109.3]],
  corners: [[12206.6, 14146.2], [12293.7, 14050.0], [12212.3, 13933.1], [12105.8, 14097.6]] };
const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz; let t = ((x - a[0]) * dx + (z - a[1]) * dz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t; return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
SING.push({ key: 'Plaça de Catalunya', ax: 136,
  zone(u, v, x, z, e) { const r = Math.hypot(x - CAT.c[0], z - CAT.c[1]);
    if (r < 47) return [1, C.graniteL, 0.15];
    if (r < 63 || e < 3.5) return [1, C.granite, 0.25];
    for (const k of CAT.corners) if (segD(x, z, CAT.c, k) < 6) return [1, C.granite, 0.3];
    if (Math.hypot(x - CAT.deessa[0], z - CAT.deessa[1]) < 12 || Math.hypot(x - CAT.macia[0], z - CAT.macia[1]) < 9) return [1, C.granite, 0.25];
    if (r < 64 || e < 4.3) return [6, C.curb, 0.2];
    for (const k of CAT.corners) if (segD(x, z, CAT.c, k) < 6.8) return [6, C.curb, 0.2];
    return [5, C.grass, 0]; },
  objs(S) { const W = S.putW, c = CAT.c;
    W('rose', c[0], c[1], 0, { a0: 0 });
    for (const [x, z, twin] of CAT.fonts) { const a = Math.atan2(z - c[1], x - c[0]) + Math.PI / 2;
      if (twin) for (const s of [-1, 1]) W('fontR', x + Math.cos(a) * s * 8, z + Math.sin(a) * s * 8, a, { L: 13, W: 6.5 });
      else W('fontR', x, z, a, { L: 22, W: 7.5 }); }
    for (const [x, z] of CAT.art) W('statue', x, z, Math.atan2(c[1] - z, c[0] - x) - Math.PI / 2);
    W('pond', CAT.deessa[0], CAT.deessa[1], 0, { r: 6 });
    W('macia', CAT.macia[0], CAT.macia[1], Math.atan2(c[1] - CAT.macia[1], c[0] - CAT.macia[0]) - Math.PI / 2);
    W('kiosk', 12250, 14112, 0.8); W('kiosk', 12160, 14000, -0.7);
    W('canaletes', 12196, 14004, 0); W('canaletes', 12240, 14100, 0);
    for (let k = 0; k < 24; k++) { const a = (k + 0.5) / 24 * 2 * Math.PI; W('lampC', c[0] + Math.cos(a) * 45, c[1] + Math.sin(a) * 45, a); }
    for (let k = 0; k < 16; k++) { const a = k / 16 * 2 * Math.PI; W('bench', c[0] + Math.cos(a) * 42, c[1] + Math.sin(a) * 42, a + Math.PI); }
    S.grid(8, 3, (u, v, x, z, e, zz) => zz && zz[0] === 5 && e > 5 && S.put('tree', u, v, 0, { sp: 'platan' }));
    S.grid(16, 5, (u, v, x, z, e, zz) => zz && zz[0] === 1 && Math.hypot(x - c[0], z - c[1]) > 66 && S.put('lampC', u, v, 0));
  } });
// Plaça d'Espanya: la isla central de la rotonda. La fuente es un hito (font_pl_espanya); alrededor, anillo de granito, parterres y farolas
SING.push({ key: "Plaça d'Espanya", ax: 63, center: [10446.2, 12741.6], disc: 58,
  zone(u, v, x, z, e, P) { const r = Math.hypot(u, v);
    if (r < 17.5) return [1, C.graniteL, 0.15];
    if (r < 23) return [1, C.granite, 0.2];
    if (r < 23.6 || e < 4) return [6, C.curb, 0.2];
    const a = Math.atan2(v, u) / Math.PI * 3; if (Math.abs(a - Math.round(a)) < 0.06 * 23 / r * 3) return [1, C.granite, 0.25];
    return [5, C.grassD, 0]; },
  objs(S) { for (let k = 0; k < 12; k++) { const a = k / 12 * 2 * Math.PI; S.put('lampC', Math.cos(a) * 21, Math.sin(a) * 21, a); }
    for (let k = 0; k < 18; k++) { const a = (k + 0.5) / 18 * 2 * Math.PI; S.put('bench', Math.cos(a) * 19.5, Math.sin(a) * 19.5, a + Math.PI); }
    S.grid(8, 2, (u, v, x, z, e, zz) => zz && zz[0] === 5 && e > 6 && Math.hypot(u, v) > 28 && hash2(Math.round(x), Math.round(z)) < 0.5 && S.put('tree', u, v, 0, { sp: hash2(Math.round(z), 7) < 0.5 ? 'xiprer' : 'lledoner' })); } });
// Glòries: la Gran Clariana (pradera central), paseos de sauló y granito, bosquetes de pinos y tipuanas en el perímetro,
// zona de juegos y la Canòpia Urbana (hito) en el lado del Gran Via
SING.push({ key: 'Plaça de les Glòries Catalanes', ax: 44,
  zone(u, v, x, z, e, P) { const q = (u / 105) ** 2 + (v / 62) ** 2;
    if (q < 1) return [5, C.grass, 0];
    if (q < 1.05) return [6, C.curb, 0.2];
    if (q < 1.35 || e < 5) return [3, C.saulo, 0.2];
    if (Math.abs(u + 55) < 18 && Math.abs(v + 2) < 22) return [1, C.granite, 0.15];   // explanada bajo la canòpia
    return [5, C.grassD, 0]; },
  objs(S) { S.put('play', 78, -64, 0.3); S.put('play', -70, 72, 2.0);
    S.grid(11, 4, (u, v, x, z, e, zz) => { if (!zz || e < 4) return; const q = (u / 105) ** 2 + (v / 62) ** 2, h = hash2(Math.round(x), Math.round(z));
      if (zz[0] === 5 && q > 1.3 && h < 0.75) S.put('tree', u, v, 0, { sp: h < 0.4 ? 'pi' : h < 0.6 ? 'tipuana' : 'lledoner' });
      else if (zz[0] === 3 && q > 1.12 && q < 1.3 && h < 0.3) S.put('bench', u, v, Math.atan2(-v / 62, -u / 105));
      else if (zz[0] === 3 && h > 0.86) S.put('lamp', u, v, 0); });
    for (let k = 0; k < 24; k++) { const a = k / 24 * 2 * Math.PI; S.put('lamp', Math.cos(a) * 112, Math.sin(a) * 68, a); }
    S.put('canaletes', 0, -70, 0); S.put('canaletes', 20, 70, 0); S.put('pingpong', -40, -74, 0.2); S.put('bikes', 60, 70, 0.8, { n: 8 });
  } });
// Plaça de Lesseps (reurbanización de 2010–2017): plaza dura de granito con una retícula densa de árboles en alcorque,
// bancos de piedra y madera, zona de juegos y farolas altas; delante, la Biblioteca Jaume Fuster (edificio)
SING.push({ key: 'Plaça de Lesseps',
  zone(u, v, x, z, e, P) { if (e < 2.5) return [1, C.granite, 0.3]; const b = Math.abs(((u + 1000) % 14) - 7) < 0.6; return b ? [6, C.graniteD, 0.2] : [1, mixc(C.granite, C.pink, 0.25), 0.25]; },
  objs(S) { const { P } = S;
    S.put('play', P.hu * 0.4, -P.hv * 0.25, 0); S.put('canaletes', -P.hu * 0.15, P.hv * 0.3, 0); S.put('kiosk', -P.hu * 0.55, -P.hv * 0.35, 0); S.put('bikes', P.hu * 0.65, P.hv * 0.45, 0, { n: 6 });
    S.grid(9, 4.5, (u, v, x, z, e, zz) => e > 3 && S.put('tree', u, v, 0, { sp: hash2(Math.round(u), Math.round(v)) < 0.7 ? 'platan' : 'tipuana', alc: true }));
    S.grid(14, 0, (u, v, x, z, e) => e > 3 && S.put('sbench', u, v + 3.5, 0, { len: 3.2, wood: true }));
    S.grid(21, 10, (u, v, x, z, e) => e > 2 && S.put('lamp', u, v, 0, { H: 8 })); } });

// ------------------------------------------------------------------ módulo
window.BCN_PLAZAS = { async init(ctx) {
  const { reg, heightAt } = ctx, city = ctx.city, FUR = window.BCN_FURNITURE && window.BCN_FURNITURE.parts;
  if (!city || !ctx.detail) throw new Error('las plazas necesitan las fachadas de detalle (ctx.city)');
  const { walkAt, coverAt, nearestCar } = city, matB = ctx.detail.matB, mkMesh = ctx.detail.mkMesh;
  const [AS, AH] = FUR ? FUR.levels : [null, null];
  const matP = ctx.mkMat('plazaPav', VS_PAV, FS_PAV, ['position', 'color', 'uv'], ['uPavFade']);
  matP.setVector2('uPavFade', new BABYLON.Vector2(560, 640));
  const data = await fetch('data/plazas.json').then(r => r.json());
  const PL = data.plazas.map((p, i) => {
    const sg = SING.find(s => s.key === p.n) || null, o = { i, n: p.n, t: p.t, a: p.a, cat: p.cat, r: p.r, c: p.c, ang: (sg && sg.ax !== undefined ? sg.ax : p.ang) * D2R, sg, id: sid(p.n) };
    if (sg && sg.disc) { o.c = sg.center; o.r = []; for (let k = 0; k < 40; k++) o.r.push([sg.center[0] + sg.disc * Math.cos(k / 40 * 2 * Math.PI), sg.center[1] + sg.disc * Math.sin(k / 40 * 2 * Math.PI)]); }
    let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const [x, z] of o.r) { x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); }
    o.bb = [x0, z0, x1, z1];
    const cu = Math.cos(o.ang), su = Math.sin(o.ang); let hu = 0, hv = 0;
    for (const [x, z] of o.r) { const dx = x - o.c[0], dz = z - o.c[1]; hu = Math.max(hu, Math.abs(dx * cu + dz * su)); hv = Math.max(hv, Math.abs(-dx * su + dz * cu)); }
    o.hu = hu; o.hv = hv; o.cu = cu; o.su = su; o.st = null; return o; });
  const R_SIMPLE = [600, 680], R_HI = [90, 115];
  let tris = 0, trisHi = 0, built = 0, queue = [], job = null;
  const bbDist = (o, P) => Math.hypot(Math.max(o.bb[0] - P.x, 0, P.x - o.bb[2]), Math.max(o.bb[1] - P.z, 0, P.z - o.bb[3]));

  // ¿suelo libre de plaza? dentro del contorno, fuera de calzada (a 0,5 m del bordillo) y fuera de todo edificio
  function free(o, x, z) { if (!inPoly(o.r, x, z)) return false; const nc = nearestCar(x, z); if (nc[0] >= 0 && nc[1] < 0.5) return false; return coverAt(x, z, -1) < -1e8; }
  const zoneOf = (o, x, z) => { const dx = x - o.c[0], dz = z - o.c[1], u = dx * o.cu + dz * o.su, v = -dx * o.su + dz * o.cu, e = edgeDist(o.r, x, z);
    return o.sg ? o.sg.zone(u, v, x, z, e, o) : genZone(o, u, v, x, z, e); };
  // disposición genérica: borde de granito; en las medianas y grandes, parterres alineados con el eje; sauló en parques
  function genZone(o, u, v, x, z, e) {
    const park = o.cat.some(c => /leisure|garden|park|grass/.test(c)), h = (o.id % 7) / 7;
    if (e < 2.2) return [1, C.granite, 0.3];
    if (o.t === 'gran' || o.t === 'mitjana') {
      const gu = ((u % 18) + 18) % 18, gv = ((v % 14) + 14) % 14;
      if (e > 7 && gu > 4 && gu < 14 && gv > 4 && gv < 10 && !(o.play && Math.abs(u - o.play[0]) < 9 && Math.abs(v - o.play[1]) < 7)) return (gu < 4.4 || gu > 13.6 || gv < 4.4 || gv > 9.6) ? [6, C.curb, 0.25] : [5, C.grass, 0];
      return park ? [3, C.saulo, 0.3] : h < 0.5 ? [1, C.granite, 0.3] : [2, C.panot, 0.35];
    }
    return park ? [3, C.saulo, 0.3] : h < 0.6 ? [2, C.panot, 0.4] : [1, C.granite, 0.35];
  }
  function pickSpecies(o, h) { const park = o.cat.some(c => /leisure|garden|park/.test(c)); return park ? (h < 0.4 ? 'pi' : h < 0.7 ? 'lledoner' : 'platan') : (h < 0.55 ? 'platan' : h < 0.8 ? 'lledoner' : h < 0.9 ? 'tipuana' : 'taronger'); }

  // trabajo de una plaza: devuelve { simple: [mallas], tris, lamps }
  function* buildPlaza(o) {
    const ox = Math.round(o.c[0]), oz = Math.round(o.c[1]), Wp = new GB(ox, oz), Wo = new GB(ox, oz), Wh = new GB(ox, oz);
    seed(4100, o.id);
    const lamps = [], items = [], occ = [];
    const U2W = (u, v) => [o.c[0] + u * o.cu - v * o.su, o.c[1] + u * o.su + v * o.cu];
    const fits = (x, z, r) => { if (!free(o, x, z)) return false; for (const [a, b] of [[r, 0], [-r, 0], [0, r], [0, -r]]) if (!free(o, x + a, z + b)) return false;
      for (const q of occ) if (Math.hypot(q[0] - x, q[1] - z) < q[2] + r) return false; return true; };
    const RAD = { pond: 0, tree: 1.6, bench: 1.0, sbench: 1.2, lamp: 0.6, lampC: 0.6, canaletes: 0.9, play: 6.5, kiosk: 2.2, pergola: 4, pingpong: 1.8, bikes: 2.2, statue: 1.0, macia: 3.4, fontR: 0, rose: 0, balus: 0 };
    const put = (t, u, v, a, x) => { const [wx, wz] = U2W(u, v), r = RAD[t] || 1; if (r > 0 && !fits(wx, wz, r)) return false; occ.push([wx, wz, r]); items.push([t, wx, wz, a + o.ang, x || {}, u, v]); return true; };
    // zona de juegos genérica (se decide antes del pavimento: lleva caucho)
    if (!o.sg && (o.t === 'gran' || o.t === 'mitjana')) {
      for (let k = 0; k < 40 && !o.play; k++) { const u = (R() * 2 - 1) * o.hu * 0.7, v = (R() * 2 - 1) * o.hv * 0.7, [wx, wz] = U2W(u, v);
        if (edgeDist(o.r, wx, wz) > 9 && fits(wx, wz, 6.5)) o.play = [u, v]; } }
    yield;
    // ---- pavimento: bloques de 4 m enteros si están libres y en una sola zona; si no, celdas de 1 m
    const ZK = z => z ? z[0] * 1e7 + z[1][0] * 65536 + z[1][1] * 256 + z[1][2] : -1;
    const [bx0, bz0, bx1, bz1] = o.bb, gx0 = Math.floor(bx0 / 4) * 4, gz0 = Math.floor(bz0 / 4) * 4;
    const quads = [];
    let nb = 0;
    for (let gz = gz0; gz < bz1; gz += 4) { for (let gx = gx0; gx < bx1; gx += 4) {
      const pts = [[0, 0], [4, 0], [0, 4], [4, 4], [2, 2], [2, 0], [0, 2], [4, 2], [2, 4]];
      let all = true, z0k = null, same = true;
      for (const [a, b] of pts) { const x = gx + a, z = gz + b; if (!free(o, x, z)) { all = false; break; } const zz = zoneOf(o, x, z); const k = ZK(zz); if (z0k === null) z0k = k; else if (k !== z0k) same = false; }
      if (all && same) { const zz = zoneOf(o, gx + 2, gz + 2); if (zz) quads.push([gx, gz, 4, zz]); }
      else for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const x = gx + i + 0.5, z = gz + j + 0.5; if (!free(o, x, z)) continue; const zz = zoneOf(o, x, z); if (zz) quads.push([gx + i, gz + j, 1, zz]); }
      if (++nb % 60 === 0) yield; } }
    yield;
    // ---- objetos de la plaza
    const putW = (t, x, z, a, ex) => { const dx = x - o.c[0], dz = z - o.c[1]; return put(t, dx * o.cu + dz * o.su, -dx * o.su + dz * o.cu, a - o.ang, ex); };
    const S = { P: o, put, putW, grid(sp, ph, f) { for (let v = -o.hv + ph; v <= o.hv; v += sp) for (let u = -o.hu + ph; u <= o.hu; u += sp) { const [x, z] = U2W(u, v); if (!free(o, x, z)) continue; f(u, v, x, z, edgeDist(o.r, x, z), zoneOf(o, x, z)); } } };
    if (o.sg) o.sg.objs(S);
    else {
      const A = o.a, n0 = items.length;
      if (o.play) put('play', o.play[0], o.play[1], 0);
      const sp = A > 9000 ? 9 : A > 2500 ? 8 : 7, h0 = R();
      S.grid(sp, 2 + h0 * 3, (u, v, x, z, e, zz) => { if (!zz || e < 2.5) return; const h = hash2(Math.round(x * 2), Math.round(z * 2));
        if (zz[0] === 5) { if (h < 0.55) put('tree', u, v, 0, { sp: pickSpecies(o, h * 1.7) }); return; }
        if (h < (o.t === 'placeta' ? 0.5 : 0.62)) put('tree', u, v, 0, { sp: pickSpecies(o, h * 1.6), alc: zz[0] !== 3 }); });
      // farolas: retícula de ~16 m (al menos una)
      const ls = A > 2500 ? 17 : 13; let nl = 0;
      S.grid(ls, ls * 0.5, (u, v, x, z, e) => { if (e > 1.2 && put('lamp', u, v, 0, { H: A > 2500 ? 5.5 : 4.5 })) nl++; });
      if (!nl) put('lamp', 0, 0, 0, { H: 4.5 });
      // bancos junto a los árboles, mirando hacia dentro
      for (const it of items.slice(n0)) { if (it[0] !== 'tree') continue; const h = hash2(Math.round(it[1] * 3), Math.round(it[2] * 3));
        if (h < 0.42) { const a = Math.atan2(-it[6], -it[5] + 1e-3); const ok = put(h < 0.25 ? 'bench' : 'sbench', it[5] + Math.cos(a) * 2.2, it[6] + Math.sin(a) * 2.2, a, { len: 2.4, wood: h < 0.33 }); if (ok && h < 0.12) put('bin', it[5] + Math.cos(a) * 2.2 + 1.6 * Math.sin(a), it[6] + Math.sin(a) * 2.2 - 1.6 * Math.cos(a), a); } }
      if (A > 600) { let ok = false; for (let k = 0; k < 12 && !ok; k++) ok = put('canaletes', (R() - 0.5) * o.hu, (R() - 0.5) * o.hv, 0); }
      if (A > 2500) { for (let k = 0; k < 10; k++) if (put('bikes', (R() - 0.5) * o.hu * 1.6, (R() - 0.5) * o.hv * 1.6, 0, { n: 5 })) break;
        if (R() < 0.5) for (let k = 0; k < 10; k++) if (put('pingpong', (R() - 0.5) * o.hu, (R() - 0.5) * o.hv, R() * 3)) break; }
      if (A > 6000) { for (let k = 0; k < 10; k++) if (put('kiosk', (R() - 0.5) * o.hu * 1.4, (R() - 0.5) * o.hv * 1.4, 0)) break;
        if (o.cat.some(c => /park|garden/.test(c))) for (let k = 0; k < 10; k++) if (put('pergola', (R() - 0.5) * o.hu, (R() - 0.5) * o.hv, 0, { len: 12 })) break; }
    }
    yield;
    // ---- mallas: objetos (la cota, la de la acera en su sitio)
    const yAt = (x, z) => Math.max(walkAt(x, z), heightAt(x, z) + 0.05) + 0.04;
    const fr = (x, z, a) => ({ x: x - ox, z: z - oz, tx: Math.cos(a), tz: Math.sin(a), nx: -Math.sin(a), nz: Math.cos(a) });
    for (const [t, x, z, a, ex, u, v] of items) {
      const y = yAt(x, z), F = fr(x, z, a), h = hash2(Math.round(x * 5), Math.round(z * 5));
      if (t === 'tree') { tree(Wo, F, y, TREES[ex.sp] || TREES.platan, h); if (ex.alc) quads.push([x - 0.7, z - 0.7, 1.4, [7, C.iron, 0], true]); }
      else if (t === 'lamp' || t === 'lampC') { const H = ex.H || (t === 'lampC' ? 4.2 : 4.5); if (FUR) { FUR.lamp(Wo, AS, F, y, H, 0.35); FUR.lamp(Wh, AH, F, y, H, 0.35); } lamps.push([x, z, H]); }
      else if (t === 'bench') { if (FUR) { FUR.bench(Wo, AS, F, y); FUR.bench(Wh, AH, F, y); } else stoneBench(Wo, F, y, 1.8, true); }
      else if (t === 'bin') { if (FUR) { FUR.bin(Wo, AS, F, y, [40, 96, 70]); FUR.bin(Wh, AH, F, y, [40, 96, 70]); } }
      else if (t === 'sbench') stoneBench(Wo, F, y, ex.len || 2.4, ex.wood);
      else if (t === 'canaletes') { canaletes(Wo, F, y); lamps.push([x, z, 3.6]); }
      else if (t === 'play') { playground(Wo, F, y, h); for (let j = -6; j < 6; j++) for (let i = -8; i < 8; i++) { const p = [x + (i + 0.5) * Math.cos(a) - (j + 0.5) * Math.sin(a), z + (i + 0.5) * Math.sin(a) + (j + 0.5) * Math.cos(a)];
          if (free(o, p[0], p[1])) quads.push([p[0] - 0.55, p[1] - 0.55, 1.1, [4, h < 0.5 ? C.rubberR : C.rubberG, 0.1], true]); } }
      else if (t === 'kiosk') kiosk(Wo, F, y);
      else if (t === 'pergola') pergola(Wo, F, y, ex.len || 12);
      else if (t === 'pingpong') pingpong(Wo, F, y);
      else if (t === 'bikes') bikeRack(Wo, F, y, ex.n || 5);
      else if (t === 'statue') statue(Wo, F, y, 1.8 + h * 0.8, h < 0.6 ? C.bronze : [214, 206, 190], h < 0.6 ? A0.BRONZE : A0.STONE);
      else if (t === 'macia') macia(Wo, F, y);
      else if (t === 'pond') pond(Wo, F, y, ex.r || 5);
      else if (t === 'fontR') fountainRect(Wo, F, y, ex.L, ex.W);
      else if (t === 'balus') { const [x1, z1] = U2W(ex.u1, ex.v1), l = Math.hypot(x1 - x, z1 - z), aa = Math.atan2(z1 - z, x1 - x), Fb = fr(x, z, aa);
        G.lattice(Wo, Fb, 0, l, y, y + 0.85, 0, C.stone, K.BAL, 1); box(Wo, Fb, -0.1, l + 0.1, y + 0.85, y + 1.0, -0.18, 0.18, C.stone, K.FURN, 7, A0.STONE); box(Wo, Fb, -0.1, l + 0.1, y, y + 0.12, -0.15, 0.15, C.stone, K.FURN, 7, A0.STONE); }
      else if (t === 'rose') rose(Wp, x - ox, z - oz, y + 0.006, ex.a0 || 0);
    }
    yield;
    // ---- malla de pavimento con la luz de las farolas cocida en los vértices
    const LGR = 9;
    const glowAt = (x, z) => { let g = 0; for (const [lx, lz, H] of lamps) { const d2 = (lx - x) ** 2 + (lz - z) ** 2, r = H * 1.5; if (d2 < 9 * r * r) g += Math.exp(-d2 / (r * r)); } return Math.min(1, g); };
    let nq = 0;
    for (const [x, z, s, zz, top] of quads) {
      const xs = [x, x + s], zs = [z, z + s], dy = top ? 0.008 : 0, ys = [], gs = [];
      for (const [i, j] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { ys.push(yAt(xs[i], zs[j]) - 0.02 + dy); gs.push(glowAt(xs[i], zs[j])); }
      const col = zz[1], wear = Math.min(1, zz[2] + (hash2(Math.round(x), Math.round(z)) < 0.1 ? 0.25 : 0));
      quad(Wp, F0, x - ox, ys[0], z - oz, x + s - ox, ys[1], z - oz, x + s - ox, ys[2], z + s - oz, x - ox, ys[3], z + s - oz, col, 0, pav(zz[0], gs, wear));
      if (++nq % 400 === 0) yield;
    }
    return { Wp, Wo, Wh, lamps: lamps.length, nItems: items.length, nQuads: quads.length };
  }
  // rosa de los vientos de piedra (Plaça de Catalunya): estrella de ocho puntas en dos tonos dentro de un anillo, a ras de suelo
  function rose(B, cx, cz, y, a0) {
    const dark = [72, 70, 74], light = [214, 204, 186], mid = [170, 132, 112], aux = pav(6, [0, 0, 0, 0], 0.05);
    const P = (r, a) => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
    for (let k = 0; k < 48; k++) { const a = k / 48 * 2 * Math.PI, b = (k + 1) / 48 * 2 * Math.PI, p = [P(12, a), P(12, b), P(13, b), P(13, a)];
      quad(B, F0, ...p[0], ...p[1], ...p[2], ...p[3], dark, 0, aux); }
    for (let k = 0; k < 8; k++) { const a = a0 + k * Math.PI / 4, r = k % 2 ? 7.5 : 11.5, w = Math.PI / 8, c = P(0, 0);
      for (const s of [-1, 1]) { const t = P(r, a), side = P(r * 0.3, a + s * w); quad(B, F0, ...c, ...t, ...side, ...side, s < 0 ? dark : (k % 2 ? mid : light), 0, aux); } }
    for (let k = 0; k < 16; k++) { const a = k / 16 * 2 * Math.PI, b = (k + 1) / 16 * 2 * Math.PI, p = [P(0, 0), P(1.4, a), P(1.4, b)]; quad(B, F0, ...p[0], ...p[1], ...p[2], ...p[2], [150, 120, 70], 0, aux); }
  }

  function* runJob(o) {
    const r = yield* buildPlaza(o);
    const pc = { hi: null };
    const mp = reg(mkMesh(r.Wp, matP, 'plp' + o.i), { cast: false, layer: 'walk' });
    const mo = reg(mkMesh(r.Wo, matB, 'plo' + o.i), { cast: true, layer: 'furn', cell: pc });
    o.st = { pc, mp, mo, Wh: r.Wh, mh: null, tris: (r.Wp.ni + r.Wo.ni) / 3, triH: r.Wh.ni / 3, lamps: r.lamps, items: r.nItems, quads: r.nQuads };
    tris += o.st.tris; built++;
  }
  function drop(o) { const s = o.st; if (!s) return; if (s.mp) s.mp.dispose(); if (s.mo) s.mo.dispose(); dropHi(o); tris -= s.tris; built--; o.st = null; }
  function dropHi(o) { const s = o.st; if (s && s.mh) { s.mh.dispose(); s.mh = null; s.pc.hi = null; trisHi -= s.triH; } }
  function step(P, budget) {
    const t0 = performance.now();
    // capa de detalle del mobiliario: inmediata (la geometría ya está hecha)
    for (const o of PL) { const s = o.st; if (!s) continue; const d = bbDist(o, P);
      if (d < R_HI[0] && !s.mh && s.Wh.nv) { s.mh = reg(mkMesh(s.Wh, matB, 'plh' + o.i), { cast: true, layer: 'furn' }); s.pc.hi = s.mh; trisHi += s.triH; }
      else if (d > R_HI[1] && s.mh) dropHi(o);
      if (d > R_SIMPLE[1]) drop(o); }
    while (performance.now() - t0 < budget) {
      if (!job) { const cand = PL.filter(o => !o.st && !o.fail && bbDist(o, P) < R_SIMPLE[0]); if (!cand.length) return; cand.sort((a, b) => bbDist(a, P) - bbDist(b, P)); job = { o: cand[0], g: runJob(cand[0]) }; }
      let r; try { r = job.g.next(); } catch (e) { console.warn('Plaza «' + job.o.n + '»: ha fallado al construirse', e); job.o.fail = true; job = null; continue; }
      if (r.done) job = null;
    }
  }
  let lastP = null;
  return {
    update(P) { lastP = P; step(P, 4); },
    busy() { if (job) return true; if (!lastP) return false; return PL.some(o => !o.st && !o.fail && bbDist(o, lastP) < R_SIMPLE[0]); },
    flush(P) { lastP = P; for (let k = 0; k < 400 && this.busy(); k++) step(P, 1e9); step(P, 0); },
    stats: () => ({ plazas: PL.length, singulares: PL.filter(o => o.sg).length, hechas: built, tris: Math.round(tris), trisHi: Math.round(trisHi) }),
    list: () => PL.map(o => ({ n: o.n, t: o.t, a: o.a, c: o.c, sg: !!o.sg, st: o.st && { tris: o.st.tris, items: o.st.items, lamps: o.st.lamps } })),
  };
} };
})();
