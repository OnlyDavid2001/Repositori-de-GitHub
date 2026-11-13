# INT2 · Fusión final de la fase gráfica 1 (arreglos + fachadas)

Rama `wt-g1-int`. Capturas en `scratchpad/g1/int/final/` (`f_<vista>.jpg`, `run.log`, `run_final.py`; instantánea del
código en `scratchpad/g1/int/snap/final`).

## Estado: TERMINADA (fusiones, comprobación, 24 capturas DESPUÉS finales y hoja final; falta el jurado final)

## 1 · Fusiones (`--no-ff`)
- [x] wt-g1-fx-suelo → a5f4f65 (app.js cinta/faldón, RCOL[9], FS_ROAD; streets.js urbanSeg; plazas.js)
- [x] wt-g1-fx-edificios → b5fbe02 (app.js FS_BLD cubiertas; rooftops.js; landmarks_c/e.js)
- [x] wt-g1-fx-luzveg → 5187ced (app.js setHour/FS_SEA/FS_TER; trees.js; furniture.js; lighting.js)
Ninguna dio conflicto de texto: en `app.js` cada arreglo tocó trozos distintos. `node --check` de todos los .js: limpio.

## 2 · Fachadas (wt-g1-fach)
Ya estaba fusionada en f60c302 (G1F3 cerrada: progreso con hecho/no hecho/coste/peticiones, árbol limpio, rama subida en
f0669cd). La rama no tiene commits nuevos desde entonces (`wt-g1-int..wt-g1-fach` vacío): nada que fusionar.

## 3 · Comprobación
- `node --check` de todos los .js (raíz y `tools/`): limpio tras cada fusión.
- Carga: las 24 vistas cargan en 25–145 s por vista (máquina a carga 2–6), **cero errores y cero avisos de consola** en las 8
  tandas (`final/run.log`).
- `BCN_SUELOS.pre` = true en todas: el `allanado.bin.gz` sigue casando (ningún arreglo tocó `suelos.js`).

## 4 · Rendimiento (triángulos activos de la pasada principal, `act`; el tiempo de fotograma del arnés no es fiable aquí)
| vista | principal | INT1 alta | INT2 alta | árboles INT1 → INT2 |
|---|---|---|---|---|
| eix_calle | 3,05 M | 3,70 M | 3,72 M (+0,5 % sobre INT1; +22 % sobre la principal) | 634 k → 607 k |
| pg_pie | 2,88 M | 3,31 M | 3,58 M (+8 %) | 599 k → 574 k |
| coll_camino | 5,07 M | 5,27 M | 5,57 M (+6 %) | 46 k → 86 k (monte `nat` 443 k igual) |
| eix_dron | 4,80 M | 5,04 M | 5,27 M (+5 %) | 377 k → 367 k |
| eix_calle (media) | – | 3,38 M | 3,57 M (+6 %) | 475 k → 456 k |
- La subida desde INT1 viene sobre todo de las fachadas (f60c302: habitaciones, persianas, toldos; `fx.trisHi` 0,5–1,1 M a pie)
  y del faldón de las cintas en ladera (coll_camino). Los arreglos de árboles bajan los triángulos de árbol (plátano de
  470 hojas). Media sigue +17 % sobre la principal en la calle más arbolada: fluida en principio, no medido en un portátil.
- Mayor: azoteas 5,62 M, mar_atardecer 5,59 M, coll_camino 5,57 M.

## 5 · Capturas DESPUÉS finales (960×540) y hoja
- Instantánea del commit db7bddd (código = 5187ced) en `scratchpad/g1/int/snap/final`; 8 tandas de 3, ninguna caída: 24/24.
- Prefijo `scratchpad/g1/int/final/f` (`f_<vista>.jpg`).
- Hoja ANTES (principal, `banco/antes/a`) / DESPUÉS final: `scratchpad/g1/int/hoja_final.jpg`.
  Hoja INT1 → final (solo lo que cambiaron fachadas y arreglos): `scratchpad/g1/int/final/hoja_int1_vs_final.jpg`.

