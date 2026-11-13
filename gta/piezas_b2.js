/* GTA Barcelona · Condal City — PIEZAS del bloque 2 del kit (Fase 2b): olímpico 80–90, casa obrera XIX, autoconstrucción,
   modernista, Eixample ornamentado y Eixample temprano. Las registra en window.BCN_KIT (kit.js) con pieza(nombre, fn); los
   estilos (estilos_b2.js) las nombran en sus campos pb, pbFr, vano, corona y fachada. Ranuras y su q: cabecera de kit.js.
   Tipos de material propios (rango 176–183): 176 TRENCADIS (mosaico de cerámica rota, teselas irregulares con junta clara),
   177 BLOQUE (bloque de hormigón de 40 × 20 cm sin enlucir; acabado V.acab 'bloque'), 178 CERAMICA (azulejo vidriado de
   15 cm en damero con flor), 179 VITRAL (vidriera emplomada de colores; de noche se enciende con la casa).
   Piezas de uso general (las pueden usar los demás bloques): balcon_curvo, tribuna_hierro, tribuna_piedra, torreta,
   cornisa_b2 (cornisa con dentículos o ménsulas y remate de peto, balaustrada o barandilla), almohadillado, pintadas,
   deposito, esperas. */
(function () {
'use strict';
const KIT = window.BCN_KIT, GEO = window.BCN_GEO;
const { K, regKind, quad, rect, jamb, hpl, box, lattice, shade, mixc, pbrAux } = GEO;

regKind('TRENCADIS', 176, `
    vec2 tq = P/0.11, tc0 = floor(tq), tf = fract(tq); float d1 = 9.0, d2 = 9.0; vec2 tid = tc0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j));
      vec2 o = vec2(hash21(tc0 + g), hash21(tc0 + g + 17.3)); float dd = length(g + o - tf);
      if (dd < d1) { d2 = d1; d1 = dd; tid = tc0 + g; } else if (dd < d2) d2 = dd; }
    float tfar = smoothstep(0.12, 0.45, fwidth(tq.x)), th = hash21(tid + 3.1);
    vec3 tcol = th < 0.24 ? vec3(0.16, 0.40, 0.62) : (th < 0.44 ? vec3(0.86, 0.68, 0.22) : (th < 0.6 ? vec3(0.22, 0.52, 0.36)
              : (th < 0.72 ? vec3(0.78, 0.30, 0.22) : (th < 0.86 ? vec3(0.92, 0.90, 0.84) : alb))));
    tcol = mix(tcol, alb, 0.3)*mix(0.85, 1.1, hash21(tid + 9.0));
    float grout = 1.0 - smoothstep(0.03, 0.07, d2 - d1);
    alb = mix(mix(tcol, vec3(0.78, 0.76, 0.70), grout*0.9), mix(alb, vec3(0.6, 0.62, 0.56), 0.3), tfar);
    rough = mix(0.22, 0.65, max(grout, tfar));
    N = normalize(n + (T*(hash21(tid + 5.0) - 0.5) + Bv*(hash21(tid + 6.0) - 0.5))*0.35*nearF*(1.0 - tfar));`);
regKind('BLOQUE', 177, `
    rough = 0.92;
    vec2 q = P/vec2(0.4, 0.2); q.x += 0.5*mod(floor(q.y), 2.0);
    vec2 f = fract(q), fw = fwidth(q); float far = smoothstep(0.15, 0.5, max(fw.x, fw.y));
    float dm = min(min(f.x, 1.0 - f.x)*0.4, min(f.y, 1.0 - f.y)*0.2);
    float mort = mix(1.0 - smoothstep(0.004, 0.011, dm), 0.15, far);
    vec3 bl = alb*mix(0.88, 1.08, hash21(floor(q) + 0.7))*mix(0.9, 1.06, vnoise(P*22.0));
    alb = mix(mix(bl, alb*0.78, mort), alb*0.97, far);
    alb = mix(alb, alb*vec3(0.84, 0.82, 0.78), smoothstep(0.6, 0.9, vnoise(P*vec2(0.7, 2.0)))*0.35);`);
regKind('CERAMICA', 178, `
    vec2 q = P/0.15; vec2 f = fract(q), fw = fwidth(q); float far = smoothstep(0.15, 0.5, max(fw.x, fw.y));
    float jn = 1.0 - smoothstep(0.0, 0.06, min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)));
    float ck = mod(floor(q.x) + floor(q.y), 2.0);
    vec3 t = alb*mix(0.9, 1.08, hash21(floor(q)))*mix(1.0, 1.3, ck);
    vec2 c = f - 0.5; float a = atan(c.y, c.x), fl = (1.0 - smoothstep(0.17, 0.2, length(c)*(1.0 + 0.35*cos(a*4.0))))*(1.0 - ck);
    t = mix(t, vec3(0.92, 0.88, 0.74), fl*0.65*nearF);
    alb = mix(mix(t, vec3(0.80, 0.78, 0.72), jn), alb*1.12, far);
    rough = mix(0.18, 0.7, jn);`);
regKind('VITRAL', 179, `
    vec2 q = P/vec2(0.22, 0.26); vec2 f = fract(q), fw = fwidth(q); float far = smoothstep(0.2, 0.5, max(fw.x, fw.y));
    float ld = 1.0 - smoothstep(0.03, 0.08, min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)));
    float h = hash21(floor(q) + 2.3), hw = hash21(floor(P/vec2(1.4, 3.0)) + 0.9);
    vec3 vc = h < 0.3 ? vec3(0.75, 0.52, 0.14) : (h < 0.5 ? vec3(0.20, 0.45, 0.30) : (h < 0.7 ? vec3(0.18, 0.30, 0.62)
            : (h < 0.82 ? vec3(0.66, 0.16, 0.14) : vec3(0.82, 0.78, 0.55))));
    alb = mix(mix(vc*0.42, vec3(0.05), ld), vec3(0.22, 0.2, 0.18), far*0.5); rough = 0.12; metal = 0.0;
    emis = emit(mix(vc, vec3(0.03), ld)*1.3, uDusk*(0.12 + homeOn(hw)*0.9));`);
KIT.acabado('bloque', 177);

const P = KIT.P, pieza = KIT.pieza;
const KS = () => K.FXPIEDRA !== undefined ? K.FXPIEDRA : K.STONE;
const wr = (...a) => KIT.T.wr(...a);
const h01 = (a, b) => { let h = Math.imul(a ^ 0x5bd1e995, 0x9e3779b1) ^ Math.imul(b + 0x68e31da4, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
// marco local en el punto (u, d) del marco F, con la tangente (cu, cd) (unitaria) en el plano u–d
const frameAt = (F, u, d, cu, cd) => ({ x: F.x + F.tx * u + F.nx * d, z: F.z + F.tz * u + F.nz * d,
  tx: F.tx * cu + F.nx * cd, tz: F.tz * cu + F.nz * cd, nx: -F.tx * cd + F.nx * cu, nz: -F.tz * cd + F.nz * cu });
const conV = (q, o) => Object.assign({}, q, { V: Object.assign({}, q.V, o) });   // el mismo vano con otros campos de variante
const CONC = [196, 192, 182], ALU = [168, 170, 168];

// ================================================================ PIEZAS GENERALES
// balcón de planta curva (modernista): losa en media elipse de e0 a e1 con vuelo jt, canto de color (trencadís o piedra) y
// forja orgánica siguiendo la curva por segmentos
pieza('balcon_curvo', function (env, F, e0, e1, y, jt, o) {
  const { W0, W1 } = env, n = 7, iron = o.iron || env.iron, kc = o.kc !== undefined ? o.kc : KS(), cc = o.cc || shade(env.uV, 0.95);
  const U = [], Dd = [];
  for (let i = 0; i <= n; i++) { const t = i / n; U.push(e0 + (e1 - e0) * t); Dd.push(0.1 + (jt - 0.1) * Math.pow(Math.sin(Math.PI * t), 0.7)); }
  const y0 = y - 0.07, y2 = y + 0.11;
  for (let i = 0; i < n; i++) {
    const u0 = U[i], u1 = U[i + 1], d0 = Dd[i], d1 = Dd[i + 1];
    quad(W0, F, u0, y2, d0, u1, y2, d1, u1, y2, 0, u0, y2, 0, o.losa || [170, 166, 158], KS());
    quad(W0, F, u0, y0, d0, u1, y0, d1, u1, y0, 0, u0, y0, 0, env.losaV, K.STUCCO);
    quad(W0, F, u0, y0, d0, u1, y0, d1, u1, y2, d1, u0, y2, d0, cc, kc);
    const du = u1 - u0, dd = d1 - d0, l = Math.hypot(du, dd), Fs = frameAt(F, u0, d0 - 0.03, du / l, dd / l);
    lattice(W0, Fs, 0, l, y2, y + 1.0, 0, iron, K.IRON, 1);
    box(W1 || W0, Fs, -0.01, l + 0.01, y + 0.97, y + 1.03, -0.03, 0.03, iron, K.METAL, 3);
  }
  for (const [u, d] of [[e0, Dd[0]], [e1, Dd[n]]]) GEO.latticeSide && GEO.latticeSide(W0, F, u, y2, y + 1.0, 0, d - 0.03, iron, K.IRON, 1);
  if (W1 && o.mens) for (const u of [e0 + 0.25, e1 - 0.32]) box(W1, F, u, u + 0.07, y - 0.3, y0, 0, 0.3, shade(cc, 0.9), KS(), 5);   // ménsulas
});
// tribuna de hierro y vidrio de planta poligonal (modernista): antepecho de chapa, vidrio, vidriera arriba, montantes de hierro
pieza('tribuna_hierro', function (env, F, a, bw, k, P, o) {
  const { W0, W1 } = env, wc = env.runWall, kw = env.kw, jt = o.jt || 0.95, mc = o.mc || [52, 70, 60];
  const pts = [[a + 0.25, 0], [a + 0.6, jt], [a + bw - 0.6, jt], [a + bw - 0.25, 0]];
  wr(W0, F, a, a + 0.25, k, P, wc, kw); wr(W0, F, a + bw - 0.25, a + bw, k, P, wc, kw);
  const pl = (y, c, kk) => quad(W0, F, pts[0][0], y, pts[0][1], pts[1][0], y, pts[1][1], pts[2][0], y, pts[2][1], pts[3][0], y, pts[3][1], c, kk);
  pl(k - 0.02, env.losaV, K.STUCCO); pl(P, shade(mc, 1.1), K.METAL);
  const yA = k + 0.85, yV = P - 0.55;
  for (let i = 0; i < 3; i++) {
    const [u0, d0] = pts[i], [u1, d1] = pts[i + 1], du = u1 - u0, dd = d1 - d0, l = Math.hypot(du, dd), Fs = frameAt(F, u0, d0, du / l, dd / l);
    rect(W0, Fs, 0, l, k - 0.02, yA, 0, mc, K.PBR, pbrAux(0.45, 0.5, 0, 0));
    rect(W0, Fs, 0, l, yA, yV, 0, env.glass, K.GLASS);
    rect(W0, Fs, 0, l, yV, P - 0.08, 0, [120, 110, 90], K.VITRAL);
    box(W0, Fs, 0, l, P - 0.08, P + 0.04, -0.02, 0.06, mc, K.METAL, 3);
    if (W1) { const nm = Math.max(1, Math.round(l / 0.55));
      for (let j = 0; j <= nm; j++) { const x = Math.min(l - 0.04, l * j / nm); box(W1, Fs, x, x + 0.045, yA, P - 0.08, 0, 0.04, mc, K.METAL, 4); }
      box(W1, Fs, 0, l, yA - 0.04, yA + 0.02, 0, 0.06, mc, K.METAL, 1); box(W1, Fs, 0, l, yV - 0.03, yV + 0.02, 0, 0.05, mc, K.METAL, 1);
      lattice(W1, Fs, 0.05, l - 0.05, k + 0.1, yA - 0.1, 0.03, shade(mc, 0.7), K.IRON, 1); }
  }
  if (o.mens && W1) for (const u of [a + 0.4, a + bw - 0.47]) quad(W1, F, u, k - 0.02, 0, u, k - 0.02, jt * 0.8, u, k - 0.8, 0, u, k - 0.8, 0, mc, K.METAL);
});
// tribuna de piedra (Eixample ornamentado): ménsula, antepecho de piedra labrada, ventanal de madera y cornisa
pieza('tribuna_piedra', function (env, F, a, bw, k, P, o) {
  const { W0, W1 } = env, wc = env.runWall, kw = env.kw, jt = 0.95, s = o.sc || shade(env.uV, 1.02), u0 = a + 0.3, u1 = a + bw - 0.3, md = env.marcoV;
  wr(W0, F, a, u0, k, P, wc, kw); wr(W0, F, u1, a + bw, k, P, wc, kw);
  box(W0, F, u0, u1, k, k + 0.8, 0, jt, s, KS());
  if (W1) box(W1, F, u0 + 0.15, u1 - 0.15, k + 0.18, k + 0.62, jt, jt + 0.04, shade(s, 1.06), K.SGRAF);   // relieve floral
  rect(W0, F, u0 + 0.06, u1 - 0.06, k + 0.8, P - 0.4, jt - 0.08, env.glass, K.GLASS);
  jamb(W0, F, u0 + 0.06, k + 0.8, P - 0.4, 0, jt - 0.08, env.glass, K.GLASS); jamb(W0, F, u1 - 0.06, k + 0.8, P - 0.4, 0, jt - 0.08, env.glass, K.GLASS);
  box(W0, F, u0 - 0.04, u1 + 0.04, P - 0.4, P, 0, jt + 0.06, s, KS());
  box(W0, F, u0, u0 + 0.12, k + 0.8, P - 0.4, jt - 0.12, jt, s, KS(), 4); box(W0, F, u1 - 0.12, u1, k + 0.8, P - 0.4, jt - 0.12, jt, s, KS(), 4);
  if (W1) { const n = 3; for (let j = 1; j < n; j++) { const x = u0 + (u1 - u0) * j / n; box(W1, F, x - 0.04, x + 0.04, k + 0.8, P - 0.4, jt - 0.1, jt - 0.04, md, K.WOOD, 4); }
    box(W1, F, u0, u1, P - 0.75, P - 0.7, jt - 0.1, jt - 0.04, md, K.WOOD, 1); }
  if (o.base) {                                       // ménsula de la primera planta de la tribuna
    quad(W0, F, u0, k, jt, u1, k, jt, u1, k - 0.7, 0, u0, k - 0.7, 0, shade(s, 0.7), KS());
    quad(W0, F, u0, k, 0, u0, k, jt, u0, k - 0.7, 0, u0, k - 0.7, 0, shade(s, 0.78), KS()); quad(W0, F, u1, k, 0, u1, k, jt, u1, k - 0.7, 0, u1, k - 0.7, 0, shade(s, 0.78), KS()); }
  if (o.remate) { lattice(W0, F, u0, u1, P, P + 0.85, jt, s, K.BAL, 0); box(W0, F, u0, u1, P + 0.85, P + 0.95, jt - 0.15, jt + 0.03, s, KS(), 7); }
});
// torreta: cuerpo de planta cuadrada sobre el terrado con ventanas, cornisa y chapitel piramidal de cerámica con aguja
pieza('torreta', function (env, F, uc, w, y, h, o) {
  const { W0, W1 } = env, col = o.col, kw = o.kw, d0 = -w + 0.35, d1 = 0.35, rc = o.roof || [64, 110, 92], rk = o.rk !== undefined ? o.rk : K.CERAMICA;
  box(W0, F, uc - w / 2, uc + w / 2, y, y + h, d0, d1, col, kw, 5);
  const ww = Math.min(0.7, w * 0.3);
  rect(W0, F, uc - ww / 2, uc + ww / 2, y + h * 0.35, y + h * 0.8, d1 + 0.01, env.glass, K.GLASS);
  P.arco(W0, F, uc - ww / 2, uc + ww / 2, y + h * 0.8 - ww / 2, y + h * 0.8 + 0.01, d1 + 0.015, d1, col, kw, 0);
  if (W1) { box(W1, F, uc - ww / 2 - 0.08, uc + ww / 2 + 0.08, y + h * 0.33, y + h * 0.36, d1, d1 + 0.1, shade(col, 1.05), KS()); }
  const yc = y + h, rh = o.rh || w * 1.1, dc = (d0 + d1) / 2, e = 0.12, a = uc - w / 2 - e, b = uc + w / 2 + e, f0 = d0 - e, f1 = d1 + e;
  box(W0, F, a, b, yc, yc + 0.18, f0, f1, shade(col, 1.06), K.STUCCO);
  const yr = yc + 0.18, ya = yr + rh;
  quad(W0, F, a, yr, f1, b, yr, f1, uc, ya, dc, uc, ya, dc, rc, rk); quad(W0, F, a, yr, f0, b, yr, f0, uc, ya, dc, uc, ya, dc, shade(rc, 0.9), rk);
  quad(W0, F, a, yr, f0, a, yr, f1, uc, ya, dc, uc, ya, dc, shade(rc, 0.85), rk); quad(W0, F, b, yr, f0, b, yr, f1, uc, ya, dc, uc, ya, dc, shade(rc, 0.85), rk);
  box(W1 || W0, F, uc - 0.04, uc + 0.04, ya - 0.05, ya + 0.9, dc - 0.04, dc + 0.04, [60, 60, 58], K.METAL, 7);
  if (W1) box(W1, F, uc - 0.1, uc + 0.1, ya + 0.3, ya + 0.5, dc - 0.1, dc + 0.1, [60, 60, 58], K.METAL, 7);
});
// cornisa de bloque 2: moldura en C, dentículos (den) o ménsulas (mens), paño hasta el terrado y remate (o.top): 'peto',
// 'balaustrada', 'barandilla' (terrado transitable: peto bajo y barandilla de hierro), 'nada'; o.vu = vuelo, o.k = tipo de la moldura
pieza('cornisa_b2', function (env, run, q, o) {
  const { W0, W1, C, y1 } = env, { F, L, wallC } = run, uV = o.col || env.uV, vu = o.vu || 0.6, kk = o.k !== undefined ? o.k : K.STUCCO;
  box(W0, F, 0, L, C, C + 0.16, 0, vu * 0.35, uV, kk); box(W0, F, 0, L, C + 0.16, C + 0.32, 0, vu * 0.65, uV, kk);
  box(W0, F, 0, L, C + 0.32, C + 0.5, 0, vu, shade(uV, 1.05), kk);
  if (W1 && o.den) { const nd = Math.round(L / 0.2); for (let i = 0; i < nd; i += 2) { const u = i * L / nd; box(W1, F, u, u + L / nd * 0.9, C + 0.03, C + 0.15, vu * 0.3, vu * 0.45, shade(uV, 0.95), kk, 3); } }
  if (W1 && o.mens) for (let W = 0; W <= q.nb; W++) { const u = Math.min(L - 0.12, Math.max(0.12, W * q.bw)); box(W1, F, u - 0.1, u + 0.1, C - 0.45, C + 0.32, 0, vu * 0.62, shade(uV, 1.02), kk);
    quad(W1, F, u - 0.1, C - 0.45, 0.06, u + 0.1, C - 0.45, 0.06, u + 0.1, C - 0.1, vu * 0.6, u - 0.1, C - 0.1, vu * 0.6, shade(uV, 0.9), kk); }
  wr(W0, F, 0, L, C, y1, wallC, env.kw);
  const t = o.top || 'peto';
  if (t === 'balaustrada') { box(W0, F, 0, L, y1, y1 + 0.2, -0.02, 0.2, uV, K.STUCCO); lattice(W0, F, 0, L, y1 + 0.2, y1 + 0.76, 0.09, uV, K.BAL, 0);
    for (let W = 0; W <= q.nb; W++) { const u = Math.min(L - 0.15, Math.max(0.15, W * q.bw)); box(W0, F, u - 0.16, u + 0.16, y1 + 0.2, y1 + 0.76, -0.02, 0.22, uV, K.STUCCO); }
    box(W0, F, 0, L, y1 + 0.76, y1 + 0.9, -0.05, 0.26, shade(uV, 1.04), K.STUCCO); }
  else if (t === 'barandilla') { wr(W0, F, 0, L, y1, y1 + 0.45, wallC, env.kw); box(W0, F, 0, L, y1 + 0.45, y1 + 0.53, -0.04, 0.1, uV, K.STUCCO);
    lattice(W0, F, 0, L, y1 + 0.53, y1 + 1.05, 0.0, env.iron, K.IRON, 0); box(W1 || W0, F, 0, L, y1 + 1.03, y1 + 1.07, -0.03, 0.03, env.iron, K.METAL, 3); }
  else if (t === 'peto') { wr(W0, F, 0, L, y1, y1 + 0.76, wallC, env.kw); box(W0, F, 0, L, y1 + 0.76, y1 + 0.9, -0.05, 0.2, shade(uV, 1.04), K.STUCCO); }
});
// almohadillado de planta baja (sillares con llagas horizontales y verticales) con ventana enrejada; o.arco: dintel en arco
pieza('almohadillado', function (env, run, q, o) {
  const { W0, W1 } = env, F = q.F, top = env.F1, sc = o.sc || env.stone, rr = q.rr, a = q.a, b = a + q.bw;
  const w = Math.min(o.w || 1.2, q.bw - 1.0), tt = q.c - w / 2, ct = q.c + w / 2, st = q.gl + (o.st || 1.0), yt = Math.min(top - 0.55, st + (o.h || 2.0));
  if (yt - st < 0.6) return false;
  env.windowHole(W0, F, a, b, tt, ct, q.yB, top, st, yt, 0.32, sc, KS(), rr[0] < 0.6 ? 0.2 + rr[1] * 0.5 : 0);
  if (o.arco) P.arco(W0, F, tt, ct, yt - w * 0.22, yt + 0.002, 0.003, -0.32, sc, KS(), 0.22);
  lattice(W0, F, tt, ct, st, yt, 0.05, env.iron, K.IRON, o.forja || 0);
  box(W0, F, tt - 0.1, ct + 0.1, st - 0.1, st, 0, 0.14, shade(sc, 1.08), KS(), 7);
  if (W1) { const ll = shade(sc, 0.6), hy = o.hl || 0.5;
    for (let y = q.gl + hy; y < top - 0.2; y += hy) { rect(W1, F, a, tt - 0.02, y - 0.03, y + 0.03, 0.005, ll, KS()); rect(W1, F, ct + 0.02, b, y - 0.03, y + 0.03, 0.005, ll, KS());
      if (o.vert) { const j = Math.round((y - q.gl) / hy) % 2 ? 0.45 : 0.95; for (const u of [a + j, b - j]) if (u < tt - 0.1 || u > ct + 0.1) rect(W1, F, u - 0.03, u + 0.03, y, Math.min(top - 0.2, y + hy), 0.005, ll, KS()); } }
    box(W1, F, q.c - 0.16, q.c + 0.16, yt - 0.05, yt + 0.38, 0, 0.12, shade(sc, 1.1), KS(), 7); }
});
// pintadas en una persiana metálica o un paño: trazos de colores torcidos (sin letras legibles)
const PINT = [[200, 60, 70], [60, 120, 200], [240, 200, 60], [40, 40, 44], [90, 190, 120], [230, 120, 200], [250, 250, 250]];
pieza('pintadas', function (B, F, u0, u1, y0, y1, d, r) {
  if (!B) return; const n = 3 + ((r * 4) | 0);
  for (let i = 0; i < n; i++) { const h = (r * 37.1 + i * 0.618) % 1, h2 = (r * 11.3 + i * 0.414) % 1, c = PINT[((h * 7 + i) | 0) % PINT.length];
    const u = u0 + (u1 - u0) * h * 0.85, y = y0 + (y1 - y0) * (0.15 + h2 * 0.6), w = 0.25 + h2 * 0.6, t = 0.06 + h * 0.08, sk = (h2 - 0.5) * 0.35;
    quad(B, F, u, y, d, u + w, y + sk, d, u + w, y + sk + t, d, u, y + t, d, c, K.PLAIN); }
});
// depósito de agua de fibrocemento o de plástico sobre el terrado
pieza('deposito', function (B, F, u, y, d, r) {
  if (!B) return; const c = r < 0.5 ? [150, 152, 146] : r < 0.8 ? [70, 96, 140] : [210, 210, 204], w = 0.9 + r * 0.4;
  box(B, F, u - 0.1, u + w + 0.1, y, y + 0.25, d - w - 0.1, d + 0.1, [120, 118, 112], K.STUCCO, 7);
  box(B, F, u, u + w, y + 0.25, y + 1.25 + r * 0.3, d - w, d, c, K.PBR, 7, pbrAux(0.6, 0, 0, 0));
  box(B, F, u + 0.05, u + w - 0.05, y + 1.25 + r * 0.3, y + 1.35 + r * 0.3, d - w + 0.05, d - 0.05, shade(c, 0.9), K.PBR, 1, pbrAux(0.6, 0, 0, 0));
});
// esperas: pilares sin acabar con las barras de acero al aire (plantas añadidas a medias)
pieza('esperas', function (B, F, u, y, d) {
  if (!B) return; box(B, F, u - 0.15, u + 0.15, y, y + 0.35, d - 0.3, d, [176, 172, 164], K.STUCCO, 7);
  for (const [x, z] of [[-0.08, -0.06], [0.06, -0.06], [-0.08, -0.22], [0.06, -0.22]]) box(B, F, u + x, u + x + 0.025, y + 0.35, y + 1.1, d + z, d + z + 0.025, [96, 62, 44], K.METAL, 4);
});
// tendedero de terrado: dos postes, cuerdas y ropa (se ve por encima del peto)
function tendedero(env, F, u0, u1, y, d, r) {
  const { W0, W1 } = env; if (!W1 || u1 - u0 < 1.5) return;
  for (const u of [u0, u1]) box(W1, F, u, u + 0.05, y, y + 1.8, d, d + 0.05, [140, 140, 136], K.METAL, 4);
  box(W1, F, u0, u1, y + 1.72, y + 1.74, d, d + 0.02, [200, 200, 196], K.METAL, 1);
  KIT.T.ropa(W0, F, u0 + 0.1, u1 - 0.1, y + 1.72, d + 0.03, r);
}

// ================================================================ OLÍMPICO 80–90
const ACC = [[184, 72, 52], [222, 176, 72], [74, 120, 150], [92, 132, 104], [228, 222, 206]];
pieza('pb_olimpico', function (env, run, q) {
  const { W0, W1 } = env, F = q.F, top = env.F1, rr = q.rr;
  if (q.portal) {                                     // portería de vidrio en un marco de hormigón con visera de chapa
    const w = Math.min(2.6, q.bw - 0.5);
    const r = P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w, gl: q.gl, h: Math.min(2.8, top - q.gl - 0.5), yB: q.yB, top, tipo: 'vidrio', col: CONC, kw: 19, dep: 0.5,
      met: [60, 64, 66], marco: { col: [206, 202, 192], k: 19, w: 0.25, d: 0.12, W0: true }, rr });
    box(W0, F, r.tt - 0.3, r.ct + 0.3, r.yt + 0.25, r.yt + 0.33, 0, 1.3, [120, 124, 126], K.PBR, 7, pbrAux(0.35, 0.7, 2, 0));
    if (W1) box(W1, F, r.ct + 0.32, r.ct + 0.5, r.y0 + 1.15, r.y0 + 1.5, 0, 0.04, [70, 72, 74], K.METAL, 7);   // videoportero
    return;
  }
  if (q.W === run.nb - 1 && run.nb >= 3) {            // acceso al aparcamiento: puerta de lamas de acero, ancha
    P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w: Math.min(3.2, q.bw - 0.4), gl: q.gl, h: Math.min(2.5, top - q.gl - 0.5), yB: q.yB, top, tipo: 'persiana', col: run.wallC, kw: env.kw, dep: 0.4, met: [96, 100, 102] });
    if (W1) box(W1, F, q.c - 0.9, q.c + 0.9, Math.min(top - 0.4, q.gl + 2.75), Math.min(top - 0.25, q.gl + 2.9), 0, 0.05, [40, 70, 140], K.PLAIN, 7);   // franja azul del aparcamiento
    return;
  }
  // ventanal de la planta baja en el muro del estilo (ladrillo u hormigón), con hojas correderas de lamas y vierteaguas de hormigón
  const a = q.a, b = a + q.bw, w = Math.min(2.2, q.bw - 1.0), st = q.gl + 1.0, yt = Math.min(top - 0.6, st + 1.9);
  if (yt - st < 0.6 || w < 0.8) return false;
  env.windowHole(W0, F, a, b, q.c - w / 2, q.c + w / 2, q.yB, top, st, yt, 0.25, run.wallC, env.kw, 0);
  const f = 0.3 + rr[1] * 0.5; rect(W0, F, q.c + w / 2 - w * f, q.c + w / 2, st, yt, -0.08, env.shutV, K.SHUT);
  box(W0, F, q.c - w / 2 - 0.1, q.c + w / 2 + 0.1, st - 0.12, st, 0, 0.12, CONC, 19, 7);
  if (W1) lattice(W1, F, q.c - w / 2, q.c + w / 2, st, st + 1.0, 0.04, env.marcoV, K.IRON, 0);
});
pieza('pilares_olimpico', function (env, run, q) {         // pbFr: pilares cuadrados de hormigón y jácena de canto
  const { W0 } = env, F = run.F, a = q.a, b = a + q.bw, pw = 0.28, c = [200, 196, 186];
  const pil = u => box(W0, F, u - pw, u + pw, q.yB, env.F1 - 0.55, -pw * 2, 0, c, 19, 4);
  pil(a + (q.W === 0 ? pw : 0)); if (q.W === q.nb - 1) pil(b - pw);
  box(W0, F, a, b, env.F1 - 0.55, env.F1, -0.5, 0, c, 19, 2);
});
pieza('vano_olimpico', function (env, run, q) {
  const V = q.V, vi = V.vi, rr = q.rr, { W0, W1 } = env, F = run.F, a = q.a, b = a + q.bw, k = q.k, Pk = q.P;
  if (q.low || q.atico) return false;
  if (vi === 0) {
    if (q.W % 2 === 0 && q.nb >= 2) {                // galería apilada: marco de hormigón saliente, vidrio y hojas de lamas plegadas
      const u0 = a + 0.12, u1 = b - 0.12, dg = 0.6, cc = shade(env.forjV || CONC, 1.1);
      wr(W0, F, a, u0, k, Pk, run.wallC, env.kw); wr(W0, F, u1, b, k, Pk, run.wallC, env.kw);
      box(W0, F, u0, u0 + 0.18, k - 0.12, Pk, 0, dg, cc, 19, 4); box(W0, F, u1 - 0.18, u1, k - 0.12, Pk, 0, dg, cc, 19, 4);
      box(W0, F, u0, u1, k - 0.12, k + 0.12, 0, dg, cc, 19, 3);
      box(W0, F, u0 + 0.18, u1 - 0.18, k + 0.12, k + 0.95, dg - 0.12, dg - 0.04, run.wallC, env.kw, 0);
      rect(W0, F, u0 + 0.18, u1 - 0.18, k + 0.95, Pk - 0.12, dg - 0.16, env.glass, K.GLASS);
      const f = 0.3 + rr[5] * 0.5, wl = (u1 - u0 - 0.36) * f;
      rect(W0, F, rr[6] < 0.5 ? u0 + 0.18 : u1 - 0.18 - wl, rr[6] < 0.5 ? u0 + 0.18 + wl : u1 - 0.18, k + 0.12, Pk - 0.12, dg - 0.06, env.shutV, K.SHUT);
      if (W1) box(W1, F, u0 + 0.18, u1 - 0.18, k + 0.95, k + 1.0, dg - 0.16, dg - 0.02, cc, 19, 1);
      return;
    }
    KIT.T.vano(env, run, conV(q, { hueco: 'ventana' })); return;
  }
  if (vi === 2) {                                     // posmoderno: ventana cuadrada con marco grueso de color y frontón en lo alto
    const ac = ACC[(h01(env.b, 3) * ACC.length) | 0], w = Math.min(1.4, q.bw - 1.2), st = k + 0.75, yt = Math.min(Pk - 0.45, st + 1.4), c = q.c;
    env.windowHole(W0, F, a, b, c - w / 2, c + w / 2, k, Pk, st, yt, 0.3, run.wallC, env.kw, rr[0] < 0.5 ? 0.2 + rr[1] * 0.6 : 0);
    const t = 0.22;
    box(W0, F, c - w / 2 - t, c - w / 2, st - t, yt + t, 0, 0.16, ac, K.STUCCO, 7); box(W0, F, c + w / 2, c + w / 2 + t, st - t, yt + t, 0, 0.16, ac, K.STUCCO, 7);
    box(W0, F, c - w / 2, c + w / 2, yt, yt + t, 0, 0.16, ac, K.STUCCO, 7); box(W0, F, c - w / 2, c + w / 2, st - t, st, 0, 0.2, ac, K.STUCCO, 7);
    if (W1) { box(W1, F, c - 0.02, c + 0.02, st, yt, -0.28, -0.24, [240, 240, 236], K.METAL, 4); box(W1, F, c - w / 2, c + w / 2, st + (yt - st) * 0.62, st + (yt - st) * 0.62 + 0.04, -0.28, -0.24, [240, 240, 236], K.METAL, 1); }
    if (q.top && q.W === q.nb >> 1) P.fronton(W0, F, c, w + 1.2, yt + t, 0.6, 0.2, ac, K.STUCCO, false);
    if (q.D === 1 && q.W % 2 === 1) P.arco(W0, F, c - w / 2, c + w / 2, yt - w / 2, yt + 0.002, 0.004, -0.3, run.wallC, env.kw, 0);
    return;
  }
  if (vi === 3) {                                     // vivienda pública: ventana apaisada con hojas correderas de lamas y bandas de hormigón
    const st = k + 0.9, yt = Math.min(Pk - 0.35, st + 1.3), tt = a + 0.3, ct = b - 0.3;
    env.windowHole(W0, F, a, b, tt, ct, k, Pk, st, yt, 0.22, run.wallC, env.kw, 0);
    const f = rr[5] < 0.3 ? 0.15 : 0.35 + rr[4] * 0.4, wl = (ct - tt) * f;
    rect(W0, F, rr[6] < 0.5 ? tt : ct - wl, rr[6] < 0.5 ? tt + wl : ct, st, yt, -0.06, env.shutV, K.SHUT);
    box(W0, F, a, b, st - 0.14, st, 0, 0.12, CONC, 19, 3); box(W0, F, a, b, yt, yt + 0.22, 0, 0.06, CONC, 19, 3);
    if (W1) box(W1, F, (tt + ct) / 2 - 0.025, (tt + ct) / 2 + 0.025, st, yt, -0.22, -0.18, ALU, K.METAL, 4);
    return;
  }
  return false;
});
pieza('corona_olimpico', function (env, run, q) {
  const { W0, W1, C, y1, V } = env, F = run.F, L = run.L, wc = run.wallC; if (C <= run.cover) return;
  wr(W0, F, 0, L, C, y1 + 0.95, wc, env.kw);
  if (V.imposta === 3) box(W0, F, 0, L, C - 0.1, C + 0.15, 0, 0.05, env.forjV, 19, 3);
  box(W0, F, -0.03, L + 0.03, y1 + 0.95, y1 + 1.05, -0.3, 0.06, [150, 154, 156], K.METAL, 7);
  if (V.vi === 1 || (V.vi === 0 && q.cr < 0.45)) {   // cubierta metálica curva (zinc) retirada del frente
    const n = 6, R0 = 2.2, h = 1.5, mc = [150, 158, 160];
    for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI / 2, a1 = (i + 1) / n * Math.PI / 2;
      const dA = -0.6 - R0 + Math.cos(a0) * R0, dB = -0.6 - R0 + Math.cos(a1) * R0, yA = y1 + 1.05 + Math.sin(a0) * h, yB = y1 + 1.05 + Math.sin(a1) * h;
      quad(W0, F, 0.2, yA, dA + R0 * 0 + 0, L - 0.2, yA, dA, L - 0.2, yB, dB, 0.2, yB, dB, shade(mc, 0.92 + i * 0.03), K.PBR, pbrAux(0.35, 0.75, 2, 0)); }
    return;
  }
  if (V.vi === 2 && L > 6 && W1) { const u0 = L / 2 - 2.5, u1 = L / 2 + 2.5;   // pérgola de hormigón de color en el terrado
    for (const u of [u0, u1]) box(W1, F, u, u + 0.3, y1 + 1.05, y1 + 3.0, -1.6, -1.3, ACC[(h01(env.b, 3) * ACC.length) | 0], K.STUCCO, 7);
    box(W1, F, u0, u1 + 0.3, y1 + 2.8, y1 + 3.1, -1.7, -1.2, ACC[(h01(env.b, 3) * ACC.length) | 0], K.STUCCO, 7); return; }
  if (L > 4) P.placas(W0, F, 0.5, Math.min(L - 0.5, 0.5 + L * 0.5), y1 + 0.55, 1.4);
});

