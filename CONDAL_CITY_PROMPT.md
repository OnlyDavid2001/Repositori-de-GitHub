# Barcelona: Condal City — Reformulación de fachadas y plantas bajas

**Archivos:** este documento (`CONDAL_CITY_PROMPT.md`) + `condal_city_datos.json`. Ponlos los dos en la raíz del proyecto.

---

## PARTE 1 · PROMPT PARA CLAUDE CODE

> Copia desde aquí hasta el final de la Parte 1.

Vamos a rehacer cómo se generan **todas las fachadas y plantas bajas** de la ciudad. Ahora mismo el juego se ve como un copia-pega: los edificios se repiten y los barrios no se distinguen. El objetivo es que **cada barrio, e incluso cada calle, se reconozca sin cartel**, con datos reales de Barcelona.

Tienes dos fuentes en la raíz del proyecto:
- **`CONDAL_CITY_PROMPT.md`** (este archivo): en la Parte 2 está toda la documentación (los 22 estilos de fachada, los modelos de escaparate, las reglas del generador y una chuleta por barrio).
- **`condal_city_datos.json`** (~1 MB): datos reales por barrio y por zona censal. **No lo leas entero en el contexto**: cárgalo con un script y consulta lo que necesites. Empieza leyendo su `_leeme`.

Es un trabajo largo. Hazlo por fases, en orden, y **haz un commit de Git al final de cada fase** con un mensaje claro. Si en alguna fase algo empeora el rendimiento o rompe el juego, para y avísame antes de seguir.

### Fase 0 — Diagnóstico (no cambies nada todavía)
1. Revisa cómo se generan hoy edificios, fachadas y plantas bajas, y cómo están organizados los modelos y materiales.
2. Comprueba la conversión entre la posición en el juego y [longitud, latitud] (el mapa sale de OpenStreetMap). Si no existe, créala y verifícala con tres puntos: Sagrada Família (2.1744, 41.4036), Plaça de Catalunya (2.1700, 41.3870) y Torre Glòries (2.1894, 41.4034).
3. Mide los FPS actuales en tres vistas (a pie en el Eixample, a pie en el Gòtic, vista aérea) para tener la referencia.
4. Escríbeme un plan corto con lo que vas a cambiar y cualquier problema que veas. Commit.

### Fase 1 — Datos y consulta espacial
1. Crea un módulo que cargue `condal_city_datos.json` y responda rápido, para cualquier punto: su sección censal, su barrio, la mezcla de estilos (0,7 sección + 0,3 barrio), los `detalles_prob` del barrio, la mezcla de negocios y la densidad comercial de la celda de `rejilla_comercial` más cercana. Usa un índice espacial (rejilla o árbol) para no recorrer los ~1.000 polígonos cada vez.
2. Añade una herramienta de depuración (tecla o menú) que muestre en pantalla el barrio, la zona y el estilo del edificio que tengo delante. Commit.

### Fase 2 — Kit modular de fachadas (los 22 estilos)
1. Construye cada estilo del catálogo (Parte 2, sección A) como un **kit de piezas**: planta baja, planta tipo, planta noble (si aplica), coronación o ático, balcón, ventana, tribuna, cornisa y chaflán (si aplica).
2. Cada estilo con sus **4 variantes**, su paleta y sus detalles propios. Las variantes deben verse distintas de verdad (ritmo de balcones, ornamento, proporciones), no solo de otro color.
3. Prioriza por peso real en la ciudad: desarrollismo, pueblo, contemporáneo, burgués 60–70, autarquía, noucentista, olímpico, casa obrera XIX, autoconstrucción, modernista, Eixample ornamentado y temprano… y por último los minoritarios pero muy característicos (quart de casa, gótico, barroco, casas baratas). Ninguno puede faltar.
4. Usa **instancias y parámetros de material** (color, desgaste, suciedad) en vez de modelos únicos, para no perder rendimiento. Commit después de cada bloque de 5–6 estilos.

### Fase 3 — Generador por capas
Implementa las reglas de `reglas_generador` (Parte 2, sección C) en este orden: semilla → estilo → rachas por acera → variante sin repetir → ancho → altura y áticos → remontes → medianeras visibles → color y desgaste → planta baja → detalles de vida → chaflanes. Los monumentos de la lista no se tocan. Commit.

### Fase 4 — Plantas bajas y escaparates
1. Decide qué bajos son comerciales con la densidad real (regla 8).
2. Crea los **24 modelos de escaparate** (Parte 2, sección B): cada negocio usa su modelo con rótulo, color y género distintos. Los rótulos usan nombres inventados, nunca marcas reales.
3. Los bajos no comerciales siguen el campo `planta_baja` de su estilo (portal monumental, portal con garaje, puerta de casa, verja con jardín…). Commit.

### Fase 5 — Detalles de vida
Ropa tendida, macetas, aires acondicionados, antenas, persianas en distintas posiciones, banderas y pancartas, toldos, grafitis en persianas, andamios y remontes, siguiendo `detalles_prob` de cada barrio. Que solo se carguen de cerca (LOD). Commit.

### Fase 6 — Rendimiento
La fluidez es prioridad absoluta. Instancing, LOD (los detalles desaparecen a distancia y los edificios lejanos usan versiones simples), atlas de texturas y carga por zonas. Compara con los FPS de la Fase 0: no deben bajar de forma apreciable. Si bajan, optimiza antes de dar la fase por terminada. Commit.

### Fase 7 — Comprobación
1. Hazme capturas a pie de calle y aéreas de: el Gòtic, el Raval, la Barceloneta, la Dreta de l'Eixample, Passeig de Gràcia, la Vila de Gràcia, Sant Gervasi–Bonanova, el Carmel, Montbau, el Poblenou, la Vila Olímpica, Diagonal Mar y Ciutat Meridiana.
2. Compara cada una con la chuleta de su barrio (Parte 2, sección D): ¿dominan los estilos y negocios que tocan?
3. Dime qué barrios se parecen demasiado entre sí y corrígelo.
4. Resúmeme en pocas líneas lo que has hecho, lo que falta y cualquier problema. Commit final.

---

## PARTE 2 · DOCUMENTACIÓN

### A. Catálogo de estilos de fachada (22)

Cada estilo tiene 4 variantes, paleta, detalles propios y desgaste base. Los datos completos están en `catalogo_fachadas` del JSON; aquí va el resumen para entenderlos.

#### `desarrollismo` — Bloque de desarrollismo (años 60–70)  (26.1% de los edificios de Barcelona)
- **Época:** 1958–1980 · **Plantas:** 6–12 · **Ancho de fachada:** 12–25 m
- **Dónde:** La mayoría de barrios periféricos: Nou Barris, Sant Martí, Sant Andreu, Horta, Sants, Les Corts; y sustituciones en toda la ciudad.
- **Cómo es:** Ladrillo visto rojizo, terrazas (muchas cerradas con aluminio), ventanas de aluminio, persianas enrollables de PVC, franjas de forjado vistas.
- **Planta baja:** Portal + locales (bar, colmado, peluquería) o garaje.
- **Coronación:** Terrado plano con antenas y casetas.
- **Variantes:** bloque de ladrillo con terrazas; bloque con galerías cerradas de aluminio; torre de pisos de los 70; bloque con soportales
- **Paleta:** #b66a45, #a85d3d, #c27a52, #9e5638, #d0b89a, #c9c2b0 · **Detalles:** aires acondicionados, antenas parabólicas, toldos verdes, terrazas cerradas, tendederos · **Desgaste base:** 0.45

