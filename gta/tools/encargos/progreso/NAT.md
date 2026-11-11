# Progreso · etapa NAT (naturaleza con volumen y arena de playa)

Rama `wt-n2-nat`. Ficheros: `nature.js` (nuevo), `app.js` (solo `FS_TER`, `FS_SEA` y una línea `addMod('nat', …)` justo
antes de la luz), `index.html` (el `<script>` de `nature.js`, tras los hitos), `tools/views_nat.json` (vistas de la etapa).

## Hecho
- **`nature.js`** (`BCN_NATURE`, módulo de primer nivel, `ctx.mods.nat`, capa de registro `nature`):
  - máscara de clases leída UNA vez de `ground.webp` en la CPU al cargar (bosque, parque, prado, campo, matorral, arena,
    mar; 5 m por píxel) y color medio a 10 m; se limpia una franja de 10 m de matas alrededor de arena y mar;
  - celdas de 128 m con semilla propia (`ci`), muestras cada 2,8 m con desplazamiento al azar; 7 tipos: pino piñonero,
    pino carrasco, encina (por rodales de ~60 m y por cota), arbusto, mata de hierba alta, caña, roca (en pendiente);
    no invade calles (`city.roadDist`) ni edificios (`city.coverAt`, también a 2,5 m alrededor de los árboles);
    pendiente > ~40° → sin árbol (a veces, roca); el matorral pardo solo por encima de 70 m (el Carmel, la Rovira);
  - thin instances por tipo y nivel: árboles 0–130 m (geometría completa, ~110–150 tri.), 100–310 m (~35–45 tri.),
    260–700 m (~16 tri., solo el 40 % y 1,2× más grandes); arbustos 0–80 / 60–210 / 170–420 m (50 %); hierba < 115 m,
    cañas < 150 m, rocas < 250 m. Fundido tramado entre niveles (sin saltos). Solo los árboles a < 60 m proyectan sombra;
  - color: el de la ortofoto bajo la planta con la MISMA conversión a oliva de `FS_TER`; racimos de hojas por ruido,
    silueta deshilachada (descarte en el borde de la copa), luz algo envolvente; de noche `×(1 − 0,55·uNight)` como el monte;
  - pasarelas de madera en la arena: una por bloque de 120 m con playa, desde el borde de tierra hasta ~12 m del agua,
    tablones con juntas (una malla fija, ~21,6 k tri. en total);
  - nada por fotograma: plan de celdas al moverse > 24 m, generación con presupuesto de 4 ms por `update`, selección de
    instancias al moverse > 24 m o al acabar celdas; `flush()` para el arnés; `setRange(0)` lo apaga; `?nat=0` también.
- **`FS_TER`**: relieve de copas (la misma trama `cw` de claros y oscuros tuerce la normal: bultos con cara al sol y cara
  en sombra; se apaga con el tamaño del píxel); arena de playa (color de arena de Barcelona, grano fino, ondulaciones del
  viento, pasadas del rastrillo, huellas; cada escala se apaga con el píxel); la franja del relieve que la ortofoto pinta
  de mar pasa a arena mojada (más oscura y con brillo vía `shade`); mosaico de parcelas y surcos en los campos del delta.
- **`FS_SEA`**: agua somera más clara junto a la costa y espuma: línea pegada al borde y frentes de ola rotos por ruido.

## Coste (SwiftShader, 480×270; `BCN.detailStats().nat`)
- Collserola a pie (coll_pie): ~0,66 M tri. de vegetación (antes de los niveles: 2,9 M). Montjuïc/Carmel ~0,2–0,5 M.
- Playa: < 1 k tri. de plantas + 21,6 k de pasarelas. Avión (> 700 m sobre el suelo): 0.
- Carga: + ~1,5–3,9 s para leer la máscara en SwiftShader (en un navegador normal, bastante menos). Generar una celda:
  0,4–2 ms.
- Sombras: los árboles a < 60 m entran en las dos cascadas (coll_pie: 385 k tri. en la lejana).

## Pendiente / flojo
- En el mirador de los búnkers del Carmel salen pinos encima de la explanada (la máscara la pinta de matorral y no hay
  calle ni edificio que la proteja): un tronco tapa media vista `carmel`. Faltaría excluir miradores/plazas (p. ej. por hitos).
- La franja mojada sigue los píxeles de 5 m de la ortofoto: desde el dron se ven manchas oscuras irregulares a media playa
  y, a pie, una banda amarillenta ondulada junto al agua (brillo del `shade` mojado).
- Desde el avión el cambio es pequeño (relieve de copas y mosaico de campos): las plantas 3D acaban a 700 m.
- La espuma de la orilla depende de `coast.png` (téxel de 16 m) y el borde del relieve no coincide exacto con él: la línea
  de espuma es suave pero no siempre pegada a la arena. El relieve acaba en un escalón (~1,5 m) en el agua.
- Las copas de cerca siguen leyéndose algo «de bolas»; faltaría una textura de hojas con alfa.
- `DESARROLLO.md` (común) no recoge aún `nature.js` ni la capa `nature` (§6.1, §6.5): petición al carril que lo lleve.

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
`BCN.detailStats().nat` da, por especie, instancias por nivel `[sombra, n0, n1, n2]` y triángulos totales.
