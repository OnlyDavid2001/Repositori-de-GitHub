# Carril DETALLE · Etapa B — Balcones, terrazas y fachada (de la primera planta hacia arriba)

Fichero tuyo: `details.js` (y `DESARROLLO.md` §9). Ningún otro; a `geo.js` solo se le añade al final. La planta baja
(comercios, portales) y el vidrio de las ventanas son del carril INTERIORES: no los toques.

## Qué se pide
«Que las terrazas estén más detalladas… que todo se pueda observar mucho más realista, a pie.» Hoy un balcón es una losa
en caja con una reja plana y, a veces, una maceta. Tiene que parecer un balcón de Barcelona visto desde la acera.
Referencia de partida: balcones y coronación en `kd` (21171–21549) y azotea en `l_` (20591–20694) de `transeunte_pretty.js`.

## Tareas (por orden de impacto a pie)
1. **Balcón bien construido**: losa con canto moldurado y goterón; ménsulas con perfil curvo de verdad (primitivas suaves);
   intradós con baldosa cerámica decorativa en parte de los edificios (tipo nuevo con patrón en GLSL, rango de tipos 40–59);
   barandilla con variantes por edificio —barrotes rectos con anillas, «pit de colom» (panza), modernista con látigo—
   combinando patrón alfa en BASE y, de cerca, pasamanos, montantes y arranques 3D en ORNAMENTO; balcones corridos en el
   principal; algún balcón de piedra con balaustres torneados reales (usa el mecanismo de sustituto de §6 para cambiar el
   patrón alfa por balaustres 3D de cerca).
2. **Vida en los balcones** (azar por vano, de 0 a 3 cosas, con variedad entre edificios): jardineras colgadas de la
   barandilla y macetas con plantas (algunas colgantes), tendedero plegable con ropa de colores, toldo de lona (verde,
   naranja o a rayas) recogido o extendido con sus brazos, la típica persiana de cuerda verde colgando por fuera de la
   barandilla, mesa y sillas plegables, unidad exterior de aire acondicionado, bombona de butano naranja, bicicleta apoyada,
   parabólica. Sin banderas ni símbolos políticos.
3. **Ventanas y balconeras**: carpintería con despiece creíble (hojas, travesaño, manilla), cajón de persiana enrollable,
   contraventanas de librillo con lamas de verdad de cerca, alféizar con vierteaguas. Sin tocar el quad de vidrio.
4. **Muro y coronación**: bajantes de pluviales, cornisas con perfil curvo (barrido) en vez de cajas apiladas, ménsulas bajo
   cornisa, balaustrada de azotea con balaustres 3D de cerca, algún remate (jarrón, pináculo) en edificios clásicos o
   modernistas; casetón de escalera, chimeneas y antenas asomando por encima del peto. Tribunas con mejor carpintería y,
   en modernistas, vidrio emplomado de color en la franja superior.

## Reglas
- Lo que se ve a más de ~100 m va en BASE (silueta); el detalle fino, en ORNAMENTO. El ORNAMENTO de tus elementos no debe
  crecer más de ~60 % en triángulos por celda respecto a antes: mide con `BCN.detailStats()` antes y después.
- Materiales por el tipo genérico PBR (rugosidad/metal en el canal auxiliar) o tipos nuevos registrados desde `details.js`.
- Nada de sombras pintadas: llegan sombras reales y AO.

## Verificación mínima
`eix_balcones, eix_fachada, eix_acera, pg_acera, rambla_pie, gotic_calle, gracia_calle, dron_bajo` y vistas propias: un balcón
de frente a 8 m desde la acera de enfrente mirando hacia arriba, un principal con balcón corrido, una coronación a contraluz.
A 1600x900 al menos dos. Coherencia BASE/ORNAMENTO (nada flotando ni duplicado al cambiar de capa).

## Entrega
Commits, §9 de `DESARROLLO.md` (apartado «Balcones y fachada») y notas para la etapa F (mobiliario), que viene después en tu carril.
