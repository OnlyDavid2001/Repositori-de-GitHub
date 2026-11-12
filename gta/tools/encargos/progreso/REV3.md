# REV3 · Revisión del Día 3 (defectos visibles y hoja final)

Estado: HECHO (con lo flojo abajo). Capturas en `scratchpad/n3/rev3/` (arnés `run.sh <dir gta> <prefijo> <views.json>`, una carga por tanda;
`base/gta` = estado antes de REV3, es decir, 7d9d241 + fusión de P4).

## Hecho
0. **P4 fusionada** (`git merge origin/wt-n3-plazas`, p4.done existía). Solo cambia plazas.js; `tools/mz_partidas.js`
   relanzado: el JSON sale idéntico salvo los tiempos de cálculo (no se confirma).
1. **Mar de noche** (app.js, FS_SEA `seaLights`): busca a lo largo de la recta cámara→punto de agua la primera franja de calle
   de la orilla (máscara de calles `uStreet`, pasos geométricos de 15 m a 2,6 km y bisección) y allí las farolas (una por
   celda de 22 m con azar): cada una deja una estela fina de lado y larga hacia la cámara, torcida por la pendiente del
   oleaje y troceada en guiones que se mueven; cálida en el paseo y blanca en el puerto (al suroeste de la Barceloneta);
   más un brillo suave del agua frente a la ciudad. Solo de noche (`uGlow.x`) y se apaga desde 250–900 m de altura.
   La primera versión (13 pasos a lo largo de la recta) no daba nada; la segunda quemaba el agua; la final (D4_mar_*) es
   discreta: estelas visibles desde la barca y apenas desde mar_23 (orilla a 2–3 km).
5. **Aeropuerto**: el bloque blanco era una «caseta técnica» de 10 m (3783, 2766): las casetas de 8 m o más pasan a oficinas
   con cuerpo de hormigón gris arena y bandas corridas de vidrio oscuro por planta (antes, bloque blanco liso en `pie_lejos`);
   cara inferior del viaducto de salidas con paños emisivos suaves solo de noche.
   `window.BCN_AEROED` (pruebas) lista los volúmenes de esa ficha.
9. **Árboles de calle en las plazas** (streets.js `treesOf`): ni árboles ni alcorques sobre `BCN_PLAZAS.pavAt(x, z)`.
3. **Plazas**: granito (dibujos 1 y 9) con grano, losas de tono distinto y manchas a pie; de noche el charco de farola del
   pavimento baja (1,6 → 1,15) y es menos naranja. Fuente de Espanya: grupos con roca, figura sentada, figura de pie con el
   brazo en alto y ánfora con chorro (antes, dos bultos). Gat de Botero con cuerpo continuo (14 esferas solapadas con perfil),
   barriga, cola gruesa, hocico y ojos. Canòpia: jardinera cuadrada con matas y trepadora por el pilar en vez de la bola verde.
4. **Patios**: tapias más oscuras y menos (desde el dron eran rayas claras). **Vidrio de oficinas** de día: el muro cortina
   (facades.js, color propio `CW_GL`) y el lejano (FS_BLD) se tiñen de gris azulado con cielo; la noche no cambia.

## Medidas
- Árbol de calle más cercano al centro de Catalunya: 63–65 m → 72 m; a la Deessa: 32–34 m → 36–38 m (`findTree`).
- Hitos dibujables (`trisVis`) en Catalunya: 475–479 k → 471–475 k (las piezas nuevas son pocas: Botero +~3 k, Espanya +~1 k).
- Coste del mar: solo de noche, ~18 lecturas de textura por píxel de agua (12 pasos + 6 de bisección) + 4 por farola.
- Cero errores y avisos de consola en todas las tandas (A_*, D*_*, F).

## Hojas
- `scratchpad/n3/rev3/hoja_antes_despues.jpg` (mar, Catalunya, aeropuerto, vidrio, patio).
- `scratchpad/n3/rev/hoja_final.jpg` (16 vistas, día y noche).

## Flojo / pendiente
- Mar: las estelas salen como columnas grises algo anchas y cuadradas desde la barca y casi no se ven desde mar_23; falta
  reflejar también los focos que no son calle (castillo de Montjuïc, hitos) y la ciudad duplicada se intuye poco.
- Catalunya: en `cat_fuente` sigue un árbol en mitad de la explanada que NO es de streets.js (no lo he encontrado).
- Viaducto de la T1: los paños emisivos no se ven en t1_bordillo_noche; el techo que se ve allí debe ser otra pieza.
- No hechos: puerto (nota 6, aduanas y vistas a pie), suelos en calles reales (notas 2 y 7), Macià de frente, hitos por
  encima de 400 k (siguen ~475 k), asfalto del Passeig de Gràcia algo oscuro.
- Hoja final: las vistas «boca de metro» (mira al césped, sin boca), «calle con tiendas» (escaparate de cerca) y
  «aeropuerto» son flojas; hay que elegir mejores encuadres.

## Para DESARROLLO.md
- FS_SEA lee la máscara de calles (`uStreet`, `uStreetR`) para `seaLights`: estela por farola de la primera franja de calle.
- facades.js: el vidrio del muro cortina usa `CW_GL` (vCol.b > 0,4) y de día se tiñe de gris azulado.
- streets.js `treesOf` consulta `BCN_PLAZAS.pavAt`. aeropuerto.js publica `window.BCN_AEROED` (pruebas).
