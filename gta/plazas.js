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
varying vec4 vCol; varying vec4 vInfo; uniform vec2 uPavFade; uniform vec2 uRose;
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
  } else if (pat < 7.5) {                           // 7: reja de fundición del alcorque, con tierra debajo
    vec2 q = fract(W*4.0) - 0.5; float b = step(0.36, max(abs(q.x), abs(q.y)));
    alb = mix(vec3(0.34, 0.27, 0.19)*(0.7 + 0.6*vnoise(W*9.0)), vec3(0.08), b*0.85*(1.0 - smoothstep(0.05, 0.2, fw*4.0)));
  } else if (pat < 8.5) {                           // 8: llambordes (adoquín de piedra de 20×12 a matajunta: Ciutat Vella)
    vec2 q = W/vec2(0.2, 0.12); q.x += 0.5*floor(q.y); vec2 id = floor(q), f = fract(q);
    float j = min(min(f.x, 1.0 - f.x)*0.2, min(f.y, 1.0 - f.y)*0.12), jt = smoothstep(0.004, 0.014, j), aa = smoothstep(0.012, 0.06, fw);
    alb *= mix(mix(0.62, 1.0, jt)*mix(0.82, 1.12, hash21(id)), 0.9, aa)*mix(0.86, 1.06, n1); rough = 0.7;
  } else if (pat < 9.5) {                           // 9: explanada central de la Plaça de Catalunya: rosa de los vientos de piedras de colores
    vec2 d = W - uRose; float r = length(d), th = atan(d.y, d.x), PI4 = 0.7853982;
    vec3 cW = vec3(0.84, 0.81, 0.75), cL = vec3(0.70, 0.68, 0.64), cG = vec3(0.52, 0.51, 0.52), cK = vec3(0.22, 0.22, 0.24), cR = vec3(0.60, 0.37, 0.29), cY = vec3(0.76, 0.63, 0.42);
    float k = floor(th/PI4 + 0.5), da = th - k*PI4, mainP = 1.0 - mod(abs(k), 2.0), Rp = mainP > 0.5 ? 15.5 : 10.0;
    float lat = abs(sin(da))*r, hw = Rp*0.19*max(0.0, 1.0 - r/Rp), aw = max(fw*1.5, 0.02);
    float inS = (1.0 - smoothstep(hw - aw, hw + aw, lat))*step(cos(da), 1.1)*step(0.0, cos(da));
    vec3 star = mainP > 0.5 ? (da > 0.0 ? cW : cK) : (da > 0.0 ? cR : cY);
    // fondo por anillos: disco gris, anillos negro, blanco y rojo, campo de sectores claros con líneas rojas, cenefa exterior negra
    float s16 = mod(floor(th/(PI4*0.5) + 8.0), 2.0);
    vec3 bg = r < 16.4 ? cG : r < 17.2 ? cK : r < 17.9 ? cW : r < 18.5 ? cR : r < 45.0 ? mix(cL, cW, s16*0.55) : r < 45.8 ? cK : cR;
    if (r > 18.5 && r < 45.0 && abs(fract((r - 18.5)/6.6 + 0.5) - 0.5)*6.6 < 0.18) bg = cR;
    vec3 c = mix(bg, star, inS*step(r, Rp));
    if (r < 1.3) c = r < 0.9 ? cY : cK;
    // juntas: losas de ~0,8 m en anillos de 0,75 m
    float ring = floor(r/0.75), nb = max(8.0, floor(6.2832*(ring + 0.5)*0.75/0.8)), ja = abs(fract(th/6.2832*nb) - 0.5)*6.2832/nb*r, jr = abs(fract(r/0.75) - 0.5)*0.75;
    float jt = smoothstep(0.004, 0.012, min(jr, ja)), aj = smoothstep(0.02, 0.1, fw);
    alb = c*mix(mix(0.78, 1.0, jt)*mix(0.93, 1.06, hash21(vec2(ring, floor(th/6.2832*nb)))), 0.95, aj)*mix(0.9, 1.06, n1*0.6 + n2*0.4); rough = 0.6;
  } else {                                          // 10: macizo de flores: hojas verdes con manchas de flor del color del vértice
    float g = vnoise(W*0.7)*0.4 + vnoise(W*5.0)*0.35 + vnoise(W*0.12)*0.25, fl = smoothstep(0.42, 0.62, vnoise(W*3.3 + 7.0)*0.7 + vnoise(W*11.0)*0.3);
    alb = mix(vec3(0.27, 0.38, 0.18)*mix(0.7, 1.15, g), vCol.rgb*mix(0.8, 1.1, vnoise(W*17.0)), fl*0.85); rough = 0.92;
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
function solve3(A, y) { const d = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = d(A); if (Math.abs(D) < 1e-9) return null; return [0, 1, 2].map(c => d(A.map((r, i) => r.map((v, j) => j === c ? y[i] : v))) / D); }
// especies de plaza → índice de trees.js (el ciprés no está en trees.js: sigue con la pieza propia)
const TSP = { platan: 0, lledoner: 1, taronger: 2, jacaranda: 4, tipuana: 5, pi: 6 };
const sid = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 1000003; };

// ------------------------------------------------------------------ colores
const C = {
  granite: [150, 146, 140], graniteL: [166, 161, 152], graniteD: [104, 102, 100], pink: [178, 148, 136], panot: [146, 140, 132], saulo: [184, 160, 122],
  rubberR: [150, 62, 48], rubberG: [70, 118, 72], rubberB: [62, 96, 140], grass: [82, 110, 52], grassD: [64, 92, 44], curb: [160, 156, 148],
  iron: [40, 42, 45], green: [34, 62, 46], wood: [128, 82, 46], stone: [176, 168, 152], bronze: [92, 74, 52], water: [52, 86, 96], white: [222, 222, 216],
};
// especies de árbol de plaza: [copa, tronco, alto de tronco, radio de copa, forma (0 redonda, 1 parasol de pino, 2 columna)]
const TREES = { platan: [[92, 118, 58], [96, 92, 78], 4.0, 3.1, 0], lledoner: [[78, 104, 62], [110, 108, 104], 2.8, 3.0, 0], pi: [[58, 84, 50], [104, 76, 56], 6.0, 4.2, 1],
  tipuana: [[96, 122, 60], [104, 92, 78], 3.2, 4.0, 0], xiprer: [[46, 72, 46], [92, 74, 58], 1.0, 1.2, 2], taronger: [[60, 96, 48], [96, 86, 70], 1.6, 1.6, 0] };

