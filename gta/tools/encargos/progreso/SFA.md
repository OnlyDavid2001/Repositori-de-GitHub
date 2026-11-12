# SFA · Puntas exteriores del ábside alrededor de la torre de la Mare de Déu (modelo del usuario)

Estado: código y datos hechos y subidos; capturas en `scratchpad/sf/sfa/` (antes_*, desp_*, hoja_sfa.jpg). Rama `wt-sf-abs`.

## Hecho
1. **Extractor nuevo `tools/stl_absis.py`** (mismo STL, mismos ejes y orientación de normales que `stl_basilica.py`; este no
   se toca) → **`data/sf_modelo_absis.json`** (104 kB), cuatro grupos con `piezas` = [primer triángulo, nº, u, v, z0, z1]:
   - `corona`: 7 piezas, 867 tri (4 × 196 alrededor de la torre de María + 3 × 28 en el lado del crucero), z 23,1 → 86,6;
   - `agujas`: 35 piezas, 2 226 tri (28 agujas en hoja de 60/120 tri, z 4,8 → 53,8, y 7 hastiales finos de 44, z → 47,7);
   - `torres`: 4 piezas, 520 tri (cuerpo y cono de las dos torres de las esquinas);
   - `capillas`: 18 piezas, 4 353 tri (cuerpos 756/1 134, cubierta plana de 28 y 14 columnas de 120).
   Fuera: torre de María, evangelistas, sacristías, claustro, Asunción, terreno y 6 piezas sueltas (dos muros de 64 tri en
   (15, ±21) que pisan la caja propia y cuatro barras).
2. **Colocación (`sagrada.js`, sección del ábside)**: en planta, la torre de María del modelo (24, 0) sobre `R.md`, escala
   sA = 17,5 / 21,0 = 0,834 (borde de las capillas del modelo → girola de OSM a z = −62). En altura, por tramos: 4,8 → 0;
   23,1 → 33; encima ×1,032 (punta de María 124,8 → 138). Las torres de las esquinas se apartan enteras del fuste de los
   evangelistas (chocaban 1,8 m); la corona, vértice a vértice (por encima de 40 m, a ≥ 5,9 m del eje del evangelista).
3. **Fuera lo nuestro** (solo si se carga el JSON; sin él, todo como antes): hastiales y agujas de las 7 capillas, sus bolas
   del detalle, los 7 ventanales del presbiterio y el remate del presbiterio 33 → 71 (queda una base hasta 41 m bajo la torre
   de María). La girola propia baja a núcleo de r 14 con techo a 32,4 (la cubierta del modelo está a 33: sin parpadeo).
4. **Material**: el mismo `sf_lm` y el ocre `TOR`, `K.PIEDRA` con `aP`; el 5-7 % alto de cada aguja, torre y punta de la
   corona en cerámica vidriada dorada sobria (`mix(c.oro, TOR, 0,35)`, `K.TRENCADIS`). Noche: la luz común del shader.
5. **Niveles**: piezas del modelo en la malla media (cerca se dibuja también la media); lejos, silueta: un cono por pieza de
   la corona, las 24 agujas como conos de 4 lados y las dos torres.

## Alturas (sobre el suelo del templo)
Corona: puntas laterales (24, ±5,3) 88,4; puntas de delante y detrás 73,3; lado del crucero 98,6 / 94,5 (las dos de ±4,7).
Agujas de la girola 64,7 (node), hastiales finos 58,0; torres de las esquinas: cuerpo 58,0, cono 67,9. Mare de Déu 138,2 y
Jesucrist 172,5 sin cambios.

## Triángulos (node, `scratchpad/sf/sfa/test.js`)
| malla | antes | después |
|---|---|---|
| media | 63 295 | 70 494 |
| lejos | 9 470 | 9 318 |
| detalle | 58 122 | 56 610 |

## Para DESARROLLO.md
- `data/sf_modelo_absis.json` (de `tools/stl_absis.py`) se carga como `sf_modelo_piezas.json` (`absisP`, `window.BCN_SF_ABSIS`
  para pruebas en node); `LMS.init` espera también a `absisP`.
- Sección del ábside de `sagrada.js`: `AB` decide entre el exterior del modelo y el procedural.

## Para la fusión con wt-sf-int
Solo se tocó `sagrada.js`: (a) tras `piezasP`, el bloque `absisOf`/`absisP`; (b) la sección «ábside: presbiterio…»
hasta antes de «contrafuertes y pináculos con frutas»; (c) la línea `await … piezasP; await absisP;` de `LMS.init`.
Ficheros nuevos: `tools/stl_absis.py`, `data/sf_modelo_absis.json`, este progreso.
