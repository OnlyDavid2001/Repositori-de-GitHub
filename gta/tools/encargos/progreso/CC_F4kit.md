# CC_F4kit · Fase 4, punto 2: kit de los 24 escaparates (rama `wt-cc-f4kit`) — progreso

Trabajo en paralelo a las fases 2 y 3 (rama `wt-cc`). Aquí solo está el **kit**: los 24 modelos, los rótulos con nombres
inventados y el escaparate de prueba. **No** decide qué bajos son comerciales ni la densidad (eso es de la Fase 4 en `wt-cc`).
Capturas en `/tmp/claude-0/-home-user-Repositori-de-GitHub/6efb5ecb-8d38-59a8-911c-e9088440cfd5/scratchpad/f4/`.

## Hecho
- [x] `gta/escaparates.js` → `window.BCN_ESC` (se carga justo después de `interiors.js`, antes de `facades.js`).
- [x] Los 24 modelos del catálogo (`BCN_ESC.MODELOS`, mismo orden que `BCN_CONDAL.escaparates`) y los 59 negocios
      (`BCN_ESC.NEG[i] = { n, e (modelo), tipo (fila de interior) }`, mismo orden que `BCN_CONDAL.negocios`).
- [x] 15 filas de interior nuevas en `TYPES` de interiors.js (17 → 32, el máximo de 5 bits): MENJAR RÀPID, CARNISSERIA,
      PEIXATERIA, SABATERIA, JOIERIA, GIMNÀS, MOBLES, JOGUINES, MÒBILS, SOUVENIRS, ESTANC, OFICINA, TINTORERIA, TALLER, BUIT;
      y 4 paletas de género nuevas (carne, pescado, colores vivos, joyas) en las filas 12–15 de `tShop`. Con `w: 0`: no entran
      en el sorteo de siempre.
- [x] Rótulos con nombres inventados en catalán: 4 por negocio (236) + 16 fijos («ES LLOGA», «ES VEN», «SE ALQUILA»,
      «LLOGUER», «REPARACIÓ DE MÒBILS», «PÀRQUING»…). Tipo nuevo `K.ROTULO` (201) con atlas propio `tRot` de 256 nombres.
- [x] Tipo nuevo `K.ESC` (200) para lo pintado: persiana con grafiti, persiana solo de día, papel en el cristal, vinilos,
      neón, fotos de comida, carteles (precios, ofertas, espectáculos), mancha de aceite, cortina, expositor de recuerdos,
      pantalla de máquina, flores, fruta y rejilla de seguridad.
- [x] Escaparate de modelos: `?escaparate=<modelo>` | `auto` | `neg:<n>`, o en marcha `BCN_ESC.force = 'bar'; BCN.fx.force(null)`.
- [x] Ganchos mínimos en `interiors.js` (5 líneas) e `index.html` (1 línea). Nada más fuera de mis ficheros.
- [x] Herramienta `gta/tools/esc_hoja.py` (vistas del escaparate y hoja rotulada).

(Verificación, medidas y lo flojo: abajo, al terminar.)
