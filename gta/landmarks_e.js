/* GTA Barcelona — HITOS, lote e (Collserola, la zona alta, Sants y la Fira, el aeropuerto y sueltos). Cada hito se declara
   con BCN_LM.add({...}) al cargar el script (ficha y constructor: DESARROLLO.md §10). Este fichero es SOLO del agente del lote e.
   Muchos constructores reutilizan la planta real de los datos (h.edif) y tienen una planta de reserva por si no llega. */
(function () {
'use strict';
const { add, lib: L, K } = window.BCN_LM;

// ------------------------------------------------------------------ utilidades locales del lote
const okP = p => Array.isArray(p) && p.length >= 3 && p.every(q => q && isFinite(q[0]) && isFinite(q[1]));
// edificios sustituidos con planta válida (h.edif puede venir vacío: sin datos o en tris.js)
const edifs = h => (h && Array.isArray(h.edif) ? h.edif : []).filter(e => e && e.plantas && okP(e.plantas[0]) && isFinite(e.alto));
const area = p => { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return Math.abs(a) / 2; };
const centro = p => { let x = 0, z = 0; for (const q of p) { x += q[0]; z += q[1]; } return [x / p.length, z / p.length]; };
const mayor = h => { let m = null; for (const e of edifs(h)) if (!m || area(e.plantas[0]) > area(m.plantas[0])) m = e; return m; };
const yT = (h, x, z) => { const v = h && h.y ? h.y(x, z) : 0; return isFinite(v) ? v : 0; };
// triángulo de esquinas redondeadas: R = distancia del centro a la punta, rc = radio del redondeo, a0 = rumbo de la 1.ª punta
function triRed(R, rc, a0, n) {
  n = n || 5; const o = [];
  for (let k = 0; k < 3; k++) { const ac = (a0 + k * 120) * Math.PI / 180, cx = Math.sin(ac) * (R - rc), cz = Math.cos(ac) * (R - rc);
    for (let i = 0; i <= n; i++) { const a = ac + (-60 + 120 * i / n) * Math.PI / 180; o.push([cx + Math.sin(a) * rc, cz + Math.cos(a) * rc]); } }
  return o;
}
// arco plano (lista de puntos 3D) en el plano vertical que pasa por (x, z) a lo largo de Z: luz, flecha, inclinación (grados, hacia +X)
function arcoPts(x, z0, z1, y0, flecha, incl, n) {
  const o = [], s = Math.sin(incl * Math.PI / 180), c = Math.cos(incl * Math.PI / 180);
  for (let i = 0; i <= n; i++) { const t = i / n, z = z0 + (z1 - z0) * t, hgt = flecha * 4 * t * (1 - t); o.push([x + hgt * s, y0 + hgt * c, z]); }
  return o;
}

// ================================================================== NIVEL A

// Torre de Collserola (Foster, 288 m). Silueta: fuste de hormigón finísimo; a media altura (84–152 m) el paquete de 13
// plataformas de planta triangular con las esquinas redondeadas, más anchas en el centro; encima, el mástil de antena rojo
// y blanco hasta 288 m. Rasgos: el paquete de plataformas, los vientos (pares de cables) que bajan desde las puntas del
// triángulo hasta el monte y suben hasta lo alto del fuste, y el mástil a franjas.
add({ id: 'torre_collserola', nombre: 'Torre de Collserola', nivel: 'A', x: 7580.5, z: 17458, y: 443.1, rot: 0, alto: 288, ancho: 40, largo: 40,
  noche: 'focos', edificios: [162670, 162671, 162672, 162673, 162674, 162675, 162676, 162677, 162678, 162679, 162680, 162681, 162682, 162683, 162684, 162685, 162686, 162687],
  build(B, h, L) {
    const HOR = [204, 204, 200], PLAT = [222, 224, 226], VID = [92, 108, 124], ROJO = [206, 60, 46], BLA = [240, 240, 236], CAB = [70, 72, 76];
    const A0 = 30, Y0 = 84, PASO = 5.4;
    // edificio de la base (planta baja de acceso, hormigón) y fuste troncocónico hasta 205 m
    L.prisma(B, triRed(16, 5, A0 + 60), -4, 6.5, [176, 176, 172], K.LISO, { aux: L.aux.liso(2.5) });
    L.tambor(B, 0, 0, -4, 205, 2.6, { r1: 1.8, lados: 20, col: HOR, k: K.LISO });
    // 13 plataformas: forjado claro + banda de vidrio retranqueada; la planta crece hasta la 5.ª y luego mengua (como los datos)
    const RR = [12.5, 14, 15.5, 16.5, 17.3, 17.3, 16.8, 16.3, 15.6, 14.8, 13.8, 12.8, 11.6];
    for (let i = 0; i < 13; i++) {
      const y = Y0 + i * PASO, R = RR[i] * 1.12, pl = triRed(R, R * 0.36, A0, 7);
      L.prisma(B, pl, y, y + 1.1, PLAT, K.METAL, { aux: L.aux.panel(2, 0.15, 0), suelo: true });
      if (i < 12) L.prisma(B, triRed(R - 1.2, R * 0.33, A0, 7), y + 1.1, y + PASO, i === 9 ? [150, 170, 186] : VID, K.CORTINA, { aux: L.aux.cortina(4.3, 1.6, 0.2), sinTecho: true });
    }
    // remate de las plataformas: corona técnica y el tramo del fuste por encima
    const YT = Y0 + 12 * PASO + 1.1;
    L.tambor(B, 0, 0, YT, YT + 4, 4.2, { r1: 2.6, lados: 12, col: [190, 192, 194], k: K.METAL });
    // mástil de antena a franjas rojas y blancas (205 → 288 m), cada vez más fino
    const prof = []; const N = 12, y0 = 205, y1 = 286;
    for (let i = 0; i < N; i++) { const a = y0 + (y1 - y0) * i / N, b = y0 + (y1 - y0) * (i + 1) / N, c = i % 2 ? BLA : ROJO,
      ra = 1.5 - 1.05 * i / N, rb = 1.5 - 1.05 * (i + 1) / N;
      prof.push([ra, a, c], [rb, b, c]); }
    prof.push([0, y1, ROJO]);
    L.rev(B, L.F0, 0, 0, prof, 12, ROJO, K.METAL);
    L.tambor(B, 0, 0, 286, 288.3, 0.25, { lados: 6, col: ROJO, k: K.METAL });
    // balizas (de noche se ven como puntos rojos)
    // grandes, para que de noche se lean desde toda la ciudad: tres en la antena y un anillo de cuatro en la corona
    for (const [yb, rb] of [[205, 2.2], [246, 2.0], [287.2, 2.6]]) L.esfera(B, 0, yb + 0.6, 0, rb, { gajos: 8, anillos: 5, col: [255, 36, 26], k: K.EMISIVO, aux: L.aux.emisivo(4, true) });
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; L.esfera(B, Math.cos(a) * 4.6, YT + 4.6, Math.sin(a) * 4.6, 1.6, { gajos: 6, anillos: 4, col: [255, 36, 26], k: K.EMISIVO, aux: L.aux.emisivo(4, true) }); }
    // anillos de luz blanca cálida en el borde de tres plataformas (la 1.ª, la del mirador y la última)
    for (const i of [0, 9, 12]) { const y = Y0 + i * PASO + 1.15, R = RR[i] * 1.12;
      L.prisma(B, triRed(R + 0.25, R * 0.36 + 0.1, A0, 7), y, y + 0.7, [255, 236, 200], K.EMISIVO, { aux: L.aux.emisivo(3, true), sinTecho: true }); }
    // vientos: por cada punta del triángulo, un par de cables de lo alto del fuste a la punta de arriba del paquete, y otro par
    // de la punta de abajo al monte (anclajes a ~95 m, a la cota del terreno)
    const R0 = RR[0] * 1.12 - 1.5, R12 = RR[12] * 1.12 - 1.5;
    for (let k = 0; k < 3; k++) {
      const a = (A0 + k * 120) * Math.PI / 180, sa = Math.sin(a), ca = Math.cos(a), px = ca, pz = -sa;
      for (const s of [-1, 1]) {
        const o = s * 1.1;
        L.bar(B, [px * o * 0.3, 203, pz * o * 0.3], [sa * R12 + px * o, YT, ca * R12 + pz * o], 0.22, CAB, K.METAL);
        const ax = sa * 95 + px * o * 3, az = ca * 95 + pz * o * 3, ay = yT(h, ax, az);
        L.bar(B, [sa * R0 + px * o, Y0, ca * R0 + pz * o], [ax, ay + 0.5, az], 0.22, CAB, K.METAL);
        L.caja(B, ax, az, ay - 1.5, 3, 3, 2.3, (A0 + k * 120), [150, 150, 146], K.LISO);
      }
      // vientos bajos: del fuste (60 m) a anclajes más cercanos, entre las puntas
      const b = a + Math.PI / 3, bx = Math.sin(b) * 60, bz = Math.cos(b) * 60, by = yT(h, bx, bz);
      L.bar(B, [0, 62, 0], [bx, by + 0.5, bz], 0.18, CAB, K.METAL);
      L.caja(B, bx, bz, by - 1.5, 2.4, 2.4, 2, 0, [150, 150, 146], K.LISO);
    }
  } });

// Temple del Sagrat Cor (Tibidabo). Silueta: cripta ancha de piedra oscura; encima, la iglesia neogótica de piedra clara
// con cuatro torres-pináculo; en el centro, una torre-linterna que sube hasta la estatua dorada del Sagrado Corazón con
// los brazos abiertos (≈ 70 m). Rasgos: la estatua dorada arriba, las agujas, el contraste piedra oscura / clara.
// La fachada (y la estatua) miran a +Z (rumbo 103°, hacia la ciudad y el funicular).
add({ id: 'sagrat_cor', nombre: 'Temple del Sagrat Cor', nivel: 'A', x: 7959.3, z: 17987.7, y: 510, rot: 103, alto: 72, ancho: 57, largo: 75,
  noche: 'focos', edificios: [176499, 176500, 176501, 176502, 176503],
  build(B, h, L) {
    const OSC = [128, 116, 100], OSC2 = [104, 94, 82], CLA = [218, 206, 182], CLA2 = [196, 184, 160], TEJ = [110, 108, 104], ORO = [222, 178, 70];
    const aP = L.aux.piedra(0.6, 1.2), aP2 = L.aux.piedra(0.45, 0.9);
    // explanada y cripta (iglesia baja), piedra oscura, con una arcada en la fachada y la escalinata
    L.caja(B, 0, 0, -6, 52, 68, 20, 0, OSC, K.PIEDRA, { aux: aP, techo: [150, 140, 126] });
    L.caja(B, 0, 0, 14, 53, 69, 0.9, 0, OSC2, K.PIEDRA);
    L.columnata(B, -17, 34.6, 17, 34.6, 0, 10, 7, 0.9, { col: OSC2, k: K.PIEDRA, lados: 8, entablamento: 1.6 });
    L.caja(B, 0, 34.6, 10, 37, 2.4, 4, 0, OSC, K.PIEDRA, { aux: aP });                                  // frontis sobre la arcada
    for (let i = 0; i < 4; i++) L.caja(B, 0, 37 + i * 1.6, -3, 30 - i * 2, 1.6, 3 - i * 0.7, 0, [150, 140, 126], K.PIEDRA);  // escalinata
    for (const s of [-1, 1]) L.caja(B, s * 22.5, 31, -6, 7, 7, 24, 0, OSC2, K.PIEDRA, { aux: aP });   // torreones de la cripta
    // iglesia alta: planta de cruz (nave a lo largo de Z y crucero), piedra clara, tejados a dos aguas
    const cx = -2, cz = 2;
    L.caja(B, cx, cz, 14.5, 22, 50, 15, 0, CLA, K.PIEDRA, { aux: aP2 });
    L.caja(B, cx, cz + 2, 14.5, 40, 16, 13.5, 0, CLA, K.PIEDRA, { aux: aP2 });
    // ventanales apuntados de la iglesia alta (un hueco alto por crujía) y pináculos a lo largo de los muros
    L.caja(B, cx, cz, 17, 22.3, 50.3, 10, 0, CLA, K.VENTANAS, { aux: L.aux.ventanas(10, 5.5, 0.32, 0.85), sinTecho: true });
    L.caja(B, cx, cz + 2, 17, 40.3, 16.3, 9, 0, CLA, K.VENTANAS, { aux: L.aux.ventanas(9, 4.5, 0.32, 0.85), sinTecho: true });
    for (const s of [-1, 1]) for (let i = 0; i < 9; i++) { const pz = cz - 22 + i * 5.5; if (Math.abs(pz - cz - 2) < 9) continue;
      L.aguja(B, cx + s * 11.2, pz, 29.5, 5, 0.6, { lados: 4, pasos: 2, pot: 1, exp: 1, col: CLA2, k: K.PIEDRA }); }
    for (const s of [-1, 1]) L.aguja(B, cx + s * 20.2, cz + 2, 28, 6, 0.8, { lados: 4, pasos: 2, pot: 1, exp: 1, col: CLA2, k: K.PIEDRA });
    // rosetón de la fachada
    L.tube(B, L.F0, [[cx, 23.5, cz + 25], [cx, 23.5, cz + 25.35]], 3.2, 16, [86, 80, 88], K.LISO, { caps: true });
    L.cubierta(B, cx, cz, 29.5, 22, 50, 7, { tipo: 'dos', col: TEJ, colHastial: CLA2, kHastial: K.PIEDRA });
    L.cubierta(B, cx, cz + 2, 28, 40, 16, 6, { tipo: 'dos', ang: 90, col: TEJ, colHastial: CLA2, kHastial: K.PIEDRA });
    // cuatro torres-pináculo en los ángulos de la cruz y dos en la fachada
    for (const [px, pz, hh] of [[-9, -16, 40], [5, -16, 40], [-9, 17, 42], [5, 17, 42], [-13, 26.5, 46], [9, 26.5, 46]]) {
      L.tambor(B, px, pz, 14.5, hh, 2.1, { lados: 8, col: CLA, k: K.PIEDRA, aux: aP2 });
      L.aguja(B, px, pz, hh, 9, 2.3, { lados: 8, pasos: 3, pot: 1, exp: 1, col: CLA2, k: K.PIEDRA });
    }
    // torre central: cuerpo cuadrado con pináculos en las esquinas, linterna octogonal y pedestal de la estatua
    L.caja(B, cx, cz + 3, 29, 17, 19, 18.5, 0, CLA, K.PIEDRA, { aux: aP2, techo: CLA2 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1])
      L.aguja(B, cx + sx * 7.6, cz + 3 + sz * 8.6, 46, 9, 1.4, { lados: 6, pasos: 3, pot: 1, exp: 1, col: CLA2, k: K.PIEDRA });
    L.tambor(B, cx, cz + 3, 47.5, 56, 4.6, { r1: 4, lados: 8, col: CLA, k: K.PIEDRA, aux: aP2 });
    L.cupula(B, cx, cz + 3, 56, 4.4, 2.2, { lados: 8, anillos: 2, col: CLA2, k: K.PIEDRA });
    L.tambor(B, cx, cz + 3, 57.5, 62.5, 1.9, { r1: 1.4, lados: 8, col: CLA, k: K.PIEDRA });
    // la estatua dorada (≈ 7,5 m): túnica, cabeza y brazos abiertos (a lo largo de X, mirando a +Z)
    const sx = cx, sz = cz + 3, SY = 62.5;
    // (algo exagerada, ×1,2, para que se lea de lejos)
    L.tambor(B, sx, sz, SY, SY + 6.4, 1.4, { r1: 0.75, lados: 12, col: ORO, k: K.METAL });
    L.esfera(B, sx, SY + 7.5, sz, 0.66, { gajos: 10, anillos: 6, col: ORO, k: K.METAL });
    for (const s of [-1, 1]) { L.bar(B, [sx + s * 0.5, SY + 6.0, sz], [sx + s * 4.2, SY + 4.7, sz + 0.6], 0.42, ORO, K.METAL);
      L.esfera(B, sx + s * 4.3, SY + 4.6, sz + 0.6, 0.45, { gajos: 6, anillos: 4, col: ORO, k: K.METAL }); }
  } });

// Hotel Porta Fira (Toyo Ito, 113 m). Silueta: torre de planta casi redonda que se ensancha hacia arriba y se tuerce,
// como una llama roja. Rasgos: el rojo, la piel de tubos verticales (aquí: la planta ondulada en 64 estrías) y el
// ensanchamiento con un ligero vaivén.
add({ id: 'hotel_porta_fira', nombre: 'Hotel Porta Fira', nivel: 'A', x: 8440.6, z: 10543.4, rot: 65, alto: 113, ancho: 38, largo: 38,
  noche: 'ventanas', edificios: [41345],
  build(B, h, L) {
    const NP = 64, niv = [], HT = 113;
    for (let j = 0; j <= 12; j++) {
      const y = j === 0 ? -1.5 : HT * j / 12, t = Math.max(0, y) / HT;
      const r = 12.2 + 6.2 * Math.pow(t, 1.6), tw = 22 * t, dx = 1.6 * Math.sin(t * Math.PI * 1.3), dz = -1.2 * Math.sin(t * Math.PI), el = 1 + 0.08 * Math.sin(t * Math.PI * 2);
      const pl = [];
      for (let i = 0; i < NP; i++) { const a = (i / NP * 360 + tw) * Math.PI / 180, rr = r * (i % 2 ? 1.02 : 0.985) * (1 + 0.05 * Math.sin(3 * a + t * 4));
        pl.push([dx + Math.cos(a) * rr * el, dz + Math.sin(a) * rr / el]); }
      niv.push([y, pl]);
    }
    L.loft(B, niv, [190, 36, 38], K.METAL, { aux: L.aux.panel(0.9, 0.25, 0.32), techo: [90, 40, 40] });
    // cubierta técnica y base acristalada (vestíbulo)
    L.tambor(B, 1.6 * Math.sin(Math.PI * 1.3), 0, HT, HT + 2.5, 8, { lados: 16, col: [120, 60, 58], k: K.LISO });
    L.tambor(B, 0, 0, -1.5, 5.5, 13.6, { lados: 24, col: [50, 56, 64], k: K.CORTINA, aux: L.aux.cortina(5, 2, 0.1), sinTapa: true });
  } });

// ================================================================== NIVEL B

// Parc d'Atraccions del Tibidabo: la noria de cestas de colores, la Talaia (brazo inclinado con cabina), el avión colgado
// de su torre, un tiovivo y los pabellones del parque (sus plantas reales, con tejado rojo).
add({ id: 'tibidabo_parc', nombre: "Parc d'Atraccions del Tibidabo", nivel: 'B', x: 8040.7, z: 17929.4, y: 495, rot: 0, alto: 30, ancho: 84, largo: 150,
  noche: 'focos', edificios: [176505, 176507, 176509, 176511, 176532, 176533, 176534, 176535, 176536, 176537, 176538, 176539, 176540, 176541,
    176542, 176543, 176544],
  build(B, h, L) {
    const COLS = [[214, 70, 56], [232, 196, 72], [43, 95, 168], [70, 150, 80], [236, 236, 230], [200, 90, 160]];
    // (los volúmenes de planta mínima son las antenas de la cumbre: en los datos salían como columnas blancas macizas;
    // se ocultan y se rehacen abajo como mástiles finos de metal gris)
    for (const e of edifs(h)) if (area(e.plantas[0]) > 60) L.prisma(B, e.plantas[0], e.y0 - 1, Math.max(e.y0 + 3, e.alto), [226, 214, 190], K.VENTANAS,
      { aux: L.aux.ventanas(3.4, 2.6, 0.4, 0.5), techo: [176, 76, 56], kTecho: K.TEJA });
    // noria: aro doble, radios, cestas de colores y caballete
    { const x0 = 14, z0 = 18, y0 = yT(h, x0, z0), R = 11, HC = R + 2.2, ring = [], ring2 = [];
      for (let i = 0; i < 28; i++) { const a = i / 28 * 2 * Math.PI; ring.push([x0 + Math.cos(a) * R, y0 + HC + Math.sin(a) * R, z0 - 0.9]); ring2.push([x0 + Math.cos(a) * R, y0 + HC + Math.sin(a) * R, z0 + 0.9]); }
      L.tube(B, L.F0, ring, 0.22, 4, [236, 236, 230], K.METAL, { closed: true });
      L.tube(B, L.F0, ring2, 0.22, 4, [236, 236, 230], K.METAL, { closed: true });
      for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * Math.PI, cx = x0 + Math.cos(a) * R, cy = y0 + HC + Math.sin(a) * R;
        L.bar(B, [x0, y0 + HC, z0], [cx, cy, z0], 0.1, [210, 210, 214], K.METAL);
        L.caja(B, cx, z0, cy - 2.3, 1.6, 1.6, 1.8, 0, COLS[i % COLS.length], K.METAL); }
      for (const s of [-1, 1]) { L.bar(B, [x0 - 4.5, y0 - 1, z0 + s * 2.5], [x0, y0 + HC, z0 + s * 1.2], 0.25, [200, 200, 204], K.METAL);
        L.bar(B, [x0 + 4.5, y0 - 1, z0 + s * 2.5], [x0, y0 + HC, z0 + s * 1.2], 0.25, [200, 200, 204], K.METAL); } }
    // Talaia: torre roja y brazo inclinado con la cabina en la punta, asomado a la ciudad
    { const x0 = 30, z0 = -14, y0 = yT(h, x0, z0);
      L.tambor(B, x0, z0, y0 - 1.5, y0 + 20, 1.6, { r1: 1.1, lados: 8, col: [196, 52, 44], k: K.METAL });
      const tip = [x0 + 14, y0 + 36, z0 - 6];
      L.bar(B, [x0, y0 + 19, z0], tip, 0.55, [210, 210, 214], K.METAL);
      L.cupula(B, tip[0], tip[2], tip[1] - 3, 2.6, 1.8, { lados: 10, anillos: 2, col: [196, 52, 44], k: K.METAL });
      L.tambor(B, tip[0], tip[2], tip[1] - 5.5, tip[1] - 3, 2.4, { lados: 10, col: [236, 220, 170], k: K.CORTINA, aux: L.aux.cortina(2.5, 1, 0.1) }); }
    // avió: torre con brazo y el avión rojo colgado
    { const x0 = 8, z0 = -46, y0 = yT(h, x0, z0), AY = y0 + 16;
      L.tambor(B, x0, z0, y0 - 1.5, AY, 0.9, { r1: 0.6, lados: 8, col: [214, 214, 210], k: K.METAL });
      L.bar(B, [x0, AY, z0], [x0 + 12, AY + 1, z0], 0.3, [214, 214, 210], K.METAL);
      const px = x0 + 12, py = AY - 5, pz = z0;
      L.bar(B, [px, AY + 1, pz], [px, py + 0.8, pz], 0.08, [80, 80, 84], K.METAL);
      L.tube(B, L.F0, [[px, py, pz - 4.5], [px, py, pz - 2], [px, py, pz + 2.5], [px, py + 0.3, pz + 4.2]], t => t < 0.05 ? 0.25 : (t > 0.9 ? 0.4 : 0.9), 8, [200, 40, 36], K.METAL, { caps: true });
      L.caja(B, px, pz - 0.8, py - 0.15, 11, 1.7, 0.3, 0, [200, 40, 36], K.METAL);
      L.caja(B, px, pz + 3.7, py + 0.2, 4, 1, 0.25, 0, [200, 40, 36], K.METAL);
      L.caja(B, px, pz + 3.9, py + 0.3, 0.25, 1.1, 1.8, 0, [200, 40, 36], K.METAL); }
    // antenas de la cumbre (posiciones de los datos, relativas al parque): fuste metálico fino que adelgaza, con plataformas
    for (const [x, z, alto, r] of [[-36.8, 139.3, 54, 1.3], [-20.9, 281.6, 100, 2.4], [-21.5, 321.2, 36, 0.9], [-16.5, 295.1, 43, 0.9]]) {
      const y = yT(h, x, z), GRI = [138, 140, 146];
      L.tambor(B, x, z, y - 1.5, y + alto * 0.75, r, { r1: r * 0.55, lados: 8, col: GRI, k: K.METAL });
      L.tambor(B, x, z, y + alto * 0.75, y + alto, r * 0.3, { r1: r * 0.12, lados: 6, col: [190, 70, 60], k: K.METAL });
      for (const f of [0.45, 0.68]) L.tambor(B, x, z, y + alto * f, y + alto * f + 1.2, r * 1.9, { lados: 8, col: GRI, k: K.METAL });
    }
    // tiovivo
    { const x0 = -6, z0 = 0, y0 = yT(h, x0, z0);
      L.tambor(B, x0, z0, y0 - 1, y0 + 0.6, 7, { lados: 16, col: [236, 220, 180], k: K.LISO });
      L.tambor(B, x0, z0, y0 + 0.6, y0 + 4, 0.6, { lados: 8, col: [232, 196, 72], k: K.METAL });
      L.aguja(B, x0, z0, y0 + 4, 3.4, 7.2, { lados: 16, pasos: 2, pot: 1, exp: 1, cols: [[0, '#d24b3a'], [0.5, '#f2f2ee'], [1, '#d24b3a']], k: K.LISO }); }
  } });

