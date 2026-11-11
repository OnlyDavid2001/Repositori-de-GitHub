# Carril INTERIORES · IY1 — Comercios que se ven por dentro (plan ligero)

Ficheros tuyos: `interiors.js`, `facades.js` y `DESARROLLO.md` §8; a `geo.js` solo se le añade al final.
De `DESARROLLO.md` lee además §3 y, de §6: 6.4, 6.6, 6.7, 6.8 y 6.9.

## Qué se pide
Hoy los escaparates son un vidrio gris opaco. El usuario quiere pararse delante de cualquier negocio y VER lo que hay
dentro a través del cristal, y reconocer de un vistazo qué es: «si es una peluquería, un forn de pa, una librería, una
farmacia, un súper…». No se entra; se mira desde la acera.

## Cómo (decidido: no lo cambies)
Con **«interior mapping»**: el interior NO es geometría. Se calcula por píxel en el shader del propio quad del vidrio:
un rayo desde la cámara entra en una habitación virtual y se pinta lo que encuentra. Sin props 3D, sin vidrio con mezcla
alfa y sin sustitutos lejanos: el mismo quad sirve en las capas BASE y ORNAMENTO, de cerca y de lejos.

## Tareas
1. **Comercios por grupos** (planta baja): cada grupo de vanos contiguos a un lado del portal es UN comercio (máx. ~4
   vanos o ~14 m; los más anchos se parten en dos) con un tipo estable por semilla (azar por ámbito). El rótulo, los toldos
   y el interior del grupo corresponden a ESE tipo; casi todos llevan rótulo. Un vano del grupo es la puerta de vidrio de
   la tienda (marco, tirador, umbral) y por ella se ve la misma habitación.
   Tipos (rótulos en catalán): FORN DE PA, FARMÀCIA, FERRETERIA, BAR, FRUITERIA, LLIBRERIA, FLORISTERIA, RESTAURANT,
   PERRUQUERIA, MODA, GELATERIA, CAFÈ, QUEVIURES, ÒPTICA, PAPERERIA, FORMATGERIA y SUPERMERCAT (solo en grupos anchos).
   Frecuencias creíbles (más bares, cafès, forns y queviures que ópticas).
2. **El shader del escaparate** (tipo de material nuevo, registrado con `regKind` en tu rango). Por píxel:
   - Coordenadas de habitación: sobre el vidrio, `u` = metros a lo largo del comercio desde su extremo, `y` = metros sobre
     el suelo de la tienda; la habitación mide el ancho del grupo, ~3,4 m de alto y ~5 m de fondo. Manda por vértice lo
     que haga falta (u e y interpolados, ancho, tipo, semilla, sentido del marco de fachada) empaquetado en los bytes de
     color/aux como veas, y documenta el empaquetado.
   - Rayo de vista en el espacio de la habitación (a lo largo de la fachada, vertical, hacia dentro) y capas compuestas de
     delante atrás, con paralaje real entre ellas al caminar:
     a) el vidrio: reflejo del entorno con Fresnel (`envRefl`), fuerte en rasante y casi nada de frente;
     b) repisa de escaparate a ~0,35 m: el género destacado del tipo;
     c) una o dos capas intermedias a ~1,5–3 m: mostrador, muebles, lineales, sillones… lo propio del tipo;
     d) la caja: paredes laterales, suelo (baldosa, madera, terrazo… según el tipo), techo con luminarias y pared del
        fondo con sus estanterías o decoración.
   - Cada tipo = una fila de parámetros (paleta, calidez de la luz, qué dibuja cada capa) sobre unas pocas funciones de
     dibujo reutilizables: estantería con artículos de colores, mostrador con vitrina, cestas y cajas inclinadas, espejos
     y sillones, percheros y maniquíes, lineales en perspectiva, mesas y sillas, botellero, panel de herramientas, cubetas
     de helado, ruedas de queso, expositores de gafas, cubos de flores. Lo que hace inconfundible a cada tipo: vitrina de
     pan y cestas (forn); cruz verde y estantes blancos de cajitas (farmàcia); estanterías de madera llenas de lomos de
     colores (llibreria); sillones y espejos con bombillas (perruqueria); lineales largos, fluorescentes y carteles de
     oferta (supermercat); cajas de fruta inclinadas (fruiteria); barra con taburetes y botellero (bar)… Añadir un tipo
     debe ser añadir una fila (y, si acaso, una función).
   - Luz: el interior es luz propia de la tienda, con `emit()` (de día 0,9–1,3; al anochecer sube con `uDusk` hasta 2–3
     para que los comercios brillen; las luminarias del techo, 4–6). No le apliques el sol. Algo de caída hacia el fondo.
   - Filtrado: desvanece el detalle fino con la distancia (`fwidth`) para que no parpadee a 100 m; muy lejos basta el color
     medio y la franja de luz del techo.
   - Nada de coordenadas de mundo en lo procedural (§4) y cuidado con las palabras reservadas de GLSL.
3. **Depuración**: parámetro de URL `?shop=<índice o nombre>` que fuerza el tipo de todos los comercios.
4. El defecto conocido de la cuña oscura en `gotic_calle` (`reglas2.md` §4) es de tu carril: localízalo y arréglalo si
   sale de la planta baja, sin dedicarle más de 8 llamadas.

## Verificación
Dos hojas de contacto con los 17 tipos (usa `?shop=`): de frente a ~5 m y en oblicuo (~35°) a ~6 m, para comprobar que se
reconoce cada tipo y que hay profundidad. La misma acera a 30 m y a 120 m (sin parpadeos ni saltos). `eix_tienda,
eix_tienda2, pg_tiendas, gotic_tienda, rambla_pie` sin errores de consola, y una calle al anochecer (`HOUR=20.25`).

## Entrega
Commits subidos, §8 de `DESARROLLO.md` (grupos, tipos y cómo añadir uno, empaquetado, capas del shader) y notas para IY2,
que reutilizará tu función de habitación para los portales y los pisos.
