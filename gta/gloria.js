/* GTA Barcelona · ENT2: la escalinata de la fachada de la Glòria y su eje hasta la Diagonal (Sagrada Família acabada)
   Trazado en data/sf_ent_gloria.json (ejes locales de la ficha sagrada_familia: +Z hacia Mallorca y la Diagonal, +X Passió).
   Del proyecto: plaza elevada sobre la calle de Mallorca con el tráfico por debajo (paso inferior decorado con el infierno y los
   vicios), escalinata de ≈57 m hacia la manzana de enfrente, Monumento al Fuego y al Agua (surtidor de 20 m que se abre en cuatro
   cascadas y el fuego), avenida de 60 m del PGM-1976 por las dos manzanas hasta la Diagonal. Interpretación: anchos, cotas,
   peldaños, rellanos, barandillas, relieves y el diseño del paseo (sf_ent_gloria.json: «fuente»).
   Tres fichas de hitos con el mismo centro y giro que la basílica (así los ejes locales son los del JSON):
     sf_gloria          losa sobre Mallorca, terraza, monumento, escalinata y muros (proyecta sombra; focos de noche)
     sf_gloria_detall   balaustradas, farolas, pasamanos, relieves y espuma: se quita a > 420 m (addLODLevel)
     sf_gloria_edificis los volúmenes del registro que pisan la franja de 60 m se ocultan y se rehace la parte que queda fuera,
                        cortada por la línea de la avenida con fachada nueva (ventanas encendidas de noche)
   El pavimento, los árboles, los bancos, las fuentes y las farolas de la explanada, del Passeig de la Glòria y de la placeta de la
   Diagonal son plazas singulares de plazas.js (mismo JSON). Cargar después de landmarks_e.js. */
