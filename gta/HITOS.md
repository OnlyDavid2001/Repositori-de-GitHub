# Hitos de Barcelona — catálogo

Listado de los edificios y monumentos singulares que el juego modelará aparte (encargo de hitos, etapas R1 y R2).
Versión para máquinas: `data/hitos_catalogo.json` (mismas fichas, completas). Se genera con
`python3 tools/hitos/catalogo.py`: para cambiar algo, edita ese script y vuelve a ejecutarlo.

**Niveles**: A = modelo propio cuidado (icono) · B = arquetipo con parámetros · C = retoque del volumen que ya
existe (color, estilo, altura). **Alto** en metros reales. **Pos.** = confianza de la posición (alta: coordenada
de Wikipedia/Wikidata; media: redondeada o de memoria en sitio aislado; baja: de memoria, a revisar).
La columna «Hoy en el juego» sale del encaje de R2 con el registro de edificios (`tools/hitos/encaje.js`):
cuántos volúmenes del juego sustituye el hito, su planta y su altura en los datos. **x, z** = posición en el
mundo del juego (m; X al este, Z al norte). La lista de índices (`edificios`) está en el JSON.

| Lote | Tema | A | B | C | Total |
|---|---|---|---|---|---|
| a | Gaudí y modernismo | 5 | 12 | 3 | 20 |
| b | Deporte y Montjuïc | 7 | 9 | 4 | 20 |
| c | Torres y frente marítimo | 8 | 12 | 2 | 22 |
| d | Ciutat Vella, puerto y monumentos | 4 | 19 | 0 | 23 |
| e | Collserola, zona alta, estaciones, L'Hospitalet y otros | 3 | 17 | 2 | 22 |
| | **Total** | 27 | 69 | 11 | **107** |

## Lote a · Gaudí y modernismo

