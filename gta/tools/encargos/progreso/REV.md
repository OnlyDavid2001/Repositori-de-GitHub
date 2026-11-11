# REV · Hitos, revisión — progreso

## Hecho
- Revisadas las hojas de INT (`hoja_a` … `hoja_e`, `hoja_noche_A`; rumbo 210) y sacadas tres tandas de vistas de
  contraste, sin errores de consola. Las hojas están en el scratchpad de la sesión, en `hitos/`:
  - `rev30.jpg`: rumbo 30, k 2,4. Contiene arc_triomf, palau_nacional, parlament, santa_maria_mar, sant_jaume,
    ciutat_justicia, park_guell, casa_calvet, universitat, estacio_sants, sagrada_familia y colom.
  - `rev313.jpg`: rumbo 313, k 1,5. Contiene arc_triomf, palau_nacional, peix, park_guell, sant_jaume, santa_maria_mar,
    disseny_hub y bellesguard.
  - `rev50.jpg`: rumbo 50, k 1,6, a las 16 h y a las 22 h. Contiene casa_batllo, hotel_w, torres_caixa, sant_pau y
    torre_collserola.
- Dudas de INT que he descartado al mirar desde otro rumbo:
  - **Arc de Triomf:** desde 313 se ve bien el arco de medio punto. Desde 210 y 30 se ve de canto, que es lo que
    corresponde por su orientación.
  - **Peix:** desde 313 es un pez dorado claro. Desde 210 se ve de canto.
  - **Casa Batlló:** desde la fachada (50) se reconoce, también de noche.
  - **MNAC:** desde 313 se ve bien, con la escalinata.
  - **Parlament y Universitat:** se ven bien desde 30.
  - **Torre de Collserola:** se ve bien de cerca, también de noche.

## Lista para FIX (ordenada por importancia; los de nivel C, al final)
1. **park_guell (A, lote a).** Desde 210, 30 y 313 solo se ve una explanada verde llana con una mancha blanca. No se
   ven la plaza con el banco ondulado, ni los pabellones de la entrada, ni la escalinata del dragón. De noche está
   oscuro.
   - Arreglo: hacer bien visibles la plaza (terraza clara con el borde del banco de trencadís en colores), los dos
     pabellones con sus tejados-seta blancos y azules y la torrecilla, y la columnata. Añadir focos en el banco y en
     los pabellones.
2. **hotel_w (A, lote c).** La vela casi no se lee. Es un bloque gris con mosaico de ventanas «a cuadros» y techo
   inclinado. De noche, las ventanas salen a cuadros y sin coronación.
   - Arreglo: planta en vela (frente convexo hacia el mar y bordes afilados), vidrio azul reflectante uniforme sin
     rejilla de ventanas y coronación curva iluminada de noche.
3. **santa_maria_mar (A, lote d).** Desde 210, el ábside redondeado y la cubierta parecen una cúpula, y los dos
   campanarios apenas sobresalen. Desde 313 se lee mejor, pero los campanarios siguen bajos y oscuros.
   - Arreglo: quitar el aspecto de cúpula (cubierta casi plana de piedra y ábside poligonal más bajo) y que los
     campanarios octogonales sobresalgan 8–10 m por encima de la nave, del mismo tono claro.
4. **torre_collserola (A, lote e), luz de noche.** Desde lejos (hoja de noche, k 2,4) casi desaparece.
   - Arreglo: balizas rojas emisivas más grandes en la antena y en la cabeza, y un anillo de luz en las plataformas,
     para que de noche se lea desde toda la ciudad.
5. **torres_caixa (A, lote c).** Salen como bidones negros rechonchos con bandas horizontales. Cuesta verlos como
   torres de oficinas de 86 m. El lote c ya los dio por flojos.
   - Arreglo: prismas más esbeltos de vidrio oscuro con montantes verticales y la proporción alto/ancho de la torre
     real. Antes, conviene confirmar la planta con una referencia.
6. **sant_pau (A, lote a), de noche.** De día se reconoce desde 50 por los tejados de colores. Desde 210 y de noche,
   poco: falta el pabellón de administración con su torre como referencia.
   - Arreglo: destacar el pabellón de la Administració y su torre y añadirles focos de noche.
7. **palau_nacional (A, lote b), de noche.** Se lee de día, pero de noche queda apagado frente a la Font Màgica.
   - Arreglo: focos más fuertes en la fachada y la cúpula y, si cabe, los haces de luz detrás.
8. **sant_jaume (B, lote d).** No se reconoce desde ningún rumbo. La plaza no se lee como espacio abierto y las dos
   fachadas se confunden con el Gòtic.
   - Arreglo: dejar la plaza libre y pavimentada en claro, dar a las fachadas una piedra más clara y algo más de alto,
     con el frontón y las columnas de la Generalitat bien marcados, y añadir mástiles con banderas.
9. **bellesguard (B, lote a).** Es una caja gris oscura sobre una explanada lisa verde-grisácea que parece un estanque.
   - Arreglo: piedra pizarrosa más cálida, la torre con la aguja y la cruz más alta y esbelta, y jardín o arbolado
     alrededor. Revisar el suelo bajo el hito.
10. **disseny_hub (B, lote c).** Es una caja negra sin el voladizo («grapadora»).
    - Arreglo: levantar el volumen principal con un gran voladizo hacia Glòries sobre una base enterrada en talud, de
      zinc gris oscuro.
11. **cap_barcelona (B, lote d).** Queda tapado por árboles.
    - Arreglo: despejar los árboles en un radio de unos 10 m y comprobar la posición en la plaza.
12. **fundacio_tapies (C, lote a).** El ladrillo rojo no se ve: el edificio bajo la nube parece beis.
    - Arreglo: comprobar que el retoque de color se aplica a la fachada visible.
13. **casa_calvet (C, lote a).** No se distingue, y sobre la azotea vecina hay un volumen gris que confunde.
    - Arreglo, menor: remates algo más grandes y con contraste.
14. **Encuadre de BCN.lm.view.** No es un fallo de los modelos: las fichas de nivel C sin alto (palau_blaugrana,
    picornell, piscina_montjuic, estel_ferit) salen con la cámara pegada.
    - Arreglo: distancia mínima en `view` (unos 60 m) y usar el ancho y el largo cuando falte el alto.
