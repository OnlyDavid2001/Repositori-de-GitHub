# GTA Barcelona — guía de desarrollo

Visor/juego web de Barcelona entera hecho con Babylon.js y shaders propios. Este documento es la referencia
para cualquiera (persona o agente) que toque el código: cómo está montado, cómo se prueba y qué errores ya
nos hemos comido para no repetirlos.

## 1. Qué hay en la carpeta

| Fichero | Papel |
| --- | --- |
| `index.html` | Página, interfaz y orden de carga de scripts (§6.1). Babylon y earcut vienen de jsDelivr; todo lo demás es local. |
| `geo.js` | `BCN_GEO`: tipos de material `K` y su registro, geometría acumulada `GB` con sus primitivas (planas y suaves) y azar por ámbito. Sin dependencias. |
| `app.js` | Motor, carga de datos, relieve, calles (cintas), volúmenes simples de edificios, mar, cielo, luz/hora, cámara e interfaz. Define el preludio GLSL (contrato de sombreado y `FRAG`), `mkMat`, el registro de mallas `reg` y el contexto `ctx`, y arranca los módulos. |
| `facades.js` | NÚCLEO de las fachadas de detalle (capas BASE y ORNAMENTO): shader de detalle, índices espaciales y consultas (`ctx.city`), disposición de cada edificio, esqueleto del generador, celdas y topes. |
| `interiors.js` | Hook de `facades.js`: planta baja (portal, comercios, ventanas con reja), atlas de rótulos y lista de comercios. |
| `details.js` | Hook de `facades.js`: pisos (ventanas, balcones, tribunas…), coronación y tramos lisos y ciegos. |
| `streets.js` | NÚCLEO de las calles de detalle: aceras de panot con bordillo, árboles en tres niveles (instancias), celdas; da el contexto de celda a sus hooks. |
| `furniture.js` | Hook de `streets.js`: farolas, papeleras, bancos, contenedores y estaciones de Bicing. |
| `ground.js` | Suelo: bloque GLSL del asfalto de cerca (lo inserta `app.js`) y hook de `streets.js` con las marcas viales (pasos de cebra). |
| `lighting.js` | Módulo de iluminación: vacío y cableado (se inicia el último y se llama cada fotograma). |
| `data/` | Datos de la ciudad (contenedores binarios envueltos en PNG), texturas y los props de Transeúnte (`tr_props.*`). |
| `tools/` | Arnés de capturas (`shot.js`), comparador (`cmp.py`), vistas con nombre (`views.json`) y pruebas de `geo.js` (`geo_test.js`). No se publica. |

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
node tools/geo_test.js                                                  # geo.js sin navegador: primitivas y azar (1 s)
```

- Cada vista: `{x, z, y | agl | walk:true, yaw, pitch, hour?, fx?, st?, frames?, eval?}`. `walk:true` pone el ojo a 1,75 m
  del terreno; `agl` son metros sobre el terreno; `eval` es JS que se ejecuta después de colocar la cámara y antes de
  renderizar (sirve para montar una prueba: una malla temporal, un `console.warn` con medidas…). Para leer lo que se ha
  pintado (`gl.readPixels`) hazlo en el `eval` de la vista SIGUIENTE, con la misma cámara: el lienzo conserva el fotograma.
- El arnés imprime todos los errores y avisos de consola y sale con código 1 si hubo errores. **Un shader que no
  compila deja `BCN.ready` sin activar y el arnés agota el tiempo**: mira siempre la salida.
- `window.BCN` expone el estado (`scene`, `engine`, `cam`, `st`, `fx`, `streets`, `light`, `heightAt`, `applyView`, `setHour`,
  `ctx`, `reg`, `fxFlush()` —construye de golpe todo el detalle pendiente de todos los módulos— y `detailStats()`). Lista completa: §6.3.
- En modo captura (`#shot` en la URL) el tiempo de animación se congela para que las capturas sean reproducibles.
- **Hay que abrir las imágenes y mirarlas.** Que no haya errores de consola no significa que se vea bien.
  Mira siempre al menos dos vistas a pie y, si tocas algo que se ve de lejos, una aérea. Si tocas cotas (puertas, aceras,
  mobiliario), mira también una calle en cuesta: `pendiente` (7 %) y `cuesta` (10 %, con calzada) en `tools/views.json`.
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
  (`skyColor`), el contrato de sombreado (`lit`, `shade`, `envRefl`, `emit`), niebla (`fog(color, posMundo)`) y la única
  salida de color: `FRAG(c)` / `FRAG_NOFOG(c)` / `FRAGA(c, opacidad)`. Ningún shader escribe `gl_FragColor` a mano.
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
  **tipo de material** en `a`), canal auxiliar RGBA8 y normal RGBA8 (`xyz` + 255 en el 4.º byte si es una normal **suave**,
  de las que el shader no voltea hacia la cámara).
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
   tiene que ser determinista y **no puede depender de qué capa se está construyendo**: cada ámbito (edificio, tramo,
   vano…) siembra el suyo y saca de golpe todos sus números (§6.6).
7. **Forja/balaustradas de lejos**: el recorte por `discard` hace ruido; de lejos se pinta opaco con color medio.
8. **Cotas**: la acera está ~0,3 m por encima del terreno (calzada + bordillo), pero no es «terreno + constante»: en
   una calle en cuesta esa cuenta falla hasta en medio metro. Lo que se apoye en la acera pregunta su cota a
   `ctx.city.walkAt(x, z)` (§6.8), que es exactamente la de la malla de acera. Puertas y escaparates arrancan ahí.
9. **SwiftShader engaña con los tiempos**: crear mallas parece lentísimo (es la sincronización de GL por software).
   No optimices a partir de tiempos medidos en el arnés; mide solo el tiempo de JS si hace falta.
10. **Publicación**: la página se publica como artifact y solo puede cargar scripts de jsDelivr/cdnjs; ningún acceso
    a red en tiempo de ejecución fuera de los ficheros locales.
11. **Git**: `gta/.gitattributes` desactiva LFS en esta carpeta (el LFS del repositorio no funciona desde la nube).
12. **Babylon parte el texto de los shaders por `;`**: un `;` dentro de un comentario `//` que va detrás de código deja
    el resto del comentario como código y el shader no compila. Comentarios de shader sin `;`, o en su propia línea.
13. **Uniformes por malla**: Babylon solo reenvía los uniformes de un material (`setFloat`…) cuando cambia el material
    enlazado, no entre dos mallas seguidas que lo comparten. Un valor por malla se fija en `onBindObservable`, directamente
    en el efecto (`material.getEffect().setFloat(…)`), y en TODAS las mallas que usen ese shader: dos materiales con el
    mismo código comparten programa y el valor se queda puesto de una malla a la siguiente (así va `uCellHi`, §6.8).
14. **Patrones sobre superficies curvas**: las coordenadas de cara `P` del shader de detalle salen de la normal; en una
    superficie de normales suaves cambian de píxel a píxel y un patrón dibujado con `P` se deforma. En lo curvo, patrones
    con `vLoc` (la altura `vLoc.y`, o ruido sobre `vLoc.xz + vLoc.y`).
15. **El lienzo tiene canal alfa** (premultiplicado, el valor por defecto de WebGL): un píxel que llegue a pantalla con
    alfa < 1 deja ver el fondo de la página y sale lavado en las capturas. Hoy todo escribe alfa 1 y los materiales con
    mezcla no lo tocan (§6.4). Quien guarde otra cosa en el alfa (profundidad…) que lo haga en un búfer intermedio y
    termine con un pase que escriba alfa 1.

## 5. Reglas de trabajo

- Si un módulo falla al iniciarse, la ciudad debe seguir funcionando sin él (`try/catch` en el arranque).
- Presupuestos: no añadas trabajo por fotograma que crezca con el tamaño de la ciudad; nada de reservar memoria
  en bucles calientes; respeta los topes de triángulos.
- Textos de la interfaz en castellano; rótulos de comercios en catalán. **Nada de marcas ni logotipos reales.**
- Comentarios en castellano y al grano, como el resto del código.
- No des nada por terminado sin capturas revisadas a pie (y de lejos si aplica) y sin errores de consola.

## 6. Arquitectura de módulos y contratos

El código está partido en módulos con fronteras fijas (fase A1: un refactor puro, verificado píxel a píxel contra el
código anterior; fase A2: los contratos de base de los que cuelgan los tres carriles —azar por ámbito, cota de acera,
primitivas suaves, sombreado, mezcla alfa y sustitutos—). Esta sección es el contrato entre módulos: **si cambias una
firma o un campo, cámbialo también aquí**.

### 6.1 Ficheros, dueños y orden de carga

| Fichero | Global | Contiene | Carril dueño |
| --- | --- | --- | --- |
| `geo.js` | `BCN_GEO` | `K` y registro de tipos, `GB` y primitivas planas y suaves, auxiliares de vértice, azar por ámbito. Sin dependencias. | común |
| `ground.js` | `BCN_GROUND` | `roadGLSL` (asfalto de cerca) y hook `decals(cell)` (pasos de cebra). | DETALLE |
| `furniture.js` | `BCN_FURNITURE` | Hook `build(cell)`: farolas, papeleras, bancos, contenedores, Bicing. | DETALLE |
| `interiors.js` | `BCN_INTERIORS` | Hook `groundFloor(env, run)`: todo lo que hay entre la acera y la cota `F1`; rótulos. | INTERIORES |
| `details.js` | `BCN_DETAILS` | Hooks `floors`, `crown`, `plainRun`, `blindRun`: de `F1` hacia arriba. | DETALLE |
| `facades.js` | `BCN_FACADES` | Núcleo: shader de detalle (con `K.PBR` y los sustitutos), `ctx.city`, `layoutB`, `genB`, `windowHole`, celdas, topes. | INTERIORES |
| `streets.js` | `BCN_STREETS` | Núcleo: aceras, bordillo, árboles, celdas; contexto de celda para sus hooks. | DETALLE |
| `lighting.js` | `BCN_LIGHTING` | Módulo de iluminación (vacío y cableado). | LUZ |
| `app.js` | `BCN` | Motor, ciudad simple, preludio GLSL (contrato de sombreado), `mkMat`, `reg`, `ctx`, arranque, cámara, interfaz. | LUZ |

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
| `L` | Luz de la hora actual: `sunDir` (Vector3), `sunCol`, `skyCol`, `gndCol`, `fogCol`, `zenCol` (Color3), `fogD` y `dusk` (0 de día … 1 al anochecer: el uniforme `uDusk`). La actualiza `setHour`. |
| `matBld` | Material de los volúmenes simples (`uFx`: distancias del fundido con la fachada de detalle). |
| `st` | Estado de cámara y controles: `yaw`, `pitch`, `walk`, `keys`, `fly`, `showLabels`, `maxDist`. |
| `mods` | Módulos ya iniciados: `mods.fx`, `mods.st`, `mods.light`. |
| `detail` | Lo añade `facades.js`: `{ matB, matH, mats: [matB, matH], mkMesh(W, mat, nombre) }` (§6.8). |
| `city` | Lo añade `facades.js`: índices espaciales y consultas (§6.8). |

Clases de vía que distingue el código: con calzada `CAR = {0,1,2,3,4,5,6,8,10,11}` (`ctx.city.CAR`); con aceras a
ambos lados (`ctx.city.WALK`), árboles, mobiliario y pasos de cebra `{2,3,4,5,6}`; peatonales/enlosadas `{7,9,15,16}`.

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

### 6.4 Preludio GLSL, contrato de sombreado, `FRAG` y `mkMat`

`mkMat(nombre, vs, fs, atributos, uniformes, samplers, opts)` es la **única** forma de crear materiales.

- Antepone **siempre** el preludio (`PRELUDE`) al fragment shader. El cuerpo `fs` **no** debe repetir nada de él: ni la
  línea `#extension GL_OES_standard_derivatives`, ni `precision`, ni los uniformes comunes, ni `varying vec3 vPos;`.
- El vertex shader se usa tal cual: declara `precision highp float;`, sus atributos, `uniform mat4 world;` (o
  `#include<instancesDeclaration>` / `finalWorld` si usa instancias), `uniform mat4 viewProjection;` y
  `varying vec3 vPos;`, y **tiene que escribir `vPos` (posición de mundo)**: la niebla y la luz lo dan por hecho.
- `uniformes` y `samplers` son solo los propios; los comunes (`world`, `viewProjection` y los del preludio) los pone
  `mkMat`. `opts`: `{ defines: ['#define X'], cull: true, blend: true }` (por defecto sin defines, sin descartar caras
  traseras y opaco; `blend`, más abajo).
- Apunta el material en `ctx.mats`, y con eso recibe **los uniformes globales**: sol, cielo, niebla y `uDusk` cada vez que
  cambia la hora (`setHour`), y `uCam` y `uTime` cada fotograma. Un material creado más tarde (con la ciudad ya en marcha)
  recibe la luz de la hora actual al crearse. **No fijes a mano ninguno de esos uniformes.**

Lo que da el preludio a todo fragment shader:

| | |
| --- | --- |
| Uniformes | `uCam`, `uSunDir`, `uSunCol`, `uSkyCol`, `uGndCol`, `uFogCol`, `uZenCol` (vec3) · `uFogD`, `uTime` (s; congelado en modo captura), `uDusk` (0 de día … 1 al anochecer) (float) |
| Varying | `vPos` (vec3, mundo) |
| Utilidades | `hash21(vec2)`, `vnoise(vec2)`, `dith()` (tramado por píxel, 0–1), `skyColor(dir)`, `fog(color, posMundo)` |
| Sombreado | `lit(alb, n)`, `shade(alb, N, V, rough, metal, ao)`, `envRefl(r, rough)`, `emit(col, gain)` |
| Salida | `FRAG(c)` = color con niebla · `FRAG_NOFOG(c)` = color tal cual (cielo) · `FRAGA(c, a)` = con niebla y opacidad `a` (solo materiales `blend`) |

**Contrato de sombreado.** Todo color iluminado sale de estas cuatro funciones; el carril LUZ las reimplementará (HDR
lineal, sombras, oclusión…) sin tocar los demás shaders, así que **no copies su interior ni ilumines por tu cuenta**:

| Función | Qué devuelve | Hoy |
| --- | --- | --- |
| `vec3 lit(vec3 alb, vec3 n)` | Luz difusa de sol y cielo sobre un albedo. Para los shaders sencillos (relieve, acera, árboles, volúmenes simples). | `alb*(sol·n + ambiente)` |
| `vec3 shade(vec3 alb, vec3 N, vec3 V, float rough, float metal, float ao)` | Sombreado completo: difusa + brillo del sol con lóbulo según `rough` + reflejo del entorno. `V` = unitario hacia la cámara; `rough` 0 pulido … 1 mate; `metal` 0 … 1 (el albedo tiñe el reflejo y no hay difusa); `ao` 0 … 1 atenúa lo ambiental. | difusa de `lit` + Blinn-Phong normalizado + `envRefl` con Fresnel (los metales siempre; lo demás solo si es pulido: pesa `(1 − rough)³`) |
| `vec3 envRefl(vec3 r, float rough)` | Lo que se refleja en la dirección `r`: cielo analítico y, bajo el horizonte, la calle (oscura). Con `rough` se difumina. | lo que hacía el vidrio; con `rough = 0` incluye el disco del sol |
| `vec3 emit(vec3 col, float gain)` | Color autoiluminado (faroles, rótulos, ventanas encendidas); se **suma** al resultado de `shade`. | `col*gain` |

Equivalencias con el `spec`/`shin` de antes: mate de fachada `rough` 0,8–0,9; por defecto 0,62 (≈ `shin` 12); madera
barnizada 0,5; forja y metal pintado 0,4–0,45 con `metal` 0 (la forja negra es pintura, no un espejo: con `metal` 1 se
tiñe del azul del cielo); el `metal` 1 queda para el metal visto (acero, latón), que hoy solo usa el mobiliario.

**Regla de la salida única:** ningún shader escribe `gl_FragColor`. Todos acaban en `FRAG(c);` (o `FRAG(c); return;`
en una salida anticipada) con `c` = color ya iluminado, sin niebla. Así la iluminación, la niebla y el formato de
salida (HDR, profundidad…) se cambian en un solo sitio: el preludio.

**Materiales con mezcla alfa** (`opts.blend = true`): vidrios, humo, carteles translúcidos… El material

- se dibuja **después de todo lo opaco** (pasa a la cola de transparentes de Babylon, ordenada de lejos a cerca) y **no
  escribe profundidad** (sí la comprueba);
- mezcla el color con `(SRC_ALPHA, ONE_MINUS_SRC_ALPHA)` y **deja intacto el alfa del búfer** (`(ZERO, ONE)`): el carril
  LUZ guardará ahí la profundidad de lo opaco, y además el lienzo de la página tiene canal alfa;
- acaba su shader en `FRAGA(color, opacidad)` en vez de `FRAG(color)`.

```js
const m = ctx.mkMat('humo', VS, `void main(){ vec3 c = lit(vec3(0.8), vec3(0.0, 1.0, 0.0)); FRAGA(c, 0.35); }`, ['position'], [], [], { blend: true });
malla.material = m; malla.renderingGroupId = 1; ctx.reg(malla, { layer: 'fx' });   // lo demás, como cualquier otra malla
```

Cómo está hecho (por si falla tras cambiar de versión de Babylon): Babylon no trae ese modo de mezcla, así que el
material usa un `alphaMode` que no usa nadie más (`ALPHA_EXCLUSION`, para que la caché de estado del motor no lo
confunda con otro) y, en su `onBindObservable`, cambia los factores con `engine.alphaState.setAlphaBlendFunctionParameters`:
en ese momento el motor ya ha fijado el modo y aún no ha dibujado. Que no escriba profundidad lo hace el propio motor
con cualquier modo de mezcla. Dos mallas translúcidas que se solapan se ordenan por la distancia de su centro, no por
píxel: evita mallas translúcidas enormes o entrelazadas. El fundido por tramado (`dith()` + `discard`) sigue valiendo.

Dos trampas de Babylon con el texto de los shaders: (1) parte las líneas por `;`, así que **nada de `;` dentro de un
comentario `//` que vaya detrás de código** (el resto del comentario acabaría como código y no compila); (2) las
palabras reservadas del punto 3 del §4.

### 6.5 Registro de mallas: `reg`

`reg(malla, { cast, alphaTex, layer })` devuelve la misma malla (o `null` si se le pasa `null`), guarda las opciones en
`malla.metadata.bcn` (por defecto `{ cast: false, alphaTex: null, layer: '' }`) y la apunta en `reg.meshes` (un `Set`), del
que se da de baja sola al hacer `dispose()`. **Toda malla que se cree tiene que pasar por `reg`**: es lo que usarán las
sombras y cualquier pase auxiliar. `cast` = proyecta sombra; `alphaTex` = textura cuyo alfa recorta la malla. Cualquier
otro campo que se pase se conserva tal cual en `metadata.bcn`: la malla BASE de una celda de fachadas lleva `cell`, su
celda (`{ base, hi, … }`), de donde sale la bandera `uCellHi` (§6.8).

| `layer` | Mallas (nombre) | `cast` | Creada en |
| --- | --- | --- | --- |
| `sky` · `sea` · `far` | cielo, mar, entorno lejano (`outer`) | no | `app.js` |
| `terrain` | relieve por trozos (`t<k>`) y muelles (`quays`) | sí | `app.js` |
| `road` | cintas de calle (`r<i>`) | no | `app.js` |
| `coarse` | volúmenes simples por trozos (`b<cx>_<cz>`) | sí | `app.js` |
| `base` | fachada BASE de una celda (`fb<ci>`); lleva además `cell` | sí | `facades.js` |
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
tipo de material en `a`), `a` (auxiliar RGBA8), `n` (normal RGBA8: `xyz` + 255 en el 4.º byte si es suave), `i`
(índices), `nv`, `ni`. Se convierte en malla con `ctx.detail.mkMesh(W, material, nombre)` (devuelve `null` si está
vacía). Todas las primitivas reciben el `GB` como primer argumento y **no hacen nada si es `null`** (así se salta la
capa que no toca). Todas admiten al final un `aux` opcional (menos las de paño calado, que ponen el suyo): los 16
bytes del canal auxiliar, 4 por vértice.

*Primitivas planas* — una normal por cara, exacta, que el shader orienta hacia la cámara (valen vistas por los dos lados):

| Primitiva | Qué emite |
| --- | --- |
| `quad(B, F, u0,y0,d0, u1,y1,d1, u2,y2,d2, u3,y3,d3, col, kind, aux?)` | Cuadrilátero en el marco `F`. |
| `rect(B, F, u0, u1, y0, y1, d, col, k, aux?)` | Rectángulo en el plano de fachada a profundidad `d`. Con `d === 0` y tipo 0 o 1 se solapa 1,2 cm. |
| `jamb(B, F, u, y0, y1, d0, d1, col, k, aux?)` · `hpl(B, F, u0, u1, y, d0, d1, col, k, aux?)` | Plano perpendicular a la fachada en `u` · plano horizontal a altura `y`. |
| `box(B, F, u0, u1, y0, y1, d0, d1, col, k, mask?, aux?)` | Caja adosada sin cara trasera. `mask`: 1 techo, 2 suelo, 4 laterales (7 por defecto). |
| `lattice(B, F, u0, u1, y0, y1, d, col, k, variante)` · `latticeSide(B, F, u, y0, y1, d0, d1, col, k, variante)` | Paño calado (`K.IRON` / `K.BAL`), de frente y de lado. |
| `obox(B, x, z, y, l, w, h, ang, col, kind, aux?)` | Caja orientada: centro `(x, z)`, base `y`, largo, ancho, alto. Coordenadas locales de celda. |
| `bar(B, a, b, r, col, kind, aux?)` | Barra de sección cuadrada entre los puntos `a` y `b` (`[x, y, z]`). |

*Primitivas suaves* — una normal por vértice, compartida entre caras (sin facetas). La normal lleva 255 en su 4.º byte y
el shader de detalle **no la voltea** hacia la cámara: son para superficies **cerradas** (o adosadas por detrás), con
las normales hacia fuera. Puntos y normales van en el marco `F` como `[u, y, d]`; con `F0`, `[x, y, z]` locales de celda.

| Primitiva | Qué emite | Triángulos |
| --- | --- | --- |
| `quadN(B, F, P, N, col, kind, aux?)` · `triN(B, F, P, N, col, kind, aux?)` | Cuadrilátero / triángulo con `P = [[u,y,d], …]` y una normal por vértice `N = [[nu,ny,nd], …]` (sin normalizar vale). | 2 · 1 |
| `rev(B, F, u, d, perfil, lados, col, kind, o?)` | Torno: `perfil = [[r, y], …]` de abajo arriba por fuera, alrededor del eje vertical que pasa por `(u, d)`. Un punto repetido = arista viva; `r = 0` cierra en el eje; un tercer valor `[r, y, [r,g,b]]` da color a ese anillo. `o = { aux, cap: 1 tapa arriba · 2 abajo · 3 ambas, a0, a1: arco parcial en radianes (0 = +u, π/2 = +d) }`. | 2·lados por tramo (lados si toca el eje) + (lados − 2) por tapa |
| `tube(B, F, pts, r, lados, col, kind, o?)` | Tubo por la polilínea `pts = [[u,y,d], …]`, radio constante o `r(t)` (t de 0 a 1 por puntos); codos a inglete. `o = { aux, closed: true anillo cerrado, caps: true tapas planas }`. | 2·lados por tramo + (lados − 2) por tapa |
| `sphere(B, F, u, y, d, r, gajos, anillos, col, kind, aux?, sy?)` | Esfera centrada en `(u, y, d)`; `sy` = radio vertical / radio (elipsoide). | gajos·(2·anillos − 2) |
| `cyl(B, x, z, y0, y1, r0, r1, lados, col, kind, aux?)` | Tronco de cono vertical con tapa arriba (un `rev` de dos puntos). Coordenadas locales de celda. | 3·lados − 2 |

Las suaves leen del `aux` solo sus 4 primeros bytes (el mismo valor para todos sus vértices), salvo `quadN`/`triN`, que
lo leen por vértice. Con 3 o 4 lados un tubo fino ya se ve redondo (lo que redondea es la normal, no la silueta); el
mobiliario usa 7–10 lados en piezas de 30–150 cm de ancho.

*Canal auxiliar y colores:* `pbrAux(rugosidad, metal, patrón, emisión)` (tipo `K.PBR`, §6.7), `subAux(aux?)` (marca un
quad como SUSTITUTO: `w = 255`, §6.8), `latAux(variante)`, `signAux(id)`; `shade(col, f)` (aclara u oscurece un color;
no es el `shade` del preludio GLSL), `mixc(a, b, t)` (colores `[r, g, b]` 0–255) y `F0` (marco identidad: con él
`(u, y, d)` = `(x, y, z)` locales de celda).

**Azar por ámbito.** Hay un único estado, pero **nadie depende del orden de las llamadas ni de lo que consuma otro
módulo**. Regla: *cada hook empieza sembrando su ámbito, saca de golpe todos los números que necesita (a variables) y no
cede el control (`yield`/`await`) entre medias.*

- `seed(a, b?, c?, d?)` siembra con hasta cuatro **enteros** (se mezclan con un hash tipo murmur; un id ausente no
  equivale a 0). Después: `R()` → [0,1), `R(a)` → [0,a), `R(a, b)` → [a,b), `pick(lista)`.
- `hash2(i, j)` → [0,1): función pura de dos enteros, sin estado (para una decisión suelta: ¿hay árbol aquí?).
- `seedRaw(n)`: estado tal cual, sin mezclar. **Solo** para las secuencias heredadas de Transeúnte (texturas y árbol de
  `streets.js`), que deben salir idénticas. El código nuevo usa `seed`.

