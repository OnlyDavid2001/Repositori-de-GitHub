# Etapas FORMA (SFD1 → SFD2) · Forma del modelo del usuario, alturas de los documentos, su cruz, luz y texturas

Worktree `/home/user/wt/sf-int`, rama `wt-sf-int`. Ficheros: `gta/sagrada.js`, `gta/gloria.js`, en `gta/plazas.js` solo las
dos plazas de la basílica, y `gta/data/sf_*.json`. Lee `comun.md`, `SF.md` («Referencias del usuario») y el progreso de SFI.

## Lo que ha dicho el usuario (textual, resumido; MANDA sobre todo lo demás)
«Simplifícalo si hace falta: de momento, básate en la forma, en la luz y en las texturas; con lo que te he enviado es
suficiente. Respeta siempre las alturas que dicen los documentos: por ejemplo, en mi modelo la torre de María es un poco
más pequeña que las de los evangelistas, y la quiero más alta (138 contra las de los evangelistas). Y la cruz que viene en
el modelo de la basílica no la pongas: pon la cruz que te he enviado aparte; une los dos documentos. Y acelera el ritmo:
esto no es tan complicado.»
→ **Rápido y concreto**: unas **35 llamadas a herramientas por etapa**, 4–6 vistas de comprobación y una sola hoja
ANTES/DESPUÉS. **Nada de investigación nueva** ni búsquedas de fotos: el material es el del usuario (sus tres fotos en
`scratchpad/sf/ref/`, su modelo de la basílica y su cruz).

## Material
- **Modelo de la basílica del usuario** (solo FORMA; sus alturas y proporciones no valen): vistas ya sacadas en
  `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/sf/ref_modelo/` (`planta_nave.png` con el
  ábside arriba, la Glòria abajo y el Naixement a la derecha; `alzado_gloria_SE.png`, `alzado_naixement_NE.png`,
  `alzado_passio_SO.png`, `alzado_absis_NO.png`; `iso_*.png`); triángulos en metros en `tri.npy` y rasterizador
  `vistas4.py` por si necesitas un recorte. Original: `/root/.claude/uploads/6a030a94-1fe2-5831-a104-304cc6d92e7c/baa936fb-Sin_t_tulo_1.stl`.
- **La cruz del usuario**: `gta/data/sf_cruz.json` (formato en `SFI.md`): **es la única cruz que va**; la del modelo de la
  basílica, no.
- **Alturas de los documentos** (`gta/data/sf_ref.json`, ya en `sagrada.js`): Jesucrist **172,5 m con la cruz**; Mare de
  Déu **138 m** (más alta que los evangelistas); evangelistas **135 m**; apóstoles **98,5–120 m** según la fachada;
  sacristías 35 m. Comprueba que el juego las cumple al acabar (mídelas y dilo).

## SFD1 · Forma (según el modelo del usuario, con las alturas de los documentos)
Compara el juego con los alzados y la planta del modelo y copia su forma donde difiera: los aledaños de las dos fachadas
laterales (Naixement y Passió: cuerpos bajos, pórticos, escaleras y su unión con el claustro y las sacristías), la Glòria
(cascada de linternas en gota sobre columnas arborescentes, como en el alzado y en la maqueta del usuario) y la silueta de
conjunto. Hoja con los cuatro alzados del modelo al lado de los del juego.

## SFD2 · La cruz del usuario, luz y texturas
- **Cruz**: sustituye la cruz de `sagrada.js` por la malla de `sf_cruz.json` en lo alto de la torre de Jesucrist (17 m de
  cruz; total 172,5 m), brazos alineados con la basílica, cerámica blanca esmaltada y vidrio; de noche brilla en blanco y
  **conserva los haces de luz**. Lejos (> ~1 500 m), la cruz simple.
- **Luz**: de día, piedra ocre dorada cálida (como `ref/usuario_torres_dia.jpg`); de noche, como
  `ref/usuario_noche_cruz.jpg`: dorada, con la retícula encendida, aristas marcadas y luz fría azulada en pináculos y
  cubiertas; sin que la basílica salga blanca y uniforme desde el dron.
- **Texturas**: piedra con relieve y envejecimiento (Naixement más oscura), cerámicas y trencadís con brillo, huecos de
  las torres en retícula de rombos.
- Si te queda margen: los símbolos alados de los evangelistas (ángel, león, buey y águila).
Hoja ANTES/DESPUÉS de remates y conjunto, de día y a las 23:00.