// Observatori Fabra: edificio modernista claro de dos plantas en la ladera, con la torre de la cúpula plateada del
// telescopio en el extremo este.
add({ id: 'observatori_fabra', nombre: 'Observatori Fabra', nivel: 'B', x: 8402.7, z: 17577.2, y: 406.5, rot: 93, alto: 22, ancho: 17, largo: 31,
  noche: 'focos', edificios: [162698, 162699],
  build(B, h, L) {
    const CL = [230, 220, 196], CL2 = [204, 190, 164], PLATA = [196, 200, 206];
    L.caja(B, 0, -2, -6, 15, 26, 17, 0, CL, K.VENTANAS, { aux: L.aux.ventanas(4.6, 3.2, 0.38, 0.55), techo: CL2 });
    L.caja(B, 0, -2, 11, 15.8, 26.8, 0.8, 0, CL2, K.LISO);
    L.caja(B, 0, 9, -6, 11, 9, 20.5, 0, CL, K.VENTANAS, { aux: L.aux.ventanas(4.6, 3, 0.35, 0.5), techo: CL2 });
    L.tambor(B, 0, 9, 14.5, 16.8, 4.6, { lados: 20, col: CL2, k: K.LISO });
    L.cupula(B, 0, 9, 16.8, 4.7, 4.4, { lados: 20, anillos: 6, col: PLATA, k: K.METAL, aux: L.aux.panel(1.2, 0.15, 0) });
    L.caja(B, 0, 9, 19.5, 0.9, 6, 1.9, 0, [120, 124, 130], K.METAL);                // rendija del telescopio
  } });

