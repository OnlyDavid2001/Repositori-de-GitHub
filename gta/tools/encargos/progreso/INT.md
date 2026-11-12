# INT · Noche 2, integración — progreso

(El INT anterior, de la integración de hitos, está en el historial de git de este fichero.)

## Hecho
- Worktree `/home/user/wt/n2-int`, rama `wt-n2-int` desde `gta-barcelona-fachadas-detalle` (36e00b1).
- Fusionadas por orden `wt-n2-az` (AZ3, 4863fce), `wt-n2-fx` (FX3, 14f22b3), `wt-n2-arb` (ARB2, 771c83f) y `wt-n2-nat`
  (NAT2, ed364c0). Único conflicto: `app.js`, la carga de módulos tras las calles (AZ añadía `addMod('roof')`, NAT
  `addMod('nat')`): se quedan los dos, azoteas y luego naturaleza, y la luz sigue la última. El resto de app.js
  (FS_BLD/carga de edificios de PALETA, FS_TER/FS_SEA/uShore de NATURALEZA) se fusionó solo.
- `index.html`: `rooftops.js` y `nature.js` movidos justo antes de `lighting.js` (venían después) como pide el encargo.
- Ids de material sin choques: 16–19 núcleo, 100 FXPIEDRA, 101 FXVIDRIO, 120 TEJA (`regKind` lanzaría si se repitieran).
- Las dos líneas que rooftops.js sustituye en el shader de facades.js siguen idénticas tras FACHADAS.
- DESARROLLO.md: nueva sección **11. Noche 2** (paleta, azoteas, fachadas por barrio, árboles, naturaleza, rango de sombra
  variable, ids, depuración) que resuelve las peticiones de documentación de todas las etapas.

## Pendiente
- Capturas ANTES/DESPUÉS (10:30 y 23:00) y medida de coste.

## Cómo se prueba
Scratchpad `n2/int/`: `dia.json` y `noche.json` (DESPUÉS, con `BCN.fx.calle`), `a_*.json` (ANTES, rama principal
exportada en `n2/int/antes/gta`). `run_d.sh` / `run_a.sh`.
