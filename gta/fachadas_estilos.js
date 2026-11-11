/* GTA Barcelona — Catálogo de estilos de fachada por barrio (datos; lo lee el generador de facades.js).
   window.BCN_FX_ESTILOS = { familia(nombreBarrio) → id de familia, FAM: { id: [variante, …] }, BASE: valores por defecto }.
   Cada VARIANTE es una descripción paramétrica de la parte de viviendas (del primer piso hacia arriba, coronación incluida);
   el generador (genB → pisosV/coronaV en facades.js) la convierte en geometría. El COLOR del muro NO está aquí: es d.col
   (etapa PALETA); aquí solo van los tonos derivados (carpinterías, remates) y cuánto se aclaran los remates.
   Campos (todos opcionales; lo que falte sale de BASE):
     bay    ancho objetivo de vano en fachada a calle (m)        hp     altura objetivo de planta (m)
     win    ancho máximo del hueco (m)                          alto   alto de la balconera, fracción de la planta
     hueco  'balconera' (hasta el suelo) · 'ventana' (antepecho de 0,9 m) · 'mixto' (balconera en vanos pares, ventana en impares)
     bal    balcón en plantas normales: 'indiv' · 'corrido' · 'terraza' · 'galeria' · 'ninguno' (barandilla de antepecho)
     princ  el mismo campo para la planta principal (1.ª); null = como las demás
     balP   probabilidad de que un vano lleve balcón (con 'indiv'); los demás, balcón francés
     vuelo  vuelo del balcón (m)                                 bar    barandilla: 'forja' · 'balaustre' · 'obra' · 'vidrio' · 'tubo'
     forja  dibujo de la forja (0 anillas, 1 anillas y óvalos)
     carp   cierre: 'librillo' (hojas de lamas abatibles) · 'porticon' (hojas de madera) · 'enrollable' · 'mallorquina'
            (hojas de lamas a medio cerrar en el hueco) · 'alicantina' (persiana de cadeneta colgada por fuera)
     carpCol tonos del cierre (uno por edificio, al azar)        marco  tonos del marco del vidrio
     acab   acabado del muro: 'estuco' · 'piedra' · 'ladrillo' · 'revoco' (gastado, con desconchados) · 'gresite' · 'hormigon'
     remate cuánto se aclaran los remates (impostas, recercados, cornisa) respecto al muro, 0–1
     imposta 0 nada · 1 fina · 2 marcada                         recerc 0 nada · 1 recercado · 2 + guardapolvo · 3 + clave y frontón
     pil    pilastras entre vanos                                esgr   esgrafiado: 0 · 1 plantas pares · 2 todas
     ultimo 'bajo' (última planta con ventanas cortas, bajo la cornisa) · 'normal'
     coron  'cornisa' · 'balaustrada' · 'peto' · 'atico' (última planta en terraza corrida) · 'alero' (teja)
     trib   probabilidad de tribuna en tramos de calle           ropa   probabilidad de ropa tendida por balcón
     mac    probabilidad de maceta por balcón
   Cómo se añade una familia: una entrada en FAM con su id (los de comun.md) y 4–5 variantes; si una familia no tiene
   entrada, sus edificios salen con la fachada de antes (details.js). Depuración: ?fxv=familia:n fuerza la variante n
   (desde 0) en todos los edificios; ?fxv=familia, la familia con variante al azar; ?fxv=off, la fachada de antes. */
