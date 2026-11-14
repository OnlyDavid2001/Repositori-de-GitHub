#!/usr/bin/env node
/* Condal City · Fase 3a — GENERADOR POR EDIFICIO (precálculo). Escribe data/condal_edif.json (formato y bits: cabecera de
   edif.js) con las decisiones de las reglas 0, 1, 2, 3, 4, 5 y 7 de reglas_generador para cada edificio, en el orden de BREC:
     0 semilla: hash del centro de la huella (media de los vértices del anillo exterior, al decímetro), no del índice.
     1 estilo: al azar ponderado por la mezcla de BCN_CONDAL (0,7 sección + 0,3 barrio; perfiles sintéticos fuera de Barcelona)
       × compatibilidad de la altura real con las plantas del estilo (fuera del rango, ×0,2 por planta de diferencia; en avenidas
       se toleran 1–2 plantas de más: «+1/+2 en avenidas» como elección de estilo, sin cambiar la altura).
     2 rachas por acera: frentes de calle = tramo de fachada de calle más largo de cada edificio (layoutB de facades.js) y el
       tramo de calzada más cercano (≤ 16 m); los tramos de calzada se encadenan en calles (continuación recta en cada nudo) y
       cada acera (calle, lado) se ordena por la posición a lo largo de la calle. Con probabilidad 0,5 (0,65 en el Eixample,
       0,8 tras un polígono o unas casas baratas) se repite el ESTILO del anterior, si casa con la altura (≥ 0,2) y existe allí.
     3 variante: ponderada por sus plantas preferidas (kit), evitando la del vecino anterior de la acera y la de los vecinos
       pegados del mismo estilo; nunca variante + color iguales a un vecino (acera o pegado) ya decidido.
     4 parcelas virtuales: si el frente es mucho más ancho que ancho_fachada_m del estilo (×1,5; ×1,25 en los estilos de
       fachada estrecha), se parte en parcelas del ancho medio del estilo (2–16).
     5 ático retranqueado con la aticoP de la variante (30 % en eixample_ornamentado, noucentista, autarquia, desarrollismo y
       burgues_60_70) en edificios de 4+ plantas; remontes (1–2 últimas plantas con otro acabado) con la probabilidad
       remontes_plantas_anadidas del barrio, en estilos anteriores a 1975 de 3+ plantas y sin ático.
     7 color: índice de la paleta de la variante (o del estilo), tono ±5 %, luminosidad ±8 % (16 pasos); desgaste = desgaste de
       la variante o desgaste_base del estilo + desgaste_extra del barrio (edif.js le suma ± 0,08 sacado del byte de tono).
   Reparto: la corrección por altura empuja hacia los estilos bajos; multiplicadores por barrio y estilo (0,2–5, ajuste
   proporcional iterativo) devuelven el reparto esperado de cada barrio hacia su mezcla sin saltarse más de una planta.
   Necesita el juego cargado (Chromium sin cabeza, como tools/mz_partidas.js) para leer exactamente los mismos edificios
   (contenedores y fincas de las manzanas partidas), el viario, el kit y condal.json. Determinista: dos ejecuciones dan el
   mismo fichero. Hay que relanzarlo si cambian los edificios, mz_partidas.json, condal.json o el kit (si no casa, el juego
   avisa y usa el selector provisional).
   uso: node tools/cc/generador.js            (imprime la estadística por barrio) */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), zlib = require('zlib');
const DIR = path.join(__dirname, '..', '..'), CACHE = path.join(__dirname, '..', '.cache');
const BABYLON = path.join(CACHE, 'babylon.js'), EARCUT = path.join(CACHE, 'earcut.min.js');
if (!fs.existsSync(BABYLON)) { console.error('falta ' + BABYLON + ': lanza antes tools/shot.js una vez'); process.exit(2); }

