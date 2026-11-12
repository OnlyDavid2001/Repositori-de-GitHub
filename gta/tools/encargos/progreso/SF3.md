# SF3 · Noche, materiales y repaso (carril BASÍLICA)

Estado: **hecha en una primera pasada**, centrada en las tres referencias del usuario (prioridad: 3 la Glòria, 2 la cruz y la
noche, 1 los remates). Todo está en `gta/sagrada.js`.

## Hecho
- **Glòria según la maqueta** (`usuario_gloria_maqueta.png`), en lugar de la estimación de SF1–SF2:
  - `GLI` (también en `BCN_SF.gloria`): 20 linternas en forma de **gota o bulbo** en tres filas (delante 22→52 m, en medio
    25→60 m, detrás 29→70 m) y el **cono puntiagudo del eje** (27→82 m). `gota()`: perfil de revolución; en MED, dos coronas
    de huecos en rombo alargado (encendidos de noche) y punta dorada; en DET, 8 nervios.
  - **Bosque de columnas**: las 7 columnas de los dones suben a 20 m y se abren en ramas hacia las gotas de las filas 1 y 2;
    entre ellas, 6 troncos finos que se bifurcan a los 14 m. La cubierta del nártex queda solo detrás de las gotas.
  - **Dos torres cónicas laterales** (±34 m, 47,5 m) con celosía de rombos encendida y remate blanco con cruz.
  - **Piñones de las esquinas** (dos por lado) con el panal: hueco encendido en MED y celdas hexagonales en relieve en DET;
    pináculos laterales.
  - Zócalo bajo el bosque de columnas (z 39,3 → 46,7). Nubes al pie de las gotas delanteras y la letra dorada del Credo en
    cada gota (DET).
  - Las 4 torres de apóstoles de la Glòria llevan celosía de rombos (`apostol(…, oh)`).
- **Remates** (`usuario_torres_dia.jpg`): `huecos(…, { rombo: true })` dibuja la **retícula de rombos** (24 por vuelta en
  Jesucrist y la Mare de Déu, 16 en los evangelistas; en DET, jambas en las 4 aristas). Corona de rombos más finos bajo la
  cruz. Piedra de las torres **ocre dorada** (`TOR` mezclado con (214, 170, 112)) y naves algo más cálidas.
- **Noche** (`usuario_noche_cruz.jpg`):
  - **Cruz encendida**: franjas de vidrio `K.EMISIVO` (solo de noche) en las cuatro caras de cada brazo y del fuste.
  - **Haces de luz**: `haces()` crea una malla `sf_haces` de 24 triángulos (12 haces: 4 a lo largo de los brazos, 4 hacia
    arriba y 4 hacia abajo hacia los evangelistas) con material propio `mkMat(…, { blend: true })` en mezcla aditiva
    (1, 1, 0, 1) en HDR y alfa en LDR; se desvanecen a lo largo y a lo ancho, y solo con `uDusk` (×(1 − 0,35·uLate)).
    Nada por fotograma.
  - Huecos de las torres centrales, de la Glòria y de las gotas **encendidos desde dentro** (cálidos, `LUZ_T`, ganancia 1,5).
  - **Vidrieras**: todos los ventanales (`VENT`) pasan de paño oscuro a vidrio `K.EMISIVO` de noche: frías al este
    (Naixement), cálidas al oeste (Passió), claras y amarillas en la Glòria; de día, vidrio oscuro coloreado.
  - Luces puntuales cálidas al pie del remate de los evangelistas y frías al pie de cada pináculo de apóstol.

## Capturas (960×540) y coste
Carpeta `<scratchpad>/sf/sf3/`: `hoja_sf3.jpg` (ANTES/DESPUÉS, día y noche, dron y a pie), `postal_sf3.jpg` (6 vistas de
postal) y `ref_vs_sf3.jpg` (referencias del usuario frente a SF3). Vistas en `v.json` y `v2.json` (`mkv.js`).
Todas las capturas: **sin errores de consola**.

| Malla | SF2 | SF3 |
| --- | --- | --- |
| lejos (q 0) | 7 708 | 8 190 |
| media (q 1) | 30 926 | 40 296 |
| detalle (q 2) | 75 856 | 94 372 |
| dibujados a 370 m (`sf.tris`) | 30 926 | 40 416 |
| dibujados a < 350 m | 106 782 | 134 668 |
| hitos visibles (`lm.trisVis`) de cerca | 585 k | 613–614 k |
| haces de luz | — | 24 triángulos |
Carga 13–15 s (igual).

## Flojo (sincero)
- **cerca_gloria 23h**: el baño de focos del núcleo (`noche: 'focos'`) quema la fachada de cerca; los huecos encendidos de
  las gotas casi no se distinguen. Haría falta un modo de focos más suave por hito (núcleo).
- **remates**: la retícula es de rombos iguales; en la foto hay rombos y triángulos que se afinan por bandas. De noche la
  torre de Jesucrist es un cono uniformemente encendido; en el render se ven las aristas oscuras.
- **Haces**: algo más nítidos y largos que en el render, y son dos planos cruzados: vistos de canto se adelgazan.
- **Glòria**: las gotas son lisas (sin la textura perforada fina de la maqueta); las ramas son barras rectas; los piñones y
  las torres laterales están estimados por la foto (sin cotas).
- **Basamento con escalinata frontal**: no lo hago yo; delante de la Glòria pasa Mallorca (z 39,3 → 59,3) y una caja maciza
  la cortaba (lo probé: la cámara a pie quedaba dentro). Queda para ENTORNO (losa y escalinata sobre Mallorca).
- No he tocado los símbolos de los evangelistas (siguen siendo los de SF2), ni la cerámica con brillo, ni la luz fría azulada
  de las cubiertas de las naves (solo puntos fríos en los pináculos).
- `frente_gloria` de día en la hoja es de la primera pasada (`d1`), antes de afinar los rombos.

## Para SFR
Aristas oscuras en la torre de Jesucrist de noche, retícula por bandas, gotas perforadas, símbolos de los evangelistas más
finos, focos más suaves en la Glòria.

## Peticiones a otros carriles
- **ENTORNO**: el basamento ancho con escalinata de la maqueta debe salir de la losa sobre Mallorca y empezar en la línea de
  las columnas de la Glòria (z local ≈ 46,7; zócalo mío de 39,3 a 46,7, ancho 74 m, cota del suelo del templo + 0,6).
- **Núcleo**: un modo `focos` atenuado por hito (p. ej. ganancia en `uLmN`), para que la Glòria no se queme de cerca.

## Para DESARROLLO.md
- `sagrada.js` crea, además de las tres mallas de la basílica, `sf_haces` (malla aditiva de los haces de la cruz,
  `renderingGroupId` 1, `alwaysSelectAsActiveMesh`): ejemplo de material aditivo en HDR con `mkMat(…, { blend: true })` y
  `setAlphaBlendFunctionParameters(1, 1, 0, 1)` al enlazar, que escribe `vec4(toLin(c)·k, 0)` sin niebla.
- `BCN_SF.cruz` (centro de la cruz en coordenadas de la malla) y `BCN_SF.gloria` (linternas de la Glòria).
- `huecos(…, { rombo, luz })`: retícula de rombos, encendida de noche con `K.EMISIVO` solo de noche.