| Ámbito | Semilla | Quién lo siembra | Qué decide hoy |
| --- | --- | --- | --- |
| Edificio | `seed(b)` = `env.rnd()` | `genB` (`facades.js`) | estilo, colores, porticones, tribunas, balaustrada |
| Tramo de fachada | `env.rnd(1, i)` | `genB` | vano de la tribuna (`run.M`) |
| Vano de planta baja | `env.rnd(2, i, W)` | `groundFloor` (`interiors.js`) | 6 números: persiana, tinte, rótulo, toldo, farol |
| Vano de piso | `env.rnd(3, i, W*64 + D)` | `floors` (`details.js`) | 7 números: persiana, balcón corrido, maceta, forja |
| Coronación | `env.rnd(4, i)` | `crown` (`details.js`) | (nada todavía) |
| Tramo liso o ciego | `env.rnd(5, i)` | `plainRun`, `blindRun` (`details.js`) | (nada todavía) |
| Mobiliario, por objeto o grupo | `seed(tipo, n, s)` | `furniture.js` | `tipo`: 2 papelera, 4 contenedores, 5 Bicing; `n` = índice de retícula de `along`; `s` = tramo de calle |

`env.rnd(…ids)` = `seed(b, …ids)` con `b` = índice del edificio; `i` = `run.i` (índice del tramo en la disposición), `W` =
vano, `D` = planta (1 … `nF`). Para ámbitos nuevos, cada carril usa su rango de segundo id: 10–19 `interiors.js`, 20–29
`details.js` (p. ej. `env.rnd(21, i, W)`), y en el mobiliario tipos nuevos a partir de 10.

- **Las capas BASE y ORNAMENTO se generan en pasadas distintas** y siembran los mismos ámbitos: para que salgan iguales
  basta con sacar los números al principio del ámbito, **sin condiciones** (ni `if (W1)`, ni «solo si se dibuja»).
- Dentro de un ámbito puedes sacar los números que quieras y cambiar cuántos sacas sin afectar a nadie más. Lo que no
  puedes es llamar a `R()` sin haber sembrado tú antes: te llevarías los restos del ámbito de otro.
- Las semillas son enteros estables (índices de edificio, tramo, vano, planta, retícula): nada de coordenadas con
  decimales ni contadores que dependan de la celda o del orden de construcción.

### 6.7 Tipos de material y registro (`K`, `regKind`)

El tipo de material viaja en el alfa del color de vértice y elige la rama del shader de detalle (`FS_DET`, en
`facades.js`), que pinta las fachadas **y** la malla de mobiliario de las calles.

| id | `K.` | Rama | id | `K.` | Rama |
| --- | --- | --- | --- | --- | --- |
| 0 | `STUCCO` | estuco fotografiado | 8 | `SIGN` | rótulo (`aux`: uv en x,y; nº de rótulo en z) |
| 1 | `STONE` | sillar | 9 | `AWN` | toldo a rayas |
| 2 | `GLASS` | vidrio de ventana | 10 | `BAL` | balaustrada calada (`aux` de `latAux`) |
| 3 | `SHUT` | persiana de lamas | 11 | `GSHOP` | vidrio de escaparate |
| 4 | `WOOD` | madera | 12 | `LAMP` | farol (emisivo, más al anochecer) |
| 5 | `METAL` | metal pintado o lacado, satinado (el metal visto es `K.PBR` con `metal` = 1) | 13 | `PLAIN` | liso |
| 6 | `IRON` | forja calada (`aux` de `latAux`) | 14 | `LEAF` | hojas (y cualquier id sin rama) |
| 7 | `SGRAF` | esgrafiado | 15 | `PBR` | genérico (`aux` de `pbrAux`) |

**`K.PBR`, el tipo genérico.** El color de vértice es el albedo y el auxiliar, `pbrAux(rugosidad, metal, patrón, emisión)`:

- `rugosidad` y `metal`, de 0 a 1 (ver `shade`, §6.4);
- `patrón` (entero): 0 liso · 1 lamas horizontales cada 6 cm (vale en superficies curvas) · 2 nervios verticales cada
  14 cm (solo caras planas) · 3 pintura gastada, con roces y suciedad;
- `emisión`, de 0 a 1: luz propia con el color del albedo, siempre encendida (0,5 = se ve con su color aunque no le dé
  la luz; 1 = el doble). Para luces que se encienden al anochecer, `K.LAMP` o un tipo propio con `uDusk`.

```js
const PINTURA = pbrAux(0.42, 0, 0, 0), ACERO = pbrAux(0.4, 1, 0, 0);           // una vez, fuera de los bucles
obox(W, x, z, y, 1.5, 1.4, 1.1, ang, [20, 77, 158], K.PBR, pbrAux(0.6, 0, 2, 0));   // contenedor de plástico con nervios
rev(W, F0, x, z, [[0.16, y], [0.09, y + 0.55], [0.055, y + 7.8]], 7, [38, 46, 42], K.PBR, { aux: PINTURA, cap: 1 });
```

**Rangos de id reservados:** 0–19 núcleo (`facades.js`) · 20–39 `interiors.js` · 40–59 `details.js` · 60–79
`furniture.js` · 80–99 `ground.js` · 160–199 kit de fachadas (`kit.js` y bloques, §16).

**Añadir un tipo:** `GEO.regKind(nombre, id, glsl, decl?)`, **al cargar el script** (nivel superior del fichero, no
dentro de `init`): el shader se monta una sola vez, al iniciarse `facades.js`, y después `regKind` lanza un error.
Da de alta `K[nombre] = id` y devuelve `id`; lanza si el nombre está repetido o no es del estilo `MI_TIPO2`
(mayúsculas, dígitos y `_`), o si el id está repetido o fuera de 20–255.

```js
// interiors.js, nivel superior (rango 20–39)
const { K, regKind } = window.BCN_GEO;
regKind('MITIPO', 20, `
    vec3 tx = texture2D(tMiTex, P*0.5).rgb;
    alb = vCol.rgb*tx; rough = 0.35; metal = 0.0;
    emis = emit(tx, uMiBrillo*uDusk);`,
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
  estables para texturas y patrones **en caras planas**: en superficies suaves usa `vLoc`); `T`, `Bv` (tangente y
  bitangente de la cara); `n` (normal geométrica: vuelta hacia la cámara si es plana, tal cual si es suave) y `an`
  (= `abs(n)`); `V` (unitario hacia la cámara) y `dist` (m); `nearF` (1 cerca → 0 a 170 m); `dt` (tramado del píxel);
  `uFade`, los uniformes y utilidades del preludio (`uDusk`, `uTime`…) y los samplers `tPlD`/`tPlN` (estuco),
  `tAsD`/`tAsN` (sillar) y `tSign` (rótulos).
- **Y escribir — contrato de sombreado:** `alb` (albedo; llega con `vCol.rgb`), `N` (normal de sombreado; llega con
  `n`), `rough` (0,62), `metal` (0), `ao` (1) y `emis` (vec3 0; usa `emit(color, ganancia)`). Al salir de la rama el
  shader hace **una única salida**: `c = shade(alb, N, V, rough, metal, ao) + emis; FRAG(c);`. Una rama **no ilumina**.
- Solo los vidrios terminan por su cuenta, con las mismas piezas (`envRefl`, `emit`) y `FRAG(c); return;`. Una rama
  también puede hacer `discard` (la forja).
- En un quad de la **capa BASE** de una fachada, `vInfo.w` = 1 (byte 255) significa «sustituto» (§6.8): si tu tipo usa
  ese cuarto byte para otra cosa, no llegues a 255 (`pbrAux` se queda en 250).
- Las variables locales de la rama no chocan con las de otras (cada una va entre llaves), pero no declares nada que
  se llame como las de arriba.

### 6.8 `ctx.city` y `ctx.detail` (los publica `facades.js`)

`ctx.city` — rejilla de celdas de `CS` = 100 m (`NX` × `NZ`; índice `ci = j*NX + i`) y consultas en coordenadas de mundo:

| Campo | Qué es |
| --- | --- |
| `CS`, `NX`, `NZ`, `cellOf(x, z)` | Rejilla e índice de celda de un punto. |
| `ALL`, `ELIG`, `ROADS` | Listas por celda (`{ start, list }`; los de la celda `c` son `list[start[c] … start[c+1]-1]`): todos los edificios cuya caja toca la celda, edificios con fachada de detalle (por el centro de su caja) y tramos de calle que tocan la celda. |
| `BB` | `Float32Array`: caja `x0, z0, x1, z1` de cada edificio. |
| `CAR`, `WALK`, `WSW` | `Set` de clases de vía con calzada · `Set` de clases con aceras a ambos lados · ancho máximo de acera desde el bordillo (14 m). |
| `bget(b)` | Edificio `b`: `{ cls, seed, yb, y0, y1, rings: [Float64Array x,z,…], col }` (cotas absolutas; `col` = color de paleta). |
| `inside(d, x, z)` | ¿El punto está dentro de la planta del edificio `d` (el objeto de `bget`)? |
| `coverAt(x, z, propio)` | Cota superior del edificio que ocupa el punto (sin contar `propio`), o `-1e9` si no hay ninguno. Con `propio = -1` sirve de «¿hay edificio aquí?» (`> -1e8`). |
| `roadDist(x, z)` | Distancia al borde de la vía más cercana, de cualquier clase (negativa dentro; `1e9` si no hay ninguna en la celda). |
| `segDist(s, x, z)` | Distancia del punto al eje del tramo `s`. |
| `nearestCar(x, z)` | `[s, d]`: tramo con calzada más cercano (`-1` si no hay) y distancia a su borde. |
| `roadY(s, x, z)` | Cota de la calzada del tramo `s` junto al punto (la misma que la cinta de calle de `app.js`). |
| `walkY(s, x, z)` | Cota de la acera junto al tramo `s` (admite `s = -1`: terreno + 0,2). |
| `walkAt(x, z)` | **Cota de la acera en un punto cualquiera: exactamente la de la malla de acera.** |

**Cota de acera común.** Todo lo que se apoya en la acera usa la misma cota: la malla de acera (`streets.js`) es una
retícula de 1 m sobre coordenadas de mundo enteras, partida en triángulos por la diagonal (0,0)–(1,1); en cada vértice
manda el tramo con calzada más cercano de los que lo alcanzan con su acera (una calle con aceras llega a `WSW` m de su
bordillo; cualquier otra calzada, a 1,5 m) y la cota es `walkY` de ese tramo. `walkAt` reproduce esa regla y esa
interpolación, así que da la altura de la malla en cualquier punto (medido en 10 000 vanos de tres barrios, uno llano y
dos en cuesta: 5 mm de diferencia máxima; la cuenta de antes, «terreno + 0,32», se iba de media entre 10 y 31 cm). Las
fachadas apoyan la planta baja en ella a través de `run.gnd(c)`. **La regla vive en dos sitios** (`cellJob` de
`streets.js` y `walkVert`/`walkAt` de `facades.js`): quien cambie uno cambia el otro. El mobiliario sigue usando
`walkY(tramo, x, z)` con su tramo más cercano, que coincide salvo junto a un cambio de tramo; si algo necesita casar al
milímetro (un umbral, un felpudo), `walkAt`.

`ctx.detail` — `matB` y `matH` son los materiales de detalle de las capas BASE y ORNAMENTO (el mismo shader con distinto
`uFade`; la malla de mobiliario usa `matB`); `mats = [matB, matH]` para fijar texturas y uniformes en los dos;
`mkMesh(W, material, nombre)` convierte un `GB` en malla (atributos `position`, `color`, `uv` = auxiliar, `nrm`),
devuelve `null` si está vacío y **no** la registra: pásala por `reg`.

**Sustitutos: que la capa ORNAMENTO reemplace de cerca algo de la capa BASE.** La capa BASE se ve hasta ~200 m y la
ORNAMENTO solo a menos de ~95 m, entrando con un fundido tramado entre 95 y 70 m. Para que un interior de verdad
(ORNAMENTO) sustituya de cerca a un escaparate o una puerta opacos (BASE):

- emite el quad opaco en la capa BASE **marcado como sustituto**: `aux.w = 255` en sus cuatro vértices, con `subAux()`
  (o `subAux(otroAux)` si el tipo ya usa el auxiliar): `rect(W0, F, u0, u1, y0, y1, d, col, K.GSHOP, subAux())`;
- emite lo que lo reemplaza en la capa ORNAMENTO (`W1`), sin marca.

El shader descarta el sustituto, con el tramado **complementario** al de entrada del ORNAMENTO (cada píxel lo pinta uno
de los dos, sin huecos ni dobles), **solo si la capa ORNAMENTO de su celda existe**: mientras no esté construida, el
sustituto se queda. Eso lo dice el uniforme por malla `uCellHi` (0/1), que el material fija al enlazar cada malla
leyendo `mesh.metadata.bcn.cell.hi` (la malla BASE lleva su celda desde `reg`; las demás mallas valen 0). `uFadeHi`
lleva las distancias del fundido. El relevo es exacto píxel a píxel cuando lo que entra está más o menos a la misma
profundidad que el sustituto (medido con dos paños coplanarios en plena banda: ni un hueco); si queda mucho más al fondo,
en la banda de 70–95 m puede asomar algún píxel suelto. Hoy ningún quad es sustituto. Ojo: en la capa BASE el byte 255 de `aux.w` queda
reservado para esto, y en la malla de mobiliario (que usa `matB` sin celda) la marca no hace nada.

### 6.9 Hooks de fachada: `interiors.js` y `details.js`

`facades.js` los carga con `await ctx.hooks(descripción, 'BCN_…', respaldo)`: llama a `init(ctx)` del global (puede ser
`async`) y completa el objeto de respaldo con lo que devuelva; si el global no existe o `init` falla, avisa y se queda
con el respaldo (paños lisos). Firmas:

```js
window.BCN_INTERIORS = { SHOPS, init(ctx) → { groundFloor(env, run), signTex } }
window.BCN_DETAILS   = { init(ctx) → { floors(env, run), crown(env, run), plainRun(env, run), blindRun(env, run) } }
```

`genB` (en `facades.js`) siembra el ámbito del edificio, decide estilo, colores y cotas (`env`) y, **por cada tramo
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
| `rnd(…ids)` | Siembra un ámbito de azar de este edificio: `seed(b, …ids)` (§6.6). Después se sacan los números con `R()`. |

**`run`** (uno por tramo):

| Campos | Qué son |
| --- | --- |
| `r`, `i` | Tramo de la disposición: `{ ax, az, tx, tz, nx, nz, L, kind, cover }` en coordenadas de mundo, y su índice (estable: es el que entra en las semillas). |
| `F` | Marco de fachada listo para las primitivas (relativo a la celda y 4 cm hacia fuera). |
| `L`, `kind`, `cover` | Longitud, tipo y cota hasta la que lo tapa un edificio vecino (`-1e9` si no lo tapa nadie). |
| `street` | `true` si da a una calle (en `'plain'` y `'blind'` vale `false`). |
| `nb`, `bw` | Número de vanos y ancho de cada uno (el vano `W` ocupa `u` de `W*bw` a `(W+1)*bw`). |
| `N`, `M` | Vano del portal (`-1` si este tramo no lo lleva) y vano de la tribuna (`-9` si no hay). |
| `wallC` | Color del muro del tramo (`p` a la calle; algo más oscuro al patio). |
| `gnd(c)` | Cota de la acera al pie de la fachada en el punto `u = c` del tramo: `city.walkAt` a 30 cm del muro (§6.8). `groundFloor` la limita a `F1 - 2.7` para que quepa una puerta. |

En los tramos `'plain'` y `'blind'`, `run` solo trae `r`, `i`, `F`, `L`, `kind`, `cover` y `street`.

**Azar de los hooks** (§6.6): cada hook siembra su ámbito con `env.rnd(…)` y saca sus números al principio, sin
condiciones. `groundFloor` lo hace por vano (`env.rnd(2, run.i, W)`, 6 números en `rr`) y `floors` por vano y planta
(`env.rnd(3, run.i, W*64 + D)`, 7 números en `rr`); `crown`, `plainRun` y `blindRun` siembran el suyo aunque hoy no
saquen nada. Ya **no** hay que conservar el número de llamadas a `R()`: cada ámbito es independiente de los demás.

**En cuesta**: la acera sube o baja a lo largo del vano y `gnd(c)` es su cota en el centro. Lo que llegue al suelo tiene
que bajar más que eso (el muro baja hasta `env.y0`; el portal lleva un zócalo bajo el umbral): nada de dejar el borde
inferior justo en `gnd(c)`.

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

Reglas: filtra tú la clase de vía (`cls`) y el ancho; apoya en la acera con `ctx.city.walkY(ns, x, z)` (o `walkAt`, §6.8)
y en la calzada con `ctx.city.roadY(s, x, z)`; si usas `R()`, siembra antes el ámbito del objeto, `seed(tipo, n, s)`, y
saca de golpe todos sus números, **antes** de decidir si cae en la celda (así sale igual desde las dos celdas que
recorren el tramo). Lo redondo se hace con las primitivas suaves (`rev`, `tube`, `sphere`, `cyl`) y lo metálico o pintado
con `K.PBR` (§6.6 y §6.7); el presupuesto de la malla es el de siempre: hoy una farola son 77 triángulos, una papelera 40,
un iglú 92 y una bici 296. Lo emitido dentro de
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
materiales, creados con `mkMat`, que reciben solos los uniformes globales), `ctx.L` (sol, cielo y `dusk` de la hora
actual) y, en `app.js`, el preludio: el contrato de sombreado (`lit`, `shade`, `envRefl`, `emit`), `fog()` y las salidas
`FRAG`/`FRAG_NOFOG`/`FRAGA`, por donde pasa el color de **todos** los shaders (§6.4). Quedan fuera del contrato, con su
luz hecha a mano, tres sitios de `app.js`: el brillo del asfalto en `FS_ROAD`, los muelles (`FS_QUAY`) y el mar
(`FS_SEA`); y en `facades.js`, la mezcla interior/reflejo de los vidrios (que sí usa `envRefl` y `emit`).




## 7. Carril LUZ

Etapas LZ1 (HDR lineal y postproceso, §7.1–7.5), ciclo de 24 horas (§7.6, pulido en LZ3 y en NOCHE: noche fiel a las fotos), LZ2 (sombras del sol, §7.7) y LZ3
(oclusión ambiental, §7.8; calibración por horas, §7.9). Lo que aquí se dice **sustituye** a la columna «Hoy» de la tabla de §6.4 y al «hoy
no hace nada» de §6.12; el contrato (nombres y firmas de `lit`, `shade`, `envRefl`, `emit`, `fog`, `FRAG*`) no cambia.
Cambio mínimo en lo común: `index.html` gana la fila «Gráficos» (`gqLab`, `gqRow`, `gq0`…`gq3`, `gqV`).

### 7.1 Preludio lineal/HDR (`PRELUDE`, en `app.js`)

- **Espacios de color.** Los cuerpos de los shaders siguen en «espacio de pantalla» (colores de autor). Por dentro la luz
  se calcula en lineal: `toLin(c) = c^2.2`, `toScr(c) = c^(1/2.2)`. `lit` y `shade` reciben y devuelven espacio de
  pantalla (el resultado puede pasar de 1: eso es HDR), así que lo que un cuerpo suma a mano sigue valiendo.
- **Luz lineal.** Tres uniformes nuevos: `uSunL` (sol a incidencia normal), `uSkyL` (cielo, normales hacia arriba) y
  `uGndL` (rebote cálido del suelo, normales hacia abajo). Unidad: 1 = «un albedo se ve tal cual». `setHour` los saca de
  los colores de pantalla de siempre: `color^2.2 × ctx.L.K.{sun, sky, gnd}` (2,3 · 1,6 · 1,5; a mediodía sol : cielo ≈ 8 : 1).
  `ambL(n)` es el ambiente hemisférico. `uSunCol`, `uSkyCol` y `uGndCol` siguen existiendo.
- **`sunVis()` / `sunVisN(n)`**: visibilidad del sol en el fragmento (las sombras en cascada, §7.7). Multiplica **solo** la luz directa de `lit` y
  `shade`, el brillo especular de `shade`, el disco del sol de `envRefl` y los brillos hechos a mano del asfalto
  (`FS_ROAD`) y del mar (`FS_SEA`). Se calcula una vez por fragmento (con la primera normal que se le pase).
- **Salida.** `FRAG(c)`: pasa a lineal, aplica la niebla en lineal (`fogL`) y escribe RGB = radiancia HDR lineal (tope
  4000) y A = distancia a la cámara en metros (tope 60000). `FRAG_NOFOG`: igual, sin niebla y con A = 60000. `FRAGA(c, a)`:
  A = opacidad (los materiales con mezcla no tocan el alfa del búfer, §6.4). `fog()` (mezcla en espacio de pantalla) se
  conserva por compatibilidad, pero ya no la usa la salida.
- **`emit(col, gain)`** = `col*gain` en espacio de pantalla: gain 1 se ve como el color de autor. En lineal son
  `gain^2.2`, así que gain 2 ≈ 4,6× y gain 4 ≈ 21×: con el umbral de bloom actual florece a partir de gain ≈ 1,6 sobre
  un color claro.
- **Cielo y mar.** `skyColor` lleva un disco solar de 9× `uSunCol` (más el halo); el brillo del sol en el mar llega a 7×.
  Los muelles (`FS_QUAY`) pasan por `lit`.
- **Uniformes y muestreadores globales.** `BASEU` (uniformes) y `BASES` (muestreadores, hoy vacío) se añaden a todo
  material. Para añadir uno: declararlo en `PRELUDE`, apuntar el nombre en `BASEU`/`BASES` y darle valor en `lightTo()`
  (depende de la hora), en el `onBeforeRender` junto a `uTime` (cada fotograma) o desde un módulo con
  `ctx.eachMat(m => m.setTexture('uX', tex))`, que se aplica a los materiales ya creados y a los que se creen después.

### 7.2 Cadena de postproceso (`lighting.js`)

`BABYLON.DefaultRenderingPipeline('bcnPost', hdr = true)` sobre la cámara, todo dentro de `scene.render()`:
[oclusión ambiental, tres pases propios (§7.8): la escena entra ahí, en coma flotante con MSAA] → búfer HalfFloat →
bloom (umbral alto) → exposición + ACES + gamma + contraste + viñeta + tramado → nitidez leve → FXAA (solo si no hay MSAA).
(Ese es el orden real en que Babylon monta `DefaultRenderingPipeline`.) El lienzo es opaco (`alpha: false`) y sin
antialiasing propio en el camino HDR.

- Ajustes (`P` en `lighting.js` y `ctx.L.tone`): exposición 1,6 · contraste 1,08 · `bloomT` 2,6 (umbral de luminancia
  lineal ya expuesta; de noche baja hasta ×0,7 con `L.night`) · `bloomW` 0,16 · `bloomK` 64 · `sharpen` 0,10 · `vignette` 0,3.
- **Calibrar en caliente**: `BCN.light.set({ exposure, contrast, sun, sky, gnd, bloomT, bloomW, bloomK, sharpen, vignette })`
  (en la consola o en el `eval` de una vista del arnés). `BCN.light.pipe` es la cadena de Babylon.
- Trampas: el ACES de Babylon no lleva la ganancia 1/0,6 (por eso la exposición no es 1); la viñeta con peso 1 deja las
  esquinas al 28 %; `bloomThreshold` se pasa elevado a 2,2 porque Babylon lo compara como `umbral^(1/2.2)`.

### 7.3 Calidad gráfica

Fila «Gráficos: Auto / Baja / Media / Alta» del panel → `BCN.light.setQuality('auto' | 'baja' | 'media' | 'alta')`
(también 1, 2, 3). Tabla `QUAL` de `lighting.js` (las etapas de sombras y oclusión añaden ahí sus columnas):

| | escala de render | MSAA | bloom | nitidez | sombras (lado del mapa · filtro) | oclusión ambiental (muestras) |
| --- | --- | --- | --- | --- | --- | --- |
| baja | 0,67 | no (FXAA) | no | no | no | no |
| media | 0,85 | 2 | sí (búfer a 0,35) | sí | 1024 · 2×2 | 8, a media resolución |
| alta | 1 | 4 | sí (búfer a 0,5) | sí | 2048 · 3×3 | 12, a media resolución |

Auto empieza en alta y baja un escalón cuando el tiempo medio de fotograma real supera 34 ms en dos ventanas seguidas
de 2 s (nunca en modo captura, con la pestaña oculta o tras un parón; nunca sube solo). `BCN.light.stats()` →
`{ hdr, quality, auto, scale, msaa, bloom, ms, w, h, shadow, ao }` (`shadow`: §7.7; `ao`: §7.8).

### 7.4 Camino LDR

Sin postproceso: los materiales llevan `#define LDR` y `FRAG` aplica exposición, ACES, gamma y contraste (`uTone`) y
escribe A = 1; el lienzo usa su propio antialiasing. Se usa con `?ldr=1`, sin WebGL2 o sin render a HalfFloat
(`ctx.out.hdr = false` desde el arranque), y **en caliente** (`ctx.setLDR()`: recompila todos los materiales) si
`lighting.js` falta, falla al iniciarse (`?nolight=1` lo simula) o no consigue montar la cadena. En ese último caso el
lienzo ya se creó sin antialiasing: se ve correcto pero con dientes de sierra. No hay viñeta ni bloom en este camino.

### 7.5 Cómo se depura

- `node tools/shot.js tools/out/lz/v @tools/views_luz.json` (las vistas de verificación de LUZ); `Q='?ldr=1'` y
  `Q='?nolight=1'` para los otros dos caminos. `detailStats().light` sale en cada línea del arnés.
- Imagen negra o blanca: mira `BCN.light.stats().hdr` y `BCN.ctx.out.hdr`; deben coincidir. Si un shader nuevo escribe
  `gl_FragColor` a mano, saldrá en gamma dentro de un búfer lineal (lavado y sin niebla): que acabe en `FRAG`.
