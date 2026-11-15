import type { Batch, Recipe, StockItem, Transaction } from '../../src/types';
import { demandKey, estimateBrewBudget, type BrewBudgetSettings, type BrewPrice } from '../../src/domain/finance/brewBudget';
import type { FinancialAsset, FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';

/**
 * Fixture de p5b rejouée sur le VRAI domaine (d2, d3) : Pale Ale planifiée le 20.11.2026 (la même que `tests/unit/brewForecast.test.ts`, décalée),
 * frigo 3 000 le 15.11, fermenteur 750 le 28.01, loyers, facture d'atelier en retard. Les nombres attendus des tests sortent de `buildForecast`
 * (sonde `previsionsEscalier.test.tsx`), jamais de la maquette : le domaine est la vérité, la maquette donne la forme.
 */
export const ASOF = '2026-11-09';
export const stock = (ref: string, name: string, currentStock: number): StockItem => ({ id: ref, ref, name, category: 'Malt', unit: 'kg', currentStock, minStock: 0, reorder: false });
export const stocks = (): StockItem[] => [stock('MP-1', 'Pilsner', 6), stock('MP-2', 'Pale', 0)];
const prix = (): BrewPrice => ({ amount: 4, quantity: 1, unit: 'kg', basis: 'TTC', tvaRate: 0, date: '09.11.2026', source: 'manual' });
export const prixMalts = () => ({ [demandKey('Pilsner', 'kg')]: prix(), [demandKey('Pale', 'kg')]: prix() });
export const recette = () => ({ id: 'R1', name: 'Pale Ale', volumeL: 30, style: 'Pale Ale', hops: [], yeast: { name: '', qty: 0, unit: 'sachet', form: 'dry' }, ogTarget: 1.048,
  fermentables: [{ name: 'Pilsner', weightKg: 5.6025, kind: 'grain', use: 'empatage' }, { name: 'Pale', weightKg: 5.605, kind: 'grain', use: 'empatage' }] }) as unknown as Recipe;
export const reglages: BrewBudgetSettings = { costs: { energy: { enabled: true, amountTTC: 8 }, cleaning: { enabled: true, amountTTC: 3 }, packaging: { enabled: true, amountTTC: 24 }, beerTax: { enabled: true } },
  includeFixed: true, includeDepreciation: true, annualVolumeL: 1200, annualFixedCHF: 4800, annualDepreciationCHF: 360 };
export const brassin = (patch: Partial<Batch> = {}): Batch => ({ id: 'B1', name: 'Pale Ale', style: 'Pale Ale', volumeL: 30, brewDate: '', plannedBrewDate: '20.11.2026', status: 'planifie',
  stockAccountingVersion: 1, recipeRef: 'R1', recipeSnapshot: { ...recette(), sourceRecipeId: 'R1', capturedAt: '2026-11-01T00:00:00Z' }, og: '1.048', gravityLog: [], ...patch } as unknown as Batch);
export const instantane = (batch: Batch) => estimateBrewBudget({ recipe: recette(), stockItems: stocks(), batches: [batch], brewDate: '20.11.2026', batchId: batch.id, netVolumeL: 27, og: '1.048',
  settings: reglages, prices: prixMalts(), isTvaRegistered: false, now: '2026-11-01T12:00:00Z' });
export const profil = (patch: Partial<FinancialProfile> = {}): FinancialProfile => ({ id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, annualProductionL: 1200,
  openingCash: { date: '2026-11-01', amountCents: 418_160, confirmed: true }, ...patch });
export const loyer: FinancialPlan = { id: 'LOYER', title: 'Loyer', date: '2026-11-25', amountCents: 40_000, direction: 'out', category: 'chargesFixes', source: 'recurring', costAllocation: 'fixed', status: 'active',
  recurrence: { frequency: 'monthly' }, createdAt: '2026-01-01T00:00:00Z' };
export const frigo = (patch: Partial<FinancialPlan> = {}): FinancialPlan => ({ id: 'FRIGO', title: 'Frigo', date: '2026-11-15', amountCents: 300_000, direction: 'out', category: 'materiel', source: 'equipment', status: 'active', createdAt: '2026-10-01T00:00:00Z',
  upgrade: { version: 1, timing: 'soon', stage: 'ready', budgetKnown: true, datePrecision: 'day', estimateSource: 'estimate', purchaseCents: 300_000, usefulLifeYears: 5, inServiceMonth: '2026-11' }, ...patch });
export const fermenteur: FinancialPlan = { id: 'FERM', title: 'Fermenteur', date: '2027-01-28', amountCents: 75_000, direction: 'out', category: 'materiel', source: 'equipment', status: 'active', createdAt: '2026-10-01T00:00:00Z',
  upgrade: { version: 1, timing: 'next', stage: 'quote', budgetKnown: true, datePrecision: 'day', estimateSource: 'quote', purchaseCents: 75_000 } };
export const planPrevoir = (batch: Batch): FinancialPlan => { const s = instantane(batch); return { id: `P-${batch.id}`, title: s.title, date: '2026-11-20', amountCents: Math.round(s.cashRequiredTTC * 100), direction: 'out', category: 'brassage', source: 'brew', status: 'active', batchId: batch.id, brewEstimate: s, createdAt: '2026-11-01T12:00:00Z' }; };
export const depense = (id: string, description: string, cents: number, due: string, patch: Record<string, unknown> = {}): Transaction => ({ id, description, date: '2026-11-01', category: 'chargesFixes', subcategory: '', amountHT: cents / 100, amountTTC: cents / 100, tvaRate: 0, tvaAmount: 0,
  finance: { version: 1, kind: 'expense', amountCents: cents, paymentStatus: 'unpaid', dueDate: due, recordedAt: '2026-11-01T10:00:00Z', lines: [], ...patch } } as unknown as Transaction);
export const cuve = (): FinancialAsset => ({ id: 'A1', name: 'Cuve', acquisitionDate: '2026-03-01', inServiceDate: '2026-03-01', acquisitionCents: 180_000, businessUsePct: 100, category: 'tanks', method: 'declining', ratePct: 20, openingYear: 2026, openingValueCents: 180_000, openingConfirmed: true, firstYearFraction: 1, usefulLifeYears: 5 } as FinancialAsset);
export const atelier = () => depense('ATELIER', 'Atelier', 6_000, '2026-11-01');
export const loyerNovembre = () => depense('LOYER-NOV', 'Loyer novembre', 40_000, '2026-11-25', { planId: 'LOYER', occurrenceId: 'LOYER:2026-11-25' });
