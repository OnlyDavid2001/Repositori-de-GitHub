# Condal City · Plan (Fase 0)

Diagnóstico completo en `diagnostico_fase0.md`; herramientas de la fase en `gta/tools/cc/`.

## Lo que hay hoy
- 303.787 volúmenes (OSM con altura real de LiDAR); 211.563 con fachada de detalle. Tres niveles: volumen lejano con
  ventanas pintadas (FS_BLD), fachada BASE hasta ~245 m y ORNAMENTO hasta ~110 m, en celdas de 100 m.
- El estilo sale de 15 «familias» de barrio con 70 variantes (fachadas_estilos.js); el color, de una paleta por familia
  horneada al cargar. **Por eso se ve como un copia-pega**: no hay datos reales detrás.
- Los bajos: **todos** los vanos de calle de cualquier vivienda de más de 10 m son tienda (17 tipos con rótulo genérico).
  El Gòtic y el Eixample salen con el mismo frente continuo de tiendas.
- Por edificio no hay ni identificador estable, ni año, ni número de plantas (se deduce de la altura real). Sí hay
  parcelas: en el Eixample casi todo son fincas de ~15 m; en Ciutat Vella hay volúmenes que agrupan varias casas.
- Coordenadas: el juego no tenía conversión a [lon, lat]. Escrita y verificada (UTM 31N, series de Krüger): Plaça de
  Catalunya a 3,6 m, Sagrada Família a 4,9 m de la torre de Jesucrist, Torre Glòries a 15 m (el redondeo a 4 decimales del
  punto dado; con el centro real, < 1 m). Los 73 barrios del JSON casan con los del juego (IoU 0,97–0,996).
- FPS de referencia (aquí no hay GPU: cifras solo comparativas, segundos por fotograma con SwiftShader): Eixample a pie
  27,7 s (5,2 M triángulos, 866 llamadas), Gòtic a pie 33,5 s (6,4 M, 649), aérea 3,8 s (1,3 M, 304). Para medir de
  verdad en tu ordenador: `gta/tools/cc/medidor_consola.js` (se pega en la consola con el juego abierto).

## Lo que voy a cambiar
1. **Datos** (Fase 1): `condal_city_datos.json` se empaqueta (herramienta) en `gta/data/condal.json` (compacto, sin red):
   perfiles de barrio y sección, rejilla de secciones y una rejilla comercial densa de 150 m alineada con el mundo (con
   ceros donde no hay locales). Módulo `BCN_CONDAL.at(x, z)` con índice espacial. Conversión lon/lat ↔ juego en el juego.
   Tecla de depuración con barrio, sección y estilo del edificio que tienes delante.
2. **Kit de 22 estilos × 4 variantes** (Fase 2) en un catálogo nuevo que sustituye a las 15 familias: planta baja, planta
   tipo, noble, coronación, balcón, ventana, tribuna, cornisa y chaflán; paletas y desgaste del JSON. Procedural y con
   parámetros de material (sin modelos únicos), en bloques de 5–6 estilos por orden de peso.
3. **Generador por capas** (Fase 3): las 12 reglas, **precalculadas por una herramienta** (como `mz_partidas.json`) en un
   fichero por edificio: estilo, variante, color, rachas por acera, áticos y remontes, medianeras y chaflanes. Así el color
   y el estilo son los mismos de lejos y de cerca y el juego no gasta tiempo al cargar. El volumen lejano también sabrá su
   estilo (ladrillo, hormigón, ritmo de ventanas) para que no salte al acercarte.
4. **Bajos y 24 escaparates** (Fase 4) con la densidad comercial real y los negocios del barrio; nombres inventados en
   catalán; bajos no comerciales según el estilo (portal monumental, garaje, puerta de casa, verja, porches…).
5. **Detalles de vida** (Fase 5) según `detalles_prob`, solo de cerca.
6. **Rendimiento** (Fase 6): contador de FPS en el juego (`?fps=1`), presupuestos de triángulos y niveles de detalle;
   comparación con las cifras de arriba.
7. **Comprobación** (Fase 7): los 13 barrios a pie y desde el aire frente a la chuleta, con medida automática de qué
   estilos y negocios dominan en cada barrio.

## Problemas y cómo los resuelvo
- **El 47 % de los edificios del juego está fuera de Barcelona** (L'Hospitalet, Esplugues, Sant Adrià, Badalona…) y el
  JSON no los cubre: perfiles sintéticos de periferia (mezcla de desarrollismo, pueblo, autarquía, polígono, fábrica en
  zonas industriales), parecidos a los barrios vecinos de Barcelona.
- **Alturas**: son reales (LiDAR) y no se cambian (romperían sombras, azoteas e hitos). `plantas_pct` sirve para elegir
  estilos compatibles con la altura del edificio y para áticos y remontes visuales. En 38 pares barrio/estilo el rango de
  plantas del estilo no casa con las alturas del barrio: se corrige la mezcla con la altura real.
- **Anchos**: la huella es real. Donde OSM junta varias casas en un volumen (Ciutat Vella, Barceloneta), la fachada se
  parte en parcelas virtuales del ancho del estilo (quart de casa de 4–5 m, casa obrera de 5–9 m), cada una con su
  variante y color.
- **Sin orden por acera**: la herramienta de la Fase 3 construye los frentes de calle (cada edificio con su tramo de
  calle y su lado) para las rachas y para no repetir variante y color entre vecinos.
- **Medianeras**: hoy salen con ventanas por encima del vecino más bajo. Clase nueva de tramo con ladrillo, anuncio
  antiguo pintado (inventado), mural o grafiti.
- **Datos**: la rejilla comercial solo trae celdas con locales (habrá que rellenar ceros), está en lon/lat y girada; los
  «locales vacíos» se cuentan dos veces (uso solo el tipo de negocio); en secciones y barrios con pocos edificios o
  locales, pesa más el barrio o el distrito; 4 nombres de barrio se escriben distinto (cruzo por código y contorno).
- **Monumentos**: los 18 de la regla 11 ya son hitos y no se tocan. Además hay una exclusión por radio que deja sin
  fachada de detalle un halo de edificios normales alrededor de 17 sitios (Sant Pau 260 m, Camp Nou 230 m…): la recorto.
- **Rendimiento**: todo va fusionado por celda; cada detalle nuevo suma triángulos. Los detalles de vida irán en la capa de
  ornamento (solo de cerca) y con topes de triángulos; la Fase 6 compara con las cifras de arriba.
