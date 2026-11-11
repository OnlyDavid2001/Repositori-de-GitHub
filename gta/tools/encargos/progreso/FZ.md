# FZ — Mobiliario urbano al detalle (carril DETALLE)

## Hecho (todo el encargo, puntos 1 a 6)
- `furniture.js`: dos niveles por objeto (sencillo / detalle) con relevo por píxel a 58–70 m; tipos `K.FURN` (60)
  y `K.FDEC` (61); piezas `loft`, `cdec`, `fbox`, `slab`.
- Objetos: contenedores (resta, paper, envasos, orgànica) e iglú de vidre, papelera perforada, estación de Bicing (viga,
  anclajes con piloto, tótem con pantalla, bicis al 40–70 %), banco de listones, farola con lente y charco de luz al
  anochecer, semáforos en los cruces, **bolardos** flanqueando los pasos de cebra, **buzón** amarillo, **parquímetro** y
  **motos** aparcadas en grupos.
- Segunda pasada, ya con la luz HDR y las sombras reales (apuntes del integrador):
  - ganancias de lo emisivo recalibradas (`fNite`): la luminaria florece al anochecer (0,2 → 5,5), pantallas 0,9 → 2,3,
    focos de semáforo 1,6 → 3,0, pilotos 1,3 → 2,2. De día nada florece.
  - el charco de luz **multiplica** el búfer HDR (mezcla `DST_COLOR, ZERO`): conserva el dibujo del suelo. En LDR, la
    mezcla alfa de antes.
  - no hay sombras pintadas: las mallas `fu*`/`fh*` van con `reg(…, { cast: true, layer: 'furn' })` y proyectan en la
    cascada cercana (`lighting.js` excluye `furn` de la lejana). Los charcos (`lp*`) no proyectan.
  - fundición y columnas un punto más claras para que no queden negras a la sombra.
- `streets.js`: malla de detalle por celda cercana (`hiJob`/`dropHi`), malla de charcos (`lp`), estadísticas `furn`,
  `furnHi`, `hi`.
- `DESARROLLO.md` §9 al día (catálogo, niveles, emisivos con HDR, charco, cómo añadir un objeto, límites).

## Pendiente / flojo
- Triángulos por encima del objetivo (~2×): ver la medida en §9.2. Lo que más pesa: farolas, bicis y motos.
- Motos de baja poligonización y todas derechas (sin apoyarse en la pata).
- El charco solo ilumina el suelo, no los objetos ni los coches que lo pisan.
- Bolardos, buzón y parquímetro no saben de los alcorques: alguno puede caer pegado a un árbol.
- La viga de una estación de Bicing usa una sola cota (en cuesta no sigue la pendiente).

## Trampas descubiertas
- La hora de una vista del arnés se queda puesta para las siguientes: las de anochecer, al final.
- `uDusk` a las 20:25 es solo 0,30: lo que deba verse «al anochecer» cuelga de `fNite = smoothstep(0.05, 0.3, uDusk)`.
- Todo el mobiliario debe usar `K.FURN`/`K.FDEC` (llevan el nivel en el 4.º byte del auxiliar): con `K.PBR` se vería doble.
- Orientación de las calcomanías: en una cara que mira a +d, la izquierda de quien mira es el `u` mayor.
- En la calzada hay parches de asfalto más oscuros con el borde recto: no son un fallo del charco de luz.
- Con la máquina cargada, la primera vista del arnés tarda 5–6 min y las demás ~2 min.

## Cómo se prueba
`node tools/furn_test.js` · `node tools/shot.js tools/out/fz/s @tools/views_detalle.json` (17 vistas: mejor por tandas) ·
vistas del encargo: `eix_mobiliario,eix_acera,rambla_pie,granvia_cruce`.
Para saber dónde ha caído un objeto: en modo captura, `BCN_FURNITURE.log` (`[tipo, x, z, ángulo]`), leído en el `eval`
de la vista siguiente.
