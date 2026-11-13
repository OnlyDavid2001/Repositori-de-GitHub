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

## Cómo se usa (para la Fase 4 en `wt-cc`)
- **Lo natural**: en `shopPlan` (interiors.js) el generador pone `s.neg = <índice de negocio>` en cada local ANTES del gancho
  `BCN_ESC.plan(env, run, s)` (va justo después del sorteo de persianas). Con eso el local usa su modelo: interior, toldo,
  persiana, rótulo con nombre, lo pintado en el cristal y lo que saca a la acera. Sin `s.neg` (y sin forzado) el local queda
  como siempre: **hoy nada cambia en la ciudad si no se fuerza**.
- Elegir el negocio con las cuotas reales: `BCN_ESC.elige(BCN_CONDAL.at(x, z).negocios, r)` → índice (ponderado por `q`).
- Fuera de `shopPlan` (p. ej. una pieza «pb» del kit o los chaflanes): `BCN_ESC.dibuja(env, run, { w0, w1 }, modelo, negocio,
  semilla)` dibuja un local entero en los vanos `w0 … w1−1` del tramo (BASE y ORNAMENTO de `env`); `negocio = -1` → uno del modelo.
- Escaparate de modelos: `?escaparate=<modelo>` (todos los locales que se construyan; el negocio, uno del modelo por semilla),
  `?escaparate=auto` (negocio por las cuotas del barrio en cada local: anticipo de la Fase 4 sin decidir qué bajos son
  comerciales), `?escaparate=neg:<n>`; en marcha `BCN_ESC.force = 'farmacia'; BCN.fx.force(null)`.
- Hojas: `python3 tools/esc_hoja.py vistas <v.json> <hora> baja` → `node tools/shot.js <pref> @<v.json>` (tandas de 6) →
  `python3 tools/esc_hoja.py hoja <pref> <hoja.jpg> 4`.
- Datos: `BCN_ESC.M[modelo]` (toldo, persiana, rótulos posibles [estilo, letra, fondo], bajo, cristal, acera…),
  `BCN_ESC.NEG[i]`, `BCN_ESC.nombre(neg, k)`, `BCN_ESC.NOMBRES` (los 256 del atlas), `BCN_ESC.ESP` (rótulos fijos).

## Los 24 modelos (qué tiene cada uno)
| modelo | bajo | lo propio |
|---|---|---|
| bar | normal | barra y botellero, toldo frecuente, chapa/neón/caja, terraza de interiors.js (mesas, sillas, sombrillas, pizarra) |
| restaurante | normal | rótulo dorado o letras sueltas, cortina o vinilo a media altura, carta iluminada junto a la puerta, terraza |
| comida_rapida | normal | caja luminosa de colores, banda de fotos de comida retroiluminadas, mostrador; heladería con terraza |
| ocio_nocturno | oscuro | frente negro, puerta acolchada con marco de neón, persiana con grafiti DE DÍA (desaparece de noche), cordón con postes, letras luminosas |
| hotel | hotel | vestíbulo iluminado (zaguán de interiors.js), perfilería de latón, marquesina con luces, banderas, letras doradas, placa |
| super_autoservicio | normal | caja luminosa, carteles de ofertas, cajas de fruta en grada en la acera |
| alimentacion_tradicional | normal | mostrador y género (forn, fruites, carnisseria, peixateria…), rótulo pintado, toldo; frutería con cajas en la acera |
| moda | normal | maniquíes y burras, letras sueltas o rótulo sobre fondo oscuro |
| joyeria_optica | normal | rótulo dorado, rejilla de seguridad calada delante del escaparate |
| farmacia | normal | caja verde «Farmàcia <apellido>» (alguna de guardia, encendida toda la noche), cruz verde luminosa en banderola |
| belleza | normal | sillones y espejos, vinilo de franjas de color, rótulo moderno |
| salud | normal | vinilo esmerilado, placa de latón en la puerta, cruz o logo pequeño |
| gimnasio | normal | máquinas y espejos, vinilo de puntos, rótulo negro y naranja |
| hogar | normal | muebles/herramientas, rótulo clásico |
| floristeria | normal | grada de tres escalones con cubos de flores en la acera |
| cultura | normal | libros, carteles de espectáculos en un vano |
| bazar_moviles | normal | caja luminosa de colores, fundas, letrero «REPARACIÓ DE MÒBILS» en el cristal |
| souvenirs | normal | rótulo grande, expositores giratorios de imanes y burro de camisetas en la acera |
| estanco | normal | rótulo marrón y amarillo, banderola con la «T», máquina de tabaco fuera con pantalla luminosa |
| oficina | normal | vinilo esmerilado a la altura de los ojos, mesas, placa, poco escaparate |
| servicio_barrio | normal | carteles de precios en el cristal (tintorería, arreglos) |
| taller_garaje | portalón | portalones de suelo a dintel abiertos (se ve el taller) o con persiana grande, rótulo pintado grande, manchas de aceite, coche asomando o moto; parking con boca oscura y «PÀRQUING» |
| almacen_industrial | portalón | portalón de chapa nervada con puerta de paso, rótulo de empresa, sin escaparate |
| local_vacio | vacío | persiana bajada con grafiti o cristales empapelados, cartel «ES LLOGA / ES VEN / SE ALQUILA / LLOGUER», a veces el rótulo viejo del negocio que cerró |

