/* GTA Barcelona — Azoteas con detalle: depósitos de agua, antenas de TV, parabólicas, tendederos con ropa, casetas de
   escalera, aparatos de aire, claraboyas, placas solares y alguna barandilla, sobre las cubiertas PLANAS (palette.js).
   Módulo de primer nivel (§6.3) con sus propias celdas de 100 m (las de ctx.city): a ≤ RN m la versión completa (malla
   del shader de detalle, K.PBR, proyecta sombra en la cascada cercana: layer 'furn'); de RN a RF m, cajas sencillas de lo
   grande (casetas, depósitos, aparatos, placas), sin sombra; más lejos, nada.
   Azar por ámbito: seed(b, 90, k) por edificio y elemento (b = índice del registro de edificios): la versión cercana y la
   lejana sacan el MISMO plan (posiciones y medidas), así que al cambiar de una a otra nada se mueve.
   La cota de la cubierta se lee de la malla de volúmenes (incluye los retoques de los hitos), y los edificios que los hitos
   ocultan (vértices colapsados) se saltan.
   window.BCN_ROOFTOPS = { init(ctx) → { update, busy, stats, flush } }. */
(function () {
'use strict';
const { K, GB, quad, obox, cyl, bar, rev, F0, pbrAux, seed, R, shade, mixc } = window.BCN_GEO;

window.BCN_ROOFTOPS = { init(ctx) {
  const { city, detail, reg, BREC, bldChunks } = ctx;
  const PAL = window.BCN_PAL;
  if (!city || !detail || !PAL) throw new Error('faltan ctx.city, ctx.detail o BCN_PAL');
  const { CS, NX, NZ, ALL, bget, inside } = city;
  const RN = 250, RF = 700, HY = 25;                 // radios de la versión completa y de la sencilla (m) y su histéresis
  // materiales (canal auxiliar de K.PBR, §6.7)
  const A_PAINT = pbrAux(0.55, 0, 0, 0), A_MATTE = pbrAux(0.9, 0, 0, 0), A_GALV = pbrAux(0.42, 1, 0, 0), A_RUST = pbrAux(0.7, 0, 3, 0);
  const A_FIBRO = pbrAux(0.85, 0, 3, 0), A_LOUV = pbrAux(0.5, 0, 1, 0), A_PV = pbrAux(0.18, 0.2, 0, 0), A_GLASS = pbrAux(0.12, 0, 0, 0);
  const A_CLOTH = pbrAux(0.95, 0, 0, 0), A_PILOT = pbrAux(0.5, 0, 0, 1);
  const CLOTHES = [[236, 236, 232], [200, 60, 56], [60, 90, 160], [230, 200, 80], [90, 150, 110], [240, 170, 180], [40, 40, 46], [170, 200, 225], [220, 120, 60]];

  // cota de cubierta y «oculto por un hito», leídos de la malla de volúmenes (posiciones con y absoluta)
  const posOf = new WeakMap();
  function roofY(b) {
    const ch = bldChunks[BREC.chunk[b]]; if (!ch || !ch.mesh) return null;
    let pos = posOf.get(ch.mesh); if (!pos) { pos = ch.mesh.getVerticesData('position'); if (!pos) return null; posOf.set(ch.mesh, pos); }
    const v0 = BREC.v0[b], yb = pos[v0 * 3 + 1], yt = pos[(v0 + 1) * 3 + 1];
    if (!(yt - yb > 2.5)) return null;                // colapsado (lo sustituye un hito) o demasiado bajo
    return yt;
  }

  // ---------------------------------------------------------------- plan de un edificio: lista de elementos en mundo
  // Cada elemento: { t: tipo, x, z, y, a (ángulo), …medidas }. Determinista: seed(b, 90, k).
  function plan(b) {
    if (!PAL.flat(b)) return null;
    const d = bget(b); if (d.cls !== 0 && d.cls !== 2 && d.cls !== 6) return null;
    const y = roofY(b); if (y === null) return null;
    const x0 = city.BB[b * 4], z0 = city.BB[b * 4 + 1], x1 = city.BB[b * 4 + 2], z1 = city.BB[b * 4 + 3];
    const Hm = y - d.yb, area = (x1 - x0) * (z1 - z0);
    if (Hm < 6 || area < 70 || area > 14000) return null;
    // orientación dominante: la de la arista más larga del anillo exterior (las piezas se alinean con el edificio)
    const r0 = d.rings[0], m = r0.length / 2; let ang = 0, best = 0;
    for (let i = 0; i < m; i++) { const j = (i + 1) % m, dx = r0[j * 2] - r0[i * 2], dz = r0[j * 2 + 1] - r0[i * 2 + 1], L = dx * dx + dz * dz; if (L > best) { best = L; ang = Math.atan2(dz, dx); } }
    const ca = Math.cos(ang), sa = Math.sin(ang);
    // ¿cabe un rectángulo l × w (girado ang) con centro (x, z), a 0,6 m del borde? (esquinas, centros de lado y centro)
    const fits = (x, z, l, w) => {
      const hl = l / 2 + 0.6, hw = w / 2 + 0.6;
      for (const [p, q] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]) if (!inside(d, x + ca * hl * p - sa * hw * q, z + sa * hl * p + ca * hw * q)) return false;
      return true;
    };
    const used = [];
    const free = (x, z, rr) => { for (const u of used) if (Math.hypot(u[0] - x, u[1] - z) < u[2] + rr) return false; return true; };
    // escoge un sitio (hasta 14 intentos con números del ámbito del elemento)
    const spot = (l, w, rnd) => {
      for (let t = 0; t < 14; t++) { const x = x0 + (x1 - x0) * rnd[t * 2], z = z0 + (z1 - z0) * rnd[t * 2 + 1], rr = Math.hypot(l, w) / 2;
        if (fits(x, z, l, w) && free(x, z, rr)) { used.push([x, z, rr]); return [x, z]; } }
      return null;
    };
    const take = (k, n) => { seed(b, 90, k); const a = new Array(n); for (let i = 0; i < n; i++) a[i] = R(); return a; };
    const items = [];
    const g = take(0, 12);                           // decisiones del edificio
    const big = area > 160, nMax = Math.max(2, Math.min(6, 2 + Math.floor(area / 260)));
    const wall = d.col;
    // 1 · caseta de escalera (casi todos los edificios de pisos)
    if (big && g[0] < 0.85) { const l = 2.4 + g[1] * 1.6, w = 2.1 + g[2] * 0.8, h = 2.3 + g[3] * 0.5, rr = take(1, 28), p = spot(l, w, rr);
      if (p) items.push({ t: 'caseta', x: p[0], z: p[1], y, a: ang, l, w, h, col: shade(mixc(wall, [226, 220, 208], 0.35), 0.97), door: rr[0] < 0.5 ? 1 : -1 }); }
    // 2 · el resto, por sorteo según el barrio y el tamaño
    let k = 2;
    while (items.length < nMax && k < 2 + 2 * nMax) {
      const r = take(k, 40); k++;
      const tsel = r[39];
      if (tsel < 0.24) {                              // depósitos de agua (1–3 en fila)
        const n = 1 + Math.floor(r[30] * 2.6), rad = 0.5 + r[31] * 0.35, h = 1.1 + r[32] * 0.7, fib = r[33] < 0.6, l = n * (rad * 2 + 0.3), w = rad * 2 + 0.3;
        const p = spot(l, w, r); if (p) items.push({ t: 'tank', x: p[0], z: p[1], y, a: ang, n, rad, h, legs: 0.45 + r[34] * 0.5, fib, col: fib ? shade([176, 172, 162], 0.9 + r[35] * 0.15) : [150, 156, 160] });
      } else if (tsel < 0.44) {                       // antena de TV
        const p = spot(0.6, 0.6, r); if (p) items.push({ t: 'ant', x: p[0], z: p[1], y, a: ang + r[30] * 3.1, h: 2.6 + r[31] * 2.8 + (Hm > 35 ? 3 : 0), nd: 2 + Math.floor(r[32] * 2.5), pilot: Hm > 38 && r[33] < 0.5 });
      } else if (tsel < 0.53) {                       // parabólica
        const p = spot(1.0, 1.0, r); if (p) items.push({ t: 'dish', x: p[0], z: p[1], y, a: 2.6 + r[30] * 1.2, rad: 0.35 + r[31] * 0.3 });
      } else if (tsel < 0.68) {                       // tendedero con ropa
        const l = 2.6 + r[30] * 1.8, p = spot(l, 1.4, r);
        if (p) { const cl = []; for (let i = 0; i < 9; i++) cl.push([r[20 + i] < 0.55, CLOTHES[Math.floor(r[29 - i] * CLOTHES.length) % CLOTHES.length], 0.3 + r[10 + i] * 0.45]);
          items.push({ t: 'cloth', x: p[0], z: p[1], y, a: ang, l, cl }); }
      } else if (tsel < 0.84) {                       // aparatos de aire acondicionado (1–4 en fila)
        const n = 1 + Math.floor(r[30] * 3.9), l = n * 0.95, p = spot(l, 0.5, r);
        if (p) items.push({ t: 'ac', x: p[0], z: p[1], y, a: ang, n, col: r[31] < 0.8 ? [214, 214, 208] : [176, 178, 176] });
      } else if (tsel < 0.92) {                       // claraboya
        const s = 0.9 + r[30] * 0.8, p = spot(s, s, r); if (p) items.push({ t: 'sky', x: p[0], z: p[1], y, a: ang, s });
      } else {                                        // placas solares (2–6, en fila, inclinadas al sur)
        const n = 2 + Math.floor(r[30] * 4.9), l = n * 1.05, p = spot(l, 1.9, r);
        if (p) items.push({ t: 'pv', x: p[0], z: p[1], y, a: ang, n });
      }
    }
    // 3 · barandilla en un lado (solo si el edificio no lleva coronación de fachada de detalle)
    if (!BREC.elig[b] && g[4] < 0.35) {
      let i = Math.floor(g[5] * m) % m; const j = (i + 1) % m, ax = r0[i * 2], az = r0[i * 2 + 1], bx = r0[j * 2], bz = r0[j * 2 + 1], L = Math.hypot(bx - ax, bz - az);
      if (L > 4) { const tx = (bx - ax) / L, tz = (bz - az) / L; let nx = -tz, nz = tx; if (!inside(d, (ax + bx) / 2 + nx * 0.6, (az + bz) / 2 + nz * 0.6)) { nx = -nx; nz = -nz; }
        items.push({ t: 'rail', ax: ax + nx * 0.25 + tx * 0.3, az: az + nz * 0.25 + tz * 0.3, tx, tz, L: L - 0.6, y }); }
    }
    return items;
  }

  // ---------------------------------------------------------------- emisión
  // punto local (u a lo largo, v a lo ancho) de un elemento girado a → mundo menos el origen de la celda
  const loc = (it, u, v, ox, oz) => [it.x + Math.cos(it.a) * u - Math.sin(it.a) * v - ox, it.z + Math.sin(it.a) * u + Math.cos(it.a) * v - oz];
  function emitNear(W, it, ox, oz) {
    const c = Math.cos(it.a), s = Math.sin(it.a), y = it.y;
    switch (it.t) {
      case 'caseta': {
        const [x, z] = loc(it, 0, 0, ox, oz);
        obox(W, x, z, y, it.l, it.w, it.h, it.a, it.col, K.PBR, A_MATTE);
        obox(W, x, z, y + it.h, it.l + 0.25, it.w + 0.25, 0.14, it.a, shade(it.col, 0.85), K.PBR, A_MATTE);      // losa con vuelo
        const [dx, dz] = loc(it, it.l * 0.18, it.door * (it.w / 2 + 0.02), ox, oz);
        obox(W, dx, dz, y, 0.85, 0.05, 2.0, it.a, [96, 74, 54], K.PBR, A_PAINT);                                // puerta
        const [vx, vz] = loc(it, -it.l * 0.25, it.door * (it.w / 2 + 0.02), ox, oz);
        obox(W, vx, vz, y + 1.4, 0.5, 0.04, 0.45, it.a, [60, 62, 64], K.PBR, A_LOUV);                           // rejilla
        break; }
      case 'tank': {
        const pitch = it.rad * 2 + 0.3;
        for (let i = 0; i < it.n; i++) { const [x, z] = loc(it, (i - (it.n - 1) / 2) * pitch, 0, ox, oz), y1 = y + it.legs;
          for (const [p, q] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const lx = x + (c * p - s * q) * it.rad * 0.6, lz = z + (s * p + c * q) * it.rad * 0.6; bar(W, [lx, y, lz], [lx, y1, lz], 0.035, [70, 66, 60], K.PBR, A_RUST); }
          rev(W, F0, x, z, [[it.rad * 0.96, y1], [it.rad, y1 + 0.08], [it.rad, y1 + it.h - 0.1], [it.rad * 0.7, y1 + it.h + 0.05], [0, y1 + it.h + 0.12]], 10, it.col, K.PBR, { aux: it.fib ? A_FIBRO : A_GALV, cap: 2 }); }
        break; }
      case 'ant': {
        const x = it.x - ox, z = it.z - oz, top = y + it.h;
        bar(W, [x, y, z], [x, top, z], 0.025, [120, 122, 124], K.PBR, A_GALV);
        bar(W, [x, y + 1.2, z], [x + 0.9, y, z + 0.3], 0.008, [90, 90, 90], K.PBR, A_GALV);                     // viento
        for (let i = 0; i < it.nd; i++) { const yy = top - 0.25 - i * 0.55, L = 1.5 - i * 0.3;
          bar(W, [x - c * L / 2, yy, z - s * L / 2], [x + c * L / 2, yy, z + s * L / 2], 0.012, [130, 132, 134], K.PBR, A_GALV);
          for (let e = 0; e < 5; e++) { const t = (e / 4 - 0.5) * L, ex = x + c * t, ez = z + s * t, hl = 0.32 - e * 0.04;
            bar(W, [ex + s * hl, yy, ez - c * hl], [ex - s * hl, yy, ez + c * hl], 0.007, [130, 132, 134], K.PBR, A_GALV); } }
        if (it.pilot) rev(W, F0, x, z, [[0, top], [0.07, top + 0.03], [0.07, top + 0.1], [0, top + 0.14]], 6, [255, 40, 30], K.PBR, { aux: A_PILOT });
        break; }
      case 'dish': {
        const x = it.x - ox, z = it.z - oz, hy = y + 1.1, r = it.rad;
        bar(W, [x, y, z], [x, hy, z], 0.03, [200, 200, 198], K.PBR, A_PAINT);
        // plato: abanico de 10 lados, hacia (a) y 35° hacia arriba, cara delantera y trasera
        const nx = Math.cos(it.a) * 0.82, ny = 0.57, nz = Math.sin(it.a) * 0.82;
        const ux = -Math.sin(it.a), uz = Math.cos(it.a), vx = -ny * Math.cos(it.a), vy = 0.82, vz = -ny * Math.sin(it.a);
        const cx = x + nx * 0.1, cy = hy + 0.05, cz = z + nz * 0.1;
        for (const side of [1, -1]) for (let i = 0; i < 10; i++) {
          const a0 = i / 10 * Math.PI * 2, a1 = (i + 1) / 10 * Math.PI * 2, P = [], N = [];
          for (const aa of [a0, a1]) { P.push([cx + (ux * Math.cos(aa) + vx * Math.sin(aa)) * r - nx * 0.08, cy + vy * Math.sin(aa) * r - ny * 0.08, cz + (uz * Math.cos(aa) + vz * Math.sin(aa)) * r - nz * 0.08]); N.push([nx * side, ny * side, nz * side]); }
          const C0 = [cx + nx * 0.02 * side, cy + ny * 0.02 * side, cz + nz * 0.02 * side];
          window.BCN_GEO.triN(W, F0, side > 0 ? [C0, P[0], P[1]] : [C0, P[1], P[0]], side > 0 ? [[nx, ny, nz], N[0], N[1]] : [[-nx, -ny, -nz], N[1], N[0]], [222, 222, 218], K.PBR, A_PAINT);
        }
        bar(W, [cx, cy, cz], [cx + nx * 0.45, cy + ny * 0.45, cz + nz * 0.45], 0.012, [90, 90, 92], K.PBR, A_PAINT);   // brazo del LNB
        break; }
      case 'cloth': {
        const L = it.l, hP = 1.7;
        for (const e of [-1, 1]) { const [x, z] = loc(it, e * L / 2, 0, ox, oz);
          bar(W, [x, y, z], [x, y + hP, z], 0.03, [150, 150, 146], K.PBR, A_GALV);
          const [ax, az] = loc(it, e * L / 2, -0.6, ox, oz), [bx, bz] = loc(it, e * L / 2, 0.6, ox, oz);
          bar(W, [ax, y + hP, az], [bx, y + hP, bz], 0.022, [150, 150, 146], K.PBR, A_GALV); }
        for (let q = 0; q < 3; q++) { const v = -0.5 + q * 0.5, [ax, az] = loc(it, -L / 2, v, ox, oz), [bx, bz] = loc(it, L / 2, v, ox, oz);
          bar(W, [ax, y + hP - 0.02, az], [bx, y + hP - 0.06, bz], 0.006, [220, 220, 214], K.PBR, A_MATTE);
          // prendas colgadas de esta cuerda
          for (let i = 0; i < 3; i++) { const cl = it.cl[q * 3 + i]; if (!cl[0]) continue;
            const u = -L / 2 + (i + 0.5) * L / 3, [x, z] = loc(it, u, v, ox, oz), hh = cl[2];
            obox(W, x, z, y + hP - 0.05 - hh, 0.32 + hh * 0.4, 0.02, hh, it.a, cl[1], K.PBR, A_CLOTH); } }
        break; }
      case 'ac': {
        for (let i = 0; i < it.n; i++) { const [x, z] = loc(it, (i - (it.n - 1) / 2) * 0.95, 0, ox, oz);
          obox(W, x, z, y + 0.1, 0.82, 0.32, 0.56, it.a, it.col, K.PBR, A_PAINT);
          const [fx, fz] = loc(it, (i - (it.n - 1) / 2) * 0.95 + 0.12, 0.165, ox, oz);
          obox(W, fx, fz, y + 0.19, 0.42, 0.012, 0.42, it.a, [58, 60, 62], K.PBR, A_LOUV);                      // rejilla del ventilador
          obox(W, x, z, y, 0.7, 0.36, 0.1, it.a, [80, 80, 80], K.PBR, A_RUST); }                                  // soporte
        break; }
      case 'sky': {
        const [x, z] = loc(it, 0, 0, ox, oz);
        obox(W, x, z, y, it.s, it.s, 0.35, it.a, [200, 198, 192], K.PBR, A_MATTE);
        obox(W, x, z, y + 0.35, it.s - 0.12, it.s - 0.12, 0.12, it.a, [110, 130, 140], K.PBR, A_GLASS);
        break; }
      case 'pv': {
        for (let i = 0; i < it.n; i++) {
          const [x, z] = loc(it, (i - (it.n - 1) / 2) * 1.05, 0, ox, oz);
          // panel de 1 × 1,7 m inclinado 30° hacia el sur (−z del mundo, ≈ el mar), sobre un bastidor
          const hw = 0.5, hd = 0.85, ylo = y + 0.25, yhi = y + 0.25 + 2 * hd * 0.5;
          const P = (u, v, yy) => [x + c * u, yy, z + s * u + v];
          const p0 = P(-hw, -hd * 0.87, ylo), p1 = P(hw, -hd * 0.87, ylo), p2 = P(hw, hd * 0.87, yhi), p3 = P(-hw, hd * 0.87, yhi);
          quad(W, F0, ...p0, ...p1, ...p2, ...p3, [34, 44, 74], K.PBR, A_PV);
          bar(W, P(-hw, hd * 0.87, y), P(-hw, hd * 0.87, yhi), 0.02, [160, 162, 164], K.PBR, A_GALV);
          bar(W, P(hw, hd * 0.87, y), P(hw, hd * 0.87, yhi), 0.02, [160, 162, 164], K.PBR, A_GALV);
        }
        break; }
      case 'rail': {
        const n = Math.max(2, Math.round(it.L / 1.4)), hR = 1.0, X = t => it.ax + it.tx * t - ox, Z = t => it.az + it.tz * t - oz;
        for (let i = 0; i <= n; i++) { const t = it.L * i / n; bar(W, [X(t), y, Z(t)], [X(t), y + hR, Z(t)], 0.02, [52, 54, 56], K.PBR, A_PAINT); }
        bar(W, [X(0), y + hR, Z(0)], [X(it.L), y + hR, Z(it.L)], 0.025, [52, 54, 56], K.PBR, A_PAINT);
        bar(W, [X(0), y + 0.5, Z(0)], [X(it.L), y + 0.5, Z(it.L)], 0.015, [52, 54, 56], K.PBR, A_PAINT);
        break; }
    }
  }
  // versión sencilla (de RN a RF m): solo lo grande, en cajas
  function emitFar(W, it, ox, oz) {
    const y = it.y;
    if (it.t === 'caseta') { const [x, z] = loc(it, 0, 0, ox, oz); obox(W, x, z, y, it.l, it.w, it.h + 0.14, it.a, it.col, K.PBR, A_MATTE); }
    else if (it.t === 'tank') { const L = it.n * (it.rad * 2 + 0.3) - 0.3, [x, z] = loc(it, 0, 0, ox, oz); obox(W, x, z, y, L, it.rad * 1.8, it.legs + it.h, it.a, it.col, K.PBR, A_FIBRO); }
    else if (it.t === 'ac') { const [x, z] = loc(it, 0, 0, ox, oz); obox(W, x, z, y, it.n * 0.95 - 0.1, 0.34, 0.66, it.a, it.col, K.PBR, A_PAINT); }
    else if (it.t === 'pv') { const [x, z] = loc(it, 0, 0, ox, oz); obox(W, x, z, y + 0.2, it.n * 1.05, 1.5, 0.5, it.a, [44, 52, 78], K.PBR, A_PV); }
    else if (it.t === 'sky') { const [x, z] = loc(it, 0, 0, ox, oz); obox(W, x, z, y, it.s, it.s, 0.45, it.a, [170, 172, 170], K.PBR, A_MATTE); }
  }

  // ---------------------------------------------------------------- celdas
  const plans = new Map();                           // b → plan (o null); se vacía si crece mucho
  function planOf(b) { let p = plans.get(b); if (p === undefined) { if (plans.size > 20000) plans.clear(); p = plan(b); plans.set(b, p); } return p; }
  const cells = new Map();                           // ci → { lvl, mesh, tris }
  let want = new Map(), queue = [], lastP = null, tris = [0, 0], nItems = 0;
  function build(ci, lvl) {
    const ox = (ci % NX) * CS, oz = ((ci / NX) | 0) * CS, W = new GB(ox, oz);
    let n = 0;
    for (let k = ALL.start[ci]; k < ALL.start[ci + 1]; k++) {
      const b = ALL.list[k], cx = (city.BB[b * 4] + city.BB[b * 4 + 2]) / 2, cz = (city.BB[b * 4 + 1] + city.BB[b * 4 + 3]) / 2;
      if (city.cellOf(cx, cz) !== ci) continue;      // cada edificio, solo en la celda de su centro
      const p = planOf(b); if (!p) continue;
      for (const it of p) { (lvl === 1 ? emitNear : emitFar)(W, it, ox, oz); n++; }
    }
    const old = cells.get(ci); if (old) drop(ci, old);
    const mesh = W.nv ? reg(detail.mkMesh(W, detail.matB, (lvl === 1 ? 'rn' : 'rf') + ci), lvl === 1 ? { cast: true, layer: 'furn' } : { cast: false, layer: 'roof' }) : null;
    const t = W.ni / 3; tris[lvl - 1] += t; nItems += n;
    cells.set(ci, { lvl, mesh, tris: t, n });
  }
  function drop(ci, c) { if (c.mesh) c.mesh.dispose(false, false); tris[c.lvl - 1] -= c.tris; nItems -= c.n; cells.delete(ci); }
  // niveles deseados alrededor de la cámara (con histéresis respecto al que ya tiene la celda)
  function plan2(P) {
    want = new Map();
    const i0 = Math.max(0, Math.floor((P.x - RF - HY) / CS)), i1 = Math.min(NX - 1, Math.floor((P.x + RF + HY) / CS));
    const j0 = Math.max(0, Math.floor((P.z - RF - HY) / CS)), j1 = Math.min(NZ - 1, Math.floor((P.z + RF + HY) / CS));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const ci = j * NX + i; if (ALL.start[ci] === ALL.start[ci + 1]) continue;
      const dx = Math.max(Math.abs(P.x - (i + 0.5) * CS) - CS / 2, 0), dz = Math.max(Math.abs(P.z - (j + 0.5) * CS) - CS / 2, 0);
      const dd = Math.hypot(dx, dz, Math.max(0, P.y - 60) * 0.5), cur = cells.get(ci), cl = cur ? cur.lvl : 0;
      const lvl = dd < RN + (cl === 1 ? HY : -HY * 0) ? 1 : dd < RF + (cl ? HY : 0) ? 2 : 0;
      if (lvl) want.set(ci, lvl);
    }
    for (const [ci, c] of cells) if (!want.has(ci)) drop(ci, c);
    queue = [];
    for (const [ci, l] of want) { const c = cells.get(ci); if (!c || c.lvl !== l) queue.push(ci); }
    // primero lo cercano
    queue.sort((a, b) => (want.get(a) - want.get(b)) || (Math.hypot((a % NX + 0.5) * CS - P.x, ((a / NX) | 0) * CS - P.z) - Math.hypot((b % NX + 0.5) * CS - P.x, ((b / NX) | 0) * CS - P.z)));
  }
  function work(P, ms) {
    if (!lastP || Math.abs(P.x - lastP[0]) + Math.abs(P.z - lastP[2]) + Math.abs(P.y - lastP[1]) * 0.5 > 12) { lastP = [P.x, P.y, P.z]; plan2(P); }
    const t0 = performance.now();
    while (queue.length && performance.now() - t0 < ms) { const ci = queue.shift(), l = want.get(ci); if (l) build(ci, l); }
  }
  return {
    update(P) { work(P, 3); },
    busy: () => queue.length > 0,
    flush(P) { lastP = null; work(P, 1e9); },
    stats: () => ({ cells: cells.size, items: nItems, trisNear: tris[0], trisFar: tris[1], queue: queue.length }),
  };
} };
})();
