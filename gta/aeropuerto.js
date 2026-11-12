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
const DATA = { d: null }, AERO_LOD = { n: 0 };
const dataP = fetch('data/aero_lado_aire.json').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
  .then(d => (DATA.d = d)).catch(e => { console.warn('Aeropuerto: sin datos (data/aero_lado_aire.json)', e); return null; });
// AE2: lado tierra (aparcamientos, P1, estación). Sin él, el lado aire sigue igual
const cesP = fetch('data/aero_cesped.json').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
  .catch(e => { console.warn('Aeropuerto: sin césped (data/aero_cesped.json)', e); return null; });
const dataT = fetch('data/aero_lado_tierra.json').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
  .then(d => (DATA.t = d)).catch(e => { console.warn('Aeropuerto: sin datos del lado tierra (data/aero_lado_tierra.json)', e); return null; });
const cargaP = fetch('data/aero_carga.json').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
  .catch(e => { console.warn('Aeropuerto: sin carga ni combustible (data/aero_carga.json)', e); return null; });

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

// ------------------------------------------------------------------ torres de focos (AE2): plataformas, aparcamientos y cubierta del P1
// { x, z, h (alto), d: [dx, dz] (hacia dónde alumbra), kind: 'a' plataforma | 'p' aparcamiento | 'r' cubierta del P1, lot }
let MASTS = null;
function segDist(p, a, b) { const ax = b[0] - a[0], az = b[1] - a[1], L2 = ax * ax + az * az || 1, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ax + (p[1] - a[1]) * az) / L2));
  return Math.hypot(p[0] - a[0] - ax * t, p[1] - a[1] - az * t); }
function masts() {
  if (MASTS) return MASTS;
  const d = DATA.d, t = DATA.t, out = [];
  if (!d) return (MASTS = out);
  const far = (x, z, r) => out.every(m => Math.hypot(m.x - x, m.z - z) > r);
  const clear = (x, z) => d.pistas.every(p => segDist([x, z], p.a, p.b) > p.w / 2 + 150) && !inPoly(d.t1, x, z) && !inPoly(d.t2, x, z);
  for (const P of d.plataformas) {
    let cx = 0, cz = 0; for (const p of P) { cx += p[0]; cz += p[1]; } cx /= P.length; cz /= P.length;
    for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 50) continue;
      const tt = unit(b[0] - a[0], b[1] - a[1]); let n = [-tt[1], tt[0]];
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; if (inPoly(P, mid[0] + n[0] * 8, mid[1] + n[1] * 8)) n = [-n[0], -n[1]];
      const k = Math.max(1, Math.round(L / 150));
      for (let j = 0; j < k; j++) { const u = (j + 0.5) / k * L, x = a[0] + tt[0] * u + n[0] * 9, z = a[1] + tt[1] * u + n[1] * 9;
        if (!clear(x, z) || !far(x, z, 80)) continue; out.push({ x, z, h: 30, d: [-n[0], -n[1]], kind: 'a' }); } }
  }
  if (t) {
    t.aparcamientos.forEach((lot, li) => { const P = lot.p, u = lot.ax, v = [-u[1], u[0]];
      let u0 = 1e9, u1 = -1e9, w0 = 1e9, w1 = -1e9; for (const p of P) { const a = p[0] * u[0] + p[1] * u[1], b = p[0] * v[0] + p[1] * v[1]; u0 = Math.min(u0, a); u1 = Math.max(u1, a); w0 = Math.min(w0, b); w1 = Math.max(w1, b); }
      // en la línea de los pasillos (b + 13: entre filas dobles), cada 52 m
      for (let b = w0 + 4 + 13.5; b < w1 - 4; b += 34) for (let a = u0 + 20; a < u1 - 10; a += 52) {
        const x = u[0] * a + v[0] * b, z = u[1] * a + v[1] * b;
        if (!inPoly(P, x, z) || !inPoly(P, x + u[0] * 8, z + u[1] * 8) || !inPoly(P, x - u[0] * 8, z - u[1] * 8)) continue;
        out.push({ x, z, h: 13, d: v, kind: 'p', lot: li }); } });
    if (t.p1) { let cx = 0, cz = 0; for (const p of t.p1) { cx += p[0]; cz += p[1]; } cx /= t.p1.length; cz /= t.p1.length;
      for (let x = cx - 160; x <= cx + 160; x += 42) for (let z = cz - 200; z <= cz + 200; z += 42) {
        const P = t.p1.map(p => { const dx = p[0] - cx, dz = p[1] - cz, l = Math.hypot(dx, dz) || 1; return [p[0] - dx / l * 26, p[1] - dz / l * 26]; });
        if (inPoly(P, x, z)) out.push({ x, z, h: 6, d: [1, 0], kind: 'r' }); } }
  }
  return (MASTS = out);
}

// ------------------------------------------------------------------ AE3: geometría compartida de la T1 y la T2
// Recta de la fachada de llegadas de la T1 (rumbo 156°, mira al oeste-suroeste): n hacia fuera, t a lo largo; f = n·p de la
// fachada, [u0, u1] = extensión en t. La usan el bordillo (hito), lo menudo, los rótulos y las luces.
function curbFrame(d) {
  const n = [-0.9135, -0.4067], t = [0.4067, -0.9135], fr = d.t1.filter(p => p[1] > 2990 && p[1] < 3360 && p[0] > 3940 && p[0] < 4200);
  let f = -1e9; for (const p of fr) f = Math.max(f, p[0] * n[0] + p[1] * n[1]);
  let u0 = 1e9, u1 = -1e9; for (const p of fr) if (p[0] * n[0] + p[1] * n[1] > f - 15) { const u = p[0] * t[0] + p[1] * t[1]; u0 = Math.min(u0, u); u1 = Math.max(u1, u); }
  const a = [n[0] * f + t[0] * u0, n[1] * f + t[1] * u0];
  return { n, t, f, u0, u1, Ld: u1 - u0, a, P: (u, o) => [a[0] + t[0] * u + n[0] * o, a[1] + t[1] * u + n[1] * o] };
}
// recorte de un polígono (cualquiera) por semiplanos convexos: cada plano [nx, nz, c] deja n·p >= c (Sutherland-Hodgman)
function clipHP(P, planes) {
  let o = P.slice();
  for (const [nx, nz, c] of planes) { const r = []; if (!o.length) break;
    for (let i = 0; i < o.length; i++) { const a = o[i], b = o[(i + 1) % o.length], da = a[0] * nx + a[1] * nz - c, db = b[0] * nx + b[1] * nz - c;
      if (da >= 0) r.push(a);
      if ((da >= 0) !== (db >= 0)) { const k = da / (da - db); r.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); } }
    o = r; }
  return o;
}
// desplazamiento de un polígono: d > 0 crece, d < 0 encoge (inglete limitado a 3 d)
function offs(P, d) { const sg = areaS(P) > 0 ? 1 : -1, n = P.length, o = [];
  const nr = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [dz / l * sg, -dx / l * sg]; };
  for (let i = 0; i < n; i++) { const p = P[i], n1 = nr(P[(i - 1 + n) % n], p), n2 = nr(p, P[(i + 1) % n]);
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const k = 1 + n1[0] * n2[0] + n1[1] * n2[1]; mx /= Math.max(k, 0.2); mz /= Math.max(k, 0.2);
    const l = Math.hypot(mx, mz); if (l > 3) { mx *= 3 / l; mz *= 3 / l; } o.push([p[0] + mx * d, p[1] + mz * d]); }
  return o;
}
// procesador central de la T1: la franja de 170 m detrás de la fachada de llegadas, entre los arranques de los diques norte y sur
function procT1(d) { const c = curbFrame(d);
  return clipHP(d.t1, [[-c.n[0], -c.n[1], -c.f - 5], [c.n[0], c.n[1], c.f - 170], [c.t[0], c.t[1], c.u0 - 6], [-c.t[0], -c.t[1], -c.u1 - 6]]); }
// edificios de la T2 (A, B y C): la franja de 75 m detrás de la fachada de lado tierra (mira al nor-noroeste)
function procT2(d) { const n = [-0.4067, 0.9135]; let f = -1e9; for (const p of d.t2) f = Math.max(f, p[0] * n[0] + p[1] * n[1]);
  return clipHP(d.t2, [[n[0], n[1], f - 75]]); }

