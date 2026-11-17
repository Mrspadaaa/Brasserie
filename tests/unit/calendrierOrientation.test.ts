// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { REQUETE_PAYSAGE, useOrientation } from '../../src/ui/calendrier/useOrientation';
import { entrerPleinEcran, estPleinEcran, sortirPleinEcran } from '../../src/ui/calendrier/pleinEcran';

/**
 * L'orientation et le plein écran (lot B, E09 et E10, B8). `matchMedia`, `requestFullscreen` et `screen.orientation.lock` sont simulés : jsdom n'a
 * aucun des trois. Ce fichier tourne sous jsdom (le dossier unit est sous Node par défaut) parce qu'un hook a besoin de React et de `window`.
 */
const origineMatchMedia = window.matchMedia;
afterEach(() => {
  cleanup();
  window.matchMedia = origineMatchMedia;
  delete (document.documentElement as unknown as Record<string, unknown>).requestFullscreen;
  delete (screen as unknown as Record<string, unknown>).orientation;
  vi.restoreAllMocks();
});

/** Un `matchMedia` qui se laisse basculer : la rotation du téléphone. */
function fauxMatchMedia(initial: boolean) {
  let matches = initial;
  const ecouteurs = new Set<() => void>();
  const requetes: string[] = [];
  const mq = {
    get matches() { return matches; },
    media: '',
    addEventListener: (_: string, f: () => void) => { ecouteurs.add(f); },
    removeEventListener: (_: string, f: () => void) => { ecouteurs.delete(f); },
    addListener: () => undefined,
    removeListener: () => undefined
  };
  window.matchMedia = ((q: string) => { requetes.push(q); return mq; }) as unknown as typeof window.matchMedia;
  return { requetes, ecouteurs, tourner: (paysage: boolean) => { matches = paysage; ecouteurs.forEach(f => f()); } };
}

describe('useOrientation (E10 : un seul écran, une mise en page par orientation)', () => {
  it('B8 : suit un matchMedia simulé, dans les deux sens, et se désabonne', () => {
    const faux = fauxMatchMedia(false);
    const { result, unmount } = renderHook(() => useOrientation());
    expect(result.current).toBe('portrait');
    expect(faux.requetes.every(q => q === REQUETE_PAYSAGE)).toBe(true);
    act(() => faux.tourner(true));
    expect(result.current).toBe('paysage');
    act(() => faux.tourner(false));
    expect(result.current).toBe('portrait');
    expect(faux.ecouteurs.size).toBe(1);
    unmount();
    expect(faux.ecouteurs.size).toBe(0);
  });

  it('démarre en paysage quand le téléphone est déjà couché', () => {
    fauxMatchMedia(true);
    const { result } = renderHook(() => useOrientation());
    expect(result.current).toBe('paysage');
  });

  it('« paysage » veut dire un téléphone couché : une fenêtre basse, pas un écran d’ordinateur', () => {
    expect(REQUETE_PAYSAGE).toContain('orientation: landscape');
    expect(REQUETE_PAYSAGE).toMatch(/max-height:\s*\d+px/);
  });
});

describe('entrerPleinEcran (E09, D-2, D-205)', () => {
  it('B8 : requestFullscreen d’abord, puis orientation.lock(\'landscape\') ; le verrou pris : « verrouille »', async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    const lock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(document.documentElement, 'requestFullscreen', { value: requestFullscreen, configurable: true });
    Object.defineProperty(screen, 'orientation', { value: { lock }, configurable: true });
    await expect(entrerPleinEcran()).resolves.toBe('verrouille');
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
    expect(lock).toHaveBeenCalledWith('landscape');
    expect(requestFullscreen.mock.invocationCallOrder[0]).toBeLessThan(lock.mock.invocationCallOrder[0]);
  });

  it('B8 : le verrou échoue (iPhone) : « invite », sans lever d’erreur', async () => {
    Object.defineProperty(document.documentElement, 'requestFullscreen', { value: vi.fn().mockResolvedValue(undefined), configurable: true });
    Object.defineProperty(screen, 'orientation', { value: { lock: vi.fn().mockRejectedValue(new DOMException('no', 'NotSupportedError')) }, configurable: true });
    await expect(entrerPleinEcran()).resolves.toBe('invite');
  });

  it('ni Fullscreen API ni verrou (iPhone) : « invite », sans lever d’erreur', async () => {
    await expect(entrerPleinEcran()).resolves.toBe('invite');
  });

  it('le plein écran refusé ne ferme pas la porte : le verrou est tout de même tenté', async () => {
    const lock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(document.documentElement, 'requestFullscreen', { value: vi.fn().mockRejectedValue(new Error('refusé')), configurable: true });
    Object.defineProperty(screen, 'orientation', { value: { lock }, configurable: true });
    await expect(entrerPleinEcran()).resolves.toBe('verrouille');
    expect(lock).toHaveBeenCalledTimes(1);
  });

  it('sortirPleinEcran rend l’orientation, sans lever d’erreur', async () => {
    const unlock = vi.fn();
    Object.defineProperty(screen, 'orientation', { value: { unlock }, configurable: true });
    await expect(sortirPleinEcran()).resolves.toBeUndefined();
    expect(unlock).toHaveBeenCalledTimes(1);
    expect(estPleinEcran()).toBe(false);
  });
});
