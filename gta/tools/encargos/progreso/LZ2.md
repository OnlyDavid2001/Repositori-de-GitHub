# Progreso LZ2 (sombras del sol)

## Hecho
- Dos cascadas (±45 m y ±400 m, ×altura/50 en escalones del 25 %) en `lighting.js`, recepción `sunVisN()` en el preludio
  de `app.js` (sesgo por normal según la pendiente, PCF bilineal 2×2 en Media y 3×3 en Alta, mezcla entre cascadas).
- Cada cascada guarda sus propios ejes de luz (`uShX0/uShY0`, `uShX1/uShY1`; su Z = X × Y): al cambiar la hora se
  repintan de una en una sin desajuste (antes, las dos en el mismo fotograma).
- Sin luz direccional (relevo sol → luna) no se pinta nada (`SH.dark`, `uShP.z = 0`).
- En modo captura cada cascada espera al `flush` del arnés (hasta 2 fotogramas): se pinta una vez por vista, no dos.
- Cascada cercana: el detalle (capas base, orn y furn) solo a menos de `P.shNear` × semilado de la cámara (parche del
  agente anterior, aplicado).
- `BCN.light.shBreak()`: triángulos de cada cascada por capa.

## En curso / pendiente
- Medir coste (sonda `probe.js` en el scratchpad `lz2/`), verificación de horas, calidades, LDR, §7.

## Trampas
- Los uniformes de ShaderMaterial son referencias (`setVector3` guarda el objeto): basta con darlos una vez y mutarlos.
- En el arnés `SH.all` (= SHOT) pinta todas las cascadas a la vez; para medir el modo de juego, `BCN.light.shadow.all = false`.

## Cómo se prueba
`node tools/shot.js tools/out/lz2/x @tools/views_luz.json` (vistas `s_*`). Sonda de repintados: ver arriba.
