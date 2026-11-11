# GTA Barcelona — guía de desarrollo

Visor/juego web de Barcelona entera hecho con Babylon.js y shaders propios. Este documento es la referencia
para cualquiera (persona o agente) que toque el código: cómo está montado, cómo se prueba y qué errores ya
nos hemos comido para no repetirlos.

## 1. Qué hay en la carpeta

| Fichero | Papel |
| --- | --- |
| `index.html` | Página, interfaz y orden de carga de scripts (§6.1). Babylon y earcut vienen de jsDelivr; todo lo demás es local. |
| `geo.js` | `BCN_GEO`: tipos de material `K` y su registro, geometría acumulada `GB` con sus primitivas y azar compartido. Sin dependencias. |
| `app.js` | Motor, carga de datos, relieve, calles (cintas), volúmenes simples de edificios, mar, cielo, luz/hora, cámara e interfaz. Define el preludio GLSL con `FRAG`, `mkMat`, el registro de mallas `reg` y el contexto `ctx`, y arranca los módulos. |
| `facades.js` | NÚCLEO de las fachadas de detalle (capas BASE y ORNAMENTO): shader de detalle, índices espaciales y consultas (`ctx.city`), disposición de cada edificio, esqueleto del generador, celdas y topes. |
| `interiors.js` | Hook de `facades.js`: planta baja (portal, comercios, ventanas con reja), atlas de rótulos y lista de comercios. |
| `details.js` | Hook de `facades.js`: pisos (ventanas, balcones, tribunas…), coronación y tramos lisos y ciegos. |
| `streets.js` | NÚCLEO de las calles de detalle: aceras de panot con bordillo, árboles en tres niveles (instancias), celdas; da el contexto de celda a sus hooks. |
| `furniture.js` | Hook de `streets.js`: farolas, papeleras, bancos, contenedores y estaciones de Bicing. |
| `ground.js` | Suelo: bloque GLSL del asfalto de cerca (lo inserta `app.js`) y hook de `streets.js` con las marcas viales (pasos de cebra). |
| `lighting.js` | Módulo de iluminación: vacío y cableado (se inicia el último y se llama cada fotograma). |
| `data/` | Datos de la ciudad (contenedores binarios envueltos en PNG), texturas y los props de Transeúnte (`tr_props.*`). |
| `tools/` | Arnés de capturas (`shot.js`), comparador (`cmp.py`) y vistas con nombre (`views.json`). No se publica. |

Qué fichero es de quién, firmas y contratos entre módulos: **§6**.

Unidades: metros. `x` = este, `z` = norte, `y` = altura. `yaw`: el frente es `(sin yaw, ·, cos yaw)`;
`pitch` positivo mira hacia abajo. La ciudad mide ~22,4 × 24,8 km y las coordenadas llegan a ~25 000.

## 2. Cómo se prueba (obligatorio antes de dar nada por bueno)

No hay GPU: se usa Chromium sin cabeza con SwiftShader (software). Carga en ~5 s y cada vista tarda de
10 a 60 s. El bucle de render se para y los fotogramas se piden a mano, así que **los FPS no se pueden medir aquí**.

```bash
cd gta
node tools/shot.js tools/out/prueba eix_acera,eix_tienda,rambla_pie      # vistas con nombre (tools/views.json)
node tools/shot.js tools/out/p '[{"x":12064.6,"z":14541,"walk":true,"yaw":-0.78,"pitch":0}]'
SIZE=1600x900 FMT=png HOUR=19.5 node tools/shot.js tools/out/tarde eix_fachada
python3 tools/cmp.py a.png b.png diff.png                               # diferencia media, máxima y % de píxeles
```

- Cada vista: `{x, z, y | agl | walk:true, yaw, pitch, hour?, fx?, st?, frames?, eval?}`. `walk:true` pone el ojo a 1,75 m
  del terreno; `agl` son metros sobre el terreno; `eval` es JS que se ejecuta antes de renderizar.
- El arnés imprime todos los errores y avisos de consola y sale con código 1 si hubo errores. **Un shader que no
  compila deja `BCN.ready` sin activar y el arnés agota el tiempo**: mira siempre la salida.
- `window.BCN` expone el estado (`scene`, `engine`, `cam`, `st`, `fx`, `streets`, `light`, `heightAt`, `applyView`, `setHour`,
  `ctx`, `reg`, `fxFlush()` —construye de golpe todo el detalle pendiente de todos los módulos— y `detailStats()`). Lista completa: §6.3.
- En modo captura (`#shot` en la URL) el tiempo de animación se congela para que las capturas sean reproducibles.
- **Hay que abrir las imágenes y mirarlas.** Que no haya errores de consola no significa que se vea bien.
  Mira siempre al menos dos vistas a pie y, si tocas algo que se ve de lejos, una aérea.
- **Para comparar con una referencia píxel a píxel**, renderiza las mismas vistas, en el mismo orden y en una sola
  ejecución: así el mismo código da diferencia 0. El resultado depende un poco del historial de la ejecución (qué
  celdas se construyeron antes): con otra tanda de vistas cambian unas decenas de píxeles sueltos en bordes lejanos
  (medido: media ≤ 0,001 y «>8» ≤ 0,01 %), y eso no es un fallo.
- `tools/out/` y `tools/.cache/` están ignorados por git.

## 3. Cómo está montado el render

- **Sin materiales estándar de Babylon**: todo son `ShaderMaterial` creados con `mkMat(...)` (en `app.js`), que antepone
  el preludio GLSL al fragment shader, añade los uniformes comunes (cámara, sol, cielo, niebla, tiempo) y registra el
  material para que `setHour` lo actualice. **Crea siempre los materiales con `mkMat`**; si no, se quedan sin luz.