- Para ver el búfer sin tono: `BCN.light.pipe.imageProcessingEnabled = false`.




### 7.6 Ciclo de 24 horas y reglas de noche

`setHour(hh)` admite de 0 a 24 (el deslizador también; botones «Día», «Tarde», «Noche» y «▶ Pasa», que hace correr el
reloj: 1 s real = 1 min de juego, un día cada 24 min, recalculando la luz una vez por segundo).

- **Sol**: sale a las 6:00 y se pone a las 21:00 (verano); de noche sigue bajando bajo el horizonte. Entre −3,5° y 1° se
  apaga (`sf`). **Luna**: con el sol 4,3° bajo el horizonte, la luz direccional pasa a ser la luna (se enciende entre −5,2°
  y −10°, `mf`). Usa los MISMOS uniformes (`uSunDir`, `uSunCol`, `uSunL`): las sombras en cascada, los brillos y el disco
  del cielo valen sin tocar nada (de noche el «disco del sol» es la luna). El cambio de dirección ocurre con la luz a cero.
- **Paletas** (espacio de pantalla): atardecer ↔ día según la altura del sol (`e`) y todo ello hacia la paleta de noche
  según `nt` (0 con el sol a −1°, 1 a −9°). Estrellas y nubes oscuras en el shader del cielo.
- **Horizonte del lado del sol** (LZ3). Con el sol bajo, `uFogCol` es un gris malva (también en el lado contrario) y el
  naranja va solo hacia el sol: `uSunH = (x, z hacia el sol de verdad —también bajo el horizonte—, fuerza, luna)` y
  `uHorzC` (lo que el horizonte del lado del sol tiene de más). `horzCol(d)` da el color del horizonte en la dirección `d`;
  lo usan `skyGrad` (cielo y reflejos: `envRefl`, el mar) y la niebla (`fog`/`fogL`), así lo lejano se funde con el cielo
  que tiene detrás. La fuerza (`sg` en `setHour`) va de 0 con el sol a 18° a 1 hacia los 3°, y se apaga entre −1,5° y −9°
  (el resplandor dura un rato después de ponerse el sol, cada vez más rojo). De día, `horzCol = uFogCol`: nada cambia.
- **Luna** (LZ3). Con la luz direccional en la luna (`uSunH.w`), el disco del sol de `skyColor` se cambia por `moonCol`:
  disco blanco de 1,2° de radio (la de verdad mide 0,26°: se exagera para que se lea), mares con ruido, oscurecimiento del
  borde y un halo corto azulado. Brilla lo justo para un poco de bloom sin quemar los mares.
- **Hora azul** (LZ3). Recién puesto el sol (de 0,5° a −5°, antes de la noche cerrada) se quita parte de la adaptación del
  ambiente (`K.blue` = 0,5): el suelo queda en penumbra en vez de parecer una tarde nublada.
- **Suelo claro bajo la luna** (LZ3). La ortofoto del relieve (`FS_TER`) es de día y lo muy claro (hormigón del puerto,
  explanadas) lleva el sol pintado: de noche (`uNight`) lo más claro se apaga hasta un 45 %. Igual con los muelles (`FS_QUAY`).
- **Adaptación del ojo**: `K.dAmb`/`K.dExp` al anochecer y `K.nAmb`/`K.nExp` de noche; `K.moon` (0,8) es la ganancia de
  la luna; `K.blue`, la hora azul (arriba). El umbral del bloom baja de noche hasta ×0,7 (`L.night`), para que lo más
  brillante de la ciudad florezca.
  De día, `K = sol 1,7 · cielo 4,4 · suelo 4,8 · exposición 1,2`: lo soleado NO debe quemarse (con el ACES de Babylon una
  acera clara al sol queda ≈ +15 % sobre su color de autor y una pared blanca por debajo de 0,85) y la sombra queda hacia
  la mitad de lo soleado. Se calibra en caliente con `BCN.light.set({...})`.

**Día fiel a las fotos (etapa DIA).** Referencia: dos fotos reales de la mañana del usuario (avión sobre la Torre de
Collserola hacia el mar con el sol bajo, y desde el Observatori Fabra a media mañana). Encima de los `K` de arriba (que no
cambian) hay un «modo día» que vale 1 a pleno día y se desvanece al ponerse el sol y de noche (`dd = e·(1 − nt)` en
`setHour`); los shaders usan `(1 − uNight)`. Resultado: **a las 23:00 la imagen es idéntica píxel a píxel** a la de antes
(medido en las 6 vistas de `noche_fiel/v23.json`) y el atardecer apenas cambia.

| Qué | Dónde | Valor |
| --- | --- | --- |
| Sol de mañana cálido aunque ya esté alto | `setHour` (`wm`) | G ×(1 − 0,12·wm), B ×(1 − 0,30·wm); wm = 1 − sstep(8°, 70°) del sol: 8:30 (32°) dorado, 10:30 algo cálido, mediodía neutro |
| Sol algo más fuerte de día | `K.sunD` | 1,08 |
| Sombras frescas, azuladas | `K.desD` (desaturación del cielo como ambiente de día; de noche sigue `des` 0,55) · `K.skyD` · `K.gndD` | 0,14 · 0,92 · 0,72 (menos rebote cálido del suelo, que agrisaba la sombra) |
| Exposición de día | `K.expD` | 1,12 (sin quemar: p99 de luminancia a pie a las 13:00 ≈ 185/255, igual que antes) |
| Bruma y horizonte azulados | `K.fogDay` · `K.fogDD` | (0,58, 0,71, 0,86) en vez del blanco lechoso (0,74, 0,83, 0,92) · densidad ×0,7 de día |
| Mar azul intenso | `FS_SEA` | fondo (0,03, 0,20, 0,42), somero (0,08, 0,40, 0,50), reflejo del cielo ×0,62 (de noche, lo de siempre) |
| Mosaico de fachadas | `FS_BLD` (estilos 0, 2 y 6) | tinte por edificio: crema 30 %, ocre 20 %, blanco roto 18 %, arena 19 %, ladrillo 13 % |
| Cubiertas | `FS_BLD` (estilo 0) | teja terracota 30 %, azoteas claras 56 %, gris 14 % |
| Bosque y parques | `FS_TER` (`vg`, `mt`, `cw`) y `FS_OUT` | lo verde de la ortofoto pasa a oliva oscuro con textura de copas (tres octavas, que se apagan con el tamaño del píxel) por encima de 60–200 m de cota; en el llano (parques) solo la mitad del cambio |
| Calles lejanas como surcos en sombra | preludio `shOut()`, `sunTan()`; `FS_ROAD`, `FS_BLD` | más allá de la cascada lejana (o sin sombras, a partir de 150–400 m) la calzada recibe la fracción de sol de un cañón de ~20 m de alto (`1 − 13/(tan·(2·semiancho + 10))`, mín. 0,10) y los muros lejanos quedan en sombra por debajo de `19 − 14·tan` m. Toca `gSunVis` antes de `lit()` (también el brillo). Solo en el llano y nunca de noche |

Medido (640×360, vistas de `<scratchpad>/dia_fiel/vdia.json`): ladera de Collserola a contraluz ≈ (87, 93, 77), en sombra
≈ (49, 61, 41) frente a (98, 94, 53) / (52, 66, 58) de las fotos; franja alta del cielo (109, 143, 181); a pie, sin
cambio de brillo apreciable y sin quemados. Hoja ANTES/DESPUÉS/REFERENCIA: `<scratchpad>/dia_fiel/hoja.jpg`.
**Flojo:** la ciudad vista desde Fabra sigue algo más gris y oscura que la foto (≈ (120, 120, 118) frente a (171, 151, 135));
las laderas no proyectan sombra más allá de la cascada lejana (400 m), así que Collserola no tiene las grandes sombras de
colina de la foto; la textura de copas de lejos parece más musgo que bosque; las copas de los árboles de calle
(`streets.js`) siguen siendo verde medio y oscuro uniforme.

**Qué se enciende de noche** (uniformes globales del preludio, en todos los materiales):

| Uniforme / función | Valor | Quién lo usa |
| --- | --- | --- |
| `uDusk` | 0 de día → 1 del anochecer al amanecer, toda la noche | farolas y su charco de luz, semáforos, faroles de fachada, portales |
| `uNight` | 0 → 1 noche cerrada | cielo (estrellas, nubes), adaptación |
| `uLate` | 0 por la tarde-noche → 1 de madrugada (sube de 22:45 a 0:00 y baja de 5:30 a 6:30) | «la ciudad duerme» |
| `shopOn()` | `uDusk·(1 − 0,94·uLate)` | comercios, rótulos y bajos comerciales: encendidos al anochecer, apagados de madrugada (queda una luz de vigilancia) |
| `homeOn(h)` / `homeFrac()` | ¿encendida la ventana de azar `h`? Fracción: 30 % al anochecer, 27 % a las 23:00, 5 % de madrugada | ventanas de pisos (fachadas de detalle y volúmenes lejanos) |

**Noche fiel a las fotos (etapa NOCHE).** Referencia: dos fotos reales del usuario (desde los Bunkers del Carmel y desde un
avión sobre el Eixample). De noche Barcelona es: **cielo azul marino casi negro y uniforme** (sRGB ≈ (0, 15, 31) justo encima
del horizonte, sin franja de color), **masas negras** salpicadas de ventanas encendidas, **calles como cadenas de puntos** de
sodio y avenidas de LED más blancas y brillantes, y un aura que es bloom y una bruma baja muy leve, nunca un color del cielo.

- **Trampa: el pie del ACES de Babylon.** `RRTAndODTFit` resta 0,000090537: por debajo de ~0,0035 lineal ya expuesto (tras
  `exposure`, ≈ 2,1 de noche) sale **negro puro**. El cenit de antes, (0,012, 0,018, 0,045), salía (0, 0, 0). Los colores
  oscuros de noche se calibran con el modelo de la cadena (exposición → matriz de entrada ACES → RRT → matriz de salida →
  gamma 1/2,2 → contraste), no a ojo: horizonte de noche `fg` = (0,069, 0,122, 0,193) → sRGB ≈ (2, 17, 34); cenit `zn` =
  (0,050, 0,099, 0,165) → ≈ (0, 12, 26). Medido en la franja alta de las vistas: (1, 14, 28). De noche las nubes toman el
  color del cielo (sin resplandor) y las estrellas bajan a la mitad con la ciudad encendida (`uGlow.z`).
- **Bruma de la ciudad** (preludio: `kHaze`, `cityW`, `hazeI`). Capa baja de densidad `exp(−y/160 m)` solo sobre el llano
  (`cityW`: elipse a lo largo de la costa, 1 dentro, 0 en Collserola y en el mar), gris cálida (`kHaze`), por `uGlow.z`. `fogL`
  la **suma** (luz dispersada) según los metros de capa que cruza el rayo; `FS_SKY` igual hacia el cielo. Desde la calle se ve
  como un velo gris azulado en el horizonte; desde Collserola o el avión la cámara está por encima y el cielo queda limpio.
  Ya no hay banda anaranjada en el cielo ni niebla parda de noche (`fogD` no cambia con la hora).
- **Calles** (`FS_ROAD`, `.x`). Charco de cada farola: gaussiana a lo largo de la vía que se ensancha con el tamaño del píxel
  **conservando su energía** (sin dientes de sierra) y solo se funde en su valor medio cuando la separación entre farolas baja
  de ~2 píxeles; más la **cabeza** de la farola, un punto de ~1 píxel que florece (desde 120–400 m). Color: sodio `kAura`
  (1, 0,60, 0,24) en las calles y LED `kLed` (1, 0,86, 0,68) en las avenidas (semiancho de 8 a 12 m o más), que además llevan
  hasta ×1,75 de luz y las vías principales ×1,2. Cerca (< 50–240 m) la calzada solo pone el 30 %: ahí mandan los charcos
  del mobiliario. Por encima de 200–380 m de cota (pistas de Collserola), casi nada.
- **Ventanas de lejos** (`FS_BLD`, de 260 a 1100 m en adelante). Chispas de ~1–2 píxeles: celdas de ventana (2,7 × 3,2 m) que
  crecen ×2 con la distancia para no hacer dientes de sierra. Densidad media ½·`homeFrac()` (≈ 14 % a las 23:00, 2–3 % de
  madrugada), **irregular**: azar por celda de 113 m (unas manzanas casi a oscuras, otras con muchas luces), por barrio
  (`vnoise` de 700 m) y por edificio. Color: 55 % cálidas, 30 % blancas neutras y 15 % azuladas (LED, televisores).
  `homeFrac()` (fachadas de detalle y volúmenes cercanos) queda en 30 % al anochecer, 27 % a las 23:00 y 5 % de madrugada.
- **Masas oscuras.** De noche (`uNight`) `FS_BLD` multiplica su luz recibida (no lo que emite) por 1 − 0,6 y las cubiertas
  además su albedo por 1 − 0,55 (casi negras); `FS_TER` y `FS_OUT` (montaña, parques, patios) por 1 − 0,55. **No** se toca el
  ambiente global (`nAmb` 0, `moon` 0,8): la calle cercana, las fachadas de detalle y los charcos de `furniture.js` (que
  multiplican lo que hay pintado) dependen de él; bajarlo hundía la calle a pie (medido: −30 % de media en `eix_acera`).
- `FS_BLD` (`.y`): luz de farola en la parte baja de los muros de los volúmenes lejanos, `exp(−h/6)`, solo en los muros que
  dan a una calle (**máscara de calles** `uStreet`/`uStreetR`, LZ3: celdas de 8 m que valen 1 a menos de «semiancho + 3 m» del
  eje de una calle; el muro mira 3 m por delante de sí; los de patio quedan al 8 %). `FS_TER` (`.w`): el suelo urbano coge
  algo de esa luz (al 15 % lejos de las calles). Ganancias: `L.K.city` (0 lo quita todo) × `K.calle`, `K.bajos`, `K.halo`,
  `K.suelo`; sube con la segunda mitad de `uDusk` y vale 0 de día (a las 12:00 la imagen es idéntica píxel a píxel a la de antes
  de esta etapa). En caliente: `BCN.light.set({ city: 0 })`.
- Los demás carriles pueden usar `uGlow`, `kAura`, `kLed` y `kHaze` (las copas de los árboles y las aceras de detalle de
  `streets.js` ya usan `uGlow.x` y `kAura`, §9.4).

Vistas: `tools/views_noche.json` (`n_*`: 23:00 desde Collserola, aéreo alto, dron, Turó de la Rovira con objetivo de 0,40 rad
como la foto de los Bunkers, `eix_acera` y `rambla_pie`; y 21:15, 3:00 y 12:00). Las aéreas llevan `BCN.st.maxDist=40000` y
todas reponen `BCN.cam.fov=0.86` (la de la Rovira lo cambia).

**Baño de sodio en fachadas de detalle y copas oscuras desde arriba** (etapa REMATE; detalle en `tools/encargos/progreso/REMATE.md`): rejilla de farolas `ctx.detail.lamps` (textura RGBA float 128 × 128 de celdas de 12 m que llena `streets.js` con los charcos de `cc.pools` y vacía al soltar cada celda) y `lampBath(p, n, k)` en `FS_DET` (`facades.js`): suma gaussiana (σ ≈ 6,8 m) de las farolas de las 3 × 3 celdas vecinas, que se apaga de 1,5 a 9 m sobre el pie; solo de noche, sin tocar los vidrios. En `FS_TREE`, con la cámara por encima de la hoja, la copa se oscurece y el aura de farola queda en la cara inferior, más un borde cálido sobre cada farola; vista desde abajo, igual que antes.

**Pendiente / flojo** (NOCHE): el baño solo existe a menos de ~270 m (celdas de calle de detalle); en calles con farolas alternas cada 24 m queda bastante continuo; el mar no refleja las luces del puerto (es negro azulado); comercios de horario distinto (bares, farmacia de guardia).

No se enciende nunca: parques, cubiertas, el mar y la montaña (solo reciben la luna).

### 7.7 Sombras del sol (etapa LZ2)

Sombras proyectadas reales del sol (de noche, de la luna: es la misma luz direccional, §7.6). Código en `lighting.js`
(«SOMBRAS DEL SOL»: pintar y mantener los mapas) y en el `PRELUDE` de `app.js` (`sunVisN`: recibirlas).

**Cascadas.** Dos mapas de profundidad vistos desde el sol, cuadrados y centrados en la cámara: la cercana de ±45 m (detalle
a pie: balcones, mobiliario, árboles) y la lejana de ±400 m (masas de edificios). Crecen con la altura de la cámara sobre
el suelo (×altura/50, en escalones del 25 %, hasta ×10), así que desde el dron y el avión siguen cubriendo lo que se ve.
Espacio de luz: Z hacia el sol, X horizontal perpendicular, Y = Z × X. El centro se ajusta a un múltiplo del téxel (el
mapa no «nada» al moverse). Cada mapa es una `RenderTargetTexture` RGBA8 con la profundidad empaquetada en RGB (WebGL1 y
SwiftShader sin texturas de profundidad), muestreo NEAREST, rango ±4000 m a lo largo del sol (`SH.R`).

**Qué proyecta** (`shList`): las mallas del registro `reg` con `cast` (y la capa `orn` de las fachadas, con `P.shOrn`)
cuya caja toca el cuadrado de la cascada en el plano XY de luz. Una variante del material de profundidad por formato
(`shMat`): normal; volúmenes simples (`coarse`: el muro de un edificio que ya tiene fachada de detalle se aleja 0,6 m del
sol para no tapar sus huecos); recortada por alfa (hojas). Reparto:

| | cercana | lejana |
| --- | --- | --- |
| relieve (`terrain`) | no | sí |
| volúmenes simples (`coarse`) | sí | sí |
| fachadas de detalle (`base`, `orn`) y mobiliario (`furn`) | solo a menos de `P.shNear`×45 m (63 m) en planta | no |
| árboles | los cercanos (`tNB`/`tNL`, < ~70 m) | los lejanos (`tFB`/`tFL`, ~55–520 m) |

Con el sol bajo el cuadrado se alarga cientos de metros sobre el suelo: sin el tope `shNear` entraban celdas enteras de
fachada cuya sombra fina no se distingue. Coste medido en `eix_acera` a las 17:00 (Alta): cercana ≈ 1,38 M triángulos
(fachadas 0,94 M, árboles 0,2 M, volúmenes 0,2 M), lejana ≈ 0,93 M (árboles 0,6 M, volúmenes 0,29 M); antes de recortar,
1,99 M y 1,14 M. `BCN.light.shBreak()` da el reparto por capa de cada cascada.

**Actualización perezosa** (`shUpdate`, cada fotograma). Una cascada se repinta si la cámara se ha alejado de su centro más
del 18 % del semilado (8 m a pie en la cercana, 72 m en la lejana), si cambia su tamaño, si cambia la hora (la dirección
del sol) o si cambia la lista de mallas que proyectan dentro (se comprueba cuando cambia `reg.ver` y cada 30 fotogramas).
Como mucho UNA cascada por fotograma, también con el reloj en marcha («▶ Pasa»: cada segundo cambia la hora y se repintan
en dos fotogramas seguidos). Por eso cada cascada guarda los ejes de luz con que se pintó (`uShX0/uShY0`, `uShX1/uShY1`;
su Z es X × Y): la que aún no se ha repintado sigue siendo coherente consigo misma. Sin luz direccional (relevo sol → luna,
≈ 21:15) no se pinta nada y `uShP.z = 0` (sunVis = 1, da igual: la luz es 0). Medido con la sonda de abajo: cámara quieta
0 repintados; medio metro 0; caminando 40 m a 1 m por fotograma, 6–7 repintados y nunca dos en un fotograma; reloj en
marcha `110110110` (fotogramas con repintado tras tres cambios de hora). En modo captura (`#shot`) cada cascada espera
hasta 2 fotogramas al `flush` del arnés, que llega con todo el detalle construido: una pintura por cascada y vista (antes, dos).

**Recepción** (`PRELUDE`). `sunVisN(n)` se calcula una vez por fragmento (`gSunVis`) y multiplica solo la luz directa del sol y
sus brillos (§7.1). Por cascada (`shCasc`): el punto se separa de la superficie a lo largo de la normal
`tx·(0,4 + 1,2·seno del ángulo con el sol)` (tx = téxel en metros: más separación cuanto más rasante es la luz) y se
compara con un margen de `0,25·tx + 1 cm`. Superficies de espaldas al sol: 0 sin mirar el mapa. Filtro PCF con pesos
bilineales (`shMap`: el borde se mueve de forma continua, sin escalones de téxel): 2×2 en Media, 3×3 en Alta. Mezcla
entre cascadas: la cercana pesa 1 hasta el 80 % de su semilado y 0 al 95 %; la lejana se desvanece entre el 80 y el 97 %
(más allá, sin sombra). `sunVis()` sin normal (reflejos del sol en vidrio, asfalto y mar) usa `uShZ·7`.

**Uniformes globales** (en `BASEU`/`BASES` para todo material de `mkMat`): `uShadow0`, `uShadow1` (mapas), `uShX0`, `uShY0`,
`uShX1`, `uShY1`, `uShZ` (ejes), `uShC0`, `uShC1` (centro de cada cascada y 1/semilado), `uShP` (resolución,
1/(2·R), filtro: 0 = sin sombras, 1 = 2×2, 2 = 3×3). Los da `lighting.js` (`shPush`, también a los materiales creados
después) como **referencias**: Babylon guarda el objeto, así que basta mutarlos. Sin `lighting.js`, `uShP` vale 0 y sunVis da 1.

**Calidades**: Baja sin sombras; Media 1024² y 2×2; Alta 2048² y 3×3 (tabla de §7.3). Por el camino LDR (`?ldr=1`) las
sombras funcionan igual (no dependen del postproceso). `BCN.light.set({ shadows: 0 })` las apaga para comparar.

**Cómo se depura.** `BCN.light.stats().shadow` → `{ res, half, n (mallas por cascada), tris, renders (total de
repintados), ok (todo al día), dark }`. `BCN.light.shadow` es el estado interno (cascadas, mapas, materiales):
`BCN.light.shadow.all = false` en el `eval` de una vista hace que el arnés se comporte como el juego (una cascada por
fotograma). Sonda de repintados y reparto: `<scratchpad>/lz2/probe.js` (pegarla como `eval` de una vista que repita la
posición de la anterior; escribe una línea `PROBE` como aviso de consola). Vistas del carril: `s_*` de `tools/views_luz.json`
(las aéreas llevan `BCN.st.maxDist=40000`).

**Pendiente / flojo** (para LZ3 o QA): los árboles a 43–55 m de la cámara solo están en el juego cercano de instancias y la
cascada lejana no los lleva (`P.shTreeNF = 1` los añade, +0,2 M triángulos): en ese anillo pueden faltar sombras de copa;
las copas recortadas por alfa sí, pero sin semitransparencia; el coste de pintar una cascada en el arnés (SwiftShader) sigue
siendo de segundos, en un equipo real es un repintado cada ~8 m caminados.

### 7.8 Oclusión ambiental (etapa LZ3)

Oclusión ambiental en pantalla, en `lighting.js` («OCLUSIÓN AMBIENTAL»). Tres `PostProcess` propios **delante** de la
cadena de Babylon (antes del bloom y del tono), sobre el búfer HDR cuyo alfa guarda la distancia a la cámara (`FRAG`):

| pase | tamaño | qué hace |
| --- | --- | --- |
| `bcnAo` | recibe la escena a resolución completa (FLOAT 32 si se puede, si no HALF; con el MSAA); dibuja a media | posición = rayo de la cámara × distancia (relativa a la cámara: nada de matrices con coordenadas de mundo de 10⁴ m, que pierden precisión; equivale a la inversa de vista-proyección); normal = producto de las diferencias con los vecinos (la más corta de cada lado, para no cruzar bordes); 8 o 12 muestras en espiral de ángulo áureo girada por píxel, radio 0,7 m en mundo (como mucho 1/10 de la pantalla); término de McGuire/Alchemy con corte por distancia (sin halos en objetos finos). Escribe (oclusión, distancia) |
| `bcnAoH` | media | desenfoque horizontal bilateral de 7 tomas (no mezcla píxeles de distancia distinta: tolerancia 4 % + 5 cm) |
| `bcnAoMix` | de media a completa | desenfoque vertical + subida con pesos de distancia (12 tomas) y mezcla: color × (1 − 2,6·intensidad·oclusión), como mucho −85 %. Lo muy brillante (luminancia expuesta de 1,2 a 3,5: luminarias, rótulos, el sol en un vidrio) no se oscurece. Deja en el alfa la distancia, como estaba |

Se desvanece de 80 a 110 m (`P.aoFar` = 110) y no toca el cielo (distancia mayor que eso). Como es un pase en pantalla,
oscurece el color entero (también la luz directa del sol en un rincón soleado, aunque lo muy brillante se salva); el
contrato de sombreado no cambia (`shade(…, ao)` sigue siendo la oclusión «de autor» de cada material).

**Con qué convive.** Los materiales con mezcla (`FRAGA`, vidrios) y el charco de luz de las farolas (`furniture.js`, mezcla
multiplicativa `(DST_COLOR, ZERO)`) no tocan el alfa del búfer: la oclusión se calcula con la distancia de lo opaco que hay
detrás y se aplica al color ya mezclado (el charco queda oscurecido como el suelo que ilumina, que es lo correcto).

**Orden de los pases.** Babylon añade los pases de su cadena al final de la lista de la cámara; los de la oclusión van en
0..2 y siguen delante tras cada reconstrucción. El MSAA va en el primer pase de la cámara (`aoSync`, también tras cada
reconstrucción, `onBuildObservable`): con la oclusión puesta es `bcnAo`. Al ponerla o quitarla (cambio de calidad) se llama
a `pipe.prepare()`, que rehace los pases de la cadena (el primero necesita búfer de profundidad, y Babylon lo decide al crear
sus texturas). Sin postproceso (camino LDR) no hay oclusión.

