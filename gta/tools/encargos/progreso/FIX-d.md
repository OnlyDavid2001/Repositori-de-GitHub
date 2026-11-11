# FIX-d — arreglos de los lotes d y e

Rama `wt-hitos-d`; fusionada `wt-hitos` al empezar. Solo se tocan `landmarks_d.js` y `landmarks_e.js`.

## Hecho
- **arc_triomf**: vano de 12,6 m (antes 10,5) con la clave a 21,4 m, rosca y friso subidos, pilastras de esquina más
  finas y sin el hueco de 1 m bajo los templetes. Desde 210° (casi de canto, el paso va a 133°) sigue pareciendo
  estrecho: es la geometría real; desde 100° o 313° se lee el arco.
- **boqueria**: portada nueva hacia la Rambla (+Z): arco de forja verde de 24 m de luz y 22 m de alto sobre dos pilares
  con bolas, tímpano en abanico de nueve vidrieras de colores (emisivas de noche), montantes, rótulo liso sin texto y el
  hueco oscuro de la entrada con barrotes. Noche: «focos».
- **santa_maria_mar**: cabecera poligonal (no redondeada), nave central recta con cubierta de losas casi plana (0,6 m de
  flecha), ábside central más bajo; campanarios del mismo tono claro con huecos, rematados a 45 m (≈10 m sobre la nave).
- **sant_jaume**: losa clara de piedra que llena la plaza entre las dos fachadas; fachadas más claras, más altas
  (23 y 22 m) y con fondo de 7 m; pórtico de la Generalitat con columnas más gruesas, dos entablamentos y frontón con
  tímpano; pórtico de la Casa de la Ciutat; tres mástiles con bandera (amarilla con barras rojas) en cada fachada.
- **cap_barcelona**: los plátanos del Passeig de Colom (streets.js; no se pueden despejar desde los lotes) lo tapaban.
  Probado 40 m hacia el mar: caía dentro de un edificio de los datos (82731). Queda 7 m hacia el mar desde la posición
  anterior, entre la fila de árboles y la calzada de la Ronda: ya se ve desde el mar (135°) y entre los árboles (300°),
  pero sigue pegado a las copas. Arreglo de fondo pendiente: que streets.js no plante árboles a < 10 m de un hito.
- **torre_collserola**: balizas rojas emisivas mucho mayores (2–2,6 m) en la antena y cuatro en la corona, y tres anillos
  de luz cálida en el borde de las plataformas (1.ª, mirador y última).
- **columnas blancas junto al Sagrat Cor**: eran antenas de la cumbre (edificios 176533–176544 de los datos, plantas de
  2–46 m² y hasta 103 m) dibujadas como prismas blancos macizos. Ahora las oculta `tibidabo_parc` y las rehace como
  mástiles metálicos grises finos con plataformas y punta roja.
- **pont_bac_de_roda**: arcos más largos (62 m), más altos (23 m) y bastante más gruesos, con riostras entre el arco
  vertical y el inclinado y estribos mayores.
- **monestir_pedralbes**: nave de la iglesia más alta y clara, campanario de 41 m con cuerpo de campanas, y claustro
  (patio verde con galería de tres pisos) — la posición del claustro es aproximada.
- **estacio_sants**: marquesina de la plaza mayor y más clara (poco cambio).

## Comprobado
- Hojas (480x300): rumbos 210, 100, 40, 59, 135/300 de día y 120 de noche; sin errores de consola; `node --check` y
  `node tools/hitos/tris.js d e` bien (44 hitos, ~31 k triángulos los dos lotes).

## Flojo / pendiente
- Arc de Triomf desde 210°–230° (de canto) sigue leyéndose como un bloque: la vista de la revisión mira casi a lo largo
  de su anchura; desde 100° o 313° se lee el arco.
- Boqueria: la portada se ve bien desde la Rambla, pero desde arriba y lejos domina la nave verde; las vidrieras de día
  quedan algo apagadas (el tipo emisivo oscurece el albedo).
- Sant Jaume: la plaza ya se lee como hueco claro; las fachadas siguen siendo cajas con pórtico (sin el detalle gótico de
  la Casa de la Ciutat al carrer de la Ciutat).
- Collserola de noche: se ve la torre y sus anillos a k 2,4; desde la otra punta de la ciudad, las balizas son puntos
  pequeños (no comprobado a más de ~1 km).
- Sants y Pedralbes: retoques pequeños; el claustro de Pedralbes va en posición aproximada y casi no se distingue.
