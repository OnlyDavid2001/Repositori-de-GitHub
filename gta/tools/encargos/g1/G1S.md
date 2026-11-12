# G1S · Suelo: calles y caminos planos, asfalto y panot, cruces y rotondas, parpadeos del suelo

Worktree `/home/user/wt/g1-suelo`, rama `wt-g1-suelo`. Ficheros: `streets.js`, `ground.js`, `suelos.js`, `plazas.js`,
`transporte.js`. Lee `comun.md`, DESARROLLO §6, §9, §12 (asfaltos y aceras por barrio, plazas, metro y bus) y la cabecera de
`suelos.js` (allanado de calles, `FLAT`, `allanado.bin.gz`: si cambias el allanado, regenera el precalculado con
`tools/allanado.sh` o deja que el juego lo calcule; el artefacto publicado no sirve .gz, así que allí siempre se calcula).

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
