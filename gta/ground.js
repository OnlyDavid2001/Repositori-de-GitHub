/* GTA Barcelona — Suelo: detalle cercano del asfalto y marcas viales (hook de app.js y de streets.js).
   · roadGLSL: bloque GLSL que app.js inserta en el shader de calzada (FS_ROAD) para el asfalto visto de cerca;
   · decals(cell): pasos de cebra en los extremos de tramo que llegan a un cruce (van a la malla de mobiliario, cell.W).
   window.BCN_GROUND = { roadGLSL, init(ctx) → { decals(cell) } }. Contrato de cell/seg: DESARROLLO.md §6.
   Tipos de material propios: ids 80–99, con BCN_GEO.regKind() al cargar el script. */
(function () {
'use strict';
const { K, quad, F0 } = window.BCN_GEO;

const ZEBRA = new Set([2, 3, 4, 5, 6]);                     // clases de calle con pasos de cebra

// ------------------------------------------------------------------ asfalto de cerca (cuerpo de «if (near > 0.0 && car) { … }» en FS_ROAD)
// Entradas (solo lectura):
//   P      vec2   posición xz en metros respecto a uOrg (origen cercano a la cámara): úsala para texturas y ruido
//   x, hw  float  metros desde el eje de la calle (con signo) y semiancho de la calzada
//   v, au  float  metros a lo largo de la calle y |x|/hw
//   cls    float  clase de vía · dist: distancia a la cámara · fade: 1 cerca → 0 a 1,4 km
//   near   float  1 cerca → 0 a 480 m (ya multiplicado por uAsph: vale 0 si no hay texturas de asfalto)
//   vCol.rgb      color base de la calzada · tAsD, tAsN: asfalto fotografiado (difuso y normal) · utilidades del preludio
// Salidas:
//   alb    vec3   albedo: mézclalo con «near» para que el detalle entre poco a poco
//   N      vec3   normal de sombreado (llega como +Y)
//   mk     float  máscara de pintura vial ya calculada: aquí solo se desgasta
// Ojo: nada de «;» dentro de un comentario «//» que vaya detrás de código (Babylon parte las líneas por «;»).
const roadGLSL = `
    // asfalto fotografiado de Transeúnte, con mezcla de dos escalas para que no se repita
    float gB = smoothstep(0.42, 0.62, vnoise(P*0.02));
    vec3 t1 = texture2D(tAsD, P/6.0).rgb, t2 = texture2D(tAsD, P.yx*(0.73/6.0) + vec2(0.31, 0.17)).rgb;
    vec3 tx = mix(t1, t2, gB);
    float lum = dot(tx, vec3(0.3, 0.6, 0.1));
    vec3 asf = vCol.rgb*0.8*mix(0.7, 1.22, smoothstep(0.12, 0.5, lum))*mix(0.9, 1.06, vnoise(P*0.025));
    // parches de reparación y zonas más nuevas
    vec2 pc = floor(P/vec2(4.8, 9.6)); float ph = hash21(pc + 0.5);
    vec2 pf = fract(P/vec2(4.8, 9.6));
    float rpatch = step(0.88, ph)*step(0.15, pf.x)*step(pf.x, 0.85)*step(0.1, pf.y)*step(pf.y, 0.8);
    asf *= mix(1.0, 0.72 + 0.1*ph, rpatch);
    // rodadas: más oscuras en el centro de cada carril
    float lane = abs(fract((x + hw)/3.3) - 0.5);
    asf *= mix(1.0, 0.9, smoothstep(0.32, 0.05, lane)*(0.5 + 0.5*vnoise(P*0.3)));
    // G1S2 · tapas y rejillas, sin patrón fijo: cada 26 m de calle, una tapa redonda de fundición (60 cm, con su marco y
    // un anillo de mortero alrededor) en el centro de un carril elegido al azar, o ninguna. Alguna arqueta rectangular
    // junto al bordillo y los imbornales (rejilla de 90 x 35 cm con barras de través) a un lado u otro cada 18 a 30 m.
    float pq = length(fwidth(P)), dk = 1.0 - smoothstep(0.02, 0.08, pq);
    float bi = floor(v/26.0), hb = hash21(vec2(bi, 3.1)), nl = max(1.0, floor(2.0*hw/3.3 + 0.5));
    float lx = -hw + (floor(hash21(vec2(bi, 7.7))*nl) + 0.5)*(2.0*hw/nl);
    vec2 md = vec2(v - (bi + 0.2 + 0.6*hb)*26.0, x - lx);
    float mh = length(md)*step(hash21(vec2(bi, 1.9)), 0.62)*step(2.5, hw) + step(0.62, hash21(vec2(bi, 1.9)))*9.0 + step(hw, 2.5)*9.0;
    float mortar = 1.0 - smoothstep(0.40, 0.43, mh), frame = smoothstep(0.27, 0.285, mh)*(1.0 - smoothstep(0.315, 0.33, mh));
    float disc = 1.0 - smoothstep(0.27, 0.285, mh);
    float ang = atan(md.y, md.x), pat = step(0.5, fract(mh*14.0))*0.5 + step(0.5, fract(ang*3.8197))*0.5*step(0.09, mh);
    vec3 iron = vec3(0.16, 0.155, 0.15)*(0.85 + 0.3*pat*dk + 0.15*vnoise(P*9.0));
    asf = mix(asf, asf*vec3(1.35, 1.32, 1.25), mortar*(1.0 - disc - frame)*0.8*dk);
    asf = mix(asf, iron, disc*(1.0 - frame));
    asf = mix(asf, vec3(0.30, 0.29, 0.27), frame);
    // arqueta rectangular de registro (90 x 60 cm) junto al bordillo, una de cada pocas manzanas
    float bj = floor(v/41.0), sj = hash21(vec2(bj, 5.3)) > 0.5 ? 1.0 : -1.0;
    vec2 rq = vec2(v - (bj + 0.3 + 0.4*hash21(vec2(bj, 2.2)))*41.0, x*sj - (hw - 1.1));
    float arq = step(abs(rq.x), 0.45)*step(abs(rq.y), 0.30)*step(hash21(vec2(bj, 9.4)), 0.35)*step(3.0, hw);
    float arqF = arq*(1.0 - step(abs(rq.x), 0.40)*step(abs(rq.y), 0.25));
    asf = mix(asf, vec3(0.19, 0.185, 0.18)*(0.85 + 0.25*step(0.5, fract(rq.x*10.0 + 0.25))*step(0.5, fract(rq.y*10.0 + 0.25))*dk + 0.1*vnoise(P*7.0)), arq);
    asf = mix(asf, vec3(0.32, 0.31, 0.29), arqF);
    // imbornales junto a los dos bordillos, con la mancha de humedad que dejan aguas abajo
    float lenD = 18.0 + 12.0*hash21(vec2(floor(v/30.0), 4.4)), sd = x > 0.0 ? 1.0 : -1.0;
    float bk = floor((v + sd*7.0)/lenD);
    vec2 dg = vec2(v + sd*7.0 - (bk + 0.5)*lenD, abs(x) - (hw - 0.22));
    float on = step(hash21(vec2(bk, sd + 6.0)), 0.8)*step(2.5, hw);
    float drain = step(abs(dg.x), 0.45)*step(abs(dg.y), 0.17)*on;
    float dframe = drain*(1.0 - step(abs(dg.x), 0.40)*step(abs(dg.y), 0.13));
    float bars = smoothstep(0.35, 0.65, fract(dg.x*12.0))*dk;
    float wet = on*(1.0 - smoothstep(0.0, 0.5, abs(dg.y) - 0.1))*smoothstep(0.4, 0.6, dg.x)*(1.0 - smoothstep(0.6, 3.5, dg.x))*0.35;
    asf *= 1.0 - wet*(0.5 + 0.5*vnoise(P*3.0));
    asf = mix(asf, vec3(0.03, 0.03, 0.035) + bars*vec3(0.14, 0.135, 0.13), drain);
    asf = mix(asf, vec3(0.24, 0.23, 0.22), dframe);
    alb = mix(alb, asf, near);
    vec3 tn = mix(texture2D(tAsN, P/6.0).xyz, texture2D(tAsN, P.yx*(0.73/6.0) + vec2(0.31, 0.17)).xyz, gB)*2.0 - 1.0;
    N = normalize(vec3(tn.x, 1.0, tn.y)*vec3(near*0.9, 1.0, near*0.9));
    // pintura gastada
    mk *= mix(1.0, smoothstep(0.2, 0.55, vnoise(P*0.9)*0.6 + vnoise(P*4.3)*0.4), near);
`;

window.BCN_GROUND = { roadGLSL, init(ctx) {
  // G1S2 · marcas viales coherentes en cada cruce. Para cada boca de cruce (extremo de tramo que llega a un punto
  // compartido por 3 o más tramos con calzada) se calcula una sola vez, con datos globales (sale igual desde cualquier
  // celda), dónde acaba la calzada transversal (aMin: primer punto del eje desde el que la boca entera queda fuera de las
  // demás calzadas del cruce) y, si hay edificios, dónde empieza la esquina o el xamfrà. Con eso:
  //   · paso de cebra de 4 m de bandas de 50 cm, alineado con el paso real: justo tras la calzada transversal, o al empezar
  //     el xamfrà en el Eixample; solo en las bocas, nunca dentro del cruce ni sobre otra calzada;
  //   · línea de detención (40 cm) antes del paso: en toda la anchura si la calle es de sentido único (calles de hasta
  //     13 m de calzada de las clases 4–6), en la mitad de entrada si es de doble sentido;
  //   · flechas por carril en las entradas de doble sentido anchas, según las salidas que de verdad tiene el cruce;
  //   · líneas de carril discontinuas en las calles de 2 o más carriles de las clases 5 y 6 (las demás las pinta el shader),
  //     cortadas antes de cada paso de cebra;
  //   · rotondas (anillo con radio de 6 a 140 m que se cierra alrededor de la boca): en las entradas, dientes de ceda el
  //     paso y el paso de cebra retrasado 5 m; en el anillo, ni pasos ni detenciones.
  const { SEG } = ctx, C = ctx.city, { roadY, ROADS, CAR, coverAt, cellOf } = C;
  const WHITE = [222, 222, 214];
  const ends = new Map();                                     // s*2+e → datos de la boca (o null si ese extremo no es cruce)
  const segD = (s2, x, z) => { const o = s2 * 6, ax = SEG[o], az = SEG[o + 1], dx = SEG[o + 2] - ax, dz = SEG[o + 3] - az, l2 = dx * dx + dz * dz;
    let t = l2 > 0 ? ((x - ax) * dx + (z - az) * dz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; return Math.hypot(x - ax - dx * t, z - az - dz * t); };
  const kJ = (x, z) => Math.round(x * 2) * 100000 + Math.round(z * 2);
  // tramos con calzada que tienen un extremo en (jx, jz), con su dirección de salida
  function legsAt(jx, jz) {
    const out = [], k = kJ(jx, jz), c = cellOf(jx, jz);
    for (let q = ROADS.start[c]; q < ROADS.start[c + 1]; q++) { const s2 = ROADS.list[q], o = s2 * 6; if (!CAR.has(SEG[o + 5])) continue;
      const L = Math.hypot(SEG[o + 2] - SEG[o], SEG[o + 3] - SEG[o + 1]); if (L < 0.5) continue;
      if (kJ(SEG[o], SEG[o + 1]) === k) out.push({ s: s2, ux: (SEG[o + 2] - SEG[o]) / L, uz: (SEG[o + 3] - SEG[o + 1]) / L, L, hw: SEG[o + 4], cls: SEG[o + 5] });
      else if (kJ(SEG[o + 2], SEG[o + 3]) === k) out.push({ s: s2, ux: (SEG[o] - SEG[o + 2]) / L, uz: (SEG[o + 1] - SEG[o + 3]) / L, L, hw: SEG[o + 4], cls: SEG[o + 5] }); }
    return out;
  }
  // ¿no hay ninguna calzada a menos de r de (x, z)?
  function islandAt(x, z, r) { const c = cellOf(x, z);
    for (let q = ROADS.start[c]; q < ROADS.start[c + 1]; q++) { const s2 = ROADS.list[q]; if (CAR.has(SEG[s2 * 6 + 5]) && segD(s2, x, z) < SEG[s2 * 6 + 4] + r) return false; }
    return true; }
  // ¿hay calzada en casi todo el círculo de radio R alrededor de (cx, cz)? (una rotonda de verdad; descarta los cruces junto
  // a un jardín, que también tienen isleta en medio pero no anillo)
  function ringClosed(cx, cz, R) { let n = 0;
    for (let k = 0; k < 16; k++) { const t = k * Math.PI / 8, x = cx + Math.cos(t) * R, z = cz + Math.sin(t) * R, c = cellOf(x, z);
      for (let q = ROADS.start[c]; q < ROADS.start[c + 1]; q++) { const s2 = ROADS.list[q]; if (CAR.has(SEG[s2 * 6 + 5]) && segD(s2, x, z) < SEG[s2 * 6 + 4] + Math.max(2, R * 0.15)) { n++; break; } } }
    return n >= 13; }
  // ¿el punto cae sobre otra calzada que no es la de este tramo ni su continuación? (cruces vecinos, calzadas dobles, laterales)
  function blocked(s, x, z, skip) { const c = cellOf(x, z), o = s * 6;
    for (let q = ROADS.start[c]; q < ROADS.start[c + 1]; q++) { const s2 = ROADS.list[q]; if (s2 === s || skip && skip.indexOf(s2) >= 0) continue; const o2 = s2 * 6; if (!CAR.has(SEG[o2 + 5])) continue;
      if (segD(s2, x, z) > SEG[o2 + 4] - 0.2) continue;
      const shared = [0, 2].some(e => [0, 2].some(f => Math.abs(SEG[o + e] - SEG[o2 + f]) < 0.3 && Math.abs(SEG[o + e + 1] - SEG[o2 + f + 1]) < 0.3));
      if (shared) { const d1x = SEG[o + 2] - SEG[o], d1z = SEG[o + 3] - SEG[o + 1], d2x = SEG[o2 + 2] - SEG[o2], d2z = SEG[o2 + 3] - SEG[o2 + 1];
        if (Math.abs(d1x * d2x + d1z * d2z) / ((Math.hypot(d1x, d1z) * Math.hypot(d2x, d2z)) || 1) > 0.9) continue; }
      return true; }
    return false; }
  const freeRect = (s, info, a0, a1, b0, b1) => { for (const [a, b] of [[a0, b0], [a1, b0], [a1, b1], [a0, b1], [(a0 + a1) / 2, (b0 + b1) / 2]])
    if (blocked(s, info.jx + info.ux * a + info.qx * b, info.jz + info.uz * a + info.qz * b, info.chain)) return false; return true; };
  function endInfo(s, e) {
    const key = s * 2 + (e ? 1 : 0); if (ends.has(key)) return ends.get(key);
    const o = s * 6, jx = SEG[o + (e ? 2 : 0)], jz = SEG[o + (e ? 3 : 1)], legs = legsAt(jx, jz);
    let r = null;
    if (legs.length >= 3) {
      const me = legs.find(l => l.s === s) || legs[0], { ux, uz, hw } = me, qx = -uz, qz = ux;   // q: izquierda de la salida = carril de entrada
      const oth = legs.filter(l => l.s !== s && l.ux * ux + l.uz * uz > -0.94);                  // sin la continuación recta
      const inside = (x, z) => { for (const l of oth) if (segD(l.s, x, z) < l.hw + 0.6) return true; return false; };
      let aMin = -1;
      for (let a = 0.5; a <= 45; a += 0.5) { let ok = true;
        for (const b of [-hw, -hw * 0.5, 0, hw * 0.5, hw]) if (inside(jx + ux * a + qx * b, jz + uz * a + qz * b)) { ok = false; break; }
        if (ok) { aMin = a; break; } }
      if (aMin >= 0) {
        // esquina o xamfrà: primer edificio a 6,5 m del bordillo, a un lado o al otro
        let dB = 1e9;
        if (coverAt) for (const sd of [-1, 1]) for (let a = aMin; a < aMin + 18; a += 1) {
          if (coverAt(jx + ux * a + qx * sd * (hw + 6.5), jz + uz * a + qz * sd * (hw + 6.5), -1) > -1e8) { dB = Math.min(dB, a); break; } }
        // rotonda: dos ramas casi opuestas y de través respecto a esta boca, en un anillo que se cierra alrededor de ella
        // rotonda: el cruce está en un lazo corto de calzada que gira siempre al mismo lado y sin quiebros fuertes (en
        // cualquier forma, también ovalada); si no, el método del circuncentro (anillos que OSM no cierra en el recorte)
        const lp = loopAt(jx, jz, legs);
        let ring = lp && !lp.segs.has(s) ? { a: lp.a, b: lp.b, R: lp.R } : null;
        if (!lp) for (let i = 0; i < legs.length && !ring; i++) for (let k = i + 1; k < legs.length && !ring; k++) {
          const A = legs[i], B = legs[k]; if (A.s === s || B.s === s) continue;
          if (A.ux * B.ux + A.uz * B.uz > -0.3 || Math.abs(A.ux * ux + A.uz * uz) > 0.7 || Math.abs(B.ux * ux + B.uz * uz) > 0.7) continue;
          const la = Math.min(A.L, 40), lb = Math.min(B.L, 40), x1 = A.ux * la, z1 = A.uz * la, x2 = B.ux * lb, z2 = B.uz * lb;   // circuncentro de (0,0), P1, P2
          const d = 2 * (x1 * z2 - z1 * x2); if (Math.abs(d) < 1e-3) continue;
          const n1 = x1 * x1 + z1 * z1, n2 = x2 * x2 + z2 * z2, cx = (n1 * z2 - n2 * z1) / d, cz = (n2 * x1 - n1 * x2) / d, R = Math.hypot(cx, cz);
          // y en el centro, una isleta: ni edificio ni calzada a menos de 0,4 R (descarta los cruces enrevesados de las laterales)
          const wx = jx + cx, wz = jz + cz;
          if (R > 8 && R < 140 && -(cx * ux + cz * uz) / R > 0.75 && !(coverAt && coverAt(wx, wz, -1) > -1e8) && islandAt(wx, wz, Math.max(3, R * 0.4)) && ringClosed(wx, wz, R)) ring = { a: A.s, b: B.s, R };
        }
        // continuación recta del tramo más allá de su otro extremo (los tramos son trozos de polilínea: a veces de pocos
        // metros), para que el paso de cebra y la detención quepan aunque el primer trozo sea corto
        const chain = []; let len = 0, cur = s, cux = ux, cuz = uz, ce = e ? 0 : 1;
        for (let k = 0; k < 4 && len < 40; k++) { const oc = cur * 6, fx = SEG[oc + ce * 2], fz = SEG[oc + ce * 2 + 1], lg = legsAt(fx, fz);
          if (lg.length !== 2) break; const nx = lg.find(l => l.s !== cur); if (!nx || nx.ux * cux + nx.uz * cuz < 0.8 || nx.hw < hw - 0.6) break;
          chain.push(nx.s); len += nx.L; cur = nx.s; cux = nx.ux; cuz = nx.uz; ce = kJ(SEG[cur * 6], SEG[cur * 6 + 1]) === kJ(fx, fz) ? 1 : 0; }
        r = { jx, jz, ux, uz, qx, qz, hw, aMin, dB, legs, ring, oth, chain, ext: len };
      }
    }
    ends.set(key, r); return r;
  }
  // lazos de rotonda por cruce (caché) y el conjunto de tramos que son anillo
  const loops = new Map(), ringSegs = new Set();
  function loopAt(jx, jz, legs) {
    const k0 = kJ(jx, jz); if (loops.has(k0)) return loops.get(k0);
    let res = null;
    for (const l0 of legs) {
      const segs = new Set([l0.s]); let cur = l0.s, dx = l0.ux, dz = l0.uz, len = l0.L, turn = 0, sx = 0, sz = 0, n = 0, ok = false, last = -1;
      let nx0 = SEG[cur * 6 + 0] === jx && SEG[cur * 6 + 1] === jz || kJ(SEG[cur * 6], SEG[cur * 6 + 1]) === k0 ? 2 : 0;
      for (let st = 0; st < 160 && len < 900; st++) {
        const fx = SEG[cur * 6 + nx0], fz = SEG[cur * 6 + nx0 + 1]; sx += fx; sz += fz; n++;
        if (kJ(fx, fz) === k0) { ok = true; last = cur; break; }
        let best = null, ba = 9;
        for (const l of legsAt(fx, fz)) { if (l.s === cur || l.hw < 2) continue;
          const a = Math.atan2(dx * l.uz - dz * l.ux, dx * l.ux + dz * l.uz);
          if (turn !== 0 && Math.sign(a) !== Math.sign(turn) && Math.abs(a) > 0.08) continue;
          if (Math.abs(a) < Math.abs(ba)) { ba = a; best = l; } }
        if (!best || Math.abs(ba) > 0.9) break;
        turn += ba; cur = best.s; segs.add(cur); dx = best.ux; dz = best.uz; len += best.L;
        nx0 = kJ(SEG[cur * 6], SEG[cur * 6 + 1]) === kJ(fx, fz) ? 2 : 0;
      }
      if (!ok || segs.size < 3) continue;
      // cierre: el giro en el propio cruce también cuenta
      const lastLeg = legs.find(l => l.s === last); if (!lastLeg) continue;
      const ain = Math.atan2(dx * l0.uz - dz * l0.ux, dx * l0.ux + dz * l0.uz); turn += ain;
      if (Math.abs(Math.abs(turn) - 2 * Math.PI) > 0.8 || Math.abs(ain) > 1.2) continue;
      const R = len / (2 * Math.PI), cx = sx / n, cz = sz / n;
      if (R < 6 || R > 140 || coverAt && coverAt(cx, cz, -1) > -1e8) continue;
      res = { segs, a: l0.s, b: last, R }; for (const q of segs) ringSegs.add(q); break;
    }
    loops.set(k0, res); return res;
  }
  // ¿la boca (s, e) es un tramo del anillo de una rotonda en ese cruce?
  function isRing(s, info) { if (!info) return false; if (ringSegs.has(s)) return true;
    for (const l of info.legs) { if (l.s === s) continue; const o = endInfo(l.s, SEG[l.s * 6] === info.jx && SEG[l.s * 6 + 1] === info.jz ? 0 : 1); if (o && o.ring && (o.ring.a === s || o.ring.b === s)) return true; }
    return false; }
  // T (tres ramas, dos de ellas en recta) en una vía ancha: el paso de la vía que sigue, solo en una de las dos ramas
  function throughSkip(s, info) {
    if (info.legs.length !== 3) return false;
    const me = info.legs.find(l => l.s === s); if (!me) return false;
    const cont = info.legs.find(l => l.s !== s && l.ux * me.ux + l.uz * me.uz < -0.94);
    return !!cont && cont.s < s && me.hw > 9;              // solo en las vías anchas: en las calles, paso en las dos ramas (como en Barcelona)
  }
  // geometría de la boca: a0 (inicio del paso de cebra), dónde acaba lo pintado (aEnd) y qué se pinta
  const plans = new Map();
  function plan(s, e) {
    const key = s * 2 + (e ? 1 : 0); if (plans.has(key)) return plans.get(key);
    const info = endInfo(s, e), o = s * 6, cls = SEG[o + 5], L = Math.hypot(SEG[o + 2] - SEG[o], SEG[o + 3] - SEG[o + 1]) + (info ? info.ext : 0);
    let P = null;
    if (info) {
      const ringLeg = isRing(s, info), entry = !!info.ring, hw = info.hw;
      let a0 = info.aMin + 1.0;
      if (info.dB < 1e8) a0 = Math.min(Math.max(a0, info.dB - 5), info.aMin + 13);
      if (entry) a0 = info.aMin + 5.5;
      const oneWay = cls >= 4 && cls <= 6 && hw <= 6.5;
      const zebra = ZEBRA.has(cls) && hw >= 2 && !(cls === 6 && hw < 3) && !ringLeg && !throughSkip(s, info);
      if (zebra && a0 + 4 + 2 > L) a0 = info.aMin + 1.0;
      const zOk = zebra && a0 + 4 + 2 <= L;
      const stop = !ringLeg && !entry && hw >= 2.5 && (cls <= 6 || cls === 8 || cls === 10 || cls === 11) && cls >= 2;
      const giveway = entry && hw >= 2.5;
      const aGive = info.aMin + 0.6;
      const zFree = zOk && freeRect(s, info, a0, a0 + 4, -hw + 0.3, hw - 0.3);
      const aStop = zFree ? a0 + 4 + 1.0 : info.aMin + 1.0;
      const sb0 = oneWay ? -hw + 0.25 : 0.12;
      P = { info, a0, zOk: zFree, oneWay, sb0,  stop: stop && aStop + 0.4 <= L && freeRect(s, info, aStop, aStop + 0.4, sb0, hw - 0.25), aStop,
            giveway: giveway && aGive + 1 <= L && freeRect(s, info, aGive, aGive + 0.9, 0.35, hw - 0.15), aGive,
            arrows: !oneWay && !ringLeg && !entry && hw >= 5.5 && cls <= 5 && aStop + 12 <= L && freeRect(s, info, aStop + 3, aStop + 8, 0.2, hw - 0.2),
            aEnd: ringLeg ? info.aMin : Math.max(zFree ? a0 + 4 + 1.6 : 0, stop ? aStop + 1.0 : 0, giveway ? aGive + 1.6 : 0, info.aMin) };
    }
    plans.set(key, P); return P;
  }
  // metros de pintura de cruce que entran en el tramo s por su extremo e cuando ese extremo no es cruce sino la continuación
  // de un tramo corto que sale de uno (para cortar ahí las líneas de carril)
  function spill(s, e) { let cur = s, ce = e, d = 0;
    for (let k = 0; k < 4 && d < 40; k++) { const oc = cur * 6, nx0 = SEG[oc + ce * 2], nz0 = SEG[oc + ce * 2 + 1], lg = legsAt(nx0, nz0);
      if (lg.length !== 2) return 0; const nx = lg.find(l => l.s !== cur); if (!nx) return 0;
      const fe = kJ(SEG[nx.s * 6], SEG[nx.s * 6 + 1]) === kJ(nx0, nz0) ? 1 : 0; d += nx.L;
      const P = plan(nx.s, fe); if (P) return P.info.chain.indexOf(s) >= 0 ? Math.max(0, P.aEnd - d) : 0;
      cur = nx.s; ce = fe; }
    return 0; }
  // altura de la pintura: sobre la más alta de las cintas que hay en ese punto (en los cruces se apilan varias)
  function yAt(s, x, z, info) { let y = roadY(s, x, z);
    if (info && info.chain.length) { let best = segD(s, x, z); for (const c of info.chain) { const d = segD(c, x, z); if (d < best - 0.01) { best = d; y = roadY(c, x, z); } } }
    if (info) for (const l of info.oth) if (segD(l.s, x, z) < l.hw) y = Math.max(y, roadY(l.s, x, z));
    return y + 0.025; }
  // un polígono de pintura en coordenadas de boca (a: metros desde el cruce hacia fuera, b: de través, + = carril de entrada)
  function paint(cell, s, info, pts) {
    const { W, ox, oz } = cell, { jx, jz, ux, uz, qx, qz } = info;
    const P = pts.map(([a, b]) => { const x = jx + ux * a + qx * b, z = jz + uz * a + qz * b; return [x - ox, yAt(s, x, z, info), z - oz]; });
    const q = P.length === 3 ? [P[0], P[1], P[2], P[2]] : P;
    quad(W, F0, q[0][0], q[0][1], q[0][2], q[1][0], q[1][1], q[1][2], q[2][0], q[2][1], q[2][2], q[3][0], q[3][1], q[3][2], WHITE, K.PLAIN);
  }
  const rect = (a0, a1, b0, b1) => [[a0, b0], [a1, b0], [a1, b1], [a0, b1]];
  // flecha de 5 m en el carril de centro b, apuntando al cruce (a decreciente): recta, a la izquierda o a la derecha del
  // conductor (que avanza hacia −a con su derecha en +b)
  function arrow(cell, s, info, a, b, kind) {
    const T = []; const sh = 0.15;
    if (kind === 0) {                                          // recta
      T.push(rect(a + 1.4, a + 5, b - sh, b + sh), [[a + 1.4, b - 0.5], [a, b], [a + 1.4, b + 0.5]]);
    } else {                                                   // giro: −1 izquierda (hacia −b), +1 derecha (hacia +b)
      const sg = kind;
      T.push(rect(a + 2.2, a + 5, b - sh, b + sh));
      T.push([[a + 2.2, b - sh * sg], [a + 2.2, b + sh * sg], [a + 1.5, b + sg * 0.75 + sh * sg], [a + 1.5, b + sg * 0.75 - sh * sg]]);
      T.push([[a + 1.95, b + sg * 0.55], [a + 0.75, b + sg * 1.2], [a + 1.05, b + sg * 0.55 - sg * 0.2]]);
    }
    for (const p of T) paint(cell, s, info, p);
  }

  function decals(cell) {
    const { inCell } = cell;
    cell.forEachSeg(seg => {
      const { s, cls, hw, L } = seg;
      if (!CAR.has(cls) || hw < 2) return;
      const ex = [0, 0];                                       // metros sin pintar de carril en cada extremo
      for (const e of [0, 1]) {
        const P = plan(s, e); if (!P) { ex[e] = spill(s, e); continue; } const info = P.info; ex[e] = P.aEnd;
        const mid = (a, b) => inCell(info.jx + info.ux * a + info.qx * b, info.jz + info.uz * a + info.qz * b);
        // paso de cebra: bandas de 50 cm cada metro, centradas en la calzada
        if (P.zOk && mid(P.a0 + 2, 0)) {
          const n = Math.max(1, Math.floor((2 * hw - 0.8) / 1.0) + 1), b0 = -((n - 1) * 1.0) / 2;
          for (let i = 0; i < n; i++) { const b = b0 + i; paint(cell, s, info, rect(P.a0, P.a0 + 4, b - 0.25, b + 0.25)); }
        }
        if (P.stop && mid(P.aStop, 0)) paint(cell, s, info, rect(P.aStop, P.aStop + 0.4, P.sb0, hw - 0.25));
        if (P.giveway && mid(P.aGive, hw * 0.5)) {           // dientes de tiburón: triángulos de 60 cm con la punta hacia el que llega
          for (let b = 0.35; b + 0.6 <= hw - 0.15; b += 0.9) paint(cell, s, info, [[P.aGive, b], [P.aGive, b + 0.6], [P.aGive + 0.9, b + 0.3]]);
        }
        if (P.arrows && mid(P.aStop + 8, hw * 0.5)) {
          const { legs } = info, me = legs.find(l => l.s === s); let st = false, lf = false, rt = false;
          if (me) for (const l of legs) { if (l.s === s || l.hw < 2) continue; const dt = -(l.ux * me.ux + l.uz * me.uz), cr = l.ux * me.uz - l.uz * me.ux;   // cr > 0: a la izquierda del que entra
            if (dt > 0.7) st = true; else if (cr > 0) lf = true; else rt = true; }
          const nIn = Math.max(1, Math.min(4, Math.round(hw / 3.2))), lw = hw / nIn;
          for (let k = 0; k < nIn; k++) {
            const b = (k + 0.5) * lw;
            if (!st && !lf && !rt) continue;
            // k = 0 es el carril de la izquierda del que entra (junto al eje): giro a la izquierda donde no hay recto
            let kd = st ? 0 : lf ? -1 : 1;
            if (!st && lf && rt && nIn > 1) kd = k === 0 ? -1 : k === nIn - 1 ? 1 : (k < nIn / 2 ? -1 : 1);
            arrow(cell, s, info, P.aStop + 3, b, kd);
          }
        }
      }
      // líneas de carril discontinuas (clases 5 y 6, 2 o más carriles): 2,5 m de raya cada 7,5 m, a lo largo del tramo
      if ((cls === 5 || cls === 6) && hw >= 3.4) {
        const nL = Math.max(2, Math.min(4, Math.round(2 * hw / 3.2))), lw = 2 * hw / nL;
        const o = s * 6, ax = SEG[o], az = SEG[o + 1], tx = seg.tx, tz = seg.tz, px = seg.px, pz = seg.pz;
        const i0 = ex[0] + 1.0, i1 = L - ex[1] - 1.0;
        if (i1 - i0 > 4) seg.along(7.5, 0, u => {
          if (u < i0 || u + 2.5 > i1) return;
          const cx = ax + tx * (u + 1.25), cz = az + tz * (u + 1.25); if (!inCell(cx, cz)) return;
          for (let k = 1; k < nL; k++) { const b = -hw + k * lw;
            const pts = [[u, b - 0.06], [u + 2.5, b - 0.06], [u + 2.5, b + 0.06], [u, b + 0.06]].map(([a, bb]) => { const x = ax + tx * a + px * bb, z = az + tz * a + pz * bb; return [x - cell.ox, roadY(s, x, z) + 0.025, z - cell.oz]; });
            quad(cell.W, F0, pts[0][0], pts[0][1], pts[0][2], pts[1][0], pts[1][1], pts[1][2], pts[2][0], pts[2][1], pts[2][2], pts[3][0], pts[3][1], pts[3][2], WHITE, K.PLAIN); }
        });
      }
    });
  }

  // recuento de todas las bocas de cruce de la ciudad (depuración y banco de pruebas): BCN_GROUND.survey() →
  // { bocas, pasos, detenciones, cedas, flechas, anillo, entradas, sinPaso, muestras: [[x, z, tipo]…] }
  window.BCN_GROUND.survey = function () {
    const R = { bocas: 0, pasos: 0, detenciones: 0, cedas: 0, flechas: 0, anillo: 0, entradas: 0, sinPaso: 0, muestras: [] }, seenJ = new Set();
    for (let s = 0; s < SEG.length / 6; s++) { const o = s * 6; if (!CAR.has(SEG[o + 5]) || SEG[o + 4] < 2) continue;
      for (const e of [0, 1]) { const P = plan(s, e); if (!P) continue; R.bocas++;
        if (P.zOk) R.pasos++; else if (ZEBRA.has(SEG[o + 5])) R.sinPaso++;
        if (P.stop) R.detenciones++; if (P.giveway) R.cedas++; if (P.arrows) R.flechas++; if (P.info.ring) R.entradas++; if (isRing(s, P.info)) R.anillo++;
        const k = kJ(P.info.jx, P.info.jz); if (!seenJ.has(k)) { seenJ.add(k); R.muestras.push([Math.round(P.info.jx), Math.round(P.info.jz), P.info.legs.length + (P.info.ring ? 'R' : '') + (P.info.dB < 1e8 && P.info.dB - P.info.aMin > 8 ? 'X' : '')]); } } }
    return R;
  };
  return { decals };
} };
})();
