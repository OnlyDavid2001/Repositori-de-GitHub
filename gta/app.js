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
const QS = new URLSearchParams(location.search);
// SALIDA. Camino HDR: los shaders escriben radiancia lineal de rango alto en un búfer intermedio (HalfFloat) y lighting.js
// pone el postproceso (tono fílmico, bloom, antialiasing). Camino LDR (?ldr=1, sin WebGL2, sin render a HalfFloat o si
// lighting.js falta o falla): los shaders llevan «#define LDR» y aplican ellos mismos tono y gamma (ver FRAG en el preludio).
const hdrCapable = () => { try { const g = document.createElement('canvas').getContext('webgl2');
  const ok = !!g && !!(g.getExtension('EXT_color_buffer_float') || g.getExtension('EXT_color_buffer_half_float'));
  const lc = g && g.getExtension('WEBGL_lose_context'); if (lc) lc.loseContext(); return ok; } catch (e) { return false; } };
const OUT = { hdr: QS.get('ldr') !== '1' && !!window.BCN_LIGHTING && hdrCapable(), onLDR: [] };
// lienzo opaco (alpha: false): el alfa que escriben los shaders (la distancia, en el camino HDR) nunca llega a la página.
// El antialiasing del lienzo solo hace falta en el camino LDR (en el HDR lo pone el postproceso)
const engine = new BABYLON.Engine(canvas, !OUT.hdr, { antialias: !OUT.hdr, alpha: false, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: SHOT }, false);
engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 1.5));
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0.62, 0.76, 0.9, 1);
scene.skipPointerMovePicking = true; scene.autoClearDepthAndStencil = true;
const cam = new BABYLON.FreeCamera('cam', new BABYLON.Vector3(WX / 2, 2500, WZ / 2), scene);
cam.inputs.clear(); cam.fov = 0.86; cam.minZ = 2; cam.maxZ = 170000;

// ------------------------------------------------------------------ shaders
// PRELUDIO GLSL. mkMat lo antepone a TODOS los fragment shaders, así que los cuerpos no repiten nada de esto: ni la línea
// «#extension», ni precision, ni los uniformes comunes, ni «varying vec3 vPos», ni las utilidades. A cambio, todo vertex
// shader debe escribir vPos (posición de mundo). Los cuerpos tampoco escriben gl_FragColor: acaban con FRAG(color), que
// aplica la niebla, con FRAG_NOFOG(color) o, en un material con mezcla (opts.blend), con FRAGA(color, opacidad).
// ESPACIOS DE COLOR. Los cuerpos trabajan en «espacio de pantalla» (colores de autor, ajustados a ojo, como se verían con
// exposición neutra). Por dentro, la luz se calcula en LINEAL con rango alto: toLin() = ^2.2 y toScr() = ^(1/2.2).
// CONTRATO DE SOMBREADO (entra y sale espacio de pantalla. El resultado puede pasar de 1: eso es HDR):
//   lit(alb, n)                            luz difusa de sol y cielo, para los shaders sencillos
//   shade(alb, N, V, rough, metal, ao)     difusa + brillo del sol con lóbulo según la rugosidad + reflejo del entorno
//   envRefl(r, rough)                      lo que se refleja en la dirección r: cielo analítico y, bajo el horizonte, la calle
//   emit(col, gain)                        color autoiluminado: gain 1 = se ve como el color de autor. Más de 1 es HDR (hace bloom)
//   sunVis() / sunVisN(n)                  visibilidad del sol (0 en sombra … 1): la sombra proyectada. La calcula una vez por
//                                          fragmento (con la primera normal que se le pase) y la reutiliza. lit y shade ya la aplican
// SOMBRAS DEL SOL: dos cascadas (uShadow0 cerca, uShadow1 lejos) con la profundidad vista desde el sol empaquetada en RGB.
// Las pinta y las mantiene lighting.js, que da valor a los uniformes uSh*. Sin ese módulo uShP vale 0 y sunVis() da 1.
// LUZ LINEAL: uSunL (irradiancia del sol a incidencia normal), uSkyL (cielo, normales hacia arriba) y uGndL (rebote cálido
// del suelo, normales hacia abajo). Unidad: 1 = «un albedo se ve tal cual es». Las calcula setHour a partir de los colores
// de pantalla de siempre (uSunCol, uSkyCol, uGndCol), que siguen ahí para lo que los cuerpos suman a mano.
// SALIDA: FRAG convierte a lineal, aplica la niebla en lineal y escribe RGB = radiancia HDR lineal y A = distancia a la
// cámara en metros (tope 60000, el del cielo). Con «#define LDR» (camino sin postproceso) aplica además tono ACES + gamma y A = 1.
const PRELUDE = `#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec3 uCam; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uGndCol;
uniform vec3 uFogCol; uniform vec3 uZenCol; uniform float uFogD; uniform float uTime; uniform float uDusk; uniform float uNight; uniform float uLate; uniform vec4 uGlow;
// NOCHE: qué se enciende y cuándo (lo fija setHour; vale para todos los shaders).
//   uDusk  0 de día → 1 cuando hay que encender luces: del anochecer al amanecer, TODA la noche (farolas, semáforos, portales).
//   uNight 0 → 1 noche cerrada (cielo negro, estrellas, luna).
//   uLate  0 por la tarde-noche → 1 de madrugada (≈ 0:00–6:00): la ciudad duerme.
//   shopOn()   comercios y rótulos: encendidos al anochecer, apagados de madrugada (queda una luz de vigilancia).
//   homeOn(h)  ¿está encendida esta ventana de piso? h = azar estable por ventana. Muchas al anochecer, casi ninguna de madrugada.
// No se encienden nunca: árboles y parques, cubiertas, el mar y la montaña (solo reciben la luna).
float shopOn(){ return uDusk*(1.0 - 0.94*uLate); }
float homeFrac(){ return mix(0.05 + 0.25*uDusk, 0.05, uLate); }
float homeOn(float h){ return uDusk*step(h, homeFrac()); }
// AURA NOCTURNA de la ciudad: lo que se ve de lejos (desde Collserola o desde el aire) es la trama de calles encendida.
// uGlow = (calzadas, bajos de fachada, halo del cielo, suelo urbano): ganancias que fija setHour, 0 de día.
// kAura: color de las farolas de sodio (ámbar saturado, 2000–2200 K), en espacio de pantalla · kLed: LED blanco cálido-neutro
// (3000–4000 K) de las grandes avenidas · kHaze: la bruma baja que ilumina la ciudad (gris cálido, nunca naranja)
const vec3 kAura = vec3(1.0, 0.60, 0.24);
const vec3 kLed = vec3(1.0, 0.86, 0.68);
const vec3 kHaze = vec3(0.115, 0.105, 0.095);
// BRUMA DE LA CIUDAD (de noche, con uGlow.z): una capa baja (densidad exp(−y/160 m)) solo sobre el llano de Barcelona.
// cityW: 1 sobre la ciudad, 0 fuera (elipse a lo largo de la costa). hazeI: metros de esa capa que atraviesa el rayo
float cityW(vec2 p){ p -= vec2(12300.0, 14300.0);
  vec2 q = vec2(dot(p, vec2(0.61, 0.79))/7000.0, dot(p, vec2(0.79, -0.61))/4200.0); return 1.0 - smoothstep(0.85, 1.3, length(q)); }
float hazeI(vec3 a, vec3 b){ float H = 160.0, ya = max(a.y, 0.0), yb = max(b.y, 0.0), dy = yb - ya, ea = exp(-ya/H), eb = exp(-yb/H);
  return length(b - a)*(abs(dy) > 0.5 ? H*(ea - eb)/dy : ea); }
uniform vec3 uSunL; uniform vec3 uSkyL; uniform vec3 uGndL; uniform vec2 uTone;
// HORIZONTE Y LUNA. uSunH = (x, z de la dirección horizontal hacia el sol de verdad —también de noche, bajo el horizonte—,
// fuerza del resplandor del lado del sol al amanecer y al anochecer, 1 si la luz direccional es la luna) · uHorzC: lo que el
// horizonte del lado del sol tiene de más respecto a uFogCol (espacio de pantalla; puede ser negativo en algún canal)
uniform vec4 uSunH; uniform vec3 uHorzC;
uniform sampler2D uShadow0; uniform sampler2D uShadow1;
uniform vec3 uShX0; uniform vec3 uShY0; uniform vec3 uShX1; uniform vec3 uShY1; uniform vec3 uShZ; uniform vec4 uShC0; uniform vec4 uShC1; uniform vec4 uShP;
varying vec3 vPos;
float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float dith(){ return fract(52.9829189*fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1.0,0.0)),f.x), mix(hash21(i+vec2(0.0,1.0)),hash21(i+vec2(1.0,1.0)),f.x), f.y); }
vec3 toLin(vec3 c){ return pow(max(c, vec3(0.0)), vec3(2.2)); }
vec3 toScr(vec3 c){ return pow(max(c, vec3(0.0)), vec3(0.4545)); }
// SOMBRAS. uShXk, uShYk: ejes X e Y del espacio de luz de la cascada k (su Z, hacia el sol, es X × Y; cada cascada guarda los
// ejes con que se pintó, así con el reloj en marcha se repintan de una en una sin desajuste) · uShZ: Z de la cercana ·
// uShC0, uShC1: centro de cada cascada (mundo) y 1/semilado · uShP: x resolución del mapa, y 1/(rango de profundidad), z filtro (0 sin sombras, 1 = 2x2, 2 = 3x3)
// una muestra: 1 si lo guardado en el mapa (lo más cercano al sol) no tapa la profundidad t
float shTap(sampler2D s, vec2 p, float t){ return step(t, dot(texture2D(s, p).rgb, vec3(1.0, 0.00392156863, 0.0000153787005))); }
// PCF con pesos bilineales (el borde de la sombra se mueve de forma continua, sin escalones de téxel)
float shMap(sampler2D s, vec3 d, vec3 X, vec3 Y, float inv, float t){
  vec2 q = (vec2(dot(d, X), dot(d, Y))*inv*0.5 + 0.5)*uShP.x;
  float px = 1.0/uShP.x;
  if (uShP.z < 1.5) {
    vec2 f2 = fract(q - 0.5), b2 = (floor(q - 0.5) + 0.5)*px;
    return mix(mix(shTap(s, b2, t), shTap(s, b2 + vec2(px, 0.0), t), f2.x),
               mix(shTap(s, b2 + vec2(0.0, px), t), shTap(s, b2 + vec2(px, px), t), f2.x), f2.y);
  }
  vec2 f = fract(q - 1.0), b = (floor(q - 1.0) + 0.5)*px;
  vec3 wx = vec3(1.0 - f.x, 1.0, f.x), r;
  r.x = dot(wx, vec3(shTap(s, b, t), shTap(s, b + vec2(px, 0.0), t), shTap(s, b + vec2(2.0*px, 0.0), t)));
  r.y = dot(wx, vec3(shTap(s, b + vec2(0.0, px), t), shTap(s, b + vec2(px, px), t), shTap(s, b + vec2(2.0*px, px), t)));
  r.z = dot(wx, vec3(shTap(s, b + vec2(0.0, 2.0*px), t), shTap(s, b + vec2(px, 2.0*px), t), shTap(s, b + vec2(2.0*px, 2.0*px), t)));
  return dot(r, vec3(1.0 - f.y, 1.0, f.y))*0.25; }
// una cascada: el punto se separa de la superficie a lo largo de la normal (más cuanto más rasante es la luz: evita el
// acné sin despegar la sombra) y se compara con un pequeño margen. tx = tamaño de un téxel en metros
float shCasc(sampler2D s, vec3 d, vec3 n, float sl, float inv, vec3 X, vec3 Y){
  float tx = 2.0/(inv*uShP.x);
  d += n*(tx*(0.4 + 1.2*sl));
  return shMap(s, d, X, Y, inv, 0.5 - (dot(d, cross(X, Y)) + 0.25*tx + 0.01)*uShP.y); }
float gSunVis = -1.0;
// visibilidad del sol en este fragmento (n = normal de la superficie): multiplica SOLO la luz directa y los brillos del sol
float sunVisN(vec3 n){
  if (gSunVis >= 0.0) return gSunVis;
  gSunVis = 1.0;
  if (uShP.z < 0.5) return 1.0;
  float ndl = dot(n, uShZ);
  if (ndl <= 0.0) { gSunVis = 0.0; return 0.0; }
  float sl = sqrt(max(1.0 - ndl*ndl, 0.0));
  vec3 d0 = vPos - uShC0.xyz, d1 = vPos - uShC1.xyz;
  vec2 a0 = abs(vec2(dot(d0, uShX0), dot(d0, uShY0)))*uShC0.w, a1 = abs(vec2(dot(d1, uShX1), dot(d1, uShY1)))*uShC1.w;
  // peso de cada cascada: 1 dentro, 0 al llegar a su borde. Fuera de la lejana no hay sombra
  float w0 = 1.0 - smoothstep(0.80, 0.95, max(a0.x, a0.y)), w1 = 1.0 - smoothstep(0.80, 0.97, max(a1.x, a1.y));
  float v = 1.0;
  if (w0 < 1.0 && w1 > 0.0) v = mix(1.0, shCasc(uShadow1, d1, n, sl, uShC1.w, uShX1, uShY1), w1);
  if (w0 > 0.0) v = mix(v, shCasc(uShadow0, d0, n, sl, uShC0.w, uShX0, uShY0), w0);
  gSunVis = v;
  return v; }
// sin normal a mano (reflejos del sol en vidrios, asfalto, mar): el punto se separa unos 3 téxeles hacia el sol
float sunVis(){ return sunVisN(uShZ*7.0); }
// DIA: más allá de la cascada lejana no hay mapa de sombras. shOut() = 1 fuera de ella (sin sombras, a partir de 150–400 m) y
// sunTan() = tangente de la altura del sol: con ellas se aproxima la sombra de los «cañones» de calle lejanos (calzadas y
// parte baja de los muros), para que de lejos las calles se lean como surcos en sombra entre manzanas soleadas
float shOut(){ if (uShP.z < 0.5) return smoothstep(150.0, 400.0, length(vPos - uCam));
  vec3 d1 = vPos - uShC1.xyz; vec2 a1 = abs(vec2(dot(d1, uShX1), dot(d1, uShY1)))*uShC1.w; return smoothstep(0.80, 0.97, max(a1.x, a1.y)); }
float sunTan(){ return uSunDir.y/max(length(uSunDir.xz), 1e-3); }
// color del horizonte en la dirección d (el de la niebla): uFogCol, más cálido del lado del sol cuando está bajo y algo más
// frío en el lado contrario. Así amanecer y anochecer no tiñen el horizonte por igual en todas direcciones
float horzW(vec3 d){ float az = dot(normalize(d.xz + vec2(1e-5)), uSunH.xy)*0.5 + 0.5; return az*az*az; }
vec3 horzCol(vec3 d){ if (uSunH.z < 0.001) return uFogCol;
  float w = horzW(d); return uFogCol*(1.0 - 0.18*uSunH.z*(1.0 - w)) + uHorzC*(w*uSunH.z); }
// cielo: degradado horizonte-cenit (el resplandor del sol bajo se queda pegado al horizonte), halo y disco del sol (el disco
// vale mucho más que 1: es lo que hace bloom). De noche, el «sol» es la luna (uSunH.w): disco blanco con mares y halo corto
vec3 skyGrad(vec3 d){ float y = clamp(d.y, 0.0, 1.0);
  vec3 c = mix(uFogCol, uZenCol, pow(y, 0.42));
  if (uSunH.z > 0.001) { float w = horzW(d);
    c = c*(1.0 - 0.18*uSunH.z*(1.0 - w)*(1.0 - y)) + uHorzC*(w*uSunH.z*exp(-y*5.0)) + max(uHorzC, vec3(0.0))*(w*w*uSunH.z*0.25*exp(-y*1.5)); }
  return c; }
vec3 moonCol(vec3 d){ float s = dot(d, uSunDir);
  vec3 c = vec3(0.10, 0.12, 0.16)*(pow(max(s, 0.0), 900.0)*0.9 + pow(max(s, 0.0), 60.0)*0.10);
  if (s > 0.99977) {
    vec3 e1 = normalize(cross(uSunDir, vec3(0.0, 1.0, 0.0))), e2 = cross(e1, uSunDir);
    vec2 p = vec2(dot(d, e1), dot(d, e2))/0.0209;            // radio angular de 1,2 grados (la de verdad, 0,26: se exagera)
    float r = length(p);
    float m = vnoise(p*2.1 + 4.1)*0.6 + vnoise(p*4.7 + 1.3)*0.4;
    float alb = mix(0.58, 1.0, smoothstep(0.40, 0.62, m))*(0.90 + 0.10*vnoise(p*13.0));
    c += vec3(1.0, 0.98, 0.93)*(alb*(0.78 + 0.22*sqrt(max(1.0 - r*r, 0.0)))*1.25*smoothstep(1.0, 0.93, r));
  }
  return c; }
vec3 skyColor(vec3 d){ float s = max(dot(d,uSunDir),0.0);
  return skyGrad(d) + uSunCol*((smoothstep(0.99972, 0.99990, s)*9.0 + pow(s,420.0)*1.6 + pow(s,14.0)*0.22)*(1.0 - uSunH.w)) + moonCol(d)*uSunH.w; }
// luz ambiente hemisférica, lineal: cielo por arriba, rebote del suelo por abajo
vec3 ambL(vec3 n){ return mix(uGndL, uSkyL, n.y*0.5+0.5); }
vec3 lit(vec3 alb, vec3 n){ float ndl = max(dot(n,uSunDir),0.0); return alb*toScr(uSunL*(ndl*sunVisN(n)) + ambL(n)); }
vec3 envRefl(vec3 r, float rough){
  vec3 d = normalize(vec3(r.x, max(r.y, 0.02), r.z));
  float s = max(dot(d,uSunDir),0.0);
  // el disco del sol solo se refleja nítido en lo muy pulido (en lo demás ya lo pone el brillo de shade)
  vec3 c = skyGrad(d) + uSunCol*(pow(s,420.0)*5.0 + pow(s,14.0)*0.20)*(1.0 - smoothstep(0.0, 0.35, rough))*sunVis();
  // por debajo del horizonte se refleja la calle de enfrente, oscura. Con rugosidad el horizonte se difumina
  return mix(uFogCol*vec3(0.62,0.6,0.58), c, smoothstep(-0.02 - rough, 0.22 + rough, r.y)); }
vec3 shade(vec3 alb, vec3 N, vec3 V, float rough, float metal, float ao){
  float ndl = max(dot(N,uSunDir),0.0), ndv = max(dot(N,V),0.0), pol = 1.0 - rough, vis = sunVisN(N);   // pol: lo pulido que está
  vec3 albL = toLin(alb), f0 = mix(vec3(0.04), albL, metal);
  vec3 c = albL*(1.0 - metal)*(uSunL*(ndl*vis) + ambL(N)*ao);
  // brillo del sol: lóbulo de Blinn-Phong normalizado, más estrecho e intenso cuanto más pulido
  float a = max(rough*rough, 0.03), sh = 2.0/(a*a) - 2.0;
  c += uSunL*f0*((sh + 2.0)*0.125*pow(max(dot(N, normalize(uSunDir + V)), 1e-4), sh)*ndl*vis);
  // reflejo del entorno, con Fresnel (más en rasante): los metales siempre, teñido por su color, y lo demás solo si es pulido
  c += toLin(envRefl(reflect(-V, N), rough))*(f0 + (1.0 - f0)*pow(1.0 - ndv, 5.0))*(mix(pol*pol*pol, 1.0, metal)*ao);
  return toScr(c); }
vec3 emit(vec3 col, float gain){ return col*gain; }
// niebla: fogAmt = cuánta (x) y cuánto se mira hacia el sol (y). fog() mezcla en espacio de pantalla (compatibilidad) y
// fogL() en lineal, que es la que usa la salida
vec2 fogAmt(vec3 wp){ vec3 d = wp-uCam; float dist = length(d); float rd = d.y/max(dist,1e-3); float b = 0.0007; float k = rd*b;
  float f = abs(k*dist) > 1e-3 ? (1.0-exp(-dist*k))/k : dist;
  return vec2(clamp(1.0-exp(-uFogD*exp(-max(uCam.y,0.0)*b)*f), 0.0, 1.0), max(dot(d/max(dist,1e-3), uSunDir),0.0)); }
vec3 fog(vec3 c, vec3 wp){ vec2 fa = fogAmt(wp); return mix(c, horzCol(wp - uCam) + uSunCol*pow(fa.y,8.0)*0.10, fa.x); }
vec3 fogL(vec3 cl, vec3 wp){ vec2 fa = fogAmt(wp); cl = mix(cl, toLin(horzCol(wp - uCam) + uSunCol*pow(fa.y,8.0)*0.10), fa.x);
  // de noche: la bruma baja iluminada por la ciudad (se suma: es luz dispersada hacia el ojo)
  if (uGlow.z > 0.001) cl += toLin(kHaze)*(uGlow.z*(1.0 - exp(-1.0e-4*hazeI(uCam, wp)*max(cityW(wp.xz), cityW(mix(uCam.xz, wp.xz, 0.5))))));
  return cl; }
#ifdef LDR
// tono ACES (el mismo ajuste que usa el postproceso de Babylon) + gamma + contraste. uTone = (exposición, contraste)
vec3 toneLDR(vec3 c){ c *= uTone.x;
  c = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777)*c;
  c = (c*(c + 0.0245786) - 0.000090537)/(c*(0.983729*c + 0.4329510) + 0.238081);
  c = clamp(mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602)*c, 0.0, 1.0);
  c = pow(c, vec3(0.4545));
  return mix(c, c*c*(3.0 - 2.0*c), uTone.y - 1.0); }
#define FRAG(c) gl_FragColor = vec4(toneLDR(fogL(toLin(c), vPos)), 1.0)
#define FRAG_NOFOG(c) gl_FragColor = vec4(toneLDR(toLin(c)), 1.0)
#define FRAGA(c, a) gl_FragColor = vec4(toneLDR(fogL(toLin(c), vPos)), a)
#else
#define FRAG(c) gl_FragColor = vec4(min(fogL(toLin(c), vPos), vec3(4000.0)), min(length(vPos - uCam), 60000.0))
#define FRAG_NOFOG(c) gl_FragColor = vec4(min(toLin(c), vec3(4000.0)), 60000.0)
#define FRAGA(c, a) gl_FragColor = vec4(min(fogL(toLin(c), vPos), vec3(4000.0)), a)
#endif
`;
const VS_BASIC = `precision highp float;
attribute vec3 position; uniform mat4 world; uniform mat4 viewProjection; varying vec3 vPos;
void main(){ vec4 wp = world*vec4(position,1.0); vPos = wp.xyz; gl_Position = viewProjection*wp; }`;
const VS_COL = `precision highp float;
attribute vec3 position; attribute vec4 color; attribute vec4 uv; uniform mat4 world; uniform mat4 viewProjection;
varying vec3 vPos; varying vec3 vLoc; varying vec4 vCol; varying vec4 vInfo;
void main(){ vec4 wp = world*vec4(position,1.0); vPos = wp.xyz; vLoc = position; vCol = color; vInfo = uv; gl_Position = viewProjection*wp; }`;
// volúmenes: además, el eje del edificio (uv2 = cos, sin del ángulo de sus muros) para alinear la textura de la cubierta
const VS_BLD = `precision highp float;
attribute vec3 position; attribute vec4 color; attribute vec4 uv; attribute vec2 uv2; uniform mat4 world; uniform mat4 viewProjection;
varying vec3 vPos; varying vec3 vLoc; varying vec4 vCol; varying vec4 vInfo; varying vec2 vAx;
void main(){ vec4 wp = world*vec4(position,1.0); vPos = wp.xyz; vLoc = position; vCol = color; vInfo = uv; vAx = uv2; gl_Position = viewProjection*wp; }`;
const VS_NRM = `precision highp float;
attribute vec3 position; attribute vec3 normal; uniform mat4 world; uniform mat4 viewProjection; varying vec3 vPos; varying vec3 vN;
void main(){ vec4 wp = world*vec4(position,1.0); vPos = wp.xyz; vN = normal; gl_Position = viewProjection*wp; }`;