**Ajustes** (`BCN.light.set`): `ao` intensidad (1; 0 deja el pase puesto con efecto nulo: sirve para comparar), `aoR`
radio (0,7 m), `aoFar` (110 m), `aoDbg: 1` muestra solo la oclusión. `BCN.light.stats().ao` → `{ n, k, first }` (`first`
debe ser `bcnAo`). Vistas: `z_*_noao` y `z_*_dbg` de `tools/views_luz.json`.

### 7.9 Calibración por horas (LZ3)

Vistas `z_*` de `tools/views_luz.json` (las aéreas llevan `BCN.st.maxDist=40000`). Qué se ve a cada hora con los ajustes
actuales (`K` de §7.6):

| hora | a pie | desde el aire |
| --- | --- | --- |
| 3:00 | calle oscura, azulada, farolas y charcos; comercios apagados (luz de vigilancia) | masas negras, muy pocas ventanas, calles encendidas |
| 7:00 | sol de 13° por el este: calle en sombra, ambiente frío; algo apagada | resplandor claro hacia el sol, ciudad nítida |
| 8:30 | (DIA) sol de 32°, cálido; sombras azuladas | sol dorado, bosque oliva oscuro, calles lejanas como surcos en sombra, bruma azulada, mar azul intenso |
| 10:30 | (DIA) sol de 52°, apenas cálido; contraste alto sol/sombra | mosaico de fachadas y cubiertas (crema, ocre, blanco, terracota), surcos más estrechos |
| 12:00–13:00 | (DIA) sol de 62–64°, neutro, sin quemar (p99 ≈ 185/255 a pie) | calles casi al sol, mar azul |
| 17:00 | como 10:30 por la tarde (simétrico) | ídem |
| 20:15–20:30 | sol de 7–9°, luz anaranjada y rasante, sombras largas | horizonte naranja hacia el oeste, malva hacia el este |
| 21:15 | hora azul: farolas y escaparates encendidos, suelo en penumbra | resplandor rojo hacia el oeste, ventanas encendidas |
| 23:00 | luna (disco con mares), estrellas; calle de farolas (igual que antes de NOCHE) | cielo azul marino sin franja, masas negras con ventanas irregulares, calles en cadenas de puntos, avenidas de LED |

## 8. Carril INTERIORES

### 8.1 Comercios que se ven por dentro (etapa IY1)

Los escaparates ya no son un vidrio gris: cada vidrio de comercio es un quad de tipo **`K.SHOPWIN`** (id 20, registrado por
`interiors.js`) cuyo shader pinta, por píxel, lo que se vería dentro de una **habitación virtual** («interior mapping»).
No hay geometría interior, ni vidrio con mezcla alfa, ni sustitutos: el mismo quad, en la capa BASE, vale de cerca y de
lejos (el detalle fino se desvanece solo con la distancia).

**Comercios por grupos** (`shopPlan`, en `groundFloor`). En un tramo de calle con planta baja comercial (`env.shopsHere`),
los vanos contiguos a cada lado del portal se parten en comercios de hasta 4 vanos o ~14 m. Cada comercio siembra su
ámbito, `env.rnd(10, tramo, primer vano)`, y saca 6 números: tipo, vano de la puerta, si lleva rótulo (93 %), si lleva
toldos (35 %; del color del tipo, en todos sus vanos) y semilla del interior (1–255). El tipo sale de un sorteo con pesos
(`w` de cada fila: más bares, cafès, forns y queviures que ópticas); `SUPERMERCAT` solo sale en comercios de 3 vanos o más
y ≥ 9,5 m (30 %). El rótulo (`K.SIGN`, `signAux(tipo)`) va centrado sobre el comercio, con proporción 8:1; el atlas de
rótulos pasa a ser de **2 × 16 celdas de 512 × 64** (la rama `K.SIGN` de `FS_DET` lo lee así), una por tipo y con los
colores de su fila. Un vano de cada comercio es la **puerta de vidrio** (hoja de 1,1 m centrada, vidrios fijos a los lados,
montante, marco, zócalo y tirador de acero); por ella se ve la misma habitación. La farmacia lleva además una cruz verde
luminosa en banderola (`K.PBR` con emisión). El hueco del escaparate baja 30 cm respecto a antes (dintel a `F1 − 1,0`)
para dejar sitio al rótulo.

**Depuración.** `?shop=<índice o principio del nombre>` (p. ej. `?shop=5`, `?shop=farm`) fuerza el tipo de todos los
comercios. En caliente: `BCN_INTERIORS.force = n; BCN.fx.setRange(0); BCN.fx.setRange(1)` (reconstruye las celdas; sirve en
el `eval` de una vista del arnés). `node tools/shop_preview.js salida.jpg [frente|oblicuo|lejos|noche] [ancho]` pinta en
menos de un minuto una hoja con todos los tipos sin cargar la ciudad (mismo GLSL, WebGL1 a pelo): es lo cómodo para iterar
el dibujo de un interior; la comprobación final, con `tools/shot.js`.

**Tipos: una fila de `TYPES`** (`interiors.js`). El índice de la fila es el tipo (máx. 32). Campos: `n` rótulo, `w` peso,
`sign` [fondo, letra], `awn` toldo, `wall` pared, `floor` [patrón `FL.*`, color A, color B], `warm` calidez de la luz
(0–1), `lamp` luminarias (`LAMP.*`), `back` [qué hay en la pared del fondo `BACK.*`, color del mueble], `far` / `near` /
`shelf` [capa `LY.*`, color] a ~3,1 m, a 1,7 m y en la repisa del escaparate (0,42 m), `acc` color de acento, `pal`
(`PAL.*`) y `shape` (`SH.*`): colores y forma del género que llena baldas, vitrinas y tarimas. **Añadir un tipo = añadir
una fila**; si hace falta un dibujo nuevo, una rama más en `shBack` (fondo) o `shLayer` (capas) y su nombre en `BACK`/`LY`.
La tabla viaja al shader en la textura `tShop` (16 × 32 RGBA8, sin filtrar; fila = tipo; columnas 0–7: 0 pared + patrón de
suelo · 1 suelo A + calidez · 2 suelo B + luminarias · 3 mueble + id del fondo · 4, 5, 6 color + id de las capas lejana,
cercana y repisa · 7 acento + `paleta + 16·forma`), que `paramData()` genera a partir de `TYPES`.

**Empaquetado por vértice del quad `K.SHOPWIN`** (lo escribe `glassQuad`; nada de coordenadas de mundo):

| Byte | Contenido |
| --- | --- |
| `color.r` | ancho de la habitación: `W/16 m` |
| `color.g` | `tipo (0–31) + 32·sentido + 64·puerta`. *Sentido* = 1 si la tangente `T` del shader va al revés que la `u` del marco de fachada; *puerta* = 1 en la hoja de la puerta (por ahí no se pinta la repisa del escaparate) |
| `color.b` | semilla del interior |
| `aux.x`, `aux.y` | posición del vértice en la habitación: `u/W` y `(y sobre el suelo + 1)/6 m` (se interpolan) |
| `aux.z`, `aux.w` | alto de la habitación `H/8 m` y fondo `D/16,32 m` (`aux.w` nunca llega a 255, que es la marca de sustituto) |

La habitación de un comercio empieza 30 cm antes de su primer hueco y acaba 30 cm después del último; su suelo es la cota
de acera del vano de la puerta (+3 cm), el alto ≥ 3,3 m (siempre por encima del dintel) y el fondo entre 4 y 5,5 m.

**El shader** (funciones `sh…` en `SHOP_DECL`, declaradas con `regKind`; las puede usar cualquier otra rama):

- `shRoom(o, d, sz, tipo, semilla, px, dist, puerta)` → color propio del interior. `o` = punto del vidrio en la habitación
  (x a lo largo, y sobre el suelo), `d` = rayo de vista en esos ejes (x, y, z hacia dentro), `sz` = (ancho, alto, fondo),
  `px` = metros por píxel sobre el vidrio (para el filtrado), `dist` = distancia de la cámara. Hace, de atrás adelante:
  1. **la caja**: primera pared que toca el rayo → suelo (`FL`: damero, tarima, terrazo, baldosa), techo con luminarias
     (`LAMP`; valen 4,5: pasan de 1 a propósito), paredes laterales (zócalo; si el fondo lleva estanterías, espejos,
     percheros o cuadros, siguen por los lados) y pared del fondo (`shBack`: estanterías, botellero retroiluminado, espejos
     con bombillas, panel de herramientas, pizarras, perchero, paneles de gafas, cuadros), con caída de luz hacia el fondo
     y penumbra en las aristas;
  2. **lineales de supermercado** (`LY.LINEALES`): góndolas de verdad, cajas perpendiculares al vidrio trazadas con el rayo;
  3. **tres capas de mobiliario** en planos paralelos al vidrio (`shLayer`, alfa premultiplicado), que dan el paralaje al
     caminar: lejana (3,1 m), cercana (1,7 m) y repisa del escaparate (0,42 m): mostrador con vitrina, barra con
     taburetes, mesas y sillas (con o sin mantel), sillones, burras de ropa, isla con género, caballete de cajas de fruta,
     cubos de flores, tarima con género, maniquíes (de cuerpo entero —cabeza, cuello, hombros, cintura, caderas, brazos y
     piernas separadas— con pantalón y chaqueta o camiseta, o vestido; y bustos de sastre con peana), carteles de oferta
     (papel, franja de color con el reclamo, dos líneas de texto y un precio grande de tres cifras de siete segmentos),
     cruz de farmacia.
  Piezas comunes: `shItems` (fila de artículos: caja, redondo, botella, lomo de libro, herramienta, gafas), `shShelf`
  (mueble de baldas lleno), `shPal` (paletas del género), `shR`/`shC`/`shT` (rectángulo, círculo y trapecio suavizados).
- `shGlass(room, V, N)` → el vidrio: `emit(room, g)` más `envRefl` con Fresnel de vidrio de dos caras (7 % de frente,
  12 % a 55°, 23 % a 65°, 42 % a 75°, 64 % a 82°). Al interior no le da el sol. La ganancia `g` es 1,05 de día y al
  anochecer (`uDusk`) depende de la luminancia del píxel: lo claro sube solo a 1,5 (con la cadena HDR un color claro
  florece por encima de ~1,6), lo oscuro hasta 2,2 y lo que ya pasa de 1,2 (las luminarias) se queda como de día.
  OJO: a pie, con el campo de visión del juego, el vidrio más cercano que cabe en pantalla se ve como mucho a ~55° de
  incidencia; el reflejo fuerte solo aparece en los escaparates lejanos de la misma acera, que es lo físicamente correcto.
- **Filtrado**: todo borde se suaviza con `px`, y cada patrón se funde a su color medio cuando el píxel se acerca a su
  tamaño (los artículos pasan a ser una banda de color; el techo, una franja de luz): no parpadea de lejos.

**Cómo se prueba.** `tools/views_interiores.json` son las vistas del carril (`node tools/shot.js tools/out/iy/v
@tools/views_interiores.json`): `iy_frente` e `iy_oblicuo` (el comercio de `eix_tienda`, en el Eixample, a ~5 m de frente y a
~6 m en oblicuo), `iy_acera30` e `iy_acera120` (la misma acera a 30 y a 120 m), `iy_rasante` (pegado a la fachada: el
reflejo crece con el ángulo), las cinco vistas con tienda de `views.json`, `gotic_calle` y dos al anochecer (20,25 h).
`tools/shop_sheet.py` monta las **hojas de contacto de los 17 tipos dentro de la ciudad**: `python3 tools/shop_sheet.py
vistas v.json alta` escribe 34 vistas (cada tipo forzado en caliente, de frente y en oblicuo, en el mismo comercio),
`SIZE=480x270 node tools/shot.js tools/out/hs/t @v.json` las captura (con la máquina cargada, ~1 min por vista) y
`python3 tools/shop_sheet.py hoja tools/out/hs/t frente hoja_frente.jpg` (y `oblicuo`) las junta rotuladas.

**Límites conocidos (IY1).** El interior es un decorado plano por capas: el género de la repisa y los muebles no tienen
grosor (de muy cerca y muy en oblicuo se nota que son planos a 0,42, 1,7 y 3,1 m). No hay gente dentro. El género de las
paletas `VARIADO` (súper, queviures, papereria) era un arcoíris saturado; desde IY2 un tercio de los artículos sale en tonos
de cartón y papel y el resto, algo apagado. El reflejo del vidrio es
el de `envRefl` (cielo y «calle de enfrente» lisa): no refleja los edificios ni los árboles reales. Los toldos no dan
sombra sobre el interior (no le llega el sol a propósito). La cuña oscura de `gotic_calle` (`reglas2.md` §4) ya no aparece:
la planta baja de ese tramo es ahora un comercio con su geometría nueva (machones, jambas y vidrio); no se llegó a aislar
la causa en el código antiguo.

**Para IY2 (portales y pisos).** La habitación es reutilizable tal cual: emite un quad con `glassQuad` (o el mismo
empaquetado) y un tipo nuevo = filas nuevas de `TYPES` (portal, salón, cocina…; con `w: 0` no entran en el sorteo de
comercios; ojo, `SHOPS`/el atlas de rótulos recorren todas las filas). Quedan libres el bit 128 de `color.g` y los ids de
fondo/capa que se quieran añadir. Para una ventana de piso basta una habitación de 2,7 m de alto (`aux.z`) y la
persiana delante como hasta ahora.

**Cambios respecto a §6** (que este carril no edita): el ámbito de azar `env.rnd(10, tramo, primer vano)` = comercio;
`K.SHOPWIN` = 20; el atlas de `K.SIGN` es de 2 × 16; `K.GSHOP` (11) ya no lo usa nadie; `BCN_INTERIORS` exporta además
`TYPES`, `force`, `paramData()` y `paramSize`. La textura `tShop` es de 16 × 32 (columnas 8–15: los 8 colores de cada paleta `PAL`, fila = paleta).




### 8.2 Portales, pisos y terrazas (etapa IY2)

**Zaguanes y pisos: tipo `K.HOMEWIN`** (id 21, `interiors.js`). La misma técnica que los comercios (habitación virtual
pintada por píxel en el quad del vidrio, sin geometría), con una habitación más sencilla y su propio shader:
`hmRoom(o, d, sz, modo, semilla, px, dist)` (modo 0 zaguán, 1 piso; mismos ejes que `shRoom`), `hmGlass` (vidrio con el
Fresnel de `shGlass`, brillo del sol y, en el portal, la reja de forja dibujada encima), `hmFurn` (muebles de un piso) y
`hmWall` (color de pared por semilla). El quad lo emite **`roomQuad(B, F, u0, u1, y0, y1, d, rm)`**, exportado en
`BCN_INTERIORS.roomQuad`, con `rm = { x0, W, yF, H, D, mode, seed }` (u del extremo de la habitación, ancho, cota del
suelo, alto, fondo, modo y semilla 1–255). Empaquetado: `color.r` = ancho/16 m · `color.g` = modo + 2·sentido del marco ·
`color.b` = semilla · `aux` como `K.SHOPWIN` (x/ancho, (y + 1)/6 m, alto/8 m, fondo/16,32 m).

- **Portal** (`portalBay`): dos hojas de vidrio con reja (barrotes cada 12 cm, dos travesaños y una banda de anillos; de
  lejos se funde a su tono medio), largueros, encuentro, travesaño del montante y zócalo de madera (capa BASE), plafones del
  zócalo, tiradores de latón, placa del número en la pilastra derecha y portero automático en la izquierda (ORNAMENTO).
  Detrás, el zaguán: el ancho de la puerta + 70 cm, ≥ 3,3 m de alto y 9 m de fondo; suelo de mármol en damero girado o de
  baldosa hidráulica con roseta, zócalo de mármol, buzones en una pared lateral, al fondo el arranque de la escalera con su
  barandilla y la puerta del ascensor (con el botón encendido), dos plafones en el techo y una planta en su maceta.
  Luz: de día 0,55–0,8 con la lámpara encendida; **de noche `uDusk`** (×1,5), un 45 % más tenue de madrugada (`uLate`), y
  un 20 % de los zaguanes a oscuras (semilla). La semilla sale del ámbito del vano del portal (`rr[1]`).
- **Pisos** (`details.js`, `floors`): el vano de piso saca ahora 9 números; con `rr[7] < 0,3` la persiana queda subida del
  todo y el vidrio es un `K.HOMEWIN` (lo pinta `env.windowHole(…, gq)`: el último argumento opcional sustituye al `K.GLASS`).
  Habitación: el ancho del hueco + 1,1 m, el alto de la planta, 4 m de fondo, pared de un color de casa, tarima, una puerta
  oscura al pasillo y un cuadro al fondo, lámpara de techo, muebles insinuados en un plano a 1,6–2,2 m (sofá con lámpara de
  pie, librería con cuadro, mesa con mantel y sillas, o cómoda con televisor) y cortinas a los lados del vidrio (y visillo en
  algunos). Luz: de día 0,44–0,64 de la que entra (cae hacia el fondo) y manda el reflejo salvo de frente; **de noche
  `homeOn(h)`** (h = azar estable por ventana, de la semilla) con ganancia 1,5: cálida casi siempre, alguna fría y alguna
  azulada de televisor. Está en la capa BASE: de lejos, las ventanas encendidas siguen ahí. Las ventanas de patio y las
  tribunas no cambian.
- **Terrazas** (`terrace`, en `groundFloor` tras `shopFront`): delante de BAR, CAFÈ, RESTAURANT y GELATERIA (85 % de ellos)
  si la acera mide ≥ 5,2 m (el menor de tres `city.roadDist` a lo largo del comercio). Ocupan de 0,6 m a `min(2,9, acera −
  3,2)` m de la fachada (los árboles van a 1,3 m del bordillo y los bancos a 2,4 m), sin tapar la puerta y donde no haya
  edificio (`coverAt`). 2–6 mesas redondas de pie central (tablero de mármol o metal) cada 1,9 m con 2–4 sillas (aluminio,
  ratán o pintadas), sombrillas del color del toldo del local en el 60 % de las mesas (abiertas o cerradas; no si el local
  tiene toldo), jardineras con tres matas en los extremos y una pizarra de caballete junto a la puerta. Cota: `walkAt`.
  En BASE, tableros y sombrillas de 6 lados marcados como sustitutos (`subAux`) y las jardineras. Azar:
  `env.rnd(11, tramo, primer vano del comercio)`, 40 números de golpe. ~2 000 triángulos por terraza en ORNAMENTO.

**Depuración.** `BCN_INTERIORS.log = []` y reconstruir (`BCN.fx.setRange(0); BCN.fx.setRange(1)`) apunta en esa lista
portales `['P', x, z, nx, nz]`, comercios candidatos a terraza `['T', x, z, nx, nz, acera]` y ventanas abiertas
`['W', x, z, nx, nz, y, planta]` en coordenadas de mundo: sirve para montar vistas de frente (cámara en `p + n·4,5`,
`yaw = atan2(−nx, −nz)`). Vistas del carril: `tools/views_iy2.json`.

**Límites conocidos (IY2).** El zaguán y el piso son decorados planos (la escalera y los muebles están pintados en planos;
de muy cerca y en oblicuo se nota). Las ventanas de piso de día se leen poco: es lo pedido (interior oscuro, manda el
reflejo), pero con el reflejo liso de `envRefl` el vidrio queda casi negro mirando desde abajo. Las terrazas no comprueban
el mobiliario de `furniture.js` uno a uno (confían en las distancias al bordillo); en esquinas o aceras raras podría
solaparse algo. Las sillas son cajas (sin curvas) y no hay personas.

## 9. Carril DETALLE

Etapa FZ (plan ligero): mobiliario urbano con dos niveles de detalle. Ficheros: `furniture.js` (todo el mobiliario),
`streets.js` (ciclo de vida de las mallas) y, para probar, `tools/views_detalle.json` y `tools/furn_test.js`.

### 9.1 Catálogo de mobiliario (`furniture.js`)

Cada objeto es una función `f(B, A, F, y, …)`: `B` el `GB` de destino, `A` los acabados del nivel (`A.lod` = 1 sencillo, 2
detalle), `F` un marco como los de fachada (`u`, `y`, `d`) centrado en el objeto e `y` la cota del suelo. Triángulos según
`node tools/furn_test.js`:

| Objeto (función) | Dónde cae (`place`) | Nivel de detalle | Sencillo | Detalle |
| --- | --- | --- | --- | --- |
| Farola (`lamp`) | cada 24 m, alternando acera | columna torneada con zócalo y molduras, brazo en arco que se afina, luminaria aplanada con lente de matriz de ledes (`emit` 0,2 de día → 5,5 encendida) y charco de luz (§9.4) | 77 | 255 |
| Papelera (`bin`) | cada 37 m | poste con pletina, cesto de chapa perforada (dibujo 9), aro de acero, bolsa vuelta sobre el borde y fondo | 40 | 184 |
| Banco (`bench`) | cada 53 m, solo aceras anchas | 5 listones de asiento y 4 de respaldo, costados de tubo de fundición con reposabrazos | 108 | 252 |
| Contenedor (`container`) | batería de 3–5 cada 95 m, en la banda de aparcamiento | ruedas, cuerpo de aristas redondeadas más estrecho abajo, reborde, tapa abombada de color vivo, adhesivo con pictograma delante y detrás, bandas reflectantes hacia la calzada, bulones de izado; boca propia: ranura (paper), dos bocas de goma (envasos), asa y pedal (resta, orgànica) | 36 | 286–332 |
| Iglú de vidre (`iglu`) | 4.º de la batería | campana torneada de 14 lados, seta de izado, boca de goma y adhesivo curvos a cada lado | 92 | 268 |
| Bolsas de basura | 0–3 junto a la batería | elipsoides (más gajos en detalle) | 24 | 48 |
| Bici de Bicing (`bike`) | 40–70 % de los anclajes | cubiertas y llantas de tubo, radios (dibujo 8, un quad por rueda), guardabarros, cuadro de paso abierto, sillín, manillar con puños, soporte delantero, bulón de anclaje, cubrecadena, bielas y pata | 256 | 726 |
| Anclaje y tótem (`dock`, `totem`) | estación de 9–14 anclajes cada 310 m | poste redondeado con ranura, piloto (verde con bici, ámbar sin ella) y banda roja; tótem con pantalla encendida, lector y panel | 12 · 24 | 76 · 90 |
| Semáforo (`signal`) | extremos de tramo que llegan a un cruce, a la derecha de quien llega y antes del paso de cebra | poste con base, cabeza redondeada, tres focos (uno encendido, que se nota más al anochecer) con visera | 28 | 121 |
| Bolardo (`bollard`) | en el bordillo, flanqueando cada paso de cebra (tres por extremo de tramo) | pilona de fundición torneada, con zócalo, collarín y cabeza redondeada | 10 | 66 |
| Buzón (`mailbox`) | cada 190 m, con la boca hacia la acera | cilindro amarillo con pie oscuro, cornisa y casquete, boca con visera y placa de horarios | 52 | 196 |
| Parquímetro (`meter`) | cada 64 m alternando acera, solo en calles con banda de aparcamiento | pie, cuerpo azul de aristas redondeadas, pantalla encendida, ranura, botón, instrucciones y placa solar | 12 | 102 |
| Moto (`scooter`) | grupos de 2–5 cada 95 m (el 70 % de las veces) en la banda de aparcamiento, de culo al bordillo; a 47 m de los contenedores y nunca sobre una estación de Bicing | escúter: neumáticos y llantas, plataforma, escudo, guardabarros, careta con faro, manillar con puños y retrovisores, cuerpo trasero abombado, asiento, piloto, matrícula en blanco, escape y pata; 7 colores (`MOTO`) | 72 | 434 |

Los colores de la batería están en `CONT` (resta gris, paper blau, envasos groc, vidre verd, orgànica marró). Nada lleva
marcas ni texto real: los adhesivos son un pictograma genérico y dos renglones insinuados.

### 9.2 Dos niveles de detalle

- `BCN_FURNITURE.init(ctx)` devuelve `{ build(cell), buildHi(cell), hiRange, poolMat }`. `build` (nivel sencillo, más las
  marcas de `ground.js`) va a la malla `fu<celda>` de toda celda de calle, como siempre. `buildHi` va a una malla aparte,
  `fh<celda>`, que `streets.js` construye (`hiJob`) solo en las celdas a menos de `hiRange[1] + 8` m (78 m) y quita
  (`dropHi`) al pasar de 103 m. Las dos pasadas llaman a la misma función `place(cell, A)`: siembran los mismos ámbitos y
  sacan los mismos números, así que los objetos caen en el mismo sitio.
- El relevo es **por píxel y con tramado**, entre `hiRange` = 58 y 70 m (uniforme `uFurnHi`): el 4.º byte del auxiliar de
  `K.FURN`/`K.FDEC` es el nivel (0 siempre · 100 sencillo · 200 detalle). Lo de detalle se descarta más allá de 70 m; lo
  sencillo, por debajo de 58 m **si su celda tiene malla de detalle**: eso es el uniforme `uCellHi` que `facades.js` ya fija
  por malla a partir de `metadata.bcn.cell.hi` (la malla `fu` se registra con `cell`, y `hiJob` pone `cell.hi`). Si la malla
  de detalle aún no existe, se sigue viendo la sencilla: no hay huecos.
- Medida: `BCN.detailStats().st` da `furn` (triángulos del nivel sencillo y las marcas, todas las celdas), `furnHi` (los
  de detalle) e `hi` (celdas con detalle). En `eix_mobiliario`: 40 348 en 23 celdas (≈ 1 750 por
  celda; antes de la etapa eran ≈ 1 570) y 54 812 de detalle en 7 celdas (≈ 7 800 por celda). **En una celda cercana el
  mobiliario es ≈ 6× el de antes de la etapa; sumando todas las celdas cargadas, ≈ 2,6×** (el objetivo del encargo era
  ~2×: no se cumple). Si hay que recortar,
  lo que más pesa son las farolas (10 por celda), las bicis y las motos.

