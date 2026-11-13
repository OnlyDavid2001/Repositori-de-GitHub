# Condal City · Fase 0 · Diagnóstico completo (para los agentes)

Generado a partir de los cuatro análisis de la Fase 0 (solo lectura). Scripts y capturas: `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/` (p1_generador, coord, fps, datos).

## 1. Generador actual de edificios, fachadas y bajos

Diagnóstico de solo lectura del repositorio (no he cambiado nada; scripts y capturas en /tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/p1_generador/). Medido en el juego: 303 787 volúmenes, que son 294 037 de OSM (alturas de LiDAR) más 9 750 trozos de manzanas partidas. 211 563 tienen fachada de detalle (201 663 viviendas, 7 723 naves y 2 177 equipamientos).

Hay tres niveles de detalle:
- volumen extruido lejano (FS_BLD), con ventanas pintadas en el shader;
- capa BASE de 0 a ~245 m, geometría real por celdas de 100 m;
- capa ORNAMENTO por debajo de ~110 m.

El generador real es genB y varOf/pisosV/coronaV, en facades.js. El estilo sale de una de 15 «familias» de barrio, con 70 variantes paramétricas en fachadas_estilos.js. El color sale de palette.js por familia y se hornea al cargar.

La planta baja (interiors.js) pone un comercio en todos los vanos de calle de cualquier vivienda con H ≥ 10 m (17 tipos con interior pintado por píxel, rótulo genérico con el nombre del tipo, 35 % de toldos y ~31 % de persianas metálicas). No tiene en cuenta la densidad comercial real; por eso el Eixample y el Gòtic salen con el mismo frente continuo de tiendas de piedra (capturas v_eix_acera.jpg y v_gotic_calle.jpg).

En el Eixample casi todo son parcelas: en la Dreta, la mediana de la caja es 15 m × ~264 m². Solo 593 volúmenes de manzana entera o bloque grande se parten en 7 909 fincas (manzanas.js).

Por edificio no hay identificador estable (solo el índice de carga b), ni año, ni número de plantas. Solo se sabe: clase OSM, semilla de 8 bits, cotas y anillos de la planta.

Los 18 monumentos de la regla 11 ya son hitos (185 fichas, que ocultan 2 386 volúmenes). Además, facades.js:312 quita la fachada de detalle a todo lo que cae dentro de un radio alrededor de 17 puntos de interés.

El enganche natural del nuevo generador es triple:
- al cargar (palette.js pick y app.js:1646) para estilo y color, que deben coincidir de lejos y de cerca;
- varOf, que se convierte en el selector de estilo, sección y racha;
- los hooks groundFloor y pisosV/coronaV para los kits.

Los obstáculos principales:
- no hay orden por acera;
- el ancho y la altura son geometría real y no se pueden «elegir»;
- las medianeras expuestas hoy salen con ventanas;
- el nivel lejano FS_BLD no sabe nada del estilo;
- los rótulos van por tipo, en un atlas de 32 casillas;
- 4 barrios se escriben distinto en meta.json y en el JSON;
- el JSON va en lon/lat.

### Cómo se genera

- 1. Carga de volúmenes (app.js:1515-1712). Se leen data/buildings0.png y buildings1.png, contenedores binarios con chunks de CH m. Cada registro ocupa 12 bytes de cabecera más los anillos: nRings (u8), cls (u8), seed (u8, byte p+2), byte p+3 sin leer (en los sintéticos vale 0, manzanas.js:356), n (u16), yb/ybot/ytop (i16 en dm) y vértices i16 en dm relativos al chunk (app.js:1622-1629). No hay identificador OSM ni año.
- 2. Manzanas enteras (app.js:1525-1600 y manzanas.js). Antes de construir, los volúmenes de clase 0/6 de 1 000–32 000 m², alto 10,5–45 m, a más de 90 m de un hito y no reservados por un hito se parten en fincas cada 12–25 m con un fondo de 20–25 m (BCN_MZ.split). Los no convexos van por grupos con una trama de 1 m (splitR). Hay caché en data/mz_partidas.json, que solo vale si nB coincide (app.js:1549-1551). Los trozos van a un contenedor sintético que se carga el último (app.js:1593) y el volumen original se colapsa (app.js:1690-1693). Medido: 593 bloques, 225 por trama y 7 909 fincas (mediana de caja 20 m; p10–p90 de 13 a 29 m).
- 3. Extrusión y horneado (app.js:1617-1712). Por chunk se extruyen muros y cubierta (earcut). El color de vértice es BCN_PAL.pick(b, cls, seed, centro, alto, área, llenado) (app.js:1646, palette.js:124-148) o PAL[cls] para las clases sin paleta (app.js:1500). El alfa lleva (cls<<4)|(seed&15), que FS_BLD usa como «estilo». Los búferes son inf (hb, Ht, u acumulada y bandera w de «fachada de detalle construida») y uv2 (eje del edificio). Una malla por chunk: 'b<cx>_<cz>', layer 'coarse', matBld (app.js:1129, 1701-1704).
- 4. Elegibilidad y tipología (app.js:1670-1697). BREC.elig y BREC.tipo (0 vivienda, 1 nave, 2 equipamiento u oficinas) salen de cls, altura y área de caja (hb < 15, 35 ≤ área < 16 000, H ≥ 3,8). Con cls 3/12 se marca BREC.vid (muro cortina). Las fincas mzk=2 (taller) pasan a tipo 1; las mzk=3 (terraza del patio), a tipo 0.
- 5. Hitos (landmarks.js y lotes a–e). Se inician ANTES que las fachadas (DESARROLLO §10.1). Cada ficha lleva edificios: [índices de BREC], que se colapsan en el búfer y pierden elig.
- 6. Índices de facades.js (facades.js:295-325). Rejilla CS=100 m con listas CSR ALL, ELIG (por el centro de la caja) y ROADS. Antes, la exclusión por radio SKIP (facades.js:312-318) pone elig=0 alrededor de 17 puntos de interés (radios de 30 a 700 m).
- 7. layoutB(b) (facades.js:426-450). gHi/gLo del terreno bajo la planta, H = y1 − gHi; si H < 3,6 no hay fachada. Con runsOf (facades.js:403-424), los anillos se agrupan en tramos rectos (tolerancia 0,45 m). Cada tramo mira tres puntos a 0,9 m por fuera con coverAt para saber si un vecino lo tapa. Es 'blind' si cover ≥ y1 − 2,5 (facades.js:443), 'plain' si L < 2,2 y, si no, 'street' cuando roadDist(medio + n·2) < 16 y 'yard' en caso contrario. El portal va en el tramo de calle más largo sin tapar (facades.js:448).
- 8. genB(lay, b, W0, W1) (facades.js:466-518), una pasada para BASE (W0) y otra para ORNAMENTO (W1). V = varOf(b). Se decide style: 'sobrio', 'clasico' o 'modernista' (facades.js:473; solo se usa en la ruta antigua). Colores derivados de d.col: u, stone, shut, persi, wood… Comercios = !cls6 && H ≥ 10 (facades.js:477). La planta baja mide G = 4,3 con comercios y 3,25 sin ellos. F1 = gHi + G, C = y1 − 0,85 y nF = round((C − F1)/V.hp), así que las plantas salen de la ALTURA REAL dividida entre la altura de planta de la variante. Con la variante, env recibe kw (acabado), carpintería, marco, tribuna, galería, muro cortina y losa (facades.js:487-495).
- 9. Por tramo (facades.js:497-516): 'blind' llama a D.blindRun y 'plain' a D.plainRun. 'street' y 'yard' calculan vanos con nb = round(L/3,7) (4,4 en patio) (facades.js:504), el vano del portal N, la tribuna M, wallC, gnd(c) = walkAt a 0,3 m del muro y wa (desgaste). Después llaman a I.groundFloor (interiors.js:776) y luego a pisosV + coronaV (facades.js:711, 851) si hay variante, o a D.floors + D.crown (details.js:34, 98) si no.
- 10. pisosV (facades.js:711-818). Por planta D de 1 a nF y por vano W, con azar env.rnd(3, i, W·64 + D) de 12 números: muro cortina, imposta o canto de forjado, tribunaV, galeriaV, hueco balconera/ventana/mixto/taller, persiana o habitación abierta (38 %, K.HOMEWIN), balcón individual/corrido/terraza, barandilla (forja, balaustre, obra, vidrio o tubo), ropa, macetas (D.planter) y recercados, pilastras y esgrafiados según V. Los vanos de patio pasan por patioV (facades.js:819).
- 11. coronaV (facades.js:851-898): cornisa, balaustrada, ático en terraza, frontis, alero de teja o peto liso, según V.coron.
- 12. Celdas y streaming (facades.js:990-1060). cellJob es un generador que cede el paso después de cada edificio y construye un GB por celda: 'fb<ci>' (layer base, cast) o 'fh<ci>' (orn). Al construirse la BASE, setFlag pone inf.w = 1 en los vértices del volumen y FS_BLD descarta la pared simple con un fundido tramado entre uFx = (170, 215) m. plan() cada 0,25 s, con radios en setRange (facades.js:1061-1071): R0 170 · R1 215 · RB 245 · RD 310 · H0 70 · H1 95 · HB 110 · HD 140. Topes de triángulos de 2,4 M (BASE) y 1,3 M (ORN), o 4,5/2,4 M en calidad alta, que encogen el radio solos.
- 13. Azoteas (rooftops.js:154 plan0 y :526 plan). Módulo propio con las mismas celdas de 100 m y tres niveles. Lee BREC.tipo/elig, BCN_PAL.roof(b) y el plan de manzana para los patios.

