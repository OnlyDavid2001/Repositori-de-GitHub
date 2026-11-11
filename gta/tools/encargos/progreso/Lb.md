# Lb — hitos del lote b (Camp Nou y Montjuïc)

## Hecho
- `gta/landmarks_b.js`: 19 fichas (16 con constructor, 3 retoques de nivel C). ~21 000 triángulos (tris.js).
- Funciones locales: superelipse y cápsula por rayo (`SE`, `CAP`), `banda`, `corona`, `hueco`/`huecosAnillo` (arcos pintados), `almenas`.

## En curso
- Revisión con hojas (día + 22:00) y correcciones.

## Pendiente / saltados
- `palaus_fira`: saltado (posición y edificios dudosos en el catálogo).

## Cómo se prueba
- `node tools/hitos/tris.js b` · `python3 tools/hitos/hoja.py --lote b --rumbos … --out tools/out/lb`

## Trampas
- Mapas de plantas sin navegador: script en el scratchpad (`lb/mapa.js` + `mapa.py`, usa tools/hitos/datos.js).
- Estadi Olímpic: la planta de los datos (184 × 277, N-S) ES el estadio; el rumbo 70 del catálogo no casa: uso 2.
- MNAC: rot 334 (no 64) para que +Z sea la fachada (al NNO).