const FS_BLD = `
varying vec3 vLoc; varying vec4 vCol; varying vec4 vInfo; varying vec2 vAx; uniform vec2 uFx;
uniform sampler2D uStreet; uniform vec4 uStreetR; uniform sampler2D uRoofPal;
void main(){
  vec3 n = normalize(cross(dFdx(vLoc), dFdy(vLoc)));
  vec3 V = uCam - vPos; float dist = length(V); V /= dist;
  if (dot(n, V) < 0.0) n = -n;
  // edificio con fachada de detalle ya construida: la pared simple cede el sitio con un fundido tramado
  if (vInfo.w > 0.5 && abs(n.y) < 0.5 && dith() >= smoothstep(uFx.x, uFx.y, dist)) discard;
  float a255 = floor(vCol.a*255.0 + 0.5); float style = floor(a255/16.0); float seed = (a255 - style*16.0)/15.0;
  vec3 base = vCol.rgb; vec3 glow = vec3(0.0);
  float h = vInfo.x*0.1, Ht = vInfo.y*0.1;
  // el color de fachada y de cubierta viene horneado por edificio (palette.js): el mismo a cualquier distancia y el mismo que
  // usa la fachada de detalle. En las clases con paleta (0, 2 y 6) el índice de cubierta va en los 2 bits bajos de cada canal
  bool palB = style < 0.5 || abs(style-2.0) < 0.5 || abs(style-6.0) < 0.5;
  // de noche, la paleta de colores se acerca al tono medio de siempre, para no mover la noche calibrada
  if (palB) base = mix(base, vec3(0.847, 0.784, 0.706)*(0.75 + 0.25*dot(base, vec3(0.30, 0.59, 0.11))/0.78), 0.6*uNight);
  float fade = 1.0 - smoothstep(260.0, 1100.0, dist);
  if (abs(n.y) < 0.5) {
    float u = vInfo.z*0.1;
    // de lejos (y desde el aire), las ventanas encendidas son chispas: celdas de ventana de ~1 píxel (más grandes cuanto más
    // lejos, en escalones ×2, para no hacer dientes de sierra), encendidas con la misma fracción que los pisos de cerca
    vec3 farG = vec3(0.0);
    if (uDusk > 0.01 && fade < 0.999) {
      float px = max(length(vec2(dFdx(u), dFdy(u))), length(vec2(dFdx(h), dFdy(h))));
      float sc = exp2(clamp(floor(log2(max(px*0.45, 1.0))), 0.0, 4.0));
      vec2 cf = floor(vec2(u/(2.7*sc) + seed*3.7, h/(3.2*sc)));
      float hz = hash21(cf + vec2(seed*17.0, sc*3.1)), hc = fract(hz*53.7);
      // irregular, como en las fotos: manzanas casi a oscuras y otras con muchas luces (azar por celda de ~113 m y por barrio)
      // y lo mismo por edificio. De media, la mitad de homeFrac()
      float kB = hash21(floor(vPos.xz/113.0) + 0.37), kR = vnoise(vPos.xz/700.0);
      float dens = homeFrac()*0.62*(0.10 + 2.1*kB*kB*mix(0.5, 1.5, kR))*(0.25 + 1.5*hash21(vCol.rg*57.1 + seed*9.3));
      float onF = step(hz, dens)*uDusk*step(3.2, h)*step(h, Ht - 1.0);
      // ~55 % cálidas, ~30 % blancas neutras y ~15 % azuladas (LED, televisores)
      vec3 wc = hc < 0.55 ? vec3(1.0, 0.70, 0.40) : (hc < 0.85 ? vec3(0.98, 0.94, 0.86) : vec3(0.72, 0.84, 1.0));
      farG = wc*(onF*mix(0.65, 1.2, fract(hc*7.1)));
    }
    bool glassy = abs(style-3.0) < 0.5 || abs(style-12.0) < 0.5;
    bool plain = abs(style-1.0) < 0.5 || abs(style-4.0) < 0.5 || abs(style-5.0) < 0.5 || abs(style-8.0) < 0.5 || abs(style-11.0) < 0.5 || style > 12.5;
    if (glassy) {
      float fy = fract(h/3.6), fx = fract(u/1.9);
      float mull = max(1.0 - smoothstep(0.05,0.09,fy), 1.0 - smoothstep(0.04,0.08,fx));
      float cell = hash21(vec2(floor(u/1.9), floor(h/3.6)));
      if (uDusk > 0.01) glow = vec3(0.80, 0.90, 1.0)*((1.0 - mull)*step(fract(cell*5.3), 0.45*homeFrac())*uDusk*mix(0.5, 1.0, fade));   // oficinas: pocas plantas encendidas
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
      if (uDusk > 0.01) {                                // de noche: ventanas de pisos encendidas (de lejos, su media) y bajos comerciales
        float hw = fract(cell*9.7 + 0.37);
        float fr = 0.65*homeFrac();                      // de lejos, algo menos que en las fachadas de detalle
        float on = fl < 0.5 ? w*shopOn()*step(0.35, hw)*fade : w*uDusk*step(hw, fr);
        glow = (fl < 0.5 ? vec3(1.0, 0.88, 0.70) : mix(vec3(1.0, 0.70, 0.38), vec3(0.78, 0.88, 1.0), step(0.90, fract(hw*7.3))))*on;
      }
      vec3 glass = mix(vec3(0.11,0.13,0.17), uSkyCol*0.85, 0.25 + 0.35*cell);
      float amt = abs(style-2.0) < 0.5 ? 0.55 : 0.9;
      base = mix(base, glass, mix(0.20, w*amt, fade));
      base *= 1.0 - 0.07*(1.0 - smoothstep(0.02,0.06,fy))*fade*step(0.5, fl);
    } else {
      // grano de revoco: se apaga cuando la celda de ruido baja de unos pocos píxeles (de lejos, ni moiré ni parpadeo)
      float pxw = max(length(vec2(dFdx(u), dFdy(u))), length(vec2(dFdx(h), dFdy(h))));
      base *= 1.0 + 0.08*(vnoise(vec2(u*0.4, h*0.4)) - 0.5)*(1.0 - smoothstep(0.6, 2.5, pxw));
    }
    glow = mix(farG, glow, fade);
    base *= mix(0.74, 1.0, smoothstep(-2.0, 8.0, h));
    base *= 1.0 - 0.10*smoothstep(Ht-0.9, Ht-0.5, h);
    // aura nocturna: las farolas bañan la parte baja de los muros (cae con la altura). Las cubiertas quedan oscuras
    // Solo los muros que dan a una calle (máscara de calles, 3 m por delante del muro): los patios de manzana quedan a oscuras
    if (uGlow.y > 0.001) glow += kAura*base*(exp(-max(h, 0.0)/6.0)*uGlow.y*mix(0.08, 1.0, texture2D(uStreet, (vPos.xz + normalize(n.xz + vec2(1e-4))*3.0 - uStreetR.xy)*uStreetR.zw).r)*mix(0.45, 1.0, smoothstep(90.0, 380.0, dist))*(1.0 - 0.8*smoothstep(200.0, 380.0, vPos.y)));
  } else {
    // CUBIERTA: una por edificio, de un material y un color (palette.js), con su textura fina ALINEADA con los muros del
    // propio edificio (vAx = su eje) y en metros de la propia cubierta: ni costuras por triángulo ni cambios de tono. Toda la
    // textura tiene media cero y se apaga cuando su motivo baja de ~2 píxeles, así que de lejos queda exactamente el color
    // de la tabla: el mismo a cualquier distancia
    vec3 roof; float rt = -1.0;
    float r = hash21(vCol.rg*91.7 + seed);
    if (palB) {
      vec3 c8 = floor(vCol.rgb*255.0 + 0.5);
      float ri = mod(c8.r, 4.0) + 4.0*mod(c8.g, 4.0) + 16.0*mod(c8.b, 4.0);
      vec3 rD = texture2D(uRoofPal, vec2((ri + 0.5)/64.0, 0.5)).rgb;
      rt = floor(ri/16.0);
      vec3 rN = abs(style-2.0) < 0.5 ? mix(vec3(0.60,0.50,0.42), vec3(0.52,0.50,0.48), r) : abs(style-6.0) < 0.5 ? mix(vec3(0.72,0.44,0.32), vec3(0.64,0.40,0.30), r) :
                mix(mix(vec3(0.66,0.47,0.38), vec3(0.70,0.62,0.54), r), vec3(0.56,0.55,0.54), step(0.72, r));
      roof = mix(rD, rN, uNight);
      if (rt < 0.5 && mod(ri, 16.0) > 7.5) rt = 4.0;          // baldosa clara (losas más grandes que la rasilla)
    }
    else if (abs(style-1.0) < 0.5) { roof = mix(vec3(0.62,0.64,0.67), vec3(0.72,0.71,0.68), r); rt = 2.0; }
    else if (abs(style-3.0) < 0.5) roof = vec3(0.46,0.48,0.52);
    else if (abs(style-9.0) < 0.5) { roof = vec3(0.76,0.76,0.77); rt = 2.0; }
    else if (abs(style-10.0) < 0.5) { roof = vec3(0.80,0.82,0.84); rt = 2.0; }
    else { roof = base*0.95; rt = 3.0; }
    vec2 ax = vAx/max(length(vAx), 1e-3);
    vec2 q = vec2(dot(vLoc.xz, ax), dot(vLoc.xz, vec2(-ax.y, ax.x))) + seed*vec2(37.0, 53.0);   // metros, en ejes del edificio
    // metros por píxel: el eje más estirado del píxel (no length(fwidth), que suma |dx|+|dy| de los dos ejes y lo exagera
    // ×1,4–2: con él la textura se apagaba ya a 60 m y las cubiertas cercanas salían lisas)
    float pw = max(max(length(dFdx(q)), length(dFdy(q))), 1e-4);
    float tx = 0.0;                                           // relieve de la textura (media cero)
    if (rt > -0.5) {
      if (rt < 0.5 || rt > 3.5) {
        // rasilla (28 × 14 cm, a soga) o baldosa clara (40 cm): juntas claras y algo de tono por pieza
        vec2 sz = rt < 0.5 ? vec2(0.28, 0.14) : vec2(0.40, 0.40);
        vec2 g = q/sz; g.x += 0.5*step(1.0, mod(floor(g.y), 2.0));
        vec2 f = abs(fract(g) - 0.5)*sz;                       // distancia al centro de la pieza (m)
        float jw = 0.012, lj = 1.0 - smoothstep(-0.5, 0.5, (min(sz.x*0.5 - f.x, sz.y*0.5 - f.y) - jw)/max(pw, 1e-4));
        float jf = 2.0*jw*(1.0/sz.x + 1.0/sz.y);               // fracción media de junta
        float fs = 1.0 - smoothstep(0.45, 0.9, pw/sz.y);
        tx = (0.10*(hash21(floor(g) + seed*7.0) - 0.5) + 0.22*(lj - jf))*fs;
      } else if (rt < 1.5) {
        // teja árabe: canales de 22 cm a lo largo del eje y cursos de 40 cm (borde de cada teja, en sombra)
        float cu = q.x/0.22, co = q.y/0.40 + 0.5*step(1.0, mod(floor(cu), 2.0));
        float fs = 1.0 - smoothstep(0.45, 0.9, pw/0.22);
        float sh = sin(6.2832*cu)*0.16, cv = (smoothstep(0.80, 0.95, fract(co)) - 0.15)*-0.16;
        tx = (sh + cv + 0.12*(hash21(vec2(floor(cu), floor(co)) + seed*5.0) - 0.5))*fs;
      } else if (rt < 2.5) {
        // tela asfáltica: rollos de 1 m solapados (junta clara) y algún tono distinto por rollo
        float rl = q.y/1.0, fr = fract(rl);
        float fs = 1.0 - smoothstep(0.45, 0.9, pw/0.5);
        tx = ((smoothstep(0.90, 0.94, fr) - smoothstep(0.97, 1.0, fr) - 0.045)*0.20 + 0.07*(hash21(vec2(floor(rl), seed*3.0)) - 0.5))*fs;
      } else {
        // grava
        float fs = 1.0 - smoothstep(0.45, 0.9, pw/0.12);
        tx = 0.22*(vnoise(q*9.0) - 0.5)*fs + 0.10*(vnoise(q*2.3 + 7.0) - 0.5)*(1.0 - smoothstep(0.45, 0.9, pw/0.6));
      }
      // manchas de uso y de humedad (escala de metros), también de media cero
      tx += 0.07*(vnoise(q*0.21) - 0.5)*(1.0 - smoothstep(0.4, 0.8, pw/3.0));
      // REV: rodales de piezas cambiadas, sol y humedad (de 0,6 a 2 m): el «granulado» que se ve de cerca a 50–150 m, cuando la
      // pieza ya no se resuelve. También de media cero y apagado con el píxel: de lejos, el color de la tabla
      float rk = hash21(floor(q/vec2(1.1, 0.9)) + seed*3.0) - 0.5;
      tx += (0.10*(vnoise(q*0.95) - 0.5) + 0.09*rk)*(1.0 - smoothstep(0.3, 0.6, pw/0.9))
          + 0.10*(vnoise(q*0.42 + 3.0) - 0.5)*(1.0 - smoothstep(0.35, 0.7, pw/1.6));
      // FIX2: zonas de reparación (paños de 3–4 m relosados, más claros o más oscuros) y cercos de humedad de 6–10 m, que
      // todavía se leen desde una azotea vecina o desde el aire bajo (100–200 m); de media cero y apagados con el píxel
      vec2 zq = q/vec2(3.7, 3.1); zq.x += 0.5*step(1.0, mod(floor(zq.y), 2.0));
      float zk = hash21(floor(zq) + seed*11.0);
      tx += (0.09*(step(0.72, zk) - 0.28) - 0.07*(step(zk, 0.12) - 0.12))*(1.0 - smoothstep(0.3, 0.6, pw/3.4))
          + 0.11*(vnoise(q*0.13 + seed*5.0) - 0.5)*(1.0 - smoothstep(0.35, 0.7, pw/7.0));
    }
    base = roof*(1.0 + tx*(1.0 - 0.7*uNight));
    // de noche las cubiertas son masas oscuras: la grava y la tela asfáltica claras no deben brillar bajo la luna
    base *= 1.0 - 0.55*uNight;
  }
  // de noche, los volúmenes lejanos son masas oscuras: solo se ve lo que emite (ventanas, bajos bañados por las farolas)
  // DIA: de lejos (sin mapa de sombras) la parte baja de los muros queda en la sombra de la acera de enfrente: calle de
  // ~20 m entre edificios de ~20 m. Sol de 32° (8:30): sombra hasta ~6 m; a mediodía, nada. De noche no se aplica
  if (abs(n.y) < 0.5) { float hs = clamp(19.0 - 14.0*sunTan(), 0.0, 19.0), so = shOut()*(1.0 - uNight);
    if (so > 0.001) gSunVis = sunVisN(n)*mix(1.0, smoothstep(hs - 1.5, hs + 1.5, h), so); }
  vec3 c = lit(base, n)*(1.0 - 0.6*uNight);
  c += emit(glow, 0.8);
  FRAG(c);
}`;

