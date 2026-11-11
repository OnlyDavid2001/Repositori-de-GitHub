#!/usr/bin/env node
/* Pruebas de geo.js sin navegador (un segundo): node tools/geo_test.js [ruta a geo.js]
   Comprueba el azar por ámbito (secuencias de edificio y heredadas intactas, ámbitos independientes y uniformes), las
   primitivas suaves (recuento de triángulos, índices, normales unitarias y hacia fuera, inglete de los tubos, anillos sin
   torsión), los auxiliares de vértice y los rangos de regKind. Código de salida 1 si algo falla. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const win = {}; vm.runInNewContext(fs.readFileSync(process.argv[2] || path.join(__dirname, '..', 'geo.js'), 'utf8'), { window: win, Math, Float32Array, Float64Array, Uint8Array, Uint32Array, Int32Array, Array, Object, Error });
const G = win.BCN_GEO; let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FALLA: ' + m); } };
const near = (a, b, e) => Math.abs(a - b) <= (e || 1e-6);
// ---- azar
{
  let s0; const seedOld = n => { s0 = n; };
  const Rold = () => { s0 |= 0; s0 = s0 + 0x6D2B79F5 | 0; let t = Math.imul(s0 ^ s0 >>> 15, 1 | s0); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let bad = 0;
  for (const b of [0, 1, 2, 17, 1000, 65535, 65536, 123456, 294036, 294037, 1 << 20, 3000000]) { seedOld((b * 2654435761) ^ 0x5bd1e995); G.seed(b); for (let k = 0; k < 8; k++) if (Rold() !== G.R()) bad++; }
  ok(!bad, 'seed(b) no reproduce la secuencia de edificio anterior: ' + bad);
  bad = 0; for (const n of [1906, 61, 62, 63, 5, 41]) { seedOld(n); G.seedRaw(n); for (let k = 0; k < 8; k++) if (Rold() !== G.R()) bad++; }
  ok(!bad, 'seedRaw(n) no reproduce la secuencia heredada');
  // ámbitos distintos → secuencias distintas; mismo ámbito → la misma
  const first = (...a) => { G.seed(...a); return [G.R(), G.R(), G.R()].join(','); };
  const seen = new Map(); let col = 0, n = 0;
  for (let b = 0; b < 40; b++) for (let t = 1; t <= 5; t++) for (let i = 0; i < 6; i++) for (let w = 0; w < 30; w++) { const k = first(b, t, i, w); n++; if (seen.has(k)) col++; seen.set(k, 1); }
  ok(col === 0, 'colisiones entre ámbitos: ' + col + ' de ' + n);
  ok(first(7, 2, 3, 4) === first(7, 2, 3, 4), 'el mismo ámbito no repite secuencia');
  ok(first(7) !== first(7, 0) && first(7, 1) !== first(7, 1, 0) && first(7, 1, 2) !== first(7, 1, 2, 0), 'un id ausente no debe equivaler a 0');
  // uniformidad y falta de correlación entre ámbitos vecinos (primer número de cada vano)
  let sum = 0, sum2 = 0, cov = 0, prev = 0.5, m = 0; const hist = new Array(10).fill(0);
  for (let b = 1000; b < 1200; b++) for (let i = 0; i < 4; i++) for (let w = 0; w < 25; w++) { G.seed(b, 3, i, w * 64 + 1); const r = G.R(); sum += r; sum2 += r * r; cov += (r - 0.5) * (prev - 0.5); prev = r; hist[r * 10 | 0]++; m++; }
  const mean = sum / m, vr = sum2 / m - mean * mean;
  ok(near(mean, 0.5, 0.01) && near(vr, 1 / 12, 0.005) && Math.abs(cov / m) < 0.003, 'estadística rara: media ' + mean + ' var ' + vr + ' cov ' + cov / m);
  ok(Math.min(...hist) > m / 10 * 0.9 && Math.max(...hist) < m / 10 * 1.1, 'histograma no uniforme ' + hist);
  // el primer número de vanos consecutivos de la MISMA planta y de plantas consecutivas tampoco se parecen
  let same = 0; for (let w = 0; w < 500; w++) { G.seed(123, 3, 0, w * 64 + 1); const a = G.R(); G.seed(123, 3, 0, w * 64 + 2); const c = G.R(); if (Math.abs(a - c) < 0.01) same++; }
  ok(same < 25, 'vanos vecinos demasiado parecidos: ' + same);
}
// ---- utilidades de lectura de un GB
const F0 = G.F0, FR = { x: 3, z: -2, tx: Math.cos(0.7), tz: Math.sin(0.7), nx: Math.sin(0.7), nz: -Math.cos(0.7) };   // marco «zurdo», como muchas fachadas
const V = (B, k) => [B.p[k * 3], B.p[k * 3 + 1], B.p[k * 3 + 2]], Nv = (B, k) => [(B.n[k * 4] - 128) / 127, (B.n[k * 4 + 1] - 128) / 127, (B.n[k * 4 + 2] - 128) / 127];
const check = (B, name, tris) => {
  ok(B.ni % 3 === 0 && (tris === undefined || B.ni / 3 === tris), name + ': triángulos ' + B.ni / 3 + ' (esperados ' + tris + ')');
  let badI = 0, badN = 0, badS = 0, deg = 0; const used = new Uint8Array(B.nv);
  for (let k = 0; k < B.ni; k++) { if (B.i[k] >= B.nv) badI++; else used[B.i[k]] = 1; }
  for (let k = 0; k < B.nv; k++) { const n = Nv(B, k); if (!near(Math.hypot(...n), 1, 0.02)) badN++; if (B.n[k * 4 + 3] !== 255) badS++; }
  for (let k = 0; k < B.ni; k += 3) { const a = V(B, B.i[k]), b = V(B, B.i[k + 1]), c = V(B, B.i[k + 2]);
    const ar = Math.hypot((b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])); if (ar < 1e-9) deg++; }
  ok(!badI, name + ': índices fuera de rango ' + badI); ok(!badN, name + ': normales no unitarias ' + badN); ok(!badS, name + ': vértices sin marca de suave ' + badS); ok(!deg, name + ': triángulos degenerados ' + deg);
  return used;
};
// ---- rev
{
  const B = new G.GB(0, 0); G.rev(B, F0, 5, 7, [[0.17, 1], [0.155, 1.55], [0.1, 1.68], [0.055, 8.8]], 7, [1, 2, 3], 15, { aux: G.pbrAux(0.4, 0, 0, 0), cap: 1 });
  check(B, 'rev farola', 3 * 14 + 5);
  let out = 0; for (let k = 0; k < 28; k++) { const p = V(B, k), n = Nv(B, k); if (n[0] * (p[0] - 5) + n[2] * (p[2] - 7) <= 0) out++; }
  ok(!out, 'rev: normales que no miran hacia fuera ' + out);
  ok(B.a[0] === 102 && B.a[3] === 0 && B.c[3] === 15, 'rev: aux/kind');
  // esfera: normales radiales
  const S = new G.GB(0, 0); G.sphere(S, FR, 1, 5, 2, 0.5, 8, 6, [9, 9, 9], 15);
  check(S, 'esfera', 8 * (2 * 6 - 2));
  const cx = FR.x + FR.tx * 1 + FR.nx * 2, cz = FR.z + FR.tz * 1 + FR.nz * 2; let badR = 0, badD = 0;
  for (let k = 0; k < S.nv; k++) { const p = V(S, k), n = Nv(S, k), r = [p[0] - cx, p[1] - 5, p[2] - cz], l = Math.hypot(...r); if (!near(l, 0.5, 1e-4)) badR++; if ((r[0] * n[0] + r[1] * n[1] + r[2] * n[2]) / l < 0.995) badD++; }
  ok(!badR && !badD, 'esfera: radio ' + badR + ' normal ' + badD);
  // elipsoide (bolsa), cubo con hueco (arista viva + punta) y arco parcial con tapas
  const E = new G.GB(0, 0); G.sphere(E, F0, 0, 0.2, 0, 0.3, 6, 3, [9, 9, 9], 15, null, 0.7); check(E, 'elipsoide', 24);
  let ymin = 9, ymax = -9; for (let k = 0; k < E.nv; k++) { ymin = Math.min(ymin, E.p[k * 3 + 1]); ymax = Math.max(ymax, E.p[k * 3 + 1]); } ok(near(ymin, 0.2 - 0.21, 1e-5) && near(ymax, 0.41, 1e-5), 'elipsoide: alto ' + ymin + ' ' + ymax);
  const P = new G.GB(0, 0); G.rev(P, F0, 0, 0, [[0.17, 0.38], [0.215, 0.48], [0.225, 0.92], [0.225, 0.92, [1, 1, 1]], [0, 0.86, [1, 1, 1]]], 8, [200, 0, 0], 15);
  const usedP = check(P, 'papelera', 2 * 16 + 8);
  ok(Nv(P, 16)[1] < 0.2 && Nv(P, 24)[1] > 0.9 && Nv(P, 32)[1] > 0.99, 'papelera: arista viva / punta ' + Nv(P, 16) + ' | ' + Nv(P, 24) + ' | ' + Nv(P, 32));
  ok(P.c[16 * 4] === 200 && P.c[24 * 4] === 1, 'papelera: color por anillo');
  const A = new G.GB(0, 0); G.rev(A, FR, 2, 0, [[0.5, 0], [0.5, 3]], 6, [5, 5, 5], 0, { a0: 0, a1: Math.PI, cap: 3 });
  check(A, 'media columna', 12 + 2 * 5);
  let behind = 0; for (let k = 0; k < A.nv; k++) { const p = V(A, k), dd = (p[0] - FR.x) * FR.nx + (p[2] - FR.z) * FR.nz; if (dd < -1e-5) behind++; } ok(!behind, 'media columna: puntos por detrás del plano de fachada ' + behind);
  const C = new G.GB(0, 0); G.cyl(C, 1, 1, 0, 1, 0.2, 0.2, 10, [1, 1, 1], 5); check(C, 'cyl', 3 * 10 - 2);
}
// ---- tube
{
  // codo recto: todos los vértices del anillo del codo quedan a distancia r de los dos ejes (inglete exacto)
  const B = new G.GB(0, 0), r = 0.05; G.tube(B, F0, [[0, 0, 0], [0, 2, 0], [1.5, 2, 0]], r, 8, [1, 1, 1], 15, { caps: true });
  check(B, 'tubo en L', 2 * 16 + 2 * 6);
  let bad = 0; for (let k = 8; k < 16; k++) { const p = V(B, k), d1 = Math.hypot(p[0], p[2]), d2 = Math.hypot(p[1] - 2, p[2]); if (!near(d1, r, 1e-5) || !near(d2, r, 1e-5)) bad++; } ok(!bad, 'tubo: inglete inexacto en ' + bad + ' vértices');
  for (const k of [0, 16]) { const p = V(B, k); ok(near(k ? p[0] : p[1], k ? 1.5 : 0, 1e-6), 'tubo: extremo plano'); }
  ok(near(Nv(B, 24)[1], -1, 0.02) && near(Nv(B, 32)[0], 1, 0.02), 'tubo: normales de las tapas ' + Nv(B, 24) + ' ' + Nv(B, 32));
  // rueda (anillo cerrado y plano, en un plano vertical cualquiera): sin torsión y con normales perpendiculares a la tangente
  const Wh = new G.GB(0, 0), ring = [], ang = 0.9, fx = Math.cos(ang), fz = Math.sin(ang);
  for (let k = 0; k < 12; k++) { const a = k / 12 * 2 * Math.PI; ring.push([4 + fx * Math.cos(a) * 0.31, 0.33 + Math.sin(a) * 0.31, 6 + fz * Math.cos(a) * 0.31]); }
  G.tube(Wh, F0, ring, 0.028, 3, [1, 1, 1], 15, { closed: true });
  check(Wh, 'rueda', 12 * 3 * 2);
  let worst = 0, off = 0; for (let k = 0; k < 12; k++) for (let s = 0; s < 3; s++) { const a = V(Wh, k * 3 + s), b = V(Wh, ((k + 1) % 12) * 3 + s), c = ring[k], e = ring[(k + 1) % 12];
    const seg = Math.hypot(e[0] - c[0], e[1] - c[1], e[2] - c[2]), dl = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); worst = Math.max(worst, Math.abs(dl - seg) / seg);
    const n = Nv(Wh, k * 3 + s), pv = ring[(k + 11) % 12], t = [e[0] - pv[0], e[1] - pv[1], e[2] - pv[2]], tl = Math.hypot(...t); off = Math.max(off, Math.abs(n[0] * t[0] + n[1] * t[1] + n[2] * t[2]) / tl); }
  ok(worst < 0.2 && off < 0.02, 'rueda: torsión ' + worst + ' normal·tangente ' + off);
  // anillo cerrado NO plano: el reparto de la torsión deja la costura como los demás tramos
  const Kn = new G.GB(0, 0), pts = []; for (let k = 0; k < 24; k++) { const a = k / 24 * 2 * Math.PI; pts.push([Math.cos(a) * 2, Math.sin(2 * a) * 0.8 + Math.cos(3 * a) * 0.3, Math.sin(a) * 2]); }
  G.tube(Kn, F0, pts, 0.1, 6, [1, 1, 1], 15, { closed: true }); check(Kn, 'anillo alabeado', 24 * 12);
  let wmax = 0, wseam = 0; for (let k = 0; k < 24; k++) { let w = 0; for (let s = 0; s < 6; s++) { const a = V(Kn, k * 6 + s), b = V(Kn, ((k + 1) % 24) * 6 + s), c = pts[k], e = pts[(k + 1) % 24];
      w = Math.max(w, Math.abs(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) - Math.hypot(e[0] - c[0], e[1] - c[1], e[2] - c[2]))); } if (k === 23) wseam = w; else wmax = Math.max(wmax, w); }
  ok(wseam < wmax * 1.5 + 0.01, 'anillo alabeado: costura retorcida ' + wseam + ' frente a ' + wmax);
  // radio variable y tramo vertical (caso degenerado del vector de referencia)
  const Tp = new G.GB(0, 0); G.tube(Tp, FR, [[0, 0, 0], [0, 1, 0], [0, 2, 0.5]], t => 0.2 - 0.1 * t, 5, [1, 1, 1], 4); check(Tp, 'tubo cónico', 2 * 10);
}
// ---- quadN / triN / auxiliares / planas con aux
{
  const B = new G.GB(0, 0); G.quadN(B, F0, [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], [[0, 0, 2], [0, 0, 2], [0, 1, 1], [0, 1, 1]], [1, 2, 3], 15, G.pbrAux(1, 1, 3, 1));
  G.triN(B, F0, [[0, 0, 0], [1, 0, 0], [1, 1, 0]], [[0, 0, 1], [0, 0, 1], [0, 0, 1]], [1, 2, 3], 15);
  check(B, 'quadN+triN', 3); ok(B.a[0] === 255 && B.a[1] === 255 && B.a[2] === 3 && B.a[3] === 250 && B.a[15] === 250, 'pbrAux ' + Array.from(B.a.slice(0, 16)));
  ok(near(Nv(B, 2)[1], 0.707, 0.01) && near(Nv(B, 0)[2], 1, 0.01), 'quadN: normales');
  const s = G.subAux(), s2 = G.subAux(G.signAux(5)); ok(s.length === 16 && s[3] === 255 && s[15] === 255 && s[0] === 0 && s2[2] === 5 && s2[7] === 255 && G.signAux(5)[3] === 0, 'subAux');
  const Q = new G.GB(0, 0); G.rect(Q, F0, 0, 1, 0, 1, 0, [1, 1, 1], 11, G.subAux()); G.box(Q, F0, 0, 1, 0, 1, 0, 1, [9, 9, 9], 15, 7, G.pbrAux(0.5, 0, 2, 0)); G.obox(Q, 0, 0, 0, 1, 1, 1, 0.3, [9, 9, 9], 15, G.pbrAux(0.5, 0, 2, 0)); G.bar(Q, [0, 0, 0], [1, 1, 1], 0.1, [9, 9, 9], 15, G.pbrAux(0.5, 1, 0, 0));
  ok(Q.a[3] === 255 && Q.n[3] === 0 && Q.a[4 * 4 + 2] === 2 && Q.a[(4 + 20) * 4 + 2] === 2 && Q.a[(4 + 20 + 24) * 4 + 1] === 255 && Q.ni / 3 === 2 + 10 + 12 + 8, 'planas con aux: ' + Q.ni / 3);
  let thrown = 0; for (const id of [15, 19, 2, 256]) try { G.regKind('X' + id, id, ''); } catch (e) { thrown++; } ok(thrown === 4 && G.regKind('OKK', 20, '') === 20 && G.K.PBR === 15, 'regKind: rangos');
}
console.log(fails ? 'FALLOS: ' + fails : 'geo.js: todo bien');
process.exit(fails ? 1 : 0);