// Monestir de Pedralbes: el conjunto gótico (plantas reales, piedra dorada y teja), con la iglesia de una nave y el
// campanario octogonal.
add({ id: 'monestir_pedralbes', nombre: 'Monestir de Pedralbes', nivel: 'B', x: 7375.2, z: 15055.7, rot: 41, alto: 44, ancho: 94, largo: 120,
  noche: 'focos', edificios: [104726, 104728, 104729, 104731, 104737, 104738, 104742, 104743, 105103],
  build(B, h, L) {
    const PI = [201, 180, 138], PI2 = [180, 160, 120], TJ = [168, 92, 64];
    const ed = edifs(h);
    for (const e of ed) L.prisma(B, e.plantas[0], e.y0 - 1, Math.min(e.alto, 14), PI, K.PIEDRA, { aux: L.aux.piedra(0.5, 1.1), techo: TJ, kTecho: K.TEJA });
    if (!ed.length) L.caja(B, 0, 0, -1, 80, 66, 13, 0, PI, K.PIEDRA, { techo: TJ, kTecho: K.TEJA });
    // iglesia: nave alta con tejado a dos aguas (sobre el volumen 105103, a lo largo de Z) y contrafuertes
    const nx = 33, nz = -24;
    L.caja(B, nx, nz, -2, 13, 46, 27, 0, [214, 196, 156], K.PIEDRA, { aux: L.aux.piedra(0.5, 1.1) });
    L.cubierta(B, nx, nz, 25, 14, 47, 6, { tipo: 'dos', col: TJ, colHastial: PI2, kHastial: K.PIEDRA });
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) L.caja(B, nx + s * 7.4, nz - 20 + i * 8, -2, 1.8, 1.6, 23, 0, PI2, K.PIEDRA);
    // campanario octogonal junto a la cabecera, con su terraza y el remate
    const cx = 22, cz = -1;
    L.tambor(B, cx, cz, -2, 40, 3.8, { lados: 8, col: [214, 196, 156], k: K.PIEDRA, aux: L.aux.piedra(0.5, 1.0) });
    L.tambor(B, cx, cz, 33, 40, 4.0, { lados: 8, col: [214, 196, 156], k: K.VENTANAS, aux: L.aux.ventanas(7, 3.2, 0.5, 0.75) });
    L.tambor(B, cx, cz, 40, 41, 4.4, { lados: 8, col: PI2, k: K.PIEDRA });
    L.piramide(B, cx, cz, 41, 2.6, 2.6, 2.2, { col: PI2, k: K.PIEDRA });
    // claustro: patio ajardinado con la galería de tres pisos de arcos alrededor (en el centro del conjunto)
    { const qx = -8, qz = 8, Q = 34, y = yT(h, qx, qz);
      L.caja(B, qx, qz, y - 1, Q - 8, Q - 8, 1.3, 0, [96, 132, 76], K.CESPED);
      for (const [dx, dz, w, l] of [[0, -(Q - 4) / 2, Q, 4], [0, (Q - 4) / 2, Q, 4], [-(Q - 4) / 2, 0, 4, Q - 8], [(Q - 4) / 2, 0, 4, Q - 8]])
        L.caja(B, qx + dx, qz + dz, y - 1, w, l, 12, 0, [224, 210, 176], K.VENTANAS, { aux: L.aux.ventanas(4, 2.2, 0.7, 0.7), techo: TJ, kTecho: K.TEJA }); }
  } });

