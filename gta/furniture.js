/* GTA Barcelona — Mobiliario urbano (hook de streets.js).
   Farolas, papeleras, bancos, batería de contenedores (con bolsas), estaciones de Bicing y semáforos, repartidos a lo largo
   de los tramos de calle de cada celda. Cada objeto tiene DOS niveles: el sencillo (toda celda de calle) y el de detalle
   (solo las celdas cercanas); se relevan por píxel, con tramado, a la distancia hiRange. La geometría va a mallas que se
   pintan con el shader de detalle de facades.js, con dos tipos de material propios (ids 60–79):
     · K.FURN  superficie genérica (rugosidad, metal, patrón) — como K.PBR, más el nivel de detalle;
     · K.FDEC  «calcomanía»: un quad con uv propias y un dibujo procedural (adhesivos con pictograma, bocas, radios, chapa
               perforada, pantalla, focos).
   window.BCN_FURNITURE = { init(ctx) → { build(cell), buildHi(cell), hiRange, poolMat } }. Contrato de cell/seg: DESARROLLO.md
   §6.10; catálogo, niveles y cómo añadir un objeto: §9. */
(function () {
'use strict';
const { K, F0, shade, mixc, quad, quadN, triN, box, rev, tube, sphere, R, seed, regKind } = window.BCN_GEO;

// ------------------------------------------------------------------ tipos de material
// El 4.º byte del auxiliar es el nivel: 0 = siempre · 100 = sencillo (cede el sitio, con tramado, cuando su celda tiene malla
// de detalle: uCellHi) · 200 = detalle (solo se ve por debajo de uFurnHi). Las dos mitades del tramado son complementarias.
const LOD_GLSL = `
    float fLv = floor(vInfo.w*2.55 + 0.5), fHi = smoothstep(uFurnHi.x, uFurnHi.y, dist);
    if (fLv > 1.5 ? dt < fHi : (fLv > 0.5 && uCellHi > 0.5 && dt >= fHi)) discard;
    float fNite = smoothstep(0.05, 0.3, uDusk);`;
// fNite: encendido del alumbrado (0 de día … 1 con uDusk ≥ 0,3: a las 20:25 ya está todo encendido). Ganancias de emit pensadas
// para la cadena HDR (florece a partir de ~1,6 sobre un color claro): luminaria 5,5 · pantalla 2,3 · focos de semáforo 1,6–3
regKind('FURN', 60, LOD_GLSL + `
    rough = max(vInfo.x, 0.05); metal = vInfo.y;
    float pat = floor(vInfo.z*255.0 + 0.5);
    if (pat > 0.5 && pat < 1.5) {                     // 1: lamas horizontales cada 6 cm
      float q = vLoc.y/0.06, s = fract(q), fw = fwidth(q);
      float slat = smoothstep(0.0, 0.2, s)*(1.0 - smoothstep(0.8, 1.0, s));
      alb *= mix(mix(0.5, 1.0, slat), 0.88, smoothstep(0.3, 0.9, fw));
    } else if (pat > 1.5 && pat < 2.5) {              // 2: nervios verticales cada 14 cm (caras planas)
      float q = P.x/0.14, s = fract(q), fw = fwidth(q);
      float rib = smoothstep(0.0, 0.12, s)*(1.0 - smoothstep(0.88, 1.0, s));
      alb *= mix(mix(0.72, 1.0, rib), 0.95, smoothstep(0.3, 0.9, fw));
    } else if (pat > 2.5 && pat < 3.5) {              // 3: pintura gastada, con roces
      vec2 q = vLoc.xz*2.3 + vLoc.y*vec2(1.7, 2.9);
      float w = smoothstep(0.42, 0.8, vnoise(q)*0.6 + vnoise(q*3.7)*0.4);
      alb *= mix(1.05, 0.74, w); rough = mix(rough, 0.92, w); metal *= 1.0 - 0.6*w;
    } else if (pat > 3.5 && pat < 4.5) {              // 4: plástico de contenedor, con churretes y suciedad
      float dr = vnoise(vec2(dot(vLoc.xz, vec2(5.3, 4.1)), vLoc.y*0.7));
      float gr = vnoise(vLoc.xz*1.9 + vLoc.y*vec2(1.3, 2.1));
      float w = smoothstep(0.45, 0.85, dr*0.55 + gr*0.45);
      alb *= mix(1.04, 0.78, w); rough = mix(rough, 0.92, w);
    } else if (pat > 4.5 && pat < 5.5) {              // 5: madera barnizada, veta a lo largo en las caras verticales
      vec2 q = an.y > 0.7 ? vLoc.xz*7.0 : vec2(P.x*2.5, P.y*45.0);
      alb *= mix(0.74, 1.12, vnoise(q)*0.6 + vnoise(q*3.1)*0.4);
    } else if (pat > 5.5 && pat < 6.5) {              // 6: lente de luminaria (matriz de ledes), encendida al anochecer
      float led = 1.0 - smoothstep(0.14, 0.44, length(fract(vLoc.xz/0.05) - 0.5));
      led = mix(led, 0.4, smoothstep(0.25, 0.8, fwidth(vLoc.x/0.05) + fwidth(vLoc.z/0.05)));
      alb = vec3(0.8, 0.8, 0.76)*(0.8 + 0.5*led); rough = 0.25;
      emis = emit(vec3(1.0, 0.84, 0.56), (0.2 + 5.3*fNite)*(0.8 + 0.5*led));
    } else if (pat > 6.5 && pat < 7.5) {              // 7: piloto
      emis = emit(alb, 1.3 + 0.9*fNite);
    }`, `uniform vec2 uFurnHi;
float fBx(vec2 p, vec2 b){ vec2 q = abs(p) - b; return max(q.x, q.y); }
float fPict(vec2 p, float id){
  if (id < 1.5) return min(length(p + vec2(0.0, 0.06)) - 0.2, min(fBx(p - vec2(0.0, 0.17), vec2(0.035, 0.06)), length(p - vec2(0.0, 0.26)) - 0.07));
  if (id < 2.5) return min(length(vec2(abs(p.x) - 0.07, p.y + 0.05)) - 0.15, length((p - vec2(0.07, 0.2))*vec2(1.0, 2.0)) - 0.09);
  if (id < 3.5) return min(fBx(p + vec2(0.1, 0.05), vec2(0.075, 0.17)), min(fBx(p - vec2(-0.1, 0.19), vec2(0.03, 0.07)), fBx(p - vec2(0.13, -0.08), vec2(0.08, 0.14))));
  if (id < 4.5) return max(fBx(p, vec2(0.17, 0.24)), -min(fBx(p - vec2(0.0, 0.1), vec2(0.11, 0.02)), min(fBx(p, vec2(0.11, 0.02)), fBx(p + vec2(0.0, 0.1), vec2(0.11, 0.02)))));
  return min(max(length(p - vec2(0.0, 0.1)) - 0.16, p.y - 0.14), min(fBx(p + vec2(0.0, 0.12), vec2(0.018, 0.1)), fBx(p + vec2(0.0, 0.23), vec2(0.1, 0.018))));
}`);
// pictogramas de fPict: 1 bolsa (resta) · 2 fruta (orgànica) · 3 botella y lata (envasos) · 4 hoja con renglones (paper) · 5 copa (vidre)
regKind('FDEC', 61, LOD_GLSL + `
    vec2 uv = vInfo.xy; float id = floor(vInfo.z*255.0 + 0.5);
    float aa = fwidth(uv.x) + fwidth(uv.y) + 0.003;
    rough = 0.45;
    if (id < 5.5) {                                   // 1–5: adhesivo con pictograma y dos renglones de texto insinuado
      float pm = 1.0 - smoothstep(-aa, aa, fPict(uv - vec2(0.5, 0.6), id));
      float tb = step(abs(uv.y - 0.17), 0.045)*step(abs(uv.x - 0.5), 0.36)*step(0.22, fract(uv.x*7.0 + 0.1));
      tb += step(abs(uv.y - 0.07), 0.025)*step(abs(uv.x - 0.42), 0.28);
      float edge = step(0.035, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
      alb = mix(vec3(0.92), mix(vCol.rgb, vec3(0.94), max(pm, min(tb, 1.0))), edge);
      alb *= 0.88 + 0.22*vnoise(vLoc.xz*9.0 + vLoc.y*7.0); rough = 0.4;
    } else if (id < 6.5) {                            // 6: ranura (boca del papel, anclaje)
      float sl = 1.0 - smoothstep(-aa, aa, fBx(uv - 0.5, vec2(0.36, 0.13)) - 0.07);
      float rim = 1.0 - smoothstep(-aa, aa, fBx(uv - 0.5, vec2(0.40, 0.19)) - 0.09);
      alb = mix(mix(vCol.rgb, vCol.rgb*0.55, rim), vec3(0.015), sl); rough = 0.6;
    } else if (id < 7.5) {                            // 7: boca redonda con faldones de goma
      vec2 p = uv - 0.5; float rr = length(p)*2.0;
      float fl = abs(fract(atan(p.y, p.x)/6.2832*10.0) - 0.5);
      vec3 rub = vec3(0.05)*(0.6 + 0.8*smoothstep(0.03, 0.09, fl*rr));
      alb = mix(vCol.rgb, vCol.rgb*0.6, 1.0 - smoothstep(0.92 - aa, 0.92 + aa, rr));
      alb = mix(alb, rub, 1.0 - smoothstep(0.78 - aa, 0.78 + aa, rr));
      alb = mix(alb, vec3(0.008), 1.0 - smoothstep(0.16, 0.22, rr)); rough = 0.7;
    } else if (id < 8.5) {                            // 8: rueda de radios (lo que no es radio ni buje se descarta)
      vec2 p = uv - 0.5; float rr = length(p)*2.0;
      float sp = abs(fract(atan(p.y, p.x)/6.2832*16.0) - 0.5)*0.3927*rr*0.5;
      bool on = rr < 0.11 || (rr < 1.0 && (aa > 0.045 ? dt < 0.18 : sp < 0.006 + aa*0.5));
      if (!on) discard;
      alb = vec3(0.66); metal = 1.0; rough = 0.35;
    } else if (id < 9.5) {                            // 9: chapa perforada al tresbolillo, con la bolsa detrás
      vec2 g = vec2(uv.x*40.0, uv.y*16.0); g.x += 0.5*step(1.0, mod(floor(g.y), 2.0));
      float hole = 1.0 - smoothstep(0.27, 0.29 + (fwidth(g.x) + fwidth(g.y))*0.8, length(fract(g) - 0.5));
      hole *= step(0.07, uv.y)*step(uv.y, 0.93);
      alb = mix(vCol.rgb, vec3(0.30, 0.32, 0.34), hole*0.9); metal = 0.85*(1.0 - hole); rough = mix(0.42, 0.7, hole);
    } else if (id < 10.5) {                           // 10: pantalla
      float inn = step(fBx(uv - 0.5, vec2(0.43, 0.41)), 0.0), row = floor(uv.y*7.0);
      float ln = step(0.45, fract(uv.y*7.0))*step(0.1, uv.x)*step(uv.x, 0.35 + 0.5*hash21(vec2(row, 3.0)));
      alb = vec3(0.02); rough = 0.15;
      emis = emit(mix(vec3(0.06, 0.14, 0.34), vec3(0.75, 0.86, 1.0), ln), (0.9 + 1.4*fNite)*inn);
    } else if (id < 11.5) {                           // 11: banda reflectante roja y blanca
      alb = mix(vec3(0.9), vec3(0.74, 0.07, 0.07), step(0.5, fract((uv.x*0.35 + uv.y)*3.0))); rough = 0.35;
    } else if (id < 13.5) {                           // 12–13: foco de semáforo, encendido o apagado
      float lens = 1.0 - smoothstep(0.40 - aa, 0.40 + aa, length(uv - 0.5));
      alb = mix(vec3(0.03), vCol.rgb*(id < 12.5 ? 0.5 : 0.14), lens); rough = 0.3;
      if (id < 12.5) emis = emit(vCol.rgb, lens*(1.6 + 1.4*fNite));
    }`);

// ------------------------------------------------------------------ acabados y ámbitos de azar
const FURN = new Set([2, 3, 4, 5, 6]);                      // clases de calle que llevan mobiliario
// batería de contenedores, en orden: resta, paper, envasos, vidre (iglú), orgànica → [cuerpo, pictograma]
const CONT = [[[78, 83, 92], 1], [[24, 80, 160], 4], [[212, 176, 30], 3], [[22, 110, 54], 5], [[98, 64, 38], 2]];
const fa = (rough, metal, pat, lod) => { const a = [Math.round(rough * 255), Math.round(metal * 255), pat, lod * 100]; return a.concat(a, a, a); };
// acabados de un nivel (1 sencillo, 2 detalle): auxiliar de K.FURN = (rugosidad, metal, patrón, nivel); dec(id) = uv + dibujo de K.FDEC
const finishes = lod => ({ lod,
  PAINT: fa(0.42, 0, 0, lod), STEEL: fa(0.4, 1, 0, lod), SLATS: fa(0.5, 0, 1, lod), RIBS: fa(0.6, 0, 2, lod), WORN: fa(0.55, 0, 3, lod),
  CAST: fa(0.5, 0, 3, lod), RUBBER: fa(0.85, 0, 0, lod), MATTE: fa(0.62, 0, 0, lod), PLASTIC: fa(0.5, 0, 4, lod), WOOD: fa(0.5, 0, 5, lod),
  GLOSS: fa(0.3, 0, 0, lod), LENS: fa(0.25, 0, 6, lod), LED: fa(0.3, 0, 7, lod),
  dec: id => { const w = lod * 100; return [0, 0, id, w, 255, 0, id, w, 255, 255, id, w, 0, 255, id, w]; } });
const AS = finishes(1), AH = finishes(2);
const T_BIN = 2, T_CONT = 4, T_BICI = 5, T_MOTO = 10;                    // seed(tipo, índice de retícula a lo largo de la calle, tramo)
const HI = [58, 70];                                        // relevo sencillo → detalle (m)
const LOG = /#shot/.test(location.hash) ? [] : null;        // solo en modo captura: dónde ha caído cada objeto (para montar vistas)

// ------------------------------------------------------------------ piezas (todas en un marco F: u, y, d)
// caja exenta (las seis caras)
function fbox(B, F, u0, u1, y0, y1, d0, d1, col, aux) {
  box(B, F, u0, u1, y0, y1, d0, d1, col, K.FURN, 7, aux);
  quad(B, F, u0, y0, d0, u1, y0, d0, u1, y1, d0, u0, y1, d0, shade(col, 0.85), K.FURN, aux);
}
// calcomanía vertical en el plano d: uL es el borde que queda a la IZQUIERDA de quien la mira (en una cara que mira a +d, el u mayor)
const dq = (B, F, uL, uR, y0, y1, d, col, aux) => quad(B, F, uL, y0, d, uR, y0, d, uR, y1, d, uL, y1, d, col, K.FDEC, aux);
// rectángulo horizontal
const hq = (B, F, u0, u1, y, d0, d1, col, kind, aux) => quad(B, F, u0, y, d0, u1, y, d0, u1, y, d1, u0, y, d1, col, kind, aux);
// cuerpo de sección rectangular con las esquinas redondeadas, por anillos [semilargo en u, semiancho en d, radio de esquina, y]
// de abajo arriba; normales suaves (un anillo repetido = arista viva). cap: 1 tapa arriba · 2 abajo. seg = tramos por esquina.
// Triángulos: 8·(seg + 1) por tramo entre anillos y 4·(seg + 1) por tapa.
function loft(B, F, u0, d0, rings, seg, col, aux, cap) {
  if (!B) return;
  const n = rings.length, M = 4 * (seg + 1), O = [], NR = [], NY = [];
  for (const [hu, hd, r] of rings) { const o = [];
    for (let c = 0; c < 4; c++) { const su = c === 0 || c === 3 ? 1 : -1, sd = c < 2 ? 1 : -1;
      for (let k = 0; k <= seg; k++) { const a = (c + k / seg) * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a); o.push([u0 + su * (hu - r) + ca * r, d0 + sd * (hd - r) + sa * r, ca, sa]); } }
    O.push(o); NR.push(new Float64Array(M)); NY.push(new Float64Array(M)); }
  const live = [];
  for (let k = 0; k + 1 < n; k++) { const dy = rings[k + 1][3] - rings[k][3]; let any = false;
    for (let j = 0; j < M; j++) { const a = O[k][j], b = O[k + 1][j], dr = (b[0] - a[0]) * a[2] + (b[1] - a[1]) * a[3], l = Math.hypot(dy, dr); if (l < 1e-6) continue;
      any = true; NR[k][j] += dy / l; NY[k][j] -= dr / l; NR[k + 1][j] += dy / l; NY[k + 1][j] -= dr / l; }
    live.push(any); }
  const pt = (k, j) => [O[k][j][0], rings[k][3], O[k][j][1]], nm = (k, j) => { const o = O[k][j], r = NR[k][j]; return [o[2] * r, NY[k][j] || (r ? 0 : 1), o[3] * r]; };
  for (let k = 0; k + 1 < n; k++) { if (!live[k]) continue;
    for (let j = 0; j < M; j++) { const j1 = (j + 1) % M; quadN(B, F, [pt(k, j), pt(k, j1), pt(k + 1, j1), pt(k + 1, j)], [nm(k, j), nm(k, j1), nm(k + 1, j1), nm(k + 1, j)], col, K.FURN, aux); } }
  for (const top of [1, 0]) { if (!(cap & (top ? 1 : 2))) continue;
    const k = top ? n - 1 : 0, c = [u0, rings[k][3], d0], up = [0, top ? 1 : -1, 0];
    for (let j = 0; j < M; j++) triN(B, F, [c, pt(k, j), pt(k, (j + 1) % M)], [up, up, up], col, K.FURN, aux); }
}
// calcomanía curva: franja de un cono vertical (radio r0 en y0, r1 en y1) entre los ángulos a0 y a1, en n tiras. u de la uv crece con el ángulo
function cdec(B, F, u, d, r0, r1, y0, y1, a0, a1, n, col, id, lod) {
  if (!B) return;
  const sl = (r1 - r0) / (y1 - y0), w = lod * 100;
  for (let k = 0; k < n; k++) { const b0 = a0 + (a1 - a0) * k / n, b1 = a0 + (a1 - a0) * (k + 1) / n, c0 = Math.cos(b0), s0 = Math.sin(b0), c1 = Math.cos(b1), s1 = Math.sin(b1), t0 = Math.round(255 * k / n), t1 = Math.round(255 * (k + 1) / n);
    quadN(B, F, [[u + c0 * r0, y0, d + s0 * r0], [u + c1 * r0, y0, d + s1 * r0], [u + c1 * r1, y1, d + s1 * r1], [u + c0 * r1, y1, d + s0 * r1]],
      [[c0, -sl, s0], [c1, -sl, s1], [c1, -sl, s1], [c0, -sl, s0]], col, K.FDEC, [t0, 0, id, w, t1, 0, id, w, t1, 255, id, w, t0, 255, id, w]); }
}

// losa inclinada en el plano (u, y): va de a a b (puntos [u, y]), con semiancho en d de w0 a w1 y grueso t (carrocerías). 12 triángulos
function slab(B, F, a, b, w0, w1, t, col, aux) {
  const vx = b[0] - a[0], vy = b[1] - a[1], l = Math.hypot(vx, vy) || 1, nx = -vy / l * t / 2, ny = vx / l * t / 2;
  const P = (p, w, sn, sd) => [p[0] + nx * sn, p[1] + ny * sn, w * sd];
  const c = [P(a, w0, -1, -1), P(a, w0, -1, 1), P(b, w1, -1, 1), P(b, w1, -1, -1), P(a, w0, 1, -1), P(a, w0, 1, 1), P(b, w1, 1, 1), P(b, w1, 1, -1)];
  for (const [i, j, k, m] of [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]]) quad(B, F, ...c[i], ...c[j], ...c[k], ...c[m], col, K.FURN, aux);
}