### 9.3 Tipos de material propios (ids 60–79)

- **`K.FURN` (60)**: como `K.PBR` (color de vértice = albedo), con auxiliar `(rugosidad, metal, patrón, nivel)`. Patrones:
  0 liso · 1 lamas · 2 nervios · 3 pintura gastada · 4 plástico con churretes y suciedad · 5 madera barnizada · 6 lente de
  luminaria (matriz de ledes, encendida al anochecer) · 7 piloto (emisivo con su color). Los acabados ya hechos están en `finishes(lod)`:
  `A.PAINT`, `A.STEEL`, `A.PLASTIC`, `A.WOOD`, `A.RUBBER`, `A.MATTE`, `A.GLOSS`, `A.CAST`, `A.LENS`, `A.LED`…
- **`K.FDEC` (61)**, «calcomanía»: un quad con uv propias (auxiliar `A.dec(id)` = uv de 0 a 1 por vértice + dibujo + nivel)
  y un dibujo procedural: 1–5 adhesivo con pictograma (bolsa, fruta, botella y lata, hoja, copa) sobre el color de vértice ·
  6 ranura · 7 boca redonda con faldones de goma · 8 rueda de radios (descarta lo que no es radio; de lejos, tramado
  estable) · 9 chapa perforada con la bolsa detrás · 10 pantalla encendida · 11 banda reflectante roja y blanca · 12/13 foco
  de semáforo encendido/apagado. Ayudas: `dq` (quad vertical; el primer `u` es el borde que queda a la **izquierda de quien
  mira**: en una cara que mira a +d, el `u` mayor) y `cdec` (franja curva sobre un cilindro o cono).
- Piezas nuevas, además de las de `geo.js`: `fbox` (caja exenta), `loft` (cuerpo de sección rectangular con las esquinas
  redondeadas, por anillos `[semilargo, semiancho, radio, y]`; un anillo repetido = arista viva) y `slab` (losa inclinada
  en el plano `u`–`y`, para carrocerías).
- **Lo emisivo, con la cadena HDR** (§7.1: `emit` con ganancia g son g^2,2 en lineal y florece desde ≈ 1,6 sobre un color
  claro). Todo cuelga de `fNite = smoothstep(0.05, 0.3, uDusk)` (el alumbrado ya está encendido del todo a las 20:25, cuando
  `uDusk` es solo 0,30): lente de farola 0,2 → 5,5 · pantalla (tótem, parquímetro) 0,9 → 2,3 · foco de semáforo encendido
  1,6 → 3,0 · piloto 1,3 → 2,2. De día nada de esto florece; al anochecer la luminaria deslumbra con halo y lo demás brilla
  sin quemarse.

### 9.4 Charcos de luz de las farolas

Al anochecer, bajo cada luminaria hay un charco cálido: quads a ras de suelo (calzada, acera propia y, si llega, la de
enfrente, cada banda a su cota) con el material `poolMat` (`mkMat` con `blend`). `furniture.js` deja los vértices en
`cell.pools` (`x, y, z, u, v`, de cuatro en cuatro) y `streets.js` monta con ellos la malla `lp<celda>` (capa `fx`, no
proyecta sombra). De día se descarta entero.

- **En HDR el charco multiplica** lo que ya hay pintado: `furniture.js` añade un segundo observador de enlace que cambia
  la mezcla a `(DST_COLOR, ZERO)` para el color (el alfa del búfer sigue sin tocarse) y el shader escribe a mano el factor
  `1 + cálido × 7 × caída` (es la única salida que no pasa por `FRAG*`, a propósito: no es un color sino un factor
  lineal). Así se comporta como una luz: el dibujo del suelo (panots, grietas, parches) se conserva y lo claro se ilumina
  más que lo oscuro. El factor es relativo a la luz ambiente, así que crece hasta ×1,8 con la noche cerrada.
- **En LDR** (`#ifdef LDR`: sin búfer flotante no se puede pasar de 1) queda la mezcla alfa de antes, que aclara hacia un
  tono cálido y aplana algo el suelo. El observador mira `ctx.out.hdr` en cada enlace, así que el cambio en caliente
  (`ctx.setLDR()`) también vale.
- Solo ilumina el suelo: los objetos y los coches que pisan el charco no reciben esa luz. Cuando el carril LUZ tenga
  luces de verdad, basta con no devolver `poolMat`.

**Aura nocturna en árboles y aceras (etapa FZ2).** Las copas de los plátanos de calle (`FS_TREE`, los tres niveles) y las
aceras de detalle (`FS_WALK`) reciben de noche la luz de farola del aura de la ciudad (`uGlow.x`, color `kAura`, §7.6), con
el mismo criterio que la calzada en `FS_ROAD`. Árbol: `treeGlow()` pesa por la altura local del vértice (`vHl`, tronco
0–5,4 m, copa hasta ~12 m): casi todo en el tronco y la panza de la copa, un 16 % arriba, algo más en las caras que miran
abajo; a partir de 150–600 m pasa a un valor medio fijo (0,4) (desde el aire se ve sobre todo lo alto de las copas) y la luz se
tiñe con la luminancia de la hoja, no con su verde, para que no salgan líneas de neón amarillo. Acera: sin charcos (el
shader no conoce la posición a lo largo de la calle), más junto al bordillo (`exp(−dA/5)`, donde están los postes) que
junto a la fachada, atenuada al 40 % a menos de ~40 m porque ahí pintan los charcos reales de §9.4, y con el albedo topado
a 0,4 para que el granito claro de ramblas y plazas no se encienda de más. Nada de esto se evalúa de día (`uGlow = 0`).

### 9.5 Cómo añadir un objeto

1. Escribe `miObjeto(B, A, F, y, …)` con las dos ramas: `if (A.lod < 2) { versión de pocas cajas; return; }` y el detalle.
   Todo con `K.FURN`/`K.FDEC` y los acabados de `A` (llevan el nivel): **nada de `K.PBR` ni otros tipos**, que no saben de
   niveles y se verían dos veces. Las dos versiones, con la misma silueta y los mismos colores.
2. Colócalo en `place()`: `along(paso, fase, (u, n) => …)`, siembra `seed(tipo, n, s)` (tipos nuevos desde 10) y saca todos
   sus números antes de comprobar `inCell`; marco con `fr(x, z, out(lado))` (+d hacia ese lado de la calle).
3. Añádelo a `parts` y a `tools/furn_test.js`, y mira sus triángulos en los dos niveles.
4. Captura de cerca: en modo captura `BCN_FURNITURE.log` guarda `[tipo, x, z, ángulo]` de cada objeto colocado (léelo en el
   `eval` de la vista siguiente) para montar una vista en `tools/views_detalle.json`.

### 9.6 Cómo se prueba

```bash
node tools/furn_test.js                                        # triángulos por objeto y nivel (1 s)
node tools/shot.js tools/out/fz/s @tools/views_detalle.json    # de cerca: cont, papelera, banco, farola_base, bicing, bici, semaforo, motos, buzon, parquimetro, bolardo… y tres al anochecer
```

Ojo: la hora de una vista (`hour`) se queda puesta para las siguientes de la misma ejecución; por eso las de anochecer
(`farola_noche`, `charco`, `bicing_noche`) van al final del fichero.

### 9.7 Límites conocidos

- El charco de luz solo ilumina el suelo (§9.4), y la lente de la farola es un rectángulo plano: el halo lo pone el bloom.
- Las motos son de baja poligonización (se nota a 2 m: neumáticos de 9 lados, carrocería de tubo de 6) y están todas
  derechas, sin apoyarse en la pata. La matrícula va en blanco.
- La acera recibe el aura de noche como un valor continuo, sin el dibujo de charcos cada 24 m que tiene la calzada.
- Los bolardos, el buzón y el parquímetro no saben de los árboles ni de los vados: alguno puede caer pegado a un alcorque.
- La viga y el tótem de una estación de Bicing usan una sola cota (la del tótem): en una calle en cuesta la viga no sigue la pendiente.
- Las bolsas de basura pueden rozar el pedal del contenedor vecino.
- Triángulos por encima del objetivo del encargo (§9.2).

## 10. Hitos: edificios y monumentos singulares

Los edificios y monumentos que se reconocen de lejos (Torre Glòries, Sagrada Família, Camp Nou, Colom…) no salen de los
volúmenes genéricos: cada uno es una malla propia, modelada con pocas piezas, que **sustituye** a los volúmenes simples
de ese sitio. Catálogo de los que hay que hacer: `HITOS.md` y `data/hitos_catalogo.json`.

### 10.1 Ficheros y arranque

| Fichero | Qué es | Dueño |
| --- | --- | --- |
| `landmarks.js` | Núcleo: `window.BCN_LM` (registro, tipos `K`, biblioteca `lib`), el shader de los hitos y el módulo `BCN_LANDMARKS`. | núcleo de hitos |
| `landmarks_a.js` … `landmarks_e.js` | Los hitos de cada lote: solo llamadas a `BCN_LM.add({...})`. Un fichero por agente. | cada lote |
| `tools/hitos/hoja.py` | Hojas de contacto de hitos (§10.8). | núcleo de hitos |

- Orden de `<script>`: `…, lighting.js, landmarks.js, landmarks_a.js … landmarks_e.js, app.js`. Los lotes declaran sus
  hitos **al cargar** (nivel superior del fichero); después de iniciarse el módulo, `add` avisa y no hace nada.
- Arranque (`app.js`): `BCN_LANDMARKS.init(ctx)` va **antes** de `BCN_FACADES.init`, porque los edificios sustituidos
  dejan de ser candidatos a fachada de detalle (`BREC.elig`) y `facades.js` monta sus índices al iniciarse. Por eso, al
  construirse los hitos aún no existe `ctx.city`. Su módulo va en `MODS` con id `lm` (su `update` no hace nada).
- Las mallas de los hitos están **siempre cargadas**, sin niveles de detalle ni fundidos: se ven desde toda la ciudad
  (no les afecta `st.maxDist`). Proyectan sombra (`reg(malla, { cast: true, layer: 'lm', lm })`).
- Un constructor que lanza una excepción (o que deja vértices no finitos, o que no emite nada) no tumba a los demás: se
  avisa en la consola («Hito «id»: el constructor ha fallado…»), el hito no se crea y **sus edificios no se ocultan**.

### 10.2 Cómo se añade un hito

```js
// landmarks_d.js (nivel superior del fichero)
const { add, lib: L, K } = window.BCN_LM;
add({ id: 'arc_triomf', nombre: 'Arc de Triomf', nivel: 'A', x: 13099.5, z: 14491.5, rot: 133, alto: 29.5,
  noche: 'focos', edificios: [118700, 119009, 119010],
  build(B, h, L) {
    const LAD = [164, 80, 58], PIE = [206, 186, 152];
    L.arco(B, 0, 0, -1, 29.5, 10, 24.5, 10.5, 21, { col: LAD, k: K.LADRILLO, aux: L.aux.ladrillo(0.3, 0.6) });
    L.caja(B, 0, 0, 20.6, 29.9, 10.6, 2.8, 0, PIE, K.PIEDRA);                       // friso
    for (const sx of [-1, 1]) for (const sz of [-1, 1])                            // pináculos
      L.cupula(B, sx * 13.8, sz * 4.1, 29.6, 1.15, 1.1, { lados: 8, col: [206, 168, 84], k: K.METAL });
  } });
```

1. Busca en el catálogo su posición, giro, alto y los índices de los edificios que sustituye. Si hace falta, en el
   arnés: `BCN.lm.near(x, z, r)` lista los edificios del registro con su centro a menos de `r` m (índice, clase, alto,
   cota inferior, caja), del más cercano al más lejano.
2. Modela en metros locales: origen en el centro de la base, `y = 0` en la cota de la base, `+Z` hacia el rumbo `rot` y
   `+X` a su derecha. Empieza las piezas apoyadas en el suelo 1–2 m por debajo de `y = 0` si el terreno tiene pendiente
   (`h.y(x, z)` da la cota del terreno en cualquier punto local).
3. Míralo con la hoja de contacto (§10.8) de día y a las 22:00, y comprueba la posición contra las calles en una vista aérea.

### 10.3 La ficha

| Campo | Qué es |
| --- | --- |
| `id` | Único, `minusculas_y_digitos`. Lo usan `BCN.lm.view(id)` y la hoja de contacto. |
| `nombre` | En catalán. Sale como etiqueta de punto de interés sobre el hito (si ya hay una con ese texto, se mueve ahí). `etiqueta: false` la quita. |
| `x`, `z` | Centro de la base, en el mundo (m). |
| `rot` | Grados: rumbo del eje `+Z` local, desde el norte hacia el este (0 = `+Z` al norte; 90 = al este). |
| `alto` | Alto total (m): encuadre de la vista, caída de los focos y altura de la etiqueta. `ancho`, `largo` (opcionales): solo para el encuadre. |
| `y` / `dy` | Opcionales: cota absoluta de la base o desplazamiento sobre `heightAt(x, z)` (por defecto, la cota del terreno en el centro). |
| `noche` | `'focos'` (monumento bañado con luz cálida desde abajo, que cae con la altura) · `'led'` (fachada encendida de color: `led: '#rrggbb'`, o sin `led` el color de cada vértice saturado) · `'ventanas'` (oficinas y hoteles: huecos de `VENTANAS`, `CORTINA` y `METAL` encendidos con `homeOn`) · `'nada'`. Todo con `uDusk`; focos y LED bajan de madrugada (`uLate`). Con `focos` las ventanas también se encienden, más flojas. |
| `edificios` | Índices de `BREC` que sustituye: se ocultan en todos los pases (pantalla y sombras: sus vértices se colapsan una vez, en el búfer del trozo) y dejan de tener fachada de detalle. |
| `nivel` | `'A'` modelo propio · `'B'` arquetipo con parámetros · `'C'` retoque del volumen existente. Informativo. |
| `build(B, h, lib)` | El constructor: emite triángulos en `B` (un `GB` de `geo.js` con origen 0, 0). Sin `build` (nivel C) no hay malla. |
| `ocultar: false` | No oculta los edificios (nivel C). Con `retoque: { color: '#rrggbb', estilo: 0–15, alto: m }` cambia su color, su estilo de `FS_BLD` (3 vidrio, 1 liso, 0 viviendas…, la clase del edificio) y su altura sobre su base. `fachada: false`: además, sin fachada de detalle. |
| `sombra: false` | La malla no proyecta sombra (piezas finas o enormes y planas). |

### 10.4 Lo que recibe el constructor: `h`

`h.id`, `h.x`, `h.z`, `h.yb` (cota absoluta de la base), `h.rot`, `h.alto`, `h.ancho`, `h.largo`, `h.seed` (entero estable
del id) · `h.y(lx, lz)`: cota del terreno en un punto local, relativa a la base · `h.edif`: los edificios que sustituye,
`[{ b, cls, alto, y0, plantas: [[[x, z], …], …] }]` en coordenadas locales (alto y cota inferior relativos a la base) ·
`h.plantas`: el primer anillo de cada uno (para extruir la planta real: `L.prisma(B, h.plantas[0], 0, 30, …)`) ·
`h.mundo(lx, lz)` → `[x, z]` de mundo y `h.local(x, z)` al revés · `h.R(a?, b?)`: azar ya sembrado con el id (úsalo
solo dentro de `build`).

### 10.5 Tipos de material: `BCN_LM.K` y sus auxiliares

El shader de los hitos (`FS_LM`, en `landmarks.js`) es propio, no el de las fachadas: los ids de `K` son de los hitos y no
chocan con los de `BCN_GEO.K`. Formato de vértice = el de `GB` (color con el tipo en el alfa, auxiliar, normal con marca
de suave), así que valen todas las primitivas de `geo.js`. Los patrones se dibujan en metros de la cara (a lo largo del
muro y en altura; en las cubiertas, en planta) y **se funden con su media cuando ya no caben en el píxel** (no hacen
moaré de lejos). En las superficies suaves (`rev`, `aguja`, `cupula`…) la coordenada horizontal es el arco alrededor del
eje vertical **del hito**: las rejillas regulares solo salen bien en piezas centradas en el origen.

| `K.` | Qué pinta | Auxiliar (`L.aux.…`) |
| --- | --- | --- |
| `PIEDRA` | Sillares a soga con juntas y variación por pieza. | `piedra(hilada 0,6, sillar 1,2)` |
| `LADRILLO` | Hiladas de ladrillo (de lejos, el tono con las juntas). | `ladrillo(hilada 0,3, pieza 0,6)` |
| `LISO` | Estuco, hormigón o chapa lisa (algo de ruido). | `liso(lado)`: despiece de paneles opcional |
| `VENTANAS` | Muro con rejilla de huecos (vidrio oscuro). De noche, ventanas de piso (`homeOn`). | `ventanas(planta 3,5, vano 3, ancho 0,45, alto 0,55)` (ancho y alto: fracción del vano y de la planta) |
| `CORTINA` | Muro cortina: montantes, forjados y vidrio reflectante (Fresnel, `envRefl` vía `shade` con algo de metal), con tono por paño. De noche, paños encendidos. En las caras horizontales, cubierta gris. | `cortina(planta 3,8, montante 1,5, variación 0,35)` |
| `METAL` | Paneles o chapa satinada: juntas, variación de tono por panel y huecos sueltos (ventanas). | `panel(lado 1,5, variación 0–1, fracción de huecos 0–1)` |
| `TEJA` | Teja: hiladas y variación por pieza. | — |
| `TRENCADIS` | Mosaico de cerámica rota: teselas blancas, azules, ocres, verdes y rojas sobre el color base. | — |
| `CESPED` | Franjas de corte (campo de fútbol). | `cesped(franja 5)` |
| `GRADA` | Filas de asientos (por la altura) y sectores de color alrededor del eje del hito. | `grada(fila 0,85, sectores 16)` |
| `AGUA` | Agua casi especular con oleaje suave. | — |
| `EMISIVO` | Luz propia del color del vértice. | `emisivo(ganancia 1, soloNoche)` |

`lib.aux4(x, y, z, w)` da un auxiliar a mano (bytes 0–255; los tipos que leen metros los leen en decímetros).

### 10.6 Noche

Por hito, en un uniforme por malla (`uLmN` = modo y color LED, `uLmH` = alto y semilla, fijados en `onBindObservable`,
§4.13). Las reglas son las del §7.6: `uDusk` enciende, `uLate` atenúa de madrugada, `homeOn(h)` decide cada ventana
(con `homeFrac()` en las oficinas de muro cortina, en paños sueltos). Además, el aura de la calle (`uGlow.y`) baña la
parte baja de los muros como en los volúmenes simples. Las cubiertas no se encienden.

### 10.7 Biblioteca: `BCN_LM.lib` (tercer argumento de `build`)

Todas reciben `B` primero, trabajan en metros locales del hito y aceptan colores `[r, g, b]` o `'#rrggbb'`. Los ángulos
de las piezas (`ang`) van en grados con el mismo convenio que `rot` (rumbo de su `+Z`). Triángulos aproximados entre
paréntesis.

| Función | Qué hace |
| --- | --- |
| `rect(ancho, largo)` · `elipse(rx, rz, n)` · `poligono(r, n, ang0)` · `mover(planta, dx, dz, ang, escala)` | Plantas `[[x, z], …]` centradas, y moverlas, girarlas o escalarlas (`escala` número o `[sx, sz]`). |
| `prisma(B, planta, y0, y1, col, k, o)` | Extruye una planta; `y1` puede ser una función `(x, z) → y` (cubierta inclinada). `o = { aux, techo, kTecho, auxTecho, sinTecho, suelo }`. (2 por lado + tapa) |
| `loft(B, niveles, col, k, o)` | Une plantas con el mismo número de vértices a distintas alturas, `niveles = [[y, planta], …]` de abajo arriba: lo que se estrecha, se tuerce o se curva en altura (la vela del Hotel W). `o` como en `prisma`. (2 por lado y nivel + tapa) |
| `caja(B, x, z, y0, ancho, largo, alto, ang, col, k, o)` | Prisma rectangular. (12) |
| `extruir(B, perfil, d0, d1, col, k, o)` | Perfil vertical `[[u, y], …]` extruido en `Z` de `d0` a `d1`; `o = { aux, x, z, ang, tapas }`. |
| `torre(B, o)` | `o = { x, z, ang, y0, alto, planta \| ancho + largo \| radio + lados, col, k, aux, techo, tramos: [[desde, escala], …], corona: { alto, escala, col, k } }`: prisma con retranqueos y coronación. |
| `aguja(B, x, z, y0, alto, r, o)` | Huso de revolución: recto hasta `recto` y después `r·(1 − s^pot)^exp`. `pot 1, exp 0,5` paraboloide (Gaudí) · `pot 2, exp 0,5` bala · `pot 1, exp 1` cono. `o = { lados, pasos, recto, pot, exp, col, cols: [[t, color], …], cortes, k, aux, sx, sz, remate: { alto, r, col, k, forma } }`. (2·lados por anillo) |
| `cupula(B, x, z, y0, r, alto, o)` | Media elipse de revolución; `o.linterna = { r, alto, col, k }`. |
| `tambor(B, x, z, y0, y1, r, o)` | Cilindro o tronco de cono (`o.r1`) con tapa; `o.a0`, `o.a1`: arco parcial en radianes (0 = `+X`, π/2 = `+Z`). |
| `cubierta(B, x, z, y0, ancho, largo, alto, o)` | `o.tipo`: `'dos'` (cumbrera a lo largo de `Z`), `'cuatro'`, `'boveda'`, `'piramide'`; `o = { ang, col, k (TEJA), vuelo, colHastial }`. |
| `piramide(B, x, z, y0, ancho, largo, alto, o)` | Pirámide (chapiteles, remates). |
| `nave(B, o)` | Iglesia a lo largo de `+Z`: nave, tejado a dos aguas, ábside en `+Z`, 0–2 campanarios con chapitel en la fachada (`−Z`). `o = { x, z, ang, ancho, largo, alto, col, k, tejado, abside, campanarios, altoCamp, ladoCamp, agujaCamp, colCamp }`. (~150) |
| `columnata(B, x0, z0, x1, z1, y0, alto, n, r, o)` | `n` columnas con entablamento. `o = { col, k, lados, entablamento, colEnt }`. |
| `arco(B, x, z, y0, ancho, fondo, alto, luz, altoLuz, o)` | Bloque con un vano de medio punto (clave a `altoLuz`); el paso va a lo largo de `Z`. `o = { ang, col, k, aux, pasos }`. |
| `chimenea(B, x, z, y0, alto, r0, r1, o)` | Fuste troncocónico con boca oscura; `o.bandas = [[y0, y1, color], …]` (franjas). |
| `grada(B, cx, cz, rx0, rz0, y0, rx1, rz1, y1, o)` | Anillo de graderío elíptico con pendiente (borde interior a `y0`, exterior a `y1`) y muro exterior hasta el suelo. `o = { lados, ang, col, k, aux, muro, kMuro, auxMuro, sinMuro, a0, a1 }` (tramo parcial en grados). (4·lados) |
| `anillo(B, cx, cz, r0, r1, y, o)` · `disco(B, cx, cz, r, y, o)` | Corona plana (o inclinada con `o.y1`) y disco; `o.rz` = proporción `Z/X` (elíptico). Cubiertas de estadio, plazas, fuentes. |
| `mastil(B, x, z, y0, alto, r, o)` | Fuste afilado con vientos: `o.vientos = { n, alturas, dist, col }`. |
| `esfera(B, x, y, z, r, o)` | Esfera o elipsoide (`o.sy`). |
| `poly(B, pts, col, k, aux)` · `q4(B, a, b, c, d, col, k, aux)` · `pv` / `tri` | Polígono plano 3D cualquiera (triangulado con earcut), cuadrilátero, y vértice/triángulo sueltos. |
| `xf(B, v0, x, z, ang, sx, sz, dy)` | Transforma lo emitido desde el vértice `v0` (`B.nv` antes de empezar): escala, gira, traslada. Así se modela una pieza centrada y luego se coloca. |
| `color`, `mixc`, `shade`, `ramp(cols, t)` | Colores: `'#rrggbb'` → `[r, g, b]`, mezcla, aclarar/oscurecer, degradado por tramos. |
| `F0, quad, rev, tube, sphere, obox, bar, cyl` | Las primitivas de `geo.js` (§6.6), con `F0` = coordenadas locales del hito. |

Ejemplos completos y comentados: Torre Glòries y Hotel W (`landmarks_c.js`) y Arc de Triomf (`landmarks_d.js`).

### 10.8 Herramientas y pruebas

```bash
python3 tools/hitos/hoja.py torre_glories,hotel_w --noche --out tools/out/mis_hitos    # día (16 h) y 22:00, rumbos 210 y 30
python3 tools/hitos/hoja.py --lote c --rumbos 120,300 --k 3 --elev 25 --out tools/out/lote_c
Q='?lmtest=1' python3 tools/hitos/hoja.py hotel_w --rumbos 30                          # fichas de prueba (abajo)
```

- `node tools/hitos/tris.js [lotes]`: sin navegador (1 s), ejecuta los constructores con terreno llano y sin edificios
  sustituidos y lista triángulos y vértices por hito, los que lanzan y los que dejan vértices no finitos. Úsalo antes del arnés.
- `hoja.py` genera las vistas (órbita a `k` × el tamaño del hito, a `elev` grados, desde cada rumbo; `BCN.st.maxDist` =
  40 000), lanza el arnés, imprime errores, avisos y `BCN.lm.stats()`, y monta una hoja rotulada (`<out>.jpg`; capturas
  sueltas `<out>_<id>_<rumbo>_<hora>.jpg`). Pocas vistas por ejecución: cada una cuesta 0,5–2 min.
