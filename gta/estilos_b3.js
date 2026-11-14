/* GTA Barcelona · Condal City — ESTILOS del bloque 3 del kit (Fase 2c): torre / villa con jardín (2,2 %), racionalista y
   art déco (2,2 %), vivienda social actual (2,1 %), fábrica (1,7 %) y polígono de vivienda masiva (1,7 %).
   Cada estilo: comun (lo que comparten sus variantes) y 4 variantes con el nombre del catálogo del usuario
   (CONDAL_CITY_PROMPT.md, Parte 2 · A). Esquema de campos y ranuras: cabecera de kit.js. Paleta y desgaste base: los del
   catálogo (BCN_CONDAL.estilos); pal elige los colores de la paleta que usa cada variante. Las piezas: piezas_b3.js. */
(function () {
'use strict';
const KIT = window.BCN_KIT;
const PVC = [[226, 222, 210], [206, 198, 180], [140, 112, 84], [190, 190, 186]], ALU = [[168, 170, 168], [120, 100, 72], [196, 196, 190]];
const VERDE = [[43, 77, 51], [60, 92, 64], [52, 84, 70]], GRIS = [[84, 87, 69], [120, 118, 104], [96, 98, 96]];
const MADERA = [[64, 38, 20], [38, 28, 20], [36, 51, 41], [79, 48, 26]], ACERO = [[52, 56, 58], [70, 84, 78], [96, 60, 46]];

// ---------------------------------------------------------------- torre (1880–1950, 2–3 plantas): villa con jardín
// casa aislada tras verja de forja y jardín (palmera, buganvilla), tejado de teja con alero, torreón o mirador; sin comercio
KIT.estilo('torre', {
  nombre: 'Torre',
  comun: { hp: 3.4, bay: 3.6, win: 1.15, alto: 0.78, hueco: 'balconera', bal: 'indiv', balP: 0.45, vuelo: 0.6, bar: 'forja', forja: 1, carp: 'librillo',
    carpCol: VERDE.concat(GRIS), marco: MADERA, acab: 'estuco', remate: 0.6, imposta: 2, recerc: 2, ultimo: 'normal', coron: 'alero', mac: 0.5, ropa: 0,
    com: 0, pbH: 3.6, pbRec: 2.6, pbFr: 'frente_torre', pb: 'pb_torre', vano: 'vano_torre', corona: 'corona_torre',
    lejos: { muro: 'estuco', hp: 3.4, bay: 3.6, vidrio: 0.22 } },
  variantes: [
    { nombre: 'torre modernista', pl: [2, 3], pal: [0, 1, 3], hueco: 'ventana', recerc: 1, win: 1.0 },
    { nombre: 'villa novecentista', pl: [2, 3], pal: [0, 3], recerc: 3, balP: 0.8, fachada: ['pilastras'] },
    { nombre: 'casa señorial con torreón', pl: [2, 3], pal: [1, 2, 4], hueco: 'mixto', balP: 0.6 },
    { nombre: 'chalet regionalista', pl: [1, 2], pal: [2, 4], carp: 'porticon', carpCol: MADERA, recerc: 1, imposta: 1, bal: 'ninguno', hueco: 'ventana' }]
});

// ---------------------------------------------------------------- racionalista / déco (1928–1940, 4–7 plantas)
// volúmenes limpios de estuco blanco o crema, ventanas corridas, barandilla tubular, esquinas redondeadas; el déco con nervios
// verticales y relieves geométricos; portal con marquesina geométrica, ojos de buey; terrado transitable
KIT.estilo('racionalista_deco', {
  nombre: 'Racionalisme i art déco',
  comun: { hp: 3.0, bay: 3.4, win: 1.3, alto: 0.8, hueco: 'ventana', bal: 'ninguno', vuelo: 1.0, bar: 'tubo', carp: 'enrollable',
    carpCol: [[226, 222, 210], [200, 196, 186], [96, 110, 104]], marco: [[52, 56, 58], [90, 96, 92], [180, 182, 180]], acab: 'estuco', remate: 0.2,
    imposta: 0, recerc: 0, ultimo: 'normal', coron: 'peto', mac: 0.25, ropa: 0.05, com: 0.7, pb: 'pb_racionalista', vano: 'vano_racionalista',
    corona: 'corona_racionalista', lejos: { muro: 'estuco', hp: 3.0, bay: 3.4, vidrio: 0.4 } },
  variantes: [
    { nombre: 'racionalista blanco con ventanas corridas', pl: [4, 7], pal: [0, 2] },
    { nombre: 'déco con líneas verticales', pl: [5, 8], pal: [1, 3], bay: 3.2, carp: 'librillo', carpCol: VERDE.concat(GRIS), remate: 0.35, fachada: ['deco_lineas'],
      lejos: { vidrio: 0.32 } },
    { nombre: 'esquina redondeada', pl: [4, 7], pal: [0, 1, 3] },
    { nombre: 'bloque obrero tipo Casa Bloc', pl: [3, 6], pal: [1, 2], bay: 3.6, com: 0.2, fachada: ['reticula_hormigon'], lejos: { muro: 'hormigon', vidrio: 0.42 } }]
});

// ---------------------------------------------------------------- vivienda social actual (2000–hoy, 4–10 plantas)
// bloques sencillos e industrializados: color en persianas o paneles, celosías de chapa, madera, galerías; placas solares
KIT.estilo('vivienda_social_actual', {
  nombre: 'Habitatge social actual',
  comun: { hp: 2.95, bay: 3.2, win: 1.4, alto: 0.85, hueco: 'balconera', bal: 'ninguno', vuelo: 0.3, bar: 'tubo', carp: 'ninguna', carpCol: [[200, 200, 196]],
    marco: [[70, 74, 78], [140, 144, 146]], acab: 'estuco', remate: 0.1, imposta: 0, recerc: 0, ultimo: 'normal', coron: 'peto', mac: 0.15, ropa: 0.1,
    com: 0.5, pb: 'pb_vsa', vano: 'vano_vsa', corona: 'corona_vsa', lejos: { muro: 'estuco', hp: 2.95, bay: 3.2, vidrio: 0.38 } },
  variantes: [
    { nombre: 'bloque con persianas de colores', pl: [4, 9], pal: [0] },
    { nombre: 'bloque con celosía metálica', pl: [5, 10], pal: [0, 1, 4], lejos: { muro: 'hormigon', vidrio: 0.22 } },
    { nombre: 'bloque de madera industrializada', pl: [4, 8], acab: 'listones', paleta: ['#b48a5e', '#a67c50', '#c29a6c', '#8f6b48'], lejos: { muro: 'madera', vidrio: 0.36 } },
    { nombre: 'bloque con galería abierta', pl: [4, 8], pal: [0, 1, 3, 4], lejos: { vidrio: 0.25 } }]
});

// ---------------------------------------------------------------- fábrica (1850–1960, 1–5 plantas): nave o fábrica de ladrillo
// ladrillo macizo, ventanales de hierro con cuarterones bajo arcos rebajados, pilastras, diente de sierra, chimenea alta,
// portalón de carga, rótulo pintado, grafitis; a menudo loft rehabilitado
KIT.estilo('fabrica', {
  nombre: 'Fàbrica',
  comun: { hp: 4.0, bay: 4.4, win: 2.5, alto: 0.6, hueco: 'taller', bal: 'ninguno', bar: 'forja', carp: 'ninguna', carpCol: [[60, 60, 60]], marco: ACERO,
    acab: 'ladrillo', remate: 0.4, imposta: 2, recerc: 0, ultimo: 'normal', coron: 'frontis', mac: 0, ropa: 0, com: 0.3, pbH: 4.6, pb: 'pb_fabrica',
    vano: 'vano_fabrica', corona: 'corona_fabrica', fachada: ['fab_fachada'], lejos: { muro: 'ladrillo', hp: 4.0, bay: 4.4, vidrio: 0.45 } },
  variantes: [
    { nombre: 'nave en diente de sierra', pl: [1, 2], pal: [0, 1, 3] },
    { nombre: 'fábrica de varias plantas con chimenea', pl: [3, 5], pal: [0, 2, 4], win: 3.2, bay: 4.2 },
    { nombre: 'almacén con portalón', pl: [1, 3], pal: [1, 3], win: 1.6, bay: 4.8, lejos: { vidrio: 0.3 } },
    { nombre: 'loft rehabilitado', pl: [2, 5], pal: [0, 2, 4], marco: [[36, 38, 40], [44, 46, 48]], com: 0.7, dg: 0.35, lejos: { vidrio: 0.5 } }]
});

// ---------------------------------------------------------------- polígono (1955–1980, 5–14 plantas): vivienda masiva
// bloques lineales o torres entre espacios abiertos, repetición total de ventanas, hormigón y ladrillo, galerías de acceso,
// pilotis, ropa tendida, parabólicas, aires; terrado con casetón y depósitos de agua; grafitis en la planta baja
KIT.estilo('poligono', {
  nombre: 'Polígon d\'habitatges',
  comun: { hp: 2.75, bay: 3.0, win: 1.2, alto: 0.6, hueco: 'ventana', bal: 'ninguno', vuelo: 0.6, bar: 'tubo', carp: 'enrollable', carpCol: PVC, marco: ALU,
    acab: 'hormigon', remate: 0.15, imposta: 3, recerc: 0, ultimo: 'normal', coron: 'peto', mac: 0.1, ropa: 0.4, com: 0.15, pb: 'pb_poligono',
    vano: 'vano_poligono', corona: 'corona_poligono', fachada: ['pol_reticula', 'antenas'], lejos: { muro: 'hormigon', hp: 2.75, bay: 3.0, vidrio: 0.28 } },
  variantes: [
    { nombre: 'bloque lineal largo', pl: [5, 9], pal: [4], acab: 'ladrillo', lejos: { muro: 'ladrillo' } },
    { nombre: 'torre aislada', pl: [10, 16], pal: [0, 2], pbH: 4.2, pbRec: 2.4, pbFr: 'frente_pilotis', bay: 3.3 },
    { nombre: 'bloque en H', pl: [6, 12], pal: [1, 3], acab: 'estuco' },
    { nombre: 'bloque con galerías exteriores', pl: [5, 10], pal: [0, 2, 3] }]
});
})();
