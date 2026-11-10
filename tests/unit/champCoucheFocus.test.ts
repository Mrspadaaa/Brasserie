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
  it('les champs Empâtage et Rinçage sont séparés d’au moins deux fois cette portée', () => {
    const src = lire('src/ui/water/WaterVolumes.tsx');
    const classe = src.match(/flex flex-wrap items-center (gap-x-\d+) gap-y-1\.5/)?.[1] ?? '';
    expect(px(classe), `écart ${classe}`).toBeGreaterThanOrEqual(2 * portee);
  });
});
