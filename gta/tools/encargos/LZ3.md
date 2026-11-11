# Carril LUZ · LZ3 — Oclusión ambiental y atardecer (plan ligero)

Ficheros tuyos: `app.js`, `lighting.js`, `index.html` y `DESARROLLO.md` §7. De `DESARROLLO.md` §6 lee 6.4, 6.5 y 6.12, y
el §7 que dejaron LZ1 y LZ2.

## Tareas
1. **Oclusión ambiental en pantalla**: un pase propio (`PostProcess`) colocado ANTES del bloom y del tono, a media
   resolución, que lee la distancia a la cámara del canal alfa del búfer HDR (lo escribe `FRAG`). Reconstruye la posición
   con la inversa de vista-proyección y la normal con diferencias entre vecinos; 8–12 muestras en espiral con rotación por
   píxel; radio ≈ 0,7 m en mundo; desenfoque bilateral que respete los bordes; se desvanece a partir de ~80 m y no toca
   el cielo. Intensidad moderada: que asiente los objetos en el suelo y marque rincones (bajo balcones, pie de fachada,
   detrás del mobiliario) sin halos oscuros alrededor de objetos finos ni bandas. En calidad Baja, apagada.
2. **Atardecer y noche** (el usuario llega hasta las 20:30):
   - Cielo: degradado con horizonte cálido y cenit azul profundo, resplandor alrededor del sol bajo; que la niebla lejana
     case con el color del horizonte.
   - Ambiente azulado y sol anaranjado y débil; la exposición acompaña a la hora para que no quede ni negro ni lavado.
   - En los volúmenes lejanos de edificios (`app.js`), ventanas encendidas al anochecer: patrón procedural estable por
     ventana, proporción creíble (20–35 %), tonos cálidos con alguno frío, multiplicado por `uDusk`. Que la ciudad de
     lejos se vea viva.
   - Comprueba que lo emisivo que ya exista (comercios, farolas, ventanas de pisos) florece con el bloom sin quemarse.
3. **Calibración final** a las 8:00, 13:00, 17:00 y 20,25, a pie y desde el aire, y la tabla de calidades completa
   (oclusión en Media y Alta).

## Verificación
`eix_acera, eix_fachada, eix_mobiliario, rambla_pie, gotic_calle, aereo_eixample, port_vell` a las 17:00 y a las 20,25, y
`eix_acera` a las 8:00 y 13:00. Recortes ampliados de dos rincones para ver que la oclusión no hace halos ni bandas, y la
misma vista con y sin oclusión. Sin errores ni avisos de consola.

## Entrega
Commits subidos y §7 de `DESARROLLO.md` completo (oclusión, atardecer, calibración por horas, tabla de calidades).
