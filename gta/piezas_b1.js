/* GTA Barcelona · Condal City — PIEZAS del bloque 1 del kit (Fase 2a): desarrollismo, pueblo, contemporáneo, burgués 60–70,
   autarquía y noucentista. Las registra en window.BCN_KIT (kit.js) con pieza(nombre, fn); los estilos (estilos_b1.js) las
   nombran en sus campos pb, pbFr, vano, corona y fachada. Ranuras y su q: cabecera de kit.js.
   Tipos de material propios (rango 168–175): 168 TRAVERTINO (placas de 60 × 40 cm a matajunta, vetas y poros) y 169 PANEL
   (panel composite de 1,2 × 0,6 m con junta oscura); acabados V.acab 'travertino' y 'panel'.
   Piezas de uso general (las pueden usar los demás bloques): puerta, ventanaPVC, loggia, frente_verja, frente_arcos,
   antenas, pilastras, urnas. */
(function () {
'use strict';
const KIT = window.BCN_KIT, GEO = window.BCN_GEO;
const { K, regKind, quad, rect, jamb, hpl, box, lattice, shade, mixc, pbrAux } = GEO;

regKind('TRAVERTINO', 168, `
    rough = 0.62;
    vec2 q = P/vec2(0.6, 0.4); q.x += 0.5*mod(floor(q.y), 2.0);
    vec2 f = fract(q), fw = fwidth(q); float far = smoothstep(0.15, 0.5, max(fw.x, fw.y));
    float jn = 1.0 - smoothstep(0.0, 0.02, min(min(f.x, 1.0 - f.x)*0.6, min(f.y, 1.0 - f.y)*0.4));
    float vt = vnoise(vec2(P.x*0.9 + hash21(floor(q))*7.0, P.y*9.0));
    float po = smoothstep(0.78, 0.92, vnoise(P*vec2(14.0, 30.0)));
    alb *= mix(0.93, 1.05, vt)*mix(0.92, 1.05, hash21(floor(q) + 0.3));
    alb = mix(alb, alb*0.74, po*0.5*nearF);
    alb = mix(alb, alb*0.82, jn*(1.0 - far));`);
regKind('PANEL', 169, `
    rough = 0.42; metal = 0.2;
    vec2 q = P/vec2(1.2, 0.6); vec2 f = fract(q), fw = fwidth(q); float far = smoothstep(0.15, 0.5, max(fw.x, fw.y));
    float jn = 1.0 - smoothstep(0.0, 0.015, min(min(f.x, 1.0 - f.x)*1.2, min(f.y, 1.0 - f.y)*0.6));
    alb *= mix(0.95, 1.05, hash21(floor(q) + 1.7));
    alb = mix(alb, alb*0.45, jn*(1.0 - far));`);
KIT.acabado('travertino', 168); KIT.acabado('panel', 169);

const P = KIT.P, pieza = KIT.pieza;
const KS = () => K.FXPIEDRA !== undefined ? K.FXPIEDRA : K.STONE;
const wr = (...a) => KIT.T.wr(...a);
const RQ = (...a) => window.BCN_INTERIORS.roomQuad(...a);
const h01 = (a, b) => { let h = Math.imul(a ^ 0x2545f491, 0x9e3779b1) ^ Math.imul(b + 0x6d2b79f5, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const reF = (F, d) => ({ x: F.x + F.nx * d, z: F.z + F.nz * d, tx: F.tx, tz: F.tz, nx: F.nx, nz: F.nz });   // marco desplazado d m hacia fuera
const ALU = [168, 170, 168], BRONCE = [104, 84, 58];

// paño de muro con un hueco (h0–h1 × v0–v1) dentro de a–b × y0–y1
function panoHueco(B, F, a, b, y0, y1, h0, h1, v0, v1, col, kw) {
  wr(B, F, a, h0, y0, y1, col, kw); wr(B, F, h1, b, y0, y1, col, kw);
  if (v0 > y0) wr(B, F, h0, h1, y0, v0, col, kw); if (y1 > v1) wr(B, F, h0, h1, v1, y1, col, kw);
}

// ---------------------------------------------------------------- PUERTA de planta baja (general)
// o: { a, bw (vano), c, w, gl (acera), h, yB, top (F1), tipo 'madera'|'vidrio'|'garaje'|'persiana', col, kw (muro del vano),
//      dep (fondo), madera, met, marco {col, k, w}, arco (0 no · 1 medio punto · 0.2 rebajado), rr }
pieza('puerta', function (env, F, o) {
  const { W0, W1 } = env, w = o.w, tt = o.c - w / 2, ct = o.c + w / 2, y0 = o.gl + 0.12, yt = Math.min(o.top - 0.25, o.gl + o.h), dep = o.dep || 0.3;
  panoHueco(W0, F, o.a, o.a + o.bw, o.yB, o.top, tt, ct, y0, yt, o.col, o.kw);
  hpl(W0, F, tt, ct, y0, -dep, 0, [150, 146, 140], KS());
  jamb(W0, F, tt, y0, yt, -dep, 0, shade(o.col, 0.62), o.kw); jamb(W0, F, ct, y0, yt, -dep, 0, shade(o.col, 0.62), o.kw);
  hpl(W0, F, tt, ct, yt, -dep, 0, shade(o.col, 0.5), o.kw);
  const d = -dep + 0.02, t = o.tipo;
  if (t === 'vidrio') {
    if (env.pbPortal) { const IA = window.BCN_INTERIORS; if (IA && IA.log) IA.log.push(['P', +(F.x + F.tx * o.c).toFixed(1), +(F.z + F.tz * o.c).toFixed(1), F.nx, F.nz]); }
    RQ(W0, F, tt + 0.06, ct - 0.06, y0 + 0.02, yt - 0.06, d - 0.01, { x0: tt - 0.4, W: w + 0.8, yF: y0, H: Math.max(3.2, yt - y0 + 0.4), D: 8, mode: 0, seed: 1 + ((o.rr ? o.rr[1] : 0.5) * 254 | 0) });
    const mc = o.met || ALU;
    box(W0, F, tt, tt + 0.07, y0, yt, d - 0.02, d + 0.04, mc, K.METAL, 4); box(W0, F, ct - 0.07, ct, y0, yt, d - 0.02, d + 0.04, mc, K.METAL, 4);
    box(W0, F, tt, ct, yt - 0.08, yt, d - 0.02, d + 0.04, mc, K.METAL, 2); box(W0, F, o.c - 0.035, o.c + 0.035, y0, yt, d - 0.02, d + 0.04, mc, K.METAL, 4);
    if (W1) box(W1, F, tt, ct, y0 + 0.9, y0 + 0.96, d + 0.04, d + 0.07, mc, K.METAL, 7);
  } else if (t === 'garaje') {
    rect(W0, F, tt, ct, y0 - 0.1, yt, d, o.met || [128, 130, 126], K.PBR, pbrAux(0.55, 0.45, 2, 0));
  } else if (t === 'persiana') {
    rect(W0, F, tt, ct, y0 - 0.1, yt, d, o.met || [150, 152, 150], K.PBR, pbrAux(0.55, 0.6, 1, 0));
    box(W0, F, tt - 0.04, ct + 0.04, yt - 0.3, yt, d, d + 0.12, shade(o.met || [150, 152, 150], 0.85), K.METAL, 7);
  } else {                                            // madera: dos hojas de cuarterones
    const md = o.madera || env.wood;
    // F2R: en el portal del edificio, montante acristalado con reja y, detrás, el zaguán iluminado (como portalBay)
    const zg = env.pbPortal && yt - y0 > 2.3 && w > 0.8, tr = zg ? yt - Math.min(0.8, (yt - y0) * 0.28) : yt;
    if (zg) {
      RQ(W0, F, tt + 0.05, ct - 0.05, tr, yt - 0.04, d - 0.01, { x0: tt - 0.4, W: w + 0.8, yF: y0, H: Math.max(3.3, yt - y0 + 0.3), D: 9, mode: 0, seed: 1 + ((o.rr ? o.rr[1] : 0.5) * 254 | 0) });
      box(W0, F, tt, ct, tr - 0.06, tr + 0.04, d - 0.02, d + 0.05, shade(md, 0.8), K.WOOD, 3);
      if (W1) for (let u = tt + 0.2; u < ct - 0.1; u += 0.22) box(W1, F, u - 0.015, u + 0.015, tr, yt - 0.04, d + 0.02, d + 0.05, env.iron || [40, 40, 40], K.IRON, 7);
      const IA = window.BCN_INTERIORS; if (IA && IA.log) IA.log.push(['P', +(F.x + F.tx * o.c).toFixed(1), +(F.z + F.tz * o.c).toFixed(1), F.nx, F.nz]);
    }
    rect(W0, F, tt, ct, y0, tr, d, md, K.WOOD);
    const yt0 = yt; { const yt = tr;
    if (W1) { const n = w > 1.2 ? 2 : 1, hw = w / n;
      for (let i = 0; i < n; i++) { const u = tt + i * hw;
        box(W1, F, u + 0.1, u + hw - 0.1, y0 + 0.2, y0 + (yt - y0) * 0.42, d, d + 0.03, shade(md, 1.15), K.WOOD, 7);
        box(W1, F, u + 0.1, u + hw - 0.1, y0 + (yt - y0) * 0.5, yt - 0.25, d, d + 0.03, shade(md, 1.15), K.WOOD, 7); }
      if (n === 2) box(W1, F, o.c - 0.03, o.c + 0.03, y0, yt, d, d + 0.05, shade(md, 0.8), K.WOOD, 4);
      box(W1, F, o.c + 0.12, o.c + 0.18, y0 + 1.0, y0 + 1.1, d + 0.03, d + 0.08, [176, 140, 70], K.PBR, 7, pbrAux(0.3, 1, 0, 0)); } }
    if (zg && W1 && (!o.rr || o.rr[0] < 0.7)) { box(W1, F, ct + 0.35, ct + 0.53, y0 + 2.5, y0 + 2.9, 0.12, 0.32, [235, 220, 180], K.LAMP);   // aplique
      box(W1, F, ct + 0.41, ct + 0.47, y0 + 2.9, y0 + 3.1, 0, 0.3, env.iron || [40, 40, 40], K.METAL); }
    void yt0;
  }
  if (o.arco) { const s = o.arco === 1 ? 0 : o.arco, r = w / 2, ys = yt - (s ? w * s : r);
    if (ys > y0 + 1.6) P.arco(W0, F, tt, ct, ys, yt + 0.002, 0.002, -dep, o.col, o.kw, s); }
  if (o.marco) { const m = o.marco, mw = m.w || 0.18, B = m.W0 ? W0 : W1 || W0;
    box(B, F, tt - mw, tt, y0 - 0.1, yt + mw, 0, m.d || 0.06, m.col, m.k, 7); box(B, F, ct, ct + mw, y0 - 0.1, yt + mw, 0, m.d || 0.06, m.col, m.k, 7);
    box(B, F, tt - mw, ct + mw, yt, yt + mw, 0, m.d || 0.06, m.col, m.k, 7); }
  return { tt, ct, yt, y0 };
});

// ---------------------------------------------------------------- VENTANA con persiana enrollable de PVC y cajón (general)
// o: { w, st, yt, c?, dep, se (fracción bajada), pc (color de la persiana), cajon (bool), marco, alf (color del alféizar), aire }
pieza('ventanaPVC', function (env, run, q, o) {
  const { W0, W1 } = env, F = run.F, c = o.c !== undefined ? o.c : q.c, tt = c - o.w / 2, ct = c + o.w / 2, dep = o.dep || 0.22;
  env.windowHole(W0, F, q.a, q.a + q.bw, tt, ct, q.k, q.P, o.st, o.yt, dep, run.wallC, env.kw, 0);
  if (o.se > 0) rect(W0, F, tt, ct, o.yt - o.se * (o.yt - o.st), o.yt, -dep + 0.04, o.pc, K.SHUT);
  if (o.cajon) P.cajon(W0, F, tt, ct, o.yt, shade(o.pc, 1.04));
  if (o.alf) box(W0, F, tt - 0.06, ct + 0.06, o.st - 0.06, o.st, 0, 0.09, o.alf, K.STUCCO);
  if (W1) { const mc = o.marco || ALU;
    box(W1, F, tt, tt + 0.05, o.st, o.yt, -dep, -dep + 0.05, mc, K.METAL, 4); box(W1, F, ct - 0.05, ct, o.st, o.yt, -dep, -dep + 0.05, mc, K.METAL, 4);
    box(W1, F, c - 0.025, c + 0.025, o.st, o.yt, -dep, -dep + 0.05, mc, K.METAL, 4);
    box(W1, F, tt - 0.02, tt + 0.03, o.st, o.yt, -0.05, 0, mc, K.METAL, 4); box(W1, F, ct - 0.03, ct + 0.02, o.st, o.yt, -0.05, 0, mc, K.METAL, 4); }
  if (o.aire) P.aire(W1, F, c - 0.39 + (o.aire - 0.5) * 0.6, o.st - 0.8, 0.02);
  return { tt, ct };
});

// ---------------------------------------------------------------- TERRAZA HUNDIDA (loggia) de los bloques de los 60–70 (general)
// el vano entero: hueco de forjado a casi forjado, terraza de 1,25 m hacia dentro con balconera al fondo, peto de obra en el
// plano de fachada; ~40 % cerradas con aluminio y vidrio (terrazas cerradas)
pieza('loggia', function (env, run, q, cerrada) {
  const { W0, W1 } = env, F = run.F, a = q.a, b = a + q.bw, k = q.k, Pk = q.P, wc = run.wallC, kw = env.kw, dp = 1.25, rr = q.rr;
  const u0 = a + 0.2, u1 = b - 0.2, yT = Pk - 0.24, ic = shade(env.uV, 0.95);
  wr(W0, F, a, u0, k, Pk, wc, kw); wr(W0, F, u1, b, k, Pk, wc, kw); wr(W0, F, u0, u1, yT, Pk, wc, kw);
  hpl(W0, F, u0, u1, k + 0.02, -dp, 0, env.losaV, K.STUCCO); hpl(W0, F, u0, u1, yT, -dp, 0, shade(ic, 0.8), K.STUCCO);
  jamb(W0, F, u0, k, yT, -dp, 0, shade(ic, 0.9), K.STUCCO); jamb(W0, F, u1, k, yT, -dp, 0, shade(ic, 0.9), K.STUCCO);
  const Fb = reF(F, -dp), dw = Math.min(0.95, (u1 - u0) * 0.42), dc = u0 + (u1 - u0) * (rr[5] < 0.5 ? 0.3 : 0.7);
  env.windowHole(W0, Fb, u0, u1, dc - dw / 2, dc + dw / 2, k, yT, k + 0.03, Math.min(yT - 0.1, k + 2.15), 0.12, ic, K.STUCCO, rr[0] < 0.5 ? 0.2 + rr[1] * 0.6 : 0);
  box(W0, F, u0, u1, k, k + 0.95, -0.14, 0.02, wc, kw, 1);
  box(W0, F, u0 - 0.03, u1 + 0.03, k + 0.95, k + 1.0, -0.17, 0.05, env.uV, K.STUCCO);
  if (cerrada) {                                      // terraza cerrada: vidrio con carpintería de aluminio y persianas a medias
    rect(W0, F, u0, u1, k + 1.0, yT, -0.07, env.glass, K.GLASS);
    const n = Math.max(2, Math.round((u1 - u0) / 0.9)), hw = (u1 - u0) / n;
    for (let i = 0; i < n; i++) { const h = (rr[(i + 3) % 12] * 7.3) % 1;
      if (h < 0.5) rect(W0, F, u0 + i * hw + 0.03, u0 + (i + 1) * hw - 0.03, yT - (yT - k - 1.0) * (0.2 + h), yT, -0.055, env.galP, K.SHUT); }
    if (W1) for (let i = 0; i <= n; i++) { const x = u0 + (u1 - u0 - 0.06) * i / n; box(W1, F, x, x + 0.06, k + 1.0, yT, -0.08, -0.02, env.galM, K.METAL, 4); }
  } else if (W1) {
    if (rr[4] < 0.3) P.parabolica(W1, F, u0 + 0.35, k + 1.0, -0.3, 0.3);
    if (rr[9] < 0.35) KIT.T.ropa(W1, F, u0 + 0.2, u1 - 0.2, k + 1.85, -0.6, rr[10]);
    if (rr[3] < 0.4) KIT.T.planter(W1, F, u0 + 0.4 + rr[6] * Math.max(0, u1 - u0 - 0.9), -0.3, k + 1.0, rr[5], rr[2], rr[6]);
  }
});

// ---------------------------------------------------------------- frentes de planta baja retranqueada (pbFr)
// verja de jardín: murete, verja de hierro y arbustos detrás; la puerta de la verja en el vano del portal o en el primero
pieza('frente_verja', function (env, run, q) {
  const { W0, W1 } = env, F = run.F, a = q.a, b = a + q.bw, g = q.gl, wc = run.wallC, kw = env.kw;
  const gate = run.N >= 0 ? q.W === run.N : q.W === 0;
  if (q.W === 0) box(W0, F, 0, 0.35, q.yB, g + 2.0, -0.35, 0, wc, kw, 7);
  if (q.W === q.nb - 1) box(W0, F, b - 0.35, b, q.yB, g + 2.0, -0.35, 0, wc, kw, 7);
  const e0 = Math.max(a, q.W === 0 ? 0.35 : a), e1 = Math.min(b, q.W === q.nb - 1 ? b - 0.35 : b);
  if (gate) { const c = (a + b) / 2, w = Math.min(1.1, (e1 - e0) - 0.4);
    box(W0, F, e0, c - w / 2, q.yB, g + 0.8, -0.28, 0, wc, kw, 5); box(W0, F, c + w / 2, e1, q.yB, g + 0.8, -0.28, 0, wc, kw, 5);
    lattice(W0, F, e0, c - w / 2, g + 0.8, g + 1.8, -0.14, env.iron, K.IRON, 1); lattice(W0, F, c + w / 2, e1, g + 0.8, g + 1.8, -0.14, env.iron, K.IRON, 1);
    lattice(W0, F, c - w / 2, c + w / 2, g + 0.05, g + 1.95, -0.14, env.iron, K.IRON, 0);
    box(W0, F, c - w / 2 - 0.08, c - w / 2, g, g + 2.05, -0.2, -0.08, env.iron, K.METAL, 7); box(W0, F, c + w / 2, c + w / 2 + 0.08, g, g + 2.05, -0.2, -0.08, env.iron, K.METAL, 7);
    hpl(W0, F, c - w / 2, c + w / 2, g + 0.06, -q.dep, 0, [150, 146, 138], KS());
    return; }
  box(W0, F, e0, e1, q.yB, g + 0.8, -0.28, 0, wc, kw, 1);
  box(W0, F, e0, e1, g + 0.8, g + 0.86, -0.32, 0.03, env.uV, K.STUCCO, 7);
  lattice(W0, F, e0, e1, g + 0.86, g + 1.8, -0.14, env.iron, K.IRON, 1);
  const n = Math.max(1, Math.round((e1 - e0) / 1.1));
  for (let i = 0; i < n; i++) { const u = e0 + (e1 - e0) * (i + 0.5) / n, h = 0.8 + h01(env.b, q.W * 8 + i) * 0.9;
    box(W1 || W0, F, u - 0.45, u + 0.45, g + 0.6, g + 0.6 + h, -1.3, -0.4, [58 + (i % 2) * 10, 92, 50], K.LEAF, 7); }
});
// soportales con arcos de medio punto (o rebajados si no caben) sobre pilares con basa e imposta
pieza('frente_arcos', function (env, run, q) {
  const { W0, W1, F1 } = env, F = run.F, a = q.a, b = a + q.bw, wc = run.wallC, kw = env.kw, pw = 0.26;
  const pil = u => { box(W0, F, u - pw, u + pw, q.yB, F1, -0.55, 0, wc, kw, 4);
    if (W1) { box(W1, F, u - pw - 0.05, u + pw + 0.05, q.gl, q.gl + 0.35, -0.6, 0.05, shade(env.uV, 0.92), K.STUCCO, 7);
      box(W1, F, u - pw - 0.06, u + pw + 0.06, ys - 0.12, ys, -0.6, 0.06, env.uV, K.STUCCO, 7); } };
  const luz = q.bw - 2 * pw, top = F1 - 0.3, seg = luz / 2 > top - q.gl - 2.3 ? 0.18 : 0, ys = top - (seg ? luz * seg : luz / 2);
  pil(a + (q.W === 0 ? pw : 0)); if (q.W === q.nb - 1) pil(b - pw);
  P.arco(W0, F, a + pw, b - pw, ys, F1, 0, -0.55, wc, kw, seg);
  if (W1) box(W1, F, (a + b) / 2 - 0.12, (a + b) / 2 + 0.12, top - 0.28, top + 0.05, 0, 0.07, shade(env.uV, 1.04), K.STUCCO, 7);   // clave
});

// ---------------------------------------------------------------- piezas de fachada (por tramo de calle, tras pisos y coronación)
// antenas de televisión y parabólicas sobre el peto del terrado
pieza('antenas', function (env, run, q) {
  const { W0, W1, y1, C } = env, F = run.F, L = run.L; if (C <= run.cover || L < 5) return;
  const top = env.V.coron === 'atico' ? y1 + 1.15 : y1 + 1.0, n = 1 + ((h01(env.b, run.i) * 3) | 0);
  for (let i = 0; i < n; i++) { const r = h01(env.b, run.i * 16 + i + 1), u = 1 + r * (L - 2), h = 1.8 + r * 1.6, d = -0.9 - r * 1.5;
    box(W0, F, u, u + 0.05, top, top + h, d, d + 0.05, [128, 128, 126], K.METAL, 4);
    if (W1) for (const f of [0.55, 0.8, 0.97]) box(W1, F, u - 0.45 * f, u + 0.5 * f, top + h * f, top + h * f + 0.03, d, d + 0.03, [120, 120, 118], K.METAL, 7);
    if (r < 0.6) P.parabolica(W0, F, u + 0.9 + r, top, d + 0.4, 0.35 + r * 0.15); }
});
// pilastras de orden gigante entre vanos (de la 1.ª planta a la cornisa), con basa y capitel
pieza('pilastras', function (env, run, q) {
  // F2R: pilastras gigantes de 0,2 m de vuelo en tono piedra (contrastan con el estuco) y bandas de imposta entre ellas
  const { W0, W1, F1, C } = env, F = run.F, L = run.L, col = mixc(shade(run.wallC, 0.8), env.stone || [200, 190, 170], 0.5); if (C <= run.cover + 1) return;
  const y0 = Math.max(F1 + 0.1, run.cover + 0.2), y1 = C - 0.55;
  if (W1) for (let D = 2; D <= env.nF; D++) { const k = env.lv[D - 1]; if (k > y0 + 0.5 && k < y1 - 0.5) box(W1, F, 0, L, k - 0.2, k + 0.08, 0, 0.11, col, K.STUCCO, 3); }
  for (let W = 0; W <= q.nb; W++) { const u = Math.min(L - 0.3, Math.max(0.3, W * q.bw));
    box(W0, F, u - 0.3, u + 0.3, y0, y1, 0, 0.2, col, K.STUCCO, 4);
    box(W0, F, u - 0.32, u + 0.32, y1, y1 + 0.3, 0, 0.22, shade(col, 1.04), K.STUCCO, 7);
    if (W1) box(W1, F, u - 0.3, u + 0.3, y0, y0 + 0.35, 0, 0.18, shade(col, 0.95), K.STUCCO, 7); }
});
// urnas sobre los pedestales de la balaustrada (una sí, una no)
pieza('urnas', function (env, run, q) {
  const { W1, y1, C, V } = env; if (!W1 || V.coron !== 'balaustrada' || C <= run.cover) return;
  for (let W = 0; W <= q.nb; W += 2) { const u = Math.min(run.L - 0.15, Math.max(0.15, W * q.bw)); P.urna(W1, run.F, u, y1 + 0.9, 0.1, shade(env.uV, 1.02)); }
});

// ================================================================ DESARROLLISMO
const PVCG = [[226, 222, 210], [206, 198, 180], [140, 112, 84], [190, 190, 186]];
pieza('pb_desarrollismo', function (env, run, q) {
  const { W0 } = env, F = q.F, top = env.F1, rr = q.rr;
  if (q.portal) {
    const w = Math.min(1.9, q.bw - 0.7), ap = [206, 198, 182];
    const r = P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w, gl: q.gl, h: Math.min(2.6, top - q.gl - 0.7), yB: q.yB, top, tipo: 'vidrio', col: ap, kw: KS(), dep: 0.4, met: rr[2] < 0.5 ? BRONCE : ALU, rr });
    box(W0, F, r.tt - 0.6, r.ct + 0.6, r.yt + 0.25, r.yt + 0.4, 0, 1.2, [200, 196, 188], K.STUCCO, 7);   // marquesina de hormigón
    return;
  }
  if (rr[0] < 0.35) { P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w: Math.min(2.8, q.bw - 0.5), gl: q.gl, h: Math.min(2.4, top - q.gl - 0.6), yB: q.yB, top,
    tipo: 'garaje', col: run.wallC, kw: env.kw, dep: 0.2, met: [[150, 150, 146], [96, 108, 96], [128, 74, 54]][(rr[1] * 3) | 0] }); return; }
  if (rr[0] < 0.7) { P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w: q.bw - 0.6, gl: q.gl, h: Math.min(3.0, top - q.gl - 0.5), yB: q.yB, top,
    tipo: 'persiana', col: run.wallC, kw: env.kw, dep: 0.15 }); return; }
  return false;                                       // ventana con reja, la de siempre
});
pieza('vano_desarrollismo', function (env, run, q) {
  const V = q.V, vi = V.vi, rr = q.rr, pc = PVCG[(h01(env.b, 7) * PVCG.length) | 0];
  if (q.low || q.atico) return false;
  const ac = rr[8] < 0.14 ? rr[9] : 0;
  if (vi === 0 && q.nb >= 3 && q.W % 3 === 1) { P.loggia(env, run, q, rr[3] < 0.4); return; }
  if (vi === 1 && (q.W % 2 === 0 || q.nb < 2)) { KIT.T.galeriaV(env, run.F, q.a, q.bw, q.k, q.P, rr); if (env.W1 && ac) P.aire(env.W1, run.F, q.c - 0.4, q.k + 0.35, 0.66); return; }
  if (vi === 3) { KIT.T.vano(env, run, q); const g = KIT.medidas(q); P.cajon(env.W0, run.F, g.tt, g.ct, g.yt, shade(pc, 1.04));
    if (ac && g.vent) P.aire(env.W1, run.F, q.c - 0.39, g.st - 0.8, 0.02); return; }
  if (vi === 2) {                                     // torre de los 70: ventana apaisada y antepecho de gresite de otro color
    const w = q.bw - 0.6, st = q.k + 0.95, yt = Math.min(q.P - 0.38, st + 1.25);
    P.ventanaPVC(env, run, q, { w, st, yt, se: rr[0] < 0.7 ? 0.1 + rr[1] * 0.7 : 0, pc, cajon: true, alf: env.uV, aire: ac });
    const BAND = [[92, 124, 142], [150, 96, 66], [228, 224, 212], [116, 128, 108]];
    rect(env.W0, run.F, q.a, q.a + q.bw, q.k + 0.06, st - 0.07, 0.045, BAND[(h01(env.b, 3) * 4) | 0], 17);
    return;
  }
  const vent = q.W % 2 === 1 || vi === 0, w = vent ? Math.min(1.3, q.bw - 1.0) : Math.min(1.0, q.bw - 1.1);
  const st = vent ? q.k + 0.9 : q.k + 0.06, yt = Math.min(q.P - 0.42, vent ? st + 1.3 : q.k + 2.2);
  P.ventanaPVC(env, run, q, { w, st, yt, se: rr[0] < 0.75 ? 0.1 + rr[1] * 0.75 : 0, pc, cajon: true, alf: vent ? env.uV : null, aire: vent ? ac : 0 });
  if (!vent) { const e0 = q.c - w / 2 - 0.35, e1 = q.c + w / 2 + 0.35, jt = 0.75;   // balconcillo con barandilla de tubo
    box(env.W0, run.F, e0, e1, q.k - 0.02, q.k + 0.12, 0, jt, env.losaV, K.STUCCO, 7);
    KIT.T.rail(env, run.F, e0, e1, q.k + 0.12, jt, true, true, w); }
});

