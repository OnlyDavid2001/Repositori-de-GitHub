# SFD2 · La cruz del usuario, luz y texturas

Estado: hecho (una ejecución). Rama `wt-sf-int`.

## Cruz
Ya estaba hecha en SFI (`sf_cruz.json` en la malla media sobre la torre de Jesucrist, procedural lejos, haces de luz de
noche). Lo que faltaba: **de día**, las franjas de vidrio de la cruz (emisivas solo de noche) salían gris oscuro (el shader de
los hitos multiplica el albedo emisivo por 0,45) y dibujaban una banda oscura en los brazos. Ahora, de día, el vidrio blanco
de la cruz es blanco lechoso y brillante; de noche sigue encendido igual. La cruz del modelo de la basílica no se usa.

## Luz y texturas: material propio de la basílica (`sagrada.js`, `sfMat`)
Al cargar, se toma el fuente del material de los hitos (`lm`, landmarks.js) de la malla de la basílica, se le injertan dos
trozos y se crea con `ctx.mkMat` un material `sf_lm` (y `sf_lm_g` para la escalinata de la Glòria) con los mismos atributos y
uniformes (`uLmN`, `uLmH` en onBind, como el original). Se asigna a las mallas `sagrada_familia`, `_lluny`, `_detall` y a
`sf_gloria`, `sf_gloria_detall`. No toca el núcleo ni el resto de hitos; si el fuente del núcleo cambia y no encuentra las
marcas (`// NOCHE (por hito)` y la rama `mode` de focos), deja el material original (console.info, no aviso).
- **Día** (solo la basílica): piedra ocre dorada cálida (×1,05/0,95/0,80); relieve en la normal (ruido, se apaga de lejos
  con detAA); envejecimiento: chorreones verticales y suciedad en la parte baja, más en el Naixement (local x < −28);
  pavimentos horizontales con losas de 1,8 m en los ejes de la basílica (atrios y terrazas); trencadís vidriado (rugosidad
  0,14 y algo de metal) y cerámica blanca esmaltada (0,2).
- **Noche**: en lugar del baño de focos uniforme, dorado cálido (1, 0,68, 0,32) desde cuatro focos bajos con dirección y
  pesos distintos (cada cara su luz), caída con la altura, aristas marcadas (término de incidencia con la vista) y **luz fría
  azulada** en lo alto y en las caras que miran arriba (pináculos, cubiertas). La retícula de huecos de las torres ya era
  emisiva (SF3) y se lee mejor sobre el fondo más oscuro.
- **Escalinata de la Glòria de noche** (`SFG`): suelo con la mitad de albedo de noche y focos solo en las verticales: ya no
  sale quemada en blanco.
- **Diente de sierra** (petición de SFD1): faldones de los hastiales más oscuros (0,8 → 0,7) y hastial más claro (1,08 → 1,12).
  Pavimento de los atrios algo más cálido y oscuro ([212,200,178] → [204,186,156]).

## Comprobaciones
- Alturas (node `sfd1/alturas.js`): **Jesucrist 172,5; Mare de Déu 138,2; evangelistas 135,0** (las cuatro).
- Triángulos (node `tris_sf.js`): sin cambios (media 55 740, lejos 8 438, detalle 94 332). Desde el arnés: lm.trisVis
  574 935 desde el dron SE y 668 351 cerca, igual antes y después. Coste: dos materiales más (dos compilaciones al cargar),
  algo más de ALU en el fragment de la basílica (dos vnoise más); nada por fotograma en JS. Carga 14,2–14,8 s (igual).
- Consola: 0 errores y 0 avisos en las dos tandas (ANTES = `git archive 2b520ec`, DESPUÉS).

## Lo flojo
- Desde el dron de noche ya es dorada y no blanca, pero la luz fría de pináculos y cubiertas apenas se distingue a 385 m;
  la foto del usuario tiene mucho más azul y contraste. La terraza de la Glòria desde el dron queda ahora bastante oscura.
- De día el ocre dorado gana, pero la piedra a pie del Naixement sigue muy oscura a las 10:30 (está a contraluz; el
  envejecimiento suma algo).
- El material depende del texto del shader del núcleo (injerto por marcas): si alguien cambia esas líneas en landmarks.js,
  la basílica vuelve en silencio a la luz genérica.
- No se han hecho los símbolos alados de los evangelistas (ángel, león, buey, águila): siguen la figura alada genérica.
- Sin capturas en LDR (el injerto también lleva `#define LDR` vía mkMat, pero no lo he visto).

## Para DESARROLLO.md
- §13: «SFD2: la basílica y la escalinata de la Glòria usan un material propio (`sf_lm`, `sf_lm_g`) derivado del de los
  hitos al cargar (`sfMat` en sagrada.js): ocre dorado con relieve y envejecimiento de día, cerámica vidriada; de noche
  dorado desde cuatro focos con dirección, aristas marcadas y luz fría arriba; la escalinata sin quemarse. El vidrio de la
  cruz es blanco de día».

## Capturas (scratchpad/sf/sfd2/)
`hoja_sfd2.jpg` (ANTES | DESPUÉS: dron SE de día y a las 23:00, cruz de día y de noche, a pie en el Naixement, escalinata de
noche), `cmp_*.jpg`, `v.json`, `run.sh`.
