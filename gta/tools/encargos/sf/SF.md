# Carril BASÍLICA (SF0 → SF1 → SF2 → SF3) · La Sagrada Família acabada, idéntica a como quedará

Worktree `/home/user/wt/sf-basilica`, rama `wt-sf-basilica`. Ficheros tuyos: `gta/sagrada.js` (nuevo: sustituye el
constructor de la ficha `sagrada_familia` en la carga, como hace `aeropuerto.js` con `aeroport`; su `<script>` va en
`index.html` después de `landmarks_e.js`), `gta/data/sf_*.json` y, si hace falta, la ficha de `landmarks_a.js` (solo
`edificios`, medidas y comentario). Lee `comun.md`.

## SF0 · Investigación (solo datos, sin código del juego)
Reúne en `gta/data/sf_ref.json` (y un resumen legible en tu progreso, con las fuentes) todo lo que hará falta para que sea
idéntica a la basílica acabada: planta (cruz latina, 5 naves, crucero de 3, ábside, claustro perimetral, las dos
sacristías con su cúpula, la cripta), medidas (largo, ancho, alturas de naves y bóvedas), **las 18 torres** (12 de los
apóstoles, 4 evangelistas, la de la Mare de Déu con su estrella y la de Jesucrist de 172,5 m con su cruz): posición,
altura, diámetro de base, perfil (paraboloides e hiperboloides, cómo se estrechan), huecos, remates y pináculos con sus
colores y materiales; **las tres fachadas** (Naixement con sus tres pórticos y el ciprés; Passió con el pórtico de
columnas inclinadas y las esculturas angulosas; Glòria, la principal, como está proyectada: pórtico, columnas, linternas,
puertas) y sus medidas; los ventanales y vidrieras (colores fríos al este, cálidos al oeste); las linternas de las
cubiertas; los símbolos de los evangelistas; la iluminación nocturna prevista (estrella y cruz encendidas). Marca qué es
dato verificado y qué es estimación.

## SF1 · Volumen, planta y las 18 torres
Con `sf_ref.json`: naves, crucero, ábside, claustro, sacristías y basamento con proporciones fieles; las 18 torres con su
perfil real, sus huecos en espiral y sus remates (trencadís de colores, la cruz de Jesucrist, la estrella de la Mare de Déu,
los evangelistas). Niveles de detalle desde el principio. Vistas: dron orbitando a 4 ángulos, desde la Plaça de Gaudí,
desde Mallorca, lejana desde Montjuïc o el Turó de la Rovira.

## SF2 · Fachadas y detalle cercano
Las tres fachadas con su composición y su relieve (pórticos, columnas, esculturas como volúmenes reconocibles —no
bultos—, frisos, pináculos), los ventanales con su tracería, el claustro y las cubiertas; textura de piedra con relieve y
envejecimiento (Naixement más oscura, lo nuevo más claro). A pie desde las dos plazas y desde la calle debe impresionar.

## SF3 · Noche, materiales y repaso
Iluminación nocturna (focos, vidrieras encendidas desde dentro, estrella y cruz), cerámicas con brillo, ajuste de niveles
de detalle y coste, y repaso con dureza frente a las referencias: lista de diferencias y arreglo de las más visibles. Hoja
ANTES/DESPUÉS (día y noche, dron y a pie) y una hoja de 6 vistas «de postal».

## Referencias del usuario (fotos que ha mandado: OBLIGATORIAS para SF3, prioridad sobre el resto de SF3)
Están en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/sf/ref/`: **míralas con Read antes de
empezar** y compara tus capturas con ellas.
1. `usuario_torres_dia.jpg` (remates a pleno sol):
   - **Torre de Jesucrist**: cono que se estrecha con una piel de piedra ocre dorada cubierta por una **retícula fina de
     huecos en rombo y triángulo** (no una rejilla de ventanas rectangulares), por bandas que se afinan hacia arriba; bajo
     la cruz, una corona con celosía más fina. **La cruz**: grande, blanca, de cuatro brazos tridimensionales con los
     extremos ensanchados y en punta, algo más ancha que el remate.
   - **Torre de la Mare de Déu**: la misma piel; remate con la **estrella de 12 puntas** (vidrio y acero, con brillo).
   - **Torres de los evangelistas**: más esbeltas, con la misma retícula; en lo alto, **sus símbolos como esculturas
     blancas y doradas con las alas abiertas** (ángel, león, buey, águila).
   - **Pináculos de los apóstoles**: remates de trencadís de colores vivos (dorado, rojo, blanco) con mitra, anillo y cruz,
     y pequeñas esferas.
   - Color general: **ocre dorado cálido** a pleno sol; nada de gris ni de bloques de ladrillo.
2. `usuario_noche_cruz.jpg` (render oficial de noche):
   - **La cruz de Jesucrist brilla en blanco y lanza haces de luz al cielo** en abanico (8–12 haces largos, como
     reflectores: conos aditivos alargados y suaves que se desvanecen con la distancia, sin quemar la imagen).
   - La torre de Jesucrist **encendida desde dentro**: la retícula de huecos brilla cálida y las aristas se marcan.
   - Luces puntuales cálidas en lo alto de los evangelistas y al pie de las torres; pináculos y cubiertas de las naves con
     **luz fría azulada**; cielo azul marino.
3. `usuario_gloria_maqueta.png` (maqueta de la fachada de la Glòria acabada, de frente): **compón la Glòria así**,
   sustituyendo la estimación de SF1–SF2:
   - **Cuatro torres de apóstoles** altas y esbeltas: tramo bajo macizo, tramo medio con celosía de rombos, tramo alto con
     ranuras verticales finas y remate con corona.
   - Entre y delante de ellas, una **cascada de linternas**: muchos conos apuntados en forma de gota o bulbo, de alturas
     escalonadas (más altas en el centro; en el eje, un cono puntiagudo destacado), sobre **columnas que se ramifican como
     árboles** (el bosque de columnas del pórtico).
   - A los dos lados, **dos torres más bajas y cónicas**, con huecos y remate.
   - En las esquinas bajas, **piñones triangulares con celosía hexagonal** (panal) y pináculos pequeños.
   - Abajo, un **basamento ancho con escalinata frontal** (ENTORNO hace la escalinata de la Glòria: casa con ella).
Si no te da para todo, haz primero 3 (la Glòria) y 2 (la cruz y la noche), y deja lo menos visible para SFR diciéndolo.
