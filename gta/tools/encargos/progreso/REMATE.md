# REMATE — dos remates de la noche que dejó pendientes NOCHE (rama `wt-remate`)

Solo `facades.js` y `streets.js`. Nada de día cambia: a las 12:00 la imagen es idéntica píxel a píxel (`n_eixacera_12`,
`n_aer_12`: diferencia máx. 0).

## Hecho
1. **Baño de sodio en las fachadas de detalle** (`facades.js`, `FS_DET`, capas BASE y ORNAMENTO).
   - **Rejilla de farolas** `ctx.detail.lamps` (= `LG`): textura RGBA float 128 × 128, celdas de 12 m, toroidal (ventana de
     1536 m, de sobra para las celdas de calle, RD 270 m). Texel = (x − cx·12, z − cz·12, cota del pie, clave cx + cz·4096);
     la clave evita los alias de la ventana. Una farola por celda; si choca, a una vecina libre. API: `LG.set(celda, [[x, yPie, z], …])`,
     `LG.drop(celda)`; la textura se sube en `onBeforeRender` solo si cambió. `LG.glsl` declara `tLamp` y
     `lampBath(p, n, k)`: suma de las farolas de las 3 × 3 celdas vecinas, gaussiana horizontal (k = 1/2σ²), se apaga hacia
     arriba de 1,5 a 9 m sobre el pie y pesa 0,25 + 0,75·(n·L) hacia la cabeza (pie + 8,6 m).
   - **streets.js la llena** a partir de los charcos de luz que ya deja `furniture.js` en `cc.pools` (`poolLamps`: el punto
     uv (0, 0) de cada quad es el pie de la luminaria; se juntan los quads de una misma farola y se queda la cota de la acera).
     Se vacía al soltar la celda (`drop`). No se toca `furniture.js`.
   - En el shader, al final (después de `shade`): `c += emit(kAura·min(alb, 0,55), lampBath(vPos, n, 1/92)·smoothstep(0,05, 0,3, uDusk)·2,8)` (σ ≈ 6,8 m).
     Los vidrios (pisos y escaparates) salen antes del final: no se tocan. Solo de noche (`uDusk > 0`).
2. **Copas de los árboles de calle desde arriba** (`streets.js`, `FS_TREE`, hoja e impostor). Con la cámara por encima de la
   hoja (`ab = smoothstep(0, 0,12, V.y)`): la luz recibida ×(1 − 0,6·uNight·ab) (masa oscura, como cubiertas y terreno) y el aura
   de farola `treeGlow` × mix(1, 0,06 + 0,5·[normal hacia abajo], ab); más un borde cálido sobre cada farola con la rejilla
   (`lampBath` a la altura de la cabeza, σ 3,5 m, ganancia 0,6). Desde abajo (a pie) `ab = 0`: igual que antes.

## Verificado (640x360, sin errores ni avisos de consola)
Hoja ANTES/DESPUÉS: `<scratchpad>/remate_noche/hoja.jpg` (`hoja.py`; antes = HEAD previo copiado en `antes_src`).
- `n_eixacera_23`, `n_ramblapie_23`: bajos y primer piso bañados de sodio junto a las farolas; escaparates igual.
- `n_dron_23`, `n_rov_23`: las bandas verde oliva de las copas pasan a casi negras.
- `n_eixacera_12`, `n_aer_12`: diferencia 0.

## Flojo / pendiente
- El baño solo existe donde hay celdas de calle de detalle (< ~270 m): desde la Rovira o el dron las fachadas lejanas siguen
  con la luz de `FS_BLD` (`uGlow.y`, app.js). Es coherente (las farolas lejanas tampoco existen como malla).
- Altura de la cabeza fija (8,6 m); en la rejilla no va la altura real (7,8 / 9,5 m).
- En calles con farolas a 24 m alternas el baño queda bastante continuo en la acera de las farolas; se ve menos el «entre
  farola y farola» oscuro de la foto.
- Siguen pendientes de NOCHE: reflejos en el mar, monumentos iluminados, bares y farmacia de guardia.

## Para DESARROLLO.md (§7.6 y §9.4; lo pasa quien integre)
Sustituir en «Pendiente / flojo (NOCHE)» lo del baño de sodio y las copas por: «Baño de sodio en fachadas de detalle y copas
oscuras desde arriba: etapa REMATE (rejilla de farolas `ctx.detail.lamps`, `lampBath`)», con el resumen de arriba.

## Cómo se prueba
`SIZE=640x360 FMT=jpg node tools/shot.js <out> @<scratchpad>/remate_noche/vistas.json` (6 vistas de `views_noche.json`).
Calibración probada: ganancia 0,75 apenas se veía; 3,0 con σ 7,5 m bañaba hasta el 2.º piso; 2,4 con σ 6 m dejaba apagada la
fachada cercana de `eix_acera`; queda 2,8 con σ 6,8 m.