// Palau Reial de Pedralbes: palacio italianizante blanco y ocre en U (planta real), de tres plantas con cornisa y
// balaustrada, abierto al jardín hacia la Diagonal.
add({ id: 'palau_pedralbes', nombre: 'Palau Reial de Pedralbes', nivel: 'B', x: 7776.9, z: 14249.9, rot: 59, alto: 20, ancho: 38, largo: 130,
  noche: 'focos', edificios: [89896, 89898, 89903, 89909, 89910],
  build(B, h, L) {
    const BL = [238, 230, 214], OC = [206, 180, 132];
    const m = mayor(h), ed = edifs(h);
    if (m) {
      L.prisma(B, m.plantas[0], m.y0 - 1, 2.5, OC, K.PIEDRA, { aux: L.aux.piedra(0.6, 1.4), sinTecho: true });
      L.prisma(B, m.plantas[0], 2.5, 15.5, BL, K.VENTANAS, { aux: L.aux.ventanas(4.3, 3.4, 0.38, 0.6), sinTecho: true });
      L.prisma(B, m.plantas[0], 15.5, 17, OC, K.LISO, { techo: [176, 112, 84], kTecho: K.TEJA });
      L.prisma(B, m.plantas[0], 17, 18.1, BL, K.LISO, { sinTecho: true });
      for (const e of ed) if (e !== m) L.prisma(B, e.plantas[0], e.y0 - 1, Math.max(e.y0 + 3, e.alto), BL, K.VENTANAS, { aux: L.aux.ventanas(3.6, 3, 0.4, 0.55), techo: [176, 112, 84] });
    } else {
      L.caja(B, -12, 0, -1, 14, 120, 17, 0, BL, K.VENTANAS, { aux: L.aux.ventanas(4.3, 3.4, 0.38, 0.6) });
      for (const s of [-1, 1]) L.caja(B, 5, s * 52, -1, 26, 16, 17, 0, BL, K.VENTANAS, { aux: L.aux.ventanas(4.3, 3.4, 0.38, 0.6) });
    }
    // cuerpo central algo más alto con su frontón (en el lado del patio de honor, +X)
    const cx = m ? centro(m.plantas[0])[0] : -12;
    L.caja(B, cx - 2, 0, 15, 16, 22, 5, 0, BL, K.VENTANAS, { aux: L.aux.ventanas(4.3, 3.4, 0.38, 0.6), techo: [176, 112, 84] });
    L.cubierta(B, cx - 2, 0, 20, 16, 22, 2.6, { tipo: 'cuatro', col: [150, 90, 70] });
  } });

