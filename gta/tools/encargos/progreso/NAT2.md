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
- **Arena mojada continua** (`app.js`): máscara de costa nueva (`uShore`, téxel de 8 m, ±40 m en un byte): distancia con
  signo al contorno real del relieve en la costa (la línea y = 0 que cruza los triángulos del escalón y el borde del relieve
  que queda por encima del agua; aristas casadas por posición, sin las costuras de los trozos), exacta a < 12 m y por
  chaflán más allá. Ojo: la cota 0 de `heightAt` NO sirve (la rejilla H sigue a +1,2 m mar adentro; el agua empieza donde
  acaba la malla). La franja mojada va por distancia (3–7 m, ancho que cambia despacio) con
  la línea de la última ola pegada al agua; lo de tono arena a < 25 m del agua cuenta como playa (se acaban las manchas de
  la ortofoto). La espuma de `FS_SEA` usa la misma máscara: línea pegada a la arena y frentes de ola solo frente a playas.
- Espuma también sobre la arena en la línea de agua (el relieve tapa el borde del mar por el zOffset del mar).
- **Relieve de copas lejano** (`FS_TER`, `canopyW`): de lejos, bosquetes de 45–90 m que tuercen la normal hasta píxeles de
  ~110–300 m (antes se apagaba a 10–40 m).
- **Coste**: niveles más cortos para las mallas (0 → 90 m, 1 → 210 m) y el resto en carteles.

## Coste medido (SwiftShader, 640×360, `BCN.detailStats().nat.tris`; antes = NAT eaa34d6)
| vista | antes | después |
|---|---|---|
| Collserola a pie (coll_pie) | 652 912 | 317 538 |
| Collserola desde el aire (coll_aire) | 127 728 | 86 194 |
| Collserola media distancia (coll_media) | 66 108 | 39 785 |
| Montjuïc (montjuic) | 79 552 | 21 938 |
| Carmel, búnkers (carmel) | 152 630 | 53 731 |
| Mirador de l'Alcalde (alcalde) | 215 317 | 91 656 |
| Aeropuerto desde el aire (aero_aire) | 0 | 15 966 |
| Delta desde el aire (delta_aire nuevo) | — | 11 588 |
| Playa dron / orilla | 3 810 / 662 | 2 558 / 1 092 |
Sombras en coll_pie (cascada cercana/lejana): 45 k / 386 k → 43 k / 384 k. Celdas en memoria: ~120 → 330–430 (radio
1,3 km; ~40 B por planta). Generar una celda: 1,3–3,5 ms (máquina compartida). Máscara de costa al cargar: ~0,35 s.

## Pendiente / flojo
- Montjuïc a 2 km (`mjc_lejos`): sigue leyéndose como césped claro; el relieve lejano apenas se nota porque la ortofoto
  lo pinta verde claro y los carteles acaban a 1,3 km.
- Espuma a pie (`orilla_pie`): la franja mojada ya es una banda estrecha y continua, pero la espuma de la orilla es débil.
- Desde el dron (`playa_dron`) los frentes de ola salen como trazos blancos algo regulares.
- Las copas de tarjetas a < 20 m se ven bien de lado; desde debajo de un piñonero el núcleo oscuro aún parece una lámina.
- Los carteles lejanos no proyectan sombra (a > 200 m no se nota).
- Miradores: lista a mano de 5 sitios + huellas de hitos + vistas a pie; otros miradores sin hito pueden seguir con pinos.

## Cómo se prueba
Vistas de `tools/views_nat.json` a las 10:30 y a las 23:00 con `DRAW=40000` (ver `NAT.md`); `BCN.detailStats().nat`.
`window.BCN_SHORE` = { ms, edges }: lo que tarda la máscara de costa y cuántas aristas de costa salen.
Hoja ANTES/DESPUÉS: `scratchpad/n2/nat2/hoja_nat2_antes_despues.jpg`.

