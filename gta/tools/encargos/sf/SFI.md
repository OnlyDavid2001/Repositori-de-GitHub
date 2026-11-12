# Integración (SFI) y revisión final (SFR) · Sagrada Família, plazas y escalinata

## SFI
Worktree `/home/user/wt/sf-int`, rama `wt-sf-int` (desde la rama principal). Fusiona `wt-sf-basilica` y luego
`wt-sf-entorno`; resuelve los conflictos de `index.html` y `app.js` conservando las dos partes. Comprueba que la escalinata
casa exactamente con la fachada de la Glòria (posición, cota, anchura) y que plazas, escalinata y basílica no se pisan;
si la basílica movió la línea de la fachada, ajusta la escalinata. **Relanza `node tools/mz_partidas.js`** si cambian las
fichas de hitos o los edificios ocultos (las manzanas precalculadas dependen de ellas) y comprueba en el arnés que no
recalcula al cargar. Pruebas: `node --check`; vistas a las 10:30 y a las 23:00 (dron orbitando, desde la Plaça de Gaudí
con el reflejo, desde la Plaça de la Sagrada Família, desde la escalinata, desde la Diagonal mirando a la Glòria, a pie en
tercera persona) sin errores ni avisos; tiempo de carga y triángulos frente a la rama principal. Escribe en DESARROLLO.md
la sección «13. Sagrada Família» con lo de los progresos. Sube.

## SFR
En el mismo worktree: mira las hojas con dureza contra lo que pidió el usuario (`comun.md`: «idéntica a como quedará»,
«nivel hiperrealista») y contra las referencias de `gta/data/sf_ref.json`; lista los 10 defectos más visibles y arregla
todos los que puedas (cualquier fichero), volviendo a capturar. Sube. Monta la hoja final para el usuario en
`/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/sf/rev/hoja_final.jpg` (1280×720 por vista, cada
una comprobada a ojo): la basílica desde el dron por los cuatro lados, de día y de noche; desde el estanque de la Plaça de
Gaudí; desde la Plaça de la Sagrada Família; la escalinata de la Glòria desde abajo y el eje hasta la Diagonal; a pie ante
el Naixement y ante la Passió; y una vista lejana con la ciudad.