(function () {
'use strict';
// tonos de carpintería (de las fotos de calle): verdes de librillo, marrones, grises, azules de la costa, blanco de aluminio
const VERDE = [[43, 77, 51], [60, 92, 64], [52, 84, 70]], MARRON = [[84, 56, 34], [107, 77, 48], [70, 48, 32]];
const GRIS = [[84, 87, 69], [120, 118, 104], [96, 98, 96]], AZUL = [[36, 59, 77], [52, 88, 112], [40, 96, 110]];
const BLANCO = [[205, 204, 196], [178, 176, 168]], ALU = [[150, 152, 150], [96, 92, 86], [190, 190, 184]];
const MADERA = [[64, 38, 20], [38, 28, 20], [36, 51, 41], [79, 48, 26]];

const BASE = { bay: 3.6, hp: 3.15, win: 1.25, alto: 0.78, hueco: 'balconera', bal: 'indiv', princ: null, balP: 1, vuelo: 0.95,
  bar: 'forja', forja: 0, carp: 'librillo', carpCol: VERDE, marco: MADERA, acab: 'estuco', remate: 0.5, imposta: 1, recerc: 1,
  pil: false, esgr: 0, ultimo: 'bajo', coron: 'cornisa', trib: 0, ropa: 0, mac: 0.25 };

const FAM = {
  // Eixample: casas de vecinos de 5–7 plantas, balconeras verticales, principal corrido, forja, librillo, molduras
  eixample: [
    { id: 'eix_clasico', bay: 3.7, princ: 'corrido', carp: 'librillo', carpCol: VERDE, recerc: 3, pil: true, imposta: 2,
      coron: 'balaustrada', trib: 0.2, mac: 0.35, esgr: 1 },
    { id: 'eix_modernista', bay: 3.6, princ: 'corrido', forja: 1, carp: 'porticon', carpCol: MARRON, recerc: 2, esgr: 2, imposta: 2,
      coron: 'cornisa', trib: 0.6, mac: 0.3, remate: 0.62 },
    { id: 'eix_noucentista', bay: 3.4, princ: 'corrido', vuelo: 0.7, carp: 'mallorquina', carpCol: GRIS.concat(VERDE), recerc: 1,
      imposta: 1, coron: 'cornisa', mac: 0.25, remate: 0.4 },
    { id: 'eix_pedra', bay: 3.8, acab: 'piedra', princ: 'corrido', bar: 'balaustre', carp: 'porticon', carpCol: MARRON, recerc: 3,
      imposta: 2, pil: true, coron: 'balaustrada', trib: 0.3, mac: 0.2, remate: 0.35 },
    { id: 'eix_60', bay: 3.3, hp: 2.95, hueco: 'mixto', bal: 'terraza', bar: 'obra', vuelo: 1.1, carp: 'enrollable', carpCol: ALU,
      marco: ALU, recerc: 0, imposta: 0, ultimo: 'normal', coron: 'atico', mac: 0.3, remate: 0.25 }],
  // Gràcia: casas de 3–5 plantas, más estrechas, balcones corridos de forja sencilla, colores vivos, lamas
  gracia: [
    { id: 'gra_corrido', bay: 3.1, hp: 3.0, bal: 'corrido', vuelo: 0.75, carp: 'librillo', carpCol: VERDE, recerc: 1, imposta: 1,
      coron: 'cornisa', mac: 0.45, remate: 0.6 },
    { id: 'gra_estreta', bay: 2.9, hp: 3.05, vuelo: 0.6, carp: 'alicantina', carpCol: [[150, 120, 70], [120, 88, 52], [60, 92, 64]],
      recerc: 2, imposta: 1, coron: 'peto', mac: 0.5, ropa: 0.15, remate: 0.65 },
    { id: 'gra_modernista', bay: 3.2, princ: 'corrido', forja: 1, carp: 'porticon', carpCol: VERDE.concat(AZUL), esgr: 1, recerc: 2,
      imposta: 2, coron: 'balaustrada', trib: 0.25, mac: 0.35, remate: 0.6 },
    { id: 'gra_postguerra', bay: 3.2, hp: 2.9, hueco: 'mixto', balP: 0.6, vuelo: 0.6, bar: 'tubo', carp: 'enrollable',
      carpCol: GRIS.concat(ALU), marco: ALU, recerc: 1, imposta: 0, ultimo: 'normal', coron: 'peto', mac: 0.3, remate: 0.45 }],
  // Barri Gòtic, Sant Pere, Santa Caterina i la Ribera: fachadas estrechas y altas, huecos pequeños, forja muy saltada
  ciutat_vella: [
    { id: 'cv_neoclassic', bay: 2.9, hp: 3.4, win: 1.05, princ: 'corrido', vuelo: 0.75, carp: 'librillo', carpCol: VERDE.concat(MARRON),
      recerc: 2, imposta: 2, coron: 'cornisa', ropa: 0.15, mac: 0.35, remate: 0.5 },
    { id: 'cv_revoc', bay: 2.7, hp: 3.3, win: 1.0, vuelo: 0.7, acab: 'revoco', carp: 'alicantina',
      carpCol: [[150, 120, 70], [120, 88, 52]], recerc: 1, imposta: 1, coron: 'peto', ropa: 0.4, mac: 0.3, remate: 0.45 },
    { id: 'cv_pedra', bay: 3.0, hp: 3.5, win: 1.05, acab: 'piedra', vuelo: 0.7, carp: 'porticon', carpCol: MARRON, recerc: 2,
      imposta: 1, coron: 'cornisa', ropa: 0.1, mac: 0.25, remate: 0.3 },
    { id: 'cv_casa_cos', bay: 2.6, hp: 3.2, win: 0.95, hueco: 'mixto', balP: 0.7, vuelo: 0.65, acab: 'revoco', carp: 'librillo',
      carpCol: VERDE.concat(GRIS), recerc: 1, imposta: 0, coron: 'peto', ropa: 0.45, mac: 0.3, remate: 0.4 }],
  // Raval: como Ciutat Vella, más gastado y popular, mucha ropa tendida
  raval: [
    { id: 'rav_obrera', bay: 2.8, hp: 3.2, win: 1.0, vuelo: 0.7, acab: 'revoco', carp: 'librillo', carpCol: VERDE.concat(GRIS),
      recerc: 1, imposta: 1, coron: 'peto', ropa: 0.55, mac: 0.25, remate: 0.4 },
    { id: 'rav_neoclassic', bay: 3.0, hp: 3.35, win: 1.05, princ: 'corrido', vuelo: 0.75, acab: 'revoco', carp: 'porticon',
      carpCol: MARRON, recerc: 2, imposta: 2, coron: 'cornisa', ropa: 0.4, mac: 0.25, remate: 0.5 },
    { id: 'rav_maó', bay: 2.9, hp: 3.1, hueco: 'mixto', balP: 0.65, vuelo: 0.65, acab: 'ladrillo', carp: 'alicantina',
      carpCol: [[150, 120, 70], [60, 92, 64]], recerc: 1, imposta: 1, coron: 'peto', ropa: 0.5, mac: 0.2, remate: 0.6 },
    { id: 'rav_estret', bay: 2.6, hp: 3.25, win: 0.95, vuelo: 0.6, carp: 'mallorquina', carpCol: VERDE.concat(AZUL), recerc: 0,
      imposta: 1, coron: 'cornisa', ropa: 0.5, mac: 0.35, remate: 0.45 }],
  // Barceloneta: «quarts de casa» estrechos de 4–5 plantas, balcones pequeños, colores vivos, ropa tendida
  barceloneta: [
    { id: 'bcn_quart', bay: 2.7, hp: 2.85, win: 0.95, vuelo: 0.5, carp: 'librillo', carpCol: VERDE.concat(AZUL), recerc: 1,
      imposta: 1, ultimo: 'normal', coron: 'peto', ropa: 0.6, mac: 0.35, remate: 0.7 },
    { id: 'bcn_cadeneta', bay: 2.7, hp: 2.9, win: 0.95, vuelo: 0.5, carp: 'alicantina', carpCol: [[150, 120, 70], [52, 88, 112]],
      recerc: 2, imposta: 1, ultimo: 'normal', coron: 'peto', ropa: 0.55, mac: 0.3, remate: 0.7 },
    { id: 'bcn_corrido', bay: 2.8, hp: 2.9, bal: 'corrido', vuelo: 0.55, carp: 'mallorquina', carpCol: AZUL.concat(VERDE),
      recerc: 1, imposta: 0, ultimo: 'normal', coron: 'cornisa', ropa: 0.6, mac: 0.4, remate: 0.65 },
    { id: 'bcn_nou', bay: 2.9, hp: 2.85, hueco: 'mixto', balP: 0.7, vuelo: 0.55, bar: 'tubo', carp: 'enrollable', carpCol: BLANCO.concat(ALU),
      marco: ALU, recerc: 0, imposta: 0, ultimo: 'normal', coron: 'peto', ropa: 0.5, mac: 0.25, remate: 0.55 }],
  // Poble-sec, Font de la Guatlla, la Marina: casas obreras de 4–6 plantas, balcones sencillos, revoco y algún ladrillo
  poble_sec: [
    { id: 'ps_obrera', bay: 3.1, hp: 3.0, vuelo: 0.7, carp: 'librillo', carpCol: VERDE.concat(MARRON), recerc: 1, imposta: 1,
      coron: 'cornisa', ropa: 0.3, mac: 0.35, remate: 0.45 },
    { id: 'ps_maó', bay: 3.0, hp: 3.0, vuelo: 0.65, acab: 'ladrillo', bar: 'forja', carp: 'alicantina',
      carpCol: [[150, 120, 70], [120, 88, 52]], recerc: 1, imposta: 1, coron: 'peto', ropa: 0.3, mac: 0.3, remate: 0.6 },
    { id: 'ps_revoc', bay: 3.0, hp: 3.0, hueco: 'mixto', balP: 0.7, vuelo: 0.65, acab: 'revoco', carp: 'enrollable',
      carpCol: GRIS.concat(MARRON), recerc: 0, imposta: 1, ultimo: 'normal', coron: 'peto', ropa: 0.4, mac: 0.25, remate: 0.4 },
    { id: 'ps_50', bay: 3.3, hp: 2.9, bal: 'corrido', vuelo: 0.8, bar: 'tubo', carp: 'enrollable', carpCol: ALU, marco: ALU,
      recerc: 0, imposta: 0, ultimo: 'normal', coron: 'peto', ropa: 0.35, mac: 0.3, remate: 0.3 }],
  // Sant Gervasi: burgués de principios de siglo y de los 60–80, terrazas corridas, obra o vidrio, enrollables, áticos
  sant_gervasi: [
    { id: 'sg_burges', bay: 3.6, princ: 'corrido', bar: 'balaustre', carp: 'porticon', carpCol: VERDE.concat(GRIS), recerc: 3,
      imposta: 2, pil: true, coron: 'balaustrada', trib: 0.3, mac: 0.4, remate: 0.55 },
    { id: 'sg_terrasses', bay: 3.4, hp: 3.0, hueco: 'mixto', bal: 'terraza', bar: 'obra', vuelo: 1.3, carp: 'enrollable',
      carpCol: ALU.concat(MARRON), marco: ALU, recerc: 0, imposta: 0, ultimo: 'normal', coron: 'atico', mac: 0.45, remate: 0.3 },
    { id: 'sg_vidre', bay: 3.5, hp: 3.05, bal: 'terraza', bar: 'vidrio', vuelo: 1.4, carp: 'enrollable', carpCol: GRIS.concat(ALU),
      marco: ALU, recerc: 0, imposta: 1, ultimo: 'normal', coron: 'atico', mac: 0.4, remate: 0.25 },
    { id: 'sg_galeria', bay: 3.3, hp: 2.95, hueco: 'ventana', bal: 'galeria', princ: 'galeria', carp: 'enrollable', carpCol: MARRON,
      marco: ALU, recerc: 1, imposta: 1, ultimo: 'normal', coron: 'peto', mac: 0.2, remate: 0.35 },
    { id: 'sg_noucentista', bay: 3.5, princ: 'corrido', vuelo: 0.8, carp: 'mallorquina', carpCol: VERDE, recerc: 2, imposta: 1,
      esgr: 1, coron: 'cornisa', mac: 0.45, remate: 0.6 }]
};

// barrio → familia (ids de n2/comun.md)
const BARRI = {
  "la Dreta de l'Eixample": 'eixample', "l'Antiga Esquerra de l'Eixample": 'eixample', "la Nova Esquerra de l'Eixample": 'eixample',
  'Sant Antoni': 'eixample', 'el Fort Pienc': 'eixample', 'la Sagrada Família': 'eixample',
  'la Vila de Gràcia': 'gracia', "el Camp d'en Grassot i Gràcia Nova": 'gracia', 'la Salut': 'gracia', 'Vallcarca i els Penitents': 'gracia', 'el Coll': 'gracia',
  'el Barri Gòtic': 'ciutat_vella', 'Sant Pere, Santa Caterina i la Ribera': 'ciutat_vella', 'el Raval': 'raval', 'la Barceloneta': 'barceloneta',
  'el Poble-sec': 'poble_sec', 'la Font de la Guatlla': 'poble_sec', 'la Marina de Port': 'poble_sec', 'la Marina del Prat Vermell': 'poble_sec',
  'Sants': 'sants', 'Hostafrancs': 'sants', 'la Bordeta': 'sants', 'Sants - Badal': 'sants',
  'les Corts': 'les_corts', 'la Maternitat i Sant Ramon': 'les_corts',
  'Sant Gervasi - Galvany': 'sant_gervasi', 'Sant Gervasi - la Bonanova': 'sant_gervasi', 'el Putxet i el Farró': 'sant_gervasi', 'les Tres Torres': 'sant_gervasi',
  'Sarrià': 'sarria_pedralbes', 'Pedralbes': 'sarria_pedralbes', 'Vallvidrera, el Tibidabo i les Planes': 'sarria_pedralbes',
  'el Poblenou': 'poblenou', 'el Parc i la Llacuna del Poblenou': 'poblenou', 'Provençals del Poblenou': 'poblenou',
  'la Vila Olímpica del Poblenou': 'poblenou', 'Diagonal Mar i el Front Marítim del Poblenou': 'poblenou',
  'Sant Andreu': 'sant_andreu', 'la Sagrera': 'sant_andreu', 'el Congrés i els Indians': 'sant_andreu', 'Navas': 'sant_andreu', 'el Bon Pastor': 'sant_andreu',
  'Baró de Viver': 'sant_andreu', 'la Trinitat Vella': 'sant_andreu', 'el Clot': 'sant_andreu', "el Camp de l'Arpa del Clot": 'sant_andreu',
  'Sant Martí de Provençals': 'sant_andreu', 'la Verneda i la Pau': 'sant_andreu', 'el Besòs i el Maresme': 'sant_andreu',
  'el Baix Guinardó': 'horta_guinardo', 'el Guinardó': 'horta_guinardo', 'Can Baró': 'horta_guinardo', 'el Carmel': 'horta_guinardo',
  'la Teixonera': 'horta_guinardo', 'Horta': 'horta_guinardo', 'la Clota': 'horta_guinardo', 'Montbau': 'horta_guinardo',
  "la Vall d'Hebron": 'horta_guinardo', 'Sant Genís dels Agudells': 'horta_guinardo', "la Font d'en Fargues": 'horta_guinardo'
};
const DISTRICTE = { 'Nou Barris': 'nou_barris', 'Ciutat Vella': 'ciutat_vella', 'Eixample': 'eixample', 'Gràcia': 'gracia', 'Sants-Montjuïc': 'sants',
  'Les Corts': 'les_corts', 'Sarrià-Sant Gervasi': 'sant_gervasi', 'Horta-Guinardó': 'horta_guinardo', 'Sant Andreu': 'sant_andreu', 'Sant Martí': 'poblenou' };
const familia = barri => !barri ? 'periferia' : BARRI[barri.n] || DISTRICTE[barri.d] || 'periferia';

// variantes completas (BASE + propias), congeladas
for (const f in FAM) FAM[f] = FAM[f].map(v => Object.freeze(Object.assign({}, BASE, v, { fam: f })));
window.BCN_FX_ESTILOS = { FAM, BASE, BARRI, familia };
})();
