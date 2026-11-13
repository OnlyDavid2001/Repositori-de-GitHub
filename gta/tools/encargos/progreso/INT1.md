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
| coll_camino | 5,07 M | (pendiente) | – | 17 k | | |
| eix_dron | 4,80 M | (pendiente) | – | 150 k | | |
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