// ------------------------------------------------------------------ objetos: f(B, A, F, y, …) con A = acabados del nivel (A.lod)
const lampC = [46, 56, 51], ironC = [40, 42, 45], steelC = [150, 152, 156], dark = [20, 20, 22];

// farola: F con +d hacia la calzada (hacia donde vuela el brazo)
function lamp(B, A, F, y, H, reach) {
  const yh = y + H;
  if (A.lod < 2) {
    rev(B, F, 0, 0, [[0.16, y], [0.125, y + 0.46], [0.09, y + 0.55], [0.055, yh]], 7, lampC, K.FURN, { aux: A.PAINT, cap: 1 });
    tube(B, F, [[0, yh - 0.12, 0], [0, yh + 0.16, reach * 0.3], [0, yh + 0.02, reach - 0.05]], 0.04, 4, lampC, K.FURN, { aux: A.PAINT });
    fbox(B, F, -0.16, 0.16, yh - 0.2, yh, reach - 0.32, reach + 0.32, lampC, A.PAINT);
    hq(B, F, -0.11, 0.11, yh - 0.206, reach - 0.26, reach + 0.26, [255, 236, 190], K.FURN, A.LENS); return; }
  // columna torneada: zócalo, dos molduras, fuste cónico y collarín
  rev(B, F, 0, 0, [[0.2, y], [0.2, y + 0.05], [0.17, y + 0.07], [0.162, y + 0.3], [0.19, y + 0.34], [0.13, y + 0.42], [0.112, y + 0.92], [0.135, y + 0.96], [0.086, y + 1.04],
    [0.056, yh - 0.08], [0.075, yh - 0.05], [0.045, yh + 0.05]], 7, lampC, K.FURN, { aux: A.PAINT, cap: 1 });
  // brazo en arco, más fino hacia la punta
  tube(B, F, [[0, yh - 0.3, 0.04], [0, yh + 0.1, reach * 0.22], [0, yh + 0.2, reach * 0.6], [0, yh + 0.1, reach - 0.3]], t => 0.046 - 0.012 * t, 5, lampC, K.FURN, { aux: A.PAINT });
  // luminaria: carcasa aplanada, alargada en el sentido del brazo, con la lente debajo
  loft(B, F, 0, reach, [[0.11, 0.3, 0.09, yh - 0.02], [0.17, 0.36, 0.12, yh + 0.035], [0.17, 0.36, 0.12, yh + 0.07], [0.1, 0.27, 0.09, yh + 0.14]], 1, lampC, A.PAINT, 3);
  hq(B, F, -0.1, 0.1, yh - 0.024, reach - 0.27, reach + 0.27, [255, 236, 190], K.FURN, A.LENS);
}

