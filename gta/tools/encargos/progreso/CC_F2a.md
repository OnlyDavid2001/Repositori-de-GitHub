# CC_F2a · Fase 2a (arquitectura del kit y bloque 1) — progreso

Estado: **terminada** (arquitectura + bloque 1). Capturas en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/f2a/`
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
- [x] Hojas de captura (día y noche), vistas naturales (sin forzar) y medidas de triángulos y llamadas.

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

## Verificación (capturas en la carpeta de arriba)
- `hoja_b1_dia.jpg`: 6 estilos × 4 variantes a las 10:30 (filas: desarrollismo, pueblo, contemporáneo, burgués, autarquía,
  noucentista; columnas: variantes 0–3); `hoja_d_<estilo>.jpg` las mismas a 1280 de ancho. `hoja_b1_noche.jpg` (23:00,
  variantes 0 y 2 de cada estilo). `hoja_natural.jpg`: las 6 vistas de `tools/cc/vistas_estilos.json` sin forzar (el estilo que
  sale del selector en su barrio). Cada hoja con la página cargada con `?estilo=<id>` y la variante forzada en marcha con
  `BCN.fx.force('estilo:<id>:<v>')` sobre el MISMO edificio (para comparar variantes): por eso el color del muro es el de la
  variante que el selector le dio al cargar (p. ej. la torre de gresite del desarrollismo sale sobre ladrillo rojo y la de ladrillo
  de autarquía sobre beis); cargada con `&v=<n>`, el color es el de la variante.
- ¿Se reconoce? desarrollismo: ladrillo, cantos de forjado, terrazas hundidas (abiertas o cerradas con aluminio), PVC con cajón,
  aires, galerías, torre con antepechos de gresite de color, soportales. Pueblo: alero de teja, balcones de forja, puerta de madera
  con recercado (en arco a veces), patio con verja, portalón de taller. Contemporáneo: muro cortina, celosías de lamas sobre el
  balcón de vidrio, marcos de hormigón con panel de madera, rasgaduras de hotel con paneles de color; planta baja de vidrio.
  Burgués: travertino en la planta baja con ventana alta y jardineras, portal con marco de piedra y visera, rampa de garaje,
  terrazas corridas con plantas colgantes y toldos, ático con pérgola, persianas de madera oscura. Autarquía: estuco sobrio,
  placa de protegida, ladrillo con recercados de piedra, soportales de arcos. Noucentista: frontones, pilastras gigantes, portal
  con pilastras y frontón, almohadillado, urnas sobre la balaustrada, oficinas con planta baja alta.
- Errores y avisos de consola: **cero** en todas las ejecuciones (día, noche, naturales).

## Medidas (fps_eval.js, calidad media, 960×540; vistas de la Fase 0, selector natural)
- Eixample a pie: **5.194.012** triángulos / **866** llamadas (antes 5,2 M / 866); 29,0 s/fotograma con SwiftShader.
- Gòtic a pie: **6.332.852** / **644** (antes 6,40 M / 649); 39,5 s/fotograma (ruido de SwiftShader: en F1 fue 37,3 s).
- Aérea: **1.315.294** / **304** (igual que antes); 4,0 s/fotograma.
- Carga 17–20 s, como antes (el selector hace una consulta `BCN_CONDAL.at` y 22 pesos por vivienda al hornear el color).
- Nada por fotograma: todo se hornea al cargar o se construye en las celdas de siempre. Las piezas nuevas van en W0 solo cuando
  dan la silueta (loggias, soportales, marcos, jardineras, antenas); el detalle fino, en W1.
- La primera ejecución de fps_eval se cortó en la segunda vista por el `timeout` de mi script (no del juego); repetida aparte.

## Lo flojo / para los siguientes
- El escaparate en marcha (`BCN.fx.force`) no cambia el color del volumen (está horneado al cargar): para ver el color de una
  variante, cargar con `?estilo=<id>&v=<n>`.
- Comercio provisional por tramo con la densidad real (regla 8 simplificada): la Fase 4 lo sustituye (por vano, calles
  principales y esquinas).
- Sin rachas por acera ni «variante + color» contra el vecino (solo variante contra los vecinos pegados de índice menor): Fase 3.
- `?pb=` y `com` solo afectan a edificios con estilo del kit; los estilos aún sin kit siguen con todos los bajos comerciales.
- Chaflán: detección geométrica en el generador (tramo a ~45°); la Fase 3 puede precalcularlo. No hay «+1 planta» (alturas reales).
- En F8 la «variante» de un estilo aún sin kit sale como «variante 1» (VAR = 0): es el estilo que tocará cuando su bloque exista.
- Para los bloques 2–4: si necesitan algo del núcleo (una ranura nueva, otro campo en `q`), pedirlo; no tocar kit.js ni el
  generador desde los bloques.
