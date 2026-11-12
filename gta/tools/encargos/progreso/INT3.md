# INT3 · Integración del día 3

Worktree `/home/user/wt/n3-int`, rama `wt-n3-int`. Capturas en `scratchpad/n3/int3/` (A_* = rama principal, D_* = integrada).

## Estado: TERMINADA (14:50)
- [x] Fusiones por orden: edif, arb, transp (conflicto index.html), puerto, aero (conflictos index.html y app.js), suelos
      (12:52 en curso y 13:10 con S3 terminada; s3.done), plazas (12:52 en curso y 14:10 con P3 terminada; p3.done a ~14:08)
- [x] Nota 1 orden de scripts; nota 2 conflictos (ver commits de fusión); nota 3 FS_WALK sin la rama del alcorque (0f0ac05)
- [x] Nota 4: mz_partidas.json recalculado (8918320) y relanzado tras la fusión final: mismas 593 manzanas, sin cambios.
      En el arnés `BCN_MZINFO.cache = true`, `ms.total` 0,1–0,3 s en todas las vistas (no recalcula al cargar)
- [x] Nota 5 (cota allanada, a pie): puerto bien; aeropuerto bien (vista pie_lejos); Plaça de Catalunya: la plataforma de
      plazas.js (hasta 0,45 m) tapaba el hueco de las bocas de metro (solo asomaban las barandillas). Arreglo de fusión:
      `BCN_PLAZAS.pavAt(x, z)` en plazas.js y transporte.js descarta emplazamientos de boca sobre la plataforma (0a90b29)
- [x] Nota 6 (carga, pares A/D lanzados seguidos en la misma máquina cargada, vista metro_d): principal 12,7 s y 8,2 s;
      integrada 24,7 s y 16,4 s: **≈ +95 %**, muy por encima del 15 %. Reparto del par limpio (8,2 → 16,4 s): descarga
      de recursos +1,1 s (más datos: puerto, aeropuerto, plazas), relieve +1,6 s (allanado S2/S3), calles +1,1 s,
      edificios +2,1 s (hitos de puerto y aeropuerto; las manzanas salen de la caché en ~0,1 s), plantar módulos +1,6 s
      (plazas, transporte, aeropuerto) y último tramo hasta «¡Listo!» +1,6 s. Ver FIX3 nota 7 (allanado) y el presupuesto de hitos
- [x] Pruebas: node --check limpio; 18 vistas 10:30/23:00 sin errores ni avisos de consola; hoja
      `scratchpad/n3/int3/hoja_antes_despues.jpg` (A = rama principal, D = integrada; metro_d con el arreglo de bocas)
- [x] DESARROLLO.md §12 (generado de las secciones «Para DESARROLLO.md», con ids de material y orden de scripts)

## Coste (triángulos activos, A → D)
cat_pie 2,91 M → 2,73 M · cat_dron 1,94 M → 1,89 M · eix_tienda 3,58 M → 2,93 M · metro 2,47 M → 2,35 M · puerto 0,85 M →
0,85 M · aero (aire) 2,27 M → 2,67 M · m_dron 2,33 M → 2,06 M · ciudad 1,67 M → 1,71 M. `BCN.lm.stats().tris` 112 k → 698 k
(tope §10.9: 400 k; FIX3 nota 4).

## Flojo / para FIX3 y REV3
- Carga casi el doble que la rama principal (ver arriba): sin arreglar en INT3.
- Plaça de Catalunya de noche: el granito sale muy anaranjado y claro a pie (cat_pie_n).
- Bordes de césped y pavimento en escalera en Catalunya (vista metro_d integrada).
- Aeropuerto de noche: los rodajes siguen con resplandor naranja junto a las balizas azules (FIX3 nota 3).
- La vista aero_boca_d (3790, 3140) no sirve (cámara en un sitio sin nada legible); el bloque blanco `lm_aero_edificis`
  se ve claro en aero_pie (REV3 nota 5).
