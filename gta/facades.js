/* GTA Barcelona — Fachadas de detalle.
   Lleva la fachada del Eixample de «Transeúnte» (planta baja de piedra con comercios y portal, balconeras con
   derrame, persianas, porticones, balcones de forja, tribunas, esgrafiados, cornisa y balaustrada) a todos los
   edificios de viviendas de la ciudad, respetando su planta y su altura reales.
   Sistema de niveles de detalle:
     · lejos   → el volumen simple de siempre (shader con ventanas pintadas);
     · cerca   → capa BASE: fachada en 3D construida al vuelo por celdas de 100 m (fundido tramado con el volumen);
     · muy cerca → capa ORNAMENTO: carpinterías, molduras, pilastras, ménsulas, macetas, dentículos…
   Todo se genera en segundo plano con un presupuesto de milisegundos por fotograma. */
(function () {
'use strict';

const K = { STUCCO: 0, STONE: 1, GLASS: 2, SHUT: 3, WOOD: 4, METAL: 5, IRON: 6, SGRAF: 7, SIGN: 8, AWN: 9, BAL: 10, GSHOP: 11, LAMP: 12, PLAIN: 13, LEAF: 14 };

// ------------------------------------------------------------------ geometría acumulada (posición + color/tipo + auxiliar)
class GB {
  constructor(ox, oz) { this.ox = ox; this.oz = oz; this.cap = 4096; this.p = new Float32Array(this.cap * 3); this.c = new Uint8Array(this.cap * 4); this.a = new Uint8Array(this.cap * 4); this.n = new Uint8Array(this.cap * 4);
    this.icap = 6144; this.i = new Uint32Array(this.icap); this.nv = 0; this.ni = 0; }
  grow(nv, ni) {
    if (this.nv + nv > this.cap) { let c = this.cap; while (this.nv + nv > c) c *= 2;
      const p = new Float32Array(c * 3); p.set(this.p); this.p = p; const cc = new Uint8Array(c * 4); cc.set(this.c); this.c = cc; const a = new Uint8Array(c * 4); a.set(this.a); this.a = a; const nn = new Uint8Array(c * 4); nn.set(this.n); this.n = nn; this.cap = c; }
    if (this.ni + ni > this.icap) { let c = this.icap; while (this.ni + ni > c) c *= 2; const i = new Uint32Array(c); i.set(this.i); this.i = i; this.icap = c; }
  }
}
// marco de una fachada: origen (relativo al de la celda), tangente y normal exterior
// punto (u, y, d): u a lo largo de la fachada, y altura absoluta, d hacia fuera (+) o hacia dentro (−)
function quad(B, F, u0, y0, d0, u1, y1, d1, u2, y2, d2, u3, y3, d3, col, kind, aux) {
  if (!B) return;
  B.grow(4, 6);
  const v = B.nv, p = B.p, c = B.c, a = B.a;
  const U = [u0, u1, u2, u3], Y = [y0, y1, y2, y3], D = [d0, d1, d2, d3];
  // normal exacta del quad (el shader la orienta hacia la cámara)
  const ex = F.tx * (u1 - u0) + F.nx * (d1 - d0), ey = y1 - y0, ez = F.tz * (u1 - u0) + F.nz * (d1 - d0);
  const fx = F.tx * (u3 - u0) + F.nx * (d3 - d0), fy = y3 - y0, fz = F.tz * (u3 - u0) + F.nz * (d3 - d0);
  let nx = ey * fz - ez * fy, ny = ez * fx - ex * fz, nz = ex * fy - ey * fx; const nl = Math.hypot(nx, ny, nz) || 1;
  nx = Math.round(nx / nl * 127 + 128); ny = Math.round(ny / nl * 127 + 128); nz = Math.round(nz / nl * 127 + 128);
  const N = B.n;
  for (let k = 0; k < 4; k++) {
    const o = (v + k) * 3;
    p[o] = F.x + F.tx * U[k] + F.nx * D[k]; p[o + 1] = Y[k]; p[o + 2] = F.z + F.tz * U[k] + F.nz * D[k];
    const q = (v + k) * 4; N[q] = nx; N[q + 1] = ny; N[q + 2] = nz; c[q] = col[0]; c[q + 1] = col[1]; c[q + 2] = col[2]; c[q + 3] = kind;
    if (aux) { a[q] = aux[k * 4]; a[q + 1] = aux[k * 4 + 1]; a[q + 2] = aux[k * 4 + 2]; a[q + 3] = aux[k * 4 + 3]; }
    else { a[q] = 0; a[q + 1] = 0; a[q + 2] = 0; a[q + 3] = 0; }
  }
  const i = B.i, n = B.ni; i[n] = v; i[n + 1] = v + 1; i[n + 2] = v + 2; i[n + 3] = v; i[n + 4] = v + 2; i[n + 5] = v + 3;
  B.nv += 4; B.ni += 6;
}
// rectángulo en el plano de fachada (profundidad d)
const rect = (B, F, u0, u1, y0, y1, d, col, k) => {
  if (u1 - u0 < 1e-3 || y1 - y0 < 1e-3) return;
  if (d === 0 && (k === 0 || k === 1)) { u0 -= 0.012; u1 += 0.012; y0 -= 0.012; y1 += 0.012; }   // los paños de muro se solapan: sin grietas
  quad(B, F, u0, y0, d, u1, y0, d, u1, y1, d, u0, y1, d, col, k); };
// plano perpendicular a la fachada en u (jamba, derrame lateral)
const jamb = (B, F, u, y0, y1, d0, d1, col, k) => { if (y1 - y0 > 1e-3) quad(B, F, u, y0, d0, u, y0, d1, u, y1, d1, u, y1, d0, col, k); };
// plano horizontal a altura y (dintel, alféizar)
const hpl = (B, F, u0, u1, y, d0, d1, col, k) => { if (u1 - u0 > 1e-3) quad(B, F, u0, y, d0, u1, y, d0, u1, y, d1, u0, y, d1, col, k); };
// caja adosada: frente, techo, suelo y laterales (sin cara trasera, que queda contra el muro)
function box(B, F, u0, u1, y0, y1, d0, d1, col, k, mask) {
  if (!B || u1 - u0 < 1e-3 || y1 - y0 < 1e-3) return;
  k = k || 0; mask = mask === undefined ? 7 : mask;
  quad(B, F, u0, y0, d1, u1, y0, d1, u1, y1, d1, u0, y1, d1, col, k);
  if (mask & 1) hpl(B, F, u0, u1, y1, d0, d1, shade(col, 1.04), k);
  if (mask & 2) hpl(B, F, u0, u1, y0, d0, d1, shade(col, 0.8), k);
  if (mask & 4) { jamb(B, F, u0, y0, y1, d0, d1, shade(col, 0.9), k); jamb(B, F, u1, y0, y1, d0, d1, shade(col, 0.9), k); }
}
// paño calado (forja o balaustrada): v de 0 (abajo) a 255 (arriba) en el canal auxiliar
const latAux = vr => { const w = vr ? 255 : 0; return [0, w, 0, 0, 0, w, 0, 0, 255, w, 0, 0, 255, w, 0, 0]; };
const lattice = (B, F, u0, u1, y0, y1, d, col, k, variant) => { if (u1 - u0 > 1e-3) quad(B, F, u0, y0, d, u1, y0, d, u1, y1, d, u0, y1, d, col, k, latAux(variant)); };
const latticeSide = (B, F, u, y0, y1, d0, d1, col, k, variant) => { if (d1 - d0 > 1e-3) quad(B, F, u, y0, d0, u, y0, d1, u, y1, d1, u, y1, d0, col, k, latAux(variant)); };

const shade = (c, f) => [Math.min(255, c[0] * f) | 0, Math.min(255, c[1] * f) | 0, Math.min(255, c[2] * f) | 0];
const mixc = (a, b, t) => [(a[0] + (b[0] - a[0]) * t) | 0, (a[1] + (b[1] - a[1]) * t) | 0, (a[2] + (b[2] - a[2]) * t) | 0];

// azar reproducible por edificio (la capa base y la de ornamento deben salir idénticas)
let _s = 1;
const R = (a, b) => { _s |= 0; _s = _s + 0x6D2B79F5 | 0; let t = Math.imul(_s ^ _s >>> 15, 1 | _s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; const r = ((t ^ t >>> 14) >>> 0) / 4294967296;
  return a === undefined ? r : b === undefined ? r * a : a + r * (b - a); };
const signAux = id => [0, 0, id, 0, 255, 0, id, 0, 255, 255, id, 0, 0, 255, id, 0];
const pick = arr => arr[Math.floor(R() * arr.length)];

// paletas (de Transeúnte)
const SHUTTERS = [[43, 77, 51], [84, 87, 69], [36, 59, 77], [107, 77, 48], [60, 92, 64], [120, 118, 104]];
const WOODS = [[64, 38, 20], [38, 28, 20], [36, 51, 41], [79, 48, 26]];
const AWNINGS = [[166, 36, 33], [31, 77, 56], [219, 204, 168], [38, 56, 107]];
const SHOPS = ['FORN DE PA', 'FARMÀCIA', 'FERRETERIA', 'BAR TAPES', 'FRUITERIA', 'LLIBRERIA', 'FLORISTERIA', 'RESTAURANT', 'PERRUQUERIA', 'MODA', 'GELATERIA', 'CAFÈ', 'QUEVIURES', 'ÒPTICA', 'PAPERERIA', 'FORMATGERIA'];

window.BCN_FACADES = async function (ctx) {
  const { scene, engine, mkMat, COMMON, VS_COL, heightAt, BREC, bldChunks, RSEG, META, PAL, WX, WZ, blobURL, cam } = ctx;
  const VB = BABYLON.VertexBuffer;

  // ---------------------------------------------------------------- materiales
  const FS_DET = `#extension GL_OES_standard_derivatives : enable
` + COMMON + `
varying vec3 vPos; varying vec3 vLoc; varying vec4 vCol; varying vec4 vInfo; varying vec3 vN;
uniform vec2 uFade; uniform float uDusk;
uniform sampler2D tPlD; uniform sampler2D tPlN; uniform sampler2D tAsD; uniform sampler2D tAsN; uniform sampler2D tSign;
void main(){
  vec3 V = uCam - vPos; float dist = length(V); V /= dist;
  float dt = dith();
  if (dt < smoothstep(uFade.x, uFade.y, dist)) discard;
  vec3 n = normalize(vN);
  if (dot(n, V) < 0.0) n = -n;
  float kind = floor(vCol.a*255.0 + 0.5);
  vec3 alb = vCol.rgb;
  vec3 an = abs(n);
  vec3 T = an.y > 0.7 ? vec3(1.0,0.0,0.0) : normalize(vec3(-n.z, 0.0, n.x));
  vec3 Bv = an.y > 0.7 ? vec3(0.0,0.0,1.0) : vec3(0.0,1.0,0.0);
  vec2 P = vec2(dot(vLoc, T), dot(vLoc, Bv));   // coordenadas locales de celda: precisión para mipmaps y patrones
  float nearF = 1.0 - smoothstep(50.0, 170.0, dist);
  vec3 N = n; float spec = 0.04, shin = 12.0; vec3 emis = vec3(0.0);
  float v = vInfo.x;
  if (kind < 0.5) {                                   // estuco fotografiado, con suciedad y churretes
    vec3 tx = texture2D(tPlD, P*0.21).rgb; float lum = dot(tx, vec3(0.3,0.6,0.1));
    float grime = smoothstep(0.38, 0.85, vnoise(P*0.08)*0.65 + vnoise(P*0.55)*0.35);
    alb *= mix(0.74, 1.16, smoothstep(0.15, 0.75, lum)) * mix(1.0, 0.82, grime);
    if (an.y < 0.7) { float s = vnoise(vec2(P.x*1.3, P.y*0.07))*0.75 + vnoise(vec2(P.x*3.1, P.y*0.15))*0.25; alb *= mix(1.02, 0.86, smoothstep(0.5, 0.9, s)); }
    vec3 tn = texture2D(tPlN, P*0.21).xyz*2.0 - 1.0; N = normalize(n + (T*tn.x + Bv*tn.y)*0.75*nearF);
  } else if (kind < 1.5) {                            // sillar
    vec3 tx = texture2D(tAsD, P*vec2(0.30, 0.38)).rgb;
    alb *= tx*1.95*mix(0.88, 1.08, vnoise(P*0.6));
    alb *= mix(1.0, 0.8, smoothstep(0.45, 0.85, vnoise(vec2(P.x*0.9, P.y*0.04))));
    vec3 tn = texture2D(tAsN, P*vec2(0.30, 0.38)).xyz*2.0 - 1.0; N = normalize(n + (T*tn.x + Bv*tn.y)*1.1*nearF);
  } else if (kind < 2.5 || (kind > 10.5 && kind < 11.5)) {   // vidrio: reflejo del cielo, interior, cortinas
    vec2 cid = floor(P/vec2(1.35, 3.1)); float h = hash21(cid + 0.37), h2 = hash21(cid*1.7 + 4.1);
    vec3 r = reflect(-V, N);
    vec3 refl = skyColor(normalize(vec3(r.x, max(r.y, 0.02), r.z)));
    refl = mix(uFogCol*vec3(0.62,0.6,0.58), refl, smoothstep(-0.02, 0.22, r.y));   // la calle de enfrente refleja oscuro
    float fres = 0.06 + 0.94*pow(1.0 - max(dot(N, V), 0.0), 5.0);
    vec3 inside = mix(vec3(0.030,0.034,0.040), vec3(0.10,0.085,0.065), h);
    float yy = fract(P.y/3.1);
    inside = mix(inside, vec3(0.62,0.56,0.46), step(0.58, h2)*0.30*smoothstep(0.25, 0.9, yy));   // visillos
    if (kind > 10.5) inside = vec3(0.30,0.26,0.20)*(0.7 + 0.6*vnoise(P*2.3)) + vCol.rgb*0.25;   // escaparate iluminado
    vec3 c = mix(inside*(uSkyCol*1.4 + uSunCol*0.25), refl, clamp(fres*0.92 + 0.10, 0.0, 1.0));
    c += uSunCol*pow(max(dot(r, uSunDir), 0.0), 350.0)*2.5;
    if (kind < 2.5) c += vec3(1.0,0.74,0.42)*step(h, 0.05 + uDusk*0.30)*uDusk*0.55;
    else c += vec3(1.0,0.85,0.62)*uDusk*0.35;
    gl_FragColor = vec4(fog(c, vPos), 1.0); return;
  } else if (kind < 3.5) {                            // persiana enrollable de lamas
    float s = fract(vLoc.y*14.0), fw = fwidth(vLoc.y*14.0);
    alb *= mix(mix(0.55, 1.06, smoothstep(0.0, 0.5, s)), 0.86, smoothstep(0.3, 1.0, fw)) * mix(0.85, 1.05, vnoise(P*3.0));
  } else if (kind < 4.5) {                            // madera
    float g = vnoise(vec2(P.x*28.0, P.y*1.3))*0.6 + vnoise(vec2(P.x*90.0, P.y*4.0))*0.4;
    alb *= 0.78 + 0.38*g; spec = 0.12; shin = 30.0;
  } else if (kind < 5.5) {                            // metal
    spec = 0.5; shin = 40.0;
  } else if (kind < 6.5 || (kind > 9.5 && kind < 10.5)) {   // forja calada / balaustrada
    float u = P.x, fw;
    if (kind < 6.5) {
      float w = 0.12, x = u/w; fw = fwidth(x);
      float fx = fract(x), cx = floor(x);
      float bar = 1.0 - smoothstep(0.06, 0.06 + fw*1.2 + 0.015, abs(fx - 0.5));
      float hb = max(1.0 - smoothstep(0.035, 0.035 + fwidth(v)*1.2 + 0.01, abs(v - 0.06)), 1.0 - smoothstep(0.03, 0.03 + fwidth(v)*1.2 + 0.01, abs(v - 0.95)));
      vec2 q = vec2((fx - 0.5)*w*0.0 + (fract(x + 0.5) - 0.5)*w, (v - 0.5)*1.0);
      float ring = 1.0 - smoothstep(0.006, 0.006 + fw*0.02 + 0.004, abs(length(q) - 0.042));
      float motif = vInfo.y > 0.5 ? max(ring, 1.0 - smoothstep(0.006, 0.012, abs(length(vec2(q.x, (fract(v*3.0)-0.5)*0.33)) - 0.04))) : ring;
      float m = max(max(bar*step(0.06, v)*step(v, 0.95), hb), motif*step(0.2, v)*step(v, 0.8));
      float far = smoothstep(0.3, 0.7, fw);   // de lejos la reja pasa a ser una banda opaca de tono medio
      if (m < 0.5 && far < 0.999 && fract(dt*7.31 + 0.37) >= far) discard;
      alb = mix(vec3(0.075, 0.075, 0.085), alb*0.55, far*0.55*(1.0 - m)); spec = 0.35; shin = 30.0;
    } else {
      float w = 0.3, x = u/w; fw = fwidth(x);
      float dx = abs(fract(x) - 0.5)*w;
      float r = 0.035 + 0.05*smoothstep(0.1, 0.42, v)*(1.0 - smoothstep(0.5, 0.82, v)) + 0.035*(step(v, 0.08) + step(0.92, v));
      float far = smoothstep(0.35, 0.75, fw);
      if (dx > r && far < 0.999 && fract(dt*7.31 + 0.37) >= far) discard;
      vec3 tx = texture2D(tPlD, P*0.4).rgb; alb *= mix(0.8, 1.1, dot(tx, vec3(0.33)));
      N = normalize(n + T*clamp((fract(x) - 0.5)*w/max(r, 0.01), -1.0, 1.0)*0.9);
    }
  } else if (kind < 7.5) {                            // esgrafiado modernista
    vec2 f = fract(P/vec2(1.1, 0.55)) - 0.5;
    float rr = length(f*vec2(1.0, 1.6)), a = atan(f.y, f.x);
    float petal = smoothstep(0.02, 0.0, abs(rr - 0.2 - 0.07*cos(a*5.0)) - 0.03), dot_ = smoothstep(0.06, 0.04, rr);
    float stem = smoothstep(0.015, 0.0, abs(f.y + 0.02*sin(f.x*12.0)))*step(0.28, abs(f.x));
    float mk = max(max(petal, dot_), stem) * nearF;
    vec3 tx = texture2D(tPlD, P*0.21).rgb;
    alb = mix(alb*0.80, alb*1.35 + vec3(0.04), mk) * mix(0.82, 1.08, dot(tx, vec3(0.33)));
  } else if (kind < 8.5) {                            // rótulo de comercio
    float id = floor(vInfo.z*255.0 + 0.5);
    vec2 uv = vec2((mod(id, 4.0) + vInfo.x)/4.0, (floor(id/4.0) + vInfo.y)/4.0);
    alb = texture2D(tSign, uv).rgb; spec = 0.1;
    emis = alb*uDusk*0.3;
  } else if (kind < 9.5) {                            // toldo a rayas
    float s = step(0.5, fract(P.x*2.4));
    alb = mix(alb, vec3(0.88, 0.86, 0.80), s*0.85) * (0.85 + 0.2*vnoise(P*4.0));
  } else if (kind < 12.5) {                           // farol
    emis = vec3(1.0, 0.86, 0.6)*(0.35 + uDusk*1.6);
  } else if (kind < 13.5) {                           // liso
  } else {                                            // hojas
    alb *= 0.6 + 0.7*vnoise(P*9.0); N = normalize(n + vec3(vnoise(P*7.0) - 0.5, 0.0, vnoise(P*7.0 + 3.0) - 0.5)*1.4);
  }
  vec3 c = lit(alb, N);
  vec3 hlf = normalize(uSunDir + V);
  c += uSunCol*spec*pow(max(dot(N, hlf), 0.0), shin)*step(0.0, dot(N, uSunDir));
  c += emis;
  gl_FragColor = vec4(fog(c, vPos), 1.0);
}`;
  const VS_DET = `precision highp float;
attribute vec3 position; attribute vec4 color; attribute vec4 uv; attribute vec4 nrm; uniform mat4 world; uniform mat4 viewProjection;
varying vec3 vPos; varying vec3 vLoc; varying vec4 vCol; varying vec4 vInfo; varying vec3 vN;
void main(){ vec4 wp = world*vec4(position,1.0); vPos = wp.xyz; vLoc = position; vCol = color; vInfo = uv; vN = nrm.xyz*2.0 - 1.0; gl_Position = viewProjection*wp; }`;
  const matB = mkMat('fx0', VS_DET, FS_DET, ['position', 'color', 'uv', 'nrm'], ['uFade', 'uDusk'], ['tPlD', 'tPlN', 'tAsD', 'tAsN', 'tSign']);
  const matH = mkMat('fx1', VS_DET, FS_DET, ['position', 'color', 'uv', 'nrm'], ['uFade', 'uDusk'], ['tPlD', 'tPlN', 'tAsD', 'tAsN', 'tSign']);
  const tex = async (f) => { const t = new BABYLON.Texture(await blobURL('data/' + f), scene, false, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
    t.wrapU = t.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE; t.anisotropicFilteringLevel = 8; return t; };
  const [tPlD, tPlN, tAsD, tAsN] = await Promise.all(['fx_plaster_d.webp', 'fx_plaster_n.webp', 'fx_ashlar_d.webp', 'fx_ashlar_n.webp'].map(tex));
  // rótulos: 16 comercios en un atlas 4×4
  const sign = new BABYLON.DynamicTexture('signs', { width: 1024, height: 512 }, scene, true);
  {
    const g = sign.getContext(), cols = ['#143d33', '#7c1d22', '#1c2c52', '#2b2b2f', '#5c3b16', '#17594c', '#3d1c4c', '#6b5a1e'];
    SHOPS.forEach((s, r) => { const x = (r % 4) * 256, y = (3 - (r >> 2)) * 128;
      g.fillStyle = cols[r % cols.length]; g.fillRect(x, y, 256, 128); g.strokeStyle = '#d8c9a3'; g.lineWidth = 4; g.strokeRect(x + 8, y + 10, 240, 108);
      g.fillStyle = '#f6e8c9'; g.font = 'bold 36px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x + 128, y + 66, 228); });
    sign.update(true); sign.wrapU = sign.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE; sign.anisotropicFilteringLevel = 8;
  }
  for (const m of [matB, matH]) { m.setTexture('tPlD', tPlD); m.setTexture('tPlN', tPlN); m.setTexture('tAsD', tAsD); m.setTexture('tAsN', tAsN); m.setTexture('tSign', sign); m.setFloat('uDusk', 0); }

  // ---------------------------------------------------------------- índices espaciales
  const CS = 100, NX = Math.ceil(WX / CS), NZ = Math.ceil(WZ / CS), NC = NX * NZ;
  const cellOf = (x, z) => { const i = Math.min(NX - 1, Math.max(0, Math.floor(x / CS))), j = Math.min(NZ - 1, Math.max(0, Math.floor(z / CS))); return j * NX + i; };
  function csr(nItems, forEachCell) {
    const cnt = new Int32Array(NC + 1);
    for (let b = 0; b < nItems; b++) forEachCell(b, c => cnt[c + 1]++);
    for (let c = 0; c < NC; c++) cnt[c + 1] += cnt[c];
    const list = new Int32Array(cnt[NC]), fill = cnt.slice(0, NC);
    for (let b = 0; b < nItems; b++) forEachCell(b, c => { list[fill[c]++] = b; });
    return { start: cnt, list };
  }
  const BB = BREC.bb, NB = BREC.n;
  const rangeCells = (x0, z0, x1, z1, f) => {
    const i0 = Math.max(0, Math.floor(x0 / CS)), i1 = Math.min(NX - 1, Math.floor(x1 / CS)), j0 = Math.max(0, Math.floor(z0 / CS)), j1 = Math.min(NZ - 1, Math.floor(z1 / CS));
    if ((i1 - i0 + 1) * (j1 - j0 + 1) > 400) return;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) f(j * NX + i);
  };
  // monumentos y piezas singulares: su entorno no se toca
  const SKIP = { 'Sagrada Família': 110, 'Camp Nou': 230, 'Palau Nacional (MNAC)': 170, 'Catedral': 70, 'Hospital de Sant Pau': 260, 'Estadi Olímpic': 170,
    'Castell de Montjuïc': 140, 'Aeroport · Terminal 1': 700, 'Aeroport · Terminal 2': 500, 'Estació de Sants': 160, 'Torre Glòries': 60, 'Hotel W': 60,
    'Tres Xemeneies del Besòs': 120, 'Fòrum': 260, 'Park Güell': 140, 'Arc de Triomf': 30, 'Tibidabo': 120 };
  const skipPts = META.poi.filter(q => SKIP[q.n]).map(q => [q.p[0], q.p[2], SKIP[q.n]]);
  for (let b = 0; b < NB; b++) if (BREC.elig[b]) {
    const cx = (BB[b * 4] + BB[b * 4 + 2]) / 2, cz = (BB[b * 4 + 1] + BB[b * 4 + 3]) / 2;
    for (const s of skipPts) if (Math.hypot(cx - s[0], cz - s[1]) < s[2]) { BREC.elig[b] = 0; break; }
  }
  const ALL = csr(NB, (b, f) => rangeCells(BB[b * 4], BB[b * 4 + 1], BB[b * 4 + 2], BB[b * 4 + 3], f));
  const ELIG = csr(NB, (b, f) => { if (BREC.elig[b]) f(cellOf((BB[b * 4] + BB[b * 4 + 2]) / 2, (BB[b * 4 + 1] + BB[b * 4 + 3]) / 2)); });
  const NS = RSEG.length / 5;
  const SEG = new Float32Array(RSEG);
  const ROADS = csr(NS, (s, f) => { const o = s * 5, h = SEG[o + 4] + 1; rangeCells(Math.min(SEG[o], SEG[o + 2]) - h, Math.min(SEG[o + 1], SEG[o + 3]) - h, Math.max(SEG[o], SEG[o + 2]) + h, Math.max(SEG[o + 1], SEG[o + 3]) + h, f); });
  RSEG.length = 0;
  let nElig = 0; for (let b = 0; b < NB; b++) nElig += BREC.elig[b];

  // ---------------------------------------------------------------- consultas
  const cache = new Map();
  function bget(b) {
    let r = cache.get(b); if (r) return r;
    if (cache.size > 6000) cache.clear();
    const dv = BREC.dv[BREC.cont[b]]; let p = BREC.off[b];
    const nR = dv.getUint8(p), cls = dv.getUint8(p + 1), seed = dv.getUint8(p + 2), n = dv.getUint16(p + 4, true);
    const yb = dv.getInt16(p + 6, true) / 10, y0 = dv.getInt16(p + 8, true) / 10, y1 = dv.getInt16(p + 10, true) / 10; p += 12;
    const rsz = []; if (nR > 1) { for (let k = 0; k < nR; k++, p += 2) rsz.push(dv.getUint16(p, true)); } else rsz.push(n);
    const ch = bldChunks[BREC.chunk[b]], rings = [];
    for (const m of rsz) { const a = new Float64Array(m * 2); for (let j = 0; j < m; j++, p += 4) { a[j * 2] = dv.getInt16(p, true) / 10 + ch.ox; a[j * 2 + 1] = dv.getInt16(p + 2, true) / 10 + ch.oz; } rings.push(a); }
    const pal = PAL[cls] || PAL[0];
    r = { cls, seed, yb, y0, y1, rings, col: pal[seed % pal.length] };
    cache.set(b, r); return r;
  }
  function inside(d, x, z) {
    let ins = false;
    for (const r of d.rings) { const m = r.length / 2; for (let i = 0, j = m - 1; i < m; j = i++) { const xi = r[i * 2], zi = r[i * 2 + 1], xj = r[j * 2], zj = r[j * 2 + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins; } }
    return ins;
  }
  // altura del edificio vecino que ocupa (x,z), o −∞ si no hay ninguno
  function coverAt(x, z, self) {
    const c = cellOf(x, z); let top = -1e9;
    for (let k = ALL.start[c]; k < ALL.start[c + 1]; k++) {
      const b = ALL.list[k]; if (b === self) continue;
      if (x < BB[b * 4] || x > BB[b * 4 + 2] || z < BB[b * 4 + 1] || z > BB[b * 4 + 3]) continue;
      const d = bget(b); if (d.y1 > top && inside(d, x, z)) top = d.y1;
    }
    return top;
  }
  function roadDist(x, z) {
    const c = cellOf(x, z); let best = 1e9;
    for (let k = ROADS.start[c]; k < ROADS.start[c + 1]; k++) {
      const o = ROADS.list[k] * 5, ax = SEG[o], az = SEG[o + 1], bx = SEG[o + 2], bz = SEG[o + 3];
      const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz; let t = l2 > 0 ? ((x - ax) * dx + (z - az) * dz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const e = Math.hypot(x - ax - dx * t, z - az - dz * t) - SEG[o + 4]; if (e < best) best = e;
    }
    return best;
  }
  // tramos rectos de fachada: une vértices casi alineados (las plantas de OSM vienen muy troceadas)
  function runsOf(r) {
    const pts = []; const m0 = r.length / 2;
    for (let j = 0; j < m0; j++) { const x = r[j * 2], z = r[j * 2 + 1]; if (!pts.length || Math.hypot(x - pts[pts.length - 1][0], z - pts[pts.length - 1][1]) > 0.25) pts.push([x, z]); }
    if (pts.length > 1 && Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 0.25) pts.pop();
    const m = pts.length; if (m < 3) return [];
    let s = 0, best = -1;
    for (let j = 0; j < m; j++) { const a = pts[(j + m - 1) % m], b = pts[j], c = pts[(j + 1) % m];
      const t1 = Math.atan2(b[1] - a[1], b[0] - a[0]), t2 = Math.atan2(c[1] - b[1], c[0] - b[0]); let d = Math.abs(t2 - t1); if (d > Math.PI) d = 2 * Math.PI - d; if (d > best) { best = d; s = j; } }
    const out = []; let i = s, used = 0;
    while (used < m) {
      let j = i + 1;
      while (used + (j - i) < m) {
        const e = j + 1, A = pts[i % m], E = pts[e % m], dx = E[0] - A[0], dz = E[1] - A[1], L = Math.hypot(dx, dz) || 1; let ok = true;
        for (let q = i + 1; q < e; q++) { const Q = pts[q % m]; if (Math.abs(((Q[0] - A[0]) * dz - (Q[1] - A[1]) * dx) / L) > 0.45) { ok = false; break; } }
        if (!ok) break; j = e;
      }
      out.push([pts[i % m], pts[j % m]]); used += j - i; i = j;
    }
    return out;
  }

  // ---------------------------------------------------------------- disposición de un edificio (se calcula una vez)
  function layoutB(b) {
    const d = bget(b);
    let gHi = -1e9, gLo = 1e9;
    for (const r of d.rings) for (let j = 0; j < r.length; j += 2) { const g = heightAt(r[j], r[j + 1]); if (g > gHi) gHi = g; if (g < gLo) gLo = g; }
    const H = d.y1 - gHi;
    if (H < 3.6) return null;
    const runs = [];
    for (const r of d.rings) for (const [A, Bp] of runsOf(r)) {
      const dx = Bp[0] - A[0], dz = Bp[1] - A[1], L = Math.hypot(dx, dz); if (L < 0.4) continue;
      const tx = dx / L, tz = dz / L; let nx = tz, nz = -tx;
      const mx = (A[0] + Bp[0]) / 2, mz = (A[1] + Bp[1]) / 2;
      if (inside(d, mx + nx * 0.3, mz + nz * 0.3)) { nx = -nx; nz = -nz; }
      // ¿pegado a otro edificio? (medianera) — mira en tres puntos justo por fuera
      let nIn = 0, cov = 1e9;
      for (const f of [0.2, 0.5, 0.8]) { const t = coverAt(A[0] + dx * f + nx * 0.9, A[1] + dz * f + nz * 0.9, b); if (t > -1e8) { nIn++; if (t < cov) cov = t; } }
      const cover = nIn >= 2 ? cov : -1e9;
      let kind;
      if (cover >= d.y1 - 2.5) kind = 'blind';
      else if (L < 2.2) kind = 'plain';
      else kind = roadDist(mx + nx * 2, mz + nz * 2) < 16 ? 'street' : 'yard';
      runs.push({ ax: A[0], az: A[1], tx, tz, nx, nz, L, kind, cover });
    }
    let portal = null, pl = 0; for (const r of runs) if (r.kind === 'street' && r.L > pl && r.cover < gHi) { pl = r.L; portal = r; }
    return { d, gHi, gLo, H, runs, portal };
  }

  // ---------------------------------------------------------------- generador de fachada (capa base W0, ornamento W1)
  function genB(lay, b, W0, W1, ox, oz) {
    const { d, gHi, H, runs } = lay;
    _s = (b * 2654435761) ^ 0x5bd1e995;
    const cls6 = d.cls === 6;
    const style = cls6 ? 'sobrio' : H > 30 ? (R() < 0.7 ? 'sobrio' : 'clasico') : pick(['clasico', 'clasico', 'modernista', 'sobrio']);
    const p = d.col, u = mixc(p, [232, 222, 204], 0.55), stone = shade(mixc(p, [150, 138, 120], 0.6), 0.92);
    const shut = pick(SHUTTERS), persi = shade(shut, 1.5), wood = pick(WOODS), iron = [20, 20, 23];
    const porticones = R() < 0.55, tribunaOK = style !== 'sobrio' && R() < 0.5, balusters = style !== 'sobrio' && R() < 0.75;
    const shops = !cls6 && H >= 10;
    const G = shops ? 4.3 : 3.25;
    let F1 = gHi + G, C = d.y1 - 0.85;
    let Rm = C - F1, nF = Rm >= 2.5 ? Math.max(1, Math.round(Rm / 3.15)) : 0;
    if (!nF) F1 = C;
    const m = nF ? Rm / nF : 0;
    const shopsHere = shops && F1 - gHi > 3.6;
    const glass = [33, 43, 54], rv = shade(p, 0.58);

    for (const r of runs) {
      const F = { x: r.ax - ox, z: r.az - oz, tx: r.tx, tz: r.tz, nx: r.nx, nz: r.nz };
      const L = r.L, y0 = d.y0;
      const cover = r.cover;
      if (r.kind === 'blind') {
        rect(W0, F, 0, L, Math.max(y0, cover - 0.5), d.y1 + 0.35, 0, shade(p, 0.86), K.STUCCO);
        box(W0, F, 0, L, d.y1 + 0.35, d.y1 + 0.45, -0.03, 0.08, u, K.STUCCO);
        continue;
      }
      if (r.kind === 'plain') {
        rect(W0, F, 0, L, y0, C, 0, p, K.STUCCO);
        rect(W0, F, 0, L, C, d.y1 + 0.9, 0, p, K.STUCCO);
        box(W0, F, 0, L, F1 - 0.22, F1 + 0.1, 0, 0.3, u, K.STUCCO);
        box(W0, F, 0, L, C, C + 0.4, 0, 0.5, u, K.STUCCO);
        box(W0, F, 0, L, d.y1 + 0.9, d.y1 + 1.0, -0.03, 0.2, u, K.STUCCO);
        continue;
      }
      const street = r.kind === 'street';
      const bwT = street ? 3.7 : 3.2, nb = Math.max(1, Math.round(L / bwT)), bw = L / nb;
      const N = r === lay.portal && L >= 9 ? nb >> 1 : -1;
      const M = street && tribunaOK && nb >= 3 && nF >= 3 && R() < 0.6 ? nb >> 1 : -9;
      const gnd = c => heightAt(r.ax + r.tx * c + r.nx * 1.0, r.az + r.tz * c + r.nz * 1.0);
      const wallC = street ? p : shade(p, 0.95);

      // --- planta baja
      for (let W = 0; W < nb; W++) {
        const a = W * bw, c = a + bw / 2;
        const rr = [R(), R(), R(), R(), R(), R()];
        let gl = Math.min(gnd(c), F1 - 2.7);
        if (F1 <= cover + 0.3) continue;                        // tapado por el vecino
        const yB = Math.max(y0, cover - 0.3);
        if (street && W === N) { portalBay(W0, W1, F, a, bw, c, gl, yB, F1, stone, wood, glass, rr); continue; }
        if (street && shopsHere) { shopBay(W0, W1, F, a, bw, c, gl, yB, F1, stone, rr); continue; }
        // ventana de planta baja (con reja si da a la calle)
        const ww = Math.min(street ? 1.25 : 1.05, bw - 0.9), tt = c - ww / 2, ct = c + ww / 2;
        const st = gl + 1.0, yt = Math.min(F1 - 0.45, st + (street ? 1.9 : 1.45));
        const gc = street && shops ? stone : wallC, gk = street && shops ? K.STONE : K.STUCCO;
        if (yt - st < 0.6) { rect(W0, F, a, a + bw, yB, F1, 0, gc, gk); continue; }
        windowHole(W0, F, a, a + bw, tt, ct, yB, F1, st, yt, street ? 0.3 : 0.2, gc, gk, rr[0] < 0.6 ? 0.2 + rr[1] * 0.5 : 0);
        if (street) { lattice(W0, F, tt, ct, st, yt, 0.05, iron, K.IRON, 1); box(W1, F, tt - 0.05, ct + 0.05, st - 0.08, st, 0, 0.12, shade(gc, 1.05), gk); }
        else box(W1, F, tt - 0.06, ct + 0.06, st - 0.07, st, 0, 0.09, u, K.STUCCO);
      }
      // faja sobre la planta baja
      if (F1 > cover) box(W0, F, 0, L, F1 - 0.22, F1 + 0.1, 0, street ? 0.3 : 0.12, u, K.STUCCO);

      // --- plantas de pisos
      for (let D = 1; D <= nF; D++) {
        const k = F1 + (D - 1) * m, P = k + m, U = D === nF;
        if (P <= cover + 0.2) { for (let W = 0; W < nb; W++) { R(); R(); R(); R(); R(); R(); R(); } continue; }
        if (D > 1) box(W0, F, 0, L, k - 0.14, k + 0.05, 0, street ? 0.16 : 0.08, u, K.STUCCO);
        for (let W = 0; W < nb; W++) {
          const a = W * bw, c = a + bw / 2;
          const rr = [R(), R(), R(), R(), R(), R(), R()];
          if (k < cover) { rect(W0, F, a, a + bw, Math.max(y0, cover - 0.3), P, 0, wallC, K.STUCCO); continue; }
          if (!street) { yardWin(W0, W1, F, a, bw, c, k, P, wallC, u, rr); continue; }
          if (W === M && D <= 3 && !U) { tribuna(W0, W1, F, a, bw, k, P, p, u, wood, glass); continue; }
          const Vw = Math.min(1.3, bw - 0.95), Bh = U ? Math.min(1.7, m - 1.15) : Math.min(2.45, m - 0.72), Q = U ? Math.min(0.85, m - Bh - 0.32) : 0.08;
          const tt = c - Vw / 2, ct = c + Vw / 2, st = k + Q, yt = st + Bh;
          const se = rr[0] < 0.75 ? 0.15 + rr[1] * 0.6 : 0;
          windowHole(W0, F, a, a + bw, tt, ct, k, P, st, yt, 0.32, p, K.STUCCO, se);
          // carpintería
          const qt = yt - se * Bh;
          if (W1) {
            box(W1, F, c - 0.035, c + 0.035, st, qt, -0.32, -0.26, wood, K.WOOD, 4);
            const z = st + (qt - st) * 0.58; if (z < qt - 0.1) box(W1, F, tt, ct, z - 0.025, z + 0.025, -0.32, -0.27, wood, K.WOOD, 3);
            box(W1, F, tt, tt + 0.06, st, qt, -0.32, -0.25, wood, K.WOOD, 4); box(W1, F, ct - 0.06, ct, st, qt, -0.32, -0.25, wood, K.WOOD, 4);
            box(W1, F, tt, ct, Math.min(qt, yt) - 0.06, Math.min(qt, yt), -0.32, -0.25, wood, K.WOOD, 2);
          }
          if (porticones) { rect(W0, F, tt - 0.62, tt - 0.04, st + 0.02, yt, 0.05, shut, K.SHUT); rect(W0, F, ct + 0.04, ct + 0.62, st + 0.02, yt, 0.05, shut, K.SHUT);
            box(W1, F, tt - 0.62, tt - 0.04, st + 0.02, yt, 0.0, 0.05, shut, K.WOOD); box(W1, F, ct + 0.04, ct + 0.62, st + 0.02, yt, 0.0, 0.05, shut, K.WOOD); }
          // recercado, guardapolvo y clave
          box(W1, F, tt - 0.15, tt, st - 0.02, yt, 0, 0.09, shade(u, 0.96), K.STUCCO); box(W1, F, ct, ct + 0.15, st - 0.02, yt, 0, 0.09, shade(u, 0.96), K.STUCCO);
          box(W1, F, c - 0.13, c + 0.13, yt - 0.05, yt + 0.4, 0, 0.2, shade(u, 1.05), K.STUCCO);
          box(W0, F, tt - 0.12, ct + 0.12, yt, yt + 0.18, 0, 0.17, u, K.STUCCO);
          if (style === 'modernista' && !U) { box(W1, F, c - 0.55, c + 0.55, yt + 0.18, yt + 0.34, 0, 0.13, u, K.STUCCO); box(W1, F, c - 0.22, c + 0.22, yt + 0.34, yt + 0.5, 0, 0.1, u, K.STUCCO); }
          else if (style === 'clasico' && !U) box(W1, F, tt - 0.2, ct + 0.2, yt + 0.18, yt + 0.26, 0, 0.24, shade(u, 1.05), K.STUCCO);
          if (!U && style !== 'sobrio') { box(W1, F, a - 0.12, a + 0.12, k + 0.12, P - 0.22, 0, 0.1, shade(u, 0.94), K.STUCCO); box(W1, F, a - 0.19, a + 0.19, P - 0.22, P - 0.1, 0, 0.17, shade(u, 1.02), K.STUCCO); }
          if (style === 'modernista' || (style === 'clasico' && D % 2 === 0)) rect(W1, F, a + 0.13, a + bw - 0.13, P - 0.52, P - 0.14, 0.012, p, K.SGRAF);
          // balcón
          if (!U) {
            const full = D === 1 && rr[2] < 0.6, te = full ? bw / 2 - 0.04 : Math.min(1.05, bw / 2 - 0.05), jt = D === 1 ? 1.35 : 1.05, e0 = c - te, e1 = c + te;
            const slab = mixc(u, stone, 0.35);
            box(W0, F, e0, e1, k - 0.06, k + 0.12, 0, jt, slab, K.STONE);
            lattice(W0, F, e0, e1, k + 0.12, k + 1.14, jt - 0.03, iron, K.IRON, rr[6] < 0.5 ? 1 : 0);
            latticeSide(W0, F, e0 + 0.02, k + 0.12, k + 1.14, 0, jt - 0.03, iron, K.IRON, 0); latticeSide(W0, F, e1 - 0.02, k + 0.12, k + 1.14, 0, jt - 0.03, iron, K.IRON, 0);
            if (W1) {
              box(W1, F, e0 - 0.03, e1 + 0.03, k - 0.13, k - 0.05, 0, jt + 0.06, shade(slab, 0.92), K.STONE);
              box(W1, F, e0, e1, k + 1.14, k + 1.19, jt - 0.06, jt, iron, K.METAL);
              box(W1, F, e0, e0 + 0.05, k + 1.14, k + 1.19, 0, jt, iron, K.METAL); box(W1, F, e1 - 0.05, e1, k + 1.14, k + 1.19, 0, jt, iron, K.METAL);
              box(W1, F, e0, e0 + 0.05, k + 0.12, k + 1.14, jt - 0.06, jt, iron, K.METAL); box(W1, F, e1 - 0.05, e1, k + 0.12, k + 1.14, jt - 0.06, jt, iron, K.METAL);
              for (const pe of [e0 + 0.22, e1 - 0.32]) box(W1, F, pe, pe + 0.1, k - 0.36, k - 0.06, 0, jt * 0.78, shade(slab, 0.88), K.STONE);
              if (rr[3] < 0.32) { const pe = e0 + 0.25 + rr[4] * Math.max(0, e1 - e0 - 0.8);
                box(W1, F, pe, pe + 0.28, k + 0.12, k + 0.38, jt - 0.42, jt - 0.12, [158, 82, 56], K.PLAIN);
                box(W1, F, pe - 0.08, pe + 0.36, k + 0.38, k + 0.62 + rr[5] * 0.3, jt - 0.5, jt - 0.04, [52 + rr[5] * 30 | 0, 100 + rr[5] * 40 | 0, 46], K.LEAF); }
            }
          }
        }
      }
      // --- coronación
      if (C > cover) {
        if (street) {
          if (style === 'sobrio') { box(W0, F, 0, L, C + 0.2, C + 0.45, 0, 0.45, u, K.STUCCO); }
          else {
            box(W0, F, 0, L, C, C + 0.16, 0, 0.22, u, K.STUCCO); box(W0, F, 0, L, C + 0.16, C + 0.32, 0, 0.42, u, K.STUCCO); box(W0, F, 0, L, C + 0.32, C + 0.48, 0, 0.66, shade(u, 1.05), K.STUCCO);
            if (W1) { const nd = Math.round(L / 0.36); for (let q = 0; q < nd; q += 2) { const uu = q * L / nd; box(W1, F, uu, uu + L / nd * 0.8, C + 0.04, C + 0.15, 0.2, 0.34, shade(u, 0.94), K.STUCCO); }
              for (let W = 0; W <= nb; W++) { const a = Math.min(L - 0.1, Math.max(0.1, W * bw)); box(W1, F, a - 0.09, a + 0.09, C - 0.35, C + 0.32, 0, 0.5, shade(u, 1.02), K.STUCCO); } }
          }
          rect(W0, F, 0, L, C, d.y1, 0, p, K.STUCCO);
          if (balusters) {
            box(W0, F, 0, L, d.y1, d.y1 + 0.2, -0.02, 0.2, u, K.STUCCO);
            lattice(W0, F, 0, L, d.y1 + 0.2, d.y1 + 0.76, 0.09, u, K.BAL, 0);
            for (let W = 0; W <= nb; W++) { const a = Math.min(L - 0.15, Math.max(0.15, W * bw)); box(W0, F, a - 0.16, a + 0.16, d.y1 + 0.2, d.y1 + 0.76, -0.02, 0.22, u, K.STUCCO); }
          } else rect(W0, F, 0, L, d.y1, d.y1 + 0.76, 0, p, K.STUCCO);
          box(W0, F, 0, L, d.y1 + 0.76, d.y1 + 0.9, -0.05, 0.26, shade(u, 1.04), K.STUCCO);
        } else {
          rect(W0, F, 0, L, C, d.y1 + 0.3, 0, wallC, K.STUCCO);
          box(W0, F, 0, L, d.y1 + 0.3, d.y1 + 0.4, -0.03, 0.12, u, K.STUCCO);
        }
      }
    }
    return true;

    // ----- piezas
    // hueco con derrame: paños de muro alrededor, jambas, dintel, alféizar, vidrio y persiana
    function windowHole(W0, F, a0, a1, tt, ct, k, P, st, yt, dep, col, kind, se) {
      rect(W0, F, a0, tt, k, P, 0, col, kind); rect(W0, F, ct, a1, k, P, 0, col, kind);
      rect(W0, F, tt, ct, yt, P, 0, col, kind); if (st > k) rect(W0, F, tt, ct, k, st, 0, col, kind);
      const rc = shade(col, 0.62);
      jamb(W0, F, tt, st, yt, -dep, 0, rc, kind); jamb(W0, F, ct, st, yt, -dep, 0, rc, kind);
      hpl(W0, F, tt, ct, yt, -dep, 0, shade(col, 0.45), kind); hpl(W0, F, tt, ct, st, -dep, 0, shade(col, 0.8), kind);
      const qt = yt - se * (yt - st);
      rect(W0, F, tt, ct, st, qt, -dep, glass, K.GLASS);
      if (se > 0) rect(W0, F, tt, ct, qt, yt, -dep + 0.04, persi, K.SHUT);
    }
    function yardWin(W0, W1, F, a, bw, c, k, P, col, u, rr) {
      const ww = Math.min(1.05, bw - 0.8), tt = c - ww / 2, ct = c + ww / 2, st = k + 0.95, yt = Math.min(P - 0.35, st + 1.4);
      if (yt - st < 0.5) { rect(W0, F, a, a + bw, k, P, 0, col, K.STUCCO); return; }
      windowHole(W0, F, a, a + bw, tt, ct, k, P, st, yt, 0.2, col, K.STUCCO, rr[0] < 0.65 ? 0.2 + rr[1] * 0.7 : 0);
      box(W1, F, tt - 0.06, ct + 0.06, st - 0.07, st, 0, 0.09, u, K.STUCCO);
      if (W1 && rr[2] < 0.25) lattice(W1, F, tt - 0.1, ct + 0.1, st, st + 0.9, 0.12, iron, K.IRON, 0);
    }
    function tribuna(W0, W1, F, a, bw, k, P, p, u, wood, glass) {
      const zt = a + 0.25, te = a + bw - 0.25;
      rect(W0, F, a, zt, k, P, 0, p, K.STUCCO); rect(W0, F, te, a + bw, k, P, 0, p, K.STUCCO);
      box(W0, F, zt, te, k, k + 0.75, 0, 0.95, u, K.STUCCO); box(W0, F, zt, te, P - 0.3, P, 0, 1.05, u, K.STUCCO);
      rect(W0, F, zt, te, k + 0.75, P - 0.3, 0.85, glass, K.GLASS);
      jamb(W0, F, zt + 0.02, k + 0.75, P - 0.3, 0, 0.85, glass, K.GLASS); jamb(W0, F, te - 0.02, k + 0.75, P - 0.3, 0, 0.85, glass, K.GLASS);
      if (W1) {
        for (let h = 0; h <= 4; h++) { const pe = zt + (te - zt) * h / 4; box(W1, F, pe - 0.04, pe + 0.04, k + 0.75, P - 0.3, 0.82, 0.96, wood, K.WOOD); }
        const hm = (k + 0.75 + P - 0.3) / 2; box(W1, F, zt, te, hm + 0.25, hm + 0.3, 0.82, 0.95, wood, K.WOOD);
        for (const pe of [zt, te - 0.03]) box(W1, F, pe, pe + 0.03, k + 0.75, P - 0.3, 0, 0.85, wood, K.WOOD);
        box(W1, F, zt - 0.05, te + 0.05, k - 0.1, k, 0, 1.0, shade(u, 0.9), K.STUCCO);
      }
    }
    function shopBay(W0, W1, F, a, bw, c, gl, yB, F1, stone, rr) {
      const Uw = bw * 0.84, B_ = a + (bw - Uw) / 2, V_ = B_ + Uw;
      const top = Math.min(F1 - 0.6, gl + 3.7), sill = gl + 0.5;
      const sc = stone, dk = shade(sc, 0.55);
      rect(W0, F, a, B_, yB, F1, 0, sc, K.STONE); rect(W0, F, V_, a + bw, yB, F1, 0, sc, K.STONE);
      rect(W0, F, B_, V_, top, F1, 0, sc, K.STONE); rect(W0, F, B_, V_, yB, sill, 0, shade(sc, 0.85), K.STONE);
      jamb(W0, F, B_, sill, top, -0.4, 0, dk, K.STONE); jamb(W0, F, V_, sill, top, -0.4, 0, dk, K.STONE);
      hpl(W0, F, B_, V_, top, -0.4, 0, shade(sc, 0.5), K.STONE); hpl(W0, F, B_, V_, sill, -0.4, 0, shade(sc, 0.72), K.STONE);
      const tint = [[170, 150, 120], [120, 140, 150], [160, 120, 100], [140, 150, 120]][rr[0] * 4 | 0];
      rect(W0, F, B_, V_, sill, top, -0.36, tint, K.GSHOP);
      const met = [24, 24, 27];
      box(W0, F, B_ + Uw * 0.5 - 0.035, B_ + Uw * 0.5 + 0.035, sill, top, -0.38, -0.3, met, K.METAL);
      box(W0, F, B_ + 0.05, V_ - 0.05, sill, sill + 0.1, -0.4, -0.3, met, K.METAL);
      const sv0 = top + 0.08, sv1 = Math.min(F1 - 0.3, top + 0.58);
      if (rr[1] < 0.75 && sv1 - sv0 > 0.25) quad(W0, F, B_ + 0.15, sv0, 0.06, V_ - 0.15, sv0, 0.06, V_ - 0.15, sv1, 0.06, B_ + 0.15, sv1, 0.06, [255, 255, 255], K.SIGN, signAux((rr[2] * SHOPS.length) | 0));
      if (rr[3] < 0.4) { const ac = AWNINGS[rr[4] * 4 | 0];
        quad(W0, F, B_, top - 0.02, 0.05, V_, top - 0.02, 0.05, V_, top - 0.75, 1.45, B_, top - 0.75, 1.45, ac, K.AWN);
        quad(W1, F, B_, top - 0.75, 1.45, V_, top - 0.75, 1.45, V_, top - 0.95, 1.45, B_, top - 0.95, 1.45, ac, K.AWN); }
      if (W1) {
        box(W1, F, B_, B_ + 0.16, sill, top, -0.4, 0, shade(sc, 0.62), K.STONE); box(W1, F, V_ - 0.16, V_, sill, top, -0.4, 0, shade(sc, 0.62), K.STONE);
        box(W1, F, B_, V_, top - 0.16, top, -0.4, 0, shade(sc, 0.62), K.STONE);
        const fr = shade(sc, 0.35);
        box(W1, F, B_ - 0.08, B_ + 0.03, sill, top + 0.06, -0.05, -0.004, fr, K.STONE); box(W1, F, V_ - 0.03, V_ + 0.08, sill, top + 0.06, -0.05, -0.004, fr, K.STONE);
        box(W1, F, B_ - 0.08, V_ + 0.08, top - 0.02, top + 0.06, -0.05, -0.004, fr, K.STONE);
        for (const y of [sill + 1.0, top - 0.7]) box(W1, F, B_ + 0.16, V_ - 0.16, y - 0.02, y + 0.02, -0.37, -0.33, met, K.METAL);
      }
    }
    function portalBay(W0, W1, F, a, bw, c, gl, yB, F1, stone, wood, glass, rr) {
      const dw = Math.min(1.2, bw / 2 - 0.35), dtop = Math.min(F1 - 0.55, gl + 3.5), x0 = c - dw, x1 = c + dw, sc = stone;
      rect(W0, F, a, x0, yB, F1, 0, sc, K.STONE); rect(W0, F, x1, a + bw, yB, F1, 0, sc, K.STONE); rect(W0, F, x0, x1, dtop, F1, 0, sc, K.STONE);
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
  }

  // ---------------------------------------------------------------- celdas: construir, mostrar, liberar
  const cells = new Map();   // índice → { base, hi, lay: Map, blds }
  const S = { on: true, R0: 170, R1: 215, RB: 245, RD: 310, H0: 70, H1: 95, HB: 110, HD: 140, budget: 6, cap: [2.4e6, 1.3e6], rCap: [1e9, 1e9] };
  let job = null, queue = [], tris = [0, 0];
  const dirty = new Set();
  function setFlag(b, f) { const ch = bldChunks[BREC.chunk[b]], inf = ch.inf; for (let v = BREC.v0[b]; v < BREC.v1[b]; v++) inf[v * 4 + 3] = f; dirty.add(ch); }
  function mkMeshFrom(W, mat, name) {
    if (!W.nv) return null;
    const m = new BABYLON.Mesh(name, scene);
    m.setVerticesData('position', W.p.slice(0, W.nv * 3), false);
    m.setVerticesBuffer(new VB(engine, W.c.slice(0, W.nv * 4), 'color', false, false, 4, false, 0, 4, VB.UNSIGNED_BYTE, true));
    m.setVerticesBuffer(new VB(engine, W.a.slice(0, W.nv * 4), 'uv', false, false, 4, false, 0, 4, VB.UNSIGNED_BYTE, true));
    m.setVerticesBuffer(new VB(engine, W.n.slice(0, W.nv * 4), 'nrm', false, false, 4, false, 0, 4, VB.UNSIGNED_BYTE, true));
    m.setIndices(W.i.slice(0, W.ni), W.nv);
    m.material = mat; m.isPickable = false; m.renderingGroupId = 1;
    m.position.set(W.ox, 0, W.oz); m.freezeWorldMatrix(); m.doNotSyncBoundingInfo = true;
    return m;
  }
  function* cellJob(ci, hi) {
    const cell = cells.get(ci), cx = ci % NX, cz = (ci / NX) | 0, ox = cx * CS, oz = cz * CS;
    const W = new GB(ox, oz), done = [];
    for (let k = ELIG.start[ci]; k < ELIG.start[ci + 1]; k++) {
      const b = ELIG.list[k];
      let lay = cell.lay.get(b);
      if (lay === undefined) { lay = layoutB(b); cell.lay.set(b, lay); }
      if (lay && genB(lay, b, hi ? null : W, hi ? W : null, ox, oz)) done.push(b);
      yield;
    }
    if (cells.get(ci) !== cell || (hi && !cell.base)) return;   // la celda se descartó mientras se construía
    const mesh = mkMeshFrom(W, hi ? matH : matB, (hi ? 'fh' : 'fb') + ci);
    const t = W.ni / 3;
    if (hi) { cell.hi = mesh; cell.hiTris = t; tris[1] += t; }
    else { cell.base = mesh; cell.baseTris = t; tris[0] += t; cell.blds = done; for (const b of done) setFlag(b, 1); }
  }
  function drop(ci, hi) {
    const c = cells.get(ci); if (!c) return;
    if (hi && c.hi) { c.hi.dispose(false, false); c.hi = null; tris[1] -= c.hiTris; }
    if (!hi && c.base) { c.base.dispose(false, false); c.base = null; tris[0] -= c.baseTris; for (const b of c.blds) setFlag(b, 0); c.blds = null; }
    if (!c.base && !c.hi && !(job && job.ci === ci)) cells.delete(ci);
  }
  function dropAll() { job = null; queue = []; for (const ci of [...cells.keys()]) { drop(ci, true); drop(ci, false); } cells.clear(); }
  let planT = 0;
  function plan(P, alt) {
    const want = [];
    const r = Math.ceil(S.RD / CS) + 1, ci0 = Math.floor(P.x / CS), cj0 = Math.floor(P.z / CS);
    const keep = new Set(), dist = new Map();
    // tope de triángulos: en barrios muy densos el radio de detalle se encoge y luego se recupera
    for (let L = 0; L < 2; L++) if (tris[L] < S.cap[L] * 0.75) S.rCap[L] = Math.min(1e9, S.rCap[L] + 15);
    if (S.on && alt < S.RD) {
      for (let j = cj0 - r; j <= cj0 + r; j++) for (let i = ci0 - r; i <= ci0 + r; i++) {
        if (i < 0 || j < 0 || i >= NX || j >= NZ) continue;
        const ci = j * NX + i; if (ELIG.start[ci] === ELIG.start[ci + 1]) continue;
        const dx = Math.max(i * CS - P.x, 0, P.x - (i + 1) * CS), dz = Math.max(j * CS - P.z, 0, P.z - (j + 1) * CS), d = Math.hypot(dx, dz, alt);
        if (d < Math.min(S.RD, S.rCap[0] + 40)) keep.add(ci);
        dist.set(ci, d);
        const c = cells.get(ci);
        if (d < Math.min(S.RB, S.rCap[0]) && !(c && c.base)) want.push([d, ci, false]);
        if (d < Math.min(S.HB, S.rCap[1]) && c && c.base && !c.hi) want.push([d + 25, ci, true]);
        if (c && c.hi && d > S.rCap[1] + 30) drop(ci, true);
        if (c && c.hi && d > S.HD) drop(ci, true);
      }
    }
    for (const ci of [...cells.keys()]) if (!keep.has(ci)) { drop(ci, true); drop(ci, false); }
    for (let L = 1; L >= 0; L--) if (tris[L] > S.cap[L]) {
      const far = [...cells.keys()].filter(ci => L ? cells.get(ci).hi : cells.get(ci).base).sort((a, b) => (dist.get(b) || 0) - (dist.get(a) || 0));
      for (const ci of far) { if (tris[L] <= S.cap[L] * 0.92) break; S.rCap[L] = Math.min(S.rCap[L], (dist.get(ci) || 0) - 1); drop(ci, true); if (!L) drop(ci, false); }
      for (let k = want.length - 1; k >= 0; k--) if (want[k][2] === !!L && want[k][0] - (L ? 25 : 0) >= S.rCap[L]) want.splice(k, 1);
    }
    want.sort((a, b) => a[0] - b[0]);
    queue = want;
    if (job && !keep.has(job.ci)) job = null;
  }
  function update(P, groundY, dt, frame) {
    const alt = Math.max(0, P.y - groundY);
    if ((planT -= dt) <= 0) { planT = 0.25; plan(P, alt); }
    const t0 = performance.now();
    while (S.on) {
      if (!job) {
        const w = queue.shift(); if (!w) break;
        const c = cells.get(w[1]) || (cells.set(w[1], { base: null, hi: null, lay: new Map(), blds: null }), cells.get(w[1]));
        if (w[2] ? (c.hi || !c.base) : c.base) continue;
        job = { ci: w[1], hi: w[2], it: cellJob(w[1], w[2]) };
      }
      const r = job.it.next(); if (r.done) job = null;
      if (performance.now() - t0 > S.budget) break;
    }
    for (const ch of dirty) ch.vbInfo.update(ch.inf);
    dirty.clear();
    const sy = ctx.L.sunDir.y, dusk = 1 - Math.min(1, Math.max(0, (sy - 0.02) / 0.22));
    matB.setFloat('uDusk', dusk); matH.setFloat('uDusk', dusk);
  }
  function setRange(q) {   // 0 apagado · 1 normal · 2 alto
    S.on = q > 0;
    const k = q >= 2 ? 1.45 : 1;
    Object.assign(S, { R0: 170 * k, R1: 215 * k, RB: 245 * k, RD: 310 * k, H0: 70 * k, H1: 95 * k, HB: 110 * k, HD: 140 * k, cap: q >= 2 ? [4.5e6, 2.4e6] : [2.4e6, 1.3e6], rCap: [1e9, 1e9] });
    ctx.matBld.setVector2('uFx', new BABYLON.Vector2(S.R0, S.R1));
    matB.setVector2('uFade', new BABYLON.Vector2(S.R0, S.R1)); matH.setVector2('uFade', new BABYLON.Vector2(S.H0, S.H1));
    if (!S.on) dropAll();
    planT = 0;
  }
  setRange(1);
  return { update, setRange, nElig, busy: () => !!job || queue.length > 0,
    stats: () => ({ rCap: S.rCap, cells: cells.size, base: [...cells.values()].filter(c => c.base).length, hi: [...cells.values()].filter(c => c.hi).length, trisBase: tris[0], trisHi: tris[1], queue: queue.length, job: !!job }) };
};
})();