- **Preludio GLSL** (`PRELUDE` en `app.js`, §6.4): ruido (`hash21`, `vnoise`), tramado (`dith()`), cielo analítico
  (`skyColor`), luz (`lit(albedo, normal)`), niebla (`fog(color, posMundo)`) y la única salida de color: `FRAG(c)` /
  `FRAG_NOFOG(c)`. Ningún shader escribe `gl_FragColor` a mano.
- **Niveles de detalle por distancia**, siempre con fundido por tramado (`dith()` con umbrales complementarios, sin saltos):
  1. *Lejos*: volúmenes extruidos por trozos de 800 m con ventanas pintadas en shader (`FS_BLD`).
  2. *Capa BASE de fachadas* (< ~245 m): geometría real por celdas de 100 m. Al construirse una celda, sus edificios se
     marcan en el búfer `inf` del trozo (componente `w`) y la pared simple se descarta en el shader.
  3. *Capa ORNAMENTO* (< ~110 m): carpinterías, molduras, ménsulas, macetas… en una malla aparte por celda.
  4. *Calles*: aceras/bordillo/mobiliario por celdas (< ~215 m); árboles en 3 niveles con *thin instances*.
- **Construcción en segundo plano**: cada celda se genera con una función generadora que cede el control
  (`yield`) y un presupuesto de pocos ms por fotograma. Nada de trabajos largos de golpe en el hilo principal.
- **Topes adaptativos**: si se superan N triángulos por capa, el radio de detalle se encoge solo y luego se recupera.

### Geometría de detalle
- `GB` (en `geo.js`, §6.6) acumula vértices: posición (float32, **relativa al origen de la celda**), color RGBA8 (`rgb` +
  **tipo de material** en `a`), canal auxiliar RGBA8 y normal RGBA8.
- Un *marco de fachada* `F = {x, z, tx, tz, nx, nz}` convierte `(u, y, d)` en mundo: `u` a lo largo de la fachada,
  `y` altura absoluta, `d` hacia fuera (+) o hacia dentro (−).
- El tipo de material (`K.STUCCO`, `K.STONE`, `K.GLASS`, …) decide la rama del shader de detalle.

## 4. Errores que ya hemos cometido (léelos)

1. **Precisión de coma flotante.** Nunca uses coordenadas de mundo (~10⁴ m) para texturas o patrones procedurales:
   el nivel de mipmap salta de píxel a píxel («sal y pimienta»). Usa coordenadas locales de la malla (`vLoc`)
   o `vPos.xz - uOrg` (origen cercano a la cámara, múltiplo de 1200 m).
2. **No derives tangentes de las derivadas de pantalla** (`dFdx`) con coordenadas grandes: el ruido angular,
   multiplicado por la distancia al origen, raya las texturas. Usa normales exactas por vértice.
3. **Palabras reservadas de GLSL** (`patch`, `sample`, `filter`, `input`, `output`, `common`, `active`, `partition`…):
   el shader no compila en WebGL2 y la página no termina de cargar.
4. **Grietas en uniones en T**: los paños de muro coplanarios se solapan ~1 cm (`rect()` lo hace solo en `d = 0`).
5. **Z-fighting con los volúmenes simples**: las fachadas de detalle van 4 cm hacia fuera.
6. **Coherencia BASE/ORNAMENTO**: las dos capas se generan en pasadas distintas y deben salir idénticas. El azar
   tiene que ser determinista y **no puede depender de qué capa se está construyendo**.
7. **Forja/balaustradas de lejos**: el recorte por `discard` hace ruido; de lejos se pinta opaco con color medio.
8. **Cotas**: la acera está ~0,3 m por encima del terreno (calzada + bordillo). Puertas y escaparates arrancan en la acera.
9. **SwiftShader engaña con los tiempos**: crear mallas parece lentísimo (es la sincronización de GL por software).
   No optimices a partir de tiempos medidos en el arnés; mide solo el tiempo de JS si hace falta.
10. **Publicación**: la página se publica como artifact y solo puede cargar scripts de jsDelivr/cdnjs; ningún acceso
    a red en tiempo de ejecución fuera de los ficheros locales.
11. **Git**: `gta/.gitattributes` desactiva LFS en esta carpeta (el LFS del repositorio no funciona desde la nube).
12. **Babylon parte el texto de los shaders por `;`**: un `;` dentro de un comentario `//` que va detrás de código deja
    el resto del comentario como código y el shader no compila. Comentarios de shader sin `;`, o en su propia línea.

## 5. Reglas de trabajo

- Si un módulo falla al iniciarse, la ciudad debe seguir funcionando sin él (`try/catch` en el arranque).
- Presupuestos: no añadas trabajo por fotograma que crezca con el tamaño de la ciudad; nada de reservar memoria
  en bucles calientes; respeta los topes de triángulos.
- Textos de la interfaz en castellano; rótulos de comercios en catalán. **Nada de marcas ni logotipos reales.**
- Comentarios en castellano y al grano, como el resto del código.
- No des nada por terminado sin capturas revisadas a pie (y de lejos si aplica) y sin errores de consola.

## 6. Arquitectura de módulos y contratos

El código está partido en módulos con fronteras fijas (fase A1: un refactor puro, verificado píxel a píxel contra el
código anterior). Esta sección es el contrato entre módulos: **si cambias una firma o un campo, cámbialo también aquí**.

### 6.1 Ficheros, dueños y orden de carga