### Datos por edificio

Registro BREC (app.js:1516, 1605-1607, 1621-1697), con índice b = orden de carga (los dos ficheros de OSM y después el contenedor sintético de manzanas):
- cont, off (posición en el binario), chunk, v0/v1 (vértices en el chunk);
- bb (caja x0, z0, x1, z1 en mundo);
- elig, tipo (0/1/2), vid (muro cortina), mzk (0 normal · 1 finca · 2 taller · 3 terraza de patio);
- mz (bloques partidos: fincas con poly, H y corner; parcelas; src).

ctx.city.bget(b) (facades.js:328-340) devuelve { cls, seed (u8, 0–255), yb (base), y0 (cota inferior), y1 (coronación), rings (Float64 x,z), col (color de paleta) }.

Lo que NO hay:
- identificador estable (OSM o Catastro);
- año de construcción;
- número de plantas (se deduce de la altura: nF = round((y1 − 0,85 − gHi − G)/hp), facades.js:479-481);
- uso;
- ancho de parcela.

La altura es real (meta.stats: 249 833 edificios con altura de LiDAR y 45 969 estimados). La huella es la planta de OSM, con anillos interiores.

Clase cls (OSM; no está documentada como tabla en ningún sitio):
- 0 vivienda, 6 casas bajas o residencial sin comercios;
- 1/5 industria y almacén, 2/8/9/11/13 equipamientos, 3/12 vidrio y oficinas, 4 cristal y pilares, 10 grandes superficies, 14/15 invernaderos y templos.

Muestra 1/7: cls 0 ≈ 94 % de los elegibles.

Por barrio (muestra 1/7 de elegibles; lado menor de la caja p10/p50/p90 en m; alto p50 en m):
- Dreta de l'Eixample: 798 en la muestra, 35 fincas partidas; lado 7,1/15,1/30,7; alto 20,4.
- Antiga Esquerra: lado 9,9/24,1/42,2; alto 21,8.
- Gòtic: lado 6,7/12,2/25,9; alto 17,2.
- Raval: lado 6,7/12,4/25,5.
- Vila de Gràcia: lado 7/13,1/22,5; alto 13,9.
- Carmel: alto 9.
- Ciutat Meridiana: lado 18,6.

Conclusión: en el Eixample los edificios ya son parcelas o fincas individuales de OSM. Las manzanas de un solo volumen eran ~600 y ya se parten en fincas falsas de 12–25 m, que no son las parcelas catastrales reales.

Los barrios del juego (META.barris: n, d y anillos en coordenadas de juego; consulta BCN_BARRI.at, app.js:1513 y 1726) se cruzan por nombre. Hay 73 en ambos lados, pero 4 se escriben distinto en condal_city_datos.json: 'Sant Gervasi - Galvany' / 'Sant Gervasi- Galvany', 'Sant Gervasi - la Bonanova' / 'Sant Gervasi- la Bonanova', 'Sants - Badal' / 'Sants-Badal' y 'el Poble-sec' / 'el Poble Sec'. meta.json no tiene el código de barrio. El JSON va en WGS84 [lon, lat]: 1 068 secciones y 2 607 celdas de rejilla_comercial.

### Modelos y materiales

Sin materiales estándar: todo son ShaderMaterial de mkMat (app.js) con el preludio común (lit/shade/envRefl/emit, FRAG) y registro con reg().

Materiales de edificios:
- matBld (app.js:1129) para los volúmenes lejanos, con FS_BLD (app.js:359+). Pinta ventanas por fórmula: plantas de 3,2 m y vanos de 2,7 m, vidrio para el «estilo» 3/12 y liso para 1/4/5/8/11/>12. El «estilo» es la clase OSM del alfa del color de vértice. Usa la paleta de cubiertas uRoofPal (64×1) y uFx para el fundido con el detalle.
- matB y matH (facades.js, 'fx0'/'fx1'): el MISMO shader de detalle FS_DET con distinto uFade. Lo usan las fachadas y el mobiliario (matB). roofDet (rooftops.js) es una copia de matB con dos líneas sustituidas.

Tipo de material por vértice (K, en el alfa del color de vértice; geo.js, DESARROLLO §6.7):
- Núcleo 0–15: STUCCO, STONE, GLASS, SHUT, WOOD, METAL, IRON, SGRAF, SIGN, AWN, BAL, GSHOP (ya sin uso), LAMP, PLAIN, LEAF, PBR.
- 16–19 de la Noche 2: ladrillo, gresite, revoco y hormigón.
- interiors.js: 20 SHOPWIN y 21 HOMEWIN.
- 100 FXPIEDRA y 101 FXVIDRIO (fachadas_estilos.js).
- 120 TEJA y 121 PATIO (rooftops.js), 140–149 plazas y 150–151 transporte.
- Libres en el rango de details.js: 40–59. Hay hueco hasta 255.
- El auxiliar RGBA8 lleva parámetros (pbrAux: rugosidad, metal, patrón, emisión; desgaste wa; empaquetado de habitación). aux.w = 255 está reservado para «sustituto» en la capa BASE.

Texturas:
- fx_plaster_d/n y fx_ashlar_d/n (webp);
- atlas de rótulos tSign (DynamicTexture de 1024², 2 × 16 casillas de 512×64; una casilla por TIPO; interiors.js:~760);
- tShop (16×32 RGBA8 con los parámetros de cada tipo de comercio y las paletas de género);
- tLamp (rejilla de farolas, float).

No hay instancias en las fachadas: cada celda de 100 m es UNA malla fusionada por capa (GB de posición float32, color, auxiliar y normal RGBA8, relativos al origen de la celda), construida al vuelo con generadores y un presupuesto de ms. Las thin instances solo se usan en árboles. Los «modelos» son funciones procedurales (windowHole, tribunaV, galeriaV, shopBay, portalBay, terrace) y no mallas reutilizables. Lo que hace de «kit» es la variante paramétrica (BASE + FAM en fachadas_estilos.js:81, 326).

Niveles de detalle:
- lejos: volumen por chunk, siempre cargado;
- BASE: fundido a 170–215 m, construida hasta 245 m;
- ORNAMENTO: fundido a 70–95 m, construido hasta 110 m;
- azoteas: tres niveles hasta 800 m.

Celdas de 100 m (ctx.city.CS) compartidas por fachadas, calles y azoteas. Hitos: mallas fijas sin niveles de detalle.

### Estilos actuales

Hay tres sistemas superpuestos:

(a) Paleta de color (palette.js). Al cargar, pick() (palette.js:124) toma la familia de barrio en el centro de la caja (famAt, con caché por rejilla de 60 m, palette.js:112-119), sortea el color por pesos de la tabla W[familia] (7–12 colores por familia, palette.js:43-80; Sarrià se sustituye en :151-153), le aplica ±5 % de brillo y ±3 % de tono, y elige la cubierta (64 índices en 4 tipos; teja solo en plantas ≤ 420 m², ≤ 17 m y llenado ≥ 0,8). Solo para cls 0, 2 y 6; las demás usan PAL[cls] de app.js:1500. El color queda horneado (regla «mismo color a cualquier distancia»).

(b) Estilo de fachada (fachadas_estilos.js y varOf, facades.js:558-594). familia(barrio) (fachadas_estilos.js:287) da una de 15 familias, cada una con 4–5 variantes (70 en total). Los campos son paramétricos: bay, hp, win, alto, hueco, bal, princ, balP, vuelo, bar, forja, carp, carpCol, marco, acab, remate, imposta, recerc, pil, esgr, ultimo, coron, trib, ropa, mac, cw. La variante sale por semilla, ámbito (b, 6).
- MEZCLA (fachadas_estilos.js:259): con probabilidad p se toma una variante de la familia hermana.
- Nunca se repite la variante de un vecino pegado de índice MENOR (vecinos() por solape de cajas a 1,5 m, facades.js:552-557), sin mirar el color.
- Cada edificio cambia algo bay (±7 %), vuelo, remate y hp.
- Tipos 1/2 y vid usan TIPO.nave, TIPO.equip y TIPO.vidrio, sin mirar el barrio.
- cls 6 prefiere variantes 'taller'.
- Poblenou y Sant Andreu aleatorizan más la rejilla de huecos.
- Depuración: ?fxv=familia:n|familia|off y BCN.fx.force().

