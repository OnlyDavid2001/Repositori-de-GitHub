/* GTA Barcelona — Fase 0: la ciudad. Visor Babylon.js sobre datos reales (OSM + MDT IGN). */
(async function () {
'use strict';
const $ = id => document.getElementById(id);
const SHOT = location.hash.indexOf('shot') >= 0;
if (SHOT) document.body.classList.add('shot');
const setMsg = (t, f) => { $('msg').textContent = t; if (f != null) $('bar').firstElementChild.style.width = Math.round(f * 100) + '%'; };
const tick = () => new Promise(r => setTimeout(r, 0));
window.BCN = { ready: false, error: null };

try {
// ------------------------------------------------------------------ datos
async function loadContainer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('No se pudo cargar ' + url + ' (' + res.status + ')');
  const buf = new Uint8Array(await res.arrayBuffer());
  const dv = new DataView(buf.buffer);
  let p = 8, width = 0, height = 0; const idat = [];
  while (p < buf.length) {
    const len = dv.getUint32(p), type = String.fromCharCode(buf[p + 4], buf[p + 5], buf[p + 6], buf[p + 7]);
    if (type === 'IHDR') { width = dv.getUint32(p + 8); height = dv.getUint32(p + 12); }
    else if (type === 'IDAT') idat.push(buf.subarray(p + 8, p + 8 + len));
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  const raw = new Uint8Array(await new Response(new Blob(idat).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  const rb = width * 3, out = new Uint8Array(height * rb);
  for (let y = 0; y < height; y++) out.set(raw.subarray(y * (rb + 1) + 1, (y + 1) * (rb + 1)), y * rb);
  const d2 = new DataView(out.buffer);
  const jl = d2.getUint32(4, true);
  const meta = JSON.parse(new TextDecoder().decode(out.subarray(12, 12 + jl)));
  const base = 12 + jl;
  return { meta, base, bytes: out, sec: name => { const s = meta.sections[name]; return out.buffer.slice(base + s[0], base + s[0] + s[1]); },
           view: name => { const s = meta.sections[name]; return new DataView(out.buffer, base + s[0], s[1]); } };
}

setMsg('Descargando relieve…', 0.03);
const [terr, metaRes] = await Promise.all([loadContainer('data/terrain.png'), fetch('data/meta.json').then(r => r.json())]);
const M = terr.meta, META = metaRes;
const WX = M.WX, WZ = M.WZ, CELL = M.CELL, CH = M.CH, NCX = M.NCX, NCZ = M.NCZ, CPC = M.CPC, GW = M.GW, GH = M.GH;
const Hraw = new Int16Array(terr.sec('H')), S = new Uint8Array(terr.sec('S'));
const H = new Float32Array(Hraw.length);
for (let i = 0; i < H.length; i++) H[i] = Hraw[i] / 10;

function heightAt(x, z) {
  if (x < 0) x = 0; else if (x > WX - 1e-3) x = WX - 1e-3;
  if (z < 0) z = 0; else if (z > WZ - 1e-3) z = WZ - 1e-3;
  const cx = (x / CH) | 0, cz = (z / CH) | 0, s = S[cz * NCX + cx], cs = CELL * s, n = CPC / s;
  const lx = (x - cx * CH) / cs, lz = (z - cz * CH) / cs;
  let i = lx | 0, j = lz | 0; if (i > n - 1) i = n - 1; if (j > n - 1) j = n - 1;
  const fx = lx - i, fz = lz - j, o = (cz * CPC + j * s) * GW + cx * CPC + i * s;
  const h00 = H[o], h10 = H[o + s], h01 = H[o + s * GW], h11 = H[o + s * GW + s];
  return fx >= fz ? h00 + (h10 - h00) * fx + (h11 - h10) * fz : h00 + (h11 - h01) * fx + (h01 - h00) * fz;
}

// ------------------------------------------------------------------ motor
const canvas = $('c');
const engine = new BABYLON.Engine(canvas, true, { antialias: true, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: SHOT }, false);
engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 1.5));
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0.62, 0.76, 0.9, 1);
scene.skipPointerMovePicking = true; scene.autoClearDepthAndStencil = true;
const cam = new BABYLON.FreeCamera('cam', new BABYLON.Vector3(WX / 2, 2500, WZ / 2), scene);
cam.inputs.clear(); cam.fov = 0.86; cam.minZ = 2; cam.maxZ = 170000;

// ------------------------------------------------------------------ shaders
const COMMON = `
precision highp float;
uniform vec3 uCam; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uGndCol;
uniform vec3 uFogCol; uniform vec3 uZenCol; uniform float uFogD; uniform float uTime;
float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float dith(){ return fract(52.9829189*fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1.0,0.0)),f.x), mix(hash21(i+vec2(0.0,1.0)),hash21(i+vec2(1.0,1.0)),f.x), f.y); }
vec3 skyColor(vec3 d){ float t = clamp(d.y,0.0,1.0); vec3 c = mix(uFogCol, uZenCol, pow(t, 0.42));
  float s = max(dot(d,uSunDir),0.0); c += uSunCol*(pow(s,420.0)*5.0 + pow(s,14.0)*0.20); return c; }
vec3 lit(vec3 alb, vec3 n){ float ndl = max(dot(n,uSunDir),0.0); vec3 amb = mix(uGndCol, uSkyCol, n.y*0.5+0.5); return alb*(uSunCol*ndl + amb); }
vec3 fog(vec3 c, vec3 wp){ vec3 d = wp-uCam; float dist = length(d); float rd = d.y/max(dist,1e-3); float b = 0.0007; float k = rd*b;
  float f = abs(k*dist) > 1e-3 ? (1.0-exp(-dist*k))/k : dist;
  float fa = 1.0-exp(-uFogD*exp(-max(uCam.y,0.0)*b)*f);
  float s = max(dot(d/max(dist,1e-3), uSunDir),0.0); vec3 fc = uFogCol + uSunCol*pow(s,8.0)*0.10;
  return mix(c, fc, clamp(fa,0.0,1.0)); }
`;
const VS_BASIC = `precision highp float;
attribute vec3 position; uniform mat4 world; uniform mat4 viewProjection; varying vec3 vPos;
void main(){ vec4 wp = world*vec4(position,1.0); vPos = wp.xyz; gl_Position = viewProjection*wp; }`;
const VS_COL = `precision highp float;
attribute vec3 position; attribute vec4 color; attribute vec4 uv; uniform mat4 world; uniform mat4 viewProjection;
varying vec3 vPos; varying vec3 vLoc; varying vec4 vCol; varying vec4 vInfo;
void main(){ vec4 wp = world*vec4(position,1.0); vPos = wp.xyz; vLoc = position; vCol = color; vInfo = uv; gl_Position = viewProjection*wp; }`;
const VS_NRM = `precision highp float;
attribute vec3 position; attribute vec3 normal; uniform mat4 world; uniform mat4 viewProjection; varying vec3 vPos; varying vec3 vN;
void main(){ vec4 wp = world*vec4(position,1.0); vPos = wp.xyz; vN = normal; gl_Position = viewProjection*wp; }`;

const FS_BLD = `#extension GL_OES_standard_derivatives : enable
` + COMMON + `
varying vec3 vPos; varying vec3 vLoc; varying vec4 vCol; varying vec4 vInfo; uniform vec2 uFx;
void main(){
  vec3 n = normalize(cross(dFdx(vLoc), dFdy(vLoc)));
  vec3 V = uCam - vPos; float dist = length(V); V /= dist;
  if (dot(n, V) < 0.0) n = -n;
  // edificio con fachada de detalle ya construida: la pared simple cede el sitio con un fundido tramado
  if (vInfo.w > 0.5 && abs(n.y) < 0.5 && dith() >= smoothstep(uFx.x, uFx.y, dist)) discard;
  float a255 = floor(vCol.a*255.0 + 0.5); float style = floor(a255/16.0); float seed = (a255 - style*16.0)/15.0;
  vec3 base = vCol.rgb;
  float h = vInfo.x*0.1, Ht = vInfo.y*0.1;
  float fade = 1.0 - smoothstep(260.0, 1100.0, dist);
  if (abs(n.y) < 0.5) {
    float u = vInfo.z*0.1;
    bool glassy = abs(style-3.0) < 0.5 || abs(style-12.0) < 0.5;
    bool plain = abs(style-1.0) < 0.5 || abs(style-4.0) < 0.5 || abs(style-5.0) < 0.5 || abs(style-8.0) < 0.5 || abs(style-11.0) < 0.5 || style > 12.5;
    if (glassy) {
      float fy = fract(h/3.6), fx = fract(u/1.9);
      float mull = max(1.0 - smoothstep(0.05,0.09,fy), 1.0 - smoothstep(0.04,0.08,fx));
      float cell = hash21(vec2(floor(u/1.9), floor(h/3.6)));
      vec3 gl = mix(base*0.62, mix(base, uSkyCol*1.25, 0.45), cell*0.6 + 0.2);
      base = mix(mix(base*0.85, gl, 0.7), mix(gl, base*0.55, mull*0.8), fade);
    } else if (!plain) {
      float fh = 3.2, fl = floor(h/fh), fy = fract(h/fh);
      float fx = fract(u/2.7 + seed*3.7);
      float wy = smoothstep(0.26,0.32,fy)*(1.0 - smoothstep(0.80,0.86,fy));
      float wx = smoothstep(0.22,0.28,fx)*(1.0 - smoothstep(0.72,0.78,fx));
      float w = wx*wy;
      if (fl < 0.5) w = smoothstep(0.10,0.16,fx)*(1.0 - smoothstep(0.84,0.90,fx))*smoothstep(0.12,0.18,fy)*(1.0 - smoothstep(0.84,0.9,fy));
      w *= step(0.0, h)*step(h, Ht - 0.7);
      float cell = hash21(vec2(floor(u/2.7 + seed*3.7), fl + seed*13.0));
      vec3 glass = mix(vec3(0.11,0.13,0.17), uSkyCol*0.85, 0.25 + 0.35*cell);
      float amt = abs(style-2.0) < 0.5 ? 0.55 : 0.9;
      base = mix(base, glass, mix(0.20, w*amt, fade));
      base *= 1.0 - 0.07*(1.0 - smoothstep(0.02,0.06,fy))*fade*step(0.5, fl);
    } else {
      base *= 0.96 + 0.08*vnoise(vec2(u*0.4, h*0.4));
    }
    base *= mix(0.74, 1.0, smoothstep(-2.0, 8.0, h));
    base *= 1.0 - 0.10*smoothstep(Ht-0.9, Ht-0.5, h);
  } else {
    vec3 roof;
    float r = hash21(vCol.rg*91.7 + seed);
    if (style < 0.5) roof = mix(mix(vec3(0.66,0.47,0.38), vec3(0.70,0.62,0.54), r), vec3(0.56,0.55,0.54), step(0.72, r));
    else if (abs(style-1.0) < 0.5) roof = mix(vec3(0.62,0.64,0.67), vec3(0.72,0.71,0.68), r);
    else if (abs(style-2.0) < 0.5) roof = mix(vec3(0.60,0.50,0.42), vec3(0.52,0.50,0.48), r);
    else if (abs(style-3.0) < 0.5) roof = vec3(0.46,0.48,0.52);
    else if (abs(style-6.0) < 0.5) roof = mix(vec3(0.72,0.44,0.32), vec3(0.64,0.40,0.30), r);
    else if (abs(style-9.0) < 0.5) roof = vec3(0.76,0.76,0.77);
    else if (abs(style-10.0) < 0.5) roof = vec3(0.80,0.82,0.84);
    else roof = base*0.95;
    float nz = vnoise(vPos.xz*0.35);
    base = roof*(0.93 + 0.12*nz);
    // peto / borde de cubierta
    base *= 1.0;
  }
  vec3 c = lit(base, n);
  gl_FragColor = vec4(fog(c, vPos), 1.0);
}`;

const FS_TER = COMMON + `
varying vec3 vPos; uniform sampler2D groundTex; uniform sampler2D normTex; uniform vec2 uSize; uniform vec2 uGrid; uniform float uCell;
void main(){
  vec2 uv = vPos.xz/uSize;
  vec3 alb = texture2D(groundTex, uv).rgb;
  vec3 n = normalize(texture2D(normTex, (vPos.xz/uCell + 0.5)/uGrid).xyz*2.0 - 1.0);
  float dist = length(vPos - uCam);
  float d1 = vnoise(vPos.xz*0.9)*0.5 + vnoise(vPos.xz*0.12)*0.5;
  float d2 = vnoise(vPos.xz*0.012);
  float veg = clamp((alb.g - max(alb.r, alb.b))*7.0, 0.0, 1.0);
  float dark = 1.0 - smoothstep(0.30, 0.48, alb.g);
  float can = vnoise(vPos.xz*0.16)*0.5 + vnoise(vPos.xz*0.055)*0.3 + vnoise(vPos.xz*0.4)*0.2;
  float canFar = vnoise(vPos.xz*0.02)*0.6 + vnoise(vPos.xz*0.006)*0.4;
  float nearF = 1.0 - smoothstep(500.0, 3500.0, dist);
  alb *= mix(1.0, 0.86 + 0.28*d1, mix(0.35, 1.0, veg)*nearF);
  alb *= mix(1.0, mix(0.80 + 0.36*canFar, 0.58 + 0.80*can*can, nearF), veg*dark);
  alb *= 0.94 + 0.12*d2;
  vec3 c = lit(alb, n);
  gl_FragColor = vec4(fog(c, vPos), 1.0);
}`;

const FS_OUT = COMMON + `
varying vec3 vPos; varying vec3 vN; uniform sampler2D outTex; uniform float uUseTex; uniform vec4 uOutRect;
void main(){
  vec3 n = normalize(vN); float slope = 1.0 - n.y; float h = vPos.y;
  float nz = vnoise(vPos.xz*0.0016)*0.6 + vnoise(vPos.xz*0.007)*0.4;
  vec3 low = mix(vec3(0.63,0.61,0.50), vec3(0.50,0.57,0.40), nz);
  vec3 forest = mix(vec3(0.22,0.36,0.22), vec3(0.31,0.43,0.27), nz);
  float f = clamp(smoothstep(0.015,0.09,slope) + smoothstep(110.0,300.0,h), 0.0, 1.0);
  vec3 alb = mix(low, forest, f);
  alb = mix(alb, vec3(0.56,0.53,0.49), smoothstep(0.30,0.55,slope));
  if (uUseTex > 0.5) {
    vec2 uv = (vPos.xz - uOutRect.xy)/uOutRect.zw;
    vec4 t = texture2D(outTex, uv);
    alb = t.rgb*(0.92 + 0.16*nz);
  }
  vec3 c = lit(alb, n);
  gl_FragColor = vec4(fog(c, vPos), 1.0);
}`;

const FS_ROAD = COMMON + `
varying vec3 vPos; varying vec4 vCol; varying vec4 vInfo;
void main(){
  float cls = floor(vCol.a*255.0 + 0.5);
  vec3 alb = vCol.rgb*(0.90 + 0.2*vnoise(vPos.xz*0.6));
  float dist = length(vPos - uCam);
  float fade = 1.0 - smoothstep(250.0, 1400.0, dist);
  float au = abs(vInfo.x), v = vInfo.y, mk = 0.0;
  if (cls < 1.5 || abs(cls-10.0) < 0.5) {
    mk = smoothstep(0.84,0.87,au)*(1.0 - smoothstep(0.91,0.94,au));
    if (cls < 1.5) mk = max(mk, (1.0 - smoothstep(0.015,0.04,abs(au-0.31)))*step(fract(v/12.0),0.3));
  } else if (cls < 3.5) {
    mk = (1.0 - smoothstep(0.015,0.04,abs(au-0.33)))*step(fract(v/9.0),0.4);
  } else if (cls < 4.5) {
    mk = (1.0 - smoothstep(0.02,0.05,au))*step(fract(v/9.0),0.4);
  } else if (abs(cls-13.0) < 0.5) {
    mk = max((1.0 - smoothstep(0.012,0.022,au))*step(fract(v/50.0),0.6), smoothstep(0.90,0.92,au)*(1.0 - smoothstep(0.95,0.97,au)));
  } else if (abs(cls-14.0) < 0.5) {
    mk = (1.0 - smoothstep(0.02,0.045,au))*0.8;
    alb = mix(alb, vec3(0.85,0.72,0.2), mk*fade*0.8); mk = 0.0;
  }
  alb = mix(alb, vec3(0.86,0.86,0.82), mk*fade*0.8);
  vec3 c = lit(alb, vec3(0.0,1.0,0.0));
  gl_FragColor = vec4(fog(c, vPos), 1.0);
}`;

const FS_QUAY = COMMON + `
varying vec3 vPos;
void main(){
  vec3 alb = mix(vec3(0.25,0.26,0.25), vec3(0.62,0.60,0.56), smoothstep(-0.2, 1.4, vPos.y));
  alb *= 0.9 + 0.2*vnoise(vPos.xz*0.3 + vPos.y);
  vec3 c = alb*(uSunCol*0.45 + uSkyCol);
  gl_FragColor = vec4(fog(c, vPos), 1.0);
}`;

const FS_SEA = `#extension GL_OES_standard_derivatives : enable
` + COMMON + `
varying vec3 vPos; uniform sampler2D coastTex; uniform vec2 uSize;
void main(){
  vec2 p = vPos.xz; vec3 V = uCam - vPos; float dist = length(V); V /= dist;
  vec2 g = vec2(0.0); float t = uTime;
  float m = 0.65 + 0.7*vnoise(p*0.003 + t*0.01);
  vec2 d1 = vec2(-0.62,0.78), d2 = vec2(-0.90,0.44), d3 = vec2(-0.30,0.95), d4 = vec2(-0.98,-0.17), d5 = vec2(0.20,0.98);
  float px = max(length(dFdx(p)), length(dFdy(p)));
  g += d1*(0.037*m*(1.0 - smoothstep(0.10,0.40,px/60.0))*cos(dot(p,d1)*0.105 + t*1.00));
  g += d2*(0.037*m*(1.0 - smoothstep(0.10,0.40,px/37.0))*cos(dot(p,d2)*0.170 + t*1.30));
  g += d3*(0.036*(1.0 - smoothstep(0.10,0.40,px/21.0))*cos(dot(p,d3)*0.300 + t*1.70));
  g += d4*(0.034*(1.0 - smoothstep(0.10,0.40,px/11.0))*cos(dot(p,d4)*0.570 + t*2.30));
  g += d5*(0.036*(1.0 - smoothstep(0.10,0.40,px/5.0))*cos(dot(p,d5)*1.260 + t*3.10));
  float rough = smoothstep(0.5, 30.0, px);
  vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
  vec2 uv = p/uSize;
  float inside = step(0.0,uv.x)*step(uv.x,1.0)*step(0.0,uv.y)*step(uv.y,1.0);
  float cd = mix(1.0, texture2D(coastTex, uv).r, inside);
  vec3 deep = vec3(0.020,0.115,0.230), shallow = vec3(0.070,0.330,0.400);
  vec3 water = mix(shallow, deep, smoothstep(0.0, 0.5, cd));
  water *= (uSkyCol*1.2 + uSunCol*0.35*max(uSunDir.y,0.0));
  float fres = 0.02 + 0.98*pow(1.0 - max(dot(n,V),0.0), 5.0);
  vec3 r = reflect(-V, n); r.y = abs(r.y);
  vec3 sky = mix(uFogCol, uZenCol, pow(clamp(r.y,0.0,1.0), 0.42));
  vec3 c = mix(water, sky, fres*0.9);
  float sp = pow(max(dot(r,uSunDir),0.0), mix(260.0, 40.0, rough));
  c += uSunCol*sp*mix(2.2, 0.35, rough);
  float foam = (1.0 - smoothstep(0.0, 0.04, cd))*inside*(0.35 + 0.65*vnoise(p*0.12 + vec2(t*0.25, -t*0.1)));
  c = mix(c, vec3(0.93,0.95,0.96)*(uSunCol*0.6 + uSkyCol), foam*0.6);
  gl_FragColor = vec4(fog(c, vPos), 1.0);
}`;

const VS_SKY = `precision highp float;
attribute vec3 position; uniform mat4 world; uniform mat4 viewProjection; varying vec3 vDir;
void main(){ vDir = position; vec4 wp = world*vec4(position,1.0); gl_Position = viewProjection*wp; }`;
const FS_SKY = COMMON + `
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir); vec3 c = skyColor(d);
  if (d.y > 0.012 && uCam.y < 2400.0) {
    float tp = (2600.0 - uCam.y)/d.y;
    vec2 q = (uCam.xz + d.xz*tp)*0.00015 + vec2(uTime*0.003, 0.0);
    float n = vnoise(q)*0.5 + vnoise(q*2.03 + 7.1)*0.25 + vnoise(q*4.1 + 3.3)*0.125 + vnoise(q*8.3 + 1.7)*0.0625;
    float cov = smoothstep(0.50, 0.76, n)*smoothstep(0.012, 0.11, d.y);
    vec3 cc = mix(uFogCol, vec3(0.80) + uSunCol*0.32, 0.8);
    c = mix(c, cc, cov*0.85);
  }
  if (d.y < 0.0) c = mix(uFogCol, uFogCol*0.8, clamp(-d.y*4.0, 0.0, 1.0));
  gl_FragColor = vec4(c, 1.0);
}`;

const BASEU = ['world', 'viewProjection', 'uCam', 'uSunDir', 'uSunCol', 'uSkyCol', 'uGndCol', 'uFogCol', 'uZenCol', 'uFogD', 'uTime'];
const mats = [];
function mkMat(name, vs, fs, attributes, uniforms, samplers) {
  const m = new BABYLON.ShaderMaterial(name, scene, { vertexSource: vs, fragmentSource: fs },
    { attributes, uniforms: BASEU.concat(uniforms || []), samplers: samplers || [] });
  m.backFaceCulling = false;
  mats.push(m);
  return m;
}
const matBld = mkMat('bld', VS_COL, FS_BLD, ['position', 'color', 'uv'], ['uFx']);
matBld.setVector2('uFx', new BABYLON.Vector2(230, 290));
const matTer = mkMat('ter', VS_BASIC, FS_TER, ['position'], ['uSize', 'uGrid', 'uCell'], ['groundTex', 'normTex']);
const matOut = mkMat('out', VS_NRM, FS_OUT, ['position', 'normal'], ['uUseTex', 'uOutRect'], ['outTex']);
const matRoad = mkMat('road', VS_COL, FS_ROAD, ['position', 'color', 'uv']);
const matQuay = mkMat('quay', VS_BASIC, FS_QUAY, ['position']);
const matSea = mkMat('sea', VS_BASIC, FS_SEA, ['position'], ['uSize'], ['coastTex']);
const matSky = mkMat('sky', VS_SKY, FS_SKY, ['position']);
matTer.zOffset = 0; matTer.zOffsetUnits = 8;
matOut.zOffset = 0; matOut.zOffsetUnits = 8;
matSea.zOffset = 0; matSea.zOffsetUnits = 40;
matSky.disableDepthWrite = true;

const VB = BABYLON.VertexBuffer;
const vbuf = (data, kind, size, type, norm) => new VB(engine, data, kind, false, false, size, false, 0, size, type, norm);
function mkMesh(name, pos, idx, mat, extra, px, pz) {
  const m = new BABYLON.Mesh(name, scene);
  m.setVerticesData('position', pos, false);
  if (extra) for (const b of extra) m.setVerticesBuffer(b);
  m.setIndices(idx, pos.length / 3);
  m.material = mat; m.isPickable = false; m.renderingGroupId = 1;
  if (px || pz) m.position.set(px || 0, 0, pz || 0);
  m.freezeWorldMatrix(); m.doNotSyncBoundingInfo = true;
  return m;
}

// ------------------------------------------------------------------ luz / hora
const L = { sunDir: new BABYLON.Vector3(), sunCol: new BABYLON.Color3(), skyCol: new BABYLON.Color3(), gndCol: new BABYLON.Color3(),
            fogCol: new BABYLON.Color3(), zenCol: new BABYLON.Color3(), fogD: 0.000032 };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function setHour(hh) {
  const az = (95 + (hh - 6.5) / 14 * 170) * Math.PI / 180;                 // el sol va de E (mañana) a O (tarde) por el sur
  const el = Math.max(Math.sin((hh - 6.0) / 15 * Math.PI), 0.02) * 64 * Math.PI / 180;
  L.sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  const e = Math.min(1, Math.max(0, (el * 180 / Math.PI - 2) / 26));
  const sc = mix3([1.05, 0.50, 0.24], [1.04, 0.99, 0.90], e), sk = mix3([0.34, 0.32, 0.42], [0.40, 0.48, 0.60], e);
  const fg = mix3([0.96, 0.66, 0.46], [0.74, 0.83, 0.92], e), zn = mix3([0.20, 0.24, 0.46], [0.16, 0.38, 0.78], e);
  const k = 0.55 + 0.45 * e;
  L.sunCol.set(sc[0] * k * 0.82, sc[1] * k * 0.82, sc[2] * k * 0.82); L.skyCol.set(sk[0] * 0.80, sk[1] * 0.80, sk[2] * 0.80);
  L.gndCol.set(0.33 * k + 0.04, 0.31 * k + 0.04, 0.28 * k + 0.04);
  L.fogCol.set(fg[0], fg[1], fg[2]); L.zenCol.set(zn[0], zn[1], zn[2]);
  for (const m of mats) {
    m.setVector3('uSunDir', L.sunDir); m.setColor3('uSunCol', L.sunCol); m.setColor3('uSkyCol', L.skyCol); m.setColor3('uGndCol', L.gndCol);
    m.setColor3('uFogCol', L.fogCol); m.setColor3('uZenCol', L.zenCol); m.setFloat('uFogD', L.fogD);
  }
  scene.clearColor.set(fg[0], fg[1], fg[2], 1);
  const h = Math.floor(hh), mi = Math.round((hh - h) * 60);
  $('hourV').textContent = h + ':' + (mi < 10 ? '0' : '') + mi;
}

// ------------------------------------------------------------------ cielo y mar
const sky = BABYLON.MeshBuilder.CreateSphere('sky', { diameter: 2, segments: 24 }, scene);
sky.material = matSky; sky.scaling.setAll(150000); sky.isPickable = false; sky.renderingGroupId = 0; sky.alwaysSelectAsActiveMesh = true;
const sea = BABYLON.MeshBuilder.CreateGround('sea', { width: 420000, height: 420000, subdivisions: 160 }, scene);
sea.position.set(WX / 2, 0, WZ / 2); sea.material = matSea; sea.isPickable = false; sea.renderingGroupId = 1; sea.alwaysSelectAsActiveMesh = true;
matSea.setVector2('uSize', new BABYLON.Vector2(WX, WZ));
const texOpts = (t, aniso) => { t.wrapU = t.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE; t.anisotropicFilteringLevel = aniso || 1; return t; };
const waitTex = t => new Promise((res, rej) => { if (t.isReady()) return res(t); t.onLoadObservable.addOnce(() => res(t)); });
const blobURL = async url => { const r = await fetch(url); if (!r.ok) throw new Error('No se pudo cargar ' + url + ' (' + r.status + ')'); return URL.createObjectURL(await r.blob()); };
const coastTex = texOpts(new BABYLON.Texture(await blobURL('data/coast.png'), scene, false, true, BABYLON.Texture.BILINEAR_SAMPLINGMODE));
matSea.setTexture('coastTex', coastTex);

// ------------------------------------------------------------------ terreno
setMsg('Levantando el relieve (MDT del IGN)…', 0.12);
await tick();
{
  const nrm = new Uint8Array(GW * GH * 4);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    const il = i > 0 ? i - 1 : i, ir = i < GW - 1 ? i + 1 : i, jd = j > 0 ? j - 1 : j, ju = j < GH - 1 ? j + 1 : j;
    const dx = (H[j * GW + ir] - H[j * GW + il]) / ((ir - il) * CELL), dz = (H[ju * GW + i] - H[jd * GW + i]) / ((ju - jd) * CELL);
    const inv = 1 / Math.sqrt(dx * dx + 1 + dz * dz), o = (j * GW + i) * 4;
    nrm[o] = (-dx * inv * 0.5 + 0.5) * 255; nrm[o + 1] = (inv * 0.5 + 0.5) * 255; nrm[o + 2] = (-dz * inv * 0.5 + 0.5) * 255; nrm[o + 3] = 255;
  }
  const normTex = BABYLON.RawTexture.CreateRGBATexture(nrm, GW, GH, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
  texOpts(normTex, 4);
  matTer.setTexture('normTex', normTex);
  matTer.setVector2('uSize', new BABYLON.Vector2(WX, WZ)); matTer.setVector2('uGrid', new BABYLON.Vector2(GW, GH)); matTer.setFloat('uCell', CELL);
  const groundTex = texOpts(new BABYLON.Texture(await blobURL('data/ground.webp'), scene, false, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE), 8);
  matTer.setTexture('groundTex', groundTex);
  const dv = terr.view('meshes'); let p = 0, tris = 0;
  for (let k = 0; k < M.nMesh; k++) {
    const cx = dv.getUint8(p), cz = dv.getUint8(p + 1), nV = dv.getUint32(p + 4, true), nI = dv.getUint32(p + 8, true); p += 12;
    const pos = new Float32Array(nV * 3);
    for (let v = 0; v < nV; v++, p += 6) { pos[v * 3] = dv.getUint16(p, true) / 10; pos[v * 3 + 1] = dv.getInt16(p + 2, true) / 10; pos[v * 3 + 2] = dv.getUint16(p + 4, true) / 10; }
    if ((nV * 6) % 4) p += 2;
    const idx = new Uint16Array(nI);
    for (let v = 0; v < nI; v++, p += 2) idx[v] = dv.getUint16(p, true);
    if ((nI * 2) % 4) p += 2;
    mkMesh('t' + k, pos, idx, matTer, null, cx * CH, cz * CH); tris += nI / 3;
  }
  // muelles
  const qv = new Float32Array(terr.sec('quayV')), qi = new Uint32Array(terr.sec('quayI'));
  mkMesh('quays', qv, qi, matQuay);
  // entorno lejano
  const O = M.outer, oh = new Int16Array(terr.sec('outer')), ox = O.E0 - M.E0, oz = O.N0 - M.N0, oc = O.cell;
  const [i0, i1, j0, j1] = O.hole;
  const op = new Float32Array(O.W * O.H * 3), oi = [];
  for (let j = 0; j < O.H; j++) for (let i = 0; i < O.W; i++) { const o = (j * O.W + i) * 3; op[o] = ox + i * oc; op[o + 1] = oh[j * O.W + i] / 10; op[o + 2] = oz + j * oc; }
  for (let j = 0; j < O.H - 1; j++) for (let i = 0; i < O.W - 1; i++) {
    if (i >= i0 && i < i1 && j >= j0 && j < j1) continue;
    const a = j * O.W + i, b = a + 1, c = a + O.W, d = c + 1;
    if (oh[a] < -10 && oh[b] < -10 && oh[c] < -10 && oh[d] < -10) continue;
    oi.push(a, b, d, a, d, c);
  }
  const on = new Float32Array(op.length);
  BABYLON.VertexData.ComputeNormals(op, oi, on);
  for (let k = 1; k < on.length; k += 3) if (on[k] < 0) { on[k - 1] = -on[k - 1]; on[k] = -on[k]; on[k + 1] = -on[k + 1]; }
  const om = mkMesh('outer', op, new Uint32Array(oi), matOut, [vbuf(on, 'normal', 3, VB.FLOAT, false)]);
  om.alwaysSelectAsActiveMesh = true;
  matOut.setFloat('uUseTex', 0); matOut.setVector4('uOutRect', new BABYLON.Vector4(ox, oz, (O.W - 1) * oc, (O.H - 1) * oc));
  matOut.setTexture('outTex', coastTex);
  try {
    const outTex = texOpts(new BABYLON.Texture(await blobURL('data/outer.webp'), scene, false, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE), 4);
    matOut.setTexture('outTex', outTex); matOut.setFloat('uUseTex', 1);
  } catch (e) { console.warn('Sin textura de entorno lejano', e); }
  window.BCN.terrTris = tris;
}

// ------------------------------------------------------------------ calles
setMsg('Trazando calles…', 0.25);
await tick();
const RCOL = [[66, 66, 72], [70, 70, 76], [78, 78, 84], [82, 82, 88], [86, 86, 91], [92, 92, 96], [118, 116, 112], [196, 186, 168], [100, 100, 103],
              [168, 150, 118], [72, 72, 78], [96, 88, 82], [104, 112, 98], [52, 52, 58], [92, 92, 97], [150, 140, 124], [212, 203, 186], [100, 146, 82]];
const ROFF = [0.30, 0.28, 0.24, 0.22, 0.20, 0.18, 0.16, 0.14, 0.12, 0.10, 0.26, 0.13, 0.25, 0.22, 0.17, 0.30, 0.12, 0.20];
let roadTris = 0;
const RSEG = [];   // tramos de eje de calle (x0,z0,x1,z1,semiancho) para saber qué fachadas dan a la calle
{
  const rd = await loadContainer('data/roads.png');
  const dv = rd.view('data');
  const xs = [], zs = [];
  function sub(x0, z0, h0, x1, z1, h1, depth) {
    const dx = x1 - x0, dz = z1 - z0, Ls = Math.hypot(dx, dz);
    if (Ls < 7 || depth > 7) return;
    const xm = (x0 + x1) / 2, zm = (z0 + z1) / 2, hm = heightAt(xm, zm);
    const e = Math.max(Math.abs(hm - (h0 + h1) / 2), Math.abs(heightAt(x0 + dx * 0.25, z0 + dz * 0.25) - (h0 * 0.75 + h1 * 0.25)),
                       Math.abs(heightAt(x0 + dx * 0.75, z0 + dz * 0.75) - (h0 * 0.25 + h1 * 0.75)));
    if (e < 0.10 && Ls < 150) return;
    sub(x0, z0, h0, xm, zm, hm, depth + 1); xs.push(xm); zs.push(zm); sub(xm, zm, hm, x1, z1, h1, depth + 1);
  }
  let bi = 0;
  for (const bk of rd.meta.buckets) {
    let p = bk[2]; const end = bk[2] + bk[3];
    const pos = [], col = [], uvs = [], idx = [];
    while (p < end) {
      const cls = dv.getUint8(p), w = dv.getUint8(p + 1) / 4, n = dv.getUint16(p + 2, true);
      let x = dv.getInt32(p + 4, true) / 10, z = dv.getInt32(p + 8, true) / 10; p += 12;
      xs.length = 0; zs.length = 0; xs.push(x); zs.push(z);
      let hp = heightAt(x, z);
      for (let k = 1; k < n; k++, p += 4) {
        const nx = x + dv.getInt16(p, true) / 10, nz = z + dv.getInt16(p + 2, true) / 10, hn = heightAt(nx, nz);
        RSEG.push(x, z, nx, nz, w / 2);
        sub(x, z, hp, nx, nz, hn, 0); xs.push(nx); zs.push(nz); x = nx; z = nz; hp = hn;
      }
      const m = xs.length, hw = w / 2, c = RCOL[cls] || RCOL[5], off = ROFF[cls] || 0.15, v0 = pos.length / 3;
      let along = 0;
      for (let k = 0; k < m; k++) {
        const ka = k > 0 ? k - 1 : k, kb = k < m - 1 ? k + 1 : k;
        let tx = xs[kb] - xs[ka], tz = zs[kb] - zs[ka]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        if (k > 0) along += Math.hypot(xs[k] - xs[k - 1], zs[k] - zs[k - 1]);
        const lx = xs[k] - tz * hw, lz = zs[k] + tx * hw, rx = xs[k] + tz * hw, rz = zs[k] - tx * hw;
        let yl = heightAt(lx, lz), yr = heightAt(rx, rz);
        if (hw > 2.5) { const yc = heightAt(xs[k], zs[k]); yl = Math.max(yl, yc - hw * 0.08); yr = Math.max(yr, yc - hw * 0.08); if (hw > 9) { yl = Math.max(yl, yc); yr = Math.max(yr, yc); } }
        pos.push(lx, yl + off, lz, rx, yr + off, rz);
        col.push(c[0], c[1], c[2], cls, c[0], c[1], c[2], cls);
        uvs.push(-1, along, 1, along);
        if (k > 0) { const a = v0 + 2 * k - 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
      }
    }
    if (idx.length) {
      const nv = pos.length / 3;
      mkMesh('r' + bi, new Float32Array(pos), nv > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), matRoad,
        [vbuf(new Uint8Array(col), 'color', 4, VB.UNSIGNED_BYTE, true), vbuf(new Float32Array(uvs), 'uv', 2, VB.FLOAT, false)]);
      roadTris += idx.length / 3;
    }
    if ((++bi & 15) === 0) { setMsg('Trazando calles…', 0.25 + 0.1 * bi / rd.meta.buckets.length); await tick(); }
  }
}

// ------------------------------------------------------------------ edificios
const PAL = {
  0: [[226, 210, 186], [216, 198, 172], [230, 218, 200], [206, 190, 168], [234, 224, 208], [200, 182, 162], [220, 204, 188], [228, 208, 180],
      [212, 200, 190], [194, 178, 162], [232, 218, 192], [214, 188, 162], [224, 214, 204], [204, 194, 180], [228, 202, 174], [210, 186, 166]],
  1: [[204, 204, 202], [190, 194, 198], [212, 208, 200], [198, 196, 192]],
  2: [[198, 184, 160], [186, 172, 150], [206, 192, 170], [192, 180, 160]],
  3: [[116, 146, 172], [98, 128, 158], [136, 162, 184], [108, 138, 150]],
  4: [[192, 188, 180], [182, 178, 172]], 5: [[208, 208, 208]], 6: [[232, 222, 206], [238, 228, 212], [224, 206, 186], [236, 220, 196]],
  8: [[230, 230, 228], [214, 216, 218]], 9: [[202, 200, 198]], 10: [[228, 230, 232], [214, 218, 222]], 11: [[190, 172, 144]],
  12: [[92, 118, 172]], 13: [[226, 229, 233]],
  14: [[214, 204, 186], [196, 188, 174], [98, 76, 58]], 15: [[104, 150, 84], [66, 112, 62], [82, 128, 68]],
};
const bldChunks = []; let bldTris = 0, bldCount = 0;
// registro compacto de cada edificio, para releer su planta cuando haga falta la fachada de detalle
const BREC = { dv: [], n: 0 };
{
  const files = (META.stats && META.stats.bfiles) || ['buildings0.png'];
  let done = 0, total = 0;
  const conts = [];
  for (let f = 0; f < files.length; f++) { setMsg('Descargando edificios…', 0.36 + 0.08 * f / files.length); conts.push(await loadContainer('data/' + files[f])); }
  let nTot = 0;
  for (const c of conts) { total += c.meta.chunks.length; for (const ck of c.meta.chunks) nTot += ck[4]; }
  BREC.cont = new Uint8Array(nTot); BREC.off = new Int32Array(nTot); BREC.chunk = new Int32Array(nTot);
  BREC.v0 = new Int32Array(nTot); BREC.v1 = new Int32Array(nTot); BREC.bb = new Float32Array(nTot * 4); BREC.elig = new Uint8Array(nTot);
  for (let ci = 0; ci < conts.length; ci++) {
    const c = conts[ci];
    const dv = c.view('data'); BREC.dv.push(dv);
    for (const ck of c.meta.chunks) {
      const [cx, cz, off, len, nB, nV, nR] = ck;
      const maxV = (nV + nR) * 2, maxI = nV * 6 + (nV + 2 * nR) * 3;
      const pos = new Float32Array(maxV * 3), col = new Uint8Array(maxV * 4), inf = new Int16Array(maxV * 4);
      const idx = maxV > 65535 ? new Uint32Array(maxI) : new Uint16Array(maxI);
      let vp = 0, ip = 0, p = off; const end = off + len; const flat = [], holes = [], rsz = [], topIdx = [];
      const ox = cx * CH, oz = cz * CH;
      while (p < end) {
        const bi = BREC.n++; BREC.cont[bi] = ci; BREC.off[bi] = p; BREC.chunk[bi] = bldChunks.length; BREC.v0[bi] = vp;
        const nRings = dv.getUint8(p), cls = dv.getUint8(p + 1), seed = dv.getUint8(p + 2), n = dv.getUint16(p + 4, true);
        const yb = dv.getInt16(p + 6, true), ybot = dv.getInt16(p + 8, true), ytop = dv.getInt16(p + 10, true); p += 12;
        rsz.length = 0;
        if (nRings > 1) { for (let r = 0; r < nRings; r++, p += 2) rsz.push(dv.getUint16(p, true)); } else rsz.push(n);
        const pal = PAL[cls] || PAL[0], c3 = pal[seed % pal.length], a = (cls << 4) | (seed & 15);
        const Ht = ytop - yb, hb = ybot - yb, y0 = ybot / 10, y1 = ytop / 10;
        flat.length = 0;
        for (let k = 0; k < n; k++, p += 4) flat.push(dv.getInt16(p, true) / 10, dv.getInt16(p + 2, true) / 10);
        let rs = 0; holes.length = 0;
        for (let r = 0; r < rsz.length; r++) {
          const m = rsz[r]; if (r > 0) holes.push(rs);
          let ua = 0;
          for (let k = 0; k <= m; k++) {
            const kk = rs + (k % m), x = flat[kk * 2], z = flat[kk * 2 + 1];
            if (k > 0) { const pk = rs + k - 1; ua += Math.hypot(x - flat[pk * 2], z - flat[pk * 2 + 1]); }
            const uq = Math.min(32767, Math.round(ua * 10));
            let o = vp * 3; pos[o] = x; pos[o + 1] = y0; pos[o + 2] = z; pos[o + 3] = x; pos[o + 4] = y1; pos[o + 5] = z;
            o = vp * 4; col[o] = c3[0]; col[o + 1] = c3[1]; col[o + 2] = c3[2]; col[o + 3] = a; col[o + 4] = c3[0]; col[o + 5] = c3[1]; col[o + 6] = c3[2]; col[o + 7] = a;
            inf[o] = hb; inf[o + 1] = Ht; inf[o + 2] = uq; inf[o + 4] = Ht; inf[o + 5] = Ht; inf[o + 6] = uq;
            if (k < m) topIdx[kk] = vp + 1;
            if (k > 0) { const a0 = vp - 2; idx[ip++] = a0; idx[ip++] = vp; idx[ip++] = vp + 1; idx[ip++] = a0; idx[ip++] = vp + 1; idx[ip++] = a0 + 1; }
            vp += 2;
          }
          rs += m;
        }
        const tr = earcut(flat, holes.length ? holes : null, 2);
        for (let k = 0; k < tr.length; k++) idx[ip++] = topIdx[tr[k]];
        bldCount++;
        BREC.v1[bi] = vp;
        let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9;
        for (let k = 0; k < flat.length; k += 2) { const x = flat[k], z = flat[k + 1]; if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (z < bz0) bz0 = z; if (z > bz1) bz1 = z; }
        BREC.bb[bi * 4] = bx0 + ox; BREC.bb[bi * 4 + 1] = bz0 + oz; BREC.bb[bi * 4 + 2] = bx1 + ox; BREC.bb[bi * 4 + 3] = bz1 + oz;
        // ¿vivienda susceptible de fachada de detalle? (ni torres, ni naves, ni volúmenes elevados)
        const Hm = Ht / 10, area = (bx1 - bx0) * (bz1 - bz0);
        BREC.elig[bi] = ((cls === 0 && Hm >= 6 && Hm <= 45) || (cls === 6 && Hm >= 5 && Hm <= 16)) && hb < 15 && area < 16000 && !(Hm < 9 && area > 1800) && rsz[0] >= 3 ? 1 : 0;
      }
      const infBuf = inf.subarray(0, vp * 4);
      const vbInfo = new VB(engine, infBuf, 'uv', true, false, 4, false, 0, 4, VB.SHORT, false);
      const mesh = mkMesh('b' + cx + '_' + cz, pos.subarray(0, vp * 3), idx.subarray(0, ip), matBld,
        [vbuf(col.subarray(0, vp * 4), 'color', 4, VB.UNSIGNED_BYTE, true), vbInfo], cx * CH, cz * CH);
      bldChunks.push({ mesh, x: (cx + 0.5) * CH, z: (cz + 0.5) * CH, ox, oz, inf: infBuf, vbInfo, dirty: false });
      bldTris += ip / 3;
      if ((++done % 12) === 0) { setMsg('Construyendo edificios… ' + bldCount.toLocaleString('es-ES'), 0.45 + 0.5 * done / total); await tick(); }
    }
  }
}

// ------------------------------------------------------------------ etiquetas y barrios
const labels = [];
{
  const box = $('labels');
  const add = (txt, cls, x, y, z) => { const e = document.createElement('div'); e.className = 'lb ' + cls; e.textContent = txt; e.style.display = 'none'; box.appendChild(e); labels.push({ e, k: cls, p: new BABYLON.Vector3(x, y, z), on: false }); };
  for (const b of META.barris) add(b.n, 'b', b.c[0], heightAt(b.c[0], b.c[1]) + 45, b.c[1]);
  for (const d of META.districtes) add(d.n, 'd', d.c[0], heightAt(d.c[0], d.c[1]) + 160, d.c[1]);
  for (const q of META.poi) add(q.n, 'p', q.p[0], q.p[1] + (q.n.indexOf('Torre') >= 0 ? 300 : q.n === 'Sagrada Família' ? 185 : 70), q.p[2]);
  for (const b of META.barris) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const r of b.r) for (const q of r) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < z0) z0 = q[1]; if (q[1] > z1) z1 = q[1]; } b.bb = [x0, z0, x1, z1]; }
}
function barriAt(x, z) {
  for (const b of META.barris) {
    if (x < b.bb[0] || x > b.bb[2] || z < b.bb[1] || z > b.bb[3]) continue;
    for (const r of b.r) { let ins = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const xi = r[i][0], zi = r[i][1], xj = r[j][0], zj = r[j][1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins; } if (ins) return b; }
  }
  return null;
}

