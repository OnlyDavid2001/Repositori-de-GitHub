# Etapa INTEGRACIÓN, REVISIÓN y ARREGLOS (INT, REV) · Día 3

## INT
Worktree `/home/user/wt/n3-int`, rama `wt-n3-int` (desde la rama principal). Fusiona, por este orden: `wt-n3-edif`,
`wt-n3-suelos`, `wt-n3-transp`, `wt-n3-plazas`, `wt-n3-puerto` y `wt-n3-aero` (`git merge --no-edit`, identidad y pie de
`comun.md`). Conflictos esperables en `app.js` (líneas `addMod`, `FS_BLD` de EDIFICIOS frente a `FS_ROAD` de SUELOS),
`index.html` (scripts nuevos antes de `lighting.js`) y `streets.js`: resuélvelos conservando la intención de las dos
partes. Lee los informes de las etapas (en tu encargo) y sus «peticiones a otros carriles» (haz las pequeñas).
Comprueba que las plazas, las bocas de metro y paradas, el mobiliario y las terrazas no se pisan entre sí ni con el
pavimento nuevo, y que el puerto y el aeropuerto no chocan con la vegetación ni con los hitos.
Prueba: `node --check`; arnés a las 10:30 y a las 23:00 en Plaça de Catalunya, una calle del Eixample con tiendas, una
boca de metro, el puerto, el aeropuerto desde el aire, una manzana del Eixample desde el dron y la ciudad desde el aire;
cero errores y avisos de consola; mide el coste frente a la rama principal y dilo. Escribe en DESARROLLO.md una sección
«12. Día 3» con lo que dejaron las etapas en sus progresos (sección «Para DESARROLLO.md»). Sube la rama.

## REV
En el mismo worktree: mira las hojas con dureza contra lo que pidió el usuario (`comun.md`), lista los 10 defectos más
visibles y arregla todos los que puedas (puedes tocar cualquier fichero), volviendo a capturar. Sube. Monta una hoja
final para el usuario con lo mejor del día (de día y de noche) en
`/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/n3/rev/hoja_final.jpg`.
