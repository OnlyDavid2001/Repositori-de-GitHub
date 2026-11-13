/* GTA Barcelona · Condal City — PIEZAS del bloque 3 del kit (Fase 2c): torre (villa con jardín), racionalista / déco,
   vivienda social actual, fábrica y polígono. Las registra en window.BCN_KIT (kit.js) con pieza(nombre, fn); los estilos
   (estilos_b3.js) las nombran en sus campos pb, pbFr, vano, corona y fachada. Ranuras y su q: cabecera de kit.js.
   Tipos de material propios (rango 184–191): 184 CHAPA (chapa perforada: celosías metálicas, persianas grandes de fábrica),
   185 LISTON (revestimiento de listones de madera vertical); acabado de muro V.acab 'listones' (185). Los faldones de teja usan
   el K.TEJA de rooftops.js (teja árabe que sigue la pendiente).
   Piezas de uso general (las pueden usar los demás bloques): tejado (faldón de teja a cuatro aguas de un tramo), torreon
   (torre cuadrada con cubierta de pabellón), chimenea (de ladrillo, una por edificio), aro (anillo plano: ojos de buey,
   ruedas), ojo_buey, grafiti, bici, deposito (depósito de agua del terrado), banda_curva (balcón o franja de esquina
   redondeada) y frente_pilotis. */
