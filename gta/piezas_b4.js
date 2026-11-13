/* GTA Barcelona · Condal City — PIEZAS del bloque 4 del kit (Fase 2d): neoclásico, barroco (casa gremial), quart de casa,
   gótico civil y casas baratas. Las registra en window.BCN_KIT (kit.js) con pieza(nombre, fn); los estilos (estilos_b4.js) las
   nombran en sus campos pb, pbFr, vano, corona y fachada. Ranuras y su q: cabecera de kit.js.
   Tipos de material propios (rango 192–199): 192 ESGRAFIAT (esgrafiado barroco geométrico de dos capas: rombos, botones y
   frisos de dientes, en el tono del muro) y 193 ENCALAT (cal sobre mampostería: blanco irregular con desconchados);
   acabados V.acab 'esgrafiat' y 'encalat'.
   Piezas de uso general (las pueden usar los demás bloques): dovelas, escudo, farol, toldo_rayas, bar_esquina, mesa_silla.
   Los colores por parcela (quart de casa, casas baratas) se sacan aquí, por vano, con colPar: cada parcela virtual de la
   fachada lleva su color de la paleta del estilo (el vano 0 conserva el del edificio, que es el del volumen lejano). */
(function () {
'use strict';
const KIT = window.BCN_KIT, GEO = window.BCN_GEO;
const { K, regKind, quad, rect, jamb, hpl, box, lattice, shade, pbrAux } = GEO;

regKind('ESGRAFIAT', 192, `
    rough = 0.88;
    vec2 q = P/vec2(0.5, 0.5); vec2 fw = fwidth(q); float far = smoothstep(0.12, 0.45, max(fw.x, fw.y));
    vec2 f = fract(q) - 0.5; float dm = abs(f.x) + abs(f.y);
    float mk = max(smoothstep(0.035, 0.0, abs(dm - 0.36)), smoothstep(0.08, 0.05, length(f)));
    float bd = smoothstep(0.42, 0.44, abs(fract(P.y/1.5) - 0.5));
    mk = mix(mk, step(0.5, fract(P.x/0.18)), bd);
    alb *= mix(0.94, 1.04, vnoise(P*3.0));
    alb = mix(alb*0.82, min(alb*1.2 + vec3(0.03), vec3(1.0)), mix(mk, 0.3, far));`);
regKind('ENCALAT', 193, `
    rough = 0.95;
    float n1 = vnoise(P*vec2(1.3, 1.1)), n2 = vnoise(P*7.0 + 3.1), n3 = vnoise(P*0.35 + 9.7);
    alb *= mix(0.91, 1.04, n1)*mix(1.0, mix(0.95, 1.04, n2), nearF);
    float pe = smoothstep(0.76, 0.84, n3*0.55 + vnoise(P*2.3)*0.45);
    alb = mix(alb, alb*vec3(0.66, 0.6, 0.52), pe*0.65);`);
KIT.acabado('esgrafiat', 192); KIT.acabado('encalat', 193);

const P = KIT.P, pieza = KIT.pieza;
const KS = () => K.FXPIEDRA !== undefined ? K.FXPIEDRA : K.STONE;
const KT = () => K.TEJA !== undefined ? K.TEJA : K.STUCCO;
const wr = (...a) => KIT.T.wr(...a);
const h01 = (a, b) => { let h = Math.imul(a ^ 0x5bd1e995, 0x9e3779b1) ^ Math.imul(b + 0x3c6ef372, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const hx = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const LAMPC = [255, 214, 150], ALU = [168, 170, 168];

const gcd = (a, b) => b ? gcd(b, a % b) : a, STEPS = {};
// color de la parcela virtual g de un tramo: la 0, el del edificio; las demás, de la paleta, sin repetir la vecina
function colPar(env, run, g, pal) {
  if (g === 0) return run.wallC;
  const n = pal.length, S = STEPS[n] || (STEPS[n] = [...Array(n).keys()].filter(s => s > 0 && gcd(s, n) === 1)), st = S[(h01(env.b, 37) * S.length) | 0];
  const i = (((h01(env.b, 31 + run.i) * n) | 0) + g * st) % n;   // paso primo con n: recorre toda la paleta sin repetir la vecina
  return shade(pal[i], 0.94 + h01(env.b, 41 + g + run.i * 8) * 0.1);
}

// ---------------------------------------------------------------- piezas generales
// anillo de dovelas de un arco de medio punto (centro c, arranque ys, radio interior r, grueso t) a profundidad d
pieza('dovelas', function (B, F, c, ys, r, t, d, col, k, n) {
  if (!B) return; n = n || 11;
  for (let i = 0; i < n; i++) { const a0 = Math.PI * (1 - i / n), a1 = Math.PI * (1 - (i + 1) / n), R = r + t, cs = i % 2 ? col : shade(col, 0.92);
    quad(B, F, c + Math.cos(a0) * r, ys + Math.sin(a0) * r, d, c + Math.cos(a1) * r, ys + Math.sin(a1) * r, d,
      c + Math.cos(a1) * R, ys + Math.sin(a1) * R, d, c + Math.cos(a0) * R, ys + Math.sin(a0) * R, d, cs, k); }
});
// escudo heráldico de piedra (campo partido y yelmo), centrado en c con la base del escudo en y; s = escala
pieza('escudo', function (B, F, c, y, s, col) {
  if (!B) return; const w = 0.32 * s, h = 0.5 * s, d = 0.1;
  box(B, F, c - w, c + w, y, y + h, 0, d, col, KS(), 7);
  quad(B, F, c, y - 0.38 * s, d, c + w, y, d, c - w, y, d, c, y - 0.38 * s, d, col, KS());
  rect(B, F, c - w * 0.75, c - 0.02, y + 0.05 * s, y + h * 0.85, d + 0.005, shade(col, 0.84), KS());
  rect(B, F, c + 0.02, c + w * 0.75, y + 0.05 * s, y + h * 0.85, d + 0.005, shade(col, 0.9), KS());
  box(B, F, c - w * 1.2, c + w * 1.2, y + h, y + h + 0.09 * s, 0, d + 0.04, shade(col, 1.05), KS(), 7);
  box(B, F, c - w * 0.45, c + w * 0.45, y + h + 0.09 * s, y + h + 0.38 * s, 0, d + 0.02, shade(col, 0.96), KS(), 7);   // yelmo
});
// farol de forja en brazo (se enciende de noche: K.LAMP), frente a la fachada en u, la base del farol a la altura y
pieza('farol', function (B, F, u, y, iron) {
  if (!B) return; iron = iron || [40, 40, 40];
  box(B, F, u - 0.025, u + 0.025, y + 0.55, y + 0.6, 0, 0.5, iron, K.METAL, 7);
  box(B, F, u - 0.06, u + 0.06, y + 0.35, y + 0.75, 0, 0.04, iron, K.METAL, 7);
  box(B, F, u - 0.12, u + 0.12, y, y + 0.4, 0.38, 0.62, LAMPC, K.LAMP, 7);
  box(B, F, u - 0.16, u + 0.16, y + 0.4, y + 0.5, 0.34, 0.66, iron, K.METAL, 7);
  box(B, F, u - 0.03, u + 0.03, y + 0.5, y + 0.6, 0.47, 0.53, iron, K.METAL, 7);
});
// toldo de lona a rayas (del muro, a altura ya, hasta el vuelo d, a altura yb) con faldón
pieza('toldo_rayas', function (B0, B1, F, u0, u1, ya, yb, d, c1) {
  if (!B0) return; const n = Math.max(3, Math.round((u1 - u0) / 0.26)), w = (u1 - u0) / n;
  for (let i = 0; i < n; i++) { const x0 = u0 + i * w, x1 = x0 + w, cc = i % 2 ? [236, 232, 220] : c1;
    quad(B0, F, x0, ya, 0.02, x1, ya, 0.02, x1, yb, d, x0, yb, d, cc, K.PLAIN);
    if (B1) rect(B1, F, x0, x1, yb - 0.22, yb, d, shade(cc, 0.92), K.PLAIN); }
});
// mesa de terraza con dos sillas (acera), en u, a la cota y, a d de la fachada
pieza('mesa_silla', function (B, F, u, y, d, col) {
  if (!B) return; col = col || [150, 152, 150];
  box(B, F, u - 0.35, u + 0.35, y + 0.72, y + 0.76, d - 0.35, d + 0.35, col, K.METAL, 7);
  box(B, F, u - 0.03, u + 0.03, y, y + 0.72, d - 0.03, d + 0.03, shade(col, 0.6), K.METAL, 4);
  for (const s of [-1, 1]) { const v = u + s * 0.6;
    box(B, F, v - 0.2, v + 0.2, y + 0.42, y + 0.46, d - 0.2, d + 0.2, col, K.METAL, 7);
    box(B, F, s > 0 ? v + 0.17 : v - 0.2, s > 0 ? v + 0.2 : v - 0.17, y + 0.46, y + 0.88, d - 0.2, d + 0.2, col, K.METAL, 7);
    box(B, F, v - 0.02, v + 0.02, y, y + 0.42, d - 0.02, d + 0.02, shade(col, 0.6), K.METAL, 4); }
});
// bar de esquina: puerta y escaparate de vidrio, letrero liso (sin letras), toldo de rayas y una mesa en la acera
const AWN = [[178, 52, 44], [44, 86, 140], [46, 116, 74], [214, 150, 40]], SIGNC = [[150, 40, 36], [36, 70, 110], [230, 226, 214], [40, 90, 60]];
pieza('bar_esquina', function (env, F, q, col) {
  const { W0, W1 } = env, top = env.F1, a = q.a, b = a + q.bw;
  const r = P.puerta(env, F, { a, bw: q.bw, c: q.c, w: Math.max(1.0, q.bw - 0.7), gl: q.gl, h: Math.min(2.6, top - q.gl - 0.75), yB: q.yB, top, tipo: 'vidrio',
    col, kw: env.kw, dep: 0.25, met: [62, 66, 68], rr: q.rr });
  const ys = Math.min(top - 0.08, r.yt + 0.6);
  if (ys - r.yt > 0.3) box(W0, F, a + 0.2, b - 0.2, r.yt + 0.12, ys, 0, 0.08, SIGNC[(h01(env.b, 61) * 4) | 0], K.PBR, 7, pbrAux(0.5, 0.1, 0, 0));
  P.toldo_rayas(W0, W1, F, a + 0.1, b - 0.1, r.yt + 0.08, r.yt - 0.5, 1.5, AWN[(h01(env.b, 62) * 4) | 0]);
  if (W1 && q.rr[4] < 0.75) P.mesa_silla(W1, F, q.c, q.gl, 2.3, [140, 142, 140]);
  return r;
});

// ================================================================ NEOCLÁSICO (1830–1870)
// planta baja de piedra almohadillada, portal con pilastras, entablamento y faroles isabelinos; los demás vanos (si no hay
// comercio), grandes huecos en arco con puertas de madera y montante de reja (antiguos almacenes de Ciutat Vella)
pieza('pb_neoclasico', function (env, run, q) {
  const { W0, W1 } = env, F = q.F, top = env.F1, rr = q.rr, sc = env.stone;
  if (q.portal) {
    const w = Math.min(1.7, q.bw - 0.9), h = Math.min(3.6, top - q.gl - 0.75);
    const r = P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w, gl: q.gl, h, yB: q.yB, top, tipo: 'madera', col: sc, kw: KS(), dep: 0.35,
      madera: [[52, 40, 30], [40, 52, 44], [70, 48, 32]][(rr[3] * 3) | 0], marco: { col: shade(sc, 1.1), k: KS(), w: 0.2, d: 0.08, W0: true }, rr });
    lattice(W1 || W0, F, r.tt + 0.05, r.ct - 0.05, r.yt - 0.75, r.yt - 0.08, -0.32, env.iron, K.IRON, 1);   // montante de reja
    box(W0, F, r.tt - 0.4, r.ct + 0.4, r.yt + 0.2, r.yt + 0.44, 0, 0.24, shade(sc, 1.12), KS(), 7);          // entablamento
    if (W1) for (const u of [r.tt - 0.32, r.ct + 0.14]) box(W1, F, u, u + 0.18, r.yt - 0.3, r.yt + 0.2, 0, 0.2, shade(sc, 1.06), KS(), 7);
    if (q.bw >= w + 2.0 && !q.dep) { P.farol(W0, F, r.tt - 0.65, q.gl + 2.5, env.iron); P.farol(W0, F, r.ct + 0.65, q.gl + 2.5, env.iron); }
    return;
  }
  const w = Math.min(2.2, q.bw - 0.8), h = Math.min(3.9, top - q.gl - 0.5);
  if (h < 2.4 || w < 1.0) return false;
  const r = P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w, gl: q.gl, h, yB: q.yB, top, tipo: 'madera', col: sc, kw: KS(), dep: 0.3,
    madera: shade(env.shutV, 0.8), arco: rr[1] < 0.6 ? 1 : 0.2, rr });
  lattice(W1 || W0, F, r.tt, r.ct, r.yt - Math.min(1.0, w * 0.5), r.yt, -0.27, env.iron, K.IRON, 0);
  if (W1) { for (let y = q.gl + 0.45; y < top - 0.25; y += 0.45) { rect(W1, F, q.a, r.tt - 0.02, y - 0.025, y + 0.025, 0.005, shade(sc, 0.62), KS()); rect(W1, F, r.ct + 0.02, q.a + q.bw, y - 0.025, y + 0.025, 0.005, shade(sc, 0.62), KS()); }
    box(W1, F, q.c - 0.15, q.c + 0.15, r.yt - 0.05, r.yt + 0.35, 0, 0.12, shade(sc, 1.1), KS(), 7); }
});
// relieve alegórico de terracota: marco, fondo, medallón central y dos figuras recostadas
function relieve(B, F, c, w, y0, y1, col) {
  if (!B) return; const fc = shade(col, 1.08), ym = (y0 + y1) / 2, hh = y1 - y0;
  box(B, F, c - w / 2, c + w / 2, y0, y0 + 0.06, 0, 0.07, fc, K.STUCCO, 7); box(B, F, c - w / 2, c + w / 2, y1 - 0.06, y1, 0, 0.07, fc, K.STUCCO, 7);
  box(B, F, c - w / 2, c - w / 2 + 0.06, y0, y1, 0, 0.07, fc, K.STUCCO, 4); box(B, F, c + w / 2 - 0.06, c + w / 2, y0, y1, 0, 0.07, fc, K.STUCCO, 4);
  rect(B, F, c - w / 2 + 0.06, c + w / 2 - 0.06, y0 + 0.06, y1 - 0.06, 0.015, shade(col, 0.86), K.STUCCO);
  const m = Math.min(0.17, hh * 0.32); box(B, F, c - m, c + m, ym - m, ym + m, 0.015, 0.09, fc, K.STUCCO, 7);
  for (const s of [-1, 1]) { const u0 = c + s * (m + 0.06), u1 = c + s * (w / 2 - 0.12), lo = Math.min(u0, u1), hi = Math.max(u0, u1);
    if (hi - lo < 0.15) continue;
    box(B, F, lo, hi, y0 + 0.08, y0 + 0.08 + hh * 0.22, 0.015, 0.075, col, K.STUCCO, 7);
    const hu = s < 0 ? lo + 0.04 : hi - 0.16; box(B, F, hu, hu + 0.12, y0 + 0.08 + hh * 0.2, y0 + 0.08 + hh * 0.38, 0.015, 0.08, col, K.STUCCO, 7); }
}
pieza('vano_neoclasico', function (env, run, q) {
  KIT.T.vano(env, run, q);
  if (q.low) return;
  const g = KIT.medidas(q), vi = q.V.vi, { W0, W1 } = env, F = run.F, uc = shade(env.uV, 1.03);
  if (q.D === 1 && !g.vent) {                         // planta noble: guardapolvo sobre ménsulas y friso
    box(W0, F, g.tt - 0.26, g.ct + 0.26, g.yt + 0.22, g.yt + 0.38, 0, 0.26, uc, K.STUCCO);
    if (W1) { box(W1, F, g.tt - 0.25, g.tt - 0.11, g.yt - 0.25, g.yt + 0.22, 0, 0.2, shade(uc, 0.97), K.STUCCO, 7);
      box(W1, F, g.ct + 0.11, g.ct + 0.25, g.yt - 0.25, g.yt + 0.22, 0, 0.2, shade(uc, 0.97), K.STUCCO, 7);
      rect(W1, F, g.tt, g.ct, g.yt + 0.03, g.yt + 0.2, 0.02, shade(uc, 0.92), K.STUCCO); }
  }
  if (vi === 2 && q.D <= 2) {                         // relieves alegóricos de terracota sobre los huecos
    const y0 = g.yt + (q.D === 1 ? 0.48 : 0.26), y1 = q.P - 0.2;
    if (y1 - y0 >= 0.4) relieve(W1 || W0, F, q.c, Math.min(q.bw - 0.5, g.Vw + 0.7), y0, y1, [[176, 102, 70], [188, 116, 80], [166, 96, 70]][(h01(env.b, 21) * 3) | 0]);
  }
});

