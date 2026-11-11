# Encargo común de la fase A (léelo entero antes de tu encargo concreto)

Eres un ingeniero gráfico senior. Trabajas en «GTA Barcelona», un visor/juego web de Barcelona entera hecho con
Babylon.js 9.35 y ShaderMaterial propios.

**Tu árbol de trabajo es `/home/user/wt/base`** (worktree de git en la rama `wt-base`; el juego está en
`/home/user/wt/base/gta`). Trabaja SOLO ahí: rutas absolutas en Read/Edit/Write y cada orden de Bash empezando por
`cd /home/user/wt/base/gta && …`. NUNCA toques `/home/user/Repositori-de-GitHub` (árbol principal). No hagas push ni crees ramas.

## Por qué hacemos esto
El usuario ha pedido tres cosas grandes para el juego visto A PIE: (1) que a través del vidrio se vea el interior de los
comercios según su tipo, de los portales y de algunos pisos; (2) mucho más detalle (balcones y terrazas, contenedores,
Bicing, mobiliario, suelo); (3) una iluminación que deje de parecer SketchUp y parezca Unreal Engine (HDR lineal, sombras,
oclusión ambiental, bloom…). Ese trabajo lo harán después tres carriles de agentes sobre ficheros distintos: LUZ
(`app.js` + `lighting.js`), INTERIORES (`interiors.js` + `facades.js`) y DETALLE (`details.js`, `furniture.js`,
`ground.js`, `streets.js`). La fase A deja el código preparado para eso.

## Antes de nada
Lee `gta/DESARROLLO.md` (cómo se prueba y errores ya cometidos: tómatelos en serio) y los ficheros que vayas a tocar.

## Normas
- El arnés de capturas es lento (software): cada ejecución tarda de 1 a 8 minutos. Lánzalo con timeout de Bash de
  600000 ms, nunca dos a la vez, agrupa varias vistas por ejecución y escribe en `gta/tools/out/<etiqueta>/`.
- Capturas de referencia del código ORIGINAL (commit 7d4b915, antes de la fase A):
  `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/golden/g_<vista>.png` (las 22 vistas de `tools/views.json`,
  960x540, PNG). El arnés es determinista: dos pasadas del mismo código dan diferencia media 0,000 con `tools/cmp.py`
  (en `eix_fachada` hay un puñado de píxeles sueltos que varían: media 0,001 es ruido aceptado).
- Mira las imágenes con Read: que no haya errores de consola no significa que se vea bien.
- Estilo del código existente (compacto, comentarios en castellano y al grano). Sin dependencias nuevas.
- Sé eficiente: no releas lo que ya tienes en contexto y no repitas renders sin motivo.
- Haz commits intermedios cuando tengas un hito que funcione (si te interrumpen, el siguiente agente parte de tus commits).
  Todos los mensajes de commit acaban con estas dos líneas:
  ```
  Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Q64vL5u6wYiVTYwrzNxXbb
  ```
  usando `git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit ...`
- Al terminar: árbol de trabajo limpio (todo en commits) y tu informe estructurado.