(function () {
'use strict';
const KIT = window.BCN_KIT, GEO = window.BCN_GEO;
const { K, regKind, quad, rect, jamb, hpl, box, lattice, shade, mixc, pbrAux, rev } = GEO;

regKind('CHAPA', 184, `
    rough = 0.55; metal = 0.25;
    vec2 q = P/0.06; vec2 f = fract(q) - 0.5; vec2 fw = fwidth(q); float far = smoothstep(0.25, 0.7, max(fw.x, fw.y));
    float hole = 1.0 - smoothstep(0.17, 0.25, length(f));
    alb = mix(alb, alb*0.4, hole*(1.0 - far)*0.85 + far*0.18);`);
regKind('LISTON', 185, `
    rough = 0.74;
    vec2 q = P/vec2(0.12, 3.0); q.y += hash21(vec2(floor(q.x), 1.3))*2.0;
    vec2 f = fract(q), fw = fwidth(q); float far = smoothstep(0.15, 0.5, max(fw.x, fw.y));
    float jn = 1.0 - smoothstep(0.0, 0.07, min(f.x, 1.0 - f.x));
    float gr = vnoise(vec2(P.x*40.0, P.y*1.5));
    alb *= mix(0.86, 1.1, hash21(floor(q)))*mix(0.92, 1.05, gr);
    alb = mix(alb, alb*0.55, jn*(1.0 - far));`);
KIT.acabado('listones', 185);

const P = KIT.P, pieza = KIT.pieza;
const KS = () => K.FXPIEDRA !== undefined ? K.FXPIEDRA : K.STONE;
const KT = () => K.TEJA !== undefined ? K.TEJA : K.STUCCO;   // teja árabe de rooftops.js (se registra después; las piezas corren al construir)
const wr = (...a) => KIT.T.wr(...a);
const RQ = (...a) => window.BCN_INTERIORS.roomQuad(...a);
const h01 = (a, b) => { let h = Math.imul(a ^ 0x5bd1e995, 0x9e3779b1) ^ Math.imul(b + 0x6d2b79f5, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const ALU = [168, 170, 168], ACERO = [52, 56, 58], TEJA = [168, 82, 56], HORM = [168, 166, 160];
const KL = 16, KH = 19;                               // ladrillo y hormigón del núcleo (facades.js)
const tri = (B, F, u0, y0, d0, u1, y1, d1, u2, y2, d2, col, k) => quad(B, F, u0, y0, d0, u1, y1, d1, u2, y2, d2, u2, y2, d2, col, k);

// ================================================================ PIEZAS GENERALES
// faldón de teja de un tramo de calle: alero que vuela e m, sube h hasta la cumbrera retirada dr m; los extremos, a cuatro
// aguas (limatesas) para que el tramo se cierre solo aunque el vecino no tenga tejado
pieza('tejado', function (B, F, L, y, e, dr, h, col) {
  if (!B || L < 1) return; const hx = Math.min(dr + e, L / 2);
  quad(B, F, 0, y, e, L, y, e, L - hx, y + h, -dr, hx, y + h, -dr, col, KT());
  tri(B, F, 0, y, e, hx, y + h, -dr, 0, y, -dr, shade(col, 0.88), KT());
  tri(B, F, L, y, -dr, L - hx, y + h, -dr, L, y, e, shade(col, 0.88), KT());
  box(B, F, 0, L, y - 0.12, y, e - 0.08, e, shade(col, 0.8), K.STUCCO, 1);   // canto del alero (cobijas)
});
// torre cuadrada de u0 a u1 (fondo fd hacia dentro desde la fachada), de y0 a yt, con cornisa y cubierta de pabellón de teja
// (alto hc; cono de 8 lados si cono); vanos en arco en las caras que se ven; color y tipo del muro del edificio
pieza('torreon', function (env, F, u0, u1, y0, yt, fd, hc, cono) {
  const { W0, W1 } = env, wc = env.runWall || env.p, kw = env.kw, w = u1 - u0, d0 = -fd, d1 = 0.06, c = (u0 + u1) / 2, dc = (d0 + d1) / 2;
  box(W0, F, u0, u1, y0, yt, d0, d1, wc, kw, 4);
  quad(W0, F, u1, y0, d0, u0, y0, d0, u0, yt, d0, u1, yt, d0, shade(wc, 0.85), kw);
  box(W0, F, u0 - 0.12, u1 + 0.12, yt, yt + 0.22, d0 - 0.12, d1 + 0.12, env.uV, K.STUCCO, 7);
  const ww = Math.min(0.9, w * 0.26), ys = yt - 1.05, yb = Math.max(y0 + 0.4, ys - 1.4);
  for (const s of w > 2.6 ? [-0.25, 0.25] : [0]) { const cu = c + s * w;     // miradores en arco (vidrio oscuro y medio punto)
    rect(W0, F, cu - ww / 2, cu + ww / 2, yb, ys, d1 + 0.005, [40, 46, 52], K.GLASS);
    P.arco(W0, F, cu - ww / 2, cu + ww / 2, ys - 0.001, ys + ww / 2 + 0.05, d1 + 0.01, d1 - 0.06, wc, kw, 0);
    if (W1) box(W1, F, cu - ww / 2 - 0.08, cu + ww / 2 + 0.08, yb - 0.1, yb, d1, d1 + 0.12, env.uV, K.STUCCO, 7); }
  const tc = env.tejaC || TEJA, ya = yt + 0.22, e = 0.35;
  if (cono) { rev(W0, F, c, dc, [[w * 0.62, ya], [0.02, ya + hc]], 8, tc, KT(), { cap: 1 }); }
  else { const a = u0 - e, b = u1 + e, p0 = d0 - e, p1 = d1 + e, ap = [c, ya + hc, dc];
    tri(W0, F, a, ya, p1, b, ya, p1, ap[0], ap[1], ap[2], tc, KT()); tri(W0, F, b, ya, p1, b, ya, p0, ap[0], ap[1], ap[2], shade(tc, 0.88), KT());
    tri(W0, F, a, ya, p0, a, ya, p1, ap[0], ap[1], ap[2], shade(tc, 0.88), KT()); tri(W0, F, b, ya, p0, a, ya, p0, ap[0], ap[1], ap[2], shade(tc, 0.8), KT()); }
  if (W1) box(W1, F, c - 0.03, c + 0.03, ya + hc - 0.1, ya + hc + 0.9, dc - 0.03, dc + 0.03, [60, 60, 58], K.METAL, 4);   // aguja / pararrayos
});
// chimenea de ladrillo troncocónica (fábricas): base cuadrada, fuste de 8 lados y anillos; en W0 (da la silueta)
pieza('chimenea', function (B, F, u, d, y0, h, col) {
  if (!B) return;
  box(B, F, u - 1.1, u + 1.1, y0, y0 + 2.4, d - 1.1, d + 1.1, shade(col, 0.95), KL, 7);
  box(B, F, u - 1.25, u + 1.25, y0 + 2.4, y0 + 2.7, d - 1.25, d + 1.25, shade(col, 1.1), KL, 7);
  rev(B, F, u, d, [[0.95, y0 + 2.7], [0.55, y0 + h]], 8, col, KL, { cap: 0 });
  for (const f of [0.55, 0.985]) { const y = y0 + 2.7 + (h - 2.7) * f, r = 0.95 - 0.4 * f + 0.1;
    rev(B, F, u, d, [[r, y - 0.35], [r, y]], 8, shade(col, 0.82), KL, { cap: 1 }); }
});
// anillo plano (8–12 lados) de radio r y grueso t en (u, y), a d
pieza('aro', function (B, F, u, y, r, t, d, col, k, n) {
  if (!B) return; n = n || 10;
  for (let i = 0; i < n; i++) { const a0 = 2 * Math.PI * i / n, a1 = 2 * Math.PI * (i + 1) / n;
    quad(B, F, u + Math.cos(a0) * (r - t), y + Math.sin(a0) * (r - t), d, u + Math.cos(a1) * (r - t), y + Math.sin(a1) * (r - t), d,
      u + Math.cos(a1) * r, y + Math.sin(a1) * r, d, u + Math.cos(a0) * r, y + Math.sin(a0) * r, d, col, k); }
});
// ojo de buey: vidrio redondo con aro de estuco saliente (racionalismo, escaleras)
pieza('ojo_buey', function (env, F, u, y, r) {
  const n = 10, gl = [44, 52, 60];
  for (let i = 0; i < n; i++) { const a0 = 2 * Math.PI * i / n, a1 = 2 * Math.PI * (i + 1) / n;
    tri(env.W0, F, u, y, 0.01, u + Math.cos(a0) * r, y + Math.sin(a0) * r, 0.01, u + Math.cos(a1) * r, y + Math.sin(a1) * r, 0.01, gl, K.GLASS); }
  P.aro(env.W0, F, u, y, r + 0.12, 0.14, 0.06, shade(env.uV, 1.05), K.STUCCO, n);
});
// grafitis en una planta baja: manchas de color superpuestas (sin letras ni firmas legibles), de u0 a u1 hasta y1, a d
const GRAF = [[214, 58, 116], [52, 164, 214], [246, 196, 42], [36, 36, 40], [112, 196, 84], [236, 236, 230], [240, 110, 40], [140, 80, 190]];
pieza('grafiti', function (B, F, u0, u1, y0, y1, d, s) {
  if (!B || u1 - u0 < 0.8) return; const n = 2 + ((h01(s, 1) * 4) | 0);
  for (let i = 0; i < n; i++) { const r = h01(s, i + 2), r2 = h01(s, i + 40), w = 0.5 + r * 1.6, h = 0.3 + r2 * Math.min(1.2, y1 - y0 - 0.2);
    const u = u0 + r2 * Math.max(0, u1 - u0 - w), y = y0 + 0.15 + r * Math.max(0, y1 - y0 - h - 0.2), sk = (r - 0.5) * 0.3;
    quad(B, F, u, y, d + i * 0.003, u + w, y + sk, d + i * 0.003, u + w + sk, y + h + sk, d + i * 0.003, u + sk, y + h, d + i * 0.003,
      GRAF[(h01(s, i + 80) * GRAF.length) | 0], K.PBR, pbrAux(0.7, 0, 0, 0)); }
});
// bicicleta apoyada en una barandilla (vista de lado): dos ruedas, cuadro y manillar
pieza('bici', function (B, F, u, y, d, col) {
  if (!B) return; const r = 0.33;
  P.aro(B, F, u, y + r, r, 0.05, d, [30, 30, 32], K.PBR, 8); P.aro(B, F, u + 1.05, y + r, r, 0.05, d, [30, 30, 32], K.PBR, 8);
  quad(B, F, u, y + r, d + 0.01, u + 0.55, y + r, d + 0.01, u + 0.75, y + r + 0.45, d + 0.01, u + 0.35, y + r + 0.42, d + 0.01, col, K.METAL);
  box(B, F, u + 0.72, u + 0.76, y + r, y + r + 0.65, d, d + 0.03, col, K.METAL, 0);
  box(B, F, u + 0.3, u + 0.5, y + r + 0.5, y + r + 0.55, d - 0.05, d + 0.05, [40, 40, 40], K.PBR, 7);
});
// depósito de agua del terrado (fibrocemento o chapa), cilíndrico sobre dos durmientes
pieza('deposito', function (B, F, u, d, y, r, h, col) {
  if (!B) return; box(B, F, u - r, u + r, y, y + 0.25, d - 0.15, d + 0.15, [120, 118, 112], K.STUCCO, 7);
  rev(B, F, u, d, [[r, y + 0.25], [r, y + 0.25 + h], [r * 0.85, y + 0.35 + h], [0.02, y + 0.4 + h]], 8, col, K.PBR, { cap: 0, aux: pbrAux(0.7, 0.1, 0, 0) });
});
// franja curva saliente (esquina redondeada): de ángulo a0 a a1 (0 = +u, π/2 = hacia fuera), radio r, centro (u, d), de y0 a y1
pieza('banda_curva', function (B, F, u, d, r, y0, y1, a0, a1, col, k, n) {
  if (!B) return; rev(B, F, u, d, [[r, y0], [r, y1]], n || 6, col, k, { a0, a1 });
  rev(B, F, u, d, [[0.02, y1], [r, y1]], n || 6, shade(col, 1.04), k, { a0, a1 });
  rev(B, F, u, d, [[r, y0], [0.02, y0]], n || 6, shade(col, 0.8), k, { a0, a1 });
});
// pilotis: pilares exentos de hormigón en el frente de la planta baja retranqueada (polígonos), grafitis en el fondo
pieza('frente_pilotis', function (env, run, q) {
  const { W0, W1, F1 } = env, F = run.F, pc = shade(HORM, 0.98), r = 0.24;
  const pil = u => { box(W0, F, u - r, u + r, q.yB, F1, -0.6, -0.12, pc, KH, 4); quad(W0, F, u - r, q.yB, -0.12, u + r, q.yB, -0.12, u + r, F1, -0.12, u - r, F1, -0.12, pc, KH); };
  pil(q.a + (q.W === 0 ? r + 0.05 : 0)); if (q.W === q.nb - 1) pil(q.a + q.bw - r - 0.05);
  box(W0, F, q.a, q.a + q.bw, F1 - 0.5, F1, -0.6, 0.02, shade(env.uV, 0.95), KH, 2);   // jácena
});

// ================================================================ TORRE (villa con jardín)
const BUGA = [[170, 40, 110], [196, 60, 130], [150, 30, 90]];
// frente del jardín: murete de piedra, verja de forja, pilares de la cancela con bola, buganvilla y alguna palmera
pieza('frente_torre', function (env, run, q) {
  const { W0, W1 } = env, F = run.F, a = q.a, b = a + q.bw, g = q.gl, st = shade(env.stone, 1.06), ks = KS();
  const gate = run.N >= 0 ? q.W === run.N : q.W === 0, c = (a + b) / 2, d = -0.12;
  const pilar = u => { box(W0, F, u - 0.24, u + 0.24, q.yB, g + 2.1, d - 0.24, d + 0.24, st, ks, 7);
    if (W1) { box(W1, F, u - 0.3, u + 0.3, g + 2.1, g + 2.2, d - 0.3, d + 0.3, shade(st, 1.06), ks, 7); rev(W1, F, u, d, [[0.02, g + 2.2], [0.17, g + 2.33], [0.02, g + 2.5]], 6, shade(st, 1.08), ks); } };
  if (q.W === 0) pilar(0.24); if (q.W === q.nb - 1) pilar(b - 0.24);
  const e0 = q.W === 0 ? 0.48 : a, e1 = q.W === q.nb - 1 ? b - 0.48 : b;
  if (gate) { const w = Math.min(1.3, e1 - e0 - 0.9); pilar(c - w / 2 - 0.24); pilar(c + w / 2 + 0.24);
    box(W0, F, e0, c - w / 2 - 0.48, q.yB, g + 0.75, d - 0.2, d + 0.2, st, ks, 1); box(W0, F, c + w / 2 + 0.48, e1, q.yB, g + 0.75, d - 0.2, d + 0.2, st, ks, 1);
    lattice(W0, F, e0, c - w / 2 - 0.48, g + 0.75, g + 1.8, d, env.iron, K.IRON, 1); lattice(W0, F, c + w / 2 + 0.48, e1, g + 0.75, g + 1.8, d, env.iron, K.IRON, 1);
    lattice(W0, F, c - w / 2, c + w / 2, g + 0.05, g + 2.0, d, env.iron, K.IRON, 1);
    hpl(W0, F, c - w / 2, c + w / 2, g + 0.06, -q.dep, d, [158, 150, 138], ks);
  } else {
    box(W0, F, e0, e1, q.yB, g + 0.75, d - 0.2, d + 0.2, st, ks, 1);
    lattice(W0, F, e0, e1, g + 0.75, g + 1.8, d, env.iron, K.IRON, 1);
    if (W1) box(W1, F, e0, e1, g + 1.78, g + 1.82, d - 0.02, d + 0.02, env.iron, K.METAL, 1);
  }
  // jardín: setos y buganvilla trepando por la verja (magenta); palmera en uno de cada ~3 edificios
  const n = Math.max(1, Math.round((e1 - e0) / 1.4)), r = h01(env.b, q.W + 3);
  for (let i = 0; i < n; i++) { const u = e0 + (e1 - e0) * (i + 0.5) / n; if (gate && Math.abs(u - c) < 1.1) continue;
    const h = 0.9 + h01(env.b, q.W * 8 + i) * 0.8;
    box(W1 || W0, F, u - 0.55, u + 0.55, g + 0.5, g + 0.5 + h, -1.4, -0.45, [56 + (i % 2) * 12, 90, 48], K.LEAF, 7);
    if ((r + i * 0.37) % 1 < 0.3) for (let j = 0; j < 6; j++) {   // buganvilla que cuelga de la verja: ramos estrechos, flor y hoja alternas
      const v = h01(env.b, q.W * 64 + i * 8 + j), x = u - 0.95 + j * 0.33 + v * 0.1, top = g + 1.7 + v * 0.45;
      box(W1 || W0, F, x, x + 0.2 + v * 0.16, top - 0.3 - v * 0.65, top, d + 0.02, d + 0.14 + v * 0.06, j % 2 ? [70, 102, 50] : BUGA[(j + i) % 3], K.LEAF, 7); } }
  if (q.W === (q.nb > 2 ? 1 : 0) && h01(env.b, 91) < 0.4 && env.F1 - g > 2) {   // palmera: tronco y penacho por encima del primer piso
    const u = gate ? (q.W === 0 ? b - 0.6 : a + 0.6) : c, dd = -Math.min(1.3, q.dep * 0.6), ht = env.F1 + 3.2 + h01(env.b, 92) * 3, cc = [112, 100, 82];
    box(W0, F, u - 0.16, u + 0.16, g, ht, dd - 0.16, dd + 0.16, cc, K.WOOD, 4);
    for (let i = 0; i < 7; i++) { const a = i * 0.9, du = Math.cos(a) * 1.9, dz = Math.sin(a) * 1.1;
      quad(W0, F, u, ht + 0.1, dd, u + du, ht - 0.7 + (i % 2) * 0.3, dd + dz, u + du * 1.05, ht - 0.35 + (i % 2) * 0.3, dd + dz + 0.25, u, ht + 0.35, dd, [70 + i * 4, 110, 58], K.LEAF); }
  }
});
pieza('pb_torre', function (env, run, q) {
  const { W0, W1 } = env, F = q.F, top = env.F1, rr = q.rr, vi = env.V.vi;
  if (q.portal) {
    const w = Math.min(1.5, q.bw - 0.8), h = Math.min(2.7, top - q.gl - 0.6);
    const r = P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w, gl: q.gl + 0.45, h: h - 0.45, yB: q.yB, top, tipo: 'madera', col: run.wallC, kw: env.kw, dep: 0.3,
      madera: [[92, 58, 34], [60, 80, 62], [70, 46, 30]][(rr[2] * 3) | 0], marco: { col: shade(env.stone, 1.08), k: KS(), w: 0.18, d: 0.06, W0: true }, arco: vi === 0 ? 1 : 0, rr });
    box(W0, F, q.c - w / 2 - 0.6, q.c + w / 2 + 0.6, q.gl, q.gl + 0.15, 0, 0.9, [176, 168, 154], KS(), 7);      // escalinata
    box(W0, F, q.c - w / 2 - 0.45, q.c + w / 2 + 0.45, q.gl + 0.15, q.gl + 0.3, 0, 0.6, [182, 174, 160], KS(), 7);
    box(W0, F, q.c - w / 2 - 0.3, q.c + w / 2 + 0.3, q.gl + 0.3, q.gl + 0.45, 0, 0.3, [188, 180, 166], KS(), 7);
    if (vi === 3 && W1) for (let x = r.tt - 0.5; x <= r.ct + 0.5; x += (r.ct - r.tt + 1) / 3)       // regionalista: tejadillo sobre la puerta
      box(W1, F, x - 0.05, x + 0.05, r.yt + 0.25, r.yt + 0.35, 0, 0.8, env.wood, K.WOOD, 7);
    if (vi === 3) quad(W0, F, r.tt - 0.6, r.yt + 0.35, 0, r.ct + 0.6, r.yt + 0.35, 0, r.ct + 0.6, r.yt + 0.1, 0.9, r.tt - 0.6, r.yt + 0.1, 0.9, TEJA, KT());
    return;
  }
  if (q.W === run.nb - 1 && run.nb >= 3 && run.r === env.lay.portal) {   // garaje de la villa (puerta de madera de lamas)
    P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w: Math.min(2.6, q.bw - 0.6), gl: q.gl, h: Math.min(2.3, top - q.gl - 0.6), yB: q.yB, top, tipo: 'garaje',
      col: run.wallC, kw: env.kw, dep: 0.2, met: [[96, 70, 46], [70, 84, 66], [200, 196, 186]][(rr[3] * 3) | 0] });
    return;
  }
  // ventanal del salón al jardín: balconera alta con persianas de librillo
  const w = Math.min(1.3, q.bw - 1.0), tt = q.c - w / 2, ct = q.c + w / 2, st = q.gl + 0.35, yt = Math.min(top - 0.4, st + 2.4);
  if (yt - st < 1) return false;
  env.windowHole(W0, F, q.a, q.a + q.bw, tt, ct, q.yB, top, st, yt, 0.25, run.wallC, env.kw, rr[0] < 0.5 ? 0.15 + rr[1] * 0.4 : 0);
  if (W1) { const sc = env.shutV; rect(W1, F, tt - w / 2, tt - 0.02, st, yt, 0.04, sc, K.SHUT); rect(W1, F, ct + 0.02, ct + w / 2, st, yt, 0.04, sc, K.SHUT); }
});
const TRENC = [[38, 96, 160], [214, 170, 50], [60, 140, 90], [200, 80, 60], [236, 232, 220], [90, 160, 190]];
pieza('vano_torre', function (env, run, q) {
  const V = q.V, vi = V.vi, rr = q.rr, { W0, W1 } = env, F = run.F;
  if (q.low) return false;
  KIT.T.vano(env, run, q);
  const g = KIT.medidas(q);
  if (vi === 0) {                                     // modernista: el hueco acaba en arco (de medio punto o rebajado) con trencadís alrededor
    const w = g.ct - g.tt, rise = Math.min(w / 2, (g.yt - g.st) * 0.4), seg = rise < w / 2 - 0.01 ? rise / w : 0, ys = g.yt - rise;
    P.arco(W0, F, g.tt, g.ct, ys, g.yt + 0.002, 0.004, -0.3, run.wallC, env.kw, seg);
    if (W1) { const n = 7, f = seg ? Math.min(1, seg * 2) : 1; for (let i = 0; i < n; i++) { const a = Math.PI * (i + 0.5) / n, u = q.c - Math.cos(a) * (w / 2 + 0.12), y = ys + Math.sin(a) * (w / 2 + 0.12) * f + 0.06;
      box(W1, F, u - 0.08, u + 0.08, y - 0.08, y + 0.08, 0, 0.04, TRENC[(i + q.W + q.D) % TRENC.length], K.PBR, 7, pbrAux(0.15, 0.1, 0, 0)); } }
  } else if (vi === 1 && q.D === 1 && q.W === (q.nb >> 1)) {   // villa novecentista: frontón sobre el hueco central
    P.fronton(W0, F, q.c, g.Vw + 0.6, g.yt + 0.12, 0.38, 0.2, shade(env.uV, 1.03), K.STUCCO, false);
  } else if (vi === 3 && W1) {                        // regionalista: contraventanas de madera y entramado bajo el alféizar
    const w = g.ct - g.tt; rect(W1, F, g.tt - w / 2, g.tt - 0.02, g.st, g.yt, 0.05, env.shutV, K.WOOD); rect(W1, F, g.ct + 0.02, g.ct + w / 2, g.st, g.yt, 0.05, env.shutV, K.WOOD);
    box(W1, F, g.tt - w / 2 - 0.05, g.ct + w / 2 + 0.05, g.yt + 0.02, g.yt + 0.2, 0, 0.12, env.wood, K.WOOD, 7);   // dintel de madera
  }
});
pieza('corona_torre', function (env, run, q) {
  const { W0, W1, C, y1, V } = env, F = run.F, L = run.L, wc = run.wallC, vi = V.vi;
  env.tejaC = env.tejaC || [[168, 82, 56], [150, 76, 54], [178, 98, 66], [140, 92, 70]][(h01(env.b, 21) * 4) | 0];
  const tc = env.tejaC, dr = Math.min(3.4, 0.9 + L * 0.18), hRoof = dr * (vi === 3 ? 1.0 : 0.92);
  if (vi === 1) {                                     // villa novecentista: cornisa con balaustrada y urnas; tejado bajo detrás
    wr(W0, F, 0, L, C, y1, wc, env.kw);
    box(W0, F, 0, L, y1 - 0.2, y1, 0, 0.45, env.uV, K.STUCCO); box(W0, F, 0, L, y1, y1 + 0.18, -0.02, 0.22, shade(env.uV, 1.04), K.STUCCO);
    lattice(W0, F, 0, L, y1 + 0.18, y1 + 0.75, 0.1, env.uV, K.BAL, 0); box(W0, F, 0, L, y1 + 0.75, y1 + 0.88, -0.02, 0.22, env.uV, K.STUCCO);
    for (let W = 0; W <= q.nb; W += 2) { const u = Math.min(L - 0.15, Math.max(0.15, W * q.bw)); box(W0, F, u - 0.16, u + 0.16, y1 + 0.18, y1 + 0.88, -0.02, 0.24, env.uV, K.STUCCO);
      P.urna(W1, F, u, y1 + 0.88, 0.1, shade(env.uV, 1.02)); }
    P.tejado(W0, F, L, y1 + 0.3, -0.6, dr, hRoof * 0.6, tc);
    return;
  }
  wr(W0, F, 0, L, C, y1, wc, env.kw);
  const e = vi === 3 ? 1.0 : 0.7;
  if (vi === 0 && W1) {                               // modernista: friso de trencadís bajo el alero
    for (let u = 0.1; u < L - 0.2; u += 0.32) box(W1, F, u, u + 0.26, y1 - 0.42, y1 - 0.16, 0, 0.03, TRENC[((u * 7.31 + env.b) | 0) % TRENC.length], K.PBR, 7, pbrAux(0.15, 0.1, 0, 0)); }
  hpl(W0, F, 0, L, y1 - 0.02, 0, e, vi === 3 ? env.wood : shade(env.uV, 0.96), vi === 3 ? K.WOOD : K.STUCCO);
  if (W1) for (let x = 0.25; x < L - 0.1; x += vi === 3 ? 0.9 : 0.6) box(W1, F, x, x + (vi === 3 ? 0.14 : 0.08), y1 - 0.3, y1, 0, e - 0.1, vi === 3 ? env.wood : env.uV, vi === 3 ? K.WOOD : K.STUCCO, 6);
  if (vi === 3 && L > 6) {                            // chalet regionalista: hastial central de pendiente fuerte con tablas de alero
    const w = Math.min(L * 0.45, 7), c = L / 2, hg = w * 0.42, a0 = c - w / 2, a1 = c + w / 2, ed = e + 0.3;
    tri(W0, F, a0, y1, 0.01, a1, y1, 0.01, c, y1 + hg, 0.01, wc, env.kw);
    if (W1) { box(W1, F, c - 0.07, c + 0.07, y1, y1 + hg - 0.2, 0.01, 0.06, env.wood, K.WOOD, 4); box(W1, F, a0 + 0.4, a1 - 0.4, y1 + 0.6, y1 + 0.7, 0.01, 0.06, env.wood, K.WOOD, 3); }
    rect(W0, F, c - 0.35, c + 0.35, y1 + 0.9, y1 + 1.6, 0.0, [40, 46, 52], K.GLASS);
    quad(W0, F, a0 - 0.4, y1 - 0.2, ed, c, y1 + hg + 0.2, ed, c, y1 + hg + 0.2, -dr, a0 - 0.4, y1 - 0.2, -dr, tc, KT());
    quad(W0, F, c, y1 + hg + 0.2, ed, a1 + 0.4, y1 - 0.2, ed, a1 + 0.4, y1 - 0.2, -dr, c, y1 + hg + 0.2, -dr, shade(tc, 0.9), KT());
    quad(W0, F, a0 - 0.4, y1 - 0.2, ed, c, y1 + hg + 0.2, ed, c, y1 + hg - 0.05, ed, a0 - 0.4, y1 - 0.45, ed, env.wood, K.WOOD);   // tablas de alero
    quad(W0, F, c, y1 + hg + 0.2, ed, a1 + 0.4, y1 - 0.2, ed, a1 + 0.4, y1 - 0.45, ed, c, y1 + hg - 0.05, ed, env.wood, K.WOOD);
  }
  P.tejado(W0, F, L, y1, e, dr, hRoof, tc);
  // torreón: casa señorial (siempre) o modernista con cono (a veces)
  // (en el tramo de calle más largo del edificio, que es el que da a la calle principal)
  let lg = null; for (const r of env.lay.runs) if (r.kind === 'street' && (!lg || r.L > lg.L)) lg = r;
  const tor = run.r === lg && (vi === 2 || (vi === 0 && h01(env.b, 22) < 0.6));
  if (tor && L >= 7 && !env._torre) { env._torre = 1; const tw = Math.min(4.2, Math.max(3.0, L * 0.28)), left = h01(env.b, 23) < 0.5;
    const u0 = left ? 0.3 : L - tw - 0.3; P.torreon(env, F, u0, u0 + tw, C - 0.2, y1 + 3.4, Math.min(3.6, tw), vi === 0 ? 2.6 : 1.8, vi === 0); }
});