// papelera cilíndrica de chapa perforada sobre poste: F con +d hacia el cesto
function bin(B, A, F, y, col) {
  if (A.lod < 2) {
    rev(B, F, 0, 0, [[0.035, y], [0.035, y + 1.0]], 4, ironC, K.FURN, { aux: A.PAINT, cap: 1 });
    rev(B, F, 0, 0.24, [[0.185, y + 0.42], [0.205, y + 0.95], [0.205, y + 0.95, dark], [0, y + 0.88, dark]], 10, col, K.FURN, { aux: A.SLATS }); return; }
  const D = 0.24, yb = y + 0.42, yt = y + 0.95, bag = [206, 210, 214];
  rev(B, F, 0, 0, [[0.075, y], [0.075, y + 0.018], [0.032, y + 0.04], [0.032, y + 1.04]], 6, ironC, K.FURN, { aux: A.PAINT, cap: 1 });   // poste con pletina
  fbox(B, F, -0.05, 0.05, y + 0.6, y + 0.66, 0.02, D - 0.17, ironC, A.PAINT);                                                             // abrazadera
  cdec(B, F, 0, D, 0.185, 0.205, yb, yt, 0, 2 * Math.PI, 12, col, 9, 2);                                                                  // cesto de chapa perforada
  rev(B, F, 0, D, [[0, yb - 0.035], [0.185, yb]], 12, shade(col, 0.8), K.FURN, { aux: A.STEEL });                                         // fondo
  rev(B, F, 0, D, [[0.207, yt - 0.014], [0.224, yt], [0.207, yt + 0.014], [0.19, yt]], 10, steelC, K.FURN, { aux: A.STEEL });             // aro
  rev(B, F, 0, D, [[0.208, yt - 0.11], [0.212, yt - 0.014]], 12, bag, K.FURN, { aux: A.GLOSS });                                          // la bolsa, vuelta sobre el borde
  rev(B, F, 0, D, [[0, yt - 0.2], [0.19, yt - 0.005]], 12, [34, 35, 38], K.FURN, { aux: A.MATTE });                                       // … y su interior
}

// banco de listones con costados de fundición y reposabrazos: F con +d hacia delante (hacia donde mira quien se sienta)
function bench(B, A, F, y) {
  const wood = [128, 82, 46];
  if (A.lod < 2) {
    for (const e of [-0.75, 0.75]) fbox(B, F, e - 0.04, e + 0.04, y, y + 0.45, -0.25, 0.25, ironC, A.PAINT);
    for (let q = 0; q < 4; q++) fbox(B, F, -0.9, 0.9, y + 0.43, y + 0.47, 0.135 - q * 0.12, 0.225 - q * 0.12, wood, A.WOOD);
    for (let q = 0; q < 3; q++) fbox(B, F, -0.9, 0.9, y + 0.55 + q * 0.13, y + 0.63 + q * 0.13, -0.28, -0.24, wood, A.WOOD);
    return; }
  for (const su of [-0.78, 0.78]) {
    const T = pts => tube(B, F, pts.map(p => [su, y + p[1], p[0]]), 0.023, 4, ironC, K.FURN, { aux: A.CAST });
    T([[0.27, 0], [0.235, 0.4], [-0.2, 0.42], [-0.345, 0.88]]);      // pata delantera, asiento y montante del respaldo, de una pieza
    T([[-0.31, 0], [-0.2, 0.42]]);                                   // pata trasera
    T([[-0.275, 0.65], [0.22, 0.63], [0.235, 0.4]]);                 // reposabrazos
    for (const d of [0.27, -0.31]) fbox(B, F, su - 0.04, su + 0.04, y, y + 0.02, d - 0.05, d + 0.05, ironC, A.CAST);
  }
  for (let q = 0; q < 5; q++) { const d = 0.235 - q * 0.1; fbox(B, F, -0.9, 0.9, y + 0.44, y + 0.475, d - 0.042, d + 0.042, wood, A.WOOD); }       // asiento, listón a listón
  for (let q = 0; q < 4; q++) { const h = 0.54 + q * 0.1, d = -0.2 - (h - 0.42) * 0.315 + 0.04; fbox(B, F, -0.9, 0.9, y + h - 0.04, y + h + 0.04, d - 0.016, d + 0.016, wood, A.WOOD); }   // respaldo
}

