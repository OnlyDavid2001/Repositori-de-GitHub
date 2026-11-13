# CC_F1 · Fase 1 (datos y consulta espacial) — progreso

Estado: **terminada** (ver «Hecho»). Capturas y scripts de medida en
`/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/f1/` (test_at.js, medir.js, vistas_f8.json, f8_*.jpg).

## Hecho
- [x] `gta/tools/cc/empaquetar.py` (Python, determinista: dos ejecuciones dan el mismo md5) → `gta/data/condal.json`.
- [x] `gta/condal.js` → `window.BCN_CONDAL` (index.html lo carga justo después de geo.js; app.js espera `ready` antes de leer
      los edificios, donde se publica BCN_BARRI).
- [x] Depuración **F8** (ayuda abajo a la derecha; `?condal=1` la abre al cargar). `tools/shot.js` admite `PAGE=1` para capturar
      la página con sus capas HTML.
- [x] Verificación: 3 puntos del usuario y 10 barrios, concordancia, tiempos, carga, capturas.

## Datos (`data/condal.json`, 339.608 B sin comprimir; 146.755 B con gzip -9, que el artefacto no sirve)
- 22 estilos (orden del catálogo: gotico … vivienda_social_actual): id, nombre corto en catalán, plantas, ancho de fachada,
  paleta, desgaste_base. 24 escaparates y 59 negocios (nombre → índice de escaparate). 11 claves de detalles_prob.