// ================================================================ RACIONALISTA / DÉCO
pieza('pb_racionalista', function (env, run, q) {
  const { W0, W1 } = env, F = q.F, top = env.F1, rr = q.rr, vi = env.V.vi;
  if (!q.portal) {
    if (vi !== 3) {                                   // estuco liso con ventana apaisada alta y zócalo oscuro (sin sillería)
      const a = q.a, bb = a + q.bw, st = q.gl + 1.35, yt = Math.min(top - 0.45, st + 1.15);
      if (yt - st < 0.5) return false;
      env.windowHole(W0, F, a, bb, a + 0.35, bb - 0.35, q.yB, top, st, yt, 0.2, run.wallC, env.kw, rr[0] < 0.5 ? 0.2 + rr[1] * 0.5 : 0);
      box(W0, F, a, bb, q.yB, q.gl + 0.45, 0, 0.03, shade(run.wallC, 0.62), K.STUCCO, 1);
      if (W1) { box(W1, F, a + 0.35, bb - 0.35, st - 0.05, st, 0, 0.06, shade(env.uV, 1.04), K.STUCCO, 7);
        for (let i = 1; i < 3; i++) { const x = a + 0.35 + (q.bw - 0.7) * i / 3; box(W1, F, x - 0.02, x + 0.02, st, yt, -0.2, -0.16, env.marcoV, K.METAL, 4); } }
      return;
    }                                                 // Casa Bloc: planta baja de pilares de hormigón y vidrio corrido
    const a = q.a, b = a + q.bw, y0 = q.gl + 0.5, y1 = top - 0.35;
    env.windowHole(W0, F, a, b, a + 0.25, b - 0.25, q.yB, top, y0, y1, 0.3, run.wallC, env.kw, rr[0] < 0.4 ? 0.4 : 0);
    box(W0, F, a, a + 0.25, q.yB, top, 0, 0.12, HORM, KH, 4);
    if (W1) for (let y = y0 + 0.6; y < y1 - 0.2; y += 0.6) box(W1, F, a + 0.25, b - 0.25, y - 0.02, y + 0.02, -0.3, -0.26, ACERO, K.METAL, 1);
    return;
  }
  const w = Math.min(1.8, q.bw - 0.7), h = Math.min(2.8, top - q.gl - 0.9);
  const r = P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w, gl: q.gl, h, yB: q.yB, top, tipo: 'vidrio', col: shade(run.wallC, 0.96), kw: env.kw, dep: 0.35,
    met: vi === 1 ? [150, 120, 64] : ACERO, rr });
  // marquesina geométrica: losa fina en voladizo con canto escalonado (o curvo en la esquina redondeada)
  const m0 = r.tt - 0.7, m1 = r.ct + 0.7, my = r.yt + 0.28;
  if (vi === 2) { P.banda_curva(W0, F, q.c, 0, (m1 - m0) / 2, my, my + 0.16, 0, Math.PI, shade(env.uV, 1.04), K.STUCCO, 8); }
  else { box(W0, F, m0, m1, my, my + 0.14, 0, 1.3, shade(env.uV, 1.04), K.STUCCO, 7); box(W0, F, m0 + 0.2, m1 - 0.2, my + 0.14, my + 0.24, 0, 1.1, env.uV, K.STUCCO, 7); }
  if (vi === 1) {                                     // déco: pilastras estriadas y letras déco (franjas verticales abstractas)
    for (const s of [-1, 1]) { const u = q.c + s * (w / 2 + 0.3); box(W0, F, u - 0.18, u + 0.18, q.gl, my + 1.0, 0, 0.16, shade(env.uV, 1.05), K.STUCCO, 7);
      if (W1) for (let k = -1; k <= 1; k++) box(W1, F, u + k * 0.1 - 0.02, u + k * 0.1 + 0.02, q.gl + 0.3, my + 0.9, 0.16, 0.19, shade(env.uV, 0.9), K.STUCCO, 4); }
    if (W1) for (let i = 0; i < 7; i++) { const u = q.c - 0.9 + i * 0.3, h = 0.22 + ((i * 37) % 5) * 0.03; box(W1, F, u, u + 0.12, my + 0.4, my + 0.4 + h, 0, 0.04, [176, 146, 80], K.PBR, 7, pbrAux(0.3, 0.9, 0, 0)); }
  } else if (W1) for (let i = 0; i < 5; i++) { const u = q.c - 0.5 + i * 0.25; box(W1, F, u, u + 0.1, my + 0.35, my + 0.62, 0, 0.03, [70, 72, 74], K.METAL, 7); }
  if (vi !== 1 && h01(env.b, 31) < 0.6) P.ojo_buey(env, F, q.c, Math.min(top - 0.6, my + 1.1), 0.3);   // ojo de buey sobre el portal
});
pieza('vano_racionalista', function (env, run, q) {
  const V = q.V, vi = V.vi, rr = q.rr, { W0, W1 } = env, F = run.F, a = q.a, b = a + q.bw, wc = run.wallC, kw = env.kw;
  if (q.atico) return false;
  if (vi === 0 || (vi === 2 && !run.chaflan) || vi === 3) {   // ventana corrida: casi todo el vano, montantes finos; solo machón de 0,2 m
    const st = q.k + (vi === 3 ? 1.0 : 0.95), yt = Math.min(q.P - 0.38, st + (q.low ? 0.9 : 1.3)), u0 = a + (q.W === 0 ? 0.35 : 0.1), u1 = b - (q.W === q.nb - 1 ? 0.35 : 0.1);
    env.windowHole(W0, F, a, b, u0, u1, q.k, q.P, st, yt, 0.16, wc, kw, rr[0] < 0.55 ? 0.15 + rr[1] * 0.6 : 0);
    if (W1) { const n = Math.max(2, Math.round((u1 - u0) / 0.75)); for (let i = 1; i < n; i++) { const x = u0 + (u1 - u0) * i / n; box(W1, F, x - 0.02, x + 0.02, st, yt, -0.16, -0.12, env.marcoV, K.METAL, 4); }
      box(W1, F, u0, u1, st + (yt - st) * 0.72 - 0.02, st + (yt - st) * 0.72 + 0.02, -0.16, -0.12, env.marcoV, K.METAL, 1); }
    box(W0, F, u0 - 0.04, u1 + 0.04, st - 0.06, st, 0, 0.06, shade(env.uV, 1.04), K.STUCCO, 7);   // alféizar corrido
    // balcón corrido de barandilla tubular: los dos extremos (esquina redondeada: con cabeza curva) o en dúplex (Casa Bloc, plantas impares)
    const bal = vi === 3 ? q.D % 2 === 1 && !q.low : vi === 2 ? (q.W === 0 || q.W === q.nb - 1) && !q.low : false;
    if (bal) { const jt = vi === 3 ? 1.35 : 1.0, y = q.k - 0.02;
      // esquina redondeada: el balcón del extremo acaba en cuarto de círculo (losa y pasamanos curvos)
      const rd = vi === 2 && q.nb >= 2 && q.bw > jt + 0.4, l0 = rd && q.W === 0 ? a + jt : a, l1 = rd && q.W === q.nb - 1 ? b - jt : b;
      box(W0, F, l0, l1, y, y + 0.14, 0, jt, env.losaV, K.STUCCO, 7);
      KIT.T.rail(env, F, l0 + 0.02, l1 - 0.02, y + 0.14, jt, false, false, 0);
      if (rd) { const L0 = q.W === 0, cu = L0 ? l0 : l1, A0 = L0 ? Math.PI / 2 : 0, A1 = L0 ? Math.PI : Math.PI / 2;
        P.banda_curva(W0, F, cu, 0, jt, y, y + 0.14, A0, A1, env.losaV, K.STUCCO, 4);
        for (const h of [1.0, 0.55]) rev(h === 1.0 ? W0 : W1, F, cu, 0, [[jt - 0.03, y + h], [jt - 0.03, y + h + 0.05]], 4, env.marcoV, K.METAL, { a0: A0, a1: A1 }); }
      if (vi === 3 && W1 && rr[5] < 0.25) P.bici(W1, F, a + 0.4 + rr[6] * Math.max(0, q.bw - 1.9), y + 0.14, jt - 0.25, [[180, 40, 40], [40, 90, 160], [30, 30, 30]][(rr[7] * 3) | 0]);
    }
    return;
  }
  if (vi === 2 && run.chaflan) {                      // esquina redondeada: el chaflán, con ventana corrida en curva saliente (bow)
    const st = q.k + 0.95, yt = Math.min(q.P - 0.38, st + 1.3), r = q.bw / 2;
    if (q.W === 0) { const L = run.L, R = L / 2 / Math.sin(0.6), dc = -R * Math.cos(0.6);
      P.banda_curva(W0, F, L / 2, dc, R, q.k, st, Math.PI / 2 - 0.6, Math.PI / 2 + 0.6, wc, kw, 8);
      rev(W0, F, L / 2, dc, [[R - 0.08, st], [R - 0.08, yt]], 8, [40, 48, 56], K.GLASS, { a0: Math.PI / 2 - 0.6, a1: Math.PI / 2 + 0.6 });
      P.banda_curva(W0, F, L / 2, dc, R, yt, q.P, Math.PI / 2 - 0.6, Math.PI / 2 + 0.6, wc, kw, 8); }
    wr(W0, F, a, b, q.k, q.P, wc, kw);
    return;
  }
  // déco (vi 1): huecos verticales de proporción alta con antepecho de relieve geométrico (zigzag) y dintel escalonado
  const w = Math.min(1.25, q.bw - 1.1), st = q.k + 0.75, yt = Math.min(q.P - 0.35, st + (q.low ? 1.0 : 1.75));
  env.windowHole(W0, F, a, b, q.c - w / 2, q.c + w / 2, q.k, q.P, st, yt, 0.22, wc, kw, rr[0] < 0.5 ? 0.1 + rr[1] * 0.5 : 0);
  const sc = shade(wc, 0.9);
  rect(W0, F, q.c - w / 2, q.c + w / 2, q.k + 0.08, st - 0.06, 0.02, sc, K.STUCCO);
  if (W1) { for (let i = 0; i < 4; i++) { const u = q.c - w / 2 + (i + 0.5) * w / 4;
      tri(W1, F, u - w / 8 + 0.03, q.k + 0.16, 0.04, u + w / 8 - 0.03, q.k + 0.16, 0.04, u, st - 0.14, 0.04, shade(env.uV, 1.06), K.STUCCO); }
    box(W1, F, q.c - w / 2 - 0.12, q.c + w / 2 + 0.12, yt, yt + 0.1, 0, 0.08, shade(env.uV, 1.04), K.STUCCO, 7);
    box(W1, F, q.c - w / 2 - 0.04, q.c + w / 2 + 0.04, yt + 0.1, yt + 0.18, 0, 0.05, shade(env.uV, 1.04), K.STUCCO, 7); }
});
// déco: nervios verticales entre vanos de la 1.ª planta al remate (las «líneas verticales»), más altos en el centro
pieza('deco_lineas', function (env, run, q) {
  const { W0, F1, C, y1 } = env, F = run.F; if (C <= run.cover + 1 || env.V.vi !== 1) return;
  const y0 = Math.max(F1 + 0.1, run.cover + 0.2), col = shade(env.uV, 1.03);
  for (let W = 0; W <= q.nb; W++) { const u = Math.min(run.L - 0.2, Math.max(0.2, W * q.bw)), mid = Math.abs(W - q.nb / 2) <= 1;
    box(W0, F, u - 0.17, u + 0.17, y0, y1 + (mid ? 1.9 : 0.95), 0, 0.2, col, K.STUCCO, 7); }
});
pieza('corona_racionalista', function (env, run, q) {
  const { W0, W1, C, y1, V } = env, F = run.F, L = run.L, wc = run.wallC, vi = V.vi;
  wr(W0, F, 0, L, C, y1 + 0.95, wc, env.kw);
  box(W0, F, -0.02, L + 0.02, y1 + 0.95, y1 + 1.05, -0.04, 0.08, shade(env.uV, 1.04), K.STUCCO, 7);
  if (vi === 1 && L > 5) {                            // déco: remate escalonado en el centro (zigurat)
    const c = L / 2; for (let s = 0; s < 3; s++) { const w = Math.min(L * 0.5, 6) - s * 1.4; if (w < 0.8) break;
      wr(W0, F, c - w / 2, c + w / 2, y1 + 1.05 + s * 0.55, y1 + 1.6 + s * 0.55, wc, env.kw); box(W0, F, c - w / 2 - 0.04, c + w / 2 + 0.04, y1 + 1.55 + s * 0.55, y1 + 1.62 + s * 0.55, -0.03, 0.08, shade(env.uV, 1.05), K.STUCCO, 7); }
    return; }
  if (W1) {                                           // barandilla tubular del terrado transitable, retirada
    for (const y of [y1 + 1.55, y1 + 2.0]) box(W1, F, 0.3, L - 0.3, y, y + 0.04, -0.6, -0.56, env.marcoV, K.METAL, 3);
    for (let u = 0.3; u < L - 0.2; u += 1.5) box(W1, F, u, u + 0.04, y1 + 1.05, y1 + 2.04, -0.6, -0.56, env.marcoV, K.METAL, 4); }
  if (vi === 2 && run.chaflan && L > 3) {             // torreón redondeado sobre el chaflán
    const R = L / 2 / Math.sin(0.6), dc = -R * Math.cos(0.6);
    P.banda_curva(W0, F, L / 2, dc, R, y1 + 1.05, y1 + 3.6, Math.PI / 2 - 0.6, Math.PI / 2 + 0.6, wc, env.kw, 8);
    rev(W0, F, L / 2, dc, [[R + 0.02, y1 + 2.2], [R + 0.02, y1 + 3.0]], 8, [40, 48, 56], K.GLASS, { a0: Math.PI / 2 - 0.5, a1: Math.PI / 2 + 0.5 });
    P.banda_curva(W0, F, L / 2, dc, R + 0.15, y1 + 3.6, y1 + 3.75, Math.PI / 2 - 0.62, Math.PI / 2 + 0.62, shade(env.uV, 1.05), K.STUCCO, 8);
    if (W1) box(W1, F, L / 2 - 0.03, L / 2 + 0.03, y1 + 3.75, y1 + 6.5, -0.4, -0.34, [70, 70, 70], K.METAL, 4);   // mástil
  }
  if (vi === 3 && W1) {                               // Casa Bloc: pórtico de hormigón del terrado (tendederos comunitarios)
    for (let W = 0; W <= q.nb; W += 2) { const u = Math.min(L - 0.15, Math.max(0.15, W * q.bw)); box(W1, F, u - 0.1, u + 0.1, y1 + 1.05, y1 + 3.1, -1.6, -1.4, HORM, KH, 4); }
    box(W1, F, 0.05, L - 0.05, y1 + 3.0, y1 + 3.2, -1.6, -1.4, HORM, KH, 7); }
});
// Casa Bloc: retícula de hormigón vista (pilares y cantos de forjado) sobre el estuco
pieza('reticula_hormigon', function (env, run, q) {
  const { W0, F1, C, lv } = env, F = run.F; if (C <= run.cover + 1) return;
  const y0 = Math.max(F1 - 0.2, run.cover), col = shade(HORM, 0.97);
  for (let W = 0; W <= q.nb; W += 2) { const u = Math.min(run.L - 0.2, Math.max(0.2, W * q.bw)); box(W0, F, u - 0.2, u + 0.2, y0, C + 0.2, 0, 0.16, col, KH, 4); }
  for (let D = 1; D < lv.length; D++) if (lv[D] > y0) box(W0, F, 0, run.L, lv[D] - 0.25, lv[D] + 0.02, 0, 0.12, col, KH, 3);
});

