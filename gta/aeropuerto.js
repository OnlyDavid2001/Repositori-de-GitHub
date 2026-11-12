/* GTA Barcelona — Aeroport del Prat (etapa AE1: lado aire y terminales).
   Datos: data/aero_lado_aire.json (pistas y calles de rodaje sacadas del mapa del suelo, plantas de OpenStreetMap vía
   Nominatim, pasarelas de la T1). Dos piezas:
   · Hitos (BCN_LM, siempre cargados, una malla por ficha): T1 (sustituye el constructor de la ficha «aeroport» de
     landmarks_e.js: planta sin los muñones de las pasarelas, muro cortina, cubierta ondulada y pasarelas de embarque),
     T2, torre de control y torre antigua, hangar, bomberos, y todos los aviones y vehículos de pista en una sola malla.
     Una ficha sin malla («aero_campo») solo despeja de árboles el recinto (nature.js respeta la huella de los hitos).
   · Módulo BCN_AERO (addMod 'aero'): marcas en el suelo con un shader propio: pistas con umbral en piano, designador,
     eje discontinuo, zona de toma de contacto, punto de visada y bordes; puntos de espera de las calles de rodaje;
     líneas de guiado, barras de parada y límites de seguridad de los puestos de estacionamiento.
   El JSON se descarga al cargar el script; la carga de los hitos (BCN_LANDMARKS.init) lo espera. Sin JSON no hay nada
   y la ciudad sigue (avisos «Aeropuerto: …»). */
(function () {
'use strict';
const LM = window.BCN_LM;
const DATA = { d: null };
const dataP = fetch('data/aero_lado_aire.json').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
  .then(d => (DATA.d = d)).catch(e => { console.warn('Aeropuerto: sin datos (data/aero_lado_aire.json)', e); return null; });

// ------------------------------------------------------------------ utilidades
const D2R = Math.PI / 180;
const unit = (x, z) => { const l = Math.hypot(x, z) || 1; return [x / l, z / l]; };
const hdg = (fx, fz) => Math.atan2(fx, fz) / D2R;                       // rumbo (grados) del vector (x, z)
function inPoly(P, x, z) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
  const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function areaS(P) { let s = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) s += (P[j][0] - P[i][0]) * (P[j][1] + P[i][1]); return s / 2; }
// azar propio (determinista por semilla): no toca el estado de BCN_GEO
function rng(seed) { let s = seed | 0; return (a, b) => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; const r = ((t ^ t >>> 14) >>> 0) / 4294967296; return a === undefined ? r : b === undefined ? r * a : a + r * (b - a); }; }

// ------------------------------------------------------------------ puestos de estacionamiento (de los datos)
// Cada puesto: { x, z (morro), f: [fx, fz] (hacia dónde mira el morro), tipo: 'n' pasillo único | 'w' fuselaje ancho,
// pas: pasarela { base, tip } o null }
const AV = { n: { L: 37.6, R: 2.0, S: 35.8, H: 11.8, door: 6.5 }, w: { L: 63.7, R: 2.82, S: 60.3, H: 16.8, door: 9.5 } };
let STANDS = null;
function stands() {
  if (STANDS) return STANDS;
  const d = DATA.d, out = [];
  // T1: pasarelas de OSM; el avión entra de morro y su puerta delantera izquierda queda en la cabeza de la pasarela
  const pas = d.pasarelasT1.map(b => ({ base: b.base, tip: b.tip, dir: b.dir }));
  // T2: frentes del edificio que miran al sur-sureste (a la plataforma), una pasarela cada 47 m
  const t2 = d.t2, sg = areaS(t2) > 0 ? 1 : -1;
  for (let i = 0; i < t2.length; i++) { const a = t2[i], b = t2[(i + 1) % t2.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 30) continue; const t = unit(b[0] - a[0], b[1] - a[1]), n = [t[1] * sg, -t[0] * sg];
    if (n[0] * 0.4067 - n[1] * 0.9135 < 0.62) continue;
    for (let u = 16; u <= L - 12; u += 47) { const bx = a[0] + t[0] * u, bz = a[1] + t[1] * u;
      pas.push({ base: [bx, bz], tip: [bx + n[0] * 22, bz + n[1] * 22], dir: n }); } }
  for (const p of pas) {
    const dir = p.dir || unit(p.tip[0] - p.base[0], p.tip[1] - p.base[1]);
    let gap = 1e9; for (const q of pas) if (q !== p) gap = Math.min(gap, Math.hypot(q.tip[0] - p.tip[0], q.tip[1] - p.tip[1]));
    const tipo = gap > 62 ? 'w' : 'n', A = AV[tipo], f = [-dir[0], -dir[1]], left = [-f[1], f[0]];
    const ox = p.tip[0] - left[0] * (A.R + 0.9), oz = p.tip[1] - left[1] * (A.R + 0.9);
    out.push({ x: ox + f[0] * A.door, z: oz + f[1] * A.door, f, tipo, pas: { base: p.base, tip: p.tip, dir } });
  }
  // remotos: filas en las plataformas grandes que no tocan las terminales
  const R = rng(311);
  for (const P of d.plataformas) {
    const ar = Math.abs(areaS(P)); if (ar < 9000) continue;
    let cx = 0, cz = 0; for (const p of P) { cx += p[0]; cz += p[1]; } cx /= P.length; cz /= P.length;
    let near = false; for (const s of out) if (Math.hypot(s.x - cx, s.z - cz) < 140) near = true;
    if (near) continue;
    // eje largo de la plataforma (momentos de segundo orden de los vértices)
    let sxx = 0, szz = 0, sxz = 0; for (const p of P) { const dx = p[0] - cx, dz = p[1] - cz; sxx += dx * dx; szz += dz * dz; sxz += dx * dz; }
    const th = 0.5 * Math.atan2(2 * sxz, sxx - szz), ax = [Math.cos(th), Math.sin(th)], f = R() < 0.5 ? [-ax[1], ax[0]] : [ax[1], -ax[0]];
    for (let u = -400; u <= 400; u += 46) {
      const tipo = R() < 0.18 ? 'w' : 'n', A = AV[tipo];
      const x = cx + ax[0] * u + f[0] * A.L * 0.5, z = cz + ax[1] * u + f[1] * A.L * 0.5;
      const side = [-f[1], f[0]], pts = [[0, 0], [0, -A.L], [A.S / 2, -A.L * 0.5], [-A.S / 2, -A.L * 0.5]].map(([s, l]) => [x + side[0] * s + f[0] * l, z + side[1] * s + f[1] * l]);
      if (!pts.every(q => inPoly(P, q[0], q[1]))) continue;
      if (out.some(s => Math.hypot(s.x - x, s.z - z) < 40)) continue;
      if (R() < 0.15) continue;                                         // algún puesto vacío
      out.push({ x, z, f, tipo, pas: null });
    }
  }
  return (STANDS = out);
}