// ================================================================ CASA OBRERA XIX
pieza('pb_obrera', function (env, run, q) {
  const { W0, W1 } = env, F = q.F, top = env.F1, rr = q.rr;
  if (q.portal) {                                     // portal estrecho y alto de madera con montante enrejado
    const w = Math.min(1.1, q.bw - 0.6), h = Math.min(2.4, top - q.gl - 1.1);
    const MD = [[86, 58, 36], [58, 76, 60], [92, 70, 52], [60, 64, 82]][(rr[3] * 4) | 0];
    const r = P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w, gl: q.gl, h: top - q.gl - 0.45, yB: q.yB, top, tipo: 'madera', col: run.wallC, kw: env.kw, dep: 0.22, madera: MD, rr });
    const ym = q.gl + 0.12 + h;                        // montante: vidrio oscuro con reja sobre la puerta
    if (r.yt - ym > 0.3) { rect(W0, F, r.tt, r.ct, ym, r.yt, -0.18, [30, 34, 38], K.GLASS); lattice(W0, F, r.tt, r.ct, ym, r.yt, -0.15, env.iron, K.IRON, 1);
      box(W0, F, r.tt, r.ct, ym - 0.06, ym, -0.2, -0.12, shade(MD, 0.8), K.WOOD, 1); }
    return;
  }
  if (rr[0] < 0.55) {                                 // local cerrado: persiana metálica con pintadas
    P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w: q.bw - 0.5, gl: q.gl, h: Math.min(2.9, top - q.gl - 0.5), yB: q.yB, top, tipo: 'persiana', col: run.wallC, kw: env.kw, dep: 0.12,
      met: [[150, 152, 150], [120, 126, 120], [96, 104, 110]][(rr[1] * 3) | 0] });
    if (rr[2] < 0.75) P.pintadas(W1 || W0, F, q.a + 0.3, q.a + q.bw - 0.3, q.gl + 0.2, q.gl + 2.4, 0.0, rr[3]);
    return;
  }
  return false;
});
pieza('vano_obrera', function (env, run, q) {
  KIT.T.vano(env, run, q);
  const rr = q.rr, { W0, W1 } = env, F = run.F;
  if (!q.low && q.D <= 2 && rr[11] < 0.05 && W1) {    // pancarta vecinal colgada de la barandilla (tela con franjas, sin letras)
    const g = KIT.medidas(q), jt = (q.corr ? q.V.vuelo + 0.15 : q.V.vuelo + (q.D === 1 ? 0.25 : 0)) + 0.05, w = Math.min(1.6, q.bw - 0.3);
    rect(W0, F, q.c - w / 2, q.c + w / 2, q.k + 0.1, q.k + 1.0, jt, [236, 232, 222], K.PLAIN);
    const cc = [[190, 50, 50], [40, 90, 160], [230, 180, 40], [60, 140, 80]][(rr[10] * 4) | 0];
    rect(W1, F, q.c - w / 2 + 0.1, q.c + w / 2 - 0.1, q.k + 0.45, q.k + 0.65, jt + 0.01, cc, K.PLAIN);
    if (g.Vw > 0) rect(W1, F, q.c - w / 2 + 0.1, q.c + w / 2 - 0.1, q.k + 0.75, q.k + 0.82, jt + 0.01, shade(cc, 0.7), K.PLAIN);
  }
});
// cables por la fachada: dos o tres tendidos horizontales y una bajante, con grapas
pieza('cables_obrera', function (env, run, q) {
  const { W1, F1, C } = env, F = run.F, L = run.L; if (!W1 || L < 3) return;
  const ys = [F1 + 0.2, F1 + 0.32]; if (env.nF >= 3) ys.push(env.lv[2] - 0.2);
  for (const y of ys) { const sag = 0.03 + h01(env.b, run.i + y | 0) * 0.04; box(W1, F, 0.05, L - 0.05, y - sag, y - sag + 0.025, 0.04, 0.07, [24, 24, 26], K.PLAIN, 1); }
  const u = h01(env.b, run.i * 3) < 0.5 ? 0.25 : L - 0.3;
  box(W1, F, u, u + 0.03, Math.max(env.gHi + 0.3, run.cover), C - 0.2, 0.04, 0.07, [24, 24, 26], K.PLAIN, 4);
  box(W1, F, u + 0.2, u + 0.32, F1 - 1.2, F1 - 0.7, 0, 0.12, [150, 150, 144], K.STUCCO, 7);   // caja de contadores
});
pieza('corona_obrera', function (env, run, q) {
  const { W1, y1, V } = env, L = run.L; if (env.C <= run.cover) return;
  P.cornisa_b2(env, run, q, { vu: V.vi === 1 ? 0.62 : 0.4, den: false, mens: V.vi === 1, top: 'peto' });
  if (L > 4 && q.cr < 0.75) tendedero(env, run.F, 0.8, Math.min(L - 0.8, 0.8 + 3.5 + q.cr * 2), y1, -1.4 - q.cr, q.cr);
  if (W1 && q.cr > 0.5) P.antenas && P.antenas(env, run, q);
});