- En el arnés o la consola: `BCN.lm.view(id, rumbo?, k?, elev?)` → vista para `applyView`/`flyTo` · `BCN.lm.stats()` →
  `{ hitos, fichas, tris, errores: [ids], ocultos, retocados }` · `BCN.lm.list()` · `BCN.lm.get(id)` · `BCN.lm.near(x, z, r)`.
- `?lmtest=1` en la URL añade tres fichas de prueba junto al Hotel W: `prueba_falla` (el constructor lanza) y
  `prueba_nan` (vértices NaN), que deben acabar en `errores` y dejar sus volúmenes (el basamento del hotel) intactos, y
  `prueba_retoque` (nivel C: el volumen 52541 pasa a azul, estilo vidrio y 60 m).

### 10.9 Límites y trampas

- **Triángulos**: un icono, 3 000–12 000; uno normal, 300–2 000; todos juntos, ≤ 400 000 (`BCN.lm.stats().tris`). Una
  malla y una llamada de dibujo por hito.
- Las caras planas se ven por los dos lados (la normal se voltea hacia la cámara); las suaves (`rev`, `tube`, `sphere`,
  `aguja`…) no: tienen que ser cerradas o mirar hacia fuera.
- `rot` gira todo el hito; `ang` de las piezas, la pieza dentro del hito. En la duda, una vista aérea (`elev` 70).
- Los volúmenes sustituidos siguen en `ctx.city` (cotas de acera, `coverAt`): solo dejan de verse y de tener fachada.
- El retoque de nivel C cambia los datos por vértice del volumen simple: color, estilo (el alfa) y altura. No puede
  cambiar la planta ni añadir detalle; para eso, un hito de nivel B.
- Nada de rótulos, escudos ni logotipos reales; los nombres de los sitios sí (en la etiqueta).

## 11. Noche 2: color fijo, azoteas, fachadas por barrio, especies de árbol y naturaleza

Cinco carriles fusionados en la etapa INT (ramas `wt-n2-az`, `wt-n2-fx`, `wt-n2-arb`, `wt-n2-nat`). Progreso y medidas de
cada etapa en `tools/encargos/progreso/{AZ,AZ2,AZ3,FX1,FX2,FX3,ARB,ARB2,NAT,NAT2,INT}.md`. Orden de scripts en
`index.html`: `geo.js` → `palette.js` → … → `fachadas_estilos.js` → `facades.js` → `trees.js` → `streets.js` →
`rooftops.js` → `nature.js` → `lighting.js` → hitos → `app.js`.

### 11.1 Familias de barrio
`window.BCN_BARRI.at(x, z)` → barrio `{ n, d, … }` o null (fuera de Barcelona). app.js calcula las cajas de los barrios y
publica `BCN_BARRI` ANTES de cargar los edificios (la paleta lo necesita). Las 15 familias (`eixample`, `gracia`,
`ciutat_vella`, `raval`, `barceloneta`, `poble_sec`, `sants`, `les_corts`, `sant_gervasi`, `sarria_pedralbes`, `poblenou`,
`sant_andreu`, `horta_guinardo`, `nou_barris`, `periferia`) y su reparto por barrio están en `tools/encargos/n2/comun.md`;
la tabla canónica es `BCN_PAL.FAMS` (palette.js) y `BCN_FX_ESTILOS.familia(nombre)` usa la misma.

### 11.2 Paleta (`palette.js`, `window.BCN_PAL`)
Regla: **un edificio tiene el mismo color a cualquier distancia**. El color de fachada y el de cubierta se deciden UNA vez
por edificio al cargar (`BCN_PAL.pick(b, cls, seed, x, z, Hm, area, fill)`, solo clases 0, 2 y 6; el resto sigue con `PAL`
de app.js) y se hornean en el color de vértice de los volúmenes. Lo leen igual FS_BLD (lejos), facades.js (`d.col =
BCN_PAL.wall(b)`) y rooftops.js.
- Índice de cubierta 0–63 en los **2 bits bajos de cada canal** del color (invisible). FS_BLD lo decodifica y lee el color en
  la textura `uRoofPal` (`BCN_PAL.ROOF`, RGBA 64×1, NEAREST). `roofType(i)`: 0 azotea transitable (rasilla) · 1 teja árabe ·
  2 tela asfáltica · 3 grava. La teja solo va a casas pequeñas y bajas (≤ 420 m², ≤ 17 m) que llenen ≥ 80 % de su rectángulo
  orientado; las demás quedan en rasilla.
- Los volúmenes llevan **`uv2`** = eje del edificio (cos, sin del ángulo ×4, en bytes normalizados; media de las aristas
  ponderada por longitud) y usan `VS_BLD`. La textura fina de cubierta sigue ese eje y tiene media cero: se funde a su color
  medio cuando el dibujo baja de ~2 px, así que no cambia de tono con la distancia.
- FS_BLD ya no tiene el mosaico `tq` ni la paleta de cubiertas por hash; ruidos de muro y cubierta prefiltrados por tamaño
  de píxel. De noche compensa con `mix(base, vec3(0.847,0.784,0.706)*…, 0.6*uNight)`.
- No toques `d.col` en facades.js (`bget`): es el color de la paleta. Para la familia: `BCN_PAL.fam(b)`.

### 11.3 Azoteas (`rooftops.js`, `window.BCN_ROOFTOPS`, `addMod('roof')`)
Módulo de primer nivel (§6.3) con celdas de 100 m (las de `ctx.city`), cargado tras las calles. Tres niveles salidos del
mismo plan (al fundirse nada se mueve), fundidos con tramado por distancia 3D:
1. completo ≤ ~200 m, proyecta sombra en la cascada cercana (layer `furn`);
2. cajas de lo que tiene bulto, cara interior del peto y ropa como paños, ~170–410 m (layer `roof`);
3. casetas, depósitos, pérgolas y tejados, ~360–800 m (layer `roof`).
Elementos: peto con albardilla, casetas de escalera, depósitos, antenas (≤ 3, piloto rojo en las altas), parabólicas,
tendederos, aire acondicionado, claraboyas, chimeneas, pérgolas, jardineras, trasteros, placas solares (solo modernos) y
tejados de **teja árabe** a dos o cuatro aguas (tipo de material `TEJA`, id 120).
- **Material propio `roofDet`**: copia del shader de detalle de facades.js (`detail.matB`) en la que se sustituyen DOS
  líneas exactas: `if (vInfo.w > 0.99 && uCellHi > 0.5 && dt >= smoothstep(uFadeHi.x, uFadeHi.y, dist)) discard;` (fundido de
  sustitutos → fundido de entrada por malla, `metadata.rf`) y `vec3 alb = vCol.rgb;`. **Si cambias esas líneas en
  facades.js, rooftops.js no arranca** (avisa en consola y la ciudad sigue sin azoteas). Comparte uniformes y texturas con
  matB y está en `ctx.mats` (sombras y LDR).
- Azar: `seed(b, 90, k)`. Coste: `BCN.detailStats().roof` (150–320 k triángulos en las vistas de dron).
- Sombras: lighting.js amplía el rango de profundidad del mapa (`SH.R`, `uShP.y`) con la altura de la cámara, en escalones
  ×1,25 desde 4000 m (antes era fijo: desde el aire media ciudad salía en sombra). No supongas `SH.R` = 4000.

### 11.4 Fachadas por barrio (`fachadas_estilos.js`, `window.BCN_FX_ESTILOS`)
Catálogo de datos que lee el generador de facades.js (`genB` → `varOf` → `pisosV`/`coronaV`): 15 familias, **70
variantes** (5 por familia salvo gràcia, ciutat_vella, raval, barceloneta y poble_sec, con 4). Solo la parte de viviendas
(1.ª planta hacia arriba y coronación); los bajos comerciales, portales e interiores (IY1/IY2) no cambian. Los campos de
cada variante están documentados en la cabecera del fichero.
- Familia del edificio: `BCN_BARRI.at` en el centro de su caja; variante por la semilla del edificio; `MEZCLA[fam]` presta
  variantes de una familia afín; `varOf` impide repetir la variante de un vecino pegado de índice menor y varía un poco
  vano, vuelo, altura de planta y tono de remates (resultado en caché, `VAR[b]`).
- **Cómo añadir una variante**: un objeto más en `FAM[familia]` con su `id`; lo que falte sale de `BASE`.
- Materiales: núcleo 16 ladrillo visto, 17 gresite, 18 revoco gastado, 19 hormigón (también banda de forjado);
  `FXPIEDRA` (100, sillería en luminancia sobre d.col, para no cambiar el tono) y `FXVIDRIO` (101, barandilla de vidrio que
  sigue el rayo hasta el muro de detrás). Ids ocupados de la noche 2: 16–19, 100, 101, 120.
- Azar: ámbito `(b, 6)` saca 6 números; `(b, 6, 1)` usa un 4.º (`forjV`); el ámbito de vano saca 12 con variante.
- Depuración: `?fxv=familia:n` fuerza la variante n en toda la ciudad, `?fxv=familia` la familia al azar, `?fxv=off` la
  fachada de antes. `BCN.fx.calle(x, z, side, dir, giro)` → vista a pie en la acera de la calle más cercana mirando a lo
  largo (para `applyView`); `BCN.fx.force('off')` para medir ANTES.

### 11.5 Árboles (`trees.js`, `window.BCN_TREES`; lo usa streets.js)
Mismas posiciones y alcorques; ocho mallas para siete especies: 0 plátano (idéntico al de antes: mismas secuencias
`seedRaw`), 1 almez, 2 naranjo amargo, 3 Washingtonia, 4 jacaranda (flor lila en ~55 %), 5 tipuana, 6 pino piñonero,
7 Phoenix (~45 % de los tramos de palmera). Especie por calle o tramo de ~320 m (`pick`) según familia, ancho de calzada y
rambla.
- Mallas por especie k: `tNB<k>`/`tNL<k>` (cerca: rama y hojas), `tFB<k>`/`tFL<k>` (media), `tI<k>` (impostor); layers
  `tree` e `imp`. lighting.js las coge por `/^tN/` y `/^tF/` (hasta ~30 mallas con sombra en lugar de 4).
- Campos de especie: `bm` (escala de corteza), `l.flat`, `l.mid`. FS_TREE: uniformes `uBark`, `uLeaf`, `uSp` (tinte por
  especie, flor, luz en lo alto de la copa solo de día).
- Pruebas: `BCN.streets.free(x, z)` (¿sitio libre para la cámara?) y `findTree` → `[x, y, z, ángulo, dirX, dirZ, distEje]`.

### 11.6 Naturaleza y playa (`nature.js`, `window.BCN_NATURE`, `addMod('nat')`)
Volumen en el verde que no es ciudad (Collserola, Montjuïc, el Carmel, parques grandes, delta, aeropuerto) usando
`data/ground.webp` como máscara (clases bosque, parque, prado, campo, matorral, arena, mar), sin invadir calles
(`roadDist`) ni edificios (`coverAt`). Celdas de 128 m, thin instances, layer `nature`.
- Niveles: `close` (< 70 m, tarjetas de hojas con alfa, sombra con `alphaTex`), `near` (≤ ~320 m), `mid` (≤ ~900 m) y
  carteles de 2 triángulos hasta 1,3 km; más allá, el relieve de copas que pinta FS_TER.
- Exclusiones: huella de los hitos (`BCN.lm`), `MIRADORS` (lista a mano en nature.js: Alcalde, MNAC, búnkers del Carmel,
  Tibidabo, Castell) y un círculo de 22 m alrededor de cada vista a pie de `META.views`.
- Costa: app.js construye la máscara de costa por el contorno real de la malla del relieve (`uShore`, la usan FS_TER y
  FS_SEA; `window.BCN_SHORE = { ms, edges }`). FS_TER pinta la arena (grano, rizos, rastrillo, pisadas, franja mojada) y el
  mosaico de campos del delta; FS_SEA, agua somera y espuma. Pasarelas de madera sobre la arena.
- Coste: `BCN.detailStats().nat`.

### 11.7 Cómo se prueba (INT)
`node tools/shot.js <prefijo> @vistas.json` con las vistas de la etapa INT (calles con `BCN.fx.calle` de seis familias,
`aereo_eixample`, `aereo_alto` con `maxDist` 40000, `coll_pie`, `playa_pie`, la secuencia de PALETA `d1500`/`d600`/`d200`/
`d50` y `roof_eix`, de día a las 10:30 y de noche a las 23:00). Vistas de cada carril: `tools/views_nat.json` y las de los
scratchpads citadas en su progreso.

## 12. Día 3: edificios y manzanas, suelos, árboles, transporte, plazas, puerto y aeropuerto

Lo que dejaron las etapas del día 3 en sus progresos (`tools/encargos/progreso/<ETAPA>.md`, sección «Para DESARROLLO.md»), fusionado por la integración INT3. Orden de los `<script>` (index.html): … `nature.js`, `manzanas.js`, `transporte.js`, `plazas.js` (antes de los hitos: engancha sus fichas con un setter sobre `window.BCN_LM`), `lighting.js`, `landmarks*.js`, `data/puerto_pu1.js`, `data/puerto_pu2.js`, `puerto.js` y `aeropuerto.js` (después de `landmarks_e.js`: necesitan `BCN_LM`; aeropuerto.js sustituye el constructor de la ficha `aeroport`), `suelos.js` y `app.js`. `heightAt` es ahora la cota allanada bajo las calles (`FLAT.h`, S2); la cruda queda como `heightAt0` dentro de app.js. `data/mz_partidas.json` (manzanas partidas precalculadas) se relanza con `node tools/mz_partidas.js` cada vez que cambien los edificios, manzanas.js o la lista de hitos. El allanado es asíncrono (`await BCN_SUELOS.allanarPar`, con workers de Blob); FS_ROAD y FS_WALK declaran el uniforme de depuración `uSF`, que debe quedar a (0, 0). Ids de material (§6.7): 100–101 fachadas_estilos.js, 120–121 rooftops.js (121 = `K.PATIO`), 140–149 plazas.js, 150–151 transporte.js. Tiempos de carga por fase: `window.BCN_LOADT` (INT3).

### 12.1 Edificios y manzanas enteras (E1–E4)

#### E1

- §11.2/§11.3: `BREC.tipo[b]` (Uint8: 0 vivienda, 1 nave, 2 equipamiento) junto a `BREC.elig`; criterios en app.js (carga de
  edificios). rooftops.js planifica cualquier edificio elegible de tipo 1–2 aunque no tenga paleta (losa plana) y desde 3,6 m.
- §11.4: `BCN_FX_ESTILOS.TIPO = { nave: [...], equip: [...] }`; varOf las usa por tipo antes que la familia (con `?fxv=` no).
- §7.6/§11: penumbra de azoteas de noche `roofNight()` (`window.BCN_ROOF_NIGHT`); quien haga un material de cubierta nuevo,
  que la sume para no quedar negro de noche.
- §8.1: los bajos comerciales toman su piedra y su carpintería de `d.col` (`shopCols` en interiors.js).

#### E2

- §11.2: `manzanas.js` (sin init; lo usa app.js al cargar): `BCN_MZ.cand/split/encode`. Registro: `BREC.mzk`, `BREC.mz`.
  Contenedor sintético al final de `BREC.dv`. Los hitos deben seguir referenciando índices del registro original (los trozos van
  detrás); los volúmenes que un hito usa no se parten.
- §11.3: rooftops.js `plan(b)` = `plan0(b)` + patio si b es el ancla de una manzana; `planTerraza(b)` para `mzk = 3`. Tipos de
  elemento nuevos: floor, ground, rail, pot, table, pool, lounger, tree, tapia, hedge, bed, bench, play, car.

#### E3

- §11.2: `BCN_MZ.splitR(miembros, vecinos, semilla)` y `BCN_MZ.group(V)`; el plan lleva `raster: true` y puede no tener
  patio (`inner = null`: solo fincas). `BREC.mz.nR` = manzanas partidas por trama. `BREC.vid[b]` = muro cortina.
- §11.3: material `K.PATIO` (121, aux.x = tipo de suelo 1–6); piezas nuevas de patio listadas arriba.

#### E4

- §11.2: `data/mz_partidas.json` = { nB, ms, blocks: [{ f, skip, isR, sp }] }, lo genera `tools/mz_partidas.js`; `?mz=calc`
  fuerza el cálculo. `BREC.mz.blocks[k].f/skip/isR`, `BREC.mz.ms`, `BREC.mz.cache`.
- §11.3: `K.PATIO` tipo 7 (charco de luz); pieza `glow` { x, z, y, r, col, g }. planPatio: parcelas por finca (`PF`).
- §6: variante de fachada `cw` (muro cortina) y env.cwSp / env.cwMt.

### 12.2 Suelos: asfalto, aceras y calles allanadas (S, S2, S3)

#### S

##### Suelos (etapa S, `suelos.js`)
- `window.BCN_SUELOS = { asfalto(cls, hw, x0, z0, x1, z1) → desgaste 0–4,99, acera(cls, hw, x0, z0, x1, z1) → [modelo, desgaste 0–1],
  avenida(x0, z0, x1, z1) → 'diagonal' | 'granvia' | 'pgracia' | null, nivel(x, z), barri(x, z) }` y
  `window.BCN_RENTA = { nivel(x, z) → 0 muy alto … 4 muy bajo (3,4 fuera de Barcelona; 1,8 al noroeste: Esplugues), barri, NIVEL }`.
  Módulo de datos puro: se carga antes de `app.js`, que al trazar las calles aún no tiene `BCN_BARRI` y le pasa `META.barris`
  en `BCN_SUELOS._barris`. Caché del nivel en rejilla de 100 m.
- Asfalto: parte entera del desgaste = estado (0 nuevo · 1 seminuevo · 2 gastado normal · 3 bastante gastado · 4 muy gastado).
  Base por nivel de barrio, ruido por zona (~260 m) y por tramo; vías principales −0,35, servicio +0,45, autopistas y rondas ~1,1;
  Diagonal, Gran Via y Passeig de Gràcia ~1 (seminuevas); un 6 % de tramos recién asfaltados en cualquier barrio y un 5 % de
  tramos dejados en barrios medios o humildes. Va por polilínea de `roads.png` en `uv.w` del vértice de calzada (`vInfo.w` en
  `FS_ROAD`). En el shader: de lejos solo el tono (0,80 → 1,22 del color base y más gris), de cerca (`near`) los detalles, todos
  con `lod` por tamaño de píxel (sin moiré). Las variables `crk` (oscurecimiento de grietas, se aplica después de la pintura) y
  `mk0` (pintura sin desgastar) son de este bloque; el de `ground.js` no cambia.
- Aceras: 0 panot de flor estándar · 1 hexagonal del Passeig de Gràcia (amonite, estrella y alga en relieve, gris verdoso,
  25 cm) · 2 Diagonal (losa de 40 cm con estrías a 45°, interpretación: no he encontrado fuente del diseño real) · 3 panot nuevo y
  limpio · 4 panot sucio y dejado (manchas, chicles, piezas rotas o remendadas, juntas negras) · 5 losas grandes de granito
  80×40 a matajuntas (22@, Diagonal Mar, Vila Olímpica, Provençals). Por tramo con aceras (o peatonal), en un atlas gemelo
  del campo de aceras (`tKind`, mismo hueco, NEAREST): R = 40·modelo, G = desgaste. El granito de plazas y peatonales coge el
  desgaste. Bordillo (cara vertical): `uv.x = −(2 + modelo + 0,9·desgaste)` (antes −1; el shader acepta los dos). Alcorques:
  reja de fundición (0, 1, 3), sauló claro sin reja (2, 5), tierra pisada sin reja (4).

#### S2

##### Calles planas (S2, `suelos.js` + `app.js`)
- `BCN_SUELOS.allanar(h0, polys, WX, WZ, GW, GH, CELL) → { h(x, z), low: Float32Array(GW·GH), stats }`. `app.js` carga
  `roads.png` junto con el relieve, llama a `allanar` con la cota cruda (`heightAt0`) y define `heightAt = FLAT.h`: todo lo que
  se apoya con `heightAt` (calzada, `roadY`/`walkY`, aceras, árboles, mobiliario, vistas a pie) sigue la cota allanada. Los
  edificios llevan su base horneada (`y0`): donde quedan por encima de la acera, `streets.js` pone el faldón.
- `FLAT.low`: corrección mínima (≤ 0) alrededor de cada nudo de 20 m; la malla del terreno baja ese tanto más 5 cm.
- Sin `suelos.js` (o si falla), `heightAt` es la cota cruda de siempre.
##### Aceras (S2)
- `EXT = 40` m: la acera llega más allá de `WSW` si se ve desde el bordillo (`coverAt` en 4 puntos del segmento bordillo–punto).
  La cota de esos puntos es `walkY(-1)` = terreno + 0,2, la misma que da `city.walkAt` (no cambia la regla de `near`).
- Faldón de fachada: en la malla de acera de la celda, con UV de bordillo.

#### S3

- `uSF` (vec2) en los materiales `road` y `walk`: fuerza estado de asfalto y modelo de acera (+1; 0 = normal). Solo depuración:
  `BCN.scene.materials.forEach(m => { if (m.name === 'road' || m.name === 'walk') m.setVector2('uSF', new BABYLON.Vector2(a + 1, c + 1)); })`.
- `BCN_SUELOS.allanarPar(h0, h0src, env, polys, WX, WZ, GW, GH, CELL, nW) → Promise<FLAT>` (app.js la espera; si falla, `allanar`).
  `BCN_SUELOS.ms` = milisegundos que tardó.

### 12.3 Árboles de calle, alcorques y plantones (ARB3, ARB4)

#### ARB3

§ árboles de calle: `streetKind`, códigos de `treesOf` (especie 0..NSP−1, plantón NSP/NSP+1, alcorque −1/−2), mallas
`tNS*`, `findTree(k)` ampliado y `countAll()`.

#### ARB4

§ árboles de calle: alcorques como instancias `pitG`/`pitS` (`TR.pitGeo`, `TR.pitCanvas`, matrices `t.pm` por celda,
fundido 60–75 m); el canal alfa del campo de aceras ya no se usa (la rama de alcorque de `FS_WALK` queda muerta);
`findTree(−3|−4)`; tutores con atlas propio `TR.stakeCanvas`.

### 12.4 Transporte: bocas de metro y paradas de bus (T, T2)

#### T

- `transporte.js`, `window.BCN_TRANSPORTE = { LINES, init(ctx) → { update, busy, flush, stats, info, placeAll, entrances, stops } }`.
  Módulo de primer nivel con celdas propias de 200 m y dos niveles (1: ≤ 165 m, 2: 140–440 m) fundidos con `dith`.
- Material: copia del shader de detalle (como `rooftops.js`) con dos tipos propios registrados al cargar:
  `TRSIGN` (140, rótulo del atlas `tTrSign`, uv por vértice en `aux.xy`, `aux.z` = se enciende) y `TRIN` (141, regletas y
  paños oscuros). Ids 140–149 reservados para transporte.
- **El hueco de la boca sin tocar la acera** (técnica reutilizable para cualquier hueco en el suelo): el interior (escalera,
  paredes, rellano) es una malla aparte con material propio `trIn`. Cada píxel calcula dónde corta el rayo cámara→píxel el
  plano de la boca (`yTop` = acera + 0,11) y, si cae dentro del rectángulo del hueco, se pinta con la profundidad de ese
  punto del plano adelantada 0–10 cm (según lo lejos que quede detrás: así se ordenan peldaños y paredes entre sí); si cae
  fuera, `discard`. Así tapa la acera (que queda bajo el plano) y queda detrás de todo lo que se interpone. Hasta 16 bocas
  por malla (`uOp`, dos vec4 por boca: centro, rumbo, semimedidas y cota; el índice va en `aux.w`). Primera prueba fallida
  (apuntada para no repetirla): una tapa que escribe `gl_FragDepth = 1` NO sirve, porque la prueba de profundidad usa la
  profundidad escrita y la tapa no pasa nunca.
- Azar: `seed(150, estación, k)` y `seed(151, tramo, n)`.
- Colocación: no pisa calzada (≥ 1,85 m del bordillo: fuera de alcorques, farolas, papeleras), edificios (margen 0,8 m),
  cruces (11 m), bancos, buzones, parquímetros (misma retícula `along` que `furniture.js`), otras bocas ni paradas. Las
  paradas van centradas entre dos árboles (retícula de 10,5 m de `streets.js`) y sin farola/papelera/banco encima.

#### T2

- `transporte.js` lee `data/ground.webp` por su cuenta (solo lectura) para no poner bocas ni paradas en césped. Si nature.js
  publicara su `clsAt`, se podría quitar esa segunda descodificación.
- La colocación de estaciones es un generador (`placeGen`) reanudado por la cola de 3 ms; `placeAll()` lo agota.
- `stats()` da `maxStepMs` (paso de colocación más largo); `info()` da `maxBuildMs`, `nSteps`, `slow` (pasos > 8 ms).

### 12.5 Plazas (P1, P2, P3)

#### P1

- `plazas.js`: `<script>` antes de `lighting.js`; `addMod('plz', 'BCN_PLAZAS', 'plazas')` tras `roof` (necesita
  `ctx.city`, `ctx.detail` y `BCN_FURNITURE.parts`). Tipos de material 141 `PLZ_LEAF` (copas) y 142 `PLZ_WATER` (agua,
  `aux.y` = focos bajo el agua de noche); el 140 queda reservado. Rango 140–149 para plazas.
- Por plaza, tres mallas: `plp<i>` pavimento (material `plazaPav`, capa `walk`, sin sombra), `plo<i>` equipamiento y
  mobiliario sencillo (`matB`, capa `furn`, proyecta sombra, `cell` propia para el relevo `uCellHi`) y `plh<i>` mobiliario
  de detalle de `furniture.js` (a < 90 m; se quita a > 115 m). Capa sencilla a < 600 m, se quita a > 680 m.
