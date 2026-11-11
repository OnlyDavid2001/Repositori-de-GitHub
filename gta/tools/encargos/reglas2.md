# Reglas adicionales (prevalecen sobre `comun.md` donde se contradigan)

`<scratchpad>` = `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad`

## 1. Reanudación (hay cortes: límite de uso, reinicios de la máquina)
- Al empezar: `git log --oneline -8`, `git status --short` y, si existe, lee `gta/tools/encargos/progreso/<ETAPA>.md`.
  Si ya hay trabajo de TU etapa (commits o cambios sin confirmar de un agente que se quedó a medias), NO empieces de
  cero: revisa el diff, comprueba que funciona y sigue por lo pendiente.
- Mantén `gta/tools/encargos/progreso/<ETAPA>.md` (hecho / en curso / pendiente / trampas descubiertas / cómo se prueba
  lo tuyo), breve, y actualízalo en cada commit de hito.
- Tras cada hito que funcione: commit Y `git push -u origin <tu-rama>` (si falla la red, reintenta hasta 4 veces
  esperando 2, 4, 8 y 16 s). Nunca dejes más de ~30 minutos de trabajo sin confirmar y subir.
- Trabaja solo dentro de tu worktree. No toques `/home/user/Repositori-de-GitHub` ni los worktrees de otros carriles.

## 2. Economía (el presupuesto de uso es limitado: cada llamada cuesta)
- De `DESARROLLO.md` lee §2, §4 y §5 y solo los apartados de §6 que diga tu etapa. No releas lo ya leído; localiza con Grep.
- Para iterar: capturas pequeñas y pocas vistas por ejecución (`SIZE=640x360 FMT=jpg`); las PNG a 960x540 solo en la
  verificación final. Abre solo las imágenes que necesites para decidir.
- Piensa antes de lanzar el arnés (cada ejecución son minutos) y agrupa las ediciones. Mientras corre, espera con UN
  solo comando (`until grep -q '^exit' registro.log; do sleep 10; done`), no con sondeos cortos.
- Cíñete al alcance de TU etapa (lo dice el mensaje que te ha lanzado). Lo que quede fuera, anótalo en el progreso.
- Dos agentes usan la máquina a la vez (4 núcleos): nunca lances dos ejecuciones del arnés a la vez.

## 3. Fallos de base
Si un contrato de base (`geo.js`, `mkMat`, `reg`, `ctx.city`, hooks…) tiene un fallo que te bloquea, arréglalo con el
cambio mínimo en un commit SEPARADO cuyo mensaje empiece por «BASE:», aunque el fichero sea de otro carril, y cuéntalo
en el informe (quien integre lo llevará a los demás carriles).

## 4. Estado de partida
- Las referencias «antes» son las 24 vistas de `tools/views.json`, en `<scratchpad>/golden_a/g_<vista>.png`.
  OJO: comparar píxel a píxel solo vale con la misma lista de vistas, en el mismo orden y en una sola ejecución (§2).
- `node tools/geo_test.js` prueba `geo.js` sin navegador (1 s).
- Defecto conocido sin resolver (es del carril INTERIORES): en `gotic_calle`, abajo a la izquierda (≈ x 85–165,
  y 300–480 px a 960x540), una cuña oscura y fina sobre el muro, junto a una pilastra. No existía antes de la fase A2 y
  no es mobiliario (ocultarlo no cambia nada): probablemente planta baja de fachada (cota de acera `walkAt` o una jamba).
  Hay un sondeo de píxel a medio hacer en `<scratchpad>/a2/mk_probe.js`.