(c) Ruta antigua: details.js floors/crown con style 'sobrio', 'clasico' o 'modernista' (facades.js:473). En la práctica no se usa, porque todas las familias y tipologías tienen variantes; solo actúa con ?fxv=off. De details.js se siguen usando blindRun, plainRun y planter.

Balcones: los decide la variante (bal, princ, balP, vuelo, bar) por vano y planta en pisosV. Tribuna con probabilidad V.trib en el vano central de tramos de ≥ 3 vanos y ≥ 3 plantas. Galería en 2 de cada 3 vanos.

Bajos: no dependen del estilo, salvo el color (shopCols, de d.col, una de 3 versiones por edificio, interiors.js:859-868).

No existe nada por sección censal, por época ni por altura real del barrio. Los 22 estilos de Condal City no existen como tales, aunque varios corresponden a variantes actuales (eix_clasico, eix_modernista, eix_noucentista, eix_pedra, eix_60, talleres de fábrica, muro cortina…).

### Bajos y escaparates actuales

Todo en interiors.js. groundFloor (interiors.js:776-806) recorre los vanos de cada tramo 'street' o 'yard':
- vano N (el central del tramo de calle más largo, si L ≥ 9): portalBay (interiors.js:1006). Dos hojas de vidrio con reja dibujada en el shader, zaguán K.HOMEWIN (mármol, buzones, escalera, ascensor), placa y portero automático.
- si hay plan de comercios: shopBay;
- si no: ventana con reja (lattice K.IRON) en calle, o ventana de patio.

¿Comercial? Basta con env.shopsHere = !cls6 && tipo == 0 && H ≥ 10 && F1 − gHi > 3,6 (facades.js:472-483): TODOS los vanos de calle, salvo el portal, son comercio en cualquier barrio. Por eso el Eixample y el Gòtic salen iguales (v_eix_acera.jpg, v_gotic_calle.jpg). No se lee ninguna densidad real, ni esquinas, ni calles principales.

shopPlan (interiors.js:809-845) parte los vanos a cada lado del portal en comercios de ≤ 4 vanos o ~14 m. Por comercio, ámbito rnd(10, tramo, primer vano):
- tipo por pesos de TYPES, 17 filas (interiors.js:27-62): FORN DE PA 10, FARMÀCIA 5, FERRETERIA 4, BAR 13, FRUITERIA 7, LLIBRERIA 4, FLORISTERIA 4, RESTAURANT 9, PERRUQUERIA 7, MODA 7, GELATERIA 3, CAFÈ 10, QUEVIURES 10, ÒPTICA 3, PAPERERIA 4, FORMATGERIA 3; SUPERMERCAT con un 30 % si hay ≥ 3 vanos y ≥ 9,5 m (interiors.js:820). No se repite el tipo de los dos anteriores del mismo frente.
- puerta en un vano al azar;
- rótulo en el 93 %;
- toldo en el 35 %, y solo si cabe (sondeo con coverAt; nada si el paso es < 4,2 m; vuelo ≤ 1,35 m) (interiors.js:825, 832-836);
- persiana metálica (interiors.js:830): 9 % cerrado del todo, 22 % con alguna a medias; 6 colores (SHUTC, interiors.js:808), K.PBR con lamas (patrón 1).
- interior: semilla y habitación virtual común (anchura ≤ 16 m, alto 3,3–7,9 m, fondo 4–5,5 m).

shopBay (interiors.js:869-918): machones y dintel de sillería K.FXPIEDRA del tono de la fachada, escaparate = quad K.SHOPWIN (interior mapping por píxel: suelo, fondo, tres capas de mobiliario, género y carteles; shClosed lo cierra de noche), puerta de vidrio con montante, perfilería METAL, toldo K.AWN (quad inclinado más faldón en ORNAMENTO) y persiana.

shopFront (interiors.js:920-936):
- rótulo K.SIGN 8:1 centrado sobre el comercio, con signAux(tipo). El texto es el NOMBRE DEL TIPO («BAR», «FORN DE PA»), uno por tipo, del atlas 2×16 dibujado en init con Georgia.
- faja metálica;
- cruz verde luminosa en la farmacia.

terrace (interiors.js:940+): BAR, CAFÈ, RESTAURANT y GELATERIA (85 %) con acera ≥ 5,2 m: 2–6 mesas, sillas, sombrillas, jardineras y pizarra.

Las persianas de piso (K.SHUT, fracción se) y las alicantinas o mallorquinas van en pisosV y windowHole.

No existen: escaparates por modelo (24), negocios reales (~60 tipos), nombres inventados por local, locales vacíos («Es lloga»), grafitis en persianas, portales de garaje, verjas con jardín ni puertas de casa de pueblo.

Límites de empaquetado: color.g = tipo (5 bits, máx. 32) + 32·sentido + 64·puerta (queda libre el 128). El atlas de rótulos tiene 32 casillas por tipo.

### Puntos de enganche

- Módulo de datos ANTES de los volúmenes: app.js:1511-1513 (donde se publica BCN_BARRI y antes de leer los edificios). Ahí se carga condal_city_datos.json, se convierten los contornos y la rejilla de lon/lat a juego (UTM 31N con x = E − 418400,7 y z = N − 4567997,6) y se publica BCN_CONDAL.at(x, z) → {seccion, barrio, mezcla de estilos, detalles_prob, negocios, densidad}, con una rejilla de caché (como famAt, palette.js:112). Debe ir en index.html antes de palette.js, porque el color se hornea al cargar.
- Estilo y color al cargar, en una sola decisión por edificio: BCN_PAL.pick (palette.js:124), llamado desde app.js:1646 con b, cls, seed, centro, alto, área y llenado. Ahí se elige el estilo (regla 1: 0,7 sección + 0,3 barrio) y el color de la paleta del estilo (regla 7). Se guardan en arrays por edificio (p. ej. BREC.estilo Uint8 y BREC.var). Así FS_BLD (lejos), facades.js (d.col = BCN_PAL.wall(b), facades.js:338) y rooftops.js siguen viendo el mismo color. Las rachas y la regla de «sin repetir» pueden ir después, en un segundo paso al final de la carga (app.js:~1712), cuando ya hay cajas y anillos de todos.
- Orden por acera (regla 2): un paso posterior a la construcción de ctx.city (facades.js:325, después de ROADS). Asigna a cada edificio elegible su tramo con calzada más cercano (city.nearestCar) por el tramo 'street' más largo y lo ordena por la proyección sobre el eje del tramo y por el lado (signo de la normal). Desde ahí se aplican las rachas y la variante sin repetir con vecinos reales en vez de vecinos() por índice (facades.js:552).
- Selector de variante: varOf(b) (facades.js:558-594) es el único sitio donde genB obtiene V. Si se sustituye por estilo y variante precalculados (BREC.estilo/var), con el catálogo nuevo en fachadas_estilos.js (FAM pasa a llamarse ESTILOS[22] × 4 variantes con el mismo esquema BASE+campos, fachadas_estilos.js:81 y 326), pisosV y coronaV siguen funcionando. Los campos nuevos (planta noble, chaflán, ático retranqueado, remonte) se añaden en BASE y se interpretan en pisosV y coronaV.
- Kits por capas dentro de genB (facades.js:466-518): env es el contenedor natural de estilo, variante, desgaste y detalles_prob del barrio (env.V, env.kw, env.wa). Los hooks de cada tramo ya separan planta baja (I.groundFloor), plantas (pisosV) y coronación (coronaV). Un kit por estilo puede registrarse como un objeto {groundFloor?, floors, crown, chaflan?} y genB elegirlo por env.V.estilo, dejando como respaldo el comportamiento actual.
- Planta baja con datos: facades.js:477 (shops) e interiors.js:788 (plan = street && shopsHere ? shopPlan : null) son las dos puertas. La densidad de rejilla_comercial (regla 8: locales/ha = n/2,25) se decide por edificio o por tramo antes de shopPlan. Si no es comercial, una rama nueva según planta_baja del estilo (portal monumental, garaje, casa de pueblo, verja). En shopPlan (interiors.js:820) el sorteo pickType se cambia por negocios[].cuota_pct del barrio → escaparate (24 modelos) → fila de TYPES.
- Escaparates y rótulos: TYPES (interiors.js:27) admite filas nuevas hasta 32 y ramas nuevas en shBack/shLayer. Para 24 modelos con variantes de género, y nombres inventados por local, hay que separar el «tipo de interior» (≤ 32) del «rótulo». Se puede usar aux.z de K.SIGN (nº de rótulo, 8 bits) con un atlas más grande de nombres generados por barrio, sobre la misma DynamicTexture creada en interiors.js:~760.
- Detalles de vida (Fase 5): ya hay sitios con azar por vano y planta (facades.js:732-733, rr de 12 números). Ropa (ropa(), facades.js:663) y macetas (planter, details.js:126) se gobiernan por V.ropa y V.mac, que pueden multiplicarse por detalles_prob del barrio. Aire acondicionado, parabólicas y antenas en fachada irían al ORNAMENTO (W1). Los de cubierta, en rooftops.js plan0 (rooftops.js:154).
- Medianeras expuestas (regla 6): layoutB (facades.js:436-446) ya calcula cover por tramo. Se puede añadir un kind 'medianera' para tramos con cover > −1e8 y cover < y1 − 2,5, y extender blindRun (details.js:14) con un paño de ladrillo, anuncio o mural desde cover hasta y1, con un tipo de material nuevo en el rango 40–59.
- Chaflanes (regla 10): en layoutB/runsOf se reconocen los tramos 'street' cortos (~10–20 m) a ~45° de sus dos vecinos dentro de las familias eixample, poblenou y sant_andreu, y se marca run.chaflan para el kit.
- Monumentos: no hace falta nada nuevo. Los 18 de la regla 11 ya son fichas de hito (landmarks_a–e.js), que ocultan sus volúmenes y les quitan elig. El selector de estilo solo ha de respetar BREC.elig = 0. Revisar si conviene recortar la exclusión por radio de facades.js:312.
- Depuración (Fase 1.2): BCN.fx ya expone famOf, varOf, force, spot y calle (facades.js:1074). Se puede añadir estiloOf(b) y la sección. El arnés tools/shot.js con eval sirve para medir (como mi stats_eval.js).