- 73 barrios: fachadas ×10, plantas ×10, detalles ×1000, negocios [id, cuota ×100] con «Local vacío» como un negocio más
  (vacios_pct no se usa), índice de META.barris (por map_codigo_meta.json, nombres normalizados), distrito e índice de
  META.districtes («L'Eixample» → «Eixample»). Barrios con < 60 locales: cuota = w·barrio + (1−w)·distrito, w = locales/60
  (la Clota, Can Peguera, Vallbona, Torre Baró, Baró de Viver…).
- Secciones: 1.068 + 250 pares (sección, barrio) extra. Las secciones no encajan del todo en los barrios (hasta un 10 % fuera
  del suyo); cada celda guarda el par con el barrio de verdad (por contorno de barrio). Mezcla precalculada en ‰:
  ws·sección + (1−ws)·barrio con ws = 0,7·min(1, edificios/30).
- Rejillas (base64 de zlib, Uint16; se inflan con DecompressionStream('deflate')):
  - secciones a **12,5 m** (1792 × 1984; 7,1 MB en memoria). A 25 m el barrio de la rejilla casaba con el del contorno en el
    99,863 % de los edificios; a 12,5 m, en el **99,960 %** (157.521 de 157.584). Elegí 12,5 m.
  - comercio a 150 m (150 × 166), locales activos ×10 por celda de 2,25 ha. Remuestreo conservativo (5 × 5 submuestras por
    celda) de la malla lon/lat (paso 0,001796° × 0,001357°, 22.577 m²/celda): suma 57.353 → 57.450. 2.947 de las 4.517 celdas
    de Barcelona tienen locales; las demás quedan a 0.
  - periferia a 100 m: índice de perfil sintético.
- **Periferia (fuera de Barcelona)**: perfil = w·barrio de Barcelona más cercano + (1−w)·perfil genérico, con w = 0,55 / 0,45 /
  0,32 / 0,2 según la distancia al barrio (< 600 m, < 1,5 km, < 3 km, más). Genérico: desarrollisme 36, poble 12, autarquia 11,
  contemporani 10, olímpic 8, polígon 7, casa obrera 4, burgès 4, habitatge social 3, autoconstrucció 3, fàbrica 2.
  **Industrial** donde en la ventana de 300 m la huella de las clases OSM 1 y 5 (industria y almacenes) es ≥ 45 % de la huella
  y ≥ 6.000 m²: fàbrica 50, contemporani 16, desarrollisme 14, autarquia 8, poble 6, polígon 6. Negocios: w·barrio +
  (1−w)·media de Barcelona (y, en industrial, mitad y mitad con talleres, almacenes, concesionarios…). 162 perfiles; 1.203
  celdas industriales. Densidad comercial **estimada**: superficie construida de vivienda (clase 0, planta × altura/3,1 m) por
  celda de 150 m, calibrada en las celdas de Barcelona (media de locales por decil de superficie) × 0,8.

## Medidas
- `at()`: 90–150 ns por llamada en node, 150–190 ns en Chromium (1 M llamadas); el punto en polígono de BCN_BARRI.at, ~700 ns.
- Carga: condal.json se descarga y descomprime en paralelo con el relieve (descarga 40–50 ms, descompresión 30–100 ms); la
  espera en app.js antes de los edificios es **0 ms** (BCN_LOADT: «Datos de barrios y secciones…» y «Descargando edificios…» en
  el mismo milisegundo). Carga total en el arnés: ~17 s, como antes.
- Por fotograma: nada. Sin geometría nueva (la ventana F8 es HTML y se refresca 4 veces por segundo solo si está abierta).
  Medido con fps_eval.js (calidad media, 960x540): Eixample a pie 5.229.928 triángulos / 866 llamadas (28,3 s/fotograma),
  Gòtic a pie 6.401.634 / 649 (37,3 s), aérea 1.315.294 / 304 (4,1 s): las mismas cifras que en la Fase 0 (5,2 M / 866,
  6,4 M / 649, 1,3 M / 304); los segundos de SwiftShader varían de una ejecución a otra.
- Capturas con F8 abierta (PAGE=1, 960x540): f8_f8_eixample.jpg y f8_f8_gotic.jpg (10:30), f8b_f8_hospitalet.jpg (23:00,
  periferia): cero errores y avisos de consola.
- Edificios del juego: 163.815 de 164.048 con barrio caen en el mismo barrio que el punto en polígono del juego (99,86 %; las
  diferencias son de bordes y del desfase de ~2 m entre los contornos del JSON y META); 136.197 en periferia, 3.530 en
  periferia industrial, 20 sin datos (fuera del mundo).

## Para DESARROLLO.md
- `condal.js` (Condal City, Fase 1): `window.BCN_CONDAL` — `ready` (promesa), `loaded`, `at(x, z, out?)` →
  `{zona 'bcn'|'periferia'|'industrial'|null, seccion, seccionIdx, barrio, barrioIdx (META), barrioRef, distrito, mezcla
  (Float32Array 22, suma 1), detalles {clave: 0–1}, negocios [{id, n, e, q}], locales, densidad (locales/ha)}`; `mezcla`,
  `detalles` y `negocios` son compartidos (no modificar). `estilos[22]`, `escaparates[24]`, `negocios[59]`, `detalles[11]`,
  `barrios[73]`, `secciones`, `perif`, `top(mezcla, k)`, `toLonLat(x, z)`, `fromLonLat(lon, lat)` (UTM 31N, Krüger orden 6;
  la misma fórmula que `tools/cc/geo_utm.js`: x = E − 418400,7; z = N − 4567997,6).
- Datos: `data/condal.json`, generado por `tools/cc/empaquetar.py [condal_city_datos.json]` (necesita pyproj, shapely 2 y
  numpy; lee también data/meta.json, terrain.png y buildings*.png). Si cambian los edificios o el JSON, relanzarlo.
- Carga: index.html carga condal.js tras geo.js; la descarga empieza al cargar el script; app.js hace `await BCN_CONDAL.ready`
  justo después de publicar BCN_BARRI (antes de los edificios) y, al terminar, `BCN_CONDAL.initDebug(CTX)`.
- Depuración: **F8** abre/cierra la ventana Condal City (arriba a la izquierda): barrio y distrito (o periferia y barrio de
  referencia), sección y edificios, 3 estilos más probables, comercio (locales/ha y locales de la celda), 4 negocios
  principales y el edificio de delante (rayo desde la cámara por pasos de 1,5 m contra las plantas de `ctx.city`; si toca el
  suelo, el edificio más cercano a ≤ 12 m): índice, alto, clase, tipo, estilo de hoy (familia y variante de
  `ctx.mods.fx.famOf/varOf`) y estilo nuevo (lee `BREC.estilo` y `BREC.varEst` cuando la Fase 3 los cree).
  `?condal=1` la abre al cargar; `BCN_CONDAL.debug.show(true)` desde el arnés. `tools/shot.js` con `PAGE=1` captura la
  página entera (capas HTML incluidas).

## Lo flojo
- Periferia: «barrio más cercano» no siempre es el mejor análogo (Collblanc toma la Maternitat i Sant Ramon, con mucho
  burgès 60-70; Badalona centro toma el Bon Pastor). El peso del genérico lo suaviza pero no lo arregla; la Fase 3 puede
  corregir con la altura real y la clase OSM.
- La densidad comercial de la periferia es una estimación, no un dato.
- La rejilla de 12,5 m ocupa 7,1 MB en memoria (Uint16); se podría bajar a 3,5 MB con Uint16 a 25 m perdiendo 0,1 puntos de
  concordancia de barrio.
