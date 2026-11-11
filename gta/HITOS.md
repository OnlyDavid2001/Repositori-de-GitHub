# Hitos de Barcelona — catálogo

Listado de los edificios y monumentos singulares que el juego modelará aparte (encargo de hitos, etapa R1).
Versión para máquinas: `data/hitos_catalogo.json` (mismas fichas, completas). Se genera con
`python3 tools/hitos/catalogo.py`: para cambiar algo, edita ese script y vuelve a ejecutarlo.

**Niveles**: A = modelo propio cuidado (icono) · B = arquetipo con parámetros · C = retoque del volumen que ya
existe (color, estilo, altura). **Alto** en metros reales. **Pos.** = confianza de la posición (alta: coordenada
de Wikipedia/Wikidata; media: redondeada o de memoria en sitio aislado; baja: de memoria, a revisar).
La columna «Hoy en el juego» la rellena la etapa R2 (encaje con el registro de edificios); hasta entonces dice
«(R2)» o lo que ya se sabe por `data/meta.json`.

| Lote | Tema | A | B | C | Total |
|---|---|---|---|---|---|
| a | Gaudí y modernismo | 5 | 12 | 3 | 20 |
| b | Deporte y Montjuïc | 7 | 9 | 4 | 20 |
| c | Torres y frente marítimo | 8 | 12 | 2 | 22 |
| d | Ciutat Vella, puerto y monumentos | 4 | 19 | 0 | 23 |
| e | Collserola, zona alta, estaciones, L'Hospitalet y otros | 3 | 17 | 2 | 22 |
| | **Total** | 27 | 69 | 11 | **107** |

## Lote a · Gaudí y modernismo