// ------------------------------------------------------------------ fachadas de detalle (calidad Transeúnte al acercarse)
setMsg('Preparando fachadas de detalle…', 0.97);
await tick();
let FXS = null;
try {
  FXS = await window.BCN_FACADES({ scene, engine, mkMat, COMMON, VS_COL, heightAt, BREC, bldChunks, RSEG, META, PAL, WX, WZ, blobURL, cam, L, matBld });
} catch (e) { console.warn('Sin fachadas de detalle', e); }

// ------------------------------------------------------------------ cámara y controles
const st = { yaw: 0, pitch: 0.5, walk: false, keys: {}, fly: null, showLabels: true, maxDist: 40000 };
const poi = n => META.poi.find(q => q.n === n).p;
const D2R = Math.PI / 180;
function orbitView(name, dist, azFrom, alt, opt) {
  const t = poi(name), a = azFrom * D2R, x = t[0] + Math.sin(a) * dist, z = t[2] + Math.cos(a) * dist;
  const ty = t[1] + ((opt && opt.ty) || 0);
  return { x, y: alt, z, yaw: Math.atan2(t[0] - x, t[2] - z), pitch: Math.atan2(alt - ty, dist), walk: false };
}
const VIEWS = [
  ['Vista general', orbitView('Plaça de Catalunya', 9500, 138, 3300)],
  ['Eixample · Sagrada Família', orbitView('Sagrada Família', 1050, 165, 470, { ty: 60 })],
  ['Port Vell · Barceloneta', orbitView('Port Vell', 2100, 140, 720)],
  ['Montjuïc y el puerto', orbitView('Castell de Montjuïc', 2600, 95, 640)],
  ['Tibidabo · Torre de Collserola', orbitView('Tibidabo', 2300, 128, 760, { ty: 120 })],
  ['Desde Collserola al mar', (() => { const t = poi('Torre de Collserola'); return { x: t[0] - 900, y: 880, z: t[2] + 700, yaw: 128 * D2R, pitch: 0.2, walk: false }; })()],
  ['Glòries · Diagonal', orbitView('Torre Glòries', 1250, 235, 430, { ty: 70 })],
  ['Camp Nou · Les Corts', orbitView('Camp Nou', 1100, 150, 420)],
  ['Litoral · Port Olímpic', orbitView('Port Olímpic', 1700, 105, 520, { ty: 60 })],
  ['Aeropuerto de El Prat', orbitView('Aeroport · Terminal 1', 4200, 215, 1500)],
];
(META.views || []).forEach((v, i) => VIEWS.splice(2 + i, 0, [v.n, v]));
for (const w of (META.walk || [])) VIEWS.push(['A pie · ' + w.n, { x: w.x, y: 0, z: w.z, yaw: w.yaw, pitch: w.pitch || -0.06, walk: true }]);
function applyView(v) {
  cam.position.set(v.x, v.walk ? heightAt(v.x, v.z) + 1.75 : v.y, v.z); st.yaw = v.yaw; st.pitch = v.pitch; st.walk = !!v.walk; st.fly = null; syncMode();
}
function flyTo(v, dur) {
  const dy = ((v.yaw - st.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  st.fly = { t: 0, dur: dur || 2.2, from: { x: cam.position.x, y: cam.position.y, z: cam.position.z, yaw: st.yaw, pitch: st.pitch }, to: v, dy };
  st.walk = false; syncMode();
}
function syncMode() { $('mDron').classList.toggle('on', !st.walk); $('mPie').classList.toggle('on', st.walk); }
VIEWS.forEach((v, i) => { const b = document.createElement('button'); b.textContent = v[0]; b.onclick = () => { flyTo(v[1]); document.body.classList.remove('menu'); }; $('views').appendChild(b); });
$('mDron').onclick = () => { if (st.walk) { st.walk = false; cam.position.y += 120; st.pitch = 0.35; } syncMode(); };
$('mPie').onclick = () => { st.walk = true; st.fly = null; if (cam.position.x < 0 || cam.position.x > WX || cam.position.z < 0 || cam.position.z > WZ) { const t = poi('Plaça de Catalunya'); cam.position.x = t[0]; cam.position.z = t[2]; } st.pitch = 0; syncMode(); };
$('menuBtn').onclick = () => document.body.classList.toggle('menu');
$('hour').oninput = e => setHour(+e.target.value);
$('dist').oninput = e => { st.maxDist = +e.target.value * 1000; $('distV').textContent = (+e.target.value >= 40 ? 'todo' : e.target.value + ' km'); };
$('distV').textContent = 'todo';
[['fx0', 0], ['fx1', 1], ['fx2', 2]].forEach(([id, q]) => { $(id).onclick = () => { if (FXS) FXS.setRange(q); for (const k of ['fx0', 'fx1', 'fx2']) $(k).classList.toggle('on', k === id); }; });
if (!FXS) $('fxRow').style.display = 'none';
$('tLabels').onclick = e => { st.showLabels = !st.showLabels; e.target.classList.toggle('on', st.showLabels); if (!st.showLabels) for (const l of labels) { l.e.style.display = 'none'; l.on = false; } };
addEventListener('keydown', e => { st.keys[e.code] = true; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) >= 0) e.preventDefault(); });
addEventListener('keyup', e => { st.keys[e.code] = false; });
addEventListener('blur', () => { st.keys = {}; });
let drag = null; const touches = new Map(); let pinch = 0;
canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); touches.set(e.pointerId, [e.clientX, e.clientY]); drag = [e.clientX, e.clientY]; st.fly = null; canvas.focus(); });
canvas.addEventListener('pointermove', e => {
  if (!touches.has(e.pointerId)) return;
  const prev = touches.get(e.pointerId); touches.set(e.pointerId, [e.clientX, e.clientY]);
  if (touches.size === 1) { st.yaw += (e.clientX - prev[0]) * 0.0042; st.pitch = Math.max(-1.45, Math.min(1.5, st.pitch + (e.clientY - prev[1]) * 0.0042)); }
  else if (touches.size === 2) { const a = [...touches.values()], d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); if (pinch) dolly((d - pinch) * 0.012); pinch = d; }
});
const pend = e => { touches.delete(e.pointerId); pinch = 0; };
canvas.addEventListener('pointerup', pend); canvas.addEventListener('pointercancel', pend);
function fwd() { const cp = Math.cos(st.pitch); return [Math.sin(st.yaw) * cp, -Math.sin(st.pitch), Math.cos(st.yaw) * cp]; }
function groundY(x, z) { return (x >= 0 && x <= WX && z >= 0 && z <= WZ) ? heightAt(x, z) : 0; }
function dolly(k) { const f = fwd(), alt = Math.max(20, cam.position.y - groundY(cam.position.x, cam.position.z)), s = k * alt; cam.position.x += f[0] * s; cam.position.y += f[1] * s; cam.position.z += f[2] * s; st.fly = null; }
canvas.addEventListener('wheel', e => { e.preventDefault(); dolly(-Math.sign(e.deltaY) * Math.min(0.5, Math.abs(e.deltaY) / 400 + 0.08)); }, { passive: false });

