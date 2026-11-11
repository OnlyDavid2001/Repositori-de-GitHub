# Arreglos tras la crítica de un carril

Un crítico independiente ha revisado el trabajo de tu carril y te pasa sus hallazgos (en tu encargo, en JSON).

1. Lee `DESARROLLO.md` (la sección del carril y §6) y los ficheros del carril.
2. Para CADA hallazgo, por orden de impacto para el usuario: confírmalo tú mismo (lee el código; si es visual, reprodúcelo
   con el arnés y mira la imagen). Si es real, arréglalo en su causa. Si no lo es, recházalo explicando por qué.
   Las «mejoras» hazlas solo si son seguras y te da tiempo a rematarlas bien; los «defectos», todos.
3. No toques ficheros de otros carriles (lo que haga falta ahí, a `peticionesAOtrosCarriles`). No hagas cambios que nadie ha pedido.
4. Verifica: `node --check`, las vistas afectadas sin errores ni avisos de consola y miradas a ojo (antes/después del arreglo),
   y que no has roto nada de las etapas anteriores del carril.
5. Actualiza la sección del carril en `DESARROLLO.md` si cambia algo de lo documentado. Commits con el pie indicado en el encargo común. Árbol limpio.

Informe: qué has arreglado (y cómo se comprueba), qué has rechazado y por qué, qué queda pendiente.
