# FX3 · Fachadas: tercera pasada (vidrio, terrazas, forjados, galerías, casas bajas y hoja por calles típicas)

Rama `wt-n2-fx`. Encargo: `tools/encargos/n2/FX.md` + el de FX3 (barandillas de vidrio, terrazas corridas, forjados,
galerías, casas bajas/patios/pendientes, hoja final por calle típica). Sigue a FX1 y FX2.

## Hecho
- Fusionada `wt-n2-az` (PALETA/azoteas) sin conflictos: `facades.js` conserva la línea de `d.col` de PALETA
  (`BCN_PAL.wall(b)`).
- **Barandilla de vidrio** (`rail` 'vidrio' y ático 'vidrio'): tipo nuevo `K.FXVIDRIO` (id 101, en `fachadas_estilos.js`).
  No hay transparencia en el material de detalle, así que el panel pinta lo que hay DETRÁS siguiendo el rayo de la vista
  hasta el muro (muro en sombra, balconera con su marco, suelo del balcón) y encima el reflejo del cielo con Fresnel,
  algo oscuro y azulado. Datos por vértice: aux.x/y = u/v del panel, aux.z = distancia al muro y medio ancho del hueco;
  color de vértice = color del muro. Perfil metálico claro arriba y abajo y pinzas finas cada ~1,25 m (ORNAMENTO).
  Altura total ~1,0 m.
- **Terrazas corridas con peto de obra** (eix_60, sg_terrasses, lc_terrasses, hg_terrassa, nb_terrassa, per_terrassa,
  sar_pedra): peto de 0,45 m y 9 cm con albardilla fina y barandilla calada (lattice K.IRON, un quad) hasta ~1 m;
  losa de 16 cm; balconeras más anchas (×1,3) y altas (hasta 2,5 m) detrás; a veces (22 %) una segunda maceta al fondo
  (las macetas cuestan ~250 triángulos: subir más su probabilidad disparaba la capa ORNAMENTO).
- **Forjados de balcón**: 14 cm (antes 18) y cara inferior oscura (`env.losaV`: piedra a la sombra, gris o verde oscuro,
  por edificio, 5.º número del ámbito (b, 6, 1)); ménsulas más pequeñas y oscuras.
- **Galerías**: carpintería de aluminio claro o lacado (`env.galM`, por edificio), travesaño, vierteaguas, persianas
  enrollables a distintas alturas en ~55 % de las hojas (`env.galP`), alguna maceta (10 %); cara inferior oscura.
- **Alero** (casas bajas): canto de teja calado sobre tablero pintado o de madera, canecillos.
- `BCN.fx.calle(x, z, side, dir, giro)` → vista a pie a lo largo de la calle más cercana (en la acera, mirando
  a lo largo y algo hacia la acera de enfrente).

## Cómo se prueba
Scratchpad `n2/fx3/`: `var.json` (10 variantes con los problemas: `force` + `spot`, `"fx": 0.55`), `calles.json` /
`calles2.json` (una calle típica por familia: lat/lon pasadas a x, z con el ajuste lineal de `scratchpad/ll.json`, sacado de
las fichas de hitos, error medio ~20 m; luego `BCN.fx.calle`), `noche.json` (23:00).
`run2.sh <prefijo> <json…>` (DRAW=1100, 640×360). Con la máquina cargada cada vista de calle tarda 2–4 min.

## Medidas (mismas 10 vistas `var.json`, `detailStats().fx`, ANTES = rama tras la fusión, sin FX3)
| | BASE | ORNAMENTO |
|---|---|---|
| suma de las 10 vistas | 3 633 998 → 3 836 578 (+5,6 %) | 3 411 990 → 3 801 866 (+11 %) |
| sant_gervasi_2 (vidrio) | 347 624 → 397 262 | 452 629 → 596 181 |
| nou_barris_2 (galerías) | 432 186 → 495 344 | 133 220 → 189 516 |
| gracia_0 (forja) | 897 728 → 897 728 | 783 815 → 768 703 |
Sube algo (perfiles y pinzas del vidrio, barandilla calada, vierteaguas y persianas de galería, alguna maceta), pero sigue
muy por debajo de la fachada antigua (FX1/FX2 habían bajado el ORNAMENTO un 31–52 %). Nada por fotograma.
Consola: sin errores ni avisos en todas las ejecuciones (antes, d1, d2, d3 calles/noche/var, d4).

## Capturas
`ANTES_DESPUES.jpg` (7 variantes con los problemas), `hoja_calles.jpg` (una calle típica por familia, 10:30),
`hoja_noche.jpg` (23:00), `hoja_d3_var.jpg`.

## Pendiente / flojo
- El vidrio se lee como vidrio con lo de detrás, pero visto desde muy abajo el reflejo del cielo aún lo tiñe de azul gris
  (banda continua en terrazas corridas largas).
- Las galerías siguen con el vidrio oscuro del núcleo (K.GLASS); lo que cambia es la carpintería, las persianas y el canto.
- El color del ladrillo y del gresite es el de PALETA (d.col); FX no lo varía.
- Calles en pendiente y patios de luces: sin cambios de geometría (la vista del Carmel no mostró nada roto, pero tampoco se
  revisaron a fondo); el alero nuevo apenas sale en las vistas.
- Las vistas `calle()` no saben de árboles: en el Eixample, les Corts y Nou Barris (Prosperitat cae en una plaza) queda
  arbolado delante; desde la acera manda la planta baja comercial y los pisos se ven en escorzo.
- Gòtic, Raval y Barceloneta, vistos a pie en calle estrecha, se parecen bastante entre sí (balcón de forja saltado sobre
  bajo comercial): el carácter propio (revoco gastado, ropa, cadeneta) se nota poco a esa distancia.
- Vistas descartadas: carrer del Bisbe (junto a hitos, que `coverAt` no conoce: la cámara quedaba dentro), Plaça de Sants.
