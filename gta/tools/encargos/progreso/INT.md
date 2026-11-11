# INT · Hitos, integración — progreso

## Hecho
- Fusionadas en `wt-hitos` las ramas `wt-hitos-a` … `wt-hitos-e` (merge --no-ff, sin conflictos: cada lote solo toca
  `landmarks_<l>.js` y su `progreso/L<l>.md`).
- Comprobaciones sin navegador: `node --check` de todos los .js de `gta/` y `tools/hitos/` sin fallos; `tris.js`: 98 hitos
  con constructor (+7 de nivel C sin `build`), 88 404 triángulos con terreno llano, ninguno lanza ni deja vértices no
  finitos. No hay ids repetidos, ningún volumen de `BREC` lo reclaman dos hitos, y el único par de hitos a menos de 40 m es
  Batlló–Amatller (16,5 m, contiguos a propósito).
- Arnés, vistas generales (`aereo_alto`, `aereo_eixample`, `port_vell`, `eix_acera`, `rambla_pie` a las 16 h;
  `aereo_alto` y `port_vell` a las 22 h; `maxDist 40000` en las aéreas): sin errores ni avisos de consola.
  `BCN.lm.stats()` = `{ hitos: 98, fichas: 105, tris: 105 945, errores: [], ocultos: 732, retocados: 25 }`
  (en el juego hay más triángulos que en tris.js porque varios hitos extruyen las plantas reales de `h.edif`).
  Muy por debajo del objetivo de 400 000.

- Hojas de contacto (rumbo 210, k 2,4, elev 30; arnés sin errores de consola en las seis ejecuciones, ~17 min por lote),
  en el scratchpad de la sesión: `hitos/hoja_a.jpg` … `hoja_e.jpg` (16 h, los 105 hitos/fichas) y
  `hitos/hoja_noche_A.jpg` (22 h, los 27 de nivel A); vistas generales en `hitos/int_generales.jpg`.
- `tools/hitos/hoja.py`: con una sola vista por hito la hoja salía en UNA columna (ilegible); ahora usa 4 columnas.

## Para REV (lo que salta a la vista en las hojas, sin revisar a fondo)
- Encuadre: las fichas de nivel C sin `alto` o pequeñas salen con la cámara pegada (palau_blaugrana, picornell,
  piscina_montjuic, estel_ferit) o tapada por árboles (cap_barcelona). Es la vista, no el modelo.
- Arc de Triomf visto desde 210° parece una torre roja (se ve de canto); comprobar desde otro rumbo.
- Noche: torre de Collserola y Park Güell casi no se ven; Sant Pau, poco. Torres «la Caixa», Disseny Hub y Peix ya
  señalados por el lote c. Bellesguard: caja oscura.

## Pendiente (otras etapas)
- REV y FIX de `final.md`.
