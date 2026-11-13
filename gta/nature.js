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
function G() { return { P: [], N: [], C: [], I: [], UV: [] }; }   // UV: [vértice, u, v] solo de las tarjetas (el resto, centro opaco)
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
  // REV: una subdivisión (80 caras en vez de 20) con abolladuras que dependen de la dirección: sigue siendo facetada, pero
  // ya no se lee como una pirámide de cuatro caras
  const dent = v => 1 + 0.22 * Math.sin(v[0] * 5.1 + 1.3) * Math.cos(v[2] * 4.3 - 0.7) + 0.12 * Math.sin(v[1] * 6.7 + v[0] * 2.9);
  const put = v => { const l = Math.hypot(...v), k = dent([v[0] / l, v[1] / l, v[2] / l]); return [v[0] / l * sx * k, Math.max(-0.3, v[1] / l * sy * k + sy * 0.35), v[2] / l * sz * k]; };
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const F4 = [];
  for (const f of F) { const a = V[f[0]], b = V[f[1]], c = V[f[2]], ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
    F4.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]); }
  // caras planas (vértices duplicados): roca facetada
  for (const f of F4) {
    const p = f.map(put);
    const ux = p[1][0] - p[0][0], uy = p[1][1] - p[0][1], uz = p[1][2] - p[0][2], vx = p[2][0] - p[0][0], vy = p[2][1] - p[0][1], vz = p[2][2] - p[0][2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    if (nx * p[0][0] + ny * p[0][1] + nz * p[0][2] < 0) { nx = -nx; ny = -ny; nz = -nz; }
    const base = g.P.length / 3;
    for (const q of p) { g.P.push(q[0], q[1], q[2]); g.N.push(nx, ny, nz); g.C.push(0.7 + 0.3 * Math.max(ny, 0), 0, 0, 2); }
    g.I.push(base, base + 1, base + 2);
  }
}
// tarjeta de hojas: dos cuadriláteros cruzados (uno de cara a n, otro de canto) con la textura de hojas recortada por alfa.
// tile 0: ramillete de agujas de pino · tile 1: hojas de encina / lentisco. n: normal hacia fuera de la copa (la luz)
function card(g, cx, cy, cz, sz, nx, ny, nz, tile, ao, Htop) {
  const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
  let ax = Math.abs(ny) < 0.9 ? 0 : 1, ay = Math.abs(ny) < 0.9 ? 1 : 0, az = 0;
  let t1x = ay * nz - az * ny, t1y = az * nx - ax * nz, t1z = ax * ny - ay * nx; let q = Math.hypot(t1x, t1y, t1z); t1x /= q; t1y /= q; t1z /= q;
  let t2x = ny * t1z - nz * t1y, t2y = nz * t1x - nx * t1z, t2z = nx * t1y - ny * t1x;
  const ph = rnd(6.2832), c = Math.cos(ph), s = Math.sin(ph);
  const ux = t1x * c + t2x * s, uy = t1y * c + t2y * s, uz = t1z * c + t2z * s, vx = t2x * c - t1x * s, vy = t2y * c - t1y * s, vz = t2z * c - t1z * s;
  const u0 = tile * 0.5;
  for (const [ax2, ay2, az2, bx, by, bz] of [[ux, uy, uz, vx, vy, vz], [ux, uy, uz, nx * 0.8 + vx * 0.2, ny * 0.8 + vy * 0.2, nz * 0.8 + vz * 0.2]]) {
    const base = g.P.length / 3;
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const x = cx + (ax2 * a + bx * b) * sz, y = cy + (ay2 * a + by * b) * sz, z = cz + (az2 * a + bz * b) * sz;
      g.P.push(x, y, z); g.N.push(nx, ny, nz); g.C.push(ao, Math.min(1, Math.max(0, y / Htop)), 0, 6);
      g.UV.push(g.P.length / 3 - 1, u0 + (a * 0.5 + 0.5) * 0.5, b * 0.5 + 0.5);
    }
    g.I.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
}
// cartel lejano (parte 7): un cuadrilátero que el VS orienta a la cámara alrededor del centro de la copa. position = (u, v, 0)
// (v = -2: se alarga hacia abajo para el tronco); normal = (radio horizontal, radio vertical, altura del centro)
// G1V1: tile = tesela del atlas de impostores (0 piñonero, 1 carrasco, 2 encina, 3 mata) en vC.g; sin tesela (cañas), la
// silueta procedimental de antes
function board(rx, ry, cy, trunk, tile) {
  const g = G(), vb = trunk ? -2 : -1, tg = tile === undefined ? 0 : (tile + 0.5) / 4;
  for (const [u, v] of [[-1, vb], [1, vb], [1, 1], [-1, 1]]) { g.P.push(u, v, 0); g.N.push(rx, ry, cy); g.C.push(1, tg, trunk ? 1 : 0, 7); }
  g.I.push(0, 1, 2, 0, 2, 3); return pack(g);
}
function pack(g) {
  const nv = g.P.length / 3, U = new Float32Array(nv * 2);
  for (let v = 0; v < nv; v++) { U[v * 2] = 0.25; U[v * 2 + 1] = 0.5; }
  for (let k = 0; k < g.UV.length; k += 3) { U[g.UV[k] * 2] = g.UV[k + 1]; U[g.UV[k] * 2 + 1] = g.UV[k + 2]; }
  return { P: new Float32Array(g.P), N: new Float32Array(g.N), C: new Float32Array(g.C), I: new Uint32Array(g.I), U };
}

