import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildFinanceAssistantContext, FINANCE_CONTEXT_MAX_BYTES, type FinanceAssistantInput } from '../../src/domain/finance/assistantContext';
import { buildAnnualReport } from '../../src/domain/finance/annual';
import type { FinanceTransaction, FinancialPlan } from '../../src/domain/finance/types';
import { FINANCE_ADVICE_GUIDANCE } from '../../functions/src/prompts';
import { brewerContextForPrompt } from '../../functions/src/hopCompanionContext';
import { loadBrewerFinanceContext, FINANCE_CONTEXT_COLLECTIONS } from '../../functions/src/brewerFinanceContext';
import { simulateBreweryInvestment } from '../../src/domain/finance/investmentScenario';
import { runBrewerHarness } from '../../functions/src/brewerHarness';

const database = vi.hoisted(() => {
  const data = new Map<string, any[]>(), calls: Array<{ collection: string; fields: string[]; order?: unknown; limit?: number }> = [], failures = new Set<string>();
  return { data, calls, failures, db: {
    collection(name: string) {
      const call = { collection: name, fields: [] as string[], order: undefined as unknown, limit: undefined as number | undefined }; calls.push(call);
      const query = { select(...fields: string[]) { call.fields = fields; return query; }, orderBy(order: unknown) { call.order = order; return query; }, where() { return query; }, limit(limit: number) { call.limit = limit; return query; },
        async get() { if (failures.has(name)) throw Error('synthetic unavailable'); const rows = (data.get(name) ?? []).slice(0, call.limit); return { size: rows.length, docs: rows.map(row => ({ id: row.id, data: () => row })) }; } };
      return query;
    },
    doc(path: string) { return { async get() { const value = data.get(path)?.[0]; return { exists: !!value, data: () => value }; } }; }
  } };
});

const tx = (id = 'TX-OLD', amountCents = 10_000, date = '2025-12-01'): FinanceTransaction => ({
  id, date, description: 'Malt fictif', category: 'brassage', subcategory: 'Malt', amountHT: amountCents / 100, amountTTC: amountCents / 100, tvaRate: 0, tvaAmount: 0,
  finance: { version: 1, kind: 'expense', amountCents, vendor: 'Malterie fictive', dueDate: '2026-06-15', paymentStatus: 'unpaid', recordedAt: `${date}T10:00:00Z`, proofDocumentId: `PROOF-${id}`, lines: [{ id: 'malt', kind: 'ingredient', description: 'Malt fictif', stockItemRef: 'MP-1', quantity: 2, unit: 'kg', amountCents }] }
});
const plan = (id: string, date: string, amountCents: number): FinancialPlan => ({ id, title: 'Matériel fictif', date, amountCents, direction: 'out', category: 'materiel', source: 'equipment', status: 'active', createdAt: '2026-06-01T10:00:00Z' });
const base = (): FinanceAssistantInput => ({ transactions: [], payments: [], plans: [], assets: [], closings: [], archives: [], recipes: [], batches: [], stock: [], equipment: [],
  profile: { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, openingCash: { date: '2025-01-01', amountCents: 100_000, confirmed: true }, historyCompleteFrom: '2025-01-01' },
  coverage: Object.fromEntries(Object.keys(FINANCE_CONTEXT_COLLECTIONS).map(name => [name, { loaded: 0, limit: FINANCE_CONTEXT_COLLECTIONS[name].limit, complete: true, totalAtLeast: 0, order: 'document-id' as const }])), asOf: '2026-06-01' });
beforeEach(() => { database.data.clear(); database.calls.length = 0; database.failures.clear(); });

