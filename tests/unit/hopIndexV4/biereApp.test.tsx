// @vitest-environment jsdom
// Voie p6-ma-biere-app (#174) : l'onglet « Ma bière » de sa base v4.10 (son choix : « Ça aussi ») vit dans l'app (src/ui/hopIndex/
// biere), à la place de « Écran provisoire… données du prototype, non réelles ». La couche hopBeer le monte sur le brouillon du
// wizard (pont comparer/porte.ts) ; il ne l'écrit pas : il pose une visée (parcours/visee.ts) que Suggérer lit. Stockage simulé :
// aucune donnée réelle, aucun appel Gemini.
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

import EcranBiereApp from '../../../src/ui/hopIndex/biere/EcranApp';
import { poserPorteEtape } from '../../../src/ui/hopIndex/comparer/porte';
import { poserOuvreurCouche } from '../../../src/ui/hopIndex/ouvrirCouche';
import { lireVisee, poserVisee } from '../../../src/ui/hopIndex/parcours/visee';
import { configurerDonnees } from '../../../src/ui/hopIndex/parcours/donnees';
import { viderComparaison } from '../../../src/ui/hopIndex/fiche/comparaison';
import type { LayerRoute } from '../../../src/pages/useFullScreenRoute';

const RECETTE = {
  id: 'REC-P6', name: 'Stout export', style: '16D', volumeL: 20, boilMin: 60, ogTarget: 1.066, colorEbc: 70,
  fermentables: [], hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView ??= () => {};
});
afterEach(() => { cleanup(); poserPorteEtape(null); poserOuvreurCouche(null); poserVisee(null); viderComparaison(); configurerDonnees(); vi.unstubAllEnvs(); vi.resetModules(); });

const poser = (draftId = 'REC-P6') => poserPorteEtape({ recipe: RECETTE, boilOg: 1.066, draftId, onChange: () => {} });
const monter = async () => {
  poser();
  const r = render(<EcranBiereApp onClose={() => {}} />);
  await waitFor(() => expect(r.container.querySelector('[data-ecran="biere"]')).not.toBeNull());
  return r;
};

