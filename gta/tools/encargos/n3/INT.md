# Etapas INTEGRACIÓN (INT3), ARREGLOS ENTRE CARRILES (FIX3) y REVISIÓN (REV3) · Día 3

Las tres trabajan, una detrás de otra, en el worktree `/home/user/wt/n3-int`, rama `wt-n3-int` (creada desde la rama
principal `gta-barcelona-fachadas-detalle`). Identidad y pie de los commits: los de `comun.md`. Lee las «Notas del
revisor» de abajo: cada etapa tiene las suyas, y son obligatorias para esa etapa.

## INT (etapa INT3)
Fusiona, por este orden: `wt-n3-edif`, `wt-n3-arb`, `wt-n3-transp`, `wt-n3-puerto`, `wt-n3-aero`, después
`wt-n3-suelos` y, la última, `wt-n3-plazas` (`git merge --no-edit`). Dos ramas aún tienen una etapa trabajando cuando
empiezas: **antes de fusionar `wt-n3-suelos` espera a que exista
`/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/n3/s3.done`** (lo crea el coordinador cuando la
etapa S3 termina y ha subido) y **antes de fusionar `wt-n3-plazas` espera a que exista `…/scratchpad/n3/p3.done`** (la
etapa P3 está rehaciendo a petición del usuario la Plaça de Catalunya y retocando Lesseps y Glòries). Mientras tanto haz
todo lo demás (las otras fusiones, sus conflictos y sus pruebas). Espera en tandas de 9 minutos como máximo, hasta 90
minutos por fichero; si sigue sin existir, fusiona la rama como esté y dilo. Después de fusionar cada una, lee su progreso
(`gta/tools/encargos/progreso/S3.md` y `P3.md`) y haz sus pruebas. Cada rama trae también lo que hicieron sus repasos: E3 y E4 (edificios), S2 y S3
(suelos), ARB4 (árboles), T2 (transporte), PU3 (puerto), AE3 y AE4 (aeropuerto). Resuelve los conflictos conservando
la intención de las dos partes (los informes de las etapas están en tu encargo). Haz las peticiones pequeñas de los
carriles que sean de fusión. Prueba: `node --check`; arnés a las 10:30 y a las 23:00 en Plaça de Catalunya, una calle
del Eixample con tiendas, una boca de metro, el puerto, el aeropuerto desde el aire, una manzana del Eixample desde el
dron y la ciudad desde el aire; cero errores y avisos de consola; mide el coste (triángulos dibujados y tiempo de carga)
frente a la rama principal y dilo. Escribe en DESARROLLO.md una sección «12. Día 3» con lo que dejaron las etapas en sus
progresos (secciones «Para DESARROLLO.md»). Sube la rama.

## FIX (etapa FIX3)
Haz los arreglos entre carriles de las notas «Para FIX3», que solo se pueden hacer con todo fusionado. Captura ANTES y
DESPUÉS de cada uno, confirma y sube.

## REV (etapa REV3)
Mira las hojas con dureza contra lo que pidió el usuario (`comun.md`), lista los 10 defectos más visibles (empieza por
las notas «Para REV3») y arregla todos los que puedas (puedes tocar cualquier fichero), volviendo a capturar. Sube.
Monta una hoja final para el usuario con lo mejor del día (de día y de noche: plazas, manzanas y patios, calles con su
asfalto y acera, metro, puerto, aeropuerto, la ciudad desde el mar de noche) en
`/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/n3/rev/hoja_final.jpg`.

## Notas del revisor

### Para INT3 (al fusionar; obligatorias)
1. **Orden de los `<script>` en index.html**: `suelos.js` antes de `app.js`; `manzanas.js` donde lo dejó EDIFICIOS;
   `transporte.js` antes de `lighting.js`; `plazas.js` donde lo dejó PLAZAS (engancha los hitos con un setter sobre
   `window.BCN_LM`); `data/puerto_pu1.js`, `data/puerto_pu2.js` y `puerto.js` después de `landmarks_e.js`; `aeropuerto.js`
   después de `landmarks_e.js` (sustituye el constructor de la ficha `aeroport`).
