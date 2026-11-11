# Hitos · Catálogo (etapas R1 y R2)

Worktree: `/home/user/wt/hitos-cat` (rama `wt-hitos-cat`). Ficheros tuyos: `gta/HITOS.md`, `gta/data/hitos_catalogo.json`
y lo que necesites en `gta/tools/hitos/` (scripts de consulta). Ningún otro.

El usuario pidió «haz un listado y guárdalo». El listado es `gta/HITOS.md` (tabla legible, por lotes) y su versión para
máquinas `gta/data/hitos_catalogo.json`. Los agentes que construirán los hitos lo usarán como entrada: tiene que ser
fiable (posición, tamaño, forma) y decir qué hay hoy en el juego en ese sitio.

## R1 — El listado con sus datos reales
Parte de la lista semilla de abajo (~120 nombres): corrígela, quita lo que caiga fuera del mapa o no merezca la pena y
añade lo que falte, hasta quedarte con **unos 100 hitos** repartidos en cinco lotes (`a`…`e`) de carga parecida.
Para cada uno, una ficha:
```json
{ "id": "torre_glories", "nombre": "Torre Glòries", "lote": "c", "nivel": "A",
  "cat": "torre", "lat": 41.4035, "lon": 2.1895, "confianza": "alta|media|baja",
  "alto": 144, "ancho": 39, "largo": 39, "rot": 0,
  "forma": "bala de planta elíptica que se afila arriba; piel de lamas de vidrio sobre chapa de colores (rojos abajo, azules arriba)",
  "rasgos": ["silueta de bala", "degradado rojo-azul", "de noche, LED de colores"],
  "colores": ["#b23a3a", "#2b5fa8", "#cfd8e3"], "noche": "led", "fuente": "wikidata / OSM / memoria" }
```
- `nivel`: **A** (icono, modelo propio; unos 25–30), **B** (arquetipo con parámetros; unos 40–45) o **C** (basta
  retocar el volumen existente: color, estilo, altura; el resto).
- `alto`, `ancho`, `largo` en metros reales; `rot` = rumbo del eje largo en grados desde el norte hacia el este.
- `forma` y `rasgos`: lo que hay que modelar para que se reconozca, en una o dos líneas. La Sagrada Família y el Camp Nou
  van **como acabados** (Sagrada Família: 18 torres —12 apóstoles, 4 evangelistas de 135 m, la de María de 138 m con la
  estrella y la de Jesucristo de 172,5 m con la cruz—, naves, ábside, claustro y fachada de la Gloria; Camp Nou: el
  estadio remodelado, tres graderíos continuos y la gran cubierta en anillo).
- Coordenadas: las de memoria pueden desviarse 100–200 m. Para lo alto y aislado basta (R2 lo encaja con los datos del
  juego); para lo que está entre medianeras (Casa Batlló, Palau de la Música, Casa Vicens…) hace falta precisión:
  búscalas (Wikidata, OpenStreetMap, Wikipedia) con las herramientas web. No pongas datos personales en las consultas.
  Marca `confianza`.

## R2 — Encaje en el mapa del juego
1. Ajusta la conversión lat/lon → mundo con los 31 `poi` de `gta/data/meta.json` (mínimos cuadrados; comprueba el
   error) y calcula `x`, `z` de cada hito y su cota `y`.
2. Para cada hito, mira qué hay HOY en el juego en ese punto: los edificios del registro que coinciden (por posición,
   tamaño de planta y altura), con su índice, área, altura y clase. Escribe `edificios: [índices…]` (los que el hito
   sustituye o retoca), `en_datos` (una frase: «1 volumen de 5 400 m² y 28 m» / «19 agujas + naves» / «no existe») y
   corrige `x`, `z`, `rot`, `ancho`, `largo` con la planta real cuando la haya. Los datos están en `data/buildings*.png`
   (contenedores binarios; mira en `app.js` cómo se leen y qué guarda `BREC`). Lo más cómodo es un script de Node o una
   página en el arnés que los cargue una vez y responda a todas las consultas.
