# INT3 · Integración del día 3

Worktree `/home/user/wt/n3-int`, rama `wt-n3-int`. Capturas en `scratchpad/n3/int3/` (A_* = rama principal, D_* = integrada).

## Estado
- [x] Fusiones: wt-n3-edif, wt-n3-arb, wt-n3-transp (conflicto en index.html: manzanas.js + transporte.js), wt-n3-puerto,
      wt-n3-aero (conflictos en index.html y app.js: se conservan las dos partes)
- [x] wt-n3-suelos: fusionada dos veces (12:52 con S3 en curso, 13:10 con S3 terminada; s3.done existe)
- [~] wt-n3-plazas: fusionada a las 12:52 con P3 en curso (a340af9); a las 13:53 P3 sigue EN CURSO y origin trae 2
      commits más: se espera a p3.done (tandas de 9 min) y se vuelve a fusionar
- [x] Nota 1 (orden de scripts): comprobado en index.html
- [x] Nota 3 (FS_WALK sin la rama del alcorque): 0f0ac05
- [~] Nota 4 (mz_partidas.json): recalculado a las 12:54 (593 manzanas); se relanza tras la fusión final de plazas.
      `window.BCN_MZINFO` (= BREC.mz: cache, ms, blocks) para comprobarlo en el arnés
- [x] Nota 6 (carga): `window.BCN_LOADT` por fase; primeras medidas: rama principal 13–17 s, integrada 16–17 s
      (+~12 %); lo que más sube es «Levantando el relieve» (allanado de S2/S3): ~3,0 s → ~4,5 s
- [ ] Notas del revisor 1–6 (orden de scripts, FS_WALK, mz_partidas.json, cota allanada, tiempo de carga)
- [ ] Pruebas en el arnés (10:30 y 23:00) y hoja ANTES/DESPUÉS
- [ ] DESARROLLO.md §12
