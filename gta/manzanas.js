/* GTA Barcelona — MANZANAS (n3 E2): manzanas enteras modeladas como UN solo edificio → fincas + interior de manzana.
   En los datos hay ~600 volúmenes que ocupan una manzana entera (sobre todo en el Eixample: el octógono de 113 m con sus
   chaflanes) o un bloque grande de otro barrio: una sola caja con la cubierta lisa. Aquí se parten:
     · FINCAS a lo largo del perímetro: cortes perpendiculares a la fachada cada 12–25 m (las de chaflán, enteras), con
       fondo d ≈ 20–25 m hasta la línea interior; cada finca con su altura (±1 planta), su color (palette.js, por índice) y
       su azotea (rooftops.js). En las esquinas en ángulo recto, un corte más por la bisectriz.
     · INTERIOR DE MANZANA: el polígono interior (el contorno metido d hacia dentro). Cada finca prolonga su parcela hacia el
       centro (radios hacia el centroide) y en ella pone, según el tipo de patio de la manzana, una cubierta de planta baja
       (taller con lucernarios, o terraza del piso principal con barandilla, plantas, mesas y toldo) o la deja abierta; el
       centro es jardín, huerto, piscina, aparcamiento o, en algunas, jardín público recuperado. El mobiliario del patio lo
       pone rooftops.js (tipo de elemento por elemento) con la lista `patio` de cada manzana.
   Los trozos (fincas y cubiertas de planta baja) son edificios NUEVOS del registro (BREC), en un contenedor sintético con el
   MISMO formato binario que buildings*.png, que app.js añade al final (los índices de los demás no cambian: los hitos los
   usan). El volumen original se colapsa. Así fachadas, azoteas, paleta, sombras y noche los tratan como a cualquier otro.
   Determinista: el azar sale de la semilla de la manzana (su índice y su posición).
   window.BCN_MZ = { cand(rec) → bool, split(poly, seed, H) → plan | null, encode(...) }. Sin dependencias (también en node). */
(function () {
'use strict';
const G = typeof window !== 'undefined' ? window : globalThis;

// ---------------------------------------------------------------- geometría plana (puntos [x, z])
function sarea(P) { let a = 0; for (let i = 0, n = P.length; i < n; i++) { const p = P[i], q = P[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; }
function hull(P) {
  const S = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of S) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = S.length - 1; i >= 0; i--) { const q = S[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));          // antihorario (área > 0)
}
// quita vértices casi alineados (< 6°) y aristas de menos de 1,2 m (polígono convexo antihorario)
function simplify(P) {
  let Q = P.slice(), ch = true;
  while (ch && Q.length > 3) { ch = false;
    for (let i = 0; i < Q.length && Q.length > 3; i++) {
      const a = Q[(i + Q.length - 1) % Q.length], b = Q[i], c = Q[(i + 1) % Q.length];
      const ux = b[0] - a[0], uz = b[1] - a[1], vx = c[0] - b[0], vz = c[1] - b[1], lu = Math.hypot(ux, uz), lv = Math.hypot(vx, vz);
      const ang = Math.abs(Math.atan2(ux * vz - uz * vx, ux * vx + uz * vz));
      if (ang < 0.105 || lu < 1.2) { Q.splice(i, 1); ch = true; i--; } } }
  return Q;
}
// recorta un polígono convexo con el semiplano (p − a)·n ≥ d
function clip(P, ax, az, nx, nz, d) {
  const out = [], f = p => (p[0] - ax) * nx + (p[1] - az) * nz - d;
  for (let i = 0, n = P.length; i < n; i++) { const p = P[i], q = P[(i + 1) % n], fp = f(p), fq = f(q);
    if (fp >= 0) out.push(p);
    if ((fp >= 0) !== (fq >= 0)) { const t = fp / (fp - fq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); } }
  return out;
}
function cum(P) { const c = [0]; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; c.push(c[i] + Math.hypot(q[0] - p[0], q[1] - p[1])); } return c; }
function at(P, C, s) {                                      // punto del contorno a la distancia s (con vuelta)
  const L = C[P.length]; s = ((s % L) + L) % L; let i = 0; while (i < P.length - 1 && C[i + 1] <= s) i++;
  const p = P[i], q = P[(i + 1) % P.length], t = (s - C[i]) / Math.max(1e-9, C[i + 1] - C[i]);
  return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
}
// tramo del contorno de s0 a s1 (s1 ≥ s0, puede dar la vuelta): extremos y vértices intermedios
function path(P, C, s0, s1) {
  const L = C[P.length], out = [at(P, C, s0)];
  for (let k = 0; k < 2 * P.length; k++) { const i = k % P.length, s = C[i] + (k >= P.length ? L : 0);
    if (s > s0 + 0.05 && s < s1 - 0.05) out.push(P[i]); }
  out.push(at(P, C, s1));
  return out;
}

// polígono convexo metido d hacia dentro (o null si desaparece)
function inset(P, d) {
  let Q = P;
  for (let i = 0; i < P.length && Q.length >= 3; i++) { const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1e-6) continue;
    Q = clip(Q, a[0], a[1], -(b[1] - a[1]) / L, (b[0] - a[0]) / L, d); }
  return Q.length >= 3 && sarea(Q) > 1 ? Q : null;
}
// anillo de fondo d dentro de P: el contorno interior Q y map(s): posición en Q del punto de P a la distancia s, llevado en
// perpendicular a su arista (o al extremo más cercano de la arista paralela, en las esquinas)
function ringMap(P, d) {
  const Q = inset(P, d); if (!Q) return null;
  const CP = cum(P), CQ = cum(Q), LP = CP[P.length], LQ = CQ[Q.length];
  return { Q, C: CQ, L: LQ, map(s) {
    s = ((s % LP) + LP) % LP; let i = 0; while (i < P.length - 1 && CP[i + 1] <= s) i++;
    const a = P[i], b = P[(i + 1) % P.length], L = Math.max(1e-6, CP[i + 1] - CP[i]), tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L, u = s - CP[i];
    let best = -1, bd = 1e9; for (let j = 0; j < Q.length; j++) { const p = Q[j], q = Q[(j + 1) % Q.length], mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2;
      const e = Math.abs((mx - a[0]) * -tz + (mz - a[1]) * tx - d); if (e < bd) { bd = e; best = j; } }
    if (bd < 0.3) { const p = Q[best], q = Q[(best + 1) % Q.length], ua = (p[0] - a[0]) * tx + (p[1] - a[1]) * tz, ub = (q[0] - a[0]) * tx + (q[1] - a[1]) * tz;
      const t = Math.max(0, Math.min(1, (u - ua) / Math.max(1e-6, ub - ua))); return CQ[best] + t * (CQ[best + 1] - CQ[best]); }
    const X = [a[0] + tx * u - tz * d, a[1] + tz * u + tx * d]; let bj = 0, bq = 1e9;   // arista desaparecida: el vértice más cercano
    for (let j = 0; j < Q.length; j++) { const e = Math.hypot(Q[j][0] - X[0], Q[j][1] - X[1]); if (e < bq) { bq = e; bj = j; } }
    return CQ[bj];
  } };
}

