# Hitos · Integración, revisión y arreglos

Worktree de las tres etapas: `/home/user/wt/hitos` (rama `wt-hitos`). Lee primero `gta/tools/encargos/hitos/comun.md` y
el §10 de `gta/DESARROLLO.md`.

## INT — Integración
1. Fusiona en `wt-hitos` las ramas de los lotes que existan (`wt-hitos-a` … `wt-hitos-e`); cada una toca solo su
   fichero, así que no debería haber conflictos (si los hay en el progreso o en DESARROLLO, quédate con las dos partes).
2. `node --check` de todos los .js; arnés: `aereo_alto`, `aereo_eixample`, `port_vell`, `eix_acera`, `rambla_pie` de día y
   `aereo_alto` y `port_vell` a las 22:00 (con `BCN.st.maxDist=40000` en las aéreas), sin errores ni avisos de consola.
3. `BCN.lm.stats()`: hitos construidos, triángulos totales (objetivo ≤ 400 000) y constructores que fallan. Arregla los
   fallos sencillos; los hitos que rompan y no se arreglen en pocas llamadas, desactívalos (que quede el volumen genérico).
4. Hojas de contacto de TODOS los hitos, por lotes, de día, en `<scratchpad>/hitos/hoja_<lote>.jpg`, y una de noche con
   los de nivel A. Commit y push. Informe: qué hay, qué falla, rutas de las hojas.

## REV — Revisión (no edites código)
Mira las hojas de contacto y, donde dudes, saca una vista más cercana. Para cada hito decide: ¿se reconoce de un
vistazo? Devuelve la lista de los que NO, ordenada por importancia del hito (primero los iconos: Sagrada Família, Camp
Nou, Torre Glòries, Pedrera, Colom, torre de Collserola, MNAC, castillo…), con lo que falla en concreto (silueta,
proporción, color, posición, giro, tamaño, flota o se hunde, luz de noche) y el arreglo que propones. Máximo 25, los
que más se notan. Sé exigente con los iconos e indulgente con los de nivel C.

## FIX — Arreglos
Con la lista de la revisión: confirma cada punto con una captura, arréglalo en el fichero del lote que corresponda y
vuelve a mirar. Empieza por los iconos. Lo que no tenga arreglo razonable, déjalo y dilo. Al terminar: `node --check`,
las vistas generales de INT sin errores, hojas de contacto actualizadas, commit y push, y un informe con lo arreglado y
lo que queda flojo.
