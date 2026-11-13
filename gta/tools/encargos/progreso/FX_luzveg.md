# FX luzveg · arreglos de la zona luz y vegetación (fase gráfica 1)

Worktree `/home/user/wt/g1-fx-luzveg`, rama `wt-g1-fx-luzveg` (desde `wt-g1-int`). Capturas en
`scratchpad/g1/fx_luzveg/` (`antes/a_*`, `despues/d_*`, 640×360; el ANTES sale de un worktree congelado en `wt-g1-int`).

## Hecho (con ANTES/DESPUÉS en scratchpad/g1/fx_luzveg/cmp_*.jpg)
- trees.js: plátano con copa más alta, estrecha y aireada (h 5,4→6,2, out 0,66→0,5, up 0,75→0,92, 620→470 hojas) y tronco
  más fino (r 0,3→0,25): abre el dosel en Eixample y Sagrada Família y abarata los árboles de calle.
- trees.js `pick()`: las calles cuyo eje apunta a la Sagrada Família (a < 50 m del templo, hasta 900 m) llevan naranjos.
- app.js setHour: cielo de noche azul profundo a las 21–24 h (foto del dron), azul marino casi negro solo de madrugada (uLate).
- app.js setHour/K: de noche cerrada, ambiente ×0,78 y luna 0,8→0,62 (fachadas y copas «como de día»).
- app.js FS_SEA: Fresnel con la normal media (refleja el cielo en rasante) y pista de luz cálida hacia el sol bajo.
- app.js FS_TER: arena seca con albedo ~0,5 (antes 0,8) y franja mojada más ancha, oscura y brillante.
- furniture.js: charco de las farolas más marcado y de sodio (×7 → ×10, radio hasta 8,5 m).
- trees.js: jacaranda con menos flor (0,55 → 0,3) para que no sea ruido morado.
- app.js FS_SEA: en rasante, la pendiente de las olas medianas a la mitad (vetas borrosas estiradas).
- lighting.js: tras la mezcla de la oclusión se sueltan las texturas (aviso «Feedback loop» de WebGL).

## Peticiones a otros carriles
- plazas.js (G1S): las palomas en vuelo (`flock`) de Plaça de Catalunya se ven como cajas negras y hay un objeto gris
  plano en el cielo (pcat_pie): no son ficheros de esta zona.
- FS_BLD (edificios): ventanas de noche como ruido blanco frío desde el dron; pedir 20–30 % cálidas y sin aliasing.
- streets.js: corteza del plátano (manchas claras) y charcos de sodio en la calzada (FS_ROAD).

## Resultado (sincero)
- Resuelto: la Sagrada Família se ve desde sagrada_pie y la calle tiene sol (naranjos en el eje); el dosel de plátanos del
  Eixample es más abierto; triángulos de árbol cercanos en sagrada_pie 349 k → 267 k, en eix_calle 197 k → 183 k.
- Resuelto: cielo de noche azul profundo (noche_dron, rambla_noche); mar de noche visible en azul.
- Resuelto: arena de la Barceloneta con color de arena (no blanca).
- Mejorado, no resuelto del todo: mar del atardecer refleja el cielo y tiene menos vetas, pero sigue sin olas nítidas; el
  puerto sigue bastante uniforme. Las fachadas de noche, algo más oscuras; las copas de la Rambla siguen muy iluminadas
  (sombreador de árboles en streets.js). Los charcos de farola en la acera de eix_noche apenas se notan.
- Sin verificar: el aviso «Feedback loop» no salió ni en el ANTES (vista 11950,14450 agl 140); el arreglo es preventivo.
- No tocado (fuera de mis ficheros): palomas y objeto gris (plazas.js), ventanas de noche (FS_BLD/facades), escaparates
  quemados (interiors.js), corteza del plátano (streets.js), cipreses-cono (plazas.js), calzada en sombra (FS_ROAD), AO de
  calle estrecha, textura de bosque lejano.

## Para DESARROLLO.md
- trees.js `pick()`: las calles que apuntan a la Sagrada Família (eje a < 50 m del templo) llevan naranjos.
- setHour: `lt` (madrugada) mezcla el cielo/bruma de noche entre azul profundo (21–24 h) y casi negro (0–6 h).
