# Etapa PLAZAS (P1, P2) · Todas las plazas de Barcelona

Worktree `/home/user/wt/n3-plazas`, rama `wt-n3-plazas`. Ficheros tuyos: `plazas.js` (nuevo), `gta/data/plazas_*.json`,
`index.html` (tu script) y una línea `addMod` en `app.js`. No toques `streets.js` (es de SUELOS): el pavimento propio de
cada plaza va en tu módulo (malla de suelo ligeramente por encima, con desplazamiento de profundidad, o lo que veas).
Lee `n3/comun.md` y de DESARROLLO §3, §6, §9 y §10 (los hitos: no los tapes ni los dupliques).

## P1
1. **Inventario de TODAS las plazas**: las que tienen nombre, con Nominatim (busca «plaça» y «plaza» dentro de Barcelona,
   paginando con `exclude_place_ids`, y pide `polygon_geojson=1` para el contorno; guarda la caché), más las explanadas
   peatonales sin nombre que ya marca el campo de aceras de `streets.js` como plaza. Fichero `gta/data/plazas.json` con
   nombre, contorno en coordenadas del juego, superficie y tipo.
2. **Equipamiento genérico** según tamaño y forma: pavimento (losas de granito, panot, sauló), bancos (el «banc romàntic»
   de madera y fundición y bancos modernos de piedra), árboles en alcorque o jardinera, farolas, fuente de beber tipo
   Canaletes, juegos infantiles sobre suelo de caucho, pérgolas, quiosco de prensa, aparcabicis, mesa de ping-pong… con
   una composición creíble (paseos, zona de juegos, zona de sombra), sin invadir calzadas ni edificios. Niveles de detalle,
   sombras de lo cercano y luz de noche (farolas).
3. **Plazas singulares, fieles a la realidad** (mira fotos de referencia en Wikimedia Commons si puedes): **Plaça de
   Catalunya** (el gran espacio central con la rosa de los vientos de piedra, las dos fuentes grandes, los parterres, las
   esculturas, las balaustradas y los árboles, el monumento a Macià), **Plaça d'Espanya** (la gran fuente monumental del
   centro de la rotonda; las Torres Venecianes y las Arenas ya son hitos), **Glòries** (el parque nuevo, la Canòpia Urbana
   de celosía, la gran pradera) y **Plaça de Lesseps** (la plaza dura con arbolado y su urbanización actual).
## P2
4. **Más plazas singulares**: Plaça Reial (soportales, palmeras, farolas de seis brazos de Gaudí, la fuente de las Tres
   Gracias), Plaça de la Catedral y la avenida, Plaça Sant Jaume, Plaça del Rei, Sant Felip Neri, Plaça del Pi y Sant
   Josep Oriol, Plaça de la Vila de Gràcia (torre del reloj), del Sol, del Diamant, de la Virreina, de la Revolució,
   Universitat, Urquinaona, Tetuan (monumento), Francesc Macià (óvalo con estanque), Molina, Sants, la Concòrdia, Sant Vicenç
   de Sarrià, el Sortidor, la Rambla del Raval (con su gato), Plaça dels Àngels (MACBA) y las que encuentres importantes.
5. **Paseos y ramblas** (añadido del usuario: «tema de paseos, tema de calles anchas, corrígelo y perfecciónalo»): La
   Rambla, Rambla de Catalunya, Passeig de Sant Joan, Rambla del Poblenou, Passeig de Lluís Companys, Rambla del Raval,
   Rambla de Sants, Passeig de Picasso, los andenes centrales y laterales de la Diagonal, la Gran Via y la Meridiana, el
   Passeig de Gràcia (aceras anchas, bancos-farola de Gaudí): bancos, farolas, quioscos, parterres, alcorques, fuentes y la
   continuidad del paseo central, sin huecos. (El pavimento y el asfalto los hace SUELOS; tú el equipamiento.)
6. **El resto**: todas las demás con el equipamiento genérico. Repaso de coste y hoja final.

## Verificación
Hoja ANTES/DESPUÉS de las plazas singulares a pie y desde el dron (10:30) y de noche (23:00) y una hoja con 20 plazas
genéricas. Dilo en el informe: cuántas plazas hay en total y cuántas tienen tratamiento singular.
