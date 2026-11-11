/* GTA Barcelona — Iluminación (carril de luz).
   Módulo reservado: aquí irán el HDR lineal con mapeo de tonos, las sombras, la oclusión ambiental, el bloom…
   De momento no hace nada: app.js lo inicia el último (dentro de try/catch) y lo llama cada fotograma.
   window.BCN_LIGHTING = { init(ctx) → { update(P, groundY, dt, frame), setQuality(q), busy(), stats() } }.
   Lo que tiene a mano (DESARROLLO.md §6): ctx.reg.meshes (todas las mallas, con metadata.bcn = { cast, alphaTex, layer }),
   ctx.mats (todos los materiales, con los uniformes globales: sol, cielo, niebla, uDusk, uCam, uTime), ctx.L (sol, cielo y
   dusk de la hora actual) y, en el preludio GLSL de app.js, el contrato de sombreado (lit, shade, envRefl, emit) y las
   salidas FRAG / FRAG_NOFOG / FRAGA, por donde pasa el color de todos los shaders. */
(function () {
'use strict';

window.BCN_LIGHTING = { init(ctx) {
  let quality = 1;                                            // 0 apagado · 1 normal · 2 alto
  function update(P, groundY, dt, frame) {}
  function setQuality(q) { quality = q; }
  return { update, setQuality, busy: () => false, stats: () => ({ quality }) };
} };
})();