// ------------------------------------------------------------------ hitos
if (!LM) { console.warn('Aeropuerto: sin BCN_LM (landmarks.js no se ha cargado)'); }
else {
  const { K } = LM;
  const WH = [236, 238, 240], GR = [178, 182, 188], GRO = [92, 96, 102], NEG = [34, 36, 40];
  // ---- un avión de librea genérica en B (morro en el origen, mirando a +Z), luego se coloca con xf
  function avion(B, L, tipo, x, z, ang, yb, R, carga) {
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
      if (!carga) L.caja(B, s * (Rf - 0.05), -Lg * 0.43, yc + Rf * 0.22, 0.16, Lg * 0.56, 0.32, 0, VI, K.LISO);
      else if (s < 0) L.caja(B, s * (Rf - 0.04), -Lg * 0.2, yc - Rf * 0.05, 0.12, 5.2, 3.2, 0, [200, 204, 210], K.METAL, { aux: L.aux.panel(1.0, 0.04, 0) });   // puerta de carga
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
    // AE3: diques (más bajos) con cubierta plana gris y alero; el procesador central sube a 27,5 m con su cubierta ondulada
    // (crestas cada 42 m a lo largo de la terminal) y un lucernario corrido de vidrio en cada cresta
    L.prisma(B, L.mover(loc, 0, 0, 0, 1), 15.2, 16.3, [178, 182, 188], K.METAL, { aux: L.aux.panel(3, 0.06, 0), techo: [170, 174, 178], kTecho: K.METAL, auxTecho: L.aux.panel(6, 0.12, 0) });
    const PR = procT1(d).map(p => [p[0] - h.x, p[1] - h.z]);
    if (PR.length >= 3 && Math.abs(areaS(PR)) > 1000) {
      const UU = [0.9135, 0.4067], VV = [-0.4067, 0.9135], ola2 = (x, z) => 29.6 + 2.3 * Math.cos((x * UU[0] + z * UU[1]) / 42 * 2 * Math.PI);
      L.prisma(B, PR, 16.3, 27.6, [112, 140, 158], K.CORTINA, { aux: L.aux.cortina(4.6, 2.0, 0.1), sinTecho: true });
      L.prisma(B, offs(PR, 3), 27.6, ola2, [240, 240, 238], K.METAL, { aux: L.aux.panel(2.5, 0.04, 0), techo: [240, 240, 238], kTecho: K.METAL, auxTecho: L.aux.panel(1.8, 0.03, 0) });
      // lucernarios en las crestas: tramos continuos dentro de la planta (con 6 m de margen)
      let s0 = 1e9, s1 = -1e9, w0 = 1e9, w1 = -1e9; for (const p of PR) { const s = p[0] * UU[0] + p[1] * UU[1], w = p[0] * VV[0] + p[1] * VV[1]; s0 = Math.min(s0, s); s1 = Math.max(s1, s); w0 = Math.min(w0, w); w1 = Math.max(w1, w); }
      const PRi = offs(PR, -8);
      for (let k = Math.ceil(s0 / 42); k * 42 <= s1; k++) { const s = k * 42; let a = null;
        for (let w = w0; w <= w1 + 4; w += 4) { const x = UU[0] * s + VV[0] * w, z = UU[1] * s + VV[1] * w, ins = w <= w1 && inPoly(PRi, x, z);
          if (ins && a === null) a = w;
          if (!ins && a !== null) { if (w - a > 10) { const m = (a + w - 4) / 2; L.caja(B, UU[0] * s + VV[0] * m, UU[1] * s + VV[1] * m, 31.4, 6, w - 4 - a, 1.2, hdg(VV[0], VV[1]), [150, 186, 208], K.CORTINA, { aux: L.aux.cortina(1.2, 1.5, 0.05), techo: [128, 168, 196], kTecho: K.CORTINA }); } a = null; } } }
    }
    // lado tierra: en los frentes largos que miran al oeste-suroeste (rumbo 246°), el bordillo de llegadas a pie de calle
    // (acera elevada y marquesina) y, encima, el viaducto de salidas con su bordillo cubierto a la altura del vestíbulo
    const sg = areaS(loc) > 0 ? 1 : -1, HOR = [196, 194, 188], AS = [70, 70, 74];
    // AE2/AE3: la fachada de llegadas es una recta (rumbo 156°) que mira al oeste-suroeste, hacia el P1. A pie de calle, el
    // bordillo de llegadas (acera gris con bordillo de granito, carril de parada, carril de taxis, pasos de cebra, isleta con
    // los pilares del viaducto); encima, el viaducto de salidas (tablero con vigas, acera, carriles y marquesina). Lo menudo
    // (coches, taxis, gente, bancos, carros) va en la ficha aparte «aero_t1_menudo», que se oculta de lejos.
    { const cf = curbFrame(d), Ld = cf.Ld, ang = hdg(cf.t[0], cf.t[1]), at = (u, o) => { const p = cf.P(u, o); return [p[0] - h.x, p[1] - h.z]; }, m = Ld / 2;
      const ACE = [132, 130, 126], GRA = [160, 158, 152], HOR = [146, 144, 138], HORo = [118, 116, 112], AS = [62, 62, 66], BL = [226, 226, 222], AMA = [220, 172, 34];
      const strip = (u0, u1, o0, o1, y0, al, col, k, ox) => { const q = at((u0 + u1) / 2, (o0 + o1) / 2); L.caja(B, q[0], q[1], y0, o1 - o0, u1 - u0, al, ang, col, k, ox); };
      // ---- llegadas (a pie de calle)
      strip(5, Ld - 5, 0, 9.8, -1, 1.18, ACE, K.LISO, { aux: L.aux.liso(0.6) });                       // acera (baldosa gris)
      strip(5, Ld - 5, 9.8, 10.1, -1, 1.2, GRA, K.LISO);                                                // bordillo de granito
      strip(5, Ld - 5, 10.1, 17.6, -1, 1.0, AS, K.LISO);                                                // carril de parada y de paso
      strip(15, Ld - 15, 17.6, 21.2, -1, 1.15, ACE, K.LISO, { aux: L.aux.liso(0.6) });                  // isleta (con los pilares)
      strip(15, Ld - 15, 17.6, 17.8, -1, 1.17, GRA, K.LISO); strip(15, Ld - 15, 21.0, 21.2, -1, 1.17, GRA, K.LISO);
      const uTx = Ld * 0.62;                                                                            // carril de taxis: el último tercio
      for (let u = 8; u < Ld - 8; u += 6) if (u < uTx - 4) strip(u, u + 3, 13.9, 14.05, 0, 0.02, BL, K.LISO);   // línea discontinua
      strip(uTx, Ld - 8, 13.9, 14.05, 0, 0.02, AMA, K.LISO); strip(uTx, Ld - 8, 10.25, 10.4, 0, 0.02, AMA, K.LISO);  // líneas amarillas del carril de taxis
      for (let u = uTx; u < Ld - 10; u += 3) strip(u, u + 1.6, 10.4, 13.9, 0, 0.015, [204, 166, 40], K.LISO);  // cebreado amarillo (zona reservada)
      const zebra = (uc, o0, o1, y) => { for (let k = -3; k < 3; k++) strip(uc + k * 1.0, uc + k * 1.0 + 0.5, o0, o1, y, 0.02, BL, K.LISO); };
      for (const r of [0.2, 0.45, 0.8]) zebra(Ld * r, 10.1, 17.6, 0);
      // pilares del viaducto (hormigón con junta de encofrado y capitel) y tablero con vigas; cara inferior propia
      for (let u = 16; u < Ld - 10; u += 24) for (const o of [9, 19.4]) { const q = at(u, o);
        L.caja(B, q[0], q[1], -1, 1.1, 1.1, 7.0, ang, HOR, K.LISO, { aux: L.aux.panel(1.25, 0.12, 0) });
        L.caja(B, q[0], q[1], 5.9, 1.7, 1.7, 0.4, ang, HORo, K.LISO); }
      for (let u = 16; u < Ld - 10; u += 24) strip(u - 0.45, u + 0.45, 2, 24, 6.3, 0.9, HORo, K.LISO, { suelo: true });   // vigas transversales
      for (const o of [9, 19.4]) strip(10, Ld - 10, o - 0.6, o + 0.6, 6.3, 0.9, HORo, K.LISO, { suelo: true });            // vigas longitudinales
      strip(10, Ld - 10, 2, 24, 7.2, 1.4, HOR, K.LISO, { aux: L.aux.panel(3, 0.05, 0), suelo: true });                       // tablero
      strip(10, Ld - 10, 23.6, 24.0, 8.6, 1.1, [176, 174, 168], K.LISO, { suelo: true });                                   // pretil
      // ---- salidas (sobre el viaducto)
      strip(10, Ld - 10, 2, 9.8, 8.6, 0.25, ACE, K.LISO, { aux: L.aux.liso(0.6) });                    // acera de salidas
      strip(10, Ld - 10, 9.8, 10.1, 8.6, 0.27, GRA, K.LISO);
      strip(10, Ld - 10, 10.1, 23.6, 8.6, 0.02, AS, K.LISO);                                            // calzada del viaducto
      for (let u = 14; u < Ld - 14; u += 6) for (const o of [14, 18.8]) strip(u, u + 3, o - 0.07, o + 0.07, 8.62, 0.02, BL, K.LISO);
      for (const r of [0.3, 0.7]) zebra(Ld * r, 10.1, 13.9, 8.62);
      let q = at(m, 2.5); L.caja(B, q[0], q[1], 8.85, 0.12, Ld - 26, 3.0, ang, [120, 140, 156], K.CORTINA, { aux: L.aux.cortina(3, 1.5, 0.05) });   // mampara
      q = at(m, 9); L.caja(B, q[0], q[1], 13.4, 15, Ld - 20, 0.6, ang, [230, 232, 232], K.METAL, { aux: L.aux.panel(2.4, 0.05, 0), suelo: true });   // marquesina
      for (let u = 14; u < Ld - 10; u += 18) { q = at(u, 15.2); L.caja(B, q[0], q[1], 8.6, 0.3, 0.3, 4.9, 0, [140, 144, 150], K.METAL); }   // pilares de la marquesina
      // accesos: vestíbulos cortavientos de vidrio con marco oscuro, abajo (llegadas) y arriba (salidas)
      for (let u = 30; u < Ld - 20; u += 40) for (const y0 of [0.18, 8.85]) { q = at(u, 1.3);
        // AE4: vidrio claro reflectante (antes se leía como caja negra), montantes de aluminio y puerta corredera de dos hojas
        // (cuerpo de vidrio claro mate, que no refleja el techo oscuro del viaducto, y una lámina reflectante en el frente)
        L.caja(B, q[0], q[1], y0, 2.5, 6.2, 2.9, ang, [182, 206, 216], K.LISO, { aux: L.aux.liso(1.24), techo: [168, 172, 176], kTecho: K.METAL });
        q = at(u, 2.575); L.caja(B, q[0], q[1], y0 + 2.3, 0.03, 6.2, 0.6, ang, [214, 230, 238], K.CORTINA, { aux: L.aux.cortina(0.6, 1.24, 0.03) });
        for (let e = -3.1; e <= 3.11; e += 1.24) { if (Math.abs(e) < 1) continue; q = at(u + e, 2.56); L.caja(B, q[0], q[1], y0, 0.07, 0.07, 2.9, ang, [176, 180, 186], K.METAL); }   // montantes del frente
        for (const e of [-3.12, 3.12]) for (const o of [0.65, 1.3, 1.95]) { q = at(u + e, o); L.caja(B, q[0], q[1], y0, 0.07, 0.07, 2.9, ang, [176, 180, 186], K.METAL); }   // y de los costados
        for (const yy of [0, 2.3]) { q = at(u, 2.56); L.caja(B, q[0], q[1], y0 + yy, 0.08, 6.2, 0.08, ang, [176, 180, 186], K.METAL); }
        q = at(u, 1.3);
        q = at(u, 1.3); L.caja(B, q[0], q[1], y0 + 2.9, 2.7, 6.4, 0.3, ang, [120, 124, 130], K.METAL);                             // dintel
        for (const e of [-3.1, 3.1]) for (const o of [0.1, 2.5]) { q = at(u + e, o); L.caja(B, q[0], q[1], y0, 0.12, 0.12, 2.9, ang, [120, 124, 130], K.METAL); }   // esquineros (AE4: antes, chapas oscuras que tapaban los costados)
        for (const e of [-0.48, 0.48]) { q = at(u + e, 2.6); L.caja(B, q[0], q[1], y0, 0.05, 0.92, 2.3, ang, [196, 216, 226], K.CORTINA, { aux: L.aux.cortina(2.3, 0.92, 0.02) });   // hojas de la puerta
          for (const f of [-0.44, 0.44]) { q = at(u + e + f, 2.62); L.caja(B, q[0], q[1], y0, 0.06, 0.06, 2.3, ang, [90, 94, 100], K.METAL); } }
        q = at(u, 2.63); L.caja(B, q[0], q[1], y0 + 2.3, 0.1, 2.0, 0.22, ang, [90, 94, 100], K.METAL);              // carril de la puerta
        q = at(u, 2.62); L.caja(B, q[0], q[1], y0 + 1.95, 0.02, 1.6, 0.1, ang, [60, 130, 70], K.EMISIVO, { aux: L.aux.emisivo(0.8, false) }); }   // franja verde «entrada»
    }
    for (const s of stands()) if (s.pas && inT1(s.pas.base)) pasarela(B, L, { base: [s.pas.base[0] - h.x, s.pas.base[1] - h.z], tip: [s.pas.tip[0] - h.x, s.pas.tip[1] - h.z], dir: s.pas.dir }, 0, 5.4);
  };
  // AE3: lo menudo del bordillo de la T1 (coches, taxis, gente, bancos, carros): malla aparte que se oculta a más de 700 m
  const PIEL = [[232, 196, 170], [196, 150, 116], [150, 104, 74], [96, 66, 48]], ROPA = [[40, 44, 52], [70, 74, 82], [150, 40, 40], [36, 60, 110], [210, 206, 196], [120, 96, 70], [60, 90, 70], [180, 150, 60], [24, 24, 28]];
  // AE4: silueta con piernas separadas, brazos, cabeza y pelo (7 cajas, ~70 triángulos), en vez de tres cajas
  const PELO = [[30, 24, 20], [70, 50, 32], [120, 96, 60], [180, 176, 170], [20, 20, 22]];
  function persona(B, L, x, z, y, a, R) { const v0 = B.nv, alto = 0.92 + R(0.12), ropa = ROPA[Math.floor(R(ROPA.length))],
      pant = R() < 0.5 ? [40, 44, 56] : ROPA[Math.floor(R(ROPA.length))], piel = PIEL[Math.floor(R(4))], hp = 0.84 * alto, ht = 0.6 * alto;
    for (const e of [-0.095, 0.095]) L.caja(B, 0, e, 0, 0.16, 0.14, hp, 0, pant, K.LISO);                 // piernas
    L.caja(B, 0, 0, hp, 0.24, 0.4, ht, 0, ropa, K.LISO);                                                    // torso
    for (const e of [-0.25, 0.25]) L.caja(B, 0, e, hp + 0.05 * alto, 0.12, 0.1, ht - 0.04, 0, ropa, K.LISO);   // brazos
    L.caja(B, 0, 0, hp + ht, 0.1, 0.1, 0.06, 0, piel, K.LISO);                                               // cuello
    L.caja(B, 0, 0, hp + ht + 0.06, 0.2, 0.18, 0.22, 0, piel, K.LISO);                                       // cabeza
    L.caja(B, -0.02, 0, hp + ht + 0.2, 0.22, 0.2, 0.07, 0, PELO[Math.floor(R(PELO.length))], K.LISO);         // pelo
    if (R() < 0.45) L.caja(B, 0.4, -0.12, 0, 0.26, 0.42, 0.62, 0, [[30, 30, 34], [110, 30, 40], [40, 70, 120], [140, 140, 146]][Math.floor(R(4))], K.LISO);   // maleta
    L.xf(B, v0, x, z, a, 1, 1, y); }
  // coche de perfil (capó, parabrisas, techo, maletero) con ruedas; taxi: negro con puertas amarillas y luz verde
  function turismo(B, L, x, z, y, a, col, taxi) { const v0 = B.nv, w = 1.76;
    L.extruir(B, [[-2.25, 0.32], [2.25, 0.32], [2.28, 0.64], [2.18, 0.8], [0.95, 0.92], [0.32, 1.38], [-1.25, 1.42], [-2.05, 1.0], [-2.27, 0.9]], -w / 2, w / 2, col, K.LISO);
    L.extruir(B, [[0.98, 0.9], [0.36, 1.33], [-1.22, 1.37], [-2.0, 0.99]], -w / 2 - 0.02, w / 2 + 0.02, [30, 34, 40], K.LISO);
    for (const sx of [-1.45, 1.45]) for (const sz of [-1, 1]) L.caja(B, sx, sz * (w / 2 - 0.12), 0, 0.64, 0.26, 0.64, 0, [20, 20, 22], K.LISO);
    // AE4: pilares B (color de carrocería sobre las lunas), paragolpes oscuros, faros, pilotos y retrovisores
    L.caja(B, -0.32, 0, 0.9, 0.14, w + 0.06, 0.44, 0, col, K.LISO);
    for (const sx of [-2.27, 2.27]) L.caja(B, sx, 0, 0.36, 0.1, w - 0.04, 0.2, 0, [44, 46, 50], K.LISO);
    for (const sz of [-0.62, 0.62]) { L.caja(B, 2.27, sz, 0.62, 0.06, 0.34, 0.12, 0, [236, 238, 230], K.EMISIVO, { aux: L.aux.emisivo(0.6, true) });
      L.caja(B, -2.28, sz, 0.74, 0.06, 0.3, 0.12, 0, [180, 24, 24], K.EMISIVO, { aux: L.aux.emisivo(0.5, true) });
      L.caja(B, 0.82, Math.sign(sz) * (w / 2 + 0.08), 0.92, 0.16, 0.14, 0.1, 0, col, K.LISO); }
    if (taxi) { for (const sz of [-1, 1]) L.caja(B, -0.2, sz * (w / 2 + 0.01), 0.36, 2.3, 0.02, 0.5, 0, [226, 180, 26], K.LISO);
      L.caja(B, -0.4, 0, 1.42, 0.18, 0.5, 0.14, 0, [70, 230, 110], K.EMISIVO, { aux: L.aux.emisivo(1.2, true) }); }
    L.xf(B, v0, 0, 0, 90, 1, 1, 0); L.xf(B, v0, x, z, a, 1, 1, y); }
  ficha({ id: 'aero_t1_menudo', nombre: 'Bordillo T1', etiqueta: false, nivel: 'B', x: 4240, z: 3250, alto: 12, noche: 'nada', sombra: false, edificios: [],
    build(B, h, L) {
      const d = DATA.d, cf = curbFrame(d), Ld = cf.Ld, ang = hdg(cf.t[0], cf.t[1]), at = (u, o) => { const p = cf.P(u, o); return [p[0] - h.x, p[1] - h.z]; };
      const R = rng(918), uTx = Ld * 0.62, CL = [[236, 236, 234], [176, 180, 184], [96, 100, 106], [40, 42, 46], [44, 62, 104], [120, 30, 30], [190, 186, 170]];
      let q;
      // llegadas: coches parados en el carril de parada; cola de taxis en su carril; alguno de paso
      for (let u = 12; u < uTx - 6; u += 6.5) { if (R() < 0.4) continue; q = at(u + R(-1, 1), 12.1); turismo(B, L, q[0], q[1], 0, ang + R(-2, 2), CL[Math.floor(R(CL.length))], false); }
      for (let u = uTx + 3; u < Ld - 12; u += 5.6) { if (R() < 0.12) continue; q = at(u, 12.1); turismo(B, L, q[0], q[1], 0, ang, [24, 24, 26], true); }
      for (let u = 20; u < Ld - 20; u += 30) if (R() < 0.5) { q = at(u + R(0, 10), 15.8); turismo(B, L, q[0], q[1], 0, ang, R() < 0.3 ? [24, 24, 26] : CL[Math.floor(R(CL.length))], R() < 0.3); }
      // salidas (sobre el viaducto): coches dejando viajeros
      for (let u = 16; u < Ld - 16; u += 7) { if (R() < 0.45) continue; q = at(u + R(-1, 1), 12); const tx = R() < 0.35; turismo(B, L, q[0], q[1], 8.62, ang + R(-2, 2), tx ? [24, 24, 26] : CL[Math.floor(R(CL.length))], tx); }
      for (let u = 30; u < Ld - 30; u += 35) if (R() < 0.6) { q = at(u + R(0, 12), 16.4); turismo(B, L, q[0], q[1], 8.62, ang, CL[Math.floor(R(CL.length))], false); }
      q = at(uTx + 2, 9.3); L.caja(B, q[0], q[1], 0.18, 0.1, 0.1, 2.5, ang, [52, 54, 58], K.METAL);
      q = at(8, 26); L.caja(B, q[0], q[1], 0, 0.2, 0.2, 5.2, ang, [52, 54, 58], K.METAL);
      // bancos y papeleras en la acera, entre pilares
      for (const y0 of [0.18, 8.85]) for (let u = 28; u < Ld - 12; u += 24) { q = at(u, 6.6);
        const v0 = B.nv; L.caja(B, 0, 0, 0.4, 0.5, 2.0, 0.07, 0, [96, 100, 104], K.METAL); L.caja(B, 0.22, 0, 0.47, 0.06, 2.0, 0.42, 0, [96, 100, 104], K.METAL);
        for (const e of [-0.85, 0.85]) L.caja(B, 0, e, 0, 0.45, 0.06, 0.4, 0, [60, 62, 66], K.METAL);
        L.xf(B, v0, q[0], q[1], ang, 1, 1, y0); q = at(u + 2, 8.8); L.tambor(B, q[0], q[1], y0, y0 + 0.9, 0.25, { lados: 8, col: [70, 74, 78], k: K.METAL }); }
      // carros portaequipajes: en fila junto a los accesos y alguno suelto con maletas
      for (const y0 of [0.18, 8.85]) for (let u = 30; u < Ld - 20; u += 40) { const nn = 3 + Math.floor(R(5));
        for (let k = 0; k < nn; k++) { q = at(u + 5 + k * 0.45, 4.2); const v0 = B.nv;
          L.caja(B, 0, 0, 0.18, 0.55, 0.95, 0.05, 0, [150, 154, 160], K.METAL); L.caja(B, 0, -0.45, 0.18, 0.55, 0.05, 0.8, 0, [150, 154, 160], K.METAL);
          L.caja(B, 0, 0.47, 0.9, 0.6, 0.06, 0.06, 0, [40, 90, 150], K.METAL); L.caja(B, 0, 0.45, 0, 0.06, 0.06, 0.92, 0, [150, 154, 160], K.METAL);
          L.xf(B, v0, q[0], q[1], ang + 90, 1, 1, y0); } }
      // gente: esperando en la cola de taxis, saliendo por los accesos y caminando, con maletas y carros
      for (let u = uTx + 2; u < Ld - 14; u += 1.6 + R(1.2)) { q = at(u, 8.6 + R(-0.4, 0.4)); persona(B, L, q[0], q[1], 0.18, ang + R(-40, 40), R); }
      for (const y0 of [0.18, 8.85]) for (let i = 0; i < 46; i++) { const u = 12 + R(Ld - 24), o = 2.6 + R(5.6); q = at(u, o);
        persona(B, L, q[0], q[1], y0, ang + (R() < 0.5 ? 0 : 180) + R(-30, 30), R);
        if (R() < 0.25) { const p2 = at(u + 0.9, o); const v0 = B.nv; L.caja(B, 0, 0, 0.18, 0.55, 0.95, 0.05, 0, [150, 154, 160], K.METAL); L.caja(B, 0, 0, 0.23, 0.45, 0.7, 0.45, 0, [40, 44, 52], K.LISO); L.xf(B, v0, p2[0], p2[1], ang, 1, 1, y0); } }
    } });
  const inT1 = p => p[1] < 4200;                                         // la T2 queda toda al norte de z = 4400
  if (t1f) { t1f.build = t1Build; t1f.rot = 0; t1f.x = 4240; t1f.z = 3250; t1f.ancho = 1150; t1f.largo = 720; t1f.alto = 20; }
  else ficha({ id: 'aero_t1', nombre: 'Aeroport · Terminal 1', nivel: 'B', x: 4240, z: 3250, alto: 20, ancho: 1150, largo: 720, noche: 'ventanas', edificios: [], build: t1Build });
  // T2 (A, B y C): nave de vidrio de dos plantas con cubierta plana, lucernarios y pasarelas en los frentes de plataforma
  ficha({ id: 'aero_t2', nombre: 'Aeroport · Terminal 2', nivel: 'B', x: 4380, z: 4810, alto: 16, ancho: 1100, largo: 560, noche: 'ventanas', edificios: [],
    build(B, h, L) {
      const d = DATA.d, loc = d.t2.map(p => [p[0] - h.x, p[1] - h.z]);
      L.prisma(B, loc, -1.5, 12.5, [150, 166, 178], K.CORTINA, { aux: L.aux.cortina(4.2, 2.0, 0.22), techo: [168, 172, 176], kTecho: K.METAL, auxTecho: L.aux.panel(6, 0.12, 0) });
      // AE3: edificios de lado tierra (A, B, C) más altos que los diques, con vidrio más oscuro, alero blanco y lucernarios
      const PT = procT2(d).map(p => [p[0] - h.x, p[1] - h.z]);
      if (PT.length >= 3) {
        L.prisma(B, PT, 12.5, 20.5, [104, 130, 148], K.CORTINA, { aux: L.aux.cortina(4.2, 1.8, 0.1), sinTecho: true });
        L.prisma(B, offs(PT, 2.5), 20.5, 21.6, [236, 236, 234], K.METAL, { aux: L.aux.panel(2.5, 0.04, 0), techo: [226, 228, 228], kTecho: K.METAL, auxTecho: L.aux.panel(3, 0.05, 0) });
        const PTi = offs(PT, -10);
        for (let u = -560; u <= 560; u += 36) for (let w = -200; w <= 200; w += 10) { const x = u * 0.9135 - w * 0.4067, z = u * 0.4067 + w * 0.9135;   // lucernarios en diente de sierra
          if (inPoly(PTi, x, z) && inPoly(PTi, x + 9 * 0.9135, z + 9 * 0.4067) && inPoly(PTi, x - 30 * 0.4067, z + 30 * 0.9135) && (Math.round(w / 10) % 4 === 0)) {
            const v0 = B.nv; L.extruir(B, [[0, 0], [9, 0], [9, 0.3], [0, 2.6]], 0, 30, [150, 186, 208], K.CORTINA, { aux: L.aux.cortina(1.3, 1.5, 0.05) });
            L.xf(B, v0, x, z, 66 - 90, 1, 1, 21.6); w += 30; } }
      }
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
      }
    } });
  // recinto del aeropuerto: sin malla; solo despeja de árboles y matas el campo de vuelo (nature.js lee las huellas de los hitos)
  ficha({ id: 'aero_campo', nombre: 'Camp de vol', etiqueta: false, nivel: 'C', x: 5089, z: 3984, rot: 66, alto: 1, ancho: 2100, largo: 3740, edificios: [] });

  // =================================================================== AE2 · lado tierra
  // aparcamientos en superficie con coches (uno por recinto, sin sombra: miles de coches), el aparcamiento de la T1 (P1, cuatro
  // plantas abiertas), la estación de tren y metro de la T2 y las torres de focos de plataformas y aparcamientos
  const CAR = [[236, 236, 234], [228, 229, 230], [176, 180, 184], [150, 154, 158], [96, 100, 106], [40, 42, 46], [28, 30, 34],
    [44, 62, 104], [120, 30, 30], [70, 90, 70], [190, 186, 170], [26, 46, 78]];
  // un coche (20 triángulos): carrocería y habitáculo oscuro; centro en (x, z), rumbo `ang` en grados
  function coche(B, L, x, z, ang, yb, R) {
    const v0 = B.nv, c = CAR[Math.floor(R(CAR.length))], lg = 4.0 + R(0.8), an = 1.74 + R(0.12);
    L.caja(B, 0, 0, 0.22, an, lg, 0.72, 0, c, K.LISO);
    L.caja(B, 0, -0.15, 0.94, an - 0.22, lg * 0.52, 0.5, 0, L.mixc(c, [34, 38, 44], 0.7), K.LISO);
    L.xf(B, v0, x, z, ang, 1, 1, yb);
  }
  // plazas en filas dobles (cara contra cara) separadas por pasillos, a lo largo del eje del recinto; `occ` = ocupación
  function plazas(P, ax, occ, R, put) {
    const u = ax, v = [-ax[1], ax[0]]; let u0 = 1e9, u1 = -1e9, w0 = 1e9, w1 = -1e9;
    for (const p of P) { const a = p[0] * u[0] + p[1] * u[1], b = p[0] * v[0] + p[1] * v[1]; u0 = Math.min(u0, a); u1 = Math.max(u1, a); w0 = Math.min(w0, b); w1 = Math.max(w1, b); }
    const inside = (a, b) => { const x = u[0] * a + v[0] * b, z = u[1] * a + v[1] * b; return inPoly(P, x, z); };
    let n = 0;
    for (let b = w0 + 4; b < w1 - 4; b += 17) for (const [db, f] of [[2.6, 1], [7.6, -1]]) {
      const bb = b + db; let fila = R() < 0.25 ? occ * 0.4 : occ;                     // alguna fila casi vacía
      for (let a = u0 + 3; a < u1 - 3; a += 2.6) {
        if (!(inside(a - 1.5, bb - 2.6) && inside(a + 1.5, bb - 2.6) && inside(a - 1.5, bb + 2.6) && inside(a + 1.5, bb + 2.6))) continue;
        if (R() > fila) continue;
        const x = u[0] * a + v[0] * bb, z = u[1] * a + v[1] * bb; put(x, z, hdg(v[0] * f, v[1] * f) + R(-3, 3)); n++;
      }
    }
    return n;
  }
  const LOTC = [[4239, 5033], [3950.6, 5077.8], [4697.9, 5342.7], [3633.1, 3048.9], [4867.5, 5564.5], [3613.4, 4901.8], [4689.7, 5085.6], [4320.4, 5787.1]];
  const LOTOCC = [0.62, 0.55, 0.5, 0.7, 0.42, 0.5, 0.5, 0.45];
  LOTC.forEach((c, i) => ficha({ id: 'aero_parking_' + i, nombre: 'Aparcament', etiqueta: false, nivel: 'B', x: c[0], z: c[1], alto: 2, ancho: 10, largo: 10, noche: 'nada', sombra: false, edificios: [],
    build(B, h, L) {
      const lot = DATA.t.aparcamientos[i]; if (!lot) return;
      const P = lot.p.map(p => [p[0] - h.x, p[1] - h.z]), R = rng(700 + i);
      plazas(P, lot.ax, LOTOCC[i] * 0.6, R, (x, z, a) => coche(B, L, x, z, a, h.y(x, z), R));
      // isletas de las filas de focos (bordillo y báculo bajo) y casetas de pago en la entrada
      for (const m of masts()) if (m.kind === 'p' && m.lot === i) { const x = m.x - h.x, z = m.z - h.z, y = h.y(x, z);
        L.caja(B, x, z, y - 0.2, 1.6, 1.6, 0.35, hdg(lot.ax[0], lot.ax[1]), [190, 188, 182], K.LISO); }
    } }));
  // P1 de la T1: cuatro plantas abiertas con antepechos, pilares, núcleos de escalera de vidrio, rampa helicoidal y coches
  function inset(P, d) { let cx = 0, cz = 0; for (const p of P) { cx += p[0]; cz += p[1]; } cx /= P.length; cz /= P.length;
    return P.map(p => { const dx = p[0] - cx, dz = p[1] - cz, l = Math.hypot(dx, dz) || 1; return [p[0] - dx / l * d, p[1] - dz / l * d]; }); }
  const HP = [0, 3.4, 6.8, 10.2, 13.6], CON = [184, 182, 176], CON2 = [150, 148, 142];
  ficha({ id: 'aero_p1', nombre: 'Aparcament P1 · Terminal 1', nivel: 'B', x: 3880, z: 3130, alto: 18, ancho: 300, largo: 380, noche: 'nada', edificios: [],
    build(B, h, L) {
      const P = inset(DATA.t.p1, 6).map(p => [p[0] - h.x, p[1] - h.z]), R = rng(4401);
      const y0 = h.y(0, 0);
      for (let k = 1; k < HP.length; k++) L.prisma(B, P, y0 + HP[k] - 0.5, y0 + HP[k], CON, K.LISO, { aux: L.aux.liso(1.2), techo: k === HP.length - 1 ? [120, 120, 122] : CON });
      const sg = areaS(P) > 0 ? 1 : -1;
      for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], Ld = Math.hypot(b[0] - a[0], b[1] - a[1]); if (Ld < 4) continue;
        const t = unit(b[0] - a[0], b[1] - a[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], ang = hdg(t[0], t[1]);
        for (let k = 1; k < HP.length; k++) L.caja(B, m[0], m[1], y0 + HP[k], 0.3, Ld, 1.1, ang + 90, CON2, K.LISO);              // antepechos
        for (let u = 0; u < Ld; u += 8.1) { const x = a[0] + t[0] * u, z = a[1] + t[1] * u; L.caja(B, x, z, y0 - 1, 0.55, 0.55, HP[4] + 1, ang, CON, K.LISO); }   // pilares de fachada
        for (let u = 6; u < Ld - 6; u += 2.2) for (let k = 1; k < HP.length; k++) { const x = a[0] + t[0] * u, z = a[1] + t[1] * u;   // lamas verticales
          if ((u / 2.2 | 0) % 3 === 0) L.caja(B, x, z, y0 + HP[k] + 1.1, 0.12, 0.6, 2.2, ang, [120, 128, 132], K.METAL); }
      }
      // pilares interiores, una planta oscura de forjado visto (la sombra la da la planta de encima)
      let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const p of P) { x0 = Math.min(x0, p[0]); z0 = Math.min(z0, p[1]); x1 = Math.max(x1, p[0]); z1 = Math.max(z1, p[1]); }
      const Pi = inset(P, 3);
      for (let x = x0 + 8; x < x1; x += 16) for (let z = z0 + 8; z < z1; z += 16) if (inPoly(Pi, x, z)) L.caja(B, x, z, y0 - 1, 0.7, 0.7, HP[3] + 1, 0, CON, K.LISO);
      // coches: en la cubierta (sol) y en la primera fila de cada planta (lo que se ve por los huecos)
      const ax = unit(P[1][0] - P[0][0], P[1][1] - P[0][1]);
      if (false) for (let k = 0; k < HP.length; k++) { const Pk = k ? inset(P, 2) : inset(P, 3);
        const Pc = inset(Pk, 13);
        plazas(Pk, ax, k === HP.length - 1 ? 0.55 : 0.75, R, (x, z, a) => { if (k < HP.length - 1 && inPoly(Pc, x, z)) return; coche(B, L, x, z, a, y0 + HP[k] + (k ? 0 : 0.05), R); }); }
      // núcleos de escalera y ascensores (vidrio) en las esquinas, y la rampa helicoidal
      for (let i = 0; i < P.length; i += 2) { const q = inset(P, 9)[i];
        L.caja(B, q[0], q[1], y0 - 1, 6.5, 8, HP[4] + 4.5, hdg(ax[0], ax[1]), [120, 146, 160], K.CORTINA, { aux: L.aux.cortina(3.4, 1.4, 0.1), techo: [200, 200, 198] }); }
      const rp = inset(P, -15)[1];
      for (let k = 0; k < 8; k++) L.tambor(B, rp[0], rp[1], y0 + k * 1.7, y0 + k * 1.7 + 0.45, 15, { lados: 18, col: CON, k: K.LISO });
      L.tambor(B, rp[0], rp[1], y0 - 1, y0 + HP[4] + 1, 4.5, { lados: 12, col: CON2, k: K.LISO });
      L.tambor(B, rp[0], rp[1], y0 + 0.45, y0 + HP[4] + 1.1, 15.1, { lados: 18, col: CON2, k: K.LISO, a0: 0, a1: 0.6 });
      // farolas de la cubierta
      for (const m of masts()) if (m.kind === 'r') { const x = m.x - h.x, z = m.z - h.z;
        L.caja(B, x, z, y0 + HP[4], 0.2, 0.2, 6, 0, [90, 94, 98], K.METAL); L.caja(B, x, z, y0 + HP[4] + 6, 0.5, 1.6, 0.25, 0, [60, 62, 66], K.METAL); }
    } });
  // AE3: los coches del P1 en una malla aparte (se ocultan de lejos)
  ficha({ id: 'aero_p1_coches', nombre: 'Cotxes P1', etiqueta: false, nivel: 'B', x: 3880, z: 3130, alto: 15, noche: 'nada', sombra: false, edificios: [],
    build(B, h, L) {
      const P = inset(DATA.t.p1, 6).map(p => [p[0] - h.x, p[1] - h.z]), R = rng(4402), y0 = h.y(0, 0), ax = unit(P[1][0] - P[0][0], P[1][1] - P[0][1]);
      for (let k = 0; k < HP.length; k++) { const Pk = k ? inset(P, 2) : inset(P, 3), Pc = inset(Pk, 13);
        plazas(Pk, ax, k === HP.length - 1 ? 0.55 : 0.75, R, (x, z, a) => { if (k < HP.length - 1 && inPoly(Pc, x, z)) return; coche(B, L, x, z, a, y0 + HP[k] + (k ? 0 : 0.05), R); }); }
    } });
  // estación de la T2 (tren R2 Nord y metro L9 Sud): andenes cubiertos con marquesina, vestíbulo de vidrio a nivel y pasarela
  // cubierta hasta la terminal. A lo largo de las vías (rumbo 66°)
  ficha({ id: 'aero_estacio', nombre: 'Estació Aeroport T2', nivel: 'B', x: 4006, z: 4902, rot: 66, alto: 14, ancho: 60, largo: 240, noche: 'ventanas', edificios: [],
    build(B, h, L) {
      const MET = [206, 208, 210], VID = [120, 146, 160], y0 = h.y(0, 0);
      for (const s of [-1, 1]) {
        L.caja(B, s * 9.5, 0, y0 - 1, 7, 210, 2.05, 0, [186, 184, 178], K.LISO, { aux: L.aux.liso(1.0) });                 // andenes
        L.caja(B, s * 6.15, 0, y0 + 1.04, 0.3, 206, 0.02, 0, [226, 196, 40], K.LISO);                                        // franja de borde
        for (let z = -96; z <= 96; z += 16) L.caja(B, s * 10, z, y0 + 1, 0.35, 0.35, 5.2, 0, [150, 154, 160], K.METAL);    // pilares
        L.caja(B, s * 9.5, 0, y0 + 6.1, 10, 204, 0.35, 0, MET, K.METAL, { aux: L.aux.panel(2, 0.06, 0), techo: [190, 192, 194] });   // marquesina
        for (let z = -90; z <= 90; z += 30) L.caja(B, s * 9.5, z, y0 + 1, 2.4, 0.2, 2.3, 0, [40, 70, 120], K.LISO);           // carteles (sin texto)
      }
      L.caja(B, 0, 0, y0 - 1, 9, 214, 1.2, 0, [92, 88, 82], K.LISO);                                                        // caja de vías (balasto)
      // vestíbulo y acceso al metro (L9 Sud)
      L.caja(B, 22, -40, y0 - 1, 22, 40, 10, 0, VID, K.CORTINA, { aux: L.aux.cortina(4, 2, 0.15), techo: [214, 214, 212], kTecho: K.METAL });
      L.caja(B, 22, -40, y0 + 9, 26, 44, 0.8, 0, MET, K.METAL);
      L.caja(B, 22, -64, y0 - 1, 12, 8, 4.2, 0, [60, 64, 70], K.CORTINA, { aux: L.aux.cortina(3, 2, 0.1), techo: MET });   // acceso al metro
      L.caja(B, 22, -69, y0 + 2.2, 3, 0.25, 1, 0, [200, 30, 40], K.EMISIVO);                                               // rótulo «M» (color de línea, sin texto)
      // pasarela cubierta hacia la terminal (al sur-sureste, +X), sobre el vial
      L.caja(B, 62, -40, y0 + 6.5, 60, 5, 3.6, 0, VID, K.CORTINA, { aux: L.aux.cortina(3, 1.8, 0.1), techo: MET, kTecho: K.METAL });
      for (const x of [40, 62, 84]) L.caja(B, x, -40, y0 - 1, 1.2, 1.2, 7.5, 0, [176, 174, 168], K.LISO);
    } });
  // torres de focos (plataformas, aparcamientos): fuste troncocónico, corona con proyectores
  const focosBuild = (cell) => (B, h, L) => {
      for (const m of masts()) { if (m.kind === 'r' || cellOf(m.x, m.z) !== cell) continue; const x = m.x - h.x, z = m.z - h.z, y = h.y(x, z), H = m.h, a = hdg(m.d[0], m.d[1]);
        L.tambor(B, x, z, y - 0.5, y + H, m.kind === 'a' ? 0.75 : 0.32, { r1: m.kind === 'a' ? 0.35 : 0.16, lados: 6, col: [176, 178, 182], k: K.METAL });
        const fx = x + m.d[0] * 0.8, fz = z + m.d[1] * 0.8;
        if (m.kind === 'a') { L.caja(B, fx, fz, y + H - 0.6, 6, 1.2, 0.3, a + 90, [120, 124, 130], K.METAL);
          for (const o of [-2.2, -0.75, 0.75, 2.2]) L.caja(B, fx + m.d[1] * o, fz - m.d[0] * o, y + H - 0.3, 1.1, 0.5, 0.9, a, [212, 214, 214], K.METAL);
          L.caja(B, fx + m.d[0] * 0.3, fz + m.d[1] * 0.3, y + H - 0.25, 6, 0.08, 0.8, a + 90, [236, 234, 226], K.METAL); }
        else { L.caja(B, fx, fz, y + H - 0.2, 0.5, 1.4, 0.22, a, [70, 72, 76], K.METAL); L.caja(B, fx - m.d[0] * 1.6, fz - m.d[1] * 1.6, y + H - 0.2, 0.5, 1.4, 0.22, a, [70, 72, 76], K.METAL); }
      }
    };
  // AE3: celdas de 450 m para lo pequeño que se oculta de lejos (vehículos de pista, torres de focos)
  const cellOf = (x, z) => Math.floor(x / 450) + ':' + Math.floor(z / 450);
  function porCeldas(pts, pre, mk, extra) { const g = new Map();
    for (const p of pts) { const k = cellOf(p[0], p[1]); if (!g.has(k)) g.set(k, []); g.get(k).push(p); }
    for (const [k, L_] of g) { let cx = 0, cz = 0; for (const p of L_) { cx += p[0]; cz += p[1]; } cx /= L_.length; cz /= L_.length;
      LM.add(Object.assign({ id: pre + k.replace(':', '_'), nombre: pre, etiqueta: false, nivel: 'B', x: cx, z: cz, alto: 6, noche: 'nada', sombra: false, edificios: [], build: mk(k) }, extra || {})); } }
  const vehBuild = (cell) => (B, h, L) => { const R = rng(2025 + cell.length);
    for (const s of stands()) { if (!s.pas || cellOf(s.x, s.z) !== cell) continue; const x = s.x - h.x, z = s.z - h.z; vehiculos(B, L, s, x, z, h.y(x, z) + 0.45, R); } };
  // AE3: volúmenes del registro convertidos: por planta y altura, nave (chapa grecada), oficinas (muro cortina) o caseta técnica
  const edifBuild = (B, h, L) => {
    for (const e of h.edif) { const P = e.plantas[0]; if (!P || P.length < 3) continue;
      let cx = 0, cz = 0; for (const p of P) { cx += p[0]; cz += p[1]; } cx /= P.length; cz /= P.length;
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of P) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
      // AE4: el área de la planta puede venir mal (planta en varias piezas): manda también el tamaño de su recuadro
      const A = Math.max(Math.abs(areaS(P)), (x1 - x0) * (z1 - z0) * 0.5), y0 = Math.min(h.y(cx, cz), 0) - 1, top = Math.max(e.alto, y0 + 4), H = top - y0;
      // AE4: solo es marquesina si el volumen elevado es delgado; el bloque blanco de pie_lejos (elevado y de 15 m) no lo es
      if (e.y0 > 2.5 && top - e.y0 < 6) { L.prisma(B, P, e.y0, top, [200, 200, 196], K.METAL, { aux: L.aux.panel(1.2, 0.05, 0), techo: [176, 180, 184], suelo: true }); continue; }   // marquesina
      // AE4: el bloque blanco de ventanas al este del P1 es el parque de bomberos del sur (C. I. Sur, data/aero_carga.json)
      if (DATA.c && DATA.c.bomberosSur && Math.hypot(cx + h.x - 3866, cz + h.z - 2826) < 70) { bomberos(B, L, P, y0, Math.max(top, y0 + 9), h); continue; }
      if (A > 1500 && H >= 10) {                                                                    // AE4: oficinas de hormigón con huecos
        L.prisma(B, P, y0, top, [214, 208, 196], K.VENTANAS, { aux: L.aux.ventanas(3.6, 2.4, 0.55, 0.42), techo: [150, 150, 148] });
        L.prisma(B, offs(P, 0.25), y0, y0 + 1.0, [150, 148, 142], K.LISO, { sinTecho: true });
        L.prisma(B, offs(P, 0.15), top, top + 1.1, [196, 192, 182], K.LISO, { sinTecho: true });
        for (const o of [[-6, -4], [5, 3]]) L.caja(B, cx + o[0], cz + o[1], top, 5, 3, 2.0, 0, [150, 154, 158], K.METAL, { aux: L.aux.panel(0.6, 0.05, 0) });
        continue; }
      if (A > 1500 && H < 18) {                                                                    // nave
        L.prisma(B, P, y0, top, [190, 194, 198], K.METAL, { aux: L.aux.panel(0.9, 0.06, 0), techo: [168, 172, 176], kTecho: K.METAL, auxTecho: L.aux.panel(4, 0.1, 0) });
        L.prisma(B, offs(P, 0.05), y0 + 1.2 + 3.2, y0 + 1.2 + 4.0, [96, 112, 124], K.CORTINA, { aux: L.aux.cortina(0.8, 1.6, 0.05), sinTecho: true });
      } else if (H >= 14 || A > 400) {                                                              // oficinas
        L.prisma(B, P, y0, top, [112, 136, 152], K.CORTINA, { aux: L.aux.cortina(3.6, 1.5, 0.15), techo: [184, 186, 188] });
        L.prisma(B, offs(P, 0.2), top, top + 1.0, [214, 214, 210], K.METAL, { sinTecho: true });
        L.caja(B, cx, cz, top, 4, 6, 2.2, 0, [150, 154, 158], K.METAL, { aux: L.aux.panel(0.6, 0.05, 0) });
      } else {                                                                                      // caseta técnica
        L.prisma(B, P, y0, top, [214, 210, 200], K.LISO, { aux: L.aux.panel(1.4, 0.08, 0.25), techo: [150, 150, 148] });
        L.caja(B, cx, cz, top, 2, 2.5, 1.3, 0, [170, 172, 174], K.METAL);
      } }
  };
  // AE4: utilidades de planta: lado más largo (o el que mira a un punto) con su normal hacia fuera
  function lados(P) { const sg = areaS(P) > 0 ? 1 : -1, out = [];
    for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
      if (l < 1) continue; out.push({ a, b, l, t: [dx / l, dz / l], n: [sg * dz / l, -sg * dx / l], m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }); }
    // la normal hacia fuera: comprobar con un punto desplazado
    for (const e of out) { if (inPoly(P, e.m[0] + e.n[0] * 0.5, e.m[1] + e.n[1] * 0.5)) { e.n = [-e.n[0], -e.n[1]]; } }
    return out; }
  const sobre = (e, u, o) => [e.a[0] + e.t[0] * u + e.n[0] * o, e.a[1] + e.t[1] * u + e.n[1] * o];
  // camión articulado (tractora y semirremolque), morro hacia +Z local; se coloca con xf
  function camion(B, L, x, z, ang, y, R) { const v0 = B.nv, cab = [[236, 236, 232], [40, 70, 130], [150, 30, 30], [60, 64, 70]][Math.floor(R(4))];
    L.caja(B, 0, -7.4, 1.15, 2.5, 13.4, 2.75, 0, [222, 222, 218], K.METAL, { aux: L.aux.panel(1.2, 0.04, 0) });   // caja del semirremolque
    L.caja(B, 0, -7.4, 0.35, 2.3, 13.0, 0.8, 0, [50, 52, 56], K.LISO);
    L.caja(B, 0, 0.9, 0.5, 2.45, 2.3, 2.6, 0, cab, K.LISO); L.caja(B, 0, 2.06, 1.7, 2.3, 0.04, 1.0, 0, [30, 34, 40], K.LISO);   // tractora y parabrisas
    for (const w of [1.6, -2.4, -11.5, -12.8, -14.1].slice(0, 5)) for (const sx of [-1, 1]) L.caja(B, sx * 1.1, w, 0, 0.4, 1.0, 1.0, 0, [24, 24, 26], K.LISO);
    L.xf(B, v0, x, z, ang, 1, 1, y); }
  function bomberos(B, L, P, y0, top, h) {                                                         // parque de bomberos de pista
    L.prisma(B, P, y0, top, [226, 222, 214], K.VENTANAS, { aux: L.aux.ventanas(4.5, 3.2, 0.5, 0.3), techo: [160, 160, 158] });
    const E = lados(P).sort((p, q) => q.l - p.l)[0], nb = Math.max(2, Math.floor((E.l - 6) / 7.5));
    for (let k = 0; k < nb; k++) { const u = 3 + (k + 0.5) * (E.l - 6) / nb, q = sobre(E, u, 0.12), a = hdg(E.n[0], E.n[1]);
      L.caja(B, q[0], q[1], y0 + 1, 0.2, 5.6, 4.6, a + 90, [196, 36, 30], K.METAL, { aux: L.aux.panel(0.55, 0.06, 0) });   // portones
      if (k % 2 === 0) { const t = sobre(E, u, 9); const v0 = B.nv; L.caja(B, 0, 0, 0.3, 3.0, 10.5, 3.2, 0, [206, 30, 28], K.LISO); L.caja(B, 0, 3.6, 1.6, 2.6, 0.05, 1.2, 0, [30, 34, 40], K.LISO);
        L.caja(B, 0, -1, 3.5, 2.2, 6, 0.3, 0, [220, 220, 220], K.METAL); L.xf(B, v0, t[0], t[1], a, 1, 1, h.y(t[0], t[1])); } }   // autobombas
    const c = sobre(E, E.l - 3, -3); L.caja(B, c[0], c[1], y0, 4, 4, top - y0 + 7, hdg(E.t[0], E.t[1]), [210, 70, 56], K.LISO);   // torre de mangueras
    }
  const cargaBuild = dc => (B, h, L) => { const R = rng(4411), pc = [dc.plataformaCarga[0] - h.x, dc.plataformaCarga[1] - h.z];
    for (const e of h.edif) { const P = e.plantas[0]; if (!P || P.length < 3) continue;
      let cx = 0, cz = 0; for (const p of P) { cx += p[0]; cz += p[1]; } cx /= P.length; cz /= P.length;
      const A = Math.abs(areaS(P)), y0 = Math.min(h.y(cx, cz), 0) - 1, top = Math.max(e.alto, y0 + 4), H = top - y0;
      if (A < 900 || H > 22) { L.prisma(B, P, y0, Math.max(top, y0 + 8), [112, 136, 152], K.CORTINA, { aux: L.aux.cortina(3.6, 1.5, 0.15), techo: [184, 186, 188] }); continue; }
      const t2 = Math.max(top, y0 + 12);                                                          // nave de carga: chapa, zócalo, banda de luz
      L.prisma(B, P, y0, t2, [196, 200, 204], K.METAL, { aux: L.aux.panel(0.9, 0.05, 0), techo: [170, 174, 178], kTecho: K.METAL, auxTecho: L.aux.panel(4, 0.1, 0) });
      L.prisma(B, offs(P, 0.06), y0, y0 + 2.2, [150, 152, 150], K.LISO, { sinTecho: true });
      L.prisma(B, offs(P, 0.06), t2 - 2.4, t2 - 1.6, [96, 112, 124], K.CORTINA, { aux: L.aux.cortina(0.8, 1.6, 0.05), sinTecho: true });
      const E = lados(P).filter(q => q.l > 20).sort((p, q) => q.l - p.l).slice(0, 2);
      for (const ed of E) { const aire = (pc[0] - ed.m[0]) * ed.n[0] + (pc[1] - ed.m[1]) * ed.n[1] > 0, a = hdg(ed.n[0], ed.n[1]);
        if (aire) {                                                                                 // lado aire: portones grandes
          const nd = Math.max(1, Math.floor(ed.l / 30));
          for (let k = 0; k < nd; k++) { const q = sobre(ed, (k + 0.5) * ed.l / nd, 0.12); L.caja(B, q[0], q[1], y0 + 1, 0.25, 9, 6.5, a + 90, [120, 128, 138], K.METAL, { aux: L.aux.panel(0.5, 0.04, 0) }); }
        } else {                                                                                    // lado tierra: muelles con abrigos y camiones
          const q0 = sobre(ed, ed.l / 2, 2.0); L.caja(B, q0[0], q0[1], y0, 4, ed.l - 4, 2.2, a + 90, [168, 166, 160], K.LISO);   // andén de carga
          const qc = sobre(ed, ed.l / 2, 2.5); L.caja(B, qc[0], qc[1], y0 + 6.2, 5, ed.l - 2, 0.35, a + 90, [210, 212, 214], K.METAL, { suelo: true });   // marquesina
          for (let u = 4; u < ed.l - 3; u += 4.6) { const q = sobre(ed, u, 0.1);
            L.caja(B, q[0], q[1], y0 + 2.2, 0.3, 3.4, 3.6, a + 90, [30, 30, 32], K.LISO);                // abrigo de muelle
            const q2 = sobre(ed, u, 0.22); L.caja(B, q2[0], q2[1], y0 + 2.4, 0.1, 2.8, 3.0, a + 90, [96, 104, 112], K.METAL, { aux: L.aux.panel(0.3, 0.03, 0) });   // puerta seccional
            if (R() < 0.45) { const t = sobre(ed, u, 14.8); camion(B, L, t[0], t[1], a, h.y(t[0], t[1]), R); } } } } }
    // plataforma de carga: cargueros sin ventanillas, contenedores en sus carros y algún tractor
    for (const [x, z, r] of dc.cargueros) { if (stands().some(s => Math.hypot(s.x - x, s.z - z) < 70)) continue;
      const lx = x - h.x, lz = z - h.z, yb = h.y(lx, lz) + 0.45; avion(B, L, 'w', lx, lz, r, yb, R, true);
      for (let k = 0; k < 7; k++) { const v0 = B.nv;
        L.caja(B, 0, 0, 0.3, 1.6, 3.4, 0.3, 0, [70, 74, 80], K.METAL); L.caja(B, 0, 0, 0.6, 1.5, 3.1, 1.6, 0, [176, 180, 184], K.METAL, { aux: L.aux.panel(0.4, 0.05, 0) });
        for (const sx of [-0.6, 0.6]) for (const sz of [-1.2, 1.2]) L.caja(B, sx, sz, 0, 0.18, 0.4, 0.4, 0, [24, 24, 26], K.LISO);
        L.xf(B, v0, lx + 14 + k * 4.0 * 0, lz - 26 + k * 4.0, 0, 1, 1, h.y(lx + 14, lz - 26 + k * 4) + 0.2); } }
  };
  const fuelBuild = dc => (B, h, L) => {                                                            // parque de combustible
    const F = dc.combustible.map(p => [p[0] - h.x, p[1] - h.z]), E = lados(F).sort((p, q) => q.l - p.l)[0], t = E.t, n = [-t[1], t[0]];
    let cx = 0, cz = 0; for (const p of F) { cx += p[0]; cz += p[1]; } cx /= F.length; cz /= F.length;
    let u0 = 1e9, u1 = -1e9, w0 = 1e9, w1 = -1e9; for (const p of F) { const u = (p[0] - cx) * t[0] + (p[1] - cz) * t[1], w = (p[0] - cx) * n[0] + (p[1] - cz) * n[1];
      u0 = Math.min(u0, u); u1 = Math.max(u1, u); w0 = Math.min(w0, w); w1 = Math.max(w1, w); }
    const uc = (u0 + u1) / 2, wc = (w0 + w1) / 2, Lu = (u1 - u0) * 0.8, Lw = (w1 - w0) * 0.62, at = (u, w) => [cx + t[0] * (uc + u) + n[0] * (wc + w), cz + t[1] * (uc + u) + n[1] * (wc + w)];
    const a = hdg(t[0], t[1]), r = Math.min(10, Lw / 4 - 2.5), y = h.y(cx, cz);
    for (const sgn of [-1, 1]) { const um = sgn * Lu / 4, uL = Lu / 2 - 8;                     // dos cubetos con muro de hormigón
      for (const [u, w, lu, lw] of [[um, -Lw / 2, uL, 0.4], [um, Lw / 2, uL, 0.4], [um - uL / 2, 0, 0.4, Lw], [um + uL / 2, 0, 0.4, Lw]]) { const q = at(u, w);
        L.caja(B, q[0], q[1], y - 0.5, lw, lu, 2.3, a, [182, 178, 168], K.LISO); }
      const qf = at(um, 0); L.caja(B, qf[0], qf[1], y - 0.5, Lw - 0.4, uL - 0.4, 0.62, a, [150, 140, 120], K.LISO);   // suelo del cubeto
      for (const du of [-uL / 4, uL / 4]) for (const w of [-Lw / 4, Lw / 4]) { const q = at(um + du, w);   // tanques de techo flotante
        L.tambor(B, q[0], q[1], y, y + 15, r, { lados: 22, col: [230, 230, 226], k: K.METAL, aux: L.aux.panel(2.2, 0.03, 0) });
        L.tambor(B, q[0], q[1], y + 14.4, y + 15.1, r + 0.35, { lados: 22, col: [190, 192, 194], k: K.METAL });
        const e2 = [q[0] + n[0] * r * Math.sign(w), q[1] + n[1] * r * Math.sign(w)];
        L.caja(B, e2[0], e2[1], y, 1.0, 1.0, 15.6, a, [200, 60, 40], K.METAL); } }   // escalera
    for (const w of [-1.5, 0, 1.5]) { const q = at(0, w); L.caja(B, q[0], q[1], y + 2.2, 0.5, Lu - 10, 0.5, a, [150, 120, 60], K.METAL); }   // tuberías
    for (let u = -Lu / 2 + 6; u < Lu / 2 - 5; u += 9) { const q = at(u, 0); L.caja(B, q[0], q[1], y, 4.6, 0.4, 2.2, a, [120, 122, 124], K.METAL); }
    let q = at(0, Lw / 2 + 9); L.caja(B, q[0], q[1], y, 10, 18, 5, a, [214, 210, 200], K.LISO, { aux: L.aux.panel(1.4, 0.06, 0.2), techo: [150, 150, 148] });   // bombas y control
    q = at(0, -Lw / 2 - 10); L.caja(B, q[0], q[1], y + 6, 14, 22, 0.5, a, [216, 216, 214], K.METAL, { suelo: true });   // cargadero de cisternas
    for (const u of [-7, 0, 7]) { const p = at(u, -Lw / 2 - 10); L.caja(B, p[0], p[1], y, 0.4, 0.4, 6, 0, [140, 144, 150], K.METAL); }
    const R = rng(91); for (const u of [-5, 5]) { const p = at(u, -Lw / 2 - 10); camion(B, L, p[0], p[1], a, y, R); }
  };
  const hangarBuild = (B, h, L) => {                                                               // hangares de mantenimiento con portones
    const ctr = [5089 - h.x, 3984 - h.z];
    for (const e of h.edif) { const P = e.plantas[0]; if (!P || P.length < 3) continue;
      let cx = 0, cz = 0; for (const p of P) { cx += p[0]; cz += p[1]; } cx /= P.length; cz /= P.length;
      const A = Math.abs(areaS(P)), y0 = Math.min(h.y(cx, cz), 0) - 1, top = Math.max(e.alto, y0 + 4);
      if (A < 1500) { L.prisma(B, P, y0, top, [214, 210, 200], K.LISO, { aux: L.aux.panel(1.4, 0.08, 0.25), techo: [150, 150, 148] }); continue; }
      const t2 = Math.max(top, y0 + 20);
      L.prisma(B, P, y0, t2, [206, 208, 210], K.METAL, { aux: L.aux.panel(1.0, 0.05, 0), techo: [176, 178, 180], kTecho: K.METAL, auxTecho: L.aux.panel(5, 0.08, 0) });
      L.prisma(B, offs(P, -3), t2, t2 + 2.6, [176, 178, 180], K.METAL, { aux: L.aux.panel(5, 0.08, 0) });   // cubierta de cerchas
      const ed = lados(P).filter(q => q.l > 30).sort((p, q) => ((ctr[0] - q.m[0]) * q.n[0] + (ctr[1] - q.m[1]) * q.n[1]) / Math.hypot(ctr[0] - q.m[0], ctr[1] - q.m[1]) * q.l - ((ctr[0] - p.m[0]) * p.n[0] + (ctr[1] - p.m[1]) * p.n[1]) / Math.hypot(ctr[0] - p.m[0], ctr[1] - p.m[1]) * p.l)[0];
      if (!ed) continue; const a = hdg(ed.n[0], ed.n[1]), dw = ed.l * 0.84, dh = (t2 - y0) * 0.78, q = sobre(ed, ed.l / 2, 0.2);
      L.caja(B, q[0], q[1], y0 + 1, 0.4, dw, dh - 1, a + 90, [150, 158, 168], K.METAL, { aux: L.aux.panel(0.5, 0.05, 0) });   // portón de hojas
      const q2 = sobre(ed, ed.l / 2, 0.6); L.caja(B, q2[0], q2[1], y0 + dh, 1.2, dw + 2, 1.6, a + 90, [96, 100, 108], K.METAL);   // dintel y carriles
      for (let k = 1; k < 6; k++) { const q3 = sobre(ed, ed.l * 0.08 + k * dw / 6, 0.45); L.caja(B, q3[0], q3[1], y0 + 1, 0.2, 0.25, dh - 1, a + 90, [96, 100, 108], K.METAL); } }
  };
  // distancia (m) a la que se ocultan las mallas de lo pequeño
  const LODD = [[/^aero_t1_menudo$/, 700], [/^aero_veh_/, 800], [/^aero_parking_/, 850], [/^aero_p1_coches$/, 850], [/^aero_focos_/, 900]];

  // la carga de los hitos espera al JSON; con él, cada ficha sustituye los volúmenes simples que caen en su planta
  const LMS = window.BCN_LANDMARKS;
  if (LMS && LMS.init) { const init0 = LMS.init;
    LMS.init = async function (ctx) {
      const d = await dataP, dt = await dataT;
      if (dt) { const pf = fx => LM.fichas.find(f => f.id === fx);
        dt.aparcamientos.forEach((lot, i) => { const f = pf('aero_parking_' + i); if (!f) return; let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
          for (const p of lot.p) { x0 = Math.min(x0, p[0]); z0 = Math.min(z0, p[1]); x1 = Math.max(x1, p[0]); z1 = Math.max(z1, p[1]); }
          f.x = (x0 + x1) / 2; f.z = (z0 + z1) / 2; f.rot = 0; }); }   // huella mínima (10 m): el recinto no es verde, no hay árboles que quitar
      else for (const f of LM.fichas) if (/^aero_(parking_|p1|estacio)/.test(f.id)) f.build = undefined;
      if (d) try {
        const BR = ctx.BREC, bb = BR.bb, fx = id => LM.fichas.find(f => f.id === id);
        const plT = { aeroport: d.t1, aero_t1: d.t1, aero_t2: d.t2, aero_hangar: d.hangarIberia, aero_torre: d.torre.planta };
        if (dt) { plT.aero_p1 = dt.p1; const e = dt.estacionT2, c = Math.cos(66 * D2R), sn = Math.sin(66 * D2R);
          plT.aero_estacio = [[-14, -110], [50, -110], [50, 110], [-14, 110]].map(([x, z]) => [e[0] + x * c + z * sn, e[1] - x * sn + z * c]); }
        for (const [id, P] of Object.entries(plT)) { const f = fx(id); if (!f) continue; const set = new Set(f.edificios || []);
          let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const p of P) { x0 = Math.min(x0, p[0]); z0 = Math.min(z0, p[1]); x1 = Math.max(x1, p[0]); z1 = Math.max(z1, p[1]); }
          for (let b = 0; b < BR.n; b++) { const k = b * 4, cx = (bb[k] + bb[k + 2]) / 2, cz = (bb[k + 1] + bb[k + 3]) / 2;
            if (cx < x0 || cx > x1 || cz < z0 || cz > z1) continue; if (inPoly(P, cx, cz)) set.add(b); }
          f.edificios = [...set]; }
        const ta = fx('aero_torre_antigua'); if (ta) { ta.x = d.torreAntigua.c[0]; ta.z = d.torreAntigua.c[1]; }
        // AE3: volúmenes genéricos del registro alrededor de la T1 (al sur y al este, lado tierra) que ninguna ficha recoge:
        // pasan a ser lo que son en un aeropuerto (naves, oficinas de vidrio, casetas técnicas), no viviendas
        const used = new Set(); for (const f of LM.fichas) for (const b of (f.edificios || [])) used.add(b);
        const t1 = d.t1, ed = [];
        for (let b = 0; b < BR.n; b++) { const k = b * 4, cx = (bb[k] + bb[k + 2]) / 2, cz = (bb[k + 1] + bb[k + 3]) / 2;
          if (cx < 3550 || cx > 4950 || cz < 2150 || cz > 3560 || used.has(b)) continue;
          if (inPoly(t1, cx, cz) || (bb[k + 2] - bb[k] > 600)) continue;
          ed.push(b); }
        LM.add({ id: 'aero_edificis', nombre: 'Edificis de serveis', etiqueta: false, nivel: 'B', x: 4250, z: 2850, alto: 20, noche: 'ventanas', edificios: ed, build: edifBuild });
        AERO_LOD.edificis = ed.length;
        // AE4: terminal de carga, parque de combustible y hangares (data/aero_carga.json): volúmenes del registro de cada recinto
        const dc = await cargaP; DATA.c = dc;
        if (dc) { for (const b of ed) used.add(b);
          const zona = (P, ex) => { const out = []; let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
            for (const p of P) { x0 = Math.min(x0, p[0]); z0 = Math.min(z0, p[1]); x1 = Math.max(x1, p[0]); z1 = Math.max(z1, p[1]); }
            for (let b = 0; b < BR.n; b++) { const k = b * 4, cx = (bb[k] + bb[k + 2]) / 2, cz = (bb[k + 1] + bb[k + 3]) / 2;
              if (cx < x0 || cx > x1 || cz < z0 || cz > z1 || used.has(b) || !inPoly(P, cx, cz) || (ex && inPoly(ex, cx, cz))) continue;
              used.add(b); out.push(b); } return out; };
          const ctr = P => { let x = 0, z = 0; for (const p of P) { x += p[0]; z += p[1]; } return [x / P.length, z / P.length]; };
          const zf = zona(dc.combustible), zc = zona(dc.carga, dc.combustible), zh = zona(dc.mantenimiento), cc = ctr(dc.carga), cf2 = ctr(dc.combustible), ch = ctr(dc.mantenimiento);
          LM.add({ id: 'aero_carga', nombre: 'Terminal de càrrega', nivel: 'B', x: cc[0], z: cc[1], alto: 16, noche: 'ventanas', edificios: zc, build: cargaBuild(dc) });
          LM.add({ id: 'aero_combustible', nombre: 'Parc de combustible', nivel: 'B', x: cf2[0], z: cf2[1], alto: 16, noche: 'focos', edificios: zf, build: fuelBuild(dc) });
          LM.add({ id: 'aero_hangars', nombre: 'Hangars de manteniment', nivel: 'B', x: ch[0], z: ch[1], alto: 24, noche: 'focos', edificios: zh, build: hangarBuild });
          AERO_LOD.zonas = { carga: zc.length, combustible: zf.length, hangars: zh.length }; window.BCN_AERO_ZONAS = AERO_LOD.zonas; }
      } catch (e) { console.warn('Aeropuerto: no se han podido asignar los volúmenes sustituidos', e); }
      else for (const f of LM.fichas) if (/^aero_/.test(f.id)) f.build = undefined;
      if (d) { porCeldas(stands().filter(s => s.pas).map(s => [s.x, s.z]), 'aero_veh_', vehBuild);
        porCeldas(masts().filter(m => m.kind !== 'r').map(m => [m.x, m.z]), 'aero_focos_', focosBuild, { alto: 32 }); }
      const r = await init0.call(this, ctx);
      try { const api = window.BCN && window.BCN.lm; let n = 0;
        if (api) for (const f of LM.fichas) { const e = LODD.find(([re]) => re.test(f.id)), rec = e && api.get(f.id);
          if (rec && rec.mesh) { rec.mesh.addLODLevel(e[1], null); n++; } }
        AERO_LOD.n = n; } catch (e) { console.warn('Aeropuerto: sin niveles de detalle', e); }
      return r;
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
uniform sampler2D tDes; uniform sampler2D tCes;
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
  } else if (vC.a < 0.75) {
    // AE3: césped del campo de vuelo (franjas de siega a lo largo de las pistas, tonos por manchas, franja de pista segada
    // más corta y clara, y matojos secos en el campo abierto). vST = (s, t) en metros en el marco de las pistas 07/25;
    // vRw.x = distancia al borde de la pista más cercana, vRw.y = a la calle de rodaje más cercana
    float s = vST.x, t = vST.y, dR = vRw.x, dT = vRw.y;
    // AE4: borde real del césped: distancia con signo al borde (data/aero_cesped.json, celdas de 2 m, 128 + 16·m), con
    // fundido tramado de 2,5 m; así el borde sigue el pavimento sin escalones aunque la malla sean celdas de 6 m
    float sdC = (texture2D(tCes, vec2((s + 2000.0)/4000.0, (t + 1300.0)/2600.0)).r*255.0 - 128.0)/16.0;
    if (dith() > smoothstep(-0.3, 2.2, sdC)) discard;
    float n1 = vnoise(vPos.xz*0.006), n2 = vnoise(vPos.xz*0.031 + 3.1), n3 = vnoise(vPos.xz*0.17 + 9.7), n4 = vnoise(vPos.xz*1.3);
    vec3 g0 = mix(vec3(0.330, 0.410, 0.190), vec3(0.430, 0.470, 0.235), n1);
    g0 = mix(g0, vec3(0.540, 0.520, 0.330), smoothstep(0.5, 0.85, n2)*0.6);                  // manchas secas
    g0 = mix(g0, vec3(0.270, 0.350, 0.160), smoothstep(0.6, 0.9, n3)*0.4);                   // matas más oscuras
    float strip = 1.0 - smoothstep(55.0, 75.0, dR);                                         // franja de pista (segada corta)
    float shoulder = 1.0 - smoothstep(2.0, 10.0, min(dR, dT));                                // margen junto al pavimento
    vec3 sc = mix(vec3(0.420, 0.490, 0.240), vec3(0.470, 0.510, 0.260), n2);
    vec3 alb = mix(g0, sc, strip*0.8);
    // franjas de siega: pasadas de 7 m paralelas a las pistas (en la franja de pista), y en ángulo en el campo abierto
    float pw = 7.0, ph = mix(t, s*0.5 + t*0.866, 1.0 - strip), band = fract(ph/(2.0*pw)), fw = fwidth(ph)/(2.0*pw);
    float b = smoothstep(0.5 - fw - 0.02, 0.5 + fw + 0.02, band) - smoothstep(1.0 - fw - 0.02, 1.0, band);
    b = mix(b, 0.5, clamp(fw*3.0, 0.0, 1.0));
    alb *= 0.88 + 0.2*b*(0.6 + 0.4*strip);
    alb = mix(alb, vec3(0.43, 0.42, 0.33), shoulder*0.5);                                    // tierra y hierba rala junto al borde
    alb *= 0.9 + 0.18*n4;
    vec3 c = shade(alb, N, V, 0.95, 0.0, 1.0);
    c *= 1.0 - 0.55*uNight;                                                                  // como el suelo: de noche, casi negro
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

// ------------------------------------------------------------------ luces de noche (AE2)
// Puntos de luz: cuadrados que miran a la cámara (en el vertex shader), de radio en metros pero nunca menores que `px` píxeles
// (de lejos, las balizas se siguen leyendo como hileras de puntos; para no hacerse manchas, pierden intensidad al crecer).
// Atributos: position = centro, uv = esquina (±1), color = rgb + a (255: destello secuenciado), lt = (radio m, mínimo px,
// ganancia, fase del destello). Uniformes propios: uEye (cámara) y uPx = (2/ancho, 2/alto, P00, P11), fijados al enlazar.
const VS_L = `precision highp float;
attribute vec3 position; attribute vec2 uv; attribute vec4 color; attribute vec4 lt;
uniform mat4 viewProjection; uniform vec3 uEye; uniform vec4 uPx;
varying vec3 vPos; varying vec2 vUv; varying vec4 vC; varying vec2 vK;
void main(){
  vec3 p = position, toC = uEye - p; float d = max(length(toC), 1.0);
  p += toC/d*min(lt.x*2.0, d*0.3);
  vec4 c = viewProjection*vec4(p, 1.0);
  float s = max(1.0, lt.y*uPx.x*c.w/(lt.x*uPx.z));
  c.x += uv.x*lt.x*uPx.z*s; c.y += uv.y*lt.x*uPx.w*s;
  gl_Position = c; vPos = p; vUv = uv; vC = color; vK = vec2(lt.z*max(1.0/s, 0.45), lt.w);
}`;
const FS_L = `varying vec2 vUv; varying vec4 vC; varying vec2 vK;
void main(){
  float on = smoothstep(0.03, 0.3, uDusk);
  if (vC.a > 0.5) on *= step(fract(uTime*0.5 - vK.y), 0.06);
  float r2 = dot(vUv, vUv), a = on*(exp(-r2*7.0) + 0.3*exp(-r2*2.2))*(1.0 - smoothstep(0.75, 1.0, r2));
  if (a < 0.01) discard;
  FRAGA(emit(vC.rgb, vK.x*(0.5 + 4.0*exp(-r2*14.0))), min(a, 1.0));
}`;
// Charcos de luz de las torres de focos: como los de las farolas (furniture.js): en HDR multiplican lo pintado (1 + luz)
const VS_PL = `precision highp float;
attribute vec3 position; attribute vec2 uv; attribute vec4 color; uniform mat4 world; uniform mat4 viewProjection;
varying vec3 vPos; varying vec2 vUv; varying vec4 vC;
void main(){ vec4 wp = world*vec4(position, 1.0); vPos = wp.xyz; vUv = uv; vC = color; gl_Position = viewProjection*wp; }`;
const FS_PL = `varying vec2 vUv; varying vec4 vC;
void main(){
  float f = max(0.0, 1.0 - dot(vUv, vUv)), a = smoothstep(0.05, 0.3, uDusk)*f*(0.35 + 0.65*f)*vC.a*(1.0 - 0.5*uLate);
  a *= mix(1.0, 0.55, smoothstep(60.0, 600.0, uCam.y - vPos.y));
  if (a < 0.004) discard;
#ifdef LDR
  FRAGA(emit(vC.rgb, 0.85), a*0.6);
#else
  gl_FragColor = vec4(1.0 + vC.rgb*(a*6.0), 1.0);
#endif
}`;
// ------------------------------------------------------------------ rótulos del bordillo de la T1 (AE3)
// Paneles con texto genérico en catalán (sin marcas): «Arribades», «Sortides», «Parada de taxis» y «TAXI» pintado en el
// carril. Atlas de 8 filas de 1024 × 64; de noche, los paneles están retroiluminados. Una malla, una llamada.
const VS_R = `precision highp float;
attribute vec3 position; attribute vec2 uv; attribute vec3 normal; attribute vec4 color;
uniform mat4 world; uniform mat4 viewProjection;
varying vec3 vPos; varying vec2 vUv; varying vec3 vN; varying vec4 vC;
void main(){ vec4 wp = world*vec4(position, 1.0); vPos = wp.xyz; vUv = uv; vN = normal; vC = color; gl_Position = viewProjection*wp; }`;
const FS_R = `varying vec2 vUv; varying vec3 vN; varying vec4 vC;
uniform sampler2D tTx;
void main(){
  vec4 tx = texture2D(tTx, vUv);
  if (vC.a > 0.5 && tx.a < 0.5) discard;
  vec3 V = normalize(uCam - vPos), alb = tx.rgb;
  vec3 c = shade(alb, normalize(vN), V, 0.55, 0.0, 1.0);
  if (vC.a < 0.5) c += emit(alb, 0.7)*smoothstep(0.03, 0.3, uDusk);
  FRAG(c);
}`;
function rotulos(ctx, d) {
  const { scene, engine, heightAt, mkMat, reg } = ctx, VB = BABYLON.VertexBuffer;
  const ROWS = [['Arribades', '#1d3550', '#fff'], ['Sortides', '#1d3550', '#fff'], ['Parada de taxis', '#1d3550', '#fff'], ['TAXI', null, '#e3b21e'], ['Arribades · Sortides', '#1d3550', '#fff']];
  const tex = new BABYLON.DynamicTexture('aeroRot', { width: 1024, height: 512 }, scene, true);
  const g = tex.getContext(); g.clearRect(0, 0, 1024, 512); g.textAlign = 'center'; g.textBaseline = 'middle';
  ROWS.forEach(([t, bg, fg], r) => { if (bg) { g.fillStyle = bg; g.fillRect(0, r * 64, 1024, 64); g.fillStyle = '#c9a227'; g.fillRect(0, r * 64 + 58, 1024, 6); }
    g.fillStyle = fg; g.font = (bg ? 'bold 40px' : 'bold 58px') + ' sans-serif'; g.save(); g.translate(512, r * 64 + 31); if (!bg) g.scale(0.7, 1); g.fillText(t, 0, 0); g.restore(); });
  tex.update(true); tex.hasAlpha = true; tex.wrapU = tex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE; tex.anisotropicFilteringLevel = 8;
  const P = [], UV = [], N = [], C = [], I = [];
  const quad = (c4, uvs, nrm, flat) => { const b = P.length / 3; for (let i = 0; i < 4; i++) { P.push(...c4[i]); UV.push(...uvs[i]); N.push(...nrm); C.push(0, 0, 0, flat ? 255 : 0); }
    I.push(b, b + 1, b + 2, b, b + 2, b + 3, b, b + 2, b + 1, b, b + 3, b + 2); };
  const rowUV = (r, w, hgt) => { const uw = Math.min(1, w / hgt / 16) / 2, vB = 1 - (r + 1) / 8 + 0.004, vT = 1 - r / 8 - 0.004; return [0.5 - uw, 0.5 + uw, vB, vT]; };
  // panel vertical centrado en (x, z), base y0, mirando a nrm; dos caras (la de atrás también se lee bien)
  function panel(x, z, y0, w, hgt, nx, nz, r, dos) { const [uL, uR, vB, vT] = rowUV(r, w, hgt);
    for (const sg of dos ? [1, -1] : [1]) { const Nx = nx * sg, Nz = nz * sg, rx = -Nz, rz = Nx, cx = x + Nx * 0.03, cz = z + Nz * 0.03;
      quad([[cx - rx * w / 2, y0, cz - rz * w / 2], [cx + rx * w / 2, y0, cz + rz * w / 2], [cx + rx * w / 2, y0 + hgt, cz + rz * w / 2], [cx - rx * w / 2, y0 + hgt, cz - rz * w / 2]],
        [[uL, vB], [uR, vB], [uR, vT], [uL, vT]], [Nx, 0, Nz], false); } }
  function suelo(x, z, y, w, hgt, fx, fz, r) { const [uL, uR, vB, vT] = rowUV(r, w, hgt), rx = fz, rz = -fx;
    quad([[x - rx * w / 2 - fx * hgt / 2, y, z - rz * w / 2 - fz * hgt / 2], [x + rx * w / 2 - fx * hgt / 2, y, z + rz * w / 2 - fz * hgt / 2], [x + rx * w / 2 + fx * hgt / 2, y, z + rz * w / 2 + fz * hgt / 2], [x - rx * w / 2 + fx * hgt / 2, y, z - rz * w / 2 + fz * hgt / 2]],
      [[uL, vB], [uR, vB], [uR, vT], [uL, vT]], [0, 1, 0], true); }
  const cf = curbFrame(d), yb = heightAt(4240, 3250), n = cf.n, t = cf.t, uTx = cf.Ld * 0.62;
  for (let u = 30; u < cf.Ld - 20; u += 40) {
    let [x, z] = cf.P(u, 0.12); panel(x, z, yb + 3.6, 3.4, 0.5, n[0], n[1], 0, false);           // sobre el acceso de llegadas
    panel(x, z, yb + 8.85 + 3.3, 3.4, 0.5, n[0], n[1], 1, false); }                                   // sobre el de salidas
  for (let u = 40; u < cf.Ld - 20; u += 48) { const [x, z] = cf.P(u, 5.5); panel(x, z, yb + 5.2, 3.6, 0.55, t[0], t[1], 0, true); }   // colgados bajo el viaducto
  for (let u = 30; u < cf.Ld - 30; u += 60) { const [x, z] = cf.P(u, 16.56); panel(x, z, yb + 13.45, 5, 0.5, n[0], n[1], 1, false); }   // canto de la marquesina
  { const [x, z] = cf.P(uTx + 2, 9.3); panel(x, z, yb + 2.1, 2.4, 0.42, t[0], t[1], 2, true); }                                       // tótem de la parada
  for (let u = uTx + 10; u < cf.Ld - 14; u += 26) { const [x, z] = cf.P(u, 12.1); suelo(x, z, yb + 0.03, 1.5, 3.6, -t[0], -t[1], 3); }   // «TAXI» en el carril
  { const [x, z] = cf.P(8, 26); panel(x, z, yb + 4.5, 6, 0.7, -t[0], -t[1], 4, true); }                                                // banderola a la entrada del bordillo
  const mat = mkMat('aero_rotulos', VS_R, FS_R, ['position', 'uv', 'normal', 'color'], [], ['tTx'], {});
  mat.setTexture('tTx', tex);
  const mesh = new BABYLON.Mesh('aeroRotulos', scene);
  mesh.setVerticesData('position', new Float32Array(P), false); mesh.setVerticesData('uv', new Float32Array(UV), false, 2);
  mesh.setVerticesData('normal', new Float32Array(N), false);
  mesh.setVerticesBuffer(new VB(engine, new Uint8Array(C), 'color', false, false, 4, false, 0, 4, VB.UNSIGNED_BYTE, true));
  mesh.setIndices(new Uint32Array(I), P.length / 3);
  mesh.material = mat; mesh.isPickable = false; mesh.renderingGroupId = 1; mesh.freezeWorldMatrix();
  mesh.addLODLevel(700, null);
  reg(mesh, { cast: false, layer: 'lm' });
  return I.length / 3;
}
function luces(ctx, d) {
  const { scene, engine, heightAt, mkMat, reg } = ctx, VB = BABYLON.VertexBuffer;
  const P = [], UV = [], C = [], LT = [], I = [];
  const WHI = [255, 240, 214], YEL = [255, 190, 70], GRN = [60, 255, 120], RED = [255, 40, 26], BLU = [40, 90, 255], AMB = [255, 214, 160];
  const H = (x, z) => Math.max(heightAt(x, z), 0);
  function luz(x, z, y, col, r, px, g, flash, ph) { const b = P.length / 3;
    for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { P.push(x, y, z); UV.push(u, v); C.push(col[0], col[1], col[2], flash ? 255 : 0); LT.push(r, Math.max(px, 1.3), g * 2.0, ph || 0); }
    I.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  const cnt = {};
  const add = (k, n) => (cnt[k] = (cnt[k] || 0) + (n || 1));
  // ---- pistas
  d.pistas.forEach((p, ip) => {
    const ax = p.b[0] - p.a[0], az = p.b[1] - p.a[1], L = Math.hypot(ax, az), u = [ax / L, az / L], lf = [-u[1], u[0]], hw = p.w / 2;
    const at = (s, t, dy) => { const x = p.a[0] + u[0] * s + lf[0] * t, z = p.a[1] + u[1] * s + lf[1] * t; return [x, z, H(x, z) + (dy || 0.7)]; };
    const L1 = (s, t, col, r, px, g, fl, ph, dy) => { const q = at(s, t, dy); luz(q[0], q[1], q[2], col, r, px, g, fl, ph); };
    // bordes: cada 60 m; los últimos 600 m, amarillos (zona de precaución)
    const ne = Math.round(L / 60);
    for (let i = 0; i <= ne; i++) { const s = L * i / ne, e = Math.min(s, L - s); for (const sg of [-1, 1]) L1(s, sg * (hw + 1.5), e < 600 ? YEL : WHI, 0.7, 1.4, 1.3); add('borde', 2); }
    // eje: cada 15 m; a 900–300 m del final, rojo y blanco alternos; los últimos 300 m, rojo
    for (let s = 15, i = 0; s < L - 10; s += 15, i++) { const e = Math.min(s, L - s); const rd = e < 300 || (e < 900 && i % 2); L1(s, 0, rd ? RED : WHI, 0.45, 1.0, rd ? 0.55 : 1.0); add('eje'); }
    for (const [s0, dir, des] of [[0, 1, 0], [L, -1, 1]]) {
      // umbral (verde, fuera) y fin de pista (rojo, dentro), con barras de ala verdes
      for (let t = -hw; t <= hw + 0.01; t += 3) { L1(s0 - dir * 1.0, t, GRN, 0.6, 1.3, 1.4); L1(s0 + dir * 1.5, t, RED, 0.5, 1.1, 0.6); add('umbral', 2); }
      for (const sg of [-1, 1]) for (let k = 0; k < 5; k++) { L1(s0 - dir * 1.0, sg * (hw + 4 + k * 3), GRN, 0.6, 1.3, 1.4); add('umbral'); }
      // toma de contacto (solo la pista larga, de precisión): barretas de tres luces cada 30 m hasta 900 m
      if (ip === 0) for (let s = 60; s <= 900; s += 30) for (const sg of [-1, 1]) for (let k = 0; k < 3; k++) { L1(s0 + dir * s, sg * (9 + k * 1.5), WHI, 0.35, 0.9, 0.8); add('tdz'); }
      // PAPI: cuatro cajas a la izquierda del que aterriza, a 380 m: dos rojas (las de dentro) y dos blancas
      const left = dir;                                                     // +lf es la izquierda de quien vuela hacia +u
      for (let k = 0; k < 4; k++) { L1(s0 + dir * 380, left * (hw + 16 + k * 9), k < 2 ? RED : WHI, 0.9, 1.6, 1.6, 0, 0, 1.0); add('papi'); }
      // aproximación (Calvert): barretas de cinco luces cada 30 m con destellos secuenciados y barras transversales cada 150 m
      const Lap = (ip === 1 && des === 0) || (ip === 2 && des === 1) ? 420 : 900;
      for (let k = 1; k * 30 <= Lap; k++) { const dist = k * 30, s = s0 - dir * dist, dy = 0.8 + Math.min(4, dist / 150);
        for (let j = -2; j <= 2; j++) L1(s, j * 1.05, WHI, 0.5, 1.2, 1.5, 0, 0, dy);
        L1(s, 0, [255, 255, 255], 0.9, 1.8, 4.0, 1, 1 - dist / Lap, dy + 0.5); add('aprox', 6);
        if (dist % 150 === 0) { const w = 6 + dist / 150 * 4.5; for (let t = 3; t <= w; t += 1.5) for (const sg of [-1, 1]) { L1(s, sg * t, WHI, 0.5, 1.2, 1.4, 0, 0, dy); add('aprox'); } } }
    }
  });
  // ---- calles de rodaje: eje verde y bordes azules cada 30 m, fuera de pistas y plataformas
  const onRw = (x, z, m) => d.pistas.some(p => segDist([x, z], p.a, p.b) < p.w / 2 + m);
  const inAp = (x, z) => d.plataformas.some(A => inPoly(A, x, z)) || inPoly(d.t1, x, z) || inPoly(d.t2, x, z);
  for (const pl of d.rodaje) { let acc = 12;
    for (let i = 0; i + 1 < pl.length; i++) { const a = pl[i], b = pl[i + 1], Ls = Math.hypot(b[0] - a[0], b[1] - a[1]); if (Ls < 0.1) continue;
      const tt = [(b[0] - a[0]) / Ls, (b[1] - a[1]) / Ls], n = [-tt[1], tt[0]];
      for (; acc < Ls; acc += 30) { const x = a[0] + tt[0] * acc, z = a[1] + tt[1] * acc;
        if (onRw(x, z, 6) || inAp(x, z)) continue;
        luz(x, z, H(x, z) + 0.6, GRN, 0.32, 0.9, 0.7); add('rodajeEje');
        for (const sg of [-1, 1]) { const ex = x + n[0] * sg * 12, ez = z + n[1] * sg * 12; if (onRw(ex, ez, 10) || inAp(ex, ez)) continue; luz(ex, ez, H(ex, ez) + 0.5, BLU, 0.38, 1.0, 0.9); add('rodajeBorde'); } }
      acc -= Ls; } }
  // ---- torres de focos (dos proyectores en lo alto) y sus charcos de luz en el suelo
  const PP = [], PUV = [], PC = [], PI = [];
  const charco = (cx, cz, R, col, k, dy) => { const b = PP.length / 3, y = H(cx, cz) + (dy || 0.62);
    for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { PP.push(cx + u * R, y, cz + v * R); PUV.push(u, v); PC.push(col[0], col[1], col[2], k); }
    PI.push(b, b + 2, b + 1, b, b + 3, b + 2); };
  for (const m of masts()) {
    const y = H(m.x, m.z) + (m.kind === 'r' ? 13.6 + 6 : m.h), ex = m.x + m.d[0] * 1.2, ez = m.z + m.d[1] * 1.2;
    // AE3: proyectores más pequeños y charcos más tenues (con el bloom quemaban la imagen desde el aire)
    if (m.kind === 'a') { for (const o of [-1.5, 1.5]) luz(ex + m.d[1] * o, ez - m.d[0] * o, y - 0.2, WHI, 0.8, 1.3, 1.1); charco(m.x + m.d[0] * 40, m.z + m.d[1] * 40, 58, [255, 226, 186], 62); }
    else if (m.kind === 'p') { for (const s of [1, -1]) luz(m.x + m.d[0] * 1.6 * s, m.z + m.d[1] * 1.6 * s, y - 0.3, AMB, 0.35, 1.1, 0.7); charco(m.x, m.z, 24, [255, 214, 160], 48); }
    else { luz(m.x, m.z, y - 0.2, AMB, 0.6, 1.2, 1.6); }
    add('foco');
  }
  // ---- bordillos de la T1 (la misma recta que en el hito): luminarias bajo el viaducto (llegadas) y bajo la marquesina
  // (salidas), con sus charcos
  { const cf = curbFrame(d), yb = heightAt(4240, 3250);
    for (let u = 10; u < cf.Ld - 8; u += 12) for (const [o, y, cy] of [[5, 6.2, 0.18], [13, 6.2, 0.0], [6, 13.3, 8.85]]) {
      const [x, z] = cf.P(u, o);
      luz(x, z, yb + y, [255, 236, 210], 0.3, 1.0, 1.0); charco(x, z, 7, [255, 232, 204], 72, cy + yb - H(x, z) + 0.04); add('bordillo'); } }
  // ---- balizas de obstáculo (rojas): torres de control, hangar
  for (const [x, z, hh] of [[5839, 3973, 66], [d.torreAntigua.c[0], d.torreAntigua.c[1], 44]]) { luz(x, z, H(x, z) + hh, RED, 0.6, 1.3, 1.2); add('obst'); }
  // mallas
  const mk = (name, VS, FS, attrs, unis, opts) => mkMat(name, VS, FS, attrs, unis, [], opts);
  const matL = mk('aero_luces', VS_L, FS_L, ['position', 'uv', 'color', 'lt'], ['uEye', 'uPx'], { blend: true });
  matL.onBindObservable.add(() => { const e = matL.getEffect(), cam = scene.activeCamera; if (!e || !cam) return; const pm = scene.getProjectionMatrix().m;
    e.setVector3('uEye', cam.globalPosition); e.setFloat4('uPx', 2 / engine.getRenderWidth(), 2 / engine.getRenderHeight(), pm[0], pm[5]); });
  const mL = new BABYLON.Mesh('aeroLuces', scene);
  mL.setVerticesData('position', new Float32Array(P), false); mL.setVerticesData('uv', new Float32Array(UV), false, 2);
  mL.setVerticesBuffer(new VB(engine, new Uint8Array(C), 'color', false, false, 4, false, 0, 4, VB.UNSIGNED_BYTE, true));
  mL.setVerticesBuffer(new VB(engine, new Float32Array(LT), 'lt', false, false, 4));
  mL.setIndices(new Uint32Array(I), P.length / 3);
  mL.material = matL; mL.isPickable = false; mL.renderingGroupId = 1; mL.alwaysSelectAsActiveMesh = true; mL.doNotSyncBoundingInfo = true; mL.freezeWorldMatrix();
  reg(mL, { cast: false, layer: 'fx' });
  const matP = mk('aero_charcos', VS_PL, FS_PL, ['position', 'uv', 'color'], [], { blend: true });
  matP.onBindObservable.add(() => { if (ctx.out && ctx.out.hdr) engine.alphaState.setAlphaBlendFunctionParameters(0x0306, 0, 0, 1); });
  const mP = new BABYLON.Mesh('aeroCharcos', scene);
  mP.setVerticesData('position', new Float32Array(PP), false); mP.setVerticesData('uv', new Float32Array(PUV), false, 2);
  mP.setVerticesBuffer(new VB(engine, new Uint8Array(PC), 'color', false, false, 4, false, 0, 4, VB.UNSIGNED_BYTE, true));
  mP.setIndices(new Uint32Array(PI), PP.length / 3);
  mP.material = matP; mP.isPickable = false; mP.renderingGroupId = 1; mP.alwaysSelectAsActiveMesh = true; mP.doNotSyncBoundingInfo = true; mP.freezeWorldMatrix();
  reg(mP, { cast: false, layer: 'fx' });
  return { luces: I.length / 6, charcos: PI.length / 6, tris: I.length / 3 + PI.length / 3, cnt };
}

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
  // AE3: césped del campo de vuelo (data/aero_cesped.json: filas de celdas de 6 m en el marco de las pistas 07/25, solo donde
  // el mapa del suelo es verde dentro del recinto, lejos de pistas, rodaje, plataformas y terminales); tramos de ≤ 90 m
  let nCes = 0;
  const ces = await cesP; await dataT;
  if (ces) { const U = ces.u, Vv = ces.v, C = ces.c, O = ces.o;
    const dRw = (x, z) => { let m = 1e9; for (const p of d.pistas) m = Math.min(m, segDist([x, z], p.a, p.b) - p.w / 2); return Math.max(m, 0); };
    const dTx = (x, z) => { let m = 1e9; for (const pl of d.rodaje) for (let i = 0; i + 1 < pl.length; i++) { const a = pl[i], b = pl[i + 1];
      if (Math.abs(x - a[0]) > 400 && Math.abs(x - b[0]) > 400) continue; m = Math.min(m, segDist([x, z], a, b) - 11.5); } return Math.max(m, 0); };
    const W = (uu, vv) => [O[0] + U[0] * uu + Vv[0] * vv, O[1] + U[1] * uu + Vv[1] * vv];
    // fuera del césped: el lado tierra de la T1 (bordillos, viaducto) y los aparcamientos (el verde del mapa bajo el viaducto)
    const cf = curbFrame(d);
    const excl = (x, z) => { const o = x * cf.n[0] + z * cf.n[1] - cf.f, u = x * cf.t[0] + z * cf.t[1]; if (o > -10 && o < 60 && u > cf.u0 - 60 && u < cf.u1 + 60) return true;
      return false; };   // AE4: los aparcamientos ya van recortados en el campo de distancia
    const filas = [];
    for (const row of ces.filas) { const j = row[0], vm = ces.v0 + (j + 0.5) * C, out = [j];
      for (let r = 1; r + 1 < row.length; r += 2) { let a = -1;
        for (let i = row[r]; i <= row[r + 1]; i++) { const ok = i < row[r + 1] && !excl(...W(ces.u0 + (i + 0.5) * C, vm));
          if (ok && a < 0) a = i; if (!ok && a >= 0) { out.push(a, i); a = -1; } } }
      if (out.length > 1) filas.push(out); }
    for (const row of filas) { const j = row[0], va = ces.v0 + j * C - 0.35, vb = va + C + 0.7;
      for (let r = 1; r + 1 < row.length; r += 2) { const ua = ces.u0 + row[r] * C - 0.35, ub = ces.u0 + row[r + 1] * C + 0.35, US = [ua];
        for (let g = Math.floor(ua / 90) * 90 + 90; g < ub - 1; g += 90) US.push(g); US.push(ub); const ns = US.length - 1;
        const b0 = P.length / 3;
        for (const uu of US) {
          for (const vv of [va, vb]) { const [x, z] = W(uu, vv); vtx(x, heightAt(x, z) + 0.42, z, uu, vv, [0, 0, 0], 128, [dRw(x, z), dTx(x, z), 0, 0]); } }
        for (let i = 0; i < ns; i++) { const a = b0 + i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); nCes++; } } } }
  // atlas de designadores: 8 casillas de 128 × 256 (número arriba, letra abajo), blanco sobre negro
  const tex = new BABYLON.DynamicTexture('aeroDes', { width: 1024, height: 256 }, scene, true);
  const g = tex.getContext(); g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 256); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  DES.forEach((t, i) => { const num = t.replace(/[LRC]/, ''), let_ = t.replace(/[0-9]/g, '');
    g.font = 'bold 118px sans-serif'; g.save(); g.translate(i * 128 + 64, let_ ? 64 : 128); g.scale(0.55, 1.0); g.fillText(num, 0, 0); g.restore();
    if (let_) { g.save(); g.translate(i * 128 + 64, 192); g.scale(0.62, 1.0); g.fillText(let_, 0, 0); g.restore(); } });
  tex.update(true); tex.wrapU = tex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE; tex.anisotropicFilteringLevel = 8;
  const mat = mkMat('aero_marcas', VS, FS, ['position', 'uv', 'color', 'rw'], [], ['tDes', 'tCes'], { cull: false });
  mat.setTexture('tDes', tex);
  // AE4: campo de distancia del borde del césped (PNG en el JSON; fila 0 = v0), con filtro bilineal y sin mipmaps
  let tCes = null;
  if (ces && ces.sdf) { tCes = new BABYLON.Texture(ces.sdf.png, scene, true, false, BABYLON.Texture.BILINEAR_SAMPLINGMODE); tCes.wrapU = tCes.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE; }
  else tCes = BABYLON.RawTexture.CreateLuminanceTexture(new Uint8Array([255]), 1, 1, scene, false, false);
  mat.setTexture('tCes', tCes); mat.zOffset = -1; mat.zOffsetUnits = -4;
  const mesh = new BABYLON.Mesh('aeroMarcas', scene);
  mesh.setVerticesData('position', new Float32Array(P), false);
  mesh.setVerticesData('uv', new Float32Array(UV), false, 2);
  mesh.setVerticesBuffer(new VB(engine, new Uint8Array(C), 'color', false, false, 4, false, 0, 4, VB.UNSIGNED_BYTE, true));
  mesh.setVerticesBuffer(new VB(engine, new Float32Array(RW), 'rw', false, false, 4));
  mesh.setIndices(new Uint32Array(I), P.length / 3);
  mesh.material = mat; mesh.isPickable = false; mesh.renderingGroupId = 1; mesh.freezeWorldMatrix(); mesh.alwaysSelectAsActiveMesh = true; mesh.doNotSyncBoundingInfo = true;
  reg(mesh, { cast: false, layer: 'road' });
  await dataT;
  let nRot = 0; try { nRot = rotulos(ctx, d); } catch (e) { console.warn('Aeropuerto: sin rótulos', e); }
  let LU = null; try { LU = luces(ctx, d); } catch (e) { console.warn('Aeropuerto: sin luces de noche', e); }
  const tris = I.length / 3, nStands = stl.length;
  return { update() {}, busy: () => false, stats: () => ({ tris, cesped: nCes * 2, rotulos: nRot, lod: AERO_LOD.n, hold: nHold, puestos: nStands, luces: LU && LU.luces, charcos: LU && LU.charcos, trisLuces: LU && LU.tris, focos: masts().length }) };
} };
// los puestos (los mismos que usan los hitos) para las marcas del suelo
window.BCN_AERO_STANDS = () => (DATA.d ? stands() : []);
})();