### Problemas

- No hay identificador estable de edificio: b es el orden de carga. Los hitos (edificios: [índices]), data/mz_partidas.json y las semillas seed(b, …) dependen de él. Si cambian los datos de edificios, se rompe todo. La semilla del binario es de solo 8 bits (app.js:1622). La regla 0 «hash de su id» tendrá que ser un hash de b o de las coordenadas del centroide (más estable ante cambios de datos).
- No hay año, ni plantas, ni uso por edificio: el estilo solo se puede sortear por sección y barrio (como prevé la regla 1). La altura es REAL (LiDAR) y las plantas salen de dividirla. La regla 5 («plantas según plantas_pct») no puede cambiar la geometría sin romper FS_BLD, azoteas, sombras e hitos. Propongo usar plantas_pct solo para elegir hp o estilo compatibles y para áticos y remontes visuales dentro de la altura real.
- Ancho de fachada (regla 4): la huella es la real de OSM. En el Eixample ya son parcelas (mediana de caja 15 m en la Dreta), pero las 7 909 fincas de las 593 manzanas partidas son cortes sintéticos de 12–25 m. En Ciutat Vella hay volúmenes de OSM que agrupan varias casas (captura v_raval_dron.jpg: un frente de ~70 m con la misma fachada continua). Para quart de casa (4–5 m) o casa obrera hay que partir los tramos en «subfachadas virtuales» con estilo y variante propios, porque el registro no tiene parcelas.
- No hay orden por acera: vecinos() (facades.js:552) solo mira cajas que se solapan a 1,5 m y con índice menor, sin calle ni lado. Las rachas y la regla «nunca la misma variante + color contiguos» necesitan una estructura nueva de frentes de calle.
- El estilo y el color tienen que decidirse AL CARGAR (palette.js pick, en el bucle de 300 000 edificios), no en genB. Si no, el edificio cambia de color al pasar del volumen lejano al detalle (regla del §11.2). Con ~1 068 secciones, cada punto en polígono hace falta una rejilla de caché. El cálculo de rachas por acera necesita ctx.city, que hoy solo existe al iniciarse facades.js, después de hornear los colores: o se precalcula el orden de acera en app.js, o se acepta que la racha cambie solo la variante y no el color.
- El nivel lejano (FS_BLD, app.js:359+) pinta ventanas genéricas (plantas de 3,2 m, vano de 2,7 m) según la clase OSM. No conoce el estilo: entre 170 y 215 m habrá un salto de ritmo de huecos y no habrá ladrillo, gresite ni hormigón. Hay que llevar el estilo y el hp/bay a los bits libres del color de vértice o a otro atributo.
- Medianeras: un tramo pegado a un vecino más bajo (cover < y1 − 2,5) no es 'blind'. Sale como 'street' o 'yard' según roadDist y recibe ventanas o balcones por encima del tejado del vecino (visible en v_raval_dron.jpg, a la derecha). blindRun es un paño de estuco liso. La regla 6 necesita una clase de tramo nueva.
- Planta baja: hoy es comercial en el 100 % de los vanos de calle de viviendas con H ≥ 10 m. Con la regla 8 habrá muchos bajos no comerciales y hoy solo existe la ventana con reja. Hacen falta portales de garaje, puertas de casa y verjas. 17 tipos de interior frente a 24 modelos y ~60 negocios: límite de 32 tipos (5 bits en color.g de K.SHOPWIN y atlas 2×16). Los rótulos llevan el nombre genérico del tipo; los nombres inventados por local requieren otro atlas y otro empaquetado de signAux.
- Densidad de geometría: todo va fusionado por celda, sin instancias. 22 estilos × 4 variantes como «kits» no cuestan memoria de modelos (son procedurales), pero cada detalle nuevo suma triángulos a los topes de 2,4 M (BASE) y 1,3 M (ORN), que encogen el radio de detalle. Los detalles de vida tienen que ir en ORNAMENTO (W1). Los FPS no se pueden medir con SwiftShader (DESARROLLO §2); en la Fase 0 solo se pueden medir triángulos y tiempos de celda.
- Dos sistemas de exclusión de monumentos: los hitos (correctos, cubren los 18 de la regla 11) y además SKIP por radio (facades.js:312-318). SKIP deja SIN fachada de detalle a edificios corrientes en radios amplios (Sant Pau 260 m, Fòrum 260 m, Camp Nou 230 m, Sagrada Família 110 m…): puede quedar un halo de volúmenes lisos alrededor.
- Nombres de barrio: 4 de los 73 no coinciden entre meta.json y el JSON ('Sant Gervasi - Galvany', 'Sant Gervasi - la Bonanova', 'Sants - Badal', 'el Poble-sec'). meta.json no tiene el código de barrio, así que hay que normalizar los nombres o cruzar por contorno. El JSON va en WGS84 y el juego en UTM 31N desplazado: hace falta una proyección transversa de Mercator en JS (no hay ninguna en el repositorio).
- Código muerto y duplicado: details.js floors/crown (details.js:34-125) y el campo style (facades.js:473) solo se usan con ?fxv=off. La documentación §6.9 sigue diciendo que details.js hace los pisos, pero la ruta real es pisosV/coronaV dentro del núcleo facades.js. El generador nuevo debería sustituir una sola ruta y retirar la otra.
- manzanas.js decide fincas, alturas (±1 planta) y patios con su propio azar y los guarda en data/mz_partidas.json. Si el generador nuevo quiere otras alturas o anchos en esas fincas, hay que relanzar tools/mz_partidas.js, que también depende de la lista de hitos.

## 2. Conversión juego ↔ [lon, lat]

El juego no convierte en ningún momento entre su posición y [lon, lat]. Ni app.js, ni geo.js, ni los demás módulos que se cargan en la página tienen nada de UTM ni de lon/lat. Lo único que hay está fuera del juego, en las herramientas: tools/hitos/datos.js:86-97 tiene `utm(lat, lon)`, que solo va en sentido directo y pide los argumentos en orden lat, lon. tools/hitos/encaje.js:26-42 calcula el desplazamiento por mínimos cuadrados con 14 puntos de interés y da ox = −418400,68, oz = −4567997,59 y un error cuadrático medio de 11 m, documentado en HITOS.md:157. data/hitos_catalogo.json guarda lat/lon junto a x/z en cada hito. La inversa (juego → lon/lat) no existe en ningún sitio.

He escrito la conversión en las dos direcciones, sin dependencias, con series de Krüger de orden 6, en /tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/coord/geo_utm.js. El repositorio no se ha tocado.
- Contra pyproj 3.8 (EPSG:4326 → 25831) la diferencia es de 0,12 mm en sentido directo y de 0,12 mm como máximo en la inversa, en toda la rejilla del mapa.
- La ida y vuelta da menos de 4·10⁻⁹ m.
- Contra `utm()` de datos.js la diferencia es de 0,2 mm.

Con los tres puntos del usuario, la conversión cae en el sitio correcto. Los errores grandes que aparecen vienen de que sus coordenadas tienen solo 4 decimales: 0,0001° equivale a 11,1 m en latitud y 8,4 m en longitud.
- **Plaça de Catalunya:** 3,6 m del centro que usa el juego.
- **Sagrada Família:** el punto cae justo sobre la torre central, a 4,9 m del crucero; está a 19,7 m de x/z de la ficha, que es el origen del modelo y no el centro visual.
- **Torre Glòries:** 15 m, pero con la coordenada de Wikipedia completa (2.18952, 41.40349) el error baja a 0,9 m.

