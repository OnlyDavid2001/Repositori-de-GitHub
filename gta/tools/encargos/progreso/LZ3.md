# LZ3 — oclusión ambiental y pulido del ciclo de 24 horas (carril LUZ)

## Hecho
- Oclusión ambiental en pantalla (`lighting.js`, «OCLUSIÓN AMBIENTAL»): tres pases propios delante de la cadena de Babylon
  (bcnAo a media resolución con 8/12 muestras, bcnAoH desenfoque bilateral horizontal, bcnAoMix vertical + subida con pesos
  de distancia + mezcla). El MSAA pasa al primero de ellos (`aoSync`). Calidad: Baja sin, Media 8, Alta 12.
- Máscara de calles (`app.js`, tras `SEG`): textura de 8 m con 1 cerca de una calle. La luz de «bajos de fachada» de los
  volúmenes lejanos (`FS_BLD`) y el suelo urbano (`FS_TER`) solo se encienden de cara a una calle: patios de manzana a oscuras.
- Horizonte direccional (`uSunH`, `uHorzC`, `horzCol()`, preludio): al amanecer y al anochecer el naranja va hacia el sol; la
  niebla usa el mismo color por dirección. Luna con disco propio (`moonCol`), mares y halo corto.

## En curso / pendiente
- Ver capturas por horas (3, 7, 12, 17, 20:30, 21:15, 23) a pie y desde el aire; defectos de noche (port_vell, bloom de avenidas).
- DESARROLLO.md §7 (oclusión, horizonte, luna, máscara, tabla de calidades).

## Trampas
- Los pases de la cadena de Babylon se añaden al final de la lista de la cámara; los de la oclusión van en 0..2 y siguen
  delante tras cada reconstrucción. Al ponerlos o quitarlos se llama `pipe.prepare()` (el primer pase necesita búfer de
  profundidad y MSAA; Babylon decide eso al crear sus texturas).
- El búfer de la escena para la oclusión es FLOAT de 32 bits si se puede (distancia precisa), si no HALF_FLOAT.

## Cómo se prueba
- `BCN.light.set({ ao: 0 })` (pase puesto, intensidad 0) para comparar; `{ aoDbg: 1 }` muestra solo la oclusión.
- `BCN.light.stats().ao` → `{ n, k, first }` (first debe ser `bcnAo`).
