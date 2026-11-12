# REV4 · Repaso final del Día 3 (notas del revisor)

Estado: HECHO (con lo flojo abajo). Capturas en `scratchpad/n3/rev4/` (`A*` = antes, sobre `base/gta` = HEAD de REV3;
`D*` = después). Hoja ANTES/DESPUÉS: `scratchpad/n3/rev4/hoja_antes_despues.jpg`. Hoja final: `scratchpad/n3/rev/hoja_final.jpg`.

## Notas
1. **Carreteras de montaña** (streets.js, `ruralSeg`): un tramo es «rural» si en 2 de 3 puntos no hay edificios a 60 m a
   ninguno de los dos lados, o si tiene un lado abierto y la ladera es fuerte (desnivel transversal > 15 % a ±20 m o
   pendiente > 7 %). En esos tramos: ni acera ensanchada de S2 (EXT 40 m), ni árboles, alcorques o plantones de calle; la
   acera queda en un arcén de tierra y grava de 1,3 m (modelo 6 nuevo en FS_WALK, sin bordillo). RESUELTA en Vallvidrera,
   Arrabassada y una carretera de Montjuïc a pie (D_vallv_pie, D3_arr_pie, D3_mjc_pie). Las celdas de acera de esas zonas
   bajan mucho de triángulos (Montjuïc: 179 k → 36 k; Vallvidrera: 383 k → 123 k).
2. **Carretera de les Aigües** (nature.js `trackNear`, app.js RCOL[9]): pistas de tierra (clase 9) más claras y sin pinos
   a menos de 7,5 m del borde (semiancho ≥ 1,5) o 3,8 m (estrechas); matas a 1,8/0,9 m. PARCIAL: las pistas se leen algo más
   como líneas claras desde t_aigues, pero a 1–2 km una pista de 3 m sigue siendo fina; no he identificado qué tramo es
   exactamente la Carretera de les Aigües.
3. **Tronco en la explanada de Catalunya**: era un pino de nature.js (la ortofoto es verde bajo la plataforma). nature.js no
   planta nada sobre `BCN_PLAZAS.pavAt` (con `pavAny` por celda para no encarecer: 0,7 ms/celda como antes). RESUELTA
   (D_cat_fuente). Macià de frente: no hecho.
4. **Hoja final** rehecha: 12 vistas a 1280×720, todas miradas antes de meterlas.
5. `node --check` de todos los .js, cero errores y avisos de consola en todas las tandas.

## Flojo
- Aigües: mejora pequeña (ver nota 2).
- Hoja final: la boca de metro sale en dos vistas (tótem de lejos / escalera de cerca sin tótem en cuadro); Catalunya a pie
  se ve muy vacía y clara; el asfalto del Eixample sigue muy oscuro.
- El arcén rural se pinta con la malla de acera (cota walkY); en curvas cerradas puede verse un borde verde fino.

## Para DESARROLLO.md
- streets.js `ruralSeg(s)`: tramo fuera del tejido urbano (sin acera ancha, sin árboles de calle; modelo de acera 6 =
  arcén de tierra y grava en FS_WALK, sin bordillo).
- nature.js: nada sobre `BCN_PLAZAS.pavAt` (filtrado por celda con `BCN_PLAZAS.pavAny(x0,z0,x1,z1)`); pinos lejos de las
  pistas de clase 9 (`trackNear`). app.js: RCOL[9] más claro (192,176,140).