const FS_TER = `
uniform sampler2D groundTex; uniform sampler2D normTex; uniform vec2 uSize; uniform vec2 uGrid; uniform float uCell;
uniform sampler2D uStreet; uniform vec4 uStreetR; uniform sampler2D uShore;
// trama de copas (0–1) según el tamaño del píxel px: de cerca copas de ~3–9 m, a media distancia rodales de ~28 m y de lejos
// (NAT2) bosquetes de 45–90 m, que siguen dando volumen hasta varios km sin centellear; muy lejos, nada
float canopyW(vec2 q, float px){
  float w = mix(vnoise(q*0.035 + 3.1), vnoise(q*0.11)*0.6 + vnoise(q*0.37)*0.4, 1.0 - smoothstep(3.0, 12.0, px));
  float wf = vnoise(q*0.011 + 7.3)*0.7 + vnoise(q*0.022 + 1.7)*0.3;
  w = mix(w, wf, smoothstep(14.0, 45.0, px));
  return mix(w, 0.5, smoothstep(110.0, 300.0, px));
}
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
  // DIA: el bosque de Collserola y los pinos son verde oscuro y apagado (oliva), con textura de copas; los parques del
  // llano, verde medio (la mitad del cambio). De noche, como antes
  { float vg = clamp((alb.g - max(alb.r, alb.b))*9.0, 0.0, 1.0)*(1.0 - uNight), mt = smoothstep(60.0, 200.0, vPos.y);
    float px = length(fwidth(vPos.xz));
    float cw = canopyW(vPos.xz, px);
    float l = dot(alb, vec3(0.30, 0.60, 0.10));
    vec3 ol = l*mix(vec3(0.90, 1.0, 0.68), vec3(0.86, 1.0, 0.68), mt)*mix(1.05, 1.06, mt)*mix(1.0, mix(0.55 + 0.9*cw, 0.58 + 0.84*cw, smoothstep(14.0, 45.0, px)), mix(0.5, 1.0, mt));
    alb = mix(alb, ol, vg*mix(0.55, 1.0, mt));
    // NAT: relieve de copas. La misma trama de claros y oscuros (cw) se usa como altura de las copas (~6 m) y tuerce la
    // normal: las copas se leen como bultos con su lado al sol y su lado en sombra. Se apaga donde la trama ya no se
    // resuelve (píxel grande), así que de lejos no centellea
    float kv = vg*(1.0 - smoothstep(110.0, 300.0, px));
    if (kv > 0.001) {
      float e = clamp(px*0.7, 1.5, 30.0);
      vec2 q = vPos.xz;
      float fs = 1.0 - smoothstep(3.0, 12.0, px);
      float cx = canopyW(q + vec2(e, 0.0), px), cz = canopyW(q + vec2(0.0, e), px), c0 = cw;
      float A = mix(mix(9.0, 5.0, fs), 22.0, smoothstep(14.0, 45.0, px));
      n = normalize(n + vec3(-(cx - c0), 0.0, -(cz - c0))*(A/e)*kv);
    } }
  // NAT: arena de playa. La ortofoto pinta las playas de un crema liso: de cerca, grano fino, ondulaciones del viento,
  // pasadas del rastrillo de limpieza y huellas; junto al agua, franja mojada más oscura y con brillo. Cada escala se apaga
  // cuando el píxel ya no la resuelve (sin moiré de lejos)
  // la ortofoto acaba la playa antes que el relieve: entre su línea de costa y el agua de verdad (y = 0) queda una franja
  // pintada del color del mar. Si hay arena a menos de ~25 m, esa franja es arena mojada
  vec3 g0 = texture2D(groundTex, uv).rgb;
  vec3 SAND = vec3(0.882, 0.827, 0.655), SEA = vec3(0.588, 0.592, 0.420);
  float sandC = 1.0 - smoothstep(0.035, 0.09, length(g0 - SAND)), seaC = 1.0 - smoothstep(0.02, 0.07, length(g0 - SEA));
  float sandM = sandC, wet = 0.0, rough = 0.95;
  // NAT2: distancia a la línea de agua (m, + en tierra) de la máscara de costa: la franja mojada va por distancia, continua
  float sd = (texture2D(uShore, uv).r - 0.5)*80.0;
  float sandish = smoothstep(0.07, 0.13, g0.r - g0.b)*step(g0.b, g0.g + 0.02);
  if ((sandC + seaC > 0.01 || (sd < 30.0 && sandish > 0.01)) && vPos.y > -2.0) {
    vec2 q = vPos.xz; float px = length(fwidth(q));
    float sandN = 0.0, seaN = 0.0;
    for (int k = 0; k < 8; k++) {
      float a = float(k)*0.7854; vec2 dd = vec2(cos(a), sin(a))/uSize;
      sandN = max(sandN, 1.0 - smoothstep(0.035, 0.09, length(texture2D(groundTex, uv + dd*24.0).rgb - SAND)));
      sandN = max(sandN, 1.0 - smoothstep(0.035, 0.09, length(texture2D(groundTex, uv + dd*12.0).rgb - SAND)));
      seaN = max(seaN, 1.0 - smoothstep(0.02, 0.07, length(texture2D(groundTex, uv + dd*10.0).rgb - SEA)));
    }
    sandM = max(sandC, seaC*max(sandN, 0.85)*(1.0 - smoothstep(2.0, 3.5, vPos.y)));
    // la arena que la ortofoto pinta a manchas junto al agua (mojada, algas, sombras) también es playa: todo lo de tono
    // arena a menos de ~25 m del agua y con arena cerca. Las escolleras (grises) no
    sandM = max(sandM, sandish*sandN*(1.0 - smoothstep(18.0, 30.0, sd))*smoothstep(-1.5, 0.0, sd));
    // franja mojada: una banda estrecha y continua junto a la línea de agua (3–7 m, con el ancho que cambia despacio) y,
    // pegada al agua, la línea más oscura y brillante de la última ola. La espuma va en el mar (FS_SEA), en la misma línea
    float wn = vnoise(q*0.045)*0.7 + vnoise(q*0.19)*0.3;
    float ww = 3.5 + 5.0*wn;
    wet = max(0.8*(1.0 - smoothstep(ww*0.5, ww, sd)), 1.0 - smoothstep(0.4, 1.6, sd + 0.6*(vnoise(q*0.5) - 0.5)));
  }
  if (sandM > 0.001) {
    vec2 q = vPos.xz; float px = length(fwidth(q));
    vec3 sa = mix(vec3(0.80, 0.71, 0.55), vec3(0.86, 0.78, 0.62), vnoise(q*0.03));
    sa *= 0.93 + 0.1*vnoise(q*0.21) + 0.05*vnoise(q*1.3);
    float g1 = 1.0 - smoothstep(0.004, 0.016, px), g2 = 1.0 - smoothstep(0.08, 0.30, px), g3 = 1.0 - smoothstep(0.25, 0.9, px);
    sa *= mix(1.0, 0.86 + 0.28*hash21(floor(q*60.0)), g1*0.6);
    sa *= mix(1.0, 0.95 + 0.1*vnoise(q*11.0), g2);
    // ondulaciones del viento y pasadas del rastrillo (en franjas, con dirección que cambia poco a poco)
    float an = vnoise(q*0.012)*6.2832, ca = cos(an), sn = sin(an);
    float w1 = dot(q, vec2(ca, sn)) + 1.5*vnoise(q*0.4);
    float rip = sin(w1*10.5);
    float rk = smoothstep(0.45, 0.6, vnoise(q*0.045 + 7.0))*(1.0 - wet);
    float w2 = dot(q, vec2(-sn, ca));
    float rake = sin(w2*25.1)*smoothstep(0.1, 0.4, abs(sin(w2*0.785)));
    vec2 gdir = vec2(ca, sn)*rip*0.22*g3*(1.0 - rk)*(1.0 - wet) + vec2(-sn, ca)*rake*0.30*g2*rk;
    sa *= 1.0 + 0.06*rip*g3*(1.0 - rk) + 0.08*rake*g2*rk;
    // huellas: hoyos ovalados sueltos
    vec2 fc = floor(q/0.8), ff = fract(q/0.8) - 0.5; float fh = hash21(fc);
    float foot = step(0.86, fh)*(1.0 - smoothstep(0.12, 0.2, length(ff*vec2(1.0, 0.55) + (vec2(hash21(fc + 3.1), hash21(fc + 7.7)) - 0.5)*0.3)))*g2*(1.0 - wet);
    sa *= 1.0 - 0.10*foot;
    // franja mojada: más oscura y con brillo de agua
    sa = mix(sa, sa*vec3(0.60, 0.59, 0.60), wet);
    rough = mix(0.95, 0.45, wet);
    alb = mix(alb, sa, sandM);
    n = normalize(n + vec3(gdir.x, 0.0, gdir.y)*sandM);
  }
  // NAT: campos del delta y del Baix Llobregat. La ortofoto los pinta de un oliva liso: mosaico de parcelas (cada una con
  // su tono y su cultivo) y, de cerca, surcos. De lejos solo queda el mosaico (los surcos se apagan con el píxel)
  float farmK = 0.0;
  { vec3 a0 = texture2D(groundTex, uv).rgb;
    float farm = step(0.53, a0.r)*(1.0 - smoothstep(0.72, 0.78, a0.r))*(1.0 - smoothstep(0.04, 0.07, abs(a0.r - a0.g)))*smoothstep(0.12, 0.16, a0.r - a0.b)*(1.0 - sandM)*(1.0 - seaC)*(1.0 - smoothstep(30.0, 60.0, vPos.y)); farmK = farm;
    if (farm > 0.01) {
      vec2 q = vPos.xz; float px = length(fwidth(q));
      // NAT2: la misma parcelación que usa nature.js para poner cañas y matas en las lindes (franjas de 70 m giradas
      // 0,62 rad y parcelas de 95 m desplazadas por franja). Lindes: acequia y ribazo oscuros, visibles desde el aire
      float fu0 = dot(q, vec2(0.81388, 0.58104)), fv0 = dot(q, vec2(-0.58104, 0.81388));
      float row = floor(fv0/70.0), su = fu0 + fract(row*0.618034)*95.0, col = floor(su/95.0);
      float fu = su - col*95.0, fv = fv0 - row*70.0, fe = min(min(fu, 95.0 - fu), min(fv, 70.0 - fv));
      vec2 fc = vec2(col, row);
      float h = hash21(fc), h2 = hash21(fc + 17.3);
      vec3 tone = h < 0.18 ? vec3(1.14, 1.0, 0.78) : mix(vec3(0.80, 0.97, 0.74), vec3(1.08, 1.03, 0.82), h);
      tone *= mix(0.80, 1.14, h2);
      float a = h2*3.1416, st = sin(dot(q, vec2(cos(a), sin(a)))*4.2);
      float lind = (1.0 - smoothstep(1.0, 2.8 + 0.6*vnoise(q*0.2), fe))*(1.0 - smoothstep(5.0, 14.0, px));
      alb = mix(alb, alb*tone*(1.0 + 0.10*st*(1.0 - smoothstep(0.25, 1.0, px))), farm);
      alb = mix(alb, alb*vec3(0.62, 0.70, 0.52), lind*farm*0.85);
    } }
  // la ortofoto es de día: lo muy claro (hormigón del puerto, explanadas) lleva el sol «pintado». De noche se apaga algo
  alb *= 1.0 - 0.45*uNight*smoothstep(0.30, 0.75, max(alb.r, max(alb.g, alb.b)));
  // REV: de día, el hormigón casi blanco de la ortofoto (explanadas, pistas, plazas duras) salía quemado a pie: rodilla suave
  // sobre lo muy claro (la arena ya trae su propio color y no se toca)
  // FIX2: la rodilla de REV (−22 % como mucho) apenas se notaba: ahora, de día, todo lo que pasa de 0,40 se comprime a
  // pendiente 0,35 (0,70 → 0,51; 0,85 → 0,56). Igual a cualquier distancia (no cambia el color al acercarse); de noche no
  // se aplica, para no mover la noche calibrada
  { float am = max(alb.r, max(alb.g, alb.b)), ak = am > 0.40 ? (0.40 + 0.35*(am - 0.40))/am : 1.0;
    alb *= mix(1.0, ak, (1.0 - sandM)*(1.0 - farmK)*(1.0 - uNight)); }
  vec3 c = lit(alb, n);
  if (sandM*wet > 0.001) c = mix(c, shade(alb, n, normalize(uCam - vPos), rough, 0.0, 1.0), sandM*wet*0.22);
  // NAT2: espuma de la última ola sobre la propia arena, en la línea de agua (el relieve tapa el borde del mar: así la espuma
  // de FS_SEA y la de aquí se tocan siempre). Mismo ruido animado que en FS_SEA
  if (sandM > 0.001 && sd < 3.0) {
    vec2 q = vPos.xz; float px = length(fwidth(q));
    float br = vnoise(q*0.09 + vec2(uTime*0.2, -uTime*0.08))*0.6 + vnoise(q*0.35 - vec2(uTime*0.3, uTime*0.1))*0.4;
    float fo = (1.0 - smoothstep(0.2, 0.9 + 1.1*br, sd))*smoothstep(0.3, 0.7, br + 0.15)*sandM;
    c = mix(c, vec3(0.93, 0.95, 0.96)*(uSunCol*0.6 + uSkyCol)*(1.0 - 0.55*uNight), fo*0.75);
  }
  c *= 1.0 - 0.55*uNight;                           // de noche, montaña, parques y patios casi negros
  // aura nocturna: el suelo urbano (aceras, plazas) coge algo de la luz de las calles. Ni el verde ni el monte
  if (uGlow.w > 0.001) c += emit(kAura*alb, (1.0 - veg)*(1.0 - smoothstep(200.0, 380.0, vPos.y))*uGlow.w*mix(0.15, 1.0, texture2D(uStreet, (vPos.xz - uStreetR.xy)*uStreetR.zw).r));
  FRAG(c);
}`;

