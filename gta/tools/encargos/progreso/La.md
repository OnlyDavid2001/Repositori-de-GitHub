# La — hitos del lote a (Gaudí y modernismo)

Fichero: `gta/landmarks_a.js`. Prueba: `node tools/hitos/tris.js a` (1 s) y hojas con `tools/hitos/hoja.py --lote a`.
Total del lote ≈ 39 000 triángulos en el juego (BCN.lm.stats con los 21 hitos de la rama: 39 225); sin errores de consola.

## Hecho (id · nivel · triángulos en tris.js, sin plantas reales)
- sagrada_familia · A · 10 400. Acabada: 18 torres en las posiciones de las agujas OSM (crucero en local (−1,9, −18,4)),
  celosías como anillos de color, pináculos de trencadís, cruz blanca y estrella; naves con ventanales y frutas, ábside,
  cimborrio, claustro, sacristías, Glòria con pórtico y puente sobre Mallorca, Escoles. Día y 22:00 vistos.
- casa_mila · A · 3 300: fachada ondulada (loft remuestreado), balcones de hierro, patios, desván, chimeneas-guerrero.
- casa_batllo · A · 1 200: fachada en z ≈ 19,5 (añadido el cuerpo delantero 114974), lomo de dragón, máscaras, torrecilla.
- park_guell · A · 2 200: RECOLOCADO en la puerta de c/ Olot (pabellones 164377/164419 de los datos), rot 315; plaza
  plana (PY 18,5) sobre la columnata, banco de trencadís, escalinata con dragón, pabellones con torre y seta.
- sant_pau · A: pabellones sobre sus plantas reales (ladrillo, cubiertas vidriadas, cúpulas) + Administració con torre.
  Solo 55 volúmenes (alineados N-S en el recinto + 166388); el catálogo traía 89 casas del Eixample.
- B: casa_amatller, palau_musica, casa_vicens, palau_guell, bellesguard, casa_punxes, pavellons_guell, monumental,
  universitat, mercat_sant_antoni, castell_tres_dragons.
- C: casa_lleo_morera, casa_calvet (+ remates curvos), fundacio_tapies (+ nube de tubos, fachada: false).

## Saltado
- teresianes: el catálogo lo marca dudoso (sin volumen con la planta 18 × 65; rot de memoria).

## Flojos / dudas
- Casa Vicens y Palau de la Música: calles estrechas, apenas se ven desde fuera; no comprobados de cerca.
- Lleó i Morera y Calvet: solo retoque, casi no se distinguen.
- Park Güell: el terreno del juego sube por detrás de la plaza y tapa su extremo NO.

## Trampas
- EMISIVO se ve gris de día (alb × 0,45): la cruz va en LISO blanco.
- En revoluciones fuera del origen el patrón de PIEDRA se deforma: agujas en LISO con anillos de color (`bandas`).
- BCN.lm.view usa el radio de la malla: con k ≥ 1 la cámara puede quedar detrás de la manzana de enfrente; para
  casas entre medianeras, mejor cámara libre (vis.py del scratchpad acepta `@x,z,y,yaw,pitch`).
- Las plantas OSM del catálogo pueden no ser la fachada (Batlló/Amatller tenían el cuerpo delantero aparte).
