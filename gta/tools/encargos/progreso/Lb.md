# Lb — hitos del lote b (Camp Nou y Montjuïc)

## Hecho
- `gta/landmarks_b.js`: 19 fichas (16 con constructor, 3 retoques de nivel C). ~21 000 triángulos (tris.js).
- Funciones locales: superelipse y cápsula por rayo (`SE`, `CAP`), `banda`, `corona`, `hueco`/`huecosAnillo` (arcos pintados), `almenas`.

## Revisado (arnés)
- Hojas de día (rumbo 300) de los 16 con malla, noche 22:00 (rumbo 120) de los de nivel A + Font Màgica, y vista aérea
  (rumbo 90, elev 62) de Camp Nou, Estadi, MNAC, Castell, CaixaForum y Arenas: colocación y giro casan con las calles.
- Sin errores de consola; BCN.lm.stats(): 19 hitos del lote, errores [], 26 911 tris en total con los ejemplos.

## Pendiente / saltados
- `palaus_fira`: saltado (posición y edificios dudosos en el catálogo; los volúmenes de los datos ya tienen torretas).
- Mejorables: Font Màgica (chorros finos y poco vistosos de noche), Torre de Calatrava (anillo pequeño; dirección de la
  inclinación de memoria), CaixaForum (posición de las torres supuesta), Teatre Grec (escena muy sencilla).

## Cómo se prueba
- `node tools/hitos/tris.js b` · `python3 tools/hitos/hoja.py --lote b --rumbos … --out tools/out/lb`

## Trampas
- Mapas de plantas sin navegador: script en el scratchpad (`lb/mapa.js` + `mapa.py`, usa tools/hitos/datos.js).
- Estadi Olímpic: la planta de los datos (184 × 277, N-S) ES el estadio; el rumbo 70 del catálogo no casa: uso 2.
- MNAC: rot 334 (no 64) para que +Z sea la fachada (al NNO).
