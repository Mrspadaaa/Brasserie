import { describe, expect, it } from 'vitest';
import { buildAnnualReport } from '../../src/domain/finance/annual';
import { buildFribourgTaxReport, emptyTaxClosing, taxBasisKey, TAX_REVIEWS, taxCopyValue, validateTaxClosing } from '../../src/domain/finance/fribourgTax';
import type { FinancialClosing, FinancialProfile, FinanceTransaction, FinancialPayment } from '../../src/domain/finance/types';

const profile: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified', openingCash: { date: '2025-01-01', amountCents: 100_000, confirmed: true } };
const tx = (id: string, kind: 'income' | 'expense', amountCents: number): FinanceTransaction => ({ id, date: '2025-12-10', description: id, amountHT: amountCents / 100, amountTTC: amountCents / 100, tvaRate: 0, tvaAmount: 0, category: kind === 'income' ? 'recettes' : 'brassage', subcategory: '', finance: { version: 1, kind, amountCents, paymentStatus: 'unpaid', proofDocumentId: `DOCUMENT-${id}`, vendor: 'Tiers', lines: [] } });
const transactions = [tx('VENTE', 'income', 100_000), tx('MALT', 'expense', 10_000)];
const payments: FinancialPayment[] = transactions.map(t => ({ id: `PAY-${t.id}`, transactionId: t.id, date: '2025-12-11', amountCents: t.finance!.amountCents, direction: t.finance!.kind === 'income' ? 'in' : 'out', method: 'bank', recordedAt: '2025-12-11T12:00:00Z' }));
function fixture() {
  const closing: FinancialClosing = { id: 'C-2025', year: 2025, createdAt: '2026-02-01T12:00:00Z', inventoriesConfirmed: true, openingInventory: [], closingInventory: [], adjustments: [] };
  const report = buildAnnualReport({ year: 2025, transactions, payments, assets: [], profile, closing, generatedAt: closing.createdAt });
  const tax = { ...emptyTaxClosing(), activity: 'main' as const, reviews: Object.fromEntries(TAX_REVIEWS.map(r => [r.key, true])), reviewedBasis: taxBasisKey(report),
    balances: [{ id: 'BANK', kind: 'bank' as const, label: 'Banque de la brasserie', amountCents: 190_000, reference: 'Compte exemple 001' }],
    attachments: [{ id: 'BANKDOC', label: 'Relevé de décembre', kind: 'bank' as const, documentId: 'BANK-DOCUMENT-2025', fileName: 'banque.pdf', mimeType: 'application/pdf' }],
    movableWealth: { amountCents: 450_000, note: 'Montant repris de l’annexe 05 contrôlée.', confirmed: true } };
  return { report, tax, closing };
}
describe('Préparation fiscale Fribourg, avec contrôles explicites', () => {
  it('reporte le bénéfice au code de l’activité choisie, uniquement pour la période vérifiée', () => {
    const { report, tax } = fixture();
    const main = buildFribourgTaxReport(report, tax);
    expect(main.ready).toBe(true); expect(main.taxableResultCents).toBe(90_000);
    expect(main.fields[0]).toMatchObject({ code: '1.210', amountCents: 90_000, ready: true });
    expect(buildFribourgTaxReport(report, { ...tax, activity: 'secondary' }).fields[0].code).toBe('1.220');
    const future = buildFribourgTaxReport({ ...report, year: 2026, generatedAt: '2027-02-01T12:00:00Z' }, tax);
    expect(future.mappingVerified).toBe(false); expect(future.fields.every(f => !f.code && !f.ready)).toBe(true);
  });
  it('conserve les centimes et les pertes, sans séparateur de milliers dans le presse-papiers', () => {
    expect(taxCopyValue(-123456)).toBe('-1234.56'); expect(taxCopyValue(0)).toBe('0.00');
    expect(() => taxCopyValue(NaN)).toThrow();
    const { report, tax } = fixture(); report.resultCents = -25_075; tax.reviewedBasis = taxBasisKey(report);
    expect(buildFribourgTaxReport(report, tax).fields[0].amountCents).toBe(-25_075);
  });
  it('ne déduit pas deux fois les cotisations déjà comptabilisées', () => {
    const { report, tax } = fixture();
    tax.attachments.push({ ...tax.attachments[0], id: 'SOCIAL', kind: 'social' as any, documentId: 'SOCIAL-DOCUMENT' });
    tax.corrections = [
      { id: 'AVS', kind: 'social', label: 'AVS enregistrée', amountCents: 12_000, treatment: 'included', note: 'Facture dans le journal.' },
      { id: 'SOLDE', kind: 'social', label: 'Solde restant', amountCents: 3_000, treatment: 'deduct', note: 'Solde non encore déduit.' },
      { id: 'PRIVE', kind: 'private-use', label: 'Bière privée', amountCents: 2_500, treatment: 'add', note: 'Prélèvement documenté.' }
    ];
    const result = buildFribourgTaxReport(report, tax);
    expect(result.correctionCents).toBe(-500); expect(result.taxableResultCents).toBe(89_500);
    expect(result.ready).toBe(true);
  });
  it('refuse un sens de correction incohérent et un ajustement compté deux fois', () => {
    const { report, tax } = fixture();
    tax.corrections = [{ id: 'PRIVE', kind: 'private-use', label: 'Usage privé', amountCents: 500, treatment: 'deduct', note: 'Erreur de sens.' }];
    expect(() => validateTaxClosing(tax)).toThrow('Sens');
    report.adjustments = [{ id: 'AJ', label: 'Correction déjà comptabilisée', amountCents: -500, note: 'Dans le résultat.' }];
    tax.corrections = [{ id: 'FISC', kind: 'other', label: 'Même correction', amountCents: 500, treatment: 'deduct', note: 'À vérifier.', sourceId: 'AJ' }];
    tax.reviewedBasis = taxBasisKey(report);
    expect(buildFribourgTaxReport(report, tax).missing.some(m => m.includes('déjà intégré'))).toBe(true);
  });
  it('invalide les vérifications après une modification des comptes, pas après une régénération identique', () => {
    const { report, tax } = fixture();
    expect(buildFribourgTaxReport({ ...report, generatedAt: '2026-03-15T10:00:00Z' }, tax).ready).toBe(true);
    const changed = buildFribourgTaxReport({ ...report, revenueCents: 100_001 }, tax);
    expect(changed.ready).toBe(false); expect(changed.reviews).toEqual({});
    expect(changed.missing.some(m => m.includes('comptes ont changé'))).toBe(true);
  });
  it('ne confond jamais patrimoine net comptable et fortune à déclarer', () => {
    const { report, tax } = fixture();
    const result = buildFribourgTaxReport(report, tax);
    expect(result.netAssetsCents).toBe(190_000); expect(result.fields[1].amountCents).toBe(450_000);
    const unconfirmed = buildFribourgTaxReport(report, { ...tax, movableWealth: undefined });
    expect(unconfirmed.fields[1]).toMatchObject({ amountCents: null, ready: false });
    expect(unconfirmed.fields[0].ready).toBe(true); // income can be completed independently
  });
  it('rapproche les soldes sans créer une recette ni une dépense et reclasse un découvert', () => {
    const { report, tax } = fixture();
    tax.balances[0].amountCents = 189_000;
    expect(buildFribourgTaxReport(report, tax)).toMatchObject({ cashDifferenceCents: -1000, ready: false, taxableResultCents: 90_000 });
    report.cashCents = -1_500; tax.balances[0].amountCents = -1_500; tax.reviewedBasis = taxBasisKey(report);
    expect(buildFribourgTaxReport(report, tax)).toMatchObject({ cashDifferenceCents: 0, totalAssetsCents: 0, totalLiabilitiesCents: 1_500, netAssetsCents: -1_500 });
  });
  it('ajoute seulement les prêts absents du journal et exige leur identité', () => {
    const { report, tax } = fixture();
    tax.balances.push({ id: 'LOAN', kind: 'loan' as any, label: 'Prêteur', amountCents: 10_000, reference: 'Contrat 01' });
    const unready = buildFribourgTaxReport(report, tax);
    expect(unready.totalLiabilitiesCents).toBe(10_000); expect(unready.missing.some(m => m.includes('adresse du créancier'))).toBe(true);
  });
  it('sépare les factures ouvertes au 31 décembre des paiements de l’année suivante', () => {
    const { closing } = fixture();
    const report = buildAnnualReport({ year: 2025, transactions, payments: payments.map(p => ({ ...p, date: '2026-01-05' })), assets: [], profile, closing, generatedAt: '2026-02-01T12:00:00Z' });
    expect(report.resultCents).toBe(90_000); expect(report.cashCents).toBe(100_000);
    expect(report.outstanding).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'VENTE', amountCents: 100_000, direction: 'in' }), expect.objectContaining({ id: 'MALT', amountCents: 10_000, direction: 'out' })]));
    expect(report.receivablesCents).toBe(100_000); expect(report.payablesCents).toBe(10_000);
  });
  it('conserve les justificatifs anciens nécessaires aux immobilisations sans les remettre en charges', () => {
    const { closing } = fixture(); const old = { ...tx('CUVE', 'expense', 100_000), date: '2024-02-01' };
    const report = buildAnnualReport({ year: 2025, transactions: [...transactions, old], payments: [...payments, { ...payments[1], id: 'OLD-PAY', transactionId: old.id, date: old.date, amountCents: 100_000 }], profile, closing, generatedAt: '2026-02-01T12:00:00Z', assets: [{ id: 'ASSET', name: 'Cuve', transactionId: old.id, acquisitionDate: old.date, inServiceDate: old.date, acquisitionCents: 100_000, businessUsePct: 100, category: 'tanks', method: 'declining', ratePct: 20, openingYear: 2025, openingValueCents: 80_000, openingConfirmed: true, firstYearFraction: 1 }] });
    expect(report.supportingDocuments?.map(r => r.id)).toContain('CUVE');
    expect(report.documents.map(r => r.id)).not.toContain('CUVE');
    expect(report.operatingExpensesCents).toBe(10_000); expect(report.depreciationCents).toBe(16_000);
  });
  it('ne marque jamais une année en cours, la TVA ou des inventaires incomplets comme prêts', () => {
    const { report, tax } = fixture();
    expect(buildFribourgTaxReport({ ...report, generatedAt: '2025-12-31T20:00:00Z' }, tax).missing.some(m => m.includes('Exercice en cours'))).toBe(true);
    const vat = buildAnnualReport({ year: 2025, transactions, payments, assets: [], profile: { ...profile, vatRegistered: true }, closing: { ...fixture().closing, tax } });
    expect(vat.tax?.ready).toBe(false); expect(vat.tax?.missing.some(m => m.includes('assujettie'))).toBe(true);
    report.resultCents = null; expect(buildFribourgTaxReport(report, tax).fields[0].ready).toBe(false);
  });
  it('ne plante pas sur un ancien complément fiscal invalide', () => {
    const { report } = fixture(); const result = buildFribourgTaxReport(report, { version: 8 } as any);
    expect(result.ready).toBe(false); expect(result.fields[0].ready).toBe(false);
  });
});