// ---------------------------------------------------------------- azar propio (mulberry32), por manzana
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------- ¿es una manzana entera?
// rec: { cls, hb (m, base elevada), H (m), A (área del anillo exterior), fill (área / área de su envolvente convexa) }
function cand(r) {
  return (r.cls === 0 || r.cls === 6) && r.hb < 1.5 && r.H >= 10.5 && r.H <= 45 && r.A >= 2600 && r.A <= 32000 && r.fill >= 0.94;
}

// ---------------------------------------------------------------- partir una manzana
// P: anillo exterior en mundo; H: altura (m). Devuelve { outer, inner, d, fincas: [{ poly, H, corner }], parcels: [{ poly,
// h, kind: 'taller'|'terraza', finca }], cuts: [[P, Q]], C: centroide del interior, tipo: tipo de patio, seed } o null
const TIPOS = ['talleres', 'jardines', 'mixto', 'publico', 'aparcamiento'];
function split(P0, seed, H) {
  const R = rng(seed * 2654435761 + 12345);
  let P = simplify(hull(P0));
  if (P.length < 3) return null;
  const A = sarea(P); if (A < 2000) return null;
  // contorno interior: half-planes metidos d (con d algo menor si el interior queda pequeño)
  let d = 20 + R() * 5, inner = null;
  for (let tr = 0; tr < 4; tr++, d *= 0.82) {
    let Q = P;
    for (let i = 0; i < P.length && Q.length >= 3; i++) { const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      Q = clip(Q, a[0], a[1], -(b[1] - a[1]) / L, (b[0] - a[0]) / L, d); }
    if (Q.length >= 3) { const Q2 = simplify(Q); if (Q2.length >= 3 && sarea(Q2) >= Math.max(160, 0.1 * A)) { inner = Q2; break; } }
  }
  if (!inner || d < 12) return null;
  const CO = cum(P), CI = cum(inner), LO = CO[P.length], LI = CI[inner.length];
  // a qué arista exterior pertenece cada arista interior (la paralela a distancia d)
  const tagI = inner.map((p, j) => { const q = inner[(j + 1) % inner.length], mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2; let best = -1, bd = 1e9;
    for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const dist = (mx - a[0]) * -(b[1] - a[1]) / L + (mz - a[1]) * (b[0] - a[0]) / L, e = Math.abs(dist - d); if (e < bd) { bd = e; best = i; } }
    return bd < 0.3 ? best : -1; });
  // posición de un punto Q sobre el contorno interior (la arista j)
  const sOnI = (j, Q) => CI[j] + Math.hypot(Q[0] - inner[j][0], Q[1] - inner[j][1]);
  const cuts = [];                                           // { so, si }
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], L = CO[i + 1] - CO[i], tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L, nx = -tz, nz = tx;
    // tramo interior de esta arista, proyectado en la exterior
    let s0 = 1e9, s1 = -1e9, jj = [];
    for (let j = 0; j < inner.length; j++) if (tagI[j] === i) { jj.push(j);
      for (const p of [inner[j], inner[(j + 1) % inner.length]]) { const s = (p[0] - a[0]) * tx + (p[1] - a[1]) * tz; s0 = Math.min(s0, s); s1 = Math.max(s1, s); } }
    // esquina en ángulo vivo (≤ 100°): corte por la bisectriz (vértice exterior → vértice interior) para no dejar una L enorme
    if (jj.length) { const pa = P[(i + P.length - 1) % P.length], ux = a[0] - pa[0], uz = a[1] - pa[1];
      const turn = Math.atan2(ux * tz * 1 - uz * tx, ux * tx + uz * tz);   // giro en el vértice a
      if (turn > 1.4 && s0 > 13) { const j = jj[0]; cuts.push({ so: CO[i], si: CI[j], corner: true }); } }
    if (!jj.length || L < 10 || s1 - s0 < 6) continue;
    let s = s0 + 3 + R() * 5;
    const end = s1 - 3;
    while (s < end) {
      const Q = [a[0] + tx * s + nx * d, a[1] + tz * s + nz * d];
      let j = jj[0]; for (const k of jj) { const p = inner[k], q = inner[(k + 1) % inner.length], sa = (p[0] - a[0]) * tx + (p[1] - a[1]) * tz, sb = (q[0] - a[0]) * tx + (q[1] - a[1]) * tz; if (s >= Math.min(sa, sb) - 0.01 && s <= Math.max(sa, sb) + 0.01) { j = k; break; } }
      cuts.push({ so: CO[i] + s, si: sOnI(j, Q) });
      const w = R() < 0.78 ? 13 + R() * 8 : 20 + R() * 6;     // ancho de la siguiente finca
      if (s + w > end && end - s < w * 0.5) break;           // lo que queda, a la de esquina
      s += w;
    }
  }
  if (cuts.length < 3) return null;
  cuts.sort((x, y) => x.so - y.so);
  // los cortes interiores deben avanzar también (convexo: sí); si no, se descarta
  for (let k = 1; k < cuts.length; k++) if (((cuts[k].si - cuts[0].si) % LI + LI) % LI + 0.01 < ((cuts[k - 1].si - cuts[0].si) % LI + LI) % LI) return null;
  const rt = R(), tipo = rt < 0.28 ? TIPOS[0] : rt < 0.6 ? TIPOS[1] : rt < 0.8 ? TIPOS[2] : rt < 0.92 ? TIPOS[3] : TIPOS[4];
  let cx = 0, cz = 0; for (const p of inner) { cx += p[0]; cz += p[1]; } cx /= inner.length; cz /= inner.length;
  const C = [cx, cz];
  const fincas = [], parcels = [], rad = [];
  const dH = [0, 0, 0, 0, 0, 3, 3, -3, 0, 3];
  const mixA = R() * 6.2832;                                // patios mixtos: la mitad de la manzana (hacia mixA) es una gran cubierta
  // fondo máximo de las cubiertas del patio: lo que se puede meter el interior antes de desaparecer (búsqueda binaria)
  let lo = 0, hi = 60; for (let it = 0; it < 12; it++) { const m = (lo + hi) / 2; if (inset(inner, m)) lo = m; else hi = m; }
  const dMax = lo, AI = sarea(inner);
  const rA = AI > 260 && dMax > 5 ? ringMap(inner, Math.min(4.5 + R() * 4, dMax * 0.45)) : null;
  const rB = AI > 260 && dMax > 9 ? ringMap(inner, Math.min(dMax * (0.6 + R() * 0.25), 22)) : null;
  for (let k = 0; k < cuts.length; k++) {
    const c0 = cuts[k], c1 = cuts[(k + 1) % cuts.length];
    let so1 = c1.so, si1 = c1.si; if (so1 <= c0.so) so1 += LO; if (si1 < c0.si - 0.01) si1 += LI;
    const out = path(P, CO, c0.so, so1), back = path(inner, CI, c0.si, si1);
    const poly = out.concat(back.slice().reverse());
    const corner = out.length > 2;                           // pasa por algún vértice: finca de esquina o chaflán
    let h = H + dH[Math.floor(R() * dH.length)] + (corner && R() < 0.35 ? 3 : 0);
    h = Math.max(9, Math.min(H + 6, h));
    fincas.push({ poly, H: h, corner });
    rad.push(at(inner, CI, c0.si));
    // parcela de patio de esta finca: entre su trasera y el anillo A (poco fondo) o B (mucho), según el tipo de patio
    const r = R(), r2 = R(), r3 = R();
    let ring = null, kind = 'taller', hh = 3.4 + R() * 1.6;
    const mx = back[0][0] + back[back.length - 1][0] - 2 * cx, mz = back[0][1] + back[back.length - 1][1] - 2 * cz;
    const side = Math.cos(Math.atan2(mz, mx) - mixA) > 0;
    switch (tipo) {
      case 'talleres': if (r < 0.85) { ring = r2 < 0.7 ? rB : rA; kind = r3 < 0.3 ? 'terraza' : 'taller'; } break;
      case 'jardines': if (r < 0.6) { ring = r2 < 0.85 ? rA : rB; kind = r3 < 0.75 ? 'terraza' : 'taller'; } break;
      case 'mixto': if (side) { ring = rB; kind = 'taller'; hh = 4.4 + R() * 1.2; } else if (r < 0.5) { ring = rA; kind = 'terraza'; } break;
      case 'publico': if (r < 0.3) { ring = rA; kind = 'terraza'; } break;
      case 'aparcamiento': if (r < 0.5) { ring = rA; kind = 'terraza'; } break;
    }
    if (!ring) continue;
    const s0 = ring.map(c0.si), s1 = ring.map(c1.si);
    let t1 = s1; if (t1 < s0 - 0.01) t1 += ring.L; if (t1 - s0 > ring.L * 0.5) t1 = s0;
    const deep = path(ring.Q, ring.C, s0, Math.max(s0, t1));
    const pp = back.concat(deep.reverse());
    if (Math.abs(sarea(pp)) < 20) continue;
    parcels.push({ poly: pp, h: hh, kind, finca: k, deep: ring === rB });
  }
  // aparcamiento: una gran losa en el centro (cubierta del aparcamiento, con lucernarios y extractores)
  if (tipo === 'aparcamiento' && rA) { const sh = rA.Q; if (sarea(sh) > 120) parcels.push({ poly: sh.slice(), h: 3.6 + R() * 1.0, kind: 'taller', finca: -1, deep: true }); }
  const free = rB && (tipo === 'talleres' || tipo === 'mixto') ? rB.Q : rA ? rA.Q : inner;     // lo que queda libre en el centro
  return { outer: P, inner, d, fincas, parcels, rad, C, tipo, seed, A, free, rA: rA && rA.Q, rB: rB && rB.Q };
}


