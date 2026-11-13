# Condal City · Reglas comunes (léelo entero antes de empezar)

## Qué es
El usuario quiere rehacer cómo se generan **todas las fachadas y plantas bajas** de la ciudad con datos reales de
Barcelona, para que **cada barrio, e incluso cada calle, se reconozca sin cartel**. La especificación es suya y manda:
`/home/user/Repositori-de-GitHub/CONDAL_CITY_PROMPT.md` (Parte 1: las 7 fases; Parte 2: los 22 estilos, los 24
escaparates, las 12 reglas del generador y la chuleta por barrio) y los datos `condal_city_datos.json` en la misma raíz
(~1 MB: **no lo leas entero**; cárgalo con un script). El usuario ha pedido hacer las 7 fases seguidas, con un commit al
final de cada fase, y **parar y avisar si algo empeora el rendimiento o rompe el juego** (antes, intenta arreglarlo).

## Lo que ya se sabe (léelo)
- Plan: `gta/tools/encargos/cc/PLAN.md`. Diagnóstico completo de la Fase 0 (con fichero:línea del generador actual, datos
  por edificio, materiales, puntos de enganche y problemas): `gta/tools/encargos/cc/diagnostico_fase0.md`.
- Herramientas de la Fase 0 en `gta/tools/cc/`: `geo_utm.js` (conversión [lon, lat] ↔ juego verificada),
  `medidor_consola.js` y `fps_eval.js` (FPS), `map_codigo_meta.json` (código de barrio del JSON → índice de META.barris).
- Guía técnica del juego: `gta/DESARROLLO.md` (§2 arquitectura, §3 primitivas, §6 contratos de celda y tipos de
  material K, §9 mobiliario, §11–§14).

## Decisiones de arquitectura (no las cambies sin decirlo en el informe)
- Datos empaquetados por herramienta en `gta/data/condal.json` (el juego no lee el JSON grande ni depende de la red).
- Módulo de consulta `gta/condal.js` → `window.BCN_CONDAL` (se carga antes que los edificios).
- El estilo, la variante, el color y las demás decisiones por edificio se **precalculan con una herramienta** (como
  `mz_partidas.json`) en un fichero de datos por edificio, para que sean iguales de lejos y de cerca y no cuesten al cargar.
- Alturas y huellas son reales y **no se cambian** (sombras, azoteas e hitos dependen de ellas). Los anchos de parcela se
  consiguen partiendo la fachada en parcelas virtuales; los áticos y remontes son cambios visuales de las últimas plantas.
- Los 18 monumentos de la regla 11 ya son hitos: no se tocan.
- Fuera de Barcelona (47 % de los edificios del juego) se usan perfiles sintéticos de periferia.

## Cómo se trabaja
- Rama de trabajo `wt-cc` en el worktree `/home/user/wt/cc` (sale de la principal). Si tu etapa tiene su propio
  worktree, te lo dice tu encargo. Progreso en `gta/tools/encargos/progreso/CC_<etapa>.md`; **se puede cortar** (reinicios,
  límite de uso): confirma y sube a menudo y, si tu progreso ya existe, continúa desde ahí.
- Commits con `git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit …` y el pie
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` / `Claude-Session: https://claude.ai/code/session_01Q64vL5u6wYiVTYwrzNxXbb`.
- Arnés: `cd <worktree>/gta && SIZE=960x540 node tools/shot.js <prefijo> @vistas.json` (cabecera de tools/shot.js; vistas con
  name, x, z, yaw, pitch, hour y walk:true o agl; admiten eval). La máquina tiene 4 núcleos: pocas vistas por ejecución
  (tandas de 3), 640x360 para comprobar y 960x540 para hojas; si el navegador se cae («Target crashed»), repite con menos.
  Capturas en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/<etapa>/`. Nunca `pkill` ni `killall`.
- **Rendimiento**: es prioridad absoluta (lo dice el usuario). Nada de trabajo por fotograma; mide triángulos y llamadas
  antes y después en las tres vistas de la Fase 0 (`gta/tools/cc/fps_eval.js`, `build_views.js`): Eixample a pie 5,2 M
  triángulos / 866 llamadas, Gòtic a pie 6,4 M / 649, aérea 1,3 M / 304. Que no suban de forma apreciable.
- **Sin marcas reales**: rótulos con nombres inventados y en catalán; nada de logotipos.
- Día y noche: lo nuevo tiene que verse bien a las 10:30 y a las 23:00 (preludio: uDusk, uNight, uLate, homeOn, shopOn).
- Nada a medias: lo que no quede bien, se queda como estaba. `node --check` de todos los .js y cero errores y avisos de
  consola en las capturas. Árbol limpio y todo subido al terminar.
