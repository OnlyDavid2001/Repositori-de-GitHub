# CC_F2c · Fase 2c (bloque 3 del kit) — progreso

Estado: **en curso**. Worktree `/home/user/wt/cc-f2c` (rama `wt-cc-f2c`). Capturas en
`/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/f2c/` (`mk.js` hace las vistas del escaparate;
`VS=01 PITCH=0.1 lote.sh <hora> <tamaño> <prefijo> estilo:x:z:hMin:hMax` las captura, de 2 en 2 vistas por ejecución).

## Hecho
- [x] `gta/piezas_b3.js`: tipos 184 CHAPA (chapa perforada) y 185 LISTON (listones de madera; acabado `listones`); los faldones
      usan el `K.TEJA` de rooftops.js (no se registra otra teja). Piezas generales: tejado, torreon, chimenea, aro, ojo_buey,
      grafiti, bici, deposito, banda_curva, frente_pilotis. Piezas de estilo: frente_torre, pb/vano/corona_torre;
      pb/vano/corona_racionalista, deco_lineas, reticula_hormigon; pb/vano/corona_vsa; pb/vano/corona_fabrica, fab_fachada;
      pb/vano/corona_poligono, pol_reticula.
- [x] `gta/estilos_b3.js`: torre, racionalista_deco, vivienda_social_actual, fabrica, poligono (4 variantes cada uno).
- [x] index.html: `piezas_b3.js` y `estilos_b3.js` tras `estilos_b1.js` (al fusionar con F2b, van después de las de b2).
- [ ] Verificación con el escaparate (día y noche), hoja del bloque, vistas en `tools/cc/vistas_estilos.json`, medidas.

## Vistas de prueba (coordenadas del juego)
torre 8922,16107 (Bonanova) · racionalista_deco 11007,15564 (Gràcia) · vivienda_social_actual 15912,17184 (Besòs) ·
fabrica 14604,15863 (Poblenou) · poligono 12179,20105 (la Guineueta).
