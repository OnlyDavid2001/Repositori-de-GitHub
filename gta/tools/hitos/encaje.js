#!/usr/bin/env node
// Encaje de los hitos en el mapa del juego (etapa R2). Sin navegador.
//
//   python3 gta/tools/hitos/catalogo.py   → escribe tools/hitos/r1.json (fichas de R1, sin encaje)
//   node gta/tools/hitos/encaje.js        → escribe tools/hitos/encaje.json (x, z, y, edificios, en_datos, medidas)
//   python3 gta/tools/hitos/catalogo.py   → mezcla encaje.json en data/hitos_catalogo.json y HITOS.md
//
// Conversión lat/lon → mundo: el mundo del juego es UTM huso 31N (ETRS89) trasladado; basta una traslación,
// ajustada por mínimos cuadrados con los poi de data/meta.json (residuos en consola). Los índices de `edificios` son los
// de BREC en app.js (mismo orden: ficheros meta.stats.bfiles, trozos y edificios).
//
// Selección de los edificios de cada hito (tabla SEL; sin entrada, modo automático):
//   g: [raíces]          grupos explícitos (raíz + partes cuyo centroide cae dentro de la planta de la raíz)
//   rect: [w, l, rot]    todo edificio con el centroide dentro de ese rectángulo (centrado en el punto + d)
//   altas: {r, minH}     los grupos de altura ≥ minH a menos de r metros
//   no: 'texto'          no está en los datos (escultura, puente, fuente…): se queda en su coordenada
//   dudoso: 'texto'      no se puede decidir con los datos: se queda en su coordenada, confianza baja
//   d: [dx, dz]          desplaza el punto de búsqueda · medir: false → no tocar ancho/largo/rot del catálogo
'use strict';
const fs = require('fs'), path = require('path');
const D = require('./datos.js');
const ROOT = path.join(__dirname, '..', '..');
const META = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'meta.json'), 'utf8'));
const R1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'r1.json'), 'utf8')).hitos;

// ---------------------------------------------------------------- ajuste lat/lon → mundo
// poi del juego con coordenada conocida (Wikipedia); se excluyen Fòrum (no es el Edifici Fòrum), Sant Pau, Park Güell,
// y los poi de zona (Port Vell, Barceloneta…). Collserola y Sagrat Cor, con su posición exacta de meta.stats.
const REF = [['Sagrada Família', 41.40369, 2.17433], ['Torre Glòries', 41.40349, 2.18952], ['Camp Nou', 41.3808, 2.1228],
  ['Castell de Montjuïc', 41.3634, 2.1662], ['Palau Nacional (MNAC)', 41.36833, 2.15331], ['Arc de Triomf', 41.39111, 2.18056],
  ['Catedral', 41.3839, 2.1764], ['Hotel W', 41.36847, 2.19024], ['Estadi Olímpic', 41.36472, 2.15556],
  ['Estació de Sants', 41.3789, 2.1400], ['Plaça de Catalunya', 41.3870, 2.1700], ["Plaça d'Espanya", 41.3750, 2.1491]];
const PTS = REF.map(([n, la, lo]) => ({ n, ll: [la, lo], w: META.poi.find(q => q.n === n).p }))
  .map(p => ({ n: p.n, ll: p.ll, x: p.w[0], z: p.w[2] }));
PTS.push({ n: 'Torre de Collserola (meta.stats)', ll: [41.41722, 2.11417], x: META.stats.torre_collserola[0], z: META.stats.torre_collserola[1] });
PTS.push({ n: 'Sagrat Cor (meta.stats)', ll: [41.42208, 2.11886], x: META.stats.sagrat_cor[0], z: META.stats.sagrat_cor[1] });
let OX = 0, OZ = 0;
for (const p of PTS) { p.u = D.utm(p.ll[0], p.ll[1]); OX += p.x - p.u[0]; OZ += p.z - p.u[1]; }
OX /= PTS.length; OZ /= PTS.length;
const AJ = PTS.map(p => ({ n: p.n, ex: +(p.u[0] + OX - p.x).toFixed(1), ez: +(p.u[1] + OZ - p.z).toFixed(1) }));
const rms = Math.sqrt(AJ.reduce((s, a) => s + a.ex * a.ex + a.ez * a.ez, 0) / AJ.length);
const mundo = (lat, lon) => { const u = D.utm(lat, lon); return [u[0] + OX, u[1] + OZ]; };

