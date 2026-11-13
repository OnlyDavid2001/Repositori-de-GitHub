# G1T · Azoteas, patios, medianeras y huecos; transparencias y parpadeos de edificios e hitos

Worktree `/home/user/wt/g1-tej`, rama `wt-g1-tej`. Ficheros: `rooftops.js`, `manzanas.js`; en `landmarks*.js`,
`sagrada.js`, `gloria.js`, `puerto.js` y `aeropuerto.js` solo arreglos de huecos, parpadeos y transparencias. Lee
`comun.md`, DESARROLLO §6, §10, §11 (azoteas) y §12 (manzanas y patios).

## Lo que dijo el jurado de la línea base (antes de la fase: media 4,4 sobre 10; meta 8)
Dos jurados independientes puntuaron las 24 vistas del banco (`git show origin/wt-g1-banco:gta/tools/views_g1.json`;
capturas ANTES en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/g1/banco/antes/a_<vista>.jpg`, hoja `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/g1/banco/hoja_antes.jpg`, todas las notas y defectos
por vista en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/g1/banco/linea_base.json`, rúbrica en `g1/rubrica.md` de la rama wt-g1-banco). Defectos que caen en tu
carril, de más a menos graves: **atácalos primero** (en la etapa en la que estés, y el crítico y el repaso los comprueban
con esas mismas vistas):
1. Objetos rotos o flotando: cajas negras y un objeto gris en el cielo de la Plaça de Catalunya, una pirámide blanca facetada en Glòries, una banda de cristal translúcida en las azoteas, depósitos flotando (pcat_pie, glories_dron, azoteas).
2. Volúmenes de maqueta: las naves del puerto como cajas grises sin textura (montjuic_puerto, port_vell); el interior del chaflán como solar de tierra con bancos (eix_xamfra).

## Etapa 1 (G1T1) · Inventario de huecos y azoteas
1. **Inventario automático** de lo que está sin textura o con color plano: en el juego (por consola o con `eval` en el
   arnés) recorre materiales y mallas y lista lo que usa color liso sin textura ni detalle; y una pasada de capturas desde
   el dron por toda la ciudad (rejilla por barrios) buscando superficies planas grises, blancas o negras. Deja la lista
   con coordenadas en tu progreso.
2. **Arréglalo por familias**: tejados inclinados con teja árabe; azoteas planas con baldosín catalán, grava o tela
   asfáltica, petos y casetas (ya hay mucho en `rooftops.js`: rellena lo que falte); **medianeras** con textura de
   enfoscado, ladrillo y huellas de edificios derribados; **patios de manzana** con suelo y detalle; rincones sobrantes
   (solares, recintos, trozos entre edificios) interpretados y decorados (grava, aparcamiento, huertos, almacenes…).

## Etapa 2 (G1T2) · Transparencias y parpadeos
1. **Detector de parpadeos**: renderiza la misma vista dos veces con un desplazamiento mínimo de cámara y compara: los
   píxeles que cambian mucho son polígonos que se pisan. Pásalo por azoteas, hitos (los 98), el puerto y el aeropuerto.
   Arregla cada caso (desplazamiento, eliminación del duplicado, orden de dibujo).
2. **Transparencias**: cristales, agua y hojas que se ordenan mal, que tapan lo de detrás o desaparecen; caras al revés.
3. **Hitos con partes a medias** (caras sin textura, huecos, cajas grises): complétalos.

## Etapa 3 (G1T3) · Repaso
Notas del crítico; hoja final a 1280×720 (dron sobre 6 barrios, azoteas a pie de tejado, hitos).
