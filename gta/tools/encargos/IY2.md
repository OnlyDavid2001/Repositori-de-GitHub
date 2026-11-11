# Carril INTERIORES · IY2 — Portales, pisos y terrazas (plan ligero)

Ficheros tuyos: `interiors.js`, `facades.js`, **`details.js`** (en este plan es tuyo: nadie más lo toca) y
`DESARROLLO.md` §8; a `geo.js` solo se le añade al final. De `DESARROLLO.md` lee §3 y, de §6: 6.4, 6.6, 6.7, 6.8 y 6.9, y
el §8 que dejó IY1 (grupos de comercios y shader de habitación virtual, que vas a reutilizar).

## Qué pidió el usuario
«Que también se vean a través del vidrio los portales, y un poco los pisos particulares, algunos: los que tengan la
persiana abierta aunque no la ventana. Y que las terrazas estén un pelín más detalladas.» Todo visto a pie.

## Tareas
1. **Portales**: la puerta del edificio con vidrio y reja de forja (dibujada sobre el vidrio), marco, zócalo, tirador,
   placa del número y portero automático en la jamba (geometría pequeña). Detrás, el zaguán con la habitación virtual de
   IY1: estrecho (el ancho del portal), ~3,2 m de alto y 8–10 m de fondo; suelo de mármol o baldosa hidráulica, zócalo
   en las paredes, lámpara de techo encendida, al fondo el arranque de la escalera y la puerta del ascensor, buzones en
   una pared lateral, alguna planta. Al anochecer, la mayoría con luz cálida y algunos a oscuras.
2. **Pisos**: en torno a un 30 % de las ventanas y balconeras de las plantas altas tienen la persiana o los porticones
   abiertos (el resto se queda como está) y dejan ver una habitación con la misma técnica: ~4 m de fondo, pared del
   fondo de un color por semilla, lámpara de techo, cortinas a los lados junto al vidrio, y una capa intermedia con
   muebles insinuados (estantería, cuadros, respaldo de sofá, lámpara de pie). De día el interior es oscuro (0,25–0,5)
   y manda el reflejo del vidrio salvo mirando de frente; al anochecer se encienden ~45 % de las abiertas, cálidas, con
   alguna fría o azulada de televisor (`emit` 2–3 × `uDusk`). Debe funcionar también en la capa BASE: de lejos, las
   ventanas encendidas dan vida a la calle.
3. **Terrazas de bar**: delante de los comercios BAR, CAFÈ, RESTAURANT y GELATERIA cuando la acera es lo bastante ancha
   (compruébalo con lo que ofrece `ctx.city`; pégalas a la fachada, donde no hay árboles ni farolas): de 2 a 6 conjuntos
   de mesa redonda de pie central con 2–4 sillas, algunas sombrillas (abiertas y cerradas) del color del toldo del local,
   jardineras en los extremos y una pizarra de menú. Geometría real con las primitivas de `geo.js` y `K.PBR` en la capa
   ORNAMENTO, con una versión de pocos triángulos en BASE (tableros y sombrillas) para que no aparezcan de golpe.
   Sin personas.
4. **Remates de IY1**: lo que su informe marque como flojo y sea rápido de mejorar.

## Verificación
`eix_portal` (portal de frente y en oblicuo), `eix_fachada` y `eix_balcones` (pisos de día), una calle al anochecer
(`HOUR=20.25`) de cerca y a 100 m, y una terraza de cerca (usa `?shop=BAR`) y la misma acera a 60 m. Hoja de contacto
con 6 portales y 12 ventanas abiertas para ver la variedad. Sin errores ni avisos de consola.

## Entrega
Commits subidos y §8 de `DESARROLLO.md` ampliado (portales, pisos, terrazas).