// ================================================================ AUTOCONSTRUCCIÓN
const LADR = [176, 98, 66];
pieza('pb_auto', function (env, run, q) {
  const { W0, W1 } = env, F = q.F, top = env.F1, rr = q.rr, vi = env.V.vi;
  if (vi === 3 && run.r === env.lay.portal && q.W === run.nb - 1 && run.L > 6) { wr(W0, F, q.a, q.a + q.bw, q.yB, top, run.wallC, env.kw); return; }   // bajo la escalera
  if (q.portal) {
    const r = P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w: Math.min(0.95, q.bw - 0.8), gl: q.gl, h: Math.min(2.2, top - q.gl - 0.5), yB: q.yB, top,
      tipo: rr[3] < 0.5 ? 'madera' : 'garaje', col: run.wallC, kw: env.kw, dep: 0.15, madera: [[110, 80, 50], [70, 90, 110], [150, 70, 50]][(rr[4] * 3) | 0], met: [[90, 110, 120], [140, 80, 60], [180, 180, 172]][(rr[4] * 3) | 0] });
    box(W0, F, r.tt - 0.25, r.ct + 0.25, r.yt + 0.1, r.yt + 0.2, 0, 0.6, CONC, K.STUCCO, 7);   // tejadillo de losa
    return;
  }
  if (rr[0] < 0.4) {                                  // garaje improvisado: puerta de chapa pintada
    P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w: Math.min(2.6, q.bw - 0.4), gl: q.gl, h: Math.min(2.2, top - q.gl - 0.4), yB: q.yB, top, tipo: 'garaje', col: run.wallC, kw: env.kw, dep: 0.1,
      met: [[60, 100, 80], [70, 90, 130], [150, 80, 54], [170, 170, 160]][(rr[1] * 4) | 0] });
    return;
  }
  return false;
});
pieza('vano_auto', function (env, run, q) {
  const V = q.V, vi = V.vi, rr = q.rr, { W0, W1 } = env, F = run.F, a = q.a, b = a + q.bw, k = q.k, Pk = q.P;
  if (q.atico) return false;
  const nueva = vi === 1 && q.top, wc = nueva ? shade(LADR, 0.9 + h01(env.b, 1) * 0.2) : run.wallC, kw = nueva ? 16 : env.kw;
  const h = (i) => h01(env.b * 7 + q.D, q.W * 13 + i);   // irregular por casa: cada vano a su manera
  if (nueva && q.W === 0) box(W0, F, 0, q.nb * q.bw, k - 0.18, k + 0.08, 0, 0.04, CONC, 19, 3);   // canto del forjado de la ampliación
  if (h(0) < 0.14 && q.nb > 1) { wr(W0, F, a, b, k, Pk, wc, kw); return; }   // paño ciego
  const w = 0.7 + h(1) * 0.65, off = (h(2) - 0.5) * Math.max(0, q.bw - w - 0.9), c = q.c + off;
  const bal = !q.low && h(3) < (vi === 3 ? 0.55 : 0.3);
  const st = bal ? k + 0.06 : k + 0.85 + (h(4) - 0.5) * 0.25, yt = Math.min(Pk - 0.3, bal ? k + 2.1 : st + 1.0 + h(5) * 0.35);
  const ali = h(6) < 0.45, se = ali ? 0 : rr[0] < 0.7 ? 0.15 + rr[1] * 0.7 : 0;
  env.windowHole(W0, F, a, b, c - w / 2, c + w / 2, k, Pk, st, yt, 0.16, wc, kw, se);
  if (vi === 2 || nueva) box(W0, F, c - w / 2 - 0.15, c + w / 2 + 0.15, yt, yt + 0.2, 0, 0.03, CONC, 19, 7);   // dintel de hormigón
  else box(W0, F, c - w / 2 - 0.05, c + w / 2 + 0.05, st - 0.05, st, 0, 0.07, shade(wc, 1.1), K.STUCCO, 7);
  if (ali) { const pc = env.shutV, hh = (0.3 + rr[4] * 0.6) * (yt - st);   // persiana alicantina por fuera
    rect(W0, F, c - w / 2 - 0.05, c + w / 2 + 0.05, yt - hh, yt + 0.05, 0.06, pc, K.PBR, pbrAux(0.75, 0, 1, 0)); }
  else if (W1) P.cajon(W1, F, c - w / 2, c + w / 2, yt, [220, 218, 210]);
  if (W1) box(W1, F, c - 0.025, c + 0.025, st, yt, -0.16, -0.12, ALU, K.METAL, 4);
  if (bal) { const e0 = c - w / 2 - 0.3, e1 = c + w / 2 + 0.3, jt = 0.6;
    box(W0, F, e0, e1, k - 0.04, k + 0.1, 0, jt, CONC, K.STUCCO, 7);
    KIT.T.rail(env, F, e0, e1, k + 0.1, jt, true, true, w);
    if (W1 && rr[3] < 0.6) KIT.T.planter(W1, F, e0 + 0.15 + rr[4] * Math.max(0, e1 - e0 - 0.6), jt - 0.27, k + 0.1, rr[5], rr[2], rr[6]);
    if (rr[9] < 0.35) KIT.T.ropa(W0, F, e0, e1, k + 1.1, jt + 0.03, rr[10]); }
  else if (W1 && rr[3] < 0.35) KIT.T.planter(W1, F, c - 0.2, 0.05, st, rr[5], rr[2], rr[6]);   // maceta en el alféizar
  if (W1 && rr[8] < 0.1 && !bal) P.aire(W1, F, c - 0.39, st - 0.8, 0.02);
});
pieza('corona_auto', function (env, run, q) {
  const { W0, W1, C, y1, V } = env, F = run.F, L = run.L; if (C <= run.cover) return;
  const nueva = V.vi === 1 && env.nF >= 1, wc = nueva ? shade(LADR, 0.9 + h01(env.b, 1) * 0.2) : run.wallC, kw = nueva ? 16 : env.kw;
  if (V.vi === 0 && L > 5) {                          // casita escalonada: el peto sube y baja por tramos (cada casa a su altura)
    const ns = Math.max(2, Math.round(L / 4.5));
    for (let i = 0; i < ns; i++) { const u0 = L * i / ns, u1 = L * (i + 1) / ns, hh = y1 + 0.95 + ((h01(env.b, run.i * 8 + i) * 4) | 0) * 0.35;
      wr(W0, F, u0, u1, C, hh, wc, kw); box(W0, F, u0, u1, hh, hh + 0.07, -0.05, 0.06, shade(wc, 1.08), K.STUCCO, 5); }
  } else wr(W0, F, 0, L, C, y1 + 0.95, wc, kw);
  if (V.vi === 3) { box(W0, F, 0, L, y1 + 0.45, y1 + 0.5, -0.05, 0.08, CONC, K.STUCCO, 1);   // terraza: peto bajo y barandilla de tubo
    for (const [h0, h1] of [[y1 + 1.0, y1 + 1.05], [y1 + 0.75, y1 + 0.78]]) box(W1 || W0, F, 0, L, h0, h1, 0.02, 0.06, env.marcoV, K.METAL, 3); }
  else if (V.vi !== 0 || L <= 5) box(W0, F, 0, L, y1 + 0.95, y1 + 1.02, -0.05, 0.06, shade(wc, 1.08), K.STUCCO, 1);
  const r = h01(env.b, run.i);
  if (L > 3 && r < 0.75) P.deposito(W0, F, 0.4 + r * Math.max(0, L - 2.2), y1, -0.7, h01(env.b, 9));
  if (V.vi === 3 && W1 && L > 4) { P.pergola(W1, F, 0.3, Math.min(L - 0.3, 3.4), y1 + 2.3, -2.2, [96, 90, 76]);   // sombrajo con dos pies
    for (const u of [0.3, Math.min(L - 0.3, 3.4) - 0.08]) box(W1, F, u, u + 0.08, y1, y1 + 2.3, -2.3, -2.22, [96, 90, 76], K.WOOD, 4); }
  if ((V.vi === 1 || V.vi === 2 || r > 0.8) && L > 3) { P.esperas(W0, F, 0.3, y1 + 0.95, -0.05); P.esperas(W0, F, L - 0.3, y1 + 0.95, -0.05); }
});
pieza('escalera_auto', function (env, run, q) {           // escalera exterior de obra hasta la terraza del primer piso
  const { W0, W1, F1, gHi } = env, F = run.F, L = run.L;
  if (env.V.vi !== 3 || run.r !== env.lay.portal || L < 6 || F1 <= run.cover) return;
  const u1 = L - 0.25, top = F1, g = Math.max(gHi, run.gnd ? run.gnd(u1) : gHi) + 0.02, n = Math.max(4, Math.round((top - g) / 0.19)), rh = (top - g) / n, tr = 0.27;
  const u0 = u1 - 1.2 - n * tr, dw = 0.95, col = shade(run.wallC, 0.95);
  if (u0 < 0.3) return;
  box(W0, F, u1 - 1.2, u1, top - 0.2, top + 0.02, 0, dw + 0.1, CONC, K.STUCCO);   // rellano
  for (let i = 0; i < n; i++) { const ua = u1 - 1.2 - (i + 1) * tr, y = top - (i + 1) * rh; box(W0, F, ua, ua + tr, y, y + rh, 0, dw, i % 2 ? [168, 92, 64] : [156, 86, 60], K.STUCCO, 1); }
  quad(W0, F, u0, g, dw, u1 - 1.2, top - 0.2, dw, u1 - 1.2, top - 0.2 + 0.001, 0, u0, g, 0, col, env.kw);   // zanca
  quad(W0, F, u0, g, dw, u1 - 1.2, top - 0.2, dw, u1 - 1.2, top - 0.02, dw, u0, g + rh, dw, col, env.kw);
  quad(W0, F, u0, g, dw, u1 - 1.2, top - 0.2, dw, u1 - 1.2, g, dw, u0, g, dw, col, env.kw);
  const mc = env.marcoV;
  if (W1) { quad(W1, F, u0, g + 0.95, dw - 0.03, u1 - 1.2, top + 0.95, dw - 0.03, u1 - 1.2, top + 0.99, dw - 0.03, u0, g + 0.99, dw - 0.03, mc, K.METAL);
    for (let i = 0; i <= n; i += 3) { const ua = u1 - 1.2 - i * tr, y = top - i * rh; box(W1, F, ua, ua + 0.04, y, y + 0.97, dw - 0.06, dw - 0.02, mc, K.METAL, 4); }
    box(W1, F, u1 - 1.2, u1, top + 0.95, top + 0.99, dw + 0.02, dw + 0.06, mc, K.METAL, 3); }
});