// ------------------------------------------------------------------ piezas propias (marco F: u, y, d; coordenadas de la malla)
function tree(B, F, y, sp, h, hard) {
  const [lc, tc, th0, cr0, form] = sp, s = 0.85 + 0.3 * h, th = hard ? th0 * 1.2 : th0, cr = hard ? cr0 * 0.72 : cr0;   // en alcorque: más fuste y menos copa
  rev(B, F, 0, 0, [[0.2 * s, y - 0.1], [0.15 * s, y + th * 0.6 * s], [0.12 * s, y + th * s]], 6, tc, K.FURN, { aux: A0.MATTE, cap: 1 });
  if (form === 2) { sphere(B, F, 0, y + th + 3.4 * s, 0, cr * s, 7, 6, lc, K.PLZ_LEAF, null, 3.2); return; }
  if (form === 1) { // pino piñonero: tronco largo algo inclinado y copa en parasol
    sphere(B, F, 0.4, y + th * s + 0.8, 0, cr * s, 9, 5, lc, K.PLZ_LEAF, null, 0.38);
    sphere(B, F, -1.2 * s, y + th * s + 0.4, 1.0 * s, cr * 0.6 * s, 7, 4, mixc(lc, [40, 60, 36], 0.3), K.PLZ_LEAF, null, 0.45); return; }
  const top = y + th * s;
  sphere(B, F, 0, top + cr * 0.55 * s, 0, cr * s, 7, 5, lc, K.PLZ_LEAF, null, 0.82);
  sphere(B, F, cr * 0.45 * s, top + cr * 0.35 * s, cr * 0.25 * s, cr * 0.62 * s, 6, 4, shade(lc, 1.08), K.PLZ_LEAF, null, 0.8);
  sphere(B, F, -cr * 0.4 * s, top + cr * 0.4 * s, -cr * 0.3 * s, cr * 0.6 * s, 6, 4, shade(lc, 0.92), K.PLZ_LEAF, null, 0.8);
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

// ------------------------------------------------------------------ P3: piezas de la Plaça de Catalunya
// figura sobre pedestal (zócalo, dado y cornisa): cinco actitudes (de pie, brazo alzado, drapeada, sedente, con las manos en la cabeza)
function figure(B, F, y, col, ac, pose, sc, ph) {
  ph = ph === undefined ? 1.7 : ph; sc = sc || 1; const S = v => v * sc, st = [192, 186, 172];
  if (ph > 0) { box(B, F, -0.85, 0.85, y - 0.2, y + 0.25, -0.85, 0.85, shade(st, 0.9), K.FURN, 7, A0.STONE); box(B, F, -0.6, 0.6, y + 0.25, y + ph, -0.6, 0.6, st, K.FURN, 7, A0.STONE);
    box(B, F, -0.72, 0.72, y + ph, y + ph + 0.14, -0.72, 0.72, shade(st, 1.05), K.FURN, 7, A0.STONE); }
  const b = y + ph + (ph > 0 ? 0.14 : 0), o = { aux: ac };
  if (pose === 3) { box(B, F, -S(0.35), S(0.35), b, b + S(0.5), -S(0.3), S(0.3), shade(st, 0.95), K.FURN, 7, A0.STONE);            // sedente: banco de piedra
    for (const s of [-1, 1]) tube(B, F, [[S(0.1 * s), b + S(0.05), S(0.42)], [S(0.1 * s), b + S(0.48), S(0.4)], [S(0.1 * s), b + S(0.55), 0]], S(0.08), 5, col, K.FURN, o);
    rev(B, F, 0, 0, [[S(0.18), b + S(0.52)], [S(0.15), b + S(0.8)], [S(0.2), b + S(1.08)], [S(0.07), b + S(1.15)]], 7, col, K.FURN, o);
    sphere(B, F, 0, b + S(1.3), S(0.02), S(0.12), 6, 4, col, K.FURN, ac, 1.15);
    for (const s of [-1, 1]) tube(B, F, [[S(0.21 * s), b + S(1.05), 0], [S(0.25 * s), b + S(0.78), S(0.15)], [S(0.12 * s), b + S(0.6), S(0.32)]], S(0.055), 4, col, K.FURN, o); return; }
  if (pose === 2) rev(B, F, 0, 0, [[S(0.34), b], [S(0.3), b + S(0.5)], [S(0.2), b + S(0.98)]], 8, col, K.FURN, o);            // drapeada: túnica hasta los pies
  else for (const s of [-1, 1]) tube(B, F, [[S(0.12 * s), b, s * S(pose === 1 ? 0.1 : 0)], [S(0.1 * s), b + S(0.5), 0], [S(0.11 * s), b + S(0.98), 0]], S(0.085), 5, col, K.FURN, o);
  rev(B, F, 0, 0, [[S(0.18), b + S(0.92)], [S(0.15), b + S(1.18)], [S(0.21), b + S(1.48)], [S(0.08), b + S(1.56)], [S(0.06), b + S(1.62)]], 7, col, K.FURN, o);
  sphere(B, F, 0, b + S(1.74), S(0.01), S(0.12), 6, 4, col, K.FURN, ac, 1.15);
  const sh = s => [S(0.22 * s), b + S(1.46), 0];
  const hand = [[[0.27, 0.95, 0.05], [-0.27, 0.95, 0.05]], [[0.34, 2.15, 0.06], [-0.27, 0.95, 0.05]], [[0.16, 1.2, 0.32], [-0.16, 1.2, 0.32]], null, [[0.12, 1.86, 0.02], [-0.12, 1.86, 0.02]]][pose];
  const elb = [[0.27, 1.2, 0], [0.3, 1.8, 0.04], [0.26, 1.24, 0.12], null, [0.36, 1.62, 0]][pose];
  for (let q = 0; q < 2; q++) { const s = q ? -1 : 1, hd = hand[q], e2 = pose === 1 && q ? [-0.27, 1.2, 0] : [elb[0] * s, elb[1], elb[2]];
    tube(B, F, [sh(s), [S(e2[0]), b + S(e2[1]), S(e2[2])], [S(hd[0]), b + S(hd[1]), S(hd[2])]], S(0.055), 4, col, K.FURN, o); }
}
const P3PIECE = {
  figure(B, F, y, h, ex) { figure(B, F, y, ex.bronze ? [88, 72, 52] : [214, 206, 190], ex.bronze ? A0.BRONZE : A0.STONE, ex.pose || 0, 1.05, 1.5 + h * 0.5); },
  // fuente de la plaza: vaso de piedra moldurado, lámina de agua, grupo escultórico central, chorros en arco desde los lados y surtidores
  fontC(B, F, y, h, ex) { const L = ex.L, Wd = ex.W, rim = [196, 190, 176], wa = [0, 150, 0, 0], w4 = wa.concat(wa, wa, wa), jc = [214, 230, 238];
    for (const [u0, u1, d0, d1] of [[-L / 2 - 0.6, L / 2 + 0.6, -Wd / 2 - 0.6, -Wd / 2], [-L / 2 - 0.6, L / 2 + 0.6, Wd / 2, Wd / 2 + 0.6], [-L / 2 - 0.6, -L / 2, -Wd / 2, Wd / 2], [L / 2, L / 2 + 0.6, -Wd / 2, Wd / 2]]) {
      box(B, F, u0, u1, y - 0.2, y + 0.5, d0, d1, rim, K.FURN, 7, A0.STONE); box(B, F, u0 - 0.06, u1 + 0.06, y + 0.5, y + 0.62, d0 - 0.06, d1 + 0.06, shade(rim, 1.06), K.FURN, 7, A0.STONE); }
    box(B, F, -L / 2, L / 2, y - 0.2, y + 0.05, -Wd / 2, Wd / 2, [70, 92, 98], K.FURN, 1, A0.STONE);
    quad(B, F, -L / 2, y + 0.42, -Wd / 2, L / 2, y + 0.42, -Wd / 2, L / 2, y + 0.42, Wd / 2, -L / 2, y + 0.42, Wd / 2, C.water, K.PLZ_WATER, w4);
    const nj = Math.max(4, Math.round(L / 1.6));
    for (let k = 0; k < nj; k++) { const u = -L / 2 + 0.8 + k * (L - 1.6) / (nj - 1);
      for (const s of [-1, 1]) { const pts = []; for (let q = 0; q <= 5; q++) { const t = q / 5; pts.push([u, y + 0.55 + 1.5 * t * (1 - t) * 2.2 - 0.15 * t, s * (Wd / 2 - 0.1 - t * Math.min(2.4, Wd / 2 - 1.4))]); }
        tube(B, F, pts, 0.035, 4, jc, K.PLZ_WATER, { aux: wa }); } }
    box(B, F, -1.6, 1.6, y + 0.2, y + 1.1, -1.1, 1.1, rim, K.FURN, 7, A0.STONE);
    figure(B, F, y + 1.1, [214, 206, 190], A0.STONE, 2, 1.1, 0); for (const s of [-1, 1]) { const F2 = Object.assign({}, F, { x: F.x + F.tx * s * 1.0, z: F.z + F.tz * s * 1.0 }); figure(B, F2, y + 1.1, [214, 206, 190], A0.STONE, 3, 0.95, 0); }
    for (const s of [-1, 1]) rev(B, F, s * (L / 2 - 2.2), 0, [[0.09, y + 0.42], [0.05, y + 2.6], [0.0, y + 3.0]], 5, jc, K.PLZ_WATER, { aux: wa, cap: 0 });
    return 1.4; },
  // la Deessa (Clarà) en su estanque redondo: borde de piedra, agua, roca y figura; surtidores alrededor
  pondC(B, F, y, h, ex) { const r = ex.r || 6, wa = [0, 150, 0, 0];
    rev(B, F, 0, 0, [[r + 0.55, y - 0.2], [r + 0.55, y + 0.45], [r + 0.7, y + 0.55], [r + 0.2, y + 0.6]], 32, [196, 190, 176], K.FURN, { aux: A0.STONE, cap: 0 });
    rev(B, F, 0, 0, [[0, y + 0.4], [r + 0.2, y + 0.4]], 32, C.water, K.PLZ_WATER, { aux: wa });
    rev(B, F, 0, 0, [[1.3, y + 0.3], [1.1, y + 0.9], [0.8, y + 1.2]], 9, [150, 144, 132], K.FURN, { aux: A0.STONE, cap: 1 });
    figure(B, F, y + 1.2, [226, 218, 204], A0.STONE, 4, 1.15, 0);
    for (let k = 0; k < 8; k++) { const a = k / 8 * 2 * Math.PI, pts = []; for (let q = 0; q <= 4; q++) { const t = q / 4; pts.push([Math.cos(a) * (r - 0.3 - t * 2.4), y + 0.42 + 1.4 * t * (1 - t) * 2, Math.sin(a) * (r - 0.3 - t * 2.4)]); }
      tube(B, F, pts, 0.03, 4, [214, 230, 238], K.PLZ_WATER, { aux: wa }); }
    return 1.2; },
  hedge(B, F, y, h, ex) { const l = ex.len || 6; box(B, F, -l / 2, l / 2, y - 0.1, y + 0.78, -0.38, 0.38, shade([46, 80, 48], 0.9 + 0.2 * h), K.PLZ_LEAF, 7, null); },
  pigeons(B, F, y, h) { for (let k = 0; k < 24; k++) { const a = hash2(k, 11) * 6.28, r = Math.sqrt(hash2(k, 5)) * 4.5, u = Math.cos(a) * r, d = Math.sin(a) * r, dir = hash2(k, 3) * 6.28, cg = [104 + 30 * hash2(k, 7), 104 + 30 * hash2(k, 7), 112 + 30 * hash2(k, 7)];
    sphere(B, F, u, y + 0.13, d, 0.11, 5, 3, cg, K.FURN, A0.MATTE, 0.75); sphere(B, F, u + Math.cos(dir) * 0.12, y + 0.24, d + Math.sin(dir) * 0.12, 0.05, 4, 3, shade(cg, 0.8), K.FURN, A0.MATTE); } },
  // escalinata de la plataforma a la acera (si hay desnivel): peldaños de 16 cm con huella de 36 cm, hacia fuera, y pedestales a los lados
  stairs(B, F, y, h, ex, X) { const w = ex.w || 8, g = X.gAt(X.x + Math.cos(X.a) * 3.5, X.z + Math.sin(X.a) * 3.5), drop = y - g; if (drop < 0.22) return;
    const n = Math.round(drop / 0.16), ri = drop / n, tr = 0.36, st = [176, 170, 158];
    for (let k = 0; k < n; k++) box(B, F, k * tr, n * tr + 0.2, g - 0.4, y - (k + 1) * ri + 0.005, -w / 2, w / 2, shade(st, k % 2 ? 0.97 : 1.02), K.FURN, 7, A0.STONE);
    for (const s of [-1, 1]) box(B, F, -0.3, n * tr + 0.2, g - 0.4, y + 0.55, s < 0 ? -w / 2 - 0.5 : w / 2, s < 0 ? -w / 2 : w / 2 + 0.5, shade(st, 0.92), K.FURN, 7, A0.STONE); },
};

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
const FLW = [[178, 50, 46], [200, 164, 50], [124, 70, 146], [206, 200, 186], [196, 96, 128]];
SING.push({ key: 'Plaça de Catalunya', ax: 136, lift: 1.4,
  zone(u, v, x, z, e) { const r = Math.hypot(x - CAT.c[0], z - CAT.c[1]);
    if (r < 46) return [9, C.graniteL, 0.06];                      // explanada: rosa de los vientos (dibujo 9 del sombreador)
    if (r < 47.2) return [6, C.curb, 0.12];                        // cenefa de piedra
    if (r < 63 || e < 3.5) return [1, C.granite, 0.22];
    let dc = 1e9; for (const k of CAT.corners) dc = Math.min(dc, segD(x, z, CAT.c, k));
    if (dc < 6) return [1, C.granite, 0.28];
    if (Math.hypot(x - CAT.deessa[0], z - CAT.deessa[1]) < 12 || Math.hypot(x - CAT.macia[0], z - CAT.macia[1]) < 9) return [1, C.granite, 0.22];
    if (r < 64 || e < 4.3 || dc < 6.8) return [6, C.curb, 0.18];
    if (r < 66.6 || dc < 9.2 || e < 6.4) { const s = Math.floor((Math.atan2(z - CAT.c[1], x - CAT.c[0]) + Math.PI) / (2 * Math.PI) * 20); return [10, FLW[s % FLW.length], 0]; }   // macizos de flores junto a los paseos
    return [5, C.grass, 0]; },
  objs(S) { const W = S.putW, c = CAT.c;
    for (const [x, z, twin] of CAT.fonts) { const a = Math.atan2(z - c[1], x - c[0]) + Math.PI / 2;
      if (twin) for (const s of [-1, 1]) W('fontC', x + Math.cos(a) * s * 8, z + Math.sin(a) * s * 8, a, { L: 13, W: 6.5 });
      else W('fontC', x, z, a, { L: 22, W: 7.5 }); }
    CAT.art.forEach(([x, z], k) => W('figure', x, z, Math.atan2(c[1] - z, c[0] - x) - Math.PI / 2, { pose: k % 5, bronze: k % 3 !== 0 }));
    W('pondC', CAT.deessa[0], CAT.deessa[1], 0, { r: 6 });
    W('macia', CAT.macia[0], CAT.macia[1], Math.atan2(c[1] - CAT.macia[1], c[0] - CAT.macia[0]) - Math.PI / 2);
    W('kiosk', 12250, 14112, 0.8); W('kiosk', 12160, 14000, -0.7);
    W('canaletes', 12196, 14004, 0); W('canaletes', 12240, 14100, 0);
    // escalinatas en las esquinas (bajan de la plataforma a la acera cuando hay desnivel)
    for (const k of CAT.corners) { const a = Math.atan2(k[1] - c[1], k[0] - c[0]), dl = Math.hypot(k[0] - c[0], k[1] - c[1]) - 1.5; W('stairs', c[0] + Math.cos(a) * dl, c[1] + Math.sin(a) * dl, a, { w: 10 }); }
    for (let k = 0; k < 24; k++) { const a = (k + 0.5) / 24 * 2 * Math.PI; W('lampC', c[0] + Math.cos(a) * 48.5, c[1] + Math.sin(a) * 48.5, a); }
    for (let k = 0; k < 8; k++) { const a = (k + 0.25) / 8 * 2 * Math.PI; W('lamp', c[0] + Math.cos(a) * 31, c[1] + Math.sin(a) * 31, a, { H: 7.5 }); }   // farolas altas sobre la explanada: luz cálida de noche en la rosa
    for (let k = 0; k < 16; k++) { const a = k / 16 * 2 * Math.PI; W('bench', c[0] + Math.cos(a) * 49.5, c[1] + Math.sin(a) * 49.5, a + Math.PI); }
    for (let k = 0; k < 4; k++) { const a = k * 1.7 + 0.4, r = 14 + k * 7; W('pigeons', c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, a); }
    // setos: anillo de boj tras los macizos de flores, cortado en los paseos
    for (let k = 0; k < 56; k++) { const a = (k + 0.5) / 56 * 2 * Math.PI, x = c[0] + Math.cos(a) * 67.6, z = c[1] + Math.sin(a) * 67.6, zz = S.zone(x, z);
      if (zz && zz[0] === 5) W('hedge', x, z, a + Math.PI / 2, { len: 6.6 }); }
    // árboles: hileras de plátanos en el perímetro y grupos sueltos en los parterres (no en retícula)
    S.grid(8.5, 3, (u, v, x, z, e, zz) => { if (!zz || zz[0] !== 5 || zz[1] !== C.grass || e < 5) return; const h = hash2(Math.round(x), Math.round(z));
      if (e < 11 || h < 0.3) S.put('tree', u + (h - 0.5) * 2, v, 0, { sp: e < 11 ? 'platan' : h < 0.12 ? 'pi' : h < 0.22 ? 'lledoner' : 'platan' }); });
    S.grid(18, 5, (u, v, x, z, e, zz) => zz && zz[0] === 1 && Math.hypot(x - c[0], z - c[1]) > 66 && S.put('lampC', u, v, 0));
    S.grid(13, 2, (u, v, x, z, e, zz) => zz && zz[0] === 1 && Math.hypot(x - c[0], z - c[1]) > 66 && hash2(Math.round(x), Math.round(z)) < 0.5 && S.put('bench', u, v, hash2(Math.round(z), 3) * 6.28));
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
    // árboles (P3): hileras en los bordes y dos grupos; el centro, despejado
    S.grid(8, 2, (u, v, x, z, e) => { const h = hash2(Math.round(x), Math.round(z)), g = Math.min(Math.hypot(u + P.hu * 0.45, v - P.hv * 0.1), Math.hypot(u - P.hu * 0.2, v + P.hv * 0.45));
      if ((e > 3 && e < 7.5 && h < 0.8) || (g < 9 && e > 3 && h < 0.7)) S.put('tree', u, v, 0, { sp: h < 0.55 ? 'platan' : h < 0.75 ? 'tipuana' : 'jacaranda', alc: true }); });
    S.grid(14, 0, (u, v, x, z, e) => e > 3 && S.put('sbench', u, v + 3.5, 0, { len: 3.2, wood: true }));
    S.grid(21, 10, (u, v, x, z, e) => e > 2 && S.put('lamp', u, v, 0, { H: 8 })); } });

// ================================================================== P2: piezas propias de las plazas singulares y de los paseos
// palmera datilera / washingtonia: tronco alto y fino, faldón de hojas secas y corona de hojas colgantes (dos caras)
function palm(B, F, y, h) {
  const H = 8.5 + 5 * h, tc = [128, 112, 92], lc = [74, 104, 52], dry = [132, 112, 74];
  rev(B, F, 0, 0, [[0.32, y - 0.1], [0.24, y + 1.0], [0.2, y + H * 0.6], [0.22, y + H]], 7, tc, K.FURN, { aux: A0.MATTE, cap: 0 });
  rev(B, F, 0, 0, [[0.24, y + H - 1.6], [0.62, y + H - 0.6], [0.32, y + H + 0.1]], 7, dry, K.PLZ_LEAF, { cap: 0 });
  const n = 13, top = y + H + 0.2;
  for (let k = 0; k < n; k++) { const a = (k + 0.37 * h) / n * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a), up = k % 2 ? 0.9 : 0.4, w = 0.34;
    const P = (r, yy, o) => [c * r - s * o, yy, s * r + c * o];
    const A = P(0.1, top, 0), Bm = P(2.0, top + up, 0), Cm = P(3.6 + 0.4 * h, top - 0.9 + up * 0.5, 0);
    for (const sg of [[A, Bm], [Bm, Cm]]) { const [p, q] = sg, pw = sg[0] === A ? 0.12 : w, qw = sg[1] === Cm ? 0.06 : w;
      const p1 = P(Math.hypot(p[0], p[2]), p[1], -pw), p2 = P(Math.hypot(p[0], p[2]), p[1], pw), q1 = P(Math.hypot(q[0], q[2]), q[1], -qw), q2 = P(Math.hypot(q[0], q[2]), q[1], qw);
      quad(B, F, ...p1, ...q1, ...q2, ...p2, lc, K.PLZ_LEAF); } }
}
// farola de seis brazos de la Plaça Reial (Gaudí, 1879): pie de piedra, fuste de fundición con anillos de bronce,
// seis brazos con farol y remate con el casco alado de Mercurio
function gaudiLamp(B, F, y) {
  const ir = [44, 58, 50], br = [150, 118, 62];
  rev(B, F, 0, 0, [[0.95, y], [0.95, y + 0.35], [0.7, y + 0.45], [0.6, y + 1.1], [0.72, y + 1.2]], 8, C.stone, K.FURN, { aux: A0.STONE, cap: 1 });
  rev(B, F, 0, 0, [[0.34, y + 1.2], [0.2, y + 1.6], [0.16, y + 3.4], [0.24, y + 3.6], [0.14, y + 3.8], [0.12, y + 4.6], [0.2, y + 4.75]], 8, ir, K.FURN, { aux: A0.CAST, cap: 1 });
  for (const yy of [1.7, 3.5]) rev(B, F, 0, 0, [[0.27, y + yy - 0.06], [0.27, y + yy + 0.06]], 8, br, K.FURN, { aux: A0.BRONZE, cap: 0 });
  for (let k = 0; k < 6; k++) { const a = k / 6 * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a);
    tube(B, F, [[c * 0.15, y + 4.3, s * 0.15], [c * 0.8, y + 4.55, s * 0.8], [c * 1.15, y + 4.9, s * 1.15]], 0.04, 4, ir, K.FURN, { aux: A0.CAST });
    rev(B, F, c * 1.15, s * 1.15, [[0.09, y + 4.9], [0.17, y + 5.05], [0.17, y + 5.4], [0.06, y + 5.55]], 6, [255, 236, 190], K.FURN, { aux: A0.LENS, cap: 1 }); }
  rev(B, F, 0, 0, [[0.2, y + 4.75], [0.1, y + 5.6], [0.08, y + 6.2]], 6, ir, K.FURN, { aux: A0.CAST, cap: 0 });
  sphere(B, F, 0, y + 6.45, 0, 0.3, 7, 5, br, K.FURN, A0.BRONZE, 0.75);
  for (const sd of [-1, 1]) quad(B, F, 0, y + 6.45, sd * 0.2, 0.05, y + 6.95, sd * 0.55, -0.3, y + 6.75, sd * 0.6, -0.25, y + 6.4, sd * 0.25, br, K.FURN, A0.BRONZE);
}
// vaso redondo de fuente con lámina de agua (pieza común)
function basin(B, F, y, r, n) {
  rev(B, F, 0, 0, [[r + 0.4, y - 0.1], [r + 0.4, y + 0.5], [r + 0.15, y + 0.6], [r, y + 0.5]], n || 24, C.stone, K.FURN, { aux: A0.STONE, cap: 0 });
  rev(B, F, 0, 0, [[0, y + 0.36], [r + 0.05, y + 0.36]], n || 24, C.water, K.PLZ_WATER, { aux: [0, 140, 0, 0] });
}
// fuente de las Tres Gracias (Plaça Reial): vaso, pie con tres figuras de fundición en corro y taza de remate con chorro
function tresGracies(B, F, y) {
  basin(B, F, y, 4.6);
  rev(B, F, 0, 0, [[1.0, y + 0.3], [0.8, y + 0.8], [0.45, y + 1.0], [0.4, y + 1.9]], 10, C.stone, K.FURN, { aux: A0.STONE, cap: 1 });
  for (let k = 0; k < 3; k++) { const a = k / 3 * 2 * Math.PI, c = Math.cos(a) * 0.42, s = Math.sin(a) * 0.42;
    rev(B, F, c, s, [[0.24, y + 1.9], [0.28, y + 2.4], [0.2, y + 2.95], [0.25, y + 3.3], [0.16, y + 3.55], [0.06, y + 3.62]], 7, [70, 72, 66], K.FURN, { aux: A0.CAST, cap: 0 });
    sphere(B, F, c, y + 3.75, s, 0.13, 6, 4, [70, 72, 66], K.FURN, A0.CAST); }
  rev(B, F, 0, 0, [[0.12, y + 3.6], [0.12, y + 4.1], [1.1, y + 4.3], [1.2, y + 4.45], [0.2, y + 4.4]], 12, [70, 72, 66], K.FURN, { aux: A0.CAST, cap: 1 });
  rev(B, F, 0, 0, [[0.9, y + 4.42], [0.06, y + 5.2], [0, y + 5.3]], 6, [210, 228, 236], K.PLZ_WATER, { aux: [0, 140, 0, 0], cap: 0 });
}
// fuente octogonal de Sant Felip Neri: vaso bajo de piedra y pilar central con taza
function octFont(B, F, y) {
  basin(B, F, y, 2.0, 8);
  rev(B, F, 0, 0, [[0.4, y + 0.3], [0.3, y + 1.2], [0.75, y + 1.35], [0.8, y + 1.45], [0.15, y + 1.5], [0.1, y + 1.9]], 8, C.stone, K.FURN, { aux: A0.STONE, cap: 1 });
}
// estanque oval (Francesc Macià): vaso bajo con agua y la estatua en el centro
function ovalPond(B, F, y, rx, rz) {
  const n = 28, P = (k, s) => { const a = k / n * 2 * Math.PI; return [Math.cos(a) * rx * s, Math.sin(a) * rz * s]; };
  for (let k = 0; k < n; k++) { const [a0, b0] = P(k, 1), [a1, b1] = P(k + 1, 1), [c0, d0] = P(k, 1.06), [c1, d1] = P(k + 1, 1.06);
    quad(B, F, c0, y - 0.1, d0, c1, y - 0.1, d1, c1, y + 0.45, d1, c0, y + 0.45, d0, C.stone, K.FURN, A0.STONE);
    quad(B, F, c0, y + 0.45, d0, c1, y + 0.45, d1, a1, y + 0.45, b1, a0, y + 0.45, b0, C.stone, K.FURN, A0.STONE);
    quad(B, F, 0, y + 0.32, 0, 0, y + 0.32, 0, a1, y + 0.32, b1, a0, y + 0.32, b0, C.water, K.PLZ_WATER, [0, 140, 0, 0, 0, 140, 0, 0, 0, 140, 0, 0, 0, 140, 0, 0]); }
  statue(B, F, y + 0.3, 1.6, [226, 220, 206], A0.STONE);
  for (let k = 0; k < 8; k++) { const a = k / 8 * 2 * Math.PI; rev(B, F, Math.cos(a) * rx * 0.6, Math.sin(a) * rz * 0.6, [[0.06, y + 0.32], [0.03, y + 1.6], [0, y + 1.8]], 4, [210, 228, 236], K.PLZ_WATER, { aux: [0, 140, 0, 0], cap: 0 }); }
}
// monumento de columna: basamento escalonado, fuste alto y figura arriba (Duc de Medinaceli, Sant Vicenç de Sarrià)
function colMon(B, F, y, H) {
  box(B, F, -1.6, 1.6, y - 0.2, y + 0.5, -1.6, 1.6, C.stone, K.FURN, 7, A0.STONE);
  box(B, F, -1.1, 1.1, y + 0.5, y + 2.6, -1.1, 1.1, shade(C.stone, 0.95), K.FURN, 7, A0.STONE);
  rev(B, F, 0, 0, [[0.45, y + 2.6], [0.38, y + 3.0], [0.32, y + H - 0.6], [0.5, y + H - 0.4], [0.5, y + H]], 10, [96, 92, 84], K.FURN, { aux: A0.CAST, cap: 1 });
  statue(B, F, y + H, 0.2, C.bronze, A0.BRONZE);
}
// terraza de bar: mesa redonda, cuatro sillas y sombrilla (colores neutros, sin marcas)
function terrace(B, F, y, h) {
  const um = [[226, 220, 204], [196, 190, 176], [120, 128, 112], [168, 70, 56]][Math.floor(h * 3.99)];
  rev(B, F, 0, 0, [[0.25, y], [0.05, y + 0.1], [0.04, y + 0.7], [0.35, y + 0.72], [0.35, y + 0.75]], 8, [60, 62, 64], K.FURN, { aux: A0.STEEL, cap: 1 });
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4, c = Math.cos(a) * 0.75, s = Math.sin(a) * 0.75;
    box(B, F, c - 0.21, c + 0.21, y + 0.44, y + 0.48, s - 0.21, s + 0.21, [70, 72, 74], K.FURN, 5, A0.PLASTIC);
    for (const [du, dd] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) box(B, F, c + du - 0.02, c + du + 0.02, y, y + 0.45, s + dd - 0.02, s + dd + 0.02, [70, 72, 74], K.FURN, 4, A0.STEEL); }
  rev(B, F, 0, 0, [[0.03, y + 0.75], [0.03, y + 2.3]], 4, [180, 180, 176], K.FURN, { aux: A0.STEEL, cap: 0 });
  rev(B, F, 0, 0, [[1.4, y + 2.0], [0.0, y + 2.55]], 8, um, K.FURN, { aux: A0.PLASTIC, cap: 1 });
}
// banco-farola del Passeig de Gràcia (Pere Falqués, 1906): asiento curvo de trencadís blanco que abraza una farola de forja
function bancFanal(B, F, y) {
  const tr = [214, 212, 202], ir = [52, 56, 54];
  for (let k = 0; k < 10; k++) { const a0 = -2.2 + k * 0.44, a1 = a0 + 0.44, R0 = 1.25, R1 = 1.85, P = (r, a) => [Math.cos(a) * r, Math.sin(a) * r];
    const [x0, z0] = P(R0, a0), [x1, z1] = P(R0, a1), [x2, z2] = P(R1, a1), [x3, z3] = P(R1, a0);
    quad(B, F, x3, y + 0.45, z3, x2, y + 0.45, z2, x1, y + 0.45, z1, x0, y + 0.45, z0, tr, K.FURN, A0.GLOSS);
    quad(B, F, x2, y, z2, x2, y + 0.45, z2, x3, y + 0.45, z3, x3, y, z3, shade(tr, 0.92), K.FURN, A0.GLOSS);
    quad(B, F, x0, y + 0.45, z0, x1, y + 0.45, z1, x1, y + 1.1, z1, x0, y + 1.1, z0, shade(tr, 0.96), K.FURN, A0.GLOSS); }
  rev(B, F, 0, 0, [[1.2, y], [1.2, y + 0.2], [0.5, y + 0.6], [0.3, y + 1.4], [0.16, y + 2.0], [0.12, y + 6.4], [0.22, y + 6.6]], 8, ir, K.FURN, { aux: A0.CAST, cap: 1 });
  for (let k = 0; k < 3; k++) { const a = k / 3 * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a);
    tube(B, F, [[0, y + 6.3, 0], [c * 0.6, y + 6.8, s * 0.6], [c * 0.75, y + 7.1, s * 0.75]], 0.04, 4, ir, K.FURN, { aux: A0.CAST });
    sphere(B, F, c * 0.75, y + 7.3, s * 0.75, 0.2, 6, 4, [255, 236, 190], K.FURN, A0.LENS, 1.3); }
  rev(B, F, 0, 0, [[0.22, y + 6.6], [0.06, y + 7.6], [0, y + 7.9]], 6, ir, K.FURN, { aux: A0.CAST, cap: 0 });
}
// parada de flores de La Rambla: caseta de chapa verde oscura con marquesina y flores en gradas delante
function flowerStall(B, F, y, h) {
  const g = [38, 66, 52];
  box(B, F, -2.2, 2.2, y, y + 2.6, -0.9, 0.9, g, K.FURN, 7, A0.PAINT);
  box(B, F, -2.5, 2.5, y + 2.6, y + 2.8, -1.6, 1.4, shade(g, 0.85), K.FURN, 7, A0.PAINT);
  const fl = [[200, 60, 70], [230, 200, 70], [240, 240, 236], [170, 70, 150], [230, 120, 60], [90, 140, 70]];
  for (let r = 0; r < 3; r++) for (let k = 0; k < 7; k++) { const c = fl[Math.floor(hash2(k + r * 7, Math.round(h * 100)) * 5.99)], u = -2.0 + k * 0.6;
    box(B, F, u, u + 0.5, y + 0.3 + r * 0.32, y + 0.62 + r * 0.32, 0.95 + (2 - r) * 0.3, 1.2 + (2 - r) * 0.3, c, K.PLZ_LEAF, 5); }
}
// «Topos» (escultura de acero de la Plaça del Rei): bloque inclinado de acero oscuro con huecos (abstracción)
function topos(B, F, y) {
  const st = [70, 54, 44];
  box(B, F, -1.2, 1.2, y, y + 0.25, -0.5, 0.5, st, K.FURN, 7, A0.CAST);
  box(B, F, -0.9, -0.5, y + 0.25, y + 2.6, -0.45, 0.45, st, K.FURN, 7, A0.CAST); box(B, F, 0.5, 0.9, y + 0.25, y + 2.6, -0.45, 0.45, st, K.FURN, 7, A0.CAST);
  box(B, F, -0.9, 0.9, y + 2.2, y + 2.6, -0.45, 0.45, st, K.FURN, 7, A0.CAST);
}
// piezas que se dibujan desde la lista de objetos (devuelven el alto de la luz si dan luz de noche)
const P2PIECE = {
  palm: (B, F, y, h) => { palm(B, F, y, h); },
  glamp: (B, F, y) => { gaudiLamp(B, F, y); return 6; },
  tgrac: (B, F, y) => { tresGracies(B, F, y); return 2.5; },
  octf: (B, F, y) => { octFont(B, F, y); },
  ovalp: (B, F, y, h, ex) => { ovalPond(B, F, y, ex.rx || 9, ex.rz || 5); return 2.5; },
  colmon: (B, F, y, h, ex) => { colMon(B, F, y, ex.H || 9); },
  terrace: (B, F, y, h) => { terrace(B, F, y, h); },
  bfanal: (B, F, y) => { bancFanal(B, F, y); return 7; },
  flower: (B, F, y, h) => { flowerStall(B, F, y, h); },
  topos: (B, F, y) => { topos(B, F, y); },
  colometa: (B, F, y) => { statue(B, F, y, 0.5, C.bronze, A0.BRONZE); },
  bstat: (B, F, y, h, ex) => { statue(B, F, y, ex.ph || 2.4, ex.stone ? [214, 206, 190] : C.bronze, ex.stone ? A0.STONE : A0.BRONZE); },
};
const P2RAD = { palm: 1.0, glamp: 1.1, tgrac: 5.2, octf: 2.5, ovalp: 0, colmon: 1.7, terrace: 1.5, bfanal: 2.0, flower: 2.4, topos: 1.3, colometa: 0.8, bstat: 1.0 };

