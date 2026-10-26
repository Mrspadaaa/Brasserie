// @vitest-environment jsdom
// Voie t15b-comparer-app (#174) : Comparer (cmc2k, son choix) vit dans l'app, une seule copie (src/ui/hopIndex/comparer/).
// La couche hopCompare le monte sur le brouillon du wizard (pont porte.ts), « Placer » écrit par la porte unique
// (un patch de `hops`) puis ouvre Dryhopper ; drapeau éteint, la couche provisoire reste. Stockage simulé : aucune donnée
// réelle, aucun appel Gemini.
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

import EcranComparerApp from '../../../src/ui/hopIndex/comparer/EcranApp';
import { poserPorteEtape } from '../../../src/ui/hopIndex/comparer/porte';
import { poserOuvreurCouche } from '../../../src/ui/hopIndex/ouvrirCouche';
import type { ChangementHoublonsV4 } from '../../../src/domain/hopIndex/v4/recipeConversion';
import type { LayerRoute } from '../../../src/pages/useFullScreenRoute';

const RECETTE = {
  id: 'REC-T15', name: 'Stout export', style: '16D', volumeL: 20, boilMin: 60, ogTarget: 1.066, colorEbc: 70,
  fermentables: [], hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;
const HOUBLONS = ['beermaverick-cascade', 'beermaverick-idaho-7', 'beermaverick-galaxy'];

beforeAll(() => {
  // jsdom n'a pas ResizeObserver (la colonne retenue est mesurée) ni matchMedia.
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => { cleanup(); poserPorteEtape(null); poserOuvreurCouche(null); });

const poser = (onChange: (c: ChangementHoublonsV4) => void = () => {}, recipe: Recipe = RECETTE) =>
  poserPorteEtape({ recipe, boilOg: 1.066, draftId: 'REC-T15', onChange });

describe('Comparer dans l\'app (T15b)', () => {
  it('s\'ouvre sur les houblons de la route et le brouillon ouvert dessous, sans les mots du cas S1', async () => {
    poser();
    const { container } = render(<EcranComparerApp houblons={HOUBLONS} onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-ecran="comparer"]')).not.toBeNull());
    expect(container.querySelector('h1')?.textContent).toMatch(/Cascade, Idaho 7 ou Galaxy pour ma bière \?/);
    expect(container.textContent).not.toMatch(/stout|18\.10/i);
    // 16D est le style du brouillon (pas un mot figé) ; sans dégustation, la demande ne cite aucune date.
    expect(container.querySelector('[data-role="quand-comparer"]')).not.toBeNull();
  });

  it('un changement de moment (60′) recalcule les colonnes sans rien écrire', async () => {
    const changements: ChangementHoublonsV4[] = [];
    poser((c) => changements.push(c));
    const { container } = render(<EcranComparerApp houblons={HOUBLONS} onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-moment="60"]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-moment="60"]')!);
    await waitFor(() => expect(container.querySelector('[data-moment="60"][aria-checked="true"]')).not.toBeNull());
    expect(changements).toHaveLength(0);
  });

  it('« Placer » écrit un patch de hops par la porte unique, puis ouvre Dryhopper sur l\'ajout neuf', async () => {
    const changements: ChangementHoublonsV4[] = [];
    const couches: LayerRoute[] = [];
    poserOuvreurCouche((r) => couches.push(r));
    poser((c) => changements.push(c));
    const { container } = render(<EcranComparerApp houblons={HOUBLONS} onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-role="pont-placer"]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-role="pont-placer"]')!);
    expect(changements).toHaveLength(1);
    expect(changements[0].draftId).toBe('REC-T15');
    const hops = changements[0].patch.hops;
    expect(hops).toHaveLength(2);
    expect(hops[0].name).toBe('Nugget');
    expect(hops[1]).toMatchObject({ stage: 'dryHop', aromaTiming: 'fermentation', weightG: 80 });
    expect(couches).toEqual([{ view: 'hopTiming', recipeId: 'REC-T15', additionId: 'a2' }]);
  });

  it('un refus de la porte est dit et n\'ouvre rien', async () => {
    const couches: LayerRoute[] = [];
    poserOuvreurCouche((r) => couches.push(r));
    poser(() => { throw new Error('Ce brouillon est conservé en lecture seule; aucun outil ne le remplace.'); });
    const { container } = render(<EcranComparerApp houblons={HOUBLONS} onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-role="pont-placer"]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-role="pont-placer"]')!);
    await waitFor(() => expect(container.querySelector('[data-role="comparer-erreur"]')?.textContent).toContain('lecture seule'));
    expect(couches).toEqual([]);
  });

  it('sans brouillon dessous (ou un autre), il le dit et n\'écrit rien', () => {
    const { container } = render(<EcranComparerApp houblons={HOUBLONS} onClose={() => {}} />);
    expect(container.querySelector('[data-role="comparer-sans-brouillon"]')).not.toBeNull();
    act(() => { poser(); });
    const autre = render(<EcranComparerApp houblons={HOUBLONS} recipeId="AUTRE" onClose={() => {}} />);
    expect(autre.container.querySelector('[data-role="comparer-sans-brouillon"]')).not.toBeNull();
  });
});

describe('Comparer dans l\'app : drapeau et structure', () => {
  const racine = path.resolve(__dirname, '../../..');
  const lire = (f: string) => fs.readFileSync(path.join(racine, f), 'utf8');
  it('la couche monte le vrai écran paresseusement, drapeau hopV4 allumé seulement', () => {
    const couche = lire('src/ui/hopIndex/HopToolLayer.tsx');
    expect(couche).toMatch(/lazy\(\(\) => import\('\.\/comparer\/EcranApp'\)\)/);
    expect(couche).toMatch(/route\.view === 'hopCompare' && comparerActif/);
  });
  it('le wizard pose la porte (applyHopV4Change) seulement drapeau allumé, et la retire à sa fermeture', () => {
    const w = lire('src/pages/BrewWizard.tsx');
    expect(w).toMatch(/if \(!hopV4Actif\) return;\s+poserPorteEtape\(\{ recipe: build\(\), boilOg, draftId: draftRecipeId, onChange: applyHopV4Change \}\)/);
    expect(w).toMatch(/poserPorteEtape\(null\)/);
  });
  it('le démarrage n\'importe aucun écran de Comparer (hors la porte, légère)', () => {
    for (const f of ['src/App.tsx', 'src/pages/BrewWizard.tsx']) {
      const imports = lire(f).split('\n').filter((l) => /^import .*comparer/.test(l));
      expect(imports.every((l) => /comparer\/porte'/.test(l))).toBe(true);
    }
  });
});