## Lo que se ve en la hoja (sincero)
- Mejor: sagrada_pie (la Sagrada Família vuelve a verse al fondo, calle con naranjos y sol); gracia_calle sin el rectángulo
  negro; coll_camino con la senda sobre un terraplén (ya no flota) y sin cinta crema; noche_dron y rambla_noche con cielo azul
  profundo; barceloneta_playa con arena tostada y palmeras de verdad; pcat_pie sin bandada; escaparates del Gòtic y de Gràcia
  oscuros con reflejo (fachadas); tibidabo_ctra con asfalto en vez de negro.
- Sigue mal: **gotic_calle** la losa gris que cruza la calle arriba (volumen `b15_16`, sin resolver); **pcat_pie** el objeto
  gris en el cielo (izquierda) y la estrella poco legible a pie; **eix_calle/eix_noche** el escaparate blanco «5,09» quemado,
  sobre todo de noche; **glories_dron** la mancha marrón de los Encants en primer plano; **montjuic_puerto** las naves del
  muelle como prismas gris oscuro sobre una explanada lisa (igual que en INT1); **eix_dron/coll_desde_ciudad** moiré y rejilla
  de ventanas lejanas; **mar_atardecer** mar más claro y rosado, sin olas nítidas; **eix_xamfra** plazoletas de tierra y paso
  de cebra partido.

## Defectos que quedan para fachadas (G1F; la rama está fusionada pero no trae arreglos de ellos)
1. (5) Escaparates como paneles gris/blancos lisos y quemados sin interior («5,09» deslumbra de noche) · gotic_calle derecha;
   eix_calle y eix_noche derecha · interior falso de interiors.js con fondo oscuro y reflejo del cielo; limitar albedo/emisión.
2. (4) Ventanas lejanas como rejilla de puntos con moiré · eix_dron, azoteas (fondo), coll_desde_ciudad · filtrar/mipmap la
   textura de ventanas lejanas, variar por edificio; luz rebotada en FS_BLD.
3. (4) Bajos de balcones como bandas negras; estuco liso sin manchas ni zócalo · pg_pie, eix_calle, gracia_calle, eix_dron ·
   luz rebotada del suelo en FS_BLD (manzanas lejanas) y en la fachada; manchas, zócalo y variación del estuco.
4. (3) Comercios repetidos (FORN DE PA en las dos aceras) y escaparates gigantes en blanco · gracia_calle, sagrada_pie,
   eix_calle, eix_noche, gotic_calle · azar por ámbito para no repetir el de enfrente; bajar la emisión del 5,09.
5. (3) Fachadas lejanas con damero pixelado y rejilla idéntica · azoteas, eix_dron, coll_desde_ciudad, espanya_dron · mipmaps,
   fundido a color medio con la distancia, módulos variados por edificio.
6. (3) Edificios como caja lisa con ventanitas, sin balcones ni bajos · diagonal_pie (rosa, derecha), poblenou_rambla (esquina
   derecha), tibidabo_ctra, coll_desde_ciudad · estilo de fachada de barrio con balcones, cornisa y bajos.
7. (2) Escaparates de vidrio blanco sin reflejo ni interior; mismo comercio enfrente · eix_calle/eix_noche, gotic_calle,
   gracia_calle · interior falso con profundidad y reflejo del cielo; azar por portal.

## Pendiente de los arreglos (de sus progresos FX_suelo, FX_edificios, FX_luzveg)
- Losa de gotic_calle (b15_16): hace falta un picking que diga la cara; patrón para ocultar en landmarks.js (chEdit(b).hide).
- Objeto gris en el cielo de pcat_pie (plazas.js); estrella de Catalunya a pie; plazoletas de tierra y paso de cebra partido
  en eix_xamfra; moiré de la arena; escalones del paseo en zigzag; marcas de la rotonda de Espanya.
- Muelles del Port Vell y naves de montjuic_puerto; patios de eix_dron; parpadeos de sagrat_cor, sf_gloria, hotel_arts,
  sant_jaume y pu_zf0; elipse verde de coll_camino.
- Ventanas de noche como ruido blanco frío (FS_BLD); corteza del plátano; calzada en sombra muy oscura; luces al atardecer.
- Jurado final (tres jurados con rubrica.md sobre `final/f_*`): no se ha corrido en esta etapa.

## DESARROLLO.md
- [x] §14.7 Fachadas (G1F) y §14.8 Arreglos de integración (FX), de las secciones «Para DESARROLLO.md».
