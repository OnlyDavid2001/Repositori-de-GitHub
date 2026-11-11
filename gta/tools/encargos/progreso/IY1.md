# IY1 — Comercios que se ven por dentro (carril INTERIORES)

## Hecho
- `interiors.js`: tabla `TYPES` (17 tipos, una fila cada uno) → textura de parámetros `tShop`; tipo de material
  `K.SHOPWIN` (id 20) con la habitación virtual (`shRoom`, `shGlass` y piezas `sh…`); comercios por grupos (`shopPlan`),
  puerta de vidrio por comercio, rótulo centrado por comercio, toldos del color del tipo, cruz de farmacia; `?shop=`.
- `facades.js`: la rama `K.SIGN` lee el atlas nuevo de 2 × 16 celdas.
- `tools/shop_preview.js`: hoja con todos los tipos sin cargar la ciudad (para iterar el dibujo).
- `DESARROLLO.md` §8.1.

## En curso / pendiente
- (ver el final del fichero: se actualiza en cada hito)

## Trampas descubiertas
- La máquina va MUY cargada cuando los tres carriles lanzan el arnés a la vez (carga 8–10 en 4 núcleos): una ejecución de
  3 vistas a 960x540 ha tardado más de 20 minutos. Lanza el arnés en segundo plano con la salida a un fichero
  (`> registro.log 2>&1`, sin `| head`: con tubería no se ve nada hasta el final) y pocas vistas a 640x360.
- El shader del escaparate es largo: SwiftShader tarda en compilarlo y en pintarlo (una vista con el vidrio ocupando
  media pantalla son minutos). En GPU real no es problema, pero aquí conviene `shop_preview.js` para iterar.
- `smoothstep(a, b, x)` con `a > b` es indefinido en GLSL: escribe `1.0 - smoothstep(b, a, x)`.

## Cómo se prueba
- `node tools/shop_preview.js /ruta/hoja.jpg frente|oblicuo|lejos|noche 480` (≈1 min).
- `Q='?shop=5' SIZE=640x360 node tools/shot.js tools/out/x/a eix_tienda,eix_tienda2 > registro.log 2>&1`
- Vistas propias: `tools/views_interiores.json` (se pasa con `@tools/views_interiores.json`).