let hudT = 0, frame = 0;
const proj = new BABYLON.Vector3();
function update(dt) {
  const k = st.keys, P = cam.position;
  if (st.fly) {
    const F = st.fly; F.t = Math.min(1, F.t + dt / F.dur); const s = F.t * F.t * (3 - 2 * F.t), a = F.from, b = F.to;
    const by = b.walk ? heightAt(b.x, b.z) + 1.75 : b.y, arc = Math.sin(Math.PI * s) * Math.min(600, Math.hypot(b.x - a.x, b.z - a.z) * 0.08);
    P.set(a.x + (b.x - a.x) * s, a.y + (by - a.y) * s + arc, a.z + (b.z - a.z) * s); st.yaw = a.yaw + F.dy * s; st.pitch = a.pitch + (b.pitch - a.pitch) * s;
    if (F.t >= 1) { st.fly = null; st.walk = !!b.walk; syncMode(); }
  } else {
    let mx = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0), mz = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0), my = (k.KeyE || k.Space ? 1 : 0) - (k.KeyQ || k.KeyC ? 1 : 0);
    let tx = (k.ArrowRight ? 1 : 0) - (k.ArrowLeft ? 1 : 0), ty = 0, boost = (k.ShiftLeft || k.ShiftRight) ? 4 : 1;
    const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(g => g) : null;
    if (gp) {
      const dz = v => Math.abs(v) > 0.14 ? v : 0;
      mx += dz(gp.axes[0] || 0); mz -= dz(gp.axes[1] || 0); tx += dz(gp.axes[2] || 0) * 1.4; ty += dz(gp.axes[3] || 0) * 1.1;
      my += ((gp.buttons[7] && gp.buttons[7].value) || 0) - ((gp.buttons[6] && gp.buttons[6].value) || 0);
      if (gp.buttons[0] && gp.buttons[0].pressed) boost = 4;
      if (gp.buttons[3] && gp.buttons[3].pressed && !st._tri) { st.walk ? $('mDron').onclick() : $('mPie').onclick(); }
      st._tri = gp.buttons[3] && gp.buttons[3].pressed;
    }
    st.yaw += tx * dt * 1.3; st.pitch = Math.max(-1.45, Math.min(1.5, st.pitch + ty * dt * 1.1));
    const g = groundY(P.x, P.z), alt = Math.max(0, P.y - g);
    const sp = (st.walk ? 6 : Math.min(2500, Math.max(14, alt * 0.9))) * boost * dt;
    const sy = Math.sin(st.yaw), cy = Math.cos(st.yaw);
    if (st.walk) { P.x += (sy * mz + cy * mx) * sp; P.z += (cy * mz - sy * mx) * sp; }
    else { const f = fwd(); P.x += f[0] * mz * sp + cy * mx * sp; P.y += f[1] * mz * sp + my * sp; P.z += f[2] * mz * sp - sy * mx * sp; }
  }
  const g = groundY(P.x, P.z);
  if (st.walk && !st.fly) P.y = g + 1.75; else if (P.y < g + 1.6) P.y = g + 1.6;
  if (P.y > 60000) P.y = 60000;
  cam.rotation.set(st.pitch, st.yaw, 0);
  const alt = P.y - g;
  cam.minZ = Math.max(0.4, Math.min(40, alt * 0.03)); cam.maxZ = 170000;
  sky.position.copyFrom(P);
  for (const m of mats) m.setVector3('uCam', P);
  if (FXS) FXS.update(P, g, dt, frame);
  if (SHOT || (frame & 7) === 0) { const md = st.maxDist + P.y * 1.2, m2 = md * md; for (const c of bldChunks) { const dx = c.x - P.x, dz = c.z - P.z; c.mesh.setEnabled(st.maxDist >= 40000 || dx * dx + dz * dz < m2); } }
  hudT -= dt;
  if (hudT <= 0) {
    hudT = 0.2;
    const inside = P.x >= 0 && P.x <= WX && P.z >= 0 && P.z <= WZ, b = inside ? barriAt(P.x, P.z) : null;
    $('wBarri').textContent = b ? b.n : (inside ? 'Área metropolitana' : 'Fuera del mapa detallado');
    $('wInfo').textContent = (b ? b.d + ' · ' : '') + 'altura ' + Math.round(alt) + ' m · cota ' + Math.round(g) + ' m';
  }
}
function updateLabels() {
  if (!st.showLabels || SHOT) return;
  const P = cam.position, alt = P.y - groundY(P.x, P.z), w = engine.getRenderWidth(), h = engine.getRenderHeight(), sx = canvas.clientWidth / w, sy = canvas.clientHeight / h;
  const tm = scene.getTransformMatrix(), vp = cam.viewport.toGlobal(w, h), id = BABYLON.Matrix.IdentityReadOnly;
  for (const l of labels) {
    const dx = l.p.x - P.x, dz = l.p.z - P.z, d = Math.hypot(dx, dz);
    let show = l.k === 'd' ? (alt > 2000 && d < 40000) : l.k === 'b' ? (alt > 120 && alt < 4200 && d < Math.max(2500, alt * 3.2)) : (d < 11000 && (alt < 2600 || d < 6000));
    if (show) { BABYLON.Vector3.ProjectToRef(l.p, id, tm, vp, proj); show = proj.z > 0 && proj.z < 1 && proj.x > -50 && proj.x < w + 50 && proj.y > 0 && proj.y < h; }
    if (show) { l.e.style.transform = 'translate(' + Math.round(proj.x * sx) + 'px,' + Math.round(proj.y * sy) + 'px) translate(-50%,-50%)'; if (!l.on) { l.e.style.display = 'block'; l.on = true; } }
    else if (l.on) { l.e.style.display = 'none'; l.on = false; }
  }
}

