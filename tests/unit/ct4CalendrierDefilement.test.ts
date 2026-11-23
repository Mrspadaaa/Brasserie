// @vitest-environment jsdom
/**
 * CT4-A-12 (suite) : à 844 × 340 le calendrier est défilé (Papiers sous le pli). Toucher un jalon ouvre la fiche sur Finances (page courte) ;
 * en revenant au calendrier, la page repartait en haut (144 px avant le toucher, 0 après : mesuré au rendu). On remet le défilement d'avant.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { memoriserDefilement, restaurerDefilement } from '../../src/ui/calendrier/retourDefilement';

let hauteur = 592; let y = 0;
beforeEach(() => {
  vi.useFakeTimers(); hauteur = 592; y = 0;
  Object.defineProperty(window, 'scrollY', { configurable: true, get: () => y });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 340 });
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, get: () => hauteur });
  vi.spyOn(window, 'scrollTo').mockImplementation(((_x: number, py: number) => { y = Math.min(py, hauteur - 340); }) as typeof window.scrollTo);
  vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => setTimeout(() => f(0), 16) as unknown as number);
  vi.stubGlobal('cancelAnimationFrame', (i: number) => clearTimeout(i));
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('CT4-A-12 : le retour au calendrier rend le défilement d’avant', () => {
  it('la page est trop courte au retour (le temps que la frise se monte) : on attend, puis on défile', () => {
    y = 144; memoriserDefilement();
    y = 0; hauteur = 340;               // Finances : page courte, le défilement retombe à 0
    restaurerDefilement();
    vi.advanceTimersByTime(100);
    expect(y).toBe(0);                  // pas encore de quoi défiler : pas de saut dans le vide
    hauteur = 592;                      // la frise est montée
    vi.advanceTimersByTime(100);
    expect(y).toBe(144);
  });
  it('rien de mémorisé (ou 0) : on ne touche pas au défilement', () => {
    y = 0; memoriserDefilement(); restaurerDefilement(); vi.advanceTimersByTime(500);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
  it('la mémoire sert une seule fois', () => {
    y = 144; memoriserDefilement(); restaurerDefilement(); vi.advanceTimersByTime(100);
    (window.scrollTo as unknown as ReturnType<typeof vi.fn>).mockClear(); y = 0;
    restaurerDefilement(); vi.advanceTimersByTime(500);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