// especies: tres niveles de geometría (lv 0 cerca, 1 media, 2 lejos)
// nivel 0: copas de tarjetas de hojas sobre un núcleo bajo y oscuro (de cerca: ramilletes, huecos, silueta irregular);
// nivel 1: copas de bultos de pocos polígonos; nivel 2: cartel orientado a la cámara (2 triángulos)
function shellCards(g, cx, cy, cz, rx, ry, rz, n, sz0, sz1, tile, Htop, upOnly) {
  for (let k = 0; k < n; k++) {
    const a = rnd(6.2832), e = upOnly ? Math.acos(rnd(0.15, 1)) : Math.acos(rnd(-0.55, 1)), sx = Math.sin(e) * Math.cos(a), sy = Math.cos(e), sz = Math.sin(e) * Math.sin(a);
    const k2 = rnd(0.78, 1.0);
    card(g, cx + sx * rx * k2, cy + sy * ry * k2, cz + sz * rz * k2, rnd(sz0, sz1), sx / rx, sy / ry, sz / rz, tile, 0.62 + 0.38 * (sy * 0.5 + 0.5), Htop);
  }
}
function pinea(lv) {   // pino piñonero: tronco alto que se abre en ramas y una copa plana de ramilletes (sombrilla)
  _s = 11; const g = G(), H = 8.2;
  if (lv === 2) return board(3.9, 1.5, 6.7, true, 0);
  cyl(g, 0, -0.3, 0, 0.35, 5.6, 0.15, 0.3, 0.16, [7, 4][lv], 1, H);
  if (lv === 0) {
    for (const [bx, by, bz] of [[-1.6, 6.4, 0.9], [1.9, 6.3, -0.8], [0.4, 6.5, 1.9], [0.6, 6.4, -1.9]]) cyl(g, 0.3, 4.9, 0.13, bx, by, bz, 0.12, 0.06, 3, 1, H);
    blob(g, 0.3, 6.45, 0.1, 3.1, 0.5, 2.9, 2, 7, 0, 0.06, H);
    for (let k = 0; k < 19; k++) { const a = rnd(6.2832), r = Math.sqrt(rnd(0.02, 1)) * 3.4, t = r / 3.6;
      card(g, 0.3 + Math.cos(a) * r, 6.8 + 0.4 * (1 - t * t) + rnd(-0.18, 0.18), 0.1 + Math.sin(a) * r, rnd(1.05, 1.5), Math.cos(a) * t * 0.7, 1, Math.sin(a) * t * 0.7, 0, 0.75 + 0.25 * (1 - t), H); }
  } else {   // G1V1: nivel medio de tarjetas grandes sobre un núcleo bajo (antes, un bulto liso: «bola»)
    for (const [bx, by, bz] of [[-1.6, 6.4, 0.9], [1.9, 6.3, -0.8]]) cyl(g, 0.3, 4.9, 0.13, bx, by, bz, 0.12, 0.06, 3, 1, H);
    blob(g, 0.3, 6.5, 0.1, 2.9, 0.45, 2.7, 2, 6, 0, 0.05, H);
    for (let k = 0; k < 11; k++) { const a = k / 11 * 6.2832 + rnd(-0.25, 0.25), r = k < 2 ? rnd(0, 0.8) : Math.sqrt(rnd(0.25, 1)) * 3.1, t = r / 3.6;
      card(g, 0.3 + Math.cos(a) * r, 6.85 + 0.35 * (1 - t * t) + rnd(-0.12, 0.12), 0.1 + Math.sin(a) * r, rnd(1.65, 2.05), Math.cos(a) * t * 0.7, 1, Math.sin(a) * t * 0.7, 0, 0.75 + 0.25 * (1 - t), H); }
  }
  return pack(g);
}
function halep(lv) {   // pino carrasco: tronco algo torcido y copa irregular y abierta, de ramilletes sueltos
  _s = 23; const g = G(), H = 9.5;
  if (lv === 2) return board(2.7, 2.5, 6.4, true, 1);
  cyl(g, 0, -0.3, 0, 0.5, 3.6, 0.2, 0.24, 0.17, [6, 3][lv], 1, H);
  const B = [[0.6, 5.6, 0.6, 1.9], [-0.4, 6.4, -0.6, 1.7], [0.3, 7.6, 0.1, 1.5], [1.3, 6.6, -0.8, 1.3]];
  if (lv === 0) {
    cyl(g, 0.5, 3.6, 0.2, 0.2, 7.2, -0.3, 0.17, 0.08, 5, 1, H);
    for (const b of B) { blob(g, b[0], b[1], b[2], b[3] * 0.7, b[3] * 0.5, b[3] * 0.66, 2, 5, 0, 0.1, H); shellCards(g, b[0], b[1], b[2], b[3] * 0.85, b[3] * 0.62, b[3] * 0.8, 4, 0.85, 1.2, 0, H, false); }
  } else for (const b of B) { blob(g, b[0], b[1], b[2], b[3] * 0.62, b[3] * 0.45, b[3] * 0.6, 2, 4, 0, 0.1, H); shellCards(g, b[0], b[1], b[2], b[3] * 0.8, b[3] * 0.6, b[3] * 0.78, 2, 1.25, 1.6, 0, H, false); }
  return pack(g);
}
function ilex(lv) {    // encina: tronco corto y copa redonda, densa y rugosa
  _s = 37; const g = G(), H = 6.6;
  if (lv === 2) return board(3.0, 2.4, 4.1, true, 2);
  cyl(g, 0, -0.3, 0, 0.1, 2.3, 0.05, 0.27, 0.2, [6, 3][lv], 1, H);
  if (lv === 0) { blob(g, 0.1, 4.0, 0, 2.55, 1.95, 2.4, 3, 7, 0, 0.1, H); shellCards(g, 0.1, 4.0, 0, 2.95, 2.3, 2.8, 20, 0.95, 1.35, 1, H, false); }
  else { blob(g, 0.1, 4.0, 0, 2.4, 1.8, 2.3, 2, 6, 0, 0.08, H); shellCards(g, 0.1, 4.0, 0, 2.85, 2.2, 2.7, 10, 1.45, 1.85, 1, H, false); }
  return pack(g);
}
function bush(lv) {    // arbusto (lentisco, coscoja): mata baja y rugosa
  _s = 51; const g = G(), H = 1.6;
  if (lv === 2) return board(1.35, 0.8, 0.55, false, 3);
  if (lv === 0) { blob(g, 0.1, 0.5, 0.2, 1.0, 0.65, 0.95, 2, 6, 0, 0.15, H); shellCards(g, 0.1, 0.5, 0.2, 1.2, 0.8, 1.1, 7, 0.5, 0.7, 1, H, true); }
  else { blob(g, 0.15, 0.45, 0.25, 1.0, 0.6, 0.95, 2, 5, 0, 0.1, H); shellCards(g, 0.15, 0.5, 0.25, 1.25, 0.8, 1.15, 4, 0.75, 0.95, 1, H, true); }
  return pack(g);
}
// G1V2: mata de hierba más baja, fina y poblada (antes, 11 hojas de hasta 1 m que se leían como pinchos sueltos)
function grass() { _s = 61; const g = G(); blades(g, 22, 0.22, 0.62, 0.032, 0.45, 3); return pack(g); }
function reed(lv) { if (lv) return board(0.9, 1.25, 1.25, false); _s = 71; const g = G(); blades(g, 9, 1.8, 2.9, 0.035, 0.12, 4); return pack(g); }
function stone() { _s = 81; const g = G(); rock(g, 0.9, 0.55, 0.75); return pack(g); }