// ================================================================ MODERNISTA
const VIDM = [[52, 70, 60], [70, 56, 44], [60, 64, 76]];
pieza('pb_modernista', function (env, run, q) {
  const { W0, W1 } = env, F = q.F, top = env.F1, rr = q.rr, sc = env.stone;
  if (q.portal) {                                     // portal en arco con vidriera, enmarcado de mosaico y forja
    const w = Math.min(2.0, q.bw - 0.8), h = Math.min(3.9, top - q.gl - 0.45);
    const r = P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w, gl: q.gl, h, yB: q.yB, top, tipo: 'madera', col: sc, kw: KS(), dep: 0.45,
      madera: [[78, 52, 30], [52, 64, 50]][(rr[3] * 2) | 0], arco: 1, marco: { col: [200, 180, 150], k: K.TRENCADIS, w: 0.22, d: 0.06, W0: true }, rr });
    const ys = r.yt - w / 2;
    rect(W0, F, r.tt + 0.02, r.ct - 0.02, ys - 0.75, r.yt, -0.41, [140, 120, 90], K.VITRAL);
    if (W1) { lattice(W1, F, r.tt + 0.05, r.ct - 0.05, ys - 0.75, r.yt, -0.39, env.iron, K.IRON, 1);
      box(W1, F, r.tt, r.ct, ys - 0.8, ys - 0.74, -0.42, -0.36, [70, 50, 30], K.WOOD, 1); }
    return;
  }
  return P.almohadillado(env, run, q, { arco: 1, forja: 1, hl: 0.42, sc });
});
pieza('vano_modernista', function (env, run, q) {
  const V = q.V, vi = V.vi, rr = q.rr, { W0, W1 } = env, F = run.F;
  if (q.atico) return false;
  if (vi === 1 && !q.top && q.nF >= 3 && q.nb >= 3 && (q.nb >= 5 ? q.W === 1 || q.W === q.nb - 2 : q.W === q.nb >> 1)) {
    env.runWall = run.wallC; P.tribuna_hierro(env, F, q.a, q.bw, q.k, q.P, { mens: q.D === 1, mc: VIDM[(h01(env.b, 4) * 3) | 0] }); return; }
  const curvo = (vi === 0 || (vi === 1 && q.D === 1)) && !q.low && q.tipo !== 'ninguno';
  const qq = curvo ? conV(q, { bar: 'x' }) : q;
  if (curvo) { qq.tipo = 'indiv'; qq.corr = false; qq.rr = rr.slice(); qq.rr[2] = 2; }   // sin balcón de losa recta: el curvo va encima
  KIT.T.vano(env, run, qq);
  const g = KIT.medidas(q);
  if (!q.low) {                                       // dintel curvo (arco rebajado) en todos los huecos
    P.arco(W0, F, g.tt, g.ct, g.yt - g.Vw * 0.18, g.yt + 0.002, 0.003, -0.3, run.wallC, env.kw, 0.18);
    if (W1) box(W1, F, q.c - 0.14, q.c + 0.14, g.yt - 0.12, g.yt + 0.3, 0, 0.12, vi === 2 ? [226, 214, 190] : shade(env.uV, 1.06), KS(), 7);
  }
  if (curvo) { const e0 = q.c - Math.min(g.Vw / 2 + 0.45, q.bw / 2 - 0.06), e1 = 2 * q.c - e0;
    P.balcon_curvo(env, F, e0, e1, q.k, g.jt + 0.1, { kc: vi === 0 ? K.TRENCADIS : KS(), cc: vi === 0 ? [180, 170, 150] : shade(env.uV, 0.95), mens: true });
    if (W1 && rr[3] < V.mac) KIT.T.planter(W1, F, q.c - 0.3, g.jt - 0.4, q.k + 0.11, rr[5], rr[2], rr[6]); }
  if (vi === 2 && !q.low) {                          // ladrillo y cerámica: recercado de piedra y friso de azulejo verde sobre el dintel
    const t = 0.15, c = [226, 214, 190];
    box(W0, F, g.tt - t, g.tt, g.st - 0.04, g.yt, 0, 0.08, c, KS(), 7); box(W0, F, g.ct, g.ct + t, g.st - 0.04, g.yt, 0, 0.08, c, KS(), 7);
    const yf = Math.min(q.P - 0.3, g.yt + 0.35); if (yf - g.yt > 0.2) rect(W0, F, q.a + 0.2, q.a + q.bw - 0.2, g.yt + 0.12, yf, 0.012, [52, 120, 96], K.CERAMICA);
  }
  if (vi === 0 && !q.low && q.top && W1) rect(W1, F, q.a + 0.15, q.a + q.bw - 0.15, g.yt + 0.25, Math.min(q.P - 0.05, g.yt + 0.7), 0.01, [190, 176, 150], K.TRENCADIS);
});
pieza('corona_modernista', function (env, run, q) {
  const { W0, W1, C, y1, V } = env, F = run.F, L = run.L, wc = run.wallC, uV = env.uV; if (C <= run.cover) return;
  box(W0, F, 0, L, C, C + 0.18, 0, 0.3, uV, KS()); box(W0, F, 0, L, C + 0.18, C + 0.36, 0, 0.5, shade(uV, 1.04), KS());
  if (W1) rect(W1, F, 0, L, C + 0.4, C + 0.75, 0.01, vi2(V) ? [52, 120, 96] : [190, 176, 150], vi2(V) ? K.CERAMICA : K.TRENCADIS);   // mosaico en la cornisa
  wr(W0, F, 0, L, C, y1, wc, env.kw);
  // coronamiento ondulado: paño con borde en ondas y albardilla de trencadís
  const m = Math.max(1, Math.round(L / 4)), ns = Math.max(4, Math.round(L / 0.45)), top = u => y1 + 0.55 + 0.7 * Math.pow(Math.abs(Math.sin(Math.PI * m * u / L)), 1.5);
  for (let i = 0; i < ns; i++) { const u0 = L * i / ns, u1 = L * (i + 1) / ns, t0 = top(u0), t1 = top(u1);
    quad(W0, F, u0, y1, 0, u1, y1, 0, u1, t1, 0, u0, t0, 0, wc, env.kw);
    quad(W0, F, u0, t0, 0.07, u1, t1, 0.07, u1, t1 + 0.12, 0.07, u0, t0 + 0.12, 0.07, [190, 176, 150], K.TRENCADIS);
    quad(W0, F, u0, t0 + 0.12, 0.07, u1, t1 + 0.12, 0.07, u1, t1 + 0.12, -0.2, u0, t0 + 0.12, -0.2, [190, 176, 150], K.TRENCADIS); }
  if (V.vi === 3 || V.vi === 0) for (let j = 0; j <= m; j++) { const u = Math.min(L - 0.2, Math.max(0.2, L * j / m));   // pináculos en los valles
    box(W0, F, u - 0.15, u + 0.15, y1 + 0.55, y1 + 1.5, -0.15, 0.15, uV, KS(), 5);
    box(W1 || W0, F, u - 0.09, u + 0.09, y1 + 1.5, y1 + 1.85, -0.09, 0.09, [64, 110, 92], K.CERAMICA, 5); }
  if (V.vi === 3 && L >= 7 && (run.r === env.lay.portal || run.chaflan)) {   // torreta con chapitel de cerámica
    const w = Math.min(2.6, L * 0.22); P.torreta(env, F, run.chaflan ? L / 2 : L - w / 2 - 0.3, w, y1, 2.6, { col: wc, kw: env.kw, rh: w * 1.2 });
  }
});
const vi2 = V => V.vi === 2;

