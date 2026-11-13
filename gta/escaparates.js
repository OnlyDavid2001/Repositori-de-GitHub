/* GTA Barcelona · Condal City · Fase 4 (kit): los 24 MODELOS DE ESCAPARATE y los RÓTULOS con nombres inventados.
   Se carga después de interiors.js y antes de facades.js. window.BCN_ESC:
     · MODELOS[24]               ids del catálogo (BCN_CONDAL.escaparates), en el mismo orden; M[id] = descripción del modelo;
     · NEG[59]                   por negocio (índice de BCN_CONDAL.negocios): { n, e (modelo), tipo (fila de TYPES de interiors.js) };
     · nombre(neg, k)            el rótulo k (0–3) del negocio: nombre inventado en catalán (nunca marcas reales);
     · elige(negocios, r)        negocio al azar ponderado por cuota (lista de BCN_CONDAL.at(x, z).negocios) → índice de negocio;
     · plan(env, run, s)         gancho de interiors.js (shopPlan): si el local tiene negocio (s.neg, lo pone la Fase 4) o hay
                                 escaparate forzado, lo convierte en un local del modelo (tipo de interior, toldo, persiana, rótulo…);
     · bay(env, run, W, gl, yB, s)   gancho de interiors.js (shopBay): dibuja el vano W del local con su modelo;
     · front(env, run, s)        gancho de interiors.js (fin de groundFloor): rótulo, lo del local entero y lo que saca a la acera;
     · dibuja(env, run, vano, modelo, negocio, semilla)   API para el generador (Fase 4) o una pieza «pb» del kit: un local
                                 entero en los vanos vano.w0 … vano.w1 − 1 de un tramo (capas BASE y ORNAMENTO de env);
     · force                     escaparate de modelos: '?escaparate=<modelo>' (todos los locales que se construyan usan ese
                                 modelo; el negocio, uno de los del modelo por semilla), '?escaparate=auto' (negocio por las
                                 cuotas reales del barrio) o '?escaparate=neg:<n>' (un negocio). En marcha: BCN_ESC.force = 'bar'
                                 y BCN.fx.force(null) para reconstruir.
   Rótulos: tipo K.ROTULO (201) con un atlas propio de 256 nombres (1024 × 2048, 4 nombres por texel en R, G, B y A), número de
   rótulo en aux.z (8 bits) y estilo + color de letra en aux.w; el fondo es el color de vértice. Así el «tipo de interior»
   (≤ 32 filas de TYPES, color.g de K.SHOPWIN) va aparte del rótulo. Cosas pintadas (persianas con grafiti, papel en los
   cristales, vinilos, neones, fotos, carteles, manchas, cortinas, expositores, flores, fruta, rejillas): tipo K.ESC (200), con
   el modo en aux.z. Ids 200–207 reservados a este módulo. Detalles: tools/encargos/progreso/CC_F4kit.md. */