## Verificación (capturas en la carpeta de arriba)
- `hoja_dia.jpg`: los 24 modelos a las 10:30, a pie de calle (Eixample, la vista de tienda de `tools/views_interiores.json`).
- `hoja_noche.jpg`: los 24 a las 23:00; `hoja_madrugada.jpg`: bar, discoteca, hotel, farmacia, alimentación y vacío a las 3:00.
- De noche sigue las reglas de siempre (`shClosed`, `shopOn`): la mayoría baja la persiana hacia las 21–22 h; bares,
  restaurantes y cafés siguen casi todos abiertos, y alguna farmacia de guardia. Rótulos: caja luminosa con `shopOn`, neón y
  letras luminosas toda la noche (menos de madrugada), pintados sin luz. Hotel encendido toda la noche; discoteca: persiana
  de día y neón de noche.
- Errores y avisos de consola: **cero** en las 13 cargas (día, noche, madrugada y medidas).
- `node --check` de escaparates.js e interiors.js.

## Medidas (fps_eval.js, calidad media, 960×540; vistas de la Fase 0)
| vista | sin forzar (como antes) | `?escaparate=auto` (todos los locales con modelo) |
|---|---|---|
| Eixample a pie | 5.194.012 triángulos / 866 llamadas | 5.185.738 / 866 |
| Gòtic a pie | 6.333.964 / 648 | 6.334.506 / 648 |
- Las mismas llamadas (todo va en las mallas de celda de siempre) y los triángulos ±0,2 %. Nada por fotograma. Texturas: el
  atlas `tRot` de 1024 × 2048 RGBA (8 MB + mipmaps) se crea una vez al iniciar (~0,1 s). Sin forzar, el juego es el mismo de antes.

## Lo flojo
- Lo de la acera (cajas, flores, expositores, coche, moto, carta, banderas) va solo en ORNAMENTO (hasta ~110 m).
- Sin portero en la discoteca (solo el cordón); sin máquina de tabaco dentro del bar.
- El coche del taller solo asoma si la acera mide ≥ 4 m; si no, moto (≥ 2,6 m). En la vista de prueba ninguno de los dos
  se ve bien (acera estrecha delante de ese local).
- Las 15 filas nuevas llenan `TYPES` (32): para más interiores hay que ampliar color.g de K.SHOPWIN (hay un bit libre, el 128).
- Los rótulos dependen de las fuentes del sistema (Georgia/Arial, con DejaVu de respaldo).
- El estilo del rótulo, el toldo y la persiana salen del modelo y la semilla; no miran el estilo de la fachada (eso puede
  decidirlo la Fase 4 escribiendo `s.rotSt`/`s.awn` después del gancho).

## Para DESARROLLO.md
- **§6.7**: ids 200–207 reservados a `escaparates.js`: 200 `K.ESC` (lo pintado de los escaparates; modo en aux.z, semilla en
  aux.x, variante en aux.y) y 201 `K.ROTULO` (rótulo con nombre: atlas `tRot` de 256 nombres, 4 por texel; aux.z = número,
  aux.w = color de letra + 16·estilo; color de vértice = fondo).
- **§6.1** (orden de carga): `escaparates.js` va justo después de `interiors.js` (añade filas a `TYPES` y paletas a `paramData`
  antes de que `interiors.init` cree `tShop`) y antes de `facades.js` (registra sus tipos de material).
- **§8** (interiores): `TYPES` tiene 32 filas (17 de siempre + 15 de escaparates.js); `paramData` se llama como
  `API.paramData()` para que escaparates.js añada las paletas 12–15. Ganchos: `BCN_ESC.plan` en `shopPlan`, `BCN_ESC.bay` al
  principio de `shopBay`, `BCN_ESC.front` en lugar de `shopFront` + `terrace`, y `BCN_ESC.enlaza` al final de `init`.
- **Nueva sección** «Condal City: escaparates (`escaparates.js`, `window.BCN_ESC`)»: el apartado «Cómo se usa» de arriba.

ESTADO: TERMINADO
