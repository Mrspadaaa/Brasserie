import { describe, expect, it } from 'vitest';
import type { FinanceTransaction, FinancialAsset, FinancialClosing, FinancialPayment, FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';
import { isoDate, paymentState, summarizeLedger, transactionAmount } from '../../src/domain/finance/ledger';
import { buildForecast, planOccurrences } from '../../src/domain/finance/forecast';
import { buildAnnualReport, depreciationForYear } from '../../src/domain/finance/annual';
import { createAnnualPdf, createAnnualWorkbook } from '../../src/services/financeExport';
import * as XLSX from 'xlsx';

const profile: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, openingCash: { date: '2026-01-01', amountCents: 100_000, confirmed: true } };
const expense = (id: string, amountCents = 10_000, date = '2026-09-01'): FinanceTransaction => ({ id, date, description: 'Achat malt', amountHT: amountCents / 100, amountTTC: amountCents / 100, tvaAmount: 0, tvaRate: 0, category: 'brassage', subcategory: 'Malt',
  finance: { version: 1, kind: 'expense', amountCents, paymentStatus: 'unpaid', lines: [{ id: 'L1', description: 'Malt', kind: 'ingredient', amountCents }] } });
const payment = (transactionId: string, amountCents: number, overrides: Partial<FinancialPayment> = {}): FinancialPayment => ({ id: `PAY-${transactionId}`, transactionId, amountCents, date: '2026-09-02', direction: 'out', method: 'bank', recordedAt: '2026-09-02T10:00:00Z', ...overrides });
const plan = (overrides: Partial<FinancialPlan> = {}): FinancialPlan => ({ id: 'P1', title: 'Achat prochain brassin', amountCents: 20_000, date: '2026-09-15', direction: 'out', category: 'brassage', source: 'manual', status: 'active', createdAt: '2026-09-01T00:00:00Z', ...overrides });
const asset: FinancialAsset = { id: 'A1', name: 'Machine', transactionId: 'TX-A', lineId: 'L1', acquisitionDate: '2026-03-01', inServiceDate: '2026-03-01', acquisitionCents: 100_000, category: 'production', method: 'declining', ratePct: 30, openingYear: 2026, openingValueCents: 0, openingConfirmed: true, firstYearFraction: 1, businessUsePct: 100 };
const closing: FinancialClosing = { id: 'C1', year: 2026, createdAt: '2027-01-01T10:00:00Z', openingInventory: [], closingInventory: [], inventoriesConfirmed: true, adjustments: [] };

describe('Livre CHF et paiements explicites', () => {
  it('conserve les montants historiques, sans inventer leur paiement ni recalculer leur TVA', () => {
    const legacy = { ...expense('old'), finance: undefined, amountHT: 100, tvaRate: 0.081, amountTTC: 100 };
    const before = JSON.stringify(legacy);
    expect(transactionAmount(legacy)).toBe(10_000);
    const summary = summarizeLedger([legacy], [], profile, '2026-09-09');
    expect(summary.cashCents).toBe(100_000);
    expect(summary.cashComplete).toBe(false);
    expect(summary.unknownPaymentCount).toBe(1);
    expect(summary.payablesCents).toBe(0);
    expect(JSON.stringify(legacy)).toBe(before);
  });
  it('calcule les acomptes et leur contre-écriture sans effacer le premier paiement', () => {
    const tx = expense('T1');
    const first = payment('T1', 4_000);
    expect(paymentState(tx, [first]).remainingCents).toBe(6_000);
    const reversal = payment('T1', 4_000, { id: 'REV', direction: 'in', reversalOfId: first.id });
    const summary = summarizeLedger([tx], [first, reversal], profile, '2026-09-09');
    expect(summary.cashCents).toBe(100_000);
    expect(summary.payablesCents).toBe(10_000);
    expect(summary.outstanding[0].state).toBe('unpaid');
  });
  it('les recettes payées contribuent à la trésorerie en TTC', () => {
    const tx = expense('SALE', 10_810); tx.finance!.kind = 'income'; tx.category = 'recettes'; tx.amountHT = 100;
    expect(summarizeLedger([tx], [payment('SALE', 10_810, { direction: 'in' })], profile, '2026-09-09').cashCents).toBe(110_810);
  });
  it('refuse les dates calendaires inexistantes et ne fixe pas l’exercice à 2026', () => {
    expect(isoDate('31.02.2026')).toBeNull();
    expect(isoDate('2027-02-29')).toBeNull();
    expect(isoDate('29.02.2028')).toBe('2028-02-29');
    expect(isoDate('1.1.2027')).toBe('2027-01-01');
  });
});

