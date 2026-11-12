# PU3 · Repaso del puerto (notas del revisor) — progreso

Rama `wt-n3-puerto`. Fichero: `puerto.js` (sin tocar ficheros de otros carriles).

## Estado
- [x] Lectura de comun.md, PUERTO.md, PU1.md, PU2.md e informes.
- [x] Código: noche industrial (charcos de luz), cascos, piezas pequeñas con nivel de detalle, viario (aduanas y remolques).
- [ ] Capturas ANTES/DESPUÉS y hojas (`n3/pu3/`).

## Cómo está hecho (para DESARROLLO.md)
- `puerto.js` envuelve `BCN_LANDMARKS.init` (sin editar landmarks.js): guarda el contexto (para `ctx.SEG`) mientras se
  construyen las fichas y, al terminar, monta (1) el material nocturno de las fichas industriales y (2) las mallas de lo pequeño.
- Noche industrial (`NOCHE_IND`: terminales de contenedores, playa de vías, ZAL, Mercabarna, Zona Franca, depósitos): copia
  del shader de los hitos (como hace rooftops.js con el de detalle) que de noche desatura y oscurece el albedo (−74 % en lo
  horizontal, −60 % en muros, como las azoteas de la ciudad), quita el aura de calle y suma la luz de una textura de charcos
  (`LUCES` → luminancia de 4 m/píxel): blanca, más en lo horizontal, hasta ~50 m de altura. Cada torre de focos, grúa pórtico
  (bajo el pórtico y bajo la pluma), grúa de patio, muelle de carga y aduana aporta su charco (`luz(h, x, z, radio, I)`).
- Piezas pequeñas (`peq(h, x, z)` devuelve un constructor por celda de 250 m y ficha): camiones, remolques, carretillas
  pórtico, vagones y locomotoras, contenedores sueltos, norays, defensas, autocares, soportes de tubería y vallas. Cada celda
  es una malla con `addLODLevel(700, null)`: a más de 700 m no se dibuja. Medida en `window.BCN_PUERTO.peq`.
- Cascos (`casco`): loft por secciones (fondo estrecho y proa recogida bajo el agua, abanico y proa lanzada en la cubierta,
  espejo de popa con vuelo), regala con arrufo, franjas de color; `sup` (superestructura con frente achaflanado, en terrazas)
  y `cabina` (parabrisas inclinado) para cruceros, ferris, portacontenedores, remolcadores, golondrinas y yates.
- Aduanas: en la entrada real del recinto (`entrada()`: la calle más ancha de `ctx.SEG` que cruza el contorno de Nominatim),
  30 m hacia dentro, orientadas a la calle y con carriles según su anchura. `libre()` y la playa de vías descartan la calzada.
