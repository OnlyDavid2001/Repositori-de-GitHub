# SF2 · Fachadas y detalle cercano (carril BASÍLICA)

Estado: **hecha en una primera pasada**. Todo está en `gta/sagrada.js`, dentro de `construir()`. El trabajo nuevo va en la
sección «6 · detalle cercano», casi entero en la malla de detalle (DET, a menos de 350 m), para que no suba el coste del dron.

## Hecho
- **Ayudas nuevas** (antes de la sección 1; sirven a MED y a DET):
  - `marco(px, pz, nx, nz)`: sistema de fachada (u a lo largo del muro, y, d hacia fuera).
  - `arcoC()`: arco apuntado de Gaudí, con exponente 0,55: arranque vertical y clave en punta.
  - `banda()`: arquivolta con frente, intradós y trasdós.
  - `figura(x, y, z, rumbo, alto, o)`: figura humana de túnica, torso, brazos y cabeza. Poses abajo, delante, arriba,
    trompeta, cruz y rezar; puede ir sentada, con alas o con aureola. `o.ang` da la versión facetada de Subirachs.
  - `animal(…, 'buey'|'mula'|'caballo'|'leon'|'aguila')`.
- **Naixement**:
  - Los tres pórticos tienen el hueco apuntado (MED) y, en DET, 5 arquivoltas abocinadas que salen hasta 2,8 m.
  - Flecos de estalactitas en la arquivolta exterior y en la base de los hastiales.
  - Vegetación esculpida en las enjutas, parteluz y puertas de bronce verdoso con hiedra (como las de Sotoo).
  - Caritat: la Nativitat (Maria sentada, Josep, el Nen en el pesebre, el buey y la mula), 4 ángeles trompeteros, la
    estrella de Belén, la Coronació (dos figuras y la corona), y 18 palomas blancas en el ciprés.
  - Esperança: la huida a Egipto (mula con Maria y Josep) y dos figuras más arriba. Fe: la Visitació y la presentación
    en el templo.
  - Friso ondulado de hojas sobre los pórticos y sillares más pequeños. El ciprés ya es verde (K.PIEDRA, antes salía
    azulado con K.TRENCADIS).
- **Passió**:
  - Grupos facetados en tres niveles en «S». Abajo: el Sant Sopar (13 figuras y la mesa), el beso de Judas con el perro,
    el cuadrado mágico, la flagelación con la columna, la negación de Pere, el Ecce Homo y Pilat.
  - Balcón intermedio: Simó de Cirene con la cruz, la Verònica con el velo blanco y Longinos a caballo con la lanza.
  - Sobre el porche: los soldados jugándose la túnica, la Crucifixió con tres figuras al pie y el sepulcro.
  - Resurrecció dorada en un puente entre las dos torres centrales, a 64 m. Dos puertas de bronce con paneles.
  - Estrías en las 6 columnas inclinadas, sillares grandes y limpios, y torres de planta elíptica (×0,86 en hondo,
    ×1,12 a lo largo de la fachada).
- **Glòria**:
  - Las 7 columnas tienen pedestal con el pecado encogido, anillo a 11 m con la virtud alada, 8 estrías y capitel.
  - Nubes (7 por linterna) con una letra dorada del Credo en las 16 linternas.
  - Marcos de piedra y una franja de letras doradas en las 7 puertas.
- **Evangelistas** (MED): cada uno tiene su símbolo sobre el remate, mirando hacia fuera: Mateu un ángel con alas,
  Joan un águila, Lluc un buey con cuernos y Marc un león con melena. La malla lejana conserva la figura simple.
- **Ventanales** (DET): todos los de `muroV` y del ábside llevan tracería en relieve: banda apuntada, dos parteluces,
  travesaño y óculo. `ventanal()` apunta cada hueco en `VENT`.
- **Claustro** (DET): pináculos con punta amarilla cada 7,5 m sobre el pretil, siguiendo el contorno OSM.
- **Envejecimiento de la piedra** (las tres mallas, por color de vértice; K.PIEDRA y K.VENTANAS):
  - Hollín pardo en los 12 m de abajo y manchas por bloques de 4 × 5 × 4 m (±6 %).
  - El Naixement sale entre un 6 % y un 16 % más oscuro y pardo; lo nuevo queda más claro.