// ================================================================ PUEBLO
pieza('pb_pueblo', function (env, run, q) {
  const vi = env.V.vi, F = q.F, top = env.F1, rr = q.rr, lay = env.lay, nb = run.nb;
  const portalRun = run.r === lay.portal, door = portalRun && (q.portal || (run.N < 0 && q.W === (nb > 2 ? 1 : 0)));
  const MAD = [[92, 58, 34], [60, 84, 64], [70, 46, 30], [118, 84, 52], [52, 70, 92]][(h01(env.b, 5) * 5) | 0];
  if (door) {
    const w = Math.min(1.3, q.bw - 0.6), h = Math.min(2.65, top - q.gl - 0.45);
    P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w, gl: q.gl, h, yB: q.yB, top, tipo: 'madera', col: run.wallC, kw: env.kw, dep: 0.25, madera: MAD,
      marco: { col: shade(env.stone, 1.05), k: KS(), w: 0.16, d: 0.05, W0: true }, arco: rr[2] < 0.35 ? 0.22 : 0, rr });
    return;
  }
  if (vi === 3 && portalRun && (q.W === (nb > 2 ? 2 : nb - 1) || nb === 1)) {   // taller: portalón ancho de madera o persiana metálica
    P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w: q.bw - 0.45, gl: q.gl, h: Math.min(3.0, top - q.gl - 0.4), yB: q.yB, top,
      tipo: rr[3] < 0.5 ? 'madera' : 'persiana', col: run.wallC, kw: env.kw, dep: 0.2, madera: shade(MAD, 0.9), met: [[120, 124, 120], [80, 96, 84]][(rr[4] * 2) | 0] });
    return;
  }
  return false;
});