const FS_OUT = `
varying vec3 vN; uniform sampler2D outTex; uniform float uUseTex; uniform vec4 uOutRect;
void main(){
  vec3 n = normalize(vN); float slope = 1.0 - n.y; float h = vPos.y;
  float nz = vnoise(vPos.xz*0.0016)*0.6 + vnoise(vPos.xz*0.007)*0.4;
  vec3 low = mix(vec3(0.63,0.61,0.50), vec3(0.50,0.57,0.40), nz);
  vec3 forest = mix(mix(vec3(0.25,0.29,0.17), vec3(0.32,0.34,0.20), nz), mix(vec3(0.22,0.36,0.22), vec3(0.31,0.43,0.27), nz), uNight);   // DIA: oliva oscuro
  float f = clamp(smoothstep(0.015,0.09,slope) + smoothstep(110.0,300.0,h), 0.0, 1.0);
  vec3 alb = mix(low, forest, f);
  alb = mix(alb, vec3(0.56,0.53,0.49), smoothstep(0.30,0.55,slope));
  if (uUseTex > 0.5) {
    vec2 uv = (vPos.xz - uOutRect.xy)/uOutRect.zw;
    vec4 t = texture2D(outTex, uv);
    alb = t.rgb*(0.92 + 0.16*nz);
  }
  vec3 c = lit(alb, n)*(1.0 - 0.55*uNight);
  FRAG(c);
}`;

// El detalle cercano del asfalto (cuerpo del «if (near > 0.0 && car)») lo aporta ground.js: BCN_GROUND.roadGLSL, que
// documenta sus variables de entrada y salida. Sin ese módulo, la calzada se queda con el color liso.
const ROAD_NEAR = (window.BCN_GROUND && window.BCN_GROUND.roadGLSL) || '';
const FS_ROAD = `
varying vec4 vCol; varying vec4 vInfo;
uniform sampler2D tAsD; uniform sampler2D tAsN; uniform vec2 uOrg; uniform float uAsph;
void main(){
  float cls = floor(vCol.a*255.0 + 0.5);
  vec2 P = vPos.xz - uOrg;                         // origen cercano a la cámara: precisión para texturas
  vec3 alb = vCol.rgb*(0.90 + 0.2*vnoise(P*0.6));
  float dist = length(vPos - uCam);
  float fade = 1.0 - smoothstep(250.0, 1400.0, dist);
  float au = abs(vInfo.x), v = vInfo.y, hw = max(vInfo.z, 0.5), mk = 0.0;
  float x = vInfo.x*hw;                            // metros desde el eje
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
  vec3 N = vec3(0.0, 1.0, 0.0);
  float near = (1.0 - smoothstep(140.0, 480.0, dist))*uAsph;
  bool car = cls < 6.5 || abs(cls-8.0) < 0.5 || abs(cls-10.0) < 0.5 || abs(cls-11.0) < 0.5;
  if (near > 0.0 && car) {` + ROAD_NEAR + `  }
  alb = mix(alb, vec3(0.86,0.86,0.82), mk*fade*0.8);
  // DIA: de lejos no hay mapa de sombras: fracción de calzada al sol en un cañón de calle (edificios de ~20 m, aceras de 5 m),
  // para que las calles se lean como surcos en sombra entre manzanas soleadas. Solo en el llano y nunca de noche
  { float so = shOut()*(1.0 - uNight)*(1.0 - smoothstep(150.0, 300.0, vPos.y));
    if (so > 0.001 && car) gSunVis = sunVisN(N)*mix(1.0, clamp(1.0 - 13.0/(max(sunTan(), 0.05)*(2.0*hw + 10.0)), 0.10, 1.0), so); }
  vec3 c = lit(alb, N);
  c += uSunCol*0.05*pow(max(dot(reflect(-uSunDir, N), normalize(uCam - vPos)), 0.0), 24.0)*near*sunVis();
  // aura nocturna: la calzada bajo las farolas. Un charco cada 24 m alternando de acera, donde furniture.js planta los postes
  // (along(24, 5)). De lejos, su valor medio (no parpadea) y muy cerca más suave: ahí ya están los charcos del mobiliario
  if (uGlow.x > 0.001 && (car || abs(cls-6.0) < 0.5)) {
    // De lejos se ven CADENAS DE PUNTOS (la cabeza de cada farola y su charco), no tubos continuos: el charco es una
    // gaussiana a lo largo que se ensancha con el tamaño del píxel conservando su energía (sin dientes de sierra), y solo
    // cuando la separación entre farolas baja de ~2 píxeles se funde en su valor medio
    float px = max(length(vec2(dFdx(v), dFdy(v))), 0.02);
    float nL = floor((v - 5.0)/24.0 + 0.5), dv = v - 5.0 - nL*24.0;
    float dxl = x - (mod(nL, 2.0) < 0.5 ? -0.7 : 0.7)*hw;
    float sa = max(5.5, 0.8*px), cr = mix(exp(-dxl*dxl/(2.0*hw*hw + 32.0)), 0.75, smoothstep(0.5*hw, 2.0*hw, px));
    float gI = mix(0.06 + 2.0*exp(-0.5*dv*dv/(sa*sa))*(5.5/sa)*cr, 0.95, smoothstep(9.0, 16.0, px));
    gI *= mix(0.30, 1.0, smoothstep(50.0, 240.0, dist));
    // la cabeza de la farola: un punto brillante de ~1 píxel (sin conservar energía: se lee como una chispa, como en las fotos)
    float sp = max(0.45, 0.55*px);
    float head = exp(-0.5*(dv*dv + dxl*dxl)/(sp*sp))*smoothstep(120.0, 400.0, dist)*(1.0 - smoothstep(12.0, 26.0, px));
    // las avenidas anchas (semiancho 9–12 m o más) y las vías principales, LED más blanco y más luz; las calles, sodio
    float ave = smoothstep(8.0, 12.0, hw);
    vec3 lc = mix(kAura, kLed, ave);
    float k = mix(0.75, 1.75, smoothstep(3.5, 12.0, hw))*(cls < 3.5 ? 1.2 : 1.0)*(1.0 - 0.85*smoothstep(200.0, 380.0, vPos.y));
    c += emit(lc*(alb*2.2 + 0.10), gI*k*uGlow.x);
    c += emit(mix(lc, vec3(1.0, 0.92, 0.80), 0.35), head*1.6*mix(1.0, 1.4, ave)*uGlow.x);
  }
  FRAG(c);
}`;

