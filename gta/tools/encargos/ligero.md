# Plan ligero (prevalece sobre `comun.md`, `reglas2.md` y los encargos antiguos)

El usuario ha pedido ir unas tres veces más rápido y más ligero, aceptando un poco menos de calidad pero sin renunciar
a lo esencial de lo que pidió (lo resume `comun.md`). Esto es lo que cambia.

## Etapas (cada una, un agente)
| Carril y ficheros | Etapas |
| --- | --- |
| LUZ → `app.js`, `lighting.js`, `index.html` | `LZ1` HDR y postproceso · `LZ2` sombras del sol · `LZ3` oclusión ambiental y atardecer |
| INTERIORES → `interiors.js`, `facades.js` | `IY1` comercios que se ven por dentro · `IY2` portales, pisos y terrazas |
| DETALLE → `furniture.js`, `details.js`, `ground.js`, `streets.js` | `FZ` mobiliario urbano |

Al final, una etapa `QA` de revisión visual con arreglos. Los encargos antiguos (`L1`, `L2`, `L3`, `I1`, `I2`, `B`, `F`,
`G`…) quedan solo como fuente de ideas: **no los ejecutes**.

## Decisiones de simplificación (tomadas: no las reabras)
- **Interiores sin geometría**: nada de cajas interiores, props 3D (`data/tr_props.*` no se usa), vidrio con mezcla alfa
  ni sustitutos lejanos. El interior se pinta por píxel en el shader del propio vidrio («interior mapping»: una
  habitación virtual con capas en paralaje). Vale igual de cerca que de lejos y no cuesta triángulos.
- **Luz**: usa lo que ya trae Babylon cuando ahorre trabajo (`DefaultRenderingPipeline` para tono, bloom y antialiasing).
- **Fuera del plan**: balcones y ornamento nuevos, detalle nuevo del suelo, sonda de reflejos, adaptación automática fina
  de la calidad, presupuestos `setBudget`.

## Ritmo
- Tope orientativo: unas 70 llamadas a herramientas por etapa. Si algo se resiste más de 8–10 llamadas, déjalo en su
  versión sencilla que funcione, anótalo en tu fichero de progreso y sigue. Mejor todo el alcance «bien» que la mitad
  «perfecto».
- Verificación: solo las vistas que diga tu etapa. Para revisar muchas variantes monta una hoja de contacto con PIL (una
  imagen con todas, rotuladas) en vez de abrirlas una a una. Capturas pequeñas para iterar (`SIZE=640x360 FMT=jpg`).
- De `DESARROLLO.md` lee §2, §4 y §5 y solo los apartados de §6 que diga tu etapa.
- Sigue valiendo todo lo de `reglas2.md` sobre reanudación: progreso en `gta/tools/encargos/progreso/<ETAPA>.md`,
  commit y push de tu rama tras cada hito.
