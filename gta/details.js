/* GTA Barcelona — Detalle de fachada por encima de la planta baja (hook de facades.js).
   Faja sobre la planta baja, plantas de pisos (ventanas con derrame, carpinterías, porticones, recercados, balcones de
   forja, pilastras, esgrafiados, tribunas, ventanas de patio), coronación (cornisa, balaustrada, peto) y los tramos
   lisos y ciegos (medianeras).
   window.BCN_DETAILS = { init(ctx) → { floors(env, run), crown(env, run), plainRun(env, run), blindRun(env, run) } }.
   Contrato de env/run: DESARROLLO.md §6. Tipos de material propios: ids 40–59, con BCN_GEO.regKind() al cargar el script. */
(function () {
'use strict';
const { K, rect, jamb, box, lattice, latticeSide, shade, mixc, R } = window.BCN_GEO;

window.BCN_DETAILS = { init(ctx) {
  // ---------------------------------------------------------------- tramo ciego: medianera tapada por un vecino igual o más alto
  function blindRun(env, run) {
    const { W0, d, p, u, y0 } = env, { F, L, cover } = run;
    rect(W0, F, 0, L, Math.max(y0, cover - 0.5), d.y1 + 0.35, 0, shade(p, 0.86), K.STUCCO);
    box(W0, F, 0, L, d.y1 + 0.35, d.y1 + 0.45, -0.03, 0.08, u, K.STUCCO);
  }
  // ---------------------------------------------------------------- tramo liso: demasiado corto para abrir huecos
  function plainRun(env, run) {
    const { W0, d, p, u, y0, F1, C } = env, { F, L } = run;
    rect(W0, F, 0, L, y0, C, 0, p, K.STUCCO);
    rect(W0, F, 0, L, C, d.y1 + 0.9, 0, p, K.STUCCO);
    box(W0, F, 0, L, F1 - 0.22, F1 + 0.1, 0, 0.3, u, K.STUCCO);
    box(W0, F, 0, L, C, C + 0.4, 0, 0.5, u, K.STUCCO);
    box(W0, F, 0, L, d.y1 + 0.9, d.y1 + 1.0, -0.03, 0.2, u, K.STUCCO);
  }

  // ---------------------------------------------------------------- faja y plantas de pisos de un tramo (de calle o de patio)
  // Consume SIEMPRE 7 números de azar por vano y planta, se dibuje o no.
  function floors(env, run) {
    const { W0, W1, p, u, stone, shut, wood, glass, iron, style, porticones, F1, nF, m, y0, windowHole } = env;
    const { F, L, cover, street, nb, bw, M, wallC } = run;
    // faja sobre la planta baja
    if (F1 > cover) box(W0, F, 0, L, F1 - 0.22, F1 + 0.1, 0, street ? 0.3 : 0.12, u, K.STUCCO);

    // --- plantas de pisos
    for (let D = 1; D <= nF; D++) {
      const k = F1 + (D - 1) * m, P = k + m, U = D === nF;
      if (P <= cover + 0.2) { for (let W = 0; W < nb; W++) { R(); R(); R(); R(); R(); R(); R(); } continue; }
      if (D > 1) box(W0, F, 0, L, k - 0.14, k + 0.05, 0, street ? 0.16 : 0.08, u, K.STUCCO);
      for (let W = 0; W < nb; W++) {
        const a = W * bw, c = a + bw / 2;
        const rr = [R(), R(), R(), R(), R(), R(), R()];
        if (k < cover) { rect(W0, F, a, a + bw, Math.max(y0, cover - 0.3), P, 0, wallC, K.STUCCO); continue; }
        if (!street) { yardWin(env, W0, W1, F, a, bw, c, k, P, wallC, u, rr); continue; }
        if (W === M && D <= 3 && !U) { tribuna(W0, W1, F, a, bw, k, P, p, u, wood, glass); continue; }
        const Vw = Math.min(1.3, bw - 0.95), Bh = U ? Math.min(1.7, m - 1.15) : Math.min(2.45, m - 0.72), Q = U ? Math.min(0.85, m - Bh - 0.32) : 0.08;
        const tt = c - Vw / 2, ct = c + Vw / 2, st = k + Q, yt = st + Bh;
        const se = rr[0] < 0.75 ? 0.15 + rr[1] * 0.6 : 0;
        windowHole(W0, F, a, a + bw, tt, ct, k, P, st, yt, 0.32, p, K.STUCCO, se);
        // carpintería
        const qt = yt - se * Bh;
        if (W1) {
          box(W1, F, c - 0.035, c + 0.035, st, qt, -0.32, -0.26, wood, K.WOOD, 4);
          const z = st + (qt - st) * 0.58; if (z < qt - 0.1) box(W1, F, tt, ct, z - 0.025, z + 0.025, -0.32, -0.27, wood, K.WOOD, 3);
          box(W1, F, tt, tt + 0.06, st, qt, -0.32, -0.25, wood, K.WOOD, 4); box(W1, F, ct - 0.06, ct, st, qt, -0.32, -0.25, wood, K.WOOD, 4);
          box(W1, F, tt, ct, Math.min(qt, yt) - 0.06, Math.min(qt, yt), -0.32, -0.25, wood, K.WOOD, 2);
        }
        if (porticones) { rect(W0, F, tt - 0.62, tt - 0.04, st + 0.02, yt, 0.05, shut, K.SHUT); rect(W0, F, ct + 0.04, ct + 0.62, st + 0.02, yt, 0.05, shut, K.SHUT);
          box(W1, F, tt - 0.62, tt - 0.04, st + 0.02, yt, 0.0, 0.05, shut, K.WOOD); box(W1, F, ct + 0.04, ct + 0.62, st + 0.02, yt, 0.0, 0.05, shut, K.WOOD); }
        // recercado, guardapolvo y clave
        box(W1, F, tt - 0.15, tt, st - 0.02, yt, 0, 0.09, shade(u, 0.96), K.STUCCO); box(W1, F, ct, ct + 0.15, st - 0.02, yt, 0, 0.09, shade(u, 0.96), K.STUCCO);
        box(W1, F, c - 0.13, c + 0.13, yt - 0.05, yt + 0.4, 0, 0.2, shade(u, 1.05), K.STUCCO);
        box(W0, F, tt - 0.12, ct + 0.12, yt, yt + 0.18, 0, 0.17, u, K.STUCCO);
        if (style === 'modernista' && !U) { box(W1, F, c - 0.55, c + 0.55, yt + 0.18, yt + 0.34, 0, 0.13, u, K.STUCCO); box(W1, F, c - 0.22, c + 0.22, yt + 0.34, yt + 0.5, 0, 0.1, u, K.STUCCO); }
        else if (style === 'clasico' && !U) box(W1, F, tt - 0.2, ct + 0.2, yt + 0.18, yt + 0.26, 0, 0.24, shade(u, 1.05), K.STUCCO);
        if (!U && style !== 'sobrio') { box(W1, F, a - 0.12, a + 0.12, k + 0.12, P - 0.22, 0, 0.1, shade(u, 0.94), K.STUCCO); box(W1, F, a - 0.19, a + 0.19, P - 0.22, P - 0.1, 0, 0.17, shade(u, 1.02), K.STUCCO); }
        if (style === 'modernista' || (style === 'clasico' && D % 2 === 0)) rect(W1, F, a + 0.13, a + bw - 0.13, P - 0.52, P - 0.14, 0.012, p, K.SGRAF);
        // balcón
        if (!U) {
          const full = D === 1 && rr[2] < 0.6, te = full ? bw / 2 - 0.04 : Math.min(1.05, bw / 2 - 0.05), jt = D === 1 ? 1.35 : 1.05, e0 = c - te, e1 = c + te;
          const slab = mixc(u, stone, 0.35);
          box(W0, F, e0, e1, k - 0.06, k + 0.12, 0, jt, slab, K.STONE);
          lattice(W0, F, e0, e1, k + 0.12, k + 1.14, jt - 0.03, iron, K.IRON, rr[6] < 0.5 ? 1 : 0);
          latticeSide(W0, F, e0 + 0.02, k + 0.12, k + 1.14, 0, jt - 0.03, iron, K.IRON, 0); latticeSide(W0, F, e1 - 0.02, k + 0.12, k + 1.14, 0, jt - 0.03, iron, K.IRON, 0);
          if (W1) {
            box(W1, F, e0 - 0.03, e1 + 0.03, k - 0.13, k - 0.05, 0, jt + 0.06, shade(slab, 0.92), K.STONE);
            box(W1, F, e0, e1, k + 1.14, k + 1.19, jt - 0.06, jt, iron, K.METAL);
            box(W1, F, e0, e0 + 0.05, k + 1.14, k + 1.19, 0, jt, iron, K.METAL); box(W1, F, e1 - 0.05, e1, k + 1.14, k + 1.19, 0, jt, iron, K.METAL);
            box(W1, F, e0, e0 + 0.05, k + 0.12, k + 1.14, jt - 0.06, jt, iron, K.METAL); box(W1, F, e1 - 0.05, e1, k + 0.12, k + 1.14, jt - 0.06, jt, iron, K.METAL);
            for (const pe of [e0 + 0.22, e1 - 0.32]) box(W1, F, pe, pe + 0.1, k - 0.36, k - 0.06, 0, jt * 0.78, shade(slab, 0.88), K.STONE);
            if (rr[3] < 0.32) { const pe = e0 + 0.25 + rr[4] * Math.max(0, e1 - e0 - 0.8);
              box(W1, F, pe, pe + 0.28, k + 0.12, k + 0.38, jt - 0.42, jt - 0.12, [158, 82, 56], K.PLAIN);
              box(W1, F, pe - 0.08, pe + 0.36, k + 0.38, k + 0.62 + rr[5] * 0.3, jt - 0.5, jt - 0.04, [52 + rr[5] * 30 | 0, 100 + rr[5] * 40 | 0, 46], K.LEAF); }
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------- coronación de un tramo: cornisa, peto o balaustrada
  function crown(env, run) {
    const { W0, W1, d, p, u, style, balusters, C } = env;
    const { F, L, cover, street, nb, bw, wallC } = run;
    if (C > cover) {
      if (street) {
        if (style === 'sobrio') { box(W0, F, 0, L, C + 0.2, C + 0.45, 0, 0.45, u, K.STUCCO); }
        else {
          box(W0, F, 0, L, C, C + 0.16, 0, 0.22, u, K.STUCCO); box(W0, F, 0, L, C + 0.16, C + 0.32, 0, 0.42, u, K.STUCCO); box(W0, F, 0, L, C + 0.32, C + 0.48, 0, 0.66, shade(u, 1.05), K.STUCCO);
          if (W1) { const nd = Math.round(L / 0.36); for (let q = 0; q < nd; q += 2) { const uu = q * L / nd; box(W1, F, uu, uu + L / nd * 0.8, C + 0.04, C + 0.15, 0.2, 0.34, shade(u, 0.94), K.STUCCO); }
            for (let W = 0; W <= nb; W++) { const a = Math.min(L - 0.1, Math.max(0.1, W * bw)); box(W1, F, a - 0.09, a + 0.09, C - 0.35, C + 0.32, 0, 0.5, shade(u, 1.02), K.STUCCO); } }
        }
        rect(W0, F, 0, L, C, d.y1, 0, p, K.STUCCO);
        if (balusters) {
          box(W0, F, 0, L, d.y1, d.y1 + 0.2, -0.02, 0.2, u, K.STUCCO);
          lattice(W0, F, 0, L, d.y1 + 0.2, d.y1 + 0.76, 0.09, u, K.BAL, 0);
          for (let W = 0; W <= nb; W++) { const a = Math.min(L - 0.15, Math.max(0.15, W * bw)); box(W0, F, a - 0.16, a + 0.16, d.y1 + 0.2, d.y1 + 0.76, -0.02, 0.22, u, K.STUCCO); }
        } else rect(W0, F, 0, L, d.y1, d.y1 + 0.76, 0, p, K.STUCCO);
        box(W0, F, 0, L, d.y1 + 0.76, d.y1 + 0.9, -0.05, 0.26, shade(u, 1.04), K.STUCCO);
      } else {
        rect(W0, F, 0, L, C, d.y1 + 0.3, 0, wallC, K.STUCCO);
        box(W0, F, 0, L, d.y1 + 0.3, d.y1 + 0.4, -0.03, 0.12, u, K.STUCCO);
      }
    }
  }

  // ---------------------------------------------------------------- piezas
  // ventana de patio (fachada interior de manzana)
  function yardWin(env, W0, W1, F, a, bw, c, k, P, col, u, rr) {
    const { windowHole, iron } = env;
    const ww = Math.min(1.05, bw - 0.8), tt = c - ww / 2, ct = c + ww / 2, st = k + 0.95, yt = Math.min(P - 0.35, st + 1.4);
    if (yt - st < 0.5) { rect(W0, F, a, a + bw, k, P, 0, col, K.STUCCO); return; }
    windowHole(W0, F, a, a + bw, tt, ct, k, P, st, yt, 0.2, col, K.STUCCO, rr[0] < 0.65 ? 0.2 + rr[1] * 0.7 : 0);
    box(W1, F, tt - 0.06, ct + 0.06, st - 0.07, st, 0, 0.09, u, K.STUCCO);
    if (W1 && rr[2] < 0.25) lattice(W1, F, tt - 0.1, ct + 0.1, st, st + 0.9, 0.12, iron, K.IRON, 0);
  }
  // tribuna acristalada en voladizo
  function tribuna(W0, W1, F, a, bw, k, P, p, u, wood, glass) {
    const zt = a + 0.25, te = a + bw - 0.25;
    rect(W0, F, a, zt, k, P, 0, p, K.STUCCO); rect(W0, F, te, a + bw, k, P, 0, p, K.STUCCO);
    box(W0, F, zt, te, k, k + 0.75, 0, 0.95, u, K.STUCCO); box(W0, F, zt, te, P - 0.3, P, 0, 1.05, u, K.STUCCO);
    rect(W0, F, zt, te, k + 0.75, P - 0.3, 0.85, glass, K.GLASS);
    jamb(W0, F, zt + 0.02, k + 0.75, P - 0.3, 0, 0.85, glass, K.GLASS); jamb(W0, F, te - 0.02, k + 0.75, P - 0.3, 0, 0.85, glass, K.GLASS);
    if (W1) {
      for (let h = 0; h <= 4; h++) { const pe = zt + (te - zt) * h / 4; box(W1, F, pe - 0.04, pe + 0.04, k + 0.75, P - 0.3, 0.82, 0.96, wood, K.WOOD); }
      const hm = (k + 0.75 + P - 0.3) / 2; box(W1, F, zt, te, hm + 0.25, hm + 0.3, 0.82, 0.95, wood, K.WOOD);
      for (const pe of [zt, te - 0.03]) box(W1, F, pe, pe + 0.03, k + 0.75, P - 0.3, 0, 0.85, wood, K.WOOD);
      box(W1, F, zt - 0.05, te + 0.05, k - 0.1, k, 0, 1.0, shade(u, 0.9), K.STUCCO);
    }
  }

  return { floors, crown, plainRun, blindRun };
} };
})();
