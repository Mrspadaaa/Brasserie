// @vitest-environment jsdom
// Voie p6b-croix-pile (D118, 23.10 : « Suivant où on est le bouton retour fait pas la même action. Je veux juste retour au "menu"
// pas principal »). Depuis l'onglet Ma bière (couche hopBeer), « Suggestions » et « Comparer » empilent une couche : sa croix doit
// ramener à l'étape Houblons (la page dessous), pas à Ma bière. L'onglet « Ma bière » de ces écrans reste le chemin d'un niveau.
// La pile est la vraie (useFullScreenRoute, useHopPileDevHook, HopToolLayer) ; les écrans sont les vrais, drapeau hopV4 allumé.
// Stockage simulé : aucune donnée réelle, aucun appel Gemini.
import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';
import type { LayerRoute } from '../../../src/pages/useFullScreenRoute';

vi.mock('../../../src/services/storage', () => ({
  StorageService: {
    subscribe: () => () => {},
    getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }),
    getBatches: () => [],
    getHopTastings: () => [],
  },
}));

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
beforeEach(() => { window.history.replaceState(null, '', '/?dev-local'); });
afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.resetModules(); window.history.replaceState(null, '', '/'); });

/** Une pile de l'app en petit : le vrai crochet de pile, le vrai HopToolLayer ; l'étape Houblons est un témoin sous la pile. */
async function monterPile() {
  vi.stubEnv('VITE_HOP_V4', 'on');
  vi.resetModules();
  const { useFullScreenRoute, isLayerRoute } = await import('../../../src/pages/useFullScreenRoute');
  const { useHopPileDevHook } = await import('../../../src/ui/hopIndex/devHook');
  const { ouvrirCouche } = await import('../../../src/ui/hopIndex/ouvrirCouche');
  const { default: HopToolLayer } = await import('../../../src/ui/hopIndex/HopToolLayer');
  const { poserPorteEtape } = await import('../../../src/ui/hopIndex/comparer/porte');
  poserPorteEtape({ recipe: RECETTE, boilOg: 1.066, draftId: 'REC-P6B', onChange: () => {} });

  let main!: ReturnType<typeof useFullScreenRoute>;
  function Hote() {
    const route = useFullScreenRoute();
    useHopPileDevHook(route);
    main = route;
    const haut = route.route;
    return (
      <>
        <output data-testid="pile">{route.pile.map((r) => r.view).join('>')}</output>
        {isLayerRoute(haut) && haut.view !== 'hopV55'
          ? <HopToolLayer route={haut} level={route.layers.length} onClose={route.close} />
          : <p data-role="etape-houblons">Étape Houblons</p>}
      </>
    );
  }
  const r = render(<Hote />);
  const pile = () => r.getByTestId('pile').textContent;
  const ouvrir = (c: LayerRoute) => act(() => { ouvrirCouche(c); });
  act(() => { main.open({ view: 'wizard' }); });
  return { ...r, pile, ouvrir, main: () => main };
}

const attendreEcran = (container: HTMLElement, ecran: string) =>
  waitFor(() => expect(container.querySelector(`[data-ecran="${ecran}"]`)).not.toBeNull(), { timeout: 15000 });
const croix = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-role="retour"]')!;
const onglet = (container: HTMLElement, id: string) => container.querySelector<HTMLElement>(`[role="tab"][data-onglet="${id}"]`)!;

describe('D118 · la croix d\'une couche empilée sur Ma bière ramène à l\'étape Houblons', () => {
  it('Ma bière → Suggestions → croix : l\'étape Houblons, toute la pile fermée', async () => {
    const { container, pile, ouvrir } = await monterPile();
    ouvrir({ view: 'hopBeer', recipeId: 'REC-P6B' });
    await attendreEcran(container, 'biere');
    fireEvent.click(onglet(container, 'suggerer'));
    await attendreEcran(container, 'suggerer');
    expect(pile()).toBe('tabs>wizard>hopBeer>hopSuggest');

    fireEvent.click(croix(container));
    await waitFor(() => expect(pile()).toBe('tabs>wizard'));
    expect(container.querySelector('[data-role="etape-houblons"]')).not.toBeNull();
    expect(container.querySelector('[data-ecran]')).toBeNull();
  }, 30000);

  it('Ma bière → Comparer → croix : l\'étape Houblons', async () => {
    const { container, pile, ouvrir } = await monterPile();
    ouvrir({ view: 'hopBeer', recipeId: 'REC-P6B' });
    await attendreEcran(container, 'biere');
    fireEvent.click(onglet(container, 'comparer'));
    await waitFor(() => expect(pile()).toBe('tabs>wizard>hopBeer>hopCompare'));
    await attendreEcran(container, 'comparer');

    fireEvent.click(croix(container));
    await waitFor(() => expect(pile()).toBe('tabs>wizard'));
    expect(container.querySelector('[data-role="etape-houblons"]')).not.toBeNull();
  }, 30000);

  it('Ma bière → Suggestions → Comparer → croix : l\'étape Houblons, et non Suggérer', async () => {
    const { container, pile, ouvrir } = await monterPile();
    ouvrir({ view: 'hopBeer', recipeId: 'REC-P6B' });
    await attendreEcran(container, 'biere');
    fireEvent.click(onglet(container, 'suggerer'));
    await attendreEcran(container, 'suggerer');
    fireEvent.click(onglet(container, 'comparer'));
    await waitFor(() => expect(pile()).toBe('tabs>wizard>hopBeer>hopSuggest>hopCompare'));
    await attendreEcran(container, 'comparer');

    fireEvent.click(croix(container));
    await waitFor(() => expect(pile()).toBe('tabs>wizard'));
  }, 30000);

  it('l\'onglet « Ma bière » de Suggérer reste le chemin d\'un niveau : il revient à l\'analyse', async () => {
    const { container, pile, ouvrir } = await monterPile();
    ouvrir({ view: 'hopBeer', recipeId: 'REC-P6B' });
    await attendreEcran(container, 'biere');
    fireEvent.click(onglet(container, 'suggerer'));
    await attendreEcran(container, 'suggerer');

    fireEvent.click(onglet(container, 'biere'));
    await waitFor(() => expect(pile()).toBe('tabs>wizard>hopBeer'));
    await attendreEcran(container, 'biere');
  }, 30000);

  it('témoin : Suggérer ouvert depuis l\'étape (rien de Ma bière dessous) : la croix ferme d\'un niveau, comme avant', async () => {
    const { container, pile, ouvrir } = await monterPile();
    ouvrir({ view: 'hopSuggest', recipeId: 'REC-P6B' });
    await attendreEcran(container, 'suggerer');
    expect(pile()).toBe('tabs>wizard>hopSuggest');
    fireEvent.click(croix(container));
    await waitFor(() => expect(pile()).toBe('tabs>wizard'));
    expect(container.querySelector('[data-role="etape-houblons"]')).not.toBeNull();
  }, 30000);
});
