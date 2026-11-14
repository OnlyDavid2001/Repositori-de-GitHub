# CC_F3R · Repaso de la Fase 3 (vuelta 1)

Rama `wt-cc-f3` (worktree /home/user/wt/cc-f3). Capturas en scratchpad/cc/f3r/.

## Hecho
- [x] Fusión de origin/wt-cc (F2R) con conflictos resueltos (f395920): tramo() de F3b + chaflán de F2R (run.chaflan sin
      depender de V.chaflanV, solo en la zona de chaflanes), run.com de la regla 8 manda sobre el comercio de los estilos
      comerciales, parcelas pintadas de F2R (V.par) solo si el edificio no tiene parcelas del fichero.
- [ ] Regla 10: esChaflan acepta el chaflán compartido (un vecino calle a ~45°, el otro medianera/ciego/liso); variante de
      chaflán solo en la zona de chaflanes (chfZ).
- [ ] Regla 6: medianera a menos de 16 m de calzada solo si el tramo se aleja de la calle; en patio, solo si el vecino deja ≥ 7 m.
- [ ] Generador: λ 0,02–50, dos vueltas con el reparto asignado (rachas incluidas), repetición con compatibilidad ≥ 0,04,
      ático 30 % del estilo si la variante no trae aticoP, remontes reescalados por la fracción elegible (+1 en casas de 2
      plantas), estadística «% con otro estilo» por barrio y tasa de repetición medida.
- [ ] condal_edif.json regenerado.
