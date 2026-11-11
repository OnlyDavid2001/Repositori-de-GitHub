/* GTA Barcelona — Mobiliario urbano (hook de streets.js).
   Farolas, papeleras, bancos, contenedores de reciclaje con bolsas de basura y estaciones de Bicing, repartidos a lo
   largo de los tramos de calle de cada celda. La geometría va a la malla de mobiliario de la celda (cell.W), que se
   pinta con el shader de detalle de facades.js (tipos K.*).
   window.BCN_FURNITURE = { init(ctx) → { build(cell) } }. Contrato de cell/seg: DESARROLLO.md §6.
   Tipos de material propios: ids 60–79, con BCN_GEO.regKind() al cargar el script. */
(function () {
'use strict';
const { K, shade, cyl, obox, bar, R, seed, hash2 } = window.BCN_GEO;

const FURN = new Set([2, 3, 4, 5, 6]);                      // clases de calle que llevan mobiliario
const CONT = [[72, 77, 87], [20, 77, 158], [209, 173, 26], [20, 107, 51], [77, 51, 31]];
// bicicleta de Bicing (geometría de la bici de Transeúnte): x,z locales a la celda, ang = hacia dónde apunta
function bicing(B, x, z, y, ang) {
  const fx = Math.cos(ang), fz = Math.sin(ang), Pt = (f, h, sd = 0) => [x + fx * f - fz * sd, y + h, z + fz * f + fx * sd];
  const red = [191, 26, 31], blk = [22, 22, 24], gry = [150, 150, 155];
  for (const w of [-0.53, 0.53]) { for (let k = 0; k < 12; k++) { const a1 = k / 12 * 6.2832, a2 = (k + 1) / 12 * 6.2832;
      bar(B, Pt(w + Math.cos(a1) * 0.31, 0.33 + Math.sin(a1) * 0.31), Pt(w + Math.cos(a2) * 0.31, 0.33 + Math.sin(a2) * 0.31), 0.022, blk, K.METAL); }
    bar(B, Pt(w, 0.33, -0.04), Pt(w, 0.33, 0.04), 0.03, gry, K.METAL); }
  const T = (pts, r, c) => { for (let k = 0; k + 1 < pts.length; k++) bar(B, Pt(pts[k][0], pts[k][1]), Pt(pts[k + 1][0], pts[k + 1][1]), r, c, K.METAL); };
  T([[-0.53, 0.33], [-0.1, 0.72], [0.33, 0.72], [0.53, 0.33]], 0.022, red);
  T([[-0.53, 0.33], [0.05, 0.33], [0.33, 0.72]], 0.02, red);
  T([[0.05, 0.33], [-0.1, 0.72], [-0.14, 0.88]], 0.02, red);
  T([[0.33, 0.72], [0.38, 0.96]], 0.02, red);
  bar(B, Pt(0.38, 0.96, -0.26), Pt(0.38, 0.96, 0.26), 0.016, blk, K.METAL);
  bar(B, Pt(-0.27, 0.9), Pt(-0.03, 0.9), 0.045, blk, K.PLAIN);
  bar(B, Pt(0.5, 0.85), Pt(0.72, 0.85), 0.12, [235, 235, 232], K.METAL);   // cesta
}

window.BCN_FURNITURE = { init(ctx) {
  const { walkY, roadY, nearestCar, coverAt } = ctx.city;

  function build(cell) {
    const { W, ox, oz, inCell, nearJ, freeWalk } = cell;
    const lampC = [38, 46, 42], ironC = [26, 26, 28];
    cell.forEachSeg(seg => {
      const { s, cls, hw, ax, az, tx, tz, px, pz, L, ang, along } = seg;
      if (!FURN.has(cls) || hw < 2) return;
      // farolas: cada 24 m alternando acera, con brazo sobre la calzada
      along(24, 5, (u, n) => { const side = n % 2 ? 1 : -1, off = hw + 0.5, x = ax + tx * u + px * side * off, z = az + tz * u + pz * side * off;
        if (!inCell(x, z) || nearJ(x, z, 6)) return; const ns = freeWalk(x, z); if (ns < -1) return;
        const y = walkY(ns, x, z) - 0.02, H = hw > 6 ? 9.5 : 7.8;
        cyl(W, x - ox, z - oz, y, y + 0.55, 0.16, 0.12, 8, lampC, K.METAL);
        cyl(W, x - ox, z - oz, y + 0.55, y + H, 0.09, 0.055, 8, lampC, K.METAL);
        const reach = Math.min(1.9, hw * 0.45), ex = x - px * side * reach, ez = z - pz * side * reach;
        obox(W, (x + ex) / 2 - ox, (z + ez) / 2 - oz, y + H - 0.05, reach + 0.1, 0.07, 0.07, Math.atan2(-pz * side, -px * side), lampC, K.METAL);
        obox(W, ex - ox, ez - oz, y + H - 0.28, 0.62, 0.3, 0.22, ang, lampC, K.METAL);
        obox(W, ex - ox, ez - oz, y + H - 0.31, 0.5, 0.22, 0.03, ang, [255, 236, 190], K.LAMP);
      });
      // papeleras
      along(37, 13, (u, n) => { const side = n % 2 ? -1 : 1, off = hw + 0.6, x = ax + tx * u + px * side * off, z = az + tz * u + pz * side * off;
        if (!inCell(x, z) || nearJ(x, z, 5)) return; const ns = freeWalk(x, z); if (ns < -1) return;
        const y = walkY(ns, x, z) - 0.02, c = hash2(n, s) < 0.6 ? [150, 30, 32] : [70, 74, 78];
        cyl(W, x - ox, z - oz, y, y + 1.0, 0.035, 0.035, 6, ironC, K.METAL);
        cyl(W, x - ox + px * side * 0.2, z - oz + pz * side * 0.2, y + 0.38, y + 0.92, 0.2, 0.22, 10, c, K.METAL);
      });
      // bancos (solo en aceras anchas)
      along(53, 27, (u, n) => { const side = n % 2 ? 1 : -1, off = hw + 2.4, x = ax + tx * u + px * side * off, z = az + tz * u + pz * side * off;
        if (!inCell(x, z) || nearJ(x, z, 8)) return;
        if (freeWalk(x, z) < -1 || coverAt(x + px * side * 1.6, z + pz * side * 1.6, -1) > -1e8) return;
        const [ns] = nearestCar(x, z), y = walkY(ns, x, z) - 0.02, wood = [122, 78, 44];
        for (const e of [-0.75, 0.75]) obox(W, x - ox + tx * e, z - oz + tz * e, y, 0.08, 0.5, 0.45, ang, ironC, K.METAL);
        for (let q = 0; q < 4; q++) obox(W, x - ox + px * side * (q * 0.12 - 0.18), z - oz + pz * side * (q * 0.12 - 0.18), y + 0.43, 1.8, 0.09, 0.04, ang, wood, K.WOOD);
        for (let q = 0; q < 3; q++) obox(W, x - ox + px * side * 0.26, z - oz + pz * side * 0.26, y + 0.55 + q * 0.13, 1.8, 0.04, 0.08, ang, wood, K.WOOD);
      });
      // contenedores de reciclaje (en el carril de aparcamiento) con alguna bolsa de basura
      if ((cls === 4 || cls === 5) && hw >= 3) along(95, 41, (u, n) => {
        const side = hash2(n, 7) < 0.5 ? 1 : -1, off = hw - 1.15, cxp = ax + tx * u + px * side * off, czp = az + tz * u + pz * side * off;
        if (!inCell(cxp, czp) || nearJ(cxp, czp, 14) || u < 5 || u > L - 5) return;
        seed(n * 977 + s);
        const nc = 3 + Math.floor(R() * 3);
        for (let c = 0; c < nc; c++) {
          const e = (c - (nc - 1) / 2) * 1.85, x = cxp + tx * e, z = czp + tz * e, y = roadY(s, x, z), col = CONT[c % 5];
          if (c % 5 === 3) { cyl(W, x - ox, z - oz, y, y + 1.45, 0.75, 0.6, 12, col, K.METAL); cyl(W, x - ox, z - oz, y + 1.45, y + 1.6, 0.25, 0.18, 8, shade(col, 1.2), K.METAL); continue; }
          obox(W, x - ox, z - oz, y + 0.1, 1.55, 1.45, 1.15, ang, col, K.METAL);
          obox(W, x - ox, z - oz, y + 1.25, 1.65, 1.55, 0.12, ang, shade(col, 1.2), K.METAL);
          obox(W, x - ox - px * side * 0.73, z - oz - pz * side * 0.73, y + 0.95, 1.1, 0.04, 0.06, ang, [20, 20, 20], K.PLAIN);
        }
        const nb = Math.floor(R() * 4);
        for (let b = 0; b < nb; b++) { const e = R(-2.5, 2.5), x = cxp + tx * e + px * side * 0.95, z = czp + tz * e + pz * side * 0.95, y = roadY(s, x, z), sz = R(0.32, 0.5);
          obox(W, x - ox, z - oz, y, sz, sz * 0.9, sz * 0.85, ang + R(-0.6, 0.6), R() < 0.6 ? [25, 25, 28] : [80, 82, 70], K.PLAIN); }
      });
      // estación de Bicing en el carril de aparcamiento: tótem, anclajes y bicicletas
      if (cls >= 3 && cls <= 5 && hw >= 3) along(310, 150, (u, n) => {
        const side = hash2(n, 11) < 0.5 ? 1 : -1, off = hw - 1.0, cxp = ax + tx * u + px * side * off, czp = az + tz * u + pz * side * off;
        if (!inCell(cxp, czp) || nearJ(cxp, czp, 16) || u < 7 || u > L - 7) return;
        seed(n * 131 + s * 7);
        const nd = 9 + Math.floor(R() * 6), bang = Math.atan2(pz * side, px * side);
        for (let d = 0; d < nd; d++) {
          const e = (d - (nd - 1) / 2) * 0.85, x = cxp + tx * e, z = czp + tz * e, y = roadY(s, x, z);
          obox(W, x + px * side * 0.62 - ox, z + pz * side * 0.62 - oz, y, 0.14, 0.14, 0.85, ang, [96, 99, 104], K.METAL);
          if (R() < 0.72) bicing(W, x - ox, z - oz, y, bang);
        }
        const e = ((nd - 1) / 2 + 0.9), x = cxp + tx * e + px * side * 0.62, z = czp + tz * e + pz * side * 0.62, y = roadY(s, x, z);
        obox(W, x - ox, z - oz, y, 0.55, 0.36, 2.1, ang, [60, 62, 66], K.METAL);
        obox(W, x - ox, z - oz, y + 1.55, 0.57, 0.38, 0.45, ang, [191, 26, 31], K.METAL);
        obox(W, cxp - ox + px * side * 0.62, czp - oz + pz * side * 0.62, y, nd * 0.85, 0.3, 0.06, ang, [80, 82, 86], K.METAL);
      });
    });
  }

  return { build };
} };
})();
