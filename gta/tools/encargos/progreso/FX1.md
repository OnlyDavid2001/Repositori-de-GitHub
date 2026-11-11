# FX1 · Fachadas de vivienda por barrio: generador + 7 familias

Rama `wt-n2-fx`. Encargo: `tools/encargos/n2/FX.md` (reparto FX1).

## Hecho
- **`fachadas_estilos.js`** (nuevo, cargado antes de `facades.js` en `index.html`): catálogo de datos.
  - `BASE` (valores por defecto de cada campo; la cabecera del fichero documenta TODOS los campos).
  - `FAM`: 7 familias, **31 variantes**: `eixample` 5 · `gracia` 4 · `ciutat_vella` 4 · `raval` 4 · `barceloneta` 4 ·
    `poble_sec` 4 · `sant_gervasi` 5 (ver ids en el fichero).
  - `BARRI` / `familia(barri)`: barrio → familia (ids de `n2/comun.md`; null → `periferia`; respaldo por distrito).
- **`facades.js`** (generador ampliado):
  - `varOf(b)`: familia por `BCN_BARRI.at` en el centro de la caja del edificio + variante por semilla, ámbito `(b, 6)`;
    se guarda por edificio (`VAR[b]`). Si la familia no tiene variantes → `null` → la fachada de antes (`details.js`).
  - `genB`: con variante, el nº de plantas sale de `V.hp`; tonos de la variante en el ámbito `(b, 6, 1)` (`env.V`, `env.kw`,
    `env.uV`, `env.shutV`, `env.marcoV`, `env.tribV`). La planta baja (interiors.js) NO cambia: mismo `run.nb`, `env.u`.
  - `pisosV(env, run)` y `coronaV(env, run)` sustituyen a `D.floors`/`D.crown` para los edificios con variante: huecos
    (balconera/ventana/mixto), balcones (individual, corrido, terraza, galería, francés), barandillas (forja, balaustre,
    obra, vidrio, tubo), cierres (librillo, porticón, enrollable, mallorquina, alicantina de cadeneta), recercados,
    guardapolvos, claves, pilastras, esgrafiados, impostas, tribunas, ropa tendida (balcones y tendederos de patio),
    macetas (`planter` de details.js), y coronaciones (cornisa, balaustrada, peto, ático en terraza, alero de teja).
  - Ámbitos de azar: vano de piso `env.rnd(3, i, W*64 + D)` (12 números), coronación `env.rnd(4, i)` (1), edificio `(b, 6)`.
  - Ventanas abiertas con habitación (IY2, `roomQuad`) ~25 % de los huecos sin persiana; log `BCN_INTERIORS.log` igual.
  - Acabados nuevos en el shader de detalle (ids del núcleo 16–19): 16 ladrillo visto, 17 gresite, 18 revoco gastado con
    desconchados (deja ver ladrillo), 19 hormigón con tablilla. El color base sigue siendo `d.col` (de PALETA): el patrón
    solo modula alrededor de él y de lejos se promedia.
  - Depuración: `?fxv=familia:n` / `?fxv=familia` / `?fxv=off`; en consola `BCN.fx.force('raval:2')` rehace las celdas con
    ese estilo; `BCN.fx.spot(fam, k, up)` da una vista a pie frente al k-ésimo edificio de la familia; `setRange(q<1)` reduce
    los radios (hojas rápidas).
- **`details.js`**: solo se ha sacado la maceta a `planter(W1, F, pe, pd, y0, t, r2, r6)` y se exporta (misma geometría).

## Cómo se añade una familia (FX2)
1. En `fachadas_estilos.js`, añade `FAM.<id>` (ids de comun.md) con 4–5 objetos de variante (`id` único + los campos que
   cambien respecto a `BASE`). Nada más: `facades.js` la recoge sola (la familia de cada barrio ya está en `BARRI`).
2. Si hace falta una pieza nueva (p. ej. otro tipo de barandilla o de coronación), añádela en `rail()` / `pisosV()` /
   `coronaV()` de `facades.js` con un valor nuevo del campo y documéntalo en la cabecera de `fachadas_estilos.js`.
3. Prueba: vista con `"eval": "BCN.fx.force('fam:n'); const s = BCN.fx.spot('fam', 1, 1.25); if (s) BCN.applyView(s);"` y
   `"fx": 0.55` (ver `scratchpad/n2/fx1/hojaA.json`).

## Cómo se prueba
`SIZE=640x360 FMT=jpg node tools/shot.js <prefijo> @hoja.json` con las vistas de arriba; `?fxv=off` (o `force('off')`) da el
ANTES para comparar triángulos (`detailStats().fx.trisBase/trisHi`).

## Pendiente / flojo
(se completa al cerrar la etapa; ver más abajo)