// ================================================================ CONTEMPORÁNEO
const ACENTO = [[176, 74, 52], [64, 104, 96], [200, 170, 80], [60, 64, 70], [120, 140, 160]];
pieza('pb_contemporaneo', function (env, run, q) {
  const { W0, W1 } = env, F = q.F, top = env.F1, g0 = q.gl + 0.06, g1 = top - 0.5, a = q.a, b = a + q.bw, mc = [64, 68, 72];
  RQ(W0, F, a + 0.05, b - 0.05, g0, g1, -0.18, { x0: a - 0.3, W: q.bw + 0.6, yF: q.gl + 0.03, H: Math.max(3.3, g1 - q.gl + 0.3), D: 8, mode: 0, seed: 1 + ((q.rr[1] * 254) | 0) });
  rect(W0, F, a, b, g1, top, 0.02, [74, 78, 82], K.PBR, pbrAux(0.35, 0.6, 0, 0));
  rect(W0, F, a, b, q.yB, g0, 0.0, [96, 98, 100], K.PBR, pbrAux(0.5, 0.4, 0, 0));
  hpl(W0, F, a, b, g0, -0.18, 0.0, [120, 122, 122], KS());
  box(W0, F, a, a + 0.06, g0, g1, -0.2, 0.02, mc, K.METAL, 4);
  if (W1) { box(W1, F, (a + b) / 2 - 0.025, (a + b) / 2 + 0.025, g0, g1, -0.2, -0.12, mc, K.METAL, 4); box(W1, F, a, b, g1 - 0.06, g1, -0.2, -0.12, mc, K.METAL, 2); }
  if (q.portal) box(W0, F, a - 0.4, b + 0.4, g1 + 0.05, g1 + 0.18, 0, 1.6, [52, 56, 60], K.METAL, 7);   // visera de acero
});
pieza('vano_contemporaneo', function (env, run, q) {
  const V = q.V, vi = V.vi, rr = q.rr, { W0, W1 } = env, F = run.F;
  if (vi === 1) {                                     // celosías: balcón corrido de vidrio y paneles de lamas correderos en el borde
    KIT.T.vano(env, run, q);
    if (q.low) return;
    const g = KIT.medidas(q), pw = q.bw * 0.5, u0 = q.a + 0.06 + (q.bw - pw - 0.12) * ((rr[0] * 3 | 0) / 2), jt = g.jt + 0.04;
    rect(W0, F, u0, u0 + pw, q.k + 0.14, q.P - 0.06, jt, env.shutV, K.PBR, pbrAux(0.6, 0.05, 2, 0));
    box(W0, F, u0, u0 + pw, q.P - 0.12, q.P - 0.04, jt - 0.04, jt + 0.03, [70, 72, 74], K.METAL, 7);
    return;
  }
  if (vi === 2) {                                     // hormigón y madera: hueco grande con marco de hormigón saliente y panel de madera
    const off = ((q.W + q.D) % 2 ? 1 : -1) * q.bw * 0.12, w = Math.min(1.9, q.bw - 1.2), c = q.c + off, st = q.k + 0.45, yt = q.P - 0.45;
    P.ventanaPVC(env, run, q, { c, w, st, yt, dep: 0.3, se: 0, pc: env.shutV, marco: [56, 58, 60] });
    const fc = shade(run.wallC, 1.06), t = 0.16, d = 0.32;
    box(W0, F, c - w / 2 - t, c - w / 2, st - t, yt + t, 0, d, fc, 19, 7); box(W0, F, c + w / 2, c + w / 2 + t, st - t, yt + t, 0, d, fc, 19, 7);
    box(W0, F, c - w / 2, c + w / 2, yt, yt + t, 0, d, fc, 19, 7); box(W0, F, c - w / 2, c + w / 2, st - t, st, 0, d, fc, 19, 7);
    const s = off > 0 ? -1 : 1, p0 = s > 0 ? c + w / 2 + t + 0.08 : q.a + 0.1, p1 = s > 0 ? q.a + q.bw - 0.1 : c - w / 2 - t - 0.08;
    if (p1 - p0 > 0.3) rect(W0, F, p0, p1, q.k + 0.25, q.P - 0.3, 0.02, env.shutV, K.WOOD);
    return;
  }
  if (vi === 3) {                                     // hotel de diseño: rasgaduras verticales a ritmo irregular y paneles de color
    const w = 0.7 + rr[1] * 0.35, c = q.c + (rr[0] - 0.5) * Math.max(0, q.bw - w - 0.9), st = q.k + 0.2, yt = q.P - 0.3;
    P.ventanaPVC(env, run, q, { c, w, st, yt, dep: 0.35, se: rr[2] < 0.3 ? 0.3 : 0, pc: [210, 206, 196], marco: [40, 42, 46] });
    if (rr[3] < 0.45) { const ac = ACENTO[(h01(env.b, 11) * ACENTO.length) | 0], u0 = c > q.c ? q.a + 0.15 : c + w / 2 + 0.2, u1 = c > q.c ? c - w / 2 - 0.2 : q.a + q.bw - 0.15;
      if (u1 - u0 > 0.35) rect(W0, F, u0, u1, q.k + 0.15, q.P - 0.15, 0.03, ac, K.PBR, pbrAux(0.4, 0.3, 0, 0)); }
    return;
  }
  return false;
});
pieza('corona_contemporaneo', function (env, run, q) {
  const { W0, W1, C, y1, V } = env, F = run.F, L = run.L, wc = run.wallC; if (C <= run.cover) return;
  if (V.cw) { rect(W0, F, 0, L, C, y1 + 1.0, -0.06, KIT.T.CW_GL, K.GLASS); box(W0, F, 0, L, C - 0.06, C + 0.06, -0.02, 0.06, env.cwMt || ALU, K.METAL, 1); }
  else wr(W0, F, 0, L, C, y1 + 1.0, wc, env.kw);
  box(W0, F, -0.02, L + 0.02, y1 + 1.0, y1 + 1.08, -0.3, 0.04, [150, 154, 156], K.METAL, 7);   // albardilla de aluminio
  if (V.vi === 3) { for (let u = 0.3; u < L - 0.6; u += 1.4) box(W1 || W0, F, u, Math.min(L - 0.3, u + 1.2), y1 + 1.0, y1 + 1.45, -1.0, -0.25, [64, 100, 56], K.LEAF, 7); }
  else if (L > 3) P.placas(W0, F, 0.4, L - 0.4, y1 + 0.6, 1.3);
});

