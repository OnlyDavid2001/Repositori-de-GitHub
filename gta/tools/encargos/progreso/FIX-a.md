# FIX-a — Arreglos del lote a (y del encuadre de BCN.lm.view)

Rama wt-hitos-a, fusionada con wt-hitos (los cinco lotes + INT + REV). Solo se han tocado `landmarks_a.js` y `landmarks.js`.
Comprobación: capturas 480×300, rumbo 210, de día (16 h) y de noche (22 h); `node --check` y `node tools/hitos/tris.js a`
(18 hitos, unos 27 700 triángulos).

## Arreglado
- **Encuadre (landmarks.js, BCN.lm.view):** distancia mínima de 60 m y tamaño con `alto || ancho || largo || 2r` (las
  fichas de nivel C sin alto ya no sacan la cámara pegada).
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
  se oculta el volumen y se levanta en ladrillo rojo sobre su planta real, con la nube de tubos encima.
- **Casa Calvet:** remates curvos mayores, con grosor y en piedra más oscura que la fachada, cornisa y pináculos.
- **Palau de la Música:** ladrillo más vivo, columnas de mosaico de tres colores, friso de mosaico bajo la cornisa,
  pilastras blancas, cupulín de la esquina mayor, claraboya; de noche la logia encendida.

## Sin arreglar / flojo
- **Casa Batlló:** desde 210 se mira la trasera (la fachada da al NE, rumbo ≈ 46). No se ha cambiado: el modelo está
  bien encajado y desde 50 se reconoce (REV); que se vea desde el paseo a ras de calle depende de los vecinos de enfrente.
- **Casa Vicens:** desde 210 se ve bien (torrecillas y damero verde); no he reproducido la vista «dentro de un edificio»
  con un solo rumbo. La distancia mínima de 60 m la aleja algo.
