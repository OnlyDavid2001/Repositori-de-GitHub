# SF0 · Investigación de la Sagrada Família acabada (carril BASÍLICA)

Estado: **hecha** (solo datos; no se ha tocado código del juego). Resultado: `gta/data/sf_ref.json` (≈27 kB), con cada
dato marcado `verificado` (con su fuente) o `estimacion` (con nota de cómo se ha sacado).

## Marco y planta medidos (OSM + módulo de 7,5 m)
Ejes locales de la ficha (centro 12597,9; 15875,2; rot 136): +Z Glòria/Mallorca, −Z ábside/Provença, −X Naixement/Marina/
Pl. de Gaudí, +X Passió/Sardenya/Pl. de la Sagrada Família. Comprobado con OSM: la Pl. de Gaudí cae a x −185…−89 y la
Pl. de la Sagrada Família a x +84…+194 (convención correcta).
- Manzana de la basílica: x −69,3…+64,4, z −74,5…+39,3 (línea de edificación de Mallorca a **z = +39,3**; la de enfrente,
  bloque Mallorca 410-414, a ≈ +59,3). La retícula del Eixample va a rumbo ≈134,6° (la ficha usa 136°: 1,4° de giro).
- Contorno OSM de la basílica (relation 9194723) guardado en coordenadas locales: planta construida x −43…+40,8,
  z −73,3…+34,5; además **las 6 columnas inclinadas de la Passió** (círculos de 2,6-3,1 m en arco, x 41,9…47,2,
  z −42,2…+2,3) y las 2 columnas entre pórticos del Naixement (x −43,4; z −28,4 y −13,7).
- Eje de la nave x ≈ −2,5 (±1,5; centro de manzana −2,4) y centro del crucero z ≈ −20,5 (punto medio de las columnas de
  ambos pórticos). El modelo actual usa −1,9 / −18,4: casi bien.
- Puertas de la Glòria z ≈ +32 (crucero + 7 módulos; 90 m de interior hasta el ábside a −58); frente del nártex ≈ +39
  (línea de manzana). **Ojo integración: `comun.md` dice que la fachada de la Glòria está en z = +71; según los datos está
  en +32 (puertas) / +39 (nártex). +71 sería, como mucho, el pie de la escalinata pasado Mallorca.**
- Desnivel Provença→Mallorca: 4 m (cuadernillo oficial 8); el templo está a la cota de Provença.

## Medidas clave (verificadas)
- Módulo 7,5 m. Interior: largo 90, naves 45 (central 15), transepto 60 × 30. Bóvedas: laterales 30, central 45,
  crucero 60, ábside 75, coro 15.
- **Jesucrist 172,5 m**: planta de 12 caras, base ≈18 m, 12 niveles de paneles de piedra tensada de 85 a 142,5 m; tramo de
  29 m de cerámica blanca y ladrillo con «Tu solus Sanctus…» y palmas; cruz tridimensional de 4 brazos, 17 × 13,5 m, de
  vidrio y cerámica blanca (acabada 20-2-2026, bendecida 10-6-2026). Unida por puentes a las 4 de los evangelistas.
- **Mare de Déu 138 m**: base ≈18 m, pináculo de 25 m, estrella de 12 puntas (dodecaedro + 12 pirámides pentagonales) de
  7,5 m, 5,5 t, centro a 135 m, sobre tres brazos.
- **Evangelistes 135 m**: 8 lados parabólicos; remate de 22,5 m: escudos hexagonales «Amén»/«Al·leluia» y palmas,
  icosaedro con esfera de trencadís (oro Orsoni + ocre, amarillo, salmón) con los focos que iluminan la cruz, y figura
  blanca alada con libro: ángel (Mateu), león (Marc), buey (Lluc), águila (Joan).
- **Apòstols 98,5-120 m** (12): Naixement 98,5 (Bernabé, Macià) y 107,5 (Simó, Judes); Passió 107,5 (Jaume el Menor,
  Felip) y 112 (Bartomeu, Tomàs); Glòria 120 (Pere, Pau) y ≈114 estimado (Andreu, Jaume el Major). Pináculo de mosaico
  veneciano: mitra con cruz, báculo, anillo (agujero pasante), esfera blanca, «Hosanna», «Excelsis», «Sanctus» (amarillo,
  rojo, naranja). Huecos en espiral, estatua sentada, «Sanctus» a media altura.
