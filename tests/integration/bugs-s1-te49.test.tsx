/* TE-49 : la fiche d'une variété (Stocks › Houblons) n'empile plus l'inconnu au premier plan.
   Lecture étroite : (1) pas de pastille « Confiance … » sur une ligne dont la valeur est inconnue (« Inconnu · Confiance faible » ×7) ;
   (2) les thiols (3MH, 4MMP) sans aucune valeur ne s'affichent pas (seuls α et huile totale restent, même inconnus) ;
   (3) pas de pastille « Forme non précisée » quand la forme n'est pas connue. */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { hopTestVariety } from '../fixtures/hopIndex';

const state = vi.hoisted(() => ({ varieties: [] as any[], lots: [] as any[] }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../src/services/storage', () => ({ StorageService: {
  getHopVarieties: () => state.varieties, getHopLots: () => state.lots, getHopKnowledge: () => [], getHopPredictions: () => [], getHopTastings: () => [],
  isReady: () => true, importHopIndex: vi.fn(async () => 0), subscribe: () => () => {}, saveHopVariety: vi.fn(), saveHopLot: vi.fn(), saveHopKnowledge: vi.fn(),
} }));
import { HopIndexPanel } from '../../src/ui/hopIndex/HopIndexPanel';

beforeEach(() => { state.varieties = [{ ...hopTestVariety(), form: 'unknown', analysis: [] }]; state.lots = []; });
afterEach(cleanup);

describe('TE-49 — la fiche sans l’inconnu empilé', () => {
  it('aucune « Confiance » sur une ligne inconnue, aucun thiol sans valeur, aucune « Forme non précisée »', () => {
    render(<HopIndexPanel />);
    expect(document.body.textContent).not.toMatch(/Forme non précisée/);
    fireEvent.click(screen.getByRole('button', { name: /Variété témoin/ }));
    const lignes = [...document.querySelectorAll('details > summary')].map((s) => (s.textContent || '').replace(/\s+/g, ' '));
    const inconnues = lignes.filter((t) => /Inconnu/.test(t));
    expect(inconnues.length).toBeGreaterThan(0);
    for (const t of inconnues) expect(t).not.toMatch(/Confiance/);
    expect(lignes.filter((t) => /3MH|4MMP/.test(t) && /Non renseigné/.test(t))).toEqual([]);
  });
});
