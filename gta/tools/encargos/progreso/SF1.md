# SF1 · Volumen, planta y las 18 torres (carril BASÍLICA)

Estado: **hecha** (primera pasada completa; lo flojo, abajo). Código: `gta/sagrada.js` (nuevo, ≈38 kB), cargado en
`index.html` después de `landmarks_e.js`. En `landmarks_a.js` solo se ha añadido una línea al comentario de la ficha: su
constructor queda de reserva.

## Qué hace `sagrada.js`
- Lee `data/sf_ref.json` (la carga de los hitos lo espera, como `aeropuerto.js`). Si falta el JSON, usa los mismos valores
  escritos en el código (`ref()`) y avisa una vez.
- Sustituye el `build` de la ficha `sagrada_familia` (mismo id, centro, giro y edificios ocultos) y añade dos fichas sin
  etiqueta ni sombra en el mismo sitio. Las tres usan un único constructor, `construir(B, h, L, q)`:
  | ficha | q | cuándo se ve | triángulos |
  | --- | --- | --- | --- |
  | `sagrada_familia` | 1 | de 0 a 1500 m | 31 165 |
  | `sagrada_familia_lluny` | 0 | a más de 1500 m (es un `addLODLevel(1500, malla)` de la principal: nunca se dibujan las dos) | 7 692 |
  | `sagrada_familia_detall` | 2 | a menos de 350 m (`addLODLevel(350, null)`), superpuesta a la principal | 44 640 |
- Mide lo que dibuja: `BCN.lm.stats().sf = { d, tris }` (distancia de la cámara y triángulos de la basílica que se
  dibujan). Lo imprime el arnés en cada vista.
- Se modela con y = 0 en el suelo del templo (la cota bajo el ábside, del lado de Provença). Al final todo se sube con
  `xf`. El basamento baja hasta la cota más baja de la planta menos 1,5 m.

## Qué hay modelado (SF1)
- **Planta** (módulo de 7,5 m, eje x −2,5 y crucero z −20,5, de `sf_ref.json`): claustro perimetral = contorno OSM
  extruido hasta 11,5 m con pretil; 5 naves (laterales con cornisa a 33 m, central a 48 m y cubierta a dos aguas hasta
  ~60 m); crucero de 3 naves entre los testeros; ábside con presbiterio hasta 63 m, cubierta cónica, girola semicircular
  a 33 m y 7 capillas con hastial y aguja con espigas; cimborrio octogonal hasta 64 m.
- **Ventanales** apuntados como huecos oscuros, con alféizar: naves laterales (13 → 30 m), claristorio (35 → 46,5 m),
  testeros del crucero, presbiterio y muro de la Glòria. Contrafuertes en las naves laterales. Pináculos con frutas de
  colores en la cornisa de la nave central y del crucero. Linternas cónicas sobre las naves laterales.
- **Torres** (las 18, con las posiciones y alturas de `sf_ref.json`):
  - 12 apóstoles: fuste cuadrado hasta la fachada (30 m; 40 en la Glòria) y después un paraboloide r = √(a·(Hv − y)) de
    r 3,8 a 2,55 m a 0,76·H. Huecos en espiral: paños oscuros en la malla media; en la de detalle, además, jambas,
    dintel, alféizar y lama inclinada. Pináculo de mosaico (bolas blancas, cuerpo oro, rojo y amarillo, mitra aplanada
    hacia la calle con la hostia blanca), cruz con bolas, anillo-báculo, collar «Hosanna Excelsis» y estatua sentada a
    2/3 de altura mirando a la calle (las tres últimas, solo en la de detalle). Piedra del Naixement más oscura.
  - 4 evangelistas (135 m): 8 caras parabólicas desde 40 m, huecos, escudos hexagonales, icosaedro dorado con bultos,
    figura blanca con alas. No se distingue cuál es cada símbolo (ángel, león, buey, águila): son la misma figura.
  - Mare de Déu (138 m): 12 paraboloides que se cortan (superficie lobulada), huecos, corona con almenas, pináculo, tres
    brazos y la estrella de 12 puntas (dodecaedro con pirámides) de 7,5 m con centro a 135 m, en `EMISIVO` solo de noche.
  - Jesucrist (172,5 m): 12 caras de 9,4 a 4,3 m hasta 142,5 m, con 12 huecos por anillo; tramo de cerámica blanca hasta
    155,5 m; cruz de cuatro brazos que se ensanchan hacia la punta (17 × 13,5 m) con miradores de vidrio en la de detalle.
    Dos puentes a cada evangelista (a 96 y 112 m).
- **Sacristías** (35 m): base de 18 × 18, piso octogonal, cúpula de 12 lóbulos con huecos triangulares, linterna
  hiperboloide y tres obeliscos en la esquina exterior. La este se ha hecho igual que la oeste.
