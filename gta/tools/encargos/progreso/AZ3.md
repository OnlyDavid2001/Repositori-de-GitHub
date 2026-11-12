# Progreso · etapa AZ3 (PALETA, tercera pasada: coste de las azoteas, tejados de teja con pendiente, fundido entre niveles)

Parte de AZ2 (cubierta uniforme por edificio con textura alineada, `rooftops.js` con tres niveles). Ficheros tocados:
`rooftops.js`, `palette.js`, `app.js` (solo la carga de edificios: área y llenado de la planta para la paleta).

## Diagnóstico
- **Los niveles medio y lejano de AZ2 no se veían**: las mallas de `rooftops.js` usaban `detail.matB`, el material de las
  fachadas de detalle, cuyo `uFade` descarta (tramado) todo lo que está a más de 170–215 m del ojo. Las cajas y petos de
  260–1100 m se construían y se dibujaban (270–380 mil triángulos) y el shader los tiraba enteros. El «salto» a 260 m era
  en realidad un fundido a 170–215 m seguido de nada.
- El coste cercano lo hacían sobre todo antenas (≈ 50 triángulos cada una, cientos), chimeneas (3 cajas de 12), petos
  (3 caras por tramo), depósitos (torno de 8 lados y 4 patas de barra) y ropa (cajas).

## Hecho
- **Material propio** (`roofDet`): copia del shader de detalle de las fachadas en la que el fundido de los sustitutos se
  cambia por un fundido de ENTRADA; comparte con `matB` los mapas de uniformes y texturas (luz, sombras, texturas: lo que
  los demás pongan en `matB` vale aquí) y se da de alta en `ctx.mats`. Cada malla lleva su franja en `metadata.rf`
  ([entra de, entra hasta, sale de, sale hasta], distancia 3D del píxel) y el material la fija al enlazarla.
- **Fundido tramado entre niveles** (dith, el mismo de todo el detalle, con tramados complementarios): 1 completo hasta
  170–200 m; 2 de 170–200 a 360–410 m; 3 de 360–410 a 720–800 m. Las celdas de la franja tienen los dos niveles a la vez
  (se eligen por la distancia 3D mínima y máxima de la celda, con las cubiertas entre suelo + 3 y + 75 m).
- **Coste**: piezas planas (postes, puertas, rejillas, barandillas, ropa, viento, peldaños: un paño de 2 triángulos en vez
  de barras de 8 o cajas de 12), cajas sin fondo (10), petos sin cara exterior cerca (la interior se ve por las dos caras y
  la albardilla vuela 4 cm) y solo la cara interior en el nivel medio (tramos > 1,2 m), depósitos de 6 lados, antenas con
  3 dipolos de 3 elementos y como mucho 3 por azotea, chimeneas con sombrerete plano, matas de 16 triángulos, 12 elementos
  como mucho por azotea.
- **Teja árabe con pendiente**: `palette.js` solo da teja a casas pequeñas y bajas (≤ 420 m², ≤ 17 m, planta que llena
  ≥ 80 % de su rectángulo mínimo orientado con el eje del edificio: lo calcula `app.js` al cargar); las grandes pasan a
  azotea de rasilla. `rooftops.js` les pone tejado a dos aguas (cumbrera a lo largo del lado largo, hastiales del color del
  muro) o a cuatro aguas (limatesas), pendiente 29–39 %, alero de 38 cm con canto oscuro y cumbrera; tipo de material
  `TEJA` (id 120, `regKind`): canales de 22 cm que bajan por la pendiente con relieve de normal, hiladas de 40 cm, tono por
  pieza y líquen, todo de media cero y apagado bajo ~2 px: el color es el de la tabla de cubiertas, igual que la losa que se
  ve de lejos. A veces una antena en la cumbrera. Proyecta sombra cerca (nivel 1, capa `furn`); los niveles 2 y 3 llevan
  los faldones y hastiales (4–6 triángulos por casa) hasta 800 m.

## Cómo se prueba
`node tools/shot.js <prefijo> @all2.json` (scratchpad `n2/az3/`: roof_eix, roof_gra, roof_gra_lo, roof_cv, roof_e150,
d600, sarria, horta, n600 y sarria_n a las 23:00; «sarria» y «horta» buscan solas el grupo de casas con teja más denso del
barrio). `BCN.detailStats().roof` da triángulos por nivel, total y, del nivel cercano, por tipo de elemento.
