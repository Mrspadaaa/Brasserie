import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrewBudgetDialog } from '../../src/ui/finance/BrewBudgetDialog';
import { FinanceService } from '../../src/services/financeService';
import { StorageService } from '../../src/services/storage';
import { estimateBrewBudget, demandKey, type BrewBudgetSettings } from '../../src/domain/finance/brewBudget';
import type { AppConfig, Batch, Recipe, StockItem } from '../../src/types';
import type { FinanceTransaction, FinancialAsset, FinancialPlan } from '../../src/domain/finance/types';

vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));

const recipe = { id: 'R', name: 'Pale Ale', style: 'Pale Ale', volumeL: 30, fermentables: [{ name: 'Pils', weightKg: 5, kind: 'grain', use: 'empatage' }], hops: [], yeast: { name: '', qty: 0, unit: 'sachet', form: 'sèche' } } as Recipe;
const stock = { id: 'M', ref: 'M', name: 'Pils', unit: 'kg', currentStock: 2, category: 'Malt', minStock: 0, reorder: false } as StockItem;
const settings: BrewBudgetSettings = { costs: { energy: { enabled: false }, cleaning: { enabled: false }, packaging: { enabled: false }, beerTax: { enabled: false } }, includeFixed: false, includeDepreciation: false };
// Net saisi (30 L) : un instantané enregistré sans net saisi ne serait pas relu comme un net.
const original = estimateBrewBudget({ recipe, stockItems: [stock], batches: [], brewDate: '15.09.2026', netVolumeL: 30, settings, prices: { [demandKey('Pils', 'kg')]: { amount: 3, quantity: 1, unit: 'kg', basis: 'TTC', tvaRate: 0, source: 'manual', date: '09.09.2026' } } });
const batch = { id: 'B', name: 'Pale Ale', status: 'planifie', volumeL: 30, brewDate: '15.09.2026', recipeSnapshot: original.recipeSnapshot, stockAccountingVersion: 1 } as Batch;
const intention: FinancialPlan = { id: 'recipe-plan', title: recipe.name, date: '2026-09-15', amountCents: 900, direction: 'out', category: 'brassage', source: 'brew', status: 'active', brewEstimate: original, createdAt: '2026-09-09' };
const tank: FinancialAsset = { id: 'A', name: 'Cuve', acquisitionDate: '2026-01-01', inServiceDate: '2026-01-01', acquisitionCents: 100000, businessUsePct: 100, category: 'tanks', method: 'declining', ratePct: 20, openingYear: 2026, openingValueCents: 100000, openingConfirmed: true, firstYearFraction: 1 };
const prevoir = () => screen.getByRole('button', { name: /^Prévoir/ });
const aller = {
  volumes: () => fireEvent.click(screen.getByRole('button', { name: /^Volumes :/ })),
  noeud: (label: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${label} :`) })),
  retour: () => fireEvent.click(screen.getByRole('button', { name: 'Retour' })),
};

beforeEach(() => {
  vi.spyOn(StorageService, 'subscribe').mockReturnValue(() => {});
  vi.spyOn(StorageService, 'getTransactions').mockReturnValue([]);
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [stock], cleaning: [], equipment: [] });
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([batch]);
  vi.spyOn(StorageService, 'getConfig').mockReturnValue({ fiscal: { isTvaRegistered: false }, brewhouses: [] } as unknown as AppConfig);
  vi.spyOn(StorageService, 'setUiState').mockImplementation(() => {});
  vi.spyOn(FinanceService, 'snapshot').mockReturnValue({ profile: { id: 'current', annualProductionL: 300 }, plans: [intention, { ...intention, id: 'batch-draft', status: 'draft', brewEstimate: { ...original, id: 'draft', batchId: 'B' } }], assets: [], payments: [], closings: [] } as unknown as ReturnType<typeof FinanceService.snapshot>);
  vi.spyOn(FinanceService, 'savePlan').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('budget intention becomes a concrete batch', () => {
  it('requires an explicit match before retiring the recipe intention and planning once', async () => {
    render(<BrewBudgetDialog batch={batch} onClose={vi.fn()} />);
    expect(prevoir()).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Budget à rattacher'), { target: { value: intention.id } });
    fireEvent.click(prevoir());
    await waitFor(() => expect(FinanceService.savePlan).toHaveBeenCalledTimes(2));
    expect(FinanceService.savePlan).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: intention.id, status: 'completed', amountCents: 900 }));
    expect(FinanceService.savePlan).toHaveBeenNthCalledWith(2, expect.objectContaining({ status: 'active', batchId: 'B', amountCents: 900 }));
    expect(intention.status).toBe('active');
  });
  it('keeps both intentions only when the brewer explicitly declares a separate batch', async () => {
    render(<BrewBudgetDialog batch={batch} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Budget à rattacher'), { target: { value: 'separate' } });
    fireEvent.click(prevoir());
    await waitFor(() => expect(FinanceService.savePlan).toHaveBeenCalledTimes(1));
    expect(FinanceService.savePlan).toHaveBeenCalledWith(expect.objectContaining({ status: 'active', batchId: 'B' }));
  });
  it('Prévoir écrit l’état de navigation vers Prévisions et prévient l’écran qui l’écoute, une seule fois', async () => {
    const ouvrir = vi.fn();
    render(<BrewBudgetDialog batch={batch} onClose={vi.fn()} onOpenForecast={ouvrir} />);
    fireEvent.change(screen.getByLabelText('Budget à rattacher'), { target: { value: 'separate' } });
    fireEvent.click(prevoir());
    await waitFor(() => expect(ouvrir).toHaveBeenCalledTimes(1));
    expect(StorageService.setUiState).toHaveBeenCalledWith('finances_workspace', 'forecast');
    expect(ouvrir).toHaveBeenCalledWith({ planId: expect.stringContaining('BUDGET-B-'), batchId: 'B' });
  });
  it('Enregistrer seul n’écrit pas la navigation et n’appelle pas Prévisions', async () => {
    const ouvrir = vi.fn();
    vi.mocked(FinanceService.snapshot).mockReturnValue({ ...FinanceService.snapshot(), plans: [] });
    render(<BrewBudgetDialog recipe={{ ...recipe, brewDate: '15.09.2026' }} onClose={vi.fn()} onOpenForecast={ouvrir} />);
    aller.volumes();
    fireEvent.change(screen.getByLabelText('Date du scénario budgétaire'), { target: { value: '2026-09-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(FinanceService.savePlan).toHaveBeenCalledTimes(1));
    expect(FinanceService.savePlan).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft' }));
    expect(StorageService.setUiState).not.toHaveBeenCalled();
    expect(ouvrir).not.toHaveBeenCalled();
  });
  it('un impôt calculé sur l’OG du brassin et la réduction de l’année : la même règle que la prévision', () => {
    const avecOg = { ...batch, og: '1.048' } as Batch;
    vi.mocked(StorageService.getConfig).mockReturnValue({ fiscal: { isTvaRegistered: false, beerTaxAnnualReductionPct: 40, beerTaxReductionYear: 2026 }, brewhouses: [] } as unknown as AppConfig);
    vi.mocked(FinanceService.snapshot).mockReturnValue({ ...FinanceService.snapshot(), plans: [{ ...intention, status: 'draft', brewEstimate: { ...original, batchId: 'B', settings: { ...settings, costs: { ...settings.costs, beerTax: { enabled: true } } } } }] });
    render(<BrewBudgetDialog batch={avecOg} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /^Impôt bière : \d+,\d\d CHF$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Impôt bière : 4,56 CHF' })).toBeInTheDocument(); // 11,9 °P : 25,32 CHF/hl × 0,30 hl × 0,6
  });
});

describe('usure du litre : linéaire et comptée une seule fois', () => {
  const avecDate = (plans: FinancialPlan[] = [], assets: FinancialAsset[] = [], transactions: FinanceTransaction[] = [], date = '2026-09-15') => {
    vi.mocked(StorageService.getTransactions).mockReturnValue(transactions);
    vi.mocked(FinanceService.snapshot).mockReturnValue({ ...FinanceService.snapshot(), assets, plans });
    render(<BrewBudgetDialog recipe={{ ...recipe, brewDate: '15.09.2026' }} onClose={vi.fn()} />);
    aller.volumes();
    fireEvent.change(screen.getByLabelText('Date du scénario budgétaire'), { target: { value: date } });
    aller.retour();
  };
  const champUsure = () => screen.getByLabelText('Usure annuelle du matériel', { selector: 'input[type=text]' });

  it('jamais 0 : sans actif ni projet, l’usure est inconnue et le dit', () => {
    avecDate();
    aller.noeud('Usure matériel');
    expect(champUsure()).toHaveValue('');
    expect(screen.getByText('Aucun matériel au registre : usure à renseigner.')).toBeInTheDocument();
  });
  it('jamais 0 : un actif non classé laisse l’usure inconnue', async () => {
    avecDate([{ ...intention, status: 'draft', brewEstimate: { ...original, settings: { ...settings, includeDepreciation: true, annualVolumeL: 300 } } }], [{ ...tank, category: 'custom' }]);
    aller.noeud('Usure matériel');
    expect(champUsure()).toHaveValue('');
    expect(screen.getByText(/Usure à renseigner : « Cuve »/)).toBeInTheDocument();
    aller.retour();
    expect(prevoir()).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(FinanceService.savePlan).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft', brewEstimate: expect.objectContaining({ complete: false, settings: expect.objectContaining({ annualDepreciationCHF: undefined }) }) })));
  });
  it('l’usure du registre est linéaire (1 000 CHF en réservoirs : 100 CHF par an, pas 200 puis 160 puis 128), et une saisie manuelle est gardée jusqu’à la reprise', () => {
    avecDate([], [tank]);
    aller.noeud('Usure matériel');
    expect(champUsure()).toHaveValue('100');
    aller.retour(); aller.volumes();
    fireEvent.change(screen.getByLabelText('Date du scénario budgétaire'), { target: { value: '2027-09-15' } });
    aller.retour(); aller.noeud('Usure matériel');
    expect(champUsure()).toHaveValue('100');
    fireEvent.change(champUsure(), { target: { value: '75' } });
    aller.retour(); aller.volumes();
    fireEvent.change(screen.getByLabelText('Date du scénario budgétaire'), { target: { value: '2028-09-15' } });
    aller.retour(); aller.noeud('Usure matériel');
    expect(champUsure()).toHaveValue('75');
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre le registre 2028', hidden: true }));
    expect(champUsure()).toHaveValue('100');
  });
  it('un matériel facturé et enregistré au registre est compté une fois (600 par an, pas 1 200)', () => {
    const projet: FinancialPlan = { id: 'FRIGO', title: 'Frigo', date: '2027-01-15', amountCents: 300000, direction: 'out', category: 'materiel', source: 'equipment', status: 'active', createdAt: '2026-11-01T00:00:00Z',
      upgrade: { version: 1, timing: 'soon', stage: 'ready', budgetKnown: true, datePrecision: 'day', estimateSource: 'quote', purchaseCents: 300000, usefulLifeYears: 5, inServiceMonth: '2027-01' } } as FinancialPlan;
    const facture = { id: 'T-FRIGO', date: '2027-01-15', description: 'Frigo', category: 'materiel', subcategory: '', amountHT: 3000, amountTTC: 3000, tvaRate: 0, tvaAmount: 0,
      finance: { version: 1, kind: 'expense', amountCents: 300000, planId: 'FRIGO', paymentStatus: 'paid', lines: [{ id: '1', kind: 'equipment', description: 'Frigo', amountCents: 300000 }] } } as FinanceTransaction;
    const actif: FinancialAsset = { id: 'A-FRIGO', name: 'Frigo', transactionId: 'T-FRIGO', acquisitionDate: '2027-01-15', inServiceDate: '2027-01-15', acquisitionCents: 300000, businessUsePct: 100, category: 'production', method: 'declining', ratePct: 30, openingYear: 2027, openingValueCents: 300000, openingConfirmed: true, firstYearFraction: 1, usefulLifeYears: 5 };
    avecDate([projet], [], [], '2027-06-15');
    aller.noeud('Usure matériel');
    expect(champUsure()).toHaveValue('600');
    cleanup();
    avecDate([projet], [actif], [facture], '2027-06-15');
    aller.noeud('Usure matériel');
    expect(champUsure()).toHaveValue('600');
  });
});