| Fichero | Global | Contiene | Carril dueño |
| --- | --- | --- | --- |
| `geo.js` | `BCN_GEO` | `K` y registro de tipos, `GB` y primitivas, azar. Sin dependencias. | común |
| `ground.js` | `BCN_GROUND` | `roadGLSL` (asfalto de cerca) y hook `decals(cell)` (pasos de cebra). | DETALLE |
| `furniture.js` | `BCN_FURNITURE` | Hook `build(cell)`: farolas, papeleras, bancos, contenedores, Bicing. | DETALLE |
| `interiors.js` | `BCN_INTERIORS` | Hook `groundFloor(env, run)`: todo lo que hay entre la acera y la cota `F1`; rótulos. | INTERIORES |
| `details.js` | `BCN_DETAILS` | Hooks `floors`, `crown`, `plainRun`, `blindRun`: de `F1` hacia arriba. | DETALLE |
| `facades.js` | `BCN_FACADES` | Núcleo: shader de detalle, `ctx.city`, `layoutB`, `genB`, `windowHole`, celdas, topes. | INTERIORES |
| `streets.js` | `BCN_STREETS` | Núcleo: aceras, bordillo, árboles, celdas; contexto de celda para sus hooks. | DETALLE |
| `lighting.js` | `BCN_LIGHTING` | Módulo de iluminación (vacío y cableado). | LUZ |
| `app.js` | `BCN` | Motor, ciudad simple, preludio GLSL, `mkMat`, `reg`, `ctx`, arranque, cámara, interfaz. | LUZ |

- `geo.js`, `index.html` y las secciones 1–6 de este documento son **comunes**: en el trabajo por carriles no se tocan
  salvo cambio mínimo imprescindible, y se anota en la sección del carril (7, 8 o 9). Lo que un carril necesite de
  más (una primitiva, una paleta) lo define en sus propios ficheros.
- **Orden de `<script>` en `index.html` (obligatorio):** babylon, earcut, `geo.js`, `ground.js`, `furniture.js`,
  `interiors.js`, `details.js`, `facades.js`, `streets.js`, `lighting.js`, `app.js`. `geo.js` va el primero porque todos
  leen `window.BCN_GEO` al cargarse; `app.js` el último porque es quien arranca (y para entonces todos los tipos de
  material tienen que estar registrados, §6.7).
- **Arranque** (`app.js`): datos, relieve, calles y volúmenes simples → `BCN_FACADES.init(ctx)` (monta el shader de
  detalle, publica `ctx.detail` y `ctx.city` e inicia sus hooks `BCN_INTERIORS` y `BCN_DETAILS`) → `BCN_STREETS.init(ctx)`
  (solo si hay fachadas; inicia `BCN_FURNITURE` y `BCN_GROUND`) → `BCN_LIGHTING.init(ctx)` (siempre el último).
- **Si un módulo falta o falla al iniciarse, la ciudad sigue**: sin `BCN_FACADES` no hay detalle (ni calles de
  detalle); sin `BCN_INTERIORS` la planta baja sale como un paño liso; sin `BCN_DETAILS`, los pisos y la coronación
  lisos; sin `BCN_FURNITURE`, sin mobiliario; sin `BCN_GROUND`, sin pasos de cebra y con el asfalto liso. Cada caso
  deja un aviso «Sin …» en la consola. Un error dentro de `update()` de un módulo se registra como error de consola
  (las tres primeras veces) y no para ni el fotograma ni a los demás módulos; en `BCN.fxFlush()` no se captura, así
  que el arnés de capturas falla en el acto y enseña la traza.

### 6.2 El contexto `ctx`

Un único objeto (`CTX` en `app.js`, también en `BCN.ctx`) que reciben todos los `init(ctx)`:

| Campo | Qué es |
| --- | --- |
| `scene`, `engine`, `canvas`, `cam` | Babylon. `cam.position` es la cámara; todo cuelga de `scene`. |
| `SHOT` | `true` en modo captura (`#shot`): tiempo congelado. |
| `GEO` | `window.BCN_GEO` (§6.6 y §6.7). |
| `mkMat`, `mats` | Fábrica de materiales y lista de todos los creados (§6.4). |
| `reg` | Registro de mallas (§6.5). |
| `hooks(qué, global, respaldo)` | Carga de un módulo de hooks (§6.9 y §6.10). Devuelve una promesa. |
| `heightAt(x, z)` | Cota del terreno (m). |
| `WX`, `WZ`, `CH` | Tamaño del mundo y lado de los trozos de volúmenes simples (m). |
| `SEG` | `Float32Array`, 6 valores por tramo de calle: `x0, z0, x1, z1, semiancho, clase`. |
| `ROFF`, `RCOL` | Por clase de vía: altura de la cinta de calle sobre el terreno y color base. |
| `META`, `PAL` | `data/meta.json` (barrios, distritos, `poi`, vistas) y paletas de fachada por clase de edificio. |
| `BREC`, `bldChunks` | Registro compacto por edificio (`n`, `bb`, `elig`, `chunk`, `v0`, `v1`…) y trozos de volúmenes simples (`mesh`, `inf`, `vbInfo`…). Para leer un edificio usa `ctx.city.bget(b)`. |
| `blobURL(url)` | Descarga un fichero local y devuelve una URL `blob:` (para `BABYLON.Texture`). |
| `L` | Luz de la hora actual: `sunDir` (Vector3), `sunCol`, `skyCol`, `gndCol`, `fogCol`, `zenCol` (Color3), `fogD`. La actualiza `setHour`. |
| `matBld` | Material de los volúmenes simples (`uFx`: distancias del fundido con la fachada de detalle). |
| `st` | Estado de cámara y controles: `yaw`, `pitch`, `walk`, `keys`, `fly`, `showLabels`, `maxDist`. |
| `mods` | Módulos ya iniciados: `mods.fx`, `mods.st`, `mods.light`. |
| `detail` | Lo añade `facades.js`: `{ matB, matH, mats: [matB, matH], mkMesh(W, mat, nombre) }` (§6.8). |
| `city` | Lo añade `facades.js`: índices espaciales y consultas (§6.8). |

Clases de vía que distingue el código: con calzada `CAR = {0,1,2,3,4,5,6,8,10,11}` (`ctx.city.CAR`); con aceras a
ambos lados, árboles, mobiliario y pasos de cebra `{2,3,4,5,6}`; peatonales/enlosadas `{7,9,15,16}`.

### 6.3 Protocolo de módulos y `window.BCN`

