# Progreso · etapa ARB (árboles: 7 especies)

Rama `wt-n2-arb`. Ficheros: `trees.js` (nuevo), `streets.js`, `index.html` (una línea: `trees.js` antes de `streets.js`).

## Hecho
- `trees.js` (`window.BCN_TREES`): siete especies con sus tres niveles (árbol completo, copa de tarjetas, impostor):
  0 plátano (idéntico al de antes: mismas secuencias `seedRaw`), 1 almez/lledoner, 2 naranjo amargo (con naranjas),
  3 palmera (tronco, falda de hojas secas y hojas en tira curvada), 4 jacaranda (flor lila en ~55 % de los ejemplares,
  decidido en el sombreador por `vH`), 5 tipuana (copa ancha aparasolada), 6 pino piñonero (tronco inclinado, copa plana).
  Hojas e impostores dibujados en canvas por especie (plátano 1024², resto 512² y 256²).
- Reparto (`BCN_TREES.pick`): la especie se decide por recta de calle (ángulo y distancia al origen redondeados) y tramo de
  ~320 m, con pesos por familia de barrio (n2/comun.md), por ancho de calzada (avenidas: más plátano y tipuana; calles
  estrechas: naranjo y almez) y ramblas (plátano, alguna palmera). Frente marítimo (Barceloneta, Vila Olímpica, Diagonal
  Mar): muchas palmeras. Poble-sec y Marina (Montjuïc): pinos.
- `streets.js`: 7 × 5 mallas con instancias (`tNB<k>`, `tNL<k>`, `tFB<k>`, `tFL<k>`, `tI<k>`; lighting.js separa las
  cascadas por el prefijo tN/tF, sigue funcionando), 35 materiales con el mismo programa (`FS_TREE` + `uBark`, `uLeaf`,
  `uSp`). Las mismas posiciones y alcorques (lista de 7 valores por árbol: el 7.º es la especie). Noche sin tocar
  (`treeGlow`, `lampBath`). `stats()` da `treeTris` (cerca, media, lejos) y `treeSp` (ejemplares por especie).
  `findTree(k, x, z)` para pruebas (k < 0: cualquiera).

## Cómo se prueba
`$SCRATCH/n2/arb/mkv.js <factor_dist> <hora> <x> <z>` genera vistas de especie (cerca: factor 1; media: 4) que buscan con
`BCN.streets.findTree` el ejemplar más cercano; `v_barris.json` hace calles de seis barrios, dron 10:30 y 23:00.

## Coste (medido con el arnés, 640×360)
- Acera del Eixample 10:30: instancias [cerca, media, lejos] = [48, 1840, 24015] antes y después (mismas posiciones).
  Triángulos de árbol: cerca 205 056 = 205 056; media 603 520 → 583 180 (−3 %); impostores 96 060 = 96 060.
- Aérea 10:30 (y = 160): media 560 224 → 541 672 (−3 %); cascada lejana de sombras 1 531 943 → 1 513 391 tris.
- Triángulos por ejemplar (cerca / media): plátano 4272/328, almez 4800/358, naranjo 2452/276, palmera 496/108,
  jacaranda 3424/268, tipuana 4840/358, pino 2856/338. Impostor: 4 en todas.
- Lo que sube: llamadas de dibujo de árboles (5 mallas → hasta 35; solo dibujan las que tienen instancias) y mallas que
  proyectan sombra (n de la cascada lejana 55 → 67). Texturas nuevas: 12 atlas de hojas de 512² y 6 impostores de 256².
- Reparto en una vista aérea del Eixample y alrededores (≈1700 ejemplares a media distancia): plátano 62 %, almez 10 %,
  naranjo 10 %, jacaranda 8 %, tipuana 4 %, pino 3 %, palmera 3 %.

## Hojas (scratchpad n2/arb/)
`hoja_arb_antes_despues_general.jpg` (acera Eixample, dron, aérea a las 10:30; dron y acera a las 23:00),
`hoja_arb_antes_despues_especies.jpg` (las 7 especies a 6–11 m, antes = mismo sitio con plátanos),
`hoja_arb_antes_despues_calles.jpg` (calles de Gràcia, Poblenou, Sant Gervasi, Poble-sec, Barceloneta, Raval, Sants y
dron sobre la Rambla del Poblenou a las 10:30 y 23:00), `hoja_arb_media_distancia.jpg`.

## Pendiente / flojo
- Tres de las vistas de calle de prueba (Gràcia, Barceloneta, Sants) caen dentro de un edificio: la cámara se pone a 16 m
  del árbol más cercano al centro del barrio, a lo largo de la calle, y en calles cortas se mete en la manzana. Es la vista
  de prueba, no el juego.
- La tipuana enseña mucha rama gruesa de cerca; el pino de cerca aún parece más frondoso que aparasolado (de media
  distancia sí se lee la copa plana). Las especies nuevas usan la textura de corteza del plátano teñida.
- La jacaranda de lejos (impostor) se ve gris azulada más que lila.
- Desde el aire el Eixample sigue siendo sobre todo plátano (como en la realidad), así que la vista aérea cambia poco; en
  calles de otras especies las líneas verdes se ven algo más finas (naranjos y palmeras dan menos copa).
- DESARROLLO.md (§9 / tabla de capas: nombres de malla `tNB<k>`…, `trees.js` en la lista de ficheros) no lo he tocado:
  no es de mi carril.
