# CC_F3a · Fase 3a (precálculo por edificio y carga) — progreso

Estado: terminado (F3a). Siguiente: F3b (fusionar antes `origin/wt-cc`). Rama `wt-cc-f3` (worktree `/home/user/wt/cc-f3`). Capturas y registros en
`/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/f3a/` (gen*.log: salidas del generador;
fps_antes.log / fps_despues.log; a*_*.jpg capturas).

## Hecho
- [x] `gta/tools/cc/generador.js` → `gta/data/condal_edif.json` (reglas 0, 1, 2, 3, 4, 5 y 7; ver cabecera y DESARROLLO §17).
- [x] `gta/edif.js` → `window.BCN_EDIF` (carga, firma, accesores, `parcela(b, k)`, `lejosCode`); index.html lo carga tras kit.js.
- [x] app.js: `BCN_EDIF.listo` antes de leer los edificios (`BREC.edif`), código lejano en `uv.w`; FS_BLD con estilo.
- [x] kit.js (mínimo): `elige` toma estilo, variante y color precalculados. facades.js: `varOf` sin reajuste con el fichero,
      ático y `V.remonte` del fichero, desgaste del fichero, `setFlag` conserva los bits altos, expone `layoutB` y `esChaflan`.
- [x] condal.js: F8 con estilo y variante asignados y la línea «Generador».
- [x] Commit 756b0c5 (generador, datos, carga, volumen lejano, F8).
- [x] Arreglo tras las capturas: FS_BLD leía la bandera con `mod(vInfo.w, 2.0)`; con el código lejano en los bits altos, la
      interpolación del varying deja 32766 en 32765,999 y mod da ~2 → muros tramados (medio descartados) sin fachada delante
      (naves del Carmel y de l'Hospitalet a pie). Ahora `mod(floor(vInfo.w + 0.5), 2.0)` y lo mismo al leer el código. Comprobado.
- [x] Capturas (`a1`–`a7`, `antes_*` con el código de antes en `antes/gta`): Gòtic a pie y aire, Dreta a pie (día y 23:00) y
      Eixample aire, Carmel aire y a pie con F8, Gràcia a 45 m (transición lejos-cerca) y de noche, Raval a pie con F8,
      l'Hospitalet (periferia, perfil sintético) a pie y aire con F8, Montbau aire (antes/después). Cero errores de consola.
- [x] Medidas (fps_eval, vistas de la Fase 0; `fps_antes.log` / `fps_despues2.log`):
      Eixample a pie 866 llamadas / 5,15 M → 866 / 5,14 M · Gòtic a pie 647 / 6,57 M → 647 / 6,72 M (+2 %, sombras;
      la parte de fachadas baja de 1,14 M a 0,98 M) · aérea 304 / 1,32 M (Fase 0: 304 / 1,3 M). Los fps de SwiftShader en esta
      máquina compartida (0,01–0,09) no sirven para comparar. Carga: 17,7–23,3 s antes y 20,6–22,3 s después en tandas
      seguidas con la máquina libre (ruido de ±5 s por los otros agentes): sin diferencia apreciable.

## Estadística (gen2.log)
- 303 787 edificios (272 396 residenciales; 132 682 en la periferia). Rachas por acera: 13 482 aceras, racha media 1,98;
  contiguos con misma variante + color = 0 (acera y pegados). 18 035 parcelas virtuales, 18 692 áticos, 7 655 remontes.
- Reparto frente a fachadas_pct: error medio 1,36 pp (ponderado 1,23). Raval 0,21, Gòtic 0,27, Dreta 0,58, Gràcia 0,55.

## Flojo
- La corrección por altura desvía el reparto en los barrios con muchos volúmenes bajos de OSM: Carmel (desarrollismo 10,8 %
  frente a 38,1 %), Horta (pueblo 50,5 frente a 17,3), Torre Baró (error máx. 37,8 pp). Los multiplicadores (0,2–5) solo
  compensan una planta fuera de rango; es lo que pide la regla 1 (no se cambian alturas), pero se nota en esos barrios.
- Naves (clase 0 con tipo nave) reciben estilo residencial bajo (casa de poble, autoconstrucció) como antes del F3a.
