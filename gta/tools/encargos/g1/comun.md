# Fase gráfica 1 · Del 5 al 8 (reglas comunes: léelo entero antes de empezar)

## El objetivo
El usuario puntúa hoy el juego con un **5 a nivel gráfico** y quiere **como mínimo un 8**. Es la fase 0: solo gráficos
(nada de jugabilidad; coches y personas se harán más adelante). Trabajo largo (10–12 h) sin supervisión mientras duerme:
aprovecha el tiempo y hazlo BIEN. Donde se juega es **a pie de calle y en tercera persona**: eso es lo que más cuenta.

## Lo que ha pedido el usuario (fiel; manda sobre todo lo demás)
1. **Luz de cine** (el salto más grande): cielo con atmósfera y bruma que azulea lo lejano; el cielo reflejado en cristales
   y superficies; sombras suaves y con más alcance; sombra de contacto en los rincones; bordes sin parpadeo; exposición
   automática y un color mediterráneo cálido. De día, al atardecer y de noche (la noche está calibrada con fotos reales del
   usuario: no la estropees).
2. **Materiales reales**: asfalto con desgaste y marcas; el panot de flor en las aceras; piedra y estuco en las fachadas;
   tejas; ventanas con reflejo y un interior falso detrás.
3. **Fachadas a pie de calle** (Eixample y Ciutat Vella sobre todo): balcones de forja en 3D, cornisas, persianas, portales,
   bajos comerciales con toldos y rótulos en catalán (sin marcas).
4. **Árboles y mobiliario urbano**: «elimina todos los árboles que no estén un poco currados; elimínalos todos, todos,
   todos»; los que queden, de verdad (plátanos con hojas que se mueven con el viento, palmeras, pinos). El mobiliario,
   «reasignado de verdad donde toca» (farolas de Barcelona, bancos, papeleras, semáforos, fuentes).
5. **Mar y lejanía**: agua con olas y el brillo del sol, playas, y un horizonte de ciudad que se pierde en la bruma en vez de
   cortarse.
6. **Bugs, huecos y transparencias**: «que no quede un lugar sin pasar a ser texturas ni polígonos desarrollados»: azoteas,
   rincones que no son ni asfalto ni acera, lejos o dentro de la ciudad: interprétalos y decóralos. Fuera los polígonos que
   se pisan y parpadean («te mueves un poco y salta un polígono») en caminos de montaña, aceras, calles, asfalto y
   fachadas. Fuera las transparencias que fallan.
7. **Calles y caminos planos y transitables**: todo lo que sea camino, asfalto, carretera o acera, lo más plano posible y sin
   irregularidades; sin inclinación lateral (en Collserola, aunque sea de tierra, el camino recto y nivelado para que más
   adelante anden NPC). **Fuera cualquier gente parada** (las personas y los coches vendrán después).
8. **Cruces y rotondas coherentes**: las marcas viales (pasos de cebra, líneas de detención, carriles, flechas, marcas de
   rotonda) tienen que leerse como un cruce de verdad, no como un copiar-pegar arreglado a medias.
9. **Lejanía de Collserola**: mucho menos pixelado en los árboles lejanos, algún arbusto, un poco de hierba y una buena
   textura del monte.

## Cómo se mide (vale para todos)
El carril G1B monta el **banco de pruebas**: `gta/tools/views_g1.json` (unas 24 vistas fijas: a pie de calle de día y de
noche, dron, lejos, montaña y mar), hojas ANTES/DESPUÉS y un jurado de agentes que puntúa cada vista del 1 al 10 con
`gta/tools/encargos/g1/rubrica.md`, comparando con fotos reales. **Meta: media ≥ 8 y ninguna vista por debajo de 7.**
En cuanto exista `views_g1.json` (en la rama `wt-g1-banco`; `git show origin/wt-g1-banco:gta/tools/views_g1.json`), usa las
vistas que toquen tu carril para tus ANTES/DESPUÉS, además de las tuyas.

## Fotos del usuario (la referencia principal de luz, color, mar y lejanía)
Las ha mandado el usuario para esta fase: están en
`/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/g1/ref_usuario/` (ábrelas y míralas bien).
- `noche_dron_barceloneta.jpg`: de noche desde un dron sobre la Barceloneta. Cielo azul profundo (no negro); la ciudad en
  naranja cálido (farolas de sodio y ventanas); el Passeig Marítim con las palmeras iluminadas; reflejos largos de las luces
  en el mar; la arena iluminada junto al paseo; Montjuïc oscuro con luces; el puerto encendido.
- `atardecer_mar_vila_olimpica.jpg`: atardecer desde el mar. Cielo en degradado de azul a naranja en el horizonte, con nubes
  iluminadas; mar azul oscuro con olas suaves que reflejan el cielo; ristras naranjas del paseo; montañas en silueta con bruma.
- `dia_carmel_eixample_mar.jpg`: de día desde el Carmel. Perspectiva aérea fuerte (la ciudad se aclara y se azulea hacia el
  mar); franja de mar turquesa y horizonte pálido; tejados y fachadas ocres, terracota, beige y ladrillo; pinos en primer
  plano (masa densa y oscura de agujas finas).
- `dia_desde_mar.jpg`: de día desde el mar. Mar azul intenso con oleaje menudo; cielo pálido y algo amarillento junto al
  horizonte; Collserola gris azulada en la bruma; ciudad baja y beige.
Úsalas para calibrar el cielo, la bruma y la perspectiva aérea, el color del mar, la paleta de la ciudad de día y de noche y
el aspecto de los pinos. Los jurados comparan con ellas.

