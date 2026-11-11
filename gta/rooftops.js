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
  const RN = 260, RM = 650, RF = 1100, HY = 25;     // radios: completa, sencilla con peto, solo bultos grandes (m) e histéresis
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
  const MODERN = new Set(['poblenou', 'les_corts', 'sant_andreu', 'nou_barris', 'periferia', 'horta_guinardo', 'sants']);
  const TERRACE = new Set(['eixample', 'gracia', 'sant_gervasi', 'sarria_pedralbes', 'barceloneta', 'ciutat_vella', 'poble_sec']);
  const AWN = [[46, 110, 70], [200, 70, 52], [230, 220, 196], [52, 84, 140], [214, 150, 60], [120, 120, 118]];
  function plan(b) {
    if (!PAL.flat(b)) return null;
    const d = bget(b); if (d.cls !== 0 && d.cls !== 2 && d.cls !== 6) return null;
    const y = roofY(b); if (y === null) return null;
    const x0 = city.BB[b * 4], z0 = city.BB[b * 4 + 1], x1 = city.BB[b * 4 + 2], z1 = city.BB[b * 4 + 3];
    const Hm = y - d.yb, area = (x1 - x0) * (z1 - z0);
    if (Hm < 6 || area < 50 || area > 14000) return null;
    const fam = PAL.FAMS[PAL.fam(b)];
    // orientación dominante: la misma que alinea la textura de la cubierta (app.js): media de las aristas con el ángulo ×4
    const r0 = d.rings[0], m = r0.length / 2; let s4c = 0, s4s = 0;
    for (let i = 0; i < m; i++) { const j = (i + 1) % m, dx = r0[j * 2] - r0[i * 2], dz = r0[j * 2 + 1] - r0[i * 2 + 1], L = Math.hypot(dx, dz);
      if (L > 0.05) { const a4 = 4 * Math.atan2(dz, dx); s4c += L * Math.cos(a4); s4s += L * Math.sin(a4); } }
    const ang = Math.atan2(s4s, s4c) / 4, ca = Math.cos(ang), sa = Math.sin(ang);
    // ¿cabe un rectángulo l × w (girado a) con centro (x, z), a 0,7 m del borde (dentro del peto)?
    const fits = (x, z, l, w, a) => {
      const c = Math.cos(a), s = Math.sin(a), hl = l / 2 + 0.7, hw = w / 2 + 0.7;
      for (const [p, q] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [0, 1], [-1, 0], [1, 0], [0, 0]]) if (!inside(d, x + c * hl * p - s * hw * q, z + s * hl * p + c * hw * q)) return false;
      return true;
    };
    const used = [];
    const free = (x, z, rr) => { for (const u of used) if (Math.hypot(u[0] - x, u[1] - z) < u[2] + rr) return false; return true; };
    // escoge un sitio (hasta 18 intentos con números del ámbito del elemento); edge: arrimado a un peto (u = ±1 a lo largo)
    const spot = (l, w, rnd, a) => {
      a = a === undefined ? ang : a;
      for (let t = 0; t < 18; t++) { const x = x0 + (x1 - x0) * rnd[t * 2], z = z0 + (z1 - z0) * rnd[t * 2 + 1], rr = Math.hypot(l, w) / 2;
        if (fits(x, z, l, w, a) && free(x, z, rr)) { used.push([x, z, rr]); return [x, z]; } }
      return null;
    };
    const take = (k, n) => { seed(b, 90, k); const a = new Array(n); for (let i = 0; i < n; i++) a[i] = R(); return a; };
    const items = [];
    const g = take(0, 16);                           // decisiones del edificio
    const wall = d.col || [210, 200, 184];
    const petoC = shade(mixc(wall, [214, 206, 192], 0.3), 0.96);
    // 0 · peto en todo el borde (anillo exterior y patios de luces), con albardilla clara
    const pH = 0.85 + g[6] * 0.35;
    for (const r of d.rings) { const n = r.length / 2;
      for (let i = 0; i < n; i++) { const j = (i + 1) % n, ax = r[i * 2], az = r[i * 2 + 1], bx = r[j * 2], bz = r[j * 2 + 1], L = Math.hypot(bx - ax, bz - az); if (L < 0.4) continue;
        const tx = (bx - ax) / L, tz = (bz - az) / L; let nx = -tz, nz = tx;
        if (!inside(d, (ax + bx) / 2 + nx * 0.5, (az + bz) / 2 + nz * 0.5)) { nx = -nx; nz = -nz; }
        items.push({ t: 'peto', ax, az, bx, bz, nx, nz, y, h: pH, col: petoC }); } }
    const big = area > 110, nMax = Math.max(3, Math.min(16, 3 + Math.floor(area / 110)));
    // 1 · caseta de escalera (casi todos los edificios de pisos; dos en los muy grandes), con puerta, rejilla y, a veces,
    // barandilla en su terrado y escalera de gato
    const nCas = !big ? 0 : g[0] < 0.9 ? (area > 1100 && g[7] < 0.6 ? 2 : 1) : 0;
    for (let ci = 0; ci < nCas; ci++) { const rr = take(1 + ci * 40, 40), l = 2.6 + rr[36] * 1.6, w = 2.2 + rr[37] * 0.9, h = 2.4 + rr[38] * 0.5, p = spot(l, w, rr);
      if (p) items.push({ t: 'caseta', x: p[0], z: p[1], y, a: ang, l, w, h, col: shade(mixc(wall, [226, 220, 208], 0.35), 0.97), door: rr[39] < 0.5 ? 1 : -1,
        rail: rr[35] < 0.45, ladder: rr[34] < 0.5, doorC: [[96, 74, 54], [70, 92, 84], [120, 52, 40], [64, 66, 70]][Math.floor(rr[33] * 4)] }); }
    // 2 · terraza con pérgola, jardineras y toldo (barrios de terrados habitados)
    if (big && TERRACE.has(fam) && g[8] < 0.32) { const rr = take(3, 40), l = 3 + rr[36] * 2.5, w = 2.6 + rr[37] * 1.4, p = spot(l, w + 1.2, rr);
      if (p) items.push({ t: 'perg', x: p[0], z: p[1], y, a: ang, l, w, wood: rr[38] < 0.6, awn: rr[39] < 0.55 ? AWN[Math.floor(rr[35] * AWN.length)] : null, pl: rr.slice(20, 30) }); }
    // 3 · placas solares (edificios modernos)
    if (big && (MODERN.has(fam) || d.cls === 2 || Hm > 28) && g[9] < 0.38) { const rr = take(4, 40), rows = 1 + Math.floor(rr[36] * 2.9), n = 3 + Math.floor(rr[37] * 6), p = spot(n * 1.05, rows * 2.4, rr);
      if (p) items.push({ t: 'pv', x: p[0], z: p[1], y, a: ang, n, rows }); }
    // 4 · el resto, por sorteo según el tamaño
    let k = 5;
    while (items.filter(it => it.t !== 'peto').length < nMax && k < 5 + 3 * nMax) {
      const r = take(k, 44); k++;
      const tsel = r[43];
      if (tsel < 0.15) {                              // depósitos de agua (1–3 en fila)
        const n = 1 + Math.floor(r[40] * 2.6), rad = 0.5 + r[41] * 0.35, h = 1.1 + r[42] * 0.7, fib = r[39] < 0.6, l = n * (rad * 2 + 0.3), w = rad * 2 + 0.3;
        const p = spot(l, w, r); if (p) items.push({ t: 'tank', x: p[0], z: p[1], y, a: ang, n, rad, h, legs: 0.45 + r[38] * 0.5, fib, col: fib ? shade([176, 172, 162], 0.9 + r[37] * 0.15) : [150, 156, 160] });
      } else if (tsel < 0.33) {                       // antena de TV (Barcelona: un bosque de ellas)
        const p = spot(0.6, 0.6, r); if (p) items.push({ t: 'ant', x: p[0], z: p[1], y, a: ang + r[40] * 3.1, h: 2.8 + r[41] * 3.2 + (Hm > 35 ? 3 : 0), nd: 2 + Math.floor(r[42] * 2.5), pilot: Hm > 38 && r[39] < 0.5 });
      } else if (tsel < 0.42) {                       // parabólica (mirando al sur-sureste)
        const p = spot(1.1, 1.1, r); if (p) items.push({ t: 'dish', x: p[0], z: p[1], y, a: -1.9 + r[40] * 0.5, rad: 0.32 + r[41] * 0.3, wall: r[39] < 0.4 });
      } else if (tsel < 0.58) {                       // tendedero con ropa
        const l = 2.6 + r[40] * 2.2, p = spot(l, 1.4, r);
        if (p) { const cl = []; for (let i = 0; i < 12; i++) cl.push([r[20 + i] < 0.68, CLOTHES[Math.floor(r[32 - i] * CLOTHES.length) % CLOTHES.length], 0.3 + r[8 + i] * 0.5, 0.3 + r[i] * 0.45]);
          items.push({ t: 'cloth', x: p[0], z: p[1], y, a: ang, l, cl }); }
      } else if (tsel < 0.72) {                       // aparatos de aire acondicionado (1–5 en fila)
        const n = 1 + Math.floor(r[40] * 4.9), l = n * 0.95, p = spot(l, 0.5, r);
        if (p) items.push({ t: 'ac', x: p[0], z: p[1], y, a: ang, n, col: r[41] < 0.8 ? [214, 214, 208] : [176, 178, 176] });
      } else if (tsel < 0.80) {                       // claraboya (de vidrio, a dos aguas o plana)
        const s = 0.9 + r[40] * 1.0, p = spot(s, s * (1 + r[41]), r); if (p) items.push({ t: 'sky', x: p[0], z: p[1], y, a: ang, s, w: s * (1 + r[41]), pit: r[39] < 0.5 });
      } else if (tsel < 0.92) {                       // chimeneas de ventilación (2–6 en grupo, de obra o metálicas)
        const n = 2 + Math.floor(r[40] * 4.9), l = n * 0.6, p = spot(l, 0.6, r);
        if (p) items.push({ t: 'vent', x: p[0], z: p[1], y, a: ang, n, metal: r[41] < 0.3, h: 0.9 + r[42] * 0.9, hs: r.slice(10, 16), col: shade(mixc(wall, [200, 190, 176], 0.5), 0.92) });
      } else {                                        // jardineras sueltas o un trastero
        if (r[40] < 0.6) { const l = 1.6 + r[41] * 2.4, p = spot(l, 0.5, r); if (p) items.push({ t: 'plant', x: p[0], z: p[1], y, a: ang, l, pl: r.slice(20, 30) }); }
        else { const l = 1.4 + r[41], w = 1.0 + r[42] * 0.6, p = spot(l, w, r); if (p) items.push({ t: 'shed', x: p[0], z: p[1], y, a: ang, l, w, col: r[39] < 0.5 ? [196, 198, 196] : shade(wall, 0.9) }); }
      }
    }
    return items;
  }

  // ---------------------------------------------------------------- emisión
  // punto local (u a lo largo, v a lo ancho) de un elemento girado a → mundo menos el origen de la celda
  const loc = (it, u, v, ox, oz) => [it.x + Math.cos(it.a) * u - Math.sin(it.a) * v - ox, it.z + Math.sin(it.a) * u + Math.cos(it.a) * v - oz];
  const GREEN = [[64, 104, 52], [84, 122, 60], [52, 88, 46], [104, 132, 70]];
  function peto(W, it, ox, oz, cap) {
    const t = 0.22, ax = it.ax - ox, az = it.az - oz, bx = it.bx - ox, bz = it.bz - oz, ix = it.nx * t, iz = it.nz * t, y = it.y, yt = y + it.h;
    quad(W, F0, ax + ix, y, az + iz, bx + ix, y, bz + iz, bx + ix, yt, bz + iz, ax + ix, yt, az + iz, shade(it.col, 0.93), K.PBR, A_MATTE);   // cara interior
    quad(W, F0, ax, y - 0.3, az, bx, y - 0.3, bz, bx, yt, bz, ax, yt, az, it.col, K.PBR, A_MATTE);                                             // cara exterior (sigue el muro)
    const e = cap ? 0.04 : 0;                                                                                                                    // albardilla
    quad(W, F0, ax - it.nx * e, yt, az - it.nz * e, bx - it.nx * e, yt, bz - it.nz * e, bx + ix + it.nx * e, yt, bz + iz + it.nz * e, ax + ix + it.nx * e, yt, az + iz + it.nz * e, shade(it.col, 1.1), K.PBR, A_MATTE);
  }
  function plants(W, it, ox, oz, L, v0, n) {           // jardinera de obra con matas
    const [x, z] = loc(it, 0, v0, ox, oz);
    obox(W, x, z, it.y, L, 0.45, 0.42, it.a, [176, 120, 90], K.PBR, A_MATTE);
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n * L - L / 2, [px, pz] = loc(it, u, v0, ox, oz), rr = 0.22 + it.pl[i % 10] * 0.22;
      window.BCN_GEO.sphere(W, F0, px, it.y + 0.42 + rr * 0.6, pz, rr, 6, 4, GREEN[Math.floor(it.pl[(i + 3) % 10] * 4)], K.PBR, A_MATTE, 0.9); }
  }
  function emitNear(W, it, ox, oz) {
    const c = Math.cos(it.a), s = Math.sin(it.a), y = it.y;
    switch (it.t) {
      case 'peto': peto(W, it, ox, oz, true); break;
      case 'caseta': {
        const [x, z] = loc(it, 0, 0, ox, oz);
        obox(W, x, z, y, it.l, it.w, it.h, it.a, it.col, K.PBR, A_MATTE);
        obox(W, x, z, y + it.h, it.l + 0.25, it.w + 0.25, 0.14, it.a, shade(it.col, 0.85), K.PBR, A_MATTE);      // losa con vuelo
        const [dx, dz] = loc(it, it.l * 0.18, it.door * (it.w / 2 + 0.02), ox, oz);
        obox(W, dx, dz, y, 0.85, 0.05, 2.0, it.a, it.doorC, K.PBR, A_PAINT);                                      // puerta
        const [vx, vz] = loc(it, -it.l * 0.25, it.door * (it.w / 2 + 0.02), ox, oz);
        obox(W, vx, vz, y + 1.4, 0.5, 0.04, 0.45, it.a, [60, 62, 64], K.PBR, A_LOUV);                           // rejilla
        const yt = y + it.h + 0.14;
        if (it.rail) {                                                                                           // barandilla del terrado de la caseta
          const hl = it.l / 2 + 0.05, hw = it.w / 2 + 0.05, P = [[-hl, -hw], [hl, -hw], [hl, hw], [-hl, hw]].map(([u, v]) => loc(it, u, v, ox, oz));
          for (let i = 0; i < 4; i++) { const [ax, az] = P[i], [bx, bz] = P[(i + 1) % 4];
            bar(W, [ax, yt, az], [ax, yt + 0.95, az], 0.022, [52, 54, 56], K.PBR, A_PAINT);
            bar(W, [ax, yt + 0.95, az], [bx, yt + 0.95, bz], 0.022, [52, 54, 56], K.PBR, A_PAINT);
            bar(W, [ax, yt + 0.5, az], [bx, yt + 0.5, bz], 0.014, [52, 54, 56], K.PBR, A_PAINT); }
        }
        if (it.ladder) {                                                                                         // escalera de gato
          const u = -it.l / 2 - 0.08, [ax, az] = loc(it, u, -0.22, ox, oz), [bx, bz] = loc(it, u, 0.22, ox, oz);
          bar(W, [ax, y, az], [ax, yt + 0.6, az], 0.018, [80, 82, 84], K.PBR, A_GALV); bar(W, [bx, y, bz], [bx, yt + 0.6, bz], 0.018, [80, 82, 84], K.PBR, A_GALV);
          for (let q = 0.3; q < it.h; q += 0.3) bar(W, [ax, y + q, az], [bx, y + q, bz], 0.012, [80, 82, 84], K.PBR, A_GALV);
        }
        break; }
      case 'tank': {
        const pitch = it.rad * 2 + 0.3;
        for (let i = 0; i < it.n; i++) { const [x, z] = loc(it, (i - (it.n - 1) / 2) * pitch, 0, ox, oz), y1 = y + it.legs;
          for (const [p, q] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const lx = x + (c * p - s * q) * it.rad * 0.6, lz = z + (s * p + c * q) * it.rad * 0.6; bar(W, [lx, y, lz], [lx, y1, lz], 0.035, [70, 66, 60], K.PBR, A_RUST); }
          rev(W, F0, x, z, [[it.rad * 0.96, y1], [it.rad, y1 + 0.08], [it.rad, y1 + it.h - 0.1], [it.rad * 0.7, y1 + it.h + 0.05], [0, y1 + it.h + 0.12]], 8, it.col, K.PBR, { aux: it.fib ? A_FIBRO : A_GALV, cap: 2 }); }
        break; }
      case 'ant': {
        const x = it.x - ox, z = it.z - oz, top = y + it.h;
        bar(W, [x, y, z], [x, top, z], 0.03, [120, 122, 124], K.PBR, A_GALV);
        obox(W, x, z, y, 0.35, 0.35, 0.12, it.a, [150, 150, 146], K.PBR, A_MATTE);                              // dado de hormigón
        bar(W, [x, y + 1.2, z], [x + 0.9, y, z + 0.3], 0.008, [90, 90, 90], K.PBR, A_GALV);                     // viento
        for (let i = 0; i < it.nd; i++) { const yy = top - 0.25 - i * 0.6, L = 1.7 - i * 0.3;
          // boom y elementos como cintas planas (2 triángulos cada uno: se leen desde arriba, que es desde donde se ven)
          const w = 0.025, rib = (ax, az, bx, bz, hw) => { const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz) || 1, px = -dz / l * hw, pz = dx / l * hw;
            quad(W, F0, ax + px, yy, az + pz, bx + px, yy, bz + pz, bx - px, yy, bz - pz, ax - px, yy, az - pz, [130, 132, 134], K.PBR, A_GALV); };
          rib(x - c * L / 2, z - s * L / 2, x + c * L / 2, z + s * L / 2, w);
          for (let e = 0; e < 6; e++) { const t = (e / 5 - 0.5) * L, ex = x + c * t, ez = z + s * t, hl = 0.36 - e * 0.04;
            rib(ex + s * hl, ez - c * hl, ex - s * hl, ez + c * hl, 0.012); } }
        if (it.pilot) rev(W, F0, x, z, [[0, top], [0.07, top + 0.03], [0.07, top + 0.1], [0, top + 0.14]], 6, [255, 40, 30], K.PBR, { aux: A_PILOT });
        break; }
      case 'dish': {
        const x = it.x - ox, z = it.z - oz, hy = y + 1.1, r = it.rad;
        bar(W, [x, y, z], [x, hy, z], 0.03, [200, 200, 198], K.PBR, A_PAINT);
        const nx = Math.cos(it.a) * 0.82, ny = 0.57, nz = Math.sin(it.a) * 0.82;
        const ux = -Math.sin(it.a), uz = Math.cos(it.a), vx = -ny * Math.cos(it.a), vy = 0.82, vz = -ny * Math.sin(it.a);
        const cx = x + nx * 0.1, cy = hy + 0.05, cz = z + nz * 0.1;
        for (const side of [1, -1]) for (let i = 0; i < 10; i++) {
          const a0 = i / 10 * Math.PI * 2, a1 = (i + 1) / 10 * Math.PI * 2, P = [], N = [];
          for (const aa of [a0, a1]) { P.push([cx + (ux * Math.cos(aa) + vx * Math.sin(aa)) * r - nx * 0.08, cy + vy * Math.sin(aa) * r - ny * 0.08, cz + (uz * Math.cos(aa) + vz * Math.sin(aa)) * r - nz * 0.08]); N.push([nx * side, ny * side, nz * side]); }
          const C0 = [cx + nx * 0.02 * side, cy + ny * 0.02 * side, cz + nz * 0.02 * side];
          window.BCN_GEO.triN(W, F0, side > 0 ? [C0, P[0], P[1]] : [C0, P[1], P[0]], side > 0 ? [[nx, ny, nz], N[0], N[1]] : [[-nx, -ny, -nz], N[1], N[0]], [222, 222, 218], K.PBR, A_PAINT);
        }
        bar(W, [cx, cy, cz], [cx + nx * 0.45, cy + ny * 0.45, cz + nz * 0.45], 0.012, [90, 90, 92], K.PBR, A_PAINT);
        break; }
      case 'cloth': {
        const L = it.l, hP = 1.75;
        for (const e of [-1, 1]) { const [x, z] = loc(it, e * L / 2, 0, ox, oz);
          bar(W, [x, y, z], [x, y + hP, z], 0.035, [150, 150, 146], K.PBR, A_GALV);
          const [ax, az] = loc(it, e * L / 2, -0.6, ox, oz), [bx, bz] = loc(it, e * L / 2, 0.6, ox, oz);
          bar(W, [ax, y + hP, az], [bx, y + hP, bz], 0.025, [150, 150, 146], K.PBR, A_GALV); }
        for (let q = 0; q < 3; q++) { const v = -0.5 + q * 0.5, [ax, az] = loc(it, -L / 2, v, ox, oz), [bx, bz] = loc(it, L / 2, v, ox, oz);
          bar(W, [ax, y + hP - 0.02, az], [bx, y + hP - 0.06, bz], 0.008, [220, 220, 214], K.PBR, A_MATTE);
          for (let i = 0; i < 4; i++) { const cl = it.cl[q * 4 + i]; if (!cl[0]) continue;
            const u = -L / 2 + (i + 0.5) * L / 4, [x, z] = loc(it, u, v, ox, oz), hh = cl[2];
            obox(W, x, z, y + hP - 0.05 - hh, Math.min(L / 4 - 0.06, 0.35 + cl[3] * 0.4), 0.025, hh, it.a, cl[1], K.PBR, A_CLOTH); } }
        break; }
      case 'ac': {
        for (let i = 0; i < it.n; i++) { const [x, z] = loc(it, (i - (it.n - 1) / 2) * 0.95, 0, ox, oz);
          obox(W, x, z, y + 0.1, 0.82, 0.32, 0.56, it.a, it.col, K.PBR, A_PAINT);
          const [fx, fz] = loc(it, (i - (it.n - 1) / 2) * 0.95 + 0.12, 0.165, ox, oz);
          obox(W, fx, fz, y + 0.19, 0.42, 0.012, 0.42, it.a, [58, 60, 62], K.PBR, A_LOUV);
          obox(W, x, z, y, 0.7, 0.36, 0.1, it.a, [80, 80, 80], K.PBR, A_RUST); }
        break; }
      case 'sky': {
        const [x, z] = loc(it, 0, 0, ox, oz);
        obox(W, x, z, y, it.s, it.w, 0.4, it.a, [200, 198, 192], K.PBR, A_MATTE);
        if (it.pit) { const hl = it.s / 2 - 0.05, hw = it.w / 2 - 0.05, yb = y + 0.4, yr = yb + Math.min(hw, 0.6) * 0.7;
          const P = (u, v, yy) => { const [px, pz] = loc(it, u, v, ox, oz); return [px, yy, pz]; };
          quad(W, F0, ...P(-hl, -hw, yb), ...P(hl, -hw, yb), ...P(hl, 0, yr), ...P(-hl, 0, yr), [96, 120, 132], K.PBR, A_GLASS);
          quad(W, F0, ...P(-hl, hw, yb), ...P(hl, hw, yb), ...P(hl, 0, yr), ...P(-hl, 0, yr), [96, 120, 132], K.PBR, A_GLASS);
        } else obox(W, x, z, y + 0.4, it.s - 0.12, it.w - 0.12, 0.12, it.a, [110, 130, 140], K.PBR, A_GLASS);
        break; }
      case 'vent': {
        for (let i = 0; i < it.n; i++) { const [x, z] = loc(it, (i - (it.n - 1) / 2) * 0.6, 0, ox, oz), h = it.h * (0.8 + 0.4 * it.hs[i % 6]);
          if (it.metal) { cyl(W, x, z, y, y + h, 0.11, 0.11, 8, [170, 172, 170], K.PBR, A_GALV); cyl(W, x, z, y + h + 0.06, y + h + 0.2, 0.2, 0.04, 8, [150, 152, 150], K.PBR, A_GALV); }
          else { obox(W, x, z, y, 0.42, 0.42, h, it.a, it.col, K.PBR, A_MATTE); obox(W, x, z, y + h + 0.12, 0.56, 0.56, 0.06, it.a, shade(it.col, 0.85), K.PBR, A_MATTE);
            obox(W, x, z, y + h, 0.3, 0.3, 0.12, it.a, [40, 38, 36], K.PBR, A_MATTE); } }                           // boca (sombra bajo el sombrerete)
        break; }
      case 'perg': {
        const hl = it.l / 2, hw = it.w / 2, hP = 2.3, wc = it.wood ? [128, 92, 60] : [64, 66, 68], A = it.wood ? A_MATTE : A_PAINT;
        for (const [p, q] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const [px, pz] = loc(it, p * hl, q * hw, ox, oz); bar(W, [px, y, pz], [px, y + hP, pz], 0.05, wc, K.PBR, A); }
        for (const q of [-1, 1]) { const [ax, az] = loc(it, -hl - 0.2, q * hw, ox, oz), [bx, bz] = loc(it, hl + 0.2, q * hw, ox, oz); bar(W, [ax, y + hP, az], [bx, y + hP, bz], 0.05, wc, K.PBR, A); }
        const ns = Math.max(4, Math.round(it.l / 0.45));
        if (it.awn) { const P = (u, v, yy) => { const [px, pz] = loc(it, u, v, ox, oz); return [px, yy, pz]; };
          quad(W, F0, ...P(-hl, -hw - 0.3, y + hP + 0.04), ...P(hl, -hw - 0.3, y + hP + 0.04), ...P(hl, hw + 0.3, y + hP + 0.18), ...P(-hl, hw + 0.3, y + hP + 0.18), it.awn, K.PBR, A_CLOTH); }
        else for (let i = 0; i <= ns; i++) { const u = -hl + it.l * i / ns, [ax, az] = loc(it, u, -hw - 0.25, ox, oz), [bx, bz] = loc(it, u, hw + 0.25, ox, oz); bar(W, [ax, y + hP + 0.08, az], [bx, y + hP + 0.08, bz], 0.03, wc, K.PBR, A); }
        // mesa y sillas, y jardineras al pie
        { const [tx, tz] = loc(it, 0, 0, ox, oz); obox(W, tx, tz, y + 0.7, 1.2, 0.75, 0.04, it.a, [230, 228, 222], K.PBR, A_PAINT); bar(W, [tx, y, tz], [tx, y + 0.7, tz], 0.03, [60, 60, 62], K.PBR, A_PAINT);
          for (const p of [-1, 1]) { const [sx, sz] = loc(it, p * 0.95, 0, ox, oz); obox(W, sx, sz, y, 0.42, 0.42, 0.45, it.a, [200, 200, 196], K.PBR, A_PAINT); } }
        plants(W, it, ox, oz, it.l, hw + 0.45, Math.max(2, Math.round(it.l / 0.7)));
        break; }
      case 'plant': plants(W, it, ox, oz, it.l, 0, Math.max(2, Math.round(it.l / 0.6))); break;
      case 'shed': { const [x, z] = loc(it, 0, 0, ox, oz);
        obox(W, x, z, y, it.l, it.w, 1.9, it.a, it.col, K.PBR, A_GALV); obox(W, x, z, y + 1.9, it.l + 0.1, it.w + 0.1, 0.06, it.a, shade(it.col, 0.8), K.PBR, A_GALV); break; }
      case 'pv': {
        for (let rw = 0; rw < it.rows; rw++) for (let i = 0; i < it.n; i++) {
          const [x, z] = loc(it, (i - (it.n - 1) / 2) * 1.05, (rw - (it.rows - 1) / 2) * 2.4, ox, oz);
          // panel de 1 × 1,7 m inclinado 30° hacia el sur (−z del mundo, ≈ el mar), sobre un bastidor
          const hw = 0.5, hd = 0.85, ylo = y + 0.25, yhi = y + 0.25 + 2 * hd * 0.5;
          const P = (u, v, yy) => [x + c * u, yy, z + s * u + v];
          const p0 = P(-hw, -hd * 0.87, ylo), p1 = P(hw, -hd * 0.87, ylo), p2 = P(hw, hd * 0.87, yhi), p3 = P(-hw, hd * 0.87, yhi);
          quad(W, F0, ...p0, ...p1, ...p2, ...p3, [34, 44, 74], K.PBR, A_PV);
          bar(W, P(-hw, hd * 0.87, y), P(-hw, hd * 0.87, yhi), 0.02, [160, 162, 164], K.PBR, A_GALV);
          bar(W, P(hw, hd * 0.87, y), P(hw, hd * 0.87, yhi), 0.02, [160, 162, 164], K.PBR, A_GALV);
        }
        break; }
    }
  }
  // versión sencilla (nivel 2, de RN a RM m: cajas de todo lo que tiene bulto, el peto y la ropa como manchas de color;
  // nivel 3, de RM a RF m: solo casetas, depósitos y pérgolas)
  function emitFar(W, it, ox, oz, lvl) {
    const y = it.y, [x, z] = it.t === 'peto' ? [0, 0] : loc(it, 0, 0, ox, oz);
    switch (it.t) {
      case 'caseta': obox(W, x, z, y, it.l, it.w, it.h + 0.14, it.a, it.col, K.PBR, A_MATTE); break;
      case 'tank': obox(W, x, z, y, it.n * (it.rad * 2 + 0.3) - 0.3, it.rad * 1.8, it.legs + it.h, it.a, it.col, K.PBR, A_FIBRO); break;
      case 'perg': obox(W, x, z, y + 2.25, it.l + 0.4, it.w + 0.5, 0.12, it.a, it.awn || (it.wood ? [128, 92, 60] : [64, 66, 68]), K.PBR, it.awn ? A_CLOTH : A_MATTE);
        if (lvl === 2) { const [px, pz] = loc(it, 0, it.w / 2 + 0.45, ox, oz); obox(W, px, pz, y, it.l, 0.5, 0.8, it.a, GREEN[0], K.PBR, A_MATTE); } break;
      default: if (lvl !== 2) break;
        if (it.t === 'peto') peto(W, it, ox, oz, false);
        else if (it.t === 'ac') obox(W, x, z, y, it.n * 0.95 - 0.1, 0.34, 0.66, it.a, it.col, K.PBR, A_PAINT);
        else if (it.t === 'pv') obox(W, x, z, y + 0.2, it.n * 1.05, it.rows * 2.4 - 0.6, 0.55, it.a, [44, 52, 78], K.PBR, A_PV);
        else if (it.t === 'sky') obox(W, x, z, y, it.s, it.w, 0.5, it.a, [150, 160, 166], K.PBR, A_MATTE);
        else if (it.t === 'vent') obox(W, x, z, y, it.n * 0.6 - 0.15, 0.45, it.h + 0.15, it.a, it.metal ? [170, 172, 170] : it.col, K.PBR, A_MATTE);
        else if (it.t === 'shed') obox(W, x, z, y, it.l, it.w, 1.95, it.a, it.col, K.PBR, A_GALV);
        else if (it.t === 'plant') obox(W, x, z, y, it.l, 0.5, 0.8, it.a, GREEN[1], K.PBR, A_MATTE);
        else if (it.t === 'cloth') { for (let q = 0; q < 3; q++) { const cl = it.cl[q * 4 + (q % 4)]; const [px, pz] = loc(it, 0, -0.5 + q * 0.5, ox, oz);
          obox(W, px, pz, y + 1.1, it.l * 0.85, 0.05, 0.6, it.a, cl[1], K.PBR, A_CLOTH); } }
        else if (it.t === 'ant') obox(W, x, z, y, 0.12, 0.12, it.h, it.a, [120, 122, 124], K.PBR, A_GALV);
    }
  }

  // ---------------------------------------------------------------- celdas
  const plans = new Map();                           // b → plan (o null); se vacía si crece mucho
  function planOf(b) { let p = plans.get(b); if (p === undefined) { if (plans.size > 20000) plans.clear(); p = plan(b); plans.set(b, p); } return p; }
  const cells = new Map();                           // ci → { lvl, mesh, tris }
  let want = new Map(), queue = [], lastP = null, tris = [0, 0, 0], nItems = 0;
  function build(ci, lvl) {
    const ox = (ci % NX) * CS, oz = ((ci / NX) | 0) * CS, W = new GB(ox, oz);
    let n = 0;
    for (let k = ALL.start[ci]; k < ALL.start[ci + 1]; k++) {
      const b = ALL.list[k], cx = (city.BB[b * 4] + city.BB[b * 4 + 2]) / 2, cz = (city.BB[b * 4 + 1] + city.BB[b * 4 + 3]) / 2;
      if (city.cellOf(cx, cz) !== ci) continue;      // cada edificio, solo en la celda de su centro
      const p = planOf(b); if (!p) continue;
      for (const it of p) { if (lvl === 1) emitNear(W, it, ox, oz); else emitFar(W, it, ox, oz, lvl); n++; }
    }
    const old = cells.get(ci); if (old) drop(ci, old);
    const mesh = W.nv ? reg(detail.mkMesh(W, detail.matB, (lvl === 1 ? 'rn' : lvl === 2 ? 'rm' : 'rf') + ci), lvl === 1 ? { cast: true, layer: 'furn' } : { cast: false, layer: 'roof' }) : null;
    const t = W.ni / 3; tris[lvl - 1] += t; nItems += n;
    cells.set(ci, { lvl, mesh, tris: t, n });
  }
  function drop(ci, c) { if (c.mesh) c.mesh.dispose(false, false); tris[c.lvl - 1] -= c.tris; nItems -= c.n; cells.delete(ci); }
  // niveles deseados alrededor de la cámara (con histéresis respecto al que ya tiene la celda)
  function plan2(P) {
    want = new Map();
    const gY = ctx.heightAt ? ctx.heightAt(P.x, P.z) || 0 : 0;   // altura de la cámara sobre el suelo, no sobre el mar
    const i0 = Math.max(0, Math.floor((P.x - RF - HY) / CS)), i1 = Math.min(NX - 1, Math.floor((P.x + RF + HY) / CS));
    const j0 = Math.max(0, Math.floor((P.z - RF - HY) / CS)), j1 = Math.min(NZ - 1, Math.floor((P.z + RF + HY) / CS));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const ci = j * NX + i; if (ALL.start[ci] === ALL.start[ci + 1]) continue;
      const dx = Math.max(Math.abs(P.x - (i + 0.5) * CS) - CS / 2, 0), dz = Math.max(Math.abs(P.z - (j + 0.5) * CS) - CS / 2, 0);
      const dd = Math.hypot(dx, dz, Math.max(0, P.y - gY - 40) * 0.6), cur = cells.get(ci), cl = cur ? cur.lvl : 0;
      const lvl = dd < RN + (cl === 1 ? HY : 0) ? 1 : dd < RM + (cl && cl <= 2 ? HY : 0) ? 2 : dd < RF + (cl ? HY : 0) ? 3 : 0;
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
    stats: () => ({ cells: cells.size, items: nItems, trisNear: tris[0], trisMid: tris[1], trisFar: tris[2], queue: queue.length }),
  };
} };
})();
