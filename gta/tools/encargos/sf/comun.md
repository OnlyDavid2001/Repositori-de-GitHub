# Sagrada Família acabada, sus dos plazas y la escalinata de la Glòria · Reglas comunes (léelo entero)

## Qué ha pedido el usuario (textual, resumido)
«Rehaz de nuevo la Sagrada Família para que llegue a un nivel prácticamente extremo de realismo. Guíate de los planos y
los documentos 3D que hay de cómo será cuando esté terminada, de lo que sea necesario: la quiero idéntica a como quedará.
Y haz también de nuevo, con un nivel de detalle brutal, las dos plazas laterales que tiene (Plaça de Gaudí y Plaça de la
Sagrada Família) y la escalinata de la Glòria que conecta con la Diagonal. Nivel hiperrealista.»
Es el monumento más importante del juego. Se mira desde el dron, desde las plazas, desde la calle en tercera persona y de
noche. Fidelidad de forma y proporción primero; detalle después; todo con niveles de detalle para que siga fluido.

## Datos y coordenadas
- Mundo = UTM 31N (ETRS89) trasladado: **x = E − 418 400,7 ; z = N − 4 567 997,6**; cota con `heightAt(x, z)` (cota de
  calle allanada; `heightAt0` es la del MDT). `pyproj` está instalado.
- Ficha actual: `landmarks_a.js`, `id: 'sagrada_familia'`, centro (12597,9; 15875,2), `rot: 136`, alto 172,5, ancho 84,
  largo 142, `edificios: ED.sagrada_familia` (volúmenes del registro que oculta). Ejes locales: **+Z = rumbo 136° = hacia la
  fachada de la Glòria (c/ Mallorca)**; −Z = ábside (c/ Provença); −X = Naixement (c/ Marina, hacia la Plaça de Gaudí);
  +X = Passió (c/ Sardenya, hacia la Plaça de la Sagrada Família). **La línea de la fachada de la Glòria está en z local
  = +71 m** (si la basílica la mueve, lo dice en su progreso y la integración ajusta la escalinata).
- **Referencias**: búsqueda web con las herramientas Firecrawl o Tavily (cárgalas con ToolSearch: `firecrawl_search`,
  `firecrawl_scrape`, `tavily_search`, `tavily_extract`): web oficial de la basílica, Wikipedia (ca, es, en), prensa y
  documentos técnicos (alturas de cada torre, plantas, alzados, maquetas, el proyecto de la Glòria y de su escalinata).
  **Nominatim** (1 petición/s, `User-Agent: BarcelonaGame/1.0 (prototipo)`, `polygon_geojson=1`) para contornos y puntos.
  Wikimedia Commons para fotos de referencia (miniaturas, limita peticiones), solo en el scratchpad. **No importes modelos
  3D de terceros**: modela tú a partir de medidas, planos y descripciones públicas. Guarda los datos que el juego use en
  `gta/data/sf_*.json` y confírmalos: el juego no puede depender de la red.

## Cómo se trabaja
- Cada carril tiene su worktree y su rama; **solo tocas los ficheros de tu encargo**; lo de otros, en «peticiones a otros
  carriles». Identidad `git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit …` y pie
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_01Q64vL5u6wYiVTYwrzNxXbb`.
- Lee en `gta/DESARROLLO.md` §2 (arquitectura), §3 (primitivas), §6, §7.6 (noche), §10 (hitos: `BCN_LM`, fichas, LOD) y
  §12 (día 3: plazas.js, aeropuerto.js como ejemplo de módulo que sustituye el constructor de una ficha).
- **Se puede cortar** (límite de uso, reinicio): confirma y sube a menudo y mantén al día
  `gta/tools/encargos/progreso/<ETAPA>.md`; si al empezar ya existe, continúa desde ahí.
- **Arnés** `node tools/shot.js` (cabecera del fichero). La máquina es compartida: SIZE=640x360 (960x540 para las hojas),
  pocas vistas por ejecución, en segundo plano si tarda; capturas en
  `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/sf/<etapa>/`. Nunca `pkill` ni `killall`.
- **Rendimiento**: es un hito de lujo y puede gastar más que los demás, pero con niveles de detalle: lejos (> 1,5 km) una
  silueta fiel y barata; media distancia las torres y fachadas con su volumen; cerca (< 300 m) el detalle escultórico,
  y mallas aparte con `addLODLevel` o equivalente para lo fino. Nada por fotograma. Mide triángulos dibujados desde el
  dron, desde las plazas y a pie, antes y después, y dilo.
- Día y noche: perfecta a las 10:30 y a las 23:00 (preludio: `uDusk`, `uNight`, `uLate`, `uGlow`), sin estropear la luz
  calibrada del resto de la ciudad.
- Sin marcas comerciales; rótulos en catalán.

## Entrega de cada etapa
`node --check` de todos los .js, cero errores y avisos de consola, hoja ANTES/DESPUÉS en tu carpeta, árbol limpio, todo
subido, progreso al día (con sección «Para DESARROLLO.md») e informe estructurado sincero.