// ---------------------------------------------------------------- n3 E3 · manzanas que no son un octógono convexo
// Las no convexas, las hechas de 2–6 volúmenes grandes y las que ya traían un patio de otra forma: se trabaja sobre una
// trama de 1 m girada con la manzana. Dentro = los volúmenes del grupo; calle = ni grupo ni vecinos. El fondo de cada píxel
// es su distancia a la calle (chaflán 3-4): lo que pasa de d (20–25 m) es patio, lo demás son fincas (Voronoi de semillas
// puestas cada 13–21 m a lo largo de la fachada real). Los contornos se trazan sobre la trama, se simplifican y se pegan a
// las aristas originales (< 1,1 m): fachada y medianeras caen donde estaban. Devuelve un plan con la forma del de split().
function trace(Wd, Hd, inside) {                            // contorno exterior mayor de la máscara (vértices de la trama)
  const out = new Map(), key = (x, y) => y * (Wd + 1) + x;
  const add = (x0, y0, x1, y1) => { const k = key(x0, y0); let l = out.get(k); if (!l) out.set(k, l = []); l.push([x1, y1]); };
  const I = (x, y) => x >= 0 && y >= 0 && x < Wd && y < Hd && inside(y * Wd + x);
  for (let y = 0; y < Hd; y++) for (let x = 0; x < Wd; x++) { if (!I(x, y)) continue;   // aristas con el dentro a la izquierda
    if (!I(x, y - 1)) add(x + 1, y, x, y); if (!I(x - 1, y)) add(x, y, x, y + 1); if (!I(x, y + 1)) add(x, y + 1, x + 1, y + 1); if (!I(x + 1, y)) add(x + 1, y + 1, x + 1, y); }
  let best = null, ba = 0;
  for (const [k0, l0] of out) while (l0.length) {
    const sx = k0 % (Wd + 1), sy = Math.floor(k0 / (Wd + 1)), L = [[sx, sy]]; let cur = l0.pop(), px = sx, py = sy, g = 0;
    while (g++ < 200000) { const [cx, cy] = cur; if (cx === sx && cy === sy) break; L.push([cx, cy]);
      const l = out.get(key(cx, cy)); if (!l || !l.length) break;
      let j = 0; if (l.length > 1) { const dx = cx - px, dy = cy - py; for (let q = 0; q < l.length; q++) if ((l[q][0] - cx) === -dy && (l[q][1] - cy) === dx) j = q; }
      px = cx; py = cy; cur = l.splice(j, 1)[0]; }
    const a = Math.abs(sarea(L)); if (a > ba) { ba = a; best = L; } }
  return best;
}
function dp(P, eps) {                                       // Douglas-Peucker en un anillo cerrado
  if (P.length < 5) return P;
  let i0 = 0, i1 = 0, m = -1; for (let i = 0; i < P.length; i++) { const e = Math.hypot(P[i][0] - P[0][0], P[i][1] - P[0][1]); if (e > m) { m = e; i1 = i; } }
  const keep = new Uint8Array(P.length); keep[i0] = keep[i1] = 1;
  const rec = (a, b) => { const n = P.length, A = P[a], B = P[b % n], dx = B[0] - A[0], dz = B[1] - A[1], L = Math.hypot(dx, dz) || 1; let bi = -1, bd = eps;
    for (let i = a + 1; i < b; i++) { const p = P[i % n], e = Math.abs((p[0] - A[0]) * dz - (p[1] - A[1]) * dx) / L; if (e > bd) { bd = e; bi = i; } }
    if (bi >= 0) { keep[bi % n] = 1; rec(a, bi); rec(bi, b); } };
  rec(i0, i1); rec(i1, P.length);
  return P.filter((p, i) => keep[i]);
}
function splitR(mem, others, seed) {
  const R = rng(seed * 2654435761 + 777);
  let ang = 0, bl = 0; for (const m of mem) for (let i = 0; i < m.P.length; i++) { const a = m.P[i], b = m.P[(i + 1) % m.P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L > bl) { bl = L; ang = Math.atan2(b[1] - a[1], b[0] - a[0]); } }
  const ca = Math.cos(ang), sa = Math.sin(ang), o = mem[0].P[0];
  const toL = p => [(p[0] - o[0]) * ca + (p[1] - o[1]) * sa, -(p[0] - o[0]) * sa + (p[1] - o[1]) * ca];
  const toW = q => [o[0] + q[0] * ca - q[1] * sa, o[1] + q[0] * sa + q[1] * ca];
  const ML = mem.map(m => ({ P: m.P.map(toL), holes: (m.holes || []).map(h => h.map(toL)), H: m.H }));
  let u0 = 1e9, v0 = 1e9, u1 = -1e9, v1 = -1e9; for (const m of ML) for (const q of m.P) { u0 = Math.min(u0, q[0]); u1 = Math.max(u1, q[0]); v0 = Math.min(v0, q[1]); v1 = Math.max(v1, q[1]); }
  u0 = Math.floor(u0) - 3; v0 = Math.floor(v0) - 3; const Wd = Math.ceil(u1 - u0) + 4, Hd = Math.ceil(v1 - v0) + 4, N = Wd * Hd;
  if (Wd > 260 || Hd > 260) return null;
  const own = new Int8Array(N), occ = new Uint8Array(N), hole = new Uint8Array(N);
  const fillP = (P, fn) => {                                // píxeles con el centro dentro de P (local)
    let a0 = 1e9, a1 = -1e9; for (const q of P) { a0 = Math.min(a0, q[1]); a1 = Math.max(a1, q[1]); }
    for (let y = Math.max(0, Math.floor(a0 - v0)); y < Math.min(Hd, Math.ceil(a1 - v0) + 1); y++) { const vz = v0 + y + 0.5, xs = [];
      for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > vz) !== (b[1] > vz)) xs.push(a[0] + (vz - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(0, Math.ceil(xs[k] - u0 - 0.5)); x <= Math.min(Wd - 1, Math.floor(xs[k + 1] - u0 - 0.5)); x++) fn(y * Wd + x); } };
  for (const P of others) fillP(P.map(toL), i => { occ[i] = 1; });
  ML.forEach((m, k) => { fillP(m.P, i => { own[i] = k + 1; occ[i] = 0; }); for (const h of m.holes) fillP(h, i => { own[i] = 0; hole[i] = 1; }); });
  let nOwn = 0; for (let i = 0; i < N; i++) if (own[i]) nOwn++;
  if (nOwn < 2000) return null;
  // fondo: distancia a la calle (chaflán 3-4, en décimas de metro aprox.)
  const D = new Float32Array(N); for (let i = 0; i < N; i++) D[i] = own[i] || occ[i] || hole[i] ? 1e9 : 0;
  const ch = (pass) => { for (let yy = 0; yy < Hd; yy++) { const y = pass ? Hd - 1 - yy : yy; for (let xx = 0; xx < Wd; xx++) { const x = pass ? Wd - 1 - xx : xx, i = y * Wd + x; if (!D[i]) continue;
    const s = pass ? 1 : -1; let m = D[i]; const t = (xa, ya, w) => { if (xa >= 0 && ya >= 0 && xa < Wd && ya < Hd) { const v = D[ya * Wd + xa] + w; if (v < m) m = v; } else if (w < m) m = w; };
    t(x + s, y, 1); t(x, y + s, 1); t(x + s, y + s, 1.414); t(x - s, y + s, 1.414); D[i] = m; } } };
  ch(0); ch(1);
  let d = 20 + R() * 5, pat = null, nP = 0;
  for (let tr = 0; tr < 4 && d >= 12; tr++, d *= 0.85) { pat = new Uint8Array(N); nP = 0;
    for (let i = 0; i < N; i++) if ((own[i] && D[i] > d) || hole[i]) { pat[i] = 1; nP++; }
    if (nP >= Math.max(160, 0.08 * nOwn)) break; }
  if (nP < 120) { pat = new Uint8Array(N); nP = 0; for (let i = 0; i < N; i++) if (hole[i]) { pat[i] = 1; nP++; } }
  // semillas a lo largo de la fachada real (aristas exteriores que dan a la calle)
  const seeds = []; let acc = R() * 8, wN = 13 + R() * 8;
  const street = (q) => { const x = Math.floor(q[0] - u0), y = Math.floor(q[1] - v0); return x < 0 || y < 0 || x >= Wd || y >= Hd || (!own[y * Wd + x] && !occ[y * Wd + x] && !hole[y * Wd + x]); };
  ML.forEach((m, k) => { const P = m.P; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.3) continue;
    const tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L;
    for (let s = 0.25; s < L; s += 0.5) { const p = [a[0] + tx * s, a[1] + tz * s], q1 = [p[0] - tz * 1.3, p[1] + tx * 1.3], q2 = [p[0] + tz * 1.3, p[1] - tx * 1.3];
      if (!street(q1) && !street(q2)) continue; acc += 0.5;
      if (acc >= wN) { const inw = street(q1) ? [tz, -tx] : [-tz, tx]; seeds.push({ u: p[0] + inw[0] * 2, v: p[1] + inw[1] * 2, k }); acc = 0; wN = R() < 0.78 ? 13 + R() * 8 : 20 + R() * 6; } } } });
  if (seeds.length < 3) return null;
  // fincas: cada píxel del anillo, a su semilla más cercana; el patio, a la finca más cercana (para las cubiertas)
  const lab = new Int16Array(N).fill(-1);
  for (let y = 0; y < Hd; y++) for (let x = 0; x < Wd; x++) { const i = y * Wd + x; if (!own[i] || pat[i]) continue; const U = u0 + x + 0.5, V = v0 + y + 0.5; let bj = 0, bd = 1e18;
    for (let j = 0; j < seeds.length; j++) { const e = (seeds[j].u - U) ** 2 + (seeds[j].v - V) ** 2; if (e < bd) { bd = e; bj = j; } } lab[i] = bj; }
  const PD = new Float32Array(N), PL = new Int16Array(N).fill(-1);
  for (let i = 0; i < N; i++) { PD[i] = pat[i] ? 1e9 : 0; if (lab[i] >= 0) PL[i] = lab[i]; }
  for (let pass = 0; pass < 2; pass++) for (let yy = 0; yy < Hd; yy++) { const y = pass ? Hd - 1 - yy : yy; for (let xx = 0; xx < Wd; xx++) { const x = pass ? Wd - 1 - xx : xx, i = y * Wd + x; if (!pat[i]) continue;
    const s = pass ? 1 : -1; for (const [dx, dy, w] of [[s, 0, 1], [0, s, 1], [s, s, 1.414], [-s, s, 1.414]]) { const xa = x + dx, ya = y + dy; if (xa < 0 || ya < 0 || xa >= Wd || ya >= Hd) continue; const j = ya * Wd + xa;
      if (PD[j] + w < PD[i] && (PL[j] >= 0)) { PD[i] = PD[j] + w; PL[i] = PL[j]; } } } }
  const rt = R(), tipo = rt < 0.28 ? TIPOS[0] : rt < 0.6 ? TIPOS[1] : rt < 0.8 ? TIPOS[2] : rt < 0.92 ? TIPOS[3] : TIPOS[4];
  let pdMax = 0; for (let i = 0; i < N; i++) if (pat[i] && PD[i] < 1e8) pdMax = Math.max(pdMax, PD[i]);
  const eA = Math.min(4.5 + R() * 4, pdMax * 0.45), eB = Math.min(pdMax * (0.6 + R() * 0.25), 22), mixA = R() * 6.2832;
  // contorno de cada región, a mundo, pegado a las aristas originales
  const edges = []; for (const m of ML) for (const r of [m.P].concat(m.holes)) for (let i = 0; i < r.length; i++) edges.push([r[i], r[(i + 1) % r.length]]);
  const snap = q => { let bd = 1.1, bq = q; for (const [a, b] of edges) { const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dz) / L2));
    const px = a[0] + dx * t, pz = a[1] + dz * t, e = Math.hypot(px - q[0], pz - q[1]); if (e < bd) { bd = e; bq = [px, pz]; } } return bq; };
  const poly = (fn, snp) => { const L = trace(Wd, Hd, fn); if (!L || L.length < 4) return null; let Q = dp(L.map(q => [q[0] + u0, q[1] + v0]), 0.75);
    if (snp) Q = Q.map(snap); Q = simplifyG(Q); if (Q.length < 3 || Math.abs(sarea(Q)) < 12) return null; return Q.map(toW); };
  const fincas = [], parcels = [], fk = [];
  const dH = [0, 0, 0, 0, 0, 3, 3, -3, 0, 3];
  for (let j = 0; j < seeds.length; j++) { const P = poly(i => lab[i] === j, true); if (!P) { fk.push(-1); continue; }
    const H0 = ML[seeds[j].k].H; let h = H0 + dH[Math.floor(R() * dH.length)]; h = Math.max(9, Math.min(H0 + 6, h));
    fk.push(fincas.length); fincas.push({ poly: P, H: h, corner: false }); }
  if (fincas.length < 3) return null;
  let inner = null, free = null, C = null; const rad = [];
  if (nP >= 120) {
    inner = poly(i => pat[i] === 1, true);
    if (inner) { let cx = 0, cz = 0; for (const p of inner) { cx += p[0]; cz += p[1]; } C = [cx / inner.length, cz / inner.length];
      const Cl = toL(C), eK = [], kK = [];
      for (let j = 0; j < seeds.length; j++) { const r = R(), r2 = R(), r3 = R(), side = Math.cos(Math.atan2(seeds[j].v - Cl[1], seeds[j].u - Cl[0]) + ang - mixA) > 0; let e = 0, kind = 'taller';
        switch (tipo) { case 'talleres': if (r < 0.85) { e = r2 < 0.7 ? eB : eA; kind = r3 < 0.3 ? 'terraza' : 'taller'; } break;
          case 'jardines': if (r < 0.6) { e = r2 < 0.85 ? eA : eB; kind = r3 < 0.75 ? 'terraza' : 'taller'; } break;
          case 'mixto': if (side) e = eB; else if (r < 0.5) { e = eA; kind = 'terraza'; } break;
          case 'publico': case 'aparcamiento': if (r < 0.4) { e = eA; kind = 'terraza'; } break; }
        eK.push(e > 3 ? e : 0); kK.push(kind); }
      const inPar = i => pat[i] && !hole[i] && PL[i] >= 0 && eK[PL[i]] > 0 && PD[i] <= eK[PL[i]];
      for (let j = 0; j < seeds.length; j++) if (eK[j] > 0 && fk[j] >= 0) { const P = poly(i => inPar(i) && PL[i] === j, false); if (P && Math.abs(sarea(P)) > 20) parcels.push({ poly: P, h: 3.4 + R() * 1.6, kind: kK[j], finca: fk[j], deep: eK[j] === eB }); }
      free = poly(i => pat[i] && !inPar(i), false) || inner;
      // tapias: donde dos fincas se tocan junto al patio
      const seen = new Set();
      for (let y = 1; y < Hd - 1; y++) for (let x = 1; x < Wd - 1; x++) { const i = y * Wd + x; if (lab[i] < 0) continue;
        if (!(pat[i - 1] || pat[i + 1] || pat[i - Wd] || pat[i + Wd])) continue;
        for (const j of [i + 1, i + Wd]) if (lab[j] >= 0 && lab[j] !== lab[i]) { const k = Math.min(lab[i], lab[j]) * 1000 + Math.max(lab[i], lab[j]); if (seen.has(k)) continue; seen.add(k); rad.push(toW([u0 + x + 0.5, v0 + y + 0.5])); } } }
  }
  const outer = []; for (const m of mem) for (const p of m.P) outer.push(p);
  return { outer: hull(outer), inner, d, fincas, parcels, rad, C, tipo, seed, A: nOwn, free, raster: true };
}

