# CC_F2R2 · Repaso de la Fase 2 (vuelta 2)

Estado: hecho (ver «No resuelto»). Capturas en el scratchpad cc/f2r2/: «antes» = las del crítico (cc/f2_verif1/v_*.jpg, cmp4/cmp5);
«después» = d_* (primera tanda), e_* (segunda), f_* y g_* (tercera y cuarta, con los últimos cambios). Hojas antes|después:
m1.jpg (noucentista y Eixample temprano), m2.jpg (fábrica), m3.jpg (barroco y casas baratas), m4.jpg (portal de noche),
m5.jpg (segunda tanda).

## Arreglos (de más a menos graves)
1. Racionalista v2 / chaflanes (alta). La causa no era chaflanV: esChaflan casi nunca reconocía el chaflán porque en los datos
   los tramos vecinos salen cortos o partidos (BCN.fx.chafStat, herramienta nueva: 24 tramos de chaflán entre 1093 tramos de
   calle de 5–24 m alrededor de dron_bajo). esChaflan ahora pide ~45° con los dos vecinos, vecinos de más de 2,5 m, tramo de
   8 m o más y algún vecino de calle (antes además los dos vecinos perpendiculares entre sí y de más de 6 m). spotAt admite un
   8.º argumento `chf` para encuadrar el tramo de chaflán (delante está el cruce: hasta 70 m libres, cámara a 26 m como mucho).
2. Variantes que no se distinguían (alta):
   - Noucentista v1: sin balcones en los pisos (ventanas altas recercadas), balcones solo en el principal; pilastras gigantes
     de 0,76 m × 0,32 m más oscuras que el estuco. Ahora se distingue de v0 (m1.jpg).
   - Eixample temprano v1: balcones solo en el principal, ventanas de la 2.ª planta arriba, eje central (1 o 2 vanos) con
     balcón y frontón (triangular / curvo alterno) en todas las plantas y pilastras a los lados; planta baja almohadillada con
     junta vertical y arco. Se distingue de v0 (m5.jpg abajo).
   - Fábrica v0: ventanal en arco de medio punto de verdad: el hueco recto baja lo necesario para que quepa el arco entero,
     acristalado en abanico con su rosca de ladrillo. v0 y v1 ya no se parecen (m2.jpg).
3. Portal de noche (alta): la puerta de madera del portal lleva media hoja acristalada con reja (hasta 1,5 m) delante del zaguán
   iluminado; aplique en el 93 % de los portales (antes 70 %) y también en los portales de vidrio (80 %). Fuera el vidrio oscuro
   que pb_temprano y pb_obrera ponían delante del zaguán. n_eixacera_23 vuelve a tener aplique (m4.jpg). Registro P 344.
4. Casas baratas (alta / media): fuera la cenefa parda escalonada y los respiraderos que flotaban; alero de teja bajo (a 2,6 m
   de la acera de cada casita, 0,6 m de vuelo) y faldón de teja hasta el tejado, escalonado casa a casa; el tejado arranca en el
   borde del muro. Zócalos con tonos menos pardos.
5. Parcelas pintadas (media): colPar alterna parcelas claras y oscuras (×0,8 / ×1,06) y la medianera sube 1,25 m por encima de la
   cornisa con su albardilla (corta la cornisa en cada parcela): barroco, casa obrera v0/v2, gótico v1.
6. Sombra del Gòtic (media): lighting.js P.shOrnNear = 0,5: en la cascada cercana, la capa ORNAMENTO (cables, tendederos,
   bajantes, rejas) solo proyecta si su celda está a menos de 0,5 × semilado (~22 m a pie; antes 63 m, como la base).

## No resuelto
- Polígono v3 (galerías que sobresalen): no lo he podido diagnosticar sin más capturas; la losa ya va de a a b del tramo.
- Pueblo, olímpico, quart: sin cambios en esta vuelta (las vistas ya estaban corregidas en F2R).
- Barroco: las parcelas siguen siendo de tonos parecidos (la paleta del estilo es de ocres); se leen por bajantes y pilares.
