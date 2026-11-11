#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Catálogo de hitos de Barcelona (etapa R1): fuente única de gta/data/hitos_catalogo.json y gta/HITOS.md.

Uso:  python3 gta/tools/hitos/catalogo.py      (reescribe los dos ficheros)

Cada ficha: id, nombre (en catalán), lote (a…e), nivel (A/B/C), cat, lat, lon, confianza (de la posición), alto,
ancho, largo (m reales), rot (rumbo del eje largo, grados desde el norte hacia el este, 0–180), forma, rasgos,
colores, noche, fuente, y opcionalmente nota.
x, z, y, edificios y en_datos los añade la etapa R2 (encaje con los datos del juego): `node tools/hitos/encaje.js`
escribe tools/hitos/encaje.json y este script lo mezcla (orden: catalogo.py → encaje.js → catalogo.py).

Fuentes de la posición: «cawiki» / «eswiki» / «enwiki» = coordenadas de la API de Wikipedia (GeoData) consultadas el
2026-11-11; «memoria» = de memoria (puede desviarse 100–200 m; R2 la corrige con la planta real o el poi del juego).
Las medidas de R1 (alto, ancho, largo, rot) eran casi todas de memoria; R2 corrige ancho, largo y rot con la planta del
registro cuando la selección de edificios es fiable (los valores de R1 quedan en `r1`) y guarda lo medido en `planta`
(ancho, largo, rot, area, alto en los datos, clases). x, z (m, mundo) y y (cota del terreno) son los del juego;
`edificios` = índices de BREC (app.js) que el hito sustituye o retoca; `en_datos` = qué hay hoy; `encaje` = cómo se eligió.
Ejes de la cuadrícula del Eixample: calles paralelas al mar ≈ 45°, calles mar-montaña ≈ 135°. Diagonal ≈ 72°.
"""
import json, os

H = []

def h(id, nombre, lote, nivel, cat, lat, lon, conf, alto, ancho, largo, rot, forma, rasgos, colores, noche, fuente,
      nota=None):
    f = dict(id=id, nombre=nombre, lote=lote, nivel=nivel, cat=cat, lat=lat, lon=lon, confianza=conf, alto=alto,
             ancho=ancho, largo=largo, rot=rot, forma=forma, rasgos=rasgos, colores=colores, noche=noche, fuente=fuente)
    if nota:
        f['nota'] = nota
    H.append(f)

PIEDRA = '#c9b48a'
LADR = '#b5543a'

# ---------------------------------------------------------------------------------------------------------------
# Lote a · Gaudí y modernismo
# ---------------------------------------------------------------------------------------------------------------
h('sagrada_familia', 'Sagrada Família', 'a', 'A', 'templo', 41.40369, 2.17433, 'alta', 172.5, 60, 95, 135,
  'Templo ACABADO en cruz latina (nave de 5 naves, crucero de 60 m, ábside al NO sobre Provença) con 18 torres: '
  '12 de apóstoles en las fachadas del Nacimiento (NE, c/ Marina), Pasión (SO, c/ Sardenya) y Gloria (SE, c/ Mallorca, '
  'la principal, con pórtico ancho), de 98–112 m; 4 de evangelistas de 135 m y la de María de 138 m alrededor de la '
  'central de Jesucristo de 172,5 m; claustro perimetral bajo.',
  ['torre central de 172,5 m rematada por una cruz de cuatro brazos', 'torres de apóstoles de pan de azúcar con pináculos de trencadís',
   'evangelistas con su símbolo y María con la estrella', 'silueta escalonada de agujas, piedra ocre'],
  ['#c9b48a', '#a39a8a', '#e6dcc4', '#d24b3a', '#e8c547'], 'focos', 'cawiki',
  'Hoy el juego tiene 19 agujas OSM + naves simplificadas (meta.stats). Torre central y Gloria se modelan como acabadas.')
h('casa_mila', 'Casa Milà (La Pedrera)', 'a', 'A', 'edificio', 41.39528, 2.16167, 'alta', 34, 45, 50, 45,
  'Bloque de esquina en el chaflán Pg. de Gràcia / Provença; fachada continua y ondulada de piedra caliza crema, sin '
  'aristas, con balcones de hierro forjado oscuro que parecen algas; desván con ventanitas y azotea ondulada con '
  'escaleras y chimeneas «guerreros».',
  ['fachada ondulada como olas de piedra', 'balcones de hierro negro enmarañado', 'chimeneas-guerrero en la azotea'],
  ['#d8ccb4', '#efe9dc', '#3a3a32'], 'focos', 'cawiki')
h('casa_batllo', 'Casa Batlló', 'a', 'A', 'edificio', 41.39158, 2.16492, 'alta', 32, 15, 35, 45,
  'Casa entre medianeras en Pg. de Gràcia 43 (lado SO, mira al NE): planta baja y principal con columnas en forma de '
  'hueso, fachada de trencadís azul-verdoso con balcones-máscara, remate de cubierta como lomo de dragón de escamas '
  'cerámicas y torrecilla con cruz de cuatro brazos a un lado.',
  ['lomo de dragón de escamas en la cubierta', 'fachada azul-verde brillante', 'balcones-máscara y columnas-hueso'],
  ['#5f9fb5', '#7aa88a', '#d9a441', '#c9c2b0'], 'focos', 'cawiki', 'Entre medianeras: frente de 15 m.')
h('casa_amatller', 'Casa Amatller', 'a', 'B', 'edificio', 41.39145, 2.16501, 'alta', 28, 18, 30, 45,
  'Casa entre medianeras junto a la Batlló, con hastial escalonado de estilo flamenco que corona la fachada, '
  'esgrafiado rosa y ocre con cerámica brillante.',
  ['hastial escalonado', 'fachada rosada con esgrafiados'], ['#e6c9a8', '#b5544a', '#c9b48a'], 'focos', 'cawiki')
h('casa_lleo_morera', 'Casa Lleó i Morera', 'a', 'C', 'edificio', 41.39124, 2.16553, 'alta', 30, 20, 30, 45,
  'Casa de esquina Pg. de Gràcia / Consell de Cent, piedra clara con mucha escultura y una tribuna-templete redonda en '
  'la esquina.',
  ['templete de esquina', 'piedra clara muy ornamentada'], ['#e3d9c6', '#b8a57e'], 'focos', 'cawiki')
h('park_guell', 'Park Güell (zona monumental)', 'a', 'A', 'parque', 41.4136, 2.1528, 'media', 20, 90, 160, 340,
  'Conjunto en ladera: a la entrada (c/ Olot, al S) dos pabellones de cuento con cubiertas onduladas de trencadís '
  'marrón y blanco (uno con torre y cruz de cuatro brazos); escalinata doble con el dragón de trencadís; encima, la sala '
  'hipóstila de 86 columnas dóricas que sostiene la gran plaza, rematada por el banco ondulado de trencadís de colores.',
  ['pabellones de cuento con tejados de «nata»', 'banco ondulado multicolor al borde de la plaza',
   'columnata dórica bajo la plaza', 'dragón en la escalinata'],
  ['#c79a6b', '#f2efe6', '#4f8fc0', '#d24b3a', '#8a6a4a'], 'focos', 'cawiki',
  'La coordenada es el centro del parque; la zona monumental está algo al S/SE (≈ 41.4135, 2.1530). Poi del juego «Park Güell».')
h('sant_pau', 'Recinte Modernista de Sant Pau', 'a', 'A', 'hospital', 41.4128, 2.1744, 'alta', 50, 300, 400, 0,
  'Ciudad-hospital al final de la Av. Gaudí, girada 45° respecto al Eixample (ejes N-S): pabellones de ladrillo rojo con '
  'cúpulas y torres revestidas de cerámica verde y ocre, unidos por jardines; pabellón de Administración a la entrada '
  'con torre-campanario central y dos alas.',
  ['torre central del pabellón de entrada', 'cúpulas de cerámica verde y amarilla', 'ladrillo rojo'],
  [LADR, '#d9a441', '#3f8f6b', '#e0d2b0'], 'focos', 'cawiki',
  'Alto de la torre de Administración: de memoria (baja). Poi del juego «Hospital de Sant Pau» (≈ 150 m al S de esta coordenada: será la entrada).')
h('palau_musica', 'Palau de la Música Catalana', 'a', 'B', 'teatro', 41.38767, 2.17528, 'alta', 25, 35, 50, 45,
  'Edificio de ladrillo visto rojo en una esquina estrecha de Sant Pere més alt; columnas cubiertas de mosaico floral, '
  'grupo escultórico en la esquina y cuerpo de vidrio moderno anexo.',
  ['ladrillo rojo con mosaicos de flores', 'esquina con grupo escultórico'], [LADR, '#d9a441', '#4f8f6b', '#e0d2b0'],
  'focos', 'cawiki', 'Entre medianeras y calles estrechas: solo se ve de cerca.')
h('casa_vicens', 'Casa Vicens', 'a', 'B', 'casa', 41.40349, 2.15064, 'alta', 20, 18, 22, 45,
  'Casa de aire mudéjar en Gràcia: ladrillo y franjas de azulejo verde y blanco a cuadros con claveles amarillos, '
  'torrecillas y miradores en las esquinas.',
  ['ajedrezado de azulejo verde y blanco', 'torrecillas de esquina'], ['#2f7a4a', '#f0ece0', LADR, '#e2b93b'],
  'focos', 'cawiki')
h('palau_guell', 'Palau Güell', 'a', 'B', 'edificio', 41.37882, 2.17439, 'alta', 30, 18, 22, 45,
  'Palacio entre medianeras en Nou de la Rambla: fachada de piedra gris oscura con dos arcos parabólicos de entrada; '
  'azotea con una veintena de chimeneas de trencadís de colores y una aguja cónica central.',
  ['dos arcos parabólicos', 'chimeneas de colores y aguja central'], ['#8c8778', '#d24b3a', '#e8c547', '#4f8fc0'],
  'focos', 'cawiki')
h('bellesguard', 'Torre Bellesguard', 'a', 'B', 'casa', 41.40956, 2.12686, 'alta', 30, 20, 20, 0,
  'Casa-castillo neogótica en la falda de Collserola: volumen cúbico de pizarra gris y piedra, almenas y una torre-aguja '
  'con cruz de cuatro brazos.',
  ['aguja con cruz de cuatro brazos', 'volumen cúbico gris'], ['#7d7a6e', '#a39a8a', '#d24b3a'], 'focos', 'cawiki')
h('casa_punxes', 'Casa de les Punxes', 'a', 'B', 'edificio', 41.39798, 2.16378, 'alta', 40, 40, 70, 72,
  'Edificio-castillo de ladrillo rojo que ocupa una manzana triangular entre Diagonal y Rosselló, con seis torres '
  'redondas acabadas en agujas cónicas (punxes) de teja.',
  ['seis torres con agujas cónicas', 'ladrillo rojo y piedra'], [LADR, '#5a4a3a', '#d8ccb4'], 'focos', 'cawiki')
h('pavellons_guell', 'Pavellons Güell', 'a', 'B', 'edificio', 41.38932, 2.11927, 'alta', 12, 30, 60, 72,
  'Portería y caballerizas de la finca Güell en Pedralbes: verja de hierro con el dragón, pabellón de portería con '
  'cupulín y caballerizas de ladrillo con linterna; ladrillo ocre y rojo con trencadís.',
  ['verja del dragón', 'cupulines con trencadís'], ['#c79a6b', LADR, '#e6dcc4'], 'focos', 'cawiki')
h('teresianes', "Col·legi de les Teresianes", 'a', 'B', 'edificio', 41.39977, 2.13320, 'alta', 25, 18, 65, 0,
  'Colegio de Gaudí: bloque alargado de ladrillo y piedra de cuatro plantas, coronado por almenas puntiagudas con '
  'cruces en las esquinas.',
  ['bloque alargado de ladrillo', 'almenas puntiagudas'], [LADR, '#c9b48a'], 'nada', 'cawiki', 'rot de memoria (baja).')
h('fundacio_tapies', 'Fundació Antoni Tàpies', 'a', 'C', 'museo', 41.39167, 2.16361, 'alta', 20, 20, 35, 45,
  'Edificio de ladrillo rojo entre medianeras en Aragó, coronado por la escultura de tubos metálicos enmarañados '
  '«Núvol i cadira».',
  ['nube de tubos metálicos en la azotea'], [LADR, '#8c8c8c'], 'nada', 'eswiki')
h('monumental', 'Plaça de toros Monumental', 'a', 'B', 'arena', 41.4000, 2.1811, 'media', 25, 95, 95, 0,
  'Coso circular neomudéjar de ladrillo con arcos, torres en las entradas rematadas por cúpulas en forma de huevo '
  'revestidas de cerámica blanca y azul.',
  ['anillo de ladrillo', 'cúpulas-huevo de cerámica blanca y azul'], [LADR, '#f2efe6', '#3a6fb0'], 'focos', 'cawiki',
  'Coordenada redondeada en la fuente; está en Gran Via / Marina.')
h('universitat', 'Universitat de Barcelona (edifici històric)', 'a', 'B', 'edificio', 41.3866, 2.1639, 'alta', 30, 80, 130, 45,
  'Edificio neorrománico simétrico frente a Gran Via (entre Balmes y Aribau): fachada de piedra ocre, dos torres '
  'cuadradas en los extremos y cuerpo central del paraninfo con ventanales; jardín detrás.',
  ['fachada simétrica con dos torres', 'piedra ocre'], ['#c9b48a', '#8c6a4a'], 'focos', 'cawiki')
h('mercat_sant_antoni', 'Mercat de Sant Antoni', 'a', 'B', 'mercado', 41.37861, 2.16208, 'alta', 20, 110, 110, 0,
  'Mercado de hierro que ocupa una manzana del Eixample, con planta en cruz de San Andrés (las naves van por las '
  'diagonales de la manzana) y nave central octogonal con cúpula; cubiertas de cinc gris.',
  ['planta en aspa', 'linterna central', 'cubiertas grises de dos aguas'], ['#6f7f6f', '#a0a8a8', '#c9b48a'],
  'nada', 'cawiki')
h('castell_tres_dragons', 'Castell dels Tres Dragons', 'a', 'B', 'edificio', 41.38807, 2.18339, 'alta', 25, 40, 60, 45,
  'Edificio-castillo de ladrillo rojo visto en el Parc de la Ciutadella, con almenas, cuatro torretas angulares y '
  'escudos cerámicos blancos en el friso.',
  ['ladrillo rojo con almenas', 'torretas angulares'], [LADR, '#f2efe6'], 'focos', 'cawiki')
h('casa_calvet', 'Casa Calvet', 'a', 'C', 'edificio', 41.39083, 2.17306, 'alta', 25, 18, 30, 135,
  'Casa entre medianeras en Casp: fachada de piedra con dos remates barrocos curvos y tribuna central.',
  ['remates curvos', 'piedra clara'], ['#d8ccb4'], 'nada', 'cawiki')

# ---------------------------------------------------------------------------------------------------------------
# Lote b · Deporte y Montjuïc
# ---------------------------------------------------------------------------------------------------------------
h('camp_nou', 'Camp Nou', 'b', 'A', 'estadio', 41.3808, 2.1228, 'alta', 60, 230, 260, 140,
  'Estadio REMODELADO y ACABADO: cuenco oval de tres graderíos continuos; por fuera, anillos horizontales blancos (los '
  'voladizos de las terrazas) con antepechos en colores azul y granate; gran cubierta en anillo en voladizo, abierta '
  'sobre el campo verde.',
  ['óvalo de terrazas horizontales blancas', 'anillo de cubierta sobre las gradas', 'gradas azul y granate', 'césped'],
  ['#e8e8e4', '#2b4a8a', '#a50044', '#3c8c3c'], 'focos', 'cawiki',
  'rot (eje del campo) de memoria; R2 lo saca de la planta. Sin escudos ni rótulos.')
h('palau_blaugrana', 'Palau Blaugrana', 'b', 'C', 'pabellon', 41.3801, 2.1201, 'alta', 25, 80, 110, 50,
  'Pabellón deportivo junto al Camp Nou: caja ancha de cubierta casi plana.', ['caja ancha baja'],
  ['#c8c4bc', '#2b4a8a', '#a50044'], 'nada', 'cawiki')
h('estadi_olimpic', 'Estadi Olímpic Lluís Companys', 'b', 'A', 'estadio', 41.36472, 2.15556, 'alta', 30, 170, 220, 70,
  'Estadio neoclásico de 1929 en Montjuïc: fachada perimetral de piedra ocre con arcadas, puerta de Maratón con '
  'pórtico y dos grupos ecuestres, una sola marquesina blanca curva sobre la tribuna; pista y campo dentro; pebetero.',
  ['fachada ocre con arcadas', 'marquesina blanca de la tribuna', 'pista roja'], ['#d2b48c', '#f2efe6', '#b5543a', '#3c8c3c'],
  'focos', 'cawiki', 'rot de memoria. Poi del juego «Estadi Olímpic».')
h('palau_sant_jordi', 'Palau Sant Jordi', 'b', 'A', 'pabellon', 41.36339, 2.15256, 'alta', 45, 110, 160, 70,
  'Pabellón de Isozaki: gran cubierta metálica gris en cúpula rebajada (caparazón de tortuga) con lucernarios en franja, '
  'sobre un zócalo de hormigón y ladrillo; explanada delante con un bosque de columnas finas.',
  ['cúpula rebajada gris metálica', 'zócalo macizo'], ['#8c949c', '#c4a68a'], 'focos', 'cawiki')
h('torre_calatrava', 'Torre de Calatrava (Torre de Comunicacions de Montjuïc)', 'b', 'A', 'torre', 41.36417, 2.15056, 'alta',
  136, 10, 40, 0,
  'Torre blanca de Calatrava: un fuste esbelto inclinado (como un atleta con la antorcha) sobre una base revestida de '
  'trencadís, con un anillo semicircular de antenas a media altura.',
  ['fuste blanco inclinado', 'anillo semicircular', 'base de trencadís'], ['#f2f2ee', '#c8c8c0'], 'focos', 'enwiki',
  'rot (dirección de la inclinación) de memoria (baja).')
h('palau_nacional', 'Palau Nacional (MNAC)', 'b', 'A', 'palacio', 41.36833, 2.15331, 'alta', 50, 110, 170, 65,
  'Palacio de 1929 que preside Montjuïc mirando a la Pl. d\'Espanya (al NNO): gran cúpula central elíptica, dos '
  'cúpulas menores, cuatro torres de esquina tipo campanario, piedra ocre; escalinatas y cascadas delante.',
  ['cúpula central', 'cuatro torres de esquina', 'escalinatas y cascadas'], ['#d6c39c', '#8c8478', '#a8b8c0'],
  'focos', 'cawiki', 'Poi del juego «Palau Nacional (MNAC)».')
h('font_magica', 'Font Màgica', 'b', 'B', 'fuente', 41.37114, 2.15173, 'alta', 3, 50, 65, 65,
  'Vaso oval escalonado de piedra a los pies del Palau Nacional; de noche, chorros de agua de colores de hasta 50 m.',
  ['vaso oval escalonado', 'chorros de colores de noche'], ['#c9b48a', '#6fa8d0'], 'focos', 'cawiki')
h('quatre_columnes', 'Les Quatre Columnes', 'b', 'B', 'monumento', 41.37063, 2.15210, 'alta', 20, 4, 40, 65,
  'Cuatro columnas jónicas exentas de piedra, en fila, en el eje de la Av. Reina Maria Cristina bajo el Palau Nacional.',
  ['cuatro columnas jónicas en fila'], ['#d8ccb4'], 'focos', 'cawiki')
h('torres_venecianes', 'Torres Venecianes', 'b', 'B', 'torre', 41.3742, 2.1500, 'alta', 47, 8, 55, 65,
  'Dos campanarios de ladrillo rojo a la entrada de la Av. Reina Maria Cristina (Pl. d\'Espanya): fuste cuadrado, '
  'cuerpo de campanas con arcos y aguja piramidal; a 50 m uno de otro.',
  ['pareja de campanarios rojos', 'aguja piramidal'], [LADR, '#d8ccb4', '#5f7f6a'], 'focos', 'cawiki')
h('arenas', 'Las Arenas', 'b', 'A', 'arena', 41.3763, 2.1490, 'media', 35, 105, 105, 0,
  'Antigua plaza de toros convertida en centro comercial: anillo neomudéjar de ladrillo rojo con arcos de herradura y '
  'bandas de cerámica, coronado por una cubierta-mirador circular y una cúpula baja; torre de ascensores exterior.',
  ['anillo neomudéjar de ladrillo', 'arcos de herradura', 'cubierta-mirador'], [LADR, '#e6dcc4', '#8c949c'], 'focos', 'memoria')
h('castell_montjuic', 'Castell de Montjuïc', 'b', 'A', 'fortaleza', 41.3634, 2.1662, 'alta', 25, 150, 180, 0,
  'Fortaleza abaluartada del s. XVIII en la cima: planta en estrella con baluartes, foso seco y muros en talud de '
  'piedra ocre; cuerpo central cuadrado con patio y una torre de vigía pequeña.',
  ['planta en estrella con baluartes', 'foso', 'torre de vigía'], ['#c4a77d', '#8c7a5a', '#6a7a4a'], 'focos', 'cawiki',
  'Poi del juego «Castell de Montjuïc».')
h('picornell', 'Piscines Bernat Picornell', 'b', 'C', 'pabellon', 41.3656, 2.1502, 'alta', 15, 60, 100, 70,
  'Piscinas olímpicas: caja baja con gradas.', ['caja baja con gradas'], ['#d8d8d0'], 'nada', 'cawiki')
h('pavello_mies', 'Pavelló Mies van der Rohe', 'b', 'B', 'pabellon', 41.37056, 2.15000, 'alta', 4, 25, 55, 65,
  'Pabellón de 1929: losa de cubierta plana y fina sobre muros de travertino, ónice y vidrio, con dos estanques.',
  ['losa fina flotante', 'estanques'], ['#f2f2ee', '#d8ccb4', '#2a3a3a'], 'focos', 'enwiki', 'rot de memoria (baja).')
h('caixaforum', 'CaixaForum (Casaramona)', 'b', 'B', 'fabrica', 41.37133, 2.14975, 'alta', 30, 80, 100, 65,
  'Antigua fábrica modernista de ladrillo rojo: naves bajas almenadas y dos torres de aguja ornamentadas.',
  ['dos torres de aguja', 'naves almenadas de ladrillo'], [LADR, '#e0d2b0'], 'focos', 'enwiki')
h('palaus_fira', "Palaus d'Alfons XIII i Victòria Eugènia", 'b', 'B', 'palacio', 41.37009, 2.15244, 'alta', 30, 160, 200, 65,
  'Dos palacios gemelos de exposición a ambos lados de la Av. Reina Maria Cristina: fachadas claras ornamentadas con '
  'torretas y cupulines en las esquinas.',
  ['pareja de palacios simétricos', 'torretas de esquina'], ['#e6dcc4', '#c9b48a'], 'focos', 'cawiki')
h('poble_espanyol', 'Poble Espanyol (Torres d\'Àvila)', 'b', 'B', 'conjunto', 41.36914, 2.14669, 'alta', 24, 40, 30, 0,
  'Recinto amurallado; lo reconocible es la puerta de entrada copia de las murallas de Ávila: dos torres almenadas de '
  'piedra con lienzo de muralla entre ellas.',
  ['dos torres almenadas de muralla'], ['#b8a688', '#8c7a5a'], 'focos', 'cawiki',
  'La coordenada es el centro del recinto; la puerta queda en su lado E (≈ 41.3687, 2.1490).')
h('fundacio_miro', 'Fundació Joan Miró', 'b', 'B', 'museo', 41.36861, 2.16000, 'alta', 12, 60, 80, 0,
  'Edificio blanco de Sert: volúmenes bajos de hormigón blanco con lucernarios en cuarto de cilindro y una torre '
  'octogonal.',
  ['blanco puro', 'lucernarios curvos'], ['#f2f2ee'], 'nada', 'enwiki')
h('teatre_grec', 'Teatre Grec', 'b', 'C', 'teatro', 41.3694, 2.15972, 'alta', 10, 70, 70, 0,
  'Teatro al aire libre en una antigua cantera: gradas semicirculares de piedra.', ['gradas semicirculares'],
  ['#c9b48a', '#6a7a4a'], 'nada', 'eswiki')
h('piscina_montjuic', 'Piscina Municipal de Montjuïc', 'b', 'C', 'pabellon', 41.36945, 2.16504, 'alta', 15, 50, 70, 0,
  'Piscina de saltos con gradas mirando la ciudad.', ['plataforma de saltos'], ['#d8d8d0', '#3a8fc0'], 'nada', 'cawiki')
h('velodrom_horta', "Velòdrom d'Horta", 'b', 'B', 'estadio', 41.43813, 2.14886, 'alta', 12, 100, 150, 0,
  'Velódromo de hormigón: óvalo con pista peraltada y graderío bajo.', ['óvalo de pista peraltada'], ['#c8c4bc', '#b5543a'],
  'nada', 'eswiki')

# ---------------------------------------------------------------------------------------------------------------
# Lote c · Torres y frente marítimo
# ---------------------------------------------------------------------------------------------------------------
h('torre_glories', 'Torre Glòries', 'c', 'A', 'torre', 41.40349, 2.18952, 'alta', 144, 36, 40, 0,
  'Bala de planta elíptica que se afila arriba en cúpula; piel de lamas de vidrio sobre chapa de colores (rojos y '
  'naranjas abajo, azules y grises arriba).',
  ['silueta de bala', 'degradado rojo-azul', 'de noche, LED de colores'], ['#b23a3a', '#2b5fa8', '#cfd8e3'], 'led', 'cawiki')
h('hotel_arts', 'Hotel Arts', 'c', 'A', 'torre', 41.38667, 2.19611, 'alta', 154, 36, 36, 45,
  'Torre de planta cuadrada junto al Port Olímpic con un exoesqueleto de acero blanco en retícula y cruces de San '
  'Andrés separado de la fachada de vidrio oscuro; podio bajo.',
  ['exoesqueleto blanco reticulado', 'vidrio oscuro detrás'], ['#f2f2ee', '#3a4a5a'], 'ventanas', 'cawiki')
h('torre_mapfre', 'Torre Mapfre', 'c', 'A', 'torre', 41.38778, 2.19750, 'alta', 154, 36, 36, 45,
  'Gemela del Hotel Arts al otro lado del puerto: prisma de vidrio verde-azulado con bandas horizontales claras en cada '
  'forjado y remate técnico.',
  ['prisma de vidrio verdoso con bandas', 'pareja con el Hotel Arts'], ['#5f8f9f', '#d8dcd8'], 'ventanas', 'cawiki')
h('peix', "Peix d'Or (Peix de Frank Gehry)", 'c', 'A', 'escultura', 41.3863, 2.1965, 'media', 35, 35, 56, 45,
  'Escultura de un pez de 56 m hecha de lamas de acero dorado sobre una pérgola, al pie del Hotel Arts, frente a la playa.',
  ['silueta de pez', 'malla dorada'], ['#c8a050', '#8c6a3a'], 'focos', 'memoria')
h('hotel_w', 'Hotel W (Hotel Vela)', 'c', 'A', 'torre', 41.36847, 2.19024, 'alta', 99, 30, 75, 60,
  'Torre en forma de vela al final de la Barceloneta: planta de aleta (curva, se estrecha a los extremos), vidrio '
  'espejo azulado; podio bajo en abanico.',
  ['silueta de vela', 'vidrio espejo azul'], ['#7f9fbf', '#c8d8e8'], 'ventanas', 'enwiki', 'rot de memoria (media).')
h('torres_caixa', 'Torres «la Caixa» (Diagonal)', 'c', 'A', 'torre', 41.38751, 2.12668, 'alta', 86, 30, 100, 72,
  'Dos torres de oficinas gemelas en la Diagonal (Les Corts): prismas de muro cortina negro y aluminio, unidos por un '
  'podio bajo.',
  ['dos prismas negros gemelos', 'muro cortina oscuro'], ['#1f2428', '#7c848c'], 'ventanas', 'cawiki',
  'El usuario las pidió por su nombre («el edificio de la Caixa»). Alto de memoria (media).')
h('edifici_forum', 'Edifici Fòrum', 'c', 'A', 'edificio', 41.41101, 2.22092, 'alta', 25, 180, 180, 0,
  'Gran triángulo equilátero de 180 m de lado elevado sobre pilotes; fachada azul ultramar rugosa con grietas de vidrio.',
  ['triángulo azul flotante'], ['#1f3f8f', '#4f6faf'], 'focos', 'cawiki')
h('pergola_forum', 'Pèrgola fotovoltaica del Fòrum', 'c', 'B', 'estructura', 41.4120, 2.2268, 'media', 50, 50, 112, 0,
  'Placa fotovoltaica inclinada de 112 × 50 m sobre cuatro pilares de hormigón, junto al mar.',
  ['gran placa inclinada sobre pilares'], ['#2a3a5a', '#c8c4bc'], 'nada', 'memoria')
h('diagonal_zerozero', 'Torre Diagonal ZeroZero', 'c', 'B', 'torre', 41.4103, 2.2172, 'media', 110, 25, 40, 72,
  'Prisma de vidrio en el arranque de la Diagonal, con celosía exterior de acero en rombos.',
  ['prisma de vidrio con malla de rombos'], ['#9fb0bf', '#e0e4e8'], 'ventanas', 'memoria')
h('hotel_princess', 'Hotel Princess', 'c', 'B', 'torre', 41.4110, 2.2190, 'baja', 105, 25, 60, 72,
  'Dos torres de distinta altura en Diagonal 1, de vidrio oscuro y paneles claros, unidas en la base.',
  ['dos torres escalonadas'], ['#3a4a5a', '#d8dcd8'], 'ventanas', 'memoria', 'Alto y planta de memoria (baja).')
h('torres_diagonal_mar', 'Torres de Diagonal Mar', 'c', 'B', 'torre', 41.4075, 2.2155, 'baja', 85, 30, 30, 0,
  'Torres de viviendas de 20–25 plantas alrededor del Parc de Diagonal Mar: prismas claros con balcones corridos.',
  ['torres residenciales claras'], ['#e6e2d8', '#7a8a9a'], 'ventanas', 'memoria',
  'Grupo: R2 debe localizarlas por altura (> 60 m) en el registro alrededor del Parc de Diagonal Mar.')
h('torre_mare_nostrum', 'Torre Mare Nostrum (Gas Natural)', 'c', 'A', 'torre', 41.38330, 2.19046, 'alta', 86, 40, 80, 45,
  'Torre de vidrio espejo con un enorme cuerpo horizontal en voladizo a media altura y otros volúmenes escalonados.',
  ['gran voladizo horizontal', 'vidrio espejo'], ['#8fa8b8', '#c8d8e0'], 'ventanas', 'eswiki')
h('wtc', 'World Trade Center Barcelona', 'c', 'B', 'edificio', 41.37134, 2.18167, 'alta', 40, 120, 150, 150,
  'Conjunto en el muelle de Barcelona: anillo de edificios de vidrio y piedra con planta de barco elíptica.',
  ['anillo en forma de barco'], ['#c8d0d8', '#d8ccb4'], 'ventanas', 'cawiki')
h('edifici_colon', 'Edifici Colón', 'c', 'B', 'torre', 41.3765, 2.1752, 'alta', 110, 25, 25, 45,
  'Primer rascacielos de la ciudad, en Av. de les Drassanes: prisma oscuro de 28 plantas.',
  ['prisma oscuro aislado'], ['#5a4a3a', '#8c8478'], 'ventanas', 'enwiki')
h('edificis_trade', 'Edificis Trade', 'c', 'B', 'edificio', 41.38605, 2.12770, 'alta', 50, 60, 120, 72,
  'Cuatro torres de oficinas de Coderch con fachada de vidrio oscuro ondulada (planta de curvas).',
  ['fachadas onduladas de vidrio oscuro'], ['#2a3a3a', '#6a7a7a'], 'ventanas', 'cawiki')
h('melia_sky', 'Hotel Melià Sky', 'c', 'B', 'torre', 41.4040, 2.1975, 'media', 120, 30, 50, 45,
  'Torre de hotel en Poblenou: prisma con fachada de bandas verticales y un gran retranqueo/hueco en la parte alta.',
  ['torre con hueco en la parte alta'], ['#d8dcd8', '#3a4a5a'], 'ventanas', 'memoria')
h('encants', 'Mercat dels Encants', 'c', 'B', 'mercado', 41.40112, 2.18666, 'alta', 25, 120, 150, 0,
  'Mercado al aire libre cubierto por una gran cubierta de espejo facetada a 25 m de altura.',
  ['techo de espejo facetado'], ['#c8d0d8', '#e8ecf0'], 'nada', 'cawiki')
h('disseny_hub', 'Disseny Hub', 'c', 'B', 'edificio', 41.40253, 2.18802, 'alta', 45, 40, 140, 45,
  'La «grapadora»: cuerpo superior de chapa oscura que vuela en voladizo sobre la plaza de Glòries.',
  ['volumen oscuro en voladizo'], ['#3a3a3a', '#8c8c8c'], 'ventanas', 'cawiki')
h('xemeneies_besos', 'Tres Xemeneies del Besòs', 'c', 'B', 'chimenea', 41.4266, 2.2319, 'media', 200, 20, 140, 140,
  'Tres chimeneas de hormigón de 200 m de la antigua central térmica, en fila junto al mar, y la nave de turbinas al pie.',
  ['tres fustes de 200 m en fila'], ['#c8c4bc', '#b5543a'], 'nada', 'memoria',
  'Poi del juego «Tres Xemeneies del Besòs» (posición fiable; lat/lon sacadas de ese poi con un ajuste provisional, '
  'la de memoria se iba 680 m al S). Fuera del término de Barcelona (Sant Adrià).')
h('torre_aigues_besos', 'Torre de les Aigües del Besòs', 'c', 'B', 'torre', 41.4058, 2.21229, 'alta', 60, 12, 12, 0,
  'Torre industrial de ladrillo de 1882, cilíndrica, con depósito de agua arriba.', ['torre de ladrillo cilíndrica'],
  [LADR], 'focos', 'eswiki', 'Alto de memoria (baja).')
h('torre_urquinaona', 'Torre Urquinaona', 'c', 'C', 'torre', 41.38979, 2.17288, 'alta', 73, 25, 25, 45,
  'Torre de oficinas gris en la Pl. Urquinaona.', ['prisma gris'], ['#8c8c8c'], 'ventanas', 'cawiki')
h('torre_melina', 'Torre Melina', 'c', 'C', 'torre', 41.38133, 2.10875, 'alta', 90, 30, 50, 72,
  'Torre de hotel de vidrio en la Diagonal alta, de planta triangular.', ['planta triangular de vidrio'], ['#7f9fbf'],
  'ventanas', 'eswiki', 'Alto de memoria (baja).')

# ---------------------------------------------------------------------------------------------------------------
# Lote d · Ciutat Vella, puerto y monumentos
# ---------------------------------------------------------------------------------------------------------------
h('colom', 'Monument a Colom', 'd', 'A', 'monumento', 41.37580, 2.17776, 'alta', 60, 20, 20, 0,
  'Columna corintia de hierro fundido sobre pedestal octogonal escalonado con ocho leones de bronce y relieves; encima, '
  'un globo con coronas y la estatua de Colón señalando al mar.',
  ['columna esbelta de 60 m', 'estatua arriba señalando al mar', 'pedestal con leones'], ['#4a4a40', '#c9b48a', '#6f6a50'],
  'focos', 'enwiki', 'Hoy NO existe en el juego (lo dice comun.md).')
h('catedral', 'Catedral de Barcelona', 'd', 'A', 'templo', 41.3839, 2.1764, 'alta', 70, 40, 93, 135,
  'Catedral gótica con fachada neogótica al Pla de la Seu: aguja central de 70 m sobre el cimborio, dos agujas '
  'laterales caladas, dos campanarios octogonales sobre el crucero; piedra gris dorada; claustro al lado.',
  ['tres agujas caladas en la fachada', 'campanarios octogonales'], ['#b8a688', '#8c8070'], 'focos', 'cawiki',
  'Poi del juego «Catedral».')
h('santa_maria_mar', 'Santa Maria del Mar', 'd', 'A', 'templo', 41.38361, 2.18194, 'alta', 40, 33, 80, 60,
  'Basílica gótica catalana sobria y maciza: nave alta con contrafuertes, gran rosetón y dos campanarios octogonales '
  'esbeltos a los lados de la fachada.',
  ['dos campanarios octogonales', 'rosetón', 'volumen macizo de piedra'], ['#b8a688', '#8c8070'], 'focos', 'cawiki',
  'rot de memoria (media).')
h('santa_maria_pi', 'Santa Maria del Pi', 'd', 'B', 'templo', 41.3822, 2.1739, 'alta', 54, 25, 60, 135,
  'Iglesia gótica de una nave con gran rosetón y un campanario octogonal macizo de 54 m.',
  ['campanario octogonal macizo', 'rosetón'], ['#b8a688'], 'focos', 'cawiki')
h('merce', 'Basílica de la Mercè', 'd', 'B', 'templo', 41.37952, 2.17958, 'alta', 70, 30, 50, 135,
  'Basílica barroca con cúpula coronada por la gran estatua de la Mercè.', ['cúpula con estatua'], ['#c9b48a', '#8c8478'],
  'focos', 'cawiki', 'Alto de memoria (baja).')
h('arc_triomf', 'Arc de Triomf', 'd', 'A', 'monumento', 41.39111, 2.18056, 'alta', 30, 12, 30, 45,
  'Arco neomudéjar de ladrillo rojo en el eje del Pg. de Lluís Companys, con frisos escultóricos y remates.',
  ['arco de ladrillo rojo'], [LADR, '#d8ccb4'], 'focos', 'cawiki', 'Poi del juego «Arc de Triomf».')
h('cascada', 'Cascada de la Ciutadella', 'd', 'B', 'fuente', 41.38996, 2.18659, 'alta', 30, 30, 45, 45,
  'Fuente monumental con arcos, grutas y escalinatas, coronada por una cuadriga dorada.', ['cuadriga dorada', 'arcos'],
  ['#c9b48a', '#c8a050'], 'focos', 'cawiki')
h('parlament', 'Parlament de Catalunya', 'd', 'B', 'palacio', 41.38806, 2.18889, 'alta', 20, 60, 100, 45,
  'Antiguo arsenal barroco en la Ciutadella: palacio ocre de dos plantas con alas y cuerpo central.',
  ['palacio ocre con alas'], ['#d6c39c'], 'focos', 'enwiki')
h('estacio_franca', 'Estació de França', 'd', 'B', 'estacion', 41.384, 2.186, 'media', 30, 100, 200, 160,
  'Estación de 1929: dos naves curvas de hierro y vidrio (marquesina doble) y edificio de viajeros clasicista.',
  ['dos naves curvas de hierro'], ['#8c949c', '#d8ccb4'], 'nada', 'cawiki', 'Coordenada redondeada en la fuente.')
h('santa_caterina', 'Mercat de Santa Caterina', 'd', 'B', 'mercado', 41.38618, 2.17834, 'alta', 20, 60, 90, 45,
  'Mercado con cubierta ondulada de cerámica de colores en hexágonos (verde, naranja, amarillo).',
  ['cubierta ondulada multicolor'], ['#3f8f3f', '#e0803a', '#e8c547'], 'nada', 'cawiki')
h('boqueria', 'Mercat de la Boqueria', 'd', 'B', 'mercado', 41.38180, 2.17155, 'alta', 15, 60, 100, 45,
  'Mercado con portada modernista de hierro y vidrieras de colores a La Rambla; nave metálica detrás.',
  ['portada de hierro y vidrieras'], ['#5f7f6a', '#d24b3a', '#e8c547'], 'nada', 'cawiki')
h('macba', 'MACBA', 'd', 'B', 'museo', 41.38333, 2.16694, 'alta', 30, 35, 120, 45,
  'Museo blanco de Richard Meier en la Pl. dels Àngels: fachada blanca con parasoles y gran rampa acristalada.',
  ['blanco con rampa de vidrio'], ['#f2f2ee', '#c8d0d8'], 'nada', 'enwiki')
h('drassanes', 'Drassanes Reials', 'd', 'B', 'edificio', 41.37527, 2.17628, 'alta', 18, 80, 110, 45,
  'Atarazanas góticas: naves paralelas con cubiertas a dos aguas y muralla con torre en una esquina.',
  ['naves paralelas a dos aguas'], ['#b8a688', LADR], 'focos', 'cawiki')
h('sant_jaume', 'Palau de la Generalitat i Casa de la Ciutat', 'd', 'B', 'palacio', 41.38250, 2.17700, 'alta', 25, 40, 120, 135,
  'Dos palacios enfrentados en la Pl. de Sant Jaume: Generalitat (fachada renacentista de piedra con frontón) y '
  'Ayuntamiento (fachada neoclásica).',
  ['dos fachadas de piedra enfrentadas'], ['#c9b48a', '#b8a688'], 'focos', 'cawiki / eswiki',
  'Generalitat 41.3828, 2.1767 · Casa de la Ciutat 41.3822, 2.1775.')
h('born_ccm', 'El Born CCM (antic mercat)', 'd', 'B', 'mercado', 41.3855, 2.1837, 'media', 25, 50, 135, 45,
  'Antiguo mercado de hierro (1876): naves con cubierta de pizarra y cinc, lucernarios y linterna en el cruce.',
  ['nave de hierro con linterna'], ['#5f6f6a', '#8c949c'], 'nada', 'memoria')
h('duana', 'Edifici de la Duana', 'd', 'B', 'edificio', 41.3730, 2.1780, 'media', 30, 50, 80, 45,
  'Aduana de 1902 en el puerto, junto a Colom: piedra ocre, cuatro torres de esquina con cúpulas y esculturas.',
  ['cuatro torres con cúpulas'], ['#d6c39c', '#5f7f6a'], 'focos', 'memoria')
h('correus', 'Edifici de Correus', 'd', 'B', 'edificio', 41.38153, 2.18145, 'alta', 30, 60, 75, 45,
  'Edificio noucentista en Via Laietana / Pg. de Colom con cuatro torres de esquina rematadas por cupulines.',
  ['cuatro torres de esquina'], ['#d8ccb4'], 'focos', 'eswiki')
h('torre_jaume_i', 'Torre Jaume I', 'd', 'B', 'torre', 41.37208, 2.18012, 'alta', 107, 15, 15, 0,
  'Torre de celosía de acero del teleférico del puerto, con plataforma y sala de máquinas arriba.',
  ['torre de celosía con plataforma'], ['#7a6a5a', '#c8c4bc'], 'focos', 'cawiki')
h('torre_sant_sebastia', 'Torre Sant Sebastià', 'd', 'B', 'torre', 41.37311, 2.18780, 'alta', 78, 15, 15, 0,
  'Torre de celosía de acero del teleférico del puerto en la Barceloneta, con restaurante arriba.',
  ['torre de celosía con cabina'], ['#7a6a5a', '#c8c4bc'], 'focos', 'enwiki')
h('cap_barcelona', 'El Cap de Barcelona', 'd', 'B', 'escultura', 41.3806, 2.1808, 'media', 14, 8, 10, 0,
  'Escultura de Roy Lichtenstein: una cabeza de 14 m en mosaico de cerámica de colores primarios, estilo cómic.',
  ['cabeza de cómic multicolor'], ['#f2efe6', '#d24b3a', '#e8c547', '#2b5fa8'], 'focos', 'memoria')
h('estel_ferit', "L'Estel Ferit", 'd', 'B', 'escultura', 41.37619, 2.19090, 'alta', 10, 4, 4, 0,
  'Escultura de Rebecca Horn en la playa de la Barceloneta: cuatro cubos de acero oxidado apilados y torcidos.',
  ['cubos apilados torcidos', 'óxido'], ['#8c5a3a'], 'nada', 'cawiki')
h('llapis', "El Llapis (Cinc d'Oros)", 'd', 'B', 'monumento', 41.3955, 2.1595, 'media', 33, 3, 3, 0,
  'Obelisco blanco muy fino en el cruce de Diagonal y Pg. de Gràcia (Monument a la República).',
  ['obelisco blanco fino'], ['#f2f2ee'], 'focos', 'memoria', 'Alto de memoria (baja).')
h('rambla_mar', 'Rambla de Mar', 'd', 'B', 'pasarela', 41.37504, 2.18103, 'alta', 3, 20, 200, 135,
  'Pasarela ondulada de madera sobre el Port Vell, con puente basculante, entre Colom y el Maremagnum.',
  ['pasarela ondulada sobre el agua'], ['#8c6a4a', '#c8c4bc'], 'nada', 'cawiki')

# ---------------------------------------------------------------------------------------------------------------
# Lote e · Collserola, zona alta, estaciones, L'Hospitalet y otros
# ---------------------------------------------------------------------------------------------------------------
h('torre_collserola', 'Torre de Collserola', 'e', 'A', 'torre', 41.41722, 2.11417, 'alta', 288, 40, 40, 0,
  'Torre de telecomunicaciones de Foster: fuste de hormigón muy esbelto atirantado con cables, 13 plataformas de planta '
  'triangular con esquinas redondeadas apiladas a media altura y una antena-mástil roja y blanca arriba.',
  ['fuste fino atirantado', 'paquete de plataformas triangulares', 'mástil rojo y blanco'], ['#c8c8c4', '#d24b3a', '#f2f2ee'],
  'focos', 'cawiki', 'Poi y meta.stats.torre_collserola (posición fiable, base a 443 m).')
h('sagrat_cor', 'Temple del Sagrat Cor', 'e', 'A', 'templo', 41.42208, 2.11886, 'alta', 70, 30, 50, 0,
  'Templo en la cima del Tibidabo: cripta románica de piedra oscura y encima iglesia neogótica clara con agujas, '
  'torre central coronada por la estatua dorada del Sagrado Corazón con los brazos abiertos.',
  ['estatua dorada con brazos abiertos en lo alto', 'agujas neogóticas'], ['#8c8070', '#d8ccb4', '#d8b050'], 'focos', 'cawiki',
  'meta.stats.sagrat_cor (posición fiable).')
h('tibidabo_parc', "Parc d'Atraccions del Tibidabo", 'e', 'B', 'parque', 41.42175, 2.12004, 'alta', 30, 80, 150, 0,
  'Junto al templo: noria de cestas de colores, la Talaia (brazo giratorio) y el avión colgado.',
  ['noria de colores', 'Talaia'], ['#d24b3a', '#e8c547', '#2b5fa8'], 'focos', 'cawiki')
h('observatori_fabra', 'Observatori Fabra', 'e', 'B', 'edificio', 41.41841, 2.12405, 'alta', 20, 20, 40, 0,
  'Edificio modernista claro en la ladera de Collserola con la cúpula plateada del telescopio.',
  ['cúpula plateada'], ['#e6dcc4', '#b8bcc0'], 'focos', 'cawiki')
h('monestir_pedralbes', 'Monestir de Pedralbes', 'e', 'B', 'templo', 41.3956, 2.1122, 'alta', 35, 60, 90, 0,
  'Monasterio gótico: iglesia de una nave con campanario octogonal y claustro de tres pisos.',
  ['campanario octogonal', 'claustro'], ['#c9b48a'], 'focos', 'cawiki')
h('palau_pedralbes', 'Palau Reial de Pedralbes', 'e', 'B', 'palacio', 41.38842, 2.11703, 'alta', 20, 50, 80, 0,
  'Palacio italianizante blanco y ocre en U, con jardín delante abierto a la Diagonal.', ['palacio en U claro'],
  ['#efe9dc', '#c9b48a'], 'focos', 'cawiki')
h('bunquers_carmel', 'Búnquers del Carmel', 'e', 'C', 'mirador', 41.4194, 2.16174, 'media', 3, 60, 80, 0,
  'Plataformas circulares de hormigón de la batería antiaérea en la cima del Turó de la Rovira.',
  ['plataformas circulares de hormigón'], ['#a8a49c'], 'nada', 'cawiki', 'Poi del juego «Turó de la Rovira».')
h('estacio_sants', 'Estació de Sants', 'e', 'B', 'estacion', 41.3789, 2.1400, 'media', 15, 100, 300, 45,
  'Edificio de estación largo y bajo con la gran marquesina plana de la plaza (Països Catalans) delante.',
  ['edificio largo y bajo', 'marquesina plana'], ['#8c8c8c', '#c8c4bc'], 'ventanas', 'cawiki', 'Poi del juego «Estació de Sants».')
h('hotel_torre_catalunya', 'Hotel Torre Catalunya', 'e', 'B', 'torre', 41.3797, 2.1425, 'alta', 115, 30, 40, 45,
  'Torre de hotel de vidrio junto a la estación de Sants.', ['prisma de vidrio'], ['#7f9fbf', '#d8dcd8'], 'ventanas', 'enwiki')
h('espanya_industrial', "Parc de l'Espanya Industrial (torres-far)", 'e', 'B', 'parque', 41.3775, 2.1408, 'alta', 30, 40, 200, 45,
  'Diez torres-farola blancas tipo faro alineadas sobre las gradas escalonadas del parque.',
  ['hilera de torres-faro blancas'], ['#f2f2ee'], 'focos', 'cawiki')
h('auditori', "L'Auditori", 'e', 'B', 'teatro', 41.39824, 2.18585, 'alta', 25, 100, 150, 45,
  'Bloque de hormigón gris de Moneo con fachada reticulada y un cubo de luz.', ['bloque gris reticulado'],
  ['#9c968c', '#8c5a3a'], 'nada', 'cawiki')
h('tnc', 'Teatre Nacional de Catalunya', 'e', 'B', 'teatro', 41.39972, 2.18611, 'alta', 25, 60, 110, 135,
  'Templo clásico moderno de Bofill: caja de vidrio rodeada de columnas de hormigón ocre y frontón.',
  ['columnata y frontón', 'caja de vidrio'], ['#d6c39c', '#8fa8b8'], 'focos', 'cawiki')
h('mistos', 'Mistos', 'e', 'B', 'escultura', 41.4268, 2.1453, 'baja', 20, 5, 20, 0,
  'Escultura de Oldenburg: cerillas gigantes de colores (rojo, azul, amarillo) en la Vall d\'Hebron.',
  ['cerillas gigantes'], ['#d24b3a', '#2b5fa8', '#e8c547'], 'nada', 'memoria', 'Posición de memoria (baja).')
h('pont_bac_de_roda', 'Pont de Bac de Roda', 'e', 'B', 'puente', 41.4162, 2.1924, 'alta', 20, 30, 130, 45,
  'Puente blanco de Calatrava sobre las vías: dos pares de arcos inclinados con tirantes.', ['arcos blancos inclinados'],
  ['#f2f2ee'], 'focos', 'cawiki')
h('aeroport', 'Aeroport (T1 i torre de control)', 'e', 'B', 'aeropuerto', 41.2884, 2.0731, 'media', 40, 150, 600, 45,
  'Terminal T1: nave larguísima de vidrio con cubierta ondulada clara; al lado, la torre de control.',
  ['nave larga con cubierta ondulada', 'torre de control'], ['#d8dcd8', '#7f9fbf'], 'ventanas', 'memoria',
  'Poi del juego «Aeroport · Terminal 1». Posición de la torre de control: R2 (baja).')
h('hotel_porta_fira', 'Hotel Porta Fira', 'e', 'A', 'torre', 41.35489, 2.12554, 'alta', 113, 30, 30, 0,
  'Torre de Toyo Ito en la Pl. d\'Europa: piel de tubos rojos verticales ondulantes; la torre se retuerce y se ensancha '
  'hacia arriba.',
  ['torre roja retorcida', 'tubos verticales'], ['#c0282a', '#8c1a1a'], 'ventanas', 'eswiki')
h('torre_realia', 'Torre Realia BCN', 'e', 'B', 'torre', 41.35555, 2.12511, 'alta', 110, 30, 30, 0,
  'Torre cilíndrica de vidrio claro junto al Hotel Porta Fira.', ['cilindro de vidrio'], ['#c8d0d8'], 'ventanas', 'cawiki')
h('ciutat_justicia', 'Ciutat de la Justícia', 'e', 'B', 'conjunto', 41.3642, 2.1325, 'alta', 70, 150, 250, 45,
  'Conjunto de bloques de Chipperfield de colores pastel (ocre, rosa, verde, gris) de distintas alturas.',
  ['bloques de colores pastel'], ['#d6c39c', '#d8a8a0', '#a8c0a0', '#a8a8a8'], 'ventanas', 'cawiki')
h('hesperia_tower', 'Hesperia Tower', 'e', 'B', 'torre', 41.3461, 2.1083, 'alta', 107, 30, 40, 0,
  'Torre de hotel de Rogers con cúpula de vidrio (restaurante) en voladizo en lo alto y núcleos laterales rojos.',
  ['cúpula de vidrio arriba', 'núcleos rojos'], ['#c8c4bc', '#c0282a'], 'ventanas', 'cawiki')
h('xemeneies_parallel', 'Tres Xemeneies del Paral·lel', 'e', 'B', 'chimenea', 41.3735, 2.1690, 'media', 72, 10, 50, 45,
  'Tres chimeneas de ladrillo de 72 m de la antigua central eléctrica, en el parque del mismo nombre.',
  ['tres chimeneas de ladrillo'], [LADR], 'nada', 'memoria')
h('fabra_coats', 'Fabra i Coats', 'e', 'C', 'fabrica', 41.43295, 2.19064, 'alta', 15, 100, 150, 0,
  'Antigua fábrica textil de ladrillo con naves y chimenea.', ['naves de ladrillo y chimenea'], [LADR], 'nada', 'eswiki')
h('dona_ocell', 'Dona i Ocell', 'e', 'B', 'escultura', 41.3778, 2.1470, 'alta', 22, 5, 5, 0,
  'Escultura de Miró de 22 m recubierta de trencadís (rojo, amarillo, verde, azul) sobre un estanque en el Parc Joan Miró.',
  ['figura alargada de trencadís', 'estanque'], ['#d24b3a', '#e8c547', '#3f8f3f', '#2b5fa8'], 'focos', 'cawiki')


# ---------------------------------------------------------------------------------------------------------------
LOTES = {'a': 'Gaudí y modernismo', 'b': 'Deporte y Montjuïc', 'c': 'Torres y frente marítimo',
         'd': 'Ciutat Vella, puerto y monumentos', 'e': "Collserola, zona alta, estaciones, L'Hospitalet y otros"}
COMO = {'A': 'modelo propio', 'B': 'arquetipo', 'C': 'retoque del volumen'}


ENC = None


def merge(root, here):
    """Mezcla en H el encaje de R2 (tools/hitos/encaje.json, de encaje.js) si existe."""
    global ENC
    fn = os.path.join(here, 'encaje.json')
    if not os.path.exists(fn):
        return
    with open(fn, encoding='utf-8') as fi:
        ENC = json.load(fi)
    for f in H:
        e = ENC['hitos'].get(f['id'])
        if not e:
            continue
        r1 = {k: f[k] for k in ('ancho', 'largo', 'rot', 'confianza') if k in e and e[k] != f[k]}
        for k in ('x', 'z', 'y', 'edificios', 'en_datos', 'ancho', 'largo', 'rot', 'confianza', 'planta', 'fuera'):
            if k in e:
                f[k] = e[k]
        f['encaje'] = e['modo']
        if e.get('mover') is not None and e['mover'] >= 30:
            f['nota'] = (f.get('nota', '') + ' ' if f.get('nota') else '') + \
                f"R2: la planta del juego está a {e['mover']} m de la coordenada lat/lon; x, z son los de la planta."
        if e.get('nota'):
            f['nota'] = (f.get('nota', '') + ' ' if f.get('nota') else '') + 'R2: ' + e['nota']
        if r1:
            f['r1'] = r1


def check():
    ids = set()
    for f in H:
        assert f['id'] not in ids, f['id']
        ids.add(f['id'])
        assert f['lote'] in LOTES and f['nivel'] in 'ABC' and f['confianza'] in ('alta', 'media', 'baja')
        assert f['noche'] in ('focos', 'led', 'ventanas', 'nada'), f['id']
        assert 41.25 < f['lat'] < 41.48 and 2.0 < f['lon'] < 2.26, f['id']
        assert 0 <= f['rot'] < 360


def md():
    L = ['# Hitos de Barcelona — catálogo', '',
         'Listado de los edificios y monumentos singulares que el juego modelará aparte (encargo de hitos, etapas R1 y R2).',
         'Versión para máquinas: `data/hitos_catalogo.json` (mismas fichas, completas). Se genera con',
         '`python3 tools/hitos/catalogo.py`: para cambiar algo, edita ese script y vuelve a ejecutarlo.', '',
         '**Niveles**: A = modelo propio cuidado (icono) · B = arquetipo con parámetros · C = retoque del volumen que ya',
         'existe (color, estilo, altura). **Alto** en metros reales. **Pos.** = confianza de la posición (alta: coordenada',
         'de Wikipedia/Wikidata; media: redondeada o de memoria en sitio aislado; baja: de memoria, a revisar).',
         'La columna «Hoy en el juego» sale del encaje de R2 con el registro de edificios (`tools/hitos/encaje.js`):',
         'cuántos volúmenes del juego sustituye el hito, su planta y su altura en los datos. **x, z** = posición en el',
         'mundo del juego (m; X al este, Z al norte). La lista de índices (`edificios`) está en el JSON.', '']
    tot = {}
    for f in H:
        tot.setdefault(f['lote'], {'A': 0, 'B': 0, 'C': 0})[f['nivel']] += 1
    L += ['| Lote | Tema | A | B | C | Total |', '|---|---|---|---|---|---|']
    sa = sb = sc = 0
    for k in 'abcde':
        t = tot[k]
        sa += t['A']; sb += t['B']; sc += t['C']
        L.append(f"| {k} | {LOTES[k]} | {t['A']} | {t['B']} | {t['C']} | {sum(t.values())} |")
    L.append(f'| | **Total** | {sa} | {sb} | {sc} | **{len(H)}** |')
    L.append('')
    for k in 'abcde':
        L += [f'## Lote {k} · {LOTES[k]}', '',
              '| Nombre | Nivel | Qué es | Alto | Cómo se va a hacer | x, z | Pos. | Hoy en el juego |',
              '|---|---|---|---|---|---|---|---|']
        for f in sorted((f for f in H if f['lote'] == k), key=lambda f: ('ABC'.index(f['nivel']), f['nombre'])):
            como = COMO[f['nivel']] + ': ' + '; '.join(f['rasgos'])
            hoy = '(R2)'
            if f.get('nota') and ('Poi del juego' in f['nota'] or 'NO existe' in f['nota'] or 'Hoy el juego' in f['nota']):
                fr = [x for x in f['nota'].split('. ') if 'Poi del juego' in x or 'NO existe' in x or 'Hoy el juego' in x]
                hoy = '(R2) ' + fr[0].rstrip('.')
            que = f['forma'].split(': ')[0] if len(f['forma'].split(': ')[0]) < 90 else f['forma'][:87] + '…'
            alto = ('%g' % f['alto']).replace('.', ',') + ' m'
            xz = f"{f['x']:.0f}, {f['z']:.0f}" if 'x' in f else '—'
            if 'en_datos' in f:
                hoy = f['en_datos']
            L.append(f"| {f['nombre']} | {f['nivel']} | {que} | {alto} | {como} | {xz} | {f['confianza']} | {hoy} |")
        L.append('')
    dud = [f for f in H if f['confianza'] != 'alta']
    if ENC:
        a = ENC['ajuste']
        L += ['## Encaje en el mapa del juego (R2)', '',
              f"- Conversión lat/lon → mundo: el mundo es UTM huso 31N (ETRS89) trasladado: x = E {a['ox']:+.1f}, "
              f"z = N {a['oz']:+.1f}. Ajustada con {len(a['residuos'])} poi de `meta.json` (mínimos cuadrados): error "
              f"cuadrático medio {a['rms']} m, máximo {max((r['ex'] ** 2 + r['ez'] ** 2) ** 0.5 for r in a['residuos']):.0f} m "
              '(los poi marcan el sitio a ojo; las torres caen a 1–10 m de su planta).',
              '- Selección de edificios: el grupo que contiene el punto (raíz + partes de OSM apiladas), la torre más alta',
              '  cercana, una lista explícita o un rectángulo (ver `SEL` en `tools/hitos/encaje.js`). Los índices son los de',
              '  `BREC` en `app.js`.', '']
        no = [f for f in H if f.get('encaje') == 'no']
        L += ['### No están en los datos (se modelan desde cero en su coordenada)', '']
        for f in no:
            L.append(f"- **{f['nombre']}**: {f['en_datos'].replace('no existe: ', '')}")
        mv = sorted((f for f in H if ENC['hitos'][f['id']].get('mover', 0) >= 30), key=lambda f: -ENC['hitos'][f['id']]['mover'])
        L += ['', '### Posición corregida con la planta del juego (30 m o más)', '']
        for f in mv:
            L.append(f"- **{f['nombre']}**: {ENC['hitos'][f['id']]['mover']} m")
        fu = [f for f in H if f.get('fuera')]
        L += ['', '### Fuera del área con edificios', '', '- ' + (', '.join(f['nombre'] for f in fu) if fu else 'ninguno: los 107 caen dentro del mapa y con edificios a menos de 300 m.'), '']
    L += ['## Posiciones dudosas', '']
    for f in dud:
        L.append(f"- **{f['nombre']}** ({f['confianza']}): {f['lat']}, {f['lon']} — {f.get('nota', 'de memoria')}")
    L += ['', '## Descartados de la lista semilla', '',
          '- Hospital Clínic, Hospital de la Vall d\'Hebron, CosmoCaixa: volúmenes sin rasgo que se reconozca desde lejos.',
          '- Liceu, Palau de Mar, Maremagnum, Aquàrium, Monument a Macià, Torre Banc Sabadell: poco reconocibles o tapados;',
          '  si sobra presupuesto, pueden entrar como nivel C.',
          '- Grues del port, Torre Baró: muchos elementos o ruina sin silueta clara.',
          '- Far de Montjuïc: dudoso y casi invisible entre los árboles.',
          '',
          '## Añadidos', '',
          "- Mercat de Sant Antoni, Casa Calvet, Castell dels Tres Dragons (pasa al lote a), Piscina de Montjuïc,",
          '  Torres de Diagonal Mar (el usuario pidió «los edificios de Diagonal Mar»), Rambla de Mar.', '']
    return '\n'.join(L)


if __name__ == '__main__':
    check()
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.normpath(os.path.join(here, '..', '..'))
    with open(os.path.join(here, 'r1.json'), 'w', encoding='utf-8') as fo:
        json.dump({'nota': 'Fichas de R1 sin encaje: entrada de encaje.js. Generado por catalogo.py; no editar.', 'hitos': H},
                  fo, ensure_ascii=False, indent=1)
        fo.write('\n')
    merge(root, here)
    with open(os.path.join(root, 'data', 'hitos_catalogo.json'), 'w', encoding='utf-8') as fo:
        doc = {'version': 2 if ENC else 1, 'etapa': 'R2' if ENC else 'R1',
               'nota': ' '.join(__doc__.strip().split('\n\n')[2:]).replace('\n', ' ')}
        if ENC:
            doc['ajuste'] = ENC['ajuste']
        doc['hitos'] = H
        json.dump(doc, fo,
                  ensure_ascii=False, indent=1)
        fo.write('\n')
    with open(os.path.join(root, 'HITOS.md'), 'w', encoding='utf-8') as fo:
        fo.write(md())
    t = {}
    for f in H:
        t[f['nivel']] = t.get(f['nivel'], 0) + 1
    print(len(H), 'hitos', t, {k: sum(1 for f in H if f['lote'] == k) for k in 'abcde'})
