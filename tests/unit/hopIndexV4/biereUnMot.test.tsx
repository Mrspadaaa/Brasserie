// @vitest-environment jsdom
// Voie p6b-croix-pile, défaut 2 (critique p6, § 3) : le « + … » de Ma bière, seul en bas de l'écran, se lit « une autre » à tort ;
// il porte un mot. Avec une puce posée (visée, ou demande de dégustation), c'est le « + … » de sa maquette, inchangé.
// Stockage simulé : aucune donnée réelle, aucun appel Gemini.
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
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

import EcranBiereApp from '../../../src/ui/hopIndex/biere/EcranApp';
import { poserPorteEtape } from '../../../src/ui/hopIndex/comparer/porte';
import { poserVisee } from '../../../src/ui/hopIndex/parcours/visee';
import { configurerDonnees } from '../../../src/ui/hopIndex/parcours/donnees';
import { viderComparaison } from '../../../src/ui/hopIndex/fiche/comparaison';

const RECETTE = {
  id: 'REC-P6B', name: 'Stout export', style: '16D', volumeL: 20, boilMin: 60, ogTarget: 1.066, colorEbc: 70,
  fermentables: [], hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView ??= () => {};
});
afterEach(() => { cleanup(); poserPorteEtape(null); poserVisee(null); viderComparaison(); configurerDonnees(); });

const monter = async () => {
  poserPorteEtape({ recipe: RECETTE, boilOg: 1.066, draftId: 'REC-P6B', onChange: () => {} });
  const r = render(<EcranBiereApp onClose={() => {}} />);
  await waitFor(() => expect(r.container.querySelector('[data-ecran="biere"]')).not.toBeNull());
  return r;
};
const autre = (c: HTMLElement) => c.querySelector('[data-role="pont-objectif-autre"]')!;

describe('« + … » de Ma bière', () => {
  it('seul, aucune puce posée : il porte un mot, au même endroit et de la même forme', async () => {
    const { container } = await monter();
    expect(container.querySelectorAll('[data-element="biere-objectifs"] button')).toHaveLength(1);
    expect(autre(container).textContent).toBe('+ viser une famille');
  });

  it('une puce posée (visée « + » sur une famille) : il redevient « + … », comme sa maquette', async () => {
    const { container } = await monter();
    fireEvent.click(container.querySelector('[data-famille-ligne="tropical"] button')!);
    fireEvent.click(container.querySelector('[data-famille-ligne="tropical"] [data-visee="plus"]')!);
    await waitFor(() => expect(container.querySelector('[data-role="pont-objectif-tropical"]')).not.toBeNull());
    expect(autre(container).textContent).toBe('+ …');
    // La visée retirée, la puce disparaît et le mot revient.
    fireEvent.click(container.querySelector('[data-famille-ligne="tropical"] [data-visee="retirer"]')!);
    await waitFor(() => expect(autre(container).textContent).toBe('+ viser une famille'));
  });
});
