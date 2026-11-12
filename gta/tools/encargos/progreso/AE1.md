# AE1 · Aeropuerto, lado aire y terminales (en curso)

## Hecho
- `aeropuerto.js` (nuevo) + `data/aero_lado_aire.json`; `<script>` tras `landmarks_e.js` (necesita `BCN_LM`); `addMod('aero')` tras `nat`.
- Datos: pistas (extremos ajustados por PCA sobre la franja oscura de `ground.webp`: 07L/25R 3 339 m, 07R/25L 2 649 m,
  02/20 2 510 m, rumbos 66,2° y 19,6°), calles de rodaje (esqueleto del mapa, 265 polilíneas), plataformas, plantas OSM
  (Nominatim: T1, T2, torre «Este», torre antigua, hangar, terminal corporativa), 29 pasarelas de la T1.
- Hitos: T1 (se cambia el constructor de la ficha `aeroport` de landmarks_e.js), T2, torre de control, torre antigua,
  hangar, bomberos, aviones y vehículos (una malla), `aero_campo` (sin malla: despeja de árboles el campo de vuelo).
- Marcas en el suelo (shader propio): pistas completas, puntos de espera, puestos.