describe('Ma bière dans l\'app (p6)', () => {
  it('rend les blocs de sa base v4.10 sur la recette du brouillon, sans écran provisoire', async () => {
    const { container } = await monter();
    for (const id of ['biere-onglets', 'biere-bandeau', 'biere-alerte', 'biere-reglages', 'biere-decompte', 'biere-legende', 'biere-barres', 'biere-objectifs', 'biere-levure']) {
      expect(container.querySelector(`[data-element~="${id}"]`), id).not.toBeNull();
    }
    expect(container.querySelectorAll('[data-famille-ligne]')).toHaveLength(12);
    expect([...container.querySelectorAll('[role="tab"]')].map((t) => t.textContent)).toEqual(['Ma bière', 'Suggestions', 'Comparer']);
    expect(container.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe('Ma bière');
    expect(container.textContent).toMatch(/Prévu avec SafAle US-05, caractérisée/);
    expect(container.textContent).not.toMatch(/Écran provisoire|données du prototype/i);
  });

  it('sans visée posée, aucune demande de la fixture n\'est inventée : ni « + floral » ni « − résineux », seulement « + … »', async () => {
    const { container } = await monter();
    expect(container.querySelector('[data-role="pont-objectif-floral"]')).toBeNull();
    expect(container.querySelector('[data-role="pont-objectif-resin"]')).toBeNull();
    expect(container.querySelector('[data-role="pont-objectif-autre"]')).not.toBeNull();    // Aucune dégustation dans ses données : pas de pastille « dégusté 18.10 » prêtée à la fixture.
    expect(container.textContent).not.toMatch(/dégusté 18\.10/);
    expect(lireVisee()).toEqual({});
  });

  it('une famille touchée s\'ouvre ; « + » pose sa visée, qui arrive à Suggérer, « × » la retire', async () => {
    const { container } = await monter();
    const ligne = () => container.querySelector('[data-famille-ligne="tropical"]')!;
    fireEvent.click(ligne().querySelector('button')!);
    expect(ligne().querySelector('[data-visee="plus"]')).not.toBeNull();
    fireEvent.click(ligne().querySelector('[data-visee="plus"]')!);
    const posee = lireVisee().tropical;
    expect(posee).toBeGreaterThan(0);
    await waitFor(() => expect(ligne().querySelector('[data-visee="retirer"]')).not.toBeNull());
    // La puce de la visée posée s'écrit sur l'onglet, pleine.
    expect(container.querySelector('[data-role="pont-objectif-tropical"][data-visee-posee]')).not.toBeNull();
    fireEvent.click(ligne().querySelector('[data-visee="retirer"]')!);
    expect(lireVisee().tropical).toBeUndefined();
  });

  it('« bannir » pose 0 (un palier posé, pas un inconnu) ; l\'onglet Suggestions ouvre la couche hopSuggest du brouillon', async () => {
    const ouvertes: LayerRoute[] = [];
    poserOuvreurCouche((r) => ouvertes.push(r));
    const { container } = await monter();
    fireEvent.click(container.querySelector('[data-famille-ligne="tropical"] button')!);
    fireEvent.click(container.querySelector('[data-famille-ligne="tropical"] [data-visee="bannir"]')!);
    expect(lireVisee()).toEqual({ tropical: 0 });
    fireEvent.click(container.querySelector('[data-onglet="suggerer"]')!);
    expect(ouvertes).toEqual([{ view: 'hopSuggest', recipeId: 'REC-P6' }]);
    fireEvent.click(container.querySelector('[data-onglet="comparer"]')!);
    expect(ouvertes[1]).toEqual({ view: 'hopCompare', recipeId: 'REC-P6', hops: [] });
  });

  it('« Radar » montre le radar de ma dégustation et sa grille ; rien de noté : pas goûté (aucune coche)', async () => {
    const { container } = await monter();
    fireEvent.click(container.querySelector('[data-vue="radar"]')!);
    await waitFor(() => expect(container.querySelector('[data-role="degustation"]')).not.toBeNull());
    expect(container.querySelectorAll('[data-role="note"]')).toHaveLength(12);
    expect(container.querySelectorAll('[data-role="degustation"] [role="radio"][aria-checked="true"]')).toHaveLength(0);
    // Une note posée se coche, la retoucher revient à « pas goûté ».
    const faible = container.querySelector('[data-role="note"][data-famille="floral"] [role="radio"][aria-label^="Floral : faible"]')!;
    fireEvent.click(faible);
    expect(container.querySelectorAll('[data-role="degustation"] [role="radio"][aria-checked="true"]')).toHaveLength(1);
    fireEvent.click(container.querySelector('[data-role="note"][data-famille="floral"] [role="radio"][aria-checked="true"]')!);
    expect(container.querySelectorAll('[data-role="degustation"] [role="radio"][aria-checked="true"]')).toHaveLength(0);
  });

  it('la visée d\'un brouillon ne passe pas à un autre', async () => {
    const un = await monter();
    fireEvent.click(un.container.querySelector('[data-famille-ligne="tropical"] button')!);
    fireEvent.click(un.container.querySelector('[data-famille-ligne="tropical"] [data-visee="plus"]')!);
    expect(lireVisee().tropical).toBeGreaterThan(0);
    un.unmount();
    poser('REC-AUTRE');
    const deux = render(<EcranBiereApp onClose={() => {}} />);
    await waitFor(() => expect(deux.container.querySelector('[data-ecran="biere"]')).not.toBeNull());
    expect(lireVisee()).toEqual({});
  });

  it('sans brouillon ouvert dessous, il le dit', () => {
    const { container } = render(<EcranBiereApp onClose={() => {}} />);
    expect(container.querySelector('[data-role="biere-sans-brouillon"]')).not.toBeNull();
  });
});

describe('la couche hopBeer (HopToolLayer)', () => {
  it('drapeau hopV4 allumé : le vrai écran, plus « Écran provisoire »', async () => {
    vi.stubEnv('VITE_HOP_V4', 'on');
    vi.resetModules();
    const { default: HopToolLayer } = await import('../../../src/ui/hopIndex/HopToolLayer');
    // Les modules sont rechargés : la porte posée est celle de la copie neuve, lue par la couche.
    const porte = await import('../../../src/ui/hopIndex/comparer/porte');
    porte.poserPorteEtape({ recipe: RECETTE, boilOg: 1.066, draftId: 'REC-P6', onChange: () => {} });
    const { container } = render(<HopToolLayer route={{ view: 'hopBeer', recipeId: 'REC-P6' }} level={1} onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-ecran="biere"]')).not.toBeNull(), { timeout: 15000 });
    expect(container.textContent).not.toMatch(/Écran provisoire/);
    expect(container.querySelector('[data-hop-v4-biere="app"]')).not.toBeNull();
  }, 20000);
});
