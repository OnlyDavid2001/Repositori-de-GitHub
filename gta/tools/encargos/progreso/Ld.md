# Ld · Hitos, lote d (Ciutat Vella, puerto y monumentos) — progreso

## Hecho (23 hitos, 14 483 triángulos; `tris.js d` y el arnés sin errores ni avisos)
| id | nivel | tris | notas |
| --- | --- | --- | --- |
| colom | A | 1872 | nuevo (no existía); rot 125 = rumbo del brazo (hacia el mar) |
| catedral | A | 1742 | plantas de los datos; cimborio-aguja 70 m, agujas laterales, campanarios |
| santa_maria_mar | A | 964 | recentrado y eje 30° (los datos lo dan; el catálogo decía 53°); +12 volúmenes (naves y ábside) |
| arc_triomf | A | 1594 | ejemplo del núcleo, revisado de día y de noche: bien |
| santa_maria_pi | B | 627 | nave girada −7,6°; campanario octogonal; anexo bajo rehecho |
| merce | B | 392 | encaje DUDOSO (no está en los datos): nave sobre #83406, cúpula y estatua sobre #83401 |
| cascada | B | 406 | rot 0 (la U de los datos abre al sur) |
| parlament, estacio_franca, santa_caterina, boqueria, macba, drassanes, born_ccm, duana, correus | B | 106–766 | plantas de los datos |
| sant_jaume | B | 484 | volúmenes NO ocultos (recogen manzanas vecinas): retoque piedra/19 m y dos fachadas a la plaza |
| torre_jaume_i, torre_sant_sebastia | B | 1374, 1054 | celosía de 4 patas + cabinas |
| cap_barcelona, estel_ferit, llapis, rambla_mar | B | 146, 40, 30, 608 | sin volumen en los datos; Cap, Llapis y Rambla de Mar recolocados con vistas cenitales |

Hojas: `<scratchpad>/ld/hoja_dia_lote_d.jpg` (día, todos) y `<scratchpad>/ld/hoja_noche_A_lote_d.jpg` (22:00, nivel A).

## Pendiente / flojo
- Mercè: posición y orientación de la nave dudosas. Llapis: puesto en el mayor claro a ~95 m del dato de memoria.
- Cap de Barcelona: en el Moll de la Fusta según la vista; desde el Passeig de Colom lo tapan los árboles.
- Sant Jaume: de lejos se ve poco (las fachadas solo se leen desde la plaza).
- Sin cable del telefèric entre torres; sin torre ni muralla de las Drassanes; claustro de la Catedral sin modelar.

## Cómo se prueba
`node tools/hitos/tris.js d` · `python3 tools/hitos/hoja.py --lote d --rumbos 210 --out tools/out/lote_d`
Vistas sueltas con parámetros por hito: `<scratchpad>/ld/run.sh prefijo id:rumbo:k:elev:hora …`.

## Trampas
- Las plantas de los datos van copiadas en el fichero (en `tris.js` no hay `h.edif`).
- `heightAt` en el agua del puerto no distingue agua y tierra (≈1,4 m): para colocar sobre el agua, vista cenital.
- `K.METAL` con fracción de huecos alta en paneles grandes se ve como manchas negras: para cabinas acristaladas, `CORTINA`.
