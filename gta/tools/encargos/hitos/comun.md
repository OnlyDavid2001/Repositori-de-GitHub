# Hitos de Barcelona — encargo común (léelo entero)

«GTA Barcelona» es un visor/juego web de Barcelona entera (Babylon.js 9.35 con ShaderMaterial propios). Los edificios
son volúmenes extruidos de datos reales (OSM) con un estilo genérico; de cerca, las viviendas ganan una fachada de detalle.
Los edificios y monumentos singulares hoy NO se distinguen: son cajas con una fachada estándar (o ni existen, como Colom).

## Lo que pide el usuario (literal, resumido)
«Selecciona una cincuentena, un centenar, dos centenares, lo que consideres: rascacielos, monumentos, cosas como el
monumento de Colón, lo de Montjuïc… y, con muy poca calidad gráfica, hazlos un poco mejor. La Pedrera, que no sea una
fachada estándar: que sea la Pedrera. El Camp Nou, que sea el Camp Nou. La Sagrada Família, con el diseño ya acabado,
como si estuviera terminada; lo mismo el Camp Nou. Y el edificio de la Caixa, la Torre Agbar, los edificios de Diagonal
Mar, la Torre de Collserola, el Park Güell, el Castillo de Montjuïc… Haz un listado, guárdalo, y empieza a hacer todo eso
un poco realista. No hace falta una calidad gráfica espectacular: simplemente que se parezca un poco.»

**Criterio de éxito**: que alguien de Barcelona, viéndolo desde el aire o desde la calle a 100–500 m, diga «eso es la
Pedrera / el Camp Nou / la torre de Collserola». Silueta, proporciones, color y dos o tres rasgos inconfundibles. Pocos
polígonos. Nada de detalle fino. Mejor 100 hitos reconocibles que 20 perfectos.

## Arquitectura (decidida)
- Módulo nuevo `gta/landmarks.js` (núcleo) + ficheros de lote `gta/landmarks_a.js … landmarks_e.js`. Cada lote declara
  SUS hitos con `BCN_LM.add({...})`: ficha (id, nombre, posición, giro, edificios que sustituye, luz de noche) y su
  función constructora. No hay catálogo compartido que editar a la vez: cada agente toca solo su fichero.
- El núcleo: oculta los volúmenes genéricos que sustituye cada hito, crea una malla por hito con el constructor de
  geometría de `geo.js` (GB y sus primitivas: box, obox, rev, tube, sphere, cyl, lattice…), un material propio hecho con
  `mkMat` (usa `lit`/`shade`/`emit`/`FRAG` del preludio: recibe HDR, sombras, niebla y la noche sin hacer nada), registra
  las mallas con `reg` (proyectan sombra) y ofrece una biblioteca de arquetipos (torre de vidrio, aguja, cúpula, nave con
  campanario, chimenea, graderío…) para que la mayoría de hitos sean unas pocas líneas.
- Tres niveles: **A** modelo propio cuidado (los iconos) · **B** arquetipo con parámetros · **C** solo retoque del
  volumen que ya existe (color, estilo, altura).
- Los hitos se ven desde toda la ciudad: sus mallas están siempre cargadas (sin niveles de detalle); presupuesto total
  ≈ 400 000 triángulos entre todos (un icono, 3 000–12 000; uno normal, 300–2 000).
- De noche: `noche: 'focos'` (monumento iluminado con luz cálida desde abajo), `'led'` (Torre Glòries y similares),
  `'ventanas'` (oficinas y hoteles: celdas encendidas con la regla `homeOn`) o `'nada'`. Todo con `uDusk`.
- Nada de marcas ni logotipos reales (los nombres de los sitios sí; rótulos y escudos, no). Textos en castellano en el
  código y la documentación; nombres de hitos en catalán.

## Datos y coordenadas
- Mundo del juego: metros, X hacia el este, Z hacia el norte, Y arriba. `BCN.heightAt(x, z)` da la cota del terreno.
- `gta/data/meta.json` trae 31 puntos de interés con su posición en el mundo (`poi`); con ellos y sus coordenadas
  geográficas conocidas se ajusta la conversión lat/lon → mundo (es una proyección local casi lineal).
- El registro de edificios (`BREC` en `app.js`) y el índice espacial que publica `facades.js` en `ctx.city` permiten
  saber qué edificio(s) hay en un punto, con su planta, altura y clase.

## Reglas de trabajo
- Lee `gta/tools/encargos/reglas2.md` (reanudación tras cortes, commits y push frecuentes, economía de llamadas) y, de
  `gta/DESARROLLO.md`, los §2 (arnés de capturas), §4 (errores ya cometidos: ojo a los «;» y a las palabras reservadas en
  GLSL) y §6.4–6.7 (preludio, `mkMat`, `reg`, `BCN_GEO`). Tu fichero de progreso: `gta/tools/encargos/progreso/<ETAPA>.md`.
- Trabaja solo en TU worktree y en TUS ficheros. Commits con el pie
  `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>` y `Claude-Session: https://claude.ai/code/session_01Q64vL5u6wYiVTYwrzNxXbb`
  (usa `git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit`), y `git push origin <tu-rama>` tras cada hito.
- El arnés es lento (primera vista de cada ejecución, 2–6 min; las siguientes, 0,5–2 min): pocas vistas por ejecución,
  `SIZE=640x360 FMT=jpg`, hojas de contacto (una imagen con muchas vistas) en vez de abrir capturas sueltas, y espera con
  UN solo comando. Las vistas lejanas o aéreas necesitan `BCN.st.maxDist=40000` en su campo `eval`.
- Tope orientativo: 60–80 llamadas a herramientas. Si algo se resiste más de 8–10 llamadas, déjalo en su versión
  sencilla que funcione, anótalo y sigue.
- Al terminar: `node --check` de los .js, sin errores ni avisos de consola, árbol limpio, todo subido, progreso al día, y
  un informe concreto y sincero (lo que no se parece, dilo).
