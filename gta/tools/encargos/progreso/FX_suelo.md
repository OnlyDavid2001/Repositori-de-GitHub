# FX_suelo · Arreglos de la zona «suelo» tras el jurado de INT1

Rama `wt-g1-fx-suelo` (sale de `wt-g1-int`, f60c302). Capturas a 640×360 en `scratchpad/g1/fx_suelo/`:
ANTES `antes/a_<vista>.jpg` (desde el worktree de g1-int), DESPUÉS `despues/d_<vista>.jpg` y `despues3/d_<vista>.jpg`,
sondas en `probe/` (vista cenital de la Plaça de Catalunya: `probe/t_pcat_top.jpg`), hojas `cmp1.jpg` y `hoja_fx_suelo.jpg` (ANTES izquierda, DESPUÉS derecha: coll_camino, pg_pie, gracia_calle, pcat_pie,
espanya_dron, eix_xamfra). Todas las capturas sin errores ni avisos de consola.

## Resuelto (visto en ANTES/DESPUÉS)
- **Collserola, camino flotando (gravedad 5, tres jurados)** · coll_camino. Sonda: los bordes de las pistas (clase 9) y de los
  caminos (clase 5) quedan hasta 2–3,2 m por encima del relieve en bruto: el allanado (suelos.js) nivela la sección de lado a
  lado y en ladera levanta el borde de abajo, y la malla del terreno solo se hunde (`FLAT.low`), nunca sube. app.js (cinta de
  calles): faldón de tierra desde cada borde de la cinta hasta 15 cm bajo `heightAt0`, con el pie a 1,3 × la caída (0,4–7 m),
  solo donde el borde cuelga más de 25 cm (en la ciudad, casi nunca: no añade triángulos). DESPUÉS: la cinta se apoya en un
  terraplén, sin vacío debajo.
- **app.js RCOL[9]**: pista crema → color tierra (148, 128, 100): ya no asoman polígonos crema por el monte.
- **app.js FS_ROAD, parches**: los recientes se mezclaban a casi negro (0,092): ahora alb·0,88; borde roto con ruido de mundo.
  gracia_calle: desaparece el rectángulo negro de la calzada.
- **app.js FS_ROAD, albedo del asfalto**: Ta 0,10 → 0,125 de base (nuevo); el resto de estados suben igual (+0,025).
- **plazas.js, bandada de palomas** de la Plaça de Catalunya (cajas negras en el cielo): quitada. pcat_pie DESPUÉS sin ellas.
- **plazas.js, banco-farola del Passeig de Gràcia** (bloque blanco quemado): trencadís con albedo ≤ 0,6, cada pieza con su tono.
- **plazas.js, árboles de esferas**: el ciprés (xiprer) y el caso sin malla de trees.js ya no se dibujan; las palmeras de plaza
  (`palm`) son instancias de BCN_TREES (k = 3) cuando hay malla. espanya_dron DESPUÉS: sin los conos oscuros de ciprés.
- Efecto lateral de `urbanSeg` (abajo): algunos tramos abiertos de la Plaça d'Espanya que contaban como «rurales» ahora llevan
  árboles de calle (plátanos) como el resto de la ciudad.

## Hecho pero sin efecto visible confirmado
- **Plaça de Catalunya, estrella**: está en el sombreador (dibujo 9) y desde el dron se lee bien (`probe/t_pcat_top.jpg`); a pie
  (pcat_pie) el disco central sale oscuro y liso. Puntas más anchas (0,25 → 0,32 Rp, Rp 15,5/10 → 16,2/11), menos difuminado y
  tono de mundo a gran escala en las losas: a pie sigue sin leerse. No he encontrado por qué (¿LOD de la malla de la plaza o el
  filtrado de canto?): queda abierto.
- **streets.js**: `urbanSeg` (edificios a < 110 m en 5 de 8 rumbos): en el tejido urbano un tramo nunca es «rural» y las sendas
  de clase 9 llevan acera, no tierra. Es correcto, pero NO era la causa de las plazoletas de tierra de eix_xamfra (siguen igual).

## Pendiente (no resuelto)
- eix_xamfra: plazoletas/isletas de tierra con bancos (no salen del campo de aceras de streets.js; probablemente plaza de
  plazas.js con sauló o relieve sin cubrir: falta sondear); paso de cebra partido en dos (dos calzadas paralelas con su propio
  cruce: hay que alinear las bocas paralelas en ground.js); la línea de detención está bien colocada (antes del paso para quien
  llega) pero a media calzada.
- Arena con moiré (barceloneta_playa): es el terreno (`matTer` en app.js, carril G1V), no un fichero de esta zona.
- Escalones del paseo en zigzag en la playa, rotonda de Espanya, Diagonal con explanadas grises, ROFF apilado en los cruces,
  muaré de los pasos de cebra, explanadas grises (Poblenou, Barceloneta junto al W): sin tocar.

## Para DESARROLLO.md
- La cinta de calzada (app.js) lleva faldón de tierra donde su borde queda > 25 cm sobre `heightAt0` (ladera de Collserola).
- `streets.js`: `urbanSeg(s)` decide «tejido urbano» (nunca rural; clase 9 con acera).
