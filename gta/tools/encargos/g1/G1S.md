# G1S · Suelo: calles y caminos planos, asfalto y panot, cruces y rotondas, parpadeos del suelo

Worktree `/home/user/wt/g1-suelo`, rama `wt-g1-suelo`. Ficheros: `streets.js`, `ground.js`, `suelos.js`, `plazas.js`,
`transporte.js`. Lee `comun.md`, DESARROLLO §6, §9, §12 (asfaltos y aceras por barrio, plazas, metro y bus) y la cabecera de
`suelos.js` (allanado de calles, `FLAT`, `allanado.bin.gz`: si cambias el allanado, regenera el precalculado con
`tools/allanado.sh` o deja que el juego lo calcule; el artefacto publicado no sirve .gz, así que allí siempre se calcula).

## Lo que dijo el jurado de la línea base (antes de la fase: media 4,4 sobre 10; meta 8)
Dos jurados independientes puntuaron las 24 vistas del banco (`git show origin/wt-g1-banco:gta/tools/views_g1.json`;
capturas ANTES en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/g1/banco/antes/a_<vista>.jpg`, hoja `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/g1/banco/hoja_antes.jpg`, todas las notas y defectos
por vista en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/g1/banco/linea_base.json`, rúbrica en `g1/rubrica.md` de la rama wt-g1-banco). Defectos que caen en tu
carril, de más a menos graves: **atácalos primero** (en la etapa en la que estés, y el crítico y el repaso los comprueban
con esas mismas vistas):
1. Marcas viales incoherentes: pasos de cebra rotos, desalineados, duplicados y cortados por el borde de la calzada; líneas sueltas sin lógica; rotondas sin anillo (eix_xamfra, espanya_dron).
2. Parches de asfalto superpuestos de distinto tono con bordes rectos (polígonos que se pisan) y rejillas o rectángulos negros que parecen agujeros (eix_xamfra, sagrada_pie, espanya_dron, gracia_calle).
3. Asfalto negro puro sin grano, juntas ni marcas en casi todas las calles (tibidabo_ctra, eix_calle, sarria_major, gracia_calle).
4. Panot hexagonal gris gigante y uniforme en el Passeig de Gràcia, que ocupa lo que debería ser calzada y acera (pg_pie); losas lisas sin material en la Rambla y el Gòtic (rambla_noche, gotic_calle).
5. Playa de la Barceloneta rota: borde en escalera entre la arena y el paseo, arena con muaré, sin orilla (barceloneta_playa; la arena con G1V y la orilla con G1L).
6. La estrella central de la Plaça de Catalunya es una mancha gris ilegible (pcat_pie).

## Etapa 1 (G1S1) · Plano, sin irregularidades y sin parpadeos
1. **Calles, aceras, plazas y carreteras planas**: sin inclinación lateral, sin escalones ni picos entre polígonos, bordillos
   a la misma altura a lo largo, rasantes suaves. Mide: recorre las calles con `heightAt` y lista los tramos con pendiente
   lateral o saltos; arréglalos en el allanado.
2. **Caminos de montaña** (Collserola, Montjuïc, Tibidabo; `ruralSeg`): rectos y nivelados de lado a lado, con taludes a los
   lados en vez de inclinar el camino; pendiente longitudinal suave; firme de tierra o grava con buena textura.
3. **Parpadeos del suelo**: calzada, acera, plaza, suelos de manzana, pasos de cebra y terreno que se pisan. Un orden de capas
   único (desplazamientos fijos por capa o `zOffset`) y fuera los duplicados. Detector: la misma vista dos veces con un
   desplazamiento mínimo de cámara y comparar píxeles.
4. **Rincones del suelo sin textura** (isletas, medianas, arcenes, solares junto a la calle): interprétalos y decóralos.

## Etapa 2 (G1S2) · Materiales y marcas viales
1. **Asfalto** con desgaste, parches, grietas selladas, tapas de registro y rejillas; **panot de flor** (la baldosa de 4
   pétalos de Barcelona) en las aceras normales, la hexagonal en el Passeig de Gràcia, granito en los bordillos; con relieve
   (normales) y sin mosaico que se note. Respeta el reparto por calle y barrio del día 3.
2. **Cruces y rotondas coherentes**: en cada cruce, pasos de cebra alineados con el paso real (anchura, separación de la
   esquina, xamfrans del Eixample), líneas de detención, líneas de carril y flechas donde toca; en las rotondas (Glòries,
   Espanya, Francesc Macià, Tetuan, Cinc d'Oros, Lesseps…): anillo con sus carriles, triángulos de ceda el paso en las
   entradas, nada de líneas que se cruzan, se cortan o atraviesan isletas. Revisa una muestra amplia (≥ 30 cruces de tipos
   distintos y todas las rotondas grandes) con capturas desde arriba.

## Etapa 3 (G1S3) · Repaso
Notas del crítico; hoja final a 1280×720 (cruces y rotondas desde arriba, calles a pie, caminos de Collserola a pie).