const FS_QUAY = `
void main(){
  vec3 alb = mix(vec3(0.25,0.26,0.25), vec3(0.62,0.60,0.56), smoothstep(-0.2, 1.4, vPos.y));
  alb *= 0.9 + 0.2*vnoise(vPos.xz*0.3 + vPos.y);
  alb *= 1.0 - 0.40*uNight*smoothstep(0.30, 0.60, alb.g);   // de noche, el hormigón claro no brilla bajo la luna
  vec3 c = lit(alb, vec3(0.0, 1.0, 0.0))*0.8;
  FRAG(c);
}`;

const FS_SEA = `
uniform sampler2D coastTex; uniform vec2 uSize; uniform sampler2D uShore; uniform sampler2D groundTex;
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
  // DIA: de día el Mediterráneo es azul intenso y saturado (fotos: (58, 142, 185) cerca); de noche, el de siempre
  vec3 deep = mix(vec3(0.030,0.200,0.420), vec3(0.020,0.115,0.230), uNight), shallow = mix(vec3(0.080,0.400,0.500), vec3(0.070,0.330,0.400), uNight);
  vec3 water = mix(shallow, deep, smoothstep(0.0, 0.5, cd));
  water *= (uSkyCol*1.2 + uSunCol*0.35*max(uSunDir.y,0.0));
  float fres = 0.02 + 0.98*pow(1.0 - max(dot(n,V),0.0), 5.0);
  vec3 r = reflect(-V, n); r.y = abs(r.y);
  vec3 sky = skyGrad(r);
  vec3 c = mix(water, sky, fres*mix(0.62, 0.9, uNight));
  float sp = pow(max(dot(r,uSunDir),0.0), mix(260.0, 40.0, rough));
  // el brillo del sol en el agua, muy por encima de 1 (HDR): es lo que florece
  c += uSunCol*sp*mix(7.0, 0.35, rough)*sunVis();
  // NAT: orilla. Agua somera clara sobre la arena y espuma suave: una línea pegada a la arena y dos o tres frentes de ola
  // que llegan a la playa, rotos por ruido (nada de bandas rectas). Se apaga con el tamaño del píxel (sin moiré de lejos)
  float sh = (1.0 - smoothstep(0.0, 0.05, cd))*inside;
  c = mix(c, mix(vec3(0.20, 0.42, 0.40), vec3(0.06, 0.12, 0.13), uNight)*(uSkyCol*1.2 + uSunCol*0.35*max(uSunDir.y, 0.0)), sh*0.45*(1.0 - fres));
  float br = vnoise(p*0.09 + vec2(t*0.2, -t*0.08))*0.6 + vnoise(p*0.35 - vec2(t*0.3, t*0.1))*0.4;
  // NAT2: la espuma va por la máscara de costa (distancia a la línea de agua del relieve, la misma que la arena mojada):
  // una línea pegada a la arena y dos o tres frentes de ola que llegan, solo frente a las playas (en los muelles, poca)
  float ds = max(-mix(-40.0, (texture2D(uShore, uv).r - 0.5)*80.0, inside), 0.0), beach = 0.0;
  if (ds < 32.0 && inside > 0.5) {
    vec2 e = vec2(8.0, 0.0)/uSize;
    vec2 gr = vec2(texture2D(uShore, uv + e.xy).r - texture2D(uShore, uv - e.xy).r, texture2D(uShore, uv + e.yx).r - texture2D(uShore, uv - e.yx).r);
    vec2 dir = gr/max(length(gr), 1e-5);
    vec3 SAND = vec3(0.882, 0.827, 0.655);
    beach = max(1.0 - smoothstep(0.05, 0.12, length(texture2D(groundTex, uv + dir*(ds + 10.0)/uSize).rgb - SAND)),
                1.0 - smoothstep(0.05, 0.12, length(texture2D(groundTex, uv + dir*(ds + 24.0)/uSize).rgb - SAND)));
  }
  float fr = fract(ds/11.0 + t*0.16 + 0.35*vnoise(p*0.03));
  float waves = exp(-pow((fr - 0.5)*5.0, 2.0))*(1.0 - smoothstep(12.0, 30.0, ds))*smoothstep(2.0, 5.0, ds)*(1.0 - smoothstep(4.0, 18.0, px));
  float edge = 1.0 - smoothstep(0.8, 3.5 + 3.0*br, ds);
  float foam = clamp(edge*(0.6 + 0.4*br) + waves*smoothstep(0.35, 0.75, br)*0.75, 0.0, 1.0)*mix(0.2, 1.0, beach)*inside;
  c = mix(c, vec3(0.93,0.95,0.96)*(uSunCol*0.6 + uSkyCol), foam*0.8);
  FRAG(c);
}`;

const VS_SKY = `precision highp float;
attribute vec3 position; uniform mat4 world; uniform mat4 viewProjection; varying vec3 vPos; varying vec3 vDir;
void main(){ vDir = position; vec4 wp = world*vec4(position,1.0); vPos = wp.xyz; gl_Position = viewProjection*wp; }`;
const FS_SKY = `
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir); vec3 c = skyColor(d); float aur = 0.0;
  if (uGlow.z > 0.001) {
    // aura nocturna: el cielo NO se tiñe (en las fotos de Barcelona de noche es azul marino casi negro hasta el horizonte).
    // Solo la bruma baja de la ciudad (la misma de fogL): vista desde dentro o desde poca altura, un velo gris cálido pegado
    // al horizonte; desde Collserola o desde el aire la cámara está por encima de la capa y el cielo queda limpio
    float dy = max(d.y, 0.012), L = min(160.0/dy, 9000.0);
    float I = 160.0*exp(-max(uCam.y, 0.0)/160.0)/dy;
    aur = (1.0 - exp(-1.0e-4*I*max(cityW(uCam.xz), cityW(uCam.xz + normalize(d.xz + vec2(1e-5))*L*0.5))))*min(uGlow.z, 1.5);
  }
  if (uNight > 0.01 && d.y > 0.0) {                       // estrellas: solo de noche cerrada
    vec2 g = d.xz/(d.y + 0.55)*64.0; vec2 id = floor(g); float hs = hash21(id);
    vec2 o = (vec2(hash21(id + 7.31), hash21(id + 3.17)) - 0.5)*0.7;
    float st = smoothstep(0.12, 0.02, length(fract(g) - 0.5 - o))*step(0.90, hs);
    c += vec3(0.86, 0.92, 1.0)*st*(0.25 + 1.9*fract(hs*37.0)*fract(hs*37.0))*uNight*smoothstep(0.03, 0.25, d.y)*(1.0 - 0.5*uGlow.z)*(1.0 - 0.8*min(aur, 1.0));   // la luz de la ciudad apaga la mitad
  }
  if (d.y > 0.012 && uCam.y < 2400.0) {
    float tp = (2600.0 - uCam.y)/d.y;
    vec2 q = (uCam.xz + d.xz*tp)*0.00015 + vec2(uTime*0.003, 0.0);
    float n = vnoise(q)*0.5 + vnoise(q*2.03 + 7.1)*0.25 + vnoise(q*4.1 + 3.3)*0.125 + vnoise(q*8.3 + 1.7)*0.0625;
    float cov = smoothstep(0.50, 0.76, n)*smoothstep(0.012, 0.11, d.y);
    vec3 cc = mix(mix(uFogCol, vec3(0.80)*(1.0 - 0.93*uNight) + uSunCol*0.32, 0.8), uFogCol*0.9, uNight);   // de noche, nubes del color del cielo (sin resplandor)
    c = mix(c, cc, cov*0.85);
  }
  if (d.y < 0.0) { vec3 hc = horzCol(d); c = mix(hc, hc*0.8, clamp(-d.y*4.0, 0.0, 1.0)); }
  if (aur > 0.0) c = toScr(toLin(c) + toLin(kHaze)*aur);
  FRAG_NOFOG(c);
}`;

// mkMat: la ÚNICA forma de crear materiales. Antepone el preludio al fragment shader, declara los uniformes comunes y
// apunta el material en «mats» (ahí se actualizan cámara, tiempo, sol, cielo, niebla y uDusk). El vertex shader se usa tal cual.
// opts (opcional): { defines: ['#define X', …] para #ifdef en ambos shaders · cull: true para descartar caras traseras ·
//   blend: true = material con mezcla alfa: se dibuja después de todo lo opaco, sin escribir profundidad, y su shader acaba
//   en FRAGA(color, opacidad). La mezcla es (SRC_ALPHA, ONE_MINUS_SRC_ALPHA) para el color y (ZERO, ONE) para el alfa: el
//   alfa del búfer NO se toca (el carril de luz guardará ahí la profundidad de lo opaco) }
// UNIFORMES Y MUESTREADORES GLOBALES (los del preludio). Para añadir uno a todos los materiales: declararlo en PRELUDE,
// apuntar su nombre en BASEU (o en BASES si es un sampler) y darle valor: en lightTo() si depende de la hora, en update()
// junto a uCam si cambia cada fotograma, o desde un módulo con ctx.eachMat(m => m.setTexture(…)), que vale también para
// los materiales que se creen después.
const BASEU = ['world', 'viewProjection', 'uCam', 'uSunDir', 'uSunCol', 'uSkyCol', 'uGndCol', 'uFogCol', 'uZenCol', 'uFogD', 'uTime', 'uDusk', 'uNight', 'uLate', 'uGlow',
               'uSunL', 'uSkyL', 'uGndL', 'uTone', 'uSunH', 'uHorzC', 'uShX0', 'uShY0', 'uShX1', 'uShY1', 'uShZ', 'uShC0', 'uShC1', 'uShP'];
const BASES = ['uShadow0', 'uShadow1'];
// textura de relleno para los mapas de sombra (blanco = nada tapa) mientras lighting.js no ponga los suyos
const SH_NONE = BABYLON.RawTexture.CreateRGBATexture(new Uint8Array([255, 255, 255, 255]), 1, 1, scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);
const mats = [], MATFN = [];
const eachMat = fn => { MATFN.push(fn); for (const m of mats) fn(m); };
// Babylon no trae ese modo de mezcla. Se elige un alphaMode que no usa nadie más (así su caché de estado no lo confunde con
// otro) y, al enlazar el material, se le cambian los factores: el motor ya ha fijado el modo y aún no ha dibujado
const BLEND_MODE = BABYLON.Constants.ALPHA_EXCLUSION, GLB = { SRC_ALPHA: 0x0302, ONE_MINUS_SRC_ALPHA: 0x0303, ZERO: 0, ONE: 1 };
let lightOn = false;                                         // ¿ya se ha fijado la hora alguna vez? (ver lightTo)
function mkMat(name, vs, fs, attributes, uniforms, samplers, opts) {
  opts = opts || {};
  const m = new BABYLON.ShaderMaterial(name, scene, { vertexSource: vs, fragmentSource: PRELUDE + fs },
    { attributes, uniforms: BASEU.concat(uniforms || []), samplers: BASES.concat(samplers || []),
      defines: (opts.defines || []).concat(OUT.hdr ? [] : ['#define LDR']), needAlphaBlending: !!opts.blend });
  m.backFaceCulling = !!opts.cull;
  if (opts.blend) { m.alphaMode = BLEND_MODE;
    m.onBindObservable.add(() => engine.alphaState.setAlphaBlendFunctionParameters(GLB.SRC_ALPHA, GLB.ONE_MINUS_SRC_ALPHA, GLB.ZERO, GLB.ONE)); }
  m.setTexture('uShadow0', SH_NONE); m.setTexture('uShadow1', SH_NONE);
  mats.push(m);
  if (lightOn) lightTo(m);                                   // un material creado más tarde recibe la luz de la hora actual
  for (const f of MATFN) f(m);
  return m;
}
// Paso al camino LDR en marcha (lighting.js no ha podido montar el postproceso): todos los materiales se recompilan con
// «#define LDR» y se avisa a quien se haya apuntado en OUT.onLDR. No hay vuelta atrás.
function setLDR() {
  if (!OUT.hdr) return;
  OUT.hdr = false;
  for (const m of mats) m.options.defines.push('#define LDR');
  for (const f of OUT.onLDR) { try { f(); } catch (e) { console.warn(e); } }
}
const matBld = mkMat('bld', VS_BLD, FS_BLD, ['position', 'color', 'uv', 'uv2'], ['uFx', 'uStreetR'], ['uStreet', 'uRoofPal']);
// tabla de colores de cubierta de palette.js (64 × 1, sin filtrar)
if (window.BCN_PAL) matBld.setTexture('uRoofPal', BABYLON.RawTexture.CreateRGBATexture(window.BCN_PAL.ROOF, 64, 1, scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE));
matBld.setVector2('uFx', new BABYLON.Vector2(230, 290));
const matTer = mkMat('ter', VS_BASIC, FS_TER, ['position'], ['uSize', 'uGrid', 'uCell', 'uStreetR'], ['groundTex', 'normTex', 'uStreet', 'uShore']);
// máscara de calles (la luz de las farolas, de noche): hasta que se trazan las calles, «todo es calle»
for (const m of [matBld, matTer]) { m.setTexture('uStreet', SH_NONE); m.setVector4('uStreetR', new BABYLON.Vector4(0, 0, 0, 0)); }
const matOut = mkMat('out', VS_NRM, FS_OUT, ['position', 'normal'], ['uUseTex', 'uOutRect'], ['outTex']);
const matRoad = mkMat('road', VS_COL, FS_ROAD, ['position', 'color', 'uv'], ['uOrg', 'uAsph'], ['tAsD', 'tAsN']);
matRoad.setVector2('uOrg', new BABYLON.Vector2(0, 0)); matRoad.setFloat('uAsph', 0);
const matQuay = mkMat('quay', VS_BASIC, FS_QUAY, ['position']);
const matSea = mkMat('sea', VS_BASIC, FS_SEA, ['position'], ['uSize'], ['coastTex', 'uShore', 'groundTex']);
const matSky = mkMat('sky', VS_SKY, FS_SKY, ['position']);
matTer.zOffset = 0; matTer.zOffsetUnits = 8;
matOut.zOffset = 0; matOut.zOffsetUnits = 8;
matSea.zOffset = 0; matSea.zOffsetUnits = 40;
for (const m of [matTer, matSea]) m.setTexture('uShore', SH_NONE);
matSea.setTexture('groundTex', SH_NONE);
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
// Registro de mallas (sombras y demás pases auxiliares): TODA malla que se crea pasa por reg(malla, { cast, alphaTex, layer }).
//   cast: proyecta sombra · alphaTex: textura cuyo alfa recorta la malla (hojas) · layer: a qué capa pertenece
// Las opciones quedan en mesh.metadata.bcn y la malla en reg.meshes (un Set), del que se da de baja sola al hacer dispose.
// reg.ver cuenta altas y bajas (las sombras lo miran para saber si tienen que repintarse).
const MESHES = new Set();
function reg(mesh, o) {
  if (!mesh) return mesh;
  mesh.metadata = Object.assign(mesh.metadata || {}, { bcn: Object.assign({ cast: false, alphaTex: null, layer: '' }, o) });
  MESHES.add(mesh); reg.ver++; mesh.onDisposeObservable.addOnce(() => { MESHES.delete(mesh); reg.ver++; });
  return mesh;
}
reg.meshes = MESHES; reg.ver = 0;