2. **Conflictos esperables**: app.js (FS_ROAD de SUELOS; `heightAt` = cota allanada `FLAT.h` de S2, con `heightAt0` de
   respaldo; bloque MANZANAS ENTERAS de E2–E4 con `data/mz_partidas.json`; `roofNight` de E1; `addMod` de transp, plz y
   aero), streets.js (aceras y `tKind` de SUELOS; árboles, alcorques como instancias y plantones de ARB3–ARB4; acera hasta
   40 m y faldón de S2), facades.js, rooftops.js, interiors.js, trees.js, fachadas_estilos.js.
3. **FS_WALK**: ARB3 tocó la línea de la reja del alcorque y ARB4 pasó los alcorques a instancias; esa rama de FS_WALK
   (`step(0.84, f.a)`) ya no sirve: quítala al fusionar.
4. **Manzanas precalculadas (crítico)**: `data/mz_partidas.json` depende de los edificios, de manzanas.js y de la lista
   de hitos (las fichas que ocultan volúmenes excluyen manzanas). Al terminar TODAS las fusiones, relanza
   `node tools/mz_partidas.js`, confirma el JSON nuevo y comprueba en el arnés que `BREC.mz.ms` es pequeño (no recalcula
   al cargar) y que no hay manzanas partidas bajo hitos.
5. **Cota allanada**: con `heightAt` allanado, comprueba que puerto, aeropuerto, plazas, bocas de metro y paradas no
   quedan flotando ni enterrados (4 vistas a pie).
6. **Tiempo de carga**: mídelo (desde la página hasta el primer fotograma jugable) en la rama principal y en la integrada.
   Si sube más de un 15 %, busca qué lo sube (allanar, manzanas, plazas, transporte) y dilo.

### Para FIX3 (arreglos entre carriles; obligatorios)
1. **Ciutat Vella sin árboles (petición expresa del usuario)**: en el Gòtic aún queda un alcorque con reja y un árbol
   adulto (`scratchpad/n3/arb4/dgo_tp_gotic.jpg`) porque `streetKind` (streets.js) cuenta como «ancho» un tramo con un lado
   sin edificios. En Ciutat Vella, ancho solo si hay edificios a los dos lados a más de 36 m o calzada de semiancho ≥ 5 m
   (sus ramblas y paseos siguen la regla de media densidad). Fuera de Ciutat Vella, que un solar o una plaza a un lado no
   haga «ancha» una calle normal.
2. **Árboles de las plazas** (si P3 ya pasó todos los árboles de plaza a las especies de trees.js, compruébalo y céntrate en
   los duplicados de los paseos): plazas.js plantaba copas de elipsoide facetado («piruletas») y demasiados árboles (Sol,
   Diamant, Virreina, Revolució, Lesseps, Joanic, Sants…). Añade en streets.js un punto de entrada para árboles por celda
   desde otro módulo (p. ej. `ctx.extraTrees(ci)` concatenado en `treesOf`) y que plazas.js plante ahí las especies de
   trees.js, con muchos menos árboles: las plazas duras casi sin árboles (alguno en el borde), las de parque con los
   suyos. Y comprueba que los andenes de paseo de plazas.js no duplican los árboles de streets.js: la regla de ÁRBOLES 3
   (adultos a media densidad en avenidas, ramblas y paseos) manda. Mira la Diagonal y el Passeig de Gràcia desde el dron
   y en tercera persona.
3. **Rodajes del aeropuerto sin farolas**: el resplandor naranja de calzada (`uGlow`, app.js y streets.js) pinta las
   calles de rodaje y los viales de servicio del campo de vuelo como calles con farolas y choca con las balizas azules.
   Dentro de `aero_campo` (rectángulo girado 66°, centro 5089,3984, 2100 × 3740 m, que ya respeta nature.js; también lo
   publica aeropuerto.js en `BCN_AERO_ZONAS`) y en las plataformas, sin farolas ni resplandor. Vista `aereo_noche`.
