# Progreso · etapa ARB3 (menos árboles en la ciudad para la tercera persona)

Rama `wt-n3-arb`. Ficheros: `trees.js` (plantón `sapling`) y, de `streets.js`, solo árboles y alcorques (`streetKind`,
`treesOf`, mallas e instancias del plantón, alcorque con o sin reja en `FS_WALK` —una línea—, `findTree`, `countAll`).
`nature.js` (montaña, parques, delta) sin tocar.

## Hecho
- `streetKind(s)` (caché por tramo): ancho de fachada a fachada con `coverAt` en tres puntos del tramo (mediana, hasta 45 m
  por lado); **ancha** si ≥ 36 m, si la calzada tiene semiancho ≥ 5 m, o si es rambla (clase 7 con hw ≥ 4,5, o tramo
  peatonal paralelo a 3–14 m de lado, con ≥ 22 m de ancho). `cv` = distrito Ciutat Vella (`BCN_BARRI.at`).
- `treesOf`: adultos solo en calles anchas, uno sí y uno no al tresbolillo entre las dos aceras (índice absoluto a lo largo
  de la recta, estable entre celdas). En el resto de posiciones: plantón (`NSP` tres tutores, `NSP+1` dos tutores con
  protector) o alcorque vacío (`−1` con reja, `−2` tierra sola). Reparto por calle (clave de recta y tramo): 18–45 % de
  plantones, reja en el 60 % de las calles. Ciutat Vella: las calles no anchas sin árboles ni alcorques.
- Plantón (`TR.sapling()`): tronco de 2,3 m (radio 3,6→1,2 cm) con cuatro ramitas y 22 tarjetas de hoja del atlas del
  plátano; variante A tres tutores en triángulo con dos travesaños y atados; variante B dos tutores, travesaño y protector de
  8 varillas y 3 aros. Cinco mallas `tNS*` (cascada cercana de sombras), solo hasta 38–50 m (fundido tramado).
- Alcorque sin reja: el canal alfa del campo de aceras vale 175 (tierra) o 255 (reja); `FS_WALK` pinta la reja solo si
  `f.a > 0,84`.
- `findTree(k)`: −1 cualquier adulto, −2 alcorque vacío, `NSP` plantón. `countAll()` cuenta toda la ciudad (pruebas).

## Recuento (toda la malla de calles, `countAll`)
ANTES 366 263 árboles adultos de calle → DESPUÉS 148 089 adultos (−59,6 %), 68 214 plantones y 148 831 alcorques vacíos.

## Coste (arnés 640×360, mismas vistas; tris cerca / media / impostor)
- Acera del Eixample 23:00: árboles 205 056 / 600 950 / 95 988 → 0 / 159 008 / 29 364 + plantones 2 860; cascadas de
  sombra 1 107 132 / 1 158 739 → 904 936 / 716 797.
- Dron Eixample 10:30: 200 784 / 602 814 / 96 056 → 0 / 159 420 / 29 388 (+2 600 plantones); sombras 1 092 601 / 1 001 908 →
  894 417 / 558 514.
- Pg. de Sant Joan: 181 044 / 720 776 / 96 536 → 55 536 / 155 696 / 30 328. La Rambla: impostores ~83 k → 28 k.
- Plantón: ~260 (A) y ~380 (B) triángulos; cinco mallas y cinco materiales más. Sin trabajo por fotograma nuevo.

## Cómo se prueba
Scratchpad `n3/arb3/`: `mkv.js base|noche|cerca` (tercera persona: cámara 2,6 m sobre el suelo en la calle más cercana de
las clases dadas), `run.sh <prefijo> <json> [dir]` (antes = `old/gta`, HEAD previo), `probe.js <dir> e_count.js` (recuento),
`hoja.py`. Con la máquina cargada, el arnés se cae (Target crashed) con más de ~5 vistas: lanzar de 2 en 2.

## Hojas
`hoja_arb3_antes_despues.jpg`, `hoja_arb3_alcorque_planton.jpg`. Cero errores y avisos de consola.

## Flojo / pendiente
- La copita del plantón casi no se ve (22 tarjetas pequeñas, quedan arriba del encuadre o muy finas); los tutores se leen
  oscuros (corteza teñida), no madera clara.
- El alcorque sale octogonal y algo blando (campo de aceras a 0,5 m, ya era así); la reja es gruesa.
- La vista del Gòtic mira a un escaparate (no prueba nada); la de Gràcia es una calle que ya no tenía árboles.
- Tramos sin edificios (afueras, solares) cuentan como «anchos» y conservan media densidad: buena parte de los 148 k
  adultos están ahí.
- Aragó y otras calles de 30 m del Eixample quedan sin árboles (no más anchas que una rambla, según la regla).

## Para DESARROLLO.md
§ árboles de calle: `streetKind`, códigos de `treesOf` (especie 0..NSP−1, plantón NSP/NSP+1, alcorque −1/−2), mallas
`tNS*`, `findTree(k)` ampliado y `countAll()`.