// ---------------------------------------------------------------- datos del juego
const T = D.terreno();
const B = D.edificios(T.M.CH, META.stats.bfiles);
const cen = b => { let x = 0, z = 0; const m = b.ring.length / 2; for (let k = 0; k < m; k++) { x += b.ring[2 * k]; z += b.ring[2 * k + 1]; } return [x / m, z / m]; };
for (const b of B) b.c = cen(b);
// rejilla de 100 m para las búsquedas
const GR = new Map();
for (const b of B) for (let gx = Math.floor(b.x0 / 100); gx <= Math.floor(b.x1 / 100); gx++) for (let gz = Math.floor(b.z0 / 100); gz <= Math.floor(b.z1 / 100); gz++) {
  const k = gx * 1000 + gz; if (!GR.has(k)) GR.set(k, []); GR.get(k).push(b);
}
function caja(x0, z0, x1, z1) {
  const s = new Set();
  for (let gx = Math.floor(x0 / 100); gx <= Math.floor(x1 / 100); gx++) for (let gz = Math.floor(z0 / 100); gz <= Math.floor(z1 / 100); gz++)
    for (const b of GR.get(gx * 1000 + gz) || []) if (b.x1 > x0 && b.x0 < x1 && b.z1 > z0 && b.z0 < z1) s.add(b);
  return [...s];
}
// grupos: raíz (el volumen de más área) + partes cuyo centroide cae dentro de ella (edificios por partes de OSM)
function grupos(list) {
  const G = [];
  for (const b of [...list].sort((a, b) => b.area - a.area)) {
    const g = G.find(g => g.root.x0 <= b.c[0] && b.c[0] <= g.root.x1 && g.root.z0 <= b.c[1] && b.c[1] <= g.root.z1 && D.dentro(g.root.ring, b.c[0], b.c[1]));
    if (g) g.m.push(b); else G.push({ root: b, m: [b] });
  }
  for (const g of G) g.h = Math.max(...g.m.map(b => b.y1 - b.yb));
  return G;
}
const grupoDe = i => { const r = B[i]; return grupos(caja(r.x0, r.z0, r.x1, r.z1)).find(g => g.root === r) || { root: r, m: [r], h: r.y1 - r.yb }; };

// rectángulo mínimo (envolvente convexa + calibres rotatorios)
function rectMin(pts) {
  const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  const H = lo.slice(0, -1).concat(up.slice(0, -1));
  let best = null;
  for (let i = 0; i < H.length; i++) {
    const a = H[i], b = H[(i + 1) % H.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1e-6) continue;
    const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
    let s0 = 1e9, s1 = -1e9, t0 = 1e9, t1 = -1e9;
    for (const p of H) { const s = p[0] * ux + p[1] * uz, t = -p[0] * uz + p[1] * ux; s0 = Math.min(s0, s); s1 = Math.max(s1, s); t0 = Math.min(t0, t); t1 = Math.max(t1, t); }
    const A = (s1 - s0) * (t1 - t0);
    if (!best || A < best.A) {
      const sm = (s0 + s1) / 2, tm = (t0 + t1) / 2, cx = sm * ux - tm * uz, cz = sm * uz + tm * ux;
      const l1 = s1 - s0, l2 = t1 - t0;
      let rot = Math.atan2(l1 >= l2 ? ux : -uz, l1 >= l2 ? uz : ux) * 180 / Math.PI;   // rumbo del eje largo
      rot = ((rot % 180) + 180) % 180;
      best = { A, cx, cz, largo: Math.max(l1, l2), ancho: Math.min(l1, l2), rot };
    }
  }
  return best;
}