- Hitos desde un módulo que carga antes que `landmarks.js`: `plazas.js` engancha un *setter* en `window.BCN_LM` y da de
  alta sus fichas en cuanto `landmarks.js` lo publica (antes de iniciarse los hitos).
- `BCN.mods.plz.stats()` → `{ plazas, singulares, hechas, tris, trisHi }`; `BCN.mods.plz.list()` → estado por plaza.
- Vistas: `tools/views_plazas.json` (cuatro singulares: dron y a pie a las 10:30, dron a las 23:00) y
  `tools/views_plazas_gen.json` (diez genéricas).

#### P2

- `data/plazas_p2.json`: { paseos: {nombre: [polilínea…]}, puntos: {nombre: [x, z]}, poligonos: {nombre: [anillo…]} }.
- En `plazas.js`: `SING` admite `near` (para nombres repetidos), `center`/`disc`, y `objs` puede ser un generador (cede).
  `o.noPav` salta el pavimento; `o.rb` da radios de construcción propios; `o.excl` recorta contra otras plazas.
- Piezas por nombre en `P2PIECE` (devuelven el alto de la luz si alumbran) con su radio en `P2RAD`.
- `BCN.mods.plz.stats()` → ahora también `paseos` (teselas).

#### P3

- `plazas.js` dibujos de pavimento 9 (explanada de Catalunya, centro en `uRose`) y 10 (macizo de flores, color = flor).
- Plataforma: `o.plat`, `o.hAt(x, z)`; `SING.lift` sube el tope de levante de una singular.
- Árboles de plaza: mallas `tNB<k>p`, `tNL<k>p`, `tFB<k>p`, `tFL<k>p`, `tI<k>p` (prefijos tN/tF para las cascadas de
  lighting.js) con los materiales de streets.js; `stats().arboles` = instancias por nivel, `trisArboles`.
- Si streets.js cambia los nombres de sus materiales de árbol, las plazas vuelven a la pieza propia (sin error).

### 12.6 Puerto y zona de mercancías (PU1–PU3)

#### PU1

##### Puerto (`puerto.js`, etapa PU1)
- El puerto usa el **sistema de hitos** (§10): cada zona es una ficha `BCN_LM.add` declarada al cargar `puerto.js`, que va
  **después de `landmarks_e.js` y antes de `app.js`** (no antes de `lighting.js` como un módulo normal: necesita `BCN_LM`
  y declarar sus fichas antes de `BCN_LANDMARKS.init`). No hay `addMod`: el módulo `lm` ya construye todo.
- Datos: `window.BCN_PUERTO_DATA` (`data/puerto_pu1.js`, copia de `data/puerto_pu1.json`), generado una vez fuera del
  juego (script en el scratchpad de la etapa, `n3/pu1/gen.py`): máscara de agua de la ortofoto (`ground.webp`, 5 m/píxel:
  agua = oliva (150, 151, 107) ± 22 o azul), bordes de muelle muestreados con rayos, bloques de apilamiento comprobados
  contra tierra y contra las cajas de los edificios del registro, barcos encajados (rumbo y posición con el casco entero en
  el agua y lo más pegado al muelle, sin solaparse), amarres de la marina a partir de los pantalanes de la ortofoto.
- Todas las fichas llevan `y: 0` y `rot: 0`: las coordenadas locales son mundo − centro y la cota local es la absoluta
  (el mar está a y = 0; los cascos bajan a −2 m). En tierra, `h.y(lx, lz)`.