// ------------------------------------------------------------------ luz / hora
const L = { sunDir: new BABYLON.Vector3(), sunCol: new BABYLON.Color3(), skyCol: new BABYLON.Color3(), gndCol: new BABYLON.Color3(),
            fogCol: new BABYLON.Color3(), zenCol: new BABYLON.Color3(), sunH: new BABYLON.Vector4(1, 0, 0, 0), horzC: new BABYLON.Color3(), fogD: 0.000032, dusk: 0, night: 0, late: 0, hour: 17, glow: new BABYLON.Vector4(0, 0, 0, 0),
            // luz lineal (uSunL, uSkyL, uGndL) = color de pantalla ^2.2 por estas ganancias. A mediodía, sol : cielo ≈ 8 : 1
            sunL: new BABYLON.Color3(), skyL: new BABYLON.Color3(), gndL: new BABYLON.Color3(),
            // exp: exposición de día. Al anochecer el ojo se adapta: el ambiente (cielo y suelo) sube hasta ×(1 + dAmb) y la
            // exposición hasta ×(1 + dExp), con el sol ya bajo (L.dusk de 0 a 0,6). Poco de exposición para no lavar el cielo
            // des: cuánto se desatura el cielo como luz ambiente (0…1). Su color de pantalla, al pasar a lineal, sale mucho más
            // azul de lo que parece y teñía de azul todo lo que queda en sombra
            // De día manda que lo soleado no se queme: con el ACES de Babylon, una acera clara al sol debe quedar cerca de su
            // color de autor (≈ +15 %) y una pared blanca por debajo de 0,85; la sombra, hacia la mitad de lo soleado.
            // moon: ganancia de la luna respecto al sol · nAmb / nExp: adaptación extra del ambiente y la exposición de noche
            // blue: cuánto ambiente se quita en la hora azul (sol de 0,5° a −5° bajo el horizonte, antes de la noche cerrada)
            // DIA (de día pleno, se desvanece al ponerse el sol): desD desaturación del cielo como ambiente · skyD / gndD ganancia del
            // ambiente del cielo y del rebote del suelo · fogDay color de la bruma y del horizonte (azulado, como en las fotos)
            K: { sun: 1.7, sky: 4.4, gnd: 4.8, exp: 1.2, dAmb: 0.78, dExp: 0.42, des: 0.55, moon: 0.8, nAmb: 0.0, nExp: 0.25, blue: 0.5,
                 desD: 0.14, skyD: 0.92, gndD: 0.72, expD: 1.12, sunD: 1.08, fogDD: 0.7, fogDay: [0.58, 0.71, 0.86],
                 // aura nocturna (uGlow): city = ganancia general (0 la quita) · calle = calzadas bajo las farolas · bajos = luz de
                 // farola en la parte baja de los muros lejanos · halo = bruma cálida y resplandor del horizonte · suelo = suelo urbano
                 city: 1, calle: 0.9, bajos: 1.2, halo: 1.0, suelo: 0.16 },
            tone: new BABYLON.Vector2(1.6, 1.08) };            // exposición (la fija setHour) y contraste (postproceso, o FRAG en el camino LDR)
// uniformes de luz de un material (los comunes del preludio que dependen de la hora)
function lightTo(m) {
  m.setVector3('uSunDir', L.sunDir); m.setColor3('uSunCol', L.sunCol); m.setColor3('uSkyCol', L.skyCol); m.setColor3('uGndCol', L.gndCol);
  m.setColor3('uFogCol', L.fogCol); m.setColor3('uZenCol', L.zenCol); m.setFloat('uFogD', L.fogD); m.setFloat('uDusk', L.dusk); m.setFloat('uNight', L.night); m.setFloat('uLate', L.late); m.setVector4('uGlow', L.glow);
  m.setColor3('uSunL', L.sunL); m.setColor3('uSkyL', L.skyL); m.setColor3('uGndL', L.gndL); m.setVector2('uTone', L.tone);
  m.setVector4('uSunH', L.sunH); m.setColor3('uHorzC', L.horzC);
}
const lin22 = v => Math.pow(Math.max(v, 0), 2.2);
const linTo = (o, c, k) => o.set(lin22(c.r) * k, lin22(c.g) * k, lin22(c.b) * k);
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// Ciclo de 24 h. El sol sale a las 6:00 y se pone a las 21:00 (verano); de noche sigue bajando bajo el horizonte y la luz
// direccional pasa a ser la luna (misma dirección «uSunDir»: así las sombras y los brillos siguen valiendo sin tocar nada).
let clockAcc = 0;
function setHour(hh) {
  hh = ((hh % 24) + 24) % 24;
  const D = Math.PI / 180, isDay = hh >= 6 && hh <= 21, nn = ((hh - 21 + 24) % 24) / 9;      // nn: 0 a las 21:00 … 1 a las 6:00
  const elS = isDay ? Math.sin((hh - 6) / 15 * Math.PI) * 64 : -Math.sin(nn * Math.PI) * 38;   // altura real del sol, en grados
  const moon = elS < -4.3;                                                                     // la luz direccional es la luna
  const sf = sstep(-3.5, 1.0, elS), mf = sstep(-5.2, -10, elS);                                // el sol se apaga y la luna se enciende (sin solaparse)
  const az = (moon ? 110 + nn * 140 : 95 + (hh - 6.5) / 14 * 170) * D;                         // de E a O por el sur, los dos
  const el = (moon ? 22 + 26 * Math.sin(nn * Math.PI) : Math.max(elS, 1.28)) * D;
  L.sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  const e = Math.min(1, Math.max(0, (elS - 2) / 26)), nt = sstep(-1, -9, elS);                // e: sol bajo … alto · nt: noche cerrada
  const k = 0.55 + 0.45 * e, sc0 = mix3([1.05, 0.50, 0.24], [1.04, 0.99, 0.90], e);
  // DIA: sol de mañana y de tarde cálido aunque ya esté alto (fotos: 8:30 dorado, 10:30 aún algo cálido, mediodía neutro)
  const wm = (1 - sstep(8, 70, elS)) * e, sc = [sc0[0], sc0[1] * (1 - 0.12 * wm), sc0[2] * (1 - 0.30 * wm)];
  const sk = mix3(mix3([0.272, 0.256, 0.336], [0.32, 0.384, 0.48], e), [0.12, 0.145, 0.23], nt);
  const gn = mix3([0.33 * k + 0.04, 0.31 * k + 0.04, 0.28 * k + 0.04], [0.10, 0.105, 0.13], nt);
  // aura nocturna: «on» sube con las farolas (segunda mitad de uDusk) y dura toda la noche. De día todo queda como estaba
  const on = L.K.city * sstep(0.45, 1, 1 - Math.min(1, Math.max(0, (Math.sin(elS * D) - 0.02) / 0.22)));
  // horizonte: con el sol bajo, la base es un gris malva (también el lado contrario al sol) y el naranja va solo hacia el sol
  // (uSunH, uHorzC: horzCol() en el preludio). sg: fuerza de ese resplandor, de 18° de altura del sol hasta 9° bajo el horizonte
  // De noche cerrada, azul marino oscuro y algo gris (en las fotos el horizonte apenas es más claro que el cenit): nada de pardo
  const fg = mix3(mix3([0.76, 0.69, 0.68], L.K.fogDay, e), [0.069, 0.122, 0.193], nt);   // de día, bruma azulada (DIA)   // → sRGB ≈ (2, 17, 34): calibrado a través del pie del ACES
  const sg = (1 - sstep(3, 18, elS)) * sstep(-9, -1.5, elS), sw = mix3([1.04, 0.62, 0.34], [0.50, 0.24, 0.15], sstep(-1, -8, elS));
  const azS = (isDay ? 95 + (hh - 6.5) / 14 * 170 : 271 + nn * 178) * D;                       // acimut del sol de verdad
  L.sunH.set(Math.sin(azS), Math.cos(azS), sg, moon ? mf : 0); L.horzC.set(sw[0] - fg[0], sw[1] - fg[1], sw[2] - fg[2]);
  L.glow.set(on * L.K.calle, on * L.K.bajos, on * L.K.halo, on * L.K.suelo); L.fogD = 0.000032 * (1 - (1 - L.K.fogDD) * e * (1 - nt));   // DIA: algo menos de bruma de día
  const zn = mix3(mix3([0.20, 0.24, 0.46], [0.16, 0.38, 0.78], e), [0.050, 0.099, 0.165], nt);   // cenit de noche → sRGB ≈ (0, 12, 26). Por debajo de ~0,0035 lineal expuesto, el ACES da negro puro
  if (moon) L.sunCol.set(0.20 * mf, 0.235 * mf, 0.32 * mf); else L.sunCol.set(sc[0] * k * 0.82 * sf, sc[1] * k * 0.82 * sf, sc[2] * k * 0.82 * sf);
  L.skyCol.set(sk[0], sk[1], sk[2]); L.gndCol.set(gn[0], gn[1], gn[2]);
  L.fogCol.set(fg[0], fg[1], fg[2]); L.zenCol.set(zn[0], zn[1], zn[2]);
  // uDusk: 0 de día … 1 cuando hay que encender luces (toda la noche) · uNight: noche cerrada · uLate: madrugada
  L.dusk = 1 - Math.min(1, Math.max(0, (Math.sin(elS * D) - 0.02) / 0.22)); L.night = nt;
  L.late = hh >= 12 ? sstep(22.75, 24, hh) : (hh < 5.5 ? 1 : 1 - sstep(5.5, 6.5, hh));
  // el ojo se adapta (más ambiente y más exposición al anochecer), pero recién puesto el sol, en la hora azul, el suelo ya
  // está en penumbra: bd quita parte de esa adaptación del ambiente hasta que llega la noche cerrada
  const dq = Math.min(1, L.dusk / 0.6), dk = dq * dq * (3 - 2 * dq), bd = sstep(0.5, -5, elS) * (1 - nt);
  const amb = (1 + L.K.dAmb * dk) * (1 + L.K.nAmb * nt) * (1 - L.K.blue * bd);
  linTo(L.sunL, L.sunCol, L.K.sun * (moon ? L.K.moon : 1) * (1 + (L.K.sunD - 1) * e * (1 - nt))); linTo(L.skyL, L.skyCol, L.K.sky * amb); linTo(L.gndL, L.gndCol, L.K.gnd * amb);
  // DIA: de día el cielo como luz ambiente se desatura menos (sombras frescas, azuladas) y el ambiente baja un poco (más
  // contraste sol/sombra); el rebote cálido del suelo, más (agrisaba las sombras). dd: 0 al ponerse el sol y de noche
  const dd = e * (1 - nt);
  { const c = L.skyL, g = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b, t = L.K.des + (L.K.desD - L.K.des) * dd; c.r += (g * 1.03 - c.r) * t; c.g += (g - c.g) * t; c.b += (g * 0.98 - c.b) * t;
    const ks = 1 + (L.K.skyD - 1) * dd, kg = 1 + (L.K.gndD - 1) * dd; c.r *= ks; c.g *= ks; c.b *= ks; L.gndL.r *= kg; L.gndL.g *= kg; L.gndL.b *= kg; }
  L.tone.x = L.K.exp * (1 + L.K.dExp * dk) * (1 + L.K.nExp * nt) * (1 + (L.K.expD - 1) * dd);
  L.hour = hh; lightOn = true;
  for (const m of mats) lightTo(m);
  scene.clearColor.set(fg[0], fg[1], fg[2], 1);
  const tm = Math.round(hh * 60) % 1440, h = Math.floor(tm / 60), mi = tm % 60;
  $('hourV').textContent = h + ':' + (mi < 10 ? '0' : '') + mi;
}

