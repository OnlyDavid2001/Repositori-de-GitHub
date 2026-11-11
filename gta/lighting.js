/* GTA Barcelona — Iluminación (carril de luz).
   Módulo reservado: aquí irán el HDR lineal con mapeo de tonos, las sombras, la oclusión ambiental, el bloom…
   De momento no hace nada: app.js lo inicia el último (dentro de try/catch) y lo llama cada fotograma.
   window.BCN_LIGHTING = { init(ctx) → { update(P, groundY, dt, frame), setQuality(q), busy(), stats() } }.
   Lo que tiene a mano (DESARROLLO.md §6): ctx.reg.meshes (todas las mallas, con metadata.bcn = { cast, alphaTex, layer }),
   ctx.mats (todos los materiales), ctx.L (sol y cielo de la hora actual), el preludio GLSL y las macros FRAG de app.js. */
(function () {
'use strict';

window.BCN_LIGHTING = { init(ctx) {
  let quality = 1;                                            // 0 apagado · 1 normal · 2 alto
  function update(P, groundY, dt, frame) {}
  function setQuality(q) { quality = q; }
  return { update, setQuality, busy: () => false, stats: () => ({ quality }) };
} };
})();
