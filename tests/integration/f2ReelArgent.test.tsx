// @vitest-environment jsdom
/* Voie f2 (CP-1) : l'onglet Argent d'un brassin (e3a) dans l'état de la vraie app : brassin conditionné, jamais chiffré, aucun prix posé.
   Les six marches gardent leur dessin (barre des trois notions, barre du format, règle du prix, barre du brassin), hachuré, avec « ? » : jamais une ligne de texte à la place. */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { ChaineArgent } from '../../src/ui/prix/ChaineArgent';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { financeDemoEntries } from '../../src/dev/financeDemo';
import type { Batch, PricingItem } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));

const donnees = (name: string) => financeDemoEntries('reel').entries.filter(e => e.name === name).map(e => e.data);
const norm = (el: Element | null): string => (el?.textContent ?? '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
let batches: Batch[] = []; let tarifs: PricingItem[] = [];
beforeEach(() => {
  batches = donnees('batches') as Batch[]; tarifs = [];
  vi.spyOn(FinanceService, 'snapshot').mockImplementation(() => ({ profile: {}, plans: [], payments: [], assets: [], closings: [] }) as never);
  vi.spyOn(StorageService, 'getConfig').mockImplementation(() => defaultConfig as never);
  vi.spyOn(StorageService, 'getBatches').mockImplementation(() => batches);
  vi.spyOn(StorageService, 'getTarifs').mockImplementation(() => tarifs);
  vi.spyOn(StorageService, 'getTransactions').mockImplementation(() => []);
  vi.spyOn(StorageService, 'getStocks').mockImplementation(() => ({ rawMaterials: [], cleaning: [], kegs: [] }) as never);
  StorageService.setUiState('prix_lecture', 'bouteille');
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const lot = () => batches.find(b => b.id === 'REEL-LOT-1')!;

describe('Argent e3a, brassin jamais chiffré et sans prix', () => {
  it('quatre marches (litre, format, prix, brassin) gardent leur forme hachurée ; aucune ligne de texte ne remplace le dessin', () => {
    const { container } = render(<ChaineArgent batch={lot()} config={defaultConfig} />);
    const marches = [...container.querySelectorAll('.arg-st')];
    expect(marches).toHaveLength(6);
    const hachurees = marches.map((m, i) => [i + 1, !!m.querySelector('[data-inconnu]')] as const).filter(([, h]) => h).map(([i]) => i);
    expect(hachurees).toEqual([1, 3, 4, 6]);
    expect(marches[3].querySelector('.arg-regle.arg-hach')?.textContent).toContain('à perte · mince · il te reste');
    const texte = norm(container);
    for (const ancien of ['coût du litre à compléter', 'coût du format à compléter', 'prix ou coût à compléter']) expect(texte).not.toContain(ancien);
  });
  it('les nombres inconnus sont « ? » (jamais 0,00) et le connu reste franc (impôt, °P)', () => {
    const { container } = render(<ChaineArgent batch={lot()} config={defaultConfig} />);
    const marches = [...container.querySelectorAll('.arg-st')].map(m => norm(m));
    expect(marches[0]).toMatch(/payé \? · à payer \? · année \?/);
    expect(marches[2]).toMatch(/bière \? · emballage à compléter · impôt 0,08/);
    expect(marches[3]).toContain('prix ?');
    expect(marches[5]).toMatch(/\? paient \?.*vendu \?/);
    expect(marches[1]).toMatch(/°P/);
    expect(norm(container)).not.toMatch(/\b0,00\b/);
  });
});
