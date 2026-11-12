# SFD1 · Forma según el modelo del usuario (con las alturas de los documentos)

Estado: hecho (una ejecución). Rama `wt-sf-int`.

## Método
- Modelo del usuario (`baa936fb-Sin_t_tulo_1.stl`, triángulos en `scratchpad/sf/ref_modelo/tri.npy`) pasado a los ejes
  locales de la ficha (`scratchpad/sf/sfd1/lat.py`, `loc.npy`: X → Passió, Z → Glòria, origen en la torre de Jesucrist =
  crucero del juego). Solo FORMA: sus alturas no valen (el usuario).
- Juego: cuatro alzados a 520 m con fov 0,40 y la ciudad oculta (`sfd1/mkv.js`, `eval` de la vista) frente a los cuatro
  alzados del modelo; más dos vistas oblicuas de dron de los costados y una a pie en el atrio del Naixement.

## Diferencias encontradas y qué se ha hecho (sagrada.js, gloria.js)
1. **Aledaños de las fachadas laterales**: en el modelo, delante del Naixement y de la Passió hay una explanada elevada a la
   cota de las puertas, con taludes a los dos extremos y bajada a la calle. Hecho: `SF.atrios` (malla media), explanada de
   x −54…−41 (Naixement) y 37…50,5 (Passió), z −45…4, a la cota del suelo del templo; taludes de 9 m a cada extremo hasta la
   acera; escalinata central de 18 m (contrahuella ≈ 0,17, huella 0,36) hasta la acera si hay desnivel; pretil de 1 m a los
   lados. A pie: `BCN_GLORIA.floorAt` los lee (explanada, taludes y peldaños).
2. **Diente de sierra**: el modelo corona los muros con hastiales apuntados (uno por tramo de 7,5 m) y el claustro con un
   diente de sierra continuo. Hecho: hastiales a 33 m (naves laterales y testeros del crucero) y a 48 m (claristorio, entre
   los pináculos), en todas las calidades; y en el pretil del claustro, hastiales de 3,2 m cada 3,75 m (malla media).
3. **Frontón de la Passió**: en el modelo es un gran tejado a dos aguas con la cumbrera perpendicular a la fachada (no una
   pirámide). Hecho: `cubierta` a dos aguas de 36 × 8 m y 20 m de alto detrás de las 18 columnas-hueso.
4. **Glòria**: la cascada de linternas del modelo sube más (eje ≈ 96 m, fila delantera ≈ 65 m). Hecho: gotas más altas
   (eje 82 → 96; detrás 70/64/57 → 84/76/66; en medio 60/53/47 → 72/63/54; delante 52/47/43/39 → 64/58/51/44).
5. **Alturas (documentos)**: las figuras de los evangelistas solo estaban en la malla lejana: de 1,5 km para dentro las
   torres acababan a 126 m. Ahora la figura alada va también en la media. Medido en la malla media (node, suelo 0):
   **Jesucrist 172,5; Mare de Déu 138,2; evangelistas 135,0** (las cuatro). Apóstoles sin cambios (98,5–120).
   La cruz del modelo de la basílica NO se usa: la única es la del usuario (`sf_cruz.json`, SFI).

## Triángulos (node, tris_sf.js)
| malla | antes | después |
|---|---|---|
| media (`sagrada_familia`) | 54 022 | 55 740 (+1 718) |
| lejos | 8 220 | 8 438 |
| detalle | 94 332 | 94 332 |

## Lo flojo
- Los hastiales en diente de sierra apenas se leen en alzado frontal (mismo ocre sobre el claristorio); se oscurecieron los
  faldones, pero el contraste es bajo (SFD2: luz y texturas).
- Los atrios están a la cota del suelo del templo: el desnivel con Marina y Sardenya en el juego es pequeño, así que la
  escalinata tiene pocos peldaños (el modelo los pone a ≈ 4,8 m, pero sus alturas no valen).
- No se han copiado los dos «candelabros» monumentales del modelo delante de la escalinata de la Glòria ni el pabellón
  hexagonal delante de los atrios.
- Taludes y escalinata con caras dobles (sin saber si el material recorta caras traseras): +pocos triángulos.

## Para DESARROLLO.md
- §13: «SFD1: forma del modelo del usuario: atrios laterales (`BCN_SF.atrios`, también suelo a pie en
  `BCN_GLORIA.floorAt`), hastiales en diente de sierra en naves, crucero y claustro, frontón a dos aguas de la Passió,
  cascada de la Glòria más alta y figuras de los evangelistas en la malla media (135 m)».

## Capturas (scratchpad/sf/sfd1/)
- Hoja: `hoja_sfd1.jpg`, con el MODELO, el ANTES (SFI, `git archive` de 3cc34c9) y el DESPUÉS: los cuatro alzados, dos oblicuas de dron y una a pie en el atrio del Naixement.
  Consola sin errores ni avisos en las dos tandas.
- Se ve: las figuras aladas de los evangelistas (lo más visible en los alzados), el frontón a dos aguas de la Passió, la cascada
  de la Glòria más alta y, a pie, la explanada, el pretil y la escalinata del Naixement. Desde el dron oblicuo el atrio apenas
  se distingue del pavimento que ya había, y el diente de sierra tampoco se lee bien.
