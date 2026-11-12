/* GTA Barcelona — Azoteas y tejados con detalle, sobre las cubiertas de palette.js:
   · cubiertas PLANAS: peto con albardilla, casetas de escalera, depósitos de agua, antenas de TV, parabólicas, tendederos con
     ropa, aparatos de aire, claraboyas, chimeneas de ventilación, pérgolas, jardineras, trasteros y placas solares;
   · TEJA ÁRABE (casas pequeñas y bajas de planta casi rectangular: palette.js manda las demás a azotea de rasilla): tejado
     de verdad, a dos o cuatro aguas sobre el rectángulo mínimo orientado con el eje del edificio (el mismo de uv2), con
     alero, cumbrera, hastiales y canales de teja alineados con la pendiente (tipo de material TEJA, propio), del MISMO color
     de la tabla de cubiertas que la losa que se ve de lejos.
   Módulo de primer nivel (§6.3) con sus propias celdas de 100 m (las de ctx.city) y TRES niveles que se funden con el tramado
   (dith) por distancia 3D de cada píxel, como el resto del detalle:
     1 · completo, ≤ ~200 m, proyecta sombra en la cascada cercana (layer 'furn');
     2 · cajas de lo que tiene bulto, peto (solo su cara interior) y ropa como paños, de ~170 a ~410 m;
     3 · casetas, depósitos, pérgolas y tejados, de ~360 a ~800 m.
   Una celda que cae en la franja de fundido tiene a la vez los dos niveles; cada malla lleva su franja de entrada y de salida
   (metadata.rf) y el material propio (copia del shader de detalle con el fundido de entrada en lugar del de los sustitutos)
   la fija al enlazarla. Los niveles salen del MISMO plan (posiciones y medidas): al fundirse nada se mueve.
   Azar por ámbito: seed(b, 90, k) por edificio y elemento (b = índice del registro de edificios).
   La cota de la cubierta se lee de la malla de volúmenes (incluye los retoques de los hitos), y los edificios que los hitos
   ocultan (vértices colapsados) se saltan.
   window.BCN_ROOFTOPS = { init(ctx) → { update, busy, stats, flush } }. */
