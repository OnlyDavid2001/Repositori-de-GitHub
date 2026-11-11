# DIA — luz de día fiel a las fotos de la mañana (carril LUZ, rama `integra`)

Encargo: «que mejores notablemente la luz de día», con dos fotos reales de la mañana (avión sobre la Torre de Collserola
hacia el mar; Observatori Fabra hacia el mar). Sin romper la noche (etapa NOCHE) ni el atardecer. Documentación:
DESARROLLO.md §7.6 («Día fiel a las fotos») y §7.9 (tabla por horas).

## Hecho (solo `app.js`)
- «Modo día» `dd = e·(1 − nt)` en `setHour` y `(1 − uNight)` en los shaders: sol cálido por la mañana (`wm`), `K.sunD`,
  `K.desD` (sombras azuladas), `K.skyD`, `K.gndD`, `K.expD`, bruma azulada `K.fogDay` y menos densa `K.fogDD`.
- `FS_SEA` azul saturado; `FS_BLD` mosaico de fachadas y cubiertas; `FS_TER`/`FS_OUT` bosque oliva oscuro con copas;
  surcos de sombra en calles y bajos de muros lejanos (`shOut()`, `sunTan()` en el preludio).
- Noche a las 23:00: idéntica píxel a píxel (6 vistas de `noche_fiel/v23.json`, máx. diferencia 0).

## Cómo se prueba
`SIZE=640x360 FMT=jpg node tools/shot.js <out> @<scratchpad>/dia_fiel/vdia.json` (7 vistas: Collserola 8:30 y 10:30,
Fabra 10:30, eix_acera y rambla_pie 10:30 y 13:00). Hoja: `python3 -I <scratchpad>/dia_fiel/hoja.py <dir_antes> <dir_despues> hoja.jpg`.
Noche: `@<scratchpad>/dia_fiel/vn.json` y comparar con `old_n_*.jpg` (código de b36f978).

## Trampas
- `gSunVis` es la caché de `sunVisN`: para atenuar el sol de un fragmento (surcos) se llama a `sunVisN(n)` y se sobrescribe
  `gSunVis` antes de `lit()`.
- Con la máquina cargada, 13 vistas no caben en 600 s: partir las tandas o lanzar en segundo plano.

## Pendiente / flojo
- Ciudad desde Fabra algo gris y oscura respecto a la foto; sin sombras de colina más allá de 400 m (haría falta un mapa
  de sombras del relieve); textura de copas de lejos tipo musgo; copas de árboles de calle (`streets.js`, no es de LUZ).