// Búnquers del Carmel: las plataformas circulares de hormigón de la batería antiaérea en la cima del Turó de la Rovira.
// No hay volumen en los datos: no oculta nada.
add({ id: 'bunquers_carmel', nombre: 'Búnquers del Carmel', nivel: 'C', x: 11548.8, z: 17657.6, rot: 0, alto: 3, ancho: 60, largo: 80,
  noche: 'nada', edificios: [], sombra: false,
  build(B, h, L) {
    const HO = [172, 168, 160], HO2 = [140, 136, 128];
    for (const [x, z] of [[-14, -16], [2, -20], [17, -12], [-8, 4], [12, 6]]) {
      const y = yT(h, x, z);
      L.tambor(B, x, z, y - 1.5, y + 0.7, 6.2, { lados: 18, col: HO, k: K.LISO, aux: L.aux.liso(0) });
      L.anillo(B, x, z, 4.2, 5.4, y + 1.6, { lados: 18, col: HO2, k: K.LISO, y1: y + 0.7 });
      L.disco(B, x, z, 4.3, y + 0.75, { lados: 14, col: [120, 116, 108], k: K.LISO });
    }
    const y = yT(h, 0, 18);
    L.caja(B, 0, 18, y - 1.5, 22, 9, 2.6, 8, HO, K.LISO);                    // la plataforma rectangular del mirador
  } });

// Estació de Sants: zócalo enorme y bajo (la losa de las vías), el cuerpo de la estación y el hotel encima (plantas
// reales); delante, en la Plaça dels Països Catalans, la marquesina plana sobre pilares finos.
add({ id: 'estacio_sants', nombre: 'Estació de Sants', nivel: 'B', x: 9700.7, z: 13205.4, rot: 51, alto: 43, ancho: 136, largo: 150,
  noche: 'ventanas', edificios: [74236, 74354, 74355, 74356, 74357],
  build(B, h, L) {
    const GR = [146, 146, 142], GR2 = [196, 192, 184];
    const ed = edifs(h);
    for (const e of ed) {
      const p = e.plantas[0], top = Math.max(e.y0 + 3, e.alto);
      if (e.y0 < 1) L.prisma(B, p, e.y0 - 1, top, GR, K.LISO, { aux: L.aux.liso(4), techo: [120, 120, 118] });
      else if (top < 25) L.prisma(B, p, e.y0, top, GR, K.VENTANAS, { aux: L.aux.ventanas(4.5, 3.5, 0.7, 0.35), techo: [110, 110, 108] });
      else L.prisma(B, p, e.y0, top, GR2, K.VENTANAS, { aux: L.aux.ventanas(3.2, 2.6, 0.5, 0.5), techo: [130, 130, 128] });
    }
    if (!ed.length) { L.caja(B, 0, 0, -1, 136, 150, 4.8, 0, GR, K.LISO); L.caja(B, 0, -22, 3.5, 105, 50, 16, 0, GR, K.VENTANAS); }
    // marquesina de la plaza (delante de la fachada noroeste, −X): losa fina a 15 m sobre pilares
    const mx = -98, mz = -18;
    L.caja(B, mx, mz, 14.2, 38, 70, 1.4, 0, [226, 228, 230], K.METAL, { aux: L.aux.panel(4, 0.1, 0) });
    L.caja(B, mx, mz, 15.6, 39, 71, 0.5, 0, [200, 202, 206], K.METAL);
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
      const px = mx + s * 12, pz = mz - 27 + i * 18, y = yT(h, px, pz);
      L.tambor(B, px, pz, y - 1, 14.2, 0.35, { lados: 6, col: [120, 122, 126], k: K.METAL });
    }
  } });

