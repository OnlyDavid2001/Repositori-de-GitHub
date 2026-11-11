# Progreso LZ1 — HDR lineal y postproceso (carril LUZ)

## Hecho
- Preludio lineal/HDR en `app.js`: `toLin`/`toScr`, `sunVis()` (hoy 1.0), `ambL()`, `lit`/`shade` en lineal, `fogL`, `FRAG`
  escribe radiancia lineal + distancia en A. Cielo con disco solar HDR, brillo del sol en el mar HDR, muelles por `lit`.
- Lienzo opaco (`alpha: false`), detección del camino HDR (`ctx.out.hdr`), `#define LDR` y `ctx.setLDR()` en caliente.
- `lighting.js`: `DefaultRenderingPipeline` (HDR, MSAA 4, bloom de umbral alto, ACES, viñeta, nitidez, tramado),
  tabla de calidades, modo Auto, `setQuality`, `set`, `stats`, `pipe`.
- Fila «Gráficos» en el panel (`index.html` + `app.js`).
- Calibración a las 17:00 (exposición 1,6 · contraste 1,08 · sol 2,3 · cielo 1,6 · suelo 1,5 · viñeta 0,3).
- Probados sin errores de consola: calidades alta/media/baja/auto, `?ldr=1` y `?nolight=1`.

## Pendiente
- (nada de LZ1). LZ2: cuerpo de `sunVis()`. LZ3: oclusión con la distancia del alfa, atardecer.

## Trampas
- El arnés tarda ~130 s en la primera vista (SwiftShader compila los shaders), luego 5–10 s por vista.
- La viñeta de Babylon con peso 1 oscurece las esquinas al 28 % (lineal): se usa 0,3.
- El ACES de Babylon no lleva la ganancia 1/0,6: hace falta exposición ≈ 1,6–1,9 para que el gris medio quede como antes.
- `setQuality` cambia el tamaño del búfer (y de la captura con `toDataURL`): en el arnés, las vistas siguientes salen
  a esa escala hasta volver a `alta`/`auto`.

## Cómo se prueba
`SIZE=640x360 FMT=jpg node tools/shot.js tools/out/lz/v @tools/views_luz.json` (6 vistas a las 17:00 + `eix_acera` a las
13:00 y a las 20,25). Camino LDR: `Q='?ldr=1'`; respaldo sin módulo: `Q='?nolight=1'`. Ajuste en caliente en un `eval`:
`BCN.light.set({exposure:1.6, contrast:1.08, sun:2.3, sky:1.6, gnd:1.5, bloomT:2.6, bloomW:0.16, vignette:0.3})`.
