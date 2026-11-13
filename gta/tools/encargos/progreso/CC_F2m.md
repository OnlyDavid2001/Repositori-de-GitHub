# CC_F2m · Fusión de la Fase 2 (bloques 2, 3 y 4 en wt-cc)

Estado: en curso (fusión y núcleo hechos; capturas y medidas en marcha).

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

## Verificación
(pendiente: carga, 22 fichas, hojas y medidas)