// Hotel Torre Catalunya: prisma de vidrio de 115 m junto a la estación (planta real del volumen principal).
add({ id: 'hotel_torre_catalunya', nombre: 'Hotel Torre Catalunya', nivel: 'B', x: 9898.3, z: 13258.6, rot: 46, alto: 115, ancho: 16, largo: 46,
  noche: 'ventanas', edificios: [74364, 75227, 75229],
  build(B, h, L) {
    const VI = [118, 146, 176], m = mayor(h);
    const pl = m ? m.plantas[0] : L.rect(16, 46);
    L.prisma(B, pl, -1.5, 108, VI, K.CORTINA, { aux: L.aux.cortina(3.4, 1.5, 0.3), techo: [110, 112, 116] });
    L.prisma(B, L.mover(pl, 0, 0, 0, 0.82), 108, 115, [214, 218, 216], K.METAL, { aux: L.aux.panel(1.5, 0.1, 0) });
    for (const e of edifs(h)) if (e !== m && e.y0 < 5) L.prisma(B, e.plantas[0], e.y0 - 1, Math.min(e.alto, 18), [200, 204, 204], K.CORTINA, { aux: L.aux.cortina(4.2, 1.5, 0.2) });
  } });

// Parc de l'Espanya Industrial: la hilera de torres-faro blancas sobre las gradas (en la posición de cada pilar de los datos).
add({ id: 'espanya_industrial', nombre: "Parc de l'Espanya Industrial", nivel: 'B', x: 9753.5, z: 13094, rot: 65, alto: 30, ancho: 35, largo: 160,
  noche: 'focos', edificios: [74242, 74346, 74347, 74348, 74349, 74350, 74351, 74352],
  build(B, h, L) {
    const BL = [240, 240, 236];
    let pos = edifs(h).map(e => centro(e.plantas[0]));
    if (!pos.length) pos = [-80, -57, -35, -14, 6, 27, 61, 77].map((z, i) => [i % 2 ? 6 : 10, z]);
    pos.forEach(([x, z], i) => {
      const y = yT(h, x, z), H = 25 + (i % 3) * 2;
      L.caja(B, x, z, y - 1.5, 3.6, 3.6, H * 0.72 + 1.5, 0, BL, K.LISO);
      L.caja(B, x, z, y + H * 0.72, 2.4, 2.4, H * 0.2, 0, BL, K.LISO);
      L.caja(B, x, z, y + H * 0.92, 3.4, 3.4, 0.5, 0, [200, 200, 196], K.METAL);
      L.caja(B, x, z, y + H * 0.92 + 0.5, 2.0, 2.0, 1.4, 0, [255, 236, 190], K.EMISIVO, { aux: L.aux.emisivo(2, true) });
      L.piramide(B, x, z, y + H * 0.92 + 1.9, 2.8, 2.8, 1.4, { col: [190, 190, 186], k: K.METAL });
    });
  } });

// L'Auditori (Moneo): bloque gris de hormigón con la retícula de la fachada y los paneles de acero oxidado; el cubo de
// luz (el lucernario) asoma por encima.
add({ id: 'auditori', nombre: "L'Auditori", nivel: 'B', x: 13518, z: 15309.2, rot: 135, alto: 25, ancho: 52, largo: 173,
  noche: 'nada', edificios: [139573, 139575, 139576],
  build(B, h, L) {
    const GR = [158, 152, 142], OX = [140, 96, 66];
    const m = mayor(h), ed = edifs(h);
    const pl = m ? m.plantas[0] : L.rect(52, 173);
    L.prisma(B, pl, -1.5, 3.5, [120, 116, 110], K.LISO, { sinTecho: true });
    L.prisma(B, pl, 3.5, 18, OX, K.METAL, { aux: L.aux.panel(3.6, 0.3, 0), techo: GR, kTecho: K.LISO });
    // la retícula de hormigón: pilastras y fajas sobre los paneles
    const n = pl.length;
    for (let i = 0; i < n; i++) { const a = pl[i], b = pl[(i + 1) % n], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 6) continue;
      const k = Math.max(1, Math.round(len / 7.2)), ang = Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI;
      for (let j = 0; j <= k; j++) { const t = j / k; L.caja(B, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 3.5, 0.9, 0.9, 14.5, ang, GR, K.LISO); } }
    for (const y of [3.5, 10.7, 17.2]) L.prisma(B, L.mover(pl, 0, 0, 0, 1.006), y, y + 0.8, GR, K.LISO, { sinTecho: true });
    const cubo = ed.find(e => e !== m && e.alto > 16);
    const cp = cubo ? cubo.plantas[0] : L.mover(L.rect(25, 27), 0, -25);
    L.prisma(B, cp, 18, 25, [214, 222, 224], K.CORTINA, { aux: L.aux.cortina(3.5, 1.2, 0.15), techo: [200, 200, 196] });
  } });

// Teatre Nacional de Catalunya (Bofill): templo moderno: caja de vidrio rodeada de columnas de hormigón ocre, con el
// gran tejado a dos aguas y los frontones en los extremos, sobre un podio con escalinata.
add({ id: 'tnc', nombre: 'Teatre Nacional de Catalunya', nivel: 'B', x: 13530.2, z: 15481.7, rot: 136, alto: 27, ancho: 59, largo: 99,
  noche: 'focos', edificios: [139560, 139563, 139566],
  build(B, h, L) {
    const OC = [214, 195, 156], OC2 = [190, 170, 132], VI = [128, 156, 176];
    const W = 58, D = 98;
    L.caja(B, 0, 0, -5, W, D, 6, 0, OC2, K.PIEDRA, { aux: L.aux.piedra(0.5, 1.4) });
    for (let i = 0; i < 4; i++) L.caja(B, 0, -D / 2 - 1 - i * 1.5, -3, W - 6, 1.5, 4 - i, 0, OC2, K.PIEDRA);   // escalinata (frente −Z)
    L.caja(B, 0, 2, 1, W - 9, D - 10, 17, 0, VI, K.CORTINA, { aux: L.aux.cortina(4.2, 2.4, 0.15) });
    L.columnata(B, -W / 2 + 1.2, -D / 2 + 1.2, W / 2 - 1.2, -D / 2 + 1.2, 1, 18, 10, 0.95, { col: OC, k: K.LISO, lados: 10, entablamento: 2 });
    L.columnata(B, -W / 2 + 1.2, D / 2 - 1.2, W / 2 - 1.2, D / 2 - 1.2, 1, 18, 10, 0.95, { col: OC, k: K.LISO, lados: 10, entablamento: 2 });
    for (const s of [-1, 1]) L.columnata(B, s * (W / 2 - 1.2), -D / 2 + 1.2, s * (W / 2 - 1.2), D / 2 - 1.2, 1, 18, 15, 0.95, { col: OC, k: K.LISO, lados: 10, entablamento: 2 });
    L.caja(B, 0, 0, 19, W + 1, D + 1, 1.6, 0, OC, K.LISO);
    L.cubierta(B, 0, 0, 20.6, W + 1.5, D + 1.5, 8, { tipo: 'dos', col: [160, 156, 150], colHastial: OC, kHastial: K.LISO, vuelo: 0.5 });
  } });

