// @vitest-environment jsdom
// Voie p6-ma-biere-app (#174) : avec une VRAIE dégustation de la recette (celle de ses brassins, lue par useHopData), Ma bière dans
// l'app écrit sa vraie date (« dégusté 18.10 », pas celle de la fixture), la famille goûtée au-dessus du style en alerte, le radar
// noté d'après elle ; les familles qu'il n'a pas goûtées restent « pas goûté » (jamais 0). Stockage simulé : aucune donnée réelle.
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';

vi.mock('../../../src/services/storage', () => ({
  StorageService: {
    subscribe: () => () => {},
    getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }),
    getBatches: () => [{ id: 'LOT-18', recipeRef: 'REC-P6D', brewDate: '2026-10-01' }],
    getHopTastings: () => [{
      id: 't18', name: 'Stout du 18', date: '2026-10-18', origin: 'batch', batchId: 'LOT-18', notes: 'trop résineuse',
      axes: [{ axis: { id: 'resin', scale: { min: 0, max: 100 }, lowMax: 33, mediumMax: 66 }, perceived: { min: 70, max: 95 } }],
    }],
  },
}));

import EcranBiereApp from '../../../src/ui/hopIndex/biere/EcranApp';
import { poserPorteEtape } from '../../../src/ui/hopIndex/comparer/porte';
import { poserVisee } from '../../../src/ui/hopIndex/parcours/visee';
import { configurerDonnees } from '../../../src/ui/hopIndex/parcours/donnees';

const RECETTE = {
  id: 'REC-P6D', name: 'Stout export', style: '16D', volumeL: 20, boilMin: 60, ogTarget: 1.066, colorEbc: 70,
  fermentables: [], hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView ??= () => {};
});
afterEach(() => { cleanup(); poserPorteEtape(null); poserVisee(null); configurerDonnees(); });

describe('Ma bière dans l\'app, avec sa dégustation (p6)', () => {
  it('écrit la date de sa dégustation, l\'alerte de la famille trop marquée et le radar noté d\'après elle', async () => {
    poserPorteEtape({ recipe: RECETTE, boilOg: 1.066, draftId: 'REC-P6D', onChange: () => {} });
    const { container } = render(<EcranBiereApp onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-ecran="biere"]')).not.toBeNull());
    // La vraie date (2026-10-18 → 18.10), lue de sa dégustation.
    await waitFor(() => expect(container.querySelector('[data-element~="biere-legende"]')?.textContent).toMatch(/dégusté 18\.10/));
    // La famille hors du style (résineux, goûtée marquée) est ouverte au repos, comme sa base, même si ses données sont arrivées
    // après le premier rendu ; son facteur s'écrit à droite.
    expect(container.querySelector('[data-famille-ligne="resin"] [data-element~="biere-bannir"]')).not.toBeNull();
    expect(container.querySelector('[data-famille-ligne="resin"]')?.textContent).toMatch(/×\d/);
    // L'alerte dégustée :« Résineux trop marqué » ; son toucher ouvre le radar, grille notée (résineux : marqué).
    const alerte = container.querySelector('[data-role="alerte-radar"]');
    expect(alerte?.textContent).toMatch(/trop marqué/);
    fireEvent.click(alerte!);
    await waitFor(() => expect(container.querySelector('[data-role="degustation"]')).not.toBeNull());
    const cochees = [...container.querySelectorAll('[data-role="degustation"] [role="radio"][aria-checked="true"]')].map((e) => e.getAttribute('aria-label'));
    expect(cochees).toHaveLength(1);
    expect(cochees[0]).toMatch(/^Résineux : marqué/);
  });
});
