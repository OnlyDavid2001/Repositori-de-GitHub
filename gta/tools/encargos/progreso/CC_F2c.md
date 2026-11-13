# CC_F2c · Fase 2c (bloque 3 del kit) — progreso

Estado: **terminada** (bloque 3; ver «Lo flojo»). Worktree `/home/user/wt/cc-f2c` (rama `wt-cc-f2c`). Capturas en
`/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/f2c/` (`mk.js` hace las vistas del escaparate;
`VS=01 PITCH=0.1 lote.sh <hora> <tamaño> <prefijo> estilo:x:z:hMin:hMax` las captura, de 2 en 2 vistas por ejecución).

## Hecho
- [x] `gta/piezas_b3.js`: tipos 184 CHAPA (chapa perforada) y 185 LISTON (listones de madera; acabado `listones`); los faldones
      usan el `K.TEJA` de rooftops.js (no se registra otra teja). Piezas generales: tejado, torreon, chimenea, aro, ojo_buey,
      grafiti, bici, deposito, banda_curva, frente_pilotis. Piezas de estilo: frente_torre, pb/vano/corona_torre;
      pb/vano/corona_racionalista, deco_lineas, reticula_hormigon; pb/vano/corona_vsa; pb/vano/corona_fabrica, fab_fachada;
      pb/vano/corona_poligono, pol_reticula.
- [x] `gta/estilos_b3.js`: torre, racionalista_deco, vivienda_social_actual, fabrica, poligono (4 variantes cada uno).
- [x] index.html: `piezas_b3.js` y `estilos_b3.js` tras `estilos_b1.js` (al fusionar con F2b, van después de las de b2).
- [x] Verificación con el escaparate (día y noche), hojas del bloque y medida en Eixample a pie.

## Vistas de prueba (coordenadas del juego)
torre 8922,16107 (Bonanova) · racionalista_deco 11007,15564 (Gràcia) · vivienda_social_actual 15912,17184 (Besòs) ·
fabrica 14604,15863 (Poblenou) · poligono 12179,20105 (la Guineueta).

## Qué tiene cada estilo (piezas en piezas_b3.js)
- **torre**: planta baja retranqueada 2,6 m con jardín (murete de piedra, verja de forja, pilares de cancela con bola, setos,
  buganvilla colgante, palmera en ~40 %), portal elevado con escalinata, garaje, ventanal al jardín; faldón de teja a cuatro
  aguas y alero con canecillos. v0 modernista: huecos en arco con trencadís y friso de trencadís; torreta cónica a veces.
  v1 novecentista: pilastras, frontón central, balaustrada con urnas. v2 señorial: torreón de pabellón en el tramo de calle más
  largo. v3 regionalista: hastial central de pendiente fuerte con tablas de alero, canecillos grandes, contraventanas de madera.
- **racionalista_deco**: v0 ventanas corridas con montantes y alféizar corrido; v1 déco con nervios verticales hasta un remate
  escalonado, antepechos en zigzag, portal con pilastras estriadas y «letras» (trazos dorados abstractos); v2 balcones de
  extremos en cuarto de círculo con pasamanos curvo, chaflán con ventana en curva saliente y torreón redondeado; v3 Casa Bloc:
  retícula de hormigón, balcones corridos en plantas alternas (dúplex) con bicis, planta baja de vidrio. Todos: marquesina
  geométrica (curva en v2), ojo de buey sobre el portal, planta baja de estuco con ventana apaisada, terrado con barandilla tubular.
- **vivienda_social_actual**: equipamiento de vidrio con carpintería de color en la planta baja; v0 persianas correderas de colores;
  v1 balcón corrido con paneles de chapa perforada (CHAPA) plegados o abiertos; v2 listones de madera (acabado `listones`) con
  marcos de aluminio y lamas; v3 galería abierta de acceso (losa, antepecho de chapa, puertas de color, bicis, macetas).
  Coronación: placas solares, máquinas y barandilla.
- **fabrica**: ventanal de taller con arco rebajado de ladrillo y alféizar de piedra, pilastras de ladrillo, cornisa de ladrillo con
  esquinillas, rótulo pintado (cartela con trazos ilegibles), portalón de carga con carril y grafitis, ventanas altas con reja.
  v0 diente de sierra (hastiales, faldones de fibrocemento y lucernarios); v1 chimenea troncocónica de 14–24 m; v2 almacén con
  portalones en vanos alternos y frontón escalonado (chimenea a veces); v3 loft: remonta de vidrio retirada, balcones franceses.
