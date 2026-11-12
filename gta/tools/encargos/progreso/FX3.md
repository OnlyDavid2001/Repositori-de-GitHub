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
Scratchpad `n2/fx3/`: `var.json` (variantes con los problemas, `force` + `spot`), `calles.json` (una calle típica por
familia, coordenadas de lat/lon con el ajuste de `scratchpad/ll.json`), `noche.json` (23:00). `run.sh <prefijo> <json…>`.

## Pendiente
(se actualiza al final)