## Capturas (960×540, 10:30) y coste
Hoja ANTES/DESPUÉS: `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/sf/sf2/hoja_sf2.jpg`. Las
vistas están en `…/sf2/vistas.json` y salen de `…/sf2/mkv.js` (coordenadas locales de la basílica → mundo). El ANTES es
el estado SF1 (af29208). **0 errores y 0 avisos de consola** en todas las pasadas.

| vista | basílica ANTES (`sf.tris`) | DESPUÉS | hitos visibles (`lm.trisVis`) ANTES → DESPUÉS |
| --- | --- | --- | --- |
| dron_gloria (370 m) | 31 165 | 30 926 | 509 878 → 509 655 |
| dron cerca, Naixement y Passió (190-197 m) | 75 805 | 106 782 | 552-554 k → 583-585 k |
| a pie y dron bajo (58-113 m: Gaudí, Glòria, Naixement, baja_passio) | 75 805 | 106 782 | 554 k → 585 k |

Mallas: lejos 7 692 → 7 708; media 31 165 → 30 926; detalle 44 640 → 75 856 (+31 k: tracería unos 9 k, figuras y
grupos unos 14 k, nubes, estrías y pináculos el resto). Carga entre 14 y 18 s, como antes.

## Flojo (sincero)
- Las figuras son maniquíes reconocibles (túnica, brazos, cabeza, alas), pero no esculturas. Se leen como grupos a pie y
  a 60-100 m; a más distancia son puntos. Ni los grupos de Subirachs ni la Nativitat tienen ropa ni gestos finos.
- Naixement: el fondo de los pórticos sigue siendo un paño oscuro liso (sin las figuras del tímpano ni la genealogía).
  La vegetación de las enjutas es un rosario de bultos alargados y no hojas; falta el relieve «derretido» de toda la
  fachada (aquí solo hay arquivoltas, flecos y friso).
- Naixement: el parteluz con su repisa todavía se lee como una «T» o una cruz, y las puertas de bronce son paños verdosos
  con despiece, sin hiedra en relieve.
- Passió: el muro sigue plano detrás de los grupos y el porche es una caja. A pie hay árboles y una losa ajena (plazas)
  que la tapan, así que la vista buena es la del dron bajo (`baja_passio`, a 22 m de altura).
- Glòria: sigue siendo una estimación de la maqueta (frente en z ≈ 45). Faltan el infierno de la cota baja, el
  baptisterio con su surtidor y el fuego de la Penitència.
- Envejecimiento por color de vértice: en muros de pocos vértices (cajas grandes) es solo un degradado vertical, no
  chorreones. El sillar del shader K.PIEDRA sigue siendo regular; para relieve de verdad haría falta un tipo de material
  nuevo (núcleo, no es de este carril).
- Las cubiertas de las naves no han cambiado: dos aguas lisas, sin las linternas de la cubierta.
- El rostro de los símbolos de los evangelistas es muy esquemático (de lejos, el león y el buey se parecen).
- No hay vista de noche (es de SF3).

## Para la etapa siguiente (SF3)
- Noche: las vidrieras (lista `VENT` con posición, normal y tamaño de cada ventanal) pueden encenderse con un paño
  EMISIVO solo de noche, cálido al oeste (Passió) y frío al este (Naixement). Estrella y cruz.
- Repaso: tímpano del Naixement, cubiertas, figuras más finas en los grupos principales (Nativitat, Crucifixió).

## Para DESARROLLO.md
- `sagrada.js` (SF2) expone `BCN_SF.figura` y, dentro de `construir()`, las ayudas `marco`, `arcoC`, `banda`, `figura`
  y `animal`: sirven para cualquier portada gótica o grupo escultórico de otro hito.
- Patrón de envejecimiento barato: tras construir, una pasada por los vértices de piedra que oscurece por altura y por
  bloques (hash) y tiñe hacia pardo. No cuesta triángulos y funciona en todas las calidades.
