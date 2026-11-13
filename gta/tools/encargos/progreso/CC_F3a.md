# CC_F3a · Fase 3a (precálculo por edificio y carga) — progreso

Estado: en curso. Rama `wt-cc-f3` (worktree `/home/user/wt/cc-f3`). Capturas y registros en
`/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/f3a/` (gen*.log: salidas del generador;
fps_antes.log / fps_despues.log; a*_*.jpg capturas).

## Hecho
- [x] `gta/tools/cc/generador.js` → `gta/data/condal_edif.json` (reglas 0, 1, 2, 3, 4, 5 y 7; ver cabecera y DESARROLLO §17).
- [x] `gta/edif.js` → `window.BCN_EDIF` (carga, firma, accesores, `parcela(b, k)`, `lejosCode`); index.html lo carga tras kit.js.
- [x] app.js: `BCN_EDIF.listo` antes de leer los edificios (`BREC.edif`), código lejano en `uv.w`; FS_BLD con estilo.
- [x] kit.js (mínimo): `elige` toma estilo, variante y color precalculados. facades.js: `varOf` sin reajuste con el fichero,
      ático y `V.remonte` del fichero, desgaste del fichero, `setFlag` conserva los bits altos, expone `layoutB` y `esChaflan`.
- [x] condal.js: F8 con estilo y variante asignados y la línea «Generador».
- [ ] Capturas (3 barrios, a pie y desde el aire, de lejos y de cerca), medidas antes/después, commit.