// ------------------------------------------------------------------ hitos
if (!LM) { console.warn('Aeropuerto: sin BCN_LM (landmarks.js no se ha cargado)'); }
else {
  const { K } = LM;
  const WH = [236, 238, 240], GR = [178, 182, 188], GRO = [92, 96, 102], NEG = [34, 36, 40];
  // ---- un avión de librea genérica en B (morro en el origen, mirando a +Z), luego se coloca con xf
  function avion(B, L, tipo, x, z, ang, yb, R) {
    const A = AV[tipo], v0 = B.nv, Lg = A.L, Rf = A.R, yc = Rf + (tipo === 'w' ? 1.7 : 1.25);
    const libre = [[40, 84, 150], [120, 128, 138], [36, 110, 160], [70, 74, 84]][Math.floor(R(4))], VI = [30, 34, 40];
    // fuselaje: morro redondeado, tramo recto y cono de cola que sube
    const pts = [], n = 14;
    for (let i = 0; i <= n; i++) { const t = i / n; let zz, yy = yc;
      if (t < 0.12) zz = -Lg * 0.11 * (t / 0.12); else if (t < 0.72) zz = -Lg * (0.11 + (t - 0.12) / 0.6 * 0.6); else { const q = (t - 0.72) / 0.28; zz = -Lg * (0.71 + q * 0.29); yy = yc + q * q * Rf * 0.9; }
      pts.push([0, yy, zz]); }
    const rf = t => t < 0.12 ? Rf * Math.sqrt(Math.max(0.02, 1 - Math.pow(1 - t / 0.12, 2))) : t < 0.72 ? Rf : Rf * Math.max(0.12, 1 - Math.pow((t - 0.72) / 0.28, 1.4) * 0.88);
    L.tube(B, L.F0, pts, rf, 10, WH, K.LISO, { caps: true });
    // ventanillas (franja oscura), puertas y cabina
    for (const s of [-1, 1]) {
      L.caja(B, s * (Rf - 0.05), -Lg * 0.43, yc + Rf * 0.22, 0.16, Lg * 0.56, 0.32, 0, VI, K.LISO);
      L.caja(B, s * (Rf - 0.08), -A.door + 0.4, yc - Rf * 0.25, 0.18, 0.9, 1.85, 0, [200, 204, 210], K.LISO);
      L.q4(B, [s * Rf * 0.42, yc + Rf * 0.5, -Lg * 0.045], [s * Rf * 0.88, yc + Rf * 0.12, -Lg * 0.07], [s * Rf * 0.92, yc + Rf * 0.18, -Lg * 0.1], [s * Rf * 0.5, yc + Rf * 0.66, -Lg * 0.085], VI, K.LISO);
    }
    // vientre gris claro (franja bajo el fuselaje)
    L.caja(B, 0, -Lg * 0.42, yc - Rf * 0.995, Rf * 1.1, Lg * 0.5, 0.05, 0, [200, 204, 208], K.LISO);
    // alas (flecha 25°, diedro 5°, raíz bajo el fuselaje), con el borde de ataque
    const zr = -Lg * 0.36, cr = Lg * 0.2, ct = Lg * 0.055, sw = Math.tan(25 * D2R), yw = yc - Rf * 0.55;
    for (const s of [-1, 1]) {
      const sp = A.S / 2, y1 = yw + sp * 0.085;
      const a = [s * Rf * 0.6, yw + 0.25, zr], b = [s * sp, y1 + 0.12, zr - (sp - Rf) * sw], c = [s * sp, y1, zr - (sp - Rf) * sw - ct], d = [s * Rf * 0.6, yw, zr - cr];
      L.q4(B, a, b, c, d, WH, K.LISO);
      L.q4(B, [a[0], a[1] - 0.45, a[2]], [b[0], b[1] - 0.15, b[2]], [c[0], c[1] - 0.1, c[2]], [d[0], d[1] - 0.2, d[2]], GR, K.LISO);
      L.q4(B, a, b, [b[0], b[1] - 0.15, b[2]], [a[0], a[1] - 0.45, a[2]], GR, K.LISO);
      L.q4(B, b, [s * (sp + 0.3), y1 + 1.6, b[2] - 1.0], [s * (sp + 0.3), y1 + 1.6, c[2] + 0.2], c, libre, K.LISO);   // aleta (winglet)
      // motor bajo el ala y su pilón
      const ex = s * sp * (tipo === 'w' ? 0.33 : 0.34), ez = zr - (Math.abs(ex) - Rf) * sw + (tipo === 'w' ? 3.2 : 2.6), er = tipo === 'w' ? 1.45 : 1.0, ey = yw - er * 0.75 + Math.abs(ex) * 0.085 * 0.5;
      const el = tipo === 'w' ? 5.6 : 4.3;
      L.tube(B, L.F0, [[ex, ey, ez], [ex, ey, ez - el * 0.55], [ex, ey + er * 0.05, ez - el]], t => er * (1 - 0.32 * t * t), 10, [214, 216, 220], K.METAL, { caps: true });
      L.caja(B, ex, ez - el * 0.55, ey + er * 0.7, 0.35, el * 0.7, Math.max(0.4, yw - ey - er * 0.6), 0, GR, K.LISO);
      // estabilizador horizontal
      const zh = -Lg * 0.9, hs = A.S * 0.21, yh = yc + Rf * 0.55;
      L.q4(B, [s * Rf * 0.3, yh, zh], [s * hs, yh + 0.6, zh - hs * 0.55], [s * hs, yh + 0.6, zh - hs * 0.55 - 1.6], [s * Rf * 0.3, yh, zh - Lg * 0.085], WH, K.LISO);
      // tren principal
      L.caja(B, s * Rf * 0.75, zr - cr * 0.75, 0, tipo === 'w' ? 1.6 : 0.9, tipo === 'w' ? 3.2 : 1.2, 1.15, 0, NEG, K.LISO);
      L.caja(B, s * Rf * 0.75, zr - cr * 0.75, 1.0, 0.3, 0.3, yw - 1.0, 0, GR, K.LISO);
    }
    // deriva con la franja de color
    const zf = -Lg * 0.78, top = A.H;
    for (const s of [-0.12, 0.12]) L.q4(B, [s, yc + Rf * 0.7, zf], [s, top, -Lg * 0.92], [s, top, -Lg * 0.985], [s, yc + Rf * 0.5, -Lg * 0.99], libre, K.LISO);
    L.q4(B, [0, yc + Rf * 0.7, zf], [0, top, -Lg * 0.92], [0.12, top, -Lg * 0.92], [0.12, yc + Rf * 0.7, zf], WH, K.LISO);
    L.caja(B, 0, -Lg * 0.5, yc + Rf * 0.42, 0.1, Lg * 0.62, 0.22, 0, libre, K.LISO);  // franja del lomo (librea sin logotipos)
    // tren de morro
    L.caja(B, 0, -Lg * 0.12, 0, 0.6, 0.8, 0.95, 0, NEG, K.LISO);
    L.caja(B, 0, -Lg * 0.12, 0.9, 0.22, 0.22, yc - Rf - 0.9, 0, GR, K.LISO);
    L.xf(B, v0, x, z, ang, 1, 1, yb);
  }
  // ---- vehículos de pista alrededor de un puesto con pasarela (en coordenadas del avión: morro en 0, +Z delante)
  function vehiculos(B, L, s, x0, z0, yb, R) {
    const A = AV[s.tipo], v0 = B.nv, Lg = A.L, Rf = A.R, side = R() < 0.5 ? -1 : 1;
    const AM = [236, 186, 40], BL = [232, 234, 236], NA = [214, 116, 36];
    if (R() < 0.8) {                                                       // cinta de equipajes en la bodega delantera
      L.caja(B, side * (Rf + 1.6), -Lg * 0.24, 0, 2.0, 7.5, 1.1, 0, AM, K.LISO);
      L.bar(B, [side * (Rf + 1.6), 1.4, -Lg * 0.24 - 3.6], [side * (Rf + 0.4), Rf + 0.6, -Lg * 0.24 + 3.0], 0.55, NEG, K.LISO);
      for (let k = 0; k < 3; k++) L.caja(B, side * (Rf + 5.5), -Lg * 0.24 - 4 - k * 3.6, 0, 1.6, 3.0, 1.6, 0, k ? [120, 124, 130] : BL, K.METAL);
    }
    if (R() < 0.7) {                                                       // camión de cátering en la puerta trasera derecha
      L.caja(B, -(Rf + 3.6), -Lg * 0.84, 0, 2.5, 7, 1.4, 0, BL, K.LISO);
      L.caja(B, -(Rf + 3.4), -Lg * 0.84 - 1, 1.4 + Rf, 2.6, 4.8, 2.6, 0, BL, K.LISO);
    }
    if (R() < 0.55) {                                                      // cisterna bajo el ala
      const xs = side * A.S * 0.22;
      L.caja(B, xs, -Lg * 0.62, 0, 2.5, 10.5, 1.2, 0, BL, K.LISO);
      L.tube(B, L.F0, [[xs, 2.3, -Lg * 0.62 + 3], [xs, 2.3, -Lg * 0.62 - 5]], 1.15, 8, [210, 212, 214], K.METAL, { caps: true });
    }
    L.caja(B, 0, 7.5, 0, 2.4, 5.5, 1.5, 0, R() < 0.5 ? AM : NA, K.LISO);   // tractor de empuje
    L.xf(B, v0, x0, z0, hdg(s.f[0], s.f[1]), 1, 1, yb);
  }
  // ---- pasarela de embarque: rotonda junto al muro, túnel inclinado, columna con ruedas y cabina
  function pasarela(B, L, p, yb, yT) {
    const d = p.dir, a = hdg(d[0], d[1]), b0 = [p.base[0] + d[0] * 3, p.base[1] + d[1] * 3], len = Math.hypot(p.tip[0] - b0[0], p.tip[1] - b0[1]) - 2.2;
    const MET = [196, 198, 202], VID = [120, 140, 156], y0 = yT, y1 = 3.6;
    L.tambor(B, b0[0], b0[1], -1, y0 + 3.4, 2.6, { lados: 10, col: MET, k: K.METAL });
    const v0 = B.nv;                                                      // túnel en local (a lo largo de +Z), luego se inclina y coloca
    L.caja(B, 0, len / 2, 0, 3.3, len, 3.0, 0, MET, K.METAL, { aux: L.aux.panel(1.2, 0.2, 0) });
    L.caja(B, 0, len * 0.35, 0.9, 3.36, len * 0.5, 1.2, 0, VID, K.CORTINA, { aux: L.aux.cortina(1.2, 1.0, 0.1) });
    for (let v = v0; v < B.nv; v++) { const q = v * 3; B.p[q + 1] += y0 + (y1 - y0) * (B.p[q + 2] / len); }
    L.xf(B, v0, b0[0], b0[1], a, 1, 1, 0);
    const c = [p.tip[0] - d[0] * 2.5, p.tip[1] - d[1] * 2.5], cm = [p.tip[0] - d[0] * 7, p.tip[1] - d[1] * 7];
    L.caja(B, c[0], c[1], y1 - 0.2, 4.4, 4.6, 3.4, a, MET, K.METAL);                     // cabina
    L.caja(B, c[0] + d[0] * 2.4, c[1] + d[1] * 2.4, y1 - 0.1, 3.6, 0.6, 3.2, a, NEG, K.LISO);  // fuelle
    L.caja(B, cm[0], cm[1], 0, 0.7, 0.7, y1, a, GRO, K.METAL);                            // columna
    L.caja(B, cm[0], cm[1], 0, 3.6, 1.4, 0.9, a, NEG, K.LISO);                           // carro de ruedas
  }
  const ficha = (f) => LM.add(f);
  // T1: se cambia el constructor de la ficha de landmarks_e.js (misma id, nombre y etiqueta; sin giro)
  const t1f = LM.fichas.find(f => f.id === 'aeroport');
  const t1Build = (B, h, L) => {
    const d = DATA.d, loc = d.t1.map(p => [p[0] - h.x, p[1] - h.z]);
    const VI = [140, 160, 176], CU = [228, 230, 230];
    // cubierta ondulada: crestas cada 36 m a lo largo del eje de la terminal (rumbo 66°)
    const ola = (x, z) => 17.2 + 1.9 * Math.cos((x * 0.9135 + z * 0.4067) / 36 * 2 * Math.PI);
    L.prisma(B, loc, -1.5, 15.2, VI, K.CORTINA, { aux: L.aux.cortina(4.6, 2.4, 0.18), sinTecho: true });
    L.prisma(B, L.mover(loc, 0, 0, 0, 1), 15.2, ola, CU, K.METAL, { aux: L.aux.panel(3, 0.06, 0), techo: CU, kTecho: K.METAL });
    // lado tierra: en los frentes largos que miran al oeste-suroeste (rumbo 246°), el bordillo de llegadas a pie de calle
    // (acera elevada y marquesina) y, encima, el viaducto de salidas con su bordillo cubierto a la altura del vestíbulo
    const sg = areaS(loc) > 0 ? 1 : -1, HOR = [196, 194, 188], AS = [70, 70, 74];
    for (let i = 0; i < loc.length; i++) { const a = loc[i], b = loc[(i + 1) % loc.length], Ld = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (Ld < 90) continue; const t = unit(b[0] - a[0], b[1] - a[1]), n = [t[1] * sg, -t[0] * sg];
      if (-n[0] * 0.9135 - n[1] * 0.4067 < 0.8) continue;
      const ang = hdg(t[0], t[1]), P = (u, o) => [a[0] + t[0] * u + n[0] * o, a[1] + t[1] * u + n[1] * o], m = Ld / 2, c = P(m, 0);
      const at = (u, o) => P(u, o);
      let q = at(m, 5); L.caja(B, q[0], q[1], -1, 10, Ld - 10, 1.18, ang, HOR, K.LISO, { aux: L.aux.liso(1.2) });             // acera de llegadas
      q = at(m, 12.5); L.caja(B, q[0], q[1], -1, 5, Ld - 10, 1.0, ang, AS, K.LISO);                                            // carril de parada
      q = at(m, 18); L.caja(B, q[0], q[1], -1, 0.5, Ld - 30, 1.35, ang, HOR, K.LISO);                                           // isleta
      q = at(m, 13); L.caja(B, q[0], q[1], 7.2, 22, Ld - 20, 1.4, ang, [176, 174, 168], K.LISO);                                // tablero del viaducto
      q = at(m, 6); L.caja(B, q[0], q[1], 8.6, 8, Ld - 20, 0.25, ang, HOR, K.LISO);                                            // acera de salidas
      q = at(m, 2.5); L.caja(B, q[0], q[1], 8.85, 0.12, Ld - 26, 3.0, ang, [120, 140, 156], K.CORTINA, { aux: L.aux.cortina(3, 1.5, 0.05) });   // mampara
      q = at(m, 9); L.caja(B, q[0], q[1], 13.4, 15, Ld - 20, 0.6, ang, [230, 232, 232], K.METAL, { aux: L.aux.panel(2.4, 0.05, 0) });          // marquesina
      q = at(m, 24); L.caja(B, q[0], q[1], 8.6, 0.4, Ld - 20, 1.1, ang, [200, 200, 196], K.LISO);                                // pretil
      for (let u = 16; u < Ld - 10; u += 24) for (const o of [9, 20]) { q = at(u, o); L.tambor(B, q[0], q[1], -1, 7.3, 0.7, { lados: 8, col: [186, 184, 178], k: K.LISO }); }
      for (let u = 14; u < Ld - 10; u += 18) { q = at(u, 15.2); L.caja(B, q[0], q[1], 8.6, 0.25, 0.25, 4.9, 0, [140, 144, 150], K.METAL); }   // pilares de la marquesina
      for (let u = 30; u < Ld - 20; u += 40) { q = at(u, 4.2); L.caja(B, q[0], q[1], 0, 1.6, 4, 3.4, ang, [220, 220, 216], K.METAL); } // accesos (cortavientos)
    }
    for (const s of stands()) if (s.pas && inT1(s.pas.base)) pasarela(B, L, { base: [s.pas.base[0] - h.x, s.pas.base[1] - h.z], tip: [s.pas.tip[0] - h.x, s.pas.tip[1] - h.z], dir: s.pas.dir }, 0, 5.4);
  };
  const inT1 = p => p[1] < 4200;                                         // la T2 queda toda al norte de z = 4400
  if (t1f) { t1f.build = t1Build; t1f.rot = 0; t1f.x = 4240; t1f.z = 3250; t1f.ancho = 1150; t1f.largo = 720; t1f.alto = 20; }
  else ficha({ id: 'aero_t1', nombre: 'Aeroport · Terminal 1', nivel: 'B', x: 4240, z: 3250, alto: 20, ancho: 1150, largo: 720, noche: 'ventanas', edificios: [], build: t1Build });
  // T2 (A, B y C): nave de vidrio de dos plantas con cubierta plana, lucernarios y pasarelas en los frentes de plataforma
  ficha({ id: 'aero_t2', nombre: 'Aeroport · Terminal 2', nivel: 'B', x: 4380, z: 4810, alto: 16, ancho: 1100, largo: 560, noche: 'ventanas', edificios: [],
    build(B, h, L) {
      const d = DATA.d, loc = d.t2.map(p => [p[0] - h.x, p[1] - h.z]);
      L.prisma(B, loc, -1.5, 12.5, [150, 166, 178], K.CORTINA, { aux: L.aux.cortina(4.2, 2.0, 0.22), techo: [206, 208, 206], kTecho: K.METAL, auxTecho: L.aux.panel(4, 0.1, 0) });
      for (let u = -480; u <= 420; u += 60) { const x = u * 0.9135, z = u * 0.4067 + 40;          // lucernarios en diente de sierra
        if (inPoly(loc, x, z) && inPoly(loc, x + 12, z + 5)) L.caja(B, x, z, 12.5, 8, 30, 2.4, 156, [176, 196, 210], K.CORTINA, { aux: L.aux.cortina(2.4, 1.5, 0.1) }); }
      for (const s of stands()) if (s.pas && !inT1(s.pas.base)) pasarela(B, L, { base: [s.pas.base[0] - h.x, s.pas.base[1] - h.z], tip: [s.pas.tip[0] - h.x, s.pas.tip[1] - h.z], dir: s.pas.dir }, 0, 5.0);
    } });
  // torre de control (la de 2006, en el campo entre pistas): edificio bajo redondo, fuste blanco y fanal de vidrio inclinado
  ficha({ id: 'aero_torre', nombre: 'Torre de control', nivel: 'B', x: 5839, z: 3973, alto: 64, ancho: 40, largo: 40, noche: 'ventanas', edificios: [],
    build(B, h, L) {
      const d = DATA.d, base = d.torre.planta.map(p => [p[0] - h.x, p[1] - h.z]);
      L.prisma(B, base, -1.2, 7.5, [214, 216, 214], K.VENTANAS, { aux: L.aux.ventanas(3.6, 2.6, 0.6, 0.45), techo: [190, 192, 190] });
      L.tambor(B, 0, 0, 7, 50, 4.6, { r1: 3.8, lados: 20, col: [240, 240, 236], k: K.LISO });
      L.tambor(B, 3.4, 0, 7, 47, 1.6, { lados: 10, col: [120, 140, 156], k: K.CORTINA, aux: L.aux.cortina(3.5, 1.0, 0.1) });   // ascensor
      L.tambor(B, 0, 0, 48, 52.5, 6.0, { r1: 8.2, lados: 20, col: [228, 228, 226], k: K.LISO });
      L.tambor(B, 0, 0, 52.5, 57.5, 8.6, { r1: 9.6, lados: 20, col: [70, 96, 118], k: K.CORTINA, aux: L.aux.cortina(5, 1.6, 0.05) });
      L.tambor(B, 0, 0, 57.5, 58.6, 10.2, { lados: 20, col: [236, 236, 232], k: K.LISO });
      L.tambor(B, 0, 0, 58.6, 60.5, 5, { lados: 12, col: [200, 200, 198], k: K.METAL });
      L.mastil(B, 2, 1, 60.5, 4.5, 0.12, { col: [210, 60, 50] }); L.mastil(B, -2.5, -1.5, 60.5, 3, 0.1, { col: [200, 200, 200] });
      L.esfera(B, -1, 61.8, 2.5, 1.1, { col: [240, 240, 240] });                                   // radomo
    } });
  // torre antigua (junto a la T1): fuste cuadrado y fanal
  ficha({ id: 'aero_torre_antigua', nombre: 'Torre de control antiga', nivel: 'B', x: DATA_PH('ta', 0), z: DATA_PH('ta', 1), alto: 40, noche: 'ventanas', edificios: [],
    build(B, h, L) {
      L.caja(B, 0, 0, -1, 7, 7, 33, 66, [206, 200, 188], K.VENTANAS, { aux: L.aux.ventanas(3.3, 2.3, 0.3, 0.4) });
      L.caja(B, 0, 0, 32, 10.5, 10.5, 1.2, 66, [200, 200, 196], K.LISO);
      L.caja(B, 0, 0, 33.2, 10, 10, 4.2, 66, [80, 104, 124], K.CORTINA, { aux: L.aux.cortina(4.2, 1.5, 0.05) });
      L.caja(B, 0, 0, 37.4, 11, 11, 0.9, 66, [190, 190, 186], K.LISO);
      L.mastil(B, 2, 2, 38.3, 5, 0.1, { col: [200, 60, 50] });
    } });
  // hangar de mantenimiento (planta de OSM): nave con la puerta corredera enorme hacia la plataforma y bóveda rebajada
  ficha({ id: 'aero_hangar', nombre: 'Hangar de manteniment', nivel: 'B', x: 5620, z: 5700, alto: 30, ancho: 200, largo: 120, noche: 'nada', edificios: [],
    build(B, h, L) {
      const pl = DATA.d.hangarIberia.map(p => [p[0] - h.x, p[1] - h.z]);
      L.prisma(B, pl, -1, 24, [208, 210, 212], K.METAL, { aux: L.aux.panel(2.5, 0.12, 0), techo: [176, 178, 180], kTecho: K.METAL, auxTecho: L.aux.panel(4, 0.08, 0) });
      // puerta: paños verticales en la fachada sur (la que mira a la plataforma)
      let mn = 1e9, a = null, b = null; for (let i = 0; i < pl.length; i++) { const p = pl[i], q = pl[(i + 1) % pl.length], m = (p[1] + q[1]) / 2;
        if (Math.hypot(q[0] - p[0], q[1] - p[1]) > 60 && m < mn) { mn = m; a = p; b = q; } }
      if (a) { const t = unit(b[0] - a[0], b[1] - a[1]), n = [t[1], -t[0]], Ld = Math.hypot(b[0] - a[0], b[1] - a[1]);
        for (let u = 6; u < Ld - 6; u += 12) { const x = a[0] + t[0] * (u + 6) + n[0] * 0.4, z = a[1] + t[1] * (u + 6) + n[1] * 0.4;
          L.caja(B, x, z, 0, 11.6, 0.5, 20, hdg(t[0], t[1]) + 90, [150, 156, 164], K.METAL, { aux: L.aux.panel(1.2, 0.25, 0) }); } }
    } });
  // parque de bomberos (SEI) junto a la torre: nave de cocheras con portones rojos y torre de prácticas (situación aproximada)
  ficha({ id: 'aero_bomberos', nombre: 'Bombers de l’aeroport', nivel: 'B', x: 5745, z: 3905, rot: 66, alto: 18, ancho: 30, largo: 60, noche: 'ventanas', edificios: [],
    build(B, h, L) {
      L.caja(B, 0, 0, -1, 22, 56, 9, 0, [222, 220, 214], K.VENTANAS, { aux: L.aux.ventanas(4.5, 6, 0.2, 0.3), techo: [170, 170, 168] });
      for (let k = 0; k < 6; k++) L.caja(B, -11.1, -22.5 + k * 9, 0, 0.3, 6.6, 6, 0, [196, 40, 36], K.METAL, { aux: L.aux.panel(0.6, 0.1, 0) });
      L.caja(B, 4, 33, -1, 6, 6, 18, 0, [196, 60, 50], K.LISO);
      for (let k = 0; k < 4; k++) L.caja(B, -17, -21 + k * 9.5, 0, 3, 11, 3.4, 0, [206, 30, 28], K.LISO);   // autobombas en la explanada
    } });
  // aviones y vehículos de pista: una sola malla (una llamada de dibujo)
  ficha({ id: 'aero_aviones', nombre: 'Avions', etiqueta: false, nivel: 'B', x: 5000, z: 4000, alto: 17, noche: 'nada', edificios: [],
    build(B, h, L) {
      const R = rng(2025), ST = stands();
      for (const s of ST) {
        const x = s.x - h.x, z = s.z - h.z, yb = h.y(x, z) + 0.45, a = hdg(s.f[0], s.f[1]);
        avion(B, L, s.tipo, x, z, a, yb, R);
        if (s.pas) vehiculos(B, L, s, x, z, yb, R);
      }
    } });
  // recinto del aeropuerto: sin malla; solo despeja de árboles y matas el campo de vuelo (nature.js lee las huellas de los hitos)
  ficha({ id: 'aero_campo', nombre: 'Camp de vol', etiqueta: false, nivel: 'C', x: 5089, z: 3984, rot: 66, alto: 1, ancho: 2100, largo: 3740, edificios: [] });

  // la carga de los hitos espera al JSON; con él, cada ficha sustituye los volúmenes simples que caen en su planta
  const LMS = window.BCN_LANDMARKS;
  if (LMS && LMS.init) { const init0 = LMS.init;
    LMS.init = async function (ctx) {
      const d = await dataP;
      if (d) try {
        const BR = ctx.BREC, bb = BR.bb, fx = id => LM.fichas.find(f => f.id === id);
        const plT = { aeroport: d.t1, aero_t1: d.t1, aero_t2: d.t2, aero_hangar: d.hangarIberia, aero_torre: d.torre.planta };
        for (const [id, P] of Object.entries(plT)) { const f = fx(id); if (!f) continue; const set = new Set(f.edificios || []);
          let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const p of P) { x0 = Math.min(x0, p[0]); z0 = Math.min(z0, p[1]); x1 = Math.max(x1, p[0]); z1 = Math.max(z1, p[1]); }
          for (let b = 0; b < BR.n; b++) { const k = b * 4, cx = (bb[k] + bb[k + 2]) / 2, cz = (bb[k + 1] + bb[k + 3]) / 2;
            if (cx < x0 || cx > x1 || cz < z0 || cz > z1) continue; if (inPoly(P, cx, cz)) set.add(b); }
          f.edificios = [...set]; }
        const ta = fx('aero_torre_antigua'); if (ta) { ta.x = d.torreAntigua.c[0]; ta.z = d.torreAntigua.c[1]; }
      } catch (e) { console.warn('Aeropuerto: no se han podido asignar los volúmenes sustituidos', e); }
      else for (const f of LM.fichas) if (/^aero_/.test(f.id)) f.build = undefined;
      return init0.call(this, ctx);
    }; }
}
// marcador de posición de la torre antigua hasta que llega el JSON (se corrige en el init de los hitos)
function DATA_PH(k, i) { return [3971, 3120][i]; }

