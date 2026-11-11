# FIX-b — arreglos de los lotes b y c (estado: HECHO)

Ficheros tocados: `gta/landmarks_b.js`, `gta/landmarks_c.js`. Comprobado con `tools/hitos/hoja.py` (480x300, día y 22 h,
rumbos 210 y 30) sin errores de consola, y `node tools/hitos/tris.js b c` (36 hitos de b+c; total de la escena ≈ 106 800 tris).

## Lote b
- **camp_nou** (noche): el campo pasa a emisivo solo de noche (de día queda del verde del césped, sin las franjas del
  sombreador de césped: hay franjas emisivas alternas), la corona de focos del canto interior de la cubierta y su
  intradós encendidos (blanco, ganancia alta). De noche se ve el anillo de luz y el campo verde claro. Sigue sin ser una
  «caja de luz» total: las gradas solo llevan el baño de `focos` del núcleo.
- **palau_nacional** (noche): cúpula central, cúpulas laterales y de las torres emisivas cálidas de noche (de día, gris
  piedra), cornisas y frontón con listones emisivos, hilera de focos al pie de la fachada y `alto` 52 → 80 para que el
  baño de `focos` del núcleo no se apague con la altura. De noche ya es de lo más luminoso de Montjuïc.
  NO hechos los haces de luz de detrás: una malla opaca se vería de día como postes grises.

## Lote c
- **hotel_w**: planta en vela con los dos extremos afilados y el frente norte convexo más hinchado; vidrio azul
  reflectante uniforme (cortina sin variación, montantes cada 25 m) y `noche: 'nada'` (fuera el damero de ventanas);
  coronación iluminada de noche (listón emisivo en la cima y el remate de proa).
- **torres_caixa**: rehechas como octógonos casi cuadrados (27 m, chaflán 3,5 m; planta de los datos solo para el centro),
  vidrio oscuro más claro que refleja el cielo, aletas verticales de aluminio cada 2,2 m y ático metálico; sin bandas
  horizontales. Referencia: Coderch y Mitjans, 85 m/26 pl. y 48 m/14 pl. (Wikipedia).
- **disseny_hub**: volumen de zinc gris (ya no negro) levantado a 14 m con ~28 m de voladizo hacia Glòries (NE), sofito
  claro con línea de luz, base medio enterrada con planta baja de vidrio y talud verde que sube a la cota 13 por el SO.
  `noche: 'nada'` (fuera el damero). Desde arriba el voladizo se lee poco.
- **edifici_forum**: azul más vivo, textura rugosa más fina y las «grietas» pasan a emisivas solo de noche (cortes de luz).

## Flojo / pendiente
- «Vidrios planos» en general: no tocados más allá de los anteriores.
- Camp Nou: si se quiere más «caja de luz», encender también las losas blancas de las terrazas de fachada.
