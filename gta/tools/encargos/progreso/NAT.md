# Progreso · etapa NAT (naturaleza con volumen y arena de playa)

Rama `wt-n2-nat`. Ficheros: `nature.js` (nuevo), `app.js` (solo `FS_TER`, `FS_SEA` y una línea `addMod('nat', …)` antes
de la luz), `index.html` (el `<script>` de `nature.js`), `tools/views_nat.json` (vistas de esta etapa).

## Hecho
- `nature.js` (`BCN_NATURE`, módulo de primer nivel, `ctx.mods.nat`): máscara de clases leída una vez de `ground.webp`
  en la CPU; celdas de 128 m con semilla propia; 7 tipos (pino piñonero, pino carrasco, encina, arbusto, mata de hierba,
  caña, roca) en thin instances con tres niveles (close < 70 m con sombra, near hasta ~320 m, mid hasta ~900 m) y fundido
  tramado; no invade calles (`city.roadDist`) ni edificios (`city.coverAt`).
- `FS_TER`: relieve de copas (normal torcida por la misma trama de claros y oscuros) y arena de playa (grano, ondas,
  rastrillo, huellas, franja mojada con brillo).
- `FS_SEA`: agua somera sobre la arena y espuma de orilla con frentes de ola rotos por ruido.

## Pendiente
- (se actualiza al final de la etapa)

## Cómo se prueba
```bash
cd gta
python3 - <<'E'   # vistas de la etapa, a las 10:30 y a las 23:00
import json; v=json.load(open('tools/views_nat.json')); out=[]
for h in (10.5, 23):
  for x in v: y=dict(x); y['hour']=h; y['name']=x['name']+('_d' if h<12 else '_n'); out.append(y)
json.dump(out, open('/tmp/nat_views.json','w'))
E
SIZE=640x360 DRAW=40000 node tools/shot.js tools/out/nat @/tmp/nat_views.json
```
`BCN.detailStats().nat` da instancias por especie y nivel `[close, near, mid]` y triángulos. `?nat=0` lo apaga.
