# AE2 · Aeropuerto: lado tierra, noche y repaso

## Hecho
- **Datos** `data/aero_lado_tierra.json` (13 KB): 8 aparcamientos en superficie (polígono y eje), sacados del mapa del suelo
  (overlay de AE1, gris de aparcamiento más filas de plazas); planta del P1 de la T1 (envolvente convexa del bloque marrón
  delante de la T1, recortada a 45 m de la fachada de llegadas); estación Aeroport T2 y accesos de metro L9 (Nominatim).
  Script de regeneración: scratchpad `n3/ae2/prep/lots.py` (+ recorte del P1 en línea, ver commit).
- **Hitos nuevos** (aeropuerto.js, envoltorio de `BCN_LANDMARKS.init` espera también a este JSON):
  - `aero_parking_0..7`: coches en filas dobles cara a cara con pasillos de 7 m (20 triángulos por coche, 12 colores,
    ocupación 25–42 %, alguna fila casi vacía), isletas de las farolas. `sombra: false`. Huella mínima (no quitan árboles).
  - `aero_p1`: aparcamiento de 4 plantas abiertas (forjados, antepechos, pilares de fachada e interiores, lamas, núcleos de
    escalera de vidrio, rampa helicoidal), coches en la cubierta y en la primera crujía de cada planta. Sustituye los
    volúmenes simples que se veían como bloques de viviendas delante de la T1.
  - `aero_estacio`: estación T2 (R2 Nord + L9 Sud): andenes con marquesina, caja de vías, vestíbulo de vidrio, acceso al
    metro (solo edificio) y pasarela cubierta hacia la terminal.
  - `aero_focos`: torres de focos de plataforma (30 m, corona con 4 proyectores; cada ~150 m en el borde de cada
    plataforma, a más de 150 m de las pistas) y báculos de aparcamiento (13 m).
- **Bordillo de la T1 arreglado**: el código de AE1 buscaba la fachada por aristas con la normal al revés y no ponía
  ningún bordillo útil; ahora va en la recta real de la fachada de llegadas (rumbo 156°, ~264 m): acera de llegadas,
  carril, isleta, viaducto de salidas con su acera, mampara, marquesina y pilares. Verificado a pie (vista t1_bordillo).
- **Luces de noche** (módulo BCN_AERO, dos mallas, dos llamadas): ~8 000 puntos de luz que miran a la cámara (radio en m,
  mínimo 1,3 px; pierden intensidad al crecer) y 340 charcos de luz:
  bordes de pista blancos cada 60 m (amarillos los últimos 600 m), eje cada 15 m (rojo/blanco a 900–300 m, rojo los
  últimos 300 m), umbral verde con barras de ala y fin rojo, toma de contacto en la 07L/25R, PAPI (2 rojas + 2 blancas
  a 380 m), aproximación tipo Calvert de 900 m (420 m en 07R y 20) con barras cada 150 m y destellos secuenciados
  (`uTime`), rodaje con eje verde y bordes azules cada 30 m (fuera de pistas y plataformas), proyectores de plataforma y
  de aparcamiento con charcos (en HDR multiplican el suelo, como las farolas), luminarias del bordillo y del viaducto
  de la T1, balizas rojas de las torres. Todo se apaga de día (`uDusk`).
## Coste
- Hitos: 155 991 → 341 342 triángulos (+185 k: coches ~150 k sin sombra, P1 ~20 k, focos ~8 k, estación ~1 k).
- Luces: 16,7 k triángulos en una malla de mezcla + charcos 0,7 k. Nada por fotograma (dos uniformes al enlazar).
- Carga: igual (las capturas varían entre 47 y 67 s por la carga de la máquina).
## Flojo / pendiente
- Las calles de rodaje y viales de servicio se siguen iluminando de naranja como calles (resplandor de farola de la
  calzada, `uGlow.x`, en app.js/streets.js): no es mío. Petición a integración/SUELOS.
- Coches: 150 k triángulos es mucho; si cuesta, bajar la ocupación (`LOTOCC`) o hacer un nivel lejano.
- Viales de acceso y rotondas: son los del viario del juego; no se han tocado.
- La planta del P1 es una envolvente aproximada; la estación T2 se orienta a 66° a ojo.
## Para DESARROLLO.md
- `data/aero_lado_tierra.json`; `masts()` en aeropuerto.js (torres de focos, compartidas por hitos y luces).
- Material `aero_luces` (mezcla, puntos de luz con radio mínimo en píxeles, uniformes `uEye`, `uPx`) y
  `aero_charcos` (charcos que multiplican en HDR). `BCN.mods.aero.stats()` → luces, charcos, trisLuces, focos.
