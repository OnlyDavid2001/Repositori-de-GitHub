# FX · Arreglos de la zona «edificios» (fase gráfica 1)

Rama `wt-g1-fx-edificios` (desde `wt-g1-int`). Capturas en `scratchpad/g1/fx_edificios/` (a_ = ANTES, d_/t_ = DESPUÉS,
640×360; para `port_vell` y `azoteas` el ANTES bueno es `scratchpad/g1/int/despues/d_*.jpg`, porque la tanda ANTES ya cargó
algún cambio).

## Hecho
1. **Cubiertas de vidrio y oficinas lisas** (app.js FS_BLD, rama CUBIERTA): las clases 3 y 12 llevan ahora tela asfáltica o
   grava (`rt` 2 o 3 por edificio) y un tono algo variado, en vez de una losa lisa de un gris. Afecta también a la nave
   blanca larga del Moll de Barcelona.
2. **Árboles de esferas de azoteas y patios fuera** (rooftops.js `treeE`): frondoso, ciprés, frutal y palmera de barras ya no
   se emiten (el usuario: «fuera los árboles poco currados»); de los que iban en maceta queda la maceta de obra.
3. **Lucernarios del Poblenou** (rooftops.js, nivel cercano): vidrio de (96,120,132) a (64,76,84): de noche dejan de leerse
   como rayas azuladas.
4. **Cables de la Torre de Collserola** (landmarks_e.js): los vientos pasan de 0,44 m de grosor a 0,12–0,14 m (cables
   finos y tensos, como los de verdad); eran los «cables cruzando el cielo» de coll_camino.
5. **Glòries** (landmarks_c.js): la cubierta de los Encants deja de leerse como un damero marrón (ola más suave, sin tono
   alterno por triángulo y paneles de 2,1 m con poca variación: bronce uniforme con retícula fina); la Torre Glòries con menos ruido por panel (variación 0,7 → 0,32, huecos 0,2 → 0,08); el Disseny Hub en zinc
   oscuro con más variación de panel en vez de caja gris clara.

Hoja ANTES/DESPUÉS: `scratchpad/g1/fx_edificios/hoja_fx_edificios.jpg` (glories_dron, coll_camino, port_vell, azoteas,
eix_dron, gotic_calle). Sin errores de consola en ninguna captura. En port_vell el cambio de cubierta casi no se aprecia
desde el dron; en azoteas no había árboles de esferas a la vista.

## No resuelto (se queda como estaba)
- **Losa de gotic_calle (b15_16)**: el único volumen cuya caja contiene los dos puntos del picking es el edificio 81777
  (clase 0, base 7,0 m, arranque 5,8 m, cubierta 24 m): NO es un volumen elevado, así que no hay «paso» que quitar sin
  dejar un agujero en la manzana. Probé ocultar los volúmenes elevados que lo cruzan (no hay ninguno) y lo revertí.
- **Bandada y objetos grises en el cielo de pcat_pie**: son de plazas.js (`flock` en Plaça de Catalunya), fichero de G1S.
- Muelles del puerto con juntas, bolardos y grúas; patios de eix_dron; moiré de ventanas lejanas (es el muro de FS_BLD,
  no la cubierta); parpadeos de sagrat_cor, sf_gloria, hotel_arts, sant_jaume, pu_zf0; elipse verde de coll_camino.

## Peticiones a otros carriles
- G1S (plazas.js): la bandada `flock` de Plaça de Catalunya (W('flock', …), n 28) se ve como rectángulos negros flotando y
  hay un objeto gris en el cielo: quitarla o hacerla con aves de verdad.

## Para DESARROLLO.md
- FS_BLD: las cubiertas de las clases 3 y 12 usan `rt` 2/3 por edificio (antes, losa lisa).
- rooftops.js: `treeE` ya no dibuja copas (solo la maceta). Si algún día vuelven árboles a patios, que sean de BCN_TREES.