// ================================================================ VIVIENDA SOCIAL ACTUAL
const ACV = [[127, 178, 201], [232, 184, 74], [210, 105, 76], [157, 199, 164], [96, 110, 180]];
pieza('pb_vsa', function (env, run, q) {
  const { W0, W1 } = env, F = q.F, top = env.F1, rr = q.rr, a = q.a, b = a + q.bw, ac = ACV[(h01(env.b, 41) * ACV.length) | 0];
  if (q.portal) {
    const w = Math.min(2.0, q.bw - 0.6), r = P.puerta(env, F, { a, bw: q.bw, c: q.c, w, gl: q.gl, h: Math.min(2.6, top - q.gl - 0.6), yB: q.yB, top, tipo: 'vidrio',
      col: ac, kw: K.PBR, dep: 0.5, met: [60, 64, 68], rr });
    box(W0, F, r.tt - 0.3, r.ct + 0.3, r.yt + 0.2, r.yt + 0.3, 0, 1.0, [60, 64, 68], K.METAL, 7);
    return;
  }
  // equipamiento / local social: vidrio de suelo a techo con carpintería de color y zócalo de chapa
  const g0 = q.gl + 0.45, g1 = top - 0.45;
  RQ(W0, F, a + 0.1, b - 0.1, g0, g1, -0.2, { x0: a - 0.3, W: q.bw + 0.6, yF: q.gl + 0.03, H: Math.max(3.2, g1 - q.gl + 0.3), D: 7, mode: 0, seed: 1 + ((rr[1] * 254) | 0) });
  rect(W0, F, a, b, q.yB, g0, 0, shade(ac, 0.8), K.CHAPA); rect(W0, F, a, b, g1, top, 0, run.wallC, env.kw);
  box(W0, F, a, a + 0.1, g0, g1, -0.2, 0.02, ac, K.METAL, 4);
  if (W1) { box(W1, F, a, b, g0 - 0.05, g0, -0.2, 0, ac, K.METAL, 1); box(W1, F, a, b, g1, g1 + 0.06, -0.2, 0, ac, K.METAL, 2); }
  if (rr[3] < 0.25 && W1) P.grafiti(W1, F, a + 0.1, b - 0.1, q.gl, g0 + 0.4, 0.015, env.b * 7 + q.W);
});
pieza('vano_vsa', function (env, run, q) {
  const V = q.V, vi = V.vi, rr = q.rr, { W0, W1 } = env, F = run.F, a = q.a, b = a + q.bw, wc = run.wallC, kw = env.kw;
  if (q.atico) return false;
  const ac = ACV[((h01(env.b, 41) * ACV.length) | 0) + (vi === 0 ? q.D + q.W : 0) & 3];
  if (vi === 3) {                                     // galería abierta de acceso: losa corrida, malla y puertas de pisos
    const jt = 1.7, y = q.k - 0.02;
    box(W0, F, a, b, y, y + 0.18, 0, jt, [190, 188, 182], KH, 7);
    wr(W0, F, a, b, q.k, q.P, wc, kw);
    const dc = q.W % 2 ? a + q.bw * 0.3 : a + q.bw * 0.7, ww = 0.95;
    rect(W0, F, dc - ww / 2, dc + ww / 2, q.k + 0.16, q.k + 2.25, 0.01, ac, K.PBR, pbrAux(0.45, 0.2, 0, 0));
    P.ventanaPVC(env, run, q, { c: q.W % 2 ? a + q.bw * 0.75 : a + q.bw * 0.25, w: 0.8, st: q.k + 1.05, yt: q.k + 2.15, se: rr[2] < 0.5 ? 0.6 : 0, pc: [200, 200, 196], dep: 0.12 });
    rect(W0, F, a, b, y + 0.18, y + 1.22, jt - 0.03, [184, 186, 182], K.CHAPA);   // antepecho de chapa perforada
    box(W0, F, a, b, y + 1.22, y + 1.27, jt - 0.06, jt, [70, 74, 76], K.METAL, 3);
    if (q.W === 0 || q.W % 3 === 0) box(W0, F, a, a + 0.1, y + 0.18, q.P, jt - 0.1, jt, [70, 74, 76], K.METAL, 4);
    if (W1 && rr[5] < 0.3) P.bici(W1, F, a + 0.3 + rr[6] * Math.max(0, q.bw - 1.8), y + 0.18, jt - 0.3, [[30, 30, 30], [200, 60, 40], [60, 120, 70]][(rr[7] * 3) | 0]);
    if (W1 && rr[8] < 0.3) KIT.T.planter(W1, F, a + 0.4 + rr[9] * Math.max(0, q.bw - 0.9), jt - 0.35, y + 0.18, rr[3], rr[4], rr[9]);
    return;
  }
  // ventana de suelo a techo con balconcillo (o sin) y el cierre del estilo
  const w = Math.min(1.5, q.bw - 1.2), st = q.k + 0.12, yt = Math.min(q.P - 0.3, q.k + 2.3), tt = q.c - w / 2, ct = q.c + w / 2;
  env.windowHole(W0, F, a, b, tt, ct, q.k, q.P, st, yt, 0.25, wc, kw, 0);
  if (vi === 0) {                                     // persianas correderas de color: dos hojas, una abierta y otra a medio cerrar
    const f = rr[1], sw = w / 2 + 0.05, o = 0.06;
    rect(W0, F, ct + 0.02 - f * sw, ct + 0.02 + sw - f * sw, st, yt, o, ac, K.PBR, pbrAux(0.55, 0.15, 1, 0));
    rect(W0, F, tt - sw - 0.02 + rr[2] * sw * 0.7, tt - 0.02 + rr[2] * sw * 0.7, st, yt, o + 0.03, ac, K.PBR, pbrAux(0.55, 0.15, 1, 0));
    if (W1) { box(W1, F, tt - sw - 0.05, ct + sw + 0.05, yt, yt + 0.06, 0, o + 0.06, [120, 122, 124], K.METAL, 3); KIT.T.rail(env, F, tt - 0.05, ct + 0.05, st, 0.12, false, false, 0); }
  } else if (vi === 1) {                              // celosía metálica: balcón corrido con paneles de chapa perforada plegables delante
    const jt = 1.1; box(W0, F, a, b, q.k - 0.02, q.k + 0.12, 0, jt, [196, 196, 192], KH, 7);
    const op = rr[3] < 0.45, pw = q.bw / 2 - 0.04, mc = [[188, 190, 186], [176, 160, 120], [150, 156, 160]][(h01(env.b, 43) * 3) | 0];
    const pr = (u0, u1) => { rect(W0, F, u0, u1, q.k + 0.12, q.P - 0.06, jt, mc, K.CHAPA, undefined); };
    if (op) { pr(a + 0.02, a + 0.02 + pw * 0.45); pr(b - 0.02 - pw * 0.45, b - 0.02); KIT.T.rail(env, F, a + 0.02 + pw * 0.45, b - 0.02 - pw * 0.45, q.k + 0.12, jt, false, false, w); }
    else { pr(a + 0.02, a + pw); pr(a + pw + 0.08, b - 0.02); }
    if (W1) box(W1, F, a, b, q.P - 0.1, q.P - 0.04, 0.02, jt + 0.03, [110, 112, 114], K.METAL, 3);
  } else {                                            // madera industrializada: marco de aluminio saliente y lamas de madera fijas en la mitad
    const t = 0.1, d = 0.22, mc = [140, 144, 146];
    box(W0, F, tt - t, tt, st, yt + t, 0, d, mc, K.METAL, 7); box(W0, F, ct, ct + t, st, yt + t, 0, d, mc, K.METAL, 7);
    box(W0, F, tt - t, ct + t, yt, yt + t, 0, d, mc, K.METAL, 7); box(W0, F, tt - t, ct + t, st - 0.05, st, 0, d + 0.05, mc, K.METAL, 7);
    if (q.D % 2 === (q.W & 1)) P.lamas(W1 || W0, F, tt, q.c, st + 0.05, yt, 0.2, [150, 112, 74], K.WOOD, true, 0.12);
    KIT.T.rail(env, F, tt, ct, st, 0.18, false, false, 0);
  }
  if (W1 && rr[9] < 0.08) P.aire(W1, F, a + 0.15, q.k + 0.2, 0.02);
});
pieza('corona_vsa', function (env, run, q) {
  const { W0, W1, C, y1 } = env, F = run.F, L = run.L, wc = run.wallC;
  wr(W0, F, 0, L, C, y1 + 1.0, wc, env.kw);
  box(W0, F, -0.02, L + 0.02, y1 + 1.0, y1 + 1.07, -0.3, 0.04, [150, 154, 156], K.METAL, 7);
  if (L > 3) P.placas(W0, F, 0.5, L - 0.5, y1 + 0.7, 1.5);
  if (W1) { for (let u = 1; u < L - 2; u += 5.5) box(W1, F, u, u + 1.4, y1 + 1.0, y1 + 2.2, -4.5, -3.3, [196, 198, 196], K.PBR, 7, pbrAux(0.5, 0.3, 0, 0));
    lattice(W1, F, 0.2, L - 0.2, y1 + 1.07, y1 + 1.9, -0.25, [110, 112, 114], K.IRON, 0); }
});