// ------------------------------------------------------------------ hitos de P2 (siempre cargados, se ven desde el dron)
// Torre del Rellotge de la Plaça de la Vila de Gràcia (1864, ~33 m): fuste de ladrillo y piedra, reloj en las cuatro caras y campanario
lmLater({ id: 'rellotge_gracia', nombre: 'Torre del Rellotge (Gràcia)', nivel: 'B', x: 11183.5, z: 15530.5, rot: 41, alto: 33, ancho: 5, largo: 5, noche: 'focos', edificios: [127605],   // 127605: la torre como volumen genérico de 9×9 m
  build(B, h, L) {
    const KK = window.BCN_LM.K, ST = [198, 186, 162], BR = [164, 112, 84], WH = [236, 232, 220];
    L.caja(B, 0, 0, -0.5, 5.0, 5.0, 3.5, 0, ST, KK.PIEDRA);
    L.caja(B, 0, 0, 3.0, 4.2, 4.2, 0.5, 0, ST, KK.PIEDRA);
    L.caja(B, 0, 0, 3.5, 3.6, 3.6, 18.5, 0, BR, KK.PIEDRA, { aux: L.aux.piedra(0.5, 1.0) });
    for (const yy of [8.5, 15]) L.caja(B, 0, 0, yy, 3.8, 3.8, 0.35, 0, ST, KK.PIEDRA);
    L.caja(B, 0, 0, 22.0, 4.1, 4.1, 3.6, 0, ST, KK.PIEDRA);                       // cuerpo del reloj
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, c = Math.cos(a), s = Math.sin(a), o = 2.08, w = 1.25;
      const P = (du, y) => [c * o - s * du, y, s * o + c * du];
      L.q4(B, P(-w, 22.6), P(w, 22.6), P(w, 25.1), P(-w, 25.1), WH, KK.LISO);
      L.q4(B, P(-0.05, 23.85), P(0.05, 23.85), P(0.05, 24.85), P(-0.05, 24.85), [30, 30, 30], KK.LISO);
      L.q4(B, P(0, 23.8), P(0.7, 23.95), P(0.7, 24.05), P(0, 23.9), [30, 30, 30], KK.LISO); }
    L.caja(B, 0, 0, 25.6, 4.4, 4.4, 0.4, 0, ST, KK.PIEDRA);
    for (const [x, z] of [[-1.6, -1.6], [1.6, -1.6], [1.6, 1.6], [-1.6, 1.6]]) L.caja(B, x, z, 26.0, 0.6, 0.6, 3.2, 0, ST, KK.PIEDRA);   // campanario abierto
    L.tambor(B, 0, 0, 26.2, 28.4, 0.7, { lados: 10, col: [120, 110, 90], k: KK.METAL });
    L.caja(B, 0, 0, 29.2, 4.2, 4.2, 0.4, 0, ST, KK.PIEDRA);
    L.aguja(B, 0, 0, 29.6, 2.6, 1.9, { lados: 4, col: [92, 96, 100], k: KK.METAL, pot: 1, exp: 1 });
    L.tambor(B, 0, 0, 32.2, 33.4, 0.05, { lados: 4, col: [60, 60, 60], k: KK.METAL });
  } });