// contenedor de carga lateral: F con +d hacia la acera (por donde se tira la basura). kind: índice de CONT
function container(B, A, F, y, kind) {
  const [lid, pic] = CONT[kind], col = mixc(lid, [58, 60, 64], 0.3), hl = 0.775, hd = 0.69;   // la tapa lleva el color vivo y el cuerpo, el mismo más apagado
  if (A.lod < 2) {
    fbox(B, F, -hl, hl, y + 0.1, y + 1.07, -hd, hd, col, A.RIBS);
    fbox(B, F, -hl - 0.04, hl + 0.04, y + 1.07, y + 1.3, -hd - 0.04, hd + 0.04, lid, A.PAINT);
    fbox(B, F, -0.5, 0.5, y + 0.09, y + 0.15, hd, hd + 0.2, dark, A.MATTE); return; }
  for (const su of [-0.58, 0.58]) for (const sd of [-0.5, 0.5]) rev(B, F, su, sd, [[0.075, y], [0.075, y + 0.13]], 6, dark, K.FURN, { aux: A.RUBBER });   // ruedas
  // cuerpo: más estrecho abajo, aristas redondeadas y reborde bajo la tapa
  loft(B, F, 0, 0, [[hl - 0.07, hd - 0.1, 0.08, y + 0.11], [hl, hd, 0.1, y + 0.42], [hl, hd, 0.1, y + 1.0], [hl + 0.03, hd + 0.03, 0.1, y + 1.0], [hl + 0.03, hd + 0.03, 0.1, y + 1.07]], 2, col, A.PLASTIC, 2);
  // tapa abombada, de otro tono
  loft(B, F, 0, 0, [[hl + 0.04, hd + 0.04, 0.1, y + 1.07], [hl + 0.04, hd + 0.04, 0.12, y + 1.15], [hl - 0.1, hd - 0.09, 0.2, y + 1.29], [hl - 0.4, hd - 0.34, 0.25, y + 1.34]], 2, lid, A.PAINT, 1);
  // adhesivo con el pictograma en el frente y otro detrás, y bandas reflectantes hacia la calzada
  const fd = hd + 0.006;
  dq(B, F, -0.3, -0.66, y + 0.52, y + 0.92, fd, mixc(col, [20, 20, 20], 0.15), A.dec(pic));
  dq(B, F, -0.18, 0.18, y + 0.52, y + 0.92, -fd, mixc(col, [20, 20, 20], 0.15), A.dec(pic));
  for (const su of [-1, 1]) dq(B, F, su * 0.6 - 0.07, su * 0.6 + 0.07, y + 0.48, y + 0.94, -fd, col, A.dec(11));
  if (kind === 1) dq(B, F, 0.62, -0.12, y + 0.72, y + 0.92, fd, col, A.dec(6));                                   // paper: ranura
  else if (kind === 2) for (const uc of [0.08, 0.44]) dq(B, F, uc + 0.14, uc - 0.14, y + 0.64, y + 0.92, fd, col, A.dec(7));   // envasos: dos bocas con goma
  else {                                                                                                         // resta y orgànica: asa de la tapa y pedal
    tube(B, F, [[-0.45, y + 1.12, hd + 0.03], [-0.45, y + 1.19, hd + 0.11], [0.45, y + 1.19, hd + 0.11], [0.45, y + 1.12, hd + 0.03]], 0.018, 4, steelC, K.FURN, { aux: A.STEEL });
    tube(B, F, [[-0.5, y + 0.3, hd - 0.01], [-0.5, y + 0.09, hd + 0.19], [0.5, y + 0.09, hd + 0.19], [0.5, y + 0.3, hd - 0.01]], 0.02, 4, steelC, K.FURN, { aux: A.STEEL });
    if (kind === 4) fbox(B, F, -0.3, 0.3, y + 1.3, y + 1.37, -0.2, 0.24, shade(lid, 0.82), A.PAINT); }           // orgànica: trampilla pequeña
  // costados: cajeado oscuro y bulón de izado
  for (const su of [-1, 1]) {
    quad(B, F, su * (hl + 0.006), y + 0.76, -0.24, su * (hl + 0.006), y + 0.76, 0.24, su * (hl + 0.006), y + 0.99, 0.24, su * (hl + 0.006), y + 0.99, -0.24, shade(col, 0.5), K.FURN, A.MATTE);
    tube(B, F, [[su * hl, y + 0.9, 0], [su * (hl + 0.1), y + 0.9, 0]], 0.03, 5, steelC, K.FURN, { aux: A.STEEL, caps: true }); }
}

// iglú del vidrio: campana torneada con bocas de goma, adhesivo y seta de izado
function iglu(B, A, F, y) {
  const [col, pic] = CONT[3];
  if (A.lod < 2) {
    rev(B, F, 0, 0, [[0.7, y], [0.78, y + 0.4], [0.74, y + 0.95], [0.5, y + 1.36], [0.15, y + 1.54]], 9, col, K.FURN, { aux: A.WORN, cap: 1 });
    rev(B, F, 0, 0, [[0.09, y + 1.54], [0.07, y + 1.68]], 5, [120, 124, 130], K.FURN, { aux: A.STEEL, cap: 1 }); return; }
  rev(B, F, 0, 0, [[0.6, y], [0.6, y + 0.05], [0.71, y + 0.08], [0.78, y + 0.45], [0.75, y + 0.95], [0.6, y + 1.3], [0.36, y + 1.5], [0.14, y + 1.58]], 14, col, K.FURN, { aux: A.WORN, cap: 1 });
  rev(B, F, 0, 0, [[0.05, y + 1.58], [0.05, y + 1.67], [0.11, y + 1.69], [0.11, y + 1.73]], 6, [120, 124, 130], K.FURN, { aux: A.STEEL, cap: 1 });
  for (const a of [Math.PI / 2, -Math.PI / 2]) {                                              // una boca y un adhesivo por cada lado
    cdec(B, F, 0, 0, 0.752, 0.652, y + 0.94, y + 1.2, a - 0.19, a + 0.19, 2, col, 7, 2);
    cdec(B, F, 0, 0, 0.787, 0.772, y + 0.46, y + 0.84, a - 0.24, a + 0.24, 3, mixc(col, [20, 20, 20], 0.2), pic, 2); }
}