// ================================================================ BURGUÉS 60–70
pieza('pb_burgues', function (env, run, q) {
  const { W0, W1 } = env, F = q.F, top = env.F1, rr = q.rr, trav = [224, 214, 192], KT = K.TRAVERTINO;
  if (q.portal) {
    const w = Math.min(2.4, q.bw - 0.5);
    const r = P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w, gl: q.gl, h: Math.min(2.9, top - q.gl - 0.6), yB: q.yB, top, tipo: 'vidrio', col: trav, kw: KT,
      dep: 0.6, met: BRONCE, marco: { col: [236, 230, 214], k: KT, w: 0.22, d: 0.1, W0: true }, rr });
    box(W0, F, r.tt - 0.5, r.ct + 0.5, r.yt + 0.3, r.yt + 0.42, 0, 1.4, [60, 54, 48], K.METAL, 7);   // visera oscura
    if (W1) { box(W1, F, r.ct + 0.35, r.ct + 0.6, r.y0 + 1.1, r.y0 + 1.5, 0, 0.04, [196, 170, 110], K.PBR, 7, pbrAux(0.3, 1, 0, 0));   // placa de latón
      box(W1, F, r.tt - 0.5, r.tt - 0.32, r.yt - 0.6, r.yt - 0.2, 0.05, 0.2, [240, 228, 190], K.LAMP); }
    return;
  }
  if (q.W === run.nb - 1 && run.nb >= 3) {            // rampa de garaje: puerta oscura hundida y la rampa que baja hacia dentro
    const w = Math.min(3.0, q.bw - 0.4), dep = 1.1;
    P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w, gl: q.gl, h: Math.min(2.4, top - q.gl - 0.6), yB: q.yB, top, tipo: 'garaje', col: trav, kw: KT, dep, met: [72, 68, 62] });
    quad(W0, F, q.c - w / 2, q.gl + 0.1, 0, q.c + w / 2, q.gl + 0.1, 0, q.c + w / 2, q.gl - 0.35, -dep + 0.05, q.c - w / 2, q.gl - 0.35, -dep + 0.05, [128, 126, 120], KS());
    return;
  }
  // aplacado de travertino con ventana alta apaisada y jardinera al pie
  const a = q.a, b = a + q.bw, st = q.gl + 1.7, yt = Math.min(top - 0.5, st + 0.8), tt = a + 0.5, ct = b - 0.5;
  if (ct - tt < 0.6 || yt - st < 0.4) { wr(W0, F, a, b, q.yB, top, trav, KT); return; }
  env.windowHole(W0, F, a, b, tt, ct, q.yB, top, st, yt, 0.2, trav, KT, rr[0] < 0.5 ? 0.3 + rr[1] * 0.5 : 0);
  if (W1) lattice(W1, F, tt, ct, st, yt, 0.04, [60, 54, 48], K.IRON, 0);
  P.jardinera(W1 || W0, F, a + 0.2, b - 0.2, q.gl, 0.5, shade(trav, 0.9), rr[3]);
});
pieza('vano_burgues', function (env, run, q) {
  const V = q.V, vi = V.vi, rr = q.rr, { W0, W1 } = env, F = run.F;
  if (vi === 1 && !q.atico && !q.low && q.nb >= 3 && (q.W === 0 || q.W === q.nb - 1))   // torre exenta: terrazas en las esquinas
    q = Object.assign({}, q, { tipo: 'terraza', corr: true, V: Object.assign({}, V, { vuelo: 1.35 }) });
  KIT.T.vano(env, run, q);
  const g = KIT.medidas(q);
  if (q.tipo === 'terraza' && W1) {
    if (vi === 0 || q.atico) P.jardinera(W0, F, q.a + 0.05, q.a + q.bw - 0.05, q.k + 0.12, g.jt - 0.06, shade(env.uV, 0.95), rr[4]);
    if (!q.top && rr[9] < 0.3 && vi === 0) {          // toldo de lona a rayas: verde, crudo o granate
      const tc = [[64, 104, 74], [214, 204, 178], [128, 52, 44]][(h01(env.b, 2) * 3) | 0], y0 = q.P - 0.15, y1 = q.P - 0.95, dj = g.jt - 0.15;
      quad(W0, F, q.a + 0.1, y0, 0.02, q.a + q.bw - 0.1, y0, 0.02, q.a + q.bw - 0.1, y1, dj, q.a + 0.1, y1, dj, tc, K.PLAIN);
      rect(W1, F, q.a + 0.1, q.a + q.bw - 0.1, y1 - 0.22, y1, dj, shade(tc, 0.9), K.PLAIN); }
    if (q.atico) P.pergola(W1, F, q.a, q.a + q.bw, q.P - 0.4, g.jt, [86, 62, 42]);
  }
  if (vi === 3 && !q.low) {                          // persianas enrollables de madera oscura, por fuera y bajadas a medias o casi del todo
    const f = 0.35 + rr[6] * 0.6, y0 = g.yt - f * (g.yt - g.st);
    rect(W0, F, g.tt - 0.04, g.ct + 0.04, y0, g.yt + 0.02, -0.2, env.shutV, K.SHUT);
    box(W0, F, g.tt - 0.08, g.ct + 0.08, g.yt, g.yt + 0.22, -0.02, 0.06, shade(env.shutV, 1.1), K.WOOD, 7);
  }
  if (vi === 2 && !q.low && q.tipo !== 'terraza') {   // travertino: recercado grueso de piedra
    const t = 0.16, c = shade(run.wallC, 1.07), KT = K.TRAVERTINO;
    box(W0, F, g.tt - t, g.tt, g.st - 0.04, g.yt + t, 0, 0.12, c, KT, 7); box(W0, F, g.ct, g.ct + t, g.st - 0.04, g.yt + t, 0, 0.12, c, KT, 7);
    box(W0, F, g.tt, g.ct, g.yt, g.yt + t, 0, 0.12, c, KT, 7);
  }
});

