/* GTA Barcelona — Geometría, azar y tipos de material compartidos por todos los módulos. Sin dependencias.
   window.BCN_GEO:
     · K, regKind(), kindsGLSL(), kindsDecl(): tipos de material del shader de detalle y registro de tipos nuevos;
     · GB (geometría acumulada) y las primitivas que escriben en él: quad, rect, jamb, hpl, box, lattice…, cyl, obox, bar;
     · seed(), R(), pick(), hash2(): azar reproducible, con UN solo estado compartido por todos los módulos.
   Contratos y ejemplos de uso: DESARROLLO.md §6. */
(function () {
'use strict';

// ------------------------------------------------------------------ tipos de material (viajan en el alfa del color de vértice)
const K = { STUCCO: 0, STONE: 1, GLASS: 2, SHUT: 3, WOOD: 4, METAL: 5, IRON: 6, SGRAF: 7, SIGN: 8, AWN: 9, BAL: 10, GSHOP: 11, LAMP: 12, PLAIN: 13, LEAF: 14 };
// Registro de tipos nuevos. Rangos de id reservados:
//   0–19 núcleo (facades.js) · 20–39 interiors.js · 40–59 details.js · 60–79 furniture.js · 80–99 ground.js
// regKind(nombre, id, glsl[, decl]) da de alta K[nombre] = id y su rama del shader de detalle (cuerpo GLSL, sin el «else if»).
// Hay que llamarlo AL CARGAR el script (nivel superior del módulo): facades.js monta el shader una sola vez, al iniciarse.
// `decl` (opcional) son declaraciones globales GLSL que la rama necesite: funciones auxiliares, uniformes o samplers propios.
const KINDS = [];
let sealed = false;
function regKind(name, id, glsl, decl) {
  if (sealed) throw new Error('regKind(' + name + '): el shader de detalle ya está montado; registra los tipos al cargar el script');
  if (!/^[A-Z][A-Z0-9_]*$/.test(name) || name in K) throw new Error('regKind: nombre repetido o no válido: ' + name);
  if (id !== (id | 0) || id < 15 || id > 255 || Object.values(K).indexOf(id) >= 0) throw new Error('regKind(' + name + '): id repetido o fuera de rango: ' + id);
  K[name] = id; KINDS.push({ name, id, glsl: glsl || '', decl: decl || '' });
  return id;
}
// ramas «else if» de los tipos registrados: facades.js las inserta en el shader de detalle antes de la rama final
const kindsGLSL = () => { sealed = true;
  return KINDS.map(k => ' else if (kind > ' + (k.id - 0.5).toFixed(1) + ' && kind < ' + (k.id + 0.5).toFixed(1) + ') {   // ' + k.name + '\n' + k.glsl + '\n  }').join(''); };
const kindsDecl = () => { sealed = true; return KINDS.map(k => k.decl).filter(d => d).join('\n'); };

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
const signAux = id => [0, 0, id, 0, 255, 0, id, 0, 255, 255, id, 0, 0, 255, id, 0];

// ------------------------------------------------------------------ piezas sueltas (mobiliario): coordenadas locales de celda
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
// barra de sección cuadrada entre dos puntos (tubos de bicicleta, radios…)
function bar(B, a, b, r, col, kind) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1, ux = dx / L, uy = dy / L, uz = dz / L;
  let px = -uz, py = 0, pz = ux, pl = Math.hypot(px, py, pz); if (pl < 1e-3) { px = 1; py = 0; pz = 0; pl = 1; } px /= pl; py /= pl; pz /= pl;
  const qx = uy * pz - uz * py, qy = uz * px - ux * pz, qz = ux * py - uy * px, C = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  for (let k = 0; k < 4; k++) { const [s1, t1] = C[k], [s2, t2] = C[(k + 1) % 4];
    const o1x = (px * s1 + qx * t1) * r, o1y = (py * s1 + qy * t1) * r, o1z = (pz * s1 + qz * t1) * r, o2x = (px * s2 + qx * t2) * r, o2y = (py * s2 + qy * t2) * r, o2z = (pz * s2 + qz * t2) * r;
    quad(B, F0, a[0] + o1x, a[1] + o1y, a[2] + o1z, a[0] + o2x, a[1] + o2y, a[2] + o2z, b[0] + o2x, b[1] + o2y, b[2] + o2z, b[0] + o1x, b[1] + o1y, b[2] + o1z, shade(col, 0.8 + 0.2 * k / 3), kind); }
}

// ------------------------------------------------------------------ azar reproducible
// Un único estado para todos los módulos: cada consumidor SIEMBRA con seed(n) justo antes de usar R() y no cede el control
// (yield/await) hasta acabar su secuencia. Las capas BASE y ORNAMENTO de un edificio deben consumir exactamente lo mismo.
let _s = 1;
const seed = n => { _s = n; };
const R = (a, b) => { _s |= 0; _s = _s + 0x6D2B79F5 | 0; let t = Math.imul(_s ^ _s >>> 15, 1 | _s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; const r = ((t ^ t >>> 14) >>> 0) / 4294967296;
  return a === undefined ? r : b === undefined ? r * a : a + r * (b - a); };
const pick = arr => arr[Math.floor(R() * arr.length)];
const hash2 = (x, z) => { let h = Math.imul((x * 73856093) ^ (z * 19349663), 0x9E3779B1); h ^= h >>> 15; return ((h >>> 0) % 100000) / 100000; };

window.BCN_GEO = { K, regKind, kindsGLSL, kindsDecl, GB, quad, rect, jamb, hpl, box, lattice, latticeSide, latAux, signAux, shade, mixc,
  F0, cyl, obox, bar, seed, R, pick, hash2 };
})();