Los barrios del JSON y los de META.barris casan casi exactamente: 1,8 m de distancia media entre contornos y un desfase sistemático de unos 2,4 m. Un 46 % de los edificios del juego queda fuera de Barcelona y no tiene barrio en el JSON.

Scripts en /tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/coord/:
- check.js: verificación de la conversión.
- export.js: exporta centroides y polígonos.
- barrios.py: comparación de contornos con shapely.
- vistas.json y vistas2.json: las vistas para las capturas.

### Fórmula y código propuesto

Mundo = UTM 31N (EPSG:25831, ETRS89/GRS80, que para el juego es igual a WGS84: la diferencia es de unos 0,5 m) trasladado:
- x = E − 418400,7
- z = N − 4567997,6
- y = heightAt(x, z), hacia arriba.

z crece hacia el norte. En una vista cenital con yaw 0, la parte de arriba de la imagen es el norte.

Inversa: E = x + 418400,7 ; N = z + 4567997,6 → fromUTM.

El código propuesto para la Fase 1 está entero en /tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/coord/geo_utm.js. Son unas 60 líneas, no tiene dependencias y expone `window.BCN_LONLAT` / `module.exports`, así que se puede pegar en geo.js o como módulo aparte. Esquema:

```js
const a=6378137,f=1/298.257223563,k0=0.9996,E0=500000,LON0=3*Math.PI/180,OX=418400.7,OZ=4567997.6;
const n=f/(2-f), A=a/(1+n)*(1+n*n/4+n**4/64+n**6/256);
// al[1..6], be[1..6], de[1..6]: coeficientes de Krüger/Karney en potencias de n (en el fichero)
function toUTM(lon,lat){ const ph=lat*R,l=lon*R-LON0;
  const t=Math.sinh(Math.atanh(Math.sin(ph))-e*Math.atanh(e*Math.sin(ph)));
  const xi_=Math.atan2(t,Math.cos(l)), eta_=Math.atanh(Math.sin(l)/Math.sqrt(1+t*t));
  let xi=xi_,eta=eta_; for(j=1..6){xi+=al[j]*sin(2j xi_)*cosh(2j eta_); eta+=al[j]*cos(2j xi_)*sinh(2j eta_);}
  return [E0+k0*A*eta, k0*A*xi]; }
function fromUTM(E,N){ const xi=N/(k0*A), eta=(E-E0)/(k0*A); let xi_=xi,eta_=eta;
  for(j=1..6){xi_-=be[j]*sin(2j xi)*cosh(2j eta); eta_-=be[j]*cos(2j xi)*sinh(2j eta);}
  const chi=Math.asin(Math.sin(xi_)/Math.cosh(eta_)); let ph=chi; for(j=1..6) ph+=de[j]*Math.sin(2*j*chi);
  return [(LON0+Math.atan2(Math.sinh(eta_),Math.cos(xi_)))/R, ph/R]; }
lonLatToGame=(lon,lat)=>{const[E,N]=toUTM(lon,lat);return[E-OX,N-OZ];};
gameToLonLat=(x,z)=>fromUTM(x+OX,z+OZ);
```

Precisión comprobada:
- Contra pyproj: 0,12 mm en directa e inversa en todo el mapa (x de −2 a 20 km, z de −2 a 22 km).
- Ida y vuelta: menos de 4 nm.

Recomendaciones para la Fase 1:
- Usar siempre el orden [lon, lat], como en el JSON. Ojo: `utm()` de datos.js usa (lat, lon).
- Para mapear las ~2.600 celdas de la rejilla_comercial y los ~1.000 contornos de sección, convertir una sola vez al cargar (o hacerlo al construir los datos con Python) y no en cada fotograma.

### Verificación

- Sagrada Família (punto del usuario) → x 12590, z 15893.3: landmarks_a.js:73 (ficha x 12597,9, z 15875,2): 19,7 m, pero esa x/z es el origen del modelo y no el centro visual. Contra el crucero/torre de Jesucrist (ficha + (−2,5, −20,5) girado 136°, ref() en sagrada.js:62): 4,9 m. Contra el poi de meta.json (12587, 15894): 3,1 m. Contra el centroide de los 2 volúmenes de OSM 136884/136885 (12586,6, 15889,5): 5,1 m. En la captura cenital el pin rojo cae justo sobre la cruz de la torre central y el amarillo (ficha) queda ~18 m al sur. Todo esto está dentro de la cuantización de 4 decimales (±5,5 m N, ±4 m E). Con la coordenada de Wikipedia (2.17433, 41.40369) el resultado es (12584,3, 15903,3), a 11,6 m del punto del usuario.
- Plaça de Catalunya → x 12204.6, z 14053.9: plazas.js:453 CAT.c = (12207,5, 14056,0), el centro de la rosa de los vientos: 3,6 m. Poi de meta.json (12208, 14051): 4,5 m. En la captura cenital el pin rojo cae en la estrella central de la explanada.
- Torre Glòries (punto del usuario) → x 13843.7, z 15859.3: landmarks_c.js:11 (ficha 13855, 15870): 15,6 m. Centroide del volumen 141753 (13854,6, 15869,5): 15,0 m al SO, todavía dentro de la planta elíptica de 40×37 m. El error viene de los 4 decimales (2,18952 → 2,1894). Con la coordenada de Wikipedia (2.18952, 41.40349) cae a 0,9 m del centroide. Captura cenital: el pin rojo queda en el borde SO de la bala.
- Inversa (comprobación) → x 12207.5, z 14056: gameToLonLat(CAT.c) da 2.17003, 41.38702, a 3,6 m del punto del usuario. gameToLonLat(volumen de Torre Glòries 13854,6, 15869,5) da 2.189530, 41.403493, igual a Wikipedia a menos de 1 m. Diferencia con pyproj: 0,1 mm.

### Barrios del JSON frente al juego

Los 73 barrios del JSON (contorno GeoJSON en lon/lat, pasado a mundo con geo_utm.js) emparejan 1 a 1 con META.barris de data/meta.json. Los nombres hay que normalizarlos quitando espacios y guiones: «el Poble-sec»/«el Poble Sec», «Sant Gervasi - Galvany»/«Sant Gervasi- Galvany», «Sant Gervasi - la Bonanova», «Sants - Badal»/«Sants-Badal». Mejor emparejar por código. Ojo: en el JSON todo viene como texto, incluidos codigo, edificios y fachadas_pct.

Contornos:
- IoU medio 0,990 (el peor, Can Peguera, 0,972).
- Distancia media entre bordes 1,82 m (mediana 1,73, p95 3,19, máximo 55,8 m en un solo vértice).
- Desfase medio de centroides dx −0,67 m, dz +2,32 m (|media| 2,5 m): los del JSON caen unos 2 m al norte. Es despreciable y cuadra con el redondeo a metro entero de meta.json frente a los 5 decimales del JSON (~1 m).
- Términos municipales completos: 10.163 ha frente a 10.165 ha, IoU 0,997.
- La unión de las 1.068 secciones contra los barrios del JSON: IoU 0,997.