Los módulos de primer nivel (`BCN_FACADES`, `BCN_STREETS`, `BCN_LIGHTING`) son `{ init(ctx) }`; `init` puede ser
`async` y devuelve:

```js
{ update(P, groundY, dt, frame),   // cada fotograma: P = cam.position, groundY = cota del terreno bajo la cámara, dt en s
  busy(),                          // ¿queda trabajo pendiente?
  stats(),                         // objeto pequeño para BCN.detailStats()
  setRange?(q),                    // calidad/alcance: 0 apagado · 1 normal · 2 alto (fx y st; en la luz es setQuality(q))
  flush?(P, groundY) }             // opcional: vaciar de golpe todo lo pendiente (si falta, app.js repite update() mientras busy())
```

`app.js` los guarda en `MODS` (`[{ id, m }]`, en orden de actualización: `fx`, `st`, `light`) y los llama cada fotograma.
El trabajo pesado va **por trozos**, con generadores y un presupuesto de pocos ms por `update()`.

`window.BCN` (lo usan el arnés y la interfaz): `ready`, `error`, `scene`, `engine`, `cam`, `st`, `views`, `poi(nombre)`,
`applyView(v)`, `flyTo(v)`, `setHour(h)`, `heightAt(x, z)`, `stats`, `ctx`, `reg`, `mods`, `fx`, `streets`, `light` (los
tres módulos, o `null` si fallaron), `detailBusy()`, `detailStats()` → `{ fx, st, light }` y `fxFlush()`, que vacía el
trabajo pendiente de **todos** los módulos.

### 6.4 Preludio GLSL, `FRAG` y `mkMat`

`mkMat(nombre, vs, fs, atributos, uniformes, samplers, opts)` es la **única** forma de crear materiales.

- Antepone **siempre** el preludio (`PRELUDE`) al fragment shader. El cuerpo `fs` **no** debe repetir nada de él: ni la
  línea `#extension GL_OES_standard_derivatives`, ni `precision`, ni los uniformes comunes, ni `varying vec3 vPos;`.
- El vertex shader se usa tal cual: declara `precision highp float;`, sus atributos, `uniform mat4 world;` (o
  `#include<instancesDeclaration>` / `finalWorld` si usa instancias), `uniform mat4 viewProjection;` y
  `varying vec3 vPos;`, y **tiene que escribir `vPos` (posición de mundo)**: la niebla y la luz lo dan por hecho.
- `uniformes` y `samplers` son solo los propios; los comunes (`world`, `viewProjection` y los del preludio) los pone
  `mkMat`. `opts`: `{ defines: ['#define X'], cull: true }` (por defecto sin defines y sin descartar caras traseras).
- Apunta el material en `ctx.mats`: `setHour` le fija sol, cielo y niebla, y cada fotograma se le fija `uCam`.
  `uTime` solo avanza en el mar y el cielo (los demás lo tienen a 0).

Lo que da el preludio a todo fragment shader:

| | |
| --- | --- |
| Uniformes | `uCam`, `uSunDir`, `uSunCol`, `uSkyCol`, `uGndCol`, `uFogCol`, `uZenCol` (vec3) · `uFogD`, `uTime` (float) |
| Varying | `vPos` (vec3, mundo) |
| Utilidades | `hash21(vec2)`, `vnoise(vec2)`, `dith()` (tramado por píxel, 0–1), `skyColor(dir)`, `lit(albedo, normal)`, `fog(color, posMundo)` |
| Salida | `FRAG(c)` = color con niebla · `FRAG_NOFOG(c)` = color tal cual (cielo) |

**Regla de la salida única:** ningún shader escribe `gl_FragColor`. Todos acaban en `FRAG(c);` (o `FRAG(c); return;`
en una salida anticipada) con `c` = color ya iluminado, sin niebla. Así la iluminación, la niebla y el formato de
salida (HDR, profundidad…) se cambian en un solo sitio: el preludio.

Dos trampas de Babylon con el texto de los shaders: (1) parte las líneas por `;`, así que **nada de `;` dentro de un
comentario `//` que vaya detrás de código** (el resto del comentario acabaría como código y no compila); (2) las
palabras reservadas del punto 3 del §4.

### 6.5 Registro de mallas: `reg`

`reg(malla, { cast, alphaTex, layer })` devuelve la misma malla (o `null` si se le pasa `null`), guarda las opciones en
`malla.metadata.bcn` (por defecto `{ cast: false, alphaTex: null, layer: '' }`) y la apunta en `reg.meshes` (un `Set`), del
que se da de baja sola al hacer `dispose()`. **Toda malla que se cree tiene que pasar por `reg`**: es lo que usarán las
sombras y cualquier pase auxiliar. `cast` = proyecta sombra; `alphaTex` = textura cuyo alfa recorta la malla.

| `layer` | Mallas (nombre) | `cast` | Creada en |
| --- | --- | --- | --- |
| `sky` · `sea` · `far` | cielo, mar, entorno lejano (`outer`) | no | `app.js` |
| `terrain` | relieve por trozos (`t<k>`) y muelles (`quays`) | sí | `app.js` |
| `road` | cintas de calle (`r<i>`) | no | `app.js` |
| `coarse` | volúmenes simples por trozos (`b<cx>_<cz>`) | sí | `app.js` |
| `base` | fachada BASE de una celda (`fb<ci>`) | sí | `facades.js` |
| `orn` | fachada ORNAMENTO de una celda (`fh<ci>`) | no | `facades.js` |
| `walk` | acera y bordillo de una celda (`wk<ci>`) | no | `streets.js` |
| `furn` | mobiliario y marcas viales de una celda (`fu<ci>`) | sí | `streets.js` |
| `tree` | tronco y hojas, cerca y media distancia (`tNB`, `tNL`, `tFB`, `tFL`) | sí; las hojas llevan `alphaTex` | `streets.js` |
| `imp` | impostores de árbol (`tI`) | no (`alphaTex`) | `streets.js` |