// ================================================================ FÁBRICA
pieza('pb_fabrica', function (env, run, q) {
  const { W0, W1 } = env, F = q.F, top = env.F1, rr = q.rr, vi = env.V.vi, a = q.a, b = a + q.bw, wc = run.wallC;
  const big = q.portal || (vi === 2 ? q.W % 2 === 0 : (q.W === 1 && run.nb > 2));
  if (big) {                                          // portalón de carga: corredera de madera o de chapa con su carril, dintel de hierro
    const w = Math.min(3.6, q.bw - 0.5), h = Math.min(3.6, top - q.gl - 0.5);
    const loft = vi === 3;
    const r = P.puerta(env, F, { a, bw: q.bw, c: q.c, w, gl: q.gl, h, yB: q.yB, top, tipo: loft ? 'vidrio' : rr[2] < 0.5 ? 'madera' : 'persiana', col: wc, kw: env.kw, dep: 0.25,
      madera: [[96, 66, 42], [70, 84, 70], [110, 60, 44]][(rr[3] * 3) | 0], met: [[90, 104, 96], [140, 70, 50], [120, 124, 120]][(rr[4] * 3) | 0], rr });
    box(W0, F, r.tt - 0.3, r.ct + 0.3, r.yt, r.yt + 0.28, 0, 0.06, [56, 50, 46], K.METAL, 7);
    if (!loft && W1) box(W1, F, r.tt - 0.2, r.ct + w * 0.9, r.yt + 0.05, r.yt + 0.14, 0.06, 0.16, [50, 50, 50], K.METAL, 7);   // carril de la corredera
    if (!loft && W1 && rr[5] < 0.6) P.grafiti(W1, F, r.tt, r.ct, q.gl, Math.min(r.yt, q.gl + 2.4), -0.21, env.b * 13 + q.W);
    return;
  }
  if (vi === 3) return false;                         // loft: el de siempre (comercio o ventana)
  // ventana alta de taller con reja y zócalo de piedra
  const w = Math.min(2.2, q.bw - 1.0), st = q.gl + 1.3, yt = Math.min(top - 0.5, st + 1.9);
  if (yt - st < 0.6) return false;
  env.windowHole(W0, F, a, b, q.c - w / 2, q.c + w / 2, q.yB, top, st, yt, 0.35, wc, env.kw, 0);
  if (W1) { const n = Math.max(2, Math.round(w / 0.5)); for (let i = 1; i < n; i++) { const x = q.c - w / 2 + w * i / n; box(W1, F, x - 0.02, x + 0.02, st, yt, -0.35, -0.3, ACERO, K.METAL, 4); }
    box(W1, F, q.c - w / 2, q.c + w / 2, (st + yt) / 2 - 0.02, (st + yt) / 2 + 0.02, -0.35, -0.3, ACERO, K.METAL, 1); }
  box(W0, F, a, b, q.yB, q.gl + 0.7, 0, 0.06, shade(env.stone, 0.95), KS(), 1);
  if (W1 && rr[1] < 0.45) P.grafiti(W1, F, a + 0.1, b - 0.1, q.gl + 0.1, st - 0.1, 0.075, env.b * 17 + q.W);
});
pieza('vano_fabrica', function (env, run, q) {
  const V = q.V, vi = V.vi, rr = q.rr, { W0, W1 } = env, F = run.F, wc = run.wallC;
  if (q.atico) return false;
  KIT.T.vano(env, run, q);
  // el hueco de taller de siempre (vanoDef): ancho min(win, bw − 0,95), antepecho 0,7, alto min(2,7, m − 1,15)
  const Vw = Math.min(V.win, q.bw - 0.95), st = q.k + (q.low ? 0 : 0.7), yt = q.low ? st : st + Math.min(2.7, q.m - 1.15), tt = q.c - Vw / 2, ct = q.c + Vw / 2;
  if (q.low) return;
  // arco rebajado de ladrillo a sardinel sobre el ventanal, alféizar de piedra
  const rise = Math.min(0.32, (q.P - yt) * 0.5), n = 6, ac = shade(wc, 0.8);
  if (rise > 0.08) for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, u0 = tt - 0.12 + (Vw + 0.24) * t0, u1 = tt - 0.12 + (Vw + 0.24) * t1;
    const y0 = yt + Math.sin(Math.PI * t0) * rise, y1 = yt + Math.sin(Math.PI * t1) * rise;
    quad(W0, F, u0, y0 - 0.04, 0.03, u1, y1 - 0.04, 0.03, u1, y1 + 0.24, 0.03, u0, y0 + 0.24, 0.03, ac, KL); }
  box(W0, F, tt - 0.1, ct + 0.1, st - 0.08, st, 0, 0.1, shade(env.stone, 1.05), KS(), 7);
  if (vi === 3 && W1 && q.D % 2 === 1 && rr[2] < 0.5) {   // loft: balcón francés de vidrio y algunas plantas
    rect(W0, F, tt + 0.05, ct - 0.05, st, st + 1.0, 0.05, [150, 160, 160], K.PBR, pbrAux(0.2, 0.2, 0, 0));
    box(W1, F, tt + 0.05, ct - 0.05, st + 0.98, st + 1.03, 0.03, 0.08, ACERO, K.METAL, 3); }
});
// pilastras de ladrillo entre ventanales, zócalo y friso de esquinillas; rótulo pintado (desvaído, sin letras legibles)
pieza('fab_fachada', function (env, run, q) {
  const { W0, W1, F1, C } = env, F = run.F, L = run.L, wc = run.wallC, vi = env.V.vi; if (C <= run.cover + 1) return;
  const y0 = Math.max(F1 - 0.3, run.cover + 0.1), pc = shade(wc, 0.92);
  for (let W = 0; W <= q.nb; W++) { const u = Math.min(L - 0.3, Math.max(0.3, W * q.bw)); box(W0, F, u - 0.3, u + 0.3, y0, C, 0, 0.15, pc, KL, 4); }
  if (vi !== 3 && L > 10 && run.r === env.lay.portal && h01(env.b, 51) < 0.75) {   // rótulo pintado de la fábrica: cartela clara con trazos
    const w = Math.min(L * 0.6, 16), u0 = (L - w) / 2, y = C - 1.4;
    if (y > y0 + 1) { rect(W0, F, u0, u0 + w, y, y + 1.1, 0.16, [214, 202, 176], K.PBR, pbrAux(0.85, 0, 0, 0));
      if (W1) { const n = Math.round((w - 0.8) / 0.55), lw = (w - 0.8) / n, ink = mixc([[70, 52, 40], [40, 60, 90], [120, 40, 36]][(h01(env.b, 52) * 3) | 0], [214, 202, 176], 0.3);
        for (let i = 0; i < n; i++) { const r = h01(env.b, 60 + i); if (r < 0.12) continue; const u = u0 + 0.4 + i * lw, y0 = y + 0.28, y1 = y + 0.82, t = 0.07;
          box(W1, F, u, u + t, y0, y1, 0.16, 0.17, ink, K.PBR, 0, pbrAux(0.85, 0, 0, 0));          // letras pintadas (trazos de palo seco, ilegibles)
          if (r > 0.4) box(W1, F, u + lw * 0.55 - t, u + lw * 0.55, y0, y1, 0.16, 0.17, ink, K.PBR, 0, pbrAux(0.85, 0, 0, 0));
          const yh = r < 0.55 ? y1 - t : r < 0.8 ? (y0 + y1) / 2 : y0; box(W1, F, u, u + lw * 0.55, yh, yh + t, 0.16, 0.17, ink, K.PBR, 0, pbrAux(0.85, 0, 0, 0)); } } }
  }
});
pieza('corona_fabrica', function (env, run, q) {
  const { W0, W1, C, y1, V } = env, F = run.F, L = run.L, wc = run.wallC, vi = V.vi, kw = env.kw;
  if (vi === 0 && L > 5) {                            // diente de sierra: hastiales en sierra con lucernarios verticales hacia atrás
    wr(W0, F, 0, L, C, y1 + 0.2, wc, kw);
    const n = Math.max(1, Math.round(L / 5.5)), tw = L / n, h = Math.min(2.6, tw * 0.48), dr = 7;
    for (let i = 0; i < n; i++) { const u0 = i * tw, u1 = u0 + tw, y = y1 + 0.2;
      tri(W0, F, u0, y, 0, u1, y, 0, u1, y + h, 0, wc, kw);
      quad(W0, F, u0 - 0.05, y + 0.04, 0.08, u1 + 0.02, y + h + 0.04, 0.08, u1 + 0.02, y + h + 0.16, 0.08, u0 - 0.05, y + 0.16, 0.08, shade(wc, 1.1), KL);
      quad(W0, F, u0, y, 0, u0, y, -dr, u1, y + h, -dr, u1, y + h, 0, [120, 116, 108], K.PBR, pbrAux(0.75, 0.3, 0, 0));   // faldón de fibrocemento
      quad(W0, F, u1, y, -dr, u1, y, 0, u1, y + h, 0, u1, y + h, -dr, [70, 84, 92], K.GLASS);                              // lucernario
      if (W1) for (let d = -1.2; d > -dr; d -= 1.2) box(W1, F, u1 - 0.03, u1 + 0.03, y, y + h, d - 0.04, d, ACERO, K.METAL, 4); }
    return;
  }
  wr(W0, F, 0, L, C, y1 + 0.9, wc, kw);
  // cornisa de ladrillo: hiladas en voladizo y friso de esquinillas (dientes de sierra en el muro)
  box(W0, F, 0, L, y1 + 0.3, y1 + 0.45, 0, 0.12, shade(wc, 1.06), KL, 3); box(W0, F, 0, L, y1 + 0.45, y1 + 0.6, 0, 0.22, shade(wc, 1.08), KL, 3);
  box(W0, F, 0, L, y1 + 0.9, y1 + 1.0, -0.03, 0.14, shade(wc, 1.1), KL, 7);
  if (W1) for (let u = 0.1; u < L - 0.2; u += 0.42) box(W1, F, u, u + 0.21, y1 + 0.05, y1 + 0.27, 0, 0.08, shade(wc, 0.86), KL, 7);
  if (vi === 2 && L > 6) {                            // almacén: frontón escalonado de ladrillo en el centro
    const w = Math.min(L * 0.4, 9);
    for (let s = 0; s < 3; s++) { const ww = w - s * w * 0.28; wr(W0, F, (L - ww) / 2, (L + ww) / 2, y1 + 1.0 + s * 0.5, y1 + 1.5 + s * 0.5, wc, kw);
      box(W0, F, (L - ww) / 2 - 0.05, (L + ww) / 2 + 0.05, y1 + 1.45 + s * 0.5, y1 + 1.55 + s * 0.5, -0.03, 0.14, shade(wc, 1.1), KL, 7); }
  }
  if (vi === 3 && L > 4) {                            // loft: remonta de vidrio y acero retirada 2,5 m
    const y = y1 + 1.0, h = 2.8, d = -2.5;
    rect(W0, F, 0.6, L - 0.6, y, y + h, d, [56, 66, 74], K.GLASS); box(W0, F, 0.4, L - 0.4, y + h, y + h + 0.25, d - 0.2, d + 0.4, [44, 46, 48], K.METAL, 7);
    if (W1) for (let u = 0.6; u <= L - 0.6; u += 1.4) box(W1, F, u - 0.03, u + 0.03, y, y + h, d, d + 0.06, [40, 42, 44], K.METAL, 4);
  }
  // chimenea: una por edificio (fábrica de varias plantas siempre; las demás, a veces), detrás del tramo del portal
  const ch = vi === 1 ? 1 : vi === 2 ? h01(env.b, 53) < 0.35 : 0;
  if (ch && !env._chim && (run.r === env.lay.portal || !env.lay.portal) && L > 6) { env._chim = 1;
    P.chimenea(W0, F, L * (0.25 + h01(env.b, 54) * 0.5), -6, y1 - 0.5, 14 + h01(env.b, 55) * 10, shade(wc, 0.95)); }
});