// bicicleta de Bicing: F con +u hacia delante. Librea roja y blanca genérica
function bike(B, A, F, y) {
  const red = [196, 30, 34], wht = [236, 236, 232], blk = [22, 22, 24], gry = [150, 150, 155];
  const T = (pts, r, col, aux, sides) => tube(B, F, pts.map(p => [p[0], y + p[1], p[2] || 0]), r, sides || 4, col, K.FURN, { aux });
  const arc = (cu, r, n, a0, a1, closed) => { const o = []; for (let k = 0; k < n; k++) { const a = a0 + (a1 - a0) * k / (closed ? n : n - 1); o.push([cu + Math.cos(a) * r, 0.34 + Math.sin(a) * r]); } return o; };
  if (A.lod < 2) {
    for (const w of [-0.53, 0.53]) tube(B, F, arc(w, 0.31, 14, 0, 6.2832, true).map(p => [p[0], y + p[1], 0]), 0.028, 3, blk, K.FURN, { closed: true, aux: A.RUBBER });
    T([[-0.53, 0.34], [-0.08, 0.3], [0.2, 0.42], [0.38, 0.8]], 0.03, red, A.PAINT);
    T([[-0.08, 0.3], [-0.2, 0.86], [-0.225, 0.97]], 0.022, red, A.PAINT);
    T([[0.34, 1.04], [0.4, 0.74], [0.53, 0.34]], 0.022, red, A.PAINT);
    T([[0.3, 1.1, -0.28], [0.3, 1.1, 0.28]], 0.017, blk, A.RUBBER);
    fbox(B, F, -0.37, -0.11, y + 0.96, y + 1.02, -0.07, 0.07, blk, A.RUBBER);
    fbox(B, F, 0.44, 0.7, y + 0.8, y + 0.88, -0.12, 0.12, wht, A.PAINT); return; }
  for (const w of [-0.53, 0.53]) {
    tube(B, F, arc(w, 0.305, 14, 0, 6.2832, true).map(p => [p[0], y + p[1], 0]), 0.03, 4, blk, K.FURN, { closed: true, aux: A.RUBBER });    // cubierta
    tube(B, F, arc(w, 0.268, 14, 0, 6.2832, true).map(p => [p[0], y + p[1], 0]), 0.013, 3, gry, K.FURN, { closed: true, aux: A.STEEL });    // llanta
    quad(B, F, w - 0.27, y + 0.07, 0, w + 0.27, y + 0.07, 0, w + 0.27, y + 0.61, 0, w - 0.27, y + 0.61, 0, gry, K.FDEC, A.dec(8));          // radios
    T([[w, 0.34, -0.055], [w, 0.34, 0.055]], 0.024, gry, A.STEEL);                                                                          // buje
  }
  T(arc(-0.53, 0.352, 6, 0.5, 3.3), 0.021, wht, A.PAINT, 3);         // guardabarros
  T(arc(0.53, 0.352, 5, 0.35, 2.6), 0.021, wht, A.PAINT, 3);
  for (const sd of [-0.04, 0.04]) quad(B, F, -0.7, y + 0.5, sd, -0.44, y + 0.49, sd, -0.4, y + 0.63, sd, -0.66, y + 0.67, sd, wht, K.FURN, A.PAINT);   // faldón trasero
  T([[-0.08, 0.3], [0.2, 0.42], [0.38, 0.8]], 0.034, red, A.PAINT, 5);       // tubo principal, bajo (cuadro de paso abierto)
  T([[-0.08, 0.3], [-0.2, 0.86]], 0.024, red, A.PAINT);                      // tubo del sillín
  T([[-0.53, 0.34], [-0.08, 0.3]], 0.018, red, A.PAINT);                     // vainas
  T([[-0.53, 0.34], [-0.17, 0.72]], 0.016, red, A.PAINT);                    // tirantes
  T([[0.34, 1.04], [0.4, 0.74], [0.53, 0.34]], 0.022, red, A.PAINT);         // dirección y horquilla
  T([[-0.2, 0.86], [-0.225, 0.97]], 0.013, gry, A.STEEL, 3);                 // tija
  loft(B, F, -0.24, 0, [[0.13, 0.07, 0.06, y + 0.965], [0.14, 0.08, 0.07, y + 0.99], [0.1, 0.055, 0.05, y + 1.015]], 1, blk, A.RUBBER, 3);   // sillín
  T([[0.34, 1.04], [0.32, 1.1]], 0.016, gry, A.STEEL, 3);                    // potencia y manillar con puños
  T([[0.27, 1.1, -0.29], [0.33, 1.1, -0.1], [0.33, 1.1, 0.1], [0.27, 1.1, 0.29]], 0.013, gry, A.STEEL, 3);
  for (const sd of [-1, 1]) T([[0.262, 1.1, sd * 0.31], [0.292, 1.1, sd * 0.2]], 0.019, blk, A.RUBBER);
  T([[0.42, 0.9, -0.13], [0.72, 0.87, -0.13], [0.72, 0.87, 0.13], [0.42, 0.9, 0.13]], 0.013, gry, A.STEEL, 3);   // soporte delantero
  fbox(B, F, 0.44, 0.7, y + 0.84, y + 0.86, -0.12, 0.12, wht, A.PAINT);
  fbox(B, F, 0.39, 0.5, y + 0.56, y + 0.68, -0.035, 0.035, red, A.PAINT);    // bloque y bulón de anclaje
  T([[0.45, 0.62], [0.84, 0.62]], 0.016, gry, A.STEEL, 3);
  fbox(B, F, -0.5, -0.02, y + 0.3, y + 0.4, 0.035, 0.05, wht, A.PAINT);      // cubrecadena
  T([[-0.08, 0.3, 0.06], [0.0, 0.16, 0.07]], 0.012, gry, A.STEEL, 3);        // bielas y pedales
  fbox(B, F, -0.04, 0.05, y + 0.145, y + 0.165, 0.06, 0.14, blk, A.RUBBER);
  T([[-0.08, 0.3, -0.06], [-0.16, 0.44, -0.07]], 0.012, gry, A.STEEL, 3);
  fbox(B, F, -0.2, -0.11, y + 0.43, y + 0.45, -0.14, -0.06, blk, A.RUBBER);
  T([[-0.2, 0.3, 0.05], [-0.3, 0.02, 0.2]], 0.01, gry, A.STEEL, 3);          // pata de cabra
}

// anclaje de Bicing: F con +d hacia la bici. on = hay bici (piloto verde)
function dock(B, A, F, y, on) {
  const c = [178, 180, 184];
  if (A.lod < 2) { fbox(B, F, -0.07, 0.07, y, y + 0.8, -0.09, 0.09, c, A.PAINT); return; }
  loft(B, F, 0, 0, [[0.07, 0.09, 0.035, y], [0.07, 0.09, 0.035, y + 0.72], [0.05, 0.065, 0.03, y + 0.8]], 1, c, A.PAINT, 1);
  quad(B, F, 0.03, y + 0.52, 0.094, 0.03, y + 0.68, 0.094, -0.03, y + 0.68, 0.094, -0.03, y + 0.52, 0.094, [120, 122, 126], K.FDEC, A.dec(6));   // ranura vertical
  quad(B, F, -0.014, y + 0.69, 0.094, 0.014, y + 0.69, 0.094, 0.014, y + 0.714, 0.094, -0.014, y + 0.714, 0.094, on ? [40, 220, 90] : [200, 150, 40], K.FURN, A.LED);
  loft(B, F, 0, 0, [[0.085, 0.105, 0.04, y + 0.3], [0.085, 0.105, 0.04, y + 0.36]], 1, [196, 30, 34], A.PAINT, 3);                             // banda roja
}

// tótem de la estación: F con +d hacia la acera (la pantalla)
function totem(B, A, F, y) {
  const c = [62, 64, 68], red = [196, 30, 34];
  if (A.lod < 2) { fbox(B, F, -0.2, 0.2, y, y + 1.9, -0.11, 0.11, c, A.PAINT); fbox(B, F, -0.2, 0.2, y + 1.9, y + 2.25, -0.11, 0.11, red, A.PAINT); return; }
  loft(B, F, 0, 0, [[0.2, 0.11, 0.05, y], [0.2, 0.11, 0.05, y + 1.9]], 2, c, A.PAINT, 0);
  loft(B, F, 0, 0, [[0.2, 0.11, 0.05, y + 1.9], [0.2, 0.11, 0.05, y + 2.2], [0.16, 0.08, 0.05, y + 2.26]], 2, red, A.PAINT, 1);
  dq(B, F, 0.14, -0.14, y + 1.3, y + 1.52, 0.114, c, A.dec(10));                                             // pantalla
  quad(B, F, 0.1, y + 1.06, 0.114, -0.1, y + 1.06, 0.114, -0.1, y + 1.2, 0.114, 0.1, y + 1.2, 0.114, [16, 16, 18], K.FURN, A.GLOSS);   // lector
  dq(B, F, -0.15, 0.15, y + 1.0, y + 1.6, -0.114, [44, 70, 130], A.dec(4));                                  // panel de información
}

// semáforo: F con +d hacia quien llega al cruce. go = en verde
function signal(B, A, F, y, go) {
  const hi = A.lod === 2, pole = [58, 64, 60], lights = [[230, 40, 30], [240, 170, 30], [40, 220, 90]];
  if (hi) { rev(B, F, 0, 0, [[0.1, y], [0.1, y + 0.07], [0.055, y + 0.12], [0.055, y + 3.35]], 7, pole, K.FURN, { aux: A.PAINT, cap: 1 });
    loft(B, F, 0, 0.17, [[0.14, 0.1, 0.05, y + 2.42], [0.14, 0.1, 0.05, y + 3.3]], 1, dark, A.PAINT, 3); }
  else { rev(B, F, 0, 0, [[0.055, y], [0.055, y + 3.35]], 4, pole, K.FURN, { aux: A.PAINT, cap: 1 }); fbox(B, F, -0.14, 0.14, y + 2.42, y + 3.3, 0.07, 0.27, dark, A.PAINT); }
  for (let k = 0; k < 3; k++) { const yc = y + 3.14 - k * 0.28, lit = k === (go ? 2 : 0);
    dq(B, F, 0.12, -0.12, yc - 0.12, yc + 0.12, 0.276, lights[k], A.dec(lit ? 12 : 13));
    if (hi) fbox(B, F, -0.12, 0.12, yc + 0.115, yc + 0.13, 0.27, 0.38, dark, A.PAINT); }                      // visera
}

// bolardo (pilona) de fundición con collarín
function bollard(B, A, F, y) {
  // gris de fundición claro y 17 cm de grueso, con una franja reflectante bajo el collarín: se lee a 10-15 m, también de noche
  const bc = [84, 86, 90], band = [196, 196, 190];
  if (A.lod < 2) { rev(B, F, 0, 0, [[0.09, y], [0.085, y + 0.62], [0.085, y + 0.62, band], [0.085, y + 0.7, band], [0.085, y + 0.7], [0.08, y + 0.92]], 5, bc, K.FURN, { aux: A.CAST, cap: 1 }); return; }
  rev(B, F, 0, 0, [[0.11, y], [0.088, y + 0.06], [0.085, y + 0.6], [0.0855, y + 0.6, band], [0.0855, y + 0.68, band], [0.085, y + 0.68], [0.084, y + 0.72],
    [0.102, y + 0.75], [0.102, y + 0.8], [0.075, y + 0.85], [0, y + 0.94]], 8, bc, K.FURN, { aux: A.CAST });
}

