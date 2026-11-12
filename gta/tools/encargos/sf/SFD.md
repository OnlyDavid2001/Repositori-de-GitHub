# Etapas FORMA (SFD1 → SFD2) · Contrastar con el modelo 3D de la basílica del usuario y con las fotos

Worktree `/home/user/wt/sf-int`, rama `wt-sf-int` (la misma de SFI y SFR; SFI ya fusionó los dos carriles). Ficheros:
`gta/sagrada.js`, `gta/gloria.js`, en `gta/plazas.js` solo las dos plazas de la basílica, y `gta/data/sf_*.json`. Lee
`comun.md`, `SF.md` (con su sección «Referencias del usuario»), `SFI.md` (sección de la cruz) y el progreso de SFI.

## Lo que ha pasado el usuario (textual, resumido)
«Aquí tienes un modelo de toda la basílica. No digo que sea hiperfidedigno, pero más o menos se parece: ayúdate para
contrastar cosas. Por ejemplo, los aledaños de las dos fachadas laterales están bastante bien hechos. Eso sí, no está a la
altura proporcional: tú solamente haz caso de la forma.»
→ Usa el modelo para la **FORMA** (qué piezas hay, cómo son, dónde van y cómo se encadenan unas con otras). Las
**medidas y alturas** siguen siendo las reales de `data/sf_ref.json`; no copies sus proporciones.

## Material
- **Modelo del usuario**: STL de SketchUp, en pulgadas, Z arriba, con el terreno y los alrededores:
  `/root/.claude/uploads/6a030a94-1fe2-5831-a104-304cc6d92e7c/baa936fb-Sin_t_tulo_1.stl` (51 014 triángulos sin la figura
  humana de escala). Ya en metros en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/sf/ref_modelo/tri.npy`
  (array N×3×3) con un rasterizador ortográfico con z-buffer (`vistas.py`, `vistas3.py`) para sacar más vistas o recortes.
  En esa carpeta: `planta_nave.png` (ábside arriba, Glòria abajo, Naixement a la derecha), `alzado_*.png` de las cuatro
  fachadas e `iso_*.png`. En el modelo, +Y es el norte: el ábside mira al noroeste, la Glòria al sureste, el Naixement al
  noreste y la Passió al suroeste; la cruz está en (−34,1; 29,9) y 174,8 m.
- **La cruz del usuario**: `gta/data/sf_cruz.json` (ver `SFI.md`).
- **Fotos**: `scratchpad/sf/ref/` (tres del usuario) y `scratchpad/sf/ref_web/` (biblioteca por elementos con `INDEX.md`).

## Método
Alinea el modelo con la ficha `sagrada_familia` (eje de la nave, crucero bajo la torre de Jesucrist, Glòria hacia +Z
local) escalando en planta a las medidas reales; saca del juego las mismas vistas (planta, cuatro alzados casi
ortográficos con FOV estrecho y lejos, e isométricas) y ponlas lado a lado con las del modelo en una hoja por etapa. Si te
ayuda, añade un modo de depuración `?sfghost=1` que dibuje el modelo del usuario en alambre semitransparente encima de la
basílica (su JSON va en `gta/data/` pero no se publica; dilo en el informe).

## SFD1 · Fachadas laterales (Naixement y Passió) y sus aledaños
Lo que el usuario señala como bien hecho en su modelo. Compara y copia su forma: los cuerpos bajos que rodean las dos
fachadas, sus pórticos y escaleras de acceso, cómo se unen al claustro y a las sacristías, los remates y piñones a esa
altura y el encuentro con las plazas. Añade el detalle con las fotos de `ref_web/fachadas` y `ref_web/pinaculos`. Hoja
ANTES/DESPUÉS a pie y desde el dron por los dos lados, de día y a las 23:00.

## SFD2 · Torres, pináculos, la cruz del usuario y la Glòria
- **La cruz del usuario** en lo alto de la torre de Jesucrist (si SFI no lo hizo), según `SFI.md`.
- **Torres**: perfil y remate de cada una comparados con el modelo (forma) y con las fotos (detalle): la de Jesucrist como
  cono largo que se estrecha poco a poco; la estrella de 12 puntas de la Mare de Déu; los cuatro evangelistas con sus
  símbolos alados (ángel, león, buey y águila); los pináculos de trencadís de los apóstoles.
- **Glòria**: la cascada de linternas y las columnas arborescentes comparadas con el alzado del modelo y con la maqueta
  del usuario (`ref/usuario_gloria_maqueta.png`).
- **Pináculos de las naves** (frutas y cereales de colores) y las linternas de las cubiertas.
Hoja ANTES/DESPUÉS de remates, Glòria y conjunto, de día y a las 23:00, y coste medido.
