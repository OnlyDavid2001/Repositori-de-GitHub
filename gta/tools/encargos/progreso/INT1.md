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
(ver abajo)

## 3 · allanado.bin.gz
G1S lo regeneró (preClave v8) en su rama; ninguna otra fusión toca las calles, el relieve ni el cálculo. Comprobado en la
medida de rendimiento con `BCN_SUELOS.pre` (true = se usa el precalculado).

## 4 · Rendimiento
(ver abajo)

## 5 · DESARROLLO.md
- [x] §14 Fase gráfica 1 (14.1 banco, 14.2 luz y mar, 14.3 suelo, 14.4 azoteas y huecos, 14.5 árboles y monte, 14.6 integración).

## Arreglos de integración
- `lighting.js`: `BCN.light.quality` no existía (el getter faltaba); `nature.js` (G1V3) lo leía y siempre obtenía
  `undefined`, así que el monte nunca se aclaraba en media ni en baja. Getter añadido.
- `streets.js`: niveles cercano y medio de los árboles de calle bajo la calidad (alta 1; media 0,8; baja 0,6).