// ------------------------------------------------------------------ marcas en el suelo (módulo BCN_AERO)
// Una malla con un shader propio. Atributos: position (mundo), uv = (s, t) en metros, color (rgb; a = tipo: 0 pista,
// 1 pintura), rw = (largo, ancho pintado, designador del extremo A, del extremo B) para la pista; (ancho de la línea, …)
// para la pintura.
const VS = `precision highp float;
attribute vec3 position; attribute vec2 uv; attribute vec4 color; attribute vec4 rw;
uniform mat4 world; uniform mat4 viewProjection;
varying vec3 vPos; varying vec2 vST; varying vec4 vC; varying vec4 vRw;
void main(){ vec4 wp = world*vec4(position, 1.0); vPos = wp.xyz; vST = uv; vC = color; vRw = rw; gl_Position = viewProjection*wp; }`;
const FS = `
varying vec2 vST; varying vec4 vC; varying vec4 vRw;
uniform sampler2D tDes;
float cov(float x, float a, float b, float w){ return clamp((min(x + 0.5*w, b) - max(x - 0.5*w, a))/w, 0.0, 1.0); }
float bars(float x, float x0, float pitch, float on, float n, float w){
  float u = (x - x0)/pitch, k = floor(u);
  float c = (k >= 0.0 && k < n) ? cov(fract(u), 0.0, on, w/pitch) : 0.0;
  return mix(c, on*step(0.0, u)*step(u, n), smoothstep(0.35, 1.0, w/pitch));
}
void main(){
  vec3 V = normalize(uCam - vPos), N = vec3(0.0, 1.0, 0.0);
  if (vC.a < 0.5) {
    float s = vST.x, t = vST.y, L = vRw.x, W = vRw.y;
    float wS = max(fwidth(s), 0.02), wT = max(fwidth(t), 0.02);
    bool A = s < 0.5*L; float ss = A ? s : L - s, tt = A ? t : -t, at = abs(t), des = A ? vRw.z : vRw.w;
    float n1 = vnoise(vPos.xz*0.11), n2 = vnoise(vPos.xz*0.9 + 7.0);
    vec3 asf = vec3(0.205, 0.205, 0.215)*(0.86 + 0.22*n1 + 0.06*n2);
    float sh = smoothstep(W*0.5, W*0.5 + 0.6, at);
    asf = mix(asf, vec3(0.30, 0.30, 0.29)*(0.9 + 0.2*n1), sh);
    // caucho de las tomas: oscuro en el centro entre 120 y 1000 m de cada umbral
    float rub = smoothstep(100.0, 220.0, ss)*(1.0 - smoothstep(700.0, 1050.0, ss))*(1.0 - smoothstep(6.0, 16.0, at));
    asf = mix(asf, vec3(0.085, 0.085, 0.09), rub*(0.55 + 0.4*vnoise(vec2(s*0.05, t*0.4))));
    float p = 0.0, hw = W*0.5;
    p = max(p, cov(at, hw - 0.9, hw, wT)*cov(ss, 0.0, L, wS));                              // bordes
    float pk = W > 50.0 ? 8.0 : 6.0, k0 = W > 50.0 ? 2.7 : 1.9;
    p = max(p, cov(ss, 6.0, 36.0, wS)*bars(at, k0, 3.6, 0.5, pk, wT));                      // umbral en piano
    p = max(p, cov(ss, 0.0, 1.2, wS)*cov(at, 0.0, hw, wT));                                 // barra de umbral
    p = max(p, cov(ss, 80.0, L*0.5, wS)*cov(at, 0.0, 0.45, wT)*bars(s - 80.0, 0.0, 50.0, 0.6, 999.0, wS));   // eje
    float ai = W > 50.0 ? 9.0 : 6.5;
    p = max(p, cov(ss, 400.0, 460.0, wS)*cov(at, ai, ai + 10.0, wT));                        // punto de visada
    for (int g = 0; g < 5; g++) {                                                            // toma de contacto
      float s0 = g == 0 ? 150.0 : g == 1 ? 300.0 : g == 2 ? 550.0 : g == 3 ? 700.0 : 850.0;
      float nb = g < 2 ? 3.0 : g < 4 ? 2.0 : 1.0;
      p = max(p, cov(ss, s0, s0 + 22.5, wS)*bars(at, ai, 3.3, 0.545, nb, wT));
    }
    // designador (atlas de 8 casillas: número arriba y letra abajo, tal como los lee el piloto que llega)
    if (ss > 46.0 && ss < 72.0 && at < 9.5) {
      vec2 q = vec2((des + clamp((9.0 - tt)/18.0, 0.0, 1.0))/8.0, clamp((ss - 48.0)/22.0, 0.0, 1.0));
      p = max(p, texture2D(tDes, q).r*cov(ss, 48.0, 70.0, wS)*cov(at, 0.0, 9.0, wT));
    }
    vec3 pint = vec3(0.86, 0.86, 0.84)*(0.84 + 0.16*n2);
    vec3 alb = mix(asf, pint, p*(0.85 + 0.15*n1));
    vec3 c = shade(alb, N, V, 0.86, 0.0, 1.0);
    FRAG(c);
  } else {
    // pintura (líneas de rodaje, puntos de espera, puestos): por debajo del píxel, tramado en vez de parpadeo
    float w = vRw.x, fw = max(fwidth(vST.y), 1e-3);
    if (dith() > clamp(w/fw, 0.0, 1.0)*1.2) discard;
    vec3 alb = vC.rgb*(0.86 + 0.14*vnoise(vPos.xz*0.7));
    vec3 c = shade(alb, N, V, 0.8, 0.0, 1.0);
    FRAG(c);
  }
}`;

