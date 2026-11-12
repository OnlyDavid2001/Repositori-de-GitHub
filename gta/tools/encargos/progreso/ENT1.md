# ENT1 · Las dos plazas (Plaça de Gaudí y Plaça de la Sagrada Família)

Rama `wt-sf-entorno`. Capturas y hoja: `<scratchpad>/sf/ent1/`. **Estado: en curso** (código y datos subidos; faltan capturas/hoja).

## Hecho
- `gta/data/sf_ent_plazas.json` (nuevo; generador en `<scratchpad>/sf/ent1/gen/plazas_gen.py`): trazado en ejes locales de la
  ficha `sagrada_familia`: estanque de Gaudí (3000 m², contorno orgánico de 96 puntos), isla (128 m²), orilla, caminos,
  zonas (mirador, juegos, petanca, bar, paseo de Marina, macizos), puntos (monolito, fuentes, quioscos, terrazas, estatuas),
  cipreses y mezcla de especies por plaza.
- `plazas.js`: entradas singulares de las dos plazas (`sfSing`), zonas y objetos; piezas `sfpond` (albardilla que sigue la
  cota, pared interior, isla con talud y matas, nenúfares y juncos) y `sfmono` (monolito de Corberó); agua del estanque con
  malla y material propios (`sfPond`) y reflejo plano de verdad (MirrorTexture, solo a < 420 m).
