# ENT2 · La escalinata de la Glòria y su eje hasta la Diagonal

Rama `wt-sf-entorno`. Capturas y hoja: `<scratchpad>/sf/ent2/` (`antes_*.jpg`, `despues_*.jpg`, `hoja_ent2_antes_despues.jpg`;
vistas en `views.json` / `views_desp.json`; generadores `gen/gloria_gen.py`, `gen/views.py`, `gen/hoja.py`). Sin errores ni
avisos de consola en las capturas DESPUÉS (las ANTES llevan un aviso de diagnóstico propio con las cotas del eje).
**Estado: hecho** (lo flojo, abajo).

## Hecho
- `data/sf_ent_gloria.json` (de `gen/gloria_gen.py <gta>`), ejes locales de la ficha `sagrada_familia`: franja de 60 m
  (|X| < 30), losa Z 41–61 con pilas en las aceras, terraza Z 61–80, monumento en (0, 70,5), escalinata Z 80–137, manzanas que
  la avenida corta y tres plazas con su polígono local y de mundo (Esplanada Z 137–174,6; Passeig Z 194,2–308,6; Placeta de la
  Diagonal, solo la cuña que queda en el lado −X entre Aragó y el bordillo de la Diagonal). El campo `fuente` separa proyecto de
  interpretación.
- `gloria.js` (nuevo, `<script>` tras `landmarks_e.js`), tres fichas con el centro y giro de la basílica:
  - `sf_gloria` (sombra, focos): losa con canto y cornisa sobre Mallorca, bóveda nervada del paso inferior con luz corrida, 10
    pilas con capitel en las aceras, peldaños de enlace con el nártex si el suelo del templo queda por debajo, terraza maciza,
    Monumento al Fuego y al Agua (vaso en cruz con agua, fuste, surtidor de 20 m, cuatro cascadas, espuma, dos tederos de bronce
    con llama emisiva), escalinata de 4 tramos × 14 peldaños (contrahuella ≈15,4 cm, huella 46 cm) con 3 rellanos de ≈10,4 m con
    macetones de boj, zancas con albardilla siguiendo los peldaños y basamento hasta la calle.
  - `sf_gloria_detall` (sin sombra, `addLODLevel(420, null)`): balaustrada torneada sobre las bocas del paso, pasamanos de bronce
    en dos carriles, farolas de fundición de doble brazo (linterna encendida solo de noche), relieves del infierno y los vicios
    sobre las bocas del paso.
  - `sf_gloria_edificis` (ventanas de noche): elige con la planta exacta del registro (anillo de `BREC` + origen deducido de la
    caja) los volúmenes que pisan la franja en las manzanas, los oculta y rehace la parte de fuera de |X| = 30,4 con fachada nueva
    y cornisa. Los volúmenes de esas manzanas que ocultaba la ficha de la basílica (Z > 52) pasan a esta ficha (7).
  - Cotas: `yF` (suelo del templo, como `sagrada.js`) 32,23; Mallorca 29,97; losa `yS` = Mallorca + 5,5 = 35,47 (≈4,1 m libres
    bajo los nervios). `BCN_GLORIA.stats()`.
- `plazas.js`: las tres plazas del eje se añaden a `data.plazas` con su polígono y son singulares `sfSing` (`gl_expl`, `gl_av`,
  `gl_tri`): granito con franjas de piedra, parterres, hileras de plátanos y almeces (`filas`), paseo central con bancos y
  farolas, dos fuentes lineales (`fontR` de 32 × 6,4 m), sendas de sauló, aceras de panot junto a las fachadas (`nolamp`), dos
  estatuas en el cruce. `sfZone` admite `fondo`; los puntos pasan `L`, `W`, `H`. `pavAt` es cierto bajo la losa (sin árboles de
  calle ni bocas de metro debajo).
- Re-captura de ENT1: `gaudi_foto` y `gaudi_noche` ya sin banco ni farola dentro del agua.

## Coste (960×540)
Hitos: total 698 777 → 741 739 tri (+42 962 de las tres fichas). Dibujados: dron 477 782 → 491 048; a pie en la escalinata
477 266 → 520 228; en Mallorca 477 786 → 520 748; en el Passeig 478 418 → 521 380 (el detalle se quita a > 420 m).
Plazas visibles: dron 122 194 → 144 142; a pie en el eje 68 800 → 90 748 (alto detalle 1 637 → 15 575); árboles de plaza a
pie en el Passeig 42 566 → 152 864 tri. Carga igual (~17 s).

## Flojo (sincero)
- **Desnivel templo–losa**: el suelo del templo del juego (32,2) está solo 2,3 m sobre Mallorca; el proyecto lo pone 4-5 m. La
  losa va a 35,5 y hay 21 peldaños de enlace en Z 41–46, que chocan con las columnas del nártex de `sagrada.js` (Z ≈ 44).
  En este worktree la vieja ficha `sagrada_familia` (landmarks_a.js) aún tiene su puente-plaza, casi tapado por la losa.
- **Las manzanas ya estaban vacías antes** (las dos enteras, 113 m, con céspedes de otra etapa): fuera de la franja de 60 m
  siguen esos céspedes, no edificios; `sf_gloria_edificis` oculta 166 volúmenes que ya no se veían y casi no rehace nada visible.
  No he encontrado quién los vaciaba.
- **De noche** los focos de la ficha bañan la escalinata clara demasiado blanca (`noche`); el Passeig queda oscuro salvo farolas.
- Cascadas del surtidor: barras blancas que se leen como un arco más que como agua.
- Farolas de calle (furniture.js) en las aceras de Mallorca pueden atravesar la losa (no consultan `pavAt`).
- Diseño del Passeig, relieves, peldaños y rellanos: interpretación (el proyecto solo fija ancho, losa, escalinata y monumento).

## Para DESARROLLO.md
- `gloria.js` + `data/sf_ent_gloria.json`: escalinata de la Glòria (fichas `sf_gloria`, `sf_gloria_detall` con LOD 420 m,
  `sf_gloria_edificis`), envoltorio de `BCN_LANDMARKS.init` que espera al JSON y elige volúmenes por la planta exacta.
  `window.BCN_GLORIA.stats()`.
- plazas.js: plazas añadidas desde el JSON del eje (Esplanada, Passeig y Placeta de la Glòria); `sfZone` `fondo`,
  `sfObjs` `filas` y `nolamp`; `pavAt` cierto bajo la losa de Mallorca.
