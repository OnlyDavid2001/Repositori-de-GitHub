/* GTA Barcelona — Naturaleza: volumen en lo verde que no es ciudad (Collserola, Montjuïc, el Carmel, parques grandes, el
   delta y el aeropuerto) y pasarelas de playa.
   window.BCN_NATURE = { init(ctx) → { update, busy, stats, flush, setRange } } (módulo de primer nivel, §6.3).
   · Máscara: la textura del suelo (data/ground.webp, 5 m por píxel) se lee UNA vez en la CPU al cargar y se reduce a una
     clase por píxel (bosque, parque, prado, campo, matorral, arena, mar) y a un color medio (10 m por píxel).
   · Celdas de 128 m: cada una reparte, con su propia semilla, muestras en una rejilla de 2,8 m con desplazamiento al azar y
     coloca según la clase pinos piñoneros, pinos carrascos, encinas, arbustos, matas de hierba, cañas y rocas, sin invadir
     calles (ctx.city.roadDist) ni edificios (ctx.city.coverAt). Nada por fotograma: la selección de instancias se rehace
     al moverse más de 24 m (o al terminar celdas nuevas).
   · Tres niveles por especie, con thin instances: «close» (< 70 m, proyecta sombra), «near» (igual geometría, hasta ~320 m)
     y «mid» (pocos polígonos, hasta ~900 m), con fundido tramado entre near y mid y al final de mid. Más allá, el relieve
     de copas que pinta FS_TER (app.js).
   · Color: el de la ortofoto bajo cada planta, con la MISMA conversión a verde oliva que FS_TER (los colores que calibró DÍA).
   Capa de registro: «nature» (las «close» con cast). */