describe('Prévision explicable sans double paiement', () => {
  it('remplace le montant déjà facturé du plan, puis retire seulement les acomptes de la facture', () => {
    const tx = expense('T1', 12_000); tx.finance!.planId = 'P1'; tx.finance!.dueDate = '2026-09-20';
    const result = buildForecast({ transactions: [tx], payments: [payment('T1', 5_000)], plans: [plan()], profile, asOf: '2026-09-09' });
    expect(result.months[0].expenseCents).toBe(15_000); // facture 7 000 + intention pas encore facturée 8 000
    expect(result.months[0].balanceCents).toBe(80_000); // 100 000 - acompte 5 000 - futur 15 000
    expect(result.months).toHaveLength(12);
    expect(result.months[0].incomeCents).toBe(0);
  });
  it('conserve le jour d’ancrage à travers février et le passage d’année', () => {
    const occurrences = planOccurrences(plan({ date: '2026-01-31', recurrence: { frequency: 'monthly' } }), '2026-01-01', '2026-03-31');
    expect(occurrences.map(o => o.date)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']);
    expect(planOccurrences(plan({ date: '2026-12-31', recurrence: { frequency: 'monthly' } }), '2026-12-01', '2027-01-31').map(o => o.date)).toEqual(['2026-12-31', '2027-01-31']);
  });
  it('ne projette ni brouillon ni facture ancienne au règlement inconnu', () => {
    const legacy = { ...expense('old'), finance: undefined };
    const result = buildForecast({ transactions: [legacy], payments: [], plans: [plan({ status: 'draft' })], profile, asOf: '2026-09-09' });
    expect(result.items).toEqual([]);
    expect(result.warnings.some(w => w.includes('historique'))).toBe(true);
  });
  it('utilise la médiane de mois complets confirmés en excluant achats planifiés et investissements', () => {
    const txs = [expense('a', 10_000, '2026-06-01'), expense('b', 20_000, '2026-07-01'), expense('c', 90_000, '2026-08-01')];
    const machine = expense('machine', 5_000_000, '2026-08-01'); machine.category = 'materiel'; txs.push(machine);
    const linked = expense('linked', 2_000_000, '2026-07-02'); linked.finance!.planId = 'P-old'; txs.push(linked);
    txs.forEach(t => { t.finance!.paymentStatus = 'unknown'; });
    const result = buildForecast({ transactions: txs, payments: [], plans: [], profile: { ...profile, historyCompleteFrom: '2026-06-01' }, asOf: '2026-09-09' });
    expect(result.trendMonths).toEqual(['2026-06', '2026-07', '2026-08']);
    expect(result.months[0].projectedCents).toBe(20_000);
  });
});

describe('Compte annuel et immobilisations', () => {
  it('ne passe pas l’achat de machine et son amortissement deux fois dans les charges', () => {
    const tx = expense('TX-A', 100_000, '2026-03-01'); tx.finance!.lines[0].kind = 'equipment';
    const report = buildAnnualReport({ year: 2026, transactions: [tx], payments: [], assets: [asset], profile, closing });
    expect(report.capitalPurchasesCents).toBe(100_000);
    expect(report.operatingExpensesCents).toBe(0);
    expect(report.depreciationCents).toBe(30_000);
    expect(report.resultCents).toBe(-30_000);
  });
  it('borne la dotation à la valeur restante et respecte la reprise des anciens biens', () => {
    expect(depreciationForYear({ ...asset, acquisitionDate: '2020-01-01', inServiceDate: '2020-01-01', method: 'linear', ratePct: 15, openingValueCents: 5_000 }, 2026).depreciationCents).toBe(5_000);
    expect(depreciationForYear({ ...asset, openingYear: 2027 }, 2026).missing).toHaveLength(1);
    expect(depreciationForYear({ ...asset, openingConfirmed: false }, 2026).depreciationCents).toBe(0);
  });
  it('passe le petit matériel confirmé en charge et conserve l’immobilisation quand choisie', () => {
    const tx = expense('TX-A', 30_000, '2026-03-01'); tx.finance!.lines[0].kind = 'equipment'; tx.finance!.lines[0].capitalTreatment = 'expense';
    const charged = buildAnnualReport({ year: 2026, transactions: [tx], payments: [], assets: [], profile, closing });
    expect(charged.operatingExpensesCents).toBe(30_000); expect(charged.capitalPurchasesCents).toBe(0); expect(charged.resultCents).toBe(-30_000);
    tx.finance!.lines[0].capitalTreatment = 'asset';
    const capitalized = buildAnnualReport({ year: 2026, transactions: [tx], payments: [], assets: [{ ...asset, acquisitionCents: 30_000 }], profile, closing });
    expect(capitalized.capitalPurchasesCents).toBe(30_000); expect(capitalized.operatingExpensesCents).toBe(0); expect(capitalized.resultCents).toBe(-9_000);
  });
  it('demande l’ajustement du registre après un avoir sur immobilisation', () => {
    const tx = expense('TX-A', 100_000, '2026-03-01'); tx.finance!.lines[0].kind = 'equipment';
    const credit = expense('CREDIT', 10_000, '2026-04-01'); credit.finance!.kind = 'refund'; credit.finance!.refundOfId = tx.id;
    const input = { year: 2026, transactions: [tx, credit], payments: [], assets: [asset], profile, closing };
    expect(buildAnnualReport(input).resultCents).toBeNull();
    const adjusted = buildAnnualReport({ ...input, assets: [{ ...asset, acquisitionCents: 90_000, capitalAdjustmentTransactionIds: [credit.id] }] });
    expect(adjusted.capitalPurchasesCents).toBe(90_000); expect(adjusted.operatingExpensesCents).toBe(0); expect(adjusted.resultCents).toBe(-27_000);
  });
  it('ajuste les achats de matières par la variation de stock et exige une confirmation explicite', () => {
    const tx = expense('M1', 10_000, '2026-04-01');
    const settings = { year: 2026, transactions: [tx], payments: [], assets: [], profile };
    expect(buildAnnualReport(settings).resultCents).toBeNull();
    const report = buildAnnualReport({ ...settings, closing: { ...closing, closingInventory: [{ id: 'S1', name: 'Malt restant', kind: 'raw', quantity: 5, unit: 'kg', valueCents: 4_000 }] } });
    expect(report.resultCents).toBe(-6_000);
  });
  it('une clôture figée reproduit son rapport malgré les modifications ultérieures', () => {
    const report = buildAnnualReport({ year: 2026, transactions: [expense('M1')], payments: [], assets: [], profile, closing });
    const frozen = { ...closing, report };
    expect(buildAnnualReport({ year: 2026, transactions: [], payments: [], assets: [], profile, closing: frozen })).toEqual(report);
    expect(buildAnnualReport({ year: 2026, transactions: [], payments: [], assets: [], profile, closing: frozen })).not.toBe(report);
  });
  it('affecte seulement le produit de cession lié et bloque une vente invalide', () => {
    const sale = expense('SALE', 30_000, '2026-10-01'); sale.finance!.kind = 'income'; sale.category = 'recettes';
    const disposed = { ...asset, disposedDate: '2026-10-01', disposalProceedsCents: 25_000, disposalTransactionId: 'SALE' };
    const report = buildAnnualReport({ year: 2026, transactions: [sale], payments: [], assets: [disposed], profile, closing });
    expect(report.revenueCents).toBe(5_000);
    expect(report.disposalResultCents).toBe(-45_000);
    expect(report.resultCents).toBe(-70_000);
    sale.finance!.voidedAt = '2026-10-02T00:00:00Z';
    const invalid = buildAnnualReport({ year: 2026, transactions: [sale], payments: [], assets: [disposed], profile, closing });
    expect(invalid.resultCents).toBeNull();
    expect(invalid.missing.join(' ')).toContain('vente existante et active');
  });
  it('exporte les mêmes valeurs en classeur et produit un PDF paginé', () => {
    const txs = Array.from({ length: 65 }, (_, i) => expense(`TX-${i}`, 1000, '2026-04-01'));
    txs[0].finance!.proofDocumentId = 'DOC-ORIGINAL'; txs[0].proofFileName = 'Facture-malt.pdf';
    const report = buildAnnualReport({ year: 2026, transactions: txs, payments: [], assets: [], profile, closing, generatedAt: '2027-01-01T10:00:00Z' });
    const workbook = createAnnualWorkbook(report, 'Brasserie de test');
    const journal = XLSX.utils.sheet_to_json(workbook.Sheets.Journal);
    expect(journal).toHaveLength(65);
    expect(journal[0]).toMatchObject({ 'Montant TTC CHF': 10 });
    expect(journal[0]).toMatchObject({ 'Référence du document': 'DOC-ORIGINAL', Fichier: 'Facture-malt.pdf' });
    const pdf = createAnnualPdf(report, 'Brasserie de test');
    expect(pdf.getNumberOfPages()).toBeGreaterThan(2);
    expect(pdf.output('arraybuffer').byteLength).toBeGreaterThan(1000);
  });
});
