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

- Capturas ANTES/DESPUÉS hechas (640x360): 6 calles (eixample, gracia, ciutat_vella, poblenou, sant_gervasi, nou_barris)
  a las 10:30 y 3 a las 23:00, aereo_eixample, aereo_alto, coll_pie, playa_pie, roof_eix y la secuencia d1500/d600/d200/d50
  de PALETA. **Sin errores ni avisos de consola** en las 5 ejecuciones. `node --check` de los 27 .js: bien.
- Azoteas tras la fusión con FACHADAS: se inician y se ven (roof: 298 celdas, 71 k piezas, 255 k triángulos en c_eixample;
  casetas, depósitos, antenas y tendederos visibles en roof_eix de día y de noche).
- Hojas: `n2/int/hoja_int_calles.jpg`, `hoja_int_dia.jpg`, `hoja_int_noche.jpg` (ANTES a la izquierda).

## Coste (triángulos activos por vista, ANTES → DESPUÉS)
Total de escena casi igual: d50 3,31→3,31 M, d200 3,41→3,40 M, d600 2,45→2,51 M, coll_pie 4,55→4,59 M, c_gracia 3,11→3,21 M,
c_ciutat_vella 3,10→3,33 M (+7 %), c_nou_barris 1,29→1,40 M (+9 %), playa_pie 0,20→0,24 M; c_eixample/aereo_eixample del
ANTES son de un primer encuadre con la ciudad aún cargando y no son comparables. Por partes en DESPUÉS: fachadas 1,1–3,4 M
(algo menos que antes: poblenou 2,34→1,71 M), azoteas 0,16–0,33 M, árboles 0,25–0,90 M (instancias, sombras incluidas),
naturaleza 0,3 M en Collserola y 22 k a pie. Sombras (cerca/lejos) similares. Tiempo por vista en el arnés +20–40 %
(máquina compartida, medida ruidosa).

## Lo flojo visto en las hojas (para REV)
- playa_pie 10:30: mancha verde borrosa sobre la arena en primer plano (¿verde del terreno o de la máscara de NAT que
  se cuela en la playa?).
- d600_23 / aereo_eixample_23: líneas muy brillantes por el centro de Rambla de Catalunya/Passeig de Gràcia (copas
  iluminadas de ARB, más amarillas y extensas que antes).
- roof_eix: las cubiertas planas cercanas se ven de color liso (salmón/crema) sin el granulado de tejas de antes.
- c_nou_barris: el suelo de la plaza se ve blanco quemado (también en ANTES).

## Pendiente
- Nada de INT. REV: lo flojo de arriba y los informes de las etapas.

## Cómo se prueba
Scratchpad `n2/int/`: `dia.json` y `noche.json` (DESPUÉS, con `BCN.fx.calle`), `a_*.json` (ANTES, rama principal
exportada en `n2/int/antes/gta`). `run_d.sh` / `run_a.sh`.