// ------------------------------------------------------------------ cielo y mar
const sky = BABYLON.MeshBuilder.CreateSphere('sky', { diameter: 2, segments: 24 }, scene);
sky.material = matSky; sky.scaling.setAll(150000); sky.isPickable = false; sky.renderingGroupId = 0; sky.alwaysSelectAsActiveMesh = true;
reg(sky, { cast: false, layer: 'sky' });
const sea = BABYLON.MeshBuilder.CreateGround('sea', { width: 420000, height: 420000, subdivisions: 160 }, scene);
sea.position.set(WX / 2, 0, WZ / 2); sea.material = matSea; sea.isPickable = false; sea.renderingGroupId = 1; sea.alwaysSelectAsActiveMesh = true;
reg(sea, { cast: false, layer: 'sea' });
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
  matTer.setTexture('groundTex', groundTex); matSea.setTexture('groundTex', groundTex);
  const COAST = [], EDG = new Map();    // NAT2: bordes del relieve en la costa: x0, z0, x1, z1, x y z del tercer vértice (lado de tierra)
  const dv = terr.view('meshes'); let p = 0, tris = 0;
  for (let k = 0; k < M.nMesh; k++) {
    const cx = dv.getUint8(p), cz = dv.getUint8(p + 1), nV = dv.getUint32(p + 4, true), nI = dv.getUint32(p + 8, true); p += 12;
    const pos = new Float32Array(nV * 3);
    for (let v = 0; v < nV; v++, p += 6) { pos[v * 3] = dv.getUint16(p, true) / 10; pos[v * 3 + 1] = dv.getInt16(p + 2, true) / 10; pos[v * 3 + 2] = dv.getUint16(p + 4, true) / 10; }
    if ((nV * 6) % 4) p += 2;
    const idx = new Uint16Array(nI);
    for (let v = 0; v < nI; v++, p += 2) idx[v] = dv.getUint16(p, true);
    if ((nI * 2) % 4) p += 2;
    reg(mkMesh('t' + k, pos, idx, matTer, null, cx * CH, cz * CH), { cast: true, layer: 'terrain' }); tris += nI / 3;
    // NAT2: la línea de agua (y = 0) que cruza los triángulos del escalón y, donde el relieve acaba por encima del agua, su
    // borde. Solo cerca del nivel del mar (y < 8 m). Las aristas se casan por posición (no por índice: hay vértices
    // repetidos en las costuras de un mismo trozo y entre trozos), así que solo quedan las del contorno de verdad
    { const ox = cx * CH, oz = cz * CH, vk = q => Math.round((pos[q * 3] + ox) * 10) * 300000 + Math.round((pos[q * 3 + 2] + oz) * 10);
      for (let t = 0; t < nI; t += 3) { const v = [idx[t], idx[t + 1], idx[t + 2]], y = v.map(q => pos[q * 3 + 1]);
        if (Math.min(...y) > 8) continue;
        for (let e = 0; e < 3; e++) { const a = v[e], b = v[(e + 1) % 3], ka = vk(a), kb = vk(b), key = ka < kb ? ka + ':' + kb : kb + ':' + ka;
          const o = EDG.get(key); if (o) o[0] = 0; else EDG.set(key, [1, pos[a * 3] + ox, pos[a * 3 + 2] + oz, y[e], pos[b * 3] + ox, pos[b * 3 + 2] + oz, y[(e + 1) % 3], pos[v[(e + 2) % 3] * 3] + ox, pos[v[(e + 2) % 3] * 3 + 2] + oz]); }
        if (Math.min(...y) >= 0 || Math.max(...y) <= 0) continue;
        const P = [];
        for (let e = 0; e < 3; e++) { const p = v[e], q = v[(e + 1) % 3], yp = y[e], yq = y[(e + 1) % 3]; if ((yp > 0) === (yq > 0)) continue;
          const f = yp / (yp - yq); P.push(pos[p * 3] + (pos[q * 3] - pos[p * 3]) * f + ox, pos[p * 3 + 2] + (pos[q * 3 + 2] - pos[p * 3 + 2]) * f + oz); }
        const up = v[y.findIndex(h => h > 0)];
        if (P.length === 4) COAST.push(P[0], P[1], P[2], P[3], pos[up * 3] + ox, pos[up * 3 + 2] + oz); } }
  }
  // NAT2 · máscara de costa: distancia con signo (m, + en tierra) al contorno del relieve en la costa (donde de verdad empieza
  // el agua), en téxeles de 8 m: exacta a menos de 12 m de la línea (distancia a cada arista, lado de tierra el del tercer
  // vértice) y por chaflán más allá, con el signo propagado. Lineal: la orilla sale continua y suave; la arena mojada
  // (FS_TER) y la espuma (FS_SEA) van pegadas a ella. ±40 m en un byte
  { const T = 8, SW = Math.ceil(WX / T), SZ = Math.ceil(WZ / T), N = SW * SZ, t0 = performance.now();
    const onL = v => Math.abs(v / CH - Math.round(v / CH)) * CH < 0.06;     // aristas sobre la costura de dos trozos: fuera
    for (const o of EDG.values()) if (o[0] && !((onL(o[1]) && onL(o[4])) || (onL(o[2]) && onL(o[5]))) && o[3] > 0.05 && o[6] > 0.05 && o[1] > 1 && o[2] > 1 && o[1] < WX - 1 && o[2] < WZ - 1) COAST.push(o[1], o[2], o[4], o[5], o[7], o[8]);
    EDG.clear();
    const D = new Uint16Array(N).fill(65535), sg = new Uint8Array(N).fill(1);    // D: medios metros
    for (let e = 0; e < COAST.length; e += 6) {
      const x0 = COAST[e], z0 = COAST[e + 1], x1 = COAST[e + 2], z1 = COAST[e + 3], dx = x1 - x0, dz = z1 - z0, L2 = dx * dx + dz * dz || 1e-6;
      const side = Math.sign(dx * (COAST[e + 5] - z0) - dz * (COAST[e + 4] - x0));
      const i0 = Math.max(0, Math.floor((Math.min(x0, x1) - 12) / T)), i1 = Math.min(SW - 1, Math.floor((Math.max(x0, x1) + 12) / T));
      const j0 = Math.max(0, Math.floor((Math.min(z0, z1) - 12) / T)), j1 = Math.min(SZ - 1, Math.floor((Math.max(z0, z1) + 12) / T));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const px = (i + 0.5) * T - x0, pz = (j + 0.5) * T - z0, u = Math.max(0, Math.min(1, (px * dx + pz * dz) / L2));
        const d = Math.round(Math.hypot(px - u * dx, pz - u * dz) * 2), o = j * SW + i;
        if (d < D[o]) { D[o] = d; sg[o] = Math.sign(dx * pz - dz * px) === side ? 1 : 0; } } }
    const W1 = 16, W2 = 23;
    const rel = (o, q, w) => { const d = D[q] + w; if (d < D[o]) { D[o] = d; sg[o] = sg[q]; } };
    for (let j = 1; j < SZ - 1; j++) for (let i = 1; i < SW - 1; i++) { const o = j * SW + i; rel(o, o - 1, W1); rel(o, o - SW, W1); rel(o, o - SW - 1, W2); rel(o, o - SW + 1, W2); }
    for (let j = SZ - 2; j > 0; j--) for (let i = SW - 2; i > 0; i--) { const o = j * SW + i; rel(o, o + 1, W1); rel(o, o + SW, W1); rel(o, o + SW + 1, W2); rel(o, o + SW - 1, W2); }
    const B8 = new Uint8Array(N);
    for (let o = 0; o < N; o++) { const m = Math.min(D[o] * 0.5, 40) * 127.5 / 40; B8[o] = Math.round(127.5 + (sg[o] ? m : -m)); }
    const shore = BABYLON.RawTexture.CreateLuminanceTexture(B8, SW, SZ, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
    texOpts(shore); matTer.setTexture('uShore', shore); matSea.setTexture('uShore', shore);
    window.BCN_SHORE = { ms: Math.round(performance.now() - t0), edges: COAST.length / 6 }; }
  // muelles
  const qv = new Float32Array(terr.sec('quayV')), qi = new Uint32Array(terr.sec('quayI'));
  reg(mkMesh('quays', qv, qi, matQuay), { cast: true, layer: 'terrain' });
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
  om.alwaysSelectAsActiveMesh = true; reg(om, { cast: false, layer: 'far' });
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
const RSEG = [];   // tramos de eje de calle (x0,z0,x1,z1,semiancho,clase): fachadas, aceras, árboles y mobiliario
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
        RSEG.push(x, z, nx, nz, w / 2, cls);
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
        uvs.push(-1, along, hw, 0, 1, along, hw, 0);
        if (k > 0) { const a = v0 + 2 * k - 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
      }
    }
    if (idx.length) {
      const nv = pos.length / 3;
      reg(mkMesh('r' + bi, new Float32Array(pos), nv > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), matRoad,
        [vbuf(new Uint8Array(col), 'color', 4, VB.UNSIGNED_BYTE, true), vbuf(new Float32Array(uvs), 'uv', 4, VB.FLOAT, false)]), { cast: false, layer: 'road' });
      roadTris += idx.length / 3;
    }
    if ((++bi & 15) === 0) { setMsg('Trazando calles…', 0.25 + 0.1 * bi / rd.meta.buckets.length); await tick(); }
  }
}

// asfalto fotografiado (Transeúnte)
try {
  const tw = async f => { const t = new BABYLON.Texture(await blobURL('data/' + f), scene, false, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
    t.wrapU = t.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE; t.anisotropicFilteringLevel = 8; return t; };
  const [ad, an] = await Promise.all([tw('st_asphalt_d.webp'), tw('st_asphalt_n.webp')]);
  matRoad.setTexture('tAsD', ad); matRoad.setTexture('tAsN', an); matRoad.setFloat('uAsph', 1);
} catch (e) { console.warn('Sin textura de asfalto', e); matRoad.setTexture('tAsD', coastTex); matRoad.setTexture('tAsN', coastTex); }
const SEG = new Float32Array(RSEG); RSEG.length = 0;
// MÁSCARA DE CALLES (para la luz de noche de lejos, §7.6): textura de una capa, 1 a menos de «semiancho + 3 m» del eje de
// alguna calle y 0 lejos de todas (patios de manzana, interior de las parcelas). Celdas de 8 m (o más, hasta 2048 de lado),
// filtrado bilineal. La leen FS_BLD (luz de farola en los bajos de los muros: solo los que dan a la calle) y FS_TER
try {
  let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
  for (let i = 0; i < SEG.length; i += 6) { const r = SEG[i + 4] + 4;
    x0 = Math.min(x0, SEG[i] - r, SEG[i + 2] - r); x1 = Math.max(x1, SEG[i] + r, SEG[i + 2] + r);
    z0 = Math.min(z0, SEG[i + 1] - r, SEG[i + 3] - r); z1 = Math.max(z1, SEG[i + 1] + r, SEG[i + 3] + r); }
  const cs = Math.max(8, (x1 - x0) / 2040, (z1 - z0) / 2040), nx = Math.ceil((x1 - x0) / cs) + 2, nz = Math.ceil((z1 - z0) / cs) + 2;
  x0 -= cs; z0 -= cs;
  const g = new Uint8Array(nx * nz);
  for (let i = 0; i < SEG.length; i += 6) {
    const ax = SEG[i], az = SEG[i + 1], dx = SEG[i + 2] - ax, dz = SEG[i + 3] - az, r = SEG[i + 4] + 3, rr = (r + cs * 0.5) * (r + cs * 0.5);
    const ns = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (cs * 0.5)));
    for (let k = 0; k <= ns; k++) {
      const px = ax + dx * k / ns, pz = az + dz * k / ns;
      const i0 = Math.max(0, Math.floor((px - r - x0) / cs)), i1 = Math.min(nx - 1, Math.floor((px + r - x0) / cs));
      const j0 = Math.max(0, Math.floor((pz - r - z0) / cs)), j1 = Math.min(nz - 1, Math.floor((pz + r - z0) / cs));
      for (let j = j0; j <= j1; j++) for (let ii = i0; ii <= i1; ii++) {
        const qx = x0 + (ii + 0.5) * cs - px, qz = z0 + (j + 0.5) * cs - pz;
        if (qx * qx + qz * qz <= rr) g[j * nx + ii] = 255;
      }
    }
  }
  const tex = BABYLON.RawTexture.CreateLuminanceTexture(g, nx, nz, scene, false, false, BABYLON.Texture.BILINEAR_SAMPLINGMODE);
  tex.wrapU = tex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
  const R = new BABYLON.Vector4(x0, z0, 1 / (nx * cs), 1 / (nz * cs));
  for (const m of [matBld, matTer]) { m.setTexture('uStreet', tex); m.setVector4('uStreetR', R); }
} catch (e) { console.warn('Sin máscara de calles', e); }

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
// barrios: cajas y consulta, ANTES de los edificios (la paleta elige el color por familia de barrio al cargarlos)
for (const b of META.barris) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const r of b.r) for (const q of r) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < z0) z0 = q[1]; if (q[1] > z1) z1 = q[1]; } b.bb = [x0, z0, x1, z1]; }
window.BCN_BARRI = { at: (x, z) => barriAt(x, z), barris: META.barris, districtes: META.districtes };   // consulta de barrio para otros módulos (paleta, fachadas)
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
  const PALJ = window.BCN_PAL; if (PALJ) PALJ.init(nTot);
  for (let ci = 0; ci < conts.length; ci++) {
    const c = conts[ci];
    const dv = c.view('data'); BREC.dv.push(dv);
    for (const ck of c.meta.chunks) {
      const [cx, cz, off, len, nB, nV, nR] = ck;
      const maxV = (nV + nR) * 2, maxI = nV * 6 + (nV + 2 * nR) * 3;
      const pos = new Float32Array(maxV * 3), col = new Uint8Array(maxV * 4), inf = new Int16Array(maxV * 4), axv = new Int8Array(maxV * 2);
      const idx = maxV > 65535 ? new Uint32Array(maxI) : new Uint16Array(maxI);
      let vp = 0, ip = 0, p = off; const end = off + len; const flat = [], holes = [], rsz = [], topIdx = [];
      const ox = cx * CH, oz = cz * CH;
      while (p < end) {
        const bi = BREC.n++; BREC.cont[bi] = ci; BREC.off[bi] = p; BREC.chunk[bi] = bldChunks.length; BREC.v0[bi] = vp;
        const nRings = dv.getUint8(p), cls = dv.getUint8(p + 1), seed = dv.getUint8(p + 2), n = dv.getUint16(p + 4, true);
        const yb = dv.getInt16(p + 6, true), ybot = dv.getInt16(p + 8, true), ytop = dv.getInt16(p + 10, true); p += 12;
        rsz.length = 0;
        if (nRings > 1) { for (let r = 0; r < nRings; r++, p += 2) rsz.push(dv.getUint16(p, true)); } else rsz.push(n);
        const Ht = ytop - yb, hb = ybot - yb, y0 = ybot / 10, y1 = ytop / 10;
        flat.length = 0;
        for (let k = 0; k < n; k++, p += 4) flat.push(dv.getInt16(p, true) / 10, dv.getInt16(p + 2, true) / 10);
        let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9;
        for (let k = 0; k < flat.length; k += 2) { const x = flat[k], z = flat[k + 1]; if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (z < bz0) bz0 = z; if (z > bz1) bz1 = z; }
        // color horneado: el de la paleta por familia de barrio (palette.js) o, en las clases sin paleta, el de PAL
        const pal = PAL[cls] || PAL[0], a = (cls << 4) | (seed & 15);
        // eje del edificio (para alinear la textura de su cubierta con sus muros): media de la dirección de las aristas del
        // anillo exterior, ponderada por longitud, con el ángulo ×4 (así las aristas a 0°, 90°, 180° y 270° suman a lo mismo)
        let s4c = 0, s4s = 0;
        for (let k = 0, m0 = rsz[0]; k < m0; k++) { const j = (k + 1) % m0, dx = flat[j * 2] - flat[k * 2], dz = flat[j * 2 + 1] - flat[k * 2 + 1], L = Math.hypot(dx, dz);
          if (L > 0.05) { const a4 = 4 * Math.atan2(dz, dx); s4c += L * Math.cos(a4); s4s += L * Math.sin(a4); } }
        const axA = Math.atan2(s4s, s4c) / 4, axC = Math.round(Math.cos(axA) * 127), axS = Math.round(Math.sin(axA) * 127);
        // planta: área (anillo exterior) y cuánto llena su rectángulo mínimo orientado con ese eje (la teja con pendiente solo
        // va en plantas casi rectangulares: palette.js lo decide con estos dos números)
        let pA = 0, u0 = 1e9, u1 = -1e9, w0 = 1e9, w1 = -1e9;
        { const ca = Math.cos(axA), sa = Math.sin(axA);
          for (let k = 0, m0 = rsz[0]; k < m0; k++) { const j = (k + 1) % m0, x = flat[k * 2], z = flat[k * 2 + 1], u = x * ca + z * sa, w = z * ca - x * sa;
            pA += x * flat[j * 2 + 1] - flat[j * 2] * z; if (u < u0) u0 = u; if (u > u1) u1 = u; if (w < w0) w0 = w; if (w > w1) w1 = w; } }
        pA = Math.abs(pA) / 2;
        const c3 = (PALJ && PALJ.pick(bi, cls, seed, (bx0 + bx1) / 2 + ox, (bz0 + bz1) / 2 + oz, Ht / 10, pA, pA / Math.max(1, (u1 - u0) * (w1 - w0)))) || pal[seed % pal.length];
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
            o = vp * 2; axv[o] = axC; axv[o + 1] = axS; axv[o + 2] = axC; axv[o + 3] = axS;
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
        BREC.bb[bi * 4] = bx0 + ox; BREC.bb[bi * 4 + 1] = bz0 + oz; BREC.bb[bi * 4 + 2] = bx1 + ox; BREC.bb[bi * 4 + 3] = bz1 + oz;
        // ¿vivienda susceptible de fachada de detalle? (ni torres, ni naves, ni volúmenes elevados)
        const Hm = Ht / 10, area = (bx1 - bx0) * (bz1 - bz0);
        BREC.elig[bi] = ((cls === 0 && Hm >= 6 && Hm <= 45) || (cls === 6 && Hm >= 5 && Hm <= 16)) && hb < 15 && area < 16000 && !(Hm < 9 && area > 1800) && rsz[0] >= 3 ? 1 : 0;
      }
      const infBuf = inf.subarray(0, vp * 4);
      const vbInfo = new VB(engine, infBuf, 'uv', true, false, 4, false, 0, 4, VB.SHORT, false);
      const mesh = mkMesh('b' + cx + '_' + cz, pos.subarray(0, vp * 3), idx.subarray(0, ip), matBld,
        [vbuf(col.subarray(0, vp * 4), 'color', 4, VB.UNSIGNED_BYTE, true), vbInfo, vbuf(axv.subarray(0, vp * 2), 'uv2', 2, VB.BYTE, true)], cx * CH, cz * CH);
      reg(mesh, { cast: true, layer: 'coarse' });
      bldChunks.push({ mesh, x: (cx + 0.5) * CH, z: (cz + 0.5) * CH, ox, oz, inf: infBuf, vbInfo, dirty: false });
      bldTris += ip / 3;
      if ((++done % 12) === 0) { setMsg('Construyendo edificios… ' + bldCount.toLocaleString('es-ES'), 0.45 + 0.5 * done / total); await tick(); }
    }
  }
}

