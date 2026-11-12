# Rúbrica del jurado · Fase gráfica 1 (del 5 al 8)

Sirve para puntuar cada vista de `gta/tools/views_g1.json` del 1 al 10, siempre **comparando con las fotos reales** de
`scratchpad/g1/banco/ref/` (una o dos por tipo de vista). La pregunta de fondo es una sola: **¿cuánto se parece esto a
una foto o a un juego comercial de mundo abierto de hace pocos años, visto desde ese mismo sitio?**

## Cómo se puntúa
1. Mira la captura **entera y a tamaño real** (960×540 o 1280×720), luego por zonas: primer plano (0–15 m), plano medio
   (15–150 m) y fondo. A pie de calle pesa más el primer plano; en el dron y en las lejanías pesa más el fondo.
2. Pon nota (enteros) a los **seis criterios** de abajo. Si un criterio no aplica (p. ej. vegetación en una calle del
   Gòtic sin un solo árbol de verdad), puntúa lo que hay: la ausencia correcta de árboles no penaliza; un árbol feo sí.
3. **Nota de la vista** = media de los seis criterios, con dos correcciones:
   - **el defecto manda**: la nota de la vista no puede pasar de (criterio más bajo + 2). Un fallo gordo (un edificio
     transparente, una calle que se corta, el mar con un borde recto) se ve antes que todo lo bueno;
   - **redondeo a la baja** a medio punto. Si dudas entre dos notas, **la más baja**.
4. Apunta los **3 defectos más visibles** de la vista, cada uno con **dónde** está (zona de la imagen: «tercio izquierdo,
   primer plano», «al fondo, centro») y a qué carril le toca (G1L luz y mar · G1F fachadas · G1T azoteas, huecos e hitos ·
   G1S suelo y marcas · G1V árboles, monte y mobiliario).
5. Sé **severo y concreto**: «el asfalto es plano y sin desgaste, se repite cada 4 m» vale; «podría mejorar» no vale.

Salida (una por jurado): `scratchpad/g1/banco/jurado_<n>_<tanda>.json` con
`{"vista": {"luz": n, "materiales": n, "geometria": n, "vegetacion": n, "coherencia": n, "lejania": n, "nota": n,
"defectos": [{"que": "...", "donde": "...", "carril": "G1x"}, …]}, …, "media": n, "minima": "vista"}`.
**Meta de la fase: media ≥ 8 y ninguna vista por debajo de 7.**

## Escala general
| nota | qué es |
|---|---|
| 1–2 | roto: pantalla negra, todo gris sin texturas, cámara dentro de un edificio, errores evidentes por todas partes |
| 3–4 | maqueta: volúmenes de colores lisos, se entiende qué es pero no parece una ciudad |
| **5** | **prototipo correcto** (donde estaba el juego al empezar la fase): se reconoce Barcelona, pero todo es plano, repetido y sin luz |
| 6 | un juego indie modesto: algo de textura y detalle, aún con fallos que saltan a la vista |
| **7** | **juego decente**: nada roto a primera vista; materiales y luz creíbles en el plano medio; el primer plano todavía pobre |
| **8** | **juego comercial de hace unos años** (un GTA V de la PS3, un Watch Dogs): creíble en primer plano; los fallos hay que buscarlos |
| 9 | casi foto en el plano medio; solo delata el juego algún detalle de cerca |
| **10** | indistinguible de la foto de referencia a ese tamaño |

## Los seis criterios

### 1. Luz y atmósfera (`luz`)
Sol y cielo, sombras, oclusión en rincones, reflejos del cielo, exposición, color, bruma; de noche, farolas y ventanas.
- **5**: luz plana; sombras duras o ninguna; cielo de un solo degradado; los cristales no reflejan nada; el fondo igual de
  nítido y saturado que el primer plano; de noche, todo uniforme o negro.
- **7**: sombras del sol en la dirección correcta y con algo de suavidad; cielo con degradado y algo de bruma en el fondo;
  esquinas algo más oscuras; colores cálidos y creíbles; de noche, conos de farola y ventanas encendidas a distintas alturas.
- **8**: sombras suaves con penumbra y de largo alcance (las de los edificios llegan a la calle de enfrente); oclusión de
  contacto visible al pie de las paredes, bajo los balcones y en los rincones; los cristales reflejan el cielo y los
  edificios de enfrente; la lejanía se azulea y se aclara; exposición automática (ni quemado ni empastado); sin parpadeo de
  sombras ni dientes de sierra. De noche, como las fotos del usuario: farolas anaranjadas con su charco de luz, cielo
  oscuro azulado, no negro.
- **10**: luz de foto: rebotes de color (la pared soleada tiñe la acera), dispersión del aire, hora del día evidente sin
  mirar el reloj.
- Ejemplos: Passeig de Gràcia a las 10:30 con la acera de la sombra azulada y la del sol cálida (8); la Rambla de noche
  con todo naranja uniforme y sin charcos de luz (5).

### 2. Materiales y texturas (`materiales`)
Asfalto, panot, bordillos, piedra, estuco, tejas, cristales, metal; su escala, variación y desgaste.
- **5**: colores lisos o texturas borrosas; la misma textura en todo; repetición en mosaico evidente; sin relieve.
- **7**: cada superficie tiene su material reconocible (asfalto con grano, panot con su dibujo, fachadas de estuco o
  piedra); repetición que solo se ve si la buscas; algo de suciedad.
