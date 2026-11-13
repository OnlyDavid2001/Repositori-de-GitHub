# G1V · Árboles, monte y mobiliario urbano; fuera la gente parada

Worktree `/home/user/wt/g1-veg`, rama `wt-g1-veg`. Ficheros: `trees.js`, `nature.js`, `furniture.js`; en `app.js` solo el
material del terreno (`matTer` y su shader); para quitar gente parada, el mínimo imprescindible donde esté. Lee
`comun.md`, DESARROLLO §9 (mobiliario) y §11 (8 especies de árbol, naturaleza con volumen y playa) y los progresos de n2/n3
de árboles.

## Lo que dijo el jurado de la línea base (antes de la fase: media 4,4 sobre 10; meta 8)
Dos jurados independientes puntuaron las 24 vistas del banco (`git show origin/wt-g1-banco:gta/tools/views_g1.json`;
capturas ANTES en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/g1/banco/antes/a_<vista>.jpg`, hoja `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/g1/banco/hoja_antes.jpg`, todas las notas y defectos
por vista en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/g1/banco/linea_base.json`, rúbrica en `g1/rubrica.md` de la rama wt-g1-banco). Defectos que caen en tu
carril, de más a menos graves: **atácalos primero** (en la etapa en la que estés, y el crítico y el repaso los comprueban
con esas mismas vistas):
1. Arbolado poco currado que resta: tutores de madera gigantes con cuatro hojas lima, árboles de bola y copas de tarjeta por todo el juego; calles del Eixample casi sin plátanos (eix_calle, eix_noche, sagrada_pie, eix_dron, glories_dron, coll_camino). El usuario: «elimínalos todos».
2. Monte liso: Montjuïc y Collserola como césped verde liso, sin pinar ni relieve (montjuic_puerto, coll_desde_ciudad, coll_camino).
3. Camino de Collserola con textura borrosa y estirada; hierba verde lisa; cables cruzando el cielo (coll_camino).
4. Banco-jardinera blanco macizo, sin textura y quemado por la luz (pg_pie).
5. Playa sin palmeras: árboles genéricos (barceloneta_playa).

## Etapa 1 (G1V1) · Árboles de verdad
1. **Inventario** de todos los árboles y sus niveles de detalle (calle, plazas, parques, monte, palmeras, arbolitos).
   **Elimina todos los que no estén currados** (bolas, cubos, tarjetas toscas, niveles lejanos pixelados): «todos, todos,
   todos». El usuario prefiere menos árboles y buenos.
2. Los que queden, de calidad: **plátano** (tronco con corteza moteada, ramas, copa de tarjetas de hojas con textura con
   alfa, normales y **viento** en el vértice), **palmeras** (Phoenix y Washingtonia), **pino piñonero y carrasco**, encina; de
   lejos, impostores buenos (varios ángulos o octaédricos, con mipmaps y alfa a cobertura), sin pixelado y con fundido
   tramado. Plátanos en el Eixample y las calles; palmeras en el frente marítimo y plazas; pinos en Montjuïc y Collserola.

## Etapa 2 (G1V2) · Monte y mobiliario
1. **Collserola y Montjuïc**: bosque lejano sin pixelado, **arbustos** (matorral mediterráneo), **hierba** cerca de la
   cámara (tarjetas con viento) y una **buena textura del monte** en `matTer` (tierra, roca, hierba seca, pinaza) que cambie
   con la pendiente y la altura.
2. **Mobiliario donde toca**: farolas de Barcelona según el tipo de calle (separación real, en el bordillo), bancos en
   paseos y plazas, papeleras, fuentes, aparcabicis, **semáforos en los cruces** (en la línea de detención; G1S hace las
   marcas: pon los semáforos en las esquinas reales del cruce) y nada flotando, metido en la calzada o tapando portales.
   Las paradas de bus y bocas de metro son de G1S.
3. **Fuera la gente parada**: busca en todos los módulos figuras de personas (pasajeros del aeropuerto, `persona(...)` en
   `aeropuerto.js`, figuras de escala, siluetas) y quítalas.

## Etapa 3 (G1V3) · Repaso
Notas del crítico; hoja final a 1280×720 (calle arbolada a pie, plaza, frente marítimo, Montjuïc, Collserola de cerca y de
lejos, de día y de noche).
