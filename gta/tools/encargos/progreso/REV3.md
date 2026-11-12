# REV3 · Revisión del Día 3 (defectos visibles y hoja final)

Estado: EN CURSO. Capturas en `scratchpad/n3/rev3/` (arnés `run.sh <dir gta> <prefijo> <views.json>`, una carga por tanda;
`base/gta` = estado antes de REV3, es decir, 7d9d241 + fusión de P4).

## Hecho
0. **P4 fusionada** (`git merge origin/wt-n3-plazas`, p4.done existía). Solo cambia plazas.js; `tools/mz_partidas.js`
   relanzado: el JSON sale idéntico salvo los tiempos de cálculo (no se confirma).
1. **Mar de noche** (app.js, FS_SEA `seaLights`): busca a lo largo de la recta cámara→punto de agua la primera franja de calle
   de la orilla (máscara de calles `uStreet`, pasos geométricos de 15 m a 2,6 km y bisección) y allí las farolas (una por
   celda de 22 m con azar): cada una deja una estela fina de lado y larga hacia la cámara, torcida por la pendiente del
   oleaje y troceada en guiones que se mueven; cálida en el paseo y blanca en el puerto (al suroeste de la Barceloneta);
   más un brillo suave del agua frente a la ciudad. Solo de noche (`uGlow.x`) y se apaga desde 250–900 m de altura.
5. **Aeropuerto**: oficinas de hormigón de `aero_edificis` (el bloque blanco liso de `pie_lejos`) con cuerpo gris arena y
   bandas corridas de vidrio oscuro por planta; cara inferior del viaducto de salidas con paños emisivos suaves solo de noche.
   `window.BCN_AEROED` (pruebas) lista los volúmenes de esa ficha.
9. **Árboles de calle en las plazas** (streets.js `treesOf`): ni árboles ni alcorques sobre `BCN_PLAZAS.pavAt(x, z)`.
3. **Plazas**: granito (dibujos 1 y 9) con grano, losas de tono distinto y manchas a pie; de noche el charco de farola del
   pavimento baja (1,6 → 1,15) y es menos naranja. Fuente de Espanya: grupos con roca, figura sentada, figura de pie con el
   brazo en alto y ánfora con chorro (antes, dos bultos). Gat de Botero con cuerpo continuo (14 esferas solapadas con perfil),
   barriga, cola gruesa, hocico y ojos. Canòpia: jardinera cuadrada con matas y trepadora por el pilar en vez de la bola verde.
4. **Patios**: tapias más oscuras y menos (desde el dron eran rayas claras). **Vidrio de oficinas** de día: el muro cortina
   (facades.js, color propio `CW_GL`) y el lejano (FS_BLD) se tiñen de gris azulado con cielo; la noche no cambia.
