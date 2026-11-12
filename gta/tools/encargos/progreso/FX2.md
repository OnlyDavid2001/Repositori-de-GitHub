# FX2 · Fachadas: 8 familias más y repaso de variedad

Rama `wt-n2-fx`. Encargo: `tools/encargos/n2/FX.md` (reparto FX2). Sigue a FX1 (`FX1.md`, que explica el generador y cómo
se añade una familia).

## Hecho
- `fachadas_estilos.js`: familias `sants`, `les_corts`, `sarria_pedralbes`, `poblenou`, `sant_andreu`, `horta_guinardo`,
  `nou_barris`, `periferia`, 5 variantes cada una → **70 variantes en las 15 familias** (FX1: 30; FX2: 40). Ninguna familia
  sale ya con la fachada antigua de `details.js` (salvo `?fxv=off`).
  - sants: obrera, ladrillo con frontis, Creu Coberta burgués, años 50 con terraza corrida de tubo, bloque de Badal (gresite y galerías).
  - les_corts: casa del núcleo antiguo con alero, terrazas de obra, ladrillo con forjado visto, galerías, reciente con vidrio y hormigón.
  - sarria_pedralbes: casa de la vila con alero, noucentista, Pedralbes con terrazas de vidrio, Pedralbes de piedra, xalet con balaustres.
  - poblenou: fábrica de ladrillo (ventanales de taller + frontis), casa obrera baja, loft (ladrillo + forjado + ático de vidrio), 22@, bloque.
  - sant_andreu: casa de la vila, ladrillo con cadeneta, nave revocada con ventanales, bloque de gresite, galerías de ladrillo.
  - horta_guinardo: casa de Horta con alero, gresite con galerías, ladrillo con forjado visto, terrazas de obra, reciente.
  - nou_barris: bloque de ladrillo con ventanas, gresite, galerías, autoconstrucción en ladera (revoco gastado), terrazas de hormigón.
  - periferia: bloque de ladrillo, gresite con galerías, terrazas, obrera antigua, reciente.
- Piezas nuevas en `facades.js` (documentadas en la cabecera de `fachadas_estilos.js`):
  - hueco `'taller'`: ventanal de fábrica ancho y alto con retícula de acero (`marco: ACERO`), sin balcón;
  - cierre `'ninguna'` (vidrio solo); imposta `3`: canto de forjado visto (banda de hormigón, acabado 19, tono `env.forjV`
    derivado de `d.col`, ámbito (b, 6, 1) 4.º número);
  - coronación `'frontis'`: peto con frontón escalonado en el centro y cartela lisa.
- Repaso de variedad (`varOf` en `facades.js`, todo en el ámbito (b, 6), ahora 6 números):
  1. `MEZCLA[fam] = { f, p }`: con probabilidad p (12–25 %) un edificio toma una variante de la familia hermana.
  2. Ningún edificio repite la variante de un vecino pegado (cajas a < 1,5 m) de índice menor: coloreado voraz por índice,
     NO depende del orden de carga de las celdas (recursión acotada a 400).
  3. Edificios de clase 6 (sin comercios) en familias con nave o fábrica (poblenou, sant_andreu): variante `'taller'`.
  4. Cada edificio desplaza su ritmo de vanos (±7 %), vuelo (±10 %), altura de planta (±3 %) y tono de remates (±0,08).
- Arreglos generales (afectan también a las familias de FX1):
  - galerías: solo 2 de cada 3 vanos (el tercero, ventana) → los bloques ya no parecen oficinas acristaladas;
  - barandilla de obra: antepecho de 0,62 m + pasamanos de tubo con montantes (antes 1,02 m de obra: tapaba los huecos),
    y vuelo de terraza limitado a 1,15 m;
  - losa y ménsulas del balcón: tono neutro y piedra solo en luminancia (FXPIEDRA) → menos amarillo visto desde abajo;
  - revoco gastado: desconchados más escasos y menos marcados.

## Cómo se prueba
Hojas por variante: `scratchpad/n2/fx2/hoja.json` (`"fx": 0.55`, `BCN.fx.force('fam:n')` + `BCN.fx.spot('fam', 1, 1.25)`),
vistas a pie y de noche `pie.json` (`force(null)` + `spot(fam, 0, 1)`), ANTES con `force('off')` en el mismo punto.
`SIZE=640x360 FMT=jpg node tools/shot.js <prefijo> @hoja.json`.

## Medidas (vista a pie `spot(fam, 0, 1)`, 640×360, `detailStats().fx`; ANTES = `force('off')`)
| vista | BASE antes → después | ORNAMENTO antes → después |
|---|---|---|
| Poblenou | 758 194 → 703 034 (−7 %) | 733 738 → 473 166 (−36 %) |
| Nou Barris | 1 104 052 → 1 070 312 (−3 %) | 1 041 962 → 495 342 (−52 %) |
| Sants | 971 804 → 951 036 (−2 %) | 990 248 → 686 984 (−31 %) |
Mismo nº de celdas; `S.cap` sin tocar; nada por fotograma (una búsqueda de vecinos por edificio, guardada en `VAR[b]`).
Consola: sin errores ni avisos en las ejecuciones finales (hoja, fix, pie, calle).

## Pendiente / flojo
- El ladrillo visto (16) y el gresite (17) toman el color de `d.col`: en esta rama (sin PALETA) casi todo es blanco o beige,
  así que el «ladrillo» parece ladrillo pintado. Necesita que PALETA dé tonos de ladrillo a poblenou, sant_andreu,
  nou_barris, periferia (y algo en sants, les_corts, horta_guinardo).
- `spot()` elige edificios altos (11–30 m) y a menudo bloques: las casas bajas (alero, frontis) casi no salen en las hojas;
  el frontis y el alero solo se ven bien desde lejos.
- Barandilla de vidrio: sigue siendo un paño opaco gris.
- Barandilla de vidrio con terraza (sar_pedralbes, lc_vidre, pn_22, hg_nou, per_nou): desde la acera tapa casi todo el hueco.
- Variedad: los vecinos pegados ya no repiten variante, pero un edificio muy largo (una manzana entera en un solo volumen)
  sigue siendo una sola variante en toda la calle (calle2_sant_andreu).
- Muchos de los puntos de `spot()` quedan bajo árboles de la acera (las hojas de Sarrià, Poblenou, Sant Andreu y Horta).

## Capturas (scratchpad `n2/fx2/`)
`ANTES_DESPUES.jpg` (Poblenou, Nou Barris, Sants), hojas por familia a las 10:30 (`hoja_sants_lescorts.jpg`,
`hoja_sarria_poblenou.jpg`, `hoja_santandreu_horta.jpg`, `hoja_noubarris_periferia.jpg`), `hoja_pie.jpg` (una vista a pie
por familia), `hoja_noche.jpg` (23:00), `hoja_calle.jpg` (calles en diagonal, para la variedad). `v1/`: primera tanda, antes
de los arreglos de galerías y terrazas.
