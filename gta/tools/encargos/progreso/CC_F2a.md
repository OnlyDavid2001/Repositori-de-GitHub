# CC_F2a · Fase 2a (arquitectura del kit y bloque 1) — progreso

Estado: **en curso**. Capturas en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/f2a/`
(`mk.js` genera las vistas del escaparate; `lote.sh <hora> <tamaño> <prefijo> estilo:x:z:hMin:hMax …` las captura).

## Hecho
- [x] `gta/kit.js` → `window.BCN_KIT`: registro de estilos (`estilo`) y piezas (`pieza`), acabados nuevos (`acabado`), selector
      provisional (`elige`, desde palette.js), `variante`, `lejos`, `medidas`, escaparate (`?estilo=&v=`, `?pb=`, `force`) y piezas
      del núcleo (arco, frontón, aire, parabólica, cajón, jardinera, placas, pérgola, lamas, urna).
- [x] Despacho en el generador: facades.js (`varOf` del kit, `genB` con desgaste, comercio del sitio, cotas de planta con noble,
      chaflán y piezas de fachada; `pisosV` → pieza `vano` o `vanoDef`; `coronaV` → pieza `corona`), interiors.js (`groundFloor`:
      comercio por tramo, retranqueo y pieza `pb`), palette.js (color de la paleta del estilo), app.js (`BREC.estilo`/`varEst`).
- [x] Desgaste por edificio en el canal auxiliar (`aux.w`), leído por el sombreador de fachadas.
- [x] Bloque 1: `gta/estilos_b1.js` + `gta/piezas_b1.js` (desarrollismo, pueblo, contemporáneo, burgués 60–70, autarquía,
      noucentista; 4 variantes cada uno). Tipos 168 TRAVERTINO y 169 PANEL.
- [x] `gta/tools/cc/vistas_estilos.json` (una vista por estilo) y DESARROLLO.md §16.
- [ ] Hojas de captura (día y noche) y medidas de triángulos.

## Cómo se añade un ESTILO (bloques 2–4: solo en `estilos_bN.js`)
1. En `gta/estilos_bN.js` (cargado tras `piezas_bN.js`; su línea `<script>` va después de las del bloque anterior en index.html):
   ```js
   KIT.estilo('olimpico_80_90', {            // id EXACTO del catálogo (BCN_CONDAL.estilos; si no está, error en consola)
     nombre: 'Olímpic',
     comun: { hp: 2.95, bay: 3.4, acab: 'ladrillo', carp: 'mallorquina', …, pb: 'pb_olimpico', vano: 'vano_olimpico',
              lejos: { muro: 'ladrillo', hp: 2.95, bay: 3.4, vidrio: 0.35 } },
     variantes: [ { nombre: 'bloque de ladrillo con galerías', pl: [5, 8], pal: [0, 3] }, …4 en total ] });
   ```
2. Campos: los de `fachadas_estilos.js` (bay, hp, win, alto, hueco, bal, princ, balP, vuelo, bar, forja, carp, carpCol, marco,
   acab, remate, imposta, recerc, pil, esgr, ultimo, coron, trib, ropa, mac, cw) y los nuevos (cabecera de kit.js): `pl` (plantas
   preferidas: el selector elige variante por la altura real), `pal`/`paleta`, `dg`, `noble {f, …}`, `chaflan {…}`, `aticoP`,
   `pb`, `pbH`, `pbRec` + `pbFr`, `com`, `vano`, `corona`, `fachada [..]`, `lejos`.
3. Con solo parámetros ya sale una fachada (el generador de siempre); las piezas hacen que se reconozca. Las variantes tienen que
   distinguirse por ritmo, ornamento o proporciones, no solo por color.
4. Prueba: `cd gta && SIZE=960x540 Q='?estilo=<id>' node tools/shot.js <salida> @vistas.json` con vistas cuyo `eval` haga
   `BCN.fx.force('estilo:<id>:<v>')` y `BCN.fx.spotAt(x, z, 0, '<id>', 300, hMin, hMax)` (ver `mk.js` en la carpeta de capturas).
   Añade la vista del estilo a `tools/cc/vistas_estilos.json`.

## Cómo se añade una PIEZA (solo en `piezas_bN.js`)
```js
const KIT = window.BCN_KIT, { K, rect, box, … } = window.BCN_GEO;
KIT.pieza('vano_olimpico', function (env, run, q) {   // ranura «vano»: un vano de piso de calle
  if (q.low) return false;                           // false → el vano de siempre
  KIT.T.vano(env, run, q);                           // el de siempre… y algo encima:
  const g = KIT.medidas(q);                          // hueco: tt, ct, st, yt, Vw, jt (vuelo)
  box(env.W1, run.F, g.tt, g.ct, g.yt, g.yt + 0.2, 0, 0.1, env.uV, K.STUCCO);
});
```
- Ranuras y su `q`: cabecera de `kit.js` (pb, pbFr, vano, corona, fachada). Capas: `env.W0` (BASE, hasta ~245 m) y `env.W1`
  (ORNAMENTO, hasta ~110 m; puede ser null: compruébalo). Marco del tramo: `run.F` (u a lo largo, d hacia fuera, y absoluta).
- Colores del edificio: `run.wallC` (muro), `env.kw` (tipo del muro), `env.uV` (remates), `env.shutV`, `env.marcoV`, `env.stone`,
  `env.iron`, `env.wood`, `env.glass`, `env.galM/galP`, `env.losaV`. Los paños de muro con `KIT.T.wr` (llevan el desgaste).
- Nombres únicos en todo el kit (prefijo del estilo para las de ranura). Tipos de material nuevos con `regKind` al cargar, en el
  rango del bloque (b2 176–183, b3 184–191, b4 192–199); un acabado de muro nuevo, con `KIT.acabado(nombre, id)`.
- Piezas ya hechas reutilizables: `arco`, `fronton`, `aire`, `parabolica`, `cajon`, `jardinera`, `placas`, `pergola`, `lamas`,
  `urna` (kit.js) y `puerta`, `ventanaPVC`, `loggia`, `frente_verja`, `frente_arcos`, `antenas`, `pilastras`, `urnas` (piezas_b1.js).
- Nada por fotograma ni texturas por edificio; contar triángulos (lo que va en W0 se ve hasta 245 m).
