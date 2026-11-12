# G1B · Banco de pruebas y jurado

Worktree `/home/user/wt/g1-banco`, rama `wt-g1-banco` (no cambias el juego: solo herramientas). Lee `comun.md`.

## Etapa 1 (G1B1) · El banco
1. `gta/tools/views_g1.json`: unas **24 vistas fijas** que representen el juego, cada una con nombre, posición (`x`, `z`),
   `yaw`, `pitch`, `hour` y `walk: true` (a pie, tercera persona) o `agl` (dron). Como mínimo: Passeig de Gràcia a pie;
   una calle interior del Eixample a pie; un cruce de xamfrà; una calle estrecha del Gòtic; Gràcia; Poblenou; Sarrià; la
   Rambla de noche; el Eixample a pie de noche; Plaça de Catalunya; la rotonda de Glòries y la de Plaça d'Espanya desde el
   dron; la Diagonal; la Barceloneta con la playa y el mar; el Port Vell; Montjuïc desde el puerto; un camino de tierra de
   Collserola a pie; Collserola de lejos desde la ciudad; la carretera del Tibidabo; el Eixample desde el dron; la ciudad
   desde el mar al atardecer; la ciudad de noche desde el dron; la Sagrada Família a pie; unas azoteas a la altura de los
   tejados. Saca las coordenadas de `META.poi`, de Nominatim (guarda lo descargado) o del mapa; comprueba cada vista con
   una captura pequeña (que no salga dentro de un edificio).
2. **ANTES**: captura las 24 a 960×540 desde tu rama (igual que la principal) y monta `hoja_antes.jpg` (con el nombre de
   cada vista) en `scratchpad/g1/banco/`. Deja también un script `tools/hoja_g1.py` que monte la hoja de cualquier tanda.
3. `gta/tools/encargos/g1/rubrica.md`: cómo puntuar cada vista del 1 al 10, con seis criterios (luz y atmósfera;
   materiales y texturas; detalle geométrico a pie de calle; vegetación; coherencia: huecos, parpadeos, transparencias,
   cortes y cosas flotando; lejanía) y qué es un 5, un 7, un 8 y un 10 en cada uno, con ejemplos. 
4. **Fotos de referencia reales** (Firecrawl, búsqueda de imágenes; solo en `scratchpad/g1/banco/ref/`): una o dos por
   tipo de vista, para que el jurado compare.

## Etapa 2 (G1B2) · Jurado de la línea base
(Otro agente.) Puntúa cada vista de `hoja_antes` con la rúbrica, comparando con las fotos reales: nota por criterio, nota
de la vista y los 3 defectos más visibles de cada vista con dónde están. Sé severo: si dudas entre dos notas, la más baja.
Guarda `scratchpad/g1/banco/jurado_<n>_antes.json`.