Edificios (294.037, centroides leídos con tools/hitos/datos.js como hace el juego):
- 157.577 caen en un barrio del juego y 157.574 en uno del JSON. De los que están en ambos, el 99,994 % cae en el mismo barrio. Los 9 discordantes están a 1,9 m de media (4,7 m como máximo) de un límite.
- 157.563 caen dentro de alguna sección censal.
- Aviso importante para el generador: unos 136.000 edificios (46 %) quedan fuera del término de Barcelona (L'Hospitalet, Esplugues, Sant Adrià, Badalona y el resto del área que pinta el mapa). No tienen ni sección ni barrio del JSON, así que necesitan una regla de respaldo, por ejemplo el barrio de Barcelona más cercano o una mezcla genérica.

Capturas: pin rojo = punto del usuario, amarillo = ficha del juego. Los aros de arriba están a +231 m, así que se desplazan por la perspectiva; los de abajo están a ras de suelo.

## 3. FPS de referencia (SwiftShader, sin GPU: solo comparativos)

Tengo la medida de referencia de FPS (Fase 0, punto 3) y no he cambiado nada del repositorio. Aquí no hay GPU, así que cada fotograma tarda segundos. Las cifras solo sirven para comparar entre vistas y entre versiones, no como FPS reales.

Fotograma medio a 960x540 (escala de render 0,85 en media y 1 en alta):
- Eixample a pie (eix_acera, calle con tiendas): media 27,7 s · alta 30,7 s · baja ≈7,1 s (prueba corta de 2 fotogramas, a 643x361).
- Gòtic a pie (gotic_calle): media 33,5 s · alta 42,1 s · baja ≈11,3 s.
- Dron a 380 m sobre Plaça de Catalunya: media 3,8 s · alta 4,7 s · baja ≈1,6 s.

Lo importante sale de los contadores:
1. **Todo el coste es de dibujo; la parte de CPU es pequeña.** Preparar el fotograma en la CPU cuesta solo 8–15 ms (scene.render sin esperar a la GPU) y hay 650–870 llamadas de dibujo. Casi todo el tiempo es rasterizar en SwiftShader.
2. **Lo que pesa son los triángulos, no los píxeles.** Pasar de media a alta (+38 % de píxeles, MSAA de 2 a 4) solo sube el tiempo un 11–25 %.
3. **A pie se mandan a dibujar 5,2–6,4 millones de triángulos por fotograma**, más 1,6–1,8 millones en las dos cascadas de sombra. En el dron son solo 1,3 millones, más 0,36 + 3,26 millones de sombra.
4. **El Gòtic es la vista más cara aunque se vea muy poco.** Tiene 6,4 millones de triángulos activos y 1,12 millones solo en el detalle de fachadas (detailStats().fx), frente a 0,64 millones en el Eixample. No hay ocultación por oclusión: se dibuja todo lo que cae en el campo de visión y en la distancia de dibujo (40 km).

Por eso, el número de triángulos de fachada y planta baja que añada el nuevo generador por celda de detalle será lo que más mueva los FPS. Hay que vigilarlo sobre todo en el Gòtic.

Reparto por módulo en la vista del Eixample (triángulos según detailStats): fx 636 k, st 337 k, lm 853 k, roof 294 k, plz 97 k. En el Gòtic: fx 1 116 k, st 387 k, roof 343 k, plz 203 k. La medida terminó sin errores de consola.

Ficheros, todos en /tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/fps/:
- fps_eval.js: el medidor.
- build_views.js: genera vistas_fps.json; uso: node build_views.js N WARM calidades.
- vistas_fps.json: las tres vistas.
- m960.log y m960_resultados.jsonl: la salida de la medida.
- m960_*.jpg y prueba_*.jpg: las capturas.
- medidor_consola.js: el medidor para tu ordenador.

Para repetir la medida igual: cd /home/user/Repositori-de-GitHub/gta && SIZE=960x540 TIMEOUT=1200 node tools/shot.js <D>/m960 @<D>/vistas_fps.json (D es la carpeta de arriba). Tarda unos 37 minutos.

### Método

Usé el arnés tools/shot.js, que lanza Chromium sin cabeza con SwiftShader (tools/shot.js:33) y para el bucle de render (tools/shot.js:51). Cada vista lleva un eval (fps_eval.js) que hace lo siguiente:
1. Pone B.st.maxDist = 40000, la distancia de dibujo del juego (app.js:1731). El arnés la deja en 1800.
2. Para cada calidad: llama a B.light.setQuality(q) (lighting.js:421) y a B.fxFlush() (app.js:1936), y calienta con 2 fotogramas como mínimo, más los que hagan falta hasta que scene.isReady(). La compilación de shaders tarda: 14 fotogramas y unos 430 s en la primera vista.
3. Mide N = 6 fotogramas, uno a uno: performance.now → scene.render() → gl.readPixels de 1 px, que obliga a terminar el trabajo de la GPU.
4. Lee BABYLON.SceneInstrumentation (frameTimeCounter, que es el tiempo de CPU sin esperar a la GPU, y drawCallsCounter), scene.getActiveIndices()/3 para los triángulos activos de la cámara, B.light.stats().shadow.tris para las cascadas y B.detailStats() para el reparto por módulo.
5. Devuelve el resultado con console.warn('FPSJSON …'), que el arnés imprime (tools/shot.js:37).

Vistas: Eixample = eix_acera de tools/views.json; Gòtic = gotic_calle; dron = 380 m sobre B.poi('Plaça de Catalunya') con yaw 2,5 y pitch 0,55, que el eval recoloca. Todas a las 17 h y a 960x540. La escala de render depende de la calidad: media 816x459, alta 960x540, baja 643x361 (tabla QUAL, DESARROLLO.md §7.3).

Límites:
- Sin GPU, SwiftShader rasteriza por software en una máquina compartida de 4 núcleos (carga ≈4,3). Los tiempos absolutos (segundos por fotograma) no tienen nada que ver con una GPU real. Solo valen los cocientes entre vistas, calidades y versiones, y los contadores (triángulos, llamadas de dibujo, CPU), que sí son trasladables.
- No hay vsync ni requestAnimationFrame. Al estar en modo captura el tiempo se congela (app.js:1923), y el detalle se construye de golpe con fxFlush en vez de cargarse poco a poco. Por eso no se miden los tirones de la carga progresiva.
- N = 6 fotogramas por calidad; la dispersión fue pequeña (p90 dentro del 5 % de la media).
- El modo Auto no se mide, porque en modo captura no actúa (lighting.js:443).
- Baja solo tiene 2 fotogramas de una prueba previa. La primera vista de esa prueba empezó a 960x540 y luego pasó a 643x361.

### Medidas

- {"vista": "pie_eixample (eix_acera) · media 816x459", "x": 12069.6, "z": 14544.5, "fps": 0.036, "ms": 27662.5, "triangulos": 5229928, "llamadas": 866, "notas": "mediana 27313, p90 29048 ms; CPU de scene.render 13,9 ms; sombras 1,19 M + 0,51 M tris; 859 de 2126 mallas activas; detalle fx 636 k, st 337 k, roof 294 k"}
- {"vista": "pie_eixample (eix_acera) · alta 960x540", "x": 12069.6, "z": 14544.5, "fps": 0.033, "ms": 30661.4, "triangulos": 5380270, "llamadas": 868, "notas": "mediana 31082, p90 31281 ms; CPU 11,3 ms; sombras 1,22 M + 0,63 M; MSAA 4, bloom; +11 % frente a media"}
- {"vista": "pie_eixample · baja 643x361 (prueba, N=2)", "x": 12069.6, "z": 14544.5, "fps": 0.14, "ms": 7136.4, "triangulos": 5109580, "llamadas": 861, "notas": "sin sombras, sin MSAA, sin bloom; solo 2 fotogramas"}
- {"vista": "pie_gotic (gotic_calle) · media 816x459", "x": 12712, "z": 13385.3, "fps": 0.03, "ms": 33545.6, "triangulos": 6401634, "llamadas": 649, "notas": "mediana 34039, p90 34262 ms; CPU 11,5 ms; sombras 1,34 M + 0,44 M; detalle fx 1,12 M tris (casi el doble que en el Eixample) aunque la calle es estrecha y se ve poco: no hay ocultación por oclusión"}
- {"vista": "pie_gotic (gotic_calle) · alta 960x540", "x": 12712, "z": 13385.3, "fps": 0.024, "ms": 42104.4, "triangulos": 6418260, "llamadas": 649, "notas": "mediana 42572, p90 43166 ms; CPU 15 ms; sombras 1,34 M + 0,46 M; la vista más cara"}
- {"vista": "pie_gotic · baja 643x361 (prueba, N=2)", "x": 12712, "z": 13385.3, "fps": 0.09, "ms": 11293.5, "triangulos": 6369254, "llamadas": 643, "notas": "solo 2 fotogramas"}
- {"vista": "dron_centro (380 m sobre Pl. Catalunya, yaw 2,5, pitch 0,55) · media", "x": 11939, "z": 14412, "fps": 0.27, "ms": 3764.4, "triangulos": 1315294, "llamadas": 304, "notas": "cámara en y=399; sin detalle de fachadas ni de calles (fx 0, st 0); CPU 7,8 ms; sombras 0,36 M + 3,26 M (la cascada lejana es cara desde arriba)"}
- {"vista": "dron_centro · alta", "x": 11939, "z": 14412, "fps": 0.21, "ms": 4700.3, "triangulos": 1315428, "llamadas": 304, "notas": "mediana 4599, p90 5209 ms; CPU 9,3 ms"}
- {"vista": "dron_centro · baja (prueba, N=2)", "x": 11939, "z": 14412, "fps": 0.62, "ms": 1600.1, "triangulos": 1316787, "llamadas": 299, "notas": "solo 2 fotogramas"}

### Cómo medir de verdad en el ordenador del usuario

Hay dos piezas: una que se puede usar ya sin tocar el repositorio y otra para meter en el juego en la Fase 6.

1) Ya, sin cambiar nada del repositorio: /tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/fps/medidor_consola.js. Se pega en la consola (F12) con el juego cargado y hace lo siguiente:
- Recorre las tres mismas vistas (Eixample, Gòtic y dron sobre Pl. Catalunya) en calidad alta, media y baja, a las 17 h y con el reloj parado.
- En cada combinación espera a que BCN.detailBusy() sea falso, calienta 2 s y mide 6 s con el bucle de render normal (requestAnimationFrame).
- Imprime con console.table los FPS, el tiempo medio, el p95, el peor fotograma, los triángulos activos y la resolución. Deja todo en window.__fpsReal junto con el nombre de la GPU, para copiarlo con copy(JSON.stringify(__fpsReal)) y pegarlo en el chat.
- Al terminar vuelve a dejar la calidad que había.
Para comparar con la Fase 6: misma ventana (pantalla completa, a ser posible 1920x1080), el portátil enchufado y sin otras pestañas. Si da 60 clavados, el vsync lo está limitando; para ver por encima, abrir Chrome con --disable-gpu-vsync --disable-frame-rate-limit.

