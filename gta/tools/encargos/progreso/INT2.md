# INT2 · Fusión final de la fase gráfica 1 (arreglos + fachadas)

Rama `wt-g1-int`. Capturas en `scratchpad/g1/int/final/` (`f_<vista>.jpg`, `run.log`, `run_final.py`; instantánea del
código en `scratchpad/g1/int/snap/final`).

## Estado: EN CURSO

## 1 · Fusiones (`--no-ff`)
- [x] wt-g1-fx-suelo → a5f4f65 (app.js cinta/faldón, RCOL[9], FS_ROAD; streets.js urbanSeg; plazas.js)
- [x] wt-g1-fx-edificios → b5fbe02 (app.js FS_BLD cubiertas; rooftops.js; landmarks_c/e.js)
- [x] wt-g1-fx-luzveg → 5187ced (app.js setHour/FS_SEA/FS_TER; trees.js; furniture.js; lighting.js)
Ninguna dio conflicto de texto: en `app.js` cada arreglo tocó trozos distintos. `node --check` de todos los .js: limpio.

## 2 · Fachadas (wt-g1-fach)
Ya estaba fusionada en f60c302 (G1F3 cerrada: progreso con hecho/no hecho/coste/peticiones, árbol limpio, rama subida en
f0669cd). La rama no tiene commits nuevos desde entonces (`wt-g1-int..wt-g1-fach` vacío): nada que fusionar.