window.BCN_AERO = { async init(ctx) {
  const d = await dataP; if (!d) throw new Error('sin datos');
  const { scene, engine, heightAt, mkMat, reg } = ctx, VB = BABYLON.VertexBuffer;
  const P = [], UV = [], C = [], RW = [], I = [];
  const vtx = (x, y, z, s, t, col, k, r) => { P.push(x, y, z); UV.push(s, t); C.push(col[0], col[1], col[2], k); RW.push(r[0], r[1], r[2], r[3]); return P.length / 3 - 1; };
  // pistas: rejilla de 20 m a lo largo y 5 franjas a lo ancho, 0,45 m sobre el terreno (por encima de las cintas de calle)
  const DES = []; d.pistas.forEach(p => DES.push(p.des[0], p.des[1]));
  d.pistas.forEach((p, ip) => {
    const ax = p.b[0] - p.a[0], az = p.b[1] - p.a[1], L = Math.hypot(ax, az), u = [ax / L, az / L], lf = [-u[1], u[0]];
    const WT = p.w + (p.w < 50 ? 15 : 4), ns = Math.ceil(L / 20), tq = [-WT / 2, -p.w / 2, 0, p.w / 2, WT / 2], r = [L, p.w, ip * 2, ip * 2 + 1];
    const base = P.length / 3;
    for (let i = 0; i <= ns; i++) { const s = L * i / ns; for (const t of tq) { const x = p.a[0] + u[0] * s + lf[0] * t, z = p.a[1] + u[1] * s + lf[1] * t;
      vtx(x, heightAt(x, z) + 0.45, z, s, t, [0, 0, 0], 0, r); } }
    for (let i = 0; i < ns; i++) for (let j = 0; j < 4; j++) { const a = base + i * 5 + j, b = a + 5; I.push(a, b, a + 1, a + 1, b, b + 1); }
  });
  // pintura: cinta recta de a → b de ancho w (con y por encima del terreno)
  const AMA = [222, 172, 30], BLA = [232, 232, 228], ROJ = [196, 46, 40];
  function cinta(a, b, w, col, dy) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.05) return; const u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], n = [-u[1] * w / 2, u[0] * w / 2];
    const r = [w, 0, 0, 0], q = [];
    for (const [p, s] of [[a, 0], [b, L]]) for (const sg of [-1, 1]) { const x = p[0] + n[0] * sg, z = p[1] + n[1] * sg; q.push(vtx(x, heightAt(x, z) + dy, z, s, sg * w / 2, col, 255, r)); }
    I.push(q[0], q[2], q[1], q[1], q[2], q[3]);
  }
  // puntos de espera (patrón A): donde una calle de rodaje cruza la distancia de espera de una pista, dos líneas continuas
  // del lado de la calle y dos discontinuas del lado de la pista, de lado a lado de la calle
  let nHold = 0;
  for (const pl of d.rodaje) for (let i = 0; i + 1 < pl.length; i++) {
    const a = pl[i], b = pl[i + 1];
    for (const p of d.pistas) {
      const ax = p.b[0] - p.a[0], az = p.b[1] - p.a[1], L = Math.hypot(ax, az), u = [ax / L, az / L];
      const dd = q => (-(q[0] - p.a[0]) * u[1] + (q[1] - p.a[1]) * u[0]), ss = q => ((q[0] - p.a[0]) * u[0] + (q[1] - p.a[1]) * u[1]);
      const H = 90, da = Math.abs(dd(a)), db = Math.abs(dd(b));
      if ((da - H) * (db - H) >= 0) continue;
      const f = (H - da) / (db - da), X = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], sx = ss(X);
      if (sx < -60 || sx > L + 60) continue;
      const t = unit(b[0] - a[0], b[1] - a[1]), aw = db > da ? t : [-t[0], -t[1]], n = [-t[1], t[0]], half = 10.5;
      for (let k = 0; k < 4; k++) { const o = 0.15 + k * 0.85, c = [X[0] + aw[0] * o, X[1] + aw[1] * o];
        if (k >= 2) cinta([c[0] - n[0] * half, c[1] - n[1] * half], [c[0] + n[0] * half, c[1] + n[1] * half], 0.45, AMA, 0.5);
        else for (let e = -half; e < half - 0.5; e += 2.0) cinta([c[0] + n[0] * e, c[1] + n[1] * e], [c[0] + n[0] * (e + 1.1), c[1] + n[1] * (e + 1.1)], 0.45, AMA, 0.5); }
      nHold++;
    }
  }
  // puestos: línea de entrada amarilla (bajo el fuselaje y 60 m hacia fuera), barra de parada blanca en el morro y límite
  // rojo de la zona de seguridad del puesto
  const stl = window.BCN_AERO_STANDS ? window.BCN_AERO_STANDS() : [];
  for (const s of stl) {
    const A = AV[s.tipo], f = s.f, n = [-f[1], f[0]], dy = 0.42;
    const m = [s.x + f[0] * 2, s.z + f[1] * 2], o = [s.x - f[0] * (A.L + 60), s.z - f[1] * (A.L + 60)];
    cinta(o, m, 0.45, AMA, dy);
    cinta([s.x + f[0] * 2 - n[0] * 3, s.z + f[1] * 2 - n[1] * 3], [s.x + f[0] * 2 + n[0] * 3, s.z + f[1] * 2 + n[1] * 3], 0.7, BLA, dy);
    const hx = A.S / 2 + 4, z0 = 5, z1 = -(A.L + 6), cn = [[-hx, z0], [hx, z0], [hx, z1], [-hx, z1]].map(([x, z]) => [s.x + n[0] * x + f[0] * z, s.z + n[1] * x + f[1] * z]);
    for (let k = 0; k < 4; k++) if (k !== 2 || !s.pas) cinta(cn[k], cn[(k + 1) % 4], 0.3, ROJ, dy);
  }
  // atlas de designadores: 8 casillas de 128 × 256 (número arriba, letra abajo), blanco sobre negro
  const tex = new BABYLON.DynamicTexture('aeroDes', { width: 1024, height: 256 }, scene, true);
  const g = tex.getContext(); g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 256); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  DES.forEach((t, i) => { const num = t.replace(/[LRC]/, ''), let_ = t.replace(/[0-9]/g, '');
    g.font = 'bold 118px sans-serif'; g.save(); g.translate(i * 128 + 64, let_ ? 64 : 128); g.scale(0.55, 1.0); g.fillText(num, 0, 0); g.restore();
    if (let_) { g.save(); g.translate(i * 128 + 64, 192); g.scale(0.62, 1.0); g.fillText(let_, 0, 0); g.restore(); } });
  tex.update(true); tex.wrapU = tex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE; tex.anisotropicFilteringLevel = 8;
  const mat = mkMat('aero_marcas', VS, FS, ['position', 'uv', 'color', 'rw'], [], ['tDes'], { cull: false });
  mat.setTexture('tDes', tex); mat.zOffset = -1; mat.zOffsetUnits = -4;
  const mesh = new BABYLON.Mesh('aeroMarcas', scene);
  mesh.setVerticesData('position', new Float32Array(P), false);
  mesh.setVerticesData('uv', new Float32Array(UV), false, 2);
  mesh.setVerticesBuffer(new VB(engine, new Uint8Array(C), 'color', false, false, 4, false, 0, 4, VB.UNSIGNED_BYTE, true));
  mesh.setVerticesBuffer(new VB(engine, new Float32Array(RW), 'rw', false, false, 4));
  mesh.setIndices(new Uint32Array(I), P.length / 3);
  mesh.material = mat; mesh.isPickable = false; mesh.renderingGroupId = 1; mesh.freezeWorldMatrix(); mesh.alwaysSelectAsActiveMesh = true; mesh.doNotSyncBoundingInfo = true;
  reg(mesh, { cast: false, layer: 'road' });
  const tris = I.length / 3, nStands = stl.length;
  return { update() {}, busy: () => false, stats: () => ({ tris, hold: nHold, puestos: nStands }) };
} };
// los puestos (los mismos que usan los hitos) para las marcas del suelo
window.BCN_AERO_STANDS = () => (DATA.d ? stands() : []);
})();
