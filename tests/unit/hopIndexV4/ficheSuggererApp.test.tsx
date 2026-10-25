// @vitest-environment jsdom
// Voie t13-fiche-suggerer (#173) : la fiche du houblon (g1 + matrice flb5b) et Suggérer (q2b) vivent dans l'app, une seule copie
// (src/ui/hopIndex/fiche/, suggerer/). La couche hopSuggest monte Suggérer sur le brouillon du wizard (pont comparer/porte.ts),
// « Appliquer » (mode Radar) écrit par la porte unique, « Comparer (n) » ouvre hopCompare ; la fiche s'ouvre par l'appui long
// (feuille). Stockage simulé : aucune donnée réelle, aucun appel Gemini.
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

import EcranSuggererApp from '../../../src/ui/hopIndex/suggerer/EcranApp';
import { ContexteFicheApp, FicheDeLApp } from '../../../src/ui/hopIndex/fiche/FicheApp';
import { fixerComparaison, lireComparaison, viderComparaison } from '../../../src/ui/hopIndex/fiche/comparaison';
import { poserPorteEtape } from '../../../src/ui/hopIndex/comparer/porte';
import { poserOuvreurCouche } from '../../../src/ui/hopIndex/ouvrirCouche';
import { lireBiere } from '../../../src/ui/hopIndex/parcours/adaptateur';
import { toHopRecipe } from '../../../src/domain/hopIndex/v4/recipeConversion';
import type { ChangementHoublonsV4 } from '../../../src/domain/hopIndex/v4/recipeConversion';
import type { LayerRoute } from '../../../src/pages/useFullScreenRoute';

const RECETTE = {
  id: 'REC-T13', name: 'Stout export', style: '16D', volumeL: 20, boilMin: 60, ogTarget: 1.066, colorEbc: 70,
  fermentables: [], hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => { cleanup(); poserPorteEtape(null); poserOuvreurCouche(null); viderComparaison(); });

const poser = (onChange: (c: ChangementHoublonsV4) => void = () => {}) =>
  poserPorteEtape({ recipe: RECETTE, boilOg: 1.066, draftId: 'REC-T13', onChange });

describe('Suggérer dans l\'app (T13)', () => {
  it('s\'ouvre sur le brouillon ouvert dessous : tête à onglets, voies du moteur, « Comparer (n) »', async () => {
    poser();
    const { container } = render(<EcranSuggererApp onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-ecran="suggerer"]')).not.toBeNull());
    expect(container.querySelector('[data-onglet="suggerer"][aria-selected="true"]')).not.toBeNull();
    await waitFor(() => expect(container.querySelector('[data-role="pont-comparer"]')).not.toBeNull());
    // Rien de la maquette dans l'app : pas de crochet de cas ni de crochet de test posé sur la page.
    expect(document.body.dataset.cas).toBeUndefined();
    expect((window as unknown as { __suggerer?: unknown }).__suggerer).toBeUndefined();
  });

  it('« Comparer (n) » ouvre la route hopCompare avec les houblons retenus', async () => {
    const couches: LayerRoute[] = [];
    poserOuvreurCouche((r) => couches.push(r));
    poser();
    fixerComparaison(['beermaverick-cascade', 'beermaverick-idaho-7']);
    const { container } = render(<EcranSuggererApp onClose={() => {}} />);
    const pont = await waitFor(() => { const b = container.querySelector<HTMLButtonElement>('[data-role="pont-comparer"]'); expect(b?.disabled).toBe(false); return b!; });
    fireEvent.click(pont);
    expect(couches).toEqual([{ view: 'hopCompare', recipeId: 'REC-T13', hops: ['beermaverick-cascade', 'beermaverick-idaho-7'] }]);
    expect(lireComparaison()).toHaveLength(2);
  });

  it('« Appliquer » (mode Radar) écrit un patch de hops par la porte unique', async () => {
    const changements: ChangementHoublonsV4[] = [];
    poser((c) => changements.push(c));
    const { container } = render(<EcranSuggererApp onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-lecture] [role="radio"][data-e="radar"]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-lecture] [role="radio"][data-e="radar"]')!);
    const appliquer = await waitFor(() => { const b = container.querySelector<HTMLButtonElement>('[data-action="appliquer"]'); expect(b).not.toBeNull(); return b!; });
    fireEvent.click(appliquer);
    expect(changements.length).toBeGreaterThanOrEqual(1);
    expect(changements.every((c) => c.draftId === 'REC-T13')).toBe(true);
    expect(changements.at(-1)!.patch.hops.length).toBeGreaterThanOrEqual(1);
  });

  it('un refus de la porte est dit', async () => {
    poser(() => { throw new Error('Ce brouillon est conservé en lecture seule; aucun outil ne le remplace.'); });
    const { container } = render(<EcranSuggererApp onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-lecture] [role="radio"][data-e="radar"]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-lecture] [role="radio"][data-e="radar"]')!);
    const appliquer = await waitFor(() => { const b = container.querySelector<HTMLButtonElement>('[data-action="appliquer"]'); expect(b).not.toBeNull(); return b!; });
    fireEvent.click(appliquer);
    await waitFor(() => expect(container.querySelector('[data-role="suggerer-erreur"]')?.textContent).toContain('lecture seule'));
  });

  it('sans brouillon dessous (ou un autre), il le dit et n\'écrit rien', () => {
    const { container } = render(<EcranSuggererApp onClose={() => {}} />);
    expect(container.querySelector('[data-role="suggerer-sans-brouillon"]')).not.toBeNull();
    act(() => { poser(); });
    const autre = render(<EcranSuggererApp recipeId="AUTRE" onClose={() => {}} />);
    expect(autre.container.querySelector('[data-role="suggerer-sans-brouillon"]')).not.toBeNull();
  });
});

