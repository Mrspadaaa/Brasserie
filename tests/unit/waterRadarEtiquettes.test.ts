import { describe, expect, it } from 'vitest';
import { disposerEtiquettes, type BoiteLocale } from '../../src/ui/WaterRadar';

/*
 * EAU-RADAR-ETIQUETTES (22.11, « Oula c'est pas terribles ça ») : chaque étiquette d'ion au bout de son axe, entière dans la
 * toile, sans chevaucher une autre ni la légende ; le disque reste le plus grand possible.
 * Boîtes : celles mesurées par getBBox dans Chrome (eau-sels.mjs --radar, 22.11), gabarit « 888 ▲ ».
 */
const B = (x: number, y: number, w: number, h: number): BoiteLocale => ({ x, y, w, h });
const BOITES: Record<string, BoiteLocale> = {
  'cl-ligne': B(-47, -16, 94, 22), 'mg-ligne': B(-46, -16, 92, 22),
  'so4-deux': B(0, -16, 70, 34), 'so4-trois': B(0, -12, 38, 47),
  'ca-deux': B(0, -16, 63, 34), 'ca-trois': B(0, -12, 38, 47),
  'na-deux': B(-59, -16, 60, 34), 'na-trois': B(-37, -12, 38, 47),
  'hco3-deux': B(-106, -16, 106, 34), 'hco3-trois': B(-61, -12, 61, 47),
  legende: B(0, -11, 54, 46)
};
const ANGLE = { cl: -90, so4: -30, ca: 30, mg: 90, na: 150, hco3: 210 } as const;

describe('disposerEtiquettes (pesée sur téléphone)', () => {
  for (const [w, h, rMin] of [[356, 180, 85], [356, 321, 144], [356, 363, 155]] as const) {
    it(`${w}×${h} : rayon ≥ ${rMin}, étiquettes au bout de l'axe, entières, sans chevauchement`, () => {
      const t0 = performance.now();
      const d = disposerEtiquettes(w, h, BOITES);
      const ms = performance.now() - t0;
      expect(d.R).toBeGreaterThanOrEqual(rMin);
      expect(ms).toBeLessThan(150);
      const rects = Object.entries(d.etiquettes).map(([ion, e]) => ({ ion, ...e!.r }));
      expect(rects).toHaveLength(6);
      // la légende : colonne dans la toile, ou ligne sous elle (celle qui laisse le plus grand disque)
      expect(d.legende != null || d.legendeDessous).toBe(true);
      for (const r of rects) {
        const a = (ANGLE[r.ion as keyof typeof ANGLE] * Math.PI) / 180;
        const tx = d.CX + d.R * Math.cos(a), ty = d.CY + d.R * Math.sin(a);
        const dist = Math.hypot(Math.max(r.x - tx, 0, tx - r.d), Math.max(r.y - ty, 0, ty - r.b));
        expect(dist, r.ion).toBeLessThanOrEqual(22);
        expect(r.x >= 0 && r.y >= 0 && r.d <= w && r.b <= h, r.ion).toBe(true);
      }
      const toutes = [...rects, ...(d.legende ? [{ ion: 'légende', ...d.legende.r }] : [])];
      if (d.legendeDessous) expect(d.bas).toBeLessThanOrEqual(h - 18);
      for (let i = 0; i < toutes.length; i++) {
        for (let j = i + 1; j < toutes.length; j++) {
          const p = toutes[i], q = toutes[j];
          const chevauche = p.x < q.d && q.x < p.d && p.y < q.b && q.y < p.b;
          expect(chevauche, `${p.ion} / ${q.ion}`).toBe(false);
        }
      }
    });
  }

  it('toile minuscule : une disposition quand même (repli), jamais une exception', () => {
    const d = disposerEtiquettes(200, 120, BOITES);
    expect(d.R).toBeGreaterThanOrEqual(40);
    expect(Object.keys(d.etiquettes)).toHaveLength(6);
  });
});