// buzón amarillo genérico: F con +d hacia la boca (la acera)
function mailbox(B, A, F, y) {
  const yel = [232, 180, 22], foot = [40, 40, 44];
  if (A.lod < 2) { rev(B, F, 0, 0, [[0.19, y, foot], [0.19, y + 0.2, foot], [0.225, y + 0.2], [0.225, y + 1.26], [0.1, y + 1.45]], 6, yel, K.FURN, { aux: A.PAINT, cap: 1 }); return; }
  rev(B, F, 0, 0, [[0.19, y, foot], [0.19, y + 0.17, foot], [0.215, y + 0.2, foot], [0.215, y + 0.2], [0.225, y + 0.22], [0.225, y + 1.22], [0.243, y + 1.24], [0.243, y + 1.28],
    [0.2, y + 1.39], [0.1, y + 1.46], [0, y + 1.475]], 10, yel, K.FURN, { aux: A.WORN });
  cdec(B, F, 0, 0, 0.228, 0.228, y + 0.98, y + 1.12, 1.02, 2.12, 3, yel, 6, 2);                                   // boca
  rev(B, F, 0, 0, [[0.228, y + 1.135], [0.262, y + 1.125], [0.228, y + 1.16]], 4, yel, K.FURN, { aux: A.PAINT, a0: 0.95, a1: 2.19 });   // visera sobre la boca
  cdec(B, F, 0, 0, 0.228, 0.228, y + 0.56, y + 0.86, 1.2, 1.94, 2, [34, 52, 110], 4, 2);                          // placa de horarios
}

// parquímetro: F con +d hacia la acera (la pantalla)
function meter(B, A, F, y) {
  const body = [42, 66, 118], post = [74, 77, 82];
  if (A.lod < 2) { fbox(B, F, -0.11, 0.11, y, y + 1.6, -0.075, 0.075, body, A.PAINT); return; }
  loft(B, F, 0, 0, [[0.075, 0.055, 0.02, y], [0.075, 0.055, 0.02, y + 0.86]], 1, post, A.PAINT, 0);                // pie
  loft(B, F, 0, 0, [[0.11, 0.07, 0.03, y + 0.84], [0.13, 0.09, 0.035, y + 0.9], [0.13, 0.09, 0.035, y + 1.56], [0.11, 0.07, 0.03, y + 1.61]], 1, body, A.PAINT, 3);
  dq(B, F, 0.095, -0.095, y + 1.36, y + 1.5, 0.094, body, A.dec(10));                                             // pantalla
  dq(B, F, 0.09, -0.01, y + 1.2, y + 1.3, 0.094, body, A.dec(6));                                                 // ranura de monedas y tique
  quad(B, F, -0.04, y + 1.235, 0.094, -0.085, y + 1.235, 0.094, -0.085, y + 1.265, 0.094, -0.04, y + 1.265, 0.094, [40, 220, 90], K.FURN, A.LED);   // botón
  dq(B, F, 0.1, -0.1, y + 0.94, y + 1.15, 0.094, [226, 226, 222], A.dec(4));                                      // instrucciones
  dq(B, F, -0.1, 0.1, y + 1.1, y + 1.5, -0.094, [226, 226, 222], A.dec(4));
  slab(B, F, [-0.07, y + 1.63], [0.07, y + 1.72], 0.14, 0.14, 0.015, [22, 26, 44], A.GLOSS);                      // placa solar (inclinada a lo largo de la acera)
}

// moto (escúter) aparcada: F con +u hacia delante. col = color de la carrocería
const MOTO = [[226, 226, 222], [30, 30, 33], [168, 26, 30], [118, 122, 128], [38, 72, 132], [150, 196, 180], [224, 168, 30]];
function scooter(B, A, F, y, col) {
  const blk = [22, 22, 24], gry = [150, 150, 155], seat = [34, 34, 37];
  if (A.lod < 2) {
    for (const w of [-0.62, 0.62]) fbox(B, F, w - 0.2, w + 0.2, y + 0.02, y + 0.42, -0.05, 0.05, blk, A.RUBBER);
    slab(B, F, [0.44, y + 0.26], [0.33, y + 1.02], 0.19, 0.15, 0.07, col, A.GLOSS);
    fbox(B, F, -0.82, 0.4, y + 0.28, y + 0.36, -0.16, 0.16, blk, A.MATTE);
    fbox(B, F, -0.85, 0, y + 0.36, y + 0.69, -0.16, 0.16, col, A.GLOSS);
    fbox(B, F, -0.76, -0.04, y + 0.69, y + 0.79, -0.11, 0.11, seat, A.RUBBER); return; }
  const T = (pts, r, c, aux, sides, o) => tube(B, F, pts.map(p => [p[0], y + p[1], p[2] || 0]), r, sides || 4, c, K.FURN, Object.assign({ aux }, o));
  for (const w of [-0.62, 0.62]) { const ring = [];
    for (let k = 0; k < 9; k++) { const a = k / 9 * 6.2832; ring.push([w + Math.cos(a) * 0.168, 0.223 + Math.sin(a) * 0.168]); }
    T(ring, 0.055, blk, A.RUBBER, 4, { closed: true });                                    // neumático
    T([[w, 0.223, -0.045], [w, 0.223, 0.045]], 0.118, gry, A.STEEL, 6, { caps: true }); }  // llanta
  slab(B, F, [-0.14, y + 0.3], [0.43, y + 0.3], 0.17, 0.17, 0.08, blk, A.MATTE);           // plataforma
  slab(B, F, [0.44, y + 0.26], [0.34, y + 0.97], 0.2, 0.15, 0.06, col, A.GLOSS);           // escudo
  T([[0.44, 0.4], [0.56, 0.47], [0.72, 0.45], [0.81, 0.34]], 0.062, col, A.GLOSS, 3);      // guardabarros delantero
  for (const sd of [-0.075, 0.075]) T([[0.62, 0.223, sd], [0.5, 0.6, sd]], 0.018, gry, A.STEEL, 3);   // horquilla
  loft(B, F, 0.31, 0, [[0.07, 0.13, 0.04, y + 0.95], [0.09, 0.16, 0.05, y + 1.02], [0.06, 0.11, 0.04, y + 1.09]], 1, col, A.GLOSS, 3);   // careta del manillar
  quad(B, F, 0.403, y + 0.975, -0.07, 0.403, y + 0.975, 0.07, 0.403, y + 1.05, 0.07, 0.403, y + 1.05, -0.07, [238, 238, 228], K.FURN, A.GLOSS);   // faro
  T([[0.3, 1.09, -0.33], [0.3, 1.09, 0.33]], 0.014, gry, A.STEEL, 3);                      // manillar, puños y retrovisores
  for (const sd of [-1, 1]) { T([[0.3, 1.09, sd * 0.24], [0.3, 1.09, sd * 0.35]], 0.02, blk, A.RUBBER);
    T([[0.3, 1.09, sd * 0.2], [0.26, 1.3, sd * 0.29]], 0.008, blk, A.MATTE, 3);
    quad(B, F, 0.255, y + 1.27, sd * 0.29 - 0.06, 0.255, y + 1.27, sd * 0.29 + 0.06, 0.255, y + 1.35, sd * 0.29 + 0.06, 0.255, y + 1.35, sd * 0.29 - 0.06, [60, 66, 74], K.FURN, A.STEEL); }
  T([[0.0, 0.44], [-0.3, 0.5], [-0.6, 0.55], [-0.85, 0.6]], t => 0.19 - 0.08 * t * t, col, A.GLOSS, 8, { caps: true });      // cuerpo trasero, abombado y más fino hacia la cola
  T([[-0.06, 0.665], [-0.4, 0.695], [-0.74, 0.735]], t => 0.115 - 0.03 * t, seat, A.RUBBER, 5, { caps: true });             // asiento
  quad(B, F, -0.854, y + 0.58, -0.06, -0.854, y + 0.58, 0.06, -0.854, y + 0.65, 0.06, -0.854, y + 0.65, -0.06, [170, 18, 20], K.FURN, A.GLOSS);     // piloto trasero
  slab(B, F, [-0.76, y + 0.5], [-0.93, y + 0.33], 0.07, 0.07, 0.02, blk, A.MATTE);         // guardabarros trasero y matrícula (en blanco)
  quad(B, F, -0.862, y + 0.447, -0.06, -0.862, y + 0.447, 0.06, -0.932, y + 0.377, 0.06, -0.932, y + 0.377, -0.06, [232, 232, 226], K.FURN, A.PAINT);
  T([[-0.2, 0.2, -0.16], [-0.78, 0.3, -0.19]], 0.045, gry, A.STEEL, 5, { caps: true });   // escape
  T([[0.0, 0.26, 0.05], [-0.05, 0.02, 0.2]], 0.012, gry, A.STEEL, 3);                      // pata
}