// ================================================================ BARROCO (casa gremial, s. XVII–XVIII)
// planta baja: obrador con portalón ancho de madera, dintel grueso de piedra y jambas de sillar
pieza('pb_barroco', function (env, run, q) {
  const { W0, W1 } = env, F = q.F, top = env.F1, rr = q.rr, sc = env.stone;
  const obr = q.portal || rr[0] < 0.45;
  if (!obr) return false;
  const w = Math.min(q.portal ? 1.6 : 2.2, q.bw - 0.5), h = Math.min(2.9, top - q.gl - 0.85);
  if (h < 2.0) return false;
  const r = P.puerta(env, F, { a: q.a, bw: q.bw, c: q.c, w, gl: q.gl, h, yB: q.yB, top, tipo: !q.portal && rr[1] < 0.3 ? 'persiana' : 'madera', col: run.wallC, kw: env.kw, dep: 0.25,
    madera: [[92, 60, 36], [70, 50, 34], [60, 74, 60], [104, 70, 42]][(rr[2] * 4) | 0], met: [[96, 100, 96], [74, 90, 80]][(rr[3] * 2) | 0], rr });
  box(W0, F, r.tt - 0.3, r.ct + 0.3, r.yt, r.yt + 0.42, 0, 0.07, shade(sc, 1.08), KS(), 7);                  // dintel de piedra
  box(W0, F, r.tt - 0.24, r.tt, r.y0 - 0.12, r.yt, 0, 0.05, shade(sc, 1.02), KS(), 4); box(W0, F, r.ct, r.ct + 0.24, r.y0 - 0.12, r.yt, 0, 0.05, shade(sc, 1.02), KS(), 4);
  if (W1 && q.portal) box(W1, F, q.c - 0.14, q.c + 0.14, r.yt + 0.08, r.yt + 0.34, 0.07, 0.1, shade(sc, 0.9), KS(), 7);   // cartela con la fecha (lisa)
});
// golfes: dos ventanitas cuadradas por vano en la última planta, baja
function golfes(env, run, q) {
  const { W0 } = env, F = run.F, h = Math.min(0.62, q.m - 0.75), w = 0.52, st = q.k + (q.m - h) * 0.45, rr = q.rr;
  for (let i = 0; i < 2; i++) { const a = q.a + i * q.bw / 2, b = a + q.bw / 2, c = (a + b) / 2;
    env.windowHole(W0, F, a, b, c - w / 2, c + w / 2, q.k, q.P, st, st + h, 0.22, run.wallC, env.kw, rr[i] < 0.5 ? 0.2 + rr[i + 2] * 0.6 : 0);
    box(W0, F, c - w / 2 - 0.06, c + w / 2 + 0.06, st - 0.06, st, 0, 0.08, env.uV, K.STUCCO); }
}
// hornacina con santo en la esquina: nicho de medio punto con fondo azul, repisa, imagen y farolillo
function hornacina(env, run, q) {
  const { W0, W1 } = env, F = run.F, a = q.a, b = a + q.bw, k = q.k, Pk = q.P, col = run.wallC, kw = env.kw, c = q.c, uV = env.uV;
  const w = 0.72, tt = c - w / 2, ct = c + w / 2, y0 = k + 0.75, yt = Math.min(Pk - 0.35, y0 + 1.55), r = w / 2, ys = yt - r, dp = 0.32;
  wr(W0, F, a, tt, k, Pk, col, kw); wr(W0, F, ct, b, k, Pk, col, kw); wr(W0, F, tt, ct, k, y0, col, kw); wr(W0, F, tt, ct, yt, Pk, col, kw);
  P.arco(W0, F, tt, ct, ys, yt, 0.002, -dp, col, kw, 0);
  rect(W0, F, tt, ct, y0, yt, -dp, [62, 90, 138], K.STUCCO);
  jamb(W0, F, tt, y0, ys, -dp, 0, shade(col, 0.8), kw); jamb(W0, F, ct, y0, ys, -dp, 0, shade(col, 0.8), kw); hpl(W0, F, tt, ct, y0, -dp, 0, shade(col, 0.9), kw);
  box(W0, F, tt - 0.16, ct + 0.16, y0 - 0.2, y0, 0, 0.3, uV, K.STUCCO); box(W0, F, c - 0.16, c + 0.16, y0 - 0.55, y0 - 0.2, 0, 0.2, shade(uV, 0.95), K.STUCCO, 7);
  P.dovelas(W1 || W0, F, c, ys, r, 0.13, 0.03, shade(uV, 1.03), K.STUCCO, 9);
  if (W1) { box(W1, F, tt - 0.13, tt, y0, ys, 0, 0.03, shade(uV, 1.03), K.STUCCO, 4); box(W1, F, ct, ct + 0.13, y0, ys, 0, 0.03, shade(uV, 1.03), K.STUCCO, 4); }
  box(W0, F, c - 0.14, c + 0.14, y0, y0 + 0.82, -0.26, -0.08, [[132, 70, 56], [80, 96, 140], [120, 90, 64]][(h01(env.b, 71) * 3) | 0], K.STUCCO, 7);   // la imagen
  box(W0, F, c - 0.07, c + 0.07, y0 + 0.82, y0 + 0.99, -0.22, -0.1, [222, 196, 170], K.STUCCO, 7);
  if (W1) { box(W1, F, c - 0.12, c + 0.12, y0 + 0.96, y0 + 1.05, -0.3, -0.27, [222, 190, 96], K.PBR, 7, pbrAux(0.3, 1, 0, 0));
    box(W1, F, tt + 0.04, tt + 0.18, y0, y0 + 0.16, -0.22, -0.06, [150, 90, 70], K.STUCCO, 7); box(W1, F, ct - 0.18, ct - 0.04, y0, y0 + 0.16, -0.22, -0.06, [150, 90, 70], K.STUCCO, 7);
    box(W1, F, tt + 0.02, tt + 0.2, y0 + 0.16, y0 + 0.36, -0.24, -0.04, [60, 104, 52], K.LEAF, 7); box(W1, F, ct - 0.2, ct - 0.02, y0 + 0.16, y0 + 0.36, -0.24, -0.04, [176, 50, 60], K.LEAF, 7); }
  box(W0, F, c - 0.02, c + 0.02, yt + 0.12, yt + 0.16, 0, 0.42, env.iron, K.METAL, 7);
  box(W0, F, c - 0.08, c + 0.08, yt - 0.22, yt + 0.06, 0.3, 0.46, LAMPC, K.LAMP, 7);
}
pieza('vano_barroco', function (env, run, q) {
  const vi = q.V.vi;
  if (q.low && vi === 2) { golfes(env, run, q); return; }
  if (vi === 3 && q.D === 1 && run.r === env.lay.portal && q.W === q.nb - 1 && q.nb >= 2) { hornacina(env, run, q); return; }
  return false;
});
// coronación sencilla: cornisa de dos molduras y peto; en el terrado, a veces, el tendedero
pieza('corona_barroco', function (env, run, q) {
  const { W0, W1, C, y1, uV } = env, F = run.F, L = run.L, wc = run.wallC; if (C <= run.cover) return;
  wr(W0, F, 0, L, C, y1 + 0.9, wc, env.kw);
  box(W0, F, 0, L, C + 0.02, C + 0.16, 0, 0.18, uV, K.STUCCO); box(W0, F, 0, L, C + 0.16, C + 0.32, 0, 0.36, shade(uV, 1.04), K.STUCCO);
  box(W0, F, 0, L, y1 + 0.9, y1 + 1.0, -0.03, 0.12, uV, K.STUCCO);
  if (W1 && q.cr < 0.45 && L > 3) { const u0 = 0.4 + q.cr * 2, u1 = Math.min(L - 0.4, u0 + 3.2);
    box(W1, F, u0, u0 + 0.05, y1 + 0.9, y1 + 2.1, -1.05, -1.0, [120, 120, 118], K.METAL, 4); box(W1, F, u1 - 0.05, u1, y1 + 0.9, y1 + 2.1, -1.05, -1.0, [120, 120, 118], K.METAL, 4);
    KIT.T.ropa(W1, F, u0, u1, y1 + 2.05, -1.0, q.cr); }
});