// Gat del Raval (Botero, 1987): gato de bronce de 7 m tumbado en la Rambla del Raval
lmLater({ id: 'gat_botero', nombre: 'Gat de Botero', nivel: 'C', x: 12118.8, z: 13145.3, rot: 136, alto: 3, ancho: 2.5, largo: 7, noche: 'focos',
  build(B, h, L) {
    const KK = window.BCN_LM.K, BZ = [66, 56, 46];
    for (const [z, r] of [[-1.7, 0.95], [-0.5, 1.1], [0.8, 1.05]]) L.esfera(B, 0, 1.65, z, r, { col: BZ, k: KK.METAL, sy: 0.82 });
    for (const [x, z] of [[-0.55, -2.0], [0.55, -2.0], [-0.55, 1.3], [0.55, 1.3]]) { L.tambor(B, x, z, 0, 1.2, 0.36, { lados: 8, col: BZ, k: KK.METAL }); L.esfera(B, x, 0.22, z + 0.15, 0.42, { col: BZ, k: KK.METAL, sy: 0.55 }); }
    L.esfera(B, 0, 2.35, 2.25, 0.82, { col: BZ, k: KK.METAL, sy: 0.92 });
    L.esfera(B, 0, 2.05, 2.85, 0.42, { col: BZ, k: KK.METAL, sy: 0.75 });
    for (const x of [-0.45, 0.45]) L.aguja(B, x, 2.25, 2.9, 0.6, 0.3, { lados: 4, col: BZ, k: KK.METAL, pot: 1, exp: 1 });
    const T = [[0, 1.8, -2.5], [0, 1.6, -3.3], [0.2, 1.9, -3.9], [0.5, 2.6, -4.1], [0.55, 3.0, -3.8]];
    for (let k = 0; k + 1 < T.length; k++) L.bar(B, T[k], T[k + 1], 0.22, BZ, KK.METAL);
  } });
// Monument al Doctor Robert (Plaça de Tetuan; Domènech i Montaner y Llimona, 1910): basamento de piedra escalonado, gran
// cuerpo piramidal con grupos de figuras de bronce a los lados y el busto arriba
lmLater({ id: 'mon_dr_robert', nombre: 'Monument al Doctor Robert', nivel: 'B', x: 12678, z: 14925, rot: 44, alto: 14, ancho: 12, largo: 9, noche: 'focos',
  build(B, h, L) {
    const KK = window.BCN_LM.K, ST = [188, 180, 164], STD = [150, 144, 132], BZ = [80, 70, 54];
    L.caja(B, 0, 0, -0.5, 13.5, 10, 1.0, 0, STD, KK.PIEDRA);
    L.caja(B, 0, 0, 0.5, 11.5, 8.2, 0.7, 0, ST, KK.PIEDRA);
    L.prisma(B, [[-4.8, -3.2], [4.8, -3.2], [3.4, 3.2], [-3.4, 3.2]], 1.2, 4.2, ST, KK.PIEDRA);
    L.prisma(B, [[-3.0, -2.2], [3.0, -2.2], [1.8, 2.2], [-1.8, 2.2]], 4.2, 9.8, ST, KK.PIEDRA);
    L.prisma(B, [[-1.3, -1.1], [1.3, -1.1], [1.0, 1.1], [-1.0, 1.1]], 9.8, 11.6, STD, KK.PIEDRA);
    L.esfera(B, 0, 12.4, 0, 0.75, { col: BZ, k: KK.METAL, sy: 1.25 });
    for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) L.esfera(B, sd * (3.6 - k * 0.5), 2.0 + k * 1.3, -2.4 + k * 0.5, 0.6 - k * 0.06, { col: BZ, k: KK.METAL, sy: 1.6 });
    for (let k = 0; k < 5; k++) L.esfera(B, -2.4 + k * 1.2, 2.2, -3.6, 0.55, { col: BZ, k: KK.METAL, sy: 1.7 });
  } });

// ------------------------------------------------------------------ plazas singulares de P2 (disposición propia; u, v en el eje de la plaza)
// Ayudantes de colocación (dentro de objs): filas de árboles, árboles de borde, terrazas, farolas de borde, bancos en corro
const P2H = {
  rows(S, vf, du, f) { const { P } = S; for (const fv of vf) for (let u = -P.hu + du * 0.6; u <= P.hu - du * 0.5; u += du) f(u, fv * P.hv); },
  edge(S, e0, e1, sp, ph, f) { S.grid(sp, ph, (u, v, x, z, e, zz) => { if (e > e0 && e < e1) f(u, v, x, z, e); }); },
  terraces(S, p, e0, e1) { P2H.edge(S, e0 || 2.4, e1 || 5.5, 3.6, 1.1, (u, v, x, z) => hash2(Math.round(x * 3), Math.round(z * 3)) < p && S.put('terrace', u, v, 0)); },
  edgeLamps(S, sp, H) { P2H.edge(S, 1.4, 3.6, sp, sp * 0.5, (u, v) => S.put('lamp', u, v, 0, { H: H || 4.5 })); },
  ring(S, t, cx, cv, r, n, a0, ex) { for (let k = 0; k < n; k++) { const a = (a0 || 0) + k / n * 2 * Math.PI; S.put(t, cx + Math.cos(a) * r, cv + Math.sin(a) * r, a + Math.PI, ex); } },
};
const GR = (w) => [1, C.granite, w === undefined ? 0.3 : w], GRL = (w) => [1, C.graniteL, w === undefined ? 0.2 : w], SETT = [8, [150, 140, 128], 0.35];
const sp2 = (key, near, o) => SING.push(Object.assign({ key, near, ax: o.ax, center: o.center, disc: o.disc,
  zone(u, v, x, z, e, P) { const r = o.zone ? o.zone(u, v, x, z, e, P) : null; if (r) return r; return e < (o.edge || 2.0) ? (o.edgePav || GR()) : o.pav; },
  objs(S) { if (o.objs) o.objs(S); } }, o.extra || {}));