// ================================================================ POLÍGONO
const TEND = [[220, 220, 214], [150, 60, 60], [70, 90, 130], [230, 200, 120], [120, 160, 190]];
pieza('pb_poligono', function (env, run, q) {
  const { W0, W1 } = env, F = q.F, top = env.F1, rr = q.rr, a = q.a, b = a + q.bw, wc = run.wallC;
  if (q.portal) {
    const w = Math.min(1.8, q.bw - 0.6), r = P.puerta(env, F, { a, bw: q.bw, c: q.c, w, gl: q.gl, h: Math.min(2.4, top - q.gl - 0.5), yB: q.yB, top, tipo: 'vidrio',
      col: shade(wc, 0.92), kw: env.kw, dep: 0.3, met: [110, 100, 70], rr });
    box(W0, F, r.tt - 0.5, r.ct + 0.5, r.yt + 0.2, r.yt + 0.34, 0, 1.0, HORM, KH, 7);
    if (W1) box(W1, F, r.ct + 0.15, r.ct + 0.55, r.y0 + 1.0, r.y0 + 1.5, 0, 0.05, [170, 160, 120], K.METAL, 7);   // buzones / portero
    return;
  }
  if (rr[0] < 0.35 && env.V.pbRec) return false;
  // trastero o local cerrado: persiana metálica bajada con grafitis, o ventana con reja
  if (rr[0] < 0.55) { const r = P.puerta(env, F, { a, bw: q.bw, c: q.c, w: q.bw - 0.6, gl: q.gl, h: Math.min(2.8, top - q.gl - 0.5), yB: q.yB, top, tipo: 'persiana', col: wc, kw: env.kw, dep: 0.15 });
    if (W1 && rr[1] < 0.75) P.grafiti(W1, F, r.tt, r.ct, q.gl + 0.1, r.yt - 0.3, -0.13, env.b * 19 + q.W); return; }
  if (W1 && rr[2] < 0.5) { P.grafiti(W1, F, a + 0.1, b - 0.1, q.gl + 0.05, q.gl + 0.95, 0.012, env.b * 23 + q.W); }
  return false;
});
pieza('vano_poligono', function (env, run, q) {
  const V = q.V, vi = V.vi, rr = q.rr, { W0, W1 } = env, F = run.F, a = q.a, b = a + q.bw, wc = run.wallC, kw = env.kw;
  if (q.atico) return false;
  const pc = [[214, 210, 198], [196, 188, 170], [150, 120, 90]][(h01(env.b, 71) * 3) | 0];
  if (vi === 2 && (q.W === run.N || (run.N < 0 && q.W === (q.nb >> 1)))) {   // bloque en H: la caja de escalera hundida con celosía de hormigón
    const u0 = a + 0.15, u1 = b - 0.15, dp = 0.6;
    wr(W0, F, a, u0, q.k, q.P, wc, kw); wr(W0, F, u1, b, q.k, q.P, wc, kw);
    jamb(W0, F, u0, q.k, q.P, -dp, 0, shade(wc, 0.85), kw); jamb(W0, F, u1, q.k, q.P, -dp, 0, shade(wc, 0.85), kw);
    rect(W0, F, u0, u1, q.k, q.P, -dp, [176, 176, 170], KH); lattice(W0, F, u0, u1, q.k + 0.1, q.P - 0.1, -dp + 0.02, [196, 194, 186], K.BAL, 0);
    return;
  }
  if (vi === 3 && q.D % 3 !== 0 && !q.low) {          // galerías exteriores: losa corrida y peto macizo de hormigón con puertas y cocinas
    const jt = 1.5, y = q.k - 0.02, ph = 1.05;
    box(W0, F, a, b, y, y + 0.16, 0, jt, [180, 176, 168], KH, 7);
    wr(W0, F, a, b, q.k, q.P, wc, kw);
    box(W0, F, a, b, y + 0.16, y + 0.16 + ph, jt - 0.12, jt, [196, 192, 182], KH, 1);
    const dc = q.W % 2 ? a + q.bw * 0.3 : a + q.bw * 0.72;
    rect(W0, F, dc - 0.45, dc + 0.45, q.k + 0.16, q.k + 2.1, 0.01, [[110, 80, 56], [96, 100, 104], [70, 90, 76]][(rr[1] * 3) | 0], K.PBR, pbrAux(0.5, 0.3, 0, 0));
    if (W1 && rr[4] < 0.45) KIT.T.ropa(W1, F, a + 0.2, b - 0.2, q.k + 1.9, jt - 0.4, rr[5]);
    if (W1 && rr[6] < 0.12) P.parabolica(W1, F, a + 0.4, y + 0.16 + ph, jt - 0.1, 0.3);
    return;
  }
  // repetición total: ventana igual en cada vano, persiana enrollable, tendedero de jaula bajo la de la cocina
  const w = vi === 1 ? Math.min(1.5, q.bw - 0.9) : Math.min(1.2, q.bw - 1.2), st = q.k + 0.95, yt = Math.min(q.P - 0.35, st + 1.2);
  const ac = rr[8] < 0.1 ? rr[9] : 0;
  P.ventanaPVC(env, run, q, { w, st, yt, se: rr[0] < 0.8 ? 0.1 + rr[1] * 0.75 : 0, pc, cajon: true, alf: shade(HORM, 1.05), aire: ac });
  if (vi === 0 && W1 && q.W % 2 === 1) {             // tendedero: jaula de varillas bajo la ventana con ropa
    const u0 = q.c - 0.7, u1 = q.c + 0.7, y0 = q.k + 0.12;
    box(W1, F, u0, u1, y0 - 0.06, y0, 0, 0.55, [150, 150, 146], K.METAL, 3);
    lattice(W1, F, u0, u1, y0, st - 0.05, 0.55, [130, 130, 126], K.IRON, 0);
    if (rr[3] < 0.6) for (let i = 0; i < 3; i++) rect(W1, F, u0 + 0.1 + i * 0.42, u0 + 0.42 + i * 0.42, st - 0.6 - (i % 2) * 0.2, st - 0.1, 0.3, TEND[(((rr[4] * 5) | 0) + i) % 5], K.PLAIN);
  }
  if (vi === 1 && q.W === (q.nb >> 1) && !q.low) {   // torre: franja vertical de paneles de color en el eje
    rect(W0, F, q.c - w / 2 - 0.35, q.c - w / 2 - 0.05, q.k + 0.1, q.P - 0.1, 0.02, [[176, 90, 60], [70, 100, 130], [200, 170, 90]][(h01(env.b, 72) * 3) | 0], K.PBR, pbrAux(0.5, 0.2, 0, 0)); }
  if (W1 && rr[10] < 0.05) P.parabolica(W1, F, q.c + w / 2 + 0.1, st - 0.2, 0.05, 0.28);
});
// retícula de prefabricado: cantos de forjado y montantes de hormigón cada dos vanos (bloque lineal, torre)
pieza('pol_reticula', function (env, run, q) {
  const { W0, F1, C, V } = env, F = run.F; if (C <= run.cover + 1 || V.vi === 3) return;
  const y0 = Math.max(F1 - 0.2, run.cover), col = shade(HORM, 0.95), st = V.vi === 2 ? 1 : 2;
  for (let W = 0; W <= q.nb; W += st) { const u = Math.min(run.L - 0.18, Math.max(0.18, W * q.bw)); box(W0, F, u - 0.18, u + 0.18, y0, C + 0.3, 0, 0.1, col, KH, 4); }
});
pieza('corona_poligono', function (env, run, q) {
  const { W0, W1, C, y1, V } = env, F = run.F, L = run.L, wc = run.wallC;
  wr(W0, F, 0, L, C, y1 + 1.0, wc, env.kw);
  box(W0, F, -0.02, L + 0.02, y1 + 1.0, y1 + 1.12, -0.04, 0.12, [170, 168, 160], KH, 7);
  // casetón de escalera y depósitos de agua (uno por tramo largo)
  if (L > 8 && !env._dep) { env._dep = 1; const u = L * (0.3 + h01(env.b, 81) * 0.4), n = 2 + ((h01(env.b, 82) * 3) | 0);
    box(W0, F, u - 1.8, u + 1.8, y1, y1 + 2.8, -6.5, -3.0, shade(wc, 0.95), env.kw, 7);
    for (let i = 0; i < n; i++) P.deposito(W0, F, u - 1.2 + i * 1.1, -4.8, y1 + 2.8, 0.45, 1.0, [[176, 176, 170], [150, 152, 148], [196, 196, 190]][i % 3]); }
  if (W1 && V.vi === 1) for (let u = 1; u < L - 1; u += 3.5) P.parabolica(W1, F, u, y1 + 1.12, -0.5, 0.4);
});
})();