## Carriles y ficheros (solo tocas los tuyos)
| carril | qué | ficheros |
|---|---|---|
| G1L | luz de cine; mar y lejanía | `lighting.js`; en `app.js`: cielo, preludio y funciones de luz (`shade`, `envRefl`…), niebla y perspectiva aérea, sombras, oclusión, postproceso y mar |
| G1F | materiales y detalle de las fachadas a pie de calle; ventanas | `facades.js`, `fachadas_estilos.js`, `details.js`, `interiors.js` |
| G1T | azoteas, patios, medianeras y huecos sin textura; transparencias y parpadeos de edificios e hitos | `rooftops.js`, `manzanas.js`; en `landmarks*.js`, `sagrada.js`, `gloria.js`, `puerto.js` y `aeropuerto.js` solo arreglos de huecos, parpadeos y transparencias |
| G1S | suelo: asfalto, panot, bordillos; marcas viales en cruces y rotondas; calles y caminos planos; parpadeos y rincones sin textura del suelo | `streets.js`, `ground.js`, `suelos.js`, `plazas.js`, `transporte.js` |
| G1V | árboles, monte (terreno, arbustos, hierba), mobiliario; fuera la gente parada | `trees.js`, `nature.js`, `furniture.js`; en `app.js` solo el material del terreno (`matTer` y su shader); para quitar gente parada, el mínimo imprescindible allí donde esté |
| G1B | banco de pruebas y jurado | `tools/views_g1.json`, `tools/encargos/g1/rubrica.md`, scripts de hojas en `tools/` |

- `palette.js` y `geo.js`: solo añadir, al final, en una sección con el nombre de tu carril. `index.html`: solo tu
  `<script>`. `app.js`: aparte de lo que diga la tabla, como mucho tu línea `addMod(...)`. `DESARROLLO.md` lo escribe la
  integración: deja tus notas en tu progreso (sección «Para DESARROLLO.md»).
- Si necesitas algo de otro carril, apúntalo en «peticiones a otros carriles» del informe; no lo toques.

## Texturas
- Generadas (Python con numpy/PIL, o en el propio shader) o CC0 (ambientCG, Poly Haven) si se pueden bajar desde aquí;
  siempre guardadas en `gta/data/tex/` y confirmadas: **el juego no puede depender de la red**. Formato webp o png (nunca
  .gz: el artefacto publicado no los sirve), como mucho 2048 px y 4 MB por fichero, y el total de la fase ≤ 40 MB.
- Mapas de normales y de rugosidad bienvenidos; mipmaps y filtrado anisótropo; nada de mosaico que se note (mezcla de
  escalas, variación por mundo, ruido).

## Rendimiento
Fluido en un portátil normal: nada de trabajo por fotograma; niveles de detalle con fundido tramado (`dith`); instancias o
mallas por celda; azar por ámbito (`seed(...)`). Mide triángulos y tiempo de fotograma antes y después (el arnés da `stats`).
Lo caro, bajo el nivel de calidad (`BCN.light.quality`: alta / media / baja), y que «media» siga fluida.

## Datos, coordenadas y fotos
- Mundo en UTM 31N (ETRS89) trasladado: **x = E − 418 400,7 ; z = N − 4 567 997,6**; la cota sale de `heightAt(x, z)`
  (calles allanadas) o `heightAt0` (relieve en bruto).
- Nominatim permitido: 1 petición por segundo como mucho, `User-Agent: BarcelonaGame/1.0 (prototipo)`; lo que descargues,
  en `gta/data/` y confirmado. Fotos de referencia (Firecrawl, búsqueda de imágenes) **solo en el scratchpad**.
- Familias de barrio y nivel económico: `n2/comun.md` y `n3/comun.md` (`BCN_PAL.fam(b)`, `BCN_BARRI.at`, `BCN_RENTA`).
- Guía técnica: `gta/DESARROLLO.md` (§2 arquitectura, §3 primitivas, §6 contratos de celda, §7.6 noche, §9 mobiliario,
  §10 hitos, §11 noche 2, §12 día 3, §13 Sagrada Família).

## Cómo se trabaja
- Tu worktree `/home/user/wt/g1-<carril>` y tu rama `wt-g1-<carril>`. Etapas `G1x1`, `G1x2`…; progreso en
  `gta/tools/encargos/progreso/<ETAPA>.md`. **Se puede cortar** (límite de uso): confirma y sube (`git push`) a menudo y,
  si al empezar tu progreso ya existe, continúa desde ahí.
- Commits con `git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit …` y el pie
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` / `Claude-Session: https://claude.ai/code/session_01Q64vL5u6wYiVTYwrzNxXbb`.
- **Arnés**: `node tools/shot.js <prefijo> @vistas.json` (cabecera del fichero; `SIZE`, `TIMEOUT`). La máquina tiene **4
  núcleos para 6 agentes**: SIZE=640x360 para comprobar, 1280x720 solo para la hoja final; pocas vistas por ejecución; en
  segundo plano si va a tardar más de ~9 min. Capturas en
  `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/g1/<etapa>/`. **Nunca** `pkill` ni `killall`.
- **Sin marcas ni logotipos**; rótulos genéricos y en catalán.
- Nada a medias: lo que no dé tiempo a hacer bien, que se quede como estaba (no roto). Mejor 4 cosas perfectas que 10 flojas.
- Antes de dar algo por bueno, míralo **de cerca a pie de calle y de lejos, de día y de noche**, y moviendo un poco la cámara
  (parpadeos).

## Entrega de cada etapa
`node --check` de todos los .js; cero errores y avisos de consola en tus capturas; hoja ANTES/DESPUÉS en tu carpeta;
árbol limpio; todo subido; progreso al día; informe estructurado y sincero (lo flojo, dilo).