// ================================================================ EIXAMPLE ORNAMENTADO
pieza('pb_ornamentado', function (env, run, q) {
  const { W0, W1 } = env, F = q.F, top = env.F1, rr = q.rr, sc = env.stone;
  if (q.portal) {                                     // portal monumental: arco alto, recercado de piedra, columnas y cartela
    const w = Math.min(2.4, q.bw - 1.0), h = Math.min(4.2, top - q.gl - 0.55);
    const r = P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w, gl: q.gl, h, yB: q.yB, top, tipo: rr[4] < 0.6 ? 'madera' : 'vidrio', col: sc, kw: KS(), dep: 0.5,
      madera: [[74, 48, 28], [56, 38, 24]][(rr[3] * 2) | 0], met: [40, 40, 38], arco: 1, marco: { col: shade(sc, 1.12), k: KS(), w: 0.26, d: 0.1, W0: true }, rr });
    for (const s of [-1, 1]) { const u = q.c + s * (w / 2 + 0.5);
      box(W0, F, u - 0.17, u + 0.17, q.gl + 0.5, r.yt, 0, 0.3, shade(sc, 1.1), KS(), 7);   // fuste
      box(W0, F, u - 0.25, u + 0.25, q.gl, q.gl + 0.5, 0, 0.38, shade(sc, 1.04), KS(), 7);   // basa
      box(W0, F, u - 0.27, u + 0.27, r.yt, r.yt + 0.3, 0, 0.4, shade(sc, 1.14), KS(), 7); }   // capitel
    box(W0, F, q.c - w / 2 - 0.8, q.c + w / 2 + 0.8, r.yt + 0.3, r.yt + 0.48, 0, 0.45, shade(sc, 1.12), KS(), 7);
    if (W1 && r.yt + 0.48 < top - 0.3) box(W1, F, q.c - 0.45, q.c + 0.45, r.yt + 0.48, Math.min(top - 0.2, r.yt + 1.1), 0, 0.14, shade(sc, 1.08), K.SGRAF, 7);   // cartela
    if (W1) lattice(W1, F, r.tt + 0.05, r.ct - 0.05, r.yt - w / 2 - 0.2, r.yt, -0.46, env.iron, K.IRON, 1);
    return;
  }
  return P.almohadillado(env, run, q, { forja: 1, vert: true, hl: 0.55, sc });
});
pieza('vano_ornamentado', function (env, run, q) {
  const V = q.V, vi = V.vi, rr = q.rr, { W0, W1 } = env, F = run.F;
  if (q.atico) return false;
  if (vi === 0 && q.nb >= 3 && q.W === q.nb >> 1 && !q.top && q.D <= Math.min(3, q.nF - 1)) {
    env.runWall = run.wallC; P.tribuna_piedra(env, F, q.a, q.bw, q.k, q.P, { base: q.D === 1, remate: q.D === Math.min(3, q.nF - 1) }); return; }
  const V0 = env.V; if (q.D === 1) env.V = q.V;       // la barandilla (T.rail) lee env.V: la de la planta noble (balaustres en v1)
  KIT.T.vano(env, run, q); env.V = V0;
  if (q.low) return;
  const g = KIT.medidas(q), uc = shade(env.uV, 1.05);
  if (q.D === 1 && W1) {                              // planta noble: frontón curvo (o triangular) y relieve floral en el dintel
    P.fronton(W0, F, q.c, g.Vw + 0.7, g.yt + 0.25, vi === 1 ? 0.45 : 0.35, 0.24, uc, K.STUCCO, vi !== 3 && q.W % 2 === 0);
    rect(W1, F, g.tt, g.ct, g.yt + 0.02, g.yt + 0.24, 0.17, uc, K.SGRAF); }
  else if (q.D === 2 && W1) box(W1, F, g.tt - 0.15, g.ct + 0.15, g.yt + 0.18, g.yt + 0.3, 0, 0.2, uc, K.STUCCO, 7);
  if (vi === 3 && W1) {                               // esgrafiados: entrepaños y friso bajo el forjado
    const y0 = q.k + 0.35, y1 = q.P - 0.55;
    if (g.tt - q.a > 0.5) rect(W1, F, q.a + 0.15, g.tt - 0.3, y0, y1, 0.015, run.wallC, K.SGRAF);
    if (q.a + q.bw - g.ct > 0.5) rect(W1, F, g.ct + 0.3, q.a + q.bw - 0.15, y0, y1, 0.015, run.wallC, K.SGRAF); }
  if (vi === 1 && q.D === 1 && W1) for (const u of [q.a + 0.2, q.a + q.bw - 0.27]) box(W1, F, u, u + 0.07, q.k - 0.45, q.k - 0.02, 0, 0.55, shade(env.uV, 0.95), KS(), 5);   // ménsulas del balcón corrido
});
pieza('corona_ornamentado', function (env, run, q) {
  const { W0, C, y1, V } = env, F = run.F, L = run.L; if (C <= run.cover) return;
  if (V.coron === 'atico') return false;
  P.cornisa_b2(env, run, q, { vu: 0.85, mens: true, den: true, top: V.vi === 3 ? 'peto' : 'balaustrada' });
  if ((V.vi === 0 || V.vi === 1) && L >= 10 && run.r === env.lay.portal) {   // frontón central sobre la cornisa
    const w = Math.min(L * 0.36, 7); wr(W0, F, L / 2 - w / 2, L / 2 + w / 2, y1 + 0.9, y1 + 1.3, run.wallC, env.kw);
    P.fronton(W0, F, L / 2, w, y1 + 1.3, w * 0.16, 0.3, shade(env.uV, 1.04), K.STUCCO, V.vi === 1); }
  if (V.vi === 2 && L >= 6 && (run.chaflan || run.r === env.lay.portal)) {   // torreta (en el chaflán, centrada; si no, en la esquina)
    const w = Math.min(3.0, L * 0.3); P.torreta(env, F, run.chaflan ? L / 2 : L - w / 2 - 0.3, w, y1 + 0.9, 3.0, { col: run.wallC, kw: env.kw, rh: w * 0.9, roof: [70, 74, 80], rk: K.METAL }); }
});

