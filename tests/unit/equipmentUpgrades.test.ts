import { describe, expect, it } from 'vitest';
import { buildForecast } from '../../src/domain/finance/forecast';
import { mergeUpgradePlans, upgradeBudget, upgradeProgress, upgradeReadiness, validateUpgrade } from '../../src/domain/finance/upgrades';
import type { FinanceTransaction, FinancialPayment, FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';
import type { CreativeItem } from '../../src/types';

const project = (patch: Partial<FinancialPlan> = {}): FinancialPlan => ({ id: 'HOTTE', title: 'Hotte', date: '2026-10-01', amountCents: 120000, direction: 'out', category: 'materiel', source: 'equipment', status: 'active', createdAt: '2026-09-09T10:00:00Z',
  upgrade: { version: 1, timing: 'soon', stage: 'quote', budgetKnown: true, datePrecision: 'month', estimateSource: 'quote', purchaseCents: 100000, deliveryCents: 5000, installationCents: 15000 }, ...patch });
const invoice = (): FinanceTransaction => ({ id: 'INVOICE', date: '2026-09-09', description: 'Hotte et accessoires', category: 'materiel', subcategory: '', amountHT: 800, amountTTC: 800, tvaRate: 0, tvaAmount: 0,
  finance: { version: 1, kind: 'expense', amountCents: 80000, planId: 'HOTTE', paymentStatus: 'unpaid', dueDate: '2026-10-01', lines: [{ id: '1', kind: 'equipment', description: 'Hotte', amountCents: 80000 }] } });
const payment = (amountCents = 40000): FinancialPayment => ({ id: 'PAY', transactionId: 'INVOICE', date: '2026-09-09', amountCents, direction: 'out', method: 'bank', recordedAt: '2026-09-09T10:00:00Z' });
const profile: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, openingCash: { date: '2026-09-01', amountCents: 400000, confirmed: true } };
const forecast = (plans = [project()], transactions = [invoice()], payments = [payment()], includeEquipmentProjects = true) => buildForecast({ plans, transactions, payments, profile, asOf: '2026-09-09', months: 3, includeEquipmentProjects });
const outgoing = (result: ReturnType<typeof forecast>) => result.items.filter(i => i.direction === 'out').reduce((sum, i) => sum + i.amountCents, 0);