4. **Presupuesto de hitos integrado**: mide `BCN.lm.stats().tris` con todo junto (puerto, aeropuerto, plazas…). El tope
   del §10.9 es 400 000; si se pasa, añade un nivel de detalle por ficha en landmarks.js (ocultar a distancia las fichas
   pequeñas) o justifica subir el tope con medidas de triángulos dibujados desde el aire y a pie.
5. **Tirones**: la construcción de una celda de transporte.js tarda hasta ~45 ms sin trocear; trocéala. ground.webp se
   descodifica dos veces (nature.js y transporte.js): compártelo si es fácil.

6. **Asfalto demasiado negro en calles reales (tras S3)**: S3 dio a cada estado un albedo absoluto y en calles reales el
   Passeig de Gràcia y el Eixample salen casi negros, como «nuevo» (`scratchpad/n3/s3/hoja_calles_buena.jpg`). Comprueba
   qué devuelve `BCN_SUELOS.asfalto()` allí (deberían ser seminuevo y gastado normal) y sube el albedo de los estados 0–1
   lo justo para que nuevo y seminuevo se distingan del resto sin que la ciudad se vuelva negra; mira también la Diagonal
   (el parche sobre el paso de cebra salía negro) y una calle muy gastada a la sombra. El uniforme de depuración `uSF`
   (FS_ROAD y FS_WALK) debe quedar a (0, 0).
7. **Carga del allanado**: `allanar` tarda ~2,3 s en un hilo (S3 lo repartió en workers sin medir mejora con la máquina
   libre). Mídelo con todo junto; si pasa de 1,5 s, precalcula la corrección (S3 estimó ~2,9 MB a 2 cm) o hazlo perezoso.

### Para REV3 (defectos visibles; empieza por estos)
1. **El mar de noche (prioritario: el usuario lo pidió ver)**: desde el mar a las 23:00 (`scratchpad/mar/m_mar_23.jpg`,
   `m_mar_barca_23.jpg`; vistas en `scratchpad/mar/v.json`) el agua es un plano casi negro, sin el reflejo de las luces de
   la costa. Cada foco de la orilla debe dejar una estela vertical temblorosa en el agua, cálida en el paseo y blanca en
   el puerto, y la ciudad se debe intuir duplicada cerca de la orilla. Añádelo en FS_SEA (por ejemplo, muestreando la
   máscara de luz de noche de la costa a lo largo de la vertical de la pantalla, con el rizado del oleaje) más un brillo
   suave del agua bajo la ciudad, sin quemar. Comprueba con las tres vistas de esa carpeta.
2. **Suelos a pie**: que los 5 estados de asfalto y los 6 modelos de acera se distingan en calles reales (lo trabajó S3;
   compruébalo con todo junto, de día y de noche).
3. **Plazas**: el granito de Plaça de Catalunya a pie es demasiado uniforme; los grupos escultóricos de la fuente de
   Espanya son bultos; los pilares con bola verde de la Canòpia de Glòries quedan raros; el Gat de Botero son esferas en
   fila.
4. **Patios de manzana**: desde el dron las tapias diagonales se leen como líneas claras muy marcadas; el vidrio de las
   torres de oficinas queda muy oscuro de día.
5. **Aeropuerto**: queda un bloque blanco liso (`lm_aero_edificis`, hacia 3777, 2759; vista `pie_lejos` de
   `scratchpad/n3/ae4/`) y el techo del viaducto de la T1 muy oscuro de noche.
6. **Puerto**: PU3 dejó sin revisar las aduanas recolocadas (`scratchpad/n3/pu3/D_vB2_*`) y las vistas a pie
   `sts_cerca2`, `dep_pie2` y `cru_pie2`; si la aduana de la ZAL Prat cae sobre una vía pública, fíjala en la entrada.
7. **Suelos en calles reales**: S3 no pudo capturar Tres Torres, Raval, Ciutat Meridiana, 22@ ni la noche en calles
   reales; hazlo con todo junto y comprueba que los 5 asfaltos y los 6 modelos de acera se reconocen (con `uSF` a 0).
