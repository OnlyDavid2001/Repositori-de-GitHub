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

## Pendiente
- (se actualiza al terminar)
