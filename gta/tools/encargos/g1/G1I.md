# G1I · Integración, jurado y arreglos finales de la fase gráfica 1

Worktree `/home/user/wt/g1-int`, rama `wt-g1-int`, que sale de la principal (`gta-barcelona-fachadas-detalle`). Lee
`comun.md` (lo que pidió el usuario y las reglas), `rubrica.md` (en la rama del banco) y los progresos de todas las etapas
G1x1–G1x3 y G1B1. Línea base del jurado: media 4,4 (`scratchpad/g1/banco/linea_base.json`). Meta: media ≥ 8, ninguna < 7.

## Etapa INT1 · Fusión de cuatro carriles y banco
1. Fusiona, en este orden y con `--no-ff`: `wt-g1-banco` (solo herramientas), `wt-g1-suelo`, `wt-g1-tej`, `wt-g1-veg` y
   `wt-g1-luz`. Conflictos esperables: `streets.js` (G1S y G1V: los árboles de calle viven ahí), `app.js` (G1L: cielo,
   preludio, postproceso y mar; G1V: material del terreno), `index.html` (líneas `<script>`), finales de `palette.js` y
   `geo.js`. Resuélvelos conservando lo de los dos lados; si dos carriles cambiaron lo mismo de forma incompatible, manda
   el dueño del fichero según la tabla de `comun.md`, y apúntalo.
2. Tras cada fusión: `node --check` de todos los .js y una captura de carga (una vista) sin errores ni avisos de consola.
3. Si el allanado de calles cambió, el precalculado `data/allanado.bin.gz` ya no casa: regenéralo con `tools/allanado.sh`
   (o déjalo y que el juego calcule; el artefacto publicado no sirve .gz y allí siempre calcula).
4. Rendimiento: `stats` (triángulos, tiempo de fotograma) en 4 vistas del banco antes (la principal) y después; que la
   calidad media siga fluida. Si algo se dispara, recórtalo bajo el nivel de calidad y dilo.
5. `DESARROLLO.md`: añade «§14 Fase gráfica 1» con lo que cada carril dejó en «Para DESARROLLO.md».
6. Capturas DESPUÉS de las 24 vistas del banco a 960×540, en tandas de 3 o 4 (la máquina va cargada: si el navegador se
   cae, «Target crashed», repite la tanda más pequeña), con prefijo `scratchpad/g1/int/despues/d` y hoja comparativa con
   `python3 gta/tools/hoja_g1.py --comparar scratchpad/g1/banco/antes/a scratchpad/g1/int/despues/d scratchpad/g1/int/hoja_comparativa.jpg`.

## Jurado (tres jurados independientes)
Igual que la línea base: cada vista por criterio y en conjunto, con los 3 defectos más visibles, dónde están y de qué carril
son; comparando con ANTES y con las fotos reales (`scratchpad/g1/banco/ref/`, incluidas las 5 del usuario). Severos.

## Arreglos (por zonas, en paralelo, cada uno en su worktree desde wt-g1-int)
Los defectos de los jurados, de más a menos graves y repetidos, repartidos por dueño de fichero; cada arreglo con captura
ANTES y DESPUÉS en la vista donde se vio; al final se fusionan en wt-g1-int.

## Fachadas (cuando termine G1F)
Fusión de `wt-g1-fach`, comprobación, capturas DESPUÉS finales de las 24 vistas, jurado final y hoja final.
