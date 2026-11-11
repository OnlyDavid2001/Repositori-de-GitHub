# Carril LUZ · LZ1 — HDR lineal y cadena de postproceso (plan ligero)

Ficheros tuyos: `app.js`, `lighting.js`, `index.html` y `DESARROLLO.md` §7. De `DESARROLLO.md` §6 lee 6.2, 6.3, 6.4, 6.5 y 6.12.

## Meta
Que el juego deje de parecer SketchUp y parezca un motor moderno: luz calculada en lineal con rango alto, tono fílmico,
bloom y antialiasing. Las sombras llegan en LZ2 y la oclusión ambiental en LZ3: no las hagas, pero deja el sitio.

## Contrato que debes MANTENER (los otros carriles no tocan sus shaders)
Los cuerpos de los shaders trabajan en «espacio de pantalla» (colores ajustados a ojo) y solo usan `lit()`, `shade()`,
`emit()`, `envRefl()`, `fog` / `FRAG()` y `FRAG_NOFOG()`. Tú cambias lo que hay DENTRO de esas funciones:
- `lit` / `shade` calculan en lineal (albedo^2.2; sol y cielo con intensidades lineales en proporción creíble, del orden
  de 8–12:1 a mediodía; ambiente hemisférico: color de cielo arriba, rebote cálido del suelo abajo) y devuelven el
  resultado OTRA VEZ en espacio de pantalla (puede pasar de 1: eso es HDR), para que lo que cada cuerpo suma a mano siga
  valiendo. Deja dentro un factor de visibilidad del sol (`sunVis`, hoy 1.0) que multiplique solo la luz directa y el
  brillo especular: LZ2 lo sustituirá por la sombra.
- `FRAG(c)` convierte a lineal, aplica la niebla en lineal y escribe RGB = radiancia HDR lineal y A = distancia a la
  cámara en metros (la usará LZ3). `FRAG_NOFOG`, igual con A enorme.
- `emit(col, gain)`: gain 1 = «se ve como el color de autor»; gain > 1 es HDR y debe hacer bloom.

## Tareas
1. **Preludio lineal/HDR** como arriba. El cielo, el mar y el resto de shaders de `app.js` pasan a HDR: el disco solar y
   el brillo del sol en el mar, muy por encima de 1 para que hagan bloom.
2. **Postproceso con `BABYLON.DefaultRenderingPipeline`** (`hdr = true`), creado en `lighting.js`: MSAA de 4 muestras en
   WebGL2 (FXAA si no lo hay), bloom con umbral alto (que solo florezcan el sol, los brillos, el cielo junto al sol y los
   emisivos; nada de emborronar la imagen), tono fílmico ACES con exposición y contraste calibrados, viñeta ligera y
   nitidez leve. No escribas pases propios si el de Babylon sirve.
   - El lienzo: créalo opaco (`alpha: false` en las opciones del motor) para que el alfa que se escriba no afecte a la
     página ni a las capturas (lee §4.15).
   - El arnés captura con `canvas.toDataURL` después de `scene.render()` con el bucle parado: toda la cadena debe
     ejecutarse dentro de `scene.render()`. En modo captura (`#shot`) el tiempo está congelado.
3. **Camino LDR** (`?ldr=1`, y automático sin WebGL2 o sin render a HalfFloat): tono + gamma dentro de `FRAG` con un
   `#define` y sin postproceso. Si `lighting.js` falla al iniciarse, la ciudad debe verse correcta por este camino.
4. **Calidad gráfica sencilla**: fila «Gráficos: Auto / Baja / Media / Alta» en el panel (como las filas que ya hay), Auto
   por defecto. Gobierna escala de render, MSAA y bloom (LZ2 y LZ3 añadirán sombras y oclusión a la misma tabla). Auto
   empieza en Alta y, si el tiempo medio de fotograma real supera ~34 ms durante unos segundos, baja un escalón (nunca
   en modo captura, nunca sube solo). Expón `BCN.light.setQuality(q)` y `BCN.light.stats()`.
5. **Calibración** a la hora por defecto (17:00): brillo medio parecido al de antes, pero con más contraste, negros con
   cuerpo y altas luces suaves que no se quemen; que el cielo y la niebla lejana casen. Un vistazo a las 13:00 y a las 20,25.

## Verificación
A las 17:00: `eix_acera, eix_fachada, rambla_pie, gotic_calle, aereo_eixample, port_vell`, en un montaje lado a lado con
las de referencia (`golden_a`). Además `eix_acera` a las 13:00 y a las 20,25, y `eix_acera` por el camino LDR
(`Q='?ldr=1'`). Sin errores ni avisos de consola.

## Entrega
Commits subidos, §7 de `DESARROLLO.md` (preludio HDR, cadena, calidades, camino LDR, cómo se depura) y, en el informe,
notas concretas para LZ2: dónde está `sunVis`, qué uniformes y muestreadores globales hay y cómo se añade uno a todos
los materiales.
