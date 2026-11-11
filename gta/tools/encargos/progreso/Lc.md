# Lc · Hitos, lote c (perfil de la ciudad) — progreso

## Hecho (todo confirmado y subido en `wt-hitos-c`)
- `landmarks_c.js`: los 22 hitos del lote, 20 con constructor y 2 de nivel C. El lote suma 14 269 triángulos (tris.js),
  con los dos ejemplos incluidos.
  - A: torre_glories 2264 (ejemplo) · hotel_w 460 (ejemplo) · hotel_arts 2804 · torre_mapfre 432 · peix 473 ·
    torre_mare_nostrum 294 · torres_caixa 762 · edifici_forum 442.
  - B: wtc 1052 · edifici_colon 86 · edificis_trade 1854 · encants 230 · disseny_hub 50 · melia_sky 94 ·
    pergola_forum 64 · diagonal_zerozero 1066 · hotel_princess 595 · torres_diagonal_mar 177 · torre_aigues_besos 272 ·
    xemeneies_besos ~600.
  - C (retoque: color, estilo vidrio y alto real): torre_urquinaona (73 m, solo los volúmenes 96044 y 98005; el
    basamento 98006 se queda como está) · torre_melina (90 m).
- Las plantas reales de los datos van copiadas en el código (metros desde el centro, rot 0), así que no dependen de
  `h.plantas`.
- Utilidades locales: `inflar`, `escalar`, `bandas` (forjados/lamas), `rombos` (celosía en rombo) y `cuerpo` (sólido
  elíptico a lo largo de Z, para el Peix).
- Tres Xemeneies: los datos YA tenían las chimeneas (cada una sobre un bloque de 95 m y 27 × 27 m que no existe), a
  265 m al este de la posición del catálogo. El hito se ha movido a la chimenea central (17683, 18430.5), con rot 48,
  y sustituye los 21 volúmenes. La nave de turbinas (#207013) sale de los datos.
- Hojas miradas: día 210° con todo el lote; 22:00 30° de los de nivel A; 300° y 120° de varios. Sin errores de consola.
  Hojas en `<scratchpad>/lc/d1.jpg`, `n1.jpg`, `d2.jpg` y `d3.jpg`.

## Flojo / pendiente
- Peix: se lee como un pez dorado macizo (casi un dirigible). No tiene la malla calada de lamas.
- Torres «la Caixa»: las plantas de los datos son casi circulares, así que salen como cilindros negros. Las reales son
  más cuadradas, con chaflanes. La segunda torre mide 48 m, la altura de los datos.
- Disseny Hub: el voladizo solo se nota desde el noreste. Un volumen beige vecino de los datos se le pega por el oeste.
- Edifici Fòrum: está a 6–24,5 m (la altura de los datos es 13,5 m). Desde arriba domina la cubierta gris.
- Diagonal Mar, Melià Sky, Princess, Colón, Trade y Mare Nostrum son las plantas de los datos extruidas con un material
  mejor. Mare Nostrum lleva la torre a 86 m.
- WTC: anillo elíptico de 4 cuerpos centrado a ojo en (2, −4) del hito. En la vista aérea queda bien sobre el muelle.

## Cómo se prueba
`node tools/hitos/tris.js c` · `python3 tools/hitos/hoja.py --lote c --rumbos 210 --cols 5` ·
`python3 tools/hitos/hoja.py hotel_arts,peix --solo-noche --rumbos 30`

## Trampas
- `tris.js` da `h.plantas` vacías: por eso las plantas van copiadas en el código.
- Antes de modelar un hito que «no existe en los datos», búscalo por altura con un `near`. Las Xemeneies sí estaban.