// ================================================================ AUTARQUÍA
pieza('pb_autarquia', function (env, run, q) {
  const { W0, W1 } = env, F = q.F, top = env.F1, rr = q.rr;
  if (!q.portal) return false;
  const w = Math.min(1.5, q.bw - 0.7), sc = env.stone;
  const r = P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w, gl: q.gl, h: Math.min(2.9, top - q.gl - 0.8), yB: q.yB, top, tipo: 'madera', col: sc, kw: KS(), dep: 0.3,
    madera: [[82, 56, 36], [64, 44, 30], [70, 76, 60]][(rr[3] * 3) | 0], marco: { col: shade(sc, 1.12), k: KS(), w: 0.24, d: 0.08, W0: true }, rr });
  // placa de vivienda protegida sobre el portal (relieve liso, sin letras ni símbolos)
  box(W0, F, q.c - 0.32, q.c + 0.32, r.yt + 0.42, r.yt + 0.84, 0, 0.05, [196, 188, 166], K.STUCCO, 7);
  if (W1) box(W1, F, q.c - 0.24, q.c + 0.24, r.yt + 0.5, r.yt + 0.76, 0.05, 0.07, [170, 160, 136], K.STUCCO, 7);
});
pieza('vano_autarquia', function (env, run, q) {
  if (q.V.vi !== 2 || q.low) return false;
  KIT.T.vano(env, run, q);                            // ladrillo: recercados de piedra artificial clara
  const g = KIT.medidas(q), t = 0.15, c = [222, 212, 190], { W0 } = env, F = run.F;
  box(W0, F, g.tt - t, g.tt, g.st - 0.05, g.yt + t, 0, 0.06, c, KS(), 7); box(W0, F, g.ct, g.ct + t, g.st - 0.05, g.yt + t, 0, 0.06, c, KS(), 7);
  box(W0, F, g.tt - t - 0.05, g.ct + t + 0.05, g.yt, g.yt + t + 0.04, 0, 0.1, c, KS(), 7);
  if (g.vent) box(W0, F, g.tt - t, g.ct + t, g.st - 0.12, g.st, 0, 0.12, c, KS(), 7);
});

