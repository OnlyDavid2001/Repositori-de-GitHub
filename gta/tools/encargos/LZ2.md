# Carril LUZ · LZ2 — Sombras del sol (plan ligero)

Ficheros tuyos: `app.js`, `lighting.js`, `index.html` y `DESARROLLO.md` §7. De `DESARROLLO.md` §6 lee 6.4, 6.5 y 6.12, y
el §7 que dejó LZ1 (preludio HDR, cadena de postproceso, calidades).

## Meta
Sombras reales del sol: los edificios sombrean las calles, los árboles la acera, los balcones la fachada. Es lo que más
quita el aspecto de maqueta. Versión sencilla y robusta; no persigas la perfección.

## Diseño (decidido)
- **Dos cascadas** cuadradas centradas en la cámara y ajustadas al téxel (que no tiemblen al moverse): la cercana ±45 m
  (detalle a pie) y la lejana ±400 m (masas de edificios). Escálalas con la altura de la cámara sobre el suelo para que
  desde el dron sigan cubriendo lo que se ve (por ejemplo ×max(1, altura/50)). Más allá de la lejana, sin sombra, con
  transición suave.
- **Mapa de profundidad** desde el sol (proyección ortográfica), una textura por cascada (2048² en Alta), pintado con un
  `ShaderMaterial` de profundidad mínimo. Proyectan las mallas del registro `reg` marcadas con `cast`: volúmenes de
  edificios (enteros, sin el descarte de muros de cerca), relieve, árboles y mobiliario; las capas de fachada, solo en
  la cascada cercana si el coste lo permite (dan la sombra de los balcones). Una variante del material por formato de
  vértice si hace falta (mallas normales e instancias finas de los árboles; las copas, recortadas por alfa si es barato
  y, si no, macizas).
- **Actualización perezosa**: una cascada se repinta solo si la cámara se ha movido más de una fracción de su tamaño, ha
  cambiado la hora o han entrado o salido mallas del registro; como mucho una cascada por fotograma. En modo captura
  todo debe estar al día antes de la foto.
- **Recepción** en el preludio: `sunVis(posición, normal)` (LZ1 dejó el hueco) multiplica SOLO la luz directa del sol y
  su brillo especular. Sesgo por pendiente más desplazamiento por la normal, PCF 3×3 (en Alta, más muestras o con
  rotación por píxel) y mezcla entre cascadas. Uniformes y muestreadores globales para TODOS los materiales de `mkMat`.
- **Calidades** (añádelo a la tabla de LZ1): Baja sin sombras; Media a 1024; Alta a 2048 con mejor filtro.
  Por el camino LDR (`?ldr=1`) pueden no existir.

## Verificación
A pie a las 17:00 (sombras largas), 13:00 (cortas) y 9:30: `eix_acera, eix_calzada, rambla_pie, gotic_calle, pg_acera`;
desde el aire: `dron_bajo, aereo_eixample`. Comprueba: sin acné ni sombras despegadas en las fachadas; las de los árboles
caen sobre la acera; no tiemblan al mover la cámara medio metro (dos capturas desplazadas); la costura entre cascadas no
se nota. Sin errores ni avisos de consola.

## Entrega
Commits subidos, §7 ampliado (cascadas, actualización, sesgos, calidades, cómo se depura) y notas para LZ3.