// Plaça Reial: losas claras, la fuente de las Tres Gracias en el centro, las dos farolas de Gaudí a los lados en el eje largo,
// palmeras en cuatro hileras, terrazas delante de los soportales y algún banco
sp2('Plaça Reial', [12638, 13283], { pav: [1, [176, 170, 158], 0.25], edge: 3.0, edgePav: [1, [160, 154, 144], 0.35],
  objs(S) { const { P } = S; S.putW('tgrac', 12638.6, 13282.7, 0);
    for (const s of [-1, 1]) S.put('glamp', s * 15, 0, 0);
    P2H.rows(S, [-0.62, -0.22, 0.22, 0.62], 10.5, (u, v) => Math.abs(u) > 9 && S.put('palm', u, v, 0));
    P2H.terraces(S, 0.55, 3.0, 7.5);
    for (const s of [-1, 1]) for (const du of [-5, 5]) S.put('bench', s * 22 + du, s * 1.5, s > 0 ? Math.PI : 0); } });
// Plaça de Sant Jaume: plaza dura de losa de granito, despejada, con farolas en los bordes
sp2('Plaça de Sant Jaume', [12787, 13568], { pav: [1, [168, 162, 152], 0.3],
  zone(u, v) { return Math.abs(v) < 0.6 || Math.abs(u) < 0.6 ? [6, C.graniteD, 0.2] : null; },
  objs(S) { P2H.edgeLamps(S, 18, 5); } });
// Plaça del Rei: llambordes, la escultura de acero (Topos) y nada más
sp2('Plaça del Rei', [12821, 13731], { pav: SETT, edge: 1.5,
  objs(S) { const { P } = S; S.put('topos', -P.hu * 0.45, P.hv * 0.35, 0.3); } });
// Sant Felip Neri: losa gastada, fuente octogonal en el centro y cuatro acacias
sp2('Plaça de Sant Felip Neri', [12625, 13645], { pav: [1, [150, 144, 134], 0.55],
  objs(S) { S.put('octf', 0, 0, 0); for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) S.put('tree', a * 6.5, b * 4.5, 0, { sp: 'lledoner', alc: true });
    S.put('bench', 0, -6.5, Math.PI / 2); S.put('bench', 0, 6.5, -Math.PI / 2); } });
// Plaça del Pi y Sant Josep Oriol: losa, el pino de la Plaça del Pi, plátanos en Sant Josep Oriol y terrazas
sp2('Plaça del Pi', [12506, 13541], { pav: [1, [160, 152, 140], 0.4],
  objs(S) { S.put('tree', 0, 0, 0, { sp: 'pi', alc: true }); P2H.terraces(S, 0.35, 3.5, 6.5); } });
sp2('Plaça de Sant Josep Oriol', [12546, 13533], { pav: [1, [160, 152, 140], 0.4],
  objs(S) { const { P } = S; P2H.rows(S, [0.0], 11, (u, v) => S.put('tree', u, v, 0, { sp: 'platan', alc: true })); P2H.terraces(S, 0.5, 2.5, 7); S.put('canaletes', P.hu * 0.6, 0, 0); } });
sp2('Placeta del Pi', [12562, 13477], { pav: [1, [160, 152, 140], 0.4], objs(S) { S.put('tree', 0, 0, 0, { sp: 'platan', alc: true }); P2H.terraces(S, 0.4); } });
// Gràcia: Vila de Gràcia (Torre del Rellotge: hito), del Sol, del Diamant (la Colometa), de la Virreina, de la Revolució
sp2('Plaça de la Vila de Gràcia', [11183, 15530], { pav: [1, [170, 160, 146], 0.3],
  zone(u, v, x, z) { return Math.hypot(x - 11183.5, z - 15530.5) < 5 ? [1, C.graniteD, 0.2] : null; },
  objs(S) { P2H.terraces(S, 0.5, 2.5, 6); P2H.edge(S, 6, 9, 9, 2, (u, v) => S.put('tree', u, v, 0, { sp: 'lledoner', alc: true })); P2H.ring(S, 'bench', 0, 0, 7.5, 4, Math.PI / 4); } });
sp2('Plaça del Sol', [11109, 15688], { pav: [1, [156, 150, 142], 0.45],
  objs(S) { const { P } = S; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) for (const k of [0, 1]) S.put('tree', a * (P.hu - 4 - k * 6), b * (P.hv - 4), 0, { sp: 'platan', alc: true });
    P2H.terraces(S, 0.55, 2.5, 6); S.put('canaletes', 0, P.hv * 0.4, 0); P2H.edgeLamps(S, 16, 5); } });
sp2('Plaça del Diamant', [11040, 15960], { pav: [1, [158, 150, 140], 0.4],
  objs(S) { const { P } = S; S.putW('colometa', 11025.5, 15964.2, 0.6); S.put('kiosk', P.hu * 0.55, -P.hv * 0.45, 0);
    P2H.edge(S, 3, 7, 8, 3, (u, v) => S.put('tree', u, v, 0, { sp: 'lledoner', alc: true })); P2H.terraces(S, 0.3, 2.5, 5); S.put('bench', -P.hu * 0.3, 0, 0); } });
sp2('Plaça de la Virreina', [11157, 16056], { pav: [2, C.panot, 0.35],
  objs(S) { const { P } = S; S.put('octf', 0, 0, 0); P2H.edge(S, 2.5, 6, 8, 2, (u, v) => S.put('tree', u, v, 0, { sp: 'platan', alc: true })); P2H.ring(S, 'bench', 0, 0, 6, 6); P2H.terraces(S, 0.3); } });
sp2('Plaça de la Revolució de Setembre de 1868', [11230, 15802], { pav: [1, [162, 154, 142], 0.4],
  objs(S) { P2H.rows(S, [-0.7, 0.7], 9, (u, v) => S.put('tree', u, v, 0, { sp: 'platan', alc: true })); P2H.rows(S, [-0.45, 0.45], 9, (u, v) => S.put('sbench', u + 4.5, v, 0, { len: 2.4, wood: true }));
    S.put('canaletes', 0, 0, 0); P2H.terraces(S, 0.3, 2.5, 4.5); S.put('play', S.P.hu * 0.55, 0, 0); } });
// Eixample: Universitat y Urquinaona (con sus jardines), Tetuan (jardín de la rotonda con el monumento: hito), Francesc Macià
sp2('Plaça de la Universitat', [11697, 13910], { pav: [1, C.granite, 0.35],
  objs(S) { P2H.edge(S, 3, 9, 9, 2, (u, v, x, z) => hash2(Math.round(x), Math.round(z)) < 0.6 && S.put('tree', u, v, 0, { sp: 'platan', alc: true })); P2H.edgeLamps(S, 18, 8); S.put('kiosk', 0, 0, 0); S.put('bikes', 10, 4, 0, { n: 8 }); } });
sp2("Plaça d'Urquinaona", [12455, 14289], { pav: [3, C.saulo, 0.3],
  zone(u, v, x, z, e) { return e > 6 && Math.abs(v) > 4 && Math.abs(u) > 4 ? [5, C.grass, 0] : e > 5.4 && (Math.abs(v) > 3.4 && Math.abs(u) > 3.4) ? [6, C.curb, 0.2] : null; },
  objs(S) { S.put('bstat', 0, 0, 0, { ph: 3.0, stone: true }); S.grid(8, 3, (u, v, x, z, e, zz) => zz && zz[0] === 5 && e > 7 && S.put('tree', u, v, 0, { sp: hash2(Math.round(u), Math.round(v)) < 0.5 ? 'platan' : 'pi' }));
    P2H.ring(S, 'bench', 0, 0, 6, 6); } });
sp2('Plaça de Tetuan', [12680, 14930], { center: [12678, 14925], disc: 46, ax: 44, pav: [5, C.grass, 0],
  zone(u, v, x, z, e) { const r = Math.hypot(u, v); if (r < 11.5) return [1, C.granite, 0.25]; if (r < 12.2 || e < 2.2) return [6, C.curb, 0.2];
    const a = Math.atan2(v, u) / Math.PI * 2; return Math.abs(a - Math.round(a)) < 2.2 / r ? [3, C.saulo, 0.25] : r < 15 ? [5, [120, 96, 70], 0] : null; },
  objs(S) { S.grid(9, 1, (u, v, x, z, e, zz) => zz && zz[0] === 5 && Math.hypot(u, v) > 19 && e > 4 && hash2(Math.round(x), Math.round(z)) < 0.55 && S.put('tree', u, v, 0, { sp: hash2(Math.round(z), 3) < 0.6 ? 'platan' : 'pi' }));
    for (let k = 0; k < 4; k++) { const a = (k + 0.5) * Math.PI / 2; S.put('lampC', Math.cos(a) * 13.5, Math.sin(a) * 13.5, a); S.put('bench', Math.cos(a + 0.35) * 13.6, Math.sin(a + 0.35) * 13.6, a + Math.PI); } } });
sp2('Plaça de Francesc Macià', [10079, 14707], { pav: [5, C.grass, 0],
  zone(u, v, x, z, e) { const q = (u / 19) ** 2 + (v / 12) ** 2; if (q < 1) return [1, C.graniteL, 0.15]; if (q < 1.12) return [6, C.curb, 0.2]; return e < 2 ? [1, C.granite, 0.3] : (Math.abs(v) < 1.6 ? [1, C.granite, 0.25] : null); },
  objs(S) { S.put('ovalp', 0, 0, 0, { rx: 13, rz: 7.5 }); S.grid(7, 2, (u, v, x, z, e, zz) => zz && zz[0] === 5 && e > 3.5 && (u / 19) ** 2 + (v / 12) ** 2 > 1.6 && hash2(Math.round(x), Math.round(z)) < 0.4 && S.put('tree', u, v, 0, { sp: 'xiprer' }));
    for (let k = 0; k < 10; k++) { const a = k / 10 * 2 * Math.PI; S.put('lampC', Math.cos(a) * 17.5, Math.sin(a) * 11.5, a); } } });
// Sant Gervasi y Sarrià: Molina, Sant Vicenç de Sarrià (columna con el santo), Sarrià
sp2('Plaça de Molina', [10307, 15605], { pav: [1, C.granite, 0.3], objs(S) { P2H.rows(S, [-0.5, 0.5], 8, (u, v) => S.put('tree', u, v, 0, { sp: 'tipuana', alc: true })); P2H.rows(S, [0], 12, (u, v) => S.put('sbench', u, v, 0, { len: 3, wood: true })); P2H.edgeLamps(S, 16, 5); } });
sp2('Plaça de Sant Vicenç de Sarrià', [8385, 15240], { pav: [1, [170, 162, 150], 0.2], objs(S) { S.put('colmon', 0, 0, 0, { H: 7 }); P2H.ring(S, 'bench', 0, 0, 4.5, 4, Math.PI / 4); P2H.edge(S, 2, 5, 7, 2, (u, v) => S.put('tree', u, v, 0, { sp: 'platan', alc: true })); } });
sp2('Plaça de Sarrià', [8181, 15521], { pav: [1, [170, 162, 150], 0.2], objs(S) { P2H.edge(S, 2.5, 7, 8, 2, (u, v) => S.put('tree', u, v, 0, { sp: 'platan', alc: true })); S.put('canaletes', 0, 0, 0); P2H.terraces(S, 0.25); P2H.edgeLamps(S, 16, 5); } });
// Sants y Les Corts: Sants (monumento), la Concòrdia (plátanos sobre sauló)
sp2('Plaça de Sants', [9292, 12845], { pav: [1, C.granite, 0.4], objs(S) { S.put('bstat', 0, 0, 0, { ph: 3.4 }); P2H.edge(S, 3, 10, 9, 3, (u, v, x, z) => hash2(Math.round(x), Math.round(z)) < 0.55 && S.put('tree', u, v, 0, { sp: 'platan', alc: true })); P2H.edgeLamps(S, 18, 8); S.put('kiosk', S.P.hu * 0.4, S.P.hv * 0.3, 0); } });
sp2('Plaça de la Concòrdia', [9046, 14052], { pav: [3, C.saulo, 0.3], objs(S) { S.grid(8, 3, (u, v, x, z, e) => e > 3 && S.put('tree', u, v, 0, { sp: 'platan' })); S.put('canaletes', 0, 0, 0); P2H.ring(S, 'bench', 0, 0, 5, 5); P2H.edgeLamps(S, 15, 4.5); } });
// Poble-sec y Raval: el Sortidor, els Àngels (MACBA: granito claro despejado), la Rambla del Raval (palmeras y el gato: hito)
sp2('Plaça del Sortidor', [11552, 12433], { pav: [2, C.panot, 0.4], objs(S) { S.put('octf', 0, 0, 0); S.grid(8, 2, (u, v, x, z, e) => e > 3 && Math.hypot(u, v) > 5 && hash2(Math.round(x), Math.round(z)) < 0.7 && S.put('tree', u, v, 0, { sp: 'platan', alc: true })); S.put('play', S.P.hu * 0.5, 0, 0); P2H.ring(S, 'bench', 0, 0, 4.5, 5); } });
sp2('Plaça dels Àngels', [11960, 13589], { pav: [1, C.graniteL, 0.25], objs(S) { P2H.edgeLamps(S, 20, 8); S.put('canaletes', 0, 0, 0); } });
sp2('Rambla del Raval', [12100, 13160], { pav: [1, [158, 152, 142], 0.35],
  zone(u, v, x, z, e, P) { return Math.abs(v) > P.hv * 0.45 && Math.abs(v) < P.hv * 0.62 && e > 3 ? [3, C.saulo, 0.3] : null; },
  objs(S) { const { P } = S; P2H.rows(S, [-0.53, 0.53], 8, (u, v) => S.put('palm', u, v, 0)); P2H.rows(S, [-0.3, 0.3], 24, (u, v) => S.put('lamp', u, v, 0, { H: 8 }));
    P2H.rows(S, [-0.4, 0.4], 12, (u, v) => S.put('bench', u + 6, v, v > 0 ? -Math.PI / 2 : Math.PI / 2)); S.put('play', P.hu * 0.6, 0, 0); S.put('pingpong', -P.hu * 0.55, 0, 0.1); S.put('canaletes', P.hu * 0.25, 0, 0); } });
