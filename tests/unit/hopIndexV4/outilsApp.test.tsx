// @vitest-environment jsdom
// Voie t15c-outils (#174) : Substituer (u4), Dryhopper (p4b2f) et Levure (sa feuille « Souche ») vivent dans l'app (src/ui/hopIndex/
// substituer, dryhopper, levure), une seule copie de chaque écran. Les couches hopSubstitute et hopTiming les montent sur le brouillon
// du wizard (pont comparer/porte.ts) ; leur brouillon d'outil est une copie : « Remplacer » et « Ajouter à ma bière » écrivent par
// la porte unique (un patch de `hops`, `yeast`), « Annuler » et la croix n'écrivent rien. Stockage simulé : aucune donnée réelle,
// aucun appel Gemini.
import fs from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';

vi.mock('../../../src/services/storage', () => ({
  StorageService: {
    subscribe: () => () => {},
    getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }),
    getBatches: () => [],
    getHopTastings: () => [],
  },
}));

import EcranTimingApp from '../../../src/ui/hopIndex/dryhopper/EcranApp';
import EcranSubstituerApp from '../../../src/ui/hopIndex/substituer/EcranApp';
import { poserPorteEtape } from '../../../src/ui/hopIndex/comparer/porte';
import { poserOuvreurCouche } from '../../../src/ui/hopIndex/ouvrirCouche';
import type { ChangementHoublonsV4 } from '../../../src/domain/hopIndex/v4/recipeConversion';
import type { LayerRoute } from '../../../src/pages/useFullScreenRoute';

const RECETTE = {
  id: 'REC-T15C', name: 'Pale du jeudi', style: '18B', volumeL: 20, boilMin: 60, ogTarget: 1.056, colorEbc: 20,
  fermentables: [],
  hops: [
    { name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 },
    { name: 'Cascade', alpha: 6, weightG: 80, stage: 'dryHop', aromaTiming: 'fermentation', aromaContactHours: 72 },
  ],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;
const NUGGET = 'beermaverick-nugget';

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView ??= () => {};
});
afterEach(() => { cleanup(); poserPorteEtape(null); poserOuvreurCouche(null); });

const poser = (onChange: (c: ChangementHoublonsV4) => void = () => {}, recipe: Recipe = RECETTE) =>
  poserPorteEtape({ recipe, boilOg: 1.056, draftId: 'REC-T15C', onChange });

