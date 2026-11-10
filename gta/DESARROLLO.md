# GTA Barcelona — guía de desarrollo

Visor/juego web de Barcelona entera hecho con Babylon.js y shaders propios. Este documento es la referencia
para cualquiera (persona o agente) que toque el código: cómo está montado, cómo se prueba y qué errores ya
nos hemos comido para no repetirlos.

## 1. Qué hay en la carpeta

| Fichero | Papel |
| --- | --- |
| `index.html` | Página, interfaz y orden de carga de scripts. Babylon y earcut vienen de jsDelivr; todo lo demás es local. |
| `app.js` | Motor, carga de datos, relieve, calles (cintas), volúmenes simples de edificios, mar, cielo, luz, cámara e interfaz. Define el GLSL común y `mkMat`. |
| `facades.js` | Fachadas de detalle al acercarse (capa BASE y capa ORNAMENTO), índices espaciales de edificios y tramos. |
| `streets.js` | Aceras de panot con bordillo, árboles en tres niveles (instancias) y mobiliario urbano. |
| `data/` | Datos de la ciudad (contenedores binarios envueltos en PNG), texturas y los props de Transeúnte (`tr_props.*`). |
| `tools/` | Arnés de capturas (`shot.js`), comparador (`cmp.py`) y vistas con nombre (`views.json`). No se publica. |

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
- `window.BCN` expone el estado (`scene`, `engine`, `cam`, `st`, `fx`, `streets`, `heightAt`, `applyView`, `setHour`,
  `fxFlush()` —construye de golpe todo el detalle pendiente— y `detailStats()`).
- En modo captura (`#shot` en la URL) el tiempo de animación se congela para que las capturas sean reproducibles.
- **Hay que abrir las imágenes y mirarlas.** Que no haya errores de consola no significa que se vea bien.
  Mira siempre al menos dos vistas a pie y, si tocas algo que se ve de lejos, una aérea.
- `tools/out/` y `tools/.cache/` están ignorados por git.

## 3. Cómo está montado el render

- **Sin materiales estándar de Babylon**: todo son `ShaderMaterial` creados con `mkMat(...)` (en `app.js`), que añade
  los uniformes comunes (cámara, sol, cielo, niebla, tiempo) y registra el material para que `setHour` lo actualice.
  **Crea siempre los materiales con `mkMat`**; si no, se quedan sin luz.
- **GLSL común** (`COMMON` en `app.js`): ruido (`hash21`, `vnoise`), tramado (`dith()`), cielo analítico (`skyColor`),
  luz (`lit(albedo, normal)`) y niebla (`fog(color, posMundo)`).
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
- `GB` acumula vértices: posición (float32, **relativa al origen de la celda**), color RGBA8 (`rgb` + **tipo de
  material** en `a`), canal auxiliar RGBA8 y normal RGBA8.
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

## 5. Reglas de trabajo

- Si un módulo falla al iniciarse, la ciudad debe seguir funcionando sin él (`try/catch` en el arranque).
- Presupuestos: no añadas trabajo por fotograma que crezca con el tamaño de la ciudad; nada de reservar memoria
  en bucles calientes; respeta los topes de triángulos.
- Textos de la interfaz en castellano; rótulos de comercios en catalán. **Nada de marcas ni logotipos reales.**
- Comentarios en castellano y al grano, como el resto del código.
- No des nada por terminado sin capturas revisadas a pie (y de lejos si aplica) y sin errores de consola.
