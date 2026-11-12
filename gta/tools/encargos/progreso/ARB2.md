# Progreso · etapa ARB2 (árboles, segunda pasada)

Rama `wt-n2-arb`. Ficheros: `trees.js`, `streets.js` (sombreador de árbol y `findTree`). Parte de lo que dejó ARB (ARB.md).

## Hecho
- Pino piñonero: tronco de 8,6 m sin ramas bajas e inclinado (1,4 m en la punta), siete ramas madre casi horizontales
  arriba, tarjetas de hoja casi horizontales (`l.flat`) en una capa fina: copa en parasol. Corteza propia en el sombreador
  (`bm: 1`, placas pardo-rojizas con grietas oscuras). Impostor con copa plana arriba.
- Tipuana: ramas más finas y una profundidad menos (dh 3 → 2), 1250 tarjetas también a media rama (`l.mid`) y más bajas,
  atlas de foliolos finos y verde amarillento claro: copa amplia que tapa las ramas.
- Jacaranda: más racimos de flor en los atlas (cerca 34 → 60, lejos 60 → 170) y en el impostor; en los ejemplares en flor
  el sombreador empuja el color hacia el lila a partir de ~15–90 m (donde el atlas mezcla flor y hoja y daba gris azulado).
- Palmera: nueva variante Phoenix (malla 7, `phoenix`): tronco de 0,42 m de radio con rombos de bases de hoja (`bm: 3`),
  «piña» bajo la corona, 40 hojas largas y arqueadas, atlas de foliolos finos verde azulado e impostor propio. Sale en
  ~45 % de los tramos de palmera (`pick`). La Washingtonia tiene corteza fibrosa propia (`bm: 2`).
- Verdes por especie (`leaf`): almez gris verdoso, naranjo oscuro, tipuana amarillenta, jacaranda verde claro, pino
  verde oliva oscuro; luz sobre la copa (cara al cielo más clara y cálida de día, nada de noche).
- `findTree` devuelve además la dirección al eje de la calzada y la distancia; las vistas de calle de prueba ponen la cámara
  a 1,7 m sobre la línea de alcorques (acera), a medio camino entre dos árboles, mirando a lo largo de la calle.
- Plátano idéntico (mismas secuencias), mismas posiciones; la noche sin tocar.

## Cómo se prueba
`$SCRATCH/n2/arb2/mkv2.js <grupos> [antes]` (sp, mid, calle, gen, aer) genera las vistas; `run.sh <prefijo> <json> [dir]`
lanza el arnés (antes = copia de HEAD de ARB en `arb2/old/gta`). `tris.js` cuenta triángulos por especie sin navegador.

## Coste (arnés, 640×360; ANTES = HEAD de ARB, mismas vistas)
- Triángulos por ejemplar (cerca / media): tipuana 4840/358 → 4116/428, pino 2816/348 → 3460/378, Phoenix (nueva)
  704/144; el resto igual (plátano 4272/328). Impostor: 4 en todas. Ejemplares: los mismos (la Phoenix sale de tramos que
  antes eran Washingtonia).
- Aérea 10:30 (y = 160): árboles a media distancia 541 672 → 549 458 (+1,4 %), impostores 97 784 = 97 784; cascada lejana
  de sombras 1 513 391 → 1 521 177 tris, mallas que proyectan 67 → 69.
- Acera del Eixample 23:00: cerca 205 056 = 205 056, media 583 180 → 592 300 (+1,6 %), cascada lejana 1 140 969 → 1 150 089.
- Una especie más: 5 mallas y 5 materiales más (40 en total, solo dibujan las que tienen instancias), 2 texturas de 512² y
  una de 256² más. Sin trabajo por fotograma nuevo (la corteza procedural es solo sombreador, en el tronco cercano).

## Hojas (scratchpad n2/arb2/)
`hoja_arb2_especies.jpg` (las especies a pie; ANTES con otra cámara porque el `findTree` viejo no da el lado de la
calzada), `hoja_arb2_media_distancia.jpg` (jacaranda, pino, tipuana y Phoenix a 90 m y 480 m), `hoja_arb2_calles.jpg`
(siete barrios a pie en la acera, misma cámara antes y después), `hoja_arb2_general.jpg` (acera, aérea y dron a las 10:30,
dron y acera a las 23:00: la noche sale igual). Cero errores y avisos de consola en todas las capturas.

## Pendiente / flojo
- Pino de cerca: ya es tronco alto sin ramas bajas con parasol, pero las ramas madre se ven como radios rectos y el
  parasol, desde abajo, es una masa oscura; de media distancia no se distingue bien de un plátano visto de lado.
- La corteza en placas se lee en el tronco; en las ramas se nota algo el patrón de ladrillo.
- Jacaranda de lejos: los ejemplares en flor tiran a lila, pero a 480 m son pocos píxeles y la vista de prueba no
  enfoca una calle entera de jacarandas.
- Luz sobre la copa desde el aire: el cambio es sutil (las copas son algo más claras arriba); el Eixample sigue siendo
  plátano y la vista aérea cambia poco.
- La vista de prueba `sp3_palmera` (Washingtonia) queda tapada por una jacaranda: falta una buena vista de cerca de la
  Washingtonia con su corteza fibrosa.
- DESARROLLO.md (nombres de malla, `trees.js`, `free`/`findTree`) sin tocar: no es de mi carril.