// ================================================================ EIXAMPLE TEMPRANO
pieza('pb_temprano', function (env, run, q) {
  const { W0, W1 } = env, F = q.F, top = env.F1, rr = q.rr, sc = env.stone;
  if (q.portal) {                                     // portal de madera con picaporte, montante enrejado y recercado de piedra
    const w = Math.min(1.7, q.bw - 0.8), h = Math.min(3.3, top - q.gl - 0.5);
    const r = P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w, gl: q.gl, h, yB: q.yB, top, tipo: 'madera', col: sc, kw: KS(), dep: 0.4,
      madera: [[70, 48, 30], [48, 58, 46], [82, 60, 40]][(rr[3] * 3) | 0], marco: { col: shade(sc, 1.1), k: KS(), w: 0.2, d: 0.06, W0: true }, rr });
    const ym = r.yt - 0.7;
    rect(W0, F, r.tt + 0.03, r.ct - 0.03, ym, r.yt - 0.03, -0.36, [30, 34, 38], K.GLASS);
    lattice(W0, F, r.tt + 0.03, r.ct - 0.03, ym, r.yt - 0.03, -0.34, env.iron, K.IRON, 0);
    box(W0, F, r.tt, r.ct, ym - 0.08, ym, -0.4, -0.3, [60, 42, 28], K.WOOD, 1);
    if (W1) box(W1, F, q.c - 0.06, q.c + 0.06, q.gl + 1.35, q.gl + 1.5, -0.38, -0.32, [170, 140, 80], K.PBR, 7, pbrAux(0.3, 1, 0, 0));   // picaporte
    return;
  }
  return P.almohadillado(env, run, q, { forja: 0, hl: 0.48, sc, h: 2.1 });
});
pieza('vano_temprano', function (env, run, q) {
  if (q.V.vi !== 2 || q.D < 3 || q.low || q.atico) return false;
  KIT.T.vano(env, run, conV(q, { hueco: 'ventana' }));   // chaflán sobrio: de la 3.ª planta arriba, ventanas con antepecho
});
pieza('corona_temprano', function (env, run, q) {
  if (env.C <= run.cover) return;
  if (env.V.coron === 'atico') return false;
  P.cornisa_b2(env, run, q, { vu: 0.55, den: true, mens: false, top: 'barandilla' });
});
// farola de brazo en la esquina del tramo del portal (a la altura del primer piso)
pieza('farola_esquina', function (env, run, q) {
  const { W1, F1 } = env, F = run.F, L = run.L; if (!W1 || run.r !== env.lay.portal || L < 6 || F1 <= run.cover) return;
  const u = L - 0.6, y = Math.max(env.gHi + 3.2, F1 - 0.7);
  box(W1, F, u - 0.08, u + 0.08, y - 0.25, y + 0.25, 0, 0.05, [30, 30, 32], K.METAL, 7);
  box(W1, F, u - 0.025, u + 0.025, y, y + 0.05, 0, 0.75, [30, 30, 32], K.METAL, 7);
  box(W1, F, u - 0.13, u + 0.13, y - 0.42, y - 0.02, 0.55, 0.85, [240, 220, 170], K.LAMP, 7);
  box(W1, F, u - 0.16, u + 0.16, y - 0.02, y + 0.06, 0.52, 0.88, [30, 30, 32], K.METAL, 7);
});
})();
