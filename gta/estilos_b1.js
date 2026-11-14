/* GTA Barcelona · Condal City — ESTILOS del bloque 1 del kit (Fase 2a), por peso real en la ciudad: desarrollismo (26 %),
   pueblo (9,9 %), contemporáneo (8,7 %), burgués 60–70 (7,3 %), autarquía (7,1 %) y noucentista (6,2 %).
   Cada estilo: comun (lo que comparten sus variantes) y 4 variantes con el nombre del catálogo del usuario
   (CONDAL_CITY_PROMPT.md, Parte 2 · A). Esquema de campos y ranuras: cabecera de kit.js. Paleta y desgaste base: los del
   catálogo (BCN_CONDAL.estilos); pal elige los colores de la paleta que usa cada variante. Las piezas: piezas_b1.js. */
(function () {
'use strict';
const KIT = window.BCN_KIT;
// tonos de carpintería y cierres
const PVC = [[226, 222, 210], [206, 198, 180], [140, 112, 84], [190, 190, 186]], ALU = [[168, 170, 168], [120, 100, 72], [196, 196, 190]];
const VERDE = [[43, 77, 51], [60, 92, 64], [52, 84, 70]], MARRON = [[84, 56, 34], [107, 77, 48], [70, 48, 32]], GRIS = [[84, 87, 69], [120, 118, 104], [96, 98, 96]];
const MADERA = [[64, 38, 20], [38, 28, 20], [36, 51, 41], [79, 48, 26]], CAD = [[150, 120, 70], [120, 88, 52], [60, 92, 64]];
const OSCURA = [[70, 48, 30], [56, 40, 28], [96, 70, 46]], LAMAS = [[150, 110, 70], [120, 86, 56], [190, 186, 176], [96, 100, 104]];

// ---------------------------------------------------------------- desarrollismo (1958–1980, 6–12 plantas)
// ladrillo visto rojizo, cantos de forjado vistos, persianas enrollables de PVC con cajón, aluminio, terrazas (muchas cerradas)
KIT.estilo('desarrollismo', {
  nombre: 'Bloc del desarrollisme',
  comun: { hp: 2.85, bay: 3.2, win: 1.2, alto: 0.8, hueco: 'mixto', bal: 'indiv', balP: 0.55, vuelo: 0.85, bar: 'tubo', carp: 'enrollable',
    carpCol: PVC, marco: ALU, acab: 'ladrillo', remate: 0.3, imposta: 3, recerc: 0, ultimo: 'normal', coron: 'peto', ropa: 0.25, mac: 0.25,
    aticoP: 0.3, pb: 'pb_desarrollismo', vano: 'vano_desarrollismo', fachada: ['antenas'], chaflan: { bal: 'terraza' },
    lejos: { muro: 'ladrillo', hp: 2.85, bay: 3.2, vidrio: 0.35 } },
  variantes: [
    { nombre: 'bloque de ladrillo con terrazas', pl: [5, 9], pal: [0, 1, 2, 3] },
    { nombre: 'bloque con galerías cerradas de aluminio', pl: [5, 10], pal: [0, 1, 2, 3], bay: 3.4 },
    { nombre: 'torre de pisos de los 70', pl: [9, 16], pal: [4, 5], acab: 'gresite', bay: 3.6, lejos: { muro: 'estuco', bay: 3.6, vidrio: 0.45 } },
    { nombre: 'bloque con soportales', pl: [5, 9], pal: [0, 1, 2, 3], pbRec: 2.4, pbH: 4.6, balP: 0.85, hueco: 'mixto' }]
});

// ---------------------------------------------------------------- pueblo (s. XIX–1940, 1–3 plantas)
// casas bajas entre medianeras, estuco suave, balcón sencillo, portal de madera; cornisa, terrado o tejado
KIT.estilo('pueblo', {
  nombre: 'Casa de poble',
  comun: { hp: 3.05, bay: 3.0, win: 1.05, alto: 0.74, hueco: 'balconera', bal: 'indiv', balP: 1, vuelo: 0.6, bar: 'forja', forja: 0,
    carp: 'alicantina', carpCol: CAD, marco: MADERA, acab: 'estuco', remate: 0.62, imposta: 1, recerc: 1, ultimo: 'normal',
    coron: 'cornisa', mac: 0.55, ropa: 0.1, com: 0.6, pb: 'pb_pueblo', lejos: { muro: 'estuco', hp: 3.05, bay: 3.0, vidrio: 0.25 } },
  variantes: [
    { nombre: 'planta baja y piso', pl: [1, 2], coron: 'alero', carp: 'librillo', carpCol: VERDE, recerc: 1, mac: 0.6 },
    { nombre: 'casa de 3 plantas con balcón', pl: [3, 3], princ: 'corrido', recerc: 2, ultimo: 'bajo', imposta: 2, coron: 'cornisa' },
    { nombre: 'casita con patio delantero', pl: [1, 2], com: 0, pbRec: 1.8, pbFr: 'frente_verja', hueco: 'ventana', bal: 'ninguno', coron: 'peto',
      carp: 'librillo', carpCol: VERDE.concat(GRIS), recerc: 2 },
    { nombre: 'casa con taller en la planta baja', pl: [1, 3], com: 0.3, acab: 'revoco', hueco: 'mixto', balP: 0.6, coron: 'frontis', carp: 'librillo',
      carpCol: GRIS, recerc: 0, dg: 0.5 }]
});

// ---------------------------------------------------------------- contemporáneo (2001–hoy, 4–20 plantas)
// cristal, hormigón visto, paneles metálicos, celosías de lamas, madera; volúmenes limpios, sin cornisa
KIT.estilo('contemporaneo', {
  nombre: 'Contemporani',
  comun: { hp: 3.1, bay: 3.4, win: 1.6, alto: 0.88, hueco: 'balconera', bal: 'corrido', vuelo: 1.1, bar: 'vidrio', carp: 'ninguna',
    carpCol: LAMAS, marco: [[52, 56, 60], [70, 74, 78]], acab: 'estuco', remate: 0.12, imposta: 0, recerc: 0, ultimo: 'normal', coron: 'peto',
    mac: 0.2, ropa: 0, com: 0.9, pb: 'pb_contemporaneo', vano: 'vano_contemporaneo', corona: 'corona_contemporaneo',
    lejos: { muro: 'estuco', hp: 3.1, bay: 3.4, vidrio: 0.55 } },
  variantes: [
    { nombre: 'torre de oficinas de cristal', pl: [9, 40], pal: [2, 5], cw: 1, bay: 3.0, hp: 3.6, lejos: { muro: 'vidrio', hp: 3.6, bay: 1.5, vidrio: 0.85 } },
    { nombre: 'bloque residencial con celosías', pl: [4, 10], pal: [0, 3, 5] },
    { nombre: 'edificio de hormigón y madera', pl: [4, 8], pal: [0, 1], acab: 'hormigon', hueco: 'ventana', bal: 'ninguno', carpCol: [[150, 108, 70], [126, 90, 58]],
      lejos: { muro: 'hormigon', vidrio: 0.4 } },
    { nombre: 'hotel de diseño', pl: [5, 12], pal: [1, 2, 4, 5], acab: 'panel', hueco: 'ventana', bal: 'ninguno', bay: 2.9, lejos: { muro: 'hormigon', vidrio: 0.3 } }]
});

// ---------------------------------------------------------------- burgués 60–70 (1955–1985, 6–10 plantas)
// grandes terrazas corridas con jardineras, travertino o gres, madera oscura o aluminio, portal señorial; ático con pérgola
KIT.estilo('burgues_60_70', {
  nombre: 'Bloc burgès 60-70',
  comun: { hp: 2.95, bay: 3.5, win: 1.4, alto: 0.84, hueco: 'balconera', bal: 'terraza', vuelo: 1.15, bar: 'obra', carp: 'enrollable',
    carpCol: OSCURA.concat([[180, 176, 166]]), marco: [[70, 50, 34], [60, 44, 30], [150, 152, 150]], acab: 'gresite', remate: 0.25, imposta: 0,
    recerc: 0, ultimo: 'normal', coron: 'atico', mac: 0.45, ropa: 0, com: 0.4, pb: 'pb_burgues', vano: 'vano_burgues', chaflan: { bal: 'terraza' },
    lejos: { muro: 'travertino', hp: 2.95, bay: 3.5, vidrio: 0.45 } },
  variantes: [
    { nombre: 'bloque de terrazas con jardineras', pl: [6, 10] },
    { nombre: 'torre exenta con jardín', pl: [8, 16], acab: 'estuco', hueco: 'ventana', bal: 'indiv', balP: 0, coron: 'peto', aticoP: 0.3, win: 1.5,
      lejos: { muro: 'estuco', vidrio: 0.4 } },
    { nombre: 'bloque de travertino', pl: [5, 9], pal: [0, 1, 3], acab: 'travertino', hueco: 'mixto', bal: 'indiv', balP: 0.6, bar: 'vidrio', vuelo: 0.7 },
    { nombre: 'bloque con persianas de madera oscura', pl: [5, 9], acab: 'ladrillo', bal: 'corrido', vuelo: 0.9, carpCol: OSCURA, coron: 'peto', aticoP: 0.3,
      lejos: { muro: 'ladrillo' } }]
});

// ---------------------------------------------------------------- autarquía (1941–1957, 4–7 plantas)
// estuco liso o ladrillo sobrio, ventanas verticales regulares, poca decoración, balcones de hierro simple, placa de protegida
KIT.estilo('autarquia', {
  nombre: 'Autarquia',
  comun: { hp: 3.0, bay: 3.2, win: 1.0, alto: 0.74, hueco: 'mixto', bal: 'indiv', balP: 0.45, vuelo: 0.55, bar: 'forja', forja: 0, carp: 'librillo',
    carpCol: MARRON.concat(VERDE), marco: MADERA, acab: 'estuco', remate: 0.45, imposta: 1, recerc: 1, ultimo: 'bajo', coron: 'cornisa', mac: 0.25,
    ropa: 0.2, aticoP: 0.3, pb: 'pb_autarquia', vano: 'vano_autarquia', chaflan: { bal: 'corrido' }, lejos: { muro: 'estuco', hp: 3.0, bay: 3.2, vidrio: 0.26 } },
  variantes: [
    { nombre: 'bloque de estuco sobrio', hueco: 'ventana', princ: 'indiv', balP: 0.3, recerc: 2 },
    { nombre: 'manzana cerrada con patio', bay: 3.0, hueco: 'balconera', balP: 1, imposta: 2, coron: 'alero', carp: 'alicantina', carpCol: CAD },
    { nombre: 'bloque de ladrillo con zócalo de piedra', acab: 'ladrillo', paleta: ['#a8664a', '#9c5a40', '#b47454', '#a06048'], recerc: 0, coron: 'peto',
      lejos: { muro: 'ladrillo' } },
    { nombre: 'conjunto con soportales', pbRec: 2.6, pbH: 4.8, pbFr: 'frente_arcos', hueco: 'balconera', balP: 0.7 }]
});

// ---------------------------------------------------------------- noucentista (1910–1930, 4–7 plantas)
// estuco liso ocre, rosa o crema, frontones sobre ventanas, pilastras, simetría clásica; cornisa con balaustrada y urnas
KIT.estilo('noucentista', {
  nombre: 'Noucentista',
  comun: { hp: 3.2, bay: 3.5, win: 1.1, alto: 0.8, hueco: 'balconera', bal: 'indiv', balP: 0.7, vuelo: 0.7, bar: 'forja', forja: 0, carp: 'librillo',
    carpCol: VERDE.concat(GRIS), marco: MADERA, acab: 'estuco', remate: 0.55, imposta: 2, recerc: 2, ultimo: 'bajo', coron: 'balaustrada', mac: 0.3,
    ropa: 0.05, aticoP: 0.3, pb: 'pb_noucentista', vano: 'vano_noucentista', fachada: ['urnas'], noble: { f: 1.12, princ: 'corrido', recerc: 3, alto: 0.84 },
    chaflan: { bal: 'corrido' }, lejos: { muro: 'estuco', hp: 3.2, bay: 3.5, vidrio: 0.3 } },
  variantes: [
    { nombre: 'fachada simétrica con frontones', balP: 0.6, tribChf: true },
    { nombre: 'fachada con pilastras', fachada: ['pilastras', 'urnas'], hueco: 'ventana', win: 1.2, alto: 0.86, balP: 0, recerc: 3, bay: 4.0, noble: { f: 1.12, recerc: 3, alto: 0.84, hueco: 'balconera', bal: 'indiv', balP: 1 } },   // F2R2: balcones solo en el principal
    { nombre: 'edificio de oficinas monumental', pl: [5, 8], pbH: 5.4, hueco: 'ventana', win: 1.5, bay: 3.2, acab: 'piedra', bal: 'ninguno',
      noble: { f: 1.15, princ: 'corrido', recerc: 3 }, lejos: { muro: 'piedra', vidrio: 0.35 } },
    { nombre: 'casa de renta sobria', recerc: 1, imposta: 1, balP: 0.5, hueco: 'mixto', bay: 3.0, ultimo: 'normal', coron: 'cornisa', noble: { f: 1.06 }, aticoP: 0.15 }]
});
})();
