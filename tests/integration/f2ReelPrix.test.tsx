// @vitest-environment jsdom
/* Voie f2 (CP-1) : l'écran Prix (c7c) dans l'état de la vraie app (`?finance-demo=reel`) : coût du litre inconnu, anciens tarifs sans format, un tarif posé.
   Il garde la FORME de c7c (règle, échelles, pente, aiguille, bandeau du brassin), hachurée : jamais une carte de texte à la place. */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { PrixEcran, libelleTarif, prixConnu } from '../../src/ui/prix/PrixEcran';
import { axePrixInconnu } from '../../src/ui/prix/GrapheInconnu';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { financeDemoEntries } from '../../src/dev/financeDemo';
import type { Batch, PricingItem } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/finance/BrewBudgetDialog', () => ({ BrewBudgetDialog: ({ batch }: { batch: Batch }) => <div role="dialog" aria-label="Coût du brassin">{batch.name}</div> }));

const donnees = (name: string) => financeDemoEntries('reel').entries.filter(e => e.name === name).map(e => e.data);
const norm = (el: Element | null): string => (el?.textContent ?? '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
let batches: Batch[] = []; let tarifs: PricingItem[] = [];
beforeEach(() => {
  batches = donnees('batches') as Batch[]; tarifs = donnees('tarifs') as PricingItem[];
  vi.spyOn(FinanceService, 'snapshot').mockImplementation(() => ({ profile: {}, plans: [], payments: [], assets: [], closings: [] }) as never);
  vi.spyOn(StorageService, 'getConfig').mockImplementation(() => defaultConfig as never);
  vi.spyOn(StorageService, 'getBatches').mockImplementation(() => batches);
  vi.spyOn(StorageService, 'getTarifs').mockImplementation(() => tarifs);
  vi.spyOn(StorageService, 'getTransactions').mockImplementation(() => []);
  vi.spyOn(StorageService, 'getStocks').mockImplementation(() => ({ rawMaterials: [], cleaning: [], kegs: [] }) as never);
  StorageService.setUiState('prix_lecture', 'bouteille');
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const ecran = () => render(<PrixEcran config={defaultConfig} tarifs={tarifs} batches={batches} />);

describe('Prix c7c, coût du litre inconnu', () => {
  it('l’état est bien reproduit : aucun brassin chiffré, aucun coût du format', () => {
    const { container } = ecran();
    expect(container.querySelector('svg.prx-g:not(.prx-g-inconnu)')).toBeNull();
    expect(norm(container.querySelector('.prx-ans'))).toMatch(/\?/);
  });
  it('la forme de c7c est dessinée : cadre du graphe, pente et zéro, règle « à perte · mince · il te reste » hachurée, « coût ? » ; plus la carte de texte', () => {
    const { container } = ecran();
    const svg = container.querySelector('svg.prx-g-inconnu') as SVGElement;
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('viewBox')).toBe('0 0 390 318');
    expect(svg.querySelector('[data-inconnu-pente]')).not.toBeNull();
    expect(svg.querySelector('pattern')).not.toBeNull();
    expect(norm(svg)).toContain('à perte · mince · il te reste');
    expect(norm(svg)).toContain('coût ?');
    expect(norm(svg)).toMatch(/\/an.*\/bouteille/);
    expect(container.querySelector('.prx-inconnu')).toBeNull();
    expect(screen.queryByText(/Le coût du litre n’est pas encore complet/)).toBeNull();
    expect(norm(svg)).not.toMatch(/\b0,00\b/);
  });
  it('la valeur à compléter est un bouton qui ouvre le coût du brassin', async () => {
    const { container } = ecran();
    const bouton = container.querySelector('.prx-cout-q') as HTMLButtonElement;
    expect(norm(bouton)).toContain('? CHF/L');
    fireEvent.click(bouton);
    expect(await screen.findByRole('dialog', { name: 'Coût du brassin' })).toBeVisible();
  });
  it('un prix connu garde son aiguille et son cran (9,50) ; le reste est « ? » hachuré, jamais un chiffre', () => {
    const { container } = ecran();
    fireEvent.click(within(screen.getByRole('group', { name: 'Format' })).getByRole('button', { name: /75 cl/ }));
    const svg = container.querySelector('svg.prx-g-inconnu') as SVGElement;
    expect(svg.querySelector('[data-inconnu-aiguille]')).not.toBeNull();
    expect(norm(svg)).toContain('9,50');
    expect(norm(svg)).toContain('reste ?');
    expect(norm(container.querySelector('.prx-ans'))).toMatch(/Il te reste\s*\?\s*coût du litre à compléter/);
  });
  it('le bandeau du brassin garde sa forme (litres, barre, paient, pour toi) avec des « ? »', () => {
    const { container } = ecran();
    const br = container.querySelector('.prx-br-q') as HTMLElement;
    expect(norm(br)).toMatch(/\? L nets.*\? paient le brassin.*\? pour toi/);
    expect(br.querySelector('svg pattern')).not.toBeNull();
  });
  it('les tuiles des autres formats disent « ≤ ? » (jamais rien, jamais 0)', () => {
    const { container } = ecran();
    const tuiles = [...container.querySelectorAll('.prx-tuile')];
    expect(tuiles).toHaveLength(2);
    for (const t of tuiles) expect(norm(t)).toMatch(/≤ \?/);
  });
  it('anciens tarifs « Amber Ale 50 cl (0 hl) » à 0 : libellé net et « ? », jamais « 0,00 »', () => {
    const { container } = ecran();
    const bloc = container.querySelector('.prx-completer') as HTMLElement;
    expect(norm(bloc)).toContain('Amber Ale 50 cl · ?');
    expect(norm(bloc)).not.toContain('(0 hl)');
    expect(norm(bloc)).not.toContain('0,00');
    expect(bloc.querySelector('button')?.getAttribute('title')).toBe('Amber Ale 50 cl (0 hl)');
  });
});

describe('Prix : petites règles', () => {
  it('libelleTarif retire « (0 hl) » et « (0,0 hl) » seulement', () => {
    expect(libelleTarif('Amber Ale 50 cl (0 hl)')).toBe('Amber Ale 50 cl');
    expect(libelleTarif('Amber Ale 33 cl (0,0 hl)')).toBe('Amber Ale 33 cl');
    expect(libelleTarif('Pale Ale (12 hl)')).toBe('Pale Ale (12 hl)');
    expect(libelleTarif('Pale Ale 75 cl')).toBe('Pale Ale 75 cl');
  });
  it('un prix à zéro ou absent n’est pas un prix', () => {
    expect([0, Number.NaN, undefined, -1].map(prixConnu)).toEqual([false, false, false, false]);
    expect(prixConnu(9.5)).toBe(true);
  });
  it('l’axe des prix couvre 1,4 × le prix (7 sans prix, comme c7c)', () => {
    expect(axePrixInconnu(null).xMax).toBe(7);
    const a = axePrixInconnu(9.5);
    expect(a.xMax).toBeGreaterThanOrEqual(9.5 * 1.4);
    expect(a.crans[0]).toBe(0);
  });
});
