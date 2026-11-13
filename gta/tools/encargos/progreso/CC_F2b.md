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
- [ ] Hojas de día (una carga por variante, `lote2.sh`: color de la variante) y de noche; medidas

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

## Pendiente / notas
