import { describe, expect, it } from 'vitest';
import type { Batch, Recipe, StockItem } from '../../src/types';
import { estimateBrewBudget, type BrewBudgetSettings } from '../../src/domain/finance/brewBudget';
import { budgetsDeRecette } from '../../src/domain/finance/brewForecast';
import { buildForecast } from '../../src/domain/finance/forecast';
import { buildFinanceAssistantContext, type FinanceAssistantInput } from '../../src/domain/finance/assistantContext';
import type { FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';

/**
 * D405 (21.11) : une seule caisse. Un brassin planifié sans budget à lui reprend la dernière estimation de sa recette DANS `buildForecast` :
 * le Bord, Finances, le calendrier et le compagnon comptent le même montant, marqué estimé. Données simulées, aucun appel Gemini.
 */
const ASOF = '2026-08-20';
const stock = (ref: string, name: string, currentStock: number): StockItem => ({ id: ref, ref, name, category: 'Malt', unit: 'kg', currentStock, minStock: 0, reorder: false });
const stocks = [stock('MP-1', 'Pilsner', 0)];
const recette = { id: 'R1', name: 'Pale Ale', volumeL: 30, style: 'Pale Ale', hops: [], yeast: { name: '', qty: 0, unit: 'sachet', form: 'dry' }, ogTarget: 1.048,
  fermentables: [{ name: 'Pilsner', weightKg: 6, kind: 'grain', use: 'empatage' }] } as unknown as Recipe;
const reglages: BrewBudgetSettings = { costs: { energy: { enabled: true, amountTTC: 8 }, cleaning: { enabled: true, amountTTC: 3 }, packaging: { enabled: true, amountTTC: 24 } } } as BrewBudgetSettings;
const profile: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, openingCash: { date: '2026-08-01', amountCents: 100_000, confirmed: true } } as FinancialProfile;
/** Le brassin de juillet (fini), dont le budget a été estimé ; puis celui de septembre, posé par la feuille : ni recette figée, ni budget. */
const fini = { id: 'B0', name: 'Pale Ale de juillet', style: 'Pale Ale', volumeL: 30, brewDate: '10.07.2026', plannedBrewDate: '10.07.2026', status: 'termine', stockAccountingVersion: 1, recipeRef: 'R1',
  recipeSnapshot: { ...recette, sourceRecipeId: 'R1' }, gravityLog: [] } as unknown as Batch;
const pose = { id: 'B2', name: 'Pale Ale de septembre', style: 'Pale Ale', volumeL: 30, brewDate: '', plannedBrewDate: '15.09.2026', status: 'planifie', stockAccountingVersion: 1, recipeRef: 'R1', gravityLog: [] } as unknown as Batch;
const estimation = estimateBrewBudget({ recipe: recette, stockItems: stocks, batches: [fini], brewDate: '10.07.2026', batchId: 'B0', netVolumeL: 27, og: '1.048', settings: reglages,
  prices: {}, isTvaRegistered: false, now: '2026-07-01T12:00:00Z' });
const planB0: FinancialPlan = { id: 'P-B0', title: 'Pale Ale de juillet', date: '2026-07-10', amountCents: 0, direction: 'out', category: 'brassage', source: 'brew', status: 'active', batchId: 'B0',
  brewEstimate: estimation, createdAt: '2026-07-01T12:00:00Z' } as FinancialPlan;
const prevoir = (batches?: Batch[]) => buildForecast({ transactions: [], payments: [], plans: [planB0], profile, asOf: ASOF, months: 3, batches, stockItems: stocks });

describe('D405 : buildForecast reprend le budget de la recette', () => {
  it('le brassin posé sans budget porte les frais de sa recette, marqués estimés', () => {
    const f = prevoir([fini, pose]);
    const siens = f.items.filter(i => i.batchId === 'B2');
    expect(siens.reduce((n, i) => n + i.amountCents, 0)).toBeGreaterThanOrEqual(3500); // énergie 8 + nettoyage 3 + emballage 24
    for (const i of siens) {
      expect(i.label).toContain('budget de sa recette, estimé');
      expect(i.repriseRecette).toEqual({ depuis: 'Pale Ale de juillet', le: '2026-07-01' });
    }
    expect(f.months.flatMap(m => m.items).filter(i => i.batchId === 'B2').every(i => i.repriseRecette)).toBe(true);
  });
  it('sans brassins : rien n’est repris ; le calendrier, qui rappelle budgetsDeRecette sur cette prévision, ne compte rien deux fois', () => {
    expect(prevoir().items.some(i => i.batchId === 'B2')).toBe(false);
    const f = prevoir([fini, pose]);
    const chiffres = new Set(f.items.filter(i => i.source === 'brew' && i.batchId && i.amountCents > 0 && !i.id.endsWith(':impot')).map(i => i.batchId as string));
    expect(budgetsDeRecette([fini, pose], [planB0], chiffres).repris.size).toBe(0);
  });
  it('le compagnon lit la même caisse que Finances', () => {
    const complet = { complete: true };
    const entree = { transactions: [], payments: [], plans: [planB0], assets: [], closings: [], archives: [], recipes: [recette], batches: [fini, pose], stock: stocks, equipment: [], creativeItems: [],
      profile, asOf: ASOF, coverage: new Proxy({}, { get: () => complet }) } as unknown as FinanceAssistantInput;
    expect(JSON.stringify(buildFinanceAssistantContext(entree))).toContain('budget de sa recette, estimé');
  });
});
