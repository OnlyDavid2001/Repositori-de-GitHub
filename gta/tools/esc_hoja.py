#!/usr/bin/env python3
"""Escaparate de modelos (Condal City, Fase 4 kit): hojas de los 24 modelos de escaparate (escaparates.js).
  python3 tools/esc_hoja.py vistas <salida.json> [hora] [baja|media|alta] [modelos separados por comas]
      escribe las vistas del arnés: una por modelo, a pie de calle frente a las tiendas del Eixample (la misma que usa
      tools/shop_sheet.py); el modelo se fuerza en caliente en el eval (BCN_ESC.force + BCN.fx.force(null)).
  SIZE=480x270 node tools/shot.js <prefijo> @<salida.json>
  python3 tools/esc_hoja.py hoja <prefijo> <hoja.jpg> [columnas]   monta la hoja rotulada con las teselas <prefijo>_<modelo>.jpg
"""
import json, sys, os
MODELOS = ['bar', 'restaurante', 'comida_rapida', 'ocio_nocturno', 'hotel', 'super_autoservicio', 'alimentacion_tradicional', 'moda',
           'joyeria_optica', 'farmacia', 'belleza', 'salud', 'gimnasio', 'hogar', 'floristeria', 'cultura', 'bazar_moviles', 'souvenirs',
           'estanco', 'oficina', 'servicio_barrio', 'taller_garaje', 'almacen_industrial', 'local_vacio']
VISTA = {"x": 12066.7, "z": 14538.9, "walk": True, "yaw": -0.7792, "pitch": -0.06}
if len(sys.argv) >= 3 and sys.argv[1] == 'vistas':
    hora = float(sys.argv[3]) if len(sys.argv) > 3 else 10.5
    q = sys.argv[4] if len(sys.argv) > 4 else 'baja'
    ms = sys.argv[5].split(',') if len(sys.argv) > 5 else MODELOS
    vs = []
    for m in ms:
        ev = "BCN.light&&BCN.light.setQuality('%s');BCN_ESC.force='%s';BCN.fx.force(null);" % (q, m)
        vs.append(dict(VISTA, name=m, hour=hora, eval=ev))
    json.dump(vs, open(sys.argv[2], 'w')); print(len(vs), 'vistas →', sys.argv[2])
elif len(sys.argv) >= 4 and sys.argv[1] == 'hoja':
    from PIL import Image, ImageDraw
    pre, out = sys.argv[2:4]; cols = int(sys.argv[4]) if len(sys.argv) > 4 else 4; tiles = []
    for m in MODELOS:
        for ext in ('jpg', 'png'):
            f = '%s_%s.%s' % (pre, m, ext)
            if os.path.exists(f): tiles.append((m, Image.open(f).convert('RGB'))); break
    if not tiles: sys.exit('no hay teselas ' + pre + '_<modelo>')
    W, H = tiles[0][1].size; rows = (len(tiles) + cols - 1) // cols
    sh = Image.new('RGB', (W * cols, H * rows), (20, 20, 20)); d = ImageDraw.Draw(sh)
    for k, (m, im) in enumerate(tiles):
        x, y = (k % cols) * W, (k // cols) * H; sh.paste(im.resize((W, H)), (x, y))
        d.rectangle([x, y, x + 8 * len(m) + 10, y + 16], fill=(0, 0, 0)); d.text((x + 5, y + 3), m, fill=(255, 230, 120))
    sh.save(out, quality=88); print('hoja →', out, sh.size)
else:
    print(__doc__); sys.exit(2)
