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

## Referencias del usuario (fotos que ha mandado; obligatorias para SFI y SFR)
En `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/sf/ref/` hay tres fotos del usuario,
descritas en la sección «Referencias del usuario» de `SF.md` (rama de la basílica): los remates de las torres a pleno sol
(retícula de rombos en la piel, cruz blanca de cuatro brazos, estrella de 12 puntas, símbolos alados de los evangelistas,
pináculos de trencadís de colores), la noche con la cruz lanzando haces de luz al cielo, y la maqueta de la fachada de la
Glòria (cuatro torres, cascada de linternas en gota sobre columnas arborescentes, dos torres laterales bajas, piñones con
celosía de panal y basamento con escalinata). **SFI**: comprueba que la escalinata de ENTORNO casa con el basamento de la
Glòria de esa maqueta. **SFR**: míralas con Read y empieza tus 10 defectos por las diferencias con ellas (encuadres
parecidos a los de las fotos, de día y a las 23:00); la hoja final debe incluir una vista lo más parecida posible a cada
una de las tres fotos.

## Notas del coordinador tras ver la primera pasada de SF3 (para SFR, prioridad alta)
Capturas en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/sf/vistazo/` (`g_*.jpg`, vistas en
`v.json` de esa carpeta). Comparadas con las fotos del usuario:
1. **Evangelistas**: sus torres acaban en esferas lisas; en la foto acaban en sus símbolos, esculturas blancas y doradas
   con las alas abiertas (ángel, león, buey y águila). Hazlas reconocibles desde los remates y desde el dron.
2. **Noche desde el dron** (`g_dron_gloria_n.jpg`): la basílica entera sale casi blanca y uniforme. En el render de
   referencia es dorada, con la retícula encendida, las aristas marcadas y luz fría azulada en pináculos y cubiertas de
   las naves; recupera ese contraste sin apagarla. La cruz con sus haces está bien: consérvala.
3. **Torre de Jesucrist**: en la foto es un cono largo que se va estrechando poco a poco; compárala con
   `usuario_torres_dia.jpg` y corrige el perfil si sale cilíndrica con una punta.

## Biblioteca de fotos reales (para SFR: úsala para comparar elemento a elemento)
En `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/sf/ref_web/` se está montando una biblioteca
de fotos de referencia por elemento: `fachadas/`, `torres/` y `pinaculos/`, cada carpeta con un `INDEX.md` que dice qué
muestra cada foto y qué hay que copiar. Si al empezar SFR ya existen, compara tus capturas con ellas (mismo encuadre
aproximado) y empieza tus arreglos por las diferencias más visibles en las fachadas, las torres y los pináculos. Para
capturar más fotos, el método está en la cabecera de esos INDEX.md (Firecrawl: captura de la página y descarga desde
storage.googleapis.com).
