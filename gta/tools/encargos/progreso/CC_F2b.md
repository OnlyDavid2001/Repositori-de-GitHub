# CC_F2b · Fase 2b (bloque 2 del kit) — progreso

Worktree `/home/user/wt/cc-f2b`, rama `wt-cc-f2b`. Capturas en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/f2b/`
(`mk.js` y `lote.sh <hora> <tamaño> <prefijo> estilo:x:z:hMin:hMax …`, como en F2a).

## Hecho
- [x] `gta/piezas_b2.js`: tipos 176 TRENCADIS, 177 BLOQUE (acabado 'bloque'), 178 CERAMICA, 179 VITRAL; piezas generales
      (balcon_curvo, tribuna_hierro, tribuna_piedra, torreta, cornisa_b2, almohadillado, pintadas, deposito, esperas) y las de
      ranura de cada estilo.
- [x] `gta/estilos_b2.js`: olimpico_80_90, casa_obrera_xix, autoconstruccion, modernista, eixample_ornamentado, eixample_temprano
      (4 variantes cada uno). Líneas `<script>` tras estilos_b1.js en index.html.
- [x] Capturas de prueba (640×360, variantes forzadas en marcha) y arreglos: autoconstrucción con piso añadido también en casas
      de 2 plantas, peto escalonado, pies del sombrajo, peldaños de rasilla; planta baja olímpica con ventanal de lamas; ménsula
      de la tribuna de piedra más sobria. Cero errores de consola.
- [x] Vistas del bloque 2 en `tools/cc/vistas_estilos.json` (Vila Olímpica, Raval, Carmel, Quadrat d'Or, Rambla de Catalunya,
      Dreta/Girona).
- [x] Hojas: `hoja_b2_dia.jpg` (10:30, 6 estilos × 4 variantes; filas: olímpico, casa obrera, autoconstrucción, modernista,
      Eixample ornamentado, Eixample temprano; columnas v0–v3) y `hoja_b2_noche.jpg` (23:00, v0 y v2 de cada estilo, de dos en dos
      por fila). A diferencia de F2a, **una carga por variante** (`lote2.sh`: `?estilo=<id>&v=<n>` + la misma variante forzada
      sobre el mismo edificio con spotAt), así que el color del muro es el de la variante. Cero errores y avisos de consola en
      las 36 cargas (24 de día, 12 de noche) y en la medida de rendimiento.
- [x] Medidas (abajo).

## Qué tiene cada estilo (piezas en piezas_b2.js)
- **Olímpico 80–90**: ladrillo cara vista con cantos de forjado de hormigón, mallorquinas de lamas, barandillas de tubo de hierro
  pintado (verde, azul, granate, blanco). PB: portería de vidrio en marco de hormigón con visera de chapa y videoportero,
  acceso al aparcamiento (persiana de acero y franja azul), ventanal con hojas de lamas. Coronación: peto con albardilla de
  aluminio, placas solares, cubierta curva de zinc. v0 galerías apiladas en marco de hormigón (vidrio y hojas de lamas
  plegadas) alternas con ventanas · v1 manzana con patio: balcones corridos, porches de pilares cuadrados de hormigón y
  cubierta curva · v2 posmoderno de color: estuco de color, ventanas cuadradas con marco grueso de color de acento, arcos en
  la 1.ª planta, frontón en lo alto y pérgola de color en el terrado · v3 vivienda pública: ventanas apaisadas con hojas
  correderas de lamas y bandas corridas de hormigón (alféizar y dintel), chaflán con balcón corrido.
- **Casa obrera XIX**: revoco desconchado, balcones estrechos y altos de forja sencilla, librillos descoloridos, ropa tendida
  y macetas, cables por la fachada con bajante y caja de contadores, pancartas vecinales (tela con franjas, sin letras).
  PB: portal estrecho y alto de madera con montante enrejado; locales cerrados con persiana y pintadas. Coronación: cornisa
  simple (con ménsulas en v1) y tendedero en el terrado. v0 2 balcones (vano 3,3 m) · v1 3 balcones con cornisa (2,6 m,
  planta noble algo más alta) · v2 muy estrecha (2,2 m, huecos altísimos, peto) · v3 esquina con balcones corridos.
- **Autoconstrucción**: huecos irregulares por casa (ancho, desplazamiento, alto y alféizar distintos en cada vano), paños
  ciegos, persianas alicantinas o PVC con cajón, balconcillos de tubo, macetas, aire acondicionado. PB: puerta de casa con
  tejadillo de losa, garaje improvisado de chapa pintada. Coronación: peto, depósito de agua, esperas de pilares con barras.
  v0 casita escalonada (peto a alturas distintas por tramos) · v1 piso añadido de ladrillo visto (última planta y peto de
  ladrillo, canto del forjado de la ampliación, esperas) · v2 bloque de hormigón sin enlucir (tipo 177, dinteles de hormigón)
  · v3 terraza con barandilla de tubo, sombrajo y escalera exterior de obra con peldaños de rasilla hasta el primer piso.
- **Modernista**: dinteles en arco rebajado con clave, forja de anillas y óvalos. PB: portal en arco con vidriera (tipo 179,
  se enciende de noche), enmarcado de trencadís y forja; almohadillado con ventanas en arco enrejadas. Coronación ondulada
  con albardilla de trencadís y mosaico en la cornisa. v0 balcones de planta curva con canto de trencadís, ménsulas,
  pináculos y friso de trencadís en la última planta · v1 tribunas de hierro y vidrio de planta poligonal con vidriera
  arriba (dos por fachada o una central) y balcón curvo en la 1.ª · v2 ladrillo con recercados de piedra y frisos de
  azulejo verde (tipo 178) · v3 piedra, pináculos de cerámica y torreta con chapitel de cerámica verde.
- **Eixample ornamentado**: planta noble alta con balcón corrido, frontones (curvos y triangulares) y relieve floral sobre los
  huecos; guardapolvos en la 2.ª. PB: portal monumental en arco con columnas, entablamento, cartela y forja; almohadillado con
  llagas verticales. Coronación: cornisa con ménsulas y dentículos, balaustrada, frontón central (o ático, regla 5). v0
  tribuna central de piedra (ménsula, antepecho labrado, ventanal de madera, balaustrada encima) · v1 piedra, balcón corrido
  de balaustres en la noble con ménsulas y frontón curvo central · v2 torreta con chapitel de pizarra en el chaflán (o en
  la esquina del tramo del portal) · v3 esgrafiados en los entrepaños.
- **Eixample temprano**: rejilla regular de balcones de forja idénticos, librillos verdes, molduras suaves. PB: portal de
  madera con picaporte, montante enrejado y recercado de piedra; almohadillado. Coronación: cornisa con dentículos y terrado
  transitable (peto bajo con barandilla de hierro). Farola de brazo en la esquina del tramo del portal. v0 4 balcones
  simétrica (3,8 m, guardapolvos) · v1 5 balcones (3,0 m) · v2 chaflán sobrio (ventanas con antepecho de la 3.ª planta
  arriba, balcón corrido en el chaflán) · v3 balcón corrido en la planta principal.

## Medidas (fps_eval.js, calidad media, 960×540, vistas de la Fase 0, selector natural)
- Eixample a pie: **5.167.055** triángulos / **866** llamadas (F2a 5.194.012 / 866; Fase 0 5,2 M / 866).
- Gòtic a pie: **6.490.808** / **647** (F2a 6.332.852 / 644; Fase 0 6,40 M / 649): +2,5 % de triángulos sobre F2a (+1,4 % sobre la
  Fase 0), sobre todo por la casa obrera (cables, pintadas, tendederos) que el selector pone ahora en el Raval y el Gòtic.
- Aérea: **1.315.294** / **304** (igual).
- Carga 17,9 s (antes 17–20 s). Nada por fotograma: todo se construye en las celdas de siempre. Los tipos 176–179 son ramas del
  sombreador de detalle (el trencadís hace un Voronoi de 3×3 por fragmento solo donde hay trencadís: frisos y albardillas).

## Lo flojo / pendiente
- Variantes que se distinguen poco a pie de calle: Eixample temprano v0 frente a v1 (solo cambia el ritmo, 3,8 m frente a 3,0 m;
  he añadido un eje central marcado en v0 después de la hoja, verificado solo de noche) y autoconstrucción v0 (el peto
  escalonado sube como mucho 1 m).
- La torreta del Eixample ornamentado v2 va en el chaflán o al final del tramo del portal: en el edificio de la hoja no se ve
  (no tiene chaflán y la esquina queda fuera de cuadro). La del modernista v3 sí se ve.
- Los anchos estrechos (casa obrera 5–9 m, autoconstrucción 4–8 m) salen como fachadas largas hasta que la Fase 3 parta en
  parcelas; los huecos irregulares de la autoconstrucción ayudan, pero un frente de 40 m sigue pareciendo una sola casa.
- La escalera exterior de la autoconstrucción v3 tapa el último vano de la planta baja (la pieza pb lo deja ciego), pero si el
  generador decide comercio en ese vano el escaparate queda detrás de la escalera.
- El escaparate de estilos (spotAt) elige edificios más altos que el rango del estilo en algunos casos (Eixample ornamentado
  de 8 plantas en la hoja): es el edificio real, con la altura real.

## Peticiones al núcleo del kit (no tocado desde este bloque)
- `T.rail` lee la barandilla de `env.V` y no de la variante de la planta (`q.V`): la planta noble no puede cambiar de barandilla
  si la pieza no cambia `env.V` alrededor de la llamada (lo hago en vano_ornamentado). Mejor: que `vanoDef` pase `q.V` a `rail`.
- Un `T.corona(env, run, q)` con la coronación de siempre, para piezas de corona que solo añaden algo (hoy hay que redibujar la
  cornisa entera; por eso existe `cornisa_b2`).
- Un campo de q con la cota de la acera en el vano (`gl`) también en la ranura vano, y saber si el edificio tiene chaflán
  (`env.chaflan` a nivel de edificio) para poner la torreta solo una vez y en la esquina buena.

## Pendiente / notas