- **poligono**: retícula de prefabricado, ventanas idénticas con persiana y cajón, tendederos de jaula con ropa, aires,
  parabólicas, antenas, casetón con depósitos de agua; planta baja con persianas metálicas y grafitis. v0 bloque lineal de
  ladrillo; v1 torre aislada sobre pilotis con franja de color; v2 bloque en H con caja de escalera hundida y celosía; v3
  galerías exteriores de hormigón (2 de cada 3 plantas) con puertas y ropa.

## Verificación
- Hojas (960×540 por vista, cargadas con `?estilo=<id>&v=<n>`: color de la variante): `hoja_b3_dia.jpg` (filas torre,
  racionalista, vivienda social, fábrica, polígono; columnas v0–v3) y `hoja_b3_noche.jpg` (23:00, v0 y v2 de cada estilo).
- Errores y avisos de consola: cero en todas las ejecuciones (día, noche, medida).
- Medida (fps_eval, media, 960×540): Eixample a pie **5.173.528** triángulos / **866** llamadas (F2a: 5.194.012 / 866). Gòtic a
  pie y aérea sin medir: la cola se cortó por tiempo (SwiftShader a ~43 s por fotograma con la máquina compartida). Los estilos
  del bloque 3 casi no salen en esas dos vistas (Gòtic y centro), así que no se espera cambio.

## Vistas para `tools/cc/vistas_estilos.json` (no lo toco: el encargo limita F2c a sus ficheros; añadir al fusionar)
```
{"name":"torre","nota":"Sant Gervasi - la Bonanova","x":8922,"z":16107,"walk":true,"yaw":0,"pitch":0,"hour":10.5,"eval":"const B=BCN,s=B.fx.spotAt(8922,16107,0,'torre',400,5,14); if(s){s.hour=10.5; s.pitch-=0.14; B.applyView(s);}"},
{"name":"racionalista_deco","nota":"Gràcia","x":11007,"z":15564,"walk":true,"yaw":0,"pitch":0,"hour":10.5,"eval":"const B=BCN,s=B.fx.spotAt(11007,15564,0,'racionalista_deco',400,12,26); if(s){s.hour=10.5; B.applyView(s);}"},
{"name":"vivienda_social_actual","nota":"el Besòs i el Maresme","x":15912,"z":17184,"walk":true,"yaw":0,"pitch":0,"hour":10.5,"eval":"const B=BCN,s=B.fx.spotAt(15912,17184,0,'vivienda_social_actual',400,12,34); if(s){s.hour=10.5; B.applyView(s);}"},
{"name":"fabrica","nota":"Poblenou (22@)","x":14604,"z":15863,"walk":true,"yaw":0,"pitch":0,"hour":10.5,"eval":"const B=BCN,s=B.fx.spotAt(14604,15863,0,'fabrica',400,5,20); if(s){s.hour=10.5; s.pitch-=0.1; B.applyView(s);}"},
{"name":"poligono","nota":"la Guineueta","x":12179,"z":20105,"walk":true,"yaw":0,"pitch":0,"hour":10.5,"eval":"const B=BCN,s=B.fx.spotAt(12179,20105,0,'poligono',400,15,45); if(s){s.hour=10.5; B.applyView(s);}"}
```

## Lo flojo
- Torre: el faldón de teja delantero no se ve desde la acera (queda detrás del alero a 9–10 m de distancia; solo asoman las
  limatesas); el torreón de la variante señorial va en el tramo de calle más largo y en la vista del escaparate no salió (el
  tramo mirado era otro). La planta baja retranqueada deja el primer piso en voladizo (se lee como porche, no como villa exenta:
  la huella es la real).
- Las huellas son las reales: la «torre aislada» y el «bloque en H» del polígono se distinguen por la fachada (pilotis, franja
  de color, caja de escalera hundida), no por la planta.
- Fábrica: el diente de sierra y la chimenea se dibujan sobre la huella real (viviendas con estilo fábrica, sobre todo lofts del
  Poblenou); los edificios industriales (BREC.tipo > 0) siguen fuera del kit.
- Árboles de la calle tapan parte de las fachadas en las vistas del escaparate (racionalista, fábrica).