// ------------------------------------------------------------------ arranque
setHour(17);
applyView(VIEWS[0][1]);
const sN = n => (n || 0).toLocaleString('es-ES');
const S_ = META.stats || {};
$('stats').innerHTML = sN(bldCount) + ' volúmenes de edificio<br>' + (FXS ? sN(FXS.nElig) + ' con fachada de detalle<br>' : '') + sN(Math.round(S_.km_viario || 0)) + ' km de viario<br>73 barrios · 10 distritos<br>' +
  sN(Math.round((bldTris + roadTris + (window.BCN.terrTris || 0)) / 1000) / 1000) + ' M de triángulos<br><span style="opacity:.75">© OpenStreetMap · MDT IGN/PNOA · Aj. de Barcelona</span>';
let t0 = performance.now(), time = 0;
scene.onBeforeRenderObservable.add(() => {
  const now = performance.now(), dt = Math.min(0.1, (now - t0) / 1000); t0 = now; time += dt; frame++;
  update(dt);
  matSea.setFloat('uTime', time); matSky.setFloat('uTime', time);
});
scene.onAfterRenderObservable.add(() => { if ((frame & 1) === 0) updateLabels(); });
for (const m of mats) m.setFloat('uTime', 0);
await scene.whenReadyAsync();
engine.runRenderLoop(() => scene.render());
addEventListener('resize', () => engine.resize());
setMsg('¡Listo!', 1);
setTimeout(() => { $('load').style.opacity = 0; setTimeout(() => $('load').remove(), 700); }, 150);
Object.assign(window.BCN, { ready: true, views: VIEWS, applyView, flyTo, setHour, cam, st, scene, engine, heightAt, poi, stats: { bldCount, bldTris, roadTris },
  fx: FXS, detailBusy: () => !!FXS && FXS.busy(), detailStats: () => FXS && FXS.stats(),
  fxFlush: () => { if (!FXS) return; const P = cam.position, g = groundY(P.x, P.z); let n = 0; do { FXS.update(P, g, 0.3, 0); } while (FXS.busy() && ++n < 100000); } });
} catch (e) {
  console.error(e); window.BCN.error = String(e && e.stack || e);
  $('err').textContent = 'No se ha podido cargar la ciudad: ' + (e && e.message || e);
}
})();