(function () {
'use strict';
const GEO = window.BCN_GEO;
const { K, GB, quad, obox, cyl, bar, rev, F0, pbrAux, seed, R, shade, mixc } = GEO;

// teja árabe sobre los faldones: canales de 22 cm que bajan por la pendiente (dirección de la normal en planta), hiladas de
// 40 cm con el borde de cada pieza en sombra, tono por pieza y algo de líquen. Todo de media cero y apagado cuando el motivo
// baja de ~2 píxeles: de lejos, el color de la tabla (el mismo que la losa de FS_BLD). aux.x = semilla de la casa
GEO.regKind('TEJA', 120, `
    rough = 0.86;
    float dl = length(n.xz); vec2 dd = dl > 1e-3 ? n.xz/dl : vec2(1.0, 0.0);
    float cs = max(abs(n.y), 0.35);
    vec2 q = vec2(dot(vLoc.xz, vec2(-dd.y, dd.x)), dot(vLoc.xz, dd)/cs) + vInfo.x*vec2(31.0, 17.0);
    float pw = max(length(fwidth(q)), 1e-4);
    float cu = q.x/0.22, co = q.y/0.40 + 0.5*step(1.0, mod(floor(cu), 2.0));
    float fs = 1.0 - smoothstep(0.45, 0.9, pw/0.22), fm = 1.0 - smoothstep(0.4, 0.8, pw/3.0);
    float sh = sin(6.2832*cu), ed = smoothstep(0.78, 0.96, fract(co));
    float tx = (sh*0.13 - (ed - 0.18)*0.20 + 0.16*(hash21(vec2(floor(cu), floor(co)) + vInfo.x*13.0) - 0.5))*fs
             + 0.08*(vnoise(q*0.45) - 0.5)*fm;
    alb *= (1.0 + tx*(1.0 - 0.7*uNight))*(1.0 - 0.55*uNight);
    N = normalize(n + vec3(-dd.y, 0.0, dd.x)*cos(6.2832*cu)*0.55*fs);
    ao = mix(1.0, 0.82, ed*fs);`);

window.BCN_ROOFTOPS = { init(ctx) {
  const { city, detail, reg, BREC, bldChunks, scene } = ctx;
  const PAL = window.BCN_PAL;
  if (!city || !detail || !PAL) throw new Error('faltan ctx.city, ctx.detail o BCN_PAL');
  const { CS, NX, NZ, ALL, bget, inside } = city;
  // franjas de fundido (distancia 3D del píxel a la cámara, m): [entra de, entra hasta, sale de, sale hasta]
  const BAND = [null, [-2, -1, 170, 200], [170, 200, 360, 410], [360, 410, 720, 800]], HY = 20;
  // materiales (canal auxiliar de K.PBR, §6.7)
  const A_PAINT = pbrAux(0.55, 0, 0, 0), A_MATTE = pbrAux(0.9, 0, 0, 0), A_GALV = pbrAux(0.42, 1, 0, 0), A_RUST = pbrAux(0.7, 0, 3, 0);
  const A_FIBRO = pbrAux(0.85, 0, 3, 0), A_LOUV = pbrAux(0.5, 0, 1, 0), A_PV = pbrAux(0.18, 0.2, 0, 0), A_GLASS = pbrAux(0.12, 0, 0, 0);
  const A_CLOTH = pbrAux(0.95, 0, 0, 0), A_PILOT = pbrAux(0.5, 0, 0, 1), A_TILE = pbrAux(0.85, 0, 0, 0);
  const CLOTHES = [[236, 236, 232], [200, 60, 56], [60, 90, 160], [230, 200, 80], [90, 150, 110], [240, 170, 180], [40, 40, 46], [170, 200, 225], [220, 120, 60]];

  // ---------------------------------------------------------------- material: copia del shader de detalle de las fachadas
  // con el fundido de ENTRADA por malla (el de salida ya lo tiene: uFade). Comparte con detail.matB los mapas de uniformes y
  // texturas (lo que fijen en él los demás módulos y la luz vale también aquí) y se da de alta en ctx.mats (sombras, LDR)
  const mb = detail.matB, sp = mb.shaderPath, OLD = 'if (vInfo.w > 0.99 && uCellHi > 0.5 && dt >= smoothstep(uFadeHi.x, uFadeHi.y, dist)) discard;';
  if (!sp || !sp.fragmentSource || sp.fragmentSource.indexOf(OLD) < 0) throw new Error('rooftops: no encuentro el fundido del shader de detalle');
  const op = mb.options;
  const matR = new BABYLON.ShaderMaterial('roofDet', scene, { vertexSource: sp.vertexSource, fragmentSource: sp.fragmentSource.replace(OLD, 'if (dt >= smoothstep(uFadeHi.x, uFadeHi.y, dist)) discard;') },
    { attributes: op.attributes.slice(), uniforms: op.uniforms.slice(), samplers: op.samplers.slice(), defines: op.defines.slice(), needAlphaBlending: false });
  matR.backFaceCulling = mb.backFaceCulling;
  for (const k of ['_textures', '_floats', '_ints', '_vectors2', '_vectors3', '_vectors4', '_colors3', '_colors4', '_matrices', '_floatsArrays'])
    if (mb[k] && typeof mb[k] === 'object') matR[k] = mb[k];
  ctx.mats.push(matR);
  matR.onBindObservable.add(mesh => { const e = matR.getEffect(), f = mesh.metadata && mesh.metadata.rf;
    if (e && f) { e.setFloat2('uFadeHi', f[0], f[1]); e.setFloat2('uFade', f[2], f[3]); } });

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
  const take = (b, k, n) => { seed(b, 90, k); const a = new Array(n); for (let i = 0; i < n; i++) a[i] = R(); return a; };
  // eje del edificio: media de las aristas con el ángulo ×4 (el mismo que app.js guarda en uv2 para la textura de la cubierta)
  function axis(r0) {
    const m = r0.length / 2; let s4c = 0, s4s = 0;
    for (let i = 0; i < m; i++) { const j = (i + 1) % m, dx = r0[j * 2] - r0[i * 2], dz = r0[j * 2 + 1] - r0[i * 2 + 1], L = Math.hypot(dx, dz);
      if (L > 0.05) { const a4 = 4 * Math.atan2(dz, dx); s4c += L * Math.cos(a4); s4s += L * Math.sin(a4); } }
    return Math.atan2(s4s, s4c) / 4;
  }
  // tejado de teja: rectángulo mínimo orientado con el eje; dos aguas (cumbrera a lo largo) o cuatro según la planta
  function planTeja(b, d, y) {
    const ri = PAL.roof(b); if (ri < 0 || PAL.roofType(ri) !== 1) return null;
    const r0 = d.rings[0], m = r0.length / 2; let a = axis(r0), ca = Math.cos(a), sa = Math.sin(a);
    let u0 = 1e9, u1 = -1e9, w0 = 1e9, w1 = -1e9, A = 0;
    for (let i = 0; i < m; i++) { const j = (i + 1) % m, x = r0[i * 2], z = r0[i * 2 + 1], u = x * ca + z * sa, w = z * ca - x * sa;
      A += x * r0[j * 2 + 1] - r0[j * 2] * z; u0 = Math.min(u0, u); u1 = Math.max(u1, u); w0 = Math.min(w0, w); w1 = Math.max(w1, w); }
    A = Math.abs(A) / 2;
    if (A / Math.max(1, (u1 - u0) * (w1 - w0)) < 0.78 || d.rings.length > 1) return null;   // planta irregular o con patio: losa
    const uc = (u0 + u1) / 2, wc = (w0 + w1) / 2;
    let hl = (u1 - u0) / 2, hw = (w1 - w0) / 2;
    if (hw > hl) { const t = hl; hl = hw; hw = t; a += Math.PI / 2; }        // u = lado largo (la cumbrera va a lo largo)
    if (hw < 1.5 || hw > 9) return null;
    const g = take(b, 70, 6), asp = hl / hw;
    const two = asp > 1.35 ? g[0] < 0.82 : g[0] < 0.3;
    const it = { t: 'teja', x: uc * ca - wc * sa, z: uc * sa + wc * ca, y, a, hl, hw, two, tn: 0.29 + g[1] * 0.1,
      col: PAL.roofCol(ri), wall: d.col || [214, 200, 180], sd: Math.floor(g[2] * 255) };
    const items = [it];
    // antena de TV en la cumbrera, en muchas casas
    if (g[3] < 0.5) { const r = take(b, 71, 4), yr = y + hw * it.tn, u = (r[0] - 0.5) * Math.max(0, two ? hl : hl - hw) * 1.6;
      items.push({ t: 'ant', x: it.x + Math.cos(a) * u, z: it.z + Math.sin(a) * u, y: yr, a: a + r[1] * 3.1, h: 2.2 + r[2] * 2.2, nd: 1 + Math.floor(r[3] * 2.5), pilot: false }); }
    return items;
  }
  function plan(b) {
    const d = bget(b); if (d.cls !== 0 && d.cls !== 2 && d.cls !== 6) return null;
    const y = roofY(b); if (y === null) return null;
    if (!PAL.flat(b)) return planTeja(b, d, y);
    const x0 = city.BB[b * 4], z0 = city.BB[b * 4 + 1], x1 = city.BB[b * 4 + 2], z1 = city.BB[b * 4 + 3];
    const Hm = y - d.yb, area = (x1 - x0) * (z1 - z0);
    if (Hm < 6 || area < 50 || area > 14000) return null;
    const fam = PAL.FAMS[PAL.fam(b)];
    const ang = axis(d.rings[0]);
    // ¿cabe un rectángulo l × w (girado a) con centro (x, z), a 0,7 m del borde (dentro del peto)?
    const fits = (x, z, l, w, a) => {
      const c = Math.cos(a), s = Math.sin(a), hl = l / 2 + 0.7, hw = w / 2 + 0.7;
      for (const [p, q] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [0, 1], [-1, 0], [1, 0], [0, 0]]) if (!inside(d, x + c * hl * p - s * hw * q, z + s * hl * p + c * hw * q)) return false;
      return true;
    };
    const used = [];
    const free = (x, z, rr) => { for (const u of used) if (Math.hypot(u[0] - x, u[1] - z) < u[2] + rr) return false; return true; };
    // escoge un sitio (hasta 18 intentos con números del ámbito del elemento)
    const spot = (l, w, rnd, a) => {
      a = a === undefined ? ang : a;
      for (let t = 0; t < 18; t++) { const x = x0 + (x1 - x0) * rnd[t * 2], z = z0 + (z1 - z0) * rnd[t * 2 + 1], rr = Math.hypot(l, w) / 2;
        if (fits(x, z, l, w, a) && free(x, z, rr)) { used.push([x, z, rr]); return [x, z]; } }
      return null;
    };
    const items = [];
    const g = take(b, 0, 16);                        // decisiones del edificio
    const wall = d.col || [210, 200, 184];
    const petoC = shade(mixc(wall, [214, 206, 192], 0.3), 0.96);
    // 0 · peto en todo el borde (anillo exterior y patios de luces), con albardilla clara
    const pH = 0.85 + g[6] * 0.35;
    for (const r of d.rings) { const n = r.length / 2;
      for (let i = 0; i < n; i++) { const j = (i + 1) % n, ax = r[i * 2], az = r[i * 2 + 1], bx = r[j * 2], bz = r[j * 2 + 1], L = Math.hypot(bx - ax, bz - az); if (L < 0.4) continue;
        const tx = (bx - ax) / L, tz = (bz - az) / L; let nx = -tz, nz = tx;
        if (!inside(d, (ax + bx) / 2 + nx * 0.5, (az + bz) / 2 + nz * 0.5)) { nx = -nx; nz = -nz; }
        items.push({ t: 'peto', ax, az, bx, bz, nx, nz, y, h: pH, L, col: petoC }); } }
    const big = area > 110, nMax = Math.max(3, Math.min(12, 3 + Math.floor(area / 140)));
    let nAnt = 0;
    // 1 · caseta de escalera (casi todos los edificios de pisos; dos en los muy grandes), con puerta, rejilla y, a veces,
    // barandilla en su terrado y escalera de gato
    const nCas = !big ? 0 : g[0] < 0.9 ? (area > 1100 && g[7] < 0.6 ? 2 : 1) : 0;
    for (let ci = 0; ci < nCas; ci++) { const rr = take(b, 1 + ci * 40, 40), l = 2.6 + rr[36] * 1.6, w = 2.2 + rr[37] * 0.9, h = 2.4 + rr[38] * 0.5, p = spot(l, w, rr);
      if (p) items.push({ t: 'caseta', x: p[0], z: p[1], y, a: ang, l, w, h, col: shade(mixc(wall, [226, 220, 208], 0.35), 0.97), door: rr[39] < 0.5 ? 1 : -1,
        rail: rr[35] < 0.45, ladder: rr[34] < 0.5, doorC: [[96, 74, 54], [70, 92, 84], [120, 52, 40], [64, 66, 70]][Math.floor(rr[33] * 4)] }); }
    // 2 · terraza con pérgola, jardineras y toldo (barrios de terrados habitados)
    if (big && TERRACE.has(fam) && g[8] < 0.32) { const rr = take(b, 3, 40), l = 3 + rr[36] * 2.5, w = 2.6 + rr[37] * 1.4, p = spot(l, w + 1.2, rr);
      if (p) items.push({ t: 'perg', x: p[0], z: p[1], y, a: ang, l, w, wood: rr[38] < 0.6, awn: rr[39] < 0.55 ? AWN[Math.floor(rr[35] * AWN.length)] : null, pl: rr.slice(20, 30) }); }
    // 3 · placas solares (edificios modernos)
    if (big && (MODERN.has(fam) || d.cls === 2 || Hm > 28) && g[9] < 0.38) { const rr = take(b, 4, 40), rows = 1 + Math.floor(rr[36] * 2.9), n = 3 + Math.floor(rr[37] * 6), p = spot(n * 1.05, rows * 2.4, rr);
      if (p) items.push({ t: 'pv', x: p[0], z: p[1], y, a: ang, n, rows }); }
    // 4 · el resto, por sorteo según el tamaño
    let k = 5, nIt = items.filter(it => it.t !== 'peto').length;
    while (nIt < nMax && k < 5 + 3 * nMax) {
      const r = take(b, k, 44); k++;
      const tsel = r[43], n0 = items.length;
      if (tsel < 0.15) {                              // depósitos de agua (1–3 en fila)
        const n = 1 + Math.floor(r[40] * 2.6), rad = 0.5 + r[41] * 0.35, h = 1.1 + r[42] * 0.7, fib = r[39] < 0.6, l = n * (rad * 2 + 0.3), w = rad * 2 + 0.3;
        const p = spot(l, w, r); if (p) items.push({ t: 'tank', x: p[0], z: p[1], y, a: ang, n, rad, h, legs: 0.45 + r[38] * 0.5, fib, col: fib ? shade([176, 172, 162], 0.9 + r[37] * 0.15) : [150, 156, 160] });
      } else if (tsel < 0.33) {                       // antena de TV (Barcelona: un bosque de ellas; como mucho 3 por azotea)
        const p = nAnt++ < 3 ? spot(0.6, 0.6, r) : null; if (p) items.push({ t: 'ant', x: p[0], z: p[1], y, a: ang + r[40] * 3.1, h: 2.8 + r[41] * 3.2 + (Hm > 35 ? 3 : 0), nd: 2 + Math.floor(r[42] * 2.5), pilot: Hm > 38 && r[39] < 0.5 });
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
      nIt += items.length - n0;
    }
    return items;
  }

  // ---------------------------------------------------------------- emisión (piezas baratas: caras planas, sin fondos)
  // punto local (u a lo largo, v a lo ancho) de un elemento girado a → mundo menos el origen de la celda
  const loc = (it, u, v, ox, oz) => [it.x + Math.cos(it.a) * u - Math.sin(it.a) * v - ox, it.z + Math.sin(it.a) * u + Math.cos(it.a) * v - oz];
  const GREEN = [[64, 104, 52], [84, 122, 60], [52, 88, 46], [104, 132, 70]];
  // caja orientada sin cara de abajo (10 triángulos)
  function bx(W, x, z, y, l, w, h, a, col, aux) {
    const F = { x: x - Math.cos(a) * l / 2 + Math.sin(a) * w / 2, z: z - Math.sin(a) * l / 2 - Math.cos(a) * w / 2, tx: Math.cos(a), tz: Math.sin(a), nx: -Math.sin(a), nz: Math.cos(a) };
    GEO.box(W, F, 0, l, y, y + h, 0, w, col, K.PBR, 5, aux);
    quad(W, F, 0, y, 0, l, y, 0, l, y + h, 0, 0, y + h, 0, shade(col, 0.85), K.PBR, aux);
  }
  // paño vertical entre dos puntos de planta (2 triángulos; el shader lo ve por las dos caras): postes, barandillas, ropa
  const vq = (W, a, b, y0, y1, col, aux) => quad(W, F0, a[0], y0, a[1], b[0], y0, b[1], b[0], y1, b[1], a[0], y1, a[1], col, K.PBR, aux);
  // poste fino: paño vertical de ancho w orientado según el ángulo ang
  const post = (W, x, z, y0, y1, w, ang, col, aux) => { const c = Math.cos(ang) * w / 2, s = Math.sin(ang) * w / 2; vq(W, [x - c, z - s], [x + c, z + s], y0, y1, col, aux); };
  function peto(W, it, ox, oz, lvl) {
    const t = 0.22, ax = it.ax - ox, az = it.az - oz, bx_ = it.bx - ox, bz = it.bz - oz, ix = it.nx * t, iz = it.nz * t, y = it.y, yt = y + it.h;
    quad(W, F0, ax + ix, y, az + iz, bx_ + ix, y, bz + iz, bx_ + ix, yt, bz + iz, ax + ix, yt, az + iz, shade(it.col, 0.93), K.PBR, A_MATTE);   // cara interior
    if (lvl !== 1) return;   // de lejos basta la interior. Sin cara exterior (sigue el muro de FS_BLD y la interior se ve por las dos caras)
    const e = 0.04;   // albardilla (vuela 4 cm por fuera: tapa la junta con el muro)
    quad(W, F0, ax - it.nx * e, yt, az - it.nz * e, bx_ - it.nx * e, yt, bz - it.nz * e, bx_ + ix + it.nx * e, yt, bz + iz + it.nz * e, ax + ix + it.nx * e, yt, az + iz + it.nz * e, shade(it.col, 1.1), K.PBR, A_MATTE);
  }
  function plants(W, it, ox, oz, L, v0, n) {           // jardinera de obra con matas (esferas de 16 triángulos)
    const [x, z] = loc(it, 0, v0, ox, oz);
    bx(W, x, z, it.y, L, 0.45, 0.42, it.a, [176, 120, 90], A_MATTE);
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n * L - L / 2, [px, pz] = loc(it, u, v0, ox, oz), rr = 0.22 + it.pl[i % 10] * 0.22;
      GEO.sphere(W, F0, px, it.y + 0.42 + rr * 0.6, pz, rr, 4, 3, GREEN[Math.floor(it.pl[(i + 3) % 10] * 4)], K.PBR, A_MATTE, 0.9); }
  }
  // tejado de teja (nivel 1: con alero grueso, cumbrera y limatesas; niveles 2 y 3: faldones y hastiales)
  function teja(W, it, ox, oz, lvl) {
    const { hl, hw, tn, y } = it, o = 0.38, og = it.two ? 0.25 : o, ye = y + 0.04 - o * tn, yr = y + 0.04 + hw * tn;
    const P = (u, v, yy) => { const [px, pz] = loc(it, u, v, ox, oz); return [px, yy, pz]; };
    const aux = [it.sd, 0, 0, 0, it.sd, 0, 0, 0, it.sd, 0, 0, 0, it.sd, 0, 0, 0], col = it.col, KT = K.TEJA;
    const Q = (a, b, c, d, cl, kd, ax) => quad(W, F0, ...a, ...b, ...c, ...d, cl, kd, ax);
    if (it.two) {
      const L = hl + og;
      Q(P(-L, -hw - o, ye), P(L, -hw - o, ye), P(L, 0, yr), P(-L, 0, yr), col, KT, aux);
      Q(P(-L, hw + o, ye), P(L, hw + o, ye), P(L, 0, yr), P(-L, 0, yr), col, KT, aux);
      for (const e of [-1, 1]) {                       // hastiales (del color del muro)
        const n = [Math.cos(it.a) * e, 0, Math.sin(it.a) * e];
        GEO.triN(W, F0, [P(e * hl, -hw, y - 0.02), P(e * hl, hw, y - 0.02), P(e * hl, 0, yr - 0.02)], [n, n, n], shade(it.wall, 0.97), K.PBR, A_MATTE); }
    } else {
      const rl = Math.max(0, hl - hw);
      Q(P(-hl - o, -hw - o, ye), P(hl + o, -hw - o, ye), P(rl, 0, yr), P(-rl, 0, yr), col, KT, aux);
      Q(P(-hl - o, hw + o, ye), P(hl + o, hw + o, ye), P(rl, 0, yr), P(-rl, 0, yr), col, KT, aux);
      for (const e of [-1, 1]) { const p0 = P(e * (hl + o), -hw - o, ye), p1 = P(e * (hl + o), hw + o, ye), p2 = P(e * rl, 0, yr);
        const v1 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], v2 = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
        let nx = v1[1] * v2[2] - v1[2] * v2[1], ny = v1[2] * v2[0] - v1[0] * v2[2], nz = v1[0] * v2[1] - v1[1] * v2[0]; const nl = Math.hypot(nx, ny, nz) * (ny < 0 ? -1 : 1);
        const n = [nx / nl, ny / nl, nz / nl]; GEO.triN(W, F0, [p0, p1, p2], [n, n, n], col, KT, aux); }
    }
    if (lvl !== 1) return;
    // alero: canto de la teja (franja oscura bajo el borde) y cumbrera de piezas redondas; en cuatro aguas, limatesas
    const dk = shade(col, 0.62), L = it.two ? hl + og : hl + o;
    for (const e of [-1, 1]) vq(W, loc(it, -L, e * (hw + o), ox, oz), loc(it, L, e * (hw + o), ox, oz), ye - 0.1, ye, dk, A_TILE);
    if (!it.two) for (const e of [-1, 1]) vq(W, loc(it, e * (hl + o), -hw - o, ox, oz), loc(it, e * (hl + o), hw + o, ox, oz), ye - 0.1, ye, dk, A_TILE);
    const rc = shade(col, 0.9);
    if (it.two || hl - hw > 0.2) { const rl = it.two ? hl + og : hl - hw, [cx, cz] = loc(it, 0, 0, ox, oz); bx(W, cx, cz, yr - 0.06, 2 * rl, 0.26, 0.16, it.a, rc, A_TILE); }
    if (!it.two) { const rl = Math.max(0, hl - hw);
      for (const [p, q] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) bar(W, P(p * (hl + o * 0.9), q * (hw + o * 0.9), ye + 0.08), P(p * rl, 0, yr + 0.06), 0.08, rc, K.PBR, A_TILE); }
  }
  function emitNear(W, it, ox, oz) {
    const c = Math.cos(it.a), s = Math.sin(it.a), y = it.y;
    switch (it.t) {
      case 'peto': peto(W, it, ox, oz, 1); break;
      case 'teja': teja(W, it, ox, oz, 1); break;
      case 'caseta': {
        const [x, z] = loc(it, 0, 0, ox, oz), side = it.door * (it.w / 2 + 0.02);
        bx(W, x, z, y, it.l, it.w, it.h, it.a, it.col, A_MATTE);
        bx(W, x, z, y + it.h, it.l + 0.25, it.w + 0.25, 0.14, it.a, shade(it.col, 0.85), A_MATTE);           // losa con vuelo
        vq(W, loc(it, it.l * 0.18 - 0.42, side, ox, oz), loc(it, it.l * 0.18 + 0.42, side, ox, oz), y, y + 2.0, it.doorC, A_PAINT);     // puerta
        vq(W, loc(it, -it.l * 0.25 - 0.25, side, ox, oz), loc(it, -it.l * 0.25 + 0.25, side, ox, oz), y + 1.4, y + 1.85, [60, 62, 64], A_LOUV);   // rejilla
        const yt = y + it.h + 0.14, RC = [52, 54, 56];
        if (it.rail) {                                                                                           // barandilla del terrado de la caseta
          const hl = it.l / 2 + 0.05, hw = it.w / 2 + 0.05, Pp = [[-hl, -hw], [hl, -hw], [hl, hw], [-hl, hw]].map(([u, v]) => loc(it, u, v, ox, oz));
          for (let i = 0; i < 4; i++) { const A = Pp[i], B = Pp[(i + 1) % 4];
            post(W, A[0], A[1], yt, yt + 0.95, 0.05, it.a + (i % 2 ? 0 : Math.PI / 2), RC, A_PAINT);
            vq(W, A, B, yt + 0.9, yt + 0.95, RC, A_PAINT); vq(W, A, B, yt + 0.48, yt + 0.51, RC, A_PAINT); }
        }
        if (it.ladder) {                                                                                         // escalera de gato
          const u = -it.l / 2 - 0.08, A = loc(it, u, -0.22, ox, oz), B = loc(it, u, 0.22, ox, oz), LC = [80, 82, 84];
          post(W, A[0], A[1], y, yt + 0.6, 0.04, it.a, LC, A_GALV); post(W, B[0], B[1], y, yt + 0.6, 0.04, it.a, LC, A_GALV);
          for (let q = 0.3; q < it.h; q += 0.3) vq(W, A, B, y + q, y + q + 0.03, LC, A_GALV);
        }
        break; }
      case 'tank': {
        const pitch = it.rad * 2 + 0.3;
        for (let i = 0; i < it.n; i++) { const [x, z] = loc(it, (i - (it.n - 1) / 2) * pitch, 0, ox, oz), y1 = y + it.legs;
          for (const q of [-1, 1]) { const [lx, lz] = loc(it, (i - (it.n - 1) / 2) * pitch, q * it.rad * 0.55, ox, oz); post(W, lx, lz, y, y1, it.rad * 1.3, it.a, [70, 66, 60], A_RUST); }   // patas: dos perfiles
          rev(W, F0, x, z, [[it.rad, y1], [it.rad, y1 + it.h], [0, y1 + it.h + 0.16]], 6, it.col, K.PBR, { aux: it.fib ? A_FIBRO : A_GALV, cap: 2 }); }
        break; }
      case 'ant': {
        const x = it.x - ox, z = it.z - oz, top = y + it.h, MC = [120, 122, 124];
        post(W, x, z, y, top, 0.06, it.a + 0.8, MC, A_GALV);                                                     // mástil
        quad(W, F0, x, y + 1.2, z, x + 0.9, y, z + 0.3, x + 0.9, y + 0.02, z + 0.3, x, y + 1.22, z, [90, 90, 90], K.PBR, A_GALV);   // viento
        for (let i = 0; i < Math.min(it.nd, 3); i++) { const yy = top - 0.25 - i * 0.6, L = 1.7 - i * 0.3;
          // boom y elementos como cintas planas (2 triángulos cada uno: se leen desde arriba, que es desde donde se ven)
          const rib = (ax, az, bx_, bz, hw) => { const dx = bx_ - ax, dz = bz - az, l = Math.hypot(dx, dz) || 1, px = -dz / l * hw, pz = dx / l * hw;
            quad(W, F0, ax + px, yy, az + pz, bx_ + px, yy, bz + pz, bx_ - px, yy, bz - pz, ax - px, yy, az - pz, [130, 132, 134], K.PBR, A_GALV); };
          rib(x - c * L / 2, z - s * L / 2, x + c * L / 2, z + s * L / 2, 0.025);
          for (let e = 0; e < 3; e++) { const t = (e / 2 - 0.5) * L, ex = x + c * t, ez = z + s * t, hl = 0.36 - e * 0.06;
            rib(ex + s * hl, ez - c * hl, ex - s * hl, ez + c * hl, 0.012); } }
        if (it.pilot) rev(W, F0, x, z, [[0, top], [0.07, top + 0.03], [0.07, top + 0.1], [0, top + 0.14]], 5, [255, 40, 30], K.PBR, { aux: A_PILOT });
        break; }
      case 'dish': {
        const x = it.x - ox, z = it.z - oz, hy = y + 1.1, r = it.rad;
        post(W, x, z, y, hy, 0.06, it.a + 1.57, [200, 200, 198], A_PAINT);
        const nx = Math.cos(it.a) * 0.82, ny = 0.57, nz = Math.sin(it.a) * 0.82;
        const ux = -Math.sin(it.a), uz = Math.cos(it.a), vx = -ny * Math.cos(it.a), vy = 0.82, vz = -ny * Math.sin(it.a);
        const cx = x + nx * 0.1, cy = hy + 0.05, cz = z + nz * 0.1, NS = 8;
        for (let i = 0; i < NS; i++) {                 // un solo casquete (el shader voltea la normal plana si se ve por detrás)
          const a0 = i / NS * Math.PI * 2, a1 = (i + 1) / NS * Math.PI * 2, Pp = [];
          for (const aa of [a0, a1]) Pp.push([cx + (ux * Math.cos(aa) + vx * Math.sin(aa)) * r - nx * 0.08, cy + vy * Math.sin(aa) * r - ny * 0.08, cz + (uz * Math.cos(aa) + vz * Math.sin(aa)) * r - nz * 0.08]);
          quad(W, F0, cx + nx * 0.02, cy + ny * 0.02, cz + nz * 0.02, ...Pp[0], ...Pp[1], cx + nx * 0.02, cy + ny * 0.02, cz + nz * 0.02, [222, 222, 218], K.PBR, A_PAINT);
        }
        break; }
      case 'cloth': {
        const L = it.l, hP = 1.75, PC = [150, 150, 146];
        for (const e of [-1, 1]) { const [x, z] = loc(it, e * L / 2, 0, ox, oz);
          post(W, x, z, y, y + hP, 0.06, it.a, PC, A_GALV);
          vq(W, loc(it, e * L / 2, -0.6, ox, oz), loc(it, e * L / 2, 0.6, ox, oz), y + hP - 0.04, y + hP, PC, A_GALV); }
        for (let q = 0; q < 3; q++) { const v = -0.5 + q * 0.5;
          vq(W, loc(it, -L / 2, v, ox, oz), loc(it, L / 2, v, ox, oz), y + hP - 0.05, y + hP - 0.035, [220, 220, 214], A_MATTE);
          for (let i = 0; i < 4; i++) { const cl = it.cl[q * 4 + i]; if (!cl[0]) continue;
            const u = -L / 2 + (i + 0.5) * L / 4, hw = Math.min(L / 4 - 0.06, 0.35 + cl[3] * 0.4) / 2;
            vq(W, loc(it, u - hw, v, ox, oz), loc(it, u + hw, v, ox, oz), y + hP - 0.05 - cl[2], y + hP - 0.05, cl[1], A_CLOTH); } }
        break; }
      case 'ac': {
        for (let i = 0; i < it.n; i++) { const u = (i - (it.n - 1) / 2) * 0.95, [x, z] = loc(it, u, 0, ox, oz);
          bx(W, x, z, y + 0.08, 0.82, 0.32, 0.56, it.a, it.col, A_PAINT);
          vq(W, loc(it, u + 0.12 - 0.21, 0.167, ox, oz), loc(it, u + 0.12 + 0.21, 0.167, ox, oz), y + 0.15, y + 0.57, [58, 60, 62], A_LOUV); }   // rejilla del ventilador
        break; }
      case 'sky': {
        const [x, z] = loc(it, 0, 0, ox, oz);
        bx(W, x, z, y, it.s, it.w, 0.4, it.a, [200, 198, 192], A_MATTE);
        if (it.pit) { const hl = it.s / 2 - 0.05, hw = it.w / 2 - 0.05, yb = y + 0.4, yr = yb + Math.min(hw, 0.6) * 0.7;
          const Pp = (u, v, yy) => { const [px, pz] = loc(it, u, v, ox, oz); return [px, yy, pz]; };
          quad(W, F0, ...Pp(-hl, -hw, yb), ...Pp(hl, -hw, yb), ...Pp(hl, 0, yr), ...Pp(-hl, 0, yr), [96, 120, 132], K.PBR, A_GLASS);
          quad(W, F0, ...Pp(-hl, hw, yb), ...Pp(hl, hw, yb), ...Pp(hl, 0, yr), ...Pp(-hl, 0, yr), [96, 120, 132], K.PBR, A_GLASS);
        } else { const hl = it.s / 2 - 0.06, hw = it.w / 2 - 0.06, Pp = (u, v) => { const [px, pz] = loc(it, u, v, ox, oz); return [px, y + 0.46, pz]; };
          quad(W, F0, ...Pp(-hl, -hw), ...Pp(hl, -hw), ...Pp(hl, hw), ...Pp(-hl, hw), [110, 130, 140], K.PBR, A_GLASS); }
        break; }
      case 'vent': {
        for (let i = 0; i < it.n; i++) { const [x, z] = loc(it, (i - (it.n - 1) / 2) * 0.6, 0, ox, oz), h = it.h * (0.8 + 0.4 * it.hs[i % 6]);
          if (it.metal) { cyl(W, x, z, y, y + h, 0.11, 0.11, 5, [170, 172, 170], K.PBR, A_GALV); cyl(W, x, z, y + h + 0.06, y + h + 0.2, 0.2, 0.04, 5, [150, 152, 150], K.PBR, A_GALV); }
          else { bx(W, x, z, y, 0.42, 0.42, h, it.a, it.col, A_MATTE); const Pp = (u, v) => { const [px, pz] = loc(it, (i - (it.n - 1) / 2) * 0.6 + u, v, ox, oz); return [px, y + h + 0.14, pz]; };
            quad(W, F0, ...Pp(-0.29, -0.29), ...Pp(0.29, -0.29), ...Pp(0.29, 0.29), ...Pp(-0.29, 0.29), shade(it.col, 0.85), K.PBR, A_MATTE); } }   // sombrerete
        break; }
      case 'perg': {
        const hl = it.l / 2, hw = it.w / 2, hP = 2.3, wc = it.wood ? [128, 92, 60] : [64, 66, 68], A = it.wood ? A_MATTE : A_PAINT;
        for (const [p, q] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const [px, pz] = loc(it, p * hl, q * hw, ox, oz); post(W, px, pz, y, y + hP, 0.1, it.a, wc, A); }
        for (const q of [-1, 1]) vq(W, loc(it, -hl - 0.2, q * hw, ox, oz), loc(it, hl + 0.2, q * hw, ox, oz), y + hP - 0.12, y + hP + 0.04, wc, A);
        const Pp = (u, v, yy) => { const [px, pz] = loc(it, u, v, ox, oz); return [px, yy, pz]; };
        if (it.awn) quad(W, F0, ...Pp(-hl, -hw - 0.3, y + hP + 0.04), ...Pp(hl, -hw - 0.3, y + hP + 0.04), ...Pp(hl, hw + 0.3, y + hP + 0.18), ...Pp(-hl, hw + 0.3, y + hP + 0.18), it.awn, K.PBR, A_CLOTH);
        else { const ns = Math.max(4, Math.round(it.l / 0.45));
          for (let i = 0; i <= ns; i++) { const u = -hl + it.l * i / ns; vq(W, loc(it, u, -hw - 0.25, ox, oz), loc(it, u, hw + 0.25, ox, oz), y + hP + 0.04, y + hP + 0.14, wc, A); } }
        // mesa y sillas, y jardineras al pie
        { const [tx, tz] = loc(it, 0, 0, ox, oz); bx(W, tx, tz, y + 0.66, 1.2, 0.75, 0.04, it.a, [230, 228, 222], A_PAINT); post(W, tx, tz, y, y + 0.68, 0.06, it.a, [60, 60, 62], A_PAINT);
          for (const p of [-1, 1]) { const [sx, sz] = loc(it, p * 0.95, 0, ox, oz); bx(W, sx, sz, y, 0.42, 0.42, 0.45, it.a, [200, 200, 196], A_PAINT); } }
        plants(W, it, ox, oz, it.l, hw + 0.45, Math.max(2, Math.round(it.l / 0.8)));
        break; }
      case 'plant': plants(W, it, ox, oz, it.l, 0, Math.max(2, Math.round(it.l / 0.7))); break;
      case 'shed': { const [x, z] = loc(it, 0, 0, ox, oz);
        bx(W, x, z, y, it.l, it.w, 1.9, it.a, it.col, A_GALV); bx(W, x, z, y + 1.9, it.l + 0.1, it.w + 0.1, 0.06, it.a, shade(it.col, 0.8), A_GALV); break; }
      case 'pv': {
        for (let rw = 0; rw < it.rows; rw++) for (let i = 0; i < it.n; i++) {
          const [x, z] = loc(it, (i - (it.n - 1) / 2) * 1.05, (rw - (it.rows - 1) / 2) * 2.4, ox, oz);
          // panel de 1 × 1,7 m inclinado 30° hacia el sur (−z del mundo, ≈ el mar), sobre un bastidor (un paño trasero)
          const hw = 0.5, hd = 0.85, ylo = y + 0.25, yhi = y + 0.25 + 2 * hd * 0.5;
          const Pp = (u, v, yy) => [x + c * u, yy, z + s * u + v];
          quad(W, F0, ...Pp(-hw, -hd * 0.87, ylo), ...Pp(hw, -hd * 0.87, ylo), ...Pp(hw, hd * 0.87, yhi), ...Pp(-hw, hd * 0.87, yhi), [34, 44, 74], K.PBR, A_PV);
          quad(W, F0, ...Pp(-hw, hd * 0.87, y), ...Pp(hw, hd * 0.87, y), ...Pp(hw, hd * 0.87, yhi), ...Pp(-hw, hd * 0.87, yhi), [150, 152, 154], K.PBR, A_GALV);
        }
        break; }
    }
  }
  // nivel 2: cajas de todo lo que tiene bulto, el peto (cara interior) y la ropa como paños; nivel 3: casetas, depósitos,
  // pérgolas y tejados
  function emitFar(W, it, ox, oz, lvl) {
    const y = it.y, [x, z] = it.t === 'peto' ? [0, 0] : loc(it, 0, 0, ox, oz);
    switch (it.t) {
      case 'teja': teja(W, it, ox, oz, lvl); break;
      case 'caseta': bx(W, x, z, y, it.l, it.w, it.h + 0.14, it.a, it.col, A_MATTE); break;
      case 'tank': bx(W, x, z, y, it.n * (it.rad * 2 + 0.3) - 0.3, it.rad * 1.8, it.legs + it.h, it.a, it.col, A_FIBRO); break;
      case 'perg': bx(W, x, z, y + 2.25, it.l + 0.4, it.w + 0.5, 0.12, it.a, it.awn || (it.wood ? [128, 92, 60] : [64, 66, 68]), it.awn ? A_CLOTH : A_MATTE);
        if (lvl === 2) { const [px, pz] = loc(it, 0, it.w / 2 + 0.45, ox, oz); bx(W, px, pz, y, it.l, 0.5, 0.8, it.a, GREEN[0], A_MATTE); } break;
      default: if (lvl !== 2) break;
        if (it.t === 'peto') { if (it.L > 1.2) peto(W, it, ox, oz, 2); }
        else if (it.t === 'ac') bx(W, x, z, y, it.n * 0.95 - 0.1, 0.34, 0.66, it.a, it.col, A_PAINT);
        else if (it.t === 'pv') bx(W, x, z, y + 0.2, it.n * 1.05, it.rows * 2.4 - 0.6, 0.55, it.a, [44, 52, 78], A_PV);
        else if (it.t === 'sky') bx(W, x, z, y, it.s, it.w, 0.5, it.a, [150, 160, 166], A_MATTE);
        else if (it.t === 'vent') bx(W, x, z, y, it.n * 0.6 - 0.15, 0.45, it.h + 0.15, it.a, it.metal ? [170, 172, 170] : it.col, A_MATTE);
        else if (it.t === 'shed') bx(W, x, z, y, it.l, it.w, 1.95, it.a, it.col, A_GALV);
        else if (it.t === 'plant') bx(W, x, z, y, it.l, 0.5, 0.8, it.a, GREEN[1], A_MATTE);
        else if (it.t === 'cloth') { for (let q = 0; q < 3; q++) { const cl = it.cl[q * 4 + (q % 4)], v = -0.5 + q * 0.5;
          vq(W, loc(it, -it.l * 0.42, v, ox, oz), loc(it, it.l * 0.42, v, ox, oz), y + 1.1, y + 1.7, cl[1], A_CLOTH); } }
    }
  }

  // ---------------------------------------------------------------- celdas
  const plans = new Map();                           // b → plan (o null); se vacía si crece mucho
  function planOf(b) { let p = plans.get(b); if (p === undefined) { if (plans.size > 20000) plans.clear(); p = plan(b); plans.set(b, p); } return p; }
  const cells = new Map();                           // ci*4 + nivel → { lvl, mesh, tris, n }
  let want = new Map(), queue = [], lastP = null, tris = [0, 0, 0], nItems = 0;
  const byT = {};                                    // triángulos del nivel 1 por tipo de elemento (para medir)
  function build(ci, lvl) {
    const ox = (ci % NX) * CS, oz = ((ci / NX) | 0) * CS, W = new GB(ox, oz);
    let n = 0; const bt = {};
    for (let k = ALL.start[ci]; k < ALL.start[ci + 1]; k++) {
      const b = ALL.list[k], cx = (city.BB[b * 4] + city.BB[b * 4 + 2]) / 2, cz = (city.BB[b * 4 + 1] + city.BB[b * 4 + 3]) / 2;
      if (city.cellOf(cx, cz) !== ci) continue;      // cada edificio, solo en la celda de su centro
      const p = planOf(b); if (!p) continue;
      for (const it of p) { const i0 = W.ni;
        if (lvl === 1) { emitNear(W, it, ox, oz); bt[it.t] = (bt[it.t] || 0) + (W.ni - i0) / 3; } else emitFar(W, it, ox, oz, lvl);
        n++; }
    }
    const key = ci * 4 + lvl, old = cells.get(key); if (old) drop(key, old);
    const mesh = W.nv ? reg(detail.mkMesh(W, matR, 'r' + lvl + '_' + ci), lvl === 1 ? { cast: true, layer: 'furn' } : { cast: false, layer: 'roof' }) : null;
    if (mesh) mesh.metadata.rf = BAND[lvl];
    const t = W.ni / 3; tris[lvl - 1] += t; nItems += n;
    for (const k in bt) byT[k] = (byT[k] || 0) + bt[k];
    cells.set(key, { lvl, mesh, tris: t, n, bt });
  }
  function drop(key, c) { if (c.mesh) c.mesh.dispose(false, false); tris[c.lvl - 1] -= c.tris; nItems -= c.n; for (const k in c.bt) byT[k] -= c.bt[k]; cells.delete(key); }
  // niveles deseados alrededor de la cámara: los que la celda puede necesitar según su distancia 3D mínima y máxima (con las
  // cubiertas entre el suelo de la celda + 3 m y + 75 m); histéresis HY para no tirar y rehacer en el borde
  function plan2(P) {
    want = new Map();
    const R3 = BAND[3][3] + HY;
    const i0 = Math.max(0, Math.floor((P.x - R3) / CS)), i1 = Math.min(NX - 1, Math.floor((P.x + R3) / CS));
    const j0 = Math.max(0, Math.floor((P.z - R3) / CS)), j1 = Math.min(NZ - 1, Math.floor((P.z + R3) / CS));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const ci = j * NX + i; if (ALL.start[ci] === ALL.start[ci + 1]) continue;
      const xa = i * CS, xb = xa + CS, za = j * CS, zb = za + CS;
      const dx = Math.max(xa - P.x, P.x - xb, 0), dz = Math.max(za - P.z, P.z - zb, 0);
      const Dx = Math.max(Math.abs(P.x - xa), Math.abs(P.x - xb)), Dz = Math.max(Math.abs(P.z - za), Math.abs(P.z - zb));
      const hg = ctx.heightAt ? ctx.heightAt(xa + CS / 2, za + CS / 2) || 0 : 0, ya = hg + 3, yb = hg + 75;
      const dy = Math.max(ya - P.y, P.y - yb, 0), Dy = Math.max(Math.abs(P.y - ya), Math.abs(P.y - yb));
      const dmin = Math.hypot(dx, dz, dy), dmax = Math.hypot(Dx, Dz, Dy);
      for (let l = 1; l <= 3; l++) { const B = BAND[l], h = cells.has(ci * 4 + l) ? HY : 0;
        if (dmin < B[3] + h && dmax > B[0] - h) want.set(ci * 4 + l, l); }
    }
    for (const [key, c] of cells) if (!want.has(key)) drop(key, c);
    queue = [];
    for (const key of want.keys()) if (!cells.has(key)) queue.push(key);
    // primero lo cercano
    const dk = key => { const ci = key >> 2; return (key & 3) * 1e5 + Math.hypot((ci % NX + 0.5) * CS - P.x, (((ci / NX) | 0) + 0.5) * CS - P.z); };
    queue.sort((a, b) => dk(a) - dk(b));
  }
  function work(P, ms) {
    if (!lastP || Math.abs(P.x - lastP[0]) + Math.abs(P.z - lastP[2]) + Math.abs(P.y - lastP[1]) > 12) { lastP = [P.x, P.y, P.z]; plan2(P); }
    const t0 = performance.now();
    while (queue.length && performance.now() - t0 < ms) { const key = queue.shift(), l = want.get(key); if (l) build(key >> 2, l); }
  }
  return {
    update(P) { work(P, 3); },
    busy: () => queue.length > 0,
    flush(P) { lastP = null; work(P, 1e9); },
    stats: () => { const near = {}; for (const k in byT) if (byT[k]) near[k] = Math.round(byT[k]);
      return { cells: cells.size, items: nItems, trisNear: tris[0], trisMid: tris[1], trisFar: tris[2], tris: tris[0] + tris[1] + tris[2], queue: queue.length, near }; },
  };
} };
})();
