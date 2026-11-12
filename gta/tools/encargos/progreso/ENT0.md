# ENT0 · Investigación de las dos plazas y de la escalinata de la Glòria hasta la Diagonal

Rama `wt-sf-entorno`. Capturas y hoja: `<scratchpad>/sf/ent0/` (`antes_*.jpg`, `plan.png`,
`hoja_ent0_antes_despues.jpg`; vistas en `views.json`; generadores en `gen/mk.py` y `gen/hoja.py`; respuestas de Nominatim en
`nom_*.json` y `nomq_*.json`). Sin errores ni avisos de consola en las capturas. **Estado: hecho** (con huecos, abajo).

## Qué se ha hecho
- `gta/data/sf_ent_ref.json` (nuevo, confirmado): todo en coordenadas del juego y, además, en **ejes locales de la ficha
  `sagrada_familia`** (centro 12597,9/15875,2, rot 136; `punto = centro + X·vecX + Z·vecZ`, vectores en `ejes`).
  - **Calles medidas sobre OSM** (ejes de calzada, local): Provença Z −83,0 · Mallorca Z +50,6 · València Z +184,4 ·
    Aragó Z +318,3 · Marina X −78 · Sardenya X +73,4 · Lepant X −208 · Sicília X +205. Paso de manzana 133,4 m.
    **La Diagonal corta el eje de la Glòria (X = 0) en Z ≈ +352,6** (mundo 12842,8/15621,6): dos manzanas
    (Mallorca–València y València–Aragó) más el triángulo Aragó–Diagonal. Marina es peatonal ante el Naixement.
  - **Plaça de Gaudí** (relation/7708297, 9867 m²): contorno, historia (Rubió i Tudurí, 1981), estanque de ≈3000 m²
    (espejo del Naixement; el lado de Mallorca, antiguo modelismo naval), monolito de Corberó (mármol blanco, 2,36 m, dentro del
    estanque en un lateral), dotaciones (bancos, 2 fuentes, juegos, petanca y bolos catalanes, bar con terraza, urinario,
    Punt verd en Lepant–Provença), puntos OSM de juegos, bancos y fuentes.
  - **Plaça de la Sagrada Família** (way/23431084, 11 626 m²): contorno, historia (Rubió i Tudurí, 1928; paseos curvos y
    diagonales, la vista frontal enmarcada), estanque pequeño, dotaciones, 2 zonas de juegos, bancos, fuentes, quiosco y
    **arbolado del inventario** (tipuanas 22 %, árbol del amor 11 %, melia 10 %; pino, almez, laurel, cedro, jacarandá y
    cipreses altos).
  - **Glòria**: lo que es del proyecto (con fuente) separado de la interpretación para ENT2 (franjas en Z local, 60 m de ancho).

## Del proyecto (fuentes en el JSON)
Pórtico a 4–5 m sobre Mallorca; plaza elevada que cubre Mallorca con el tráfico por debajo en un túnel decorado (infierno,
vicios); escalinata de ≈57 m hacia la manzana de enfrente; Monumento al Fuego y al Agua en la terraza (tedero con fuego y un
surtidor de 20 m que se abre en 4 cascadas); derribo de Mallorca 410-414 (Núñez y Navarro) y de lo que hay hasta València;
PGM 1976: avenida de 60 m de ancho por las dos manzanas hasta la Diagonal (> 200 m). En sept. 2026 la Junta plantea un
mínimo: solo la escalinata, realojando a los vecinos de 410-414.

## Interpretación (para ENT2)
Ancho 60 m centrado en X = 0; umbral Z +40 a cota calle + 4,5; plaza elevada Z +40…+66; terraza del monumento +66…+80;
escalinata +80…+137 (3 tramos, 2 rellanos); explanada a cota de calle hasta València (+174); València a nivel; avenida-paseo
+194…+308; Aragó a nivel; triángulo hasta la Diagonal (+352,6). Edificios fuera de la franja de 60 m: se conservan.

## Huecos (sincero)
- **Interior exacto de las plazas** (contorno del estanque, la isla, caminos, parterres, árboles uno a uno): Overpass, la API
  de OSM y la ortofoto del ICGC están **bloqueados por el proxy**; Nominatim no devuelve agua ni caminos sin nombre. El
  estanque de Gaudí está como área (3000 m²) y descripción; la isla y la forma son interpretación. ENT1 tendrá que trazarlos
  por fotos o con acceso a Overpass (petición al orquestador).
- Arbolado de la Plaça de Gaudí: sin inventario escrito; queda como interpretación por fotos.
- **Discrepancia**: `comun.md` pone la línea de la Glòria en Z +71, pero Mallorca tiene el eje en +50,6 (bordillos +40,5 y
  +60,6): +71 cae dentro de la manzana de enfrente. La ficha actual (largo 142) también invade Mallorca. ENT2 toma el pórtico en
  Z +40; si la basílica se queda en +71, la escalinata se traslada (todo va en Z local).
- La primera `antes_gaudi_pie` quedó dentro de un volumen; repetida en local (−160, +10). El estado actual de la Plaça de Gaudí es genérico: sin estanque, arbolado de paseo, juegos y farolas sueltas.

## Coste
ENT0 no cambia el juego. Línea base (antes) medida: hitos 698 777 tri (≈476 000 visibles en las cuatro vistas); plazas:
dron 120 526 visibles, a pie en Gaudí ≈51 600, en la Plaça de la Sagrada Família ≈57 500, en Mallorca ≈51 600.

## Para DESARROLLO.md
- `data/sf_ent_ref.json`: referencia del entorno de la Sagrada Família (plazas de Gaudí y de la Sagrada Família, escalinata de
  la Glòria y eje hasta la Diagonal) en ejes locales de la ficha `sagrada_familia`; separa proyecto de interpretación.
- La Diagonal cruza el eje de la Glòria en Z local +352,6; Mallorca en +50,6.