// ------------------------------------------------------------------ lo que corre dentro de la página (el juego ya cargado)
function generar() {
  const ctx = window.BCN.ctx, C = window.BCN_CONDAL, KIT = window.BCN_KIT, ED = window.BCN_EDIF, fx = ctx.mods.fx, city = ctx.city;
  const BR = ctx.BREC, SEG = ctx.SEG, NB = BR.n, t0 = performance.now();
  const NE = C.estilos.length, IX = C.estilos, EID = {}; IX.forEach((e, i) => { EID[e.id] = i; });
  const mix = (a, b) => { let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b | 0) + 0x632be5ab, 0xc2b2ae35);
    h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15; return h >>> 0; };
  const compat = (n, pl) => !pl ? 1 : n < pl[0] ? Math.pow(0.2, pl[0] - n) : n > pl[1] ? Math.pow(0.2, n - pl[1]) : 1;
  const NARROW = new Set(['quart_de_casa', 'casa_obrera_xix', 'barroco', 'gotico', 'pueblo', 'casas_baratas']);
  const REMONTE = new Set(['gotico', 'barroco', 'neoclasico', 'quart_de_casa', 'casa_obrera_xix', 'eixample_temprano', 'eixample_ornamentado',
    'modernista', 'noucentista', 'racionalista_deco', 'autarquia', 'pueblo', 'casas_baratas', 'autoconstruccion', 'desarrollismo', 'burgues_60_70']);
  const RACHA_ALTA = new Set([EID.poligono, EID.casas_baratas]);
  const skipMZ = new Set(); for (const k of (BR.mz && BR.mz.blocks) || []) for (const b of k.skip) skipMZ.add(b);

  // ---- 0 · datos por edificio: clase, centro de la huella, altura, plantas, semilla, punto de Condal
  const cls = new Uint8Array(NB), seed = new Uint32Array(NB), nPl = new Uint8Array(NB), cxA = new Float32Array(NB), czA = new Float32Array(NB);
  const res = new Uint8Array(NB);    // ¿lleva estilo? (clases 0 y 6, como kit.elige)
  for (let b = 0; b < NB; b++) {
    const dv = BR.dv[BR.cont[b]], p = BR.off[b], c = dv.getUint8(p + 1), nR = dv.getUint8(p), n = dv.getUint16(p + 4, true);
    const yb = dv.getInt16(p + 6, true), ytop = dv.getInt16(p + 10, true), m0 = nR > 1 ? dv.getUint16(p + 12, true) : n, q0 = p + 12 + (nR > 1 ? nR * 2 : 0);
    const ch = ctx.bldChunks[BR.chunk[b]]; let sx = 0, sz = 0;
    for (let k = 0; k < m0; k++) { sx += dv.getInt16(q0 + k * 4, true) / 10; sz += dv.getInt16(q0 + k * 4 + 2, true) / 10; }
    const cx = sx / Math.max(1, m0) + ch.ox, cz = sz / Math.max(1, m0) + ch.oz;
    cls[b] = c; cxA[b] = cx; czA[b] = cz; seed[b] = mix(Math.round(cx * 10), Math.round(cz * 10));
    nPl[b] = KIT.plantas((ytop - yb) / 10); res[b] = (c === 0 || c === 6) && !skipMZ.has(b) ? 1 : 0;
  }
  const rnd = (b, k) => mix(seed[b], k) / 4294967296;
  const ms0 = performance.now() - t0;

  // ---- calles: los tramos de calzada se encadenan por continuación recta en cada nudo
  const NS = SEG.length / 6, CAR = city.CAR, link = new Int32Array(NS * 2).fill(-1), nodes = new Map();
  const key = (x, z) => Math.round(x * 2) + ',' + Math.round(z * 2);
  for (let s = 0; s < NS; s++) { if (!CAR.has(SEG[s * 6 + 5])) continue;
    for (let e = 0; e < 2; e++) { const k = key(SEG[s * 6 + e * 2], SEG[s * 6 + e * 2 + 1]); let l = nodes.get(k); if (!l) nodes.set(k, l = []); l.push(s * 2 + e); } }
  const dirOut = se => { const s = se >> 1, e = se & 1, o = s * 6, dx = SEG[o + 2] - SEG[o], dz = SEG[o + 3] - SEG[o + 1], L = Math.hypot(dx, dz) || 1;
    return e === 0 ? [dx / L, dz / L] : [-dx / L, -dz / L]; };   // dirección que sale del nudo por ese tramo
  for (const l of [...nodes.keys()].sort()) { const L = nodes.get(l); if (L.length < 2) continue;
    const pairs = []; for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { if ((L[i] >> 1) === (L[j] >> 1)) continue;
      const a = dirOut(L[i]), c = dirOut(L[j]), d = a[0] * c[0] + a[1] * c[1]; if (d < -0.8) pairs.push([d, L[i], L[j]]); }
    pairs.sort((p, q) => p[0] - q[0] || p[1] - q[1] || p[2] - q[2]);
    for (const [, x, y] of pairs) if (link[x] < 0 && link[y] < 0) { link[x] = y; link[y] = x; } }
  const chain = new Int32Array(NS).fill(-1), off = new Float64Array(NS), sgn = new Int8Array(NS); let nCh = 0;
  for (let s0 = 0; s0 < NS; s0++) { if (chain[s0] >= 0 || !CAR.has(SEG[s0 * 6 + 5])) continue;
    // al principio de la cadena: hacia atrás por el extremo 0
    let s = s0, e = 0, guard = 0;
    while (guard++ < NS) { const nx = link[s * 2 + e]; if (nx < 0) break; const s2 = nx >> 1; if (s2 === s0) break; s = s2; e = 1 - (nx & 1); }
    // s es el primero; se entra por e (el extremo libre): recorrido hacia delante
    let acc = 0, ent = e; guard = 0;
    while (guard++ < NS && chain[s] < 0) { const o = s * 6, L = Math.hypot(SEG[o + 2] - SEG[o], SEG[o + 3] - SEG[o + 1]);
      chain[s] = nCh; off[s] = acc; sgn[s] = ent === 0 ? 1 : -1; acc += L;
      const nx = link[s * 2 + (1 - ent)]; if (nx < 0) break; s = nx >> 1; ent = nx & 1; }
    nCh++; }

  // ---- frentes: tramo de calle principal de cada vivienda, su tramo de calzada, su lado y su posición en la calle
  const chfM = new Array(NB), chfDiag = {}, at0x = {};
  const fr = new Int32Array(NB).fill(-1), frT = new Float64Array(NB), frL = new Float32Array(NB), aven = new Uint8Array(NB), chf = new Uint8Array(NB);
  let nFr = 0;
  for (let b = 0; b < NB; b++) { if (!res[b] || nPl[b] < 1) continue;
    let lay = null; try { lay = fx.layoutB(b); } catch (e) { lay = null; } if (!lay) continue;
    let best = null; for (const r of lay.runs) if (r.kind === 'street' && (!best || r.L > best.L)) best = r;
    for (let i = 0; i < lay.runs.length; i++) { const r = lay.runs[i]; if (r.kind === 'street' && r.L >= 5 && r.L <= 24 && fx.esChaflan(lay.runs, i)) { chf[b] = 1; chfM[b] = [r.ax + r.tx * r.L / 2, r.az + r.tz * r.L / 2]; break; } }
    // F3R2 · diagnóstico en el Eixample: tramos de calle de 3–24 m con una calle a ~45° en un lado; ¿qué hay al otro lado?
    if (!chf[b] && C.at(cxA[b], czA[b], at0x) && /Eixample/.test(at0x.distrito || '')) { const R = lay.runs, nn = R.length;
      for (let i = 0; i < nn; i++) { const r = R[i]; if (r.kind !== 'street' || r.L < 3 || r.L > 24) continue;
        for (const [s, w] of [[R[(i + nn - 1) % nn], R[(i + 1) % nn]], [R[(i + 1) % nn], R[(i + nn - 1) % nn]]]) { const ds = Math.abs(r.tx * s.tx + r.tz * s.tz);
          if (s.kind !== 'street' || ds <= 0.5 || ds >= 0.87) continue; const dw = Math.abs(r.tx * w.tx + r.tz * w.tz), d3 = Math.abs(s.tx * w.tx + s.tz * w.tz);
          const k = (r.L < 5 ? 'Lcorto' : s.L <= 3 ? 'calleCorta' : w.kind + (d3 < 0.3 ? '|perpCalle' : dw < 0.3 ? '|perpChf' : dw > 0.87 ? '|recto' : '|otro')); chfDiag[k] = (chfDiag[k] || 0) + 1; } } }
    if (!best || best.L < 3) continue;
    const mx = best.ax + best.tx * best.L / 2, mz = best.az + best.tz * best.L / 2, [s, d] = city.nearestCar(mx + best.nx * 2, mz + best.nz * 2);
    if (s < 0 || d > 16 || chain[s] < 0) continue;
    const o = s * 6, ax = SEG[o], az = SEG[o + 1], dx = SEG[o + 2] - ax, dz = SEG[o + 3] - az, l2 = dx * dx + dz * dz, L = Math.sqrt(l2) || 1;
    let t = l2 > 0 ? ((mx - ax) * dx + (mz - az) * dz) / l2 : 0; t = Math.max(0, Math.min(1, t));
    const pos = off[s] + (sgn[s] > 0 ? t * L : (1 - t) * L), side = (dx * (mz - az) - dz * (mx - ax)) * sgn[s] > 0 ? 1 : 0;
    fr[b] = chain[s] * 2 + side; frT[b] = pos; frL[b] = best.L; aven[b] = SEG[o + 4] >= 9 ? 1 : 0; nFr++;
  }
  const ms1 = performance.now() - t0;

  // ---- vecinos pegados (cajas a menos de 1,5 m), con la rejilla de facades.js
  const BB = BR.bb, ALL = city.ALL;
  function pegados(b) { const out = [], x0 = BB[b * 4] - 1.5, z0 = BB[b * 4 + 1] - 1.5, x1 = BB[b * 4 + 2] + 1.5, z1 = BB[b * 4 + 3] + 1.5, cs = new Set();
    for (let x = x0; x < x1 + city.CS; x += city.CS * 0.5) for (let z = z0; z < z1 + city.CS; z += city.CS * 0.5) cs.add(city.cellOf(Math.min(x, x1), Math.min(z, z1)));
    for (const c of cs) for (let k = ALL.start[c]; k < ALL.start[c + 1]; k++) { const n = ALL.list[k];
      if (n !== b && res[n] && out.indexOf(n) < 0 && BB[n * 4] < x1 && BB[n * 4 + 2] > x0 && BB[n * 4 + 1] < z1 && BB[n * 4 + 3] > z0) out.push(n); }
    return out; }

  // ---- regla 1 · reparto por grupo (barrio de Barcelona, o barrio de referencia en la periferia): la corrección por altura
  // desplaza el reparto hacia los estilos de pocas plantas (OSM trae muchos volúmenes bajos). Multiplicadores por grupo y estilo
  // (λ entre 0,2 y 5: como mucho compensan una planta fuera de rango) que acercan el reparto esperado a la mezcla del grupo
  // (ajuste proporcional iterativo, amortiguado)
  const grp = new Int32Array(NB).fill(-1), gK = new Map(), at0 = {};
  for (let b = 0; b < NB; b++) { if (!res[b]) continue; const r = C.at(cxA[b], czA[b], at0); if (!r || !r.mezcla) continue;
    const k = (r.zona === 'bcn' ? 'b' : 'p') + (r.barrioRef || r.barrio || '?'); let g = gK.get(k); if (g === undefined) gK.set(k, g = gK.size); grp[b] = g; }
  // F3R: λ entre 0,02 y 50 (antes 0,2–5, que no bastaba en el Carmel, Horta o Torre Baró) y una segunda vuelta con el reparto
  // realmente asignado (rachas incluidas): los estilos altos van primero a los edificios más altos del barrio
  const gotB = new Uint8Array(NB), atG = {};
  for (let b = 0; b < NB; b++) if (fr[b] >= 0) { const r = C.at(cxA[b], czA[b], atG); if (r && /G[oò]tic/.test(r.barrio || '')) gotB[b] = 1; }
  const LMIN = 0.02, LMAX = 50;
  const NG = gK.size, LAM = new Float64Array(NG * NE).fill(1), TG = new Float64Array(NG * NE), AG = new Float64Array(NG * NE), wq = new Float64Array(NE);
  const cOf = (n, i, av) => av ? Math.max(compat(n, IX[i].pl), compat(n - 1, IX[i].pl), compat(n - 2, IX[i].pl)) : compat(n, IX[i].pl);
  // F3R2: límite duro de una planta fuera de rango (compat ≥ 0,2; en avenidas, con la tolerancia de +1/+2): los estilos que no
  // casan con la altura no entran en el sorteo ni en las rachas, así que el ajuste por barrio (λ) solo reparte entre estilos que
  // caben y los estilos altos van a los edificios altos del barrio (cuota por banda de altura). Si ningún estilo de la mezcla
  // cabe (p. ej. una planta en el Eixample), se vuelve a los pesos blandos (cOfB) y se cuenta como «forzado»
  const cOfB = cOf, cOfH = (n, i, av) => { const c = cOfB(n, i, av); return c >= 0.2 ? c : 0; };
  // F3R2 · Gòtic a pie: el gótico (2–4 plantas, 21 % de fachadas_pct) caía en los volúmenes bajos de patio; en el Barri Gòtic
  // pesa ×3 en los edificios con frente de calle (el ajuste por barrio lo quita de los de dentro de manzana, así que el reparto
  // del barrio no cambia: la piedra gótica pasa a la calle)
  const fG = (b, i) => i === EID.gotico && gotB[b] ? 3 : 1;
  const wHard = (b, m, out, lam) => { let s = 0; for (let i = 0; i < NE; i++) { out[i] = m[i] * cOfH(nPl[b], i, aven[b]) * lam(i) * fG(b, i); s += out[i]; }
    if (s > 0) return s; s = 0; for (let i = 0; i < NE; i++) { out[i] = m[i] * cOfB(nPl[b], i, aven[b]) * lam(i) * fG(b, i); s += out[i]; } return -s; };
  for (let b = 0; b < NB; b++) { const g = grp[b]; if (g < 0) continue; const m = C.at(cxA[b], czA[b], at0).mezcla; for (let i = 0; i < NE; i++) TG[g * NE + i] += m[i]; }
  for (let it = 0; it < 24; it++) {
    AG.fill(0);
    for (let b = 0; b < NB; b++) { const g = grp[b]; if (g < 0) continue; const m = C.at(cxA[b], czA[b], at0).mezcla;
      const s = Math.abs(wHard(b, m, wq, i => LAM[g * NE + i]));
      if (s > 0) for (let i = 0; i < NE; i++) AG[g * NE + i] += wq[i] / s; }
    for (let k = 0; k < NG * NE; k++) if (TG[k] > 0 && AG[k] > 0) LAM[k] = Math.max(LMIN, Math.min(LMAX, LAM[k] * Math.sqrt(TG[k] / AG[k]))); }
  const msL = performance.now() - t0;

  // ---- reglas 1, 2, 3, 4, 5 y 7
  const O = new Uint8Array(NB * 8); O.fill(0, 0, NB); for (let b = 0; b < NB; b++) O[b] = 255;
  const est = O.subarray(0, NB), p1 = O.subarray(NB, 2 * NB), p2 = O.subarray(2 * NB, 3 * NB), p3 = O.subarray(3 * NB, 4 * NB), p4 = O.subarray(4 * NB, 5 * NB),
    p5 = O.subarray(5 * NB, 6 * NB), p6 = O.subarray(6 * NB, 7 * NB);
  const vi = new Int8Array(NB).fill(-1), ci = new Int8Array(NB).fill(-1), at = {}, w = new Float64Array(NE);
  const ids = (ES, v, si) => { const V = ES.V[v], pal = V.paleta || ES.paleta || IX[si].pal; return V.paleta ? pal.map((_, i) => i) : V.pal || pal.map((_, i) => i); };
  const done = new Uint8Array(NB);
  const palOf = (ES, v, si) => ES.V[v].paleta || ES.paleta || IX[si].pal;
  const sat = c => { let r, g, bb; if (typeof c === 'string' && c[0] === '#') { const h = parseInt(c.slice(1, 7), 16); r = h >> 16 & 255; g = h >> 8 & 255; bb = h & 255; }
    else if (Array.isArray(c)) { [r, g, bb] = c; } else return 0.5; const mx = Math.max(r, g, bb), mn = Math.min(r, g, bb); return mx > 0 ? (mx - mn) / mx : 0; };
  const satM = P => { if (!P || !P.length) return 0.5; let t = 0; for (const c of P) t += sat(c); return t / P.length; };
  const DESAT = new Set([EID.desarrollismo]);
  let ST = null;
  const ATICO = new Set(['eixample_ornamentado', 'noucentista', 'autarquia', 'desarrollismo', 'burgues_60_70']);
  // F3R: remontes también en casas de 2 plantas de estos estilos (+1 planta)
  const REM2 = new Set(['pueblo', 'casas_baratas', 'autoconstruccion', 'casa_obrera_xix', 'quart_de_casa']);
  const remOK = (si, n, atico) => !atico && REMONTE.has(IX[si].id) && (n >= 3 || (n === 2 && REM2.has(IX[si].id)));
  function decide(b, prev) {
    done[b] = 1;
    const r = C.at(cxA[b], czA[b], at); if (!r || !r.mezcla) return;
    const m = r.mezcla, n = nPl[b], av = aven[b];
    const g = grp[b]; let s = wHard(b, m, w, i => g >= 0 ? LAM[g * NE + i] : 1); const forz = s < 0; s = Math.abs(s);
    if (!(s > 0)) return;
    if (forz) ST.forzado++;
    ST.conDatos++;
    let si = -1, rep = 0;
    if (prev >= 0 && est[prev] !== 255) { const ps = est[prev], pRep = /Eixample/.test(r.distrito || '') ? 0.65 : RACHA_ALTA.has(ps) ? 0.8 : 0.5; ST.conRep++;
      const kR = pRep >= 0.8 ? 2 : pRep >= 0.65 ? 1 : 0; ST.repK[kR * 2]++;
      // F3R2: con el límite de altura, la repetición solo es posible si el estilo del anterior cabe; la probabilidad se sube en
      // proporción (lo medido en la vuelta anterior) para que la repetición medida sobre todos los pares se acerque a la nominal
      const okR = m[ps] > 0 && (forz ? cOf(n, ps, av) >= 0.008 : cOfH(n, ps, av) > 0); if (okR) ST.repE[kR]++;
      if (okR && rnd(b, 10) < Math.min(0.97, pRep * REPF[kR])) { si = ps; rep = 1; ST.rep++; ST.repK[kR * 2 + 1]++; } }
    if (si < 0) { let q = rnd(b, 11) * s; si = NE - 1; for (let i = 0; i < NE; i++) { q -= w[i]; if (q < 0) { si = i; break; } } }
    est[b] = si;
    const ES = KIT.E[IX[si].id]; if (!ES) { ST.noKit++; return; }
    // variante (regla 3): por plantas preferidas, evitando la de los vecinos del mismo estilo; nunca variante + color de un vecino
    const veci = pegados(b).filter(x => done[x] && est[x] !== 255); if (prev >= 0 && veci.indexOf(prev) < 0 && est[prev] !== 255) veci.push(prev);
    const usadoV = new Set(), usadoVC = new Set();
    for (const x of veci) if (est[x] === si && vi[x] >= 0) { usadoV.add(vi[x]); usadoVC.add(vi[x] * 16 + ci[x]); }
    // F3R2: el ladrillo rojo saturado del desarrollismo resaltaba desde el aire entre la piedra clara del Eixample y de Gràcia:
    // allí pesan más las variantes de paleta menos saturada y el color sale de la mitad menos saturada de la paleta
    const desat = DESAT.has(si) && /Eixample|Gràcia/.test(r.distrito || '');
    const cw = ES.V.map((V, v) => compat(n, V.pl) * (desat ? Math.pow(1 - satM(palOf(ES, v, si)), 4) : 1)); let sw = 0; for (const c of cw) sw += c;
    let v0 = 3, q = rnd(b, 12) * sw; for (let i = 0; i < 4; i++) { q -= cw[i]; if (q < 0) { v0 = i; break; } }
    const orden = [0, 1, 2, 3].map(t => (v0 + t) & 3).sort((a, c) => ((cw[a] >= 0.2 ? 0 : 2) + (usadoV.has(a) ? 1 : 0)) - ((cw[c] >= 0.2 ? 0 : 2) + (usadoV.has(c) ? 1 : 0)));
    let V = -1, Ci = -1;
    for (const v of orden) { let L = ids(ES, v, si); if (desat && L.length > 2) { const P = palOf(ES, v, si); L = L.slice().sort((a, c) => sat(P[a]) - sat(P[c]) || a - c).slice(0, Math.max(2, Math.ceil(L.length / 2))); }
      const k0 = (rnd(b, 13) * L.length) | 0;
      for (let u = 0; u < L.length; u++) { const c = L[(k0 + u) % L.length]; if (!usadoVC.has(v * 16 + c)) { V = v; Ci = c; break; } }
      if (V >= 0) break; }
    if (V < 0) for (const v of orden) { const pal = ES.V[v].paleta || ES.paleta || IX[si].pal;   // último recurso: toda la paleta
      for (let c = 0; c < Math.min(16, pal.length); c++) if (!usadoVC.has(v * 16 + c)) { V = v; Ci = c; break; } if (V >= 0) break; }
    if (V < 0) { V = v0; Ci = ids(ES, v0, si)[0]; ST.sinSalida = (ST.sinSalida || 0) + 1; }
    vi[b] = V; ci[b] = Ci;
    const Vo = ES.V[V];
    // regla 5: ático y remonte
    const aP = Vo.aticoP > 0 ? Vo.aticoP : ATICO.has(IX[si].id) ? 0.3 : 0;   // F3R: 30 % del estilo si la variante no trae aticoP
    const atico = n >= 4 && aP > 0 && rnd(b, 14) < aP ? 1 : 0;
    let remP = 0, remA = 0; const pr = (r.detalles && r.detalles.remontes_plantas_anadidas) || 0;
    if (remOK(si, n, atico) && rnd(b, 15) < Math.min(1, pr * (g >= 0 ? REMF[g] : 1))) { remP = n === 2 || rnd(b, 16) < 0.7 ? 1 : 2; remA = (rnd(b, 17) * 4) | 0; }
    ST.atico += atico; ST.remonte += remP ? 1 : 0;
    // regla 4: parcelas virtuales
    let np = 1; const an = IX[si].an;
    if (fr[b] >= 0 && an && frL[b] > an[1] * (NARROW.has(IX[si].id) ? 1.25 : 1.5)) np = Math.max(2, Math.min(16, Math.round(frL[b] / ((an[0] + an[1]) / 2))));
    if (np > 1) ST.parc++;
    // regla 7: tono, luminosidad y desgaste
    const dg = Math.max(0, Math.min(1, (Vo.dg !== null && Vo.dg !== undefined ? Vo.dg : IX[si].dg) + ((r.detalles && r.detalles.desgaste_extra) || 0)));
    p1[b] = V | atico << 2 | remP << 3 | remA << 5 | chf[b] << 7;
    p2[b] = (Ci & 15) | (np - 1) << 4;
    p3[b] = Math.min(15, (rnd(b, 19) * 16) | 0) | Math.min(15, (rnd(b, 20) * 16) | 0) << 4; p4[b] = Math.round(dg * 255); p5[b] = 0;
    p6[b] = (fr[b] >= 0 ? 1 : 0) | rep << 1 | av << 2;
  }
  // primero las aceras, en orden de calle y de posición; después el resto
  const ac = []; for (let b = 0; b < NB; b++) if (fr[b] >= 0) ac.push(b);
  ac.sort((a, c) => fr[a] - fr[c] || frT[a] - frT[c] || a - c);
  const REMF = new Float64Array(NG).fill(1);
  const REPF = [1, 1, 1];
  const pasada = () => { ST = { forzado: 0, repE: [0, 0, 0], conDatos: 0, rep: 0, conRep: 0, parc: 0, atico: 0, remonte: 0, noKit: 0, repK: [0, 0, 0, 0, 0, 0] };
    done.fill(0); vi.fill(-1); ci.fill(-1); for (let b = 0; b < NB; b++) { est[b] = 255; p1[b] = p2[b] = p3[b] = p4[b] = p5[b] = p6[b] = 0; }
    for (let i = 0; i < ac.length; i++) { const b = ac[i], prev = i > 0 && fr[ac[i - 1]] === fr[b] ? ac[i - 1] : -1; decide(b, prev); }
    for (let b = 0; b < NB; b++) if (res[b] && !done[b]) decide(b, -1); };
  for (let vuelta = 0; vuelta < 3; vuelta++) {
    pasada(); if (vuelta === 2) break;
    for (let k = 0; k < 3; k++) REPF[k] = ST.repE[k] > 0 ? Math.min(1.9, ST.repK[k * 2] / ST.repE[k]) : 1;
    // F3R: reparto realmente asignado por grupo → λ; remontes: probabilidad / fracción de edificios que admiten remonte
    AG.fill(0); const nG = new Float64Array(NG), sP = new Float64Array(NG), nE = new Float64Array(NG);
    for (let b = 0; b < NB; b++) { const g = grp[b]; if (g < 0 || est[b] === 255) continue; AG[g * NE + est[b]]++; nG[g]++;
      const r = C.at(cxA[b], czA[b], at0); sP[g] += (r.detalles && r.detalles.remontes_plantas_anadidas) || 0; if (remOK(est[b], nPl[b], (p1[b] >> 2) & 1)) nE[g]++; }
    for (let g = 0; g < NG; g++) { REMF[g] = nE[g] > 0 ? Math.min(4, nG[g] / nE[g]) : 1; let t = 0; for (let i = 0; i < NE; i++) t += TG[g * NE + i];
      if (nG[g] > 0 && t > 0) for (let i = 0; i < NE; i++) { const k = g * NE + i, T = TG[k] / t, A = AG[k] / nG[g];
        if (T > 0) LAM[k] = Math.max(LMIN, Math.min(LMAX, LAM[k] * Math.pow((T + 0.002) / (A + 0.002), 0.8))); } }
  }
  const ms2 = performance.now() - t0;

  // ---- estadística: por barrio, reparto asignado frente a fachadas_pct; rachas; contiguos repetidos
  const MB = new Map(); C.barrios.forEach((x, k) => MB.set(x.m, k));
  const cnt = C.barrios.map(() => new Float64Array(NE)), cntM = C.barrios.map(() => new Float64Array(NE)), tot = new Float64Array(C.barrios.length);
  const cntF = C.barrios.map(() => new Float64Array(NE)), totF = new Float64Array(C.barrios.length);
  // F3R2: el mismo reparto ponderado por la superficie de fachada (perímetro de la caja × plantas): lo que se ve, no el número
  // de volúmenes (OSM trae muchos anexos bajos de patio que cuentan como un edificio entero)
  const cntA = C.barrios.map(() => new Float64Array(NE)), totA = new Float64Array(C.barrios.length);
  let perif = 0; const cntP = new Float64Array(NE), cntPM = new Float64Array(NE);
  for (let b = 0; b < NB; b++) { if (est[b] === 255) continue; const r = C.at(cxA[b], czA[b], at); if (!r) continue;
    if (r.zona === 'bcn' && MB.has(r.barrioIdx)) { const k = MB.get(r.barrioIdx); cnt[k][est[b]]++; tot[k]++;
      const sup = 2 * (BB[b * 4 + 2] - BB[b * 4] + BB[b * 4 + 3] - BB[b * 4 + 1]) * Math.max(1, nPl[b]); cntA[k][est[b]] += sup; totA[k] += sup; for (let i = 0; i < NE; i++) cntM[k][i] += r.mezcla[i];
      if (fr[b] >= 0) { cntF[k][est[b]]++; totF[k]++; } }
    else { perif++; cntP[est[b]]++; for (let i = 0; i < NE; i++) cntPM[i] += r.mezcla[i]; } }
  // F3R: chaflanes por distrito y remontes de Barcelona frente a los esperados (remontes_plantas_anadidas)
  const chfD = {}; let remB = 0, remEsp = 0, atB = {};
  for (let b = 0; b < NB; b++) { if (!res[b]) continue; const r = C.at(cxA[b], czA[b], at); if (!r) continue;
    if (chf[b]) chfD[r.distrito || 'perif'] = (chfD[r.distrito || 'perif'] || 0) + 1;
    if (r.zona === 'bcn' && est[b] !== 255) { remEsp += (r.detalles && r.detalles.remontes_plantas_anadidas) || 0; if ((p1[b] >> 3) & 3) remB++;
      if (nPl[b] >= 4) { const id = IX[est[b]].id, o = atB[id] || (atB[id] = [0, 0]); o[0]++; o[1] += (p1[b] >> 2) & 1; } } }
  // F3R2: plantas fuera del rango del estilo (sin la tolerancia de avenidas, como la medida del crítico) y, aparte, con ella
  const offP = (n, pl) => !pl ? 0 : n < pl[0] ? pl[0] - n : n > pl[1] ? n - pl[1] : 0;
  const hA = [0, 0, 0, 0], hAv = [0, 0, 0, 0], n2 = {}; let tA = 0;
  for (let b = 0; b < NB; b++) { if (est[b] === 255) continue; tA++; const o = Math.min(3, offP(nPl[b], IX[est[b]].pl)); hA[o]++;
    const ov = aven[b] ? Math.min(o, Math.min(3, offP(nPl[b] - 1, IX[est[b]].pl)), Math.min(3, offP(nPl[b] - 2, IX[est[b]].pl))) : o; hAv[ov]++;
    if (o >= 2) n2[IX[est[b]].id] = (n2[IX[est[b]].id] || 0) + 1; }
  const altura = { pct: hA.map(x => +(100 * x / tA).toFixed(2)), pctConAvenidas: hAv.map(x => +(100 * x / tA).toFixed(2)), forzados: ST.forzado,
    n2: Object.entries(n2).sort((a, c) => c[1] - a[1]).slice(0, 8) };
  // F3R2: chaflanes del Eixample frente a los cruces: cada nudo de calzada de 4+ tramos del distrito tiene 4 esquinas; una esquina
  // cuenta como detectada si algún edificio tiene allí (a menos de 30 m del nudo, en su cuadrante) un tramo de chaflán
  const cruces = []; for (const [k, l] of nodes) { if (l.length < 4) continue; const se = l[0], o = (se >> 1) * 6 + (se & 1) * 2, x = SEG[o], z = SEG[o + 1];
    const r = C.at(x, z, at); if (r && /Eixample/.test(r.distrito || '')) cruces.push([x, z, dirOut(se)]); }
  const cG = new Map(); cruces.forEach((c, k) => { const q = Math.floor(c[0] / 40) + ',' + Math.floor(c[1] / 40); let l = cG.get(q); if (!l) cG.set(q, l = []); l.push(k); });
  const esqOK = new Set(); let chfEix = 0;
  for (let b = 0; b < NB; b++) { if (!chf[b] || !chfM[b]) continue; const [mx, mz] = chfM[b]; const r = C.at(mx, mz, at); if (!r || !/Eixample/.test(r.distrito || '')) continue; chfEix++;
    let best = -1, bd = 30; for (let gx = -1; gx <= 1; gx++) for (let gz = -1; gz <= 1; gz++) for (const k of cG.get((Math.floor(mx / 40) + gx) + ',' + (Math.floor(mz / 40) + gz)) || []) {
      const d = Math.hypot(cruces[k][0] - mx, cruces[k][1] - mz); if (d < bd) { bd = d; best = k; } }
    if (best < 0) { chfDiag.sinCruce = (chfDiag.sinCruce || 0) + 1; continue; } const [x, z, dd] = cruces[best], vx = mx - x, vz = mz - z, a = Math.atan2(dd[0] * vz - dd[1] * vx, dd[0] * vx + dd[1] * vz);
    esqOK.add(best * 4 + (((Math.floor(a / (Math.PI / 2)) % 4) + 4) % 4)); }
  // esquinas distintas: puntos medios de chaflán agrupados a menos de 14 m (un chaflán compartido por dos fincas cuenta una vez)
  const chfB = {}, ptsE = [];
  for (let b = 0; b < NB; b++) { if (!chf[b] || !chfM[b]) continue; const r = C.at(cxA[b], czA[b], at); const k = (r && r.barrio) || 'perif'; chfB[k] = (chfB[k] || 0) + 1;
    if (r && /Eixample/.test(r.distrito || '')) ptsE.push(chfM[b]); }
  const cl = []; for (const p of ptsE) { if (!cl.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 14)) cl.push(p); }
  const chaflanesEixample = { esquinasDistintas: cl.length, porBarrio: Object.entries(chfB).sort((a, c) => c[1] - a[1]).slice(0, 14), cruces: cruces.length, esquinas: cruces.length * 4, esquinasConChaflan: esqOK.size, pct: +(100 * esqOK.size / Math.max(1, cruces.length * 4)).toFixed(1), edificios: chfEix, diag: chfDiag };
  const barrios = C.barrios.map((x, k) => { if (!tot[k]) return null; let eM = 0, eMax = 0, eS = 0, iMax = -1;
    for (let i = 0; i < NE; i++) { const a = cnt[k][i] / tot[k], f = x.mezcla[i], e = Math.abs(a - f); eM += e; if (e > eMax) { eMax = e; iMax = i; } eS += Math.abs(cntM[k][i] / tot[k] - f); }
    let dif = 0, difA = 0; for (let i = 0; i < NE; i++) { dif += Math.abs(cnt[k][i] / tot[k] - x.mezcla[i]); difA += Math.abs(cntA[k][i] / totA[k] - x.mezcla[i]); }
    return { n: x.n, ed: tot[k], otroEstilo: +(50 * dif).toFixed(1), otroEstiloSup: +(50 * difA).toFixed(1), errMedio: +(100 * eM / NE).toFixed(2), errMax: +(100 * eMax).toFixed(1), estiloMax: IX[iMax].id, asig: +(100 * cnt[k][iMax] / tot[k]).toFixed(1), pct: +(100 * x.mezcla[iMax]).toFixed(1),
      errMezclaSinAltura: +(100 * eS / NE).toFixed(2), errFrente: totF[k] ? +(100 * x.mezcla.reduce((a, f, i) => a + Math.abs(cntF[k][i] / totF[k] - f), 0) / NE).toFixed(2) : null }; }).filter(Boolean);
  // rachas: longitud media de las secuencias de mismo estilo en cada acera
  let nR = 0, sR = 0, cur = 0, lastK = -1, lastS = -1;
  for (const b of ac) { if (est[b] === 255) { if (cur) { nR++; sR += cur; } cur = 0; lastS = -1; continue; }
    if (fr[b] === lastK && est[b] === lastS) cur++; else { if (cur) { nR++; sR += cur; } cur = 1; }
    lastK = fr[b]; lastS = est[b]; }
  if (cur) { nR++; sR += cur; }
  let repAcera = 0, repPeg = 0, paresAcera = 0, paresPeg = 0, mismaVarAcera = 0;
  for (let i = 1; i < ac.length; i++) { const a = ac[i - 1], b = ac[i]; if (fr[a] !== fr[b] || est[a] === 255 || est[b] === 255 || vi[a] < 0 || vi[b] < 0) continue; paresAcera++;
    if (est[a] === est[b] && vi[a] === vi[b]) { mismaVarAcera++; if (ci[a] === ci[b]) repAcera++; } }
  for (let b = 0; b < NB; b++) { if (vi[b] < 0) continue; for (const n of pegados(b)) { if (n <= b || vi[n] < 0) continue; paresPeg++; if (est[n] === est[b] && vi[n] === vi[b] && ci[n] === ci[b]) repPeg++; } }
  const per = { ed: perif, top: [...cntP].map((v, i) => [IX[i].id, +(100 * v / perif).toFixed(1), +(100 * cntPM[i] / perif).toFixed(1)]).sort((a, c) => c[1] - a[1]).slice(0, 8) };
  // global
  let gE = 0, gF = 0, gW = 0, gX = 0; for (const x of barrios) { gE += x.errMedio; gF += x.errFrente || 0; gW += x.errMedio * x.ed; gX = Math.max(gX, x.errMax); }
  const stats = { NB, residenciales: res.reduce((a, v) => a + v, 0), conDatos: ST.conDatos, frentes: nFr, aceras: new Set(ac.map(b => fr[b])).size, calles: nCh,
    repiteEstilo: ST.rep, conAnterior: ST.conRep, rachaMedia: +(sR / Math.max(1, nR)).toFixed(2), rachas: nR,
    paresAcera, mismaVarianteAcera: mismaVarAcera, contiguosRepetidosAcera: repAcera, paresPegados: paresPeg, contiguosRepetidosPegados: repPeg,
    parcelas: ST.parc, sinSalida: ST.sinSalida || 0, grupos: NG, aticos: ST.atico, remontes: ST.remonte, chaflanes: chf.reduce((a, v) => a + v, 0), sinKit: ST.noKit,
    errMedioBarrios: +(gE / Math.max(1, barrios.length)).toFixed(2), errMedioPonderado: +(gW / Math.max(1, barrios.reduce((a, x) => a + x.ed, 0))).toFixed(2),
    errMaxBarrios: gX, chaflanesPorDistrito: chfD, chaflanesEixample, altura, remontesBcn: remB, remontesEsperadosBcn: Math.round(remEsp),
    aticosPct4: Object.fromEntries(Object.entries(atB).filter(([, o]) => o[1]).map(([k, o]) => [k, +(100 * o[1] / o[0]).toFixed(1)])), otroEstiloMedio: +(barrios.reduce((a, x) => a + x.otroEstilo, 0) / Math.max(1, barrios.length)).toFixed(1), otroEstiloSupMedio: +(barrios.reduce((a, x) => a + x.otroEstiloSup, 0) / Math.max(1, barrios.length)).toFixed(1), barriosSupMas20: barrios.filter(x => x.otroEstiloSup > 20).length,
    barriosOtroMas20: barrios.filter(x => x.otroEstilo > 20).length,
    repeticion: { normal: +(ST.repK[1] / Math.max(1, ST.repK[0])).toFixed(3), eixample: +(ST.repK[3] / Math.max(1, ST.repK[2])).toFixed(3), poligono: +(ST.repK[5] / Math.max(1, ST.repK[4])).toFixed(3) }, errMedioFrente: +(gF / Math.max(1, barrios.length)).toFixed(2), ms: [ms0, ms1, msL, ms2, performance.now() - t0].map(Math.round), barrios, periferia: per };
  // base64 de los planos (lo comprime Node)
  let s64 = ''; for (let i = 0; i < O.length; i += 0x8000) s64 += String.fromCharCode.apply(null, O.subarray(i, i + 0x8000));
  return { nB: NB, firma: ED.firma(BR.dv, NB), raw: btoa(s64), stats };
}

