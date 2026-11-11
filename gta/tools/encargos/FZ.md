# Carril DETALLE · FZ — Mobiliario urbano al detalle (plan ligero)

Ficheros tuyos: `furniture.js`, `streets.js`, `ground.js` y `DESARROLLO.md` §9 (`details.js` es del carril INTERIORES en
este plan); a `geo.js` solo se le añade al final. De `DESARROLLO.md` §6 lee 6.4, 6.6, 6.7 y 6.10.

## Qué pidió el usuario
«Mejora el detalle de los cubos de basura, de los Bicing, de absolutísimamente todo», visto a pie. Hoy el mobiliario
son volúmenes sencillos. Referencia de nivel: Transeúnte, función `Kd` (líneas 22162–22371 de `transeunte_pretty.js`).

## Tareas, por orden de prioridad (remata cada una antes de pasar a la siguiente)
1. **Contenedores** (la batería típica de Barcelona en la banda de aparcamiento): resta (gris), orgànica (marró), envasos
   (groc), paper (blau) y el iglú de vidre (verd). Cuerpos con aristas redondeadas (primitivas suaves), tapa de otro
   tono, barra de pedal, asas laterales, patas o ruedas, boca propia de cada uno (ranura del papel, agujeros con goma
   del vidrio), panel frontal con un adhesivo de color y un pictograma genérico (nada de logotipos), algo de suciedad.
2. **Papeleras**: la cilíndrica metálica perforada sobre poste, con aro y bolsa insinuada.
3. **Bicing**: estación con la barra de anclajes (cada anclaje, su poste con ranura y piloto) y un tótem con pantalla;
   bicis con cuadro de tubos de verdad, ruedas con cubierta, llanta y radios insinuados, guardabarros, manillar, sillín
   y soporte delantero; librea roja y blanca genérica, sin logotipos. Entre el 40 y el 70 % de los anclajes ocupados.
4. **Bancos**: el de listones de madera con patas de fundición y reposabrazos, listón a listón.
5. **Farolas**: cabeza de luminaria con su lente (`emit`), base con moldura; al anochecer encendidas (`emit` 4–8 × `uDusk`)
   y con un charco de luz cálida en el suelo debajo (un quad con mezcla que crece con `uDusk`).
6. Si queda margen, en este orden: semáforos en los cruces con sus luces, bolardos en las esquinas, buzón amarillo
   genérico, parquímetro y motos aparcadas.

## Reglas
- Dos niveles: detalle completo solo en las celdas cercanas (≲ 60–70 m) y la versión sencilla en el resto; el mobiliario
  y las marcas de una celda no deben pasar de ~2× los triángulos de ahora (mídelo con `BCN.detailStats()`).
- Materiales con `K.PBR` (rugosidad y metal creíbles: plástico, chapa pintada, acero, madera). No pintes sombras falsas:
  llegan sombras y oclusión de verdad.
- Azar por ámbito; nada de trabajo por fotograma.

## Verificación
Hoja de contacto con cada objeto a 3–4 m (contenedores, papelera, estación Bicing y una bici, banco, farola) y las vistas
`eix_mobiliario, eix_acera, rambla_pie, granvia_cruce`; una farola al anochecer (`HOUR=20.25`). Sin errores ni avisos.

## Entrega
Commits subidos y §9 de `DESARROLLO.md` (catálogo de mobiliario, niveles de detalle, cómo añadir un objeto).
