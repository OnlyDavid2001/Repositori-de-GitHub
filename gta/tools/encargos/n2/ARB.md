# Etapa ÁRBOLES (ARB) · 6–7 especies en lugar de una

Worktree `/home/user/wt/n2-arb`, rama `wt-n2-arb`. Ficheros tuyos: **`streets.js`** (árboles: geometría, materiales,
instancias, niveles de detalle) y **`trees.js`** (nuevo, si quieres sacar ahí las especies), `index.html` (solo para tu
script) y tu progreso. Lee `n2/comun.md` y de DESARROLLO.md §6 y §9 (y lo que haya de árboles).

## Qué hay que hacer
Hoy todos los árboles de calle son plátanos de sombra (tres niveles: completo, copa de tarjetas, lejano). Mantén las MISMAS
posiciones y alcorques, pero reparte 6–7 especies típicas de Barcelona, con coherencia por calle (toda una calle o un
tramo con la misma especie, como en la realidad) y según el tipo de calle y el barrio:
- plátano de sombra (sigue siendo el más común en el Eixample y las grandes avenidas);
- almez o lledoner (calles estrechas, Gràcia, Ciutat Vella);
- naranjo amargo (calles y plazas pequeñas, porte bajo y redondo, con naranjas);
- palmera (Washingtonia o Phoenix: paseos marítimos, Diagonal Mar, algunas plazas y paseos);
- jacaranda (copa más abierta, con flor lila en parte de los ejemplares);
- tipuana (avenidas, copa amplia y aparasolada);
- pino piñonero (algunos paseos y plazas, y cerca de Montjuïc).
Cada especie con sus tres niveles de detalle (silueta y color reconocibles también de lejos), con variación de tamaño y de
tono por ejemplar. De día, desde el aire, que no parezcan bolas verde oscuro iguales (la etapa DÍA lo pidió: verdes de
plátano y pino creíbles y que se note la luz). De noche, conserva lo que hay: copas oscuras vistas desde arriba y la luz
de las farolas por debajo (`FS_TREE`, `treeGlow`, rejilla `tLamp` de `lampBath`).
Rendimiento: mismos ejemplares, triángulos parecidos a los de ahora (mídelo) y las sombras (`cast`) como ahora.

## Verificación
Hoja con las 7 especies de cerca (a 6–8 m) y a media distancia, calles de varios barrios a pie a las 10:30, una vista
desde el dron a las 10:30 y a las 23:00. Etapa «ARB».
