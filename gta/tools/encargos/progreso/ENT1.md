# ENT1 · Las dos plazas (Plaça de Gaudí y Plaça de la Sagrada Família)

Rama `wt-sf-entorno`. Capturas y hoja: `<scratchpad>/sf/ent1/` (`antes_*.jpg`, `despues_*.jpg`, `hoja_ent1_antes_despues.jpg`,
vistas en `views.json`, generadores en `gen/plazas_gen.py` y `gen/hoja.py`). Sin errores ni avisos de consola. **Estado: hecho**
(con lo flojo abajo).

## Hecho
- `gta/data/sf_ent_plazas.json` (generado por `gen/plazas_gen.py`): trazado en ejes locales de la ficha `sagrada_familia`.
  Gaudí: estanque de 3000 m² (96 puntos), isla de 128 m², orilla (albardilla 0,9 m + paseo de sauló 4,6 m), 4 caminos diagonales
  desde las esquinas, acceso desde Lepant al mirador, zonas (mirador, juegos, petanca, bar con terraza, paseo de Marina,
  macizos), monolito de Corberó, fuentes de OSM, quioscos (bar, urinario). Sagrada Família: eje de la Passió (Z −17) de
  sauló con cenefas de flores, rotonda con estanque redondo, anillo curvo (40×34 m), 3 diagonales, juegos en el cuadrante de
  Provença–Sardenya (OSM), área de perros, bar, 2 estatuas, 4 fuentes de OSM y cipreses que enmarcan la vista.
- `plazas.js`: `sfSing` (dos singulares), `sfZone`, `sfObjs`; piezas `sfpond` (albardilla a la cota del paseo, pared interior
  mojada, isla con talud, piedras y matas, nenúfares y juncos) y `sfmono`; árboles de la isla a la cota del agua (`ex.y`).
- Agua de verdad: malla propia `sfPond` + material `sfPond` (ondas finas, Fresnel, agua oscura) con **MirrorTexture** (mitad de
  resolución) de la basílica (mallas /sagrada/) y de los objetos de la plaza; solo se pinta con la cámara a < 420 m.
- La plaza tiene ~4,5 % de pendiente: el agua es horizontal a la cota más alta del terreno de dentro + 10 cm y alrededor hay un
  **talud** (pavimento a máx(plataforma, agua + 0,3 − 0,14·d)); `BCN_PLAZAS.floorAt(x, z)` da esa cota.
- Noche: farolas de la orilla y de los caminos con su luz cocida en el pavimento; el reflejo recoge la basílica iluminada.

## Coste (triángulos de plazas, ANTES → DESPUÉS, 960×540)
dron 120 526 → 121 744 visibles · a pie en Gaudí 49 535 → 66 915 (alto detalle 9 180 → 10 158) · a pie en la Plaça de la SF
59 418 → 76 798 (7 318 → 18 967). Árboles de plaza a pie en Gaudí 289 k → 109 k tri (menos árboles, más ordenados). El espejo
vuelve a pintar cada fotograma la basílica (~475 k tri visibles) y la plaza a mitad de resolución mientras se está a < 420 m.

## Flojo (sincero)
- **El trazado interior es interpretación** (Overpass/API OSM/ortofoto siguen bloqueados): forma del estanque, isla, caminos y
  arbolado no son un levantamiento.
- **Altura a pie**: el talud sube el suelo hasta ~3,5 m sobre la calle en el lado bajo y `walkAt` no lo sabe: el jugador
  camina por debajo. Hace falta que integración use `BCN_PLAZAS.floorAt`. Las capturas del estanque usan `y` fija.
- Reflejo con ondas algo en escalera (mitad de resolución); mirador con banco y farola dentro del agua en las capturas
  (arreglado después de la última captura, sin volver a capturar).
- Las especies son las de trees.js: no hay sauce, árbol del amor ni melia (aproximados con jacarandá, taronger, etc.).

## Para DESARROLLO.md
- `data/sf_ent_plazas.json` + `sfSing` en plazas.js: Plaça de Gaudí y Plaça de la Sagrada Família. Las singulares aceptan
  `after(o, AFT)` (mallas propias tras construir, se liberan con la plaza) y los objetos `ex.y` (cota fija).
- Estanque de Gaudí con MirrorTexture (`sfPondMir`), activa a < 420 m. `BCN_PLAZAS.floorAt(x, z)`: cota de plataformas altas.
