# CC_F2d · Fase 2d (bloque 4 del kit) — progreso

Estado: **terminada** (pendiente de fusionar con F2b y F2c en `wt-cc`). Worktree `/home/user/wt/cc-f2d`, rama `wt-cc-f2d`.
Capturas en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/f2d/` (`mk.js` genera las vistas del
escaparate, ahora con `K=<n>` para elegir el n-ésimo edificio de spotAt; `lote.sh <hora> <tamaño> <prefijo> estilo:x:z:hMin:hMax …`
captura, una ejecución del navegador por estilo; `QX='&pb=0'` añade parámetros a la URL; `noche.sh` es la tanda final).

## Hecho
- [x] `gta/piezas_b4.js`:
  - tipos de material 192 **ESGRAFIAT** (esgrafiado barroco de dos capas: rombos y botones, friso de dientes cada 1,5 m; de lejos,
    el tono medio) y 193 **ENCALAT** (cal sobre mampostería: blanco irregular con desconchados); acabados `esgrafiat` y `encalat`
    (son muros: reciben el desgaste por edificio de los paños `KIT.T.wr`).
  - piezas generales (las pueden usar los demás bloques): `dovelas` (anillo de dovelas de un arco de medio punto), `escudo`,
    `farol` (farol de forja en brazo, K.LAMP: se enciende de noche), `toldo_rayas`, `mesa_silla`, `bar_esquina` (puerta y
    escaparate de vidrio, letrero liso sin letras, toldo de rayas y mesa en la acera).
  - `colPar(env, run, g, pal)`: color de la parcela virtual g de un tramo (la 0 conserva el color del edificio, el del volumen
    lejano; las demás recorren la paleta con un paso primo con su tamaño, así dos vecinas nunca repiten).
- [x] `gta/estilos_b4.js` (5 estilos × 4 variantes, nombres del catálogo):
  - **neoclásico**: planta noble más alta con guardapolvos sobre ménsulas, hierro fundido; planta baja almohadillada con grandes
    huecos en arco (puertas de madera y montante de reja) y portal con entablamento y faroles isabelinos. Variantes: porticado
    (soportales de arcos `frente_arcos`, balaustrada), pilastras de orden gigante, relieves alegóricos de terracota sobre los
    huecos de las plantas 1.ª y 2.ª, balcón corrido de hierro fundido en la planta principal.
  - **barroco** (casa gremial): vano estrecho (2,7 m), balcones pequeños de forja, porticones; obrador con portalón de madera,
    dintel grueso y jambas de piedra (o persiana metálica de taller); cornisa sencilla de dos molduras y tendedero en el terrado.
    Variantes: esgrafiados (todo el muro en ESGRAFIAT), 2 balcones de forja (piedra, vano ancho, forja rica), golfes (dos
    ventanitas cuadradas por vano en la última planta, baja), esquina con hornacina de santo (nicho de medio punto con fondo
    azul, imagen, flores, repisa y farolillo que se enciende de noche).
  - **quart de casa**: cada vano de 4,4 m es un quart con su color vivo de la paleta, su bajante, un balcón por planta, toldos
    de rayas y alguna senyera o bandera; en la planta baja, su puerta (madera o aluminio) y su ventana con reja o una bodega con
    persiana; terrado con tendederos por parcela. Variantes: original, remonte moderno (1–2 últimas plantas en revoco gris,
    blanco o ladrillo, canto de forjado, ventanas de aluminio con cajón y un balcón de tubo), dos quarts unidos (color de dos en
    dos y balcón corrido en la 1.ª), esquina con bar (`bar_esquina` en el último vano del tramo del portal).
  - **gótico civil**: sillería (FXPIEDRA), plantas altas (3,7 m), pocas ventanas pequeñas a posición y tamaño irregulares con
    recercado y alféizar de piedra, ventanas geminadas (dos luces de medio punto, columnita con capitel, dovelas), portalón de
    medio punto con dovelas grandes, portalón de madera claveteado con postigo, rejas y ventanucos altos en la planta baja,
    farol de forja, cornisa de piedra sobre canecillos con gárgolas. Variantes: palacio (portalón ancho abierto: zaguán,
    hojas abiertas, patio y escalera; escudo), casa estrecha con geminada en el vano central de cada planta (alero de madera),
    galería de arcos en el último piso (logia en sombra sobre columnitas; alero de madera ancho), muro ciego con portalón y
    escudo grande (72 % de vanos ciegos, sin comercio).
  - **casas baratas**: cada casita son dos vanos (puerta y ventana) con su cal o su color, zócalo pintado, junta entre casas,
    reja y porticones en la ventana, escalón, alguna silla en la acera y macetas; en las de una planta con el muro alto (las
    alturas reales llegan a ~6,5 m), cenefa pintada y respiradero de la cambra; tejado bajo de teja (~27°) con el alero a la
    altura del peto de los demás estilos (si no, el peto de rooftops.js lo tapa) y chimenea. Variantes: original encalada (a
    una agua), reformada con piso añadido (ladrillo o revoco gris, aluminio con cajón; terrado con peto de ladrillo y antena),
    con patio (retranqueo de 2,2 m con murete encalado, cancela por casa y plantas; a dos aguas), esquina con bar.
- [x] `index.html`: `piezas_b4.js` y `estilos_b4.js` tras `estilos_b1.js` (al fusionar, las líneas de los bloques 2 y 3 van antes).

## Vistas por estilo (para `gta/tools/cc/vistas_estilos.json`, que no toco porque es compartido: añadirlas al fusionar)
```
{"name":"neoclasico","nota":"Ciutat Vella, Ferran / Plaça Reial","x":12642,"z":13472,"walk":true,"yaw":0,"pitch":0,"hour":10.5,"eval":"const B=BCN,s=B.fx.spotAt(12642,13472,0,'neoclasico',400); if(s){s.hour=10.5; B.applyView(s);}"},
{"name":"barroco","nota":"el Born, entorno de Montcada","x":13289,"z":13822,"walk":true,"yaw":0,"pitch":0,"hour":10.5,"eval":"const B=BCN,s=B.fx.spotAt(13289,13822,0,'barroco',400); if(s){s.hour=10.5; B.applyView(s);}"},
{"name":"quart_de_casa","nota":"la Barceloneta","x":13828,"z":13261,"walk":true,"yaw":0,"pitch":0,"hour":10.5,"eval":"const B=BCN,s=B.fx.spotAt(13828,13261,0,'quart_de_casa',400); if(s){s.hour=10.5; B.applyView(s);}"},
{"name":"gotico","nota":"Barri Gòtic / Montcada","x":13139,"z":13779,"walk":true,"yaw":0,"pitch":0,"hour":10.5,"eval":"const B=BCN,s=B.fx.spotAt(13139,13779,0,'gotico',400); if(s){s.hour=10.5; B.applyView(s);}"},
{"name":"casas_baratas","nota":"Can Peguera / el Bon Pastor","x":11757,"z":19610,"walk":true,"yaw":0,"pitch":0,"hour":10.5,"eval":"const B=BCN,s=B.fx.spotAt(11757,19610,0,'casas_baratas',400,3,9); if(s){s.hour=10.5; B.applyView(s);}"}
```

## Verificación (capturas en la carpeta de arriba)
- `hoja_b4_dia.jpg`: 5 estilos × 4 variantes a las 10:30 (filas: neoclásico, barroco, quart de casa, gótico, casas baratas;
  columnas: variantes 0–3), cargadas con `?estilo=<id>&pb=0` (planta baja del estilo, sin comercio) y la variante forzada en marcha
  sobre el MISMO edificio (por eso el color del muro es el que el selector horneó al cargar, como en F2a). Neoclásico con `K=1`
  (el edificio 0 tenía delante los soportales del de enfrente). `hoja_b4_noche.jpg`: 23:00, dos variantes por estilo (quart 0 y 3
  para ver el bar; casas baratas 0 y 3; los demás 0 y 2). `hoja_b4_casas_cerca.jpg`: casas baratas de ≤ 5 m, de cerca.
- ¿Se reconoce? Neoclásico: fachada crema ordenada, guardapolvos sobre ménsulas en la noble, soportales de arcos, pilastras
  gigantes, paneles de terracota, balcón corrido de hierro; de noche, los faroles isabelinos del portal. Barroco: esgrafiado
  geométrico en todo el muro (v0), obradores con dintel de piedra, golfes de ventanitas (v2), hornacina con farolillo (v3).
  Quart de casa: parcelas de colores vivos con bajantes, un balcón por planta, toldos de rayas, senyeras, remonte gris (v1),
  parejas (v2), bar con toldo (v3). Gótico: sillería, ventanas pequeñas e irregulares, geminadas con columnita, portalón de
  dovelas (abierto al zaguán en v0, claveteado en el resto), escudo, galería de arcos (v2), muro ciego (v3). Casas baratas:
  hilera de puertas y ventanas con reja, zócalos de colores, cal (v0, v2) o colores (v3), patio con murete y cancelas (v2),
  piso de ladrillo (v1, en las de dos plantas).
- Errores y avisos de consola: **cero** en todas las ejecuciones (pruebas, día, noche, medidas).

## Medidas (fps_eval.js, calidad media, 960×540, N=2; vistas de la Fase 0, selector natural)
- Eixample a pie: **5.193.202** triángulos / **866** llamadas (F2a: 5.194.012 / 866).
- Gòtic a pie: **6.390.488** / **647** (F2a: 6.332.852 / 644; Fase 0: 6,40 M / 649): +0,9 % por los estilos de Ciutat Vella que
  ahora salen del kit (gótico, barroco, neoclásico) en vez de la familia de antes.
- Aérea: **1.315.294** / **304** (igual).
- Nada por fotograma: todo se construye en las celdas de siempre; dos tipos de material nuevos (ramas del sombreador de detalle).

## Lo flojo / para los siguientes
- Casas baratas de una planta: las alturas reales (hasta ~6,5 m) dejan un muro alto sobre puerta y ventana; la cenefa y el
  respiradero lo parten, pero la casita sigue pareciendo alta. Se arreglará cuando la Fase 3 fije alturas por estilo o rebaje
  el volumen visual (no se cambian alturas aquí). El tejado solo se ve desde lejos o en calles anchas.
- Los anchos estrechos (quart 4,4 m, casita 5 m) son parcelas pintadas dentro de un edificio ancho: la Fase 3 las hará reales.
- «Esquina» (bar, hornacina) = último vano del tramo del portal: la Fase 3 puede pasar la esquina real precalculada.
- El escaparate con `?pb=0` enseña la planta baja del estilo; sin él, en Ciutat Vella casi todo es comercio (la Fase 4).
- Núcleo del kit: nada imprescindible. Útil para la Fase 3: un campo `q.esquina` en las ranuras pb/vano (vano en esquina real) y
  que rooftops.js no ponga peto en los edificios cuya coronación del kit dibuje tejado (casas baratas).