| Nombre | Nivel | Qué es | Alto | Cómo se va a hacer | Pos. | Hoy en el juego |
|---|---|---|---|---|---|---|
| Casa Batlló | A | Casa entre medianeras en Pg. de Gràcia 43 (lado SO, mira al NE) | 32 m | modelo propio: lomo de dragón de escamas en la cubierta; fachada azul-verde brillante; balcones-máscara y columnas-hueso | alta | (R2) |
| Casa Milà (La Pedrera) | A | Bloque de esquina en el chaflán Pg. de Gràcia / Provença; fachada continua y ondulada d… | 34 m | modelo propio: fachada ondulada como olas de piedra; balcones de hierro negro enmarañado; chimeneas-guerrero en la azotea | alta | (R2) |
| Park Güell (zona monumental) | A | Conjunto en ladera | 20 m | modelo propio: pabellones de cuento con tejados de «nata»; banco ondulado multicolor al borde de la plaza; columnata dórica bajo la plaza; dragón en la escalinata | media | (R2) Poi del juego «Park Güell» |
| Recinte Modernista de Sant Pau | A | Ciudad-hospital al final de la Av. Gaudí, girada 45° respecto al Eixample (ejes N-S) | 50 m | modelo propio: torre central del pabellón de entrada; cúpulas de cerámica verde y amarilla; ladrillo rojo | alta | (R2) Poi del juego «Hospital de Sant Pau» (≈ 150 m al S de esta coordenada: será la entrada) |
| Sagrada Família | A | Templo ACABADO en cruz latina (nave de 5 naves, crucero de 60 m, ábside al NO sobre Pro… | 172,5 m | modelo propio: torre central de 172,5 m rematada por una cruz de cuatro brazos; torres de apóstoles de pan de azúcar con pináculos de trencadís; evangelistas con su símbolo y María con la estrella; silueta escalonada de agujas, piedra ocre | alta | (R2) Hoy el juego tiene 19 agujas OSM + naves simplificadas (meta.stats) |
| Casa Amatller | B | Casa entre medianeras junto a la Batlló, con hastial escalonado de estilo flamenco que … | 28 m | arquetipo: hastial escalonado; fachada rosada con esgrafiados | alta | (R2) |
| Casa Vicens | B | Casa de aire mudéjar en Gràcia | 20 m | arquetipo: ajedrezado de azulejo verde y blanco; torrecillas de esquina | alta | (R2) |
| Casa de les Punxes | B | Edificio-castillo de ladrillo rojo que ocupa una manzana triangular entre Diagonal y Ro… | 40 m | arquetipo: seis torres con agujas cónicas; ladrillo rojo y piedra | alta | (R2) |
| Castell dels Tres Dragons | B | Edificio-castillo de ladrillo rojo visto en el Parc de la Ciutadella, con almenas, cuat… | 25 m | arquetipo: ladrillo rojo con almenas; torretas angulares | alta | (R2) |
| Col·legi de les Teresianes | B | Colegio de Gaudí | 25 m | arquetipo: bloque alargado de ladrillo; almenas puntiagudas | alta | (R2) |
| Mercat de Sant Antoni | B | Mercado de hierro que ocupa una manzana del Eixample, con planta en cruz de San Andrés … | 20 m | arquetipo: planta en aspa; linterna central; cubiertas grises de dos aguas | alta | (R2) |
| Palau Güell | B | Palacio entre medianeras en Nou de la Rambla | 30 m | arquetipo: dos arcos parabólicos; chimeneas de colores y aguja central | alta | (R2) |
| Palau de la Música Catalana | B | Edificio de ladrillo visto rojo en una esquina estrecha de Sant Pere més alt; columnas … | 25 m | arquetipo: ladrillo rojo con mosaicos de flores; esquina con grupo escultórico | alta | (R2) |
| Pavellons Güell | B | Portería y caballerizas de la finca Güell en Pedralbes | 12 m | arquetipo: verja del dragón; cupulines con trencadís | alta | (R2) |
| Plaça de toros Monumental | B | Coso circular neomudéjar de ladrillo con arcos, torres en las entradas rematadas por cú… | 25 m | arquetipo: anillo de ladrillo; cúpulas-huevo de cerámica blanca y azul | media | (R2) |
| Torre Bellesguard | B | Casa-castillo neogótica en la falda de Collserola | 30 m | arquetipo: aguja con cruz de cuatro brazos; volumen cúbico gris | alta | (R2) |
| Universitat de Barcelona (edifici històric) | B | Edificio neorrománico simétrico frente a Gran Via (entre Balmes y Aribau) | 30 m | arquetipo: fachada simétrica con dos torres; piedra ocre | alta | (R2) |
| Casa Calvet | C | Casa entre medianeras en Casp | 25 m | retoque del volumen: remates curvos; piedra clara | alta | (R2) |
| Casa Lleó i Morera | C | Casa de esquina Pg. de Gràcia / Consell de Cent, piedra clara con mucha escultura y una… | 30 m | retoque del volumen: templete de esquina; piedra clara muy ornamentada | alta | (R2) |
| Fundació Antoni Tàpies | C | Edificio de ladrillo rojo entre medianeras en Aragó, coronado por la escultura de tubos… | 20 m | retoque del volumen: nube de tubos metálicos en la azotea | alta | (R2) |

## Lote b · Deporte y Montjuïc

| Nombre | Nivel | Qué es | Alto | Cómo se va a hacer | Pos. | Hoy en el juego |
|---|---|---|---|---|---|---|
| Camp Nou | A | Estadio REMODELADO y ACABADO | 60 m | modelo propio: óvalo de terrazas horizontales blancas; anillo de cubierta sobre las gradas; gradas azul y granate; césped | alta | (R2) |
| Castell de Montjuïc | A | Fortaleza abaluartada del s. XVIII en la cima | 25 m | modelo propio: planta en estrella con baluartes; foso; torre de vigía | alta | (R2) Poi del juego «Castell de Montjuïc» |
| Estadi Olímpic Lluís Companys | A | Estadio neoclásico de 1929 en Montjuïc | 30 m | modelo propio: fachada ocre con arcadas; marquesina blanca de la tribuna; pista roja | alta | (R2) Poi del juego «Estadi Olímpic» |
| Las Arenas | A | Antigua plaza de toros convertida en centro comercial | 35 m | modelo propio: anillo neomudéjar de ladrillo; arcos de herradura; cubierta-mirador | media | (R2) |
| Palau Nacional (MNAC) | A | Palacio de 1929 que preside Montjuïc mirando a la Pl. d'Espanya (al NNO) | 50 m | modelo propio: cúpula central; cuatro torres de esquina; escalinatas y cascadas | alta | (R2) Poi del juego «Palau Nacional (MNAC)» |
| Palau Sant Jordi | A | Pabellón de Isozaki | 45 m | modelo propio: cúpula rebajada gris metálica; zócalo macizo | alta | (R2) |
| Torre de Calatrava (Torre de Comunicacions de Montjuïc) | A | Torre blanca de Calatrava | 136 m | modelo propio: fuste blanco inclinado; anillo semicircular; base de trencadís | alta | (R2) |
| CaixaForum (Casaramona) | B | Antigua fábrica modernista de ladrillo rojo | 30 m | arquetipo: dos torres de aguja; naves almenadas de ladrillo | alta | (R2) |
| Font Màgica | B | Vaso oval escalonado de piedra a los pies del Palau Nacional; de noche, chorros de agua… | 3 m | arquetipo: vaso oval escalonado; chorros de colores de noche | alta | (R2) |
| Fundació Joan Miró | B | Edificio blanco de Sert | 12 m | arquetipo: blanco puro; lucernarios curvos | alta | (R2) |
| Les Quatre Columnes | B | Cuatro columnas jónicas exentas de piedra, en fila, en el eje de la Av. Reina Maria Cri… | 20 m | arquetipo: cuatro columnas jónicas en fila | alta | (R2) |
| Palaus d'Alfons XIII i Victòria Eugènia | B | Dos palacios gemelos de exposición a ambos lados de la Av. Reina Maria Cristina | 30 m | arquetipo: pareja de palacios simétricos; torretas de esquina | alta | (R2) |
| Pavelló Mies van der Rohe | B | Pabellón de 1929 | 4 m | arquetipo: losa fina flotante; estanques | alta | (R2) |
| Poble Espanyol (Torres d'Àvila) | B | Recinto amurallado; lo reconocible es la puerta de entrada copia de las murallas de Ávila | 24 m | arquetipo: dos torres almenadas de muralla | alta | (R2) |
| Torres Venecianes | B | Dos campanarios de ladrillo rojo a la entrada de la Av. Reina Maria Cristina (Pl. d'Esp… | 47 m | arquetipo: pareja de campanarios rojos; aguja piramidal | alta | (R2) |
| Velòdrom d'Horta | B | Velódromo de hormigón | 12 m | arquetipo: óvalo de pista peraltada | alta | (R2) |
| Palau Blaugrana | C | Pabellón deportivo junto al Camp Nou | 25 m | retoque del volumen: caja ancha baja | alta | (R2) |
| Piscina Municipal de Montjuïc | C | Piscina de saltos con gradas mirando la ciudad. | 15 m | retoque del volumen: plataforma de saltos | alta | (R2) |
| Piscines Bernat Picornell | C | Piscinas olímpicas | 15 m | retoque del volumen: caja baja con gradas | alta | (R2) |
| Teatre Grec | C | Teatro al aire libre en una antigua cantera | 10 m | retoque del volumen: gradas semicirculares | alta | (R2) |

## Lote c · Torres y frente marítimo

| Nombre | Nivel | Qué es | Alto | Cómo se va a hacer | Pos. | Hoy en el juego |
|---|---|---|---|---|---|---|
| Edifici Fòrum | A | Gran triángulo equilátero de 180 m de lado elevado sobre pilotes; fachada azul ultramar… | 25 m | modelo propio: triángulo azul flotante | alta | (R2) |
| Hotel Arts | A | Torre de planta cuadrada junto al Port Olímpic con un exoesqueleto de acero blanco en r… | 154 m | modelo propio: exoesqueleto blanco reticulado; vidrio oscuro detrás | alta | (R2) |
| Hotel W (Hotel Vela) | A | Torre en forma de vela al final de la Barceloneta | 99 m | modelo propio: silueta de vela; vidrio espejo azul | alta | (R2) |
| Peix d'Or (Peix de Frank Gehry) | A | Escultura de un pez de 56 m hecha de lamas de acero dorado sobre una pérgola, al pie de… | 35 m | modelo propio: silueta de pez; malla dorada | media | (R2) |
| Torre Glòries | A | Bala de planta elíptica que se afila arriba en cúpula; piel de lamas de vidrio sobre ch… | 144 m | modelo propio: silueta de bala; degradado rojo-azul; de noche, LED de colores | alta | (R2) |
| Torre Mapfre | A | Gemela del Hotel Arts al otro lado del puerto | 154 m | modelo propio: prisma de vidrio verdoso con bandas; pareja con el Hotel Arts | alta | (R2) |
| Torre Mare Nostrum (Gas Natural) | A | Torre de vidrio espejo con un enorme cuerpo horizontal en voladizo a media altura y otr… | 86 m | modelo propio: gran voladizo horizontal; vidrio espejo | alta | (R2) |
| Torres «la Caixa» (Diagonal) | A | Dos torres de oficinas gemelas en la Diagonal (Les Corts) | 86 m | modelo propio: dos prismas negros gemelos; muro cortina oscuro | alta | (R2) |
| Disseny Hub | B | La «grapadora» | 45 m | arquetipo: volumen oscuro en voladizo | alta | (R2) |
| Edifici Colón | B | Primer rascacielos de la ciudad, en Av. de les Drassanes | 110 m | arquetipo: prisma oscuro aislado | alta | (R2) |
| Edificis Trade | B | Cuatro torres de oficinas de Coderch con fachada de vidrio oscuro ondulada (planta de c… | 50 m | arquetipo: fachadas onduladas de vidrio oscuro | alta | (R2) |
| Hotel Melià Sky | B | Torre de hotel en Poblenou | 120 m | arquetipo: torre con hueco en la parte alta | media | (R2) |
| Hotel Princess | B | Dos torres de distinta altura en Diagonal 1, de vidrio oscuro y paneles claros, unidas … | 105 m | arquetipo: dos torres escalonadas | baja | (R2) |
| Mercat dels Encants | B | Mercado al aire libre cubierto por una gran cubierta de espejo facetada a 25 m de altura. | 25 m | arquetipo: techo de espejo facetado | alta | (R2) |
| Pèrgola fotovoltaica del Fòrum | B | Placa fotovoltaica inclinada de 112 × 50 m sobre cuatro pilares de hormigón, junto al m… | 50 m | arquetipo: gran placa inclinada sobre pilares | media | (R2) |
| Torre Diagonal ZeroZero | B | Prisma de vidrio en el arranque de la Diagonal, con celosía exterior de acero en rombos. | 110 m | arquetipo: prisma de vidrio con malla de rombos | media | (R2) |
| Torre de les Aigües del Besòs | B | Torre industrial de ladrillo de 1882, cilíndrica, con depósito de agua arriba. | 60 m | arquetipo: torre de ladrillo cilíndrica | alta | (R2) |
| Torres de Diagonal Mar | B | Torres de viviendas de 20–25 plantas alrededor del Parc de Diagonal Mar | 85 m | arquetipo: torres residenciales claras | baja | (R2) |
| Tres Xemeneies del Besòs | B | Tres chimeneas de hormigón de 200 m de la antigua central térmica, en fila junto al mar… | 200 m | arquetipo: tres fustes de 200 m en fila | media | (R2) Poi del juego «Tres Xemeneies del Besòs» (posición fiable; lat/lon sacadas de ese poi con un ajuste provisional, la de memoria se iba 680 m al S) |
| World Trade Center Barcelona | B | Conjunto en el muelle de Barcelona | 40 m | arquetipo: anillo en forma de barco | alta | (R2) |
| Torre Melina | C | Torre de hotel de vidrio en la Diagonal alta, de planta triangular. | 90 m | retoque del volumen: planta triangular de vidrio | alta | (R2) |
| Torre Urquinaona | C | Torre de oficinas gris en la Pl. Urquinaona. | 73 m | retoque del volumen: prisma gris | alta | (R2) |

## Lote d · Ciutat Vella, puerto y monumentos

| Nombre | Nivel | Qué es | Alto | Cómo se va a hacer | Pos. | Hoy en el juego |
|---|---|---|---|---|---|---|
| Arc de Triomf | A | Arco neomudéjar de ladrillo rojo en el eje del Pg. de Lluís Companys, con frisos escult… | 30 m | modelo propio: arco de ladrillo rojo | alta | (R2) Poi del juego «Arc de Triomf» |
| Catedral de Barcelona | A | Catedral gótica con fachada neogótica al Pla de la Seu | 70 m | modelo propio: tres agujas caladas en la fachada; campanarios octogonales | alta | (R2) Poi del juego «Catedral» |
| Monument a Colom | A | Columna corintia de hierro fundido sobre pedestal octogonal escalonado con ocho leones … | 60 m | modelo propio: columna esbelta de 60 m; estatua arriba señalando al mar; pedestal con leones | alta | (R2) Hoy NO existe en el juego (lo dice comun.md) |
| Santa Maria del Mar | A | Basílica gótica catalana sobria y maciza | 40 m | modelo propio: dos campanarios octogonales; rosetón; volumen macizo de piedra | alta | (R2) |
| Basílica de la Mercè | B | Basílica barroca con cúpula coronada por la gran estatua de la Mercè. | 70 m | arquetipo: cúpula con estatua | alta | (R2) |
| Cascada de la Ciutadella | B | Fuente monumental con arcos, grutas y escalinatas, coronada por una cuadriga dorada. | 30 m | arquetipo: cuadriga dorada; arcos | alta | (R2) |
| Drassanes Reials | B | Atarazanas góticas | 18 m | arquetipo: naves paralelas a dos aguas | alta | (R2) |
| Edifici de Correus | B | Edificio noucentista en Via Laietana / Pg. de Colom con cuatro torres de esquina remata… | 30 m | arquetipo: cuatro torres de esquina | alta | (R2) |
| Edifici de la Duana | B | Aduana de 1902 en el puerto, junto a Colom | 30 m | arquetipo: cuatro torres con cúpulas | media | (R2) |
| El Born CCM (antic mercat) | B | Antiguo mercado de hierro (1876) | 25 m | arquetipo: nave de hierro con linterna | media | (R2) |
| El Cap de Barcelona | B | Escultura de Roy Lichtenstein | 14 m | arquetipo: cabeza de cómic multicolor | media | (R2) |
| El Llapis (Cinc d'Oros) | B | Obelisco blanco muy fino en el cruce de Diagonal y Pg. de Gràcia (Monument a la Repúbli… | 33 m | arquetipo: obelisco blanco fino | media | (R2) |
| Estació de França | B | Estación de 1929 | 30 m | arquetipo: dos naves curvas de hierro | media | (R2) |
| L'Estel Ferit | B | Escultura de Rebecca Horn en la playa de la Barceloneta | 10 m | arquetipo: cubos apilados torcidos; óxido | alta | (R2) |
| MACBA | B | Museo blanco de Richard Meier en la Pl. dels Àngels | 30 m | arquetipo: blanco con rampa de vidrio | alta | (R2) |
| Mercat de Santa Caterina | B | Mercado con cubierta ondulada de cerámica de colores en hexágonos (verde, naranja, amar… | 20 m | arquetipo: cubierta ondulada multicolor | alta | (R2) |
| Mercat de la Boqueria | B | Mercado con portada modernista de hierro y vidrieras de colores a La Rambla; nave metál… | 15 m | arquetipo: portada de hierro y vidrieras | alta | (R2) |
| Palau de la Generalitat i Casa de la Ciutat | B | Dos palacios enfrentados en la Pl. de Sant Jaume | 25 m | arquetipo: dos fachadas de piedra enfrentadas | alta | (R2) |
| Parlament de Catalunya | B | Antiguo arsenal barroco en la Ciutadella | 20 m | arquetipo: palacio ocre con alas | alta | (R2) |
| Rambla de Mar | B | Pasarela ondulada de madera sobre el Port Vell, con puente basculante, entre Colom y el… | 3 m | arquetipo: pasarela ondulada sobre el agua | alta | (R2) |
| Santa Maria del Pi | B | Iglesia gótica de una nave con gran rosetón y un campanario octogonal macizo de 54 m. | 54 m | arquetipo: campanario octogonal macizo; rosetón | alta | (R2) |
| Torre Jaume I | B | Torre de celosía de acero del teleférico del puerto, con plataforma y sala de máquinas … | 107 m | arquetipo: torre de celosía con plataforma | alta | (R2) |
| Torre Sant Sebastià | B | Torre de celosía de acero del teleférico del puerto en la Barceloneta, con restaurante … | 78 m | arquetipo: torre de celosía con cabina | alta | (R2) |

## Lote e · Collserola, zona alta, estaciones, L'Hospitalet y otros

| Nombre | Nivel | Qué es | Alto | Cómo se va a hacer | Pos. | Hoy en el juego |
|---|---|---|---|---|---|---|
| Hotel Porta Fira | A | Torre de Toyo Ito en la Pl. d'Europa | 113 m | modelo propio: torre roja retorcida; tubos verticales | alta | (R2) |
| Temple del Sagrat Cor | A | Templo en la cima del Tibidabo | 70 m | modelo propio: estatua dorada con brazos abiertos en lo alto; agujas neogóticas | alta | (R2) |
| Torre de Collserola | A | Torre de telecomunicaciones de Foster | 288 m | modelo propio: fuste fino atirantado; paquete de plataformas triangulares; mástil rojo y blanco | alta | (R2) |
| Aeroport (T1 i torre de control) | B | Terminal T1 | 40 m | arquetipo: nave larga con cubierta ondulada; torre de control | media | (R2) Poi del juego «Aeroport · Terminal 1» |
| Ciutat de la Justícia | B | Conjunto de bloques de Chipperfield de colores pastel (ocre, rosa, verde, gris) de dist… | 70 m | arquetipo: bloques de colores pastel | alta | (R2) |
| Dona i Ocell | B | Escultura de Miró de 22 m recubierta de trencadís (rojo, amarillo, verde, azul) sobre u… | 22 m | arquetipo: figura alargada de trencadís; estanque | alta | (R2) |
| Estació de Sants | B | Edificio de estación largo y bajo con la gran marquesina plana de la plaza (Països Cata… | 15 m | arquetipo: edificio largo y bajo; marquesina plana | media | (R2) Poi del juego «Estació de Sants» |
| Hesperia Tower | B | Torre de hotel de Rogers con cúpula de vidrio (restaurante) en voladizo en lo alto y nú… | 107 m | arquetipo: cúpula de vidrio arriba; núcleos rojos | alta | (R2) |
| Hotel Torre Catalunya | B | Torre de hotel de vidrio junto a la estación de Sants. | 115 m | arquetipo: prisma de vidrio | alta | (R2) |
| L'Auditori | B | Bloque de hormigón gris de Moneo con fachada reticulada y un cubo de luz. | 25 m | arquetipo: bloque gris reticulado | alta | (R2) |
| Mistos | B | Escultura de Oldenburg | 20 m | arquetipo: cerillas gigantes | baja | (R2) |
| Monestir de Pedralbes | B | Monasterio gótico | 35 m | arquetipo: campanario octogonal; claustro | alta | (R2) |
| Observatori Fabra | B | Edificio modernista claro en la ladera de Collserola con la cúpula plateada del telesco… | 20 m | arquetipo: cúpula plateada | alta | (R2) |
| Palau Reial de Pedralbes | B | Palacio italianizante blanco y ocre en U, con jardín delante abierto a la Diagonal. | 20 m | arquetipo: palacio en U claro | alta | (R2) |
| Parc d'Atraccions del Tibidabo | B | Junto al templo | 30 m | arquetipo: noria de colores; Talaia | alta | (R2) |
| Parc de l'Espanya Industrial (torres-far) | B | Diez torres-farola blancas tipo faro alineadas sobre las gradas escalonadas del parque. | 30 m | arquetipo: hilera de torres-faro blancas | alta | (R2) |
| Pont de Bac de Roda | B | Puente blanco de Calatrava sobre las vías | 20 m | arquetipo: arcos blancos inclinados | alta | (R2) |
| Teatre Nacional de Catalunya | B | Templo clásico moderno de Bofill | 25 m | arquetipo: columnata y frontón; caja de vidrio | alta | (R2) |
| Torre Realia BCN | B | Torre cilíndrica de vidrio claro junto al Hotel Porta Fira. | 110 m | arquetipo: cilindro de vidrio | alta | (R2) |
| Tres Xemeneies del Paral·lel | B | Tres chimeneas de ladrillo de 72 m de la antigua central eléctrica, en el parque del mi… | 72 m | arquetipo: tres chimeneas de ladrillo | media | (R2) |
| Búnquers del Carmel | C | Plataformas circulares de hormigón de la batería antiaérea en la cima del Turó de la Ro… | 3 m | retoque del volumen: plataformas circulares de hormigón | media | (R2) Poi del juego «Turó de la Rovira» |
| Fabra i Coats | C | Antigua fábrica textil de ladrillo con naves y chimenea. | 15 m | retoque del volumen: naves de ladrillo y chimenea | alta | (R2) |

## Posiciones dudosas (para R2)

- **Park Güell (zona monumental)** (media): 41.4136, 2.1528 — La coordenada es el centro del parque; la zona monumental está algo al S/SE (≈ 41.4135, 2.1530). Poi del juego «Park Güell».
- **Plaça de toros Monumental** (media): 41.4, 2.1811 — Coordenada redondeada en la fuente; está en Gran Via / Marina.
- **Las Arenas** (media): 41.3763, 2.149 — de memoria
- **Peix d'Or (Peix de Frank Gehry)** (media): 41.3863, 2.1965 — de memoria
- **Pèrgola fotovoltaica del Fòrum** (media): 41.412, 2.2268 — de memoria
- **Torre Diagonal ZeroZero** (media): 41.4103, 2.2172 — de memoria
- **Hotel Princess** (baja): 41.411, 2.219 — Alto y planta de memoria (baja).
- **Torres de Diagonal Mar** (baja): 41.4075, 2.2155 — Grupo: R2 debe localizarlas por altura (> 60 m) en el registro alrededor del Parc de Diagonal Mar.
- **Hotel Melià Sky** (media): 41.404, 2.1975 — de memoria
- **Tres Xemeneies del Besòs** (media): 41.4266, 2.2319 — Poi del juego «Tres Xemeneies del Besòs» (posición fiable; lat/lon sacadas de ese poi con un ajuste provisional, la de memoria se iba 680 m al S). Fuera del término de Barcelona (Sant Adrià).
- **Estació de França** (media): 41.384, 2.186 — Coordenada redondeada en la fuente.
- **El Born CCM (antic mercat)** (media): 41.3855, 2.1837 — de memoria
- **Edifici de la Duana** (media): 41.373, 2.178 — de memoria
- **El Cap de Barcelona** (media): 41.3806, 2.1808 — de memoria
- **El Llapis (Cinc d'Oros)** (media): 41.3955, 2.1595 — Alto de memoria (baja).
- **Búnquers del Carmel** (media): 41.4194, 2.16174 — Poi del juego «Turó de la Rovira».
- **Estació de Sants** (media): 41.3789, 2.14 — Poi del juego «Estació de Sants».
- **Mistos** (baja): 41.4268, 2.1453 — Posición de memoria (baja).
- **Aeroport (T1 i torre de control)** (media): 41.2884, 2.0731 — Poi del juego «Aeroport · Terminal 1». Posición de la torre de control: R2 (baja).
- **Tres Xemeneies del Paral·lel** (media): 41.3735, 2.169 — de memoria

## Descartados de la lista semilla

- Hospital Clínic, Hospital de la Vall d'Hebron, CosmoCaixa: volúmenes sin rasgo que se reconozca desde lejos.
- Liceu, Palau de Mar, Maremagnum, Aquàrium, Monument a Macià, Torre Banc Sabadell: poco reconocibles o tapados;
  si sobra presupuesto, pueden entrar como nivel C.
- Grues del port, Torre Baró: muchos elementos o ruina sin silueta clara.
- Far de Montjuïc: dudoso y casi invisible entre los árboles.

## Añadidos

- Mercat de Sant Antoni, Casa Calvet, Castell dels Tres Dragons (pasa al lote a), Piscina de Montjuïc,
  Torres de Diagonal Mar (el usuario pidió «los edificios de Diagonal Mar»), Rambla de Mar.
