# Fase A — verificación independiente (código + regresión visual)

No has escrito este código. **No modifiques ficheros de código** (solo generas capturas).
La fase A reestructuró el juego en módulos (A1, que debía salir idéntica píxel a píxel) y después cambió contratos de
base (A2). Las especificaciones están en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/briefs/A1.md` y `A2.md`;
el resultado, en los commits de tu rama posteriores a `7d4b915` (`git log 7d4b915..HEAD`, `git diff 7d4b915 HEAD -- gta`).

## Parte 1 — Revisión adversarial del código (errores reales, no estilo)
- código perdido o duplicado al mover (compara función por función con `7d4b915`);
- incoherencias entre las capas BASE y ORNAMENTO (azar consumido distinto según la capa, ámbitos mal sembrados, valores sacados dentro de un `if (W1)`);
- contratos incumplidos: escrituras directas de `gl_FragColor`, materiales sin `mkMat`, mallas sin `reg`, vertex shaders que
  no escriben `vPos`, hooks con firmas distintas a las documentadas en `DESARROLLO.md` §6;
- fugas o estados colgados al descargar celdas (mallas, huecos del atlas, registro de mallas, banderas de edificio), trabajos
  cancelados a medias, excepciones en casos límite (celdas sin edificios o sin calles, anillos interiores, tramos de menos de 1 m);
- GLSL frágil (palabras reservadas, divisiones por cero, precisión con coordenadas de mundo, cosas que solo compilan en WebGL2 sin protección);
- que un fallo de un módulo no tumbe la ciudad; que `DESARROLLO.md` §6 diga la verdad.

## Parte 2 — Regresión visual
1. Renderiza con el código actual las 22 vistas de `tools/views.json` en PNG (tres o cuatro tandas) guardándolas como
   `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/golden_a/g_<vista>.png` (serán la referencia «antes» de los carriles).
2. Monta lado a lado cada una con su referencia original (`…/scratchpad/golden/g_<vista>.png`) y MÍRALAS. Cambios esperados
   por A2 y solo esos: puertas y escaparates apoyan exactamente en la acera; mobiliario redondo sin facetas; el azar por
   ámbito recoloca detalles aleatorios (qué persiana baja, qué maceta), con el mismo carácter general.
3. Prueba además: a pie al atardecer (`"hour":20.25`) y por la mañana (`"hour":8`); modos `"fx":0,"st":0` y `"fx":2,"st":2`; una calle en pendiente a pie.

Informa de cada error o regresión REAL (huecos, z-fighting, ornamento desalineado respecto a la base, carpinterías flotando,
puertas hundidas o en el aire, mobiliario mal sombreado o del revés, cosas desaparecidas, errores o avisos de consola), con
fichero y lugar o vista y recorte ampliado, por qué es un error, cómo arreglarlo y tu confianza (0–1). Descarta lo que no puedas justificar.
