# Etapa SFM · Pináculos de los apóstoles y las tres fachadas con la forma del modelo del usuario, y ocre homogéneo

Worktree `/home/user/wt/sf-int`, rama `wt-sf-int` (todo lo anterior ya está aquí: SF0–SF3, ENT0–ENT2, SFI, SFD1, SFD2 y
SFR). Ficheros: `gta/sagrada.js` y lo que necesite de `gta/data/sf_*.json`. Lee `comun.md` y los progresos SFD1, SFD2 y SFR.

## Lo que ha pedido el usuario (textual, resumido; manda sobre todo lo anterior)
«La forma de mi modelo 3D, olvidando alturas y proporciones, es la correcta en las torres; las tuyas no. Las 12 de los
apóstoles tienen mucho margen de mejora, y las fachadas de la Passió, la Glòria y el Naixement las quiero muy parecidas a
las del modelo. La cruz, como la que ya habías generado (la fusión con mi modelo de la cruz); los evangelistas, también los
que ya tenías; y simplemente cambia los pináculos: los de los 12 apóstoles que tienes ahora son una basura, quiero los del
modelo. Y quiero que sea homogéneo cromáticamente: el mismo ocre en toda la basílica. La fachada del Naixement, la más
antigua, ahora es más oscura, pero dentro de diez años estará renovada: del mismo color.» Y antes: «Respeta siempre las
alturas que dicen los documentos». Y: «acelera, no es tan complicado».

## Qué hay que hacer
1. **Se quedan como están**: la cruz (la del usuario, `sf_cruz.json`), las cuatro torres de los evangelistas, la de la Mare
   de Déu con su estrella, la de Jesucrist y los fustes de las 12 torres de los apóstoles.
2. **Pináculos de los 12 apóstoles = los del modelo** (pieza del pináculo + su remate, ya separados): sustituye los tuyos
   por estos, cada uno sobre su torre, escalado para que la torre acabe a su **altura de los documentos** (`sf_ref.json`:
   98,5–120 m según la torre) y con la anchura de su fuste en el arranque. Colores de trencadís como en la foto del
   usuario (`scratchpad/sf/ref/usuario_torres_dia.jpg`: dorado, rojo y blanco), por bandas o partes de la pieza.
3. **Fachadas del Naixement, la Passió y la Glòria = las del modelo**: coloca sus piezas (`fachadas.naixement`,
   `fachadas.passio`, `fachadas.gloria`) en su sitio y sustituye por ellas tu geometría de esas tres fachadas (pórticos,
   frontones, piñones, columnas, linternas y lo que sobre de lo tuyo donde se pisen). Escala en planta a las medidas
   reales y en altura a las de los documentos donde las haya (por ejemplo, las linternas de la Glòria llegan a **80 m**,
   que es dato: SFD1 las subió a 96 siguiendo el modelo; vuelve a 80; el frontón de la Passió con su cruz, 58 m). Quita del
   modelo lo que choque con lo que se queda (si una pieza de fachada trae un fuste de torre de apóstol o barras sueltas en
   lo alto, descártala) y no dupliques los monumentos de la plaza de la Glòria (los hace ENTORNO).
4. **Ocre homogéneo**: el mismo color de piedra en toda la basílica, el Naixement incluido (fuera el oscurecimiento y el
   envejecimiento más fuerte de esa fachada; el relieve suave puede quedarse). Mismo material (`sf_lm`) para las piezas
   nuevas, con su luz de noche (dorada abajo, fría azulada arriba, la cruz con sus haces).
5. Niveles de detalle: las piezas del modelo en la malla media y de detalle; de lejos basta la silueta. Mide triángulos.

## Datos: `gta/data/sf_modelo_piezas.json`
Lo genera `gta/tools/stl_basilica.py` desde el STL del usuario. Ejes locales del modelo: **u = hacia el ábside (NO)**,
**v = hacia el Naixement (NE)**, z arriba; origen en el eje de la torre de Jesucrist; posiciones en cm (Int16, x=u, y=v,
z=z) en base64 y `idx` en base64 (`idx_tipo`). En la ficha `sagrada_familia`: **x_ficha = −v + cx, z_ficha = −u + cz** con
(cx, cz) = crucero (≈ −2,5, −20,5; compruébalo con `sagrada.js`), y = z (antes de escalar). `fachadas.{gloria,naixement,
passio}` son mallas enteras en esos ejes; `pinaculos[]` (12) traen `fachada`, `u`, `v` (centro de su torre en el modelo),
`z0`, `z1` y la malla centrada en el eje de su torre (z absoluto del modelo). Vistas del modelo para comparar:
`scratchpad/sf/ref_modelo/` (alzados de las cuatro fachadas y `hoja_piezas.jpg` con estas piezas sueltas).

## Verificación (rápida: unas 50–60 llamadas)
Alzados del juego al lado de los del modelo (Glòria, Naixement y Passió), los pináculos de cerca, a pie ante las tres
fachadas, y el conjunto desde el dron de día y a las 23:00; 0 errores y avisos de consola; alturas medidas. Y la **hoja final**
para el usuario en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/sf/rev/hoja_final.jpg`
(1280×720 por vista, comprobadas a ojo): la basílica desde el dron por los cuatro lados de día y una de noche, las tres
fachadas a pie, el estanque de la Plaça de Gaudí, la escalinata de la Glòria y una vista lejana con la ciudad.
