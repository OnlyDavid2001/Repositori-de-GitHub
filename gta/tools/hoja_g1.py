#!/usr/bin/env python3
"""Hoja de contactos de una tanda de capturas del banco de pruebas G1 (views_g1.json).

uso:
  python3 tools/hoja_g1.py <prefijo> <salida.jpg> [--vistas tools/views_g1.json] [--cols 4] [--ancho 480] [--titulo TEXTO]
  python3 tools/hoja_g1.py --comparar <prefijo_antes> <prefijo_despues> <salida.jpg> [--vistas ...] [--ancho 480]

- <prefijo> es el mismo que se pasó a tools/shot.js: las imágenes son <prefijo>_<nombre>.jpg (o .png).
- La hoja sigue el orden de views_g1.json y rotula cada celda con el número, el nombre y la hora de la vista;
  si falta una captura, la celda sale en gris con «falta» (para que se note).
- --comparar monta dos columnas por vista (ANTES | DESPUÉS), una fila por vista: sirve para los ANTES/DESPUÉS de cada carril.
- --solo n1,n2,... limita la hoja a esas vistas (por nombre).
"""
import argparse, json, os, sys
from PIL import Image, ImageDraw, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))


def fuente(t):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'):
        if os.path.exists(f):
            return ImageFont.truetype(f, t)
    return ImageFont.load_default()


def imagen(prefijo, nombre):
    for ext in ('jpg', 'png', 'jpeg'):
        p = '%s_%s.%s' % (prefijo, nombre, ext)
        if os.path.exists(p):
            return Image.open(p).convert('RGB')
    return None


def celda(im, ancho, rotulo, fnt):
    alto = ancho * 9 // 16
    if im is None:
        c = Image.new('RGB', (ancho, alto), (90, 90, 90))
        ImageDraw.Draw(c).text((ancho // 2 - 30, alto // 2 - 10), 'falta', fill=(255, 220, 0), font=fnt)
    else:
        c = im.resize((ancho, im.height * ancho // im.width), Image.LANCZOS)
        if c.height != alto:
            c = c.crop((0, 0, ancho, alto)) if c.height > alto else c
    d = ImageDraw.Draw(c)
    tw = d.textlength(rotulo, font=fnt)
    d.rectangle((0, 0, tw + 12, fnt.size + 8), fill=(0, 0, 0))
    d.text((6, 3), rotulo, fill=(255, 255, 255), font=fnt)
    return c


def rotulo(i, v):
    h = v.get('hour')
    hs = '' if h is None else ' · %d:%02d' % (int(h), round((h % 1) * 60))
    return '%d %s%s' % (i + 1, v['name'], hs)


def main():
    a = argparse.ArgumentParser()
    a.add_argument('args', nargs='+')
    a.add_argument('--comparar', action='store_true')
    a.add_argument('--vistas', default=os.path.join(AQUI, 'views_g1.json'))
    a.add_argument('--cols', type=int, default=4)
    a.add_argument('--ancho', type=int, default=480)
    a.add_argument('--titulo', default='')
    a.add_argument('--solo', default='')
    o = a.parse_args()
    vistas = json.load(open(o.vistas))
    if o.solo:
        sel = o.solo.split(',')
        vistas = [v for v in vistas if v['name'] in sel]
    fnt = fuente(max(12, o.ancho // 30))
    ftit = fuente(max(16, o.ancho // 20))
    W = o.ancho
    H = W * 9 // 16
    if o.comparar:
        if len(o.args) != 3:
            sys.exit('uso: --comparar <prefijo_antes> <prefijo_despues> <salida.jpg>')
        pa, pd, sal = o.args
        cab = 40
        hoja = Image.new('RGB', (2 * W + 6, cab + len(vistas) * (H + 6)), (24, 24, 24))
        d = ImageDraw.Draw(hoja)
        d.text((10, 8), (o.titulo + '   ' if o.titulo else '') + 'ANTES', fill=(255, 255, 255), font=ftit)
        d.text((W + 16, 8), 'DESPUÉS', fill=(255, 255, 255), font=ftit)
        for i, v in enumerate(vistas):
            y = cab + i * (H + 6)
            hoja.paste(celda(imagen(pa, v['name']), W, rotulo(i, v), fnt), (0, y))
            hoja.paste(celda(imagen(pd, v['name']), W, rotulo(i, v), fnt), (W + 6, y))
    else:
        if len(o.args) != 2:
            sys.exit('uso: <prefijo> <salida.jpg>')
        pre, sal = o.args
        cols = o.cols
        filas = (len(vistas) + cols - 1) // cols
        cab = 44 if o.titulo else 0
        hoja = Image.new('RGB', (cols * (W + 6) - 6, cab + filas * (H + 6) - 6), (24, 24, 24))
        if o.titulo:
            ImageDraw.Draw(hoja).text((10, 8), o.titulo, fill=(255, 255, 255), font=ftit)
        for i, v in enumerate(vistas):
            hoja.paste(celda(imagen(pre, v['name']), W, rotulo(i, v), fnt), ((i % cols) * (W + 6), cab + (i // cols) * (H + 6)))
    hoja.save(sal, quality=88)
    print('hoja:', sal, hoja.size)


if __name__ == '__main__':
    main()