// ================================================================ QUART DE CASA (Barceloneta)
// cada vano de 4,4 m es una parcela (un quart): su color vivo, su puerta y su ventana o bodega en la planta baja, un balcón por
// planta y su bajante; «dos quarts unidos» pinta las parcelas de dos en dos; el remonte cambia de acabado en las últimas plantas
const QPAL = ['#e8b84a', '#d2694c', '#7fb2c9', '#e9d9b7', '#9dc7a4', '#e39a6b', '#f0d27a', '#c95f4a'].map(hx);
const REMC = [[[226, 224, 218], 0], [[204, 200, 192], 0], [[178, 102, 74], 16], [[232, 228, 214], 0]];
const colQ = (env, run, W) => colPar(env, run, env.V.vi === 2 ? W >> 1 : W, QPAL);
const remQ = env => REMC[(h01(env.b, 51) * REMC.length) | 0];
const nRem = (env, nF) => env.V.vi === 1 ? (nF >= 4 ? 2 : 1) : 0;
const bajante = (B, F, u, y0, y1) => { if (B) box(B, F, u - 0.05, u + 0.05, y0, y1, 0, 0.11, [124, 126, 124], K.METAL, 4); };
pieza('pb_quart', function (env, run, q) {
  const { W0, W1 } = env, F = q.F, top = env.F1, rr = q.rr, vi = env.V.vi, a = q.a, b = a + q.bw, col = colQ(env, run, q.W);
  if (vi === 3 && run.r === env.lay.portal && q.W === run.nb - 1 && run.nb >= 2) { P.bar_esquina(env, F, q, col); return; }
  const izq = h01(env.b, 53 + q.W) < 0.5, dw = Math.min(2.0, q.bw * 0.45), d0 = izq ? a : b - dw, s0 = izq ? a + dw : a, s1 = izq ? b : b - dw;
  P.puerta(env, F, { a: d0, bw: dw, c: d0 + dw / 2, w: 0.95, gl: q.gl, h: Math.min(2.3, top - q.gl - 0.5), yB: q.yB, top, tipo: rr[0] < 0.7 ? 'madera' : 'vidrio', col, kw: env.kw, dep: 0.2,
    madera: [[60, 92, 70], [52, 84, 120], [110, 70, 44], [150, 60, 48]][(rr[1] * 4) | 0], met: ALU, rr });
  const c = (s0 + s1) / 2;
  if (rr[2] < 0.3 && s1 - s0 > 1.6) {                 // bodega o tienda pequeña: persiana metálica
    P.puerta(env, F, { a: s0, bw: s1 - s0, c, w: s1 - s0 - 0.5, gl: q.gl, h: Math.min(2.5, top - q.gl - 0.5), yB: q.yB, top, tipo: 'persiana', col, kw: env.kw, dep: 0.15,
      met: [[150, 152, 150], [70, 104, 90], [130, 60, 50]][(rr[3] * 3) | 0] });
  } else {
    const ww = Math.min(1.0, s1 - s0 - 0.7), st = q.gl + 1.05, yt = Math.min(top - 0.45, st + 1.3);
    env.windowHole(W0, F, s0, s1, c - ww / 2, c + ww / 2, q.yB, top, st, yt, 0.22, col, env.kw, rr[4] < 0.6 ? 0.2 + rr[5] * 0.6 : 0);
    lattice(W0, F, c - ww / 2 - 0.04, c + ww / 2 + 0.04, st, yt, 0.06, env.iron, K.IRON, 1);
    box(W0, F, c - ww / 2 - 0.08, c + ww / 2 + 0.08, st - 0.07, st, 0, 0.1, shade(col, 1.06), K.STUCCO);
  }
  if (q.W > 0 && (vi !== 2 || q.W % 2 === 0)) bajante(W1, F, a, q.gl, top);
});
pieza('vano_quart', function (env, run, q) {
  const { W0, W1 } = env, F = run.F, rr = q.rr, nR = nRem(env, q.nF);
  if (q.W > 0 && (env.V.vi !== 2 || q.W % 2 === 0)) bajante(W1, F, q.a, q.k, q.P);
  if (nR && q.D > q.nF - nR) {                       // remonte: otro acabado, ventana de aluminio con persiana enrollable
    const [rc, rk] = remQ(env), e2 = Object.create(env); e2.kw = rk || env.kw;
    if (q.D === q.nF - nR + 1) box(W0, F, q.a, q.a + q.bw, q.k - 0.14, q.k + 0.1, 0, 0.05, [158, 156, 150], 19, 1);
    const bal = q.D === q.nF - nR + 1 && h01(env.b, 55) < 0.6, w = bal ? 1.0 : 1.3, st = bal ? q.k + 0.08 : q.k + 0.95, yt = Math.min(q.P - 0.35, bal ? q.k + 2.15 : st + 1.2);
    P.ventanaPVC(e2, { F, wallC: rc }, q, { w, st, yt, se: 0.15 + rr[1] * 0.6, pc: [222, 220, 212], cajon: true, alf: bal ? null : [206, 204, 198] });
    if (bal) { box(W0, F, q.c - 0.85, q.c + 0.85, q.k - 0.02, q.k + 0.1, 0, 0.7, [190, 188, 182], K.STUCCO, 7); KIT.T.rail(env, F, q.c - 0.85, q.c + 0.85, q.k + 0.1, 0.7, true, true, w); }
    return;
  }
  const col = colQ(env, run, q.W);
  KIT.T.vano(env, col === run.wallC ? run : Object.assign({}, run, { wallC: col }), q);
  if (q.low) return;
  const g = KIT.medidas(q);
  if (g.vent) return;
  if (rr[9] < 0.2) P.toldo_rayas(W0, W1, F, g.tt - 0.2, g.ct + 0.2, q.P - 0.1, q.P - 0.85, g.jt - 0.08, AWN[(h01(env.b, 57 + q.W) * 4) | 0]);
  else if (W1 && rr[10] < 0.07) {                    // bandera colgada de la barandilla (senyera o de color liso)
    const u0 = q.c - 0.42, u1 = q.c + 0.42, y0 = q.k + 0.2, y1 = q.k + 1.0, d = g.jt + 0.05;
    if (rr[11] < 0.6) { rect(W1, F, u0, u1, y0, y1, d, [232, 192, 44], K.PLAIN);
      for (let i = 1; i < 9; i += 2) rect(W1, F, u0, u1, y0 + (y1 - y0) * i / 9, y0 + (y1 - y0) * (i + 1) / 9, d + 0.005, [196, 40, 40], K.PLAIN); }
    else rect(W1, F, u0, u1, y0, y1, d, [[40, 90, 160], [200, 60, 60], [60, 140, 90]][(rr[11] * 7 | 0) % 3], K.PLAIN);
  }
});
pieza('corona_quart', function (env, run, q) {
  const { W0, W1, C, y1, uV } = env, F = run.F, L = run.L; if (C <= run.cover) return;
  const rem = nRem(env, env.nF) > 0 ? remQ(env) : null;
  for (let W = 0; W < q.nb; W++) { const a = W * q.bw, b = a + q.bw, col = rem ? rem[0] : colQ(env, run, W), kw = rem && rem[1] ? rem[1] : env.kw;
    wr(W0, F, a, b, C, y1 + 0.9, col, kw);
    box(W0, F, a, b, C + 0.05, C + 0.2, 0, 0.12, rem ? [190, 188, 182] : uV, K.STUCCO);
    box(W0, F, a, b, y1 + 0.9, y1 + 1.0, -0.03, 0.12, rem ? [170, 172, 170] : shade(col, 1.08), K.STUCCO);
    if (W > 0 && (env.V.vi !== 2 || W % 2 === 0)) bajante(W1, F, a, C, y1 + 0.9);
    if (W1 && h01(env.b, 63 + W + run.i * 8) < 0.55) { const u0 = a + 0.4, u1 = b - 0.4;   // tendedero del terrado
      box(W1, F, u0, u0 + 0.05, y1 + 0.9, y1 + 2.05, -1.05, -1.0, [120, 120, 118], K.METAL, 4); box(W1, F, u1 - 0.05, u1, y1 + 0.9, y1 + 2.05, -1.05, -1.0, [120, 120, 118], K.METAL, 4);
      KIT.T.ropa(W1, F, u0, u1, y1 + 2.0, -1.0, h01(env.b, 65 + W)); } }
});

