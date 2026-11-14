/* GTA Barcelona · Condal City — KIT MODULAR DE FACHADAS (Fase 2): registro de estilos y piezas, selector provisional y
   escaparate de estilos. Se carga después de fachadas_estilos.js y antes de los ficheros de estilos y piezas por bloque
   (estilos_b1.js, piezas_b1.js…) y de facades.js.

   window.BCN_KIT = {
     estilo(id, def)      registra un estilo del catálogo (ids de BCN_CONDAL.estilos) con sus 4 variantes (ver ESQUEMA)
     pieza(nombre, fn)    registra una pieza (función de geometría) con un nombre único; P[nombre] la devuelve
     acabado(nombre, k)   da de alta un acabado de muro nuevo (V.acab = nombre → tipo de material K k)
     E, P, BASE, ACAB     estilos registrados, piezas, valores por defecto del esquema, acabados propios
     T                    caja de herramientas de facades.js (wr, rail, ropa, planter, galeriaV, tribunaV, vano, vidAux, KW…);
                          la rellena facades.js al iniciarse: las piezas la usan en tiempo de construcción, nunca al cargar
     init(n), elige(b, cls, seed, x, z, Hm, fam)   selector provisional al cargar (palette.js): estilo y variante por edificio y color
                          de la paleta del estilo; EST[b] (índice del catálogo, 255 = ninguno) y VAR[b] (0–3) → BREC.estilo / varEst
     variante(b)          variante del kit del edificio b (objeto congelado) o null (estilo aún sin kit: la familia de antes)
     medidas(q[, V])      hueco de siempre de un vano de piso: { vent, Vw, tt, ct, st, yt, Bh, jt (vuelo del balcón) }
     lejos(b)             parámetros para el volumen lejano (Fase 3 → FS_BLD): { muro, hp, bay, vidrio }
     forced, force(id, v) escaparate de estilos: ?estilo=<id>&v=<0..3> al cargar, o BCN.fx.force('estilo:<id>:<v>') en marcha
     pbForce              ?pb=0 (todas las plantas bajas del estilo, sin comercio) · ?pb=1 (con comercio donde quepa)
   }

   ESQUEMA de una variante (los campos que falten salen de comun del estilo y después de BASE). Son los de
   fachadas_estilos.js (bay, hp, win, alto, hueco, bal, princ, balP, vuelo, bar, forja, carp, carpCol, marco, acab, remate,
   imposta, recerc, pil, esgr, ultimo, coron, trib, ropa, mac, cw) y además:
     nombre    nombre de la variante (el del catálogo del usuario)
     pl        [mín, máx] plantas preferidas: el selector pesa la variante por la altura real del edificio
     pal       índices de la paleta del estilo que usa esta variante (p. ej. solo los rojos del ladrillo); null = todos
     paleta    ['#hex', …] paleta propia de la variante (cuando el catálogo no trae su material, p. ej. ladrillo en autarquía)
     dg        desgaste propio (si no, el desgaste_base del estilo); se le suma el desgaste_extra del barrio
     noble     planta noble (1.ª): { f: factor de altura de planta, …campos que cambian solo en esa planta }
     chaflan   campos que cambian en los tramos de chaflán (tramo de 5–24 m a ~45° entre dos tramos casi perpendiculares)
     aticoP    probabilidad de ático retranqueado (la coronación pasa a 'atico'; regla 5)
     pb        pieza de PLANTA BAJA del estilo (no comercial): se llama en cada vano de calle que no es comercio y en el portal
     pbH       alto de la planta baja (m) en vez de 4,3 / 3,25 · pbRec: la planta baja se retranquea pbRec m (soportales,
               pilotis, patio delantero) y la pieza pbFr (si hay) dibuja el frente (pilares, arcos, verja)
     com       factor de comercio del estilo (0–1) sobre la densidad comercial real del sitio (provisional hasta la Fase 4)
     vano      pieza de vano de piso (calle) · corona: pieza de coronación (calle) · fachada: [piezas] por tramo de calle
     tribChf   F2R: tribuna de piedra en el eje del chaflán (plantas 1–3)
     par       F2R: parcelas virtuales pintadas de par vanos (color de la paleta por parcela y bajante en la medianera)
     sinPeto   true: rooftops.js no pone el peto de la azotea (la coronación del estilo ya pone un tejado a la calle)
     lejos     { muro: 'estuco'|'ladrillo'|'piedra'|'hormigon'|'vidrio'|'travertino'|'madera', hp, bay, vidrio (fracción de hueco) }

   RANURAS (todas reciben (env, run, q); si devuelven false, el generador hace lo de siempre):
     pb      q = { W, a, c, bw, gl (acera), yB, rr[6], portal (bool), F (marco: el del tramo o el retranqueado), esquina }
     pbFr    q = { a, bw, gl, yB, dep (retranqueo), W, nb } — un vano del frente de los soportales
     vano    q = { V (variante de esa planta: noble incluida), D, W, nb, bw, a, c, k, P, m, top, low, atico, tipo, corr, rr[12], nF,
                   gl (acera delante del vano), esquina }
             T.vano(env, run, q) dibuja el vano de siempre (para piezas que solo añaden algo); la barandilla sale de q.V
             (T.rail(env, F, e0, e1, y, jt, sl, sr, vw, V): V opcional, si no env.V)
     corona  q = { cr, nb, bw } · T.corona(env, run, q) dibuja la coronación de siempre (V.coron) · fachada: q = { nb, bw }
     esquina -1 / 1: el vano es el primero / último del tramo y ahí el tramo vecino es de calle y gira más de ~30° (esquina
             real, run.esq0 / run.esq1); 0 en los demás
     env.chaflan  índice del tramo de chaflán del edificio (-1 si no tiene) · run.chaflan: este tramo es el chaflán
   Rangos de tipos de material K del kit: 160–167 núcleo · 168–175 bloque 1 · 176–183 bloque 2 · 184–191 bloque 3 · 192–199
   bloque 4. Los que sean MURO reciben el desgaste de los paños (facades.js) si el paño sale de T.wr.
   Cómo se añade un estilo o una pieza: DESARROLLO.md §16 y gta/tools/encargos/progreso/CC_F2a.md. */
