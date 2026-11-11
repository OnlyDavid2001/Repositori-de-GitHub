# Le — hitos del lote e (Collserola, zona alta, Sants/Fira, aeropuerto)

## Hecho
- Primera versión de los 22 hitos en `gta/landmarks_e.js` (3 A, 17 B, 2 C); `node tools/hitos/tris.js e` sin fallos.

## En curso
- Revisión con hojas (día, 22:00 los A, aérea de colocación).

## Trampas
- `h.edif` viene vacío en tris.js: cada constructor que usa plantas reales tiene planta de reserva.
- Datos de Collserola: plataformas de 84 a 152 m (13, cada 5,4 m), fuste hasta 205 m, mástil hasta 288 m.

## Cómo se prueba
- `node tools/hitos/tris.js e` · `python3 tools/hitos/hoja.py --lote e --rumbos …`
- Script de apoyo (no versionado): scratchpad/le/loc.js imprime los edificios de cada hito en coordenadas locales.
