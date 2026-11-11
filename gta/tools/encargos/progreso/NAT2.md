# Progreso · etapa NAT2 (segunda pasada de NATURALEZA)

Rama `wt-n2-nat`. Ficheros: `nature.js`, `app.js` (solo `FS_TER`, `FS_SEA` y la preparación del terreno y del mar),
`tools/views_nat.json` y este progreso. Parte de lo que dejó NAT (ver `NAT.md`).

## Hecho
- **Miradores y explanadas despejados** (`nature.js`): ninguna planta en la huella de los hitos (`BCN.lm.get(id)`:
  rectángulo ancho × largo girado `rot` + 18 m, o su radio), en una lista de miradores que no son hitos o necesitan más
  margen (mirador de l'Alcalde, terrazas del MNAC, búnkers del Carmel, explanada del Tibidabo, Castell de Montjuïc) y a
  22 m de cada vista a pie de `BCN.views` (30 m las aéreas bajas). Las vistas aún no existen al iniciar el módulo: en cuanto
  aparecen se añaden y se rehacen las celdas (una vez).
- **Copas de cerca** (nivel 0, < ~90 m): tarjetas de hojas cruzadas con alfa sobre un núcleo bajo y oscuro. Textura de
  hojas procedural (un lienzo de 256×128 al iniciar: ramillete de agujas / hojas de encina). Pino piñonero en sombrilla
  de ramilletes con cuatro ramas, carrasco de cuatro racimos abiertos, encina densa y rugosa, arbusto bajo de hojas.
  La sombra recorta por el mismo alfa (`alphaTex` del registro).
- **Volumen desde el aire**: nivel 2 nuevo, un cartel de 2 triángulos orientado a la cámara (copa con normal de esfera,
  borde irregular, tronco que se recoge al mirar desde arriba) hasta 1,3 km (árboles, 45 % y 1,25× más grandes) y 620 m
  (arbustos). Las cañas también tienen cartel lejano hasta 720 m.
- **Delta**: parcelación común a `FS_TER` y `nature.js` (franjas de 70 m giradas 0,62 rad, parcelas de 95 m); en las
  lindes, acequias oscuras en el shader y cañas, matas y algún árbol de ribera en 3D.
- **Arena mojada continua** (`app.js`): máscara de costa nueva (`uShore`, téxel de 8 m, distancia con signo a la cota 0
  del relieve con el cruce interpolado, ±40 m). La franja mojada va por distancia (3–7 m, ancho que cambia despacio) con
  la línea de la última ola pegada al agua; lo de tono arena a < 25 m del agua cuenta como playa (se acaban las manchas de
  la ortofoto). La espuma de `FS_SEA` usa la misma máscara: línea pegada a la arena y frentes de ola solo frente a playas.
- **Coste**: niveles más cortos para las mallas (0 → 90 m, 1 → 210 m) y el resto en carteles.

## Pendiente / flojo
(se rellena al medir)

## Cómo se prueba
Vistas de `tools/views_nat.json` a las 10:30 y a las 23:00 con `DRAW=40000` (ver `NAT.md`); `BCN.detailStats().nat`.
`window.BCN_SHORE_MS`: lo que tarda la máscara de costa al cargar.
