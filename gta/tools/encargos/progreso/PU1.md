# PU1 · El puerto (día 3) — progreso

Rama `wt-n3-puerto`. Ficheros: `puerto.js` (nuevo), `data/puerto_pu1.json` + `data/puerto_pu1.js` (la misma maqueta, la
segunda como script para que las fichas se declaren al cargar sin red), `data/puerto_nominatim.json` (contornos y puntos
de Nominatim) y dos `<script>` en `index.html`.

## Estado
- [x] Lectura de comun.md, PUERTO.md, DESARROLLO §2, §3, §6, §7.6, §10.
- [x] Nominatim: muelles, terminales (APM/Moll Sud, BEST/Moll Prat), Moll Adossat, marina, Maremàgnum, Aquàrium, Enagás.
- [x] Maqueta generada a partir de la ortofoto (máscara de agua), el registro de edificios (`BCN.lm.near`) y Nominatim.
- [x] `puerto.js`: 8 fichas de hitos (ver abajo), 229 000 triángulos.
- [ ] Capturas ANTES/DESPUÉS de día y a las 23:00, hoja, ajustes.

## Cómo está hecho (para DESARROLLO.md)
### Puerto (`puerto.js`, etapa PU1)
- El puerto usa el **sistema de hitos** (§10): cada zona es una ficha `BCN_LM.add` declarada al cargar `puerto.js`, que va
  **después de `landmarks_e.js` y antes de `app.js`** (no antes de `lighting.js` como un módulo normal: necesita `BCN_LM`
  y declarar sus fichas antes de `BCN_LANDMARKS.init`). No hay `addMod`: el módulo `lm` ya construye todo.
- Datos: `window.BCN_PUERTO_DATA` (`data/puerto_pu1.js`, copia de `data/puerto_pu1.json`), generado una vez fuera del
  juego (script en el scratchpad de la etapa, `n3/pu1/gen.py`): máscara de agua de la ortofoto (`ground.webp`, 5 m/píxel:
  agua = oliva (150, 151, 107) ± 22 o azul), bordes de muelle muestreados con rayos, bloques de apilamiento comprobados
  contra tierra y contra las cajas de los edificios del registro, barcos encajados (rumbo y posición con el casco entero en
  el agua y lo más pegado al muelle, sin solaparse), amarres de la marina a partir de los pantalanes de la ortofoto.
- Todas las fichas llevan `y: 0` y `rot: 0`: las coordenadas locales son mundo − centro y la cota local es la absoluta
  (el mar está a y = 0; los cascos bajan a −2 m). En tierra, `h.y(lx, lz)`.
- Fichas:
  | id | qué | sustituye |
  | --- | --- | --- |
  | `pu_portvell` | 91 yates (vela y motor de 9–20 m en los pantalanes, superyates de 28–70 m popa al Moll de la Barceloneta), 3 golondrinas de dos cubiertas en el Moll de Drassanes, Maremàgnum genérico sobre su planta | 64278, 64318 |
  | `pu_bertran` | 2 ferris, 3 remolcadores, terminal F2 de vidrio sobre su planta, 3 tinglados con dientes de sierra | 63111 |
  | `pu_creuers` | 5 terminales de cruceros nuevas sobre su planta (zócalo, vidrio, cubierta con vuelo), 2 cruceros (300 y 330 m) con pasarelas de embarque, norays, defensas, autocares | 43333, 36696, 43416, 43415, 36697 |
  | `pu_dic` | espaldón y escollera por el borde exterior del dique, faros de la bocana sud (verde en el Dic de l'Est, rojo en el Dic Sud) | — |
  | `pu_moll_sud` | terminal de contenedores del Moll Sud: 89 bloques de pilas (1–5 alturas), grúas de patio, 10 grúas pórtico (8 trabajando, 2 con la pluma levantada), 2 portacontenedores, carretillas pórtico, camiones, 4 vías con tren de plataformas, torres de focos, edificio de control | — |
  | `pu_moll_prat` | terminal automatizada del Moll Prat: 42 bloques largos con 2 grúas de apilamiento sobre carriles, 15 grúas pórtico, 3 buques, vías, focos | — |
  | `pu_energia`, `pu_contradic` | 694 depósitos rehechos sobre las plantas del registro (cilindros de chapa con cubierta cónica y anillo, los grandes de GNL con cúpula y balizas, escaleras, cubetos, tuberías con soportes entre vecinos, focos) | los 694 cilindros (cls 8) |
- Noche: `noche: 'ventanas'` (los huecos `K.VENTANAS` de buques y terminales se encienden con `homeOn`); balizas rojas de
  las grúas, girofaros, focos de los pórticos y de las torres y luces de los faros con `K.EMISIVO` (solo de noche, salvo
  los faros). Los depósitos van con `noche: 'focos'`.
- Sin marcas: contenedores de 15 colores lisos con paneles (`K.METAL`, `panel(2.59, 0.75)`: cada panel de 2,59 m cambia
  de tono, así una pila parece de contenedores distintos), cascos sin nombres.
