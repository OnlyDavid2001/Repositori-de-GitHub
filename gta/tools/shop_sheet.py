#!/usr/bin/env python3
"""Hojas de contacto de los comercios DENTRO de la ciudad (carril INTERIORES).
  python3 tools/shop_sheet.py vistas <salida.json> [baja|media|alta]   escribe las vistas del arnés: los 17 tipos, de frente
                                                                       (~5 m) y en oblicuo (~35 grados, ~6 m), en el mismo comercio
  SIZE=480x270 node tools/shot.js tools/out/hs/t @<salida.json> > registro.log 2>&1
  python3 tools/shop_sheet.py hoja tools/out/hs/t frente|oblicuo <hoja.jpg>   monta la hoja rotulada (3 columnas)
El tipo se fuerza en caliente (BCN_INTERIORS.force + reconstruir las celdas) en el eval de la vista de frente; la oblicua
que le sigue ve el mismo tipo. La calidad 'baja' (sin MSAA ni bloom) es unas tres veces más rápida en SwiftShader."""
import json, sys, os
NAMES = ['FORN DE PA', 'FARMACIA', 'FERRETERIA', 'BAR', 'FRUITERIA', 'LLIBRERIA', 'FLORISTERIA', 'RESTAURANT', 'PERRUQUERIA', 'MODA',
         'GELATERIA', 'CAFE', 'QUEVIURES', 'OPTICA', 'PAPERERIA', 'FORMATGERIA', 'SUPERMERCAT']
FRENTE = {"x": 12066.7, "z": 14538.9, "walk": True, "yaw": -0.7792, "pitch": -0.08, "hour": 17}
OBLICUO = {"x": 12068.73, "z": 14541.71, "walk": True, "yaw": -1.391, "pitch": -0.06, "hour": 17}
if len(sys.argv) >= 3 and sys.argv[1] == 'vistas':
    q = sys.argv[3] if len(sys.argv) > 3 else 'baja'
    vs = []
    for i in range(len(NAMES)):
        ev = "BCN.light&&BCN.light.setQuality('%s');BCN_INTERIORS.force=%d;BCN.fx.setRange(0);BCN.fx.setRange(1);" % (q, i)
        vs.append(dict(FRENTE, name='frente_%02d' % i, eval=ev)); vs.append(dict(OBLICUO, name='oblicuo_%02d' % i))
    json.dump(vs, open(sys.argv[2], 'w')); print(len(vs), 'vistas →', sys.argv[2])
elif len(sys.argv) >= 5 and sys.argv[1] == 'hoja':
    from PIL import Image, ImageDraw
    pre, kind, out = sys.argv[2:5]; tiles = []
    for i, n in enumerate(NAMES):
        for ext in ('jpg', 'png'):
            f = '%s_%s_%02d.%s' % (pre, kind, i, ext)
            if os.path.exists(f): tiles.append((i, n, Image.open(f).convert('RGB'))); break
    if not tiles: sys.exit('no hay teselas ' + pre + '_' + kind + '_NN')
    W, H = tiles[0][2].size; cols = 3; rows = (len(NAMES) + cols - 1) // cols
    sh = Image.new('RGB', (W * cols, H * rows), (20, 20, 20)); d = ImageDraw.Draw(sh)
    for i, n, im in tiles:
        x, y = (i % cols) * W, (i // cols) * H; sh.paste(im.resize((W, H)), (x, y))
        d.rectangle([x, y, x + 9 + 7 * len('%d %s' % (i, n)), y + 15], fill=(0, 0, 0)); d.text((x + 4, y + 2), '%d %s' % (i, n), fill=(255, 255, 0))
    sh.save(out, quality=90); print(sh.size, '→', out)
else:
    sys.exit(__doc__)
