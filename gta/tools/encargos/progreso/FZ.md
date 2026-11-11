# FZ — Mobiliario urbano al detalle (carril DETALLE)

## Hecho
- `furniture.js` reescrito: dos niveles por objeto (sencillo / detalle) con relevo por píxel a 58–70 m; tipos `K.FURN` (60)
  y `K.FDEC` (61); piezas `loft`, `cdec`, `fbox`.
- Objetos: contenedores (resta, paper, envasos, orgànica) e iglú de vidre, papelera perforada, estación de Bicing (viga,
  anclajes con piloto, tótem con pantalla, bicis al 40–70 %), banco de listones, farola con lente y charco de luz al
  anochecer, semáforos en los cruces.
- `streets.js`: malla de detalle por celda cercana (`hiJob`/`dropHi`), malla de charcos (`lp`), estadísticas `furn`,
  `furnHi`, `hi`; `flush` hace dos pasadas.
- `DESARROLLO.md` §9 (catálogo, niveles, tipos, cómo añadir un objeto), `tools/views_detalle.json`, `tools/furn_test.js`.

## Pendiente (fuera o al final del alcance)
- Punto 6 del encargo: bolardos, buzón, parquímetro, motos.
- Triángulos: celda cercana ≈ 5× lo de antes; total cargado ≈ 2,3× (objetivo ~2×). Recortar farolas o bicis si hace falta.

## Trampas descubiertas
- La hora de una vista del arnés se queda puesta para las siguientes: las de anochecer, al final.
- `uDusk` a las 20:25 es solo 0,30: lo que deba verse «al anochecer» no puede ser lineal en `uDusk`.
- Todo el mobiliario debe usar `K.FURN`/`K.FDEC` (llevan el nivel en el 4.º byte del auxiliar): con `K.PBR` se vería doble.
- Orientación de las calcomanías: en una cara que mira a +d, la izquierda de quien mira es el `u` mayor.

## Cómo se prueba
`node tools/furn_test.js` · `node tools/shot.js tools/out/fz/s @tools/views_detalle.json` (pocas vistas por ejecución) ·
vistas del encargo: `eix_mobiliario,eix_acera,rambla_pie,granvia_cruce`.
