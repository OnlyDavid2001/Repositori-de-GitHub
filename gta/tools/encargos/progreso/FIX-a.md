# FIX-a — Arreglos del lote a (y del encuadre de BCN.lm.view)

Rama wt-hitos-a, fusionada con wt-hitos (los cinco lotes + INT + REV). Solo se han tocado `landmarks_a.js` y `landmarks.js`.
Comprobación: capturas 480×300, rumbo 210, de día (16 h) y de noche (22 h); `node --check` y `node tools/hitos/tris.js a`
(18 hitos, unos 27 700 triángulos).

## Arreglado
- **Encuadre (landmarks.js, BCN.lm.view):** distancia mínima de 60 m; tamaño = máx(alto, ancho, largo) cuando la ficha
  da ancho o largo, y si no, máx(2 × radio del modelo, extensión de los volúmenes sustituidos), guardada en `rec.ext`.
  Comprobado: palau_blaugrana y picornell salen enteros (antes, la cámara dentro de la cubierta).
- **Sagrada Família:** trencadís de las puntas apagado (oro viejo, rojo terroso, verde gris); frutas de los pináculos también.
- **Park Güell:** el encuadre se ciñe al núcleo entrada–plaza (ancho 50, largo 80, en vez de 60 × 130: desde 300 m el
  hito era una mancha); pabellones algo mayores con tejados-seta blanco y azul, la torre de damero más alta con la cruz
  más grande, la seta blanca; plaza más clara; banco ondulado más alto (1,6 m) con el respaldo visto desde arriba y
  colores vivos. De noche: farolas en la plaza, la puerta y la escalinata, y ventanas encendidas en los pabellones.
- **Sant Pau:** torre de la Administració 7 m más alta, con impostas de piedra, reloj en las cuatro caras y linterna
  que se encienden de noche, aguja mayor; frente de piedra clara en la entrada.
- **Bellesguard:** piedra pizarrosa cálida, torre más esbelta y alta (aguja de 13 m, cruz mayor), 14 árboles con matas
  alrededor para romper la explanada lisa.
- **Fundació Tàpies:** el retoque de color del volumen genérico no se veía (el sombreado de fachada lo dejaba beis): ahora
  se oculta el volumen y se levanta en ladrillo rojo sobre su planta real, con la nube de tubos encima. OJO: el volumen
  112626 es el cuerpo interior de la manzana; la fachada que se ve desde Aragó es de un genérico vecino, que sigue beis.
  Haría falta añadir el edificio de la fachada (BCN.lm.near) a ED.fundacio_tapies.
- **Casa Calvet:** remates curvos mayores, con grosor y en piedra más oscura que la fachada, cornisa y pináculos; retoque
  sin `estilo: 0` (color piedra cálida, con ventanas) y focos de noche. La caja gris azulada sin ventanas de la azotea
  vecina NO es de la Calvet (no cambia con su retoque): queda sin tocar; está fuera de mis ficheros o es otro genérico.
  Desde 210 los remates (fachada de Casp, +Z) no se ven.
- **Palau de la Música:** ladrillo más vivo, columnas de mosaico de tres colores, friso de mosaico bajo la cornisa,
  pilastras blancas, cupulín de la esquina mayor, claraboya; de noche la logia encendida.

## Sin arreglar / flojo
- **Casa Batlló:** desde 210 se mira la trasera (la fachada da al NE, rumbo ≈ 46). No se ha cambiado: el modelo está
  bien encajado y desde 50 se reconoce (REV); que se vea desde el paseo a ras de calle depende de los vecinos de enfrente.
- **Casa Vicens:** desde 210 se ve bien (torrecillas y damero verde); no he reproducido la vista «dentro de un edificio»
  con un solo rumbo. La distancia mínima de 60 m la aleja algo.

## Capturas
Hojas en el scratchpad del agente (h0 = antes, h1–h3 = después). Park Güell desde 210 ya se lee: plaza clara con el banco,
columnata, pabellones y torre; de noche, farolas. Sant Pau desde 210 sigue lejos (la ficha mide 200 × 300 m) y la torre
nueva es pequeña en ese encuadre.
