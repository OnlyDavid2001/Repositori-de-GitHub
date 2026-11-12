# AE3 · Aeropuerto: repaso con las notas del revisor

## Estado por nota
1. **T1 y T2 desde el aire** — hecho. Procesador central de la T1 (franja de 170 m detrás de la fachada de llegadas,
   recortada de la planta de OSM con semiplanos: `procT1`) sube a 27,6 m con muro cortina más oscuro, cubierta blanca
   ondulada (crestas cada 42 m) con alero de 3 m y un lucernario corrido de vidrio en cada cresta; los diques se quedan a
   15 m con cubierta plana gris. T2: franja de lado tierra de 75 m (`procT2`) a 20,5 m con alero blanco y lucernarios en
   diente de sierra; los diques, con cubierta gris.
2. **Césped del campo de vuelo** — hecho. `data/aero_cesped.json` (filas de celdas de 6 m en el marco de las pistas, de
   lo no gris del mapa del suelo dentro del recinto, lejos de pistas, rodaje, plataformas y terminales). Va en la malla
   de marcas (tipo 128 del color): tonos por manchas, manchas secas, franjas de siega de 7 m (paralelas a las pistas en
   la franja de pista y en diagonal fuera), franja de pista más clara a < 75 m del borde, margen ralo junto al pavimento;
   de noche se oscurece como el suelo (`uNight`). Sin árboles (como antes).
3. **Bordillos de la T1 a pie** — hecho (llegadas y salidas, día y noche). Acera gris de baldosa con bordillo de granito,
   carril de parada, carril de taxis (líneas y cebreado amarillos, «TAXI» pintado), pasos de cebra, isleta con pilares
   de hormigón (junta de encofrado y capitel), tablero con vigas y cara inferior propia (antes no tenía y se veía la cara
   de arriba moteada), vestíbulos de vidrio con dintel, jambas y puerta, marquesina con cara inferior, calzada del
   viaducto con carriles y cebras. Ficha aparte `aero_t1_menudo`: coches de perfil y taxis negros con puertas amarillas
   y luz verde, gente (cola de taxis, salidas), bancos, papeleras, carros portaequipajes. Rótulos genéricos en catalán
   («Arribades», «Sortides», «Parada de taxis», «Arribades · Sortides», «TAXI» en el suelo) en una malla con atlas propio
   (`rotulos()`), retroiluminados de noche. Vista nueva `t1_salidas` sobre el viaducto.
4. **Volúmenes genéricos al sur y al este de la T1** — hecho de forma genérica: ficha `aero_edificis` recoge los
   volúmenes del registro en x 3550–4950, z 2150–3560 que no son de ninguna otra ficha ni de la T1 y los rehace por
   planta y altura: nave de chapa (> 1 500 m² y < 18 m), oficinas de vidrio (≥ 14 m o > 400 m²), caseta técnica, o
   marquesina de aparcamiento si el volumen está elevado.
5. **Noche** — proyectores de plataforma más pequeños (radio 1,3 → 0,8; ganancia 2,4 → 1,1), charcos de plataforma
   75 m/150 → 58 m/62 y de aparcamiento 30 m/105 → 24 m/48; luces rojas de eje y de fin de pista a 0,55–0,6 de ganancia;
   baliza de las torres más baja. El tinte rojizo del norte de la 02/20 desaparece.
6. **Coste** — niveles de detalle (`addLODLevel(d, null)` al acabar los hitos): `aero_t1_menudo` 700 m, vehículos de
   pista `aero_veh_*` (por celdas de 450 m) 800 m, aparcamientos 850 m, coches del P1 `aero_p1_coches` 850 m, torres de
   focos `aero_focos_*` (por celdas) 900 m, rótulos 700 m. Medidas en el informe.
7. Terminal de carga, combustible y hangares: no hecho (sin margen).