3. Marca lo dudoso (`confianza: "baja"` y una nota) y lo que cae fuera del área con edificios.
4. Saca una hoja de contacto del «antes» de los hitos de nivel A (una vista aérea oblicua de cada uno a 2–3 veces su
   tamaño) en `<scratchpad>/hitos/antes_A.jpg`, para poder enseñar la diferencia.

## Entrega
`gta/HITOS.md` (tabla por lotes: nombre, nivel, qué es, alto, cómo se va a hacer, qué hay hoy) y
`gta/data/hitos_catalogo.json` (lista de fichas completas). Commit y push. En el informe: cuántos hitos por lote y
nivel, los dudosos y los que no están en los datos.

## Lista semilla (corrígela)
- **Lote a · Gaudí y modernismo**: Sagrada Família (acabada), La Pedrera, Casa Batlló, Casa Amatller, Park Güell (sala
  hipóstila, escalinata del drac, pavellons de l'entrada, plaça amb el banc ondulat), Hospital de Sant Pau, Palau de la
  Música, Casa Vicens, Palau Güell, Torre Bellesguard, Casa de les Punxes, Pavellons Güell, Col·legi de les Teresianes,
  Casa Lleó Morera, Fundació Tàpies, Plaça de toros Monumental, Universitat de Barcelona (edifici històric).
- **Lote b · Deporte y Montjuïc**: Camp Nou (acabado), Palau Blaugrana, Estadi Olímpic Lluís Companys, Palau Sant Jordi,
  Torre de Calatrava, Palau Nacional (MNAC), Font Màgica, Quatre Columnes, Torres Venecianes, Las Arenas, Castell de
  Montjuïc, Piscines Picornell, Pavelló Mies van der Rohe, CaixaForum, palaus de la Fira, Poble Espanyol, Fundació
  Miró, Teatre Grec, Far de Montjuïc, Velòdrom d'Horta.
- **Lote c · Torres y frente marítimo**: Torre Glòries, Hotel Arts, Torre Mapfre, Peix d'Or, Hotel W, Torres «la Caixa»
  (Diagonal), Edifici Fòrum, Pèrgola fotovoltaica del Fòrum, Torre Diagonal ZeroZero, Hotel Princess, torres Illa del
  Mar, Torre Mare Nostrum, World Trade Center, Edifici Colón, Torre Urquinaona, Torre Banc Sabadell (Diagonal),
  Edificis Trade, Hotel Melià Sky, Torre Melina, Ciutat de la Justícia, Hotel Porta Fira, Torre Realia, Hesperia Tower,
  Mercat dels Encants, Disseny Hub, Tres Xemeneies del Besòs, Tres Xemeneies del Paral·lel, Torre de les Aigües del Besòs.
- **Lote d · Ciutat Vella, puerto y monumentos**: Monument a Colom, Catedral, Santa Maria del Mar, Santa Maria del Pi,
  Basílica de la Mercè, Arc de Triomf, Cascada de la Ciutadella, Parlament de Catalunya, Castell dels Tres Dragons,
  Estació de França, Mercat de Santa Caterina, Boqueria, Liceu, MACBA, Drassanes, Palau de la Generalitat i Ajuntament,
  El Born CCM, Duana del port, Maremagnum i Rambla de Mar, Aquàrium, Palau de Mar, Correus, Torre Jaume I, Torre Sant
  Sebastià, Cap de Barcelona, Estel Ferit, El Llapis (Cinc d'Oros), Dona i Ocell, Monument a Macià.
- **Lote e · Collserola, zona alta, estaciones y otros**: Torre de Collserola, Temple del Sagrat Cor, Parc d'atraccions
  del Tibidabo (noria, Talaia), Observatori Fabra, Monestir de Pedralbes, Palau Reial de Pedralbes, CosmoCaixa, Búnquers
  del Carmel, Estació de Sants, Hotel Torre Catalunya, torres-far de l'Espanya Industrial, Hospital Clínic, Hospital de
  la Vall d'Hebron, Auditori, Teatre Nacional de Catalunya, Mistos, Pont de Bac de Roda, Aeroport (T1, T2 i torre de
  control), grues del port, Torre Baró, Fabra i Coats.