// ------------------------------------------------------------------ shaders
const VS = `precision highp float;
attribute vec3 position; attribute vec3 normal; attribute vec4 color; attribute vec4 icol; attribute vec2 uv;
#include<instancesDeclaration>
uniform mat4 viewProjection; uniform vec3 uCam; uniform float uTime;
varying vec3 vPos; varying vec3 vN; varying vec4 vC; varying vec4 vI; varying vec2 vUV;
void main(){
#include<instancesVertex>
  vec4 wp;
  vC = color; vI = icol; vUV = uv;
  if (color.a > 6.5) {
    // cartel: copa orientada a la cámara. Desde arriba (|V.y| → 1) se ve redonda y el tronco se recoge
    float sx = length(finalWorld[0].xyz), sy = length(finalWorld[1].xyz);
    vec3 ctr = (finalWorld*vec4(0.0, normal.z, 0.0, 1.0)).xyz, V = normalize(uCam - ctr);
    vec3 R = normalize(cross(vec3(0.0, 1.0, 0.0), V) + vec3(1e-4, 0.0, 0.0)), U = cross(V, R);
    float ay = abs(V.y), ry = mix(normal.y*sy, normal.x*sx, ay*ay);
    float vy = position.y < -1.5 ? -1.0 - (normal.z*sy/ry)*(1.0 - ay) : position.y;
    wp = vec4(ctr + R*position.x*normal.x*sx + U*vy*ry, 1.0);
    vN = V; vUV = vec2(position.x, vy);
  } else { wp = finalWorld*vec4(position, 1.0); vN = normalize(mat3(finalWorld)*normal);
    // G1V1: viento en las tarjetas de hojas (6), la hierba (3) y las cañas (4): vaivén con la altura en la planta (vC.g) y
    // una racha que recorre el monte; fase por instancia (sin trabajo en la CPU)
    if (color.a > 2.5 && color.a < 6.5 && (color.a > 5.5 || color.a < 4.5)) {
      vec2 o = finalWorld[3].xz; float ph = dot(o, vec2(0.071, 0.053)), gust = 0.65 + 0.35*sin(uTime*0.37 + o.x*0.004 + o.y*0.003);
      float amp = (color.a > 5.5 ? 0.07 : 0.07)*color.g*color.g*gust*min(length(finalWorld[1].xyz), 1.6);
      wp.x += amp*(sin(uTime*1.7 + ph) + 0.45*sin(uTime*3.9 + ph*2.3 + position.y));
      wp.z += amp*0.7*(sin(uTime*1.3 + ph*1.4) + 0.4*sin(uTime*4.4 + ph + position.x));
      if (color.a > 5.5) wp.y += amp*0.25*sin(uTime*5.1 + ph*3.0 + position.x*2.0);
    }
  }
  vPos = wp.xyz;
  gl_Position = viewProjection*wp; }`;
