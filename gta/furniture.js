/* GTA Barcelona — Mobiliario urbano (hook de streets.js).
   Farolas, papeleras, bancos, contenedores de reciclaje con bolsas de basura y estaciones de Bicing, repartidos a lo
   largo de los tramos de calle de cada celda. La geometría va a la malla de mobiliario de la celda (cell.W), que se
   pinta con el shader de detalle de facades.js (tipos K.*). Lo redondo sale de las primitivas suaves de geo.js (rev, tube,
   sphere, cyl) y lo metálico o pintado usa el tipo genérico K.PBR.
   window.BCN_FURNITURE = { init(ctx) → { build(cell) } }. Contrato de cell/seg: DESARROLLO.md §6.
   Tipos de material propios: ids 60–79, con BCN_GEO.regKind() al cargar el script. */
(function () {
'use strict';
const { K, F0, shade, quad, rev, tube, sphere, cyl, obox, bar, pbrAux, R, seed } = window.BCN_GEO;

const FURN = new Set([2, 3, 4, 5, 6]);                      // clases de calle que llevan mobiliario
const CONT = [[72, 77, 87], [20, 77, 158], [209, 173, 26], [20, 107, 51], [77, 51, 31]];
// acabados K.PBR: pbrAux(rugosidad, metal, patrón, emisión)
const PAINT = pbrAux(0.42, 0, 0, 0);                        // pintura satinada: farolas, Bicing, tapas
const STEEL = pbrAux(0.4, 1, 0, 0);                         // acero visto (metal = 1: refleja el cielo): ejes, anillas
const SLATS = pbrAux(0.5, 0, 1, 0);                         // chapa pintada de lamas horizontales: papeleras
const RIBS = pbrAux(0.6, 0, 2, 0);                          // plástico con nervios verticales: contenedores
const WORN = pbrAux(0.55, 0, 3, 0);                         // pintura gastada: iglú de vidrio
const RUBBER = pbrAux(0.85, 0, 0, 0);                       // goma y plástico mate: neumáticos, puños, bolsas
// ámbitos de azar: seed(tipo, índice de retícula a lo largo de la calle, tramo), uno por objeto o grupo
const T_BIN = 2, T_CONT = 4, T_BICI = 5;

// rectángulo horizontal orientado: centro (x,z), cota y, largo l, ancho w, ángulo a
function flat(B, x, z, y, l, w, a, col, kind, aux) {
  const c = Math.cos(a) * l / 2, s = Math.sin(a) * l / 2, p = -Math.sin(a) * w / 2, q = Math.cos(a) * w / 2;
  quad(B, F0, x - c - p, y, z - s - q, x + c - p, y, z + s - q, x + c + p, y, z + s + q, x - c + p, y, z - s + q, col, kind, aux);
}
// bicicleta de Bicing (geometría de la bici de Transeúnte): x,z locales a la celda, ang = hacia dónde apunta
function bicing(B, x, z, y, ang) {
  const fx = Math.cos(ang), fz = Math.sin(ang), Pt = (f, h, sd = 0) => [x + fx * f - fz * sd, y + h, z + fz * f + fx * sd];
  const red = [191, 26, 31], blk = [22, 22, 24], gry = [150, 150, 155];
  for (const w of [-0.53, 0.53]) {                          // ruedas: el neumático es un tubo cerrado en anillo
    const ring = []; for (let k = 0; k < 16; k++) { const a = k / 16 * 6.2832; ring.push(Pt(w + Math.cos(a) * 0.31, 0.33 + Math.sin(a) * 0.31)); }
    tube(B, F0, ring, 0.028, 3, blk, K.PBR, { closed: true, aux: RUBBER });
    bar(B, Pt(w, 0.33, -0.04), Pt(w, 0.33, 0.04), 0.03, gry, K.PBR, STEEL); }
  const T = (pts, r) => tube(B, F0, pts.map(p => Pt(p[0], p[1])), r, 4, red, K.PBR, { aux: PAINT });   // cuadro: tubos con los codos a inglete
  T([[-0.53, 0.33], [-0.1, 0.72], [0.33, 0.72], [0.53, 0.33]], 0.022);
  T([[-0.53, 0.33], [0.05, 0.33], [0.33, 0.72]], 0.02);
  T([[0.05, 0.33], [-0.1, 0.72], [-0.14, 0.88]], 0.02);
  T([[0.33, 0.72], [0.38, 0.96]], 0.02);
  tube(B, F0, [Pt(0.38, 0.96, -0.26), Pt(0.38, 0.96, 0.26)], 0.017, 4, blk, K.PBR, { aux: RUBBER });   // manillar
  bar(B, Pt(-0.27, 0.9), Pt(-0.03, 0.9), 0.045, blk, K.PLAIN);                                        // sillín
  bar(B, Pt(0.5, 0.85), Pt(0.72, 0.85), 0.12, [235, 235, 232], K.PBR, PAINT);                         // cesta
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
        const y = walkY(ns, x, z) - 0.02, H = hw > 6 ? 9.5 : 7.8, lx = x - ox, lz = z - oz;
        // columna torneada de una pieza: base, moldura y fuste cónico (sin engordar la de antes: hay calles muy estrechas)
        rev(W, F0, lx, lz, [[0.16, y], [0.125, y + 0.46], [0.09, y + 0.55], [0.055, y + H]], 7, lampC, K.PBR, { aux: PAINT, cap: 1 });
        // brazo: tubo en arco desde la punta del fuste hasta la luminaria
        const reach = Math.min(1.9, hw * 0.45), dx = -px * side, dz = -pz * side, ex = lx + dx * reach, ez = lz + dz * reach;
        tube(W, F0, [[lx, y + H - 0.12, lz], [lx + dx * reach * 0.3, y + H + 0.16, lz + dz * reach * 0.3], [ex - dx * 0.05, y + H + 0.02, ez - dz * 0.05]], 0.04, 4, lampC, K.PBR, { aux: PAINT });
        // luminaria y su pantalla, que es la que da luz
        obox(W, ex, ez, y + H - 0.2, 0.62, 0.3, 0.2, ang, lampC, K.PBR, PAINT);
        flat(W, ex, ez, y + H - 0.206, 0.5, 0.22, ang, [255, 236, 190], K.LAMP);
      });
      // papeleras: poste y cubo de lamas, abierto por arriba
      along(37, 13, (u, n) => { const side = n % 2 ? -1 : 1, off = hw + 0.6, x = ax + tx * u + px * side * off, z = az + tz * u + pz * side * off;
        if (!inCell(x, z) || nearJ(x, z, 5)) return; const ns = freeWalk(x, z); if (ns < -1) return;
        seed(T_BIN, n, s); const c = R() < 0.6 ? [150, 30, 32] : [70, 74, 78];
        const y = walkY(ns, x, z) - 0.02, bx = x - ox + px * side * 0.2, bz = z - oz + pz * side * 0.2, dark = [18, 18, 20];
        cyl(W, x - ox, z - oz, y, y + 1.0, 0.035, 0.035, 4, ironC, K.PBR, PAINT);
        rev(W, F0, bx, bz, [[0.195, y + 0.38], [0.22, y + 0.92], [0.22, y + 0.92, dark], [0, y + 0.86, dark]], 10, c, K.PBR, { aux: SLATS });
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
        seed(T_CONT, n, s);                                   // todo el azar del grupo, de golpe
        const side = R() < 0.5 ? 1 : -1, nc = 3 + Math.floor(R() * 3), nb = Math.floor(R() * 4), bags = [];
        for (let b = 0; b < 3; b++) bags.push([R(-2.5, 2.5), R(0.32, 0.5), R() < 0.6]);
        const off = hw - 1.15, cxp = ax + tx * u + px * side * off, czp = az + tz * u + pz * side * off;
        if (!inCell(cxp, czp) || nearJ(cxp, czp, 14) || u < 5 || u > L - 5) return;
        for (let c = 0; c < nc; c++) {
          const e = (c - (nc - 1) / 2) * 1.85, x = cxp + tx * e, z = czp + tz * e, y = roadY(s, x, z), col = CONT[c % 5];
          if (c % 5 === 3) {                                  // iglú del vidrio: campana torneada, con su anilla de izado
            rev(W, F0, x - ox, z - oz, [[0.7, y], [0.78, y + 0.4], [0.74, y + 0.95], [0.5, y + 1.36], [0.15, y + 1.54]], 9, col, K.PBR, { aux: WORN, cap: 1 });
            cyl(W, x - ox, z - oz, y + 1.54, y + 1.68, 0.09, 0.07, 5, [120, 124, 130], K.PBR, STEEL); continue; }
          obox(W, x - ox, z - oz, y + 0.1, 1.55, 1.45, 1.15, ang, col, K.PBR, RIBS);
          obox(W, x - ox, z - oz, y + 1.25, 1.65, 1.55, 0.12, ang, shade(col, 1.2), K.PBR, PAINT);
          obox(W, x - ox - px * side * 0.73, z - oz - pz * side * 0.73, y + 0.95, 1.1, 0.04, 0.06, ang, [20, 20, 20], K.PLAIN);
        }
        for (let b = 0; b < nb; b++) { const [e, sz, blk] = bags[b], x = cxp + tx * e + px * side * 0.95, z = czp + tz * e + pz * side * 0.95, y = roadY(s, x, z);
          sphere(W, F0, x - ox, y + sz * 0.4, z - oz, sz * 0.58, 6, 3, blk ? [25, 25, 28] : [80, 82, 70], K.PBR, RUBBER, 0.7); }
      });
      // estación de Bicing en el carril de aparcamiento: tótem, anclajes y bicicletas
      if (cls >= 3 && cls <= 5 && hw >= 3) along(310, 150, (u, n) => {
        seed(T_BICI, n, s);                                   // todo el azar de la estación, de golpe
        const side = R() < 0.5 ? 1 : -1, nd = 9 + Math.floor(R() * 6), bike = [];
        for (let d = 0; d < 14; d++) bike.push(R() < 0.72);
        const off = hw - 1.0, cxp = ax + tx * u + px * side * off, czp = az + tz * u + pz * side * off;
        if (!inCell(cxp, czp) || nearJ(cxp, czp, 16) || u < 7 || u > L - 7) return;
        const bang = Math.atan2(pz * side, px * side);
        for (let d = 0; d < nd; d++) {
          const e = (d - (nd - 1) / 2) * 0.85, x = cxp + tx * e, z = czp + tz * e, y = roadY(s, x, z);
          obox(W, x + px * side * 0.62 - ox, z + pz * side * 0.62 - oz, y, 0.14, 0.14, 0.85, ang, [96, 99, 104], K.PBR, PAINT);
          if (bike[d]) bicing(W, x - ox, z - oz, y, bang);
        }
        const e = ((nd - 1) / 2 + 0.9), x = cxp + tx * e + px * side * 0.62, z = czp + tz * e + pz * side * 0.62, y = roadY(s, x, z);
        obox(W, x - ox, z - oz, y, 0.55, 0.36, 2.1, ang, [60, 62, 66], K.PBR, PAINT);
        obox(W, x - ox, z - oz, y + 1.55, 0.57, 0.38, 0.45, ang, [191, 26, 31], K.PBR, PAINT);
        obox(W, cxp - ox + px * side * 0.62, czp - oz + pz * side * 0.62, y, nd * 0.85, 0.3, 0.06, ang, [80, 82, 86], K.PBR, PAINT);
      });
    });
  }

  return { build };
} };
})();