describe('Évolution du matériel de la brasserie', () => {
  it('garde les anciennes idées sans écrire, sans inventer de budget et sans les compter deux fois', () => {
    const ideas: CreativeItem[] = [{ id: 'OLD / 1', type: 'equipment', title: 'Fermenteur', status: 'quote', estimatedCost: 850.55, description: 'Libérer la cuve', notes: 'Devis conservé' }, { id: 'LATER', type: 'equipment', title: 'Cuverie', status: 'idea' }, { id: 'DONE', type: 'equipment', title: 'Pompe installée', status: 'done' }];
    const before = structuredClone(ideas), loaded = mergeUpgradePlans([], ideas);
    expect(loaded[0]).toMatchObject({ id: 'UPGRADE-OLD%20%2F%201', amountCents: 85055, status: 'draft', notes: 'Devis conservé', upgrade: { sourceCreativeItemId: 'OLD / 1', purpose: 'Libérer la cuve', stage: 'quote' } });
    expect(loaded[1].upgrade?.budgetKnown).toBe(false);
    expect(loaded[2].status).toBe('completed');
    const edited = { ...loaded[0], status: 'cancelled' as const, title: 'Projet renommé' };
    expect(mergeUpgradePlans([edited], ideas)).toHaveLength(3);
    expect(mergeUpgradePlans([edited], ideas)[0]).toEqual(edited);
    expect(ideas).toEqual(before);
  });

  it('additionne les centimes documentés et distingue un prix nul d’un prix absent', () => {
    expect(upgradeBudget(project().upgrade!)).toBe(120000);
    expect(upgradeBudget({ installationCents: 15000 })).toBeNull();
    expect(upgradeBudget({ purchaseCents: 0 })).toBe(0);
    expect(upgradeBudget({ purchaseCents: 12345, deliveryCents: 55 })).toBe(12400);
    expect(upgradeBudget({ purchaseCents: Number.MAX_SAFE_INTEGER, deliveryCents: 1 })).toBeNull();
  });

  it('autorise une idée incomplète et demande prix et date avant de la prévoir', () => {
    const idea = project({ status: 'draft', date: '', amountCents: 0, upgrade: { ...project().upgrade!, budgetKnown: false, purchaseCents: undefined, deliveryCents: undefined, installationCents: undefined } });
    expect(() => validateUpgrade(idea)).not.toThrow();
    expect(upgradeReadiness(idea)).toHaveLength(2);
    expect(() => validateUpgrade({ ...idea, status: 'active' })).toThrow('budget TTC');
    expect(forecast([idea], [], []).items).toEqual([]);
    expect(forecast([idea], [], []).warnings.join(' ')).not.toContain('Prévision invalide');
    expect(() => validateUpgrade(project({ amountCents: 120001 }))).toThrow('réunir');
  });

  it('remplace le budget par la facture et conserve le solde dû dans les deux scénarios', () => {
    expect(outgoing(forecast())).toBe(80000); // 400 facture + 400 encore à acheter
    const without = forecast([project()], [invoice()], [payment()], false);
    expect(outgoing(without)).toBe(40000);
    expect(without.items.map(i => i.source)).toEqual(['invoice']);
    expect(upgradeProgress(project(), [invoice()], [payment()], '2026-09-09')).toMatchObject({ invoicedCents: 80000, invoicedComplete: true, paidCents: 40000, paymentKnown: true, remainingBudgetCents: 40000 });
  });

  it.each(['draft', 'cancelled', 'completed'] as const)('conserve les factures après le passage en %s, même si le paiement est incertain', status => {
    expect(outgoing(forecast([project({ status })]))).toBe(40000);
    const unknown = invoice(); unknown.finance!.paymentStatus = 'unknown';
    const result = forecast([project({ status })], [unknown], []);
    expect(outgoing(result)).toBe(80000);
    expect(result.warnings.join(' ')).toContain('Paiement à confirmer');
    expect(upgradeProgress(project({ status }), [unknown], [], '2026-09-09').paymentKnown).toBe(false);
  });

  it('conserve un projet lointain hors de la fenêtre sans le perdre', () => {
    const later = project({ date: '2028-06-01', upgrade: { ...project().upgrade!, timing: 'later' } });
    expect(forecast([later], [], []).items).toEqual([]);
    expect(buildForecast({ plans: [later], transactions: [], payments: [], profile, asOf: '2026-09-09', months: 24 }).items[0]).toMatchObject({ source: 'equipment', amountCents: 120000, date: '2028-06-01' });
  });

  it('ne devine pas la part du projet ni la ventilation d’un acompte sur une facture mixte', () => {
    const mixed = invoice(); mixed.finance!.lines = [{ id: 'H', kind: 'equipment', description: 'Hotte', amountCents: 60000 }, { id: 'M', kind: 'ingredient', description: 'Malt', amountCents: 20000 }];
    expect(outgoing(forecast([project()], [mixed], []))).toBe(200000);
    expect(upgradeProgress(project(), [mixed], [], '2026-09-09')).toMatchObject({ invoicedComplete: false, remainingBudgetCents: 120000 });
    mixed.finance!.planAllocatedCents = 60000;
    expect(outgoing(forecast([project()], [mixed], []))).toBe(140000);
    expect(upgradeProgress(project(), [mixed], [payment()], '2026-09-09')).toMatchObject({ invoicedCents: 60000, paymentKnown: false, remainingBudgetCents: 60000 });
    expect(upgradeProgress(project(), [mixed], [], '2026-09-09').paymentKnown).toBe(true);
    expect(upgradeProgress(project(), [mixed], [payment(80000)], '2026-09-09')).toMatchObject({ paidCents: 60000, paymentKnown: true });
  });

  it('déduit un avoir des achats sans réinventer une dépense future ni un paiement', () => {
    const credit = invoice(); credit.id = 'CREDIT'; credit.amountTTC = 100; credit.amountHT = 100;
    credit.finance = { ...credit.finance!, kind: 'refund', amountCents: 10000, lines: [], refundOfId: 'INVOICE', refundDirection: 'in', refundApplication: 'offset' };
    const all = [invoice(), credit];
    expect(upgradeProgress(project(), all, [payment()], '2026-09-09')).toMatchObject({ invoicedCents: 70000, paidCents: 40000, remainingBudgetCents: 40000 });
    expect(outgoing(forecast([project()], all, [payment()]))).toBe(70000);
  });
});