2) Dentro del juego, en la Fase 6:
- (a) Un contador en pantalla, activado con ?fps=1 o la tecla F (manejador de teclas en app.js:1826). Mostraría la media de FPS y de ms de una ventana de 1 s, el p95 y el peor fotograma, los triángulos activos y la calidad en curso. Saldría de scene.onAfterRenderObservable (app.js:1931) y podría reutilizar la ventana de tiempos real que ya calcula lighting.js:441-447 (win.ms, publicada en BCN.light.stats().ms). Iría en una línea del panel, junto a «Gráficos» (index.html:77) o en #stats (index.html:81).
- (b) Un botón «Prueba de rendimiento» o ?bench=1 que haga lo mismo que medidor_consola.js y además mida el tiempo de construcción del detalle al llegar a cada vista (de applyView a detailBusy()==false). Así se verían los tirones de la carga progresiva, que el arnés no puede medir.
El resultado se guarda como JSON con la versión del juego y la GPU. La Fase 6 se compara con esta referencia (FPS reales del usuario) y, en el arnés, con m960_resultados.jsonl repitiendo vistas_fps.json. En el arnés hay que fijarse sobre todo en los triángulos activos y de sombra y en las llamadas de dibujo, que no dependen de la máquina.

## 4. condal_city_datos.json frente al juego

