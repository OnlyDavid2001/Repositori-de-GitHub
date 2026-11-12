# FIX3 · arreglos entre carriles (día 3)

Worktree `/home/user/wt/n3-int`, rama `wt-n3-int`. Capturas en `scratchpad/n3/fix3/` (A_* = antes, sobre una copia de
a15c6a8 en `fix3/base/gta`; D_* = después, copia en `fix3/fin/gta`). Arnés: `fix3/run.sh <dir gta> <prefijo> <vistas…>`
con `fix3/v_<vista>.json`; el eval devuelve tri, lm, lmv (hitos dentro de su distancia), pl (árboles de plaza), al (ms del
allanado), trb (máx. ms por paso de transporte) y lt (fases de carga).

## Estado por nota
1. **Ciutat Vella sin árboles** — HECHO (streets.js `streetKind`). Un lado sin edificios en 45 m ya no cuenta como 45 m: con un
   lado abierto, ancho = 2 × lado cerrado; con los dos abiertos, 2·hw + 6. En Ciutat Vella, «ancha» solo con edificios a los
   dos lados a ≥ 36 m (o calzada hw ≥ 5); las ramblas siguen su regla (rambla y ancho ≥ 22). Vista `gotic`.
2. **Árboles de plaza** — COMPROBADO: P3 ya plantaba con las especies de trees.js (instancias propias por niveles, mismas
   mallas y materiales). Los andenes de paseo de plazas.js (`makePaseos`) no plantan árboles (solo farolas, bancos, quioscos…),
   así que no duplican los de streets.js. No he añadido `ctx.extraTrees`: no hacía falta.
3. **Rodajes sin farolas** — HECHO. `aeroIn(xz)` en el preludio (app.js) y `aeroIn(x, z)` en furniture.js con el rectángulo de
   `aero_campo`: sin aura de calzada (FS_ROAD), de acera (FS_WALK), de suelo urbano (uGlow.w) ni farolas de furniture.js.
4. **Presupuesto de hitos** — HECHO A MEDIAS (landmarks.js): LOD de Babylon con malla nula por ficha, a max(450, 80·s) m (s = alto
   o radio del modelo; primero solo s < 30 m, luego todas). Total construido 698 k; dentro de su distancia con s < 30 m: 482–486 k
   (Gòtic, Glòries, Passeig de Gràcia, aeropuerto desde el aire). Con todas las fichas (D2): 476–481 k, casi igual: lo que pesa son las fichas grandes de puerto y aeropuerto
   y los hitos cercanos. No he subido el tope ni partido esas fichas: queda para REV3/otra etapa. Sigue por encima de 400 k: los
   hitos grandes de puerto y aeropuerto pesan; frustum aparte, lo dibujado depende del encuadre. `BCN.lm.stats().trisVis` da los triángulos de hitos dentro de su distancia desde la cámara.
5. **Tirones** — HECHO: `build` de transporte.js es un generador (cede cada 3 piezas); paso máximo de construcción 25,9 → 2,9–3,1 ms
   (colocación de estaciones, máx. por paso 111 → 4–8 ms en las mismas vistas, con ruido de la máquina); ground.webp se descodifica una vez
   (nature.js la deja en `ctx.groundBmp`, transporte.js la toma y la cierra).
6. **Asfalto negro** — HECHO: Ta = 0,100 + 0,018·w + 0,006·w² (antes 0,062 + 0,03·w + 0,0045·w²); Passeig de Gràcia 0,85 → 1,05 y
   Diagonal/Gran Via 1,15 → 1,25 (seminuevas); parche reciente 0,075 → 0,092. `uSF` puesto a (0, 0) explícitamente.
7. **Allanado** — HECHO: medido con todo junto 1,7–1,8 s (máquina cargada: hasta 3,0 s). Ahora se precalcula: `data/allanado.bin.gz`
   (3,9 MB, teselas a 2 cm y `low` en cm) con una clave de entradas (`BCN_SUELOS.preClave`: calles, mundo y 225 muestras del relieve,
   más una versión del cálculo). Carga 0,45–0,52 s (descarga + gunzip + desempaquetado). Si la clave no coincide, recalcula como antes
   y lo avisa en consola (log). Regenerar: `tools/allanado.sh`. `?noprecalc=1` fuerza el cálculo.
8. **Árboles de Glòries** — HECHO: retícula 11 → 14 m y probabilidad 0,75 → 0,52. Triángulos de árboles de plaza: a pie 191 k → 108 k
   (nivel medio 476 → 273 instancias), desde el dron 180 k → 100 k; desde el dron no se ve pelado.

## Para DESARROLLO.md
- `aeroIn(vec2)` en el preludio: 1 dentro del campo de vuelo (aero_campo). Sin aura nocturna de calles ni farolas allí.
- Hitos: LOD por ficha (oculta a max(450, 80·s) m); `stats().trisVis`.
- Allanado precalculado: `data/allanado.bin.gz` + `tools/allanado.sh` (relanzar si cambian calles, relieve o `calc`).
- transporte.js construye las celdas por pasos; `ctx.groundBmp` comparte la ortofoto descodificada entre nature y transporte.
- Asfalto: albedo por estado 0,084 · 0,11 · 0,15 · 0,20 · 0,26–0,33.

## Lo flojo
- Hitos: el LOD por ficha solo baja lo de dentro de distancia de 698 k a ~480 k; sigue por encima de 400 k.
- Asfalto del Passeig de Gràcia: más gris que antes pero todavía oscuro a pie de día (D2_pg_calz).
- Gòtic: la vista desde el dron no deja ver si queda el alcorque de arb4 (dgo_tp_gotic); la regla está cambiada pero sin
  comprobación visual a pie. La vista `gotic` (la de ARB4) en mi arnés mira a una pared.
- La regla nueva de «ancha» también quita adultos fuera de Ciutat Vella donde un lado da a una plaza: al fondo de pg_calz
  desaparecen algunas copas (D2_pg_calz frente a A_pg_calz).
- data/allanado.bin.gz pesa 3,9 MB (+13 % de data/). Hay que regenerarlo si cambian calles o relieve (si no, recalcula: no rompe).
- glor_pie mira a un muro: Glòries se comprueba con los números y desde el dron.

Hoja: scratchpad/n3/fix3/hoja_antes_despues.jpg (aero_n, glor_dron, pg_calz, gotic_dron, pg_n).