(function () {
  const LM = window.BCN_LM; if (!LM) { console.warn('Glòria: sin BCN_LM'); return; }
  const { K } = LM;
  const C0 = [12597.9, 15875.2], ROT = 136;
  let D = null;
  const dataP = fetch('data/sf_ent_gloria.json').then(r => r.json()).then(d => (D = d)).catch(e => { console.warn('Glòria: sin data/sf_ent_gloria.json', e); return null; });
  // cotas absolutas: suelo del templo (como sagrada.js: la más alta bajo el ábside y el crucero) y calle de Mallorca
  const LV = {};
  function niveles(h) {
    const yb = h.yb, yA = h.y(-1.9, -55) + yb, yC = h.y(-1.9, -18.4) + yb, yM = h.y(0, 50.6) + yb;
    LV.yF = Math.max(yA, yC); LV.yM = yM;
    // el proyecto pone el pórtico 4-5 m sobre Mallorca; con la losa a +5,5 quedan ~4,1 m libres bajo los nervios del paso
    LV.yS = Math.max(LV.yF, yM + 5.5); return LV;
  }
  const PI = Math.PI, hs = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const ST = [200, 192, 176], STd = [176, 166, 150], STl = [214, 208, 194], BRZ = [86, 70, 50], DARK = [92, 84, 76];

  // ------------------------------------------------------------ la obra: losa, terraza, monumento, escalinata
  function obra(B, h, L) {
    const { yS, yF, yM } = niveles(h), yb = h.yb, Y = v => v - yb, G = (x, z) => h.y(x, z);
    const XW = D.franja_X, [zl0, zl1] = D.losa.Z, [zt0, zt1] = D.terraza.Z, [ze0, ze1] = D.escalinata.Z;
    const aP = L.aux.piedra(0.5, 1.0), aG = L.aux.piedra(0.6, 0.9);
    // --- losa sobre Mallorca (tablero, canto con cornisa) y pilas en las aceras
    const canto = D.losa.canto, yT = Y(yS);
    L.caja(B, 0, (zl0 + zl1) / 2, yT - canto, 2 * XW, zl1 - zl0, canto, 0, ST, K.PIEDRA, { aux: aG, techo: STl });
    for (const s of [-1, 1]) {                                                       // bocas del paso inferior: cornisa y friso
      L.caja(B, s * (XW - 0.3), (zl0 + zl1) / 2, yT - canto - 0.35, 0.7, zl1 - zl0 + 0.6, 0.35, 0, STd, K.PIEDRA);
      L.caja(B, s * (XW + 0.05), (zl0 + zl1) / 2, yT - 0.12, 0.5, zl1 - zl0 + 1.0, 0.16, 0, STl, K.PIEDRA); }
    // bóveda del paso: nervios transversales y luz corrida (el paso está iluminado de día y de noche)
    for (let x = -XW + 2.5; x < XW - 1; x += 3.0) L.caja(B, x, (zl0 + zl1) / 2, yT - canto - 0.45, 0.35, zl1 - zl0 - 0.4, 0.45, 0, STd, K.PIEDRA);
    for (const z of [47.6, 53.6]) L.caja(B, 0, z, yT - canto - 0.08, 2 * XW - 1.5, 0.22, 0.06, 0, [255, 226, 180], K.EMISIVO, { aux: L.aux.emisivo(1.3, false) });
    const yR = Math.min(G(0, D.losa.pilas_Z[0]), G(0, D.losa.pilas_Z[1])) - 0.5;
    for (const z of D.losa.pilas_Z) for (const x of D.losa.pilas_X) {
      const y0 = G(x, z) - 0.3; L.tambor(B, x, z, y0, yT - canto - 0.6, 0.62, { lados: 12, col: STd, k: K.PIEDRA, aux: aP });
      L.tambor(B, x, z, yT - canto - 0.6, yT - canto, 0.62, { r1: 1.15, lados: 12, col: ST, k: K.PIEDRA }); }
    // pasarela de enlace con el nártex si el suelo del templo queda por debajo de la losa (peldaños de subida, z 41-46)
    if (yS - yF > 0.2) { const n = Math.ceil((yS - yF) / 0.16), rz = 5.0 / n;
      for (let i = 0; i < n; i++) L.caja(B, 0, zl0 + 0.1 + (i + 0.5) * rz, Y(yF) - 0.3, 2 * XW - 6, rz, (i + 1) * (yS - yF) / n + 0.3, 0, ST, K.PIEDRA, { aux: aG }); }
    // --- terraza (macizo hasta el suelo) y su pavimento
    const yG0 = Math.min(G(-XW, zt0), G(XW, zt0), G(-XW, zt1), G(XW, zt1), G(0, ze1)) - 1.2;
    L.caja(B, 0, (zt0 + zt1) / 2, yG0, 2 * XW, zt1 - zt0, yT - yG0, 0, STd, K.PIEDRA, { aux: aP, techo: STl, auxTecho: aG });
    for (const z of [zt0 + 2.2, zt1 - 2.2]) L.caja(B, 0, z, yT, 2 * XW - 2, 0.5, 0.02, 0, [150, 142, 128], K.PIEDRA);   // franjas de piedra oscura
    // --- Monumento al Fuego y al Agua: vaso en cruz, fuste, surtidor de 20 m y cuatro cascadas; dos tederos con fuego
    const M = D.monumento, mx = M.X, mz = M.Z, yW = yT + 0.55;
    const arms = [[0, 0, 7.5, 7.5], [0, 0, 18.5, 4.2], [0, 0, 4.2, 15.5]];
    for (const [ax, az, w, l] of arms) {
      for (const s of [-1, 1]) { L.caja(B, mx + ax + s * (w / 2 + 0.3), mz + az, yT, 0.6, l + 1.2, 0.8, 0, STl, K.PIEDRA);
        L.caja(B, mx + ax, mz + az + s * (l / 2 + 0.3), yT, w + 1.2, 0.6, 0.8, 0, STl, K.PIEDRA); }
      L.caja(B, mx + ax, mz + az, yT + 0.05, w, l, yW - yT - 0.05, 0, [52, 86, 96], K.AGUA); }
    L.tambor(B, mx, mz, yW, yW + 4.2, 1.6, { r1: 1.0, lados: 16, col: STl, k: K.PIEDRA, aux: aP });
    L.tambor(B, mx, mz, yW + 4.2, yW + 4.9, 2.6, { r1: 2.9, lados: 20, col: STl, k: K.PIEDRA });
    L.tambor(B, mx, mz, yW + 4.85, yW + 4.95, 2.75, { lados: 20, col: [70, 110, 120], k: K.AGUA });
    L.aguja(B, mx, mz, yW + 4.9, M.surtidor - 4.9, 0.85, { lados: 10, pasos: 8, pot: 1, exp: 0.7, col: [222, 236, 240], k: K.AGUA });
    for (let a = 0; a < 4; a++) { const ca = Math.cos(a * PI / 2), sa = Math.sin(a * PI / 2);
      let p = null; for (let i = 0; i <= 12; i++) { const t = i / 12, r = 0.6 + t * (a % 2 ? 6.6 : 8.4), y = yW + M.surtidor - 1.2 + 2.0 * t - (M.surtidor - 0.6) * t * t;
        const q = [mx + ca * r, Math.max(y, yW), mz + sa * r]; if (p) L.bar(B, p, q, 0.3 - 0.12 * t, [238, 244, 248], K.LISO); p = q; }
      L.esfera(B, mx + ca * (a % 2 ? 7.2 : 9.0), yW + 0.25, mz + sa * (a % 2 ? 7.2 : 9.0), 1.1, { sy: 0.35, col: [236, 242, 244], k: K.LISO }); }
    for (const tx of M.teders_X) { const y0 = yT;
      L.tambor(B, tx, mz, y0, y0 + 0.6, 1.8, { r1: 1.6, lados: 12, col: STl, k: K.PIEDRA });
      for (let i = 0; i < 3; i++) { const a = i * 2 * PI / 3 + 0.3; L.bar(B, [tx + 1.3 * Math.cos(a), y0 + 0.6, mz + 1.3 * Math.sin(a)], [tx + 0.55 * Math.cos(a), y0 + 5.0, mz + 0.55 * Math.sin(a)], 0.14, BRZ, K.METAL); }
      L.tambor(B, tx, mz, y0 + 4.8, y0 + 5.6, 0.5, { r1: 1.35, lados: 14, col: BRZ, k: K.METAL });
      L.aguja(B, tx, mz, y0 + 5.5, 3.2, 1.05, { lados: 9, pasos: 5, pot: 1, exp: 1.3, col: [255, 120, 30], k: K.EMISIVO, aux: L.aux.emisivo(2.6, false) });
      L.aguja(B, tx, mz, y0 + 5.5, 2.0, 0.6, { lados: 7, pasos: 3, pot: 1, exp: 1, col: [255, 214, 120], k: K.EMISIVO, aux: L.aux.emisivo(3.2, false) }); }
    // --- escalinata: tramos de 12 peldaños con rellanos amplios (macetones de piedra con boj y farolas)
    const yE1 = Y(Math.min(h.y(0, ze1), h.y(-XW, ze1), h.y(XW, ze1)) + yb);   // pie: cota de la explanada
    const drop = yT - yE1, nTot = Math.max(8, Math.round(drop / 0.155)), nF = 4, nPer = Math.ceil(nTot / nF), rise = drop / (nPer * nF), tread = 0.46;
    const land = ((ze1 - ze0) - nPer * nF * tread) / (nF - 1); let z = ze0, y = yT; const steps = [];
    for (let f = 0; f < nF; f++) {
      for (let i = 0; i < nPer; i++) { y -= rise; steps.push([z, z + tread, y]); z += tread; }
      if (f < nF - 1) { steps.push([z, z + land, y, 1]); z += land; } }
    LV.steps = steps; LV.rise = rise; LV.land = land; LV.nTot = nPer * nF;
    for (const [z0, z1, yy, isL] of steps) { const yg = Math.min(G(-XW, z1), G(0, z1), G(XW, z1)) - 1.2;
      L.caja(B, 0, (z0 + z1) / 2, yg, 2 * XW - 1.2, z1 - z0, yy - yg, 0, isL ? ST : STd, K.PIEDRA, { aux: aG, techo: isL ? ST : STl });
      if (!isL) L.caja(B, 0, z0 + 0.03, yy - 0.04, 2 * XW - 1.2, 0.06, 0.05, 0, [222, 216, 202], K.PIEDRA);           // bocel del peldaño
      else for (const sx of [-1, 1]) for (const mzz of [z0 + land * 0.3, z0 + land * 0.7]) {                       // macetones con boj
        L.caja(B, sx * 18.5, mzz, yy, 3.2, 3.2, 0.85, 0, STl, K.PIEDRA);
        L.esfera(B, sx * 18.5, yy + 1.35, mzz, 1.45, { sy: 0.62, col: [60, 86, 44], k: K.LISO }); } }
    // muros laterales (zancas) con albardilla, de la terraza al pie, siguiendo los peldaños; el basamento baja hasta la calle
    for (const s of [-1, 1]) { const xi = s * (XW - 0.6), xo = s * XW, top = [];
      top.push([zt0, yT + 1.05]); for (const [z0, z1, yy] of steps) { top.push([z0, yy + 1.05]); top.push([z1, yy + 1.05]); }
      const g = []; for (let k = top.length - 1; k >= 0; k--) g.push([top[k][0], G(xo, top[k][0]) - 1.0]);
      for (const xx of [xi, xo]) L.poly(B, top.concat(g).map(([zz, yy]) => [xx, yy, zz]), STd, K.PIEDRA, aP);
      for (let k = 1; k < top.length; k++) { const a = top[k - 1], b = top[k]; if (b[0] - a[0] < 1e-3) continue;
        L.q4(B, [xi - s * 0.08, a[1] + 0.12, a[0]], [xo + s * 0.08, a[1] + 0.12, a[0]], [xo + s * 0.08, b[1] + 0.12, b[0]], [xi - s * 0.08, b[1] + 0.12, b[0]], STl, K.PIEDRA);
        if (Math.abs(b[1] - a[1]) > 1e-3) for (const xx of [xi - s * 0.08, xo + s * 0.08]) L.q4(B, [xx, a[1], a[0]], [xx, a[1] + 0.12, a[0]], [xx, a[1] + 0.12, b[0]], [xx, a[1], b[0]], STl, K.PIEDRA); }
      L.caja(B, s * (XW - 0.3), ze1 + 0.4, yE1 - 0.5, 1.4, 0.8, 1.9, 0, STl, K.PIEDRA); }                         // remate del pie
    // parapeto de la losa y de la terraza sobre la calle (bocas del paso) y a los lados de la terraza
    for (const s of [-1, 1]) L.caja(B, s * (XW - 0.3), (zl0 + zt1) / 2, yT, 0.6, zt1 - zl0, 0.25, 0, STl, K.PIEDRA);
  }

  // ------------------------------------------------------------ detalle cercano: balaustres, farolas, pasamanos, relieves
  function detalle(B, h, L) {
    const { yS } = niveles(h); if (!LV.steps) return;
    const yb = h.yb, yT = yS - yb, XW = D.franja_X, [zl0] = D.losa.Z, [zt0, zt1] = D.terraza.Z;
    const yAt = z => { if (z <= zt1) return yT; for (const [z0, z1, yy] of LV.steps) if (z >= z0 - 1e-6 && z <= z1 + 1e-6) return yy; return LV.steps[LV.steps.length - 1][2]; };
    // balaustrada sobre la losa y la terraza (lado de las bocas del paso): balaustres torneados y pasamanos
    for (const s of [-1, 1]) { const x = s * (XW - 0.3);
      for (let z = zl0 + 0.4; z < zt1; z += 0.42) L.tambor(B, x, z, yT + 0.25, yT + 1.0, 0.09, { r1: 0.06, lados: 6, col: STl, k: K.PIEDRA });
      L.caja(B, x, (zl0 + zt1) / 2, yT + 1.0, 0.38, zt1 - zl0, 0.14, 0, STl, K.PIEDRA); }
    // pasamanos de bronce a lo largo de los carriles de la escalinata (postes en cada rellano y cada 6 peldaños)
    for (const cx of D.escalinata.carriles_X) { let p = null, k = 0;
      for (const [z0, z1, yy, isL] of LV.steps) { if (isL) { p = null; continue; } const q = [cx, yy + 0.95, (z0 + z1) / 2];
        if (p) L.bar(B, p, q, 0.035, [150, 118, 64], K.METAL);
        if (k++ % 6 === 0) L.bar(B, [cx, yy, (z0 + z1) / 2], [cx, yy + 0.95, (z0 + z1) / 2], 0.04, [120, 96, 56], K.METAL); p = q; } }
    // farolas de fundición de doble brazo en las zancas y en el borde de la terraza; linterna encendida de noche
    const lamp = (x, z, y0) => { L.tambor(B, x, z, y0, y0 + 0.6, 0.32, { r1: 0.24, lados: 8, col: [44, 46, 44], k: K.METAL });
      L.tambor(B, x, z, y0 + 0.6, y0 + 4.6, 0.11, { r1: 0.08, lados: 6, col: [44, 46, 44], k: K.METAL });
      for (const d of [-1, 1]) { L.bar(B, [x, y0 + 4.3, z], [x + d * 0.75, y0 + 4.6, z], 0.04, [44, 46, 44], K.METAL);
        L.tambor(B, x + d * 0.75, z, y0 + 4.3, y0 + 4.85, 0.2, { r1: 0.26, lados: 6, col: [255, 226, 168], k: K.EMISIVO, aux: L.aux.emisivo(2.2, true) });
        L.piramide(B, x + d * 0.75, z, y0 + 4.85, 0.6, 0.6, 0.28, { col: [40, 42, 40], k: K.METAL }); } };
    for (const s of [-1, 1]) { for (const [z0, z1, yy, isL] of LV.steps) if (isL) { lamp(s * (XW - 0.3), (z0 + z1) / 2, yy + 1.17); lamp(s * 10, z0 + 1.0, yy); lamp(s * 10, z1 - 1.0, yy); }
      lamp(s * (XW - 0.3), zt0 + 1.0, yT + 1.15); lamp(s * (XW - 0.3), zt1 - 0.6, yT + 1.17); lamp(s * 26, D.monumento.Z, yT); }
    // relieves del paso inferior sobre las bocas (el infierno, los vicios): grupos de figuras atormentadas y llamas talladas
    for (const s of [-1, 1]) { const x = s * (XW + 0.12), y0 = yT - D.losa.canto - 0.35;
      for (let z = zl0 + 0.8; z < D.losa.Z[1] - 0.5; z += 0.55) { const r = hs(z, s), hgt = 0.35 + 0.55 * r;
        L.caja(B, x, z, y0 + 0.02, 0.22, 0.4, hgt * 0.8, 0, r > 0.7 ? [140, 70, 40] : [104, 94, 84], K.PIEDRA);
        if (r > 0.45) L.esfera(B, x + s * 0.08, y0 + hgt * 0.8 + 0.12, z, 0.15, { col: [110, 100, 88], k: K.PIEDRA }); } }
    // espuma al pie del surtidor y de las cascadas
    const M = D.monumento; for (let i = 0; i < 18; i++) { const a = i / 18 * 2 * PI, r = 2.9 + 0.3 * hs(i, 3);
      L.esfera(B, M.X + r * Math.cos(a), yT + 0.6, M.Z + r * Math.sin(a), 0.35, { sy: 0.4, col: [236, 242, 244], k: K.LISO }); }
  }

  // ------------------------------------------------------------ edificios: lo que queda fuera de la franja, con fachada nueva
  const clipX = (P, s, X) => { const out = [], inS = p => s * p[0] >= X - 1e-6;
    for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], ia = inS(a), ib = inS(b);
      if (ia) out.push(a); if (ia !== ib) { const t = (s * X - a[0]) / (b[0] - a[0]); out.push([s * X, a[1] + (b[1] - a[1]) * t]); } } return out; };
  const area = P => { let A = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; A += a[0] * b[1] - b[0] * a[1]; } return Math.abs(A) / 2; };
  const FAC = [[214, 196, 168], [200, 178, 150], [222, 210, 186], [190, 160, 130], [206, 190, 170], [180, 168, 150]];
  function edificis(B, h, L) {
    const XW = D.franja_X;
    for (const e of h.edif) { const P = e.plantas[0]; if (!P || P.length < 3) continue;
      const col = FAC[e.b % FAC.length], aV = L.aux.ventanas(3.1, 3.3, 0.48, 0.6);
      for (const s of [-1, 1]) { const Q = clipX(P, s, XW + 0.4); if (Q.length < 3 || area(Q) < 4) continue;
        L.prisma(B, Q, e.y0, e.alto, col, K.VENTANAS, { aux: aV, techo: [150, 140, 130], kTecho: K.LISO });
        // remate de la fachada nueva a la avenida: cornisa
        let z0 = 1e9, z1 = -1e9; for (const p of Q) if (Math.abs(p[0] - s * (XW + 0.4)) < 0.05) { z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
        if (z1 - z0 > 1) L.caja(B, s * (XW + 0.55), (z0 + z1) / 2, e.alto - 0.6, 0.5, z1 - z0, 0.35, 0, L.shade(col, 1.08), K.PIEDRA); } }
  }

  // la ficha base: mismo centro y giro que la basílica
  const base = { nivel: 'B', x: C0[0], z: C0[1], rot: ROT, ancho: 70, largo: 140, edificios: [] };
  LM.add(Object.assign({}, base, { id: 'sf_gloria', nombre: 'Escalinata de la Glòria', alto: 26, noche: 'focos', build: (B, h, L) => (D ? obra(B, h, L) : null) }));
  LM.add(Object.assign({}, base, { id: 'sf_gloria_detall', nombre: 'Escalinata de la Glòria (detall)', etiqueta: false, alto: 8, noche: 'focos', sombra: false, build: (B, h, L) => (D ? detalle(B, h, L) : null) }));
  LM.add(Object.assign({}, base, { id: 'sf_gloria_edificis', nombre: 'Façanes de l’avinguda de la Glòria', etiqueta: false, alto: 30, noche: 'ventanas', build: (B, h, L) => (D ? edificis(B, h, L) : null) }));

  // ------------------------------------------------------------ el init de los hitos espera al JSON y elige los volúmenes
  const LMS = window.BCN_LANDMARKS, STAT = { ocultos: 0, lod: 0 };
  window.BCN_GLORIA = { stats: () => Object.assign({ yS: LV.yS, yF: LV.yF, yM: LV.yM, peldanos: LV.nTot, contrahuella: LV.rise, rellano: LV.land }, STAT) };
  if (LMS && LMS.init) { const init0 = LMS.init;
    LMS.init = async function (ctx) {
      const d = await dataP; const fx = id => LM.fichas.find(f => f.id === id);
      if (d) try {
        const BR = ctx.BREC, bb = BR.bb, E = d.ejes, XW = d.franja_X, ZB = d.bloques_Z;
        const toL = (x, z) => { const dx = x - E.centro[0], dz = z - E.centro[1]; return [dx * E.vecX[0] + dz * E.vecX[1], dx * E.vecZ[0] + dz * E.vecZ[1]]; };
        // las manzanas de delante de la Glòria (pasada Mallorca) son de la escalinata: si la ficha de la basílica oculta volúmenes
        // allí, pasan a esta (se rehace lo que queda fuera de la franja de 60 m, con fachada nueva a la avenida)
        const cZ = b => { const k = b * 4; return toL((bb[k] + bb[k + 2]) / 2, (bb[k + 1] + bb[k + 3]) / 2)[1]; };
        for (const f of LM.fichas) if (/^sagrada_familia/.test(f.id) && f.edificios && f.edificios.length) { const n0 = f.edificios.length;
          f.edificios = f.edificios.filter(b => cZ(b) < 52); STAT.cedidos = (STAT.cedidos || 0) + n0 - f.edificios.length; }
        const used = new Set(); for (const f of LM.fichas) for (const b of (f.edificios || [])) used.add(b);
        const ring0 = b => { const dv = BR.dv[BR.cont[b]]; let p = BR.off[b]; const nR = dv.getUint8(p), n = dv.getUint16(p + 4, true); p += 12;
          const m = nR > 1 ? dv.getUint16(p, true) : n; if (nR > 1) p += 2 * nR; const a = []; for (let j = 0; j < m; j++, p += 4) a.push([dv.getInt16(p, true) / 10, dv.getInt16(p + 2, true) / 10]); return a; };
        const out = [];
        for (let b = 0; b < BR.n; b++) { if (used.has(b)) continue; const k = b * 4;
          const c = [[bb[k], bb[k + 1]], [bb[k + 2], bb[k + 1]], [bb[k], bb[k + 3]], [bb[k + 2], bb[k + 3]]].map(([x, z]) => toL(x, z));
          let X0 = 1e9, X1 = -1e9, Z0 = 1e9, Z1 = -1e9; for (const [X, Z] of c) { X0 = Math.min(X0, X); X1 = Math.max(X1, X); Z0 = Math.min(Z0, Z); Z1 = Math.max(Z1, Z); }
          if (X1 < -XW || X0 > XW || !ZB.some(([a, z]) => Z1 > a && Z0 < z)) continue;
          // planta exacta: anillo en coordenadas del trozo + origen deducido de la caja (la caja es la del anillo)
          const R = ring0(b); if (R.length < 3) continue; let mx = 1e9, mz = 1e9; for (const [x, z] of R) { mx = Math.min(mx, x); mz = Math.min(mz, z); }
          const P = R.map(([x, z]) => toL(x - mx + bb[k], z - mz + bb[k + 1]));
          const inS = clipX(clipX(P, 1, -XW), -1, -XW);                                   // parte dentro de |X| < XW
          if (inS.length < 3 || area(inS) < 3) continue; if (!P.some(([X, Z]) => ZB.some(([a, z]) => Z > a && Z < z))) continue;
          out.push(b); if (out.length <= 6) (STAT.muestra = STAT.muestra || []).push([b, Math.round(cZ(b)), Math.round(area(inS)), Math.round(area(P))]); }
        const f = fx('sf_gloria_edificis'); if (f) f.edificios = out; STAT.ocultos = out.length;
      } catch (e) { console.warn('Glòria: no se han podido elegir los volúmenes de la franja', e); }
      const r = await init0.call(this, ctx);
      try { const api = window.BCN && window.BCN.lm, rec = api && api.get('sf_gloria_detall'); if (rec && rec.mesh) { rec.mesh.addLODLevel(420, null); STAT.lod = 1; } } catch (e) { console.warn('Glòria: sin nivel de detalle', e); }
      return r;
    }; }
})();