describe('contexte financier déterministe — aucune génération IA', () => {
  it('transmet les projets et compare leur reste à acheter avec les factures conservées', () => {
    const input = base(), bill = tx('BILL', 40000, '2026-06-01');
    input.plans = [plan('HOTTE', '2026-06-15', 100000), { ...plan('CUVERIE', '2028-01-01', 500000), status: 'draft' }];
    input.plans[0].upgrade = { version: 1, timing: 'soon', stage: 'quote', datePrecision: 'month', estimateSource: 'quote', purchaseCents: 90000, installationCents: 10000, budgetKnown: true, purpose: 'Évacuer la vapeur' };
    bill.finance = { ...bill.finance!, planId: 'HOTTE', lines: [{ id: 'H', kind: 'equipment', description: 'Hotte', amountCents: 40000 }] };
    input.transactions = [bill];
    input.creativeItems = [{ id: 'LEGACY', type: 'equipment', title: 'Fermenteur', status: 'idea' }];
    const result = buildFinanceAssistantContext(input);
    expect(result.equipmentProjects).toMatchObject({ loaded: 3, includedCount: 1, complete: true });
    expect(result.equipmentProjects.records.find(p => p.id === 'HOTTE')).toMatchObject({ inForecast: true, timing: 'soon', purpose: 'Évacuer la vapeur', invoicedCents: 40000, remainingBudgetCents: 60000, deliveryCents: null });
    expect(result.equipmentProjects.records.find(p => p.title === 'Fermenteur')).toMatchObject({ inForecast: false, budgetCents: null, date: null });
    expect(result.forecast.windows[0]).toMatchObject({ expenseCents: 100000, equipmentProjectCents: 60000, withoutEquipmentProjectsExpenseCents: 40000, withoutEquipmentProjectsBalanceCents: 60000 });
    expect(FINANCE_ADVICE_GUIDANCE).toContain('equipmentProjects');
    expect(FINANCE_ADVICE_GUIDANCE).toContain('withoutEquipmentProjects');
  });

  it('signale des achats ou des projets non entièrement chargés au lieu d’annoncer un total certain', () => {
    const input = base(); input.plans = [plan('HOTTE', '2026-06-15', 100000)]; input.creativeItems = [];
    input.coverage.creativeItems.complete = false; input.coverage.transactions.complete = false;
    const result = buildFinanceAssistantContext(input);
    expect(result.equipmentProjects.complete).toBe(false);
    expect(result.equipmentProjects.records[0]).toMatchObject({ invoicedCents: null, invoicedComplete: false, paidCents: null, remainingBudgetCents: null });
    expect(result.forecast.windows[0].withoutEquipmentProjectsBalanceCents).toBeNull();
  });

  it('charge les anciennes idées et les métadonnées de projets depuis les projections serveur', async () => {
    database.data.set('creativeItems', [{ id: 'OLD', type: 'equipment', title: 'Hotte', estimatedCost: 400, status: 'quote' }]);
    database.data.set('financialPlans', [{ ...plan('UPGRADE-OLD', '2026-06-15', 50000), status: 'cancelled', upgrade: { version: 1, sourceCreativeItemId: 'OLD', timing: 'soon', stage: 'quote', budgetKnown: true, purchaseCents: 50000, datePrecision: 'month', estimateSource: 'quote' } }]);
    const result = await loadBrewerFinanceContext(database.db as any);
    expect(result.equipmentProjects.loaded).toBe(1);
    expect(result.equipmentProjects.records[0]).toMatchObject({ id: 'UPGRADE-OLD', inForecast: false, status: 'cancelled' });
    expect(database.calls.find(call => call.collection === 'financialPlans')?.fields).toContain('upgrade');
    expect(database.calls.find(call => call.collection === 'creativeItems')?.fields).not.toContain('contactPhone');
  });

  it('conserve une facture archivée partiellement payée dans le solde et les échéances', () => {
    const input = base(); input.transactions = [tx()];
    input.payments = [{ id: 'PAY-1', transactionId: 'TX-OLD', date: '2026-05-01', amountCents: 4000, direction: 'out', method: 'bank', recordedAt: '2026-05-01T10:00:00Z' }];
    const before = buildFinanceAssistantContext(input);
    input.archives = [{ id: 'ARCHIVE-2025', year: 2025, status: 'archived', archivedAt: '2026-05-02T10:00:00Z', updatedAt: '2026-05-02T10:00:00Z', operationId: 'archive-test-2025' }];
    const after = buildFinanceAssistantContext(input);
    expect(after.ledger.cashCents).toBe(96_000);
    expect(after.ledger.trackedPayablesCents).toBe(6000);
    expect(after.ledger.archivedCount).toBe(1);
    expect(after.forecast.windows).toEqual(before.forecast.windows);
    expect(after.ledger.actionable[0]).toMatchObject({ id: 'TX-OLD', archived: true, payment: 'partial', remainingCents: 6000 });
    expect(after.forecast.windows[0].sourceIds).toContain('invoice:TX-OLD');
  });

  it('distingue avoir imputé, vrai paiement et pièce annulée sans transformer le crédit en argent', () => {
    const input = base(), original = tx(), credit = tx('CREDIT', 2000, '2026-01-01'), voided = tx('VOID', 50_000);
    credit.finance = { ...credit.finance!, kind: 'refund', refundOfId: original.id, refundDirection: 'in', refundApplication: 'offset' };
    voided.finance!.voidedAt = '2026-05-01T10:00:00Z';
    input.transactions = [original, credit, voided];
    input.payments = [{ id: 'PAY', transactionId: original.id, date: '2026-05-01', amountCents: 8000, direction: 'out', method: 'bank', recordedAt: '2026-05-01T10:00:00Z' }];
    const result = buildFinanceAssistantContext(input);
    expect(result.ledger.observedExpensesCents).toBe(8000);
    expect(result.ledger.cashCents).toBe(92_000);
    expect(result.ledger.trackedPayablesCents).toBe(0);
    expect(result.ledger.voidedCount).toBe(1);
    expect(result.periods.rows.find(row => row.month === '2026-01')?.cashInCents).toBe(0);
  });

  it('ne donne pas de solde certain pour un paiement historique inconnu ou un registre tronqué', () => {
    const input = base(); input.transactions = [tx()]; input.transactions[0].finance!.paymentStatus = 'paid';
    expect(buildFinanceAssistantContext(input).ledger).toMatchObject({ cashCents: null, cashComplete: false, unknownPaymentCount: 1 });
    input.transactions[0].finance!.paymentStatus = 'unpaid';
    input.coverage.transactions = { ...input.coverage.transactions, complete: false, loaded: 1500, totalAtLeast: 1501 };
    const result = buildFinanceAssistantContext(input);
    expect(result.scope).toBe('partial-observation');
    expect(result.ledger.cashCents).toBeNull();
    expect(result.forecast.windows.every(window => window.balanceCents === null)).toBe(true);
    expect(result.forecast.trendMonths).toEqual([]);
    expect(result.annual.every(report => report.resultCents === null)).toBe(true);
  });

  it('respecte les fenêtres exactes et distingue intentions de dépenses et revenus saisis', () => {
    const input = base();
    input.plans = [plan('DAY30', '2026-06-30', 1000), plan('OUTSIDE30', '2026-07-01', 2000), plan('DRAFT', '2026-06-02', 90_000), { ...plan('EXPECTED-SALE', '2026-06-10', 500), direction: 'in', category: 'recettes' }];
    input.plans[2].status = 'draft';
    const result = buildFinanceAssistantContext(input);
    expect(result.forecast.windows[0]).toMatchObject({ from: '2026-06-01', endExclusive: '2026-07-01', expenseCents: 1000, incomeCents: 500, balanceCents: 99_500 });
    expect(result.forecast.windows[1].expenseCents).toBe(3000);
    expect(result.forecast.windows[2].endExclusive).toBe('2027-06-01');
    expect(result.forecast.method).toContain('Pas de ventes automatiques');
  });

  it('somme la même fenêtre de douze mois dans les totaux et les treize mois calendaires partiels', () => {
    const input = base(); input.asOf = '2026-09-09';
    input.plans = [plan('LAST-DAY', '2027-09-08', 1000), plan('OUTSIDE-YEAR', '2027-09-09', 2000)];
    const result = buildFinanceAssistantContext(input);
    expect(result.forecast.windows[2].expenseCents).toBe(1000);
    expect(result.forecast.monthly).toHaveLength(13);
    expect(result.forecast.monthly.reduce((sum, month) => sum + month.expenseCents, 0)).toBe(1000);
    expect(result.forecast.monthly[12]).toMatchObject({ month: '2027-09', expenseCents: 1000, balanceCents: 99_000 });
  });

  it('garde le résultat figé à sa date même quand le registre actuel est partiel', () => {
    const input = base(); input.transactions = [tx()];
    const closing = { id: 'CLOSE-2025', year: 2025, createdAt: '2026-01-02T10:00:00Z', openingInventory: [], closingInventory: [], inventoriesConfirmed: true, adjustments: [] };
    const report = buildAnnualReport({ year: 2025, transactions: input.transactions, payments: [], assets: [], profile: input.profile!, closing, generatedAt: '2026-01-02T10:00:00Z' });
    input.closings = [{ ...closing, report }]; input.coverage.transactions.complete = false;
    const result = buildFinanceAssistantContext(input);
    expect(result.annual.find(row => row.year === 2025)).toMatchObject({ frozen: true, closingId: 'CLOSE-2025', generatedAt: '2026-01-02T10:00:00Z', resultCents: report.resultCents });
    expect(result.annual.find(row => row.year === 2026)?.resultCents).toBeNull();
  });

  it('réutilise les anciens prix documentés, sépare stock consommé et achats, et signale les charges inconnues', () => {
    const input = base(); input.transactions = [tx('PRICE', 1000)];
    input.stock = [{ id: 'MP-1', ref: 'MP-1', name: 'Malt fictif', category: 'Malt', unit: 'kg', currentStock: 2, minStock: 0, reorder: false }];
    input.recipes = [{ id: 'REC-1', name: 'Blonde fictive', style: 'Blonde', volumeL: 20, malts: [{ name: 'Malt fictif', weightKg: 4 }], hops: [], yeast: { name: '', qty: 0, unit: 'sachet' } } as any];
    const result = buildFinanceAssistantContext(input), budget = result.budgets[0];
    expect(result.stock.priceExamples[0].sourceIds).toEqual(['PRICE']);
    expect(budget).toMatchObject({ recipeId: 'REC-1', kind: 'simulation', complete: false, costedConsumptionCents: 2000, costedPurchasesCents: 1000, fullCostPerLiterCents: null });
    expect('issues' in budget && budget.issues?.items.join(' ')).toMatch(/Énergie|Conditionnement/);
    expect(result.business.personalLaborIncluded).toBe(false);
  });

  it('garde inconnu un amortissement non confirmé et refuse le coût au mauvais volume', () => {
    const input = base(); input.profile!.annualProductionL = 1000;
    input.recipes = [{ id: 'REC-1', name: 'Blonde fictive', style: 'Blonde', volumeL: 20, malts: [{ name: 'Malt fictif', weightKg: 4 }], hops: [], yeast: { name: '', qty: 0, unit: 'sachet' } } as any];
    input.assets = [{ id: 'ASSET', name: 'Cuve fictive', acquisitionDate: '2025-01-01', inServiceDate: '2025-01-01', acquisitionCents: 100_000, businessUsePct: 100, category: 'tanks', method: 'linear', ratePct: 10, openingYear: 2025, openingValueCents: 100_000, openingConfirmed: false, firstYearFraction: 1 }];
    const result = buildFinanceAssistantContext(input);
    expect(result.budgets[0].complete).toBe(false);
    expect('issues' in result.budgets[0] && result.budgets[0].issues?.items.join(' ')).toMatch(/Amortissement|reprise/);
    input.batches = [{ id: 'LOT', name: 'Double volume fictif', status: 'planifie', brewDate: '2026-06-15', recipeRef: 'REC-1', volumeL: 40 } as any];
    expect(buildFinanceAssistantContext(input).budgets[0]).toMatchObject({ batchId: 'LOT', complete: false, error: expect.stringContaining('Volume du brassin différent') });
  });

  it('n’expose pas notes, fichiers ou fausses absences de justificatif legacy', () => {
    const input = base(), original = tx();
    original.proofUrl = 'data:application/pdf;base64,SYNTHETIC-PRIVATE-PDF';
    original.finance!.notes = 'SYNTHETIC-PRIVATE-NOTE'; original.finance!.proofDocumentId = undefined;
    input.transactions = [original]; input.legacyProofsNotRead = true;
    const result = buildFinanceAssistantContext(input), json = JSON.stringify(result);
    expect(json).not.toContain('SYNTHETIC-PRIVATE');
    expect(result.ledger.missingProofCount).toBeNull();
    expect(result.ledger.legacyProofsRead).toBe(false);
    expect(FINANCE_ADVICE_GUIDANCE).toContain('NON FIABLE');
    expect(FINANCE_ADVICE_GUIDANCE).toContain('jamais supprimer');
    expect(FINANCE_ADVICE_GUIDANCE).toContain('temps personnel');
  });

  it('borne le résumé sans tronquer le JSON ni muter les données historiques', () => {
    const input = base(); input.transactions = Array.from({ length: 200 }, (_, i) => ({ ...tx(`TX-${i}`), description: 'É'.repeat(5000) }));
    const original = JSON.stringify(input);
    const result = buildFinanceAssistantContext(input), json = JSON.stringify(result);
    expect(new TextEncoder().encode(json).length).toBeLessThanOrEqual(FINANCE_CONTEXT_MAX_BYTES);
    expect(result.promptBudget.serializedBytes).toBe(new TextEncoder().encode(json).length);
    expect(JSON.stringify(input)).toBe(original);
    expect(JSON.parse(json).version).toBe(1);
  });

  it('réduit le prompt du compagnon mais conserve le stock complet pour les outils', () => {
    const finance = buildFinanceAssistantContext(base());
    const context: any = { workspace: { screen: 'Finances', records: { recipes: new Array(80).fill({ name: 'unused' }) }, truncated: [], finance }, inventory: Array.from({ length: 500 }, (_, i) => ({ id: `MP-${i}`, name: 'Malt', unit: 'kg', currentStock: i, note: 'unneeded' })), material: [], provenance: [], waterSources: [{ unknown: 'long' }] };
    const prompt = brewerContextForPrompt(context);
    expect(prompt.inventory).toHaveLength(12);
    expect(prompt.workspace?.records).toEqual({});
    expect(context.inventory).toHaveLength(500);
    expect(context.workspace.records.recipes).toHaveLength(80);
  });
});

