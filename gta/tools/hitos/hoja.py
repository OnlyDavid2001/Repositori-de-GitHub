#!/usr/bin/env python3
"""Hoja de contacto de hitos: genera las vistas, lanza el arnés (tools/shot.js) y monta una imagen rotulada.

uso:  python3 tools/hitos/hoja.py <ids | --lote c | --todos> [opciones]
  ids              lista separada por comas (torre_glories,hotel_w)
  --lote c         todos los hitos declarados en landmarks_c.js (se pueden dar varios: --lote a,b)
  --todos          los de los cinco lotes
  --noche          añade cada vista también a las 22:00 · --solo-noche: solo a las 22:00
  --rumbos 210,30  rumbos desde los que se mira (grados desde el norte hacia el este: dónde está la cámara)
  --k 2.4          distancia = k × tamaño del hito · --elev 30: elevación de la cámara (grados)
  --hora 16        hora de las vistas de día · --size 640x360 · --cols N (columnas de la hoja)
  --out RUTA       prefijo de salida (por defecto tools/out/hoja): capturas RUTA_<id>_<rumbo>_<hora>.jpg y hoja RUTA.jpg
Imprime los errores y avisos de consola, BCN.lm.stats() y la ruta de la hoja. Sale con 1 si el arnés falla.
Cada vista usa BCN.lm.view(id, rumbo, k, elev) y BCN.st.maxDist = 40000 (se ve toda la ciudad)."""
import json, os, re, subprocess, sys

GTA = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def ids_de_lotes(lotes):
    out = []
    for l in lotes:
        f = os.path.join(GTA, 'landmarks_%s.js' % l)
        if os.path.exists(f):
            out += re.findall(r"\badd\(\{\s*id:\s*'([a-z0-9_]+)'", open(f, encoding='utf8').read())
    return out

def main(a):
    if not a or a[0] in ('-h', '--help'):
        print(__doc__); return 2
    o = {'rumbos': '210,30', 'k': '2.4', 'elev': '30', 'hora': '16', 'size': '640x360', 'out': os.path.join(GTA, 'tools/out/hoja'), 'cols': ''}
    ids, noche, solo = [], False, False
    i = 0
    while i < len(a):
        s = a[i]
        if s == '--noche': noche = True
        elif s == '--solo-noche': noche = solo = True
        elif s == '--todos': ids += ids_de_lotes('abcde')
        elif s == '--lote': i += 1; ids += ids_de_lotes(a[i].replace(',', ''))
        elif s.startswith('--') and s[2:] in o: i += 1; o[s[2:]] = a[i]
        else: ids += [x for x in s.split(',') if x]
        i += 1
    if not ids:
        print('no hay hitos que mirar'); return 2
    rumbos = [float(r) for r in o['rumbos'].split(',')]
    horas = ([] if solo else [float(o['hora'])]) + ([22.0] if noche else [])
    vistas = []
    for hid in ids:
        for h in horas:
            for r in rumbos:
                ev = ("var v = BCN.lm && BCN.lm.view(%s, %g, %s, %s); if (v) BCN.applyView(v); else console.warn('hoja: no hay hito %s'); BCN.st.maxDist = 40000;"
                      % (json.dumps(hid), r, o['k'], o['elev'], hid))
                vistas.append({'name': '%s_%d_%02d' % (hid, r, h), 'x': 12000, 'z': 14000, 'y': 600, 'yaw': 0, 'pitch': 0.5, 'hour': h, 'eval': ev, '_lab': '%s · %d° · %02d h' % (hid, r, h)})
    vistas[0]['eval'] += " console.warn('LMSTATS ' + JSON.stringify(BCN.lm ? BCN.lm.stats() : null));"
    out = os.path.abspath(o['out'])
    os.makedirs(os.path.dirname(out), exist_ok=True)
    jf = out + '_vistas.json'
    json.dump([{k: v for k, v in x.items() if k != '_lab'} for x in vistas], open(jf, 'w'))
    env = dict(os.environ, SIZE=o['size'], FMT='jpg')
    print('arnés: %d vistas (puede tardar varios minutos)…' % len(vistas), flush=True)
    p = subprocess.run(['node', os.path.join(GTA, 'tools/shot.js'), out, '@' + jf], cwd=GTA, env=env, capture_output=True, text=True)
    log = p.stdout + p.stderr
    open(out + '.log', 'w').write(log)
    for ln in log.splitlines():
        if not ln.startswith('vista '): print(ln[:600])
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print('sin PIL: no se monta la hoja (las capturas están en ' + out + '_*.jpg)'); return p.returncode
    tiles = []
    for v in vistas:
        f = out + '_' + v['name'] + '.jpg'
        if os.path.exists(f): tiles.append((Image.open(f).convert('RGB'), v['_lab']))
    if not tiles:
        print('no hay capturas'); return 1
    tw = 480; th = int(tiles[0][0].height * tw / tiles[0][0].width)
    per = len(rumbos) * len(horas)                       # vistas por hito: una fila por hito si caben (2–4)
    cols = int(o['cols']) if o['cols'] else per if 2 <= per <= 4 else min(4, len(tiles))
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * tw, rows * (th + 18)), (24, 24, 24))
    d = ImageDraw.Draw(sheet)
    for j, (im, lab) in enumerate(tiles):
        x, y = (j % cols) * tw, (j // cols) * (th + 18)
        sheet.paste(im.resize((tw, th)), (x, y + 18)); d.text((x + 4, y + 3), lab, fill=(235, 235, 235))
    sheet.save(out + '.jpg', quality=88)
    print('hoja: ' + out + '.jpg')
    return p.returncode

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