- **8**: asfalto con desgaste, parches, juntas y marcas gastadas; el panot de flor nítido a pie de calle y sin moiré de
  lejos; piedra con sillares y estuco con manchas y zócalo más sucio; tejas con relieve; cristales con reflejo e interior
  falso; mapas de normales y de rugosidad que se notan con la luz rasante.
- **10**: materiales de escaneo (fotogrametría) a cualquier distancia.
- Ejemplos: acera del Eixample con la flor del panot leíble a 3 m y bordillo de granito (8); fachadas de un color plano con
  ventanas pintadas (5).

### 3. Detalle geométrico a pie de calle (`geometria`)
Volumen real de lo que hay a la altura del peatón: balcones, cornisas, persianas, portales, bajos comerciales, toldos,
rótulos, bordillos, alcorques; en el dron, perfiles de azoteas y tejados.
- **5**: cajas con las ventanas dibujadas; bajos lisos; el bordillo es un cambio de color.
- **7**: balcones y cornisas con volumen; bajos con escaparates y algún toldo; bordillo con altura; azoteas con algo encima.
- **8**: balcones de forja en 3D con barrotes; cornisas con molduras; persianas en distintas posiciones; portales hondos;
  bajos comerciales variados con toldos y rótulos en catalán (sin marcas); azoteas con barandillas, casetas, depósitos,
  antenas y tendederos.
- **10**: el detalle de una foto: canalones, aparatos de aire, macetas, herrajes.
- Ejemplos: chaflán del Eixample con tribunas y balcones corridos (8); calle del Gòtic con muros lisos y sin balcones (4–5).

### 4. Vegetación (`vegetacion`)
Árboles de calle, palmeras, pinos, setos, arbustos, hierba y el monte.
- **5**: árboles de bola o de tarjeta cruzada, todos iguales, flotando o atravesando cosas; monte de un verde liso.
- **7**: especies reconocibles (plátano en el Eixample, palmeras en el litoral, pinos en Montjuïc y Collserola); copas con
  volumen y sombra propia; tamaños variados; el monte con manchas de color y algo de textura.
- **8**: hojas que se mueven con el viento; troncos con corteza (el plátano, a manchas); alcorques; sombra moteada en el
  suelo; Collserola con bosque denso que no se pixela de lejos, arbustos y hierba en los bordes de los caminos.
- **10**: vegetación de foto, con sotobosque y estaciones.
- Regla del usuario: **un árbol poco currado resta más que un árbol que no está.**

### 5. Coherencia (`coherencia`)
Lo que delata que es un juego roto: huecos sin textura, polígonos que parpadean (z-fighting) o saltan al mover la cámara,
transparencias que fallan, cosas cortadas, flotando o metidas en otras, calles inclinadas de lado, marcas viales
incoherentes en cruces y rotondas, gente parada, objetos que aparecen de golpe.
- **5**: varios fallos visibles en la captura sin buscarlos.
- **7**: uno pequeño que se encuentra al buscarlo.
- **8**: ninguno visible; los cambios de nivel de detalle no se notan; las marcas viales de un cruce se leen como un cruce
  real (pasos de cebra en todas las bocas, líneas de detención, flechas, marcas de rotonda continuas).
- **10**: ninguno ni siquiera buscándolo con lupa.
- Cada defecto de coherencia **cuenta en la lista de 3 defectos** con prioridad sobre los de gusto.

### 6. Lejanía (`lejania`)
Cómo acaba el mundo: horizonte, mar, Collserola, Montjuïc, la ciudad que se pierde a lo lejos.
- **5**: el mundo se corta (un borde recto, un fondo vacío, edificios que aparecen de golpe); el mar plano; el monte de lejos,
  pixelado y verde liso.
- **7**: horizonte continuo; la ciudad lejana con volúmenes creíbles y bruma; el mar con algo de oleaje y el brillo del sol;
  el monte con textura.
- **8**: la ciudad se pierde en la bruma de forma natural; el mar con olas, reflejo del cielo y el sol, y la orilla con
  espuma; Collserola de lejos con bosque sin pixelado y con relieve marcado por la luz.
- **10**: profundidad de foto aérea.
- En las vistas cerradas (una calle estrecha) puntúa lo que se ve al fondo de la calle: el cielo, el final de la calle.

## Vistas y criterios que más pesan
| tipo de vista | pesa más |
|---|---|
| a pie de día (Passeig de Gràcia, Eixample, xamfrà, Gòtic, Gràcia, Poblenou, Sarrià, Diagonal, Plaça de Catalunya, Sagrada Família) | geometría, materiales, coherencia |
| a pie de noche (Rambla, Eixample) | luz (calibrada con las fotos del usuario), coherencia |
| dron y azoteas (Glòries, Espanya, Eixample, azoteas) | coherencia (marcas de rotonda, huecos de azotea), geometría de tejados, lejanía |
| mar y puerto (Barceloneta, Port Vell, Montjuïc desde el puerto, la ciudad desde el mar) | lejanía, luz |
| monte (camino de Collserola, Collserola desde la ciudad, carretera del Tibidabo) | vegetación, lejanía, coherencia (camino nivelado) |

Esto no cambia la fórmula de la nota; sirve para decidir qué defectos apuntar primero.