// grupos de volúmenes que se tocan (< 1,2 m): V = [{ P, bb: [x0, z0, x1, z1] }] → [[índices]]
function group(V) {
  const par = V.map((v, i) => i), f = i => { while (par[i] !== i) i = par[i] = par[par[i]]; return i; }, G2 = new Map();
  V.forEach((v, i) => { for (let gx = Math.floor(v.bb[0] / 100); gx <= Math.floor(v.bb[2] / 100); gx++) for (let gz = Math.floor(v.bb[1] / 100); gz <= Math.floor(v.bb[3] / 100); gz++) { const k = gx * 100003 + gz; let l = G2.get(k); if (!l) G2.set(k, l = []); l.push(i); } });
  const near = (A, B) => { for (const q of A) for (let i = 0; i < B.length; i++) { const a = B[i], b = B[(i + 1) % B.length], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dz) / L2));
    if (Math.hypot(a[0] + dx * t - q[0], a[1] + dz * t - q[1]) < 1.2) return true; } return false; };
  const done = new Set();
  for (const l of G2.values()) for (let x = 0; x < l.length; x++) for (let y = x + 1; y < l.length; y++) { const i = l[x], j = l[y], k = Math.min(i, j) * 1e6 + Math.max(i, j); if (done.has(k)) continue; done.add(k);
    const a = V[i].bb, b = V[j].bb; if (a[0] > b[2] + 1.2 || b[0] > a[2] + 1.2 || a[1] > b[3] + 1.2 || b[1] > a[3] + 1.2) continue;
    if (f(i) !== f(j) && (near(V[i].P, V[j].P) || near(V[j].P, V[i].P))) par[f(i)] = f(j); }
  const out = new Map(); V.forEach((v, i) => { const r = f(i); let l = out.get(r); if (!l) out.set(r, l = []); l.push(i); });
  return [...out.values()];
}
// quita vértices alineados (< 4°) y aristas de menos de 0,6 m (cualquier anillo)
function simplifyG(P) {
  let Q = P.slice(), ch = true;
  while (ch && Q.length > 3) { ch = false;
    for (let i = 0; i < Q.length && Q.length > 3; i++) { const a = Q[(i + Q.length - 1) % Q.length], b = Q[i], c = Q[(i + 1) % Q.length];
      const ux = b[0] - a[0], uz = b[1] - a[1], vx = c[0] - b[0], vz = c[1] - b[1], lu = Math.hypot(ux, uz);
      if (lu < 0.6 || Math.abs(Math.atan2(ux * vz - uz * vx, ux * vx + uz * vz)) < 0.07) { Q.splice(i, 1); ch = true; i--; } } }
  return Q;
}