Las mallas de celda se crean y se destruyen al moverse (streaming); las de árbol son cinco mallas fijas con *thin
instances*. Todas llevan la posición en `float32` en el atributo `position`; las de celda y las de la ciudad simple
tienen además la matriz de mundo congelada (`freezeWorldMatrix`), y el cielo sigue a la cámara.

### 6.6 `BCN_GEO`: geometría y azar

**Geometría.** `new GB(ox, oz)` acumula una malla relativa al origen `(ox, oz)`: `p` (posición), `c` (RGBA8: color +
tipo de material en `a`), `a` (auxiliar RGBA8), `n` (normal RGBA8), `i` (índices), `nv`, `ni`. Se convierte en malla con
`ctx.detail.mkMesh(W, material, nombre)` (devuelve `null` si está vacía). Todas las primitivas reciben el `GB` como
primer argumento y **no hacen nada si es `null`** (así se salta la capa que no toca).

| Primitiva | Qué emite |
| --- | --- |
| `quad(B, F, u0,y0,d0, u1,y1,d1, u2,y2,d2, u3,y3,d3, col, kind, aux?)` | Cuadrilátero en el marco `F`; `aux` = 16 bytes (4 por vértice). |
| `rect(B, F, u0, u1, y0, y1, d, col, k)` | Rectángulo en el plano de fachada a profundidad `d`. Con `d === 0` y tipo 0 o 1 se solapa 1,2 cm. |
| `jamb(B, F, u, y0, y1, d0, d1, col, k)` · `hpl(B, F, u0, u1, y, d0, d1, col, k)` | Plano perpendicular a la fachada en `u` · plano horizontal a altura `y`. |
| `box(B, F, u0, u1, y0, y1, d0, d1, col, k, mask?)` | Caja adosada sin cara trasera. `mask`: 1 techo, 2 suelo, 4 laterales (7 por defecto). |
| `lattice(B, F, u0, u1, y0, y1, d, col, k, variante)` · `latticeSide(B, F, u, y0, y1, d0, d1, col, k, variante)` | Paño calado (`K.IRON` / `K.BAL`), de frente y de lado. |
| `cyl(B, x, z, y0, y1, r0, r1, lados, col, kind)` | Tronco de cono vertical con tapa. Coordenadas locales de celda. |
| `obox(B, x, z, y, l, w, h, ang, col, kind)` | Caja orientada: centro `(x, z)`, base `y`, largo, ancho, alto. |
| `bar(B, a, b, r, col, kind)` | Barra de sección cuadrada entre los puntos `a` y `b` (`[x, y, z]`). |

Además: `shade(col, f)`, `mixc(a, b, t)` (colores `[r, g, b]` 0–255), `latAux(variante)`, `signAux(id)` y `F0` (marco
identidad: con él `(u, y, d)` = `(x, y, z)` locales de celda).

**Azar.** Un único estado para todos los módulos: `seed(n)`, `R()` → [0,1), `R(a)` → [0,a), `R(a, b)` → [a,b),
`pick(lista)`. Más `hash2(i, j)` → [0,1), que es una función pura de dos enteros (sin estado).

- Cada consumidor **siembra justo antes** de usar `R()` y **no cede el control** (`yield`/`await`) hasta acabar su
  secuencia: entre medias podría sembrar otro módulo.
- En las fachadas siembra `genB`, una vez por edificio, y los hooks consumen en orden fijo (§6.9). **El número de
  llamadas a `R()` de cada hook es parte del contrato**: si un hook consume una de más o de menos, cambia todo lo que
  se genera después en ese edificio (también lo de otros módulos).
- ¿Necesitas más variación? Deriva de los números que ya recibes (`rr[k]`) o usa `hash2` con enteros estables (índice
  de edificio `env.b`, de vano, de planta, de tramo). No añadas llamadas a `R()` dentro de una secuencia ajena.
- Las capas BASE y ORNAMENTO de un edificio se generan en pasadas distintas: el azar **no puede depender** de cuál
  se esté construyendo (`W0`/`W1` nulos o no).

### 6.7 Tipos de material y registro (`K`, `regKind`)

El tipo de material viaja en el alfa del color de vértice y elige la rama del shader de detalle (`FS_DET`, en
`facades.js`), que pinta las fachadas **y** la malla de mobiliario de las calles.

| id | `K.` | Rama | id | `K.` | Rama |
| --- | --- | --- | --- | --- | --- |
| 0 | `STUCCO` | estuco fotografiado | 8 | `SIGN` | rótulo (`aux`: uv en x,y; nº de rótulo en z) |
| 1 | `STONE` | sillar | 9 | `AWN` | toldo a rayas |
| 2 | `GLASS` | vidrio de ventana | 10 | `BAL` | balaustrada calada (`aux` de `latAux`) |
| 3 | `SHUT` | persiana de lamas | 11 | `GSHOP` | vidrio de escaparate |
| 4 | `WOOD` | madera | 12 | `LAMP` | farol (emisivo) |
| 5 | `METAL` | metal | 13 | `PLAIN` | liso |
| 6 | `IRON` | forja calada (`aux` de `latAux`) | 14 | `LEAF` | hojas (y cualquier id sin rama) |
| 7 | `SGRAF` | esgrafiado | | | |

**Rangos de id reservados:** 0–19 núcleo (`facades.js`) · 20–39 `interiors.js` · 40–59 `details.js` · 60–79
`furniture.js` · 80–99 `ground.js`.

**Añadir un tipo:** `GEO.regKind(nombre, id, glsl, decl?)`, **al cargar el script** (nivel superior del fichero, no
dentro de `init`): el shader se monta una sola vez, al iniciarse `facades.js`, y después `regKind` lanza un error.
Da de alta `K[nombre] = id` y devuelve `id`; lanza si el nombre está repetido o no es del estilo `MI_TIPO2`
(mayúsculas, dígitos y `_`), o si el id está repetido o fuera de 15–255.