// ------------------------------------------------------------------ etiquetas y barrios
const labels = [];
const addLabel = (txt, cls, x, y, z) => { const e = document.createElement('div'); e.className = 'lb ' + cls; e.textContent = txt; e.style.display = 'none'; $('labels').appendChild(e); labels.push({ e, k: cls, p: new BABYLON.Vector3(x, y, z), on: false }); };
{
  const add = addLabel;
  for (const b of META.barris) add(b.n, 'b', b.c[0], heightAt(b.c[0], b.c[1]) + 45, b.c[1]);
  for (const d of META.districtes) add(d.n, 'd', d.c[0], heightAt(d.c[0], d.c[1]) + 160, d.c[1]);
  for (const q of META.poi) add(q.n, 'p', q.p[0], q.p[1] + (q.n.indexOf('Torre') >= 0 ? 300 : q.n === 'Sagrada Família' ? 185 : 70), q.p[2]);
}
function barriAt(x, z) {
  for (const b of META.barris) {
    if (x < b.bb[0] || x > b.bb[2] || z < b.bb[1] || z > b.bb[3]) continue;
    for (const r of b.r) { let ins = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const xi = r[i][0], zi = r[i][1], xj = r[j][0], zj = r[j][1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins; } if (ins) return b; }
  }
  return null;
}

// ------------------------------------------------------------------ módulos
// CTX: el único contexto que reciben todos los módulos. facades.js le añade ctx.city (índices espaciales y consultas) y
// ctx.detail (materiales del shader de detalle) al iniciarse; cada módulo iniciado queda además en ctx.mods[id].
const st = { yaw: 0, pitch: 0.5, walk: false, keys: {}, fly: null, showLabels: true, maxDist: 40000 };   // cámara y controles
const CTX = { scene, engine, canvas, cam, st, SHOT, GEO: window.BCN_GEO, mkMat, mats, eachMat, out: OUT, setLDR, shNone: SH_NONE, relight: () => setHour(L.hour), reg, heightAt, WX, WZ, CH, SEG, ROFF, RCOL, META, PAL,
  BREC, bldChunks, blobURL, L, matBld, mods: {},
  // etiqueta de punto de interés (la usan los hitos): si ya hay una con ese texto, se mueve a (x, y, z)
  label: (txt, x, y, z) => { const l = labels.find(q => q.k === 'p' && q.e.textContent === txt); if (l) l.p.set(x, y, z); else addLabel(txt, 'p', x, y, z); } };
// Módulos con protocolo común { update(P, groundY, dt, frame), busy(), stats(), setRange?(q), flush?(P, groundY) }, en orden
// de actualización. Si uno falla al iniciarse, la ciudad sigue funcionando sin él.
const MODS = [];
async function addMod(id, glob, what) {
  try { const M = window[glob]; if (!M) throw new Error(glob + ' no se ha cargado'); const m = await M.init(CTX); MODS.push({ id, m }); return (CTX.mods[id] = m); }
  catch (e) { console.warn('Sin ' + what, e); return null; }
}
// Módulos de hooks (interiors, details, furniture, ground): los inicia el núcleo que los usa con
// «await ctx.hooks(qué, global, respaldo)». Devuelve el respaldo completado con lo que dé init(ctx) (que puede ser async:
// cargar texturas, etc.); si el módulo falta o falla al iniciarse, se queda el respaldo y se avisa.
CTX.hooks = async (what, glob, fb) => {
  try { const M = window[glob]; if (!M) throw new Error(glob + ' no se ha cargado'); return Object.assign(fb, await M.init(CTX)); }
  catch (e) { console.warn('Sin ' + what, e); return fb; }
};
// hitos (edificios y monumentos singulares): ANTES de las fachadas, porque los edificios que sustituyen dejan de tener
// fachada de detalle (BREC.elig) y facades.js monta sus índices al iniciarse
setMsg('Construyendo edificios singulares…', 0.965);
await tick();
const LMS = await addMod('lm', 'BCN_LANDMARKS', 'hitos');
// fachadas de detalle (calidad Transeúnte al acercarse)
setMsg('Preparando fachadas de detalle…', 0.97);
await tick();
const FXS = await addMod('fx', 'BCN_FACADES', 'fachadas de detalle');
// calles de detalle (aceras, árboles, mobiliario): necesitan los índices espaciales y el shader de detalle de las fachadas
setMsg('Preparando calles: aceras, árboles y mobiliario…', 0.985);
await tick();
const STS = FXS ? await addMod('st', 'BCN_STREETS', 'calles de detalle') : null;
// azoteas con detalle (rooftops.js): usa los índices de las fachadas y su shader de detalle
if (FXS) await addMod('roof', 'BCN_ROOFTOPS', 'azoteas con detalle');
// naturaleza: volumen en el monte, los parques grandes y el delta (necesita ctx.city de las fachadas para no invadir calles
// ni edificios; sin él planta igual, solo por la máscara del suelo)
setMsg('Plantando el monte…', 0.99);
await tick();
await addMod('nat', 'BCN_NATURE', 'vegetación de montaña');
await addMod('aero', 'BCN_AERO', 'aeropuerto (marcas de pistas y puestos)');
// iluminación: siempre el último
const LIGHT = QS.get('nolight') === '1' ? null : await addMod('light', 'BCN_LIGHTING', 'módulo de iluminación');   // ?nolight=1: prueba del respaldo
if (!LIGHT) setLDR();                                         // sin módulo de luz no hay postproceso: tono y gamma en los shaders

// ------------------------------------------------------------------ cámara y controles
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
[['hDia', 12], ['hTarde', 19.5], ['hNoche', 23]].forEach(([id, h]) => { const b = $(id); if (b) b.onclick = () => { $('hour').value = h; setHour(h); }; });
{ const b = $('hRun'); if (b) b.onclick = () => { st.clock = !st.clock; b.classList.toggle('on', st.clock); }; }
$('dist').oninput = e => { st.maxDist = +e.target.value * 1000; $('distV').textContent = (+e.target.value >= 40 ? 'todo' : e.target.value + ' km'); };
$('distV').textContent = 'todo';
[['fx0', 0], ['fx1', 1], ['fx2', 2]].forEach(([id, q]) => { $(id).onclick = () => { if (FXS) FXS.setRange(q); for (const k of ['fx0', 'fx1', 'fx2']) $(k).classList.toggle('on', k === id); }; });
if (!FXS) $('fxRow').style.display = 'none';
[['st0', 0], ['st1', 1], ['st2', 2]].forEach(([id, q]) => { $(id).onclick = () => { if (STS) STS.setRange(q); for (const k of ['st0', 'st1', 'st2']) $(k).classList.toggle('on', k === id); }; });
if (!STS) $('stRow').style.display = 'none';
// calidad gráfica (escala de render, antialiasing, bloom…): la tabla está en lighting.js
const GQ = [['gq0', 'auto'], ['gq1', 'baja'], ['gq2', 'media'], ['gq3', 'alta']];
GQ.forEach(([id, q]) => { $(id).onclick = () => { if (LIGHT) LIGHT.setQuality(q); for (const k of GQ) $(k[0]).classList.toggle('on', k[0] === id); }; });
if (!LIGHT) { $('gqRow').style.display = 'none'; $('gqLab').style.display = 'none'; }
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
  { const ox = Math.floor(P.x / 1200) * 1200, oz = Math.floor(P.z / 1200) * 1200; if (ox !== st._ox || oz !== st._oz) { st._ox = ox; st._oz = oz; matRoad.setVector2('uOrg', new BABYLON.Vector2(ox, oz)); } }
  // un fallo en un módulo no puede parar el fotograma (ni a los demás módulos): se avisa como error y se sigue
  for (const o of MODS) { try { o.m.update(P, g, dt, frame); } catch (e) { if ((o.nerr = (o.nerr || 0) + 1) <= 3) console.error('Error en el módulo «' + o.id + '»: ' + (e && e.stack || e)); } }
  if (SHOT || (frame & 7) === 0) { const md = st.maxDist + P.y * 1.2, m2 = md * md; for (const c of bldChunks) { const dx = c.x - P.x, dz = c.z - P.z; c.mesh.setEnabled(st.maxDist >= 40000 || dx * dx + dz * dz < m2); } }
  hudT -= dt;
  if (hudT <= 0) {
    hudT = 0.2;
    const inside = P.x >= 0 && P.x <= WX && P.z >= 0 && P.z <= WZ, b = inside ? barriAt(P.x, P.z) : null;
    $('wBarri').textContent = b ? b.n : (inside ? 'Área metropolitana' : 'Fuera del mapa detallado');
    $('wInfo').textContent = (b ? b.d + ' · ' : '') + 'altura ' + Math.round(alt) + ' m · cota ' + Math.round(g) + ' m';
    if (LIGHT) { const q = LIGHT.stats(); $('gqV').textContent = q.auto ? q.quality : ''; }
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
  const now = performance.now(), dt = Math.min(0.1, (now - t0) / 1000); t0 = now; time = SHOT ? 10 : time + dt; frame++;
  // reloj: 1 s real = 1 min de juego (un día en 24 min); la luz se recalcula una vez por segundo
  if (st.clock && !SHOT) { clockAcc += dt; if (clockAcc >= 1) { const h = (L.hour + clockAcc / 60) % 24; clockAcc = 0; setHour(h); $('hour').value = h; } }
    // en modo captura el tiempo se congela (capturas reproducibles)
  update(dt);
  for (const m of mats) m.setFloat('uTime', time);
});
scene.onAfterRenderObservable.add(() => { if ((frame & 1) === 0) updateLabels(); });
await scene.whenReadyAsync();
engine.runRenderLoop(() => scene.render());
addEventListener('resize', () => engine.resize());
setMsg('¡Listo!', 1);
setTimeout(() => { $('load').style.opacity = 0; setTimeout(() => $('load').remove(), 700); }, 150);
// vacía de golpe el trabajo pendiente de TODOS los módulos (el arnés de capturas lo llama antes de fotografiar)
function flushAll() {
  const P = cam.position, g = groundY(P.x, P.z);
  for (const { m } of MODS) {
    if (m.flush) { m.flush(P, g); continue; }
    let n = 0; do { m.update(P, g, 0.3, 0); } while (m.busy && m.busy() && ++n < 100000);
  }
}
Object.assign(window.BCN, { ready: true, views: VIEWS, applyView, flyTo, setHour, cam, st, scene, engine, heightAt, poi, stats: { bldCount, bldTris, roadTris },
  ctx: CTX, reg, mods: MODS, fx: FXS, streets: STS, light: LIGHT, lm: LMS ? LMS.api : null,
  detailBusy: () => MODS.some(o => !!o.m.busy && o.m.busy()),
  detailStats: () => { const o = { fx: null, st: null }; for (const { id, m } of MODS) o[id] = m.stats ? m.stats() : null; return o; },
  fxFlush: flushAll });
} catch (e) {
  console.error(e); window.BCN.error = String(e && e.stack || e);
  $('err').textContent = 'No se ha podido cargar la ciudad: ' + (e && e.message || e);
}
})();