// ---------------------------------------------------------------- selección por hito
const SEL = {
  // lote a
  sagrada_familia: { g: [139156, 139173] },
  casa_lleo_morera: { g: [115079] },
  camp_nou: { medir: 'rot', nota: 'Las medidas de la planta de los datos (estadio viejo en obras) son menores que las del estadio acabado: se conservan las del catálogo; el rumbo, de los datos.' },
  park_guell: { rect: [130, 190, 340], medir: false, nota: 'Recinto: se cuentan los pabellones y construcciones del núcleo monumental (sala hipóstila, entrada); el banco y la plaza no son volúmenes.' },
  sant_pau: { rect: [290, 380, 0], minA: 40, medir: false, nota: 'Recinto modernista: se cuentan sus pabellones. El poi «Hospital de Sant Pau» del juego marca la Administració, ~150 m al S del centro.' },
  casa_punxes: { rect: [45, 75, 72] },
  pavellons_guell: { g: [90015] },
  teresianes: { dudoso: 'Hay varios volúmenes bajos (9–22 m) en la parcela y ninguno con la planta alargada de 18×65 m; candidatos: #124633 (995 m², 9 m), #124634 (469 m², 22 m), #124630 (411 m², 15 m).' },
  universitat: { rect: [90, 140, 45] },
  // lote b
  estadi_olimpic: { medir: false, nota: 'El volumen de los datos incluye la explanada (44 781 m²): se conservan medidas y rumbo del catálogo.' },
  torre_calatrava: { medir: false },
  pavello_mies: { medir: false },
  font_magica: { no: 'fuente: no hay volumen en los datos' },
  quatre_columnes: { no: 'columnas: no existen en los datos' },
  torres_venecianes: { g: [59064, 59060] },
  picornell: { g: [52385] },
  palaus_fira: { dudoso: 'La coordenada de cawiki cae en la explanada de la Font Màgica. Los palacios que flanquean la avenida tienen en los datos plantas grandes y bajas (11–29 m) que no se distinguen con seguridad de los pabellones de la Fira: #58992 (5 923 m², E), #60010 (7 499 m², O), #60012 (17 742 m², O).' },
  poble_espanyol: { rect: [160, 200, 0], minA: 25, medir: false },
  piscina_montjuic: { g: [60293], medir: false },
  // lote c
  hotel_arts: { g: [102614] },
  peix: { no: 'escultura sobre el zócalo del Hotel Arts; debajo hay el volumen bajo #102827 (2 878 m², 5 m)' },
  torres_caixa: { g: [90811, 90812] },
  pergola_forum: { no: 'pérgola: no existe en los datos' },
  diagonal_zerozero: { g: [161373], nota: 'Identificada por altura (110 m en los datos) junto al Edifici Fòrum; la coordenada de memoria se iba ~300 m.' },
  hotel_princess: { g: [161483, 176088], conf: 'media', nota: 'Identificado por altura (97 y 78 m en los datos) junto a la Diagonal ZeroZero: dos torres; confirmar con vista.' },
  torres_diagonal_mar: { altas: { r: 190, minH: 70 }, conf: 'media', medir: false, nota: 'Grupo: torres de vivienda de 75–87 m alrededor del Parc de Diagonal Mar; ancho/largo de cada torre, del catálogo.' },
  torre_mare_nostrum: { rect: [60, 100, 45], medir: false, nota: 'El rectángulo recoge la torre (60 m en los datos) y los volúmenes bajos del conjunto; revisar antes de ocultar.' },
  edificis_trade: { altas: { r: 80, minH: 33 } },
  melia_sky: { g: [159825, 159826, 159829], nota: 'Identificado por altura (116 m en los datos, Pere IV); la coordenada de memoria se iba ~360 m. Al lado, otra torre de ~100 m (#160161 y partes).' },
  disseny_hub: { rect: [50, 150, 45], medir: false },
  xemeneies_besos: { no: 'las tres chimeneas de 200 m no existen en los datos (posición: poi del juego)' },
  torre_aigues_besos: { g: [161363], medir: false },
  torre_melina: { g: [68831] },
  // lote d
  santa_maria_mar: { rect: [40, 88, 60] },
  santa_maria_pi: { g: [81910, 81900], medir: false, nota: 'Nave (#81910, 7 m en los datos) y campanario (#81900, 54 m).' },
  merce: { dudoso: 'La basílica no se distingue en los datos (manzana de volúmenes de 4–17 m, sin cúpula); el punto cae en #83401 (174 m², 17 m). Candidatos: #83401, #83404, #83405.' },
  arc_triomf: { g: [118700, 119010, 119009] },
  cascada: { g: [99108, 99109], medir: false },
  parlament: { rect: [70, 110, 45] },
  boqueria: { g: [79058, 79057, 79055] },
  drassanes: { rect: [90, 125, 45], minA: 100 },
  sant_jaume: { rect: [50, 130, 135], minA: 60, medir: false, nota: 'Dos palacios enfrentados (Generalitat al NO, Ajuntament al SE) con la plaza en medio: el rectángulo incluye manzanas vecinas del Gòtic; no sustituir sin mirar.' },
  born_ccm: { g: [99110] },
  duana: { g: [64248], conf: 'media', nota: 'Volumen bajo de 1 535 m² (11 m) a 54 m de la coordenada de memoria: es lo único que encaja; confirmar con vista.' },
  correus: { rect: [70, 85, 45], medir: false, nota: 'El rectángulo puede recoger volúmenes vecinos; revisar antes de ocultar.' },
  cap_barcelona: { no: 'escultura; la coordenada de memoria cae dentro de un edificio (#83377): está unos 30–60 m más al mar, en la acera del Passeig de Colom' },
  estel_ferit: { no: 'escultura sobre la arena: no existe en los datos' },
  llapis: { no: 'escultura: no existe en los datos (Cinc d\'Oros, cruce Diagonal / Passeig de Gràcia)' },
  rambla_mar: { no: 'pasarela: no existe en los datos' },
  // lote e
  torre_collserola: { medir: false },
  tibidabo_parc: { rect: [110, 180, 0], minA: 6, medir: false },
  monestir_pedralbes: { rect: [70, 100, 0] },
  palau_pedralbes: { g: [89909] },
  bunquers_carmel: { no: 'ruinas a ras de suelo: no hay volumen' },
  hotel_torre_catalunya: { g: [75229, 74364, 75227] },
  espanya_industrial: { g: [74347, 74346, 74352, 74351, 74349, 74242, 74348, 74350], nota: 'Las torres-faro del parque están en los datos como 8 pilares de 10 m (clase 4).' },
  mistos: { no: 'escultura: no existe en los datos; posición de memoria' },
  pont_bac_de_roda: { no: 'puente: no existe en los datos' },
  aeroport: { g: [607], nota: 'Terminal 1 (#607); la torre de control no está en los datos.' },
  ciutat_justicia: { altas: { r: 140, minH: 40 } },
  xemeneies_parallel: { g: [63105, 63106, 63107], nota: 'Las tres chimeneas están en los datos (clase 4, 72 m); la coordenada de memoria se iba ~180 m.' },
  fabra_coats: { rect: [110, 160, 0], minA: 30, medir: false },
  dona_ocell: { no: 'escultura: no existe en los datos' },
};

