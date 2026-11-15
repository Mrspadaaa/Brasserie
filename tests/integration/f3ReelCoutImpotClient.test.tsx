// @vitest-environment jsdom
/* Voie f3 (CP-1) : trois écrans dans l'état de la vraie app (`?finance-demo=reel`).
   7. Coût d'un brassin (c3a) : l'inconnu garde la forme de la maquette (sources, grand chiffre et barre du litre hachurés), jamais « 0,00 » ni une carte de texte.
   8. Impôt bière (p2b) : un brassin sans litres ni production annuelle garde la règle, les formats, la ligne « Sur l'année » ; le total inconnu est un bloc hachuré.
   9. Opérations (v6b) : le client déjà dans le titre ne s'écrit pas deux fois sur la ligne. */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { CoutBrassinFlux } from '../../src/ui/finance/CoutBrassinFlux';
import { ImpotBiereSheet } from '../../src/ui/production/ImpotBiereSheet';
import { TransactionRow } from '../../src/ui/finance/TransactionRow';
import { estimateBrewBudget } from '../../src/domain/finance/brewBudget';
import { financeDemoEntries } from '../../src/dev/financeDemo';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import type { Batch, StockItem, Transaction } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));

const entrees = () => financeDemoEntries('reel').entries;
const lot = (id = 'REEL-LOT-1') => entrees().find(e => e.id === id)!.data as Batch;
const stocks = () => entrees().filter(e => e.name === 'stockItems').map(e => e.data) as StockItem[];
const snapshot = () => estimateBrewBudget({ recipe: lot().recipeSnapshot as never, stockItems: stocks(), batches: [lot()], brewDate: '2026-09-26', netVolumeL: 15,
  settings: { costs: { beerTax: { enabled: true, amountTTC: 3.8 }, energy: { enabled: true }, cleaning: { enabled: true }, packaging: { enabled: true } }, includeFixed: true, includeDepreciation: true }, now: '2026-11-10T10:00:00Z' } as never);

describe('7. Coût d’un brassin (c3a) : le brassin jamais chiffré garde la forme de la maquette', () => {
  afterEach(cleanup);
  const rendre = (litres: number | null) => render(<CoutBrassinFlux snapshot={snapshot()} notions={null} litre={null} litres={litres} motifSansLitre="prix" selection={null} onSelect={() => {}} onNoeud={() => {}} onVolumes={() => {}} />);

  it('les sources « ? » (déjà payé, année) sont des barres hachurées ; « à payer », qui porte l’impôt connu, reste pleine', () => {
    const { container } = rendre(15);
    const barres = [...container.querySelectorAll('svg.cbf-flux > rect')].filter(r => r.getAttribute('x') === '112');
    expect(barres).toHaveLength(3);
    expect(barres.map(r => r.getAttribute('data-inconnu'))).toEqual(['true', null, 'true']);
    expect(barres[0].getAttribute('fill')).toContain('cbf-hach');
    expect(barres[1].getAttribute('fill')).not.toContain('cbf-hach');
  });
  it('le litre inconnu est un bloc hachuré à la taille du grand chiffre, pas un « — » nu ; la barre du litre dit « payé ? · à payer ? · année ? »', () => {
    const { container } = rendre(15);
    const grand = container.querySelector('.cbf-big')!;
    expect(grand.classList.contains('cbf-big-q')).toBe(true);
    expect(grand.getAttribute('aria-label')).toBe('Coût du litre inconnu');
    expect(container.querySelector('.cbf-lit-vide')).not.toBeNull();
    expect(container.querySelector('.cbf-litl')!.textContent!.replace(/\s+/g, '')).toBe('payé?àpayer?année?');
    const css = readFileSync('src/ui/finance/cout-brassin.css', 'utf8');
    expect(css).toMatch(/\.cbf-big\.cbf-big-q \{[^}]*repeating-linear-gradient/);
  });
  it('les pointillés des nœuds inconnus ne naissent pas tous du même point de la source « à payer »', () => {
    const { container } = rendre(15);
    const departs = [...container.querySelectorAll('svg.cbf-flux path[stroke-dasharray]')].map(p => (p.getAttribute('d') ?? '').match(/^M\S+ (\S+)/)![1]);
    expect(departs.length).toBeGreaterThanOrEqual(5);
    expect(new Set(departs).size).toBeGreaterThan(1);
  });
  it('litres nets inconnus : la forme reste, la pastille « ? L nets » aussi', () => {
    const { container } = rendre(null);
    expect(container.querySelector('.cbf-vol')!.textContent).toBe('? L nets');
    expect(container.querySelector('.cbf-big')!.classList.contains('cbf-big-q')).toBe(true);
  });
});

