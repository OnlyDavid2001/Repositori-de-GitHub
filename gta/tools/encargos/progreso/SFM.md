# SFM · Pináculos de los apóstoles y fachadas con la forma del modelo del usuario; ocre homogéneo

Estado: código hecho; capturas en marcha (`scratchpad/sf/sfm/run.sh`). Rama `wt-sf-int`.

## Hecho
1. **Pináculos de los 12 apóstoles = los del modelo** (`sagrada.js`, `apostol(…, pm)`): la pieza del modelo (cono, bulbo,
   aguja y remate, 220 triángulos) sobre cada fuste, desde el arranque del pináculo (0,76·H) hasta la altura de los
   documentos, con la anchura del fuste (rp + 0,15 m). Emparejados por fachada y orden (Glòria por x, laterales por z).
   Trencadís por bandas: anillo blanco al pie, cono en bandas dorado/rojo/amarillo, bulbo rojo, aguja amarilla, remate
   dorado y blanco arriba. Van en la malla media y en la lejana (la silueta es la misma). Fuera los míos (mosaico, mitra,
   hostia, cruz con bolas, anillo, «Hosanna»); se quedan los fustes, las luces frías al pie y las estatuas.
2. **Fachadas del Naixement, la Passió y la Glòria = las del modelo** (malla media): mi geometría de esas tres fachadas
   (cuerpos, pórticos, hastiales, ciprés, columnas inclinadas, porche, frontón y cruz de la Passió; muro, ventanales, gotas,
   bosque de columnas, torres cónicas y piñones de la Glòria; y su detalle escultórico) ya no se dibuja cerca ni a media
   distancia. Se quedan el zócalo y la escalera del nártex (casan con la losa de `gloria.js`) y las siete puertas. Lejos
   (> 1,5 km) sigue mi silueta, con las linternas de la Glòria a 80 m.
   Escala: en planta, a la separación real de las torres del juego (`sf_ref.json`): Naixement ×1,22 y Passió ×1,25 a lo
   largo de la fachada, Glòria ×1,12; profundidad sin escalar, con la línea de torres del modelo sobre la del juego. Altura:
   Naixement ×1; Passió ×0,93 (frontón con su cruz a **58 m**); Glòria igual hasta 35 m y comprimida arriba para que la
   linterna del eje llegue a **80 m** (SFD1 la había subido a 96).
3. **`tools/stl_basilica.py` arreglado y JSON regenerado** (`data/sf_modelo_piezas.json`, 410 → 263 kB):
   - el STL traía el giro de los triángulos mezclado (la mitad de las normales hacia dentro): se orientan por adyacencia y
     cada pieza hacia fuera (volumen con signo respecto a su centro, en los ejes del juego);
   - fachadas limpias: fuera las barras sueltas en lo alto, las varillas de 30-50 m (agujas de la girola), lo que queda por
     debajo de 6 m (suelo y explanadas, que son de ENTORNO y de los atrios), las piezas lejos del eje; la pieza grande de
     cada lateral (todo el costado, 115 m) recortada a |u| < 20 m; la de la Glòria a |v| < 31 m y u > −70 m (sin losa ni
     escalinata) y sin los fustes de las dos torres de los extremos (se quedan los del juego). Glòria 24 963 → 16 945
     triángulos, Naixement 1 779 → 326, Passió 2 765 → 380.
4. **Ocre homogéneo**: una sola piedra (`TOR`, el ocre dorado de las torres) para naves, torres, Naixement, Passió y
   Glòria; fuera el oscurecimiento del Naixement en el envejecimiento por vértice y en el shader (`sf_lm`); el relieve y el
   hollín suave abajo se quedan, iguales en todas partes.

## Alturas (node, malla media, suelo 0)
Jesucrist 172,5; Mare de Déu 138,2; evangelistas 135,0 (las cuatro); apóstoles 98,5 / 107,5 / 107,5 / 98,5 (Naixement),
107,5 / 112 / 112 / 107,5 (Passió), 114 / 120 / 120 / 114 (Glòria), todas exactas; linterna del eje de la Glòria 80,0;
frontón de la Passió con su cruz 58,0.

## Triángulos (node, `sfm/tris_sf.js`)
| malla | antes (SFD2/SFR) | después |
|---|---|---|
| media | 55 740 | 63 185 |
| lejos | 8 438 | 9 470 |
| detalle | 94 332 | 58 122 |
