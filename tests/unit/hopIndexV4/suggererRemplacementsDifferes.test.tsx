// @vitest-environment jsdom
// Voie f4-cout-et-usage (D106) : Suggérer s'ouvre sans les remplacements « à IBU égal » (le premier affichage ne les calcule pas) ; le groupe « Remplacer … » arrive ensuite, au repos,
// à sa place, sans rien déplacer de la liste principale. Stockage simulé : aucune donnée réelle, aucun appel Gemini.
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
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
import { poserPorteEtape } from '../../../src/ui/hopIndex/comparer/porte';
import { poserVisee } from '../../../src/ui/hopIndex/parcours/visee';
import { viderComparaison } from '../../../src/ui/hopIndex/fiche/comparaison';
import { toHopRecipe } from '../../../src/domain/hopIndex/v4/recipeConversion';
import { calcul } from '../../../src/ui/hopIndex/parcours/calcul';
import type { RecetteParcours } from '../../../src/ui/hopIndex/parcours/types';
import { oublierChauffe, prechauffer } from '../../../src/ui/hopIndex/suggerer/prechauffe';
import { oublierAutorisations, PLACE_REMPLACER_PX } from '../../../src/ui/hopIndex/suggerer/differe';

const RECETTE = {
  id: 'REC-D106', name: 'Stout export', style: '16D', volumeL: 20, boilMin: 60, ogTarget: 1.066, colorEbc: 70,
  fermentables: [], hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => { cleanup(); poserPorteEtape(null); poserVisee(null); viderComparaison(); vi.restoreAllMocks(); });
beforeEach(() => { oublierChauffe(); oublierAutorisations(); });

const groupes = (c: HTMLElement) => [...c.querySelectorAll('[data-groupe]')].map((g) => g.getAttribute('data-groupe')!);
const lignes = (c: HTMLElement) => [...c.querySelectorAll('[data-groupe]:not([data-groupe="remplacer"]) [data-id]')].map((l) => l.getAttribute('data-id')!);
// Le « repos » du navigateur est piloté par le test (requestIdleCallback absent de jsdom) : le calcul différé ne part que quand on le décide, sans dépendre d'un délai.
type Idle = { requestIdleCallback?: (f: () => void) => number; cancelIdleCallback?: (n: number) => void };
const file: (() => void)[] = [];
beforeEach(() => { file.length = 0; (window as unknown as Idle).requestIdleCallback = (f) => file.push(f); (window as unknown as Idle).cancelIdleCallback = () => {}; });
afterEach(() => { delete (window as unknown as Idle).requestIdleCallback; delete (window as unknown as Idle).cancelIdleCallback; });
const auRepos = () => act(() => { file.splice(0).forEach((f) => f()); });
async function ouvrirAvecVisee(visee: Record<string, number>) {
  poserPorteEtape({ recipe: RECETTE, boilOg: 1.066, draftId: 'REC-D106', onChange: () => {} });
  const r = render(<EcranSuggererApp onClose={() => {}} />);
  await waitFor(() => expect(r.container.querySelector('[data-role="suggerer-sans-visee"]')).not.toBeNull());
  act(() => { poserVisee(visee); });
  await waitFor(() => expect(r.container.querySelector('[aria-label="Objectifs"]')).not.toBeNull());
  return r.container;
}

describe('Suggérer : les remplacements arrivent après le premier affichage (D106)', () => {
  // D108 (f6) : une visée « moins de… » se lit dans les remplacements : l'appel complet est calculé d'emblée, le groupe « Remplacer » est là au premier rendu, rien n'arrive après (0 px de saut).
  it('« moins résineux » : le groupe « Remplacer » est au premier rendu, avant la levure, et le repos du navigateur ne change rien', async () => {
    const container = await ouvrirAvecVisee({ resin: 0 });
    const avant = groupes(container);
    expect(avant).toContain('remplacer'); // calculé d'emblée
    const suivants = ['dryhop', 'levure'].map((x) => avant.indexOf(x)).filter((i) => i >= 0);
    for (const i of suivants) expect(avant.indexOf('remplacer')).toBeLessThan(i); // sa place : avant le dry hop et la levure
    await auRepos();
    expect(groupes(container)).toEqual(avant); // aucune arrivée
  });

  it('« plus floral », à froid (aucune préchauffe) : la liste principale du premier affichage est celle de l\'appel complet (rien ne bouge quand il arrive), et la place du groupe « Remplacer » est réservée', async () => {
    const container = await ouvrirAvecVisee({ floral: 2.5 });
    const avant = lignes(container);
    expect(avant.length).toBeGreaterThan(0); // témoin positif : une liste à comparer
    expect(file.length).toBeGreaterThan(0); // l'appel complet attend le repos
    const place = container.querySelector<HTMLElement>('[data-groupe="remplacer-place"]');
    expect(place).not.toBeNull(); // D111 : sans préchauffe, la place est tenue
    expect(place!.style.minHeight).toBe(`${PLACE_REMPLACER_PX}px`);
    await auRepos(); // le complet arrive : on relit
    expect(lignes(container)).toEqual(avant);
  });

  // D111 (f7) : la préchauffe a eu lieu pour cette recette (les apports sont chauds) : l'appel complet est lu d'emblée, même pour « plus de… ». Aucune arrivée, aucune place réservée.
  it('« plus floral », après la préchauffe : tout est là au premier rendu (groupe « Remplacer » compris), rien ne part au repos, aucune place réservée', async () => {
    vi.spyOn(calcul(), 'prechauffer').mockResolvedValue();
    prechauffer(toHopRecipe(RECETTE, {}).recette as RecetteParcours);
    await auRepos(); // la préchauffe part : les apports de la recette sont chauffés
    expect(file.length).toBe(0);
    const container = await ouvrirAvecVisee({ floral: 2.5 });
    const avant = groupes(container);
    const lignesAvant = lignes(container);
    expect(lignesAvant.length).toBeGreaterThan(0);
    expect(file.length).toBe(0); // aucun appel différé : rien n'arrivera
    expect(avant).not.toContain('remplacer-place'); // aucun vide réservé
    await auRepos();
    expect(groupes(container)).toEqual(avant);
    expect(lignes(container)).toEqual(lignesAvant);
  });
});
