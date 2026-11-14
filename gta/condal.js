/* Barcelona: Condal City · Fase 1 — datos reales por punto (window.BCN_CONDAL).
   Lee data/condal.json (lo genera tools/cc/empaquetar.py a partir de condal_city_datos.json; el juego no lee el JSON grande ni
   usa la red) y responde en O(1) con tres rejillas en coordenadas del mundo: secciones censales (12,5 m), comercio (150 m) y
   perfiles de periferia (100 m). Se carga antes que los edificios (app.js espera BCN_CONDAL.ready antes de leerlos).
   window.BCN_CONDAL = {
     ready                 promesa: datos cargados (la descarga empieza al cargar este fichero, en paralelo con el resto)
     loaded                ¿listo?
     at(x, z, out?)        → { zona: 'bcn' | 'periferia' | 'industrial' | null (sin edificios en 300 m: mar, pistas, campo), seccion (id «distrito-sección» o null), seccionIdx,
                              barrio (nombre o null), barrioIdx (índice en META.barris; −1 fuera), barrioRef (el de referencia,
                              también fuera de Barcelona), distrito, mezcla (Float32Array 22: probabilidad de cada estilo, suma 1;
                              0,7 sección + 0,3 barrio, con menos peso de sección si tiene < 30 edificios), detalles ({clave: 0–1}
                              del barrio), negocios ([{id, n, e (escaparate), q (cuota 0–1)}] de mayor a menor), locales (locales
                              activos en la celda de 150 m), densidad (locales/ha = locales / 2,25) }
                           mezcla, detalles y negocios son objetos compartidos: no los modifiques. Fuera del mundo o sin datos
                           cargados: null. Pensado para posiciones de edificio: todo edificio tiene zona; en la orilla del mar o
                           junto a la pista puede salir 'periferia' (con densidad 0), así que no sirve para saber si hay tierra.
                           Comercio: en las celdas de 150 m a caballo del límite, locales reales + los estimados de la parte de fuera.
     estilos[22]           {id, n, pl [mín, máx] plantas, an [mín, máx] m, pal ['#hex'], dg desgaste_base}
     escaparates[24]       ids de modelo · negocios[59] {id, n, e} · detalles[11] claves de detalles_prob
     barrios[73]           {c codigo, n, m (META), d distrito, e edificios, mezcla, plantas (Float32Array 10), detalles, negocios, la}
     toLonLat(x, z) → [lon, lat] · fromLonLat(lon, lat) → [x, z]     (UTM 31N, series de Krüger; = tools/cc/geo_utm.js)
     top(mezcla, k)        → los k estilos más probables [[i, p], …]
     debug                 herramienta F8 (la inicia app.js con initDebug(ctx)): barrio, sección, mezcla, comercio y estilo del
                           edificio que hay delante de la cámara; ?condal=1 la abre al cargar }
   Coste por fotograma: cero (at() son tres lecturas de array; la ventana F8 se refresca 4 veces por segundo solo si está abierta). */
