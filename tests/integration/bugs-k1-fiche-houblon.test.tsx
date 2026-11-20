/* k1, critique du 19.11 (points 14, 15, 16) — Stocks › Houblons, l'index et la fiche d'une variété.
   14 : « Valeurs de la variété · Fiabilité faible » dit UNE fois (pas une fois par ligne), et l'α une seule fois (pas dans la liste puis dans « Composition »).
   15 : la classe « Thiol impact » tient en une ligne courte au premier plan ; son explication longue est à un toucher (repli).
   16 : le titre ne répète pas l'onglet « Houblons » juste au-dessus (il reste pour la lecture d'écran) ; un seul compte, sans « (s) ». */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { hopTestMeasurement, hopTestSource, hopTestVariety } from '../fixtures/hopIndex';

const state = vi.hoisted(() => ({ varieties: [] as any[], lots: [] as any[] }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../src/services/storage', () => ({ StorageService: {
  getHopVarieties: () => state.varieties, getHopLots: () => state.lots, getHopKnowledge: () => [], getHopPredictions: () => [], getHopTastings: () => [],
  isReady: () => true, importHopIndex: vi.fn(async () => 0), subscribe: () => () => {}, saveHopVariety: vi.fn(), saveHopLot: vi.fn(), saveHopKnowledge: vi.fn(),
} }));
import { HopIndexPanel } from '../../src/ui/hopIndex/HopIndexPanel';

const THIOL = 'Classe fabricant « Thiol impact » : faible. Elle concerne les thiols libres du houblon ; ce n’est ni un rendement de levure ni une intensité prédite en bière.';
const faible = { confidence: 'low' as const };
beforeEach(() => {
  state.varieties = [hopTestVariety({
    name: 'Admiral',
    descriptions: [
      { text: 'Fruity, tea, citrusy.', context: 'rawHop', source: hopTestSource },
      { text: THIOL, context: 'rawHop', source: hopTestSource },
    ],
    analysis: [hopTestMeasurement(faible), hopTestMeasurement({ analyte: 'beta', range: { min: 5, max: 6 }, ...faible }),
      hopTestMeasurement({ analyte: 'totalOil', unit: 'ml100g', range: { min: 1, max: 1.7 }, ...faible })],
  })];
  state.lots = [];
});
afterEach(cleanup);

const ouvrir = () => { render(<HopIndexPanel />); fireEvent.click(screen.getByRole('button', { name: /Admiral/ })); };
const texte = () => (document.body.textContent ?? '').replace(/\s+/g, ' ');
const nb = (re: RegExp) => (texte().match(re) ?? []).length;

describe('k1 — la fiche d’un houblon (points 14, 15, 16)', () => {
  it('14 : « Fiabilité faible » une seule fois dans la fiche, « Valeurs de la variété » une seule fois comme pastille', () => {
    ouvrir();
    expect(nb(/Fiabilité faible/g)).toBe(1);
    expect(nb(/fiabilité faible/gi)).toBe(1);
    expect(screen.getAllByText('Valeurs de la variété', { selector: 'span' })).toHaveLength(1);
  });
  it('14 : l’α (et β, huiles) ne se lisent qu’une fois : pas de seconde « Composition » qui les répète', () => {
    ouvrir();
    expect(screen.getAllByText('Acides alpha')).toHaveLength(1);
    expect(screen.getAllByText('Acides bêta')).toHaveLength(1);
    expect(screen.queryByText(/^Composition ·/)).toBeNull();
  });
  it('15 : la classe thiols tient en une ligne courte ; l’explication longue est repliée', () => {
    ouvrir();
    const ligne = [...document.querySelectorAll('article summary, article p')].find((e) => /Thiol/i.test(e.textContent ?? '') && !e.closest('details > div, details > p'));
    expect(ligne).toBeTruthy();
    expect((ligne!.textContent ?? '').length).toBeLessThanOrEqual(60);
    const repli = [...document.querySelectorAll('article details')].find((d) => /ni un rendement de levure/.test(d.textContent ?? ''));
    expect(repli).toBeTruthy();
    expect(repli!.hasAttribute('open')).toBe(false);
    const visibles = [...document.querySelectorAll('article p')].filter((p) => !p.closest('details'));
    expect(visibles.some((p) => /ni un rendement de levure/.test(p.textContent ?? ''))).toBe(false);
  });
  it('16 : le titre « Houblons » est réservé à la lecture d’écran (l’onglet le dit déjà) ; un seul compte, sans « (s) »', () => {
    render(<HopIndexPanel />);
    const h2 = screen.getByRole('heading', { name: 'Houblons' });
    expect(h2.className).toMatch(/sr-only/);
    expect(texte()).not.toMatch(/\(s\)/);
    expect(nb(/référence/g)).toBe(1);
    expect(nb(/1 fiche/g)).toBe(0);
  });
  it('16 : une recherche dit son compte une fois, au pluriel juste', () => {
    state.varieties = [hopTestVariety({ name: 'Admiral' }), hopTestVariety({ id: 'v2', name: 'Admirable', aliases: [] })];
    render(<HopIndexPanel />);
    fireEvent.change(screen.getByLabelText(/Rechercher une variété|Variété ou arôme/), { target: { value: 'Admir' } });
    expect(texte()).toMatch(/2 fiches correspondantes/);
    expect(texte()).not.toMatch(/\(s\)/);
    fireEvent.change(screen.getByLabelText(/Rechercher une variété|Variété ou arôme/), { target: { value: 'Admirab' } });
    expect(texte()).toMatch(/1 fiche correspondante/);
  });
});
