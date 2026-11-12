# PU2 · La zona de mercancías y repaso (día 3) — progreso

Rama `wt-n3-puerto`. Ficheros: `puerto.js` (bloque «PU2» y su declaración al final), `data/puerto_pu2.json` +
`data/puerto_pu2.js` (la misma maqueta; la segunda como script para declarar las fichas al cargar sin red),
`data/puerto_pu2_nominatim.json` (contornos y puntos de Nominatim) y un `<script>` más en `index.html`
(`data/puerto_pu2.js`, entre `data/puerto_pu1.js` y `puerto.js`).

## Estado
- [x] Nominatim: ZAL Port, ZAL Prat, Mercabarna (y sus dos mercados centrales), Zona Franca, Parc Logístic, playa de vías
  Barcelona-Morrot, Consorci, Duana (ya es hito, `duana`: no se duplica).
- [x] Dump del registro de edificios en los recintos (`BCN.lm.near` en un eval del arnés, `n3/pu2/dump_eval.js`).
- [x] Generador `n3/pu2/gen2.py` (scratchpad): naves por recinto, cajas de todos los edificios de los recintos, controles de
  acceso y eje de la playa de vías.
- [x] `puerto.js`: 8 fichas nuevas (ZAL Port, ZAL Prat, Mercabarna, Zona Franca en 4 cuartos, playa de vías).
- [x] Repaso del coste: depósitos con menos lados (18/12/8 en vez de 24/16/10) y sin anillo en los pequeños: −17 k
  triángulos; `libre()` y la playa de vías con rejilla de 100 m (sin ella, ZAL Prat tardaba 1,7 s en construirse).
- [x] Capturas ANTES/DESPUÉS de día y a las 23:00, hojas `n3/pu2/hoja_dia.jpg` y `n3/pu2/hoja_noche.jpg`.

## Coste
- Triángulos de los hitos: 353 218 (tras PU1) → 457 611 (medido en el navegador, `BCN.lm.stats().tris`): +104 393 netos.
  PU2 añade ≈ 122 000 (Mercabarna 29 k, playa de vías 23 k, ZAL Prat 18 k, ZAL Port 11 k, Zona Franca 4 × 12–14 k) y quita
  ≈ 17 000 de los depósitos. **Pasa del tope de 400 000 del §10.9** (ver «Flojo»).
- 8 mallas y 8 llamadas de dibujo más, con sombra, siempre cargadas. 567 volúmenes del registro sustituidos por naves.
- Construcción al arrancar (contador sin navegador, máquina compartida, ruidoso): 20–200 ms por ficha nueva.

## Flojo
- De noche las cubiertas de las naves se ven bastante claras (gris azulado) frente a la ciudad, que queda más oscura: es el
  sombreado nocturno de los hitos; las puertas de muelle y los lucernarios se encienden, pero de lejos domina la cubierta.
- La vista a pie dentro de la terminal de contenedores (`cont_pie`) cae dentro de una pila: sigue faltando una buena vista
  a pie en las terminales (pendiente de PU1).
- Los depósitos con menos lados no se distinguen de los de PU1 desde el aire (`dep_aire`); de muy cerca, algo más facetados.
- Sin niveles de detalle (son hitos siempre cargados) y por encima del tope de triángulos del §10.9. Las naves ya van
  ahorradas (≈ 200 triángulos cada una); para bajar más habría que dar a landmarks.js un nivel de detalle por ficha.
- No hay datos del viario dentro del constructor de un hito: los camiones, remolques y vallas se colocan comprobando solo
  que no caen dentro de otro edificio; alguno puede quedar sobre una calle interior del polígono.
- Naves de la Zona Franca genéricas (la planta y la altura sí son reales); sin rótulos ni marcas.
- La playa de vías sale del contorno de Nominatim (Barcelona-Morrot) y del eje principal del polígono: las vías son
  rectas y paralelas, sin desvíos ni haces que se abran.

## Para DESARROLLO.md
### Zona de mercancías (`puerto.js`, etapa PU2)
- Mismo sistema que el puerto (§10, fichas `BCN_LM.add` con `y: 0`, `rot: 0`): datos en `window.BCN_PUERTO2_DATA`
  (`data/puerto_pu2.js`, copia de `data/puerto_pu2.json`), generado fuera del juego con Nominatim y el registro.
  - `naves[zona] = { c, ext, b: [ids] }`: volúmenes del registro de ≥ 1 100 m², 3,5–24 m de alto, clases 0, 1, 2 y 5, dentro
    de los recintos de Nominatim y no usados por otro hito.
  - `cajas`: [cx, cz, semiancho, semifondo] de todos los edificios de los recintos (rejilla de 100 m en `rejilla(x, z)`),
    para comprobar que camiones, vallas y vías no se meten en un edificio.
  - `zonas`: contornos; `via`: centro y eje de la playa de vías; `aduanas`: [zona, x, z, rumbo, carriles].
- Fichas: `pu_zal`, `pu_zal_prat`, `pu_mercabarna`, `pu_zf0`…`pu_zf3` (naves) y `pu_vias` (playa de vías).
- Nave (`naveLog`): zócalo de hormigón, chapa grecada (`K.METAL`, `panel(0.9)`), franja de color o peto, cubierta de chapa de
  7 tonos con lucernarios corridos y máquinas, o dientes de sierra en los pabellones grandes de Mercabarna; lado de muelles =
  el lado largo con más sitio libre delante: banda de puertas seccionales (`K.VENTANAS`: de noche se encienden), marquesina,
  tira de luz (`K.EMISIVO` solo de noche), andén, remolques atracados (furgonetas en Mercabarna), explanada de remolques en
  batería (ZAL), torre de focos y valla del patio con puerta; oficinas en un testero.
- Controles de acceso con aduana (marquesina, casetas, barreras) en la ZAL Port, la ZAL Prat y Mercabarna.
- Playa de vías: vías cada 4,8 m recortadas al recinto, a las cajas y a la pendiente (tramos de 60 m), trenes de
  plataformas con contenedores, cisternas, tolvas y vagones cerrados, locomotoras diésel genéricas, torres de focos y gabinete.