(function () {
'use strict';
const GEO = window.BCN_GEO;
const LEG = window.BCN_FX_ESTILOS;

const BASE = Object.freeze(Object.assign({}, LEG ? LEG.BASE : {}, {
  nombre: '', pl: null, pal: null, dg: null, noble: null, chaflan: null, aticoP: 0, pb: null, pbH: null, pbRec: 0, pbFr: null,
  com: 1, vano: null, corona: null, fachada: null, sinPeto: false, lejos: Object.freeze({ muro: 'estuco', hp: 3.1, bay: 3.6, vidrio: 0.3 }) }));

const E = {}, P = {}, ACAB = {};
const hx = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
function hb(b, s, k) {
  let h = Math.imul(b ^ 0x7f4a7c15, 0x85ebca6b) ^ Math.imul(s + 0x165667b1, 0xc2b2ae35) ^ Math.imul(k + 0x27d4eb2f, 0x9e3779b1);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

function estilo(id, def) {
  if (E[id]) throw new Error('BCN_KIT.estilo: estilo repetido: ' + id);
  if (!def || !Array.isArray(def.variantes) || def.variantes.length !== 4) throw new Error('BCN_KIT.estilo(' + id + '): hacen falta 4 variantes');
  const V = def.variantes.map((v, i) => {
    const o = Object.assign({}, BASE, def.comun || {}, v, { kit: true, estilo: id, vi: i, id: id + ':' + i, fam: 'kit' });
    o.lejos = Object.freeze(Object.assign({}, BASE.lejos, (def.comun || {}).lejos, v.lejos));
    if (o.noble) o.nobleV = Object.freeze(Object.assign({}, o, o.noble, { noble: null }));
    if (o.chaflan) { o.chaflanV = Object.freeze(Object.assign({}, o, o.chaflan, { chaflan: null }));
      if (o.nobleV) o.chaflanV = Object.freeze(Object.assign({}, o.chaflanV, { nobleV: Object.freeze(Object.assign({}, o.nobleV, o.chaflan)) })); }
    return Object.freeze(o);
  });
  E[id] = { id, nombre: def.nombre || id, V, paleta: def.paleta || null };
}
function pieza(nombre, fn) {
  if (P[nombre]) throw new Error('BCN_KIT.pieza: pieza repetida: ' + nombre);
  if (typeof fn !== 'function') throw new Error('BCN_KIT.pieza(' + nombre + '): no es una función');
  P[nombre] = fn;
}
function acabado(nombre, k) { if (ACAB[nombre] !== undefined) throw new Error('BCN_KIT.acabado: repetido: ' + nombre); ACAB[nombre] = k; }

// ---------------------------------------------------------------- escaparate de estilos (URL)
const Q = new URLSearchParams(location.search);
const API = { E, P, BASE, ACAB, T: null, estilo, pieza, acabado, EST: null, VAR: null, forced: null, pbForce: null, hb };
if (Q.get('estilo')) API.forced = { id: Q.get('estilo'), v: Q.get('v') !== null ? (+Q.get('v') | 0) & 3 : -1 };
if (Q.get('pb') === '0' || Q.get('pb') === '1') API.pbForce = +Q.get('pb');

// ---------------------------------------------------------------- selector provisional (al cargar; la Fase 3 lo precalcula)
// Estilo: al azar ponderado por la mezcla de la sección y el barrio (BCN_CONDAL.at en el centro de la caja) por la
// compatibilidad de la altura real con las plantas del estilo (fuera de rango, ×0,2 por planta de diferencia).
// Variante: ponderada por sus plantas preferidas. Color: uno de la paleta del estilo (o de la variante), ±8 % de luminosidad y
// ±5 % de tono. Solo viviendas (clases 0 y 6); el resto sigue con la paleta y las tipologías de antes.
let CI = null, IX = null; const tmp = {};
function mapa() {
  const C = window.BCN_CONDAL; if (!C || !C.estilos) return false;
  CI = {}; IX = C.estilos.map((e, i) => { CI[e.id] = i; return e; });
  for (const id in E) if (CI[id] === undefined) console.error('BCN_KIT: el estilo «' + id + '» no está en el catálogo');
  return true;
}
const compat = (n, pl) => !pl ? 1 : n < pl[0] ? Math.pow(0.2, pl[0] - n) : n > pl[1] ? Math.pow(0.2, n - pl[1]) : 1;
API.plantas = Hm => Math.max(1, Math.round((Hm - 5.15) / 3.05) + 1);
API.init = function (n) { API.EST = new Uint8Array(n).fill(255); API.VAR = new Uint8Array(n); mapa(); };
// F2R: núcleo de identidad por familia de barrio (hasta que la Fase 3 precalcule los estilos con la chuleta por barrio): en el
// Eixample, Ciutat Vella, el Raval, la Barceloneta y Gràcia, los estilos propios del barrio suman al menos esa fracción del
// peso (ya ponderado por la altura), para que las calles icónicas no pierdan su carácter con la mezcla de la sección
const NUCLEO = {
  eixample: [['eixample_temprano', 'eixample_ornamentado', 'modernista', 'noucentista', 'neoclasico'], 0.9],
  ciutat_vella: [['gotico', 'barroco', 'neoclasico', 'casa_obrera_xix', 'quart_de_casa', 'eixample_temprano'], 0.9],
  raval: [['casa_obrera_xix', 'barroco', 'neoclasico', 'eixample_temprano'], 0.85],
  barceloneta: [['quart_de_casa', 'casa_obrera_xix'], 0.8],
  gracia: [['casa_obrera_xix', 'modernista', 'eixample_temprano', 'noucentista', 'pueblo'], 0.6],
};
let NUI = null;
function nucleo(w, m, nP, fam) {
  const N = fam && NUCLEO[fam]; if (!N) return;
  if (!NUI) { NUI = {}; for (const f in NUCLEO) NUI[f] = NUCLEO[f][0].map(id => CI[id]).filter(i => i !== undefined); }
  const ids = NUI[fam]; let si = 0;
  for (const i of ids) { if (!(w[i] > 0)) w[i] = Math.max(m[i], 0.02) * compat(nP, IX[i].pl) * 0.1; si += w[i]; }
  let rest = 0; for (let i = 0; i < w.length; i++) if (ids.indexOf(i) < 0) rest += w[i];
  if (!(si > 0) || si / (si + rest) >= N[1]) return;
  const f = N[1] * rest / ((1 - N[1]) * si); for (const i of ids) w[i] *= f;
}
API.elige = function (b, cls, seed, x, z, Hm, fam) {
  if (!API.EST || (cls !== 0 && cls !== 6)) return null;
  if (!IX && !mapa()) return null;
  const nP = API.plantas(Hm), F = API.forced;
  let si = -1;
  if (F && E[F.id] && CI[F.id] !== undefined) si = CI[F.id];
  else {
    const r = window.BCN_CONDAL.at(x, z, tmp); if (!r || !r.mezcla) return null;
    const m = r.mezcla; let s = 0; const w = tmp._w || (tmp._w = new Float32Array(m.length));
    for (let i = 0; i < m.length; i++) w[i] = m[i] * compat(nP, IX[i].pl);
    nucleo(w, m, nP, fam);
    for (let i = 0; i < m.length; i++) s += w[i];
    if (!(s > 0)) return null;
    let q = hb(b, seed, 11) * s; si = m.length - 1;
    for (let i = 0; i < m.length; i++) { q -= w[i]; if (q < 0) { si = i; break; } }
  }
  API.EST[b] = si;
  const ES = E[IX[si].id]; if (!ES) return null;               // estilo aún sin kit: paleta y familia de antes
  let vi;
  if (F && F.v >= 0 && E[F.id]) vi = F.v;
  else { let s = 0; const w = ES.V.map(v => { const c = compat(nP, v.pl); s += c; return c; }); let q = hb(b, seed, 12) * s; vi = 3;
    for (let i = 0; i < 4; i++) { q -= w[i]; if (q < 0) { vi = i; break; } } }
  API.VAR[b] = vi;
  const V = ES.V[vi], pal = V.paleta || ES.paleta || IX[si].pal, ids = V.paleta ? pal.map((_, i) => i) : V.pal || pal.map((_, i) => i);
  const c = hx(pal[ids[(hb(b, seed, 13) * ids.length) | 0]]);
  const kl = 0.92 + 0.16 * hb(b, seed, 14), kt = (hb(b, seed, 15) - 0.5) * 0.1;
  return [c[0] * kl * (1 + kt), c[1] * kl, c[2] * kl * (1 - kt)];
};
API.variante = function (b) {
  if (!API.EST || !IX) return null;
  const si = API.EST[b]; if (si === 255) return null;
  const ES = E[IX[si].id]; return ES ? ES.V[API.VAR[b]] : null;
};
// F2R: color de la parcela virtual g (V.par vanos por parcela) de un tramo: paleta del estilo, paso primo con su tamaño para
// que dos parcelas vecinas no repitan; la parcela 0 conserva el color horneado del volumen
const PALC = {};
API.colPar = function (env, run, g) {
  if (!g) return run.wallC;
  const V = env.V, ES = E[V.estilo]; if (!ES || !IX) return run.wallC;
  const key = V.id, pal = PALC[key] || (PALC[key] = (V.paleta || ES.paleta || IX[CI[V.estilo]].pal).map(hx)), n = pal.length;
  if (n < 2) return run.wallC;
  let st = 1 + ((hb(env.b, 0, 37) * (n - 1)) | 0); while (gcd(st, n) !== 1) st = st % (n - 1) + 1;
  const c = pal[(((hb(env.b, run.i, 31) * n) | 0) + g * st) % n], k = (g % 2 ? 0.8 : 1.06) + 0.08 * hb(env.b, g, 41 + run.i);   // F2R2: alterna claro / oscuro
  return [c[0] * k, c[1] * k, c[2] * k];
};
const gcd = (a, b) => b ? gcd(b, a % b) : a;
API.lejos = function (b) { const V = API.variante(b); return V ? V.lejos : null; };
API.indice = id => (CI || (mapa() && CI) || {})[id];
// escaparate en marcha: solo cambia la geometría de detalle (el color del volumen es el horneado al cargar)
API.force = function (id, v) { API.forced = id ? { id, v: v === undefined ? -1 : v & 3 } : null; };

// medidas del hueco de siempre de un vano de piso (las mismas reglas que T.vano, sin el ventanal de taller): para las piezas
// que añaden algo alrededor del hueco (frontones, recercados, cajones de persiana)
API.medidas = function (q, V) {
  V = V || q.V; const { k, m, bw, c, low, tipo, corr } = q;
  const vent = !low && !corr && (V.hueco === 'ventana' || (V.hueco === 'mixto' && q.W % 2 === 1));
  const Vw = Math.min(V.win * (vent ? 1.12 : tipo === 'terraza' ? 1.3 : 1), bw - (tipo === 'terraza' ? 0.7 : 0.95));
  let Bh, Qy;
  if (low) { Bh = Math.min(1.5, m - 1.15); Qy = Math.min(0.85, m - Bh - 0.32); }
  else if (vent) { Qy = 0.9; Bh = Math.min(1.45, m - 1.35); }
  else { Qy = 0.08; Bh = tipo === 'terraza' ? Math.min(2.5, m - 0.42) : Math.min(2.45, m * V.alto); }
  const jt = tipo === 'terraza' ? Math.min(1.15, V.vuelo) : V.vuelo + (q.D === 1 && !corr ? 0.25 : 0) + (q.D === 1 && corr ? 0.15 : 0);
  return { vent, Vw, tt: c - Vw / 2, ct: c + Vw / 2, st: k + Qy, yt: k + Qy + Bh, Bh, jt };
};
// ---------------------------------------------------------------- piezas del núcleo del kit (geometría compartida)
const { K, quad, rect, jamb, hpl, box, shade, pbrAux } = GEO;
// enjuta de arco entre u0 y u1 (arranque ys, clave yk, alto total hasta yt) a profundidad d, con el intradós (cara de abajo)
// hacia dentro hasta d1; seg = 0 medio punto · > 0 arco rebajado (flecha seg × luz)
pieza('arco', function (B, F, u0, u1, ys, yt, d, d1, col, k, seg) {
  if (!B) return; const c = (u0 + u1) / 2, r = (u1 - u0) / 2, n = 8, f = seg ? Math.min(1, seg * 2) : 1;
  let pu = u0, py = ys;
  for (let i = 1; i <= n; i++) { const a = Math.PI * (1 - i / n), u = c + Math.cos(a) * r, y = ys + Math.sin(a) * r * f;
    quad(B, F, pu, py, d, u, y, d, u, yt, d, pu, yt, d, col, k);
    quad(B, F, pu, py, d1, u, y, d1, u, y, d, pu, py, d, shade(col, 0.72), k);
    pu = u; py = y; }
});
// frontón triangular (o curvo, curvo = true) sobre un hueco, de ancho w centrado en c, base en y
pieza('fronton', function (B, F, c, w, y, h, d, col, k, curvo) {
  if (!B) return; const a = c - w / 2, b = c + w / 2;
  box(B, F, a, b, y, y + 0.09, 0, d, col, k);
  if (curvo) { const n = 6; let pu = a, py = y + 0.09;
    for (let i = 1; i <= n; i++) { const t = Math.PI * (1 - i / n), u = c + Math.cos(t) * w / 2, yy = y + 0.09 + Math.sin(t) * h;
      quad(B, F, pu, py, d, u, yy, d, u, yy + 0.1, d, pu, py + 0.1, d, col, k); hpl(B, F, Math.min(pu, u), Math.max(pu, u), Math.max(py, yy) + 0.1, 0, d, shade(col, 1.04), k); pu = u; py = yy; }
    return; }
  quad(B, F, a, y + 0.09, d * 0.6, b, y + 0.09, d * 0.6, c, y + 0.09 + h, d * 0.6, c, y + 0.09 + h, d * 0.6, shade(col, 0.95), k);
  quad(B, F, a - 0.04, y + 0.09, d, c, y + 0.13 + h, d, c, y + 0.24 + h, d, a - 0.04, y + 0.2, d, col, k);
  quad(B, F, c, y + 0.13 + h, d, b + 0.04, y + 0.09, d, b + 0.04, y + 0.2, d, c, y + 0.24 + h, d, col, k);
});
// aparato de aire acondicionado (condensadora) colgado bajo un alféizar o en un balcón: caja clara con rejilla
pieza('aire', function (B, F, u, y, d) {
  if (!B) return; box(B, F, u, u + 0.78, y, y + 0.55, d, d + 0.3, [214, 214, 208], K.PBR, 7, pbrAux(0.5, 0.1, 0, 0));
  box(B, F, u + 0.08, u + 0.5, y + 0.07, y + 0.48, d + 0.3, d + 0.31, [70, 72, 74], K.PBR, 1, pbrAux(0.6, 0.3, 1, 0));
  box(B, F, u + 0.05, u + 0.73, y - 0.06, y, d, d + 0.28, [120, 122, 120], K.METAL, 7);
});
// antena parabólica (plato y brazo), en barandillas y cornisas
pieza('parabolica', function (B, F, u, y, d, r) {
  if (!B) return; r = r || 0.3; box(B, F, u - 0.02, u + 0.02, y, y + r * 1.4, d, d + 0.05, [120, 120, 118], K.METAL, 7);
  const c = [222, 222, 216], cy = y + r * 1.4;
  quad(B, F, u - r, cy - r * 0.7, d + 0.22, u + r, cy - r * 0.7, d + 0.12, u + r, cy + r * 0.7, d + 0.12, u - r, cy + r * 0.7, d + 0.22, c, K.PBR, pbrAux(0.45, 0.2, 0, 0));
});
// cajón de persiana enrollable (PVC o aluminio) sobre el hueco, saliente del muro
pieza('cajon', function (B, F, u0, u1, y, col) { if (B) box(B, F, u0 - 0.05, u1 + 0.05, y, y + 0.24, 0, 0.07, col || [226, 224, 216], K.PBR, 7, pbrAux(0.45, 0, 1, 0)); });
// jardinera corrida de obra con plantas colgantes (terrazas burguesas): frente de la jardinera a d, de u0 a u1
pieza('jardinera', function (B, F, u0, u1, y, d, col, r) {
  if (!B) return; box(B, F, u0, u1, y, y + 0.55, d - 0.4, d, col, K.STUCCO, 7);
  const n = Math.max(1, Math.round((u1 - u0) / 0.7));
  for (let i = 0; i < n; i++) { const u = u0 + (u1 - u0) * (i + 0.5) / n, h = 0.35 + ((r * 97 + i * 31) % 1) * 0.5, w = 0.32 + ((r * 13 + i * 7) % 1) * 0.2;
    box(B, F, u - w, u + w, y + 0.5, y + 0.85, d - 0.36, d - 0.02, [62, 96, 52], K.LEAF, 7);
    if ((r * 7 + i * 0.37) % 1 < 0.6) rect(B, F, u - w * 0.8, u + w * 0.6, y + 0.55 - h, y + 0.58, d + 0.03, [54, 88, 46], K.LEAF); }
});
// placas solares inclinadas (vistas de canto sobre un peto), de u0 a u1, apoyadas en y, retiradas dr del frente
pieza('placas', function (B, F, u0, u1, y, dr) {
  if (!B) return; const n = Math.max(1, Math.floor((u1 - u0) / 1.1));
  for (let i = 0; i < n; i++) { const a = u0 + (u1 - u0) * i / n + 0.05, b = u0 + (u1 - u0) * (i + 1) / n - 0.05;
    quad(B, F, a, y + 0.2, -dr, b, y + 0.2, -dr, b, y + 0.85, -dr - 0.75, a, y + 0.85, -dr - 0.75, [36, 48, 74], K.PBR, pbrAux(0.18, 0.5, 2, 0));
    box(B, F, a + 0.1, a + 0.15, y, y + 0.2, -dr - 0.05, -dr, [150, 152, 154], K.METAL, 7); box(B, F, b - 0.15, b - 0.1, y, y + 0.2, -dr - 0.05, -dr, [150, 152, 154], K.METAL, 7); }
});
// pérgola: vigas de madera o metal desde el muro hasta d, a altura y, de u0 a u1
pieza('pergola', function (B, F, u0, u1, y, d, col) {
  if (!B) return; const n = Math.max(2, Math.round((u1 - u0) / 0.6));
  for (let i = 0; i <= n; i++) { const u = Math.min(u1 - 0.07, u0 + (u1 - u0) * i / n); box(B, F, u, u + 0.07, y, y + 0.16, 0, d, col, K.WOOD, 7); }
  box(B, F, u0, u1, y - 0.12, y, d - 0.1, d, col, K.WOOD, 7);
});
// lamas de celosía (verticales u horizontales) en un panel de u0 a u1, y0 a y1, frente a d
pieza('lamas', function (B, F, u0, u1, y0, y1, d, col, k, vert, paso) {
  if (!B) return; paso = paso || 0.16;
  if (vert) { for (let u = u0; u < u1 - 0.02; u += paso) box(B, F, u, Math.min(u1, u + 0.045), y0, y1, d - 0.08, d, col, k, 7); }
  else for (let y = y0; y < y1 - 0.02; y += paso) box(B, F, u0, u1, y, Math.min(y1, y + 0.04), d - 0.08, d, col, k, 3);
});
// urna decorativa sobre un pedestal (balaustradas noucentistas)
pieza('urna', function (B, F, u, y, d, col) {
  if (!B) return; box(B, F, u - 0.12, u + 0.12, y, y + 0.1, d - 0.12, d + 0.12, col, K.STUCCO, 7);
  box(B, F, u - 0.17, u + 0.17, y + 0.1, y + 0.42, d - 0.17, d + 0.17, col, K.STUCCO, 7);
  box(B, F, u - 0.09, u + 0.09, y + 0.42, y + 0.6, d - 0.09, d + 0.09, shade(col, 1.04), K.STUCCO, 7);
});

window.BCN_KIT = API;
})();