// Barri Gòtic: Pla de la Seu y Avinguda de la Catedral (losa grande, despejada, hileras de árboles junto a la muralla),
// Plaça Nova, la Mercè (fuente de Neptuno), Duc de Medinaceli (palmeras y la columna de Galceran Marquet), George Orwell
sp2('Avinguda de la Catedral', [12697, 13783], { pav: [1, [170, 162, 148], 0.35],
  objs(S) { P2H.edge(S, 2.5, 6, 10, 3, (u, v, x, z) => hash2(Math.round(x), Math.round(z)) < 0.5 && S.put('tree', u, v, 0, { sp: 'platan', alc: true })); P2H.edgeLamps(S, 20, 6); S.put('canaletes', 0, 0, 0); P2H.terraces(S, 0.15, 3, 6); } });
sp2('Plaça Nova', [12627, 13739], { pav: [1, [170, 162, 148], 0.35], objs(S) { P2H.edgeLamps(S, 18, 5); } });
sp2('Plaça de la Mercè', [12983, 13181], { pav: [1, C.granite, 0.35], objs(S) { S.put('tgrac', 0, 0, 0); P2H.edge(S, 2.5, 6, 9, 2, (u, v) => S.put('tree', u, v, 0, { sp: 'platan', alc: true })); P2H.ring(S, 'bench', 0, 0, 7.5, 6); } });
sp2('Plaça del Duc de Medinaceli', [12941, 13096], { pav: [1, C.granite, 0.35], objs(S) { S.put('colmon', 0, 0, 0, { H: 16 }); S.grid(9, 3, (u, v, x, z, e) => e > 3 && Math.hypot(u, v) > 6 && S.put('palm', u, v, 0)); P2H.ring(S, 'bench', 0, 0, 5, 4); P2H.edgeLamps(S, 18, 5); } });
sp2('Plaça de George Orwell', [12815, 13329], { pav: [1, C.granite, 0.5], objs(S) { S.put('topos', 0, 0, 0.8); P2H.edge(S, 2.5, 6, 8, 2, (u, v) => S.put('tree', u, v, 0, { sp: 'lledoner', alc: true })); P2H.terraces(S, 0.3); } });

// ------------------------------------------------------------------ paseos y ramblas: equipamiento de los andenes centrales y laterales
// El suelo lo hace SUELOS. Aquí, por teselas de 160 m a lo largo de las avenidas anchas y de los paseos con nombre (data/plazas_p2.json):
// desde cada calzada se explora en perpendicular hasta dar con la siguiente calzada paralela (andén central o lateral) o con un
// edificio (acera). En los andenes: farolas de paseo, bancos, papeleras, quioscos y fuentes; en La Rambla, quioscos y paradas
// de flores; en las aceras anchas del Passeig de Gràcia, los bancos-farola. Los puntos van a medio camino entre los árboles de
// streets.js (a lo largo, cada 10,5 m con la misma fase), para no chocar con ellos.
const TS = 160, CARS = new Set([2, 3, 4, 5, 6, 8, 10, 11]);
function makePaseos(ctx, PL, P2) {
  const SEG = ctx.SEG, { nearestCar, coverAt } = ctx.city, out = [], tiles = new Map(), NS = SEG.length / 6;
  const key = (x, z) => Math.floor(x / TS) * 100000 + Math.floor(z / TS);
  const tileOf = k => { let t = tiles.get(k); if (!t) { t = { segs: new Set(), wide: false, names: [] }; tiles.set(k, t); } return t; };
  for (let s = 0; s < NS; s++) { const o = s * 6, cls = SEG[o + 5], hw = SEG[o + 4]; if (!CARS.has(cls) || hw < 2.5) continue;
    const ax = SEG[o], az = SEG[o + 1], L = Math.hypot(SEG[o + 2] - ax, SEG[o + 3] - az), n = Math.max(1, Math.ceil(L / 40));
    for (let k = 0; k <= n; k++) { const t = tileOf(key(ax + (SEG[o + 2] - ax) * k / n, az + (SEG[o + 3] - az) * k / n)); t.segs.add(s); if (hw >= 5.5) t.wide = true; } }
  const named = [];
  for (const nm in (P2.paseos || {})) for (const l of P2.paseos[nm]) for (let i = 0; i + 1 < l.length; i++) { const a = l[i], b = l[i + 1]; named.push([nm, a[0], a[1], b[0], b[1]]);
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 40)); for (let k = 0; k <= n; k++) { const t = tiles.get(key(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n)); if (t) t.named = true; } }
  // plazas por tesela (para no equipar dos veces lo que ya es plaza)
  const pz = new Map(); for (const p of PL) for (let gx = Math.floor(p.bb[0] / TS); gx <= Math.floor(p.bb[2] / TS); gx++) for (let gz = Math.floor(p.bb[1] / TS); gz <= Math.floor(p.bb[3] / TS); gz++) { const k = gx * 100000 + gz; if (!pz.has(k)) pz.set(k, []); pz.get(k).push(p); }
  const inPlaza = (x, z) => { const l = pz.get(key(x, z)); if (l) for (const p of l) if (x >= p.bb[0] && x <= p.bb[2] && z >= p.bb[1] && z <= p.bb[3] && inPoly(p.r, x, z)) return true; return false; };
  const nameAt = (x, z, R) => { let best = null, bd = R; for (const [nm, ax, az, bx, bz] of named) { if (Math.abs(ax - x) > 400 && Math.abs(bx - x) > 400) continue; const d = segD(x, z, [ax, az], [bx, bz]); if (d < bd) { bd = d; best = nm; } } return best; };
  // exploración en perpendicular: primer tramo libre (ni calzada ni edificio) y qué lo cierra
  function scan(s, bx, bz, nx, nz, hw, tx, tz) {
    let d0 = -1;
    for (let d = hw + 0.4; d < hw + 60; d += 0.5) { const x = bx + nx * d, z = bz + nz * d, nc = nearestCar(x, z), car = nc[0] >= 0 && nc[1] < 0.3, bld = coverAt(x, z, -1) > -1e8;
      if (d0 < 0) { if (!car && !bld) d0 = d; else if (d > hw + 3) return null; continue; }
      if (car) { const o = nc[0] * 6, ex = SEG[o + 2] - SEG[o], ez = SEG[o + 3] - SEG[o + 1], l = Math.hypot(ex, ez) || 1; if (Math.abs(ex * tx + ez * tz) / l < 0.85) return null; return [d0, d, 1]; }
      if (bld) return [d0, d, 2]; }
    return null;
  }
  const PASEO = { key: '(paseo)', noPav: true, zone: () => null,
    *objs(S) { const T = S.P; let cnt = 0;
      for (const s of T.segs) { const o = s * 6, hw = SEG[o + 4]; if (!T.named && hw < 4.5) continue;
        const ax = SEG[o], az = SEG[o + 1], dx = SEG[o + 2] - ax, dz = SEG[o + 3] - az, L = Math.hypot(dx, dz); if (L < 4) continue;
        const tx = dx / L, tz = dz / L, px = -tz, pz = tx, g0 = ax * tx + az * tz;
        for (let k = Math.ceil((g0 - 5.25) / 10.5); ; k++) { const u = k * 10.5 + 5.25 - g0; if (u > L) break; if (u < 0) continue;
          const bx = ax + tx * u, bz = az + tz * u; if (bx < T.bb[0] - 30 || bx > T.bb[2] + 30 || bz < T.bb[1] - 30 || bz > T.bb[3] + 30) continue;
          if (++cnt % 12 === 0) yield;
          for (const side of [-1, 1]) { const nx = px * side, nz = pz * side, st = scan(s, bx, bz, nx, nz, hw, tx, tz); if (!st) continue;
            const [d0, d1, end] = st, w = d1 - d0, m = (d0 + d1) / 2, mx = bx + nx * m, mz = bz + nz * m;
            if (inPlaza(mx, mz)) continue;
            const at = (off, t, a, ex) => S.putW(t, bx + nx * off, bz + nz * off, a, ex), along = Math.atan2(tz, tx), kk = ((k % 840) + 840) % 840;
            if (end === 2) {                                              // acera: solo los bancos-farola del Passeig de Gràcia
              if (w >= 5 && kk % 4 === 0 && nameAt(mx, mz, 45) === 'Passeig de Gràcia') at(d0 + 2.0, 'bfanal', Math.atan2(nz, nx));
              continue; }
            if (w < 3.5 || w > 45) continue;
            const nm = nameAt(mx, mz, Math.max(25, w)), ram = nm === 'La Rambla';
            const zig = (kk >> 1) % 2 ? 1 : -1, sideOff = w >= 9 ? zig * (w / 2 - 2.0) : 0;
            if (ram) {                                                   // La Rambla: farolas, quioscos y paradas de flores alternos, papeleras
              if (kk % 2 === 0) at(m + sideOff * 0.6, 'lamp', 0, { H: 9 });
              else if (kk % 6 === 1) at(m, kk % 12 === 1 ? 'flower' : 'kiosk', along + (zig > 0 ? 0 : Math.PI));
              else if (kk % 6 === 3) at(m + zig * Math.min(3, w / 2 - 1.5), 'bin', along);
              else if (kk % 30 === 5) at(m, 'canaletes', 0);
              continue; }
            if (kk % 3 === 0) at(m + sideOff, 'lamp', 0, { H: w >= 9 ? 8 : 6.5 });
            else if (kk % 3 === 1 && w >= 4.5) { if (w >= 9) { for (const sd of [-1, 1]) at(m + sd * (w / 2 - 2.6), 'bench', Math.atan2(-nz * sd, -nx * sd)); } else at(m, 'bench', Math.atan2(nz, nx) + (zig > 0 ? 0 : Math.PI)); }
            else if (kk % 6 === 2) at(m + (w >= 9 ? -sideOff : 0), 'bin', along);
            else if (kk % 17 === 8 && w >= 10) at(m, 'kiosk', along);
            else if (kk % 23 === 11 && w >= 7) at(m, 'canaletes', 0);
          } } } } };
  for (const [k, t] of tiles) { if (!t.wide && !t.named) continue;
    const gx = Math.floor(k / 100000), gz = k - gx * 100000, x0 = gx * TS, z0 = gz * TS;
    out.push({ n: 'paseo ' + gx + '_' + gz, t: 'paseo', a: 0, cat: [], tile: true, noPav: true, named: !!t.named, segs: [...t.segs], sg: PASEO, rb: [380, 460],
      r: [[x0, z0], [x0 + TS, z0], [x0 + TS, z0 + TS], [x0, z0 + TS]], c: [x0 + TS / 2, z0 + TS / 2], ang: 0 }); }
  return out;
}
// plazas que no estaban en el inventario de P1 (Avinguda de la Catedral con el Pla de la Seu, Rambla del Raval): contorno de OSM
function extraPlazas(P2) {
  const out = [], add = (n, r) => { if (!r || r.length < 4) return; let A = 0, cx = 0, cz = 0;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const f = r[j][0] * r[i][1] - r[i][0] * r[j][1]; A += f; cx += (r[j][0] + r[i][0]) * f; cz += (r[j][1] + r[i][1]) * f; }
    A /= 2; const c = [cx / (6 * A), cz / (6 * A)]; let sxx = 0, szz = 0, sxz = 0; for (const [x, z] of r) { sxx += (x - c[0]) ** 2; szz += (z - c[1]) ** 2; sxz += (x - c[0]) * (z - c[1]); }
    const a = Math.abs(A); out.push({ n, t: a > 9000 ? 'gran' : a > 2500 ? 'mitjana' : a > 800 ? 'petita' : 'placeta', a: Math.round(a), cat: ['highway:pedestrian'], r, c, ang: 0.5 * Math.atan2(2 * sxz, sxx - szz) / D2R }); };
  const pg = P2.poligonos || {}; for (const n of ['Avinguda de la Catedral']) if (pg[n]) add(n, pg[n][0]);
  const rr = ((P2.paseos || {})['Rambla del Raval'] || []).filter(l => l.length > 4 && Math.hypot(l[0][0] - l[l.length - 1][0], l[0][1] - l[l.length - 1][1]) < 1);
  if (rr.length) add('Rambla del Raval', rr.sort((a, b) => b.length - a.length)[0]);
  return out;
}