#### `pueblo` — Casa de pueblo antiguo  (9.9% de los edificios de Barcelona)
- **Época:** s. XIX–1940 · **Plantas:** 1–3 · **Ancho de fachada:** 5–9 m
- **Dónde:** Núcleos de los antiguos pueblos: Gràcia, Sants, Sant Andreu, Horta, Sarrià, Sant Martí, les Corts, Poblenou.
- **Cómo es:** Casas bajas entre medianeras, estuco de colores suaves, balcón sencillo en el primer piso, portal de madera.
- **Planta baja:** Puerta de vivienda, taller o tienda de barrio.
- **Coronación:** Cornisa simple o terrado; algunas con tejado inclinado.
- **Variantes:** planta baja y piso; casa de 3 plantas con balcón; casita con patio delantero; casa con taller en la planta baja
- **Paleta:** #efd2a6, #d9937a, #b9cfc0, #e9c98f, #f0e0c8, #c9a27c · **Detalles:** macetas, banderines de fiesta mayor, buzón antiguo, persiana enrollable de madera · **Desgaste base:** 0.4

#### `contemporaneo` — Contemporáneo (siglo XXI)  (8.7% de los edificios de Barcelona)
- **Época:** 2001–hoy · **Plantas:** 4–20 · **Ancho de fachada:** 12–60 m
- **Dónde:** 22@ Poblenou, Diagonal Mar, Glòries, Sagrera, solares sustituidos por toda la ciudad.
- **Cómo es:** Cristal, hormigón visto, paneles metálicos, celosías de lamas, madera; volúmenes limpios.
- **Planta baja:** Vestíbulo de cristal, cadena de comida, supermercado, oficina.
- **Coronación:** Cubierta plana con placas solares o terraza verde.
- **Variantes:** torre de oficinas de cristal; bloque residencial con celosías; edificio de hormigón y madera; hotel de diseño
- **Paleta:** #d9d4c8, #a7a39b, #5f88a8, #e8e4dc, #8d7d6c, #c5cdd3 · **Detalles:** celosías de lamas, placas solares, balcones de vidrio, jardines verticales · **Desgaste base:** 0.1

#### `burgues_60_70` — Bloque burgués de los 60–70  (7.3% de los edificios de Barcelona)
- **Época:** 1955–1985 · **Plantas:** 6–10 · **Ancho de fachada:** 15–30 m
- **Dónde:** Sant Gervasi, Bonanova, Tres Torres, Pedralbes, Galvany, Putxet, Les Corts, alta Diagonal.
- **Cómo es:** Bloques con grandes terrazas corridas y jardineras, travertino o gres, carpinterías de madera oscura o aluminio, portal señorial con portero.
- **Planta baja:** Portal con vestíbulo de mármol, rampa de garaje, alguna clínica u oficina.
- **Coronación:** Ático con terraza y pérgola.
- **Variantes:** bloque de terrazas con jardineras; torre exenta con jardín; bloque de travertino; bloque con persianas de madera oscura
- **Paleta:** #e8e0d0, #d6cbb6, #c4b8a2, #efe9de, #a9a090 · **Detalles:** jardineras con plantas colgantes, toldos de lona, rampa de garaje, garita de portero · **Desgaste base:** 0.25

#### `autarquia` — Posguerra temprana / autarquía  (7.1% de los edificios de Barcelona)
- **Época:** 1941–1957 · **Plantas:** 4–7 · **Ancho de fachada:** 10–20 m
- **Dónde:** Congrés i els Indians (viviendas del Congreso Eucarístico), Guinardó, Sants, Sant Andreu, Eixample tardío.
- **Cómo es:** Estuco liso o ladrillo sobrio, ventanas verticales regulares, poca decoración, aire historicista austero; balcones de hierro simple.
- **Planta baja:** Portal sencillo + comercio de barrio.
- **Coronación:** Cornisa simple, tejado o terrado.
- **Variantes:** bloque de estuco sobrio; manzana cerrada con patio; bloque de ladrillo con zócalo de piedra; conjunto con soportales
- **Paleta:** #d9c6a8, #cbb492, #e0cfb2, #bfa889 · **Detalles:** placa de vivienda protegida, rejas, persianas de madera · **Desgaste base:** 0.45

#### `noucentista` — Noucentista / clasicismo  (6.2% de los edificios de Barcelona)
- **Época:** 1910–1930 · **Plantas:** 4–7 · **Ancho de fachada:** 10–20 m
- **Dónde:** Eixample, Via Laietana, Sant Gervasi, Gràcia, Sants.
- **Cómo es:** Estuco liso en ocre, rosa o crema, frontones sobre ventanas, pilastras, simetría clásica sin exceso de ornamento.
- **Planta baja:** Portal clásico + comercio.
- **Coronación:** Cornisa con balaustrada.
- **Variantes:** fachada simétrica con frontones; fachada con pilastras; edificio de oficinas monumental; casa de renta sobria
- **Paleta:** #e2b7a2, #e6c9a8, #d8b39c, #efd7b8, #cfae96 · **Detalles:** frontón triangular, balaustrada, urnas decorativas · **Desgaste base:** 0.3

#### `olimpico_80_90` — Escuela de Barcelona / olímpico (80–90)  (6.2% de los edificios de Barcelona)
- **Época:** 1981–2000 · **Plantas:** 5–10 · **Ancho de fachada:** 15–40 m
- **Dónde:** Vila Olímpica, frente marítimo, Nova Icària, rehabilitaciones y vivienda pública en toda la ciudad.
- **Cómo es:** Ladrillo cara vista de calidad y hormigón, volúmenes rotundos, persianas mallorquinas o de lamas, galerías, diseño posmoderno.
- **Planta baja:** Porches, locales grandes, accesos a parking.
- **Coronación:** Terrado plano o cubierta metálica.
- **Variantes:** bloque de ladrillo con galerías; manzana olímpica con patio; edificio posmoderno con color; vivienda pública en esquina
- **Paleta:** #c98d6a, #d9a17f, #e6dccb, #b88466, #d7d1c4 · **Detalles:** persianas de lamas, balcones de hierro pintado, portería de vidrio · **Desgaste base:** 0.25

#### `casa_obrera_xix` — Casa de vecinos popular s. XIX  (3.4% de los edificios de Barcelona)
- **Época:** 1800–1900 · **Plantas:** 4–6 · **Ancho de fachada:** 5–9 m
- **Dónde:** Raval, Poble-sec, Sant Pere, Hostafrancs, Sants y partes viejas de Gràcia.
- **Cómo es:** Fachada estrecha de estuco desconchado, balcones estrechos y altos con barandilla sencilla, persianas de librillo de madera.
- **Planta baja:** Portal estrecho + local pequeño (colmado, bar, tienda de móviles, locutorio).
- **Coronación:** Cornisa simple; terrado con tendederos.
- **Variantes:** fachada de 2 balcones; fachada de 3 balcones con cornisa; casa obrera muy estrecha; esquina con balcón corrido
- **Paleta:** #d5b48a, #c99b74, #e0c49c, #b98c6a, #d8a982, #c7b08e · **Detalles:** ropa tendida, macetas, cables por la fachada, pintadas, pancartas vecinales · **Desgaste base:** 0.6

