# CC_F2R · Repaso de la Fase 2 (vuelta 1)

Estado: hecho. Capturas «después» en el scratchpad cc/f2r/ (r_* primera tanda, s_* segunda tanda con los últimos cambios; hojas m_regr.jpg, m_obrera_temprano.jpg, m_b.jpg, m_c.jpg, m_d.jpg). Los «antes» son las capturas de los críticos
(cc/f2_critico/c_*.jpg, cc/f2_critico_regr/cc_*.jpg y base_*.jpg, cc/f2m/*).

## Arreglos (de más a menos graves)
1. Selector provisional (kit.js `nucleo`, palette.js pasa la familia): en Eixample, Ciutat Vella, Raval, Barceloneta y Gràcia los
   estilos propios del barrio suman al menos el 80/85/80/80/60 % del peso. Arregla la pérdida de identidad de dron_bajo,
   sagrada_pie, cat_pie y de Ciutat Vella (fachadas contemporáneas sueltas).
2. Portal (interiors.js + P.puerta): `env.pbPortal` marca el vano del portal; la puerta de madera de las piezas pb lleva montante
   acristalado con reja, zaguán iluminado (roomQuad modo 0) y aplique; las de vidrio y madera anotan 'P' en el registro.
3. Comercio: los estilos con V.com ≥ 0,5 conservan todo el comercio de antes (shopsHere); solo los poco comerciales lo sortean.
4. run.chaflan ya no depende de chaflanV: el mirador y la torre del racionalista v2 y la torreta del modernista v3 salen en el chaflán.
5. Variantes distintas de verdad: casa obrera (parcelas de 2 balcones / principal corrido y cornisa de ménsulas / parcelas de 3
   vanos estrechos con ventanas alternas / corrido solo en principal y chaflán), Eixample temprano (v1 pilastras + balaustrada;
   v2 sobria de ventanas alternas), noucentista (v0 frontones en todas las plantas; v1 pilastras gigantes de 0,2 m en tono
   piedra con bandas y vano de 4 m sin balcón corrido; v3 sobria de ventanas alternas), fábrica (v0 arco de medio punto, v1
   ventanal ancho con dintel de acero y montantes, v2 ventana con reja, v3 loft).
6. Parcelas virtuales pintadas (núcleo: V.par, KIT.colPar, bajante en cada medianera): barroco (2 vanos), casa obrera v0/v2,
   gótico v1.
7. Esquinas: barroco v3 (hornacina), quart v3 y casas baratas v3 (bar) usan q.esquina (y el último vano del portal si no hay esquina).
8. Casas baratas: faldón de teja con alero corrido justo encima de la planta baja; tapa el muro sobrante.
9. Escaparate: hMin/hMax en pueblo, barroco, gótico y quart; autarquía k=1, olímpico k=2, racionalista k=1.
10. Desarrollismo v2: franja de gresite a 4,5 cm; polígono v3: testeros que cierran las galerías; fábrica: rótulo borrado sin
    pseudoletras; lejos.muro 'madera' (vivienda social v2).
11. Ventanas abiertas: el 38 % de las ventanas que las piezas «vano» dibujan con env.windowHole quedan abiertas (sin visillo) y se
    anotan como 'W' (T.vano no cuenta dos veces: vanoDef ya decide las suyas).
12. Autoconstrucción: parcelas de 2 vanos pintadas, con material propio (algunas de ladrillo visto o bloque) y cada casita a su
    altura (v0: saltos de hasta 2,7 m con ventanuco en el remonte).
13. Tribuna de piedra en el eje del chaflán (V.tribChf): Eixample temprano v0, noucentista v0, neoclásico.
14. Núcleo de identidad subido a 0,9 en Eixample y Ciutat Vella (con 0,8, el edificio de dron_bajo seguía saliendo de desarrollismo).

## Comprobado con capturas (antes = las de los críticos)
- dron_bajo, sagrada_pie, cat_pie, n_eixacera_23, n_ramblapie_23, gotic_tienda: vuelven a ser Eixample / Ciutat Vella como en base;
  el portal con aplique y zaguán vuelve en n_eixacera_23. Registro en dron_bajo: P 4 → 349, T 264 → 382, W 3919 → 5808
  (base 359 / 363 / 6308). fx.trisHi en las celdas de dron_bajo: 444 079 → 536 214 (base 636 481).
- Casa obrera v0–v3: ahora distintas (parcelas pintadas, principal corrido, parcelas estrechas con ventanas, corrido solo en principal).
- Noucentista: v0 con frontones en todas las plantas y v3 sobria, distintas; v1 (pilastras) sigue pareciéndose a v0 a esa distancia.
- Eixample temprano: v2 distinta (ventanas alternas); v1 solo cambia porticones y pilastras finas: sigue cerca de v0.
- Fábrica: v2 con rejas y v1 con ventanal ancho se distinguen; el arco de medio punto de v0 apenas se ve en la fábrica de pisos.
- Barroco: parcelas pintadas con bajantes; casas baratas: faldón de teja sobre la planta baja (queda una franja de muro de ~1 m);
  autarquía (k=1) y olímpico (k=2) ya se ven; autoconstrucción v0 escalonada y de varios materiales.

## No resuelto
- Desarrollismo v2: los triángulos de ladrillo en la franja de gresite no son de profundidad (siguen a 4,5 cm y con otro
  material): falta encontrar la causa (posible quad del muro del antepecho de ventanaPVC).
- Racionalista v2: el escaparate no cae en un chaflán; el mirador no se ha podido ver en captura.
- Pueblo, gótico, quart: vistas corregidas en vistas_estilos.json pero no recapturadas.
- Ventana de pieza con habitación de noche detrás de las galerías del polígono v3; rótulo BAR invertido (Fase 4).
- Medida de tiempo de construcción en máquina tranquila (Fase 6).

## Rendimiento (fps_eval.js, calidad media, 960×540, vistas de la Fase 0; scratchpad cc/f2r/log_fps.txt)
| vista | Fase 0 | F2m | F2R | sombra [0] Fase 0 → F2m → F2R |
|---|---|---|---|---|
| Eixample a pie | 5,2 M / 866 | 5 151 047 / 866 | 5 245 010 / 866 | 1 188 779 → 1 050 544 → 1 175 669 |
| Gòtic a pie | 6,40 M / 649 | 6 568 524 / 647 | 6 706 094 / 647 | 1 335 650 → 1 511 946 → 1 625 928 |
| aérea | 1,3 M / 304 | 1 315 294 / 304 | 1 315 294 / 304 | — |
Llamadas iguales. El Eixample recupera el detalle perdido (vuelve a la cifra de la Fase 0). En el Gòtic, +4,8 % de triángulos y
+22 % en la sombra sobre la Fase 0: ahora casi todo es casa obrera, barroco y gótico (núcleo 0,9), con más detalle fino
(cables, tendederos, bajantes de parcela). Pendiente para la Fase 6: sacar ese detalle fino de la pasada de sombras.
