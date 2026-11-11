/* GTA Barcelona — Interiores y planta baja (hook de facades.js).
   Todo lo que se construye entre la acera y la cota F1 de cada tramo de fachada: portal, escaparates de comercio y
   ventanas de planta baja con reja; más el atlas de rótulos y la lista de comercios.
   window.BCN_INTERIORS = { SHOPS, init(ctx) → { groundFloor(env, run), signTex } }. Contrato de env/run: DESARROLLO.md §6.
   Tipos de material propios: ids 20–39, con BCN_GEO.regKind() al cargar el script. */
(function () {
'use strict';
const { K, quad, rect, jamb, hpl, box, lattice, shade, signAux, R } = window.BCN_GEO;

const AWNINGS = [[166, 36, 33], [31, 77, 56], [219, 204, 168], [38, 56, 107]];
const SHOPS = ['FORN DE PA', 'FARMÀCIA', 'FERRETERIA', 'BAR TAPES', 'FRUITERIA', 'LLIBRERIA', 'FLORISTERIA', 'RESTAURANT', 'PERRUQUERIA', 'MODA', 'GELATERIA', 'CAFÈ', 'QUEVIURES', 'ÒPTICA', 'PAPERERIA', 'FORMATGERIA'];

window.BCN_INTERIORS = { SHOPS, init(ctx) {
  const { scene } = ctx;
  // rótulos: 16 comercios en un atlas 4×4
  const sign = new BABYLON.DynamicTexture('signs', { width: 1024, height: 512 }, scene, true);
  {
    const g = sign.getContext(), cols = ['#143d33', '#7c1d22', '#1c2c52', '#2b2b2f', '#5c3b16', '#17594c', '#3d1c4c', '#6b5a1e'];
    SHOPS.forEach((s, r) => { const x = (r % 4) * 256, y = (3 - (r >> 2)) * 128;
      g.fillStyle = cols[r % cols.length]; g.fillRect(x, y, 256, 128); g.strokeStyle = '#d8c9a3'; g.lineWidth = 4; g.strokeRect(x + 8, y + 10, 240, 108);
      g.fillStyle = '#f6e8c9'; g.font = 'bold 36px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x + 128, y + 66, 228); });
    sign.update(true); sign.wrapU = sign.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE; sign.anisotropicFilteringLevel = 8;
  }
  for (const m of ctx.detail.mats) m.setTexture('tSign', sign);

  // ---------------------------------------------------------------- planta baja de un tramo (de calle o de patio)
  // Consume SIEMPRE 6 números de azar por vano, se dibuje o no: lo que venga después (pisos) depende de ello.
  function groundFloor(env, run) {
    const { W0, W1, F1, y0, u, stone, iron, shops, shopsHere, windowHole } = env;
    const { F, cover, street, nb, bw, N, wallC, gnd } = run;
    for (let W = 0; W < nb; W++) {
      const a = W * bw, c = a + bw / 2;
      const rr = [R(), R(), R(), R(), R(), R()];
      let gl = Math.min(gnd(c), F1 - 2.7);
      if (F1 <= cover + 0.3) continue;                        // tapado por el vecino
      const yB = Math.max(y0, cover - 0.3);
      if (street && W === N) { portalBay(env, run, a, c, gl, yB, rr); continue; }
      if (street && shopsHere) { shopBay(env, run, a, c, gl, yB, rr); continue; }
      // ventana de planta baja (con reja si da a la calle)
      const ww = Math.min(street ? 1.25 : 1.05, bw - 0.9), tt = c - ww / 2, ct = c + ww / 2;
      const st = gl + 1.0, yt = Math.min(F1 - 0.45, st + (street ? 1.9 : 1.45));
      const gc = street && shops ? stone : wallC, gk = street && shops ? K.STONE : K.STUCCO;
      if (yt - st < 0.6) { rect(W0, F, a, a + bw, yB, F1, 0, gc, gk); continue; }
      windowHole(W0, F, a, a + bw, tt, ct, yB, F1, st, yt, street ? 0.3 : 0.2, gc, gk, rr[0] < 0.6 ? 0.2 + rr[1] * 0.5 : 0);
      if (street) { lattice(W0, F, tt, ct, st, yt, 0.05, iron, K.IRON, 1); box(W1, F, tt - 0.05, ct + 0.05, st - 0.08, st, 0, 0.12, shade(gc, 1.05), gk); }
      else box(W1, F, tt - 0.06, ct + 0.06, st - 0.07, st, 0, 0.09, u, K.STUCCO);
    }
  }

  // ---------------------------------------------------------------- piezas
  // escaparate: machones y dintel de piedra, vidrio, carpintería metálica, rótulo y toldo
  function shopBay(env, run, a, c, gl, yB, rr) {
    const { W0, W1, F1, stone } = env, { F, bw } = run;
    const Uw = bw * 0.84, B_ = a + (bw - Uw) / 2, V_ = B_ + Uw;
    const top = Math.min(F1 - 0.6, gl + 3.7), sill = gl + 0.5;
    const sc = stone, dk = shade(sc, 0.55);
    rect(W0, F, a, B_, yB, F1, 0, sc, K.STONE); rect(W0, F, V_, a + bw, yB, F1, 0, sc, K.STONE);
    rect(W0, F, B_, V_, top, F1, 0, sc, K.STONE); rect(W0, F, B_, V_, yB, sill, 0, shade(sc, 0.85), K.STONE);
    jamb(W0, F, B_, sill, top, -0.4, 0, dk, K.STONE); jamb(W0, F, V_, sill, top, -0.4, 0, dk, K.STONE);
    hpl(W0, F, B_, V_, top, -0.4, 0, shade(sc, 0.5), K.STONE); hpl(W0, F, B_, V_, sill, -0.4, 0, shade(sc, 0.72), K.STONE);
    const tint = [[170, 150, 120], [120, 140, 150], [160, 120, 100], [140, 150, 120]][rr[0] * 4 | 0];
    rect(W0, F, B_, V_, sill, top, -0.36, tint, K.GSHOP);
    const met = [24, 24, 27];
    box(W0, F, B_ + Uw * 0.5 - 0.035, B_ + Uw * 0.5 + 0.035, sill, top, -0.38, -0.3, met, K.METAL);
    box(W0, F, B_ + 0.05, V_ - 0.05, sill, sill + 0.1, -0.4, -0.3, met, K.METAL);
    const sv0 = top + 0.08, sv1 = Math.min(F1 - 0.3, top + 0.58);
    if (rr[1] < 0.75 && sv1 - sv0 > 0.25) quad(W0, F, B_ + 0.15, sv0, 0.06, V_ - 0.15, sv0, 0.06, V_ - 0.15, sv1, 0.06, B_ + 0.15, sv1, 0.06, [255, 255, 255], K.SIGN, signAux((rr[2] * SHOPS.length) | 0));
    if (rr[3] < 0.4) { const ac = AWNINGS[rr[4] * 4 | 0];
      quad(W0, F, B_, top - 0.02, 0.05, V_, top - 0.02, 0.05, V_, top - 0.75, 1.45, B_, top - 0.75, 1.45, ac, K.AWN);
      quad(W1, F, B_, top - 0.75, 1.45, V_, top - 0.75, 1.45, V_, top - 0.95, 1.45, B_, top - 0.95, 1.45, ac, K.AWN); }
    if (W1) {
      box(W1, F, B_, B_ + 0.16, sill, top, -0.4, 0, shade(sc, 0.62), K.STONE); box(W1, F, V_ - 0.16, V_, sill, top, -0.4, 0, shade(sc, 0.62), K.STONE);
      box(W1, F, B_, V_, top - 0.16, top, -0.4, 0, shade(sc, 0.62), K.STONE);
      const fr = shade(sc, 0.35);
      box(W1, F, B_ - 0.08, B_ + 0.03, sill, top + 0.06, -0.05, -0.004, fr, K.STONE); box(W1, F, V_ - 0.03, V_ + 0.08, sill, top + 0.06, -0.05, -0.004, fr, K.STONE);
      box(W1, F, B_ - 0.08, V_ + 0.08, top - 0.02, top + 0.06, -0.05, -0.004, fr, K.STONE);
      for (const y of [sill + 1.0, top - 0.7]) box(W1, F, B_ + 0.16, V_ - 0.16, y - 0.02, y + 0.02, -0.37, -0.33, met, K.METAL);
    }
  }
  // portal: puerta de madera con montante de vidrio, recercado de piedra y farol
  function portalBay(env, run, a, c, gl, yB, rr) {
    const { W0, W1, F1, stone, wood, glass, iron } = env, { F, bw } = run;
    const dw = Math.min(1.2, bw / 2 - 0.35), dtop = Math.min(F1 - 0.55, gl + 3.5), x0 = c - dw, x1 = c + dw, sc = stone;
    rect(W0, F, a, x0, yB, F1, 0, sc, K.STONE); rect(W0, F, x1, a + bw, yB, F1, 0, sc, K.STONE); rect(W0, F, x0, x1, dtop, F1, 0, sc, K.STONE);
    jamb(W0, F, x0, gl, dtop, -0.45, 0, shade(sc, 0.6), K.STONE); jamb(W0, F, x1, gl, dtop, -0.45, 0, shade(sc, 0.6), K.STONE);
    hpl(W0, F, x0, x1, dtop, -0.45, 0, shade(sc, 0.5), K.STONE);
    const tr = dtop - 0.95;
    rect(W0, F, x0, x1, gl, tr, -0.42, wood, K.WOOD); rect(W0, F, x0, x1, tr, dtop, -0.43, glass, K.GLASS);
    box(W0, F, x0 - 0.25, x1 + 0.25, gl - 0.2, gl + 0.12, 0, 0.55, shade(sc, 1.15), K.STONE);
    if (W1) {
      box(W1, F, x0 - 0.34, x0, gl + 0.3, dtop + 0.1, 0, 0.28, shade(sc, 1.05), K.STONE); box(W1, F, x1, x1 + 0.34, gl + 0.3, dtop + 0.1, 0, 0.28, shade(sc, 1.05), K.STONE);
      box(W1, F, x0 - 0.44, x1 + 0.44, dtop + 0.1, dtop + 0.3, 0, 0.4, shade(sc, 1.08), K.STONE);
      box(W1, F, c - 0.24, c + 0.24, dtop - 0.08, dtop + 0.42, 0, 0.5, shade(sc, 1.15), K.STONE);
      box(W1, F, c - 0.02, c + 0.02, gl, tr, -0.42, -0.39, shade(wood, 0.6), K.WOOD);
      for (const [l0, l1] of [[x0 + 0.12, c - 0.12], [c + 0.12, x1 - 0.12]]) {
        box(W1, F, l0, l1, gl + 0.3, gl + 1.1, -0.42, -0.37, shade(wood, 1.15), K.WOOD); box(W1, F, l0, l1, gl + 1.35, tr - 0.2, -0.42, -0.37, shade(wood, 1.15), K.WOOD); }
      for (const s of [-1, 1]) box(W1, F, c + s * 0.09 - 0.025, c + s * 0.09 + 0.025, gl + 1.0, gl + 1.32, -0.39, -0.33, [184, 140, 56], K.METAL);
      for (let q = 1; q < 6; q++) { const xx = x0 + (x1 - x0) * q / 6; box(W1, F, xx - 0.015, xx + 0.015, tr, dtop, -0.42, -0.39, iron, K.METAL); }
      if (rr[0] < 0.6) { box(W1, F, x1 + 0.42, x1 + 0.6, gl + 2.6, gl + 3.0, 0.12, 0.32, [235, 220, 180], K.LAMP); box(W1, F, x1 + 0.48, x1 + 0.54, gl + 3.0, gl + 3.2, 0, 0.3, iron, K.METAL); }
    }
  }

  return { groundFloor, signTex: sign };
} };
})();
