# Progreso · etapa AZ (PALETA: color fijo a cualquier distancia y azoteas con detalle)

## Diagnóstico (capturas ANTES: secuencia 1500/600/200/50 m de la misma manzana del Eixample, 10:30)
1. `FS_BLD` teñía de día las fachadas lejanas con un mosaico (`tq`) elegido con `hash21(vInfo.y*0.137 + seed*7.3,
   vCol.r*31 + vCol.g*17)`; la fachada de detalle (`facades.js`, `d.col` = PAL sin mosaico) no lo tenía: a 170–310 m el
   edificio pasaba de ocre/ladrillo a crema pálido.
2. Ese hash y el de las cubiertas (`hash21(vCol.rg*91.7 + seed)`) amplifican el error de interpolación del color de vértice
   (`sin(…)*43758`): el «granulado» de lejos era RUIDO POR PÍXEL dentro de cada fachada y cada cubierta (no variedad por
   edificio), distinto según la distancia y el ángulo.
3. Ruidos de grano (`vnoise` de muro liso y de cubierta, ésta en coordenadas de mundo) sin prefiltrar: moiré de lejos.
4. Ninguna capa de detalle tapa las cubiertas (la coronación de `details.js` solo va en el borde), así que la cubierta de
   cerca es siempre la del volumen simple: basta con que su color sea estable.

## Hecho
- `palette.js` (nuevo): `window.BCN_PAL`, color de fachada y de cubierta por edificio y por familia de barrio (15 familias de
  `comun.md`, 6–12 colores con pesos por familia), determinista por índice de edificio + semilla, con ±5 % de brillo propio.
  Tabla de 64 colores de cubierta (azotea: rasilla rojiza o baldosa clara · teja árabe · tela asfáltica · grava), con pesos
  por familia (más teja en casas bajas y Sarrià, nada en torres). El índice de cubierta viaja en los 2 bits bajos de cada
  canal del color de vértice (pérdida de 3/255 en el color de fachada, invisible).
- `app.js`: barrios (cajas y `BCN_BARRI`) ANTES de cargar los edificios; color horneado al cargar (`BCN_PAL.pick`, con caché de
  familia por casilla de 60 m); `FS_BLD`: sin mosaico `tq` ni paleta de cubiertas por hash; de día la cubierta sale de la
  textura `uRoofPal` (64×1, sin filtrar) con un grano ESTABLE de losas de 9 m (coordenadas locales) que se funde a su media
  exacta cuando la losa baja de ~3 píxeles; ruido de muro liso y de cubierta prefiltrados por tamaño de píxel; de noche la
  paleta se acerca un 60 % al tono medio de antes y las cubiertas nocturnas son las de siempre. `addMod('roof', …)` tras las
  calles (la luz sigue siendo la última).
- `facades.js` (una línea, `bget`): `d.col` = `BCN_PAL.wall(b)`, el mismo color horneado del volumen.
- `rooftops.js` (nuevo): módulo de primer nivel (§6.3) con celdas de 100 m de `ctx.city`; plan por edificio con
  `seed(b, 90, k)` (casetas de escalera con puerta y rejilla, depósitos de fibrocemento o metálicos sobre patas, antenas
  con dipolos y piloto rojo en las altas, parabólicas, tendederos con ropa, aparatos de aire, claraboyas, placas solares,
  barandilla en un lado si no hay coronación de detalle). Completo a ≤ 250 m (K.PBR, sombra, layer `furn`), cajas
  sencillas de 250 a 700 m (sin sombra, layer `roof`). Cota de cubierta leída de la malla de volúmenes (respeta los hitos).
- Coste medido (vistas de prueba): 5 000–11 000 elementos en ~190 celdas; 40–220 mil triángulos cerca y 33–61 mil lejos.

## Pendiente / flojo
- El cambio cerca ↔ lejos de las azoteas (250 m) es un salto, sin fundido tramado.
- De noche, la fachada de DETALLE usa el color nuevo sin compensación (FS_DET no es de este carril): los ladrillos se ven
  algo más oscuros bajo las farolas que antes.
- Entre `FS_BLD` (`lit`) y `FS_DET` (`shade` + textura de estuco) sigue habiendo una diferencia de sombreado (no de color).
- DESARROLLO.md (§6.1 tabla de ficheros, §6.2 `BCN_PAL`, §6.5 layer `roof`, §6.6 ámbito `seed(b, 90, k)`) sin actualizar: es
  común; lo apunto como petición.

## Cómo se prueba
- `node tools/shot.js <prefijo> @<vistas.json>` con la secuencia (1500/600/200/50 m, 10:30), `n600` (23:00), `aereo` (13:00,
  `maxDist` 40000) y `roof_eix`/`roof_gra` (dron a 60–70 m, 13:00). Vistas en el scratchpad de la etapa (`after.json`).
- `BCN.detailStats().roof` → `{ cells, items, trisNear, trisFar, queue }`.
