# CC_F2m · Fusión de la Fase 2 (bloques 2, 3 y 4 en wt-cc)

Estado: **terminada** (fusión, núcleo, verificación, hojas y medidas).

## Fusión
- `wt-cc-f2b` (3cb8360), `wt-cc-f2c` (95f09d0) y `wt-cc-f2d` (f0ebc00) fusionadas en `wt-cc` con `--no-ff`.
- Único conflicto: las líneas `<script>` de index.html; se conservan todas, en orden de bloque:
  kit.js · piezas_b1 · estilos_b1 · piezas_b2 · estilos_b2 · piezas_b3 · estilos_b3 · piezas_b4 · estilos_b4 · facades.js.
- **Choque de nombres** que rompía la carga: la pieza `deposito` estaba registrada en piezas_b2.js (depósito del terrado de la
  autoconstrucción, firma `(B, F, u, y, d, r)`) y en piezas_b3.js (depósitos del polígono, firma `(B, F, u, d, y, r, h, col)`);
  `BCN_KIT.pieza` lanza «pieza repetida». La de b3 pasa a llamarse `deposito_terrado` (su único uso, en `corona_poligono`).
  No hay más nombres repetidos (piezas, estilos, acabados, tipos K: 168–169, 176–179, 184–185, 192–193).
- `gta/tools/cc/vistas_estilos.json`: añadidas las 10 vistas de los bloques 3 y 4 (las que dejaron listas CC_F2c/CC_F2d):
  ya hay una vista por estilo (22).

## Peticiones al núcleo del kit atendidas
- **Barandilla de la planta** (F2b): `rail(env, F, e0, e1, y, jt, sl, sr, vw, V)` toma la variante como último argumento
  (opcional; si falta, `env.V`), y `vanoDef` (`T.vano`) le pasa `q.V`: la planta noble y el chaflán ya cambian su barandilla
  (Eixample ornamentado v1 con balaustres; el `forja: 1` de la planta noble del neoclásico ahora sí se aplica). El rodeo de
  `vano_ornamentado` (cambiar `env.V`) sigue funcionando.
- **`T.corona(env, run, q)`** (F2b): la coronación de siempre sale a `coronaDef` y se expone; una pieza «corona» que solo
  añade algo puede llamarla.
- **Chaflán del edificio** (F2b): `env.chaflan` = índice del tramo de chaflán del edificio (-1 si no hay), calculado antes de
  los tramos; `run.chaflan` sigue diciendo si el tramo actual lo es.
- **`q.gl`** (F2b) en la ranura vano: cota de la acera delante del vano (solo se calcula si el estilo tiene pieza vano).
- **`q.esquina`** (F2d) en las ranuras pb y vano: -1 / 1 si el vano es el primero / último del tramo y el tramo vecino de ese
  lado es de calle y gira más de ~30° (esquina real: `run.esq0` / `run.esq1`); 0 en los demás. Las piezas del bloque 4
  (bar de esquina, hornacina) aún usan el último vano del tramo del portal: pueden pasar a `q.esquina` cuando se revisen.
- **Sin peto en los tejados** (F2d): campo nuevo de variante `sinPeto`; rooftops.js no pone el peto de la azotea en esos
  edificios. Casas baratas lo activa en v0, v2 y v3 (tejado de teja a la calle); v1 (piso añadido con terrado) lo conserva.
- No atendido: `lejos.muro: 'madera'` (F2c, opcional): `lejos` no lo lee nadie hasta la Fase 3; se decide allí.

- `vistas_estilos.json`: casas baratas con hMax 6,5 (con 9 cogía un edificio de 7,7 m) y neoclásico con K=1 y 8–24 m (como
  en CC_F2d; con K=0 había una estructura de plaza delante).

## Verificación
- `node --check` de todos los .js (gta/*.js, gta/tools/*.js, gta/tools/cc/*.js): sin fallos.
- Carga del juego fusionado: 40 cargas de captura + 1 de medida, **cero errores y cero avisos** de consola en las capturas
  (la de medida solo da los «GPU stall due to ReadPixels» del propio medidor). Registro: **22 estilos y 112 piezas** en
  `BCN_KIT` en todas las cargas (se lee en `detailStats().kit` desde la vista).
- Escaparate: una carga por estilo y variante con `?estilo=<id>&v=<n>` (color de la variante; `&pb=0` en los estilos del
  bloque 4, como en F2d), vista de `vistas_estilos.json`, 10:30, 960×540. Scripts: scratchpad `cc/f2m/mk.py`, `lote.sh`,
  `hojas.sh`.
  - `hoja_22_estilos.jpg`: los 22 estilos, variante 0. Todos se reconocen (ladrillo y toldos del desarrollismo, muro cortina
    del contemporáneo, travertino del burgués, persianas de colores de la vivienda social, dientes de sierra y rótulo de la
    fábrica, colores por quart, sillería y ventanas pequeñas del gótico, casitas encaladas con su zócalo…).
  - `hoja_variantes_6.jpg`: las 4 variantes de desarrollismo, noucentista, modernista, Eixample ornamentado, fábrica y quart
    de casa (una por bloque y dos más de los de más peso). Las variantes siguen siendo distintas tras la fusión.
- Lo flojo que se ve en las hojas es lo ya anotado por los bloques: árboles delante (olímpico, noucentista, racionalista),
  casas baratas con muro alto sobre puertas y ventanas, el mismo edificio para barroco y gótico en el Born (el escaparate
  fuerza el estilo en todo), y en quart de casa la cámara cercana y baja no llega al remonte de la v1 ni a la azotea.
- Hojas en el scratchpad `cc/f2m/`: `hoja_22_estilos.jpg`, `hoja_variantes_6.jpg` (capturas sueltas `est_*`, `var_*`).

## Rendimiento (fps_eval.js, calidad media, 960×540, vistas de la Fase 0)
| vista | Fase 0 | F2a | fusión F2m |
|---|---|---|---|
| Eixample a pie | 5,2 M / 866 | 5 194 012 / 866 | **5 151 047 / 866** |
| Gòtic a pie | 6,40 M / 649 | 6 332 852 / 644 | **6 568 524 / 647** |
| aérea | 1,3 M / 304 | 1 315 294 / 304 | **1 315 294 / 304** |

Llamadas iguales. Gòtic +2,6 % de triángulos sobre la Fase 0 (+3,7 % sobre F2a): es la suma de lo que midieron los bloques
2 (+2,5 %: cables, pintadas y tendederos de la casa obrera en Raval y Gòtic) y 4 (+0,9 %: gótico, barroco y neoclásico).
Ningún trabajo por fotograma. Los tiempos por fotograma de esta medida no son comparables (se midió con otra carga del
escaparate en paralelo en la misma máquina).

## Para la Fase 3
- Piezas del bloque 4 (bar de esquina, hornacina, quart) → `q.esquina`; torreta del bloque 2 y torreón del bloque 3 →
  `env.chaflan` / fachada principal precalculada.
- Si Ciutat Vella necesita margen de triángulos, el primer sitio son los detalles finos de la casa obrera (W1).
