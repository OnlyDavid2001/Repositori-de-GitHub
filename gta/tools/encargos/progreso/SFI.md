# SFI · Integración de la Sagrada Família, sus plazas y la escalinata de la Glòria

## Estado
- [x] Fusión de `wt-sf-basilica` (SF0-SF3, f885607) y `wt-sf-entorno` (ENT0-ENT2, 9c33371); conflicto solo en `index.html`
      (se conservan `sagrada.js` y `gloria.js`, en ese orden, tras `landmarks_e.js`). `app.js` no tenía conflicto.
- [x] Encaje de la Glòria con la losa de Mallorca (cota, posición y anchura): ver «Arreglos».
- [x] A pie sobre plataformas: `walkFloor` en app.js con `BCN_PLAZAS.floorAt` y `BCN_GLORIA.floorAt`.
- [x] `node tools/mz_partidas.js` relanzado: resultado idéntico (593 manzanas, 294 037 edificios), el JSON no cambia y el
      juego usa la caché (`MZC.nB === nB0`).
- [x] DESARROLLO.md §13.
- [ ] Capturas 10:30 y 23:00 (DESPUÉS) y ANTES en la rama principal; hoja; triángulos y carga.

## Arreglos de integración
1. **Cota de la Glòria**: el suelo del templo (`yF`) queda ~2,3 m sobre Mallorca; la losa de ENTORNO va a Mallorca + 5,5
   (4-5 m del proyecto + libre para el tráfico), así que ENT2 había puesto 21 peldaños de enlace en z 41-46 que se metían
   entre las columnas del bosque (z ≈ 44,7). Ahora `sagrada.js` sube el zócalo de las columnas a la cota de la losa
   (`dS`), con los costados desde la línea de manzana (39,3), y baja al suelo del templo con una escalera de ~20 peldaños
   de 56 m de ancho bajo el nártex (z 34,6-41), delante de las siete puertas. Los pedestales con los pecados arrancan sobre
   el zócalo. `gloria.js` ya no dibuja el enlace y calcula `yF` con el mismo eje y crucero que `sagrada.js`.
2. **Posición y anchura**: losa de 60 m (|X| < 30) desde z 41; zócalo de la basílica de 74 m hasta z 46,7, misma cota: se
   solapan 5,7 m sin escalón. La maqueta del usuario (basamento con escalinata frontal) queda así: el basamento es el
   zócalo + la losa + la terraza del monumento, y la escalinata baja de frente de z 80 a 137.
3. **A pie**: el jugador sube al talud del estanque de Gaudí, a la escalera del nártex, al zócalo, a la losa, a la terraza
   y a los peldaños; la losa es hueca y desde Mallorca se pasa por debajo.

## Cruz del usuario (hecha en SFI)
`sagrada.js` carga `data/sf_cruz.json` antes de construir (`cruzP`, junto a `sf_ref.json`) y, en la malla media (0-1500 m),
pone sus 13 708 triángulos con `L.poly` (sombreado plano: se leen las aristas) en cerámica blanca `K.LISO`, con la base
del fuste en la cota de arranque de la cruz (155,5 m) y los brazos por los ejes de la basílica. Lejos (> 1500 m) sigue la
cruz procedural. Se conservan las franjas de vidrio que se encienden de noche y los haces. Malla media 40 426 → 54 022
triángulos (+13 596).

## Pendiente / flojo
- La cruz del modelo del usuario ya está (ver «Cruz»); faltan los miradores de las puntas (procedurales, en DET) por
  casar con su forma.
