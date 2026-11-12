# Progreso · etapa ARB4 (repaso de ARB3: alcorque, plantón y prueba de Ciutat Vella)

Rama `wt-n3-arb`. Ficheros: `trees.js` (plantón, alcorque y sus texturas) y, de `streets.js`, solo árboles y alcorques.
**`FS_WALK` no se ha tocado en esta etapa** (la línea de ARB3 sigue ahí, pero ya no se usa: el campo de aceras deja el
canal alfa a 0 porque los alcorques son ahora instancias propias). SUELOS puede quitar esa rama del shader si quiere.

## Hecho
- Alcorque cuadrado y nítido (nota 1): instancias propias `pitG` (con reja) y `pitS` (tierra), geometría `TR.pitGeo()` de
  26 triángulos: marco de piedra de 1,2 m × 10 cm con el canto 2,5 cm sobre la acera (faldón hasta −4 cm para la pendiente),
  paredes interiores y tierra 1,7 cm por debajo del canto. Textura de 512 px (`TR.pitCanvas(grate)`): piedra gris con junta,
  tierra con hojarasca y ramitas, sombra de contacto; la reja es de fundición con ranuras radiales finas (~2 cm) en cuatro
  coronas, dos mitades y hueco central de 40 cm. Matriz por posición (`t.pm`): giro con la calle e inclinación con la pendiente
  de la acera. Adultos y alcorque −1 llevan reja; plantones y −2, tierra. Solo cerca: fundido tramado de 60 a 75 m.
- Plantón (nota 2): copa de 44 tarjetas en un elipsoide de ~1 m × 0,85 m, verde claro (`sapL`, uLeaf 1,22/1,4/0,86), se ve a
  través; tutores de pino claro con veta y nudos (`TR.stakeCanvas()`, atlas propio) y atados de cinta de caucho verde oscuro
  (anillo en el tronco, anillo en cada tutor y tirante).
- `findTree(k)`: −3 alcorque con reja, −4 alcorque de tierra (para las vistas).

## Cómo se prueba
Scratchpad `n3/arb4/`: `mkv4.js cv|cerca`, `run.sh <prefijo> <json> [dir]` (antes = `n3/arb3/old/gta`, sin ARB3), `hoja.py`.

## Resultado de las notas
1. Alcorque: **resuelto** (cuadrado, canto nítido, tierra hundida con hojarasca, reja radial fina). FS_WALK sin tocar.
2. Plantón: **resuelto** (copa de ~1 m verde claro que se lee a pie, en tercera persona y a las 23:00; tutores de pino claro
   con cinta). De noche la copa queda algo amarillenta bajo la farola (la luz de farola de `FS_TREE` sobre un verde claro).
3. Prueba de Ciutat Vella: hecha (Gòtic, Raval, Born a pie y en tercera persona, más dos calles de Gràcia) contra la versión
   sin ARB3. Raval y Born, sin árboles ni alcorques. **En la vista del Gòtic queda un alcorque con reja**: ese tramo tiene un
   lado sin edificios y `streetKind` lo cuenta como ancho (defecto ya anotado en ARB3); no se ha cambiado el reparto.

## Coste (arnés 640×360, acera del Eixample 10:30)
Alcorque: 26 triángulos por instancia, 30–50 instancias en pantalla (≈ 0,8–1,3 k tris), dos mallas y dos materiales más, sin
sombra. Plantón: 11 instancias = 3 894 tris (≈ 354 por plantón; en ARB3 ~260 A / ~380 B). Construir una celda de aceras es
algo más barato (ya no se rasterizan los alcorques en el campo). Sin trabajo nuevo por fotograma salvo copiar las matrices
de los alcorques cercanos cuando se recalculan las instancias (como los árboles).

## Hojas
`n3/arb4/hoja_arb4_antes_despues.jpg` (14 filas). Cero errores y avisos de consola en todas las capturas.

## Para DESARROLLO.md
§ árboles de calle: alcorques como instancias `pitG`/`pitS` (`TR.pitGeo`, `TR.pitCanvas`, matrices `t.pm` por celda,
fundido 60–75 m); el canal alfa del campo de aceras ya no se usa (la rama de alcorque de `FS_WALK` queda muerta);
`findTree(−3|−4)`; tutores con atlas propio `TR.stakeCanvas`.