// vI.rgb: color de la ortofoto bajo la planta (crudo, como lo lee FS_TER) · vI.a: azar por instancia (0–1)
const FS = `
varying vec3 vN; varying vec4 vC; varying vec4 vI; varying vec2 vUV; uniform vec4 uBand; uniform sampler2D tLeaf; uniform sampler2D tImp;
// G1V1: cobertura de alfa que no se pierde con los mipmaps (la tarjeta lejana no se deshace en puntos) y borde nítido
float cover(float a, vec2 uv, float sz){
  vec2 dx = dFdx(uv*sz), dy = dFdy(uv*sz); float lod = max(0.0, 0.5*log2(max(dot(dx, dx), dot(dy, dy))));
  a *= 1.0 + lod*0.28;
  return clamp((a - 0.45)/max(fwidth(a), 1e-4) + 0.5, 0.0, 1.0);
}
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
  if (part > 5.5) {
    // tarjetas de hojas (6) y carteles lejanos (7): mismo color de copa que el resto
    vec3 g = olive(vI.rgb);
    float lg = dot(g, vec3(0.3, 0.6, 0.1));
    vec3 pine = mix(vec3(0.20, 0.25, 0.13), vec3(0.27, 0.31, 0.17), rn);
    alb = mix(g*0.97, pine*mix(0.95, 1.15, lg*2.0), smoothstep(0.36, 0.55, lg)*0.7);
    alb *= mix(vec3(0.94, 1.0, 0.92), vec3(1.06, 1.0, 1.08), rn);
    if (part < 6.5) {
      vec4 t = texture2D(tLeaf, vUV);
      if (cover(t.a, vUV, 128.0) < 0.5) discard;
      alb *= (0.55 + 0.6*t.r)*mix(0.62, 1.0, ao);
      // la cara de la tarjeta que mira a la cámara: la normal de la copa, algo vuelta hacia el que mira (luz envolvente)
      vec3 nn = normalize(n*(dot(n, V) < 0.0 ? 0.6 : 1.0) + V*0.25 + vec3(0.0, 0.35, 0.0));
      c = lit(alb, nn);
      c += alb*vec3(1.0, 1.15, 0.6)*uSunCol*max(dot(-V, uSunDir), 0.0)*0.18*sunVis();
    } else {
      vec2 uv = vUV;
      vec3 R = normalize(cross(vec3(0.0, 1.0, 0.0), V) + vec3(1e-4, 0.0, 0.0)), U = cross(V, R);
      if (uv.y < -1.0) {                                // tronco bajo la copa (solo visto de lado)
        if (vC.b < 0.5 || abs(uv.x) > 0.075 || uv.y < -1.0 - 6.0*(1.0 - abs(V.y))) discard;
        alb = vec3(0.22, 0.17, 0.13); c = lit(alb, normalize(R*uv.x*8.0 + V));
      } else if (vC.g > 0.05) {
        // G1V1: impostor de verdad (atlas dibujado de ramilletes con su claroscuro), de lado y desde arriba; espejo por ejemplar
        float tl = floor(vC.g*4.0), top = smoothstep(0.5, 0.88, abs(V.y));
        vec2 q = vec2(clamp((rn > 0.5 ? -uv.x : uv.x)*0.5 + 0.5, 0.015, 0.985), clamp(uv.y*0.5 + 0.5, 0.015, 0.985));
        vec3 sd = texture2D(tImp, vec2((tl + q.x)*0.25, 0.5 + q.y*0.5)).rgb, tp = texture2D(tImp, vec2((tl + q.x)*0.25, q.y*0.5)).rgb;
        vec3 t = mix(sd, tp, top);
        // G1V2: la cobertura no adelgaza al bajar de mip (el bosque lejano se quedaba ralo): se engorda con el nivel de mip
        vec2 qx = dFdx(q*256.0), qy = dFdy(q*256.0); float lod = max(0.0, 0.5*log2(max(dot(qx, qx), dot(qy, qy))));
        float tg = t.g*(1.0 + lod*0.22);
        float cov = clamp((tg - 0.5)/max(fwidth(tg), 1e-4) + 0.5, 0.0, 1.0);
        if (cov < 0.5) discard;
        float z = sqrt(max(1.0 - dot(uv, uv)*0.8, 0.0));
        vec3 nn = normalize(R*uv.x*0.8 + U*(uv.y*0.6 + 0.35) + V*(z*0.7 + 0.3));
        alb *= 0.42 + 0.85*t.r;
        c = lit(alb, nn);
        c += alb*vec3(1.0, 1.15, 0.6)*uSunCol*max(dot(-V, uSunDir), 0.0)*0.12*sunVis();
      } else {
        float r = length(uv), cl = vnoise(uv*3.2 + rn*31.0)*0.65 + vnoise(uv*7.0 + rn*7.0)*0.35;
        if (r > 0.72 + 0.32*cl) discard;
        float z = sqrt(max(1.0 - r*r, 0.0));
        vec3 nn = normalize(R*uv.x + U*uv.y*0.9 + V*z*0.8 + vec3(0.0, 0.25, 0.0));
        alb *= (0.72 + 0.45*cl)*mix(0.7, 1.0, uv.y*0.5 + 0.5);
        c = lit(alb, nn);
      }
    }
  } else if (part < 0.5) {
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
    if (rim < 0.6 && cl < 0.85*(1.0 - rim/0.6)*nf) discard;
    n = normalize(n + (vec3(vnoise(q.xy + 1.3), vnoise(q.yz + 7.1), vnoise(q.zx + 4.4)) - 0.5)*1.1*nf);
    alb *= mix(0.62, 1.0, ao);
    c = lit(alb, normalize(n + vec3(0.0, 0.7, 0.0)));
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
    // vC.b: metros a lo largo de la pasarela: juntas entre tablones cada 0,25 m (se apagan de lejos)
    float j = abs(fract(vC.b/0.25) - 0.5);
    alb = vec3(0.50, 0.42, 0.32)*(0.85 + 0.25*hash21(vec2(floor(vC.b/0.25), 3.0)))*ao;
    alb *= 1.0 - 0.45*(1.0 - smoothstep(0.0, 0.035, 0.5 - j))*(1.0 - smoothstep(0.05, 0.2, px));
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
        else if (r > 135 && r < 186 && Math.abs(r - g) < 14 && r - b > 35) k = C_FARM;
        else if (r >= 120 && r <= 185 && r - b >= 12 && r - b <= 50 && r - g >= 2 && r - g <= 22) k = C_SCRUB;
        CLS[(y0 + y) * MW + x] = k;
        if (!(x & 1) && !((y0 + y) & 1)) { const c = (((y0 + y) >> 1) * CW + (x >> 1)) * 3; COL[c] = r; COL[c + 1] = g; COL[c + 2] = b; }
      }
    }
    // FIX3: la imagen descodificada pasa a transporte.js (césped de las paradas), que la cierra al terminar: no se descodifica dos veces
    ctx.groundBmp = bmp;
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
  // por tipo: geo = geometría por nivel; ends = fundido de salida de cada nivel [a, b] (el siguiente entra en el mismo
  // tramo); keep = fracción de plantas que se quedan en ese nivel (las lejanas se aclaran y engordan: grow); close = radio de
  // las que proyectan sombra (subconjunto del nivel 0)
  const S = { on: QS.get('nat') !== '0', q: 1 };
  // NAT2: el nivel 0 (tarjetas de hojas) llega a ~90 m, el 1 (bultos) a ~210 m y el 2 (carteles de 2 triángulos) a 1,3 km:
  // desde el aire y a media distancia se ve el bosque en relieve por muy poco (medido en stats().tris)
  const TREE = { ends: [[70, 90], [170, 210], [1050, 1300]], keep: [1, 1, 0.62], grow: [1, 1, 1.3], close: 55 };   // G1V2: más denso de lejos
  const TYPES = [
    Object.assign({ id: 'pinea', geo: [0, 1, 2].map(pinea), sc: [0.8, 1.25] }, TREE),
    Object.assign({ id: 'halep', geo: [0, 1, 2].map(halep), sc: [0.75, 1.2] }, TREE),
    Object.assign({ id: 'ilex', geo: [0, 1, 2].map(ilex), sc: [0.7, 1.2] }, TREE),
    { id: 'bush', geo: [0, 1, 2].map(bush), ends: [[50, 65], [130, 160], [480, 620]], keep: [1, 1, 0.5], grow: [1, 1, 1.2], close: 0, sc: [0.6, 1.4] },
    { id: 'grass', geo: [grass()], ends: [[85, 115]], keep: [1], grow: [1], close: 0, sc: [0.8, 1.5] },
    { id: 'reed', geo: [reed(0), reed(1)], ends: [[90, 120], [560, 720]], keep: [1, 0.6], grow: [1, 1.2], close: 0, sc: [0.8, 1.2] },
    { id: 'rock', geo: [stone()], ends: [[200, 250]], keep: [1], grow: [1], close: 0, sc: [0.5, 2.2] },
  ];
  // textura de hojas (una vez, en un lienzo): mitad izquierda, ramillete de agujas de pino; derecha, hojas de encina. El
  // color es un claroscuro gris (el verde lo pone el shader) y el alfa recorta. El centro de cada mitad es opaco (lo usan
  // los vértices que no son tarjetas, también en la sombra)
  const leafTex = (() => {
    const W = 256, Hh = 128, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
    const g2 = cv.getContext('2d'); _s = 97;
    const gray = v => { const k = Math.round(v * 255); return 'rgb(' + k + ',' + k + ',' + k + ')'; };
    g2.lineCap = 'round';
    for (let k = 0; k < 150; k++) {            // agujas: trazos finos que salen de varios brotes
      const bx = 64 + rnd(-14, 14), by = 64 + rnd(-14, 14), a = rnd(6.2832), L = rnd(26, 56);
      g2.strokeStyle = gray(rnd(0.45, 1)); g2.lineWidth = rnd(1.6, 2.8);
      g2.beginPath(); g2.moveTo(bx, by); g2.lineTo(bx + Math.cos(a) * L, by + Math.sin(a) * L); g2.stroke();
    }
    g2.fillStyle = gray(0.5); g2.beginPath(); g2.arc(64, 64, 15, 0, 6.2832); g2.fill();
    for (let k = 0; k < 170; k++) {            // hojas pequeñas y duras, más densas en el centro
      const r = Math.sqrt(rnd()) * 54, a = rnd(6.2832), x = 192 + Math.cos(a) * r, y = 64 + Math.sin(a) * r;
      g2.fillStyle = gray(rnd(0.4, 1)); g2.beginPath(); g2.ellipse(x, y, rnd(5, 8), rnd(2.6, 4), rnd(3.1416), 0, 6.2832); g2.fill();
    }
    g2.fillStyle = gray(0.5); g2.beginPath(); g2.arc(192, 64, 15, 0, 6.2832); g2.fill();
    const t = new BABYLON.DynamicTexture('natLeaf', cv, scene, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
    t.wrapU = t.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE; t.hasAlpha = true; t.update(false); return t;
  })();
  // G1V1 · atlas de impostores (4 especies × [de lado, desde arriba], teselas de 256 px): ramilletes con claroscuro (luz arriba,
  // sombra abajo y dentro), borde deshilachado de agujas u hojas. Canales: r = claroscuro, g = cobertura, b = 0, alfa opaco
  // (sin premultiplicar: los mipmaps no ensucian el borde de negro). Sustituye al disco de ruido de antes («bolas» lejanas)
  const impTex = (() => {
    const T = 256, W = T * 4, Hh = T * 2;
    const mk = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; return [cv, cv.getContext('2d', { willReadFrequently: true })]; };
    const [cS, gS] = mk(), [cC, gC] = mk();
    gS.fillStyle = 'rgb(115,115,115)'; gS.fillRect(0, 0, W, Hh); gC.fillStyle = '#000'; gC.fillRect(0, 0, W, Hh);
    gS.lineCap = gC.lineCap = 'round'; _s = 131;
    // especie: [rx, ry] del cartel (m) y reparto de ramilletes [x, y, r] en metros desde el centro de la copa
    const SPC = [[3.9, 1.5], [2.7, 2.5], [3.0, 2.4], [1.35, 0.8]];
    const side = k => { const o = [], [rx, ry] = SPC[k];
      if (k === 0) { for (let i = 0; i < 46; i++) { const x = rnd(-3.2, 3.2), t = x / 3.5, r = rnd(0.55, 0.9); o.push([x, -0.15 + 0.55 * (1 - t * t) + rnd(-0.35, 0.3), r]); }
        for (let i = 0; i < 10; i++) o.push([rnd(-2.2, 2.2), rnd(-0.75, -0.45), rnd(0.35, 0.55)]); }
      else if (k === 1) { for (let c = 0; c < 6; c++) { const cx = rnd(-1.7, 1.7), cy = rnd(-1.5, 1.5) * (1 - Math.abs(cx) / 3.2);
        for (let i = 0; i < 9; i++) o.push([cx + rnd(-0.6, 0.6), cy + rnd(-0.45, 0.45), rnd(0.32, 0.55)]); } }
      else if (k === 2) { for (let i = 0; i < 70; i++) { const a = rnd(6.2832), r = Math.sqrt(rnd()) * 0.8; o.push([Math.cos(a) * r * 2.3, Math.sin(a) * r * 1.75, rnd(0.45, 0.72)]); } }
      else { for (let i = 0; i < 26; i++) { const a = rnd(3.1416), r = Math.sqrt(rnd()) * 0.8; o.push([Math.cos(a) * r * 1.0, -0.35 + Math.sin(a) * r * 0.65, rnd(0.2, 0.36)]); } }
      return o.map(([x, y, r]) => [Math.max(-rx + r, Math.min(rx - r, x)), Math.max(-ry + r, Math.min(ry - r, y)), r]); };
    const topv = k => { const o = [], R = Math.min(SPC[k][0], 3.0) * 0.82, n = [60, 50, 70, 26][k];
      for (let i = 0; i < n; i++) { const a = rnd(6.2832), d = Math.sqrt(rnd()) * (k === 1 && i % 3 ? 0.9 : 0.8); o.push([Math.cos(a) * d * R, Math.sin(a) * d * R, rnd(0.45, 0.8) * R / 3]); }
      return o.map(([x, y, r]) => [x / R * (SPC[k][0] - r), y / R * (SPC[k][1] * 0 + SPC[k][0] - r) * 0.97, r]); };
    for (let k = 0; k < 4; k++) for (let v = 0; v < 2; v++) {
      const [rx, ry] = v ? [SPC[k][0], SPC[k][0]] : SPC[k], x0 = k * T, y0 = v ? T : 0, L = (v ? topv(k) : side(k)).sort((a, b) => v ? a[2] - b[2] : a[1] - b[1]);
      const PXx = x => x0 + (x / rx * 0.5 + 0.5) * T, PXy = y => y0 + (0.5 - y / ry * 0.5) * T, sx = T / 2 / rx, sy = T / 2 / ry;
      for (const [x, y, r] of L) {
        const cx = PXx(x), cy = PXy(y), ax = r * sx, ay = r * sy, hi = v ? 0.55 + 0.45 * (1 - Math.hypot(x / rx, y / ry)) : 0.45 + 0.4 * (y / ry * 0.5 + 0.5);
        const G2 = gS.createRadialGradient(cx - ax * 0.25, cy - ay * 0.35, 0, cx, cy, Math.max(ax, ay));
        G2.addColorStop(0, 'rgb(' + (255 * Math.min(1, hi + 0.25) | 0) + ',0,0)'); G2.addColorStop(1, 'rgb(' + (255 * hi * 0.38 | 0) + ',0,0)');
        for (const [g2, st] of [[gS, G2], [gC, '#fff']]) { g2.fillStyle = st; g2.beginPath(); g2.ellipse(cx, cy, ax * 0.78, ay * 0.78, 0, 0, 6.2832); g2.fill(); }
        // borde deshilachado: agujas (pinos) u hojitas (encina, mata)
        const nN = k < 2 ? 22 : 16;
        for (let i = 0; i < nN; i++) { const a = rnd(6.2832), r0 = rnd(0.45, 0.75), r1 = rnd(0.95, 1.18), sh = (hi * rnd(0.5, 1.15)) * 255 | 0;
          const p0x = cx + Math.cos(a) * ax * r0, p0y = cy + Math.sin(a) * ay * r0, p1x = cx + Math.cos(a) * ax * r1, p1y = cy + Math.sin(a) * ay * r1;
          for (const [g2, st] of [[gS, 'rgb(' + Math.min(255, sh) + ',0,0)'], [gC, '#fff']]) { g2.strokeStyle = st; g2.lineWidth = k < 2 ? 1.6 : 2.6; g2.beginPath(); g2.moveTo(p0x, p0y); g2.lineTo(p1x, p1y); g2.stroke(); } }
      }
    }
    const S2 = gS.getImageData(0, 0, W, Hh), C2 = gC.getImageData(0, 0, W, Hh).data, D = S2.data;
    for (let o = 0; o < D.length; o += 4) { D[o + 1] = C2[o]; D[o + 2] = 0; D[o + 3] = 255; }
    gS.putImageData(S2, 0, 0);
    const t = new BABYLON.DynamicTexture('natImp', cS, scene, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
    t.wrapU = t.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE; t.anisotropicFilteringLevel = 4; t.update(true); return t;
  })();
  const mats = [];
  function mat(name, band) { const m = mkMat('nat_' + name, VS, FS, ['position', 'normal', 'color', 'icol', 'uv'], ['uBand'], ['tLeaf', 'tImp']);
    m.setVector4('uBand', new BABYLON.Vector4(band[0], band[1], band[2], band[3])); m.setTexture('tLeaf', leafTex); m.setTexture('tImp', impTex); mats.push(m); return m; }
  function mesh(name, g, m, cast) {
    const me = new BABYLON.Mesh(name, scene);
    me.setVerticesData('position', g.P, false); me.setVerticesData('normal', g.N, false); me.setVerticesData('color', g.C, false, 4); me.setVerticesData('uv', g.U, false, 2); me.setIndices(g.I);
    me.material = m; me.isPickable = false; me.renderingGroupId = 1; me.alwaysSelectAsActiveMesh = true; me.doNotSyncBoundingInfo = true;
    me.thinInstanceSetBuffer('matrix', new Float32Array(16), 16, false); me.thinInstanceSetBuffer('icol', new Float32Array(4), 4, false); me.thinInstanceCount = 0;
    reg(me, cast ? { cast: true, alphaTex: leafTex, layer: 'nature' } : { cast: false, layer: 'nature' });
    return me;
  }
  // mallas por tipo: [sombra (nivel 0 cercano), nivel 0, nivel 1, nivel 2]
  for (const T of TYPES) {
    T.mesh = []; T.tri = [];
    T.geo.forEach((g, l) => {
      const a = l ? T.ends[l - 1] : [-2, -1], m = mat(T.id + l, [a[0], a[1], T.ends[l][0], T.ends[l][1]]);
      if (l === 0) { T.mesh.push(T.close ? mesh('nc_' + T.id, g, m, true) : null); T.tri.push(g.I.length / 3); }
      T.mesh.push(mesh('n' + l + '_' + T.id, g, m, false)); T.tri.push(g.I.length / 3);
    });
    T.R = T.ends[T.ends.length - 1][1];
  }
  const TI = {}; TYPES.forEach((T, k) => { TI[T.id] = k; });
  const RMAX = Math.max(...TYPES.map(T => T.R));

  // ---------------------------------------------------------------- celdas: reparto de plantas
  const NX = Math.ceil(WX / CS), NZ = Math.ceil(WZ / CS);
  const cells = new Map();             // ci → [por tipo: Float32Array (x, y, z, s, sy, rot, r, g, b, azar)]
  const hasRoad = (x, z, r) => city && city.roadDist(x, z) < r;
  const inBld = (x, z) => city && city.coverAt(x, z, -1) > -1e8;
  // REV4: pistas de tierra (clase 9: Carretera de les Aigües y caminos del monte) despejadas de copas: los pinos se plantan a
  // 7,5 m del borde de las pistas anchas (semiancho ≥ 1,5) y a 3,8 de las estrechas, para que la pista se lea entre el bosque
  const SEGS = ctx.SEG;
  const trackNear = (x, z, wide, narrow) => { if (!city || !SEGS) return false; const c = city.cellOf(x, z), R = city.ROADS;
    for (let k = R.start[c]; k < R.start[c + 1]; k++) { const o = R.list[k] * 6; if (SEGS[o + 5] !== 9) continue;
      const ax = SEGS[o], az = SEGS[o + 1], dx = SEGS[o + 2] - ax, dz = SEGS[o + 3] - az, l2 = dx * dx + dz * dz; let t = l2 > 0 ? ((x - ax) * dx + (z - az) * dz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      if (Math.hypot(x - ax - dx * t, z - az - dz * t) - SEGS[o + 4] < (SEGS[o + 4] >= 1.5 ? wide : narrow)) return true; }
    return false; };
  // probabilidades por muestra y clase: [pinea, halep, ilex, bush, grass, reed, rock]
  const PROB = {
    [C_FOREST]: [0.05, 0.11, 0.08, 0.15, 0.16, 0, 0.008],   // G1V2: más matorral y hierba bajo el pinar
    [C_PARK]: [0.045, 0.015, 0.025, 0.05, 0.40, 0, 0.003],
    [C_GRASS]: [0.006, 0.004, 0.006, 0.05, 0.45, 0.004, 0.004],
    [C_FARM]: [0, 0, 0, 0.006, 0.05, 0.008, 0],
    [C_SCRUB]: [0.012, 0.03, 0.012, 0.18, 0.24, 0, 0.03],
  };
  const CLEAR = [2.6, 2.6, 2.8, 1.3, 0.7, 0.9, 1.0];   // distancia mínima al borde de la calle
  // NAT2 · miradores y explanadas despejados: nada de plantas en la huella de los hitos (rectángulo ancho × largo girado
  // «rot», o su radio) más un margen, en unos miradores que no son hitos y alrededor de las vistas a pie o a poca altura
  // de BCN.views (que aún no existen al iniciar: se añaden en cuanto aparecen y se rehacen las celdas)
  const EXC = [];                      // { x, z, c, s, hx, hz } (rectángulo) o { x, z, r } (círculo)
  const MIRADORS = [
    [12230, 11930, 55],                // mirador de l'Alcalde (Montjuïc)
    [10806, 12120, 75],                // terrazas y escalinatas del MNAC
    [11548, 17657, 70],                // búnkers del Carmel (explanada y cimas del Turó de la Rovira)
    [7972, 17973, 95],                 // explanada del Tibidabo
    [11842, 11426, 125],               // Castell de Montjuïc con su foso y su glacis
  ];
  for (const m of MIRADORS) EXC.push({ x: m[0], z: m[1], r: m[2] });
  try {
    const LM = window.BCN && window.BCN.lm;
    if (LM) for (const it of LM.list()) { const r = LM.get(it.id); if (!r) continue;
      const a = (r.rot || 0) * Math.PI / 180, M = 18;
      if (r.ancho > 0 && r.largo > 0) EXC.push({ x: r.x, z: r.z, c: Math.cos(a), s: Math.sin(a), hx: r.ancho / 2 + M, hz: r.largo / 2 + M });
      else EXC.push({ x: r.x, z: r.z, r: Math.min(Math.max(r.r || 0, r.ext ? r.ext / 2 : 0, 10) + M, 110) }); }
  } catch (e) { console.warn('Naturaleza: sin huellas de hitos', e); }
  let excViews = false;
  function addViewExc() {
    const V = window.BCN && window.BCN.views; if (excViews || !V) return false;
    excViews = true;
    for (const [, v] of V) { if (!v || !isFinite(v.x)) continue;
      if (v.walk) EXC.push({ x: v.x, z: v.z, r: 22 }); else if (v.y - heightAt(v.x, v.z) < 60) EXC.push({ x: v.x, z: v.z, r: 30 }); }
    return true;
  }
  const exIn = (E, x, z, pad) => { for (const e of E) { const dx = x - e.x, dz = z - e.z;
    if (e.r !== undefined) { if (dx * dx + dz * dz < (e.r + pad) * (e.r + pad)) return true; }
    else if (Math.abs(dx * e.c - dz * e.s) < e.hx + pad && Math.abs(dx * e.s + dz * e.c) < e.hz + pad) return true; } return false; };
  // NAT2 · campos del delta: la misma parcelación que pinta FS_TER (app.js, «campos del delta»): franjas de 70 m giradas
  // FA rad y parcelas de 95 m desplazadas por franja; en las lindes (acequias) cañas, matas y algún árbol de ribera
  const FA = 0.62, FCa = Math.cos(FA), FSa = Math.sin(FA);
  const fieldEdge = (x, z) => { const u = x * FCa + z * FSa, v = -x * FSa + z * FCa, row = Math.floor(v / 70), fv = v - row * 70;
    let su = u + ((row * 0.618034) % 1 + 1) % 1 * 95; const fu = su - Math.floor(su / 95) * 95; return Math.min(fu, 95 - fu, fv, 70 - fv); };
  const PFARM = [0.004, 0.012, 0.01, 0.12, 0.10, 0.30, 0];
  function genCell(ci) {
    const i = ci % NX, j = (ci / NX) | 0, x0 = i * CS, z0 = j * CS;
    const EX = EXC.filter(e => { const R = e.r !== undefined ? e.r : Math.hypot(e.hx, e.hz); return e.x + R + 4 > x0 && e.x - R - 4 < x0 + CS && e.z + R + 4 > z0 && e.z - R - 4 < z0 + CS; });
    _s = (ci * 2654435761) | 0; rnd();
    const out = TYPES.map(() => []), tmp = [0, 0, 0];
    const PZ = window.BCN_PLAZAS, PAV = PZ && PZ.pavAt && (!PZ.pavAny || PZ.pavAny(x0 - 1, z0 - 1, x0 + CS + 1, z0 + CS + 1)) ? PZ.pavAt : null;
    const n = Math.floor(CS / STEP);
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++) {
      const x = x0 + (a + rnd()) * STEP, z = z0 + (b + rnd()) * STEP, u = rnd();
      const k = clsAt(x, z); let P = PROB[k]; if (!P) continue;
      if (k === C_FARM && fieldEdge(x, z) < 2.2) P = PFARM;
      let t = -1, acc = 0; for (let q = 0; q < 7; q++) { acc += P[q]; if (u < acc) { t = q; break; } }
      if (t < 0) continue;
      // las especies de árbol van por rodales (ruido de ~60 m) y el pino piñonero, abajo
      if (t <= 2) { const h = heightAt(x, z), s = Math.sin(x * 0.051 + Math.sin(z * 0.043) * 2.0) + Math.sin(z * 0.047 + x * 0.013) + rnd(-0.8, 0.8);
        t = s > 0.7 ? 2 : s < -0.6 && h < 250 ? 0 : (h > 330 && s > 0.1 ? 2 : 1); }
      if (k === C_SCRUB) { const h = heightAt(x, z); if (h < 70) continue; }
      if (hasRoad(x, z, CLEAR[t]) || inBld(x, z) || (EX.length && exIn(EX, x, z, t <= 2 ? 4 : 1))) continue;
      if (t <= 2 && (inBld(x + 2.5, z) || inBld(x - 2.5, z) || inBld(x, z + 2.5) || inBld(x, z - 2.5))) continue;
      const y = heightAt(x, z);
      // pendiente: los árboles no se plantan en cortados (> ~40°), las rocas los prefieren
      const gx = heightAt(x + 2, z) - heightAt(x - 2, z), gz = heightAt(x, z + 2) - heightAt(x, z - 2), sl = Math.hypot(gx, gz) / 4;
      if (t <= 3 && sl > 0.85) { if (rnd() < 0.5) t = 6; else continue; }
      if (t === 6 && sl < 0.15 && k !== C_SCRUB && rnd() < 0.6) continue;
      // REV4: pistas de tierra despejadas y nada plantado sobre el pavimento de las plazas (plataforma de plazas.js: el tronco
      // en la explanada de Catalunya). Al final, sobre las plantas ya aceptadas, porque pavAt recorre la lista de plazas
      if (t <= 3 && trackNear(x, z, t <= 2 ? 7.5 : 1.8, t <= 2 ? 3.8 : 0.9)) continue;
      if (PAV && PAV(x, z)) continue;
      const T = TYPES[t], s = rnd(T.sc[0], T.sc[1]);
      colAt(x, z, tmp, 0);
      out[t].push(x, y - (t === 6 ? 0.25 * s : 0.05), z, s, s * rnd(0.85, 1.15), rnd(6.2832), tmp[0], tmp[1], tmp[2], rnd());
    }
    return out.map(a => a.length ? new Float32Array(a) : null);
  }

  // ---------------------------------------------------------------- pasarelas de madera en la arena
  // En cada bloque de 120 m con playa: desde el borde de tierra de la arena hacia el agua por el camino más corto, hasta
  // ~10 m de la orilla. Tablones de 1,6 m de ancho en tramos de 2 m que siguen el suelo. Una sola malla fija (~100 k tri. como
  // mucho; medido en stats().walkTris), con una instancia para usar el mismo material
  let walkTris = 0;
  {
    const g = G(), B = 24, DIRS = []; for (let k = 0; k < 16; k++) DIRS.push([Math.cos(k * Math.PI / 8), Math.sin(k * Math.PI / 8)]);
    const cl = (i, j) => i < 0 || j < 0 || i >= MW || j >= MH ? C_NONE : CLS[j * MW + i];
    const placed = [];
    const box = (x0, z0, x1, z1, y0, y1, w, along0) => {   // tablero de x0,z0 a x1,z1, de ancho w, cara de arriba a y1
      const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), px = -dz / L * w / 2, pz = dx / L * w / 2, base = g.P.length / 3;
      const V = [[x0 - px, z0 - pz, y0, along0], [x0 + px, z0 + pz, y0, along0], [x1 + px, z1 + pz, y1, along0 + L], [x1 - px, z1 - pz, y1, along0 + L]];
      for (const v of V) { g.P.push(v[0], v[2], v[1]); g.N.push(0, 1, 0); g.C.push(1, 0, v[3], 5); }
      g.I.push(base, base + 2, base + 1, base, base + 3, base + 2);
      // cantos
      for (const [a, b, nx, nz] of [[0, 3, -px, -pz], [2, 1, px, pz]]) { const q = g.P.length / 3, A = V[a], Bv = V[b], l = Math.hypot(nx, nz);
        for (const v of [A, Bv]) { g.P.push(v[0], v[2], v[1], v[0], v[2] - 0.22, v[1]); g.N.push(nx / l, 0, nz / l, nx / l, 0, nz / l); g.C.push(0.7, 0, v[3], 5, 0.5, 0, v[3], 5); }
        g.I.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    };
    for (let bj = 0; bj < MH; bj += B) for (let bi = 0; bi < MW; bi += B) {
      let n = 0, sx = 0, sy = 0; for (let j = bj; j < bj + B; j++) for (let i = bi; i < bi + B; i++) if (cl(i, j) === C_SAND) { n++; sx += i; sy += j; }
      if (n < 60) continue;
      let ci = Math.round(sx / n), cj = Math.round(sy / n);
      if (cl(ci, cj) !== C_SAND) { let bd = 1e9; for (let j = bj; j < bj + B; j++) for (let i = bi; i < bi + B; i++) if (cl(i, j) === C_SAND) { const d = (i - ci) ** 2 + (j - cj) ** 2; if (d < bd) { bd = d; ci = i; cj = j; } } }
      // dirección al mar: la más corta de 16
      let best = null; for (const D of DIRS) for (let s = 1; s < 30; s++) { const k = cl(Math.round(ci + D[0] * s), Math.round(cj + D[1] * s));
        if (k === C_SEA) { if (!best || s < best[1]) best = [D, s]; break; } if (k !== C_SAND && k !== C_NONE) break; }
      if (!best) continue;
      const D = best[0]; let back = 0; while (back < 30 && cl(Math.round(ci - D[0] * (back + 1)), Math.round(cj - D[1] * (back + 1))) === C_SAND) back++;
      // en metros del mundo (z crece hacia el norte: la fila de la imagen, al revés)
      const ax = (ci - D[0] * back + 0.5) * PX, az = WZ - (cj - D[1] * back + 0.5) * PX, ux = D[0], uz = -D[1];
      const L = (back + best[1]) * PX - 12;
      if (L < 18 || placed.some(p => Math.hypot(p[0] - ax, p[1] - az) < 70)) continue;
      if (hasRoad(ax + ux * 3, az + uz * 3, 0.5)) continue;
      placed.push([ax, az]);
      for (let a = 0; a + 2 <= L; a += 2) { const x0 = ax + ux * a, z0 = az + uz * a, x1 = x0 + ux * 2, z1 = z0 + uz * 2;
        box(x0, z0, x1, z1, Math.max(heightAt(x0, z0), 0.2) + 0.12, Math.max(heightAt(x1, z1), 0.2) + 0.12, 1.6, a); }
    }
    if (g.I.length) {
      const pk = pack(g), mW = mat('walk', [-2, -1, 500, 700]), me = mesh('nWalk', pk, mW, false);
      me.thinInstanceSetBuffer('matrix', new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]), 16, true);
      me.thinInstanceSetBuffer('icol', new Float32Array([0.5, 0.5, 0.4, 0.5]), 4, true); me.thinInstanceCount = 1;
      walkTris = pk.I.length / 3;
    }
  }

  // ---------------------------------------------------------------- selección de instancias
  let queue = [], lastSel = null, dirty = false, nInst = TYPES.map(T => T.mesh.map(() => 0)), tris = 0, genMs = 0, genN = 0;
  const cellD = (ci, P) => { const i = ci % NX, j = (ci / NX) | 0;
    const dx = Math.max(i * CS - P.x, 0, P.x - (i + 1) * CS), dz = Math.max(j * CS - P.z, 0, P.z - (j + 1) * CS); return Math.hypot(dx, dz); };
  function plan(P, alt) {
    if (addViewExc()) cells.clear();
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
    const L = TYPES.map(T => T.mesh.map(() => []));
    for (const [ci, C] of cells) {
      if (cellD(ci, P) > RMAX + 2) continue;
      for (let t = 0; t < TYPES.length; t++) { const A = C[t]; if (!A) continue; const T = TYPES[t], E = T.ends, nl = E.length, Lt = L[t];
        for (let k = 0; k < A.length; k += 10) {
          const d = Math.hypot(A[k] - P.x, A[k + 1] + 3 - P.y, A[k + 2] - P.z); if (d > T.R + 2) continue;
          const r = A[k + 9];
          for (let l = 0; l < nl; l++) {
            if (d > E[l][1] + 2 || (l && d < E[l - 1][0] - 2) || r >= T.keep[l]) continue;
            Lt[l === 0 && d < T.close ? 0 : l + 1].push(A, k, T.grow[l]);
          }
        } }
    }
    tris = 0;
    for (let t = 0; t < TYPES.length; t++) for (let l = 0; l < TYPES[t].mesh.length; l++) {
      const me = TYPES[t].mesh[l]; if (!me) { nInst[t][l] = 0; continue; }
      const src = L[t][l], n = src.length / 3, M = getBuf(me.name + 'm', n * 16), Cc = getBuf(me.name + 'c', n * 4);
      for (let q = 0, w = 0, c = 0; q < src.length; q += 3, w += 16, c += 4) {
        const A = src[q], k = src[q + 1], gr = src[q + 2], s = A[k + 3] * gr, sy = A[k + 4] * gr, cs = Math.cos(A[k + 5]), sn = Math.sin(A[k + 5]);
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
    const o = { cells: cells.size, queue: queue.length, tris, walkTris, maskMs: Math.round(tMask), genMsPerCell: genN ? +(genMs / genN).toFixed(2) : 0 };
    TYPES.forEach((T, t) => { o[T.id] = nInst[t].slice(); });
    return o;
  }
  return { update, busy: () => queue.length > 0, stats, flush, setRange };
} };
})();