// Mistos (Oldenburg): cerillas gigantes: una de pie, inclinada, con la llama; otras tiradas por el suelo, de colores.
add({ id: 'mistos', nombre: 'Mistos', nivel: 'B', x: 10168, z: 18482, rot: 0, alto: 21, ancho: 12, largo: 24,
  noche: 'nada', edificios: [],
  build(B, h, L) {
    const AM = [232, 196, 72], RO = [210, 72, 56], AZ = [43, 95, 168];
    const tip = [6, 19, 1];
    L.bar(B, [0, -1, 0], tip, 0.75, AM, K.LISO);
    L.esfera(B, tip[0] + 0.25, tip[1] + 0.6, tip[2], 1.4, { gajos: 10, anillos: 6, sy: 1.4, col: RO, k: K.LISO });
    L.aguja(B, tip[0] + 0.5, tip[2], tip[1] + 1.4, 4.6, 1.3, { lados: 8, pasos: 4, pot: 1, exp: 0.7, sz: 0.45, cols: [[0, '#2b5fa8'], [0.3, '#e8c547'], [1, '#d24b3a']], k: K.LISO });
    for (const [x0, z0, x1, z1, c] of [[-2, -5, 8, -9, AZ], [-6, 6, 7, 10, AM], [2, 3, 12, -2, RO]]) {
      const y0 = yT(h, x0, z0) + 0.5, y1 = yT(h, x1, z1) + 0.5;
      L.bar(B, [x0, y0, z0], [x1, y1, z1], 0.5, c, K.LISO);
      L.esfera(B, x1 + (x1 - x0) * 0.04, y1 + 0.1, z1 + (z1 - z0) * 0.04, 0.8, { gajos: 8, anillos: 5, sy: 0.8, col: c === RO ? [40, 36, 34] : RO, k: K.LISO });
    }
  } });

// Pont de Bac de Roda (Calatrava): tablero sobre las vías y, a cada lado de la calzada, un par de arcos blancos (uno
// vertical y otro inclinado hacia fuera) con péndolas. El paso va de Bac de Roda a Felip II (rumbo 135°, perpendicular a
// las vías; el catálogo decía 45°).
add({ id: 'pont_bac_de_roda', nombre: 'Pont de Bac de Roda', nivel: 'B', x: 14107.7, z: 17278, rot: 135, alto: 24, ancho: 34, largo: 130,
  noche: 'focos', edificios: [], sombra: true,
  build(B, h, L) {
    const BL = [240, 240, 234], GR = [170, 170, 168];
    L.caja(B, 0, 0, -1.6, 26, 130, 1.6, 0, GR, K.LISO, { techo: [96, 96, 98] });
    L.caja(B, 0, 0, -2.6, 12, 126, 1.0, 0, BL, K.LISO);
    for (const s of [-1, 1]) {
      L.caja(B, s * 12.6, 0, 0, 0.6, 130, 1.1, 0, BL, K.METAL);                      // barandillas
      // arcos más gruesos y algo más altos que los reales para que se lean desde lejos (blanco brillante sobre el gris)
      const vert = arcoPts(s * 6.5, -31, 31, 0, 23, 0, 20), incl = arcoPts(s * 7.5, -31, 31, 0, 22, s * 26, 20);
      L.tube(B, L.F0, vert, 1.5, 10, BL, K.LISO);
      L.tube(B, L.F0, incl, 1.3, 10, BL, K.LISO);
      for (let i = 3; i < 18; i += 3) L.bar(B, vert[i], incl[i], 0.35, BL, K.LISO);
      for (let i = 2; i < 19; i += 2) { L.bar(B, vert[i], [s * 6.5, 0, vert[i][2]], 0.12, [210, 210, 210], K.METAL);
        L.bar(B, incl[i], [s * 12.2, 0, incl[i][2]], 0.12, [210, 210, 210], K.METAL); }
      for (const z of [-31, 31]) L.caja(B, s * 8, z, -8, 6, 6, 8.6, 0, BL, K.LISO);        // estribos
    }
  } });

// Aeroport (Terminal 1): la nave larguísima (planta real) con muro cortina y la cubierta clara ondulada. La torre de
// control no está en los datos y su posición no es fiable: no se modela.
add({ id: 'aeroport', nombre: 'Aeroport · Terminal 1', nivel: 'B', x: 4285.4, z: 3345.4, rot: 66, alto: 24, ancho: 499, largo: 1099,
  noche: 'ventanas', edificios: [605, 606, 607],
  build(B, h, L) {
    const VI = [128, 150, 170], CU = [226, 228, 226];
    const ed = edifs(h), m = mayor(h);
    const pl = m ? m.plantas[0] : L.rect(160, 1000);
    // cubierta ondulada: crestas cada 36 m a lo largo de la nave (las plantas de los datos tienen muchos vértices)
    const ola = (x, z) => 15.5 + 2.2 * Math.cos(z / 36 * 2 * Math.PI);
    L.prisma(B, pl, -1.5, 12.5, VI, K.CORTINA, { aux: L.aux.cortina(4.5, 2.5, 0.2), sinTecho: true });
    L.prisma(B, pl, 12.5, ola, CU, K.METAL, { aux: L.aux.panel(3, 0.08, 0), techo: CU, kTecho: K.METAL });
    for (const e of ed) if (e !== m) L.prisma(B, e.plantas[0], e.y0 - 1, Math.max(e.y0 + 3, e.alto), [200, 200, 196], K.VENTANAS, { aux: L.aux.ventanas(3.5, 3, 0.4, 0.5) });
  } });

// Torre Realia BCN: cilindro elíptico de vidrio claro junto al Hotel Porta Fira.
add({ id: 'torre_realia', nombre: 'Torre Realia BCN', nivel: 'B', x: 8412.5, z: 10609.2, rot: 15, alto: 112, ancho: 32, largo: 40,
  noche: 'ventanas', edificios: [41346],
  build(B, h, L) {
    const pl = L.elipse(16, 19.5, 40);
    L.prisma(B, pl, -1.5, 108, [178, 192, 204], K.CORTINA, { aux: L.aux.cortina(3.7, 1.4, 0.25), techo: [120, 124, 128] });
    for (const y of [4.5, 108]) L.prisma(B, L.mover(pl, 0, 0, 0, 1.02), y, y + (y > 100 ? 4 : 1.2), [214, 216, 218], K.METAL, { aux: L.aux.panel(1.4, 0.1, 0) });
  } });