// ================================================================ GÓTICO CIVIL (s. XIII–XVI)
// portalón de medio punto con dovelas grandes; el del palacio, abierto: el zaguán y la escalera del patio al fondo
pieza('pb_gotico', function (env, run, q) {
  const { W0, W1 } = env, F = q.F, top = env.F1, rr = q.rr, vi = env.V.vi, a = q.a, b = a + q.bw, col = run.wallC, kw = env.kw;
  const sc = shade(env.stone, 1.12);
  if (!q.portal) {
    if (rr[0] < (vi === 3 ? 0.7 : 0.3)) { wr(W0, F, a, b, q.yB, top, col, kw); return; }   // muro ciego
    if (vi === 3 || rr[1] < 0.5) {                    // ventanuco alto con reja
      const w = 0.6 + rr[2] * 0.25, c = q.c + (rr[3] - 0.5) * Math.max(0, q.bw - w - 1.2), st = Math.min(top - 1.4, q.gl + 2.1), yt = Math.min(top - 0.4, st + 0.9);
      if (yt - st < 0.5) return false;
      env.windowHole(W0, F, a, b, c - w / 2, c + w / 2, q.yB, top, st, yt, 0.4, col, kw, 0);
      lattice(W0, F, c - w / 2, c + w / 2, st, yt, -0.1, env.iron, K.IRON, 1);
      box(W0, F, c - w / 2 - 0.1, c + w / 2 + 0.1, st - 0.1, st, 0, 0.08, sc, KS()); return;
    }
    return false;
  }
  const big = vi === 0, w = Math.min(big ? 3.0 : 2.3, q.bw - 0.9), r = w / 2, y0 = q.gl + 0.12, tt = q.c - r, ct = q.c + r;
  const yt = Math.min(top - 0.75, y0 + (big ? 4.3 : 3.6)), ys = yt - r, dep = big ? 3.6 : 0.4;
  if (ys < y0 + 1.7) return false;
  wr(W0, F, a, tt, q.yB, top, col, kw); wr(W0, F, ct, b, q.yB, top, col, kw); wr(W0, F, tt, ct, yt, top, col, kw);
  P.arco(W0, F, tt, ct, ys, yt, 0.002, -0.7, col, kw, 0);
  jamb(W0, F, tt, y0, ys, -dep, 0, shade(col, 0.72), kw); jamb(W0, F, ct, y0, ys, -dep, 0, shade(col, 0.72), kw);
  hpl(W0, F, tt, ct, y0, -dep, 0, [150, 144, 132], KS());
  P.dovelas(W0, F, q.c, ys, r, 0.52, 0.03, sc, KS(), big ? 13 : 11);
  box(W0, F, tt - 0.5, tt, y0 - 0.12, ys, 0, 0.03, shade(sc, 0.97), KS(), 4); box(W0, F, ct, ct + 0.5, y0 - 0.12, ys, 0, 0.03, shade(sc, 0.97), KS(), 4);
  if (big) {                                          // zaguán abierto: bóveda plana, hojas abiertas, patio soleado y escalera
    const yc = ys + r * 0.92;
    hpl(W0, F, tt, ct, yc, -dep, -0.7, shade(col, 0.5), kw); jamb(W0, F, tt, ys, yc, -dep, -0.7, shade(col, 0.7), kw); jamb(W0, F, ct, ys, yc, -dep, -0.7, shade(col, 0.7), kw);
    const wd = [72, 52, 34];
    jamb(W0, F, tt + 0.08, y0, ys + 0.2, -1.4, -0.4, wd, K.WOOD); jamb(W0, F, ct - 0.08, y0, ys + 0.2, -1.4, -0.4, wd, K.WOOD);
    rect(W0, F, tt, ct, y0, yc, -dep, shade(col, 1.04), kw);
    const n = 8, sw = (w - 0.3) / n;
    for (let i = 0; i < n; i++) box(W0, F, tt + 0.15 + i * sw, ct - 0.1, y0 + i * 0.22, y0 + (i + 1) * 0.22, -dep, -dep + 1.0, shade(col, 1.12), kw, 1);
  } else {                                            // portalón de madera claveteado con postigo
    const d = -dep + 0.02, wd = [[78, 54, 34], [60, 42, 28], [88, 64, 40]][(rr[2] * 3) | 0];
    rect(W0, F, tt, ct, y0, yt, d, wd, K.WOOD);
    if (W1) { for (const f of [0.18, 0.45, 0.72]) box(W1, F, tt, ct, y0 + (ys - y0) * f, y0 + (ys - y0) * f + 0.06, d, d + 0.03, [42, 40, 38], K.METAL, 1);
      box(W1, F, q.c - 0.03, q.c + 0.03, y0, yt, d, d + 0.04, shade(wd, 0.7), K.WOOD, 4);
      box(W1, F, tt + 0.25, tt + 0.29, y0, y0 + 1.75, d, d + 0.03, shade(wd, 0.7), K.WOOD, 4); box(W1, F, tt + 0.25, q.c - 0.25, y0 + 1.75, y0 + 1.79, d, d + 0.03, shade(wd, 0.7), K.WOOD, 1); }
  }
  if (vi === 0 || vi === 3) P.escudo(W0, F, q.c, Math.min(top + 1.4, yt + 1.2), vi === 3 ? 2.1 : 1.6, sc);
  if (!q.dep && q.bw >= w + 1.6) P.farol(W1 || W0, F, ct + 0.55, Math.min(top - 0.6, q.gl + 3.0), env.iron);
});
// ventana geminada: dos luces de medio punto con columnita y capitel, alféizar de piedra
function geminada(env, run, q) {
  const { W0, W1 } = env, F = run.F, c = q.c, k = q.k, Pk = q.P, col = run.wallC, kw = env.kw, sc = shade(env.stone, 1.08);
  const w = Math.min(1.5, q.bw - 1.0), tt = c - w / 2, ct = c + w / 2, st = k + 0.85, yt = Math.min(Pk - 0.35, st + 2.2), m = 0.07, r = (w / 2 - m) / 2, ys = yt - r;
  env.windowHole(W0, F, q.a, q.a + q.bw, tt, ct, k, Pk, st, yt, 0.32, col, kw, q.rr[0] < 0.5 ? 0.15 + q.rr[1] * 0.3 : 0);
  P.arco(W0, F, tt, c - m, ys, yt, 0.004, -0.3, col, kw, 0); P.arco(W0, F, c + m, ct, ys, yt, 0.004, -0.3, col, kw, 0);
  rect(W0, F, c - m, c + m, ys, yt, 0.004, col, kw);
  box(W0, F, c - 0.06, c + 0.06, st, ys - 0.13, -0.24, -0.1, sc, KS(), 4);
  box(W0, F, c - 0.14, c + 0.14, ys - 0.15, ys + 0.01, -0.28, -0.04, shade(sc, 1.05), KS(), 7);
  box(W0, F, c - 0.1, c + 0.1, st, st + 0.1, -0.27, -0.07, sc, KS(), 7);
  box(W0, F, tt - 0.16, ct + 0.16, st - 0.12, st, 0, 0.14, sc, KS());
  if (W1) { P.dovelas(W1, F, (tt + c - m) / 2, ys, r, 0.1, 0.02, sc, KS(), 5); P.dovelas(W1, F, (c + m + ct) / 2, ys, r, 0.1, 0.02, sc, KS(), 5); }
}
// galería de arcos del último piso: antepecho, arquería sobre columnitas y la logia en sombra
function galeriaArcos(env, run, q) {
  const { W0, W1 } = env, F = run.F, a = q.a, b = a + q.bw, k = q.k, Pk = q.P, col = run.wallC, kw = env.kw, sc = shade(env.stone, 1.08);
  const yp = k + 0.95, dp = 1.4, n = Math.max(2, Math.round(q.bw / 1.05)), sw = q.bw / n, r = (sw - 0.16) / 2, ys = Pk - 0.3 - r;
  if (ys < yp + 0.9) return false;
  wr(W0, F, a, b, k, yp, col, kw); box(W0, F, a, b, yp, yp + 0.1, 0, 0.1, sc, KS(), 1);
  rect(W0, F, a, b, yp + 0.1, Pk, -dp, shade(col, 0.42), K.STUCCO);
  hpl(W0, F, a, b, yp + 0.1, -dp, 0, shade(col, 0.7), K.STUCCO); hpl(W0, F, a, b, Pk - 0.02, -dp, -0.35, shade(col, 0.36), K.STUCCO);
  if (q.W === 0) jamb(W0, F, a, yp, Pk, -dp, 0, shade(col, 0.6), kw);
  if (q.W === q.nb - 1) jamb(W0, F, b, yp, Pk, -dp, 0, shade(col, 0.6), kw);
  for (let i = 0; i < n; i++) { const u0 = a + i * sw + 0.08, u1 = u0 + sw - 0.16;
    P.arco(W0, F, u0, u1, ys, Pk, 0.002, -0.35, col, kw, 0);
    const us = [a + i * sw]; if (i === n - 1) us.push(b);
    for (const u of us) { const e0 = Math.max(a, u - 0.08), e1 = Math.min(b, u + 0.08);
      box(W0, F, e0, e1, yp + 0.1, ys, -0.24, -0.08, sc, KS(), 4); if (W1) box(W1, F, e0 - 0.04, e1 + 0.04, ys - 0.14, ys, -0.28, -0.04, shade(sc, 1.05), KS(), 7); } }
}
pieza('vano_gotico', function (env, run, q) {
  const vi = q.V.vi, rr = q.rr, { W0, W1 } = env, F = run.F, a = q.a, b = a + q.bw, k = q.k, Pk = q.P, col = run.wallC, kw = env.kw;
  if (vi === 2 && q.top && q.nF >= 2 && galeriaArcos(env, run, q) !== false) return;
  const portalBay = run.N >= 0 && q.W === run.N && q.D === 1 && (vi === 0 || vi === 3);
  const gem = vi === 0 ? q.D === 1 && q.W % 2 === 0 : vi === 1 ? q.W === (q.nb >> 1) : vi === 2 ? q.D === 1 && rr[2] < 0.45 : q.D === 1 && q.W === (q.nb >> 1);
  if (portalBay || (!gem && rr[0] < [0.25, 0.35, 0.3, 0.72][vi])) { wr(W0, F, a, b, k, Pk, col, kw); return; }
  if (gem && q.bw >= 2.6 && q.m >= 3.0) { geminada(env, run, q); return; }
  const w = 0.75 + rr[1] * 0.4, h = 1.15 + rr[3] * 0.65, c = q.c + (rr[4] - 0.5) * Math.max(0, q.bw - w - 1.1);
  const st = k + 0.75 + rr[5] * 0.45, yt = Math.min(Pk - 0.4, st + h), sc = shade(env.stone, 1.08);
  if (yt - st < 0.5) { wr(W0, F, a, b, k, Pk, col, kw); return; }
  env.windowHole(W0, F, a, b, c - w / 2, c + w / 2, k, Pk, st, yt, 0.36, col, kw, rr[6] < 0.5 ? 0.3 + rr[7] * 0.5 : 0);
  box(W0, F, c - w / 2 - 0.12, c + w / 2 + 0.12, st - 0.1, st, 0, 0.1, sc, KS());
  if (W1) { box(W1, F, c - w / 2 - 0.12, c - w / 2, st, yt + 0.12, 0, 0.05, sc, KS(), 4); box(W1, F, c + w / 2, c + w / 2 + 0.12, st, yt + 0.12, 0, 0.05, sc, KS(), 4);
    box(W1, F, c - w / 2 - 0.12, c + w / 2 + 0.12, yt, yt + 0.16, 0, 0.06, sc, KS(), 7);
    if (q.D === 1 && rr[8] < 0.35) lattice(W1, F, c - w / 2, c + w / 2, st, yt, 0.04, env.iron, K.IRON, 1); }
});
// coronación: cornisa de piedra sobre canecillos y gárgolas (palacio, muro ciego) o alero de madera con canto de teja
pieza('corona_gotico', function (env, run, q) {
  const { W0, W1, C, y1, V } = env, F = run.F, L = run.L, wc = run.wallC, kw = env.kw, sc = shade(env.stone, 1.06); if (C <= run.cover) return;
  if (V.vi === 1 || V.vi === 2) {
    const ov = V.vi === 2 ? 1.0 : 0.7, wd = shade(env.wood, 0.9);
    wr(W0, F, 0, L, C, y1 + 0.2, wc, kw);
    hpl(W0, F, 0, L, y1 + 0.2, 0, ov, wd, K.WOOD);
    box(W0, F, -0.05, L + 0.05, y1 + 0.2, y1 + 0.4, 0, ov + 0.05, [150, 74, 50], K.STUCCO, 1);
    lattice(W0, F, -0.05, L + 0.05, y1 + 0.2, y1 + 0.4, ov + 0.05, [146, 70, 46], K.BAL, 0);
    if (W1) for (let u = 0.25; u < L - 0.1; u += 0.55) box(W1, F, u, u + 0.1, y1 + 0.02, y1 + 0.2, 0, ov - 0.08, wd, K.WOOD, 6);
    return;
  }
  wr(W0, F, 0, L, C, y1 + 0.75, wc, kw);
  if (W1) for (let u = 0.3; u < L - 0.2; u += 0.85) box(W1, F, u, u + 0.16, C + 0.06, C + 0.3, 0, 0.3, sc, KS(), 7);
  box(W0, F, 0, L, C + 0.3, C + 0.48, 0, 0.38, sc, KS());
  box(W0, F, 0, L, y1 + 0.75, y1 + 0.85, -0.03, 0.1, sc, KS());
  if (L > 4) for (const u of [0.7, L - 0.7]) { box(W0, F, u - 0.1, u + 0.1, C + 0.33, C + 0.47, 0.38, 1.0, shade(sc, 0.9), KS(), 7);
    box(W0, F, u - 0.13, u + 0.13, C + 0.22, C + 0.52, 0.95, 1.2, shade(sc, 0.86), KS(), 7); }
});

