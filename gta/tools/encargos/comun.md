# Encargo común a todos los carriles (léelo entero antes de tu encargo concreto)

Eres un ingeniero gráfico senior con muy buen ojo. Trabajas en «GTA Barcelona», un visor/juego web de Barcelona entera
(Babylon.js 9.35 + ShaderMaterial propios). El usuario lo ve A PIE por la calle y quiere que impresione.

## Lo que ha pedido el usuario (literal, resumido)
1. «Que en todos los negocios se pueda ver lo que hay dentro a través del cristal: si es una peluquería, un forn de pa,
   una librería, una farmacia, un súper… No entrar, pero que se vea.» También los portales y, un poco, algunos pisos
   (los que tengan la persiana abierta).
2. «Que las terrazas estén más detalladas. Que todo se pueda observar mucho más realista, a pie (no desde el dron).
   Mejora el detalle de los cubos de basura, de los Bicing, de absolutísimamente todo.»
3. «Mejora la iluminación: que no se vea como una cosa de SketchUp, que se note el Unreal Engine.»
El juego de referencia de calidad es «Transeúnte» (del mismo usuario): su código, embellecido a partir del minificado
(nombres de variables sin sentido, pero se lee), está en
`/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/ref/transeunte_pretty.js`. Tu encargo te dice qué líneas mirar.

## Cómo está organizado el trabajo
Tres carriles trabajan A LA VEZ, cada uno en su propio árbol de git (worktree) y sobre ficheros distintos:
- LUZ → `app.js`, `lighting.js`, `index.html`
- INTERIORES → `interiors.js`, `facades.js`
- DETALLE → `details.js`, `furniture.js`, `ground.js`, `streets.js`
`geo.js` es compartido: solo se le pueden AÑADIR funciones al final o corregir errores (nada de cambiar firmas).
**No toques ficheros de otro carril.** Si necesitas un cambio en uno, descríbelo en `peticionesAOtrosCarriles` de tu informe.
Cada carril documenta lo suyo en SU sección de `DESARROLLO.md` (LUZ §7, INTERIORES §8, DETALLE §9) y no toca el resto del documento.

## Antes de empezar
1. Lee entero `DESARROLLO.md` de tu worktree (sobre todo §2 cómo se prueba, §4 errores ya cometidos y §6 arquitectura y contratos).
2. Lee los ficheros de tu carril enteros y los contratos que uses de los demás.
3. Mira las capturas de referencia del estado actual («antes»): `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/golden_a/g_<vista>.png`
   (las 22 vistas de `tools/views.json`).

## Contratos que no puedes romper
- Los colores que maneja el cuerpo de un shader están en «espacio de pantalla» (ajustados a ojo). Solo se ilumina con
  `lit()` / `shade()`, lo autoiluminado con `emit(col, gain)`, los reflejos con `envRefl()` y se escribe con `FRAG()`.
  El carril de LUZ está cambiando por dentro esas funciones (HDR lineal, sombras reales, oclusión ambiental, bloom):
  **no pintes sombras falsas ni oscurezcas a mano «para dar volumen»**, porque llegarán sombras y AO de verdad.
  Guía de ganancias para `emit`: luminarias y lámparas 4–8; rótulos luminosos 2–3; interiores de tienda de día 0,9–1,3;
  ventanas encendidas al anochecer 2–3 (usa `uDusk`).
- Todo material se crea con `mkMat` y toda malla se registra con `reg` (así recibirá luz y proyectará sombra).
- Azar por ámbito (`seed`/`env.rnd`): las capas BASE y ORNAMENTO deben salir idénticas; no dependas del orden de llamadas.
- Rendimiento: el detalle fino va en la capa ORNAMENTO (cerca) y lo que deba verse de lejos en BASE; nada de trabajo por
  fotograma que crezca con la ciudad; respeta los topes de triángulos que diga tu encargo y mídelo con `BCN.detailStats()`.
- Nada de marcas ni logotipos reales, ni banderas o símbolos políticos. Rótulos en catalán.

## Cómo trabajar
- El arnés es lento (1–8 min por ejecución): timeout de Bash de 600000 ms, nunca dos ejecuciones tuyas a la vez, capturas
  en `tools/out/<etiqueta>/`. Otros agentes usan la máquina a la vez: paciencia.
- **Mira las imágenes** (Read) después de cada cambio importante, a 960x540 y alguna a 1600x900 (`SIZE=1600x900`), y amplía
  recortes con PIL cuando dudes. Juzga con dureza: ¿parece un juego moderno visto a pie, o sigue pareciendo una maqueta?
- Prioriza lo que más se ve a pie. Calidad antes que cantidad: lo que no te dé tiempo a rematar bien, no lo incluyas.
- Haz commits intermedios en tu rama cada vez que tengas un hito que funcione (sin push). Todos los mensajes de commit acaban con:
  ```
  Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Q64vL5u6wYiVTYwrzNxXbb
  ```
  usando `git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit ...`
- Antes de terminar: `node --check` de todo, las vistas de tu encargo sin errores ni avisos de consola, tu sección de
  `DESARROLLO.md` al día, árbol de trabajo limpio (todo en commits).
- Tu informe final es para el siguiente agente de tu carril y para quien integre: sé concreto (qué hay hecho, cómo se usa,
  qué queda flojo, qué pedir a otros carriles).
