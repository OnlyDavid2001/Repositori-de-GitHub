/* GTA Barcelona — HITOS, lote d (Ciutat Vella, puerto y monumentos). Cada hito se declara con BCN_LM.add({...}) al cargar
   el script (ficha y constructor: DESARROLLO.md §10). Este fichero es SOLO del agente del lote d.
   Ejemplo de referencia del núcleo: Arc de Triomf. */
(function () {
'use strict';
const { add, lib: L, K } = window.BCN_LM;

// Arc de Triomf. Silueta: arco de 29 m de alto y 29,5 de ancho, un solo vano de medio punto, a lo largo del passeig de
// Lluís Companys (el paso mira al 133°). Rasgos: ladrillo rojo neomudéjar; friso de piedra clara sobre el vano; remate
// almenado con cuatro pináculos en las esquinas rematados con bolas doradas.
add({ id: 'arc_triomf', nombre: 'Arc de Triomf', nivel: 'A', x: 13099.5, z: 14491.5, rot: 133, alto: 29.5, ancho: 29.5, largo: 10.4,
  noche: 'focos', edificios: [118700, 119009, 119010],
  build(B, h, L) {
    const W = 29.5, D = 10, LAD = [164, 80, 58], LAD2 = [138, 64, 48], PIE = [206, 186, 152], ORO = [206, 168, 84];
    const aL = L.aux.ladrillo(0.3, 0.6), aP = L.aux.piedra(0.55, 1.1);
    // cuerpo: arco de medio punto de 10,5 m de luz con la clave a 20 m (arranca 1 m bajo tierra por si hay pendiente)
    L.arco(B, 0, 0, -1, W, D, 24.5, 10.5, 21, { col: LAD, k: K.LADRILLO, aux: aL, pasos: 14 });
    // zócalo de piedra en los dos machones
    for (const s of [-1, 1]) L.caja(B, s * 10, 0, -1, 9.8, D + 0.5, 3.2, 0, PIE, K.PIEDRA, { aux: aP });
    // rosca del arco en piedra, por las dos caras
    const rosca = []; const ro = 5.95, ri = 5.25, ys = 20 - 5.25;
    for (let i = 0; i <= 12; i++) { const t = Math.PI * i / 12; rosca.push([Math.cos(t) * ro, ys + Math.sin(t) * ro]); }
    for (let i = 12; i >= 0; i--) { const t = Math.PI * i / 12; rosca.push([Math.cos(t) * ri, ys + Math.sin(t) * ri]); }
    for (const d of [D / 2 - 0.05, -D / 2 - 0.3]) L.extruir(B, rosca, d, d + 0.35, PIE, K.PIEDRA, { aux: aP });
    // friso de piedra clara sobre el vano y cornisa
    L.caja(B, 0, 0, 20.6, W + 0.4, D + 0.6, 2.8, 0, PIE, K.PIEDRA, { aux: aP });
    L.caja(B, 0, 0, 23.4, W + 0.9, D + 1.1, 0.6, 0, [190, 170, 140], K.PIEDRA);
    // ático de ladrillo y almenas escalonadas
    L.caja(B, 0, 0, 24, W, D, 2.2, 0, LAD2, K.LADRILLO, { aux: aL });
    for (const [x0, z0, x1, z1, n] of [[-W / 2, -D / 2, W / 2, -D / 2, 12], [-W / 2, D / 2, W / 2, D / 2, 12], [-W / 2, -D / 2, -W / 2, D / 2, 4], [W / 2, -D / 2, W / 2, D / 2, 4]])
      for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
        L.caja(B, x, z, 26.2, 0.9, 0.9, 1.3, 0, LAD, K.LADRILLO); L.caja(B, x, z, 27.5, 0.5, 0.5, 0.5, 0, LAD, K.LADRILLO); }
    // cuatro pináculos en las esquinas: pilastra, templete de piedra, cupulín y bola dorada
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * (W / 2 - 0.9), z = sz * (D / 2 - 0.9);
      L.caja(B, x, z, -1, 2.4, 2.4, 28.2, 0, LAD2, K.LADRILLO, { aux: aL });
      L.tambor(B, x, z, 28.2, 29.6, 1.05, { lados: 8, col: PIE, k: K.PIEDRA });
      L.cupula(B, x, z, 29.6, 1.15, 1.1, { lados: 8, anillos: 3, col: ORO, k: K.METAL });
      L.esfera(B, x, 31.2, z, 0.5, { gajos: 8, anillos: 5, col: ORO, k: K.METAL });
    }
  } });

})();