describe('simulation de matériel et contrat compagnon — transport factice uniquement', () => {
  const assumptions = () => ({ purchaseCents: 100_000, deliveryCents: 10_000, installationCents: 5000, annualSavingsCents: 30_000, annualMaintenanceCents: 5000, annualEnergyCents: 2000, annualOtherCostsCents: 3000, assumptionNote: 'Comparaison fictive explicitement demandée, économies d’énergie uniquement.' });
  it('calcule coût TTC, économies nettes et retour simple sans écriture ni temps personnel', () => {
    const values = assumptions(), before = JSON.stringify(values);
    const result = simulateBreweryInvestment(values, { cashCents: 100_000, cashComplete: true });
    expect(result).toMatchObject({ initialCostCents: 115_000, annualNetSavingsCents: 20_000, paybackMonths: 69, cashAfterImmediatePurchaseCents: -15_000, personalLaborIncluded: false, expectedSalesIncluded: false });
    expect(JSON.stringify(values)).toBe(before);
  });
  it('ne promet ni retour positif ni trésorerie disponible avec gains nuls et registre incomplet', () => {
    expect(simulateBreweryInvestment({ ...assumptions(), annualSavingsCents: 10_000 }, { cashCents: 100_000, cashComplete: false })).toMatchObject({ annualNetSavingsCents: 0, paybackMonths: null, cashAfterImmediatePurchaseCents: null });
  });
  it.each([undefined, -1, 1.5, Number.POSITIVE_INFINITY, 100_000_001])('refuse un coût absent ou invalide : %s', purchaseCents => {
    expect(() => simulateBreweryInvestment({ ...assumptions(), purchaseCents })).toThrow();
  });
  it('refuse les champs de salaire propriétaire et de revenus supposés', () => {
    expect(() => simulateBreweryInvestment({ ...assumptions(), ownerLaborCents: 10_000 })).toThrow(/Champ/);
    expect(() => simulateBreweryInvestment({ ...assumptions(), projectedSalesCents: 10_000 })).toThrow(/Champ/);
  });
  it('transmet les preuves du calcul et la même consigne financière aux deux relectures indépendantes', async () => {
    const finance = buildFinanceAssistantContext(base());
    const context: any = { workspace: { screen: 'Finances', records: {}, truncated: [], finance }, now: Date.now(), phase: 'Finances', provenance: [], inventory: [], material: [], waterSources: [], editableTargets: [] };
    const reply = { level: 'info', summary: 'Scénario fictif de cuve.', action: 'Comparer ce scénario au devis réel.', why: 'Retour simple simulé : 69 mois.', watch: 'Les engagements futurs restent à financer.', question: '', evidenceIds: ['FINANCE', 'E1'] };
    const generator = vi.fn()
      .mockResolvedValueOnce({ candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'simulate_brewery_investment', args: assumptions() } }] } }] })
      .mockResolvedValueOnce({ candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'finish_advice', args: reply } }] } }] })
      .mockResolvedValueOnce({ candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify({ approved: true, proposalApproved: true, issues: [] }) }] } }] })
      .mockResolvedValueOnce({ candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify({ approved: true, proposalApproved: true, issues: [] }) }] } }] });
    const result = await runBrewerHarness(context, 'Compare les hypothèses fictives fournies pour cette cuve.', [], generator, { mode: 'fast' });
    expect(result.evidence.find(item => item.id === 'E1')?.data).toMatchObject({ paybackMonths: 69, initialCostCents: 115_000 });
    expect(result.evidence.some(item => item.id === 'FINANCE')).toBe(true);
    expect(generator).toHaveBeenCalledTimes(4);
    expect(JSON.stringify(generator.mock.calls[0][1].systemInstruction)).toContain('temps personnel');
    for (const index of [2, 3]) {
      expect(JSON.stringify(generator.mock.calls[index][1].systemInstruction)).toContain('cashComplete=false');
      const received = JSON.parse(generator.mock.calls[index][1].contents[0].parts[0].text);
      expect(received.evidence.find((item: any) => item.id === 'E1')?.data).toMatchObject({ paybackMonths: 69, initialCostCents: 115_000 });
    }
    expect(result.proposal).toBeUndefined();
  });
});