const fmt = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const NOM = { 12: '(Torre Glòries)', 13: '(Torre de Collserola)' };   // el resto, solo el número (PAL en app.js)

const out = { ajuste: { metodo: 'UTM 31N (ETRS89) + traslación', ox: +OX.toFixed(2), oz: +OZ.toFixed(2), rms: +rms.toFixed(1), residuos: AJ }, hitos: {} };
for (const f of R1) {
  const s = SEL[f.id] || {};
  let [x, z] = mundo(f.lat, f.lon);
  if (s.d) { x += s.d[0]; z += s.d[1]; }
  let G = [], modo;
  const R = Math.max(f.ancho, f.largo) / 2 + ({ alta: 40, media: 100, baja: 180 }[f.confianza]);
  if (s.no || s.dudoso) modo = s.no ? 'no' : 'dudoso';
  else if (s.g) { modo = 'g'; G = s.g.map(grupoDe); }
  else if (s.rect) {
    modo = 'rect'; const [w, l, rt] = s.rect, a = rt * Math.PI / 180, ux = Math.sin(a), uz = Math.cos(a);
    const r = Math.hypot(w, l) / 2;
    const L = caja(x - r, z - r, x + r, z + r).filter(b => {
      const dx = b.c[0] - x, dz = b.c[1] - z, s1 = dx * ux + dz * uz, t1 = -dx * uz + dz * ux;
      return Math.abs(s1) <= l / 2 && Math.abs(t1) <= w / 2 && b.area >= (s.minA || 0);
    });
    G = grupos(L);
  } else if (s.altas) {
    modo = 'altas'; const r = s.altas.r;
    G = grupos(caja(x - r, z - r, x + r, z + r)).filter(g => g.h >= s.altas.minH && Math.hypot(g.root.c[0] - x, g.root.c[1] - z) <= r);
  } else {
    const Gs = grupos(caja(x - R, z - R, x + R, z + R));
    const A0 = f.ancho * f.largo;
    const gin = Gs.find(g => D.dentro(g.root.ring, x, z));
    if (gin && gin.root.area >= 0.1 * A0 && gin.root.area <= 4 * A0) { modo = 'auto'; G = [gin]; }
    else if (f.alto >= 50) {
      const t = Gs.filter(g => g.h >= 0.5 * f.alto && Math.hypot(g.root.c[0] - x, g.root.c[1] - z) <= R).sort((a, b) => b.h - a.h)[0];
      if (t) { modo = 'auto-alto'; G = [t]; }
    }
    if (!modo) { modo = 'dudoso'; s.dudoso = 'selección automática sin candidato claro'; }
  }
  const e = { modo };
  const near = caja(x - 300, z - 300, x + 300, z + 300).length;
  if (G.length) {
    const bs = G.flatMap(g => g.m), pts = [];
    for (const b of bs) for (let k = 0; k < b.ring.length; k += 2) pts.push([b.ring[k], b.ring[k + 1]]);
    const r = rectMin(pts);
    const area = G.reduce((s, g) => s + g.root.area, 0), h = Math.max(...G.map(g => g.h));
    const cls = [...new Set(G.map(g => g.root.cls))];
    e.x = +r.cx.toFixed(1); e.z = +r.cz.toFixed(1);
    e.edificios = bs.map(b => b.i).sort((a, b) => a - b);
    e.planta = { ancho: Math.round(r.ancho), largo: Math.round(r.largo), rot: Math.round(r.rot), area: Math.round(area), alto: +h.toFixed(1), clases: cls };
    const partes = bs.length - G.length;
    e.en_datos = (G.length === 1 ? `1 volumen de ${fmt(area)} m² y ${fmt(h)} m` : `${G.length} volúmenes, ${fmt(area)} m² en total, hasta ${fmt(h)} m`)
      + (partes ? ` (+${partes} parte${partes > 1 ? 's' : ''} de OSM)` : '') + `; clase ${cls.map(c => c + ' ' + (NOM[c] || '')).join(', ').trim()}`;
    e.mover = Math.round(Math.hypot(e.x - x, e.z - z));
    if (s.medir !== false) { e.rot = e.planta.rot; if (s.medir !== 'rot') { e.ancho = e.planta.ancho; e.largo = e.planta.largo; } }
  } else {
    e.x = +x.toFixed(1); e.z = +z.toFixed(1); e.edificios = [];
    e.en_datos = 'no existe' + (s.no ? ': ' + s.no : s.dudoso ? ' con seguridad: ' + s.dudoso : '');
  }
  e.y = +T.heightAt(e.x, e.z).toFixed(1);
  if (s.dudoso) e.confianza = 'baja';
  else if (s.conf) e.confianza = s.conf;
  else if (/^(auto|g)/.test(modo) && f.confianza !== 'alta') e.confianza = 'alta';
  if (!near) e.fuera = true;
  if (s.nota) e.nota = s.nota;
  out.hitos[f.id] = e;
}
fs.writeFileSync(path.join(__dirname, 'encaje.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`ajuste: ox ${OX.toFixed(1)} oz ${OZ.toFixed(1)} · rms ${rms.toFixed(1)} m · máx ${Math.max(...AJ.map(a => Math.hypot(a.ex, a.ez))).toFixed(1)} m`);
for (const f of R1) {
  const e = out.hitos[f.id];
  console.log([f.id, e.modo, e.x, e.z, e.y, e.mover ?? '-', e.planta ? `${e.planta.ancho}x${e.planta.largo}@${e.planta.rot} h${e.planta.alto}` : '-',
    `cat ${f.ancho}x${f.largo}@${f.rot} h${f.alto}`, e.edificios.length].join(' | '));
}
