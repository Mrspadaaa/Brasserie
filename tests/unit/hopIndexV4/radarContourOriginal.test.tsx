// D156 (26.10) : « sur le radargraph, on voit pas Galaxy ». Un remplaçant qui décrit les mêmes familles aux mêmes niveaux que
// l'original (trois crans seulement) le recouvrait : le contour seul était dessiné dessous. Il se dessine au-dessus, ses
// sommets en anneaux creux. Le contrôle Chrome au pixel : tests/integration/controle-contour-original.mjs.
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RadarBase, type SerieRadar } from '../../../src/ui/hopIndex/commun/RadarBase';
import type { FamilyId } from '../../../src/domain/hopIndex/v4';

const FAMILLES: FamilyId[] = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
const memes = { citrus: 1, tropical: 2, stoneFruit: 1 };
const serie = (cle: string, role: SerieRadar['role'], couleur: string, valeurs = memes): SerieRadar => ({ cle, nom: cle, couleur, role, valeurs });

function rendre(series: SerieRadar[]) {
  return renderToStaticMarkup(
    <RadarBase familles={FAMILLES} mode="absolu" objet="houblons" label="radar" echelleAbsolue={{ pas: 1, nb: 2, etiquettes: ['0', 'cité', 'marqué'] }} series={series} />,
  );
}
const rang = (html: string, nom: string) => html.indexOf(`data-serie="${nom}"`);

describe('radar commun : le contour de l\'original', () => {
  it('est dessiné au-dessus des remplaçants, même passé en premier', () => {
    const html = rendre([serie('Galaxy', 'contour', '#4d4d4d'), serie('Nectaron', 'retenu', '#0072B2'), serie('Citra cryo', 'autre', '#009E73')]);
    expect(rang(html, 'Citra cryo')).toBeGreaterThan(-1);
    expect(rang(html, 'Citra cryo')).toBeLessThan(rang(html, 'Nectaron'));
    expect(rang(html, 'Nectaron')).toBeLessThan(rang(html, 'Galaxy'));
  });

  it('marque chaque sommet de l\'original d\'un anneau creux de 6,2 de rayon, trait fin ≥ 1,5', () => {
    const html = rendre([serie('Galaxy', 'contour', '#4d4d4d'), serie('Nectaron', 'retenu', '#0072B2')]);
    const g = html.slice(rang(html, 'Galaxy'));
    const anneaux = g.match(/<circle[^>]*data-point="[a-zA-Z]+"[^>]*>/g) ?? [];
    expect(anneaux).toHaveLength(3);
    for (const c of anneaux) { expect(c).toContain('r="6.2"'); expect(c).toContain('fill="none"'); expect(c).toContain('stroke="#4d4d4d"'); }
    const trait = g.match(/stroke-width="([\d.]+)"/g) ?? [];
    expect(trait.some((t) => Number(/"([\d.]+)"/.exec(t)![1]) >= 1.5)).toBe(true);
  });

  it('laisse le point plein du remplaçant, et garde le contour seul d\'une série unique comme avant', () => {
    const duo = rendre([serie('Galaxy', 'contour', '#4d4d4d'), serie('Nectaron', 'retenu', '#0072B2')]);
    const pointsNectaron = (duo.slice(rang(duo, 'Nectaron'), rang(duo, 'Galaxy')).match(/<circle[^>]*r="4"[^>]*>/g) ?? []);
    expect(pointsNectaron).toHaveLength(3);
    const seul = rendre([serie('ma bière', 'contour', '#3d3d47')]);
    expect(seul).not.toContain('r="6.2"');
    expect(seul).toContain('r="3"');
  });
});
