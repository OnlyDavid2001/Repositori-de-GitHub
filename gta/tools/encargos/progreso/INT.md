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

## En curso
- Hojas de contacto por lote (día, rumbo 210) y una de noche con los 27 de nivel A.
