/* GTA Barcelona · Condal City — ESTILOS del bloque 2 del kit (Fase 2b), por peso real en la ciudad: olímpico 80–90 (6,2 %),
   casa obrera XIX (3,4 %), autoconstrucción (3,3 %), modernista (3,1 %), Eixample ornamentado (2,5 %) y Eixample temprano
   (2,1 %). Cada estilo: comun (lo que comparten sus variantes) y 4 variantes con el nombre del catálogo del usuario
   (CONDAL_CITY_PROMPT.md, Parte 2 · A). Esquema de campos y ranuras: cabecera de kit.js. Paleta y desgaste base: los del
   catálogo (BCN_CONDAL.estilos); pal elige los colores de la paleta que usa cada variante. Las piezas: piezas_b2.js. */
(function () {
'use strict';
const KIT = window.BCN_KIT;
const VERDE = [[43, 77, 51], [60, 92, 64], [52, 84, 70]], GRIS = [[84, 87, 69], [120, 118, 104], [96, 98, 96]];
const MADERA = [[64, 38, 20], [38, 28, 20], [36, 51, 41], [79, 48, 26]];
const GASTADO = [[88, 110, 84], [110, 96, 70], [70, 90, 100], [140, 120, 90], [96, 118, 110]];   // librillos viejos, descoloridos
const LAMAS = [[214, 212, 204], [150, 150, 146], [96, 110, 96], [176, 150, 110], [120, 96, 70]];
const HIERRO = [[46, 80, 72], [52, 64, 96], [120, 48, 40], [214, 214, 208], [60, 62, 64]];      // hierro pintado (olímpico)
const PVC = [[226, 222, 210], [206, 198, 180], [140, 112, 84]], ALIC = [[60, 110, 80], [150, 120, 70], [200, 196, 186]];

// ---------------------------------------------------------------- olímpico 80–90 (1981–2000, 5–10 plantas)
// ladrillo cara vista de calidad y hormigón, volúmenes rotundos, mallorquinas o lamas, galerías, posmoderno; porches y parking
KIT.estilo('olimpico_80_90', {
  nombre: 'Olímpic 80-90',
  comun: { hp: 2.95, bay: 3.4, win: 1.3, alto: 0.82, hueco: 'mixto', bal: 'indiv', balP: 0.45, vuelo: 0.75, bar: 'tubo', carp: 'mallorquina',
    carpCol: LAMAS, marco: HIERRO, acab: 'ladrillo', remate: 0.35, imposta: 3, recerc: 0, ultimo: 'normal', coron: 'peto', ropa: 0.05, mac: 0.3,
    com: 0.7, pb: 'pb_olimpico', vano: 'vano_olimpico', corona: 'corona_olimpico', chaflan: { bal: 'corrido', vuelo: 1.1 },
    lejos: { muro: 'ladrillo', hp: 2.95, bay: 3.4, vidrio: 0.35 } },
  variantes: [
    { nombre: 'bloque de ladrillo con galerías', pl: [5, 9], pal: [0, 3] },
    { nombre: 'manzana olímpica con patio', pl: [5, 8], pal: [1, 2, 4], bal: 'corrido', vuelo: 1.0, hueco: 'balconera', hp: 3.0, pbRec: 3.0, pbH: 4.8,
      pbFr: 'pilares_olimpico', com: 0.5, lejos: { muro: 'ladrillo', vidrio: 0.4 } },
    { nombre: 'edificio posmoderno con color', pl: [5, 8], acab: 'estuco', paleta: ['#c9573f', '#e0b04e', '#d9d2c4', '#7aa0b0', '#e6c8a8'], imposta: 2,
      bar: 'tubo', carp: 'ninguna', bay: 3.6, lejos: { muro: 'estuco', vidrio: 0.3 } },
    { nombre: 'vivienda pública en esquina', pl: [5, 10], pal: [0, 1, 3], imposta: 0, carpCol: [[150, 150, 146], [214, 212, 204], [96, 100, 104]], bay: 3.8,
      chaflan: { bal: 'corrido', vuelo: 1.2 }, lejos: { muro: 'ladrillo', bay: 3.8, vidrio: 0.38 } }]
});

// ---------------------------------------------------------------- casa obrera XIX (1800–1900, 4–6 plantas, 5–9 m)
// fachada estrecha de estuco desconchado, balcones estrechos y altos con barandilla sencilla, librillos de madera; ropa y cables
KIT.estilo('casa_obrera_xix', {
  nombre: 'Casa obrera XIX',
  comun: { hp: 3.0, bay: 2.8, win: 0.9, alto: 0.84, hueco: 'balconera', bal: 'indiv', balP: 1, vuelo: 0.45, bar: 'forja', forja: 0, carp: 'librillo',
    carpCol: GASTADO, marco: MADERA, acab: 'revoco', remate: 0.35, imposta: 1, recerc: 1, ultimo: 'bajo', coron: 'cornisa', ropa: 0.45, mac: 0.5,
    com: 1, pb: 'pb_obrera', vano: 'vano_obrera', corona: 'corona_obrera', fachada: ['cables_obrera'],
    lejos: { muro: 'estuco', hp: 3.0, bay: 2.8, vidrio: 0.28 } },
  variantes: [
    // F2R: cada variante con su ritmo: parcelas pintadas de 2 balcones (v0), fachada unitaria con principal corrido y cornisa de
    // ménsulas (v1), parcelas de 3 vanos estrechos alternando balcón y ventana (v2), balcón corrido solo en el chaflán y el principal (v3)
    { nombre: 'fachada de 2 balcones', pl: [4, 5], bay: 3.3, win: 1.0, recerc: 2, par: 2 },
    { nombre: 'fachada de 3 balcones con cornisa', pl: [4, 6], bay: 2.6, imposta: 2, recerc: 3, vuelo: 0.5, ultimo: 'normal', ropa: 0.2,
      noble: { f: 1.1, princ: 'corrido', vuelo: 0.7 } },
    { nombre: 'casa obrera muy estrecha', pl: [4, 6], bay: 2.2, win: 0.78, alto: 0.88, hp: 2.85, hueco: 'mixto', balP: 0.7, ultimo: 'normal', coron: 'peto',
      imposta: 0, recerc: 0, vuelo: 0.38, par: 3, ropa: 0.6, lejos: { bay: 2.2, vidrio: 0.3 } },
    { nombre: 'esquina con balcón corrido', pl: [4, 6], vuelo: 0.55, bay: 2.9, noble: { f: 1.06, princ: 'corrido', vuelo: 0.65 }, chaflan: { bal: 'corrido', vuelo: 0.7 } }]
});

// ---------------------------------------------------------------- autoconstrucción en ladera (1940–1975, 1–4 plantas, 4–8 m)
// casitas irregulares hechas por los vecinos: ladrillo, bloque y enlucido, ampliaciones, terrado con depósitos y esperas
KIT.estilo('autoconstruccion', {
  nombre: 'Autoconstrucció',
  comun: { hp: 2.75, bay: 3.0, win: 1.0, alto: 0.78, hueco: 'mixto', bal: 'indiv', balP: 0.35, vuelo: 0.6, bar: 'tubo', carp: 'enrollable',
    carpCol: ALIC, marco: [[168, 170, 168], [120, 100, 72], [200, 200, 196]], acab: 'estuco', remate: 0.2, imposta: 0, recerc: 0, ultimo: 'normal',
    coron: 'peto', ropa: 0.35, mac: 0.6, com: 0.3, pbH: 3.0, pb: 'pb_auto', vano: 'vano_auto', corona: 'corona_auto',
    lejos: { muro: 'estuco', hp: 2.75, bay: 3.0, vidrio: 0.22 } },
  variantes: [
    { nombre: 'casita escalonada', pl: [1, 2], pal: [0, 3, 4] },
    { nombre: 'casa con piso añadido de ladrillo visto', pl: [2, 4], pal: [0, 1, 4] },
    { nombre: 'casa de bloque sin enlucir', pl: [1, 3], acab: 'bloque', paleta: ['#a8a59d', '#b3aea4', '#9c9890', '#aaa294'], dg: 0.5,
      lejos: { muro: 'hormigon', vidrio: 0.2 } },
    { nombre: 'casa con terraza y escalera exterior', pl: [1, 3], pal: [0, 1, 3, 4], fachada: ['escalera_auto'], mac: 0.8 }]
});

// ---------------------------------------------------------------- modernista (1888–1915, 4–7 plantas)
// curvas, cerámica, trencadís, forja orgánica, vitrales, piedra tallada; coronamiento ondulado, torretas y pináculos
KIT.estilo('modernista', {
  nombre: 'Modernista',
  comun: { hp: 3.35, bay: 3.4, win: 1.15, alto: 0.84, hueco: 'balconera', bal: 'indiv', balP: 1, vuelo: 0.75, bar: 'forja', forja: 1, carp: 'librillo',
    carpCol: VERDE.concat([[150, 120, 70]]), marco: MADERA, acab: 'estuco', remate: 0.5, imposta: 1, recerc: 1, ultimo: 'normal', coron: 'cornisa', trib: 0,
    mac: 0.3, ropa: 0.03, com: 0.8, pbH: 4.6, pb: 'pb_modernista', vano: 'vano_modernista', corona: 'corona_modernista',
    noble: { f: 1.12, vuelo: 0.9 }, lejos: { muro: 'estuco', hp: 3.35, bay: 3.4, vidrio: 0.32 } },
  variantes: [
    { nombre: 'fachada ondulada con trencadís', pal: [0, 3, 4] },
    { nombre: 'tribunas de hierro y vidrio', pal: [0, 1, 3], vuelo: 0.7 },
    { nombre: 'fachada de ladrillo y cerámica', acab: 'ladrillo', paleta: ['#a85a3c', '#b4664a', '#9a5236', '#b87050'], recerc: 0, carpCol: [[52, 84, 70], [40, 66, 90]],
      lejos: { muro: 'ladrillo', vidrio: 0.3 } },
    { nombre: 'coronamiento con torreta', acab: 'piedra', pal: [1, 2], recerc: 2, imposta: 2, vuelo: 0.7, lejos: { muro: 'piedra', vidrio: 0.3 } }]
});

// ---------------------------------------------------------------- Eixample ornamentado (1890–1915, 5–7 plantas)
// planta noble muy decorada, tribunas, esgrafiados, relieves, hierro rico, estuco que imita piedra; cornisa marcada y frontón
KIT.estilo('eixample_ornamentado', {
  nombre: 'Eixample ornamentat',
  comun: { hp: 3.3, bay: 3.5, win: 1.15, alto: 0.84, hueco: 'balconera', bal: 'indiv', balP: 1, vuelo: 0.65, bar: 'forja', forja: 1, carp: 'librillo',
    carpCol: VERDE.concat(GRIS), marco: MADERA, acab: 'estuco', remate: 0.58, imposta: 2, recerc: 3, ultimo: 'normal', coron: 'cornisa', trib: 0,
    mac: 0.3, ropa: 0.03, com: 0.9, aticoP: 0.3, pbH: 4.8, pb: 'pb_ornamentado', vano: 'vano_ornamentado', corona: 'corona_ornamentado',
    noble: { f: 1.18, princ: 'corrido', vuelo: 0.9 }, chaflan: { bal: 'corrido' }, lejos: { muro: 'estuco', hp: 3.3, bay: 3.5, vidrio: 0.32 } },
  variantes: [
    { nombre: 'fachada con tribuna central', noble: { f: 1.18, princ: 'indiv', vuelo: 0.95 } },
    { nombre: 'planta noble con balcón corrido', noble: { f: 1.2, princ: 'corrido', vuelo: 1.0, bar: 'balaustre' }, acab: 'piedra', lejos: { muro: 'piedra', vidrio: 0.32 } },
    { nombre: 'chaflán con torreta', chaflan: { bal: 'corrido', princ: 'corrido', vuelo: 0.85 }, pal: [0, 1, 3] },
    { nombre: 'fachada con esgrafiados', esgr: 2, recerc: 2, pal: [0, 2, 3], noble: { f: 1.15, princ: 'corrido', vuelo: 0.85 } }]
});

// ---------------------------------------------------------------- Eixample temprano / academicista (1860–1890, 4–6 plantas)
// sobria y ordenada, balcones de hierro idénticos en rejilla, molduras suaves, planta baja almohadillada; cornisa con dentículos
KIT.estilo('eixample_temprano', {
  nombre: 'Eixample primer',
  comun: { hp: 3.25, bay: 3.6, win: 1.05, alto: 0.82, hueco: 'balconera', bal: 'indiv', balP: 1, vuelo: 0.6, bar: 'forja', forja: 0, carp: 'librillo',
    carpCol: [[52, 84, 62], [70, 96, 74], [96, 104, 92], [84, 70, 54]], marco: MADERA, acab: 'estuco', remate: 0.32, imposta: 1, recerc: 1, ultimo: 'bajo',
    coron: 'cornisa', trib: 0, mac: 0.35, ropa: 0.08, com: 0.9, pbH: 4.5, pb: 'pb_temprano', vano: 'vano_temprano', corona: 'corona_temprano',
    fachada: ['farola_esquina'], noble: { f: 1.08 }, lejos: { muro: 'estuco', hp: 3.25, bay: 3.6, vidrio: 0.3 } },
  variantes: [
    // F2R: v1 con pilastras entre vanos, último piso entero y balaustrada; v2 sobria de ventanas y balconeras alternas sin
    // molduras, con el balcón corrido solo en el chaflán
    { nombre: 'fachada de 4 balcones simétrica', bay: 3.8, recerc: 2, noble: { f: 1.1, vuelo: 0.75 } },
    { nombre: 'fachada de 5 balcones', bay: 3.0, win: 0.95, vuelo: 0.55, pil: true, recerc: 3, imposta: 2, ultimo: 'normal', coron: 'balaustrada', lejos: { bay: 3.0 } },
    { nombre: 'chaflán sobrio', imposta: 2, ultimo: 'normal', hueco: 'mixto', balP: 0.6, recerc: 0, coron: 'peto', vuelo: 0.5,
      chaflan: { bal: 'corrido', princ: 'corrido', hueco: 'balconera', balP: 1 } },
    { nombre: 'fachada con balcón corrido en planta principal', noble: { f: 1.12, princ: 'corrido', vuelo: 0.85 }, recerc: 2 }]
});
})();