```js
// interiors.js, nivel superior (rango 20–39)
const { K, regKind } = window.BCN_GEO;
regKind('MITIPO', 20, `
    vec3 tx = texture2D(tMiTex, P*0.5).rgb;
    alb = vCol.rgb*tx; spec = 0.2; shin = 40.0;
    emis = tx*uMiBrillo*uDusk;`,
  'uniform sampler2D tMiTex; uniform float uMiBrillo;');
// en init(ctx):   for (const m of ctx.detail.mats) { m.setTexture('tMiTex', tex); m.setFloat('uMiBrillo', 0.4); }
// al emitir:      rect(W0, F, u0, u1, y0, y1, d, color, K.MITIPO);
```

- `glsl` es el **cuerpo** de la rama (sin el `else if`): `facades.js` inserta
  `else if (kind > id-0.5 && kind < id+0.5) { …glsl… }` después de las ramas del núcleo y antes de la rama final.
- `decl` (opcional) son declaraciones globales: funciones auxiliares, uniformes, samplers. Los `uniform …;` que haya
  ahí se dan de alta solos en los dos materiales de detalle; sus valores se fijan en `ctx.detail.mats`.
- **Una rama puede leer:** `kind`; `vCol.rgb` (color de vértice); `vInfo` (canal auxiliar, 0–1) y `v` (= `vInfo.x`);
  `vLoc` (posición local de celda) y `vPos` (mundo); `P` (vec2: coordenadas en metros sobre el plano de la cara,
  estables para texturas y patrones); `T`, `Bv` (tangente y bitangente de la cara); `n` (normal geométrica, ya vuelta
  hacia la cámara) y `an` (= `abs(n)`); `V` (unitario hacia la cámara) y `dist` (m); `nearF` (1 cerca → 0 a 170 m);
  `dt` (tramado del píxel); `uFade`, `uDusk` (0 de día → 1 al anochecer), los uniformes y utilidades del preludio y
  los samplers `tPlD`/`tPlN` (estuco), `tAsD`/`tAsN` (sillar) y `tSign` (rótulos).
- **Y escribir:** `alb` (albedo; llega con `vCol.rgb`), `N` (normal de sombreado; llega con `n`), `spec` (0.04),
  `shin` (12.0) y `emis` (vec3 0). Al salir de la rama el shader hace
  `c = lit(alb, N) + brillo especular del sol + emis` y `FRAG(c)`.
- Una rama puede terminar por su cuenta con `FRAG(c); return;` (lo hace el vidrio) o con `discard` (la forja).
- Las variables locales de la rama no chocan con las de otras (cada una va entre llaves), pero no declares nada que
  se llame como las de arriba.

### 6.8 `ctx.city` y `ctx.detail` (los publica `facades.js`)

`ctx.city` — rejilla de celdas de `CS` = 100 m (`NX` × `NZ`; índice `ci = j*NX + i`) y consultas en coordenadas de mundo:

| Campo | Qué es |
| --- | --- |
| `CS`, `NX`, `NZ`, `cellOf(x, z)` | Rejilla e índice de celda de un punto. |
| `ALL`, `ELIG`, `ROADS` | Listas por celda (`{ start, list }`; los de la celda `c` son `list[start[c] … start[c+1]-1]`): todos los edificios cuya caja toca la celda, edificios con fachada de detalle (por el centro de su caja) y tramos de calle que tocan la celda. |
| `BB` | `Float32Array`: caja `x0, z0, x1, z1` de cada edificio. |
| `CAR` | `Set` de clases de vía con calzada. |
| `bget(b)` | Edificio `b`: `{ cls, seed, yb, y0, y1, rings: [Float64Array x,z,…], col }` (cotas absolutas; `col` = color de paleta). |
| `inside(d, x, z)` | ¿El punto está dentro de la planta del edificio `d` (el objeto de `bget`)? |
| `coverAt(x, z, propio)` | Cota superior del edificio que ocupa el punto (sin contar `propio`), o `-1e9` si no hay ninguno. Con `propio = -1` sirve de «¿hay edificio aquí?» (`> -1e8`). |
| `roadDist(x, z)` | Distancia al borde de la vía más cercana, de cualquier clase (negativa dentro; `1e9` si no hay ninguna en la celda). |
| `segDist(s, x, z)` | Distancia del punto al eje del tramo `s`. |
| `nearestCar(x, z)` | `[s, d]`: tramo con calzada más cercano (`-1` si no hay) y distancia a su borde. |
| `roadY(s, x, z)` | Cota de la calzada del tramo `s` junto al punto (la misma que la cinta de calle de `app.js`). |
| `walkY(s, x, z)` | Cota de la acera junto al tramo `s` (admite `s = -1`: terreno + 0,2). |
| `walkAt(x, z)` | Cota de la acera en un punto cualquiera: `walkY(nearestCar(x, z)[0], x, z)`. |

Las fachadas todavía **no** usan `walkAt`: apoyan la planta baja en `run.gnd(c)` (terreno a 1 m de la fachada + 0,32).

`ctx.detail` — `matB` y `matH` son los materiales de detalle de las capas BASE y ORNAMENTO (el mismo shader con distinto
`uFade`; la malla de mobiliario usa `matB`); `mats = [matB, matH]` para fijar texturas y uniformes en los dos;
`mkMesh(W, material, nombre)` convierte un `GB` en malla (atributos `position`, `color`, `uv` = auxiliar, `nrm`),
devuelve `null` si está vacío y **no** la registra: pásala por `reg`.

### 6.9 Hooks de fachada: `interiors.js` y `details.js`