// ------------------------------------------------------------------ módulo
window.BCN_PLAZAS = { async init(ctx) {
  const { reg, heightAt } = ctx, city = ctx.city, FUR = window.BCN_FURNITURE && window.BCN_FURNITURE.parts;
  if (!city || !ctx.detail) throw new Error('las plazas necesitan las fachadas de detalle (ctx.city)');
  const { walkAt, coverAt, nearestCar } = city, matB = ctx.detail.matB, mkMesh = ctx.detail.mkMesh;
  const [AS, AH] = FUR ? FUR.levels : [null, null];
  const matP = ctx.mkMat('plazaPav', VS_PAV, FS_PAV, ['position', 'color', 'uv'], ['uPavFade', 'uRose']);
  matP.setVector2('uPavFade', new BABYLON.Vector2(560, 640)); matP.setVector2('uRose', new BABYLON.Vector2(CAT.c[0], CAT.c[1]));
  // ---- árboles de plaza con las especies de trees.js: las mismas mallas y materiales que streets.js (por nombre), con instancias propias
  const TRS = window.BCN_TREES, TM = {};
  function treeMeshes(k) {
    if (TM[k] !== undefined) return TM[k];
    const sc = ctx.scene, mat = n => sc.getMaterialByName(n + k);
    if (!TRS || !mat('barkN') || !mat('leafF') || !mat('imp')) return (TM[k] = null);
    const G = TRS.build(k), mk = (name, g, m, alpha) => { const me = new BABYLON.Mesh(name + k + 'p', sc);
      me.setVerticesData('position', g.P, false); me.setVerticesData('normal', g.N, false); me.setVerticesData('uv', g.U, false); me.setIndices(g.I);
      me.material = m; me.isPickable = false; me.renderingGroupId = 1; me.alwaysSelectAsActiveMesh = true; me.doNotSyncBoundingInfo = true;
      me.thinInstanceSetBuffer('matrix', new Float32Array(16), 16, false); me.thinInstanceCount = 0;
      const o = { cast: name !== 'tI', layer: name === 'tI' ? 'imp' : 'tree' }; if (alpha && m._textures && m._textures.tMap) o.alphaTex = m._textures.tMap; reg(me, o); return me; };
    const band = m => { const v = m._vectors4 && m._vectors4.uBand; return v ? [v.x, v.y, v.z, v.w] : null; };
    TM[k] = { lv: [[mk('tNB', G.nearBark, mat('barkN')), mk('tNL', G.nearLeaf, mat('leafN'), 1)], [mk('tFB', G.farBark, mat('barkF')), mk('tFL', G.farLeaf, mat('leafF'), 1)], [mk('tI', G.imp, mat('imp'), 1)]],
      bands: [band(mat('barkN')) || [-2, -1, 55, 70], band(mat('barkF')) || [55, 70, 430, 520], band(mat('imp')) || [430, 520, 1900, 2100]],
      tri: [(G.nearBark.I.length + G.nearLeaf.I.length) / 3, (G.farBark.I.length + G.farLeaf.I.length) / 3, G.imp.I.length / 3] };
    return TM[k];
  }
  let treeDirty = true, tCam = null, nTreeLv = [0, 0, 0], treeTris = 0;
  function treeInst(P) {
    const sel = {};
    for (const o of PL) { const s = o.st; if (!s || !s.trees) continue; const T = s.trees;
      for (let k = 0; k < T.k.length; k++) { const e = T.k[k], M = TM[e], x = T.m[k * 16 + 12], y = T.m[k * 16 + 13], z = T.m[k * 16 + 14], d = Math.hypot(x - P.x, y + 6 - P.y, z - P.z);
        const L = sel[e] || (sel[e] = [[], [], []]);
        for (let g = 0; g < 3; g++) { const b = M.bands[g]; if (d > b[0] - 2 && d < b[3] + 2) L[g].push(T.m, k * 16); } } }
    nTreeLv = [0, 0, 0]; treeTris = 0;
    for (const e in TM) { const M = TM[e]; if (!M) continue; const L = sel[e] || [[], [], []];
      for (let g = 0; g < 3; g++) { const n = L[g].length / 2, b = new Float32Array(Math.max(16, n * 16));
        for (let q = 0; q < L[g].length; q += 2) b.set(L[g][q].subarray(L[g][q + 1], L[g][q + 1] + 16), q * 8);
        for (const me of M.lv[g]) { me.thinInstanceSetBuffer('matrix', b, 16, false); me.thinInstanceCount = n; } nTreeLv[g] += n; treeTris += n * M.tri[g]; } }
  }
  const data = await fetch('data/plazas.json').then(r => r.json());
  let P2 = {}; try { P2 = await fetch('data/plazas_p2.json').then(r => r.json()); } catch (e) { console.warn('Plazas: sin data/plazas_p2.json', e); }
  const nP1 = data.plazas.length; data.plazas.push(...extraPlazas(P2));
  const PL = data.plazas.map((p, i) => {
    const sg = SING.find(s => s.key === p.n && (!s.near || Math.hypot(p.c[0] - s.near[0], p.c[1] - s.near[1]) < 300)) || null, o = { i, n: p.n, t: p.t, a: p.a, cat: p.cat, r: p.r, c: p.c, ang: (sg && sg.ax !== undefined ? sg.ax : p.ang) * D2R, sg, id: sid(p.n) };
    if (sg && sg.disc) { o.c = sg.center; o.r = []; for (let k = 0; k < 40; k++) o.r.push([sg.center[0] + sg.disc * Math.cos(k / 40 * 2 * Math.PI), sg.center[1] + sg.disc * Math.sin(k / 40 * 2 * Math.PI)]); }
    let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const [x, z] of o.r) { x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); }
    o.bb = [x0, z0, x1, z1];
    const cu = Math.cos(o.ang), su = Math.sin(o.ang); let hu = 0, hv = 0;
    for (const [x, z] of o.r) { const dx = x - o.c[0], dz = z - o.c[1]; hu = Math.max(hu, Math.abs(dx * cu + dz * su)); hv = Math.max(hv, Math.abs(-dx * su + dz * cu)); }
    o.hu = hu; o.hv = hv; o.cu = cu; o.su = su; o.st = null; if (p.tile) Object.assign(o, { tile: true, noPav: true, named: p.named, segs: p.segs, rb: p.rb }); return o; });
  // las añadidas en P2 no pisan las de P1 que se solapan con ellas (Plaça Nova y Pla de la Seu dentro de la Avinguda de la Catedral)
  for (const o of PL.slice(nP1)) o.excl = PL.slice(0, nP1).filter(q => q.bb[0] < o.bb[2] && q.bb[2] > o.bb[0] && q.bb[1] < o.bb[3] && q.bb[3] > o.bb[1]);
  // paseos y ramblas: teselas con su propio relevo (se añaden al final de PL)
  for (const p of makePaseos(ctx, PL, P2)) { const o = { i: PL.length, n: p.n, t: p.t, a: 0, cat: [], r: p.r, c: p.c, ang: 0, sg: p.sg, id: sid(p.n), tile: true, noPav: true, named: p.named, segs: p.segs, rb: p.rb,
    bb: [p.r[0][0], p.r[0][1], p.r[2][0], p.r[2][1]], hu: TS / 2, hv: TS / 2, cu: 1, su: 0, st: null }; PL.push(o); }
  // INT3: ¿hay pavimento de plaza (plataforma) en (x, z)? Lo consulta transporte.js para no poner bocas de metro debajo de la
  // plataforma (la tapa del hueco queda bajo el pavimento levantado y la boca se ve enterrada: Plaça de Catalunya)
  window.BCN_PLAZAS.pavAt = (x, z) => { for (const o of PL) { if (o.tile || o.noPav || x < o.bb[0] || x > o.bb[2] || z < o.bb[1] || z > o.bb[3] || !inPoly(o.r, x, z)) continue;
      if (o.excl && o.excl.some(q => inPoly(q.r, x, z))) continue; return true; } return false; };
  const R_SIMPLE = [600, 680], R_HI = [90, 115], R_OBJ = 300;
  let trisOn = 0;
  let tris = 0, trisHi = 0, built = 0, queue = [], job = null;
  const bbDist = (o, P) => Math.hypot(Math.max(o.bb[0] - P.x, 0, P.x - o.bb[2]), Math.max(o.bb[1] - P.z, 0, P.z - o.bb[3]));

  // P3: a 1,4 m del bordillo (allí la acera de streets.js sube y asomaba entre el césped: los «triangulitos» de Glòries)
  // ¿suelo libre de plaza? dentro del contorno, fuera de calzada (a 0,5 m del bordillo) y fuera de todo edificio
  function free(o, x, z) { if (!inPoly(o.r, x, z)) return false; if (o.excl) for (const q of o.excl) if (inPoly(q.r, x, z)) return false; const nc = nearestCar(x, z); if (nc[0] >= 0 && nc[1] < (o.noPav ? 0.5 : 1.4)) return false; return coverAt(x, z, -1) < -1e8; }
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
    const RAD = { hedge: 0, figure: 1.0, fontC: 0, pondC: 0, stairs: 0, pigeons: 0, bin: 0.5, pond: 0, tree: 1.6, bench: 1.0, sbench: 1.2, lamp: 0.6, lampC: 0.6, canaletes: 0.9, play: 6.5, kiosk: 2.2, pergola: 4, pingpong: 1.8, bikes: 2.2, statue: 1.0, macia: 3.4, fontR: 0, rose: 0, balus: 0 };
    const put = (t, u, v, a, x) => { const [wx, wz] = U2W(u, v), r = t in P2RAD ? P2RAD[t] : RAD[t] || 1; if (r > 0 && !fits(wx, wz, r)) return false; occ.push([wx, wz, r]); items.push([t, wx, wz, a + o.ang, x || {}, u, v]); return true; };
    // zona de juegos genérica (se decide antes del pavimento: lleva caucho)
    if (!o.sg && (o.t === 'gran' || o.t === 'mitjana')) {
      for (let k = 0; k < 40 && !o.play; k++) { const u = (R() * 2 - 1) * o.hu * 0.7, v = (R() * 2 - 1) * o.hv * 0.7, [wx, wz] = U2W(u, v);
        if (edgeDist(o.r, wx, wz) > 9 && fits(wx, wz, 6.5)) o.play = [u, v]; } }
    yield;
    // ---- plataforma (P3): el suelo de la plaza es un plano ajustado al relieve por mínimos cuadrados y levantado lo justo para que
    // no asome ningún triángulo del terreno ni de la acera; en los bordes, faldón de piedra hasta la calle (y escalinatas donde
    // haga falta). Si el relieve es demasiado accidentado para un plano, una envolvente (máximo del suelo en ±1 m) sin bultos que asomen
    const gAt = (x, z) => Math.max(walkAt(x, z), heightAt(x, z) + 0.05);
    let hAt = (x, z) => Math.max(gAt(x, z), gAt(x + 1, z), gAt(x - 1, z), gAt(x, z + 1), gAt(x, z - 1)) + 0.03;
    o.plat = null;
    if (!o.noPav) {
      const sp = o.a > 30000 ? 3 : 2, M = new Float64Array(9), smp = []; let ns = 0;
      for (let z = o.bb[1] + sp / 2; z < o.bb[3]; z += sp) { for (let x = o.bb[0] + sp / 2; x < o.bb[2]; x += sp) { if (!free(o, x, z)) continue;
          const dx = x - o.c[0], dz = z - o.c[1], g = gAt(x, z); smp.push(dx, dz, g);
          M[0] += 1; M[1] += dx; M[2] += dz; M[3] += dx * dx; M[4] += dx * dz; M[5] += dz * dz; M[6] += g; M[7] += dx * g; M[8] += dz * g; }
        if (++ns % 25 === 0) yield; }
      const sol = M[0] >= 8 ? solve3([[M[0], M[1], M[2]], [M[1], M[3], M[4]], [M[2], M[4], M[5]]], [M[6], M[7], M[8]]) : null;
      if (sol) { const [a, b, c] = sol; let lift = -1e9, low = 1e9;
        for (let k = 0; k < smp.length; k += 3) { const r = smp[k + 2] - (a + b * smp[k] + c * smp[k + 1]); if (r > lift) lift = r; if (r < low) low = r; }
        const cap = o.sg && o.sg.lift !== undefined ? o.sg.lift : 0.45;
        o.plat = { slope: +Math.hypot(b, c).toFixed(3), lift: +lift.toFixed(2), wall: +(lift - low).toFixed(2), plane: lift <= cap && lift - low < 2.2 };
        if (o.plat.plane) { const L = lift + 0.05; hAt = (x, z) => a + b * (x - o.c[0]) + c * (z - o.c[1]) + L; } } }
    o.hAt = hAt;
    // ---- pavimento: bloques de 4 m enteros si están libres y en una sola zona; si no, celdas de 1 m
    const ZK = z => z ? z[0] * 1e7 + z[1][0] * 65536 + z[1][1] * 256 + z[1][2] : -1;
    const [bx0, bz0, bx1, bz1] = o.bb, gx0 = Math.floor(bx0 / 4) * 4, gz0 = Math.floor(bz0 / 4) * 4;
    const quads = [];
    let nb = 0;
    if (!o.noPav) for (let gz = gz0; gz < bz1; gz += 4) { for (let gx = gx0; gx < bx1; gx += 4) {
      const pts = [[0, 0], [4, 0], [0, 4], [4, 4], [2, 2], [2, 0], [0, 2], [4, 2], [2, 4]];
      let all = true, z0k = null, same = true;
      for (const [a, b] of pts) { const x = gx + a, z = gz + b; if (!free(o, x, z)) { all = false; break; } const zz = zoneOf(o, x, z); const k = ZK(zz); if (z0k === null) z0k = k; else if (k !== z0k) same = false; }
      if (all && same) { const zz = zoneOf(o, gx + 2, gz + 2); if (zz) quads.push([gx, gz, 4, zz]); }
      else for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const x0 = gx + i, z0 = gz + j;
        // P3: borde suavizado: celda entera si sus cuatro esquinas están libres, triángulo si lo están tres (sin dientes de sierra)
        const cf = [free(o, x0, z0), free(o, x0 + 1, z0), free(o, x0 + 1, z0 + 1), free(o, x0, z0 + 1)], nf = cf[0] + cf[1] + cf[2] + cf[3];
        if (nf < 3 && !(nf === 2 && free(o, x0 + 0.5, z0 + 0.5))) continue; const zz = zoneOf(o, x0 + 0.5, z0 + 0.5); if (zz) quads.push([x0, z0, 1, zz, false, nf === 3 ? cf.indexOf(false) : -1]); }
      if (++nb % 60 === 0) yield; } }
    yield;
    // ---- objetos de la plaza
    const putW = (t, x, z, a, ex) => { const dx = x - o.c[0], dz = z - o.c[1]; return put(t, dx * o.cu + dz * o.su, -dx * o.su + dz * o.cu, a - o.ang, ex); };
    const S = { P: o, put, putW, zone: (x, z) => free(o, x, z) ? zoneOf(o, x, z) : null, grid(sp, ph, f) { for (let v = -o.hv + ph; v <= o.hv; v += sp) for (let u = -o.hu + ph; u <= o.hu; u += sp) { const [x, z] = U2W(u, v); if (!free(o, x, z)) continue; f(u, v, x, z, edgeDist(o.r, x, z), zoneOf(o, x, z)); } } };
    if (o.sg) { const g = o.sg.objs(S); if (g && typeof g.next === 'function') yield* g; }
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
    const yAt = o.noPav ? (x, z) => Math.max(walkAt(x, z), heightAt(x, z) + 0.05) + 0.04 : (x, z) => hAt(x, z) + 0.02;
    const trees = { m: [], k: [] }, tm = new BABYLON.Matrix(), tq = new BABYLON.Quaternion(), tv = new BABYLON.Vector3(), ts = new BABYLON.Vector3();
    const fr = (x, z, a) => ({ x: x - ox, z: z - oz, tx: Math.cos(a), tz: Math.sin(a), nx: -Math.sin(a), nz: Math.cos(a) });
    let ni = 0;
    for (const [t, x, z, a, ex, u, v] of items) {
      if (++ni % 60 === 0) yield;
      const y = yAt(x, z), F = fr(x, z, a), h = hash2(Math.round(x * 5), Math.round(z * 5));
      if (P2PIECE[t]) { const L = P2PIECE[t](Wo, F, y, h, ex, Wh); if (L) lamps.push([x, z, L]); continue; }
      if (t === 'tree') { const k = TSP[ex.sp];
        if (k !== undefined && treeMeshes(k)) { const sc = (ex.alc ? 0.8 : 0.88) + 0.26 * h; BABYLON.Quaternion.RotationYawPitchRollToRef(h * 40, 0, 0, tq); tv.set(x, y - 0.12, z); ts.set(sc, sc * (0.95 + 0.12 * ((h * 13) % 1)), sc);
          BABYLON.Matrix.ComposeToRef(ts, tq, tv, tm); for (let q = 0; q < 16; q++) trees.m.push(tm.m[q]); trees.k.push(k); }
        else tree(Wo, F, y, TREES[ex.sp] || TREES.platan, h, ex.alc);
        if (ex.alc) quads.push([x - 0.7, z - 0.7, 1.4, [7, C.iron, 0], true]); }
      else if (P3PIECE[t]) { const L = P3PIECE[t](Wo, F, y, h, ex, { o, gAt, hAt, x, z, a, Wh }); if (L) lamps.push([x, z, L]); }
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
    }
    yield;
    // ---- malla de pavimento con la luz de las farolas cocida en los vértices
    const LGR = 9;
    const glowAt = (x, z) => { let g = 0; for (const [lx, lz, H] of lamps) { const d2 = (lx - x) ** 2 + (lz - z) ** 2, r = H * 1.5; if (d2 < 9 * r * r) g += Math.exp(-d2 / (r * r)); } return Math.min(1, g); };
    let nq = 0;
    for (const [x, z, s, zz, top, miss] of quads) {
      const xs = [x, x + s], zs = [z, z + s], dy = top ? 0.008 : 0, ys = [], gs = [];
      for (const [i, j] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { ys.push(hAt(xs[i], zs[j]) + dy); gs.push(glowAt(xs[i], zs[j])); }
      const col = zz[1], wear = Math.min(1, zz[2] + (hash2(Math.round(x), Math.round(z)) < 0.1 ? 0.25 : 0));
      const P4 = [[x, z], [x + s, z], [x + s, z + s], [x, z + s]];
      if (miss >= 0) {   // triángulo: las tres esquinas libres, y faldón por la hipotenusa
        const t = [1, 2, 3].map(q => (miss + q) % 4), A = P4[t[0]], Bq = P4[t[2]], nx = P4[miss][0] - (A[0] + Bq[0]) / 2, nz = P4[miss][1] - (A[1] + Bq[1]) / 2;
        quad(Wp, F0, A[0] - ox, ys[t[0]], A[1] - oz, P4[t[1]][0] - ox, ys[t[1]], P4[t[1]][1] - oz, Bq[0] - ox, ys[t[2]], Bq[1] - oz, Bq[0] - ox, ys[t[2]], Bq[1] - oz, col, 0, pav(zz[0], gs, wear));
        const ga = gAt(A[0] + nx * 0.6, A[1] + nz * 0.6) - 0.12, gb = gAt(Bq[0] + nx * 0.6, Bq[1] + nz * 0.6) - 0.12;
        if (ys[t[0]] - ga > 0.14 || ys[t[2]] - gb > 0.14) quad(Wp, F0, A[0] - ox, ys[t[0]], A[1] - oz, Bq[0] - ox, ys[t[2]], Bq[1] - oz, Bq[0] - ox, gb, Bq[1] - oz, A[0] - ox, ga, A[1] - oz, [118, 114, 108], 0, pav(6, [0, 0, 0, 0], 0.35));
        if (++nq % 300 === 0) yield; continue; }
      quad(Wp, F0, x - ox, ys[0], z - oz, x + s - ox, ys[1], z - oz, x + s - ox, ys[2], z + s - oz, x - ox, ys[3], z + s - oz, col, 0, pav(zz[0], gs, wear));
      // faldón de piedra en el borde exterior del pavimento: del canto de la plataforma hasta el suelo de fuera (algo enterrado)
      if (!top) for (const [i0, i1, nx, nz] of [[0, 1, 0, -1], [1, 2, 1, 0], [2, 3, 0, 1], [3, 0, -1, 0]]) {
        const A = P4[i0], Bq = P4[i1], mx = (A[0] + Bq[0]) / 2 + nx * 0.5, mz = (A[1] + Bq[1]) / 2 + nz * 0.5;
        if (free(o, mx, mz) && zoneOf(o, mx, mz)) continue;
        const ga = gAt(A[0] + nx * 0.4, A[1] + nz * 0.4) - 0.12, gb = gAt(Bq[0] + nx * 0.4, Bq[1] + nz * 0.4) - 0.12;
        if (ys[i0] - ga < 0.14 && ys[i1] - gb < 0.14) continue;
        quad(Wp, F0, A[0] - ox, ys[i0], A[1] - oz, Bq[0] - ox, ys[i1], Bq[1] - oz, Bq[0] - ox, gb, Bq[1] - oz, A[0] - ox, ga, A[1] - oz, [118, 114, 108], 0, pav(6, [0, 0, 0, 0], 0.35)); }
      if (++nq % 300 === 0) yield;
    }
    return { Wp, Wo, Wh, lamps: lamps.length, nItems: items.length, nQuads: quads.length, trees: trees.k.length ? { m: new Float32Array(trees.m), k: trees.k } : null };
  }
  function* runJob(o) {
    const r = yield* buildPlaza(o);
    const pc = { hi: null };
    const mp = reg(mkMesh(r.Wp, matP, 'plp' + o.i), { cast: false, layer: 'walk' });
    const mo = reg(mkMesh(r.Wo, matB, 'plo' + o.i), { cast: true, layer: 'furn', cell: pc });
    if (mo) mo.setEnabled(false);
    if (r.trees) treeDirty = true;
    o.st = { trees: r.trees, pc, mp, mo, on: false, triO: r.Wo.ni / 3, triP: r.Wp.ni / 3, Wh: r.Wh, mh: null, tris: (r.Wp.ni + r.Wo.ni) / 3, triH: r.Wh.ni / 3, lamps: r.lamps, items: r.nItems, quads: r.nQuads };
    tris += o.st.tris; built++;
  }
  function drop(o) { const s = o.st; if (!s) return; if (s.trees) treeDirty = true; if (s.on) trisOn -= s.triO; if (s.mp) s.mp.dispose(); if (s.mo) s.mo.dispose(); dropHi(o); tris -= s.tris; built--; o.st = null; }
  function dropHi(o) { const s = o.st; if (s && s.mh) { s.mh.dispose(); s.mh = null; s.pc.hi = null; trisHi -= s.triH; } }
  function step(P, budget) {
    const t0 = performance.now();
    // capa de detalle del mobiliario: inmediata (la geometría ya está hecha)
    for (const o of PL) { const s = o.st; if (!s) continue; const d = bbDist(o, P);
      if (d < R_HI[0] && !s.mh && s.Wh.nv) { s.mh = reg(mkMesh(s.Wh, matB, 'plh' + o.i), { cast: true, layer: 'furn' }); s.pc.hi = s.mh; trisHi += s.triH; }
      else if (d > R_HI[1] && s.mh) dropHi(o);
      if (s.mo) { const on = d < R_OBJ; if (on !== s.on) { s.mo.setEnabled(on); s.on = on; trisOn += (on ? 1 : -1) * s.triO; } }
      if (d > (o.rb || R_SIMPLE)[1]) drop(o); }
    if (treeDirty || !tCam || Math.hypot(P.x - tCam[0], P.y - tCam[1], P.z - tCam[2]) > 6) { treeInst(P); treeDirty = false; tCam = [P.x, P.y, P.z]; }
    while (performance.now() - t0 < budget) {
      if (!job) { const cand = PL.filter(o => !o.st && !o.fail && bbDist(o, P) < (o.rb || R_SIMPLE)[0]); if (!cand.length) return; cand.sort((a, b) => bbDist(a, P) - bbDist(b, P)); job = { o: cand[0], g: runJob(cand[0]) }; }
      let r; try { r = job.g.next(); } catch (e) { console.warn('Plaza «' + job.o.n + '»: ha fallado al construirse', e); job.o.fail = true; job = null; continue; }
      if (r.done) job = null;
    }
  }
  let lastP = null;
  return {
    update(P) { lastP = P; step(P, 4); },
    busy() { if (job) return true; if (!lastP) return false; return PL.some(o => !o.st && !o.fail && bbDist(o, lastP) < (o.rb || R_SIMPLE)[0]); },
    flush(P) { lastP = P; for (let k = 0; k < 400 && this.busy(); k++) step(P, 1e9); step(P, 0); },
    stats: () => ({ plazas: PL.filter(o => !o.tile).length, singulares: PL.filter(o => o.sg && !o.tile).length, paseos: PL.filter(o => o.tile).length, hechas: built, tris: Math.round(tris), trisVisibles: Math.round(trisOn + PL.reduce((a, o) => a + (o.st ? o.st.triP : 0), 0)), trisHi: Math.round(trisHi), arboles: nTreeLv, trisArboles: Math.round(treeTris) }),
    list: () => PL.map(o => ({ n: o.n, t: o.t, a: o.a, c: o.c, sg: !!o.sg, plat: o.plat, st: o.st && { tris: o.st.tris, items: o.st.items, lamps: o.st.lamps } })),
  };
} };
})();
