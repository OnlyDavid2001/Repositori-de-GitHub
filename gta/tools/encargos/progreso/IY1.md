# IY1 — Comercios que se ven por dentro (carril INTERIORES)

## Hecho
- `interiors.js`: tabla `TYPES` (17 tipos, una fila cada uno) → textura de parámetros `tShop`; tipo de material
  `K.SHOPWIN` (id 20) con la habitación virtual (`shRoom`, `shGlass` y piezas `sh…`); comercios por grupos (`shopPlan`),
  puerta de vidrio por comercio, rótulo centrado por comercio, toldos del color del tipo, cruz de farmacia; `?shop=`.
- `facades.js`: la rama `K.SIGN` lee el atlas nuevo de 2 × 16 celdas.
- `tools/shop_preview.js`: hoja con todos los tipos sin cargar la ciudad (para iterar el dibujo; ~10 s).
- Revisión del integrador (segundo agente de la etapa):
  1. MODA: maniquíes con silueta (cuerpo entero con ropa, vestido, o busto de sastre con peana).
  2. SUPERMERCAT: carteles de oferta con franja, líneas de texto y precio de siete segmentos.
  3. Anochecer: `shGlass` limita la subida (claro 1,5 · oscuro 2,2 · luminarias sin subir). `pg_tiendas` a las 20,25:
     píxeles ≥ 235 del 4,0 % al 1,8 % (de día, 1,1 %).
  4. Reflejo: Fresnel de vidrio de dos caras (7 % de frente → 64 % a 82°). Ver el OJO de §8.1: a pie, el vidrio más
     cercano en pantalla está como mucho a ~55° de incidencia.
  5. Cuña de `gotic_calle`: ya no aparece (ese tramo es ahora un comercio con geometría nueva). Causa antigua sin aislar.
- `tools/views_interiores.json` (vistas del carril) y `tools/shop_sheet.py` (hojas de contacto de los 17 tipos en la ciudad).
- `DESARROLLO.md` §8.1 al día (capas, empaquetado, cómo se prueba, límites conocidos, notas para IY2).

## Verificación final (hecha)
- Hojas de contacto de los 17 tipos DENTRO de la ciudad, de frente (~5 m) y en oblicuo (~6 m), a 480x270 y calidad alta:
  `<scratchpad>/iy1_hoja_frente_ciudad.jpg` e `iy1_hoja_oblicuo_ciudad.jpg` (34 vistas, sin errores de consola).
- `tools/views_interiores.json` entero (13 vistas a 640x360: frente, oblicuo, acera a 30 y a 120 m, rasante, las cinco con
  tienda, `gotic_calle` y dos al anochecer): sin errores ni avisos de consola. Hojas en `<scratchpad>/iy1_vistas_dia.jpg`
  e `iy1_vistas_noche.jpg`. No se hicieron las PNG a 960x540 (máquina con carga 12–16: cada vista, 1–2 min).
- `node --check` de todos los `.js`: bien.

## Pendiente (para IY2 o QA)
- En `gotic_tienda`, el edificio de la izquierda se ve borroso (volumen simple con ventanas pintadas, a 10 m): ya estaba
  así en la referencia «antes»; no es de los comercios (edificio sin capa de detalle).
- Portales y pisos con la misma habitación (IY2).
- Lo flojo: ver «Límites conocidos (IY1)» en §8.1.

## Trampas descubiertas
- La máquina va MUY cargada cuando los tres carriles lanzan el arnés a la vez (carga 12–16 en 4 núcleos): la primera
  vista tarda 5–6 min y las siguientes 1,5–2,5 min a 640x360. Lanza el arnés en segundo plano con la salida a un fichero
  (`> registro.log 2>&1`, sin `| head`) y pocas vistas.
- El shader del escaparate es largo: SwiftShader tarda en compilarlo y en pintarlo (una vista con el vidrio ocupando
  media pantalla son minutos). En GPU real no es problema, pero aquí conviene `shop_preview.js` para iterar.
- `smoothstep(a, b, x)` con `a > b` es indefinido en GLSL: escribe `1.0 - smoothstep(b, a, x)`.
- Forzar el tipo en caliente dentro de una ejecución del arnés funciona y cuesta poco (la vista con reconstrucción tarda
  lo mismo que las demás): `eval: "BCN_INTERIORS.force=9;BCN.fx.setRange(0);BCN.fx.setRange(1);"`.
- `shop_preview.js` es WebGL1: nada de operadores de bits ni matrices con inicializador en las funciones `sh…`.

## Cómo se prueba
- `node tools/shop_preview.js /ruta/hoja.jpg frente|oblicuo|lejos|noche 480` (≈10 s).
- `SIZE=640x360 node tools/shot.js tools/out/iy/v @tools/views_interiores.json > registro.log 2>&1`
- Hojas de los 17 tipos en la ciudad: ver la cabecera de `tools/shop_sheet.py`.