describe('8. Impôt bière (p2b) : un brassin sans litres ni production annuelle', () => {
  let profile: Record<string, unknown> = {};
  beforeEach(() => {
    profile = {};
    vi.spyOn(FinanceService, 'snapshot').mockImplementation(() => ({ profile, plans: [], payments: [], assets: [], closings: [] }) as never);
    vi.spyOn(StorageService, 'getConfig').mockImplementation(() => ({ ...defaultConfig, fiscal: { ...defaultConfig.fiscal } }) as never);
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });
  const txt = (id: string) => screen.getByTestId(id).textContent!.replace(/\s+/g, ' ').trim();

  it('le planifié (LOT-2, aucun litre) : règle, formats et « Sur l’année » restent ; le total et l’année sont des blocs hachurés, pas 0', () => {
    render(<ImpotBiereSheet batch={lot('REEL-LOT-2')} onClose={() => {}} />);
    expect(screen.getByTestId('ibr-regle')).toHaveAttribute('data-hachure', 'oui');
    expect(screen.getByTestId('ibr-resultat')).toHaveClass('ibr-blanc');
    expect(txt('ibr-resultat')).toBe('—');
    expect(screen.getByTestId('ibr-litres').querySelector('.ibr-inc')?.textContent).toBe('litres à noter');
    expect(screen.getByTestId('ibr-annee').querySelector('.ibr-mt')).toHaveClass('ibr-blanc');
    expect(txt('ibr-regle')).not.toMatch(/0,00/);
    expect(txt('ibr-fmt-33cl')).toBe('33 cl 0,08 CHF');
  });
  it('conditionné (LOT-1, 15 L) et production annuelle connue : plus aucun bloc hachuré de total', () => {
    profile = { annualProductionL: 1200 };
    render(<ImpotBiereSheet batch={lot()} onClose={() => {}} />);
    expect(screen.getByTestId('ibr-resultat')).not.toHaveClass('ibr-blanc');
    expect(txt('ibr-resultat')).toBe('3,80 CHF');
    expect(screen.getByTestId('ibr-annee').querySelector('.ibr-mt')).not.toHaveClass('ibr-blanc');
    expect(screen.getByTestId('ibr-litres').querySelector('.ibr-inc')).toBeNull();
  });
});

describe('9. Opérations (v6b) : le client ne s’écrit pas deux fois sur la ligne', () => {
  afterEach(cleanup);
  const tx = (id: string) => entrees().find(e => e.id === id)!.data as Transaction;
  const ligne = (t: Transaction) => render(<TransactionRow transaction={t} transactions={[t]} payments={[]} onOpen={() => {}} />);

  it('« Vente 10 × Bière · 75 cl — Restaurant du Lac » + client « Restaurant du Lac » : un seul « Restaurant du Lac », sur la ligne et dans son nom accessible', () => {
    const { container } = ligne(tx('REC-REEL-1'));
    const q = container.querySelector('.ops-q')!;
    expect((q.textContent!.match(/Restaurant du Lac/g) ?? []).length).toBe(1);
    expect(q.querySelector('small')).toBeNull();
    const nom = container.querySelector('.ops-main')!.getAttribute('aria-label')!;
    expect((nom.match(/Restaurant du Lac/g) ?? []).length).toBe(1);
  });
  it('un tiers absent du titre s’écrit toujours (« Levure US05 · Comptoir du brasseur »)', () => {
    const { container } = ligne(tx('REEL-T3'));
    expect(container.querySelector('.ops-q small')?.textContent).toBe(' · Comptoir du brasseur');
  });
});
