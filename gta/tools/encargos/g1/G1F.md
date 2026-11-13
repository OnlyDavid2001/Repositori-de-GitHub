# G1F · Fachadas a pie de calle: materiales, ventanas y detalle

Worktree `/home/user/wt/g1-fach`, rama `wt-g1-fach`. Ficheros: `facades.js`, `fachadas_estilos.js`, `details.js`,
`interiors.js`. Lee `comun.md`, DESARROLLO §2, §3, §6, §9, §11 (70 fachadas por barrio) y §12, y los progresos de n2/n3
que tocaron fachadas.

## Lo que dijo el jurado de la línea base (antes de la fase: media 4,4 sobre 10; meta 8)
Dos jurados independientes puntuaron las 24 vistas del banco (`git show origin/wt-g1-banco:gta/tools/views_g1.json`;
capturas ANTES en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/g1/banco/antes/a_<vista>.jpg`, hoja `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/g1/banco/hoja_antes.jpg`, todas las notas y defectos
por vista en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/g1/banco/linea_base.json`, rúbrica en `g1/rubrica.md` de la rama wt-g1-banco). Defectos que caen en tu
carril, de más a menos graves: **atácalos primero** (en la etapa en la que estés, y el crítico y el repaso los comprueban
con esas mismas vistas):
1. Escaparates blancos quemados y vacíos, con rótulos planos, sin reflejo ni interior creíble (eix_calle, eix_noche, gotic_calle).
2. Toldos que atraviesan la calle del Gòtic (gotic_calle).
3. Edificios blancos sin estuco ni zócalo, bloques con ventanas pintadas y la misma rejilla de ventanas en todas partes (sarria_major, poblenou_rambla, eix_noche, coll_desde_ciudad).

## Etapa 1 (G1F1) · Materiales y ventanas
Hoja ANTES a pie de calle (Eixample: Passeig de Gràcia, Enric Granados, un xamfrà; Ciutat Vella: una calle estrecha del
Gòtic; Gràcia; Poblenou; Sarrià), de día y de noche. Después:
1. **Materiales de fachada con relieve**: piedra (arenisca de Montjuïc), estuco y pintura (los colores por barrio que ya
   hay), ladrillo visto (Poblenou, Gràcia, Sant Andreu), cerámica; con normales y rugosidad, manchas de agua bajo las
   cornisas, zócalo más sucio, sin mosaico que se repita.
2. **Ventanas**: cristal que refleja el cielo (Fresnel, del preludio de G1L: usa `envRefl`) y **un interior falso detrás**
   (interior mapping: habitación con fondo, paredes, techo, alguna cortina o mueble; `interiors.js` ya tiene pisos de la
   fase B: amplíalo). De noche, coherente con la iluminación de ventanas actual (`homeOn`, `shopOn`).

## Etapa 2 (G1F2) · Detalle a pie de calle
1. **Balcones de forja en 3D** con fondo real (losa, barandilla de barrotes y pasamanos), **cornisas** y molduras alrededor
   de las ventanas, **persianas** (de librillo y enrollables, a distintas alturas), **portales** (puerta con marco y montante).
2. **Bajos comerciales**: escaparates, persianas metálicas (algunas bajadas), **toldos** de colores sobrios y **rótulos en
   catalán genéricos** («Forn de pa», «Fruites i verdures», «Farmàcia», «Bar», «Llibreria», «Ferreteria», «Perruqueria»…),
   sin marcas.
3. Solo cerca de la cámara (≈150 m) con fundido tramado; de lejos, la fachada actual.
4. **Parpadeos en fachadas**: busca y quita los polígonos coplanarios que se pisan (calcomanías, rótulos, marcos, zócalos):
   desplazamientos o eliminación de duplicados.

## Etapa 3 (G1F3) · Repaso
Notas del crítico, lo más visible primero; hoja final a 1280×720 (de día y de noche, a pie de calle en 6 barrios).

## Peticiones de otros carriles (para el repaso G1F3)
- G1L: de noche desde el dron, menos ventanas encendidas a lo lejos (o más cálidas), para que manden las calles de sodio
  como en la foto del usuario de la madrugada (`noche_tardia_carmel_0a4h.jpg`).
- G1L: los escaparates blancos quemados (el «5,09» de eix_calle) siguen quemando: no hay exposición automática; baja el
  brillo de esos interiores.
