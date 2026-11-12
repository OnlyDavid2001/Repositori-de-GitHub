# Etapa SFA · Las puntas exteriores del ábside que envuelven la torre de la Mare de Déu, con la forma del modelo del usuario

Worktree `/home/user/wt/sf-abs`, rama `wt-sf-abs`. Lee `comun.md`, `SFM.md` y los progresos SFI, SFD1, SFD2, SFR y SFM.

## Lo que ha pedido el usuario (manda sobre todo lo anterior)
«Rehaz también las puntas del ábside de afuera que envuelven la torre de María.» Antes: «la forma de mi modelo 3D es la
correcta; respeta siempre las alturas que dicen los documentos; quiero que sea homogéneo cromáticamente (el mismo ocre)».
Y: «recuerda integrar la cruz que específicamente te mandé»: es la de `sf_cruz.json`, ya puesta en la torre de Jesucrist;
**no la toques** y no metas nunca la cruz que trae el modelo de la basílica.

## Con quién compartes el fichero
Otra etapa (SFM, rama `wt-sf-int`) está cambiando a la vez los pináculos de los 12 apóstoles, las tres fachadas y el color
(ocre homogéneo). Tu rama sale de su trabajo a medias (15d89e5): ya tienes su carga de `sf_modelo_piezas.json` (`piezasOf`
en `sagrada.js`) y el material homogéneo. **No toques** pináculos, fachadas, definición del material ni colores, cruz,
evangelistas, torre de la Mare de Déu y su estrella, torre de Jesucrist, `gloria.js` ni las plazas. Lo tuyo: la sección del
ábside de `sagrada.js` (girola, capillas y sus agujas, remate del presbiterio), un extractor nuevo y un fichero de datos nuevo
(así las dos ramas se juntan sin pisarse).

## Qué hay que hacer
1. **Extraer** del STL del usuario (`/root/.claude/uploads/6a030a94-1fe2-5831-a104-304cc6d92e7c/baa936fb-Sin_t_tulo_1.stl`)
   las piezas exteriores del ábside a `gta/data/sf_modelo_absis.json` con un script nuevo `gta/tools/stl_absis.py`
   (reutiliza `stl_basilica.py`: mismos ejes y formato que `sf_modelo_piezas.json`, normales coherentes). Ejes del modelo:
   u hacia el ábside, v hacia el Naixement, z arriba, origen en el eje de la torre de Jesucrist (en metros). Grupos, por el
   centro de cada componente (u, v) y su z en el modelo:
   - **corona** (las puntas que envuelven la torre de María; lo principal del encargo): 4 piezas de 196 triángulos:
     (17,7, 0) y (30,3, 0) con z 23,1→62,1, y (24,0, ±5,3) con z 43,2→76,8; y 3 piezas de 28 triángulos en el lado del
     crucero: (10,6, 0) z 60,7→86,6 y (9,7, ±4,7) z 56,8→82,7.
   - **agujas de la girola**: 28 piezas altas en hoja (60 o 120 triángulos, z 4,8→53,8) entre las capillas, y 7 hastiales
     finos (44 triángulos, z 4,8→47,7) a unos 15 m de la torre de María.
   - **torres de las esquinas del ábside** en (19,7, ±18,7): cuerpo (140 triángulos, z 4,8→47,7) y cono (120, z 40,4→56,1).
   - **capillas**: cuerpos (756 triángulos en (30,9, ±15,4) y 1.134 en (40,8, 0), z 4,8→33,4), la cubierta plana
     (28 triángulos a z 23,1) y 14 columnas (120 triángulos, z 4,8→28,7).
   - **Fuera**: la torre de María (centro (24, 0)), los evangelistas (±11,25, ±11,25) y sus remates, las sacristías
     ((44,3, ±29,6) y las piezas de (44,2, ±19,3)), el claustro y la capilla de la Asunción (u > 47) y el terreno.
   Referencia visual de esta selección: `scratchpad/sf/absis/hoja_absis_modelo.jpg` (por colores) y su script
   `scratchpad/sf/absis/ver_absis.py` (criterios exactos); vistas del modelo en `scratchpad/sf/ref_modelo/`
   (`alzado_absis_NO.png`, `iso_naix_absis.png`, `iso_absis_passio.png`).
2. **Colocarlas**. En planta, como el resto de piezas (x_ficha = −v + cx, z_ficha = −u + cz, crucero (cx, cz)), con la
   torre de María del modelo (u = 24, v = 0) sobre el centro de la nuestra, y una escala que lleve el borde exterior de la
   girola a la huella real (en `sf_ref.json`: la girola exterior de OSM llega a z ≈ −62). En altura, una correspondencia
   por tramos: suelo del modelo (4,8) → nuestro suelo bajo el ábside; cubierta de las capillas del modelo (23,1) → la
   cubierta de nuestra girola (33 m); y por encima, el factor que lleva la punta de la torre de María del modelo (124,8) a
   sus 138 m (documentos). Así la corona acaba hacia los 88 m (por encima de la bóveda del ábside, 75 m por dentro) y las
   tres puntas del lado del crucero hacia los 98 m. Comprueba que nada atraviesa la torre de María ni los fustes de los
   evangelistas; si chocan, ajusta.
3. **Sustituir lo nuestro**: fuera los hastiales y las agujas de las capillas de la girola y lo que del exterior del
   ábside quede tapado o duplicado por las piezas del modelo (el remate del presbiterio de 33 a 71 m si la corona lo cubre).
   Se pueden quedar muros y ventanales si caben dentro. Sin solapes ni parpadeos.
4. **Material**: el mismo `sf_lm` (el ocre homogéneo que deja SFM; no cambies su definición). La corona, de piedra; un
   toque de cerámica vidriada solo en las puntas, sobrio. De noche, la misma luz que el resto: dorada abajo, fría arriba.
5. **Niveles de detalle**: las piezas del modelo en las mallas media y de detalle; de lejos basta la silueta (la corona
   como un anillo de conos). Mide triángulos.

## Verificación (rápida: unas 50 llamadas)
El ábside desde la calle de Provença a pie y desde el dron, de día y a las 23:00, al lado de las vistas del modelo
(alzado NO e isométricas); alturas medidas (corona, agujas, torres de las esquinas); 0 errores y avisos de consola. Hoja en
`/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/sf/sfa/hoja_sfa.jpg`.
