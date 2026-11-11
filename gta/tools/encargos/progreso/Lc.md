# Lc · Hitos, lote c (perfil de la ciudad) — progreso

## Hecho
- `landmarks_c.js`: los 22 hitos del lote declarados (20 con constructor + 2 de nivel C). Plantas reales de los datos
  copiadas en el código (metros relativos al centro, rot 0), así que no dependen de `h.plantas`.
- Utilidades locales: `inflar` (desplazar planta), `bandas` (forjados/lamas), `rombos` (celosía en rombo), `cuerpo`
  (sólido elíptico a lo largo de Z: el Peix).

## En curso
- Revisión con hojas de contacto (día y 22:00) y vista aérea de posiciones.

## Pendiente / dudas
- Tres Xemeneies: rot 45 (fila paralela a la costa) en vez del 140 del catálogo: comprobar en la vista aérea.

## Cómo se prueba
`node tools/hitos/tris.js c` · `python3 tools/hitos/hoja.py --lote c --rumbos 210 --cols 5`

## Trampas
- `tris.js` da `h.plantas` vacías: por eso las plantas van copiadas en el código.
