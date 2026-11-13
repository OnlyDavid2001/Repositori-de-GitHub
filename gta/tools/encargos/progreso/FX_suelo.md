# FX_suelo · Arreglos de la zona «suelo» tras el jurado de INT1

Rama `wt-g1-fx-suelo` (sale de `wt-g1-int`). Capturas en `scratchpad/g1/fx_suelo/` (antes/ a_*, d*/ d_*).

## Hecho (en curso)
- Collserola: diagnóstico con sonda: los bordes de las pistas (clase 9) y caminos (clase 5) quedan 2–3,2 m sobre el relieve en
  bruto (el allanado nivela de lado a lado y en ladera levanta el borde de abajo; el terreno solo se hunde). app.js: faldón
  (talud) de tierra desde cada borde de la cinta hasta 15 cm bajo heightAt0, a 1,3 × la caída (0,4–7 m), solo donde cuelga > 25 cm.
- app.js RCOL[9]: crema → tierra (148, 128, 100).
- app.js FS_ROAD: parches recientes alb·0,88 (antes casi negros) y borde roto con ruido de mundo; asfalto nuevo Ta 0,10 → 0,125.
- streets.js ruralSeg: en el tejido urbano (edificios a < 110 m en 5 de 8 rumbos) nunca es rural (xamfrans de tierra).
- plazas.js: fuera la bandada en vuelo de la Plaça de Catalunya; banco-farola del Passeig de Gràcia con albedo ≤ 0,6 y trencadís.
