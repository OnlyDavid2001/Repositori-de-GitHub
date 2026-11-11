# FZ2 — Aura nocturna en árboles y aceras (carril DETALLE)

## Hecho
- `streets.js`: `FS_TREE` (corteza, hojas cercanas, copa media e impostores) recibe de noche la luz de farola
  (`uGlow.x`, `kAura`) desde abajo con `treeGlow()` (altura local `vHl`); de lejos, valor medio y color desaturado.
- `streets.js`: `FS_WALK` (panot, granito, bordillo y alcorques) recibe la misma luz que la calzada, sin charcos, más junto
  al bordillo, atenuada cerca (charcos reales del mobiliario) y con albedo topado a 0,4.
- `furniture.js`: bolardos más gruesos (17 cm), gris claro y con franja reflectante: se leen a 10–15 m.
- `DESARROLLO.md` §9.4 (párrafo FZ2) y §9.7.

## Pendiente / flojo
- Motos: sin tocar (siguen derechas, sin inclinarse sobre la pata; matrícula en blanco).
- Acera sin dibujo de charcos a media distancia (la calzada sí lo tiene).
- Desde el dron a 22 m se ve sobre todo lo alto de las copas: siguen bastante oscuras (a propósito: luz desde abajo).

## Cómo se prueba
Vistas en `<scratchpad>/fz2/v.json` (eix_acera 12:00 primero; noche 23:00: aereo_eixample con maxDist=40000, eix_acera,
dron_bajo, rambla_pie, granvia_cruce; dron_bajo a las 3:00). `run.sh <prefijo> <vistas>` en la misma carpeta.
