# Progreso · etapa AZ (PALETA: color fijo a cualquier distancia y azoteas con detalle)

## Hecho
- Diagnóstico: causas del cambio de color al acercarse (ver informe abajo).
- `palette.js` (nuevo): `window.BCN_PAL`, color de fachada y de cubierta por edificio y por familia de barrio (15 familias
  de `comun.md`), determinista por índice de edificio + semilla. Tabla de 64 colores de cubierta (azotea, teja, asfáltica,
  grava). El índice de cubierta viaja en los 2 bits bajos de cada canal del color de vértice.
- `app.js`: barrios (cajas y `BCN_BARRI`) antes de cargar los edificios; color horneado al cargar; `FS_BLD` sin el mosaico
  `tq` ni la paleta de cubiertas por hash (de día: textura `uRoofPal`); ruidos de muro y cubierta prefiltrados por tamaño de
  píxel (y el de cubierta en coordenadas locales); noche: la paleta se acerca al tono medio de antes (60 %); `addMod('roof')`.
- `facades.js` (una línea, `bget`): `d.col` = `BCN_PAL.wall(b)`, el mismo color horneado.
- `rooftops.js` (nuevo): módulo de primer nivel con celdas de 100 m; completo a ≤ 250 m (sombra, layer `furn`), cajas
  sencillas hasta 700 m.

## Pendiente
- (se actualiza al final de la etapa)

## Cómo se prueba
- `node tools/shot.js <prefijo> @<vistas.json>` con las vistas de la secuencia (1500/600/200/50 m sobre la misma manzana del
  Eixample a las 10:30), `n600` (23:00), `aereo` (13:00, `maxDist` 40000) y `roof_eix`/`roof_gra` (dron a 60–70 m).
- `BCN.detailStats().roof` → `{ cells, items, trisNear, trisFar, queue }`.