- **Fachadas** (solo el volumen; las detalla SF2):
  - Naixement: cuerpo oscuro, tres hastiales (el de la Caritat a 48 m), fondos de pórtico, el ciprés hasta 62,5 m y las
    dos columnas OSM con tortuga y palmera.
  - Passió: muro, las 6 columnas inclinadas (bases en las posiciones OSM), porche a 24 m, frontón con las 18
    columnas-hueso y la cruz.
  - Glòria: muro con tres ventanales entre las torres; nártex con cubierta a 20 m, las 7 columnas, 7 puertas de bronce
    (la central de 4,7 m) y 16 linternas hiperboloides (7 delante, de 35 a 58 m; 9 detrás, de 50 a 80 m) con conos de
    trencadís.

## Capturas (960×540, 10:30) y coste
Hoja ANTES/DESPUÉS: `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/sf/sf1/hoja_sf1.jpg`
(vistas en `…/sf1/vistas.json`: dron a 360 m y 150 m de altura desde la Glòria, el Naixement, la Passió y el ábside; a
pie en la Pl. de Gaudí y en Mallorca; lejos desde el Turó de la Rovira, a 2,1 km). **0 errores y 0 avisos de consola**
en las dos pasadas.

| vista | basílica ANTES | basílica DESPUÉS | hitos visibles (`lm.trisVis`) ANTES → DESPUÉS |
| --- | --- | --- | --- |
| dron (4 rumbos, 369-414 m) | 10 413 | 31 165 | 470-479 k → 502-511 k |
| a pie (Gaudí 85 m, Mallorca 64 m) | 10 413 | 75 805 | 477 k → 554 k |
| lejos (Rovira, 2 090 m) | 10 413 | 7 692 | 453 k → 454 k |

Total de hitos cargados: 698 777 → 775 513 (+76 736 entre las tres mallas). Carga entre 14 y 18 s, como antes. Ojo: a pie,
`trisVis` del núcleo cuenta también la malla lejana (está bloqueada como nivel LOD, pero el núcleo no lo sabe): el dato
bueno de la basílica es `sf.tris`.

Prueba sin navegador de los tres constructores (1 s): `node …/scratchpad/sf/sf1/tris_sf.js` (carga geo.js,
landmarks.js, landmarks_a.js y sagrada.js con el JSON y un terreno inclinado de 4 m).

## Flojo (sincero)
- Proporciones de las torres de los apóstoles: todavía algo finas y regulares desde el dron; los huecos forman una
  rejilla demasiado uniforme vista de cerca (Pl. de Gaudí). Las de la Passió no tienen la planta elíptica.
- Muros de piedra de sillares uniformes (`K.PIEDRA`), sin el relieve ni el envejecimiento: lo hará SF2. Los ventanales
  son huecos planos sin tracería. Los del testero del crucero se ven sesgados a pie.
- El ciprés del Naixement sale más azul que verde (el trencadís aclara el verde).
- Glòria: la posición del nártex es una estimación. Las linternas de atrás están en z ≈ 39,5 y las de delante en ≈ 43,2;
  las columnas, en ≈ 44, ya sobre la acera de Mallorca, unos 5 m pasada la línea de manzana (+39,3). Las torres de la
  Glòria están en z = 36 y las linternas de atrás las rozan.
- La silueta lejana se ve bien, pero solo se ha comprobado desde la Rovira. No hay vista de noche (es de SF3).
- La vista `pie_mallorca` sigue mala: en ANTES y en DESPUÉS la tapan una losa gris en diagonal (la plaza-puente de otro
  módulo, no de la basílica) y un árbol. La de la Pl. de Gaudí está a 85 m, en la acera de Marina, y no en un claro de la
  plaza.
- He quitado de la basílica el puente-plaza sobre Mallorca del constructor viejo: le toca al carril de la escalinata.

## Para la etapa siguiente (SF2)
- Todo está en `construir()`: `MED` va a la malla principal y `DET` a la de detalle, y no se duplican. Lo fino nuevo va en
  `DET` (se oculta a 350 m) para no subir el coste del dron.
- Pendiente: relieve de las tres fachadas, tracería, piedra envejecida, planta elíptica en la Passió, símbolos
  distintos para cada evangelista y una vista a pie mejor desde Mallorca.

## Para DESARROLLO.md
- `sagrada.js` sustituye el constructor de la ficha `sagrada_familia` (como `aeropuerto.js` con `aeroport`) y añade las
  fichas `sagrada_familia_lluny` (nivel LOD de la principal a más de 1500 m) y `sagrada_familia_detall` (detalle
  superpuesto a menos de 350 m). `BCN.lm.stats().sf` da los triángulos de la basílica que se dibujan desde la cámara.
- Patrón para un hito con niveles de detalle: un único constructor con calidad `q`, varias fichas en el mismo sitio y,
  envolviendo `BCN_LANDMARKS.init`, `principal.addLODLevel(d, lejana)` y `detalle.addLODLevel(d, null)`.