`facades.js` los carga con `await ctx.hooks(descripción, 'BCN_…', respaldo)`: llama a `init(ctx)` del global (puede ser
`async`) y completa el objeto de respaldo con lo que devuelva; si el global no existe o `init` falla, avisa y se queda
con el respaldo (paños lisos). Firmas:

```js
window.BCN_INTERIORS = { SHOPS, init(ctx) → { groundFloor(env, run), signTex } }
window.BCN_DETAILS   = { init(ctx) → { floors(env, run), crown(env, run), plainRun(env, run), blindRun(env, run) } }
```

`genB` (en `facades.js`) siembra el azar, decide estilo, colores y cotas del edificio (`env`) y, **por cada tramo
recto de fachada** (`run`), llama en este orden:

| Tramo (`run.kind`) | Llamadas |
| --- | --- |
| `'blind'` (medianera tapada por un vecino igual o más alto) | `D.blindRun(env, run)` |
| `'plain'` (menos de 2,2 m: sin huecos) | `D.plainRun(env, run)` |
| `'street'` (da a una calle) y `'yard'` (patio de manzana) | `I.groundFloor(env, run)` → `D.floors(env, run)` → `D.crown(env, run)` |

Reparto vertical: `groundFloor` construye de `env.y0` a `env.F1` (o desde `run.cover - 0.3` si un vecino tapa la parte
baja); `floors`, la faja sobre la planta baja y las `nF` plantas de `F1` a `C`; `crown`, de `C` hacia arriba (cornisa,
peto o balaustrada). Cada hook cierra **todo** su paño de muro (si no dibuja un vano, pone el muro liso): entre los
tres no queda ningún agujero. Lo que quede por debajo de `run.cover` lo tapa el edificio vecino: no se construye.

**`env`** (uno por edificio y pasada):

| Campos | Qué son |
| --- | --- |
| `b`, `d`, `lay` | Índice del edificio, su registro (`bget(b)`) y su disposición `{ d, gHi, gLo, H, runs, portal }`. |
| `W0`, `W1` | `GB` de la capa BASE y de la capa ORNAMENTO. **En cada pasada uno de los dos es `null`.** |
| `ox`, `oz` | Origen de la celda (los `GB` y los marcos `F` son relativos a él). |
| `style`, `cls6` | `'sobrio'`, `'clasico'` o `'modernista'`; `cls6` = edificio de clase 6 (siempre sobrio y sin comercios). |
| `shops`, `shopsHere` | Planta baja comercial (`!cls6 && H >= 10`) y, además, con altura para escaparates (`F1 - gHi > 3.6`). |
| `porticones`, `tribunaOK`, `balusters` | Banderas del edificio: porticones en las balconeras, tribunas permitidas, balaustrada en la coronación. |
| `p`, `u`, `stone`, `shut`, `persi`, `wood`, `iron`, `glass`, `rv` | Colores `[r, g, b]`: muro, molduras, piedra de planta baja, porticón, persiana, madera, forja, vidrio y muro en sombra (`rv` hoy no lo usa nadie). |
| `gHi`, `H` | Cota más alta del terreno bajo el edificio y altura sobre ella. |
| `G`, `F1`, `C` | Altura de la planta baja (4,3 con comercios; 3,25 sin ellos), cota del suelo del primer piso y cota de la cornisa (`y1 - 0.85`). |
| `nF`, `m` | Número de plantas de pisos entre `F1` y `C` y altura de cada una (si `nF` es 0, `F1 = C`). |
| `y0`, `y1` | Base y coronación del volumen (cotas absolutas). |
| `windowHole(W0, F, a0, a1, tt, ct, k, P, st, yt, dep, col, kind, se)` | Pieza común del núcleo: vano de `a0` a `a1` y de `k` a `P` con un hueco de `tt` a `ct` y de `st` (alféizar) a `yt` (dintel), retranqueado `dep`; muro de color `col` y tipo `kind`; `se` = fracción del hueco tapada por la persiana. Emite muro, jambas, dintel, alféizar, vidrio (`K.GLASS`) y persiana (`K.SHUT`) en la capa BASE. |

**`run`** (uno por tramo):

| Campos | Qué son |
| --- | --- |
| `r` | Tramo de la disposición: `{ ax, az, tx, tz, nx, nz, L, kind, cover }` en coordenadas de mundo. |
| `F` | Marco de fachada listo para las primitivas (relativo a la celda y 4 cm hacia fuera). |
| `L`, `kind`, `cover` | Longitud, tipo y cota hasta la que lo tapa un edificio vecino (`-1e9` si no lo tapa nadie). |
| `street` | `true` si da a una calle (en `'plain'` y `'blind'` vale `false`). |
| `nb`, `bw` | Número de vanos y ancho de cada uno (el vano `W` ocupa `u` de `W*bw` a `(W+1)*bw`). |
| `N`, `M` | Vano del portal (`-1` si este tramo no lo lleva) y vano de la tribuna (`-9` si no hay). |
| `wallC` | Color del muro del tramo (`p` a la calle; algo más oscuro al patio). |
| `gnd(c)` | Cota de la acera delante del punto `u = c` del tramo. |

En los tramos `'plain'` y `'blind'`, `run` solo trae `r`, `F`, `L`, `kind`, `cover` y `street`.

**Azar de los hooks** (ver §6.6): `groundFloor` consume **exactamente 6** `R()` por vano (`nb` vanos), se dibuje o no;
`floors`, **exactamente 7** por vano y planta (`nF × nb × 7`), se dibuje o no; `crown`, `plainRun` y `blindRun`,
ninguno. Antes de eso `genB` ya ha consumido los del edificio y, por tramo, uno más para `M` cuando procede.

### 6.10 Hooks de calle: `furniture.js` y `ground.js`

```js
window.BCN_FURNITURE = { init(ctx) → { build(cell) } }
window.BCN_GROUND    = { roadGLSL, init(ctx) → { decals(cell) } }
```