(function () {
'use strict';

const CS = 128;                        // lado de celda (m)
const STEP = 2.8;                      // rejilla de muestras (m)
const PX = 5;                          // metros por píxel de ground.webp
// clases de la máscara
const C_NONE = 0, C_FOREST = 1, C_PARK = 2, C_GRASS = 3, C_FARM = 4, C_SCRUB = 5, C_SAND = 6, C_SEA = 7;

// ------------------------------------------------------------------ geometría (local, y arriba, base en 0)
// color por vértice: r = oclusión (0–1), g = altura relativa en la planta (0 pie … 1 punta), b = libre, a = parte
// partes: 0 copa/follaje · 1 tronco · 2 roca · 3 hierba · 4 caña · 5 madera
function G() { return { P: [], N: [], C: [], I: [] }; }
let _s = 1;
const rnd = (a, b) => { _s |= 0; _s = _s + 0x6D2B79F5 | 0; let t = Math.imul(_s ^ _s >>> 15, 1 | _s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  const r = ((t ^ t >>> 14) >>> 0) / 4294967296; return b === undefined ? (a === undefined ? r : r * a) : a + r * (b - a); };
function blob(g, cx, cy, cz, rx, ry, rz, lat, lon, part, jit, Htop) {
  const base = g.P.length / 3, ph = rnd(6.28);
  const bump = []; for (let k = 0; k < 5; k++) bump.push([rnd(6.28), rnd(1, 3), rnd(-jit, jit)]);
  for (let i = 0; i <= lat; i++) {
    const v = i / lat, th = v * Math.PI, sy = Math.cos(th), sr = Math.sin(th);
    for (let j = 0; j <= lon; j++) {
      const a = j / lon * 6.2832 + ph, ca = Math.cos(a), sa = Math.sin(a);
      let k = 1; if (i > 0 && i < lat) for (const b of bump) k += b[2] * Math.sin(a * b[1] + b[0] + th * 1.7);
      const x = ca * sr * rx * k, y = sy * ry * (i === 0 || i === lat ? 1 : k), z = sa * sr * rz * k;
      g.P.push(cx + x, cy + y, cz + z);
      let nx = x / (rx * rx), ny = y / (ry * ry), nz = z / (rz * rz); const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      // el fondo de la copa, algo hacia abajo y más oscuro
      g.N.push(nx, ny, nz); g.C.push(0.45 + 0.55 * (sy * 0.5 + 0.5), Math.min(1, (cy + y) / Htop), 0, part);
    }
  }
  for (let i = 0; i < lat; i++) for (let j = 0; j < lon; j++) {
    const a = base + i * (lon + 1) + j, b = a + lon + 1;
    if (i > 0) g.I.push(a, b, a + 1);
    if (i < lat - 1) g.I.push(a + 1, b, b + 1);
  }
}
function cyl(g, x0, y0, z0, x1, y1, z1, r0, r1, sides, part, Htop) {
  const base = g.P.length / 3;
  for (let e = 0; e < 2; e++) {
    const x = e ? x1 : x0, y = e ? y1 : y0, z = e ? z1 : z0, r = e ? r1 : r0;
    for (let s = 0; s <= sides; s++) { const a = s / sides * 6.2832, c = Math.cos(a), n = Math.sin(a);
      g.P.push(x + c * r, y, z + n * r); g.N.push(c, 0.15, n); g.C.push(0.85 + 0.15 * e, y / Htop, 0, part); }
  }
  for (let s = 0; s < sides; s++) { const a = base + s, b = base + sides + 1 + s; g.I.push(a, b, a + 1, a + 1, b, b + 1); }
}
// briznas: triángulos finos que salen de un pie común (de dos caras: el material no descarta caras traseras)
function blades(g, n, h0, h1, w, lean, part) {
  for (let k = 0; k < n; k++) {
    const a = rnd(6.28), h = rnd(h0, h1), r = rnd(0.02, 0.18), bx = Math.cos(a) * r, bz = Math.sin(a) * r;
    const t = a + rnd(-0.6, 0.6), lx = Math.cos(t) * lean * h * rnd(0.3, 1), lz = Math.sin(t) * lean * h * rnd(0.3, 1);
    const px = -Math.sin(a) * w, pz = Math.cos(a) * w, base = g.P.length / 3;
    g.P.push(bx - px, 0, bz - pz, bx + px, 0, bz + pz, bx + lx, h, bz + lz);
    for (let q = 0; q < 3; q++) g.N.push(Math.cos(a) * 0.4, 0.9, Math.sin(a) * 0.4);
    g.C.push(0.55, 0, 0, part, 0.55, 0, 0, part, 1, 1, 0, part);
    g.I.push(base, base + 1, base + 2);
  }
}
function rock(g, sx, sy, sz) {
  const t = (1 + Math.sqrt(5)) / 2, V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
  const F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  // caras planas (vértices duplicados): roca facetada
  for (const f of F) {
    const p = f.map(i => { const v = V[i], l = Math.hypot(...v), k = 1 + 0.25 * Math.sin(i * 7.1 + 1.3); return [v[0] / l * sx * k, Math.max(-0.3, v[1] / l * sy * k + sy * 0.35), v[2] / l * sz * k]; });
    const ux = p[1][0] - p[0][0], uy = p[1][1] - p[0][1], uz = p[1][2] - p[0][2], vx = p[2][0] - p[0][0], vy = p[2][1] - p[0][1], vz = p[2][2] - p[0][2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    if (nx * p[0][0] + ny * p[0][1] + nz * p[0][2] < 0) { nx = -nx; ny = -ny; nz = -nz; }
    const base = g.P.length / 3;
    for (const q of p) { g.P.push(q[0], q[1], q[2]); g.N.push(nx, ny, nz); g.C.push(0.7 + 0.3 * Math.max(ny, 0), 0, 0, 2); }
    g.I.push(base, base + 1, base + 2);
  }
}
function pack(g) { return { P: new Float32Array(g.P), N: new Float32Array(g.N), C: new Float32Array(g.C), I: new Uint32Array(g.I) }; }

// especies: geometría cercana (hi) y de media distancia (lo)
function pinea(hi) {   // pino piñonero: tronco alto que se abre en una copa plana en forma de sombrilla
  _s = 11; const g = G(), H = 8.2;
  cyl(g, 0, -0.3, 0, 0.35, 5.6, 0.15, 0.3, 0.16, hi ? 7 : 3, 1, H);
  if (hi) { cyl(g, 0.3, 4.8, 0.13, -1.2, 6.3, 0.6, 0.12, 0.07, 4, 1, H); cyl(g, 0.3, 4.9, 0.13, 1.7, 6.2, -0.7, 0.12, 0.07, 4, 1, H); }
  blob(g, 0.3, 6.7, 0.1, 3.7, 1.15, 3.5, hi ? 4 : 2, hi ? 10 : 6, 0, hi ? 0.07 : 0.03, H);
  if (hi) for (let k = 0; k < 4; k++) { const a = k * 1.57 + rnd(0.6); blob(g, 0.3 + Math.cos(a) * 2.4, 6.9 + rnd(-0.2, 0.3), 0.1 + Math.sin(a) * 2.3, 1.5, 0.75, 1.5, 3, 6, 0, 0.12, H); }
  return pack(g);
}
function halep(hi) {   // pino carrasco: tronco algo torcido y copa irregular y abierta
  _s = 23; const g = G(), H = 9.5;
  cyl(g, 0, -0.3, 0, 0.5, 3.6, 0.2, 0.24, 0.17, hi ? 6 : 3, 1, H);
  if (hi) cyl(g, 0.5, 3.6, 0.2, 0.2, 7.2, -0.3, 0.17, 0.08, 5, 1, H);
  const B = [[0.6, 5.6, 0.6, 1.9], [-0.4, 6.4, -0.6, 1.7], [0.3, 7.6, 0.1, 1.5], [1.3, 6.6, -0.8, 1.3], [-1.0, 5.2, 0.7, 1.2]];
  for (let k = 0; k < (hi ? 5 : 2); k++) { const b = B[k], s = hi ? 1 : 1.3; blob(g, b[0], b[1], b[2], b[3] * s, b[3] * 0.72 * s, b[3] * 0.95 * s, hi ? 3 : 2, hi ? 7 : 5, 0, hi ? 0.16 : 0.05, H); }
  return pack(g);
}
function ilex(hi) {    // encina: tronco corto y copa redonda y densa
  _s = 37; const g = G(), H = 6.6;
  cyl(g, 0, -0.3, 0, 0.1, 2.3, 0.05, 0.27, 0.2, hi ? 6 : 3, 1, H);
  blob(g, 0.1, 4.0, 0, 3.0, 2.3, 2.8, hi ? 5 : 3, hi ? 10 : 6, 0, hi ? 0.08 : 0.03, H);
  if (hi) for (let k = 0; k < 3; k++) { const a = k * 2.1 + 0.4; blob(g, Math.cos(a) * 1.9, 4.6 + rnd(-0.5, 0.6), Math.sin(a) * 1.8, 1.5, 1.2, 1.5, 3, 6, 0, 0.12, H); }
  return pack(g);
}
function bush(hi) {    // arbusto (lentisco, coscoja): dos o tres bolas bajas
  _s = 51; const g = G(), H = 1.6;
  if (hi) { blob(g, 0, 0.55, 0, 1.15, 0.85, 1.05, 3, 7, 0, 0.18, H); blob(g, 0.8, 0.4, 0.3, 0.8, 0.6, 0.75, 3, 6, 0, 0.18, H); blob(g, -0.5, 0.35, 0.7, 0.7, 0.5, 0.7, 2, 6, 0, 0.18, H); }
  else blob(g, 0.15, 0.5, 0.25, 1.4, 0.8, 1.3, 2, 5, 0, 0.05, H);
  return pack(g);
}
function grass() { _s = 61; const g = G(); blades(g, 11, 0.45, 0.95, 0.05, 0.35, 3); return pack(g); }
function reed() { _s = 71; const g = G(); blades(g, 9, 1.8, 2.9, 0.035, 0.12, 4); return pack(g); }
function stone() { _s = 81; const g = G(); rock(g, 0.9, 0.55, 0.75); return pack(g); }

// ------------------------------------------------------------------ shaders
const VS = `precision highp float;
attribute vec3 position; attribute vec3 normal; attribute vec4 color; attribute vec4 icol;
#include<instancesDeclaration>
uniform mat4 viewProjection;
varying vec3 vPos; varying vec3 vN; varying vec4 vC; varying vec4 vI;
void main(){
#include<instancesVertex>
  vec4 wp = finalWorld*vec4(position, 1.0); vPos = wp.xyz; vN = normalize(mat3(finalWorld)*normal); vC = color; vI = icol;
  gl_Position = viewProjection*wp; }`;
// vI.rgb: color de la ortofoto bajo la planta (crudo, como lo lee FS_TER) · vI.a: azar por instancia (0–1)
const FS = `
varying vec3 vN; varying vec4 vC; varying vec4 vI; uniform vec4 uBand;
// la misma conversión a verde oliva que FS_TER (app.js), para que la planta y el suelo que la rodea casen
vec3 olive(vec3 a){
  float mt = smoothstep(60.0, 200.0, vPos.y), vg = clamp((a.g - max(a.r, a.b))*9.0, 0.0, 1.0)*(1.0 - uNight);
  float l = dot(a, vec3(0.30, 0.60, 0.10));
  vec3 ol = l*mix(vec3(0.90, 1.0, 0.68), vec3(0.86, 1.0, 0.68), mt)*1.05;
  return mix(a, ol, vg*mix(0.55, 1.0, mt));
}
void main(){
  vec3 V = uCam - vPos; float dist = length(V); V /= dist;
  float d = dith();
  if (d < smoothstep(uBand.z, uBand.w, dist) || d >= smoothstep(uBand.x, uBand.y, dist)) discard;
  float part = floor(vC.a + 0.5), ao = vC.r, hl = vC.g, rn = vI.a;
  vec3 n = normalize(vN);
  float px = length(fwidth(vPos));
  float nf = 1.0 - smoothstep(0.08, 0.35, px);            // detalle fino solo si el píxel es pequeño (sin centelleo)
  vec3 alb; vec3 c;
  if (part < 0.5) {
    // copa: color del suelo de la ortofoto llevado a oliva; las manchas verde claro (parques) se oscurecen hacia el de pino
    vec3 g = olive(vI.rgb);
    float lg = dot(g, vec3(0.3, 0.6, 0.1));
    vec3 pine = mix(vec3(0.20, 0.25, 0.13), vec3(0.27, 0.31, 0.17), rn);
    alb = mix(g*0.97, pine*mix(0.95, 1.15, lg*2.0), smoothstep(0.36, 0.55, lg)*0.7);
    alb *= mix(vec3(0.94, 1.0, 0.92), vec3(1.06, 1.0, 1.08), rn);
    // racimos de hojas: manchas y normal rizada
    vec3 q = vPos*1.7;
    float cl = vnoise(q.xz + q.y*0.7)*0.6 + vnoise(q.zy*1.9 + 3.0)*0.4;
    alb *= mix(1.0, 0.74 + 0.5*cl, nf);
    // silueta deshilachada: en el borde de la copa (normal casi de canto) se abren huecos entre racimos
    float rim = abs(dot(n, V));
    if (rim < 0.42 && cl < 0.62*(1.0 - rim/0.42)*nf + 0.0) discard;
    n = normalize(n + (vec3(vnoise(q.xy + 1.3), vnoise(q.yz + 7.1), vnoise(q.zx + 4.4)) - 0.5)*1.1*nf);
    alb *= mix(0.62, 1.0, ao);
    c = lit(alb, normalize(n + vec3(0.0, 0.25, 0.0)));
    c += alb*vec3(1.0, 1.15, 0.6)*uSunCol*max(dot(-V, uSunDir), 0.0)*0.12*sunVis();
  } else if (part < 1.5) {                              // tronco
    alb = mix(vec3(0.20, 0.15, 0.12), vec3(0.30, 0.21, 0.16), rn)*(0.8 + 0.4*vnoise(vPos.xz*9.0 + vPos.y*3.0))*ao;
    c = lit(alb, n);
  } else if (part < 2.5) {                              // roca caliza / pizarra de Collserola
    alb = mix(vec3(0.42, 0.40, 0.37), vec3(0.58, 0.55, 0.50), rn)*(0.85 + 0.3*vnoise(vPos.xz*4.0 + vPos.y*5.0))*ao;
    alb = mix(alb, olive(vI.rgb)*0.7, smoothstep(0.55, 0.9, n.y)*0.35);
    c = lit(alb, n);
  } else if (part < 3.5) {                              // hierba alta: verde del suelo, puntas secas
    vec3 g = olive(vI.rgb);
    alb = mix(g*0.75, mix(vec3(0.52, 0.48, 0.30), g*1.1, 0.45), hl*hl)*mix(0.85, 1.1, rn)*ao;
    c = lit(alb, vec3(0.0, 1.0, 0.0)*0.6 + n*0.4);
  } else if (part < 4.5) {                              // cañas
    alb = mix(vec3(0.30, 0.33, 0.18), vec3(0.62, 0.58, 0.38), hl)*mix(0.85, 1.1, rn)*ao;
    c = lit(alb, vec3(0.0, 1.0, 0.0)*0.6 + n*0.4);
  } else {                                              // madera de pasarela, gastada por el sol y la sal
    alb = vec3(0.50, 0.42, 0.32)*(0.82 + 0.25*vnoise(vec2(vPos.x + vPos.z, vPos.y)*vec2(0.6, 12.0)))*ao;
    c = lit(alb, n);
  }
  c *= 1.0 - 0.55*uNight;                               // de noche, el monte casi negro (como el terreno)
  FRAG(c);
}`;

window.BCN_NATURE = { async init(ctx) {
  const { scene, mkMat, reg, heightAt, WX, WZ } = ctx, city = ctx.city;
  const QS = new URLSearchParams(location.search);
  const t0 = performance.now();

  // ---------------------------------------------------------------- máscara (una vez, en la CPU)
  const url = await ctx.blobURL('data/ground.webp');
  const bmp = await createImageBitmap(await (await fetch(url)).blob());
  URL.revokeObjectURL(url);
  const MW = bmp.width, MH = bmp.height, CW = MW >> 1, CHh = MH >> 1;
  const CLS = new Uint8Array(MW * MH), COL = new Uint8Array(CW * CHh * 3);
  {
    const SH = 256, cv = document.createElement('canvas'); cv.width = MW; cv.height = SH;
    const g2 = cv.getContext('2d', { willReadFrequently: true });
    for (let y0 = 0; y0 < MH; y0 += SH) {
      const h = Math.min(SH, MH - y0); g2.clearRect(0, 0, MW, SH); g2.drawImage(bmp, 0, -y0);
      const D = g2.getImageData(0, 0, MW, h).data;
      for (let y = 0; y < h; y++) for (let x = 0; x < MW; x++) {
        const o = (y * MW + x) * 4, r = D[o], g = D[o + 1], b = D[o + 2], V = g - Math.max(r, b);
        let k = C_NONE;
        if (Math.abs(r - 150) < 7 && Math.abs(g - 151) < 7 && Math.abs(b - 107) < 7) k = C_SEA;
        else if (Math.abs(r - 225) < 18 && Math.abs(g - 211) < 18 && Math.abs(b - 167) < 22) k = C_SAND;
        else if (V >= 22 && g < 132) k = C_FOREST;
        else if (V >= 18) k = C_PARK;
        else if (V >= 6) k = C_GRASS;
        else if (r > 135 && Math.abs(r - g) < 14 && r - b > 35) k = C_FARM;
        else if (r >= 120 && r <= 185 && r - b >= 12 && r - b <= 50 && r - g >= 2 && r - g <= 22) k = C_SCRUB;
        CLS[(y0 + y) * MW + x] = k;
        if (!(x & 1) && !((y0 + y) & 1)) { const c = (((y0 + y) >> 1) * CW + (x >> 1)) * 3; COL[c] = r; COL[c + 1] = g; COL[c + 2] = b; }
      }
    }
    bmp.close && bmp.close();
    // ni hierba ni matas en la orilla: la mezcla de colores entre arena y mar se parece a la de los campos. Se limpia una
    // franja de 2 píxeles alrededor de la arena y del borde del mar (salvo el bosque)
    for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {
      const o = y * MW + x, k = CLS[o]; if (k !== C_SAND && k !== C_SEA) continue;
      if (k === C_SEA && CLS[o - 1] === C_SEA && CLS[o + 1] === C_SEA && CLS[o - MW] === C_SEA && CLS[o + MW] === C_SEA) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const yy = y + dy, xx = x + dx; if (yy < 0 || xx < 0 || yy >= MH || xx >= MW) continue;
        const q = yy * MW + xx, c = CLS[q]; if (c === C_FARM || c === C_GRASS || c === C_SCRUB || c === C_PARK) CLS[q] = C_NONE; }
    }
  }
  const clsAt = (x, z) => { const i = Math.floor(x / PX), j = Math.floor((WZ - z) / PX); return i < 0 || j < 0 || i >= MW || j >= MH ? C_NONE : CLS[j * MW + i]; };
  const colAt = (x, z, out, o) => { let i = Math.floor(x / (PX * 2)), j = Math.floor((WZ - z) / (PX * 2)); i = Math.max(0, Math.min(CW - 1, i)); j = Math.max(0, Math.min(CHh - 1, j));
    const c = (j * CW + i) * 3; out[o] = COL[c] / 255; out[o + 1] = COL[c + 1] / 255; out[o + 2] = COL[c + 2] / 255; };
  const tMask = performance.now() - t0;

  // ---------------------------------------------------------------- tipos, mallas y materiales
  // band: [fin del cercano (fundido a, b), fin del medio (c, d)]; close: radio de las que proyectan sombra
  const S = { on: QS.get('nat') !== '0', q: 1 };
  const TYPES = [
    { id: 'pinea', hi: pinea(true), lo: pinea(false), near: [290, 340], mid: [760, 900], close: 70, sc: [0.8, 1.25] },
    { id: 'halep', hi: halep(true), lo: halep(false), near: [290, 340], mid: [760, 900], close: 70, sc: [0.75, 1.2] },
    { id: 'ilex', hi: ilex(true), lo: ilex(false), near: [290, 340], mid: [760, 900], close: 70, sc: [0.7, 1.2] },
    { id: 'bush', hi: bush(true), lo: bush(false), near: [170, 210], mid: [400, 480], close: 0, sc: [0.6, 1.4] },
    { id: 'grass', hi: grass(), lo: null, near: [85, 115], mid: null, close: 0, sc: [0.7, 1.3] },
    { id: 'reed', hi: reed(), lo: null, near: [110, 150], mid: null, close: 0, sc: [0.8, 1.2] },
    { id: 'rock', hi: stone(), lo: null, near: [200, 250], mid: null, close: 0, sc: [0.5, 2.2] },
  ];
  const mats = [];
  function mat(name, band) { const m = mkMat('nat_' + name, VS, FS, ['position', 'normal', 'color', 'icol'], ['uBand'], []);
    m.setVector4('uBand', new BABYLON.Vector4(band[0], band[1], band[2], band[3])); mats.push(m); return m; }
  function mesh(name, g, m, cast) {
    const me = new BABYLON.Mesh(name, scene);
    me.setVerticesData('position', g.P, false); me.setVerticesData('normal', g.N, false); me.setVerticesData('color', g.C, false, 4); me.setIndices(g.I);
    me.material = m; me.isPickable = false; me.renderingGroupId = 1; me.alwaysSelectAsActiveMesh = true; me.doNotSyncBoundingInfo = true;
    me.thinInstanceSetBuffer('matrix', new Float32Array(16), 16, false); me.thinInstanceSetBuffer('icol', new Float32Array(4), 4, false); me.thinInstanceCount = 0;
    reg(me, { cast: !!cast, layer: 'nature' });
    return me;
  }
  for (const T of TYPES) {
    const mN = mat(T.id + 'N', [-2, -1, T.near[0], T.near[1]]);
    T.mesh = [T.close ? mesh('nc_' + T.id, T.hi, mN, true) : null, mesh('nn_' + T.id, T.hi, mN, false),
      T.lo ? mesh('nm_' + T.id, T.lo, mat(T.id + 'M', [T.near[0], T.near[1], T.mid[0], T.mid[1]]), false) : null];
    T.tri = [T.hi.I.length / 3, T.hi.I.length / 3, T.lo ? T.lo.I.length / 3 : 0];
    T.R = T.mid ? T.mid[1] : T.near[1];
  }
  const TI = {}; TYPES.forEach((T, k) => { TI[T.id] = k; });
  const RMAX = Math.max(...TYPES.map(T => T.R));

  // ---------------------------------------------------------------- celdas: reparto de plantas
  const NX = Math.ceil(WX / CS), NZ = Math.ceil(WZ / CS);
  const cells = new Map();             // ci → [por tipo: Float32Array (x, y, z, s, sy, rot, r, g, b, azar)]
  const hasRoad = (x, z, r) => city && city.roadDist(x, z) < r;
  const inBld = (x, z) => city && city.coverAt(x, z, -1) > -1e8;
  // probabilidades por muestra y clase: [pinea, halep, ilex, bush, grass, reed, rock]
  const PROB = {
    [C_FOREST]: [0.05, 0.11, 0.08, 0.12, 0.08, 0, 0.008],
    [C_PARK]: [0.045, 0.015, 0.025, 0.05, 0.18, 0, 0.003],
    [C_GRASS]: [0.006, 0.004, 0.006, 0.05, 0.22, 0.004, 0.004],
    [C_FARM]: [0, 0, 0, 0.006, 0.05, 0.008, 0],
    [C_SCRUB]: [0.012, 0.03, 0.012, 0.14, 0.16, 0, 0.03],
  };
  const CLEAR = [2.6, 2.6, 2.8, 1.3, 0.7, 0.9, 1.0];   // distancia mínima al borde de la calle
  function genCell(ci) {
    const i = ci % NX, j = (ci / NX) | 0, x0 = i * CS, z0 = j * CS;
    _s = (ci * 2654435761) | 0; rnd();
    const out = TYPES.map(() => []), tmp = [0, 0, 0];
    const n = Math.floor(CS / STEP);
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++) {
      const x = x0 + (a + rnd()) * STEP, z = z0 + (b + rnd()) * STEP, u = rnd();
      const k = clsAt(x, z); const P = PROB[k]; if (!P) continue;
      let t = -1, acc = 0; for (let q = 0; q < 7; q++) { acc += P[q]; if (u < acc) { t = q; break; } }
      if (t < 0) continue;
      // las especies de árbol van por rodales (ruido de ~60 m) y el pino piñonero, abajo
      if (t <= 2) { const h = heightAt(x, z), s = Math.sin(x * 0.051 + Math.sin(z * 0.043) * 2.0) + Math.sin(z * 0.047 + x * 0.013) + rnd(-0.8, 0.8);
        t = s > 0.7 ? 2 : s < -0.6 && h < 250 ? 0 : (h > 330 && s > 0.1 ? 2 : 1); }
      if (k === C_SCRUB) { const h = heightAt(x, z); if (h < 70) continue; }
      if (hasRoad(x, z, CLEAR[t]) || inBld(x, z)) continue;
      if (t <= 2 && (inBld(x + 2.5, z) || inBld(x - 2.5, z) || inBld(x, z + 2.5) || inBld(x, z - 2.5))) continue;
      const y = heightAt(x, z);
      // pendiente: los árboles no se plantan en cortados (> ~40°), las rocas los prefieren
      const gx = heightAt(x + 2, z) - heightAt(x - 2, z), gz = heightAt(x, z + 2) - heightAt(x, z - 2), sl = Math.hypot(gx, gz) / 4;
      if (t <= 3 && sl > 0.85) { if (rnd() < 0.5) t = 6; else continue; }
      if (t === 6 && sl < 0.15 && k !== C_SCRUB && rnd() < 0.6) continue;
      const T = TYPES[t], s = rnd(T.sc[0], T.sc[1]);
      colAt(x, z, tmp, 0);
      out[t].push(x, y - (t === 6 ? 0.25 * s : 0.05), z, s, s * rnd(0.85, 1.15), rnd(6.2832), tmp[0], tmp[1], tmp[2], rnd());
    }
    return out.map(a => a.length ? new Float32Array(a) : null);
  }

  // ---------------------------------------------------------------- selección de instancias
  let queue = [], lastSel = null, dirty = false, nInst = TYPES.map(() => [0, 0, 0]), tris = 0, genMs = 0, genN = 0;
  const cellD = (ci, P) => { const i = ci % NX, j = (ci / NX) | 0;
    const dx = Math.max(i * CS - P.x, 0, P.x - (i + 1) * CS), dz = Math.max(j * CS - P.z, 0, P.z - (j + 1) * CS); return Math.hypot(dx, dz); };
  function plan(P, alt) {
    const want = [], keep = new Set();
    if (S.on && alt < RMAX) {
      const r = Math.sqrt(RMAX * RMAX - alt * alt) + 20, i0 = Math.max(0, Math.floor((P.x - r) / CS)), i1 = Math.min(NX - 1, Math.floor((P.x + r) / CS));
      const j0 = Math.max(0, Math.floor((P.z - r) / CS)), j1 = Math.min(NZ - 1, Math.floor((P.z + r) / CS));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const ci = j * NX + i, d = cellD(ci, P); if (d > r) continue; keep.add(ci); if (!cells.has(ci)) want.push([d, ci]); }
    }
    for (const ci of [...cells.keys()]) if (!keep.has(ci) && cellD(ci, P) > RMAX + 300) cells.delete(ci);
    want.sort((a, b) => a[0] - b[0]); queue = want.map(w => w[1]);
  }
  const bufs = new Map();
  function getBuf(key, n) { let b = bufs.get(key); if (!b || b.length < n || b.length > n * 4 + 64) { b = new Float32Array(Math.max(16, Math.ceil(n * 1.3))); bufs.set(key, b); } return b; }
  function select(P) {
    lastSel = { x: P.x, y: P.y, z: P.z }; dirty = false;
    const L = TYPES.map(() => [[], [], []]);
    for (const [ci, C] of cells) {
      if (cellD(ci, P) > RMAX + 2) continue;
      for (let t = 0; t < TYPES.length; t++) { const A = C[t]; if (!A) continue; const T = TYPES[t], cl = T.close, n1 = T.near[1] + 2, n0 = T.near[0] - 2, m1 = T.mid ? T.mid[1] + 2 : -1;
        for (let k = 0; k < A.length; k += 10) {
          const d = Math.hypot(A[k] - P.x, A[k + 1] + 3 - P.y, A[k + 2] - P.z);
          if (d < n1) L[t][d < cl ? 0 : 1].push(A, k);
          if (d > n0 && d < m1) L[t][2].push(A, k);
        } }
    }
    tris = 0;
    for (let t = 0; t < TYPES.length; t++) for (let l = 0; l < 3; l++) {
      const me = TYPES[t].mesh[l]; if (!me) { nInst[t][l] = 0; continue; }
      const src = L[t][l], n = src.length / 2, M = getBuf(me.name + 'm', n * 16), Cc = getBuf(me.name + 'c', n * 4);
      for (let q = 0, w = 0, c = 0; q < src.length; q += 2, w += 16, c += 4) {
        const A = src[q], k = src[q + 1], s = A[k + 3], sy = A[k + 4], cs = Math.cos(A[k + 5]), sn = Math.sin(A[k + 5]);
        M[w] = cs * s; M[w + 1] = 0; M[w + 2] = -sn * s; M[w + 3] = 0;
        M[w + 4] = 0; M[w + 5] = sy; M[w + 6] = 0; M[w + 7] = 0;
        M[w + 8] = sn * s; M[w + 9] = 0; M[w + 10] = cs * s; M[w + 11] = 0;
        M[w + 12] = A[k]; M[w + 13] = A[k + 1]; M[w + 14] = A[k + 2]; M[w + 15] = 1;
        Cc[c] = A[k + 6]; Cc[c + 1] = A[k + 7]; Cc[c + 2] = A[k + 8]; Cc[c + 3] = A[k + 9];
      }
      me.thinInstanceSetBuffer('matrix', M, 16, false); me.thinInstanceSetBuffer('icol', Cc, 4, false); me.thinInstanceCount = n;
      nInst[t][l] = n; tris += n * TYPES[t].tri[l];
    }
  }
  function work(P, budget) {
    const t1 = performance.now(); let did = 0;
    while (queue.length && performance.now() - t1 < budget) { const ci = queue.shift(); if (cells.has(ci)) continue; const a = performance.now(); cells.set(ci, genCell(ci)); genMs += performance.now() - a; genN++; did++; }
    if (did) dirty = true;
  }
  let lastPlan = null, selT = 0;
  function update(P, groundY, dt) {
    const alt = Math.max(0, P.y - groundY);
    if (!lastPlan || Math.hypot(P.x - lastPlan.x, P.z - lastPlan.z) > 24 || Math.abs(alt - lastPlan.a) > 30) { lastPlan = { x: P.x, z: P.z, a: alt }; plan(P, alt); }
    work(P, 4);
    selT += dt || 0;
    const moved = !lastSel || Math.hypot(P.x - lastSel.x, P.y - lastSel.y, P.z - lastSel.z) > 24;
    if (moved || (dirty && (selT > 0.4 || !queue.length))) { select(P); selT = 0; }
  }
  function flush(P, groundY) { const alt = Math.max(0, P.y - groundY); lastPlan = { x: P.x, z: P.z, a: alt }; plan(P, alt); work(P, 1e9); select(P); }
  function setRange(q) { S.on = q > 0; lastPlan = null; if (!S.on) { cells.clear(); queue = []; } }
  function stats() {
    const o = { cells: cells.size, queue: queue.length, tris, maskMs: Math.round(tMask), genMsPerCell: genN ? +(genMs / genN).toFixed(2) : 0 };
    TYPES.forEach((T, t) => { o[T.id] = nInst[t].slice(); });
    return o;
  }
  return { update, busy: () => queue.length > 0, stats, flush, setRange };
} };
})();
