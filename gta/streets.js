/* GTA Barcelona — Calles de detalle: NÚCLEO.
   Lleva la calle de «Transeúnte» a toda la ciudad, siguiendo la topografía real:
     · aceras de panot de 20×20 cm (el mismo generador de Transeúnte), bordillo de granito de 15 cm,
       plazas y calles peatonales enlosadas, alcorques con reja;
     · árboles de calle de siete especies (trees.js: plátano, almez, naranjo, palmera —Washingtonia y Phoenix—, jacaranda, tipuana, pino), cada
       una en tres niveles: árbol completo con ramas y hojas (cerca), copa de tarjetas (media distancia) e impostor
       (lejos), todos con instancias; la especie se elige por calle o tramo según el barrio y el ancho;
     · mobiliario (furniture.js) y marcas viales (ground.js), que se enganchan aquí por celda.
   El asfalto (también de Transeúnte) va en el shader de calzada de app.js y cubre toda la ciudad.
   Igual que las fachadas: de lejos la ciudad simple, de cerca el detalle, construido por celdas en segundo plano.
   Este fichero es el núcleo: texturas, shaders de acera y de árbol, campo de aceras y atlas, malla de acera y bordillo,
   árboles e instancias, celdas y streaming. Contrato del contexto de celda (cell, seg): DESARROLLO.md §6. */
