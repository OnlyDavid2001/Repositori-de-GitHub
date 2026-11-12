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
- Plantón (nota 2): copa de 44 tarjetas en un elipsoide de ~1 m × 0,85 m, verde claro (`sapL`, uLeaf 1,32/1,5/0,92), se ve a
  través; tutores de pino claro con veta y nudos (`TR.stakeCanvas()`, atlas propio) y atados de cinta de caucho verde oscuro
  (anillo en el tronco, anillo en cada tutor y tirante).
- `findTree(k)`: −3 alcorque con reja, −4 alcorque de tierra (para las vistas).

## Cómo se prueba
Scratchpad `n3/arb4/`: `mkv4.js cv|cerca`, `run.sh <prefijo> <json> [dir]` (antes = `n3/arb3/old/gta`, sin ARB3), `hoja.py`.
