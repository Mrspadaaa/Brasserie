import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrewBudgetDialog } from '../../src/ui/finance/BrewBudgetDialog';
import { FinanceService } from '../../src/services/financeService';
import { StorageService } from '../../src/services/storage';
import { estimateBrewBudget, demandKey, type BrewBudgetSettings } from '../../src/domain/finance/brewBudget';
import type { AppConfig, Batch, Recipe, StockItem } from '../../src/types';
import type { FinancialAsset, FinancialPlan } from '../../src/domain/finance/types';

const recipe = { id: 'R', name: 'Pale Ale', style: 'Pale Ale', volumeL: 30, fermentables: [{ name: 'Pils', weightKg: 5, kind: 'grain', use: 'empatage' }], hops: [], yeast: { name: '', qty: 0, unit: 'sachet', form: 'sèche' } } as Recipe;
const stock = { id: 'M', ref: 'M', name: 'Pils', unit: 'kg', currentStock: 2, category: 'Malt', minStock: 0, reorder: false } as StockItem;
const settings: BrewBudgetSettings = { costs: { energy: { enabled: false }, cleaning: { enabled: false }, packaging: { enabled: false }, beerTax: { enabled: false } }, includeFixed: false, includeDepreciation: false };
const original = estimateBrewBudget({ recipe, stockItems: [stock], batches: [], brewDate: '15.09.2026', settings, prices: { [demandKey('Pils', 'kg')]: { amount: 3, quantity: 1, unit: 'kg', basis: 'TTC', tvaRate: 0, source: 'manual', date: '09.09.2026' } } });
const batch = { id: 'B', name: 'Pale Ale', status: 'planifie', volumeL: 30, brewDate: '15.09.2026', recipeSnapshot: original.recipeSnapshot, stockAccountingVersion: 1 } as Batch;
const intention: FinancialPlan = { id: 'recipe-plan', title: recipe.name, date: '2026-09-15', amountCents: 900, direction: 'out', category: 'brassage', source: 'brew', status: 'active', brewEstimate: original, createdAt: '2026-09-09' };
const tank: FinancialAsset = { id: 'A', name: 'Cuve', acquisitionDate: '2026-01-01', inServiceDate: '2026-01-01', acquisitionCents: 100000, businessUsePct: 100, category: 'tanks', method: 'declining', ratePct: 20, openingYear: 2026, openingValueCents: 100000, openingConfirmed: true, firstYearFraction: 1 };

beforeEach(() => {
  vi.spyOn(StorageService, 'subscribe').mockReturnValue(() => {});
  vi.spyOn(StorageService, 'getTransactions').mockReturnValue([]);
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [stock], cleaning: [], equipment: [] });
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([batch]);
  vi.spyOn(StorageService, 'getConfig').mockReturnValue({ fiscal: { isTvaRegistered: false }, brewhouses: [] } as unknown as AppConfig);
  vi.spyOn(FinanceService, 'snapshot').mockReturnValue({ profile: { id: 'current', annualProductionL: 300 }, plans: [intention, { ...intention, id: 'batch-draft', status: 'draft', brewEstimate: { ...original, id: 'draft', batchId: 'B' } }], assets: [], payments: [], closings: [] } as unknown as ReturnType<typeof FinanceService.snapshot>);
  vi.spyOn(FinanceService, 'savePlan').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('budget intention becomes a concrete batch', () => {
  it('requires an explicit match before retiring the recipe intention and planning once', async () => {
    render(<BrewBudgetDialog batch={batch} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Prévoir cette dépense' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Budget à rattacher'), { target: { value: intention.id } });
    fireEvent.click(screen.getByRole('button', { name: 'Prévoir cette dépense' }));
    await waitFor(() => expect(FinanceService.savePlan).toHaveBeenCalledTimes(2));
    expect(FinanceService.savePlan).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: intention.id, status: 'completed', amountCents: 900 }));
    expect(FinanceService.savePlan).toHaveBeenNthCalledWith(2, expect.objectContaining({ status: 'active', batchId: 'B', amountCents: 900 }));
    expect(intention.status).toBe('active');
  });
  it('keeps both intentions only when the brewer explicitly declares a separate batch', async () => {
    render(<BrewBudgetDialog batch={batch} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Budget à rattacher'), { target: { value: 'separate' } });
    fireEvent.click(screen.getByRole('button', { name: 'Prévoir cette dépense' }));
    await waitFor(() => expect(FinanceService.savePlan).toHaveBeenCalledTimes(1));
    expect(FinanceService.savePlan).toHaveBeenCalledWith(expect.objectContaining({ status: 'active', batchId: 'B' }));
  });

  it('never fills an unconfirmed asset depreciation with zero', async () => {
    const data = FinanceService.snapshot();
    vi.mocked(FinanceService.snapshot).mockReturnValue({ ...data, assets: [{ ...tank, openingConfirmed: false }], plans: [{ ...intention, status: 'draft', brewEstimate: { ...original, settings: { ...settings, includeDepreciation: true, annualVolumeL: 300 } } }] });
    render(<BrewBudgetDialog recipe={recipe} onClose={vi.fn()} />);
    expect(screen.getByLabelText('Amortissement annuel', { selector: 'input[type=text]' })).toHaveValue('');
    expect(screen.getByText('Cuve : valeur de reprise et méthode à confirmer.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Prévoir cette dépense' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(FinanceService.savePlan).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft', brewEstimate: expect.objectContaining({ complete: false, settings: expect.objectContaining({ annualDepreciationCHF: undefined }) }) })));
  });

  it('uses the brew year for declining depreciation and preserves an explicit manual amount until reset', () => {
    vi.mocked(FinanceService.snapshot).mockReturnValue({ ...FinanceService.snapshot(), assets: [tank], plans: [] });
    render(<BrewBudgetDialog recipe={{ ...recipe, brewDate: '15.09.2026' }} onClose={vi.fn()} />);
    expect(screen.getByLabelText('Amortissement annuel', { selector: 'input[type=text]' })).toHaveValue('200');
    fireEvent.change(screen.getByLabelText('Date du brassin'), { target: { value: '2027-09-15' } });
    expect(screen.getByLabelText('Amortissement annuel', { selector: 'input[type=text]' })).toHaveValue('160');
    fireEvent.change(screen.getByLabelText('Amortissement annuel', { selector: 'input[type=text]' }), { target: { value: '75' } });
    fireEvent.change(screen.getByLabelText('Date du brassin'), { target: { value: '2028-09-15' } });
    expect(screen.getByLabelText('Amortissement annuel', { selector: 'input[type=text]' })).toHaveValue('75');
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre le registre 2028', hidden: true }));
    expect(screen.getByLabelText('Amortissement annuel', { selector: 'input[type=text]' })).toHaveValue('128');
  });
});
