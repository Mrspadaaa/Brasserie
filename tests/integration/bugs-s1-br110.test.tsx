/* BR-110 (et BE-81) : l'écran Stocks › Houblons garde le même nom et la même tête aux deux largeurs : « Houblons » (le nom de l'onglet),
   les comptes en pastilles. Avant : au 1280 un titre « Index houblon » + une phrase, au 390 rien. */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { hopTestLot, hopTestVariety } from '../fixtures/hopIndex';

const state = vi.hoisted(() => ({ varieties: [] as any[], lots: [] as any[] }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../src/services/storage', () => ({ StorageService: {
  getHopVarieties: () => state.varieties, getHopLots: () => state.lots, getHopKnowledge: () => [], getHopPredictions: () => [], getHopTastings: () => [],
  isReady: () => true, subscribe: () => () => {}, saveHopVariety: vi.fn(), saveHopLot: vi.fn(), saveHopKnowledge: vi.fn(), saveHopTasting: vi.fn(),
} }));
import { HopIndexPanel } from '../../src/ui/hopIndex/HopIndexPanel';

function largeur(mobile: boolean) {
  window.matchMedia = ((q: string) => ({ matches: mobile && /max-width: 639px/.test(q), media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
}
function tete() {
  const section = screen.getByLabelText(/Houblons?$|Index houblon/i, { selector: 'section' });
  return {
    titres: [...section.querySelectorAll('h1, h2, h3')].map((h) => (h.textContent || '').trim()),
    pastilles: [...section.querySelectorAll('span')].map((s) => (s.textContent || '').trim()).filter((t) => /^(\d+ références?|aucune référence|\d+ lots?|aucun lot|\d+ analysés?|aucun analysé)$/.test(t)),
  };
}
beforeEach(() => { state.varieties = [hopTestVariety()]; state.lots = [hopTestLot()]; });
afterEach(cleanup);

describe('BR-110 — un nom, une tête, deux largeurs', () => {
  it('390 et 1280 : même titre « Houblons », mêmes pastilles de comptes, plus de « Index houblon »', () => {
    largeur(false); const large = (render(<HopIndexPanel />), tete()); cleanup();
    largeur(true); const etroit = (render(<HopIndexPanel />), tete());
    expect(etroit.titres).toEqual(['Houblons']);
    expect(large.titres).toEqual(['Houblons']);
    expect(etroit.pastilles.length).toBeGreaterThanOrEqual(2);
    expect(etroit.pastilles).toEqual(large.pastilles);
  });
});
