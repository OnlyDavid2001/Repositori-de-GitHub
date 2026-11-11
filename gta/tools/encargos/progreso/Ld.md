# Ld · Hitos, lote d (Ciutat Vella, puerto y monumentos) — progreso

## Hecho
- `landmarks_d.js`: los 22 hitos del lote declarados (A: colom, catedral, santa_maria_mar, arc_triomf; B: el resto).
  `node tools/hitos/tris.js d` sin errores (≈14 000 triángulos).

## En curso
- Revisión con hojas de contacto (día y 22:00) y vistas aéreas de colocación.

## Cómo se prueba
`node tools/hitos/tris.js d` · `python3 tools/hitos/hoja.py --lote d --rumbos 210 --out tools/out/lote_d`

## Trampas
- Las plantas de los datos van copiadas en el fichero (en `tris.js` no hay `h.edif`).
