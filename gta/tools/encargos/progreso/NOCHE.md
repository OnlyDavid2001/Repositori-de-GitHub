# NOCHE — noche fiel a las fotos reales de Barcelona (carril LUZ, rama `integra`)

Encargo: que la noche vista desde arriba o desde Collserola se parezca a las fotos del usuario (Bunkers del Carmel y avión
sobre el Eixample): cielo azul marino sin franja naranja, masas negras con ventanas, calles en cadenas de puntos de sodio y
avenidas de LED, aura = bloom + bruma baja leve. La fase B no se toca. Documentación: DESARROLLO.md §7.6 («Noche fiel…»).

## Hecho (todo en `app.js`)
- Cielo de noche calibrado a través del pie del ACES (por debajo de ~0,0035 lineal expuesto sale negro puro): horizonte
  `fg` (0,069, 0,122, 0,193), cenit `zn` (0,050, 0,099, 0,165). Medido en la franja alta: sRGB ≈ (1, 14, 28) frente a (0, 15, 31)
  de la foto. Sin banda anaranjada ni niebla parda; nubes de noche del color del cielo; estrellas a la mitad.
- Bruma baja de la ciudad (`kHaze`, `cityW`, `hazeI` en el preludio) sumada en `fogL` y en `FS_SKY`.
- Calles (`FS_ROAD`): charco gaussiano que conserva energía + cabeza de farola de ~1 px; sodio `kAura` y LED `kLed` en
  avenidas; carreteras de Collserola casi apagadas.
- Ventanas de lejos (`FS_BLD`): chispas de 1–2 px, ½·homeFrac de media, irregulares por celda de 113 m, barrio y edificio;
  55/30/15 % cálidas/blancas/azuladas. `homeFrac` 30 % → 27 % a las 23:00 → 5 % de madrugada.
- Masas oscuras: `FS_BLD` ×(1 − 0,6·uNight) en la luz recibida, cubiertas ×(1 − 0,55·uNight) de albedo, `FS_TER`/`FS_OUT`
  ×(1 − 0,55·uNight). El ambiente global NO se toca (la calle a pie queda como antes: medido).
- Vistas `tools/views_noche.json` (`n_*`).

## Trampas descubiertas
- El pie del ACES de Babylon (`RRTAndODTFit`, −0,000090537): colores de noche oscuros salen negro puro; calibrar con el modelo.
- Bajar el ambiente global de noche (`nAmb`) hunde la calle a pie: los charcos de `furniture.js` multiplican lo pintado.
- La vista de la Rovira cambia `BCN.cam.fov` (0,40, como la foto): todas las demás vistas del fichero lo reponen a 0,86.

## Pendiente
- Baño de sodio en las fachadas de detalle (`facades.js`) junto a cada farola (en la foto, 6–10 m de fachada amarilla).
- Copas de árboles de calle desde el dron (verde oliva, algo fuertes; `streets.js`); reflejos de las luces en el mar;
  monumentos iluminados (Torre Glòries, Sagrada Família, grúa); bares y farmacia de guardia.

## Cómo se prueba
`SIZE=640x360 FMT=jpg node tools/shot.js tools/out/nf/x @tools/views_noche.json` (12 vistas, ~10–15 min con la máquina
compartida). Hoja ANTES/DESPUÉS/REFERENCIA: `<scratchpad>/noche_fiel/hoja.jpg` (y `hoja_horas.jpg`), con `hoja.py`.

## Verificado (640x360, sin errores ni avisos de consola)
- 23:00: cielo en la franja alta (1, 14, 28) frente a (0, 15, 31) de la foto; a pie `eix_acera` y `rambla_pie` con la misma
  media que antes (52, 44, 40). 21:15: cielo de hora azul como antes, ventanas y calles encendidas sobre masas aún visibles.
  3:00: masas negras, muy pocas ventanas. 12:00: idéntica píxel a píxel al código anterior (`aer`, `eix_acera`: media 0, máx. 0).
