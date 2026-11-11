/* GTA Barcelona — HITOS, lote c (torres y frente marítimo). Cada hito se declara con BCN_LM.add({...}) al cargar el
   script (ficha y constructor: DESARROLLO.md §10). Este fichero es SOLO del agente del lote c.
   Ejemplos de referencia del núcleo: Torre Glòries y Hotel W. */
(function () {
'use strict';
const { add, lib: L, K } = window.BCN_LM;

// Torre Glòries (antes Agbar). Silueta: bala de 145 m, planta elíptica de 40 × 37 m, recta hasta ~105 m y luego cúpula.
// Rasgos: la silueta; la piel de paneles de colores en degradado (rojos y naranjas abajo, azules arriba, cúpula plateada)
// con huecos sueltos; de noche, LED con los mismos colores.
add({ id: 'torre_glories', nombre: 'Torre Glòries', nivel: 'A', x: 13855, z: 15870, rot: 0, alto: 145, ancho: 40, largo: 37,
  noche: 'led', edificios: [141753, 141754, 141755, 141756, 141757, 141758, 141759],
  build(B, h, L) {
    L.aguja(B, 0, 0, -1.5, 146.5, 20, { lados: 56, pasos: 10, recto: 0.72, pot: 2, exp: 0.42, sz: 37 / 40, k: K.METAL,
      aux: L.aux.panel(2.2, 0.7, 0.2), cortes: 9,
      cols: [[0, '#93372f'], [0.12, '#a84a36'], [0.26, '#b4643e'], [0.4, '#b07a52'], [0.5, '#86687a'], [0.6, '#5d6f98'], [0.7, '#4b6694'],
             [0.78, '#7088ac'], [0.9, '#a6b4c8'], [1, '#c9d2de']] });
    // planta baja acristalada, algo retranqueada
    L.tambor(B, 0, 0, -1.5, 4.2, 19.3, { lados: 40, col: [40, 46, 54], k: K.CORTINA, aux: L.aux.cortina(4.2, 2.2, 0.1), sinTapa: true });
  } });

// Hotel W (la Vela). Silueta: vela de vidrio de 87 m sobre la punta de la nueva bocana: planta en media luna alargada de
// este a oeste (unos 58 × 25 m), canto oeste vertical y el borde de arriba que baja hacia el este (hasta ~65 m).
// Rasgos: la vela; vidrio espejo azul grisáceo con las líneas de los forjados; de noche, habitaciones encendidas.
add({ id: 'hotel_w', nombre: 'Hotel W', nivel: 'A', x: 13859, z: 11984, rot: 0, alto: 87, ancho: 58, largo: 26,
  noche: 'ventanas', edificios: [52511, 52520, 52521, 52522, 52523, 52524, 52525, 52526, 52527, 52528, 52529, 52530, 52531, 52532,
    52533, 52534, 52535, 52536, 52537, 52538, 52539, 52540],
  build(B, h, L) {
    // canto sur casi recto y cara norte curva (de la huella real), de oeste a este; z en función de x
    const sur = [[-17, -6], [-13, -10], [-5, -14], [3, -16.5], [12, -18], [21, -19], [30, -19], [37, -18], [41.5, -14]];
    const norte = [[-16.5, 1.5], [-13, 4.5], [-8, 6], [-2, 7], [6, 7], [15, 6], [23, 4.3], [30, 2], [37, -1.5], [41.5, -7]];
    const zAt = (pl, x) => { if (x <= pl[0][0]) return pl[0][1]; for (let i = 1; i < pl.length; i++) if (x <= pl[i][0]) { const t = (x - pl[i - 1][0]) / (pl[i][0] - pl[i - 1][0]); return pl[i - 1][1] + (pl[i][1] - pl[i - 1][1]) * t; } return pl[pl.length - 1][1]; };
    // la vela: el canto de proa (oeste) es vertical; la baluma (este) baja de 87 a 64 m. Cada nivel es la misma planta
    // recortada por el este a la altura que toca, con la cara norte algo hinchada a media altura
    const HT = 87.4, xEnd = y => Math.min(41.5, 9 + (HT - y) / 0.76), N = 12, niv = [];
    for (const y of [-1, 20, 40, 62.7, 68, 73, 78, 83, HT]) {
      const x0 = -17, x1 = xEnd(y), bul = 1.6 * Math.sin(Math.PI * Math.min(1, Math.max(0, y / HT))), pl = [];
      for (let i = 0; i <= N; i++) { const x = x0 + (x1 - x0) * i / N; pl.push([x, zAt(sur, x)]); }
      for (let i = N; i >= 0; i--) { const x = x0 + (x1 - x0) * i / N; pl.push([x, zAt(norte, x) + bul]); }
      niv.push([y, pl]);
    }
    L.loft(B, niv, [140, 160, 182], K.CORTINA, { aux: L.aux.cortina(3.15, 1.7, 0.3), techo: [70, 74, 80] });
    // remate de la proa (un canto algo más alto) y la cubierta técnica
    L.prisma(B, L.mover(L.rect(3.5, 8), -14.5, -1.5, -55), 86.5, 90, [150, 160, 170], K.METAL, { aux: L.aux.panel(1.2) });
    L.prisma(B, L.mover(L.rect(12, 8), -2, -4, -8), 86.8, 88.8, [120, 124, 128], K.LISO);
  } });

})();
