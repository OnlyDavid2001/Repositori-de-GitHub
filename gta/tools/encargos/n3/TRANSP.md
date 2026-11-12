# Etapa TRANSPORTE (T) · Bocas de metro de todas las líneas y paradas de bus

Worktree `/home/user/wt/n3-transp`, rama `wt-n3-transp`. Ficheros tuyos: `transporte.js` (nuevo),
`gta/data/transporte_*.json`, `index.html` (tu script) y una línea `addMod` en `app.js`. Lee `n3/comun.md` y de
DESARROLLO §3, §6 y §9 (mobiliario: no te pongas encima de bancos, contenedores, bicing ni terrazas).

## Qué hay que hacer
1. **Estaciones de metro de TODAS las líneas**: L1, L2, L3, L4, L5, L9 Nord, L9 Sud, L10 Nord, L10 Sud y L11 (y, si da
   tiempo, las líneas de FGC que funcionan como metro: L6, L7, L8 y L12). Lista de estaciones por línea y posición con
   Nominatim (nombre de la estación + «Barcelona», tipo estación de metro o entrada), caché en
   `gta/data/transporte_metro.json` con las líneas de cada estación (correspondencias). Si Nominatim da las entradas
   (`subway_entrance`), úsalas; si no, coloca 2–4 bocas por estación en las aceras de los cruces cercanos, sin invadir
   calzada ni edificios.
2. **Boca de metro con forma y profundidad**: hueco en la acera con la escalera que baja (12–20 peldaños visibles y un
   rellano en penumbra al fondo, sin modelar el metro por dentro), paredes laterales alicatadas, pasamanos, barandilla de
   protección alrededor, poste o tótem con «METRO» y las insignias de las líneas (número y color de cada línea: L1 roja,
   L2 morada, L3 verde, L4 amarilla, L5 azul, L9 naranja, L10 azul claro, L11 verde claro…; sin el logotipo real), y
   variantes: alguna con marquesina de vidrio y algún ascensor de cristal. De noche, el tótem iluminado y luz que sube de
   la escalera.
3. **Paradas de bus**: marquesina genérica (cubierta, vidrio trasero, banco, panel lateral con un plano genérico, poste
   con la placa de la parada y números de línea), en las calles principales cada ~350–450 m alternando aceras cerca de los
   cruces, y postes sencillos en calles secundarias con bus; sin chocar con árboles, terrazas, contenedores ni Bicing.
   Si Nominatim te da paradas reales, mejor.
4. Niveles de detalle y coste medido.

## Verificación
Hoja con bocas de metro de 6 líneas distintas de cerca (día y noche), una calle con parada de bus, una vista desde el
dron de un cruce con boca y parada, y el recuento: estaciones y bocas por línea, paradas de bus.
