# Etapa FACHADAS (FX1 y FX2) · Fachadas de vivienda por barrio, más de 50 variantes

Worktree `/home/user/wt/n2-fx`, rama `wt-n2-fx`. Ficheros tuyos: **`facades.js`** (salvo la línea del color base
`d.col`, que es de la etapa PALETA), **`fachadas_estilos.js`** (nuevo: catálogo de familias y variantes), `details.js`
solo si hace falta para no romper las macetas y las ventanas abiertas, `index.html` (solo para añadir tu script) y tu
progreso. Lee `n2/comun.md`, y de DESARROLLO.md §3, §6 (6.4–6.10) y §8 (interiores: ventanas abiertas y portales, que
deben seguir funcionando).

## Qué hay que hacer
Rehacer la parte de viviendas de TODAS las fachadas de detalle (del primer piso de viviendas hacia arriba, coronación
incluida; los bajos comerciales, portales y escaparates se quedan como están) para que cada barrio tenga su estilo y,
dentro de él, 4–5 variantes que se alternan al azar por edificio (semilla del edificio). 15 familias (ids de
`comun.md`) × 4 variantes = 60 variantes como mínimo. Ejemplos de carácter (guíate por cómo es de verdad cada barrio):
- **eixample**: casas de vecinos de 5–7 plantas, ritmo de balconeras verticales, balcones individuales en los pisos altos y
  corridos en el principal, forja, persianas de librillo verdes o marrones, molduras e impostas, coronación con cornisa o
  balaustrada, algún modernista con tribuna y esgrafiados;
- **gracia**: casas de 3–5 plantas más estrechas, balcones corridos de forja sencilla, colores vivos, persianas de lamas;
- **ciutat_vella** y **raval**: fachadas estrechas y altas, huecos pequeños, balcones de forja muy saltados, revoco
  gastado y desconchado, ropa tendida en los balcones, persianas de librillo;
- **barceloneta**: «quarts de casa» estrechos de 4–5 plantas, balcones pequeños, colores vivos, ropa tendida;
- **poble_sec** y **sants**: obreras de 4–6 plantas, balcones sencillos, revoco y algún ladrillo;
- **les_corts**, **sant_gervasi**, **sarria_pedralbes**: edificios burgueses o de los 60–80 con terrazas corridas,
  barandillas de obra o vidrio, persianas enrollables, algún chalet o casa baja con teja en Sarrià;
- **poblenou** y **sant_andreu**: ladrillo visto, antiguos edificios fabriles reconvertidos, casas bajas y bloques;
- **horta_guinardo**, **nou_barris**, **periferia**: bloques de los 60–70 (ladrillo, gresite, galerías cerradas con
  aluminio, terrazas acristaladas, persianas enrollables, antepechos de obra) y edificios recientes.
Cada variante es una DESCRIPCIÓN paramétrica (ritmo y proporción de huecos, tipo de balcón —individual, corrido, galería,
tribuna, sin balcón—, barandilla —forja, balaustre, obra, vidrio—, carpintería —librillo, porticón, enrollable,
mallorquina—, acabado —estuco, piedra, ladrillo visto, revoco, gresite, hormigón—, molduras e impostas, coronación —cornisa,
balaustrada, peto liso, ático retranqueado—, tonos de carpintería y de remates) que un único generador convierte en
geometría (el de `genB`, ampliado). Las variantes van como datos en `fachadas_estilos.js`; `facades.js` las elige por
familia de barrio (`BCN_BARRI.at` sobre el centro del edificio, ids de `comun.md`) y por semilla.
El COLOR del muro es `d.col` (lo garantiza la etapa PALETA, el mismo de lejos y de cerca): tú decides los tonos derivados
(piedra, remates, carpinterías), no el color base.

## Reglas
- Puede tener algo menos de detalle que lo actual, pero bonito y variado; sin perder rendimiento: mide los triángulos por
  celda (`S.cap`, capas BASE y ORNAMENTO) antes y después y quédate como mucho en lo de ahora.
- Siguen funcionando: los bajos comerciales, los portales con zaguán, las ventanas abiertas con habitación (IY2), las
  macetas de los balcones, el baño de sodio de noche (`lampBath`) y las luces de los pisos de noche (`homeOn`).

## Reparto entre las dos etapas
- **FX1**: el generador ampliado (descripciones paramétricas, elección por familia y variante, compatibilidad con lo de
  arriba) y las familias `eixample`, `gracia`, `ciutat_vella`, `raval`, `barceloneta`, `poble_sec` y `sant_gervasi`
  (mínimo 4 variantes cada una). Deja en el progreso cómo se añade una familia.
- **FX2**: las familias `sants`, `les_corts`, `sarria_pedralbes`, `poblenou`, `sant_andreu`, `horta_guinardo`,
  `nou_barris` y `periferia`, y un repaso de variedad de todo (que ninguna calle parezca repetida).

## Verificación
Una vista a pie por familia (en 2–3 ejecuciones del arnés; busca calles representativas de cada barrio) y una hoja por
familia con sus variantes (puedes forzar la variante con un parámetro de depuración, por ejemplo `?fxv=familia:n`), de día
a las 10:30; algunas a las 23:00. Etapas «FX1» y «FX2».