(function () {
'use strict';
const { GB, seedRaw, R, hash2 } = window.BCN_GEO;   // seedRaw: las texturas y el árbol son secuencias heredadas de Transeúnte

const PED = new Set([7, 9, 15, 16]);                        // peatonales, caminos y escaleras: enlosado
const TREE = new Set([2, 3, 4, 5, 6]);                      // calles arboladas (si la acera es estrecha, el control de fachada los descarta)

window.BCN_STREETS = { init: async function (ctx) {
  const { scene, engine, mkMat, reg, SEG, blobURL } = ctx;
  const { ROADS, CS, NX, NZ, CAR, WALK, WSW, coverAt, nearestCar, roadY, walkY, ALL, bget, inside } = ctx.city;   // índices y consultas de facades.js
  const { matB, mkMesh: mkMeshFrom } = ctx.detail;                                  // el mobiliario usa el shader de detalle

  // ---------------------------------------------------------------- texturas
  const tex = async (f) => { const t = new BABYLON.Texture(await blobURL('data/' + f), scene, false, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
    t.wrapU = t.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE; t.anisotropicFilteringLevel = 8; return t; };
  const [tGrD, tGrN, tBkD, tBkN] = await Promise.all(['st_granite_d.webp', 'st_granite_n.webp', 'st_bark_d.webp', 'st_bark_n.webp'].map(tex));

  // panot: el mismo generador procedural de Transeúnte (baldosa de 20×20 cm con relieve)
  const [tPanD, tPanN] = (() => {
    seedRaw(1906);
    const S = 512, e = new Float32Array(S * S), col = new Uint8Array(S * S * 4), nrm = new Uint8Array(S * S * 4);
    const r = 0.31, o = 0.285, a = 0.365, h = 0.05, gs = (f, w = h) => Math.exp(-(f * f) / (w * w));
    const d = new Float32Array(4096).map(() => R());
    const vn = (f, g) => { const m = Math.floor(f), q = Math.floor(g), x = f - m, v = g - q, y = d[(q & 63) * 64 + (m & 63)], T = d[(q & 63) * 64 + (m + 1 & 63)], Sx = d[(q + 1 & 63) * 64 + (m & 63)], M = d[(q + 1 & 63) * 64 + (m + 1 & 63)], b = x * x * (3 - 2 * x), N = v * v * (3 - 2 * v);
      return (y * (1 - b) + T * b) * (1 - N) + (Sx * (1 - b) + M * b) * N; };
    for (let f = 0; f < S; f++) for (let _ = 0; _ < S; _++) {
      const m = (_ + 0.5) / S * 2 - 1, g = (f + 0.5) / S * 2 - 1, x = Math.hypot(m, g); let v = gs(x - r), y = 0;
      for (const [Rr, A] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) { const C = Math.hypot(m - Rr * a, g - A * a); if (x > r - 0.01) { v = Math.max(v, gs(C - o)); if (C < o) y = 1; } }
      const T = 1 - Math.max(Math.abs(m), Math.abs(g)), Sg = Math.min(1, T / 0.05), M = Math.exp(-((T - 0.1) * (T - 0.1)) / 35e-5) * 0.22, b = (vn(_ / 3, f / 3) - 0.5) * 0.1 + (vn(_ * 0.9, f * 0.9) - 0.5) * 0.06;
      e[f * S + _] = Sg * (1 - v * 1.5 - M) + b;
      const N = 158 + (vn(_ / 18, f / 18) - 0.5) * 26 + (R() - 0.5) * 18 - v * 62 - M * 40 - (1 - Sg) * 76 + y * 3 + (R() > 0.985 ? -30 : 0), L = (f * S + _) * 4;
      col[L] = N + 2; col[L + 1] = N - 1; col[L + 2] = N - 7; col[L + 3] = 255;
    }
    const pe = (f, _) => e[((_ + S) % S) * S + (f + S) % S];
    for (let f = 0; f < S; f++) for (let _ = 0; _ < S; _++) {
      const m = -(pe(_ + 1, f) - pe(_ - 1, f)) * 4.2, g = -(pe(_, f + 1) - pe(_, f - 1)) * 4.2, x = Math.hypot(m, g, 1), v = (f * S + _) * 4;
      nrm[v] = (m / x * 0.5 + 0.5) * 255; nrm[v + 1] = (g / x * 0.5 + 0.5) * 255; nrm[v + 2] = (1 / x * 0.5 + 0.5) * 255; nrm[v + 3] = 255;
    }
    const mk = data => { const t = BABYLON.RawTexture.CreateRGBATexture(data, S, S, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
      t.wrapU = t.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE; t.anisotropicFilteringLevel = 8; return t; };
    return [mk(col), mk(nrm)];
  })();

  // hojas e impostores de las siete especies (trees.js): un atlas de hojas por especie y nivel, y una silueta lejana
  const TR = window.BCN_TREES, NSP = TR.SP.length;
  function canvasTex(cv) {
    const g = cv.getContext('2d'), im = g.getImageData(0, 0, cv.width, cv.height), a = im.data; let r = 0, gg = 0, b = 0, n = 0;
    for (let i = 0; i < a.length; i += 4) if (a[i + 3] > 200) { r += a[i]; gg += a[i + 1]; b += a[i + 2]; n++; }
    for (let i = 0; i < a.length; i += 4) if (a[i + 3] < 30) { a[i] = r / n; a[i + 1] = gg / n; a[i + 2] = b / n; }
    const t = BABYLON.RawTexture.CreateRGBATexture(new Uint8Array(a.buffer), cv.width, cv.height, scene, true, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
    t.hasAlpha = true; t.anisotropicFilteringLevel = 4; return t;
  }

  const tLeafN = [], tLeafF = [], tImp = [];
  for (let k = 0; k < NSP; k++) { tLeafN.push(canvasTex(TR.leafCanvas(k, false))); tLeafF.push(canvasTex(TR.leafCanvas(k, true))); tImp.push(canvasTex(TR.impCanvas(k))); }

  // ---------------------------------------------------------------- materiales
  const VS_WALK = `precision highp float;
attribute vec3 position; attribute vec2 uv; uniform mat4 world; uniform mat4 viewProjection;
varying vec3 vPos; varying vec3 vLoc; varying vec2 vUV;
void main(){ vec4 wp = world*vec4(position,1.0); vPos = wp.xyz; vLoc = position; vUV = uv; gl_Position = viewProjection*wp; }`;
  const FS_WALK = `
varying vec3 vLoc; varying vec2 vUV;
uniform vec2 uFade; uniform vec2 uSF; uniform sampler2D tField; uniform sampler2D tKind; uniform sampler2D tPanD; uniform sampler2D tPanN; uniform sampler2D tGrD; uniform sampler2D tGrN;
// SUELOS (día 3): relieve de las baldosas propias (altura 0 en la junta, 1 en la cara de la pieza)
// hexagonal del Passeig de Gràcia (25 cm entre caras): amonite, estrella de mar y alga, en relieve, como en el panot de Gaudí
// G1S3: paseo central de La Rambla (Canaletes → Liceu → Colom, en coordenadas del mundo): s a lo largo, t de través
vec3 ramblaST(vec2 w){
  vec2 A = vec2(12194.9, 13909.7), B = vec2(12490.6, 13357.2), C = vec2(12828.6, 12837.7);
  vec2 d1 = B - A, d2 = C - B; float L1 = length(d1), L2 = length(d2); d1 /= L1; d2 /= L2;
  float s1 = clamp(dot(w - A, d1), -30.0, L1), s2 = clamp(dot(w - B, d2), 0.0, L2 + 30.0);
  float t1 = dot(w - A, vec2(-d1.y, d1.x)), t2 = dot(w - B, vec2(-d2.y, d2.x));
  float e1 = length(w - A - d1*s1), e2 = length(w - B - d2*s2);
  return e1 < e2 ? vec3(s1, t1, e1) : vec3(L1 + s2, t2, e2);
}
float hexH(vec2 P){
  vec2 p = P/0.25, r = vec2(1.0, 1.7320508), hh = r*0.5;
  vec2 a = mod(p, r) - hh, b = mod(p - hh, r) - hh, g = dot(a, a) < dot(b, b) ? a : b;
  float hd = max(dot(abs(g), vec2(0.5, 0.8660254)), abs(g).x);
  float h = smoothstep(0.495, 0.465, hd);
  vec2 q = g - vec2(0.0, 0.21); float rr = length(q), th = atan(q.y, q.x);
  float am = (1.0 - smoothstep(0.17, 0.19, rr))*smoothstep(0.18, 0.32, abs(fract(rr*13.0 - th/6.2832) - 0.5));
  q = g - vec2(-0.182, -0.105); rr = length(q); th = atan(q.y, q.x);
  float sf = 1.0 - smoothstep(-0.015, 0.015, rr - 0.13*(0.42 + 0.58*pow(0.5 + 0.5*cos(5.0*th + 1.57), 1.6)));
  q = g - vec2(0.182, -0.105); rr = length(q);
  float al = (1.0 - smoothstep(0.15, 0.17, rr))*smoothstep(0.25, 0.5, abs(fract(q.x*9.0 + sin(q.y*26.0)*0.35) - 0.5)*2.0);
  return h*(1.0 - 0.32*max(max(am, sf), al));
}
// losa de la Diagonal: piezas de 40×40 cm con cuatro estrías a 45° que cambian de sentido en cada pieza
float diaH(vec2 P){
  vec2 p = P/0.4, id = floor(p), f = fract(p);
  float e = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
  float dd = mod(id.x + id.y, 2.0) < 0.5 ? f.x + f.y : f.x - f.y + 1.0;
  float gr = smoothstep(0.06, 0.13, abs(fract(dd*2.0) - 0.5));
  return smoothstep(0.004, 0.018, e)*(0.72 + 0.28*gr);
}
void main(){
  vec3 V = uCam - vPos; float dist = length(V); V /= dist;
  if (dith() < smoothstep(uFade.x, uFade.y, dist)) discard;
  vec2 P = vLoc.xz;
  float nearN = 1.0 - smoothstep(4.0, 70.0, dist);
  vec3 alb; vec3 N = vec3(0.0, 1.0, 0.0);
  if (vUV.x < -0.5) {                                   // cara vertical del bordillo de granito
    vec3 n = normalize(cross(dFdx(vLoc), dFdy(vLoc))); if (dot(n, V) < 0.0) n = -n;
    vec3 tx = texture2D(tGrD, vec2(P.x + P.y, vLoc.y)*0.45).rgb;
    // SUELOS: uv.x = −(2 + modelo + 0,9·desgaste): granito más claro y limpio en lo nuevo, oscuro y con mugre abajo en lo dejado
    float cm = max(-vUV.x - 2.0, 0.0), cmd = floor(cm + 0.001), cwr = fract(cm + 0.001)/0.9;
    vec3 cb = cmd > 4.5 ? vec3(0.66, 0.66, 0.65) : cmd > 3.5 ? vec3(0.56, 0.55, 0.52) : cmd > 0.5 ? vec3(0.63, 0.62, 0.60) : vec3(0.58, 0.57, 0.55);
    alb = cb*mix(0.7, 1.25, dot(tx, vec3(0.33))*1.8)*mix(mix(0.55, 0.35, cwr), 1.0, vUV.y);
    alb *= 1.0 - 0.25*cwr*smoothstep(0.55, 0.8, vnoise(P*3.0 + vLoc.y*2.0));
    FRAG(lit(alb, n)); return;
  }
  vec4 f = texture2D(tField, vUV);
  float dA = f.r*12.75 - 2.0, pv = (f.g*255.0 - 128.0)/20.0;
  if (dA < 0.0 || pv < 0.0) discard;
  float n1 = vnoise(P*0.21)*0.5 + vnoise(P*0.02)*0.5, n2 = vnoise(P*0.93), n1g = vnoise(P*0.06 + 3.1);
  // SUELOS: modelo de acera (0 panot de flor · 1 hexagonal del Passeig de Gràcia · 2 Diagonal · 3 panot nuevo · 4 panot dejado ·
  // 5 losas grandes) y desgaste 0–1, por tramo (suelos.js), en un atlas aparte sin filtrar
  vec4 kd = texture2D(tKind, vUV); float mdl = floor(kd.r*255.0/40.0 + 0.5), wr = kd.g;
  if (uSF.y > 0.5) { mdl = uSF.y - 1.0; wr = clamp((uSF.x - 1.0)/4.0, 0.0, 1.0); }   // muestras forzadas (depuración, S3)
  float tfw0 = fwidth(P.x) + fwidth(P.y);
  if (mdl > 5.5) {                                      // REV4: arcén de tierra y grava (carreteras de montaña)
    vec3 tx = texture2D(tGrD, P*0.9).rgb; float gr = vnoise(P*7.0), gc = vnoise(P*0.35);
    alb = vec3(0.50, 0.43, 0.33)*mix(0.78, 1.12, gc)*mix(0.85, 1.12, gr)*mix(0.9, 1.1, dot(tx, vec3(0.33))*1.8);
    alb = mix(alb, vec3(0.30, 0.33, 0.20), 0.45*smoothstep(0.6, 1.3, dA)*smoothstep(0.4, 0.75, vnoise(P*0.6 + 2.0)));   // matas en el borde
    alb *= mix(0.86, 1.0, smoothstep(0.0, 0.25, dA));
  } else if (dA < 0.3) {                                // bordillo: pieza de granito de 30 cm
    vec3 tx = texture2D(tGrD, P*0.6).rgb;
    alb = (mdl > 4.5 ? vec3(0.67, 0.67, 0.66) : mdl > 3.5 ? vec3(0.56, 0.55, 0.52) : mdl > 0.5 ? vec3(0.64, 0.63, 0.60) : vec3(0.60, 0.59, 0.56))*mix(0.72, 1.2, dot(tx, vec3(0.33))*1.8);
    alb *= 1.0 - 0.22*wr*smoothstep(0.5, 0.8, vnoise(P*2.3));
    alb *= mix(0.75, 1.0, smoothstep(0.0, 0.05, dA));   // canto redondeado
    alb *= mix(0.92, 1.0, step(0.04, fract(dot(P, vec2(0.7071))*1.0)));   // juntas
  } else if (f.b > 0.5) {                               // plaza o calle peatonal: losas de granito
    vec2 gP = P/2.5; float gB = smoothstep(0.42, 0.62, vnoise(P*0.02));
    vec3 tx = mix(texture2D(tGrD, gP).rgb, texture2D(tGrD, gP.yx*0.75 + vec2(0.31, 0.17)).rgb, gB);
    // FIX2: granito algo menos claro y con rodilla en los tonos más altos (las plazas abiertas salían blancas quemadas al sol)
    alb = tx*1.5*mix(0.74, 1.12, n1)*mix(0.88, 1.08, n2);
    alb = min(alb, vec3(0.50) + 0.4*(alb - vec3(0.50)));
    alb *= 1.0 - 0.22*wr*smoothstep(0.45, 0.8, n1g);
    vec3 tn = texture2D(tGrN, gP).xyz*2.0 - 1.0; N = normalize(mix(N, vec3(tn.x, tn.z, tn.y), nearN));
    // G1S3: La Rambla, panot de ondas (las olas blancas y grises que cruzan el paseo de lado a lado), baldosa de 33 cm
    vec3 rs = ramblaST(vPos.xz);
    if (rs.z < 12.0) {
      float wv = (rs.x + 0.55*sin(rs.y*0.85) + 0.18*sin(rs.y*2.3 + 1.0))/0.66, fwv = fwidth(wv) + 1e-4;
      float band = smoothstep(0.5 - fwv, 0.5 + fwv, abs(fract(wv) - 0.5)*2.0), lw = 1.0 - smoothstep(0.15, 0.6, fwv);
      vec2 tq = fract(vPos.xz/0.33); float tj = smoothstep(0.0, 0.03, min(min(tq.x, 1.0 - tq.x), min(tq.y, 1.0 - tq.y)));
      vec3 wa = mix(vec3(0.60, 0.59, 0.56), vec3(0.47, 0.47, 0.46), mix(0.5, band, lw))*mix(0.85, 1.07, n1)*mix(0.93, 1.05, n2);
      wa *= mix(1.0, mix(0.82, 1.0, tj), lw*nearN)*(1.0 - 0.18*wr*smoothstep(0.45, 0.8, n1g));
      alb = mix(alb, wa, 1.0 - smoothstep(9.0, 12.0, rs.z));
    }
  } else if (abs(mdl - 1.0) < 0.5 || abs(mdl - 2.0) < 0.5) {   // hexagonal del Passeig de Gràcia y losa de la Diagonal
    bool hx = mdl < 1.5;
    float lodT = 1.0 - smoothstep(0.03, 0.12, tfw0), e = 0.012;
    float h0 = hx ? hexH(P) : diaH(P);
    vec3 base = hx ? vec3(0.50, 0.525, 0.505) : vec3(0.57, 0.56, 0.53);
    vec2 cid = hx ? floor(P/0.25) : floor(P/0.4); float hc = hash21(cid);
    alb = base*mix(0.80, 1.10, n1)*mix(0.92, 1.06, n2)*mix(1.0, 0.95 + 0.1*hc, lodT);
    // las juntas y el fondo del relieve se ensucian (más con el desgaste); de lejos, el valor medio
    alb *= mix(0.88, mix(0.62, 1.0, h0), lodT)*(1.0 - 0.25*wr*smoothstep(0.4, 0.8, n1g));
    if (lodT > 0.0 && nearN > 0.0) {
      float hxp = hx ? hexH(P + vec2(e, 0.0)) : diaH(P + vec2(e, 0.0)), hzp = hx ? hexH(P + vec2(0.0, e)) : diaH(P + vec2(0.0, e));
      N = normalize(vec3(-(hxp - h0)/e*0.006, 1.0, -(hzp - h0)/e*0.006)*vec3(lodT*nearN, 1.0, lodT*nearN) + vec3(0.0, 0.0, 0.0));
    }
  } else if (mdl > 4.5) {                               // losas grandes modernas (80×40 cm, a matajuntas), granito gris claro
    vec2 q = P/vec2(0.8, 0.4); q.x += 0.5*mod(floor(q.y), 2.0); vec2 id = floor(q), f = fract(q);
    float e = min(min(f.x, 1.0 - f.x)*0.8, min(f.y, 1.0 - f.y)*0.4), lodT = 1.0 - smoothstep(0.05, 0.2, tfw0);
    vec3 tx = texture2D(tGrD, P*0.7 + hash21(id)*3.0).rgb;
    alb = vec3(0.60, 0.60, 0.59)*mix(0.82, 1.12, dot(tx, vec3(0.33))*1.8)*mix(0.9, 1.06, n1)*mix(1.0, 0.94 + 0.12*hash21(id + 2.0), lodT);
    alb *= mix(0.97, mix(0.55, 1.0, smoothstep(0.002, 0.006, e)), lodT)*(1.0 - 0.2*wr*smoothstep(0.45, 0.8, n1g));
  } else {                                              // panot de 20×20 cm (0 estándar, 3 nuevo y limpio, 4 sucio y dejado)
    vec2 gP = P*5.0; vec3 tx = texture2D(tPanD, gP).rgb;
    float tfw = fwidth(gP.x) + fwidth(gP.y), tileK = 1.0 - smoothstep(0.25, 0.9, tfw);   // de lejos, sin variación por baldosa (evita el muaré)
    bool nu = abs(mdl - 3.0) < 0.5, su = mdl > 3.5;
    alb = tx*mix(nu ? 0.90 : 0.74, nu ? 1.06 : 1.12, n1)*mix(nu ? 0.95 : 0.88, nu ? 1.04 : 1.08, n2);
    if (nu) alb *= vec3(1.22, 1.21, 1.18);              // S3: nuevo, claramente más claro y limpio
    if (su) alb *= vec3(0.80, 0.76, 0.69);              // S3: dejado, más oscuro y pardo
    vec2 cl = floor(gP), tf = fract(gP); float h0 = hash21(cl), rep = step(0.9, vnoise(P*0.08)*0.9 + h0*0.12)*(nu ? 0.0 : 1.0);
    alb *= mix(1.0, mix(nu ? 0.98 : 0.94, nu ? 1.02 : 1.05, h0), tileK); alb = mix(alb, alb*vec3(1.05, 1.03, 0.99), rep*tileK);
    float gum = step(su ? 0.90 : nu ? 0.995 : 0.968, hash21(cl + 7.0))*smoothstep(0.13, 0.06, length(tf - vec2(hash21(cl + 3.0), hash21(cl + 9.0))*0.6 - 0.2)); alb *= 1.0 - gum*0.62*tileK;
    float dirt = smoothstep(mix(0.38, 0.22, wr), 0.75, n1g)*(nu ? 0.35 : 1.0); alb *= mix(1.0, mix(0.74, 0.68, wr), dirt*mix(0.45, smoothstep(0.0, 0.16, 0.5 - max(abs(tf.x - 0.5), abs(tf.y - 0.5)) + dirt*0.12), tileK));
    vec3 tn = texture2D(tPanN, gP).xyz*2.0 - 1.0; tn.xy *= nu ? 1.4 : 1.25; N = normalize(mix(N, vec3(tn.x, tn.z, tn.y), nearN));
    if (su) {
      // manchas de aceite y de humedad, piezas rotas (remiendo de cemento o grieta) y juntas negras
      float st = max(smoothstep(0.52, 0.7, vnoise(P*0.9 + 4.0)), 0.8*smoothstep(0.6, 0.75, vnoise(P*2.7 + 1.0))); alb *= mix(1.0, 0.66, st)*mix(vec3(1.0), vec3(1.0, 0.95, 0.85), st);
      float hb = hash21(cl + 13.0);
      if (hb > 0.94) { alb = mix(alb, dot(alb, vec3(0.33))*vec3(1.08, 1.05, 1.0)*(0.9 + 0.2*vnoise(P*20.0)), tileK); N = mix(N, vec3(0.0, 1.0, 0.0), tileK); }
      else if (hb > 0.86) { vec2 cd = tf - 0.5; float ln = abs(dot(cd, normalize(vec2(hash21(cl + 1.0) - 0.5, 0.6))) + 0.03*sin(cd.x*30.0));
        alb *= 1.0 - 0.6*(1.0 - smoothstep(0.01, 0.03, ln))*tileK; }
      alb *= 1.0 - 0.12*(1.0 - smoothstep(0.02, 0.06, 0.5 - max(abs(tf.x - 0.5), abs(tf.y - 0.5))))*tileK;
    }
  }
  // INT3: la rama del alcorque (f.a > 0.5) se quitó: los alcorques son instancias (ARB4, pitG/pitS) y el campo deja f.a a 0
  vec3 c = lit(alb, N);
  // aura nocturna (uGlow.x): la luz de farola que ya recibe la calzada (FS_ROAD, app.js), sin charcos: más junto al bordillo,
  // donde están los postes, y menos hacia la fachada. Muy cerca se atenúa porque ahí pintan los charcos reales del mobiliario
  if (uGlow.x > 0.001 && aeroIn(vPos.xz) < 0.5) {   // FIX3: sin aura en el campo de vuelo
    float gW = (0.55 + 0.45*exp(-dA/5.0))*mix(0.40, 1.0, smoothstep(40.0, 240.0, dist))*(1.0 - 0.85*smoothstep(200.0, 380.0, vPos.y));
    // FIX2: visto desde arriba (cámara a más de ~25 m sobre la acera) el baño se queda en un 40 %: desde el aire las aceras
    // y ramblas con poca copa encima eran franjas brillantes. A pie de calle (cámara a 1,7 m) no cambia nada
    gW *= mix(1.0, 0.4, smoothstep(25.0, 140.0, uCam.y - vPos.y));
    c += emit(kAura*(min(alb, vec3(0.4))*0.95 + 0.05), gW*0.7*uGlow.x);   // tope: el granito claro de las ramblas no se enciende de más
  }
  FRAG(c);
}`;
  const matW = mkMat('walk', VS_WALK, FS_WALK, ['position', 'uv'], ['uFade', 'uSF'], ['tField', 'tKind', 'tPanD', 'tPanN', 'tGrD', 'tGrN']);
  matW.setVector2('uSF', new BABYLON.Vector2(0, 0));   // FIX3: depuración de S3 apagada
  const VS_TREE = `precision highp float;
attribute vec3 position; attribute vec3 normal; attribute vec2 uv;
#include<instancesDeclaration>
uniform mat4 viewProjection;
varying vec3 vPos; varying vec3 vN; varying vec2 vUV; varying float vH; varying float vHl;
void main(){
#include<instancesVertex>
  vec4 wp = finalWorld*vec4(position, 1.0); vPos = wp.xyz; vN = normalize(mat3(finalWorld)*normal); vUV = uv; vHl = position.y;
  vH = fract(sin(dot(finalWorld[3].xz, vec2(12.9898, 78.233)))*43758.5453);
  gl_Position = viewProjection*wp; }`;
  // farolas de una celda a partir de sus charcos (cc.pools, furniture.js): cada charco son 1–3 quads con uv = (du, q − lo)/Rp,
  // así que el punto uv (0, 0) de cada quad es el pie de la luminaria. Se quedan la cota más alta (la acera) y una por farola
  const LG = ctx.detail.lamps;
  function poolLamps(Q, ox, oz) { const out = [];
    for (let k = 0; k + 20 <= Q.length; k += 20) {
      const P = i => Q.slice(k + i * 5, k + i * 5 + 5), a = P(0), b = P(1), d = P(3);
      const tu = (0 - a[3]) / (b[3] - a[3]), tv = (0 - a[4]) / (d[4] - a[4]);
      const x = a[0] + (b[0] - a[0]) * tu + (d[0] - a[0]) * tv + ox, z = a[2] + (b[2] - a[2]) * tu + (d[2] - a[2]) * tv + oz, y = Math.max(a[1], d[1]);
      const l = out[out.length - 1];
      if (l && Math.abs(l[0] - x) + Math.abs(l[2] - z) < 0.5) l[1] = Math.max(l[1], y); else out.push([x, y, z]); }
    return out; }
  const FS_TREE = `
varying vec3 vN; varying vec2 vUV; varying float vH; varying float vHl;
uniform float uKind; uniform vec4 uBand; uniform vec4 uBark; uniform vec4 uLeaf; uniform vec4 uSp; uniform sampler2D tMap; uniform sampler2D tNrm;
` + LG.glsl + `
// aura nocturna (uGlow.x): las farolas iluminan el árbol desde abajo. vHl = altura local (tronco 0-5,4 m, copa ~5-12 m)
// mucho en el tronco y la panza de la copa, casi nada arriba. De lejos, su valor medio (como la calzada)
float treeGlow(float dist, float ny){
  float s = 1.0 - smoothstep(2.5, 12.0, vHl);
  float w = (0.16 + 0.84*s*s)*mix(1.15, 0.6, clamp(ny*0.5 + 0.5, 0.0, 1.0));
  w = mix(w, 0.40, smoothstep(150.0, 600.0, dist));
  return w*mix(0.55, 1.0, smoothstep(20.0, 160.0, dist))*(1.0 - 0.85*smoothstep(200.0, 380.0, vPos.y))*uGlow.x;
}
void main(){
  vec3 V = uCam - vPos; float dist = length(V); V /= dist;
  float d = dith();
  // fundido entre niveles: visible si la distancia está dentro de la banda [uBand.x→uBand.y … uBand.z→uBand.w]
  if (d < smoothstep(uBand.z, uBand.w, dist) || d >= smoothstep(uBand.x, uBand.y, dist)) discard;
  vec3 tint = mix(vec3(0.86, 0.98, 0.78), vec3(1.12, 1.06, 0.84), vH);
  if (uKind < 0.5) {                                    // corteza (la del plátano, teñida y menos moteada en las otras especies)
    vec3 tx = texture2D(tMap, vUV*vec2(1.0, 0.5)).rgb;
    tx = mix(vec3(dot(tx, vec3(0.33))), tx, uBark.w)*uBark.rgb*mix(0.9, 1.1, vH);
    if (uSp.y > 0.5) {                                  // corteza propia (vUV.x: vuelta al tronco, vUV.y: metros a lo largo)
      vec3 bc;
      if (uSp.y < 1.5) {                                // pino piñonero: placas rojizas separadas por grietas oscuras
        vec2 g = vec2(vUV.x*16.0, vUV.y*3.6); float row = floor(g.y); g.x += hash21(vec2(row, 3.0))*7.0 + vnoise(g*0.7)*0.7;
        vec2 f = fract(g); float h = hash21(floor(g)), e = min(min(f.x, 1.0 - f.x)*1.5, min(f.y, 1.0 - f.y)) + (vnoise(g*3.0) - 0.5)*0.14;
        bc = mix(vec3(0.16, 0.14, 0.13), mix(vec3(0.36, 0.24, 0.18), vec3(0.50, 0.32, 0.23), h)*(0.84 + 0.3*vnoise(g*5.0)), smoothstep(0.04, 0.16, e));
      } else if (uSp.y < 2.5) {                         // Washingtonia: fibra vertical gris parda con anillos tenues
        float sF = vnoise(vec2(vUV.x*90.0, vUV.y*1.5))*0.6 + vnoise(vec2(vUV.x*30.0, vUV.y*0.6))*0.4;
        float ring = smoothstep(0.8, 1.0, abs(sin(vUV.y*8.0 + vnoise(vUV*vec2(8.0, 2.0))*2.0)));
        bc = mix(vec3(0.30, 0.26, 0.21), vec3(0.56, 0.49, 0.40), sF)*(1.0 - 0.22*ring);
      } else {                                          // Phoenix: rombos de las bases de hoja cortadas
        vec2 g = vec2(vUV.x*13.0, vUV.y*3.0), dd = vec2(g.x + g.y, g.x - g.y), f = fract(dd) - 0.5;
        float e = max(abs(f.x), abs(f.y)), h = hash21(floor(dd));
        bc = mix(vec3(0.50, 0.42, 0.31)*(0.84 + 0.26*h)*mix(0.8, 1.05, f.y + 0.5), vec3(0.3, 0.24, 0.18), smoothstep(0.42, 0.49, e))*(0.86 + 0.28*vnoise(g*4.0));
      }
      tx = bc*mix(0.9, 1.1, vH);
    }
    vec3 n = normalize(vN); vec3 tn = texture2D(tNrm, vUV*vec2(1.0, 0.5)).xyz*2.0 - 1.0;
    n = normalize(n + vec3(tn.x, tn.y*0.3, tn.x)*0.45);
    vec3 c = lit(tx*1.35, n);
    if (uGlow.x > 0.001) c += emit(kAura*(tx*0.55 + 0.015), treeGlow(dist, n.y));
    FRAG(c); return;
  }
  vec4 tx = texture2D(tMap, vUV);
  if (tx.a < 0.5) discard;
  // flor (jacaranda): los píxeles lilas del atlas; en los ejemplares sin flor (vH > uSp.x) se vuelven verde de hoja
  float fl = smoothstep(0.0, 0.06, tx.b - tx.g);
  vec3 txc = mix(tx.rgb, vec3(0.42, 0.62, 0.28)*dot(tx.rgb, vec3(0.4)), fl*step(uSp.x, vH));
  fl *= step(vH, uSp.x);
  // de lejos el atlas mezcla flor y hoja (gris azulado): en los ejemplares en flor se empuja hacia el lila
  txc = mix(txc, vec3(0.70, 0.50, 0.92)*dot(txc, vec3(0.36))*1.25, fl*0.55*smoothstep(15.0, 90.0, dist));
  vec3 alb = txc*mix(tint, vec3(1.0), fl*0.7)*uLeaf.rgb*(uKind > 1.5 ? 0.66 : 0.86);
  alb = mix(vec3(dot(alb, vec3(0.3, 0.6, 0.1))), alb, mix(uLeaf.w, 1.0, fl));   // verde menos saturado (la flor, no)
  vec3 n = normalize(vN); if (dot(n, V) < 0.0) n = mix(-n, n, 0.4);
  vec3 c = lit(alb, normalize(n + vec3(0.0, 0.35, 0.0)));
  float bt = pow(max(dot(-V, uSunDir), 0.0), 3.0)*0.85 + max(dot(-n, uSunDir), 0.0)*0.26;
  c += alb*vec3(1.05, 1.2, 0.55)*uSunCol*bt*0.3;
  // luz sobre la copa: la cara de arriba (normal al cielo y al sol) más clara y más cálida, para que desde el aire no sean bolas oscuras
  float top = smoothstep(0.15, 0.85, n.y)*sqrt(max(uSunDir.y, 0.0));
  c += alb*uSunCol*vec3(1.0, 1.05, 0.8)*top*0.32*(1.0 - uNight);
  if (uGlow.x > 0.001) {
    // de noche, vista desde arriba (cámara por encima de la hoja), la copa es una masa casi negra: la farola solo alumbra la cara
    // de abajo (normal hacia abajo) y deja un borde cálido justo encima de cada luminaria (rejilla de farolas). Desde abajo, como antes
    float ab = smoothstep(0.0, 0.12, V.y), ny = uKind > 1.5 ? 0.0 : n.y;
    c *= 1.0 - 0.6*uNight*ab;
    float g = treeGlow(dist, ny)*mix(1.0, 0.06 + 0.5*smoothstep(0.1, -0.6, ny), ab);
    g += ab*min(4.0*lampBath(vPos - vec3(0.0, 9.0, 0.0), vec3(0.0), 1.0/24.5), 1.0)*0.6*uGlow.x;
    c += emit(kAura*(mix(alb, vec3(dot(alb, vec3(0.3, 0.6, 0.1))), 0.6)*2.2 + 0.05), g);
  }
  FRAG(c);
}`;
  const mkTreeMat = (name, kind, map, nrm, sp) => { const m = mkMat(name, VS_TREE, FS_TREE, ['position', 'normal', 'uv'], ['uKind', 'uBand', 'uBark', 'uLeaf', 'uSp'], ['tMap', 'tNrm', 'tLamp']);
    m.setTexture('tLamp', LG.tex); m.setFloat('uKind', kind); m.setTexture('tMap', map); m.setTexture('tNrm', nrm || map); m.setVector4('uBand', new BABYLON.Vector4(0, 0, 1e9, 1e9));
    m.setVector4('uBark', BABYLON.Vector4.FromArray(sp.bark)); m.setVector4('uLeaf', BABYLON.Vector4.FromArray(sp.leaf)); m.setVector4('uSp', new BABYLON.Vector4(sp.fl, sp.bm || 0, 0, 0)); return m; };
  // por especie k: TMAT[k] = { barkN, leafN, barkF, leafF, imp } (mismo programa de sombreado para todas)
  const TMAT = TR.SP.map((sp, k) => ({ barkN: mkTreeMat('barkN' + k, 0, tBkD, tBkN, sp), leafN: mkTreeMat('leafN' + k, 1, tLeafN[k], null, sp), barkF: mkTreeMat('barkF' + k, 0, tBkD, tBkN, sp),
    leafF: mkTreeMat('leafF' + k, 1, tLeafF[k], null, sp), imp: mkTreeMat('imp' + k, 2, tImp[k], null, sp) }));

  // ---------------------------------------------------------------- geometría de las especies (trees.js) e instancias
  const mkGeoMesh = (name, g, mat) => {
    const m = new BABYLON.Mesh(name, scene);
    m.setVerticesData('position', g.P, false); m.setVerticesData('normal', g.N, false); m.setVerticesData('uv', g.U, false); m.setIndices(g.I);
    m.material = mat; m.isPickable = false; m.renderingGroupId = 1; m.alwaysSelectAsActiveMesh = true; m.doNotSyncBoundingInfo = true;
    m.thinInstanceSetBuffer('matrix', new Float32Array(16), 16, false); m.thinInstanceCount = 0;
    return m;
  };
  // TMS[k] = mallas de la especie k (nombres tNB/tNL/tFB/tFL/tI + k: lighting.js separa las cascadas por el prefijo tN/tF)
  const TMS = [], TRIS = [];
  for (let k = 0; k < NSP; k++) { const G = TR.build(k), M = TMAT[k];
    const t = { nearBark: mkGeoMesh('tNB' + k, G.nearBark, M.barkN), nearLeaf: mkGeoMesh('tNL' + k, G.nearLeaf, M.leafN),
      farBark: mkGeoMesh('tFB' + k, G.farBark, M.barkF), farLeaf: mkGeoMesh('tFL' + k, G.farLeaf, M.leafF), imp: mkGeoMesh('tI' + k, G.imp, M.imp) };
    reg(t.nearBark, { cast: true, layer: 'tree' }); reg(t.nearLeaf, { cast: true, alphaTex: tLeafN[k], layer: 'tree' });
    reg(t.farBark, { cast: true, layer: 'tree' }); reg(t.farLeaf, { cast: true, alphaTex: tLeafF[k], layer: 'tree' });
    reg(t.imp, { cast: false, alphaTex: tImp[k], layer: 'imp' });
    TMS.push(t); TRIS.push([(G.nearBark.I.length + G.nearLeaf.I.length) / 3, (G.farBark.I.length + G.farLeaf.I.length) / 3, G.imp.I.length / 3]); }
  // ARB3: plantón (TR.sapling) en cinco mallas: tronco y copita (todos), tutores A (tres) o B (dos) y protector (solo B).
  // Solo nivel cercano (se funde entre 38 y 50 m); nombres tNS* para que lighting.js los ponga en la cascada cercana
  // ARB4: tutores de pino claro con atados de cinta (atlas propio, TR.stakeCanvas) y copa joven verde claro
  const SAPG = TR.sapling(), sapSp = (bark, leaf) => ({ bark, leaf: leaf || TR.SP[0].leaf, fl: 0, bm: 0 });
  const tStake = canvasTex(TR.stakeCanvas()), tFlat = canvasTex(TR.flatCanvas());
  const SAPM = { trunk: mkTreeMat('sapT', 0, tBkD, tBkN, sapSp([0.62, 0.56, 0.47, 0.35])), leaf: mkTreeMat('sapL', 1, tLeafN[0], null, sapSp([1, 1, 1, 1], [1.22, 1.4, 0.86, 0.92])),
    stakesA: mkTreeMat('sapA', 0, tStake, tFlat, sapSp([1, 1, 1, 1])), stakesB: mkTreeMat('sapB', 0, tStake, tFlat, sapSp([1, 1, 1, 1])),
    guard: mkTreeMat('sapG', 0, tBkD, tBkN, sapSp([0.30, 0.31, 0.32, 0])) };
  const SAP = {}; for (const k of ['trunk', 'leaf', 'stakesA', 'stakesB', 'guard']) { SAP[k] = mkGeoMesh('tNS' + k, SAPG[k], SAPM[k]); reg(SAP[k], k === 'leaf' ? { cast: true, alphaTex: tLeafN[0], layer: 'tree' } : { cast: true, layer: 'tree' }); }
  // ARB4: alcorque cuadrado de 1,2 m como instancias propias (marco de piedra, tierra 2 cm hundida con hojarasca; con o sin reja
  // radial de fundición), en todas las posiciones de árbol de calle (adulto y alcorque −1: reja; plantón y −2: tierra).
  // Solo cerca (fundido tramado de 60 a 75 m); el campo de aceras ya no pinta alcorques (canal alfa a 0)
  const PITG = TR.pitGeo(), PITM = [mkTreeMat('pitG', 0, canvasTex(TR.pitCanvas(true)), tFlat, sapSp([1, 1, 1, 1])), mkTreeMat('pitS', 0, canvasTex(TR.pitCanvas(false)), tFlat, sapSp([1, 1, 1, 1]))];
  const PIT = PITM.map((M, k) => reg(mkGeoMesh(k ? 'pitS' : 'pitG', PITG, M), { cast: false }));
  const SAPT = [SAPG.trunk.I.length / 3 + SAPG.leaf.I.length / 3 + SAPG.stakesA.I.length / 3, SAPG.trunk.I.length / 3 + SAPG.leaf.I.length / 3 + (SAPG.stakesB.I.length + SAPG.guard.I.length) / 3];
  const allTM = TMS.flatMap(t => Object.values(t)).concat(Object.values(SAP), PIT);

  // ---------------------------------------------------------------- tramos: utilidades
  const segIn = (ci, f) => { // tramos de la celda y de sus 8 vecinas, sin repetir
    const cx = ci % NX, cz = (ci / NX) | 0, seen = new Set();
    for (let j = cz - 1; j <= cz + 1; j++) for (let i = cx - 1; i <= cx + 1; i++) { if (i < 0 || j < 0 || i >= NX || j >= NZ) continue; const c = j * NX + i;
      for (let k = ROADS.start[c]; k < ROADS.start[c + 1]; k++) { const s = ROADS.list[k]; if (!seen.has(s)) { seen.add(s); f(s); } } }
  };
  // cruces: extremos de tramo compartidos por tres o más tramos de calzada
  function junctions(ci) {
    const cnt = new Map(), pts = new Map();
    segIn(ci, s => { const o = s * 6; if (!CAR.has(SEG[o + 5])) return;
      for (const e of [0, 2]) { const k = Math.round(SEG[o + e] * 2) * 100000 + Math.round(SEG[o + e + 1] * 2); cnt.set(k, (cnt.get(k) || 0) + 1); if (!pts.has(k)) pts.set(k, [SEG[o + e], SEG[o + e + 1], []]); pts.get(k)[2].push(s); } });
    const out = []; for (const [k, n] of cnt) if (n >= 3) out.push(pts.get(k)); return out;
  }
  const jKey = (x, z) => Math.round(x * 2) * 100000 + Math.round(z * 2);

  // ---------------------------------------------------------------- árboles por celda (en caché; también para los niveles lejanos)
  // ARB3 (tercera persona): solo las avenidas anchas, ramblas y paseos conservan árboles adultos, a media densidad (uno sí y
  // uno no, al tresbolillo entre las dos aceras); en el resto de posiciones queda el alcorque vacío (con o sin reja) o un
  // plantón con tutores. Las calles de Ciutat Vella que no son anchas se quedan sin árboles ni alcorques.
  // Ancho de la calle: de fachada a fachada (coverAt) en tres puntos del tramo, la mediana; «ancha» si pasa de 36 m (más que
  // una rambla), si la calzada misma es ancha, o si corre junto a un andén central (rambla: tramo peatonal paralelo a < 14 m)
  const wideCache = new Map();
  function streetKind(s) {
    let v = wideCache.get(s); if (v !== undefined) return v;
    const o = s * 6, cls = SEG[o + 5], hw = SEG[o + 4], ax = SEG[o], az = SEG[o + 1], bx = SEG[o + 2], bz = SEG[o + 3], L = Math.hypot(bx - ax, bz - az) || 1;
    const tx = (bx - ax) / L, tz = (bz - az) / L, mx = (ax + bx) / 2, mz = (az + bz) / 2;
    // FIX3: un lado sin edificios (solar, plaza, parque) no hace «ancha» la calle: con un lado abierto cuenta el doble del
    // lado cerrado; con los dos abiertos, solo la calzada. En Ciutat Vella, ancha solo con edificios a los dos lados
    const ws = [], wc = [];
    for (const f of [0.25, 0.5, 0.75]) { const cx = ax + (bx - ax) * f, cz = az + (bz - az) * f; const dd = [];
      for (const sd of [-1, 1]) { let d = hw + 0.5; for (; d < 45; d += 1.5) if (coverAt(cx - tz * sd * d, cz + tx * sd * d, -1) > -1e8) break; dd.push(d); }
      const o0 = dd[0] >= 45, o1 = dd[1] >= 45;
      ws.push(o0 && o1 ? 2 * hw + 6 : o0 ? 2 * dd[1] : o1 ? 2 * dd[0] : dd[0] + dd[1]); wc.push(o0 || o1 ? 0 : dd[0] + dd[1]); }
    ws.sort((a, b) => a - b); wc.sort((a, b) => a - b);
    let rambla = cls === 7 && hw >= 4.5;
    if (!rambla) segIn(ctx.city.cellOf(mx, mz), r => {
      if (rambla || r === s) return; const q = r * 6; if (SEG[q + 5] !== 7 || SEG[q + 4] < 2) return;
      const rx = SEG[q + 2] - SEG[q], rz = SEG[q + 3] - SEG[q + 1], rl = Math.hypot(rx, rz); if (rl < 8 || Math.abs((rx * tx + rz * tz) / rl) < 0.96) return;
      const ex = mx - SEG[q], ez = mz - SEG[q + 1], al = (ex * rx + ez * rz) / rl, lat = Math.abs(ex * rz - ez * rx) / rl;
      if (al > -5 && al < rl + 5 && lat > 3 && lat < 14) rambla = true; });
    const B = window.BCN_BARRI ? window.BCN_BARRI.at(mx, mz) : null;
    const cv = !!(B && B.d === 'Ciutat Vella');
    const wide = rambla && ws[1] >= 22 || (cv ? wc[1] >= 36 : ws[1] >= 36) || hw >= 5;
    v = { wide, cv, rambla };
    wideCache.set(s, v); return v;
  }
  // REV4: tramo fuera del tejido urbano (carreteras de montaña: Vallvidrera, Arrabassada, Montjuïc). Rural si en dos de tres
  // puntos del tramo no hay ningún edificio a 60 m a ninguno de los dos lados, o si hay un lado abierto y la ladera es fuerte
  // (desnivel transversal > 15 % a ±20 m o pendiente del tramo > 7 %). Ahí: ni acera ensanchada (S2) ni árboles, alcorques o
  // plantones de calle, y la acera se queda en un arcén de tierra y grava de 1,3 m (modelo 6 del campo, sin bordillo)
  const ruralCache = new Map(), HAT = ctx.heightAt;
  function ruralSeg(s) {
    let v = ruralCache.get(s); if (v !== undefined) return v;
    const o = s * 6, hw = SEG[o + 4], ax = SEG[o], az = SEG[o + 1], bx = SEG[o + 2], bz = SEG[o + 3], L = Math.hypot(bx - ax, bz - az) || 1;
    const tx = (bx - ax) / L, tz = (bz - az) / L; let open2 = 0, open1 = 0, cross = 0;
    for (const f of [0.2, 0.5, 0.8]) { const cx = ax + (bx - ax) * f, cz = az + (bz - az) * f; let no = 0;
      for (const sd of [-1, 1]) { let op = 1; for (let d = hw + 0.5; d < 60; d += 2.5) if (coverAt(cx - tz * sd * d, cz + tx * sd * d, -1) > -1e8) { op = 0; break; } no += op; }
      if (no === 2) open2++; if (no >= 1) open1++;
      if (HAT) cross = Math.max(cross, Math.abs(HAT(cx - tz * (hw + 20), cz + tx * (hw + 20)) - HAT(cx + tz * (hw + 20), cz - tx * (hw + 20))) / (2 * hw + 40)); }
    const slope = HAT && L > 8 ? Math.abs(HAT(bx, bz) - HAT(ax, az)) / L : 0;
    v = open2 >= 2 || open1 >= 2 && (cross > 0.15 || slope > 0.07);
    ruralCache.set(s, v); return v;
  }
  const treeCache = new Map(), PLZ = window.BCN_PLAZAS;
  function treesOf(ci) {
    let t = treeCache.get(ci); if (t) return t;
    const cx = ci % NX, cz = (ci / NX) | 0, x0 = cx * CS, z0 = cz * CS, out = [];
    const J = junctions(ci);
    for (let k = ROADS.start[ci]; k < ROADS.start[ci + 1]; k++) {
      const s = ROADS.list[k], o = s * 6, cls = SEG[o + 5], hw = SEG[o + 4];
      const rambla = cls === 7 && hw >= 4.5; if (!(TREE.has(cls) && hw >= 2.4) && !rambla) continue;
      const ax = SEG[o], az = SEG[o + 1], dx = SEG[o + 2] - ax, dz = SEG[o + 3] - az, L = Math.hypot(dx, dz); if (L < 2) continue;
      const tx = dx / L, tz = dz / L, px = -tz, pz = tx, sp = rambla ? 9 : 10.5, a0 = ax * tx + az * tz;
      const spc = TR.pick(s, ax, az, SEG[o + 2], SEG[o + 3], hw, rambla);   // especie: la misma en toda la calle o tramo
      const K = streetKind(s); if (K.cv && !K.wide) continue;              // Ciutat Vella: fuera árboles y alcorques
      if (ruralSeg(s)) continue;                                           // REV4: carretera de montaña: nada de calle
      // reparto de alcorques vacíos y plantones, estable por calle (la misma clave de recta y tramo de 320 m que la especie)
      const th = Math.round(((Math.atan2(tz, tx) + 6.2832) % 3.1416) / 0.05), ln = Math.round((-ax * tz + az * tx) / 18) * (tz < 0 || tz === 0 && tx < 0 ? -1 : 1);
      const kS = hash2(th * 131 + 7, ln * 17 + 3), fSap = 0.18 + 0.27 * kS, grate = hash2(th * 71 + 1, ln * 29 + 5) < 0.6;
      for (let u = Math.ceil(a0 / sp) * sp - a0; u < L; u += sp) for (const side of [-1, 1]) {
        const off = rambla ? hw - 1.2 : hw + 1.3, x = ax + tx * u + px * side * off, z = az + tz * u + pz * side * off;
        if (x < x0 || x >= x0 + CS || z < z0 || z >= z0 + CS) continue;
        if (hash2(Math.round(x * 3), Math.round(z * 3)) > 0.93) continue;
        // REV3: nada de árboles ni alcorques de calle sobre el pavimento de las plazas (plataforma de plazas.js: Catalunya…)
        if (PLZ && PLZ.pavAt && PLZ.pavAt(x, z)) continue;
        let bad = false;
        for (const j of J) if (Math.hypot(x - j[0], z - j[1]) < 11) { bad = true; break; }
        if (bad) continue;
        const [ns, nd] = nearestCar(x, z); if (nd < 1.0) continue;
        if (coverAt(x, z, -1) > -1e8 || !rambla && coverAt(x + px * side * 1.4, z + pz * side * 1.4, -1) > -1e8) continue;
        const y = walkY(ns, x, z), h = hash2(Math.round(x * 7), Math.round(z * 7)), n = Math.round((a0 + u) / sp);
        // adulto: solo en calle ancha y una posición de cada dos (al tresbolillo entre aceras). Si no: plantón (NSP: tres
        // tutores, NSP + 1: dos tutores y protector) o alcorque vacío (−1 con reja, −2 tierra sola)
        if (K.wide && ((n + (side > 0 ? 1 : 0)) & 1) === 0) out.push(x, y - 0.17, z, h * 6.2832, 0.9 + 0.38 * hash2(Math.round(z * 5), Math.round(x * 5)), Math.atan2(tz, tx), spc);
        else if (hash2(n * 3 + (side > 0 ? 1 : 0), ln * 7 + th) < fSap) out.push(x, y - 0.04, z, h * 6.2832, 0.85 + 0.3 * hash2(Math.round(z * 5), Math.round(x * 5)), Math.atan2(tz, tx), NSP + (hash2(th, ln * 3 + 11) < 0.55 ? 0 : 1));
        else out.push(x, y, z, 0, 0, Math.atan2(tz, tx), grate ? -1 : -2);
      }
    }
    t = new Float32Array(out);
    // ARB4: matriz del alcorque (y = acera; giro con la calle; inclinado con la pendiente de la acera)
    const pm = new Float32Array(t.length / 7 * 16);
    for (let k = 0, w = 0; k < t.length; k += 7, w += 16) {
      const x = t[k], z = t[k + 2], e = t[k + 6], y = t[k + 1] + (e < 0 ? 0 : e >= NSP ? 0.04 : 0.17), an = t[k + 5], ex = Math.cos(an), ez = Math.sin(an), ns = nearestCar(x, z)[0];
      const gx = walkY(ns, x + 0.5, z) - walkY(ns, x - 0.5, z), gz = walkY(ns, x, z + 0.5) - walkY(ns, x, z - 0.5), sl = (gx < 0.15 && gx > -0.15 && gz < 0.15 && gz > -0.15) ? 1 : 0;
      pm.set([ex, sl * (gx * ex + gz * ez), ez, 0, 0, 1, 0, 0, -ez, sl * (-gx * ez + gz * ex), ex, 0, x, y, z, 1], w);
    }
    const mats = new Float32Array(t.length / 7 * 16), m = new BABYLON.Matrix(), q = new BABYLON.Quaternion(), v = new BABYLON.Vector3(), sc = new BABYLON.Vector3();
    for (let k = 0, w = 0; k < t.length; k += 7, w += 16) {
      BABYLON.Quaternion.RotationYawPitchRollToRef(t[k + 3], 0, 0, q); v.set(t[k], t[k + 1], t[k + 2]); sc.set(t[k + 4], t[k + 4] * (0.95 + 0.17 * ((t[k + 3] * 7) % 1)), t[k + 4]);
      BABYLON.Matrix.ComposeToRef(sc, q, v, m); mats.set(m.m, w);
    }
    t.mats = mats; t.pm = pm; treeCache.set(ci, t); return t;
  }

  // ---------------------------------------------------------------- atlas del campo de aceras (una textura para todas las celdas)
  const EXT = 40, RES = 0.5, MG = 4, NT = Math.round(CS / RES) + 2 * MG, AT = 2048, SLOTS = Math.floor(AT / NT);
  const atlas = BABYLON.RawTexture.CreateRGBATexture(new Uint8Array(AT * AT * 4), AT, AT, scene, false, false, BABYLON.Texture.BILINEAR_SAMPLINGMODE);
  atlas.wrapU = atlas.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
  // SUELOS: atlas gemelo (sin filtrar) con el modelo de acera (R = 40·modelo) y el desgaste (G) del tramo más cercano
  const atlasK = BABYLON.RawTexture.CreateRGBATexture(new Uint8Array(AT * AT * 4), AT, AT, scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);
  atlasK.wrapU = atlasK.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE; matW.setTexture('tKind', atlasK);
  const SU = window.BCN_SUELOS, kindCache = new Map();
  const kindOf = s => { let k = kindCache.get(s); if (!k) { const o = s * 6; k = SEG[o + 5] === 9 || ruralSeg(s) ? [6, 0.6] :   // G1S1: las pistas (clase 9) son de tierra siempre, también en parques
       SU ? SU.acera(SEG[o + 5], SEG[o + 4], SEG[o], SEG[o + 1], SEG[o + 2], SEG[o + 3]) : [0, 0.3]; kindCache.set(s, k); } return k; };
  matW.setTexture('tField', atlas); matW.setTexture('tPanD', tPanD); matW.setTexture('tPanN', tPanN); matW.setTexture('tGrD', tGrD); matW.setTexture('tGrN', tGrN);
  const freeSlots = []; for (let k = SLOTS * SLOTS - 1; k >= 0; k--) freeSlots.push(k);

  // WALK (calles con aceras) y WSW (ancho máximo de acera desde el bordillo) vienen de ctx.city: city.walkAt reproduce el
  // campo y la malla de esta función para dar la cota exacta de la acera en cualquier punto. Si cambias la regla de `near` o
  // las cotas de los vértices (vert), cambia también walkVert/walkAt en facades.js.
  function* cellJob(ci) {
    const cell = cells.get(ci), cx = ci % NX, cz = (ci / NX) | 0, ox = cx * CS, oz = cz * CS;
    const fx0 = ox - MG * RES, fz0 = oz - MG * RES;
    const dA = new Float32Array(NT * NT).fill(99), dS = new Float32Array(NT * NT).fill(99), dP = new Float32Array(NT * NT).fill(99), near = new Int32Array(NT * NT).fill(-1);
    const dK = new Float32Array(NT * NT).fill(99), nW = new Int32Array(NT * NT).fill(-1);   // tramo con acera más cercano (modelo)
    const segs = []; segIn(ci, s => segs.push(s));
    for (let n = 0; n < segs.length; n++) {
      if (n && n % 40 === 0) yield;
      const s = segs[n], o = s * 6, cls = SEG[o + 5], hw = SEG[o + 4], car = CAR.has(cls), walk = WALK.has(cls), ped = PED.has(cls);
      if (!car && !ped) continue;
      const reach = (walk ? hw + WSW : hw + 1.5) + 0.5, ax = SEG[o], az = SEG[o + 1], bx = SEG[o + 2], bz = SEG[o + 3], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
      const i0 = Math.max(0, Math.floor((Math.min(ax, bx) - reach - fx0) / RES)), i1 = Math.min(NT - 1, Math.ceil((Math.max(ax, bx) + reach - fx0) / RES));
      const j0 = Math.max(0, Math.floor((Math.min(az, bz) - reach - fz0) / RES)), j1 = Math.min(NT - 1, Math.ceil((Math.max(az, bz) + reach - fz0) / RES));
      for (let j = j0; j <= j1; j++) { const z = fz0 + (j + 0.5) * RES;
        for (let i = i0; i <= i1; i++) { const x = fx0 + (i + 0.5) * RES;
          let t = l2 > 0 ? ((x - ax) * dx + (z - az) * dz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
          const e = Math.hypot(x - ax - dx * t, z - az - dz * t) - hw, q = j * NT + i;
          if (car && e < dA[q]) { dA[q] = e; near[q] = s; }
          if (walk && e < dS[q]) dS[q] = e;
          if ((walk || ped) && e < dK[q]) { dK[q] = e; nW[q] = s; }
          if (ped && e < dP[q]) dP[q] = e;
        } }
    }
    yield;
    // S2 · nada sin pavimentar: la acera sigue más allá de los WSW m del bordillo (paseos, chaflanes anchos, explanadas delante
    // de las fachadas) hasta EXT m, siempre que desde el bordillo se «vea» el punto (ningún edificio en medio: así no entra en
    // los patios de manzana). También llevan acera a los lados las vías peatonales anchas (clase 7, semiancho ≥ 8: paseos y
    // tramos de avenida). La cota de esos puntos es la de siempre (walkY con el tramo con calzada de la regla de near).
    const dS2 = new Float32Array(NT * NT).fill(99), nS = new Int32Array(NT * NT).fill(-1);
    for (let n = 0; n < segs.length; n++) {
      const s = segs[n], o = s * 6, cls = SEG[o + 5], hw = SEG[o + 4];
      if (!WALK.has(cls) && !(cls === 7 && hw >= 8) || ruralSeg(s)) continue;   // REV4: ni en las carreteras de montaña
      const ax = SEG[o], az = SEG[o + 1], bx = SEG[o + 2], bz = SEG[o + 3], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, reach = hw + EXT;
      const i0 = Math.max(0, Math.floor((Math.min(ax, bx) - reach - fx0) / RES)), i1 = Math.min(NT - 1, Math.ceil((Math.max(ax, bx) + reach - fx0) / RES));
      const j0 = Math.max(0, Math.floor((Math.min(az, bz) - reach - fz0) / RES)), j1 = Math.min(NT - 1, Math.ceil((Math.max(az, bz) + reach - fz0) / RES));
      for (let j = j0; j <= j1; j++) { const z = fz0 + (j + 0.5) * RES;
        for (let i = i0; i <= i1; i++) { const x = fx0 + (i + 0.5) * RES;
          let t = l2 > 0 ? ((x - ax) * dx + (z - az) * dz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
          const qx = x - ax - dx * t, qz = z - az - dz * t, e = Math.sqrt(qx * qx + qz * qz) - hw, q = j * NT + i;
          if (e < dS2[q]) { dS2[q] = e; nS[q] = s; } } }
      if (n % 20 === 19) yield;
    }
    const PV = new Float32Array(NT * NT), VIS = new Int8Array(NT * NT).fill(-1);
    const seen = (i, j) => {   // ¿se ve el punto (centro de la muestra i, j) desde el bordillo de su calle?
      const q = j * NT + i; if (VIS[q] >= 0) return VIS[q];
      const s = nS[q], o = s * 6, x = fx0 + (i + 0.5) * RES, z = fz0 + (j + 0.5) * RES, ax = SEG[o], az = SEG[o + 1], dx = SEG[o + 2] - ax, dz = SEG[o + 3] - az, l2 = dx * dx + dz * dz;
      let t = l2 > 0 ? ((x - ax) * dx + (z - az) * dz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const cx = ax + dx * t, cz = az + dz * t, ex = x - cx, ez = z - cz, el = Math.sqrt(ex * ex + ez * ez) || 1, hw = SEG[o + 4];
      const kx = cx + ex / el * (hw + 1), kz = cz + ez / el * (hw + 1); let ok = 1;
      for (const f of [0.15, 0.4, 0.65, 0.88]) if (coverAt(kx + (x - kx) * f, kz + (z - kz) * f, -1) > -1e8) { ok = 0; break; }
      VIS[q] = ok; return ok;
    };
    let nExt = 0;
    for (let j = 0; j < NT; j++) { for (let i = 0; i < NT; i++) { const q = j * NT + i;
        let pv = Math.max(WSW - dS[q], 0.6 - dP[q]);
        if (nW[q] >= 0 && dP[q] > 0.6 && ruralSeg(nW[q])) pv = Math.min(pv, 1.3 - dS[q]);   // REV4: arcén de 1,3 m
        if (pv <= 0.3 && dS2[q] < EXT && dA[q] > 0.3 && seen(i & ~1, j & ~1)) { if (pv <= 0) nExt++; pv = Math.max(pv, 0.8); if (nW[q] < 0) nW[q] = nS[q]; }
        PV[q] = pv; }
      if (j % 24 === 23) yield; }
    cell.ext = nExt;
    // árboles de la celda y vecinas (para los alcorques)
    const pits = [];
    for (let j = cz - 1; j <= cz + 1; j++) for (let i = cx - 1; i <= cx + 1; i++) { if (i < 0 || j < 0 || i >= NX || j >= NZ) continue; const T = treesOf(j * NX + i); void T; }   // ARB4: los alcorques son instancias propias (PIT); el canal alfa del campo queda a 0
    yield;
    // campo → RGBA
    const F = new Uint8Array(NT * NT * 4);
    for (let q = 0; q < NT * NT; q++) {
      const a = dA[q], pv = PV[q];
      F[q * 4] = Math.max(0, Math.min(255, (a + 2) * 20));
      F[q * 4 + 1] = Math.max(0, Math.min(255, pv * 20 + 128));
      F[q * 4 + 2] = Math.max(0, Math.min(255, 128 + Math.min(0.6 - dP[q], dS[q] - 2.5) * 30));   // > 128: losa de granito (peatonal)
    }
    for (let k = 0; k < pits.length; k += 4) {
      const x = pits[k], z = pits[k + 1], an = pits[k + 2], pa = pits[k + 3], c = Math.cos(an), sn = Math.sin(an);
      const i0 = Math.max(0, Math.floor((x - 1 - fx0) / RES)), i1 = Math.min(NT - 1, Math.ceil((x + 1 - fx0) / RES)), j0 = Math.max(0, Math.floor((z - 1 - fz0) / RES)), j1 = Math.min(NT - 1, Math.ceil((z + 1 - fz0) / RES));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const ex = fx0 + (i + 0.5) * RES - x, ez = fz0 + (j + 0.5) * RES - z;
        if (Math.abs(ex * c + ez * sn) < 0.62 && Math.abs(-ex * sn + ez * c) < 0.62) F[(j * NT + i) * 4 + 3] = pa; }
    }
    const FK = new Uint8Array(NT * NT * 4);
    for (let q = 0; q < NT * NT; q++) { if (nW[q] < 0) continue; const k = kindOf(nW[q]);
      if (k[0] === 6 && F[q * 4 + 2] > 127) F[q * 4 + 2] = 127;   // G1S1: pista o senda de monte: tierra y grava, no losa de granito
      FK[q * 4] = k[0] * 40; FK[q * 4 + 1] = Math.round(k[1] * 255); FK[q * 4 + 3] = 255; }
    const slot = freeSlots.pop(); if (slot === undefined) return;
    const sx = (slot % SLOTS) * NT, sy = Math.floor(slot / SLOTS) * NT;
    yield;
    // malla de acera (rejilla de 1 m que sigue el terreno; el contorno exacto lo recorta el shader con el campo)
    const W = new GB(ox, oz), G = Math.round(CS), gx0 = 0, gz0 = 0;
    const P = [], UV = [], I = [], vid = new Int32Array((G + 1) * (G + 1)).fill(-1);
    const fieldAt = (x, z) => { const i = Math.min(NT - 1, Math.max(0, Math.round((x - fx0) / RES - 0.5))), j = Math.min(NT - 1, Math.max(0, Math.round((z - fz0) / RES - 0.5))); return j * NT + i; };
    const keep = q => dA[q] > -0.7 && PV[q] > -0.7;
    const keepAround = (x, z) => { for (const [a, b] of [[0, 0], [0.5, 0], [0, 0.5], [0.5, 0.5], [-0.5, 0], [0, -0.5]]) if (keep(fieldAt(x + a, z + b))) return true; return false; };
    const vert = (gi, gj) => {
      const k = gj * (G + 1) + gi; if (vid[k] >= 0) return vid[k];
      const x = ox + gx0 + gi, z = oz + gz0 + gj, q = fieldAt(x, z);
      const y = walkY(near[q], x, z);
      vid[k] = P.length / 3; P.push(x - ox, y, z - oz); UV.push((sx + (x - fx0) / RES) / AT, (sy + (z - fz0) / RES) / AT); return vid[k];
    };
    for (let gj = 0; gj < G; gj++) for (let gi = 0; gi < G; gi++) {
      const x = ox + gx0 + gi + 0.5, z = oz + gz0 + gj + 0.5;
      if (!keepAround(x, z)) continue;
      const a = vert(gi, gj), b = vert(gi + 1, gj), c = vert(gi + 1, gj + 1), d = vert(gi, gj + 1);
      I.push(a, b, c, a, c, d);
    }
    yield;
    // bordillo: caras verticales en la curva de nivel dA = 0 (marching squares a 0,5 m)
    const curb = (x1, z1, x2, z2, s, cu) => {
      const t1 = walkY(s, x1, z1), t2 = walkY(s, x2, z2), b1 = s >= 0 ? roadY(s, x1, z1) - 0.03 : t1 - 0.18, b2 = s >= 0 ? roadY(s, x2, z2) - 0.03 : t2 - 0.18, base = P.length / 3;
      P.push(x1 - ox, b1, z1 - oz, x2 - ox, b2, z2 - oz, x2 - ox, t2, z2 - oz, x1 - ox, t1, z1 - oz); UV.push(cu, 0, cu, 0, cu, 1, cu, 1);
      I.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };
    for (let j = MG - 1; j < NT - MG - 1; j++) for (let i = MG - 1; i < NT - MG - 1; i++) {
      const k0 = j * NT + i, a0 = dA[k0] >= 0, a1 = dA[k0 + 1] >= 0, a2 = dA[k0 + NT + 1] >= 0, a3 = dA[k0 + NT] >= 0;
      if (a0 === a1 && a1 === a2 && a2 === a3) continue;
      const q = [k0, k0 + 1, k0 + NT + 1, k0 + NT], v = q.map(k => dA[k]), pos = [a0, a1, a2, a3];
      if (!q.some(k => dA[k] >= 0 && PV[k] > 0)) continue;
      const cxs = [[0, 0], [1, 0], [1, 1], [0, 1]], pts = [];
      for (let e = 0; e < 4; e++) { const a = e, b = (e + 1) % 4; if (pos[a] !== pos[b]) { const t = v[a] / (v[a] - v[b]);
        pts.push([fx0 + (i + 0.5 + cxs[a][0] + (cxs[b][0] - cxs[a][0]) * t) * RES, fz0 + (j + 0.5 + cxs[a][1] + (cxs[b][1] - cxs[a][1]) * t) * RES]); } }
      const s = near[q.find(k => near[k] >= 0) ?? q[0]], sw = nW[q.find(k => nW[k] >= 0) ?? q[0]], kk = sw >= 0 ? kindOf(sw) : [0, 0.3];
      if (kk[0] === 6) continue;                                   // REV4: arcén de tierra, sin bordillo
      for (let e = 0; e + 1 < pts.length; e += 2) curb(pts[e][0], pts[e][1], pts[e + 1][0], pts[e + 1][1], s, -(2 + kk[0] + 0.9 * Math.min(kk[1], 0.99)));
    }
    yield;
    // S2 · encuentro de la fachada con la acera: donde la base de un edificio (y0) queda por encima de la acera que tiene
    // delante (la calle se ha allanado o el relieve baja), un faldón de piedra a lo largo de la línea de fachada, 2 cm por
    // fuera, desde 8 cm bajo la acera hasta 10 cm por encima de la base. Solo las aristas cuyo punto medio cae en esta celda.
    let nSk = 0;
    for (let k = ALL.start[ci]; k < ALL.start[ci + 1]; k++) {
      const b = ALL.list[k], d = bget(b), r = d.rings[0], m = r.length / 2; if (m < 3) continue;
      for (let e = 0; e < m; e++) {
        const Ax = r[e * 2], Az = r[e * 2 + 1], Bx = r[(e + 1) % m * 2], Bz = r[(e + 1) % m * 2 + 1], dx = Bx - Ax, dz = Bz - Az, L = Math.sqrt(dx * dx + dz * dz);
        if (L < 0.6) continue;
        const Mx = (Ax + Bx) / 2, Mz = (Az + Bz) / 2; if (Mx < ox || Mx >= ox + CS || Mz < oz || Mz >= oz + CS) continue;
        let nx = dz / L, nz = -dx / L; if (inside(d, Mx + nx * 0.3, Mz + nz * 0.3)) { nx = -nx; nz = -nz; }
        const qm = fieldAt(Mx + nx * 0.8, Mz + nz * 0.8); if (!(dA[qm] > 0.3 && PV[qm] > 0)) continue;
        const qa = fieldAt(Ax + nx * 0.3, Az + nz * 0.3), qb = fieldAt(Bx + nx * 0.3, Bz + nz * 0.3);
        const wa = walkY(near[qa], Ax + nx * 0.3, Az + nz * 0.3), wb = walkY(near[qb], Bx + nx * 0.3, Bz + nz * 0.3), gap = d.y0 - Math.min(wa, wb);
        if (gap < 0.02 || gap > 3) continue;
        const kk = nW[qm] >= 0 ? kindOf(nW[qm]) : [0, 0.3], cu = -(2 + kk[0] + 0.9 * Math.min(kk[1], 0.99)), base = P.length / 3, px = nx * 0.02, pz = nz * 0.02;
        P.push(Ax + px - ox, wa - 0.08, Az + pz - oz, Bx + px - ox, wb - 0.08, Bz + pz - oz, Bx + px - ox, Math.max(d.y0 + 0.1, wb + 0.02), Bz + pz - oz, Ax + px - ox, Math.max(d.y0 + 0.1, wa + 0.02), Az + pz - oz);
        UV.push(cu, 0, cu, 0, cu, 1, cu, 1); I.push(base, base + 1, base + 2, base, base + 2, base + 3); nSk++;
      }
      if ((k & 31) === 31) yield;
    }
    cell.skirts = nSk;
    yield;
    // mobiliario (furniture.js) y marcas viales (ground.js)
    const cc = cellCtx(ci, W, ox, oz); cc.pools = [];
    FU.build(cc); GR.decals(cc);
    sortBySeg(W, cc.marks);
    yield;
    if (cells.get(ci) !== cell) { freeSlots.push(slot); return; }
    // charcos de luz de las farolas (los deja furniture.js en cc.pools: x, y, z, u, v por vértice, de cuatro en cuatro): malla con mezcla alfa
    let poolMesh = null;
    if (cc.pools.length && FU.poolMat) { const Q = cc.pools, nq = Q.length / 20, pp = new Float32Array(nq * 12), pu = new Float32Array(nq * 8), pi = new Uint32Array(nq * 6);
      for (let k = 0; k < nq * 4; k++) { pp[k * 3] = Q[k * 5]; pp[k * 3 + 1] = Q[k * 5 + 1]; pp[k * 3 + 2] = Q[k * 5 + 2]; pu[k * 2] = Q[k * 5 + 3]; pu[k * 2 + 1] = Q[k * 5 + 4]; }
      for (let k = 0; k < nq; k++) pi.set([k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3], k * 6);
      poolMesh = new BABYLON.Mesh('lp' + ci, scene);
      poolMesh.setVerticesData('position', pp, false); poolMesh.setVerticesData('uv', pu, false); poolMesh.setIndices(pi);
      poolMesh.material = FU.poolMat; poolMesh.isPickable = false; poolMesh.renderingGroupId = 1; poolMesh.position.set(ox, 0, oz); poolMesh.freezeWorldMatrix(); poolMesh.doNotSyncBoundingInfo = true;
      reg(poolMesh, { cast: false, layer: 'fx' }); }
    cell.pool = poolMesh;
    if (LG) LG.set(ci, poolLamps(cc.pools, ox, oz));    // baño de sodio en fachadas y copas (rejilla de facades.js)
    engine.updateTextureData(atlas.getInternalTexture(), F, sx, sy, NT, NT);
    engine.updateTextureData(atlasK.getInternalTexture(), FK, sx, sy, NT, NT);
    let walkMesh = null;
    if (I.length) {
      walkMesh = new BABYLON.Mesh('wk' + ci, scene);
      walkMesh.setVerticesData('position', new Float32Array(P), false); walkMesh.setVerticesData('uv', new Float32Array(UV), false); walkMesh.setIndices(new Uint32Array(I));
      walkMesh.material = matW; walkMesh.isPickable = false; walkMesh.renderingGroupId = 1; walkMesh.position.set(ox, 0, oz); walkMesh.freezeWorldMatrix(); walkMesh.doNotSyncBoundingInfo = true;
      reg(walkMesh, { cast: false, layer: 'walk' });
    }
    // `cell` va en los metadatos: facades.js pone uCellHi = 1 al pintar esta malla cuando cell.hi existe, y el mobiliario
    // sencillo cede entonces el sitio, de cerca, a la malla de detalle (hiJob)
    const furnMesh = reg(mkMeshFrom(W, matB, 'fu' + ci), { cast: true, layer: 'furn', cell });
    cell.walk = walkMesh; cell.furn = furnMesh; cell.slot = slot; cell.tris = I.length / 3 + W.ni / 3; tris += cell.tris;
    cell.fTris = W.ni / 3; furnTris[0] += cell.fTris; cell.built = true;
  }
  // mobiliario de detalle de una celda cercana (FU.buildHi): malla aparte, que se quita al alejarse (dropHi)
  function* hiJob(ci) {
    const cell = cells.get(ci), ox = (ci % NX) * CS, oz = ((ci / NX) | 0) * CS, W = new GB(ox, oz);
    FU.buildHi(cellCtx(ci, W, ox, oz));
    yield;
    if (cells.get(ci) !== cell) return;
    cell.hi = reg(mkMeshFrom(W, matB, 'fh' + ci), { cast: true, layer: 'furn' });
    cell.hiDone = true; cell.hiTris = W.ni / 3; tris += cell.hiTris; furnTris[1] += cell.hiTris;
  }
  function dropHi(c) {
    if (c.hi) c.hi.dispose(false, false);
    if (c.hiDone) { tris -= c.hiTris; furnTris[1] -= c.hiTris; }
    c.hi = null; c.hiDone = false;
  }

  // ---------------------------------------------------------------- contexto de celda para los hooks
  // Lo que furniture.js y ground.js necesitan para poblar una celda: su geometría (W, relativa a ox/oz), consultas de la
  // celda y forEachSeg(cb), que recorre sus tramos de calle (los de 1 m o más) y pasa a cb los datos de cada uno.
  function cellCtx(ci, W, ox, oz) {
    const cx = ci % NX, cz = (ci / NX) | 0, x0 = cx * CS, z0 = cz * CS;
    const J = junctions(ci), Jset = new Set(J.map(j => jKey(j[0], j[1])));
    const inCell = (x, z) => x >= x0 && x < x0 + CS && z >= z0 && z < z0 + CS;
    const nearJ = (x, z, r) => { for (const j of J) if (Math.hypot(x - j[0], z - j[1]) < r) return true; return false; };
    const freeWalk = (x, z) => { const [s, d] = nearestCar(x, z); return d > 0.25 && coverAt(x, z, -1) < -1e8 ? s : -2; };
    const marks = []; let depth = 0;
    const forEachSeg = cb => {
      depth++;
      for (let k = ROADS.start[ci]; k < ROADS.start[ci + 1]; k++) {
        const s = ROADS.list[k], o = s * 6, cls = SEG[o + 5], hw = SEG[o + 4];
        const ax = SEG[o], az = SEG[o + 1], dx = SEG[o + 2] - ax, dz = SEG[o + 3] - az, L = Math.hypot(dx, dz); if (L < 1) continue;
        const tx = dx / L, tz = dz / L, px = -tz, pz = tx, a0 = ax * tx + az * tz, ang = Math.atan2(tz, tx);
        const along = (sp, ph, f) => { for (let u = Math.ceil((a0 - ph) / sp) * sp + ph - a0; u < L; u += sp) f(u, Math.round((a0 + u - ph) / sp)); };
        const v0 = W.nv, i0 = W.ni;
        cb({ s, cls, hw, ax, az, tx, tz, px, pz, L, a0, ang, along });
        if (depth === 1 && W.nv > v0) marks.push(k, v0, W.nv, i0, W.ni);   // qué ha emitido este tramo (ver sortBySeg)
      }
      depth--;
    };
    return { ci, W, ox, oz, x0, z0, inCell, nearJ, freeWalk, J, Jset, jKey, forEachSeg, marks };
  }
  // Cada hook recorre los tramos por su cuenta, pero la malla queda ordenada por tramo y, dentro de cada tramo, por orden
  // de llamada (mobiliario, marcas viales): el mismo orden de triángulos que si todo saliera de un único bucle, de modo
  // que los empates de profundidad se resuelven siempre igual. Lo emitido fuera de forEachSeg queda al final.
  function sortBySeg(W, mk) {
    const rg = []; let v = 0, i = 0, sorted = true;
    for (let k = 0; k < mk.length; k += 5) {
      if (mk[k + 1] > v) rg.push([1e9, v, mk[k + 1], i, mk[k + 3]]);
      rg.push([mk[k], mk[k + 1], mk[k + 2], mk[k + 3], mk[k + 4]]); v = mk[k + 2]; i = mk[k + 4];
    }
    if (W.nv > v) rg.push([1e9, v, W.nv, i, W.ni]);
    for (let k = 1; k < rg.length; k++) if (rg[k][0] < rg[k - 1][0]) sorted = false;
    if (sorted) return;
    const ord = rg.map((r, k) => k).sort((a, b) => rg[a][0] - rg[b][0] || a - b);
    const P = W.p.slice(0, W.nv * 3), C = W.c.slice(0, W.nv * 4), A = W.a.slice(0, W.nv * 4), N = W.n.slice(0, W.nv * 4), I = W.i.slice(0, W.ni);
    let nv = 0, ni = 0;
    for (const k of ord) {
      const [, v0, v1, i0, i1] = rg[k], dv = nv - v0;
      W.p.set(P.subarray(v0 * 3, v1 * 3), nv * 3); W.c.set(C.subarray(v0 * 4, v1 * 4), nv * 4); W.a.set(A.subarray(v0 * 4, v1 * 4), nv * 4); W.n.set(N.subarray(v0 * 4, v1 * 4), nv * 4);
      for (let q = i0; q < i1; q++) W.i[ni++] = I[q] + dv;
      nv += v1 - v0;
    }
  }
  // hooks: si un módulo falta o falla al iniciarse, las calles salen sin esa parte
  const FU = await ctx.hooks('mobiliario urbano (furniture.js)', 'BCN_FURNITURE', { build() {} });
  const GR = await ctx.hooks('marcas viales (ground.js)', 'BCN_GROUND', { decals() {} });

  // ---------------------------------------------------------------- celdas e instancias
  const cells = new Map();
  const S = { on: true, R0: 150, R1: 195, RB: 215, RD: 270, budget: 4, tN: [55, 70], tF: [430, 520], tI: 2100 };
  // mobiliario de detalle: se construye en las celdas a menos de HB (algo más que el relevo por píxel, FU.hiRange) y se quita a partir de HD
  const HB = FU.buildHi && FU.hiRange ? FU.hiRange[1] + 8 : -1, HD = HB + 25, furnTris = [0, 0];
  let job = null, queue = [], tris = 0, planT = 0, instT = 0, lastIP = null, added = 0;
  function drop(ci) {
    const c = cells.get(ci); if (!c) return;
    dropHi(c);
    if (c.walk) c.walk.dispose(false, false); if (c.furn) c.furn.dispose(false, false); if (c.pool) c.pool.dispose(false, false);
    if (LG) LG.drop(ci);
    if (c.slot !== undefined) freeSlots.push(c.slot);
    tris -= c.tris || 0; furnTris[0] -= c.fTris || 0; cells.delete(ci);
  }
  function plan(P, alt) {
    const want = [], keep = new Set();
    if (S.on && alt < S.RD) {
      const r = Math.ceil(S.RD / CS) + 1, ci0 = Math.floor(P.x / CS), cj0 = Math.floor(P.z / CS);
      for (let j = cj0 - r; j <= cj0 + r; j++) for (let i = ci0 - r; i <= ci0 + r; i++) {
        if (i < 0 || j < 0 || i >= NX || j >= NZ) continue;
        const ci = j * NX + i, dx = Math.max(i * CS - P.x, 0, P.x - (i + 1) * CS), dz = Math.max(j * CS - P.z, 0, P.z - (j + 1) * CS), d = Math.hypot(dx, dz, alt);
        if (d < S.RD) keep.add(ci);
        const c = cells.get(ci);
        if (d < S.RB && !c) want.push([d, ci]);
        if (c && c.built && !c.hiDone && d < HB) want.push([d + 40, ci, true]);
        if (c && c.hiDone && d > HD) dropHi(c);
      }
    }
    for (const ci of [...cells.keys()]) if (!keep.has(ci) && !(job && job.ci === ci)) drop(ci);
    if (job && !keep.has(job.ci)) { if (job.hi) drop(job.ci); else cells.delete(job.ci); job = null; }
    want.sort((a, b) => a[0] - b[0]); queue = want;
  }
  // instancias de árboles: se recalculan al moverse; las listas por celda se calculan poco a poco
  let pendingTrees = [];
  function instances(P) {
    const r = S.tI + 60, c0 = Math.floor((P.x - r) / CS), c1 = Math.floor((P.x + r) / CS), d0 = Math.floor((P.z - r) / CS), d1 = Math.floor((P.z + r) / CS);
    const sel = [], cnt = [], sap = [[], []], pit = [[], []];   // por nivel g y especie k: índice g*NSP + k; plantones A y B (solo cerca)
    for (let q = 0; q < 3 * NSP; q++) { sel.push([]); cnt.push(0); }
    pendingTrees = [];
    for (let j = Math.max(0, d0); j <= Math.min(NZ - 1, d1); j++) for (let i = Math.max(0, c0); i <= Math.min(NX - 1, c1); i++) {
      const dx = Math.max(i * CS - P.x, 0, P.x - (i + 1) * CS), dz = Math.max(j * CS - P.z, 0, P.z - (j + 1) * CS); if (Math.hypot(dx, dz) > r) continue;
      const ci = j * NX + i, T = treeCache.get(ci);
      if (!T) { pendingTrees.push([Math.hypot(dx, dz), ci]); continue; }
      for (let k = 0, w = 0; k < T.length; k += 7, w += 16) {
        const e = T[k + 6], dp = Math.hypot(T[k] - P.x, T[k + 1] - P.y, T[k + 2] - P.z);
        if (dp < 76) pit[e === -2 || e >= NSP ? 1 : 0].push(T.pm, w);   // alcorque (ARB4)
        if (e < 0) continue;                                         // alcorque vacío: solo el alcorque
        if (e >= NSP) { if (Math.hypot(T[k] - P.x, T[k + 1] + 1 - P.y, T[k + 2] - P.z) < 52) sap[e - NSP].push(T.mats, w); continue; }
        const d = Math.hypot(T[k] - P.x, T[k + 1] + 6 - P.y, T[k + 2] - P.z);
        if (d < S.tN[1] + 2) { sel[e].push(T.mats, w); cnt[e]++; }
        if (d > S.tN[0] - 2 && d < S.tF[1] + 2) { sel[NSP + e].push(T.mats, w); cnt[NSP + e]++; }
        if (d > S.tF[0] - 2 && d < S.tI) { sel[2 * NSP + e].push(T.mats, w); cnt[2 * NSP + e]++; }
      }
    }
    pendingTrees.sort((a, b) => a[0] - b[0]);
    const n3 = [0, 0, 0], ntri = [0, 0, 0], nsp = new Array(NSP).fill(0);
    for (let q = 0; q < 3 * NSP; q++) {
      const g = (q / NSP) | 0, e = q % NSP, t = TMS[e], groups = g === 0 ? [t.nearBark, t.nearLeaf] : g === 1 ? [t.farBark, t.farLeaf] : [t.imp];
      const b = new Float32Array(Math.max(16, cnt[q] * 16)), L = sel[q];
      for (let k = 0, w = 0; k < L.length; k += 2, w += 16) b.set(L[k].subarray(L[k + 1], L[k + 1] + 16), w);
      for (const me of groups) { me.thinInstanceSetBuffer('matrix', b, 16, false); me.thinInstanceCount = cnt[q]; }
      n3[g] += cnt[q]; ntri[g] += cnt[q] * TRIS[e][g]; if (g < 2) nsp[e] += cnt[q];
    }
    const sb = sap.map(L => { const b = new Float32Array(Math.max(16, L.length * 8)); for (let k = 0, w = 0; k < L.length; k += 2, w += 16) b.set(L[k].subarray(L[k + 1], L[k + 1] + 16), w); return b; });
    const nA = sap[0].length / 2, nB = sap[1].length / 2, sAB = new Float32Array(Math.max(16, (nA + nB) * 16)); sAB.set(sb[0].subarray(0, nA * 16)); sAB.set(sb[1].subarray(0, nB * 16), nA * 16);
    for (const [me, b, n] of [[SAP.trunk, sAB, nA + nB], [SAP.leaf, sAB, nA + nB], [SAP.stakesA, sb[0], nA], [SAP.stakesB, sb[1], nB], [SAP.guard, sb[1], nB]]) { me.thinInstanceSetBuffer('matrix', b, 16, false); me.thinInstanceCount = n; }
    for (let v = 0; v < 2; v++) { const L = pit[v], b = new Float32Array(Math.max(16, L.length * 8)); for (let k = 0, w = 0; k < L.length; k += 2, w += 16) b.set(L[k].subarray(L[k + 1], L[k + 1] + 16), w);
      PIT[v].thinInstanceSetBuffer('matrix', b, 16, false); PIT[v].thinInstanceCount = L.length / 2; }
    nPit = (pit[0].length + pit[1].length) / 2;
    nTrees = n3; treeTris = ntri; treeSp = nsp; nSap = nA + nB; sapTris = nA * SAPT[0] + nB * SAPT[1];
  }
  let nSap = 0, sapTris = 0, nPit = 0;
  let nTrees = [0, 0, 0], treeTris = [0, 0, 0], treeSp = [];
  const band = (m, a, b, c, d) => m.setVector4('uBand', new BABYLON.Vector4(a, b, c, d));
  function setBands() {
    for (const M of TMAT) {
      band(M.barkN, -2, -1, S.tN[0], S.tN[1]); band(M.leafN, -2, -1, S.tN[0], S.tN[1]);
      band(M.barkF, S.tN[0], S.tN[1], S.tF[0], S.tF[1]); band(M.leafF, S.tN[0], S.tN[1], S.tF[0], S.tF[1]);
      band(M.imp, S.tF[0], S.tF[1], S.tI - 200, S.tI); }
    for (const m of Object.values(SAPM)) band(m, -2, -1, 38, 50);
    for (const m of PITM) band(m, -2, -1, 60, 75);
    matW.setVector2('uFade', new BABYLON.Vector2(S.R0, S.R1));
  }
  function update(P, groundY, dt) {
    const alt = Math.max(0, P.y - groundY);
    if ((planT -= dt) <= 0) { planT = 0.25; plan(P, alt); }
    const t0 = performance.now();
    while (S.on) {
      if (!job) { const w = queue.shift(); if (!w) break;
        if (w[2]) { const c = cells.get(w[1]); if (!c || !c.built || c.hiDone) continue; job = { ci: w[1], hi: true, it: hiJob(w[1]) }; }
        else { if (cells.has(w[1])) continue; cells.set(w[1], {}); job = { ci: w[1], it: cellJob(w[1]) }; } }
      const r = job.it.next(); if (r.done) job = null;
      if (performance.now() - t0 > S.budget) break;
    }
    // listas de árboles de celdas lejanas: poco a poco
    while (S.on && pendingTrees.length && performance.now() - t0 < S.budget + 2) { treesOf(pendingTrees.shift()[1]); added++; }
    instT -= dt;
    const moved = !lastIP || Math.hypot(P.x - lastIP.x, P.y - lastIP.y, P.z - lastIP.z) > 12;
    if (S.on && instT <= 0 && (moved || added > 0 && (instT < -1.6 || !pendingTrees.length))) { instT = 0.3; added = 0; lastIP = P.clone(); instances(P); }
  }
  function setRange(q) {
    S.on = q > 0;
    const k = q >= 2 ? 1.4 : 1;
    Object.assign(S, { R0: 150 * k, R1: 195 * k, RB: 215 * k, RD: 270 * k, tN: [55 * k, 70 * k], tF: [430 * k, 520 * k], tI: 2100 * (q >= 2 ? 1.3 : 1) });
    setBands();
    if (!S.on) { job = null; queue = []; for (const ci of [...cells.keys()]) drop(ci); for (const m of allTM) m.thinInstanceCount = 0; nTrees = [0, 0, 0]; treeTris = [0, 0, 0]; nSap = sapTris = nPit = 0; }
    lastIP = null; planT = 0;
  }
  setRange(1);
  const busy = () => !!job || queue.length > 0 || pendingTrees.length > 0;
  // vaciado de golpe (arnés de capturas): hasta que no quede nada pendiente, y una pasada más para asentar las instancias
  function flush(P, groundY) { let n = 0; for (let pass = 0; pass < 2; pass++) do { update(P, groundY, 0.5, 0); } while (busy() && ++n < 100000); update(P, groundY, 0.5, 0); }   // dos pasadas: la segunda planifica el mobiliario de detalle de las celdas recién hechas
  // árbol de la especie k más cercano a (x, z) entre las celdas ya calculadas (pruebas y hojas de contacto): [x, y, z, ángulo de la calle]
  // k = −1: cualquier adulto; −2: alcorque vacío (−3 con reja, −4 tierra sola); NSP: plantón (cualquiera de las dos variantes)
  function findTree(k, x, z) { let best = null, bd = 1e18;
    const ok = e => k === -1 ? e >= 0 && e < NSP : k === -2 ? e < 0 : k === -3 ? e === -1 : k === -4 ? e === -2 : k >= NSP ? e >= NSP : e === k;
    for (const T of treeCache.values()) for (let i = 0; i < T.length; i += 7) if (ok(T[i + 6])) { const d = (T[i] - x) ** 2 + (T[i + 2] - z) ** 2; if (d < bd) { bd = d; best = [T[i], T[i + 1], T[i + 2], T[i + 5]]; } }
    if (best) {                                         // para las vistas de prueba: dirección (unitaria) del árbol al eje de la calzada y distancia
      const o = nearestCar(best[0], best[2])[0] * 6, ax = SEG[o], az = SEG[o + 1], dx = SEG[o + 2] - ax, dz = SEG[o + 3] - az, L2 = dx * dx + dz * dz || 1;
      const u = Math.max(0, Math.min(1, ((best[0] - ax) * dx + (best[2] - az) * dz) / L2)), qx = ax + dx * u - best[0], qz = az + dz * u - best[2], ad = Math.hypot(qx, qz) || 1;
      best.push(qx / ad, qz / ad, ad); }
    return best; }
  // para las vistas de prueba: ¿es (x, z) suelo libre (ni dentro de un edificio ni en mitad de la calzada)?
  const free = (x, z) => coverAt(x, z, -1) < -1e8 && nearestCar(x, z)[1] > 0.3;
  // recuento de toda la ciudad (pruebas): árboles adultos, plantones y alcorques vacíos de todas las celdas (calcula las que falten)
  function countAll() { const c = { adult: 0, sap: 0, pit: 0 }; for (let ci = 0; ci < NX * NZ; ci++) { const T = treesOf(ci);
    for (let i = 6; i < T.length; i += 7) { const e = T[i]; if (e < 0) c.pit++; else if (e >= NSP) c.sap++; else c.adult++; } } return c; }
  const api = { update, setRange, flush, busy, findTree, free, countAll, lastCam: null,
    stats: () => ({ cells: cells.size, tris, furn: furnTris[0], furnHi: furnTris[1], hi: [...cells.values()].filter(c => c.hiDone).length, cam: api.lastCam, trees: nTrees, treeTris, sap: nSap, sapTris, pit: nPit, treeSp: TR.SP.map((sp, k) => sp.id + ':' + (treeSp[k] || 0)).join(' '), treeCells: treeCache.size, queue: queue.length, pending: pendingTrees.length, ext: [...cells.values()].reduce((a, c) => a + (c.ext || 0), 0), skirts: [...cells.values()].reduce((a, c) => a + (c.skirts || 0), 0) }) };
  return api;
} };
})();