`streets.js` los carga igual que arriba (respaldo: no hacer nada) y, al construir cada celda de calle, llama una vez a
`FU.build(cell)` y después a `GR.decals(cell)`. Son **síncronos** (sin `yield`) y deben ser breves: van dentro del
presupuesto de la celda. Lo que emiten va a la malla de mobiliario de la celda (`cell.W`), que se pinta con el shader
de detalle (tipos `K.*`) y se registra como `layer: 'furn'`.

**`cell`** (contexto de celda):

| Campos | Qué son |
| --- | --- |
| `ci`, `ox`, `oz` | Índice de la celda y su origen de mundo (`x0`, `z0` son lo mismo). |
| `W` | `GB` de la malla de mobiliario, relativo a `(ox, oz)`: emite con `x - ox`, `y` absoluta, `z - oz`. |
| `inCell(x, z)` | ¿El punto de mundo cae en esta celda? **Emite solo lo que esté dentro**: un tramo que cruza dos celdas se recorre en las dos. |
| `nearJ(x, z, r)` | ¿Hay un cruce a menos de `r` metros? |
| `freeWalk(x, z)` | Tramo con calzada más cercano (≥ -1) si el punto es acera libre (a más de 25 cm de la calzada y fuera de todo edificio), o `-2` si no lo es. |
| `J`, `Jset`, `jKey(x, z)` | Cruces de la celda y sus vecinas (`[x, z, [tramos]]`, extremos compartidos por 3 o más tramos con calzada), conjunto de sus claves y función de clave. |
| `forEachSeg(cb)` | Recorre los tramos de calle de la celda (los de 1 m o más, de cualquier clase) y llama a `cb(seg)`. |

**`seg`** (lo que recibe `cb`):

| Campos | Qué son |
| --- | --- |
| `s`, `cls`, `hw` | Índice del tramo en `SEG`, clase de vía y semiancho de la calzada. |
| `ax`, `az`, `tx`, `tz`, `L`, `ang` | Origen, dirección unitaria, longitud y ángulo (`atan2(tz, tx)`). |
| `px`, `pz` | Perpendicular unitaria (izquierda del sentido de avance): un punto a `off` metros del eje es `ax + tx*u + px*lado*off`. |
| `a0` | Proyección del origen sobre la dirección (fase para repartir a lo largo de la calle). |
| `along(sp, ph, f)` | Llama a `f(u, n)` cada `sp` metros con fase `ph`: `u` = metros desde el origen del tramo, `n` = índice entero estable a lo largo de la calle (alternar aceras, sembrar). |

Reglas: filtra tú la clase de vía (`cls`) y el ancho; apoya en la acera con `ctx.city.walkY(ns, x, z)` y en la calzada con
`ctx.city.roadY(s, x, z)`; si usas `R()`, siembra antes con algo estable (`seed(n * 977 + s)`). Lo emitido dentro de
`forEachSeg` se reordena al final por tramo y, dentro de cada tramo, por orden de llamada (mobiliario y luego marcas
viales); lo emitido fuera de `forEachSeg` queda al final de la malla.

### 6.11 Asfalto de cerca: `BCN_GROUND.roadGLSL`

Cadena GLSL que `app.js` inserta tal cual como cuerpo de `if (near > 0.0 && car) { … }` en el shader de calzada
(`FS_ROAD`); sin `ground.js` ese bloque queda vacío. Se evalúa una vez, al cargar `app.js`.

- **Lee:** `P` (vec2, metros respecto a `uOrg`, un origen cercano a la cámara: úsalo para texturas y ruido); `x` (metros
  desde el eje, con signo) y `hw` (semiancho); `v` (metros a lo largo de la calle) y `au` (= |x|/hw); `cls` (clase de
  vía); `dist` (m a la cámara); `fade` (1 cerca → 0 a 1,4 km); `near` (1 cerca → 0 a 480 m, ya multiplicado por `uAsph`);
  `vCol.rgb` (color base de la calzada); los samplers `tAsD` y `tAsN` (asfalto fotografiado) y el preludio.
- **Escribe:** `alb` (albedo: mézclalo con `near`), `N` (normal de sombreado; llega como +Y) y `mk` (máscara de pintura
  vial ya calculada: aquí solo se desgasta).
- El bloque no puede declarar uniformes ni samplers: los que hay son los de `FS_ROAD` (`tAsD`, `tAsN`, `uOrg`, `uAsph`).
  Uno nuevo habría que declararlo en `FS_ROAD` y en su `mkMat`, que están en `app.js` (fichero de otro carril): con `P`,
  el ruido del preludio y las dos texturas de asfalto se puede hacer casi todo sin tocarlo.
- Las mismas trampas de texto que cualquier shader (§6.4): sin `;` en comentarios `//` detrás de código.

### 6.12 `lighting.js`

`window.BCN_LIGHTING = { init(ctx) → { update(P, groundY, dt, frame), setQuality(q), busy(), stats() } }`. Hoy no hace
nada. `app.js` lo inicia el último (con `try/catch`), lo llama cada fotograma después de fachadas y calles y lo expone
en `BCN.light`. Tiene a mano: `ctx.reg.meshes` (todas las mallas con su `metadata.bcn`), `ctx.mats` (todos los
materiales, creados con `mkMat`), `ctx.L` (sol y cielo de la hora actual) y, en `app.js`, el preludio con `lit()`,
`fog()` y `FRAG`, por donde pasa el color de **todos** los shaders.




## 7. Carril LUZ

_Pendiente: aquí documentará el carril LUZ (`app.js`, `lighting.js`) lo que añada o cambie._




## 8. Carril INTERIORES

_Pendiente: aquí documentará el carril INTERIORES (`interiors.js`, `facades.js`) lo que añada o cambie._




## 9. Carril DETALLE

_Pendiente: aquí documentará el carril DETALLE (`details.js`, `furniture.js`, `ground.js`, `streets.js`) lo que añada o cambie._