(function () {
'use strict';
const GEO = window.BCN_GEO, I = window.BCN_INTERIORS;
if (!GEO || !I) { console.warn('escaparates.js: falta BCN_GEO o BCN_INTERIORS'); return; }
const { K, regKind, quad, rect, jamb, hpl, box, shade, mixc, pbrAux, R } = GEO;

// ------------------------------------------------------------------ filas nuevas de interior (TYPES de interiors.js: 17 → 32)
// Mismo vocabulario que interiors.js (números que lee el sombreador): suelo FL, luminarias LP, fondo BK, capas LY, paleta PL, forma SH
const FL = { DAMERO: 0, TARIMA: 1, TERRAZO: 2, BALDOSA: 3 }, LP = { FOCOS: 0, TUBOS: 1, CALIDA: 2 };
const BK = { LISO: 0, ESTANTES: 1, BOTELLERO: 2, ESPEJOS: 3, HERRAMIENTAS: 4, PIZARRAS: 5, PERCHERO: 6, GAFAS: 7, CUADROS: 8 };
const LY = { NADA: 0, MOSTRADOR: 1, BARRA: 2, MESAS: 3, MANTELES: 4, SILLONES: 5, LINEALES: 6, BURRAS: 7, ISLA: 8, CAJAS: 9, CUBOS: 10, TARIMA: 11, MANIQUIES: 12, CARTELES: 13 };
const PL = { VARIADO: 0, BOTELLAS: 3, PAN: 4, FERRETERIA: 5, ROPA: 9, CARNE: 12, PEIX: 13, BRILLANT: 14, JOIES: 15 };
const SH = { CAJA: 0, REDONDO: 1, BOTELLA: 2, LOMO: 3, HERRAMIENTA: 4, GAFAS: 5, MIXTO: 6 };
const Z = [0, 0, 0];
const FILAS = [
  { n: 'MENJAR RÀPID', w: 0, sign: ['#c8201c', '#ffe14a'], awn: [200, 40, 30], wall: [236, 214, 160], floor: [FL.BALDOSA, [226, 222, 214], [190, 60, 50]], warm: 0.3, lamp: LP.TUBOS,
    back: [BK.PIZARRAS, [200, 40, 30]], far: [LY.MOSTRADOR, [186, 190, 194]], near: [LY.MESAS, [200, 50, 40]], shelf: [LY.CARTELES, Z], acc: [250, 200, 40], pal: PL.VARIADO, shape: SH.REDONDO },
  { n: 'CARNISSERIA', w: 0, sign: ['#7a1414', '#ffffff'], awn: [150, 30, 30], wall: [236, 236, 230], floor: [FL.BALDOSA, [214, 212, 206], [160, 60, 56]], warm: 0.35, lamp: LP.TUBOS,
    back: [BK.ESTANTES, [226, 226, 222]], far: [LY.MOSTRADOR, [232, 232, 228]], near: [LY.NADA, Z], shelf: [LY.TARIMA, [220, 220, 216]], acc: [170, 30, 40], pal: PL.CARNE, shape: SH.REDONDO },
  { n: 'PEIXATERIA', w: 0, sign: ['#1c4f7a', '#ffffff'], awn: [40, 90, 150], wall: [206, 226, 236], floor: [FL.BALDOSA, [210, 220, 226], [120, 150, 170]], warm: 0.15, lamp: LP.TUBOS,
    back: [BK.ESTANTES, [220, 230, 236]], far: [LY.MOSTRADOR, [228, 232, 236]], near: [LY.NADA, Z], shelf: [LY.CAJAS, [236, 240, 244]], acc: [60, 140, 200], pal: PL.PEIX, shape: SH.REDONDO },
  { n: 'SABATERIA', w: 0, sign: ['#3a2416', '#f2e2c4'], awn: [90, 60, 40], wall: [222, 210, 192], floor: [FL.TARIMA, [150, 110, 72], [150, 110, 72]], warm: 0.7, lamp: LP.FOCOS,
    back: [BK.ESTANTES, [120, 84, 54]], far: [LY.ISLA, [110, 78, 50]], near: [LY.NADA, Z], shelf: [LY.TARIMA, [200, 190, 176]], acc: [160, 110, 60], pal: PL.ROPA, shape: SH.CAJA },
  { n: 'JOIERIA', w: 0, sign: ['#14213d', '#e9cf8a'], awn: [30, 40, 70], wall: [40, 48, 70], floor: [FL.TARIMA, [70, 50, 40], [70, 50, 40]], warm: 0.55, lamp: LP.FOCOS,
    back: [BK.ESTANTES, [30, 34, 50]], far: [LY.MOSTRADOR, [40, 44, 60]], near: [LY.NADA, Z], shelf: [LY.TARIMA, [60, 30, 50]], acc: [230, 200, 120], pal: PL.JOIES, shape: SH.REDONDO },
  { n: 'GIMNÀS', w: 0, sign: ['#151517', '#ff7a1a'], awn: [40, 40, 44], wall: [70, 72, 78], floor: [FL.TERRAZO, [44, 46, 50], [60, 62, 66]], warm: 0.1, lamp: LP.TUBOS,
    back: [BK.ESPEJOS, [30, 30, 34]], far: [LY.SILLONES, [40, 40, 44]], near: [LY.ISLA, [50, 52, 56]], shelf: [LY.NADA, Z], acc: [255, 120, 30], pal: PL.VARIADO, shape: SH.CAJA },
  { n: 'MOBLES', w: 0, sign: ['#4a3320', '#f6e8c9'], awn: [120, 90, 60], wall: [214, 200, 180], floor: [FL.TARIMA, [140, 100, 64], [140, 100, 64]], warm: 0.85, lamp: LP.CALIDA,
    back: [BK.CUADROS, [120, 86, 56]], far: [LY.MESAS, [110, 76, 48]], near: [LY.MANTELES, [150, 110, 70]], shelf: [LY.TARIMA, [130, 96, 62]], acc: [180, 160, 130], pal: PL.VARIADO, shape: SH.MIXTO },
  { n: 'JOGUINES', w: 0, sign: ['#1f5fbf', '#ffe14a'], awn: [220, 70, 40], wall: [240, 230, 190], floor: [FL.BALDOSA, [230, 220, 200], [80, 140, 210]], warm: 0.45, lamp: LP.TUBOS,
    back: [BK.ESTANTES, [230, 200, 80]], far: [LY.ISLA, [220, 80, 60]], near: [LY.NADA, Z], shelf: [LY.TARIMA, [60, 120, 200]], acc: [250, 200, 40], pal: PL.BRILLANT, shape: SH.CAJA },
  { n: 'MÒBILS', w: 0, sign: ['#0a6fd1', '#ffffff'], awn: [30, 90, 180], wall: [236, 238, 240], floor: [FL.BALDOSA, [226, 228, 230], [180, 184, 188]], warm: 0.05, lamp: LP.TUBOS,
    back: [BK.ESTANTES, [236, 238, 240]], far: [LY.MOSTRADOR, [220, 224, 228]], near: [LY.NADA, Z], shelf: [LY.CARTELES, Z], acc: [20, 120, 220], pal: PL.BRILLANT, shape: SH.CAJA },
  { n: 'SOUVENIRS', w: 0, sign: ['#c8201c', '#ffe14a'], awn: [200, 40, 30], wall: [236, 226, 200], floor: [FL.BALDOSA, [220, 214, 200], [170, 160, 150]], warm: 0.4, lamp: LP.TUBOS,
    back: [BK.ESTANTES, [200, 196, 190]], far: [LY.BURRAS, [180, 180, 186]], near: [LY.NADA, Z], shelf: [LY.CAJAS, [210, 200, 180]], acc: [250, 210, 40], pal: PL.BRILLANT, shape: SH.MIXTO },
  { n: 'ESTANC', w: 0, sign: ['#5a3a1a', '#ffd23a'], awn: [110, 70, 30], wall: [190, 160, 120], floor: [FL.DAMERO, [170, 120, 80], [220, 200, 160]], warm: 0.75, lamp: LP.FOCOS,
    back: [BK.ESTANTES, [96, 64, 36]], far: [LY.MOSTRADOR, [110, 74, 42]], near: [LY.NADA, Z], shelf: [LY.TARIMA, [96, 64, 40]], acc: [250, 200, 40], pal: PL.VARIADO, shape: SH.CAJA },
  { n: 'OFICINA', w: 0, sign: ['#1d2b40', '#ffffff'], awn: [40, 60, 90], wall: [232, 232, 228], floor: [FL.BALDOSA, [200, 202, 204], [160, 162, 166]], warm: 0.25, lamp: LP.TUBOS,
    back: [BK.CUADROS, [200, 200, 196]], far: [LY.MESAS, [170, 172, 176]], near: [LY.NADA, Z], shelf: [LY.CARTELES, Z], acc: [40, 90, 160], pal: PL.VARIADO, shape: SH.CAJA },
  { n: 'TINTORERIA', w: 0, sign: ['#1a6aa0', '#ffffff'], awn: [40, 110, 160], wall: [214, 230, 236], floor: [FL.BALDOSA, [210, 214, 218], [150, 160, 170]], warm: 0.2, lamp: LP.TUBOS,
    back: [BK.PERCHERO, [200, 204, 210]], far: [LY.MOSTRADOR, [200, 206, 212]], near: [LY.NADA, Z], shelf: [LY.NADA, Z], acc: [40, 120, 180], pal: PL.ROPA, shape: SH.CAJA },
  { n: 'TALLER', w: 0, sign: ['#2b2b2f', '#ffffff'], awn: [60, 60, 66], wall: [104, 104, 100], floor: [FL.TERRAZO, [86, 84, 80], [70, 68, 64]], warm: 0.25, lamp: LP.TUBOS,
    back: [BK.HERRAMIENTAS, [130, 110, 80]], far: [LY.ISLA, [70, 72, 76]], near: [LY.NADA, Z], shelf: [LY.NADA, Z], acc: [220, 60, 40], pal: PL.FERRETERIA, shape: SH.CAJA },
  { n: 'BUIT', w: 0, sign: ['#808080', '#ffffff'], awn: [120, 120, 120], wall: [196, 190, 178], floor: [FL.TERRAZO, [130, 126, 120], [110, 106, 100]], warm: 0.3, lamp: LP.TUBOS,
    back: [BK.LISO, [150, 146, 140]], far: [LY.NADA, Z], near: [LY.NADA, Z], shelf: [LY.NADA, Z], acc: [120, 120, 120], pal: PL.VARIADO, shape: SH.CAJA },
];
const TY = I.TYPES;
for (const f of FILAS) if (TY.length < 32 && !TY.some(t => t.n === f.n)) TY.push(f);
if (TY.length > 32) console.warn('escaparates.js: TYPES pasa de 32 filas');
const TI = n => { const i = TY.findIndex(t => t.n === n); return i < 0 ? 0 : i; };
// paletas de género nuevas (filas 12–15 de las columnas 8–15 de tShop): carne, pescado, colores vivos (juguetes, fundas,
// souvenirs) y joyas (oro y plata sobre terciopelo). interiors.js las lee con API.paramData()
const PALN = {
  [PL.CARNE]: [[176, 40, 44], [176, 40, 44], [196, 70, 70], [150, 30, 36], [220, 150, 140], [230, 200, 180], [120, 40, 30], [200, 110, 90]],
  [PL.PEIX]: [[170, 178, 186], [170, 178, 186], [140, 150, 160], [200, 206, 212], [230, 120, 80], [210, 90, 70], [90, 100, 120], [236, 240, 244]],
  [PL.BRILLANT]: [[230, 40, 40], [250, 200, 30], [40, 120, 220], [40, 170, 80], [240, 120, 30], [190, 60, 190], [30, 190, 200], [245, 245, 240]],
  [PL.JOIES]: [[240, 200, 110], [240, 200, 110], [250, 230, 160], [210, 214, 220], [230, 234, 240], [200, 60, 80], [70, 140, 200], [250, 240, 200]] };
{ const pd0 = I.paramData;
  I.paramData = function () { const d = pd0(), W = I.paramSize ? I.paramSize[0] : 16;
    for (const k in PALN) PALN[k].forEach((c, i) => d.set([c[0], c[1], c[2], 255], (+k * W + 8 + i) * 4));
    return d; }; }

// ------------------------------------------------------------------ nombres inventados (catalán) por negocio
// 4 rótulos por negocio (índices 4·neg … 4·neg + 3 del atlas) y unos cuantos fijos (ESP). Sorteo determinista: el atlas sale igual
// en cada carga. Plantillas: {N} nombre de pila, {C} apellido, {L} lugar o santo, {A} palabra inventada, {#} número
const NOMS = ['Pep', 'Montse', 'Rosa', 'Laia', 'Jordi', 'Marta', 'Núria', 'Joan', 'Pere', 'Anna', 'Carme', 'Toni', 'Quim', 'Mercè', 'Roser', 'Xavi',
  'Ramon', 'Teresa', 'Lluís', 'Imma', 'Neus', 'Jaume', 'Pilar', 'Enric', 'Glòria', 'Miquel', 'Rita', 'Biel'];
const COGN = ['Puig', 'Vidal', 'Soler', 'Ferrer', 'Roca', 'Serra', 'Font', 'Pujol', 'Casals', 'Bosch', 'Riera', 'Sala', 'Vila', 'Costa', 'Mas', 'Prat',
  'Camps', 'Rovira', 'Torrent', 'Bonet', 'Grau', 'Batlle', 'Comas', 'Oliveras', 'Pons', 'Ribas', 'Castells', 'Miró', 'Llobet', 'Sabaté'];
const LLOC = ['Sant Jordi', 'Montserrat', 'la Plaça', 'el Mercat', 'Santa Anna', 'el Pi', 'la Mercè', 'Sant Antoni', 'el Port', 'Collserola', 'la Font',
  'Sant Pau', 'el Carme', 'la Riera', 'Santa Eulàlia', 'el Clot', 'la Torre', 'Sant Martí', 'el Born', 'les Corts'];
const INV = ['Nuvolet', 'Lluna', 'Mar Blava', 'Brisa', 'Garbí', 'Fanal', 'Rosella', 'Petxina', 'Olivera', 'Llamp', 'Teulada', 'Grill', 'Estel',
  'Ametlla', 'Farigola', 'Gavina', 'Cirera', 'Romaní', 'Tramuntana', 'Mistral', 'Avellana', 'Quars', 'Àncora', 'Vela'];
// plantillas por negocio (orden de BCN_CONDAL.negocios: 59) y tipografía (s serif · b sans negrita · i serif cursiva · c estrecha)
const PLANT = [
  [['Bar Can {N}', 'Bar {L}', 'Cafè {A}', 'Bar {C}', 'Granja {C}', 'Bar La Cantonada'], 'b'],
  [['Restaurant Can {N}', 'Casa {C}', 'El Racó d\'en {N}', 'Taverna {A}', 'Fonda {C}', 'Ca la {N}'], 'i'],
  [['Pizzeria {A}', 'Kebab {A}', 'Bocateria {N}', 'Hamburgueseria {A}', 'Wok {A}', 'Empanades {N}'], 'c'],
  [['Gelateria {A}', 'Xocolateria {C}', 'Orxateria {L}', 'Gelats {N}'], 'i'],
  [['Sala {A}', 'Club {A}', '{A} Club', 'Bar Musical {A}'], 'i'],
  [['Hotel {A}', 'Hostal {L}', 'Pensió {C}', 'Hotel {L}'], 's'],
  [['Supermercat {A}', 'Autoservei {N}', 'Super {A}', 'Queviures {C}', 'Supermercat del Barri'], 'b'],
  [['Forn {L}', 'Forn {C}', 'Pastisseria {C}', 'Forn de Pa {N}', 'Fleca {A}'], 's'],
  [['Fruites {N}', 'Fruiteria {L}', 'Fruites i Verdures {C}', 'Fruiteria {A}'], 'b'],
  [['Carnisseria {C}', 'Xarcuteria {N}', 'Cansaladeria {C}', 'Carns {L}'], 's'],
  [['Peixateria {N}', 'Peix {L}', 'Peixos {C}', 'Marisc {A}'], 's'],
  [['Celler {C}', 'Vins i Caves {A}', 'Bodega {L}', 'Vins {C}'], 'i'],
  [['Plats Cuinats {N}', 'Rostisseria {L}', 'Menjars {C}', 'Cuina de {N}'], 's'],
  [['Boutique {A}', 'Moda {N}', '{A}', 'Teixits {C}', 'Roba {A}'], 'i'],
  [['Sabateria {C}', 'Calçats {L}', 'Pells {C}', 'Calçats {A}'], 's'],
  [['Merceria {N}', 'Fils i Botons', 'Merceria {L}', 'Llanes {C}'], 's'],
  [['Perfumeria {A}', 'Drogueria {C}', 'Perfums {N}', 'Drogueria {L}'], 'i'],
  [['Joieria {C}', 'Rellotgeria {C}', 'Joies {A}', 'Joieria {L}'], 'i'],
  [['Òptica {C}', 'Visió {A}', 'Òptica {L}', 'Ulleres {N}'], 'b'],
  [['Farmàcia {C}', 'Farmàcia {C} {C}', 'Farmàcia {L}', 'Farmàcia {C}'], 'b'],
  [['Perruqueria {N}', 'Barberia {A}', 'Perruqueria {A}', 'Barberia {C}'], 'c'],
  [['Estètica {N}', 'Ungles {A}', 'Centre d\'Estètica {A}', 'Bellesa {N}'], 'c'],
  [['Centre Mèdic {L}', 'Clínica Dental {C}', 'Fisioteràpia {N}', 'Consultori {L}'], 'b'],
  [['Herbolari {A}', 'Dietètica {L}', 'Herbes {N}', 'Herbolari {C}'], 's'],
  [['Clínica Veterinària {A}', 'Veterinari {L}', 'Mascotes {N}', 'Veterinària {C}'], 'b'],
  [['Gimnàs {A}', 'Club Esportiu {L}', 'Gimnàs {L}', 'Fitness {A}'], 'c'],
  [['Mobles {C}', 'Mobles {L}', 'Mobiliari {A}', 'Mobles {N}'], 's'],
  [['Decoració {A}', 'Casa i Llar', 'Llar {C}', 'Decoració {N}'], 'i'],
  [['Ferreteria {L}', 'Ferreteria {C}', 'Ferreteria {A}', 'Ferros {C}'], 'b'],
  [['Electrodomèstics {C}', 'Electro {A}', 'Electrodomèstics {L}', 'Llum i Electro {N}'], 'b'],
  [['Floristeria {N}', 'Flors {L}', 'Flors {A}', 'Floristeria {C}'], 'i'],
  [['Llibreria {A}', 'Llibreria {L}', 'Quiosc {N}', 'Papers {C}'], 's'],
  [['Joguines {A}', 'Esports {C}', 'Joguets {N}', 'Esports {L}'], 'b'],
  [['Discos {A}', 'Música {L}', 'Instruments {C}', 'Vinils {A}'], 'c'],
  [['Foto {C}', 'Estudi Fotogràfic {A}', 'Fotografia {N}', 'Foto {L}'], 'b'],
  [['Antiguitats {C}', 'Brocanter {N}', 'Antiguitats {L}', 'Col·leccionisme {A}'], 'i'],
  [['Teatre {A}', 'Sala {L}', 'Ateneu {L}', 'Cinema {A}'], 's'],
  [['Mòbils {A}', 'Informàtica {L}', 'Telèfons {N}', 'Mòbils i Més'], 'b'],
  [['Basar {A}', 'Basar {L}', 'Tot a Bon Preu', 'Basar {N}'], 'b'],
  [['Locutori {A}', 'Locutori {L}', 'Trucades {N}', 'Enviaments {A}'], 'b'],
  [['Souvenirs {A}', 'Records de Barcelona', 'Souvenirs {L}', 'Regals {A}'], 'b'],
  [['Estanc núm. {#}', 'Expenduria núm. {#}', 'Estanc {C}', 'Tabacs {L}'], 's'],
  [['Banc del {A}', 'Assegurances {C}', 'Banca {A}', 'Banc {L}'], 'b'],
  [['Finques {C}', 'Immobiliària {L}', 'Finques {A}', 'Pisos {N}'], 'b'],
  [['Viatges {A}', 'Viatges {L}', 'Agència {A}', 'Viatges {C}'], 'b'],
  [['Gestoria {C}', 'Advocats {C} {C}', 'Assessoria {L}', 'Despatx {C}'], 's'],
  [['Acadèmia {A}', 'Escola d\'Idiomes {L}', 'Acadèmia {C}', 'Repàs {N}'], 'b'],
  [['Associació de Veïns', 'Casal {L}', 'Esbart {A}', 'Penya {A}'], 's'],
  [['Església {L}', 'Oratori {A}', 'Centre Cultural {L}', 'Comunitat {A}'], 's'],
  [['Copisteria {A}', 'Impremta {C}', 'Còpies {L}', 'Arts Gràfiques {C}'], 'b'],
  [['Tintoreria {N}', 'Bugaderia {A}', 'Tintoreria {L}', 'Bugaderia {C}'], 'b'],
  [['Arranjaments {N}', 'Cal Sabater', 'Modista {N}', 'Claus i Tacons'], 'b'],
  [['Taller {C}', 'Mecànica {L}', 'Taller {A}', 'Planxa i Pintura {C}'], 'c'],
  [['Motos {C}', 'Automòbils {A}', 'Motos {L}', 'Concessionari {A}'], 'c'],
  [['Pàrquing {L}', 'Garatge {C}', 'Pàrquing {A}', 'Garatge {L}'], 'b'],
  [['Benzinera {L}', 'Carburants {C}', 'Benzinera {A}', 'Estació de Servei {L}'], 'b'],
  [['Magatzem {C}', 'Distribucions {A}', 'Magatzems {L}', 'Majorista {C}'], 'c'],
  [['Construccions {C}', 'Serralleria {A}', 'Fusteria {C}', 'Reformes {A}'], 'c'],
  [['ES LLOGA', 'ES VEN', 'SE ALQUILA', 'LLOGUER'], 'b'] ];
const ESP = { ESLLOGA: 236, ESVEN: 237, SEALQUILA: 238, LLOGUER: 239, MOBILS: 240, OFERTES: 241, OBERT: 242, TABACS: 243, HOTEL: 244, BAR: 245, MENU: 246,
  SOUVENIRS: 247, FARMACIA: 248, PARQUING: 249, TALLER: 250, ENTRADA: 251 };
const ESPT = { 236: ['ES LLOGA', 'b'], 237: ['ES VEN', 'b'], 238: ['SE ALQUILA', 'b'], 239: ['LLOGUER', 'b'], 240: ['REPARACIÓ DE MÒBILS', 'b'],
  241: ['OFERTES', 'b'], 242: ['OBERT', 'b'], 243: ['TABACS', 's'], 244: ['HOTEL', 's'], 245: ['BAR', 'b'], 246: ['MENÚ DEL DIA', 'i'], 247: ['SOUVENIRS', 'b'],
  248: ['FARMÀCIA', 'b'], 249: ['PÀRQUING', 'b'], 250: ['TALLER', 'b'], 251: ['ENTRADA', 'b'] };
const NOMBRES = [];
{ let st = 0x2545f491; const rr = () => { st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ st >>> 15, 1 | st); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const pk = a => a[(rr() * a.length) | 0];
  const fill = tpl => tpl.replace(/\{N\}/g, () => pk(NOMS)).replace(/\{C\}/g, () => pk(COGN)).replace(/\{L\}/g, () => pk(LLOC)).replace(/\{A\}/g, () => pk(INV))
    .replace(/\{#\}/g, () => String(1 + ((rr() * 140) | 0)));
  PLANT.forEach(([tp], i) => { const got = [];
    for (let k = 0; k < 4; k++) { let n = '', tries = 0; do { n = fill(tp[(k + tries) % tp.length]); tries++; } while (got.indexOf(n) >= 0 && tries < 12); got.push(n); NOMBRES[i * 4 + k] = n; } });
  for (const k in ESPT) NOMBRES[+k] = ESPT[k][0]; }
const FONT = { s: 'bold 40px Georgia, "DejaVu Serif", serif', b: 'bold 40px Arial, "DejaVu Sans", sans-serif', i: 'italic bold 40px Georgia, "DejaVu Serif", serif',
  c: 'bold 42px "Arial Narrow", "DejaVu Sans Condensed", sans-serif' };
const fontDe = c => FONT[c >= 236 ? (ESPT[c] || [0, 'b'])[1] : (PLANT[c >> 2] || [0, 'b'])[1]];
// mayúsculas en los rótulos de barrio (pintados, cajas); minúsculas con mayúscula inicial en los elegantes (cursiva)
const textoDe = c => { const n = NOMBRES[c] || ''; const f = c >= 236 ? 'b' : (PLANT[c >> 2] || [0, 'b'])[1]; return f === 'i' ? n : n.toUpperCase(); };

// ------------------------------------------------------------------ tipo K.ROTULO (201): rótulo con nombre, fondo y letra aparte
// aux: x, y = uv del rótulo (0–1) · z = número de rótulo (atlas tRot de 2 × 32 casillas de 512 × 64, 4 nombres por texel: canal =
// número & 3) · w = color de letra (0–15) + 16·estilo (0–7; nunca 255). Color de vértice = fondo.
// Estilos: 0 chapa pintada · 1 caja luminosa (de noche, mientras el comercio está abierto) · 2 neón sobre fondo oscuro (toda la
// noche) · 3 letras doradas sobre fondo · 4 letras sueltas (sin fondo: se ve la pared) · 5 letras sueltas luminosas · 6 cartel
// de papel · 7 caja luminosa toda la noche (guardia)
const ROT_DECL = `
uniform sampler2D tRot;
vec3 rotFg(float i){
  if (i < 0.5) return vec3(0.96, 0.96, 0.94);
  if (i < 1.5) return vec3(0.96, 0.90, 0.76);
  if (i < 2.5) return vec3(0.07, 0.07, 0.08);
  if (i < 3.5) return vec3(0.86, 0.68, 0.30);
  if (i < 4.5) return vec3(0.80, 0.10, 0.10);
  if (i < 5.5) return vec3(0.10, 0.52, 0.24);
  if (i < 6.5) return vec3(0.10, 0.20, 0.42);
  if (i < 7.5) return vec3(1.00, 0.84, 0.18);
  if (i < 8.5) return vec3(1.00, 0.50, 0.10);
  if (i < 9.5) return vec3(1.00, 0.45, 0.70);
  if (i < 10.5) return vec3(0.30, 0.95, 1.00);
  if (i < 11.5) return vec3(1.00, 0.25, 0.85);
  if (i < 12.5) return vec3(0.55, 1.00, 0.45);
  if (i < 13.5) return vec3(0.42, 0.26, 0.12);
  if (i < 14.5) return vec3(0.78, 0.80, 0.82);
  return vec3(0.55, 0.78, 1.00);
}`;
regKind('ROTULO', 201, `
    float rid = floor(vInfo.z*255.0 + 0.5), rst = floor(vInfo.w*255.0 + 0.5);
    float rfi = mod(rst, 16.0), rsy = floor(rst/16.0), rch = mod(rid, 4.0), rsl = floor(rid/4.0);
    vec2 ruv = vec2((mod(rsl, 2.0) + vInfo.x)/2.0, (floor(rsl/2.0) + 1.0 - vInfo.y)/32.0);
    vec4 rtx = texture2D(tRot, ruv);
    float rm = rch < 0.5 ? rtx.r : (rch < 1.5 ? rtx.g : (rch < 2.5 ? rtx.b : rtx.a));
    vec3 rfg = rotFg(rfi), rbg = vCol.rgb;
    float rfr = 1.0 - shR(vec2(vInfo.x*8.0, vInfo.y), vec2(0.06, 0.08), vec2(7.94, 0.92), max(fwidth(vInfo.x*8.0), 1e-4));
    float rnear = 1.0 - smoothstep(0.02, 0.06, max(fwidth(vInfo.x), fwidth(vInfo.y)));
    if (rsy > 3.5 && rsy < 5.5) {
      if (rm < 0.45) discard;
      alb = rfg; rough = 0.35; metal = (rfi > 2.5 && rfi < 3.5) || (rfi > 13.5 && rfi < 14.5) ? 1.0 : 0.0;
      if (rsy > 4.5) { emis = emit(rfg, 0.15 + 1.6*uDusk*(1.0 - 0.45*uLate)); rough = 0.5; metal = 0.0; }
    } else {
      float rw = rsy > 5.5 && rsy < 6.5 ? 0.0 : 1.0;
      alb = mix(rbg, rfg, max(rm, rfr*0.85*rnear*rw*step(rsy, 1.5)));
      rough = 0.55;
      if (rsy < 0.5) { alb *= 0.86 + 0.18*vnoise(P*vec2(9.0, 14.0)); rough = 0.75; }
      else if (rsy < 1.5) { emis = emit(alb, shopOn()*0.55); }
      else if (rsy < 2.5) { alb = mix(rbg*0.5, rfg, rm); emis = emit(rfg, rm*(0.12 + 1.8*uDusk*(1.0 - 0.4*uLate))); }
      else if (rsy < 3.5) { metal = rm; rough = mix(0.6, 0.3, rm); emis = emit(alb, shopOn()*0.12); }
      else if (rsy < 6.5) { alb *= 0.9 + 0.12*vnoise(P*vec2(30.0, 30.0)); rough = 0.9; }
      else { emis = emit(alb, uDusk*0.5); }
    }`, ROT_DECL);

// ------------------------------------------------------------------ tipo K.ESC (200): lo pintado de los escaparates
// aux.z = modo · aux.x = semilla (0–255) · aux.y = variante. P = metros sobre la cara (en las verticales, P.y = altura).
// Modos: 1 persiana metálica bajada con grafiti (siempre) · 2 la misma solo de día (de noche desaparece: discoteca abierta) ·
// 3 cristal empapelado · 4 vinilo (variante 0 esmerilado, 1 franjas, 2 puntos) · 5 neón (color de vértice, toda la noche) ·
// 6 fotos de comida retroiluminadas · 7 carteles de papel (0 precios, 1 ofertas, 2 de espectáculos) · 8 mancha de aceite ·
// 9 cortina plisada · 10 expositor de recuerdos (imanes, camisetas, abanicos) · 11 pantalla luminosa (máquina) · 12 flores ·
// 13 fruta · 14 rejilla de seguridad (calada)
const ESC_DECL = `
vec3 escHue(float h){ return 0.5 + 0.42*cos(6.2832*(h + vec3(0.0, 0.33, 0.67))); }`;
regKind('ESC', 200, `
    float emd = floor(vInfo.z*255.0 + 0.5), esd = floor(vInfo.x*255.0 + 0.5), evr = floor(vInfo.y*255.0 + 0.5);
    float efw = max(max(fwidth(P.x), fwidth(P.y)), 1e-4), efar = smoothstep(0.02, 0.08, efw);
    if (emd < 2.5) {
      if (emd > 1.5 && uNight > 0.55) discard;
      float hc = hash21(vec2(esd, 4.1)), sq = P.y/0.08, sfw = fwidth(sq), sfar = smoothstep(0.3, 0.9, sfw);
      alb = hc < 0.5 ? vec3(0.50, 0.51, 0.50) : (hc < 0.72 ? vec3(0.36, 0.37, 0.38) : (hc < 0.86 ? vec3(0.22, 0.32, 0.25) : vec3(0.36, 0.18, 0.15)));
      alb *= mix(0.86 + 0.28*vnoise(P*vec2(0.7, 3.0) + esd), 1.0, sfar*0.5);
      alb *= mix(0.84 + 0.16*sin(sq*6.2832), 0.95, sfar);
      N = normalize(N + vec3(0.0, 1.0, 0.0)*cos(sq*6.2832)*0.35*(1.0 - sfar));
      vec2 gq = P*vec2(1.6, 2.2) + esd*1.7;
      float gn = vnoise(gq)*0.6 + vnoise(gq*2.3)*0.4, gb = smoothstep(0.0, 0.35, vnoise(vec2(P.x*0.35, esd)));
      float gline = 1.0 - smoothstep(0.012, 0.035, abs(gn - 0.5)), gfill = smoothstep(0.58, 0.63, gn);
      vec3 gc = mix(vec3(0.42), escHue(hash21(vec2(esd, 2.2))), 0.8), gc2 = escHue(hash21(vec2(esd, 7.7)));
      alb = mix(alb, mix(gc2, gc, step(0.5, gn + 0.1*vnoise(gq*5.0))), gfill*gb*0.9*(1.0 - efar*0.5));
      alb = mix(alb, vec3(0.06), gline*gb*(1.0 - efar*0.7));
      rough = 0.55; metal = 0.3;
    } else if (emd < 3.5) {
      vec2 sh = floor(P/vec2(0.6, 0.85) + vec2(esd*0.37, 0.0)), fp = fract(P/vec2(0.6, 0.85) + vec2(esd*0.37, 0.0));
      float h = hash21(sh + esd), news = step(0.45, h);
      vec3 pc = news > 0.5 ? vec3(0.80, 0.78, 0.72) : (h < 0.2 ? vec3(0.72, 0.58, 0.40) : vec3(0.88, 0.86, 0.80));
      float lines = news*step(0.5, fract(P.y/0.022))*step(0.3, vnoise(vec2(P.x*12.0, floor(P.y/0.022))))*(1.0 - efar);
      alb = pc*(0.88 + 0.12*vnoise(P*3.0))*(1.0 - 0.35*lines);
      float edge = 1.0 - smoothstep(0.0, 0.03, min(min(fp.x, 1.0 - fp.x), min(fp.y, 1.0 - fp.y)));
      alb *= 1.0 - 0.25*edge;
      float tape = step(abs(fp.x - 0.5), 0.12)*step(1.0 - fp.y, 0.06);
      alb = mix(alb, vec3(0.85, 0.78, 0.55), tape*0.7);
      rough = 0.92;
    } else if (emd < 4.5) {
      float pat = evr < 0.5 ? 0.0 : (evr < 1.5 ? step(0.5, fract(P.y/0.12)) : step(length(fract(P/0.09) - 0.5), 0.28));
      alb = mix(vec3(0.86, 0.88, 0.88), vCol.rgb, 0.25 + 0.6*pat*(1.0 - efar*0.6));
      rough = 0.35;
      emis = emit(vec3(0.95, 0.93, 0.86), shopOn()*0.22);
    } else if (emd < 5.5) {
      alb = vCol.rgb*0.6; rough = 0.3;
      emis = emit(vCol.rgb, 0.25 + 2.2*uDusk*(1.0 - 0.35*uLate));
    } else if (emd < 6.5) {
      vec2 cs = vec2(0.55, 0.42), ci = floor(P/cs), cf = fract(P/cs);
      float h = hash21(ci + esd), fr = shR(cf*cs, vec2(0.04), cs - 0.04, efw);
      vec2 c0 = (cf - vec2(0.5, 0.42))*cs;
      float blob = clamp((0.13 + 0.03*h - length(c0*vec2(1.0, 1.7)))/efw + 0.5, 0.0, 1.0);
      vec3 food = mix(vec3(0.80, 0.50, 0.20), vec3(0.85, 0.25, 0.15), h);
      vec3 bgp = mix(vec3(0.98, 0.85, 0.30), vec3(0.95, 0.30, 0.20), step(0.5, fract(h*7.3)));
      alb = mix(vec3(0.15), mix(bgp, food, blob*(1.0 - efar*0.5)), fr);
      rough = 0.3;
      emis = emit(alb, 0.08 + shopOn()*0.55);
    } else if (emd < 7.5) {
      vec2 cs = evr < 0.5 ? vec2(0.32, 0.26) : (evr < 1.5 ? vec2(0.75, 0.6) : vec2(0.55, 0.8)), ci = floor(P/cs), cf = fract(P/cs);
      float h = hash21(ci + esd), on = step(evr < 0.5 ? 0.45 : 0.25, h);
      float pap = shR(cf*cs, vec2(0.04), cs - 0.04, efw)*on;
      vec3 pc = evr < 0.5 ? (h < 0.7 ? vec3(0.95, 0.94, 0.88) : vec3(1.0, 0.90, 0.30)) :
               (evr < 1.5 ? (h < 0.6 ? vec3(1.0, 0.88, 0.15) : vec3(0.92, 0.15, 0.12)) : escHue(h)*0.9);
      float ln = step(0.55, fract(cf.y*(evr < 1.5 ? 5.0 : 3.0)))*step(0.15, cf.x)*step(cf.x, 0.85)*(1.0 - efar);
      vec3 ink = evr < 1.5 ? (h < 0.6 && evr > 0.5 ? vec3(0.85, 0.1, 0.1) : vec3(0.1)) : vec3(0.95);
      alb = mix(vCol.rgb, mix(pc, ink, ln*0.75), pap);
      if (pap < 0.01) discard;
      rough = 0.9;
      emis = emit(alb, shopOn()*0.15);
    } else if (emd < 8.5) {
      float m = vnoise(P*1.4 + esd)*0.7 + vnoise(P*4.0 + esd)*0.3;
      float a = smoothstep(0.52, 0.6, m);
      if (a < 0.5) discard;
      alb = vec3(0.10, 0.10, 0.10)*(0.8 + 0.4*vnoise(P*9.0)); rough = 0.25; metal = 0.1;
    } else if (emd < 9.5) {
      float f = sin(P.x*31.0 + 2.0*vnoise(vec2(P.x*3.0, esd)));
      alb = vCol.rgb*(0.82 + 0.18*f*(1.0 - efar)); rough = 0.9;
      N = normalize(N + T*f*0.25*(1.0 - efar));
      emis = emit(vCol.rgb, shopOn()*0.25);
    } else if (emd < 10.5) {
      vec2 cs = evr < 0.5 ? vec2(0.09, 0.07) : vec2(0.42, 0.48), ci = floor(P/cs), cf = fract(P/cs);
      float h = hash21(ci + esd);
      float it = shR(cf*cs, cs*0.08, cs*0.92, efw);
      vec3 ic = escHue(h)*mix(1.0, 1.2, step(0.7, h));
      if (evr > 0.5) { ic = mix(ic, vec3(0.95), step(0.6, fract(h*9.1))); it *= shT((cf - vec2(0.5, 0.0))*cs, 0.02, 0.42, 0.13, 0.19, efw); }
      alb = mix(vCol.rgb, ic, it*(1.0 - efar*0.3));
      rough = 0.7;
    } else if (emd < 11.5) {
      float g = vnoise(P*vec2(4.0, 2.0) + esd);
      alb = vCol.rgb*(0.7 + 0.3*g); rough = 0.25;
      emis = emit(vCol.rgb, 0.12 + uDusk*0.9);
    } else if (emd < 12.5) {
      float h = vnoise(P*9.0 + esd), h2 = vnoise(P*17.0 + esd*1.3);
      vec3 fc = escHue(floor(h*5.0)/5.0 + esd*0.13);
      fc = mix(fc, vec3(0.95, 0.95, 0.92), step(0.75, h2));
      alb = mix(vec3(0.16, 0.34, 0.12), fc, smoothstep(0.35, 0.5, h)*(1.0 - efar*0.4)); rough = 0.8;
    } else if (emd < 13.5) {
      vec2 g = P/0.075, gi = floor(g), gf = fract(g) - 0.5;
      float h = hash21(gi + esd), d = length(gf);
      vec3 fc = evr < 0.5 ? (h < 0.3 ? vec3(0.78, 0.10, 0.08) : (h < 0.55 ? vec3(0.95, 0.55, 0.08) : (h < 0.8 ? vec3(0.45, 0.65, 0.15) : vec3(0.95, 0.85, 0.20)))) : escHue(h);
      alb = mix(vec3(0.30, 0.20, 0.12), fc*(1.0 - 0.4*d), (1.0 - smoothstep(0.38, 0.48, d))*(1.0 - efar) + efar*0.85); rough = 0.45;
    } else {
      vec2 g = vec2(P.x + P.y, P.x - P.y)/0.11, gf = abs(fract(g) - 0.5);
      float w = min(gf.x, gf.y);
      if (w > 0.09 + efar*0.3) discard;
      alb = vec3(0.42, 0.43, 0.45); rough = 0.4; metal = 0.6;
    }`, ESC_DECL);
const EM = { PERS: 1, PERSDIA: 2, PAPEL: 3, VINILO: 4, NEON: 5, FOTOS: 6, CARTELES: 7, MANCHA: 8, CORTINA: 9, EXPOS: 10, PANTALLA: 11, FLORES: 12, FRUTA: 13, REJILLA: 14 };
const eAux = (modo, sd, vr) => { const a = [sd & 255, vr || 0, modo, 0]; return a.concat(a, a, a); };
const rAux = (id, fg, est) => { const w = (fg & 15) + 16 * (est & 7); return [0, 0, id, w, 255, 0, id, w, 255, 255, id, w, 0, 255, id, w]; };

// ------------------------------------------------------------------ los 24 modelos
// Por modelo: toldo (probabilidad), persiana (prob. de alguna bajada de día), rótulos posibles [estilo, color de letra, fondo],
// bajo (cómo es el vano: 'normal', 'oscuro', 'hotel', 'portalon', 'vacio'), cristal (lo que se pinta encima del vidrio) y acera
const C = { rojo: [176, 30, 28], granate: [110, 24, 30], verde: [24, 100, 56], verdeO: [20, 60, 40], azul: [24, 52, 110], azulC: [30, 110, 200],
  negro: [20, 20, 22], blanco: [240, 240, 236], crema: [236, 222, 190], marron: [90, 58, 30], ocre: [200, 150, 50], amarillo: [250, 206, 40],
  naranja: [236, 110, 30], rosa: [220, 110, 150], gris: [70, 72, 78], burdeos: [80, 20, 34], turquesa: [20, 140, 140], morado: [70, 30, 90] };
const M = {
  bar: { toldo: 0.55, pers: 0.12, rot: [[0, 0, C.rojo], [0, 1, C.verdeO], [2, 10, C.negro], [1, 0, C.azul], [0, 7, C.marron], [2, 4, C.negro]], bajo: 'normal', terraza: true },
  restaurante: { toldo: 0.4, pers: 0.1, rot: [[3, 3, C.negro], [4, 3, null], [3, 3, C.burdeos], [0, 1, C.verdeO]], bajo: 'normal', cristal: 'cortina', terraza: true, carta: true },
  comida_rapida: { toldo: 0.25, pers: 0.1, rot: [[1, 7, C.rojo], [1, 0, C.naranja], [1, 4, C.amarillo], [1, 0, C.verde]], bajo: 'normal', cristal: 'fotos', terraza: true },
  ocio_nocturno: { toldo: 0, pers: 0, rot: [[5, 11, null], [5, 10, null], [5, 9, null], [2, 11, C.negro]], bajo: 'oscuro' },
  hotel: { toldo: 0, pers: 0, rot: [[4, 3, null], [3, 3, C.negro], [4, 14, null]], bajo: 'hotel' },
  super_autoservicio: { toldo: 0.3, pers: 0.05, rot: [[1, 0, C.rojo], [1, 0, C.verde], [1, 7, C.azulC], [1, 0, C.naranja]], bajo: 'normal', cristal: 'ofertas', acera: 'fruta' },
  alimentacion_tradicional: { toldo: 0.7, pers: 0.12, rot: [[0, 1, C.marron], [0, 0, C.verdeO], [0, 1, C.burdeos], [0, 2, C.crema], [3, 3, C.verdeO]], bajo: 'normal' },
  moda: { toldo: 0.2, pers: 0.15, rot: [[4, 2, null], [4, 0, null], [3, 0, C.negro], [0, 2, C.crema]], bajo: 'normal' },
  joyeria_optica: { toldo: 0.15, pers: 0.2, rot: [[3, 3, C.negro], [3, 3, C.azul], [4, 3, null], [1, 0, C.azul]], bajo: 'normal', cristal: 'rejilla' },
  farmacia: { toldo: 0.2, pers: 0.05, rot: [[1, 0, C.verde], [7, 0, C.verde]], bajo: 'normal', cruz: true },
  belleza: { toldo: 0.2, pers: 0.12, rot: [[1, 9, C.negro], [4, 2, null], [1, 0, C.rosa], [4, 9, null]], bajo: 'normal', cristal: 'vinilo1' },
  salud: { toldo: 0.1, pers: 0.08, rot: [[1, 6, C.blanco], [1, 0, C.turquesa], [4, 6, null], [1, 5, C.blanco]], bajo: 'normal', cristal: 'vinilo0', placa: true },
  gimnasio: { toldo: 0, pers: 0.05, rot: [[1, 8, C.negro], [5, 8, null], [1, 0, C.rojo]], bajo: 'normal', cristal: 'vinilo2' },
  hogar: { toldo: 0.35, pers: 0.15, rot: [[0, 1, C.verdeO], [3, 3, C.marron], [0, 7, C.negro], [0, 0, C.azul]], bajo: 'normal' },
  floristeria: { toldo: 0.5, pers: 0.08, rot: [[0, 0, C.verde], [0, 1, C.verdeO], [4, 5, null], [0, 0, C.morado]], bajo: 'normal', acera: 'flores' },
  cultura: { toldo: 0.25, pers: 0.15, rot: [[0, 1, C.azul], [3, 3, C.burdeos], [0, 0, C.negro], [4, 2, null]], bajo: 'normal', cristal: 'carteles2' },
  bazar_moviles: { toldo: 0.15, pers: 0.15, rot: [[1, 7, C.azulC], [1, 0, C.rojo], [1, 2, C.amarillo], [1, 0, C.morado]], bajo: 'normal', cristal: 'mobils' },
  souvenirs: { toldo: 0.15, pers: 0.1, rot: [[1, 7, C.rojo], [1, 4, C.amarillo], [1, 0, C.azul]], bajo: 'normal', acera: 'souvenirs', rotG: true },
  estanco: { toldo: 0.2, pers: 0.12, rot: [[1, 7, C.marron], [0, 7, C.marron]], bajo: 'normal', acera: 'estanco' },
  oficina: { toldo: 0.05, pers: 0.1, rot: [[4, 6, null], [1, 0, C.azul], [4, 2, null], [3, 0, C.gris], [1, 6, C.blanco]], bajo: 'normal', cristal: 'vinilo0', placa: true },
  servicio_barrio: { toldo: 0.2, pers: 0.15, rot: [[1, 0, C.azulC], [0, 6, C.blanco], [1, 0, C.turquesa]], bajo: 'normal', cristal: 'precios' },
  taller_garaje: { toldo: 0, pers: 0, rot: [[0, 4, C.blanco], [0, 6, C.blanco], [0, 7, C.gris], [0, 0, C.rojo]], bajo: 'portalon', acera: 'taller' },
  almacen_industrial: { toldo: 0, pers: 0, rot: [[0, 6, C.blanco], [0, 0, C.gris], [0, 4, C.crema]], bajo: 'portalon' },
  local_vacio: { toldo: 0.05, pers: 0, rot: [], bajo: 'vacio' } };
const MODELOS = Object.keys(M);
// negocio → fila de interior (TYPES). Orden de BCN_CONDAL.negocios
const TIPN = ['BAR', 'RESTAURANT', 'MENJAR RÀPID', 'GELATERIA', 'BAR', null, 'SUPERMERCAT', 'FORN DE PA', 'FRUITERIA', 'CARNISSERIA', 'PEIXATERIA', 'QUEVIURES',
  'QUEVIURES', 'MODA', 'SABATERIA', 'PAPERERIA', 'PAPERERIA', 'JOIERIA', 'ÒPTICA', 'FARMÀCIA', 'PERRUQUERIA', 'PERRUQUERIA', 'OFICINA', 'FORMATGERIA', 'OFICINA',
  'GIMNÀS', 'MOBLES', 'MOBLES', 'FERRETERIA', 'MÒBILS', 'FLORISTERIA', 'LLIBRERIA', 'JOGUINES', 'LLIBRERIA', 'MÒBILS', 'MOBLES', 'LLIBRERIA', 'MÒBILS',
  'SOUVENIRS', 'MÒBILS', 'SOUVENIRS', 'ESTANC', 'OFICINA', 'OFICINA', 'OFICINA', 'OFICINA', 'OFICINA', 'OFICINA', 'OFICINA', 'PAPERERIA', 'TINTORERIA',
  'TINTORERIA', 'TALLER', 'TALLER', null, 'TALLER', null, null, 'BUIT'];
const NEGE = [0, 1, 2, 2, 3, 4, 5, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13, 13, 13, 13, 14, 15, 15, 15, 15, 15, 15, 16, 16, 16, 17, 18,
  19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 21, 21, 21, 21, 22, 22, 23];
const NEG = NEGE.map((e, i) => ({ n: i, e: MODELOS[e], tipo: TIPN[i] ? TI(TIPN[i]) : TI('BUIT') }));
// negocios por modelo (para el escaparate forzado sin negocio)
const POR = {}; NEG.forEach(g => (POR[g.e] = POR[g.e] || []).push(g.n));
const TOLDOS = [[166, 36, 33], [31, 77, 56], [38, 56, 107], [219, 204, 168], [150, 90, 40], [60, 60, 66], [120, 60, 110], [200, 120, 40]];

// ------------------------------------------------------------------ forzado (escaparate de modelos)
function parseForce() {
  let q = null; try { q = new URLSearchParams(location.search).get('escaparate'); } catch (e) { /* sin URL */ }
  if (!q) return null;
  if (q === 'auto' || /^neg:\d+$/.test(q) || M[q]) return q;
  console.warn('escaparates.js: ?escaparate=' + q + ' no es un modelo (' + MODELOS.join(', ') + '), «auto» ni «neg:<n>»');
  return null;
}
// negocio al azar ponderado por cuota: lista de BCN_CONDAL.at(x, z).negocios ([{id, q}]) → índice de negocio (o -1)
function elige(negs, r) {
  if (!negs || !negs.length) return -1;
  let t = 0; for (const g of negs) t += g.q; let x = r * t;
  for (const g of negs) { x -= g.q; if (x < 0) return g.id; }
  return negs[negs.length - 1].id;
}

// ------------------------------------------------------------------ enlace con interiors.js (lo llama su init)
let L = null;   // { ctx, glassQuad, opening, topOf, shopCols, shopBay, shopFront, terrace, roomQuad }
function enlaza(o) {
  L = o;
  const ctx = o.ctx, scene = ctx.scene;
  // atlas de nombres: 1024 × 2048, 2 × 32 casillas de 512 × 64, cuatro nombres por texel (uno por canal)
  const Wt = 1024, Ht = 2048, data = new Uint8Array(Wt * Ht * 4);
  const cv = document.createElement('canvas'); cv.width = Wt; cv.height = Ht;
  const g = cv.getContext('2d', { willReadFrequently: true });
  for (let ch = 0; ch < 4; ch++) {
    g.fillStyle = '#000'; g.fillRect(0, 0, Wt, Ht); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let sl = 0; sl < 64; sl++) {
      const c = sl * 4 + ch, t = NOMBRES[c]; if (!t) continue;
      const x = (sl % 2) * 512, y = (sl >> 1) * 64;
      g.font = fontDe(c); g.fillText(textoDe(c), x + 256, y + 34, 476);
    }
    const px = g.getImageData(0, 0, Wt, Ht).data;
    for (let i = 0, j = ch; i < px.length; i += 4, j += 4) data[j] = px[i];
  }
  const tex = BABYLON.RawTexture.CreateRGBATexture(data, Wt, Ht, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
  tex.wrapU = tex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE; tex.anisotropicFilteringLevel = 8;
  for (const m of ctx.detail.mats) m.setTexture('tRot', tex);
  API.tex = tex;
}

// ------------------------------------------------------------------ plan de un local (gancho de shopPlan)
// s: el local de interiors.js (w0, w1, door, sign, awn, shut, seed, type, T…). Si s.neg está puesto (Fase 4) o hay forzado,
// lo convierte: s.esc (modelo), s.neg, tipo de interior, toldo, persianas, rótulo (s.rot, s.rotSt, s.rotBg), números propios (s.q)
function plan(env, run, s) {
  let neg = s.neg !== undefined && s.neg >= 0 ? s.neg : -1;
  const f = API.force;
  env.rnd(30, run.i, s.w0);
  const q = []; for (let j = 0; j < 16; j++) q.push(R());
  if (neg < 0 && f) {
    if (f === 'auto') { const r = run.r, u = (s.w0 + s.w1) / 2 * run.bw, C_ = window.BCN_CONDAL, at = C_ && C_.at(r.ax + r.tx * u, r.az + r.tz * u);
      neg = elige(at && at.negocios, q[0]); if (neg < 0) neg = 0; }
    else if (f.startsWith('neg:')) neg = Math.min(NEG.length - 1, +f.slice(4));
    else { const ls = POR[f]; neg = ls[(q[0] * ls.length) | 0]; }
  }
  if (neg < 0) return false;
  return prepara(env, run, s, neg, q);
}
function prepara(env, run, s, neg, q) {
  const G = NEG[neg], m = M[G.e];
  s.esc = G.e; s.neg = neg; s.q = q;
  s.type = G.tipo; s.T = TY[s.type];
  // toldo con el color del negocio (o uno de barrio), persianas según el modelo
  s.awn = q[1] < m.toldo; if (s.awn) s.T = Object.assign({}, s.T, { awn: q[2] < 0.6 ? s.T.awn : TOLDOS[(q[3] * TOLDOS.length) | 0] });
  if (m.bajo !== 'normal') s.shut = 0;
  else if (s.shut) s.shut = q[4] < m.pers * 3 ? s.shut : 0;
  // rótulo: nombre k del negocio, y estilo, letra y fondo del modelo
  s.sign = m.rot.length > 0 && q[5] < 0.96;
  if (m.rot.length) { const rr = m.rot[(q[6] * m.rot.length) | 0];
    s.rot = neg * 4 + ((q[7] * 4) | 0); s.rotSt = rr[0]; s.rotFg = rr[1]; s.rotBg = rr[2] || [0, 0, 0];
    // farmacia: «Farmàcia» en caja verde con letra blanca, alguna de guardia (toda la noche)
    if (G.e === 'farmacia') s.rotSt = q[8] < 0.25 ? 7 : 1; }
  // local vacío: persiana con grafiti o cristales empapelados; cartel de «Es lloga»
  if (m.bajo === 'vacio') { s.vac = q[8] < 0.55 ? 'pers' : 'papel'; s.cartel = q[9] < 0.8 ? ESP.ESLLOGA + ((q[10] * 4) | 0) : -1;
    s.oldRot = q[11] < 0.35 ? ((q[12] * 236) | 0) & ~3 | ((q[13] * 4) | 0) : -1; }
  return true;
}

// ------------------------------------------------------------------ vanos (gancho de shopBay)
// Devuelve true si el vano queda dibujado. Los modelos de bajo 'normal' y 'vacio' (papel) dibujan el vano de siempre de
// interiors.js (machones, vidrio con interior, puerta, toldo, persiana) y le añaden lo suyo encima del vidrio
function geom(env, run, W, gl, s) {
  const [B_, V_] = L.opening(run, W), top = L.topOf(env, gl), sill = gl + 0.5, dc = (B_ + V_) / 2;
  return { a: W * run.bw, B_, V_, Uw: V_ - B_, top, sill, door: W === s.door, dc, x0: dc - 0.55, x1: dc + 0.55, th: gl + 0.03, dt: Math.min(top - 0.3, gl + 2.28) };
}
function bay(env, run, W, gl, yB, s) {
  if (!L || !s.esc || s._dentro) return false;
  const m = M[s.esc], g = geom(env, run, W, gl, s), { W0, W1 } = env, F = run.F;
  if (m.bajo === 'oscuro') { bayOscuro(env, run, W, gl, yB, s, g); return true; }
  if (m.bajo === 'hotel') { bayHotel(env, run, W, gl, yB, s, g); return true; }
  if (m.bajo === 'portalon') { bayPortalon(env, run, W, gl, yB, s, g); return true; }
  s._dentro = true; try { L.shopBay(env, run, W, gl, yB, s); } finally { s._dentro = false; }
  const q = s.q, sd = (s.seed + W * 37) & 255, d = -0.345;
  // lo que se pinta delante del vidrio (1,5 cm por delante): fuera de la puerta, salvo los vinilos y la persiana del vacío
  const glassSpans = g.door ? [[g.B_, g.x0, g.sill], [g.x1, g.V_, g.sill], [g.x0, g.x1, g.th]] : [[g.B_, g.V_, g.sill]];
  const over = (y0f, y1f, col, modo, vr, conPuerta) => { for (const [u0, u1, y0] of glassSpans) { if (!conPuerta && y0 === g.th) continue;
    const ya = y0f(y0), yb = y1f(y0); if (yb - ya > 0.05 && u1 - u0 > 0.05) rect(W0, F, u0, u1, ya, yb, d, col, K.ESC, eAux(modo, sd, vr)); } };
  if (m.bajo === 'vacio') {
    if (s.vac === 'pers') {
      const h0 = g.door ? g.th : g.sill, sc = [[150, 152, 150], [120, 122, 124], [88, 92, 96], [56, 84, 66], [104, 52, 46]][(q[14] * 5) | 0];
      rect(W0, F, g.B_ + 0.04, g.V_ - 0.04, h0, g.top, -0.27, sc, K.ESC, eAux(EM.PERS, sd, 0));
      box(W0, F, g.B_ + 0.04, g.V_ - 0.04, h0 - 0.05, h0, -0.29, -0.25, shade(sc, 0.8), K.METAL, 2);
      if (W1) { box(W1, F, g.B_ + 0.01, g.B_ + 0.05, h0, g.top, -0.3, -0.26, shade(sc, 0.8), K.METAL, 4); box(W1, F, g.V_ - 0.05, g.V_ - 0.01, h0, g.top, -0.3, -0.26, shade(sc, 0.8), K.METAL, 4); }
    } else over(y => y, () => g.top, [200, 196, 186], EM.PAPEL, 0, true);
    // cartel de «Es lloga» a la altura de los ojos, en el vano del medio del local
    if (s.cartel >= 0 && W === ((s.w0 + s.w1) >> 1)) { const w = Math.min(1.2, g.Uw - 0.3), uc = g.door ? (g.B_ + g.x0) / 2 : g.dc, ww = g.door ? Math.min(w, g.x0 - g.B_ - 0.1) : w;
      if (ww > 0.4) { const h = ww / 8 * 2, y = gl + 1.45;
        quad(W0, F, uc - ww / 2, y, -0.24, uc + ww / 2, y, -0.24, uc + ww / 2, y + h, -0.24, uc - ww / 2, y + h, -0.24, [250, 214, 40], K.ROTULO, rAux(s.cartel, 4, 6));
        } }
    return true;
  }
  const cr = m.cristal, h = g.top - g.sill;
  if (cr === 'cortina' && q[9] < 0.7) over(y => y, y => y + Math.min(1.0, h * 0.42), [[150, 30, 34], [236, 228, 210], [40, 60, 50], [200, 180, 140]][(q[10] * 4) | 0], EM.CORTINA, 0, false);
  else if (cr === 'cortina') over(y => y + 0.1, y => y + Math.min(0.9, h * 0.4), [200, 200, 196], EM.VINILO, 1, false);
  if (cr === 'fotos') over(() => g.top - Math.min(0.95, h * 0.42), () => g.top - 0.08, [255, 255, 255], EM.FOTOS, 0, false);
  if (cr === 'ofertas' && (W + (q[9] * 3 | 0)) % 2 === 0) over(() => g.top - Math.min(1.2, h * 0.5), () => g.top - 0.1, [255, 255, 255], EM.CARTELES, 1, false);
  if (cr === 'precios') over(y => y + 0.6, y => y + Math.min(1.6, h * 0.65), [255, 255, 255], EM.CARTELES, 0, false);
  if (cr === 'carteles2' && W === s.door + (s.door > s.w0 ? -1 : 1)) over(y => y + 0.35, y => y + Math.min(1.75, h * 0.75), [255, 255, 255], EM.CARTELES, 2, false);
  if (cr === 'vinilo0') over(y => y + 0.3, y => y + Math.min(1.7, h * 0.7), mixc([230, 236, 236], s.rotBg || [255, 255, 255], 0.15), EM.VINILO, 0, true);
  if (cr === 'vinilo1') over(y => y + 0.05, y => y + 0.65, s.rotBg && s.rotBg[0] + s.rotBg[1] + s.rotBg[2] > 0 ? s.rotBg : [220, 110, 150], EM.VINILO, 1, true);
  if (cr === 'vinilo2') over(y => y + 0.75, y => y + 1.45, [255, 120, 30], EM.VINILO, 2, true);
  if (cr === 'rejilla' && !g.door) rect(W1 || W0, F, g.B_ + 0.03, g.V_ - 0.03, g.sill + 0.05, g.top - 0.05, -0.25, [110, 112, 116], K.ESC, eAux(EM.REJILLA, sd, 0));
  if (cr === 'mobils' && W === s.w0 && !g.door) { const w = Math.min(g.Uw - 0.2, 2.4), hh = w / 8;
    quad(W0, F, g.dc - w / 2, g.top - 0.2 - hh, d, g.dc + w / 2, g.top - 0.2 - hh, d, g.dc + w / 2, g.top - 0.2, d, g.dc - w / 2, g.top - 0.2, d, [255, 255, 255], K.ROTULO, rAux(ESP.MOBILS, 7, 4)); }
  if (m.placa && g.door && W1) box(W1, F, g.x1 + 0.08, g.x1 + 0.4, gl + 1.35, gl + 1.6, 0.0, 0.015, [190, 150, 70], K.PBR, 7, pbrAux(0.3, 1, 0, 0));
  return true;
}
// discoteca, bar musical: frente cerrado y oscuro, puerta con marco de neón; de día, persiana metálica bajada (con grafiti)
function bayOscuro(env, run, W, gl, yB, s, g) {
  const { W0, W1, F1 } = env, F = run.F, SC = L.shopCols(env), sc = SC.sc, KS = SC.kS, sd = (s.seed + W * 37) & 255;
  rect(W0, F, g.a, g.B_, yB, F1, 0, sc, KS); rect(W0, F, g.V_, g.a + run.bw, yB, F1, 0, sc, KS); rect(W0, F, g.B_, g.V_, g.top, F1, 0, sc, KS);
  jamb(W0, F, g.B_, gl, g.top, -0.25, 0, shade(sc, 0.7), KS); jamb(W0, F, g.V_, gl, g.top, -0.25, 0, shade(sc, 0.7), KS); hpl(W0, F, g.B_, g.V_, g.top, -0.25, 0, shade(sc, 0.6), KS);
  const dark = [18, 16, 20], pint = pbrAux(0.45, 0, 3, 0);
  if (g.door) {
    rect(W0, F, g.B_, g.x0 - 0.1, gl, g.top, -0.25, dark, K.PBR, pint); rect(W0, F, g.x1 + 0.1, g.V_, gl, g.top, -0.25, dark, K.PBR, pint);
    rect(W0, F, g.x0 - 0.1, g.x1 + 0.1, g.dt + 0.1, g.top, -0.25, dark, K.PBR, pint);
    rect(W0, F, g.x0, g.x1, g.th, g.dt, -0.33, [40, 26, 30], K.PBR, pbrAux(0.5, 0, 0, 0));   // puerta acolchada
    jamb(W0, F, g.x0, g.th, g.dt, -0.33, -0.25, dark, K.PBR); jamb(W0, F, g.x1, g.th, g.dt, -0.33, -0.25, dark, K.PBR); hpl(W0, F, g.x0, g.x1, g.dt, -0.33, -0.25, dark, K.PBR);
    const nc = [[255, 40, 200], [40, 220, 255], [255, 60, 60], [160, 80, 255]][(s.q[9] * 4) | 0];
    for (const [u0, u1, y0, y1] of [[g.x0 - 0.1, g.x0 - 0.05, g.th, g.dt + 0.1], [g.x1 + 0.05, g.x1 + 0.1, g.th, g.dt + 0.1], [g.x0 - 0.1, g.x1 + 0.1, g.dt + 0.05, g.dt + 0.1]])
      box(W0, F, u0, u1, y0, y1, -0.25, -0.2, nc, K.ESC, 7, eAux(EM.NEON, sd, 0));
  } else rect(W0, F, g.B_, g.V_, gl, g.top, -0.25, dark, K.PBR, pint);
  // persiana de día, delante de todo
  rect(W0, F, g.B_ + 0.02, g.V_ - 0.02, gl + 0.03, g.top, -0.12, [96, 98, 100], K.ESC, eAux(EM.PERSDIA, sd, 0));
  if (W1) { box(W1, F, g.B_ + 0.01, g.B_ + 0.05, gl, g.top, -0.14, -0.1, [70, 72, 74], K.METAL, 4); box(W1, F, g.V_ - 0.05, g.V_ - 0.01, gl, g.top, -0.14, -0.1, [70, 72, 74], K.METAL, 4); }
}
// hotel: machones de piedra, vidrio alto con el vestíbulo (zaguán de interiors.js, encendido al anochecer) y puerta de vidrio
function bayHotel(env, run, W, gl, yB, s, g) {
  const { W0, W1, F1 } = env, F = run.F, SC = L.shopCols(env), sc = SC.sc, KS = SC.kS, met = [150, 120, 60];
  rect(W0, F, g.a, g.B_, yB, F1, 0, sc, KS); rect(W0, F, g.V_, g.a + run.bw, yB, F1, 0, sc, KS); rect(W0, F, g.B_, g.V_, g.top, F1, 0, sc, KS);
  jamb(W0, F, g.B_, gl, g.top, -0.4, 0, shade(sc, 0.78), KS); jamb(W0, F, g.V_, gl, g.top, -0.4, 0, shade(sc, 0.78), KS); hpl(W0, F, g.B_, g.V_, g.top, -0.4, 0, shade(sc, 0.68), KS);
  const rm = { x0: s.x0, W: s.W, yF: s.yF, H: Math.min(7.9, g.top - s.yF + 0.3), D: Math.min(16, Math.max(5, s.W * 0.8)), mode: 0, seed: s.seed };
  const y0 = g.door ? g.th : gl + 0.25;
  if (!g.door) rect(W0, F, g.B_, g.V_, gl, y0, -0.36, shade(sc, 0.8), KS);
  L.roomQuad(W0, F, g.B_, g.V_, y0, g.top, -0.38, rm);
  for (const u of g.door ? [g.B_, g.x0, g.x1, g.V_] : [g.B_, g.dc, g.V_]) box(W0, F, u - 0.03, u + 0.03, y0, g.top, -0.4, -0.33, met, K.PBR, 7, pbrAux(0.3, 1, 0, 0));
  if (g.door) box(W0, F, g.x0, g.x1, g.dt - 0.03, g.dt + 0.03, -0.4, -0.33, met, K.PBR, 7, pbrAux(0.3, 1, 0, 0));
  if (W1 && g.door) for (const u of [g.x0 + 0.48, g.x1 - 0.48]) box(W1, F, u - 0.015, u + 0.015, g.th + 0.8, g.th + 1.5, -0.33, -0.27, met, K.PBR, 7, pbrAux(0.3, 1, 0, 0));
}
// taller, garaje, almacén: portalón de suelo a dintel. Taller abierto de día (se ve dentro) o con la persiana grande a medias;
// almacén y nave con portalón de chapa nervada; parking con la boca oscura
function bayPortalon(env, run, W, gl, yB, s, g) {
  const { W0, W1, F1 } = env, F = run.F, SC = L.shopCols(env), sc = SC.sc, KS = SC.kS, q = s.q, sd = (s.seed + W * 37) & 255;
  const a = g.a, B_ = Math.max(a + 0.25, g.B_ - 0.15), V_ = Math.min(a + run.bw - 0.25, g.V_ + 0.15), top = Math.min(F1 - 0.5, gl + 3.3);
  rect(W0, F, a, B_, yB, F1, 0, sc, KS); rect(W0, F, V_, a + run.bw, yB, F1, 0, sc, KS); rect(W0, F, B_, V_, top, F1, 0, sc, KS);
  jamb(W0, F, B_, gl, top, -0.3, 0, shade(sc, 0.75), KS); jamb(W0, F, V_, gl, top, -0.3, 0, shade(sc, 0.75), KS); hpl(W0, F, B_, V_, top, -0.3, 0, shade(sc, 0.65), KS);
  hpl(W0, F, B_, V_, gl + 0.02, -0.3, 0.02, [92, 90, 86], K.PBR, pbrAux(0.8, 0, 0, 0));
  const neg = s.neg, alm = s.esc === 'almacen_industrial', park = neg === 54;
  const pc = [[150, 152, 150], [70, 90, 120], [60, 100, 70], [170, 60, 40], [200, 200, 196]][(q[9] * 5) | 0];
  if (park) {
    rect(W0, F, B_, V_, gl, top, -0.35, [14, 14, 16], K.PBR, pbrAux(0.9, 0, 0, 0));
    if (W === s.door) { const w = Math.min(1.8, V_ - B_ - 0.2), h = w / 8; quad(W0, F, g.dc - w / 2, top - h - 0.06, -0.3, g.dc + w / 2, top - h - 0.06, -0.3, g.dc + w / 2, top - 0.06, -0.3, g.dc - w / 2, top - 0.06, -0.3, [24, 60, 160], K.ROTULO, rAux(ESP.PARQUING, 0, 1)); }
    return;
  }
  const open = !alm && (W === s.door || q[10 + (W % 4)] < 0.4);
  if (open) {
    // abierto: se ve el taller por dentro (vidrio del interior de interiors.js sin vidrio delante) y la persiana recogida arriba
    L.glassQuad(W0, F, B_, V_, gl + 0.02, top, -0.36, s, false);
    box(W0, F, B_, V_, top - 0.32, top, -0.3, -0.05, shade(pc, 0.85), K.PBR, 3, pbrAux(0.55, 0.5, 1, 0));
  } else if (alm) {
    rect(W0, F, B_, V_, gl + 0.02, top, -0.28, pc, K.PBR, pbrAux(0.5, 0.4, 2, 0));
    if (W === s.door && W1) { const u0 = g.dc - 0.45, u1 = g.dc + 0.45;   // puerta de paso recortada en el portalón
      for (const [p0, p1, y0, y1] of [[u0, u0 + 0.04, gl, gl + 2.05], [u1 - 0.04, u1, gl, gl + 2.05], [u0, u1, gl + 2.01, gl + 2.05]]) box(W1, F, p0, p1, y0, y1, -0.28, -0.26, shade(pc, 0.6), K.METAL);
      box(W1, F, u1 - 0.16, u1 - 0.1, gl + 1.0, gl + 1.06, -0.28, -0.22, [40, 40, 44], K.METAL); }
    if (W1) box(W1, F, B_, V_, gl + 0.02, gl + 0.12, -0.3, -0.24, shade(pc, 0.7), K.METAL, 1);
  } else {
    const bot = q[14] < 0.5 ? gl + 0.03 : top - (top - gl) * (0.35 + 0.4 * q[15]);
    rect(W0, F, B_ + 0.03, V_ - 0.03, bot, top, -0.27, pc, K.ESC, eAux(EM.PERS, sd, 0));
    if (bot > gl + 0.2) L.glassQuad(W0, F, B_, V_, gl + 0.02, bot, -0.36, s, false);
    box(W0, F, B_ + 0.03, V_ - 0.03, bot - 0.05, bot, -0.29, -0.25, shade(pc, 0.7), K.METAL, 2);
  }
  if (W1) { box(W1, F, B_, B_ + 0.05, gl, top, -0.3, -0.24, shade(pc, 0.6), K.METAL, 4); box(W1, F, V_ - 0.05, V_, gl, top, -0.3, -0.24, shade(pc, 0.6), K.METAL, 4); }
}

// ------------------------------------------------------------------ lo del local entero (gancho del final de groundFloor)
function front(env, run, s) {
  if (!L || !s.esc) return false;
  const m = M[s.esc], { W0, W1, F1 } = env, F = run.F, q = s.q;
  // rótulo sobre los vanos (más alto en souvenirs y talleres), con su faja a juego (no en las letras sueltas)
  const big = m.rotG || m.bajo === 'portalon', sv0 = s.top + 0.12, hmax = Math.min(big ? 0.85 : 0.56, F1 - 0.2 - sv0);
  let rot = s.sign ? s.rot : -1, est = s.rotSt, fg = s.rotFg, bg = s.rotBg;
  if (m.bajo === 'vacio') { rot = s.oldRot; est = 0; fg = 1; bg = [120, 110, 96]; }   // rótulo viejo del negocio que cerró
  if (rot >= 0 && hmax > 0.22) {
    const w = Math.min(hmax * 8, s.uB - s.uA - 0.1), h = w / 8, uc = (s.uA + s.uB) / 2, y = sv0 + (hmax - h) / 2, suelta = est === 4 || est === 5;
    quad(W0, F, uc - w / 2, y, 0.085, uc + w / 2, y, 0.085, uc + w / 2, y + h, 0.085, uc - w / 2, y + h, 0.085, bg, K.ROTULO, rAux(rot, fg, est));
    if (!suelta) box(W1, F, uc - w / 2 - 0.03, uc + w / 2 + 0.03, y - 0.03, y + h + 0.03, 0, 0.06, est === 1 || est === 7 ? shade(bg, 0.6) : L.shopCols(env).met, K.METAL);
    else if (W1) for (const u of [uc - w * 0.35, uc + w * 0.35]) box(W1, F, u - 0.02, u + 0.02, y + h * 0.4, y + h * 0.6, 0, 0.085, [60, 60, 64], K.METAL);
  }
  const dU = (() => { const [a, b] = L.opening(run, s.door); return [a, b, (a + b) / 2]; })(), gl = s.yF - 0.03;
  // farmacia: cruz verde luminosa en banderola
  if (m.cruz) { const uc = s.uA - 0.14, y = s.top - 0.5, gc = [40, 215, 95], N = pbrAux(0.5, 0, 0, 1);
    box(W0, F, uc - 0.04, uc + 0.04, y - 0.11, y + 0.11, 0.2, 0.86, gc, K.PBR, 7, N); box(W0, F, uc - 0.04, uc + 0.04, y - 0.33, y + 0.33, 0.42, 0.64, gc, K.PBR, 7, N);
    box(W1, F, uc - 0.015, uc + 0.015, y - 0.02, y + 0.02, 0, 0.2, [24, 24, 27], K.METAL); }
  // salud: cruz o logo pequeño junto a la puerta (verde, azul o turquesa)
  if (s.esc === 'salud' && W1) { const uc = dU[1] + 0.35, y = gl + 2.2, c = [[30, 160, 80], [30, 110, 200], [20, 150, 150]][(q[11] * 3) | 0];
    box(W1, F, uc - 0.05, uc + 0.05, y - 0.16, y + 0.16, 0, 0.04, c, K.PBR, 7, pbrAux(0.4, 0, 0, 0.5)); box(W1, F, uc - 0.16, uc + 0.16, y - 0.05, y + 0.05, 0, 0.04, c, K.PBR, 7, pbrAux(0.4, 0, 0, 0.5)); }
  // restaurante: carta enmarcada y con luz junto a la puerta
  if (m.carta && W1) { const uc = dU[0] - 0.32, y = gl + 1.25;
    box(W1, F, uc - 0.22, uc + 0.22, y, y + 0.55, 0, 0.06, [60, 40, 24], K.WOOD); rect(W1, F, uc - 0.18, uc + 0.18, y + 0.04, y + 0.51, 0.062, [250, 250, 250], K.ESC, eAux(EM.CARTELES, s.seed, 0));
    box(W1, F, uc - 0.12, uc + 0.12, y + 0.58, y + 0.62, 0, 0.14, [30, 30, 30], K.METAL); }
  // hotel: marquesina sobre la puerta, banderas y placa de la categoría
  if (s.esc === 'hotel') {
    const u0 = dU[0] - 0.4, u1 = dU[1] + 0.4, y = Math.min(s.top + 0.05, F1 - 0.4), dm = Math.min(1.8, acera(env, run, s).S - 0.8);
    if (dm > 0.6) { box(W0, F, u0, u1, y, y + 0.16, 0, dm, [40, 40, 44], K.PBR, 7, pbrAux(0.35, 0.6, 0, 0));
      if (W1) for (let k = 0; k < 4; k++) box(W1, F, u0 + 0.3 + k * (u1 - u0 - 0.6) / 3 - 0.06, u0 + 0.3 + k * (u1 - u0 - 0.6) / 3 + 0.06, y - 0.01, y, dm * 0.3, dm * 0.3 + 0.12, [255, 236, 190], K.LAMP); }
    if (W1) { const ns = Math.min(3, Math.max(1, ((s.uB - s.uA) / 2.5) | 0)), FLAGS = [[200, 30, 40], [250, 200, 40], [30, 60, 160], [240, 240, 236], [20, 120, 60]];
      for (let k = 0; k < ns; k++) { const u = s.uA + (s.uB - s.uA) * (k + 0.5) / ns, yb = Math.min(F1 + 0.6, s.top + 1.4);
        box(W1, F, u - 0.02, u + 0.02, yb, yb + 0.04, 0, 1.3, [200, 200, 204], K.PBR, 7, pbrAux(0.3, 1, 0, 0));
        quad(W1, F, u, yb + 0.02, 0.15, u, yb + 0.02, 1.25, u, yb - 0.85, 1.25, u, yb - 0.85, 0.15, FLAGS[(((q[12] * 5) | 0) + k) % 5], K.PBR, pbrAux(0.85, 0, 0, 0)); }
      box(W1, F, dU[1] + 0.15, dU[1] + 0.45, gl + 2.0, gl + 2.3, 0, 0.03, [30, 70, 160], K.PBR, 7, pbrAux(0.4, 0, 0, 0.3)); }
  }
  // discoteca: cordón con postes de latón y lámpara sobre la puerta
  if (s.esc === 'ocio_nocturno' && W1) { const d0 = 0.5, d1 = 1.3, LAT = pbrAux(0.3, 1, 0, 0);
    for (const u of [dU[0] - 0.1, dU[1] + 0.1]) for (const dd of [d0, d1]) box(W1, F, u - 0.03, u + 0.03, gl, gl + 0.95, dd - 0.03, dd + 0.03, [200, 160, 70], K.PBR, 7, LAT);
    for (const u of [dU[0] - 0.1, dU[1] + 0.1]) quad(W1, F, u, gl + 0.88, d0, u, gl + 0.88, d1, u, gl + 0.8, d1, u, gl + 0.8, d0, [150, 20, 30], K.PBR, pbrAux(0.6, 0, 0, 0));
    box(W1, F, dU[2] - 0.12, dU[2] + 0.12, s.top - 0.1, s.top, 0, 0.25, [255, 80, 200], K.ESC, 7, eAux(EM.NEON, s.seed, 0)); }
  // estanco: banderola con la «T» (marrón y amarillo) y máquina de tabaco fuera
  if (s.esc === 'estanco') { const uc = s.uB + 0.1, y = Math.min(s.top + 0.2, F1 - 0.6), mk = [90, 58, 30], am = [250, 200, 40], NL = pbrAux(0.5, 0, 0, 0.6);
    box(W0, F, uc - 0.04, uc + 0.04, y - 0.3, y + 0.3, 0.15, 0.85, mk, K.PBR, 7, pbrAux(0.5, 0, 0, 0.2));
    box(W1, F, uc - 0.05, uc + 0.05, y + 0.12, y + 0.2, 0.3, 0.7, am, K.PBR, 7, NL); box(W1, F, uc - 0.05, uc + 0.05, y - 0.22, y + 0.2, 0.46, 0.54, am, K.PBR, 7, NL);
    box(W1, F, uc - 0.015, uc + 0.015, y - 0.02, y + 0.02, 0, 0.15, [24, 24, 27], K.METAL);
    const A = acera(env, run, s), um = dU[1] + 0.55;
    if (W1 && A.S >= 2.6 && A.free(um, 0.35)) { box(W1, F, um - 0.32, um + 0.32, gl, gl + 1.75, 0, 0.42, [70, 40, 26], K.PBR, 7, pbrAux(0.4, 0, 0, 0));
      rect(W1, F, um - 0.26, um + 0.26, gl + 0.95, gl + 1.6, 0.425, [200, 170, 90], K.ESC, eAux(EM.PANTALLA, s.seed, 0));
      box(W1, F, um - 0.2, um + 0.2, gl + 0.55, gl + 0.62, 0.42, 0.46, [30, 30, 30], K.METAL); } }
  // bar, restaurante, comida rápida: la terraza de interiors.js (mesas, sillas, sombrillas) donde la acera lo permite
  if (m.terraza) L.terrace(env, run, s);
  if (m.acera) aceraDe(env, run, s, m.acera, dU, gl);
  // frutería y verdulería de barrio (alimentación): cajas de fruta en la acera
  if (s.esc === 'alimentacion_tradicional' && s.neg === 8) aceraDe(env, run, s, 'fruta', dU, gl);
  return true;
}
// acera delante del local: ancho libre hasta la calzada (S, m) y utilidades de posición
function acera(env, run, s) {
  if (s._ac) return s._ac;
  const r = run.r, city = L.ctx.city, wp = (u, d) => [r.ax + r.tx * u + r.nx * d, r.az + r.tz * u + r.nz * d];
  let S = 1e9;
  if (city) for (const u of [s.uA, (s.uA + s.uB) / 2, s.uB]) { const [x, z] = wp(u, 0.3); S = Math.min(S, city.roadDist(x, z) + 0.3); }
  if (!(S < 60)) S = 0;
  const free = (u, d) => { if (!city) return false; const [x, z] = wp(u, d); return city.coverAt(x, z, -1) < -1e8; };
  const yAt = (u, d) => { const [x, z] = wp(u, d); return city.walkAt(x, z); };
  return (s._ac = { S, free, yAt });
}
const CAJA = pbrAux(0.8, 0, 0, 0), PLAST = pbrAux(0.5, 0, 0, 0);
function aceraDe(env, run, s, que, dU, gl) {
  const { W1 } = env, F = run.F, q = s.q; if (!W1 || !run.street) return;
  const A = acera(env, run, s); if (A.S < 2.4) return;
  const dMax = Math.min(1.4, A.S - 1.6);
  // tramo libre a un lado de la puerta (el más ancho) para la exposición
  const L0 = dU[0] - 0.25 - s.uA, L1 = s.uB - dU[1] - 0.25, izq = L0 >= L1, u0 = izq ? s.uA + 0.1 : dU[1] + 0.25, u1 = izq ? dU[0] - 0.25 : s.uB - 0.1;
  if (u1 - u0 < 0.8) return;
  if (que === 'fruta') {
    // dos gradas de cajas de fruta inclinadas
    const n = Math.min(6, Math.floor((u1 - u0) / 0.6)), d0 = 0.1, d1 = Math.min(0.9, dMax);
    if (d1 < 0.5) return;
    box(W1, F, u0, u0 + n * 0.6, gl, gl + 0.55, d0, d1, [120, 110, 100], K.PBR, 7, CAJA);
    for (let k = 0; k < n; k++) { const a = u0 + k * 0.6 + 0.03, b = a + 0.54;
      box(W1, F, a, b, gl + 0.55, gl + 0.7, d0, d1, [176, 140, 90], K.WOOD, 7);
      quad(W1, F, a + 0.02, gl + 0.72, d1 - 0.02, b - 0.02, gl + 0.72, d1 - 0.02, b - 0.02, gl + 0.8, d0 + 0.02, a + 0.02, gl + 0.8, d0 + 0.02, Z, K.ESC, eAux(EM.FRUTA, s.seed + k * 7, 0)); }
  } else if (que === 'flores') {
    // grada de tres escalones con cubos de flores y plantas en el suelo
    const d1 = Math.min(1.1, dMax); if (d1 < 0.5) return;
    for (let e = 0; e < 3; e++) { const y = gl + 0.3 * e, dd0 = 0.05, dd1 = d1 - e * (d1 / 3);
      box(W1, F, u0, u1, y, y + 0.3, dd0, dd1, [70, 60, 52], K.PBR, 6, CAJA);
      for (let u = u0 + 0.05; u + 0.3 < u1; u += 0.34) { const dc = dd1 - 0.2;
        box(W1, F, u, u + 0.28, y + 0.3, y + 0.62, dc - 0.14, dc + 0.14, [[60, 90, 140], [200, 200, 196], [40, 40, 44]][(q[(e * 5 + (u * 3 | 0)) & 15] * 3) | 0], K.PBR, 5, PLAST);
        box(W1, F, u - 0.02, u + 0.3, y + 0.62, y + 0.9, dc - 0.16, dc + 0.16, Z, K.ESC, 5, eAux(EM.FLORES, s.seed + e * 31 + (u * 7 | 0), 0)); } }
  } else if (que === 'souvenirs') {
    // expositores giratorios de imanes y postales, y un burro de camisetas
    const n = Math.min(3, Math.floor((u1 - u0) / 0.9)), dc = Math.min(0.7, dMax - 0.3); if (dc < 0.4) return;
    for (let k = 0; k < n; k++) { const u = u0 + 0.45 + k * 0.9, y = gl;
      box(W1, F, u - 0.04, u + 0.04, y, y + 0.25, dc - 0.04, dc + 0.04, [60, 60, 64], K.METAL);
      if (k % 2 === 0 || n === 1) { box(W1, F, u - 0.25, u + 0.25, y + 0.25, y + 1.75, dc - 0.25, dc + 0.25, [230, 228, 220], K.ESC, 5, eAux(EM.EXPOS, s.seed + k * 17, 0)); }
      else { box(W1, F, u - 0.42, u + 0.42, y + 1.62, y + 1.66, dc - 0.02, dc + 0.02, [180, 180, 186], K.METAL);
        for (const uu of [u - 0.42, u + 0.42]) box(W1, F, uu - 0.02, uu + 0.02, y, y + 1.66, dc - 0.02, dc + 0.02, [180, 180, 186], K.METAL);
        rect(W1, F, u - 0.4, u + 0.4, y + 0.9, y + 1.6, dc, [240, 240, 236], K.ESC, eAux(EM.EXPOS, s.seed + k * 5, 1)); } }
  } else if (que === 'taller') {
    // coche asomando por el portalón abierto (acera ancha) o moto aparcada; manchas de aceite en la acera
    const uc = dU[2], col = [[180, 30, 30], [40, 60, 120], [220, 220, 216], [30, 30, 32], [150, 150, 154], [60, 90, 70]][(q[13] * 6) | 0], PINT = pbrAux(0.3, 0.5, 0, 0);
    hpl(W1, F, uc - 1.2, uc + 1.0, gl + 0.012, 0.05, Math.min(1.6, A.S - 0.6), Z, K.ESC, eAux(EM.MANCHA, s.seed + 9, 0));
    if (A.S >= 4 && q[12] < 0.7) {   // coche de cara a la calle: la mitad fuera
      const a = uc - 0.88, b = uc + 0.88, d1 = Math.min(1.9, A.S - 1.6);
      box(W1, F, a, b, gl + 0.28, gl + 0.95, -1.5, d1, col, K.PBR, 7, PINT);
      box(W1, F, a + 0.12, b - 0.12, gl + 0.95, gl + 1.42, -1.6, d1 - 1.25, shade(col, 0.95), K.PBR, 1, PINT);
      quad(W1, F, a + 0.14, gl + 0.97, d1 - 0.62, b - 0.14, gl + 0.97, d1 - 0.62, b - 0.14, gl + 1.4, d1 - 1.23, a + 0.14, gl + 1.4, d1 - 1.23, [30, 38, 46], K.GLASS);
      for (const u of [a - 0.02, b - 0.2]) box(W1, F, u, u + 0.22, gl, gl + 0.62, d1 - 1.0, d1 - 0.38, [20, 20, 22], K.PBR, 7, PLAST);
      box(W1, F, a + 0.1, a + 0.35, gl + 0.7, gl + 0.82, d1, d1 + 0.02, [250, 250, 230], K.LAMP); box(W1, F, b - 0.35, b - 0.1, gl + 0.7, gl + 0.82, d1, d1 + 0.02, [250, 250, 230], K.LAMP);
    } else if (A.S >= 2.6) {   // moto en la acera, paralela a la fachada
      const d = Math.min(A.S - 1.2, 1.4), u = uc + (q[14] < 0.5 ? -1.3 : 1.3);
      for (const du of [-0.62, 0.62]) box(W1, F, u + du - 0.3, u + du + 0.3, gl, gl + 0.6, d - 0.05, d + 0.05, [24, 24, 26], K.PBR, 7, PLAST);
      box(W1, F, u - 0.5, u + 0.5, gl + 0.4, gl + 0.85, d - 0.16, d + 0.16, col, K.PBR, 7, PINT);
      box(W1, F, u - 0.15, u + 0.45, gl + 0.85, gl + 0.95, d - 0.15, d + 0.15, [30, 30, 32], K.PBR, 7, PLAST);
      box(W1, F, u - 0.6, u - 0.55, gl + 0.85, gl + 1.15, d - 0.3, d + 0.3, [60, 60, 64], K.METAL);
    }
  }
}

// ------------------------------------------------------------------ API para el generador: un local entero en unos vanos
// vano = { w0, w1 } (vanos del tramo, sin el portal) · modelo: id del catálogo (si el negocio no se da, uno del modelo) ·
// negocio: índice de BCN_CONDAL.negocios (o -1) · semilla: entero. Dibuja vidrios, puertas, rótulo y acera en env.W0/W1.
function dibuja(env, run, vano, modelo, negocio, semilla) {
  if (!L) return false;
  const nb = run.nb, bw = run.bw, w0 = Math.max(0, vano.w0 | 0), w1 = Math.min(nb, vano.w1 | 0); if (w1 <= w0) return false;
  const gls = []; for (let W = 0; W < nb; W++) gls.push(Math.min(run.gnd((W + 0.5) * bw), env.F1 - 2.7));
  let st = (semilla | 0) ^ 0x9e3779b9; const rr = () => { st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ st >>> 15, 1 | st); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const q = []; for (let j = 0; j < 16; j++) q.push(rr());
  let neg = negocio >= 0 ? negocio : -1;
  if (neg < 0) { const ls = POR[modelo]; if (!ls) return false; neg = ls[(q[0] * ls.length) | 0]; }
  const n = w1 - w0, s = { w0, w1, door: w0 + Math.min(n - 1, (q[15] * n) | 0), seed: 1 + ((rr() * 254) | 0), shut: rr() < 0.2 ? 1 : 0, shutR: rr(), shutC: [150, 152, 150], sign: true, awn: false };
  prepara(env, run, s, neg, q);
  const F = run.F, dir = (-F.nz * F.tx + F.nx * F.tz) > 0 ? 0 : 1;
  s.uA = L.opening(run, w0)[0]; s.uB = L.opening(run, w1 - 1)[1];
  if (s.awn) s.awnD = Math.min(1.35, Math.max(0.6, acera(env, run, s).S * 0.25));
  s.yF = gls[s.door] + 0.03; s.top = -1e9; for (let W = w0; W < w1; W++) s.top = Math.max(s.top, L.topOf(env, gls[W]));
  const Wd = Math.min(16, s.uB - s.uA + 0.6), H = Math.min(7.9, Math.max(3.3, s.top - s.yF + 0.2)), D = Math.max(4, Math.min(5.5, Wd * 0.9));
  s.x0 = s.uA - 0.3; s.Wb = Math.max(1, Math.round(Wd / 16 * 255)); s.W = s.Wb / 255 * 16; s.Hb = Math.round(H / 8 * 255); s.Db = Math.round(D / 16.32 * 255); s.tb = s.type + 32 * dir;
  const yB = Math.max(env.y0, run.cover - 0.3);
  for (let W = w0; W < w1; W++) bay(env, run, W, gls[W], yB, s);
  front(env, run, s);
  return true;
}

const API = window.BCN_ESC = { MODELOS, M, NEG, NOMBRES, ESP, EM, nombre: (neg, k) => NOMBRES[neg * 4 + (k & 3)], elige, plan, bay, front, dibuja, enlaza,
  force: parseForce(), tex: null };
})();
