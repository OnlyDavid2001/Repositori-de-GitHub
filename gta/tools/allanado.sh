#!/bin/bash
# FIX3: regenera data/allanado.bin.gz, la corrección precalculada de las calles planas (S2/S3, suelos.js). Hay que relanzarlo
# si cambian las calles, el relieve o el cálculo (calc en suelos.js; sube entonces la versión en preClave). Si no coincide,
# el juego lo nota (clave) y recalcula al cargar como antes, así que un fichero viejo nunca rompe nada: solo carga más lento.
# uso: tools/allanado.sh   (desde cualquier sitio; tarda lo que una carga del arnés)
cd "$(dirname "$0")/.." || exit 1; T=$(mktemp -d)
EV='BCN.detailStats=function(){var b=window.BCN_FLATPACK,s="";for(var i=0;i<b.length;i+=32768)s+=String.fromCharCode.apply(null,b.subarray(i,i+32768));return {clave:BCN_SUELOS.clave,flat:btoa(s)}}'
V=$(python3 -c "import json,sys;print(json.dumps([{'name':'x','x':12217,'z':14027,'agl':300,'pitch':1.2,'frames':1,'eval':sys.argv[1]}]))" "$EV")
Q='?dumpflat=1&noprecalc=1' SIZE=320x180 node tools/shot.js "$T/f" "$V" > "$T/log" 2>&1 || { cat "$T/log" | cut -c1-300; exit 1; }
python3 - "$T/log" data/allanado.bin.gz <<'P'
import sys, json, base64, gzip
for l in open(sys.argv[1]):
    if l.startswith('vista x'):
        d = json.loads(l[l.index('{'):]); b = base64.b64decode(d['flat'])
        open(sys.argv[2], 'wb').write(gzip.compress(b, 9)); print('clave', d['clave'], len(b), 'B →', sys.argv[2])
P
rm -rf "$T"