#### `autoconstruccion` — Autoconstrucción en ladera  (3.3% de los edificios de Barcelona)
- **Época:** 1940–1975 · **Plantas:** 1–4 · **Ancho de fachada:** 4–8 m
- **Dónde:** El Carmel, Torre Baró, les Roquetes, Vallbona, la Teixonera, Can Baró.
- **Cómo es:** Casas pequeñas e irregulares construidas por sus vecinos, escalonadas en pendiente, mezcla de ladrillo, bloque y enlucido, ampliaciones visibles.
- **Planta baja:** Puerta de vivienda, garaje improvisado, alguna tienda.
- **Coronación:** Terrado con barandilla de obra, depósitos, plantas añadidas sin acabar.
- **Variantes:** casita escalonada; casa con piso añadido de ladrillo visto; casa de bloque sin enlucir; casa con terraza y escalera exterior
- **Paleta:** #e8dcc6, #c9a27c, #b66a45, #d9d2c4, #e7c9a0 · **Detalles:** escaleras exteriores, depósitos de agua, ladrillo visto sin acabar, macetas, perros en terraza · **Desgaste base:** 0.6

#### `modernista` — Modernista  (3.1% de los edificios de Barcelona)
- **Época:** 1888–1915 · **Plantas:** 4–7 · **Ancho de fachada:** 12–22 m
- **Dónde:** Eixample (Quadrat d'Or), Gràcia, Sant Gervasi, Sant Pau.
- **Cómo es:** Curvas, cerámica, trencadís, hierro forjado orgánico, vitrales, piedra tallada con motivos naturales.
- **Planta baja:** Portal con mosaico y vitrales; comercios con marcos de madera tallada.
- **Coronación:** Coronamiento ondulado, torretas, pináculos.
- **Variantes:** fachada ondulada con trencadís; tribunas de hierro y vidrio; fachada de ladrillo y cerámica; coronamiento con torreta
- **Paleta:** #d7c2ad, #c9b49c, #bfa98f, #e0cdb6, #b8c4b0 · **Detalles:** trencadís, vitrales de colores, barandillas orgánicas, mosaico en cornisa · **Desgaste base:** 0.3

#### `eixample_ornamentado` — Eixample ecléctico ornamentado  (2.5% de los edificios de Barcelona)
- **Época:** 1890–1915 · **Plantas:** 5–7 · **Ancho de fachada:** 14–22 m
- **Dónde:** Eixample (Rambla de Catalunya, Passeig de Gràcia, calles centrales), Sant Gervasi–Galvany.
- **Cómo es:** Planta noble muy decorada, tribunas, esgrafiados, relieves, balcones con hierro rico, fachada de piedra o estuco imitando piedra.
- **Planta baja:** Portal monumental + locales de comercio de calidad.
- **Coronación:** Cornisa marcada, a veces ático retranqueado y frontón central.
- **Variantes:** fachada con tribuna central; planta noble con balcón corrido; chaflán con torreta; fachada con esgrafiados
- **Paleta:** #e1c7a6, #d6bfa0, #e8d9c0, #c9b08c · **Detalles:** tribuna, esgrafiados, relieves florales, ático retranqueado · **Desgaste base:** 0.3

#### `torre` — Torre / villa con jardín  (2.2% de los edificios de Barcelona)
- **Época:** 1880–1950 · **Plantas:** 2–3 · **Ancho de fachada:** 10–25 m
- **Dónde:** Sant Gervasi, Bonanova, Tres Torres, Pedralbes, Sarrià, Vallvidrera, Putxet, Horta.
- **Cómo es:** Casa aislada con jardín, verja de hierro, tejados inclinados, torreones, galerías; modernista, novecentista o regionalista.
- **Planta baja:** Jardín y verja; no hay comercio.
- **Coronación:** Tejado de teja con torreón o mirador.
- **Variantes:** torre modernista; villa novecentista; casa señorial con torreón; chalet regionalista
- **Paleta:** #efe2c8, #e7d3b0, #d9c2a0, #f2e8d6, #c9b89a · **Detalles:** palmera, verja de forja, buganvilla, garaje · **Desgaste base:** 0.3

#### `racionalista_deco` — Art déco / racionalismo GATCPAC  (2.2% de los edificios de Barcelona)
- **Época:** 1928–1940 · **Plantas:** 4–7 · **Ancho de fachada:** 10–20 m
- **Dónde:** Repartido por Eixample, Gràcia, Sant Gervasi, Sant Andreu (Casa Bloc).
- **Cómo es:** Volúmenes limpios, esquinas redondeadas, ventanas horizontales corridas, balcones de barandilla tubular, estuco blanco o crema; el déco con líneas verticales y relieves geométricos.
- **Planta baja:** Portal con marquesina geométrica, cine o comercio.
- **Coronación:** Cubierta plana con terraza; a veces torreón de esquina redondeado.
- **Variantes:** racionalista blanco con ventanas corridas; déco con líneas verticales; esquina redondeada; bloque obrero tipo Casa Bloc
- **Paleta:** #f1ede4, #e6dccb, #d9d2c4, #efe3cc · **Detalles:** barandilla tubular, letras déco en el portal, ojos de buey · **Desgaste base:** 0.35

#### `vivienda_social_actual` — Vivienda social contemporánea  (2.1% de los edificios de Barcelona)
- **Época:** 2000–hoy · **Plantas:** 4–10 · **Ancho de fachada:** 15–40 m
- **Dónde:** Remodelaciones de barrio (Trinitat Nova, Bon Pastor, Besòs, Can Batlló, Marina), solares públicos.
- **Cómo es:** Bloques sencillos con color en paneles o persianas, celosías metálicas, galerías, acabado industrializado.
- **Planta baja:** Equipamiento de barrio, local social, comercio pequeño.
- **Coronación:** Cubierta plana con instalaciones.
- **Variantes:** bloque con persianas de colores; bloque con celosía metálica; bloque de madera industrializada; bloque con galería abierta
- **Paleta:** #e6e2d8, #7fb2c9, #e8b84a, #d2694c, #9dc7a4 · **Detalles:** persianas de colores, placas solares, bicis en balcón · **Desgaste base:** 0.15

#### `eixample_temprano` — Eixample academicista (primera etapa)  (2.1% de los edificios de Barcelona)
- **Época:** 1860–1890 · **Plantas:** 4–6 · **Ancho de fachada:** 12–20 m
- **Dónde:** Eixample (sobre todo Dreta, Esquerra, Sant Antoni, Fort Pienc).
- **Cómo es:** Fachada sobria y ordenada, balcones de hierro idénticos repetidos en rejilla, molduras poco marcadas, planta baja de piedra almohadillada.
- **Planta baja:** Portal con portería + dos locales comerciales.
- **Coronación:** Cornisa con dentículos; terrado transitable.
- **Variantes:** fachada de 4 balcones simétrica; fachada de 5 balcones; chaflán sobrio; fachada con balcón corrido en planta principal
- **Paleta:** #e3cfa3, #d9c095, #e8d6b3, #cdb38a · **Detalles:** persianas de librillo, portal de madera con picaporte, farola en esquina · **Desgaste base:** 0.35

#### `fabrica` — Fábrica / nave industrial de ladrillo  (1.7% de los edificios de Barcelona)
- **Época:** 1850–1960 · **Plantas:** 1–5 · **Ancho de fachada:** 20–60 m
- **Dónde:** Poblenou (22@), Sant Martí, Sants (Vapor Vell), Sant Andreu, la Sagrera, Zona Franca.
- **Cómo es:** Ladrillo macizo, ventanales de hierro con cuarterones, cubiertas en diente de sierra, chimenea alta.
- **Planta baja:** Portalón de carga, taller, almacén o loft rehabilitado.
- **Coronación:** Diente de sierra o cornisa de ladrillo; chimenea.
- **Variantes:** nave en diente de sierra; fábrica de varias plantas con chimenea; almacén con portalón; loft rehabilitado
- **Paleta:** #a8533a, #954830, #b5654a, #8a4a35, #c27c5c · **Detalles:** chimenea, grafitis y murales, rótulo pintado de la fábrica, persiana metálica grande · **Desgaste base:** 0.6

#### `poligono` — Polígono de vivienda masiva  (1.7% de los edificios de Barcelona)
- **Época:** 1955–1980 · **Plantas:** 5–14 · **Ancho de fachada:** 20–60 m
- **Dónde:** Montbau, Canyelles, la Guineueta, Trinitat Nova, Ciutat Meridiana, Sudoeste del Besòs, Verdun, la Verneda.
- **Cómo es:** Bloques lineales o torres aisladas entre espacios abiertos, repetición total de ventanas, hormigón y ladrillo, galerías de acceso.
- **Planta baja:** Pilotis, portales, algún local en plantas bajas de plaza.
- **Coronación:** Terrado plano con depósitos de agua.
- **Variantes:** bloque lineal largo; torre aislada; bloque en H; bloque con galerías exteriores
- **Paleta:** #c9b9a2, #b5a48c, #d6cdbd, #a99a86, #c27a52 · **Detalles:** ropa tendida, parabólicas, aires acondicionados, grafitis en planta baja · **Desgaste base:** 0.55

#### `neoclasico` — Neoclásico / isabelino  (1.3% de los edificios de Barcelona)
- **Época:** 1830–1870 · **Plantas:** 4–6 · **Ancho de fachada:** 10–20 m
- **Dónde:** Ciutat Vella (Plaça Reial, Porxos d'en Xifré, calle Ferran, Rambla), primeros ensanches de pueblos.
- **Cómo es:** Fachada ordenada y simétrica, balcones alineados con barandilla de hierro fundido, pilastras, molduras clásicas, a veces pórticos en planta baja.
- **Planta baja:** Soportales con arcos o grandes vanos para comercio.
- **Coronación:** Cornisa clásica marcada, a veces balaustrada.
- **Variantes:** edificio porticado; fachada simétrica con pilastras; casa con relieves alegóricos; edificio con balcón corrido en planta principal
- **Paleta:** #e4cfae, #d8c09a, #ecdcbf, #cdb390 · **Detalles:** relieves de terracota, farolas isabelinas, barandilla de hierro fundido · **Desgaste base:** 0.4

#### `barroco` — Casa gremial barroca / s. XVII–XVIII  (0.9% de los edificios de Barcelona)
- **Época:** 1600–1790 · **Plantas:** 3–5 · **Ancho de fachada:** 5–9 m
- **Dónde:** Born, Ribera, Gòtic y parte del Raval.
- **Cómo es:** Fachada estrecha de estuco o piedra, balcones de forja pequeños, a veces esgrafiados geométricos o figurativos en tonos ocre.
- **Planta baja:** Antiguo obrador artesano: puerta ancha de madera con dintel de piedra; hoy taller, tienda pequeña o bar.
- **Coronación:** Cornisa sencilla; a veces "golfes" (buhardilla con ventanitas).
- **Variantes:** casa gremial con esgrafiados; casa de 2 balcones de forja; casa con golfes; esquina con hornacina de santo
- **Paleta:** #d4b48c, #c9a27a, #dcc09a, #bf9670 · **Detalles:** hornacina con santo, esgrafiados, macetas, ropa tendida · **Desgaste base:** 0.5

#### `quart_de_casa` — Quart de casa (Barceloneta)  (0.7% de los edificios de Barcelona)
- **Época:** 1753–1930 (con remontes posteriores) · **Plantas:** 3–5 · **Ancho de fachada:** 4–5 m
- **Dónde:** Barceloneta.
- **Cómo es:** Fachadas muy estrechas (unos 4,5 m) de un solo balcón por planta, colores vivos, plantas añadidas con el tiempo de aspecto distinto.
- **Planta baja:** Puerta de vivienda o bar de pescado, bodega, tienda pequeña.
- **Coronación:** Remonte moderno o terrado con tendedero.
- **Variantes:** quart de casa original; quart de casa con remonte moderno; dos quarts unidos; esquina con bar
- **Paleta:** #e8b84a, #d2694c, #7fb2c9, #e9d9b7, #9dc7a4, #e39a6b · **Detalles:** ropa tendida, toldos de rayas, banderas, bicis en el balcón, plantas · **Desgaste base:** 0.45

#### `gotico` — Gótico civil / medieval  (0.7% de los edificios de Barcelona)
- **Época:** s. XIII–XVI · **Plantas:** 2–4 · **Ancho de fachada:** 6–20 m
- **Dónde:** Barri Gòtic, Sant Pere–Santa Caterina–la Ribera (calles como Montcada).
- **Cómo es:** Muros de sillería de piedra, pocas ventanas, pequeñas e irregulares; ventanas geminadas con columnita; portalón con arco de medio punto o apuntado que da a un patio.
- **Planta baja:** Portalón de madera con arco de piedra; si es comercial, galería de arte, tienda de artesanía o bar en antiguo almacén.
- **Coronación:** Alero simple o galería de arcos en la última planta.
- **Variantes:** palacio con patio y escalera exterior; casa estrecha de piedra con ventana geminada; casa con galería de arcos en el último piso; muro ciego con portalón y escudo
- **Paleta:** #b7a58a, #a89377, #c4b294, #9e8a6e, #bfae90 · **Detalles:** escudo heráldico, farol de forja, gárgola, reja en ventanas bajas · **Desgaste base:** 0.55

#### `casas_baratas` — Casas baratas (hileras obreras)  (0.7% de los edificios de Barcelona)
- **Época:** 1929–1950 · **Plantas:** 1–2 · **Ancho de fachada:** 4–6 m
- **Dónde:** Bon Pastor, Baró de Viver, la Marina (Eduard Aunós), Can Peguera.
- **Cómo es:** Hileras de casitas de una planta iguales, muy humildes, con puerta y ventana, encaladas o de colores.
- **Planta baja:** Vivienda; ningún comercio salvo algún bar de esquina.
- **Coronación:** Tejado bajo a una o dos aguas.
- **Variantes:** casita original encalada; casita reformada con piso añadido; casita con patio; esquina con bar
- **Paleta:** #f2ece0, #e8d9bf, #d9c7a8, #c9d6c8 · **Detalles:** sillas en la acera, macetas, rejas, antena · **Desgaste base:** 0.55

### B. Modelos de escaparate (24)

| Modelo | Cómo es | Negocios que lo usan |
|---|---|---|
| `bar` | Barra visible, terraza con mesas y sillas, toldo, rótulo de neón o de chapa, máquina de tabaco. | Bar / cafetería |
| `restaurante` | Escaparate con carta, cortinas o vinilo, rótulo elegante, terraza opcional. | Restaurante |
| `comida_rapida` | Rótulo luminoso de colores, escaparate con fotos de comida, mostrador. | Comida rápida / take away, Heladería / chocolatería |
| `ocio_nocturno` | Fachada cerrada oscura, puerta con portero, neón, persiana metálica de día. | Bar musical / discoteca |
| `hotel` | Portal con marquesina, letras doradas, banderas. | Hotel / hostal |
| `super_autoservicio` | Escaparate con ofertas, cajas de fruta en la acera (autoservicio de barrio), rótulo de cadena o genérico. | Supermercado / autoservicio |
| `alimentacion_tradicional` | Mostrador visible, género expuesto, rótulo pintado, toldo. | Panadería / pastelería, Frutería, Carnicería / charcutería, Pescadería, Bodega / bebidas, Comida preparada |
| `moda` | Escaparate amplio con maniquíes, iluminación cuidada, rótulo de marca inventada. | Tienda de ropa, Zapatería / piel, Mercería, Perfumería / droguería |
| `joyeria_optica` | Escaparate pequeño muy iluminado, rejilla de seguridad, rótulo dorado. | Joyería / relojería, Óptica |
| `farmacia` | Cruz verde luminosa, escaparate con productos, rótulo "Farmàcia". | Farmacia |
| `belleza` | Escaparate con sillones, vinilos, rótulo moderno. | Peluquería / barbería, Centro de estética / uñas |
| `salud` | Vinilo traslúcido, placa en el portal, cruz o logo médico. | Clínica / centro médico, Herbolario / dietética, Veterinario / mascotas |
| `gimnasio` | Cristal con vinilo, máquinas visibles. | Gimnasio |
| `hogar` | Escaparate con muebles u objetos, rótulo clásico. | Muebles, Decoración / hogar, Ferretería, Electrodomésticos |
| `floristeria` | Plantas y cubos de flores en la acera. | Floristería |
| `cultura` | Escaparate con libros, discos u objetos, carteles. | Librería / quiosco, Juguetes / deportes, Tienda de música, Fotografía, Antigüedades / coleccionismo, Cultura / ocio (teatro, sala...) |
| `bazar_moviles` | Rótulo luminoso de colores, fundas y accesorios en el escaparate, letrero "reparación móviles". | Informática / móviles, Bazar, Locutorio |
| `souvenirs` | Expositores en la acera (camisetas, imanes, abanicos), rótulo grande. | Souvenirs |
| `estanco` | Rótulo de expendeduría (marrón y amarillo), máquina exterior. | Estanco |
| `oficina` | Cristal con vinilo, placa, mostrador; poco escaparate. | Banco / seguros, Inmobiliaria, Agencia de viajes, Oficina / despacho, Academia / escuela, Asociación / entidad, Lugar de culto, Imprenta / copistería |
| `servicio_barrio` | Escaparate pequeño con carteles de precios. | Tintorería / lavandería, Arreglos ropa / zapatos |
| `taller_garaje` | Persiana metálica grande, rótulo pintado, manchas de aceite, coche o moto en la puerta. | Taller / reparaciones, Concesionario / motos, Parking / garaje, Gasolinera |
| `almacen_industrial` | Portalón metálico, rótulo de empresa, sin escaparate. | Almacén, Taller industrial / obras |
| `local_vacio` | Persiana bajada con grafitis o cartel de "Es lloga / Se alquila", cristales empapelados. | Local vacío (se alquila / vende) |

### C. Reglas del generador

- **0_semilla:** Semilla fija por edificio (hash de su id o coordenadas). Mismo edificio = mismo resultado siempre.
- **1_estilo:** Busca la sección censal que contiene el edificio. Elige el estilo al azar ponderado por 0,7 × fachadas_pct de la sección + 0,3 × fachadas_pct del barrio. Sin sección: solo barrio.
- **2_rachas:** Recorre cada acera en orden. Con probabilidad 0,5 (0,65 en el Eixample, 0,8 en polígonos y casas baratas) el edificio repite el ESTILO del vecino anterior (no la variante). Así salen rachas de 2–5 edificios de la misma época.
- **3_variante:** Una de las 4 variantes del estilo. Nunca la misma variante + color en dos edificios contiguos.
- **4_ancho:** Ancho de fachada dentro de ancho_fachada_m del estilo (si la geometría del solar lo permite). Las fachadas estrechas (quart de casa, casa obrera) dan ritmo; no las ensanches.
- **5_altura:** Plantas según plantas_pct del barrio, recortadas al rango "plantas" del estilo. +1/+2 en avenidas y calles anchas. Ático retranqueado (30%) en eixample_ornamentado, noucentista, autarquia, desarrollismo y burgues_60_70. Remontes (plantas añadidas con otro acabado) según detalles_prob.remontes_plantas_anadidas.
- **6_medianeras:** Si un edificio supera en 2+ plantas a su vecino, muestra la medianera con textura propia: ladrillo, anuncio antiguo pintado, mural, grafiti o ventanas abiertas después. Es muy barcelonés.
- **7_color_desgaste:** Color de la paleta del estilo con variación de tono ±5% y luminosidad ±8%. Desgaste = desgaste_base del estilo + detalles_prob.desgaste_extra del barrio (manchas, desconchados, suciedad bajo balcones).
- **8_planta_baja:** ¿Comercial? Celda más cercana de rejilla_comercial convertida a locales/ha (n / 2,25): ≥15 casi todos; 5–15 mezcla (prioriza calles principales y esquinas); <5 casi ninguno. Si es comercial, negocio al azar ponderado por cuota_pct de barrios[].comercio.negocios y fachada de tienda según escaparates. Si no: lo que diga planta_baja del estilo.
- **9_detalles:** Por balcón/ventana, tira los dados con detalles_prob del barrio y añade los detalles propios del estilo.
- **10_esquinas:** Chaflanes del Eixample, Sant Martí y Poblenou: variante de chaflán, +1 planta, más ornamento y casi siempre negocio.
- **11_monumentos:** No generar: Sagrada Família, Casa Batlló, La Pedrera, Casa de les Punxes, Hospital de Sant Pau, Palau de la Música, Catedral, Santa Maria del Mar, Mercat de Sant Antoni, Boqueria, Arc de Triomf, Torre Glòries, Hotel W, Torres Mapfre y Hotel Arts, Colón, MNAC, Camp Nou, Tibidabo. Respeta los modelos que ya existan.

### D. Chuleta por barrio

Estilos dominantes (% de edificios), altura media, densidad comercial (locales activos por hectárea) y los negocios que más destacan respecto a la media de Barcelona (× veces). Úsala para comprobar que cada barrio se ve como debe.

| Barrio | Estilos dominantes | Plantas | Locales/ha | % vacíos | Negocios característicos |
|---|---|---|---|---|---|
| el Raval | Casa de vecinos popular s. XIX 46.5%, Casa gremial barroca 9.4%, Neoclásico 9.4% | 5.5 | 19.13 | 13.7 | Tienda de música ×3.92, Souvenirs ×3.83, Informática / móviles ×3.07 |
| el Barri Gòtic | Gótico civil 21.3%, Casa de vecinos popular s. XIX 19.3%, Casa gremial barroca 15.2% | 5.6 | 18.21 | 21.6 | Souvenirs ×10.65, Heladería / chocolatería ×3.92, Joyería / relojería ×3.58 |
| la Barceloneta | Quart de casa 61.2%, Bloque de desarrollismo 13.0%, Posguerra temprana 8.0% | 4.3 | 4.54 | 11.1 | Restaurante ×3.19, Juguetes / deportes ×2.11, Pescadería ×1.86 |
| Sant Pere, Santa Caterina i la Ribera | Casa de vecinos popular s. XIX 31.8%, Casa gremial barroca 18.0%, Gótico civil 12.0% | 5.6 | 13.57 | 16.7 | Souvenirs ×3.9, Bar musical / discoteca ×3.41, Heladería / chocolatería ×3.28 |
| el Fort Pienc | Bloque de desarrollismo 25.1%, Eixample ecléctico ornamentado 11.2%, Contemporáneo 10.9% | 7.7 | 11.47 | 10.6 | Antigüedades / coleccionismo ×3.73, Concesionario / motos ×2.7, Muebles ×2.21 |
| la Sagrada Família | Bloque de desarrollismo 23.4%, Eixample ecléctico ornamentado 14.5%, Modernista 12.1% | 6.1 | 19.13 | 8.3 | Souvenirs ×5.57, Agencia de viajes ×1.75, Heladería / chocolatería ×1.71 |
| la Dreta de l'Eixample | Eixample academicista 24.4%, Eixample ecléctico ornamentado 20.7%, Bloque de desarrollismo 14.6% | 6.9 | 16.58 | 10.4 | Antigüedades / coleccionismo ×7.38, Hotel / hostal ×2.79, Agencia de viajes ×2.4 |
| l'Antiga Esquerra de l'Eixample | Eixample academicista 20.2%, Eixample ecléctico ornamentado 19.9%, Bloque de desarrollismo 18.1% | 7.2 | 20.38 | 9.2 | Parking / garaje ×2.46, Bar musical / discoteca ×2.03, Restaurante ×1.99 |
| la Nova Esquerra de l'Eixample | Bloque de desarrollismo 28.0%, Eixample ecléctico ornamentado 13.5%, Modernista 10.0% | 7.6 | 15.03 | 10.8 | Concesionario / motos ×2.21, Fotografía ×2.18, Muebles ×1.89 |
| Sant Antoni | Eixample academicista 19.8%, Bloque de desarrollismo 19.8%, Eixample ecléctico ornamentado 19.2% | 7.4 | 22.81 | 8.2 | Tienda de música ×2.79, Bodega / bebidas ×2.24, Parking / garaje ×2.15 |
| el Poble Sec | Casa de pueblo antiguo 22.6%, Bloque de desarrollismo 22.5%, Casa de vecinos popular s. XIX 15.4% | 5.5 | 2.4 | 13.8 | Bar musical / discoteca ×3.37, Cultura / ocio (teatro, sala...) ×3.14, Hotel / hostal ×2.03 |
| la Marina del Prat Vermell | Bloque de desarrollismo 33.0%, Escuela de Barcelona 21.2%, Contemporáneo 14.3% | 2.1 | 0.13 | 8.2 | Concesionario / motos ×8.57, Taller industrial / obras ×5.49, Taller / reparaciones ×4.22 |
| la Marina de Port | Bloque de desarrollismo 36.0%, Fábrica 15.4%, Vivienda social contemporánea 13.9% | 5.8 | 4.23 | 9.0 | Lugar de culto ×2.61, Pescadería ×1.9, Carnicería / charcutería ×1.85 |
| la Font de la Guatlla | Bloque de desarrollismo 33.0%, Casa de pueblo antiguo 16.7%, Contemporáneo 11.2% | 4.8 | 6.63 | 12.4 | Veterinario / mascotas ×3.63, Asociación / entidad ×2.16, Panadería / pastelería ×2.04 |
| Hostafrancs | Casa de pueblo antiguo 30.8%, Bloque de desarrollismo 24.9%, Noucentista 9.2% | 5.2 | 18.44 | 10.3 | Carnicería / charcutería ×1.71 |
| la Bordeta | Bloque de desarrollismo 40.0%, Casa de pueblo antiguo 18.0%, Contemporáneo 10.2% | 4.7 | 7.29 | 12.9 | Lugar de culto ×2.5, Taller / reparaciones ×1.72, Veterinario / mascotas ×1.71 |
| Sants-Badal | Bloque de desarrollismo 39.5%, Casa de pueblo antiguo 15.6%, Contemporáneo 10.7% | 4.7 | 16.11 | 13.5 | Decoración / hogar ×1.9, Bazar ×1.9, Almacén ×1.73 |
| Sants | Casa de pueblo antiguo 28.5%, Bloque de desarrollismo 27.1%, Noucentista 9.4% | 4.4 | 14.12 | 11.7 | Locutorio ×1.89 |
| les Corts | Bloque de desarrollismo 38.9%, Bloque burgués de los 60–70 13.2%, Casa de pueblo antiguo 10.1% | 5.7 | 13.42 | 9.5 | Centro de estética / uñas ×1.89, Banco / seguros ×1.83, Clínica / centro médico ×1.61 |
| la Maternitat i Sant Ramon | Bloque burgués de los 60–70 48.2%, Torre 13.0%, Contemporáneo 8.1% | 5.6 | 3.51 | 11.7 | Agencia de viajes ×2.33, Gimnasio ×2.32, Comida preparada ×2.1 |
| Pedralbes | Bloque burgués de los 60–70 43.1%, Contemporáneo 14.1%, Torre 10.3% | 4.4 | 0.96 | 5.5 | Academia / escuela ×4.71, Lugar de culto ×3.78, Oficina / despacho ×2.13 |
| Vallvidrera, el Tibidabo i les Planes | Bloque burgués de los 60–70 35.7%, Contemporáneo 17.7%, Torre 12.7% | 2.0 | 0.06 | 9.2 | Lugar de culto ×13.51, Cultura / ocio (teatro, sala...) ×5.45, Asociación / entidad ×3.84 |
| Sarrià | Bloque de desarrollismo 27.2%, Casa de pueblo antiguo 18.0%, Contemporáneo 11.8% | 3.2 | 3.04 | 8.3 | Mercería ×3.2, Academia / escuela ×2.07, Inmobiliaria ×1.98 |
| les Tres Torres | Bloque burgués de los 60–70 46.6%, Torre 12.5%, Contemporáneo 9.7% | 5.2 | 5.77 | 3.8 | Clínica / centro médico ×5.87, Oficina / despacho ×3.17, Floristería ×2.54 |
| Sant Gervasi- la Bonanova | Bloque burgués de los 60–70 36.4%, Torre 18.9%, Posguerra temprana 9.9% | 4.3 | 4.65 | 8.9 | Clínica / centro médico ×2.6, Mercería ×2.52, Gimnasio ×2.1 |
| Sant Gervasi- Galvany | Bloque burgués de los 60–70 45.9%, Torre 17.7%, Posguerra temprana 8.9% | 6.2 | 15.41 | 8.9 | Mercería ×2.67, Muebles ×2.53, Bar musical / discoteca ×2.32 |
| el Putxet i el Farró | Bloque burgués de los 60–70 41.5%, Torre 17.3%, Contemporáneo 8.1% | 4.6 | 11.42 | 11.8 | Mercería ×3.27, Fotografía ×2.45, Oficina / despacho ×2.09 |
| Vallcarca i els Penitents | Bloque burgués de los 60–70 42.8%, Torre 14.3%, Contemporáneo 10.1% | 3.0 | 2.81 | 9.5 | Academia / escuela ×2.33, Farmacia ×2.31, Parking / garaje ×2.14 |
| el Coll | Autoconstrucción en ladera 35.6%, Bloque de desarrollismo 30.0%, Casa de pueblo antiguo 13.7% | 2.9 | 2.77 | 10.9 | Supermercado / autoservicio ×2.78, Taller industrial / obras ×2.28, Almacén ×1.74 |
| la Salut | Bloque de desarrollismo 48.8%, Casa de pueblo antiguo 11.5%, Posguerra temprana 10.8% | 4.3 | 5.43 | 12.4 | Souvenirs ×13.8, Lugar de culto ×2.98, Carnicería / charcutería ×2.1 |
| la Vila de Gràcia | Casa de pueblo antiguo 35.7%, Bloque de desarrollismo 23.2%, Noucentista 9.9% | 4.2 | 23.41 | 10.3 | Tienda de música ×3.47, Bodega / bebidas ×1.84, Fotografía ×1.82 |
| el Camp d'en Grassot i Gràcia Nova | Bloque de desarrollismo 38.5%, Casa de pueblo antiguo 16.0%, Contemporáneo 10.3% | 6.0 | 19.83 | 10.2 | Pescadería ×3.21, Herbolario / dietética ×2.31, Librería / quiosco ×2.12 |
| el Baix Guinardó | Bloque de desarrollismo 50.8%, Posguerra temprana 12.7%, Casa de pueblo antiguo 9.4% | 5.6 | 10.85 | 14.3 | Heladería / chocolatería ×2.6, Taller / reparaciones ×2.59, Imprenta / copistería ×1.71 |
| Can Baró | Autoconstrucción en ladera 39.0%, Bloque de desarrollismo 25.1%, Casa de pueblo antiguo 18.3% | 3.3 | 3.44 | 15.9 | Almacén ×2.68, Taller / reparaciones ×2.47, Farmacia ×2.29 |
| el Guinardó | Bloque de desarrollismo 48.9%, Posguerra temprana 15.3%, Contemporáneo 9.3% | 4.2 | 7.33 | 17.3 | Almacén ×1.98, Fotografía ×1.93, Taller / reparaciones ×1.72 |
| la Font d'en Fargues | Bloque burgués de los 60–70 37.8%, Torre 18.4%, Posguerra temprana 9.0% | 2.3 | 1.37 | 23.1 | Academia / escuela ×4.27, Asociación / entidad ×2.91, Farmacia ×2.56 |
| el Carmel | Autoconstrucción en ladera 42.0%, Bloque de desarrollismo 38.0%, Casa de pueblo antiguo 7.0% | 3.5 | 6.88 | 13.4 | Carnicería / charcutería ×3.25, Pescadería ×2.06, Frutería ×1.97 |
| la Teixonera | Autoconstrucción en ladera 39.0%, Bloque de desarrollismo 38.2%, Escuela de Barcelona 8.9% | 3.4 | 4.89 | 21.4 | Carnicería / charcutería ×3.78, Frutería ×2.34, Farmacia ×2.0 |
| Sant Genís dels Agudells | Autoconstrucción en ladera 37.0%, Bloque de desarrollismo 26.2%, Contemporáneo 14.1% | 2.8 | 0.59 | 4.8 | Farmacia ×2.86, Academia / escuela ×2.38, Asociación / entidad ×2.32 |
| Montbau | Polígono de vivienda masiva 63.2%, Bloque de desarrollismo 17.4%, Posguerra temprana 6.9% | 3.4 | 0.51 | 7.1 | Asociación / entidad ×3.04, Academia / escuela ×2.79, Clínica / centro médico ×2.48 |
| la Vall d'Hebron | Bloque de desarrollismo 54.9%, Contemporáneo 18.4%, Escuela de Barcelona 12.1% | 9.6 | 1.46 | 11.4 | Gimnasio ×6.77, Oficina / despacho ×3.23, Academia / escuela ×2.29 |
| la Clota | Casa de pueblo antiguo 28.7%, Posguerra temprana 19.4%, Bloque de desarrollismo 19.2% | 1.6 | 0.73 | 7.1 | Taller industrial / obras ×7.16 |
| Horta | Bloque de desarrollismo 41.2%, Casa de pueblo antiguo 17.3%, Posguerra temprana 11.1% | 3.1 | 2.57 | 9.8 | Herbolario / dietética ×3.04, Pescadería ×2.08, Muebles ×2.0 |
| Vilapicina i la Torre Llobeta | Bloque de desarrollismo 52.8%, Posguerra temprana 11.7%, Casa de pueblo antiguo 9.0% | 4.4 | 14.94 | 11.0 | Locutorio ×2.91, Taller / reparaciones ×2.31, Concesionario / motos ×2.04 |
| Porta | Bloque de desarrollismo 61.3%, Contemporáneo 13.0%, Posguerra temprana 8.8% | 5.2 | 8.9 | 11.7 | Comida preparada ×1.89, Taller / reparaciones ×1.84, Almacén ×1.77 |
| el Turó de la Peira | Bloque de desarrollismo 49.8%, Posguerra temprana 25.4%, Contemporáneo 8.5% | 6.1 | 10.81 | 7.9 | Locutorio ×6.63, Pescadería ×5.05, Carnicería / charcutería ×4.17 |
| Can Peguera | Casas baratas 76.2%, Casa de pueblo antiguo 18.9%, Bloque de desarrollismo 2.3% | 1.1 | 1.43 | 15.0 | — |
| la Guineueta | Polígono de vivienda masiva 64.7%, Bloque de desarrollismo 21.8%, Contemporáneo 7.6% | 6.5 | 5.08 | 8.3 | Lugar de culto ×2.52, Veterinario / mascotas ×2.41, Pescadería ×2.06 |
| Canyelles | Polígono de vivienda masiva 66.8%, Bloque de desarrollismo 23.5%, Escuela de Barcelona 3.9% | 9.6 | 1.42 | 3.4 | Carnicería / charcutería ×4.7, Frutería ×2.65, Asociación / entidad ×2.52 |
| les Roquetes | Bloque de desarrollismo 44.1%, Autoconstrucción en ladera 42.5%, Escuela de Barcelona 4.9% | 3.5 | 4.6 | 10.3 | Pescadería ×4.24, Carnicería / charcutería ×4.06, Frutería ×3.35 |
| Verdun | Polígono de vivienda masiva 56.7%, Bloque de desarrollismo 16.3%, Contemporáneo 7.8% | 4.5 | 16.74 | 12.6 | Ferretería ×2.54, Bazar ×2.49, Óptica ×2.19 |
| la Prosperitat | Bloque de desarrollismo 71.7%, Posguerra temprana 7.5%, Escuela de Barcelona 6.8% | 4.8 | 12.45 | 15.3 | Electrodomésticos ×2.35, Taller / reparaciones ×1.84, Comida preparada ×1.84 |
| la Trinitat Nova | Polígono de vivienda masiva 53.6%, Vivienda social contemporánea 11.4%, Bloque de desarrollismo 11.3% | 5.0 | 1.39 | 7.0 | Carnicería / charcutería ×5.19, Supermercado / autoservicio ×2.07, Academia / escuela ×1.82 |
| Torre Baró | Autoconstrucción en ladera 45.8%, Bloque de desarrollismo 38.3%, Vivienda social contemporánea 4.2% | 1.6 | 0.14 | 0.0 | — |
| Ciutat Meridiana | Polígono de vivienda masiva 72.0%, Bloque de desarrollismo 24.4%, Escuela de Barcelona 1.9% | 6.3 | 3.66 | 6.1 | Supermercado / autoservicio ×3.29, Banco / seguros ×2.99, Frutería ×2.51 |
| Vallbona | Autoconstrucción en ladera 44.8%, Bloque de desarrollismo 34.4%, Escuela de Barcelona 8.4% | 1.6 | 0.36 | 8.3 | — |
| la Trinitat Vella | Bloque de desarrollismo 57.7%, Posguerra temprana 12.2%, Vivienda social contemporánea 7.3% | 3.7 | 2.25 | 11.7 | Asociación / entidad ×2.83, Farmacia ×2.04, Supermercado / autoservicio ×1.98 |
| Baró de Viver | Escuela de Barcelona 45.8%, Bloque de desarrollismo 33.8%, Contemporáneo 13.8% | 5.6 | 1.7 | 11.4 | Asociación / entidad ×8.85, Bar / cafetería ×2.13 |
| el Bon Pastor | Bloque de desarrollismo 55.4%, Vivienda social contemporánea 11.4%, Contemporáneo 9.7% | 2.2 | 4.05 | 6.8 | Gasolinera ×9.23, Concesionario / motos ×5.37, Taller industrial / obras ×4.39 |
| Sant Andreu | Bloque de desarrollismo 30.4%, Casa de pueblo antiguo 24.7%, Contemporáneo 12.6% | 3.9 | 9.14 | 11.9 | Imprenta / copistería ×1.71, Fotografía ×1.62, Óptica ×1.54 |
| la Sagrera | Bloque de desarrollismo 37.0%, Fábrica 21.2%, Contemporáneo 16.5% | 5.9 | 6.74 | 11.3 | Comida preparada ×2.13, Carnicería / charcutería ×1.98, Decoración / hogar ×1.78 |
| el Congrés i els Indians | Bloque de desarrollismo 38.2%, Posguerra temprana 34.4%, Contemporáneo 7.2% | 4.3 | 11.12 | 15.3 | Taller / reparaciones ×2.17, Inmobiliaria ×1.93, Academia / escuela ×1.69 |
| Navas | Bloque de desarrollismo 33.3%, Posguerra temprana 22.7%, Fábrica 14.5% | 5.4 | 12.81 | 12.6 | Taller / reparaciones ×2.19, Bazar ×2.18, Concesionario / motos ×2.08 |
| el Camp de l'Arpa del Clot | Bloque de desarrollismo 33.5%, Casa de pueblo antiguo 25.0%, Contemporáneo 9.0% | 4.8 | 15.76 | 12.3 | Herbolario / dietética ×1.83, Ferretería ×1.73, Perfumería / droguería ×1.61 |
| el Clot | Bloque de desarrollismo 27.0%, Casa de pueblo antiguo 25.7%, Contemporáneo 12.7% | 5.5 | 11.35 | 10.6 | Electrodomésticos ×2.77, Bodega / bebidas ×1.6, Bar / cafetería ×1.5 |
| el Parc i la Llacuna del Poblenou | Fábrica 25.5%, Bloque de desarrollismo 25.1%, Contemporáneo 20.4% | 6.4 | 6.09 | 9.8 | Bar musical / discoteca ×3.21, Oficina / despacho ×2.24, Concesionario / motos ×2.13 |
| la Vila Olímpica del Poblenou | Escuela de Barcelona 52.9%, Contemporáneo 16.8%, Bloque de desarrollismo 10.1% | 4.6 | 3.96 | 7.8 | Juguetes / deportes ×3.2, Oficina / despacho ×2.87, Restaurante ×2.27 |
| el Poblenou | Fábrica 34.2%, Contemporáneo 20.2%, Casa de pueblo antiguo 16.3% | 4.4 | 8.56 | 10.7 | Gasolinera ×3.11, Oficina / despacho ×1.71, Comida preparada ×1.7 |
| Diagonal Mar i el Front Marítim del Poblenou | Contemporáneo 61.5%, Vivienda social contemporánea 14.6%, Escuela de Barcelona 7.8% | 6.3 | 3.41 | 5.6 | Comida rápida / take away ×3.81, Zapatería / piel ×2.34, Óptica ×2.24 |
| el Besòs i el Maresme | Polígono de vivienda masiva 39.6%, Vivienda social contemporánea 12.4%, Casa de pueblo antiguo 9.6% | 3.8 | 3.62 | 7.8 | Locutorio ×5.81, Carnicería / charcutería ×2.82, Pescadería ×2.65 |
| Provençals del Poblenou | Fábrica 26.6%, Contemporáneo 21.3%, Bloque de desarrollismo 19.9% | 5.6 | 4.69 | 10.2 | Taller industrial / obras ×2.42, Almacén ×2.23, Taller / reparaciones ×1.97 |
| Sant Martí de Provençals | Bloque de desarrollismo 69.1%, Posguerra temprana 17.2%, Escuela de Barcelona 4.0% | 8.2 | 8.6 | 6.2 | Ferretería ×2.74, Herbolario / dietética ×2.64, Carnicería / charcutería ×2.14 |
| la Verneda i la Pau | Polígono de vivienda masiva 57.9%, Bloque de desarrollismo 21.8%, Contemporáneo 8.4% | 8.7 | 7.35 | 10.3 | Taller industrial / obras ×3.03, Concesionario / motos ×1.92, Imprenta / copistería ×1.91 |

### E. Estructura de `condal_city_datos.json`

- `_leeme`: qué es, fuentes y avisos.
- `reglas_generador`: las reglas de la sección C.
- `catalogo_fachadas[estilo]`: `nombre`, `epoca`, `donde`, `plantas` [mín, máx], `ancho_fachada_m` [mín, máx], `composicion`, `planta_baja`, `coronacion`, `variantes` (4), `paleta` (hex), `detalles`, `desgaste_base` (0–1).
- `escaparates[modelo]`: `descripcion`, `negocios` (lista de tipos que lo usan).
- `barrios[]`: `codigo`, `nombre`, `distrito`, `edificios`, `fachadas_pct` {estilo: %}, `epocas_pct` {época: %}, `variedad_epocas` (0–1), `plantas_pct` {"1".."10+": %}, `plantas_media`, `detalles_prob` {detalle: probabilidad 0–1}, `comercio` {`locales_total`, `locales_activos`, `activos_por_ha`, `vacios_pct`, `negocios[]` {`tipo`, `locales`, `cuota_pct`, `veces_media`}}, `contorno` (GeoJSON).
- `secciones[]`: `id`, `barrio` (código), `edificios`, `fachadas_pct`, `contorno` (GeoJSON).
- `rejilla_comercial[]`: `[lon, lat, locales_activos]`, centro de celdas de 150 × 150 m (2,25 ha).

**Fuentes:** Catastro de Barcelona 2026 (edificaciones por año de construcción y sección censal), Censo 2011 (edificios por número de plantas), Censo municipal de locales en planta baja 2022 y límites de barrios y secciones censales, todo de Open Data BCN. Épocas, alturas y negocios son reales; el paso de época a estilo es una estimación por reglas.