// ---------------------------------------------------------------- contenedor sintético con el formato de buildings*.png
// recs: [{ cls, seed, yb, ybot, H, poly (mundo) }] → { meta: { chunks }, view() } (DataView), en trozos de CH m
function encode(recs, CH) {
  const byC = new Map();
  for (const r of recs) { let x = 0, z = 0; for (const p of r.poly) { x += p[0]; z += p[1]; } x /= r.poly.length; z /= r.poly.length;
    const cx = Math.floor(x / CH), cz = Math.floor(z / CH), key = cx * 65536 + cz; let l = byC.get(key); if (!l) byC.set(key, l = { cx, cz, recs: [] }); l.recs.push(r); }
  let size = 0; for (const r of recs) size += 12 + r.poly.length * 4;
  const buf = new ArrayBuffer(Math.max(4, size)), dv = new DataView(buf), chunks = [], order = [];
  let p = 0;
  for (const c of byC.values()) {
    const off = p; let nV = 0;
    const ox = c.cx * CH, oz = c.cz * CH;
    for (const r of c.recs) {
      dv.setUint8(p, 1); dv.setUint8(p + 1, r.cls); dv.setUint8(p + 2, r.seed & 255); dv.setUint8(p + 3, 0); dv.setUint16(p + 4, r.poly.length, true);
      dv.setInt16(p + 6, r.yb, true); dv.setInt16(p + 8, r.ybot, true); dv.setInt16(p + 10, Math.round(r.yb + r.H * 10), true); p += 12;
      for (const q of r.poly) { dv.setInt16(p, Math.round((q[0] - ox) * 10), true); dv.setInt16(p + 2, Math.round((q[1] - oz) * 10), true); p += 4; }
      nV += r.poly.length; order.push(r);
    }
    chunks.push([c.cx, c.cz, off, p - off, c.recs.length, nV, c.recs.length]);
  }
  return { meta: { chunks }, view: () => dv, synthetic: true, order };
}

G.BCN_MZ = { cand, split, splitR, group, encode, sarea, hull, rng };
})();