// ------------------------------------------------------------------ material del charco de luz de las farolas (mezcla alfa)
const VS_POOL = `precision highp float;
attribute vec3 position; attribute vec2 uv; uniform mat4 world; uniform mat4 viewProjection;
varying vec3 vPos; varying vec2 vUv;
void main(){ vec4 wp = world*vec4(position, 1.0); vPos = wp.xyz; vUv = uv; gl_Position = viewProjection*wp; }`;
// En HDR el charco MULTIPLICA lo que ya hay pintado (mezcla DST_COLOR, ZERO sobre el búfer lineal): 1 + luz cálida, como una
// luz de verdad (el dibujo del suelo se conserva y un suelo claro se ilumina más que uno oscuro). Por eso esta rama escribe
// el factor a mano en vez de pasar por FRAGA. En LDR (sin búfer flotante no se puede pasar de 1) queda la mezcla alfa de antes.
const FS_POOL = `varying vec2 vUv;
void main(){
  float f = max(0.0, 1.0 - dot(vUv, vUv)), a = smoothstep(0.05, 0.3, uDusk)*f*f*(0.45 + 0.55*f);
  // FIX2: visto desde arriba (cámara a más de ~25 m sobre el charco), menos de la mitad: desde el aire las aceras con poca
  // copa encima eran franjas encendidas. A pie de calle no cambia
  a *= mix(1.0, 0.4, smoothstep(25.0, 140.0, uCam.y - vPos.y));
  if (a < 0.004) discard;
#ifdef LDR
  FRAGA(emit(vec3(1.0, 0.8, 0.5), 0.85), a*0.6);
#else
  gl_FragColor = vec4(1.0 + vec3(1.0, 0.56, 0.12)*(a*7.0*(1.0 + 0.8*smoothstep(0.3, 1.0, uDusk))), 1.0);
#endif
}`;

