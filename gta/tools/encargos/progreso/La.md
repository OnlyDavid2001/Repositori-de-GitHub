# La — hitos del lote a (Gaudí y modernismo)

Fichero: `gta/landmarks_a.js`. Prueba: `node tools/hitos/tris.js a` y `python3 tools/hitos/hoja.py --lote a …`.

## Hecho
- sagrada_familia (A, ~10 200 tris): acabada, 18 torres en las posiciones de los datos OSM (crucero en local (−1,9, −18,4)),
  naves con ventanales, ábside, claustro, sacristías, Glòria con pórtico y puente sobre Mallorca, Escoles. Día y noche vistos.

- casa_mila (A, ~3 300): fachada ondulada (loft), balcones de hierro, patios, desván, chimeneas.
- casa_batllo (A, ~1 200) y casa_amatller (B): fachadas en z ≈ 19,5 (cuerpos delanteros 114974, 114379, 114435 añadidos).
- park_guell (A, ~2 200): RECOLOCADO (el catálogo apuntaba al centro del parque): origen en la puerta de c/ Olot entre
  los pabellones de los datos (164377, 164419), rot 315; plaza del suelo del juego. Solo oculta 3 volúmenes.
- sant_pau (A): pabellones sobre sus plantas reales (ladrillo, cubiertas vidriadas, cúpulas) y Administració con torre.
  Solo 55 volúmenes (los alineados N-S del recinto + la Administració); el catálogo traía 89 casas del Eixample.

## Pendiente
- Nivel B y C del lote.

## Trampas
- EMISIVO se ve gris de día (alb × 0,45): la cruz va en LISO blanco.
- En superficies de revolución fuera del origen el patrón de PIEDRA se deforma: las agujas van en LISO con anillos de color
  (función `bandas`) para simular las celosías.
