# INT1 · Fusión de cuatro carriles y banco (fase gráfica 1)

Rama `wt-g1-int` (sale de `gta-barcelona-fachadas-detalle`, 8cb3633). Capturas en `scratchpad/g1/int/`
(`carga/`, `perf/`, `despues/`). G1F (fachadas) sigue trabajando: no se fusiona en esta etapa.

## 1 · Fusiones (orden de G1I.md, `--no-ff`)
- [x] wt-g1-banco → ee60feb (solo herramientas y el encargo)
- [x] wt-g1-suelo → f96db9c
- [x] wt-g1-tej → 42d9aae
- [x] wt-g1-veg → 8105daa
- [x] wt-g1-luz → 19496ac
Ninguna dio conflicto de texto: `streets.js` (G1S y G1V), `plazas.js` (G1S y G1V), `aeropuerto.js` (G1T y G1V) y `app.js`
(G1V: FS_TER; G1L: preludio, cielo, mar) se mezclaron solos, cada carril en trozos distintos. No hizo falta decidir dueño.
`node --check` de todos los .js tras cada fusión: limpio.

## 2 · Capturas de carga (una vista por fusión, 640×360, desde una instantánea del commit)
`scratchpad/g1/int/carga/` (`<carril>_<vista>.jpg`, `<carril>.log`, hoja `hoja_carga.jpg`). Las cuatro: carga ok y
**sin errores ni avisos de consola**.
| fusión | vista | carga | vista |
|---|---|---|---|
| suelo (f96db9c) | eix_xamfra | 28,9 s | 180 s |
| tej (42d9aae) | azoteas | 42,8 s | 259 s |
| veg (8105daa) | eix_calle | 42,3 s | ~ |
| luz (19496ac) | mar_atardecer | 38,2 s | ~ |
(La banca solo trae herramientas: sin captura propia; la primera, la de suelo, ya la incluye.)

## 3 · allanado.bin.gz
G1S lo regeneró (preClave v8) en su rama; ninguna otra fusión toca las calles, el relieve ni el cálculo. Comprobado en la
medida de rendimiento con `BCN_SUELOS.pre` (true = se usa el precalculado).

## 4 · Rendimiento
`scratchpad/g1/int/perf/` (`antes.log`: la principal 8cb3633, 640×360; `media.log`: INT1 en calidad media, 640×360) y las
capturas DESPUÉS (`despues/run24.log`, calidad alta, 960×540; los triángulos no dependen del tamaño). `act` =
`scene.getActiveIndices()/3` (triángulos activos de la pasada principal, sin sombras); árboles = `st.treeTris`
(cercano + medio + impostor).
| vista | act antes | act INT1 alta | act INT1 media | árboles antes | árboles alta | árboles media |
|---|---|---|---|---|---|---|
| eix_calle | 3,05 M | 3,70 M (+21 %) | 3,38 M (+11 %) | 144 k | 634 k (0/366/30 → 197/301/136 k) | 475 k |
| pg_pie | 2,88 M | 3,31 M (+15 %) | 3,16 M (+10 %) | 198 k | 599 k | 446 k |
| coll_camino | 5,07 M | 5,27 M (+4 %) | – | 17 k | 46 k (monte `nat` 305 k → 443 k) | – |
| eix_dron | 4,80 M | 5,04 M (+5 %) | – | 150 k | 377 k | – |
- Árboles de calle en eix_calle: 697 k tras G1V3 (medido en la captura de carga de veg) → **634 k** en alta con el nivel
  medio al 90 % (288–360 m; el medio baja de 366 k a 301 k) → **475 k** en media. Los niveles cercano y medio proyectan
  sombra: la cascada cercana lleva ~1,0–1,2 M triángulos y la lejana ~0,6 M en alta (0,97–1,2 M y 0,5 M en media).
- El tiempo de fotograma que da el arnés (`ms`, media de 4 `scene.render()`) **no sirve**: SwiftShader en una máquina con
  carga 12–15 y el render es asíncrono (12–80 ms sin relación con los triángulos). Lo que se mide de verdad son los
  triángulos. En un portátil normal, +21 % de triángulos en alta en la calle más arbolada; media, +10–11 %.