// `parts` deja las piezas a mano para pruebas sin navegador (contar triángulos: ver DESARROLLO.md §9)
// FIX3: campo de vuelo del aeropuerto (ficha aero_campo, como aeroIn del preludio de app.js): rodajes y viales sin farolas
function aeroIn(x, z) { const dx = x - 5089, dz = z - 3984, a = dx * 0.4067 - dz * 0.9135, b = dx * 0.9135 + dz * 0.4067; return Math.abs(a) < 1050 && Math.abs(b) < 1870; }
window.BCN_FURNITURE = { log: LOG, parts: { lamp, bin, bench, container, iglu, bike, dock, totem, signal, bollard, mailbox, meter, scooter, MOTO, loft, cdec, slab, levels: [AS, AH] }, init(ctx) {
  const { SEG } = ctx, { walkY, roadY, nearestCar, coverAt } = ctx.city;
  for (const m of ctx.detail.mats) m.setVector2('uFurnHi', new BABYLON.Vector2(HI[0], HI[1]));
  const poolMat = ctx.mkMat('farolaLuz', VS_POOL, FS_POOL, ['position', 'uv'], [], [], { blend: true });
  // después del observador de mkMat (que pone la mezcla alfa): en HDR, color = destino × fuente y el alfa del búfer no se toca
  poolMat.onBindObservable.add(() => { if (ctx.out.hdr) ctx.engine.alphaState.setAlphaBlendFunctionParameters(0x0306, 0, 0, 1); });

  // reparto de los objetos de una celda en el nivel de acabados A. Las dos pasadas (sencilla y detalle) siembran los mismos
  // ámbitos y sacan los mismos números: los objetos caen en el mismo sitio
  function place(cell, A) {
    const hi = A.lod === 2, { W, ox, oz, inCell, nearJ, freeWalk } = cell;
    // G1V2: ocupación de la acera. Nada se monta sobre otra pieza ni dentro de un alcorque: cada pieza guarda su radio y la
    // siguiente se aparta (farolas: se corren a lo largo de la calle) o no se pone. Primero se reservan los semáforos y los
    // bolardos del cruce (mandan ellos), luego farolas, papeleras, bancos, buzones y parquímetros. Las dos pasadas (sencilla
    // y detalle) hacen lo mismo en el mismo orden, así que las piezas siguen cayendo en el mismo sitio
    const occ = [], take = (x, z, r) => { occ.push(x, z, r); };
    const busy = (x, z, r) => { for (let i = 0; i < occ.length; i += 3) if ((occ[i] - x) ** 2 + (occ[i + 1] - z) ** 2 < (r + occ[i + 2] + 0.45) ** 2) return true;
      return !!cell.treeNear && cell.treeNear(x, z, r + 0.75); };
    const fr = (x, z, a) => ({ x: x - ox, z: z - oz, tx: Math.cos(a), tz: Math.sin(a), nx: -Math.sin(a), nz: Math.cos(a) });
    const log = (t, x, z, a) => { if (LOG && !hi) LOG.push([t, Math.round(x * 10) / 10, Math.round(z * 10) / 10, Math.round(a * 100) / 100]); };
    // semáforos y bolardos de los extremos de tramo que llegan a un cruce (emit: 0 y 1, solo reservan su sitio; 2, los pone)
    const okX = new Set(), kX = (x, z) => Math.round(x * 20) + ',' + Math.round(z * 20);
    const cross = (seg, emit) => { const { s, hw, tx, tz, px, pz, L, ang } = seg;
      // semáforos: en los extremos de tramo que llegan a un cruce, a la derecha de quien llega y antes del paso de cebra;
      // y bolardos en el bordillo, flanqueando el paso de cebra
      if (hw >= 3) for (const [e, dir] of [[0, 1], [2, -1]]) {
        const o = s * 6, jx = SEG[o + e], jz = SEG[o + e + 1], jk = cell.jKey(jx, jz); if (!cell.Jset.has(jk)) continue;
        let back = 3; for (const j of cell.J) if (cell.jKey(j[0], j[1]) === jk) for (const s2 of j[2]) if (s2 !== s) back = Math.max(back, SEG[s2 * 6 + 4] + 2.2);
        if (back + 4 > L) continue;
        const ux = tx * dir, uz = tz * dir;
        for (const [b, sd] of [[back - 0.45, 1], [back - 0.45, -1], [back + 4.45, -1]]) { const qb = (hw + 0.42) * sd, x = jx + ux * b + px * dir * qb, z = jz + uz * b + pz * dir * qb;
          if (!inCell(x, z)) continue; const ns = freeWalk(x, z); if (ns < -1) continue;
          if (emit === 1) { if (!busy(x, z, 0.12)) { take(x, z, 0.12); okX.add(kX(x, z)); } continue; } if (emit === 0 || !okX.has(kX(x, z))) continue;
          bollard(W, A, fr(x, z, 0), walkY(ns, x, z) - 0.02); log('bolardo', x, z, 0); }
        const q = hw + 0.55, x = jx + ux * (back + 4.5) + px * dir * q, z = jz + uz * (back + 4.5) + pz * dir * q;
        if (!inCell(x, z)) continue; const ns = freeWalk(x, z); if (ns < -1) continue;
        if (emit === 0) { take(x, z, 0.3); okX.add(kX(x, z)); continue; } if (emit === 1 || !okX.has(kX(x, z))) continue;
        const a = Math.atan2(-ux, uz);
        signal(W, A, fr(x, z, a), walkY(ns, x, z) - 0.02, Math.floor((ang + 12.5664) / 1.5708) % 2 === 0); log('semaforo', x, z, a);
      }
    };
    // reserva: 0 = semáforos, 1 = bolardos que no pisen un semáforo (ni otro bolardo de la esquina de al lado); luego, al emitir, solo los reservados
    for (const ph of [0, 1]) cell.forEachSeg(seg => { if (FURN.has(seg.cls) && seg.hw >= 2) cross(seg, ph); });
    cell.forEachSeg(seg => {
      const { s, cls, hw, ax, az, tx, tz, px, pz, L, ang, along } = seg;
      if (!FURN.has(cls) || hw < 2) return;
      const out = side => side > 0 ? ang : ang + Math.PI;    // ángulo del marco cuyo +d mira hacia el lado `side` de la calle
      // farolas: cada 24 m alternando acera, con brazo sobre la calzada y su charco de luz
      along(24, 5, (u0, n) => { const side = n % 2 ? 1 : -1, off = hw + 0.5;
        let u = u0, x = 0, z = 0, ns = -2;                    // G1V2: si el sitio está ocupado (alcorque, semáforo…), se corre hasta 3 m
        for (const du of [0, 1.5, -1.5, 3, -3]) { u = u0 + du; if (u < 0 || u > L) continue; x = ax + tx * u + px * side * off; z = az + tz * u + pz * side * off;
          if (!inCell(x, z) || nearJ(x, z, 6) || aeroIn(x, z)) return; ns = freeWalk(x, z); if (ns >= -1 && !busy(x, z, 0.25)) break; ns = -2; }
        if (ns < -1) return; take(x, z, 0.25);
        const y = walkY(ns, x, z) - 0.02, H = hw > 6 ? 9.5 : 7.8, reach = Math.min(1.9, hw * 0.45);
        lamp(W, A, fr(x, z, out(-side)), y, H, reach); log('farola', x, z, out(-side));
        if (hi || !cell.pools) return;
        // charco: tres bandas a lo ancho (calzada, acera propia y, si llega, la de enfrente), cada una a su cota. uv = metros desde la luminaria / radio
        const lo = off - reach, Rp = Math.min(7.5, H * 0.8), bands = [[Math.max(lo - Rp, -hw), hw - 0.02, 0], [hw + 0.02, lo + Rp, 1], [lo - Rp, -hw - 0.02, 2]];
        for (const [q0, q1, sf] of bands) { if (q1 - q0 < 0.1) continue;
          for (const [du, q] of [[-Rp, q0], [Rp, q0], [Rp, q1], [-Rp, q1]]) { const bx = ax + tx * (u + du) + px * side * q, bz = az + tz * (u + du) + pz * side * q;
            cell.pools.push(bx - ox, sf === 0 ? roadY(s, bx, bz) + 0.05 : walkY(sf === 1 ? ns : s, bx, bz) + 0.03, bz - oz, du / Rp, (q - lo) / Rp); } }
      });
      // papeleras
      along(37, 13, (u, n) => { const side = n % 2 ? -1 : 1, off = hw + 0.6, x = ax + tx * u + px * side * off, z = az + tz * u + pz * side * off;
        if (!inCell(x, z) || nearJ(x, z, 5) || busy(x, z, 0.3)) return; const ns = freeWalk(x, z); if (ns < -1) return; take(x, z, 0.3);
        seed(T_BIN, n, s); const c = R() < 0.6 ? [150, 153, 157] : [84, 88, 92];
        bin(W, A, fr(x, z, out(side)), walkY(ns, x, z) - 0.02, c); log('papelera', x, z, out(side));
      });
      // bancos (solo en aceras anchas), mirando a la calzada
      along(53, 27, (u, n) => { const side = n % 2 ? 1 : -1, off = hw + 2.4, x = ax + tx * u + px * side * off, z = az + tz * u + pz * side * off;
        if (!inCell(x, z) || nearJ(x, z, 8)) return;
        if (freeWalk(x, z) < -1 || coverAt(x + px * side * 1.6, z + pz * side * 1.6, -1) > -1e8) return;
        if (busy(x, z, 1.0) || busy(x + tx * 0.8, z + tz * 0.8, 0.4) || busy(x - tx * 0.8, z - tz * 0.8, 0.4)) return; take(x, z, 1.0);
        const [ns] = nearestCar(x, z);
        bench(W, A, fr(x, z, out(-side)), walkY(ns, x, z) - 0.02); log('banco', x, z, out(-side));
      });
      // batería de contenedores en la banda de aparcamiento, con alguna bolsa de basura al lado
      if ((cls === 4 || cls === 5) && hw >= 3) along(95, 41, (u, n) => {
        seed(T_CONT, n, s);                                   // todo el azar del grupo, de golpe
        const side = R() < 0.5 ? 1 : -1, nc = 3 + Math.floor(R() * 3), nb = Math.floor(R() * 4), bags = [], yaw = [];
        for (let b = 0; b < 3; b++) bags.push([R(-2.5, 2.5), R(0.32, 0.5), R() < 0.6]);
        for (let c = 0; c < 5; c++) yaw.push(R(-0.045, 0.045));
        const off = hw - 1.2, cxp = ax + tx * u + px * side * off, czp = az + tz * u + pz * side * off;
        if (!inCell(cxp, czp) || nearJ(cxp, czp, 14) || u < 5 || u > L - 5) return;
        for (let c = 0; c < nc; c++) {
          const e = (c - (nc - 1) / 2) * 1.85, x = cxp + tx * e, z = czp + tz * e, y = roadY(s, x, z), F = fr(x, z, out(side) + yaw[c]);
          if (c % 5 === 3) iglu(W, A, F, y); else container(W, A, F, y, c % 5);
        }
        log('contenedores', cxp, czp, out(side));
        for (let b = 0; b < nb; b++) { const [e, sz, blk] = bags[b], x = cxp + tx * e + px * side * 1.02, z = czp + tz * e + pz * side * 1.02, y = roadY(s, x, z);
          sphere(W, F0, x - ox, y + sz * 0.4, z - oz, sz * 0.58, hi ? 8 : 6, hi ? 4 : 3, blk ? [25, 25, 28] : [80, 82, 70], K.FURN, hi ? A.GLOSS : A.RUBBER, 0.7); }
      });
      // estación de Bicing en la banda de aparcamiento: viga, anclajes, bicis (entre el 40 y el 70 % de los anclajes) y tótem
      if (cls >= 3 && cls <= 5 && hw >= 3) along(310, 150, (u, n) => {
        seed(T_BICI, n, s);                                   // todo el azar de la estación, de golpe
        const side = R() < 0.5 ? 1 : -1, nd = 9 + Math.floor(R() * 6), frac = R(0.4, 0.7), key = [], jit = [];
        for (let d = 0; d < 14; d++) { key.push(R()); jit.push(R(-0.06, 0.06)); }
        const off = hw - 1.0, cxp = ax + tx * u + px * side * off, czp = az + tz * u + pz * side * off;
        if (!inCell(cxp, czp) || nearJ(cxp, czp, 16) || u < 7 || u > L - 7) return;
        const lim = key.slice(0, nd).sort((a, b) => a - b)[Math.max(0, Math.round(nd * frac) - 1)];   // ocupados: los de clave ≤ lim
        const bang = Math.atan2(pz * side, px * side), dx = px * side * 0.9, dz = pz * side * 0.9;
        for (let d = 0; d < nd; d++) {
          const e = (d - (nd - 1) / 2) * 0.85, x = cxp + tx * e, z = czp + tz * e, y = roadY(s, x, z), on = key[d] <= lim;
          dock(W, A, fr(x + dx, z + dz, out(-side)), y, on);
          if (on) bike(W, A, fr(x, z, bang + jit[d]), y);
        }
        const e = (nd - 1) / 2 * 0.85 + 1.0, x = cxp + tx * e + dx, z = czp + tz * e + dz, y = roadY(s, x, z);
        totem(W, A, fr(x, z, out(side)), y);
        fbox(W, fr(cxp + dx, czp + dz, ang), -nd * 0.425, nd * 0.425, y, y + 0.06, -0.15, 0.15, [84, 86, 90], A.PAINT);
        log('bicing', cxp, czp, bang);
      });
      // buzón amarillo: uno cada 190 m, con la boca hacia la acera
      if (hw >= 3) along(190, 60, (u, n) => { const side = n % 2 ? 1 : -1, off = hw + 0.8, x = ax + tx * u + px * side * off, z = az + tz * u + pz * side * off;
        if (!inCell(x, z) || nearJ(x, z, 9) || busy(x, z, 0.35)) return; const ns = freeWalk(x, z); if (ns < -1) return; take(x, z, 0.35);
        mailbox(W, A, fr(x, z, out(side)), walkY(ns, x, z) - 0.02); log('buzon', x, z, out(side));
      });
      // parquímetros: donde hay banda de aparcamiento, cada 64 m alternando acera, con la pantalla hacia la acera
      if ((cls === 4 || cls === 5) && hw >= 3) along(64, 35, (u, n) => { const side = n % 2 ? -1 : 1, off = hw + 0.55, x = ax + tx * u + px * side * off, z = az + tz * u + pz * side * off;
        if (!inCell(x, z) || nearJ(x, z, 7) || busy(x, z, 0.25)) return; const ns = freeWalk(x, z); if (ns < -1) return; take(x, z, 0.25);
        meter(W, A, fr(x, z, out(side)), walkY(ns, x, z) - 0.02); log('parquimetro', x, z, out(side));
      });
      // motos aparcadas en batería, de culo al bordillo: grupos de 2 a 5 (a 47 m de los contenedores; nunca sobre una estación de Bicing)
      if ((cls === 4 || cls === 5) && hw >= 3) along(95, 88, (u, n) => {
        seed(T_MOTO, n, s);                                   // todo el azar del grupo, de golpe
        const side = R() < 0.5 ? 1 : -1, nm = R() < 0.3 ? 0 : 2 + Math.floor(R() * 4), ms = [];
        for (let m = 0; m < 5; m++) ms.push([Math.floor(R() * MOTO.length), R(-0.09, 0.09), R(-0.12, 0.12)]);
        const off = hw - 1.05, cxp = ax + tx * u + px * side * off, czp = az + tz * u + pz * side * off, mb = ((seg.a0 + u - 150) % 310 + 310) % 310;
        if (!nm || mb < 11 || mb > 299 || !inCell(cxp, czp) || nearJ(cxp, czp, 12) || u < 4 || u > L - 4) return;
        const bang = Math.atan2(-pz * side, -px * side);
        for (let m = 0; m < nm; m++) { const e = (m - (nm - 1) / 2) * 0.86, q = ms[m][2], x = cxp + tx * e + px * side * q, z = czp + tz * e + pz * side * q;
          scooter(W, A, fr(x, z, bang + ms[m][1]), roadY(s, x, z), MOTO[ms[m][0]]); }
        log('motos', cxp, czp, bang);
      });
      cross(seg, 2);
    });
  }

  return { build: cell => place(cell, AS), buildHi: cell => place(cell, AH), hiRange: HI, poolMat };
} };
})();
