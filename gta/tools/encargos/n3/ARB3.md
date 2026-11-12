# Etapa ÁRBOLES 3 (ARB3) · Menos árboles en la ciudad para ver bien en tercera persona

Worktree `/home/user/wt/n3-arb`, rama `wt-n3-arb`. Ficheros tuyos: `trees.js` y, de `streets.js`, SOLO la colocación de
árboles y alcorques (`treesOf`, `TR.pick`, los alcorques y sus mallas de árbol); el resto de `streets.js` (aceras,
pavimentos, bordillos, `FS_WALK`) es de SUELOS, que lo está cambiando a la vez: no lo toques para que la fusión sea limpia.
Lee `n3/comun.md`, el progreso de ARB y ARB2 (`gta/tools/encargos/progreso/ARB*.md`) y DESARROLLO §11.

## Qué pide el usuario (textual, resumido)
«Como será un juego donde lo más importante será la visibilidad en tercera persona: reduce un 50 % la densidad de
árboles en la ciudad, manteniendo igual los de fuera; en calles no más anchas que las ramblas elimina los árboles, eso sí,
dejando el cuadrado de tierra para que se interprete que ahí tendría que haber un árbol, o simula que lo acaban de plantar
y es muy pequeñito y lleva soporte; en calles como las de Ciutat Vella y el centro histórico, directamente sácalos.»

## Reglas (interpretación acordada)
1. **Fuera de la ciudad, igual**: la vegetación de `nature.js` (montaña, parques, delta) no se toca.
2. **Calles normales** (todas las que no son avenidas anchas, ramblas ni paseos con andén central): ningún árbol adulto.
   En cada posición de árbol queda el **alcorque** (cuadrado de tierra, a veces con su reja de fundición) o, en parte de
   ellos, un **árbol recién plantado**: tronco fino de 1,8–2,5 m, copita mínima de pocas hojas, dos o tres tutores de madera
   con sus atados y, a veces, protector metálico. Reparto estable por tramo (más alcorques vacíos que plantones).
3. **Avenidas anchas, ramblas y paseos** (Diagonal, Gran Via, Passeig de Gràcia, Passeig de Sant Joan, Meridiana,
   Paral·lel, Rambla de Catalunya, La Rambla, Rambla del Raval, Rambla del Poblenou…): siguen con árboles adultos, pero a
   **la mitad de densidad** (uno sí y uno no, manteniendo el ritmo), y en los huecos el mismo alcorque o plantón.
   El total de árboles adultos de calle en la ciudad debe bajar al menos a la mitad (mídelo).
4. **Ciutat Vella y centro histórico** (Gòtic, Raval, Sant Pere - Santa Caterina - la Ribera, Barceloneta): fuera
   árboles y alcorques de las calles; solo las ramblas y paseos anchos del distrito siguen la regla 3.
5. Mantén la noche (copas oscuras desde arriba, luz de farola por debajo) y las sombras; el coste debe bajar.

## Verificación
Antes y después: a pie y en tercera persona (cámara ~3 m detrás y 2,5 m por encima de un peatón imaginario) en una calle
del Eixample, Rambla de Catalunya, el Passeig de Sant Joan, una calle del Gòtic y una de Gràcia; desde el dron sobre el
Eixample; hoja con el alcorque vacío y el plantón de cerca. Recuento de árboles adultos, plantones y alcorques antes y
después, y coste.