describe('La fiche du houblon dans l\'app (T13)', () => {
  const recette = () => toHopRecipe(RECETTE, { boilOg: 1.066 }).recette;

  it('s\'ouvre en feuille sur un houblon : son nom, son α, son radar, sa matrice', async () => {
    render(<ContexteFicheApp valeur={{ recette: recette(), draftId: 'REC-T13' }}><FicheDeLApp houblon="beermaverick-cascade" onFermer={() => {}} /></ContexteFicheApp>);
    await waitFor(() => expect(document.querySelector('[data-ecran="fiche"]')).not.toBeNull());
    const f = document.querySelector('[data-ecran="fiche"]')!;
    expect(f.getAttribute('data-houblon-ouvert')).toBe('beermaverick-cascade');
    expect(document.querySelector('[role="dialog"]')?.textContent).toMatch(/Cascade/);
    expect(f.querySelector('[data-role="fiche-alpha"]')).not.toBeNull();
    expect(lireBiere(recette())).toBeTruthy();
  });

  it('« Comparer » retient le houblon, ferme la feuille et ouvre hopCompare', async () => {
    const couches: LayerRoute[] = [];
    poserOuvreurCouche((r) => couches.push(r));
    let fermee = 0;
    render(<ContexteFicheApp valeur={{ recette: recette(), draftId: 'REC-T13' }}><FicheDeLApp houblon="beermaverick-cascade" onFermer={() => { fermee += 1; }} /></ContexteFicheApp>);
    const bouton = await waitFor(() => { const b = document.querySelector<HTMLButtonElement>('[data-role="pont-comparer-fiche"]'); expect(b).not.toBeNull(); return b!; });
    fireEvent.click(bouton);
    expect(lireComparaison()).toEqual(['beermaverick-cascade']);
    expect(fermee).toBe(1);
    expect(couches).toEqual([{ view: 'hopCompare', recipeId: 'REC-T13', hops: ['beermaverick-cascade'] }]);
  });
});

describe('Fiche et Suggérer dans l\'app : drapeau et structure', () => {
  const racine = path.resolve(__dirname, '../../..');
  const lire = (f: string) => fs.readFileSync(path.join(racine, f), 'utf8');
  it('la couche monte le vrai Suggérer paresseusement, drapeau hopV4 allumé seulement', () => {
    const couche = lire('src/ui/hopIndex/HopToolLayer.tsx');
    expect(couche).toMatch(/lazy\(\(\) => import\('\.\/suggerer\/EcranApp'\)\)/);
    expect(couche).toMatch(/route\.view === 'hopSuggest' && comparerActif/);
  });
  it('le démarrage n\'importe ni la fiche ni Suggérer', () => {
    for (const f of ['src/App.tsx', 'src/pages/BrewWizard.tsx']) {
      const imports = lire(f).split('\n').filter((l) => /^import .*hopIndex\/(fiche|suggerer)/.test(l));
      expect(imports).toEqual([]);
    }
  });
  it('l\'écran ne lit rien de la maquette : aucun import de prototypes/ dans fiche/ et suggerer/', () => {
    for (const d of ['src/ui/hopIndex/fiche', 'src/ui/hopIndex/suggerer', 'src/ui/hopIndex/substituer']) {
      for (const f of fs.readdirSync(path.join(racine, d)).filter((x) => /\.(ts|tsx)$/.test(x))) {
        expect(lire(`${d}/${f}`), `${d}/${f}`).not.toMatch(/from '[^']*prototypes\//);
      }
    }
  });
});