// ================================================================ CASAS BARATAS (hileras obreras, 1929–1950)
// cada casita son dos vanos (puerta y ventana) con su color o su cal, su zócalo pintado y la junta entre casas; tejado bajo de
// teja a una o dos aguas; la reformada lleva un piso de ladrillo con ventana de aluminio
const CBPAL = { cal: ['#f2ece0', '#f6f2ea', '#ece4d4', '#f0eadc'].map(hx), color: ['#f2ece0', '#e8d9bf', '#d9c7a8', '#c9d6c8', '#e6c9a0', '#cfdbe0', '#efd9c9'].map(hx) };
const SOCOL = [[118, 120, 118], [150, 112, 80], [92, 112, 140], [160, 150, 130], [96, 120, 96]];
const colCB = (env, run, W) => colPar(env, run, W >> 1, env.V.vi === 0 || env.V.vi === 2 ? CBPAL.cal : CBPAL.color);
const PUERTA_CB = [[60, 92, 70], [52, 84, 120], [110, 70, 44], [150, 60, 48], [70, 70, 72]];
pieza('pb_casas_baratas', function (env, run, q) {
  const { W0, W1 } = env, F = q.F, top = env.F1, rr = q.rr, vi = env.V.vi, nb = run.nb, a = q.a, b = a + q.bw, col = colCB(env, run, q.W), kw = env.kw;
  if (vi === 3 && run.r === env.lay.portal && q.W === nb - 1 && nb >= 2) { P.bar_esquina(env, F, q, col); return; }
  const h = q.W >> 1, so = SOCOL[(h01(env.b, 81 + h + run.i * 16) * SOCOL.length) | 0], zh = q.gl + 0.75;
  const esPuerta = q.portal || (q.W % 2) === (h01(env.b, 83) < 0.5 ? 0 : 1);
  if (esPuerta) {
    const r = P.puerta(env, F, { a, bw: q.bw, c: q.c, w: Math.min(0.92, q.bw - 0.6), gl: q.gl, h: Math.min(2.15, top - q.gl - 0.4), yB: q.yB, top, tipo: rr[0] < 0.8 ? 'madera' : 'vidrio',
      col, kw, dep: 0.14, madera: PUERTA_CB[(h01(env.b, 85 + h) * PUERTA_CB.length) | 0], met: ALU, rr });
    rect(W1 || W0, F, a, r.tt - 0.01, q.gl, zh, 0.012, so, K.STUCCO); rect(W1 || W0, F, r.ct + 0.01, b, q.gl, zh, 0.012, so, K.STUCCO);
    box(W0, F, r.tt - 0.1, r.ct + 0.1, q.gl, q.gl + 0.12, 0, 0.3, [164, 160, 152], KS(), 7);
    if (W1 && !q.dep && rr[2] < 0.2) { const u = r.ct + 0.45, d = 0.55, cc = [[200, 196, 186], [120, 90, 60], [70, 110, 80]][(rr[3] * 3) | 0];   // silla en la acera
      box(W1, F, u - 0.2, u + 0.2, q.gl + 0.42, q.gl + 0.46, d - 0.2, d + 0.2, cc, K.PLAIN, 7); box(W1, F, u - 0.2, u + 0.2, q.gl + 0.46, q.gl + 0.9, d - 0.2, d - 0.16, cc, K.PLAIN, 7);
      box(W1, F, u - 0.02, u + 0.02, q.gl, q.gl + 0.42, d - 0.02, d + 0.02, shade(cc, 0.6), K.PLAIN, 4); }
  } else {
    const ww = Math.min(0.95, q.bw - 0.9), tt = q.c - ww / 2, ct = q.c + ww / 2, st = q.gl + 1.0, yt = Math.min(top - 0.4, st + 1.15);
    if (yt - st < 0.5) return false;
    env.windowHole(W0, F, a, b, tt, ct, q.yB, top, st, yt, 0.18, col, kw, rr[1] < 0.6 ? 0.2 + rr[3] * 0.5 : 0);
    lattice(W0, F, tt - 0.05, ct + 0.05, st, yt, 0.06, env.iron, K.IRON, 1);
    box(W0, F, tt - 0.08, ct + 0.08, st - 0.06, st, 0, 0.1, [214, 210, 200], K.STUCCO);
    rect(W1 || W0, F, a, b, q.gl, zh, 0.012, so, K.STUCCO);
    if (rr[4] < 0.5 && q.bw - ww > 1.1) { const sh = shade(env.shutV, 1.0), lw = Math.min(0.46, (q.bw - ww) / 2 - 0.1);
      rect(W0, F, tt - lw - 0.03, tt - 0.03, st, yt, 0.04, sh, K.SHUT); rect(W0, F, ct + 0.03, ct + lw + 0.03, st, yt, 0.04, sh, K.SHUT); }
    if (W1 && rr[5] < 0.45) KIT.T.planter(W1, F, q.c - 0.2 + rr[2] * 0.3, 0.08, st, rr[5], rr[2], rr[3]);
  }
  if (q.W > 0 && q.W % 2 === 0) box(W0, F, a - 0.06, a + 0.06, q.gl, top, 0, 0.05, shade(col, 0.96), K.STUCCO, 4);
  if (env.nF === 0 && top - q.gl > 3.4) {            // casita de una planta con el muro alto: cenefa pintada y respiradero de la cambra
    rect(W1 || W0, F, a, b, q.gl + 2.62, q.gl + 2.78, 0.012, so, K.STUCCO);
    const yv = Math.min(top - 0.75, q.gl + 3.35);
    if (!esPuerta && top - yv > 0.6) { rect(W0, F, q.c - 0.28, q.c + 0.28, yv, yv + 0.32, 0.006, [46, 42, 38], K.STUCCO);
      lattice(W1 || W0, F, q.c - 0.28, q.c + 0.28, yv, yv + 0.32, 0.02, [200, 196, 188], K.BAL, 0);
      box(W0, F, q.c - 0.34, q.c + 0.34, yv - 0.05, yv, 0, 0.06, [214, 210, 200], K.STUCCO, 7); }
  }
});
// patio delantero: murete encalado con su albardilla, cancela de hierro en la puerta de cada casa y plantas detrás
pieza('cb_patio', function (env, run, q) {
  const { W0, W1 } = env, F = run.F, a = q.a, b = a + q.bw, g = q.gl, col = colCB(env, run, q.W), kw = env.kw;
  const puerta = (q.W % 2) === (h01(env.b, 83) < 0.5 ? 0 : 1);
  if (puerta) { const c = (a + b) / 2, w = 0.95;
    wr(W0, F, a, c - w / 2, q.yB, g + 1.1, col, kw); wr(W0, F, c + w / 2, b, q.yB, g + 1.1, col, kw);
    box(W0, F, a, c - w / 2, g + 1.1, g + 1.18, -0.2, 0.04, [200, 196, 188], K.STUCCO, 7); box(W0, F, c + w / 2, b, g + 1.1, g + 1.18, -0.2, 0.04, [200, 196, 188], K.STUCCO, 7);
    lattice(W0, F, c - w / 2, c + w / 2, g + 0.05, g + 1.2, -0.08, env.iron, K.IRON, 0);
    hpl(W0, F, c - w / 2, c + w / 2, g + 0.04, -q.dep, 0, [168, 160, 150], KS());
    return; }
  wr(W0, F, a, b, q.yB, g + 1.1, col, kw); box(W0, F, a, b, g + 1.1, g + 1.18, -0.2, 0.04, [200, 196, 188], K.STUCCO, 7);
  if (q.W > 0 && q.W % 2 === 0) box(W0, F, a - 0.08, a + 0.08, q.yB, g + 1.3, -0.2, 0.06, shade(col, 0.95), K.STUCCO, 7);
  const r = h01(env.b, 91 + q.W);
  box(W1 || W0, F, a + 0.3, b - 0.3, g + 0.8, g + 1.5 + r * 0.6, -1.5, -0.5, [58 + (q.W % 2) * 12, 94, 52], K.LEAF, 7);
  if (W1 && r < 0.5) box(W1, F, a + 0.5 + r, a + 0.8 + r, g + 1.18, g + 1.42, -0.15, 0.0, [170, 92, 64], K.STUCCO, 7);   // maceta en el murete
});
pieza('vano_casas_baratas', function (env, run, q) {
  const vi = q.V.vi, rr = q.rr;
  if (vi === 1) {                                     // piso añadido: ladrillo o revoco gris, ventana de aluminio con cajón
    const br = h01(env.b, 87) < 0.6, e2 = Object.create(env); e2.kw = br ? 16 : env.kw;
    const wc = br ? [176, 100, 72] : [206, 202, 194];
    P.ventanaPVC(e2, { F: run.F, wallC: wc }, q, { w: Math.min(1.2, q.bw - 0.8), st: q.k + 0.95, yt: Math.min(q.P - 0.35, q.k + 2.15), se: 0.15 + rr[1] * 0.6,
      pc: [222, 220, 212], cajon: true, alf: [200, 196, 188] });
    if (q.W > 0 && q.W % 2 === 0) box(env.W1, run.F, q.a - 0.05, q.a + 0.05, q.k, q.P, 0, 0.11, [124, 126, 124], K.METAL, 4);
    return;
  }
  const col = colCB(env, run, q.W);
  KIT.T.vano(env, col === run.wallC ? run : Object.assign({}, run, { wallC: col }), q);
});
pieza('corona_casas_baratas', function (env, run, q) {
  const { W0, W1, C, y1, V } = env, F = run.F, L = run.L, kw = env.kw; if (C <= run.cover) return;
  if (V.vi === 1) {                                   // terrado del piso añadido: peto de ladrillo y antenas
    const br = h01(env.b, 87) < 0.6, wc = br ? [176, 100, 72] : [206, 202, 194];
    wr(W0, F, 0, L, C, y1 + 0.9, wc, br ? 16 : kw); box(W0, F, 0, L, y1 + 0.9, y1 + 1.0, -0.03, 0.12, [190, 188, 182], K.STUCCO);
    if (W1 && L > 4) { const u = 1 + h01(env.b, 89) * (L - 2); box(W1, F, u, u + 0.05, y1 + 1.0, y1 + 3.2, -1.2, -1.15, [128, 128, 126], K.METAL, 4);
      for (const f of [0.6, 0.85]) box(W1, F, u - 0.45, u + 0.5, y1 + 1.0 + 2.2 * f, y1 + 1.03 + 2.2 * f, -1.2, -1.17, [120, 120, 118], K.METAL, 7); }
    return;
  }
  const yE = y1 + 0.9, ov = 0.42, dR = 2.4, yR = yE + 1.25, dos = V.vi === 2;   // alero a la altura del peto de los demás (tapa el de rooftops.js), ~27°
  const tile = [[170, 84, 58], [150, 78, 56], [182, 98, 66]][(h01(env.b, 9) * 3) | 0];
  for (let W = 0; W < q.nb; W++) wr(W0, F, W * q.bw, (W + 1) * q.bw, C, yE, colCB(env, run, W), kw);
  const c0 = colCB(env, run, 0);
  quad(W0, F, -0.05, yE - 0.07, ov, L + 0.05, yE - 0.07, ov, L + 0.05, yR, -dR, -0.05, yR, -dR, tile, KT());
  box(W0, F, -0.05, L + 0.05, yE - 0.17, yE - 0.03, 0, ov, shade(tile, 0.82), K.STUCCO, 2);
  if (dos) quad(W0, F, -0.05, yR, -dR, L + 0.05, yR, -dR, L + 0.05, yE, -2 * dR, -0.05, yE, -2 * dR, shade(tile, 0.95), KT());
  else rect(W0, F, 0, L, yE, yR, -dR, shade(c0, 0.9), K.STUCCO);
  const db = dos ? -2 * dR : -dR;
  for (const u of [0, L]) quad(W0, F, u, yE, 0, u, yE, db, u, yR, -dR, u, yR, -dR, shade(c0, 0.92), kw);
  if (h01(env.b, 93) < 0.45 && L > 3) { const u = 0.8 + h01(env.b, 95) * (L - 1.8);   // chimenea
    box(W0, F, u, u + 0.42, yR - 0.5, yR + 0.55, -dR - 0.2, -dR + 0.22, shade(c0, 0.95), K.STUCCO, 7);
    box(W0, F, u - 0.05, u + 0.47, yR + 0.55, yR + 0.62, -dR - 0.25, -dR + 0.27, [150, 146, 140], K.STUCCO, 7); }
});
})();