// Ciutat de la Justícia (Chipperfield): bloques de colores pastel de distintas alturas (planta y altura de cada volumen de
// los datos; el color, por bloque).
add({ id: 'ciutat_justicia', nombre: 'Ciutat de la Justícia', nivel: 'B', x: 9049.2, z: 11551.8, rot: 61, alto: 52, ancho: 215, largo: 234,
  noche: 'ventanas', edificios: [50815, 50817, 51366, 51367, 51662, 51663, 51665, 51667, 51668, 51671, 51672, 51673, 51674, 51677, 51680, 51682, 51683, 51685,
    51686, 51687, 51690, 51693, 51694, 51696, 51697, 51698, 51700, 51703, 51705, 51706, 51708, 51709, 51711, 51712, 51713, 51716, 51873, 52019, 52020, 52021,
    52029, 52032, 52033],
  build(B, h, L) {
    const PAS = [[214, 195, 156], [216, 172, 162], [170, 192, 160], [176, 176, 172], [222, 206, 170], [196, 164, 150]];
    const ed = edifs(h);
    if (!ed.length) { [[-75, 45, 37, 70, 45], [25, 85, 40, 54, 44], [-30, -105, 160, 24, 44], [-77, -30, 58, 44, 51], [88, -100, 37, 23, 41]].forEach(([x, z, a, l, al], i) =>
      L.caja(B, x, z, -1.5, a, l, al, 0, PAS[i % PAS.length], K.VENTANAS, { aux: L.aux.ventanas(3.6, 2.2, 0.32, 0.5) })); return; }
    for (const e of ed) {
      const p = e.plantas[0], c = centro(p), small = area(p) < 60;
      const ci = Math.abs(Math.round(c[0] / 45) * 7 + Math.round(c[1] / 45) * 3) % PAS.length;     // un color por manzana
      L.prisma(B, p, e.y0 < 3 ? e.y0 - 1 : e.y0, Math.max(e.y0 + 1, e.alto), PAS[ci], small ? K.LISO : K.VENTANAS,
        { aux: small ? undefined : L.aux.ventanas(3.6, 2.2, 0.32, 0.5), techo: [150, 148, 144] });
    }
  } });

// Hesperia Tower (Rogers): lámina de hotel de vidrio con los núcleos laterales rojos y, en lo alto, la cúpula de vidrio
// del restaurante en voladizo.
add({ id: 'hesperia_tower', nombre: 'Hesperia Tower', nivel: 'B', x: 7018.8, z: 9558, rot: 136, alto: 112, ancho: 18, largo: 51,
  noche: 'ventanas', edificios: [26147],
  build(B, h, L) {
    const VI = [150, 164, 176], RO = [192, 44, 42], GR = [200, 198, 194];
    L.caja(B, 0, 0, -1.5, 18, 42, 102, 0, VI, K.CORTINA, { aux: L.aux.cortina(3.4, 1.5, 0.25), techo: GR });
    for (const s of [-1, 1]) {
      L.caja(B, 0, s * 23, -1.5, 9, 6, 106, 0, RO, K.METAL, { aux: L.aux.panel(2, 0.15, 0) });
      L.caja(B, s * 7.5, s * 22, -1.5, 3, 4, 104, 0, GR, K.METAL);
    }
    L.disco(B, 0, 6, 13.5, 103.5, { lados: 28, col: GR, k: K.METAL });
    L.tambor(B, 0, 6, 102, 103.5, 13.5, { lados: 28, col: GR, k: K.METAL });
    L.cupula(B, 0, 6, 103.5, 13, 8.5, { lados: 28, anillos: 6, col: [150, 182, 200], k: K.CORTINA, aux: L.aux.cortina(2.2, 1.6, 0.1) });
  } });

// Tres Xemeneies del Paral·lel: tres chimeneas de ladrillo de 72 m (en la posición de cada volumen de los datos).
add({ id: 'xemeneies_parallel', nombre: 'Tres Xemeneies', nivel: 'B', x: 12277.4, z: 12621.8, rot: 112, alto: 72, ancho: 8, largo: 56,
  noche: 'nada', edificios: [63105, 63106, 63107],
  build(B, h, L) {
    const LA = [178, 86, 60];
    let pos = edifs(h).map(e => centro(e.plantas[0]));
    if (!pos.length) pos = [[0, -24], [0, 0], [0, 24]];
    for (const [x, z] of pos) {
      const y = yT(h, x, z);
      L.caja(B, x, z, y - 1.5, 6.4, 6.4, 7.5, 0, [150, 70, 50], K.LADRILLO, { aux: L.aux.ladrillo(0.3, 0.6) });
      L.chimenea(B, x, z, y + 6, 66, 2.9, 1.7, { lados: 14, col: LA, k: K.LADRILLO, aux: L.aux.ladrillo(0.3, 0.6), bandas: [[58, 59, [150, 66, 48]], [63.5, 64.5, [150, 66, 48]]] });
    }
  } });

// Dona i Ocell (Miró): figura alargada de 22 m recubierta de trencadís, con la media luna arriba, sobre un estanque.
add({ id: 'dona_ocell', nombre: 'Dona i Ocell', nivel: 'B', x: 10271.6, z: 13051.2, rot: 0, alto: 22, ancho: 30, largo: 30,
  noche: 'focos', edificios: [],
  build(B, h, L) {
    L.caja(B, 0, 0, -1.2, 34, 22, 1.25, 0, [190, 186, 178], K.LISO, { techo: [70, 104, 116], kTecho: K.AGUA });
    L.rev(B, L.F0, 0, 0, [[2.3, -0.5], [2.6, 3], [2.4, 8], [1.9, 13], [1.5, 16], [1.7, 17.4], [0, 17.8]], 14, [236, 200, 64], K.TRENCADIS);
    // la «media luna» de arriba (dos cuernos) y el cilindro sobre ella
    const pts = []; for (let i = 0; i <= 10; i++) { const a = Math.PI * (0.1 + 0.8 * i / 10); pts.push([Math.cos(a) * 3, 17.6 + 3.2 - Math.sin(a) * 3.2 + 3.0, 0]); }
    L.tube(B, L.F0, pts, t => 0.35 + 0.6 * Math.sin(Math.PI * t), 8, [214, 70, 56], K.TRENCADIS, { caps: true });
    L.tambor(B, 0, 0, 17.5, 21, 0.8, { lados: 10, col: [60, 140, 90], k: K.TRENCADIS });
  } });

// ================================================================== NIVEL C

// Fabra i Coats: retoque de color (ladrillo) de las naves de la antigua fábrica.
add({ id: 'fabra_coats', nombre: 'Fabra i Coats', nivel: 'C', x: 13986.2, z: 19130.7, rot: 0, alto: 15, ancho: 115, largo: 165,
  noche: 'nada', edificios: [197803, 199008, 199027, 199047, 209994], ocultar: false, retoque: { color: '#b5543a' } });

})();