// ================================================================ NOUCENTISTA
pieza('pb_noucentista', function (env, run, q) {
  const { W0, W1 } = env, F = q.F, top = env.F1, rr = q.rr, sc = env.stone, vi = env.V.vi;
  if (q.portal) {
    const mon = vi === 2, w = Math.min(mon ? 2.4 : 1.6, q.bw - 0.8), h = Math.min(mon ? 4.0 : 3.2, top - q.gl - 0.8);
    const r = P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w, gl: q.gl, h, yB: q.yB, top, tipo: rr[4] < 0.5 ? 'madera' : 'vidrio', col: sc, kw: KS(), dep: 0.4,
      madera: [[70, 48, 30], [44, 56, 46]][(rr[3] * 2) | 0], met: [52, 50, 46], arco: mon ? 1 : 0, rr });
    for (const s of [-1, 1]) { const u = q.c + s * (w / 2 + 0.22);   // pilastras del portal, entablamento y frontón
      box(W0, F, u - 0.2, u + 0.2, q.gl, r.yt + 0.1, 0, 0.18, shade(sc, 1.08), KS(), 7); }
    box(W0, F, q.c - w / 2 - 0.5, q.c + w / 2 + 0.5, r.yt + 0.1, r.yt + 0.4, 0, 0.26, shade(sc, 1.12), KS(), 7);
    P.fronton(W0, F, q.c, w + 1.0, r.yt + 0.4, mon ? 0.55 : 0.42, 0.28, shade(sc, 1.12), KS(), mon);
    return;
  }
  // almohadillado: llagas horizontales sobre la piedra y ventana con reja
  const a = q.a, b = a + q.bw, w = Math.min(1.2, q.bw - 1.0), tt = q.c - w / 2, ct = q.c + w / 2, st = q.gl + 1.0, yt = Math.min(top - 0.5, st + 2.0);
  if (yt - st < 0.6) return false;
  env.windowHole(W0, F, a, b, tt, ct, q.yB, top, st, yt, 0.32, sc, KS(), rr[0] < 0.6 ? 0.2 + rr[1] * 0.5 : 0);
  lattice(W0, F, tt, ct, st, yt, 0.05, env.iron, K.IRON, 1);
  if (W1) { for (let y = q.gl + 0.5; y < top - 0.2; y += 0.5) { rect(W1, F, a, tt - 0.02, y - 0.025, y + 0.025, 0.005, shade(sc, 0.62), KS()); rect(W1, F, ct + 0.02, b, y - 0.025, y + 0.025, 0.005, shade(sc, 0.62), KS()); }
    box(W1, F, q.c - 0.15, q.c + 0.15, yt - 0.05, yt + 0.35, 0, 0.12, shade(sc, 1.1), KS(), 7); }   // dovela clave
});
pieza('vano_noucentista', function (env, run, q) {
  KIT.T.vano(env, run, q);
  const V = q.V; if (V.vi !== 0 || q.low || q.atico) return;
  const g = KIT.medidas(q), w = g.Vw + 0.55;           // frontones en todas las plantas: triangular en las impares y curvo en las pares
  if (g.yt + 0.7 > q.P) return;
  P.fronton(env.W0, run.F, q.c, w, g.yt + 0.17, q.D === 1 ? 0.42 : 0.3, 0.22, shade(env.uV, 1.03), K.STUCCO, q.D % 2 === 0);
});
})();
