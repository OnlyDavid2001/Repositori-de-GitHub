# Etapa SUELOS (S) · Asfaltos y aceras según la calle y el barrio

Worktree `/home/user/wt/n3-suelos`, rama `wt-n3-suelos`. Ficheros tuyos: `streets.js` (aceras, bordillos, pavimentos),
de `app.js` SOLO el shader de calzada (`FS_ROAD`) y su preparación, texturas nuevas en `gta/data/` si las necesitas
(mejor procedurales o pequeñas) y tu progreso. Lee `n3/comun.md` y de DESARROLLO §6, §7.6 y §9.

## Qué hay que hacer
1. **Asfalto en 5–6 estados**: nuevo (oscuro y uniforme, marcas nítidas), seminuevo, gastado normal (más claro, algún
   parche), bastante gastado (grietas, parches, marcas apagadas) y muy gastado (grietas en malla, baches, muchos parches,
   líneas casi borradas). Asignación estable por tramo de calle según la importancia de la vía y el nivel económico del
   barrio (tabla de `n3/comun.md`): la Diagonal, la Gran Via o el Passeig de Gràcia seminuevos; Sarrià, les Tres Torres o
   Pedralbes nuevos; el Eixample normal; Ciutat Meridiana, Torre Baró, el Besòs o la periferia (Hospitalet, Cornellà) más
   maltrechos; con algo de azar por tramo, cambios en los cruces y parches sueltos. Nada de parpadeo ni moiré de lejos.
2. **Aceras en 5–6 modelos**: el panot de flor estándar (20×20, cuatro pétalos, gris), el hexagonal del Passeig de
   Gràcia (el diseño de motivos marinos, gris verdoso), el de la Diagonal (distinto del estándar), una baldosa nueva y
   limpia, una sucia y dejada (manchas, chicles, piezas rotas, suciedad en juntas) y losas grandes modernas (zonas nuevas
   como el 22@ o Diagonal Mar). Mismo reparto por calle y barrio; el desgaste de la acera acompaña al del asfalto.
3. Bordillos y alcorques coherentes con cada modelo. De noche, con las farolas, que se lean los cambios sin brillos raros.

## Verificación
Antes y después, a pie, de día y a las 23:00: la Diagonal, el Passeig de Gràcia, una calle del Eixample, una de Sarrià,
una del Raval, una de Ciutat Meridiana y una de L'Hospitalet o Cornellà; y una vista desde el dron. Coste.
