# AE1 · Aeropuerto, lado aire y terminales

## Hecho
- `aeropuerto.js` (nuevo) + `data/aero_lado_aire.json` (45 KB). `<script src="aeropuerto.js">` va **después de
  `landmarks_e.js`** (no antes de `lighting.js`): necesita `BCN_LM` al cargarse. `addMod('aero', 'BCN_AERO', …)` tras `nat`.
- Datos (se generaron con scripts de scratchpad, no confirmados: `prep/stands.py`, `prep/build_data.py`):
  - Pistas: extremos ajustados por PCA sobre la franja oscura de `ground.webp`: 07L/25R 3 339 m, 07R/25L 2 649 m, 02/20
    2 510 m (reales 3 352 / 2 660 / 2 528), rumbos 66,2° y 19,6°. Anchos 60/60/45 m.
  - Calles de rodaje: esqueleto del mapa (265 polilíneas, solo lado aire). Plataformas: 13 polígonos.
  - Plantas OSM vía Nominatim: T1 (abierta morfológicamente para quitar los muñones de las pasarelas), T2, «Torre de control
    Este», torre antigua, hangar (Iberia, sin nombre en el juego), terminal corporativa. 29 pasarelas de la T1.
- Hitos (BCN_LM): la ficha `aeroport` de landmarks_e.js conserva id y nombre pero **su constructor lo cambia
  aeropuerto.js** (rot 0, planta OSM, muro cortina, cubierta ondulada, bordillo de llegadas, viaducto y bordillo de
  salidas con marquesina, pasarelas). Nuevas: `aero_t2` (vidrio, lucernarios, pasarelas en los frentes SSE),
  `aero_torre` (torre de 2006, ~62 m), `aero_torre_antigua`, `aero_hangar`, `aero_bomberos` (posición aproximada),
  `aero_aviones` (≈80 aviones A320/A330 genéricos, librea blanca con franja azul/gris, sin logotipos, y vehículos de pista:
  cintas, carros, cátering, cisternas, tractores), `aero_campo` (sin malla: rectángulo girado 66° que despeja de árboles el
  campo de vuelo, nature.js ya respeta las huellas de los hitos).
  Los volúmenes simples bajo cada planta se sustituyen (se calculan en un envoltorio de `BCN_LANDMARKS.init`, que además
  espera al JSON).
- Marcas (shader `aero_marcas`, una malla, 0,45 m sobre el terreno, grupo 1): pistas con barra y piano de umbral,
  designador (atlas en DynamicTexture), eje 30/20 m, toma de contacto, punto de visada, bordes, márgenes y caucho;
  puntos de espera patrón A a 90 m del eje donde cada rodaje cruza; puestos con línea de entrada, barra de parada y límite
  rojo. Pintura más fina que el píxel: tramado.
- Coste: hitos +43 k triángulos (112 k → 156 k; aviones 40 k), marcas ≈ 40 k triángulos en una llamada; nada por fotograma.

## Pendiente / flojo
- Terminal de carga, parque de combustible, más hangares: sin posición fiable aún (AE2 o siguiente pasada).
- Bomberos situados a ojo junto a la torre.
- La T1 no distingue el edificio procesador (más alto) de los diques.
- Luces de pista y de plataforma: AE2.

## Para DESARROLLO.md
- Módulo `BCN_AERO` (`addMod('aero')`) y hitos `aero_*`; `window.BCN_AERO_STANDS()` da los puestos (morro, rumbo, tipo,
  pasarela). Envoltorio de `BCN_LANDMARKS.init` en aeropuerto.js (espera al JSON y rellena `edificios`).
