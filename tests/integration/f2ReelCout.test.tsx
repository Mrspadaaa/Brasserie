// @vitest-environment jsdom
/* Voie f2 (CP-1) : le coût d'un brassin (c3a, flux « quand tu paies → pour quoi ») dans l'état de la vraie app : un brassin jamais chiffré, ingrédients sans prix, aucun volume annuel.
   La forme de c3a tient : chaque nœud inconnu est un carré hachuré posé en face de son étiquette (plus décalé), aucune source n'affiche « 0,00 » pour un inconnu. */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { CoutBrassinFlux, fluxDuBrassin, montantSource, sourceIncomplete } from '../../src/ui/finance/CoutBrassinFlux';
import { estimateBrewBudget } from '../../src/domain/finance/brewBudget';
import { financeDemoEntries } from '../../src/dev/financeDemo';
import type { Batch, StockItem } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
afterEach(cleanup);

const lot = () => financeDemoEntries('reel').entries.find(e => e.id === 'REEL-LOT-1')!.data as Batch;
const stocks = () => financeDemoEntries('reel').entries.filter(e => e.name === 'stockItems').map(e => e.data) as StockItem[];
const snapshot = () => estimateBrewBudget({ recipe: lot().recipeSnapshot as never, stockItems: stocks(), batches: [lot()], brewDate: '2026-09-26', netVolumeL: 15,
  settings: { costs: { beerTax: { enabled: true, amountTTC: 3.8 }, energy: { enabled: true }, cleaning: { enabled: true }, packaging: { enabled: true } }, includeFixed: true, includeDepreciation: true }, now: '2026-11-10T10:00:00Z' } as never);
const rendre = () => render(<CoutBrassinFlux snapshot={snapshot()} notions={null} litre={null} litres={15} motifSansLitre="prix" selection={null} onSelect={() => {}} onNoeud={() => {}} onVolumes={() => {}} />);

describe('Coût du brassin c3a, brassin jamais chiffré', () => {
  it('l’état est bien reproduit : malt, houblon-levure, usure et charges fixes sont inconnus', () => {
    const d = fluxDuBrassin(snapshot()).destinations;
    expect(d.filter(x => x.montant === null).map(x => x.id)).toEqual(expect.arrayContaining(['malt', 'q']));
  });
  it('une source dont une destination est inconnue est « ? » (somme nulle) ou « ≥ » (somme positive) ; complète, elle reste franche', () => {
    const d = fluxDuBrassin(snapshot()).destinations;
    expect(sourceIncomplete('stock', d)).toBe(true);
    expect(sourceIncomplete('now', d)).toBe(true);
    expect(montantSource(0, true)).toBe('?');
    expect(montantSource(3.8, true)).toBe('≥ 3,80');
    expect(montantSource(0, false)).toBe('0,00');
    expect(montantSource(22.41, false)).toBe('22,41');
    expect(sourceIncomplete('an', [{ id: 'mat', label: 'Usure matériel', couleur: '', montant: 8.1, estime: false }, { id: 'fix', label: 'Charges fixes', couleur: '', montant: 108, estime: false }])).toBe(false);
  });
  it('aucune source n’affiche « 0,00 » à la place de l’inconnu', () => {
    const { container } = rendre();
    const sources = [...container.querySelectorAll('.cbf-src b')].map(b => b.textContent);
    expect(sources[0]).toBe('?');
    expect(sources[2]).toBe('?');
    expect(sources).not.toContain('0,00');
  });
  it('chaque carré hachuré est posé en face de son étiquette ; les étiquettes de source ont au moins 60 px entre elles', () => {
    const { container } = rendre();
    const etiquettes = [...container.querySelectorAll('.cbf-dst')].map(e => Number.parseFloat((e as HTMLElement).style.top));
    const carres = [...container.querySelectorAll('svg.cbf-flux rect')].filter(r => (r.getAttribute('fill') ?? '').includes('cbf-hach') && r.getAttribute('x') === '236'); // les nœuds de destination (f3 : les sources inconnues sont aussi hachurées)
    expect(carres.length).toBeGreaterThanOrEqual(2);
    const noms = [...container.querySelectorAll('.cbf-dst')];
    carres.forEach(c => {
      const y = Number(c.getAttribute('y')) + 6;
      expect(etiquettes.some(t => Math.abs(t - y) <= 1)).toBe(true);
    });
    expect(noms.length).toBeGreaterThan(carres.length);
    const tops = [...container.querySelectorAll('.cbf-src')].map(e => Number.parseFloat((e as HTMLElement).style.top));
    for (let i = 1; i < tops.length; i++) expect(tops[i] - tops[i - 1]).toBeGreaterThanOrEqual(58);
  });
});
