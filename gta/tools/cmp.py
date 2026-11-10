#!/usr/bin/env python3
"""Compara dos capturas. uso: python3 tools/cmp.py a.png b.png [diff.png]
Imprime diferencia media (0-255), máxima y % de píxeles que difieren en más de 8 niveles."""
import sys
from PIL import Image, ImageChops
a = Image.open(sys.argv[1]).convert('RGB'); b = Image.open(sys.argv[2]).convert('RGB')
if a.size != b.size: print('tamaños distintos', a.size, b.size); sys.exit(2)
d = ImageChops.difference(a, b); data = d.tobytes(); n = len(data) // 3
m = sum(data) / len(data); mx = max(data)
big = sum(1 for i in range(0, len(data), 3) if max(data[i], data[i + 1], data[i + 2]) > 8) * 100 / n
print('media %.3f  max %d  >8: %.2f%%' % (m, mx, big))
if len(sys.argv) > 3: d.point(lambda v: min(255, v * 6)).save(sys.argv[3])
