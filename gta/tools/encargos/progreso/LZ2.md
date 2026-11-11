# Progreso LZ2 (sombras del sol) — TERMINADA

## Hecho
- Dos cascadas (±45 m y ±400 m, ×altura/50 en escalones del 25 %) en `lighting.js`; recepción `sunVisN()` en el preludio
  de `app.js` (sesgo por normal según la pendiente, PCF bilineal 2×2 en Media y 3×3 en Alta, mezcla entre cascadas).
- Cada cascada guarda sus ejes de luz (`uShX0/uShY0`, `uShX1/uShY1`; Z = X × Y): al cambiar la hora se repintan de una en
  una sin desajuste (antes, las dos en el mismo fotograma).
- Sin luz direccional (relevo sol → luna, ~21:15) no se pinta nada (`SH.dark`, `uShP.z = 0`).
- Modo captura: cada cascada espera al `flush` del arnés; una pintura por vista (antes, dos).
- Recorte: cercana sin los árboles lejanos y con el detalle a < `P.shNear`×semilado (63 m); lejana sin los árboles
  cercanos. eix_acera 17:00: 1,99 M → 1,38 M (cercana) y 1,14 M → 0,93 M (lejana) triángulos.
- Sonda (`<scratchpad>/lz2/probe.js`): quieta 0 repintados; medio metro 0; 40 m caminando 6–7, nunca dos por fotograma;
  reloj en marcha `110110110`.
- Verificado a 640x360 sin errores ni avisos de consola: 9:30, 13:00, 17:00 a pie (acera, calzada, fachada, Rambla,
  Gòtic, Passeig de Gràcia), dron y aéreo a las 17:00, desplazamiento de 0,35 m, 20:45/21:15/21:45/23:00 y dron a las 23,
  calidades media/baja/auto, camino LDR (17:00, 21:15, 23:00).
- DESARROLLO.md §7.7 (y tabla de §7.3, §7.1).

## Pendiente / flojo
- Árboles a 43–55 m: solo en el juego cercano de instancias, la lejana no los lleva (`P.shTreeNF = 1` los añade).
- Lo que más cuesta de la cercana son las fachadas de detalle (0,94 M): las celdas son de 100 m y el tope `shNear` las
  toma enteras. Afinar exigiría partir las mallas de fachada (carril INTERIORES).
- No se ha medido en un equipo real (solo SwiftShader cargado: ~50–70 s por vista).

## Trampas
- Los uniformes de ShaderMaterial son referencias (`setVector3` guarda el objeto): basta con darlos una vez y mutarlos.
- `L.sunL` es un Color3 (r, g, b), no un vector.
- En el arnés `SH.all` (= SHOT) pinta todo tras el flush; para medir como el juego, `BCN.light.shadow.all = false`.
- No lances el arnés con `&` en una llamada de Bash corriente: se queda vivo y otra ejecución pisa su registro.

## Cómo se prueba
`node tools/shot.js tools/out/lz2/x @tools/views_luz.json` (vistas `s_*`), `Q='?ldr=1'` para el camino LDR.
