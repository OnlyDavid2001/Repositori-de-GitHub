# FIX2 · Noche 2, arreglos finales — progreso

Worktree `/home/user/wt/n2-int`, rama `wt-n2-int` (después de INT y REV). Capturas y hojas en el scratchpad `n2/fix2/`.

## Hecho
1. **Textura de cubiertas que no se veía** (FS_BLD, app.js). Causa encontrada con un modo de depuración que pintaba
   `fract(q)` y la textura a saco (`n2/fix2/t/dbg_roof_eix.jpg`): el eje `vAx` (uv2) llega bien y `q` corre en metros
   alineado con los muros; no era precisión. El problema era la medida del píxel: `length(fwidth(q))` suma |dx|+|dy| de los
   dos ejes y exagera el tamaño del píxel ×1,4–2, y con él la rasilla, los rodales de 1 m y casi todo lo demás se apagaban
   ya a 60–100 m, que es justo la distancia de roof_eix (a 640×360 el píxel ronda 0,3–0,5 m). Arreglo: píxel = el eje más
   estirado (`max(length(dFdx q), length(dFdy q))`), rodales algo más marcados y dos escalas nuevas que aguantan a 100–200 m:
   paños relosados de 3,7×3,1 m (más claros o más oscuros) y cercos de humedad de 6–10 m. Todo de media cero y apagado con
   el píxel: de lejos queda el color de la tabla de palette.js.
2. **Franjas de luz nocturnas desde el aire** (d600_23, aereo_eixample_23). Eran el baño de acera de FS_WALK (streets.js) y,
   sobre todo, los charcos de farola multiplicativos de furniture.js (FS_POOL) sobre el granito claro. Los dos se atenúan
   con la altura de la cámara sobre el suelo (`uCam.y − vPos.y`): sin cambio por debajo de 25 m, al 40 % por encima de
   140 m. A pie de calle (1,75 m) no cambia nada.
3. **Suelo quemado** en c_nou_barris. Con una ejecución que apagaba materiales uno a uno (`n2/fix2/t/nb4.jpg`) se ve que
   no es el pavimento de streets.js sino el terreno (ortofoto, FS_TER). La rodilla de REV (−22 % como mucho) se cambia por
   una compresión de día de todo lo que pasa de 0,40 (pendiente 0,35: 0,70 → 0,51, 0,85 → 0,56), igual a cualquier
   distancia, sin tocar la arena, los campos del delta ni la noche. (De paso, el granito de plazas de streets.js baja de
   ×1,75 a ×1,5 con rodilla en los tonos altos.)
4. **Verde lima** de lledoner y tipuana: ganancia y saturación de hoja (`leaf` en trees.js) más bajas, en la gama del
   plátano: lledoner [0,80 0,84 0,84 sat 0,55], tipuana [0,94 0,90 0,80 sat 0,62].
5. **Hoja de fachadas por barrio**: `BCN.fx.spotFull(familia, k, pitch)` (facades.js, depuración) busca, entre los
   edificios de la familia con una variante de la propia familia, un tramo de calle desde cuya acera de enfrente (a 1,75 m,
   mirando 15–24° hacia arriba) se ve de la primera planta a la cornisa, con el suelo a la misma cota. La hoja oculta los
   árboles de calle para que no tapen (en el juego siguen ahí).

## Resultado (capturas DESPUÉS en `n2/fix2/d/`, hojas en `n2/fix2/`)
- `hoja_fix2_dia_aire.jpg` (ANTES = REV): roof_eix ya enseña la baldosa y paños de distinto tono en las cubiertas planas
  cercanas; las lejanas quedan del color de la tabla. d600_23 y aereo_eixample_23: las franjas siguen ahí, pero más
  apagadas (no desaparecen: la rambla de granito con farolas sigue siendo lo más claro de la vista). c_nou_barris: el suelo
  pasa de blanco quemado a gris de hormigón; los lledoners ya no son lima.
- `hoja_fix2_noche.jpg`: roof_eix_23 y tres calles a pie a las 23:00 (gracia, ciutat_vella, eixample) sin cambios
  apreciables frente a INT/REV.
- `hoja_fachadas_barrios.jpg`: las 15 familias, una vista cada una, con calle (geocodificación inversa aproximada de las
  coordenadas del juego), barrio, variante, altura e inclinación. No se ve nada roto en las fachadas. Ciutat Vella, Raval y
  Gràcia son la 2.ª vista válida (la 1.ª caía bajo un porche o contra un pilar).
- Consola limpia en todas las ejecuciones; `node --check` pasa en todos los .js.
- Coste: solo cambios de sombreador (unas operaciones más por fragmento en cubiertas, terreno, acera y charcos); ni
  triángulos ni instancias nuevas.

## Flojo / pendiente
- Franjas nocturnas desde el aire: atenuadas, no resueltas. Si molestan, el siguiente paso es la copa (densidad de
  plátanos en esas ramblas) o el baño de calzada de FS_ROAD, que no he tocado.
- La textura de cubierta es sutil a 640×360; a 1080p se lee mejor (píxel 3× menor).
- La rodilla del terreno también oscurece algo, de día, las explanadas claras vistas desde el aire (igual a cualquier
  distancia, que es lo que pide la regla del color).
- Las vistas de la hoja de fachadas eligen calles anchas (~25 m) y edificios de ~20 m: en las familias de calle estrecha
  (Gràcia, Ciutat Vella, Raval, Barceloneta) son plazas o paseos, no la calle típica.

## Cómo se prueba
`n2/fix2/fix2.json` (roof_eix, d600_23, aereo_eixample_23, c_nou_barris, roof_eix_23 y tres calles a las 23:00) y
`n2/fix2/fac.json` (las 15 familias). ANTES = capturas de REV (`n2/rev/d/`) e INT (`n2/int/d/`).
