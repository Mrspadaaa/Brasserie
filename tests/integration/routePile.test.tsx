import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { isLayerRoute, useFullScreenRoute, type Route } from '../../src/pages/useFullScreenRoute';

// #162 (D65) : la pile de routes de l'app. Une page (recette, brassin, wizard) se pose sur les onglets ; une couche
// (atelier V5.5, outils houblons v4) s'empile, et le retour du téléphone la dépile d'UN niveau.

const views = (pile: Route[]) => pile.map(route => route.view);
const back = async (result: { current: ReturnType<typeof useFullScreenRoute> }, expected: string[]) => {
  act(() => { window.history.back(); });
  await waitFor(() => expect(views(result.current.pile)).toEqual(expected));
};

beforeEach(() => { window.history.replaceState(null, '', '/?dev-local'); });
afterEach(() => { window.history.replaceState(null, '', '/'); });

describe('useFullScreenRoute · pile', () => {
  it('quatre couches sur le wizard : chaque retour dépile un seul niveau, jusqu’au wizard puis aux onglets', async () => {
    const { result } = renderHook(() => useFullScreenRoute());
    expect(views(result.current.pile)).toEqual(['tabs']);
    act(() => result.current.open({ view: 'wizard' }));
    act(() => result.current.open({ view: 'hopBeer' }));
    act(() => result.current.open({ view: 'hopSuggest' }));
    act(() => result.current.open({ view: 'hopCompare', hops: ['citra', 'mosaic'] }));
    act(() => result.current.open({ view: 'hopTiming', additionId: 'a2' }));
    expect(views(result.current.pile)).toEqual(['tabs', 'wizard', 'hopBeer', 'hopSuggest', 'hopCompare', 'hopTiming']);
    expect(result.current.route).toEqual({ view: 'hopTiming', additionId: 'a2' });

    await back(result, ['tabs', 'wizard', 'hopBeer', 'hopSuggest', 'hopCompare']);
    expect(result.current.route).toEqual({ view: 'hopCompare', hops: ['citra', 'mosaic'] });
    await back(result, ['tabs', 'wizard', 'hopBeer', 'hopSuggest']);
    // « ‹ » de l'écran : même chemin que le retour du téléphone.
    act(() => result.current.close());
    await waitFor(() => expect(views(result.current.pile)).toEqual(['tabs', 'wizard', 'hopBeer']));
    await back(result, ['tabs', 'wizard']);
    await back(result, ['tabs']);
  });

  it('retours existants inchangés : une page ramène aux onglets, l’atelier V5.5 ramène à la page qui l’a ouvert', async () => {
    const { result } = renderHook(() => useFullScreenRoute());
    act(() => result.current.open({ view: 'recipe', recipeId: 'R1' }));
    act(() => result.current.open({ view: 'hopV55', recipeId: 'R1' }));
    await back(result, ['tabs', 'recipe']);
    // Recette → modifier : le wizard REMPLACE la recette, et son retour ramène aux onglets, comme avant #162.
    act(() => result.current.open({ view: 'wizard', recipeId: 'R1' }));
    expect(views(result.current.pile)).toEqual(['tabs', 'wizard']);
    await back(result, ['tabs']);
    // Atelier → « Ouvrir la recette » : une page, posée sur les onglets ; son retour ramène aux onglets.
    act(() => result.current.open({ view: 'hopV55' }));
    act(() => result.current.open({ view: 'recipe', recipeId: 'R2' }));
    expect(views(result.current.pile)).toEqual(['tabs', 'recipe']);
    await back(result, ['tabs']);
  });

  it('closeTo revient en un seul saut à la plus haute route demandée ; replaceTop garde la profondeur', async () => {
    const { result } = renderHook(() => useFullScreenRoute());
    act(() => result.current.open({ view: 'recipe', recipeId: 'R1' }));
    act(() => result.current.open({ view: 'hopBeer', recipeId: 'R1' }));
    act(() => result.current.open({ view: 'hopSuggest', recipeId: 'R1' }));
    act(() => result.current.open({ view: 'hopSubstitute', recipeId: 'R1', hopKey: 'citra' }));
    act(() => result.current.replaceTop({ view: 'hopSubstitute', recipeId: 'R1', hopKey: 'mosaic' }));
    expect(result.current.route).toEqual({ view: 'hopSubstitute', recipeId: 'R1', hopKey: 'mosaic' });
    expect(result.current.pile).toHaveLength(5);
    act(() => result.current.closeTo(route => route.view === 'hopBeer', { view: 'hopBeer', recipeId: 'R1' }));
    await waitFor(() => expect(views(result.current.pile)).toEqual(['tabs', 'recipe', 'hopBeer']));
    // L'historique a reculé d'autant : un retour de plus referme Ma bière, pas une entrée fantôme.
    await back(result, ['tabs', 'recipe']);
  });

  it('page ouverte sans entrée poussée (lien ?brewday=) : la fermer la retire sur place, sans reculer dans l’historique', () => {
    window.history.replaceState(null, '', '/?dev-local&brewday=B-12');
    const lengthBefore = window.history.length;
    const { result } = renderHook(() => useFullScreenRoute());
    expect(views(result.current.pile)).toEqual(['tabs', 'brewday']);
    act(() => result.current.close());
    expect(views(result.current.pile)).toEqual(['tabs']);
    expect(window.location.search).not.toContain('brewday');
    expect(window.history.length).toBe(lengthBefore);
  });

  it('distingue couches et pages', () => {
    expect(['hopV55', 'hopBeer', 'hopSuggest', 'hopCompare', 'hopTiming', 'hopSubstitute']
      .every(view => isLayerRoute({ view } as Route))).toBe(true);
    expect(['tabs', 'recipe', 'brewday', 'wizard'].some(view => isLayerRoute({ view } as Route))).toBe(false);
  });
});