describe('chargement serveur borné sans réseau dans les tests', () => {
  it('lit finance et paiements avec ordre stable, annonce le dépassement et sélectionne seulement les champs utiles', async () => {
    database.data.set('transactions', Array.from({ length: 1501 }, (_, i) => tx(`TX-${String(i).padStart(5, '0')}`)));
    database.data.set('financialProfiles/current', [base().profile]);
    const result = await loadBrewerFinanceContext(database.db as any);
    expect(result.coverage.transactions).toMatchObject({ loaded: 1500, totalAtLeast: 1501, limit: 1500, complete: false, order: 'document-id' });
    expect(result.ledger.cashCents).toBeNull();
    const query = database.calls.find(call => call.collection === 'transactions')!;
    expect(query.order).toBeDefined(); expect(query.limit).toBe(1501);
    expect(query.fields).toContain('finance.amountCents'); expect(query.fields).not.toContain('proofUrl');
    expect(database.calls.find(call => call.collection === 'config')?.fields).toEqual(['fiscal.isTvaRegistered']);
  });

  it('annonce une lecture de paiements indisponible sans conclure que la caisse est complète', async () => {
    database.failures.add('financialPayments'); database.data.set('financialProfiles/current', [base().profile]);
    const result = await loadBrewerFinanceContext(database.db as any);
    expect(result.coverage.financialPayments).toMatchObject({ complete: false, unavailable: true });
    expect(result.ledger.cashComplete).toBe(false);
    expect(result.forecast.windows.every(window => window.balanceCents === null)).toBe(true);
  });
});