- Fichas:
  | id | qué | sustituye |
  | --- | --- | --- |
  | `pu_portvell` | 91 yates (vela y motor de 9–20 m en los pantalanes, superyates de 28–70 m popa al Moll de la Barceloneta), 3 golondrinas de dos cubiertas en el Moll de Drassanes, Maremàgnum genérico sobre su planta | 64278, 64318 |
  | `pu_bertran` | 2 ferris, 3 remolcadores, terminal F2 de vidrio sobre su planta, 3 tinglados con dientes de sierra | 63111 |
  | `pu_creuers` | 5 terminales de cruceros nuevas sobre su planta (zócalo, vidrio, cubierta con vuelo), 2 cruceros (300 y 330 m) con pasarelas de embarque, norays, defensas, autocares | 43333, 36696, 43416, 43415, 36697 |
  | `pu_dic` | espaldón y escollera por el borde exterior del dique, faros de la bocana sud (verde en el Dic de l'Est, rojo en el Dic Sud) | — |
  | `pu_moll_sud` | terminal de contenedores del Moll Sud: 89 bloques de pilas (1–5 alturas), grúas de patio, 10 grúas pórtico (8 trabajando, 2 con la pluma levantada), 2 portacontenedores, carretillas pórtico, camiones, 4 vías con tren de plataformas, torres de focos, edificio de control | — |
  | `pu_moll_prat` | terminal automatizada del Moll Prat: 42 bloques largos con 2 grúas de apilamiento sobre carriles, 15 grúas pórtico, 3 buques, vías, focos | — |
  | `pu_energia`, `pu_contradic` | 694 depósitos rehechos sobre las plantas del registro (cilindros de chapa con cubierta cónica y anillo, los grandes de GNL con cúpula y balizas, escaleras, cubetos, tuberías con soportes entre vecinos, focos) | los 694 cilindros (cls 8) |
- Noche: `noche: 'ventanas'` (los huecos `K.VENTANAS` de buques y terminales se encienden con `homeOn`); balizas rojas de
  las grúas, girofaros, focos de los pórticos y de las torres y luces de los faros con `K.EMISIVO` (solo de noche, salvo
  los faros). Los depósitos van con `noche: 'focos'`.
- Sin marcas: contenedores de 15 colores lisos con paneles (`K.METAL`, `panel(2.59, 0.75)`: cada panel de 2,59 m cambia
  de tono, así una pila parece de contenedores distintos), cascos sin nombres.

#### PU2

##### Zona de mercancías (`puerto.js`, etapa PU2)
- Mismo sistema que el puerto (§10, fichas `BCN_LM.add` con `y: 0`, `rot: 0`): datos en `window.BCN_PUERTO2_DATA`
  (`data/puerto_pu2.js`, copia de `data/puerto_pu2.json`), generado fuera del juego con Nominatim y el registro.
  - `naves[zona] = { c, ext, b: [ids] }`: volúmenes del registro de ≥ 1 100 m², 3,5–24 m de alto, clases 0, 1, 2 y 5, dentro
    de los recintos de Nominatim y no usados por otro hito.
  - `cajas`: [cx, cz, semiancho, semifondo] de todos los edificios de los recintos (rejilla de 100 m en `rejilla(x, z)`),
    para comprobar que camiones, vallas y vías no se meten en un edificio.
  - `zonas`: contornos; `via`: centro y eje de la playa de vías; `aduanas`: [zona, x, z, rumbo, carriles].
- Fichas: `pu_zal`, `pu_zal_prat`, `pu_mercabarna`, `pu_zf0`…`pu_zf3` (naves) y `pu_vias` (playa de vías).
- Nave (`naveLog`): zócalo de hormigón, chapa grecada (`K.METAL`, `panel(0.9)`), franja de color o peto, cubierta de chapa de
  7 tonos con lucernarios corridos y máquinas, o dientes de sierra en los pabellones grandes de Mercabarna; lado de muelles =
  el lado largo con más sitio libre delante: banda de puertas seccionales (`K.VENTANAS`: de noche se encienden), marquesina,
  tira de luz (`K.EMISIVO` solo de noche), andén, remolques atracados (furgonetas en Mercabarna), explanada de remolques en
  batería (ZAL), torre de focos y valla del patio con puerta; oficinas en un testero.
- Controles de acceso con aduana (marquesina, casetas, barreras) en la ZAL Port, la ZAL Prat y Mercabarna.
- Playa de vías: vías cada 4,8 m recortadas al recinto, a las cajas y a la pendiente (tramos de 60 m), trenes de
  plataformas con contenedores, cisternas, tolvas y vagones cerrados, locomotoras diésel genéricas, torres de focos y gabinete.

#### PU3

- `puerto.js` envuelve `BCN_LANDMARKS.init` (sin editar landmarks.js): guarda el contexto (para `ctx.SEG`) mientras se
  construyen las fichas y, al terminar, monta (1) el material nocturno de las fichas industriales y (2) las mallas de lo pequeño.
- Noche industrial (`NOCHE_IND`: terminales de contenedores, playa de vías, ZAL, Mercabarna, Zona Franca, depósitos): copia
  del shader de los hitos (como hace rooftops.js con el de detalle) que de noche desatura y oscurece el albedo (−74 % en lo
  horizontal, −60 % en muros, como las azoteas de la ciudad), quita el aura de calle y suma la luz de una textura de charcos
  (`LUCES` → luminancia de 4 m/píxel): blanca, más en lo horizontal, hasta ~50 m de altura. Cada torre de focos, grúa pórtico
  (bajo el pórtico y bajo la pluma), grúa de patio, muelle de carga y aduana aporta su charco (`luz(h, x, z, radio, I)`).
- Piezas pequeñas (`peq(h, x, z)` devuelve un constructor por celda de 250 m y ficha): camiones, remolques, carretillas
  pórtico, vagones y locomotoras, contenedores sueltos, norays, defensas, autocares, soportes de tubería y vallas. Cada celda
  es una malla con `addLODLevel(700, null)`: a más de 700 m no se dibuja. Medida en `window.BCN_PUERTO.peq`.
- Cascos (`casco`): loft por secciones (fondo estrecho y proa recogida bajo el agua, abanico y proa lanzada en la cubierta,
  espejo de popa con vuelo), regala con arrufo, franjas de color; `sup` (superestructura con frente achaflanado, en terrazas)
  y `cabina` (parabrisas inclinado) para cruceros, ferris, portacontenedores, remolcadores, golondrinas y yates.
- Aduanas: en la entrada real del recinto (`entrada()`: la calle más ancha de `ctx.SEG` que cruza el contorno de Nominatim),
  30 m hacia dentro, orientadas a la calle y con carriles según su anchura. `libre()` y la playa de vías descartan la calzada.

### 12.7 Aeropuerto (AE1–AE4)

#### AE1

- Módulo `BCN_AERO` (`addMod('aero')`) y hitos `aero_*`; `window.BCN_AERO_STANDS()` da los puestos (morro, rumbo, tipo,
  pasarela). Envoltorio de `BCN_LANDMARKS.init` en aeropuerto.js (espera al JSON y rellena `edificios`).

#### AE2

- `data/aero_lado_tierra.json`; `masts()` en aeropuerto.js (torres de focos, compartidas por hitos y luces).
- Material `aero_luces` (mezcla, puntos de luz con radio mínimo en píxeles, uniformes `uEye`, `uPx`) y
  `aero_charcos` (charcos que multiplican en HDR). `BCN.mods.aero.stats()` → luces, charcos, trisLuces, focos.

#### AE3

- `data/aero_cesped.json` (filas de celdas de 6 m en el marco de las pistas; script en scratchpad n3/ae3/ces.py).
- aeropuerto.js: `curbFrame(d)` (recta del bordillo de la T1), `procT1/procT2` (recorte por semiplanos `clipHP`),
  `offs()` (desplazamiento de polígonos). Fichas nuevas: `aero_t1_menudo`, `aero_p1_coches`, `aero_edificis`,
  `aero_veh_<celda>` y `aero_focos_<celda>` (celdas de 450 m, creadas en el init de los hitos). Tras los hitos,
  `addLODLevel(d, null)` a lo pequeño (tabla `LODD`). Material `aero_rotulos` (atlas de texto, retroiluminado de noche).
  En la malla de marcas, color.a = 128 es césped (rw.x/rw.y = distancia a pista/rodaje).

#### AE4

- `data/aero_cesped.json` lleva `sdf` (distancia con signo, 128 + 16·m, fila 0 = v0) además de `filas`.
- `data/aero_carga.json` (Nominatim): combustible, bomberosSur, recuadros carga/mantenimiento, cargueros.
- Fichas nuevas `aero_carga`, `aero_combustible`, `aero_hangars` (creadas en el init de los hitos, reclaman los
  volúmenes del registro de su recinto); `window.BCN_AERO_ZONAS` da cuántos.


## 13. Sagrada Família acabada, sus dos plazas y la escalinata de la Glòria

Lo que dejaron las etapas SF0-SF3 (basílica) y ENT0-ENT2 (entorno) en sus progresos (`tools/encargos/progreso/<ETAPA>.md`,
sección «Para DESARROLLO.md»), fusionado por la integración SFI. Orden de los `<script>`: `… landmarks_e.js, sagrada.js,
gloria.js, … app.js`. Todo lo de la basílica y su entorno va en **ejes locales de la ficha `sagrada_familia`**: centro
(12597,9; 15875,2), `rot` 136, mundo = centro + X·vecX + Z·vecZ con vecX = (−0,7193; −0,6947) y vecZ = (0,6947; −0,7193).
+Z hacia la Glòria (Mallorca, la Diagonal), −Z ábside (Provença), −X Naixement (Marina, Pl. de Gaudí), +X Passió (Sardenya,
Pl. de la Sagrada Família).

### 13.1 Datos
- `data/sf_ref.json` (SF0): referencia de la basílica acabada, cada dato `verificado` (con fuente) o `estimación`: marco
  local, contorno OSM local (anillo 0 planta; 1-6 columnas de la Passió; 7-8 del Naixement), planta por el módulo de 7,5 m
  (eje de la nave x −2,5, crucero z −20,5), 18 torres, fachadas, escalinata, sacristías, vidrieras, paleta y noche.
- `data/sf_ent_ref.json` (ENT0): plazas de Gaudí y de la Sagrada Família, calles medidas en ejes locales (Provença Z −83,
  **Mallorca +50,6**, València +184,4, Aragó +318,3; la Diagonal cruza el eje en Z +352,6) y el proyecto de la Glòria
  separado de la interpretación.
- `data/sf_ent_plazas.json` (ENT1, generador `scratchpad/sf/ent1/gen/plazas_gen.py`) y `data/sf_ent_gloria.json` (ENT2,
  `scratchpad/sf/ent2/gen/gloria_gen.py`): trazado de las plazas y de la escalinata y el eje, en ejes locales.
- `data/sf_cruz.json` (malla del modelo 3D del usuario para la cruz, `tools/stl_cruz.py`): la carga `sagrada.js` (`cruzP`) y la
  pone en la malla media (< 1500 m) con sombreado plano; lejos, la cruz procedural.
- **La línea de la fachada de la Glòria** no está en z +71 (como decía el encargo): puertas en z 32-34,5, nártex hasta 39,3
  (línea de manzana), bosque de columnas en z ≈ 44,7 y zócalo hasta 46,7; la losa de ENTORNO empieza en z 41.

### 13.2 La basílica (`sagrada.js`)
- Sustituye el constructor de la ficha `sagrada_familia` (como `aeropuerto.js` con `aeroport`): un único
  `construir(B, h, L, q)` con tres calidades y tres fichas en el mismo sitio: `sagrada_familia` (q 1, media, ≈ 40 k
  triángulos), `sagrada_familia_lluny` (q 0, silueta, `addLODLevel(1500)` de la principal, ≈ 8 k) y
  `sagrada_familia_detall` (q 2, detalle superpuesto, `addLODLevel(350, null)`, ≈ 94 k). Envuelve `BCN_LANDMARKS.init`
  para esperar al JSON. `BCN.lm.stats().sf` da los triángulos de la basílica dibujados.
- Todo se modela con y = 0 en el suelo del templo (`yF`: la cota más alta bajo el ábside y el crucero). Ayudas reutilizables:
  `parab()` (perfil de Gaudí), `huecos(…, { rombo, luz })` (huecos en espiral o retícula de rombos, encendida de noche),
  `lobulos()`, `ventanal()`/`muroV()` (con tracería; cada hueco va a `VENT` para las vidrieras), `estrella()`, `marco`,
  `arcoC`, `banda`, `figura` (también `BCN_SF.figura`) y `animal`; `gota()` y `GLI` para las linternas de la Glòria.
- Envejecimiento barato por color de vértice (hollín abajo, manchas por bloques; Naixement más pardo) en las tres mallas.
- Noche: vidrieras emisivas solo de noche (frías al este, cálidas al oeste, amarillas en la Glòria), retícula de las torres
  encendida, estrella de la Mare de Déu, cruz encendida y `sf_haces` (12 haces aditivos, `renderingGroupId` 1, mezcla
  1,1,0,1 en HDR, sin niebla, solo con `uDusk`). `BCN_SF.cruz` y `BCN_SF.gloria`.
- Mantener «sagrada» en el nombre de las mallas: el reflejo del estanque de la Plaça de Gaudí las elige por el nombre.

### 13.3 Las plazas (`plazas.js` + `data/sf_ent_plazas.json`)
- `sfSing` añade las dos plazas singulares con `sfZone` (pavimento por zonas, `fondo`) y `sfObjs` (árboles por especie de
  la plaza, setos, farolas, bancos; `filas`, `nolamp`). Las singulares aceptan `after(o, AFT)` (mallas propias que se
  liberan con la plaza) y objetos con `ex.y` (cota fija).
- Plaça de Gaudí: estanque de 3000 m² con isla, monolito de Corberó (`P3PIECE.sfmono`), pretil y talud (`sfpond`); agua
  propia (`VS_POND`/`FS_POND`) con `MirrorTexture` a media resolución (`sfPondMir`) de las mallas «sagrada» y los objetos de
  la plaza, activa solo a < 420 m. El suelo alrededor del estanque sube hasta ~3,5 m: `BCN_PLAZAS.floorAt(x, z)`.
- Plaça de la Sagrada Família: paseo de sauló en el eje de la Passió (Z −17), rotonda con estanque, cipreses.
- Esplanada, Passeig y Placeta de la Glòria (eje hasta la Diagonal) como plazas singulares desde `sf_ent_gloria.json`;
  `pavAt` es cierto bajo la losa de Mallorca (sin árboles de calle ni bocas de metro debajo).

### 13.4 La escalinata de la Glòria (`gloria.js` + `data/sf_ent_gloria.json`)
- Tres fichas con el centro y el giro de la basílica: `sf_gloria` (losa sobre Mallorca con paso inferior iluminado, pilas,
  terraza, Monumento al Fuego y al Agua, escalinata de 4 tramos con 3 rellanos), `sf_gloria_detall` (balaustradas,
  pasamanos, farolas, relieves del infierno; `addLODLevel(420, null)`) y `sf_gloria_edificis` (oculta los volúmenes del
  registro de la franja de 60 m y rehace lo que queda fuera con fachada nueva). `BCN_GLORIA.stats()`.
- Cotas: suelo del templo `yF`, Mallorca `yM` (Z 50,6), losa `yS = max(yF, yM + 5,5)` (pórtico 4-5 m sobre Mallorca
  según el proyecto, ~4 m libres bajo los nervios).

### 13.5 Integración (SFI)
- **Encaje de la Glòria con la losa**: el suelo del templo queda solo ~2,3 m sobre Mallorca, así que `sagrada.js` sube el
  zócalo del bosque de columnas (z 41-46,7 y los costados desde 39,3) a la cota de la losa (`dS = yM + 5,5 − yF`) y pone
  una escalera de ~20 peldaños bajo el nártex (z 34,6-41, 56 m de ancho) que baja hasta las siete puertas; las columnas y
  sus pedestales (pecados) arrancan sobre ese zócalo. `gloria.js` ya no dibuja los 21 peldaños de enlace que chocaban con
  las columnas, y calcula `yF` con el mismo eje y crucero que `sagrada.js` (−2,5; −20,5).
- **A pie** (app.js `walkFloor`): la cota del jugador es la mayor de `heightAt`, `BCN_PLAZAS.floorAt` (talud del estanque)
  y `BCN_GLORIA.floorAt(x, z, pies)` (escalera del nártex, zócalo, losa, terraza y peldaños de la escalinata). La losa es
  hueca: quien llega por la calle de Mallorca (pies > 0,9 m por debajo) pasa por debajo.
- `tools/mz_partidas.js` relanzado: las manzanas precalculadas salen idénticas (593 manzanas, 294 037 edificios), así que
  `data/mz_partidas.json` no cambia y el juego no las recalcula al cargar (`MZC.nB === nB0`).

## 14. Fase gráfica 1 (del 5 al 8): luz, suelo, azoteas y huecos, árboles y monte

Encargos en `tools/encargos/g1/` (reglas comunes en `comun.md`), progresos `G1x1`–`G1x3` e `INT1` en
`tools/encargos/progreso/`. Integración INT1 en la rama `wt-g1-int`: banco, suelo (G1S), azoteas y huecos (G1T), árboles y
monte (G1V) y luz y mar (G1L). Las fachadas (G1F) se fusionan aparte, cuando acaben.

### 14.1 Banco de pruebas (G1B)
- `tools/views_g1.json`: 24 vistas fijas (a pie de calle de día y de noche, dron, lejos, montaña y mar), con coordenadas
  fijas. `tools/hoja_g1.py <prefijo> <salida.jpg>` hace la hoja de una tanda; con `--comparar <antes> <después> <salida>`,
  la hoja ANTES/DESPUÉS. `tools/encargos/g1/rubrica.md`: seis criterios (luz, materiales, geometría, vegetación,
  coherencia, lejanía), escala 5/7/8/10, «el defecto manda» (nota ≤ criterio más bajo + 2) y fotos de referencia por vista.
- `data/views_g1_nominatim.json`: lo descargado de Nominatim para colocar las vistas.

### 14.2 Luz de cine, mar y lejanía (G1L; `app.js` preludio, `FS_SKY`, `FS_SEA`; `lighting.js`)
- Cielo: `skyDay()` = (1 − uNight)(1 − uSunH.w) (todo lo diurno vale 0 de noche y con la luna); `kHorz` (blanqueo cálido
  del horizonte, el mismo en `skyGrad` y `horzCol`: sin costura entre monte lejano y cielo); halo de Mie alrededor del sol.
  El resplandor del horizonte del lado del sol empieza con el sol a 32°; nubes encendidas (salmón y oro) con el sol bajo.
- Perspectiva aérea en `fogL`: extinción por canales (el azul se rellena antes), lóbulo de Mie hacia el sol y
  desaturación de lo lejano (hasta 80 %) según la cantidad de bruma.
- `shade`: Fresnel de Schlick con rugosidad. `albFloor(aL, n, vis)`: suelo de albedo de día (relleno del cielo y de las
  fachadas soleadas; ×2,6 en el suelo y ×4,2 en el suelo en sombra; muros y forja 0,03). Solo de día.
- Sombras: `shSoft`/`shCasc`/`shMap` (PCSS en la cascada cercana, solo en calidad alta; `uShP.w = P.soft`, 0,006 m de
  penumbra por metro hasta lo que tapa; `BCN.light.set({soft:0})` vuelve a la de antes). Todo mesh con niveles LOD en la
  lista de una cascada pasa sus LOD al material de profundidad (`shRender`): así se quitó el aviso «Feedback loop».
- `lighting.js`: `grade()` (curvas de color diurnas: luces cálidas `gWarm`, sombras frías `gCool`, `gSat`, `gMid`; en la
  hora dorada, luces más doradas y sombras más frías); `P.aoDay` = 1,45 (oclusión de día más fuerte, radio 0,8 m, muestras
  con reparto t²). `L.K`: `fogDD` 2,6, `fogDay`, `sunD` 1,16, `expD` 1,07. Ajustes con `BCN.light.set({...})`.
- `FS_SEA`: `nD` (ruido de valor con derivada, retícula plegada cada 256 celdas), tres trenes de mar de fondo y cinco
  octavas de mar de viento que se apagan con el píxel y pasan a rugosidad; Fresnel (f0 0,02) con `skyGrad`; brillo del sol
  normalizado + destellos (glitter); color por profundidad; `calmAt` (agua del puerto: olas al 22 %, `seaC` con rizo fino
  y rodales de brisa); espuma en escolleras y swash en la orilla; estelas nocturnas de la costa sin bloques.
- Pendiente: exposición automática y TAA (Babylon 9 no los da con nuestros ShaderMaterial).

### 14.3 Suelo, marcas viales y calles planas (G1S; `suelos.js`, `ground.js`, `streets.js`, `plazas.js`)
- Allanado por el eje: cada nudo de 5 m toma la cota filtrada del punto del eje más cercano de cada tramo que lo alcanza,
  con peso ((RB − e)/(RB + hw))²; banda a nivel FW = 5 m (aceras) y talud hasta RB = 11 m (pistas: 1,5 y 7 m). `RAS`
  incluye las clases 9, 12 y 15; `preClave` versión 8 (si cambia el cálculo, súbela y relanza `tools/allanado.sh`). Las
  pistas de clase 9 llevan el modelo de acera 6 (tierra y grava). Medida: `tools/medir_suelo.js` (como `eval` de una vista).
- Marcas por boca de cruce (`ground.js`): paso de cebra de 4 m tras la calzada transversal (o al empezar el xamfrà),
  recortado si pisa otra calzada (`P.zr` = bandas libres, ≥ 60 %); línea de detención; flechas por carril en entradas
  anchas; líneas de carril que empiezan 10 m después de lo pintado del cruce; rotondas por lazo cerrado de calzada
  (ceda el paso en las entradas, nada en el anillo). La pintura sigue la cinta real (misma subdivisión que app.js) y va a
  `LIFT` = 4 cm sobre la cinta más alta. Depuración: `BCN_GROUND.survey()`, `BCN_GROUND.mouths(x, z, r)`, `?zlift=1`.
- Asfalto: `BCN_SUELOS.asfalto` = `asfaltoG1` (desgaste < 1,8 comprimido a 1,5–1,8); `asfalto0` es el de antes y lo usan
  las aceras. `roadGLSL` lee `Ta` de FS_ROAD (tono de lejos) para que el de cerca case; parches por carril (no rombos);
  tapas, arquetas e imbornales sin patrón fijo.
- `streets.js` `ramblaST(w)`: eje del paseo central de La Rambla, con su panot de ondas.

### 14.4 Azoteas, huecos y parpadeos (G1T; `rooftops.js`, hitos, `puerto.js`, `aeropuerto.js`)
- `plan0` planifica también las clases 1, 2, 3, 5 y 8–13 sin fachada de detalle (`tipo` 1 si < 14 m, 2 si no) y cajas de
  hasta 250 000 m². Cubiertas > 600 m²: lucernarios en hilera (naves, vidrio armado `A_SKYL`) o grupos de máquinas
  (equipamientos), claves `seed(b, 90, 200–214)`. `nMax` = 12 + (área − 1 700)/900, hasta 36. Bancada bajo los depósitos.
- Reglas contra parpadeos: nada de tapas coplanarias (un remate sobre un prisma, +0,1 m o −0,03 m respecto a su techo);
  bandas sobre paredes con desplazamiento real del polígono (`offsP`), nunca escalando desde el centroide; una pieza que se
  apoya en un muro entra en él (puertas −0,2 a −0,5 m).
- Herramientas: `tools/parpadeo.js` + `tools/parpadeo_pagina.js` (detector por píxeles con la cámara movida 1,2 cm y
  picking forzado; `HITOS=a:b` recorre los hitos) y `tools/coplanarias.js` (inventario geométrico de solapes coplanarios
  por malla de hito). `INV=tools/coplanarias.js node tools/parpadeo.js /tmp/x '[{"x":12000,"z":14400,"agl":60,"yaw":0,"pitch":0.5}]'`.
- Encants rehecho como lámina por anillos (`R[r][i]`, `alt(x,z,s)`; caras con normal de Newell) con el mercado debajo;
  Maremàgnum con cubierta de chapa y lucernarios según su eje.

### 14.5 Árboles, monte y mobiliario (G1V; `trees.js`, `nature.js`, `furniture.js`, `app.js` FS_TER)
- `BCN_TREES.WIND_GLSL` define `treeWind(p, W, kind)`; `VS_TREE` lo suma (necesita `uTime` y `uKind`). Impostor de calle
  de 3 planos a 60° (`impCanvas`). Reparto de calle (`treesOf`): adulto en el 95 % de los alcorques, 3 % plantón, 2 % vacío
  (nunca dos vacíos seguidos), separación 9,5 m; Eixample 80 % plátano; barrios de mar con palmeras (`seaSp`, también en
  las plazas del frente marítimo, con guarda en `plazas.js`). Nivel medio de calle (`S.tF`) 320–400 m.
- `nature.js`: nivel 0 tarjetas; 1 tarjetas grandes sobre núcleo bajo; 2 impostor de atlas (`natImp`, 1024×512, 4
  especies × de lado/desde arriba; `vC.g` = tesela, 0 = silueta procedimental). Viento en el VS. El último nivel se aclara
  con la calidad (media 0,78; baja 0,55; lee `BCN.light.quality`).
- `FS_TER` (monte, de día y donde la ortofoto es verde): hierba seca, calveros, roca en lo empinado, pinaza, y de cerca
  briznas y piedrecitas; de lejos (píxel > 1,5 m), masa de pinar gris verdosa con rodales. Ruido periódico `pn()` sobre
  mod(xz, 512 m) (con coordenadas de 15–20 km, `hash21` sacaba rayas).
- Mobiliario: ocupación de la acera por celda (`cell.treeNear` en `cellCtx`); primero semáforos, luego bolardos; farolas
  que se corren ±3 m; papeleras, bancos, buzones y parquímetros se omiten si no caben. Fuera los pasajeros parados de la T1.

### 14.6 Integración (INT1)
- `BCN.light.quality` (getter nuevo en `lighting.js`): `'alta' | 'media' | 'baja'`, la calidad en curso (también en modo
  auto). Antes no existía y `nature.js` leía `undefined` (siempre calidad alta).
- Árboles de calle por calidad (`streets.js`, `TQK`): los niveles cercano (`S.tN`) y medio (`S.tF`) son los de `setRange`
  (`S.tN0`, `S.tF0`) por [cercano, medio] = alta [1; 0,9] (medio 288–360 m), media [0,8; 0,7], baja [0,6; 0,5]; si la
  calidad cambia en modo auto, `update` rehace bandas e instancias. El número de árboles de un nivel va con el cuadrado
  de su distancia.

### 14.7 Fachadas a pie de calle (G1F; `facades.js`, `interiors.js`, `details.js`, `fachadas_estilos.js`)
- §6.9 `env.windowHole`: sin `gq`, el vidrio es un `K.HOMEWIN` con habitación (si interiors.js está cargado y el hueco
  pasa de 45 × 35 cm). `roomQuad(rm)` admite `rm.veil` (bit 4 de color.g: piso tras visillo).
- §6.9 `env.wa(F, u0, u1, y0, y1, yTop)`: auxiliar de desgaste para un paño de muro (x = bajo `yTop` /8 m, y = 255,
  z = sobre la acera +4 /16 m, w = 0). Solo tiene zócalo dentro de un tramo con `run.gnd` (genB fija `curGnd`).
  El shader lo aplica a los tipos 0, 1, 16–19 y 100 cuando aux.y = 255 y aux.w = 0.
- SHOPWIN: `shClosed(tipo, semilla)` decide si el comercio está cerrado (persiana pintada en el vidrio) según uNight/uLate.
- Caras hacia abajo del shader de detalle: rebote templado `uSkyL·0,12 + uSunL·0,07·sol` (bajos de balcones, vuelos).
- `palette.js`: la fila `sarria_pedralbes` original sigue en su sitio; la sustitución de G1F va en su sección al final.

### 14.8 Arreglos de integración (FX, fusionados en INT2)
- La cinta de calzada (`app.js`) lleva faldón de tierra donde su borde queda > 25 cm sobre `heightAt0` (ladera de
  Collserola). `RCOL[9]` (sendas) en color tierra. FS_ROAD: parches recientes `alb·0,88` con borde roto por ruido; Ta base 0,125.
- `streets.js`: `urbanSeg(s)` decide «tejido urbano» (nunca rural; clase 9 con acera).
- `plazas.js`: sin bandada en Catalunya; sin cipreses de esferas ni `tree()` sin malla; palmeras de plaza = BCN_TREES (k = 3).
- FS_BLD: las cubiertas de las clases 3 y 12 usan `rt` 2/3 por edificio (antes, losa lisa).
- `rooftops.js`: `treeE` ya no dibuja copas (solo la maceta). Si algún día vuelven árboles a patios, que sean de BCN_TREES.
- `trees.js` `pick()`: las calles que apuntan a la Sagrada Família (eje a < 50 m del templo) llevan naranjos; plátano
  más alto, estrecho y aireado (r 0,25, 470 hojas).
- `setHour`: `lt` (madrugada) mezcla el cielo/bruma de noche entre azul profundo (21–24 h) y casi negro (0–6 h).
  FS_SEA: Fresnel con la normal media y pista cálida del sol bajo. FS_TER: arena con albedo ~0,45.

## 15. Condal City: datos reales por punto (`condal.js`, `window.BCN_CONDAL`, `data/condal.json`)

- `condal.js` (Condal City, Fase 1): `window.BCN_CONDAL` — `ready` (promesa), `loaded`, `at(x, z, out?)` →
  `{zona 'bcn'|'periferia'|'industrial'|null, seccion, seccionIdx, barrio, barrioIdx (META), barrioRef, distrito, mezcla
  (Float32Array 22, suma 1), detalles {clave: 0–1}, negocios [{id, n, e, q}], locales, densidad (locales/ha)}`; `mezcla`,
  `detalles` y `negocios` son compartidos (no modificar). `estilos[22]`, `escaparates[24]`, `negocios[59]`, `detalles[11]`,
  `barrios[73]`, `secciones`, `perif`, `top(mezcla, k)`, `toLonLat(x, z)`, `fromLonLat(lon, lat)` (UTM 31N, Krüger orden 6;
  la misma fórmula que `tools/cc/geo_utm.js`: x = E − 418400,7; z = N − 4567997,6).
- Datos: `data/condal.json`, generado por `tools/cc/empaquetar.py [condal_city_datos.json]` (necesita pyproj, shapely 2 y
  numpy; lee también data/meta.json, terrain.png y buildings*.png). Si cambian los edificios o el JSON, relanzarlo.
- Carga: index.html carga condal.js tras geo.js; la descarga empieza al cargar el script; app.js hace `await BCN_CONDAL.ready`
  justo después de publicar BCN_BARRI (antes de los edificios) y, al terminar, `BCN_CONDAL.initDebug(CTX)`.
- Depuración: **F8** abre/cierra la ventana Condal City (arriba a la izquierda): barrio y distrito (o periferia y barrio de
  referencia), sección y edificios, 3 estilos más probables, comercio (locales/ha y locales de la celda), 4 negocios
  principales y el edificio de delante (rayo desde la cámara por pasos de 1,5 m contra las plantas de `ctx.city`; si toca el
  suelo, el edificio más cercano a ≤ 12 m): índice, alto, clase, tipo, estilo de hoy (familia y variante de
  `ctx.mods.fx.famOf/varOf`) y estilo nuevo (lee `BREC.estilo` y `BREC.varEst` cuando la Fase 3 los cree).
  «Local vacío» se muestra aparte («vacíos x %»); en edificios sin fachada de detalle (`BREC.elig` = 0) no hay variante.
  `?condal=1` la abre al cargar; `BCN_CONDAL.debug.show(true)` desde el arnés. `tools/shot.js` con `PAGE=1` captura la
  página entera (capas HTML incluidas).
- Zonas: todo edificio tiene zona; las celdas de 100 m de periferia sin ningún edificio en la ventana de 300 m (mar, pistas
  del aeropuerto, campo abierto) dan `zona` null. En la orilla o junto a un edificio puede salir 'periferia' con densidad 0:
  `at()` no sirve para saber si hay tierra.
- Comercio (rejilla de 150 m): en Barcelona, remuestreo conservativo de `rejilla_comercial`; fuera, estimación por superficie
  construida de vivienda. Las celdas a caballo del límite suman lo real y lo estimado con solo los edificios de fuera
  (empaquetar.py imprime el total publicado = reales + sintéticos).
- Si falla la carga, `BCN_CONDAL.ready` se rechaza y app.js lo recibe con su `await` (hay un `.catch` vacío para que no salga
  «Uncaught (in promise)»).

## 16. Condal City: kit modular de fachadas (`kit.js`, `window.BCN_KIT`; bloques `estilos_bN.js` + `piezas_bN.js`)

Fase 2 (F2a monta la arquitectura y el bloque 1). Orden en index.html: `fachadas_estilos.js`, **`kit.js`**, `piezas_b1.js`,
`estilos_b1.js`, `piezas_b2.js`, `estilos_b2.js`, `piezas_b3.js`, `estilos_b3.js`, `piezas_b4.js`, `estilos_b4.js`, `facades.js`
(22 estilos tras la fusión F2m). Esquema de campos y ranuras: cabecera de `kit.js`.

- **Estilos**: `BCN_KIT.estilo(id, { nombre, comun, variantes: [4] })`; `id` = el del catálogo (`BCN_CONDAL.estilos`). Cada
  variante = BASE (la de `fachadas_estilos.js` + campos nuevos) + comun + la variante, congelada; `nobleV` y `chaflanV` son
  las copias con los campos de `noble` y `chaflan` ya aplicados.
- **Piezas**: `BCN_KIT.pieza(nombre, fn)` (nombres únicos en todo el kit; un repetido lanza un error al cargar). Las de ranura
  reciben `(env, run, q)` y devuelven `false` para que el generador haga lo de siempre: `pb` (cada vano de calle no comercial y el
  portal; interiors.js `groundFloor`), `pbFr` (frente de la planta baja retranqueada `pbRec`), `vano` (cada vano de piso de calle;
  facades.js `pisosV`; `T.vano` es el de siempre), `corona` (coronación de calle; `coronaV`) y `fachada` (lista, por tramo de calle
  tras pisos y coronación). Las demás piezas son geometría con su propia firma (`arco`, `fronton`, `aire`, `parabolica`, `cajon`,
  `jardinera`, `placas`, `pergola`, `lamas`, `urna` en kit.js; `puerta`, `ventanaPVC`, `loggia`, `frente_verja`, `frente_arcos`,
  `antenas`, `pilastras`, `urnas` en piezas_b1.js). `BCN_KIT.T` (lo rellena facades.js al iniciarse) da `wr`, `rail`, `ropa`,
  `planter`, `galeriaV`, `tribunaV`, `patioV`, `vano`, `corona` (la coronación de siempre, F2m), `vidAux`, `wallAux`, `KW`,
  `walkAt`, `coverAt` (`rail(…, vw, V)` toma la barandilla de la variante que se le pase: `T.vano` le pasa `q.V`, la noble
  incluida); `BCN_KIT.TI` (interiors.js)
  da `portalBay` y `roomQuad`; `BCN_KIT.medidas(q)` da el hueco de siempre de un vano de piso (para añadir frontones, recercados…).
- **Selector provisional** (la Fase 3 lo precalcula): `palette.js` `pick` llama a `BCN_KIT.elige(b, cls, seed, x, z, Hm)` en las
  clases 0 y 6: estilo al azar por la mezcla de `BCN_CONDAL.at` × compatibilidad de la altura real con las plantas del estilo
  (×0,2 por planta fuera de rango); variante por sus plantas preferidas (`pl`); color de la paleta del estilo (o `pal`/`paleta`
  de la variante) ±8 % de luminosidad y ±5 % de tono, horneado en el volumen (igual de lejos y de cerca). `BREC.estilo` (índice del
  catálogo, 255 = ninguno) y `BREC.varEst`; F8 los muestra. Estilos del catálogo aún sin kit → la familia y la paleta de antes.
  En facades.js `varOf`: viviendas (tipo 0) con estilo del kit → su variante (con el desplazamiento de vano, vuelo, remate y altura
  de planta de siempre, y sin repetir la variante de un vecino pegado de índice menor); naves, equipamientos y vidrio → TIPO.
- **Material por edificio**: color horneado (arriba); **desgaste** = desgaste_base del estilo (o `dg`) + `desgaste_extra` del
  barrio ±0,08 → `aux.w = 1 + 99·desgaste` en los paños de muro (`wallAux`); el sombreador escala con él los churretes y el zócalo
  sucio (`aux.w = 0`: lo de antes). Acabados nuevos con `BCN_KIT.acabado(nombre, K)` (168 `travertino`, 169 `panel`).
- **Planta baja**: comercio por tramo con la densidad comercial real (≥ 15 locales/ha → 0,95; 5–15 → 0,3–0,9; < 5 → ×0,05) × `com`
  del estilo (provisional hasta la Fase 4). Lo no comercial y el portal, la pieza `pb` del estilo. `pbRec`/`pbFr`: soportales,
  pilotis, patio delantero (la planta baja se dibuja en un marco retranqueado; techo, suelo y laterales del hueco los pone el núcleo).
- **Plantas**: `env.lv[0..nF]` (cotas de forjado); la noble (`noble.f`) más alta y las demás se reparten el resto. **Chaflán**:
  tramo de calle de 5–24 m a ~45° entre dos tramos casi perpendiculares → `env.V = V.chaflanV` en ese tramo (`run.chaflan`);
  `env.chaflan` = índice del tramo de chaflán del edificio (-1: ninguno). **Esquina**: `q.esquina` (-1 / 1 / 0) en las ranuras
  `pb` y `vano` marca el primer / último vano de un tramo cuyo vecino de ese lado es de calle y gira más de ~30°
  (`run.esq0` / `run.esq1`); `q.gl` (vano) es la cota de la acera delante del vano. `V.sinPeto`: rooftops.js no pone el peto
  de la azotea (tejados a la calle de las casas baratas).
  **Ático** retranqueado con probabilidad `aticoP` (regla 5).
- **Lejos**: `V.lejos = { muro, hp, bay, vidrio }` y `BCN_KIT.lejos(b)`, para que la Fase 3 lo lleve a FS_BLD.
- **Escaparate**: `?estilo=<id>&v=<0..3>` (al cargar: estilo, variante y color en todo lo que es vivienda) o
  `BCN.fx.force('estilo:<id>:<v>')` (en marcha: solo la geometría de detalle); `?pb=0|1` fuerza plantas bajas sin o con comercio.
  Las variantes de **material** (color, acabado `acab`, `paleta`/`pal`: autarquía v2 de ladrillo, modernista, burgués v3…) solo se
  comprueban con `?estilo=&v=`: `force()` no vuelve a hornear el color del volumen.
- **F2R** (repaso): `V.par` (parcelas virtuales pintadas de `par` vanos: `KIT.colPar(env, run, g)` y bajante en cada medianera,
  en `pisosV`); `env.pbPortal` (el vano de planta baja en curso es el portal: `P.puerta` de madera pone montante con zaguán
  iluminado y aplique); `env.esquinas` (el edificio tiene alguna esquina real); `run.chaflan` ya no depende de `V.chaflan`; el
  selector provisional pondera la mezcla con un núcleo de estilos propios por familia de barrio (`NUCLEO` en kit.js); los
  estilos con `com ≥ 0,5` conservan todo el comercio; el 38 % de las ventanas que dibujan las piezas «vano» con
  `env.windowHole` quedan abiertas (sin visillo); `lejos.muro` admite `'madera'`.
  `BCN.fx.spotAt(x, z, k, id, R, hMin, hMax)`: vista de fachada entera de un edificio del estilo cerca de (x, z).
  `tools/cc/vistas_estilos.json`: una vista por estilo en una calle que le pega (cada bloque añade las suyas).
- **Ids de material del kit**: 160–167 núcleo · 168–175 bloque 1 · 176–183 bloque 2 · 184–191 bloque 3 · 192–199 bloque 4; los de
  muro (160–199) reciben el desgaste de los paños.

## 17. Condal City: generador por edificio precalculado (`tools/cc/generador.js` → `data/condal_edif.json`, `edif.js`)
Fase 3a. Las decisiones por edificio de las reglas 0, 1, 2, 3, 4, 5 y 7 (`reglas_generador`) se precalculan con una
herramienta y el juego solo las lee, para que estilo, variante y color sean los mismos de lejos y de cerca y no cuesten al cargar.
- **Herramienta**: `node tools/cc/generador.js` (Chromium sin cabeza, como `tools/mz_partidas.js`): carga el juego con
  `?edif=0`, recorre `BREC` (las fincas de las manzanas partidas incluidas) con `ctx.city`, `fx.layoutB` y `fx.esChaflan`
  (expuestos por facades.js), el viario (`ctx.SEG`), el kit y `BCN_CONDAL`, y escribe `data/condal_edif.json` (base64 de zlib,
  8 planos de bytes por edificio; bits en la cabecera de edif.js). Imprime la estadística por barrio (reparto asignado frente a
  `fachadas_pct`, rachas, contiguos con misma variante y color). Determinista. **Relanzarlo** si cambian los edificios,
  `mz_partidas.json`, `condal.json` o el kit (estilos, variantes, `pl`, `pal`, `aticoP`): el juego compara una firma (FNV de
  una muestra de los contenedores y de los datos de condal.json que usa) y, si no casa, avisa en consola y usa el selector
  provisional de `kit.js`.
- **Reglas**: semilla = hash del centro de la huella; estilo por la mezcla (0,7 sección + 0,3 barrio; perfiles de periferia)
  × compatibilidad de plantas (×0,2 por planta fuera del rango; en avenidas, hasta 2 plantas de más) × un multiplicador por
  barrio y estilo (0,2–5, ajuste iterativo) que devuelve el reparto hacia la mezcla; frentes de calle (tramo de calle más largo
  y tramo de calzada a ≤ 16 m; calzadas encadenadas en calles por continuación recta) y aceras ordenadas: repite el estilo del
  anterior con p = 0,5 (0,65 Eixample; 0,8 tras polígono o casas baratas) si casa con la altura; variante por plantas
  preferidas, evitando la de los vecinos del mismo estilo y nunca variante + color de un vecino (acera o pegado); parcelas
  virtuales si el frente supera ×1,5 (×1,25 en fachadas estrechas) el ancho máximo del estilo; ático con `aticoP` de la
  variante (4+ plantas); remonte (1–2 plantas, 4 acabados) con `remontes_plantas_anadidas` en estilos anteriores a 1975;
  color de la paleta de la variante con tono ±5 % y luminosidad ±8 %; desgaste del estilo + `desgaste_extra` del barrio.
- **Juego**: `edif.js` (`window.BCN_EDIF`, antes de los edificios) descarga el fichero en paralelo; app.js llama a
  `BCN_EDIF.listo(dvs, nB)` justo antes de leer los volúmenes; `BCN_KIT.elige` (lo llama `BCN_PAL.pick` al hornear el color)
  toma estilo, variante y color del fichero (el escaparate `?estilo=` sigue mandando); `varOf` de facades.js usa la variante
  y el ático asignados sin reajustarlos (y `V.remonte` = [plantas, acabado]); `genB` toma el desgaste. `BCN_EDIF.parcela(b, k)`
  da variante y color de la parcela virtual k (para la Fase 3b).
- **Volumen lejano**: `BCN_EDIF.lejosCode(b)` empaqueta `variante.lejos` (muro, altura de planta, ancho de vano, fracción de
  hueco) en 14 bits que app.js guarda ×2 en `uv.w` del volumen (el bit 0 sigue siendo la bandera de «fachada de detalle
  construida» de facades.js, que ahora conserva los bits altos; el shader redondea `uv.w` antes de leer los bits: la
  interpolación del varying deja 32766 en 32765,999 y `mod(w, 2)` daría casi 2, con muros tramados sin fachada delante). FS_BLD pone la planta baja (4,3 m o 3,25 m) y los pisos a
  las cotas de la fachada de detalle, el ancho de vano y el tamaño del hueco del estilo, y marca el muro (cantos de forjado
  oscuros en hormigón y claros en ladrillo, planta baja más oscura en piedra y más clara en travertino, vidrio casi entero).
- **F8**: estilo y variante asignados (con el nombre de la variante y si vienen del fichero, del escaparate o del selector
  provisional) y una línea «Generador»: color, parcelas, ático, remonte, chaflán, desgaste y si repite el estilo de la acera.
- **Capas en tiempo de ejecución (F3b, facades.js `genB` → `tramo`)**:
  - *Parcelas virtuales* (regla 4): con `BCN_EDIF.parcelas(b)` > 1, ancho de parcela = tramo de calle más largo / parcelas; cada
    tramo de calle de ≥ 1,5 parcelas (salvo el chaflán) se parte en `round(L / ancho)` tramos, cada uno con su env
    (`envParcela`: `Object.create(env)` con variante y color de `BCN_EDIF.parcela(b, k)`, `KIT.colorDe`, tonos de `tonosV` con
    ámbito (b, 6, 2 + k)), su portal (`E.lay.portal` = la parcela) y una bajante en la junta. Ámbito de azar del tramo: i + 64·(j + 1).
    La parcela 0 conserva la variante y el color del edificio (los del volumen lejano); las demás solo existen en el detalle.
  - *Medianeras* (regla 6): `layoutB` marca `kind = 'medianera'` el tramo pegado (2 de 3 sondas) a un vecino de más de 2 m que queda
    ≥ 5,8 m por debajo de la cubierta. `medianera(env, run)`: ladrillo visto (45 %) o enfoscado gris / del tono de la fachada y, en
    W1, anuncio antiguo pintado (18 %: celdas 17–24 del atlas de rótulos de interiors.js, marcas inventadas; el sombreador de K.SIGN
    no los enciende de noche y los destiñe), mural de planos de color (12 %), ventanas abiertas después (22 %) o nada; grafitis encima
    del tejado del vecino con `detalles_prob.grafitis` × 1,3. Ámbito (b, 5, i).
  - *Planta baja* (regla 8): `pComDe(S, V, esquina, chaflán)`: ≥ 15 locales/ha 0,97 × (0,85 + 0,15·V.com); 5–15 de 0,3 a 0,9 × 1,35 en avenidas
    (bit 2 del byte 6 del fichero) y esquinas, × 0,8 en el resto; < 5, 0,02 + 0,02·dens (× 2 en esquinas); por debajo de 15, × (0,55 + 0,45·V.com);
    chaflán del Eixample o Sant Martí ≥ 0,93. La decisión va en `run.com` (ámbito (b, 7, 2, i)); interiors.js `groundFloor` la usa
    (`?pb=0|1` sigue mandando). Negocio: `shopPlan` saca `s.neg` (índice de `BCN_CONDAL.negocios`) por la cuota `q` de
    `at().negocios` y lo traduce al tipo de tienda de hoy (`NEG2T`; supermercado ancho → SUPERMERCAT; 58 «local vacío» → persiana
    bajada y casi sin rótulo). La Fase 4 enchufará su escaparate con `s.neg`. `BCN.fx.pbStat(x0, z0, x1, z1)`: estadística por banda
    de densidad y por barrio.
  - *Detalles* (regla 9): `detDe(at)` = `detalles_prob` del sitio / media de los 73 barrios (0–2,5). `V.ropa` y `V.mac` de la variante
    × su factor (varOf y parcelas); persianas bajadas del todo con `persianas_cerradas` × 0,8 (vanoDef); toldos de los comercios
    0,35 × factor; aparatos de aire y parabólicas del kit: `KIT.detF` (genB) quita la fracción que sobra cuando el factor es < 1.
  - *Chaflanes* (regla 10): en el Eixample y Sant Martí también los estilos sin `chaflan` propio usan el tramo de chaflán, con un
    grado más de recercado y +0,3 de balcones (`chaflanDe`); casi siempre comercio. La altura no se toca (+1 planta: no).
  - *Hitos* (regla 11): `SKIP` = { nombre: [R, Rv] }: en R solo se quitan equipamientos y naves (`BREC.tipo` > 0) y en Rv también las
    viviendas; parques y recintos con Rv = R. `BCN.fx.nSkip` cuenta los quitados.