describe('Substituer dans l\'app (T15c)', () => {
  it('s\'ouvre sur le houblon de la route, au 60′ du brouillon, sans les mots du cas S1', async () => {
    poser();
    const { container } = render(<EcranSubstituerApp hopKey={NUGGET} onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-ecran="substituer"]')).not.toBeNull());
    expect(container.querySelector('h1')?.textContent).toBe('Nugget');
    expect(container.querySelector('[data-role="puce-moment"]')).not.toBeNull();
    expect(container.textContent).not.toMatch(/stout|18\.10/i);
  });

  it('« Remplacer » écrit un patch de hops par la porte unique, puis ferme la couche', async () => {
    const changements: ChangementHoublonsV4[] = [];
    const fermetures: number[] = [];
    poser((c) => changements.push(c));
    const { container } = render(<EcranSubstituerApp hopKey={NUGGET} onClose={() => fermetures.push(1)} />);
    await waitFor(() => expect(container.querySelector('[data-role="pont-remplacer"]:not([disabled])')).not.toBeNull());
    expect(changements).toHaveLength(0);
    fireEvent.click(container.querySelector('[data-role="pont-remplacer"]')!);
    expect(changements).toHaveLength(1);
    expect(changements[0].draftId).toBe('REC-T15C');
    const hops = changements[0].patch.hops;
    expect(hops).toHaveLength(2);
    expect(hops[0].name).not.toBe('Nugget');
    expect(hops[1].name).toBe('Cascade');
    expect(fermetures).toHaveLength(1);
  });

  it('« Annuler » et la croix ferment sans rien écrire', async () => {
    const changements: ChangementHoublonsV4[] = [];
    const fermetures: number[] = [];
    poser((c) => changements.push(c));
    const { container } = render(<EcranSubstituerApp hopKey={NUGGET} onClose={() => fermetures.push(1)} />);
    await waitFor(() => expect(container.querySelector('[data-role="annuler"]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-role="annuler"]')!);
    fireEvent.click(container.querySelector('[data-role="retour"]')!);
    expect(changements).toHaveLength(0);
    expect(fermetures).toHaveLength(2);
  });

  it('un refus de la porte est dit, et l\'outil reste ouvert', async () => {
    const fermetures: number[] = [];
    poser(() => { throw new Error('Ce brouillon est conservé en lecture seule; aucun outil ne le remplace.'); });
    const { container } = render(<EcranSubstituerApp hopKey={NUGGET} onClose={() => fermetures.push(1)} />);
    await waitFor(() => expect(container.querySelector('[data-role="pont-remplacer"]:not([disabled])')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-role="pont-remplacer"]')!);
    await waitFor(() => expect(container.querySelector('[data-role="outil-erreur"]')?.textContent).toContain('lecture seule'));
    expect(fermetures).toHaveLength(0);
  });

  it('un houblon absent du brouillon, ou pas de brouillon dessous : il le dit et n\'écrit rien', () => {
    const { container } = render(<EcranSubstituerApp hopKey={NUGGET} onClose={() => {}} />);
    expect(container.querySelector('[data-role="outil-sans-brouillon"]')).not.toBeNull();
    act(() => { poser(); });
    const absent = render(<EcranSubstituerApp hopKey="beermaverick-galaxy" onClose={() => {}} />);
    expect(absent.container.querySelector('[data-role="outil-sans-ajout"]')).not.toBeNull();
    const autre = render(<EcranSubstituerApp hopKey={NUGGET} recipeId="AUTRE" onClose={() => {}} />);
    expect(autre.container.querySelector('[data-role="outil-sans-brouillon"]')).not.toBeNull();
  });
});

describe('Dryhopper et Levure dans l\'app (T15c)', () => {
  it('Dryhopper s\'ouvre sur l\'ajout a2 (Cascade) et dit les mots de sa bière, jamais ceux de la stout', async () => {
    poser();
    const { container } = render(<EcranTimingApp additionId="a2" onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-ecran="dryhopper"]')).not.toBeNull());
    expect(container.querySelector('h1')?.textContent).toBe('Quand ajouter Cascade ?');
    expect(container.textContent).toMatch(/Face à ta bière/);
    expect(container.textContent).not.toMatch(/stout|Idaho|18\.10/i);
    expect(container.querySelector('[data-role="reglage"]')).not.toBeNull();
  });

  it('un geste de moment ne réécrit pas le wizard ; « Levure › » puis « Ajouter à ma bière » écrit hops et levure en un patch', async () => {
    const changements: ChangementHoublonsV4[] = [];
    const fermetures: number[] = [];
    poser((c) => changements.push(c));
    const { container } = render(<EcranTimingApp additionId="a2" onClose={() => fermetures.push(1)} />);
    await waitFor(() => expect(container.querySelector('[data-etape="1"]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-etape="1"]')!);
    await waitFor(() => expect(container.querySelector('[data-etape="1"][aria-current="true"]')).not.toBeNull());
    expect(changements).toHaveLength(0);
    fireEvent.click(container.querySelector('[data-role="pont-levure"]')!);
    await waitFor(() => expect(container.querySelector('[data-ecran="levure"]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-levure="lalbrew-pomona"]')!);
    await waitFor(() => expect(container.querySelector('[data-levure="lalbrew-pomona"][aria-checked="true"]')).not.toBeNull());
    expect(changements).toHaveLength(0);
    fireEvent.click(container.querySelector('[data-role="pont-ajouter"]')!);
    expect(changements).toHaveLength(1);
    const { patch } = changements[0];
    expect(patch.hops[1]).toMatchObject({ name: 'Cascade', stage: 'whirlpool' });
    expect(patch.yeast).toMatchObject({ hopIndexId: 'lalbrew-pomona' });
    expect(fermetures).toHaveLength(1);
  });

  it('`step: yeast` ouvre la feuille Souche ; « Quand » revient à Dryhopper dans la même couche', async () => {
    poser();
    const { container } = render(<EcranTimingApp additionId="a2" step="yeast" onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-ecran="levure"]')).not.toBeNull());
    expect(container.querySelector('h1')?.textContent).toBe('Et avec quelle levure ?');
    expect(container.textContent).not.toMatch(/stout|Idaho/i);
    fireEvent.click(Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Quand')!);
    await waitFor(() => expect(container.querySelector('[data-ecran="dryhopper"]')).not.toBeNull());
  });

  it('« Annuler » ferme sans rien écrire ; un ajout absent est dit', async () => {
    const changements: ChangementHoublonsV4[] = [];
    const fermetures: number[] = [];
    poser((c) => changements.push(c));
    const { container } = render(<EcranTimingApp additionId="a2" onClose={() => fermetures.push(1)} />);
    await waitFor(() => expect(container.querySelector('[data-role="annuler"]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-role="annuler"]')!);
    expect(changements).toHaveLength(0);
    expect(fermetures).toHaveLength(1);
    const absent = render(<EcranTimingApp additionId="a9" onClose={() => {}} />);
    expect(absent.container.querySelector('[data-role="outil-sans-ajout"]')).not.toBeNull();
  });
});

describe('Outils à brouillon : drapeau et structure', () => {
  const racine = path.resolve(__dirname, '../../..');
  const lire = (f: string) => fs.readFileSync(path.join(racine, f), 'utf8');
  it('la couche monte les vrais écrans paresseusement, drapeau hopV4 allumé seulement', () => {
    const couche = lire('src/ui/hopIndex/HopToolLayer.tsx');
    expect(couche).toMatch(/lazy\(\(\) => import\('\.\/dryhopper\/EcranApp'\)\)/);
    expect(couche).toMatch(/lazy\(\(\) => import\('\.\/substituer\/EcranApp'\)\)/);
    expect(couche).toMatch(/route\.view === 'hopTiming' && comparerActif/);
    expect(couche).toMatch(/route\.view === 'hopSubstitute' && comparerActif/);
  });
  it('les écrans n\'emploient jamais type="number" et ne lisent rien de la maquette', () => {
    for (const f of ['substituer/index.tsx', 'dryhopper/index.tsx', 'levure/index.tsx', 'dryhopper/outilApp.tsx']) {
      const s = lire(`src/ui/hopIndex/${f}`);
      expect(s).not.toMatch(/type="number"|type='number'/);
      expect(s).not.toMatch(/prototypes\//);
    }
  });
  it('le démarrage n\'importe aucun de ces écrans', () => {
    for (const f of ['src/App.tsx', 'src/pages/BrewWizard.tsx']) {
      const imports = lire(f).split('\n').filter((l) => /^import .*(dryhopper|levure|substituer)/.test(l));
      expect(imports).toEqual([]);
    }
  });
});
