# Le — hitos del lote e (Collserola, zona alta, Sants/Fira, aeropuerto)

## Hecho
- Los 22 hitos del catálogo en `gta/landmarks_e.js`: A (torre_collserola, sagrat_cor, hotel_porta_fira), B (17, varios con la
  planta real de los datos vía `h.edif`), C (fabra_coats: retoque de color; bunquers_carmel: plataformas nuevas, no oculta nada).
- Revisado con hojas: día de todos (rumbo 150), 22:00 de los A, aéreas de colocación (puente, Mistos, Sants, Pedralbes).
  Sin errores de consola; `BCN.lm.stats()` con el lote: 24 011 tris en total (el lote ≈ 19 700 con las plantas reales).
- Collserola y Sagrat Cor de los datos (los volúmenes simplificados, clase 13 y clase 2) quedan ocultos y sustituidos.

## Pendiente / flojo
- Torre de control del aeropuerto: no modelada (no está en los datos y su posición no es fiable).
- Pont de Bac de Roda: rumbo cambiado a 135° (perpendicular a las vías); el catálogo decía 45°. Se ve pequeño entre árboles.
- Mistos: posición de memoria (baja), desplazada 15 m al césped para no pisar la calzada.
- Monestir de Pedralbes: la iglesia y el campanario se colocaron por la planta de los datos (volumen 105103), sin confirmar.
- TNC: frente (escalinata) en −Z (noroeste) sin confirmar; Sagrat Cor: fachada y estatua hacia +Z (103°) sin confirmar.
- Los iconos A van por debajo del rango 3 000–12 000 (2 550, 1 280, 1 692): se reconocen y no hacía falta más.

## Trampas
- `h.edif` viene vacío en tris.js: cada constructor que usa plantas reales tiene planta de reserva.
- Datos de Collserola: plataformas de 84 a 152 m (13, cada 5,4 m), fuste hasta 205 m, mástil hasta 288 m.

## Cómo se prueba
- `node tools/hitos/tris.js e` · `python3 tools/hitos/hoja.py --lote e --rumbos 150 --elev 22`
- `python3 tools/hitos/hoja.py torre_collserola,sagrat_cor,hotel_porta_fira,tibidabo_parc --noche --rumbos 150 --k 1.2 --elev 12`
