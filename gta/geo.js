/* GTA Barcelona — Geometría, azar y tipos de material compartidos por todos los módulos. Sin dependencias.
   window.BCN_GEO:
     · K, regKind(), kindsGLSL(), kindsDecl(), kindsUniforms(): tipos de material del shader de detalle y registro de tipos nuevos;
     · GB (geometría acumulada) y las primitivas que escriben en él: planas (quad, rect, jamb, hpl, box, lattice…, obox, bar) y
       suaves, con normal por vértice (quadN, triN, rev, tube, sphere, cyl);
     · canal auxiliar de los vértices: pbrAux() (tipo K.PBR), subAux() (sustitutos de la capa BASE), latAux(), signAux();
     · seed(), R(), pick(), hash2(): azar reproducible POR ÁMBITO (un solo estado, pero cada consumidor siembra el suyo).
   Contratos y ejemplos de uso: DESARROLLO.md §6. */
(function () {
'use strict';

// ------------------------------------------------------------------ tipos de material (viajan en el alfa del color de vértice)
const K = { STUCCO: 0, STONE: 1, GLASS: 2, SHUT: 3, WOOD: 4, METAL: 5, IRON: 6, SGRAF: 7, SIGN: 8, AWN: 9, BAL: 10, GSHOP: 11, LAMP: 12, PLAIN: 13, LEAF: 14, PBR: 15 };
// Registro de tipos nuevos. Rangos de id reservados:
//   0–19 núcleo (facades.js) · 20–39 interiors.js · 40–59 details.js · 60–79 furniture.js · 80–99 ground.js
// regKind(nombre, id, glsl[, decl]) da de alta K[nombre] = id y su rama del shader de detalle (cuerpo GLSL, sin el «else if»).
// Hay que llamarlo AL CARGAR el script (nivel superior del módulo): facades.js monta el shader una sola vez, al iniciarse.
// `decl` (opcional) son declaraciones globales GLSL que la rama necesite: funciones auxiliares, uniformes o samplers propios.
// Los «uniform …;» de `decl` se dan de alta solos en los materiales de detalle (kindsUniforms): basta con fijarlos después
// con setTexture/setFloat… en ctx.detail.mats. Qué puede leer y escribir una rama: DESARROLLO.md §6.
const KINDS = [];
let sealed = false;
function regKind(name, id, glsl, decl) {
  if (sealed) throw new Error('regKind(' + name + '): el shader de detalle ya está montado; registra los tipos al cargar el script');
  if (!/^[A-Z][A-Z0-9_]*$/.test(name) || name in K) throw new Error('regKind: nombre repetido o no válido: ' + name);
  if (id !== (id | 0) || id < 20 || id > 255 || Object.values(K).indexOf(id) >= 0) throw new Error('regKind(' + name + '): id repetido o fuera de rango (20–255): ' + id);
  K[name] = id; KINDS.push({ name, id, glsl: glsl || '', decl: decl || '' });
  return id;
}
// ramas «else if» de los tipos registrados: facades.js las inserta en el shader de detalle antes de la rama final
const kindsGLSL = () => { sealed = true;
  return KINDS.map(k => ' else if (kind > ' + (k.id - 0.5).toFixed(1) + ' && kind < ' + (k.id + 0.5).toFixed(1) + ') {   // ' + k.name + '\n' + k.glsl + '\n  }').join(''); };
const kindsDecl = () => { sealed = true; return KINDS.map(k => k.decl).filter(d => d).join('\n'); };
// nombres de los uniformes y samplers declarados en los `decl`: facades.js los pasa a mkMat al crear los materiales de detalle
const kindsUniforms = () => { const uniforms = [], samplers = [];
  for (const k of KINDS) for (const m of k.decl.matchAll(/\buniform\s+(?:(?:lowp|mediump|highp)\s+)?(\w+)\s+([^;]+);/g))
    for (const nm of m[2].split(',')) (m[1].indexOf('sampler') === 0 ? samplers : uniforms).push(nm.replace(/\[.*/, '').trim());
  return { uniforms, samplers }; };

// ------------------------------------------------------------------ geometría acumulada (posición + color/tipo + auxiliar + normal)
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
// aux (opcional, en todas las primitivas): 16 bytes del canal auxiliar, 4 por vértice (pbrAux, subAux, latAux, signAux)
function quad(B, F, u0, y0, d0, u1, y1, d1, u2, y2, d2, u3, y3, d3, col, kind, aux) {
  if (!B) return;
  B.grow(4, 6);
  const v = B.nv, p = B.p, c = B.c, a = B.a;
  const U = [u0, u1, u2, u3], Y = [y0, y1, y2, y3], D = [d0, d1, d2, d3];
  // normal exacta del quad (plana: 4.º byte a 0, y el shader la orienta hacia la cámara)
  const ex = F.tx * (u1 - u0) + F.nx * (d1 - d0), ey = y1 - y0, ez = F.tz * (u1 - u0) + F.nz * (d1 - d0);
  const fx = F.tx * (u3 - u0) + F.nx * (d3 - d0), fy = y3 - y0, fz = F.tz * (u3 - u0) + F.nz * (d3 - d0);
  let nx = ey * fz - ez * fy, ny = ez * fx - ex * fz, nz = ex * fy - ey * fx; const nl = Math.hypot(nx, ny, nz) || 1;
  nx = Math.round(nx / nl * 127 + 128); ny = Math.round(ny / nl * 127 + 128); nz = Math.round(nz / nl * 127 + 128);
  const N = B.n;
  for (let k = 0; k < 4; k++) {
    const o = (v + k) * 3;
    p[o] = F.x + F.tx * U[k] + F.nx * D[k]; p[o + 1] = Y[k]; p[o + 2] = F.z + F.tz * U[k] + F.nz * D[k];
    const q = (v + k) * 4; N[q] = nx; N[q + 1] = ny; N[q + 2] = nz; N[q + 3] = 0; c[q] = col[0]; c[q + 1] = col[1]; c[q + 2] = col[2]; c[q + 3] = kind;
    if (aux) { a[q] = aux[k * 4]; a[q + 1] = aux[k * 4 + 1]; a[q + 2] = aux[k * 4 + 2]; a[q + 3] = aux[k * 4 + 3]; }
    else { a[q] = 0; a[q + 1] = 0; a[q + 2] = 0; a[q + 3] = 0; }
  }
  const i = B.i, n = B.ni; i[n] = v; i[n + 1] = v + 1; i[n + 2] = v + 2; i[n + 3] = v; i[n + 4] = v + 2; i[n + 5] = v + 3;
  B.nv += 4; B.ni += 6;
}
// rectángulo en el plano de fachada (profundidad d)
const rect = (B, F, u0, u1, y0, y1, d, col, k, aux) => {
  if (u1 - u0 < 1e-3 || y1 - y0 < 1e-3) return;
  if (d === 0 && (k === 0 || k === 1)) { u0 -= 0.012; u1 += 0.012; y0 -= 0.012; y1 += 0.012; }   // los paños de muro se solapan: sin grietas
  quad(B, F, u0, y0, d, u1, y0, d, u1, y1, d, u0, y1, d, col, k, aux); };
// plano perpendicular a la fachada en u (jamba, derrame lateral)
const jamb = (B, F, u, y0, y1, d0, d1, col, k, aux) => { if (y1 - y0 > 1e-3) quad(B, F, u, y0, d0, u, y0, d1, u, y1, d1, u, y1, d0, col, k, aux); };
// plano horizontal a altura y (dintel, alféizar)
const hpl = (B, F, u0, u1, y, d0, d1, col, k, aux) => { if (u1 - u0 > 1e-3) quad(B, F, u0, y, d0, u1, y, d0, u1, y, d1, u0, y, d1, col, k, aux); };
// caja adosada: frente, techo, suelo y laterales (sin cara trasera, que queda contra el muro)
function box(B, F, u0, u1, y0, y1, d0, d1, col, k, mask, aux) {
  if (!B || u1 - u0 < 1e-3 || y1 - y0 < 1e-3) return;
  k = k || 0; mask = mask === undefined ? 7 : mask;
  quad(B, F, u0, y0, d1, u1, y0, d1, u1, y1, d1, u0, y1, d1, col, k, aux);
  if (mask & 1) hpl(B, F, u0, u1, y1, d0, d1, shade(col, 1.04), k, aux);
  if (mask & 2) hpl(B, F, u0, u1, y0, d0, d1, shade(col, 0.8), k, aux);
  if (mask & 4) { jamb(B, F, u0, y0, y1, d0, d1, shade(col, 0.9), k, aux); jamb(B, F, u1, y0, y1, d0, d1, shade(col, 0.9), k, aux); }
}
// paño calado (forja o balaustrada): v de 0 (abajo) a 255 (arriba) en el canal auxiliar
const latAux = vr => { const w = vr ? 255 : 0; return [0, w, 0, 0, 0, w, 0, 0, 255, w, 0, 0, 255, w, 0, 0]; };
const lattice = (B, F, u0, u1, y0, y1, d, col, k, variant) => { if (u1 - u0 > 1e-3) quad(B, F, u0, y0, d, u1, y0, d, u1, y1, d, u0, y1, d, col, k, latAux(variant)); };
const latticeSide = (B, F, u, y0, y1, d0, d1, col, k, variant) => { if (d1 - d0 > 1e-3) quad(B, F, u, y0, d0, u, y0, d1, u, y1, d1, u, y1, d0, col, k, latAux(variant)); };

const shade = (c, f) => [Math.min(255, c[0] * f) | 0, Math.min(255, c[1] * f) | 0, Math.min(255, c[2] * f) | 0];
const mixc = (a, b, t) => [(a[0] + (b[0] - a[0]) * t) | 0, (a[1] + (b[1] - a[1]) * t) | 0, (a[2] + (b[2] - a[2]) * t) | 0];
const signAux = id => [0, 0, id, 0, 255, 0, id, 0, 255, 255, id, 0, 0, 255, id, 0];
// auxiliar del tipo K.PBR (el color de vértice es el albedo): rugosidad y metal de 0 a 1, variante de patrón (entero:
// 0 liso · 1 lamas horizontales · 2 nervios verticales · 3 pintura gastada) y emisión de 0 a 1 (0,5 = brilla con su propio color)
const pbrAux = (rough, metal, pat, emis) => { const a = [Math.round(Math.min(1, Math.max(0, rough)) * 255), Math.round(Math.min(1, Math.max(0, metal || 0)) * 255), pat | 0, Math.round(Math.min(1, Math.max(0, emis || 0)) * 250)];
  return a.concat(a, a, a); };
// auxiliar de un SUSTITUTO (w = 255; solo tiene efecto en la capa BASE de una fachada): el quad se descarta, con tramado, cuando
// la capa ORNAMENTO de su celda existe y está cerca. Sin argumento, auxiliar a cero; con él, copia de ese auxiliar con w = 255
const subAux = aux => { const a = aux ? Array.from(aux) : new Array(16).fill(0); a[3] = a[7] = a[11] = a[15] = 255; return a; };

// ------------------------------------------------------------------ primitivas suaves: normal propia por vértice
// La normal viaja con 255 en su 4.º byte («suave») y el shader de detalle NO la voltea hacia la cámara: las superficies suaves
// son cerradas (o adosadas por detrás) y sus normales miran hacia fuera. Puntos y normales van en el marco F, como [u, y, d]
// (con F0, coordenadas locales de celda [x, y, z]). Los vértices se comparten entre caras: el sombreado no tiene facetas.
function vert(B, F, u, y, d, nu, ny, nd, col, kind, aux, ao) {
  const v = B.nv++, o = v * 3, q = v * 4, l = Math.hypot(nu, ny, nd) || 1, p = B.p, N = B.n, c = B.c, a = B.a;
  p[o] = F.x + F.tx * u + F.nx * d; p[o + 1] = y; p[o + 2] = F.z + F.tz * u + F.nz * d;
  N[q] = Math.round((F.tx * nu + F.nx * nd) / l * 127 + 128); N[q + 1] = Math.round(ny / l * 127 + 128); N[q + 2] = Math.round((F.tz * nu + F.nz * nd) / l * 127 + 128); N[q + 3] = 255;
  c[q] = col[0]; c[q + 1] = col[1]; c[q + 2] = col[2]; c[q + 3] = kind;
  if (aux) { a[q] = aux[ao]; a[q + 1] = aux[ao + 1]; a[q + 2] = aux[ao + 2]; a[q + 3] = aux[ao + 3]; }
  else { a[q] = 0; a[q + 1] = 0; a[q + 2] = 0; a[q + 3] = 0; }
  return v;
}
// cuadrilátero y triángulo con una normal por vértice: P = [[u, y, d], …] y N = [[nu, ny, nd], …] (no hace falta normalizarlas)
function quadN(B, F, P, N, col, kind, aux) {
  if (!B) return;
  B.grow(4, 6); const v = B.nv, i = B.i, n = B.ni;
  for (let k = 0; k < 4; k++) vert(B, F, P[k][0], P[k][1], P[k][2], N[k][0], N[k][1], N[k][2], col, kind, aux, k * 4);
  i[n] = v; i[n + 1] = v + 1; i[n + 2] = v + 2; i[n + 3] = v; i[n + 4] = v + 2; i[n + 5] = v + 3; B.ni += 6;
}
function triN(B, F, P, N, col, kind, aux) {
  if (!B) return;
  B.grow(3, 3); const v = B.nv, i = B.i, n = B.ni;
  for (let k = 0; k < 3; k++) vert(B, F, P[k][0], P[k][1], P[k][2], N[k][0], N[k][1], N[k][2], col, kind, aux, k * 4);
  i[n] = v; i[n + 1] = v + 1; i[n + 2] = v + 2; B.ni += 3;
}
// torno: perfil [[r, y], …] recorrido de abajo arriba por fuera, alrededor del eje vertical que pasa por (u, d).
//   · un punto repetido marca una arista viva; un punto con r = 0 cierra en el eje (con normal vertical);
//   · cada punto admite un tercer valor, el color de su anillo: [r, y, [r, g, b]] (entre anillos el color se funde);
//   · o (opcional): { aux, cap: 1 tapa plana arriba · 2 abajo · 3 las dos, a0 y a1: arco parcial en radianes (0 = +u, π/2 = +d) }
// Triángulos: 2·lados por tramo del perfil (lados si toca el eje) y lados − 2 por tapa.
function rev(B, F, u, d, prof, sides, col, kind, o) {
  const n = prof ? prof.length : 0; if (!B || n < 2 || sides < 3) return;
  o = o || {};
  const aux = o.aux, a0 = o.a0 || 0, full = o.a1 === undefined, da = ((full ? a0 + 2 * Math.PI : o.a1) - a0) / sides, cols = full ? sides : sides + 1, E = 1e-6;
  // normal de cada punto del perfil: suma de las de sus dos tramos (un tramo nulo —punto repetido— no cuenta: arista viva)
  const nr = new Float64Array(n), ny = new Float64Array(n), base = new Int32Array(n);
  for (let k = 0; k + 1 < n; k++) { const dr = prof[k + 1][0] - prof[k][0], dy = prof[k + 1][1] - prof[k][1], l = Math.hypot(dr, dy); if (l < E) continue;
    nr[k] += dy / l; ny[k] -= dr / l; nr[k + 1] += dy / l; ny[k + 1] -= dr / l; }
  B.grow((n + 2) * cols, (n + 1) * sides * 6);
  for (let k = 0; k < n; k++) { const r = prof[k][0], y = prof[k][1], c = prof[k][2] || col; base[k] = B.nv;
    if (r < E) { vert(B, F, u, y, d, 0, ny[k] < 0 ? -1 : 1, 0, c, kind, aux, 0); continue; }
    for (let j = 0; j < cols; j++) { const a = a0 + j * da, ca = Math.cos(a), sa = Math.sin(a); vert(B, F, u + ca * r, y, d + sa * r, ca * nr[k], ny[k], sa * nr[k], c, kind, aux, 0); } }
  const i = B.i;
  for (let k = 0; k + 1 < n; k++) { const r0 = prof[k][0], r1 = prof[k + 1][0], b0 = base[k], b1 = base[k + 1];
    if (Math.hypot(r1 - r0, prof[k + 1][1] - prof[k][1]) < E || (r0 < E && r1 < E)) continue;
    for (let j = 0; j < sides; j++) { const j1 = full ? (j + 1) % sides : j + 1;
      if (r0 < E) { i[B.ni++] = b0; i[B.ni++] = b1 + j1; i[B.ni++] = b1 + j; }
      else if (r1 < E) { i[B.ni++] = b0 + j; i[B.ni++] = b0 + j1; i[B.ni++] = b1; }
      else { i[B.ni++] = b0 + j; i[B.ni++] = b0 + j1; i[B.ni++] = b1 + j1; i[B.ni++] = b0 + j; i[B.ni++] = b1 + j1; i[B.ni++] = b1 + j; } } }
  for (const top of [1, 0]) { const q = prof[top ? n - 1 : 0]; if (!(o.cap & (top ? 1 : 2)) || q[0] < E) continue;
    const b = B.nv, c = q[2] || col;
    for (let j = 0; j < cols; j++) { const a = a0 + j * da; vert(B, F, u + Math.cos(a) * q[0], q[1], d + Math.sin(a) * q[0], 0, top ? 1 : -1, 0, c, kind, aux, 0); }
    for (let j = 1; j + 1 < cols; j++) { i[B.ni++] = b; i[B.ni++] = b + j; i[B.ni++] = b + j + 1; } }
}
// tubo a lo largo de una polilínea [[u, y, d], …]: radio constante o función r(t) (t de 0 a 1, por puntos). Los codos van a
// inglete (el grosor se conserva). o (opcional): { aux, closed: true = anillo cerrado (rueda, aro), caps: true = tapas planas }
// Triángulos: 2·lados por tramo (y lados − 2 por tapa).
function tube(B, F, pts, r, sides, col, kind, o) {
  const n = pts ? pts.length : 0; if (!B || n < 2 || sides < 3) return;
  o = o || {};
  const aux = o.aux, closed = !!o.closed && n > 2, ns = closed ? n : n - 1, fr = typeof r === 'function';
  // por punto: tangente t (bisectriz de los dos tramos), eje del inglete m y cuánto estira, y un vector u perpendicular a t
  // transportado de punto en punto (así el tubo no se retuerce)
  const Dx = new Float64Array(ns), Dy = new Float64Array(ns), Dz = new Float64Array(ns), G = new Float64Array(n * 10);
  for (let k = 0; k < ns; k++) { const a = pts[k], b = pts[(k + 1) % n], x = b[0] - a[0], y = b[1] - a[1], z = b[2] - a[2], l = Math.hypot(x, y, z) || 1; Dx[k] = x / l; Dy[k] = y / l; Dz[k] = z / l; }
  let ux = 0, uy = 0, uz = 0;
  const carry = (tx, ty, tz) => { const dt = ux * tx + uy * ty + uz * tz; ux -= tx * dt; uy -= ty * dt; uz -= tz * dt; let l = Math.hypot(ux, uy, uz);
    if (l < 1e-4) { ux = -tz; uy = 0; uz = tx; l = Math.hypot(ux, uz); if (l < 1e-4) { ux = 1; uz = 0; l = 1; } } ux /= l; uy /= l; uz /= l; };
  for (let k = 0; k < n; k++) {
    const i = closed ? (k + ns - 1) % ns : k - 1, j = closed || k < ns ? k : -1, g = k * 10;   // tramo que llega y tramo que sale
    let tx, ty, tz, mx = 0, my = 0, mz = 0, st = 0;
    if (i >= 0 && j >= 0) { tx = Dx[i] + Dx[j]; ty = Dy[i] + Dy[j]; tz = Dz[i] + Dz[j]; const tl = Math.hypot(tx, ty, tz);
      if (tl < 1e-3) { tx = Dx[j]; ty = Dy[j]; tz = Dz[j]; }
      else { tx /= tl; ty /= tl; tz /= tl; mx = Dx[j] - Dx[i]; my = Dy[j] - Dy[i]; mz = Dz[j] - Dz[i]; const ml = Math.hypot(mx, my, mz);
        if (ml > 1e-4) { mx /= ml; my /= ml; mz /= ml; st = Math.min(3, 2 / tl) - 1; } } }
    else { const e = i >= 0 ? i : j; tx = Dx[e]; ty = Dy[e]; tz = Dz[e]; }
    carry(tx, ty, tz);
    G[g] = tx; G[g + 1] = ty; G[g + 2] = tz; G[g + 3] = ux; G[g + 4] = uy; G[g + 5] = uz; G[g + 6] = mx; G[g + 7] = my; G[g + 8] = mz; G[g + 9] = st;
  }
  // anillo cerrado: lo que el marco haya girado al dar la vuelta (nada si la curva es plana) se reparte entre los puntos
  let twist = 0;
  if (closed) { const tx = G[0], ty = G[1], tz = G[2], x = G[3], y = G[4], z = G[5]; carry(tx, ty, tz);
    twist = Math.atan2((x * (uy * tz - uz * ty) + y * (uz * tx - ux * tz) + z * (ux * ty - uy * tx)), x * ux + y * uy + z * uz); }
  B.grow((n + 2) * sides, (ns + 2) * sides * 6);
  // anillo del punto k; con `ax` (±1) emite la tapa: mismos puntos, normal a lo largo del eje
  const ring = (k, ax) => { const g = k * 10, tx = G[g], ty = G[g + 1], tz = G[g + 2], x = G[g + 3], y = G[g + 4], z = G[g + 5], mx = G[g + 6], my = G[g + 7], mz = G[g + 8], st = G[g + 9];
    const wx = ty * z - tz * y, wy = tz * x - tx * z, wz = tx * y - ty * x, P = pts[k], rk = fr ? r(closed ? k / n : k / (n - 1)) : r, tw = twist * k / n;
    for (let s = 0; s < sides; s++) { const a = s / sides * 2 * Math.PI - tw, ca = Math.cos(a), sa = Math.sin(a), ox = x * ca + wx * sa, oy = y * ca + wy * sa, oz = z * ca + wz * sa, e = (ox * mx + oy * my + oz * mz) * st;
      if (ax) vert(B, F, P[0] + (ox + mx * e) * rk, P[1] + (oy + my * e) * rk, P[2] + (oz + mz * e) * rk, tx * ax, ty * ax, tz * ax, col, kind, aux, 0);
      else vert(B, F, P[0] + (ox + mx * e) * rk, P[1] + (oy + my * e) * rk, P[2] + (oz + mz * e) * rk, ox, oy, oz, col, kind, aux, 0); } };
  const first = B.nv, i = B.i;
  for (let k = 0; k < n; k++) ring(k, 0);
  for (let k = 0; k < ns; k++) { const b0 = first + k * sides, b1 = first + ((k + 1) % n) * sides;
    for (let s = 0; s < sides; s++) { const s1 = (s + 1) % sides; i[B.ni++] = b0 + s; i[B.ni++] = b0 + s1; i[B.ni++] = b1 + s1; i[B.ni++] = b0 + s; i[B.ni++] = b1 + s1; i[B.ni++] = b1 + s; } }
  if (o.caps && !closed) for (const k of [0, n - 1]) { const b = B.nv; ring(k, k ? 1 : -1); for (let s = 1; s + 1 < sides; s++) { i[B.ni++] = b; i[B.ni++] = b + s; i[B.ni++] = b + s + 1; } }
}
// esfera centrada en (u, y, d); con sy (radio vertical / radio) sale un elipsoide. Triángulos: gajos·(2·anillos − 2)
function sphere(B, F, u, y, d, r, segs, rings, col, kind, aux, sy) {
  if (!B || rings < 2) return;
  const prof = []; for (let k = 0; k <= rings; k++) { const t = Math.PI * k / rings; prof.push([k === 0 || k === rings ? 0 : r * Math.sin(t), y - r * (sy || 1) * Math.cos(t)]); }
  rev(B, F, u, d, prof, segs, col, kind, { aux });
}

// ------------------------------------------------------------------ piezas sueltas (mobiliario): coordenadas locales de celda
const F0 = { x: 0, z: 0, tx: 1, tz: 0, nx: 0, nz: 1 };
// tronco de cono vertical con tapa arriba, de normales suaves (un torno de dos puntos)
function cyl(B, x, z, y0, y1, r0, r1, sides, col, kind, aux) { rev(B, F0, x, z, [[r0, y0], [r1, y1]], sides, col, kind, { aux, cap: 1 }); }
// caja orientada: centro (x,z), base y, medidas a lo largo (l), ancho (w), alto (h), ángulo a
function obox(B, x, z, y, l, w, h, a, col, kind, aux) {
  const F = { x: x - Math.cos(a) * l / 2 + Math.sin(a) * w / 2, z: z - Math.sin(a) * l / 2 - Math.cos(a) * w / 2, tx: Math.cos(a), tz: Math.sin(a), nx: -Math.sin(a), nz: Math.cos(a) };
  box(B, F, 0, l, y, y + h, 0, w, col, kind, 7, aux);
  quad(B, F, 0, y, 0, l, y, 0, l, y + h, 0, 0, y + h, 0, shade(col, 0.85), kind, aux);
}
// barra de sección cuadrada entre dos puntos (listones, travesaños…); para tubos redondos, tube()
function bar(B, a, b, r, col, kind, aux) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1, ux = dx / L, uy = dy / L, uz = dz / L;
  let px = -uz, py = 0, pz = ux, pl = Math.hypot(px, py, pz); if (pl < 1e-3) { px = 1; py = 0; pz = 0; pl = 1; } px /= pl; py /= pl; pz /= pl;
  const qx = uy * pz - uz * py, qy = uz * px - ux * pz, qz = ux * py - uy * px, C = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  for (let k = 0; k < 4; k++) { const [s1, t1] = C[k], [s2, t2] = C[(k + 1) % 4];
    const o1x = (px * s1 + qx * t1) * r, o1y = (py * s1 + qy * t1) * r, o1z = (pz * s1 + qz * t1) * r, o2x = (px * s2 + qx * t2) * r, o2y = (py * s2 + qy * t2) * r, o2z = (pz * s2 + qz * t2) * r;
    quad(B, F0, a[0] + o1x, a[1] + o1y, a[2] + o1z, a[0] + o2x, a[1] + o2y, a[2] + o2z, b[0] + o2x, b[1] + o2y, b[2] + o2z, b[0] + o1x, b[1] + o1y, b[2] + o1z, shade(col, 0.8 + 0.2 * k / 3), kind, aux); }
}

// ------------------------------------------------------------------ azar reproducible, por ámbitos
// Hay un solo estado, pero nadie depende del orden de las llamadas ni de lo que consuma otro módulo: cada consumidor SIEMBRA
// su ámbito con seed(a, b, c, d) —hasta cuatro ENTEROS que lo identifican, mezclados con un hash tipo murmur— justo antes de
// usar R(), saca de golpe todos los valores que necesita (a variables) y no cede el control (yield/await) entre medias.
// Las capas BASE y ORNAMENTO de un edificio siembran los mismos ámbitos y sacan lo mismo. Ámbitos en uso: DESARROLLO.md §6.6.
let _s = 1;
const mur = (h, k) => { k = Math.imul(k, 0xcc9e2d51); k = k << 15 | k >>> 17; h ^= Math.imul(k, 0x1b873593); h = h << 13 | h >>> 19; return Math.imul(h, 5) + 0xe6546b64 | 0; };
function seed(a, b, c, d) {
  let h = Math.imul(a, 0x9E3779B1) ^ 0x5bd1e995;
  if (b !== undefined) { h = mur(h, b); if (c !== undefined) { h = mur(h, c); if (d !== undefined) h = mur(h, d); }
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; }
  _s = h;
}
// estado tal cual, sin mezclar: SOLO para las secuencias heredadas de Transeúnte (texturas y árbol de streets.js), que deben
// salir idénticas. El código nuevo usa seed()
const seedRaw = n => { _s = n; };
const R = (a, b) => { _s |= 0; _s = _s + 0x6D2B79F5 | 0; let t = Math.imul(_s ^ _s >>> 15, 1 | _s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; const r = ((t ^ t >>> 14) >>> 0) / 4294967296;
  return a === undefined ? r : b === undefined ? r * a : a + r * (b - a); };
const pick = arr => arr[Math.floor(R() * arr.length)];
const hash2 = (x, z) => { let h = Math.imul((x * 73856093) ^ (z * 19349663), 0x9E3779B1); h ^= h >>> 15; return ((h >>> 0) % 100000) / 100000; };

window.BCN_GEO = { K, regKind, kindsGLSL, kindsDecl, kindsUniforms, GB, quad, rect, jamb, hpl, box, lattice, latticeSide, latAux, signAux, pbrAux, subAux,
  shade, mixc, quadN, triN, rev, tube, sphere, F0, cyl, obox, bar, seed, seedRaw, R, pick, hash2 };
})();
