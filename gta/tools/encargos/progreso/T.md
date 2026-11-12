# Etapa T · Transporte (bocas de metro y paradas de bus) — progreso

## Estado
- [x] Datos: `data/transporte_metro.json` (158 estaciones de L1–L5, L9N/S, L10N/S, L11 y FGC L6, L7, L8, L12, con sus
      líneas). Fuente: Nominatim (2 consultas por estación, `nombre` y `Metro nombre`, caja de Barcelona); 22 entradas
      `subway_entrance` reales (las demás estaciones no las traen). Corregidas a mano (coordenadas conocidas) las que
      Nominatim no encontró o confundió: Espanya, Passeig de Gràcia, Poble Sec, Vall d'Hebron, Bellvitge y casi todas las
      de FGC (Pl. Catalunya, Provença, Gràcia, Sant Gervasi, Muntaner, La Bonanova, Sarrià, Pàdua, el Putxet, Av. Tibidabo).
      El guion de descarga está en el scratchpad de la etapa (`harvest.py`), no en el repo.
- [x] `transporte.js` (módulo `addMod('transp', 'BCN_TRANSPORTE', …)`), script en `index.html` antes de `lighting.js`.
- [x] Bocas: sitios automáticos (2–4 por estación según sus líneas), forma y profundidad, tótem, variantes.
- [x] Paradas de bus: marquesinas y postes.
- [x] Hoja ANTES/DESPUÉS en el scratchpad (`n3/t/hoja_T.jpg`).

## Recuento (todas las estaciones colocadas con `placeAll()`)
158 estaciones, 354 bocas (68 con ascensor, 114 con marquesina), 484 marquesinas de bus y 1 583 postes.
| Línea | Estaciones | Bocas |
| --- | --- | --- |
| L1 | 30 | 72 |
| L2 | 18 | 44 |
| L3 | 26 | 65 |
| L4 | 22 | 52 |
| L5 | 28 | 68 |
| L9 Nord | 9 | 23 |
| L9 Sud | 15 | 37 |
| L10 Nord | 6 | 17 |
| L10 Sud | 11 | 27 |
| L11 | 5 | 12 |
| L6 (FGC) | 9 | 23 |
| L7 (FGC) | 7 | 17 |
| L8 (FGC) | 9 | 21 |
| L12 (FGC) | 2 | 6 |
(una boca cuenta en cada línea de su estación). Coste de colocación en el arnés (SwiftShader): paradas 0,5–0,7 s al
iniciar (una vez); bocas ≈ 55 ms por estación, en cola con presupuesto de 3 ms por fotograma pero sin trocear dentro de
una estación (un tirón al acercarse a cada una: pendiente de trocear).


## Para DESARROLLO.md (sección nueva «Transporte»)
- `transporte.js`, `window.BCN_TRANSPORTE = { LINES, init(ctx) → { update, busy, flush, stats, info, placeAll, entrances, stops } }`.
  Módulo de primer nivel con celdas propias de 200 m y dos niveles (1: ≤ 165 m, 2: 140–440 m) fundidos con `dith`.
- Material: copia del shader de detalle (como `rooftops.js`) con dos tipos propios registrados al cargar:
  `TRSIGN` (140, rótulo del atlas `tTrSign`, uv por vértice en `aux.xy`, `aux.z` = se enciende) y `TRIN` (141, regletas y
  paños oscuros). Ids 140–149 reservados para transporte.
- **El hueco de la boca sin tocar la acera** (técnica reutilizable para cualquier hueco en el suelo): el interior (escalera,
  paredes, rellano) es una malla aparte con material propio `trIn`. Cada píxel calcula dónde corta el rayo cámara→píxel el
  plano de la boca (`yTop` = acera + 0,11) y, si cae dentro del rectángulo del hueco, se pinta con la profundidad de ese
  punto del plano adelantada 0–10 cm (según lo lejos que quede detrás: así se ordenan peldaños y paredes entre sí); si cae
  fuera, `discard`. Así tapa la acera (que queda bajo el plano) y queda detrás de todo lo que se interpone. Hasta 16 bocas
  por malla (`uOp`, dos vec4 por boca: centro, rumbo, semimedidas y cota; el índice va en `aux.w`). Primera prueba fallida
  (apuntada para no repetirla): una tapa que escribe `gl_FragDepth = 1` NO sirve, porque la prueba de profundidad usa la
  profundidad escrita y la tapa no pasa nunca.
- Azar: `seed(150, estación, k)` y `seed(151, tramo, n)`.
- Colocación: no pisa calzada (≥ 1,85 m del bordillo: fuera de alcorques, farolas, papeleras), edificios (margen 0,8 m),
  cruces (11 m), bancos, buzones, parquímetros (misma retícula `along` que `furniture.js`), otras bocas ni paradas. Las
  paradas van centradas entre dos árboles (retícula de 10,5 m de `streets.js`) y sin farola/papelera/banco encima.