- **Sacristías**: 35 m sobre 18 × 18; planta baja cuadrada, piso octogonal, cúpula de 12 paraboloides con huecos
  triangulares y linterna hiperboloide; tres obeliscos en la esquina. La oeste (Passió) acabada en 2016 a x 18…39,
  z −74…−56; la este, en obras (en el juego, simétrica).
- **Glòria**: nártex con 16 linternas hiperboloides con conos (7 delante, 9 detrás) que suben hasta 80 m en el centro;
  7 puertas de bronce (la central 4,7 × 5 m), columnas de dones/pecados/virtudes, nubes con el Credo, Baptisteri (+X) y
  Penitència (−X) con surtidor de 20 m y fuego; escalinata de ≈57 m sobre Mallorca (puente, tráfico debajo) hacia una
  avenida de dos manzanas que llega a la Diagonal; nivel del Infierno junto a Mallorca.
- **Naixement**: tres pórticos Esperança (lado Glòria), Caritat (centro), Fe (lado ábside); columnas con tortugas,
  estalactitas, ciprés verde con palomas blancas. Piedra más oscura.
- **Passió**: seis columnas inclinadas, frontón de 18 columnas-hueso y cruz con corona de espinas; esculturas angulosas
  de Subirachs; piedra clara.
- Noche: estrella encendida desde dentro (12 luminarias) y fuste bañado por 12 proyectores tras la corona; los icosaedros
  de los evangelistas iluminan la cruz; luz interior por los huecos, discreta.

## Estimaciones (marcadas en el JSON; a contrastar con capturas en SF1)
Posiciones exactas de cada torre (por el contorno OSM, las columnas y el módulo), diámetros de evangelistas (≈10 m) y
apóstoles (≈7,6 m), alturas exteriores de cornisas y cumbreras, medidas del Naixement/Passió en alzado, alturas
parciales de las linternas de la Glòria, asignación de cada evangelista a cada esquina, colores RGB orientativos y
reparto de colores de las vidrieras (frías al este, cálidas al oeste: dato muy difundido, no reconfirmado aquí).

## Fuentes
Cuadernillos oficiales 8 y 10 (sagradafamilia.org), ca/en.wikipedia, Vatican News y sagradafamilia2026.org (cruz),
sagradafamilia.org (evangelistas Lluc y Marc; historia), The Conversation (módulo), barcelonarchitecturewalks.com
(alturas), Fundació Antoni Gaudí (estrella), Licht Kunst Licht (iluminación de la Mare de Déu), blog oficial
(Naixement), OpenStreetMap/Nominatim (contornos). Ningún modelo 3D de terceros.

## Capturas ANTES (estado actual, 960×540)
`/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/sf/sf0/`: `antes_*.jpg` y `hoja_antes.jpg`
(dron Glòria, dron Naixement, a pie en la Pl. de Gaudí, a pie en Mallorca, dron de noche). Vistas en `vistas.json` de
esa carpeta (reutilizables en SF1-SF3). En SF0 no hay «después»: no cambia nada visible.

## Para DESARROLLO.md
- `gta/data/sf_ref.json`: referencia de la Sagrada Família acabada (marco local de la ficha, contorno OSM local, planta,
  18 torres, fachadas, escalinata, noche), con `estado` verificado/estimación por dato. Lo leen las etapas SF1-SF3.
- La fachada de la Glòria está en z local ≈ +32 (puertas) / +39 (nártex, línea de manzana), no en +71.

## Resultado de las capturas ANTES (0 errores y 0 avisos de consola)
Triángulos dibujados de todos los hitos (`lm.trisVis`; la basílica sola no se mide aparte en el arnés): dron Glòria
478 418 · dron Naixement 470 618 · Pl. de Gaudí 477 502 · Mallorca 477 786 · noche 478 418 (hitos en total 698 777).
Carga 18,9 s; 26-98 s por vista. Lo que se ve hoy: silueta reconocible desde el dron, pero torres lisas en huso, Glòria
de cajas, puente-plaza plano sobre Mallorca; de noche la basílica es un bloque blanco uniforme sin estrella visible.
Vistas flojas para comparar: `pie_mallorca` (local 30, 52) cae **debajo** del puente-plaza actual (solo se ve la losa) y
`pie_gaudi` queda tapada por los árboles de la plaza; en SF1 hay que moverlas (Mallorca a z ≈ +75 mirando al ábside, Gaudí
en un claro del estanque). Para medir la basílica sola conviene un `eval` que sume los triángulos de sus mallas.
