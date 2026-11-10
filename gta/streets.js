/* GTA Barcelona — Calles de detalle.
   Lleva la calle de «Transeúnte» a toda la ciudad, siguiendo la topografía real:
     · aceras de panot de 20×20 cm (el mismo generador de Transeúnte), bordillo de granito de 15 cm,
       plazas y calles peatonales enlosadas, alcorques con reja;
     · plátanos de sombra en tres niveles: árbol completo con ramas y hojas (cerca), copa de tarjetas (media
       distancia) e impostor (lejos), todos con instancias;
     · mobiliario: farolas, papeleras, bancos, contenedores de reciclaje con bolsas de basura y pasos de cebra.
   El asfalto (también de Transeúnte) va en el shader de calzada de app.js y cubre toda la ciudad.
   Igual que las fachadas: de lejos la ciudad simple, de cerca el detalle, construido por celdas en segundo plano. */
(function () {
'use strict';

let _s = 1;
const R = (a, b) => { _s |= 0; _s = _s + 0x6D2B79F5 | 0; let t = Math.imul(_s ^ _s >>> 15, 1 | _s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; const r = ((t ^ t >>> 14) >>> 0) / 4294967296;
  return a === undefined ? r : b === undefined ? r * a : a + r * (b - a); };
const hash2 = (x, z) => { let h = Math.imul((x * 73856093) ^ (z * 19349663), 0x9E3779B1); h ^= h >>> 15; return ((h >>> 0) % 100000) / 100000; };

const CAR = new Set([0, 1, 2, 3, 4, 5, 6, 8, 10, 11]);      // calzadas: ahí no hay acera
const WALK = new Set([2, 3, 4, 5, 6]);                      // calles con aceras a ambos lados
const PED = new Set([7, 9, 15, 16]);                        // peatonales, caminos y escaleras: enlosado
const TREE = new Set([2, 3, 4, 5, 6]);                      // calles arboladas (si la acera es estrecha, el control de fachada los descarta)
const FURN = new Set([2, 3, 4, 5, 6]);

window.BCN_STREETS = async function (ctx) {
  const { scene, engine, mkMat, COMMON, heightAt, SEG, WX, WZ, blobURL, FX, ROFF } = ctx;
  const { GB, quad, box, K, shade, mkMeshFrom, matB, ROADS, cellOf, CS, NX, NZ, coverAt } = FX.lib;
  const NS = SEG.length / 6;

  // ---------------------------------------------------------------- texturas
  const tex = async (f) => { const t = new BABYLON.Texture(await blobURL('data/' + f), scene, false, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
    t.wrapU = t.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE; t.anisotropicFilteringLevel = 8; return t; };
  const [tGrD, tGrN, tBkD, tBkN] = await Promise.all(['st_granite_d.webp', 'st_granite_n.webp', 'st_bark_d.webp', 'st_bark_n.webp'].map(tex));

  // panot: el mismo generador procedural de Transeúnte (baldosa de 20×20 cm con relieve)
  const [tPanD, tPanN] = (() => {
    _s = 1906;
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

  // hojas de plátano: atlas dibujado como en Transeúnte (cerca: hojas grandes; lejos: más y menudas; impostor: silueta)
  function leafCanvas(far, size) {
    const cv = document.createElement('canvas'); cv.width = cv.height = size; const g = cv.getContext('2d', { willReadFrequently: true });
    _s = far ? 62 : 61;
    const leaf = (x, y, sc, rot, gr) => {
      g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.beginPath(); g.moveTo(0, 1);
      for (const [S, M] of [[-2.7, .36], [-2.15, .62], [-1.75, .42], [-1.05, .92], [-.72, .5], [-.3, .78], [0, 1.05], [.3, .78], [.72, .5], [1.05, .92], [1.75, .42], [2.15, .62], [2.7, .36]]) g.lineTo(Math.sin(S) * M, -Math.cos(S) * M);
      g.closePath();
      const xr = gr * 0.72 + R(-10, 10), xg = gr, xb = gr * 0.3, T = g.createLinearGradient(0, -1, 0, 1);
      T.addColorStop(0, `rgb(${xr * 1.18 | 0},${xg * 1.16 | 0},${xb * 1.1 | 0})`); T.addColorStop(1, `rgb(${xr * 0.78 | 0},${xg * 0.8 | 0},${xb * 0.8 | 0})`);
      g.fillStyle = T; g.fill(); g.strokeStyle = `rgba(${xr * 1.5 | 0},${xg * 1.38 | 0},${xb * 1.3 | 0},.55)`; g.lineWidth = 0.028; g.beginPath();
      for (const S of [-1.05, -0.3, 0, 0.3, 1.05]) { g.moveTo(0, 0.55); g.lineTo(Math.sin(S) * 0.85, -Math.cos(S) * 0.85); }
      g.stroke(); g.restore();
    };
    const k = size / 1024, n = far ? 240 : 96;
    for (let u = 0; u < n; u++) { const f = R(6.28), rr = Math.pow(R(), 0.55) * size * 0.44; leaf(size / 2 + Math.cos(f) * rr, size / 2 + Math.sin(f) * rr, (far ? R(44, 74) : R(60, 104)) * k, R(6.28), 74 + R(82)); }
    return cv;
  }
  function impostorCanvas() {
    const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d', { willReadFrequently: true });
    _s = 63;
    g.fillStyle = '#6d5a44'; g.beginPath(); g.moveTo(S * 0.47, S); g.lineTo(S * 0.53, S); g.lineTo(S * 0.515, S * 0.45); g.lineTo(S * 0.485, S * 0.45); g.fill();
    for (let i = 0; i < 1400; i++) { const a = R(6.28), rr = Math.sqrt(R()); const x = S / 2 + Math.cos(a) * rr * S * 0.46, y = S * 0.36 + Math.sin(a) * rr * S * 0.3;
      const gr = 70 + R(90); g.fillStyle = `rgb(${gr * 0.72 | 0},${gr | 0},${gr * 0.3 | 0})`; g.beginPath(); g.arc(x, y, R(5, 13), 0, 6.3); g.fill(); }
    return cv;
  }
  function canvasTex(cv) {
    const g = cv.getContext('2d'), im = g.getImageData(0, 0, cv.width, cv.height), a = im.data; let r = 0, gg = 0, b = 0, n = 0;
    for (let i = 0; i < a.length; i += 4) if (a[i + 3] > 200) { r += a[i]; gg += a[i + 1]; b += a[i + 2]; n++; }
    for (let i = 0; i < a.length; i += 4) if (a[i + 3] < 30) { a[i] = r / n; a[i + 1] = gg / n; a[i + 2] = b / n; }
    const t = BABYLON.RawTexture.CreateRGBATexture(new Uint8Array(a.buffer), cv.width, cv.height, scene, true, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
    t.hasAlpha = true; t.anisotropicFilteringLevel = 4; return t;
  }
  const tLeafN = canvasTex(leafCanvas(false, 1024)), tLeafF = canvasTex(leafCanvas(true, 1024)), tImp = canvasTex(impostorCanvas());

  // ---------------------------------------------------------------- materiales
  const VS_WALK = `precision highp float;
attribute vec3 position; attribute vec2 uv; uniform mat4 world; uniform mat4 viewProjection;
varying vec3 vPos; varying vec3 vLoc; varying vec2 vUV;
void main(){ vec4 wp = world*vec4(position,1.0); vPos = wp.xyz; vLoc = position; vUV = uv; gl_Position = viewProjection*wp; }`;
  const FS_WALK = `#extension GL_OES_standard_derivatives : enable
` + COMMON + `
varying vec3 vPos; varying vec3 vLoc; varying vec2 vUV;
uniform vec2 uFade; uniform sampler2D tField; uniform sampler2D tPanD; uniform sampler2D tPanN; uniform sampler2D tGrD; uniform sampler2D tGrN;
void main(){
  vec3 V = uCam - vPos; float dist = length(V); V /= dist;
  if (dith() < smoothstep(uFade.x, uFade.y, dist)) discard;
  vec2 P = vLoc.xz;
  float nearN = 1.0 - smoothstep(4.0, 70.0, dist);
  vec3 alb; vec3 N = vec3(0.0, 1.0, 0.0);
  if (vUV.x < -0.5) {                                   // cara vertical del bordillo de granito
    vec3 n = normalize(cross(dFdx(vLoc), dFdy(vLoc))); if (dot(n, V) < 0.0) n = -n;
    vec3 tx = texture2D(tGrD, vec2(P.x + P.y, vLoc.y)*0.45).rgb;
    alb = vec3(0.58, 0.57, 0.55)*mix(0.7, 1.25, dot(tx, vec3(0.33))*1.8)*mix(0.55, 1.0, vUV.y);
    gl_FragColor = vec4(fog(lit(alb, n), vPos), 1.0); return;
  }
  vec4 f = texture2D(tField, vUV);
  float dA = f.r*12.75 - 2.0, pv = (f.g*255.0 - 128.0)/20.0;
  if (dA < 0.0 || pv < 0.0) discard;
  float n1 = vnoise(P*0.21)*0.5 + vnoise(P*0.02)*0.5, n2 = vnoise(P*0.93), n1g = vnoise(P*0.06 + 3.1);
  if (dA < 0.3) {                                       // bordillo: pieza de granito de 30 cm
    vec3 tx = texture2D(tGrD, P*0.6).rgb;
    alb = vec3(0.60, 0.59, 0.56)*mix(0.72, 1.2, dot(tx, vec3(0.33))*1.8);
    alb *= mix(0.75, 1.0, smoothstep(0.0, 0.05, dA));   // canto redondeado
    alb *= mix(0.92, 1.0, step(0.04, fract(dot(P, vec2(0.7071))*1.0)));   // juntas
  } else if (f.b > 0.5) {                               // plaza o calle peatonal: losas de granito
    vec2 gP = P/2.5; float gB = smoothstep(0.42, 0.62, vnoise(P*0.02));
    vec3 tx = mix(texture2D(tGrD, gP).rgb, texture2D(tGrD, gP.yx*0.75 + vec2(0.31, 0.17)).rgb, gB);
    alb = tx*1.75*mix(0.74, 1.12, n1)*mix(0.88, 1.08, n2);
    vec3 tn = texture2D(tGrN, gP).xyz*2.0 - 1.0; N = normalize(mix(N, vec3(tn.x, tn.z, tn.y), nearN));
  } else {                                              // panot de 20×20 cm
    vec2 gP = P*5.0; vec3 tx = texture2D(tPanD, gP).rgb;
    float tfw = fwidth(gP.x) + fwidth(gP.y), tileK = 1.0 - smoothstep(0.25, 0.9, tfw);   // de lejos, sin variación por baldosa (evita el muaré)
    alb = tx*mix(0.74, 1.12, n1)*mix(0.88, 1.08, n2);
    vec2 cl = floor(gP), tf = fract(gP); float h0 = hash21(cl), rep = step(0.9, vnoise(P*0.08)*0.9 + h0*0.12);
    alb *= mix(1.0, mix(0.94, 1.05, h0), tileK); alb = mix(alb, alb*vec3(1.05, 1.03, 0.99), rep*tileK);
    float gum = step(0.965, hash21(cl + 7.0))*smoothstep(0.13, 0.06, length(tf - vec2(hash21(cl + 3.0), hash21(cl + 9.0))*0.6 - 0.2)); alb *= 1.0 - gum*0.62*tileK;
    float dirt = smoothstep(0.38, 0.75, n1g); alb *= mix(1.0, 0.72, dirt*mix(0.45, smoothstep(0.0, 0.16, 0.5 - max(abs(tf.x - 0.5), abs(tf.y - 0.5)) + dirt*0.12), tileK));
    vec3 tn = texture2D(tPanN, gP).xyz*2.0 - 1.0; tn.xy *= 1.25; N = normalize(mix(N, vec3(tn.x, tn.z, tn.y), nearN));
  }
  if (f.a > 0.5) {                                      // alcorque: tierra y reja de fundición
    vec2 q = fract(P*4.0) - 0.5; float bar = step(0.38, max(abs(q.x), abs(q.y)));
    vec3 soil = vec3(0.21, 0.16, 0.11)*(0.7 + 0.6*vnoise(P*9.0));
    alb = mix(soil, vec3(0.09, 0.09, 0.1), bar*0.85); N = vec3(0.0, 1.0, 0.0);
  }
  vec3 c = lit(alb, N);
  gl_FragColor = vec4(fog(c, vPos), 1.0);
}`;
  const matW = mkMat('walk', VS_WALK, FS_WALK, ['position', 'uv'], ['uFade'], ['tField', 'tPanD', 'tPanN', 'tGrD', 'tGrN']);
  const VS_TREE = `precision highp float;
attribute vec3 position; attribute vec3 normal; attribute vec2 uv;
#include<instancesDeclaration>
uniform mat4 viewProjection;
varying vec3 vPos; varying vec3 vN; varying vec2 vUV; varying float vH;
void main(){
#include<instancesVertex>
  vec4 wp = finalWorld*vec4(position, 1.0); vPos = wp.xyz; vN = normalize(mat3(finalWorld)*normal); vUV = uv;
  vH = fract(sin(dot(finalWorld[3].xz, vec2(12.9898, 78.233)))*43758.5453);
  gl_Position = viewProjection*wp; }`;
  const FS_TREE = COMMON + `
varying vec3 vPos; varying vec3 vN; varying vec2 vUV; varying float vH;
uniform float uKind; uniform vec4 uBand; uniform sampler2D tMap; uniform sampler2D tNrm;
void main(){
  vec3 V = uCam - vPos; float dist = length(V); V /= dist;
  float d = dith();
  // fundido entre niveles: visible si la distancia está dentro de la banda [uBand.x→uBand.y … uBand.z→uBand.w]
  if (d < smoothstep(uBand.z, uBand.w, dist) || d >= smoothstep(uBand.x, uBand.y, dist)) discard;
  vec3 tint = mix(vec3(0.86, 0.98, 0.78), vec3(1.12, 1.06, 0.84), vH);
  if (uKind < 0.5) {                                    // corteza de plátano
    vec3 tx = texture2D(tMap, vUV*vec2(1.0, 0.5)).rgb;
    vec3 n = normalize(vN); vec3 tn = texture2D(tNrm, vUV*vec2(1.0, 0.5)).xyz*2.0 - 1.0;
    n = normalize(n + vec3(tn.x, tn.y*0.3, tn.x)*0.45);
    vec3 c = lit(tx*1.35, n);
    gl_FragColor = vec4(fog(c, vPos), 1.0); return;
  }
  vec4 tx = texture2D(tMap, vUV);
  if (tx.a < 0.5) discard;
  vec3 alb = tx.rgb*tint*(uKind > 1.5 ? 0.66 : 0.86);
  alb = mix(vec3(dot(alb, vec3(0.3, 0.6, 0.1))), alb, 0.82);   // verde de plátano, menos saturado
  vec3 n = normalize(vN); if (dot(n, V) < 0.0) n = mix(-n, n, 0.4);
  vec3 c = lit(alb, normalize(n + vec3(0.0, 0.35, 0.0)));
  float bt = pow(max(dot(-V, uSunDir), 0.0), 3.0)*0.85 + max(dot(-n, uSunDir), 0.0)*0.26;
  c += alb*vec3(1.05, 1.2, 0.55)*uSunCol*bt*0.3;
  gl_FragColor = vec4(fog(c, vPos), 1.0);
}`;
  const mkTreeMat = (name, kind, map, nrm) => { const m = mkMat(name, VS_TREE, FS_TREE, ['position', 'normal', 'uv'], ['uKind', 'uBand'], ['tMap', 'tNrm']);
    m.setFloat('uKind', kind); m.setTexture('tMap', map); m.setTexture('tNrm', nrm || map); m.setVector4('uBand', new BABYLON.Vector4(0, 0, 1e9, 1e9)); return m; };
  const mBarkN = mkTreeMat('barkN', 0, tBkD, tBkN), mLeafN = mkTreeMat('leafN', 1, tLeafN), mBarkF = mkTreeMat('barkF', 0, tBkD, tBkN), mLeafF = mkTreeMat('leafF', 1, tLeafF), mImp = mkTreeMat('imp', 2, tImp);

  // ---------------------------------------------------------------- geometría del plátano (como en Transeúnte)
  function treeGeo(hi) {
    _s = 5;
    const P = [], Nn = [], U = [], I = [];
    const ring = (c, ax, r, sides, v) => { // anillo perpendicular a ax
      let ux = -ax[2], uy = 0, uz = ax[0]; let l = Math.hypot(ux, uy, uz); if (l < 1e-4) { ux = 1; uz = 0; l = 1; } ux /= l; uz /= l;
      const wx = ax[1] * uz - ax[2] * uy, wy = ax[2] * ux - ax[0] * uz, wz = ax[0] * uy - ax[1] * ux;
      const base = P.length / 3;
      for (let k = 0; k <= sides; k++) { const a = k / sides * 6.2832, ca = Math.cos(a), sa = Math.sin(a);
        const nx = ux * ca + wx * sa, ny = uy * ca + wy * sa, nz = uz * ca + wz * sa;
        P.push(c[0] + nx * r, c[1] + ny * r, c[2] + nz * r); Nn.push(nx, ny, nz); U.push(k / sides, v); }
      return base;
    };
    const tube = (pts, rad, sides) => {
      let prev = -1, v = 0;
      for (let k = 0; k < pts.length; k++) {
        const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], ax = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(...ax); ax[0] /= l; ax[1] /= l; ax[2] /= l;
        if (k) v += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1], pts[k][2] - pts[k - 1][2]);
        const cur = ring(pts[k], ax, rad(k / (pts.length - 1)), sides, v);
        if (prev >= 0) for (let s = 0; s < sides; s++) I.push(prev + s, cur + s, cur + s + 1, prev + s, cur + s + 1, prev + s + 1);
        prev = cur;
      }
    };
    const NT = hi ? 14 : 4, trunk = [];
    for (let k = 0; k <= NT; k++) trunk.push([0, k / NT * 5.4, 0]);
    tube(trunk, E => 0.3 * (1 - E * 0.5) + 0.2 * Math.pow(1 - Math.min(1, E * 5), 2), hi ? 14 : 6);
    const tips = [];
    const br = (E, dir, len, rad, depth) => {
      const Pp = [E[0] + dir[0] * len, E[1] + dir[1] * len, E[2] + dir[2] * len];
      const M = [(E[0] + Pp[0]) / 2 + R(-0.25, 0.25), (E[1] + Pp[1]) / 2 + R(-0.1, 0.2), (E[2] + Pp[2]) / 2 + R(-0.25, 0.25)];
      tube([E, M, Pp], t => rad * (1 - 0.5 * t), depth === 0 ? (hi ? 9 : 5) : depth === 1 ? 5 : 3);
      if (depth >= (hi ? 3 : 0)) { tips.push(Pp); return; }
      for (let b = 0; b < 3; b++) {
        const a = R(6.28), q = R(0.25, 0.6); let W = [dir[0] + Math.cos(a) * q, dir[1] + R(0.05, 0.4), dir[2] + Math.sin(a) * q]; const l = Math.hypot(...W); W = W.map(x => x / l);
        const Z = b === 0 ? 1 : R(0.55, 0.9);
        br([E[0] + (Pp[0] - E[0]) * Z, E[1] + (Pp[1] - E[1]) * Z, E[2] + (Pp[2] - E[2]) * Z], W, len * 0.68, rad * 0.55, depth + 1);
      }
    };
    for (let k = 0; k < 5; k++) { const a = k * 1.257 + R(0.3); br([0, 4.9 + k * 0.1, 0], [Math.cos(a) * 0.66, 0.75, Math.sin(a) * 0.66], R(3.1, 3.9), 0.19, 0); }
    const bark = { P: new Float32Array(P), N: new Float32Array(Nn), U: new Float32Array(U), I: new Uint32Array(I) };
    return { bark, tips };
  }
  function leafGeo(tips, n, s0, s1, D) {
    _s = 41;
    const fy = tips.reduce((a, t) => a + t[1], 0) / tips.length;
    const P = [], N = [], U = [], I = [];
    for (let q = 0; q < n; q++) {
      const W = tips[Math.floor(R() * tips.length)], x = W[0] + R(-D, D), y = W[1] + R(-D * 0.7, D * 0.8), z = W[2] + R(-D, D), s = R(s0, s1), t = R(6.28), c = R(-1.2, 1.2);
      const a = [Math.cos(t), 0, Math.sin(t)], b = [-Math.sin(t) * Math.sin(c), Math.cos(c), Math.cos(t) * Math.sin(c)], base = P.length / 3;
      for (const [w, e] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const px = x + (a[0] * w + b[0] * e) * s, py = y + (a[1] * w + b[1] * e) * s, pz = z + (a[2] * w + b[2] * e) * s;
        P.push(px, py, pz); const nx = px, ny = py - fy + 1.2, nz = pz, l = Math.hypot(nx, ny, nz); N.push(nx / l, ny / l, nz / l); U.push((w + 1) / 2, (e + 1) / 2);
      }
      I.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    return { P: new Float32Array(P), N: new Float32Array(N), U: new Float32Array(U), I: new Uint32Array(I) };
  }
  function impGeo() {
    const P = [], N = [], U = [], I = [];
    for (const a of [0, Math.PI / 2]) { const c = Math.cos(a) * 5.2, s = Math.sin(a) * 5.2, base = P.length / 3;
      for (const [w, h, u, v] of [[-1, 0, 0, 0], [1, 0, 1, 0], [1, 12.5, 1, 1], [-1, 12.5, 0, 1]]) { P.push(c * w, h, s * w); N.push(-s / 5.2, 0.3, c / 5.2); U.push(u, v); }
      I.push(base, base + 1, base + 2, base, base + 2, base + 3); }
    return { P: new Float32Array(P), N: new Float32Array(N), U: new Float32Array(U), I: new Uint32Array(I) };
  }
  const mkGeoMesh = (name, g, mat) => {
    const m = new BABYLON.Mesh(name, scene);
    m.setVerticesData('position', g.P, false); m.setVerticesData('normal', g.N, false); m.setVerticesData('uv', g.U, false); m.setIndices(g.I);
    m.material = mat; m.isPickable = false; m.renderingGroupId = 1; m.alwaysSelectAsActiveMesh = true; m.doNotSyncBoundingInfo = true;
    m.thinInstanceSetBuffer('matrix', new Float32Array(16), 16, false); m.thinInstanceCount = 0;
    return m;
  };
  const gHi = treeGeo(true), gLo = treeGeo(false);
  const TM = {
    nearBark: mkGeoMesh('tNB', gHi.bark, mBarkN), nearLeaf: mkGeoMesh('tNL', leafGeo(gHi.tips, 620, 0.42, 0.78, 1), mLeafN),
    farBark: mkGeoMesh('tFB', gLo.bark, mBarkF), farLeaf: mkGeoMesh('tFL', leafGeo(gHi.tips, 90, 1.15, 1.9, 1.2), mLeafF),
    imp: mkGeoMesh('tI', impGeo(), mImp),
  };

  // ---------------------------------------------------------------- tramos: utilidades
  const segIn = (ci, f) => { // tramos de la celda y de sus 8 vecinas, sin repetir
    const cx = ci % NX, cz = (ci / NX) | 0, seen = new Set();
    for (let j = cz - 1; j <= cz + 1; j++) for (let i = cx - 1; i <= cx + 1; i++) { if (i < 0 || j < 0 || i >= NX || j >= NZ) continue; const c = j * NX + i;
      for (let k = ROADS.start[c]; k < ROADS.start[c + 1]; k++) { const s = ROADS.list[k]; if (!seen.has(s)) { seen.add(s); f(s); } } }
  };
  const segDist = (s, x, z) => { const o = s * 6, ax = SEG[o], az = SEG[o + 1], dx = SEG[o + 2] - ax, dz = SEG[o + 3] - az, l2 = dx * dx + dz * dz;
    let t = l2 > 0 ? ((x - ax) * dx + (z - az) * dz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; return Math.hypot(x - ax - dx * t, z - az - dz * t); };
  // cota de la calzada junto a (x,z), igual que la cinta de calle de app.js
  function roadY(s, x, z) {
    const o = s * 6, ax = SEG[o], az = SEG[o + 1], dx = SEG[o + 2] - ax, dz = SEG[o + 3] - az, hw = SEG[o + 4], cls = SEG[o + 5], l2 = dx * dx + dz * dz;
    let t = l2 > 0 ? ((x - ax) * dx + (z - az) * dz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const cx = ax + dx * t, cz = az + dz * t, ex0 = x - cx, ez0 = z - cz, el = Math.hypot(ex0, ez0) || 1;
    const yc = heightAt(cx, cz); let ye = heightAt(cx + ex0 / el * hw, cz + ez0 / el * hw);
    if (hw > 2.5) { ye = Math.max(ye, yc - hw * 0.08); if (hw > 9) ye = Math.max(ye, yc); }
    return ye + (ROFF[cls] || 0.15);
  }
  const walkY = (s, x, z) => s >= 0 ? Math.max(roadY(s, x, z) + 0.15, heightAt(x, z) + 0.2) : heightAt(x, z) + 0.2;
  function nearestCar(x, z) { const c = cellOf(x, z); let best = -1, bd = 1e9;
    for (let k = ROADS.start[c]; k < ROADS.start[c + 1]; k++) { const s = ROADS.list[k]; if (!CAR.has(SEG[s * 6 + 5])) continue; const d = segDist(s, x, z) - SEG[s * 6 + 4]; if (d < bd) { bd = d; best = s; } }
    return [best, bd]; }
  // cruces: extremos de tramo compartidos por tres o más tramos de calzada
  function junctions(ci) {
    const cnt = new Map(), pts = new Map();
    segIn(ci, s => { const o = s * 6; if (!CAR.has(SEG[o + 5])) return;
      for (const e of [0, 2]) { const k = Math.round(SEG[o + e] * 2) * 100000 + Math.round(SEG[o + e + 1] * 2); cnt.set(k, (cnt.get(k) || 0) + 1); if (!pts.has(k)) pts.set(k, [SEG[o + e], SEG[o + e + 1], []]); pts.get(k)[2].push(s); } });
    const out = []; for (const [k, n] of cnt) if (n >= 3) out.push(pts.get(k)); return out;
  }
  const jKey = (x, z) => Math.round(x * 2) * 100000 + Math.round(z * 2);

  // ---------------------------------------------------------------- árboles por celda (en caché; también para los niveles lejanos)
  const treeCache = new Map();
  function treesOf(ci) {
    let t = treeCache.get(ci); if (t) return t;
    const cx = ci % NX, cz = (ci / NX) | 0, x0 = cx * CS, z0 = cz * CS, out = [];
    const J = junctions(ci);
    for (let k = ROADS.start[ci]; k < ROADS.start[ci + 1]; k++) {
      const s = ROADS.list[k], o = s * 6, cls = SEG[o + 5], hw = SEG[o + 4];
      const rambla = cls === 7 && hw >= 4.5; if (!(TREE.has(cls) && hw >= 2.4) && !rambla) continue;
      const ax = SEG[o], az = SEG[o + 1], dx = SEG[o + 2] - ax, dz = SEG[o + 3] - az, L = Math.hypot(dx, dz); if (L < 2) continue;
      const tx = dx / L, tz = dz / L, px = -tz, pz = tx, sp = rambla ? 9 : 10.5, a0 = ax * tx + az * tz;
      for (let u = Math.ceil(a0 / sp) * sp - a0; u < L; u += sp) for (const side of [-1, 1]) {
        const off = rambla ? hw - 1.2 : hw + 1.3, x = ax + tx * u + px * side * off, z = az + tz * u + pz * side * off;
        if (x < x0 || x >= x0 + CS || z < z0 || z >= z0 + CS) continue;
        if (hash2(Math.round(x * 3), Math.round(z * 3)) > 0.93) continue;
        let bad = false;
        for (const j of J) if (Math.hypot(x - j[0], z - j[1]) < 11) { bad = true; break; }
        if (bad) continue;
        const [ns, nd] = nearestCar(x, z); if (nd < 1.0) continue;
        if (coverAt(x, z, -1) > -1e8 || !rambla && coverAt(x + px * side * 1.4, z + pz * side * 1.4, -1) > -1e8) continue;
        const y = walkY(ns, x, z), h = hash2(Math.round(x * 7), Math.round(z * 7));
        out.push(x, y - 0.17, z, h * 6.2832, 0.9 + 0.38 * hash2(Math.round(z * 5), Math.round(x * 5)), Math.atan2(tz, tx));
      }
    }
    t = new Float32Array(out);
    const mats = new Float32Array(t.length / 6 * 16), m = new BABYLON.Matrix(), q = new BABYLON.Quaternion(), v = new BABYLON.Vector3(), sc = new BABYLON.Vector3();
    for (let k = 0, w = 0; k < t.length; k += 6, w += 16) {
      BABYLON.Quaternion.RotationYawPitchRollToRef(t[k + 3], 0, 0, q); v.set(t[k], t[k + 1], t[k + 2]); sc.set(t[k + 4], t[k + 4] * (0.95 + 0.17 * ((t[k + 3] * 7) % 1)), t[k + 4]);
      BABYLON.Matrix.ComposeToRef(sc, q, v, m); mats.set(m.m, w);
    }
    t.mats = mats; treeCache.set(ci, t); return t;
  }

  // ---------------------------------------------------------------- atlas del campo de aceras (una textura para todas las celdas)
  const RES = 0.5, MG = 4, NT = Math.round(CS / RES) + 2 * MG, AT = 2048, SLOTS = Math.floor(AT / NT);
  const atlas = BABYLON.RawTexture.CreateRGBATexture(new Uint8Array(AT * AT * 4), AT, AT, scene, false, false, BABYLON.Texture.BILINEAR_SAMPLINGMODE);
  atlas.wrapU = atlas.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
  matW.setTexture('tField', atlas); matW.setTexture('tPanD', tPanD); matW.setTexture('tPanN', tPanN); matW.setTexture('tGrD', tGrD); matW.setTexture('tGrN', tGrN);
  const freeSlots = []; for (let k = SLOTS * SLOTS - 1; k >= 0; k--) freeSlots.push(k);

  const WSW = 14;  // ancho máximo de acera desde el bordillo (Passeig de Gràcia y similares)
  function* cellJob(ci) {
    const cell = cells.get(ci), cx = ci % NX, cz = (ci / NX) | 0, ox = cx * CS, oz = cz * CS;
    const fx0 = ox - MG * RES, fz0 = oz - MG * RES;
    const dA = new Float32Array(NT * NT).fill(99), dS = new Float32Array(NT * NT).fill(99), dP = new Float32Array(NT * NT).fill(99), near = new Int32Array(NT * NT).fill(-1);
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
          if (ped && e < dP[q]) dP[q] = e;
        } }
    }
    yield;
    // árboles de la celda y vecinas (para los alcorques)
    const pits = [];
    for (let j = cz - 1; j <= cz + 1; j++) for (let i = cx - 1; i <= cx + 1; i++) { if (i < 0 || j < 0 || i >= NX || j >= NZ) continue; const T = treesOf(j * NX + i); for (let k = 0; k < T.length; k += 6) pits.push(T[k], T[k + 2], T[k + 5]); }
    yield;
    // campo → RGBA
    const F = new Uint8Array(NT * NT * 4);
    for (let q = 0; q < NT * NT; q++) {
      const a = dA[q], pv = Math.max(WSW - dS[q], 0.6 - dP[q]);
      F[q * 4] = Math.max(0, Math.min(255, (a + 2) * 20));
      F[q * 4 + 1] = Math.max(0, Math.min(255, pv * 20 + 128));
      F[q * 4 + 2] = Math.max(0, Math.min(255, 128 + Math.min(0.6 - dP[q], dS[q] - 2.5) * 30));   // > 128: losa de granito (peatonal)
    }
    for (let k = 0; k < pits.length; k += 3) {
      const x = pits[k], z = pits[k + 1], an = pits[k + 2], c = Math.cos(an), sn = Math.sin(an);
      const i0 = Math.max(0, Math.floor((x - 1 - fx0) / RES)), i1 = Math.min(NT - 1, Math.ceil((x + 1 - fx0) / RES)), j0 = Math.max(0, Math.floor((z - 1 - fz0) / RES)), j1 = Math.min(NT - 1, Math.ceil((z + 1 - fz0) / RES));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const ex = fx0 + (i + 0.5) * RES - x, ez = fz0 + (j + 0.5) * RES - z;
        if (Math.abs(ex * c + ez * sn) < 0.62 && Math.abs(-ex * sn + ez * c) < 0.62) F[(j * NT + i) * 4 + 3] = 255; }
    }
    const slot = freeSlots.pop(); if (slot === undefined) return;
    const sx = (slot % SLOTS) * NT, sy = Math.floor(slot / SLOTS) * NT;
    yield;
    // malla de acera (rejilla de 1 m que sigue el terreno; el contorno exacto lo recorta el shader con el campo)
    const W = new GB(ox, oz), G = Math.round(CS), gx0 = 0, gz0 = 0;
    const P = [], UV = [], I = [], vid = new Int32Array((G + 1) * (G + 1)).fill(-1);
    const fieldAt = (x, z) => { const i = Math.min(NT - 1, Math.max(0, Math.round((x - fx0) / RES - 0.5))), j = Math.min(NT - 1, Math.max(0, Math.round((z - fz0) / RES - 0.5))); return j * NT + i; };
    const keep = q => dA[q] > -0.7 && Math.max(WSW - dS[q], 0.6 - dP[q]) > -0.7;
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
    const curb = (x1, z1, x2, z2, s) => {
      const t1 = walkY(s, x1, z1), t2 = walkY(s, x2, z2), b1 = s >= 0 ? roadY(s, x1, z1) - 0.03 : t1 - 0.18, b2 = s >= 0 ? roadY(s, x2, z2) - 0.03 : t2 - 0.18, base = P.length / 3;
      P.push(x1 - ox, b1, z1 - oz, x2 - ox, b2, z2 - oz, x2 - ox, t2, z2 - oz, x1 - ox, t1, z1 - oz); UV.push(-1, 0, -1, 0, -1, 1, -1, 1);
      I.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };
    for (let j = MG - 1; j < NT - MG - 1; j++) for (let i = MG - 1; i < NT - MG - 1; i++) {
      const k0 = j * NT + i, a0 = dA[k0] >= 0, a1 = dA[k0 + 1] >= 0, a2 = dA[k0 + NT + 1] >= 0, a3 = dA[k0 + NT] >= 0;
      if (a0 === a1 && a1 === a2 && a2 === a3) continue;
      const q = [k0, k0 + 1, k0 + NT + 1, k0 + NT], v = q.map(k => dA[k]), pos = [a0, a1, a2, a3];
      if (!q.some(k => dA[k] >= 0 && Math.max(WSW - dS[k], 0.6 - dP[k]) > 0)) continue;
      const cxs = [[0, 0], [1, 0], [1, 1], [0, 1]], pts = [];
      for (let e = 0; e < 4; e++) { const a = e, b = (e + 1) % 4; if (pos[a] !== pos[b]) { const t = v[a] / (v[a] - v[b]);
        pts.push([fx0 + (i + 0.5 + cxs[a][0] + (cxs[b][0] - cxs[a][0]) * t) * RES, fz0 + (j + 0.5 + cxs[a][1] + (cxs[b][1] - cxs[a][1]) * t) * RES]); } }
      const s = near[q.find(k => near[k] >= 0) ?? q[0]];
      for (let e = 0; e + 1 < pts.length; e += 2) curb(pts[e][0], pts[e][1], pts[e + 1][0], pts[e + 1][1], s);
    }
    yield;
    // mobiliario
    furniture(ci, W, ox, oz);
    yield;
    if (cells.get(ci) !== cell) { freeSlots.push(slot); return; }
    engine.updateTextureData(atlas.getInternalTexture(), F, sx, sy, NT, NT);
    let walkMesh = null;
    if (I.length) {
      walkMesh = new BABYLON.Mesh('wk' + ci, scene);
      walkMesh.setVerticesData('position', new Float32Array(P), false); walkMesh.setVerticesData('uv', new Float32Array(UV), false); walkMesh.setIndices(new Uint32Array(I));
      walkMesh.material = matW; walkMesh.isPickable = false; walkMesh.renderingGroupId = 1; walkMesh.position.set(ox, 0, oz); walkMesh.freezeWorldMatrix(); walkMesh.doNotSyncBoundingInfo = true;
    }
    const furnMesh = mkMeshFrom(W, matB, 'fu' + ci);
    cell.walk = walkMesh; cell.furn = furnMesh; cell.slot = slot; cell.tris = I.length / 3 + W.ni / 3; tris += cell.tris;
  }

  // ---------------------------------------------------------------- mobiliario urbano
  const F0 = { x: 0, z: 0, tx: 1, tz: 0, nx: 0, nz: 1 };
  function cyl(B, x, z, y0, y1, r0, r1, sides, col, kind) {
    for (let k = 0; k < sides; k++) { const a = k / sides * 6.2832, b = (k + 1) / sides * 6.2832;
      quad(B, F0, x + Math.cos(a) * r0, y0, z + Math.sin(a) * r0, x + Math.cos(b) * r0, y0, z + Math.sin(b) * r0, x + Math.cos(b) * r1, y1, z + Math.sin(b) * r1, x + Math.cos(a) * r1, y1, z + Math.sin(a) * r1, shade(col, 0.85 + 0.15 * Math.cos(a - 0.8)), kind); }
    quad(B, F0, x - r1, y1, z - r1, x + r1, y1, z - r1, x + r1, y1, z + r1, x - r1, y1, z + r1, col, kind);
  }
  // caja orientada: centro (x,z), base y, medidas a lo largo (l), ancho (w), alto (h), ángulo a
  function obox(B, x, z, y, l, w, h, a, col, kind) {
    const F = { x: x - Math.cos(a) * l / 2 + Math.sin(a) * w / 2, z: z - Math.sin(a) * l / 2 - Math.cos(a) * w / 2, tx: Math.cos(a), tz: Math.sin(a), nx: -Math.sin(a), nz: Math.cos(a) };
    box(B, F, 0, l, y, y + h, 0, w, col, kind);
    quad(B, F, 0, y, 0, l, y, 0, l, y + h, 0, 0, y + h, 0, shade(col, 0.85), kind);
  }
  const CONT = [[72, 77, 87], [20, 77, 158], [209, 173, 26], [20, 107, 51], [77, 51, 31]];
  // barra de sección cuadrada entre dos puntos (tubos de bicicleta, radios…)
  function bar(B, a, b, r, col, kind) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1, ux = dx / L, uy = dy / L, uz = dz / L;
    let px = -uz, py = 0, pz = ux, pl = Math.hypot(px, py, pz); if (pl < 1e-3) { px = 1; py = 0; pz = 0; pl = 1; } px /= pl; py /= pl; pz /= pl;
    const qx = uy * pz - uz * py, qy = uz * px - ux * pz, qz = ux * py - uy * px, C = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    for (let k = 0; k < 4; k++) { const [s1, t1] = C[k], [s2, t2] = C[(k + 1) % 4];
      const o1x = (px * s1 + qx * t1) * r, o1y = (py * s1 + qy * t1) * r, o1z = (pz * s1 + qz * t1) * r, o2x = (px * s2 + qx * t2) * r, o2y = (py * s2 + qy * t2) * r, o2z = (pz * s2 + qz * t2) * r;
      quad(B, F0, a[0] + o1x, a[1] + o1y, a[2] + o1z, a[0] + o2x, a[1] + o2y, a[2] + o2z, b[0] + o2x, b[1] + o2y, b[2] + o2z, b[0] + o1x, b[1] + o1y, b[2] + o1z, shade(col, 0.8 + 0.2 * k / 3), kind); }
  }
  // bicicleta de Bicing (geometría de la bici de Transeúnte): x,z locales a la celda, ang = hacia dónde apunta
  function bicing(B, x, z, y, ang) {
    const fx = Math.cos(ang), fz = Math.sin(ang), Pt = (f, h, sd = 0) => [x + fx * f - fz * sd, y + h, z + fz * f + fx * sd];
    const red = [191, 26, 31], blk = [22, 22, 24], gry = [150, 150, 155];
    for (const w of [-0.53, 0.53]) { for (let k = 0; k < 12; k++) { const a1 = k / 12 * 6.2832, a2 = (k + 1) / 12 * 6.2832;
        bar(B, Pt(w + Math.cos(a1) * 0.31, 0.33 + Math.sin(a1) * 0.31), Pt(w + Math.cos(a2) * 0.31, 0.33 + Math.sin(a2) * 0.31), 0.022, blk, K.METAL); }
      bar(B, Pt(w, 0.33, -0.04), Pt(w, 0.33, 0.04), 0.03, gry, K.METAL); }
    const T = (pts, r, c) => { for (let k = 0; k + 1 < pts.length; k++) bar(B, Pt(pts[k][0], pts[k][1]), Pt(pts[k + 1][0], pts[k + 1][1]), r, c, K.METAL); };
    T([[-0.53, 0.33], [-0.1, 0.72], [0.33, 0.72], [0.53, 0.33]], 0.022, red);
    T([[-0.53, 0.33], [0.05, 0.33], [0.33, 0.72]], 0.02, red);
    T([[0.05, 0.33], [-0.1, 0.72], [-0.14, 0.88]], 0.02, red);
    T([[0.33, 0.72], [0.38, 0.96]], 0.02, red);
    bar(B, Pt(0.38, 0.96, -0.26), Pt(0.38, 0.96, 0.26), 0.016, blk, K.METAL);
    bar(B, Pt(-0.27, 0.9), Pt(-0.03, 0.9), 0.045, blk, K.PLAIN);
    bar(B, Pt(0.5, 0.85), Pt(0.72, 0.85), 0.12, [235, 235, 232], K.METAL);   // cesta
  }
  function furniture(ci, W, ox, oz) {
    const cx = ci % NX, cz = (ci / NX) | 0, x0 = cx * CS, z0 = cz * CS;
    const J = junctions(ci), Jset = new Set(J.map(j => jKey(j[0], j[1])));
    const inCell = (x, z) => x >= x0 && x < x0 + CS && z >= z0 && z < z0 + CS;
    const nearJ = (x, z, r) => { for (const j of J) if (Math.hypot(x - j[0], z - j[1]) < r) return true; return false; };
    const freeWalk = (x, z) => { const [s, d] = nearestCar(x, z); return d > 0.25 && coverAt(x, z, -1) < -1e8 ? s : -2; };
    const lampC = [38, 46, 42], ironC = [26, 26, 28];
    for (let k = ROADS.start[ci]; k < ROADS.start[ci + 1]; k++) {
      const s = ROADS.list[k], o = s * 6, cls = SEG[o + 5], hw = SEG[o + 4]; if (!FURN.has(cls) || hw < 2) continue;
      const ax = SEG[o], az = SEG[o + 1], dx = SEG[o + 2] - ax, dz = SEG[o + 3] - az, L = Math.hypot(dx, dz); if (L < 1) continue;
      const tx = dx / L, tz = dz / L, px = -tz, pz = tx, a0 = ax * tx + az * tz, ang = Math.atan2(tz, tx);
      const along = (sp, ph, f) => { for (let u = Math.ceil((a0 - ph) / sp) * sp + ph - a0; u < L; u += sp) f(u, Math.round((a0 + u - ph) / sp)); };
      // farolas: cada 24 m alternando acera, con brazo sobre la calzada
      along(24, 5, (u, n) => { const side = n % 2 ? 1 : -1, off = hw + 0.5, x = ax + tx * u + px * side * off, z = az + tz * u + pz * side * off;
        if (!inCell(x, z) || nearJ(x, z, 6)) return; const ns = freeWalk(x, z); if (ns < -1) return;
        const y = walkY(ns, x, z) - 0.02, H = hw > 6 ? 9.5 : 7.8;
        cyl(W, x - ox, z - oz, y, y + 0.55, 0.16, 0.12, 8, lampC, K.METAL);
        cyl(W, x - ox, z - oz, y + 0.55, y + H, 0.09, 0.055, 8, lampC, K.METAL);
        const reach = Math.min(1.9, hw * 0.45), ex = x - px * side * reach, ez = z - pz * side * reach;
        obox(W, (x + ex) / 2 - ox, (z + ez) / 2 - oz, y + H - 0.05, reach + 0.1, 0.07, 0.07, Math.atan2(-pz * side, -px * side), lampC, K.METAL);
        obox(W, ex - ox, ez - oz, y + H - 0.28, 0.62, 0.3, 0.22, ang, lampC, K.METAL);
        obox(W, ex - ox, ez - oz, y + H - 0.31, 0.5, 0.22, 0.03, ang, [255, 236, 190], K.LAMP);
      });
      // papeleras
      along(37, 13, (u, n) => { const side = n % 2 ? -1 : 1, off = hw + 0.6, x = ax + tx * u + px * side * off, z = az + tz * u + pz * side * off;
        if (!inCell(x, z) || nearJ(x, z, 5)) return; const ns = freeWalk(x, z); if (ns < -1) return;
        const y = walkY(ns, x, z) - 0.02, c = hash2(n, s) < 0.6 ? [150, 30, 32] : [70, 74, 78];
        cyl(W, x - ox, z - oz, y, y + 1.0, 0.035, 0.035, 6, ironC, K.METAL);
        cyl(W, x - ox + px * side * 0.2, z - oz + pz * side * 0.2, y + 0.38, y + 0.92, 0.2, 0.22, 10, c, K.METAL);
      });
      // bancos (solo en aceras anchas)
      along(53, 27, (u, n) => { const side = n % 2 ? 1 : -1, off = hw + 2.4, x = ax + tx * u + px * side * off, z = az + tz * u + pz * side * off;
        if (!inCell(x, z) || nearJ(x, z, 8)) return;
        if (freeWalk(x, z) < -1 || coverAt(x + px * side * 1.6, z + pz * side * 1.6, -1) > -1e8) return;
        const [ns] = nearestCar(x, z), y = walkY(ns, x, z) - 0.02, wood = [122, 78, 44];
        for (const e of [-0.75, 0.75]) obox(W, x - ox + tx * e, z - oz + tz * e, y, 0.08, 0.5, 0.45, ang, ironC, K.METAL);
        for (let q = 0; q < 4; q++) obox(W, x - ox + px * side * (q * 0.12 - 0.18), z - oz + pz * side * (q * 0.12 - 0.18), y + 0.43, 1.8, 0.09, 0.04, ang, wood, K.WOOD);
        for (let q = 0; q < 3; q++) obox(W, x - ox + px * side * 0.26, z - oz + pz * side * 0.26, y + 0.55 + q * 0.13, 1.8, 0.04, 0.08, ang, wood, K.WOOD);
      });
      // contenedores de reciclaje (en el carril de aparcamiento) con alguna bolsa de basura
      if ((cls === 4 || cls === 5) && hw >= 3) along(95, 41, (u, n) => {
        const side = hash2(n, 7) < 0.5 ? 1 : -1, off = hw - 1.15, cxp = ax + tx * u + px * side * off, czp = az + tz * u + pz * side * off;
        if (!inCell(cxp, czp) || nearJ(cxp, czp, 14) || u < 5 || u > L - 5) return;
        _s = n * 977 + s;
        const nc = 3 + Math.floor(R() * 3);
        for (let c = 0; c < nc; c++) {
          const e = (c - (nc - 1) / 2) * 1.85, x = cxp + tx * e, z = czp + tz * e, y = roadY(s, x, z), col = CONT[c % 5];
          if (c % 5 === 3) { cyl(W, x - ox, z - oz, y, y + 1.45, 0.75, 0.6, 12, col, K.METAL); cyl(W, x - ox, z - oz, y + 1.45, y + 1.6, 0.25, 0.18, 8, shade(col, 1.2), K.METAL); continue; }
          obox(W, x - ox, z - oz, y + 0.1, 1.55, 1.45, 1.15, ang, col, K.METAL);
          obox(W, x - ox, z - oz, y + 1.25, 1.65, 1.55, 0.12, ang, shade(col, 1.2), K.METAL);
          obox(W, x - ox - px * side * 0.73, z - oz - pz * side * 0.73, y + 0.95, 1.1, 0.04, 0.06, ang, [20, 20, 20], K.PLAIN);
        }
        const nb = Math.floor(R() * 4);
        for (let b = 0; b < nb; b++) { const e = R(-2.5, 2.5), x = cxp + tx * e + px * side * 0.95, z = czp + tz * e + pz * side * 0.95, y = roadY(s, x, z), sz = R(0.32, 0.5);
          obox(W, x - ox, z - oz, y, sz, sz * 0.9, sz * 0.85, ang + R(-0.6, 0.6), R() < 0.6 ? [25, 25, 28] : [80, 82, 70], K.PLAIN); }
      });
      // estación de Bicing en el carril de aparcamiento: tótem, anclajes y bicicletas
      if (cls >= 3 && cls <= 5 && hw >= 3) along(310, 150, (u, n) => {
        const side = hash2(n, 11) < 0.5 ? 1 : -1, off = hw - 1.0, cxp = ax + tx * u + px * side * off, czp = az + tz * u + pz * side * off;
        if (!inCell(cxp, czp) || nearJ(cxp, czp, 16) || u < 7 || u > L - 7) return;
        _s = n * 131 + s * 7;
        const nd = 9 + Math.floor(R() * 6), bang = Math.atan2(pz * side, px * side);
        for (let d = 0; d < nd; d++) {
          const e = (d - (nd - 1) / 2) * 0.85, x = cxp + tx * e, z = czp + tz * e, y = roadY(s, x, z);
          obox(W, x + px * side * 0.62 - ox, z + pz * side * 0.62 - oz, y, 0.14, 0.14, 0.85, ang, [96, 99, 104], K.METAL);
          if (R() < 0.72) bicing(W, x - ox, z - oz, y, bang);
        }
        const e = ((nd - 1) / 2 + 0.9), x = cxp + tx * e + px * side * 0.62, z = czp + tz * e + pz * side * 0.62, y = roadY(s, x, z);
        obox(W, x - ox, z - oz, y, 0.55, 0.36, 2.1, ang, [60, 62, 66], K.METAL);
        obox(W, x - ox, z - oz, y + 1.55, 0.57, 0.38, 0.45, ang, [191, 26, 31], K.METAL);
        obox(W, cxp - ox + px * side * 0.62, czp - oz + pz * side * 0.62, y, nd * 0.85, 0.3, 0.06, ang, [80, 82, 86], K.METAL);
      });
      // pasos de cebra en los extremos de tramo que llegan a un cruce
      for (const [e, dir] of [[0, 1], [2, -1]]) {
        const jx = SEG[o + e], jz = SEG[o + e + 1]; if (!Jset.has(jKey(jx, jz)) || cls === 6 && hw < 3) continue;
        let back = 3; for (const j of J) if (jKey(j[0], j[1]) === jKey(jx, jz)) for (const s2 of j[2]) if (s2 !== s) back = Math.max(back, SEG[s2 * 6 + 4] + 2.2);
        if (back + 4 > L) continue;
        const ux = tx * dir, uz = tz * dir, mx = jx + ux * (back + 2), mz = jz + uz * (back + 2);
        if (!inCell(mx, mz)) continue;
        for (let w = -hw + 0.5; w < hw - 0.6; w += 1.1) {
          const corners = [[back, w], [back + 4, w], [back + 4, w + 0.55], [back, w + 0.55]].map(([a, b]) => { const x = jx + ux * a + px * b, z = jz + uz * a + pz * b; return [x - ox, roadY(s, x, z) + 0.025, z - oz]; });
          quad(W, F0, corners[0][0], corners[0][1], corners[0][2], corners[1][0], corners[1][1], corners[1][2], corners[2][0], corners[2][1], corners[2][2], corners[3][0], corners[3][1], corners[3][2], [222, 222, 214], K.PLAIN);
        }
      }
    }
  }

  // ---------------------------------------------------------------- celdas e instancias
  const cells = new Map();
  const S = { on: true, R0: 150, R1: 195, RB: 215, RD: 270, budget: 4, tN: [55, 70], tF: [430, 520], tI: 2100 };
  let job = null, queue = [], tris = 0, planT = 0, instT = 0, lastIP = null, added = 0;
  function drop(ci) {
    const c = cells.get(ci); if (!c) return;
    if (c.walk) c.walk.dispose(false, false); if (c.furn) c.furn.dispose(false, false);
    if (c.slot !== undefined) freeSlots.push(c.slot);
    tris -= c.tris || 0; cells.delete(ci);
  }
  function plan(P, alt) {
    const want = [], keep = new Set();
    if (S.on && alt < S.RD) {
      const r = Math.ceil(S.RD / CS) + 1, ci0 = Math.floor(P.x / CS), cj0 = Math.floor(P.z / CS);
      for (let j = cj0 - r; j <= cj0 + r; j++) for (let i = ci0 - r; i <= ci0 + r; i++) {
        if (i < 0 || j < 0 || i >= NX || j >= NZ) continue;
        const ci = j * NX + i, dx = Math.max(i * CS - P.x, 0, P.x - (i + 1) * CS), dz = Math.max(j * CS - P.z, 0, P.z - (j + 1) * CS), d = Math.hypot(dx, dz, alt);
        if (d < S.RD) keep.add(ci);
        if (d < S.RB && !cells.has(ci)) want.push([d, ci]);
      }
    }
    for (const ci of [...cells.keys()]) if (!keep.has(ci) && !(job && job.ci === ci)) drop(ci);
    if (job && !keep.has(job.ci)) { cells.delete(job.ci); job = null; }
    want.sort((a, b) => a[0] - b[0]); queue = want;
  }
  // instancias de árboles: se recalculan al moverse; las listas por celda se calculan poco a poco
  let pendingTrees = [];
  function instances(P) {
    const r = S.tI + 60, c0 = Math.floor((P.x - r) / CS), c1 = Math.floor((P.x + r) / CS), d0 = Math.floor((P.z - r) / CS), d1 = Math.floor((P.z + r) / CS);
    const sel = [[], [], []], cnt = [0, 0, 0];
    pendingTrees = [];
    for (let j = Math.max(0, d0); j <= Math.min(NZ - 1, d1); j++) for (let i = Math.max(0, c0); i <= Math.min(NX - 1, c1); i++) {
      const dx = Math.max(i * CS - P.x, 0, P.x - (i + 1) * CS), dz = Math.max(j * CS - P.z, 0, P.z - (j + 1) * CS); if (Math.hypot(dx, dz) > r) continue;
      const ci = j * NX + i, T = treeCache.get(ci);
      if (!T) { pendingTrees.push([Math.hypot(dx, dz), ci]); continue; }
      for (let k = 0, w = 0; k < T.length; k += 6, w += 16) {
        const d = Math.hypot(T[k] - P.x, T[k + 1] + 6 - P.y, T[k + 2] - P.z);
        if (d < S.tN[1] + 2) { sel[0].push(T.mats, w); cnt[0]++; }
        if (d > S.tN[0] - 2 && d < S.tF[1] + 2) { sel[1].push(T.mats, w); cnt[1]++; }
        if (d > S.tF[0] - 2 && d < S.tI) { sel[2].push(T.mats, w); cnt[2]++; }
      }
    }
    pendingTrees.sort((a, b) => a[0] - b[0]);
    const groups = [[TM.nearBark, TM.nearLeaf], [TM.farBark, TM.farLeaf], [TM.imp]];
    for (let g = 0; g < 3; g++) {
      const b = new Float32Array(Math.max(16, cnt[g] * 16)), L = sel[g];
      for (let k = 0, w = 0; k < L.length; k += 2, w += 16) b.set(L[k].subarray(L[k + 1], L[k + 1] + 16), w);
      for (const me of groups[g]) { me.thinInstanceSetBuffer('matrix', b, 16, false); me.thinInstanceCount = cnt[g]; }
    }
    nTrees = cnt;
  }
  let nTrees = [0, 0, 0];
  const band = (m, a, b, c, d) => m.setVector4('uBand', new BABYLON.Vector4(a, b, c, d));
  function setBands() {
    band(mBarkN, -2, -1, S.tN[0], S.tN[1]); band(mLeafN, -2, -1, S.tN[0], S.tN[1]);
    band(mBarkF, S.tN[0], S.tN[1], S.tF[0], S.tF[1]); band(mLeafF, S.tN[0], S.tN[1], S.tF[0], S.tF[1]);
    band(mImp, S.tF[0], S.tF[1], S.tI - 200, S.tI);
    matW.setVector2('uFade', new BABYLON.Vector2(S.R0, S.R1));
  }
  function update(P, groundY, dt) {
    const alt = Math.max(0, P.y - groundY);
    if ((planT -= dt) <= 0) { planT = 0.25; plan(P, alt); }
    const t0 = performance.now();
    while (S.on) {
      if (!job) { const w = queue.shift(); if (!w) break; if (cells.has(w[1])) continue; cells.set(w[1], {}); job = { ci: w[1], it: cellJob(w[1]) }; }
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
    if (!S.on) { job = null; queue = []; for (const ci of [...cells.keys()]) drop(ci); for (const m of Object.values(TM)) m.thinInstanceCount = 0; nTrees = [0, 0, 0]; }
    lastIP = null; planT = 0;
  }
  setRange(1);
  return { update, setRange, busy: () => !!job || queue.length > 0 || pendingTrees.length > 0,
    stats: () => ({ cells: cells.size, tris, trees: nTrees, treeCells: treeCache.size, queue: queue.length, pending: pendingTrees.length }) };
};
})();