(function () {
'use strict';
// ---------------------------------------------------------------- [lon, lat] <-> mundo (la misma fórmula que tools/cc/geo_utm.js)
const GEO = (() => {
  const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996, E0 = 500000, LON0 = 3 * Math.PI / 180;
  const OX = 418400.7, OZ = 4567997.6;
  const n = f / (2 - f), n2 = n * n, n3 = n2 * n, n4 = n3 * n, n5 = n4 * n, n6 = n5 * n;
  const A = a / (1 + n) * (1 + n2 / 4 + n4 / 64 + n6 / 256);
  const al = [0,
    n / 2 - 2 * n2 / 3 + 5 * n3 / 16 + 41 * n4 / 180 - 127 * n5 / 288 + 7891 * n6 / 37800,
    13 * n2 / 48 - 3 * n3 / 5 + 557 * n4 / 1440 + 281 * n5 / 630 - 1983433 * n6 / 1935360,
    61 * n3 / 240 - 103 * n4 / 140 + 15061 * n5 / 26880 + 167603 * n6 / 181440,
    49561 * n4 / 161280 - 179 * n5 / 168 + 6601661 * n6 / 7257600,
    34729 * n5 / 80640 - 3418889 * n6 / 1995840,
    212378941 * n6 / 319334400];
  const be = [0,
    n / 2 - 2 * n2 / 3 + 37 * n3 / 96 - n4 / 360 - 81 * n5 / 512 + 96199 * n6 / 604800,
    n2 / 48 + n3 / 15 - 437 * n4 / 1440 + 46 * n5 / 105 - 1118711 * n6 / 3870720,
    17 * n3 / 480 - 37 * n4 / 840 - 209 * n5 / 4480 + 5569 * n6 / 90720,
    4397 * n4 / 161280 - 11 * n5 / 504 - 830251 * n6 / 7257600,
    4583 * n5 / 161280 - 108847 * n6 / 3991680,
    20648693 * n6 / 638668800];
  const de = [0,
    2 * n - 2 * n2 / 3 - 2 * n3 + 116 * n4 / 45 + 26 * n5 / 45 - 2854 * n6 / 675,
    7 * n2 / 3 - 8 * n3 / 5 - 227 * n4 / 45 + 2704 * n5 / 315 + 2323 * n6 / 945,
    56 * n3 / 15 - 136 * n4 / 35 - 1262 * n5 / 105 + 73814 * n6 / 2835,
    4279 * n4 / 630 - 332 * n5 / 35 - 399572 * n6 / 14175,
    4174 * n5 / 315 - 144838 * n6 / 6237,
    601676 * n6 / 22275];
  const R = Math.PI / 180, e = Math.sqrt(f * (2 - f));
  // [lon, lat] grados -> [E, N]
  function toUTM(lon, lat) {
    const ph = lat * R, l = lon * R - LON0;
    const t = Math.sinh(Math.atanh(Math.sin(ph)) - e * Math.atanh(e * Math.sin(ph)));
    const xi_ = Math.atan2(t, Math.cos(l)), eta_ = Math.atanh(Math.sin(l) / Math.sqrt(1 + t * t));
    let xi = xi_, eta = eta_;
    for (let j = 1; j <= 6; j++) { xi += al[j] * Math.sin(2 * j * xi_) * Math.cosh(2 * j * eta_); eta += al[j] * Math.cos(2 * j * xi_) * Math.sinh(2 * j * eta_); }
    return [E0 + k0 * A * eta, k0 * A * xi];
  }
  // [E, N] -> [lon, lat] grados
  function fromUTM(E, N) {
    const xi = N / (k0 * A), eta = (E - E0) / (k0 * A);
    let xi_ = xi, eta_ = eta;
    for (let j = 1; j <= 6; j++) { xi_ -= be[j] * Math.sin(2 * j * xi) * Math.cosh(2 * j * eta); eta_ -= be[j] * Math.cos(2 * j * xi) * Math.sinh(2 * j * eta); }
    const chi = Math.asin(Math.sin(xi_) / Math.cosh(eta_));
    let ph = chi; for (let j = 1; j <= 6; j++) ph += de[j] * Math.sin(2 * j * chi);
    const l = Math.atan2(Math.sinh(eta_), Math.cos(xi_));
    return [(LON0 + l) / R, ph / R];
  }
  const lonLatToGame = (lon, lat) => { const [E, N] = toUTM(lon, lat); return [E - OX, N - OZ]; };   // -> [x, z]
  const gameToLonLat = (x, z) => fromUTM(x + OX, z + OZ);                                           // -> [lon, lat]
  return { toUTM, fromUTM, lonLatToGame, gameToLonLat, OX, OZ };
})();

const C = window.BCN_CONDAL = { loaded: false, ready: null, at, top, toLonLat: GEO.gameToLonLat, fromLonLat: GEO.lonLatToGame,
  estilos: null, escaparates: null, negocios: null, detalles: null, barrios: null, secciones: null, perif: null, stats: {}, initDebug };
let SEC = null, COM = null, PER = null, RS = null, RC = null, RP = null, SECS = null, PERF = null, BARS = null, WX = 0, WZ = 0;

async function u16(b64) {
  const bin = atob(b64), u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const ab = await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer();
  return new Uint16Array(ab);
}
const frac = a => { const o = new Float32Array(a.length); let s = 0; for (const v of a) s += v; for (let i = 0; i < a.length; i++) o[i] = s > 0 ? a[i] / s : 0; return o; };

C.ready = (async () => {
  const t0 = performance.now();
  const res = await fetch('data/condal.json');
  if (!res.ok) throw new Error('No se pudo cargar data/condal.json (' + res.status + ')');
  const D = await res.json();
  const t1 = performance.now();
  C.estilos = D.estilos; C.escaparates = D.escaparates; C.detalles = D.detalles;
  C.negocios = D.negocios.map((t, i) => ({ id: i, n: t[0], e: t[1] }));
  const negList = ng => ng.map(([i, q]) => ({ id: i, n: C.negocios[i].n, e: C.negocios[i].e, q: q / 10000 }));
  BARS = C.barrios = D.barrios.map(b => {
    const det = {}; D.detalles.forEach((k, i) => { det[k] = b.dp[i] / 1000; });
    return { c: b.c, n: b.n, m: b.m, d: b.d, di: b.di, e: b.e, la: b.la, lt: b.lt, mezcla: frac(b.f), plantas: frac(b.pl), detalles: Object.freeze(det),
      negocios: Object.freeze(negList(b.ng)) };
  });
  const S = D.secciones, N = S.id.length; SECS = C.secciones = new Array(N);
  for (let k = 0; k < N; k++) SECS[k] = { id: S.id[k], b: S.b[k], e: S.e[k], mezcla: frac(S.mz.slice(k * 22, k * 22 + 22)) };
  PERF = C.perif = D.perif.p.map(([b, banda, ind, mz, ng]) => ({ b, banda, ind: !!ind, mezcla: frac(mz), negocios: ng ? Object.freeze(negList(ng)) : BARS[b].negocios }));
  RS = D.rej.sec; RC = D.rej.com; RP = D.rej.per; WX = RS.c * RS.nx; WZ = RS.c * RS.nz;
  [SEC, COM, PER] = await Promise.all([u16(RS.d), u16(RC.d), u16(RP.d)]);
  RS.d = RC.d = RP.d = null;
  C.loaded = true;
  C.stats = { descargaMs: Math.round(t1 - t0), decodMs: Math.round(performance.now() - t1), secciones: N, barrios: BARS.length, perfilesPeriferia: PERF.length };
  return C;
})();
C.ready.catch(() => {});   // app.js recibe el rechazo con su await; esto evita el «Uncaught (in promise)» si falla antes

function at(x, z, out) {
  if (!C.loaded || !(x >= 0 && z >= 0 && x < WX && z < WZ)) return null;
  const o = out || {};
  const s = SEC[((z / RS.c) | 0) * RS.nx + ((x / RS.c) | 0)];
  let B;
  if (s) {
    const S = SECS[s - 1]; B = BARS[S.b];
    o.zona = 'bcn'; o.seccion = S.id; o.seccionIdx = s - 1; o.barrio = B.n; o.barrioIdx = B.m; o.mezcla = S.mezcla; o.negocios = B.negocios;
  } else {
    const p = PER[((z / RP.c) | 0) * RP.nx + ((x / RP.c) | 0)];
    o.seccion = null; o.seccionIdx = -1; o.barrio = null; o.barrioIdx = -1;
    if (!p) { o.zona = null; o.barrioRef = null; o.distrito = null; o.mezcla = null; o.detalles = null; o.negocios = null; o.locales = 0; o.densidad = 0; return o; }
    const P = PERF[p - 1]; B = BARS[P.b];
    o.zona = P.ind ? 'industrial' : 'periferia'; o.mezcla = P.mezcla; o.negocios = P.negocios;
  }
  o.barrioRef = B.n; o.distrito = B.d; o.detalles = B.detalles;
  const n = COM[((z / RC.c) | 0) * RC.nx + ((x / RC.c) | 0)] / RC.k;
  o.locales = n; o.densidad = n / 2.25;
  return o;
}
function top(m, k) { const r = []; if (!m) return r; for (let i = 0; i < m.length; i++) r.push([i, m[i]]); r.sort((a, b) => b[1] - a[1] || a[0] - b[0]); return r.slice(0, k || 3); }

// ---------------------------------------------------------------- depuración (F8)
// Ventana arriba a la izquierda con el barrio, la sección, la mezcla de estilos, el comercio y el estilo del edificio que hay
// delante de la cámara (rayo desde la cámara contra las plantas de los edificios, con ctx.city de facades.js). Hasta la Fase 3 el
// estilo es el del generador actual (familia de barrio y variante de fachadas_estilos.js); el campo del nuevo queda preparado.
function initDebug(ctx) {
  if (C.debug) return C.debug;
  const css = document.createElement('style');
  css.textContent = '#ccDbg{position:fixed;top:12px;left:12px;z-index:5;max-width:min(470px,calc(100vw - 24px));padding:9px 12px;border-radius:10px;' +
    'background:rgba(10,14,20,.86);border:1px solid rgba(255,194,71,.55);color:#f3f1ea;font:12px/1.42 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;' +
    'font-variant-numeric:tabular-nums;pointer-events:none;display:none}#ccDbg b{color:#ffc247;font-weight:600}#ccDbg .h{font-size:14px;font-weight:700}' +
    '#ccDbg .d{color:#b9c0c7}#ccDbg .k{display:inline-block;min-width:74px;color:#b9c0c7}';
  document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'ccDbg'; document.body.appendChild(el);
  let on = false, timer = 0; const q = {};
  const pct = v => (v * 100).toLocaleString('es-ES', { maximumFractionDigits: v < 0.1 ? 1 : 0 }) + '\u00a0%';   // sin cortar «6,7 %»
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  const corto = n => n.split(/ \/ | \(/)[0];
  // edificio delante de la cámara: se avanza por el rayo a pasos de 1,5 m (hasta 400 m) y se para en la primera planta que lo
  // contiene por debajo de su techo; si el rayo toca el suelo antes, el edificio más cercano a ese punto (≤ 12 m)
  function front() {
    const city = ctx.city; if (!city) return null;
    const P = ctx.cam.position, st = ctx.st, cp = Math.cos(st.pitch);
    const fx = Math.sin(st.yaw) * cp, fy = -Math.sin(st.pitch), fz = Math.cos(st.yaw) * cp;
    for (let t = 0.5; t < 400; t += 1.5) {
      const x = P.x + fx * t, y = P.y + fy * t, z = P.z + fz * t;
      if (!(x >= 0 && z >= 0 && x < ctx.WX && z < ctx.WZ)) break;
      const c = city.cellOf(x, z), A = city.ALL, BB = city.BB;
      for (let k = A.start[c]; k < A.start[c + 1]; k++) {
        const b = A.list[k]; if (BB[b * 4] > x || BB[b * 4 + 2] < x || BB[b * 4 + 1] > z || BB[b * 4 + 3] < z) continue;
        const d = city.bget(b); if (y <= d.y1 + 0.3 && y >= d.yb - 3 && city.inside(d, x, z)) return { b, t, d };
      }
      if (y < ctx.heightAt(x, z) - 0.3) {
        let best = null, bd = 12;
        for (let k = A.start[c]; k < A.start[c + 1]; k++) { const b = A.list[k], cx = (BB[b * 4] + BB[b * 4 + 2]) / 2, cz = (BB[b * 4 + 1] + BB[b * 4 + 3]) / 2;
          const dd = Math.hypot(Math.max(0, Math.abs(x - cx) - (BB[b * 4 + 2] - BB[b * 4]) / 2), Math.max(0, Math.abs(z - cz) - (BB[b * 4 + 3] - BB[b * 4 + 1]) / 2));
          if (dd < bd) { bd = dd; best = b; } }
        return best == null ? null : { b: best, t, d: city.bget(best), suelo: true };
      }
    }
    return null;
  }
  function refresh() {
    if (!on) return;
    const P = ctx.cam.position, h = [];
    const f = front(), px = f ? (ctx.city.BB[f.b * 4] + ctx.city.BB[f.b * 4 + 2]) / 2 : P.x, pz = f ? (ctx.city.BB[f.b * 4 + 1] + ctx.city.BB[f.b * 4 + 3]) / 2 : P.z;
    const r = at(px, pz, q), ll = GEO.gameToLonLat(px, pz);
    h.push('<div class="h">Condal City <span class="d">· F8</span></div>');
    h.push('<div class="d">' + (f ? 'edificio delante, a ' + Math.round(f.t) + ' m' : 'bajo la cámara') + ' · ' + ll[0].toFixed(5) + ', ' + ll[1].toFixed(5) + '</div>');
    if (!r || !r.zona) h.push('<div><span class="k">Zona</span>sin datos (fuera del mapa o sin edificios cerca: mar, pistas, campo)</div>');
    else {
      if (r.zona === 'bcn') {
        h.push('<div><span class="k">Barrio</span><b>' + esc(r.barrio) + '</b> <span class="d">(' + esc(r.distrito) + ')</span></div>');
        const S = SECS[r.seccionIdx];
        h.push('<div><span class="k">Sección</span>' + esc(r.seccion) + ' <span class="d">· ' + S.e + ' edificios</span></div>');
      } else h.push('<div><span class="k">Zona</span><b>' + (r.zona === 'industrial' ? 'periferia industrial' : 'periferia') + '</b> <span class="d">(perfil sintético; ref. ' + esc(r.barrioRef) + ')</span></div>');
      h.push('<div><span class="k">Estilos</span>' + top(r.mezcla, 3).map(([i, p]) => esc(C.estilos[i].n).replace(/ /g, '\u00a0') + '\u00a0' + pct(p)).join(' · ') + '</div>');
      h.push('<div><span class="k">Comercio</span>' + r.densidad.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' locales/ha <span class="d">(' +
        r.locales.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' en la celda de 2,25 ha' + (r.zona !== 'bcn' ? ', estimado' : '') + ')</span></div>');
      const vac = r.negocios.find(n => /^Local vac/.test(n.n));   // «Local vacío» aparte: no es un negocio que se vea
      h.push('<div><span class="k">Negocios</span>' + r.negocios.filter(n => n !== vac).slice(0, 4).map(n => esc(corto(n.n)).replace(/ /g, '\u00a0') + '\u00a0' + pct(n.q)).join(' · ') +
        (vac ? ' <span class="d">· vacíos\u00a0' + pct(vac.q) + '</span>' : '') + '</div>');
    }
    if (f) {
      const fx = ctx.mods && ctx.mods.fx, V = fx && fx.varOf ? fx.varOf(f.b) : null, fam = fx && fx.famOf ? fx.famOf(f.b) : null;
      const BR = ctx.BREC, nuevo = BR && BR.estilo ? C.estilos[BR.estilo[f.b]] : null;
      const tipo = BR && BR.elig[f.b] ? ['vivienda', 'nave', 'equipamiento'][BR.tipo[f.b]] || '?' : 'sin fachada de detalle';
      h.push('<div><span class="k">Edificio</span>#' + f.b + ' · ' + Math.round(f.d.y1 - f.d.yb) + ' m · clase ' + f.d.cls + ' · ' + tipo + '</div>');
      const elig = !BR || !BR.elig || !!BR.elig[f.b];
      h.push('<div><span class="k">Estilo hoy</span>' + (!elig ? '<span class="d">' + (fam ? esc(fam) + ' · ' : '') + 'sin variante (no tiene fachada de detalle)</span>' : V ? '<b>' + esc(fam || V.fam || '?') + '</b> · variante ' + esc(String(V.id || '?').replace(/:(\d+)$/, (m, d) => ' ' + (+d + 1))) + (V.acab ? ' <span class="d">(' + esc(V.acab) + ')</span>' : '') : '<span class="d">' + (fam ? esc(fam) + ' · ' : '') + 'sin variante (fachada genérica)</span>') + '</div>');
      // Fase 3a: estilo y variante asignados (precalculados en data/condal_edif.json, o del selector provisional si no casa)
      const KT = window.BCN_KIT, PR = window.BCN_EDIF, ok = PR && PR.ok && !(KT && KT.forced), vk = KT && KT.variante ? KT.variante(f.b) : null;
      h.push('<div><span class="k">Estilo nuevo</span>' + (nuevo ? '<b>' + esc(nuevo.n) + '</b>' + (BR.varEst ? ' · variante ' + (BR.varEst[f.b] + 1) + (vk && vk.nombre ? ' <span class="d">(' + esc(vk.nombre) + ')</span>' : '') : '') +
        ' <span class="d">' + (ok ? '· precalculado' : KT && KT.forced ? '· escaparate' : '· selector provisional') + '</span>' : '<span class="d">— (sin estilo: no es vivienda o no hay datos)</span>') + '</div>');
      if (nuevo && ok) { const rm = PR.remonte(f.b), fr = PR.frente(f.b);
        h.push('<div><span class="k">Generador</span>color ' + (PR.col(f.b) + 1) + ' · ' + PR.parcelas(f.b) + (PR.parcelas(f.b) > 1 ? ' parcelas' : ' parcela') +
          (PR.atico(f.b) ? ' · ático' : '') + (rm[0] ? ' · remonte de ' + rm[0] + (rm[0] > 1 ? ' plantas' : ' planta') + ' (' + ['ladrillo', 'estuco', 'cemento', 'panel'][rm[1]] + ')' : '') +
          (PR.chaflan(f.b) ? ' · chaflán' : '') + ' · desgaste ' + Math.round(PR.dg(f.b) * 100) + ' %' +
          ' <span class="d">· ' + (fr & 1 ? (fr & 2 ? 'repite el estilo del vecino de la acera' : 'acera') + (fr & 4 ? ', avenida' : '') : 'sin frente de calle') + '</span></div>'); }
    }
    el.innerHTML = h.join('');
  }
  const set = v => { on = !!v; el.style.display = on ? 'block' : 'none'; clearInterval(timer); timer = 0; if (on) { refresh(); timer = setInterval(refresh, 250); } };
  addEventListener('keydown', e => { if (e.code === 'F8') { e.preventDefault(); set(!on); } });
  C.debug = { show: set, toggle: () => set(!on), refresh, front, get on() { return on; } };
  if (new URLSearchParams(location.search).get('condal') === '1') set(true);
  return C.debug;
}
})();
