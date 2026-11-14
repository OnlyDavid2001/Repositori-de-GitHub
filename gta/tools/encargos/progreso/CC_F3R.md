# CC_F3R · Repaso de la Fase 3 (vuelta 1)

Rama `wt-cc-f3` (worktree /home/user/wt/cc-f3). Capturas en scratchpad/cc/f3r/ (r1–r3; logs r*.log, gen1/gen2.log).

## Hecho (de más a menos grave)
- [x] Fusión de origin/wt-cc (F2R), f395920: tramo() de F3b + chaflán de F2R (run.chaflan sin depender de V.chaflanV, solo en
      la zona de chaflanes); run.com de la regla 8 manda sobre el comercio de los estilos comerciales; parcelas pintadas de F2R
      (V.par) solo si el edificio no tiene parcelas del fichero.
- [x] Regla 1 (alta, Carmel/Horta/Torre Baró/Pedralbes/Sarrià/Sant Andreu/Montbau): λ 0,02–50 y dos vueltas con el reparto
      asignado. % de edificios con otro estilo que fachadas_pct, media de 73 barrios: 14,9 → 3,3; barrios > 20: 16 → 0.
      Valores finales (gen2.log): Carmel 28,5 → 5,8 (desarrollismo 10,9 → 32,3 %, objetivo 38,1); Torre Baró 39 → 4,5;
      Horta 33,1 → 1,2 (pueblo a menos de 0,7 pp de 17,3); Pedralbes 26,6 → 1,3; Sarrià 22,3 → 1,3; Sant Andreu 21 → 0,4;
      Montbau 12,7 → 3,6 (pueblo 12,8 → 4,3 %, objetivo 2,1); Sagrada Família 8,4 → 1,9; Vila de Gràcia → 0,9;
      Barceloneta 8,2 (quart de casa 55,1/61,3: no cambia, lo limitan las rachas y las alturas).
- [x] Regla 10 (alta): esChaflan acepta el chaflán compartido por dos fincas. Edificios con chaflán en el Eixample 439 → 986
      (Sant Martí 548); tramos de chaflán en la zona de chaflanes (pbStat) 2 335. Variante de chaflán solo con chfZ.
- [x] Transición lejos-cerca de las parcelas (alta): el volumen lejano parte los lados largos en parcelas con su color
      (r1_montaje.jpg: la Barceloneta a 420 m ya muestra franjas de colores).
- [x] Regla 5: áticos ≥ 4 plantas burgues_60_70 13,7 → 30,3 %; remontes en Barcelona 5 232 → 14 105 (esperados 14 428).
- [x] Regla 2: repetición medida normal 0,447 · Eixample 0,639 · tras polígono/casas baratas 0,74 (antes 0,632).
- [x] condal_edif.json regenerado con el código actual; DESARROLLO §17.x dice cuándo regenerarlo.
- [x] Regla 6: medianeras 108 837 tramos / 874 km → 50 128 / 398 km (solo laterales cerca de la calle; en patio, vecino ≥ 7 m).
- [x] Regla 8: tienda pequeña en casas bajas con ≥ 15 locales/ha: banda ≥ 15 79,6 → 88,7 % de todos los tramos; Vila de
      Gràcia 73 → 82,6 %.
- [x] Restaurantes: 7 rótulos con nombre inventado (celdas 25–31). F8: misma numeración de variante. Sant Pau: núcleo Rv 90 m
      (edificios excluidos 150 → 239).
- [x] Capturas pendientes de F3: Barceloneta a pie de día y a las 23:00, Carmel y Montbau a las 23:00, Montbau a pie, Gràcia a pie.

## No resuelto
- Gòtic a pie sin piedra gótica: las variantes de gotico son de 2–4 plantas (kit, fuera de mi alcance) y caen en los volúmenes
  bajos; no he cambiado el peso por anchura de calle.
- Ladrillo rojo del desarrollismo desde el aire en Gràcia/Dreta: paleta del kit (estilos_b1.js, prohibido).
- Murales de planos, regla 3 de la parcela final, regla 7 (tono como inclinación cálida/fría y desgaste), filtro de negocios
  repetidos, mezcla 0,7 con encogimiento: sin tocar (bajas).
- Remontes: el fichero ya cumple, pero solo las piezas que leen V.remonte (quart de casa) los dibujan.
