# Progreso · etapa AZ2 (PALETA, segunda pasada: cubiertas sin rombos, azoteas con más detalle, sombra aérea)

Parte de AZ (paleta horneada por barrio, `rooftops.js`). El usuario vio las hojas de AZ: «se puede mejorar mucho,
especialmente esos rombos extraños en vez de ceñirse a las cuadrículas».

## Diagnóstico
1. **Rombos**: el grano de cubierta de AZ eran losas de 9 m en ejes del MUNDO (`floor(vLoc.xz/9)`), una de cada cuatro con
   el color «hermano» (rasilla rojiza ↔ baldosa clara). En el Eixample (girado ~45°) las losas salen como rombos y, recortadas
   por el borde del edificio, como triángulos de dos tonos.
2. **Sombra gigante en «aereo»**: el rango de profundidad de los mapas de sombra era fijo (±4 km a lo largo del sol desde el
   centro de la cascada, que está a la altura de la cámara). A 3,8 km de altura, el suelo de buena parte de la cascada lejana
   (semilado 4 km) queda a más de 4 km del centro a lo largo del sol: su profundidad sale fuera del mapa (> 1) y la
   comparación lo da «detrás» de lo pintado = en sombra. El borde recto es el plano a 4 km. No es la niebla ni shOut().

## Hecho
- `app.js` (carga de edificios): eje de cada edificio (media de las aristas del anillo exterior, ponderada por longitud,
  con el ángulo ×4) guardado por vértice en `uv2` (2 bytes); `VS_BLD` propio de los volúmenes (pasa `vAx`).
- `FS_BLD`: cubierta UNIFORME por edificio (color de la tabla de palette.js, sin losas ni color hermano) con textura fina
  alineada con el edificio y en metros: rasilla 28×14 a soga, baldosa clara 40×40, teja árabe (canales de 22 cm y cursos
  de 40 cm), tela asfáltica (rollos de 1 m solapados), grava; y manchas de metros. Todo de media cero y apagado cuando el
  motivo baja de ~2 píxeles: de lejos queda exactamente el color de la tabla.
- `lighting.js` (permitido por el encargo): rango de profundidad de las sombras según la altura de la cámara, el semilado
  de la cascada lejana y la altura del sol, en escalones ×1,25 (4 km a pie y a media altura: nada cambia ahí).
- `rooftops.js`: peto con albardilla en todo el borde (anillo exterior y patios de luces), casetas con puerta de color,
  rejilla, barandilla y escalera de gato, terrazas con pérgola (madera o metal), toldo, mesa, sillas y jardineras,
  chimeneas de ventilación (de obra con sombrerete o metálicas), jardineras sueltas, trasteros, claraboyas a dos aguas,
  más antenas (con dado), tendederos con más ropa, placas solares en filas solo en edificios modernos. De 3 a 16 elementos
  por azotea según el área. Tres niveles: completo ≤ 300 m, cajas + peto + manchas de ropa ≤ 650 m, casetas/depósitos/
  pérgolas ≤ 1100 m. La distancia usa la altura sobre el SUELO (antes sobre el mar: en Gràcia se recortaba).

## Pendiente / flojo
(ver informe final más abajo)

## Cómo se prueba
`node tools/shot.js <prefijo> @all.json` (vistas en el scratchpad `n2/az2/all.json`: secuencia d1500/d600/d200/d50,
n600 a las 23:00, aereo, roof_eix, roof_gra, roof_cv (Gòtic), roof_e150, roof_gra_lo). `BCN.detailStats().roof`.
