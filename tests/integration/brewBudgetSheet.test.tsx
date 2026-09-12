import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrewBudgetSheet } from '../../src/ui/finance/BrewBudgetSheet';
import type { AppConfig, Batch, Recipe, StockItem } from '../../src/types';
import type { FinanceTransaction } from '../../src/domain/finance/types';
import { demandKey, estimateBrewBudget, type BrewBudgetSettings } from '../../src/domain/finance/brewBudget';

const recipe = { id: 'R1', name: 'Pale Ale', style: 'Pale Ale', volumeL: 30, brewDate: '15.09.2026', fermentables: [{ name: 'Pils', weightKg: 5, kind: 'grain', use: 'empatage' }], hops: [], yeast: { name: '', qty: 0, unit: 'sachet', form: 'sèche' } } as Recipe;
const stock = { id: 'M', ref: 'M', name: 'Pils', unit: 'kg', currentStock: 2, category: 'Malt', minStock: 0, reorder: false } as StockItem;
const config = { fiscal: { isTvaRegistered: false }, brewhouses: [] } as unknown as AppConfig;
const settings: BrewBudgetSettings = { costs: { energy: { enabled: false }, cleaning: { enabled: false }, packaging: { enabled: false }, beerTax: { enabled: false } }, includeFixed: false, includeDepreciation: false };
afterEach(cleanup);
describe('daily brew budget sheet', () => {
  it.each(['2026-09-15','15.09.2026'])('shows and edits the date of a saved budget using %s',async(brewDate)=>{
    const save=vi.fn();
    const saved=estimateBrewBudget({recipe,stockItems:[stock],batches:[],brewDate,settings});
    render(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={config} savedEstimate={saved} onSave={save} onClose={vi.fn()}/>);
    expect(screen.getByLabelText('Date du brassin')).toHaveValue('2026-09-15');
    fireEvent.change(screen.getByLabelText('Date du brassin'),{target:{value:'2026-09-22'}});
    fireEvent.click(screen.getByRole('button',{name:'Enregistrer',exact:true}));
    await waitFor(()=>expect(save).toHaveBeenCalledWith(expect.objectContaining({brewDate:'22.09.2026',volumeL:30}),false));
    expect(saved.brewDate).toBe(brewDate);
  });
  it('keeps an incomplete estimate saveable while disabling expense planning', async () => {
    const save = vi.fn();
    render(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={config} settings={settings} onSave={save} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Prévoir cette dépense' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ complete: false, title: 'Pale Ale' }), false));
  });
  it('accepts a comma price and plans only the missing ingredients', async () => {
    const save = vi.fn();
    render(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={config} settings={settings} onSave={save} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Prix de Pils'), { target: { value: '2,50' } });
    expect(screen.getByRole('button', { name: 'Prévoir cette dépense' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Prévoir cette dépense' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ cashRequiredTTC: 7.5, ingredientsCost: 12.5, complete: true }), true));
  });
  it('retains the draft and exposes save errors', async () => {
    const close = vi.fn();
    render(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={config} settings={settings} onSave={vi.fn().mockRejectedValue(new Error('Connexion interrompue'))} onClose={close} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Connexion interrompue');
    expect(close).not.toHaveBeenCalled();
  });
  it('compares a saved snapshot with live stock without overwriting its amount', () => {
    const saved = estimateBrewBudget({ recipe, stockItems: [stock], batches: [], brewDate: recipe.brewDate!, settings, prices: { [demandKey('Pils', 'kg')]: { amount: 3, quantity: 1, unit: 'kg', basis: 'TTC', tvaRate: 0, source: 'manual', date: '09.09.2026' } } });
    render(<BrewBudgetSheet open recipe={recipe} stockItems={[{ ...stock, currentStock: 5 }]} batches={[]} config={config} savedEstimate={saved} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/^9[,.]00 CHF$/)).toBeInTheDocument();
    expect(screen.getByText(/Écart actuel : -9[,.]00 CHF/)).toBeInTheDocument();
    expect(saved.cashRequiredTTC).toBe(9);
  });

  it.each(['60', '0', '-3', ''])('does not save ingredients for 30 L as a budget for %s L without scaling', value => {
    const save = vi.fn();
    render(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={config} settings={settings} onSave={save} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Prix de Pils'), { target: { value: '3' } });
    expect(screen.getByRole('button', { name: 'Prévoir cette dépense' })).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Volume à brasser'), { target: { value } });
    fireEvent.blur(screen.getByLabelText('Volume à brasser'));
    expect(screen.getByLabelText('Volume à brasser')).toHaveValue(value);
    expect(screen.getByRole('button', { name: 'Prévoir cette dépense' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Reprendre les 30/ }));
    expect(screen.getByRole('button', { name: 'Prévoir cette dépense' })).toBeEnabled();
    expect(screen.getByLabelText('Volume à brasser')).toHaveValue('30');
    expect(save).not.toHaveBeenCalled();
  });

  it('retains the historical invoice for stock valuation but identifies a changed purchase price as an estimate', async () => {
    const invoice = { id: 'F1', date: '01.09.2026', tvaRate: 0, finance: { version: 1, kind: 'expense', amountCents: 1000, vendor: 'Malterie', invoiceNumber: 'M-123', lines: [{ id: 'L', kind: 'ingredient', description: 'Pils', amountCents: 1000, quantity: 5, unit: 'kg', stockItemRef: 'M' }] } } as FinanceTransaction;
    const save = vi.fn();
    render(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} transactions={[invoice]} config={config} settings={settings} onSave={save} onClose={vi.fn()} />);
    expect(screen.getByLabelText('Origine du prix de Pils')).toHaveValue('invoice');
    fireEvent.change(screen.getByLabelText('Prix de Pils'), { target: { value: '15' } });
    expect(screen.getByLabelText('Origine du prix de Pils')).toHaveValue('manual');
    fireEvent.click(screen.getByRole('button', { name: 'Prévoir cette dépense' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ ingredientsCost: 13, purchasesTTC: 9, prices: expect.objectContaining({ [demandKey('Pils', 'kg')]: expect.objectContaining({ amount: 15, quantity: 5, source: 'manual', note: 'Adapté de : Malterie · M-123' }) }) }), true));
    expect(invoice.finance.lines[0].amountCents).toBe(1000);
  });

  it('keeps purchases of whole bags separate from consumed stock, recurring bills and annual allocations', async () => {
    const save = vi.fn();
    const allCosts: BrewBudgetSettings = { ...settings, costs: { ...settings.costs, energy: { enabled: true, amountTTC: 4, cashTreatment: 'included-in-recurring' }, cleaning: { enabled: true, amountTTC: 2 } }, includeFixed: true, includeDepreciation: true, annualVolumeL: 300, annualFixedCHF: 120, annualDepreciationCHF: 300 };
    render(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={config} settings={allCosts} onSave={save} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Prix de Pils'), { target: { value: '60' } });
    fireEvent.change(screen.getByLabelText('Quantité du prix de Pils'), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText('Lot minimum de Pils'), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText('Volume net attendu'), { target: { value: '25' } });
    expect(screen.getByText(/Il manque 3 kg/)).toHaveTextContent('25 kg');
    fireEvent.click(screen.getByRole('button', { name: 'À compléter 0' }));
    expect(screen.queryByLabelText('Prix de Pils')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Prévoir cette dépense' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ purchasesTTC: 60, cashRequiredTTC: 62, ingredientsCost: 12, operatingCost: 6, fixedAllocation: 10, depreciationAllocation: 25, totalCost: 53, costPerL: 2.12, complete: true }), true));
  });

  it('treats a batch whose stock was consumed as a reproduction even if its status was moved back to planned', () => {
    const consumed = { id: 'B', status: 'planifie', brewDate: recipe.brewDate, stockConsumption: { appliedAt: '2026-09-01', eventId: 'STOCK-B' } } as Batch;
    render(<BrewBudgetSheet open recipe={recipe} batch={consumed} stockItems={[stock]} batches={[]} config={config} settings={settings} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Prévoir cette dépense' })).not.toBeInTheDocument();
    expect(screen.getByText(/Cette simulation utilise le stock et les prix actuels/)).toBeInTheDocument();
  });

  it('scales the retained additions and water from 100% to 200% while preserving the source recipe identity', async () => {
    const source: Recipe = { ...recipe, adjuncts: [{ name: 'Vanille', amount: 2, unit: 'gousse', step: 'Fermenteur' }], waterPlan: { sourceId: 'tap', diRatioPct: 0, mashWaterL: 15, spargeWaterL: 21, mash: { gypse: 1 }, sparge: { gypse: 2 }, acid: { id: 'lactique', mash: 2, sparge: 3 }, targetPh: 5.3 } };
    const frozen = structuredClone(source);
    const withRig: AppConfig = { ...config, brewhouses: [{ id: 'rig', name: 'Cuverie', volumeL: 100, efficiencyPct: 75, boilOffRatePct: 0, deadSpaceL: 0, mashRatioLPerKg: 3 }] };
    const save = vi.fn();
    render(<BrewBudgetSheet open recipe={source} stockItems={[stock]} batches={[]} config={withRig} settings={settings} onSave={save} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save.mock.calls[0][0].recipeSnapshot).toEqual(expect.objectContaining({ sourceRecipeId: recipe.id, volumeL: 30, adjuncts: frozen.adjuncts, waterPlan: frozen.waterPlan }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Volume à brasser'), { target: { value: '60' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    const doubled = save.mock.calls[1][0];
    expect(doubled.recipeId).toBe(recipe.id);
    expect(doubled.recipeSnapshot).toEqual(expect.objectContaining({ sourceRecipeId: recipe.id, volumeL: 60, adjuncts: [{ ...frozen.adjuncts[0], amount: 4 }], waterPlan: expect.objectContaining({ sourceId: 'tap', mashWaterL: 30, spargeWaterL: 42, mash: { gypse: 2 }, sparge: { gypse: 4 }, acid: { id: 'lactique', mash: 4, sparge: 6 } }) }));
    expect(doubled.lines.find(line => line.name === 'Eau du réseau').quantity).toBe(72);
    expect(doubled.lines.find(line => line.name === 'Pils').quantity).toBe(10);
    expect(source).toEqual(frozen);
  });

  it('keeps a newly completed price editable until focus leaves its row', () => {
    render(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={config} settings={settings} onSave={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'À compléter 1' }));
    const price = screen.getByLabelText('Prix de Pils');
    fireEvent.focus(price);
    fireEvent.change(price, { target: { value: '6' } });
    expect(screen.getByLabelText('Prix de Pils')).toBe(price);
    fireEvent.change(price, { target: { value: '60' } });
    expect(price).toHaveValue('60');
    fireEvent.blur(price);
    expect(screen.queryByLabelText('Prix de Pils')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'À compléter 0' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps the previous packaged yield and identifies unchanged manual costs when doubling a saved estimate', async () => {
    const costs: BrewBudgetSettings = { ...settings, costs: { energy: { enabled: true, amountTTC: 8 }, cleaning: { enabled: true, amountTTC: 3 }, packaging: { enabled: true, amountTTC: 24 }, beerTax: { enabled: true, amountTTC: 6.84 } } };
    const saved = estimateBrewBudget({ recipe, stockItems: [stock], batches: [], brewDate: recipe.brewDate, netVolumeL: 27, settings: costs, prices: { [demandKey('Pils', 'kg')]: { amount: 3, quantity: 1, unit: 'kg', basis: 'TTC', tvaRate: 0, source: 'manual', date: '09.09.2026' } } });
    const save = vi.fn();
    const rig = { id: 'rig', name: 'Cuverie', volumeL: 100, efficiencyPct: 75, boilOffRatePct: 0, deadSpaceL: 0, mashRatioLPerKg: 3 };
    render(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={{ ...config, brewhouses: [rig] }} savedEstimate={saved} onSave={save} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Volume à brasser'), { target: { value: '' } });
    fireEvent.blur(screen.getByLabelText('Volume à brasser'));
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Volume à brasser'), { target: { value: '60' } });
    fireEvent.blur(screen.getByLabelText('Volume à brasser'));
    expect(screen.getByLabelText('Volume net attendu')).toHaveValue('54');
    expect(screen.getByText(/Volume modifié : 30 L brassés/)).toHaveTextContent('60 L brassés / 54 L nets');
    expect(screen.getByText(/Estimation manuelle de l’impôt/)).toBeInTheDocument();
    expect(screen.getByLabelText('Énergie en CHF')).toHaveValue('8');
    expect(screen.getByLabelText('Nettoyage en CHF')).toHaveValue('3');
    expect(screen.getByLabelText('Conditionnement en CHF')).toHaveValue('24');
    expect(screen.getByLabelText('Impôt sur la bière en CHF')).toHaveValue('6,84');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ volumeL: 60, netVolumeL: 54, operatingCost: 41.84, totalCost: 71.84, costPerL: 1.33 }), false));
    expect(saved.netVolumeL).toBe(27);
  });

  it.each(['0', ''])('keeps an invalid net volume %s after blur and blocks both saving actions', value => {
    render(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={config} settings={settings} onSave={vi.fn()} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Prix de Pils'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Volume net attendu'), { target: { value } });
    fireEvent.blur(screen.getByLabelText('Volume net attendu'));
    expect(screen.getByLabelText('Volume net attendu')).toHaveValue(value);
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Prévoir cette dépense' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('volume net supérieur à zéro');
  });
});
