# La — hitos del lote a (Gaudí y modernismo)

Fichero: `gta/landmarks_a.js`. Prueba: `node tools/hitos/tris.js a` y `python3 tools/hitos/hoja.py --lote a …`.

## Hecho
- sagrada_familia (A, ~10 200 tris): acabada, 18 torres en las posiciones de los datos OSM (crucero en local (−1,9, −18,4)),
  naves con ventanales, ábside, claustro, sacristías, Glòria con pórtico y puente sobre Mallorca, Escoles. Día y noche vistos.

## Pendiente
- casa_mila, casa_batllo, park_guell, sant_pau (A); los de nivel B y C.

## Trampas
- EMISIVO se ve gris de día (alb × 0,45): la cruz va en LISO blanco.
- En superficies de revolución fuera del origen el patrón de PIEDRA se deforma: las agujas van en LISO con anillos de color
  (función `bandas`) para simular las celosías.
