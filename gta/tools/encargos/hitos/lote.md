# Hitos · Lote (etapas La, Lb, Lc, Ld, Le)

Tu worktree y tu letra de lote te los dice el mensaje que te ha lanzado (`/home/user/wt/hitos-<lote>`, rama
`wt-hitos-<lote>`). Fichero tuyo: `gta/landmarks_<lote>.js` (y tu fichero de progreso). **Ningún otro.**

## Lee primero
1. `gta/tools/encargos/hitos/comun.md` (qué pide el usuario, criterio de éxito, reglas de trabajo).
2. `gta/DESARROLLO.md` §10 «Hitos» (la ficha, los tipos de material, la biblioteca de arquetipos, la herramienta de hojas).
3. Los tres hitos de ejemplo ya hechos (Torre Glòries, Arc de Triomf, Hotel W) en `gta/landmarks_c.js` y `gta/landmarks_d.js`:
   son el listón de calidad y el patrón de código.
4. Tus hitos: los de `"lote": "<tu letra>"` en `gta/data/hitos_catalogo.json` (posición, tamaño, forma, rasgos, colores,
   luz de noche, edificios que sustituye). El resumen legible está en `gta/HITOS.md`.

## Qué hacer
1. **Todos los hitos de tu lote**, por este orden: nivel A (modelo propio), nivel B (arquetipos con parámetros), nivel C
   (retoque del volumen existente). Antes de cada uno de nivel A, apunta en dos líneas su silueta y sus 2–3 rasgos
   inconfundibles: modela eso y nada más.
2. **Bien colocados**: posición, giro y tamaño del catálogo; compruébalo en una vista aérea contra las calles y los
   edificios vecinos (que no pise la calzada, que no flote ni se hunda en una ladera, que el giro sea el de verdad).
3. **Luz de noche** de cada uno (`focos`, `led`, `ventanas` o `nada`).
4. **Presupuesto**: un icono, 3 000–12 000 triángulos; uno normal, 300–2 000; el lote entero, ≤ 90 000.
5. **Míralo**: con la herramienta de hojas, una hoja de día con todos tus hitos y otra a las 22:00 con los de nivel A.
   Juzga con dureza: ¿se reconoce de un vistazo? Corrige lo que no; lo que no consigas, dilo en el informe.

## Reglas
- Si un hito del catálogo cae fuera del mapa, o su posición es dudosa y no lo localizas, sáltalo y anótalo.
- Si te falta algo del núcleo (un arquetipo, un tipo de material), resuélvelo con funciones locales en TU fichero y
  anótalo en el informe; no edites `landmarks.js` ni otros lotes.
- Un constructor nunca debe lanzar excepciones con datos raros (plantas vacías, cotas indefinidas): comprueba y sigue.
- Nada de marcas, escudos ni logotipos.

## Entrega
Commits y push de tu rama; tu progreso al día; informe con la lista de hitos hechos (id, nivel, triángulos), los
saltados y los que todavía no se parecen lo bastante.
