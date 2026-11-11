# IY2 — Portales, pisos y terrazas (carril INTERIORES)

## Hecho
- `interiors.js`: tipo `K.HOMEWIN` (id 21) con habitación virtual propia (`hmRoom`, `hmGlass`, `hmFurn`, `hmWall`) y `roomQuad()`
  (exportado en `BCN_INTERIORS.roomQuad`).
- Portal nuevo: dos hojas de vidrio con reja de forja (shader), marco, zócalo con plafones, tirador de latón, placa del número,
  portero automático; detrás el zaguán (mármol en damero o baldosa hidráulica, zócalo, buzones, escalera, ascensor, planta, lámparas).
- Pisos: ~30 % de las ventanas de calle con la persiana subida dejan ver la habitación (`details.js`, `env.windowHole(..., gq)`).
- Terrazas delante de BAR, CAFÈ, RESTAURANT y GELATERIA con acera ≥ 5,2 m.

- Remate de IY1: la paleta VARIADO (súper, queviures, papereria) menos saturada.
- DESARROLLO §8.2 escrito (portales, pisos, terrazas, depuración y límites).

## Verificación (hecha, 640x360 / 400x225, máquina con carga 9–11)
- `tools/views_iy2.json` (portal de frente y oblicuo, pisos de día, noche a las 22 h de cerca y a 100 m, terraza con BAR
  forzado y la misma acera a ~60 m): sin errores ni avisos de consola.
- Hoja de contacto de 6 portales y 12 ventanas abiertas: `<scratchpad>/iy2_hoja.jpg` (antes de estrechar las cortinas y
  añadir el segundo modelo de reja; después, comprobado en 4 vistas).
- A las 20,25 todavía es de día (el sol se pone a las 21): la noche se comprobó a las 22.

## Pendiente / flojo
- Ventanas de piso de día: se leen poco desde abajo (vidrio casi negro con el reflejo liso de envRefl).
- Zaguanes muy parecidos entre sí (cambian suelo, pared, lado de escalera/buzones y reja; la composición es la misma).
- Terrazas: no comprueban una a una el mobiliario de furniture.js; sillas de cajas.
- No se hicieron las PNG a 960x540 (carga de la máquina).

## Cómo se prueba
- `SIZE=640x360 FMT=jpg node tools/shot.js tools/out/iy2/b @tools/views_iy2.json > b.log 2>&1`
- Depuración: `BCN_INTERIORS.log = []` y reconstruir celdas: apunta portales (P), terrazas candidatas (T, con ancho de acera)
  y ventanas abiertas (W) con su posición de mundo.
