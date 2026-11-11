# Etapa PALETA (AZ) · Color fijo a cualquier distancia y azoteas con detalle

Worktree `/home/user/wt/n2-az`, rama `wt-n2-az`. Ficheros tuyos: **`app.js` solo en el shader de volúmenes `FS_BLD`, la
carga de edificios y la sección de barrios** (no toques `FS_TER`, `FS_OUT`, `FS_SEA`, la luz ni lo demás: es de otros
carriles), **`palette.js`** (nuevo), **`rooftops.js`** (nuevo), `index.html` (solo para añadir tus dos scripts) y tu
progreso. De `facades.js` puedes tocar SOLO la línea o dos donde se toma el color base del edificio (`d.col` en `genB`),
y apúntalo en el informe. Lee `n2/comun.md`, y de DESARROLLO.md §2, §3, §6 y §7.6.

## 1. Diagnóstico (primero, con capturas)
Hoy un edificio cambia de color al acercarse o alejarse. Encuentra TODAS las causas, por ejemplo:
- `FS_BLD` aplica un mosaico de colores (`tq`, por hash del edificio, solo de día) a las fachadas lejanas; la fachada de
  detalle (`facades.js`, `genB`) usa `d.col` sin ese mosaico y aparece a 170–310 m.
- Las cubiertas lejanas usan una paleta por hash (`r = hash21(vCol.rg*91.7 + seed)`); mira si alguna capa de detalle
  (coronación de `facades.js`, `details.js`) tapa o tiñe la cubierta de cerca.
- Ruidos (`vnoise`) que de lejos se convierten en grano y de cerca en manchas, el fundido de las ventanas falsas, etc.
Haz una secuencia de 4 capturas de la misma manzana a 1500, 600, 200 y 50 m (misma hora, 10:30) ANTES de tocar nada.

## 2. Una sola fuente de color: `palette.js`
`window.BCN_PAL` con funciones deterministas por edificio (índice del registro de edificios + semilla), por FAMILIA de
barrio (ids de `comun.md`, con `BCN_BARRI.at` sobre el centro del edificio; si en el momento de cargar los edificios aún no
existe, calcula tú las cajas de los barrios antes):
- color de fachada de día: paletas con pesos por familia, creíbles y con variedad (Eixample: cremas, ocres, piedra,
  algún rosa pálido y verde agua; Gràcia: colores más vivos y pastel; Ciutat Vella y Raval: ocres apagados, piedra,
  revocos gastados; Barceloneta: tonos mediterráneos variados; Poblenou y Sant Andreu: ladrillo visto y revocos; Nou
  Barris y periferia: ladrillo, revoco claro, gresite; Sant Gervasi y Sarrià: blancos, cremas, piedra clara…);
- cubierta: tipo (azotea transitable clara, teja árabe terracota, tela asfáltica gris, grava) y color.
**Hornea** el color final en el color de vértice de los volúmenes al cargarlos (y quita de `FS_BLD` el mosaico `tq` y la
paleta de cubiertas por hash, que pasan a venir del color horneado) y haz que `facades.js` use exactamente ese mismo color
como `d.col`. Resultado: el mismo color de fachada y de cubierta a 1500, 600, 200 y 50 m. Que de lejos no haga moiré ni
parpadee (los ruidos, prefiltrados por tamaño de píxel). Revisa la noche a las 23:00: la calibración nocturna (masas oscuras
con ventanas) no debe cambiar de forma apreciable; si cambia, compénsalo en la parte nocturna de `FS_BLD`.

## 3. Azoteas con detalle: `rooftops.js`
Enganchado al sistema de celdas de detalle (como `details.js` y `furniture.js`; contrato en DESARROLLO §6), sobre las
cubiertas planas: por edificio 2–6 elementos según su tipo y tamaño, con variedad: depósitos de agua (cilindros de
fibrocemento o metálicos sobre patas), antenas de TV (mástil con dipolos), alguna parabólica, tendederos con cuerdas y
algo de ropa tendida, casetas de escalera con puerta, aparatos de aire acondicionado, claraboyas, alguna placa solar, peto
o barandilla. Geometría con las primitivas de `geo.js`, materiales `K.PBR`, sombras (`cast`) en la cascada cercana.
Detalle completo a ≤ ~250 m y una versión de cajas sencillas hasta ~700 m; nada más lejos. Presupuesto: mídelo y dilo.
De noche, oscuras (algún piloto rojo de antena como mucho).

## Verificación
La secuencia de 4 distancias ANTES y DESPUÉS (en una hoja), azoteas vistas desde el dron de cerca (dos barrios distintos),
una vista aérea alta (las familias de color se notan por barrios) y la noche a las 23:00 sin cambios apreciables.
Etapa «AZ».
