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

## Pendiente
(ver abajo, se actualiza al final)
