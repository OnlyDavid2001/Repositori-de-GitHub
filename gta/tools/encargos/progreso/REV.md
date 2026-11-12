# REV · Noche 2, revisión — progreso

(El REV anterior, de la revisión de hitos, está en el historial de git de este fichero.)

## Los 10 defectos más visibles (hojas de INT, mirados contra n2/comun.md)
1. **Mancha verde sobre la arena** (playa_pie, 10:30). Causa: la detección de «campos del delta» de FS_TER (y la clase
   C_FARM de nature.js) tomaba como campo los píxeles de transición arena–paseo (r ≈ 0,83, r−g pequeño) y les ponía el
   tono de parcela verdoso. **Arreglado**: los campos se limitan a tonos de ortofoto no muy claros (r < ~0,75 en el
   shader, r < 186 en la máscara de nature.js).
2. **Calles del Eixample peladas desde el aire y franjas de luz de noche** (d600, d600_23, aereo_eixample_23). No eran
   copas brillantes: al quitar los árboles el brillo seguía igual. Eran calles enteras con naranjos (copa de 3 m), que dejan
   ver la acera bañada por las farolas. trees.js multiplicaba el naranjo ×1,8 en calles de calzada estrecha, y en los datos
   las calles del Eixample tienen hw ≈ 3. **Arreglado**: el ajuste de calle estrecha no se aplica al Eixample.
3. **Azoteas planas lisas de cerca** (roof_eix). La rasilla de 28×14 cm se apaga (bien) cuando baja de 2 píxeles, y a
   50–150 m quedaba un color plano. **Arreglado**: rodales de 0,6–2 m (piezas cambiadas, sol, humedad) de media cero y
   apagados con el píxel: el color medio no cambia con la distancia.
4. **Suelo quemado** en explanadas claras de la ortofoto a pie (c_nou_barris; ya pasaba en la rama principal).
   **Mejorado**: rodilla suave en FS_TER sobre los albedos muy claros (no toca la arena).
5. **Rocas de NAT** en forma de pirámide oscura de 20 caras (coll_pie, primer plano). **Mejorado**: una subdivisión con
   abolladuras (80 caras); son pocas instancias.
6. Fachadas: en c_eixample a pie el encuadre casi solo enseña bajos y balcones de primer plano, y no se nota el estilo
   nuevo. No es un defecto del código, pero la vista no lo demuestra. Sin tocar.
7. Lledoners y tipuanas, verde lima muy saturado al sol (c_nou_barris), frente al verde apagado del plátano. Sin tocar.
8. Playa: plana y vacía a pie (no se ven las pasarelas en playa_pie). Sin tocar.
9. Primera vista de cada ejecución del arnés con la ciudad a medio cargar: los totales no se pueden comparar. Es del arnés,
   no del juego. Sin tocar.
10. Collserola: el camino de montaña tiene un pavimento de losas de ciudad (coll_pie). Ya estaba antes. Sin tocar.

## Resultado tras volver a capturar (hoja `n2/rev/hoja_rev.jpg`, INT a la izquierda)
- 1, mancha verde: **resuelto**. La arena de playa_pie queda limpia; solo se ve el paso, gris beis, al paseo.
- 2, Eixample desde el aire: **mejorado, no del todo**. La calle que estaba pelada ya lleva jacarandas y plátanos, y la
  franja de luz nocturna es más corta. Todavía quedan tramos con poca copa y una franja de acera iluminada que llama la
  atención (d600_23).
- 3, azoteas planas: **sin efecto visible**. La captura sale casi idéntica, y tampoco se ven la rasilla ni las manchas
  que ya había. Sospecho que la textura de cubierta de FS_BLD no llega a verse en esta vista (¿fwidth(q), vAx o
  precisión?) y no he dado con la causa. El código añadido es de media cero y no cambia el color medio. Queda pendiente.
- 4, suelo quemado: **mejora marginal**. Probablemente ese suelo es el pavimento de streets.js y no el terreno.
- 5, rocas: **algo mejor**. La silueta es menos piramidal, pero siguen siendo toscas y oscuras.
- Consola limpia en las 15 vistas. node --check pasa en todos los .js.

## Cómo se prueba
Scratchpad `n2/rev/`: `rev.json` (vistas DESPUÉS a las 10:30 y 23:00, con la primera de calentamiento), capturas en `d/`,
hoja `hoja_rev.jpg` (INT a la izquierda, REV a la derecha).
