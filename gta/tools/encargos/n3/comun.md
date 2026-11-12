# Día 3 · Reglas comunes (léelo entero antes de empezar)

## Qué ha pedido el usuario (resumen fiel)
1. **Azoteas de noche**: hoy quedan demasiado oscuras. «No digo que se vean, pero que no quede tan oscuro».
2. **Edificios que quedan por hacer**: muchos quedaron perfectos, pero otros siguen siendo cubos simples (sin fachada de
   detalle o sin azotea). Todos esos, interprétalos como viviendas (o lo que encaje) y dales fachada y azotea. En el
   Eixample hay manzanas enteras modeladas como un solo edificio: fachada perfecta pero azotea con una simple textura. Si
   hace falta, ahueca el bloque y haz el interior de manzana. Que no quede ningún edificio a medias.
3. **Todas las plazas de Barcelona**, resueltas y completas, mínimamente detalladas y fieles a la realidad, con especial
   énfasis en Catalunya, Espanya, Glòries y Lesseps, y también Reial, la Catedral, etc.
4. **Tiendas**: no tocarlas, pero fundir su cromatismo con el color de la fachada de su edificio (más uniforme).
5. **Asfalto y aceras**: 5–6 estados de asfalto (nuevo, seminuevo, gastado normal, bastante gastado, muy gastado) y 5–6
   modelos de baldosa (la estándar, la del Passeig de Gràcia, la de la Diagonal, una más nueva, una sucia y dejada…),
   repartidos por calle y por el nivel económico del barrio (Diagonal seminueva, Sarrià y Tres Torres nuevas, Cornellà y
   zonas humildes más maltrechas).
6. **Paradas de bus y bocas de metro** de todas y cada una de las líneas, con la forma y la profundidad de la boca (sin
   modelar el metro por dentro).
7. **Puerto, aeropuerto y zona de mercancías**, rehechos a partir de lo que hay, con muchísimo detalle.

Trabajo largo (~10 h) sin supervisión: el usuario quiere que esté BIEN hecho.

## Datos y coordenadas
- El mundo del juego es UTM huso 31N (ETRS89) trasladado: **x = E − 418 400,7 ; z = N − 4 567 997,6** (error ~11 m rms);
  la cota sale de `heightAt(x, z)`. Para pasar de latitud/longitud a UTM puedes instalar `pyproj` o `utm` con pip.
- **Nominatim** (https://nominatim.openstreetmap.org) está permitido: como mucho 1 petición por segundo, cabecera
  `User-Agent: BarcelonaGame/1.0 (prototipo)`, y `polygon_geojson=1` da el contorno de plazas y recintos. Guarda lo que
  descargues en `gta/data/<tu_etapa>_*.json` y confírmalo: el juego NO puede depender de la red. Overpass NO funciona desde
  aquí. Wikimedia Commons sí (miniaturas de 960 px, suele limitar peticiones) para fotos de referencia, solo en scratchpad.
- Lo que ya hay en los datos: `META.barris` (73 barrios con polígono), `META.poi`, la ortofoto del suelo, los edificios
  (registro BREC, plantas), el viario (clases de calle y anchos), el campo de aceras de `streets.js` (con plazas y calles
  peatonales enlosadas) y los hitos (`BCN.lm`, sus huellas).

## Familias de barrio y nivel económico
Las familias de `n2/comun.md` (eixample, gracia, ciutat_vella, raval, barceloneta, poble_sec, sants, les_corts,
sant_gervasi, sarria_pedralbes, poblenou, sant_andreu, horta_guinardo, nou_barris, periferia) siguen valiendo
(`BCN_PAL.fam(b)`, `BCN_BARRI.at`). Para el nivel económico, usa una tabla por barrio (renta aproximada): muy alto
(Pedralbes, Sarrià, les Tres Torres, Sant Gervasi - Galvany y la Bonanova, Vallvidrera), alto (Putxet, Dreta de l'Eixample,
les Corts, Diagonal Mar), medio (el resto del Eixample, Gràcia, Sants, Poblenou, Sant Andreu, Horta…), bajo (Raval,
Barceloneta, Besòs i el Maresme, Bon Pastor, Baró de Viver, Trinitat Vella) y muy bajo (Ciutat Meridiana, Torre Baró,
Vallbona, Trinitat Nova, les Roquetes, Verdun) y periferia popular (L'Hospitalet, Cornellà, Badalona Sud). Quien la
necesite la deja en `palette.js` o en su propio módulo como `BCN_RENTA` y lo dice en el informe.

## Cómo se trabaja
- Cada etapa tiene su worktree y su rama; **solo tocas los ficheros que dice tu encargo** (si necesitas algo de otro,
  apúntalo en «peticiones a otros carriles»). Módulos nuevos: añade tu `<script>` en `index.html` antes de `lighting.js` y
  tu `addMod(...)` en `app.js` (una sola línea) junto a los demás; lo demás de `app.js` no es tuyo salvo que tu encargo lo
  diga.
- Lee en `gta/DESARROLLO.md` lo que te diga tu encargo (§2 arquitectura, §3 primitivas, §6 contratos de celda, §7.6
  noche, §9 mobiliario, §10 hitos, §11 noche 2). La documentación de DESARROLLO la escribe la integración: tú déjala en
  tu fichero de progreso (sección «Para DESARROLLO.md»).
- **Se puede cortar** (límite de uso, reinicio): confirma y sube (`git push`) con frecuencia y mantén al día
  `gta/tools/encargos/progreso/<ETAPA>.md`. Si al empezar ya existe con trabajo de una ejecución anterior, continúa desde ahí.
- Commits con el pie `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` y
  `Claude-Session: https://claude.ai/code/session_01Q64vL5u6wYiVTYwrzNxXbb`, identidad
  `git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit …`.
- **Arnés** (`node tools/shot.js`, cabecera del fichero; `tools/views*.json`). La máquina tiene 4 núcleos para 6 agentes:
  SIZE=480x270 o 640x360, pocas vistas por ejecución, en segundo plano si va a tardar más de ~9 min. Capturas en
  `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/n3/<etapa>/`. **Nunca** `pkill` ni `killall`.
- Rendimiento: nada de trabajo por fotograma, niveles de detalle con fundido tramado (`dith`), instancias o mallas por
  celda, azar por ámbito (`seed(...)`); mide triángulos y coste antes y después y dilo. La fluidez importa.
- Día y noche: lo nuevo debe verse bien a las 10:30 y a las 23:00 con las reglas del preludio (`uDusk`, `uNight`, `uLate`,
  `uGlow`, `homeOn`, `shopOn`). La noche está calibrada con fotos reales: no la estropees.
- **Sin marcas ni logotipos**: nada del logotipo de TMB ni de Aena, ni libreas de aerolíneas, ni nombres de navieras o
  empresas; textos y rótulos genéricos y en catalán («METRO», «BUS», números de línea y colores de línea sí).

## Entrega de cada etapa
`node --check` de todos los .js, cero errores y avisos de consola en tus capturas, hoja ANTES/DESPUÉS en tu carpeta de
scratchpad, árbol limpio, todo subido, progreso al día e informe estructurado sincero (lo flojo, dilo).