(async () => {
  const t0 = Date.now();
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 320, height: 200 } });
  p.on('pageerror', e => console.log('[pageerror]', e.message));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[' + m.type() + ']', m.text()); });
  await p.route('**/*', r => {
    const u = r.request().url();
    if (u.includes('babylonjs@')) return r.fulfill({ path: BABYLON, contentType: 'text/javascript' });
    if (u.includes('earcut@')) return r.fulfill({ path: EARCUT, contentType: 'text/javascript' });
    if (u.startsWith('http://local/')) { const f = path.join(DIR, decodeURIComponent(new URL(u).pathname)); if (fs.existsSync(f)) return r.fulfill({ path: f }); return r.fulfill({ status: 404, body: 'nf' }); }
    return r.abort();
  });
  await p.goto('http://local/index.html?edif=0#shot');
  await p.waitForFunction(() => window.BCN && (window.BCN.ready || window.BCN.error), null, { timeout: 1800000, polling: 1000 });
  const tl = Date.now();
  const out = await p.evaluate(generar);
  await b.close();
  const raw = Buffer.from(out.raw, 'base64'), z = zlib.deflateSync(raw, { level: 9 });
  const j = { v: 1, gen: 'tools/cc/generador.js', nB: out.nB, planos: 8, firma: out.firma, d: z.toString('base64') };
  const txt = JSON.stringify(j);
  fs.writeFileSync(path.join(DIR, 'data', 'condal_edif.json'), txt);
  const S = out.stats;
  console.log('condal_edif.json: ' + out.nB + ' edificios · ' + (txt.length / 1e3).toFixed(0) + ' kB (' + (raw.length / 1e3).toFixed(0) + ' kB sin comprimir) · firma ' + out.firma +
    ' · carga del juego ' + ((tl - t0) / 1000).toFixed(0) + ' s · cálculo ' + S.ms.join('/') + ' ms');
  const { barrios, periferia, ...g } = S;
  console.log(JSON.stringify(g));
  console.log('periferia: ' + periferia.ed + ' edificios; asignado % / mezcla %: ' + periferia.top.map(t => t[0] + ' ' + t[1] + '/' + t[2]).join(' · '));
  console.log('barrio · edificios · % de edificios con otro estilo que el de fachadas_pct · error medio (pp) · error máx (pp, estilo: asignado/fachadas_pct) · error medio de la mezcla sin corregir por altura · error medio de los que tienen frente de calle');
  for (const x of barrios.sort((a, c) => c.ed - a.ed)) console.log('  ' + x.n + ' · ' + x.ed + ' · ' + x.otroEstilo + ' (sup ' + x.otroEstiloSup + ') · ' + x.errMedio + ' · ' + x.errMax + ' (' + x.estiloMax + ': ' + x.asig + '/' + x.pct + ') · ' + x.errMezclaSinAltura);
})();