| Nombre | Nivel | Qué es | Alto | Cómo se va a hacer | x, z | Pos. | Hoy en el juego |
|---|---|---|---|---|---|---|---|
| Casa Batlló | A | Casa entre medianeras en Pg. de Gràcia 43 (lado SO, mira al NE) | 32 m | modelo propio: lomo de dragón de escamas en la cubierta; fachada azul-verde brillante; balcones-máscara y columnas-hueso | 11776, 14563 | alta | 1 volumen de 303 m² y 20 m; clase 0 |
| Casa Milà (La Pedrera) | A | Bloque de esquina en el chaflán Pg. de Gràcia / Provença; fachada continua y ondulada d… | 34 m | modelo propio: fachada ondulada como olas de piedra; balcones de hierro negro enmarañado; chimeneas-guerrero en la azotea | 11536, 14988 | alta | 1 volumen de 1 674 m² y 30 m (+12 partes de OSM); clase 0 |
| Park Güell (zona monumental) | A | Conjunto en ladera | 20 m | modelo propio: pabellones de cuento con tejados de «nata»; banco ondulado multicolor al borde de la plaza; columnata dórica bajo la plaza; dragón en la escalinata | 10794, 16991 | media | 22 volúmenes, 4 088 m² en total, hasta 20 m (+1 parte de OSM); clase 0 , 2 , 6 , 1 |
| Recinte Modernista de Sant Pau | A | Ciudad-hospital al final de la Av. Gaudí, girada 45° respecto al Eixample (ejes N-S) | 50 m | modelo propio: torre central del pabellón de entrada; cúpulas de cerámica verde y amarilla; ladrillo rojo | 12599, 16904 | alta | 152 volúmenes, 29 227 m² en total, hasta 33 m (+11 partes de OSM); clase 0 , 1 , 2 |
| Sagrada Família | A | Templo ACABADO en cruz latina (nave de 5 naves, crucero de 60 m, ábside al NO sobre Pro… | 172,5 m | modelo propio: torre central de 172,5 m rematada por una cruz de cuatro brazos; torres de apóstoles de pan de azúcar con pináculos de trencadís; evangelistas con su símbolo y María con la estrella; silueta escalonada de agujas, piedra ocre | 12598, 15875 | alta | 2 volúmenes, 8 295 m² en total, hasta 173 m (+146 partes de OSM); clase 11 , 14 |
| Casa Amatller | B | Casa entre medianeras junto a la Batlló, con hastial escalonado de estilo flamenco que … | 28 m | arquetipo: hastial escalonado; fachada rosada con esgrafiados | 11788, 14552 | alta | 1 volumen de 179 m² y 20 m; clase 0 |
| Casa Vicens | B | Casa de aire mudéjar en Gràcia | 20 m | arquetipo: ajedrezado de azulejo verde y blanco; torrecillas de esquina | 10603, 15898 | alta | 1 volumen de 282 m² y 11 m (+2 partes de OSM); clase 0 |
| Casa de les Punxes | B | Edificio-castillo de ladrillo rojo que ocupa una manzana triangular entre Diagonal y Ro… | 40 m | arquetipo: seis torres con agujas cónicas; ladrillo rojo y piedra | 11697, 15279 | alta | 46 volúmenes, 1 390 m² en total, hasta 36 m (+5 partes de OSM); clase 0 , 5 |
| Castell dels Tres Dragons | B | Edificio-castillo de ladrillo rojo visto en el Parc de la Ciutadella, con almenas, cuat… | 25 m | arquetipo: ladrillo rojo con almenas; torretas angulares | 13319, 14168 | alta | 1 volumen de 1 188 m² y 19 m; clase 0 |
| Col·legi de les Teresianes | B | Colegio de Gaudí | 25 m | arquetipo: bloque alargado de ladrillo; almenas puntiagudas | 9142, 15502 | baja | no existe con seguridad: Hay varios volúmenes bajos (9–22 m) en la parcela y ninguno con la planta alargada de 18×65 m; candidatos: #124633 (995 m², 9 m), #124634 (469 m², 22 m), #124630 (411 m², 15 m). |
| Mercat de Sant Antoni | B | Mercado de hierro que ocupa una manzana del Eixample, con planta en cruz de San Andrés … | 20 m | arquetipo: planta en aspa; linterna central; cubiertas grises de dos aguas | 11532, 13128 | alta | 1 volumen de 2 679 m² y 23 m (+7 partes de OSM); clase 0 |
| Palau Güell | B | Palacio entre medianeras en Nou de la Rambla | 30 m | arquetipo: dos arcos parabólicos; chimeneas de colores y aguja central | 12550, 13139 | alta | 1 volumen de 549 m² y 17 m; clase 2 |
| Palau de la Música Catalana | B | Edificio de ladrillo visto rojo en una esquina estrecha de Sant Pere més alt; columnas … | 25 m | arquetipo: ladrillo rojo con mosaicos de flores; esquina con grupo escultórico | 12647, 14116 | alta | 1 volumen de 1 294 m² y 17 m; clase 2 |
| Pavellons Güell | B | Portería y caballerizas de la finca Güell en Pedralbes | 12 m | arquetipo: verja del dragón; cupulines con trencadís | 7950, 14348 | alta | 1 volumen de 328 m² y 4 m; clase 2 |
| Plaça de toros Monumental | B | Coso circular neomudéjar de ladrillo con arcos, torres en las entradas rematadas por cú… | 25 m | arquetipo: anillo de ladrillo; cúpulas-huevo de cerámica blanca y azul | 13157, 15496 | alta | 1 volumen de 7 868 m² y 25 m (+18 partes de OSM); clase 5 |
| Torre Bellesguard | B | Casa-castillo neogótica en la falda de Collserola | 30 m | arquetipo: aguja con cruz de cuatro brazos; volumen cúbico gris | 8623, 16591 | alta | 1 volumen de 253 m² y 9 m; clase 0 |
| Universitat de Barcelona (edifici històric) | B | Edificio neorrománico simétrico frente a Gran Via (entre Balmes y Aribau) | 30 m | arquetipo: fachada simétrica con dos torres; piedra ocre | 11685, 14027 | alta | 21 volúmenes, 4 251 m² en total, hasta 30 m (+4 partes de OSM); clase 0 |
| Casa Calvet | C | Casa entre medianeras en Casp | 25 m | retoque del volumen: remates curvos; piedra clara | 12477, 14468 | alta | 1 volumen de 622 m² y 20 m (+1 parte de OSM); clase 2 |
| Casa Lleó i Morera | C | Casa de esquina Pg. de Gràcia / Consell de Cent, piedra clara con mucha escultura y una… | 30 m | retoque del volumen: templete de esquina; piedra clara muy ornamentada | 11822, 14518 | alta | 1 volumen de 395 m² y 17 m (+1 parte de OSM); clase 0 |
| Fundació Antoni Tàpies | C | Edificio de ladrillo rojo entre medianeras en Aragó, coronado por la escultura de tubos… | 20 m | retoque del volumen: nube de tubos metálicos en la azotea | 11676, 14577 | alta | 1 volumen de 1 099 m² y 25 m; clase 0 |

## Lote b · Deporte y Montjuïc

| Nombre | Nivel | Qué es | Alto | Cómo se va a hacer | x, z | Pos. | Hoy en el juego |
|---|---|---|---|---|---|---|---|
| Camp Nou | A | Estadio REMODELADO y ACABADO | 60 m | modelo propio: óvalo de terrazas horizontales blancas; anillo de cubierta sobre las gradas; gradas azul y granate; césped | 8253, 13412 | alta | 1 volumen de 29 598 m² y 25 m (+4 partes de OSM); clase 0 |
| Castell de Montjuïc | A | Fortaleza abaluartada del s. XVIII en la cima | 25 m | modelo propio: planta en estrella con baluartes; foso; torre de vigía | 11843, 11427 | alta | 1 volumen de 25 457 m² y 8 m (+4 partes de OSM); clase 2 |
| Estadi Olímpic Lluís Companys | A | Estadio neoclásico de 1929 en Montjuïc | 30 m | modelo propio: fachada ocre con arcadas; marquesina blanca de la tribuna; pista roja | 10983, 11595 | alta | 1 volumen de 44 781 m² y 22 m (+1 parte de OSM); clase 9 |
| Las Arenas | A | Antigua plaza de toros convertida en centro comercial | 35 m | modelo propio: anillo neomudéjar de ladrillo; arcos de herradura; cubierta-mirador | 10463, 12881 | alta | 1 volumen de 7 861 m² y 25 m (+11 partes de OSM); clase 0 |
| Palau Nacional (MNAC) | A | Palacio de 1929 que preside Montjuïc mirando a la Pl. d'Espanya (al NNO) | 50 m | modelo propio: cúpula central; cuatro torres de esquina; escalinatas y cascadas | 10821, 11985 | alta | 1 volumen de 15 857 m² y 11 m (+2 partes de OSM); clase 2 |
| Palau Sant Jordi | A | Pabellón de Isozaki | 45 m | modelo propio: cúpula rebajada gris metálica; zócalo macizo | 10722, 11449 | alta | 1 volumen de 12 946 m² y 9 m (+1 parte de OSM); clase 0 |
| Torre de Calatrava (Torre de Comunicacions de Montjuïc) | A | Torre blanca de Calatrava | 136 m | modelo propio: fuste blanco inclinado; anillo semicircular; base de trencadís | 10559, 11545 | alta | 1 volumen de 105 m² y 136 m (+2 partes de OSM); clase 4 |
| CaixaForum (Casaramona) | B | Antigua fábrica modernista de ladrillo rojo | 30 m | arquetipo: dos torres de aguja; naves almenadas de ladrillo | 10462, 12345 | alta | 1 volumen de 5 943 m² y 11 m; clase 2 |
| Font Màgica | B | Vaso oval escalonado de piedra a los pies del Palau Nacional; de noche, chorros de agua… | 3 m | arquetipo: vaso oval escalonado; chorros de colores de noche | 10660, 12308 | alta | no existe: fuente: no hay volumen en los datos |
| Fundació Joan Miró | B | Edificio blanco de Sert | 12 m | arquetipo: blanco puro; lucernarios curvos | 11339, 12016 | alta | 1 volumen de 3 742 m² y 4 m; clase 0 |
| Les Quatre Columnes | B | Cuatro columnas jónicas exentas de piedra, en fila, en el eje de la Av. Reina Maria Cri… | 20 m | arquetipo: cuatro columnas jónicas en fila | 10690, 12251 | alta | no existe: columnas: no existen en los datos |
| Palaus d'Alfons XIII i Victòria Eugènia | B | Dos palacios gemelos de exposición a ambos lados de la Av. Reina Maria Cristina | 30 m | arquetipo: pareja de palacios simétricos; torretas de esquina | 10718, 12191 | baja | no existe con seguridad: La coordenada de cawiki cae en la explanada de la Font Màgica. Los palacios que flanquean la avenida tienen en los datos plantas grandes y bajas (11–29 m) que no se distinguen con seguridad de los pabellones de la Fira: #58992 (5 923 m², E), #60010 (7 499 m², O), #60012 (17 742 m², O). |
| Pavelló Mies van der Rohe | B | Pabellón de 1929 | 4 m | arquetipo: losa fina flotante; estanques | 10512, 12242 | alta | 1 volumen de 349 m² y 11 m; clase 2 |
| Poble Espanyol (Torres d'Àvila) | B | Recinto amurallado; lo reconocible es la puerta de entrada copia de las murallas de Ávila | 24 m | arquetipo: dos torres almenadas de muralla | 10248, 12086 | alta | 55 volúmenes, 6 431 m² en total, hasta 9 m; clase 0 |
| Torres Venecianes | B | Dos campanarios de ladrillo rojo a la entrada de la Av. Reina Maria Cristina (Pl. d'Esp… | 47 m | arquetipo: pareja de campanarios rojos; aguja piramidal | 10502, 12629 | alta | 2 volúmenes, 172 m² en total, hasta 47 m (+6 partes de OSM); clase 0 |
| Velòdrom d'Horta | B | Velódromo de hormigón | 12 m | arquetipo: óvalo de pista peraltada | 10493, 19742 | alta | 1 volumen de 13 004 m² y 7 m (+1 parte de OSM); clase 0 |
| Palau Blaugrana | C | Pabellón deportivo junto al Camp Nou | 25 m | retoque del volumen: caja ancha baja | 8028, 13320 | alta | 1 volumen de 4 712 m² y 6 m (+1 parte de OSM); clase 0 |
| Piscina Municipal de Montjuïc | C | Piscina de saltos con gradas mirando la ciudad. | 15 m | retoque del volumen: plataforma de saltos | 11775, 12079 | alta | 1 volumen de 1 880 m² y 12 m; clase 9 |
| Piscines Bernat Picornell | C | Piscinas olímpicas | 15 m | retoque del volumen: caja baja con gradas | 10538, 11702 | alta | 1 volumen de 3 439 m² y 12 m; clase 9 |
| Teatre Grec | C | Teatro al aire libre en una antigua cantera | 10 m | retoque del volumen: gradas semicirculares | 11322, 12119 | alta | 1 volumen de 1 677 m² y 12 m (+1 parte de OSM); clase 2 |

## Lote c · Torres y frente marítimo

| Nombre | Nivel | Qué es | Alto | Cómo se va a hacer | x, z | Pos. | Hoy en el juego |
|---|---|---|---|---|---|---|---|
| Edifici Fòrum | A | Gran triángulo equilátero de 180 m de lado elevado sobre pilotes; fachada azul ultramar… | 25 m | modelo propio: triángulo azul flotante | 16520, 16706 | alta | 1 volumen de 14 326 m² y 15 m (+1 parte de OSM); clase 0 |
| Hotel Arts | A | Torre de planta cuadrada junto al Port Olímpic con un exoesqueleto de acero blanco en r… | 154 m | modelo propio: exoesqueleto blanco reticulado; vidrio oscuro detrás | 14397, 14019 | alta | 1 volumen de 1 323 m² y 154 m; clase 3 |
| Hotel W (Hotel Vela) | A | Torre en forma de vela al final de la Barceloneta | 99 m | modelo propio: silueta de vela; vidrio espejo azul | 13860, 11980 | alta | 1 volumen de 2 338 m² y 87 m (+24 partes de OSM); clase 3 |
| Peix d'Or (Peix de Frank Gehry) | A | Escultura de un pez de 56 m hecha de lamas de acero dorado sobre una pérgola, al pie de… | 35 m | modelo propio: silueta de pez; malla dorada | 14420, 13955 | media | no existe: escultura sobre el zócalo del Hotel Arts; debajo hay el volumen bajo #102827 (2 878 m², 5 m) |
| Torre Glòries | A | Bala de planta elíptica que se afila arriba en cúpula; piel de lamas de vidrio sobre ch… | 144 m | modelo propio: silueta de bala; degradado rojo-azul; de noche, LED de colores | 13855, 15870 | alta | 1 volumen de 1 163 m² y 144 m (+6 partes de OSM); clase 12 (Torre Glòries) |
| Torre Mapfre | A | Gemela del Hotel Arts al otro lado del puerto | 154 m | modelo propio: prisma de vidrio verdoso con bandas; pareja con el Hotel Arts | 14493, 14116 | alta | 1 volumen de 1 102 m² y 154 m; clase 3 |
| Torre Mare Nostrum (Gas Natural) | A | Torre de vidrio espejo con un enorme cuerpo horizontal en voladizo a media altura y otr… | 86 m | modelo propio: gran voladizo horizontal; vidrio espejo | 13913, 13617 | alta | 10 volúmenes, 2 127 m² en total, hasta 60 m (+1 parte de OSM); clase 0 , 3 |
| Torres «la Caixa» (Diagonal) | A | Dos torres de oficinas gemelas en la Diagonal (Les Corts) | 86 m | modelo propio: dos prismas negros gemelos; muro cortina oscuro | 8537, 14130 | alta | 2 volúmenes, 1 704 m² en total, hasta 85 m (+2 partes de OSM); clase 3 , 0 |
| Disseny Hub | B | La «grapadora» | 45 m | arquetipo: volumen oscuro en voladizo | 13725, 15753 | alta | 4 volúmenes, 1 369 m² en total, hasta 33 m; clase 0 |
| Edifici Colón | B | Primer rascacielos de la ciudad, en Av. de les Drassanes | 110 m | arquetipo: prisma oscuro aislado | 12628, 12903 | alta | 1 volumen de 1 649 m² y 110 m (+4 partes de OSM); clase 0 |
| Edificis Trade | B | Cuatro torres de oficinas de Coderch con fachada de vidrio oscuro ondulada (planta de c… | 50 m | arquetipo: fachadas onduladas de vidrio oscuro | 8677, 13977 | alta | 4 volúmenes, 1 837 m² en total, hasta 39 m; clase 0 |
| Hotel Melià Sky | B | Torre de hotel en Poblenou | 120 m | arquetipo: torre con hueco en la parte alta | 14791, 16162 | alta | 3 volúmenes, 628 m² en total, hasta 116 m (+7 partes de OSM); clase 3 |
| Hotel Princess | B | Dos torres de distinta altura en Diagonal 1, de vidrio oscuro y paneles claros, unidas … | 105 m | arquetipo: dos torres escalonadas | 16358, 16802 | media | 2 volúmenes, 946 m² en total, hasta 97 m; clase 3 |
| Mercat dels Encants | B | Mercado al aire libre cubierto por una gran cubierta de espejo facetada a 25 m de altura. | 25 m | arquetipo: techo de espejo facetado | 13610, 15594 | alta | 1 volumen de 9 106 m² y 8 m; clase 1 |
| Pèrgola fotovoltaica del Fòrum | B | Placa fotovoltaica inclinada de 112 × 50 m sobre cuatro pilares de hormigón, junto al m… | 50 m | arquetipo: gran placa inclinada sobre pilares | 16978, 16785 | media | no existe: pérgola: no existe en los datos |
| Torre Diagonal ZeroZero | B | Prisma de vidrio en el arranque de la Diagonal, con celosía exterior de acero en rombos. | 110 m | arquetipo: prisma de vidrio con malla de rombos | 16453, 16798 | alta | 1 volumen de 1 128 m² y 110 m; clase 3 |
| Torre de les Aigües del Besòs | B | Torre industrial de ladrillo de 1882, cilíndrica, con depósito de agua arriba. | 60 m | arquetipo: torre de ladrillo cilíndrica | 15761, 16104 | alta | 1 volumen de 24 m² y 63 m (+2 partes de OSM); clase 4 |
| Torres de Diagonal Mar | B | Torres de viviendas de 20–25 plantas alrededor del Parc de Diagonal Mar | 85 m | arquetipo: torres residenciales claras | 16055, 16302 | media | 4 volúmenes, 2 597 m² en total, hasta 87 m (+2 partes de OSM); clase 0 , 3 |
| Tres Xemeneies del Besòs | B | Tres chimeneas de hormigón de 200 m de la antigua central térmica, en fila junto al mar… | 200 m | arquetipo: tres fustes de 200 m en fila | 17419, 18402 | media | no existe: las tres chimeneas de 200 m no existen en los datos (posición: poi del juego) |
| World Trade Center Barcelona | B | Conjunto en el muelle de Barcelona | 40 m | arquetipo: anillo en forma de barco | 13160, 12310 | alta | 1 volumen de 6 574 m² y 7 m (+6 partes de OSM); clase 0 |
| Torre Melina | C | Torre de hotel de vidrio en la Diagonal alta, de planta triangular. | 90 m | retoque del volumen: planta triangular de vidrio | 7056, 13427 | alta | 1 volumen de 578 m² y 65 m; clase 3 |
| Torre Urquinaona | C | Torre de oficinas gris en la Pl. Urquinaona. | 73 m | retoque del volumen: prisma gris | 12454, 14354 | alta | 1 volumen de 503 m² y 70 m (+2 partes de OSM); clase 3 |

## Lote d · Ciutat Vella, puerto y monumentos

| Nombre | Nivel | Qué es | Alto | Cómo se va a hacer | x, z | Pos. | Hoy en el juego |
|---|---|---|---|---|---|---|---|
| Arc de Triomf | A | Arco neomudéjar de ladrillo rojo en el eje del Pg. de Lluís Companys, con frisos escult… | 30 m | modelo propio: arco de ladrillo rojo | 13100, 14492 | alta | 3 volúmenes, 280 m² en total, hasta 29 m; clase 0 |
| Catedral de Barcelona | A | Catedral gótica con fachada neogótica al Pla de la Seu | 70 m | modelo propio: tres agujas caladas en la fachada; campanarios octogonales | 12751, 13711 | alta | 1 volumen de 3 034 m² y 80 m (+6 partes de OSM); clase 0 |
| Monument a Colom | A | Columna corintia de hierro fundido sobre pedestal octogonal escalonado con ocho leones … | 60 m | modelo propio: columna esbelta de 60 m; estatua arriba señalando al mar; pedestal con leones | 12844, 12802 | alta | 1 volumen de 611 m² y 53 m (+3 partes de OSM); clase 0 |
| Santa Maria del Mar | A | Basílica gótica catalana sobria y maciza | 40 m | modelo propio: dos campanarios octogonales; rosetón; volumen macizo de piedra | 13198, 13669 | alta | 11 volúmenes, 1 006 m² en total, hasta 42 m (+2 partes de OSM); clase 0 , 5 |
| Basílica de la Mercè | B | Basílica barroca con cúpula coronada por la gran estatua de la Mercè. | 70 m | arquetipo: cúpula con estatua | 12998, 13216 | baja | no existe con seguridad: La basílica no se distingue en los datos (manzana de volúmenes de 4–17 m, sin cúpula); el punto cae en #83401 (174 m², 17 m). Candidatos: #83401, #83404, #83405. |
| Cascada de la Ciutadella | B | Fuente monumental con arcos, grutas y escalinatas, coronada por una cuadriga dorada. | 30 m | arquetipo: cuadriga dorada; arcos | 13592, 14362 | alta | 2 volúmenes, 2 232 m² en total, hasta 28 m; clase 2 , 0 |
| Drassanes Reials | B | Atarazanas góticas | 18 m | arquetipo: naves paralelas a dos aguas | 12707, 12755 | alta | 14 volúmenes, 10 428 m² en total, hasta 11 m; clase 0 |
| Edifici de Correus | B | Edificio noucentista en Via Laietana / Pg. de Colom con cuatro torres de esquina remata… | 30 m | arquetipo: cuatro torres de esquina | 13139, 13445 | alta | 10 volúmenes, 1 055 m² en total, hasta 30 m (+1 parte de OSM); clase 0 |
| Edifici de la Duana | B | Aduana de 1902 en el puerto, junto a Colom | 30 m | arquetipo: cuatro torres con cúpulas | 12889, 12538 | media | 1 volumen de 1 535 m² y 11 m; clase 10 |
| El Born CCM (antic mercat) | B | Antiguo mercado de hierro (1876) | 25 m | arquetipo: nave de hierro con linterna | 13358, 13911 | alta | 1 volumen de 8 039 m² y 26 m (+18 partes de OSM); clase 0 |
| El Cap de Barcelona | B | Escultura de Roy Lichtenstein | 14 m | arquetipo: cabeza de cómic multicolor | 13101, 13335 | media | no existe: escultura; la coordenada de memoria cae dentro de un edificio (#83377): está unos 30–60 m más al mar, en la acera del Passeig de Colom |
| El Llapis (Cinc d'Oros) | B | Obelisco blanco muy fino en el cruce de Diagonal y Pg. de Gràcia (Monument a la Repúbli… | 33 m | arquetipo: obelisco blanco fino | 11336, 15006 | media | no existe: escultura: no existe en los datos (Cinc d'Oros, cruce Diagonal / Passeig de Gràcia) |
| Estació de França | B | Estación de 1929 | 30 m | arquetipo: dos naves curvas de hierro | 13566, 13709 | alta | 1 volumen de 25 568 m² y 30 m (+4 partes de OSM); clase 2 |
| L'Estel Ferit | B | Escultura de Rebecca Horn en la playa de la Barceloneta | 10 m | arquetipo: cubos apilados torcidos; óxido | 13941, 12837 | alta | no existe: escultura sobre la arena: no existe en los datos |
| MACBA | B | Museo blanco de Richard Meier en la Pl. dels Àngels | 30 m | arquetipo: blanco con rampa de vidrio | 11931, 13620 | alta | 1 volumen de 3 646 m² y 11 m; clase 2 |
| Mercat de Santa Caterina | B | Mercado con cubierta ondulada de cerámica de colores en hexágonos (verde, naranja, amar… | 20 m | arquetipo: cubierta ondulada multicolor | 12919, 13948 | alta | 1 volumen de 4 486 m² y 4 m; clase 0 |
| Mercat de la Boqueria | B | Mercado con portada modernista de hierro y vidrieras de colores a La Rambla; nave metál… | 15 m | arquetipo: portada de hierro y vidrieras | 12325, 13473 | alta | 3 volúmenes, 3 597 m² en total, hasta 11 m; clase 0 |
| Palau de la Generalitat i Casa de la Ciutat | B | Dos palacios enfrentados en la Pl. de Sant Jaume | 25 m | arquetipo: dos fachadas de piedra enfrentadas | 12786, 13550 | alta | 7 volúmenes, 3 493 m² en total, hasta 17 m (+2 partes de OSM); clase 0 |
| Parlament de Catalunya | B | Antiguo arsenal barroco en la Ciutadella | 20 m | arquetipo: palacio ocre con alas | 13788, 14168 | alta | 12 volúmenes, 4 832 m² en total, hasta 17 m (+3 partes de OSM); clase 0 |
| Rambla de Mar | B | Pasarela ondulada de madera sobre el Port Vell, con puente basculante, entre Colom y el… | 3 m | arquetipo: pasarela ondulada sobre el agua | 13114, 12717 | alta | no existe: pasarela: no existe en los datos |
| Santa Maria del Pi | B | Iglesia gótica de una nave con gran rosetón y un campanario octogonal macizo de 54 m. | 54 m | arquetipo: campanario octogonal macizo; rosetón | 12526, 13492 | alta | 2 volúmenes, 2 124 m² en total, hasta 54 m (+4 partes de OSM); clase 0 |
| Torre Jaume I | B | Torre de celosía de acero del teleférico del puerto, con plataforma y sala de máquinas … | 107 m | arquetipo: torre de celosía con plataforma | 13035, 12386 | alta | 1 volumen de 120 m² y 107 m (+6 partes de OSM); clase 0 |
| Torre Sant Sebastià | B | Torre de celosía de acero del teleférico del puerto en la Barceloneta, con restaurante … | 78 m | arquetipo: torre de celosía con cabina | 13680, 12502 | alta | 1 volumen de 37 m² y 78 m (+2 partes de OSM); clase 4 |

## Lote e · Collserola, zona alta, estaciones, L'Hospitalet y otros

| Nombre | Nivel | Qué es | Alto | Cómo se va a hacer | x, z | Pos. | Hoy en el juego |
|---|---|---|---|---|---|---|---|
| Hotel Porta Fira | A | Torre de Toyo Ito en la Pl. d'Europa | 113 m | modelo propio: torre roja retorcida; tubos verticales | 8441, 10543 | alta | 1 volumen de 1 066 m² y 113 m; clase 3 |
| Temple del Sagrat Cor | A | Templo en la cima del Tibidabo | 70 m | modelo propio: estatua dorada con brazos abiertos en lo alto; agujas neogóticas | 7959, 17988 | alta | 1 volumen de 2 775 m² y 68 m (+4 partes de OSM); clase 2 |
| Torre de Collserola | A | Torre de telecomunicaciones de Foster | 288 m | modelo propio: fuste fino atirantado; paquete de plataformas triangulares; mástil rojo y blanco | 7580, 17458 | alta | 1 volumen de 487 m² y 288 m (+17 partes de OSM); clase 13 (Torre de Collserola) |
| Aeroport (T1 i torre de control) | B | Terminal T1 | 40 m | arquetipo: nave larga con cubierta ondulada; torre de control | 4285, 3345 | alta | 1 volumen de 128 796 m² y 11 m (+2 partes de OSM); clase 10 |
| Ciutat de la Justícia | B | Conjunto de bloques de Chipperfield de colores pastel (ocre, rosa, verde, gris) de dist… | 70 m | arquetipo: bloques de colores pastel | 9049, 11552 | alta | 31 volúmenes, 9 085 m² en total, hasta 51 m (+12 partes de OSM); clase 2 , 0 |
| Dona i Ocell | B | Escultura de Miró de 22 m recubierta de trencadís (rojo, amarillo, verde, azul) sobre u… | 22 m | arquetipo: figura alargada de trencadís; estanque | 10272, 13051 | alta | no existe: escultura: no existe en los datos |
| Estació de Sants | B | Edificio de estación largo y bajo con la gran marquesina plana de la plaza (Països Cata… | 15 m | arquetipo: edificio largo y bajo; marquesina plana | 9701, 13205 | alta | 1 volumen de 20 265 m² y 43 m (+4 partes de OSM); clase 0 |
| Hesperia Tower | B | Torre de hotel de Rogers con cúpula de vidrio (restaurante) en voladizo en lo alto y nú… | 107 m | arquetipo: cúpula de vidrio arriba; núcleos rojos | 7019, 9558 | alta | 1 volumen de 744 m² y 105 m; clase 3 |
| Hotel Torre Catalunya | B | Torre de hotel de vidrio junto a la estación de Sants. | 115 m | arquetipo: prisma de vidrio | 9898, 13259 | alta | 3 volúmenes, 721 m² en total, hasta 100 m; clase 3 , 5 |
| L'Auditori | B | Bloque de hormigón gris de Moneo con fachada reticulada y un cubo de luz. | 25 m | arquetipo: bloque gris reticulado | 13518, 15309 | alta | 1 volumen de 7 468 m² y 17 m (+2 partes de OSM); clase 0 |
| Mistos | B | Escultura de Oldenburg | 20 m | arquetipo: cerillas gigantes | 10183, 18492 | baja | no existe: escultura: no existe en los datos; posición de memoria |
| Monestir de Pedralbes | B | Monasterio gótico | 35 m | arquetipo: campanario octogonal; claustro | 7375, 15056 | alta | 9 volúmenes, 7 568 m² en total, hasta 17 m; clase 0 , 2 |
| Observatori Fabra | B | Edificio modernista claro en la ladera de Collserola con la cúpula plateada del telesco… | 20 m | arquetipo: cúpula plateada | 8403, 17577 | alta | 1 volumen de 351 m² y 14 m (+1 parte de OSM); clase 0 |
| Palau Reial de Pedralbes | B | Palacio italianizante blanco y ocre en U, con jardín delante abierto a la Diagonal. | 20 m | arquetipo: palacio en U claro | 7777, 14250 | alta | 1 volumen de 2 985 m² y 11 m (+4 partes de OSM); clase 0 |
| Parc d'Atraccions del Tibidabo | B | Junto al templo | 30 m | arquetipo: noria de colores; Talaia | 8041, 17929 | alta | 5 volúmenes, 1 551 m² en total, hasta 9 m; clase 0 , 2 |
| Parc de l'Espanya Industrial (torres-far) | B | Diez torres-farola blancas tipo faro alineadas sobre las gradas escalonadas del parque. | 30 m | arquetipo: hilera de torres-faro blancas | 9754, 13094 | alta | 8 volúmenes, 294 m² en total, hasta 10 m; clase 4 |
| Pont de Bac de Roda | B | Puente blanco de Calatrava sobre las vías | 20 m | arquetipo: arcos blancos inclinados | 14108, 17278 | alta | no existe: puente: no existe en los datos |
| Teatre Nacional de Catalunya | B | Templo clásico moderno de Bofill | 25 m | arquetipo: columnata y frontón; caja de vidrio | 13530, 15482 | alta | 1 volumen de 5 837 m² y 20 m (+2 partes de OSM); clase 0 |
| Torre Realia BCN | B | Torre cilíndrica de vidrio claro junto al Hotel Porta Fira. | 110 m | arquetipo: cilindro de vidrio | 8412, 10609 | alta | 1 volumen de 1 288 m² y 112 m; clase 3 |
| Tres Xemeneies del Paral·lel | B | Tres chimeneas de ladrillo de 72 m de la antigua central eléctrica, en el parque del mi… | 72 m | arquetipo: tres chimeneas de ladrillo | 12277, 12622 | alta | 3 volúmenes, 135 m² en total, hasta 72 m; clase 4 |
| Búnquers del Carmel | C | Plataformas circulares de hormigón de la batería antiaérea en la cima del Turó de la Ro… | 3 m | retoque del volumen: plataformas circulares de hormigón | 11549, 17658 | media | no existe: ruinas a ras de suelo: no hay volumen |
| Fabra i Coats | C | Antigua fábrica textil de ladrillo con naves y chimenea. | 15 m | retoque del volumen: naves de ladrillo y chimenea | 13986, 19131 | alta | 5 volúmenes, 7 396 m² en total, hasta 14 m; clase 0 , 2 , 1 |

## Encaje en el mapa del juego (R2)

- Conversión lat/lon → mundo: el mundo es UTM huso 31N (ETRS89) trasladado: x = E -418400.7, z = N -4567997.6. Ajustada con 14 poi de `meta.json` (mínimos cuadrados): error cuadrático medio 11 m, máximo 24 m (los poi marcan el sitio a ojo; las torres caen a 1–10 m de su planta).
- Selección de edificios: el grupo que contiene el punto (raíz + partes de OSM apiladas), la torre más alta
  cercana, una lista explícita o un rectángulo (ver `SEL` en `tools/hitos/encaje.js`). Los índices son los de
  `BREC` en `app.js`.

### No están en los datos (se modelan desde cero en su coordenada)

- **Font Màgica**: fuente: no hay volumen en los datos
- **Les Quatre Columnes**: columnas: no existen en los datos
- **Peix d'Or (Peix de Frank Gehry)**: escultura sobre el zócalo del Hotel Arts; debajo hay el volumen bajo #102827 (2 878 m², 5 m)
- **Pèrgola fotovoltaica del Fòrum**: pérgola: no existe en los datos
- **Tres Xemeneies del Besòs**: las tres chimeneas de 200 m no existen en los datos (posición: poi del juego)
- **El Cap de Barcelona**: escultura; la coordenada de memoria cae dentro de un edificio (#83377): está unos 30–60 m más al mar, en la acera del Passeig de Colom
- **L'Estel Ferit**: escultura sobre la arena: no existe en los datos
- **El Llapis (Cinc d'Oros)**: escultura: no existe en los datos (Cinc d'Oros, cruce Diagonal / Passeig de Gràcia)
- **Rambla de Mar**: pasarela: no existe en los datos
- **Búnquers del Carmel**: ruinas a ras de suelo: no hay volumen
- **Mistos**: escultura: no existe en los datos; posición de memoria
- **Pont de Bac de Roda**: puente: no existe en los datos
- **Dona i Ocell**: escultura: no existe en los datos

### Posición corregida con la planta del juego (30 m o más)

- **Hotel Melià Sky**: 363 m
- **Torre Diagonal ZeroZero**: 340 m
- **Aeroport (T1 i torre de control)**: 338 m
- **Tres Xemeneies del Paral·lel**: 183 m
- **Hotel Princess**: 126 m
- **Parc de l'Espanya Industrial (torres-far)**: 71 m
- **Edifici de la Duana**: 54 m
- **Torre Melina**: 53 m
- **Torres «la Caixa» (Diagonal)**: 49 m
- **Teatre Nacional de Catalunya**: 45 m
- **Edifici Fòrum**: 43 m
- **El Born CCM (antic mercat)**: 36 m
- **CaixaForum (Casaramona)**: 35 m
- **Parc d'Atraccions del Tibidabo**: 35 m
- **Palau Nacional (MNAC)**: 33 m
- **MACBA**: 32 m
- **Sagrada Família**: 31 m
- **L'Auditori**: 31 m
- **Park Güell (zona monumental)**: 30 m
- **Piscina Municipal de Montjuïc**: 30 m

### Fuera del área con edificios

- ninguno: los 107 caen dentro del mapa y con edificios a menos de 300 m.

## Posiciones dudosas

- **Park Güell (zona monumental)** (media): 41.4136, 2.1528 — La coordenada es el centro del parque; la zona monumental está algo al S/SE (≈ 41.4135, 2.1530). Poi del juego «Park Güell». R2: la planta del juego está a 30 m de la coordenada lat/lon; x, z son los de la planta. R2: Recinto: se cuentan los pabellones y construcciones del núcleo monumental (sala hipóstila, entrada); el banco y la plaza no son volúmenes.
- **Col·legi de les Teresianes** (baja): 41.39977, 2.1332 — rot de memoria (baja).
- **Palaus d'Alfons XIII i Victòria Eugènia** (baja): 41.37009, 2.15244 — de memoria
- **Peix d'Or (Peix de Frank Gehry)** (media): 41.3863, 2.1965 — de memoria
- **Pèrgola fotovoltaica del Fòrum** (media): 41.412, 2.2268 — de memoria
- **Hotel Princess** (media): 41.411, 2.219 — Alto y planta de memoria (baja). R2: la planta del juego está a 126 m de la coordenada lat/lon; x, z son los de la planta. R2: Identificado por altura (97 y 78 m en los datos) junto a la Diagonal ZeroZero: dos torres; confirmar con vista.
- **Torres de Diagonal Mar** (media): 41.4075, 2.2155 — Grupo: R2 debe localizarlas por altura (> 60 m) en el registro alrededor del Parc de Diagonal Mar. R2: Grupo: torres de vivienda de 75–87 m alrededor del Parc de Diagonal Mar; ancho/largo de cada torre, del catálogo.
- **Tres Xemeneies del Besòs** (media): 41.4266, 2.2319 — Poi del juego «Tres Xemeneies del Besòs» (posición fiable; lat/lon sacadas de ese poi con un ajuste provisional, la de memoria se iba 680 m al S). Fuera del término de Barcelona (Sant Adrià).
- **Basílica de la Mercè** (baja): 41.37952, 2.17958 — Alto de memoria (baja).
- **Edifici de la Duana** (media): 41.373, 2.178 — R2: la planta del juego está a 54 m de la coordenada lat/lon; x, z son los de la planta. R2: Volumen bajo de 1 535 m² (11 m) a 54 m de la coordenada de memoria: es lo único que encaja; confirmar con vista.
- **El Cap de Barcelona** (media): 41.3806, 2.1808 — de memoria
- **El Llapis (Cinc d'Oros)** (media): 41.3955, 2.1595 — Alto de memoria (baja).
- **Búnquers del Carmel** (media): 41.4194, 2.16174 — Poi del juego «Turó de la Rovira».
- **Mistos** (baja): 41.4268, 2.1453 — Posición de memoria (baja).

## Descartados de la lista semilla

- Hospital Clínic, Hospital de la Vall d'Hebron, CosmoCaixa: volúmenes sin rasgo que se reconozca desde lejos.
- Liceu, Palau de Mar, Maremagnum, Aquàrium, Monument a Macià, Torre Banc Sabadell: poco reconocibles o tapados;
  si sobra presupuesto, pueden entrar como nivel C.
- Grues del port, Torre Baró: muchos elementos o ruina sin silueta clara.
- Far de Montjuïc: dudoso y casi invisible entre los árboles.

## Añadidos

- Mercat de Sant Antoni, Casa Calvet, Castell dels Tres Dragons (pasa al lote a), Piscina de Montjuïc,
  Torres de Diagonal Mar (el usuario pidió «los edificios de Diagonal Mar»), Rambla de Mar.
