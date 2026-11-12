# Etapa EDIFICIOS (E1, E2) · Ningún edificio a medias, manzanas con interior y azoteas de noche

Worktree `/home/user/wt/n3-edif`, rama `wt-n3-edif`. Ficheros tuyos: `facades.js`, `fachadas_estilos.js`, `rooftops.js`,
`palette.js`, `details.js`, `interiors.js` (SOLO los colores de marcos, pilastras, rótulos-faja y zócalos de los bajos
comerciales), `app.js` (SOLO la carga de edificios, `FS_BLD` y su preparación), `index.html` y un módulo nuevo si lo
necesitas (por ejemplo `manzanas.js`). Lee `n3/comun.md` y de DESARROLLO §2, §3, §6, §7.6 y §11.

## E1
1. **Azoteas de noche menos oscuras.** Hoy, a las 23:00, cubiertas (FS_BLD), piezas de `rooftops.js` (los tres niveles) y
   tejados quedan casi negros. El usuario: «no digo que se vean, pero que no quede tan oscuro». Súbelas a una penumbra
   creíble (luz de luna y reflejo del cielo nocturno y de la ciudad: se intuyen formas y tonos), igual de cerca y de lejos,
   sin tocar ventanas, calles ni cielo. Compara con n_aer_23, n_rov_23, n_dron_23 y una vista de azoteas de noche de cerca.
2. **Edificios que siguen siendo cubos.** Encuentra todos los volúmenes que de cerca no tienen fachada de detalle o no
   tienen azotea (por clase, altura, tamaño, forma irregular, estar fuera de Barcelona, torres altas, naves…): cuántos y
   dónde (hoja con ejemplos). Dales a todos fachada de detalle (vivienda de su familia de barrio o, si es evidente, oficinas,
   equipamiento o nave industrial con una tipología propia) y azotea con `rooftops.js`. Excepciones: los hitos (sus
   volúmenes ocultos) y lo que no tenga sentido (casetas mínimas).
3. **Tiendas fundidas con su fachada.** Sin tocar interiores, rótulos, toldos ni escaparates: los marcos, pilastras,
   faja del rótulo y zócalo de cada bajo toman tonos derivados del color de la fachada de su edificio (`d.col`, por ejemplo
   su versión piedra, más oscura o más saturada), estables por edificio.
## E2
4. **Manzanas enteras modeladas como un solo edificio** (sobre todo en el Eixample: una planta que ocupa casi toda la
   manzana de 113 m). Divídelas en fincas a lo largo del perímetro (fachadas de 12–25 m, cada una con su variante, su
   color, ±1 planta y su azotea) y **ahueca el interior de manzana**: anillo de ~20–25 m de fondo con fachadas
   traseras hacia el patio (galerías, balcones pequeños, tendederos, ventanas de cocina y baño), cubiertas de planta baja
   en el patio (talleres, lucernarios) y, en algunas, jardín interior con árboles. Coherente de lejos (el volumen lejano
   también ahuecado o, como mínimo, cubiertas por finca) y sin costuras. Haz lo mismo con los bloques grandes de otros
   barrios si les pasa lo mismo.
5. Repaso de variedad y de coste (triángulos de fachada y de azotea antes y después).

## Verificación
Hoja de «cubos» antes y después (de cerca y desde el dron), las manzanas del Eixample desde el dron y desde el aire (con
patios), una calle con tiendas (antes y después), y la noche a las 23:00 desde el aire y de cerca.
