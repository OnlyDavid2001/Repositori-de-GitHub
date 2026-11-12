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

## S2 · Segunda parte (añadido del usuario)
El usuario ve todavía **muchos sitios sin asfaltar ni pavimentar** y **calles con «polígonos punzantes»**. Con el mismo
patrón de asfaltos y aceras por calle y barrio:
1. **Nada sin pavimentar**: busca todo el suelo urbano que hoy sale con la ortofoto pelada o sin acera (franjas entre la
   calzada y las fachadas, chaflanes, calles anchas y paseos, medianas, aparcamientos en superficie, solares) y pavimenta
   cada cosa con lo que le toca (asfalto, acera, losas de paseo, sauló en los paseos de tierra).
2. **Calles planas**: una calle de 10–12 m de ancho no puede tener picos ni pinchos: el relieve (MDT de 5 m) mete ruido
   y bultos en la calzada. Aplana la sección transversal de cada calle (calzada con su bombeo suave, aceras a su cota con
   el bordillo) y suaviza el perfil longitudinal respetando la pendiente real (la topografía se mantiene: Gràcia, Horta o
   Montjuïc siguen en cuesta). Para eso puedes tocar en `app.js` la carga y la malla del terreno (las alturas bajo las
   calles: dilo en el informe) además de `streets.js`. Cuida que todo lo que se apoya en el suelo (árboles, mobiliario,
   edificios, hitos) siga apoyado.
3. **Encuentro de la fachada con la calle**: el borde inferior de cada bloque tiene que casar con el plano de la acera,
   sin escalones, rendijas ni zonas flotando; la acera llega hasta la línea de fachada a su cota. Si queda un hueco entre
   la acera y la base del edificio, ciérralo desde tu lado (un zócalo o faldón en `streets.js` a lo largo de la línea de
   fachada) y dilo (EDIFICIOS también baja el zócalo de las fachadas un poco por debajo de la cota de la acera).
4. **Paseos y calles anchas**: el paseo central de las ramblas y avenidas, los laterales de la Diagonal, la Gran Via y la
   Meridiana, el Passeig de Gràcia, el Passeig de Sant Joan…: pavimento continuo y correcto, sin huecos (el equipamiento
   lo pone PLAZAS).
Verificación: antes y después a pie en calles en cuesta (Gràcia, Horta), en una calle estrecha del Gòtic, en un chaflán
del Eixample y en un paseo (Sant Joan o Rambla de Catalunya), y desde el dron; el recuento de zonas pavimentadas nuevas.
