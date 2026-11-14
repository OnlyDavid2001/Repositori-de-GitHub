/* GTA Barcelona · Condal City — ESTILOS del bloque 4 del kit (Fase 2d): los minoritarios pero muy característicos —
   neoclásico / isabelino (1,3 %), casa gremial barroca (0,9 %), quart de casa de la Barceloneta (0,7 %), gótico civil (0,7 %)
   y casas baratas (0,7 %). Cada estilo: comun (lo que comparten sus variantes) y 4 variantes con el nombre del catálogo del
   usuario (CONDAL_CITY_PROMPT.md, Parte 2 · A). Esquema de campos y ranuras: cabecera de kit.js. Paleta y desgaste base: los
   del catálogo (BCN_CONDAL.estilos). Las piezas: piezas_b4.js.
   Anchos estrechos (quart de casa 4–5 m, casas baratas 4–6 m): hasta que la Fase 3 parta las fachadas en parcelas, cada vano
   (o pareja de vanos) hace de parcela con su color, su puerta y su bajante. */
(function () {
'use strict';
const KIT = window.BCN_KIT;
const VERDE = [[43, 77, 51], [60, 92, 64], [52, 84, 70]], MARRON = [[84, 56, 34], [107, 77, 48], [70, 48, 32]], GRIS = [[84, 87, 69], [120, 118, 104], [96, 98, 96]];
const MADERA = [[64, 38, 20], [38, 28, 20], [36, 51, 41], [79, 48, 26]], CAD = [[150, 120, 70], [120, 88, 52], [60, 92, 64]];
const AZUL = [[52, 84, 120], [70, 110, 150]], ROJO = [[140, 60, 48], [120, 52, 44]];

// ---------------------------------------------------------------- neoclásico / isabelino (1830–1870, 4–6 plantas)
// fachada ordenada y simétrica, balcones alineados con hierro fundido, pilastras, molduras clásicas, a veces pórticos;
// planta baja de soportales o grandes huecos; cornisa clásica marcada, a veces balaustrada
KIT.estilo('neoclasico', {
  nombre: 'Neoclàssic',
  comun: { hp: 3.3, bay: 3.0, win: 1.05, alto: 0.84, hueco: 'balconera', bal: 'indiv', balP: 1, vuelo: 0.55, bar: 'forja', forja: 0, carp: 'librillo',
    carpCol: VERDE.concat(GRIS), marco: MADERA, acab: 'estuco', remate: 0.5, imposta: 2, recerc: 2, ultimo: 'bajo', coron: 'cornisa', mac: 0.25,
    ropa: 0.05, com: 0.9, pbH: 4.8, pb: 'pb_neoclasico', vano: 'vano_neoclasico', noble: { f: 1.12, recerc: 3, alto: 0.86 }, chaflan: { bal: 'corrido' },
    lejos: { muro: 'estuco', hp: 3.3, bay: 3.0, vidrio: 0.32 } },
  variantes: [
    { nombre: 'edificio porticado', pl: [4, 6], pbRec: 3.2, pbH: 5.4, pbFr: 'frente_arcos', coron: 'balaustrada', com: 1, imposta: 1 },
    { nombre: 'fachada simétrica con pilastras', pl: [4, 6], bay: 3.2, fachada: ['pilastras'], recerc: 2, imposta: 1, carpCol: GRIS },
    { nombre: 'casa con relieves alegóricos', pl: [4, 5], recerc: 3, carpCol: MARRON, balP: 0.8, hueco: 'mixto' },
    { nombre: 'edificio con balcón corrido en planta principal', pl: [5, 6], ultimo: 'normal', noble: { f: 1.16, princ: 'corrido', recerc: 3, forja: 1, vuelo: 0.8, alto: 0.88 },
      imposta: 2, coron: 'cornisa' }]
});

// ---------------------------------------------------------------- casa gremial barroca (1600–1790, 3–5 plantas, 5–9 m)
// fachada estrecha de estuco o piedra, balcones de forja pequeños, esgrafiados geométricos ocres; obrador con portalón de
// madera y dintel de piedra; cornisa sencilla, a veces golfes
KIT.estilo('barroco', {
  nombre: 'Casa gremial',
  comun: { hp: 2.9, bay: 2.7, win: 0.9, alto: 0.72, hueco: 'balconera', bal: 'indiv', balP: 0.85, vuelo: 0.45, bar: 'forja', forja: 0, carp: 'porticon',
    carpCol: MARRON.concat(VERDE), marco: MADERA, acab: 'estuco', remate: 0.45, imposta: 1, recerc: 1, ultimo: 'normal', coron: 'cornisa', mac: 0.55,
    ropa: 0.4, com: 0.7, par: 2, pbH: 3.9, pb: 'pb_barroco', vano: 'vano_barroco', corona: 'corona_barroco', lejos: { muro: 'estuco', hp: 2.9, bay: 2.7, vidrio: 0.26 } },
  variantes: [
    { nombre: 'casa gremial con esgrafiados', pl: [3, 5], acab: 'esgrafiat', recerc: 2 },
    { nombre: 'casa de 2 balcones de forja', pl: [3, 5], bay: 3.3, win: 1.0, vuelo: 0.6, forja: 1, balP: 1, acab: 'piedra', carpCol: VERDE, lejos: { muro: 'piedra' } },
    { nombre: 'casa con golfes', pl: [3, 5], ultimo: 'bajo', carp: 'alicantina', carpCol: CAD },
    { nombre: 'esquina con hornacina de santo', pl: [3, 5], balP: 1, imposta: 2 }]
});

// ---------------------------------------------------------------- quart de casa (Barceloneta, 1753–1930, 3–5 plantas, 4–5 m)
// fachadas muy estrechas de un balcón por planta, colores vivos, remontes de otro aspecto; puerta de vivienda, bodega o bar
// de pescado; terrado con tendedero
KIT.estilo('quart_de_casa', {
  nombre: 'Quart de casa',
  comun: { hp: 2.8, bay: 4.4, win: 1.1, alto: 0.8, hueco: 'balconera', bal: 'indiv', balP: 1, vuelo: 0.5, bar: 'forja', forja: 0, carp: 'librillo',
    carpCol: VERDE.concat(AZUL), marco: MADERA, acab: 'estuco', remate: 0.35, imposta: 1, recerc: 1, ultimo: 'normal', coron: 'peto', mac: 0.6, ropa: 0.6,
    com: 0.6, pbH: 3.3, pb: 'pb_quart', vano: 'vano_quart', corona: 'corona_quart', lejos: { muro: 'estuco', hp: 2.8, bay: 4.4, vidrio: 0.3 } },
  variantes: [
    { nombre: 'quart de casa original', pl: [3, 4] },
    { nombre: 'quart de casa con remonte moderno', pl: [4, 5], carpCol: VERDE },
    { nombre: 'dos quarts unidos', pl: [3, 5], noble: { f: 1.0, princ: 'corrido' }, carp: 'alicantina', carpCol: CAD.concat(AZUL) },
    { nombre: 'esquina con bar', pl: [3, 5], com: 0.8, carpCol: AZUL.concat(ROJO) }]
});

// ---------------------------------------------------------------- gótico civil (s. XIII–XVI, 2–4 plantas)
// sillería, pocas ventanas pequeñas e irregulares, ventanas geminadas con columnita, portalón de medio punto que da a un patio;
// alero simple o galería de arcos en la última planta; escudo, farol de forja, gárgolas, rejas
KIT.estilo('gotico', {
  nombre: 'Gòtic civil',
  comun: { hp: 3.7, bay: 4.2, win: 0.8, alto: 0.6, hueco: 'ventana', bal: 'ninguno', balP: 0, vuelo: 0.3, bar: 'forja', forja: 0, carp: 'porticon',
    carpCol: [[70, 48, 30], [56, 40, 28], [84, 60, 40]], marco: MADERA, acab: 'piedra', remate: 0.4, imposta: 1, recerc: 0, ultimo: 'normal', coron: 'cornisa',
    mac: 0.15, ropa: 0.05, com: 0.5, pbH: 4.6, pb: 'pb_gotico', vano: 'vano_gotico', corona: 'corona_gotico', lejos: { muro: 'piedra', hp: 3.7, bay: 4.2, vidrio: 0.14 } },
  variantes: [
    { nombre: 'palacio con patio y escalera exterior', pl: [3, 4], bay: 4.6, pbH: 5.4, com: 0.3 },
    { nombre: 'casa estrecha de piedra con ventana geminada', pl: [2, 4], bay: 3.6, par: 2 },
    { nombre: 'casa con galería de arcos en el último piso', pl: [3, 4] },
    { nombre: 'muro ciego con portalón y escudo', pl: [2, 3], com: 0 }]
});

// ---------------------------------------------------------------- casas baratas (hileras obreras, 1929–1950, 1–2 plantas)
// hileras de casitas iguales y humildes, puerta y ventana, encaladas o de colores; vivienda (algún bar de esquina); tejado bajo
// a una o dos aguas
KIT.estilo('casas_baratas', {
  nombre: 'Cases barates',
  comun: { hp: 2.8, bay: 2.5, win: 1.0, alto: 0.7, hueco: 'ventana', bal: 'ninguno', balP: 0, vuelo: 0.3, bar: 'tubo', carp: 'librillo',
    carpCol: VERDE.concat(AZUL, [[120, 90, 60]]), marco: MADERA, acab: 'encalat', remate: 0.2, imposta: 0, recerc: 0, ultimo: 'normal', coron: 'peto', mac: 0.4,
    ropa: 0.2, com: 0, pbH: 3.0, pb: 'pb_casas_baratas', vano: 'vano_casas_baratas', corona: 'corona_casas_baratas', sinPeto: true,
    lejos: { muro: 'estuco', hp: 2.8, bay: 2.5, vidrio: 0.18 } },
  variantes: [
    { nombre: 'casita original encalada', pl: [1, 1], paleta: ['#f2ece0', '#f6f2ea', '#ece4d4', '#f0eadc'] },
    { nombre: 'casita reformada con piso añadido', pl: [2, 2], acab: 'estuco', sinPeto: false },
    { nombre: 'casita con patio', pl: [1, 1], pbRec: 2.2, pbFr: 'cb_patio', paleta: ['#f2ece0', '#f6f2ea', '#ece4d4', '#f0eadc'] },
    { nombre: 'esquina con bar', pl: [1, 2], acab: 'estuco', com: 0.3 }]
});
})();
