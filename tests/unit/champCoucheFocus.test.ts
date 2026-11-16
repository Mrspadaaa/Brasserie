// VI-6 (rejeu b47cd90b n° 6) : Eau et sels, champ « Rinçage » au focus : l'anneau de focus recouvrait la fin du mot « Rinçage » et le « L » d'unité, et les champs
// Empâtage / Rinçage se touchaient à 1280. Le focus de l'app (index.css) déborde de 2 px de trait + 2 px de décalage = 4 px autour du champ : l'étiquette, le champ
// et l'unité doivent être séparés de plus que cela. jsdom ne mesure pas la mise en page : le test lit les valeurs de la feuille et des classes.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const lire = (f: string) => readFileSync(`${process.cwd()}/${f}`, 'utf8');
const css = lire('src/index.css');
const px = (classe: string) => ({ 'gap-1': 4, 'gap-1.5': 6, 'gap-2': 8, 'gap-3': 12, 'gap-4': 16, 'gap-5': 20, 'gap-x-3': 12, 'gap-x-4': 16, 'gap-x-5': 20 } as Record<string, number>)[classe];

describe('champ numérique couché : l’anneau de focus ne recouvre ni l’étiquette ni l’unité', () => {
  const portee = (() => {
    const bloc = css.match(/:focus-visible\s*\{([^}]*)\}/)?.[1] ?? '';
    const trait = Number(bloc.match(/outline:\s*(\d+)px/)?.[1]);
    const decalage = Number(bloc.match(/outline-offset:\s*(\d+)px/)?.[1]);
    return trait + decalage;
  })();

  it('la portée du focus est lue dans la feuille (4 px)', () => {
    expect(portee).toBe(4);
  });
  it('l’écart étiquette · champ · unité de InlineNum dépasse cette portée', () => {
    const src = lire('src/ui/FormNav.tsx');
    const classe = src.match(/<label className="flex items-center (gap-[\d.]+) min-w-0">/)?.[1] ?? '';
    expect(px(classe), `écart ${classe}`).toBeGreaterThan(portee);
  });
  // Eau w1b (15.11) : les deux champs vivent dans deux cuves côte à côte (`.ew-cuves`, eau.css) ; l'écart entre cuves remplace l'ancien `gap-x-5`.
  it('les cuves Empâtage et Rinçage, qui portent chacune son champ, sont séparées d’au moins deux fois cette portée', () => {
    const tsx = lire('src/ui/water/WaterVolumes.tsx');
    expect(tsx).toMatch(/<section className="ew-cuves"[^>]*>[\s\S]*aria-label="Cuve d’empâtage"[\s\S]*aria-label="Cuve de rinçage"/);
    expect(tsx).toContain('id="wz-mash-water"');
    const eau = lire('src/ui/water/eau.css');
    const ecart = Number(eau.match(/\.ew-cuves\s*\{[^}]*?\bgap:\s*(\d+)px/)?.[1]);
    expect(ecart, `écart entre cuves ${ecart}`).toBeGreaterThanOrEqual(2 * portee);
  });
  it('le champ de volume de l’onglet Eau ne trace pas d’anneau qui recouvrirait le « L » : le focus est un trait plus épais sous le champ', () => {
    const eau = lire('src/ui/water/eau.css');
    const regle = eau.match(/\.ew-in\.ew-in:focus\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(regle).toMatch(/outline:\s*none/);
    expect(regle).toMatch(/border-bottom:\s*2px solid/);
  });
});