- `BCN_SUELOS.pre` = true en todas las vistas medidas: el `allanado.bin.gz` de G1S casa con las calles y el relieve
  fusionados (no hace falta regenerarlo).

## 5 · DESARROLLO.md
- [x] §14 Fase gráfica 1 (14.1 banco, 14.2 luz y mar, 14.3 suelo, 14.4 azoteas y huecos, 14.5 árboles y monte, 14.6 integración).

## Arreglos de integración
- `lighting.js`: `BCN.light.quality` no existía (el getter faltaba); `nature.js` (G1V3) lo leía y siempre obtenía
  `undefined`, así que el monte nunca se aclaraba en media ni en baja. Getter añadido.
- `streets.js`: niveles cercano y medio de los árboles de calle bajo la calidad ([cercano, medio]: alta [1; 0,9], media [0,8; 0,7], baja [0,6; 0,5]).

## 6 · Capturas DESPUÉS de las 24 vistas (960×540)
- Desde una instantánea de 295f54e (código de INT1; los cambios posteriores son solo de progreso), en 8 tandas de 3
  (`scratchpad/g1/int/despues/run24.py`, registro `run24.log`): **24/24, cero errores y cero avisos de consola**, ninguna
  tanda caída. De 4 a 18 min por vista con la máquina a carga 12–15.
- Prefijo `scratchpad/g1/int/despues/d` (`d_<vista>.jpg`). Hoja ANTES/DESPUÉS:
  `scratchpad/g1/int/hoja_comparativa.jpg` (`hoja_g1.py --comparar scratchpad/g1/banco/antes/a … /despues/d …`).
  Hojas parciales de revisión: `parcial.jpg`, `parcial2.jpg`, `parcial3.jpg`.

## Etapa INT1 terminada. Lo flojo (dicho claro, visto en la hoja)
- **sagrada_pie**: la bóveda de plátanos adultos (G1V3, alcorques llenos) tapa por completo la Sagrada Família, que era el
  motivo de la vista. Es coherente con una calle arbolada, pero el jurado lo puede leer como pérdida. Para los arreglos:
  recolocar la vista en el eje de la calle sin árboles o ver la copa más alta (G1V/G1B).
- **coll_camino**: sigue la cinta crema de la pista de clase 9 (app.js, cinta de calles) a la izquierda; petición de G1S y
  G1V sin dueño de fichero: le toca a los arreglos de integración.
- **glories_dron**: en el primer plano abajo, una mancha marrón grande (la lámina nueva del Encants vista muy de cerca desde
  el dron, en vez de la pirámide blanca de antes). Mejor que antes, pero se lee como un bulto marrón.
- **pcat_pie**: casi igual que antes (la rosa sigue sin leerse a pie); la bandada de palomas (cajas negras) sigue.
- **gotic_calle, gracia_calle**: casi sin cambio visible (dependen de las fachadas, G1F, que no está fusionado).
- Rendimiento: solo se ha podido medir en triángulos (el tiempo de fotograma del arnés no es fiable aquí). El recorte de los
  árboles en alta es modesto (medio al 90 %: −63 k en eix_calle); el grueso del ahorro está en media (−160 k más).
- Peticiones de los carriles para la integración que **no** se han atendido en INT1 (son de la fase de arreglos): losa lisa
  de las cubiertas de vidrio en `FS_BLD` (`style == 3`) y la nave blanca del Moll de Barcelona; parches «recientes» casi
  negros de FS_ROAD; cinta de clase 9; posible parpadeo de las cintas de clases distintas en los cruces (ROFF); exposición
  automática y TAA (G1L). Lista completa en las secciones «Peticiones» de G1S1–3, G1T1–3, G1V2–3 y G1L1–3.

## Para los jurados
ANTES: `scratchpad/g1/banco/antes/a_<vista>.jpg` (principal 8cb3633). DESPUÉS: `scratchpad/g1/int/despues/d_<vista>.jpg`
(wt-g1-int 295f54e: banco + suelo + tej + veg + luz, sin fachadas).
