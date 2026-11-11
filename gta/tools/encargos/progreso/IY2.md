# IY2 — Portales, pisos y terrazas (carril INTERIORES)

## Hecho
- `interiors.js`: tipo `K.HOMEWIN` (id 21) con habitación virtual propia (`hmRoom`, `hmGlass`, `hmFurn`, `hmWall`) y `roomQuad()`
  (exportado en `BCN_INTERIORS.roomQuad`).
- Portal nuevo: dos hojas de vidrio con reja de forja (shader), marco, zócalo con plafones, tirador de latón, placa del número,
  portero automático; detrás el zaguán (mármol en damero o baldosa hidráulica, zócalo, buzones, escalera, ascensor, planta, lámparas).
- Pisos: ~30 % de las ventanas de calle con la persiana subida dejan ver la habitación (`details.js`, `env.windowHole(..., gq)`).
- Terrazas delante de BAR, CAFÈ, RESTAURANT y GELATERIA con acera ≥ 5,2 m.

## Pendiente
- Verificación de noche, hoja de contacto, DESARROLLO §8.2.

## Cómo se prueba
- `SIZE=640x360 FMT=jpg node tools/shot.js tools/out/iy2/b @tools/views_iy2.json > b.log 2>&1`
- Depuración: `BCN_INTERIORS.log = []` y reconstruir celdas: apunta portales (P), terrazas candidatas (T, con ancho de acera)
  y ventanas abiertas (W) con su posición de mundo.
