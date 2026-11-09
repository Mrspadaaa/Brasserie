// @vitest-environment jsdom
// BA-NOTE-1 (07.11) : « 12 essais sur 2 970 en échec : un double toucher sur « Fermer » ou « Abandonner » quitte le document ».
// Cause : `close` appelait `history.back()` à chaque toucher ; deux touchers avant le `popstate` reculaient de DEUX entrées, au-delà de l'app.
// Écrit avant le correctif (L13) : rouge sur le code d'alors.
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFullScreenRoute } from '../../src/pages/useFullScreenRoute';

beforeEach(() => { window.history.replaceState(null, '', '/'); });
afterEach(() => { vi.restoreAllMocks(); });

describe('fermer une page : un seul pas en arrière', () => {
  it('deux « close » avant le popstate ne reculent que d’une entrée', () => {
    const { result } = renderHook(() => useFullScreenRoute());
    act(() => { result.current.open({ view: 'recipe', recipeId: 'R1' }); });
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    act(() => { result.current.close(); result.current.close(); });
    expect(back).toHaveBeenCalledTimes(1);
  });

  it('une fois la page fermée (popstate), une nouvelle fermeture reste possible', () => {
    const { result } = renderHook(() => useFullScreenRoute());
    act(() => { result.current.open({ view: 'recipe', recipeId: 'R1' }); });
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    act(() => { result.current.close(); });
    act(() => { window.dispatchEvent(new PopStateEvent('popstate', { state: null })); });
    act(() => { result.current.open({ view: 'recipe', recipeId: 'R2' }); });
    act(() => { result.current.close(); });
    expect(back).toHaveBeenCalledTimes(2);
  });
});
