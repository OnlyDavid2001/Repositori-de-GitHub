# Progreso etapa S (SUELOS, día 3)

## Estado
- [x] `suelos.js` (nuevo, cargado antes de `lighting.js` y de `app.js`): `BCN_RENTA` (nivel económico por barrio, tabla de
      n3/comun.md), grandes avenidas reconocidas por su trazado (Diagonal, Gran Via, Passeig de Gràcia), `asfalto(…)` y `acera(…)`.
- [x] `FS_ROAD` (app.js): estado del asfalto por polilínea en `uv.w` (→ `vInfo.w`); tono de lejos; de cerca parches por carril
      con junta, grietas selladas con betún, piel de cocodrilo, árido descarnado, baches; pintura nítida o borrada.
- [x] `streets.js`: atlas gemelo sin filtrar (`tKind`) con modelo de acera y desgaste; 6 modelos de baldosa; bordillo y
      alcorque según el modelo.
- [x] Capturas ANTES (13 vistas) · [ ] DESPUÉS y ajuste

## Para DESARROLLO.md
### Suelos (etapa S, `suelos.js`)
- `window.BCN_SUELOS = { asfalto(cls, hw, x0, z0, x1, z1) → desgaste 0–4,99, acera(cls, hw, x0, z0, x1, z1) → [modelo, desgaste 0–1],
  avenida(x0, z0, x1, z1) → 'diagonal' | 'granvia' | 'pgracia' | null, nivel(x, z), barri(x, z) }` y
  `window.BCN_RENTA = { nivel(x, z) → 0 muy alto … 4 muy bajo (3,4 fuera de Barcelona; 1,8 al noroeste: Esplugues), barri, NIVEL }`.
  Módulo de datos puro: se carga antes de `app.js`, que al trazar las calles aún no tiene `BCN_BARRI` y le pasa `META.barris`
  en `BCN_SUELOS._barris`. Caché del nivel en rejilla de 100 m.
- Asfalto: parte entera del desgaste = estado (0 nuevo · 1 seminuevo · 2 gastado normal · 3 bastante gastado · 4 muy gastado).
  Base por nivel de barrio, ruido por zona (~260 m) y por tramo; vías principales −0,35, servicio +0,45, autopistas y rondas ~1,1;
  Diagonal, Gran Via y Passeig de Gràcia ~1 (seminuevas); un 6 % de tramos recién asfaltados en cualquier barrio y un 5 % de
  tramos dejados en barrios medios o humildes. Va por polilínea de `roads.png` en `uv.w` del vértice de calzada (`vInfo.w` en
  `FS_ROAD`). En el shader: de lejos solo el tono (0,80 → 1,22 del color base y más gris), de cerca (`near`) los detalles, todos
  con `lod` por tamaño de píxel (sin moiré). Las variables `crk` (oscurecimiento de grietas, se aplica después de la pintura) y
  `mk0` (pintura sin desgastar) son de este bloque; el de `ground.js` no cambia.
- Aceras: 0 panot de flor estándar · 1 hexagonal del Passeig de Gràcia (amonite, estrella y alga en relieve, gris verdoso,
  25 cm) · 2 Diagonal (losa de 40 cm con estrías a 45°, interpretación: no he encontrado fuente del diseño real) · 3 panot nuevo y
  limpio · 4 panot sucio y dejado (manchas, chicles, piezas rotas o remendadas, juntas negras) · 5 losas grandes de granito
  80×40 a matajuntas (22@, Diagonal Mar, Vila Olímpica, Provençals). Por tramo con aceras (o peatonal), en un atlas gemelo
  del campo de aceras (`tKind`, mismo hueco, NEAREST): R = 40·modelo, G = desgaste. El granito de plazas y peatonales coge el
  desgaste. Bordillo (cara vertical): `uv.x = −(2 + modelo + 0,9·desgaste)` (antes −1; el shader acepta los dos). Alcorques:
  reja de fundición (0, 1, 3), sauló claro sin reja (2, 5), tierra pisada sin reja (4).
