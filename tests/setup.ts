import '@testing-library/jest-dom/vitest';

/**
 * Préparation commune aux deux suites.
 *
 * Les tests unitaires tournent sous Node, sans DOM : tout ce qui touche au
 * navigateur est donc gardé derrière une vérification d'existence plutôt que
 * supposé présent.
 */

if (typeof window !== 'undefined') {
  /*
   * `matchMedia` n'existe pas dans jsdom, et plusieurs composants s'en servent
   * pour respecter la préférence de mouvement réduit. Sans ce bouchon, ils
   * lèvent au montage.
   */
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false
    })) as typeof window.matchMedia;
  }

  /*
   * `ResizeObserver` manque aussi. Recharts et react-virtuoso mesurent leur
   * conteneur avec : sans lui, tout écran portant une liste ou un graphique
   * échoue au montage pour une raison sans rapport avec ce qu'on teste.
   */
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }

  // `scrollIntoView` n'est pas implémenté dans jsdom.
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }

  /*
   * `PointerEvent` manque aussi dans jsdom. Sans lui, les événements de pointeur
   * retombent sur un `Event` nu : ni `clientX`, ni `pointerType`. Or c'est
   * précisément sur ces deux propriétés que repose la distinction entre un
   * appui et un défilement dans les listes déroulantes — le test ne pourrait
   * pas reproduire le bug qu'il surveille.
   */
  if (!window.PointerEvent) {
    class PointerEventShim extends MouseEvent {
      pointerId: number;
      pointerType: string;
      isPrimary: boolean;

      constructor(type: string, params: PointerEventInit = {}) {
        super(type, params);
        this.pointerId = params.pointerId ?? 1;
        this.pointerType = params.pointerType ?? 'mouse';
        this.isPrimary = params.isPrimary ?? true;
      }
    }
    window.PointerEvent = PointerEventShim as unknown as typeof PointerEvent;
  }

  // jsdom ne gère pas la capture de pointeur, appelée par certains composants.
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};
    Element.prototype.hasPointerCapture = () => false;
  }
}
