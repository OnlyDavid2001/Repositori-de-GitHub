# Etapa INTEGRACIÓN y REVISIÓN (INT, REV) · Noche 2

## INT
Worktree `/home/user/wt/n2-int`, rama `wt-n2-int` (creada desde la rama principal). Fusiona, por este orden, `wt-n2-az`,
`wt-n2-fx`, `wt-n2-arb` y `wt-n2-nat` (`git merge --no-edit`, identidad y pie de `comun.md`). Los conflictos esperables
están en `app.js` (PALETA toca `FS_BLD` y la carga de edificios; NATURALEZA, `FS_TER`/`FS_OUT`/`FS_SEA`), `facades.js`
(PALETA cambia el color base; FACHADAS, el generador), `index.html` (scripts nuevos: `palette.js` justo después de
`geo.js`; `fachadas_estilos.js` antes de `facades.js`; `trees.js` antes de `streets.js`; `rooftops.js` y `nature.js` antes
de `lighting.js`) y DESARROLLO.md: resuélvelos conservando la intención de las dos partes. Lee los informes de las etapas
(van en tu encargo) y sus «peticiones a otros carriles»: haz las que sean pequeñas.
Prueba: `node --check`; arnés a las 10:30 y a las 23:00, a pie en una calle de cada familia grande (eixample, gracia,
ciutat_vella, poblenou, sant_gervasi, nou_barris), desde el aire (aereo_eixample, aereo_alto), Collserola, una playa y la
secuencia de acercamiento de PALETA (el color no cambia); cero errores y avisos de consola. Mide el coste (triángulos,
`BCN.detailStats()`, `BCN.light.stats()`) frente a la rama principal y dilo. Sube la rama.

## REV
En el mismo worktree. Mira las hojas de INT con dureza contra lo que pidió el usuario (`comun.md`): ¿cambia algún color al
acercarse?, ¿se nota el estilo de cada barrio y la variedad?, ¿hay especies de árbol reconocibles?, ¿la montaña tiene
volumen?, ¿la arena es creíble?, ¿algo roto, quemado, flotando, parpadeando o que hunda la fluidez? Lista los 10 defectos
más visibles y arregla todos los que puedas (puedes tocar cualquier fichero), volviendo a capturar lo arreglado. Sube.
Etapas «INT» y «REV».