El JSON está limpio y es coherente por dentro. Los porcentajes suman 100 ±0,3. Todos los estilos que aparecen tienen ficha y los 59 tipos de negocio tienen escaparate, cada uno en uno solo. Las cifras de comercio cuadran entre sí, todos los barrios tienen al menos una sección y los edificios de las secciones suman exactamente lo mismo que los de los barrios (97.639). Los 73 barrios casan con META.barris por nombre: 69 tal cual y 4 normalizando guiones y espacios. La geometría coincide con IoU entre 0,97 y 0,996 y los centroides se separan unos 2 m, así que la conversión x = E − 418400,7 ; z = N − 4567997,6 es válida. Hay tres problemas de fondo. (1) Los datos solo cubren el término municipal de Barcelona: 101,6 km² de un mundo de 555 km², y cerca del 47 % de los 294.037 edificios del juego queda fuera (L'Hospitalet, Esplugues, Sant Adrià, Badalona…), así que hace falta un perfil sintético de «periferia». (2) La rejilla comercial está sobre una malla lon/lat y solo trae las celdas con locales, de modo que la regla 8 («la celda más cercana») da densidad ajena al 38 % de la ciudad. (3) En 38 pares barrio/estilo el rango de plantas del estilo choca con el plantas_pct real del barrio, por ejemplo burgues_60_70 (6–10 plantas) en Vallvidrera, donde el 0 % de los edificios tiene 6 o más. Empaquetado sin contornos y con índices raster: unos 60 KB comprimidos con gzip frente a 1 MB. No he tocado el repositorio. Los scripts están en /tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/datos/ (a1.py estructura y sumas, a2.py cobertura y casado, a3.py ids, tamaños y conflictos de plantas, a5.py índices y rejilla, terrmeta.py lee la cabecera de terrain.png y buildings*.png, map_codigo_meta.json).

### Estructura

Claves de primer nivel: _leeme, reglas_generador (12 reglas, 0_semilla … 11_monumentos, igual que la sección C), catalogo_fachadas (22), escaparates (24), barrios (73), secciones (1068) y rejilla_comercial (2607). Tamaño: 1.015.439 B, que comprimidos con gzip -9 se quedan en 164 KB.

Casa con la sección E (CONDAL_CITY_PROMPT.md:385-394) en casi todo:
- catalogo_fachadas[estilo]: tiene exactamente las 12 claves documentadas. Las 22 fichas tienen 4 variantes. Las paletas tienen entre 4 y 6 colores y desgaste_base va de 0,10 a 0,60.
- escaparates[modelo]: {descripcion, negocios}.
- barrios[]: tiene las 12 claves documentadas. codigo va de 1 a 73. plantas_pct trae siempre las claves "1".."9","10+". detalles_prob trae siempre las mismas 11 claves (ropa_tendida, macetas_y_plantas, aire_acondicionado, antena_parabolica, persianas_cerradas, banderas_y_pancartas, grafitis, andamios_obras, toldos, remontes_plantas_anadidas, desgaste_extra). comercio = {locales_total, locales_activos, activos_por_ha, vacios_pct, negocios[{tipo, locales, cuota_pct, veces_media}]}, con entre 8 y 59 negocios por barrio. El contorno es un Polygon en 71 barrios y un MultiPolygon en 2 (3.288 vértices en total).
- secciones[]: {id, barrio, edificios, fachadas_pct, contorno}. Son 1066 Polygon y 2 MultiPolygon, con 11.725 vértices en total.
- rejilla_comercial[]: [lon, lat, n].

Diferencias con la sección E:
- epocas_pct no tiene claves fijas: 14 barrios omiten las épocas que valen 0, por ejemplo «<1901» o «2021-2030». El código tiene que leerlas con valor por defecto 0.
- secciones[].id no es «barrio-sección» sino «distrito-sección» ("1-27" pertenece al barrio 2). 1047 de los 1068 id no empiezan por su código de barrio. El campo barrio es el bueno: lo he comprobado por geometría, y todas las secciones caen más del 90 % dentro de su barrio.
- La rejilla no está en metros: es una malla de lon/lat con pasos de 0,0018° × 0,00136° (unos 150 × 151 m), girada 0,55° respecto a UTM. Solo lista las celdas con n ≥ 1: son 2607 de las 74 × 90 posibles. La suma de n es 57.353, igual que la suma de locales_activos de los barrios, así que no incluye locales vacíos.
- barrios[].distrito usa «L'Eixample» y META usa «Eixample». Es la única diferencia de distrito.

### Cobertura

Mundo del juego, leído de la cabecera de data/terrain.png: E0 = 418400, N0 = 4568000, WX = 22400, WZ = 24800, es decir, x de 0 a 22400 y z de 0 a 24800, 555,5 km².

Lo que cubre el JSON:
- Los barrios suman 101,65 km² y caen 100 % dentro del mundo (bbox x 2412–17079, z 6285–23069). Ningún barrio queda cortado.
- La unión de las secciones coincide con la ciudad salvo 0,26 km² de diferencia simétrica. Hay secciones enormes en Collserola y Montjuïc (hasta 8 km²) y 13 secciones con menos de 10 edificios.
- La rejilla va de x 5447 a 16539 y de z 9473 a 22836, sin celdas fuera del mundo. 37 celdas caen justo fuera del contorno de Barcelona, en el borde.

Fuera de Barcelona no hay nada. Son unos 454 km² del mundo y, ponderando por área cada trozo de 800 m de buildings0/1.png, unos 137.000 de los 294.037 edificios del juego (≈47 %). Por los límites del mundo serían L'Hospitalet, Esplugues, Sant Just, Cornellà y el Prat (en parte), Sant Adrià, Badalona, Santa Coloma, Montcada y la vertiente de Collserola; a falta de confirmar con los límites municipales. Hoy esa zona ya se trata como «periferia» cuando BCN_BARRI.at() devuelve null (palette.js:39, fachadas_estilos.js:245-246, :287).

Propuesta:
- Definir 2–3 perfiles sintéticos con el mismo esquema que un barrio (fachadas_pct, plantas_pct, detalles_prob, negocios), partiendo de barrios análogos. Por ejemplo, L'Hospitalet/Collblanc/la Torrassa ≈ media de Sants-Badal, la Bordeta y Hostafrancs; Badalona/Sant Adrià/Santa Coloma ≈ media de el Besòs i el Maresme, Verdun y la Prosperitat; Esplugues/Sant Just ≈ Pedralbes y les Corts.
- Elegir el perfil por lado del mundo (oeste, norte o este) o por los límites municipales, si se añaden.
- Densidad comercial para los edificios fuera de la rejilla: un valor bajo fijo por perfil, o la de ese barrio análogo.
- La regla 11 de monumentos solo da nombres, sin coordenadas. Hay que casarlos con los hitos que ya existen (landmarks*.js, META.poi).

### Nombres de barrio

Nombres frente a META.barris (data/meta.json, que es lo que expone BCN_BARRI en app.js:1513 y lo que consulta barriAt en app.js:1720):
- 69 nombres coinciden exactamente.
- 4 solo casan normalizando, sin tildes, espacios ni guiones:
  - «el Poble Sec» → «el Poble-sec»
  - «Sants-Badal» → «Sants - Badal»
  - «Sant Gervasi- la Bonanova» → «Sant Gervasi - la Bonanova»
  - «Sant Gervasi- Galvany» → «Sant Gervasi - Galvany»
- Ninguno se queda sin pareja.
- El orden es distinto: codigo − 1 no es el índice en META.barris. La permutación codigo → índice está en /tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/datos/map_codigo_meta.json; por ejemplo, el codigo 4 (Sant Pere) es el índice 11 y el 15 (Hostafrancs) el 37.
- La geometría confirma el casado: IoU mínimo 0,972 (Can Peguera) y mediana 0,992, con centroides a unos 2 m.
- Recomendación: en el empaquetado, guardar el índice de META.barris junto al codigo, o reordenar los barrios del paquete en el orden de META. Así BCN_BARRI.at(x, z) da directamente el perfil sin comparar textos.

palette.js (BY, palette.js:21-37):
- Todos sus nombres existen en META con la misma grafía, incluidas las 4 con guion espaciado.
- No lista los 13 barrios de Nou Barris, que caen en nou_barris por defecto (palette.js:39). Es correcto.

fachadas_estilos.js:
- Tiene otra tabla BARRI (fachadas_estilos.js:266-284) más DISTRICTE (:285-286) con los mismos nombres de META.
- Con datos reales por barrio, BCN_PAL.fam y la familia de fachadas_estilos.js pasan a ser secundarias: quedan como respaldo de color o para la periferia.
- Si se mantienen, conviene una sola tabla codigo → familia en vez de dos listas de cadenas.

### Formato en el juego

Archivo propuesto: data/condal.json (o .bin), cargado con el resto en app.js:39 y sin red. Tamaños medidos con gzip -9:

1. Quitar: _leeme, reglas_generador y las fuentes. El texto de catalogo_fachadas (composicion, donde, planta_baja, coronacion, variantes como frases) sirve para modelar, no en tiempo de ejecución. Se queda solo lo numérico: plantas, ancho_fachada_m, paleta, desgaste_base e índice de estilo (unos 2 KB). También sobran epocas_pct, variedad_epocas, locales, veces_media, locales_total y todos los contornos. Los contornos de barrio ya están en META.barris.r y los de sección pasan a raster.

2. Barrios: perfiles compactos con fachadas en Uint8[22] (pct × 2), plantas en Uint8[10], detalles_prob en Uint8[11] (× 255) y negocios como pares [idTipo 0..58, cuota]. El conjunto barrios + secciones sin contornos ocupa 331 KB, 45 KB comprimido.

3. Secciones: matriz Uint8[1068 × 22], 23,5 KB, 10 KB comprimida, más el barrio de cada sección.

4. Índice espacial de secciones precalculado en coordenadas del juego, como raster Uint16 (0 = sin sección):
   - a 50 m (448 × 496): 434 KB sin comprimir, 12 KB comprimido;
   - a 25 m (896 × 992): 1,7 MB sin comprimir, 28 KB comprimido;
   - a 20 m, alineado con CELL (1120 × 1240): 2,7 MB sin comprimir, 37 KB comprimido.
   Recomiendo 25 m: el error de borde es despreciable porque la regla 1 ya mezcla 0,7 sección + 0,3 barrio. La consulta es O(1) en vez del punto en polígono lineal de barriAt (app.js:1720-1726). La alternativa exacta son los polígonos simplificados a 2 m en Int16 (11.706 vértices, unos 45 KB) más una rejilla gruesa de candidatos.

5. Rejilla comercial: remuestrearla a una malla densa de 150 m alineada con el mundo (150 × 166 Uint16 = 49,8 KB, 3,6 KB comprimida), con 0 donde no hay locales. Así la regla 8 se convierte en una lectura de array y deja de buscar la celda más cercana.

6. Total: unos 60 KB comprimidos frente a 164 KB comprimidos y 1 MB sin comprimir. Se puede guardar como binario dentro de un PNG contenedor, como ya hacen terrain.png y roads.png (loadContainer, app.js:14-35), o como JSON más un .bin. La conversión lon/lat → x, z se hace una sola vez en el empaquetador, no en el juego.

7. Comprobación de coordenadas con los tres puntos de la Fase 0: SF (12590, 15893), Pl. Catalunya (12205, 14054) y Glòries (13844, 15859). META.poi tiene (12587, 15894), (12208, 14051) y (13849, 15865): la diferencia es de 3–6 m, la imprecisión propia de un POI. El terreno usa E0/N0 redondos (418400 / 4568000) frente a 418400,7 / 4567997,6 del encargo. Son 0,7 m y 2,4 m de diferencia; conviene fijar uno solo en el empaquetador.

### Problemas

- El 47 % de los edificios del juego (unos 137.000 de 294.037) está fuera de Barcelona y el JSON no tiene datos para ellos: hacen falta perfiles sintéticos de periferia (L'Hospitalet, Esplugues, Sant Adrià, Badalona, Santa Coloma…). Hoy esos edificios caen en 'periferia' (palette.js:39, fachadas_estilos.js:287).
- rejilla_comercial solo lista las celdas con locales: 2607 de 6660 en la malla lon/lat. 1726 de las 4517 celdas de 150 m de la ciudad (38 %) no tienen celda a 112 m o menos, así que la regla 8 ('la celda más cercana') les asigna la densidad de una vecina en vez de 0. Hay que precalcular una malla densa con ceros.
- La rejilla está en lon/lat (paso 0,0018° × 0,00136°) y girada 0,55° respecto a UTM y al juego. No es una malla de 150 m alineada con el mundo; hay que remuestrearla.
- Rango de plantas del estilo contra plantas_pct del barrio: en 38 pares barrio/estilo con cuota ≥10 %, el rango 'plantas' del estilo recoge menos del 25 % de los edificios del barrio. Ejemplos: Vallvidrera burgues_60_70 35,7 % [6–10] frente a un 0 % de edificios con 6+ plantas; Font d'en Fargues burgues_60_70 [6–10] 1,3 %; el Coll desarrollismo [6–12] 4,4 %; Vallcarca burgues 10,2 %; Carmel, Teixonera, Sarrià y Can Baró desarrollismo 12–14 %; la Marina del Prat Vermell (plantas medias 2,1) con desarrollismo, olimpico, contemporaneo y vivienda_social al 10,9 %. La regla 5 ('recortar al rango del estilo') dispararía las alturas. La correspondencia época → estilo de las zonas altas y de la Zona Franca es dudosa: conviene dejar que manden las plantas reales (recortar el rango del estilo a la distribución del barrio, o cambiar el estilo por uno bajo como torre o pueblo).
- Las reglas 8 y 9 cuentan dos veces los locales vacíos: 'Local vacío (se alquila / vende)' es un tipo más en negocios, con cuota_pct (13,66 % en el Raval), y además existe vacios_pct. Hay que usar uno de los dos.
- secciones[].id es 'distrito-sección', no 'barrio-sección': 1047 de 1068 id no empiezan por su barrio. Hay que usar el campo barrio, que es correcto.
- epocas_pct omite las claves con valor 0 en 14 barrios; el código debe leerlas con 0 por defecto.
- Nombres distintos de META.barris en 4 barrios ('el Poble Sec', 'Sants-Badal', 'Sant Gervasi- la Bonanova', 'Sant Gervasi- Galvany'), distrito «L'Eixample» frente a «Eixample», y orden distinto (codigo−1 ≠ índice de META). Hay que casar por una tabla precalculada, no por texto en tiempo de ejecución.
- Barrios con muy pocos locales, donde las cuotas de negocio son ruido: la Clota 13, Can Peguera 17, Vallbona 22, Torre Baró 24 y Baró de Viver 39. Por ejemplo, veces_media 38,97 de Gasolinera en Vallbona sale de 1 solo local. Conviene mezclarlas con la media del distrito.
- Algunas secciones tienen muy pocos edificios para fiarse de su fachadas_pct (13 con menos de 10 edificios y 146 con menos de 30; 7 están al 100 % en un solo estilo). Conviene que pese más el barrio cuando el número de edificios es bajo.
- activos_por_ha del barrio (y de la chuleta D) usa el área bruta, con parques y montaña: el Poble Sec da 2,4/ha y Vallvidrera 0,06/ha. Para decidir las plantas bajas solo vale la rejilla.
- andamios_obras vale 0,02 en los 73 barrios; es una constante, no un dato.
- La regla 11 (monumentos) solo da nombres, sin coordenadas ni ids. Hay que casarlos con los hitos existentes (landmarks*.js, META.poi), o dar polígonos de exclusión.
- Sumas: todo bien. fachadas, épocas y plantas de barrio suman entre 99,7 y 100,3; las secciones, entre 99,7 y 100,3; cuota_pct, entre 99,89 y 100,09. locales, total, activos y vacios_pct cuadran en los 73 barrios; plantas_media cuadra con plantas_pct; ningún estilo ni negocio queda sin modelo.
